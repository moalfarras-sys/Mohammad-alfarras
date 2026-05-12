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
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import java.time.ZoneId
import java.time.ZonedDateTime
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
import com.moalfarras.moplayer.domain.model.MotionLevel

/**
 * Time-of-day sky gradient only (no weather FX). Sits under the backdrop image.
 */
@Composable
fun AtmosphericSkyGradient(
    modifier: Modifier = Modifier,
    timeZoneId: String = ZoneId.systemDefault().id,
) {
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
    Box(
        modifier = modifier.fillMaxSize().background(
            Brush.verticalGradient(
                colors = listOf(tod.skyTop, tod.skyMid, tod.skyBottom, tod.horizon),
            ),
        ),
    )
}

/**
 * Sun rays, rain, snow, orbs, sheen, and ambient particles — drawn **over** the backdrop image.
 */
@Composable
fun AtmosphericWeatherEffectsOverlay(
    weather: WeatherSnapshot,
    accent: Color,
    modifier: Modifier = Modifier,
    motionLevel: MotionLevel = MotionLevel.BALANCED,
) {
    AtmosphericWeatherAnimatedLayers(weather, accent, motionLevel, modifier)
}

/**
 * Full atmosphere: sky + weather layers + edge vignette (for screens without a photo backdrop).
 */
@Composable
fun AtmosphericBackground(
    weather: WeatherSnapshot,
    accent: Color,
    modifier: Modifier = Modifier,
    motionLevel: MotionLevel = MotionLevel.BALANCED,
) {
    Box(modifier = modifier.fillMaxSize()) {
        AtmosphericSkyGradient()
        AtmosphericWeatherAnimatedLayers(weather, accent, motionLevel)
        AtmosphericReadabilityVignette()
    }
}

