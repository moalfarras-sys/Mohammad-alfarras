package com.moalfarras.moplayer.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.gestures.LocalBringIntoViewSpec
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.rounded.Send
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Casino
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.EmojiEvents
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.LiveTv
import androidx.compose.material.icons.rounded.Movie
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.SmartToy
import androidx.compose.material.icons.rounded.SportsSoccer
import androidx.compose.material.icons.rounded.VideoLibrary
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.focusRestorer
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil3.compose.AsyncImage
import com.moalfarras.moplayer.core.PerformancePolicy
import com.moalfarras.moplayer.data.repository.cleanRating
import com.moalfarras.moplayer.data.repository.isWidgetRelevant
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.FootballMatch
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.MotionLevel
import com.moalfarras.moplayer.domain.model.ServerProfile
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import com.moalfarras.moplayer.ui.components.CinematicBackdrop
import com.moalfarras.moplayer.ui.components.FocusGlow
import com.moalfarras.moplayer.ui.components.FocusScale
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.components.HomeNotificationAnnouncement
import com.moalfarras.moplayer.ui.components.HomeNotificationPhase
import com.moalfarras.moplayer.ui.components.LaneStyle
import com.moalfarras.moplayer.ui.components.LivePulseDot
import com.moalfarras.moplayer.ui.components.LocalFocusGlowFocused
import com.moalfarras.moplayer.ui.components.LocalReduceMotion
import com.moalfarras.moplayer.ui.components.MediaLane
import com.moalfarras.moplayer.ui.components.WeatherGlyph
import com.moalfarras.moplayer.ui.components.addedAtLabel
import com.moalfarras.moplayer.ui.components.backdropUrlFrom
import com.moalfarras.moplayer.ui.components.campaignTitle
import com.moalfarras.moplayer.ui.components.rememberDecorativeMotion
import com.moalfarras.moplayer.ui.components.rememberHomeNotificationPhase
import com.moalfarras.moplayer.ui.components.rememberTvBringIntoViewSpec
import com.moalfarras.moplayer.ui.components.scrollToPivotIfNeeded
import com.moalfarras.moplayer.ui.i18n.HomeStrings
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.Strings
import com.moalfarras.moplayer.ui.i18n.home
import com.moalfarras.moplayer.ui.i18n.isolate
import com.moalfarras.moplayer.ui.i18n.ltr
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import com.moalfarras.moplayerpro.R
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.roundToInt
import kotlinx.coroutines.delay

private const val HOME_SHELF_LIMIT = 15
private const val MATCH_ROTATION_MS = 8_000L
private const val HOME_NOTIFICATION_VISIBLE_MS = 14_000L

private val Gold = Color(0xFFF1CC83)
private val LiveRed = Color(0xFFFF4D5E)
private val ClockFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

/** Drop shadow applied to every hero string so it stays crisp on any backdrop — no cards needed. */
private val HeroTextShadow = Shadow(color = Color(0xB3000000), offset = Offset(0f, 2f), blurRadius = 16f)

/** Keeps the hero readable at the top and the rows readable at the bottom, over any photo. */
private val HomeReadabilityScrim = Brush.verticalGradient(
    0f to Color(0xE6070708),
    0.30f to Color(0x99070708),
    0.55f to Color(0x33070708),
    1f to Color(0xB3070708),
)

// ─────────────────────────────────────────────────────────────────────────────
// Home rows — Live TV leads (M10)
// ─────────────────────────────────────────────────────────────────────────────

internal enum class HomeRowKind { CONTINUE_LIVE, FAVORITE_CHANNELS, LIVE_TV, RESUME_VOD, LATEST_MOVIES, LATEST_SERIES, NEW_CHANNELS }

internal data class HomeRow(val kind: HomeRowKind, val items: List<MediaItem>) {
    val style: LaneStyle
        get() = when (kind) {
            HomeRowKind.CONTINUE_LIVE, HomeRowKind.FAVORITE_CHANNELS, HomeRowKind.LIVE_TV, HomeRowKind.NEW_CHANNELS -> LaneStyle.Channel
            else -> LaneStyle.Poster
        }
}

/**
 * Home row order for an IPTV app: last watched channels, favorite channels, then resumable
 * movies/series and the latest additions. A first-time user (nothing watched or favorited yet)
 * still gets a Live TV row first. The trailing channel row is only called "recently added" when
 * the source actually reports added dates.
 */
internal fun buildHomeRows(
    recentLive: List<MediaItem>,
    favoriteLive: List<MediaItem>,
    latestLive: List<MediaItem>,
    resume: List<MediaItem>,
    latestMovies: List<MediaItem>,
    latestSeries: List<MediaItem>,
    limit: Int,
): List<HomeRow> {
    val rows = mutableListOf<HomeRow>()
    val recent = recentLive.filter { it.type == ContentType.LIVE }.take(limit)
    val favorites = favoriteLive.filter { it.type == ContentType.LIVE }.take(limit)
    val live = latestLive.filter { it.type == ContentType.LIVE }.take(limit)
    val personalLive = recent.isNotEmpty() || favorites.isNotEmpty()
    if (recent.isNotEmpty()) rows += HomeRow(HomeRowKind.CONTINUE_LIVE, recent)
    if (favorites.isNotEmpty()) rows += HomeRow(HomeRowKind.FAVORITE_CHANNELS, favorites)
    if (!personalLive && live.isNotEmpty()) rows += HomeRow(HomeRowKind.LIVE_TV, live)
    resume.filter { it.type != ContentType.LIVE }.take(limit).takeIf { it.isNotEmpty() }?.let { rows += HomeRow(HomeRowKind.RESUME_VOD, it) }
    latestMovies.take(limit).takeIf { it.isNotEmpty() }?.let { rows += HomeRow(HomeRowKind.LATEST_MOVIES, it) }
    latestSeries.take(limit).takeIf { it.isNotEmpty() }?.let { rows += HomeRow(HomeRowKind.LATEST_SERIES, it) }
    if (personalLive && live.isNotEmpty()) {
        val datedAdditions = live.any { !it.addedAtUnknown && it.addedAt > 0 }
        rows += HomeRow(if (datedAdditions) HomeRowKind.NEW_CHANNELS else HomeRowKind.LIVE_TV, live)
    }
    return rows
}

private fun HomeRow.title(h: HomeStrings, strings: Strings): String = when (kind) {
    HomeRowKind.CONTINUE_LIVE -> h.rowContinueLive
    HomeRowKind.FAVORITE_CHANNELS -> h.rowFavoriteChannels
    HomeRowKind.LIVE_TV -> h.rowLiveTv
    HomeRowKind.NEW_CHANNELS -> h.rowNewChannels
    HomeRowKind.RESUME_VOD -> h.rowResumeVod
    HomeRowKind.LATEST_MOVIES -> strings.railLatestMovies
    HomeRowKind.LATEST_SERIES -> strings.railLatestSeries
}

