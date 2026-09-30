package com.moalfarras.moplayer.ui.screens

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.speech.RecognizerIntent
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.rounded.AccountCircle
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.Cloud
import androidx.compose.material.icons.rounded.DeleteSweep
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.FolderOff
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.ImageNotSupported
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.LiveTv
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material.icons.rounded.Movie
import androidx.compose.material.icons.rounded.NetworkCheck
import androidx.compose.material.icons.rounded.Palette
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.PlayCircle
import androidx.compose.material.icons.rounded.PowerSettingsNew
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.SearchOff
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.SportsSoccer
import androidx.compose.material.icons.rounded.Storage
import androidx.compose.material.icons.rounded.SystemUpdateAlt
import androidx.compose.material.icons.rounded.TravelExplore
import androidx.compose.material.icons.rounded.Tv
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.max
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.paging.LoadState
import androidx.paging.PagingData
import androidx.paging.compose.collectAsLazyPagingItems
import androidx.paging.compose.itemContentType
import androidx.paging.compose.itemKey
import androidx.paging.insertSeparators
import androidx.paging.map
import com.moalfarras.moplayer.core.DevicePerformanceInfo
import com.moalfarras.moplayer.core.DevicePerformanceTier
import com.moalfarras.moplayer.core.PerformancePolicy
import com.moalfarras.moplayer.data.repository.AppUpdateInfo
import com.moalfarras.moplayer.data.repository.UpdateInstallResult
import com.moalfarras.moplayer.data.repository.UpdateRepository
import com.moalfarras.moplayer.domain.model.AccentMode
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.LibraryMode
import com.moalfarras.moplayer.domain.model.LoginKind
import com.moalfarras.moplayer.domain.model.ManualWeatherEffect
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.MotionLevel
import com.moalfarras.moplayer.domain.model.PerformanceMode
import com.moalfarras.moplayer.domain.model.ServerProfile
import com.moalfarras.moplayer.domain.model.SortOption
import com.moalfarras.moplayer.domain.model.ThemePreset
import com.moalfarras.moplayer.domain.model.VideoSizeMode
import com.moalfarras.moplayer.domain.model.WeatherMode
import com.moalfarras.moplayer.ui.components.ChannelRow
import com.moalfarras.moplayer.ui.components.FocusGlow
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.components.TvTextField
import com.moalfarras.moplayer.ui.components.readableSp
import com.moalfarras.moplayer.ui.components.rememberTvTextFieldController
import com.moalfarras.moplayer.ui.i18n.ArStrings
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.SearchStrings
import com.moalfarras.moplayer.ui.i18n.SettingsStrings
import com.moalfarras.moplayer.ui.i18n.Strings
import com.moalfarras.moplayer.ui.i18n.isolate
import com.moalfarras.moplayer.ui.i18n.ltr
import com.moalfarras.moplayer.ui.i18n.search
import com.moalfarras.moplayer.ui.i18n.settings
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.MoAccentPresets
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import com.moalfarras.moplayerpro.BuildConfig
import com.moalfarras.moplayerpro.R
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

/** Bottom inset on TV screens that have no dock (Search, Settings): the 5% overscan margin. */
private val TV_SCREEN_BOTTOM = 27.dp
private val TV_SCREEN_HORIZONTAL = 48.dp

// ── Search ────────────────────────────────────────────────────────────────

private sealed interface SearchRow {
    val key: String

    data class Result(val item: MediaItem) : SearchRow {
        override val key: String get() = "${item.type}-${item.serverId}-${item.id}"
    }

    data class Header(val type: ContentType, val more: Boolean, override val key: String) : SearchRow
}

internal data class SearchSection(val type: ContentType, val more: Boolean)

private fun ContentType.searchRank(): Int = when (this) {
    ContentType.LIVE -> 0
    ContentType.MOVIE -> 1
    ContentType.SERIES -> 2
    ContentType.EPISODE -> 3
}

/**
 * Section header to show between two consecutive results, or null. A header starts every run of
 * one content type. When the list returns to an earlier type (results sorted by match quality
 * first, then type) the repeated section is labelled as "more matches".
 */
internal fun searchSectionBetween(before: ContentType?, after: ContentType?): SearchSection? {
    if (after == null || before == after) return null
    val more = before != null && before.searchRank() > after.searchRank()
    return SearchSection(after, more)
}

private fun PagingData<MediaItem>.toSearchRows(): PagingData<SearchRow> =
    map<MediaItem, SearchRow> { SearchRow.Result(it) }
        .insertSeparators { before, after ->
            val next = after as? SearchRow.Result ?: return@insertSeparators null
            val section = searchSectionBetween((before as? SearchRow.Result)?.item?.type, next.item.type)
                ?: return@insertSeparators null
            SearchRow.Header(section.type, section.more, "section-${next.key}")
        }

private fun SearchStrings.sectionLabel(type: ContentType): String = when (type) {
    ContentType.LIVE -> sectionLive
    ContentType.MOVIE -> sectionMovies
    ContentType.SERIES -> sectionSeries
    ContentType.EPISODE -> sectionEpisodes
}

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
    val strings = LocalStrings.current
    val search = strings.search
    val focusManager = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current
    val rowsFlow = remember(resultsFlow) { resultsFlow.map { it.toSearchRows() } }
    val results = rowsFlow.collectAsLazyPagingItems()
    val resultsState = rememberLazyListState()
    val searchField = rememberTvTextFieldController()
    var restoredResultOnce by remember(restoreFocusItem?.id, restoreFocusItem?.type, restoreFocusItem?.serverId, query) { mutableStateOf(false) }
    val restoreIndex = remember(results.itemCount, restoreFocusItem) {
        restoreFocusItem?.let { target ->
            (0 until results.itemCount).firstOrNull { (results.peek(it) as? SearchRow.Result)?.item.sameMedia(target) }
        }
    }
    LaunchedEffect(restoreIndex, query) {
        if (restoreIndex != null && !restoredResultOnce) {
            resultsState.scrollToItem(restoreIndex)
            restoredResultOnce = true
        }
    }
    // On entry focus the search row (keyboard stays closed until OK), unless returning from the
    // player to a result. Runs once, so clearing the text while typing never steals focus.
    LaunchedEffect(Unit) {
        if (restoreFocusItem == null) {
            delay(120)
            searchField.focus()
        }
    }

    val voiceLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val spokenText = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.firstOrNull()
            if (!spokenText.isNullOrBlank()) onQuery(spokenText)
        }
    }
    val startVoiceSearch = {
        runCatching {
            voiceLauncher.launch(
                Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_PROMPT, search.voicePrompt)
                    if (strings === ArStrings) putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ar")
                },
            )
        }
        Unit
    }

    val searchHeroHeight = when {
        tv.isTv -> 220.dp
        tv.isLowHeightLandscape -> 96.dp
        tv.isCompact -> 140.dp
        else -> 180.dp
    }
    val horizontalPadding = if (tv.isTv) max(tv.contentPadding, TV_SCREEN_HORIZONTAL) else tv.contentPadding
    val trimmedQuery = query.trim()

    Box(Modifier.fillMaxSize()) {
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
                .background(Brush.verticalGradient(listOf(visuals.accent.copy(alpha = 0.12f), Color.Transparent))),
        )

        Column(
            Modifier
                .fillMaxSize()
                .padding(
                    start = horizontalPadding,
                    top = tv.contentPadding * 0.8f,
                    end = horizontalPadding,
                    bottom = if (tv.isTv) TV_SCREEN_BOTTOM else tv.bottomBarHeight + 8.dp,
                ),
            verticalArrangement = Arrangement.spacedBy(if (tv.isTv) 14.dp else (18 * tv.factor).dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Icon(
                    Icons.Rounded.Search,
                    null,
                    tint = visuals.accent,
                    modifier = Modifier.size(if (tv.isTv) 28.dp else ((if (tv.isLowHeightLandscape) 22f else 32f) * tv.factor).dp),
                )
                Text(
                    strings.navSearch,
                    color = Color.White,
                    style = if (tv.isTv || tv.isLowHeightLandscape) MaterialTheme.typography.headlineMedium else MaterialTheme.typography.displayMedium,
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                TvTextField(
                    value = query,
                    onValueChange = onQuery,
                    label = search.placeholder,
                    controller = searchField,
                    icon = Icons.Rounded.Search,
                    imeAction = ImeAction.Search,
                    onImeAction = {
                        keyboard?.hide()
                        focusManager.moveFocus(FocusDirection.Down)
                    },
                    modifier = Modifier.weight(1f),
                )
                FocusGlow(cornerRadius = 999.dp, onClick = startVoiceSearch) {
                    Box(
                        Modifier
                            .size(48.dp)
                            .background(visuals.accent.copy(alpha = 0.16f), RoundedCornerShape(999.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Rounded.Mic, contentDescription = search.voiceSearch, tint = visuals.accent, modifier = Modifier.size(26.dp))
                    }
                }
            }

            when {
                trimmedQuery.isEmpty() && history.isNotEmpty() -> SearchHistoryPanel(history, onQuery, onClearHistory)
                trimmedQuery.isEmpty() -> SearchMessagePanel(Icons.Rounded.TravelExplore, search.emptyTitle, search.emptyBody, highlighted = true)
                trimmedQuery.length < 2 -> SearchMessagePanel(Icons.Rounded.Search, search.minChars, null, highlighted = false)
                results.itemCount == 0 && results.loadState.refresh is LoadState.NotLoading ->
                    SearchMessagePanel(Icons.Rounded.SearchOff, search.noResults(trimmedQuery), null, highlighted = false)
            }

            LazyColumn(
                state = resultsState,
                verticalArrangement = Arrangement.spacedBy((8 * tv.factor).dp),
                modifier = Modifier.focusGroup(),
            ) {
                items(
                    count = results.itemCount,
                    key = results.itemKey { it.key },
                    contentType = results.itemContentType { row ->
                        when (row) {
                            is SearchRow.Header -> "section"
                            is SearchRow.Result -> row.item.type
                        }
                    },
                ) { index ->
                    when (val row = results[index]) {
                        is SearchRow.Header -> SearchSectionHeader(row, search)
                        is SearchRow.Result -> {
                            val item = row.item
                            val focusRequester = remember(item.id, item.type, item.serverId) { FocusRequester() }
                            val shouldRestore = item.sameMedia(restoreFocusItem)
                            LaunchedEffect(shouldRestore, restoreIndex, restoredResultOnce) {
                                if (shouldRestore && restoreIndex != null && restoredResultOnce) {
                                    delay(120)
                                    runCatching { focusRequester.requestFocus() }
                                }
                            }
                            ChannelRow(item, onFocus, onPlay, onFavorite, focusRequester = focusRequester)
                        }
                        null -> Unit
                    }
                }
            }
        }
    }
}

