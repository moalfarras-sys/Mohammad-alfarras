package com.moalfarras.moplayer

import android.os.Bundle
import android.content.Intent
import android.content.pm.ActivityInfo
import android.util.Log
import android.view.WindowManager
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import com.moalfarras.moplayer.ui.i18n.AppLanguage
import com.moalfarras.moplayer.ui.i18n.I18n
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.stringsFor
import androidx.paging.compose.collectAsLazyPagingItems
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.moalfarras.moplayer.core.AppGraph
import com.moalfarras.moplayer.core.Adaptive
import com.moalfarras.moplayer.domain.model.LoadProgress
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.ui.AppSection
import com.moalfarras.moplayer.ui.MainViewModel
import com.moalfarras.moplayer.ui.components.BottomDock
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.player.PlayerScreen
import com.moalfarras.moplayer.ui.screens.ExitDialog
import com.moalfarras.moplayer.ui.screens.SubscriptionExpiredDialog
import com.moalfarras.moplayer.ui.screens.FavoritesScreen
import com.moalfarras.moplayer.ui.screens.HomeScreen
import com.moalfarras.moplayer.ui.screens.LiveScreen
import com.moalfarras.moplayer.ui.screens.LoginScreen
import com.moalfarras.moplayer.ui.screens.PosterScreen
import com.moalfarras.moplayer.ui.screens.SearchScreen
import com.moalfarras.moplayer.ui.screens.SeriesDetailsScreen
import com.moalfarras.moplayer.ui.screens.SettingsScreen
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.MoTheme
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import com.moalfarras.moplayerpro.BuildConfig
import androidx.paging.compose.LazyPagingItems
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels {
        val graph = AppGraph.get(applicationContext)
        MainViewModel.Factory(graph.iptvRepository, graph.settingsRepository, graph.widgetRepository, graph.remoteConfigService)
    }
    private var incomingPlaylistJob: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
        // Belt-and-braces against TV idle/screensaver: FLAG_KEEP_SCREEN_ON guarantees the
        // display stays awake for the entire app session (not just during playback), and
        // FLAG_TURN_SCREEN_ON wakes the TV if the activity is started while the panel is off.
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        )
        super.onCreate(savedInstanceState)
        setContent {
            MoPlayerApp(
                viewModel = viewModel,
                finishApp = ::finish,
            )
        }
        scheduleIncomingPlaylistImport(intent)
    }

    override fun onResume() {
        super.onResume()
        // Re-assert FLAG_KEEP_SCREEN_ON in case any other component cleared it during the
        // app lifecycle (e.g. external player intent return, system dialogs).
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        scheduleIncomingPlaylistImport(intent)
    }

    private fun scheduleIncomingPlaylistImport(intent: Intent?) {
        val url = extractIncomingPlaylistUrl(intent) ?: run {
            debugIntent("Ignoring incoming intent without a supported playlist URL")
            return
        }
        debugIntent("Accepted incoming playlist intent")
        incomingPlaylistJob?.cancel()
        incomingPlaylistJob = lifecycleScope.launch {
            debugIntent("Waiting for app state before importing playlist")
            viewModel.uiState.first { it.initialized }
            debugIntent("App state initialized; importing playlist")
            viewModel.handleIncomingPlaylistUrl(url)
        }
    }

    private fun debugIntent(message: String) {
        if (BuildConfig.DEBUG) Log.d("MoPlayerIntent", message)
    }

    private fun extractIncomingPlaylistUrl(intent: Intent?): String? =
        intent?.dataString
            ?.trim()
            ?.takeIf { it.isLikelyPlaylistUrl() }

    private fun String.isLikelyPlaylistUrl(): Boolean {
        if (startsWith("http://", ignoreCase = true) || startsWith("https://", ignoreCase = true)) return true
        val lower = lowercase()
        return ('.' in this && '/' in this) ||
            "get.php" in lower ||
            "player_api.php" in lower ||
            "m3u" in lower
    }
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
    val liveZapItems by viewModel.liveZapItems.collectAsState()
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
    // The preview-pane trailer resolves only when the pane is actually shown (off on weak/LOW
    // boxes) and the admin switch is on. NOTE: it is deliberately NOT gated on reduceMotion — a
    // muted trailer is content, not the decorative particle/aurora motion that reduceMotion calms;
    // gating on it wrongly killed the trailer on every mid-tier TV (tvCalmMotion => reduceMotion).
    val trailerPreviewCapable = performancePolicy.enablePreviewPane &&
        state.settings.trailerPreviewEnabled
    LaunchedEffect(trailerPreviewCapable) { viewModel.setTrailerPreviewCapable(trailerPreviewCapable) }
    val previewTrailer = remember(state.focusedTrailer) {
        state.focusedTrailer?.let { com.moalfarras.moplayer.ui.components.PreviewTrailer(it.itemKey, it.youtubeId) }
            ?: com.moalfarras.moplayer.ui.components.PreviewTrailer()
    }
    var lastExitBackAt by remember { mutableLongStateOf(0L) }

    fun requestBack() {
        val now = System.currentTimeMillis()
        if (state.showExitDialog) {
            viewModel.setExitDialog(false)
        } else if (state.section == AppSection.PLAYER && state.playingItem != null) {
            viewModel.closePlayer()
        } else if (state.activeServer != null && state.section != AppSection.HOME) {
            viewModel.navigateBack()
            lastExitBackAt = 0L
        } else if (state.activeServer != null && state.dockFocusSection == null) {
            viewModel.focusDock(state.section)
            lastExitBackAt = 0L
        } else if (now - lastExitBackAt <= 1_500L) {
            viewModel.setExitDialog(true)
            lastExitBackAt = 0L
        } else {
            lastExitBackAt = now
            viewModel.showNotice("Press Back again to exit MoPlayer Pro")
        }
    }

    val appLanguage = AppLanguage.resolve(state.settings.languageTag)
    SideEffect { I18n.current = appLanguage }
    CompositionLocalProvider(
        LocalLayoutDirection provides if (appLanguage.isRtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
        LocalStrings provides stringsFor(appLanguage),
        com.moalfarras.moplayer.ui.components.LocalPosterImageSize provides performancePolicy.posterImageSize,
        com.moalfarras.moplayer.ui.components.LocalPreviewTrailer provides previewTrailer,
        com.moalfarras.moplayer.ui.components.LocalTrailerErrorReporter provides viewModel::reportTrailerUnplayable,
    ) {
    MoTheme(accent = accent) {
        BackHandler {
            requestBack()
        }
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
                    CircularProgressIndicator(color = accent)
                }
            }
            state.activeServer == null -> {
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
                        onActivationCode = viewModel::loginActivationCode,
                        onRefreshQr = { viewModel.refreshDeviceActivation() },
                    )
                    if (state.showExitDialog) {
                        ExitDialog(onDismiss = { viewModel.setExitDialog(false) }, onExit = finishApp)
                    }
                }
            }
            state.section == AppSection.PLAYER && state.playingItem != null -> {
                val playing = state.playingItem!!
                val relatedItems = if (playing.type == com.moalfarras.moplayer.domain.model.ContentType.LIVE) {
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
                    onTripleOk = { viewModel.toggleFavorite(playing) },
                    accent = accent,
                    preferredPlayer = state.settings.preferredPlayer,
                    videoSizeMode = state.settings.videoSizeMode,
                    onVideoSizeMode = viewModel::setVideoSizeMode,
                    performancePolicy = performancePolicy,
                )
            }
            else -> {
                Box(
                    Modifier
                        .fillMaxSize()
                        .safeDrawingPadding(),
                ) {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .onPreviewKeyEvent { event ->
                                if (event.type == KeyEventType.KeyDown && event.key == Key.Back) {
                                    requestBack()
                                    true
                                } else {
                                    false
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
                                HomeScreen(weather, football, continueWatching.snapshotItems(), recentLive.snapshotItems(), latestLive.snapshotItems(), latestMovies.snapshotItems(), latestSeries.snapshotItems(), state.activeServer, state.settings, performancePolicy, if (state.dockFocusSection == null) state.restoreFocusItem else null, state.dockFocusSection == null, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite, accent, state.backgroundRefresh != null || state.loading != null)
                            }
                            AppSection.LIVE -> LiveScreen(liveCategories, viewModel.selectedMedia, state.focusedItem, state.restoreFocusItem, focusedLiveEpg, state.selectedCategoryId, performancePolicy.enablePreviewPane, performancePolicy, viewModel::selectCategory, viewModel::clearCategory, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite)
                            AppSection.MOVIES -> PosterScreen(androidx.compose.ui.res.stringResource(com.moalfarras.moplayerpro.R.string.nav_movies), movieCategories, viewModel.selectedMedia, state.focusedItem, state.restoreFocusItem, state.selectedCategoryId, performancePolicy.enablePreviewPane, performancePolicy, viewModel::selectCategory, viewModel::clearCategory, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite)
                            AppSection.SERIES -> PosterScreen(androidx.compose.ui.res.stringResource(com.moalfarras.moplayerpro.R.string.nav_series), seriesCategories, viewModel.selectedMedia, state.focusedItem, state.restoreFocusItem, state.selectedCategoryId, performancePolicy.enablePreviewPane, performancePolicy, viewModel::selectCategory, viewModel::clearCategory, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite)
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
                            AppSection.SEARCH -> SearchScreen(state.searchQuery, state.settings.searchHistory, viewModel.searchResults, state.restoreFocusItem, viewModel::setSearch, viewModel::clearSearchHistory, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite)
                            AppSection.SETTINGS -> SettingsScreen(state.settings, performancePolicy, devicePerformance, state.settingsUnlocked, state.activeServer, state.servers, viewModel::setPreviewEnabled, viewModel::setParentalEnabled, viewModel::setAutoPlayLastLive, viewModel::setHideEmptyCategories, viewModel::setHideChannelsWithoutLogo, viewModel::setPreferredPlayer, viewModel::setVideoSizeMode, viewModel::setLibraryMode, viewModel::setLanguage, viewModel::setDefaultSort, viewModel::setAccentMode, viewModel::setAccentColor, viewModel::setBackgroundMode, viewModel::setCustomBackgroundUrl, viewModel::setThemePreset, viewModel::setMotionLevel, viewModel::setPerformanceMode, viewModel::setShowWeatherWidget, viewModel::setShowClockWidget, viewModel::setShowFootballWidget, viewModel::setWeatherMode, viewModel::setManualWeatherEffect, viewModel::setWeatherCityOverride, viewModel::setFootballMaxMatches, viewModel::refreshWidgets, viewModel::refreshServer, viewModel::testServerConnection, viewModel::clearWatchHistory, viewModel::clearEpgCache, viewModel::unlockSettings, viewModel::lockSettings, viewModel::setParentalPin, viewModel::changeParentalPin, viewModel::removeParentalPin, viewModel::logoutActiveServer, viewModel::activateServer, viewModel::deleteServer)
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
                            )
                        }
                        if (state.showExitDialog) {
                            ExitDialog(onDismiss = { viewModel.setExitDialog(false) }, onExit = finishApp)
                        }
                        if (state.subscriptionExpired) {
                            SubscriptionExpiredDialog(
                                onNewSignIn = viewModel::startNewSubscriptionSignIn,
                                onDismiss = viewModel::dismissSubscriptionExpired,
                            )
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
                        state.error?.let { error ->
                            ErrorOverlay(message = error)
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
                text = "Saved library stays playable while this smart refresh runs.",
                color = Color(0xB8E3BC78),
                style = MaterialTheme.typography.labelSmall,
            )
            if (progress.total > 0) {
                Text(
                    text = "${progress.loaded} / ${progress.total}",
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
                    text = "Caching the server on this device for faster startup and smooth browsing.",
                    color = Color(0xB8E3BC78),
                    style = MaterialTheme.typography.bodyMedium,
                )
                if (progress.total > 0) {
                    Text(
                        text = "${progress.loaded} / ${progress.total}",
                        color = Color(0xCCE3BC78),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
        }
    }
}

@Composable
private fun ErrorOverlay(message: String) {
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
            modifier = Modifier.widthIn(min = 360.dp, max = 560.dp),
            radius = 28.dp,
            highlighted = true,
            glow = Color(0x66FF6B6B),
            contentAlignment = Alignment.Center,
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 34.dp, vertical = 30.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    text = androidx.compose.ui.res.stringResource(com.moalfarras.moplayerpro.R.string.sync_error_title),
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = message,
                    color = Color(0xFFFFB4AB),
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
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
                .clickable(onClick = onDismiss),
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
