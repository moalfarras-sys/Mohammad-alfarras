package com.moalfarras.moplayer

import android.os.Bundle
import android.content.Intent
import android.content.pm.ActivityInfo
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
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
import com.moalfarras.moplayer.domain.model.AccentMode
import com.moalfarras.moplayer.domain.model.LoadProgress
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.ui.AppSection
import com.moalfarras.moplayer.ui.MainViewModel
import com.moalfarras.moplayer.ui.components.BottomDock
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.player.PlayerScreen
import com.moalfarras.moplayer.ui.screens.ExitDialog
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
import com.moalfarras.moplayer.ui.theme.rememberDynamicAccent
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import androidx.paging.compose.LazyPagingItems

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels {
        val graph = AppGraph.get(applicationContext)
        MainViewModel.Factory(graph.iptvRepository, graph.settingsRepository, graph.widgetRepository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
        super.onCreate(savedInstanceState)
        setContent { MoPlayerApp(viewModel = viewModel, finishApp = ::finish) }
        handleIncomingPlaylist(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingPlaylist(intent)
    }

    private fun handleIncomingPlaylist(intent: Intent?) {
        val url = intent?.dataString?.takeIf { it.startsWith("http://") || it.startsWith("https://") } ?: return
        viewModel.loginM3u("Imported IPTV", url)
    }
}

private fun LazyPagingItems<MediaItem>.snapshotItems(): List<MediaItem> =
    itemSnapshotList.items

@Composable
private fun MoPlayerApp(viewModel: MainViewModel, finishApp: () -> Unit) {
    val state by viewModel.uiState.collectAsState()
    val weather by viewModel.weather.collectAsState()
    val football by viewModel.football.collectAsState()
    val liveZapItems by viewModel.liveZapItems.collectAsState()
    val liveCategories by viewModel.liveCategories.collectAsState()
    val movieCategories by viewModel.movieCategories.collectAsState()
    val seriesCategories by viewModel.seriesCategories.collectAsState()
    val media = viewModel.selectedMedia.collectAsLazyPagingItems()
    val latestLive = viewModel.latestLive.collectAsLazyPagingItems()
    val latestMovies = viewModel.latestMovies.collectAsLazyPagingItems()
    val latestSeries = viewModel.latestSeries.collectAsLazyPagingItems()
    val continueWatching = viewModel.continueWatching.collectAsLazyPagingItems()
    val favorites = viewModel.favorites.collectAsLazyPagingItems()
    val recentLive = viewModel.recentLive.collectAsLazyPagingItems()
    val searchResults = viewModel.searchResults.collectAsLazyPagingItems()
    val seriesEpisodes by viewModel.seriesEpisodes.collectAsState(initial = emptyList())
    val focusedLiveEpg by viewModel.focusedLiveEpg.collectAsState()
    val dynamicAccent = rememberDynamicAccent(state.playingItem ?: state.focusedItem)
    val accent = if (state.settings.accentMode == AccentMode.CUSTOM) Color(state.settings.accentColor) else dynamicAccent
    val tv = rememberTvScale()
    var lastBackAt = remember { mutableLongStateOf(0L) }

    fun requestBack() {
        val now = System.currentTimeMillis()
        if (state.activeServer == null) {
            viewModel.setExitDialog(true)
        } else if (state.section != AppSection.HOME) {
            viewModel.navigateBack()
        } else if (now - lastBackAt.longValue < 1500) {
            viewModel.setExitDialog(true)
        } else {
            viewModel.showNotice("\u0627\u0636\u063a\u0637 \u0631\u062c\u0648\u0639 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649 \u0644\u0644\u062e\u0631\u0648\u062c")
        }
        lastBackAt.longValue = now
    }

    MoTheme(accent = accent) {
        BackHandler(enabled = state.section != AppSection.PLAYER) {
            requestBack()
        }
        when {
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
                val relatedItems = when (state.returnSection) {
                    AppSection.LIVE -> liveZapItems.ifEmpty { media.snapshotItems().filter { it.type == playing.type } }
                    AppSection.SERIES_DETAIL -> seriesEpisodes.filter { it.type == playing.type }
                    AppSection.MOVIES, AppSection.SERIES -> media.snapshotItems().filter { it.type == playing.type }
                    AppSection.FAVORITES -> favorites.snapshotItems().filter { it.type == playing.type }
                    AppSection.SEARCH -> searchResults.snapshotItems().filter { it.type == playing.type }
                    else -> emptyList()
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
                            AppSection.HOME -> HomeScreen(weather, football, continueWatching.snapshotItems(), recentLive.snapshotItems(), latestLive.snapshotItems(), latestMovies.snapshotItems(), latestSeries.snapshotItems(), state.settings, if (state.dockFocusSection == null) state.focusedItem else null, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite, accent)
                            AppSection.LIVE -> LiveScreen(liveCategories, viewModel.selectedMedia, state.focusedItem, focusedLiveEpg, state.selectedCategoryId, state.settings.previewEnabled, viewModel::selectCategory, viewModel::clearCategory, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite)
                            AppSection.MOVIES -> PosterScreen(androidx.compose.ui.res.stringResource(com.moalfarras.moplayerpro.R.string.nav_movies), movieCategories, viewModel.selectedMedia, state.focusedItem, state.selectedCategoryId, state.settings.previewEnabled, viewModel::selectCategory, viewModel::clearCategory, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite)
                            AppSection.SERIES -> PosterScreen(androidx.compose.ui.res.stringResource(com.moalfarras.moplayerpro.R.string.nav_series), seriesCategories, viewModel.selectedMedia, state.focusedItem, state.selectedCategoryId, state.settings.previewEnabled, viewModel::selectCategory, viewModel::clearCategory, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite)
                            AppSection.FAVORITES -> FavoritesScreen(viewModel.favorites, state.focusedItem, state.settings.previewEnabled, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite)
                            AppSection.SERIES_DETAIL -> {
                                val series = state.seriesDetail
                                if (series != null) {
                                    SeriesDetailsScreen(
                                        series = series,
                                        episodes = seriesEpisodes,
                                        onFocus = viewModel::focusItem,
                                        onPlay = viewModel::play,
                                        onFavorite = viewModel::toggleFavorite,
                                    )
                                } else {
                                    LaunchedEffect(Unit) { viewModel.navigateBack() }
                                }
                            }
                            AppSection.SEARCH -> SearchScreen(state.searchQuery, state.settings.searchHistory, viewModel.searchResults, viewModel::setSearch, viewModel::clearSearchHistory, viewModel::focusItem, viewModel::play, viewModel::toggleFavorite)
                            AppSection.SETTINGS -> SettingsScreen(state.settings, state.settingsUnlocked, state.activeServer, state.servers, viewModel::setPreviewEnabled, viewModel::setParentalEnabled, viewModel::setAutoPlayLastLive, viewModel::setHideEmptyCategories, viewModel::setHideChannelsWithoutLogo, viewModel::setPreferredPlayer, viewModel::setLibraryMode, viewModel::setDefaultSort, viewModel::setAccentMode, viewModel::setAccentColor, viewModel::setBackgroundMode, viewModel::setCustomBackgroundUrl, viewModel::setThemePreset, viewModel::setMotionLevel, viewModel::setShowWeatherWidget, viewModel::setShowClockWidget, viewModel::setShowFootballWidget, viewModel::setWeatherMode, viewModel::setManualWeatherEffect, viewModel::setWeatherCityOverride, viewModel::setFootballMaxMatches, viewModel::refreshWidgets, viewModel::refreshServer, viewModel::testServerConnection, viewModel::clearWatchHistory, viewModel::clearEpgCache, viewModel::unlockSettings, viewModel::lockSettings, viewModel::setParentalPin, viewModel::changeParentalPin, viewModel::removeParentalPin, viewModel::logoutActiveServer, viewModel::activateServer, viewModel::deleteServer)
                            AppSection.PLAYER -> Unit
                        }
                        androidx.compose.animation.AnimatedVisibility(
                            visible = state.activeServer != null && state.section == AppSection.HOME,
                            modifier = Modifier.align(Alignment.BottomCenter),
                            enter = androidx.compose.animation.slideInVertically(initialOffsetY = { it }) + androidx.compose.animation.fadeIn(),
                            exit = androidx.compose.animation.slideOutVertically(targetOffsetY = { it }) + androidx.compose.animation.fadeOut(),
                        ) {
                            BottomDock(
                                selected = state.section,
                                restoreFocusSection = state.dockFocusSection,
                                onSelect = viewModel::select,
                                onSearch = { viewModel.select(AppSection.SEARCH) },
                                modifier = Modifier.padding(bottom = if (tv.isCompact) 10.dp else 18.dp),
                            )
                        }
                        if (state.showExitDialog) {
                            ExitDialog(onDismiss = { viewModel.setExitDialog(false) }, onExit = finishApp)
                        }
                        state.loading?.let { progress ->
                            SyncOverlay(progress = progress)
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
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0x44080604), Color(0x77050403)),
                ),
            )
            .onPreviewKeyEvent { false },
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