private fun MediaItem.sameHomeItem(target: MediaItem): Boolean =
    id == target.id && type == target.type && serverId == target.serverId

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun HomeScreen(
    weather: WeatherSnapshot,
    football: List<FootballMatch>,
    continueWatching: List<MediaItem>,
    recentLive: List<MediaItem>,
    latestLive: List<MediaItem>,
    latestMovies: List<MediaItem>,
    latestSeries: List<MediaItem>,
    activeServer: ServerProfile?,
    settings: AppSettings,
    performancePolicy: PerformancePolicy,
    restoreFocusItem: MediaItem?,
    allowInitialContentFocus: Boolean,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
    accent: Color,
    syncing: Boolean = false,
    favoriteLive: List<MediaItem> = emptyList(),
    // Shared with the dock: Up from the dock requests it, and the rows' focus restorer puts the
    // remote back on the card that was focused before the user went down to the dock.
    contentFocusRequester: FocusRequester? = null,
) {
    val tv = rememberTvScale()
    val strings = LocalStrings.current
    val h = strings.home
    val rows = remember(recentLive, favoriteLive, latestLive, continueWatching, latestMovies, latestSeries) {
        buildHomeRows(recentLive, favoriteLive, latestLive, continueWatching, latestMovies, latestSeries, HOME_SHELF_LIMIT)
    }
    val hasContent = rows.isNotEmpty()
    val allContent = remember(rows) {
        rows.flatMap { it.items }.distinctBy { "${it.type}:${it.serverId}:${it.id}" }
    }

    // Initial focus is a one-shot for as long as Home stays composed: it is consumed by the first
    // focus event anywhere in the content, so later VM focus updates (which clear the restore
    // target and the dock flag) can never re-arm it and yank focus back to the first card.
    var initialFocusDone by remember { mutableStateOf(false) }
    var focusedHomeItem by remember { mutableStateOf<MediaItem?>(null) }
    val wrappedOnFocus: (MediaItem) -> Unit = { item ->
        initialFocusDone = true
        focusedHomeItem = item
        onFocus(item)
    }
    val pendingRestore = restoreFocusItem.takeIf { allowInitialContentFocus }
    val restoreRowIndex = remember(pendingRestore, rows) {
        pendingRestore?.let { target -> rows.indexOfFirst { row -> row.items.any { it.sameHomeItem(target) } }.takeIf { it >= 0 } }
    }
    val autoFocusRowIndex = if (allowInitialContentFocus && !initialFocusDone && restoreRowIndex == null && hasContent) 0 else null
    val highlightedItem = focusedHomeItem ?: rows.firstOrNull()?.items?.firstOrNull()

    var showAssistant by remember { mutableStateOf(false) }
    // The intro follows the loaded rows: Home first composes before the paging rows arrive, so an
    // intro frozen at that moment would keep announcing "0 items" for the whole visit.
    var assistantConversation by remember(h) { mutableStateOf(emptyList<AiChatMessage>()) }
    val hasMatches = football.isNotEmpty()
    val assistantChat = remember(h, allContent.size, hasMatches, assistantConversation) {
        listOf(AiChatMessage(h.assistantIntro(allContent.size, hasMatches), false)) + assistantConversation
    }
    var assistantInput by remember { mutableStateOf("") }
    var surpriseSeed by remember { mutableIntStateOf(0) }
    var assistantMode by remember { mutableStateOf(AiSuggestionMode.SURPRISE) }
    fun askAssistant(message: String) {
        val clean = message.trim()
        if (clean.isNotBlank()) {
            assistantMode = aiModeFor(clean)
            assistantConversation = assistantConversation + AiChatMessage(clean, true) + AiChatMessage(aiReplyForQuery(clean, allContent, football, h), false)
        }
    }
    val onAssistantMode: (AiSuggestionMode) -> Unit = { mode ->
        assistantMode = mode
        surpriseSeed++
        assistantConversation = assistantConversation + AiChatMessage(mode.label(h), true) + AiChatMessage(aiReplyForMode(mode, allContent, football, h), false)
    }

    val contentBackdropUrl = remember(continueWatching, latestMovies, latestSeries) {
        backdropUrlFrom(continueWatching.firstOrNull(), latestMovies.firstOrNull(), latestSeries.firstOrNull())
    }
    val selectedBackdrop = remember(settings.backgroundMode, settings.customBackgroundUrl, weather.city, contentBackdropUrl) {
        when (settings.backgroundMode) {
            BackgroundMode.AUTO,
            BackgroundMode.CUSTOM_URL,
            BackgroundMode.CITY_ROTATION -> resolveHomeBackdropUrl(settings, contentBackdropUrl = null, weather.city, allowCityFallback = true)
            BackgroundMode.DYNAMIC_CONTENT -> resolveHomeBackdropUrl(settings, contentBackdropUrl = contentBackdropUrl, weather.city, allowCityFallback = true)
            BackgroundMode.NONE -> null
        }
    }
    // Keep the photo layer strong; motion level mainly affects particles elsewhere.
    val backdropAlpha = when (settings.motionLevel) {
        MotionLevel.LOW -> 0.90f
        MotionLevel.BALANCED -> 0.96f
        MotionLevel.RICH -> 1f
    }
    val showParticles = performancePolicy.enableParticles && settings.motionLevel != MotionLevel.LOW
    val footballMatches = remember(football, settings.footballMaxMatches, settings.showFootballWidget, performancePolicy.enableWidgets) {
        if (settings.showFootballWidget && performancePolicy.enableWidgets) {
            val now = System.currentTimeMillis()
            football.filter { it.isWidgetRelevant(now) }.take(settings.footballMaxMatches.coerceIn(1, 8))
        } else {
            emptyList()
        }
    }

    // Home notifications are remote-configurable (admin campaign).
    val notificationPhase = rememberHomeNotificationPhase(settings.homeNotificationMode, settings.homeNotificationType, settings.homeNotificationTargetDate)
    var showNotification by remember(notificationPhase) { mutableStateOf(notificationPhase !is HomeNotificationPhase.Off) }
    LaunchedEffect(notificationPhase) {
        if (notificationPhase !is HomeNotificationPhase.Off) {
            delay(HOME_NOTIFICATION_VISIBLE_MS)
            showNotification = false
        }
    }
    val leadingItems = 1 + if (hasContent) 0 else 1

    CompositionLocalProvider(LocalReduceMotion provides performancePolicy.reduceMotion) {
        if (!tv.isTv) {
            // ═══════════════════════════════════════════════════════════════
            // PHONE / TABLET
            // ═══════════════════════════════════════════════════════════════
            val mobileListState = rememberLazyListState()
            LaunchedEffect(restoreRowIndex) {
                restoreRowIndex?.let { mobileListState.scrollToItem(leadingItems + it) }
            }
            Box(Modifier.fillMaxSize()) {
                CinematicBackdrop(
                    selectedBackdrop,
                    showParticles = showParticles,
                    imageSize = performancePolicy.backdropImageSize,
                    imageAlpha = backdropAlpha,
                )
                LazyColumn(
                    state = mobileListState,
                    modifier = Modifier.fillMaxSize().padding(top = tv.contentPadding),
                    contentPadding = PaddingValues(bottom = tv.bottomBarHeight + 8.dp),
                    verticalArrangement = Arrangement.spacedBy(tv.laneSpacing),
                ) {
                    item(key = "header") {
                        MobileHomeHeader(
                            weather = weather,
                            settings = settings,
                            widgetsEnabled = performancePolicy.enableWidgets,
                            onAssistant = { showAssistant = true },
                            modifier = Modifier.padding(horizontal = tv.contentPadding),
                        )
                    }
                    if (!hasContent) {
                        item(key = "empty") {
                            EmptyState(
                                title = if (syncing) strings.homeLibraryLoadingTitle else strings.homeLibraryEmptyTitle,
                                message = if (syncing) strings.homeLibraryLoadingBody else strings.homeLibraryEmptyBody,
                                modifier = Modifier.padding(horizontal = tv.contentPadding).fillMaxWidth().heightIn(min = 200.dp),
                            )
                        }
                    }
                    itemsIndexed(rows, key = { _, row -> row.kind.name }) { index, row ->
                        MediaLane(
                            title = row.title(h, strings),
                            items = row.items,
                            onFocus = wrappedOnFocus,
                            onClick = onPlay,
                            onFavorite = onFavorite,
                            style = row.style,
                            restoreFocusTarget = if (index == restoreRowIndex) pendingRestore else null,
                            contentPadding = PaddingValues(horizontal = tv.contentPadding),
                        )
                    }
                }
                HomeNotificationOverlay(
                    visible = showNotification && performancePolicy.enableWidgets,
                    phase = notificationPhase,
                    type = settings.homeNotificationType,
                    title = settings.homeNotificationTitle,
                    message = settings.homeNotificationMessage,
                    reduceMotion = performancePolicy.reduceMotion,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = tv.bottomBarHeight + 16.dp, start = 16.dp, end = 16.dp)
                        .widthIn(max = 560.dp),
                )
                if (showAssistant) {
                    MobileAssistantPanel(
                        allContent = allContent,
                        football = football,
                        seed = surpriseSeed,
                        chat = assistantChat,
                        input = assistantInput,
                        compact = tv.isCompact || tv.isLowHeightLandscape,
                        mode = assistantMode,
                        onInput = { assistantInput = it },
                        onSend = {
                            val message = assistantInput.trim()
                            if (message.isNotBlank()) {
                                askAssistant(message)
                                assistantInput = ""
                            }
                        },
                        onMode = onAssistantMode,
                        onPlay = onPlay,
                        onClose = { showAssistant = false },
                        modifier = Modifier.align(Alignment.Center),
                    )
                }
            }
            return@CompositionLocalProvider
        }

        // ═══════════════════════════════════════════════════════════════════
        // ANDROID TV — hero (focused title + status) above scrolling rows
        // ═══════════════════════════════════════════════════════════════════
        val tvListState = rememberLazyListState()
        LaunchedEffect(restoreRowIndex) {
            restoreRowIndex?.let { tvListState.scrollToPivotIfNeeded(leadingItems + it) }
        }
        Box(Modifier.fillMaxSize()) {
            CinematicBackdrop(
                selectedBackdrop,
                showParticles = showParticles,
                imageSize = performancePolicy.backdropImageSize,
                imageAlpha = backdropAlpha,
            )
            Box(Modifier.fillMaxSize().background(HomeReadabilityScrim))
            Column(Modifier.fillMaxSize()) {
                HomeHero(
                    item = highlightedItem,
                    weather = weather,
                    matches = footballMatches,
                    phase = notificationPhase,
                    campaignType = settings.homeNotificationType,
                    campaignTitleOverride = settings.homeNotificationTitle,
                    activeServer = activeServer,
                    showWeather = settings.showWeatherWidget,
                    showClock = settings.showClockWidget,
                    showWidgets = performancePolicy.enableWidgets,
                    animate = !performancePolicy.reduceMotion,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = tv.contentPadding, end = tv.contentPadding, top = tv.verticalSafePadding),
                )
                Box(Modifier.fillMaxWidth().weight(1f)) {
                    CompositionLocalProvider(LocalBringIntoViewSpec provides rememberTvBringIntoViewSpec()) {
                        LazyColumn(
                            state = tvListState,
                            // Bottom padding lets the last row scroll clear of the floating dock.
                            contentPadding = PaddingValues(top = tv.u(12f), bottom = tv.u(104f)),
                            verticalArrangement = Arrangement.spacedBy(tv.u(16f)),
                            modifier = Modifier
                                .fillMaxSize()
                                .then(
                                    if (contentFocusRequester != null) {
                                        Modifier.focusRequester(contentFocusRequester).focusRestorer().focusGroup()
                                    } else {
                                        Modifier
                                    },
                                ),
                        ) {
                            item(key = "smart-picks") {
                                Box(Modifier.fillMaxWidth().padding(horizontal = tv.contentPadding)) {
                                    SmartPicksButton(accent = accent, onClick = { showAssistant = true })
                                }
                            }
                            if (!hasContent) {
                                item(key = "empty") {
                                    EmptyState(
                                        title = if (syncing) strings.homeLibraryLoadingTitle else strings.homeLibraryEmptyTitle,
                                        message = if (syncing) strings.homeLibraryLoadingBody else strings.homeLibraryEmptyBody,
                                        modifier = Modifier.padding(horizontal = tv.contentPadding).fillMaxWidth().height(tv.u(200f)),
                                    )
                                }
                            }
                            itemsIndexed(rows, key = { _, row -> row.kind.name }) { index, row ->
                                MediaLane(
                                    title = row.title(h, strings),
                                    items = row.items,
                                    onFocus = wrappedOnFocus,
                                    onClick = onPlay,
                                    onFavorite = onFavorite,
                                    style = row.style,
                                    restoreFocusTarget = if (index == restoreRowIndex) pendingRestore else null,
                                    autoFocusFirstItem = index == autoFocusRowIndex,
                                    contentPadding = PaddingValues(horizontal = tv.contentPadding, vertical = tv.u(6f)),
                                )
                            }
                        }
                    }
                    // Soft edge where rows scroll under the hero.
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .height(tv.u(14f))
                            .background(Brush.verticalGradient(listOf(Color(0x99070708), Color.Transparent))),
                    )
                }
            }
            if (showAssistant) {
                TvAssistantDialog(
                    picks = remember(allContent, football, surpriseSeed, assistantMode) { aiPicks(allContent, football, surpriseSeed, assistantMode) },
                    latestMoviesCount = latestOfType(allContent, ContentType.MOVIE).size,
                    latestSeriesCount = allContent.count { it.type == ContentType.SERIES || it.type == ContentType.EPISODE }.coerceAtMost(3),
                    lastReply = assistantChat.lastOrNull { !it.mine }?.text.orEmpty(),
                    onMode = onAssistantMode,
                    onPlay = { item ->
                        showAssistant = false
                        onPlay(item)
                    },
                    onClose = { showAssistant = false },
                )
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TV hero
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun HomeHero(
    item: MediaItem?,
    weather: WeatherSnapshot,
    matches: List<FootballMatch>,
    phase: HomeNotificationPhase,
    campaignType: String,
    campaignTitleOverride: String,
    activeServer: ServerProfile?,
    showWeather: Boolean,
    showClock: Boolean,
    showWidgets: Boolean,
    animate: Boolean,
    modifier: Modifier = Modifier,
) {
    val tv = rememberTvScale()
    val strings = LocalStrings.current
    val h = strings.home
    val showWeatherCluster = showClock || (showWeather && weather.hasRealWeather)
    CompositionLocalProvider(LocalTextStyle provides LocalTextStyle.current.copy(shadow = HeroTextShadow)) {
        Row(modifier, verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(tv.u(24f))) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(tv.u(4f))) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(tv.u(10f))) {
                    Image(
                        painter = painterResource(R.drawable.ic_brand_mark),
                        contentDescription = "MoPlayer Pro",
                        contentScale = ContentScale.Fit,
                        modifier = Modifier.height(tv.u(26f)),
                    )
                    Box(Modifier.width(1.dp).height(tv.u(14f)).background(Color.White.copy(alpha = 0.30f)))
                    Text(
                        heroKicker(item, h),
                        color = Gold,
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.ExtraBold, letterSpacing = latinTracking(1.4f)),
                        maxLines = 1,
                    )
                }
                Text(
                    item?.title?.takeIf { it.isNotBlank() } ?: h.heroWelcome,
                    color = Color.White,
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    heroMeta(item, h, strings),
                    color = Color.White.copy(alpha = 0.80f),
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(tv.u(6f))) {
                if (showWidgets && showWeatherCluster) {
                    HeroWeatherClock(weather, showWeather, showClock, animate)
                }
                AccountSummaryLine(activeServer)
                if (showWidgets) {
                    when {
                        matches.isNotEmpty() -> FootballWidget(matches, animate)
                        phase !is HomeNotificationPhase.Off -> CampaignPill(phase, campaignType, campaignTitleOverride, animate)
                    }
                }
            }
        }
    }
}