@Composable
private fun AtmosphericWeatherAnimatedLayers(
    weather: WeatherSnapshot,
    accent: Color,
    motionLevel: MotionLevel,
    modifier: Modifier = Modifier,
) {
    val visuals = LocalMoVisuals.current
    val condition = weather.condition.lowercase()
    val zoneId = remember(weather.timeZoneId) { weather.timeZoneId.toZoneId() }
    var now by remember(zoneId) { mutableStateOf(ZonedDateTime.now(zoneId)) }
    LaunchedEffect(zoneId) {
        while (true) {
            kotlinx.coroutines.delay(60_000)
            now = ZonedDateTime.now(zoneId)
        }
    }
    val hour = now.hour + now.minute / 60f
    val tod = timeOfDay(hour)

    val transition = rememberInfiniteTransition(label = "atmos")
    val drift by transition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * PI.toFloat(),
        animationSpec = infiniteRepeatable(tween(32_000, easing = LinearEasing)),
        label = "drift",
    )
    val slowDrift by transition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * PI.toFloat(),
        animationSpec = infiniteRepeatable(tween(52_000, easing = LinearEasing)),
        label = "slow",
    )
    val pulse by transition.animateFloat(
        initialValue = 0.78f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(tween(6_000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "pulse",
    )
    val streakShift by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(24_000, easing = LinearEasing)),
        label = "streak",
    )

    val motionAlpha = when (motionLevel) {
        MotionLevel.LOW -> 0.35f
        MotionLevel.BALANCED -> 1f
        MotionLevel.RICH -> 1.25f
    }
    val particlesNear = remember(motionLevel) { ParticleLayer(count = if (motionLevel == MotionLevel.LOW) 4 else 14, speed = 0.35f, size = 3.5f, alpha = 0.18f * motionAlpha, driftScale = 1.0f) }
    val particlesMid = remember(motionLevel) { ParticleLayer(count = if (motionLevel == MotionLevel.LOW) 6 else 20, speed = 0.22f, size = 2.2f, alpha = 0.12f * motionAlpha, driftScale = 0.6f) }
    val particlesFar = remember(motionLevel) { ParticleLayer(count = if (motionLevel == MotionLevel.LOW) 3 else 10, speed = 0.10f, size = 1.5f, alpha = 0.06f * motionAlpha, driftScale = 0.3f) }

    Box(modifier = modifier.fillMaxSize()) {
        Canvas(Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            if (tod.isDay) {
                drawSunOrb(w, h, drift, pulse, accent, tod.sunPosition)
            } else {
                drawMoonOrb(w, h, slowDrift, pulse, tod.moonPosition)
            }
            when {
                condition.contains("thunder") || condition.contains("storm") -> {
                    drawAmbientOrb(w * 0.5f + cos(drift) * w * 0.08f, h * 0.3f, w * 0.55f, Color(0xFF6600FF).copy(alpha = 0.08f * pulse))
                    drawAmbientOrb(w * 0.2f, h * 0.7f, w * 0.40f, Color(0xFF220044).copy(alpha = 0.10f * pulse))
                }
                condition.contains("rain") || condition.contains("drizzle") -> {
                    drawAmbientOrb(w * 0.7f, h * 0.2f, w * 0.35f, Color(0xFF88AAFF).copy(alpha = 0.07f * pulse))
                    drawAmbientOrb(w * 0.3f, h * 0.8f, w * 0.45f, Color(0xFF4466AA).copy(alpha = 0.06f * pulse))
                }
                condition.contains("snow") -> {
                    drawAmbientOrb(w * 0.5f, h * 0.4f, w * 0.50f, Color(0xFFCCEEFF).copy(alpha = 0.08f * pulse))
                }
                condition.contains("fog") || condition.contains("mist") -> {
                    drawAmbientOrb(w * 0.4f, h * 0.35f, w * 0.60f, Color(0xFFCCCCDD).copy(alpha = 0.06f * pulse))
                    drawAmbientOrb(w * 0.6f, h * 0.6f, w * 0.50f, Color(0xFFAAAABB).copy(alpha = 0.05f * pulse))
                }
                condition.contains("cloud") || condition.contains("overcast") -> {
                    drawAmbientOrb(w * 0.75f, h * 0.15f, w * 0.30f, accent.copy(alpha = 0.10f * pulse))
                }
                else -> {
                    drawAmbientOrb(w * 0.82f, h * 0.12f, w * 0.32f, accent.copy(alpha = 0.14f * pulse))
                    drawAmbientOrb(w * 0.15f, h * 0.75f, w * 0.40f, visuals.accentWarm.copy(alpha = 0.06f * pulse))
                }
            }
            drawRect(
                brush = Brush.verticalGradient(
                    colors = listOf(Color.Transparent, tod.horizon.copy(alpha = 0.15f * pulse)),
                ),
                topLeft = Offset(0f, h * 0.55f),
                size = androidx.compose.ui.geometry.Size(w, h * 0.45f),
            )
        }

        Canvas(Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val streakY = h * (0.28f + streakShift * 0.44f)
            drawRect(
                brush = Brush.horizontalGradient(
                    colors = listOf(
                        Color.Transparent,
                        tod.streakColor.copy(alpha = 0.035f * pulse),
                        accent.copy(alpha = 0.025f * pulse),
                        tod.streakColor.copy(alpha = 0.035f * pulse),
                        Color.Transparent,
                    ),
                    startX = -w * 0.2f,
                    endX = w * 1.2f,
                    tileMode = TileMode.Clamp,
                ),
                topLeft = Offset(-w * 0.2f, streakY - h * 0.06f),
                size = androidx.compose.ui.geometry.Size(w * 1.4f, h * 0.12f),
            )
        }

        Canvas(Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            when {
                condition.contains("thunder") || condition.contains("storm") -> drawThunder(w, h, drift, pulse)
                condition.contains("rain") || condition.contains("drizzle") -> drawRain(w, h, drift, pulse)
                condition.contains("snow") -> drawSnow(w, h, drift, slowDrift, pulse)
                condition.contains("fog") || condition.contains("mist") -> drawFog(w, h, slowDrift, pulse)
                condition.contains("cloud") || condition.contains("overcast") -> drawClouds(w, h, slowDrift, pulse)
                else -> drawSunnyRays(w, h, drift, pulse, accent)
            }
        }

        ParticleLayerCanvas(particlesFar, drift, pulse, visuals)
        ParticleLayerCanvas(particlesMid, drift, pulse, visuals)
        ParticleLayerCanvas(particlesNear, drift, pulse, visuals)
    }
}

