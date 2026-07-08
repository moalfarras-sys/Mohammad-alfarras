package com.moalfarras.moplayer.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Send
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil3.compose.AsyncImage
import com.moalfarras.moplayerpro.R
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.FootballMatch
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.MotionLevel
import com.moalfarras.moplayer.domain.model.ServerProfile
import com.moalfarras.moplayer.core.PerformancePolicy
import com.moalfarras.moplayer.domain.model.ThemePreset
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import com.moalfarras.moplayer.ui.components.*
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.theme.*
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import kotlin.math.roundToInt
import kotlin.math.sin

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
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    val homeContinue = remember(continueWatching) { continueWatching.take(HOME_SHELF_LIMIT) }
    val homeMovies = remember(latestMovies) { latestMovies.take(HOME_SHELF_LIMIT) }
    val homeSeries = remember(latestSeries) { latestSeries.take(HOME_SHELF_LIMIT) }
    val hasContent = homeContinue.isNotEmpty() || homeMovies.isNotEmpty() || homeSeries.isNotEmpty()
    val firstFocusableHomeLane = when {
        homeContinue.isNotEmpty() -> "continue"
        homeMovies.isNotEmpty() -> "latestMovies"
        homeSeries.isNotEmpty() -> "latestSeries"
        else -> ""
    }
    val allContent = remember(continueWatching, recentLive, latestLive, latestMovies, latestSeries) {
        (continueWatching + recentLive + latestLive + latestMovies + latestSeries)
            .distinctBy { "${it.type}:${it.serverId}:${it.id}" }
    }
    var focusedHomeItem by remember { mutableStateOf<MediaItem?>(null) }
    val highlightedHomeItem = focusedHomeItem
        ?: homeContinue.firstOrNull()
        ?: homeMovies.firstOrNull()
        ?: homeSeries.firstOrNull()
    var showAiAssistant by remember { mutableStateOf(false) }
    val aiIntroRtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    var aiChat by remember { mutableStateOf(listOf(AiChatMessage(freeAiIntro(allContent, football, aiIntroRtl), false))) }
    var aiInput by remember { mutableStateOf("") }
    var surpriseSeed by remember { mutableIntStateOf(0) }
    var aiTvAction by remember { mutableIntStateOf(0) }
    var aiMode by remember { mutableStateOf(AiSuggestionMode.SURPRISE) }
    fun askAi(message: String) {
        val clean = message.trim()
        if (clean.isNotBlank()) {
            aiMode = aiModeFor(clean)
            aiChat = aiChat + AiChatMessage(clean, true) + AiChatMessage(aiReply(clean, allContent, football), false)
        }
    }

    val contentBackdropUrl = remember(continueWatching, latestMovies, latestSeries) {
        backdropUrlFrom(
            continueWatching.firstOrNull(),
            latestMovies.firstOrNull(),
            latestSeries.firstOrNull(),
        )
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
    // Keep the photo layer strong; motion level mainly affects particles + atmosphere elsewhere.
    val backdropAlpha = when (settings.motionLevel) {
        MotionLevel.LOW -> 0.90f
        MotionLevel.BALANCED -> 0.96f
        MotionLevel.RICH -> 1f
    }
    val topFootballMatches = remember(football, settings.footballMaxMatches, settings.showFootballWidget, performancePolicy.enableWidgets) {
        if (settings.showFootballWidget && performancePolicy.enableWidgets) {
            // Honor the user's full 1..8 "match count" setting (was silently capped at 3).
            football.take(settings.footballMaxMatches.coerceIn(1, 8))
        } else {
            emptyList()
        }
    }
    val wrappedOnFocus: (MediaItem) -> Unit = { item ->
        focusedHomeItem = item
        onFocus(item)
    }

    // Breathing animation for subtle ambient pulse. Skip the infinite transition entirely
    // in reduce-motion mode so the home screen can reach idle instead of repainting every
    // frame forever (previously the transition kept running even though its value was ignored).
    val breathe = if (performancePolicy.reduceMotion) {
        1f
    } else {
        val infiniteTransition = rememberInfiniteTransition(label = "home")
        val animatedBreathe by infiniteTransition.animateFloat(
            initialValue = 0.92f, targetValue = 1.0f,
            animationSpec = infiniteRepeatable(tween(4000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
            label = "breathe",
        )
        animatedBreathe
    }

    // Home notifications are remote-configurable; World Cup 2026 is the first built-in campaign.
    val homeNotificationPhase = rememberHomeNotificationPhase(settings.homeNotificationMode, settings.homeNotificationType, settings.homeNotificationTargetDate)
    var showHomeNotification by remember(homeNotificationPhase) { mutableStateOf(homeNotificationPhase !is HomeNotificationPhase.Off) }
    LaunchedEffect(homeNotificationPhase) {
        if (homeNotificationPhase !is HomeNotificationPhase.Off) {
            kotlinx.coroutines.delay(14_000)
            showHomeNotification = false
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // MOBILE / PHONE LAYOUT
    // ═══════════════════════════════════════════════════════════════════
    if (!tv.isTv) {
        val mobileZone = remember(weather.timeZoneId) { weather.timeZoneId.toZoneId() }
        var mobileNow by remember(mobileZone) { mutableStateOf(ZonedDateTime.now(mobileZone)) }
        LaunchedEffect(mobileZone) {
            while (true) {
                kotlinx.coroutines.delay(1000)
                mobileNow = ZonedDateTime.now(mobileZone)
            }
        }
        val mobileClock = mobileNow.format(DateTimeFormatter.ofPattern("HH:mm"))
        val mobileListState = rememberLazyListState()
        val mobileRestoreIndex = remember(
            restoreFocusItem,
            tv.isLowHeightLandscape,
            hasContent,
            continueWatching,
            latestMovies,
            latestSeries,
        ) {
            homeRestoreIndex(
                target = restoreFocusItem,
                leadingItems = 1 + (if (!tv.isLowHeightLandscape) 1 else 0) + (if (!hasContent) 1 else 0),
                lanes = listOf(homeContinue, homeMovies, homeSeries),
            )
        }
        LaunchedEffect(mobileRestoreIndex, restoreFocusItem?.id) {
            if (mobileRestoreIndex != null) mobileListState.scrollToItem(mobileRestoreIndex)
        }
        Box(Modifier.fillMaxSize()) {
            AtmosphericSkyGradient(
                timeZoneId = weather.timeZoneId,
                animate = settings.motionLevel != MotionLevel.LOW && !performancePolicy.reduceMotion,
            )
            CinematicBackdrop(
                selectedBackdrop,
                showParticles = performancePolicy.enableParticles && settings.motionLevel != MotionLevel.LOW,
                imageSize = performancePolicy.backdropImageSize,
                modifier = Modifier.graphicsLayer { alpha = backdropAlpha },
            )
            LazyColumn(
                state = mobileListState,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(tv.contentPadding, tv.contentPadding, tv.contentPadding, tv.bottomBarHeight),
                verticalArrangement = Arrangement.spacedBy(tv.laneSpacing),
            ) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Image(
                            painter = painterResource(R.drawable.ic_splash_logo),
                            contentDescription = "MoPlayer Pro",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier
                                .height(if (tv.isLowHeightLandscape) 32.dp else 42.dp)
                                .widthIn(max = if (tv.isLowHeightLandscape) 96.dp else 120.dp),
                        )
                        if (tv.isLowHeightLandscape) {
                            AiHomeButton("Smart assistant", Icons.Rounded.AutoAwesome, Modifier.fillMaxWidth(0.50f)) { showAiAssistant = true }
                        }
                        if (performancePolicy.enableWidgets && (settings.showClockWidget || (settings.showWeatherWidget && weather.hasRealWeather))) {
                            MobileWeatherChip(weather, visuals, mobileClock, settings.showWeatherWidget, settings.showClockWidget)
                        }
                    }
                }
                if (!tv.isLowHeightLandscape) item {
                    AiHomeButton("Smart assistant", Icons.Rounded.AutoAwesome, Modifier.fillMaxWidth()) { showAiAssistant = true }
                }
                if (!hasContent) {
                    item {
                        EmptyState(
                            title = if (syncing) strings.homeLibraryLoadingTitle else strings.homeLibraryEmptyTitle,
                            message = if (syncing) strings.homeLibraryLoadingBody else strings.homeLibraryEmptyBody,
                            modifier = Modifier.fillMaxWidth().height(220.dp),
                        )
                    }
                }
                if (homeContinue.isNotEmpty()) {
                    item { MediaLane(strings.railContinueWatching, homeContinue, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem, autoFocusFirstItem = allowInitialContentFocus && firstFocusableHomeLane == "continue", maxItems = HOME_SHELF_LIMIT) }
                }
                if (homeMovies.isNotEmpty()) {
                    item { MediaLane(strings.railLatestMovies, homeMovies, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem, autoFocusFirstItem = allowInitialContentFocus && firstFocusableHomeLane == "latestMovies", maxItems = HOME_SHELF_LIMIT) }
                }
                if (homeSeries.isNotEmpty()) {
                    item { MediaLane(strings.railLatestSeries, homeSeries, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem, autoFocusFirstItem = allowInitialContentFocus && firstFocusableHomeLane == "latestSeries", maxItems = HOME_SHELF_LIMIT) }
                }
            }
            HomeNotificationOverlay(
                visible = showHomeNotification && performancePolicy.enableWidgets,
                phase = homeNotificationPhase,
                accent = accent,
                title = settings.homeNotificationTitle,
                message = settings.homeNotificationMessage,
                reduceMotion = performancePolicy.reduceMotion,
                maxWidth = 560.dp,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = tv.bottomBarHeight + 16.dp, start = 16.dp, end = 16.dp),
            )
            if (showAiAssistant) {
                AiAssistantPanel(
                    allContent = allContent,
                    football = football,
                    seed = surpriseSeed,
                    chat = aiChat,
                    input = aiInput,
                    compact = tv.isCompact || tv.isLowHeightLandscape,
                    mode = aiMode,
                    onInput = { aiInput = it },
                    onSend = {
                        val message = aiInput.trim()
                        if (message.isNotBlank()) {
                            askAi(message)
                            aiInput = ""
                        }
                    },
                    onQuickQuestion = ::askAi,
                    onMode = { mode ->
                        aiMode = mode
                        surpriseSeed++
                        aiChat = aiChat + AiChatMessage(mode.prompt, true) + AiChatMessage(aiReply(mode.prompt, allContent, football), false)
                    },
                    onPlay = onPlay,
                    onClose = { showAiAssistant = false },
                    modifier = Modifier.align(Alignment.Center),
                )
            }
        }
        return
    }

    // ═══════════════════════════════════════════════════════════════════
    // TV / ANDROID TV LAYOUT — Cinematic 2026 with Atmospheric Weather
    // ═══════════════════════════════════════════════════════════════════
    // (Removed a dead per-second clock ticker here: it recomposed the whole Home screen
    // every second on TV yet its output was never rendered — the visible hero clock is
    // driven by HeroWeatherInline's own ticker. Letting Home reach idle avoids constant
    // wasted redraws on weak boxes.)
    val tvListState = rememberLazyListState()
    val tvRestoreIndex = remember(
        restoreFocusItem,
        hasContent,
        continueWatching,
        recentLive,
        latestLive,
        latestMovies,
        latestSeries,
    ) {
        homeRestoreIndex(
            target = restoreFocusItem,
            leadingItems = 1 + if (!hasContent) 1 else 0,
            lanes = listOf(homeContinue, homeMovies, homeSeries),
        )
    }
    LaunchedEffect(tvRestoreIndex, restoreFocusItem?.id) {
        if (tvRestoreIndex != null) tvListState.scrollToItem(tvRestoreIndex)
    }

    Box(
        Modifier
            .fillMaxSize()
            .onPreviewKeyEvent { event ->
                if (!showAiAssistant || !tv.isTv || event.type != KeyEventType.KeyUp) return@onPreviewKeyEvent false
                when (event.key) {
                    Key.DirectionDown, Key.DirectionRight -> {
                        aiTvAction = (aiTvAction + 1) % 6
                        true
                    }
                    Key.DirectionUp, Key.DirectionLeft -> {
                        aiTvAction = (aiTvAction + 5) % 6
                        true
                    }
                    Key.Enter, Key.DirectionCenter -> {
                        when (aiTvAction) {
                            0 -> aiPicks(allContent, football, surpriseSeed, AiSuggestionMode.SURPRISE).firstOrNull()?.let(onPlay)
                            1 -> askAi(AiSuggestionMode.MOVIES.prompt)
                            2 -> askAi(AiSuggestionMode.SERIES.prompt)
                            3 -> askAi(AiSuggestionMode.LIVE.prompt)
                            4 -> askAi(AiSuggestionMode.SPORTS.prompt)
                            else -> askAi(AiSuggestionMode.CONTINUE.prompt)
                        }
                        true
                    }
                    Key.Back, Key.Escape -> {
                        showAiAssistant = false
                        true
                    }
                    else -> false
                }
            },
    ) {
        AtmosphericSkyGradient(
            timeZoneId = weather.timeZoneId,
            animate = settings.motionLevel != MotionLevel.LOW && !performancePolicy.reduceMotion,
        )
        CinematicBackdrop(
            selectedBackdrop,
            showParticles = performancePolicy.enableParticles && settings.motionLevel != MotionLevel.LOW,
            imageSize = performancePolicy.backdropImageSize,
            modifier = Modifier.graphicsLayer { alpha = backdropAlpha },
        )
        LazyColumn(
            state = tvListState,
            verticalArrangement = Arrangement.spacedBy((14 * tv.factor).dp),
            modifier = Modifier
                .fillMaxSize()
                .padding(start = tv.contentPadding, top = (168 * tv.factor).dp, end = tv.contentPadding, bottom = 120.dp),
        ) {
            // Fast assistant — sits right above Continue watching for easy remote reach.
            item {
                HomeAssistantButton(reduceMotion = performancePolicy.reduceMotion) {
                    aiTvAction = 0
                    showAiAssistant = true
                }
            }
            // ── CONTENT RAILS ───────────────────────────────────────────
            if (!hasContent) {
                item {
                    EmptyState(
                        title = if (syncing) strings.homeLibraryLoadingTitle else strings.homeLibraryEmptyTitle,
                        message = if (syncing) strings.homeLibraryLoadingBody else strings.homeLibraryEmptyBody,
                        modifier = Modifier.fillMaxWidth().height((260 * tv.factor).dp),
                    )
                }
            }
            if (homeContinue.isNotEmpty()) {
                item { MediaLane(strings.railResume, homeContinue, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem, autoFocusFirstItem = allowInitialContentFocus && firstFocusableHomeLane == "continue", maxItems = HOME_SHELF_LIMIT, compact = true, showTitle = false, posterWidthOverride = (94 * tv.factor).dp) }
            }
            if (homeMovies.isNotEmpty()) {
                item { MediaLane(strings.navMovies, homeMovies, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem, autoFocusFirstItem = allowInitialContentFocus && firstFocusableHomeLane == "latestMovies", maxItems = HOME_SHELF_LIMIT, compact = true) }
            }
            if (homeSeries.isNotEmpty()) {
                item { MediaLane(strings.navSeries, homeSeries, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem, autoFocusFirstItem = allowInitialContentFocus && firstFocusableHomeLane == "latestSeries", maxItems = HOME_SHELF_LIMIT, compact = true) }
            }
        }
        // Top scrim keeps the boxless hero readable as content scrolls beneath it.
        Box(
            Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .height((205 * tv.factor).dp)
                .background(
                    Brush.verticalGradient(
                        0f to Color(0xF0070708),
                        0.55f to Color(0xB3070708),
                        1f to Color.Transparent,
                    ),
                ),
        )
        Box(
            modifier = Modifier
                .align(Alignment.TopStart)
                .fillMaxWidth()
                .padding(start = tv.contentPadding, top = (18 * tv.factor).dp, end = tv.contentPadding),
        ) {
            HomeHero(
                highlightedItem = highlightedHomeItem,
                weather = weather,
                matches = topFootballMatches,
                phase = homeNotificationPhase,
                notificationTitle = settings.homeNotificationTitle,
                activeServer = activeServer,
                showWeather = settings.showWeatherWidget,
                showClock = settings.showClockWidget,
                showWidgets = performancePolicy.enableWidgets,
                reduceMotion = performancePolicy.reduceMotion,
                accent = accent,
            )
        }
        if (showAiAssistant) {
            AiAssistantPanel(
                allContent = allContent,
                football = football,
                seed = surpriseSeed,
                chat = aiChat,
                input = aiInput,
                compact = false,
                selectedTvAction = aiTvAction,
                mode = aiMode,
                onInput = { aiInput = it },
                onSend = {
                    val message = aiInput.trim()
                    if (message.isNotBlank()) {
                        askAi(message)
                        aiInput = ""
                    }
                },
                onQuickQuestion = ::askAi,
                onMode = { mode ->
                    aiMode = mode
                    surpriseSeed++
                    aiChat = aiChat + AiChatMessage(mode.prompt, true) + AiChatMessage(aiReply(mode.prompt, allContent, football), false)
                },
                onPlay = onPlay,
                onClose = { showAiAssistant = false },
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = tv.contentPadding),
            )
        }
    }
}