/** Tracking for small caps-style labels; zero in Arabic, where letter spacing breaks cursive joining. */
@Composable
private fun latinTracking(value: Float): TextUnit =
    if (LocalLayoutDirection.current == LayoutDirection.Rtl) 0.sp else value.sp

private fun heroKicker(item: MediaItem?, h: HomeStrings): String = when (item?.type) {
    ContentType.LIVE -> h.kickerLive
    ContentType.MOVIE -> h.kickerMovie
    ContentType.SERIES -> h.kickerSeries
    ContentType.EPISODE -> h.kickerEpisode
    null -> h.rowLiveTv
}

/** One metadata line under the hero title: category + channel number, or rating/year/length/genre. */
internal fun heroMeta(item: MediaItem?, h: HomeStrings, strings: Strings): String {
    if (item == null) return h.heroWelcomeHint
    val parts = if (item.type == ContentType.LIVE) {
        listOfNotNull(
            item.categoryName.takeIf { it.isNotBlank() }?.isolate(),
            item.serverOrder.takeIf { it != Int.MAX_VALUE }?.let(h.channelNumber),
        )
    } else {
        listOfNotNull(
            item.rating.cleanRating().takeIf { it.isNotBlank() }?.let { "★ ${it.ltr()}" },
            item.releaseDate.take(4).takeIf { it.length == 4 && it.all(Char::isDigit) }?.ltr(),
            item.durationSecs.takeIf { it > 0 }?.let { formatDuration(it, h) },
            item.genre.substringBefore(',').trim().takeIf { it.isNotBlank() }?.isolate(),
            addedAtLabel(item, h.locale)?.let { "${strings.addedPrefix} $it" },
        ).take(4)
    }
    return parts.joinToString("  •  ").ifBlank { typeLabelFor(item, h) }
}

