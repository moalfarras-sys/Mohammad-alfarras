package com.moalfarras.moplayer.data.repository

import androidx.room.withTransaction
import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.PagingData
import androidx.paging.map
import com.moalfarras.moplayer.BuildConfig
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

    fun categories(serverId: Long, type: ContentType): Flow<List<Category>> =
        database.categoryDao().observe(serverId, type).map { it.map { entity -> entity.toDomain() } }

    fun mediaByCategory(serverId: Long, type: ContentType, categoryId: String): Flow<PagingData<MediaItem>> = Pager(
        config = PagingConfig(pageSize = 50, enablePlaceholders = false),
        pagingSourceFactory = { database.mediaDao().observeByCategoryPaging(serverId, type, categoryId) }
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    fun mediaByType(serverId: Long, type: ContentType): Flow<PagingData<MediaItem>> = Pager(
        config = PagingConfig(pageSize = 50, enablePlaceholders = false),
        pagingSourceFactory = { database.mediaDao().observeByTypePaging(serverId, type) }
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

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
        if (server.kind != LoginKind.XTREAM) return 0
        val api = xtreamFactory(server.baseUrl.ensureTrailingSlash())
        val parsed = runCatching {
            withContext(Dispatchers.IO) {
                XtreamSupport.parseXmltv(server.id, api.xmltv(server.username, server.password).safeString())
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

    fun loginM3u(name: String, playlistUrl: String): Flow<LoadProgress> = flow {
        val extracted = XtreamSupport.extractCredentialsFromPlaylistUrl(playlistUrl)
        if (extracted != null) {
            val xtreamResult = runCatching {
                syncXtream(
                    name = name.ifBlank { XtreamSupport.hostLabel(extracted.baseUrl).replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.US) else it.toString() } },
                    credentials = extracted,
                    sourceLabel = "xtream",
                    playlistUrl = playlistUrl,
                ) { emit(it) }
            }
            if (xtreamResult.isSuccess) {
                emit(LoadProgress("Ready", 100, 100))
                return@flow
            }
            emit(LoadProgress("Xtream unavailable, using playlist fallback", 8, 100))
        }
        syncM3u(name, playlistUrl) { emit(it) }
        emit(LoadProgress("Ready", 100, 100))
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
        syncXtream(
            name = name.ifBlank { XtreamSupport.hostLabel(baseUrl).replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.US) else it.toString() } },
            credentials = XtreamCredentials(baseUrl.ensureTrailingSlash(), username, password),
            sourceLabel = "xtream",
        ) { emit(it) }
        emit(LoadProgress("Ready", 100, 100))
    }

    fun refreshServer(server: ServerProfile): Flow<LoadProgress> = flow {
        if (server.kind == LoginKind.XTREAM) {
            syncXtream(
                name = server.name,
                credentials = XtreamCredentials(server.baseUrl, server.username, server.password, server.playlistUrl),
                sourceLabel = "refresh",
                existingServerId = server.id,
            ) { emit(it) }
        } else {
            syncM3u(server.name, server.playlistUrl, existingServerId = server.id) { emit(it) }
        }
        emit(LoadProgress("Ready", 100, 100))
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
                ),
            )
        }
        val webCode = webResponse.code.trim().uppercase(Locale.US)
        require(webCode.isNotBlank()) { webResponse.message.ifBlank { "Activation backend did not return a code" } }
        val verificationUrl = BuildConfig.ACTIVATION_URL.substringBefore('?')
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

    private suspend fun createLegacyDeviceActivation(deviceName: String): DeviceActivationSession {
        val service = supabaseService ?: error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY.")
        val expiresAt = System.currentTimeMillis() + 10 * 60 * 1000L
        val deviceCode = secureToken(32)
        val userCode = shortUserCode()
        val verificationUrl = BuildConfig.ACTIVATION_URL.substringBefore('?')
        val separator = if ('?' in verificationUrl) '&' else '?'
        val completeUrl = "$verificationUrl${separator}device_code=$deviceCode&user_code=$userCode"
        val body = DeviceActivationInsertDto(
            deviceCode = deviceCode,
            userCode = userCode,
            verificationUrl = verificationUrl,
            verificationUrlComplete = completeUrl,
            deviceName = deviceName.ifBlank { "Android TV" },
            deviceLabel = deviceName.ifBlank { "Android TV" },
            appVersion = BuildConfig.VERSION_NAME,
            expiresAt = Instant.ofEpochMilli(expiresAt).toString(),
            pollIntervalSeconds = 5,
        )
        val row = withContext(Dispatchers.IO) {
            service.createDeviceActivation(
                anonKey = BuildConfig.SUPABASE_ANON_KEY,
                bearer = supabaseBearer,
                body = body,
            ).firstOrNull()
        } ?: error("Activation backend did not return a device code")
        return DeviceActivationSession(
            deviceCode = row.deviceCode.ifBlank { deviceCode },
            userCode = row.userCode.ifBlank { userCode },
            verificationUrl = row.verificationUrl.ifBlank { verificationUrl },
            verificationUrlComplete = row.verificationUrlComplete.ifBlank { completeUrl },
            expiresAt = row.expiresAt.parseInstantOr(expiresAt),
            intervalSeconds = row.pollIntervalSeconds.coerceAtLeast(3),
            status = DeviceActivationStatus.WAITING,
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
                    activationApiUrl("status", mapOf("code" to session.deviceCode)),
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
        progress: suspend (LoadProgress) -> Unit,
    ) {
        progress(LoadProgress("Connecting to M3U server", 0, 100))
        val server = ServerProfile(
            id = existingServerId,
            name = name.ifBlank { playlistUrl.hostLabel() },
            kind = LoginKind.M3U,
            baseUrl = playlistUrl.hostLabel(),
            playlistUrl = playlistUrl,
            host = XtreamSupport.hostLabel(playlistUrl),
            lastSyncSource = "m3u",
        )
        val serverId = upsertServer(server)
        progress(LoadProgress("Downloading playlist", 18, 100))
        val body = withContext(Dispatchers.IO) { playlistService.getText(playlistUrl).safeString() }
        progress(LoadProgress("Parsing channels and VOD", 48, 100))
        val parsed = withContext(Dispatchers.Default) { parser.parse(serverId, body) }
        val syncState = com.moalfarras.moplayer.data.db.SyncStateEntity(
            serverId = serverId,
            source = "m3u",
            status = "ready",
            lastSyncAt = System.currentTimeMillis(),
            liveSyncedAt = System.currentTimeMillis(),
            vodSyncedAt = System.currentTimeMillis(),
            seriesSyncedAt = System.currentTimeMillis(),
            epgSyncedAt = 0,
            lastError = "",
            rawJson = """{"source":"m3u"}""",
            updatedAt = System.currentTimeMillis(),
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
                lastSyncAt = System.currentTimeMillis(),
                accountStatus = "",
                expiryDate = 0,
                activeConnections = 0,
                maxConnections = 0,
                allowedOutputFormats = "",
                timezone = "",
                serverMessage = "",
                lastSyncSource = "m3u",
            )
        }
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
            )
        }
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
        database.serverDao().upsert(
            server.toEntity().copy(
                createdAt = server.createdAt.takeIf { it > 0 } ?: System.currentTimeMillis(),
                host = server.host.ifBlank { XtreamSupport.hostLabel(server.baseUrl.ifBlank { server.playlistUrl }) },
            ),
        )
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
            )
        }
        "m3u", "m3u8" -> {
            val source = playlistUrl.ifBlank { baseUrl }
            if (source.isBlank()) null else ActivatedProfile(
                name = serverName.ifBlank { XtreamSupport.hostLabel(source) },
                kind = LoginKind.M3U,
                playlistUrl = source,
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
            )
        }
        "m3u", "m3u8" -> {
            val source = playlistUrl.ifBlank { serverUrl }
            if (source.isBlank()) null else ActivatedProfile(
                name = name.ifBlank { XtreamSupport.hostLabel(source) },
                kind = LoginKind.M3U,
                playlistUrl = source,
            )
        }
        else -> null
    }
}