/** Drop shadow applied to every hero string so it stays crisp on any backdrop — no cards needed. */
private val HeroTextShadow = Shadow(color = Color(0xB3000000), offset = Offset(0f, 2f), blurRadius = 16f)

@Composable
private fun HomeHero(
    highlightedItem: MediaItem?,
    weather: WeatherSnapshot,
    matches: List<FootballMatch>,
    phase: HomeNotificationPhase,
    notificationTitle: String,
    activeServer: ServerProfile?,
    showWeather: Boolean,
    showClock: Boolean,
    showWidgets: Boolean,
    reduceMotion: Boolean,
    accent: Color,
) {
    val tv = rememberTvScale()
    val isArabic = LocalLayoutDirection.current == LayoutDirection.Rtl
    val showWeatherCluster = showClock || (showWeather && weather.hasRealWeather)
    CompositionLocalProvider(LocalTextStyle provides LocalTextStyle.current.copy(shadow = HeroTextShadow)) {
        Column(
            Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy((16 * tv.factor).dp),
        ) {
            Row(
                Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                // Brand mark + the auto-surfaced title of whatever is in focus.
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy((18 * tv.factor).dp),
                    modifier = Modifier.weight(1f),
                ) {
                    Image(
                        painter = painterResource(R.drawable.ic_splash_logo),
                        contentDescription = "MoPlayer Pro",
                        contentScale = ContentScale.Fit,
                        alignment = Alignment.CenterStart,
                        modifier = Modifier.height((52 * tv.factor).dp),
                    )
                    Column(verticalArrangement = Arrangement.spacedBy((3 * tv.factor).dp)) {
                        Text(
                            heroKicker(highlightedItem, isArabic),
                            color = Color(0xFFF1CC83),
                            fontSize = (13 * tv.factor).sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 2.sp,
                            maxLines = 1,
                        )
                        Text(
                            highlightedItem?.title?.takeIf { it.isNotBlank() }
                                ?: if (isArabic) "أهلاً بك" else "Welcome back",
                            color = Color.White,
                            fontWeight = FontWeight.Black,
                            fontSize = (34 * tv.factor).sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.widthIn(max = (720 * tv.factor).dp),
                        )
                        AccountSummaryLine(activeServer, isArabic)
                    }
                }
                if (showWidgets) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy((20 * tv.factor).dp),
                    ) {
                        if (showWeatherCluster) {
                            HeroWeatherInline(weather, showWeather, showClock, !reduceMotion)
                        }
                        if (showWeatherCluster && phase !is HomeNotificationPhase.Off) {
                            HeroDivider()
                        }
                        HeroCountdown(phase, notificationTitle, accent, !reduceMotion, isArabic)
                    }
                }
            }

            if (showWidgets && matches.isNotEmpty()) {
                // Rotate through the widget's matches (live first, then upcoming with kickoff
                // times) every ~8s with a soft crossfade — every match gets screen time instead of
                // only the first one. A single match renders exactly as before.
                var matchIndex by remember(matches) { mutableIntStateOf(0) }
                LaunchedEffect(matches) {
                    if (matches.size > 1) {
                        while (true) {
                            kotlinx.coroutines.delay(8_000L)
                            matchIndex = (matchIndex + 1) % matches.size
                        }
                    }
                }
                Crossfade(
                    targetState = matches[matchIndex % matches.size],
                    animationSpec = tween(if (reduceMotion) 0 else 600),
                    label = "matchRotation",
                ) { match ->
                    HeroMatchStrip(match, accent, !reduceMotion, isArabic)
                }
            }
        }
    }
}