private fun typeLabelFor(item: MediaItem, h: HomeStrings): String = when (item.type) {
    ContentType.LIVE -> h.typeLive
    ContentType.MOVIE -> h.typeMovie
    ContentType.SERIES -> h.typeSeries
    ContentType.EPISODE -> h.typeEpisode
}

@Composable
private fun HeroWeatherClock(weather: WeatherSnapshot, showWeather: Boolean, showClock: Boolean, animate: Boolean) {
    val tv = rememberTvScale()
    val hasWeather = showWeather && weather.hasRealWeather
    val condColor = weatherConditionColor(weather.condition)
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(tv.u(10f))) {
        if (hasWeather) {
            WeatherGlyph(weather.condition.lowercase(), condColor, animate = animate, modifier = Modifier.size(tv.u(28f)))
            Text(
                weatherLine(weather),
                color = Color.White.copy(alpha = 0.92f),
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.widthIn(max = tv.u(170f)),
            )
        }
        if (showClock) {
            MinuteClock(
                timeZoneId = weather.timeZoneId,
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black),
            )
        }
    }
}

private fun weatherLine(weather: WeatherSnapshot): String {
    val temperature = "${weather.temperatureC.roundToInt()}°".ltr()
    val place = weather.city.ifBlank { weather.condition }
    return "$temperature · ${place.isolate()}"
}

/** Clock that ticks on minute boundaries — it never recomposes Home once per second. */
@Composable
private fun MinuteClock(timeZoneId: String, style: androidx.compose.ui.text.TextStyle, color: Color = Color.White) {
    val zone = remember(timeZoneId) { timeZoneId.toZoneId() }
    var now by remember(zone) { mutableStateOf(ZonedDateTime.now(zone)) }
    LaunchedEffect(zone) {
        while (true) {
            delay(60_000L - System.currentTimeMillis() % 60_000L + 50L)
            now = ZonedDateTime.now(zone)
        }
    }
    Text(now.format(ClockFormatter).ltr(), color = color, style = style, maxLines = 1)
}

@Composable
private fun AccountSummaryLine(server: ServerProfile?) {
    val h = LocalStrings.current.home
    val summary = remember(server, h) { server?.let { accountSummary(it, h, System.currentTimeMillis()) }.orEmpty() }
    if (summary.isBlank()) return
    Text(
        summary,
        color = Color(0xFFE3BC78),
        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        modifier = Modifier.widthIn(max = 420.dp),
    )
}

/** "Active · 45 days left · Connections 0/2", localized and bidi-safe. Blank when nothing is known. */
internal fun accountSummary(server: ServerProfile, h: HomeStrings, nowMs: Long): String {
    if (server.expiryDate <= 0 && server.maxConnections <= 0 && server.accountStatus.isBlank()) return ""
    val status = when (server.accountStatus.trim().lowercase(Locale.ROOT)) {
        "", "active" -> h.accountActive
        "expired" -> h.accountExpired
        "banned", "disabled" -> h.accountDisabled
        else -> server.accountStatus.trim().isolate()
    }
    // Same normalization as ServerProfile.subscriptionInactive: older rows may hold epoch seconds.
    val expiryMs = if (server.expiryDate in 1 until 100_000_000_000L) server.expiryDate * 1000L else server.expiryDate
    return buildList {
        add(status)
        if (expiryMs > 0) add(h.accountDaysLeft(((expiryMs - nowMs) / 86_400_000L).coerceAtLeast(0)))
        if (server.maxConnections > 0) add(h.accountConnections(server.activeConnections, server.maxConnections))
    }.joinToString("  ·  ")
}

