package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import kotlin.math.sin
import kotlin.random.Random

/**
 * Enhanced Floating Particles — Premium Fiery Glass.
 * Uses a warm tri-color palette (Gold → Orange → Amber) for depth.
 * Features varied particle sizes, soft glow circles, and smooth drift.
 */
@Composable
fun FloatingParticles(modifier: Modifier = Modifier) {
    val visuals = LocalMoVisuals.current
    val particleCount = 30
    val particles = remember {
        List(particleCount) {
            ParticleData(
                x = Random.nextFloat(),
                y = Random.nextFloat(),
                size = Random.nextFloat() * 5f + 1.5f,
                speed = Random.nextFloat() * 0.018f + 0.006f,
                alpha = Random.nextFloat() * 0.26f + 0.06f,
                // 0 = accent (Gold), 1 = accentB (Orange), 2 = accentC (Amber)
                colorIndex = Random.nextInt(3),
                // Larger particles get a soft radial glow
                hasGlow = Random.nextFloat() > 0.65f,
                glowRadius = Random.nextFloat() * 18f + 12f,
                phaseOffset = Random.nextFloat() * PI * 2f,
            )
        }
    }

    val transition = rememberInfiniteTransition(label = "particles")
    val animValue by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(14_000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "anim"
    )

    Canvas(modifier = modifier.fillMaxSize()) {
        val w = size.width
        val h = size.height

        particles.forEachIndexed { index, p ->
            val color = when (p.colorIndex) {
                0 -> visuals.accent
                1 -> visuals.accentB
                else -> visuals.accentC
            }
            val currentY = (p.y - animValue * p.speed * 20f) % 1f
            val xOffset = sin(animValue * PI * 2f + p.phaseOffset + index * 0.3f) * 22f

            val cx = (p.x * w + xOffset).coerceIn(0f, w)
            val cy = (if (currentY < 0) currentY + 1f else currentY) * h

            // Soft glow halo for larger particles
            if (p.hasGlow) {
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            color.copy(alpha = p.alpha * 0.5f),
                            Color.Transparent,
                        ),
                        center = Offset(cx, cy),
                        radius = p.glowRadius,
                    ),
                    radius = p.glowRadius,
                    center = Offset(cx, cy),
                )
            }

            // Core particle dot
            drawCircle(
                color = color.copy(alpha = p.alpha),
                radius = p.size,
                center = Offset(cx, cy),
            )
        }
    }
}

private data class ParticleData(
    val x: Float,
    val y: Float,
    val size: Float,
    val speed: Float,
    val alpha: Float,
    val colorIndex: Int,
    val hasGlow: Boolean,
    val glowRadius: Float,
    val phaseOffset: Float,
)

private const val PI = 3.1415926535f
