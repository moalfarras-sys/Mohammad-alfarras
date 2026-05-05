package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import kotlin.math.*

@Composable
fun WeatherScene(weather: WeatherSnapshot, accent: Color, modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "weather")
    val phase by transition.animateFloat(0f, 1f, infiniteRepeatable(tween(16000, easing = LinearEasing), RepeatMode.Reverse), label = "phase")
    val rainShift by transition.animateFloat(0f, 1f, infiniteRepeatable(tween(1100, easing = LinearEasing)), label = "rain")
    val snowDrift by transition.animateFloat(0f, 1f, infiniteRepeatable(tween(8000, easing = LinearEasing), RepeatMode.Reverse), label = "snow")
    val cloudPulse by transition.animateFloat(0.7f, 1f, infiniteRepeatable(tween(4000, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "cloud")
    val sunPulse by transition.animateFloat(0.85f, 1f, infiniteRepeatable(tween(2500, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "sun")
    val lightningFlash by transition.animateFloat(0f, 1f, infiniteRepeatable(tween(5000, easing = LinearEasing)), label = "lightning")
    val fogDrift by transition.animateFloat(0f, 1f, infiniteRepeatable(tween(10000, easing = LinearEasing), RepeatMode.Reverse), label = "fog")

    val condition = weather.condition.lowercase()

    Box(modifier = modifier.fillMaxSize()) {
        Canvas(Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height

            when {
                // ⛈ THUNDERSTORM
                condition.contains("thunder") || condition.contains("storm") -> {
                    // Dark gradient base
                    drawRect(Brush.verticalGradient(listOf(Color(0xFF0A0010), Color(0xFF1A0020), Color(0xFF050005))))
                    // Lightning flashes
                    if ((lightningFlash * 10).toInt() % 7 == 0) {
                        drawRect(Color(0x22EEEEFF))
                        val lx = w * 0.4f + (lightningFlash * w * 0.4f)
                        for (i in 0..4) {
                            val y1 = h * 0.1f + i * h * 0.12f
                            val y2 = y1 + h * 0.12f
                            val x1 = lx + (i % 2) * 20f - 10f
                            drawLine(Color(0xDDFFFFAA), Offset(x1, y1), Offset(x1 + 15f, y2), 3f, cap = StrokeCap.Round)
                        }
                    }
                    // Heavy rain
                    val alpha = 0.55f
                    repeat(100) { i ->
                        val x = ((i * 97f) % w) + rainShift * 80f
                        val y = ((i * 61f) % h) + rainShift * h
                        drawLine(Color(0x88AACCFF), Offset(x % w, y % h), Offset((x - 15f) % w, (y + 35f) % h), 1.8f, cap = StrokeCap.Round)
                    }
                    // Glow
                    drawCircle(Brush.radialGradient(listOf(Color(0x1A7700FF), Color.Transparent)), center = Offset(w * 0.6f, h * 0.1f), radius = w * 0.3f)
                }

                // 🌧 RAIN / DRIZZLE
                condition.contains("rain") || condition.contains("drizzle") || condition.contains("shower") -> {
                    repeat(80) { i ->
                        val x = ((i * 83f) % w) + rainShift * 60f
                        val y = ((i * 47f) % h) + rainShift * h
                        drawLine(Color(0x77AACCFF), Offset(x % w, y % h), Offset((x - 8f) % w, (y + 24f) % h), 1.6f, cap = StrokeCap.Round)
                    }
                    drawCircle(Brush.radialGradient(listOf(accent.copy(alpha = 0.12f), Color.Transparent)), center = Offset(w * 0.8f, h * 0.15f), radius = w * 0.22f)
                    // Puddle ripples effect
                    repeat(3) { i ->
                        val cx = w * (0.2f + i * 0.3f)
                        val cy = h * 0.85f
                        val ripple = ((rainShift + i * 0.33f) % 1f)
                        drawOval(Color(0x3399CCFF), topLeft = Offset(cx - ripple * 60f, cy - ripple * 12f), size = Size(ripple * 120f, ripple * 24f), style = Stroke(width = 1.5f))
                    }
                }

                // 🌨 SNOW
                condition.contains("snow") || condition.contains("blizzard") || condition.contains("sleet") -> {
                    repeat(60) { i ->
                        val x = ((i * 79f) % w) + snowDrift * 40f - 20f
                        val y = ((i * 53f) % h) + phase * h
                        val sz = 2.5f + (i % 5) * 0.8f
                        val flakePhase = snowDrift + i * 0.017f
                        val sway = sin(flakePhase * PI.toFloat() * 2) * 18f
                        drawCircle(Color(0xCCEEF4FF), radius = sz, center = Offset((x + sway) % w, y % h))
                    }
                    drawRect(Brush.verticalGradient(listOf(Color(0x1AAACCFF), Color.Transparent)))
                }

                // 🌫 FOG / MIST / HAZE
                condition.contains("fog") || condition.contains("mist") || condition.contains("haze") -> {
                    repeat(6) { i ->
                        val y = h * (0.1f + i * 0.15f) + fogDrift * 40f
                        val alpha = 0.08f + (i % 2) * 0.05f
                        drawOval(
                            Brush.horizontalGradient(listOf(Color.Transparent, Color(0x30CCCCDD), Color(0x40AABBCC), Color(0x30CCCCDD), Color.Transparent)),
                            topLeft = Offset(-w * 0.1f + fogDrift * w * 0.3f, y),
                            size = Size(w * 1.2f, h * 0.12f),
                        )
                    }
                }

                // 🌤 PARTLY CLOUDY / OVERCAST
                condition.contains("cloud") || condition.contains("overcast") || condition.contains("partly") -> {
                    // Soft orange accent glow (sun behind clouds)
                    drawCircle(
                        Brush.radialGradient(listOf(accent.copy(alpha = 0.20f * cloudPulse), Color.Transparent)),
                        center = Offset(w * 0.75f, h * 0.15f),
                        radius = w * 0.28f,
                    )
                    // Cloud shapes
                    repeat(4) { i ->
                        val cx = w * (0.15f + i * 0.22f) + (if (i % 2 == 0) fogDrift else 1f - fogDrift) * 30f
                        val cy = h * (0.05f + (i % 3) * 0.08f)
                        drawOval(
                            Color(0x20FFFFFF),
                            topLeft = Offset(cx - 80f, cy),
                            size = Size(160f + i * 20f, 60f + i * 8f),
                        )
                    }
                }

                // ☀️ SUNNY / CLEAR (default + clear)
                else -> {
                    // Warm animated ambient glow
                    drawCircle(
                        Brush.radialGradient(listOf(accent.copy(alpha = 0.32f * sunPulse), Color.Transparent)),
                        center = Offset(w * 0.82f, h * (0.12f + phase * 0.06f)),
                        radius = w * 0.30f,
                    )
                    // Sun rays
                    repeat(8) { i ->
                        val angle = (i * 45f + phase * 360f) * (PI / 180f).toFloat()
                        val startR = w * 0.10f
                        val endR = w * 0.18f
                        val cx = w * 0.82f
                        val cy = h * (0.12f + phase * 0.06f)
                        drawLine(
                            accent.copy(alpha = 0.18f * sunPulse),
                            start = Offset(cx + cos(angle) * startR, cy + sin(angle) * startR),
                            end = Offset(cx + cos(angle) * endR, cy + sin(angle) * endR),
                            strokeWidth = 4f,
                            cap = StrokeCap.Round,
                        )
                    }
                    // Horizon shimmer
                    drawRect(
                        Brush.verticalGradient(listOf(Color.Transparent, accent.copy(alpha = 0.04f + 0.03f * phase))),
                        topLeft = Offset(0f, h * 0.5f),
                        size = Size(w, h * 0.5f),
                    )
                }
            }
        }
    }
}
