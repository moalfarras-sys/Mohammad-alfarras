package com.moalfarras.moplayer

import android.content.Intent
import android.content.pm.ActivityInfo
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.LocalOnBackPressedDispatcherOwner
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.Link
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.lifecycleScope
import androidx.paging.compose.LazyPagingItems
import androidx.paging.compose.collectAsLazyPagingItems
import com.moalfarras.moplayer.core.Adaptive
import com.moalfarras.moplayer.core.AppGraph
import com.moalfarras.moplayer.core.isImportablePlaylistLink
import com.moalfarras.moplayer.data.repository.DeviceStateStore
import com.moalfarras.moplayer.data.repository.visibleAppBlock
import com.moalfarras.moplayer.domain.model.DeviceActivationStatus
import com.moalfarras.moplayer.domain.model.LoadProgress
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.ui.AppSection
import com.moalfarras.moplayer.ui.MainViewModel
import com.moalfarras.moplayer.ui.components.BottomDock
import com.moalfarras.moplayer.ui.components.FocusGlow
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.i18n.AppLanguage
import com.moalfarras.moplayer.ui.i18n.I18n
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.app
import com.moalfarras.moplayer.ui.i18n.ltr
import com.moalfarras.moplayer.ui.i18n.settings
import com.moalfarras.moplayer.ui.i18n.stringsFor
import com.moalfarras.moplayer.ui.player.PlayerScreen
import com.moalfarras.moplayer.ui.screens.AppBlockScreen
import com.moalfarras.moplayer.ui.screens.AppUpdateEffects
import com.moalfarras.moplayer.ui.screens.ExitDialog
import com.moalfarras.moplayer.ui.screens.FavoritesScreen
import com.moalfarras.moplayer.ui.screens.HomeScreen
import com.moalfarras.moplayer.ui.screens.LiveScreen
import com.moalfarras.moplayer.ui.screens.LoginScreen
import com.moalfarras.moplayer.ui.screens.PosterScreen
import com.moalfarras.moplayer.ui.screens.SearchScreen
import com.moalfarras.moplayer.ui.screens.SeriesDetailsScreen
import com.moalfarras.moplayer.ui.screens.SettingsScreen
import com.moalfarras.moplayer.ui.screens.SubscriptionExpiredDialog
import com.moalfarras.moplayer.ui.screens.rememberUpdateManager
import com.moalfarras.moplayer.ui.shouldHandleLaunchIntent
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.MoTheme
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import com.moalfarras.moplayerpro.BuildConfig
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels {
        val graph = AppGraph.get(applicationContext)
        MainViewModel.Factory(
            graph.iptvRepository,
            graph.settingsRepository,
            graph.widgetRepository,
            graph.remoteConfigService,
            DeviceStateStore(applicationContext),
        )
    }
    private var incomingPlaylistJob: Job? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
        // No window-wide keep-screen-on: the player's video surfaces keep the screen on while
        // they play, and MoPlayerApp does it during a first sync or a QR code, so the TV
        // screensaver can start on idle menus.
        super.onCreate(savedInstanceState)
        setContent {
            MoPlayerApp(
                viewModel = viewModel,
                finishApp = ::finish,
            )
        }
        // A recreated activity or a relaunch from Recents replays the original intent: its link
        // was already offered.
        val fromHistory = (intent.flags and Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0
        if (shouldHandleLaunchIntent(savedInstanceState != null, fromHistory)) {
            scheduleIncomingPlaylistImport(intent)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        scheduleIncomingPlaylistImport(intent)
    }

    override fun onStart() {
        super.onStart()
        registerNetworkCallback()
    }

    override fun onStop() {
        unregisterNetworkCallback()
        viewModel.flushNavigationState()
        super.onStop()
    }

    private fun scheduleIncomingPlaylistImport(intent: Intent?) {
        val url = extractIncomingPlaylistUrl(intent) ?: run {
            debugIntent("Ignoring incoming intent without a supported playlist URL")
            return
        }
        debugIntent("Accepted incoming playlist intent")
        // Handled once: the intent kept by the activity no longer carries the link.
        setIntent(Intent(intent).setData(null))
        viewModel.markExternalLaunch()
        incomingPlaylistJob?.cancel()
        incomingPlaylistJob = lifecycleScope.launch {
            viewModel.uiState.first { it.initialized }
            viewModel.offerIncomingPlaylist(url)
        }
    }

    /** Lets a QR activation waiting out a network back-off retry as soon as the network is back. */
    private fun registerNetworkCallback() {
        if (networkCallback != null) return
        val connectivity = getSystemService(ConnectivityManager::class.java) ?: return
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                viewModel.onNetworkAvailable()
            }
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                connectivity.registerDefaultNetworkCallback(callback)
            } else {
                val request = NetworkRequest.Builder().addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET).build()
                connectivity.registerNetworkCallback(request, callback)
            }
            networkCallback = callback
        } catch (failure: RuntimeException) {
            Log.w("MoPlayerNetwork", "Network callback unavailable", failure)
        }
    }

    private fun unregisterNetworkCallback() {
        val callback = networkCallback ?: return
        networkCallback = null
        runCatching { getSystemService(ConnectivityManager::class.java)?.unregisterNetworkCallback(callback) }
    }

    private fun debugIntent(message: String) {
        if (BuildConfig.DEBUG) Log.d("MoPlayerIntent", message)
    }

    private fun extractIncomingPlaylistUrl(intent: Intent?): String? =
        intent?.dataString
            ?.trim()
            ?.takeIf { isImportablePlaylistLink(it) }
}

