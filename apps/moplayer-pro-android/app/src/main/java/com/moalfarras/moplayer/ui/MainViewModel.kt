package com.moalfarras.moplayer.ui

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.moalfarras.moplayer.data.repository.AppRemoteConfigService
import com.moalfarras.moplayer.data.repository.AppSettingsRepository
import com.moalfarras.moplayer.data.repository.IptvRepository
import com.moalfarras.moplayer.data.repository.WidgetRepository
import com.moalfarras.moplayer.domain.model.AccentMode
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.subscriptionInactive
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.ActivatedProfile
import com.moalfarras.moplayer.domain.model.Category
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.DeviceActivationSession
import com.moalfarras.moplayer.domain.model.DeviceActivationStatus
import com.moalfarras.moplayer.domain.model.FootballMatch
import com.moalfarras.moplayer.domain.model.LiveEpgSnapshot
import com.moalfarras.moplayer.domain.model.LibraryMode
import com.moalfarras.moplayer.domain.model.LoadProgress
import com.moalfarras.moplayer.domain.model.LoginKind
import com.moalfarras.moplayer.domain.model.ManualWeatherEffect
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.MotionLevel
import com.moalfarras.moplayer.domain.model.PerformanceMode
import com.moalfarras.moplayer.domain.model.ServerProfile
import com.moalfarras.moplayer.domain.model.SortOption
import com.moalfarras.moplayer.domain.model.ThemePreset
import com.moalfarras.moplayer.domain.model.WeatherMode
import com.moalfarras.moplayer.domain.model.VideoSizeMode
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import com.moalfarras.moplayerpro.BuildConfig
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import androidx.paging.PagingData
import androidx.paging.cachedIn
import androidx.paging.filter
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

enum class AppSection { HOME, LIVE, MOVIES, SERIES, FAVORITES, SERIES_DETAIL, SETTINGS, SEARCH, PLAYER }

data class UiState(
    val section: AppSection = AppSection.HOME,
    val returnSection: AppSection = AppSection.HOME,
    val activeServer: ServerProfile? = null,
    val servers: List<ServerProfile> = emptyList(),
    val settings: AppSettings = AppSettings(),
    val loading: LoadProgress? = null,
    val error: String? = null,
    val selectedCategoryId: String = "",
    val focusedItem: MediaItem? = null,
    val restoreFocusItem: MediaItem? = null,
    val seriesDetail: MediaItem? = null,
    val seriesDetailsLoading: Boolean = false,
    val playingItem: MediaItem? = null,
    val searchQuery: String = "",
    val committedSearchQuery: String = "",
    val showExitDialog: Boolean = false,
    val notice: String? = null,
    val settingsUnlocked: Boolean = false,
    val activationSession: DeviceActivationSession? = null,
    val dockFocusSection: AppSection? = null,
    val backgroundRefresh: LoadProgress? = null,
    val subscriptionExpired: Boolean = false,
    val subscriptionExpiredDismissedKey: String = "",
    val appControlBlocked: Boolean = false,
    /** False until the stored servers/settings have been read once, so the UI can show a splash
     *  instead of flashing the sign-in screen on cold start while an account is already saved. */
    val initialized: Boolean = false,
)

private data class CategoryQueryKey(
    val serverId: Long,
    val type: ContentType,
    val hideEmpty: Boolean,
    val hideNoLogo: Boolean,
    val parentalControlsEnabled: Boolean,
)

private data class SelectedMediaQueryKey(
    val serverId: Long,
    val type: ContentType,
    val selectedCategoryId: String,
    val sortOption: SortOption,
    val hideNoLogo: Boolean,
    val parentalControlsEnabled: Boolean,
)

private data class LiveZapQueryKey(
    val serverId: Long,
    val selectedCategoryId: String,
    val sortOption: SortOption,
    val hideNoLogo: Boolean,
    val parentalControlsEnabled: Boolean,
)

private data class SearchQueryKey(
    val serverId: Long,
    val query: String,
    val parentalControlsEnabled: Boolean,
    val hideChannelsWithoutLogo: Boolean,
)

private data class FocusedLiveEpgQuery(
    val server: ServerProfile,
    val item: MediaItem,
)

