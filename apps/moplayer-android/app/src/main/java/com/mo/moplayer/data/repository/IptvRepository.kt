package com.mo.moplayer.data.repository

import android.content.Context
import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.PagingData
import androidx.room.withTransaction
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.mo.moplayer.data.local.dao.*
import com.mo.moplayer.data.local.MoPlayerDatabase
import com.mo.moplayer.data.local.entity.*
import com.mo.moplayer.data.parser.M3uParser
import com.mo.moplayer.data.remote.api.XtreamApi
import com.mo.moplayer.data.remote.dto.AuthResponse
import com.mo.moplayer.data.remote.dto.EpisodeDto
import com.mo.moplayer.data.remote.dto.SeriesInfoResponse
import com.mo.moplayer.data.remote.dto.SeriesDto
import com.mo.moplayer.data.remote.dto.VodStreamDto
import com.mo.moplayer.data.util.ImageUrlNormalizer
import com.mo.moplayer.data.util.ProviderSourceUrlParser
import com.mo.moplayer.util.ContentSnapshot
import com.mo.moplayer.util.CredentialManager
import com.mo.moplayer.util.Resource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

data class CachedSeriesDetails(
    val series: SeriesEntity,
    val episodes: List<EpisodeEntity>
)

@Singleton
class IptvRepository @Inject constructor(
    private val xtreamApi: XtreamApi,
    private val serverDao: ServerDao,
    private val categoryDao: CategoryDao,
    private val channelDao: ChannelDao,
    private val movieDao: MovieDao,
    private val seriesDao: SeriesDao,
    private val favoriteDao: FavoriteDao,
    private val watchHistoryDao: WatchHistoryDao,
    private val epgDao: EpgDao,
    private val serverSyncStateDao: ServerSyncStateDao,
    private val contentSearchDao: ContentSearchDao,
    private val m3uParser: M3uParser,
    private val database: MoPlayerDatabase,
    private val credentialManager: CredentialManager
) {
    companion object {
        private const val M3U_IMPORT_BATCH_SIZE = 400
        private const val API_IMPORT_BATCH_SIZE = 500
        private const val SEARCH_REBUILD_PAGE_SIZE = 800
    }

    internal fun normalizeImageUrl(raw: String?): String? = ImageUrlNormalizer.normalize(raw)

    private fun contentSearchEntity(
        serverId: Long,
        contentType: String,
        contentId: String,
        title: String,
        subtitle: String?,
        posterUrl: String?
    ): ContentSearchEntity {
        val uniqueId = "$serverId:$contentType:$contentId"
        return ContentSearchEntity(
            rowId = stableSearchRowId(uniqueId),
            uniqueId = uniqueId,
            serverId = serverId,
            contentId = contentId,
            contentType = contentType,
            title = title,
            subtitle = subtitle,
            posterUrl = normalizeImageUrl(posterUrl)
        )
    }

    private fun stableSearchRowId(value: String): Long {
        var hash = -3750763034362895579L // FNV-1a 64-bit offset basis as signed Long.
        value.toByteArray(Charsets.UTF_8).forEach { byte ->
            hash = hash xor (byte.toLong() and 0xffL)
            hash *= 1099511628211L
        }
        val positive = hash and Long.MAX_VALUE
        return if (positive == 0L) 1L else positive
    }
    
    // Server operations
    fun getActiveServer(): Flow<ServerEntity?> = serverDao.getActiveServerFlow()
    
    suspend fun getActiveServerSync(): ServerEntity? = serverDao.getActiveServer()
    
    fun getAllServers(): Flow<List<ServerEntity>> = serverDao.getAllServers()

    // Watch History / Continue Watching
    fun getContinueWatching(limit: Int = 10): Flow<List<WatchHistoryEntity>> = 
        watchHistoryDao.getContinueWatching(limit)

    suspend fun getRandomMovie(serverId: Long): MovieEntity? = movieDao.getRandomMovie(serverId)
    
    suspend fun authenticateXtream(
        serverUrl: String,
        username: String,
        password: String,
        context: Context? = null
    ): Resource<AuthResponse> = withContext(Dispatchers.IO) {
        try {
            val apiUrl = buildApiUrl(serverUrl)
            val response = xtreamApi.authenticate(apiUrl, username, password)
            
            if (response.isSuccessful) {
                val authResponse = response.body()
                
                if (authResponse != null && authResponse.userInfo?.auth == 1) {
                    Resource.Success(authResponse)
                } else {
                    Resource.Error("Authentication failed: ${authResponse?.userInfo?.message ?: "Invalid credentials"}")
                }
            } else {
                Resource.Error("Server error: ${response.code()}")
            }
        } catch (e: Exception) {
            Resource.Error("Connection error: ${e.message}")
        }
    }
    
    suspend fun saveServer(
        name: String,
        serverUrl: String,
        username: String,
        password: String,
        serverType: String,
        authResponse: AuthResponse? = null,
        preferredOutputFormat: String? = null
    ): Long = withContext(Dispatchers.IO) {
        val server = ServerEntity(
            name = name,
            serverUrl = serverUrl,
            // Store empty strings in Room — real credentials go to EncryptedSharedPreferences
            username = "",
            password = "",
            serverType = serverType,
            isActive = true,
            serverInfo = buildServerInfoJson(authResponse, preferredOutputFormat),
            expirationDate = authResponse?.userInfo?.expDate,
            maxConnections = authResponse?.userInfo?.maxConnections?.toIntOrNull(),
            activeConnections = authResponse?.userInfo?.activeConnections?.toIntOrNull()
        )
        serverDao.deactivateAllServers()
        val serverId = serverDao.insertServer(server)
        serverSyncStateDao.upsert(ServerSyncStateEntity(serverId = serverId))
        // Save credentials securely
        credentialManager.saveCredentials(serverId, username, password)
        serverId
    }
    
    suspend fun setActiveServer(serverId: Long) = withContext(Dispatchers.IO) {
        serverDao.deactivateAllServers()
        serverDao.activateServer(serverId)
    }

    /**
     * Re-authenticate the active Xtream source and refresh its stored subscription window
     * (expiry date, account status, connection counts). Content sync alone never re-auths, so
     * without this a RENEWED account would stay stuck showing "expired", and a lapsed one would
     * never start warning. Failures are swallowed so a transient network blip never corrupts the
     * cached values. Returns true if the stored info was refreshed.
     */
    suspend fun refreshActiveServerSubscription(): Boolean = withContext(Dispatchers.IO) {
        val server = serverDao.getActiveServer() ?: return@withContext false
        if (!server.serverType.equals("xtream", ignoreCase = true) || server.serverUrl.isBlank()) {
            return@withContext false
        }
        val (username, password) = resolveCredentials(server)
        if (username.isBlank()) return@withContext false
        when (val auth = authenticateXtream(server.serverUrl, username, password)) {
            is Resource.Success -> {
                val info = auth.data
                if (info?.userInfo?.auth == 1) {
                    val preferred = existingPreferredOutputFormat(server.serverInfo)
                    serverDao.updateServer(
                        server.copy(
                            serverInfo = buildServerInfoJson(info, preferred),
                            expirationDate = info.userInfo?.expDate ?: server.expirationDate,
                            maxConnections = info.userInfo?.maxConnections?.toIntOrNull() ?: server.maxConnections,
                            activeConnections = info.userInfo?.activeConnections?.toIntOrNull() ?: server.activeConnections
                        )
                    )
                    true
                } else false
            }
            else -> false
        }
    }

    private fun existingPreferredOutputFormat(serverInfo: String?): String? {
        val json = serverInfo?.takeIf { it.isNotBlank() } ?: return null
        return runCatching {
            com.google.gson.JsonParser.parseString(json).asJsonObject
                .get("preferred_output_format")?.asString?.takeIf { it.isNotBlank() }
        }.getOrNull()
    }
    
    suspend fun deleteServer(serverId: Long) = withContext(Dispatchers.IO) {
        contentSearchDao.deleteByServer(serverId)
        serverSyncStateDao.deleteByServer(serverId)
        serverDao.deleteServerById(serverId)
        // Clean up encrypted credentials
        credentialManager.deleteCredentials(serverId)
    }

    suspend fun switchActiveServer(serverId: Long, prewarm: Boolean): Resource<ServerEntity> =
        withContext(Dispatchers.IO) {
            val server = serverDao.getServerById(serverId)
                ?: return@withContext Resource.Error("Server not found")

            serverDao.deactivateAllServers()
            serverDao.activateServer(serverId)

            if (prewarm) {
                // Lightweight prewarm: ensure search index exists for active server.
                if (contentSearchDao.countByServer(serverId) == 0) {
                    rebuildSearchIndex(serverId)
                }
            }

            Resource.Success(server.copy(isActive = true))
        }

    suspend fun syncActiveServer(syncMode: SyncMode): Resource<ServerSyncStateEntity> =
        withContext(Dispatchers.IO) {
            val server = getActiveServerSync()
                ?: return@withContext Resource.Error("No active server selected")

            val startedAt = System.currentTimeMillis()
            upsertSyncState(server.id, status = "RUNNING", error = null, durationMs = 0L)

            try {
                // Refresh subscription window first so a renewed/lapsed account is reflected
                // (content sync alone never re-authenticates).
                runCatching { refreshActiveServerSubscription() }
                when (syncMode) {
                    SyncMode.FULL -> {
                        requireSyncSuccess("categories", fetchAndSaveCategories(server))
                        requireSyncSuccess("channels", fetchAndSaveChannels(server))
                        requireSyncSuccess("movies", fetchAndSaveMovies(server))
                        requireSyncSuccess("series", fetchAndSaveSeries(server))
                        fetchEpgForAllChannels(server)
                    }
                    SyncMode.DELTA -> {
                        // Delta endpoints are not available on all providers.
                        // Fallback to efficient batched refresh for each content type.
                        requireSyncSuccess("channels", fetchAndSaveChannels(server))
                        requireSyncSuccess("movies", fetchAndSaveMovies(server))
                        requireSyncSuccess("series", fetchAndSaveSeries(server))
                    }
                    SyncMode.EPG_ONLY -> {
                        fetchEpgForAllChannels(server)
                    }
                }

                val duration = System.currentTimeMillis() - startedAt
                val state = upsertSyncState(
                    serverId = server.id,
                    status = "SUCCESS",
                    error = null,
                    durationMs = duration
                )
                compactSearchIndexIfNeeded(server.id, state)
                Resource.Success(state)
            } catch (e: Exception) {
                val duration = System.currentTimeMillis() - startedAt
                val state = upsertSyncState(
                    serverId = server.id,
                    status = "ERROR",
                    error = e.message,
                    durationMs = duration
                )
                Resource.Error(e.message ?: "Sync failed", state)
            }
        }

    suspend fun resolvePlayableByFavorite(favoriteId: Long): PlayableRef? =
        withContext(Dispatchers.IO) {
            val favorite = favoriteDao.getFavoriteById(favoriteId) ?: return@withContext null
            when (favorite.contentType.lowercase(Locale.ROOT)) {
                "channel" -> {
                    val channel = channelDao.getChannelById(favorite.contentId) ?: return@withContext null
                    PlayableRef(
                        type = UnifiedContentType.CHANNEL,
                        contentId = channel.channelId,
                        streamUrl = channel.streamUrl,
                        title = channel.name,
                        posterUrl = normalizeImageUrl(channel.streamIcon),
                        extras = mapOf("serverId" to channel.serverId.toString())
                    )
                }
                "movie" -> {
                    val movie = movieDao.getMovieById(favorite.contentId) ?: return@withContext null
                    PlayableRef(
                        type = UnifiedContentType.MOVIE,
                        contentId = movie.movieId,
                        streamUrl = movie.streamUrl,
                        title = movie.name,
                        posterUrl = normalizeImageUrl(movie.streamIcon),
                        extras = mapOf("serverId" to movie.serverId.toString())
                    )
                }
                "series" -> {
                    val episode = seriesDao.getFirstEpisode(favorite.contentId) ?: return@withContext null
                    PlayableRef(
                        type = UnifiedContentType.EPISODE,
                        contentId = episode.episodeId,
                        streamUrl = episode.streamUrl,
                        title = episode.title ?: favorite.name,
                        posterUrl = normalizeImageUrl(favorite.iconUrl),
                        extras = mapOf("seriesId" to episode.seriesId)
                    )
                }
                else -> null
            }
        }

    suspend fun searchUnified(
        query: String,
        filters: UnifiedSearchFilters = UnifiedSearchFilters(),
        serverScope: ServerScope = ServerScope.ACTIVE,
        limit: Int = 100
    ): List<UnifiedSearchHit> = withContext(Dispatchers.IO) {
        val cleanQuery = query.trim()
        if (cleanQuery.isEmpty()) return@withContext emptyList()

        val serverIds = when (serverScope) {
            ServerScope.ACTIVE -> listOfNotNull(serverDao.getActiveServer()?.id)
            ServerScope.ALL -> serverDao.getAllServersSync().map { it.id }
        }
        if (serverIds.isEmpty()) return@withContext emptyList()

        val ftsQuery = buildFtsQuery(cleanQuery)
        val indexedResults = mutableListOf<UnifiedSearchHit>()

        for (serverId in serverIds) {
            val fromFts = runCatching {
                contentSearchDao.searchFtsByServer(serverId, ftsQuery, limit)
            }.getOrElse {
                contentSearchDao.searchLikeByServer(serverId, cleanQuery, limit)
            }

            indexedResults += fromFts.mapNotNull { row ->
                val type = row.contentType.toUnifiedTypeOrNull() ?: return@mapNotNull null
                if (!filters.accepts(type)) return@mapNotNull null
                UnifiedSearchHit(
                    serverId = row.serverId,
                    contentType = type,
                    contentId = row.contentId,
                    title = row.title,
                    subtitle = row.subtitle,
                    posterUrl = row.posterUrl
                )
            }
        }

        val extras = mutableListOf<UnifiedSearchHit>()
        if (filters.includeFavorites) {
            serverIds.forEach { serverId ->
                extras += favoriteDao.searchFavorites(serverId, cleanQuery, limit).map {
                    UnifiedSearchHit(
                        serverId = it.serverId,
                        contentType = UnifiedContentType.FAVORITE,
                        contentId = it.contentId,
                        title = it.name,
                        posterUrl = it.iconUrl
                    )
                }
            }
        }

        if (filters.includeHistory) {
            extras += watchHistoryDao.searchHistoryNow(cleanQuery, limit).map {
                UnifiedSearchHit(
                    serverId = 0L,
                    contentType = UnifiedContentType.HISTORY,
                    contentId = it.contentId,
                    title = it.name,
                    posterUrl = it.posterUrl
                )
            }
        }

        (indexedResults + extras)
            .distinctBy { "${it.contentType}:${it.contentId}:${it.serverId}" }
            .sortedByDescending { scoreSearchHit(it, cleanQuery) }
            .take(limit)
    }
    
    // Categories
    fun getLiveCategories(serverId: Long): Flow<List<CategoryEntity>> = 
        categoryDao.getCategoriesByType(serverId, "live")
    
    fun getMovieCategories(serverId: Long): Flow<List<CategoryEntity>> = 
        categoryDao.getCategoriesByType(serverId, "movie")
    
    fun getSeriesCategories(serverId: Long): Flow<List<CategoryEntity>> = 
        categoryDao.getCategoriesByType(serverId, "series")
    
    suspend fun fetchAndSaveCategories(server: ServerEntity): Resource<Unit> = withContext(Dispatchers.IO) {
        try {
            val apiUrl = buildApiUrl(server.serverUrl)
            val (username, password) = resolveCredentials(server)
            
            // Fetch live categories
            val liveResponse = xtreamApi.getLiveCategories(apiUrl, username, password)
            if (liveResponse.isSuccessful) {
                val categories = liveResponse.body()?.mapIndexed { index, dto ->
                    CategoryEntity(
                        categoryId = "${server.id}_live_${dto.categoryId}",
                        serverId = server.id,
                        originalId = dto.categoryId ?: "",
                        name = dto.categoryName ?: "Unknown",
                        type = "live",
                        parentId = dto.parentId?.toString(),
                        sortOrder = index
                    )
                } ?: emptyList()
                if (categories.isNotEmpty()) {
                    categoryDao.insertCategories(categories)
                }
            }
            
            // Fetch movie categories
            val vodResponse = xtreamApi.getVodCategories(apiUrl, username, password)
            if (vodResponse.isSuccessful) {
                val categories = vodResponse.body()?.mapIndexed { index, dto ->
                    CategoryEntity(
                        categoryId = "${server.id}_movie_${dto.categoryId}",
                        serverId = server.id,
                        originalId = dto.categoryId ?: "",
                        name = dto.categoryName ?: "Unknown",
                        type = "movie",
                        parentId = dto.parentId?.toString(),
                        sortOrder = index
                    )
                } ?: emptyList()
                if (categories.isNotEmpty()) {
                    categoryDao.insertCategories(categories)
                }
            }
            
            // Fetch series categories
            val seriesResponse = xtreamApi.getSeriesCategories(apiUrl, username, password)
            if (seriesResponse.isSuccessful) {
                val categories = seriesResponse.body()?.mapIndexed { index, dto ->
                    CategoryEntity(
                        categoryId = "${server.id}_series_${dto.categoryId}",
                        serverId = server.id,
                        originalId = dto.categoryId ?: "",
                        name = dto.categoryName ?: "Unknown",
                        type = "series",
                        parentId = dto.parentId?.toString(),
                        sortOrder = index
                    )
                } ?: emptyList()
                if (categories.isNotEmpty()) {
                    categoryDao.insertCategories(categories)
                }
            }
            
            Resource.Success(Unit)
        } catch (e: Exception) {
            Resource.Error("Failed to fetch categories: ${e.message}")
        }
    }
    
    // Channels
    fun getAllChannels(serverId: Long): Flow<List<ChannelEntity>> = 
        channelDao.getAllChannels(serverId)

    fun getAllChannelsLimited(serverId: Long, limit: Int): Flow<List<ChannelEntity>> =
        channelDao.getAllChannelsLimited(serverId, limit)
    
    fun getChannelsByCategory(serverId: Long, categoryId: String): Flow<List<ChannelEntity>> =
        channelDao.getChannelsByCategory(serverId, categoryId)

    fun getChannelsByCategoryLimited(serverId: Long, categoryId: String, limit: Int): Flow<List<ChannelEntity>> =
        channelDao.getChannelsByCategoryLimited(serverId, categoryId, limit)

    fun getRecentlyAddedChannels(serverId: Long, limit: Int = 30): Flow<List<ChannelEntity>> =
        channelDao.getRecentlyAddedChannels(serverId, limit)
    
    fun searchChannels(serverId: Long, query: String): Flow<List<ChannelEntity>> =
        channelDao.searchChannels(serverId, query)
    
    suspend fun fetchAndSaveChannels(server: ServerEntity): Resource<Int> = withContext(Dispatchers.IO) {
        try {
            val apiUrl = buildApiUrl(server.serverUrl)
            val (username, password) = resolveCredentials(server)
            val response = xtreamApi.getLiveStreams(apiUrl, username, password)
            
            if (response.isSuccessful) {
                val dtos = response.body().orEmpty()
                if (dtos.isEmpty()) {
                    return@withContext Resource.Success(channelDao.getChannelCount(server.id))
                }

                val batchSize = API_IMPORT_BATCH_SIZE
                val buffer = ArrayList<ChannelEntity>(batchSize)
                val searchBuffer = ArrayList<ContentSearchEntity>(batchSize)
                var inserted = 0
                val seenIds = HashSet<String>(dtos.size)

                for (dto in dtos) {
                    val streamId = dto.streamId ?: continue
                    val channelId = "${server.id}_$streamId"
                    seenIds.add(channelId)
                    val name = dto.name ?: "Unknown"
                    val categoryId = dto.categoryId?.let { "${server.id}_live_$it" }
                    buffer.add(
                        ChannelEntity(
                            channelId = channelId,
                            serverId = server.id,
                            streamId = streamId,
                            name = name,
                            streamUrl = dto.directSource?.takeIf { it.isNotBlank() }
                                ?: buildStreamUrl(server, streamId, "live"),
                            streamIcon = normalizeImageUrl(dto.streamIcon),
                            categoryId = categoryId,
                            epgChannelId = dto.epgChannelId,
                            tvArchive = dto.tvArchive == 1,
                            tvArchiveDuration = dto.tvArchiveDuration ?: 0,
                            isAdult = dto.isAdult == "1",
                            addedAt = parseTimestamp(dto.added),
                            customOrder = dto.num ?: 0
                        )
                    )
                    searchBuffer.add(
                        contentSearchEntity(
                            serverId = server.id,
                            contentType = "channel",
                            contentId = channelId,
                            title = name,
                            subtitle = categoryId,
                            posterUrl = dto.streamIcon
                        )
                    )

                    if (buffer.size >= batchSize) {
                        database.withTransaction {
                            channelDao.insertChannels(buffer)
                            contentSearchDao.upsertAll(searchBuffer)
                        }
                        inserted += buffer.size
                        buffer.clear()
                        searchBuffer.clear()
                    }
                }

                if (buffer.isNotEmpty()) {
                    database.withTransaction {
                        channelDao.insertChannels(buffer)
                        contentSearchDao.upsertAll(searchBuffer)
                    }
                    inserted += buffer.size
                }

                // The live-streams endpoint returns the full catalogue in one response, so any
                // local channel missing from it has been removed upstream. Safe to prune here
                // because we already returned early on an empty/failed response above.
                pruneStaleContent(channelDao.getChannelIds(server.id), seenIds, "channels") { stale ->
                    channelDao.deleteChannelsByIds(stale)
                    contentSearchDao.deleteByContentIds(server.id, stale)
                }

                Resource.Success(inserted)
            } else {
                Resource.Error("Failed to fetch channels: ${response.code()}")
            }
        } catch (e: Exception) {
            Resource.Error("Error fetching channels: ${e.message}")
        }
    }

    /**
     * Remove locally cached items whose ids are no longer present on the server, so the library
     * stays in sync as content is taken down — without ever wiping a healthy cache.
     *
     * Callers must only invoke this after a *complete, successful* fetch of the content type
     * (a non-empty response for channels; all category requests succeeding for VOD/series).
     * A safety net additionally refuses to delete more than half of a sizeable catalogue in a
     * single pass, so a truncated-but-"successful" provider response can never empty the library.
     */
    private suspend fun pruneStaleContent(
        existingIds: List<String>,
        seenIds: Set<String>,
        label: String,
        delete: suspend (List<String>) -> Unit
    ) {
        if (seenIds.isEmpty() || existingIds.isEmpty()) return
        val stale = existingIds.filterNot { seenIds.contains(it) }
        if (stale.isEmpty()) return
        if (existingIds.size > 200 && stale.size > existingIds.size / 2) {
            android.util.Log.w(
                "IptvRepository",
                "Skipping $label prune: ${stale.size}/${existingIds.size} look stale (suspicious truncation)"
            )
            return
        }
        stale.chunked(400).forEach { chunk ->
            database.withTransaction {
                delete(chunk)
            }
        }
        android.util.Log.d("IptvRepository", "Pruned ${stale.size} stale $label")
    }

    // Movies
    fun getAllMovies(serverId: Long): Flow<List<MovieEntity>> = movieDao.getAllMovies(serverId)
    
    fun getMoviesByCategory(serverId: Long, categoryId: String): Flow<List<MovieEntity>> =
        movieDao.getMoviesByCategory(serverId, categoryId)
    
    fun getRecentlyAddedMovies(serverId: Long, limit: Int = 30): Flow<List<MovieEntity>> =
        movieDao.getRecentlyAddedMovies(serverId, limit)
    
    fun searchMovies(serverId: Long, query: String): Flow<List<MovieEntity>> =
        movieDao.searchMovies(serverId, query)
    
    // Movies with Pagination
    fun getMoviesPaginated(serverId: Long, categoryId: String?): Flow<PagingData<MovieEntity>> {
        return Pager(
            config = PagingConfig(
                pageSize = 50,
                prefetchDistance = 15,
                enablePlaceholders = false,
                initialLoadSize = 50
            ),
            pagingSourceFactory = {
                if (categoryId.isNullOrEmpty()) {
                    movieDao.getAllMoviesPaged(serverId)
                } else {
                    movieDao.getMoviesByCategoryPaged(serverId, categoryId)
                }
            }
        ).flow
    }
    
    suspend fun fetchAndSaveMovies(server: ServerEntity): Resource<Int> = withContext(Dispatchers.IO) {
        try {
            val apiUrl = buildApiUrl(server.serverUrl)
            val (username, password) = resolveCredentials(server)
            val categoryIds = getCategoryOriginalIds(server.id, "movie")
            var inserted = 0
            var successfulRequests = 0
            var firstError: String? = null
            val seenIds = HashSet<String>()

            val requests: List<String?> = if (categoryIds.isEmpty()) listOf(null) else categoryIds
            for (categoryId in requests) {
                try {
                    val response = xtreamApi.getVodStreams(apiUrl, username, password, categoryId = categoryId)
                    if (!response.isSuccessful) {
                        if (firstError == null) firstError = "HTTP ${response.code()}"
                        continue
                    }

                    successfulRequests += 1
                    val dtos = response.body().orEmpty()
                    inserted += insertMovieDtos(server, dtos)
                    dtos.forEach { d -> d.streamId?.let { seenIds.add("${server.id}_$it") } }

                    // Some panels ignore category_id and return the complete list. Insert it once and stop.
                    if (categoryId != null && responseLooksUnfiltered(dtos, categoryId) && dtos.size > API_IMPORT_BATCH_SIZE) {
                        break
                    }
                } catch (e: Exception) {
                    if (firstError == null) firstError = e.message ?: e.javaClass.simpleName
                }
            }

            // Only prune when every category request succeeded; a partial failure would make a
            // present-but-unfetched movie look "removed" and wrongly delete it.
            if (firstError == null && successfulRequests > 0 && seenIds.isNotEmpty()) {
                pruneStaleContent(movieDao.getMovieIds(server.id), seenIds, "movies") { stale ->
                    movieDao.deleteMoviesByIds(stale)
                    contentSearchDao.deleteByContentIds(server.id, stale)
                }
            }

            val existingCount = movieDao.getMovieCount(server.id)
            val result = when {
                inserted > 0 -> Resource.Success(inserted)
                existingCount > 0 -> Resource.Success(existingCount)
                successfulRequests == 0 -> Resource.Error("Failed to fetch movies: ${firstError ?: "no successful response"}")
                else -> Resource.Error("Failed to fetch movies: ${firstError ?: "empty response"}")
            }
            if (result is Resource.Success && (result.data ?: 0) > 0) {
                upsertSyncState(server.id, status = "SUCCESS", error = null, durationMs = 0L)
            }
            result
        } catch (e: Exception) {
            Resource.Error("Error fetching movies: ${e.message}")
        }
    }

    private suspend fun insertMovieDtos(server: ServerEntity, dtos: List<VodStreamDto>): Int {
        if (dtos.isEmpty()) return 0

        val buffer = ArrayList<MovieEntity>(API_IMPORT_BATCH_SIZE)
        val searchBuffer = ArrayList<ContentSearchEntity>(API_IMPORT_BATCH_SIZE)
        var inserted = 0

        suspend fun flush() {
            if (buffer.isEmpty()) return
            database.withTransaction {
                movieDao.insertMovies(buffer)
                contentSearchDao.upsertAll(searchBuffer)
            }
            inserted += buffer.size
            buffer.clear()
            searchBuffer.clear()
        }

        for (dto in dtos) {
            val streamId = dto.streamId ?: continue
            val movieId = "${server.id}_$streamId"
            val name = dto.name ?: "Unknown"
            val categoryId = dto.categoryId?.let { "${server.id}_movie_$it" }
            buffer.add(
                MovieEntity(
                    movieId = movieId,
                    serverId = server.id,
                    streamId = streamId,
                    name = name,
                    streamUrl = dto.directSource?.takeIf { it.isNotBlank() }
                        ?: buildStreamUrl(server, streamId, "movie", dto.containerExtension),
                    containerExtension = dto.containerExtension,
                    streamIcon = normalizeImageUrl(dto.streamIcon),
                    categoryId = categoryId,
                    rating = dto.rating5Based,
                    addedTimestamp = parseTimestamp(dto.added),
                    isAdult = dto.isAdult == "1"
                )
            )
            searchBuffer.add(
                contentSearchEntity(
                    serverId = server.id,
                    contentType = "movie",
                    contentId = movieId,
                    title = name,
                    subtitle = categoryId,
                    posterUrl = dto.streamIcon
                )
            )

            if (buffer.size >= API_IMPORT_BATCH_SIZE) {
                flush()
            }
        }

        flush()
        return inserted
    }
    
    suspend fun updateMovieProgress(movieId: String, position: Long) {
        movieDao.updateWatchProgress(movieId, position)
    }
    
    // Series
    fun getAllSeries(serverId: Long): Flow<List<SeriesEntity>> = seriesDao.getAllSeries(serverId)
    
    fun getSeriesByCategory(serverId: Long, categoryId: String): Flow<List<SeriesEntity>> =
        seriesDao.getSeriesByCategory(serverId, categoryId)
    
    fun getRecentlyAddedSeries(serverId: Long, limit: Int = 30): Flow<List<SeriesEntity>> =
        seriesDao.getRecentlyAddedSeries(serverId, limit)
    
    fun searchSeries(serverId: Long, query: String): Flow<List<SeriesEntity>> =
        seriesDao.searchSeries(serverId, query)
    
    // Series with Pagination
    fun getSeriesPaginated(serverId: Long, categoryId: String?): Flow<PagingData<SeriesEntity>> {
        return Pager(
            config = PagingConfig(
                pageSize = 50,
                prefetchDistance = 15,
                enablePlaceholders = false,
                initialLoadSize = 50
            ),
            pagingSourceFactory = {
                if (categoryId.isNullOrEmpty()) {
                    seriesDao.getAllSeriesPaged(serverId)
                } else {
                    seriesDao.getSeriesByCategoryPaged(serverId, categoryId)
                }
            }
        ).flow
    }
    
    suspend fun fetchAndSaveSeries(server: ServerEntity): Resource<Int> = withContext(Dispatchers.IO) {
        try {
            val apiUrl = buildApiUrl(server.serverUrl)
            val (username, password) = resolveCredentials(server)
            val categoryIds = getCategoryOriginalIds(server.id, "series")
            var inserted = 0
            var successfulRequests = 0
            var firstError: String? = null
            val seenIds = HashSet<String>()

            val requests: List<String?> = if (categoryIds.isEmpty()) listOf(null) else categoryIds
            for (categoryId in requests) {
                try {
                    val response = xtreamApi.getSeries(apiUrl, username, password, categoryId = categoryId)
                    if (!response.isSuccessful) {
                        if (firstError == null) firstError = "HTTP ${response.code()}"
                        continue
                    }

                    successfulRequests += 1
                    val dtos = response.body().orEmpty()
                    inserted += insertSeriesDtos(server, dtos)
                    dtos.forEach { d -> d.seriesId?.let { seenIds.add("${server.id}_$it") } }

                    // Some panels ignore category_id and return the complete list. Insert it once and stop.
                    if (categoryId != null && responseLooksUnfiltered(dtos, categoryId) && dtos.size > API_IMPORT_BATCH_SIZE) {
                        break
                    }
                } catch (e: Exception) {
                    if (firstError == null) firstError = e.message ?: e.javaClass.simpleName
                }
            }

            // Only prune when every category request succeeded (see movies above for why).
            if (firstError == null && successfulRequests > 0 && seenIds.isNotEmpty()) {
                pruneStaleContent(seriesDao.getSeriesIds(server.id), seenIds, "series") { stale ->
                    seriesDao.deleteEpisodesBySeriesIds(stale)
                    seriesDao.deleteSeriesByIds(stale)
                    contentSearchDao.deleteByContentIds(server.id, stale)
                }
            }

            val existingCount = seriesDao.getSeriesCount(server.id)
            val result = when {
                inserted > 0 -> Resource.Success(inserted)
                existingCount > 0 -> Resource.Success(existingCount)
                successfulRequests == 0 -> Resource.Error("Failed to fetch series: ${firstError ?: "no successful response"}")
                else -> Resource.Error("Failed to fetch series: ${firstError ?: "empty response"}")
            }
            if (result is Resource.Success && (result.data ?: 0) > 0) {
                upsertSyncState(server.id, status = "SUCCESS", error = null, durationMs = 0L)
            }
            result
        } catch (e: Exception) {
            Resource.Error("Error fetching series: ${e.message}")
        }
    }

    private suspend fun insertSeriesDtos(server: ServerEntity, dtos: List<SeriesDto>): Int {
        if (dtos.isEmpty()) return 0

        val buffer = ArrayList<SeriesEntity>(API_IMPORT_BATCH_SIZE)
        val searchBuffer = ArrayList<ContentSearchEntity>(API_IMPORT_BATCH_SIZE)
        var inserted = 0

        suspend fun flush() {
            if (buffer.isEmpty()) return
            database.withTransaction {
                seriesDao.insertSeries(buffer)
                contentSearchDao.upsertAll(searchBuffer)
            }
            inserted += buffer.size
            buffer.clear()
            searchBuffer.clear()
        }

        for (dto in dtos) {
            val seriesId = dto.seriesId ?: continue
            val localSeriesId = "${server.id}_$seriesId"
            val name = dto.name ?: "Unknown"
            val categoryId = dto.categoryId?.let { "${server.id}_series_$it" }
            buffer.add(
                SeriesEntity(
                    seriesId = localSeriesId,
                    serverId = server.id,
                    originalSeriesId = seriesId,
                    name = name,
                    cover = normalizeImageUrl(dto.cover),
                    categoryId = categoryId,
                    rating = dto.rating5Based,
                    plot = dto.plot,
                    cast = dto.cast,
                    director = dto.director,
                    genre = dto.genre,
                    releaseDate = dto.releaseDate ?: dto.releaseDateAlt,
                    lastModified = parseTimestamp(dto.lastModified),
                    backdrop = normalizeImageUrl(dto.backdropPath?.firstOrNull()),
                    youtubeTrailer = dto.youtubeTrailer,
                    tmdbId = dto.tmdbId,
                    isAdult = dto.isAdult == "1"
                )
            )
            searchBuffer.add(
                contentSearchEntity(
                    serverId = server.id,
                    contentType = "series",
                    contentId = localSeriesId,
                    title = name,
                    subtitle = categoryId,
                    posterUrl = dto.cover
                )
            )

            if (buffer.size >= API_IMPORT_BATCH_SIZE) {
                flush()
            }
        }

        flush()
        return inserted
    }

    private suspend fun getCategoryOriginalIds(serverId: Long, type: String): List<String> =
        categoryDao.getCategoriesByTypeOnce(serverId, type)
            .mapNotNull { category ->
                category.originalId.trim().takeIf { it.isNotEmpty() }
            }
            .distinct()

    private fun responseLooksUnfiltered(dtos: List<*>, requestedCategoryId: String): Boolean {
        val distinctCategoryIds = dtos.asSequence()
            .mapNotNull { dto ->
                when (dto) {
                    is VodStreamDto -> dto.categoryId
                    is SeriesDto -> dto.categoryId
                    else -> null
                }
            }
            .filter { it.isNotBlank() }
            .distinct()
            .take(2)
            .toList()

        if (distinctCategoryIds.isEmpty()) return false
        return distinctCategoryIds.size > 1 || distinctCategoryIds.firstOrNull() != requestedCategoryId
    }
    
    suspend fun getSeriesInfo(
        server: ServerEntity,
        seriesId: Int
    ): Resource<SeriesInfoResponse> = withContext(Dispatchers.IO) {
        try {
            val apiUrl = buildApiUrl(server.serverUrl)
            val (username, password) = resolveCredentials(server)
            val response = xtreamApi.getSeriesInfo(
                apiUrl, 
                username, 
                password, 
                seriesId = seriesId
            )
            
            if (response.isSuccessful && response.body() != null) {
                Resource.Success(response.body()!!)
            } else {
                Resource.Error("Failed to fetch series info: ${response.code()}")
            }
        } catch (e: Exception) {
            Resource.Error("Error: ${e.message}")
        }
    }

    suspend fun refreshMovieDetails(movie: MovieEntity): Resource<MovieEntity> = withContext(Dispatchers.IO) {
        try {
            val server = serverDao.getServerById(movie.serverId)
                ?: return@withContext Resource.Error("Server not found")
            if (!server.serverType.equals("xtream", ignoreCase = true)) {
                return@withContext Resource.Success(movie)
            }

            val apiUrl = buildApiUrl(server.serverUrl)
            val (username, password) = resolveCredentials(server)
            val response = xtreamApi.getVodInfo(apiUrl, username, password, vodId = movie.streamId)
            if (!response.isSuccessful) {
                return@withContext Resource.Error("Failed to fetch movie details: ${response.code()}")
            }

            val body = response.body() ?: return@withContext Resource.Success(movie)
            val info = body.info
            val movieData = body.movieData
            val streamId = movieData?.streamId ?: movie.streamId
            val extension = firstNonBlank(movieData?.containerExtension, movie.containerExtension)
            val directSource = movieData?.directSource?.takeIf { it.isNotBlank() }
            val releaseDate = firstNonBlank(info?.releaseDate, info?.releaseDateAlt, movie.releaseDate)
            val poster = normalizeImageUrl(firstNonBlank(info?.movieImage, movie.streamIcon)) ?: movie.streamIcon
            val backdrop = normalizeImageUrl(info?.backdropPath?.firstOrNull()) ?: movie.backdrop

            val enriched = movie.copy(
                streamId = streamId,
                name = firstNonBlank(info?.name, movieData?.name, movie.name) ?: movie.name,
                streamUrl = directSource ?: buildStreamUrl(server, streamId, "movie", extension),
                containerExtension = extension,
                streamIcon = poster,
                categoryId = movieData?.categoryId?.takeIf { it.isNotBlank() }?.let { "${server.id}_movie_$it" }
                    ?: movie.categoryId,
                rating = parseRating(info?.rating) ?: movie.rating,
                plot = firstNonBlank(info?.plot, movie.plot),
                cast = firstNonBlank(info?.cast, movie.cast),
                director = firstNonBlank(info?.director, movie.director),
                genre = firstNonBlank(info?.genre, movie.genre),
                releaseDate = releaseDate,
                year = movie.year ?: releaseDate?.takeIf { it.length >= 4 }?.take(4),
                duration = firstNonBlank(info?.duration, movie.duration),
                durationSeconds = info?.durationSecs ?: movie.durationSeconds,
                backdrop = backdrop,
                youtubeTrailer = firstNonBlank(info?.youtubeTrailer, movie.youtubeTrailer),
                tmdbId = info?.tmdbId ?: movie.tmdbId,
                addedTimestamp = movieData?.added?.takeIf { it.isNotBlank() }?.let { parseTimestamp(it) }
                    ?: movie.addedTimestamp
            )

            movieDao.updateMovie(enriched)
            contentSearchDao.upsertAll(
                listOf(
                    contentSearchEntity(
                        serverId = server.id,
                        contentType = "movie",
                        contentId = enriched.movieId,
                        title = enriched.name,
                        subtitle = enriched.categoryId,
                        posterUrl = enriched.streamIcon
                    )
                )
            )
            Resource.Success(enriched)
        } catch (e: Exception) {
            Resource.Error("Error fetching movie details: ${e.message}")
        }
    }

    suspend fun refreshSeriesDetails(
        series: SeriesEntity,
        force: Boolean = false
    ): Resource<CachedSeriesDetails> = withContext(Dispatchers.IO) {
        try {
            val cachedEpisodes = seriesDao.getEpisodes(series.seriesId).first()
            val server = serverDao.getServerById(series.serverId)
                ?: return@withContext Resource.Error("Server not found")
            if (!server.serverType.equals("xtream", ignoreCase = true)) {
                return@withContext Resource.Success(CachedSeriesDetails(series, cachedEpisodes))
            }
            if (!force && cachedEpisodes.isNotEmpty() && hasUsefulSeriesDetails(series)) {
                return@withContext Resource.Success(CachedSeriesDetails(series, cachedEpisodes))
            }

            when (val result = getSeriesInfo(server, series.originalSeriesId)) {
                is Resource.Success -> {
                    val response = result.data ?: return@withContext Resource.Success(
                        CachedSeriesDetails(series, cachedEpisodes)
                    )
                    val info = response.info
                    val releaseDate = firstNonBlank(info?.releaseDate, info?.releaseDateAlt, series.releaseDate)
                    val enriched = series.copy(
                        name = firstNonBlank(info?.name, series.name) ?: series.name,
                        cover = normalizeImageUrl(firstNonBlank(info?.cover, series.cover)) ?: series.cover,
                        plot = firstNonBlank(info?.plot, series.plot),
                        cast = firstNonBlank(info?.cast, series.cast),
                        director = firstNonBlank(info?.director, series.director),
                        genre = firstNonBlank(info?.genre, series.genre),
                        releaseDate = releaseDate,
                        lastModified = series.lastModified,
                        rating = info?.rating5Based ?: parseRating(info?.rating) ?: series.rating,
                        backdrop = normalizeImageUrl(info?.backdropPath?.firstOrNull()) ?: series.backdrop,
                        youtubeTrailer = firstNonBlank(info?.youtubeTrailer, series.youtubeTrailer),
                        tmdbId = info?.tmdbId ?: series.tmdbId
                    )

                    val episodes = buildEpisodeEntities(server, enriched, response.episodes, cachedEpisodes)
                    seriesDao.updateSeries(enriched)
                    if (episodes.isNotEmpty()) {
                        seriesDao.deleteEpisodes(enriched.seriesId)
                        episodes.chunked(API_IMPORT_BATCH_SIZE).forEach { seriesDao.insertEpisodes(it) }
                    }
                    contentSearchDao.upsertAll(
                        listOf(
                            contentSearchEntity(
                                serverId = server.id,
                                contentType = "series",
                                contentId = enriched.seriesId,
                                title = enriched.name,
                                subtitle = enriched.categoryId,
                                posterUrl = enriched.cover
                            )
                        )
                    )

                    Resource.Success(CachedSeriesDetails(enriched, episodes.ifEmpty { cachedEpisodes }))
                }
                is Resource.Error -> {
                    if (cachedEpisodes.isNotEmpty()) {
                        Resource.Success(CachedSeriesDetails(series, cachedEpisodes))
                    } else {
                        Resource.Error(result.message ?: "Failed to fetch series details")
                    }
                }
                is Resource.Loading -> Resource.Loading()
            }
        } catch (e: Exception) {
            Resource.Error("Error fetching series details: ${e.message}")
        }
    }
    
    // Favorites
    fun getAllFavorites(serverId: Long): Flow<List<FavoriteEntity>> = 
        favoriteDao.getAllFavorites(serverId)
    
    fun isFavorite(serverId: Long, contentId: String): Flow<Boolean> =
        favoriteDao.isFavorite(serverId, contentId)
    
    suspend fun toggleFavorite(
        serverId: Long,
        contentId: String,
        contentType: String,
        name: String,
        iconUrl: String? = null
    ): Boolean = withContext(Dispatchers.IO) {
        val existing = favoriteDao.getFavorite(serverId, contentId)
        if (existing != null) {
            favoriteDao.removeFavorite(serverId, contentId)
            false
        } else {
            val favorite = FavoriteEntity(
                serverId = serverId,
                contentId = contentId,
                contentType = contentType,
                name = name,
                iconUrl = normalizeImageUrl(iconUrl)
            )
            favoriteDao.addFavorite(favorite)
            true
        }
    }
    
    // EPG Operations
    suspend fun getCurrentProgram(streamId: Int, serverId: Long): EpgEntity? {
        return epgDao.getCurrentProgram(streamId, serverId)
    }
    
    suspend fun getNextProgram(streamId: Int, serverId: Long): EpgEntity? {
        return epgDao.getNextProgram(streamId, serverId)
    }
    
    suspend fun getUpcomingPrograms(streamId: Int, serverId: Long, limit: Int = 5): List<EpgEntity> {
        return epgDao.getUpcomingPrograms(streamId, serverId, limit)
    }
    
    suspend fun getEpgForDay(streamId: Int, serverId: Long, dayStart: Long, dayEnd: Long): List<EpgEntity> {
        return epgDao.getEpgForDay(streamId, serverId, dayStart, dayEnd)
    }

    /**
     * EPG for a set of channels across a visible window, grouped by streamId.
     * Backs the full program-guide grid. SQLite caps a single statement at ~999 bound
     * args, so we chunk the streamId list and merge the results.
     */
    suspend fun getEpgWindowForChannels(
        serverId: Long,
        streamIds: List<Int>,
        windowStart: Long,
        windowEnd: Long
    ): Map<Int, List<EpgEntity>> = withContext(Dispatchers.IO) {
        if (streamIds.isEmpty()) return@withContext emptyMap()
        val out = HashMap<Int, MutableList<EpgEntity>>(streamIds.size)
        streamIds.distinct().chunked(900).forEach { chunk ->
            epgDao.getEpgForChannelsInWindow(serverId, chunk, windowStart, windowEnd).forEach { entity ->
                out.getOrPut(entity.streamId) { mutableListOf() }.add(entity)
            }
        }
        out
    }

    /**
     * Which of the given channels already hold EPG inside the window — so the guide can
     * fetch only the ones that are missing it.
     */
    suspend fun getChannelsWithEpgInWindow(
        serverId: Long,
        streamIds: List<Int>,
        windowStart: Long,
        windowEnd: Long
    ): Set<Int> = withContext(Dispatchers.IO) {
        if (streamIds.isEmpty()) return@withContext emptySet()
        val have = HashSet<Int>(streamIds.size)
        streamIds.distinct().chunked(900).forEach { chunk ->
            have.addAll(epgDao.getChannelsWithEpgInWindow(serverId, chunk, windowStart, windowEnd))
        }
        have
    }
    
    suspend fun hasEpgData(streamId: Int, serverId: Long): Boolean {
        return epgDao.hasEpgData(streamId, serverId)
    }
    
    suspend fun fetchAndSaveEpg(server: ServerEntity, streamId: Int): Resource<Int> = withContext(Dispatchers.IO) {
        try {
            val apiUrl = buildApiUrl(server.serverUrl)
            val (username, password) = resolveCredentials(server)
            val response = xtreamApi.getShortEpg(apiUrl, username, password, streamId = streamId, limit = 20)
            
            if (response.isSuccessful) {
                val epgMap = response.body()
                if (epgMap != null) {
                    val epgListings = mutableListOf<EpgEntity>()
                    
                    epgMap.values.flatten().forEach { dto ->
                        val startTime = dto.startTimestamp?.times(1000) ?: parseEpgTime(dto.start)
                        val endTime = dto.stopTimestamp?.times(1000) ?: parseEpgTime(dto.end)
                        
                        if (startTime != null && endTime != null) {
                            epgListings.add(
                                EpgEntity(
                                    id = "${streamId}_${startTime}",
                                    channelId = dto.channelId ?: streamId.toString(),
                                    streamId = streamId,
                                    serverId = server.id,
                                    title = dto.title ?: "Unknown Program",
                                    description = dto.description,
                                    lang = dto.lang,
                                    startTime = startTime,
                                    endTime = endTime
                                )
                            )
                        }
                    }
                    
                    if (epgListings.isNotEmpty()) {
                        epgDao.insertAll(epgListings)
                    }
                    
                    Resource.Success(epgListings.size)
                } else {
                    Resource.Success(0) // Safe valid response but empty
                }
            } else {
                Resource.Error("Failed to fetch EPG: ${response.code()}")
            }
        } catch (e: Exception) {
            Resource.Error("Error fetching EPG: ${e.message}")
        }
    }
    
    suspend fun fetchEpgForAllChannels(server: ServerEntity): Resource<Int> = withContext(Dispatchers.IO) {
        try {
            val channels = channelDao.getAllChannels(server.id).first()
            var totalEpgCount = 0
            var processedCount = 0
            
            // Increased limit from 100 to 500 channels for better EPG coverage
            // Process in batches of 50 with small delays to avoid overwhelming the server
            val maxChannels = 500
            val batchSize = 50
            
            channels.take(maxChannels).chunked(batchSize).forEach { batch ->
                batch.forEach { channel ->
                    try {
                        val result = fetchAndSaveEpg(server, channel.streamId)
                        if (result is Resource.Success) {
                            totalEpgCount += result.data ?: 0
                        }
                        processedCount++
                    } catch (e: Exception) {
                        // Continue with next channel if one fails
                    }
                }
                // Small delay between batches to prevent server overload
                if (processedCount < channels.size) {
                    kotlinx.coroutines.delay(100)
                }
            }

            val existing = serverSyncStateDao.getState(server.id)
            serverSyncStateDao.upsert(
                ServerSyncStateEntity(
                    serverId = server.id,
                    lastSyncAt = existing?.lastSyncAt ?: System.currentTimeMillis(),
                    lastStatus = existing?.lastStatus ?: "SUCCESS",
                    lastError = existing?.lastError,
                    totalChannels = channelDao.getChannelCount(server.id),
                    totalMovies = movieDao.getMovieCount(server.id),
                    totalSeries = seriesDao.getSeriesCount(server.id),
                    totalCategories = categoryDao.getCategoryCount(server.id),
                    totalEpgItems = totalEpgCount,
                    lastDurationMs = existing?.lastDurationMs ?: 0L
                )
            )
            
            Resource.Success(totalEpgCount)
        } catch (e: Exception) {
            Resource.Error("Error fetching EPG for channels: ${e.message}")
        }
    }
    
    suspend fun cleanupOldEpg() = withContext(Dispatchers.IO) {
        // Delete EPG entries older than 24 hours
        val cutoffTime = System.currentTimeMillis() - (24 * 60 * 60 * 1000)
        epgDao.deleteOldEpg(cutoffTime)
    }
    
    private fun parseEpgTime(timeString: String?): Long? {
        if (timeString.isNullOrEmpty()) return null
        return try {
            val format = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US)
            format.parse(timeString)?.time
        } catch (e: Exception) {
            null
        }
    }
    
    // TV Archive (Catch-up) URL Builder
    fun buildArchiveUrl(server: ServerEntity, streamId: Int, startTimestamp: Long, durationMinutes: Int): String {
        val baseUrl = server.serverUrl.trimEnd('/')
        val (username, password) = credentialManager.getCredentials(server.id) ?: ("" to "")
        // Format: /timeshift/{username}/{password}/{duration}/{start}/{stream_id}.ts
        return "$baseUrl/timeshift/$username/$password/$durationMinutes/$startTimestamp/$streamId.ts"
    }
    
    fun buildArchiveM3u8Url(server: ServerEntity, streamId: Int, startTimestamp: Long, durationMinutes: Int): String {
        val baseUrl = server.serverUrl.trimEnd('/')
        val (username, password) = credentialManager.getCredentials(server.id) ?: ("" to "")
        // Alternative format with m3u8
        return "$baseUrl/streaming/timeshift.php?username=$username&password=$password&stream=$streamId&start=$startTimestamp&duration=$durationMinutes"
    }
    
    // M3U Import
    suspend fun importM3uPlaylist(
        content: String,
        serverName: String
    ): Resource<Long> = withContext(Dispatchers.IO) {
        try {
            val parseResult = m3uParser.parse(content)
            importParsedM3u(parseResult, serverName)
        } catch (e: Exception) {
            Resource.Error("Failed to import M3U: ${e.message}")
        }
    }

    suspend fun importM3uPlaylist(
        inputStream: InputStream,
        serverName: String
    ): Resource<Long> = withContext(Dispatchers.IO) {
        try {
            importLargeM3uPlaylist(inputStream, serverName)
        } catch (e: Exception) {
            Resource.Error("Failed to import M3U: ${e.message}")
        }
    }

    private suspend fun importLargeM3uPlaylist(
        inputStream: InputStream,
        serverName: String
    ): Resource<Long> {
        val serverId = saveServer(
            name = serverName,
            serverUrl = "",
            username = "",
            password = "",
            serverType = "m3u"
        )

        return try {
            val categoryOrderMap = linkedMapOf<String, Int>()
            val categoryIdMap = hashMapOf<String, String>()
            val pendingCategories = mutableListOf<CategoryEntity>()
            val pendingChannels = mutableListOf<ChannelEntity>()
            val pendingMovies = mutableListOf<MovieEntity>()
            val pendingSearchItems = mutableListOf<ContentSearchEntity>()
            var streamIndex = 0
            var importedItems = 0
            var liveCount = 0
            var movieCount = 0

            suspend fun flushPendingImport() {
                if (
                    pendingCategories.isEmpty() &&
                    pendingChannels.isEmpty() &&
                    pendingMovies.isEmpty() &&
                    pendingSearchItems.isEmpty()
                ) {
                    return
                }
                database.withTransaction {
                    if (pendingCategories.isNotEmpty()) {
                        categoryDao.insertCategories(pendingCategories)
                    }
                    if (pendingChannels.isNotEmpty()) {
                        channelDao.insertChannels(pendingChannels)
                    }
                    if (pendingMovies.isNotEmpty()) {
                        movieDao.insertMovies(pendingMovies)
                    }
                    if (pendingSearchItems.isNotEmpty()) {
                        contentSearchDao.upsertAll(pendingSearchItems)
                    }
                }
                pendingCategories.clear()
                pendingChannels.clear()
                pendingMovies.clear()
                pendingSearchItems.clear()
            }

            val summary = inputStream.use { stream ->
                m3uParser.parseStreaming(stream) { item ->
                    importedItems += 1
                    val contentType = if (item.isLive) "live" else "movie"
                    val categoryName = item.group?.takeIf { it.isNotBlank() } ?: "Uncategorized"
                    val categoryKey = "$contentType:$categoryName"
                    val categoryId = categoryIdMap.getOrPut(categoryKey) {
                        val id = m3uCategoryId(serverId, categoryName, contentType)
                        pendingCategories += CategoryEntity(
                            categoryId = id,
                            serverId = serverId,
                            originalId = categoryName.hashCode().toString(),
                            name = categoryName,
                            type = contentType,
                            sortOrder = categoryOrderMap.size
                        )
                        categoryOrderMap[categoryKey] = categoryOrderMap.size
                        id
                    }

                    if (item.isLive) {
                        liveCount += 1
                        val channelId = "${serverId}_${streamIndex}_${item.name.hashCode()}"
                        val channel = ChannelEntity(
                            channelId = channelId,
                            serverId = serverId,
                            streamId = streamIndex,
                            name = item.name,
                            streamUrl = item.url,
                            streamIcon = item.logo,
                            categoryId = categoryId,
                            epgChannelId = item.tvgId,
                            tvArchive = false,
                            tvArchiveDuration = 0,
                            isAdult = categoryName.contains("adult", ignoreCase = true) ||
                                categoryName.contains("xxx", ignoreCase = true),
                            addedAt = System.currentTimeMillis(),
                            customOrder = streamIndex
                        )
                        pendingChannels += channel
                        pendingSearchItems += contentSearchEntity(
                            serverId = serverId,
                            contentType = "channel",
                            contentId = channel.channelId,
                            title = channel.name,
                            subtitle = channel.categoryId,
                            posterUrl = channel.streamIcon
                        )
                    } else {
                        movieCount += 1
                        val extension = item.url.substringAfterLast('.', "mp4").take(4)
                        val movieId = "${serverId}_${streamIndex}_${item.name.hashCode()}"
                        val movie = MovieEntity(
                            movieId = movieId,
                            serverId = serverId,
                            streamId = streamIndex,
                            name = item.name,
                            streamUrl = item.url,
                            containerExtension = extension,
                            streamIcon = item.logo,
                            categoryId = categoryId,
                            addedTimestamp = System.currentTimeMillis(),
                            isAdult = categoryName.contains("adult", ignoreCase = true) ||
                                categoryName.contains("xxx", ignoreCase = true)
                        )
                        pendingMovies += movie
                        pendingSearchItems += contentSearchEntity(
                            serverId = serverId,
                            contentType = "movie",
                            contentId = movie.movieId,
                            title = movie.name,
                            subtitle = movie.categoryId,
                            posterUrl = movie.streamIcon
                        )
                    }

                    if (
                        pendingCategories.size >= M3U_IMPORT_BATCH_SIZE ||
                        pendingChannels.size >= M3U_IMPORT_BATCH_SIZE ||
                        pendingMovies.size >= M3U_IMPORT_BATCH_SIZE ||
                        pendingSearchItems.size >= M3U_IMPORT_BATCH_SIZE
                    ) {
                        flushPendingImport()
                    }

                    streamIndex += 1
                }
            }

            if (importedItems == 0 || summary.itemCount == 0) {
                deleteServer(serverId)
                return Resource.Error(
                    "Playlist did not contain playable items. Check that the M3U URL is valid and contains stream URLs."
                )
            }

            flushPendingImport()

            serverSyncStateDao.upsert(
                ServerSyncStateEntity(
                    serverId = serverId,
                    lastSyncAt = System.currentTimeMillis(),
                    lastStatus = "SUCCESS",
                    totalChannels = liveCount,
                    totalMovies = movieCount,
                    totalCategories = categoryIdMap.size
                )
            )

            Resource.Success(serverId)
        } catch (e: Exception) {
            deleteServer(serverId)
            Resource.Error("Failed to import M3U: ${e.message}")
        }
    }

    private suspend fun importParsedM3u(
        parseResult: M3uParser.ParseResult,
        serverName: String
    ): Resource<Long> {
        if (parseResult.items.isEmpty()) {
            return Resource.Error(
                "Playlist did not contain playable items. Check that the M3U URL is valid and contains stream URLs."
            )
        }

        val serverId = saveServer(
            name = serverName,
            serverUrl = "",
            username = "",
            password = "",
            serverType = "m3u"
        )

        val liveCategoryNames = parseResult.items
            .filter { it.isLive }
            .map { it.group?.takeIf { name -> name.isNotBlank() } ?: "Uncategorized" }
            .toSet()
        val movieCategoryNames = parseResult.items
            .filter { !it.isLive }
            .map { it.group?.takeIf { name -> name.isNotBlank() } ?: "Uncategorized" }
            .toSet()
        val liveCategories = m3uCategories(liveCategoryNames, serverId, "live")
        val movieCategories = m3uCategories(movieCategoryNames, serverId, "movie")
        val liveCategoryMap = liveCategories.associate { it.name to it.categoryId }
        val movieCategoryMap = movieCategories.associate { it.name to it.categoryId }
        val channels = m3uParser.toChannelEntities(parseResult.items, serverId, liveCategoryMap)
        val movies = m3uParser.toMovieEntities(parseResult.items, serverId, movieCategoryMap)
        val searchItems = buildList {
            addAll(
                channels.map {
                    contentSearchEntity(
                        serverId = serverId,
                        contentType = "channel",
                        contentId = it.channelId,
                        title = it.name,
                        subtitle = it.categoryId,
                        posterUrl = it.streamIcon
                    )
                }
            )
            addAll(
                movies.map {
                    contentSearchEntity(
                        serverId = serverId,
                        contentType = "movie",
                        contentId = it.movieId,
                        title = it.name,
                        subtitle = it.categoryId,
                        posterUrl = it.streamIcon
                    )
                }
            )
        }

        database.withTransaction {
            categoryDao.insertCategories(liveCategories + movieCategories)
            channelDao.insertChannels(channels)
            movieDao.insertMovies(movies)
            contentSearchDao.deleteByServer(serverId)
            searchItems.chunked(API_IMPORT_BATCH_SIZE).forEach { chunk ->
                contentSearchDao.upsertAll(chunk)
            }
        }

        serverSyncStateDao.upsert(
            ServerSyncStateEntity(
                serverId = serverId,
                lastSyncAt = System.currentTimeMillis(),
                lastStatus = "SUCCESS",
                lastError = buildString {
                    append("Imported ${channels.size} live and ${movies.size} movies")
                    if (parseResult.categories.isNotEmpty()) {
                        append(" across ${liveCategories.size + movieCategories.size} categories")
                    }
                    if (parseResult.skippedEntries > 0 || parseResult.duplicateEntries > 0) {
                        append(". Skipped ${parseResult.skippedEntries} malformed and ${parseResult.duplicateEntries} duplicate entries")
                    }
                },
                totalChannels = channels.size,
                totalMovies = movies.size,
                totalSeries = 0,
                totalCategories = liveCategories.size + movieCategories.size
            )
        )

        return Resource.Success(serverId)
    }
    
    // Content Count Operations (for smart sync)
    suspend fun getContentSnapshot(serverId: Long): ContentSnapshot = withContext(Dispatchers.IO) {
        ContentSnapshot(
            serverId = serverId,
            channelsCount = channelDao.getChannelCount(serverId),
            moviesCount = movieDao.getMovieCount(serverId),
            seriesCount = seriesDao.getSeriesCount(serverId),
            categoriesCount = categoryDao.getCategoryCount(serverId)
        )
    }
    
    suspend fun getChannelCount(serverId: Long): Int = withContext(Dispatchers.IO) {
        channelDao.getChannelCount(serverId)
    }

    suspend fun getChannelCountByCategory(serverId: Long, categoryId: String): Int = withContext(Dispatchers.IO) {
        channelDao.getChannelCountByCategory(serverId, categoryId)
    }

    suspend fun getMovieById(movieId: String): MovieEntity? = withContext(Dispatchers.IO) {
        movieDao.getMovieById(movieId)
    }

    suspend fun getSeriesById(seriesId: String): SeriesEntity? = withContext(Dispatchers.IO) {
        seriesDao.getSeriesById(seriesId)
    }

    suspend fun getEpisodeById(episodeId: String): EpisodeEntity? = withContext(Dispatchers.IO) {
        seriesDao.getEpisodeById(episodeId)
    }

    suspend fun getChannelById(channelId: String): ChannelEntity? = withContext(Dispatchers.IO) {
        channelDao.getChannelById(channelId)
    }
    
    suspend fun getMovieCount(serverId: Long): Int = withContext(Dispatchers.IO) {
        movieDao.getMovieCount(serverId)
    }

    suspend fun getMovieCategoryCounts(serverId: Long): Map<String, Int> = withContext(Dispatchers.IO) {
        movieDao.getMovieCategoryCounts(serverId).associate { it.categoryId to it.itemCount }
    }
    
    suspend fun getSeriesCount(serverId: Long): Int = withContext(Dispatchers.IO) {
        seriesDao.getSeriesCount(serverId)
    }

    suspend fun getSeriesCategoryCounts(serverId: Long): Map<String, Int> = withContext(Dispatchers.IO) {
        seriesDao.getSeriesCategoryCounts(serverId).associate { it.categoryId to it.itemCount }
    }
    
    suspend fun getCategoryCount(serverId: Long): Int = withContext(Dispatchers.IO) {
        categoryDao.getCategoryCount(serverId)
    }

    suspend fun getServerSyncState(serverId: Long): ServerSyncStateEntity? = withContext(Dispatchers.IO) {
        val state = serverSyncStateDao.getState(serverId) ?: return@withContext null
        val channels = channelDao.getChannelCount(serverId)
        val movies = movieDao.getMovieCount(serverId)
        val series = seriesDao.getSeriesCount(serverId)
        val categories = categoryDao.getCategoryCount(serverId)
        if (
            state.totalChannels == channels &&
                state.totalMovies == movies &&
                state.totalSeries == series &&
                state.totalCategories == categories
        ) {
            return@withContext state
        }

        val repaired = state.copy(
            totalChannels = channels,
            totalMovies = movies,
            totalSeries = series,
            totalCategories = categories
        )
        serverSyncStateDao.upsert(repaired)
        repaired
    }

    private suspend fun compactSearchIndexIfNeeded(serverId: Long, state: ServerSyncStateEntity) {
        val expectedRows = state.totalChannels + state.totalMovies + state.totalSeries
        if (expectedRows <= 0) return

        val actualRows = contentSearchDao.countByServer(serverId)
        val allowedOverage = maxOf(1_000, expectedRows / 5)
        if (actualRows == 0 || actualRows > expectedRows + allowedOverage) {
            android.util.Log.d(
                "IptvRepository",
                "Rebuilding bloated search index: actual=$actualRows expected=$expectedRows"
            )
            rebuildSearchIndex(serverId)
        }
    }

    private suspend fun rebuildSearchIndex(serverId: Long) {
        database.withTransaction {
            contentSearchDao.deleteByServer(serverId)
        }

        suspend fun flush(rows: List<ContentSearchEntity>) {
            if (rows.isEmpty()) return
            database.withTransaction {
                contentSearchDao.upsertAll(rows)
            }
        }

        var offset = 0
        while (true) {
            val page = channelDao.getChannelsPage(serverId, SEARCH_REBUILD_PAGE_SIZE, offset)
            if (page.isEmpty()) break
            flush(
                page.map {
                    contentSearchEntity(
                        serverId = serverId,
                        contentType = "channel",
                        contentId = it.channelId,
                        title = it.name,
                        subtitle = it.categoryId,
                        posterUrl = it.streamIcon
                    )
                }
            )
            offset += page.size
        }

        offset = 0
        while (true) {
            val page = movieDao.getMoviesPage(serverId, SEARCH_REBUILD_PAGE_SIZE, offset)
            if (page.isEmpty()) break
            flush(
                page.map {
                    contentSearchEntity(
                        serverId = serverId,
                        contentType = "movie",
                        contentId = it.movieId,
                        title = it.name,
                        subtitle = it.categoryId,
                        posterUrl = it.streamIcon
                    )
                }
            )
            offset += page.size
        }

        offset = 0
        while (true) {
            val page = seriesDao.getSeriesPage(serverId, SEARCH_REBUILD_PAGE_SIZE, offset)
            if (page.isEmpty()) break
            flush(
                page.map {
                    contentSearchEntity(
                        serverId = serverId,
                        contentType = "series",
                        contentId = it.seriesId,
                        title = it.name,
                        subtitle = it.categoryId,
                        posterUrl = it.cover
                    )
                }
            )
            offset += page.size
        }
    }

    private suspend fun upsertSyncState(
        serverId: Long,
        status: String,
        error: String?,
        durationMs: Long
    ): ServerSyncStateEntity {
        val current = serverSyncStateDao.getState(serverId)
        val state = ServerSyncStateEntity(
            serverId = serverId,
            lastSyncAt = System.currentTimeMillis(),
            lastStatus = status,
            lastError = error,
            totalChannels = channelDao.getChannelCount(serverId),
            totalMovies = movieDao.getMovieCount(serverId),
            totalSeries = seriesDao.getSeriesCount(serverId),
            totalCategories = categoryDao.getCategoryCount(serverId),
            totalEpgItems = current?.totalEpgItems ?: 0,
            lastDurationMs = durationMs
        )
        serverSyncStateDao.upsert(state)
        return state
    }

    private fun requireSyncSuccess(label: String, result: Resource<*>) {
        if (result is Resource.Error) {
            throw IllegalStateException(result.message ?: "$label sync failed")
        }
    }

    private fun buildFtsQuery(query: String): String {
        return query
            .trim()
            .split(Regex("\\s+"))
            .filter { it.isNotBlank() }
            .joinToString(" AND ") { token ->
                token.replace("\"", "").replace("'", "") + "*"
            }
            .ifBlank { query }
    }

    private fun scoreSearchHit(hit: UnifiedSearchHit, query: String): Int {
        val q = query.lowercase(Locale.ROOT)
        val title = hit.title.lowercase(Locale.ROOT)
        return when {
            title == q -> 5
            title.startsWith(q) -> 4
            title.contains(q) -> 3
            hit.contentType == UnifiedContentType.FAVORITE -> 2
            hit.contentType == UnifiedContentType.HISTORY -> 1
            else -> 0
        }
    }

    private fun String.toUnifiedTypeOrNull(): UnifiedContentType? {
        return when (lowercase(Locale.ROOT)) {
            "channel", "live" -> UnifiedContentType.CHANNEL
            "movie" -> UnifiedContentType.MOVIE
            "series" -> UnifiedContentType.SERIES
            "episode" -> UnifiedContentType.EPISODE
            else -> null
        }
    }

    private fun UnifiedSearchFilters.accepts(type: UnifiedContentType): Boolean {
        return when (type) {
            UnifiedContentType.CHANNEL -> includeLive
            UnifiedContentType.MOVIE -> includeMovies
            UnifiedContentType.SERIES -> includeSeries
            UnifiedContentType.EPISODE -> includeEpisodes
            UnifiedContentType.FAVORITE -> includeFavorites
            UnifiedContentType.HISTORY -> includeHistory
        }
    }
    
    // Helper functions
    private fun buildApiUrl(serverUrl: String): String {
        val cleanUrl = serverUrl.trimEnd('/')
        return if (cleanUrl.contains("/player_api.php")) {
            cleanUrl
        } else {
            "$cleanUrl/player_api.php"
        }
    }
    
    fun buildStreamUrl(
        server: ServerEntity,
        streamId: Int,
        type: String,
        extension: String? = null
    ): String {
        val baseUrl = server.serverUrl.trimEnd('/')
        val (username, password) = credentialManager.getCredentials(server.id) ?: ("" to "")
        return when (type) {
            "live" -> buildLiveStreamUrl(baseUrl, username, password, streamId, server)
            "movie" -> "$baseUrl/movie/$username/$password/$streamId.${extension ?: "mp4"}"
            "series" -> "$baseUrl/series/$username/$password/$streamId.${extension ?: "mp4"}"
            else -> "$baseUrl/$type/$username/$password/$streamId"
        }
    }

    private fun buildLiveStreamUrl(
        baseUrl: String,
        username: String,
        password: String,
        streamId: Int,
        server: ServerEntity
    ): String {
        return when (preferredLiveOutputFormat(server)) {
            "mpegts", "ts" -> "$baseUrl/live/$username/$password/$streamId.ts"
            "rtmp" -> "$baseUrl/live/$username/$password/$streamId"
            else -> "$baseUrl/live/$username/$password/$streamId.m3u8"
        }
    }

    private fun preferredLiveOutputFormat(server: ServerEntity): String {
        val metadata = runCatching {
            server.serverInfo?.takeIf { it.isNotBlank() }?.let { JsonParser.parseString(it).asJsonObject }
        }.getOrNull()
        val preferred = ProviderSourceUrlParser.normalizeOutputFormat(
            metadata?.stringOrNull("preferred_output_format")
        )
        if (preferred != null) return preferred

        val allowed = metadata?.getAsJsonArray("allowed_output_formats")
            ?.mapNotNull { element ->
                ProviderSourceUrlParser.normalizeOutputFormat(element.takeIf { it.isJsonPrimitive }?.asString)
            }
            .orEmpty()
        return when {
            "m3u8" in allowed -> "m3u8"
            "mpegts" in allowed || "ts" in allowed -> "mpegts"
            "rtmp" in allowed -> "rtmp"
            else -> "m3u8"
        }
    }

    private fun buildServerInfoJson(authResponse: AuthResponse?, preferredOutputFormat: String?): String? {
        if (authResponse == null && preferredOutputFormat.isNullOrBlank()) return null
        return JsonObject().apply {
            ProviderSourceUrlParser.normalizeOutputFormat(preferredOutputFormat)?.let {
                addProperty("preferred_output_format", it)
            }
            val allowed = authResponse?.userInfo?.allowedOutputFormats
                ?.mapNotNull { ProviderSourceUrlParser.normalizeOutputFormat(it) }
                ?.distinct()
                .orEmpty()
            if (allowed.isNotEmpty()) {
                add("allowed_output_formats", JsonArray().apply { allowed.forEach { add(it) } })
            }
            authResponse?.serverInfo?.let { info ->
                addProperty("server_protocol", info.serverProtocol ?: "")
                addProperty("server_timezone", info.timezone ?: "")
            }
            // Persist the panel account status so an expired/banned/disabled account can be
            // surfaced clearly even when the expiry date alone is ambiguous.
            authResponse?.userInfo?.status?.takeIf { it.isNotBlank() }?.let {
                addProperty(com.mo.moplayer.util.ProviderSubscription.SERVER_INFO_STATUS_KEY, it)
            }
        }.toString()
    }

    private fun JsonObject.stringOrNull(key: String): String? {
        val element = get(key) ?: return null
        if (!element.isJsonPrimitive) return null
        return element.asString.takeIf { it.isNotBlank() }
    }

    private fun m3uCategoryId(serverId: Long, categoryName: String, type: String): String =
        "${serverId}_${type}_${categoryName.hashCode()}"

    private fun m3uCategories(categoryNames: Set<String>, serverId: Long, type: String): List<CategoryEntity> {
        return categoryNames.mapIndexed { index, categoryName ->
            CategoryEntity(
                categoryId = m3uCategoryId(serverId, categoryName, type),
                serverId = serverId,
                originalId = categoryName.hashCode().toString(),
                name = categoryName,
                type = type,
                sortOrder = index
            )
        }
    }

    private fun buildEpisodeEntities(
        server: ServerEntity,
        series: SeriesEntity,
        episodeGroups: Map<String, List<EpisodeDto>>?,
        cachedEpisodes: List<EpisodeEntity>
    ): List<EpisodeEntity> {
        if (episodeGroups.isNullOrEmpty()) return emptyList()
        val cachedByStreamId = cachedEpisodes.associateBy { it.streamId }

        return episodeGroups.entries
            .sortedBy { it.key.toIntOrNull() ?: Int.MAX_VALUE }
            .flatMap { (seasonKey, episodes) ->
                val fallbackSeason = seasonKey.toIntOrNull() ?: 1
                episodes.mapIndexedNotNull { index, dto ->
                    val streamId = dto.id?.toIntOrNull() ?: return@mapIndexedNotNull null
                    val seasonNumber = dto.season?.takeIf { it > 0 } ?: fallbackSeason
                    val episodeNumber = dto.episodeNum?.takeIf { it > 0 } ?: (index + 1)
                    val extension = dto.containerExtension?.takeIf { it.isNotBlank() } ?: "mp4"
                    val existing = cachedByStreamId[streamId]
                    EpisodeEntity(
                        episodeId = "${series.seriesId}_$streamId",
                        seriesId = series.seriesId,
                        seasonNumber = seasonNumber,
                        episodeNumber = episodeNumber,
                        title = firstNonBlank(dto.title, "Episode $episodeNumber"),
                        streamId = streamId,
                        streamUrl = dto.directSource?.takeIf { it.isNotBlank() }
                            ?: buildStreamUrl(server, streamId, "series", extension),
                        containerExtension = extension,
                        plot = dto.info?.plot,
                        duration = dto.info?.duration,
                        durationSeconds = dto.info?.durationSecs,
                        releaseDate = dto.info?.releaseDate,
                        cover = normalizeImageUrl(firstNonBlank(dto.info?.movieImage, series.cover)),
                        lastWatchedPosition = existing?.lastWatchedPosition ?: 0L,
                        lastWatchedAt = existing?.lastWatchedAt
                    )
                }
            }
            .sortedWith(compareBy<EpisodeEntity> { it.seasonNumber }.thenBy { it.episodeNumber })
    }

    private fun hasUsefulSeriesDetails(series: SeriesEntity): Boolean =
        !series.plot.isNullOrBlank() ||
            !series.backdrop.isNullOrBlank() ||
            !series.genre.isNullOrBlank() ||
            series.rating != null

    private fun parseRating(value: String?): Double? =
        value
            ?.trim()
            ?.replace(',', '.')
            ?.takeIf { it.isNotBlank() }
            ?.toDoubleOrNull()

    private fun firstNonBlank(vararg values: String?): String? =
        values.firstOrNull { !it.isNullOrBlank() }?.trim()
    
    private fun parseTimestamp(timestamp: String?): Long {
        if (timestamp.isNullOrEmpty()) return System.currentTimeMillis()
        
        return try {
            // Try Unix timestamp first
            timestamp.toLongOrNull()?.times(1000) ?: run {
                // Try common date formats
                val formats = listOf(
                    "yyyy-MM-dd HH:mm:ss",
                    "yyyy-MM-dd",
                    "dd-MM-yyyy HH:mm:ss",
                    "dd-MM-yyyy"
                )
                var result: Long? = null
                for (format in formats) {
                    try {
                        val sdf = SimpleDateFormat(format, Locale.US)
                        result = sdf.parse(timestamp)?.time
                        if (result != null) break
                    } catch (_: Exception) { }
                }
                result ?: System.currentTimeMillis()
            }
        } catch (e: Exception) {
            System.currentTimeMillis()
        }
    }
    /**
     * One-time migration: move plaintext credentials from Room to EncryptedSharedPreferences.
     * Called from MoPlayerApp.onCreate() guarded by a migration flag.
     * After migration, Room username/password fields are cleared.
     */
    suspend fun migrateCredentialsIfNeeded() = withContext(Dispatchers.IO) {
        val servers = serverDao.getAllServersSync()
        val toMigrate = servers.filter { it.username.isNotEmpty() || it.password.isNotEmpty() }
        if (toMigrate.isEmpty()) return@withContext

        credentialManager.migrateFromPlaintext(
            toMigrate.map { Triple(it.id, it.username, it.password) }
        )
        // Clear plaintext from Room
        toMigrate.forEach { server ->
            serverDao.updateServer(server.copy(username = "", password = ""))
        }
        android.util.Log.i("IptvRepository", "Migrated credentials for ${toMigrate.size} server(s)")
    }

    /**
     * Authenticate with Xtream API using credentials resolved from CredentialManager.
     * Falls back to provided username/password for new server setup (before first save).
     */
    fun getServerCredentials(serverId: Long): Pair<String, String> {
        return credentialManager.getCredentials(serverId) ?: ("" to "")
    }

    private fun resolveCredentials(server: ServerEntity): Pair<String, String> {
        val stored = credentialManager.getCredentials(server.id)
        val username = stored?.first?.takeIf { it.isNotBlank() } ?: server.username
        val password = stored?.second?.takeIf { it.isNotBlank() } ?: server.password
        return username to password
    }
}