@Composable
private fun AtmosphericReadabilityVignette() {
    Canvas(Modifier.fillMaxSize()) {
        drawRect(
            brush = Brush.radialGradient(
                colors = listOf(
                    Color.Transparent,
                    Color.Transparent,
                    Color(0xFF0A0908).copy(alpha = 0.45f),
                    Color(0xFF0A0908).copy(alpha = 0.78f),
                ),
                center = Offset(size.width * 0.5f, size.height * 0.5f),
                radius = size.maxDimension * 0.82f,
            ),
        )
    }
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

// ────────────────────────────────────────────────────────────────────────────
// Orb Helpers
// ────────────────────────────────────────────────────────────────────────────

private fun DrawScope.drawSunOrb(w: Float, h: Float, drift: Float, pulse: Float, accent: Color, pos: Offset) {
    val cx = w * pos.x + cos(drift * 0.4f) * w * 0.02f
    val cy = h * pos.y + sin(drift * 0.3f) * h * 0.02f
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(accent.copy(alpha = 0.28f * pulse), accent.copy(alpha = 0.08f * pulse), Color.Transparent),
            center = Offset(cx, cy), radius = w * 0.38f,
        ),
    )
}

private fun DrawScope.drawMoonOrb(w: Float, h: Float, drift: Float, pulse: Float, pos: Offset) {
    val cx = w * pos.x + cos(drift * 0.25f) * w * 0.015f
    val cy = h * pos.y + sin(drift * 0.2f) * h * 0.015f
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(Color(0xFFE0E4FF).copy(alpha = 0.18f * pulse), Color(0xFF8899CC).copy(alpha = 0.06f * pulse), Color.Transparent),
            center = Offset(cx, cy), radius = w * 0.30f,
        ),
    )
}

private fun DrawScope.drawAmbientOrb(x: Float, y: Float, radius: Float, color: Color) {
    drawCircle(
        brush = Brush.radialGradient(listOf(color, Color.Transparent)),
        center = Offset(x, y), radius = radius,
    )
}

private fun String.toZoneId(): ZoneId =
    runCatching { ZoneId.of(this) }.getOrDefault(ZoneId.systemDefault())

// ────────────────────────────────────────────────────────────────────────────
// Weather Effects
// ────────────────────────────────────────────────────────────────────────────

private fun DrawScope.drawThunder(w: Float, h: Float, drift: Float, pulse: Float) {
    val t = (drift * 20f)
    val flash = (sin(t * 3f) * sin(t * 7f)).coerceIn(0f, 1f)
    if (flash > 0.6f) {
        // Aggressive flash
        drawRect(Color.White.copy(alpha = (flash - 0.6f) * 0.8f))
        
        // Branched lightning bolt
        val lx = w * 0.2f + (Random.nextFloat() * w * 0.6f)
        val path = Path()
        path.moveTo(lx, 0f)
        var cx = lx
        var cy = 0f
        while (cy < h * 0.8f) {
            val nx = cx + (Random.nextFloat() - 0.5f) * w * 0.15f
            val ny = cy + Random.nextFloat() * h * 0.15f
            path.lineTo(nx, ny)
            
            // Random branch
            if (Random.nextFloat() > 0.6f) {
                val bx = nx + (Random.nextFloat() - 0.5f) * w * 0.2f
                val by = ny + Random.nextFloat() * h * 0.1f
                drawLine(Color.White.copy(alpha = 0.8f), Offset(nx, ny), Offset(bx, by), strokeWidth = 3f, cap = StrokeCap.Round)
            }
            cx = nx
            cy = ny
        }
        drawPath(path, color = Color.White, style = Stroke(width = 6f, cap = StrokeCap.Round, join = androidx.compose.ui.graphics.StrokeJoin.Round))
        drawPath(path, color = Color(0x66AAEEFF), style = Stroke(width = 16f, cap = StrokeCap.Round)) // Glow
    }
}

