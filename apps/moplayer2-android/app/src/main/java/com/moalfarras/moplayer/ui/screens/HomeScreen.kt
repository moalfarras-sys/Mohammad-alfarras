package com.moalfarras.moplayer.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.moalfarras.moplayerpro.R
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.FootballMatch
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.MotionLevel
import com.moalfarras.moplayer.domain.model.ThemePreset
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import com.moalfarras.moplayer.ui.components.*
import com.moalfarras.moplayer.ui.theme.*
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
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
    settings: AppSettings,
    restoreFocusItem: MediaItem?,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
    accent: Color,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val hasContent = continueWatching.isNotEmpty() ||
        recentLive.isNotEmpty() ||
        latestLive.isNotEmpty() ||
        latestMovies.isNotEmpty() ||
        latestSeries.isNotEmpty()
    val allContent = remember(continueWatching, recentLive, latestLive, latestMovies, latestSeries) {
        (continueWatching + recentLive + latestLive + latestMovies + latestSeries)
            .distinctBy { "${it.type}:${it.serverId}:${it.id}" }
    }
    var showAiAssistant by remember { mutableStateOf(false) }
    var aiChat by remember { mutableStateOf(listOf(AiChatMessage(freeAiIntro(allContent, football), false))) }
    var aiInput by remember { mutableStateOf("") }
    var surpriseSeed by remember { mutableIntStateOf(0) }
    var aiTvAction by remember { mutableIntStateOf(0) }
    fun askAi(message: String) {
        val clean = message.trim()
        if (clean.isNotBlank()) {
            aiChat = aiChat + AiChatMessage(clean, true) + AiChatMessage(aiReply(clean, allContent, football), false)
        }
    }

    val homeBackdropUrl = remember(continueWatching, latestLive, latestMovies, latestSeries, recentLive) {
        backdropUrlFrom(
            continueWatching.firstOrNull(),
            latestMovies.firstOrNull(),
            latestSeries.firstOrNull(),
            latestLive.firstOrNull(),
            recentLive.firstOrNull(),
        )
    }
    // Dynamic backdrop follows focused item
    var focusedBackdrop by remember { mutableStateOf<String?>(null) }
    val displayBackdrop = focusedBackdrop ?: homeBackdropUrl
    val selectedBackdrop = remember(settings.backgroundMode, settings.customBackgroundUrl, settings.themePreset, displayBackdrop) {
        resolveHomeBackdropUrl(settings, displayBackdrop)
    }
    // Keep the photo layer strong; motion level mainly affects particles + atmosphere elsewhere.
    val backdropAlpha = when (settings.motionLevel) {
        MotionLevel.LOW -> 0.90f
        MotionLevel.BALANCED -> 0.96f
        MotionLevel.RICH -> 1f
    }
    val footballMatches = remember(football, settings.footballMaxMatches, settings.showFootballWidget) {
        if (settings.showFootballWidget) football.take(settings.footballMaxMatches.coerceIn(1, 8)) else emptyList()
    }
    val wrappedOnFocus: (MediaItem) -> Unit = { item ->
        focusedBackdrop = backdropUrlFrom(item)
        onFocus(item)
    }

    // Breathing animation for subtle ambient pulse
    val infiniteTransition = rememberInfiniteTransition(label = "home")
    val breathe by infiniteTransition.animateFloat(
        initialValue = 0.92f, targetValue = 1.0f,
        animationSpec = infiniteRepeatable(tween(4000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "breathe",
    )

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
        Box(Modifier.fillMaxSize()) {
            AtmosphericSkyGradient(timeZoneId = weather.timeZoneId)
            CinematicBackdrop(selectedBackdrop, showParticles = settings.motionLevel != MotionLevel.LOW, modifier = Modifier.graphicsLayer { alpha = backdropAlpha })
            AtmosphericWeatherEffectsOverlay(weather = weather, accent = accent, motionLevel = settings.motionLevel)

            LazyColumn(
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
                            Row(Modifier.fillMaxWidth(0.50f), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                AiHomeButton("AI", Icons.Rounded.AutoAwesome, Modifier.weight(1f)) { showAiAssistant = true }
                                AiHomeButton("فاجئني", Icons.Rounded.Casino, Modifier.weight(1f)) {
                                    surpriseSeed++
                                    showAiAssistant = true
                                }
                            }
                        }
                        if (settings.showWeatherWidget || settings.showClockWidget) {
                            MobileWeatherChip(weather, visuals, mobileClock, settings.showWeatherWidget, settings.showClockWidget)
                        }
                    }
                }
                if (!tv.isLowHeightLandscape) item {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        AiHomeButton("مساعد AI مجاني", Icons.Rounded.SmartToy, Modifier.weight(1f)) { showAiAssistant = true }
                        AiHomeButton("فاجئني", Icons.Rounded.Casino, Modifier.weight(1f)) {
                            surpriseSeed++
                            showAiAssistant = true
                        }
                    }
                }
                if (!hasContent) {
                    item {
                        EmptyState(
                            title = "المكتبة فارغة",
                            message = "أضف حساب Xtream أو قائمة M3U، أو حدّث السيرفر من الإعدادات.",
                            modifier = Modifier.fillMaxWidth().height(220.dp),
                        )
                    }
                }
                if (continueWatching.isNotEmpty()) {
                    item { MediaLane("متابعة المشاهدة", continueWatching, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem) }
                }
                if (latestLive.isNotEmpty()) {
                    item { MediaLane("أحدث القنوات", latestLive, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem) }
                }
                if (latestMovies.isNotEmpty()) {
                    item { MediaLane("أحدث الأفلام", latestMovies, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem) }
                }
                if (latestSeries.isNotEmpty()) {
                    item { MediaLane("أحدث المسلسلات", latestSeries, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem) }
                }
            }
            if (showAiAssistant) {
                AiAssistantPanel(
                    allContent = allContent,
                    football = football,
                    seed = surpriseSeed,
                    chat = aiChat,
                    input = aiInput,
                    compact = tv.isCompact || tv.isLowHeightLandscape,
                    onInput = { aiInput = it },
                    onSend = {
                        val message = aiInput.trim()
                        if (message.isNotBlank()) {
                            askAi(message)
                            aiInput = ""
                        }
                    },
                    onQuickQuestion = ::askAi,
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
    val tvZone = remember(weather.timeZoneId) { weather.timeZoneId.toZoneId() }
    var tvNow by remember(tvZone) { mutableStateOf(ZonedDateTime.now(tvZone)) }
    LaunchedEffect(tvZone) {
        while (true) {
            kotlinx.coroutines.delay(1000)
            tvNow = ZonedDateTime.now(tvZone)
        }
    }
    val tvClock = tvNow.format(DateTimeFormatter.ofPattern("HH:mm"))

    Box(
        Modifier
            .fillMaxSize()
            .onPreviewKeyEvent { event ->
                if (!showAiAssistant || !tv.isTv || event.type != KeyEventType.KeyUp) return@onPreviewKeyEvent false
                when (event.key) {
                    Key.DirectionDown, Key.DirectionRight -> {
                        aiTvAction = (aiTvAction + 1) % 4
                        true
                    }
                    Key.DirectionUp, Key.DirectionLeft -> {
                        aiTvAction = (aiTvAction + 3) % 4
                        true
                    }
                    Key.Enter, Key.DirectionCenter -> {
                        when (aiTvAction) {
                            0 -> aiPicks(allContent, surpriseSeed).firstOrNull()?.let(onPlay)
                            1 -> askAi("اقترح أفلام جديدة")
                            2 -> askAi("اقترح مسلسلات جديدة")
                            else -> showAiAssistant = false
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
        AtmosphericSkyGradient(timeZoneId = weather.timeZoneId)
        CinematicBackdrop(selectedBackdrop, showParticles = settings.motionLevel != MotionLevel.LOW, modifier = Modifier.graphicsLayer { alpha = backdropAlpha })
        AtmosphericWeatherEffectsOverlay(weather = weather, accent = accent, motionLevel = settings.motionLevel)

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(tv.laneSpacing),
            modifier = Modifier
                .fillMaxSize()
                .padding(start = tv.contentPadding, top = tv.contentPadding, end = tv.contentPadding, bottom = 120.dp),
        ) {
            // ── TOP BAR: Premium Widget Strip ────────────────────────────
            item {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top,
                ) {
                    // Left: Logo + Branding + Surprise Button
                    Column(
                        modifier = Modifier.weight(0.30f),
                        verticalArrangement = Arrangement.spacedBy((14 * tv.factor).dp),
                    ) {
                        // Logo with breathing ambient glow
                        Box(contentAlignment = Alignment.CenterStart) {
                            // Ambient glow behind logo
                            Box(
                                Modifier
                                    .size((60 * tv.factor).dp)
                                    .graphicsLayer { alpha = 0.25f * breathe }
                                    .drawBehind {
                                        drawCircle(
                                            brush = Brush.radialGradient(
                                                colors = listOf(accent.copy(alpha = 0.4f), Color.Transparent),
                                            ),
                                            radius = size.minDimension * 1.2f,
                                        )
                                    },
                            )
                            Image(
                                painter = painterResource(R.drawable.ic_splash_logo),
                                contentDescription = "MoPlayer Pro",
                                contentScale = ContentScale.Fit,
                                alignment = Alignment.CenterStart,
                                modifier = Modifier.height((48 * tv.factor).dp),
                            )
                        }

                        // Premium tagline
                        Text(
                            "PREMIUM IPTV",
                            color = visuals.accent.copy(alpha = 0.7f),
                            fontSize = (10 * tv.factor).sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 3.sp,
                        )

                        AiHomeButton(
                            label = "مساعد AI مجاني",
                            icon = Icons.Rounded.SmartToy,
                            modifier = Modifier.fillMaxWidth(0.88f),
                        ) {
                            aiTvAction = 0
                            showAiAssistant = true
                        }
                        AiHomeButton(
                            label = "فاجئني",
                            icon = Icons.Rounded.Casino,
                            modifier = Modifier.fillMaxWidth(0.88f),
                        ) {
                            surpriseSeed++
                            aiTvAction = 0
                            showAiAssistant = true
                        }
                    }

                    // Right: Premium Widget Bar
                    Row(
                        modifier = Modifier.weight(0.70f),
                        horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp, Alignment.End),
                        verticalAlignment = Alignment.Top,
                    ) {
                        // Weather + Clock widget (enhanced with animated weather icon)
                        when {
                            settings.showWeatherWidget && settings.showClockWidget -> {
                                WeatherClockWidget(
                                    weather = weather,
                                    showWeather = true,
                                    showClock = true,
                                    modifier = Modifier.wrapContentWidth(),
                                )
                            }
                            settings.showWeatherWidget || settings.showClockWidget -> {
                                CompactWidgetCard(
                                    weather = weather,
                                    clock = tvClock,
                                    showWeather = settings.showWeatherWidget,
                                    showClock = settings.showClockWidget,
                                    modifier = Modifier.wrapContentWidth(),
                                )
                            }
                        }

                        // Football ticker (if matches available)
                        if (footballMatches.isNotEmpty()) {
                            FootballTickerWidget(
                                matches = footballMatches,
                                modifier = Modifier.wrapContentWidth(),
                            )
                        }
                    }
                }
            }

            // ── CONTENT RAILS ───────────────────────────────────────────
            if (!hasContent) {
                item {
                    EmptyState(
                        title = "المكتبة فارغة",
                        message = "أضف حساب Xtream أو قائمة M3U، أو حدّث السيرفر من الإعدادات.",
                        modifier = Modifier.fillMaxWidth().height((260 * tv.factor).dp),
                    )
                }
            }
            if (continueWatching.isNotEmpty()) {
                item { MediaLane("متابعة المشاهدة", continueWatching, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem) }
            }
            if (recentLive.isNotEmpty()) {
                item { MediaLane("قنواتي الأخيرة", recentLive, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem) }
            }
            if (latestLive.isNotEmpty()) {
                item { MediaLane("أحدث القنوات المضافة", latestLive, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem) }
            }
            if (latestMovies.isNotEmpty()) {
                item { MediaLane("أحدث الأفلام المضافة", latestMovies, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem) }
            }
            if (latestSeries.isNotEmpty()) {
                item { MediaLane("أحدث المسلسلات المضافة", latestSeries, wrappedOnFocus, onPlay, onFavorite, restoreFocusTarget = restoreFocusItem) }
            }
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
                onInput = { aiInput = it },
                onSend = {
                    val message = aiInput.trim()
                    if (message.isNotBlank()) {
                        askAi(message)
                        aiInput = ""
                    }
                },
                onQuickQuestion = ::askAi,
                onPlay = onPlay,
                onClose = { showAiAssistant = false },
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = tv.contentPadding),
            )
        }
    }
}

