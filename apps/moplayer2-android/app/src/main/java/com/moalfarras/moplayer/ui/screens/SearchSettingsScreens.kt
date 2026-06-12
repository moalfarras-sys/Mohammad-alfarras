package com.moalfarras.moplayer.ui.screens

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.speech.RecognizerIntent
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Image
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.paging.PagingData
import androidx.paging.compose.collectAsLazyPagingItems
import androidx.paging.compose.itemContentType
import androidx.paging.compose.itemKey
import com.moalfarras.moplayerpro.BuildConfig
import com.moalfarras.moplayer.data.repository.AppUpdateInfo
import com.moalfarras.moplayer.data.repository.UpdateInstallResult
import com.moalfarras.moplayer.data.repository.UpdateRepository
import com.moalfarras.moplayer.core.DevicePerformanceInfo
import com.moalfarras.moplayer.core.DevicePerformanceTier
import com.moalfarras.moplayer.core.PerformancePolicy
import com.moalfarras.moplayer.domain.model.AccentMode
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.LibraryMode
import com.moalfarras.moplayer.domain.model.LoginKind
import com.moalfarras.moplayer.domain.model.ManualWeatherEffect
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.MotionLevel
import com.moalfarras.moplayer.domain.model.PerformanceMode
import com.moalfarras.moplayer.domain.model.ServerProfile
import com.moalfarras.moplayer.domain.model.SortOption
import com.moalfarras.moplayer.domain.model.ThemePreset
import com.moalfarras.moplayer.domain.model.WeatherMode
import com.moalfarras.moplayer.ui.components.ChannelRow
import com.moalfarras.moplayer.ui.components.FocusGlow
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.MoAccentPresets
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch

@Composable
fun SearchScreen(
    query: String,
    history: List<String>,
    resultsFlow: Flow<PagingData<MediaItem>>,
    restoreFocusItem: MediaItem?,
    onQuery: (String) -> Unit,
    onClearHistory: () -> Unit,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val s = LocalStrings.current
    val results = resultsFlow.collectAsLazyPagingItems()
    val resultsState = rememberLazyListState()
    val searchFocusRequester = remember { FocusRequester() }
    var restoredResultOnce by remember(restoreFocusItem?.id, restoreFocusItem?.type, restoreFocusItem?.serverId, query) { mutableStateOf(false) }
    val restoreIndex = remember(results.itemCount, restoreFocusItem) {
        restoreFocusItem?.let { target -> (0 until results.itemCount).firstOrNull { results.peek(it).sameMedia(target) } }
    }
    LaunchedEffect(restoreIndex, query) {
        if (restoreIndex != null && !restoredResultOnce) {
            resultsState.scrollToItem(restoreIndex)
            restoredResultOnce = true
        } else if (query.isBlank()) {
            kotlinx.coroutines.delay(120)
            runCatching { searchFocusRequester.requestFocus() }
        }
    }

    val voiceLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val spokenText = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.firstOrNull()
            if (!spokenText.isNullOrBlank()) onQuery(spokenText)
        }
    }

    val searchHeroHeight = when {
        tv.isTv -> 220.dp
        tv.isLowHeightLandscape -> 96.dp
        tv.isCompact -> 140.dp
        else -> 180.dp
    }

    Box(Modifier.fillMaxSize()) {
        // Warm atmospheric gradient instead of CinematicBackdrop(null)
        Box(
            Modifier.fillMaxSize().background(
                Brush.verticalGradient(
                    colorStops = arrayOf(
                        0.0f to Color(0xFF0E0A07),
                        0.3f to Color(0xFF140F0B),
                        1.0f to Color(0xFF0A0908),
                    ),
                ),
            ),
        )
        Box(
            Modifier
                .fillMaxWidth()
                .height(searchHeroHeight)
                .background(Brush.verticalGradient(listOf(visuals.accent.copy(alpha = 0.12f), Color.Transparent)))
        )

        Column(
            Modifier
                .fillMaxSize()
                .padding(
                    tv.contentPadding,
                    tv.contentPadding * 0.8f,
                    tv.contentPadding,
                    if (tv.isTv) tv.bottomBarHeight + tv.contentPadding else tv.bottomBarHeight + 8.dp,
                ),
            verticalArrangement = Arrangement.spacedBy((18 * tv.factor).dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Icon(
                    Icons.Rounded.Search,
                    null,
                    tint = visuals.accent,
                    modifier = Modifier.size(((if (tv.isLowHeightLandscape) 22f else 32f) * tv.factor).dp),
                )
                Text(
                    s.navSearch,
                    color = Color.White,
                    style = if (tv.isLowHeightLandscape) MaterialTheme.typography.headlineMedium else MaterialTheme.typography.displayMedium,
                )
            }

            GlassPanel(radius = (16 * tv.factor).dp, blur = 12.dp) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(end = (8 * tv.factor).dp)) {
                    OutlinedTextField(
                        value = query,
                        onValueChange = onQuery,
                        placeholder = { Text("Search channels, movies, series, episodes...") },
                        singleLine = true,
                        modifier = Modifier.weight(1f).focusRequester(searchFocusRequester),
                        leadingIcon = { Icon(Icons.Rounded.Search, null, tint = visuals.accent) },
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color.Transparent,
                            unfocusedContainerColor = Color.Transparent,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                        ),
                    )
                    IconButton(
                        onClick = {
                            try {
                                voiceLauncher.launch(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                                    putExtra(RecognizerIntent.EXTRA_PROMPT, "Say what you want to search for")
                                })
                            } catch (_: Exception) {
                            }
                        }
                    ) {
                        Icon(Icons.Rounded.Mic, "Voice search", tint = visuals.accent, modifier = Modifier.size((28 * tv.factor).dp))
                    }
                }
            }

            if (query.isBlank() && history.isNotEmpty()) {
                GlassPanel(radius = (16 * tv.factor).dp) {
                    Column(
                        Modifier.fillMaxWidth().padding((20 * tv.factor).dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Rounded.History, null, tint = visuals.accent)
                                Text("Recent searches", color = Color.White, style = MaterialTheme.typography.titleMedium)
                            }
                            FocusGlow(cornerRadius = 999.dp, onClick = onClearHistory) {
                                Text(
                                    "Clear",
                                    color = visuals.accent,
                                    style = MaterialTheme.typography.labelLarge,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                                )
                            }
                        }
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.focusGroup(),
                        ) {
                            history.take(6).forEach { entry ->
                                FocusGlow(cornerRadius = 10.dp, onClick = { onQuery(entry) }) {
                                    GlassPanel(radius = 10.dp) {
                                        Text(
                                            entry,
                                            color = Color.White,
                                            style = MaterialTheme.typography.labelLarge,
                                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (query.isBlank() && history.isEmpty()) {
                GlassPanel(radius = (18 * tv.factor).dp, highlighted = true, glow = visuals.accent.copy(alpha = 0.10f)) {
                    Column(
                        Modifier.fillMaxWidth().padding((28 * tv.factor).dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
                    ) {
                        Icon(Icons.Rounded.TravelExplore, null, tint = visuals.accent, modifier = Modifier.size((46 * tv.factor).dp))
                        Text("Search your whole library", color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
                        Text(
                            "Type or use voice search to find live channels, movies, series, and episodes.",
                            color = Color(0xB8E3BC78),
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center,
                        )
                    }
                }
            }

            if (query.isNotBlank() && results.itemCount == 0) {
                GlassPanel(radius = (16 * tv.factor).dp) {
                    Column(
                        Modifier.fillMaxWidth().padding((24 * tv.factor).dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Icon(Icons.Rounded.SearchOff, null, tint = Color(0x66FFFFFF), modifier = Modifier.size((48 * tv.factor).dp))
                        Text("No results for \"$query\"", color = Color(0x99FFFFFF), style = MaterialTheme.typography.titleMedium)
                    }
                }
            }

            LazyColumn(
                state = resultsState,
                verticalArrangement = Arrangement.spacedBy((8 * tv.factor).dp),
                modifier = Modifier.focusGroup(),
            ) {
                items(
                    count = results.itemCount,
                    key = results.itemKey { "${it.type}-${it.serverId}-${it.id}" },
                    contentType = results.itemContentType { it.type },
                ) { index ->
                    results[index]?.let { item ->
                        val focusRequester = remember(item.id, item.type, item.serverId) { FocusRequester() }
                        val shouldRestore = item.sameMedia(restoreFocusItem)
                        LaunchedEffect(shouldRestore, restoreIndex, restoredResultOnce) {
                            if (shouldRestore && restoreIndex != null && restoredResultOnce) {
                                kotlinx.coroutines.delay(120)
                                runCatching { focusRequester.requestFocus() }
                            }
                        }
                        ChannelRow(item, onFocus, onPlay, onFavorite, focusRequester = focusRequester)
                    }
                }
            }
        }
    }
}

private fun MediaItem?.sameMedia(other: MediaItem?): Boolean =
    this != null &&
        other != null &&
        id == other.id &&
        type == other.type &&
        serverId == other.serverId

@Composable
fun SettingsScreen(
    settings: AppSettings,
    performancePolicy: PerformancePolicy,
    devicePerformanceInfo: DevicePerformanceInfo,
    settingsUnlocked: Boolean,
    activeServer: ServerProfile?,
    servers: List<ServerProfile>,
    onPreview: (Boolean) -> Unit,
    onParental: (Boolean) -> Unit,
    onAutoPlayLastLive: (Boolean) -> Unit,
    onHideEmptyCategories: (Boolean) -> Unit,
    onHideChannelsWithoutLogo: (Boolean) -> Unit,
    onPlayer: (String) -> Unit,
    onLibraryMode: (LibraryMode) -> Unit,
    onLanguage: (String) -> Unit,
    onSort: (SortOption) -> Unit,
    onAccentMode: (AccentMode) -> Unit,
    onAccentColor: (Long) -> Unit,
    onBackgroundMode: (BackgroundMode) -> Unit,
    onCustomBackgroundUrl: (String) -> Unit,
    onThemePreset: (ThemePreset) -> Unit,
    onMotionLevel: (MotionLevel) -> Unit,
    onPerformanceMode: (PerformanceMode) -> Unit,
    onShowWeatherWidget: (Boolean) -> Unit,
    onShowClockWidget: (Boolean) -> Unit,
    onShowFootballWidget: (Boolean) -> Unit,
    onWeatherMode: (WeatherMode) -> Unit,
    onManualWeatherEffect: (ManualWeatherEffect) -> Unit,
    onWeatherCityOverride: (String) -> Unit,
    onFootballMaxMatches: (Int) -> Unit,
    onRefreshWidgets: () -> Unit,
    onRefresh: () -> Unit,
    onTestConnection: () -> Unit,
    onClearWatchHistory: () -> Unit,
    onClearEpgCache: () -> Unit,
    onUnlockSettings: (String) -> Unit,
    onLockSettings: () -> Unit,
    onSetParentalPin: (String) -> Unit,
    onChangeParentalPin: (String, String) -> Unit,
    onRemoveParentalPin: (String) -> Unit,
    onLogout: () -> Unit,
    onActivateServer: (Long) -> Unit,
    onDeleteServer: (Long) -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current

    val contentModifier = Modifier
        .fillMaxSize()
        .padding(tv.contentPadding, tv.contentPadding, tv.contentPadding, if (tv.isTv) tv.bottomBarHeight + tv.contentPadding else tv.bottomBarHeight)

    val settingsHeroHeight = when {
        tv.isTv -> 240.dp
        tv.isLowHeightLandscape -> 100.dp
        tv.isCompact -> 160.dp
        else -> 200.dp
    }
    Box(Modifier.fillMaxSize()) {
        // Warm atmospheric gradient for settings
        Box(
            Modifier.fillMaxSize().background(
                Brush.verticalGradient(
                    colorStops = arrayOf(
                        0.0f to Color(0xFF0E0A07),
                        0.3f to Color(0xFF140F0B),
                        1.0f to Color(0xFF0A0908),
                    ),
                ),
            ),
        )
        Box(
            Modifier
                .fillMaxWidth()
                .height(settingsHeroHeight)
                .background(Brush.verticalGradient(listOf(visuals.accent.copy(alpha = 0.10f), Color.Transparent)))
        )

        if (!tv.isTv) {
            LazyColumn(contentModifier, verticalArrangement = Arrangement.spacedBy(14.dp)) {
                item { SettingsHeader() }
                if (!settings.hasParentalPin || settingsUnlocked) {
                    item { LibraryModeCard(settings.libraryMode, isTv = false, onLibraryMode = onLibraryMode) }
                    item {
                        AppearanceSettingsCard(
                            settings = settings,
                            isTv = false,
                            onLanguage = onLanguage,
                            onAccentMode = onAccentMode,
                            onAccentColor = onAccentColor,
                            onBackgroundMode = onBackgroundMode,
                            onCustomBackgroundUrl = onCustomBackgroundUrl,
                            onThemePreset = onThemePreset,
                            onMotionLevel = onMotionLevel,
                            performancePolicy = performancePolicy,
                            devicePerformanceInfo = devicePerformanceInfo,
                            onPerformanceMode = onPerformanceMode,
                            onShowWeatherWidget = onShowWeatherWidget,
                            onShowClockWidget = onShowClockWidget,
                            onShowFootballWidget = onShowFootballWidget,
                            onWeatherMode = onWeatherMode,
                            onManualWeatherEffect = onManualWeatherEffect,
                            onWeatherCityOverride = onWeatherCityOverride,
                            onFootballMaxMatches = onFootballMaxMatches,
                            onRefreshWidgets = onRefreshWidgets,
                        )
                    }
                    item {
                        PlayerSettingsCard(
                            settings = settings,
                            onPreview = onPreview,
                            onParental = onParental,
                            onAutoPlayLastLive = onAutoPlayLastLive,
                            onHideEmptyCategories = onHideEmptyCategories,
                            onHideChannelsWithoutLogo = onHideChannelsWithoutLogo,
                            onPlayer = onPlayer,
                        )
                    }
                    item { SortOptionRow(settings.defaultSort, compact = true, onSort = onSort) }
                    item {
                        PinSettingsCard(
                            hasPin = settings.hasParentalPin,
                            onLock = onLockSettings,
                            onSetPin = onSetParentalPin,
                            onChangePin = onChangeParentalPin,
                            onRemovePin = onRemoveParentalPin,
                        )
                    }
                    item { AboutCard(isTv = false) }
                } else {
                    item { LockedSettingsCard(onUnlock = onUnlockSettings) }
                }
                activeServer?.let { server ->
                    item {
                        ActiveServerCard(server, isTv = false, onRefresh, onTestConnection, onClearWatchHistory, onClearEpgCache, onLogout)
                    }
                }
                item { ServerList(servers, activeServer?.id, onActivateServer, onDeleteServer) }
            }
        } else {
            TvSettingsLayout(
                modifier = contentModifier,
                settings = settings,
                settingsUnlocked = settingsUnlocked,
                activeServer = activeServer,
                servers = servers,
                onPreview = onPreview,
                onParental = onParental,
                onAutoPlayLastLive = onAutoPlayLastLive,
                onHideEmptyCategories = onHideEmptyCategories,
                onHideChannelsWithoutLogo = onHideChannelsWithoutLogo,
                onPlayer = onPlayer,
                onLibraryMode = onLibraryMode,
                onLanguage = onLanguage,
                onSort = onSort,
                onAccentMode = onAccentMode,
                onAccentColor = onAccentColor,
                onBackgroundMode = onBackgroundMode,
                onCustomBackgroundUrl = onCustomBackgroundUrl,
                onThemePreset = onThemePreset,
                onMotionLevel = onMotionLevel,
                            performancePolicy = performancePolicy,
                            devicePerformanceInfo = devicePerformanceInfo,
                            onPerformanceMode = onPerformanceMode,
                onShowWeatherWidget = onShowWeatherWidget,
                onShowClockWidget = onShowClockWidget,
                onShowFootballWidget = onShowFootballWidget,
                onWeatherMode = onWeatherMode,
                onManualWeatherEffect = onManualWeatherEffect,
                onWeatherCityOverride = onWeatherCityOverride,
                onFootballMaxMatches = onFootballMaxMatches,
                onRefreshWidgets = onRefreshWidgets,
                onRefresh = onRefresh,
                onTestConnection = onTestConnection,
                onClearWatchHistory = onClearWatchHistory,
                onClearEpgCache = onClearEpgCache,
                onUnlockSettings = onUnlockSettings,
                onLockSettings = onLockSettings,
                onSetParentalPin = onSetParentalPin,
                onChangeParentalPin = onChangeParentalPin,
                onRemoveParentalPin = onRemoveParentalPin,
                onLogout = onLogout,
                onActivateServer = onActivateServer,
                onDeleteServer = onDeleteServer,
            )
        }
    }
}

@Composable
private fun TvSettingsLayout(
    modifier: Modifier,
    settings: AppSettings,
    settingsUnlocked: Boolean,
    activeServer: ServerProfile?,
    servers: List<ServerProfile>,
    onPreview: (Boolean) -> Unit,
    onParental: (Boolean) -> Unit,
    onAutoPlayLastLive: (Boolean) -> Unit,
    onHideEmptyCategories: (Boolean) -> Unit,
    onHideChannelsWithoutLogo: (Boolean) -> Unit,
    onPlayer: (String) -> Unit,
    onLibraryMode: (LibraryMode) -> Unit,
    onLanguage: (String) -> Unit,
    onSort: (SortOption) -> Unit,
    onAccentMode: (AccentMode) -> Unit,
    onAccentColor: (Long) -> Unit,
    onBackgroundMode: (BackgroundMode) -> Unit,
    onCustomBackgroundUrl: (String) -> Unit,
    onThemePreset: (ThemePreset) -> Unit,
    onMotionLevel: (MotionLevel) -> Unit,
    performancePolicy: PerformancePolicy,
    devicePerformanceInfo: DevicePerformanceInfo,
    onPerformanceMode: (PerformanceMode) -> Unit,
    onShowWeatherWidget: (Boolean) -> Unit,
    onShowClockWidget: (Boolean) -> Unit,
    onShowFootballWidget: (Boolean) -> Unit,
    onWeatherMode: (WeatherMode) -> Unit,
    onManualWeatherEffect: (ManualWeatherEffect) -> Unit,
    onWeatherCityOverride: (String) -> Unit,
    onFootballMaxMatches: (Int) -> Unit,
    onRefreshWidgets: () -> Unit,
    onRefresh: () -> Unit,
    onTestConnection: () -> Unit,
    onClearWatchHistory: () -> Unit,
    onClearEpgCache: () -> Unit,
    onUnlockSettings: (String) -> Unit,
    onLockSettings: () -> Unit,
    onSetParentalPin: (String) -> Unit,
    onChangeParentalPin: (String, String) -> Unit,
    onRemoveParentalPin: (String) -> Unit,
    onLogout: () -> Unit,
    onActivateServer: (Long) -> Unit,
    onDeleteServer: (Long) -> Unit,
) {
    val tv = rememberTvScale()
    var selectedPane by rememberSaveable { mutableIntStateOf(0) }
    val unlocked = !settings.hasParentalPin || settingsUnlocked
    val firstPaneFocus = remember { FocusRequester() }
    val paneListState = rememberLazyListState()
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(120)
        runCatching { firstPaneFocus.requestFocus() }
    }
    LaunchedEffect(selectedPane, unlocked) {
        paneListState.scrollToItem(0)
    }
    Row(modifier.focusGroup(), horizontalArrangement = Arrangement.spacedBy((24 * tv.factor).dp)) {
        Column(
            modifier = Modifier.fillMaxHeight().weight(0.24f).padding(top = (12 * tv.factor).dp).focusGroup(),
            verticalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
        ) {
            SettingsHeader()
            Spacer(Modifier.height((16 * tv.factor).dp))
            SettingsPaneButton("Look & Home", Icons.Rounded.Palette, selectedPane == 0, focusRequester = firstPaneFocus) { selectedPane = 0 }
            SettingsPaneButton("Playback", Icons.Rounded.Tv, selectedPane == 1) { selectedPane = 1 }
            SettingsPaneButton("Live TV", Icons.Rounded.LiveTv, selectedPane == 2) { selectedPane = 2 }
            SettingsPaneButton("Accounts", Icons.Rounded.AccountCircle, selectedPane == 3) { selectedPane = 3 }
            SettingsPaneButton("Storage", Icons.Rounded.DeleteSweep, selectedPane == 4) { selectedPane = 4 }
            SettingsPaneButton("Family lock", Icons.Rounded.Lock, selectedPane == 5) { selectedPane = 5 }
            Spacer(Modifier.weight(1f))
            SettingsPaneButton("About", Icons.Rounded.Info, selectedPane == 6) { selectedPane = 6 }
        }

        GlassPanel(
            modifier = Modifier.fillMaxHeight().weight(0.76f),
            radius = tv.cardRadius,
            blur = 24.dp,
        ) {
            LazyColumn(
                state = paneListState,
                modifier = Modifier.fillMaxSize().padding((32 * tv.factor).dp).focusGroup(),
                verticalArrangement = Arrangement.spacedBy((16 * tv.factor).dp),
            ) {
                if (!unlocked) {
                    item { LockedSettingsCard(isTv = true, onUnlock = onUnlockSettings) }
                } else {
                    item { SettingsPaneHero(selectedPane, activeServer, settings, performancePolicy) }
                    when (selectedPane) {
                        0 -> item {
                            AppearanceSettingsCard(
                                settings = settings,
                                isTv = true,
                                onLanguage = onLanguage,
                                onAccentMode = onAccentMode,
                                onAccentColor = onAccentColor,
                                onBackgroundMode = onBackgroundMode,
                                onCustomBackgroundUrl = onCustomBackgroundUrl,
                                onThemePreset = onThemePreset,
                                onMotionLevel = onMotionLevel,
                                performancePolicy = performancePolicy,
                                devicePerformanceInfo = devicePerformanceInfo,
                                onPerformanceMode = onPerformanceMode,
                                onShowWeatherWidget = onShowWeatherWidget,
                                onShowClockWidget = onShowClockWidget,
                                onShowFootballWidget = onShowFootballWidget,
                                onWeatherMode = onWeatherMode,
                                onManualWeatherEffect = onManualWeatherEffect,
                                onWeatherCityOverride = onWeatherCityOverride,
                                onFootballMaxMatches = onFootballMaxMatches,
                                onRefreshWidgets = onRefreshWidgets,
                            )
                        }
                        1 -> {
                            item { LibraryModeCard(settings.libraryMode, isTv = true, onLibraryMode = onLibraryMode) }
                            item {
                                PlayerSettingsCard(settings, isTv = true, onPreview, onParental, onAutoPlayLastLive, onHideEmptyCategories, onHideChannelsWithoutLogo, onPlayer)
                            }
                            item { SortOptionRow(settings.defaultSort, compact = false, onSort = onSort) }
                        }
                        2 -> {
                            item {
                                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                    SectionHeader("Live TV settings")
                                    SettingSwitch("Channel preview", settings.previewEnabled, Icons.Rounded.Visibility, onPreview)
                                    SettingSwitch("Auto-play last live channel", settings.autoPlayLastLive, Icons.Rounded.PlayArrow, onAutoPlayLastLive)
                                    SettingSwitch("Hide empty categories", settings.hideEmptyCategories, Icons.Rounded.FolderOff, onHideEmptyCategories)
                                    SettingSwitch("Hide channels without logo", settings.hideChannelsWithoutLogo, Icons.Rounded.ImageNotSupported, onHideChannelsWithoutLogo)
                                }
                            }
                        }
                        3 -> {
                            activeServer?.let { server ->
                                item { ActiveServerCard(server, isTv = true, onRefresh, onTestConnection, onClearWatchHistory, onClearEpgCache, onLogout) }
                            }
                            item { ServerList(servers, activeServer?.id, onActivateServer, onDeleteServer) }
                        }
                        4 -> {
                            item {
                                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    SectionHeader("Storage management")
                                    activeServer?.let {
                                        SettingsActionCard(
                                            icon = Icons.Rounded.DeleteSweep,
                                            title = "Clear watch history",
                                            message = "Remove local continue-watching positions. Your account and playlists stay saved.",
                                            onClick = onClearWatchHistory,
                                        )
                                        SettingsActionCard(
                                            icon = Icons.Rounded.Tv,
                                            title = "Clear EPG cache",
                                            message = "Refresh guide data when channels show old or missing program info.",
                                            onClick = onClearEpgCache,
                                        )
                                    } ?: run {
                        EmptySettingsMessage(
                            icon = Icons.Rounded.Storage,
                            title = "Nothing to clean yet",
                            message = "Add or activate an account first. Local cache controls will appear here.",
                        )
                                    }
                                }
                            }
                        }
                        5 -> item {
                            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                SectionHeader("Content filter")
                                SettingSwitch("Parental control filter", settings.parentalControlsEnabled, Icons.Rounded.Lock, onParental)
                                PinSettingsCard(settings.hasParentalPin, isTv = true, onLockSettings, onSetParentalPin, onChangeParentalPin, onRemoveParentalPin)
                            }
                        }
                        6 -> item { AboutCard(isTv = true) }
                    }
                }
            }
        }
    }
}

@Composable
private fun SettingsPaneHero(
    selectedPane: Int,
    activeServer: ServerProfile?,
    settings: AppSettings,
    performancePolicy: PerformancePolicy,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val (icon, title, subtitle) = when (selectedPane) {
        0 -> Triple(Icons.Rounded.Palette, "Look & Home", "Backgrounds, colors, widgets, and TV performance.")
        1 -> Triple(Icons.Rounded.PlayCircle, "Playback", "Player choice, sorting, updates, and smooth display behavior.")
        2 -> Triple(Icons.Rounded.LiveTv, "Live TV", "Channel previews, auto-play, and cleaner live categories.")
        3 -> Triple(Icons.Rounded.AccountCircle, "Accounts", activeServer?.let { "${it.name} is active" } ?: "Connect or switch saved accounts.")
        4 -> Triple(Icons.Rounded.Storage, "Storage", "Clear local history and EPG cache without touching your account.")
        5 -> Triple(Icons.Rounded.Lock, "Family lock", if (settings.hasParentalPin) "PIN protection is enabled." else "Create a PIN to protect settings and content filters.")
        else -> Triple(Icons.Rounded.Info, "About", "Version, support, and product information.")
    }
    GlassPanel(
        modifier = Modifier.fillMaxWidth(),
        radius = (22 * tv.factor).dp,
        blur = 18.dp,
        highlighted = true,
        glow = visuals.accent.copy(alpha = 0.13f),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = (20 * tv.factor).dp, vertical = (16 * tv.factor).dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy((16 * tv.factor).dp),
        ) {
            Box(
                Modifier
                    .size((50 * tv.factor).dp)
                    .clip(RoundedCornerShape((16 * tv.factor).dp))
                    .background(visuals.accent.copy(alpha = 0.16f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, null, tint = visuals.accent, modifier = Modifier.size((26 * tv.factor).dp))
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(title, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = (23 * tv.factor).sp)
                Text(subtitle, color = Color(0xCCFFFFFF), fontSize = (13 * tv.factor).sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Surface(
                shape = RoundedCornerShape(999.dp),
                color = visuals.accent.copy(alpha = 0.14f),
            ) {
                Text(
                    performancePolicy.mode.label(),
                    color = visuals.accent,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = (12 * tv.factor).sp,
                    modifier = Modifier.padding(horizontal = (12 * tv.factor).dp, vertical = (7 * tv.factor).dp),
                )
            }
        }
    }
}

@Composable
private fun SettingsActionCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    message: String,
    onClick: () -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    FocusGlow(
        modifier = Modifier.fillMaxWidth().height((86 * tv.factor).dp),
        cornerRadius = (18 * tv.factor).dp,
        onClick = onClick,
    ) {
        GlassPanel(radius = (18 * tv.factor).dp, highlighted = true, glow = visuals.accent.copy(alpha = 0.08f)) {
            Row(
                Modifier
                    .fillMaxSize()
                    .padding(horizontal = (18 * tv.factor).dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy((14 * tv.factor).dp),
            ) {
                Box(
                    Modifier
                        .size((44 * tv.factor).dp)
                        .clip(RoundedCornerShape((14 * tv.factor).dp))
                        .background(visuals.accent.copy(alpha = 0.16f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(icon, null, tint = visuals.accent, modifier = Modifier.size((24 * tv.factor).dp))
                }
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(title, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = (16 * tv.factor).sp)
                    Text(message, color = Color(0xB8FFFFFF), fontSize = (12 * tv.factor).sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
                Icon(Icons.Rounded.ChevronRight, null, tint = Color(0x99FFFFFF), modifier = Modifier.size((24 * tv.factor).dp))
            }
        }
    }
}

@Composable
private fun EmptySettingsMessage(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    message: String,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    GlassPanel(radius = (18 * tv.factor).dp, highlighted = true, glow = visuals.accent.copy(alpha = 0.08f)) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding((18 * tv.factor).dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy((14 * tv.factor).dp),
        ) {
            Icon(icon, null, tint = visuals.accent, modifier = Modifier.size((30 * tv.factor).dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(title, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = (16 * tv.factor).sp)
                Text(message, color = Color(0xB8FFFFFF), fontSize = (13 * tv.factor).sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
private fun SettingsPaneButton(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    selected: Boolean,
    focusRequester: FocusRequester? = null,
    onClick: () -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    FocusGlow(
        modifier = Modifier
            .fillMaxWidth()
            .height((56 * tv.factor).dp)
            .let { if (focusRequester != null) it.focusRequester(focusRequester) else it },
        cornerRadius = (16 * tv.factor).dp,
        onClick = onClick,
    ) {
        Row(
            Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape((16 * tv.factor).dp))
                .background(
                    if (selected) {
                        Brush.horizontalGradient(listOf(visuals.accent.copy(alpha = 0.34f), visuals.accent.copy(alpha = 0.10f)))
                    } else {
                        Brush.horizontalGradient(listOf(Color.Transparent, Color.Transparent))
                    },
                )
                .padding(horizontal = (14 * tv.factor).dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp),
        ) {
            Icon(icon, null, tint = if (selected) Color.White else Color(0xCCFFFFFF), modifier = Modifier.size((22 * tv.factor).dp))
            Text(
                title,
                color = Color.White,
                fontWeight = if (selected) FontWeight.ExtraBold else FontWeight.Bold,
                fontSize = (14 * tv.factor).sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun SettingsHeader() {
    val visuals = LocalMoVisuals.current
    val tv = rememberTvScale()
    val titleStyle = when {
        !tv.isTv && tv.isLowHeightLandscape -> MaterialTheme.typography.headlineMedium
        !tv.isTv && tv.isCompact -> MaterialTheme.typography.headlineLarge
        else -> MaterialTheme.typography.displaySmall
    }
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Icon(Icons.Rounded.Settings, null, tint = visuals.accent, modifier = Modifier.size((28 * tv.factor).dp))
        Text(LocalStrings.current.navSettings, color = Color.White, style = titleStyle)
    }
}

@Composable
private fun PlayerSettingsCard(
    settings: AppSettings,
    isTv: Boolean = false,
    onPreview: (Boolean) -> Unit,
    onParental: (Boolean) -> Unit,
    onAutoPlayLastLive: (Boolean) -> Unit,
    onHideEmptyCategories: (Boolean) -> Unit,
    onHideChannelsWithoutLogo: (Boolean) -> Unit,
    onPlayer: (String) -> Unit,
) {
    val tv = rememberTvScale()
    val context = LocalContext.current
    val updateRepository = remember(context) { UpdateRepository(context.applicationContext) }
    var updateInfo by remember { mutableStateOf(AppUpdateInfo()) }
    var updateStatus by remember { mutableStateOf("Ready to check") }
    var updateProgress by remember { mutableIntStateOf(0) }
    val updateScope = rememberCoroutineScope()
    LaunchedEffect(Unit) {
        updateInfo = updateRepository.fetchUpdateInfo()
        updateStatus = updateStatusFor(updateInfo)
    }
    val content = @Composable {
        Column(Modifier.padding(if (isTv) 0.dp else tv.panelPadding), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            SectionHeader("Player")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(
                    "auto" to "Auto",
                    "media3" to "Media3",
                    "ask" to "Ask me",
                    "vlc" to "VLC",
                    "mx" to "MX",
                    "external" to "External",
                ).forEach { (value, label) ->
                    val selected = settings.preferredPlayer == value
                    FocusGlow(cornerRadius = 10.dp, onClick = { onPlayer(value) }) {
                        GlassPanel(radius = 10.dp, highlighted = selected) {
                            Text(
                                label,
                                color = if (selected) LocalMoVisuals.current.accent else Color.White,
                                style = MaterialTheme.typography.labelLarge,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                            )
                        }
                    }
                }
            }
            // Live + privacy toggles live in their own dedicated panes on TV; only the
            // single-scroll mobile layout shows them inline here (avoids duplicate rows).
            if (!isTv) {
                SectionHeader("Live TV")
                SettingSwitch("Channel preview", settings.previewEnabled, Icons.Rounded.Visibility, onPreview)
                SettingSwitch("Auto-play last live channel", settings.autoPlayLastLive, Icons.Rounded.PlayArrow, onAutoPlayLastLive)
                SettingSwitch("Hide empty categories", settings.hideEmptyCategories, Icons.Rounded.FolderOff, onHideEmptyCategories)
                SettingSwitch("Hide channels without logo", settings.hideChannelsWithoutLogo, Icons.Rounded.ImageNotSupported, onHideChannelsWithoutLogo)
                SectionHeader("Privacy")
                SettingSwitch("Parental control filter", settings.parentalControlsEnabled, Icons.Rounded.Lock, onParental)
            }
            SectionHeader("Update")
            UpdateSettingsPanel(
                info = updateInfo,
                status = updateStatus,
                progress = updateProgress,
                onCheck = {
                    updateScope.launch {
                        updateStatus = "Checking latest version..."
                        updateInfo = updateRepository.fetchUpdateInfo()
                        updateStatus = updateStatusFor(updateInfo)
                    }
                },
                onInstall = {
                    if (!updateInfo.updateAvailable) {
                        updateStatus = "App is up to date"
                        return@UpdateSettingsPanel
                    }
                    updateScope.launch {
                        updateProgress = 0
                        updateStatus = "Downloading update..."
                        when (val result = updateRepository.downloadAndOpenInstaller(updateInfo) { updateProgress = it }) {
                            UpdateInstallResult.InstallerOpened -> updateStatus = "Installer opened"
                            UpdateInstallResult.InstallPermissionRequired -> updateStatus = "Enable install permission, then tap download again"
                            is UpdateInstallResult.Failed -> updateStatus = result.message.ifBlank { "Could not download update" }
                        }
                    }
                },
                onOpenWeb = {
                    runCatching { updateRepository.openDownloadInBrowser(updateInfo) }
                        .onFailure { Toast.makeText(context, "Could not open the update link right now.", Toast.LENGTH_LONG).show() }
                },
            )
        }
    }
    if (isTv) content() else GlassPanel(radius = tv.cardRadius) { content() }
}

@Composable
private fun UpdateSettingsPanel(
    info: AppUpdateInfo,
    status: String,
    progress: Int,
    onCheck: () -> Unit,
    onInstall: () -> Unit,
    onOpenWeb: () -> Unit,
) {
    val accent = LocalMoVisuals.current.accent
    GlassPanel(radius = 14.dp, highlighted = info.updateAvailable) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Rounded.SystemUpdateAlt, null, tint = accent, modifier = Modifier.size(26.dp))
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text("MoPlayer Pro Update", color = Color.White, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold))
                    Text(
                        "Current ${info.currentVersionName}  •  Latest ${info.latestVersionName}",
                        color = Color(0xB3FFFFFF),
                        style = MaterialTheme.typography.bodySmall,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            Text(status, color = if (info.updateAvailable) accent else Color(0xB3FFFFFF), style = MaterialTheme.typography.bodySmall)
            if (info.updateAvailable) {
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = accent.copy(alpha = 0.16f),
                ) {
                    Text(
                        "Small update notice: version ${info.latestVersionName} is ready to download.",
                        color = accent,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    )
                }
            }
            if (progress in 1..99) {
                Text("Downloading $progress%", color = Color.White, style = MaterialTheme.typography.labelMedium)
            }
            val details = info.apkSizeBytes?.let { "Download size ${formatBytes(it)}" }.orEmpty()
            if (details.isNotBlank()) {
                Text(details, color = Color(0x80FFFFFF), style = MaterialTheme.typography.bodySmall)
            }
            if (info.releaseNotes.isNotBlank()) {
                Text(info.releaseNotes, color = Color(0x99FFFFFF), style = MaterialTheme.typography.bodySmall, maxLines = 3, overflow = TextOverflow.Ellipsis)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(onClick = onCheck, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Rounded.Refresh, null)
                    Spacer(Modifier.width(8.dp))
                    Text("Check")
                }
                Button(onClick = onInstall, enabled = info.updateAvailable, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Rounded.Download, null)
                    Spacer(Modifier.width(8.dp))
                    Text(if (info.updateAvailable) "Download and install" else "Up to date")
                }
                IconButton(onClick = onOpenWeb) {
                    Icon(Icons.AutoMirrored.Rounded.OpenInNew, null, tint = Color.White)
                }
            }
        }
    }
}

private fun formatBytes(bytes: Long): String {
    val mb = bytes / 1024.0 / 1024.0
    return "${"%.1f".format(mb)} MB"
}

private fun updateStatusFor(info: AppUpdateInfo): String =
    if (info.updateAvailable) {
        "New version ${info.latestVersionName} is available"
    } else {
        "App is up to date"
    }

@Composable
private fun LibraryModeCard(
    selected: LibraryMode,
    isTv: Boolean = false,
    onLibraryMode: (LibraryMode) -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val content = @Composable {
        Column(Modifier.padding(if (isTv) 0.dp else tv.panelPadding), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            SectionHeader("Library mode")
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                listOf(
                    LibraryMode.ACTIVE_SOURCE to "Active account",
                    LibraryMode.MERGED to "All playlists",
                ).forEach { (mode, label) ->
                    val active = selected == mode
                    FocusGlow(cornerRadius = 12.dp, onClick = { onLibraryMode(mode) }, modifier = Modifier.weight(1f)) {
                        GlassPanel(radius = 12.dp, highlighted = active) {
                            Row(
                                Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                            ) {
                                Icon(
                                    if (mode == LibraryMode.MERGED) Icons.Rounded.FolderOff else Icons.Rounded.AccountCircle,
                                    null,
                                    tint = if (active) visuals.accent else Color(0xCCFFFFFF),
                                    modifier = Modifier.size(20.dp),
                                )
                                Text(
                                    label,
                                    color = if (active) visuals.accent else Color.White,
                                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
    if (isTv) content() else GlassPanel(radius = tv.cardRadius) { content() }
}

@Composable
private fun AppearanceSubsection(title: String, description: String? = null) {
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            title,
            color = Color.White,
            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
        )
        if (!description.isNullOrBlank()) {
            Text(
                description,
                color = Color(0xB3FFFFFF),
                style = MaterialTheme.typography.bodySmall,
                lineHeight = 18.sp,
            )
        }
    }
}

@Composable
private fun <T> AppearanceLabeledChoiceRow(
    title: String,
    hint: String,
    items: List<Pair<T, String>>,
    selected: T,
    onSelected: (T) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        AppearanceSubsection(title = title, description = hint)
        AppearanceChoiceRow(items = items, selected = selected, onSelected = onSelected)
    }
}

@Composable
private fun AppearanceSettingsCard(
    settings: AppSettings,
    isTv: Boolean = false,
    onAccentMode: (AccentMode) -> Unit,
    onAccentColor: (Long) -> Unit,
    onBackgroundMode: (BackgroundMode) -> Unit,
    onCustomBackgroundUrl: (String) -> Unit,
    onThemePreset: (ThemePreset) -> Unit,
    onMotionLevel: (MotionLevel) -> Unit,
    performancePolicy: PerformancePolicy,
    devicePerformanceInfo: DevicePerformanceInfo,
    onPerformanceMode: (PerformanceMode) -> Unit,
    onShowWeatherWidget: (Boolean) -> Unit,
    onShowClockWidget: (Boolean) -> Unit,
    onShowFootballWidget: (Boolean) -> Unit,
    onWeatherMode: (WeatherMode) -> Unit,
    onManualWeatherEffect: (ManualWeatherEffect) -> Unit,
    onWeatherCityOverride: (String) -> Unit,
    onFootballMaxMatches: (Int) -> Unit,
    onRefreshWidgets: () -> Unit,
    onLanguage: (String) -> Unit = {},
) {
    val tv = rememberTvScale()
    val s = LocalStrings.current
    var city by remember(settings.weatherCityOverride) { mutableStateOf(settings.weatherCityOverride) }
    var customUrl by remember(settings.customBackgroundUrl) { mutableStateOf(settings.customBackgroundUrl) }
    val content = @Composable {
        Column(Modifier.padding(if (isTv) 0.dp else tv.panelPadding), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            SectionHeader("Appearance")

            AppearanceLabeledChoiceRow(
                title = s.settingsLanguageTitle,
                hint = s.settingsLanguageHint,
                items = listOf(
                    "system" to s.langSystem,
                    "en" to s.langEnglish,
                    "ar" to s.langArabic,
                ),
                selected = settings.languageTag,
                onSelected = onLanguage,
            )

            AppearanceLabeledChoiceRow(
                title = "Interface theme",
                hint = "Cinematic favors content posters; City uses urban backdrops; Calm keeps the UI quieter.",
                items = listOf(
                    ThemePreset.CINEMATIC_AUTO to "Cinematic",
                    ThemePreset.CITY to "City",
                    ThemePreset.CALM to "Calm",
                ),
                selected = settings.themePreset,
                onSelected = onThemePreset,
            )

            AppearanceLabeledChoiceRow(
                title = "Background image source",
                hint = "Auto shows a daily city image based on your detected or selected city. Dynamic uses movie/series art after login.",
                items = listOf(
                    BackgroundMode.AUTO to "Auto city",
                    BackgroundMode.DYNAMIC_CONTENT to "Dynamic poster",
                    BackgroundMode.CITY_ROTATION to "Daily city",
                    BackgroundMode.CUSTOM_URL to "URL",
                    BackgroundMode.NONE to "No image",
                ),
                selected = settings.backgroundMode,
                onSelected = onBackgroundMode,
            )

            if (settings.backgroundMode == BackgroundMode.CUSTOM_URL) {
                AppearanceSubsection(
                    title = "Image URL",
                    description = "Enter a direct HTTPS image URL, such as JPG or WebP.",
                )
                OutlinedTextField(
                    value = customUrl,
                    onValueChange = {
                        customUrl = it
                        onCustomBackgroundUrl(it)
                    },
                    label = { Text("URL") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            AppearanceLabeledChoiceRow(
                title = "Background motion",
                hint = "Particle and motion intensity behind home content.",
                items = listOf(
                    MotionLevel.LOW to "Low",
                    MotionLevel.BALANCED to "Balanced",
                    MotionLevel.RICH to "Rich",
                ),
                selected = settings.motionLevel,
                onSelected = onMotionLevel,
            )

            SectionHeader("Performance")
            AppearanceSubsection(
                title = "Automatic device profile",
                description = "Detected display: ${devicePerformanceInfo.displayQualityLabel} (${devicePerformanceInfo.displayMaxWidth}x${devicePerformanceInfo.displayMaxHeight}). Current profile: ${performancePolicy.mode.label()} up to ${performancePolicy.maxVideoHeight}p.",
            )
            AppearanceLabeledChoiceRow(
                title = "Performance mode",
                hint = "Auto chooses the best safe quality for the device. Performance targets 720p, Balanced 1080p, and Quality unlocks 4K/8K when the TV and stream support it.",
                items = listOf(
                    PerformanceMode.AUTO to "Auto",
                    PerformanceMode.PERFORMANCE to "Performance",
                    PerformanceMode.BALANCED to "Balanced",
                    PerformanceMode.QUALITY to "Quality",
                ),
                selected = settings.performanceMode,
                onSelected = onPerformanceMode,
            )
            if (devicePerformanceInfo.tier == DevicePerformanceTier.LOW || performancePolicy.isPerformance) {
                Text(
                    "Some heavy effects are reduced to keep remote navigation and playback smooth.",
                    color = Color.White.copy(alpha = 0.70f),
                    fontSize = 12.sp,
                )
            }

            SectionHeader("Colors")
            AppearanceSubsection(
                title = "Accent color",
                description = "Choose one fixed accent color for the whole app.",
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                MoAccentPresets.forEach { preset ->
                    val selected = settings.accentColor == preset.value
                    FocusGlow(cornerRadius = 16.dp, onClick = { onAccentColor(preset.value) }) {
                        GlassPanel(radius = 16.dp, highlighted = selected, glow = preset.color.copy(alpha = if (selected) 0.34f else 0.10f)) {
                            Column(
                                modifier = Modifier
                                    .width(if (isTv) 86.dp else 64.dp)
                                    .padding(horizontal = 8.dp, vertical = 8.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                Box(
                                    Modifier
                                        .size(if (isTv) 38.dp else 32.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(
                                            Brush.radialGradient(
                                                listOf(Color.White.copy(alpha = 0.55f), preset.color, preset.color.copy(alpha = 0.66f)),
                                            ),
                                        )
                                        .border(1.dp, Color.White.copy(alpha = if (selected) 0.70f else 0.20f), RoundedCornerShape(14.dp)),
                                )
                                Text(
                                    preset.label,
                                    color = if (selected) preset.color else Color.White.copy(alpha = 0.82f),
                                    fontSize = (10 * tv.factor).sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    maxLines = 1,
                                )
                            }
                        }
                    }
                }
            }

            SectionHeader("Weather, clock, and matches")
            AppearanceSubsection(
                title = "Home top widgets",
                description = "Shown on the home card and can be hidden to save space or reduce visual noise.",
            )
            SettingSwitch("Show weather", settings.showWeatherWidget, Icons.Rounded.Cloud, onShowWeatherWidget)
            SettingSwitch("Show clock", settings.showClockWidget, Icons.Rounded.Schedule, onShowClockWidget)
            SettingSwitch("Show matches", settings.showFootballWidget, Icons.Rounded.SportsSoccer, onShowFootballWidget)
            AppearanceLabeledChoiceRow(
                title = "Weather source",
                hint = "Auto uses IP, City uses the typed city name, and Manual previews effects without internet.",
                items = listOf(
                    WeatherMode.AUTO_IP to "Auto IP",
                    WeatherMode.CITY to "City",
                    WeatherMode.MANUAL to "Manual",
                ),
                selected = settings.weatherMode,
                onSelected = onWeatherMode,
            )
            if (settings.weatherMode == WeatherMode.CITY) {
                OutlinedTextField(
                    value = city,
                    onValueChange = {
                        city = it
                        onWeatherCityOverride(it)
                    },
                    label = { Text("Weather city") },
                    placeholder = { Text("Berlin, Istanbul, or Dubai") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            if (settings.weatherMode == WeatherMode.MANUAL) {
                AppearanceLabeledChoiceRow(
                    title = "Weather effect",
                    hint = "Choose an effect to preview it on the background and widget.",
                    items = listOf(
                        ManualWeatherEffect.SUNNY to "Sunny",
                        ManualWeatherEffect.CLOUDY to "Cloudy",
                        ManualWeatherEffect.RAIN to "Rain",
                        ManualWeatherEffect.STORM to "Storm",
                        ManualWeatherEffect.SNOW to "Snow",
                        ManualWeatherEffect.FOG to "Fog",
                    ),
                    selected = settings.manualWeatherEffect,
                    onSelected = onManualWeatherEffect,
                )
            }
            AppearanceSubsection(
                title = "Match count in ticker",
                description = "How many matches appear in the football widget when enabled.",
            )
            AppearanceChoiceRow(
                items = listOf(2 to "2 matches", 4 to "4 matches", 8 to "8 matches"),
                selected = settings.footballMaxMatches,
                onSelected = onFootballMaxMatches,
            )
            Button(onClick = onRefreshWidgets, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.Refresh, null)
                Spacer(Modifier.width(8.dp))
                Text("Refresh weather and matches")
            }
        }
    }
    if (isTv) content() else GlassPanel(radius = tv.cardRadius) { content() }
}

@Composable
private fun <T> AppearanceChoiceRow(
    items: List<Pair<T, String>>,
    selected: T,
    onSelected: (T) -> Unit,
) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        items.forEach { (value, label) ->
            AppearancePill(
                label = label,
                selected = selected == value,
                modifier = Modifier.weight(1f),
                onClick = { onSelected(value) },
            )
        }
    }
}

@Composable
private fun AppearancePill(
    label: String,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    FocusGlow(cornerRadius = 12.dp, onClick = onClick, modifier = modifier.heightIn(min = 44.dp, max = 56.dp)) {
        GlassPanel(radius = 12.dp, highlighted = selected) {
            Box(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 8.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    label,
                    color = if (selected) visuals.accent else Color.White,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

@Composable
private fun ActiveServerCard(
    server: ServerProfile,
    isTv: Boolean = false,
    onRefresh: () -> Unit,
    onTestConnection: () -> Unit,
    onClearWatchHistory: () -> Unit,
    onClearEpgCache: () -> Unit,
    onLogout: () -> Unit,
) {
    val tv = rememberTvScale()
    val content = @Composable {
        Column(Modifier.padding(if (isTv) 0.dp else tv.panelPadding), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            SectionHeader("Active account")
            ServerInfoRows(server)
            Button(onClick = onRefresh, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.Refresh, null)
                Spacer(Modifier.width(8.dp))
                Text("Update library now")
            }
            Text(
                "Smart background checks keep account status fresh. Use this when channels, movies, or series changed on the provider.",
                color = Color(0x99FFFFFF),
                style = MaterialTheme.typography.bodySmall,
            )
            OutlinedButton(onClick = onTestConnection, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.NetworkCheck, null)
                Spacer(Modifier.width(8.dp))
                Text("Test server connection")
            }
            OutlinedButton(onClick = onClearWatchHistory, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.DeleteSweep, null)
                Spacer(Modifier.width(8.dp))
                Text("Clear watch history")
            }
            OutlinedButton(onClick = onClearEpgCache, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.Tv, null)
                Spacer(Modifier.width(8.dp))
                Text("Clear EPG cache")
            }
            OutlinedButton(onClick = onLogout, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.DeleteSweep, null)
                Spacer(Modifier.width(8.dp))
                Text("Remove from this device")
            }
        }
    }
    if (isTv) content() else GlassPanel(radius = tv.cardRadius) { content() }
}

@Composable
private fun LockedSettingsCard(isTv: Boolean = false, onUnlock: (String) -> Unit) {
    var pin by remember { mutableStateOf("") }
    val content = @Composable {
        Column(Modifier.padding(if (isTv) 0.dp else 24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            SectionHeader("Settings lock")
            Text("Enter the parental control PIN to access settings and maintenance tools.", color = Color.White, style = MaterialTheme.typography.bodyLarge)
            OutlinedTextField(
                value = pin,
                onValueChange = { pin = it.filter(Char::isDigit).take(8) },
                label = { Text("PIN") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
            )
            Button(onClick = { onUnlock(pin) }, enabled = pin.length >= 4, modifier = Modifier.fillMaxWidth()) {
                Text("Unlock settings")
            }
        }
    }
    if (isTv) content() else GlassPanel(radius = rememberTvScale().cardRadius) { content() }
}

@Composable
private fun PinSettingsCard(
    hasPin: Boolean,
    isTv: Boolean = false,
    onLock: () -> Unit,
    onSetPin: (String) -> Unit,
    onChangePin: (String, String) -> Unit,
    onRemovePin: (String) -> Unit,
) {
    var newPin by remember { mutableStateOf("") }
    var currentPin by remember { mutableStateOf("") }
    var nextPin by remember { mutableStateOf("") }
    var removePin by remember { mutableStateOf("") }
    val content = @Composable {
        Column(Modifier.padding(if (isTv) 0.dp else 24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            SectionHeader("Parental control PIN")
            if (!hasPin) {
                PinField("New PIN", newPin) { newPin = it }
                Button(onClick = { onSetPin(newPin) }, enabled = newPin.length >= 4, modifier = Modifier.fillMaxWidth()) {
                    Text("Save PIN")
                }
            } else {
                Text("Settings are protected by a securely stored PIN; the PIN is not shown after saving.", color = Color.White, style = MaterialTheme.typography.bodyMedium)
                PinField("Current PIN", currentPin) { currentPin = it }
                PinField("New PIN", nextPin) { nextPin = it }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = { onChangePin(currentPin, nextPin) }, enabled = currentPin.length >= 4 && nextPin.length >= 4, modifier = Modifier.weight(1f)) {
                        Text("Change PIN")
                    }
                    OutlinedButton(onClick = onLock, modifier = Modifier.weight(1f)) {
                        Text("Lock now")
                    }
                }
                PinField("Confirm current PIN to remove", removePin) { removePin = it }
                OutlinedButton(onClick = { onRemovePin(removePin) }, enabled = removePin.length >= 4, modifier = Modifier.fillMaxWidth()) {
                    Text("Remove PIN")
                }
            }
        }
    }
    if (isTv) content() else GlassPanel(radius = rememberTvScale().cardRadius) { content() }
}

@Composable
private fun PinField(label: String, value: String, onValueChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = { onValueChange(it.filter(Char::isDigit).take(8)) },
        label = { Text(label) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
        visualTransformation = PasswordVisualTransformation(),
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun AboutCard(isTv: Boolean = false) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val content = @Composable {
        Column(
            Modifier.padding(if (isTv) 0.dp else 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalAlignment = Alignment.Start,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Image(
                    painter = painterResource(com.moalfarras.moplayerpro.R.drawable.ic_splash_logo),
                    contentDescription = null,
                    modifier = Modifier.size(if (isTv) 76.dp else 58.dp),
                )
                Column {
                    Text("MoPlayer Pro", color = Color.White, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold))
                    Text("www.moalfarras.space", color = visuals.accent, style = MaterialTheme.typography.bodyMedium)
                }
            }
            Text(
                "MoPlayer Pro is designed to play user-provided or licensed sources only, with Xtream, M3U, M3U8, XMLTV, and QR device linking support.",
                color = Color(0xCCE3BC78),
                style = MaterialTheme.typography.bodyMedium,
            )
            DiagnosticsRow("Support", "www.moalfarras.space")
            DiagnosticsRow("Version", BuildConfig.VERSION_NAME)
            DiagnosticsRow("Companion", "QR login, remote commands, continue watching sync")
            DiagnosticsRow("Cast", "Google Cast / Android chooser fallback")
        }
    }
    if (isTv) content() else GlassPanel(radius = tv.cardRadius) { content() }
}

@Composable
private fun DiagnosticsRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = Color(0x99FFFFFF), style = MaterialTheme.typography.bodySmall)
        Text(value, color = Color.White, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun ServerList(
    servers: List<ServerProfile>,
    activeServerId: Long?,
    onActivateServer: (Long) -> Unit,
    onDeleteServer: (Long) -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    if (servers.isEmpty()) {
        GlassPanel(radius = tv.cardRadius) {
            Text("No saved accounts", color = Color(0xB8E3BC78), modifier = Modifier.padding(16.dp))
        }
        return
    }
    Column(verticalArrangement = Arrangement.spacedBy((10 * tv.factor).dp)) {
        servers.forEach { server ->
            GlassPanel(radius = (12 * tv.factor).dp, highlighted = server.id == activeServerId) {
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = (16 * tv.factor).dp, vertical = (14 * tv.factor).dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(server.name, color = Color.White, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        Text(
                            "${server.kind.name} • ${server.host.ifBlank { server.baseUrl.maskHost() }}",
                            color = Color(0x66FFFFFF),
                            style = MaterialTheme.typography.bodySmall,
                            maxLines = 1,
                        )
                    }
                    FocusGlow(cornerRadius = (10 * tv.factor).dp, onClick = { onActivateServer(server.id) }) {
                        Text(
                            if (server.id == activeServerId) "Active" else "Use",
                            color = visuals.accent,
                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                            modifier = Modifier.padding(horizontal = (12 * tv.factor).dp, vertical = (8 * tv.factor).dp),
                        )
                    }
                    FocusGlow(cornerRadius = (10 * tv.factor).dp, onClick = { onDeleteServer(server.id) }) {
                        Text(
                            "Delete",
                            color = Color(0xFFFF6680),
                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                            modifier = Modifier.padding(horizontal = (12 * tv.factor).dp, vertical = (8 * tv.factor).dp),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    val visuals = LocalMoVisuals.current
    val tv = rememberTvScale()
    Text(
        title,
        color = visuals.accent,
        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold),
        modifier = Modifier.padding(top = (8 * tv.factor).dp),
    )
}

@Composable
private fun SortOptionRow(selected: SortOption, compact: Boolean, onSort: (SortOption) -> Unit) {
    val visuals = LocalMoVisuals.current
    val tv = rememberTvScale()
    SectionHeader("Default sorting")
    Row(horizontalArrangement = Arrangement.spacedBy((if (compact) 8 else (10 * tv.factor).toInt()).dp)) {
        listOf(
            SortOption.SERVER_ORDER to "Server order",
            SortOption.LATEST_ADDED to "Latest added",
            SortOption.TITLE_ASC to "A-Z",
            SortOption.TITLE_DESC to "Z-A",
            SortOption.RECENTLY_WATCHED to "Recently watched",
            SortOption.FAVORITES_FIRST to "Favorites first",
            SortOption.RATING to "Rating",
        ).forEach { (value, label) ->
            if (compact && (value == SortOption.RECENTLY_WATCHED || value == SortOption.FAVORITES_FIRST || value == SortOption.RATING)) return@forEach
            val isSelected = selected == value
            FocusGlow(cornerRadius = if (compact) 10.dp else (12 * tv.factor).dp, onClick = { onSort(value) }) {
                GlassPanel(radius = if (compact) 10.dp else (12 * tv.factor).dp, highlighted = isSelected) {
                    Text(
                        label,
                        color = if (isSelected) visuals.accent else Color.White,
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Medium),
                        modifier = Modifier
                            .padding(horizontal = if (compact) 12.dp else (18 * tv.factor).dp, vertical = if (compact) 10.dp else (12 * tv.factor).dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun ServerInfoRows(server: ServerProfile) {
    val labelColor = Color(0x99FFFFFF)
    val valueColor = Color.White
    val visuals = LocalMoVisuals.current
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        ServerInfoRow("Host", server.host.ifBlank { server.baseUrl.maskHost() }, labelColor, valueColor)
        ServerInfoRow("User", server.username.maskUsername(), labelColor, valueColor)
        ServerInfoRow("Login type", when (server.kind) { LoginKind.XTREAM -> "Xtream Codes"; LoginKind.M3U -> "M3U / M3U8" }, labelColor, valueColor)
        ServerInfoRow("Status", server.accountStatus.ifBlank { "Active" }, labelColor, if (server.accountStatus.lowercase().contains("active") || server.accountStatus.isBlank()) Color(0xFF7CFFB2) else Color(0xFFFF6B6B))
        if (server.maxConnections > 0) {
            ServerInfoRow("Connections", "${server.activeConnections}/${server.maxConnections}", labelColor, valueColor)
        }
        if (server.expiryDate > 0) {
            val daysLeft = ((server.expiryDate - System.currentTimeMillis()) / 86_400_000L).coerceAtLeast(0)
            val expiryColor = when { daysLeft <= 3 -> Color(0xFFFF6B6B); daysLeft <= 14 -> Color(0xFFFFD166); else -> Color(0xFF7CFFB2) }
            ServerInfoRow("Expires", "${server.expiryDate.formatTimestamp()}  ($daysLeft days)", labelColor, expiryColor)
        }
        if (server.createdAt > 0) {
            ServerInfoRow("Created", server.createdAt.formatTimestamp(), labelColor, valueColor)
        }
        if (server.lastSyncAt > 0) {
            ServerInfoRow("Last sync", server.lastSyncAt.formatTimestamp(), labelColor, valueColor)
        }
        if (server.timezone.isNotBlank()) {
            ServerInfoRow("Time zone", server.timezone, labelColor, valueColor)
        }
        if (server.allowedOutputFormats.isNotEmpty()) {
            ServerInfoRow("Supported formats", server.allowedOutputFormats.joinToString(" • ") { it.uppercase() }, labelColor, visuals.accent)
        }
        if (server.serverMessage.isNotBlank()) {
            Spacer(Modifier.height(4.dp))
            GlassPanel(radius = 10.dp, modifier = Modifier.fillMaxWidth()) {
                Row(Modifier.padding(10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Info, null, tint = visuals.accent, modifier = Modifier.size(16.dp))
                    Text(server.serverMessage, color = Color(0xCCE3BC78), style = MaterialTheme.typography.bodySmall, maxLines = 3, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
}

@Composable
private fun ServerInfoRow(label: String, value: String, labelColor: Color, valueColor: Color) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = labelColor, style = MaterialTheme.typography.bodySmall)
        Text(value.ifBlank { "-" }, color = valueColor, style = MaterialTheme.typography.bodyMedium, maxLines = 1)
    }
}

@Composable
private fun SettingSwitch(title: String, value: Boolean, icon: androidx.compose.ui.graphics.vector.ImageVector? = null, onValue: (Boolean) -> Unit) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val accent = visuals.accent
    FocusGlow(
        modifier = Modifier.fillMaxWidth().height((64 * tv.factor).dp),
        cornerRadius = (16 * tv.factor).dp,
        onClick = { onValue(!value) },
    ) {
        Row(
            Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape((16 * tv.factor).dp))
                .background(if (value) accent.copy(alpha = 0.10f) else visuals.surfaceHigh.copy(alpha = 0.32f))
                .padding(horizontal = (18 * tv.factor).dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                if (icon != null) {
                    Box(
                        Modifier
                            .size((34 * tv.factor).dp)
                            .clip(RoundedCornerShape((12 * tv.factor).dp))
                            .background(if (value) accent.copy(alpha = 0.16f) else Color.White.copy(alpha = 0.06f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(icon, contentDescription = null, tint = if (value) accent else Color(0xB8FFFFFF), modifier = Modifier.size((19 * tv.factor).dp))
                    }
                }
                Text(title, color = Color.White, fontSize = (16 * tv.factor).sp, fontWeight = FontWeight.Bold)
            }
            Switch(
                checked = value,
                onCheckedChange = null,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = accent, checkedTrackColor = accent.copy(alpha = 0.4f),
                    uncheckedThumbColor = Color(0x99FFFFFF), uncheckedTrackColor = Color(0x22FFFFFF)
                ),
            )
        }
    }
}

private fun PerformanceMode.label(): String = when (this) {
    PerformanceMode.AUTO -> "Auto"
    PerformanceMode.PERFORMANCE -> "Performance"
    PerformanceMode.BALANCED -> "Balanced"
    PerformanceMode.QUALITY -> "Quality"
}

@Composable
fun ExitDialog(onDismiss: () -> Unit, onExit: () -> Unit) {
    val visuals = LocalMoVisuals.current
    val tv = rememberTvScale()
    val cancelFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(120)
        runCatching { cancelFocus.requestFocus() }
    }
    Dialog(onDismissRequest = onDismiss) {
        GlassPanel(
            modifier = Modifier.width(if (tv.isTv) 400.dp else 360.dp),
            radius = 28.dp,
            blur = 24.dp,
            highlighted = true,
            glow = Color(0x88FF4400),
        ) {
            Column(
                Modifier.padding(32.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                // Warning / Exit Icon
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .background(Brush.radialGradient(listOf(visuals.accent.copy(alpha = 0.25f), Color.Transparent))),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Rounded.PowerSettingsNew,
                        contentDescription = null,
                        tint = visuals.accent,
                        modifier = Modifier.size(46.dp)
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Exit app?",
                        color = Color.White,
                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                        textAlign = TextAlign.Center
                    )
                    Text(
                        "Are you sure you want to exit MoPlayer Pro?",
                        color = Color(0xCCFFFFFF),
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center
                    )
                }

                Spacer(Modifier.height(4.dp))

                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    FocusGlow(modifier = Modifier.weight(1f).height(50.dp), cornerRadius = 14.dp, focusRequester = cancelFocus, onClick = onDismiss) {
                        GlassPanel(radius = 14.dp) {
                            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text("Cancel", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                        }
                    }
                    FocusGlow(modifier = Modifier.weight(1f).height(50.dp), cornerRadius = 14.dp, onClick = onExit) {
                        GlassPanel(radius = 14.dp, highlighted = true, glow = visuals.accent) {
                            Box(Modifier.fillMaxSize().background(visuals.accent), contentAlignment = Alignment.Center) {
                                Text("Exit", color = Color.Black, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SubscriptionExpiredDialog(onNewSignIn: () -> Unit, onDismiss: () -> Unit) {
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    val tv = rememberTvScale()
    val renewFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(120)
        runCatching { renewFocus.requestFocus() }
    }
    Dialog(onDismissRequest = onDismiss) {
        GlassPanel(
            modifier = Modifier.width(if (tv.isTv) 460.dp else 360.dp),
            radius = 28.dp,
            blur = 24.dp,
            highlighted = true,
            glow = Color(0x88FF4400),
        ) {
            Column(
                Modifier.padding(32.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .background(Brush.radialGradient(listOf(Color(0x55FF5252), Color.Transparent))),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Rounded.ErrorOutline,
                        contentDescription = null,
                        tint = Color(0xFFFF6B6B),
                        modifier = Modifier.size(46.dp),
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        strings.subscriptionExpiredTitle,
                        color = Color.White,
                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                        textAlign = TextAlign.Center,
                    )
                    Text(
                        strings.subscriptionExpiredBody,
                        color = Color(0xCCFFFFFF),
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center,
                    )
                }
                Spacer(Modifier.height(4.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    FocusGlow(modifier = Modifier.weight(1f).height(52.dp), cornerRadius = 14.dp, onClick = onDismiss) {
                        GlassPanel(radius = 14.dp) {
                            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text(strings.subscriptionExpiredDismiss, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                        }
                    }
                    FocusGlow(modifier = Modifier.weight(1.3f).height(52.dp), cornerRadius = 14.dp, focusRequester = renewFocus, onClick = onNewSignIn) {
                        GlassPanel(radius = 14.dp, highlighted = true, glow = visuals.accent) {
                            Box(Modifier.fillMaxSize().background(visuals.accent), contentAlignment = Alignment.Center) {
                                Text(strings.subscriptionExpiredRenew, color = Color.Black, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun String.maskUsername(): String {
    if (isBlank()) return "-"
    if (length <= 2) return "*".repeat(length)
    return take(2) + "*".repeat((length - 2).coerceAtLeast(2))
}

private fun String.maskHost(): String = runCatching { java.net.URI(this).host ?: this }.getOrElse { this }

private fun Long.formatTimestamp(): String = runCatching {
    java.text.SimpleDateFormat("yyyy-MM-dd HH:mm", java.util.Locale.US).format(java.util.Date(this))
}.getOrDefault("-")