private fun DrawScope.drawRain(w: Float, h: Float, drift: Float, pulse: Float) {
    val angle = 15f * (PI / 180f).toFloat() // Rain angle
    val dx = sin(angle)
    val dy = cos(angle)
    
    // Parallax layers: Far, Mid, Near
    val layers = listOf(
        Triple(120, 0.4f, 1.2f),
        Triple(80, 0.7f, 2.5f),
        Triple(40, 1.2f, 4.0f)
    )
    
    layers.forEachIndexed { index, (count, speed, width) ->
        val alpha = 0.1f + index * 0.1f
        val color = Color(0xFFAACCFF).copy(alpha = alpha)
        
        repeat(count) { i ->
            val randX = (i * 137f + index * 53f) % w
            val randY = (i * 97f + index * 31f) % h
            
            // Fast continuous falling
            val fall = (drift * 200f * speed) % h
            var x = (randX + fall * dx) % w
            var y = (randY + fall * dy) % h
            if (x < 0) x += w
            if (y < 0) y += h
            
            val length = 30f + index * 20f
            drawLine(
                brush = Brush.linearGradient(
                    colors = listOf(Color.Transparent, color),
                    start = Offset(x, y),
                    end = Offset(x - length * dx, y + length * dy)
                ),
                start = Offset(x, y),
                end = Offset(x - length * dx, y + length * dy),
                strokeWidth = width,
                cap = StrokeCap.Round
            )
        }
    }
}

private fun DrawScope.drawSnow(w: Float, h: Float, drift: Float, slowDrift: Float, pulse: Float) {
    val layers = listOf(
        Triple(100, 0.2f, 2f),
        Triple(60, 0.4f, 4f),
        Triple(30, 0.7f, 7f)
    )
    
    layers.forEachIndexed { index, (count, speed, maxSize) ->
        repeat(count) { i ->
            val randX = (i * 113f + index * 41f) % w
            val randY = (i * 89f + index * 23f) % h
            
            val fall = (drift * 30f * speed) % h
            val sway = sin((slowDrift * 3f) + i * 0.1f) * (15f + index * 10f)
            
            var x = (randX + sway) % w
            var y = (randY + fall) % h
            if (x < 0) x += w
            if (y < 0) y += h
            
            val a = 0.2f + 0.3f * index + 0.2f * sin(i * 1.3f + drift * 2)
            // Soft glowing snowflakes using radial gradient
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Color(0xFFFFFFFF).copy(alpha = a), Color.Transparent),
                    center = Offset(x, y),
                    radius = maxSize
                ),
                center = Offset(x, y),
                radius = maxSize
            )
        }
    }
}

private fun DrawScope.drawFog(w: Float, h: Float, fogDrift: Float, pulse: Float) {
    repeat(5) { i ->
        val y = h * (0.12f + i * 0.18f) + fogDrift * 35f
        val a = 0.06f + (i % 2) * 0.04f
        drawOval(
            Brush.horizontalGradient(listOf(Color.Transparent, Color(0x40CCCCDD).copy(alpha = a * pulse), Color(0x50AABBCC).copy(alpha = a * pulse), Color(0x40CCCCDD).copy(alpha = a * pulse), Color.Transparent)),
            topLeft = Offset(-w * 0.1f + fogDrift * w * 0.25f, y),
            size = androidx.compose.ui.geometry.Size(w * 1.2f, h * 0.10f),
        )
    }
}

private fun DrawScope.drawClouds(w: Float, h: Float, fogDrift: Float, pulse: Float) {
    repeat(4) { i ->
        val cx = w * (0.12f + i * 0.22f) + (if (i % 2 == 0) fogDrift else 1f - fogDrift) * 25f
        val cy = h * (0.04f + (i % 3) * 0.07f)
        drawOval(Color(0x18FFFFFF), topLeft = Offset(cx - 70f, cy), size = androidx.compose.ui.geometry.Size(140f + i * 18f, 50f + i * 7f))
    }
}

