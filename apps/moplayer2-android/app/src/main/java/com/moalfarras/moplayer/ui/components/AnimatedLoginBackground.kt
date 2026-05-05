package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

/**
 * Premium Animated Login Background — Fiery Glass Cinematic.
 *
 * Multi-layered GPU-efficient animation using only Canvas draw calls:
 * 1. Deep warm radial gradient base
 * 2. Slow-drifting nebula blobs (gold / amber / ember)
 * 3. Subtle horizon light sweep
 * 4. Floating ember particles with depth-of-field glow
 * 5. Cinematic vignette overlay
 *
 * No bitmaps, no images, purely procedural — lightweight & sharp on all DPIs.
 */
@Composable
fun AnimatedLoginBackground(modifier: Modifier = Modifier) {
    val visuals = LocalMoVisuals.current
    val transition = rememberInfiniteTransition(label = "login-bg")

    // Slow nebula drift
    val nebulaDrift by transition.animateFloat(
        initialValue = 0f, targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(40_000, easing = LinearEasing)),
        label = "nebula-drift",
    )
    // Horizon sweep
    val horizonSweep by transition.animateFloat(
        initialValue = -0.3f, targetValue = 1.3f,
        animationSpec = infiniteRepeatable(tween(8_000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "horizon-sweep",
    )
    // Aurora pulse
    val auroraPulse by transition.animateFloat(
        initialValue = 0.6f, targetValue = 1.0f,
        animationSpec = infiniteRepeatable(tween(5_000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "aurora-pulse",
    )
    // Particle time
    val particleTime by transition.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(20_000, easing = LinearEasing)),
        label = "particle-time",
    )

    val particles = remember {
        List(45) {
            LoginParticle(
                x = Random.nextFloat(),
                y = Random.nextFloat(),
                size = Random.nextFloat() * 3.5f + 1f,
                speed = Random.nextFloat() * 0.012f + 0.003f,
                alpha = Random.nextFloat() * 0.35f + 0.08f,
                colorIndex = Random.nextInt(4),
                hasGlow = Random.nextFloat() > 0.55f,
                glowRadius = Random.nextFloat() * 24f + 10f,
                phaseOffset = Random.nextFloat() * PI.toFloat() * 2f,
                driftAmplitude = Random.nextFloat() * 30f + 8f,
            )
        }
    }

    Box(modifier.fillMaxSize()) {
        // Layer 1: Deep warm base gradient
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colorStops = arrayOf(
                            0.00f to Color(0xFF1E1610),
                            0.35f to Color(0xFF140F0B),
                            0.65f to Color(0xFF0E0A07),
                            1.00f to Color(0xFF080604),
                        ),
                        center = Offset(0.5f, 0.4f),
                        radius = Float.POSITIVE_INFINITY,
                    )
                )
        )

        // Layer 2–5: All drawn via Canvas for performance
        Canvas(Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val accent = visuals.accent
            val accentB = visuals.accentB
            val accentC = visuals.accentC

            // ── Nebula blobs (6 warm-toned drifting orbs) ──
            val nebulaBlobs = listOf(
                NebulaBlobSpec(0.20f, 0.30f, 0.32f, accent, 0.10f, 1.0f),
                NebulaBlobSpec(0.75f, 0.25f, 0.28f, accentB, 0.08f, 1.5f),
                NebulaBlobSpec(0.50f, 0.70f, 0.35f, accentC, 0.06f, 0.7f),
                NebulaBlobSpec(0.85f, 0.60f, 0.25f, accent, 0.07f, 2.0f),
                NebulaBlobSpec(0.10f, 0.75f, 0.22f, accentB, 0.05f, 1.3f),
                NebulaBlobSpec(0.55f, 0.15f, 0.20f, Color(0xFFFFD27A), 0.06f, 1.8f),
            )
            nebulaBlobs.forEach { blob ->
                val angle = (nebulaDrift * blob.speedMult) * (PI.toFloat() / 180f)
                val cx = w * blob.baseX + cos(angle) * w * 0.06f
                val cy = h * blob.baseY + sin(angle * 0.7f) * h * 0.04f
                val r = w * blob.radius * auroraPulse
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(blob.color.copy(alpha = blob.alpha * auroraPulse), Color.Transparent),
                        center = Offset(cx, cy),
                        radius = r,
                    ),
                    radius = r,
                    center = Offset(cx, cy),
                )
            }

            // ── Horizon light sweep ──
            val sweepX = w * horizonSweep
            drawOval(
                brush = Brush.radialGradient(
                    colors = listOf(accent.copy(alpha = 0.08f), Color.Transparent),
                    center = Offset(sweepX, h * 0.92f),
                    radius = w * 0.4f,
                ),
                topLeft = Offset(sweepX - w * 0.25f, h * 0.78f),
                size = Size(w * 0.5f, h * 0.3f),
            )

            // ── Floating particles ──
            drawLoginParticles(particles, particleTime, accent, accentB, accentC, visuals.accentWarm)

            // ── Cinematic vignette ──
            drawRect(
                brush = Brush.radialGradient(
                    colors = listOf(Color.Transparent, Color(0xAA060402)),
                    center = Offset(w * 0.5f, h * 0.45f),
                    radius = w * 0.85f,
                ),
            )

            // ── Top and bottom edge gradients ──
            drawRect(
                brush = Brush.verticalGradient(
                    colorStops = arrayOf(
                        0.00f to Color(0x660A0806),
                        0.08f to Color.Transparent,
                    ),
                ),
                size = Size(w, h * 0.15f),
            )
            drawRect(
                brush = Brush.verticalGradient(
                    colorStops = arrayOf(
                        0.00f to Color.Transparent,
                        1.00f to Color(0x880A0806),
                    ),
                ),
                topLeft = Offset(0f, h * 0.85f),
                size = Size(w, h * 0.15f),
            )
        }
    }
}

private fun DrawScope.drawLoginParticles(
    particles: List<LoginParticle>,
    time: Float,
    accent: Color,
    accentB: Color,
    accentC: Color,
    accentWarm: Color,
) {
    val w = size.width
    val h = size.height
    particles.forEachIndexed { index, p ->
        val color = when (p.colorIndex) {
            0 -> accent
            1 -> accentB
            2 -> accentC
            else -> accentWarm
        }
        val currentY = (p.y - time * p.speed * 25f) % 1f
        val xOffset = sin(time * PI.toFloat() * 2f + p.phaseOffset + index * 0.25f) * p.driftAmplitude

        val cx = (p.x * w + xOffset).coerceIn(0f, w)
        val cy = (if (currentY < 0) currentY + 1f else currentY) * h

        // Soft glow halo
        if (p.hasGlow) {
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(color.copy(alpha = p.alpha * 0.4f), Color.Transparent),
                    center = Offset(cx, cy),
                    radius = p.glowRadius,
                ),
                radius = p.glowRadius,
                center = Offset(cx, cy),
            )
        }
        // Core dot
        drawCircle(
            color = color.copy(alpha = p.alpha),
            radius = p.size,
            center = Offset(cx, cy),
        )
    }
}

private data class LoginParticle(
    val x: Float, val y: Float,
    val size: Float, val speed: Float, val alpha: Float,
    val colorIndex: Int, val hasGlow: Boolean, val glowRadius: Float,
    val phaseOffset: Float, val driftAmplitude: Float,
)

private data class NebulaBlobSpec(
    val baseX: Float, val baseY: Float,
    val radius: Float, val color: Color,
    val alpha: Float, val speedMult: Float,
)
