package com.moalfarras.moplayer.ui.components

import android.os.SystemClock
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.BringIntoViewSpec
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.grid.LazyGridState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import kotlin.math.roundToInt

/** Focus scale per surface type — one consistent focus language across the app. */
object FocusScale {
    /** Posters and channel tiles. */
    const val Card = 1.07f
    /** Small buttons and dock items. */
    const val Button = 1.06f
    /** Chips and pills (category rail, season picker). */
    const val Chip = 1.03f
    /** Full-width list rows (channels, episodes). A large scale would overflow the panel. */
    const val Row = 1.015f
}

private const val PRESSED_SCALE = 0.96f
private val FOCUS_RING_WIDTH = 2.5.dp

/** Minimum gap between two accepted clicks on a browse tile (double OK must not open twice). */
const val CARD_CLICK_GUARD_MS = 450L

/** Delay before a programmatic requestFocus, so a freshly composed lazy item is attached. */
const val FOCUS_REQUEST_DELAY_MS = 120L

/** True inside a [FocusGlow] whose target currently has focus — lets content draw a stronger focused state. */
val LocalFocusGlowFocused = compositionLocalOf { false }

/**
 * True when decorative transitions (backdrop crossfades) should be skipped on weak boxes.
 * Screens provide it from the performance policy; the default is the safe choice.
 */
val LocalReduceMotion = staticCompositionLocalOf { true }

/**
 * Accepts a click only when at least [windowMs] passed since the last accepted one.
 * A window of 0 disables the guard.
 */
class ClickGuard(private val windowMs: Long) {
    private var lastAcceptedAt = Long.MIN_VALUE

    fun tryAccept(nowMs: Long): Boolean {
        if (windowMs <= 0L) return true
        if (lastAcceptedAt != Long.MIN_VALUE && nowMs - lastAcceptedAt in 0 until windowMs) return false
        lastAcceptedAt = nowMs
        return true
    }
}

/**
 * Visible TV focus treatment for D-pad navigation, also used for touch.
 *
 * - OK fires [onClick] immediately; holding OK (the platform long-press timeout, ~0.5 s) fires
 *   [onLongClick]. Both come from Compose's combinedClickable, which handles DPAD_CENTER/ENTER
 *   natively and does not depend on the remote sending key repeats.
 * - Focus: scale [focusedScale] + a light accent ring + a soft accent glow, drawn above siblings.
 *   Callers must not clip the [modifier] they pass in, or the ring and glow get cut off.
 * - Touch: a clipped ripple and a slight press-in, so taps give feedback on phones.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun FocusGlow(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 20.dp,
    focusRequester: FocusRequester? = null,
    onFocused: () -> Unit = {},
    onClick: (() -> Unit)? = null,
    onLongClick: (() -> Unit)? = null,
    focusable: Boolean = true,
    focusedScale: Float = FocusScale.Button,
    glowElevation: Dp = 14.dp,
    clickGuardMs: Long = 0L,
    content: @Composable BoxScope.() -> Unit,
) {
    val visuals = LocalMoVisuals.current
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val pressed by interaction.collectIsPressedAsState()
    val shape = remember(cornerRadius) { RoundedCornerShape(cornerRadius) }
    val touchMode = LocalInputModeManager.current.inputMode == InputMode.Touch
    val currentOnFocused by rememberUpdatedState(onFocused)
    val currentOnClick by rememberUpdatedState(onClick)
    val guard = remember(clickGuardMs) { ClickGuard(clickGuardMs) }

    val targetScale = when {
        focused && pressed -> focusedScale * PRESSED_SCALE
        focused -> focusedScale
        pressed -> PRESSED_SCALE
        else -> 1f
    }
    val scale by animateFloatAsState(
        targetValue = targetScale,
        animationSpec = spring(dampingRatio = 0.72f, stiffness = 420f),
        label = "focus-scale",
    )

    LaunchedEffect(focused, focusable) {
        if (focused && focusable) currentOnFocused()
    }

    val clickTarget = when {
        !focusable -> Modifier
        onClick != null || onLongClick != null -> Modifier
            // Surface clips its content inside the passed modifier, so the ripple needs its own
            // clip; it sits after the shadow so the glow itself is never clipped.
            .clip(shape)
            .combinedClickable(
                interactionSource = interaction,
                indication = if (touchMode) ripple(color = visuals.accent) else null,
                onLongClick = onLongClick,
                onClick = {
                    val click = currentOnClick
                    if (click != null && guard.tryAccept(SystemClock.uptimeMillis())) click()
                },
            )
        else -> Modifier.focusable(interactionSource = interaction)
    }

    val ringBrush = remember(visuals.accent, visuals.accentB) {
        Brush.linearGradient(listOf(Color.White, visuals.accent, visuals.accentB))
    }

    Surface(
        modifier = modifier
            .zIndex(if (focused) 1f else 0f)
            .let { m -> if (focusRequester != null) m.focusRequester(focusRequester) else m }
            .focusProperties { canFocus = focusable }
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .shadow(
                elevation = if (focused) glowElevation else 0.dp,
                shape = shape,
                clip = false,
                ambientColor = if (focused) visuals.accent.copy(alpha = 0.55f) else Color.Transparent,
                spotColor = if (focused) visuals.accent.copy(alpha = 0.50f) else Color.Transparent,
            )
            .then(clickTarget),
        shape = shape,
        color = if (focused) visuals.accent.copy(alpha = 0.10f) else Color.Transparent,
        border = if (focused) BorderStroke(FOCUS_RING_WIDTH, ringBrush) else null,
    ) {
        CompositionLocalProvider(LocalFocusGlowFocused provides focused) {
            Box(
                modifier = Modifier.padding(2.dp),
                content = content,
            )
        }
    }
}

/**
 * Scroll distance that keeps a focused item's leading edge at [pivotFraction] of the container,
 * so the user always sees what comes next (look-ahead) and scaled focus visuals are never flush
 * with the clip edge. Items too large to sit at the pivot align their trailing edge instead.
 * Mirrors foundation's TV pivot behaviour, but is used on every TV box (not only leanback ones).
 */