private fun DrawScope.drawSunnyRays(w: Float, h: Float, drift: Float, pulse: Float, accent: Color) {
    val cx = w * 0.82f + cos(drift * 0.15f) * w * 0.02f
    val cy = h * 0.12f + sin(drift * 0.12f) * h * 0.02f
    
    // Ambient glowing rays
    repeat(12) { i ->
        val angle = (i * 30f + drift * 45f) * (PI / 180f).toFloat()
        val startR = w * 0.1f
        val endR = w * 0.35f
        drawLine(
            brush = Brush.linearGradient(
                colors = listOf(accent.copy(alpha = 0.15f * pulse), Color.Transparent),
                start = Offset(cx + cos(angle) * startR, cy + sin(angle) * startR),
                end = Offset(cx + cos(angle) * endR, cy + sin(angle) * endR)
            ),
            start = Offset(cx + cos(angle) * startR, cy + sin(angle) * startR),
            end = Offset(cx + cos(angle) * endR, cy + sin(angle) * endR),
            strokeWidth = 40f, cap = StrokeCap.Round
        )
    }
    
    // Lens flare artifacts along a diagonal line
    val flareAngle = -135f * (PI / 180f).toFloat()
    val flareDistances = listOf(w * 0.15f, w * 0.3f, w * 0.45f, w * 0.6f)
    val flareSizes = listOf(15f, 40f, 25f, 60f)
    val flareAlphas = listOf(0.1f, 0.05f, 0.08f, 0.03f)
    
    flareDistances.forEachIndexed { i, dist ->
        val fx = cx + cos(flareAngle) * dist
        val fy = cy + sin(flareAngle) * dist
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(accent.copy(alpha = flareAlphas[i] * pulse), Color.Transparent),
                center = Offset(fx, fy),
                radius = flareSizes[i]
            ),
            center = Offset(fx, fy),
            radius = flareSizes[i]
        )
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Particle System
// ────────────────────────────────────────────────────────────────────────────

private data class ParticleLayer(
    val count: Int,
    val speed: Float,
    val size: Float,
    val alpha: Float,
    val driftScale: Float,
    val specs: List<ParticleSpec> = List(count) {
        ParticleSpec(
            angle = Random.nextFloat() * 2f * PI.toFloat(),
            dist = 0.15f + Random.nextFloat() * 0.70f,
            size = (Random.nextFloat() * 2f + 0.5f) * size / 2.5f,
            alpha = Random.nextFloat() * alpha + 0.02f,
            speed = (Random.nextFloat() * 0.18f + 0.12f) * speed,
            colorIdx = Random.nextInt(4),
        )
    }
)

private data class ParticleSpec(
    val angle: Float,
    val dist: Float,
    val size: Float,
    val alpha: Float,
    val speed: Float,
    val colorIdx: Int,
)

@Composable
private fun ParticleLayerCanvas(layer: ParticleLayer, drift: Float, pulse: Float, visuals: com.moalfarras.moplayer.ui.theme.MoVisuals) {
    Canvas(Modifier.fillMaxSize()) {
        val w = size.width
        val h = size.height
        val cx = w * 0.5f
        val cy = h * 0.5f
        layer.specs.forEach { p ->
            val pAngle = p.angle + drift * p.speed * layer.driftScale
            val pRadius = w * p.dist
            val px = cx + cos(pAngle) * pRadius
            val py = cy + sin(pAngle) * pRadius
            if (px in -w * 0.1f..w * 1.1f && py in -h * 0.1f..h * 1.1f) {
                val color = when (p.colorIdx) {
                    0 -> visuals.accentWarm
                    1 -> visuals.accent
                    2 -> visuals.accent
                    else -> visuals.accentB
                }
                drawCircle(color.copy(alpha = p.alpha * pulse), center = Offset(px, py), radius = p.size)
            }
        }
    }
}