// ─────────────────────────────────────────────────────────────────────────────
// Football widget — live / upcoming only; hidden when nothing is relevant (M9)
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun FootballWidget(matches: List<FootballMatch>, animate: Boolean) {
    val tv = rememberTvScale()
    val h = LocalStrings.current.home
    var index by remember(matches) { mutableIntStateOf(0) }
    LaunchedEffect(matches) {
        if (matches.size > 1) {
            while (true) {
                delay(MATCH_ROTATION_MS)
                index = (index + 1) % matches.size
            }
        }
    }
    val match = matches[index % matches.size]
    val motion = rememberDecorativeMotion(animate && match.isLive, "football")
    Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(tv.u(3f))) {
        Text(
            listOf(h.footballTitle, match.league.trim()).filter { it.isNotBlank() }.joinToString(" · "),
            color = Gold.copy(alpha = 0.85f),
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold, letterSpacing = latinTracking(0.6f)),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.widthIn(max = tv.u(320f)),
        )
        Crossfade(targetState = match, animationSpec = tween(if (animate) 450 else 0), label = "matchRotation") { shown ->
            FootballScoreRow(shown, motion, h)
        }
    }
}

@Composable
private fun FootballScoreRow(match: FootballMatch, motion: State<Float>?, h: HomeStrings) {
    val tv = rememberTvScale()
    val goals = remember(match.score) { parseScore(match.score) }
    Row(
        Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(Color(0xB3121014))
            .border(1.dp, Color.White.copy(alpha = 0.10f), RoundedCornerShape(999.dp))
            .padding(horizontal = tv.u(12f), vertical = tv.u(5f)),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(tv.u(8f)),
    ) {
        when {
            match.isLive -> Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                LivePulseDot(motion, Modifier.size(8.dp), color = LiveRed)
                Text(
                    listOf(h.footballLive, match.minute.takeIf { it.isNotBlank() && it != "LIVE" }?.ltr()).filterNotNull().joinToString(" "),
                    color = LiveRed,
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Black),
                    maxLines = 1,
                )
            }
            match.isFinished -> Text(h.footballFullTime, color = Color.White.copy(alpha = 0.7f), style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold), maxLines = 1)
            match.minute.isNotBlank() -> Text(match.minute.ltr(), color = Color.White.copy(alpha = 0.8f), style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold), maxLines = 1)
        }
        // Nested row: in Arabic the teams mirror, and each team's goals stay next to that team.
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(tv.u(6f))) {
            TeamCrest(match.home, match.homeBadge)
            TeamName(match.home)
            if (goals != null) {
                ScoreText(goals.first)
                ScoreText("–")
                ScoreText(goals.second)
            } else {
                Text(h.footballVersus, color = Color.White.copy(alpha = 0.8f), style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Black))
            }
            TeamName(match.away)
            TeamCrest(match.away, match.awayBadge)
        }
    }
}

/** "2-1" -> ("2", "1"); null for "", "VS" or anything that is not two numbers. */
internal fun parseScore(score: String): Pair<String, String>? {
    val parts = score.split('-', '–', ':', limit = 2).map { it.trim() }
    if (parts.size != 2 || parts.any { it.isEmpty() || !it.all(Char::isDigit) }) return null
    return parts[0] to parts[1]
}

@Composable
private fun TeamName(name: String) {
    val tv = rememberTvScale()
    Text(
        name,
        color = Color.White,
        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold),
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        modifier = Modifier.widthIn(max = tv.u(110f)),
    )
}

@Composable
private fun ScoreText(value: String) {
    Text(value, color = Color.White, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black), maxLines = 1)
}

@Composable
private fun TeamCrest(name: String, badgeUrl: String) {
    val tv = rememberTvScale()
    val initials = remember(name) {
        name.split(' ', '-', '_').filter { it.isNotBlank() }.take(2)
            .joinToString("") { it.first().uppercase() }.ifBlank { "FC" }
    }
    Box(
        Modifier
            .size(tv.u(22f))
            .clip(CircleShape)
            .background(Brush.radialGradient(listOf(Color(0x40FFFFFF), Color(0x0A000000)))),
        contentAlignment = Alignment.Center,
    ) {
        if (badgeUrl.isNotBlank()) {
            AsyncImage(model = badgeUrl, contentDescription = name, modifier = Modifier.fillMaxSize(0.8f))
        } else {
            Text(initials, color = Color.White, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Black), maxLines = 1)
        }
    }
}

@Composable
private fun CampaignPill(phase: HomeNotificationPhase, type: String, titleOverride: String, animate: Boolean) {
    val tv = rememberTvScale()
    val h = LocalStrings.current.home
    val motion = rememberDecorativeMotion(animate && phase is HomeNotificationPhase.Live, "campaign-pill")
    Row(
        Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(Color(0xB3121014))
            .border(1.dp, Gold.copy(alpha = 0.30f), RoundedCornerShape(999.dp))
            .padding(horizontal = tv.u(12f), vertical = tv.u(6f)),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(tv.u(8f)),
    ) {
        Icon(Icons.Rounded.EmojiEvents, null, tint = Gold, modifier = Modifier.size(tv.u(18f)))
        Text(
            campaignTitle(type, titleOverride, h),
            color = Color.White,
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.widthIn(max = tv.u(180f)),
        )
        when (phase) {
            is HomeNotificationPhase.Live -> Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                LivePulseDot(motion, Modifier.size(8.dp), color = LiveRed)
                Text(h.campaignLiveNow, color = LiveRed, style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Black), maxLines = 1)
            }
            is HomeNotificationPhase.Countdown -> Text(
                h.campaignStartsIn(phase.days),
                color = Gold,
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                maxLines = 1,
            )
            else -> Unit
        }
    }
}

@Composable
private fun SmartPicksButton(accent: Color, onClick: () -> Unit) {
    val tv = rememberTvScale()
    val h = LocalStrings.current.home
    FocusGlow(
        modifier = Modifier.heightIn(min = tv.u(40f)),
        cornerRadius = 999.dp,
        onClick = onClick,
        focusedScale = FocusScale.Button,
        glowElevation = 10.dp,
    ) {
        val focused = LocalFocusGlowFocused.current
        val content = if (focused) Color(0xFF15110D) else Color.White
        Row(
            Modifier
                .clip(RoundedCornerShape(999.dp))
                .background(
                    if (focused) {
                        Brush.horizontalGradient(listOf(Color.White.copy(alpha = 0.95f), Color.White.copy(alpha = 0.95f)))
                    } else {
                        Brush.horizontalGradient(listOf(accent.copy(alpha = 0.26f), Color(0xB3121014)))
                    },
                )
                .border(1.dp, if (focused) Color.Transparent else accent.copy(alpha = 0.38f), RoundedCornerShape(999.dp))
                .padding(horizontal = tv.u(14f), vertical = tv.u(8f)),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(tv.u(10f)),
        ) {
            Icon(Icons.Rounded.AutoAwesome, null, tint = if (focused) Color(0xFF15110D) else accent, modifier = Modifier.size(tv.u(18f)))
            Text(h.smartPicksTitle, color = content, style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold), maxLines = 1)
            Text(h.smartPicksSubtitle, color = content.copy(alpha = 0.72f), style = MaterialTheme.typography.labelMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Icon(Icons.AutoMirrored.Rounded.KeyboardArrowRight, null, tint = content.copy(alpha = 0.8f), modifier = Modifier.size(tv.u(18f)))
        }
    }
}

