package com.moalfarras.moplayer.data.repository

import androidx.room.withTransaction
import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.PagingData
import androidx.paging.map
import com.moalfarras.moplayerpro.BuildConfig
import com.moalfarras.moplayer.data.db.MoPlayerDatabase
import com.moalfarras.moplayer.data.db.toDomain
import com.moalfarras.moplayer.data.db.toEntity
import com.moalfarras.moplayer.data.network.PlaylistService
import com.moalfarras.moplayer.data.network.SupabaseService
import com.moalfarras.moplayer.data.network.XtreamService
import com.moalfarras.moplayer.data.network.NetworkModule
import com.moalfarras.moplayer.data.network.DeviceActivationInsertDto
import com.moalfarras.moplayer.data.network.DeviceActivationUpdateDto
import com.moalfarras.moplayer.data.network.WebActivationCreateRequestDto
import com.moalfarras.moplayer.data.network.WebProviderSourceDto
import com.moalfarras.moplayer.data.network.WatchProgressDto
import com.moalfarras.moplayer.data.parser.M3uParser
import com.moalfarras.moplayer.domain.model.ActivatedProfile
import com.moalfarras.moplayer.domain.model.Category
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.DeviceActivationSession
import com.moalfarras.moplayer.domain.model.DeviceActivationStatus
import com.moalfarras.moplayer.domain.model.LiveEpgSnapshot
import com.moalfarras.moplayer.domain.model.LoadProgress
import com.moalfarras.moplayer.domain.model.LoginKind
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.ServerProfile
import com.moalfarras.moplayer.domain.model.SortOption
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import okhttp3.ResponseBody
import java.net.URLEncoder
import java.security.SecureRandom
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.util.Locale

