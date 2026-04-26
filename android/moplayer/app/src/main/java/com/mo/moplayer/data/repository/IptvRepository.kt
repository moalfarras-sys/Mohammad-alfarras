package com.mo.moplayer.data.repository

import android.content.Context
import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.PagingData
import com.mo.moplayer.data.local.dao.*
import com.mo.moplayer.data.local.entity.*
import com.mo.moplayer.data.parser.M3uParser
import com.mo.moplayer.data.remote.api.XtreamApi
import com.mo.moplayer.data.remote.dto.AuthResponse
import com.mo.moplayer.data.util.ImageUrlNormalizer
import com.mo.moplayer.util.ContentSnapshot
import com.mo.moplayer.util.CredentialManager
import com.mo.moplayer.util.Resource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

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
    private val credentialManager: CredentialManager
) {

    internal fun normalizeImageUrl(raw: String?): String? = ImageUrlNormalizer.normalize(raw)
    
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
        authResponse: AuthResponse? = null
    ): Long = withContext(Dispatchers.IO) {
        val server = ServerEntity(
            name = name,
            serverUrl = serverUrl,
            // Store empty strings in Room — real credentials go to EncryptedSharedPreferences
            username = "",
            password = "",
            serverType = serverType,
            isActive = true,
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
                when (syncMode) {
                    SyncMode.FULL -> {
                        fetchAndSaveCategories(server)
                        fetchAndSaveChannels(server)
                        fetchAndSaveMovies(server)
                        fetchAndSaveSeries(server)
                        fetchEpgForAllChannels(server)
                    }
                    SyncMode.DELTA -> {
                        // Delta endpoints are not available on all providers.
                        // Fallback to efficient batched refresh for each content type.
                        fetchAndSaveChannels(server)
                        fetchAndSaveMovies(server)
                        fetchAndSaveSeries(server)
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
                categoryDao.deleteCategoriesByType(server.id, "live")
                categoryDao.insertCategories(categories)
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
                categoryDao.deleteCategoriesByType(server.id, "movie")
                categoryDao.insertCategories(categories)
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
                categoryDao.deleteCategoriesByType(server.id, "series")
                categoryDao.insertCategories(categories)
            }
            
            Resource.Success(Unit)
        } catch (e: Exception) {
            Resource.Error("Failed to fetch categories: ${e.message}")
        }
    }
    
    // Channels
    fun getAllChannels(serverId: Long): Flow<List<ChannelEntity>> = 
        channelDao.getAllChannels(serverId)
    
    fun getChannelsByCategory(serverId: Long, categoryId: String): Flow<List<ChannelEntity>> =
        channelDao.getChannelsByCategory(serverId, categoryId)
    
    fun searchChannels(serverId: Long, query: String): Flow<List<ChannelEntity>> =
        channelDao.searchChannels(serverId, query)
    
    suspend fun fetchAndSaveChannels(server: ServerEntity): Resource<Int> = withContext(Dispatchers.IO) {
        try {
            val apiUrl = buildApiUrl(server.serverUrl)
            val (username, password) = resolveCredentials(server)
            val response = xtreamApi.getLiveStreams(apiUrl, username, password)
            
            if (response.isSuccessful) {
                channelDao.deleteAllChannels(server.id)
                contentSearchDao.deleteByType(server.id, "channel")

                val dtos = response.body().orEmpty()
                val batchSize = 500
                val buffer = ArrayList<ChannelEntity>(batchSize)
                val searchBuffer = ArrayList<ContentSearchEntity>(batchSize)
                var inserted = 0

                for (dto in dtos) {
                    val streamId = dto.streamId ?: 0
                    val channelId = "${server.id}_$streamId"
                    val name = dto.name ?: "Unknown"
                    val categoryId = dto.categoryId?.let { "${server.id}_live_$it" }
                    buffer.add(
                        ChannelEntity(
                            channelId = channelId,
                            serverId = server.id,
                            streamId = streamId,
                            name = name,
                            streamUrl = buildStreamUrl(server, streamId, "live"),
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
                        ContentSearchEntity(
                            uniqueId = "${server.id}:channel:$channelId",
                            serverId = server.id,
                            contentId = channelId,
                            contentType = "channel",
                            title = name,
                            subtitle = categoryId,
                            posterUrl = normalizeImageUrl(dto.streamIcon)
                        )
                    )

                    if (buffer.size >= batchSize) {
                        channelDao.insertChannels(buffer)
                        contentSearchDao.upsertAll(searchBuffer)
                        inserted += buffer.size
                        buffer.clear()
                        searchBuffer.clear()
                    }
                }

                if (buffer.isNotEmpty()) {
                    channelDao.insertChannels(buffer)
                    contentSearchDao.upsertAll(searchBuffer)
                    inserted += buffer.size
                }

                Resource.Success(inserted)
            } else {
                Resource.Error("Failed to fetch channels: ${response.code()}")
            }
        } catch (e: Exception) {
            Resource.Error("Error fetching channels: ${e.message}")
        }
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
            val response = xtreamApi.getVodStreams(apiUrl, username, password)
            
            if (response.isSuccessful) {
                movieDao.deleteAllMovies(server.id)
                contentSearchDao.deleteByType(server.id, "movie")

                val dtos = response.body().orEmpty()
                val batchSize = 500
                val buffer = ArrayList<MovieEntity>(batchSize)
                val searchBuffer = ArrayList<ContentSearchEntity>(batchSize)
                var inserted = 0

                for (dto in dtos) {
                    val streamId = dto.streamId ?: 0
                    val movieId = "${server.id}_$streamId"
                    val name = dto.name ?: "Unknown"
                    val categoryId = dto.categoryId?.let { "${server.id}_movie_$it" }
                    buffer.add(
                        MovieEntity(
                            movieId = movieId,
                            serverId = server.id,
                            streamId = streamId,
                            name = name,
                            streamUrl = buildStreamUrl(server, streamId, "movie", dto.containerExtension),
                            containerExtension = dto.containerExtension,
                            streamIcon = normalizeImageUrl(dto.streamIcon),
                            categoryId = categoryId,
                            rating = dto.rating5Based,
                            addedTimestamp = parseTimestamp(dto.added),
                            isAdult = dto.isAdult == "1"
                        )
                    )
                    searchBuffer.add(
                        ContentSearchEntity(
                            uniqueId = "${server.id}:movie:$movieId",
                            serverId = server.id,
                            contentId = movieId,
                            contentType = "movie",
                            title = name,
                            subtitle = categoryId,
                            posterUrl = normalizeImageUrl(dto.streamIcon)
                        )
                    )

                    if (buffer.size >= batchSize) {
                        movieDao.insertMovies(buffer)
                        contentSearchDao.upsertAll(searchBuffer)
                        inserted += buffer.size
                        buffer.clear()
                        searchBuffer.clear()
                    }
                }

                if (buffer.isNotEmpty()) {
                    movieDao.insertMovies(buffer)
                    contentSearchDao.upsertAll(searchBuffer)
                    inserted += buffer.size
                }

                Resource.Success(inserted)
            } else {
                Resource.Error("Failed to fetch movies: ${response.code()}")
            }
        } catch (e: Exception) {
            Resource.Error("Error fetching movies: ${e.message}")
        }
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
            val response = xtreamApi.getSeries(apiUrl, username, password)
            
            if (response.isSuccessful) {
                seriesDao.deleteAllSeries(server.id)
                contentSearchDao.deleteByType(server.id, "series")

                val dtos = response.body().orEmpty()
                val batchSize = 500
                val buffer = ArrayList<SeriesEntity>(batchSize)
                val searchBuffer = ArrayList<ContentSearchEntity>(batchSize)
                var inserted = 0

                for (dto in dtos) {
                    val seriesId = dto.seriesId ?: 0
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
                        ContentSearchEntity(
                            uniqueId = "${server.id}:series:$localSeriesId",
                            serverId = server.id,
                            contentId = localSeriesId,
                            contentType = "series",
                            title = name,
                            subtitle = categoryId,
                            posterUrl = normalizeImageUrl(dto.cover)
                        )
                    )

                    if (buffer.size >= batchSize) {
                        seriesDao.insertSeries(buffer)
                        contentSearchDao.upsertAll(searchBuffer)
                        inserted += buffer.size
                        buffer.clear()
                        searchBuffer.clear()
                    }
                }

                if (buffer.isNotEmpty()) {
                    seriesDao.insertSeries(buffer)
                    contentSearchDao.upsertAll(searchBuffer)
                    inserted += buffer.size
                }

                Resource.Success(inserted)
            } else {
                Resource.Error("Failed to fetch series: ${response.code()}")
            }
        } catch (e: Exception) {
            Resource.Error("Error fetching series: ${e.message}")
        }
    }
    
    suspend fun getSeriesInfo(
        server: ServerEntity,
        seriesId: Int
    ): Resource<com.mo.moplayer.data.remote.dto.SeriesInfoResponse> = withContext(Dispatchers.IO) {
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

            val existing = serverSyncStateDao.getState(server.id) ?: ServerSyncStateEntity(serverId = server.id)
            serverSyncStateDao.upsert(existing.copy(totalEpgItems = totalEpgCount))
            
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
            if (parseResult.items.isEmpty()) {
                return@withContext Resource.Error(
                    "Playlist did not contain playable items. Check that the M3U URL is valid and contains stream URLs."
                )
            }
            
            // Create server entry
            val serverId = saveServer(
                name = serverName,
                serverUrl = "",
                username = "",
                password = "",
                serverType = "m3u"
            )
            
            // Convert categories
            val liveCategories = m3uParser.toCategoryEntities(
                parseResult.categories, serverId, "live"
            )
            categoryDao.insertCategories(liveCategories)
            
            val categoryMap = liveCategories.associate { it.name to it.categoryId }
            
            // Convert items to channels
            val channels = m3uParser.toChannelEntities(parseResult.items, serverId, categoryMap)
            channelDao.insertChannels(channels)
            
            // Convert VOD items to movies
            val movies = m3uParser.toMovieEntities(parseResult.items, serverId, categoryMap)
            movieDao.insertMovies(movies)

            contentSearchDao.deleteByServer(serverId)
            val searchItems = buildList {
                addAll(
                    channels.map {
                        ContentSearchEntity(
                            uniqueId = "$serverId:channel:${it.channelId}",
                            serverId = serverId,
                            contentId = it.channelId,
                            contentType = "channel",
                            title = it.name,
                            subtitle = it.categoryId,
                            posterUrl = normalizeImageUrl(it.streamIcon)
                        )
                    }
                )
                addAll(
                    movies.map {
                        ContentSearchEntity(
                            uniqueId = "$serverId:movie:${it.movieId}",
                            serverId = serverId,
                            contentId = it.movieId,
                            contentType = "movie",
                            title = it.name,
                            subtitle = it.categoryId,
                            posterUrl = normalizeImageUrl(it.streamIcon)
                        )
                    }
                )
            }
            if (searchItems.isNotEmpty()) {
                contentSearchDao.upsertAll(searchItems)
            }

            serverSyncStateDao.upsert(
                ServerSyncStateEntity(
                    serverId = serverId,
                    lastSyncAt = System.currentTimeMillis(),
                    lastStatus = "SUCCESS",
                    lastError = buildString {
                        append("Imported ${channels.size} live and ${movies.size} movies")
                        if (parseResult.categories.isNotEmpty()) {
                            append(" across ${parseResult.categories.size} categories")
                        }
                        if (parseResult.skippedEntries > 0 || parseResult.duplicateEntries > 0) {
                            append(". Skipped ${parseResult.skippedEntries} malformed and ${parseResult.duplicateEntries} duplicate entries")
                        }
                    },
                    totalChannels = channels.size,
                    totalMovies = movies.size,
                    totalSeries = 0,
                    totalCategories = liveCategories.size
                )
            )
            
            Resource.Success(serverId)
        } catch (e: Exception) {
            Resource.Error("Failed to import M3U: ${e.message}")
        }
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

    suspend fun getMovieById(movieId: String): MovieEntity? = withContext(Dispatchers.IO) {
        movieDao.getMovieById(movieId)
    }

    suspend fun getSeriesById(seriesId: String): SeriesEntity? = withContext(Dispatchers.IO) {
        seriesDao.getSeriesById(seriesId)
    }

    suspend fun getChannelById(channelId: String): ChannelEntity? = withContext(Dispatchers.IO) {
        channelDao.getChannelById(channelId)
    }
    
    suspend fun getMovieCount(serverId: Long): Int = withContext(Dispatchers.IO) {
        movieDao.getMovieCount(serverId)
    }
    
    suspend fun getSeriesCount(serverId: Long): Int = withContext(Dispatchers.IO) {
        seriesDao.getSeriesCount(serverId)
    }
    
    suspend fun getCategoryCount(serverId: Long): Int = withContext(Dispatchers.IO) {
        categoryDao.getCategoryCount(serverId)
    }

    suspend fun getServerSyncState(serverId: Long): ServerSyncStateEntity? = withContext(Dispatchers.IO) {
        serverSyncStateDao.getState(serverId)
    }

    private suspend fun rebuildSearchIndex(serverId: Long) {
        contentSearchDao.deleteByServer(serverId)

        val channels = channelDao.getAllChannels(serverId).first()
        val movies = movieDao.getAllMovies(serverId).first()
        val series = seriesDao.getAllSeries(serverId).first()

        val indexRows = buildList {
            addAll(
                channels.map {
                    ContentSearchEntity(
                        uniqueId = "$serverId:channel:${it.channelId}",
                        serverId = serverId,
                        contentId = it.channelId,
                        contentType = "channel",
                        title = it.name,
                        subtitle = it.categoryId,
                        posterUrl = normalizeImageUrl(it.streamIcon)
                    )
                }
            )
            addAll(
                movies.map {
                    ContentSearchEntity(
                        uniqueId = "$serverId:movie:${it.movieId}",
                        serverId = serverId,
                        contentId = it.movieId,
                        contentType = "movie",
                        title = it.name,
                        subtitle = it.categoryId,
                        posterUrl = normalizeImageUrl(it.streamIcon)
                    )
                }
            )
            addAll(
                series.map {
                    ContentSearchEntity(
                        uniqueId = "$serverId:series:${it.seriesId}",
                        serverId = serverId,
                        contentId = it.seriesId,
                        contentType = "series",
                        title = it.name,
                        subtitle = it.categoryId,
                        posterUrl = normalizeImageUrl(it.cover)
                    )
                }
            )
        }

        if (indexRows.isNotEmpty()) {
            contentSearchDao.upsertAll(indexRows)
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
            "live" -> "$baseUrl/live/$username/$password/$streamId.m3u8"
            "movie" -> "$baseUrl/movie/$username/$password/$streamId.${extension ?: "mp4"}"
            "series" -> "$baseUrl/series/$username/$password/$streamId.${extension ?: "mp4"}"
            else -> "$baseUrl/$type/$username/$password/$streamId"
        }
    }
    
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
