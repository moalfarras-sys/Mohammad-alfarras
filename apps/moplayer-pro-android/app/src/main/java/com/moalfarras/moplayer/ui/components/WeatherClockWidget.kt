package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

// ────────────────────────────────────────────────────────────────────────
// Animated, hand-drawn weather glyph (used by the Home hero weather cluster)
// ────────────────────────────────────────────────────────────────────────

@Composable
fun WeatherGlyph(condition: String, color: Color, animate: Boolean, modifier: Modifier = Modifier) {
    // Skip the spinning/falling/flashing transitions entirely when motion is off so the
    // glyph stops driving frames (before, the three transitions kept running even though
    // their values were forced to 0, which kept the home screen awake).
    val (spin, fall, flash) = if (animate) {
        val transition = rememberInfiniteTransition(label = "glyph")
        val rawSpin by transition.animateFloat(
            initialValue = 0f,
            targetValue = 360f,
            animationSpec = infiniteRepeatable(tween(18_000, easing = LinearEasing)),
            label = "spin",
        )
        val rawFall by transition.animateFloat(
            initialValue = 0f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(tween(1500, easing = LinearEasing)),
            label = "fall",
        )
        val rawFlash by transition.animateFloat(
            initialValue = 0f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(tween(2400, easing = LinearEasing)),
            label = "flash",
        )
        Triple(rawSpin, rawFall, rawFlash)
    } else {
        Triple(0f, 0f, 0f)
    }

    Canvas(modifier) {
        val w = size.width
        val h = size.height
        when {
            condition.contains("thunder") || condition.contains("storm") -> drawStormGlyph(w, h, color, fall, flash)
            condition.contains("rain") || condition.contains("drizzle") || condition.contains("shower") -> drawRainGlyph(w, h, color, fall)
            condition.contains("snow") || condition.contains("blizzard") || condition.contains("sleet") || condition.contains("ice") -> drawSnowGlyph(w, h, color, fall)
            condition.contains("fog") || condition.contains("mist") || condition.contains("haze") -> drawFogGlyph(w, h, color, fall)
            condition.contains("partly") || condition.contains("partial") -> drawPartlyGlyph(w, h, color, spin)
            condition.contains("cloud") || condition.contains("overcast") -> drawCloudGlyph(w, h, Offset(w * 0.5f, h * 0.52f), 1f, color)
            else -> drawSunGlyph(w, h, color, spin)
        }
    }
}

private fun DrawScope.drawSunGlyph(w: Float, h: Float, color: Color, spin: Float) {
    val cx = w * 0.5f
    val cy = h * 0.5f
    val core = w * 0.20f
    drawCircle(
        brush = Brush.radialGradient(
            listOf(Color.White, color, color.copy(alpha = 0.85f)),
            center = Offset(cx, cy),
            radius = core * 1.4f,
        ),
        radius = core,
        center = Offset(cx, cy),
    )
    rotate(spin, Offset(cx, cy)) {
        repeat(8) { i ->
            val a = i * (PI.toFloat() / 4f)
            val inner = core * 1.55f
            val outer = core * 2.35f
            drawLine(
                color = color,
                start = Offset(cx + cos(a) * inner, cy + sin(a) * inner),
                end = Offset(cx + cos(a) * outer, cy + sin(a) * outer),
                strokeWidth = w * 0.055f,
                cap = StrokeCap.Round,
            )
        }
    }
}

private fun DrawScope.drawCloudGlyph(w: Float, h: Float, center: Offset, scale: Float, color: Color) {
    val cloud = Color.White.copy(alpha = 0.92f)
    val r = w * 0.16f * scale
    val cx = center.x
    val cy = center.y
    drawCircle(cloud, radius = r, center = Offset(cx - r * 1.15f, cy))
    drawCircle(cloud, radius = r * 1.35f, center = Offset(cx, cy - r * 0.35f))
    drawCircle(cloud, radius = r, center = Offset(cx + r * 1.2f, cy))
    drawRoundRect(
        color = cloud,
        topLeft = Offset(cx - r * 2.0f, cy),
        size = Size(r * 4.0f, r * 1.25f),
        cornerRadius = androidx.compose.ui.geometry.CornerRadius(r, r),
    )
    // Soft underglow tint
    drawCircle(color.copy(alpha = 0.18f), radius = r * 2.1f, center = Offset(cx, cy))
}