@Composable
private fun HeroDivider() {
    val tv = rememberTvScale()
    Box(
        Modifier
            .height((50 * tv.factor).dp)
            .width(1.dp)
            .background(
                Brush.verticalGradient(
                    listOf(Color.Transparent, Color.White.copy(alpha = 0.22f), Color.Transparent),
                ),
            ),
    )
}

private fun heroKicker(item: MediaItem?, isArabic: Boolean): String = when (item?.type) {
    ContentType.MOVIE -> if (isArabic) "فيلم" else "MOVIE"
    ContentType.SERIES, ContentType.EPISODE -> if (isArabic) "مسلسل" else "SERIES"
    ContentType.LIVE -> if (isArabic) "بث مباشر" else "LIVE TV"
    else -> if (isArabic) "متابعة المشاهدة" else "CONTINUE WATCHING"
}

@Composable
private fun AccountSummaryLine(server: ServerProfile?, isArabic: Boolean) {
    if (server == null || (server.expiryDate <= 0 && server.maxConnections <= 0 && server.accountStatus.isBlank())) return
    val now = remember { System.currentTimeMillis() }
    val daysLeft = if (server.expiryDate > 0) ((server.expiryDate - now) / 86_400_000L).coerceAtLeast(0) else null
    val expiry = server.expiryDate.takeIf { it > 0 }?.let {
        DateTimeFormatter.ofPattern("yyyy-MM-dd").format(java.time.Instant.ofEpochMilli(it).atZone(ZoneId.systemDefault()))
    }
    val pieces = buildList {
        add(server.accountStatus.ifBlank { if (isArabic) "نشط" else "Active" })
        if (expiry != null && daysLeft != null) {
            add(if (isArabic) "ينتهي $expiry - $daysLeft يوم" else "Expires $expiry - $daysLeft days")
        }
        if (server.maxConnections > 0) {
            add(if (isArabic) "الاتصالات ${server.activeConnections}/${server.maxConnections}" else "Connections ${server.activeConnections}/${server.maxConnections}")
        }
    }
    Text(
        pieces.joinToString("  |  "),
        color = Color(0xFFE3BC78),
        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        modifier = Modifier.widthIn(max = 720.dp),
    )
}

