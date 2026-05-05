package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals

/**
 * Premium Focus Glow — VERY VISIBLE TV focus indicator.
 * Creates a thick, highly visible golden border with animated scale,
 * bright outer glow, and warm gold fill — designed to be seen from
 * across the room on a TV.
 */
@Composable
fun FocusGlow(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 20.dp,
    onFocused: () -> Unit = {},
    onClick: (() -> Unit)? = null,
    onTripleOk: () -> Unit = {},
    onLongOk: () -> Unit = {},
    content: @Composable BoxScope.() -> Unit,
) {
    val visuals = LocalMoVisuals.current
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val shape = RoundedCornerShape(cornerRadius)

    val scale by animateFloatAsState(
        targetValue = if (focused) 1.06f else 1f,
        animationSpec = spring(dampingRatio = 0.65f, stiffness = 380f),
        label = "focus-scale",
    )

    var okCount by remember { mutableIntStateOf(0) }
    var lastOkAt by remember { mutableLongStateOf(0L) }
    var okDownAt by remember { mutableLongStateOf(0L) }

    LaunchedEffect(focused) {
        if (focused) onFocused()
    }

    val focusTarget = if (onClick != null) {
        Modifier.clickable(
            interactionSource = interaction,
            indication = null,
            onClick = onClick,
        )
    } else {
        Modifier.focusable(interactionSource = interaction)
    }

    val borderWidth = if (focused) 3.dp else 0.dp
    val borderBrush = if (focused) {
        Brush.linearGradient(
            listOf(
                Color.White,
                visuals.accent,
                visuals.accentB,
                visuals.accent,
            )
        )
    } else {
        Brush.linearGradient(listOf(Color.Transparent, Color.Transparent))
    }

    Surface(
        modifier = modifier
            .onPreviewKeyEvent { event ->
                if (event.key != Key.Enter && event.key != Key.DirectionCenter) return@onPreviewKeyEvent false
                val now = System.currentTimeMillis()
                when (event.type) {
                    KeyEventType.KeyDown -> {
                        if (okDownAt == 0L) okDownAt = now
                        false
                    }
                    KeyEventType.KeyUp -> {
                        val held = now - okDownAt
                        okDownAt = 0L
                        if (held >= 3000L) {
                            onLongOk()
                            true
                        } else {
                            okCount = if (now - lastOkAt < 650L) okCount + 1 else 1
                            lastOkAt = now
                            if (okCount >= 3) {
                                okCount = 0
                                onTripleOk()
                                true
                            } else {
                                onClick?.invoke()
                                onClick != null
                            }
                        }
                    }
                    else -> false
                }
            }
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .shadow(
                elevation = if (focused) 24.dp else 0.dp,
                shape = shape,
                clip = false,
                ambientColor = if (focused) visuals.accent.copy(alpha = 0.80f) else Color.Transparent,
                spotColor = if (focused) visuals.accent.copy(alpha = 0.70f) else Color.Transparent,
            )
            .then(focusTarget),
        shape = shape,
        color = if (focused) visuals.accent.copy(alpha = 0.18f) else Color.Transparent,
        border = if (focused) BorderStroke(borderWidth, borderBrush) else null,
    ) {
        Box(
            modifier = Modifier.padding(2.dp),
            content = content,
        )
    }
}