@Composable
private fun SearchSectionHeader(row: SearchRow.Header, search: SearchStrings) {
    val visuals = LocalMoVisuals.current
    val label = search.sectionLabel(row.type)
    Text(
        if (row.more) search.moreSection(label) else label,
        color = visuals.accent,
        fontSize = 15.sp,
        fontWeight = FontWeight.ExtraBold,
        modifier = Modifier.padding(start = 6.dp, top = 8.dp, bottom = 2.dp),
    )
}

@Composable
private fun SearchHistoryPanel(history: List<String>, onQuery: (String) -> Unit, onClearHistory: () -> Unit) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val search = LocalStrings.current.search
    GlassPanel(radius = (16 * tv.factor).dp) {
        Column(
            Modifier.fillMaxWidth().padding(if (tv.isTv) 16.dp else (20 * tv.factor).dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Rounded.History, null, tint = visuals.accent)
                    Text(search.recent, color = Color.White, style = MaterialTheme.typography.titleMedium)
                }
                FocusGlow(cornerRadius = 999.dp, onClick = onClearHistory) {
                    Text(
                        search.clear,
                        color = visuals.accent,
                        style = MaterialTheme.typography.labelLarge,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                    )
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.focusGroup()) {
                history.take(6).forEach { entry ->
                    FocusGlow(cornerRadius = 10.dp, onClick = { onQuery(entry) }) {
                        GlassPanel(radius = 10.dp) {
                            Text(
                                entry.isolate(),
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

@Composable
private fun SearchMessagePanel(icon: ImageVector, title: String, body: String?, highlighted: Boolean) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    GlassPanel(radius = (18 * tv.factor).dp, highlighted = highlighted, glow = if (highlighted) visuals.accent.copy(alpha = 0.10f) else null) {
        Column(
            Modifier.fillMaxWidth().padding(if (tv.isTv) 20.dp else (24 * tv.factor).dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Icon(icon, null, tint = if (highlighted) visuals.accent else Color(0x66FFFFFF), modifier = Modifier.size(if (tv.isTv) 36.dp else (46 * tv.factor).dp))
            Text(title, color = if (highlighted) Color.White else Color(0xB3FFFFFF), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
            if (body != null) {
                Text(body, color = Color(0xB8E3BC78), style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
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

// ── Settings: shared state ───────────────────────────────────────────────

private const val SETTINGS_PANES = 7

/** Destructive settings actions wait for an explicit confirmation (default focus: Cancel). */
private sealed interface PendingSettingsAction {
    data class DeleteServer(val id: Long, val name: String) : PendingSettingsAction
    data class RemoveActive(val name: String) : PendingSettingsAction
    data object ClearHistory : PendingSettingsAction
}

internal enum class PinEntryIssue { Length, Mismatch }

/** Feedback while a new PIN is typed twice; null when there is nothing to point out yet. */
internal fun pinEntryIssue(pin: String, confirm: String): PinEntryIssue? = when {
    confirm.isNotEmpty() && (confirm.length > pin.length || !pin.startsWith(confirm)) -> PinEntryIssue.Mismatch
    pin.isNotEmpty() && pin.length < 4 -> PinEntryIssue.Length
    else -> null
}

internal fun canSavePin(pin: String, confirm: String): Boolean =
    pin.length in 4..8 && pin.all(Char::isDigit) && pin == confirm

/** Provider status in the app language; unknown panel values are shown as sent. */
internal fun localizedAccountStatus(raw: String, strings: SettingsStrings): String = when (raw.trim().lowercase()) {
    "", "active" -> strings.statusActive
    "expired" -> strings.statusExpired
    "banned" -> strings.statusBanned
    "disabled" -> strings.statusDisabled
    else -> raw.trim().isolate()
}

/** Whole days until [expiryDate] (seconds or milliseconds since the epoch), never negative. */
internal fun daysUntil(expiryDate: Long, nowMs: Long): Long {
    val expiryMs = if (expiryDate < 100_000_000_000L) expiryDate * 1000L else expiryDate
    return ((expiryMs - nowMs) / 86_400_000L).coerceAtLeast(0L)
}

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
    onVideoSizeMode: (VideoSizeMode) -> Unit,
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
    // Appended LAST on purpose: MainActivity invokes SettingsScreen positionally with ~43 args and
    // the list has runs of same-typed (Boolean) -> Unit callbacks — a mid-list insertion would still
    // compile with every later switch silently wired to the wrong setting.
    onShowTrailerPreviews: (Boolean) -> Unit,
    /** Provider-side account creation time (ms) for a server id, or 0 when the panel did not send one. */
    providerAccountCreatedAt: suspend (Long) -> Long = { 0L },
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val s = LocalStrings.current.settings
    val scope = rememberCoroutineScope()
    val unlocked = !settings.hasParentalPin || settingsUnlocked
    var selectedPane by rememberSaveable { mutableIntStateOf(0) }
    val paneFocus = remember { List(SETTINGS_PANES) { FocusRequester() } }
    var pending by remember { mutableStateOf<PendingSettingsAction?>(null) }
    val focusCurrentPane: () -> Unit = {
        if (tv.isTv) {
            scope.launch {
                delay(300)
                runCatching { paneFocus[selectedPane].requestFocus() }
            }
        }
    }

    val horizontalPadding = if (tv.isTv) max(tv.contentPadding, TV_SCREEN_HORIZONTAL) else tv.contentPadding
    val contentModifier = Modifier
        .fillMaxSize()
        .padding(
            start = horizontalPadding,
            top = tv.contentPadding,
            end = horizontalPadding,
            bottom = if (tv.isTv) TV_SCREEN_BOTTOM else tv.bottomBarHeight,
        )

    val settingsHeroHeight = when {
        tv.isTv -> 240.dp
        tv.isLowHeightLandscape -> 100.dp
        tv.isCompact -> 160.dp
        else -> 200.dp
    }
    val panes = SettingsPaneCallbacks(
        onPreview = onPreview,
        onParental = onParental,
        onAutoPlayLastLive = onAutoPlayLastLive,
        onHideEmptyCategories = onHideEmptyCategories,
        onHideChannelsWithoutLogo = onHideChannelsWithoutLogo,
        onShowTrailerPreviews = onShowTrailerPreviews,
        onPlayer = onPlayer,
        onVideoSizeMode = onVideoSizeMode,
        onLibraryMode = onLibraryMode,
        onSort = onSort,
        onRefresh = onRefresh,
        onTestConnection = onTestConnection,
        onClearEpgCache = onClearEpgCache,
        onLockSettings = onLockSettings,
        onSetParentalPin = onSetParentalPin,
        onChangeParentalPin = onChangeParentalPin,
        onRemoveParentalPin = onRemoveParentalPin,
        onActivateServer = onActivateServer,
        onRequestDelete = { server -> pending = PendingSettingsAction.DeleteServer(server.id, server.name) },
        onRequestRemoveActive = { server -> pending = PendingSettingsAction.RemoveActive(server.name) },
        onRequestClearHistory = { pending = PendingSettingsAction.ClearHistory },
        providerAccountCreatedAt = providerAccountCreatedAt,
        focusCurrentPane = focusCurrentPane,
    )
    val appearance: @Composable (Boolean) -> Unit = { isTv ->
        AppearanceSettingsCard(
            settings = settings,
            isTv = isTv,
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

    Box(Modifier.fillMaxSize()) {
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
                .background(Brush.verticalGradient(listOf(visuals.accent.copy(alpha = 0.10f), Color.Transparent))),
        )

        if (!tv.isTv) {
            // Phones and tablets: the same groups as the TV panes, in one scroll. Everything except
            // the lock card stays hidden while a PIN is set and settings are locked.
            LazyColumn(contentModifier.imePadding(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                item { SettingsHeader() }
                if (!unlocked) {
                    item { LockedSettingsCard(isTv = false, onUnlock = onUnlockSettings) }
                } else {
                    item { SettingsGroupTitle(Icons.Rounded.Palette, LocalStrings.current.paneLookHome) }
                    item { appearance(false) }
                    item { SettingsGroupTitle(Icons.Rounded.PlayCircle, LocalStrings.current.panePlayback) }
                    item { PlaybackSettings(settings, isTv = false, panes = panes) }
                    item { SettingsGroupTitle(Icons.Rounded.LiveTv, LocalStrings.current.navLive) }
                    item { LiveTvSettings(settings, isTv = false, panes = panes) }
                    item { SettingsGroupTitle(Icons.Rounded.AccountCircle, LocalStrings.current.paneAccounts) }
                    item { AccountsSettings(activeServer, servers, isTv = false, panes = panes) }
                    item { SettingsGroupTitle(Icons.Rounded.Storage, LocalStrings.current.paneStorage) }
                    item { StorageSettings(hasAccount = activeServer != null, isTv = false, panes = panes) }
                    item { SettingsGroupTitle(Icons.Rounded.Lock, LocalStrings.current.paneFamilyLock) }
                    item { FamilyLockSettings(settings, isTv = false, panes = panes) }
                    item { SettingsGroupTitle(Icons.Rounded.Info, LocalStrings.current.paneAbout) }
                    item { AboutCard(isTv = false) }
                }
            }
        } else {
            TvSettingsLayout(
                modifier = contentModifier,
                settings = settings,
                unlocked = unlocked,
                selectedPane = selectedPane,
                onSelectPane = { selectedPane = it },
                paneFocus = paneFocus,
                activeServer = activeServer,
                servers = servers,
                performancePolicy = performancePolicy,
                onUnlockSettings = onUnlockSettings,
                panes = panes,
                appearance = { appearance(true) },
            )
        }
    }

    pending?.let { action ->
        val (title, body, confirmLabel) = when (action) {
            is PendingSettingsAction.DeleteServer -> Triple(s.confirmDeleteTitle(action.name), s.confirmDeleteBody, s.actionDelete)
            is PendingSettingsAction.RemoveActive -> Triple(s.confirmRemoveTitle(action.name), s.confirmRemoveBody, s.actionRemove)
            PendingSettingsAction.ClearHistory -> Triple(s.confirmClearHistoryTitle, s.confirmClearHistoryBody, s.actionClear)
        }
        ConfirmActionDialog(
            title = title,
            message = body,
            confirmLabel = confirmLabel,
            onDismiss = { pending = null },
            onConfirm = {
                pending = null
                when (action) {
                    is PendingSettingsAction.DeleteServer -> onDeleteServer(action.id)
                    is PendingSettingsAction.RemoveActive -> onLogout()
                    PendingSettingsAction.ClearHistory -> onClearWatchHistory()
                }
                // The focused row disappears once the account list updates; park focus on the pane.
                if (action !is PendingSettingsAction.ClearHistory) focusCurrentPane()
            },
        )
    }
}

/** Callbacks shared by the TV panes and the phone groups. */
private class SettingsPaneCallbacks(
    val onPreview: (Boolean) -> Unit,
    val onParental: (Boolean) -> Unit,
    val onAutoPlayLastLive: (Boolean) -> Unit,
    val onHideEmptyCategories: (Boolean) -> Unit,
    val onHideChannelsWithoutLogo: (Boolean) -> Unit,
    val onShowTrailerPreviews: (Boolean) -> Unit,
    val onPlayer: (String) -> Unit,
    val onVideoSizeMode: (VideoSizeMode) -> Unit,
    val onLibraryMode: (LibraryMode) -> Unit,
    val onSort: (SortOption) -> Unit,
    val onRefresh: () -> Unit,
    val onTestConnection: () -> Unit,
    val onClearEpgCache: () -> Unit,
    val onLockSettings: () -> Unit,
    val onSetParentalPin: (String) -> Unit,
    val onChangeParentalPin: (String, String) -> Unit,
    val onRemoveParentalPin: (String) -> Unit,
    val onActivateServer: (Long) -> Unit,
    val onRequestDelete: (ServerProfile) -> Unit,
    val onRequestRemoveActive: (ServerProfile) -> Unit,
    val onRequestClearHistory: () -> Unit,
    val providerAccountCreatedAt: suspend (Long) -> Long,
    /** TV: park focus on the open pane's rail button after the focused control disappeared. */
    val focusCurrentPane: () -> Unit,
)

@Composable
private fun TvSettingsLayout(
    modifier: Modifier,
    settings: AppSettings,
    unlocked: Boolean,
    selectedPane: Int,
    onSelectPane: (Int) -> Unit,
    paneFocus: List<FocusRequester>,
    activeServer: ServerProfile?,
    servers: List<ServerProfile>,
    performancePolicy: PerformancePolicy,
    onUnlockSettings: (String) -> Unit,
    panes: SettingsPaneCallbacks,
    appearance: @Composable () -> Unit,
) {
    val strings = LocalStrings.current
    val paneListState = rememberLazyListState()
    // Enter on the pane that was open last (rememberSaveable), not always on the first one.
    LaunchedEffect(Unit) {
        delay(120)
        runCatching { paneFocus[selectedPane].requestFocus() }
    }
    LaunchedEffect(selectedPane, unlocked) {
        paneListState.scrollToItem(0)
    }
    // Unlocking or "Lock now" swaps the pane content under the focused control; keep the remote
    // on the rail instead of losing focus.
    var knownUnlocked by remember { mutableStateOf(unlocked) }
    LaunchedEffect(unlocked) {
        if (unlocked != knownUnlocked) {
            knownUnlocked = unlocked
            runCatching { paneFocus[selectedPane].requestFocus() }
        }
    }
    Row(modifier.focusGroup(), horizontalArrangement = Arrangement.spacedBy(24.dp)) {
        Column(
            modifier = Modifier.fillMaxHeight().weight(0.25f).padding(top = 8.dp).focusGroup(),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            SettingsHeader()
            Spacer(Modifier.height(8.dp))
            val paneItems = listOf(
                strings.paneLookHome to Icons.Rounded.Palette,
                strings.panePlayback to Icons.Rounded.PlayCircle,
                strings.navLive to Icons.Rounded.LiveTv,
                strings.paneAccounts to Icons.Rounded.AccountCircle,
                strings.paneStorage to Icons.Rounded.Storage,
                strings.paneFamilyLock to Icons.Rounded.Lock,
            )
            paneItems.forEachIndexed { index, (title, icon) ->
                SettingsPaneButton(title, icon, selectedPane == index, focusRequester = paneFocus[index]) { onSelectPane(index) }
            }
            Spacer(Modifier.weight(1f))
            SettingsPaneButton(strings.paneAbout, Icons.Rounded.Info, selectedPane == 6, focusRequester = paneFocus[6]) { onSelectPane(6) }
        }

        GlassPanel(
            modifier = Modifier.fillMaxHeight().weight(0.75f),
            radius = 22.dp,
            blur = 24.dp,
        ) {
            LazyColumn(
                state = paneListState,
                modifier = Modifier.fillMaxSize().imePadding().padding(horizontal = 28.dp, vertical = 22.dp).focusGroup(),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                if (!unlocked) {
                    item { LockedSettingsCard(isTv = true, onUnlock = onUnlockSettings) }
                } else {
                    item { SettingsPaneHero(selectedPane, activeServer, settings, performancePolicy) }
                    when (selectedPane) {
                        0 -> item { appearance() }
                        1 -> item { PlaybackSettings(settings, isTv = true, panes = panes) }
                        2 -> item { LiveTvSettings(settings, isTv = true, panes = panes) }
                        3 -> item { AccountsSettings(activeServer, servers, isTv = true, panes = panes) }
                        4 -> item { StorageSettings(hasAccount = activeServer != null, isTv = true, panes = panes) }
                        5 -> item { FamilyLockSettings(settings, isTv = true, panes = panes) }
                        else -> item { AboutCard(isTv = true) }
                    }
                }
            }
        }
    }
}

// ── Settings: groups ─────────────────────────────────────────────────────

/** TV panes draw straight onto the pane panel; phones wrap each group in its own glass card. */
@Composable
private fun SettingsGroup(isTv: Boolean, content: @Composable ColumnScope.() -> Unit) {
    val tv = rememberTvScale()
    if (isTv) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp), content = content)
    } else {
        GlassPanel(radius = tv.cardRadius) {
            Column(Modifier.padding(tv.panelPadding), verticalArrangement = Arrangement.spacedBy(14.dp), content = content)
        }
    }
}

@Composable
private fun SettingsGroupTitle(icon: ImageVector, title: String) {
    val visuals = LocalMoVisuals.current
    Row(
        modifier = Modifier.padding(top = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(icon, null, tint = visuals.accent, modifier = Modifier.size(22.dp))
        Text(title, color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
    }
}

@Composable
private fun PlaybackSettings(settings: AppSettings, isTv: Boolean, panes: SettingsPaneCallbacks) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        LibraryModeCard(settings.libraryMode, isTv = isTv, onLibraryMode = panes.onLibraryMode)
        PlayerSettingsCard(settings, isTv = isTv, onPlayer = panes.onPlayer, onVideoSizeMode = panes.onVideoSizeMode)
        SettingsGroup(isTv) { SortOptionRow(settings.defaultSort, compact = !isTv, onSort = panes.onSort) }
    }
}

@Composable
private fun LiveTvSettings(settings: AppSettings, isTv: Boolean, panes: SettingsPaneCallbacks) {
    val strings = LocalStrings.current
    val s = strings.settings
    SettingsGroup(isTv) {
        SectionHeader(strings.navLive)
        SettingSwitch(s.channelPreview, settings.previewEnabled, Icons.Rounded.Visibility, panes.onPreview)
        SettingSwitch(strings.setShowTrailerPreviews, settings.showTrailerPreviews, Icons.Rounded.Movie, panes.onShowTrailerPreviews)
        SettingSwitch(s.autoPlayLastLive, settings.autoPlayLastLive, Icons.Rounded.PlayArrow, panes.onAutoPlayLastLive)
        SettingSwitch(s.hideEmptyCategories, settings.hideEmptyCategories, Icons.Rounded.FolderOff, panes.onHideEmptyCategories)
        SettingSwitch(s.hideChannelsWithoutLogo, settings.hideChannelsWithoutLogo, Icons.Rounded.ImageNotSupported, panes.onHideChannelsWithoutLogo)
    }
}

@Composable
private fun AccountsSettings(activeServer: ServerProfile?, servers: List<ServerProfile>, isTv: Boolean, panes: SettingsPaneCallbacks) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        activeServer?.let { server -> ActiveServerCard(server, isTv, panes) }
        SettingsGroup(isTv) { ServerList(servers, activeServer?.id, panes) }
    }
}

@Composable
private fun StorageSettings(hasAccount: Boolean, isTv: Boolean, panes: SettingsPaneCallbacks) {
    val strings = LocalStrings.current
    val s = strings.settings
    SettingsGroup(isTv) {
        SectionHeader(strings.paneStorage)
        if (hasAccount) {
            SettingsActionCard(
                icon = Icons.Rounded.DeleteSweep,
                title = s.clearHistory,
                message = s.clearHistoryBody,
                onClick = panes.onRequestClearHistory,
            )
            SettingsActionCard(
                icon = Icons.Rounded.Tv,
                title = s.clearEpg,
                message = s.clearEpgBody,
                onClick = panes.onClearEpgCache,
            )
        } else {
            EmptySettingsMessage(icon = Icons.Rounded.Storage, title = s.nothingToClean, message = s.nothingToCleanBody)
        }
    }
}

@Composable
private fun FamilyLockSettings(settings: AppSettings, isTv: Boolean, panes: SettingsPaneCallbacks) {
    val s = LocalStrings.current.settings
    // Saving or removing the PIN replaces the card under the focused button.
    var knownHasPin by remember { mutableStateOf(settings.hasParentalPin) }
    LaunchedEffect(settings.hasParentalPin) {
        if (settings.hasParentalPin != knownHasPin) {
            knownHasPin = settings.hasParentalPin
            panes.focusCurrentPane()
        }
    }
    SettingsGroup(isTv) {
        SectionHeader(s.contentFilter)
        SettingSwitch(s.parentalFilter, settings.parentalControlsEnabled, Icons.Rounded.Lock, panes.onParental)
        PinSettingsCard(
            hasPin = settings.hasParentalPin,
            onLock = panes.onLockSettings,
            onSetPin = panes.onSetParentalPin,
            onChangePin = panes.onChangeParentalPin,
            onRemovePin = panes.onRemoveParentalPin,
        )
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
    val strings = LocalStrings.current
    val s = strings.settings
    val (icon, title, subtitle) = when (selectedPane) {
        0 -> Triple(Icons.Rounded.Palette, strings.paneLookHome, s.heroLookSubtitle)
        1 -> Triple(Icons.Rounded.PlayCircle, strings.panePlayback, s.heroPlaybackSubtitle)
        2 -> Triple(Icons.Rounded.LiveTv, strings.navLive, s.heroLiveSubtitle)
        3 -> Triple(Icons.Rounded.AccountCircle, strings.paneAccounts, activeServer?.let { s.heroAccountsActive(it.name) } ?: s.heroAccountsEmpty)
        4 -> Triple(Icons.Rounded.Storage, strings.paneStorage, s.heroStorageSubtitle)
        5 -> Triple(Icons.Rounded.Lock, strings.paneFamilyLock, if (settings.hasParentalPin) s.heroLockOn else s.heroLockOff)
        else -> Triple(Icons.Rounded.Info, strings.paneAbout, s.heroAboutSubtitle)
    }
    GlassPanel(
        modifier = Modifier.fillMaxWidth(),
        radius = 20.dp,
        blur = 18.dp,
        highlighted = true,
        glow = visuals.accent.copy(alpha = 0.13f),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Box(
                Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(visuals.accent.copy(alpha = 0.16f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, null, tint = visuals.accent, modifier = Modifier.size(24.dp))
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(title, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = tv.readableSp(23f, 20f))
                Text(subtitle, color = Color(0xCCFFFFFF), fontSize = tv.readableSp(14f, 14f), maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
            Surface(
                shape = RoundedCornerShape(999.dp),
                color = visuals.accent.copy(alpha = 0.14f),
            ) {
                Text(
                    performancePolicy.mode.label(strings),
                    color = visuals.accent,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = tv.readableSp(12f, 13f),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                )
            }
        }
    }
}

// ── Settings: building blocks ─────────────────────────────────────────────

private enum class SettingsButtonStyle { Primary, Outlined, Danger }

/** Remote-friendly button: FocusGlow ring and lift, stays focusable while disabled (clicks ignored). */
@Composable
private fun SettingsButton(
    text: String,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    enabled: Boolean = true,
    style: SettingsButtonStyle = SettingsButtonStyle.Primary,
    onClick: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    val shape = RoundedCornerShape(12.dp)
    val (background, content, border) = when (style) {
        SettingsButtonStyle.Primary -> Triple(visuals.accent, Color(0xFF1A1208), Color.Transparent)
        SettingsButtonStyle.Outlined -> Triple(Color(0x331E1914), Color.White, visuals.accent.copy(alpha = 0.45f))
        SettingsButtonStyle.Danger -> Triple(Color(0x33FF4D6D), Color(0xFFFFA3B3), Color(0x88FF4D6D))
    }
    FocusGlow(modifier = modifier, cornerRadius = 14.dp, onClick = { if (enabled) onClick() }) {
        Row(
            Modifier
                .fillMaxWidth()
                .heightIn(min = 46.dp)
                .graphicsLayer { alpha = if (enabled) 1f else 0.45f }
                .clip(shape)
                .background(background)
                .border(1.dp, border, shape)
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (icon != null) Icon(icon, null, tint = content, modifier = Modifier.size(20.dp))
            Text(text, color = content, fontSize = 15.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun SettingsActionCard(
    icon: ImageVector,
    title: String,
    message: String,
    onClick: () -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    FocusGlow(
        modifier = Modifier.fillMaxWidth(),
        cornerRadius = 18.dp,
        onClick = onClick,
    ) {
        GlassPanel(radius = 18.dp, highlighted = true, glow = visuals.accent.copy(alpha = 0.08f)) {
            Row(
                Modifier
                    .fillMaxWidth()
                    .heightIn(min = 64.dp)
                    .padding(horizontal = 18.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Box(
                    Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(visuals.accent.copy(alpha = 0.16f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(icon, null, tint = visuals.accent, modifier = Modifier.size(22.dp))
                }
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(title, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = tv.readableSp(16f, 15f))
                    Text(message, color = Color(0xB8FFFFFF), fontSize = tv.readableSp(13f, 13f), maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
                Icon(Icons.Rounded.ChevronRight, null, tint = Color(0x99FFFFFF), modifier = Modifier.size(22.dp))
            }
        }
    }
}

@Composable
private fun EmptySettingsMessage(
    icon: ImageVector,
    title: String,
    message: String,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    GlassPanel(radius = 18.dp, highlighted = true, glow = visuals.accent.copy(alpha = 0.08f)) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Icon(icon, null, tint = visuals.accent, modifier = Modifier.size(28.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(title, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = tv.readableSp(16f, 15f))
                Text(message, color = Color(0xB8FFFFFF), fontSize = tv.readableSp(13f, 13f), maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
private fun SettingsPaneButton(
    title: String,
    icon: ImageVector,
    selected: Boolean,
    focusRequester: FocusRequester? = null,
    onClick: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    FocusGlow(
        modifier = Modifier.fillMaxWidth(),
        cornerRadius = 14.dp,
        focusRequester = focusRequester,
        onClick = onClick,
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .heightIn(min = 44.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(
                    if (selected) {
                        Brush.horizontalGradient(listOf(visuals.accent.copy(alpha = 0.34f), visuals.accent.copy(alpha = 0.10f)))
                    } else {
                        Brush.horizontalGradient(listOf(Color.Transparent, Color.Transparent))
                    },
                )
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Icon(icon, null, tint = if (selected) Color.White else Color(0xCCFFFFFF), modifier = Modifier.size(20.dp))
            Text(
                title,
                color = Color.White,
                fontWeight = if (selected) FontWeight.ExtraBold else FontWeight.Bold,
                fontSize = 14.sp,
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
        tv.isTv -> MaterialTheme.typography.headlineMedium
        tv.isLowHeightLandscape -> MaterialTheme.typography.headlineMedium
        tv.isCompact -> MaterialTheme.typography.headlineLarge
        else -> MaterialTheme.typography.displaySmall
    }
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Icon(Icons.Rounded.Settings, null, tint = visuals.accent, modifier = Modifier.size(if (tv.isTv) 26.dp else (28 * tv.factor).dp))
        Text(LocalStrings.current.navSettings, color = Color.White, style = titleStyle)
    }
}

@Composable
private fun <T> SettingsChoiceChips(items: List<Pair<T, String>>, selected: T, onSelect: (T) -> Unit) {
    val visuals = LocalMoVisuals.current
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.focusGroup()) {
        items.forEach { (value, label) ->
            val isSelected = selected == value
            FocusGlow(cornerRadius = 10.dp, onClick = { onSelect(value) }) {
                GlassPanel(radius = 10.dp, highlighted = isSelected) {
                    Text(
                        label,
                        color = if (isSelected) visuals.accent else Color.White,
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Medium),
                        fontSize = 14.sp,
                        maxLines = 1,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    )
                }
            }
        }
    }
}

// ── Settings: playback ────────────────────────────────────────────────────

@Composable
private fun PlayerSettingsCard(
    settings: AppSettings,
    isTv: Boolean = false,
    onPlayer: (String) -> Unit,
    onVideoSizeMode: (VideoSizeMode) -> Unit,
) {
    val context = LocalContext.current
    val s = LocalStrings.current.settings
    val updateRepository = remember(context) { UpdateRepository(context.applicationContext) }
    var updateInfo by remember { mutableStateOf(AppUpdateInfo()) }
    var updateStatus by remember { mutableStateOf(s.updateReady) }
    var updateProgress by remember { mutableIntStateOf(0) }
    val updateScope = rememberCoroutineScope()
    LaunchedEffect(Unit) {
        updateInfo = updateRepository.fetchUpdateInfo()
        updateStatus = updateStatusFor(updateInfo, s)
    }
    SettingsGroup(isTv) {
        SectionHeader(s.playerHeader)
        SettingsChoiceChips(
            items = listOf(
                "auto" to s.playerAuto,
                "media3" to "Media3",
                "ask" to s.playerAsk,
                "vlc" to "VLC",
                "mx" to "MX",
                "external" to s.playerExternal,
            ),
            selected = settings.preferredPlayer,
            onSelect = onPlayer,
        )
        SectionHeader(s.videoSizeHeader)
        SettingsChoiceChips(
            items = listOf(
                VideoSizeMode.AUTO to s.sizeAuto,
                VideoSizeMode.FIT to s.sizeFit,
                VideoSizeMode.FILL to s.sizeFill,
                VideoSizeMode.ZOOM to s.sizeZoom,
            ),
            selected = settings.videoSizeMode,
            onSelect = onVideoSizeMode,
        )
        SectionHeader(s.updateHeader)
        UpdateSettingsPanel(
            info = updateInfo,
            status = updateStatus,
            progress = updateProgress,
            onCheck = {
                updateScope.launch {
                    updateStatus = s.updateChecking
                    updateInfo = updateRepository.fetchUpdateInfo()
                    updateStatus = updateStatusFor(updateInfo, s)
                }
            },
            onInstall = {
                if (!updateInfo.updateAvailable) {
                    updateStatus = s.updateUpToDate
                    return@UpdateSettingsPanel
                }
                updateScope.launch {
                    updateProgress = 0
                    updateStatus = s.updateDownloading
                    when (val result = updateRepository.downloadAndOpenInstaller(updateInfo) { updateProgress = it }) {
                        UpdateInstallResult.InstallerOpened -> updateStatus = s.updateInstallerOpened
                        UpdateInstallResult.InstallPermissionRequired -> updateStatus = s.updatePermissionNeeded
                        is UpdateInstallResult.Failed -> updateStatus = result.message.ifBlank { s.updateFailed }
                    }
                }
            },
            onOpenWeb = {
                runCatching { updateRepository.openDownloadInBrowser(updateInfo) }
                    .onFailure { Toast.makeText(context, s.updateOpenLinkFailed, Toast.LENGTH_LONG).show() }
            },
        )
    }
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
    val s = LocalStrings.current.settings
    GlassPanel(radius = 14.dp, highlighted = info.updateAvailable) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Rounded.SystemUpdateAlt, null, tint = accent, modifier = Modifier.size(26.dp))
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(s.updateTitle, color = Color.White, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold))
                    Text(
                        s.updateVersions(info.currentVersionName, info.latestVersionName),
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
                        s.updateNotice(info.latestVersionName),
                        color = accent,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    )
                }
            }
            if (progress in 1..99) {
                Text(s.updateDownloadingPercent(progress), color = Color.White, style = MaterialTheme.typography.labelMedium)
            }
            val details = info.apkSizeBytes?.let { s.updateDownloadSize(formatBytes(it)) }.orEmpty()
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
                    Text(s.updateCheck)
                }
                Button(onClick = onInstall, enabled = info.updateAvailable, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Rounded.Download, null)
                    Spacer(Modifier.width(8.dp))
                    Text(if (info.updateAvailable) s.updateDownloadInstall else s.updateUpToDate)
                }
                IconButton(onClick = onOpenWeb) {
                    Icon(Icons.AutoMirrored.Rounded.OpenInNew, s.updateOpenInBrowser, tint = Color.White)
                }
            }
        }
    }
}

private fun formatBytes(bytes: Long): String {
    val mb = bytes / 1024.0 / 1024.0
    return "${"%.1f".format(java.util.Locale.US, mb)} MB"
}

private fun updateStatusFor(info: AppUpdateInfo, s: SettingsStrings): String =
    if (info.updateAvailable) s.updateAvailable(info.latestVersionName) else s.updateUpToDate

@Composable
private fun LibraryModeCard(
    selected: LibraryMode,
    isTv: Boolean = false,
    onLibraryMode: (LibraryMode) -> Unit,
) {
    val visuals = LocalMoVisuals.current
    val s = LocalStrings.current.settings
    SettingsGroup(isTv) {
        SectionHeader(s.libraryHeader)
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth().focusGroup()) {
            listOf(
                LibraryMode.ACTIVE_SOURCE to s.libraryActive,
                LibraryMode.MERGED to s.libraryMerged,
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
                                fontSize = 14.sp,
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

@Composable
private fun SortOptionRow(selected: SortOption, compact: Boolean, onSort: (SortOption) -> Unit) {
    val s = LocalStrings.current.settings
    SectionHeader(s.sortHeader)
    val options = listOf(
        SortOption.SERVER_ORDER to s.sortServer,
        SortOption.LATEST_ADDED to s.sortLatest,
        SortOption.TITLE_ASC to s.sortAz,
        SortOption.TITLE_DESC to s.sortZa,
        SortOption.RECENTLY_WATCHED to s.sortRecent,
        SortOption.FAVORITES_FIRST to s.sortFavorites,
        SortOption.RATING to s.sortRating,
    ).filterNot { (value, _) ->
        compact && (value == SortOption.RECENTLY_WATCHED || value == SortOption.FAVORITES_FIRST || value == SortOption.RATING)
    }
    // Seven options do not fit one TV row next to the rail: split into two rows.
    options.chunked(4).forEach { row ->
        SettingsChoiceChips(items = row, selected = selected, onSelect = onSort)
    }
}

// ── Settings: appearance ──────────────────────────────────────────────────

@Composable
private fun AppearanceSubsection(title: String, description: String? = null) {
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            title,
            color = Color.White,
            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
            fontSize = 15.sp,
        )
        if (!description.isNullOrBlank()) {
            Text(
                description,
                color = Color(0xB3FFFFFF),
                style = MaterialTheme.typography.bodySmall,
                fontSize = 13.sp,
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
    val strings = LocalStrings.current
    val s = strings.settings
    var city by remember(settings.weatherCityOverride) { mutableStateOf(settings.weatherCityOverride) }
    var customUrl by remember(settings.customBackgroundUrl) { mutableStateOf(settings.customBackgroundUrl) }
    SettingsGroup(isTv) {
        SectionHeader(strings.secAppearance)

        AppearanceLabeledChoiceRow(
            title = strings.settingsLanguageTitle,
            hint = strings.settingsLanguageHint,
            items = listOf(
                "system" to strings.langSystem,
                "en" to strings.langEnglish,
                "ar" to strings.langArabic,
            ),
            selected = settings.languageTag,
            onSelected = onLanguage,
        )

        AppearanceLabeledChoiceRow(
            title = strings.setInterfaceTheme,
            hint = strings.descTheme,
            items = listOf(
                ThemePreset.CINEMATIC_AUTO to strings.themeCinematic,
                ThemePreset.CITY to strings.themeCity,
                ThemePreset.CALM to strings.themeCalm,
            ),
            selected = settings.themePreset,
            onSelected = onThemePreset,
        )

        AppearanceLabeledChoiceRow(
            title = strings.setBackgroundSource,
            hint = strings.descBgSource,
            items = listOf(
                BackgroundMode.AUTO to strings.bgAutoCity,
                BackgroundMode.DYNAMIC_CONTENT to strings.bgDynamicPoster,
                BackgroundMode.CITY_ROTATION to strings.bgDailyCity,
                BackgroundMode.CUSTOM_URL to strings.bgUrl,
                BackgroundMode.NONE to strings.bgNoImage,
            ),
            selected = settings.backgroundMode,
            onSelected = onBackgroundMode,
        )

        if (settings.backgroundMode == BackgroundMode.CUSTOM_URL) {
            AppearanceSubsection(title = s.imageUrlTitle, description = s.imageUrlHint)
            TvTextField(
                value = customUrl,
                onValueChange = {
                    customUrl = it
                    onCustomBackgroundUrl(it)
                },
                label = s.urlLabel,
                icon = Icons.Rounded.Language,
                keyboardType = KeyboardType.Uri,
                imeAction = ImeAction.Done,
            )
        }

        AppearanceLabeledChoiceRow(
            title = strings.setBackgroundMotion,
            hint = strings.descMotion,
            items = listOf(
                MotionLevel.LOW to strings.motionLow,
                MotionLevel.BALANCED to strings.motionBalanced,
                MotionLevel.RICH to strings.motionRich,
            ),
            selected = settings.motionLevel,
            onSelected = onMotionLevel,
        )

        SectionHeader(strings.secPerformance)
        AppearanceSubsection(
            title = s.deviceProfileTitle,
            description = s.deviceProfileBody(
                devicePerformanceInfo.displayQualityLabel,
                "${devicePerformanceInfo.displayMaxWidth}x${devicePerformanceInfo.displayMaxHeight}",
                performancePolicy.mode.label(strings),
                performancePolicy.maxVideoHeight,
            ),
        )
        AppearanceLabeledChoiceRow(
            title = strings.setPerformanceMode,
            hint = strings.descPerformance,
            items = listOf(
                PerformanceMode.AUTO to strings.perfAuto,
                PerformanceMode.PERFORMANCE to strings.perfPerformance,
                PerformanceMode.BALANCED to strings.perfBalanced,
                PerformanceMode.QUALITY to strings.perfQuality,
            ),
            selected = settings.performanceMode,
            onSelected = onPerformanceMode,
        )
        if (devicePerformanceInfo.tier == DevicePerformanceTier.LOW || performancePolicy.isPerformance) {
            Text(s.effectsReduced, color = Color.White.copy(alpha = 0.70f), fontSize = 13.sp)
        }

        SectionHeader(strings.secColors)
        AppearanceSubsection(title = strings.setAccentColor, description = strings.descAccentColor)
        Row(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.focusGroup(),
        ) {
            MoAccentPresets.forEach { preset ->
                val selected = settings.accentColor == preset.value
                FocusGlow(cornerRadius = 16.dp, onClick = { onAccentColor(preset.value) }) {
                    GlassPanel(radius = 16.dp, highlighted = selected, glow = preset.color.copy(alpha = if (selected) 0.34f else 0.10f)) {
                        Column(
                            modifier = Modifier
                                .width(if (isTv) 76.dp else 64.dp)
                                .padding(horizontal = 6.dp, vertical = 8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                        ) {
                            Box(
                                Modifier
                                    .size(if (isTv) 34.dp else 32.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(
                                        Brush.radialGradient(
                                            listOf(Color.White.copy(alpha = 0.55f), preset.color, preset.color.copy(alpha = 0.66f)),
                                        ),
                                    )
                                    .border(1.dp, Color.White.copy(alpha = if (selected) 0.70f else 0.20f), RoundedCornerShape(12.dp)),
                            )
                            Text(
                                s.accentLabel(preset.value, preset.label),
                                color = if (selected) preset.color else Color.White.copy(alpha = 0.82f),
                                fontSize = tv.readableSp(11f, 12f),
                                fontWeight = FontWeight.ExtraBold,
                                maxLines = 1,
                            )
                        }
                    }
                }
            }
        }

        SectionHeader(s.widgetsHeader)
        AppearanceSubsection(title = strings.setHomeWidgets, description = strings.descHomeWidgets)
        SettingSwitch(s.showWeather, settings.showWeatherWidget, Icons.Rounded.Cloud, onShowWeatherWidget)
        SettingSwitch(s.showClock, settings.showClockWidget, Icons.Rounded.Schedule, onShowClockWidget)
        SettingSwitch(s.showMatches, settings.showFootballWidget, Icons.Rounded.SportsSoccer, onShowFootballWidget)
        AppearanceLabeledChoiceRow(
            title = s.weatherSource,
            hint = s.weatherSourceHint,
            items = listOf(
                WeatherMode.AUTO_IP to s.weatherAuto,
                WeatherMode.CITY to s.weatherCity,
                WeatherMode.MANUAL to s.weatherManual,
            ),
            selected = settings.weatherMode,
            onSelected = onWeatherMode,
        )
        if (settings.weatherMode == WeatherMode.CITY) {
            TvTextField(
                value = city,
                onValueChange = {
                    city = it
                    onWeatherCityOverride(it)
                },
                label = s.weatherCityLabel,
                icon = Icons.Rounded.Cloud,
                imeAction = ImeAction.Done,
            )
        }
        if (settings.weatherMode == WeatherMode.MANUAL) {
            AppearanceLabeledChoiceRow(
                title = s.weatherEffect,
                hint = s.weatherEffectHint,
                items = listOf(
                    ManualWeatherEffect.SUNNY to s.effectSunny,
                    ManualWeatherEffect.CLOUDY to s.effectCloudy,
                    ManualWeatherEffect.RAIN to s.effectRain,
                    ManualWeatherEffect.STORM to s.effectStorm,
                    ManualWeatherEffect.SNOW to s.effectSnow,
                    ManualWeatherEffect.FOG to s.effectFog,
                ),
                selected = settings.manualWeatherEffect,
                onSelected = onManualWeatherEffect,
            )
        }
        AppearanceSubsection(title = s.matchCount, description = s.matchCountHint)
        AppearanceChoiceRow(
            items = listOf(2, 4, 8).map { it to s.matchesCount(it) },
            selected = settings.footballMaxMatches,
            onSelected = onFootballMaxMatches,
        )
        SettingsButton(
            text = s.refreshWidgets,
            icon = Icons.Rounded.Refresh,
            style = SettingsButtonStyle.Outlined,
            modifier = Modifier.fillMaxWidth(),
            onClick = onRefreshWidgets,
        )
    }
}

@Composable
private fun <T> AppearanceChoiceRow(
    items: List<Pair<T, String>>,
    selected: T,
    onSelected: (T) -> Unit,
) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth().focusGroup()) {
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
    FocusGlow(cornerRadius = 12.dp, onClick = onClick, modifier = modifier.heightIn(min = 44.dp, max = 60.dp)) {
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
                    fontSize = 14.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

// ── Settings: accounts ────────────────────────────────────────────────────

@Composable
private fun ActiveServerCard(server: ServerProfile, isTv: Boolean, panes: SettingsPaneCallbacks) {
    val s = LocalStrings.current.settings
    val providerCreatedAt by produceState(0L, server.id, server.lastSyncAt) {
        value = runCatching { panes.providerAccountCreatedAt(server.id) }.getOrDefault(0L)
    }
    SettingsGroup(isTv) {
        SectionHeader(s.activeAccount)
        ServerInfoRows(server, providerCreatedAt)
        SettingsButton(s.updateLibrary, Modifier.fillMaxWidth(), icon = Icons.Rounded.Refresh, onClick = panes.onRefresh)
        Text(s.updateLibraryHint, color = Color(0x99FFFFFF), fontSize = 13.sp)
        SettingsButton(
            s.testConnection,
            Modifier.fillMaxWidth(),
            icon = Icons.Rounded.NetworkCheck,
            style = SettingsButtonStyle.Outlined,
            onClick = panes.onTestConnection,
        )
        SettingsButton(
            s.removeFromDevice,
            Modifier.fillMaxWidth(),
            icon = Icons.Rounded.DeleteSweep,
            style = SettingsButtonStyle.Danger,
            onClick = { panes.onRequestRemoveActive(server) },
        )
    }
}

@Composable
private fun ServerList(
    servers: List<ServerProfile>,
    activeServerId: Long?,
    panes: SettingsPaneCallbacks,
) {
    val visuals = LocalMoVisuals.current
    val s = LocalStrings.current.settings
    SectionHeader(s.savedAccounts)
    if (servers.isEmpty()) {
        Text(s.noSavedAccounts, color = Color(0xB8E3BC78), fontSize = 14.sp)
        return
    }
    servers.forEach { server ->
        val isActive = server.id == activeServerId
        GlassPanel(radius = 12.dp, highlighted = isActive) {
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp)
                    .focusGroup(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Column(Modifier.weight(1f)) {
                    Text(
                        server.name.isolate(),
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    val kind = if (server.kind == LoginKind.XTREAM) "Xtream" else "M3U"
                    Text(
                        "$kind • ${server.host.ifBlank { server.baseUrl.maskHost() }}".ltr(),
                        color = Color(0x99FFFFFF),
                        fontSize = 13.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                FocusGlow(cornerRadius = 10.dp, onClick = { panes.onActivateServer(server.id) }) {
                    Text(
                        if (isActive) s.activeBadge else s.useAccount,
                        color = visuals.accent,
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                        fontSize = 14.sp,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                    )
                }
                // Extra gap so one overshoot on the remote does not land on Delete.
                Spacer(Modifier.width(16.dp))
                FocusGlow(cornerRadius = 10.dp, onClick = { panes.onRequestDelete(server) }) {
                    Text(
                        s.deleteAccount,
                        color = Color(0xFFFF6680),
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                        fontSize = 14.sp,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun ServerInfoRows(server: ServerProfile, providerCreatedAt: Long) {
    val s = LocalStrings.current.settings
    val visuals = LocalMoVisuals.current
    val valueColor = Color.White
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        ServerInfoRow(s.infoServer, server.host.ifBlank { server.baseUrl.maskHost() }.ltr(), valueColor)
        ServerInfoRow(s.infoUsername, server.username.maskUsername().ltr(), valueColor)
        ServerInfoRow(s.infoLoginType, if (server.kind == LoginKind.XTREAM) "Xtream Codes" else "M3U / M3U8", valueColor)
        val statusActive = server.accountStatus.isBlank() || server.accountStatus.lowercase().contains("active")
        ServerInfoRow(s.infoStatus, localizedAccountStatus(server.accountStatus, s), if (statusActive) Color(0xFF7CFFB2) else Color(0xFFFF6B6B))
        if (server.maxConnections > 0) {
            ServerInfoRow(s.infoConnections, "${server.activeConnections}/${server.maxConnections}".ltr(), valueColor)
        }
        if (server.expiryDate > 0) {
            val daysLeft = daysUntil(server.expiryDate, System.currentTimeMillis())
            val expiryColor = when {
                daysLeft <= 3 -> Color(0xFFFF6B6B)
                daysLeft <= 14 -> Color(0xFFFFD166)
                else -> Color(0xFF7CFFB2)
            }
            val expiryMs = if (server.expiryDate < 100_000_000_000L) server.expiryDate * 1000L else server.expiryDate
            ServerInfoRow(s.infoExpires, "${expiryMs.formatTimestamp().ltr()}  (${s.daysLeft(daysLeft)})", expiryColor)
        }
        if (providerCreatedAt > 0) {
            ServerInfoRow(s.infoAccountCreated, providerCreatedAt.formatTimestamp().ltr(), valueColor)
        }
        if (server.createdAt > 0) {
            ServerInfoRow(s.infoAddedToDevice, server.createdAt.formatTimestamp().ltr(), valueColor)
        }
        if (server.lastSyncAt > 0) {
            ServerInfoRow(s.infoLastUpdate, server.lastSyncAt.formatTimestamp().ltr(), valueColor)
        }
        if (server.timezone.isNotBlank()) {
            ServerInfoRow(s.infoTimeZone, server.timezone.ltr(), valueColor)
        }
        if (server.allowedOutputFormats.isNotEmpty()) {
            ServerInfoRow(s.infoFormats, server.allowedOutputFormats.joinToString(" • ") { it.uppercase() }.ltr(), visuals.accent)
        }
        if (server.serverMessage.isNotBlank()) {
            Spacer(Modifier.height(4.dp))
            GlassPanel(radius = 10.dp, modifier = Modifier.fillMaxWidth()) {
                Row(Modifier.padding(10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Info, null, tint = visuals.accent, modifier = Modifier.size(16.dp))
                    Text(server.serverMessage.isolate(), color = Color(0xCCE3BC78), fontSize = 13.sp, maxLines = 3, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
}

@Composable
private fun ServerInfoRow(label: String, value: String, valueColor: Color) {
    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, color = Color(0x99FFFFFF), fontSize = 13.sp, maxLines = 1)
        Text(
            value.ifBlank { "-" },
            color = valueColor,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.End,
            modifier = Modifier.weight(1f),
        )
    }
}

// ── Settings: family lock ─────────────────────────────────────────────────

@Composable
private fun PinField(
    label: String,
    value: String,
    imeAction: ImeAction = ImeAction.Next,
    onImeAction: (() -> Unit)? = null,
    onValueChange: (String) -> Unit,
) {
    TvTextField(
        value = value,
        onValueChange = { onValueChange(it.filter(Char::isDigit).take(8)) },
        label = label,
        icon = Icons.Rounded.Lock,
        keyboardType = KeyboardType.NumberPassword,
        imeAction = imeAction,
        onImeAction = onImeAction,
        password = true,
    )
}

@Composable
private fun PinIssueText(pin: String, confirm: String) {
    val s = LocalStrings.current.settings
    val issue = pinEntryIssue(pin, confirm) ?: return
    Text(
        if (issue == PinEntryIssue.Mismatch) s.pinMismatch else s.pinLength,
        color = if (issue == PinEntryIssue.Mismatch) Color(0xFFFF8FA3) else Color(0xCCE3BC78),
        fontSize = 13.sp,
    )
}

@Composable
private fun LockedSettingsCard(isTv: Boolean = false, onUnlock: (String) -> Unit) {
    val context = LocalContext.current
    val s = LocalStrings.current.settings
    var pin by remember { mutableStateOf("") }
    var showRecovery by remember { mutableStateOf(false) }
    val unlock = {
        if (pin.length >= 4) {
            onUnlock(pin)
            pin = ""
        }
    }
    SettingsGroup(isTv) {
        SectionHeader(s.lockTitle)
        Text(s.lockBody, color = Color.White, fontSize = 15.sp)
        PinField(s.pinLabel, pin, imeAction = ImeAction.Done, onImeAction = unlock) { pin = it }
        SettingsButton(s.unlock, Modifier.fillMaxWidth(), icon = Icons.Rounded.Lock, enabled = pin.length >= 4, onClick = unlock)
        SettingsButton(
            s.forgotPin,
            Modifier.fillMaxWidth(),
            style = SettingsButtonStyle.Outlined,
            onClick = { showRecovery = !showRecovery },
        )
        if (showRecovery) {
            Text(s.forgotPinBody, color = Color(0xCCE3BC78), fontSize = 14.sp, lineHeight = 20.sp)
            SettingsButton(
                s.openAppSettings,
                Modifier.fillMaxWidth(),
                icon = Icons.AutoMirrored.Rounded.OpenInNew,
                style = SettingsButtonStyle.Outlined,
                onClick = { openAppDetails(context) },
            )
        }
    }
}

private fun openAppDetails(context: Context) {
    runCatching {
        context.startActivity(
            Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", context.packageName, null))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
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
    val s = LocalStrings.current.settings
    var newPin by remember { mutableStateOf("") }
    var confirmPin by remember { mutableStateOf("") }
    var currentPin by remember { mutableStateOf("") }
    var nextPin by remember { mutableStateOf("") }
    var confirmNextPin by remember { mutableStateOf("") }
    var removePin by remember { mutableStateOf("") }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        SectionHeader(s.pinHeader)
        if (!hasPin) {
            val save = {
                if (canSavePin(newPin, confirmPin)) {
                    onSetPin(newPin)
                    newPin = ""
                    confirmPin = ""
                }
            }
            PinField(s.pinNew, newPin) { newPin = it }
            PinField(s.pinConfirm, confirmPin, imeAction = ImeAction.Done, onImeAction = save) { confirmPin = it }
            PinIssueText(newPin, confirmPin)
            SettingsButton(s.pinSave, Modifier.fillMaxWidth(), icon = Icons.Rounded.Lock, enabled = canSavePin(newPin, confirmPin), onClick = save)
        } else {
            Text(s.pinProtectedInfo, color = Color.White, fontSize = 14.sp)
            val change = {
                if (currentPin.length >= 4 && canSavePin(nextPin, confirmNextPin)) {
                    onChangePin(currentPin, nextPin)
                    currentPin = ""
                    nextPin = ""
                    confirmNextPin = ""
                }
            }
            PinField(s.pinCurrent, currentPin) { currentPin = it }
            PinField(s.pinNew, nextPin) { nextPin = it }
            PinField(s.pinConfirm, confirmNextPin, imeAction = ImeAction.Done, onImeAction = change) { confirmNextPin = it }
            PinIssueText(nextPin, confirmNextPin)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SettingsButton(
                    s.pinChange,
                    Modifier.weight(1f),
                    enabled = currentPin.length >= 4 && canSavePin(nextPin, confirmNextPin),
                    onClick = change,
                )
                SettingsButton(s.pinLockNow, Modifier.weight(1f), icon = Icons.Rounded.Lock, style = SettingsButtonStyle.Outlined, onClick = onLock)
            }
            val remove = {
                if (removePin.length >= 4) {
                    onRemovePin(removePin)
                    removePin = ""
                }
            }
            PinField(s.pinRemoveCurrent, removePin, imeAction = ImeAction.Done, onImeAction = remove) { removePin = it }
            SettingsButton(
                s.pinRemove,
                Modifier.fillMaxWidth(),
                enabled = removePin.length >= 4,
                style = SettingsButtonStyle.Danger,
                onClick = remove,
            )
        }
        Text(s.pinRecoveryHint, color = Color(0xB3E3BC78), fontSize = 13.sp, lineHeight = 18.sp)
    }
}

// ── Settings: about ───────────────────────────────────────────────────────

@Composable
private fun AboutCard(isTv: Boolean = false) {
    val visuals = LocalMoVisuals.current
    val s = LocalStrings.current.settings
    SettingsGroup(isTv) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Image(
                painter = painterResource(R.drawable.brand_logo_ui),
                contentDescription = null,
                modifier = Modifier.size(width = if (isTv) 84.dp else 64.dp, height = if (isTv) 56.dp else 44.dp),
            )
            Column {
                Text("MoPlayer Pro", color = Color.White, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold))
                Text("www.moalfarras.space".ltr(), color = visuals.accent, fontSize = 14.sp)
            }
        }
        Text(s.aboutBody, color = Color(0xCCE3BC78), fontSize = 14.sp, lineHeight = 20.sp)
        DiagnosticsRow(s.aboutSupport, "www.moalfarras.space")
        DiagnosticsRow(s.aboutVersion, BuildConfig.VERSION_NAME)
    }
}

@Composable
private fun DiagnosticsRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = Color(0x99FFFFFF), fontSize = 13.sp)
        Text(value.ltr(), color = Color.White, fontSize = 14.sp)
    }
}

@Composable
private fun SectionHeader(title: String) {
    val visuals = LocalMoVisuals.current
    Text(
        title,
        color = visuals.accent,
        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold),
        fontSize = 15.sp,
        modifier = Modifier.padding(top = 6.dp),
    )
}

@Composable
private fun SettingSwitch(title: String, value: Boolean, icon: ImageVector? = null, onValue: (Boolean) -> Unit) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val accent = visuals.accent
    FocusGlow(
        modifier = Modifier.fillMaxWidth(),
        cornerRadius = 16.dp,
        onClick = { onValue(!value) },
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .heightIn(min = 52.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(if (value) accent.copy(alpha = 0.10f) else visuals.surfaceHigh.copy(alpha = 0.32f))
                .padding(horizontal = 16.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (icon != null) {
                Box(
                    Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (value) accent.copy(alpha = 0.16f) else Color.White.copy(alpha = 0.06f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(icon, contentDescription = null, tint = if (value) accent else Color(0xB8FFFFFF), modifier = Modifier.size(18.dp))
                }
            }
            Text(
                title,
                color = Color.White,
                fontSize = tv.readableSp(16f, 15f),
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                modifier = Modifier.weight(1f),
            )
            Switch(
                checked = value,
                onCheckedChange = null,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = accent,
                    checkedTrackColor = accent.copy(alpha = 0.4f),
                    uncheckedThumbColor = Color(0x99FFFFFF),
                    uncheckedTrackColor = Color(0x22FFFFFF),
                ),
            )
        }
    }
}

private fun PerformanceMode.label(strings: Strings): String = when (this) {
    PerformanceMode.AUTO -> strings.perfAuto
    PerformanceMode.PERFORMANCE -> strings.perfPerformance
    PerformanceMode.BALANCED -> strings.perfBalanced
    PerformanceMode.QUALITY -> strings.perfQuality
}

// ── Dialogs ───────────────────────────────────────────────────────────────

/** Confirmation for destructive actions. Focus starts on Cancel; Back cancels. */
@Composable
private fun ConfirmActionDialog(
    title: String,
    message: String,
    confirmLabel: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
) {
    val tv = rememberTvScale()
    val strings = LocalStrings.current
    val cancelFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) {
        delay(120)
        runCatching { cancelFocus.requestFocus() }
    }
    Dialog(onDismissRequest = onDismiss) {
        GlassPanel(
            modifier = Modifier.width(if (tv.isTv) 480.dp else 360.dp),
            radius = 26.dp,
            blur = 24.dp,
            highlighted = true,
            glow = Color(0x66FF4D6D),
        ) {
            Column(
                Modifier.padding(28.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Icon(Icons.Rounded.ErrorOutline, contentDescription = null, tint = Color(0xFFFF8FA3), modifier = Modifier.size(44.dp))
                Text(
                    title,
                    color = Color.White,
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                    textAlign = TextAlign.Center,
                )
                Text(message, color = Color(0xCCFFFFFF), fontSize = 15.sp, lineHeight = 21.sp, textAlign = TextAlign.Center)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    DialogButton(strings.cancel, Modifier.weight(1f), focusRequester = cancelFocus, onClick = onDismiss)
                    DialogButton(confirmLabel, Modifier.weight(1f), danger = true, onClick = onConfirm)
                }
            }
        }
    }
}

@Composable
private fun DialogButton(
    text: String,
    modifier: Modifier,
    focusRequester: FocusRequester? = null,
    danger: Boolean = false,
    accent: Boolean = false,
    onClick: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    FocusGlow(modifier = modifier.height(52.dp), cornerRadius = 14.dp, focusRequester = focusRequester, onClick = onClick) {
        val background = when {
            danger -> Color(0xFFD7263D)
            accent -> visuals.accent
            else -> Color(0x33FFFFFF)
        }
        Box(Modifier.fillMaxSize().clip(RoundedCornerShape(12.dp)).background(background), contentAlignment = Alignment.Center) {
            Text(
                text,
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
fun ExitDialog(onDismiss: () -> Unit, onExit: () -> Unit) {
    val visuals = LocalMoVisuals.current
    val tv = rememberTvScale()
    val strings = LocalStrings.current
    val s = strings.settings
    val cancelFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) {
        delay(120)
        runCatching { cancelFocus.requestFocus() }
    }
    Dialog(onDismissRequest = onDismiss) {
        GlassPanel(
            modifier = Modifier.width(if (tv.isTv) 420.dp else 360.dp),
            radius = 28.dp,
            blur = 24.dp,
            highlighted = true,
            glow = Color(0x88FF4400),
        ) {
            Column(
                Modifier.padding(30.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .background(Brush.radialGradient(listOf(visuals.accent.copy(alpha = 0.25f), Color.Transparent))),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Rounded.PowerSettingsNew, contentDescription = null, tint = visuals.accent, modifier = Modifier.size(44.dp))
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        s.exitTitle,
                        color = Color.White,
                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                        textAlign = TextAlign.Center,
                    )
                    Text(s.exitBody, color = Color(0xCCFFFFFF), fontSize = 15.sp, textAlign = TextAlign.Center)
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    DialogButton(strings.cancel, Modifier.weight(1f), focusRequester = cancelFocus, onClick = onDismiss)
                    DialogButton(s.exitConfirm, Modifier.weight(1f), accent = true, onClick = onExit)
                }
            }
        }
    }
}

/**
 * Shown when the provider reports the subscription as expired. Focus starts on "Later"; removing
 * the account (it deletes favourites and history on this device) needs a second confirmation.
 */
@Composable
fun SubscriptionExpiredDialog(onNewSignIn: () -> Unit, onDismiss: () -> Unit) {
    val strings = LocalStrings.current
    val s = strings.settings
    val tv = rememberTvScale()
    var confirmRemove by remember { mutableStateOf(false) }
    if (confirmRemove) {
        ConfirmActionDialog(
            title = s.subscriptionConfirmTitle,
            message = s.subscriptionConfirmBody,
            confirmLabel = s.actionRemove,
            onConfirm = onNewSignIn,
            onDismiss = { confirmRemove = false },
        )
        return
    }
    val laterFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) {
        delay(120)
        runCatching { laterFocus.requestFocus() }
    }
    Dialog(onDismissRequest = onDismiss) {
        GlassPanel(
            modifier = Modifier.width(if (tv.isTv) 500.dp else 360.dp),
            radius = 28.dp,
            blur = 24.dp,
            highlighted = true,
            glow = Color(0x88FF4400),
        ) {
            Column(
                Modifier.padding(30.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .background(Brush.radialGradient(listOf(Color(0x55FF5252), Color.Transparent))),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Rounded.ErrorOutline, contentDescription = null, tint = Color(0xFFFF6B6B), modifier = Modifier.size(44.dp))
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        strings.subscriptionExpiredTitle,
                        color = Color.White,
                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                        textAlign = TextAlign.Center,
                    )
                    Text(strings.subscriptionExpiredBody, color = Color(0xCCFFFFFF), fontSize = 15.sp, lineHeight = 21.sp, textAlign = TextAlign.Center)
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    DialogButton(strings.subscriptionExpiredDismiss, Modifier.weight(1f), focusRequester = laterFocus, accent = true, onClick = onDismiss)
                    DialogButton(s.subscriptionRemoveAndSignIn, Modifier.weight(1.3f), onClick = { confirmRemove = true })
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