@Composable
private fun HomeNotificationOverlay(
    visible: Boolean,
    phase: HomeNotificationPhase,
    type: String,
    title: String,
    message: String,
    reduceMotion: Boolean,
    modifier: Modifier = Modifier,
) {
    AnimatedVisibility(
        visible = visible && phase !is HomeNotificationPhase.Off,
        enter = fadeIn(tween(400)) + slideInVertically(tween(450)) { it / 2 },
        exit = fadeOut(tween(350)) + slideOutVertically(tween(350)) { it / 2 },
        modifier = modifier,
    ) {
        HomeNotificationAnnouncement(
            phase = phase,
            type = type,
            titleOverride = title,
            messageOverride = message,
            animate = !reduceMotion,
            modifier = Modifier.heightIn(max = 76.dp),
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Phone header
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun MobileHomeHeader(
    weather: WeatherSnapshot,
    settings: AppSettings,
    widgetsEnabled: Boolean,
    onAssistant: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val visuals = LocalMoVisuals.current
    val h = LocalStrings.current.home
    val hasWeather = settings.showWeatherWidget && weather.hasRealWeather
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Image(
            painter = painterResource(R.drawable.ic_brand_mark),
            contentDescription = "MoPlayer Pro",
            contentScale = ContentScale.Fit,
            modifier = Modifier.height(34.dp),
        )
        Spacer(Modifier.weight(1f))
        AssistantChipButton(h.assistantTitle, Icons.Rounded.AutoAwesome, onAssistant)
        if (widgetsEnabled && (settings.showClockWidget || hasWeather)) {
            GlassPanel(radius = 16.dp) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    if (hasWeather) {
                        WeatherGlyph(weather.condition.lowercase(), weatherConditionColor(weather.condition), animate = false, modifier = Modifier.size(22.dp))
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        if (settings.showClockWidget) {
                            MinuteClock(weather.timeZoneId, MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold))
                        }
                        if (hasWeather) {
                            Text(weatherLine(weather), color = visuals.accent, style = MaterialTheme.typography.labelSmall, maxLines = 1)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AssistantChipButton(label: String, icon: ImageVector, onClick: () -> Unit) {
    val visuals = LocalMoVisuals.current
    FocusGlow(modifier = Modifier.height(40.dp), cornerRadius = 999.dp, onClick = onClick) {
        Row(
            Modifier
                .clip(RoundedCornerShape(999.dp))
                .background(visuals.accent.copy(alpha = 0.18f))
                .padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(icon, null, tint = visuals.accent, modifier = Modifier.size(18.dp))
            Text(label, color = Color.White, style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

private fun weatherConditionColor(condition: String): Color {
    val c = condition.lowercase()
    return when {
        c.contains("thunder") || c.contains("storm") -> Color(0xFF9B6BFF)
        c.contains("rain") || c.contains("drizzle") -> Color(0xFF88BBFF)
        c.contains("snow") || c.contains("blizzard") -> Color(0xFFCCE8FF)
        c.contains("fog") || c.contains("mist") -> Color(0xFFBBCCDD)
        c.contains("cloud") || c.contains("overcast") -> Color(0xFFAABBCC)
        else -> Color(0xFFFFD27A)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart picks assistant
// ─────────────────────────────────────────────────────────────────────────────

private data class AiChatMessage(val text: String, val mine: Boolean)

internal enum class AiSuggestionMode { MOVIES, SERIES, LIVE, SPORTS, CONTINUE, SURPRISE }

private fun AiSuggestionMode.label(h: HomeStrings): String = when (this) {
    AiSuggestionMode.MOVIES -> h.assistantMovies
    AiSuggestionMode.SERIES -> h.assistantSeries
    AiSuggestionMode.LIVE -> h.assistantLive
    AiSuggestionMode.SPORTS -> h.assistantSports
    AiSuggestionMode.CONTINUE -> h.assistantContinue
    AiSuggestionMode.SURPRISE -> h.assistantSurprise
}

private val ArabicDiacritics = Regex("[\\u064B-\\u0652\\u0670\\u0640]")

/** Lower-cases and folds Arabic letter variants (أإآ→ا, ة→ه, ى→ي) and strips diacritics/tatweel. */
internal fun normalizeForMatching(text: String): String =
    text.lowercase(Locale.ROOT)
        .replace(ArabicDiacritics, "")
        .replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
        .replace('ة', 'ه')
        .replace('ى', 'ي')
        .trim()

private val SportsKeywords = listOf("sport", "match", "football", "soccer", "رياضه", "مباراه", "مباريات", "كوره")
private val MovieKeywords = listOf("movie", "film", "فيلم", "افلام", "فلم")
private val SeriesKeywords = listOf("series", "episode", "مسلسل", "مسلسلات", "حلقه", "حلقات")
private val LiveKeywords = listOf("live", "channel", "مباشر", "قناه", "قنوات", "بث")
private val ContinueKeywords = listOf("continue", "watching", "resume", "تابع", "اكمل", "متابعه", "استكمل")

/** Maps a free-text question (English or Arabic) to a suggestion mode. */
internal fun aiModeFor(message: String): AiSuggestionMode {
    val query = normalizeForMatching(message)
    return when {
        SportsKeywords.any { query.contains(it) } -> AiSuggestionMode.SPORTS
        MovieKeywords.any { query.contains(it) } -> AiSuggestionMode.MOVIES
        SeriesKeywords.any { query.contains(it) } -> AiSuggestionMode.SERIES
        LiveKeywords.any { query.contains(it) } -> AiSuggestionMode.LIVE
        ContinueKeywords.any { query.contains(it) } -> AiSuggestionMode.CONTINUE
        else -> AiSuggestionMode.SURPRISE
    }
}

private fun poolFor(mode: AiSuggestionMode, content: List<MediaItem>): List<MediaItem> = when (mode) {
    AiSuggestionMode.MOVIES -> content.filter { it.type == ContentType.MOVIE }
    AiSuggestionMode.SERIES -> content.filter { it.type == ContentType.SERIES || it.type == ContentType.EPISODE }
    AiSuggestionMode.LIVE -> content.filter { it.type == ContentType.LIVE }
    AiSuggestionMode.SPORTS -> content.filter { isSportsItem(it) }
    AiSuggestionMode.CONTINUE -> content.filter { it.lastPlayedAt > 0 || it.watchPositionMs > 0 }
    AiSuggestionMode.SURPRISE -> content
}

private fun isSportsItem(item: MediaItem): Boolean {
    val text = normalizeForMatching("${item.title} ${item.categoryName} ${item.genre}")
    return text.contains("sport") || text.contains("football") || text.contains("bein") || text.contains("رياض")
}

private fun matchesReply(football: List<FootballMatch>, h: HomeStrings): String =
    if (football.isEmpty()) {
        h.assistantNoMatches
    } else {
        h.assistantTopMatches(football.take(3).joinToString(" • ") { "${it.home.isolate()} ${h.footballVersus} ${it.away.isolate()} ${it.score.ltr()}".trim() })
    }

private fun bestOf(pool: List<MediaItem>): MediaItem? =
    pool.maxByOrNull { (it.rating.toDoubleOrNull() ?: 0.0) + if (it.lastPlayedAt > 0) 1.0 else 0.0 }

/** Reply for a quick-action button: routed by the mode itself, never by re-parsing its label. */
internal fun aiReplyForMode(mode: AiSuggestionMode, content: List<MediaItem>, football: List<FootballMatch>, h: HomeStrings): String {
    if (mode == AiSuggestionMode.SPORTS && football.isNotEmpty()) return matchesReply(football, h)
    val best = bestOf(poolFor(mode, content).ifEmpty { if (mode == AiSuggestionMode.SPORTS) emptyList() else content })
    return if (best == null) {
        if (mode == AiSuggestionMode.SPORTS) matchesReply(football, h) else h.assistantNotFound
    } else {
        h.assistantSuggest(best.title, aiReason(best, h))
    }
}

/** Reply for a typed question in either language; always answers in the app language. */
internal fun aiReplyForQuery(message: String, content: List<MediaItem>, football: List<FootballMatch>, h: HomeStrings): String {
    val mode = aiModeFor(message)
    if (mode == AiSuggestionMode.SPORTS) return matchesReply(football, h)
    val query = normalizeForMatching(message)
    val pool = poolFor(mode, content).ifEmpty { content }
    val best = pool.firstOrNull { query.length >= 2 && normalizeForMatching(it.title).contains(query) } ?: bestOf(pool)
    return if (best == null) h.assistantNotFound else h.assistantSuggest(best.title, aiReason(best, h))
}

private fun aiReason(item: MediaItem, h: HomeStrings): String = when {
    item.rating.cleanRating().isNotBlank() -> h.reasonRating(item.rating.cleanRating())
    item.lastPlayedAt > 0 -> h.reasonRecent
    item.categoryName.isNotBlank() -> h.reasonCategory(item.categoryName)
    else -> h.reasonLibrary
}

private fun aiPicks(content: List<MediaItem>, football: List<FootballMatch>, seed: Int, mode: AiSuggestionMode): List<MediaItem> {
    if (content.isEmpty()) return emptyList()
    val pool = when (mode) {
        AiSuggestionMode.SPORTS -> poolFor(mode, content).ifEmpty {
            football.flatMap { match ->
                content.filter { item ->
                    val text = "${item.title} ${item.categoryName}".lowercase()
                    text.contains(match.home.lowercase()) || text.contains(match.away.lowercase())
                }
            }
        }
        else -> poolFor(mode, content)
    }.ifEmpty { content }
    val boosted = pool.sortedWith(
        compareByDescending<MediaItem> { it.rating.toDoubleOrNull() ?: 0.0 }
            .thenByDescending { it.lastPlayedAt }
            .thenByDescending { it.addedAt.takeIf { added -> added > 0 } ?: it.lastModifiedAt },
    )
    val offset = seed.coerceAtLeast(0) % boosted.size
    return (boosted.drop(offset) + boosted.take(offset)).take(6)
}

private fun latestOfType(content: List<MediaItem>, type: ContentType): List<MediaItem> =
    content
        .filter { it.type == type }
        .sortedByDescending { it.addedAt.takeIf { added -> added > 0 } ?: it.lastModifiedAt }
        .take(3)

private fun typeIcon(item: MediaItem): ImageVector = when (item.type) {
    ContentType.LIVE -> Icons.Rounded.LiveTv
    ContentType.MOVIE -> Icons.Rounded.Movie
    ContentType.SERIES,
    ContentType.EPISODE -> Icons.Rounded.VideoLibrary
}

@Composable
private fun TvAssistantDialog(
    picks: List<MediaItem>,
    latestMoviesCount: Int,
    latestSeriesCount: Int,
    lastReply: String,
    onMode: (AiSuggestionMode) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onClose: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    val h = LocalStrings.current.home
    val firstFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) {
        delay(60)
        runCatching { firstFocus.requestFocus() }
    }
    Dialog(onDismissRequest = onClose) {
        GlassPanel(
            modifier = Modifier.width(420.dp).heightIn(min = 280.dp),
            radius = 18.dp,
            highlighted = true,
            glow = visuals.accent.copy(alpha = 0.18f),
        ) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Icon(Icons.Rounded.SmartToy, null, tint = visuals.accent, modifier = Modifier.size(24.dp))
                    Text(h.assistantTitle, color = Color.White, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold), modifier = Modifier.weight(1f))
                    AssistantIconButton(Icons.Rounded.Close, h.assistantClose, onClose)
                }
                Text(h.assistantTvHeadline, color = visuals.accent, style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold), maxLines = 1)
                Text(
                    lastReply.ifBlank { h.assistantTvHint },
                    color = Color(0xDDFFFFFF),
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                // The current suggestions are playable straight from the dialog.
                picks.take(2).forEach { pick -> AssistantSuggestionRow(item = pick, onPlay = onPlay) }
                AssistantActionButton(h.assistantSurprise, Icons.Rounded.Casino, Modifier.fillMaxWidth().focusRequester(firstFocus)) {
                    picks.firstOrNull()?.let(onPlay)
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistantActionButton("${h.assistantMovies} ${latestMoviesCount.toString().ltr()}", Icons.Rounded.Movie, Modifier.weight(1f)) { onMode(AiSuggestionMode.MOVIES) }
                    AssistantActionButton("${h.assistantSeries} ${latestSeriesCount.toString().ltr()}", Icons.Rounded.VideoLibrary, Modifier.weight(1f)) { onMode(AiSuggestionMode.SERIES) }
                    AssistantActionButton(h.assistantLive, Icons.Rounded.LiveTv, Modifier.weight(1f)) { onMode(AiSuggestionMode.LIVE) }
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistantActionButton(h.assistantSports, Icons.Rounded.SportsSoccer, Modifier.weight(1f)) { onMode(AiSuggestionMode.SPORTS) }
                    AssistantActionButton(h.assistantContinue, Icons.Rounded.History, Modifier.weight(1f)) { onMode(AiSuggestionMode.CONTINUE) }
                }
            }
        }
    }
}

@Composable
private fun AssistantIconButton(icon: ImageVector, contentDescription: String, onClick: () -> Unit) {
    FocusGlow(modifier = Modifier.size(40.dp), cornerRadius = 999.dp, onClick = onClick) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription, tint = Color.White, modifier = Modifier.size(20.dp))
        }
    }
}

@Composable
private fun AssistantActionButton(label: String, icon: ImageVector, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val visuals = LocalMoVisuals.current
    FocusGlow(modifier = modifier.heightIn(min = 44.dp), cornerRadius = 12.dp, onClick = onClick, focusedScale = FocusScale.Chip) {
        val focused = LocalFocusGlowFocused.current
        Row(
            Modifier
                .fillMaxWidth()
                .heightIn(min = 44.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(if (focused) Color.White.copy(alpha = 0.94f) else Color(0x33FFFFFF))
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(icon, null, tint = if (focused) Color(0xFF15110D) else visuals.accent, modifier = Modifier.size(18.dp))
            Text(
                label,
                color = if (focused) Color(0xFF15110D) else Color.White,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun MobileAssistantPanel(
    allContent: List<MediaItem>,
    football: List<FootballMatch>,
    seed: Int,
    chat: List<AiChatMessage>,
    input: String,
    compact: Boolean,
    mode: AiSuggestionMode,
    onInput: (String) -> Unit,
    onSend: () -> Unit,
    onMode: (AiSuggestionMode) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val visuals = LocalMoVisuals.current
    val h = LocalStrings.current.home
    val picks = remember(allContent, football, seed, mode) { aiPicks(allContent, football, seed, mode) }
    val latestMovies = remember(allContent) { latestOfType(allContent, ContentType.MOVIE) }
    val latestSeries = remember(allContent) {
        allContent
            .filter { it.type == ContentType.SERIES || it.type == ContentType.EPISODE }
            .sortedByDescending { it.addedAt.takeIf { added -> added > 0 } ?: it.lastModifiedAt }
            .take(3)
    }
    GlassPanel(
        modifier = modifier.widthIn(max = if (compact) 360.dp else 400.dp).heightIn(max = if (compact) 400.dp else 460.dp),
        radius = 18.dp,
        highlighted = true,
        glow = visuals.accent.copy(alpha = 0.18f),
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Icon(Icons.Rounded.SmartToy, null, tint = visuals.accent, modifier = Modifier.size(22.dp))
                Column(Modifier.weight(1f)) {
                    Text(h.assistantTitle, color = Color.White, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold))
                    Text(h.assistantSubtitle, color = Color(0xB8FFFFFF), style = MaterialTheme.typography.labelSmall, maxLines = 1)
                }
                AssistantIconButton(Icons.Rounded.Close, h.assistantClose, onClose)
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                AssistantInfoPill(h.assistantMovies, latestMovies.size, Modifier.weight(1f))
                AssistantInfoPill(h.assistantSeries, latestSeries.size, Modifier.weight(1f))
                AssistantInfoPill(h.assistantAll, allContent.size, Modifier.weight(1f))
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                AssistantActionButton(h.assistantMovies, Icons.Rounded.Movie, Modifier.weight(1f)) { onMode(AiSuggestionMode.MOVIES) }
                AssistantActionButton(h.assistantSeries, Icons.Rounded.VideoLibrary, Modifier.weight(1f)) { onMode(AiSuggestionMode.SERIES) }
                AssistantActionButton(h.assistantLive, Icons.Rounded.LiveTv, Modifier.weight(1f)) { onMode(AiSuggestionMode.LIVE) }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                AssistantActionButton(h.assistantSports, Icons.Rounded.SportsSoccer, Modifier.weight(1f)) { onMode(AiSuggestionMode.SPORTS) }
                AssistantActionButton(h.assistantContinue, Icons.Rounded.History, Modifier.weight(1f)) { onMode(AiSuggestionMode.CONTINUE) }
                AssistantActionButton(h.assistantSurprise, Icons.Rounded.Casino, Modifier.weight(1f)) {
                    onMode(AiSuggestionMode.SURPRISE)
                    picks.firstOrNull()?.let(onPlay)
                }
            }
            Text(h.assistantSuggestionsFor(mode.label(h)), color = visuals.accent, style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                picks.take(if (compact) 2 else 3).forEach { item -> AssistantSuggestionRow(item = item, onPlay = onPlay) }
            }
            val infoLine = when {
                latestMovies.isNotEmpty() && latestSeries.isNotEmpty() -> h.assistantNewBoth(latestMovies.first().title, latestSeries.first().title)
                latestMovies.isNotEmpty() -> h.assistantLatestMovie(latestMovies.first().title)
                latestSeries.isNotEmpty() -> h.assistantLatestSeries(latestSeries.first().title)
                else -> h.assistantLibraryInfo
            }
            Text(infoLine, color = Color(0xB8FFFFFF), style = MaterialTheme.typography.labelSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
            if (football.isNotEmpty()) {
                Text(
                    h.assistantTodayMatches(football.take(2).joinToString(" · ") { "${it.home.isolate()} ${h.footballVersus} ${it.away.isolate()}" }),
                    color = Color(0xCCE3BC78),
                    style = MaterialTheme.typography.labelSmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            chat.takeLast(2).forEach { message ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = if (message.mine) Arrangement.End else Arrangement.Start) {
                    GlassPanel(radius = 12.dp, highlighted = message.mine) {
                        Text(
                            message.text,
                            color = Color.White,
                            style = MaterialTheme.typography.bodySmall,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.widthIn(max = if (compact) 260.dp else 330.dp).padding(horizontal = 10.dp, vertical = 7.dp),
                        )
                    }
                }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = input,
                    onValueChange = onInput,
                    placeholder = { Text(h.assistantInputHint) },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color(0x221A1814),
                        unfocusedContainerColor = Color(0x221A1814),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                    ),
                )
                Button(onClick = onSend, enabled = input.isNotBlank()) { Icon(Icons.AutoMirrored.Rounded.Send, null) }
            }
        }
    }
}

@Composable
private fun AssistantSuggestionRow(item: MediaItem, onPlay: (MediaItem) -> Unit) {
    val visuals = LocalMoVisuals.current
    val h = LocalStrings.current.home
    FocusGlow(cornerRadius = 12.dp, onClick = { onPlay(item) }, focusedScale = FocusScale.Row) {
        Row(
            Modifier.fillMaxWidth().heightIn(min = 44.dp).padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Icon(typeIcon(item), null, tint = visuals.accent, modifier = Modifier.size(20.dp))
            Column(Modifier.weight(1f)) {
                Text(item.title, color = Color.White, style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(aiReason(item, h), color = Color(0x99FFFFFF), style = MaterialTheme.typography.labelSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Icon(Icons.Rounded.PlayArrow, null, tint = Color.White, modifier = Modifier.size(20.dp))
        }
    }
}

@Composable
private fun AssistantInfoPill(label: String, value: Int, modifier: Modifier = Modifier) {
    GlassPanel(modifier = modifier.heightIn(min = 34.dp), radius = 10.dp) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
        ) {
            Text(value.toString(), color = Color.White, style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold), maxLines = 1)
            Spacer(Modifier.width(4.dp))
            Text(label, color = Color(0xCCFFFFFF), style = MaterialTheme.typography.labelSmall, maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center)
        }
    }
}

private fun String.toZoneId(): ZoneId =
    runCatching { ZoneId.of(this) }.getOrDefault(ZoneId.systemDefault())
