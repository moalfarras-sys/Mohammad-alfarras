package com.moalfarras.moplayer.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.moalfarras.moplayer.R
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.FootballMatch
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import com.moalfarras.moplayer.ui.components.CinematicBackdrop
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.components.MediaLane
import com.moalfarras.moplayer.ui.components.SurpriseButton
import com.moalfarras.moplayer.ui.components.WeatherScene
import com.moalfarras.moplayer.ui.components.backdropUrlFrom
import com.moalfarras.moplayer.ui.theme.*
import java.time.LocalTime
import java.time.format.DateTimeFormatter

@Composable
fun HomeScreen(
    weather: WeatherSnapshot,
    football: List<FootballMatch>,
    continueWatching: List<MediaItem>,
    recentLive: List<MediaItem>,
    latestLive: List<MediaItem>,
    latestMovies: List<MediaItem>,
    latestSeries: List<MediaItem>,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
    accent: Color,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current

    val homeBackdropUrl = remember(continueWatching, latestLive, latestMovies, latestSeries, recentLive) {
        backdropUrlFrom(
            continueWatching.firstOrNull(),
            latestMovies.firstOrNull(),
            latestSeries.firstOrNull(),
            latestLive.firstOrNull(),
            recentLive.firstOrNull(),
        )
    }

    if (!tv.isTv) {
        val mobileClock = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"))
        Box(Modifier.fillMaxSize()) {
            CinematicBackdrop(homeBackdropUrl)
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
                            contentDescription = "MoPlayer2",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier
                                .height(if (tv.isLowHeightLandscape) 32.dp else 42.dp)
                                .widthIn(max = if (tv.isLowHeightLandscape) 96.dp else 120.dp),
                        )
                        if (tv.isLowHeightLandscape) {
                            SurpriseButton(
                                onClick = { (recentLive + latestLive + latestMovies + latestSeries + continueWatching).randomOrNull()?.let(onPlay) },
                                modifier = Modifier.fillMaxWidth(0.36f),
                            )
                        }
                        GlassPanel(radius = 16.dp, blur = 10.dp) {
                            Column(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                horizontalAlignment = Alignment.End,
                            ) {
                                Text(mobileClock, color = Color.White, style = MaterialTheme.typography.titleLarge)
                                Text("${weather.temperatureC.toInt()}°  ${weather.city}", color = visuals.accent, style = MaterialTheme.typography.labelMedium, maxLines = 1)
                            }
                        }
                    }
                }
                if (!tv.isLowHeightLandscape) item {
                    Box(Modifier.fillMaxWidth()) {
                        SurpriseButton(
                            onClick = { (recentLive + latestLive + latestMovies + latestSeries + continueWatching).randomOrNull()?.let(onPlay) },
                            modifier = Modifier
                                .fillMaxWidth(if (tv.isLowHeightLandscape) 0.34f else 1f)
                                .align(Alignment.CenterStart),
                        )
                    }
                }
                if (continueWatching.isNotEmpty()) {
                    item { MediaLane("متابعة المشاهدة", continueWatching, onFocus, onPlay, onFavorite) }
                }
                if (latestLive.isNotEmpty()) {
                    item { MediaLane("أحدث القنوات", latestLive, onFocus, onPlay, onFavorite) }
                }
                if (latestMovies.isNotEmpty()) {
                    item { MediaLane("أحدث الأفلام", latestMovies, onFocus, onPlay, onFavorite) }
                }
                if (latestSeries.isNotEmpty()) {
                    item { MediaLane("أحدث المسلسلات", latestSeries, onFocus, onPlay, onFavorite) }
                }
            }
        }
        return
    }

    var clockText by remember { mutableStateOf(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"))) }
    LaunchedEffect(Unit) {
        while (true) {
            clockText = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"))
            kotlinx.coroutines.delay(30_000)
        }
    }

    Box(Modifier.fillMaxSize()) {
        CinematicBackdrop(homeBackdropUrl)

        WeatherScene(weather = weather, accent = accent)

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(tv.laneSpacing),
            modifier = Modifier
                .fillMaxSize()
                .padding(start = tv.contentPadding, top = tv.contentPadding, end = tv.contentPadding, bottom = 120.dp),
        ) {
            // ── TOP BAR ──────────────────────────────────────────────────────
            item {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top,
                ) {
                    Column(
                        modifier = Modifier.weight(0.35f),
                        verticalArrangement = Arrangement.spacedBy((16 * tv.factor).dp),
                    ) {
                        Image(
                            painter = painterResource(R.drawable.ic_splash_logo),
                            contentDescription = "MoPlayer2",
                            contentScale = ContentScale.Fit,
                            alignment = Alignment.CenterStart,
                            modifier = Modifier.height((52 * tv.factor).dp)
                        )
                        SurpriseButton(
                            onClick = { (recentLive + latestLive + latestMovies + latestSeries + continueWatching).randomOrNull()?.let(onPlay) },
                            modifier = Modifier.fillMaxWidth(0.85f),
                        )
                    }

                    Row(
                        modifier = Modifier.weight(0.65f),
                        horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp, Alignment.End),
                        verticalAlignment = Alignment.Top,
                    ) {
                        // Clock + Weather
                        GlassPanel(radius = (22 * tv.factor).dp, highlighted = false, blur = 16.dp) {
                            Column(
                                modifier = Modifier.padding(horizontal = (22 * tv.factor).dp, vertical = (16 * tv.factor).dp),
                                horizontalAlignment = Alignment.End,
                                verticalArrangement = Arrangement.spacedBy((4 * tv.factor).dp),
                            ) {
                                AnimatedContent(
                                    targetState = clockText,
                                    transitionSpec = { fadeIn(tween(600)) togetherWith fadeOut(tween(300)) },
                                    label = "clock-flip"
                                ) { time ->
                                    Text(
                                        time, color = Color.White,
                                        style = MaterialTheme.typography.displaySmall.copy(
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = (32 * tv.factor).sp,
                                            letterSpacing = 2.sp
                                        ),
                                    )
                                }
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    if (weather.iconUrl.isNotBlank()) {
                                        coil3.compose.AsyncImage(
                                            model = weather.iconUrl, contentDescription = null,
                                            modifier = Modifier.size((26 * tv.factor).dp)
                                        )
                                    }
                                    Text(
                                        "${weather.temperatureC.toInt()}°  ${weather.city}",
                                        color = visuals.accent,
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    )
                                }
                                Text(weather.condition, color = Color(0xCCE3BC78), style = MaterialTheme.typography.bodyMedium)
                            }
                        }

                        // Football Widget
                        if (football.isNotEmpty()) {
                            GlassPanel(radius = (22 * tv.factor).dp, highlighted = false, blur = 16.dp) {
                                Column(
                                    modifier = Modifier.padding((16 * tv.factor).dp).widthIn(max = (400 * tv.factor).dp),
                                    verticalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Icon(Icons.Rounded.SportsSoccer, null, tint = visuals.accent, modifier = Modifier.size((18 * tv.factor).dp))
                                        Text("مباريات اليوم", color = Color.White, style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp))
                                    }
                                    football.take(3).forEach { match ->
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically,
                                        ) {
                                            Text(
                                                "${match.home} vs ${match.away}",
                                                color = Color(0xDDFFFFFF), style = MaterialTheme.typography.bodySmall,
                                                maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f),
                                            )
                                            Spacer(Modifier.width(8.dp))
                                            Text(
                                                text = if (match.minute.contains("'")) match.score else match.minute,
                                                color = if (match.minute.contains("'")) visuals.accent else Color(0x99FFFFFF),
                                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.ExtraBold),
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (continueWatching.isNotEmpty()) {
                item { MediaLane("متابعة المشاهدة", continueWatching, onFocus, onPlay, onFavorite) }
            }
            if (latestLive.isNotEmpty()) {
                item { MediaLane("أحدث القنوات المضافة", latestLive, onFocus, onPlay, onFavorite) }
            }
            if (latestMovies.isNotEmpty()) {
                item { MediaLane("أحدث الأفلام المضافة", latestMovies, onFocus, onPlay, onFavorite) }
            }
            if (latestSeries.isNotEmpty()) {
                item { MediaLane("أحدث المسلسلات المضافة", latestSeries, onFocus, onPlay, onFavorite) }
            }
        }
    }
}