@OptIn(ExperimentalCoroutinesApi::class)
class MainViewModel(
    private val iptv: IptvRepository,
    private val settingsRepo: AppSettingsRepository,
    private val widgets: WidgetRepository,
    private val remoteConfigService: AppRemoteConfigService = AppRemoteConfigService(),
) : ViewModel() {
    private val internal = MutableStateFlow(UiState())
    private var loginJob: Job? = null
    private var activationJob: Job? = null
    private var backgroundSyncJob: Job? = null
    private var seriesPrefetchJob: Job? = null
    private var seriesPrefetchKey = ""
    private var moviePrefetchJob: Job? = null
    private var moviePrefetchKey = ""
    private var liveDnsPrewarmJob: Job? = null
    private var liveDnsPrewarmKey = ""
    private val prewarmedHosts = java.util.Collections.synchronizedSet(mutableSetOf<String>())
    private var restoredLastSection = false
    private var startupRefreshKey = ""
    private var lastFocusUpdateAt = 0L
    private var lastFocusKey = ""
    private var lastPersistedNavigationKey = ""
    private var searchCommitJob: Job? = null

    private val lastFocusedBySection = mutableMapOf<AppSection, MediaItem?>()
    private val lastCategoryBySection = mutableMapOf<AppSection, String>()

    private fun sectionsWithMediaFocus(): Set<AppSection> = setOf(
        AppSection.HOME,
        AppSection.LIVE,
        AppSection.MOVIES,
        AppSection.SERIES,
        AppSection.FAVORITES,
        AppSection.SERIES_DETAIL,
        AppSection.SEARCH,
    )

    private fun persistSnapshot(section: AppSection, focused: MediaItem?, categoryId: String) {
        if (section in sectionsWithMediaFocus()) {
            lastFocusedBySection[section] = focused
            lastCategoryBySection[section] = categoryId
            persistNavigation(section, focused, categoryId)
        }
    }

    private fun loadSnapshot(section: AppSection): Pair<MediaItem?, String> =
        lastFocusedBySection[section] to (lastCategoryBySection[section].orEmpty())

    val uiState: StateFlow<UiState> = combine(
        internal,
        iptv.activeServer,
        iptv.servers,
        settingsRepo.settings,
    ) { state, active, servers, settings ->
        val inactive = active?.subscriptionInactive() == true
        // Show the expired prompt whenever the active account is inactive, unless the user
        // already dismissed it for this exact account (so a different/renewed account re-arms it).
        val dismissedForThis = active != null && active.sourceKey.isNotBlank() &&
            active.sourceKey == state.subscriptionExpiredDismissedKey
        state.copy(
            activeServer = active,
            servers = servers,
            settings = settings,
            subscriptionExpired = inactive && !dismissedForThis,
            initialized = true,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UiState())

    val weather = MutableStateFlow(WeatherSnapshot())
    val football = MutableStateFlow<List<FootballMatch>>(emptyList())

    private val activeLibraryServerId = uiState
        .map { state -> state.activeServer?.let { state.libraryServerId(it.id) } }
        .distinctUntilChanged()

    val liveCategories = uiState
        .map { state ->
            state.activeServer?.let { server ->
                CategoryQueryKey(
                    serverId = state.libraryServerId(server.id),
                    type = ContentType.LIVE,
                    hideEmpty = state.settings.hideEmptyCategories,
                    hideNoLogo = state.settings.hideChannelsWithoutLogo,
                    parentalControlsEnabled = state.settings.parentalControlsEnabled,
                )
            }
        }
        .distinctUntilChanged()
        .flatMapLatest { key ->
            if (key == null) {
                flowOf(emptyList())
            } else {
                iptv.categories(key.serverId, key.type, hideEmpty = key.hideEmpty, hideNoLogo = key.hideNoLogo)
                    .map { categories -> categories.filterParentalCategories(key.parentalControlsEnabled) }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val movieCategories = uiState
        .map { state ->
            state.activeServer?.let { server ->
                CategoryQueryKey(
                    serverId = state.libraryServerId(server.id),
                    type = ContentType.MOVIE,
                    hideEmpty = state.settings.hideEmptyCategories,
                    hideNoLogo = false,
                    parentalControlsEnabled = state.settings.parentalControlsEnabled,
                )
            }
        }
        .distinctUntilChanged()
        .flatMapLatest { key ->
            if (key == null) {
                flowOf(emptyList())
            } else {
                iptv.categories(key.serverId, key.type, hideEmpty = key.hideEmpty, hideNoLogo = key.hideNoLogo)
                    .map { categories -> categories.filterParentalCategories(key.parentalControlsEnabled) }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val seriesCategories = uiState
        .map { state ->
            state.activeServer?.let { server ->
                CategoryQueryKey(
                    serverId = state.libraryServerId(server.id),
                    type = ContentType.SERIES,
                    hideEmpty = state.settings.hideEmptyCategories,
                    hideNoLogo = false,
                    parentalControlsEnabled = state.settings.parentalControlsEnabled,
                )
            }
        }
        .distinctUntilChanged()
        .flatMapLatest { key ->
            if (key == null) {
                flowOf(emptyList())
            } else {
                iptv.categories(key.serverId, key.type, hideEmpty = key.hideEmpty, hideNoLogo = key.hideNoLogo)
                    .map { categories -> categories.filterParentalCategories(key.parentalControlsEnabled) }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val selectedMedia: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = combine(
        uiState,
        liveCategories,
        movieCategories,
        seriesCategories,
    ) { state, live, movies, series ->
        val browsingSection = state.mediaBrowsingSection()
        val type = browsingSection.mediaContentType() ?: return@combine null
        val server = state.activeServer ?: return@combine null
        val categoryIds = when (browsingSection) {
            AppSection.LIVE -> live.mapTo(mutableSetOf()) { it.id }
            AppSection.MOVIES -> movies.mapTo(mutableSetOf()) { it.id }
            AppSection.SERIES -> series.mapTo(mutableSetOf()) { it.id }
            else -> emptySet()
        }
        val selectedCategoryId = state.selectedCategoryId.takeIf { category ->
            category.isBlank() || category in categoryIds
        }.orEmpty()
        SelectedMediaQueryKey(
            serverId = state.libraryServerId(server.id),
            type = type,
            selectedCategoryId = selectedCategoryId,
            sortOption = state.settings.defaultSort,
            hideNoLogo = type == ContentType.LIVE && state.settings.hideChannelsWithoutLogo,
            parentalControlsEnabled = state.settings.parentalControlsEnabled,
        )
    }
        .distinctUntilChanged()
        .flatMapLatest { key ->
            if (key == null) {
                flowOf(PagingData.empty())
            } else {
                val source = if (key.selectedCategoryId.isBlank()) {
                    iptv.mediaByType(key.serverId, key.type, key.sortOption, key.hideNoLogo)
                } else {
                    iptv.mediaByCategory(key.serverId, key.type, key.selectedCategoryId, key.sortOption, key.hideNoLogo)
                }
                source.map { pagingData ->
                    pagingData.filter { item ->
                        val isParental = key.parentalControlsEnabled &&
                            adultKeywords.any {
                                "${item.title} ${item.description} ${item.categoryName} ${item.categoryId}".contains(it, ignoreCase = true)
                            }
                        val hiddenLogo = key.hideNoLogo && item.posterUrl.isBlank()
                        !isParental && !hiddenLogo
                    }
                }
            }
        }
        .cachedIn(viewModelScope)

    val latestMovies: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = activeLibraryServerId
        .flatMapLatest { serverId -> serverId?.let { iptv.latestMovies(it) } ?: flowOf(PagingData.empty()) }
        .cachedIn(viewModelScope)

    val latestLive: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = activeLibraryServerId
        .flatMapLatest { serverId -> serverId?.let { iptv.latestLive(it) } ?: flowOf(PagingData.empty()) }
        .cachedIn(viewModelScope)

    val liveZapItems: StateFlow<List<MediaItem>> = uiState
        .map { state ->
            state.activeServer?.let { server ->
                LiveZapQueryKey(
                    serverId = state.libraryServerId(server.id),
                    selectedCategoryId = state.selectedCategoryId.takeIf { state.section == AppSection.LIVE }.orEmpty(),
                    sortOption = state.settings.defaultSort,
                    hideNoLogo = state.settings.hideChannelsWithoutLogo,
                    parentalControlsEnabled = state.settings.parentalControlsEnabled,
                )
            }
        }
        .distinctUntilChanged()
        .flatMapLatest { key ->
            if (key == null) {
                flowOf(emptyList())
            } else {
                iptv.liveZapItems(
                    serverId = key.serverId,
                    categoryId = key.selectedCategoryId,
                    sortOption = key.sortOption,
                    hideNoLogo = key.hideNoLogo,
                ).map { items ->
                    items.filter { item ->
                        val isParental = key.parentalControlsEnabled &&
                            adultKeywords.any {
                                "${item.title} ${item.description} ${item.categoryName} ${item.categoryId}".contains(it, ignoreCase = true)
                            }
                        !isParental
                    }
                }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val latestSeries: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = activeLibraryServerId
        .flatMapLatest { serverId -> serverId?.let { iptv.latestSeries(it) } ?: flowOf(PagingData.empty()) }
        .cachedIn(viewModelScope)

    val favorites: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = activeLibraryServerId
        .flatMapLatest { serverId -> serverId?.let { iptv.favorites(it) } ?: flowOf(PagingData.empty()) }
        .cachedIn(viewModelScope)

    val continueWatching: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = activeLibraryServerId
        .flatMapLatest { serverId -> serverId?.let { iptv.continueWatching(it) } ?: flowOf(PagingData.empty()) }
        .cachedIn(viewModelScope)

    val recentLive: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = activeLibraryServerId
        .flatMapLatest { serverId -> serverId?.let { iptv.recentlyPlayed(it, ContentType.LIVE) } ?: flowOf(PagingData.empty()) }
        .cachedIn(viewModelScope)

    val searchResults: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState
        .map { state ->
            val server = state.activeServer
            val query = state.committedSearchQuery.trim()
            if (server == null || query.length < 2) {
                null
            } else {
                SearchQueryKey(
                    serverId = state.libraryServerId(server.id),
                    query = query,
                    parentalControlsEnabled = state.settings.parentalControlsEnabled,
                    hideChannelsWithoutLogo = state.settings.hideChannelsWithoutLogo,
                )
            }
        }
        .distinctUntilChanged()
        .flatMapLatest { key ->
            if (key == null) {
                flowOf(PagingData.empty())
            } else {
                iptv.search(key.serverId, key.query).map { pagingData ->
                    pagingData.filter { item ->
                        val isParental = key.parentalControlsEnabled &&
                            adultKeywords.any {
                                "${item.title} ${item.description} ${item.categoryName} ${item.categoryId}".contains(it, ignoreCase = true)
                            }
                        val hiddenLogo = key.hideChannelsWithoutLogo && item.type == ContentType.LIVE && item.posterUrl.isBlank()
                        !isParental && !hiddenLogo
                    }
                }
            }
        }
        .cachedIn(viewModelScope)

    val seriesEpisodes: kotlinx.coroutines.flow.Flow<List<MediaItem>> = uiState
        .map { state ->
            state.seriesDetail
                ?.takeIf { it.seriesId.isNotBlank() }
                ?.let { it.serverId to it.seriesId }
        }
        .distinctUntilChanged()
        .flatMapLatest { key ->
            if (key == null) flowOf(emptyList()) else iptv.episodes(key.first, key.second)
        }

    val focusedLiveEpg = uiState
        .map { state ->
            val server = state.activeServer
            val item = state.focusedItem
            if (server == null || item == null || item.type != ContentType.LIVE) {
                null
            } else {
                FocusedLiveEpgQuery(server, item)
            }
        }
        .distinctUntilChanged()
        .flatMapLatest { query ->
            if (query == null) {
                flowOf(LiveEpgSnapshot())
            } else {
                kotlinx.coroutines.flow.flow { emit(iptv.liveEpg(query.server, query.item)) }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), LiveEpgSnapshot())

    init {
        applyRemoteRuntimeConfig()
        refreshWidgets()
        viewModelScope.launch {
            combine(uiState, liveCategories, movieCategories, seriesCategories) { state, live, movies, series ->
                val categoryIds = when (state.section) {
                    AppSection.LIVE -> live.mapTo(mutableSetOf()) { it.id }
                    AppSection.MOVIES -> movies.mapTo(mutableSetOf()) { it.id }
                    AppSection.SERIES -> series.mapTo(mutableSetOf()) { it.id }
                    else -> emptySet()
                }
                state.section to (state.selectedCategoryId to categoryIds)
            }.collect { (section, selection) ->
                val (selectedCategoryId, categoryIds) = selection
                if (section in listOf(AppSection.LIVE, AppSection.MOVIES, AppSection.SERIES) &&
                    selectedCategoryId.isNotBlank() &&
                    categoryIds.isNotEmpty() &&
                    selectedCategoryId !in categoryIds
                ) {
                    lastCategoryBySection[section] = ""
                    persistNavigation(section, null, "")
                    internal.update { current ->
                        if (current.section == section && current.selectedCategoryId == selectedCategoryId) {
                            current.copy(
                                selectedCategoryId = "",
                                focusedItem = null,
                                restoreFocusItem = null,
                            )
                        } else {
                            current
                        }
                    }
                }
            }
        }
        viewModelScope.launch {
            uiState.collect { state ->
                state.activeServer?.let { server ->
                    if (!restoredLastSection) {
                        restoredLastSection = true
                        restorePersistentNavigation(state)
                    }
                    maybeStartStartupRefresh(server)
                }

                // Restore browsing state only. Live playback must always be started by the user.
            }
        }
    }

    fun select(section: AppSection) {
        val cur = internal.value
        persistSnapshot(cur.section, cur.focusedItem, cur.selectedCategoryId)
        val requirePin = section == AppSection.SETTINGS && uiState.value.settings.hasParentalPin
        val (restoredFocus, restoredCategory) = loadSnapshot(section)
        val validRestoredCategory = restoredCategory.takeIf { category ->
            category.isBlank() || category in categoryIdsForSection(section)
        }.orEmpty()
        val validRestoredFocus = restoredFocus?.takeIf { focus ->
            validRestoredCategory.isBlank() || focus.categoryId == validRestoredCategory
        }
        internal.update {
            it.copy(
                section = section,
                returnSection = section,
                focusedItem = validRestoredFocus,
                restoreFocusItem = validRestoredFocus,
                selectedCategoryId = validRestoredCategory,
                dockFocusSection = null,
                error = null,
                settingsUnlocked = if (section == AppSection.SETTINGS) !requirePin else it.settingsUnlocked,
                seriesDetail = if (section == AppSection.SERIES || section == AppSection.HOME || section == AppSection.FAVORITES) null else it.seriesDetail,
            )
        }
        saveLastSection(section)
    }

    fun handleIncomingPlaylistUrl(url: String) {
        loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                if (BuildConfig.DEBUG) Log.d("MoPlayerImport", "Starting imported playlist login")
                internal.update { it.copy(loading = LoadProgress("Detecting IPTV source", 8, 100), error = null) }
                iptv.registerXtreamFromPlaylistUrl("Imported IPTV", url)?.let { server ->
                    if (BuildConfig.DEBUG) Log.d("MoPlayerImport", "Imported playlist as Xtream source")
                    openSourceAfterLogin(
                        server = server,
                        readyNotice = "Source imported. Live, movies and series are ready.",
                        cachedNotice = "Source imported. Local library is open while updates continue.",
                    )
                    return@runCatching
                }
                val server = iptv.registerM3uSource("Imported IPTV", url)
                if (BuildConfig.DEBUG) Log.d("MoPlayerImport", "Imported playlist as M3U source")
                openSourceAfterLogin(
                    server = server,
                    readyNotice = "Playlist imported. Channels and VOD are ready.",
                    cachedNotice = "Playlist imported. Local library is open while updates continue.",
                )
            }.onFailure { throwable ->
                if (BuildConfig.DEBUG) Log.w("MoPlayerImport", "Imported playlist login failed", throwable)
                internal.update { it.copy(error = throwable.message ?: "Could not import this source", loading = null) }
            }
        }
    }

    fun selectCategory(category: Category) {
        val sec = internal.value.section
        if (sec in sectionsWithMediaFocus()) {
            lastCategoryBySection[sec] = category.id
            lastFocusedBySection[sec] = null
            persistNavigation(sec, null, category.id)
        }
        internal.update {
            it.copy(
                selectedCategoryId = category.id,
                focusedItem = null,
                restoreFocusItem = null,
                dockFocusSection = null,
            )
        }
        saveLastSection(sec)
    }

    fun clearCategory() {
        val sec = internal.value.section
        if (sec in sectionsWithMediaFocus()) {
            lastCategoryBySection[sec] = ""
            lastFocusedBySection[sec] = null
            persistNavigation(sec, null, "")
        }
        internal.update {
            it.copy(
                selectedCategoryId = "",
                focusedItem = null,
                restoreFocusItem = null,
                dockFocusSection = null,
            )
        }
        saveLastSection(sec)
    }

    fun focusItem(item: MediaItem?) {
        val key = item?.let { "${it.type}:${it.serverId}:${it.id}" }.orEmpty()
        val now = System.currentTimeMillis()
        if (item != null && key == lastFocusKey && now - lastFocusUpdateAt < 120L) return
        lastFocusKey = key
        lastFocusUpdateAt = now
        internal.update {
            val sec = it.section
            if (sec in sectionsWithMediaFocus() && item != null) {
                lastFocusedBySection[sec] = item
                persistNavigation(sec, item, it.selectedCategoryId)
            }
            it.copy(
                focusedItem = item,
                restoreFocusItem = if (item != null) null else it.restoreFocusItem,
                dockFocusSection = if (item != null) null else it.dockFocusSection,
            )
        }
        scheduleSeriesDetailsPrefetch(item)
        scheduleMovieDetailsPrefetch(item)
        scheduleLiveDnsPrewarm(item)
    }

    private fun scheduleSeriesDetailsPrefetch(item: MediaItem?) {
        val seriesItem = item?.takeIf { it.type == ContentType.SERIES }
        if (seriesItem == null) {
            seriesPrefetchKey = ""
            seriesPrefetchJob?.cancel()
            seriesPrefetchJob = null
            return
        }
        val key = "${seriesItem.serverId}:${seriesItem.seriesId.ifBlank { seriesItem.id }}"
        if (key.isBlank()) return
        if (key == seriesPrefetchKey && seriesPrefetchJob?.isActive == true) return
        seriesPrefetchKey = key
        seriesPrefetchJob?.cancel()
        seriesPrefetchJob = viewModelScope.launch {
            delay(SERIES_DETAIL_PREFETCH_DELAY_MS)
            val focused = internal.value.focusedItem
            if (!focused.matchesMedia(seriesItem)) return@launch
            val server = iptv.server(seriesItem.serverId)
                ?: uiState.value.activeServer?.takeIf { active -> active.id == seriesItem.serverId }
                ?: return@launch
            if (server.kind != LoginKind.XTREAM) return@launch
            runCatching { iptv.refreshSeriesDetails(server, seriesItem) }
        }
    }

    private fun scheduleMovieDetailsPrefetch(item: MediaItem?) {
        val movieItem = item?.takeIf { it.type == ContentType.MOVIE }
        if (movieItem == null) {
            moviePrefetchKey = ""
            moviePrefetchJob?.cancel()
            moviePrefetchJob = null
            return
        }
        val key = "${movieItem.serverId}:${movieItem.id}"
        if (key == moviePrefetchKey && moviePrefetchJob?.isActive == true) return
        moviePrefetchKey = key
        moviePrefetchJob?.cancel()
        moviePrefetchJob = viewModelScope.launch {
            delay(MOVIE_DETAIL_PREFETCH_DELAY_MS)
            val focused = internal.value.focusedItem
            if (!focused.matchesMedia(movieItem)) return@launch
            val server = iptv.server(movieItem.serverId)
                ?: uiState.value.activeServer?.takeIf { active -> active.id == movieItem.serverId }
                ?: return@launch
            if (server.kind != LoginKind.XTREAM) return@launch
            runCatching { iptv.refreshVodDetails(server, movieItem) }
        }
    }

    /**
     * Warm the OS DNS cache for a focused live channel's stream host so pressing OK skips the
     * DNS lookup and the channel opens faster. Crucially this only RESOLVES the host — it opens
     * no socket/stream — so it never consumes a provider's (often single) connection slot.
     * Providers usually serve every channel from one host, so this resolves once per session.
     */
    private fun scheduleLiveDnsPrewarm(item: MediaItem?) {
        val liveItem = item?.takeIf { it.type == ContentType.LIVE }
        if (liveItem == null) {
            liveDnsPrewarmKey = ""
            liveDnsPrewarmJob?.cancel()
            liveDnsPrewarmJob = null
            return
        }
        val host = runCatching { java.net.URI(liveItem.streamUrl).host }.getOrNull()
            ?.takeIf { it.isNotBlank() } ?: return
        if (host in prewarmedHosts) return
        if (host == liveDnsPrewarmKey && liveDnsPrewarmJob?.isActive == true) return
        liveDnsPrewarmKey = host
        liveDnsPrewarmJob?.cancel()
        liveDnsPrewarmJob = viewModelScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            delay(LIVE_DNS_PREWARM_DELAY_MS)
            if (!internal.value.focusedItem.matchesMedia(liveItem)) return@launch
            runCatching { java.net.InetAddress.getAllByName(host) }
            prewarmedHosts.add(host)
        }
    }

    fun play(item: MediaItem) {
        if (uiState.value.appControlBlocked) {
            showNotice(uiState.value.error ?: "MoPlayer Pro is temporarily unavailable.")
            return
        }
        viewModelScope.launch { iptv.notePlaybackStart(item) }
        when (item.type) {
            ContentType.SERIES -> {
                seriesPrefetchJob?.cancel()
                seriesPrefetchJob = null
                openSeries(item)
            }
            ContentType.LIVE -> {
                internal.update { current ->
                    val returnSection = if (current.section == AppSection.PLAYER) {
                        current.returnSection.playerReturnSection()
                    } else {
                        persistSnapshot(current.section, current.focusedItem, current.selectedCategoryId)
                        saveLastSection(current.section)
                        current.section.playerReturnSection()
                    }
                    current.copy(playingItem = item, returnSection = returnSection, section = AppSection.PLAYER)
                }
            }
            else -> {
                internal.update { current ->
                    val returnSection = if (current.section == AppSection.PLAYER) {
                        current.returnSection.playerReturnSection()
                    } else {
                        persistSnapshot(current.section, current.focusedItem, current.selectedCategoryId)
                        saveLastSection(current.section)
                        current.section.playerReturnSection()
                    }
                    current.copy(playingItem = item, returnSection = returnSection, section = AppSection.PLAYER)
                }
                if (item.type == ContentType.MOVIE) refreshMovieDetailsForPlayer(item)
            }
        }
    }

    fun closePlayer(positionMs: Long = 0, durationMs: Long = 0) {
        val item = internal.value.playingItem
        val back = when (internal.value.returnSection) {
            AppSection.PLAYER -> AppSection.HOME
            else -> internal.value.returnSection
        }
        if (item != null && item.type != ContentType.LIVE && durationMs > 0) {
            viewModelScope.launch { iptv.updateWatch(item, positionMs, durationMs) }
        }
        if (item != null && back in sectionsWithMediaFocus()) {
            lastFocusedBySection[back] = item
        }
        internal.update {
            val (f, c) = loadSnapshot(back)
            saveLastSection(back)
            it.copy(
                playingItem = null,
                section = back,
                returnSection = back,
                focusedItem = f,
                restoreFocusItem = f,
                selectedCategoryId = c.ifEmpty { it.selectedCategoryId },
                dockFocusSection = null,
            )
        }
    }

    fun updatePlaybackProgress(item: MediaItem, positionMs: Long, durationMs: Long) {
        if (item.type == ContentType.LIVE || durationMs <= 0) return
        viewModelScope.launch { iptv.updateWatch(item, positionMs, durationMs) }
    }

    fun navigateBack() {
        internal.update { state ->
            when (state.section) {
                AppSection.SERIES_DETAIL -> {
                    val (f, c) = loadSnapshot(AppSection.SERIES)
                    state.copy(
                        section = AppSection.SERIES,
                        seriesDetail = null,
                        seriesDetailsLoading = false,
                        focusedItem = f,
                        restoreFocusItem = f,
                        selectedCategoryId = c,
                        dockFocusSection = null,
                    )
                }
                AppSection.SEARCH, AppSection.SETTINGS, AppSection.LIVE, AppSection.MOVIES, AppSection.SERIES, AppSection.FAVORITES -> {
                    persistSnapshot(state.section, state.focusedItem, state.selectedCategoryId)
                    state.copy(
                        section = AppSection.HOME,
                        dockFocusSection = state.section,
                        focusedItem = null,
                        restoreFocusItem = null,
                        seriesDetailsLoading = false,
                        selectedCategoryId = "",
                    )
                }
                else -> state
            }
        }
        saveLastSection(internal.value.section)
    }

    fun focusDock(section: AppSection = internal.value.section) {
        internal.update {
            it.copy(
                dockFocusSection = section,
                restoreFocusItem = null,
            )
        }
    }

    fun toggleFavorite(item: MediaItem) {
        viewModelScope.launch { iptv.toggleFavorite(item) }
    }

    fun loginM3u(name: String, url: String, epgUrl: String = "") {
        loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                iptv.registerXtreamFromPlaylistUrl(name, url)?.let { server ->
                    openSourceAfterLogin(
                        server = server,
                        readyNotice = "Server loaded. Live, movies and series are ready.",
                        cachedNotice = "Server saved. Local library is open while updates continue.",
                    )
                    return@runCatching
                }
                internal.update { it.copy(loading = LoadProgress("Saving playlist on this device", 15, 100), error = null) }
                val server = iptv.registerM3uSource(name, url, epgUrl)
                openSourceAfterLogin(
                    server = server,
                    readyNotice = "Playlist loaded. Channels and VOD are ready.",
                    cachedNotice = "Playlist saved. Local library is open while updates continue.",
                )
            }.onFailure { throwable ->
                internal.update { it.copy(error = throwable.message ?: "M3U login failed", loading = null) }
            }
        }
    }

    fun loginM3uText(name: String, sourceName: String, playlistText: String) {
        loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                iptv.loginM3uText(name, sourceName, playlistText).collect { progress -> internal.update { it.copy(loading = progress, error = null) } }
            }.onFailure { throwable ->
                internal.update { it.copy(error = throwable.message ?: "M3U file import failed", loading = null) }
            }.onSuccess {
                internal.update { it.copy(loading = null, section = AppSection.HOME) }
                saveLastSection(AppSection.HOME)
                settingsRepo.setLibraryMode(LibraryMode.ACTIVE_SOURCE)
            }
        }
    }

    fun loginXtream(name: String, baseUrl: String, username: String, password: String) {
        loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                internal.update { it.copy(loading = LoadProgress("Saving server on this device", 15, 100), error = null) }
                val server = iptv.registerXtreamSource(name, baseUrl, username, password)
                openSourceAfterLogin(
                    server = server,
                    readyNotice = "Server loaded. Live, movies and series are ready.",
                    cachedNotice = "Server saved. Local library is open while updates continue.",
                )
            }.onFailure { throwable ->
                internal.update { it.copy(error = throwable.message ?: "Xtream login failed", loading = null) }
            }
        }
    }

    fun loginActivationCode(code: String) {
        loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                internal.update { it.copy(loading = LoadProgress("Checking activation code", 5, 100), error = null) }
                val profile = iptv.resolveActivationProfile(code)
                startActivatedProfileLogin(profile, cancelExisting = false)
            }.onFailure { throwable ->
                internal.update { it.copy(error = activationErrorMessage(throwable, "Could not activate this device. Check the code and try again."), loading = null) }
            }
        }
    }

    fun refreshDeviceActivation(deviceName: String = android.os.Build.MODEL ?: "Android TV") {
        activationJob?.cancel()
        activationJob = viewModelScope.launch {
            runCatching { iptv.createDeviceActivation(deviceName) }
                .onFailure { throwable ->
                    Log.w("MoPlayerActivation", "Could not create website QR activation", throwable)
                    internal.update {
                        it.copy(
                            activationSession = null,
                            error = activationErrorMessage(
                                throwable,
                                "Could not create a real website QR code. Check moalfarras.space/Supabase configuration.",
                            ),
                        )
                    }
                }
                .onSuccess { session ->
                    internal.update { it.copy(activationSession = session, error = null) }
                    pollDeviceActivation(session)
                }
        }
    }

    fun stopDeviceActivation() {
        activationJob?.cancel()
        activationJob = null
    }

    private suspend fun pollDeviceActivation(initial: DeviceActivationSession) {
        var session = initial
        while (true) {
            delay(session.intervalSeconds.coerceAtLeast(3) * 1000L)
            val (updated, profile) = runCatching { iptv.pollDeviceActivation(session) }
                .getOrElse { throwable ->
                    session.copy(
                        status = DeviceActivationStatus.ERROR,
                        error = activationErrorMessage(throwable, "Could not continue activation right now. Refresh the QR code or try later."),
                    ) to null
                }
            session = updated
            internal.update { it.copy(activationSession = updated, error = if (updated.status == DeviceActivationStatus.ERROR) updated.error else it.error) }
            when {
                profile != null -> {
                    startActivatedProfileLogin(profile)
                    return
                }
                updated.status == DeviceActivationStatus.EXPIRED || updated.status == DeviceActivationStatus.ERROR -> return
            }
        }
    }

    private fun startActivatedProfileLogin(profile: ActivatedProfile, cancelExisting: Boolean = true) {
        if (cancelExisting) loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                when (profile.kind) {
                    com.moalfarras.moplayer.domain.model.LoginKind.XTREAM -> {
                        internal.update { it.copy(loading = LoadProgress("Saving server on this device", 20, 100), error = null) }
                        val server = iptv.registerXtreamSource(
                            name = profile.name,
                            baseUrl = profile.baseUrl,
                            username = profile.username,
                            password = profile.password,
                            playlistUrl = profile.playlistUrl,
                        )
                        openSourceAfterLogin(
                            server = server,
                            readyNotice = "Server activated. Live, movies and series are ready.",
                            cachedNotice = "Server activated. Local library is open while updates continue.",
                            clearActivationSession = true,
                        )
                        acknowledgeActivatedProfile(profile, imported = true)
                    }
                    com.moalfarras.moplayer.domain.model.LoginKind.M3U -> {
                        internal.update { it.copy(loading = LoadProgress("Saving playlist on this device", 20, 100), error = null) }
                        val server = iptv.registerXtreamFromPlaylistUrl(profile.name, profile.playlistUrl)
                            ?: iptv.registerM3uSource(profile.name, profile.playlistUrl, profile.epgUrl)
                        openSourceAfterLogin(
                            server = server,
                            readyNotice = "Source activated. Library is ready.",
                            cachedNotice = "Source activated. Local library is open while updates continue.",
                            clearActivationSession = true,
                        )
                        acknowledgeActivatedProfile(profile, imported = true)
                    }
                }
            }.onFailure { throwable ->
                acknowledgeActivatedProfile(profile, imported = false, message = activationErrorMessage(throwable, "Import failed"))
                internal.update { it.copy(error = activationErrorMessage(throwable, "Activated, but account sync failed. Try again later."), loading = null) }
            }
        }
    }

    private suspend fun openSourceAfterLogin(
        server: ServerProfile,
        readyNotice: String,
        cachedNotice: String,
        clearActivationSession: Boolean = false,
    ) {
        val hasLocalLibrary = runCatching { iptv.hasLocalLibrary(server.id) }.getOrDefault(false)
        if (hasLocalLibrary) {
            internal.update {
                it.copy(
                    loading = null,
                    backgroundRefresh = null,
                    section = AppSection.HOME,
                    activationSession = if (clearActivationSession) null else it.activationSession,
                    error = null,
                    notice = cachedNotice,
                )
            }
            saveLastSection(AppSection.HOME)
            settingsRepo.setLibraryMode(LibraryMode.ACTIVE_SOURCE)
            startBackgroundLibraryRefresh(server)
            return
        }

        try {
            iptv.refreshServerFast(server).collect { progress ->
                internal.update {
                    it.copy(
                        loading = progress,
                        backgroundRefresh = null,
                        error = null,
                    )
                }
            }
        } catch (throwable: Throwable) {
            if (throwable is CancellationException) throw throwable
            val stillEmpty = runCatching { !iptv.hasLocalLibrary(server.id) }.getOrDefault(false)
            if (stillEmpty) runCatching { iptv.deleteServer(server.id) }
            throw throwable
        }
        internal.update {
            it.copy(
                loading = null,
                backgroundRefresh = null,
                section = AppSection.HOME,
                activationSession = if (clearActivationSession) null else it.activationSession,
                error = null,
                notice = readyNotice,
            )
        }
        saveLastSection(AppSection.HOME)
        settingsRepo.setLibraryMode(LibraryMode.ACTIVE_SOURCE)
        refreshEpgSilently()
    }

    private fun acknowledgeActivatedProfile(profile: ActivatedProfile, imported: Boolean, message: String = "") {
        if (profile.sourceId.isBlank()) return
        viewModelScope.launch {
            iptv.acknowledgeWebActivationSource(
                publicDeviceId = profile.publicDeviceId,
                token = profile.sourcePullToken,
                sourceId = profile.sourceId,
                imported = imported,
                message = message,
            )
        }
    }

    private fun refreshMovieDetailsForPlayer(item: MediaItem) {
        viewModelScope.launch {
            val server = iptv.server(item.serverId)
                ?: uiState.value.activeServer?.takeIf { active -> active.id == item.serverId }
                ?: return@launch
            if (server.kind != LoginKind.XTREAM) return@launch
            val enriched = runCatching { iptv.refreshVodDetails(server, item) }.getOrNull() ?: return@launch
            internal.update { state ->
                if (state.playingItem.matchesMedia(item)) {
                    state.copy(playingItem = enriched)
                } else {
                    state
                }
            }
        }
    }

    private fun startBackgroundLibraryRefresh(server: ServerProfile) {
        backgroundSyncJob?.cancel()
        backgroundSyncJob = viewModelScope.launch {
            runCatching {
                iptv.refreshServerFast(server).collect { progress ->
                    internal.update { it.copy(backgroundRefresh = progress, error = null) }
                }
            }.onFailure { throwable ->
                internal.update {
                    it.copy(
                        backgroundRefresh = null,
                        notice = backgroundRefreshMessage(throwable),
                    )
                }
            }.onSuccess {
                internal.update {
                    it.copy(
                        backgroundRefresh = null,
                        error = null,
                        notice = "Library saved locally. Future starts open from cache.",
                    )
                }
                refreshEpgSilently()
            }
        }
    }

    private fun maybeStartStartupRefresh(server: ServerProfile) {
        val key = server.sourceKey.ifBlank { server.id.toString() }
        if (key.isBlank() || key == startupRefreshKey) return
        startupRefreshKey = key
        viewModelScope.launch {
            delay(1_500L)
            val needsRefresh = runCatching {
                iptv.needsLibraryRefresh(server, SMART_REFRESH_INTERVAL_MS)
            }.getOrDefault(server.lastSyncAt <= 0)
            if (needsRefresh) {
                startBackgroundLibraryRefresh(server)
            }
        }
    }

    fun setSearch(query: String) {
        val cur = internal.value
        if (cur.section != AppSection.SEARCH) {
            persistSnapshot(cur.section, cur.focusedItem, cur.selectedCategoryId)
            val (f, c) = loadSnapshot(AppSection.SEARCH)
            internal.update {
                it.copy(
                    searchQuery = query,
                    section = AppSection.SEARCH,
                    focusedItem = f,
                    restoreFocusItem = f,
                    selectedCategoryId = c,
                )
            }
        } else {
            internal.update { it.copy(searchQuery = query) }
        }
        saveLastSection(AppSection.SEARCH)
        val normalized = query.trim()
        searchCommitJob?.cancel()
        if (normalized.length >= 2) {
            searchCommitJob = viewModelScope.launch {
                delay(180)
                internal.update { state ->
                    if (state.section == AppSection.SEARCH && state.searchQuery.trim() == normalized) {
                        state.copy(committedSearchQuery = normalized)
                    } else {
                        state
                    }
                }
                delay(370)
                if (internal.value.searchQuery.trim() == normalized) {
                    settingsRepo.addSearchHistory(normalized)
                }
            }
        } else {
            internal.update { it.copy(committedSearchQuery = "") }
        }
    }

    fun setExitDialog(show: Boolean) {
        internal.update { it.copy(showExitDialog = show) }
    }

    fun clearNotice() {
        internal.update { it.copy(notice = null) }
    }

    fun showNotice(message: String) {
        internal.update { it.copy(notice = message) }
        viewModelScope.launch {
            kotlinx.coroutines.delay(2000)
            internal.update { if (it.notice == message) it.copy(notice = null) else it }
        }
    }

    fun unlockSettings(pin: String) {
        viewModelScope.launch {
            val ok = runCatching { settingsRepo.verifyParentalPin(pin) }.getOrDefault(false)
            if (ok) {
                internal.update { it.copy(settingsUnlocked = true, notice = "Settings unlocked", error = null) }
            } else {
                internal.update { it.copy(error = "Invalid PIN") }
            }
        }
    }

    fun lockSettings() {
        internal.update { it.copy(settingsUnlocked = false) }
    }

    fun setParentalPin(pin: String) {
        viewModelScope.launch {
            runCatching { settingsRepo.setParentalPin(pin) }
                .onSuccess { internal.update { it.copy(settingsUnlocked = true, notice = "PIN saved", error = null) } }
                .onFailure { throwable -> internal.update { it.copy(error = throwable.message ?: "Failed to save PIN") } }
        }
    }

    fun changeParentalPin(currentPin: String, newPin: String) {
        viewModelScope.launch {
            val ok = runCatching { settingsRepo.verifyParentalPin(currentPin) }.getOrDefault(false)
            if (!ok) {
                internal.update { it.copy(error = "Current PIN is incorrect") }
                return@launch
            }
            runCatching { settingsRepo.setParentalPin(newPin) }
                .onSuccess { internal.update { it.copy(notice = "PIN updated", error = null) } }
                .onFailure { throwable -> internal.update { it.copy(error = throwable.message ?: "Failed to update PIN") } }
        }
    }

    fun removeParentalPin(pin: String) {
        viewModelScope.launch {
            val ok = runCatching { settingsRepo.verifyParentalPin(pin) }.getOrDefault(false)
            if (!ok) {
                internal.update { it.copy(error = "Current PIN is incorrect") }
                return@launch
            }
            settingsRepo.clearParentalPin()
            internal.update { it.copy(settingsUnlocked = true, notice = "PIN removed", error = null) }
        }
    }

    fun setPreviewEnabled(value: Boolean) {
        viewModelScope.launch { settingsRepo.setPreviewEnabled(value) }
    }

    fun setParentalEnabled(value: Boolean) {
        viewModelScope.launch { settingsRepo.setParentalControlsEnabled(value) }
    }

    fun setAutoPlayLastLive(value: Boolean) {
        viewModelScope.launch { settingsRepo.setAutoPlayLastLive(value) }
    }

    fun setHideEmptyCategories(value: Boolean) {
        viewModelScope.launch { settingsRepo.setHideEmptyCategories(value) }
    }

    fun setHideChannelsWithoutLogo(value: Boolean) {
        viewModelScope.launch { settingsRepo.setHideChannelsWithoutLogo(value) }
    }

    fun setPreferredPlayer(value: String) {
        viewModelScope.launch { settingsRepo.setPreferredPlayer(value) }
    }

    fun setDefaultSort(value: SortOption) {
        viewModelScope.launch { settingsRepo.setDefaultSort(value) }
    }

    fun setLibraryMode(value: LibraryMode) {
        viewModelScope.launch { settingsRepo.setLibraryMode(value) }
    }

    fun setLanguage(tag: String) {
        viewModelScope.launch { settingsRepo.setLanguage(tag) }
    }

    fun setAccentMode(value: AccentMode) {
        viewModelScope.launch { settingsRepo.setAccentMode(value) }
    }

    fun setAccentColor(value: Long) {
        viewModelScope.launch {
            settingsRepo.setAccentColor(value)
            settingsRepo.setAccentMode(AccentMode.CUSTOM)
        }
    }

    fun setBackgroundMode(value: BackgroundMode) {
        viewModelScope.launch { settingsRepo.setBackgroundMode(value) }
    }

    fun setCustomBackgroundUrl(value: String) {
        viewModelScope.launch { settingsRepo.setCustomBackgroundUrl(value) }
    }

    fun setThemePreset(value: ThemePreset) {
        viewModelScope.launch { settingsRepo.setThemePreset(value) }
    }

    fun setMotionLevel(value: MotionLevel) {
        viewModelScope.launch { settingsRepo.setMotionLevel(value) }
    }

    fun setPerformanceMode(value: PerformanceMode) {
        viewModelScope.launch { settingsRepo.setPerformanceMode(value) }
    }

    fun setVideoSizeMode(value: VideoSizeMode) {
        viewModelScope.launch { settingsRepo.setVideoSizeMode(value) }
    }

    fun setShowWeatherWidget(value: Boolean) {
        viewModelScope.launch { settingsRepo.setShowWeatherWidget(value) }
    }

    fun setShowClockWidget(value: Boolean) {
        viewModelScope.launch { settingsRepo.setShowClockWidget(value) }
    }

    fun setShowFootballWidget(value: Boolean) {
        viewModelScope.launch { settingsRepo.setShowFootballWidget(value) }
    }

    fun setWeatherMode(value: WeatherMode) {
        viewModelScope.launch {
            settingsRepo.setWeatherMode(value)
            weather.value = widgets.weather(uiState.value.settings.copy(weatherMode = value))
        }
    }

    fun setManualWeatherEffect(value: ManualWeatherEffect) {
        viewModelScope.launch {
            settingsRepo.setManualWeatherEffect(value)
            weather.value = widgets.weather(uiState.value.settings.copy(weatherMode = WeatherMode.MANUAL, manualWeatherEffect = value))
        }
    }

    fun setWeatherCityOverride(value: String) {
        viewModelScope.launch {
            settingsRepo.setWeatherCityOverride(value)
            weather.value = widgets.weather(uiState.value.settings.copy(weatherCityOverride = value, weatherMode = WeatherMode.CITY))
        }
    }

    fun setFootballMaxMatches(value: Int) {
        viewModelScope.launch {
            settingsRepo.setFootballMaxMatches(value)
            football.value = widgets.football(uiState.value.settings.copy(footballMaxMatches = value))
        }
    }

    fun deleteServer(serverId: Long) {
        viewModelScope.launch { iptv.deleteServer(serverId) }
    }

    fun logoutActiveServer() {
        val server = uiState.value.activeServer ?: return
        viewModelScope.launch {
            iptv.deleteServer(server.id)
            internal.update { it.copy(notice = "Account removed", section = AppSection.HOME, settingsUnlocked = false) }
            settingsRepo.setLastSection(AppSection.HOME.name)
        }
    }

    /** Dismiss the expired-subscription prompt for the current account (cache stays browsable). */
    fun dismissSubscriptionExpired() {
        val key = uiState.value.activeServer?.sourceKey.orEmpty()
        internal.update { it.copy(subscriptionExpiredDismissedKey = key, subscriptionExpired = false) }
    }

    /** Remove the expired account and return to the sign-in screen so a new subscription can be added. */
    fun startNewSubscriptionSignIn() {
        internal.update { it.copy(subscriptionExpired = false) }
        logoutActiveServer()
    }

    fun activateServer(serverId: Long) {
        viewModelScope.launch {
            iptv.activateServer(serverId)
            settingsRepo.setLibraryMode(LibraryMode.ACTIVE_SOURCE)
            internal.update { it.copy(notice = "Account activated") }
        }
    }

    fun refreshServer() {
        val server = uiState.value.activeServer ?: return
        if (internal.value.backgroundRefresh != null || internal.value.loading != null) {
            showNotice("Refresh is already running")
            return
        }
        loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                internal.update { it.copy(backgroundRefresh = LoadProgress("Starting smart refresh", 0, 100), error = null, notice = "Refreshing server in the background") }
                iptv.refreshServerFast(server).collect { progress ->
                    internal.update { it.copy(backgroundRefresh = progress, error = null) }
                }
            }.onFailure { throwable ->
                internal.update {
                    it.copy(
                        error = throwable.message ?: "Refresh failed",
                        loading = null,
                        backgroundRefresh = null,
                    )
                }
            }.onSuccess {
                internal.update { it.copy(loading = null, backgroundRefresh = null, error = null, notice = "Server refresh completed") }
                refreshEpgSilently()
            }
        }
    }

    fun clearSearchHistory() {
        viewModelScope.launch {
            settingsRepo.clearSearchHistory()
            internal.update { it.copy(notice = "Search history cleared") }
        }
    }

    fun clearWatchHistory() {
        val server = uiState.value.activeServer ?: return
        viewModelScope.launch {
            iptv.clearWatchHistory(server.id)
            internal.update { it.copy(notice = "Watch history cleared") }
        }
    }

    fun clearEpgCache() {
        val server = uiState.value.activeServer ?: return
        viewModelScope.launch {
            iptv.clearEpgCache(server.id)
            internal.update { it.copy(notice = "EPG cache cleared") }
        }
    }

    fun testServerConnection() {
        val server = uiState.value.activeServer ?: return
        viewModelScope.launch {
            runCatching { iptv.testServerConnection(server) }
                .onSuccess { message -> internal.update { it.copy(notice = message, error = null) } }
                .onFailure { throwable -> internal.update { it.copy(error = throwable.message ?: "Connection test failed") } }
        }
    }

    private fun openSeries(item: MediaItem) {
        val cur = internal.value
        persistSnapshot(cur.section, cur.focusedItem, cur.selectedCategoryId)
        internal.update {
            it.copy(
                seriesDetail = item,
                seriesDetailsLoading = true,
                focusedItem = item,
                restoreFocusItem = item,
                section = AppSection.SERIES_DETAIL,
                returnSection = AppSection.SERIES_DETAIL,
                error = null,
            )
        }
        saveLastSection(AppSection.SERIES)
        viewModelScope.launch {
            val seriesServer = iptv.server(item.serverId) ?: uiState.value.activeServer
            if (seriesServer == null) {
                internal.update { state ->
                    if (state.seriesDetail.matchesMedia(item)) {
                        state.copy(seriesDetailsLoading = false, error = "Series source is no longer available")
                    } else {
                        state
                    }
                }
                return@launch
            }
            runCatching { iptv.refreshSeriesDetails(seriesServer, item) }
                .onSuccess {
                    internal.update { state ->
                        if (state.seriesDetail.matchesMedia(item)) state.copy(seriesDetailsLoading = false) else state
                    }
                }
                .onFailure { throwable ->
                    internal.update { state ->
                        if (state.seriesDetail.matchesMedia(item)) {
                            state.copy(
                                seriesDetailsLoading = false,
                                error = throwable.message ?: "Failed to load series details",
                            )
                        } else {
                            state
                        }
                    }
                }
        }
    }

    fun refreshWidgets() {
        val settings = uiState.value.settings
        viewModelScope.launch { weather.value = widgets.weather(settings) }
        viewModelScope.launch { football.value = widgets.football(settings) }
    }

    private fun MediaItem?.matchesMedia(other: MediaItem): Boolean =
        this != null &&
            id == other.id &&
            type == other.type &&
            serverId == other.serverId

    private fun applyRemoteRuntimeConfig() {
        viewModelScope.launch {
            runCatching { remoteConfigService.fetchConfig() }
                .onSuccess { config ->
                    settingsRepo.applyRemoteConfig(config)
                    val nextSettings = uiState.value.settings.copy(
                        showWeatherWidget = config.weatherEnabled,
                        showFootballWidget = config.footballEnabled,
                        weatherMode = if (config.weatherCity.isNotBlank()) WeatherMode.CITY else uiState.value.settings.weatherMode,
                        weatherCityOverride = config.weatherCity.takeIf { it.isNotBlank() } ?: uiState.value.settings.weatherCityOverride,
                        footballMaxMatches = config.footballMaxMatches.coerceIn(1, 8),
                    )
                    weather.value = widgets.weather(nextSettings)
                    football.value = widgets.football(nextSettings)
                    val blockingMessage = when {
                        !config.enabled -> config.message.ifBlank { "MoPlayer Pro is temporarily unavailable." }
                        config.maintenanceMode -> config.message.ifBlank { "MoPlayer Pro is in maintenance mode." }
                        config.forceUpdate && BuildConfig.VERSION_CODE < config.minimumVersionCode ->
                            config.message.ifBlank { "A required MoPlayer Pro update is available." }
                        else -> ""
                    }
                    internal.update { current ->
                        if (blockingMessage.isNotBlank()) {
                            current.copy(
                                appControlBlocked = true,
                                error = blockingMessage,
                                notice = null,
                                loading = null,
                                playingItem = null,
                                section = if (current.section == AppSection.PLAYER) current.returnSection.playerReturnSection() else current.section,
                            )
                        } else {
                            current.copy(
                                appControlBlocked = false,
                                error = if (current.appControlBlocked) null else current.error,
                                notice = config.message.takeIf { it.isNotBlank() } ?: current.notice,
                            )
                        }
                    }
                }
        }
    }

    private fun refreshEpgSilently() {
        val server = uiState.value.activeServer ?: return
        if (server.kind != com.moalfarras.moplayer.domain.model.LoginKind.XTREAM && server.epgUrl.isBlank()) return
        viewModelScope.launch { runCatching { iptv.refreshFullEpg(server) } }
    }

    private fun saveLastSection(section: AppSection) {
        val restorable = section.restorable()
        viewModelScope.launch { settingsRepo.setLastSection(restorable.name) }
    }

    private fun persistNavigation(section: AppSection, focused: MediaItem?, categoryId: String) {
        val restorable = section.restorable()
        val focusState = encodeFocusState(lastFocusedBySection + (section to focused))
        val categoryState = encodeCategoryState(lastCategoryBySection + (section to categoryId))
        val key = "${restorable.name}|$focusState|$categoryState"
        if (key == lastPersistedNavigationKey) return
        lastPersistedNavigationKey = key
        viewModelScope.launch {
            settingsRepo.setLastNavigationState(restorable.name, focusState, categoryState)
        }
    }

    private fun restorePersistentNavigation(state: UiState) {
        viewModelScope.launch {
            val focusSnapshots = decodeFocusState(state.settings.lastFocusState)
            val categorySnapshots = decodeCategoryState(state.settings.lastCategoryState)
            categorySnapshots.forEach { (section, categoryId) ->
                lastCategoryBySection[section] = categoryId
            }
            focusSnapshots.forEach { (section, snapshot) ->
                val media = iptv.findMedia(snapshot.serverId, snapshot.id, snapshot.type)
                if (media != null) lastFocusedBySection[section] = media
            }
            val restored = state.settings.lastSection.toRestorableSection()
            val (restoredFocus, restoredCategory) = loadSnapshot(restored)
            internal.update { current ->
                if (current.section == AppSection.HOME && current.playingItem == null && current.loading == null) {
                    current.copy(
                        section = restored,
                        returnSection = restored,
                        focusedItem = restoredFocus,
                        restoreFocusItem = restoredFocus,
                        selectedCategoryId = restoredCategory,
                    )
                } else {
                    current
                }
            }
        }
    }

    private fun categoryIdsForSection(section: AppSection): Set<String> = when (section) {
        AppSection.LIVE -> liveCategories.value.mapTo(mutableSetOf()) { it.id }
        AppSection.MOVIES -> movieCategories.value.mapTo(mutableSetOf()) { it.id }
        AppSection.SERIES -> seriesCategories.value.mapTo(mutableSetOf()) { it.id }
        else -> emptySet()
    }

    class Factory(
        private val iptv: IptvRepository,
        private val settingsRepo: AppSettingsRepository,
        private val widgets: WidgetRepository,
        private val remoteConfigService: AppRemoteConfigService = AppRemoteConfigService(),
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = MainViewModel(iptv, settingsRepo, widgets, remoteConfigService) as T
    }
}

