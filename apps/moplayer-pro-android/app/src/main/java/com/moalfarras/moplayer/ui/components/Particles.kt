package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import kotlin.math.sin
import kotlin.random.Random

/** Subtle ambient sparks, kept sparse so media content stays dominant. */
@Composable
fun FloatingParticles(modifier: Modifier = Modifier) {
    val visuals = LocalMoVisuals.current
    val particleCount = 12
    val particles = remember {
        List(particleCount) {
            ParticleData(
                x = Random.nextFloat(),
                y = Random.nextFloat(),
                size = Random.nextFloat() * 2.4f + 0.8f,
                speed = Random.nextFloat() * 0.012f + 0.004f,
                alpha = Random.nextFloat() * 0.12f + 0.035f,
                colorIndex = Random.nextInt(3),
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
    val phaseOffset: Float,
)

private const val PI = 3.1415926535f
