package com.moalfarras.moplayer.data.repository

import android.os.SystemClock
import android.util.Log
import androidx.room.withTransaction
import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.PagingData
import androidx.paging.map
import com.moalfarras.moplayerpro.BuildConfig
import com.moalfarras.moplayer.data.db.MoPlayerDatabase
import com.moalfarras.moplayer.data.db.toDomain
import com.moalfarras.moplayer.data.db.toEntity
import com.moalfarras.moplayer.data.db.toSearchEntity
import com.moalfarras.moplayer.data.network.PlaylistService
import com.moalfarras.moplayer.data.network.SupabaseService
import com.moalfarras.moplayer.data.network.XtreamService
import com.moalfarras.moplayer.data.network.NetworkModule
import com.moalfarras.moplayer.data.network.WebApiEndpoint
import com.moalfarras.moplayer.data.network.WebActivationCreateRequestDto
import com.moalfarras.moplayer.data.network.WebActivationSourceAckRequestDto
import com.moalfarras.moplayer.data.network.WebProviderSourceDto
import com.moalfarras.moplayer.data.network.WatchProgressDto
import com.moalfarras.moplayer.core.PlaybackActivity
import com.moalfarras.moplayer.data.db.EpgProgramEntity
import com.moalfarras.moplayer.data.db.LiveHistoryDebouncer
import com.moalfarras.moplayer.data.db.LiveZapKeyRow
import com.moalfarras.moplayer.data.db.SyncStateEntity
import com.moalfarras.moplayer.data.parser.JsonStreamReader
import com.moalfarras.moplayer.data.parser.M3U_PARSER_VERSION
import com.moalfarras.moplayer.data.parser.M3uParser
import com.moalfarras.moplayer.data.parser.XmltvStreamParser
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
import com.moalfarras.moplayer.ui.i18n.I18n
import com.moalfarras.moplayer.ui.i18n.SyncStrings
import com.moalfarras.moplayer.ui.i18n.app
import com.moalfarras.moplayer.ui.i18n.isolate
import com.moalfarras.moplayer.ui.i18n.sync
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.channelFlow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import okio.HashingSink
import okio.buffer
import okio.sink
import okio.source
import org.json.JSONObject
import retrofit2.HttpException
import java.io.File
import java.io.FilterInputStream
import java.io.InputStream
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.SecureRandom
import java.nio.charset.StandardCharsets
import java.util.Locale
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

internal const val LIBRARY_BROWSE_PAGE_SIZE = 120
internal const val LIBRARY_SHELF_PAGE_SIZE = 72
internal const val LIBRARY_SEARCH_PAGE_SIZE = 96
internal const val SERIES_DETAIL_WRITE_BATCH_SIZE = 1_000

private const val LIBRARY_PAGING_MAX_PAGES = 10
// Xtream player_api calls are retried on transient failures only (timeouts, resets, bodies cut
// off mid-way, 408/429/5xx/520-524 with Retry-After); see SyncFailures.retryDelayMs. Auth and
// account rejections, DNS, TLS, 4xx and non-JSON answers fail immediately.
private const val BULK_FETCH_ATTEMPTS = 3
private const val ACCOUNT_FETCH_ATTEMPTS = 2
private const val BULK_FETCH_BACKOFF_MS = 1_500L
private const val VOD_DETAIL_STALE_MS = 7L * 24L * 60L * 60L * 1000L
private const val SERIES_DETAIL_STALE_MS = 6L * 60L * 60L * 1000L
private const val HOUR_MS = 60L * 60L * 1000L
/** Background syncs skip sections refreshed within this window. */
private const val BACKGROUND_SECTION_STALE_MS = 3L * HOUR_MS
/** While someone is watching, background syncs only continue for data older than this. */
private const val PLAYBACK_OVERRIDE_STALE_MS = 24L * HOUR_MS
private const val FULL_EPG_STALE_MS = 6L * HOUR_MS
private const val EPG_WINDOW_PAST_MS = 2L * HOUR_MS
private const val EPG_WINDOW_FUTURE_MS = 36L * HOUR_MS
private const val EPG_WRITE_BATCH_SIZE = 2_000
private const val SHORT_EPG_EMPTY_TTL_MS = 20L * 60L * 1000L
private const val SHORT_EPG_FAILURE_TTL_MS = 3L * 60L * 1000L
private const val SHORT_EPG_CACHE_ENTRIES = 2_000
private const val PLAYLIST_PROBE_BYTES = 8_192L
private const val ACTIVATION_LOG_TAG = "MoPlayerActivation"
/** Source acknowledgement: first try at once, then two retries for network, 429 or 5xx failures. */
private val ACK_RETRY_DELAYS_MS = longArrayOf(0L, 2_000L, 6_000L)

/** How much a library refresh downloads. */
enum class SyncMode {
    /** Every section (manual refresh, first import). */
    FULL,

    /** Only stale sections not waiting out a failure; yields to playback between sections. */
    BACKGROUND,
}

/** When get_series_info is fetched again for a series that already has cached episodes. */
enum class SeriesRefreshMode {
    /** Never (focus prefetch: never hit the panel while the user scrolls). */
    IF_EMPTY,

    /** When the cache is older than 6 h or the panel reports a newer last_modified (opening a series). */
    IF_STALE,
}

internal fun largeLibraryPagingConfig(
    pageSize: Int = LIBRARY_BROWSE_PAGE_SIZE,
    maxPages: Int = LIBRARY_PAGING_MAX_PAGES,
): PagingConfig {
    val safePageSize = pageSize.coerceAtLeast(30)
    return PagingConfig(
        pageSize = safePageSize,
        prefetchDistance = safePageSize,
        initialLoadSize = safePageSize * 3,
        maxSize = safePageSize * maxPages.coerceAtLeast(3),
        enablePlaceholders = false,
    )
}