private fun backgroundRefreshMessage(throwable: Throwable): String {
    val raw = throwable.message.orEmpty()
    return when {
        raw.contains("handshake", ignoreCase = true) || raw.contains("ssl", ignoreCase = true) ->
            "Server is saved locally. Secure HTTPS refresh failed; the app will keep using the working source."
        raw.isBlank() -> "Server is saved locally. Background refresh will retry later."
        else -> "Server is saved locally. Background refresh will retry later."
    }
}

private fun activationErrorMessage(throwable: Throwable, fallback: String): String {
    val raw = throwable.message.orEmpty()
    return when {
        raw.contains("Supabase is not configured", ignoreCase = true) ->
            "Cloud activation is not configured yet. Add Supabase settings or use M3U/Xtream."
        raw.contains("failed to connect", ignoreCase = true) ||
            raw.contains("connection refused", ignoreCase = true) ||
            raw.contains("timeout", ignoreCase = true) ||
            raw.contains("timed out", ignoreCase = true) ||
            raw.contains("unable to resolve host", ignoreCase = true) ->
            "Activation service is unavailable right now. Check the connection or try later."
        raw.isBlank() -> fallback
        else -> fallback
    }
}

private val adultKeywords = listOf(
    "adult", "xxx", "18+", "porn", "sex", "erotic", "hot",
    "للكبار", "اباح", "إباح", "جنس", "ساخن", "+18",
)