@Composable
private fun HomeAssistantButton(modifier: Modifier = Modifier, reduceMotion: Boolean = false, onClick: () -> Unit) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val isArabic = LocalLayoutDirection.current == LayoutDirection.Rtl
    // Gate the sheen so the assistant button stops pinning the home screen at ~36fps when
    // motion is reduced; the static value keeps the same restful glow.
    val sparkle = if (reduceMotion) {
        0.85f
    } else {
        val transition = rememberInfiniteTransition(label = "assistant-sheen")
        val raw by transition.animateFloat(
            initialValue = 0.55f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(tween(1600, easing = FastOutSlowInEasing), RepeatMode.Reverse),
            label = "sparkle",
        )
        raw
    }
    FocusGlow(
        modifier = modifier.height((58 * tv.factor).dp).widthIn(max = (340 * tv.factor).dp),
        cornerRadius = (18 * tv.factor).dp,
        onClick = onClick,
    ) {
        GlassPanel(
            radius = (18 * tv.factor).dp,
            highlighted = true,
            blur = 14.dp,
            glow = visuals.accent.copy(alpha = 0.28f * sparkle),
        ) {
            Row(
                Modifier
                    .fillMaxSize()
                    .background(
                        Brush.horizontalGradient(
                            listOf(visuals.accent.copy(alpha = 0.20f), Color.Transparent),
                        ),
                    )
                    .padding(horizontal = (18 * tv.factor).dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy((13 * tv.factor).dp),
            ) {
                Box(
                    Modifier
                        .size((38 * tv.factor).dp)
                        .clip(CircleShape)
                        .background(visuals.accent.copy(alpha = 0.18f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Rounded.AutoAwesome, null, tint = visuals.accent, modifier = Modifier.size((22 * tv.factor).dp))
                }
                Column(Modifier.weight(1f)) {
                    Text(
                        if (isArabic) "المساعد الذكي" else "Smart picks",
                        color = Color.White,
                        fontSize = (16 * tv.factor).sp,
                        fontWeight = FontWeight.Black,
                        maxLines = 1,
                    )
                    Text(
                        if (isArabic) "اقتراحات فورية من مكتبتك" else "Instant picks from your library",
                        color = Color(0xB8FFFFFF),
                        fontSize = (10 * tv.factor).sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Icon(Icons.Rounded.ChevronRight, null, tint = Color(0xCCFFFFFF), modifier = Modifier.size((22 * tv.factor).dp))
            }
        }
    }
}

@Composable
private fun HeroMatchStrip(match: FootballMatch, accent: Color, animate: Boolean, isArabic: Boolean) {
    val tv = rememberTvScale()
    val pulse = if (animate && match.isLive) {
        val pulseTransition = rememberInfiniteTransition(label = "hero-match")
        val rawPulse by pulseTransition.animateFloat(
            initialValue = 0.4f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(tween(1000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
            label = "pulse",
        )
        rawPulse
    } else 0.85f
    val liveColor = Color(0xFFFF4D5E)
    Row(
        Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy((14 * tv.factor).dp),
    ) {
        // Status — live pulse + minute, or kickoff time.
        if (match.isLive) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy((7 * tv.factor).dp),
            ) {
                Box(
                    Modifier
                        .size((10 * tv.factor).dp)
                        .drawBehind {
                            drawCircle(liveColor.copy(alpha = 0.35f * pulse), radius = size.minDimension * 1.5f)
                            drawCircle(liveColor.copy(alpha = pulse))
                        },
                )
                Text(
                    (if (isArabic) "مباشر" else "LIVE") + if (match.minute.isNotBlank()) "  ${match.minute}" else "",
                    color = liveColor,
                    fontSize = (14 * tv.factor).sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 0.5.sp,
                    maxLines = 1,
                )
            }
        } else if (match.minute.isNotBlank()) {
            Text(
                match.minute,
                color = Color(0xCCFFFFFF),
                fontSize = (14 * tv.factor).sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
            )
        }
        // League
        Text(
            match.league.ifBlank { if (isArabic) "مباراة" else "Match" }.uppercase(),
            color = Color(0xCCF1CC83),
            fontSize = (13 * tv.factor).sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = 0.6.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.widthIn(max = (240 * tv.factor).dp),
        )
        Spacer(Modifier.weight(1f))
        // Teams + score — the clear, bigger centrepiece.
        HeroCrest(match.home, match.homeBadge)
        Text(
            match.home,
            color = Color.White,
            fontSize = (18 * tv.factor).sp,
            fontWeight = FontWeight.ExtraBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.widthIn(max = (200 * tv.factor).dp),
        )
        Text(
            match.score.ifBlank { "VS" },
            color = Color.White,
            fontSize = (30 * tv.factor).sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.sp,
            maxLines = 1,
            modifier = Modifier.padding(horizontal = (6 * tv.factor).dp),
        )
        Text(
            match.away,
            color = Color.White,
            fontSize = (18 * tv.factor).sp,
            fontWeight = FontWeight.ExtraBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.widthIn(max = (200 * tv.factor).dp),
        )
        HeroCrest(match.away, match.awayBadge)
    }
}

@Composable
private fun HeroCrest(name: String, badgeUrl: String) {
    val tv = rememberTvScale()
    val initials = remember(name) {
        name.split(' ', '-', '_').filter { it.isNotBlank() }.take(2)
            .joinToString("") { it.first().uppercase() }.ifBlank { "FC" }
    }
    Box(
        Modifier
            .size((40 * tv.factor).dp)
            .clip(CircleShape)
            .background(Brush.radialGradient(listOf(Color(0x40FFFFFF), Color(0x0A000000)))),
        contentAlignment = Alignment.Center,
    ) {
        if (badgeUrl.isNotBlank()) {
            AsyncImage(model = badgeUrl, contentDescription = name, modifier = Modifier.fillMaxSize(0.74f))
        } else {
            Text(initials, color = Color.White, fontSize = (13 * tv.factor).sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun HeroWeatherInline(weather: WeatherSnapshot, showWeather: Boolean, showClock: Boolean, animate: Boolean = true) {
    val tv = rememberTvScale()
    val zoneId = remember(weather.timeZoneId) { weather.timeZoneId.toZoneId() }
    var clock by remember(zoneId) { mutableStateOf(ZonedDateTime.now(zoneId)) }
    LaunchedEffect(zoneId) {
        while (true) {
            kotlinx.coroutines.delay(1000)
            clock = ZonedDateTime.now(zoneId)
        }
    }
    val hasWeather = showWeather && weather.hasRealWeather
    val condColor = weatherConditionColor(weather.condition)
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp),
    ) {
        if (hasWeather) {
            Box(
                Modifier
                    .size((50 * tv.factor).dp)
                    .clip(CircleShape)
                    .background(Brush.radialGradient(listOf(condColor.copy(alpha = 0.32f), Color.Transparent))),
                contentAlignment = Alignment.Center,
            ) {
                WeatherGlyph(
                    weather.condition.lowercase(),
                    condColor,
                    animate = animate,
                    modifier = Modifier.size((34 * tv.factor).dp),
                )
            }
        }
        Column(horizontalAlignment = Alignment.End) {
            if (showClock) {
                Text(
                    clock.format(DateTimeFormatter.ofPattern("HH:mm")),
                    color = Color.White,
                    fontSize = (36 * tv.factor).sp,
                    fontWeight = FontWeight.Black,
                    maxLines = 1,
                )
            }
            if (hasWeather) {
                Text(
                    "${weather.temperatureC.roundToInt()}° · ${weather.city.ifBlank { weather.condition }}",
                    color = Color.White.copy(alpha = 0.92f),
                    fontSize = (14 * tv.factor).sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.widthIn(max = (210 * tv.factor).dp),
                )
            }
        }
    }
}

/**
 * Persistent, boxless campaign countdown (World Cup 2026 by default). Admin-driven
 * via [HomeNotificationPhase] + remote title, so it can be repurposed for any future event.
 */
@Composable
private fun HeroCountdown(
    phase: HomeNotificationPhase,
    titleOverride: String,
    accent: Color,
    animate: Boolean,
    isArabic: Boolean,
) {
    if (phase is HomeNotificationPhase.Off) return
    val tv = rememberTvScale()
    val gold = Color(0xFFF1CC83)
    val liveColor = Color(0xFFFF4D5E)
    val pulse = if (animate) {
        val transition = rememberInfiniteTransition(label = "wc-hero")
        val rawPulse by transition.animateFloat(
            initialValue = 0.45f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(tween(950, easing = FastOutSlowInEasing), RepeatMode.Reverse),
            label = "wc-pulse",
        )
        rawPulse
    } else 0.85f
    val label = titleOverride.ifBlank { if (isArabic) "كأس العالم 2026" else "World Cup 2026" }
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
    ) {
        Box(
            Modifier
                .size((58 * tv.factor).dp)
                .clip(CircleShape)
                .background(Brush.radialGradient(listOf(gold.copy(alpha = 0.50f), gold.copy(alpha = 0.04f))))
                .drawBehind {
                    drawCircle(
                        color = gold.copy(alpha = 0.55f * pulse),
                        radius = size.minDimension * 0.5f,
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2f * tv.factor),
                    )
                },
            contentAlignment = Alignment.Center,
        ) {
            Text("🏆", fontSize = (30 * tv.factor).sp)
        }
        Column(verticalArrangement = Arrangement.spacedBy((1 * tv.factor).dp)) {
            Text(
                label,
                color = gold,
                fontSize = (13 * tv.factor).sp,
                fontWeight = FontWeight.ExtraBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.widthIn(max = (210 * tv.factor).dp),
            )
            when (phase) {
                is HomeNotificationPhase.Live -> Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy((7 * tv.factor).dp),
                ) {
                    Box(
                        Modifier
                            .size((10 * tv.factor).dp)
                            .drawBehind {
                                drawCircle(liveColor.copy(alpha = 0.35f * pulse), radius = size.minDimension * 1.5f)
                                drawCircle(liveColor.copy(alpha = pulse))
                            },
                    )
                    Text(
                        if (isArabic) "مباشر الآن" else "LIVE NOW",
                        color = liveColor,
                        fontSize = (17 * tv.factor).sp,
                        fontWeight = FontWeight.Black,
                        maxLines = 1,
                    )
                }
                is HomeNotificationPhase.Countdown -> Row(
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.spacedBy((5 * tv.factor).dp),
                ) {
                    Text(
                        phase.days.toString(),
                        color = Color.White,
                        fontSize = (34 * tv.factor).sp,
                        fontWeight = FontWeight.Black,
                        maxLines = 1,
                    )
                    Text(
                        if (isArabic) "يوم" else "DAYS",
                        color = Color(0xCCFFFFFF),
                        fontSize = (13 * tv.factor).sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = (5 * tv.factor).dp),
                    )
                }
                else -> Unit
            }
        }
    }
}

@Composable
private fun HomeNotificationOverlay(
    visible: Boolean,
    phase: HomeNotificationPhase,
    accent: Color,
    title: String,
    message: String,
    reduceMotion: Boolean,
    maxWidth: Dp,
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
            accent = accent,
            titleOverride = title,
            messageOverride = message,
            animate = !reduceMotion,
            modifier = Modifier
                .heightIn(max = 72.dp)
                .widthIn(max = maxWidth),
        )
    }
}