internal fun tvPivotScrollDistance(offset: Float, size: Float, containerSize: Float, pivotFraction: Float): Float {
    if (containerSize <= 0f) return 0f
    val pivot = pivotFraction.coerceIn(0f, 1f) * containerSize
    val desiredStart = when {
        size <= containerSize - pivot -> pivot
        size <= containerSize -> containerSize - size
        else -> 0f
    }
    return offset - desiredStart
}

/**
 * Bring-into-view offsets arrive in physical coordinates (from the left edge for rows). In an
 * RTL row the leading edge is on the right, so the pivot is measured from there by mirroring the
 * item and negating the resulting distance.
 */
internal fun tvPivotScrollDistanceMirrored(offset: Float, size: Float, containerSize: Float, pivotFraction: Float): Float =
    -tvPivotScrollDistance(containerSize - (offset + size), size, containerSize, pivotFraction)

@OptIn(ExperimentalFoundationApi::class)
class TvPivotBringIntoViewSpec(
    private val pivotFraction: Float,
    private val mirrored: Boolean = false,
) : BringIntoViewSpec {
    override fun calculateScrollDistance(offset: Float, size: Float, containerSize: Float): Float =
        if (mirrored) {
            tvPivotScrollDistanceMirrored(offset, size, containerSize, pivotFraction)
        } else {
            tvPivotScrollDistance(offset, size, containerSize, pivotFraction)
        }
}

/** Default pivot: 30% from the leading edge, the platform's TV list behaviour. */
const val TV_PIVOT_FRACTION = 0.3f

/**
 * TV bring-into-view spec for a lazy list. Pass [horizontal] = true for rows so the pivot follows
 * the reading direction in Arabic (right-to-left); vertical lists are never mirrored.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun rememberTvBringIntoViewSpec(horizontal: Boolean = false, pivotFraction: Float = TV_PIVOT_FRACTION): BringIntoViewSpec {
    val mirrored = horizontal && LocalLayoutDirection.current == LayoutDirection.Rtl
    return remember(pivotFraction, mirrored) { TvPivotBringIntoViewSpec(pivotFraction, mirrored) }
}

/** Scroll offset (px) that lands a restored item on the pivot line instead of the leading edge. */
internal fun pivotScrollOffset(viewportSizePx: Int, pivotFraction: Float = TV_PIVOT_FRACTION): Int =
    if (viewportSizePx <= 0) 0 else -(viewportSizePx * pivotFraction).roundToInt()

/** Brings [index] near the pivot line unless it is already fully visible. */
suspend fun LazyListState.scrollToPivotIfNeeded(index: Int) {
    val info = layoutInfo
    val visible = info.visibleItemsInfo.firstOrNull { it.index == index }
    if (visible != null && visible.offset >= info.viewportStartOffset && visible.offset + visible.size <= info.viewportEndOffset) return
    val viewport = if (info.orientation == androidx.compose.foundation.gestures.Orientation.Vertical) info.viewportSize.height else info.viewportSize.width
    scrollToItem(index, pivotScrollOffset(viewport))
}

/** Grid variant of [scrollToPivotIfNeeded]. */
suspend fun LazyGridState.scrollToPivotIfNeeded(index: Int) {
    val info = layoutInfo
    val visible = info.visibleItemsInfo.firstOrNull { it.index == index }
    if (visible != null && visible.offset.y >= info.viewportStartOffset && visible.offset.y + visible.size.height <= info.viewportEndOffset) return
    scrollToItem(index, pivotScrollOffset(info.viewportSize.height))
}