private data class FocusSnapshot(
    val serverId: Long,
    val type: ContentType,
    val id: String,
)

private fun List<Category>.filterParentalCategories(enabled: Boolean): List<Category> =
    if (!enabled) this else filterNot { category -> adultKeywords.any { category.name.contains(it, ignoreCase = true) } }

private fun String.toRestorableSection(): AppSection =
    runCatching { AppSection.valueOf(this) }.getOrDefault(AppSection.HOME).restorable()

private fun AppSection.restorable(): AppSection = when (this) {
    AppSection.PLAYER -> AppSection.HOME
    AppSection.SERIES_DETAIL -> AppSection.SERIES
    else -> this
}

private fun AppSection.playerReturnSection(): AppSection = when (this) {
    AppSection.PLAYER -> AppSection.HOME
    else -> this
}

private fun AppSection.mediaContentType(): ContentType? = when (this) {
    AppSection.LIVE -> ContentType.LIVE
    AppSection.MOVIES -> ContentType.MOVIE
    AppSection.SERIES -> ContentType.SERIES
    else -> null
}

private fun UiState.mediaBrowsingSection(): AppSection =
    if (section == AppSection.PLAYER) returnSection.playerReturnSection() else section

private fun UiState.libraryServerId(activeId: Long): Long =
    if (settings.libraryMode == LibraryMode.MERGED) 0L else activeId