// ──────────────────────────────────────────────────────────────────────
// Mobile Weather Chip (compact glass widget for phone/tablet)
// ──────────────────────────────────────────────────────────────────────
@Composable
private fun MobileWeatherChip(weather: WeatherSnapshot, visuals: MoVisuals, clock: String, showWeather: Boolean = true, showClock: Boolean = true) {
    GlassPanel(radius = 16.dp, blur = 10.dp) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            // Mini weather condition indicator
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
                Icon(
                    weatherConditionIcon(weather.condition),
                    contentDescription = null,
                    tint = weatherConditionColor(weather.condition),
                    modifier = Modifier.size(16.dp),
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(clock, color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
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
                if (showWeather) {
                    Icon(weatherConditionIcon(weather.condition), null, tint = weatherConditionColor(weather.condition), modifier = Modifier.size((24 * tv.factor).dp))
                    Text(
                        "${weather.temperatureC.toInt()}Â°  ${weather.city}",
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
    onInput: (String) -> Unit,
    onSend: () -> Unit,
    onQuickQuestion: (String) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val s = if (tv.isTv) 1f else tv.factor
    val picks = remember(allContent, football, seed) { aiPicks(allContent, seed) }
    val latestMovies = remember(allContent) { latestOfType(allContent, com.moalfarras.moplayer.domain.model.ContentType.MOVIE) }
    val latestSeries = remember(allContent) {
        allContent
            .filter { it.type == com.moalfarras.moplayer.domain.model.ContentType.SERIES || it.type == com.moalfarras.moplayer.domain.model.ContentType.EPISODE }
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
                onMovie = { onQuickQuestion("اقترح أفلام جديدة") },
                onSeries = { onQuickQuestion("اقترح مسلسلات جديدة") },
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
                        Text("Mo AI", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = (17 * s).sp)
                        Text("مساعد مجاني · www.moalfarras.space", color = Color(0xB8FFFFFF), fontSize = (10 * s).sp, maxLines = 1)
                    }
                }
                IconButton(onClick = onClose) { Icon(Icons.Rounded.Close, null, tint = Color.White) }
            }

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                AiInfoPill("الأفلام", latestMovies.size.toString(), Modifier.weight(1f))
                AiInfoPill("المسلسلات", latestSeries.size.toString(), Modifier.weight(1f))
                AiInfoPill("الكل", allContent.size.toString(), Modifier.weight(1f))
            }

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                AiQuickButton("أفلام جديدة", Icons.Rounded.Movie, Modifier.weight(1f)) { onQuickQuestion("اقترح أفلام جديدة") }
                AiQuickButton("مسلسلات", Icons.Rounded.VideoLibrary, Modifier.weight(1f)) { onQuickQuestion("اقترح مسلسلات جديدة") }
                AiQuickButton("فاجئني", Icons.Rounded.Casino, Modifier.weight(1f)) { picks.firstOrNull()?.let(onPlay) }
            }

            Text("اقتراحات ذكية", color = visuals.accent, fontWeight = FontWeight.Bold, fontSize = (12 * s).sp)
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                picks.take(if (tv.isTv || compact) 2 else 3).forEach { item -> AiSuggestionRow(item = item, onPlay = onPlay) }
            }

            val infoLine = when {
                latestMovies.isNotEmpty() && latestSeries.isNotEmpty() -> "جديد: ${latestMovies.first().title} · ${latestSeries.first().title}"
                latestMovies.isNotEmpty() -> "أحدث فيلم: ${latestMovies.first().title}"
                latestSeries.isNotEmpty() -> "أحدث مسلسل: ${latestSeries.first().title}"
                else -> "MoPlayer Pro يدعم قوائمك ومكتبة السيرفر الخاصة بك."
            }
            Text(infoLine, color = Color(0xB8FFFFFF), fontSize = (11 * s).sp, maxLines = 1, overflow = TextOverflow.Ellipsis)

            if (football.isNotEmpty()) {
                Text(
                    "مباريات اليوم: " + football.take(2).joinToString(" · ") { "${it.home} ضد ${it.away}" },
                    color = Color(0xCCE3BC78),
                    fontSize = (11 * s).sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            if (tv.isTv) {
                val lastAssistantLine = if (chat.size == 1 && !chat.first().mine) {
                    freeAiIntro(allContent, football)
                } else {
                    chat.lastOrNull { !it.mine }?.text ?: freeAiIntro(allContent, football)
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
                        placeholder = { Text("اسأل عن فيلم أو مسلسل...") },
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
                    Button(onClick = onSend, enabled = input.isNotBlank()) { Icon(Icons.Rounded.Send, null) }
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
    onSurprise: () -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val visuals = LocalMoVisuals.current
    val firstFocus = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        firstFocus.requestFocus()
    }

    GlassPanel(
        modifier = modifier
            .width(300.dp)
            .height(245.dp)
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
                    Text("مساعد ذكي", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                }
                AiIconButton(Icons.Rounded.Close, "إغلاق", onClose)
            }

            Text(
                picks.firstOrNull()?.title ?: "اختر أمراً بالريموت",
                color = Color(0xDDFFFFFF),
                fontSize = 12.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )

            AiRemoteActionButton(
                label = "فاجئني",
                icon = Icons.Rounded.Casino,
                selected = selectedAction == 0,
                modifier = Modifier.fillMaxWidth().focusRequester(firstFocus),
                onClick = onSurprise,
            )

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AiRemoteActionButton("أفلام $latestMoviesCount", Icons.Rounded.Movie, selectedAction == 1, Modifier.weight(1f), onMovie)
                AiRemoteActionButton("مسلسلات $latestSeriesCount", Icons.Rounded.VideoLibrary, selectedAction == 2, Modifier.weight(1f), onSeries)
            }

            AiRemoteActionButton(
                label = "إغلاق",
                icon = Icons.Rounded.KeyboardReturn,
                selected = selectedAction == 3,
                modifier = Modifier.fillMaxWidth(),
                onClick = onClose,
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

private fun freeAiIntro(content: List<MediaItem>, football: List<FootballMatch>): String {
    val matchLine = if (football.isNotEmpty()) " وعندي مباريات اليوم كمان." else "."
    return "أهلاً، أنا Mo AI مجاني داخل التطبيق. أقرأ مكتبتك محلياً وأقترح لك من ${content.size} عنصر$matchLine"
}

private fun aiPicks(content: List<MediaItem>, seed: Int): List<MediaItem> {
    if (content.isEmpty()) return emptyList()
    val boosted = content.sortedWith(
        compareByDescending<MediaItem> { it.rating.toDoubleOrNull() ?: 0.0 }
            .thenByDescending { it.lastPlayedAt }
            .thenByDescending { it.addedAt.takeIf { added -> added > 0 } ?: it.lastModifiedAt },
    )
    val offset = seed.coerceAtLeast(0) % boosted.size
    return (boosted.drop(offset) + boosted.take(offset)).take(6)
}

private fun latestOfType(content: List<MediaItem>, type: com.moalfarras.moplayer.domain.model.ContentType): List<MediaItem> =
    content
        .filter { it.type == type }
        .sortedByDescending { it.addedAt.takeIf { added -> added > 0 } ?: it.lastModifiedAt }
        .take(3)

private fun aiReply(message: String, content: List<MediaItem>, football: List<FootballMatch>): String {
    val query = message.lowercase()
    if (query.contains("مبار") || query.contains("match") || query.contains("football")) {
        return if (football.isEmpty()) "ما عندي مباريات ظاهرة الآن. جرّب ابحث عن قنوات رياضة أو قل: فاجئني." else
            "أهم مباريات اليوم: " + football.take(3).joinToString(" • ") { "${it.home} ضد ${it.away} ${it.score}" }
    }
    val pool = when {
        query.contains("فيلم") || query.contains("movie") -> content.filter { it.type == com.moalfarras.moplayer.domain.model.ContentType.MOVIE }
        query.contains("مسلسل") || query.contains("series") -> content.filter { it.type == com.moalfarras.moplayer.domain.model.ContentType.SERIES || it.type == com.moalfarras.moplayer.domain.model.ContentType.EPISODE }
        query.contains("قناة") || query.contains("channel") || query.contains("مباشر") -> content.filter { it.type == com.moalfarras.moplayer.domain.model.ContentType.LIVE }
        else -> content
    }
    val best = pool.firstOrNull { it.title.contains(message, ignoreCase = true) }
        ?: pool.maxByOrNull { (it.rating.toDoubleOrNull() ?: 0.0) + if (it.lastPlayedAt > 0) 1.0 else 0.0 }
    return if (best == null) "ما لقيت شيء واضح الآن. جرّب: فيلم، مسلسل، قناة رياضة، أو فاجئني." else "أقترح عليك: ${best.title}. ${aiReason(best)}"
}

private fun aiReason(item: MediaItem): String = when {
    item.rating.isNotBlank() -> "اختيار ذكي حسب التقييم ${item.rating}"
    item.lastPlayedAt > 0 -> "مناسب لأنك شاهدت شيئاً قريباً منه"
    item.categoryName.isNotBlank() -> "من تصنيف ${item.categoryName}"
    else -> "اقتراح من ترتيب السيرفر"
}

private fun typeIcon(item: MediaItem): androidx.compose.ui.graphics.vector.ImageVector = when (item.type) {
    com.moalfarras.moplayer.domain.model.ContentType.LIVE -> Icons.Rounded.LiveTv
    com.moalfarras.moplayer.domain.model.ContentType.MOVIE -> Icons.Rounded.Movie
    com.moalfarras.moplayer.domain.model.ContentType.SERIES,
    com.moalfarras.moplayer.domain.model.ContentType.EPISODE -> Icons.Rounded.VideoLibrary
}

private fun String.toZoneId(): ZoneId =
    runCatching { ZoneId.of(this) }.getOrDefault(ZoneId.systemDefault())
