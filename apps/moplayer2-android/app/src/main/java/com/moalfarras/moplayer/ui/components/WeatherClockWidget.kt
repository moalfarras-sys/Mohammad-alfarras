package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import com.moalfarras.moplayerpro.R
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * WeatherClockWidget — 2026 Ultra-Premium HTC Sense-inspired 3D Widget.
 *
 * Features:
 * - Mechanical Glassmorphism Flip Clock digits
 * - Overflowing Volumetric Weather Orb
 * - Dynamic Sun/Moon/Storm ambient lighting
 * - Cinematic shadows and reflections
 * - Smooth 60fps continuous weather animations
 */
@Composable
fun WeatherClockWidget(
    weather: WeatherSnapshot,
    modifier: Modifier = Modifier,
    showWeather: Boolean = true,
    showClock: Boolean = true,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val condition = weather.condition.lowercase()

    val transition = rememberInfiniteTransition(label = "weather-widget")
    val pulse by transition.animateFloat(
        0.85f, 1.15f,
        infiniteRepeatable(tween(3000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "pulse",
    )
    val drift by transition.animateFloat(
        0f, 2f * PI.toFloat(),
        infiniteRepeatable(tween(14_000, easing = LinearEasing)),
        label = "drift",
    )
    val rainShift by transition.animateFloat(
        0f, 1f,
        infiniteRepeatable(tween(800, easing = LinearEasing)),
        label = "rain",
    )

    val conditionColor = weatherOrbColor(condition)
    val zoneId = remember(weather.timeZoneId) { weather.timeZoneId.toZoneId() }
    var clock by remember(zoneId) { mutableStateOf(ZonedDateTime.now(zoneId)) }
    LaunchedEffect(zoneId) {
        while (true) {
            kotlinx.coroutines.delay(1000)
            clock = ZonedDateTime.now(zoneId)
        }
    }
    val hourText = clock.format(DateTimeFormatter.ofPattern("HH"))
    val minuteText = clock.format(DateTimeFormatter.ofPattern("mm"))

    // The entire widget is interactive and responds to TV Focus
    FocusGlow(
        modifier = modifier.padding((12 * tv.factor).dp), // Padding allows weather orb to overflow!
        cornerRadius = (24 * tv.factor).dp,
        onClick = { /* Open weather details if needed */ }
    ) {
        Box(contentAlignment = Alignment.Center) {
            // ── Base Glass Panel ──────────────────────────────────
            GlassPanel(
                radius = (24 * tv.factor).dp,
                blur = 28.dp,
                glow = conditionColor.copy(alpha = 0.15f * pulse),
            ) {
                Row(
                    modifier = Modifier.padding(
                        start = (24 * tv.factor).dp,
                        end = (72 * tv.factor).dp, // Extra space for the oversized weather orb
                        top = (20 * tv.factor).dp,
                        bottom = (20 * tv.factor).dp,
                    ),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy((24 * tv.factor).dp),
                ) {
                    // 1. HTC Sense Inspired Flip Clock
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy((6 * tv.factor).dp)
                    ) {
                        FlipDigitCard(hourText, tv.factor)
                        Text(
                            ":",
                            color = Color(0x99FFFFFF),
                            fontSize = (32 * tv.factor).sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.offset(y = (-2 * tv.factor).dp)
                        )
                        FlipDigitCard(minuteText, tv.factor)
                    }

                    // 2. Weather Typography (Temp & Details)
                    Column(
                        verticalArrangement = Arrangement.Center
                    ) {
                        Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                "${weather.temperatureC.toInt()}°",
                                color = Color.White,
                                fontSize = (46 * tv.factor).sp,
                                fontWeight = FontWeight.Light,
                                letterSpacing = 0.sp,
                                style = androidx.compose.ui.text.TextStyle(
                                    shadow = androidx.compose.ui.graphics.Shadow(
                                        color = Color(0x88000000), blurRadius = 16f
                                    )
                                )
                            )
                            Column(modifier = Modifier.padding(bottom = (8 * tv.factor).dp)) {
                                Text(
                                    weather.city,
                                    color = Color(0xFFE3BC78),
                                    fontSize = (15 * tv.factor).sp,
                                    fontWeight = FontWeight.Bold,
                                )
                                Text(
                                    weatherConditionLabel(condition),
                                    color = conditionColor,
                                    fontSize = (13 * tv.factor).sp,
                                    fontWeight = FontWeight.Medium,
                                )
                            }
                        }
                    }
                }
            }

            // ── Oversized Volumetric Weather Orb (Overflowing) ──
            Box(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .offset(x = (20 * tv.factor).dp, y = (-15 * tv.factor).dp) // Peeking out
                    .size((110 * tv.factor).dp) // Much larger than before!
                    .graphicsLayer {
                        // Subtle 3D floating animation
                        translationY = sin(drift) * 8f
                        scaleX = 1f + (pulse - 1f) * 0.1f
                        scaleY = 1f + (pulse - 1f) * 0.1f
                    }
            ) {
                // Orb Shadow/Glow (Cinematic lighting)
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .drawBehind {
                            drawCircle(
                                brush = Brush.radialGradient(
                                    colors = listOf(
                                        conditionColor.copy(alpha = 0.5f * pulse),
                                        conditionColor.copy(alpha = 0.1f * pulse),
                                        Color.Transparent
                                    )
                                ),
                                radius = size.minDimension * 0.7f
                            )
                        }
                )

                // Photorealistic 3D generated weather icon
                val iconRes = when {
                    condition.contains("thunder") || condition.contains("storm") -> R.drawable.ic_weather_storm
                    condition.contains("rain") || condition.contains("drizzle") || condition.contains("shower") -> R.drawable.ic_weather_rain
                    condition.contains("cloud") || condition.contains("overcast") || condition.contains("fog") || condition.contains("snow") -> R.drawable.ic_weather_cloud
                    else -> R.drawable.ic_weather_sun
                }
                
                Image(
                    painter = painterResource(id = iconRes),
                    contentDescription = condition,
                    modifier = Modifier.fillMaxSize().graphicsLayer { blendMode = BlendMode.Screen },
                    contentScale = ContentScale.Fit
                )
            }
        }
    }
}