private fun encodeFocusState(items: Map<AppSection, MediaItem?>): String =
    items.entries
        .mapNotNull { (section, item) ->
            item?.let {
                listOf(section.name, it.serverId.toString(), it.type.name, it.id.urlEncode()).joinToString(":")
            }
        }
        .joinToString("|")

private fun decodeFocusState(raw: String): Map<AppSection, FocusSnapshot> =
    raw.split('|')
        .mapNotNull { token ->
            val parts = token.split(':', limit = 4)
            if (parts.size != 4) return@mapNotNull null
            val section = runCatching { AppSection.valueOf(parts[0]).restorable() }.getOrNull() ?: return@mapNotNull null
            val serverId = parts[1].toLongOrNull() ?: return@mapNotNull null
            val type = runCatching { ContentType.valueOf(parts[2]) }.getOrNull() ?: return@mapNotNull null
            val id = parts[3].urlDecode().takeIf { it.isNotBlank() } ?: return@mapNotNull null
            section to FocusSnapshot(serverId, type, id)
        }
        .toMap()

private fun encodeCategoryState(items: Map<AppSection, String>): String =
    items.entries
        .filter { it.key in restorableMediaSections && it.value.isNotBlank() }
        .joinToString("|") { (section, categoryId) -> "${section.name}:${categoryId.urlEncode()}" }

private fun decodeCategoryState(raw: String): Map<AppSection, String> =
    raw.split('|')
        .mapNotNull { token ->
            val parts = token.split(':', limit = 2)
            if (parts.size != 2) return@mapNotNull null
            val section = runCatching { AppSection.valueOf(parts[0]).restorable() }.getOrNull() ?: return@mapNotNull null
            section to parts[1].urlDecode()
        }
        .toMap()

private val restorableMediaSections = setOf(
    AppSection.HOME,
    AppSection.LIVE,
    AppSection.MOVIES,
    AppSection.SERIES,
    AppSection.FAVORITES,
    AppSection.SEARCH,
)

private fun String.urlEncode(): String =
    URLEncoder.encode(this, StandardCharsets.UTF_8.name())

private fun String.urlDecode(): String =
    runCatching { URLDecoder.decode(this, StandardCharsets.UTF_8.name()) }.getOrDefault(this)

private const val SMART_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000L
private const val SERIES_DETAIL_PREFETCH_DELAY_MS = 380L
private const val MOVIE_DETAIL_PREFETCH_DELAY_MS = 520L
// Short settle delay so quickly scrolling past channels doesn't fire a DNS resolve for each.
private const val LIVE_DNS_PREWARM_DELAY_MS = 250L