private fun LazyPagingItems<MediaItem>.snapshotItems(limit: Int = 30): List<MediaItem> =
    itemSnapshotList.items.take(limit)

@Composable
private fun MoPlayerApp(
    viewModel: MainViewModel,
    finishApp: () -> Unit,
) {
    val state by viewModel.uiState.collectAsState()
    val weather by viewModel.weather.collectAsState()
    val football by viewModel.football.collectAsState()
    val liveCategories by viewModel.liveCategories.collectAsState()
    val movieCategories by viewModel.movieCategories.collectAsState()
    val seriesCategories by viewModel.seriesCategories.collectAsState()
    val media = viewModel.selectedMedia.collectAsLazyPagingItems()
    val favorites = viewModel.favorites.collectAsLazyPagingItems()
    val searchResults = viewModel.searchResults.collectAsLazyPagingItems()
    // The 5 Home shelves (continueWatching/recentLive/latestLive/latestMovies/latestSeries) are
    // collected INSIDE the HOME branch below, not here — so a cold start restored into Live/Movies/
    // Series/Favorites/Search fires zero home-shelf Room queries. cachedIn(viewModelScope) makes the
    // first HOME entry (and every re-entry) replay instantly.
    val seriesEpisodes by viewModel.seriesEpisodes.collectAsState(initial = emptyList())
    val focusedLiveEpg by viewModel.focusedLiveEpg.collectAsState()
    val accent = Color(state.settings.accentColor)
    val tv = rememberTvScale()
    val context = androidx.compose.ui.platform.LocalContext.current
    val devicePerformance = remember { Adaptive.performanceInfo(context) }
    val performancePolicy = remember(state.settings, devicePerformance) {
        Adaptive.performancePolicy(state.settings, devicePerformance)
    }
    // Trailer capability = the ADMIN remote switch AND the user's own Settings switch, except in
    // PERFORMANCE mode: a WebView renderer (100+ MB) next to playback is what a 1 GB box cannot
    // afford. Not gated on reduceMotion (that wrongly killed mid-tier TVs); a muted trailer is only
    // created after a focus dwell and old WebViews are guarded inside PreviewTrailerHost.
    val trailerPreviewCapable = state.settings.trailerPreviewEnabled &&
        state.settings.showTrailerPreviews &&
        !performancePolicy.isPerformance
    LaunchedEffect(trailerPreviewCapable) { viewModel.setTrailerPreviewCapable(trailerPreviewCapable) }
    val previewTrailer = remember(state.focusedTrailer) {
        state.focusedTrailer?.let { com.moalfarras.moplayer.ui.components.PreviewTrailer(it.itemKey, it.youtubeId) }
            ?: com.moalfarras.moplayer.ui.components.PreviewTrailer()
    }
    var lastExitBackAt by remember { mutableLongStateOf(0L) }
    val homeContentFocus = remember { androidx.compose.ui.focus.FocusRequester() }
    val appLanguage = AppLanguage.resolve(state.settings.languageTag)
    val appStrings = stringsFor(appLanguage).app
    val signingIn = state.activeServer == null || state.showSignIn

    // The screen stays on while the viewer waits for something to finish: a first library sync
    // or a QR code waiting for the phone. Playback keeps it on through its video surfaces.
    val view = LocalView.current
    val keepAwake = state.loading != null ||
        (signingIn && state.activationSession?.status == DeviceActivationStatus.WAITING)
    DisposableEffect(view, keepAwake) {
        view.keepScreenOn = keepAwake
        onDispose { view.keepScreenOn = false }
    }

    fun requestBack() {
        val now = System.currentTimeMillis()
        when {
            state.showExitDialog -> viewModel.setExitDialog(false)
            state.section == AppSection.PLAYER && state.playingItem != null -> viewModel.closePlayer()
            state.activeServer != null && state.showSignIn -> viewModel.cancelSignIn()
            state.activeServer != null && state.error != null -> {
                viewModel.clearError()
                lastExitBackAt = 0L
            }
            state.activeServer != null && state.section != AppSection.HOME -> {
                viewModel.navigateBack()
                lastExitBackAt = 0L
            }
            state.activeServer != null && state.dockFocusSection == null -> {
                viewModel.focusDock(state.section)
                lastExitBackAt = 0L
            }
            now - lastExitBackAt <= 1_500L -> {
                viewModel.setExitDialog(true)
                lastExitBackAt = 0L
            }
            else -> {
                lastExitBackAt = now
                viewModel.showNotice(appStrings.pressBackAgainToExit)
            }
        }
    }

    SideEffect { I18n.current = appLanguage }
    CompositionLocalProvider(
        LocalLayoutDirection provides if (appLanguage.isRtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
        LocalStrings provides stringsFor(appLanguage),
        com.moalfarras.moplayer.ui.components.LocalPosterImageSize provides performancePolicy.posterImageSize,
        com.moalfarras.moplayer.ui.components.LocalPreviewTrailer provides previewTrailer,
        com.moalfarras.moplayer.ui.components.LocalTrailerErrorReporter provides viewModel::reportTrailerUnplayable,
    ) {
    MoTheme(accent = accent, uiScale = state.settings.uiScale) {
        // Lowest-priority Back: screens and overlays composed below register their own
        // BackHandler and win. Every Back (key or Android 16 back gesture) arrives here through
        // the OnBackPressedDispatcher.
        BackHandler {
            requestBack()
        }
        val updateManager = rememberUpdateManager()
        val playerOpen = state.section == AppSection.PLAYER && state.playingItem != null
        AppUpdateEffects(updateManager, deferInstaller = playerOpen, onRefreshConfig = { viewModel.refreshRemoteConfig() })
        val appBlock = visibleAppBlock(state.appBlock, playerOpen)
        when {
            !state.initialized -> {
                // Brief splash while the saved account/library is read from disk, so a logged-in
                // user never sees the sign-in screen flash on cold start.
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(Color(0xFF0A0908)),
                    contentAlignment = Alignment.Center,
                ) {
                    // Normally gone in well under a second. The first start after an update runs
                    // the one-time library migration (several seconds on big catalogs), so explain
                    // the wait instead of leaving a bare spinner.
                    var slowStart by remember { mutableStateOf(false) }
                    LaunchedEffect(Unit) {
                        delay(SLOW_START_HINT_MS)
                        slowStart = true
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        CircularProgressIndicator(color = accent)
                        AnimatedVisibility(visible = slowStart, enter = fadeIn()) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(appStrings.preparingLibrary, color = Color.White, style = MaterialTheme.typography.titleMedium)
                                Text(appStrings.preparingLibraryHint, color = Color.White.copy(alpha = 0.66f), style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                }
            }
            appBlock != null -> AppBlockScreen(
                block = appBlock,
                manager = updateManager,
                onRetry = viewModel::retryAppBlock,
                onExit = finishApp,
            )
            signingIn -> {
                Box(
                    Modifier
                        .fillMaxSize()
                        .safeDrawingPadding(),
                ) {
                    LoginScreen(
                        settings = state.settings,
                        loading = state.loading,
                        error = state.error,
                        activationSession = state.activationSession,
                        reduceMotion = performancePolicy.reduceMotion,
                        onM3u = viewModel::loginM3u,
                        onM3uFile = viewModel::loginM3uText,
                        onXtream = viewModel::loginXtream,
                        onRefreshQr = { viewModel.refreshDeviceActivation() },
                        onResumeQr = viewModel::resumeDeviceActivation,
                        onStopQr = viewModel::stopDeviceActivation,
                    )
                    if (state.showExitDialog) {
                        ExitDialog(onDismiss = { viewModel.setExitDialog(false) }, onExit = finishApp)
                    }
                    state.pendingImportHost?.let { host ->
                        IncomingPlaylistDialog(host, onConfirm = viewModel::confirmIncomingPlaylist, onDismiss = viewModel::dismissIncomingPlaylist)
                    }
                }
            }
            state.section == AppSection.PLAYER && state.playingItem != null -> {
                val playing = state.playingItem!!
                val liveZapItems by viewModel.liveZapItems.collectAsState()
                val relatedItems = if (playing.type == com.moalfarras.moplayer.domain.model.ContentType.LIVE) {
                    // The zap list loads in a few ms; until then the list on screen stands in.
                    liveZapItems.ifEmpty { media.snapshotItems(100).filter { it.type == playing.type } }
                } else {
                    when (state.returnSection) {
                        AppSection.SERIES_DETAIL -> seriesEpisodes.filter { it.type == playing.type }
                        AppSection.MOVIES, AppSection.SERIES -> media.snapshotItems(100).filter { it.type == playing.type }
                        AppSection.FAVORITES -> favorites.snapshotItems(100).filter { it.type == playing.type }
                        AppSection.SEARCH -> searchResults.snapshotItems(100).filter { it.type == playing.type }
                        else -> emptyList()
                    }
                }
                PlayerScreen(
                    item = playing,
                    onBack = viewModel::closePlayer,
                    onProgress = viewModel::updatePlaybackProgress,
                    relatedItems = relatedItems,
                    onPlayItem = viewModel::play,
                    // Automatic switches to another feed of the same channel stay out of history.
                    onSwitchVariant = viewModel::playWithoutHistory,
                    onTripleOk = { viewModel.toggleFavorite(playing) },
                    accent = accent,
                    preferredPlayer = state.settings.preferredPlayer,
                    videoSizeMode = state.settings.videoSizeMode,
                    onVideoSizeMode = viewModel::setVideoSizeMode,
                    performancePolicy = performancePolicy,
                    // Stored guide only (no network per row): the programme on air, if any.
                    liveNowTitle = { channel ->
                        state.servers.firstOrNull { it.id == channel.serverId }?.let { server ->
                            AppGraph.get(context).iptvRepository.localLiveEpg(server, channel, limit = 1)
                                ?.current
                                ?.takeIf { it.startAt <= System.currentTimeMillis() }
                                ?.title
                        }
                    },
                    nextEpisode = viewModel::nextEpisodeAfter,
                    liveGroups = liveCategories,
                    livePanelSource = viewModel.livePanelSource,
                )
            }
            else -> {
                val backDispatcher = LocalOnBackPressedDispatcherOwner.current?.onBackPressedDispatcher
                val backKey = remember { BackKeyTracker() }
                Box(
                    Modifier
                        .fillMaxSize()
                        .safeDrawingPadding(),
                ) {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .onPreviewKeyEvent { event ->
                                // Back acts once per press, on release, through the same
                                // dispatcher Android 16 uses: overlays with their own BackHandler
                                // win, a held key does not cascade, and Compose never turns the
                                // key into a focus exit.
                                if (event.key != Key.Back) return@onPreviewKeyEvent false
                                when (event.type) {
                                    KeyEventType.KeyDown -> {
                                        if (event.nativeKeyEvent.repeatCount == 0) backKey.pressed = true
                                        true
                                    }
                                    KeyEventType.KeyUp -> {
                                        if (backKey.pressed && !event.nativeKeyEvent.isCanceled) backDispatcher?.onBackPressed()
                                        backKey.pressed = false
                                        true
                                    }
                                    else -> false
                                }
                            },
                    ) {
                        when (state.section) {
                            AppSection.HOME -> {
                                // Collected here (not at the root) so these Room queries only run
                                // when Home is actually shown; cachedIn keeps re-entry instant.
                                val continueWatching = viewModel.continueWatching.collectAsLazyPagingItems()
                                val recentLive = viewModel.recentLive.collectAsLazyPagingItems()
                                val latestLive = viewModel.latestLive.collectAsLazyPagingItems()
                                val latestMovies = viewModel.latestMovies.collectAsLazyPagingItems()
                                val latestSeries = viewModel.latestSeries.collectAsLazyPagingItems()
                                HomeScreen(weather, football, continueWatching.snapshotItems(), recentLive.snapshotItems(), latestLive.snapshotItems(), latestMovies.snapshotItems(), latestSeries.snapshotItems(), state.activeServer, state.settings, performancePolicy, if (state.dockFocusSection == null) state.restoreFocusItem else null, state.dockFocusSection == null, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite, accent, state.backgroundRefresh != null || state.loading != null, favoriteLive = favorites.itemSnapshotList.items.filter { it.type == com.moalfarras.moplayer.domain.model.ContentType.LIVE }.take(30), contentFocusRequester = homeContentFocus)
                            }
                            AppSection.LIVE -> LiveScreen(liveCategories, viewModel.selectedMedia, state.focusedItem, state.restoreFocusItem, focusedLiveEpg, state.selectedCategoryId, performancePolicy.enablePreviewPane, performancePolicy, viewModel::selectCategory, viewModel::clearCategory, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite)
                            AppSection.MOVIES -> PosterScreen(LocalStrings.current.navMovies, movieCategories, viewModel.selectedMedia, state.focusedItem, state.restoreFocusItem, state.selectedCategoryId, performancePolicy.enablePreviewPane, performancePolicy, viewModel::selectCategory, viewModel::clearCategory, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite)
                            AppSection.SERIES -> PosterScreen(LocalStrings.current.navSeries, seriesCategories, viewModel.selectedMedia, state.focusedItem, state.restoreFocusItem, state.selectedCategoryId, performancePolicy.enablePreviewPane, performancePolicy, viewModel::selectCategory, viewModel::clearCategory, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite)
                            AppSection.FAVORITES -> FavoritesScreen(viewModel.favorites, state.focusedItem, state.restoreFocusItem, performancePolicy.enablePreviewPane, performancePolicy, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite)
                            AppSection.SERIES_DETAIL -> {
                                val series = state.seriesDetail
                                if (series != null) {
                                    SeriesDetailsScreen(
                                        series = series,
                                        episodes = seriesEpisodes,
                                        isLoading = state.seriesDetailsLoading,
                                        focused = state.focusedItem,
                                        restoreFocusItem = state.restoreFocusItem,
                                        performancePolicy = performancePolicy,
                                        onFocus = viewModel::focusItem,
                                        onPlay = viewModel::play,
                                        onFavorite = viewModel::toggleFavorite,
                                    )
                                } else {
                                    LaunchedEffect(Unit) { viewModel.navigateBack() }
                                }
                            }
                            AppSection.SEARCH -> SearchScreen(state.searchQuery, state.settings.searchHistory, viewModel.searchResults, state.restoreFocusItem, viewModel::setSearch, viewModel::clearSearchHistory, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite, onCommitSearch = viewModel::commitSearchHistory)
                            AppSection.SETTINGS -> SettingsScreen(state.settings, performancePolicy, devicePerformance, state.settingsUnlocked, state.activeServer, state.servers, viewModel::setPreviewEnabled, viewModel::setParentalEnabled, viewModel::setAutoPlayLastLive, viewModel::setHideEmptyCategories, viewModel::setHideChannelsWithoutLogo, viewModel::setPreferredPlayer, viewModel::setVideoSizeMode, viewModel::setLibraryMode, viewModel::setLanguage, viewModel::setDefaultSort, viewModel::setAccentMode, viewModel::setAccentColor, viewModel::setBackgroundMode, viewModel::setCustomBackgroundUrl, viewModel::setThemePreset, viewModel::setMotionLevel, viewModel::setPerformanceMode, viewModel::setShowWeatherWidget, viewModel::setShowClockWidget, viewModel::setShowFootballWidget, viewModel::setWeatherMode, viewModel::setManualWeatherEffect, viewModel::setWeatherCityOverride, viewModel::setFootballMaxMatches, viewModel::refreshWidgets, viewModel::refreshServer, viewModel::testServerConnection, viewModel::clearWatchHistory, viewModel::clearEpgCache, viewModel::unlockSettings, viewModel::lockSettings, viewModel::setParentalPin, viewModel::changeParentalPin, viewModel::removeParentalPin, viewModel::logoutActiveServer, viewModel::activateServer, viewModel::deleteServer, viewModel::setShowTrailerPreviews, providerAccountCreatedAt = viewModel::providerAccountCreatedAt, pinError = state.pinError, onUiScale = viewModel::setUiScale)
                            AppSection.PLAYER -> LaunchedEffect(Unit) { viewModel.closePlayer() }
                        }
                        androidx.compose.animation.AnimatedVisibility(
                            visible = state.activeServer != null &&
                                state.section == AppSection.HOME &&
                                !state.showExitDialog,
                            modifier = Modifier.align(Alignment.BottomCenter),
                            enter = androidx.compose.animation.slideInVertically(initialOffsetY = { it }) + androidx.compose.animation.fadeIn(),
                            exit = androidx.compose.animation.slideOutVertically(targetOffsetY = { it }) + androidx.compose.animation.fadeOut(),
                        ) {
                            BottomDock(
                                selected = state.dockFocusSection ?: state.section,
                                restoreFocusSection = state.dockFocusSection,
                                onSelect = viewModel::select,
                                onSearch = { viewModel.select(AppSection.SEARCH) },
                                modifier = Modifier.padding(bottom = if (tv.isCompact) 10.dp else 18.dp),
                                contentFocusRequester = homeContentFocus,
                            )
                        }
                        if (state.showExitDialog) {
                            ExitDialog(onDismiss = { viewModel.setExitDialog(false) }, onExit = finishApp)
                        }
                        if (state.subscriptionExpired) {
                            SubscriptionExpiredDialog(
                                onNewSignIn = viewModel::startNewSubscriptionSignIn,
                                onDismiss = viewModel::dismissSubscriptionExpired,
                                onCheckAgain = viewModel::recheckSubscription,
                                onUseAnotherSource = viewModel::signInWithAnotherSource,
                            )
                        }
                        state.pendingImportHost?.let { host ->
                            IncomingPlaylistDialog(host, onConfirm = viewModel::confirmIncomingPlaylist, onDismiss = viewModel::dismissIncomingPlaylist)
                        }
                        state.loading?.let { progress ->
                            SyncOverlay(progress = progress)
                        }
                        state.backgroundRefresh?.let { progress ->
                            RefreshStatusChip(
                                progress = progress,
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(top = 18.dp, end = 22.dp),
                            )
                        }
                        // Blocks (maintenance, forced update) render as AppBlockScreen above everything,
                        // so an error here is always a routine, dismissible banner.
                        state.error?.let { error ->
                            ErrorBanner(message = error, onDismiss = viewModel::clearError)
                        }
                        state.notice?.let { notice ->
                            NoticeOverlay(message = notice, onDismiss = viewModel::clearNotice)
                        }
                    }
                }
            }
        }
    }
    }
}

/** Whether the current Back press started while this screen had the key (a press, not a leftover release). */
private class BackKeyTracker {
    var pressed = false
}

@Composable
private fun RefreshStatusChip(progress: LoadProgress, modifier: Modifier = Modifier) {
    val visuals = LocalMoVisuals.current
    GlassPanel(
        modifier = modifier.widthIn(min = 260.dp, max = 380.dp),
        radius = 999.dp,
        highlighted = true,
        glow = visuals.accent.copy(alpha = 0.18f),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 18.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                text = progress.phase,
                color = Color.White,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = LocalStrings.current.app.refreshChipHint,
                color = Color(0xB8E3BC78),
                style = MaterialTheme.typography.labelSmall,
            )
            if (progress.total > 0) {
                Text(
                    text = "${progress.loaded} / ${progress.total}".ltr(),
                    color = Color(0xCCE3BC78),
                    style = MaterialTheme.typography.labelMedium,
                )
            }
        }
    }
}

