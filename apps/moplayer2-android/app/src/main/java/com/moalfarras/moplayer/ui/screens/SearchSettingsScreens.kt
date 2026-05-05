package com.moalfarras.moplayer.ui.screens

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.speech.RecognizerIntent
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
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AccountCircle
import androidx.compose.material.icons.rounded.DeleteSweep
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material.icons.rounded.NetworkCheck
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.SearchOff
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Tv
import androidx.compose.material.icons.rounded.Warning
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.paging.PagingData
import androidx.paging.compose.collectAsLazyPagingItems
import com.moalfarras.moplayer.BuildConfig
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.ServerProfile
import com.moalfarras.moplayer.domain.model.SortOption
import com.moalfarras.moplayer.ui.components.ChannelRow
import com.moalfarras.moplayer.ui.components.CinematicBackdrop
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
        CinematicBackdrop(backdropUrl = null)
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
    onSort: (SortOption) -> Unit,
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
        CinematicBackdrop(backdropUrl = null)
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
                } else {
                    item { LockedSettingsCard(onUnlock = onUnlockSettings) }
                }
                activeServer?.let { server ->
                    item {
                        ActiveServerCard(server, onRefresh, onTestConnection, onClearWatchHistory, onClearEpgCache, onLogout)
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
                onSort = onSort,
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
    onSort: (SortOption) -> Unit,
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
    var selectedPane by remember { mutableStateOf(0) }
    val unlocked = !settings.hasParentalPin || settingsUnlocked
    Row(modifier, horizontalArrangement = Arrangement.spacedBy((16 * tv.factor).dp)) {
        GlassPanel(modifier = Modifier.fillMaxHeight().weight(0.22f), radius = tv.cardRadius, blur = 18.dp) {
            Column(
                Modifier.fillMaxSize().padding(tv.panelPadding),
                verticalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
            ) {
                SettingsHeader()
                Spacer(Modifier.height((8 * tv.factor).dp))
                SettingsPaneButton("المشغّل والعرض", Icons.Rounded.Tv, selectedPane == 0) { selectedPane = 0 }
                SettingsPaneButton("البث المباشر", Icons.Rounded.Settings, selectedPane == 1) { selectedPane = 1 }
                SettingsPaneButton("الحسابات", Icons.Rounded.AccountCircle, selectedPane == 2) { selectedPane = 2 }
                SettingsPaneButton("الذاكرة والسجل", Icons.Rounded.DeleteSweep, selectedPane == 3) { selectedPane = 3 }
                SettingsPaneButton("الرقابة الأبوية", Icons.Rounded.Warning, selectedPane == 4) { selectedPane = 4 }
                SettingsPaneButton("التشخيص", Icons.Rounded.History, selectedPane == 5) { selectedPane = 5 }
            }
        }

            LazyColumn(
                Modifier.fillMaxSize().padding(tv.panelPadding),
                verticalArrangement = Arrangement.spacedBy((12 * tv.factor).dp),
            ) {
                if (!unlocked) {
                    item { LockedSettingsCard(onUnlock = onUnlockSettings) }
                } else {
                    when (selectedPane) {
                        0 -> {
                            item {
                                PlayerSettingsCard(settings, onPreview, onParental, onAutoPlayLastLive, onHideEmptyCategories, onHideChannelsWithoutLogo, onPlayer)
                            }
                            item { SortOptionRow(settings.defaultSort, compact = false, onSort = onSort) }
                        }
                        1 -> {
                            item {
                                GlassPanel(radius = tv.cardRadius) {
                                    Column(Modifier.padding(tv.panelPadding), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                        SectionHeader("إعدادات البث المباشر")
                                        SettingSwitch("معاينة القناة", settings.previewEnabled, onPreview)
                                        SettingSwitch("تشغيل آخر قناة تلقائياً", settings.autoPlayLastLive, onAutoPlayLastLive)
                                        SettingSwitch("إخفاء التصنيفات الفارغة", settings.hideEmptyCategories, onHideEmptyCategories)
                                        SettingSwitch("إخفاء القنوات بلا شعار", settings.hideChannelsWithoutLogo, onHideChannelsWithoutLogo)
                                    }
                                }
                            }
                        }
                        2 -> {
                            activeServer?.let { server ->
                                item { ActiveServerCard(server, onRefresh, onTestConnection, onClearWatchHistory, onClearEpgCache, onLogout) }
                            }
                            item { ServerList(servers, activeServer?.id, onActivateServer, onDeleteServer) }
                        }
                        3 -> {
                            item {
                                GlassPanel(radius = tv.cardRadius) {
                                    Column(Modifier.padding(tv.panelPadding), verticalArrangement = Arrangement.spacedBy(12.dp)) {
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
                        }
                        4 -> item {
                            PinSettingsCard(settings.hasParentalPin, onLockSettings, onSetParentalPin, onChangeParentalPin, onRemoveParentalPin)
                        }
                        else -> item { DiagnosticsCard() }
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
    onPreview: (Boolean) -> Unit,
    onParental: (Boolean) -> Unit,
    onAutoPlayLastLive: (Boolean) -> Unit,
    onHideEmptyCategories: (Boolean) -> Unit,
    onHideChannelsWithoutLogo: (Boolean) -> Unit,
    onPlayer: (String) -> Unit,
) {
    val tv = rememberTvScale()
    GlassPanel(radius = tv.cardRadius) {
        Column(Modifier.padding(tv.panelPadding), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            SectionHeader("المشغّل")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(
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
            SettingSwitch("معاينة القناة", settings.previewEnabled, onPreview)
            SettingSwitch("تشغيل آخر قناة تلقائياً", settings.autoPlayLastLive, onAutoPlayLastLive)
            SettingSwitch("إخفاء التصنيفات الفارغة", settings.hideEmptyCategories, onHideEmptyCategories)
            SettingSwitch("إخفاء القنوات بلا شعار", settings.hideChannelsWithoutLogo, onHideChannelsWithoutLogo)
            SectionHeader("الخصوصية")
            SettingSwitch("فلتر الرقابة الأبوية", settings.parentalControlsEnabled, onParental)
        }
    }
}

@Composable
private fun ActiveServerCard(
    server: ServerProfile,
    onRefresh: () -> Unit,
    onTestConnection: () -> Unit,
    onClearWatchHistory: () -> Unit,
    onClearEpgCache: () -> Unit,
    onLogout: () -> Unit,
) {
    val tv = rememberTvScale()
    GlassPanel(radius = tv.cardRadius) {
        Column(Modifier.padding(tv.panelPadding), verticalArrangement = Arrangement.spacedBy(12.dp)) {
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
}

@Composable
private fun LockedSettingsCard(onUnlock: (String) -> Unit) {
    var pin by remember { mutableStateOf("") }
    GlassPanel(radius = rememberTvScale().cardRadius) {
        Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
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
}

@Composable
private fun PinSettingsCard(
    hasPin: Boolean,
    onLock: () -> Unit,
    onSetPin: (String) -> Unit,
    onChangePin: (String, String) -> Unit,
    onRemovePin: (String) -> Unit,
) {
    var newPin by remember { mutableStateOf("") }
    var currentPin by remember { mutableStateOf("") }
    var nextPin by remember { mutableStateOf("") }
    var removePin by remember { mutableStateOf("") }
    GlassPanel(radius = rememberTvScale().cardRadius) {
        Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
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
private fun DiagnosticsCard() {
    GlassPanel(radius = rememberTvScale().cardRadius) {
        Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            SectionHeader("التشخيص")
            DiagnosticsRow("إصدار التطبيق", BuildConfig.VERSION_NAME)
            DiagnosticsRow("أندرويد", Build.VERSION.RELEASE ?: "—")
            DiagnosticsRow("الجهاز", "${Build.MANUFACTURER} ${Build.MODEL}")
            DiagnosticsRow("SDK", Build.VERSION.SDK_INT.toString())
            DiagnosticsRow("قاعدة البيانات", "Room v5")
        }
    }
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
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        ServerInfoRow("المضيف", server.host.ifBlank { server.baseUrl.maskHost() }, labelColor, valueColor)
        ServerInfoRow("المستخدم", server.username.maskUsername(), labelColor, valueColor)
        ServerInfoRow("الحالة", server.accountStatus.ifBlank { server.kind.name }, labelColor, valueColor)
        if (server.maxConnections > 0) {
            ServerInfoRow("الاتصالات", "${server.activeConnections}/${server.maxConnections}", labelColor, valueColor)
        }
        if (server.expiryDate > 0) {
            ServerInfoRow("الانتهاء", server.expiryDate.formatTimestamp(), labelColor, valueColor)
        }
        if (server.lastSyncAt > 0) {
            ServerInfoRow("آخر مزامنة", server.lastSyncAt.formatTimestamp(), labelColor, valueColor)
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
private fun SettingSwitch(title: String, value: Boolean, onValue: (Boolean) -> Unit) {
    val tv = rememberTvScale()
    val accent = LocalMoVisuals.current.accent
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape((12 * tv.factor).dp)).padding(vertical = (4 * tv.factor).dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(title, color = Color.White, style = MaterialTheme.typography.titleMedium)
        Switch(
            checked = value,
            onCheckedChange = onValue,
            colors = SwitchDefaults.colors(checkedThumbColor = accent, checkedTrackColor = accent.copy(alpha = 0.4f)),
        )
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
                Text("إنهاء MoPlayer2؟", color = Color.White, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
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