class IptvRepository(
    private val database: MoPlayerDatabase,
    private val playlistService: PlaylistService,
    private val xtreamFactory: (String) -> XtreamService,
    private val supabaseService: SupabaseService?,
    private val parser: M3uParser,
) {
    private val json = NetworkModule.json
    private val supabaseBearer: String?
        get() = BuildConfig.SUPABASE_ANON_KEY
            .takeIf { it.startsWith("eyJ") }
            ?.let { "Bearer $it" }

    val servers: Flow<List<ServerProfile>> = database.serverDao().observeServers().map { list -> list.map { it.toDomain() } }
    val activeServer: Flow<ServerProfile?> = database.serverDao().observeActiveServer().map { it?.toDomain() }

    suspend fun hasSavedServer(): Boolean = withContext(Dispatchers.IO) {
        database.serverDao().countServers() > 0
    }

    fun categories(
        serverId: Long,
        type: ContentType,
        hideEmpty: Boolean = false,
        hideNoLogo: Boolean = false,
    ): Flow<List<Category>> {
        val source = if (hideEmpty) {
            database.categoryDao().observeNonEmpty(serverId, type, hideNoLogo)
        } else {
            database.categoryDao().observe(serverId, type)
        }
        return source.map { it.map { entity -> entity.toDomain() } }
    }

    fun mediaByCategory(
        serverId: Long,
        type: ContentType,
        categoryId: String,
        sortOption: SortOption = SortOption.SERVER_ORDER,
        hideNoLogo: Boolean = false,
    ): Flow<PagingData<MediaItem>> = Pager(
        config = PagingConfig(pageSize = 50, enablePlaceholders = false),
        pagingSourceFactory = {
            database.mediaDao().observeByCategoryPaging(serverId, type, categoryId, sortOption.name, hideNoLogo)
        }
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    fun mediaByType(
        serverId: Long,
        type: ContentType,
        sortOption: SortOption = SortOption.SERVER_ORDER,
        hideNoLogo: Boolean = false,
    ): Flow<PagingData<MediaItem>> = Pager(
        config = PagingConfig(pageSize = 50, enablePlaceholders = false),
        pagingSourceFactory = { database.mediaDao().observeByTypePaging(serverId, type, sortOption.name, hideNoLogo) }
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    fun liveZapItems(
        serverId: Long,
        categoryId: String,
        sortOption: SortOption = SortOption.SERVER_ORDER,
        hideNoLogo: Boolean = false,
    ): Flow<List<MediaItem>> =
        database.mediaDao()
            .observeLiveZapItems(serverId, categoryId, sortOption.name, hideNoLogo)
            .map { list -> list.map { entity -> entity.toDomain() } }

    fun latestLive(serverId: Long): Flow<PagingData<MediaItem>> = Pager(
        config = PagingConfig(pageSize = 50, enablePlaceholders = false),
        pagingSourceFactory = { database.mediaDao().observeLatestPaging(serverId, listOf(ContentType.LIVE)) }
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    fun latestMovies(serverId: Long): Flow<PagingData<MediaItem>> = Pager(
        config = PagingConfig(pageSize = 50, enablePlaceholders = false),
        pagingSourceFactory = { database.mediaDao().observeLatestPaging(serverId, listOf(ContentType.MOVIE)) }
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    fun latestSeries(serverId: Long): Flow<PagingData<MediaItem>> = Pager(
        config = PagingConfig(pageSize = 50, enablePlaceholders = false),
        pagingSourceFactory = { database.mediaDao().observeLatestPaging(serverId, listOf(ContentType.SERIES)) }
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    fun favorites(serverId: Long): Flow<PagingData<MediaItem>> = Pager(
        config = PagingConfig(pageSize = 50, enablePlaceholders = false),
        pagingSourceFactory = { database.mediaDao().observeFavoritesPaging(serverId) }
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }


    fun episodes(serverId: Long, seriesId: String): Flow<List<MediaItem>> =
        database.mediaDao().observeEpisodes(serverId, seriesId).map { it.map { entity -> entity.toDomain() } }

    fun continueWatching(serverId: Long): Flow<PagingData<MediaItem>> = Pager(
        config = PagingConfig(pageSize = 30, enablePlaceholders = false),
        pagingSourceFactory = { database.mediaDao().observeContinueWatchingPaging(serverId) },
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    fun recentlyPlayed(serverId: Long, type: ContentType): Flow<PagingData<MediaItem>> = Pager(
        config = PagingConfig(pageSize = 30, enablePlaceholders = false),
        pagingSourceFactory = { database.mediaDao().observeRecentlyPlayedPaging(serverId, type) },
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    fun search(serverId: Long, query: String): Flow<PagingData<MediaItem>> = Pager(
        config = PagingConfig(pageSize = 50, enablePlaceholders = false),
        pagingSourceFactory = { database.mediaDao().searchPaging(serverId, "%${query.trim()}%") },
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    suspend fun get(serverId: Long, id: String, type: ContentType): MediaItem? =
        database.mediaDao().get(serverId, id, type)?.toDomain()

    suspend fun findMedia(serverId: Long, id: String, type: ContentType): MediaItem? {
        val direct = database.mediaDao().get(serverId, id, type)?.toDomain()
        if (direct != null) return direct
        return if (serverId == 0L) database.mediaDao().getAnyServer(id, type)?.toDomain() else null
    }

    suspend fun refreshSeriesDetails(server: ServerProfile, series: MediaItem) {
        if (server.kind != LoginKind.XTREAM || series.seriesId.isBlank()) return
        val credentials = XtreamCredentials(
            baseUrl = server.baseUrl.ensureTrailingSlash(),
            username = server.username,
            password = server.password,
            playlistUrl = server.playlistUrl,
        )
        val api = xtreamFactory(credentials.baseUrl)
        val response = runCatching {
            playerApiObject(
                api,
                credentials.username,
                credentials.password,
                mapOf("action" to "get_series_info", "series_id" to series.seriesId),
            )
        }.recoverCatching {
            playerApiObject(
                api,
                credentials.username,
                credentials.password,
                mapOf("action" to "get_series_info", "series" to series.seriesId),
            )
        }.getOrElse { throwable ->
            throw IllegalStateException(XtreamSupport.sanitizeError(throwable.message, server.host.ifBlank { XtreamSupport.hostLabel(server.baseUrl) }))
        }
        val (enrichedSeries, seasons, episodeItems) = XtreamSupport.enrichSeries(json, server.id, credentials, series, response)
        withContext(Dispatchers.IO) {
            database.mediaDao().upsertAll(listOf(enrichedSeries.toEntity()))
            database.seasonDao().deleteForSeries(server.id, enrichedSeries.seriesId.ifBlank { enrichedSeries.id })
            if (seasons.isNotEmpty()) database.seasonDao().insertAll(seasons)
            episodeItems.chunked(300).forEach { chunk -> database.mediaDao().upsertAll(chunk.map(MediaItem::toEntity)) }
        }
    }

    suspend fun refreshVodDetails(server: ServerProfile, movie: MediaItem): MediaItem {
        if (server.kind != LoginKind.XTREAM || movie.type != ContentType.MOVIE) return movie
        val api = xtreamFactory(server.baseUrl)
        val response = playerApiObject(
            api,
            server.username,
            server.password,
            mapOf("action" to "get_vod_info", "vod_id" to movie.id),
        )
        val (enriched, details) = XtreamSupport.enrichVod(json, server.id, movie, response)
        withContext(Dispatchers.IO) {
            database.vodDetailsDao().upsert(details)
            database.mediaDao().upsertAll(listOf(enriched.toEntity()))
        }
        return enriched
    }

    suspend fun toggleFavorite(item: MediaItem) {
        database.mediaDao().toggleFavorite(item.serverId, item.id, item.type, System.currentTimeMillis())
    }

    suspend fun notePlaybackStart(item: MediaItem) {
        database.mediaDao().markPlayed(item.serverId, item.id, item.type, System.currentTimeMillis())
    }

    suspend fun updateWatch(item: MediaItem, positionMs: Long, durationMs: Long) {
        val safeDuration = durationMs.coerceAtLeast(0)
        val completion = if (safeDuration > 0) positionMs.toDouble() / safeDuration.toDouble() else 0.0
        val normalizedPosition = when {
            safeDuration <= 0 -> 0L
            completion >= 0.95 -> 0L
            positionMs < 5_000 -> 0L
            else -> positionMs.coerceAtMost(safeDuration)
        }
        database.mediaDao().updateWatch(item.serverId, item.id, item.type, normalizedPosition, safeDuration, System.currentTimeMillis())
        pushWatchProgress(item, normalizedPosition, safeDuration)
    }

    suspend fun syncWatchProgressFromCloud(item: MediaItem): MediaItem {
        val service = supabaseService ?: return item
        val server = database.serverDao().getServer(item.serverId)?.toDomain() ?: return item
        val sourceKey = server.sourceKey.ifBlank { sourceKey(server.kind.name.lowercase(Locale.US), server.baseUrl.ifBlank { server.playlistUrl }) }
        val remote = runCatching {
            withContext(Dispatchers.IO) {
                service.watchProgress(
                    anonKey = BuildConfig.SUPABASE_ANON_KEY,
                    bearer = supabaseBearer,
                    sourceKeyEq = "eq.$sourceKey",
                    mediaIdEq = "eq.${item.id}",
                    mediaTypeEq = "eq.${item.type.name}",
                ).firstOrNull()
            }
        }.getOrNull() ?: return item
        if (remote.durationMs <= 0 || remote.positionMs <= 0) return item
        val completion = remote.positionMs.toDouble() / remote.durationMs.toDouble()
        if (completion >= 0.95) return item
        if (remote.updatedAtMs <= item.lastPlayedAt && item.watchPositionMs > 0) return item
        database.mediaDao().updateWatch(item.serverId, item.id, item.type, remote.positionMs, remote.durationMs, remote.updatedAtMs)
        return item.copy(
            watchPositionMs = remote.positionMs,
            watchDurationMs = remote.durationMs,
            lastPlayedAt = remote.updatedAtMs,
        )
    }

    suspend fun pendingRemoteCommands(deviceId: String): List<com.moalfarras.moplayer.data.network.RemoteCommandDto> {
        val service = supabaseService ?: return emptyList()
        return withContext(Dispatchers.IO) {
            service.pendingRemoteCommands(
                anonKey = BuildConfig.SUPABASE_ANON_KEY,
                bearer = supabaseBearer,
                deviceIdEq = "eq.$deviceId",
            )
        }
    }

    suspend fun acknowledgeRemoteCommand(id: String) {
        val service = supabaseService ?: return
        withContext(Dispatchers.IO) {
            service.acknowledgeRemoteCommand(
                anonKey = BuildConfig.SUPABASE_ANON_KEY,
                bearer = supabaseBearer,
                idEq = "eq.$id",
            ).close()
        }
    }

    suspend fun lastWatchedLive(serverId: Long): MediaItem? =
        database.mediaDao().lastPlayedLive(serverId)?.toDomain()

    suspend fun liveEpg(server: ServerProfile, item: MediaItem, limit: Int = 2): LiveEpgSnapshot {
        if (item.type != ContentType.LIVE) return LiveEpgSnapshot()
        val keys = buildList {
            item.tvgId.takeIf { it.isNotBlank() }?.let(::add)
            item.id.takeIf { it.isNotBlank() }?.let(::add)
        }.distinct()
        val now = System.currentTimeMillis()
        val local = withContext(Dispatchers.IO) {
            var programs = emptyList<com.moalfarras.moplayer.data.db.EpgProgramEntity>()
            for (key in keys) {
                val candidate = database.epgDao().upcoming(server.id, key, now, limit + 2)
                if (candidate.isNotEmpty()) {
                    programs = candidate
                    break
                }
            }
            programs
        }
        if (local.isNotEmpty()) return XtreamSupport.toLiveEpgSnapshot(local, now)
        if (server.kind != LoginKind.XTREAM) return LiveEpgSnapshot()

        val api = xtreamFactory(server.baseUrl.ensureTrailingSlash())
        val shortEpg = runCatching {
            val root = withContext(Dispatchers.IO) {
                json.parseToJsonElement(api.shortEpg(server.username, server.password, item.id, limit = 10).safeString()) as JsonObject
            }
            XtreamSupport.parseShortEpg(json, server.id, item.tvgId.ifBlank { item.id }, root)
        }.getOrDefault(emptyList())
        if (shortEpg.isEmpty()) return LiveEpgSnapshot()

        withContext(Dispatchers.IO) {
            database.epgDao().insertAll(shortEpg)
        }
        return XtreamSupport.toLiveEpgSnapshot(shortEpg, now)
    }

    suspend fun refreshFullEpg(server: ServerProfile): Int {
        val parsed = runCatching {
            withContext(Dispatchers.IO) {
                val xml = when {
                    server.kind == LoginKind.XTREAM -> {
                        val api = xtreamFactory(server.baseUrl.ensureTrailingSlash())
                        api.xmltv(server.username, server.password).safeString()
                    }
                    server.epgUrl.isNotBlank() -> playlistService.getText(server.epgUrl).safeString()
                    else -> ""
                }
                if (xml.isBlank()) emptyList() else XtreamSupport.parseXmltv(server.id, xml)
            }
        }.getOrDefault(emptyList())
        if (parsed.isEmpty()) return 0
        val now = System.currentTimeMillis()
        withContext(Dispatchers.IO) {
            database.withTransaction {
                database.epgDao().deleteForServer(server.id)
                parsed.chunked(5_000).forEach { database.epgDao().insertAll(it) }
                val current = database.syncStateDao().get(server.id)
                if (current != null) {
                    database.syncStateDao().upsert(
                        current.copy(
                            epgSyncedAt = now,
                            rawJson = """{"source":"${current.source}","status":"${current.status}","epg":${parsed.size}}""",
                            updatedAt = now,
                        ),
                    )
                }
            }
        }
        return parsed.size
    }

    suspend fun deleteServer(serverId: Long) = withContext(Dispatchers.IO) {
        database.categoryDao().deleteForServer(serverId)
        database.mediaDao().deleteForServer(serverId)
        database.accountInfoDao().deleteForServer(serverId)
        database.serverInfoDao().deleteForServer(serverId)
        database.vodDetailsDao().deleteForServer(serverId)
        database.seasonDao().deleteForServer(serverId)
        database.epgDao().deleteForServer(serverId)
        database.syncStateDao().deleteForServer(serverId)
        database.serverDao().delete(serverId)
    }

    suspend fun activateServer(serverId: Long) = withContext(Dispatchers.IO) {
        database.serverDao().touch(serverId, System.currentTimeMillis())
    }

    suspend fun clearWatchHistory(serverId: Long) = withContext(Dispatchers.IO) {
        database.mediaDao().clearProgress(serverId)
        database.mediaDao().clearRecentPlayback(serverId)
    }

    suspend fun clearEpgCache(serverId: Long) = withContext(Dispatchers.IO) {
        database.epgDao().deleteForServer(serverId)
    }

    suspend fun testServerConnection(server: ServerProfile): String {
        return when (server.kind) {
            LoginKind.XTREAM -> {
                val api = xtreamFactory(server.baseUrl.ensureTrailingSlash())
                runCatching {
                    val root = playerApiObject(api, server.username, server.password)
                    val snapshot = XtreamSupport.parseAccountSnapshot(json, server.id, root, System.currentTimeMillis())
                    "Xtream API OK - ${snapshot.accountStatus.ifBlank { "reachable" }}"
                }.getOrElse { throwable ->
                    throw IllegalStateException(XtreamSupport.sanitizeError(throwable.message, server.host.ifBlank { XtreamSupport.hostLabel(server.baseUrl) }))
                }
            }
            LoginKind.M3U -> runCatching {
                withContext(Dispatchers.IO) { playlistService.getText(server.playlistUrl).close() }
                "Playlist URL OK"
            }.getOrElse { throwable ->
                throw IllegalStateException(XtreamSupport.sanitizeError(throwable.message, server.host.ifBlank { XtreamSupport.hostLabel(server.playlistUrl) }))
            }
        }
    }

    suspend fun hasLocalLibrary(serverId: Long): Boolean = withContext(Dispatchers.IO) {
        database.mediaDao().countForServer(serverId) > 0
    }

    fun loginM3u(name: String, playlistUrl: String, epgUrl: String = ""): Flow<LoadProgress> = flow {
        val playlistCandidates = httpUrlCandidates(playlistUrl)
        val xtreamCandidates = playlistCandidates
            .mapNotNull { XtreamSupport.extractCredentialsFromPlaylistUrl(it) }
            .distinctBy { "${it.baseUrl.ensureTrailingSlash()}|${it.username}" }
        var lastFailure: Throwable? = null
        var preferredFailure: Throwable? = null

        xtreamCandidates.forEachIndexed { index, extracted ->
            val xtreamResult = runCatching {
                syncXtream(
                    name = name.ifBlank { XtreamSupport.hostLabel(extracted.baseUrl).replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.US) else it.toString() } },
                    credentials = extracted,
                    sourceLabel = "xtream",
                    playlistUrl = extracted.playlistUrl.ifBlank { playlistCandidates.first() },
                ) { emit(it) }
            }
            if (xtreamResult.isSuccess) {
                emit(LoadProgress("Ready", 100, 100))
                return@flow
            }
            lastFailure = xtreamResult.exceptionOrNull()
            preferredFailure = preferredFailure(preferredFailure, lastFailure)
            deleteEmptyServer(sourceKey("xtream", "${extracted.baseUrl.ensureTrailingSlash()}|${extracted.username}"))
            if (index == xtreamCandidates.lastIndex) {
                emit(LoadProgress("Xtream unavailable, using playlist fallback", 8, 100))
            }
        }

        playlistCandidates.forEachIndexed { index, candidate ->
            val m3uResult = runCatching {
                syncM3u(name, candidate, epgUrl = epgUrl) { emit(it) }
            }
            if (m3uResult.isSuccess) {
                emit(LoadProgress("Ready", 100, 100))
                return@flow
            }
            lastFailure = m3uResult.exceptionOrNull()
            preferredFailure = preferredFailure(preferredFailure, lastFailure)
            deleteEmptyServer(sourceKey("m3u", candidate))
            if (index < playlistCandidates.lastIndex) {
                emit(LoadProgress("Trying alternate HTTP/HTTPS playlist URL", 10, 100))
            }
        }

        throw preferredFailure ?: lastFailure ?: IllegalStateException("M3U login failed")
    }

    fun loginM3uText(name: String, sourceName: String, playlistText: String): Flow<LoadProgress> = flow {
        require(playlistText.isNotBlank()) { "M3U file is empty" }
        syncM3uText(
            name = name.ifBlank { sourceName.ifBlank { "Imported M3U" } },
            sourceName = sourceName.ifBlank { "local-file.m3u" },
            playlistText = playlistText,
        ) { emit(it) }
        emit(LoadProgress("Ready", 100, 100))
    }

    fun loginXtream(name: String, baseUrl: String, username: String, password: String): Flow<LoadProgress> = flow {
        var lastFailure: Throwable? = null
        val candidates = httpUrlCandidates(baseUrl, trailingSlash = true)
        candidates.forEachIndexed { index, candidate ->
            val result = runCatching {
                syncXtream(
                    name = name.ifBlank { XtreamSupport.hostLabel(candidate).replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.US) else it.toString() } },
                    credentials = XtreamCredentials(candidate.ensureTrailingSlash(), username, password),
                    sourceLabel = "xtream",
                ) { emit(it) }
            }
            if (result.isSuccess) {
                emit(LoadProgress("Ready", 100, 100))
                return@flow
            }
            lastFailure = result.exceptionOrNull()
            deleteEmptyServer(sourceKey("xtream", "${candidate.ensureTrailingSlash()}|$username"))
            if (index < candidates.lastIndex) {
                emit(LoadProgress("Trying alternate HTTP/HTTPS server URL", 8, 100))
            }
        }
        throw lastFailure ?: IllegalStateException("Xtream login failed")
    }

    suspend fun registerXtreamSource(name: String, baseUrl: String, username: String, password: String, playlistUrl: String = ""): ServerProfile {
        val normalizedBase = httpUrlCandidates(baseUrl, trailingSlash = true).first().ensureTrailingSlash()
        val key = sourceKey("xtream", "$normalizedBase|$username")
        val existing = withContext(Dispatchers.IO) { database.serverDao().getServerBySourceKey(key)?.toDomain() }
        val server = ServerProfile(
            id = existing?.id ?: 0,
            name = name.ifBlank { XtreamSupport.hostLabel(normalizedBase).replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.US) else it.toString() } },
            kind = LoginKind.XTREAM,
            baseUrl = normalizedBase,
            username = username,
            password = password,
            playlistUrl = playlistUrl,
            createdAt = existing?.createdAt ?: System.currentTimeMillis(),
            lastSyncAt = existing?.lastSyncAt ?: 0,
            host = XtreamSupport.hostLabel(normalizedBase),
            lastSyncSource = "activation",
            sourceKey = key,
        )
        val serverId = upsertServer(server)
        return database.serverDao().getServer(serverId)?.toDomain() ?: server.copy(id = serverId)
    }

    fun refreshServer(server: ServerProfile): Flow<LoadProgress> = flow {
        if (server.kind == LoginKind.XTREAM) {
            var lastFailure: Throwable? = null
            val candidates = httpUrlCandidates(server.baseUrl, trailingSlash = true)
            candidates.forEachIndexed { index, candidate ->
                val result = runCatching {
                    syncXtream(
                        name = server.name,
                        credentials = XtreamCredentials(candidate.ensureTrailingSlash(), server.username, server.password, server.playlistUrl),
                        sourceLabel = "refresh",
                        existingServerId = server.id,
                    ) { emit(it) }
                }
                if (result.isSuccess) {
                    emit(LoadProgress("Ready", 100, 100))
                    return@flow
                }
                lastFailure = result.exceptionOrNull()
                if (index < candidates.lastIndex) {
                    emit(LoadProgress("Trying alternate HTTP/HTTPS server URL", 8, 100))
                }
            }
            throw lastFailure ?: IllegalStateException("Server refresh failed")
        } else {
            var lastFailure: Throwable? = null
            val candidates = httpUrlCandidates(server.playlistUrl)
            candidates.forEachIndexed { index, candidate ->
                val result = runCatching {
                    syncM3u(server.name, candidate, existingServerId = server.id, epgUrl = server.epgUrl) { emit(it) }
                }
                if (result.isSuccess) {
                    emit(LoadProgress("Ready", 100, 100))
                    return@flow
                }
                lastFailure = result.exceptionOrNull()
                if (index < candidates.lastIndex) {
                    emit(LoadProgress("Trying alternate HTTP/HTTPS playlist URL", 10, 100))
                }
            }
            throw lastFailure ?: IllegalStateException("Playlist refresh failed")
        }
    }

    fun refreshServerFast(server: ServerProfile): Flow<LoadProgress> = flow {
        if (server.kind != LoginKind.XTREAM) {
            refreshServer(server).collect { emit(it) }
            return@flow
        }
        var lastFailure: Throwable? = null
        val candidates = httpUrlCandidates(server.baseUrl, trailingSlash = true)
        candidates.forEachIndexed { index, candidate ->
            val result = runCatching {
                syncXtreamIncremental(
                    server = server.copy(baseUrl = candidate.ensureTrailingSlash()),
                    sourceLabel = "background-refresh",
                ) { emit(it) }
            }
            if (result.isSuccess) {
                emit(LoadProgress("Ready", 100, 100))
                return@flow
            }
            lastFailure = result.exceptionOrNull()
            if (index < candidates.lastIndex) {
                emit(LoadProgress("Trying alternate HTTP/HTTPS server URL", 8, 100))
            }
        }
        throw lastFailure ?: IllegalStateException("Background server refresh failed")
    }

    fun loginActivationCode(code: String): Flow<LoadProgress> = flow {
        val service = supabaseService ?: error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to gradle.properties.")
        val cleanCode = code.trim().uppercase(Locale.US)
        emit(LoadProgress("Checking activation code", 5, 100))
        val rows = withContext(Dispatchers.IO) {
            service.activationCode(
                anonKey = BuildConfig.SUPABASE_ANON_KEY,
                bearer = supabaseBearer,
                codeEq = "eq.$cleanCode",
            )
        }
        val activation = rows.firstOrNull() ?: error("Activation code not found")
        if (activation.revoked) error("Activation code is revoked")
        emit(LoadProgress("Activation accepted", 20, 100))
        when (activation.serverType.lowercase(Locale.US)) {
            "xtream", "xstream" -> {
                loginXtream(
                    name = activation.serverName.ifBlank { cleanCode },
                    baseUrl = activation.baseUrl,
                    username = activation.username,
                    password = activation.password,
                ).collect { emit(it) }
            }
            else -> {
                loginM3u(
                    name = activation.serverName.ifBlank { cleanCode },
                    playlistUrl = activation.playlistUrl.ifBlank { activation.baseUrl },
                    epgUrl = activation.epgUrl,
                ).collect { emit(it) }
            }
        }
    }

    suspend fun createDeviceActivation(deviceName: String): DeviceActivationSession {
        val service = supabaseService ?: error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY.")
        val publicDeviceId = publicDeviceId()
        val sourcePullToken = secureToken(32)
        val webResponse = withContext(Dispatchers.IO) {
            service.createWebDeviceActivation(
                url = activationApiUrl("create"),
                body = WebActivationCreateRequestDto(
                    publicDeviceId = publicDeviceId,
                    deviceName = deviceName.ifBlank { "Android TV" },
                    appVersion = BuildConfig.VERSION_NAME,
                    sourcePullToken = sourcePullToken,
                    productSlug = BuildConfig.APP_PRODUCT_SLUG,
                ),
            )
        }
        val webCode = webResponse.code.trim().uppercase(Locale.US)
        require(webCode.isNotBlank()) { webResponse.message.ifBlank { "Activation backend did not return a code" } }
        val verificationUrl = BuildConfig.ACTIVATION_URL
        val completeUrl = verificationUrl.withQueryParameter("code", webCode)
        val expiresAt = webResponse.expiresAt.parseInstantOr(
            System.currentTimeMillis() + webResponse.ttlSeconds.coerceAtLeast(60) * 1000L,
        )
        return DeviceActivationSession(
            deviceCode = webCode,
            userCode = webCode,
            verificationUrl = verificationUrl,
            verificationUrlComplete = completeUrl,
            expiresAt = expiresAt,
            intervalSeconds = 5,
            status = DeviceActivationStatus.WAITING,
            publicDeviceId = publicDeviceId,
            sourcePullToken = sourcePullToken,
        )
    }

    suspend fun pollDeviceActivation(session: DeviceActivationSession): Pair<DeviceActivationSession, ActivatedProfile?> {
        val service = supabaseService ?: error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY.")
        if (System.currentTimeMillis() >= session.expiresAt) {
            return session.copy(status = DeviceActivationStatus.EXPIRED, error = "Activation code expired") to null
        }
        if (session.publicDeviceId.isNotBlank() && session.sourcePullToken.isNotBlank()) {
            val statusResponse = withContext(Dispatchers.IO) {
                service.webDeviceActivationStatus(
                    activationApiUrl(
                        "status",
                        mapOf(
                            "code" to session.deviceCode,
                            "product" to BuildConfig.APP_PRODUCT_SLUG,
                        ),
                    ),
                )
            }
            return when (statusResponse.status.lowercase(Locale.US)) {
                "activated" -> {
                    val sourceResponse = withContext(Dispatchers.IO) {
                        service.webDeviceActivationSource(
                            activationApiUrl(
                                "source",
                                mapOf(
                                    "publicDeviceId" to session.publicDeviceId,
                                    "token" to session.sourcePullToken,
                                    "product" to BuildConfig.APP_PRODUCT_SLUG,
                                ),
                            ),
                        )
                    }
                    val profile = sourceResponse.source?.toActivatedProfile()
                    if (profile != null) {
                        session.copy(status = DeviceActivationStatus.ACTIVATED) to profile
                    } else {
                        val waitingMessage = sourceResponse.message.ifBlank {
                            statusResponse.sourceMessage.ifBlank { "Waiting for playlist details" }
                        }
                        session.copy(status = DeviceActivationStatus.WAITING, error = waitingMessage) to null
                    }
                }
                "expired" -> session.copy(status = DeviceActivationStatus.EXPIRED, error = "Activation code expired") to null
                "error", "invalid" -> session.copy(
                    status = DeviceActivationStatus.ERROR,
                    error = statusResponse.message.ifBlank { "Activation failed" },
                ) to null
                else -> session.copy(
                    status = DeviceActivationStatus.WAITING,
                    expiresAt = statusResponse.expiresAt.parseInstantOr(session.expiresAt),
                    error = statusResponse.message,
                ) to null
            }
        }

        val row = withContext(Dispatchers.IO) {
            service.deviceActivation(
                anonKey = BuildConfig.SUPABASE_ANON_KEY,
                bearer = supabaseBearer,
                deviceCodeEq = "eq.${session.deviceCode}",
            ).firstOrNull()
        } ?: return session.copy(status = DeviceActivationStatus.ERROR, error = "Activation code was not found") to null

        val status = row.status.lowercase(Locale.US)
        return when (status) {
            "activated" -> {
                val profile = row.toActivatedProfile()
                if (profile == null) {
                    session.copy(status = DeviceActivationStatus.ERROR, error = row.errorMessage.ifBlank { "Activation is missing server details" }) to null
                } else {
                    runCatching {
                        withContext(Dispatchers.IO) {
                            service.updateDeviceActivationStatus(
                                anonKey = BuildConfig.SUPABASE_ANON_KEY,
                                bearer = supabaseBearer,
                                deviceCodeEq = "eq.${session.deviceCode}",
                                body = DeviceActivationUpdateDto(status = "consumed"),
                            ).close()
                        }
                    }
                    session.copy(status = DeviceActivationStatus.ACTIVATED) to profile
                }
            }
            "expired" -> session.copy(status = DeviceActivationStatus.EXPIRED, error = "Activation code expired") to null
            "error" -> session.copy(status = DeviceActivationStatus.ERROR, error = row.errorMessage.ifBlank { "Activation failed" }) to null
            "consumed" -> session.copy(status = DeviceActivationStatus.ERROR, error = "Activation code was already used") to null
            else -> session.copy(
                status = DeviceActivationStatus.WAITING,
                intervalSeconds = row.pollIntervalSeconds.coerceAtLeast(3),
                expiresAt = row.expiresAt.parseInstantOr(session.expiresAt),
            ) to null
        }
    }

    private suspend fun syncM3u(
        name: String,
        playlistUrl: String,
        existingServerId: Long = 0,
        epgUrl: String = "",
        progress: suspend (LoadProgress) -> Unit,
    ) {
        progress(LoadProgress("Connecting to M3U server", 0, 100))
        progress(LoadProgress("Downloading playlist", 18, 100))
        val parsedPreview = withContext(Dispatchers.IO) {
            playlistService.getText(playlistUrl).use { body ->
                progress(LoadProgress("Parsing channels and VOD", 48, 100))
                body.charStream().buffered().useLines { lines ->
                    parser.parse(existingServerId, lines)
                }
            }
        }
        require(parsedPreview.media.any { it.type != ContentType.SERIES || it.streamUrl.isNotBlank() }) {
            "No playable items were found in this M3U playlist"
        }
        val server = ServerProfile(
            id = existingServerId,
            name = name.ifBlank { playlistUrl.hostLabel() },
            kind = LoginKind.M3U,
            baseUrl = playlistUrl.hostLabel(),
            playlistUrl = playlistUrl,
            host = XtreamSupport.hostLabel(playlistUrl),
            lastSyncSource = "m3u",
            epgUrl = epgUrl.trim(),
            sourceKey = sourceKey("m3u", playlistUrl),
        )
        val serverId = upsertServer(server)
        val parsed = parsedPreview.withServerId(serverId)
        progress(LoadProgress("Loading XMLTV guide", 62, 100))
        val epgPrograms = if (epgUrl.isNotBlank()) {
            runCatching {
                withContext(Dispatchers.IO) {
                    XtreamSupport.parseXmltv(serverId, playlistService.getText(epgUrl).safeString())
                }
            }.getOrDefault(emptyList())
        } else {
            emptyList()
        }
        val now = System.currentTimeMillis()
        val syncState = com.moalfarras.moplayer.data.db.SyncStateEntity(
            serverId = serverId,
            source = "m3u",
            status = "ready",
            lastSyncAt = now,
            liveSyncedAt = now,
            vodSyncedAt = now,
            seriesSyncedAt = now,
            epgSyncedAt = if (epgPrograms.isNotEmpty()) now else 0,
            lastError = "",
            rawJson = """{"source":"m3u","epg":${epgPrograms.size}}""",
            updatedAt = now,
        )
        progress(LoadProgress("Optimizing local library", 78, 100))
        withContext(Dispatchers.IO) {
            database.replaceServerContent(
                serverId = serverId,
                categories = parsed.categories.map { it.toEntity() },
                media = parsed.media.map { it.toEntity() },
                accountInfo = null,
                serverInfo = null,
                syncState = syncState,
                epgPrograms = epgPrograms,
            )
            database.serverDao().updateRuntimeInfo(
                serverId = serverId,
                lastSyncAt = now,
                accountStatus = "",
                expiryDate = 0,
                activeConnections = 0,
                maxConnections = 0,
                allowedOutputFormats = "",
                timezone = "",
                serverMessage = "",
                lastSyncSource = "m3u",
                epgUrl = epgUrl.trim(),
                sourceKey = sourceKey("m3u", playlistUrl),
            )
        }
    }

    private suspend fun deleteEmptyServer(sourceKey: String) = withContext(Dispatchers.IO) {
        val server = database.serverDao().getServerBySourceKey(sourceKey) ?: return@withContext
        if (database.mediaDao().countForServer(server.id) == 0) {
            database.serverDao().delete(server.id)
        }
    }

    private fun com.moalfarras.moplayer.data.parser.ParsedPlaylist.withServerId(serverId: Long): com.moalfarras.moplayer.data.parser.ParsedPlaylist =
        if (categories.all { it.serverId == serverId } && media.all { it.serverId == serverId }) {
            this
        } else {
            com.moalfarras.moplayer.data.parser.ParsedPlaylist(
                categories = categories.map { it.copy(serverId = serverId) },
                media = media.map { it.copy(serverId = serverId) },
            )
        }

    private suspend fun syncM3uText(
        name: String,
        sourceName: String,
        playlistText: String,
        existingServerId: Long = 0,
        progress: suspend (LoadProgress) -> Unit,
    ) {
        val sourceLabel = "file:${sourceName.take(80)}"
        progress(LoadProgress("Reading M3U file", 12, 100))
        val server = ServerProfile(
            id = existingServerId,
            name = name,
            kind = LoginKind.M3U,
            baseUrl = sourceLabel,
            playlistUrl = sourceLabel,
            host = sourceName.ifBlank { "Local M3U" },
            lastSyncSource = "m3u-file",
            sourceKey = sourceKey("m3u-file", sourceName),
        )
        val serverId = upsertServer(server)
        progress(LoadProgress("Parsing channels and VOD", 48, 100))
        val parsed = withContext(Dispatchers.Default) { parser.parse(serverId, playlistText) }
        require(parsed.media.isNotEmpty()) { "No playable items were found in this M3U file" }
        val now = System.currentTimeMillis()
        val syncState = com.moalfarras.moplayer.data.db.SyncStateEntity(
            serverId = serverId,
            source = "m3u-file",
            status = "ready",
            lastSyncAt = now,
            liveSyncedAt = now,
            vodSyncedAt = now,
            seriesSyncedAt = now,
            epgSyncedAt = 0,
            lastError = "",
            rawJson = """{"source":"m3u-file","file":"${sourceName.take(80)}"}""",
            updatedAt = now,
        )
        progress(LoadProgress("Optimizing local library", 78, 100))
        withContext(Dispatchers.IO) {
            database.replaceServerContent(
                serverId = serverId,
                categories = parsed.categories.map { it.toEntity() },
                media = parsed.media.map { it.toEntity() },
                accountInfo = null,
                serverInfo = null,
                syncState = syncState,
                epgPrograms = emptyList(),
            )
            database.serverDao().updateRuntimeInfo(
                serverId = serverId,
                lastSyncAt = now,
                accountStatus = "",
                expiryDate = 0,
                activeConnections = 0,
                maxConnections = 0,
                allowedOutputFormats = "",
                timezone = "",
                serverMessage = "",
                lastSyncSource = "m3u-file",
                epgUrl = "",
                sourceKey = sourceKey("m3u-file", sourceName),
            )
        }
    }

    private suspend fun syncXtream(
        name: String,
        credentials: XtreamCredentials,
        sourceLabel: String,
        playlistUrl: String = credentials.playlistUrl,
        existingServerId: Long = 0,
        progress: suspend (LoadProgress) -> Unit,
    ) {
        progress(LoadProgress("Connecting to IPTV server", 0, 100))
        val server = ServerProfile(
            id = existingServerId,
            name = name,
            kind = LoginKind.XTREAM,
            baseUrl = credentials.baseUrl.ensureTrailingSlash(),
            username = credentials.username,
            password = credentials.password,
            playlistUrl = playlistUrl,
            host = XtreamSupport.hostLabel(credentials.baseUrl),
            lastSyncSource = sourceLabel,
            sourceKey = sourceKey("xtream", "${credentials.baseUrl}|${credentials.username}"),
        )
        val serverId = upsertServer(server)
        val api = xtreamFactory(server.baseUrl)
        val payload = runCatching {
            loadXtream(serverId, credentials.copy(baseUrl = server.baseUrl), api, progress)
        }.getOrElse { throwable ->
            throw IllegalStateException(XtreamSupport.sanitizeError(throwable.message, server.host.ifBlank { XtreamSupport.hostLabel(server.baseUrl) }))
        }
        progress(LoadProgress("Saving local library", 90, 100))
        withContext(Dispatchers.IO) {
            database.replaceServerContent(
                serverId = serverId,
                categories = payload.categories.map { it.toEntity() },
                media = payload.media.map { it.toEntity() },
                accountInfo = payload.accountInfo,
                serverInfo = payload.serverInfo,
                syncState = payload.syncState,
                epgPrograms = payload.epgPrograms,
            )
            database.serverDao().updateRuntimeInfo(
                serverId = serverId,
                lastSyncAt = payload.syncState.lastSyncAt,
                accountStatus = payload.accountInfo?.status.orEmpty(),
                expiryDate = payload.accountInfo?.expiryDate ?: 0,
                activeConnections = payload.accountInfo?.activeConnections ?: 0,
                maxConnections = payload.accountInfo?.maxConnections ?: 0,
                allowedOutputFormats = payload.accountInfo?.allowedOutputFormats.orEmpty(),
                timezone = payload.serverInfo?.timezone.orEmpty(),
                serverMessage = payload.serverInfo?.message.orEmpty(),
                lastSyncSource = sourceLabel,
                epgUrl = "",
                sourceKey = sourceKey("xtream", "${server.baseUrl}|${server.username}"),
            )
        }
    }

    private suspend fun syncXtreamIncremental(
        server: ServerProfile,
        sourceLabel: String,
        progress: suspend (LoadProgress) -> Unit,
    ) {
        val credentials = XtreamCredentials(
            baseUrl = server.baseUrl.ensureTrailingSlash(),
            username = server.username,
            password = server.password,
            playlistUrl = server.playlistUrl,
        )
        progress(LoadProgress("Connecting to IPTV server", 0, 100))
        val api = xtreamFactory(credentials.baseUrl)
        val startedAt = System.currentTimeMillis()
        val accountSnapshot = runCatching {
            XtreamSupport.parseAccountSnapshot(
                json = json,
                serverId = server.id,
                root = playerApiObject(api, credentials.username, credentials.password),
                updatedAt = startedAt,
            )
        }.getOrElse { throwable ->
            throw IllegalStateException(XtreamSupport.sanitizeError(throwable.message, server.host.ifBlank { XtreamSupport.hostLabel(server.baseUrl) }))
        }

        database.serverDao().updateRuntimeInfo(
            serverId = server.id,
            lastSyncAt = startedAt,
            accountStatus = accountSnapshot.accountInfo?.status.orEmpty(),
            expiryDate = accountSnapshot.accountInfo?.expiryDate ?: 0,
            activeConnections = accountSnapshot.accountInfo?.activeConnections ?: 0,
            maxConnections = accountSnapshot.accountInfo?.maxConnections ?: 0,
            allowedOutputFormats = accountSnapshot.accountInfo?.allowedOutputFormats.orEmpty(),
            timezone = accountSnapshot.serverInfo?.timezone.orEmpty(),
            serverMessage = accountSnapshot.serverInfo?.message.orEmpty(),
            lastSyncSource = sourceLabel,
            epgUrl = "",
            sourceKey = sourceKey("xtream", "${credentials.baseUrl}|${credentials.username}"),
        )

        syncXtreamSection(
            serverId = server.id,
            credentials = credentials,
            api = api,
            accountSnapshot = accountSnapshot,
            type = ContentType.LIVE,
            categoryAction = "get_live_categories",
            streamAction = "get_live_streams",
            progressPhase = "Loading live channels",
            progressValue = 18,
            progress = progress,
        ) { categories, array ->
            XtreamSupport.parseLiveStreams(
                json = json,
                serverId = server.id,
                credentials = credentials,
                allowedFormats = accountSnapshot.allowedOutputFormats,
                categories = categories.associate { it.id to it.name },
                array = array,
            )
        }.also { emitCounts ->
            progress(LoadProgress("Saved ${emitCounts.second} live channels", 42, 100))
        }

        syncXtreamSection(
            serverId = server.id,
            credentials = credentials,
            api = api,
            accountSnapshot = accountSnapshot,
            type = ContentType.MOVIE,
            categoryAction = "get_vod_categories",
            streamAction = "get_vod_streams",
            progressPhase = "Loading movies",
            progressValue = 48,
            progress = progress,
        ) { categories, array ->
            XtreamSupport.parseVodStreams(
                json = json,
                serverId = server.id,
                credentials = credentials,
                categories = categories.associate { it.id to it.name },
                array = array,
            )
        }.also { emitCounts ->
            progress(LoadProgress("Saved ${emitCounts.second} movies", 70, 100))
        }

        syncXtreamSection(
            serverId = server.id,
            credentials = credentials,
            api = api,
            accountSnapshot = accountSnapshot,
            type = ContentType.SERIES,
            categoryAction = "get_series_categories",
            streamAction = "get_series",
            progressPhase = "Loading series",
            progressValue = 76,
            progress = progress,
        ) { categories, array ->
            XtreamSupport.parseSeries(
                json = json,
                serverId = server.id,
                categories = categories.associate { it.id to it.name },
                array = array,
            )
        }.also { emitCounts ->
            progress(LoadProgress("Saved ${emitCounts.second} series", 96, 100))
        }
    }

    private suspend fun syncXtreamSection(
        serverId: Long,
        credentials: XtreamCredentials,
        api: XtreamService,
        accountSnapshot: XtreamAccountSnapshot,
        type: ContentType,
        categoryAction: String,
        streamAction: String,
        progressPhase: String,
        progressValue: Int,
        progress: suspend (LoadProgress) -> Unit,
        parseItems: (List<Category>, JsonArray) -> List<MediaItem>,
    ): Pair<Int, Int> {
        val (categories, items) = coroutineScope {
            val categoriesDeferred = async { playerApiArray(api, credentials.username, credentials.password, mapOf("action" to categoryAction)) }
            val streamsDeferred = async { playerApiArray(api, credentials.username, credentials.password, mapOf("action" to streamAction)) }
            val parsedCategories = XtreamSupport.parseCategories(json, serverId, type, categoriesDeferred.await())
            parsedCategories to parseItems(parsedCategories, streamsDeferred.await())
        }
        val now = System.currentTimeMillis()
        val currentState = withContext(Dispatchers.IO) { database.syncStateDao().get(serverId) }
        val syncState = com.moalfarras.moplayer.data.db.SyncStateEntity(
            serverId = serverId,
            source = "xtream",
            status = "ready",
            lastSyncAt = now,
            liveSyncedAt = if (type == ContentType.LIVE) now else currentState?.liveSyncedAt ?: 0,
            vodSyncedAt = if (type == ContentType.MOVIE) now else currentState?.vodSyncedAt ?: 0,
            seriesSyncedAt = if (type == ContentType.SERIES) now else currentState?.seriesSyncedAt ?: 0,
            epgSyncedAt = currentState?.epgSyncedAt ?: 0,
            lastError = "",
            rawJson = """{"phase":"$progressPhase","categories":${categories.size},"media":${items.size}}""",
            updatedAt = now,
        )
        progress(LoadProgress(progressPhase, progressValue, 100))
        withContext(Dispatchers.IO) {
            database.replaceServerContentTypes(
                serverId = serverId,
                types = listOf(type),
                categories = categories.map { it.toEntity() },
                media = items.map { it.toEntity() },
                accountInfo = accountSnapshot.accountInfo,
                serverInfo = accountSnapshot.serverInfo,
                syncState = syncState,
            )
        }
        return categories.size to items.size
    }

    private suspend fun loadXtream(
        serverId: Long,
        credentials: XtreamCredentials,
        api: XtreamService,
        progress: suspend (LoadProgress) -> Unit,
    ): XtreamSyncPayload = coroutineScope {
        val startedAt = System.currentTimeMillis()
        val accountRoot = playerApiObject(api, credentials.username, credentials.password)
        val accountSnapshot = XtreamSupport.parseAccountSnapshot(json, serverId, accountRoot, startedAt)
        progress(LoadProgress("Loading categories", 12, 100))
        val liveCatsDeferred = async { playerApiArray(api, credentials.username, credentials.password, mapOf("action" to "get_live_categories")) }
        val vodCatsDeferred = async { playerApiArray(api, credentials.username, credentials.password, mapOf("action" to "get_vod_categories")) }
        val seriesCatsDeferred = async { playerApiArray(api, credentials.username, credentials.password, mapOf("action" to "get_series_categories")) }
        val categoryArrays = awaitAll(liveCatsDeferred, vodCatsDeferred, seriesCatsDeferred)
        val liveCategories = XtreamSupport.parseCategories(json, serverId, ContentType.LIVE, categoryArrays[0])
        val vodCategories = XtreamSupport.parseCategories(json, serverId, ContentType.MOVIE, categoryArrays[1])
        val seriesCategories = XtreamSupport.parseCategories(json, serverId, ContentType.SERIES, categoryArrays[2])
        progress(LoadProgress("Loading live streams", 30, 100))
        val liveDeferred = async { playerApiArray(api, credentials.username, credentials.password, mapOf("action" to "get_live_streams")) }
        progress(LoadProgress("Loading movies", 46, 100))
        val vodDeferred = async { playerApiArray(api, credentials.username, credentials.password, mapOf("action" to "get_vod_streams")) }
        progress(LoadProgress("Loading series", 62, 100))
        val seriesDeferred = async { playerApiArray(api, credentials.username, credentials.password, mapOf("action" to "get_series")) }
        val liveItems = XtreamSupport.parseLiveStreams(
            json = json,
            serverId = serverId,
            credentials = credentials,
            allowedFormats = accountSnapshot.allowedOutputFormats,
            categories = liveCategories.associate { it.id to it.name },
            array = liveDeferred.await(),
        )
        val vodItems = XtreamSupport.parseVodStreams(
            json = json,
            serverId = serverId,
            credentials = credentials,
            categories = vodCategories.associate { it.id to it.name },
            array = vodDeferred.await(),
        )
        val seriesItems = XtreamSupport.parseSeries(
            json = json,
            serverId = serverId,
            categories = seriesCategories.associate { it.id to it.name },
            array = seriesDeferred.await(),
        )
        val allCategories = buildList {
            addAll(liveCategories)
            addAll(vodCategories)
            addAll(seriesCategories)
        }
        val allMedia = buildList {
            addAll(liveItems)
            addAll(vodItems)
            addAll(seriesItems)
        }
        XtreamSyncPayload(
            categories = allCategories,
            media = allMedia,
            accountInfo = accountSnapshot.accountInfo,
            serverInfo = accountSnapshot.serverInfo,
            syncState = com.moalfarras.moplayer.data.db.SyncStateEntity(
                serverId = serverId,
                source = "xtream",
                status = "ready",
                lastSyncAt = System.currentTimeMillis(),
                liveSyncedAt = System.currentTimeMillis(),
                vodSyncedAt = System.currentTimeMillis(),
                seriesSyncedAt = System.currentTimeMillis(),
                epgSyncedAt = 0,
                lastError = "",
                rawJson = """{"categories":${allCategories.size},"media":${allMedia.size},"epg":"background"}""",
                updatedAt = System.currentTimeMillis(),
            ),
            epgPrograms = emptyList(),
        )
    }

    private suspend fun upsertServer(server: ServerProfile): Long = withContext(Dispatchers.IO) {
        val entity = server.toEntity().copy(
            createdAt = server.createdAt.takeIf { it > 0 } ?: System.currentTimeMillis(),
            host = server.host.ifBlank { XtreamSupport.hostLabel(server.baseUrl.ifBlank { server.playlistUrl }) },
            sourceKey = server.sourceKey.ifBlank { sourceKey(server.kind.name.lowercase(Locale.US), server.baseUrl.ifBlank { server.playlistUrl }) },
        )
        val generatedId = database.serverDao().upsert(
            entity,
        )
        server.id.takeIf { it > 0 } ?: generatedId
    }

    private suspend fun pushWatchProgress(item: MediaItem, positionMs: Long, durationMs: Long) {
        val service = supabaseService ?: return
        if (item.type == ContentType.LIVE || durationMs <= 0) return
        val completion = positionMs.toDouble() / durationMs.toDouble()
        if (completion >= 0.95) return
        val server = database.serverDao().getServer(item.serverId)?.toDomain() ?: return
        val sourceKey = server.sourceKey.ifBlank { sourceKey(server.kind.name.lowercase(Locale.US), server.baseUrl.ifBlank { server.playlistUrl }) }
        runCatching {
            withContext(Dispatchers.IO) {
                service.upsertWatchProgress(
                    anonKey = BuildConfig.SUPABASE_ANON_KEY,
                    bearer = supabaseBearer,
                    body = WatchProgressDto(
                        sourceKey = sourceKey,
                        mediaId = item.id,
                        mediaType = item.type.name,
                        positionMs = positionMs,
                        durationMs = durationMs,
                        updatedAtMs = System.currentTimeMillis(),
                        deviceId = runtimeDeviceId,
                    ),
                ).close()
            }
        }
    }

    private suspend fun playerApiObject(
        api: XtreamService,
        username: String,
        password: String,
        extra: Map<String, String> = emptyMap(),
    ): JsonObject {
        val query = buildMap {
            put("username", username)
            put("password", password)
            putAll(extra)
        }
        val element = withContext(Dispatchers.IO) { json.parseToJsonElement(api.rawPlayerApi(query).safeString()) }
        return element as? JsonObject ?: error("Unexpected server response")
    }

    private suspend fun playerApiArray(
        api: XtreamService,
        username: String,
        password: String,
        extra: Map<String, String>,
    ): JsonArray {
        val query = buildMap {
            put("username", username)
            put("password", password)
            putAll(extra)
        }
        val element = withContext(Dispatchers.IO) { json.parseToJsonElement(api.rawPlayerApi(query).safeString()) }
        return element as? JsonArray ?: when (element) {
            is JsonObject -> element["data"] as? JsonArray ?: JsonArray(emptyList())
            else -> JsonArray(emptyList())
        }
    }

    private fun String.ensureTrailingSlash(): String = if (endsWith('/')) this else "$this/"

    private fun httpUrlCandidates(raw: String, trailingSlash: Boolean = false): List<String> {
        val normalized = raw.trim()
        if (normalized.isBlank()) return emptyList()
        val withScheme = if (normalized.startsWith("http://", ignoreCase = true) || normalized.startsWith("https://", ignoreCase = true)) {
            normalized
        } else {
            "http://${normalized.trimStart('/')}"
        }
        val alternate = when {
            withScheme.startsWith("http://", ignoreCase = true) -> withScheme.replaceFirst("http://", "https://", ignoreCase = true)
            withScheme.startsWith("https://", ignoreCase = true) -> withScheme.replaceFirst("https://", "http://", ignoreCase = true)
            else -> withScheme
        }
        return listOf(withScheme, alternate)
            .map { if (trailingSlash) it.ensureTrailingSlash() else it }
            .distinct()
    }

    private fun preferredFailure(current: Throwable?, next: Throwable?): Throwable? {
        if (next == null) return current
        if (current == null) return next
        val nextMessage = next.message.orEmpty()
        val currentMessage = current.message.orEmpty()
        val nextIsTls = nextMessage.contains("handshake", ignoreCase = true) ||
            nextMessage.contains("ssl", ignoreCase = true)
        val currentIsTls = currentMessage.contains("handshake", ignoreCase = true) ||
            currentMessage.contains("ssl", ignoreCase = true)
        return when {
            currentIsTls && !nextIsTls -> next
            !currentIsTls && nextIsTls -> current
            else -> next
        }
    }

    private fun String.hostLabel(): String = runCatching {
        java.net.URI(this).host?.removePrefix("www.") ?: this
    }.getOrElse { this }.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.US) else it.toString() }

    private fun ResponseBody.safeString(): String = use { it.string() }
}