@Composable
private fun SyncOverlay(progress: LoadProgress) {
    val visuals = LocalMoVisuals.current
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0x99080604), Color(0xDD050403)),
                ),
            ),
        contentAlignment = Alignment.Center,
    ) {
        GlassPanel(
            modifier = Modifier.widthIn(min = 360.dp, max = 520.dp),
            radius = 28.dp,
            highlighted = true,
            glow = visuals.glow,
            contentAlignment = Alignment.Center,
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 34.dp, vertical = 30.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                CircularProgressIndicator(color = visuals.accent)
                Text(
                    text = progress.phase,
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = LocalStrings.current.app.syncOverlayHint,
                    color = Color(0xB8E3BC78),
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                )
                if (progress.total > 0) {
                    Text(
                        text = "${progress.loaded} / ${progress.total}".ltr(),
                        color = Color(0xCCE3BC78),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
        }
    }
}

/**
 * A routine error (connection test, refresh, series details, import): a banner at the top that
 * never takes focus or covers the screen, goes away by itself, on Back or on a tap.
 */
@Composable
private fun ErrorBanner(message: String, onDismiss: () -> Unit) {
    val strings = LocalStrings.current.app
    LaunchedEffect(message) {
        delay(ERROR_BANNER_MS)
        onDismiss()
    }
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.TopCenter,
    ) {
        GlassPanel(
            modifier = Modifier
                .padding(top = 40.dp, start = 24.dp, end = 24.dp)
                .widthIn(min = 320.dp, max = 620.dp)
                .pointerInput(message) { detectTapGestures { onDismiss() } },
            radius = 22.dp,
            highlighted = true,
            glow = Color(0x66FF6B6B),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 22.dp, vertical = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Rounded.ErrorOutline, contentDescription = null, tint = Color(0xFFFF8FA3), modifier = Modifier.size(30.dp))
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = strings.errorTitle,
                        color = Color.White,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = message,
                        color = Color(0xFFFFD2CC),
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 4,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }
}