// ──────────────────────────────────────────────────────────────────────
// Mobile Weather Chip (compact glass widget for phone/tablet)
// ──────────────────────────────────────────────────────────────────────
@Composable
private fun MobileWeatherChip(weather: WeatherSnapshot, visuals: MoVisuals, clock: String, showWeather: Boolean = true, showClock: Boolean = true) {
    val hasWeather = showWeather && weather.hasRealWeather
    if (!hasWeather && !showClock) return
    GlassPanel(radius = 16.dp, blur = 10.dp) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            // Mini weather condition indicator
            if (hasWeather) {
                Box(
                    Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                listOf(
                                    weatherConditionColor(weather.condition).copy(alpha = 0.4f),
                                    Color.Transparent,
                                ),
                            ),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        weatherConditionEmoji(weather.condition),
                        fontSize = 18.sp,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                if (showClock) Text(clock, color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
                if (hasWeather) {
                    Text(
                        "${weather.temperatureC.toInt()}°  ${weather.city}",
                        color = visuals.accent,
                        style = MaterialTheme.typography.labelMedium,
                        maxLines = 1,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
        }
    }
}

// ──────────────────────────────────────────────────────────────────────
// Weather Condition Helpers
// ──────────────────────────────────────────────────────────────────────
@Composable
private fun CompactWidgetCard(
    weather: WeatherSnapshot,
    clock: String,
    showWeather: Boolean,
    showClock: Boolean,
    modifier: Modifier = Modifier,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val hasWeather = showWeather && weather.hasRealWeather
    if (!hasWeather && !showClock) return
    FocusGlow(modifier = modifier, cornerRadius = (18 * tv.factor).dp, onClick = {}) {
        GlassPanel(radius = (18 * tv.factor).dp, highlighted = true) {
            Row(
                modifier = Modifier.padding(horizontal = (20 * tv.factor).dp, vertical = (16 * tv.factor).dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp),
            ) {
                if (showClock) {
                    Icon(Icons.Rounded.Schedule, null, tint = visuals.accent, modifier = Modifier.size((24 * tv.factor).dp))
                    Text(clock, color = Color.White, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold))
                }
                if (hasWeather) {
                    Text(weatherConditionEmoji(weather.condition), fontSize = (22 * tv.factor).sp)
                    Text(
                        "${weather.temperatureC.toInt()}°  ${weather.city}",
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }
}

private fun weatherConditionIcon(condition: String): androidx.compose.ui.graphics.vector.ImageVector {
    val c = condition.lowercase()
    return when {
        c.contains("thunder") || c.contains("storm") -> Icons.Rounded.FlashOn
        c.contains("rain") || c.contains("drizzle") || c.contains("shower") -> Icons.Rounded.WaterDrop
        c.contains("snow") || c.contains("blizzard") -> Icons.Rounded.AcUnit
        c.contains("fog") || c.contains("mist") || c.contains("haze") -> Icons.Rounded.Cloud
        c.contains("cloud") || c.contains("overcast") -> Icons.Rounded.CloudQueue
        else -> Icons.Rounded.WbSunny
    }
}

private fun weatherConditionEmoji(condition: String): String {
    val c = condition.lowercase()
    return when {
        c.contains("thunder") || c.contains("storm") -> "⛈️"
        c.contains("rain") || c.contains("drizzle") || c.contains("shower") -> "🌧️"
        c.contains("snow") || c.contains("blizzard") -> "❄️"
        c.contains("fog") || c.contains("mist") || c.contains("haze") -> "🌫️"
        c.contains("cloud") || c.contains("overcast") -> "☁️"
        else -> "☀️"
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

private data class AiChatMessage(val text: String, val mine: Boolean)

private const val HOME_SHELF_LIMIT = 15

private enum class AiSuggestionMode(val prompt: String) {
    MOVIES("Suggest new movies"),
    SERIES("Suggest new series"),
    LIVE("Suggest live channels"),
    SPORTS("Show sports and football"),
    CONTINUE("Continue watching"),
    SURPRISE("Surprise me"),
}

@Composable
private fun AiHomeButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    FocusGlow(modifier = modifier.height((48 * tv.factor).dp), cornerRadius = (14 * tv.factor).dp, onClick = onClick) {
        GlassPanel(radius = (14 * tv.factor).dp, highlighted = true, glow = visuals.accent.copy(alpha = 0.18f)) {
            Row(
                Modifier.fillMaxSize().padding(horizontal = (14 * tv.factor).dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy((9 * tv.factor).dp),
            ) {
                Icon(icon, null, tint = visuals.accent, modifier = Modifier.size((20 * tv.factor).dp))
                Text(label, color = Color.White, fontSize = (14 * tv.factor).sp, fontWeight = FontWeight.ExtraBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
private fun AiAssistantPanel(
    allContent: List<MediaItem>,
    football: List<FootballMatch>,
    seed: Int,
    chat: List<AiChatMessage>,
    input: String,
    compact: Boolean,
    selectedTvAction: Int = 0,
    mode: AiSuggestionMode,
    onInput: (String) -> Unit,
    onSend: () -> Unit,
    onQuickQuestion: (String) -> Unit,
    onMode: (AiSuggestionMode) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val s = if (tv.isTv) 1f else tv.factor
    val isArabic = LocalLayoutDirection.current == LayoutDirection.Rtl
    val picks = remember(allContent, football, seed, mode) { aiPicks(allContent, football, seed, mode) }
    val latestMovies = remember(allContent) { latestOfType(allContent, ContentType.MOVIE) }
    val latestSeries = remember(allContent) {
        allContent
            .filter { it.type == ContentType.SERIES || it.type == ContentType.EPISODE }
            .sortedByDescending { it.addedAt.takeIf { added -> added > 0 } ?: it.lastModifiedAt }
            .take(3)
    }
    if (tv.isTv) {
        Dialog(onDismissRequest = onClose) {
            AiTvAssistantPanel(
                picks = picks,
                latestMoviesCount = latestMovies.size,
                latestSeriesCount = latestSeries.size,
                selectedAction = selectedTvAction,
                onMovie = { onMode(AiSuggestionMode.MOVIES) },
                onSeries = { onMode(AiSuggestionMode.SERIES) },
                onLive = { onMode(AiSuggestionMode.LIVE) },
                onSports = { onMode(AiSuggestionMode.SPORTS) },
                onContinue = { onMode(AiSuggestionMode.CONTINUE) },
                onSurprise = { picks.firstOrNull()?.let(onPlay) },
                onClose = onClose,
            )
        }
        return
    }
    val panelWidth = if (compact) 340.dp else if (tv.isTv) 430.dp else 390.dp
    val panelHeight = if (compact) 380.dp else if (tv.isTv) 340.dp else 450.dp
    GlassPanel(
        modifier = modifier.widthIn(max = panelWidth).height(panelHeight),
        radius = (18 * s).dp,
        blur = 18.dp,
        highlighted = true,
        glow = visuals.accent.copy(alpha = 0.18f),
    ) {
        Column(Modifier.fillMaxSize().padding((12 * s).dp), verticalArrangement = Arrangement.spacedBy((6 * s).dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Icon(Icons.Rounded.SmartToy, null, tint = visuals.accent, modifier = Modifier.size((22 * s).dp))
                    Column {
                        Text(if (isArabic) "المساعد الذكي" else "Smart assistant", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = (17 * s).sp)
                        Text(if (isArabic) "اقتراحات · محادثة" else "Suggestions · Chat", color = Color(0xB8FFFFFF), fontSize = (10 * s).sp, maxLines = 1)
                    }
                }
                IconButton(onClick = onClose) { Icon(Icons.Rounded.Close, null, tint = Color.White) }
            }

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                AiInfoPill("Movies", latestMovies.size.toString(), Modifier.weight(1f))
                AiInfoPill("Series", latestSeries.size.toString(), Modifier.weight(1f))
                AiInfoPill("All", allContent.size.toString(), Modifier.weight(1f))
            }

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                AiQuickButton("Movies", Icons.Rounded.Movie, Modifier.weight(1f)) { onMode(AiSuggestionMode.MOVIES) }
                AiQuickButton("Series", Icons.Rounded.VideoLibrary, Modifier.weight(1f)) { onMode(AiSuggestionMode.SERIES) }
                AiQuickButton("Live", Icons.Rounded.LiveTv, Modifier.weight(1f)) { onMode(AiSuggestionMode.LIVE) }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                AiQuickButton("Sports", Icons.Rounded.SportsSoccer, Modifier.weight(1f)) { onMode(AiSuggestionMode.SPORTS) }
                AiQuickButton("Continue", Icons.Rounded.History, Modifier.weight(1f)) { onMode(AiSuggestionMode.CONTINUE) }
                AiQuickButton("Surprise", Icons.Rounded.Casino, Modifier.weight(1f)) {
                    onMode(AiSuggestionMode.SURPRISE)
                    picks.firstOrNull()?.let(onPlay)
                }
            }

            Text("Smart suggestions · ${mode.name.lowercase().replaceFirstChar { it.uppercase() }}", color = visuals.accent, fontWeight = FontWeight.Bold, fontSize = (12 * s).sp)
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                picks.take(if (tv.isTv || compact) 2 else 3).forEach { item -> AiSuggestionRow(item = item, onPlay = onPlay) }
            }

            val infoLine = when {
                latestMovies.isNotEmpty() && latestSeries.isNotEmpty() -> "New: ${latestMovies.first().title} · ${latestSeries.first().title}"
                latestMovies.isNotEmpty() -> "Latest movie: ${latestMovies.first().title}"
                latestSeries.isNotEmpty() -> "Latest series: ${latestSeries.first().title}"
                else -> "MoPlayer Pro supports your playlists and private server library."
            }
            Text(infoLine, color = Color(0xB8FFFFFF), fontSize = (11 * s).sp, maxLines = 1, overflow = TextOverflow.Ellipsis)

            if (football.isNotEmpty()) {
                Text(
                    "Today's matches: " + football.take(2).joinToString(" · ") { "${it.home} vs ${it.away}" },
                    color = Color(0xCCE3BC78),
                    fontSize = (11 * s).sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            if (tv.isTv) {
                val lastAssistantLine = if (chat.size == 1 && !chat.first().mine) {
                    freeAiIntro(allContent, football, isArabic)
                } else {
                    chat.lastOrNull { !it.mine }?.text ?: freeAiIntro(allContent, football, isArabic)
                }
                Text(
                    lastAssistantLine,
                    color = Color(0xDDFFFFFF),
                    fontSize = 11.sp,
                    lineHeight = 15.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.fillMaxWidth(),
                )
            } else {
                LazyColumn(Modifier.weight(1f).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    items(chat.takeLast(2).size) { index ->
                        val visibleChat = chat.takeLast(2)
                        val message = visibleChat[index]
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = if (message.mine) Arrangement.End else Arrangement.Start) {
                            GlassPanel(radius = 12.dp, highlighted = message.mine) {
                                Text(
                                    message.text,
                                    color = Color.White,
                                    fontSize = (11 * s).sp,
                                    lineHeight = (15 * s).sp,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.widthIn(max = if (compact) 240.dp else 330.dp).padding(horizontal = 10.dp, vertical = 7.dp),
                                )
                            }
                        }
                    }
                }

                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        value = input,
                        onValueChange = onInput,
                        placeholder = { Text("Ask about a movie or series...") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        leadingIcon = { Icon(Icons.Rounded.Mic, null, tint = visuals.accent) },
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
}

@Composable
private fun AiTvAssistantPanel(
    picks: List<MediaItem>,
    latestMoviesCount: Int,
    latestSeriesCount: Int,
    selectedAction: Int,
    onMovie: () -> Unit,
    onSeries: () -> Unit,
    onLive: () -> Unit,
    onSports: () -> Unit,
    onContinue: () -> Unit,
    onSurprise: () -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val visuals = LocalMoVisuals.current
    val firstFocus = remember { FocusRequester() }
    val isArabic = LocalLayoutDirection.current == LayoutDirection.Rtl

    LaunchedEffect(Unit) {
        firstFocus.requestFocus()
    }

    GlassPanel(
        modifier = modifier
            .width(330.dp)
            .height(316.dp)
            .onPreviewKeyEvent { event ->
                if (event.type == KeyEventType.KeyUp && (event.key == Key.Back || event.key == Key.Escape)) {
                    onClose()
                    true
                } else {
                    false
                }
            },
        radius = 16.dp,
        blur = 16.dp,
        highlighted = true,
        glow = visuals.accent.copy(alpha = 0.18f),
    ) {
        Column(
            Modifier.fillMaxSize().padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Rounded.SmartToy, null, tint = visuals.accent, modifier = Modifier.size(22.dp))
                    Text(if (isArabic) "المساعد الذكي" else "Smart assistant", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                }
                AiIconButton(Icons.Rounded.Close, "Close", onClose)
            }

            Text(
                if (isArabic) "أحدث الاقتراحات من مكتبتك" else "Latest picks from your library",
                color = visuals.accent,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
            )
            Text(
                picks.firstOrNull()?.title ?: if (isArabic) "اختر إجراءً بالريموت" else "Choose an action with the remote",
                color = Color(0xDDFFFFFF),
                fontSize = 12.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )

            AiRemoteActionButton(
                label = if (isArabic) "فاجئني" else "Surprise me",
                icon = Icons.Rounded.Casino,
                selected = selectedAction == 0,
                modifier = Modifier.fillMaxWidth().focusRequester(firstFocus),
                onClick = onSurprise,
            )

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AiRemoteActionButton(if (isArabic) "أفلام $latestMoviesCount" else "Movies $latestMoviesCount", Icons.Rounded.Movie, selectedAction == 1, Modifier.weight(1f), onMovie)
                AiRemoteActionButton(if (isArabic) "مسلسلات $latestSeriesCount" else "Series $latestSeriesCount", Icons.Rounded.VideoLibrary, selectedAction == 2, Modifier.weight(1f), onSeries)
            }

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AiRemoteActionButton(if (isArabic) "مباشر" else "Live", Icons.Rounded.LiveTv, selectedAction == 3, Modifier.weight(1f), onLive)
                AiRemoteActionButton(if (isArabic) "رياضة" else "Sports", Icons.Rounded.SportsSoccer, selectedAction == 4, Modifier.weight(1f), onSports)
            }

            AiRemoteActionButton(
                label = if (isArabic) "المتابعة" else "Continue",
                icon = Icons.Rounded.History,
                selected = selectedAction == 5,
                modifier = Modifier.fillMaxWidth(),
                onClick = onContinue,
            )
        }
    }
}

@Composable
private fun AiIconButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
) {
    FocusGlow(modifier = Modifier.size(38.dp), cornerRadius = 10.dp, onClick = onClick) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription, tint = Color.White, modifier = Modifier.size(20.dp))
        }
    }
}

@Composable
private fun AiRemoteActionButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    FocusGlow(modifier = modifier.height(40.dp), cornerRadius = 10.dp, onClick = onClick) {
        GlassPanel(
            modifier = Modifier.fillMaxSize(),
            radius = 10.dp,
            highlighted = selected,
            glow = if (selected) visuals.accent.copy(alpha = 0.22f) else Color.Transparent,
        ) {
            Row(
                Modifier.fillMaxSize().padding(horizontal = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(icon, null, tint = if (selected) visuals.accent else Color(0xCCFFFFFF), modifier = Modifier.size(18.dp))
                Text(label, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
private fun AiSuggestionRow(item: MediaItem, onPlay: (MediaItem) -> Unit) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val s = if (tv.isTv) 1f else tv.factor
    FocusGlow(cornerRadius = 12.dp, onClick = { onPlay(item) }) {
        Row(
            Modifier.fillMaxWidth().height((42 * s).dp).padding(horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Icon(typeIcon(item), null, tint = visuals.accent, modifier = Modifier.size((20 * s).dp))
            Column(Modifier.weight(1f)) {
                Text(item.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = (13 * s).sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(aiReason(item), color = Color(0x99FFFFFF), fontSize = (10 * s).sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Icon(Icons.Rounded.PlayArrow, null, tint = Color.White, modifier = Modifier.size((20 * s).dp))
        }
    }
}

@Composable
private fun AiInfoPill(label: String, value: String, modifier: Modifier = Modifier) {
    val tv = rememberTvScale()
    val s = if (tv.isTv) 1f else tv.factor
    GlassPanel(modifier = modifier.height((34 * s).dp), radius = 10.dp) {
        Row(
            Modifier.fillMaxSize().padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
        ) {
            Text(value, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = (12 * s).sp, maxLines = 1)
            Spacer(Modifier.width(4.dp))
            Text(label, color = Color(0xCCFFFFFF), fontSize = (10 * s).sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun AiQuickButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val s = if (tv.isTv) 1f else tv.factor
    FocusGlow(modifier = modifier.height((38 * s).dp), cornerRadius = 10.dp, onClick = onClick) {
        Row(
            Modifier.fillMaxSize().padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(icon, null, tint = visuals.accent, modifier = Modifier.size((16 * s).dp))
            Text(label, color = Color.White, fontWeight = FontWeight.Bold, fontSize = (10 * s).sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

private fun freeAiIntro(content: List<MediaItem>, football: List<FootballMatch>, isArabic: Boolean): String {
    return if (isArabic) {
        val matchLine = if (football.isNotEmpty()) " ويمكنني أيضاً عرض مباريات اليوم." else "."
        "مرحباً، أنا مساعدك الذكي داخل التطبيق. أقرأ مكتبتك المحلية وأقترح لك من ${content.size} عنصراً.$matchLine"
    } else {
        val matchLine = if (football.isNotEmpty()) " I can also show today's matches." else "."
        "Hi, I'm your smart assistant inside the app. I read your local library and can suggest from ${content.size} items.$matchLine"
    }
}

private fun aiPicks(content: List<MediaItem>, football: List<FootballMatch>, seed: Int, mode: AiSuggestionMode): List<MediaItem> {
    if (content.isEmpty()) return emptyList()
    val pool = when (mode) {
        AiSuggestionMode.MOVIES -> content.filter { it.type == ContentType.MOVIE }
        AiSuggestionMode.SERIES -> content.filter { it.type == ContentType.SERIES || it.type == ContentType.EPISODE }
        AiSuggestionMode.LIVE -> content.filter { it.type == ContentType.LIVE }
        AiSuggestionMode.SPORTS -> content.filter {
            val text = "${it.title} ${it.categoryName} ${it.genre}".lowercase()
            text.contains("sport") || text.contains("football") || text.contains("bein") || text.contains("رياض")
        }.ifEmpty {
            football.flatMap { match ->
                content.filter { item ->
                    val text = "${item.title} ${item.categoryName}".lowercase()
                    text.contains(match.home.lowercase()) || text.contains(match.away.lowercase()) || text.contains("sport")
                }
            }
        }
        AiSuggestionMode.CONTINUE -> content.filter { it.lastPlayedAt > 0 || it.watchPositionMs > 0 }
        AiSuggestionMode.SURPRISE -> content
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

private fun aiReply(message: String, content: List<MediaItem>, football: List<FootballMatch>): String {
    val query = message.lowercase()
    if (query.contains("match") || query.contains("football")) {
        return if (football.isEmpty()) "No matches are visible right now. Try sports channels or say: surprise me." else
            "Today's top matches: " + football.take(3).joinToString(" • ") { "${it.home} vs ${it.away} ${it.score}" }
    }
    val pool = when {
        query.contains("movie") -> content.filter { it.type == ContentType.MOVIE }
        query.contains("series") -> content.filter { it.type == ContentType.SERIES || it.type == ContentType.EPISODE }
        query.contains("channel") || query.contains("live") -> content.filter { it.type == ContentType.LIVE }
        else -> content
    }
    val best = pool.firstOrNull { it.title.contains(message, ignoreCase = true) }
        ?: pool.maxByOrNull { (it.rating.toDoubleOrNull() ?: 0.0) + if (it.lastPlayedAt > 0) 1.0 else 0.0 }
    return if (best == null) "I could not find a clear match. Try: movie, series, sports channel, or surprise me." else "I suggest: ${best.title}. ${aiReason(best)}"
}

private fun aiModeFor(message: String): AiSuggestionMode {
    val query = message.lowercase()
    return when {
        query.contains("movie") || query.contains("film") -> AiSuggestionMode.MOVIES
        query.contains("series") || query.contains("episode") -> AiSuggestionMode.SERIES
        query.contains("live") || query.contains("channel") -> AiSuggestionMode.LIVE
        query.contains("sport") || query.contains("match") || query.contains("football") -> AiSuggestionMode.SPORTS
        query.contains("continue") || query.contains("watching") -> AiSuggestionMode.CONTINUE
        else -> AiSuggestionMode.SURPRISE
    }
}

private fun aiReason(item: MediaItem): String = when {
    item.rating.isNotBlank() -> "Smart pick based on rating ${item.rating}"
    item.lastPlayedAt > 0 -> "Good match because you watched something similar recently"
    item.categoryName.isNotBlank() -> "From ${item.categoryName}"
    else -> "Suggested from the server order"
}

private fun typeIcon(item: MediaItem): androidx.compose.ui.graphics.vector.ImageVector = when (item.type) {
    ContentType.LIVE -> Icons.Rounded.LiveTv
    ContentType.MOVIE -> Icons.Rounded.Movie
    ContentType.SERIES,
    ContentType.EPISODE -> Icons.Rounded.VideoLibrary
}

private fun homeRestoreIndex(
    target: MediaItem?,
    leadingItems: Int,
    lanes: List<List<MediaItem>>,
): Int? {
    if (target == null) return null
    var index = leadingItems
    lanes.forEach { lane ->
        if (lane.isNotEmpty()) {
            if (lane.any { it.matchesHomeFocus(target) }) return index
            index++
        }
    }
    return null
}

private fun MediaItem.matchesHomeFocus(target: MediaItem): Boolean =
    id == target.id && type == target.type && serverId == target.serverId

private fun List<MediaItem>.homeLiveOrder(maxVideoHeight: Int): List<MediaItem> {
    if (maxVideoHeight >= 2160 || size <= 1) return this
    return sortedWith(
        compareBy<MediaItem> { it.title.isLikely4kChannel() }
            .thenBy { it.serverOrder }
            .thenBy { it.title.lowercase() },
    )
}

private fun String.isLikely4kChannel(): Boolean {
    val value = uppercase()
    return "4K" in value || "UHD" in value || "2160" in value
}

private fun String.toZoneId(): ZoneId =
    runCatching { ZoneId.of(this) }.getOrDefault(ZoneId.systemDefault())
