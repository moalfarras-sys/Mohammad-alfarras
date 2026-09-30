package com.moalfarras.moplayer.ui

import android.os.SystemClock
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.moalfarras.moplayer.data.repository.ActivationExpiry
import com.moalfarras.moplayer.data.repository.ActivationPollResult
import com.moalfarras.moplayer.data.repository.AppRemoteConfigService
import com.moalfarras.moplayer.data.repository.AppSettingsRepository
import com.moalfarras.moplayer.data.repository.DeviceStateStore
import com.moalfarras.moplayer.data.repository.IptvRepository
import com.moalfarras.moplayer.data.repository.LiveZapKey
import com.moalfarras.moplayer.data.repository.LiveZapScope
import com.moalfarras.moplayer.data.repository.PENDING_ACTIVATION_MAX_ATTEMPTS
import com.moalfarras.moplayer.data.repository.PendingActivation
import com.moalfarras.moplayer.data.repository.SeriesRefreshMode
import com.moalfarras.moplayer.data.repository.SyncMode
import com.moalfarras.moplayer.data.repository.WidgetRepository
import com.moalfarras.moplayer.data.repository.activationDeadlinePassed
import com.moalfarras.moplayer.data.repository.activationRetryDelayMs
import com.moalfarras.moplayer.data.repository.isTransientActivationFailure
import com.moalfarras.moplayer.data.repository.publicDeviceId
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
import com.moalfarras.moplayer.ui.i18n.I18n
import com.moalfarras.moplayer.ui.i18n.app
import com.moalfarras.moplayerpro.BuildConfig
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import androidx.paging.PagingData
import androidx.paging.cachedIn
import androidx.paging.filter
import kotlinx.coroutines.isActive
import kotlinx.coroutines.job
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
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
    /** A resolved trailer for the currently focused movie/series, shown in the preview pane. */
    val focusedTrailer: FocusedTrailer? = null,
    val restoreFocusItem: MediaItem? = null,
    val seriesDetail: MediaItem? = null,
    val seriesDetailsLoading: Boolean = false,
    val playingItem: MediaItem? = null,
    val searchQuery: String = "",
    val committedSearchQuery: String = "",
    val showExitDialog: Boolean = false,
    val notice: String? = null,
    val settingsUnlocked: Boolean = false,
    /** A wrong (or temporarily blocked) PIN entry, shown next to the PIN field, never screen-wide. */
    val pinError: String? = null,
    val activationSession: DeviceActivationSession? = null,
    val dockFocusSection: AppSection? = null,
    val backgroundRefresh: LoadProgress? = null,
    val subscriptionExpired: Boolean = false,
    /** Host of a playlist link another app asked to import; nothing is saved until the viewer confirms. */
    val pendingImportHost: String? = null,
    /** The sign-in screen is shown over a saved account to add another source ("Use another source"). */
    val showSignIn: Boolean = false,
    val appControlBlocked: Boolean = false,
    /** False until the stored servers/settings have been read once, so the UI can show a splash
     *  instead of flashing the sign-in screen on cold start while an account is already saved. */
    val initialized: Boolean = false,
)

/** A trailer resolved for a focused item. [itemKey] is "type:serverId:id" so the pane can confirm
 *  the trailer still belongs to the item under focus before it plays. */