class IptvRepository(
    private val database: MoPlayerDatabase,
    private val playlistService: PlaylistService,
    private val xtreamFactory: (String) -> XtreamService,
    private val supabaseService: SupabaseService?,
    private val webApiService: SupabaseService,
    private val parser: M3uParser,
) {
    private val json = NetworkModule.json
    private val supabaseBearer: String?
        get() = BuildConfig.SUPABASE_ANON_KEY
            .takeIf { it.startsWith("eyJ") }
            ?.let { "Bearer $it" }

    /** Library syncs in flight, per server: a second request joins the running one. */
    private val inFlightSyncs = HashMap<Long, InFlightSync>()

    /** Full XMLTV refreshes are single-flight per server; a concurrent caller skips. */
    private val epgLocks = ConcurrentHashMap<Long, Mutex>()

    /** get_series_info refreshes in flight: a focus prefetch and an open of the same series share one. */
    private val seriesRefreshes = HashMap<String, CompletableDeferred<Unit>>()

    /** "serverId:streamId" -> time until which get_short_epg is not asked again (empty or failed). */
    private val shortEpgMisses = object : LinkedHashMap<String, Long>(64, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, Long>?): Boolean =
            size > SHORT_EPG_CACHE_ENTRIES
    }

    private val catchupRepaired = AtomicBoolean(false)

    private class InFlightSync(val mode: SyncMode) {
        val startedAt = System.currentTimeMillis()
        val progress = MutableStateFlow<LoadProgress?>(null)
        val done = CompletableDeferred<SyncOutcome>()
    }

    private data class SyncOutcome(val partial: Boolean)

    val servers: Flow<List<ServerProfile>> = database.serverDao().observeServers().map { list -> list.map { it.toDomain() } }
    val activeServer: Flow<ServerProfile?> = database.serverDao().observeActiveServer().map { it?.toDomain() }

    suspend fun hasSavedServer(): Boolean = withContext(Dispatchers.IO) {
        database.serverDao().countServers() > 0
    }

    suspend fun server(serverId: Long): ServerProfile? = withContext(Dispatchers.IO) {
        database.serverDao().getServer(serverId)?.toDomain()
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
        config = largeLibraryPagingConfig(),
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
        config = largeLibraryPagingConfig(),
        pagingSourceFactory = { database.mediaDao().observeByTypePaging(serverId, type, sortOption.name, hideNoLogo) }
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    /**
     * Ordered keys of the channels CH+/CH- walks through for [scope], with no row cap. [excluded]
     * drops the channels the list on screen hides (parental filter). Read once per player session.
     */
    suspend fun liveZapKeys(
        serverId: Long,
        scope: LiveZapScope,
        sortOption: SortOption,
        hideNoLogo: Boolean,
        excluded: (LiveZapKeyRow) -> Boolean = { false },
    ): List<LiveZapKey> = withContext(Dispatchers.IO) {
        val dao = database.mediaDao()
        val rows = when (scope) {
            is LiveZapScope.Category -> dao.liveZapKeys(serverId, scope.categoryId, false, sortOption.name, hideNoLogo)
            LiveZapScope.AllChannels -> dao.liveZapKeys(serverId, "", false, sortOption.name, hideNoLogo)
            LiveZapScope.Favorites -> dao.liveZapKeys(serverId, "", true, sortOption.name, hideNoLogo)
            is LiveZapScope.Search -> dao.searchRowsOnce(serverId, scope.query)
                .filter { it.type == ContentType.LIVE && (!hideNoLogo || it.posterUrl.isNotBlank()) }
                .map { LiveZapKeyRow(it.serverId, it.id, it.title, it.categoryId, it.categoryName, it.description) }
        }
        rows.filterNot(excluded).map { LiveZapKey(it.serverId, it.id) }
    }

    /** Full rows for [keys], in the same order; channels removed since the keys were read are skipped. */
    suspend fun liveZapRows(keys: List<LiveZapKey>): List<MediaItem> = withContext(Dispatchers.IO) {
        val dao = database.mediaDao()
        val found = HashMap<LiveZapKey, MediaItem>(keys.size * 2)
        keys.groupBy({ it.serverId }, { it.id }).forEach { (serverId, ids) ->
            ids.chunked(LIVE_ZAP_ROW_CHUNK).forEach { chunk ->
                dao.liveRowsByIds(serverId, chunk).forEach { row -> found[LiveZapKey(row.serverId, row.id)] = row.toDomain() }
            }
        }
        keys.mapNotNull(found::get)
    }

    /** Live channels per category id of [serverId] (0: the merged library), for the player's group list. */
    suspend fun liveCategoryCounts(serverId: Long, hideNoLogo: Boolean): Map<String, Int> = withContext(Dispatchers.IO) {
        database.mediaDao().liveCategoryCounts(serverId, hideNoLogo).associate { it.categoryId to it.channels }
    }

    /** Live channels whose provider number is [number] (usually one; one per source when merged). */
    suspend fun liveByNumber(serverId: Long, number: Int, hideNoLogo: Boolean): List<MediaItem> = withContext(Dispatchers.IO) {
        database.mediaDao().liveByNumber(serverId, number, hideNoLogo).map { it.toDomain() }
    }

    fun latestLive(serverId: Long): Flow<PagingData<MediaItem>> = Pager(
        config = largeLibraryPagingConfig(LIBRARY_SHELF_PAGE_SIZE),
        pagingSourceFactory = { database.mediaDao().observeLatestPaging(serverId, listOf(ContentType.LIVE)) }
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    fun latestMovies(serverId: Long): Flow<PagingData<MediaItem>> = Pager(
        config = largeLibraryPagingConfig(LIBRARY_SHELF_PAGE_SIZE),
        pagingSourceFactory = { database.mediaDao().observeLatestPaging(serverId, listOf(ContentType.MOVIE)) }
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    fun latestSeries(serverId: Long): Flow<PagingData<MediaItem>> = Pager(
        config = largeLibraryPagingConfig(LIBRARY_SHELF_PAGE_SIZE),
        pagingSourceFactory = { database.mediaDao().observeLatestPaging(serverId, listOf(ContentType.SERIES)) }
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    fun favorites(serverId: Long): Flow<PagingData<MediaItem>> = Pager(
        config = largeLibraryPagingConfig(),
        pagingSourceFactory = { database.mediaDao().observeFavoritesPaging(serverId) }
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }


    fun episodes(serverId: Long, seriesId: String): Flow<List<MediaItem>> =
        database.mediaDao().observeEpisodes(serverId, seriesId).map { it.map { entity -> entity.toDomain() } }

    fun continueWatching(serverId: Long): Flow<PagingData<MediaItem>> = Pager(
        config = largeLibraryPagingConfig(LIBRARY_SHELF_PAGE_SIZE, maxPages = 8),
        pagingSourceFactory = { database.mediaDao().observeContinueWatchingPaging(serverId) },
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    fun recentlyPlayed(serverId: Long, type: ContentType): Flow<PagingData<MediaItem>> = Pager(
        config = largeLibraryPagingConfig(LIBRARY_SHELF_PAGE_SIZE, maxPages = 8),
        pagingSourceFactory = { database.mediaDao().observeRecentlyPlayedPaging(serverId, type) },
    ).flow.map { pagingData ->
        pagingData.map { entity -> entity.toDomain() }
    }

    fun search(serverId: Long, query: String): Flow<PagingData<MediaItem>> = Pager(
        config = largeLibraryPagingConfig(LIBRARY_SEARCH_PAGE_SIZE, maxPages = 8),
        pagingSourceFactory = {
            val normalized = query.trim().escapeLike()
            database.mediaDao().searchPaging(
                serverId = serverId,
                containsQuery = "%$normalized%",
                prefixQuery = "$normalized%",
            )
        },
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

    /**
     * Loads the seasons and episodes of an Xtream series. Cached episodes are shown right away by
     * the caller; with [SeriesRefreshMode.IF_STALE] they are revalidated when older than 6 h or
     * when the panel reports a newer `last_modified`, so new episodes of running series appear.
     * A failed or empty revalidation keeps the cache. Favorites and progress of episodes survive.
     */
    suspend fun refreshSeriesDetails(
        server: ServerProfile,
        series: MediaItem,
        mode: SeriesRefreshMode = SeriesRefreshMode.IF_STALE,
    ) {
        if (server.kind != LoginKind.XTREAM) return
        val seriesId = series.seriesId.ifBlank { series.id }
        if (seriesId.isBlank()) return
        val key = "${server.id}:$seriesId"
        while (true) {
            val (entry, owner) = synchronized(seriesRefreshes) {
                val running = seriesRefreshes[key]
                if (running != null) running to false else CompletableDeferred<Unit>().also { seriesRefreshes[key] = it } to true
            }
            if (!owner) {
                val failure = runCatching { entry.await() }.exceptionOrNull() ?: return
                // The refresh we waited for was cancelled (for example a prefetch): do it ourselves.
                if (failure is CancellationException) {
                    currentCoroutineContext().ensureActive()
                    continue
                }
                throw failure
            }
            // Unregistered before completing, so a waiter taking over after a cancellation
            // cannot find (and spin on) the finished entry.
            val release = {
                synchronized(seriesRefreshes) {
                    if (seriesRefreshes[key] === entry) seriesRefreshes.remove(key)
                }
            }
            try {
                loadSeriesDetails(server, series, seriesId, mode)
                release()
                entry.complete(Unit)
            } catch (throwable: Throwable) {
                release()
                entry.completeExceptionally(throwable)
                throw throwable
            }
            return
        }
    }

    private suspend fun loadSeriesDetails(server: ServerProfile, series: MediaItem, seriesId: String, mode: SeriesRefreshMode) {
        val cachedEpisodes = database.mediaDao().episodeCount(server.id, seriesId)
        if (cachedEpisodes > 0) {
            if (mode == SeriesRefreshMode.IF_EMPTY) return
            val cachedAt = database.seasonDao().cachedAt(server.id, seriesId)
            val fresh = cachedAt != null &&
                !isStale(cachedAt, System.currentTimeMillis(), SERIES_DETAIL_STALE_MS) &&
                series.lastModifiedAt <= cachedAt
            if (fresh) return
        }
        val host = hostOf(server)
        val credentials = savedXtreamCredentials(server)
        val api = xtreamFactory(credentials.baseUrl)
        val (enrichedSeries, seasons, episodeItems) = try {
            val response = fetchSeriesInfoObject(api, credentials.username, credentials.password, seriesId, host)
            XtreamSupport.enrichSeries(json, server.id, credentials, series, response)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (throwable: Exception) {
            if (cachedEpisodes > 0) return
            throw SyncFailures.classify(throwable, host)
        }
        database.withTransaction {
            writeMetadata(enrichedSeries)
            // Overloaded panels sometimes answer with no episodes; never wipe a cache for that.
            if (episodeItems.isEmpty() && cachedEpisodes > 0) return@withTransaction
            val states = database.mediaDao().episodeState(server.id, seriesId)
                .associateBy { stateKey(it.type, it.id) }
            database.mediaSearchDao().deleteEpisodesForSeries(server.id, seriesId)
            database.mediaDao().deleteEpisodesForSeries(server.id, seriesId)
            database.seasonDao().deleteForSeries(server.id, seriesId)
            if (seasons.isNotEmpty()) database.seasonDao().insertAll(seasons)
            episodeItems.chunked(SERIES_DETAIL_WRITE_BATCH_SIZE).forEach { chunk ->
                // Episode stream URLs are rebuilt with the current credentials; user state is kept.
                val entities = applyUserState(chunk.map(MediaItem::toEntity), states)
                database.mediaDao().insertAll(entities)
                database.mediaSearchDao().insertAll(entities.map { it.toSearchEntity() })
            }
        }
    }

    /**
     * Enriches a movie with get_vod_info (cached for 7 days, even when the panel has no details).
     * Only metadata columns are written, so favorites, progress and lastPlayedAt set while the
     * request was in flight are kept; the returned item is the current database row.
     */
    suspend fun refreshVodDetails(server: ServerProfile, movie: MediaItem): MediaItem {
        if (server.kind != LoginKind.XTREAM || movie.type != ContentType.MOVIE) return movie
        val cachedItem = withContext(Dispatchers.IO) {
            val details = database.vodDetailsDao().get(server.id, movie.id)
            val stored = database.mediaDao().get(server.id, movie.id, ContentType.MOVIE)?.toDomain()
            if (details != null && stored != null && !isStale(details.updatedAt, System.currentTimeMillis(), VOD_DETAIL_STALE_MS)) {
                stored
            } else {
                null
            }
        }
        if (cachedItem != null) return cachedItem
        val host = hostOf(server)
        val credentials = savedXtreamCredentials(server)
        val api = xtreamFactory(credentials.baseUrl)
        val response = try {
            playerApiObject(
                api,
                credentials.username,
                credentials.password,
                mapOf("action" to "get_vod_info", "vod_id" to movie.id),
                host = host,
            )
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (throwable: Exception) {
            throw SyncFailures.classify(throwable, host)
        }
        val (enriched, details) = XtreamSupport.enrichVod(json, server.id, movie, response)
        return withContext(Dispatchers.IO) {
            database.withTransaction {
                database.vodDetailsDao().upsert(details)
                writeMetadata(enriched)
                database.mediaDao().get(server.id, movie.id, ContentType.MOVIE)?.toDomain() ?: enriched
            }
        }
    }

    /**
     * Writes detail metadata of [item] onto its existing row without touching user state or
     * updatedAt, keeps stored values where the panel sent blanks, and skips the write (and the
     * observer invalidation) when nothing changed. A missing row is not re-created.
     */
    private suspend fun writeMetadata(item: MediaItem) {
        val current = database.mediaDao().get(item.serverId, item.id, item.type) ?: return
        val next = current.copy(
            title = item.title.ifBlank { current.title },
            posterUrl = item.posterUrl.ifBlank { current.posterUrl },
            backdropUrl = item.backdropUrl.ifBlank { current.backdropUrl },
            description = item.description.ifBlank { current.description },
            rating = item.rating.ifBlank { current.rating },
            durationSecs = item.durationSecs.takeIf { it > 0 } ?: current.durationSecs,
            cast = item.cast.ifBlank { current.cast },
            director = item.director.ifBlank { current.director },
            genre = item.genre.ifBlank { current.genre },
            releaseDate = item.releaseDate.ifBlank { current.releaseDate },
        )
        if (next == current) return
        database.mediaDao().updateMetadata(
            serverId = next.serverId,
            id = next.id,
            type = next.type,
            title = next.title,
            posterUrl = next.posterUrl,
            backdropUrl = next.backdropUrl,
            description = next.description,
            rating = next.rating,
            durationSecs = next.durationSecs,
            cast = next.cast,
            director = next.director,
            genre = next.genre,
            releaseDate = next.releaseDate,
        )
        database.mediaSearchDao().insertAll(listOf(next.toSearchEntity()))
    }

    /**
     * Resolve a YouTube video id to preview as a muted trailer for [item]. Priority:
     *  1. A YouTube search via the website (`/api/app/trailer`) — the endpoint filters to
     *     `videoEmbeddable=true`, so its result ALWAYS plays inside the IFrame. Key stays
     *     server-side, results are cached, so the device never holds a key or burns quota.
     *  2. The provider's own `youtube_trailer` as a fallback if search returns nothing — movies
     *     (get_vod_info, cached) and series (get_series_info). NOTE: many Xtream panels store a
     *     youtube_trailer whose video has embedding disabled (IFrame error 150/152 → won't play),
     *     which is exactly why search is tried first.
     * Returns null when nothing is available. Runs off the main thread and only ever talks to the
     * website / YouTube hosts (or the panel's JSON API for the fallback) — never the live stream
     * socket — so it cannot consume a provider's (often single) streaming connection slot.
     */
    suspend fun resolveTrailerYoutubeId(server: ServerProfile, item: MediaItem): String? = withContext(Dispatchers.IO) {
        if (item.type != ContentType.MOVIE && item.type != ContentType.SERIES) return@withContext null
        // 1) Embeddable YouTube search first — guaranteed to play, and avoids the mount→error→dispose
        //    churn that a non-embeddable provider trailer causes.
        searchTrailerOnWeb(item.title, item.type, trailerSearchYear(item))?.let { return@withContext it }
        // 2) Provider trailer only if search found nothing.
        if (server.kind == LoginKind.XTREAM) {
            val providerId = when (item.type) {
                ContentType.MOVIE -> runCatching {
                    refreshVodDetails(server, item)
                    database.vodDetailsDao().get(server.id, item.id)?.youtubeTrailer
                }.getOrNull()
                ContentType.SERIES -> runCatching {
                    val seriesId = item.seriesId.ifBlank { item.id }
                    if (seriesId.isBlank()) return@runCatching null
                    val credentials = savedXtreamCredentials(server)
                    val api = xtreamFactory(credentials.baseUrl)
                    val root = fetchSeriesInfoObject(api, credentials.username, credentials.password, seriesId, hostOf(server))
                    XtreamSupport.seriesTrailerYoutubeId(root)
                }.getOrNull()
                else -> null
            }
            extractYoutubeId(providerId)?.let { return@withContext it }
        }
        null
    }

    /** Force the YouTube-search fallback, skipping the provider trailer. Used when a provider trailer
     *  turns out to be non-embeddable and the preview reports it cannot play. */
    suspend fun searchTrailerYoutubeId(item: MediaItem): String? = withContext(Dispatchers.IO) {
        if (item.type != ContentType.MOVIE && item.type != ContentType.SERIES) return@withContext null
        searchTrailerOnWeb(item.title, item.type, trailerSearchYear(item))
    }

    private fun trailerSearchYear(item: MediaItem): String =
        item.releaseDate.trim().take(4).takeIf { it.length == 4 && it.all(Char::isDigit) }.orEmpty()

    /** Pull the 11-char YouTube id out of a bare id or any common watch/embed/share URL. */
    private fun extractYoutubeId(raw: String?): String? {
        val value = raw?.trim().orEmpty()
        if (value.isBlank()) return null
        if (Regex("^[A-Za-z0-9_-]{11}$").matches(value)) return value
        val patterns = listOf(
            Regex("[?&]v=([A-Za-z0-9_-]{11})"),
            Regex("youtu\\.be/([A-Za-z0-9_-]{11})"),
            Regex("/embed/([A-Za-z0-9_-]{11})"),
            Regex("/shorts/([A-Za-z0-9_-]{11})"),
        )
        for (pattern in patterns) {
            pattern.find(value)?.let { return it.groupValues[1] }
        }
        return null
    }

    private fun searchTrailerOnWeb(title: String, type: ContentType, year: String): String? {
        val cleanTitle = title.trim()
        if (cleanTitle.isBlank()) return null
        val typeParam = if (type == ContentType.SERIES) "series" else "movie"
        val path = buildString {
            append("/api/app/trailer?title=").append(URLEncoder.encode(cleanTitle, StandardCharsets.UTF_8.name()))
            append("&type=").append(typeParam)
            append("&product=").append(BuildConfig.APP_PRODUCT_SLUG)
            if (year.isNotBlank()) append("&year=").append(year)
            // Automatic cache-busting: each app release uses distinct URLs, so no intermediate
            // HTTP/CDN cache can ever serve a previous version's (possibly wrong) trailer mapping.
            append("&v=").append(BuildConfig.VERSION_CODE)
        }
        WebApiEndpoint.candidateUrls(path).forEach { urlString ->
            val id = runCatching {
                val connection = (URL(urlString).openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 7_000
                    readTimeout = 7_000
                    setRequestProperty("Accept", "application/json")
                    useCaches = false
                }
                try {
                    if (connection.responseCode !in 200..299) return@runCatching null
                    val body = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(body)
                    // CRITICAL: optString on a JSON null returns the STRING "null" — which then
                    // reached the player as a bogus video id ("Invalid video id") AND blocked the
                    // provider-trailer fallback. Check isNull first, then strictly validate the id.
                    if (json.isNull("videoId")) {
                        null
                    } else {
                        extractYoutubeId(json.optString("videoId", ""))
                    }
                } finally {
                    connection.disconnect()
                }
            }.getOrNull()
            if (!id.isNullOrBlank()) return id
        }
        return null
    }

    suspend fun toggleFavorite(item: MediaItem) {
        database.mediaDao().toggleFavorite(item.serverId, item.id, item.type, System.currentTimeMillis())
    }

    suspend fun notePlaybackStart(item: MediaItem) {
        database.mediaDao().markPlayed(item.serverId, item.id, item.type, System.currentTimeMillis())
    }

    /** Forgets a live channel still waiting out its history dwell (the player closed before it). */
    fun discardPendingLiveHistory() {
        LiveHistoryDebouncer.shared.cancel()
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

    /**
     * Tells the website whether the QR-delivered source was imported, so the phone can show the
     * result. Best effort: it never throws (apart from cancellation) and returns whether the server
     * accepted it. Network failures, 429 and 5xx are retried twice; other answers are final (a 401
     * is expected when an earlier acknowledgement already retired the token). [message] must be a
     * short non-sensitive code, never a URL or credentials.
     */
    suspend fun acknowledgeWebActivationSource(
        publicDeviceId: String,
        token: String,
        sourceId: String,
        imported: Boolean,
        message: String = "",
    ): Boolean {
        if (publicDeviceId.isBlank() || token.isBlank() || sourceId.isBlank()) return false
        val body = WebActivationSourceAckRequestDto(
            publicDeviceId = publicDeviceId,
            token = token,
            sourceId = sourceId,
            status = if (imported) "imported" else "failed",
            message = message.take(120),
        )
        for (wait in ACK_RETRY_DELAYS_MS) {
            if (wait > 0L) delay(wait)
            try {
                withContext(Dispatchers.IO) {
                    webApiService.webDeviceActivationSourceAck(url = activationApiUrl("source/ack"), body = body).close()
                }
                return true
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                if (!isTransientActivationFailure(failure)) {
                    Log.w(ACTIVATION_LOG_TAG, "Source acknowledgement refused (${(failure as? HttpException)?.code() ?: failure.javaClass.simpleName})")
                    return false
                }
            }
        }
        Log.w(ACTIVATION_LOG_TAG, "Source acknowledgement failed after retries")
        return false
    }

    suspend fun lastWatchedLive(serverId: Long): MediaItem? =
        database.mediaDao().lastPlayedLive(serverId)?.toDomain()

    /** Now/next for a live channel: the local guide first, then (Xtream) get_short_epg. */
    suspend fun liveEpg(server: ServerProfile, item: MediaItem, limit: Int = 2): LiveEpgSnapshot =
        localLiveEpg(server, item, limit) ?: remoteLiveEpg(server, item)

    /** Now/next from the stored guide only; null when nothing upcoming is stored for [item]. */
    suspend fun localLiveEpg(server: ServerProfile, item: MediaItem, limit: Int = 2): LiveEpgSnapshot? {
        if (item.type != ContentType.LIVE) return null
        val keys = buildList {
            item.tvgId.takeIf { it.isNotBlank() }?.let(::add)
            item.id.takeIf { it.isNotBlank() }?.let(::add)
        }.distinct()
        val now = System.currentTimeMillis()
        val local = withContext(Dispatchers.IO) {
            keys.firstNotNullOfOrNull { key ->
                database.epgDao().upcoming(server.id, key, now, limit + 2).takeIf { it.isNotEmpty() }
            }
        } ?: return null
        return XtreamSupport.toLiveEpgSnapshot(local, now)
    }

    /**
     * Now/next from Xtream get_short_epg (one attempt, no retries). Answers with nothing current
     * or upcoming are remembered for 20 minutes and failures for 3, so moving focus across
     * channels without a guide does not send a request for every channel every time.
     */
    suspend fun remoteLiveEpg(server: ServerProfile, item: MediaItem): LiveEpgSnapshot {
        if (item.type != ContentType.LIVE || server.kind != LoginKind.XTREAM || item.id.isBlank()) return LiveEpgSnapshot()
        val missKey = "${server.id}:${item.id}"
        val now = System.currentTimeMillis()
        val retryAt = synchronized(shortEpgMisses) { shortEpgMisses[missKey] }
        if (retryAt != null && now < retryAt) return LiveEpgSnapshot()
        val programs = try {
            withContext(Dispatchers.IO) {
                val credentials = savedXtreamCredentials(server)
                val root = xtreamFactory(credentials.baseUrl)
                    .shortEpg(credentials.username, credentials.password, item.id, limit = 10)
                    .use { body -> JsonStreamReader(InputStreamReader(body.byteStream(), Charsets.UTF_8)).use { it.readDocument() } }
                (root as? JsonObject)?.let { XtreamSupport.parseShortEpg(server.id, item.tvgId.ifBlank { item.id }, it) }.orEmpty()
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            rememberShortEpgMiss(missKey, now + SHORT_EPG_FAILURE_TTL_MS)
            return LiveEpgSnapshot()
        }
        // Only finished programmes (a panel whose guide stopped updating) are useless too: the
        // local lookup would miss them again, so remember the channel like an empty answer.
        if (programs.none { it.endAt >= now }) {
            rememberShortEpgMiss(missKey, now + SHORT_EPG_EMPTY_TTL_MS)
            return LiveEpgSnapshot()
        }
        withContext(Dispatchers.IO) { database.epgDao().insertAll(programs) }
        return XtreamSupport.toLiveEpgSnapshot(programs, now)
    }

    private fun rememberShortEpgMiss(key: String, until: Long) {
        synchronized(shortEpgMisses) { shortEpgMisses[key] = until }
    }

    private fun forgetShortEpgMisses(serverId: Long) {
        val prefix = "$serverId:"
        synchronized(shortEpgMisses) { shortEpgMisses.keys.removeAll { it.startsWith(prefix) } }
    }

    /**
     * Downloads the full XMLTV guide (Xtream xmltv.php, or the M3U guide URLs) and stores the
     * programmes of the library's channels from 2 h ago to 36 h ahead.
     *
     * - Single-flight per server: a concurrent caller (worker and UI) returns 0 immediately.
     * - Skipped while the stored guide is younger than 6 h, and after a failure it waits
     *   30 min, 1 h, 2 h ... up to 6 h, unless [force] is set.
     * - Streams the body to a temp file, then parses it (gzip is detected by magic bytes) and
     *   writes 2k-row batches in short transactions. The old guide stays readable until the new
     *   one is complete, then outdated rows are removed.
     * - Returns the number of programmes stored (0 when skipped or failed).
     */
    suspend fun refreshFullEpg(server: ServerProfile, force: Boolean = false): Int {
        val lock = epgLocks.getOrPut(server.id) { Mutex() }
        if (!lock.tryLock()) return 0
        try {
            val current = withContext(Dispatchers.IO) { database.serverDao().getServer(server.id)?.toDomain() } ?: return 0
            val sources = epgSources(current)
            if (sources.isEmpty()) return 0
            val now = System.currentTimeMillis()
            if (!force) {
                val state = withContext(Dispatchers.IO) { database.syncStateDao().get(current.id) }
                val meta = SyncMeta.decode(state?.rawJson)
                if (!sectionNeedsSync(state?.epgSyncedAt ?: 0L, meta.epgFailure, now, FULL_EPG_STALE_MS, respectBackoff = true)) return 0
            }
            val keys = withContext(Dispatchers.IO) { epgChannelKeys(database.mediaDao().liveEpgKeys(current.id)) }
            // The library is not there yet: do not mark the guide as synced, try again later.
            if (keys.isEmpty()) return 0
            val host = hostOf(current)
            var failure: SyncException? = null
            for (source in sources) {
                try {
                    val stored = importXmltv(current, source, keys)
                    if (stored > 0) {
                        recordEpgResult(current, success = true, kind = null)
                        forgetShortEpgMisses(current.id)
                        return stored
                    }
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (removed: ServerRemovedException) {
                    return 0
                } catch (throwable: Exception) {
                    failure = SyncFailures.prefer(failure, SyncFailures.classify(throwable, host, SyncTarget.EPG))
                }
            }
            recordEpgResult(current, success = false, kind = failure?.kind ?: SyncErrorKind.EMPTY_LIBRARY)
            return 0
        } finally {
            lock.unlock()
        }
    }

    private sealed interface EpgSource {
        data object Xtream : EpgSource
        data class Url(val url: String) : EpgSource
    }

    private fun epgSources(server: ServerProfile): List<EpgSource> = when (server.kind) {
        LoginKind.XTREAM -> listOf(EpgSource.Xtream)
        LoginKind.M3U -> server.epgUrl.split(',')
            .map { it.trim() }
            .filter { it.startsWith("http://", ignoreCase = true) || it.startsWith("https://", ignoreCase = true) }
            .distinct()
            .map { EpgSource.Url(it) }
    }

    private suspend fun importXmltv(server: ServerProfile, source: EpgSource, keys: Map<String, String>): Int =
        withContext(Dispatchers.IO) {
            val temp = scratchFile("epg-${server.id}.tmp")
            try {
                val body = when (source) {
                    EpgSource.Xtream -> {
                        val credentials = savedXtreamCredentials(server)
                        xtreamFactory(credentials.baseUrl).xmltv(credentials.username, credentials.password)
                    }
                    is EpgSource.Url -> playlistService.getText(source.url)
                }
                body.use { response -> temp.sink().buffer().use { sink -> sink.writeAll(response.source()) } }
                val stamp = System.currentTimeMillis()
                val batch = ArrayList<EpgProgramEntity>(EPG_WRITE_BATCH_SIZE)
                var stored = 0
                XmltvStreamParser(
                    reader = XmltvStreamParser.openReader(temp.inputStream()),
                    resolveChannel = { channel -> keys[channel] ?: keys[channel.lowercase(Locale.ROOT)] },
                    windowStart = stamp - EPG_WINDOW_PAST_MS,
                    windowEnd = stamp + EPG_WINDOW_FUTURE_MS,
                ).use { parser ->
                    while (true) {
                        val programme = parser.next() ?: break
                        batch += EpgProgramEntity(
                            serverId = server.id,
                            channelKey = programme.channelKey,
                            title = programme.title,
                            description = programme.description,
                            startAt = programme.startAt,
                            endAt = programme.endAt,
                            category = programme.category,
                            rawJson = "",
                            updatedAt = stamp,
                        )
                        if (batch.size >= EPG_WRITE_BATCH_SIZE) {
                            stored += writeEpgBatch(server.id, batch)
                            currentCoroutineContext().ensureActive()
                        }
                    }
                }
                if (batch.isNotEmpty()) stored += writeEpgBatch(server.id, batch)
                if (stored > 0) {
                    database.withTransaction {
                        if (database.serverDao().getServer(server.id) == null) throw ServerRemovedException()
                        database.epgDao().deleteStale(server.id, stamp, endedBefore = stamp - EPG_WINDOW_PAST_MS)
                    }
                }
                stored
            } finally {
                temp.delete()
            }
        }

    private suspend fun writeEpgBatch(serverId: Long, batch: MutableList<EpgProgramEntity>): Int {
        val count = batch.size
        val rows = ArrayList(batch)
        batch.clear()
        database.withTransaction {
            if (database.serverDao().getServer(serverId) == null) throw ServerRemovedException()
            database.epgDao().insertAll(rows)
        }
        return count
    }

    private suspend fun recordEpgResult(server: ServerProfile, success: Boolean, kind: SyncErrorKind?) {
        val now = System.currentTimeMillis()
        editSyncState(server.id, sourceLabel(server)) { state, meta ->
            if (success) {
                state.copy(epgSyncedAt = now) to meta.copy(epgFailure = null)
            } else {
                state to meta.withEpgFailure(kind ?: SyncErrorKind.UNKNOWN, now)
            }
        }
    }

    suspend fun deleteServer(serverId: Long) = withContext(Dispatchers.IO) {
        // The server row goes first, inside one transaction: a sync still running for it sees the
        // row missing at its next batch and stops instead of writing orphan rows.
        database.withTransaction {
            database.serverDao().delete(serverId)
            database.categoryDao().deleteForServer(serverId)
            database.mediaDao().deleteForServer(serverId)
            database.mediaSearchDao().deleteForServer(serverId)
            database.accountInfoDao().deleteForServer(serverId)
            database.serverInfoDao().deleteForServer(serverId)
            database.vodDetailsDao().deleteForServer(serverId)
            database.seasonDao().deleteForServer(serverId)
            database.epgDao().deleteForServer(serverId)
            database.syncStateDao().deleteForServer(serverId)
        }
        forgetShortEpgMisses(serverId)
    }

    suspend fun activateServer(serverId: Long) = withContext(Dispatchers.IO) {
        database.serverDao().markActive(serverId, System.currentTimeMillis())
    }

    /** The provider's own account creation time (Xtream user_info.created_at, ms), or 0 when unknown. */
    suspend fun providerAccountCreatedAt(serverId: Long): Long = withContext(Dispatchers.IO) {
        database.accountInfoDao().get(serverId)?.createdAt ?: 0L
    }

    suspend fun clearWatchHistory(serverId: Long) = withContext(Dispatchers.IO) {
        database.mediaDao().clearProgress(serverId)
        database.mediaDao().clearRecentPlayback(serverId)
    }

    /** Clears the stored guide and marks it stale, so the next refresh downloads it again. */
    suspend fun clearEpgCache(serverId: Long) {
        database.epgDao().deleteForServer(serverId)
        editSyncState(serverId, source = "", createIfMissing = false) { state, meta ->
            state.copy(epgSyncedAt = 0L) to meta.copy(epgFailure = null)
        }
        forgetShortEpgMisses(serverId)
    }

    /** Checks the saved source; returns a localized success line or throws a [SyncException]. */
    suspend fun testServerConnection(server: ServerProfile): String {
        val strings = I18n.strings.sync
        val host = hostOf(server)
        return when (server.kind) {
            LoginKind.XTREAM -> {
                val (_, root) = resolveXtreamAccount(server.baseUrl, server.username, server.password, server.playlistUrl, host)
                val status = XtreamSupport.parseAccountSnapshot(json, server.id, root, System.currentTimeMillis()).accountStatus
                if (status.isBlank()) strings.connectionOk else "${strings.connectionOk} · ${status.isolate()}"
            }
            LoginKind.M3U -> {
                if (!isLocalPlaylist(server)) probePlaylist(server.playlistUrl, host)
                strings.playlistOk
            }
        }
    }

    suspend fun hasLocalLibrary(serverId: Long): Boolean = withContext(Dispatchers.IO) {
        database.mediaDao().countForServer(serverId) > 0
    }

    /**
     * Whether a background library refresh is due: a section (or the playlist) is older than
     * [staleAfterMs] and not waiting out a recent failure. Empty libraries always need one.
     */
    suspend fun needsLibraryRefresh(server: ServerProfile, staleAfterMs: Long): Boolean = withContext(Dispatchers.IO) {
        if (server.id <= 0) return@withContext true
        repairLegacyCatchup()
        if (database.mediaDao().countForServer(server.id) <= 0) return@withContext true
        val state = database.syncStateDao().get(server.id) ?: return@withContext true
        val meta = SyncMeta.decode(state.rawJson)
        val now = System.currentTimeMillis()
        if (server.kind == LoginKind.M3U) {
            if (isLocalPlaylist(server)) return@withContext false
            return@withContext sectionNeedsSync(state.lastSyncAt, meta.failures[PLAYLIST_SECTION], now, staleAfterMs, respectBackoff = true)
        }
        XTREAM_SECTIONS.any { section ->
            sectionNeedsSync(state.syncedAt(section.type), meta.failures[section.type.name], now, staleAfterMs, respectBackoff = true)
        }
    }

    /** Whether the full guide is due (older than [staleAfterMs] and not in failure backoff). */
    suspend fun needsFullEpgRefresh(server: ServerProfile, staleAfterMs: Long): Boolean = withContext(Dispatchers.IO) {
        if (server.id <= 0) return@withContext false
        val current = database.serverDao().getServer(server.id)?.toDomain() ?: return@withContext false
        if (epgSources(current).isEmpty()) return@withContext false
        val state = database.syncStateDao().get(server.id)
        val meta = SyncMeta.decode(state?.rawJson)
        sectionNeedsSync(state?.epgSyncedAt ?: 0L, meta.epgFailure, System.currentTimeMillis(), staleAfterMs, respectBackoff = true)
    }

    /** Imports an M3U file the user picked; it is written in batches like a downloaded playlist. */
    fun loginM3uText(name: String, sourceName: String, playlistText: String): Flow<LoadProgress> = channelFlow {
        if (playlistText.isBlank()) throw SyncException(SyncErrorKind.INVALID_PLAYLIST)
        val fileName = sourceName.ifBlank { "local-file.m3u" }
        val label = "file:${fileName.take(80)}"
        val key = sourceKey("m3u-file", fileName)
        val existing = database.serverDao().getServerBySourceKey(key)?.toDomain()
        val profile = ServerProfile(
            id = existing?.id ?: 0,
            name = name.ifBlank { sourceName.ifBlank { "Imported M3U" } },
            kind = LoginKind.M3U,
            baseUrl = label,
            playlistUrl = label,
            createdAt = existing?.createdAt ?: System.currentTimeMillis(),
            lastSyncAt = existing?.lastSyncAt ?: 0,
            host = sourceName.ifBlank { "Local M3U" },
            lastSyncSource = "m3u-file",
            epgUrl = existing?.epgUrl.orEmpty(),
            sourceKey = key,
        )
        val server = profile.copy(id = upsertServer(profile))
        val lines = playlistText.lineSequence().iterator()
        withContext(Dispatchers.Default) {
            importPlaylist(server, playlistHash = "", progress = { send(it) }, readFraction = { null }) {
                if (lines.hasNext()) lines.next() else null
            }
        }
        send(LoadProgress(I18n.strings.sync.ready, 100, 100))
    }

    suspend fun registerXtreamSource(name: String, baseUrl: String, username: String, password: String, playlistUrl: String = ""): ServerProfile {
        val host = XtreamSupport.hostLabel(XtreamSupport.normalizeServerBaseUrl(baseUrl) ?: baseUrl)
        val credentials = resolveXtreamAccount(baseUrl, username, password, playlistUrl, host).first
        val normalizedBase = credentials.baseUrl
        val key = sourceKey("xtream", "$normalizedBase|${credentials.username}")
        val existing = withContext(Dispatchers.IO) { database.serverDao().getServerBySourceKey(key)?.toDomain() }
        val server = ServerProfile(
            id = existing?.id ?: 0,
            name = name.ifBlank { XtreamSupport.hostLabel(normalizedBase).replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.US) else it.toString() } },
            kind = LoginKind.XTREAM,
            baseUrl = normalizedBase,
            username = credentials.username,
            password = credentials.password,
            playlistUrl = credentials.playlistUrl.ifBlank { playlistUrl.trim() },
            createdAt = existing?.createdAt ?: System.currentTimeMillis(),
            lastSyncAt = existing?.lastSyncAt ?: 0,
            host = XtreamSupport.hostLabel(normalizedBase),
            lastSyncSource = "activation",
            sourceKey = key,
        )
        val serverId = upsertServer(server)
        database.serverDao().markActive(serverId, System.currentTimeMillis())
        return database.serverDao().getServer(serverId)?.toDomain() ?: server.copy(id = serverId)
    }

    /**
     * For playlist links that carry Xtream credentials (get.php?username=...&password=...):
     * registers the Xtream account, or returns null when the link has no credentials or when
     * player_api is missing, blocked or broken while the playlist itself may still work, so the
     * caller falls back to [registerM3uSource]. Account rejections and network failures are thrown.
     */
    suspend fun registerXtreamFromPlaylistUrl(name: String, playlistUrl: String): ServerProfile? {
        val candidates = xtreamCredentialCandidates(playlistUrl, "", "", playlistUrl)
        val credentials = candidates.firstOrNull() ?: return null
        return try {
            registerXtreamSource(
                name = name.ifBlank {
                    XtreamSupport.hostLabel(credentials.baseUrl)
                        .replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.US) else it.toString() }
                },
                baseUrl = credentials.baseUrl,
                username = credentials.username,
                password = credentials.password,
                playlistUrl = credentials.playlistUrl.ifBlank { playlistUrl },
            )
        } catch (failure: SyncException) {
            if (failure.kind in PLAYLIST_FALLBACK_KINDS) null else throw failure
        }
    }

    suspend fun registerM3uSource(name: String, playlistUrl: String, epgUrl: String = ""): ServerProfile {
        val normalizedUrl = httpUrlCandidates(playlistUrl).first()
        require(!(XtreamSupport.looksLikeXtreamPlaylistUrl(normalizedUrl) && XtreamSupport.extractCredentialsFromPlaylistUrl(normalizedUrl) == null)) {
            I18n.strings.sync.xtreamLinkIncomplete
        }
        val key = sourceKey("m3u", normalizedUrl)
        val existing = withContext(Dispatchers.IO) { database.serverDao().getServerBySourceKey(key)?.toDomain() }
        val server = ServerProfile(
            id = existing?.id ?: 0,
            name = name.ifBlank { normalizedUrl.hostLabel() },
            kind = LoginKind.M3U,
            baseUrl = normalizedUrl.hostLabel(),
            playlistUrl = normalizedUrl,
            createdAt = existing?.createdAt ?: System.currentTimeMillis(),
            lastSyncAt = existing?.lastSyncAt ?: 0,
            host = XtreamSupport.hostLabel(normalizedUrl),
            lastSyncSource = "m3u",
            epgUrl = epgUrl.trim().ifBlank { existing?.epgUrl.orEmpty() },
            sourceKey = key,
        )
        val serverId = upsertServer(server)
        database.serverDao().markActive(serverId, System.currentTimeMillis())
        return database.serverDao().getServer(serverId)?.toDomain() ?: server.copy(id = serverId)
    }

    /**
     * Refreshes the library of [server] (Xtream sections or the M3U playlist).
     *
     * Single-flight per server: when a sync of the same server is already running (a login and
     * the startup refresh, or the worker and the Settings button), the second caller follows its
     * progress and completes with it instead of downloading everything again. If the running
     * sync is cancelled, a waiting caller takes over. A [SyncMode.FULL] caller that joined a
     * [SyncMode.BACKGROUND] pass (which skips fresh sections and stops early for playback) then
     * syncs the sections that pass did not refresh.
     *
     * Progress phases are localized. The last emission is (100, 100); failures are thrown as
     * [SyncException] with a localized message.
     */
    fun refreshServerFast(server: ServerProfile, mode: SyncMode = SyncMode.FULL): Flow<LoadProgress> = channelFlow {
        // Sections synced at or after this time (by a joined background pass) are not synced again.
        var freshSince = 0L
        while (true) {
            val (entry, owner) = claimSync(server.id, mode)
            if (owner) {
                // The entry is released before it completes, so a waiter that wakes up (and may
                // take over after a cancellation) never finds the finished entry still registered.
                try {
                    val outcome = runSync(server, mode, freshSince) { progress ->
                        entry.progress.value = progress
                        send(progress)
                    }
                    releaseSync(server.id, entry)
                    entry.done.complete(outcome)
                    send(readyProgress(outcome))
                } catch (throwable: Throwable) {
                    releaseSync(server.id, entry)
                    entry.done.completeExceptionally(throwable)
                    throw throwable
                }
                return@channelFlow
            }
            val relay = launch { entry.progress.filterNotNull().collect { send(it) } }
            val result = runCatching { entry.done.await() }
            relay.cancelAndJoin()
            val failure = result.exceptionOrNull()
            if (failure == null) {
                if (mode == SyncMode.FULL && entry.mode == SyncMode.BACKGROUND) {
                    freshSince = entry.startedAt
                    continue
                }
                send(readyProgress(result.getOrThrow()))
                return@channelFlow
            }
            if (failure is CancellationException) {
                currentCoroutineContext().ensureActive()
                continue
            }
            throw failure
        }
    }

    /**
     * Creates a QR activation code for this install ([publicDeviceId] is stable per install, so the
     * website expires this device's older waiting codes). The countdown is receipt time plus the
     * server's relative TTL, on both the wall clock (display) and the monotonic clock (expiry
     * checks): the server's absolute expiresAt is never compared with the TV clock, which is often
     * wrong on boxes. A fresh source-pull token is minted for every code.
     */
    suspend fun createDeviceActivation(deviceName: String, publicDeviceId: String): DeviceActivationSession {
        val sourcePullToken = secureToken(32)
        val webResponse = withContext(Dispatchers.IO) {
            webApiService.createWebDeviceActivation(
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
        val receivedElapsed = SystemClock.elapsedRealtime()
        val receivedWall = System.currentTimeMillis()
        val webCode = webResponse.code.trim().uppercase(Locale.US)
        if (webCode.isBlank()) throw IllegalStateException("Activation backend did not return a code")
        val verificationUrl = BuildConfig.ACTIVATION_URL
        val ttlMs = activationTtlMs(webResponse.ttlSeconds)
        return DeviceActivationSession(
            deviceCode = webCode,
            userCode = webCode,
            verificationUrl = verificationUrl,
            verificationUrlComplete = verificationUrl.withQueryParameter("code", webCode),
            expiresAt = receivedWall + ttlMs,
            intervalSeconds = 5,
            status = DeviceActivationStatus.WAITING,
            publicDeviceId = publicDeviceId,
            sourcePullToken = sourcePullToken,
            expiresAtElapsed = receivedElapsed + ttlMs,
            sourceDeadlineElapsed = receivedElapsed + ACTIVATION_SOURCE_WINDOW_MS,
        )
    }

    /**
     * One poll of [session]: the code status, then (once the phone confirmed it) the one-time
     * source. Never throws apart from cancellation: transport failures, timeouts and 408/425/429/5xx
     * come back as [ActivationPollResult.Transient] so the caller keeps the same code and backs off;
     * 404/410 mean the code expired, a 401 from /source means the token was rejected.
     */
    suspend fun pollDeviceActivation(session: DeviceActivationSession): ActivationPollResult {
        if (session.publicDeviceId.isBlank() || session.sourcePullToken.isBlank()) {
            return ActivationPollResult.Invalid(0)
        }
        val statusResponse = try {
            withContext(Dispatchers.IO) {
                webApiService.webDeviceActivationStatus(
                    activationApiUrl(
                        "status",
                        mapOf(
                            "code" to session.deviceCode,
                            "product" to BuildConfig.APP_PRODUCT_SLUG,
                        ),
                    ),
                )
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            return activationFailureOutcome(failure, ActivationEndpoint.STATUS)
        }
        return when (statusResponse.status.lowercase(Locale.US)) {
            "activated" -> {
                val confirmed = session.confirmedByPhone(SystemClock.elapsedRealtime(), System.currentTimeMillis())
                val sourceResponse = try {
                    // The website deletes the source when it answers this pull, so the answer must
                    // reach the caller even if polling is stopped meanwhile (QR panel left, app in
                    // the background, a new code requested).
                    runToCompletion(Dispatchers.IO) {
                        webApiService.webDeviceActivationSource(
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
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (failure: Exception) {
                    return activationFailureOutcome(failure, ActivationEndpoint.SOURCE)
                }
                val profile = sourceResponse.source?.toActivatedProfile(
                    sourceId = sourceResponse.sourceId,
                    publicDeviceId = session.publicDeviceId,
                    sourcePullToken = session.sourcePullToken,
                )
                when {
                    profile != null -> ActivationPollResult.SourceReady(
                        confirmed.copy(status = DeviceActivationStatus.ACTIVATED, error = ""),
                        profile,
                    )
                    // The website already handed the source out (to an earlier run of this app, or a
                    // pull whose answer never arrived); by design it cannot be fetched a second time.
                    statusResponse.sourceStatus.lowercase(Locale.US) == "source_fetched" ->
                        ActivationPollResult.Waiting(confirmed.copy(error = I18n.strings.app.activationSourceNotReceived))
                    else -> ActivationPollResult.Waiting(confirmed.copy(error = ""))
                }
            }
            "expired" -> ActivationPollResult.Expired(ActivationExpiry.CODE_EXPIRED)
            "error", "invalid" -> ActivationPollResult.Invalid(0)
            else -> ActivationPollResult.Waiting(session.copy(error = ""))
        }
    }

    private fun claimSync(serverId: Long, mode: SyncMode): Pair<InFlightSync, Boolean> = synchronized(inFlightSyncs) {
        val running = inFlightSyncs[serverId]
        if (running != null) {
            running to false
        } else {
            InFlightSync(mode).also { inFlightSyncs[serverId] = it } to true
        }
    }

    private fun releaseSync(serverId: Long, entry: InFlightSync) {
        synchronized(inFlightSyncs) {
            if (inFlightSyncs[serverId] === entry) inFlightSyncs.remove(serverId)
        }
    }

    private fun readyProgress(outcome: SyncOutcome): LoadProgress {
        val strings = I18n.strings.sync
        return LoadProgress(if (outcome.partial) strings.readyPartial else strings.ready, 100, 100)
    }

    /** [freshSince] > 0: sections (or the playlist) synced at or after it are skipped. */
    private suspend fun runSync(
        server: ServerProfile,
        mode: SyncMode,
        freshSince: Long,
        progress: suspend (LoadProgress) -> Unit,
    ): SyncOutcome {
        // Always work from the stored row: callers may hold a snapshot taken before the last sync.
        val current = database.serverDao().getServer(server.id)?.toDomain() ?: throw ServerRemovedException()
        return when (current.kind) {
            LoginKind.XTREAM -> syncXtream(current, mode, freshSince, progress)
            LoginKind.M3U -> if (isLocalPlaylist(current)) SyncOutcome(partial = false) else syncM3uSource(current, mode, freshSince, progress)
        }
    }

    /**
     * Xtream sync: account first (trying the http/https alternate only for transport failures),
     * then live, movies and series, each streamed and written in batches. A movie or series
     * failure (or an empty live list while channels are cached) is recorded with backoff and
     * does not fail the refresh; other live failures and account rejections do.
     */
    private suspend fun syncXtream(
        server: ServerProfile,
        mode: SyncMode,
        freshSince: Long,
        progress: suspend (LoadProgress) -> Unit,
    ): SyncOutcome {
        val strings = I18n.strings.sync
        val host = hostOf(server)
        progress(LoadProgress(strings.connecting, 2, 100))
        val (credentials, root) = try {
            resolveXtreamAccount(server.baseUrl, server.username, server.password, server.playlistUrl, host) {
                progress(LoadProgress(strings.tryingAlternateAddress, 4, 100))
            }
        } catch (failure: SyncException) {
            // No section can sync without the account: back off all of them (an expired account
            // must not be asked again every hour by the background worker).
            recordSyncFailure(server.id, XTREAM_SECTIONS.map { it.type.name }, failure, "xtream")
            throw failure
        }
        progress(LoadProgress(strings.checkingAccount, 6, 100))
        val account = XtreamSupport.parseAccountSnapshot(json, server.id, root, System.currentTimeMillis())
        database.serverDao().updateRuntimeInfo(
            serverId = server.id,
            // lastSyncAt moves only after the sections below, so an interrupted sync is retried.
            lastSyncAt = server.lastSyncAt,
            accountStatus = account.accountInfo?.status.orEmpty(),
            expiryDate = account.accountInfo?.expiryDate ?: 0,
            activeConnections = account.accountInfo?.activeConnections ?: 0,
            maxConnections = account.accountInfo?.maxConnections ?: 0,
            allowedOutputFormats = account.accountInfo?.allowedOutputFormats.orEmpty(),
            timezone = account.serverInfo?.timezone.orEmpty(),
            serverMessage = account.serverInfo?.message.orEmpty(),
            lastSyncSource = server.lastSyncSource.ifBlank { "xtream" },
            epgUrl = server.epgUrl,
            sourceKey = server.sourceKey.ifBlank { sourceKey("xtream", "${credentials.baseUrl}|${credentials.username}") },
        )
        val api = xtreamFactory(credentials.baseUrl)
        val state = database.syncStateDao().get(server.id)
        val meta = SyncMeta.decode(state?.rawJson)
        var partial = false
        var executed = 0
        for (section in XTREAM_SECTIONS) {
            // Just refreshed by the background pass this full refresh waited for.
            if (freshSince > 0L && (state?.syncedAt(section.type) ?: 0L) >= freshSince) continue
            if (mode == SyncMode.BACKGROUND) {
                val now = System.currentTimeMillis()
                val syncedAt = state?.syncedAt(section.type) ?: 0L
                if (!sectionNeedsSync(syncedAt, meta.failures[section.type.name], now, BACKGROUND_SECTION_STALE_MS, respectBackoff = true)) continue
                // The viewer started watching: leave the rest for a later run unless it is very old.
                if (executed > 0 && PlaybackActivity.isLikelyActive() && !isStale(syncedAt, now, PLAYBACK_OVERRIDE_STALE_MS)) break
            }
            executed++
            try {
                syncXtreamSection(server, credentials, api, account, section, host, progress)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (removed: ServerRemovedException) {
                throw removed
            } catch (throwable: Exception) {
                val error = SyncFailures.classify(throwable, host)
                recordSyncFailure(server.id, listOf(section.type.name), error, "xtream")
                // An empty live list with channels cached is suspicious (an overloaded panel), not
                // fatal: the cached channels are kept and movies and series still refresh.
                val liveFailed = section.type == ContentType.LIVE && error.kind != SyncErrorKind.EMPTY_LIBRARY
                if (liveFailed || error.kind.isAccountRejection) throw error
                partial = true
            }
        }
        if (executed > 0) {
            if (database.mediaDao().countForServer(server.id) == 0) {
                throw SyncException(SyncErrorKind.EMPTY_LIBRARY, host, detail = "no live, movie or series items")
            }
            database.serverDao().touch(server.id, System.currentTimeMillis())
        }
        return SyncOutcome(partial)
    }

    private suspend fun syncXtreamSection(
        server: ServerProfile,
        credentials: XtreamCredentials,
        api: XtreamService,
        account: XtreamAccountSnapshot,
        section: XtreamSection,
        host: String,
        progress: suspend (LoadProgress) -> Unit,
    ) {
        val strings = I18n.strings.sync
        progress(LoadProgress(section.loadingLabel(strings), section.startPercent, 100))
        repeat(BULK_FETCH_ATTEMPTS) { attempt ->
            try {
                streamXtreamSection(server, credentials, api, account, section, host, progress)
                return
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (throwable: Exception) {
                // A retry restarts the whole list; rows already written are rewritten idempotently.
                val waitMs = SyncFailures.retryDelayMs(throwable, attempt, BULK_FETCH_BACKOFF_MS)
                if (waitMs == null || attempt == BULK_FETCH_ATTEMPTS - 1) throw throwable
                delay(waitMs)
            }
        }
    }

    /**
     * Streams one Xtream list from the response body: categories are fetched alongside, each
     * element is mapped and handed to a [CatalogWriter], so memory stays at one write batch no
     * matter how large the panel is.
     */
    private suspend fun streamXtreamSection(
        server: ServerProfile,
        credentials: XtreamCredentials,
        api: XtreamService,
        account: XtreamAccountSnapshot,
        section: XtreamSection,
        host: String,
        progress: suspend (LoadProgress) -> Unit,
    ) = withContext(Dispatchers.IO) {
        val strings = I18n.strings.sync
        val writer = CatalogWriter(database, server.id)
        var meta = JsonObject(emptyMap())
        var sawList = false
        var categories: List<Category> = emptyList()
        coroutineScope {
            val categoriesAsync = async {
                val array = playerApiArray(api, credentials.username, credentials.password, mapOf("action" to section.categoryAction), host)
                XtreamSupport.parseCategories(server.id, section.type, array)
            }
            api.rawPlayerApiStream(credentialsQuery(credentials.username, credentials.password, mapOf("action" to section.streamAction))).use { body ->
                categories = categoriesAsync.await()
                val names = categories.associate { it.id to it.name }
                val liveOutput = defaultLiveExtension(account.allowedOutputFormats, credentials.playlistUrl)
                writer.stageCategories(categories.map { it.toEntity() })
                val counted = CountingInputStream(body.byteStream())
                val total = body.contentLength()
                var index = 0
                var reported = 0
                JsonStreamReader(InputStreamReader(counted, Charsets.UTF_8)).use { reader ->
                    while (true) {
                        val element = reader.next() ?: break
                        val item = mapSectionItem(section.type, element, index++, server.id, credentials, liveOutput, names) ?: continue
                        writer.add(item)
                        if (writer.accepted - reported >= CATALOG_WRITE_BATCH_SIZE) {
                            reported = writer.accepted
                            currentCoroutineContext().ensureActive()
                            progress(
                                LoadProgress(
                                    strings.withCount(section.loadingLabel(strings), writer.accepted),
                                    section.percentFor(counted.count, total),
                                    100,
                                ),
                            )
                        }
                    }
                    meta = reader.meta
                    sawList = reader.sawList
                }
            }
        }
        if (writer.accepted == 0) {
            rejectErrorResponse(meta, sawList, host)
            finishEmptySection(server.id, section.type, host, account)
        } else {
            writer.finish(listOf(section.type), categories.map { it.toEntity() }) {
                markSectionSynced(server.id, section.type, writer.accepted, account)
                if (section.type == ContentType.SERIES) {
                    // Episodes of series the panel removed, unless the user favorited or started them.
                    database.mediaDao().deleteOrphanEpisodes(server.id)
                    database.mediaSearchDao().deleteOrphanEpisodes(server.id)
                }
            }
        }
        progress(LoadProgress(strings.withCount(section.savedLabel(strings), writer.accepted), section.endPercent, 100))
    }

    private fun mapSectionItem(
        type: ContentType,
        element: JsonElement,
        index: Int,
        serverId: Long,
        credentials: XtreamCredentials,
        liveOutput: String,
        categories: Map<String, String>,
    ): MediaItem? = when (type) {
        ContentType.LIVE -> XtreamSupport.parseLiveStream(element, index, serverId, credentials, liveOutput, categories)
        ContentType.MOVIE -> XtreamSupport.parseVodStream(element, index, serverId, credentials, categories)
        ContentType.SERIES -> XtreamSupport.parseSeriesEntry(element, index, serverId, categories)
        ContentType.EPISODE -> null
    }

    /**
     * An empty list call: fine when a (possibly wrapped) empty list came back; an auth error or
     * an object without any list means the account was rejected or this is not an Xtream API.
     */
    private fun rejectErrorResponse(meta: JsonObject, sawList: Boolean, host: String) {
        if ("user_info" in meta) XtreamSupport.requireAuthorizedAccount(meta, host)
        if (sawList || meta.isEmpty()) return
        throw SyncException(SyncErrorKind.NOT_IPTV_API, host, detail = "list call returned an object: ${meta.keys.take(5)}")
    }

    /**
     * A well-formed empty list. With nothing cached it is a real empty section (for example a
     * live-only package whose panel still lists VOD categories): mark it synced and drop the
     * orphan categories. With cached rows it is suspicious: keep them and report it.
     */
    private suspend fun finishEmptySection(serverId: Long, type: ContentType, host: String, account: XtreamAccountSnapshot) {
        database.withTransaction {
            if (database.serverDao().getServer(serverId) == null) throw ServerRemovedException()
            if (database.mediaDao().countForServerType(serverId, type) > 0) {
                throw SyncException(SyncErrorKind.EMPTY_LIBRARY, host, detail = "${type.name} list came back empty; cached rows kept")
            }
            database.categoryDao().deleteForServerTypes(serverId, listOf(type))
            database.mediaSearchDao().deleteForServerTypes(serverId, listOf(type))
            markSectionSynced(serverId, type, 0, account)
        }
    }

    private suspend fun markSectionSynced(serverId: Long, type: ContentType, count: Int, account: XtreamAccountSnapshot) {
        val now = System.currentTimeMillis()
        account.accountInfo?.let { database.accountInfoDao().upsert(it) }
        account.serverInfo?.let { database.serverInfoDao().upsert(it) }
        editSyncState(serverId, "xtream") { state, meta ->
            val next = meta.withSuccess(type.name, count)
            state.copy(
                source = "xtream",
                status = if (next.failures.isEmpty()) "ready" else "partial",
                lastSyncAt = now,
                liveSyncedAt = if (type == ContentType.LIVE) now else state.liveSyncedAt,
                vodSyncedAt = if (type == ContentType.MOVIE) now else state.vodSyncedAt,
                seriesSyncedAt = if (type == ContentType.SERIES) now else state.seriesSyncedAt,
                lastError = next.failures.values.firstOrNull()?.kind.orEmpty(),
            ) to next
        }
    }

    private suspend fun recordSyncFailure(serverId: Long, sections: List<String>, error: SyncException, source: String) {
        val now = System.currentTimeMillis()
        editSyncState(serverId, source) { state, meta ->
            val next = sections.fold(meta) { current, section -> current.withFailure(section, error.kind, now) }
            state.copy(status = "partial", lastError = error.kind.name) to next
        }
    }

    /**
     * Read-modify-write of the sync_state row inside a transaction (Room serializes write
     * transactions, so concurrent library and guide updates cannot overwrite each other).
     * Nothing is written for a server that no longer exists.
     */
    private suspend fun editSyncState(
        serverId: Long,
        source: String,
        createIfMissing: Boolean = true,
        edit: (SyncStateEntity, SyncMeta) -> Pair<SyncStateEntity, SyncMeta>,
    ) {
        database.withTransaction {
            if (database.serverDao().getServer(serverId) == null) return@withTransaction
            val now = System.currentTimeMillis()
            val current = database.syncStateDao().get(serverId)
                ?: if (createIfMissing) emptySyncState(serverId, source, now) else return@withTransaction
            val (next, meta) = edit(current, SyncMeta.decode(current.rawJson))
            database.syncStateDao().upsert(next.copy(rawJson = meta.encode(), updatedAt = now))
        }
    }

    private fun emptySyncState(serverId: Long, source: String, now: Long) = SyncStateEntity(
        serverId = serverId,
        source = source,
        status = "ready",
        lastSyncAt = 0,
        liveSyncedAt = 0,
        vodSyncedAt = 0,
        seriesSyncedAt = 0,
        epgSyncedAt = 0,
        lastError = "",
        rawJson = "",
        updatedAt = now,
    )

    private suspend fun syncM3uSource(
        server: ServerProfile,
        mode: SyncMode,
        freshSince: Long,
        progress: suspend (LoadProgress) -> Unit,
    ): SyncOutcome {
        val host = hostOf(server)
        if (freshSince > 0L && (database.syncStateDao().get(server.id)?.lastSyncAt ?: 0L) >= freshSince) {
            return SyncOutcome(partial = false)
        }
        if (mode == SyncMode.BACKGROUND) {
            val state = database.syncStateDao().get(server.id)
            val meta = SyncMeta.decode(state?.rawJson)
            val due = sectionNeedsSync(
                state?.lastSyncAt ?: 0L,
                meta.failures[PLAYLIST_SECTION],
                System.currentTimeMillis(),
                BACKGROUND_SECTION_STALE_MS,
                respectBackoff = true,
            )
            if (!due) return SyncOutcome(partial = false)
        }
        var failure: SyncException? = null
        httpUrlCandidates(server.playlistUrl).forEachIndexed { index, url ->
            if (index > 0) progress(LoadProgress(I18n.strings.sync.tryingAlternateAddress, 6, 100))
            try {
                syncM3uFrom(server, url, progress)
                return SyncOutcome(partial = false)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (removed: ServerRemovedException) {
                throw removed
            } catch (throwable: Exception) {
                val error = SyncFailures.classify(throwable, host, SyncTarget.PLAYLIST)
                failure = SyncFailures.prefer(failure, error)
                // Only a transport failure can be helped by the other scheme.
                if (!error.kind.isTransport) {
                    recordSyncFailure(server.id, listOf(PLAYLIST_SECTION), error, sourceLabel(server))
                    throw error
                }
            }
        }
        val error = failure ?: SyncException(SyncErrorKind.UNKNOWN, host)
        recordSyncFailure(server.id, listOf(PLAYLIST_SECTION), error, sourceLabel(server))
        throw error
    }

    /**
     * Downloads the playlist to a temp file while hashing it (constant memory), skips the import
     * when the content and parser version are unchanged, and otherwise parses it line by line
     * into batched writes.
     */
    private suspend fun syncM3uFrom(server: ServerProfile, url: String, progress: suspend (LoadProgress) -> Unit) {
        val strings = I18n.strings.sync
        progress(LoadProgress(strings.downloadingPlaylist, 10, 100))
        withContext(Dispatchers.IO) {
            val temp = scratchFile("m3u-${server.id}.tmp")
            try {
                val hash = playlistService.getText(url).use { body ->
                    val hashing = HashingSink.sha256(temp.sink())
                    val sink = hashing.buffer()
                    try {
                        sink.writeAll(body.source())
                        sink.flush()
                        hashing.hash.hex()
                    } finally {
                        sink.close()
                    }
                }
                val meta = SyncMeta.decode(database.syncStateDao().get(server.id)?.rawJson)
                val headerEpg = temp.source().buffer().use { source -> playlistHeaderEpgUrl { source.readUtf8Line() } }
                val unchanged = meta.playlistHash == hash &&
                    meta.parserVersion == M3U_PARSER_VERSION &&
                    database.mediaDao().countForServer(server.id) > 0
                if (unchanged) {
                    database.withTransaction {
                        if (database.serverDao().getServer(server.id) == null) throw ServerRemovedException()
                        markPlaylistSynced(server, hash, meta.counts[PLAYLIST_SECTION] ?: 0, server.epgUrl.ifBlank { headerEpg })
                    }
                    progress(LoadProgress(strings.playlistUnchanged, 96, 100))
                    return@withContext
                }
                val length = temp.length().coerceAtLeast(1L)
                val counted = CountingInputStream(temp.inputStream())
                counted.source().buffer().use { source ->
                    importPlaylist(
                        server = server,
                        playlistHash = hash,
                        progress = progress,
                        readFraction = { counted.count.toFloat() / length },
                    ) { source.readUtf8Line() }
                }
            } finally {
                temp.delete()
            }
        }
    }

    /** Guide URL announced by the playlist header (`#EXTM3U url-tvg=...`), read from the first line. */
    private fun playlistHeaderEpgUrl(nextLine: () -> String?): String {
        while (true) {
            val line = nextLine() ?: return ""
            if (line.isBlank()) continue
            val session = parser.newSession(0)
            session.accept(line)
            return session.epgUrls().firstOrNull().orEmpty()
        }
    }

    /**
     * Parses playlist lines into batched writes and completes the import atomically (stale rows
     * removed, categories swapped, sync state and guide URL saved).
     */
    private suspend fun importPlaylist(
        server: ServerProfile,
        playlistHash: String,
        progress: suspend (LoadProgress) -> Unit,
        readFraction: () -> Float?,
        nextLine: () -> String?,
    ) {
        val strings = I18n.strings.sync
        progress(LoadProgress(strings.readingPlaylist, 30, 100))
        val session = parser.newSession(server.id)
        val writer = CatalogWriter(database, server.id)
        var playable = 0
        var reported = 0
        var checkedStart = false
        while (true) {
            val line = nextLine() ?: break
            if (!checkedStart && line.isNotBlank()) {
                checkedStart = true
                // A login page or error page is not a playlist; fail before writing anything.
                if (line.trim().trimStart('\uFEFF').startsWith("<")) {
                    throw SyncException(SyncErrorKind.INVALID_PLAYLIST, hostOf(server), detail = "web page instead of M3U")
                }
            }
            val items = session.accept(line) ?: continue
            for (item in items) {
                if (writer.add(item) && item.streamUrl.isNotBlank()) playable++
            }
            if (writer.accepted - reported >= CATALOG_WRITE_BATCH_SIZE) {
                reported = writer.accepted
                currentCoroutineContext().ensureActive()
                val percent = 30 + ((readFraction() ?: 0f).coerceIn(0f, 1f) * 60).toInt()
                progress(LoadProgress(strings.withCount(strings.readingPlaylist, writer.accepted), percent, 100))
            }
        }
        if (playable == 0) {
            throw SyncException(SyncErrorKind.INVALID_PLAYLIST, hostOf(server), detail = "no playable entries")
        }
        progress(LoadProgress(strings.withCount(strings.savingLibrary, writer.accepted), 92, 100))
        val epgUrl = server.epgUrl.ifBlank { session.epgUrls().firstOrNull().orEmpty() }
        writer.finish(ContentType.entries, session.categories().map { it.toEntity() }) {
            markPlaylistSynced(server, playlistHash, writer.accepted, epgUrl)
        }
    }

    /** Must run inside a transaction. A newly discovered guide URL marks the guide as due. */
    private suspend fun markPlaylistSynced(server: ServerProfile, playlistHash: String, count: Int, epgUrl: String) {
        val now = System.currentTimeMillis()
        val source = sourceLabel(server)
        val guideChanged = epgUrl != server.epgUrl
        editSyncState(server.id, source) { state, meta ->
            state.copy(
                source = source,
                status = "ready",
                lastSyncAt = now,
                liveSyncedAt = now,
                vodSyncedAt = now,
                seriesSyncedAt = now,
                epgSyncedAt = if (guideChanged) 0L else state.epgSyncedAt,
                lastError = "",
            ) to meta.copy(playlistHash = playlistHash, parserVersion = M3U_PARSER_VERSION).withSuccess(PLAYLIST_SECTION, count)
        }
        database.serverDao().updateRuntimeInfo(
            serverId = server.id,
            lastSyncAt = now,
            accountStatus = "",
            expiryDate = 0,
            activeConnections = 0,
            maxConnections = 0,
            allowedOutputFormats = "",
            timezone = "",
            serverMessage = "",
            lastSyncSource = source,
            epgUrl = epgUrl,
            sourceKey = server.sourceKey.ifBlank { sourceKey(source, server.playlistUrl) },
        )
    }

    private suspend fun probePlaylist(url: String, host: String) = withContext(Dispatchers.IO) {
        try {
            playlistService.getText(httpUrlCandidates(url).first()).use { body ->
                val source = body.source()
                source.request(PLAYLIST_PROBE_BYTES)
                val head = source.buffer.snapshot(minOf(source.buffer.size, PLAYLIST_PROBE_BYTES).toInt()).utf8()
                val text = head.trimStart('\uFEFF', ' ', '\t', '\r', '\n')
                if (!text.startsWith("#EXTM3U", ignoreCase = true) && !text.contains("#EXTINF", ignoreCase = true)) {
                    throw SyncException(SyncErrorKind.INVALID_PLAYLIST, host, detail = "no #EXTM3U header")
                }
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (throwable: Exception) {
            throw SyncFailures.classify(throwable, host, SyncTarget.PLAYLIST)
        }
    }

    private suspend fun repairLegacyCatchup() {
        if (catchupRepaired.compareAndSet(false, true)) database.mediaDao().clearDisabledCatchup()
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

    /**
     * Finds the first address candidate whose account call succeeds. The http/https alternate
     * is only tried when the previous attempt did not get a verdict from the panel; an account
     * rejection is reported at once, and when everything fails the most meaningful error wins.
     */
    private suspend fun resolveXtreamAccount(
        rawBaseUrl: String,
        username: String,
        password: String,
        playlistUrl: String,
        host: String,
        onAlternate: suspend () -> Unit = {},
    ): Pair<XtreamCredentials, JsonObject> {
        val candidates = xtreamCredentialCandidates(rawBaseUrl, username, password, playlistUrl)
        if (candidates.isEmpty()) {
            throw SyncException(SyncErrorKind.INVALID_CREDENTIALS, host, detail = "missing username or password")
        }
        var failure: SyncException? = null
        candidates.forEachIndexed { index, credentials ->
            if (index > 0) onAlternate()
            try {
                val root = playerApiObject(
                    xtreamFactory(credentials.baseUrl),
                    credentials.username,
                    credentials.password,
                    attempts = ACCOUNT_FETCH_ATTEMPTS,
                    host = host,
                )
                XtreamSupport.requireAuthorizedAccount(root, host)
                return credentials to root
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (throwable: Exception) {
                val error = SyncFailures.classify(throwable, host)
                failure = SyncFailures.prefer(failure, error)
                if (error.kind.isAccountRejection) throw error
            }
        }
        throw failure ?: SyncException(SyncErrorKind.UNKNOWN, host)
    }

    /** One player_api call with transient-failure retries; parsed leniently (BOM, trailing commas). */
    private suspend fun playerApiElement(api: XtreamService, query: Map<String, String>, attempts: Int): JsonElement =
        withContext(Dispatchers.IO) {
            repeat(attempts) { attempt ->
                try {
                    return@withContext api.rawPlayerApi(query).use { body ->
                        JsonStreamReader(InputStreamReader(body.byteStream(), Charsets.UTF_8)).use { it.readDocument() }
                    }
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (throwable: Exception) {
                    val waitMs = SyncFailures.retryDelayMs(throwable, attempt, BULK_FETCH_BACKOFF_MS)
                    if (waitMs == null || attempt == attempts - 1) throw throwable
                    delay(waitMs)
                }
            }
            throw IllegalStateException("Xtream request failed")
        }

    private suspend fun playerApiObject(
        api: XtreamService,
        username: String,
        password: String,
        extra: Map<String, String> = emptyMap(),
        attempts: Int = BULK_FETCH_ATTEMPTS,
        host: String = "",
    ): JsonObject {
        val element = playerApiElement(api, credentialsQuery(username, password, extra), attempts)
        return element as? JsonObject
            ?: throw SyncException(SyncErrorKind.NOT_IPTV_API, host, detail = "player_api did not return an object")
    }

    /** Small list calls (categories): a list, a `{"data": [...]}` wrapper or an index-keyed object. */
    private suspend fun playerApiArray(
        api: XtreamService,
        username: String,
        password: String,
        extra: Map<String, String>,
        host: String,
    ): JsonArray = when (val element = playerApiElement(api, credentialsQuery(username, password, extra), BULK_FETCH_ATTEMPTS)) {
        is JsonArray -> element
        is JsonObject -> when {
            "user_info" in element -> {
                XtreamSupport.requireAuthorizedAccount(element, host)
                JsonArray(emptyList())
            }
            element["data"] is JsonArray -> element["data"] as JsonArray
            element.keys.all { key -> key.isNotEmpty() && key.all { it in '0'..'9' } } ->
                JsonArray(element.values.filterIsInstance<JsonObject>())
            else -> JsonArray(emptyList())
        }
        else -> JsonArray(emptyList())
    }

    private fun credentialsQuery(username: String, password: String, extra: Map<String, String>): Map<String, String> =
        buildMap {
            put("username", username)
            put("password", password)
            putAll(extra)
        }

    /**
     * get_series_info with the two parameter names panels use. A transient failure was already
     * retried by [playerApiObject] and is thrown at once; the other name is only tried when the
     * first one got a real (non-transient) failure.
     */
    private suspend fun fetchSeriesInfoObject(
        api: XtreamService,
        username: String,
        password: String,
        seriesId: String,
        host: String,
    ): JsonObject {
        val queries = listOf(
            mapOf("action" to "get_series_info", "series_id" to seriesId),
            mapOf("action" to "get_series_info", "series" to seriesId),
        )
        var failure: Exception? = null
        for (query in queries) {
            try {
                return playerApiObject(api, username, password, query, host = host)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (throwable: Exception) {
                if (SyncFailures.retryDelayMs(throwable, 0, 0L) != null) throw throwable
                failure = throwable
            }
        }
        throw failure ?: SyncException(SyncErrorKind.NOT_IPTV_API, host)
    }

    private fun String.ensureTrailingSlash(): String = if (endsWith('/')) this else "$this/"

    private fun savedXtreamCredentials(server: ServerProfile): XtreamCredentials =
        xtreamCredentialCandidates(server.baseUrl, server.username, server.password, server.playlistUrl).firstOrNull()
            ?: XtreamCredentials(
                baseUrl = (XtreamSupport.normalizeServerBaseUrl(server.baseUrl) ?: server.baseUrl).ensureTrailingSlash(),
                username = server.username,
                password = server.password,
                playlistUrl = server.playlistUrl,
            )

    private fun xtreamCredentialCandidates(
        rawBaseUrl: String,
        username: String,
        password: String,
        playlistUrl: String = "",
    ): List<XtreamCredentials> {
        val suppliedUsername = username.trim()
        val suppliedPassword = password.trim()
        val rawCandidates = buildList {
            add(rawBaseUrl)
            if (playlistUrl.isNotBlank()) add(playlistUrl)
            addAll(httpUrlCandidates(rawBaseUrl))
            if (playlistUrl.isNotBlank()) addAll(httpUrlCandidates(playlistUrl))
        }.map { it.trim() }.filter { it.isNotBlank() }.distinct()

        val extracted = rawCandidates.mapNotNull { candidate ->
            val credentials = XtreamSupport.extractActivationSource(candidate)
                ?: XtreamSupport.extractCredentialsFromPlaylistUrl(candidate)
                ?: return@mapNotNull null
            val resolvedUsername = suppliedUsername.ifBlank { credentials.username }
            val resolvedPassword = suppliedPassword.ifBlank { credentials.password }
            val resolvedBase = XtreamSupport.normalizeServerBaseUrl(credentials.baseUrl)
                ?: XtreamSupport.normalizeServerBaseUrl(candidate)
                ?: return@mapNotNull null
            if (resolvedUsername.isBlank() || resolvedPassword.isBlank()) {
                null
            } else {
                credentials.copy(
                    baseUrl = resolvedBase.ensureTrailingSlash(),
                    username = resolvedUsername,
                    password = resolvedPassword,
                    playlistUrl = credentials.playlistUrl.ifBlank { playlistUrl.trim() },
                )
            }
        }

        val plain = rawCandidates.mapNotNull { candidate ->
            if (suppliedUsername.isBlank() || suppliedPassword.isBlank()) {
                null
            } else {
                XtreamSupport.normalizeServerBaseUrl(candidate)?.ensureTrailingSlash()?.let { base ->
                    XtreamCredentials(
                        baseUrl = base,
                        username = suppliedUsername,
                        password = suppliedPassword,
                        playlistUrl = playlistUrl.trim(),
                    )
                }
            }
        }

        return (extracted + plain)
            .distinctBy { "${it.baseUrl}|${it.username}" }
    }

    private fun httpUrlCandidates(raw: String, trailingSlash: Boolean = false): List<String> {
        val normalized = raw.trim()
        if (normalized.isBlank()) return emptyList()
        val withScheme = if (normalized.startsWith("http://", ignoreCase = true) || normalized.startsWith("https://", ignoreCase = true)) {
            normalized
        } else {
            "http://${normalized.trimStart('/')}"
        }
        val alternate = when {
            withScheme.startsWith("http://", ignoreCase = true) && !withScheme.contains(":80/") -> withScheme.replaceFirst("http://", "https://", ignoreCase = true)
            withScheme.startsWith("https://", ignoreCase = true) -> withScheme.replaceFirst("https://", "http://", ignoreCase = true)
            else -> withScheme
        }
        return listOf(withScheme, alternate)
            .map { if (trailingSlash) it.ensureTrailingSlash() else it }
            .distinct()
    }

    private fun String.hostLabel(): String = runCatching {
        java.net.URI(this).host?.removePrefix("www.") ?: this
    }.getOrElse { this }.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.US) else it.toString() }

    private fun hostOf(server: ServerProfile): String =
        server.host.ifBlank { XtreamSupport.hostLabel(server.baseUrl.ifBlank { server.playlistUrl }) }

    private fun isLocalPlaylist(server: ServerProfile): Boolean =
        server.kind == LoginKind.M3U && server.playlistUrl.startsWith("file:", ignoreCase = true)

    private fun sourceLabel(server: ServerProfile): String = when {
        server.kind == LoginKind.XTREAM -> "xtream"
        isLocalPlaylist(server) -> "m3u-file"
        else -> "m3u"
    }

}

/** Playlist links whose player_api is missing, blocked or broken fall back to a plain M3U import. */
private val PLAYLIST_FALLBACK_KINDS = setOf(
    SyncErrorKind.NOT_IPTV_API,
    SyncErrorKind.ACCESS_DENIED,
    SyncErrorKind.SERVER_ERROR,
)

private class XtreamSection(
    val type: ContentType,
    val categoryAction: String,
    val streamAction: String,
    val startPercent: Int,
    val endPercent: Int,
    val loadingLabel: (SyncStrings) -> String,
    val savedLabel: (SyncStrings) -> String,
) {
    /** Progress inside the section from bytes read, when the body length is known. */
    fun percentFor(bytesRead: Long, contentLength: Long): Int {
        if (contentLength <= 0L) return startPercent + 1
        val span = (endPercent - startPercent - 1).coerceAtLeast(1)
        return startPercent + (span * (bytesRead.toDouble() / contentLength).coerceIn(0.0, 1.0)).toInt()
    }
}

private val XTREAM_SECTIONS = listOf(
    XtreamSection(ContentType.LIVE, "get_live_categories", "get_live_streams", 8, 38, { it.loadingLive }, { it.savedLive }),
    XtreamSection(ContentType.MOVIE, "get_vod_categories", "get_vod_streams", 38, 68, { it.loadingMovies }, { it.savedMovies }),
    XtreamSection(ContentType.SERIES, "get_series_categories", "get_series", 68, 96, { it.loadingSeries }, { it.savedSeries }),
)

/** Counts bytes read through it (download progress for streamed bodies). */
private class CountingInputStream(input: InputStream) : FilterInputStream(input) {
    @Volatile
    var count: Long = 0L
        private set

    override fun read(): Int = super.read().also { if (it >= 0) count++ }

    override fun read(buffer: ByteArray, offset: Int, length: Int): Int =
        super.read(buffer, offset, length).also { if (it > 0) count += it }

    override fun skip(byteCount: Long): Long = super.skip(byteCount).also { count += it }
}

/**
 * Download scratch file in the app cache dir (`java.io.tmpdir` on Android). The name is fixed per
 * server so a file left behind when the process is killed mid-download (guides can be 100+ MB)
 * is overwritten by the next run instead of piling up; callers are single-flight per server.
 */
internal fun scratchFile(name: String, directory: File = File(System.getProperty("java.io.tmpdir").orEmpty().ifBlank { "." })): File {
    directory.mkdirs()
    return File(directory, name).also { it.delete() }
}

/**
 * Maps XMLTV channel ids to the keys live channels are stored under: exact matches first, then
 * a case-insensitive fallback that resolves to the stored spelling (guides often differ in case).
 */
internal fun epgChannelKeys(keys: Collection<String>): Map<String, String> {
    val map = HashMap<String, String>(keys.size * 2)
    keys.forEach { key ->
        if (key.isBlank()) return@forEach
        map[key] = key
        map.putIfAbsent(key.lowercase(Locale.ROOT), key)
    }
    return map
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

/** A new random device id in the website's format: MO-D- plus 24 of [A-Z0-9]. */
internal fun publicDeviceId(): String {
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

private fun String.escapeLike(): String =
    buildString(length) {
        for (char in this@escapeLike) {
            when (char) {
                '\\', '%', '_' -> append('\\').append(char)
                else -> append(char)
            }
        }
    }

private fun WebProviderSourceDto.toActivatedProfile(
    sourceId: String = "",
    publicDeviceId: String = "",
    sourcePullToken: String = "",
): ActivatedProfile? {
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
                sourceId = sourceId,
                publicDeviceId = publicDeviceId,
                sourcePullToken = sourcePullToken,
            )
        }
        "m3u", "m3u8" -> {
            val source = playlistUrl.ifBlank { serverUrl }
            if (source.isBlank()) null else ActivatedProfile(
                name = name.ifBlank { XtreamSupport.hostLabel(source) },
                kind = LoginKind.M3U,
                playlistUrl = source,
                epgUrl = epgUrl,
                sourceId = sourceId,
                publicDeviceId = publicDeviceId,
                sourcePullToken = sourcePullToken,
            )
        }
        else -> null
    }
}