/**
 * Confirmation for a playlist link opened from another app. Only the host is shown: the rest of
 * such links carries the account's username and password. Focus starts on Cancel; Back cancels.
 */
@Composable
private fun IncomingPlaylistDialog(host: String, onConfirm: () -> Unit, onDismiss: () -> Unit) {
    val strings = LocalStrings.current
    val app = strings.app
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val cancelFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) {
        delay(120)
        runCatching { cancelFocus.requestFocus() }
    }
    Dialog(onDismissRequest = onDismiss) {
        GlassPanel(
            modifier = Modifier.widthIn(max = if (tv.isTv) 500.dp else 380.dp),
            radius = 26.dp,
            highlighted = true,
            glow = visuals.glow,
        ) {
            Column(
                modifier = Modifier.padding(28.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Icon(Icons.Rounded.Link, contentDescription = null, tint = visuals.accent, modifier = Modifier.size(42.dp))
                Text(
                    text = app.importLinkTitle,
                    color = Color.White,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.ExtraBold,
                    textAlign = TextAlign.Center,
                )
                Text(
                    text = app.importLinkBody(host.ltr()),
                    color = Color(0xCCFFFFFF),
                    fontSize = 15.sp,
                    lineHeight = 21.sp,
                    textAlign = TextAlign.Center,
                )
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    ShellDialogButton(strings.cancel, Modifier.weight(1f), focusRequester = cancelFocus, onClick = onDismiss)
                    ShellDialogButton(app.importLinkConfirm, Modifier.weight(1f), accent = true, onClick = onConfirm)
                }
            }
        }
    }
}

