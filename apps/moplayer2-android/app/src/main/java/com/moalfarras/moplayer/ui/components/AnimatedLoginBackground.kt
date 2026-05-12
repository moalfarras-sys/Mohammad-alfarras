package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import kotlin.math.cos
import kotlin.math.sin

/**
 * Premium Luxury Background — Studio Light Sweep.
 * Elegant, high-contrast, deep obsidian base with slow-moving golden rays
 * simulating light passing through premium dark glass.
 */
@Composable
fun AnimatedLoginBackground(modifier: Modifier = Modifier) {
    val visuals = LocalMoVisuals.current
    val transition = rememberInfiniteTransition(label = "luxury-bg")

    val lightSweep by transition.animateFloat(
        initialValue = -0.5f, targetValue = 1.5f,
        animationSpec = infiniteRepeatable(tween(18000, easing = LinearEasing), RepeatMode.Reverse),
        label = "light-sweep"
    )

    val waveShift by transition.animateFloat(
        initialValue = 0f, targetValue = 6.28f, // 2*PI
        animationSpec = infiniteRepeatable(tween(25000, easing = LinearEasing)),
        label = "wave-shift"
    )

    Box(modifier.fillMaxSize()) {
        // Layer 1: Deep obsidian base
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colorStops = arrayOf(
                            0.0f to Color(0xFF14100D),
                            0.5f to Color(0xFF0C0907),
                            1.0f to Color(0xFF050403),
                        ),
                        center = Offset(0.5f, 0.5f),
                        radius = Float.POSITIVE_INFINITY
                    )
                )
        )

        // Layer 2: Sweeping Studio Lights & Glass Refractions
        Canvas(Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val accent = visuals.accent
            val accentWarm = visuals.accentWarm

            // Large soft ambient glow moving horizontally
            val glowCx = w * lightSweep
            val glowCy = h * (0.3f + 0.2f * sin(waveShift))
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(accent.copy(alpha = 0.08f), Color.Transparent),
                    center = Offset(glowCx, glowCy),
                    radius = w * 0.7f
                ),
                radius = w * 0.7f,
                center = Offset(glowCx, glowCy)
            )

            // Secondary warm glow moving opposite
            val glowCx2 = w * (1f - lightSweep)
            val glowCy2 = h * (0.6f + 0.2f * cos(waveShift))
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(accentWarm.copy(alpha = 0.05f), Color.Transparent),
                    center = Offset(glowCx2, glowCy2),
                    radius = w * 0.9f
                ),
                radius = w * 0.9f,
                center = Offset(glowCx2, glowCy2)
            )

            // Sharp diagonal glass reflection / ray
            val rayCenter = w * lightSweep
            drawRect(
                brush = Brush.linearGradient(
                    colors = listOf(Color.Transparent, accent.copy(alpha = 0.04f), Color(0x33FFFFFF), accent.copy(alpha = 0.04f), Color.Transparent),
                    start = Offset(rayCenter - w * 0.2f, 0f),
                    end = Offset(rayCenter + w * 0.2f, h)
                )
            )

            // Another slower, wider reflection
            val rayCenter2 = w * (0.8f - lightSweep * 0.5f)
            drawRect(
                brush = Brush.linearGradient(
                    colors = listOf(Color.Transparent, accentWarm.copy(alpha = 0.03f), Color.Transparent),
                    start = Offset(rayCenter2 - w * 0.4f, 0f),
                    end = Offset(rayCenter2 + w * 0.4f, h)
                )
            )
        }
    }
}
