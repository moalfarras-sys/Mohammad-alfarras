package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import java.time.ZoneId
import java.time.ZonedDateTime
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * Time-of-day sky gradient + drifting aurora mesh. Sits under the backdrop image.
 *
 * The mesh blends a few large, slow-moving accent blobs (gold / ember / amber) over
 * the deep noir base for a modern "aurora glass" wallpaper without a photo.
 */
@Composable
fun AtmosphericSkyGradient(
    modifier: Modifier = Modifier,
    timeZoneId: String = ZoneId.systemDefault().id,
    animate: Boolean = true,
) {
    val visuals = LocalMoVisuals.current
    val zoneId = remember(timeZoneId) { timeZoneId.toZoneId() }
    var now by remember(zoneId) { mutableStateOf(ZonedDateTime.now(zoneId)) }
    LaunchedEffect(zoneId) {
        while (true) {
            kotlinx.coroutines.delay(60_000)
            now = ZonedDateTime.now(zoneId)
        }
    }
    val hour = now.hour + now.minute / 60f
    val tod = timeOfDay(hour)

    // Only spin up the drift transition when motion is enabled; otherwise the aurora kept
    // invalidating the whole backdrop every frame even though the drift value was pinned to 0.
    val drift = if (animate) {
        val transition = rememberInfiniteTransition(label = "aurora")
        val rawDrift by transition.animateFloat(
            initialValue = 0f,
            targetValue = 2f * PI.toFloat(),
            animationSpec = infiniteRepeatable(tween(46_000, easing = LinearEasing)),
            label = "aurora-drift",
        )
        rawDrift
    } else {
        0f
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(tod.skyTop, tod.skyMid, tod.skyBottom, tod.horizon),
                ),
            ),
    ) {
        Canvas(Modifier.fillMaxSize()) {
            drawAuroraMesh(size.width, size.height, drift, tod.isDay, visuals)
        }
    }
}

private fun DrawScope.drawAuroraMesh(
    w: Float,
    h: Float,
    drift: Float,
    isDay: Boolean,
    visuals: com.moalfarras.moplayer.ui.theme.MoVisuals,
) {
    val intensity = if (isDay) 1f else 0.72f
    drawAuroraBlob(
        Offset(w * (0.22f + 0.06f * cos(drift)), h * (0.18f + 0.05f * sin(drift))),
        w * 0.58f, visuals.accent.copy(alpha = 0.16f * intensity),
    )
    drawAuroraBlob(
        Offset(w * (0.84f + 0.05f * cos(drift + 1.7f)), h * (0.80f + 0.05f * sin(drift + 1.7f))),
        w * 0.52f, visuals.accentB.copy(alpha = 0.13f * intensity),
    )
    drawAuroraBlob(
        Offset(w * (0.64f + 0.07f * cos(drift + 3.1f)), h * (0.36f + 0.06f * sin(drift + 3.1f))),
        w * 0.44f, visuals.accentWarm.copy(alpha = 0.10f * intensity),
    )
    drawAuroraBlob(
        Offset(w * (0.30f + 0.05f * cos(drift + 4.6f)), h * (0.78f + 0.05f * sin(drift + 4.6f))),
        w * 0.46f, Color(0xFF3A2A6A).copy(alpha = 0.09f * intensity),
    )
}

private fun DrawScope.drawAuroraBlob(center: Offset, radius: Float, color: Color) {
    drawCircle(
        brush = Brush.radialGradient(listOf(color, Color.Transparent), center = center, radius = radius),
        radius = radius,
        center = center,
    )
}

// ────────────────────────────────────────────────────────────────────────────
// Time of Day
// ────────────────────────────────────────────────────────────────────────────

private data class TimeOfDay(
    val skyTop: Color, val skyMid: Color, val skyBottom: Color, val horizon: Color,
    val sunPosition: Offset, val moonPosition: Offset,
    val streakColor: Color, val isDay: Boolean,
)

private fun timeOfDay(hour: Float): TimeOfDay = when {
    hour < 5f  -> TimeOfDay( // Night
        skyTop = Color(0xFF020205), skyMid = Color(0xFF08070A), skyBottom = Color(0xFF0D0C0F), horizon = Color(0xFF141018),
        sunPosition = Offset(0.2f, 0.9f), moonPosition = Offset(0.75f, 0.18f),
        streakColor = Color(0xFF4466AA), isDay = false,
    )
    hour < 7f  -> TimeOfDay( // Dawn
        skyTop = Color(0xFF0D0A12), skyMid = Color(0xFF1A1218), skyBottom = Color(0xFF2A1A14), horizon = Color(0xFF3A2218),
        sunPosition = Offset(0.15f, 0.75f), moonPosition = Offset(0.85f, 0.12f),
        streakColor = Color(0xFFFF8C42), isDay = true,
    )
    hour < 17f -> TimeOfDay( // Day
        skyTop = Color(0xFF0A0A10), skyMid = Color(0xFF121018), skyBottom = Color(0xFF1A1210), horizon = Color(0xFF241A14),
        sunPosition = Offset(0.82f, 0.12f), moonPosition = Offset(0.2f, 0.9f),
        streakColor = Color(0xFFFFD27A), isDay = true,
    )
    hour < 20f -> TimeOfDay( // Dusk
        skyTop = Color(0xFF0D0A14), skyMid = Color(0xFF1A1218), skyBottom = Color(0xFF2A1810), horizon = Color(0xFF3A2018),
        sunPosition = Offset(0.85f, 0.65f), moonPosition = Offset(0.15f, 0.15f),
        streakColor = Color(0xFFFF6B6B), isDay = true,
    )
    else       -> TimeOfDay( // Night
        skyTop = Color(0xFF020205), skyMid = Color(0xFF08070A), skyBottom = Color(0xFF0D0C0F), horizon = Color(0xFF141018),
        sunPosition = Offset(0.2f, 0.9f), moonPosition = Offset(0.75f, 0.18f),
        streakColor = Color(0xFF4466AA), isDay = false,
    )
}

private fun String.toZoneId(): ZoneId =
    runCatching { ZoneId.of(this) }.getOrDefault(ZoneId.systemDefault())