private fun DrawScope.drawRainGlyph(w: Float, h: Float, color: Color, fall: Float) {
    drawCloudGlyph(w, h, Offset(w * 0.5f, h * 0.42f), 0.92f, color)
    val drop = Color(0xFF8FB6FF)
    repeat(3) { i ->
        val x = w * (0.34f + i * 0.16f)
        val baseY = h * 0.6f
        val y = baseY + ((fall + i * 0.33f) % 1f) * h * 0.28f
        drawLine(
            color = drop.copy(alpha = 0.9f),
            start = Offset(x, y),
            end = Offset(x - w * 0.04f, y + h * 0.12f),
            strokeWidth = w * 0.045f,
            cap = StrokeCap.Round,
        )
    }
}

private fun DrawScope.drawSnowGlyph(w: Float, h: Float, color: Color, fall: Float) {
    drawCloudGlyph(w, h, Offset(w * 0.5f, h * 0.42f), 0.92f, color)
    repeat(3) { i ->
        val x = w * (0.34f + i * 0.16f)
        val baseY = h * 0.62f
        val y = baseY + ((fall + i * 0.33f) % 1f) * h * 0.26f
        drawCircle(Color.White, radius = w * 0.035f, center = Offset(x, y))
    }
}

private fun DrawScope.drawStormGlyph(w: Float, h: Float, color: Color, fall: Float, flash: Float) {
    drawCloudGlyph(w, h, Offset(w * 0.5f, h * 0.4f), 0.92f, color)
    val bolt = Path().apply {
        moveTo(w * 0.52f, h * 0.55f)
        lineTo(w * 0.40f, h * 0.78f)
        lineTo(w * 0.50f, h * 0.78f)
        lineTo(w * 0.44f, h * 0.96f)
        lineTo(w * 0.64f, h * 0.70f)
        lineTo(w * 0.53f, h * 0.70f)
        lineTo(w * 0.60f, h * 0.55f)
        close()
    }
    val pulse = 0.55f + 0.45f * (0.5f + 0.5f * sin(flash * 2f * PI.toFloat()))
    drawPath(bolt, color = Color(0xFFFFD166).copy(alpha = pulse))
    drawPath(bolt, color = Color(0x66FFE9A8), style = Stroke(width = w * 0.02f, join = StrokeJoin.Round))
}

private fun DrawScope.drawFogGlyph(w: Float, h: Float, color: Color, fall: Float) {
    drawCloudGlyph(w, h, Offset(w * 0.5f, h * 0.34f), 0.78f, color)
    val line = Color.White.copy(alpha = 0.7f)
    repeat(3) { i ->
        val y = h * (0.6f + i * 0.13f)
        val shift = sin((fall * 2f * PI.toFloat()) + i) * w * 0.06f
        drawLine(
            color = line,
            start = Offset(w * 0.22f + shift, y),
            end = Offset(w * 0.78f + shift, y),
            strokeWidth = w * 0.045f,
            cap = StrokeCap.Round,
        )
    }
}

private fun DrawScope.drawPartlyGlyph(w: Float, h: Float, color: Color, spin: Float) {
    val cx = w * 0.36f
    val cy = h * 0.36f
    val core = w * 0.13f
    drawCircle(
        brush = Brush.radialGradient(listOf(Color.White, color), center = Offset(cx, cy), radius = core * 1.4f),
        radius = core,
        center = Offset(cx, cy),
    )
    rotate(spin, Offset(cx, cy)) {
        repeat(8) { i ->
            val a = i * (PI.toFloat() / 4f)
            drawLine(
                color = color,
                start = Offset(cx + cos(a) * core * 1.5f, cy + sin(a) * core * 1.5f),
                end = Offset(cx + cos(a) * core * 2.2f, cy + sin(a) * core * 2.2f),
                strokeWidth = w * 0.04f,
                cap = StrokeCap.Round,
            )
        }
    }
    drawCloudGlyph(w, h, Offset(w * 0.56f, h * 0.6f), 0.9f, color)
}
