package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals

/** Restrained warm glass panel used across TV surfaces. */
@Composable
fun GlassPanel(
    modifier: Modifier = Modifier,
    radius: Dp = 24.dp,
    highlighted: Boolean = false,
    blur: Dp = 0.dp,
    glow: Color? = null,
    contentAlignment: Alignment = Alignment.TopStart,
    content: @Composable BoxScope.() -> Unit,
) {
    val visuals = LocalMoVisuals.current

    val bg by animateColorAsState(
        targetValue = if (highlighted) {
            visuals.surfaceHigh.copy(alpha = 0.88f)
        } else {
            visuals.surface.copy(alpha = 0.72f)
        },
        label = "glass-bg",
    )

    val borderAlpha by animateFloatAsState(
        targetValue = if (highlighted) 0.72f else 0.22f,
        label = "glass-border-alpha",
    )

    val activeGlow = glow ?: if (highlighted) visuals.accent.copy(alpha = 0.34f) else Color.Transparent
    val shadowElevation = if (highlighted) 24.dp else 0.dp
    val shape = RoundedCornerShape(radius)

    Surface(
        modifier = modifier
            .shadow(
                elevation = shadowElevation,
                shape = shape,
                clip = false,
                ambientColor = activeGlow,
                spotColor = activeGlow,
            ),
        shape = shape,
        color = bg,
        border = BorderStroke(
            width = if (highlighted) 1.6.dp else 1.dp,
            brush = Brush.linearGradient(
                colors = listOf(
                    Color.White.copy(alpha = if (highlighted) 0.32f else 0.12f),
                    visuals.accent.copy(alpha = borderAlpha),
                    visuals.accentB.copy(alpha = if (highlighted) 0.22f else 0.08f),
                    Color(0x0DFFFFFF),
                ),
                start = Offset(0f, 0f),
                end = Offset(Float.POSITIVE_INFINITY, Float.POSITIVE_INFINITY),
            ),
        ),
    ) {
        Box(
            modifier = Modifier
                .clip(shape)
                .background(
                    Brush.linearGradient(
                        colorStops = arrayOf(
                            0.00f to Color.White.copy(alpha = if (highlighted) 0.10f else 0.045f),
                            0.30f to visuals.accent.copy(alpha = if (highlighted) 0.045f else 0.015f),
                            0.50f to Color.Transparent,
                            1.00f to visuals.accentB.copy(alpha = if (highlighted) 0.035f else 0.012f),
                        ),
                        start = Offset(0f, 0f),
                        end = Offset(Float.POSITIVE_INFINITY, Float.POSITIVE_INFINITY),
                    ),
                )
                .border(
                    width = 0.5.dp,
                    brush = Brush.verticalGradient(
                        listOf(Color.White.copy(alpha = 0.14f), Color.Transparent),
                    ),
                    shape = shape,
                ),
            contentAlignment = contentAlignment,
            content = content,
        )
    }
}

@Composable
fun GlassShimmer(
    modifier: Modifier = Modifier,
    radius: Dp = 24.dp,
) {
    val visuals = LocalMoVisuals.current
    val transition = rememberInfiniteTransition(label = "shimmer")
    val translateAnim by transition.animateFloat(
        initialValue = -1000f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmer-pos"
    )

    val shimmerColors = listOf(
        Color.Transparent,
        visuals.accent.copy(alpha = 0.06f),
        Color.White.copy(alpha = 0.08f),
        visuals.accent.copy(alpha = 0.06f),
        Color.Transparent,
    )

    val brush = Brush.linearGradient(
        colors = shimmerColors,
        start = Offset(translateAnim, translateAnim),
        end = Offset(translateAnim + 500f, translateAnim + 500f),
    )

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(radius))
            .background(visuals.glass.copy(alpha = 0.4f))
            .background(brush)
    )
}

@Composable
fun GlassGlowScale(
    focused: Boolean,
    modifier: Modifier = Modifier,
    radius: Dp = 24.dp,
    content: @Composable BoxScope.() -> Unit,
) {
    val scale by animateFloatAsState(
        targetValue = if (focused) 1.07f else 1f,
        animationSpec = spring(dampingRatio = 0.7f, stiffness = 300f),
        label = "glass-scale",
    )
    GlassPanel(
        modifier = modifier
            .graphicsLayer { scaleX = scale; scaleY = scale }
            .padding(2.dp),
        radius = radius,
        highlighted = focused,
        content = content,
    )
}