private val secureRandom = SecureRandom()

private fun secureToken(bytes: Int): String {
    val data = ByteArray(bytes)
    secureRandom.nextBytes(data)
    return data.joinToString("") { "%02x".format(it) }
}

private fun sourceKey(kind: String, value: String): String {
    val digest = java.security.MessageDigest.getInstance("SHA-1")
        .digest("$kind:${value.trim().lowercase(Locale.US)}".toByteArray(StandardCharsets.UTF_8))
    return "$kind:${digest.joinToString("") { "%02x".format(it) }}"
}

private fun shortUserCode(): String {
    val alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return buildString {
        repeat(8) { index ->
            if (index == 4) append('-')
            append(alphabet[secureRandom.nextInt(alphabet.length)])
        }
    }
}

private fun publicDeviceId(): String {
    val alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return buildString {
        append("MO-D-")
        repeat(24) { append(alphabet[secureRandom.nextInt(alphabet.length)]) }
    }
}

private val runtimeDeviceId: String by lazy { publicDeviceId() }

private fun activationApiUrl(path: String, query: Map<String, String> = emptyMap()): String {
    val origin = runCatching {
        val uri = java.net.URI(BuildConfig.ACTIVATION_URL)
        buildString {
            append(uri.scheme ?: "https")
            append("://")
            append(uri.host ?: "moalfarras.space")
            if (uri.port != -1) append(":").append(uri.port)
        }
    }.getOrDefault("https://moalfarras.space")
    val base = "$origin/api/app/activation/${path.trimStart('/')}"
    if (query.isEmpty()) return base
    val params = query.entries.joinToString("&") { (key, value) ->
        "${key.urlEncode()}=${value.urlEncode()}"
    }
    return "$base?$params"
}