@Composable
private fun ShellDialogButton(
    text: String,
    modifier: Modifier,
    focusRequester: FocusRequester? = null,
    accent: Boolean = false,
    onClick: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    FocusGlow(modifier = modifier.height(52.dp), cornerRadius = 14.dp, focusRequester = focusRequester, onClick = onClick) {
        Box(
            Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(12.dp))
                .background(if (accent) visuals.accent else Color(0x33FFFFFF)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = text,
                color = if (accent) Color.Black else Color.White,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 16.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(horizontal = 10.dp),
            )
        }
    }
}

@Composable
private fun NoticeOverlay(message: String, onDismiss: () -> Unit) {
    val visuals = LocalMoVisuals.current
    // Auto-dismiss any transient notice so it never stays stuck on screen.
    LaunchedEffect(message) {
        kotlinx.coroutines.delay(3200)
        onDismiss()
    }
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.TopCenter,
    ) {
        GlassPanel(
            modifier = Modifier
                .padding(top = 48.dp)
                .widthIn(min = 300.dp, max = 560.dp)
                .pointerInput(message) { detectTapGestures { onDismiss() } },
            radius = 22.dp,
            highlighted = true,
            glow = visuals.glow,
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = message,
                color = Color.White,
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(horizontal = 24.dp, vertical = 18.dp),
            )
        }
    }
}

/** Routine errors dismiss themselves after this long. */
private const val ERROR_BANNER_MS = 6_000L

/** How long the startup splash may show a bare spinner before it explains the wait. */
private const val SLOW_START_HINT_MS = 1_200L
