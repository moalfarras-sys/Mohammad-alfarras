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
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

enum class RemoteInputAction {
    None,
    Click,
    LongOk,
    TripleOk,
}

class RemoteInputController(
    private val longPressMs: Long = 3_000L,
    val triplePressWindowMs: Long = 650L,
) {
    private var okCount = 0
    private var lastOkAt = 0L
    private var okDownAt = 0L

    fun onOkDown(timestampMs: Long) {
        if (okDownAt == 0L) okDownAt = timestampMs
    }

    fun onOkUp(timestampMs: Long): RemoteInputAction {
        val heldMs = if (okDownAt == 0L) 0L else timestampMs - okDownAt
        okDownAt = 0L

        if (heldMs >= longPressMs) {
            okCount = 0
            lastOkAt = 0L
            return RemoteInputAction.LongOk
        }

        okCount = if (timestampMs - lastOkAt < triplePressWindowMs) okCount + 1 else 1
        lastOkAt = timestampMs

        return if (okCount >= 3) {
            okCount = 0
            lastOkAt = 0L
            RemoteInputAction.TripleOk
        } else {
            RemoteInputAction.Click
        }
    }
}

/**
 * Visible TV focus treatment for D-pad navigation.
 */
@Composable
fun FocusGlow(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 20.dp,
    focusRequester: FocusRequester? = null,
    onFocused: () -> Unit = {},
    onClick: (() -> Unit)? = null,
    onTripleOk: () -> Unit = {},
    onLongOk: () -> Unit = {},
    delayClickForTripleOk: Boolean = false,
    focusable: Boolean = true,
    content: @Composable BoxScope.() -> Unit,
) {
    val visuals = LocalMoVisuals.current
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val shape = RoundedCornerShape(cornerRadius)
    val remoteInput = remember { RemoteInputController() }
    val scope = rememberCoroutineScope()
    var pendingClick by remember { mutableStateOf<Job?>(null) }

    val scale by animateFloatAsState(
        targetValue = if (focused) 1.045f else 1f,
        animationSpec = spring(dampingRatio = 0.65f, stiffness = 380f),
        label = "focus-scale",
    )

    LaunchedEffect(focused, focusable) {
        if (focused && focusable) onFocused()
    }

    DisposableEffect(Unit) {
        onDispose {
            pendingClick?.cancel()
            pendingClick = null
        }
    }

    val focusTarget = if (!focusable) {
        Modifier
    } else if (onClick != null) {
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
            .let { m -> if (focusRequester != null) m.focusRequester(focusRequester) else m }
            .focusProperties { canFocus = focusable }
            .let { m ->
                if (!focusable) {
                    m
                } else {
                    m.onPreviewKeyEvent { event ->
                        if (event.key != Key.Enter && event.key != Key.DirectionCenter && event.key != Key.NumPadEnter) {
                            return@onPreviewKeyEvent false
                        }
                        val now = System.currentTimeMillis()
                        when (event.type) {
                            KeyEventType.KeyDown -> {
                                pendingClick?.cancel()
                                pendingClick = null
                                remoteInput.onOkDown(now)
                                true
                            }
                            KeyEventType.KeyUp -> {
                                when (remoteInput.onOkUp(now)) {
                                    RemoteInputAction.LongOk -> {
                                        pendingClick?.cancel()
                                        pendingClick = null
                                        onLongOk()
                                    }
                                    RemoteInputAction.TripleOk -> {
                                        pendingClick?.cancel()
                                        pendingClick = null
                                        onTripleOk()
                                    }
                                    RemoteInputAction.Click -> {
                                        if (delayClickForTripleOk && onClick != null) {
                                            pendingClick = scope.launch {
                                                delay(remoteInput.triplePressWindowMs)
                                                onClick.invoke()
                                            }
                                        } else {
                                            onClick?.invoke()
                                        }
                                    }
                                    RemoteInputAction.None -> Unit
                                }
                                true
                            }
                            else -> false
                        }
                    }
                }
            }
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .shadow(
                elevation = if (focused) 18.dp else 0.dp,
                shape = shape,
                clip = false,
                ambientColor = if (focused) visuals.accent.copy(alpha = 0.62f) else Color.Transparent,
                spotColor = if (focused) visuals.accent.copy(alpha = 0.52f) else Color.Transparent,
            )
            .then(focusTarget),
        shape = shape,
        color = if (focused) visuals.accent.copy(alpha = 0.13f) else Color.Transparent,
        border = if (focused) BorderStroke(borderWidth, borderBrush) else null,
    ) {
        Box(
            modifier = Modifier.padding(2.dp),
            content = content,
        )
    }
}