private fun String.withQueryParameter(key: String, value: String): String {
    val separator = if ('?' in this) '&' else '?'
    return "$this$separator${key.urlEncode()}=${value.urlEncode()}"
}

private fun String.urlEncode(): String =
    URLEncoder.encode(this, StandardCharsets.UTF_8.name())

private fun String.parseInstantOr(fallback: Long): Long =
    runCatching { Instant.parse(this).toEpochMilli() }.getOrDefault(fallback)

private fun com.moalfarras.moplayer.data.network.DeviceActivationDto.toActivatedProfile(): ActivatedProfile? {
    val type = serverType.lowercase(Locale.US)
    return when (type) {
        "xtream", "xstream" -> {
            if (baseUrl.isBlank() || username.isBlank() || password.isBlank()) null else ActivatedProfile(
                name = serverName.ifBlank { XtreamSupport.hostLabel(baseUrl) },
                kind = LoginKind.XTREAM,
                baseUrl = baseUrl,
                username = username,
                password = password,
                playlistUrl = playlistUrl,
                epgUrl = epgUrl,
            )
        }
        "m3u", "m3u8" -> {
            val source = playlistUrl.ifBlank { baseUrl }
            if (source.isBlank()) null else ActivatedProfile(
                name = serverName.ifBlank { XtreamSupport.hostLabel(source) },
                kind = LoginKind.M3U,
                playlistUrl = source,
                epgUrl = epgUrl,
            )
        }
        else -> null
    }
}

private fun WebProviderSourceDto.toActivatedProfile(): ActivatedProfile? {
    return when (type.lowercase(Locale.US)) {
        "xtream", "xstream" -> {
            if (serverUrl.isBlank() || username.isBlank() || password.isBlank()) null else ActivatedProfile(
                name = name.ifBlank { XtreamSupport.hostLabel(serverUrl) },
                kind = LoginKind.XTREAM,
                baseUrl = serverUrl,
                username = username,
                password = password,
                playlistUrl = playlistUrl,
                epgUrl = epgUrl,
            )
        }
        "m3u", "m3u8" -> {
            val source = playlistUrl.ifBlank { serverUrl }
            if (source.isBlank()) null else ActivatedProfile(
                name = name.ifBlank { XtreamSupport.hostLabel(source) },
                kind = LoginKind.M3U,
                playlistUrl = source,
                epgUrl = epgUrl,
            )
        }
        else -> null
    }
}