// ────────────────────────────────────────────────────────────────────────
// 3D Glass Flip Clock Digit
// ────────────────────────────────────────────────────────────────────────

@Composable
private fun FlipDigitCard(digit: String, factor: Float) {
    Box(
        modifier = Modifier
            .size((56 * factor).dp, (68 * factor).dp)
            .clip(RoundedCornerShape((10 * factor).dp))
            .background(
                Brush.verticalGradient(
                    listOf(Color(0x40FFFFFF), Color(0x05FFFFFF))
                )
            )
            .border(
                (1.5f).dp,
                Brush.verticalGradient(listOf(Color(0x60FFFFFF), Color.Transparent)),
                RoundedCornerShape((10 * factor).dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        // Upper half shadow (simulates the curved card)
        Box(
            Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .fillMaxHeight(0.5f)
                .background(Brush.verticalGradient(listOf(Color.Transparent, Color(0x30000000))))
        )

        Text(
            text = digit,
            color = Color.White,
            fontSize = (42 * factor).sp,
            fontWeight = FontWeight.ExtraBold,
            style = androidx.compose.ui.text.TextStyle(
                shadow = androidx.compose.ui.graphics.Shadow(
                    color = Color(0x99000000),
                    offset = Offset(0f, 6f),
                    blurRadius = 12f
                )
            ),
            modifier = Modifier.offset(y = (-2 * factor).dp)
        )

        // Middle Split Line (The classic HTC Sense mechanical gap)
        Box(
            Modifier
                .align(Alignment.Center)
                .fillMaxWidth()
                .height((2 * factor).dp)
                .background(Color(0xBB000000))
        )
        // Split line highlight
        Box(
            Modifier
                .align(Alignment.Center)
                .fillMaxWidth()
                .offset(y = (1 * factor).dp)
                .height((1 * factor).dp)
                .background(Color(0x33FFFFFF))
        )
    }
}

// ────────────────────────────────────────────────────────────────────────
// Cinematic Weather Graphics
// ────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

private fun weatherOrbColor(condition: String): Color = when {
    condition.contains("thunder") || condition.contains("storm") -> Color(0xFF9B6BFF)
    condition.contains("rain") || condition.contains("drizzle") || condition.contains("shower") -> Color(0xFF6BA8FF)
    condition.contains("snow") || condition.contains("blizzard") || condition.contains("sleet") -> Color(0xFFE8F0FF)
    condition.contains("fog") || condition.contains("mist") || condition.contains("haze") -> Color(0xFFAABBCC)
    condition.contains("cloud") || condition.contains("overcast") || condition.contains("partly") -> Color(0xFFE0E8F0)
    else -> Color(0xFFFFB03A) // Premium sunny warm gold
}

private fun weatherConditionLabel(condition: String): String {
    val c = condition.lowercase()
    return when {
        c.contains("thunder") || c.contains("storm") -> "عاصفة رعدية"
        c.contains("rain") || c.contains("drizzle") || c.contains("shower") -> "ممطر"
        c.contains("snow") || c.contains("blizzard") -> "ثلوج"
        c.contains("fog") || c.contains("mist") || c.contains("haze") -> "ضبابي"
        c.contains("cloud") || c.contains("overcast") -> "غائم"
        c.contains("partly") -> "غائم جزئياً"
        c.contains("clear") || c.contains("sunny") -> "صافي"
        else -> "صافي"
    }
}

private fun String.toZoneId(): ZoneId =
    runCatching { ZoneId.of(this) }.getOrDefault(ZoneId.systemDefault())
