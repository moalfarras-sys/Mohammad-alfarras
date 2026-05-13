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
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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
import com.moalfarras.moplayerpro.BuildConfig
import com.moalfarras.moplayer.domain.model.AccentMode
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.LibraryMode
import com.moalfarras.moplayer.domain.model.LoginKind
import com.moalfarras.moplayer.domain.model.ManualWeatherEffect
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.MotionLevel
import com.moalfarras.moplayer.domain.model.ServerProfile
import com.moalfarras.moplayer.domain.model.SortOption
import com.moalfarras.moplayer.domain.model.ThemePreset
import com.moalfarras.moplayer.domain.model.WeatherMode
import com.moalfarras.moplayer.ui.components.ChannelRow
import com.moalfarras.moplayer.ui.components.FocusGlow
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import kotlinx.coroutines.flow.Flow

@Composable
fun SearchScreen(
    query: String,
    history: List<String>,
    resultsFlow: Flow<PagingData<MediaItem>>,
    onQuery: (String) -> Unit,
    onClearHistory: () -> Unit,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val results = resultsFlow.collectAsLazyPagingItems()

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
                .padding(tv.contentPadding, tv.contentPadding * 0.8f, tv.contentPadding, if (tv.isTv) tv.contentPadding else tv.bottomBarHeight + 8.dp),
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
                    "بحث",
                    color = Color.White,
                    style = if (tv.isLowHeightLandscape) MaterialTheme.typography.headlineMedium else MaterialTheme.typography.displayMedium,
                )
            }

            GlassPanel(radius = (16 * tv.factor).dp, blur = 12.dp) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(end = (8 * tv.factor).dp)) {
                    OutlinedTextField(
                        value = query,
                        onValueChange = onQuery,
                        placeholder = { Text("ابحث عن قنوات، أفلام، مسلسلات، حلقات…") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
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
                                    putExtra(RecognizerIntent.EXTRA_PROMPT, "قل ما تريد البحث عنه")
                                })
                            } catch (_: Exception) {
                            }
                        }
                    ) {
                        Icon(Icons.Rounded.Mic, "بحث صوتي", tint = visuals.accent, modifier = Modifier.size((28 * tv.factor).dp))
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
                                Text("آخر عمليات البحث", color = Color.White, style = MaterialTheme.typography.titleMedium)
                            }
                            Text("مسح", color = visuals.accent, style = MaterialTheme.typography.labelLarge, modifier = Modifier.clickable(onClick = onClearHistory))
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            history.take(6).forEach { entry ->
                                GlassPanel(radius = 10.dp) {
                                    Text(
                                        entry,
                                        color = Color.White,
                                        style = MaterialTheme.typography.labelLarge,
                                        modifier = Modifier.clickable { onQuery(entry) }.padding(horizontal = 12.dp, vertical = 8.dp),
                                    )
                                }
                            }
                        }
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
                        Text("لا توجد نتائج لـ «$query»", color = Color(0x99FFFFFF), style = MaterialTheme.typography.titleMedium)
                    }
                }
            }

            LazyColumn(verticalArrangement = Arrangement.spacedBy((8 * tv.factor).dp)) {
                items(results.itemCount, key = { index -> results[index]?.let { "${it.type}-${it.id}" } ?: "search-$index" }) { index ->
                    results[index]?.let { item ->
                        ChannelRow(item, onFocus, onPlay, onFavorite)
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsScreen(
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
    onSort: (SortOption) -> Unit,
    onAccentMode: (AccentMode) -> Unit,
    onAccentColor: (Long) -> Unit,
    onBackgroundMode: (BackgroundMode) -> Unit,
    onCustomBackgroundUrl: (String) -> Unit,
    onThemePreset: (ThemePreset) -> Unit,
    onMotionLevel: (MotionLevel) -> Unit,
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
        .padding(tv.contentPadding, tv.contentPadding, tv.contentPadding, if (tv.isTv) tv.contentPadding else tv.bottomBarHeight)

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
                            onAccentMode = onAccentMode,
                            onAccentColor = onAccentColor,
                            onBackgroundMode = onBackgroundMode,
                            onCustomBackgroundUrl = onCustomBackgroundUrl,
                            onThemePreset = onThemePreset,
                            onMotionLevel = onMotionLevel,
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
                    item { DiagnosticsCard() }
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
                onSort = onSort,
                onAccentMode = onAccentMode,
                onAccentColor = onAccentColor,
                onBackgroundMode = onBackgroundMode,
                onCustomBackgroundUrl = onCustomBackgroundUrl,
                onThemePreset = onThemePreset,
                onMotionLevel = onMotionLevel,
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
    onSort: (SortOption) -> Unit,
    onAccentMode: (AccentMode) -> Unit,
    onAccentColor: (Long) -> Unit,
    onBackgroundMode: (BackgroundMode) -> Unit,
    onCustomBackgroundUrl: (String) -> Unit,
    onThemePreset: (ThemePreset) -> Unit,
    onMotionLevel: (MotionLevel) -> Unit,
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
    var selectedPane by rememberSaveable { mutableIntStateOf(7) }
    val unlocked = !settings.hasParentalPin || settingsUnlocked
    Row(modifier, horizontalArrangement = Arrangement.spacedBy((24 * tv.factor).dp)) {
        Column(
            modifier = Modifier.fillMaxHeight().weight(0.24f).padding(top = (12 * tv.factor).dp),
            verticalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
        ) {
            SettingsHeader()
            Spacer(Modifier.height((16 * tv.factor).dp))
            SettingsPaneButton("المشغّل والعرض", Icons.Rounded.Tv, selectedPane == 0) { selectedPane = 0 }
            SettingsPaneButton("البث المباشر", Icons.Rounded.Settings, selectedPane == 1) { selectedPane = 1 }
            SettingsPaneButton("الحسابات", Icons.Rounded.AccountCircle, selectedPane == 2) { selectedPane = 2 }
            SettingsPaneButton("الذاكرة والسجل", Icons.Rounded.DeleteSweep, selectedPane == 3) { selectedPane = 3 }
            SettingsPaneButton("الرقابة الأبوية", Icons.Rounded.Warning, selectedPane == 4) { selectedPane = 4 }
            SettingsPaneButton("التشخيص", Icons.Rounded.History, selectedPane == 5) { selectedPane = 5 }
            SettingsPaneButton("المظهر", Icons.Rounded.Palette, selectedPane == 7) { selectedPane = 7 }
            Spacer(Modifier.weight(1f))
            SettingsPaneButton("حول التطبيق", Icons.Rounded.Info, selectedPane == 6) { selectedPane = 6 }
        }

        GlassPanel(
            modifier = Modifier.fillMaxHeight().weight(0.76f),
            radius = tv.cardRadius,
            blur = 24.dp,
        ) {
            LazyColumn(
                Modifier.fillMaxSize().padding((32 * tv.factor).dp),
                verticalArrangement = Arrangement.spacedBy((16 * tv.factor).dp),
            ) {
                if (!unlocked) {
                    item { LockedSettingsCard(isTv = true, onUnlock = onUnlockSettings) }
                } else {
                    when (selectedPane) {
                        0 -> {
                            item { LibraryModeCard(settings.libraryMode, isTv = true, onLibraryMode = onLibraryMode) }
                            item {
                                PlayerSettingsCard(settings, isTv = true, onPreview, onParental, onAutoPlayLastLive, onHideEmptyCategories, onHideChannelsWithoutLogo, onPlayer)
                            }
                            item { SortOptionRow(settings.defaultSort, compact = false, onSort = onSort) }
                        }
                        1 -> {
                            item {
                                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                    SectionHeader("إعدادات البث المباشر")
                                    SettingSwitch("معاينة القناة", settings.previewEnabled, Icons.Rounded.Visibility, onPreview)
                                    SettingSwitch("تشغيل آخر قناة تلقائياً", settings.autoPlayLastLive, Icons.Rounded.PlayArrow, onAutoPlayLastLive)
                                    SettingSwitch("إخفاء التصنيفات الفارغة", settings.hideEmptyCategories, Icons.Rounded.FolderOff, onHideEmptyCategories)
                                    SettingSwitch("إخفاء القنوات بلا شعار", settings.hideChannelsWithoutLogo, Icons.Rounded.ImageNotSupported, onHideChannelsWithoutLogo)
                                }
                            }
                        }
                        2 -> {
                            activeServer?.let { server ->
                                item { ActiveServerCard(server, isTv = true, onRefresh, onTestConnection, onClearWatchHistory, onClearEpgCache, onLogout) }
                            }
                            item { ServerList(servers, activeServer?.id, onActivateServer, onDeleteServer) }
                        }
                        3 -> {
                            item {
                                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    SectionHeader("إدارة الذاكرة")
                                    activeServer?.let {
                                        FocusGlow(cornerRadius = 12.dp, onClick = onClearWatchHistory) {
                                            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                                Icon(Icons.Rounded.DeleteSweep, null, tint = LocalMoVisuals.current.accent, modifier = Modifier.size(22.dp))
                                                Text("مسح سجل المشاهدة", color = Color.White, style = MaterialTheme.typography.bodyLarge)
                                            }
                                        }
                                        FocusGlow(cornerRadius = 12.dp, onClick = onClearEpgCache) {
                                            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                                Icon(Icons.Rounded.Tv, null, tint = LocalMoVisuals.current.accent, modifier = Modifier.size(22.dp))
                                                Text("مسح ذاكرة دليل البرامج", color = Color.White, style = MaterialTheme.typography.bodyLarge)
                                            }
                                        }
                                    } ?: run {
                                        Text("لا يوجد حساب نشط لمسح بياناته.", color = Color(0x99FFFFFF), style = MaterialTheme.typography.bodyMedium)
                                    }
                                }
                            }
                        }
                        4 -> item {
                            PinSettingsCard(settings.hasParentalPin, isTv = true, onLockSettings, onSetParentalPin, onChangeParentalPin, onRemoveParentalPin)
                        }
                        5 -> item { DiagnosticsCard(isTv = true) }
                        6 -> item { AboutCard(isTv = true) }
                        7 -> item {
                            AppearanceSettingsCard(
                                settings = settings,
                                isTv = true,
                                onAccentMode = onAccentMode,
                                onAccentColor = onAccentColor,
                                onBackgroundMode = onBackgroundMode,
                                onCustomBackgroundUrl = onCustomBackgroundUrl,
                                onThemePreset = onThemePreset,
                                onMotionLevel = onMotionLevel,
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
                    }
                }
            }
        }
    }
}

@Composable
private fun SettingsPaneButton(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    FocusGlow(
        modifier = Modifier.fillMaxWidth().height((48 * tv.factor).dp),
        cornerRadius = (12 * tv.factor).dp,
        onClick = onClick,
    ) {
        Row(
            Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape((12 * tv.factor).dp))
                .background(if (selected) visuals.accent.copy(alpha = 0.20f) else Color.Transparent)
                .padding(horizontal = (12 * tv.factor).dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
        ) {
            Icon(icon, null, tint = if (selected) visuals.accent else Color(0xCCFFFFFF), modifier = Modifier.size((20 * tv.factor).dp))
            Text(title, color = Color.White, style = MaterialTheme.typography.titleSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
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
        Text("الإعدادات", color = Color.White, style = titleStyle)
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
    val content = @Composable {
        Column(Modifier.padding(if (isTv) 0.dp else tv.panelPadding), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            SectionHeader("المشغّل")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(
                    "auto" to "تلقائي",
                    "media3" to "Media3",
                    "ask" to "اسألني",
                    "vlc" to "VLC",
                    "mx" to "MX",
                    "external" to "خارجي",
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
            SectionHeader("البث المباشر")
            SettingSwitch("معاينة القناة", settings.previewEnabled, Icons.Rounded.Visibility, onPreview)
            SettingSwitch("تشغيل آخر قناة تلقائياً", settings.autoPlayLastLive, Icons.Rounded.PlayArrow, onAutoPlayLastLive)
            SettingSwitch("إخفاء التصنيفات الفارغة", settings.hideEmptyCategories, Icons.Rounded.FolderOff, onHideEmptyCategories)
            SettingSwitch("إخفاء القنوات بلا شعار", settings.hideChannelsWithoutLogo, Icons.Rounded.ImageNotSupported, onHideChannelsWithoutLogo)
            SectionHeader("الخصوصية")
            SettingSwitch("فلتر الرقابة الأبوية", settings.parentalControlsEnabled, Icons.Rounded.Lock, onParental)
            SectionHeader("التحديث")
            FocusGlow(cornerRadius = 14.dp, onClick = { openLatestAppDownload(context) }) {
                GlassPanel(radius = 14.dp, highlighted = true) {
                    Row(
                        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Rounded.Download, null, tint = LocalMoVisuals.current.accent, modifier = Modifier.size(24.dp))
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(
                                "تحميل النسخة الجديدة",
                                color = Color.White,
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold),
                            )
                            Text(
                                "يفتح رابط التحديث الرسمي مباشرة. الإصدار الحالي ${BuildConfig.VERSION_NAME}",
                                color = Color(0x99FFFFFF),
                                style = MaterialTheme.typography.bodySmall,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                        Icon(Icons.Rounded.OpenInNew, null, tint = Color(0xCCFFFFFF), modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }
    if (isTv) content() else GlassPanel(radius = tv.cardRadius) { content() }
}

private fun openLatestAppDownload(context: Context) {
    val baseUrl = BuildConfig.WEB_API_BASE_URL.trim().ifBlank { "https://moalfarras.space" }.trimEnd('/')
    val downloadUrl = "$baseUrl/api/app/download/latest?product=moplayer2"
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl)).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    runCatching { context.startActivity(intent) }
        .onFailure {
            Toast.makeText(context, "تعذر فتح رابط التحديث الآن.", Toast.LENGTH_LONG).show()
        }
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
            SectionHeader("وضع المكتبة")
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                listOf(
                    LibraryMode.MERGED to "كل القوائم",
                    LibraryMode.ACTIVE_SOURCE to "الحساب النشط",
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
    onShowWeatherWidget: (Boolean) -> Unit,
    onShowClockWidget: (Boolean) -> Unit,
    onShowFootballWidget: (Boolean) -> Unit,
    onWeatherMode: (WeatherMode) -> Unit,
    onManualWeatherEffect: (ManualWeatherEffect) -> Unit,
    onWeatherCityOverride: (String) -> Unit,
    onFootballMaxMatches: (Int) -> Unit,
    onRefreshWidgets: () -> Unit,
) {
    val tv = rememberTvScale()
    var city by remember(settings.weatherCityOverride) { mutableStateOf(settings.weatherCityOverride) }
    var customUrl by remember(settings.customBackgroundUrl) { mutableStateOf(settings.customBackgroundUrl) }
    val content = @Composable {
        Column(Modifier.padding(if (isTv) 0.dp else tv.panelPadding), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            SectionHeader("المظهر")

            AppearanceLabeledChoiceRow(
                title = "سمة الواجهة",
                hint = "السينمائي يفضّل بوستر المحتوى؛ المدني يميل لخلفيات حضرية؛ الهادئ أبسط وأهدأ بصريًا.",
                items = listOf(
                    ThemePreset.CINEMATIC_AUTO to "سينمائي",
                    ThemePreset.CITY to "مدني",
                    ThemePreset.CALM to "هادئ",
                ),
                selected = settings.themePreset,
                onSelected = onThemePreset,
            )

            AppearanceLabeledChoiceRow(
                title = "مصدر صورة الخلفية",
                hint = "«من السمة» يطبّق اختيار السمة أعلاه. «مدن يومية» يفرض صورة مدينة جديدة كل يوم بغض النظر عن السمة.",
                items = listOf(
                    BackgroundMode.AUTO to "من السمة",
                    BackgroundMode.CITY_ROTATION to "مدن يومية",
                    BackgroundMode.CUSTOM_URL to "رابط",
                    BackgroundMode.NONE to "بدون صورة",
                ),
                selected = settings.backgroundMode,
                onSelected = onBackgroundMode,
            )

            if (settings.backgroundMode == BackgroundMode.CUSTOM_URL) {
                AppearanceSubsection(
                    title = "رابط الصورة",
                    description = "أدخل رابط HTTPS مباشرًا لملف صورة (مثل JPG أو WebP).",
                )
                OutlinedTextField(
                    value = customUrl,
                    onValueChange = {
                        customUrl = it
                        onCustomBackgroundUrl(it)
                    },
                    label = { Text("عنوان URL") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            AppearanceLabeledChoiceRow(
                title = "حركة الخلفية",
                hint = "شدة الجزيئات والحركة خلف المحتوى على الشاشة الرئيسية.",
                items = listOf(
                    MotionLevel.LOW to "خفيفة",
                    MotionLevel.BALANCED to "متوازنة",
                    MotionLevel.RICH to "غنية",
                ),
                selected = settings.motionLevel,
                onSelected = onMotionLevel,
            )

            SectionHeader("الألوان")
            AppearanceSubsection(
                title = "لون التمييز",
                description = "«ديناميكي» يتبع ألوان النظام؛ اضغط أي مربّع لون لاعتماد لون ثابت.",
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                AppearancePill("ديناميكي", settings.accentMode == AccentMode.DYNAMIC, modifier = Modifier.weight(1f)) { onAccentMode(AccentMode.DYNAMIC) }
                listOf(
                    0xFFE3BC78L to Color(0xFFE3BC78),
                    0xFF4DA3FFL to Color(0xFF4DA3FF),
                    0xFF2EE6A6L to Color(0xFF2EE6A6),
                    0xFFFF5E6CL to Color(0xFFFF5E6C),
                    0xFF9B6BFFL to Color(0xFF9B6BFF),
                    0xFF62E8FFL to Color(0xFF62E8FF),
                ).forEach { (value, color) ->
                    FocusGlow(cornerRadius = 14.dp, onClick = { onAccentColor(value) }) {
                        Box(
                            Modifier
                                .size(if (isTv) 42.dp else 36.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(color)
                                .padding(2.dp),
                        )
                    }
                }
            }

            SectionHeader("الطقس والساعة والمباريات")
            AppearanceSubsection(
                title = "عناصر أعلى الشاشة الرئيسية",
                description = "تُعرض في بطاقة المنزل ويمكن إخفاؤها لتوفير مساحة أو الهدوء.",
            )
            SettingSwitch("إظهار الطقس", settings.showWeatherWidget, Icons.Rounded.Cloud, onShowWeatherWidget)
            SettingSwitch("إظهار الساعة", settings.showClockWidget, Icons.Rounded.Schedule, onShowClockWidget)
            SettingSwitch("إظهار المباريات", settings.showFootballWidget, Icons.Rounded.SportsSoccer, onShowFootballWidget)
            AppearanceLabeledChoiceRow(
                title = "مصدر الطقس",
                hint = "تلقائي يستخدم IP، المدينة تستخدم الاسم الذي تكتبه، واليدوي يعرض المؤثرات فورًا بدون إنترنت.",
                items = listOf(
                    WeatherMode.AUTO_IP to "تلقائي IP",
                    WeatherMode.CITY to "مدينة",
                    WeatherMode.MANUAL to "يدوي",
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
                    label = { Text("مدينة الطقس") },
                    placeholder = { Text("Berlin أو Istanbul أو Dubai") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            if (settings.weatherMode == WeatherMode.MANUAL) {
                AppearanceLabeledChoiceRow(
                    title = "تأثير الطقس",
                    hint = "اختر التأثير لتجربته على الخلفية والودجت مباشرة.",
                    items = listOf(
                        ManualWeatherEffect.SUNNY to "شمس",
                        ManualWeatherEffect.CLOUDY to "غيوم",
                        ManualWeatherEffect.RAIN to "مطر",
                        ManualWeatherEffect.STORM to "رعد",
                        ManualWeatherEffect.SNOW to "ثلج",
                        ManualWeatherEffect.FOG to "ضباب",
                    ),
                    selected = settings.manualWeatherEffect,
                    onSelected = onManualWeatherEffect,
                )
            }
            AppearanceSubsection(
                title = "عدد المباريات في الشريط",
                description = "كم مباراة تُعرض في ودجت كرة القدم عند تفعيله.",
            )
            AppearanceChoiceRow(
                items = listOf(2 to "2 مباريات", 4 to "4 مباريات", 8 to "8 مباريات"),
                selected = settings.footballMaxMatches,
                onSelected = onFootballMaxMatches,
            )
            Button(onClick = onRefreshWidgets, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.Refresh, null)
                Spacer(Modifier.width(8.dp))
                Text("تحديث الطقس والمباريات")
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
            SectionHeader("الحساب النشط")
            ServerInfoRows(server)
            Button(onClick = onRefresh, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.Refresh, null)
                Spacer(Modifier.width(8.dp))
                Text("تحديث المكتبة")
            }
            OutlinedButton(onClick = onTestConnection, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.NetworkCheck, null)
                Spacer(Modifier.width(8.dp))
                Text("اختبار الاتصال بالسيرفر")
            }
            OutlinedButton(onClick = onClearWatchHistory, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.DeleteSweep, null)
                Spacer(Modifier.width(8.dp))
                Text("مسح سجل المشاهدة")
            }
            OutlinedButton(onClick = onClearEpgCache, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.Tv, null)
                Spacer(Modifier.width(8.dp))
                Text("مسح ذاكرة دليل البرامج")
            }
            OutlinedButton(onClick = onLogout, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Rounded.DeleteSweep, null)
                Spacer(Modifier.width(8.dp))
                Text("تسجيل خروج الحساب الحالي")
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
            SectionHeader("قفل الإعدادات")
            Text("أدخل رمز الرقابة الأبوية للوصول إلى الإعدادات وأدوات الصيانة.", color = Color.White, style = MaterialTheme.typography.bodyLarge)
            OutlinedTextField(
                value = pin,
                onValueChange = { pin = it.filter(Char::isDigit).take(8) },
                label = { Text("الرمز") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
            )
            Button(onClick = { onUnlock(pin) }, enabled = pin.length >= 4, modifier = Modifier.fillMaxWidth()) {
                Text("فتح الإعدادات")
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
            SectionHeader("رمز الرقابة الأبوية")
            if (!hasPin) {
                PinField("رمز جديد", newPin) { newPin = it }
                Button(onClick = { onSetPin(newPin) }, enabled = newPin.length >= 4, modifier = Modifier.fillMaxWidth()) {
                    Text("حفظ الرمز")
                }
            } else {
                Text("الإعدادات محمية برمز مخزَّن بأمان؛ لا يُعرض الرمز نفسه بعد الحفظ.", color = Color.White, style = MaterialTheme.typography.bodyMedium)
                PinField("الرمز الحالي", currentPin) { currentPin = it }
                PinField("رمز جديد", nextPin) { nextPin = it }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = { onChangePin(currentPin, nextPin) }, enabled = currentPin.length >= 4 && nextPin.length >= 4, modifier = Modifier.weight(1f)) {
                        Text("تغيير الرمز")
                    }
                    OutlinedButton(onClick = onLock, modifier = Modifier.weight(1f)) {
                        Text("قفل الآن")
                    }
                }
                PinField("أكد الرمز الحالي للإزالة", removePin) { removePin = it }
                OutlinedButton(onClick = { onRemovePin(removePin) }, enabled = removePin.length >= 4, modifier = Modifier.fillMaxWidth()) {
                    Text("إزالة الرمز")
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
private fun DiagnosticsCard(isTv: Boolean = false) {
    val content = @Composable {
        Column(Modifier.padding(if (isTv) 0.dp else 24.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            SectionHeader("التشخيص")
            DiagnosticsRow("إصدار التطبيق", BuildConfig.VERSION_NAME)
            DiagnosticsRow("أندرويد", Build.VERSION.RELEASE ?: "—")
            DiagnosticsRow("الجهاز", "${Build.MANUFACTURER} ${Build.MODEL}")
            DiagnosticsRow("SDK", Build.VERSION.SDK_INT.toString())
            DiagnosticsRow("قاعدة البيانات", "Room v5")
        }
    }
    if (isTv) content() else GlassPanel(radius = rememberTvScale().cardRadius) { content() }
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
                "تطبيق MoPlayer Pro مصمم لتشغيل مصادر المستخدم أو المصادر المرخصة فقط، مع دعم Xtream وM3U وM3U8 وXMLTV وربط الأجهزة عبر QR.",
                color = Color(0xCCE3BC78),
                style = MaterialTheme.typography.bodyMedium,
            )
            DiagnosticsRow("الدعم", "www.moalfarras.space")
            DiagnosticsRow("الإصدار", BuildConfig.VERSION_NAME)
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
            Text("لا توجد حسابات محفوظة", color = Color(0xB8E3BC78), modifier = Modifier.padding(16.dp))
        }
        return
    }
    LazyColumn(verticalArrangement = Arrangement.spacedBy((10 * tv.factor).dp)) {
        items(servers, key = { it.id }) { server ->
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
                    Text(
                        if (server.id == activeServerId) "نشط" else "استخدام",
                        color = visuals.accent,
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier
                            .clip(RoundedCornerShape((8 * tv.factor).dp))
                            .clickable { onActivateServer(server.id) }
                            .padding(horizontal = (12 * tv.factor).dp, vertical = (8 * tv.factor).dp),
                    )
                    Text(
                        "حذف",
                        color = Color(0xFFFF6680),
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier
                            .clip(RoundedCornerShape((8 * tv.factor).dp))
                            .clickable { onDeleteServer(server.id) }
                            .padding(horizontal = (12 * tv.factor).dp, vertical = (8 * tv.factor).dp),
                    )
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
    SectionHeader("الفرز الافتراضي")
    Row(horizontalArrangement = Arrangement.spacedBy((if (compact) 8 else (10 * tv.factor).toInt()).dp)) {
        listOf(
            SortOption.SERVER_ORDER to "ترتيب السيرفر",
            SortOption.LATEST_ADDED to "الأحدث إضافة",
            SortOption.TITLE_ASC to "أ–ي",
            SortOption.TITLE_DESC to "ي–أ",
            SortOption.RECENTLY_WATCHED to "آخر مشاهدة",
            SortOption.FAVORITES_FIRST to "المفضلة أولاً",
            SortOption.RATING to "التقييم",
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
        ServerInfoRow("المضيف", server.host.ifBlank { server.baseUrl.maskHost() }, labelColor, valueColor)
        ServerInfoRow("المستخدم", server.username.maskUsername(), labelColor, valueColor)
        ServerInfoRow("نوع التسجيل", when (server.kind) { LoginKind.XTREAM -> "Xtream Codes"; LoginKind.M3U -> "M3U / M3U8" }, labelColor, valueColor)
        ServerInfoRow("الحالة", server.accountStatus.ifBlank { "نشط" }, labelColor, if (server.accountStatus.lowercase().contains("active") || server.accountStatus.isBlank()) Color(0xFF7CFFB2) else Color(0xFFFF6B6B))
        if (server.maxConnections > 0) {
            ServerInfoRow("الاتصالات", "${server.activeConnections}/${server.maxConnections}", labelColor, valueColor)
        }
        if (server.expiryDate > 0) {
            val daysLeft = ((server.expiryDate - System.currentTimeMillis()) / 86_400_000L).coerceAtLeast(0)
            val expiryColor = when { daysLeft <= 3 -> Color(0xFFFF6B6B); daysLeft <= 14 -> Color(0xFFFFD166); else -> Color(0xFF7CFFB2) }
            ServerInfoRow("الانتهاء", "${server.expiryDate.formatTimestamp()}  ($daysLeft يوم)", labelColor, expiryColor)
        }
        if (server.createdAt > 0) {
            ServerInfoRow("تاريخ التسجيل", server.createdAt.formatTimestamp(), labelColor, valueColor)
        }
        if (server.lastSyncAt > 0) {
            ServerInfoRow("آخر مزامنة", server.lastSyncAt.formatTimestamp(), labelColor, valueColor)
        }
        if (server.timezone.isNotBlank()) {
            ServerInfoRow("المنطقة الزمنية", server.timezone, labelColor, valueColor)
        }
        if (server.allowedOutputFormats.isNotEmpty()) {
            ServerInfoRow("الصيغ المدعومة", server.allowedOutputFormats.joinToString(" • ") { it.uppercase() }, labelColor, visuals.accent)
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
    val accent = LocalMoVisuals.current.accent
    FocusGlow(
        modifier = Modifier.fillMaxWidth().height((56 * tv.factor).dp),
        cornerRadius = (12 * tv.factor).dp,
        onClick = { onValue(!value) },
    ) {
        Row(
            Modifier.fillMaxSize().padding(horizontal = (16 * tv.factor).dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                if (icon != null) {
                    Icon(icon, contentDescription = null, tint = if (value) accent else Color(0x99FFFFFF), modifier = Modifier.size(24.dp))
                }
                Text(title, color = Color.White, style = MaterialTheme.typography.titleMedium)
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

@Composable
fun ExitDialog(onDismiss: () -> Unit, onExit: () -> Unit) {
    val visuals = LocalMoVisuals.current
    Dialog(onDismissRequest = onDismiss) {
        GlassPanel(
            modifier = Modifier.fillMaxWidth(),
            radius = 26.dp,
            highlighted = true,
            glow = visuals.glow,
        ) {
            Column(
                Modifier.padding(horizontal = 24.dp, vertical = 22.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text("إنهاء MoPlayer Pro؟", color = Color.White, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text(
                    "هل تريد الخروج من التطبيق الآن؟",
                    color = Color(0xCCE3BC78),
                    style = MaterialTheme.typography.bodyLarge,
                )
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.End),
                ) {
                    OutlinedButton(onClick = onDismiss) {
                        Text("البقاء", color = Color.White)
                    }
                    Button(
                        onClick = onExit,
                        colors = ButtonDefaults.buttonColors(containerColor = visuals.accent, contentColor = Color.Black),
                    ) {
                        Text("خروج")
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
