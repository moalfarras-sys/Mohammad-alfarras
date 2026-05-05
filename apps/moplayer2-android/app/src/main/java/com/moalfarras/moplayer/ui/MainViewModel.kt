package com.moalfarras.moplayer.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.moalfarras.moplayer.data.repository.AppSettingsRepository
import com.moalfarras.moplayer.data.repository.IptvRepository
import com.moalfarras.moplayer.data.repository.WidgetRepository
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.ActivatedProfile
import com.moalfarras.moplayer.domain.model.Category
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.DeviceActivationSession
import com.moalfarras.moplayer.domain.model.DeviceActivationStatus
import com.moalfarras.moplayer.domain.model.FootballMatch
import com.moalfarras.moplayer.domain.model.LiveEpgSnapshot
import com.moalfarras.moplayer.domain.model.LoadProgress
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.ServerProfile
import com.moalfarras.moplayer.domain.model.SortOption
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
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
            iptv.categories(server.id, ContentType.LIVE).map { categories ->
                categories.filterParentalCategories(state.settings.parentalControlsEnabled)
            }
        } ?: flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val movieCategories = uiState.flatMapLatest { state ->
        state.activeServer?.let { iptv.categories(it.id, ContentType.MOVIE).map { list -> list.filterParentalCategories(state.settings.parentalControlsEnabled) } } ?: flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val seriesCategories = uiState.flatMapLatest { state ->
        state.activeServer?.let { iptv.categories(it.id, ContentType.SERIES).map { list -> list.filterParentalCategories(state.settings.parentalControlsEnabled) } } ?: flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val selectedMedia: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        val server = state.activeServer ?: return@flatMapLatest flowOf(PagingData.empty())
        val type = when (state.section) {
            AppSection.LIVE -> ContentType.LIVE
            AppSection.MOVIES -> ContentType.MOVIE
            AppSection.SERIES -> ContentType.SERIES
            else -> ContentType.MOVIE
        }
        val source = if (state.selectedCategoryId.isBlank()) iptv.mediaByType(server.id, type) else iptv.mediaByCategory(server.id, type, state.selectedCategoryId)
        source.map { pagingData ->
            pagingData.filter { item ->
                val isParental = state.settings.parentalControlsEnabled && 
                    (item.title.contains("adult", true) || item.categoryId.contains("adult", true))
                !isParental
            }
        }.cachedIn(viewModelScope)
    }


    val latestMovies: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        state.activeServer?.let { iptv.latestMovies(it.id) }.let { it ?: flowOf(PagingData.empty()) }.cachedIn(viewModelScope)
    }

    val latestLive: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        state.activeServer?.let { iptv.latestLive(it.id) }.let { it ?: flowOf(PagingData.empty()) }.cachedIn(viewModelScope)
    }

    val latestSeries: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        state.activeServer?.let { iptv.latestSeries(it.id) }.let { it ?: flowOf(PagingData.empty()) }.cachedIn(viewModelScope)
    }

    val favorites: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        state.activeServer?.let { iptv.favorites(it.id) }.let { it ?: flowOf(PagingData.empty()) }.cachedIn(viewModelScope)
    }


    val continueWatching: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        val server = state.activeServer
        if (server == null) flowOf(PagingData.empty()) 
        else iptv.continueWatching(server.id).cachedIn(viewModelScope)
    }

    val recentLive: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        val server = state.activeServer
        if (server == null) flowOf(PagingData.empty()) 
        else iptv.recentlyPlayed(server.id, ContentType.LIVE).cachedIn(viewModelScope)
    }


    val searchResults: kotlinx.coroutines.flow.Flow<androidx.paging.PagingData<MediaItem>> = uiState.flatMapLatest { state ->
        val server = state.activeServer
        if (server == null || state.searchQuery.isBlank()) flowOf(PagingData.empty()) else iptv.search(server.id, state.searchQuery.trim()).cachedIn(viewModelScope)
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
        val requirePin = section == AppSection.SETTINGS && uiState.value.settings.hasParentalPin
        internal.update {
            it.copy(
                section = section,
                returnSection = section,
                selectedCategoryId = "",
                error = null,
                settingsUnlocked = if (section == AppSection.SETTINGS) !requirePin else it.settingsUnlocked,
                seriesDetail = if (section == AppSection.SERIES || section == AppSection.HOME || section == AppSection.FAVORITES) null else it.seriesDetail,
            )
        }
        saveLastSection(section)
    }

    fun selectCategory(category: Category) {
        internal.update { it.copy(selectedCategoryId = category.id) }
    }

    fun clearCategory() {
        internal.update { it.copy(selectedCategoryId = "") }
    }

    fun focusItem(item: MediaItem?) {
        internal.update { it.copy(focusedItem = item) }
    }

    fun play(item: MediaItem) {
        viewModelScope.launch { iptv.notePlaybackStart(item) }
        when (item.type) {
            ContentType.SERIES -> openSeries(item)
            else -> internal.update {
                saveLastSection(it.section)
                it.copy(playingItem = item, returnSection = it.section, section = AppSection.PLAYER)
            }
        }
    }

    fun closePlayer(positionMs: Long = 0, durationMs: Long = 0) {
        val item = internal.value.playingItem
        if (item != null && item.type != ContentType.LIVE && durationMs > 0) {
            viewModelScope.launch { iptv.updateWatch(item, positionMs, durationMs) }
        }
        internal.update {
            saveLastSection(it.returnSection)
            it.copy(playingItem = null, section = it.returnSection)
        }
    }

    fun updatePlaybackProgress(item: MediaItem, positionMs: Long, durationMs: Long) {
        if (item.type == ContentType.LIVE || durationMs <= 0) return
        viewModelScope.launch { iptv.updateWatch(item, positionMs, durationMs) }
    }

    fun navigateBack() {
        internal.update { state ->
            when (state.section) {
                AppSection.SERIES_DETAIL -> state.copy(section = AppSection.SERIES, seriesDetail = null)
                AppSection.SEARCH, AppSection.SETTINGS, AppSection.LIVE, AppSection.MOVIES, AppSection.SERIES, AppSection.FAVORITES ->
                    state.copy(section = AppSection.HOME)
                else -> state
            }
        }
        saveLastSection(internal.value.section)
    }

    fun toggleFavorite(item: MediaItem) {
        viewModelScope.launch { iptv.toggleFavorite(item) }
    }

    fun loginM3u(name: String, url: String) {
        loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                iptv.loginM3u(name, url).collect { progress -> internal.update { it.copy(loading = progress, error = null) } }
            }.onFailure { throwable ->
                internal.update { it.copy(error = throwable.message ?: "M3U login failed", loading = null) }
            }.onSuccess {
                internal.update { it.copy(loading = null, section = AppSection.HOME) }
                saveLastSection(AppSection.HOME)
                refreshEpgSilentlyIfXtream()
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
                refreshEpgSilentlyIfXtream()
            }
        }
    }

    fun loginActivationCode(code: String) {
        loginJob?.cancel()
        loginJob = viewModelScope.launch {
            runCatching {
                iptv.loginActivationCode(code).collect { progress -> internal.update { it.copy(loading = progress, error = null) } }
            }.onFailure { throwable ->
                internal.update { it.copy(error = throwable.message ?: "Activation failed", loading = null) }
            }.onSuccess {
                internal.update { it.copy(loading = null, section = AppSection.HOME) }
                saveLastSection(AppSection.HOME)
                refreshEpgSilentlyIfXtream()
            }
        }
    }

    fun refreshDeviceActivation(deviceName: String = android.os.Build.MODEL ?: "Android TV") {
        activationJob?.cancel()
        activationJob = viewModelScope.launch {
            runCatching { iptv.createDeviceActivation(deviceName) }
                .onFailure { throwable ->
                    internal.update {
                        it.copy(
                            activationSession = DeviceActivationSession(
                                deviceCode = "",
                                userCode = "",
                                verificationUrl = "",
                                verificationUrlComplete = "",
                                expiresAt = System.currentTimeMillis(),
                                intervalSeconds = 5,
                                status = DeviceActivationStatus.ERROR,
                                error = throwable.message ?: "Failed to create activation code",
                            ),
                            error = throwable.message ?: "Failed to create activation code",
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
                    session.copy(status = DeviceActivationStatus.ERROR, error = throwable.message ?: "Activation polling failed") to null
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
                        iptv.loginM3u(profile.name, profile.playlistUrl)
                            .collect { progress -> internal.update { it.copy(loading = progress, error = null) } }
                    }
                }
            }.onFailure { throwable ->
                internal.update { it.copy(error = throwable.message ?: "Activated server sync failed", loading = null) }
            }.onSuccess {
                internal.update { it.copy(loading = null, section = AppSection.HOME, activationSession = null) }
                saveLastSection(AppSection.HOME)
                refreshEpgSilentlyIfXtream()
            }
        }
    }

    fun setSearch(query: String) {
        internal.update { it.copy(searchQuery = query, section = AppSection.SEARCH) }
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
                refreshEpgSilentlyIfXtream()
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
        internal.update { it.copy(seriesDetail = item, focusedItem = item, section = AppSection.SERIES_DETAIL, returnSection = AppSection.SERIES_DETAIL) }
        saveLastSection(AppSection.SERIES)
        val activeServer = uiState.value.activeServer ?: return
        viewModelScope.launch {
            runCatching { iptv.refreshSeriesDetails(activeServer, item) }
                .onFailure { throwable -> internal.update { state -> state.copy(error = throwable.message ?: "Failed to load series details") } }
        }
    }

    fun refreshWidgets() {
        viewModelScope.launch { weather.value = widgets.weather() }
        viewModelScope.launch { football.value = widgets.football() }
    }

    private fun refreshEpgSilentlyIfXtream() {
        val server = uiState.value.activeServer ?: return
        if (server.kind != com.moalfarras.moplayer.domain.model.LoginKind.XTREAM) return
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

private val adultKeywords = listOf(
    "adult", "xxx", "18+", "porn", "sex", "erotic", "hot",
    "للكبار", "اباح", "إباح", "جنس", "ساخن", "+18",
)

private fun List<Category>.filterParentalCategories(enabled: Boolean): List<Category> =
    if (!enabled) this else filterNot { category -> adultKeywords.any { category.name.contains(it, ignoreCase = true) } }

private fun List<MediaItem>.filterParentalMedia(enabled: Boolean): List<MediaItem> =
    if (!enabled) this else filterNot { item ->
        val haystack = "${item.title} ${item.description} ${item.categoryId}"
        adultKeywords.any { haystack.contains(it, ignoreCase = true) }
    }

private fun List<MediaItem>.applySort(sortOption: SortOption): List<MediaItem> = when (sortOption) {
    SortOption.SERVER_ORDER -> sortedWith(compareBy<MediaItem> { it.serverOrder }.thenBy { it.title.lowercase() })
    SortOption.LATEST_ADDED -> sortedWith(compareByDescending<MediaItem> { if (it.addedAt > 0) it.addedAt else it.lastModifiedAt }.thenBy { it.serverOrder })
    SortOption.TITLE_ASC -> sortedBy { it.title.lowercase() }
    SortOption.TITLE_DESC -> sortedByDescending { it.title.lowercase() }
    SortOption.RECENTLY_WATCHED -> sortedWith(compareByDescending<MediaItem> { it.lastPlayedAt }.thenBy { it.serverOrder })
    SortOption.FAVORITES_FIRST -> sortedWith(compareByDescending<MediaItem> { it.isFavorite }.thenBy { it.serverOrder }.thenBy { it.title.lowercase() })
    SortOption.RATING -> sortedWith(compareByDescending<MediaItem> { it.rating.toDoubleOrNull() ?: -1.0 }.thenBy { it.serverOrder })
}

private fun String.toRestorableSection(): AppSection =
    runCatching { AppSection.valueOf(this) }.getOrDefault(AppSection.HOME).restorable()

private fun AppSection.restorable(): AppSection = when (this) {
    AppSection.PLAYER -> AppSection.HOME
    AppSection.SERIES_DETAIL -> AppSection.SERIES
    else -> this
}