data class FocusedTrailer(
    val itemKey: String,
    val youtubeId: String,
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

private data class SearchQueryKey(
    val serverId: Long,
    val query: String,
    val parentalControlsEnabled: Boolean,
    val hideChannelsWithoutLogo: Boolean,
)

/** Live channel whose now/next the Live screen header shows; [key] ignores unrelated profile changes. */
private data class FocusedLiveEpgQuery(
    val server: ServerProfile,
    val item: MediaItem,
) {
    val key: String get() = "${server.id}:${item.serverId}:${item.id}:${item.tvgId}"
}

private data class SubscriptionPrompts(
    val snoozed: Map<String, Long> = emptyMap(),
    val snoozedThisSession: Set<String> = emptySet(),
    val checking: String = "",
)

/** The player's zap list for one session: every channel's key (frozen) plus the loaded window. */
private class ZapSession(
    val keys: List<LiveZapKey>,
    val indexByKey: Map<LiveZapKey, Int>,
) {
    var window: ZapWindow? = null
}

@OptIn(ExperimentalCoroutinesApi::class)
class MainViewModel(
    private val iptv: IptvRepository,
    private val settingsRepo: AppSettingsRepository,
    private val widgets: WidgetRepository,
    private val remoteConfigService: AppRemoteConfigService = AppRemoteConfigService(),
    private val deviceState: DeviceStateStore? = null,
) : ViewModel() {
    private val internal = MutableStateFlow(UiState())
    private var loginJob: Job? = null
    /** Server the running [loginJob] syncs (0 while unknown), so deleting that server can stop it first. */
    private var loginJobServerId = 0L
    private var activationJob: Job? = null
    private var backgroundSyncJob: Job? = null
    private var backgroundSyncServerId = 0L
    private var startupRefreshJob: Job? = null
    private var epgJob: Job? = null
    private var seriesPrefetchJob: Job? = null
    private var seriesPrefetchKey = ""
    private var moviePrefetchJob: Job? = null
    private var moviePrefetchKey = ""
    private var liveDnsPrewarmJob: Job? = null
    private var liveDnsPrewarmKey = ""
    private val prewarmedHosts = java.util.Collections.synchronizedSet(mutableSetOf<String>())
    private var trailerPreviewJob: Job? = null
    private var trailerPreviewKey = ""
    private var seriesDetailTrailerJob: Job? = null
    // Items whose provider trailer failed to play and were already retried once with the web-search
    // fallback — stops an error -> search -> error loop from re-searching endlessly.
    private val trailerFallbackTried = java.util.Collections.synchronizedSet(mutableSetOf<String>())
    // Set from the UI once the device tier + performance mode allow a preview-pane trailer. Kept as
    // a plain flag so trailer resolution never fires (no network) on weak boxes where the pane is off.
    @Volatile private var trailerPreviewCapable = false
    private var startupHandled = false
    private var startupRefreshKey = ""
    private var lastFocusUpdateAt = 0L
    private var lastFocusKey = ""
    private var lastPersistedNavigationKey = ""
    private var navPersistJob: Job? = null
    private var searchCommitJob: Job? = null
    /** Where Back from a series detail page returns (the section it was opened from). */
    private var seriesOrigin = AppSection.SERIES
    private var zapSession: ZapSession? = null
    private var zapJob: Job? = null
    private var pendingImportUrl: String? = null
    private var pendingImportKey = ""
    /** The app was opened by a playlist link: no auto-play of the last channel on this start. */
    @Volatile private var externalLaunch = false
    private val pinThrottle = PinAttemptThrottle()
    private val fallbackDeviceId by lazy { publicDeviceId() }

    /** Cuts an activation back-off short when the network returns. */
    private val networkRegained = MutableSharedFlow<Unit>(extraBufferCapacity = 1, onBufferOverflow = BufferOverflow.DROP_OLDEST)

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

    private val snoozedThisSession = MutableStateFlow<Set<String>>(emptySet())
    private val subscriptionCheckKey = MutableStateFlow("")
    private val subscriptionPrompts: Flow<SubscriptionPrompts> = combine(
        deviceState?.subscriptionPromptSnoozes ?: flowOf(emptyMap()),
        snoozedThisSession,
        subscriptionCheckKey,
    ) { snoozed, session, checking -> SubscriptionPrompts(snoozed, session, checking) }

    val uiState: StateFlow<UiState> = combine(
        internal,
        iptv.activeServer,
        iptv.servers,
        settingsRepo.settings,
        subscriptionPrompts,
    ) { state, active, servers, settings, prompts ->
        // Show the expired prompt whenever the active account is inactive, unless the viewer chose
        // "Later" for this account and status in the last day, a re-check is running, or the
        // sign-in screen for another source is open.
        val promptKey = active?.let(::subscriptionPromptKey).orEmpty()
        val promptDue = active?.subscriptionInactive() == true &&
            !state.showSignIn &&
            promptKey != prompts.checking &&
            promptKey !in prompts.snoozedThisSession &&
            !subscriptionPromptSnoozed(prompts.snoozed[promptKey], System.currentTimeMillis())
        state.copy(
            activeServer = active,
            servers = servers,
            settings = settings,
            subscriptionExpired = promptDue,
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
                        val isParental = key.parentalControlsEnabled && item.isAdultContent()
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

    private val zapItems = MutableStateFlow<List<MediaItem>>(emptyList())

    /**
     * Channels CH+/CH- walk through while a live channel plays: the list the viewer started it
     * from (selected Live group, favorites, search results, or the channel's own group), in that
     * list's order and frozen for the player session. Big lists are loaded as a window around the
     * playing channel that grows as the viewer zaps. Empty outside live playback.
     */
    val liveZapItems: StateFlow<List<MediaItem>> = zapItems.asStateFlow()

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
                        val isParental = key.parentalControlsEnabled && item.isAdultContent()
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

    /**
     * Now/next for the channel focused in Live TV. The previous channel's guide is cleared at once;
     * the stored guide answers immediately, and only a channel the viewer rests on for
     * [LIVE_EPG_REMOTE_DEBOUNCE_MS] asks the panel (get_short_epg), so holding the D-pad never
     * sends one request per channel. Channels are resolved to their own source in merged libraries,
     * and the header moves on to the next programme when the current one ends.
     */
    val focusedLiveEpg: StateFlow<LiveEpgSnapshot> = uiState
        .map(::focusedLiveEpgQuery)
        .distinctUntilChanged { old, new -> old?.key == new?.key }
        .flatMapLatest { query -> if (query == null) flowOf(LiveEpgSnapshot()) else liveEpgFor(query) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), LiveEpgSnapshot())

    init {
        applyRemoteRuntimeConfig()
        refreshWidgets()
        // Keep the match/weather widgets fresh without any user action: every 2 minutes while a
        // match is live (running score/minute), otherwise every 15 minutes — light JSON calls that
        // ride the site's CDN cache, so weak boxes feel nothing.
        viewModelScope.launch {
            while (true) {
                delay(if (football.value.any { it.isLive }) 2 * 60_000L else 15 * 60_000L)
                refreshWidgets()
            }
        }
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
                if (!state.initialized) return@collect
                if (!startupHandled) {
                    startupHandled = true
                    handleStartup(state)
                }
                state.activeServer?.let(::maybeStartStartupRefresh)
            }
        }
    }

    /**
     * Once per process, after the saved state was read: continue a QR import that did not finish
     * (failure or the app was killed), otherwise restore the last screen and, when enabled,
     * start the last live channel.
     */
    private fun handleStartup(state: UiState) {
        viewModelScope.launch {
            val pending = loadPendingActivation()
            if (pending != null) {
                if (loginJob?.isActive != true) startActivatedProfileLogin(pending.profile, pending)
                return@launch
            }
            if (state.activeServer == null) return@launch
            restorePersistentNavigation()
            maybeAutoPlayLastLive(state)
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
        // A trailer (or a pending resolve) from the previous section must never leak into the new
        // one — clear everything so each section starts from its own fresh dwell.
        trailerPreviewJob?.cancel()
        trailerPreviewJob = null
        trailerPreviewKey = ""
        seriesDetailTrailerJob?.cancel()
        seriesDetailTrailerJob = null
        internal.update {
            it.copy(
                section = section,
                returnSection = section,
                focusedItem = validRestoredFocus,
                restoreFocusItem = validRestoredFocus,
                focusedTrailer = null,
                selectedCategoryId = validRestoredCategory,
                dockFocusSection = null,
                error = it.blockingErrorOrNull(),
                pinError = null,
                settingsUnlocked = if (section == AppSection.SETTINGS) !requirePin else it.settingsUnlocked,
                seriesDetail = if (section == AppSection.SERIES || section == AppSection.HOME || section == AppSection.FAVORITES) null else it.seriesDetail,
            )
        }
        saveLastSection(section)
    }

    /** The app was opened with a playlist link; called before the saved state is read. */
    fun markExternalLaunch() {
        externalLaunch = true
    }

    /**
     * A playlist link from another app (VIEW intent). It is only imported after the viewer
     * confirms, and the same link is offered once while it waits.
     */
    fun offerIncomingPlaylist(url: String) {
        val clean = url.trim()
        if (clean.isBlank()) return
        val key = incomingPlaylistKey(clean)
        if (key == pendingImportKey && pendingImportUrl != null) return
        pendingImportUrl = clean
        pendingImportKey = key
        val host = playlistHostLabel(clean).ifBlank { I18n.strings.app.importLinkUnknownHost }
        internal.update { it.copy(pendingImportHost = host) }
    }

    fun confirmIncomingPlaylist() {
        val url = pendingImportUrl ?: return
        clearPendingImport()
        importIncomingPlaylist(url)
    }

    fun dismissIncomingPlaylist() {
        clearPendingImport()
    }

    private fun clearPendingImport() {
        pendingImportUrl = null
        pendingImportKey = ""
        internal.update { it.copy(pendingImportHost = null) }
    }

    private fun importIncomingPlaylist(url: String) {
        stopDeviceActivation()
        loginJob?.cancel()
        loginJobServerId = 0L
        loginJob = viewModelScope.launch {
            val self = coroutineContext.job
            val strings = I18n.strings.app
            try {
                if (BuildConfig.DEBUG) Log.d("MoPlayerImport", "Starting imported playlist login")
                internal.update { it.copy(loading = LoadProgress(strings.detectingSource, 8, 100), error = it.blockingErrorOrNull()) }
                val xtream = iptv.registerXtreamFromPlaylistUrl(strings.importedSourceName, url)
                if (xtream != null) {
                    if (BuildConfig.DEBUG) Log.d("MoPlayerImport", "Imported playlist as Xtream source")
                    openSourceAfterLogin(xtream, strings.sourceAddedReady, strings.sourceAddedCached)
                } else {
                    val server = iptv.registerM3uSource(strings.importedSourceName, url)
                    if (BuildConfig.DEBUG) Log.d("MoPlayerImport", "Imported playlist as M3U source")
                    openSourceAfterLogin(server, strings.playlistReady, strings.playlistCached)
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                if (!isActive || loginJob !== self) return@launch
                if (BuildConfig.DEBUG) Log.w("MoPlayerImport", "Imported playlist login failed", failure)
                internal.update { it.copy(error = failure.userMessage(strings.importFailed), loading = null) }
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
    }

    /**
     * D-pad focus moved. Only the in-memory focus changes here; where the viewer is gets written
     * once they pause ([NAV_PERSIST_DELAY_MS]) or the app goes to the background
     * ([flushNavigationState]), never on every key repeat.
     */
    fun focusItem(item: MediaItem?) {
        val key = item?.let { "${it.type}:${it.serverId}:${it.id}" }.orEmpty()
        val now = System.currentTimeMillis()
        if (item != null && key == lastFocusKey && now - lastFocusUpdateAt < 120L) return
        lastFocusKey = key
        lastFocusUpdateAt = now
        val sec = internal.value.section
        if (sec in sectionsWithMediaFocus() && item != null) {
            lastFocusedBySection[sec] = item
            scheduleNavigationPersist()
        }
        internal.update {
            it.copy(
                focusedItem = item,
                restoreFocusItem = if (item != null) null else it.restoreFocusItem,
                dockFocusSection = if (item != null) null else it.dockFocusSection,
            )
        }
        scheduleSeriesDetailsPrefetch(item)
        scheduleMovieDetailsPrefetch(item)
        scheduleLiveDnsPrewarm(item)
        scheduleTrailerPreview(item)
    }

    private fun scheduleNavigationPersist() {
        navPersistJob?.cancel()
        navPersistJob = viewModelScope.launch {
            delay(NAV_PERSIST_DELAY_MS)
            val state = internal.value
            writeNavigation(state.section, lastFocusedBySection[state.section], state.selectedCategoryId)
        }
    }

    /** Writes where the viewer is right now; called when the app goes to the background (ON_STOP). */
    fun flushNavigationState() {
        navPersistJob?.cancel()
        val state = internal.value
        val section = state.section
        val focused = if (section in sectionsWithMediaFocus()) lastFocusedBySection[section] else null
        viewModelScope.launch {
            // Leaving with Back finishes the activity: ON_DESTROY clears this ViewModel right after
            // ON_STOP, and the flush has already cancelled the repository's own delayed write, so
            // the write must not be cancelled with viewModelScope.
            withContext(NonCancellable) {
                if (section in sectionsWithMediaFocus()) writeNavigation(section, focused, state.selectedCategoryId)
                try {
                    settingsRepo.flushNavigationState()
                } catch (failure: Exception) {
                    Log.w(TAG, "Navigation flush failed", failure)
                }
            }
        }
    }

    /** Called by the UI whenever the resolved performance policy changes: true only when the
     *  preview pane is on, motion isn't reduced, and the admin trailer switch is enabled. */
    fun setTrailerPreviewCapable(capable: Boolean) {
        if (trailerPreviewCapable == capable) return
        trailerPreviewCapable = capable
        if (!capable) {
            trailerPreviewKey = ""
            trailerPreviewJob?.cancel()
            trailerPreviewJob = null
            seriesDetailTrailerJob?.cancel()
            seriesDetailTrailerJob = null
            if (internal.value.focusedTrailer != null) internal.update { it.copy(focusedTrailer = null) }
        }
    }

    /**
     * Called by the preview WebView when the IFrame reports it cannot play a trailer (e.g. embedding
     * disabled / video removed). Retries ONCE with the YouTube-search fallback for the same item;
     * if that also fails the trailer is simply dropped. The tried-set caps it at a single retry so
     * a provider -> search -> error sequence can never loop.
     */
    fun reportTrailerUnplayable(itemKey: String) {
        val current = internal.value.focusedTrailer ?: return
        if (current.itemKey != itemKey) return
        val target = listOfNotNull(internal.value.focusedItem, internal.value.seriesDetail)
            .firstOrNull { "${it.type}:${it.serverId}:${it.id}" == itemKey }
        internal.update { it.copy(focusedTrailer = null) }
        if (target == null || itemKey in trailerFallbackTried) return
        trailerFallbackTried.add(itemKey)
        viewModelScope.launch {
            val id = runCatching { iptv.searchTrailerYoutubeId(target) }.getOrNull()
            if (id.isNullOrBlank() || id == current.youtubeId) return@launch
            val stillFocused = internal.value.focusedItem?.let { "${it.type}:${it.serverId}:${it.id}" } == itemKey
            val stillDetail = internal.value.seriesDetail?.let { "${it.type}:${it.serverId}:${it.id}" } == itemKey
            if (!stillFocused && !stillDetail) return@launch
            internal.update { it.copy(focusedTrailer = FocusedTrailer(itemKey, id)) }
        }
    }

    /**
     * After ~4s of dwell on a movie/series, resolve a trailer (provider first, YouTube-search
     * fallback) and surface it so the preview pane can autoplay it muted. A new focus cancels the
     * pending job and hides any showing trailer immediately, so the pane never lags behind focus.
     */
    private fun scheduleTrailerPreview(item: MediaItem?) {
        // Episodes never produce a trailer, and inside SeriesDetail we must NOT let episode focus
        // clear the series' own trailer (scheduled separately), so treat episode focus as a no-op.
        if (item?.type == ContentType.EPISODE) return
        // Only sections that actually render the preview pane may resolve trailers — dwelling on a
        // Home/Search shelf must not burn search quota (or leak state) for a pane that isn't there.
        val paneSection = internal.value.section == AppSection.MOVIES ||
            internal.value.section == AppSection.SERIES ||
            internal.value.section == AppSection.FAVORITES
        val target = item?.takeIf { paneSection && (it.type == ContentType.MOVIE || it.type == ContentType.SERIES) }
        val key = target?.let { "${it.type}:${it.serverId}:${it.id}" }.orEmpty()
        if (key != trailerPreviewKey && internal.value.focusedTrailer != null) {
            internal.update { it.copy(focusedTrailer = null) }
        }
        if (target == null || !trailerPreviewCapable || !uiState.value.settings.trailerPreviewEnabled) {
            trailerPreviewKey = ""
            trailerPreviewJob?.cancel()
            trailerPreviewJob = null
            return
        }
        if (key == trailerPreviewKey && trailerPreviewJob?.isActive == true) return
        trailerPreviewKey = key
        trailerFallbackTried.remove(key)
        trailerPreviewJob?.cancel()
        trailerPreviewJob = viewModelScope.launch {
            delay(TRAILER_PREVIEW_DWELL_MS)
            if (!internal.value.focusedItem.matchesMedia(target)) return@launch
            val server = iptv.server(target.serverId)
                ?: uiState.value.activeServer?.takeIf { active -> active.id == target.serverId }
                ?: return@launch
            val youtubeId = runCatching { iptv.resolveTrailerYoutubeId(server, target) }.getOrNull()
            if (youtubeId.isNullOrBlank()) return@launch
            // Focus may have moved during the network resolve; only show if still on this item.
            if (!internal.value.focusedItem.matchesMedia(target)) return@launch
            internal.update { it.copy(focusedTrailer = FocusedTrailer(key, youtubeId)) }
        }
    }

    /**
     * The SeriesDetail preview pane shows the SERIES while D-pad focus lives on its episodes, so the
     * focus-driven [scheduleTrailerPreview] can't drive it. This tracks the trailer against
     * `state.seriesDetail` (not `focusedItem`) with its OWN job, so episode focus never cancels it.
     */
    private fun scheduleSeriesDetailTrailer(series: MediaItem?) {
        seriesDetailTrailerJob?.cancel()
        seriesDetailTrailerJob = null
        val target = series?.takeIf { it.type == ContentType.SERIES } ?: return
        if (!trailerPreviewCapable || !uiState.value.settings.trailerPreviewEnabled) return
        val key = "${target.type}:${target.serverId}:${target.id}"
        trailerFallbackTried.remove(key)
        seriesDetailTrailerJob = viewModelScope.launch {
            delay(TRAILER_PREVIEW_DWELL_MS)
            if (!internal.value.seriesDetail.matchesMedia(target)) return@launch
            val server = iptv.server(target.serverId)
                ?: uiState.value.activeServer?.takeIf { active -> active.id == target.serverId }
                ?: return@launch
            val youtubeId = runCatching { iptv.resolveTrailerYoutubeId(server, target) }.getOrNull()
            if (youtubeId.isNullOrBlank()) return@launch
            if (!internal.value.seriesDetail.matchesMedia(target)) return@launch
            internal.update { it.copy(focusedTrailer = FocusedTrailer(key, youtubeId)) }
        }
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
            // Focus prefetch only fills an empty cache; revalidating stale episodes (and the
            // grid reload their rewrite causes) is left to opening the series.
            runCatching { iptv.refreshSeriesDetails(server, seriesItem, SeriesRefreshMode.IF_EMPTY) }
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

    fun play(item: MediaItem) = startPlayback(item, recordHistory = true)

    /**
     * Same as [play] but leaves no trace in history (recent channels, Continue Watching, last
     * played, search history): for switches the player makes on its own, e.g. to another feed of
     * the same channel.
     */
    fun playWithoutHistory(item: MediaItem) = startPlayback(item, recordHistory = false)

    private fun startPlayback(item: MediaItem, recordHistory: Boolean) {
        if (uiState.value.appControlBlocked) {
            showNotice(uiState.value.error ?: I18n.strings.app.unavailable)
            return
        }
        val current = internal.value
        if (recordHistory) {
            if (current.section == AppSection.SEARCH) {
                commitSearchHistory(current.committedSearchQuery.ifBlank { current.searchQuery })
            }
            viewModelScope.launch { iptv.notePlaybackStart(item) }
        }
        if (item.type == ContentType.SERIES) {
            seriesPrefetchJob?.cancel()
            seriesPrefetchJob = null
            openSeries(item)
            return
        }
        val entering = current.section != AppSection.PLAYER
        if (entering) {
            persistSnapshot(current.section, current.focusedItem, current.selectedCategoryId)
            saveLastSection(current.section)
        }
        internal.update { state ->
            val returnSection = if (state.section == AppSection.PLAYER) {
                state.returnSection.playerReturnSection()
            } else {
                state.section.playerReturnSection()
            }
            state.copy(playingItem = item, returnSection = returnSection, section = AppSection.PLAYER)
        }
        when {
            item.type != ContentType.LIVE -> stopZapSession()
            entering -> startZapSession(
                item,
                liveZapScopeFor(current.section, current.selectedCategoryId, current.committedSearchQuery, item),
            )
            else -> followZap(item)
        }
        if (item.type == ContentType.MOVIE) refreshMovieDetailsForPlayer(item)
    }

    fun closePlayer(positionMs: Long = 0, durationMs: Long = 0) {
        val current = internal.value
        val item = current.playingItem
        val back = current.returnSection.playerReturnSection()
        if (item != null && item.type != ContentType.LIVE && durationMs > 0) {
            viewModelScope.launch { iptv.updateWatch(item, positionMs, durationMs) }
        }
        // A channel left before the history dwell was only passed through: it is not recorded.
        if (item?.type == ContentType.LIVE) iptv.discardPendingLiveHistory()
        stopZapSession()
        if (item != null && back in sectionsWithMediaFocus()) {
            lastFocusedBySection[back] = item
        }
        val (focus, category) = loadSnapshot(back)
        internal.update {
            it.copy(
                playingItem = null,
                section = back,
                returnSection = back,
                focusedItem = focus,
                restoreFocusItem = focus,
                selectedCategoryId = category.ifEmpty { it.selectedCategoryId },
                dockFocusSection = null,
                error = it.blockingErrorOrNull(),
            )
        }
        saveLastSection(back)
    }

    fun updatePlaybackProgress(item: MediaItem, positionMs: Long, durationMs: Long) {
        if (item.type == ContentType.LIVE || durationMs <= 0) return
        viewModelScope.launch { iptv.updateWatch(item, positionMs, durationMs) }
    }

    fun navigateBack() {
        // Leaving a screen with a preview pane: stop and drop any trailer so it never lingers into
        // the next screen (e.g. the series-detail trailer carrying back into the grid).
        seriesDetailTrailerJob?.cancel()
        seriesDetailTrailerJob = null
        val current = internal.value
        if (current.section == AppSection.SERIES_DETAIL) {
            val origin = seriesOrigin
            val (focus, category) = loadSnapshot(origin)
            val target = current.seriesDetail ?: focus
            if (target != null && origin in sectionsWithMediaFocus()) lastFocusedBySection[origin] = target
            val originCategory = if (origin == AppSection.SERIES) {
                category.takeIf { it.isBlank() || it in categoryIdsForSection(origin) }.orEmpty()
            } else {
                ""
            }
            internal.update { state ->
                state.copy(
                    section = origin,
                    returnSection = origin,
                    seriesDetail = null,
                    seriesDetailsLoading = false,
                    focusedItem = target,
                    restoreFocusItem = target,
                    focusedTrailer = null,
                    selectedCategoryId = originCategory,
                    // Home puts focus back on the shelf card only when the dock is not asked for.
                    dockFocusSection = null,
                    error = state.blockingErrorOrNull(),
                )
            }
        } else if (current.section in BACK_TO_HOME_SECTIONS) {
            persistSnapshot(current.section, current.focusedItem, current.selectedCategoryId)
            internal.update { state ->
                state.copy(
                    section = AppSection.HOME,
                    dockFocusSection = state.section,
                    focusedItem = null,
                    restoreFocusItem = null,
                    focusedTrailer = null,
                    seriesDetailsLoading = false,
                    selectedCategoryId = "",
                    error = state.blockingErrorOrNull(),
                    pinError = null,
                )
            }
        }
        saveLastSection(internal.value.section)
    }

    fun focusDock(section: AppSection = internal.value.section) {
        internal.update {
            it.copy(
                dockFocusSection = section,
                restoreFocusItem = null,
                error = it.blockingErrorOrNull(),
            )
        }
    }

    fun toggleFavorite(item: MediaItem) {
        viewModelScope.launch { iptv.toggleFavorite(item) }
    }

    fun loginM3u(name: String, url: String, epgUrl: String = "") {
        // A manual sign-in pauses QR polling, so a late phone approval cannot replace it.
        stopDeviceActivation()
        loginJob?.cancel()
        loginJobServerId = 0L
        loginJob = viewModelScope.launch {
            val self = coroutineContext.job
            val strings = I18n.strings.app
            try {
                // Progress (and a disabled Sign in button) from the first network probe on.
                internal.update { it.copy(loading = LoadProgress(strings.detectingSource, 5, 100), error = it.blockingErrorOrNull()) }
                val xtream = iptv.registerXtreamFromPlaylistUrl(name, url)
                if (xtream != null) {
                    openSourceAfterLogin(xtream, strings.serverReady, strings.serverCached)
                } else {
                    internal.update { it.copy(loading = LoadProgress(strings.savingPlaylist, 15, 100)) }
                    val server = iptv.registerM3uSource(name, url, epgUrl)
                    openSourceAfterLogin(server, strings.playlistReady, strings.playlistCached)
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                if (!isActive || loginJob !== self) return@launch
                internal.update { it.copy(error = failure.userMessage(strings.m3uLoginFailed), loading = null) }
            }
        }
    }

    fun loginM3uText(name: String, sourceName: String, playlistText: String) {
        stopDeviceActivation()
        loginJob?.cancel()
        loginJobServerId = 0L
        loginJob = viewModelScope.launch {
            val self = coroutineContext.job
            val strings = I18n.strings.app
            try {
                iptv.loginM3uText(name, sourceName, playlistText).collect { progress ->
                    internal.update { it.copy(loading = progress, error = it.blockingErrorOrNull()) }
                }
                finishLogin(notice = null)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                if (!isActive || loginJob !== self) return@launch
                internal.update { it.copy(error = failure.userMessage(strings.m3uFileFailed), loading = null) }
            }
        }
    }

    fun loginXtream(name: String, baseUrl: String, username: String, password: String) {
        stopDeviceActivation()
        loginJob?.cancel()
        loginJobServerId = 0L
        loginJob = viewModelScope.launch {
            val self = coroutineContext.job
            val strings = I18n.strings.app
            try {
                internal.update { it.copy(loading = LoadProgress(strings.savingServer, 15, 100), error = it.blockingErrorOrNull()) }
                val server = iptv.registerXtreamSource(name, baseUrl, username, password)
                openSourceAfterLogin(server, strings.serverReady, strings.serverCached)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                if (!isActive || loginJob !== self) return@launch
                internal.update { it.copy(error = failure.userMessage(strings.xtreamLoginFailed), loading = null) }
            }
        }
    }

    /**
     * Shows a QR code for website activation. A source that already arrived but was not imported
     * yet (failed import, or the app was killed) is imported again instead of creating a new code.
     * Creating a code is retried with back-off for about two minutes on network/5xx failures; the
     * first failure is reported at once so the panel can offer "Try again".
     */
    fun refreshDeviceActivation(deviceName: String = android.os.Build.MODEL ?: "Android TV") {
        activationJob?.cancel()
        // The QR panel treats an error as new only when it is not the one it already showed.
        // StateFlow drops a value equal to the current one, so a repeated identical failure would
        // never be published: the previous error is cleared first.
        internal.update { it.copy(error = it.blockingErrorOrNull()) }
        activationJob = viewModelScope.launch {
            val pending = loadPendingActivation()
            if (pending != null) {
                if (loginJob?.isActive != true) startActivatedProfileLogin(pending.profile, pending)
                return@launch
            }
            val deviceId = installDeviceId()
            val startedAt = SystemClock.elapsedRealtime()
            var failures = 0
            while (true) {
                val session = try {
                    iptv.createDeviceActivation(deviceName, deviceId)
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (failure: Exception) {
                    failures += 1
                    Log.w(TAG, "Could not create a QR activation code", failure)
                    val retry = isTransientActivationFailure(failure) &&
                        SystemClock.elapsedRealtime() - startedAt < ACTIVATION_CREATE_RETRY_WINDOW_MS
                    if (failures == 1 || !retry) {
                        val message = activationServiceMessage(failure, I18n.strings.app)
                        internal.update { it.copy(activationSession = null, error = message.freshInstance()) }
                    }
                    if (!retry) return@launch
                    waitForRetry(activationRetryDelayMs(failures))
                    continue
                }
                internal.update { it.copy(activationSession = session, error = it.blockingErrorOrNull()) }
                pollDeviceActivation(session, pollNow = false)
                return@launch
            }
        }
    }

    /** Stops polling (QR panel left the screen, app in the background, manual sign-in); the code is kept. */
    fun stopDeviceActivation() {
        activationJob?.cancel()
        activationJob = null
    }

    /**
     * Polls the code that is still waiting again (QR panel back on screen) instead of creating a
     * new one: /create expires the device's earlier codes and rotates the source-pull token, which
     * would strand a source the phone already sent for the code on screen.
     */
    fun resumeDeviceActivation() {
        if (activationJob?.isActive == true) return
        val session = internal.value.activationSession ?: return
        if (session.status != DeviceActivationStatus.WAITING) return
        if (activationDeadlinePassed(SystemClock.elapsedRealtime(), session.expiresAtElapsed)) {
            publishActivation(session.copy(status = DeviceActivationStatus.EXPIRED, error = I18n.strings.app.activationCodeExpired))
            return
        }
        activationJob = viewModelScope.launch { pollDeviceActivation(session, pollNow = true) }
    }

    /** The network is back: an activation waiting out a back-off retries now. */
    fun onNetworkAvailable() {
        networkRegained.tryEmit(Unit)
    }

    /**
     * Polls one code until the phone delivers a source or the code ends. Network failures,
     * timeouts, 408/425/429 and 5xx keep the same code and back off (5, 10, 20, 30 s, honouring the
     * server's retry hint, cut short when the network returns); 404/410/401 end it as expired, so
     * the panel renews it. The deadline runs on the monotonic clock.
     */
    private suspend fun pollDeviceActivation(initial: DeviceActivationSession, pollNow: Boolean) {
        val strings = I18n.strings.app
        var session = initial
        var failures = 0
        var wait = if (pollNow) 0L else session.pollIntervalMs()
        while (true) {
            if (wait > 0L) {
                if (failures > 0) waitForRetry(wait) else delay(wait)
            }
            if (activationDeadlinePassed(SystemClock.elapsedRealtime(), session.expiresAtElapsed)) {
                publishActivation(session.copy(status = DeviceActivationStatus.EXPIRED, error = strings.activationCodeExpired))
                return
            }
            val result = try {
                iptv.pollDeviceActivation(session)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                Log.w(TAG, "Activation poll failed", failure)
                ActivationPollResult.Transient()
            }
            // The one-time source pull finishes even when polling was stopped meanwhile, and that
            // source is still imported; any other answer of a stopped poll is stale (a newer code
            // may be on screen already).
            if (!currentCoroutineContext().isActive && result !is ActivationPollResult.SourceReady) return
            when (result) {
                is ActivationPollResult.Waiting -> {
                    failures = 0
                    session = result.session
                    publishActivation(session)
                    wait = session.pollIntervalMs()
                }
                is ActivationPollResult.Transient -> {
                    failures += 1
                    session = session.copy(error = strings.activationReconnecting)
                    publishActivation(session)
                    wait = activationRetryDelayMs(failures, result.retryAfterMs)
                }
                is ActivationPollResult.Expired -> {
                    val message = when (result.reason) {
                        ActivationExpiry.CODE_EXPIRED -> strings.activationCodeExpired
                        ActivationExpiry.TOKEN_REJECTED -> strings.activationTokenRejected
                    }
                    publishActivation(session.copy(status = DeviceActivationStatus.EXPIRED, error = message))
                    return
                }
                is ActivationPollResult.Invalid -> {
                    publishActivation(session.copy(status = DeviceActivationStatus.ERROR, error = strings.activationInvalid))
                    return
                }
                is ActivationPollResult.SourceReady -> {
                    publishActivation(result.session)
                    startActivatedProfileLogin(result.profile)
                    return
                }
            }
        }
    }

    private fun publishActivation(session: DeviceActivationSession) {
        internal.update { it.copy(activationSession = session) }
    }

    private suspend fun waitForRetry(delayMs: Long) {
        withTimeoutOrNull(delayMs) { networkRegained.first() }
    }

    private suspend fun installDeviceId(): String = try {
        deviceState?.installDeviceId() ?: fallbackDeviceId
    } catch (cancelled: CancellationException) {
        throw cancelled
    } catch (failure: Exception) {
        Log.w(TAG, "Install id unavailable", failure)
        fallbackDeviceId
    }

    private suspend fun loadPendingActivation(): PendingActivation? = try {
        deviceState?.pendingActivation(System.currentTimeMillis())
    } catch (cancelled: CancellationException) {
        throw cancelled
    } catch (failure: Exception) {
        Log.w(TAG, "Saved activation source unavailable", failure)
        null
    }

    /**
     * Imports a QR-delivered source. The website deleted its copy when this device pulled it, so
     * the source is first sealed on this device (Keystore AES-GCM) and kept until the import
     * completes: a network failure or a process kill mid-import can be retried from it ("Try
     * again", or automatically at the next start). The website is acknowledged only after the
     * outcome is known, with a short non-sensitive code.
     */
    private fun startActivatedProfileLogin(profile: ActivatedProfile, previous: PendingActivation? = null) {
        loginJob?.cancel()
        loginJobServerId = 0L
        loginJob = viewModelScope.launch {
            val self = coroutineContext.job
            val strings = I18n.strings.app
            val attempts = (previous?.attempts ?: 0) + 1
            // A retry keeps the first save time, so the source is kept at most a day in total.
            val savedAt = previous?.savedAt ?: System.currentTimeMillis()
            val kept = try {
                deviceState?.savePendingActivation(PendingActivation(profile, savedAt, attempts)) == true
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                Log.w(TAG, "Could not keep the activation source", failure)
                false
            }
            try {
                val server = when (profile.kind) {
                    LoginKind.XTREAM -> {
                        internal.update { it.copy(loading = LoadProgress(strings.savingServer, 20, 100), error = it.blockingErrorOrNull()) }
                        iptv.registerXtreamSource(
                            name = profile.name,
                            baseUrl = profile.baseUrl,
                            username = profile.username,
                            password = profile.password,
                            playlistUrl = profile.playlistUrl,
                        )
                    }
                    LoginKind.M3U -> {
                        internal.update { it.copy(loading = LoadProgress(strings.savingPlaylist, 20, 100), error = it.blockingErrorOrNull()) }
                        iptv.registerXtreamFromPlaylistUrl(profile.name, profile.playlistUrl)
                            ?: iptv.registerM3uSource(profile.name, profile.playlistUrl, profile.epgUrl)
                    }
                }
                openSourceAfterLogin(server, strings.activatedReady, strings.activatedCached)
                acknowledgeActivatedProfile(profile, imported = true)
            } catch (cancelled: CancellationException) {
                // The sealed copy stays, so the import continues at the next start.
                throw cancelled
            } catch (failure: Exception) {
                if (!isActive || loginJob !== self) return@launch
                val final = !kept || isFinalActivationImportFailure(failure) || attempts >= PENDING_ACTIVATION_MAX_ATTEMPTS
                if (final) {
                    deviceState?.clearPendingActivation()
                    acknowledgeActivatedProfile(profile, imported = false, code = activationAckCode(failure))
                }
                val reason = activationImportReason(failure, strings)
                val message = if (final) strings.activationImportFailed(reason) else strings.activationImportRetry(reason)
                internal.update { it.copy(error = message.freshInstance(), loading = null) }
            }
        }
    }

    /**
     * Opens a freshly signed-in server: at once when a local library exists (a background refresh
     * then updates stale sections), otherwise after its first full sync. A first sync that leaves
     * nothing behind removes the empty server row.
     */
    private suspend fun openSourceAfterLogin(
        server: ServerProfile,
        readyNotice: String,
        cachedNotice: String,
    ) {
        // This login owns the server's first sync: the startup refresh must not start a second one.
        startupRefreshJob?.cancel()
        startupRefreshKey = server.sourceKey.ifBlank { server.id.toString() }
        loginJobServerId = server.id
        val hasLocalLibrary = try {
            iptv.hasLocalLibrary(server.id)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            false
        }
        if (hasLocalLibrary) {
            finishLogin(cachedNotice)
            startBackgroundLibraryRefresh(server)
            return
        }

        try {
            iptv.refreshServerFast(server).collect { progress ->
                internal.update {
                    it.copy(
                        loading = progress,
                        backgroundRefresh = null,
                        error = it.blockingErrorOrNull(),
                    )
                }
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            val stillEmpty = try {
                !iptv.hasLocalLibrary(server.id)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                false
            }
            if (stillEmpty) {
                try {
                    iptv.deleteServer(server.id)
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (deleteFailure: Exception) {
                    Log.w(TAG, "Could not remove the empty server", deleteFailure)
                }
            }
            throw failure
        }
        finishLogin(readyNotice)
        refreshEpgSilently(server)
    }

    /** A sign-in succeeded: QR polling stops, a saved QR source is no longer needed, Home opens. */
    private suspend fun finishLogin(notice: String?) {
        stopDeviceActivation()
        try {
            deviceState?.clearPendingActivation()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            Log.w(TAG, "Could not clear the saved activation source", failure)
        }
        internal.update {
            it.copy(
                loading = null,
                backgroundRefresh = null,
                section = AppSection.HOME,
                returnSection = AppSection.HOME,
                activationSession = null,
                error = it.blockingErrorOrNull(),
                notice = notice ?: it.notice,
                showSignIn = false,
            )
        }
        saveLastSection(AppSection.HOME)
        settingsRepo.setLibraryMode(LibraryMode.ACTIVE_SOURCE)
    }

    /** Fire-and-forget acknowledgement of a QR source; it never changes the UI or crashes the app. */
    private fun acknowledgeActivatedProfile(profile: ActivatedProfile, imported: Boolean, code: String = "") {
        if (profile.sourceId.isBlank()) return
        viewModelScope.launch {
            try {
                iptv.acknowledgeWebActivationSource(
                    publicDeviceId = profile.publicDeviceId,
                    token = profile.sourcePullToken,
                    sourceId = profile.sourceId,
                    imported = imported,
                    message = code,
                )
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                Log.w(TAG, "Source acknowledgement failed (${failure.javaClass.simpleName})")
            }
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

    /**
     * Updates the stale sections of [server] in the background (SyncMode.BACKGROUND: fresh
     * sections are skipped and it yields to playback). A refresh already running for the same
     * server is left alone instead of being restarted.
     */
    private fun startBackgroundLibraryRefresh(server: ServerProfile) {
        if (backgroundSyncJob?.isActive == true && backgroundSyncServerId == server.id) return
        backgroundSyncJob?.cancel()
        backgroundSyncServerId = server.id
        backgroundSyncJob = viewModelScope.launch {
            val self = coroutineContext.job
            try {
                iptv.refreshServerFast(server, SyncMode.BACKGROUND).collect { progress ->
                    internal.update { it.copy(backgroundRefresh = progress) }
                }
                refreshEpgSilently(server)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                if (backgroundSyncJob === self) {
                    val message = backgroundRefreshMessage(failure, I18n.strings.app)
                    internal.update { it.copy(notice = message) }
                }
            } finally {
                if (backgroundSyncJob === self) internal.update { it.copy(backgroundRefresh = null) }
            }
        }
    }

    /**
     * The startup refresh (sources older than 3 h). It never starts while a sign-in, activation
     * import or another sync of the library is running, which used to download a new server twice
     * right after login (M7).
     */
    private fun maybeStartStartupRefresh(server: ServerProfile) {
        val key = server.sourceKey.ifBlank { server.id.toString() }
        if (key.isBlank() || key == startupRefreshKey) return
        startupRefreshKey = key
        startupRefreshJob?.cancel()
        startupRefreshJob = viewModelScope.launch {
            delay(STARTUP_REFRESH_DELAY_MS)
            if (libraryWorkBusy()) return@launch
            val fresh = try {
                iptv.server(server.id)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                null
            } ?: return@launch
            val needsRefresh = try {
                iptv.needsLibraryRefresh(fresh, SMART_REFRESH_INTERVAL_MS)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                fresh.lastSyncAt <= 0
            }
            if (needsRefresh && !libraryWorkBusy()) startBackgroundLibraryRefresh(fresh)
        }
    }

    private fun libraryWorkBusy(): Boolean =
        loginJob?.isActive == true ||
            backgroundSyncJob?.isActive == true ||
            internal.value.loading != null ||
            internal.value.backgroundRefresh != null

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
            saveLastSection(AppSection.SEARCH)
        } else {
            internal.update { it.copy(searchQuery = query) }
        }
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
            }
        } else {
            internal.update { it.copy(committedSearchQuery = "") }
        }
    }

    /**
     * Adds a search the viewer committed (opened a result, pressed the keyboard's search key,
     * spoke it or picked it from history) to the history. Typing alone never does, so the
     * history holds whole searches instead of every prefix typed on a remote.
     */
    fun commitSearchHistory(query: String) {
        val normalized = query.trim()
        if (normalized.length < 2) return
        viewModelScope.launch { settingsRepo.addSearchHistory(normalized) }
    }

    fun setExitDialog(show: Boolean) {
        internal.update { it.copy(showExitDialog = show) }
    }

    fun clearNotice() {
        internal.update { it.copy(notice = null) }
    }

    /** Dismisses a routine error; a maintenance or forced-update block cannot be dismissed. */
    fun clearError() {
        internal.update { if (it.appControlBlocked) it else it.copy(error = null) }
    }

    fun showNotice(message: String) {
        internal.update { it.copy(notice = message) }
        viewModelScope.launch {
            kotlinx.coroutines.delay(2000)
            internal.update { if (it.notice == message) it.copy(notice = null) else it }
        }
    }

    fun unlockSettings(pin: String) {
        if (reportPinLockout()) return
        viewModelScope.launch {
            if (verifyPin(pin)) {
                pinThrottle.recordSuccess()
                internal.update { it.copy(settingsUnlocked = true, notice = I18n.strings.app.settingsUnlocked, pinError = null) }
            } else {
                onWrongPin(I18n.strings.app.wrongPin)
            }
        }
    }

    fun lockSettings() {
        internal.update { it.copy(settingsUnlocked = false, pinError = null) }
    }

    fun setParentalPin(pin: String) {
        viewModelScope.launch {
            val strings = I18n.strings.app
            try {
                settingsRepo.setParentalPin(pin)
                internal.update { it.copy(settingsUnlocked = true, notice = strings.pinSaved, pinError = null) }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                internal.update { it.copy(pinError = strings.pinSaveFailed.freshInstance()) }
            }
        }
    }

    fun changeParentalPin(currentPin: String, newPin: String) {
        if (reportPinLockout()) return
        viewModelScope.launch {
            val strings = I18n.strings.app
            if (!verifyPin(currentPin)) {
                onWrongPin(strings.wrongCurrentPin)
                return@launch
            }
            pinThrottle.recordSuccess()
            try {
                settingsRepo.setParentalPin(newPin)
                internal.update { it.copy(notice = strings.pinUpdated, pinError = null) }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                internal.update { it.copy(pinError = strings.pinSaveFailed.freshInstance()) }
            }
        }
    }

    fun removeParentalPin(pin: String) {
        if (reportPinLockout()) return
        viewModelScope.launch {
            val strings = I18n.strings.app
            if (!verifyPin(pin)) {
                onWrongPin(strings.wrongCurrentPin)
                return@launch
            }
            pinThrottle.recordSuccess()
            try {
                settingsRepo.clearParentalPin()
                internal.update { it.copy(settingsUnlocked = true, notice = strings.pinRemoved, pinError = null) }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                internal.update { it.copy(pinError = strings.pinSaveFailed.freshInstance()) }
            }
        }
    }

    /** True (and the lockout is shown next to the PIN field) while too many wrong PINs block entry. */
    private fun reportPinLockout(): Boolean {
        val remaining = pinThrottle.remainingLockMs(SystemClock.elapsedRealtime())
        if (remaining <= 0L) return false
        val message = I18n.strings.app.pinLockedOut(lockoutSeconds(remaining))
        internal.update { it.copy(pinError = message.freshInstance()) }
        return true
    }

    private fun onWrongPin(message: String) {
        val lockout = pinThrottle.recordFailure(SystemClock.elapsedRealtime())
        val text = if (lockout > 0L) I18n.strings.app.pinLockedOut(lockoutSeconds(lockout)) else message
        internal.update { it.copy(pinError = text.freshInstance()) }
    }

    private suspend fun verifyPin(pin: String): Boolean = try {
        settingsRepo.verifyParentalPin(pin)
    } catch (cancelled: CancellationException) {
        throw cancelled
    } catch (_: Exception) {
        false
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

    fun setShowTrailerPreviews(value: Boolean) {
        viewModelScope.launch { settingsRepo.setShowTrailerPreviews(value) }
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

    /** Settings actions that change accounts or history need the PIN when a family lock is set. */
    private fun settingsLocked(): Boolean {
        if (!uiState.value.settings.hasParentalPin || internal.value.settingsUnlocked) return false
        showNotice(I18n.strings.app.unlockSettingsFirst)
        return true
    }

    fun deleteServer(serverId: Long) {
        if (settingsLocked()) return
        viewModelScope.launch { removeServer(serverId) }
    }

    fun logoutActiveServer() {
        if (settingsLocked()) return
        removeActiveServer()
    }

    private fun removeActiveServer() {
        val server = uiState.value.activeServer ?: return
        viewModelScope.launch {
            removeServer(server.id)
            internal.update { it.copy(notice = I18n.strings.app.accountRemoved, section = AppSection.HOME, settingsUnlocked = false) }
            saveLastSection(AppSection.HOME)
        }
    }

    /** Stops every sync of [serverId] first, so nothing writes rows for it after the delete. */
    private suspend fun removeServer(serverId: Long) {
        startupRefreshJob?.cancel()
        listOfNotNull(
            backgroundSyncJob?.takeIf { backgroundSyncServerId == serverId },
            loginJob?.takeIf { loginJobServerId == serverId },
        ).forEach { job -> withTimeoutOrNull(WORK_CANCEL_TIMEOUT_MS) { job.cancelAndJoin() } }
        try {
            iptv.deleteServer(serverId)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            Log.w(TAG, "Could not delete server", failure)
        }
    }

    /** "Later" on the expired-subscription prompt: postponed for a day for this account and status. */
    fun dismissSubscriptionExpired() {
        val server = uiState.value.activeServer ?: return
        val key = subscriptionPromptKey(server)
        snoozedThisSession.update { it + key }
        viewModelScope.launch { deviceState?.snoozeSubscriptionPrompt(key, System.currentTimeMillis()) }
    }

    /**
     * "Check again": re-reads the account from the provider (a background refresh starts with the
     * account call). A renewed account closes the prompt by itself; otherwise it comes back.
     */
    fun recheckSubscription() {
        val server = uiState.value.activeServer ?: return
        val key = subscriptionPromptKey(server)
        val strings = I18n.strings.app
        subscriptionCheckKey.value = key
        showNotice(strings.subscriptionChecking)
        backgroundSyncJob?.cancel()
        backgroundSyncServerId = server.id
        backgroundSyncJob = viewModelScope.launch {
            val self = coroutineContext.job
            try {
                iptv.refreshServerFast(server, SyncMode.BACKGROUND).collect { progress ->
                    internal.update { it.copy(backgroundRefresh = progress) }
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                Log.w(TAG, "Subscription check failed", failure)
            } finally {
                if (backgroundSyncJob === self) internal.update { it.copy(backgroundRefresh = null) }
                subscriptionCheckKey.update { if (it == key) "" else it }
            }
            val stillInactive = try {
                iptv.server(server.id)?.subscriptionInactive() ?: false
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                true
            }
            showNotice(if (stillInactive) strings.subscriptionStillInactive else strings.subscriptionActiveAgain)
        }
    }

    /** Opens the sign-in screen over the current account; nothing is deleted. */
    fun signInWithAnotherSource() {
        internal.update { it.copy(showSignIn = true, error = it.blockingErrorOrNull()) }
    }

    /** Back from "Use another source" returns to the current account (unless an import is running). */
    fun cancelSignIn() {
        if (internal.value.loading != null) return
        stopDeviceActivation()
        internal.update { it.copy(showSignIn = false, error = it.blockingErrorOrNull()) }
    }

    /** Removes the expired account and returns to the sign-in screen ("Remove & sign in again", confirmed in the dialog). */
    fun startNewSubscriptionSignIn() {
        removeActiveServer()
    }

    /** Provider-side account creation time for Settings > Accounts (0 when the panel sent none). */
    suspend fun providerAccountCreatedAt(serverId: Long): Long = iptv.providerAccountCreatedAt(serverId)

    fun activateServer(serverId: Long) {
        if (settingsLocked()) return
        viewModelScope.launch {
            iptv.activateServer(serverId)
            settingsRepo.setLibraryMode(LibraryMode.ACTIVE_SOURCE)
            internal.update { it.copy(notice = I18n.strings.app.accountActivated) }
        }
    }

    fun refreshServer() {
        val server = uiState.value.activeServer ?: return
        val strings = I18n.strings.app
        if (internal.value.backgroundRefresh != null || internal.value.loading != null) {
            showNotice(strings.refreshAlreadyRunning)
            return
        }
        loginJob?.cancel()
        loginJobServerId = server.id
        loginJob = viewModelScope.launch {
            val self = coroutineContext.job
            try {
                internal.update {
                    it.copy(
                        backgroundRefresh = LoadProgress(strings.refreshStarting, 0, 100),
                        error = it.blockingErrorOrNull(),
                        notice = strings.refreshRunning,
                    )
                }
                iptv.refreshServerFast(server).collect { progress ->
                    internal.update { it.copy(backgroundRefresh = progress) }
                }
                internal.update { it.copy(loading = null, backgroundRefresh = null, notice = strings.refreshCompleted) }
                refreshEpgSilently(server)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                if (!isActive || loginJob !== self) return@launch
                internal.update {
                    it.copy(
                        error = failure.userMessage(strings.refreshFailed),
                        loading = null,
                        backgroundRefresh = null,
                    )
                }
            } finally {
                if (loginJob === self) internal.update { it.copy(backgroundRefresh = null) }
            }
        }
    }

    fun clearSearchHistory() {
        viewModelScope.launch {
            settingsRepo.clearSearchHistory()
            internal.update { it.copy(notice = I18n.strings.app.searchHistoryCleared) }
        }
    }

    fun clearWatchHistory() {
        if (settingsLocked()) return
        val server = uiState.value.activeServer ?: return
        iptv.discardPendingLiveHistory()
        viewModelScope.launch {
            iptv.clearWatchHistory(server.id)
            internal.update { it.copy(notice = I18n.strings.app.watchHistoryCleared) }
        }
    }

    fun clearEpgCache() {
        if (settingsLocked()) return
        val server = uiState.value.activeServer ?: return
        viewModelScope.launch {
            iptv.clearEpgCache(server.id)
            internal.update { it.copy(notice = I18n.strings.app.epgCacheCleared) }
        }
    }

    fun testServerConnection() {
        val server = uiState.value.activeServer ?: return
        viewModelScope.launch {
            try {
                val message = iptv.testServerConnection(server)
                internal.update { it.copy(notice = message, error = it.blockingErrorOrNull()) }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                internal.update { it.copy(error = failure.userMessage(I18n.strings.app.connectionTestFailed)) }
            }
        }
    }

    private fun openSeries(item: MediaItem) {
        val cur = internal.value
        persistSnapshot(cur.section, cur.focusedItem, cur.selectedCategoryId)
        seriesOrigin = seriesOriginFor(cur.section, cur.returnSection.playerReturnSection(), seriesOrigin)
        // Drop any grid-resolved trailer + its pending job so it can't carry into the detail pane;
        // the detail screen gets its own trailer scheduled below (keyed on seriesDetail, not focus).
        trailerPreviewJob?.cancel()
        trailerPreviewKey = ""
        internal.update {
            it.copy(
                seriesDetail = item,
                seriesDetailsLoading = true,
                focusedItem = item,
                restoreFocusItem = item,
                focusedTrailer = null,
                section = AppSection.SERIES_DETAIL,
                returnSection = AppSection.SERIES_DETAIL,
                error = it.blockingErrorOrNull(),
            )
        }
        saveLastSection(AppSection.SERIES_DETAIL)
        scheduleSeriesDetailTrailer(item)
        viewModelScope.launch {
            val strings = I18n.strings.app
            val seriesServer = iptv.server(item.serverId) ?: uiState.value.activeServer
            if (seriesServer == null) {
                internal.update { state ->
                    if (state.seriesDetail.matchesMedia(item)) {
                        state.copy(seriesDetailsLoading = false, error = strings.seriesSourceMissing)
                    } else {
                        state
                    }
                }
                return@launch
            }
            try {
                iptv.refreshSeriesDetails(seriesServer, item)
                internal.update { state ->
                    if (state.seriesDetail.matchesMedia(item)) state.copy(seriesDetailsLoading = false) else state
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                internal.update { state ->
                    if (state.seriesDetail.matchesMedia(item)) {
                        state.copy(
                            seriesDetailsLoading = false,
                            error = failure.userMessage(strings.seriesDetailsFailed),
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

    // ── Live zap list ─────────────────────────────────────────────────────

    private fun startZapSession(item: MediaItem, scope: LiveZapScope) {
        val state = uiState.value
        val settings = state.settings
        val serverId = state.activeServer?.let { state.libraryServerId(it.id) } ?: item.serverId
        zapJob?.cancel()
        zapSession = null
        zapItems.value = emptyList()
        zapJob = viewModelScope.launch {
            val session = loadZapSession(serverId, scope, item, settings) ?: return@launch
            zapSession = session
            // Centre on what plays now: the viewer may have zapped while the list was loading.
            val playing = internal.value.playingItem?.takeIf { it.type == ContentType.LIVE } ?: item
            val index = session.indexByKey[LiveZapKey(playing.serverId, playing.id)]
            if (index == null) {
                startZapSession(playing, liveZapScopeFor(AppSection.PLAYER, "", "", playing))
                return@launch
            }
            loadZapWindow(session, zapWindowFor(session.keys.size, index, null))
        }
    }

    /** A zap inside the player: the window grows when the channel nears its end; the list itself stays frozen. */
    private fun followZap(item: MediaItem) {
        val session = zapSession
        if (session == null) {
            if (zapJob?.isActive != true) startZapSession(item, liveZapScopeFor(AppSection.PLAYER, "", "", item))
            return
        }
        val index = session.indexByKey[LiveZapKey(item.serverId, item.id)]
        if (index == null) {
            // A channel outside the list it was started from: zap through its own group from now on.
            startZapSession(item, liveZapScopeFor(AppSection.PLAYER, "", "", item))
            return
        }
        val window = zapWindowFor(session.keys.size, index, session.window)
        if (window == session.window) return
        zapJob?.cancel()
        zapJob = viewModelScope.launch { loadZapWindow(session, window) }
    }

    private fun stopZapSession() {
        zapJob?.cancel()
        zapJob = null
        zapSession = null
        if (zapItems.value.isNotEmpty()) zapItems.value = emptyList()
    }

    /**
     * Reads the zap list's keys once. When the channel is not in the list it was started from
     * (a list that changed meanwhile, or a hidden row), its own group is used instead of leaving
     * CH+/CH- without neighbours.
     */
    private suspend fun loadZapSession(serverId: Long, scope: LiveZapScope, item: MediaItem, settings: AppSettings): ZapSession? {
        val parental = settings.parentalControlsEnabled
        suspend fun keysFor(target: LiveZapScope): List<LiveZapKey> = try {
            iptv.liveZapKeys(serverId, target, settings.defaultSort, settings.hideChannelsWithoutLogo) { row ->
                parental && isAdultText(row.title, row.description, row.categoryName, row.categoryId)
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            Log.w(TAG, "Zap list unavailable", failure)
            emptyList()
        }
        val playing = LiveZapKey(item.serverId, item.id)
        var keys = keysFor(scope)
        var index = keys.indexMap()
        if (playing !in index) {
            val ownGroup = LiveZapScope.Category(item.categoryId)
            if (item.categoryId.isBlank() || scope == ownGroup) return null
            keys = keysFor(ownGroup)
            index = keys.indexMap()
            if (playing !in index) return null
        }
        return ZapSession(keys, index)
    }

    private suspend fun loadZapWindow(session: ZapSession, window: ZapWindow) {
        val rows = try {
            iptv.liveZapRows(window.indices(session.keys.size).map(session.keys::get))
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            Log.w(TAG, "Zap rows unavailable", failure)
            return
        }
        if (zapSession !== session) return
        session.window = window
        zapItems.value = rows
    }

    // ── Live guide ────────────────────────────────────────────────────────

    private fun focusedLiveEpgQuery(state: UiState): FocusedLiveEpgQuery? {
        if (state.section != AppSection.LIVE) return null
        val item = state.focusedItem?.takeIf { it.type == ContentType.LIVE } ?: return null
        val active = state.activeServer ?: return null
        val server = state.servers.firstOrNull { it.id == item.serverId } ?: active.takeIf { it.id == item.serverId } ?: return null
        return FocusedLiveEpgQuery(server, item)
    }

    private fun liveEpgFor(query: FocusedLiveEpgQuery): Flow<LiveEpgSnapshot> = flow {
        emit(LiveEpgSnapshot())
        var askedPanel = false
        while (true) {
            var snapshot = try {
                iptv.localLiveEpg(query.server, query.item)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                null
            }
            if (snapshot == null && query.server.kind == LoginKind.XTREAM && !askedPanel) {
                askedPanel = true
                delay(LIVE_EPG_REMOTE_DEBOUNCE_MS)
                // An exception here would end the stateIn collector in viewModelScope and crash
                // the app (the answer is stored in Room, which can fail too).
                snapshot = try {
                    iptv.remoteLiveEpg(query.server, query.item)
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (failure: Exception) {
                    Log.w(TAG, "Live guide lookup failed", failure)
                    null
                }
            }
            emit(snapshot ?: LiveEpgSnapshot())
            // While the viewer stays on the channel, move on to the next programme when this one ends.
            val endsAt = snapshot?.current?.endAt?.takeIf { it > 0L } ?: return@flow
            delay((endsAt - System.currentTimeMillis()).coerceIn(EPG_ROLLOVER_MIN_MS, EPG_ROLLOVER_MAX_MS))
        }
    }

    // ── Auto-play ─────────────────────────────────────────────────────────

    /**
     * "Auto-play last live channel": on a cold start with a saved account, opens Live TV on the
     * channel last watched for at least the history dwell and plays it; Back returns to that
     * channel in its group. Skipped when the app was opened by a link, is blocked, the account is
     * expired, something else is loading, or the previous auto-play never got confirmed (a crash
     * or a channel that stopped working), so a broken channel cannot loop every start.
     */
    private suspend fun maybeAutoPlayLastLive(startState: UiState) {
        if (externalLaunch || !startState.settings.autoPlayLastLive) return
        val server = startState.activeServer ?: return
        if (server.subscriptionInactive()) return
        if (deviceState?.takeUnconfirmedAutoPlay() == true) return
        val item = try {
            iptv.lastWatchedLive(server.id)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            null
        } ?: return
        val state = uiState.value
        val settings = state.settings
        val blocked = externalLaunch ||
            state.appControlBlocked ||
            state.loading != null ||
            state.playingItem != null ||
            state.pendingImportHost != null ||
            state.showSignIn ||
            state.section == AppSection.SETTINGS ||
            state.section == AppSection.PLAYER ||
            loginJob?.isActive == true
        if (blocked) return
        if (settings.parentalControlsEnabled && item.isAdultContent()) return
        if (settings.hideChannelsWithoutLogo && item.posterUrl.isBlank()) return
        lastCategoryBySection[AppSection.LIVE] = item.categoryId
        lastFocusedBySection[AppSection.LIVE] = item
        internal.update {
            it.copy(
                section = AppSection.LIVE,
                returnSection = AppSection.LIVE,
                selectedCategoryId = item.categoryId,
                focusedItem = item,
                restoreFocusItem = item,
                dockFocusSection = null,
            )
        }
        deviceState?.setAutoPlayArmed(true)
        play(item)
        delay(AUTOPLAY_CONFIRM_MS)
        val now = internal.value
        if (now.section == AppSection.PLAYER && now.playingItem?.type == ContentType.LIVE) deviceState?.setAutoPlayArmed(false)
    }

    private fun refreshEpgSilently(server: ServerProfile) {
        if (epgJob?.isActive == true) return
        epgJob = viewModelScope.launch {
            try {
                iptv.refreshFullEpg(server)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                Log.w(TAG, "Guide refresh failed", failure)
            }
        }
    }

    /** Series details remember where they were opened from; everything else restores as itself. */
    private fun restorableFor(section: AppSection): AppSection =
        if (section == AppSection.SERIES_DETAIL) seriesOrigin.restorable() else section.restorable()

    private fun saveLastSection(section: AppSection) {
        val restorable = restorableFor(section)
        viewModelScope.launch { settingsRepo.setLastSection(restorable.name) }
    }

    private fun persistNavigation(section: AppSection, focused: MediaItem?, categoryId: String) {
        viewModelScope.launch { writeNavigation(section, focused, categoryId) }
    }

    private suspend fun writeNavigation(section: AppSection, focused: MediaItem?, categoryId: String) {
        val restorable = restorableFor(section)
        val focusState = encodeFocusState(lastFocusedBySection + (section to focused))
        val categoryState = encodeCategoryState(lastCategoryBySection + (section to categoryId))
        val key = "${restorable.name}|$focusState|$categoryState"
        if (key == lastPersistedNavigationKey) return
        lastPersistedNavigationKey = key
        settingsRepo.setLastNavigationState(restorable.name, focusState, categoryState)
    }

    private suspend fun restorePersistentNavigation() {
        val snapshot = try {
            settingsRepo.readNavigationState()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            Log.w(TAG, "Navigation state unavailable", failure)
            return
        }
        decodeCategoryState(snapshot.categoryState).forEach { (section, categoryId) ->
            lastCategoryBySection[section] = categoryId
        }
        decodeFocusState(snapshot.focusState).forEach { (section, focus) ->
            val media = try {
                iptv.findMedia(focus.serverId, focus.id, focus.type)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                null
            }
            if (media != null) lastFocusedBySection[section] = media
        }
        val restored = snapshot.section.toRestorableSection()
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
        private val deviceState: DeviceStateStore? = null,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            MainViewModel(iptv, settingsRepo, widgets, remoteConfigService, deviceState) as T
    }

    private companion object {
        const val TAG = "MoPlayerMain"
    }
}

/** A maintenance or forced-update message survives navigation; routine errors do not. */
private fun UiState.blockingErrorOrNull(): String? = if (appControlBlocked) error else null

private fun DeviceActivationSession.pollIntervalMs(): Long = intervalSeconds.coerceAtLeast(3) * 1000L

/**
 * A new String object with the same text. The QR panel tells a repeated failure from the one it
 * already showed by identity, so each failure is published as its own instance. StateFlow still
 * conflates equal values: the error must be cleared in between (see refreshDeviceActivation).
 */
private fun String.freshInstance(): String = StringBuilder(this).toString()

private fun List<LiveZapKey>.indexMap(): Map<LiveZapKey, Int> =
    HashMap<LiveZapKey, Int>(size * 2).also { map -> forEachIndexed { index, key -> map.putIfAbsent(key, index) } }

private val adultKeywords = listOf(
    "adult", "xxx", "18+", "porn", "sex", "erotic", "hot",
    "للكبار", "اباح", "إباح", "جنس", "ساخن", "+18",
)

private fun isAdultText(vararg parts: String): Boolean {
    val text = parts.joinToString(" ")
    return adultKeywords.any { text.contains(it, ignoreCase = true) }
}

private fun MediaItem.isAdultContent(): Boolean = isAdultText(title, description, categoryName, categoryId)

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

/** Sections whose Back goes to Home with the dock focused on them. */
private val BACK_TO_HOME_SECTIONS = setOf(
    AppSection.SEARCH,
    AppSection.SETTINGS,
    AppSection.LIVE,
    AppSection.MOVIES,
    AppSection.SERIES,
    AppSection.FAVORITES,
)

private fun String.urlEncode(): String =
    URLEncoder.encode(this, StandardCharsets.UTF_8.name())

private fun String.urlDecode(): String =
    runCatching { URLDecoder.decode(this, StandardCharsets.UTF_8.name()) }.getOrDefault(this)

// Silently pull newest catalog additions when the app is opened and >3h have passed since the last
// sync (mirrors LibraryRefreshWorker) — content stays fresh without a full re-sync on every open.
private const val SMART_REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000L
private const val STARTUP_REFRESH_DELAY_MS = 1_500L
private const val SERIES_DETAIL_PREFETCH_DELAY_MS = 380L
private const val MOVIE_DETAIL_PREFETCH_DELAY_MS = 520L
// Short settle delay so quickly scrolling past channels doesn't fire a DNS resolve for each.
private const val LIVE_DNS_PREWARM_DELAY_MS = 250L
// Dwell before a focused movie/series autoplays its trailer in the preview pane. 2s feels
// responsive while still long enough that D-pad browsing past titles never triggers a resolve.
private const val TRAILER_PREVIEW_DWELL_MS = 2_000L
/** Dwell on a live channel before its guide is asked from the panel (get_short_epg). */
private const val LIVE_EPG_REMOTE_DEBOUNCE_MS = 320L
/** Bounds for re-reading the guide when the current programme ends (never a tight loop). */
private const val EPG_ROLLOVER_MIN_MS = 15_000L
private const val EPG_ROLLOVER_MAX_MS = 30L * 60L * 1000L
/** Focus/category are written once the viewer pauses this long (and always on ON_STOP). */
private const val NAV_PERSIST_DELAY_MS = 1_000L
/** How long a failing QR code creation keeps retrying on network/5xx errors. */
private const val ACTIVATION_CREATE_RETRY_WINDOW_MS = 2L * 60L * 1000L
/** Longest wait for a sync to stop before its server is deleted anyway (the DB guards the rest). */
private const val WORK_CANCEL_TIMEOUT_MS = 3_000L
/** An auto-played channel still on screen after this long counts as a successful auto-play. */
private const val AUTOPLAY_CONFIRM_MS = 20_000L
