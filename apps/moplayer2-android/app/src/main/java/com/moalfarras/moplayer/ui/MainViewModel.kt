package com.moalfarras.moplayer.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.moalfarras.moplayer.data.repository.AppSettingsRepository
import com.moalfarras.moplayer.data.repository.IptvRepository
import com.moalfarras.moplayer.data.repository.WidgetRepository
import com.moalfarras.moplayer.domain.model.AccentMode
import com.moalfarras.moplayer.domain.model.AppSettings
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
import com.moalfarras.moplayer.domain.model.ManualWeatherEffect
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.MotionLevel
import com.moalfarras.moplayer.domain.model.ServerProfile
import com.moalfarras.moplayer.domain.model.SortOption
import com.moalfarras.moplayer.domain.model.ThemePreset
import com.moalfarras.moplayer.domain.model.WeatherMode
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import com.moalfarras.moplayerpro.BuildConfig
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
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
    val seriesDetail: MediaItem? = null,
    val playingItem: MediaItem? = null,
    val searchQuery: String = "",
    val showExitDialog: Boolean = false,
    val notice: String? = null,
    val settingsUnlocked: Boolean = false,
    val activationSession: DeviceActivationSession? = null,
    val dockFocusSection: AppSection? = null,
)

@OptIn(ExperimentalCoroutinesApi::class)
class MainViewModel(
    private val iptv: IptvRepository,
    private val settingsRepo: AppSettingsRepository,
    private val widgets: WidgetRepository,
) : ViewModel() {
    private val internal = MutableStateFlow(UiState())
    private var loginJob: Job? = null
    private var activationJob: Job? = null
    private var autoPlayedServerId: Long? = null
    private var restoredLastSection = false

    private val lastFocusedBySection = mutableMapOf<AppSection, MediaItem?>()
    private val lastCategoryBySection = mutableMapOf<AppSection, String>()

    private fun sectionsWithMediaFocus(): Set<AppSection> = setOf(
        AppSection.HOME,
        AppSection.LIVE,
        AppSection.MOVIES,
        AppSection.SERIES,
        AppSection.FAVORITES,
        AppSection.SEARCH,
    )

    private fun persistSnapshot(section: AppSection, focused: MediaItem?, categoryId: String) {
        if (section in sectionsWithMediaFocus()) {
            lastFocusedBySection[section] = focused
            lastCategoryBySection[section] = categoryId
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
        state.copy(activeServer = active, servers = servers, settings = settings)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UiState())

    val weather = MutableStateFlow(WeatherSnapshot())
    val football = MutableStateFlow<List<FootballMatch>>(emptyList())

    val liveCategories = uiState.flatMapLatest { state ->
        state.activeServer?.let { server ->
            iptv.categories(
                state.libraryServerId(server.id),
                ContentType.LIVE,
                hideEmpty = state.settings.hideEmptyCategories,
                hideNoLogo = state.settings.hideChannelsWithoutLogo,
            ).map { categories ->
                categories.filterParentalCategories(state.settings.parentalControlsEnabled)
            }
        } ?: flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val movieCategories = uiState.flatMapLatest { state ->
        state.activeServer?.let {
            iptv.categories(state.libraryServerId(it.id), ContentType.MOVIE, hideEmpty = state.settings.hideEmptyCategories)
                .map { list -> list.filterParentalCategories(state.settings.parentalControlsEnabled) }
        } ?: flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val seriesCategories = uiState.flatMapLatest { state ->
        state.activeServer?.let {
            iptv.categories(state.libraryServerId(it.id), ContentType.SERIES, hideEmpty = state.settings.hideEmptyCategories)
                .map { list -> list.filterParentalCategories(state.settings.parentalControlsEnabled) }
        } ?: flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val selectedMedia: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        val server = state.activeServer ?: return@flatMapLatest flowOf(PagingData.empty())
        val type = when (state.section) {
            AppSection.LIVE -> ContentType.LIVE
            AppSection.MOVIES -> ContentType.MOVIE
            AppSection.SERIES -> ContentType.SERIES
            else -> ContentType.MOVIE
        }
        val hideNoLogo = type == ContentType.LIVE && state.settings.hideChannelsWithoutLogo
        val source = if (state.selectedCategoryId.isBlank()) {
            iptv.mediaByType(state.libraryServerId(server.id), type, state.settings.defaultSort, hideNoLogo)
        } else {
            iptv.mediaByCategory(state.libraryServerId(server.id), type, state.selectedCategoryId, state.settings.defaultSort, hideNoLogo)
        }
        source.map { pagingData ->
            pagingData.filter { item ->
                val isParental = state.settings.parentalControlsEnabled && 
                    adultKeywords.any {
                        "${item.title} ${item.description} ${item.categoryName} ${item.categoryId}".contains(it, ignoreCase = true)
                    }
                val hiddenLogo = hideNoLogo && item.posterUrl.isBlank()
                !isParental && !hiddenLogo
            }
        }.cachedIn(viewModelScope)
    }


    val latestMovies: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        state.activeServer?.let { iptv.latestMovies(state.libraryServerId(it.id)) }.let { it ?: flowOf(PagingData.empty()) }.cachedIn(viewModelScope)
    }

    val latestLive: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        state.activeServer?.let { iptv.latestLive(state.libraryServerId(it.id)) }.let { it ?: flowOf(PagingData.empty()) }.cachedIn(viewModelScope)
    }

    val liveZapItems: StateFlow<List<MediaItem>> = uiState.flatMapLatest { state ->
        val server = state.activeServer ?: return@flatMapLatest flowOf(emptyList())
        iptv.liveZapItems(
            serverId = state.libraryServerId(server.id),
            categoryId = state.selectedCategoryId.takeIf { state.section == AppSection.LIVE }.orEmpty(),
            sortOption = state.settings.defaultSort,
            hideNoLogo = state.settings.hideChannelsWithoutLogo,
        ).map { items ->
            items.filter { item ->
                val isParental = state.settings.parentalControlsEnabled &&
                    adultKeywords.any {
                        "${item.title} ${item.description} ${item.categoryName} ${item.categoryId}".contains(it, ignoreCase = true)
                    }
                !isParental
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val latestSeries: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        state.activeServer?.let { iptv.latestSeries(state.libraryServerId(it.id)) }.let { it ?: flowOf(PagingData.empty()) }.cachedIn(viewModelScope)
    }

    val favorites: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        state.activeServer?.let { iptv.favorites(state.libraryServerId(it.id)) }.let { it ?: flowOf(PagingData.empty()) }.cachedIn(viewModelScope)
    }


    val continueWatching: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        val server = state.activeServer
        if (server == null) flowOf(PagingData.empty()) 
        else iptv.continueWatching(state.libraryServerId(server.id)).cachedIn(viewModelScope)
    }

    val recentLive: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        val server = state.activeServer
        if (server == null) flowOf(PagingData.empty()) 
        else iptv.recentlyPlayed(state.libraryServerId(server.id), ContentType.LIVE).cachedIn(viewModelScope)
    }


    val searchResults: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        val server = state.activeServer
        if (server == null || state.searchQuery.isBlank()) {
            flowOf(PagingData.empty())
        } else {
            iptv.search(state.libraryServerId(server.id), state.searchQuery.trim()).map { pagingData ->
                pagingData.filter { item ->
                    val isParental = state.settings.parentalControlsEnabled &&
                        adultKeywords.any {
                            "${item.title} ${item.description} ${item.categoryName} ${item.categoryId}".contains(it, ignoreCase = true)
                        }
                    val hiddenLogo = state.settings.hideChannelsWithoutLogo && item.type == ContentType.LIVE && item.posterUrl.isBlank()
                    !isParental && !hiddenLogo
                }
            }.cachedIn(viewModelScope)
        }
    }

    val seriesEpisodes: kotlinx.coroutines.flow.Flow<List<MediaItem>> = uiState.flatMapLatest { state ->
        val server = state.activeServer
        val series = state.seriesDetail
        if (server == null || series == null || series.seriesId.isBlank()) {
            flowOf(emptyList())
        } else {
            iptv.episodes(server.id, series.seriesId)
        }
    }


    val focusedLiveEpg = uiState.flatMapLatest { state ->
        val server = state.activeServer
        val item = state.focusedItem
        if (server == null || item == null || item.type != ContentType.LIVE) {
            flowOf(LiveEpgSnapshot())
        } else {
            kotlinx.coroutines.flow.flow { emit(iptv.liveEpg(server, item)) }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), LiveEpgSnapshot())

    init {
        refreshWidgets()
        viewModelScope.launch {
            uiState.collect { state ->
                if (state.activeServer != null && !restoredLastSection) {
                    restoredLastSection = true
                    val restored = state.settings.lastSection.toRestorableSection()
                    internal.update { current ->
                        if (current.section == AppSection.HOME && current.playingItem == null && current.loading == null) {
                            current.copy(section = restored, returnSection = restored)
                        } else {
                            current
                        }
                    }
                    return@collect
                }

                if (state.activeServer != null && restoredLastSection && state.settings.autoPlayLastLive && state.section == AppSection.HOME && state.playingItem == null && state.loading == null) {
                    if (autoPlayedServerId == state.activeServer.id) return@collect
                    val lastChannel = iptv.lastWatchedLive(state.activeServer.id) ?: return@collect
                    autoPlayedServerId = state.activeServer.id
                    internal.update { current ->
                        if (current.playingItem != null || current.section == AppSection.PLAYER) current
                        else current.copy(playingItem = lastChannel, returnSection = AppSection.HOME, section = AppSection.PLAYER)
                    }
                }
            }
        }
    }

    fun select(section: AppSection) {
        val cur = internal.value
        persistSnapshot(cur.section, cur.focusedItem, cur.selectedCategoryId)
        val requirePin = section == AppSection.SETTINGS && uiState.value.settings.hasParentalPin
        val (restoredFocus, restoredCategory) = loadSnapshot(section)
        internal.update {
            it.copy(
                section = section,
                returnSection = section,
                focusedItem = restoredFocus,
                selectedCategoryId = restoredCategory,
                dockFocusSection = section,
                error = null,
                settingsUnlocked = if (section == AppSection.SETTINGS) !requirePin else it.settingsUnlocked,
                seriesDetail = if (section == AppSection.SERIES || section == AppSection.HOME || section == AppSection.FAVORITES) null else it.seriesDetail,
            )
        }
        saveLastSection(section)
    }

    fun selectCategory(category: Category) {
        val sec = internal.value.section
        if (sec in sectionsWithMediaFocus()) {
            lastCategoryBySection[sec] = category.id
            lastFocusedBySection[sec] = null
        }
        internal.update {
            it.copy(
                selectedCategoryId = category.id,
                focusedItem = null,
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
        }
        internal.update {
            it.copy(
                selectedCategoryId = "",
                focusedItem = null,
                dockFocusSection = null,
            )
        }
        saveLastSection(sec)
    }

    fun focusItem(item: MediaItem?) {
        internal.update {
            val sec = it.section
            if (sec in sectionsWithMediaFocus() && item != null) {
                lastFocusedBySection[sec] = item
            }
            it.copy(
                focusedItem = item,
                dockFocusSection = if (item != null) null else it.dockFocusSection,
            )
        }
    }

    fun play(item: MediaItem) {
        viewModelScope.launch { iptv.notePlaybackStart(item) }
        when (item.type) {
            ContentType.SERIES -> openSeries(item)
            ContentType.LIVE -> internal.update {
                persistSnapshot(it.section, it.focusedItem, it.selectedCategoryId)
                saveLastSection(it.section)
                it.copy(playingItem = item, returnSection = it.section, section = AppSection.PLAYER)
            }
            else -> viewModelScope.launch {
                val syncedItem = runCatching { iptv.syncWatchProgressFromCloud(item) }.getOrDefault(item)
                internal.update {
                    persistSnapshot(it.section, it.focusedItem, it.selectedCategoryId)
                    saveLastSection(it.section)
                    it.copy(playingItem = syncedItem, returnSection = it.section, section = AppSection.PLAYER)
                }
            }
        }
    }

    fun closePlayer(positionMs: Long = 0, durationMs: Long = 0) {
        val item = internal.value.playingItem
        val back = internal.value.returnSection
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
                focusedItem = f,
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
                        focusedItem = f,
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
                        selectedCategoryId = "",
                    )
                }
                else -> state
            }
        }
        saveLastSection(internal.value.section)
    }

    fun toggleFavorite(item: MediaItem) {
        viewModelScope.launch { iptv.toggleFavorite(item) }
    }

    fun loginM3u(name: String, url: String, epgUrl: String = "") {
        loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                iptv.loginM3u(name, url, epgUrl).collect { progress -> internal.update { it.copy(loading = progress, error = null) } }
            }.onFailure { throwable ->
                internal.update { it.copy(error = throwable.message ?: "M3U login failed", loading = null) }
            }.onSuccess {
                internal.update { it.copy(loading = null, section = AppSection.HOME) }
                saveLastSection(AppSection.HOME)
                refreshEpgSilently()
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
            }
        }
    }

    fun loginXtream(name: String, baseUrl: String, username: String, password: String) {
        loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                iptv.loginXtream(name, baseUrl, username, password).collect { progress -> internal.update { it.copy(loading = progress, error = null) } }
            }.onFailure { throwable ->
                internal.update { it.copy(error = throwable.message ?: "Xtream login failed", loading = null) }
            }.onSuccess {
                internal.update { it.copy(loading = null, section = AppSection.HOME) }
                saveLastSection(AppSection.HOME)
                refreshEpgSilently()
            }
        }
    }

    fun loginActivationCode(code: String) {
        loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                iptv.loginActivationCode(code).collect { progress -> internal.update { it.copy(loading = progress, error = null) } }
            }.onFailure { throwable ->
                internal.update { it.copy(error = activationErrorMessage(throwable, "تعذر تفعيل الجهاز. تأكد من الكود وحاول مرة أخرى."), loading = null) }
            }.onSuccess {
                internal.update { it.copy(loading = null, section = AppSection.HOME) }
                saveLastSection(AppSection.HOME)
                refreshEpgSilently()
            }
        }
    }

    fun refreshDeviceActivation(deviceName: String = android.os.Build.MODEL ?: "Android TV") {
        activationJob?.cancel()
        activationJob = viewModelScope.launch {
            runCatching { iptv.createDeviceActivation(deviceName) }
                .onFailure { throwable ->
                    if (!BuildConfig.DEBUG) {
                        internal.update {
                            it.copy(
                                activationSession = null,
                                error = activationErrorMessage(throwable, "تعذر إنشاء QR. تأكد من إعداد moalfarras.space/Supabase."),
                            )
                        }
                        return@onFailure
                    }
                    // Debug fallback keeps previews usable without a live backend.
                    val mockCode = "MOPRO-${(1000..9999).random()}"
                    val mockSession = DeviceActivationSession(
                        deviceCode = mockCode,
                        userCode = mockCode,
                        verificationUrl = BuildConfig.ACTIVATION_URL,
                        verificationUrlComplete = "${BuildConfig.ACTIVATION_URL}${if ('?' in BuildConfig.ACTIVATION_URL) '&' else '?'}code=$mockCode",
                        expiresAt = System.currentTimeMillis() + 600000L,
                        intervalSeconds = 5,
                        status = DeviceActivationStatus.WAITING,
                        publicDeviceId = "",
                        sourcePullToken = "",
                        error = "Offline Mode - Presentation Only"
                    )
                    internal.update {
                        it.copy(
                            activationSession = mockSession,
                            error = null,
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
                        error = activationErrorMessage(throwable, "تعذر متابعة التفعيل الآن. حدّث QR أو جرّب لاحقًا."),
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

    private fun startActivatedProfileLogin(profile: ActivatedProfile) {
        loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                when (profile.kind) {
                    com.moalfarras.moplayer.domain.model.LoginKind.XTREAM -> {
                        iptv.loginXtream(profile.name, profile.baseUrl, profile.username, profile.password)
                            .collect { progress -> internal.update { it.copy(loading = progress, error = null) } }
                    }
                    com.moalfarras.moplayer.domain.model.LoginKind.M3U -> {
                        iptv.loginM3u(profile.name, profile.playlistUrl, profile.epgUrl)
                            .collect { progress -> internal.update { it.copy(loading = progress, error = null) } }
                    }
                }
            }.onFailure { throwable ->
                internal.update { it.copy(error = activationErrorMessage(throwable, "تم التفعيل، لكن تعذرت مزامنة الحساب. حاول لاحقًا."), loading = null) }
            }.onSuccess {
                internal.update { it.copy(loading = null, section = AppSection.HOME, activationSession = null) }
                saveLastSection(AppSection.HOME)
                refreshEpgSilently()
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
                    selectedCategoryId = c,
                )
            }
        } else {
            internal.update { it.copy(searchQuery = query) }
        }
        saveLastSection(AppSection.SEARCH)
        if (query.isNotBlank()) {
            viewModelScope.launch { settingsRepo.addSearchHistory(query) }
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
        viewModelScope.launch { settingsRepo.setFootballMaxMatches(value) }
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

    fun activateServer(serverId: Long) {
        viewModelScope.launch {
            iptv.activateServer(serverId)
            internal.update { it.copy(notice = "تم تفعيل الحساب") }
        }
    }

    fun refreshServer() {
        val server = uiState.value.activeServer ?: return
        loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                iptv.refreshServer(server).collect { progress -> internal.update { it.copy(loading = progress, error = null) } }
            }.onFailure { throwable ->
                internal.update { it.copy(error = throwable.message ?: "Refresh failed", loading = null) }
            }.onSuccess {
                internal.update { it.copy(loading = null, error = null) }
                refreshEpgSilently()
            }
        }
    }

    fun clearSearchHistory() {
        viewModelScope.launch {
            settingsRepo.clearSearchHistory()
            internal.update { it.copy(notice = "تم مسح سجل البحث") }
        }
    }

    fun clearWatchHistory() {
        val server = uiState.value.activeServer ?: return
        viewModelScope.launch {
            iptv.clearWatchHistory(server.id)
            internal.update { it.copy(notice = "تم مسح سجل المشاهدة") }
        }
    }

    fun clearEpgCache() {
        val server = uiState.value.activeServer ?: return
        viewModelScope.launch {
            iptv.clearEpgCache(server.id)
            internal.update { it.copy(notice = "تم مسح كاش EPG") }
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
        internal.update { it.copy(seriesDetail = item, focusedItem = item, section = AppSection.SERIES_DETAIL, returnSection = AppSection.SERIES_DETAIL) }
        saveLastSection(AppSection.SERIES)
        val activeServer = uiState.value.activeServer ?: return
        viewModelScope.launch {
            runCatching { iptv.refreshSeriesDetails(activeServer, item) }
                .onFailure { throwable -> internal.update { state -> state.copy(error = throwable.message ?: "Failed to load series details") } }
        }
    }

    fun refreshWidgets() {
        val settings = uiState.value.settings
        viewModelScope.launch { weather.value = widgets.weather(settings) }
        viewModelScope.launch { football.value = widgets.football() }
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

    class Factory(
        private val iptv: IptvRepository,
        private val settingsRepo: AppSettingsRepository,
        private val widgets: WidgetRepository,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = MainViewModel(iptv, settingsRepo, widgets) as T
    }
}

private fun activationErrorMessage(throwable: Throwable, fallback: String): String {
    val raw = throwable.message.orEmpty()
    return when {
        raw.contains("Supabase is not configured", ignoreCase = true) ->
            "التفعيل السحابي غير مهيأ بعد. أضف إعدادات Supabase أو استخدم M3U/Xtream."
        raw.contains("failed to connect", ignoreCase = true) ||
            raw.contains("connection refused", ignoreCase = true) ||
            raw.contains("timeout", ignoreCase = true) ||
            raw.contains("timed out", ignoreCase = true) ||
            raw.contains("unable to resolve host", ignoreCase = true) ->
            "خدمة التفعيل غير متاحة الآن. تأكد من الاتصال أو جرّب لاحقًا."
        raw.isBlank() -> fallback
        else -> fallback
    }
}

private val adultKeywords = listOf(
    "adult", "xxx", "18+", "porn", "sex", "erotic", "hot",
    "للكبار", "اباح", "إباح", "جنس", "ساخن", "+18",
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

private fun UiState.libraryServerId(activeId: Long): Long =
    if (settings.libraryMode == LibraryMode.MERGED) 0L else activeId
