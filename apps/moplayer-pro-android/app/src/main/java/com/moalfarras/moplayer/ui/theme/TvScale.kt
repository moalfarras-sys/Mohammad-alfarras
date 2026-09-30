package com.moalfarras.moplayer.ui.theme

import android.content.res.Configuration
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.moalfarras.moplayer.core.Adaptive

@Immutable
data class TvScale(
    val factor: Float,
    val contentPadding: Dp,
    val dockPadding: Dp,
    val laneSpacing: Dp,
    val cardRadius: Dp,
    val posterWidth: Dp,
    val panelPadding: Dp,
    val isTv: Boolean,
    val isCompact: Boolean,
    val bottomBarHeight: Dp,
    /** min(widthDp, heightDp) — في تطبيق landscape-only يميل للإشارة إلى “الجهة القصيرة”. */
    val shortestScreenDp: Int,
    val maxOfWidthHeightDp: Int,
    val isLandscape: Boolean,
    /** جوال/تاب بالعرض مع ارتفاع منطقي محدود — واجهة أخف */
    val isLowHeightLandscape: Boolean,
    /**
     * TV only: how many dp one unit of the 960x540dp TV design canvas is on this screen
     * (1.0 on standard 1080p/720p TVs, ~1.33 on hdpi boxes that report 1280x720dp).
     * Always 1.0 on phones and tablets.
     */
    val canvas: Float = 1f,
    /** Overscan-safe vertical margin (27dp on the TV canvas, the 5% platform guideline). */
    val verticalSafePadding: Dp = 0.dp,
) {
    /** A length designed on the 960x540dp TV canvas, normalized to this screen. */
    fun u(value: Float): Dp = (value * canvas).dp
}

/** Smallest secondary text on the TV canvas (labels, metadata). Body text uses 14sp and up. */
const val TV_MIN_SECONDARY_SP = 12f

/**
 * TV scale factor. Standard Android TV configurations (1080p@xhdpi, 720p@tvdpi, the emulator)
 * report a 960x540dp canvas; the layout literals were tuned there at 0.66. Normalizing by the
 * canvas keeps hdpi boxes that report 1280x720dp at the same physical size instead of rendering
 * everything ~25% smaller. Under [TvDisplayScale] the configuration always reports that canvas, so
 * this is 1:1; it only scales when the screen size was unknown.
 */
internal fun tvScaleFactor(widthDp: Int, heightDp: Int): Float {
    val canvas = tvCanvasScale(widthDp, heightDp)
    return (canvas * TV_BASE_FACTOR).coerceIn(0.6f, 1.4f)
}

/** How many dp one 960x540dp canvas unit is, never below 1 so TV text is never shrunk. */
internal fun tvCanvasScale(widthDp: Int, heightDp: Int): Float =
    minOf(widthDp / TV_CANVAS_WIDTH_DP, heightDp / TV_CANVAS_HEIGHT_DP).coerceIn(1f, 2.1f)

private const val TV_CANVAS_WIDTH_DP = 960f
private const val TV_CANVAS_HEIGHT_DP = 540f
private const val TV_BASE_FACTOR = 0.66f

@Composable
fun rememberTvScale(): TvScale {
    val configuration = LocalConfiguration.current
    val context = LocalContext.current
    // Compute the TV/leanback check once per composition instance instead of on every
    // recomposition. The @Composable Adaptive.isTv getter probes UiModeManager +
    // PackageManager features (~4 system lookups); rememberTvScale runs in nearly every
    // card, so doing this per recomposition made D-pad focus/scroll churn on weak boxes.
    // Device form factor does not change during a session.
    val isTv = remember(context) { Adaptive.isTv(context) }
    val w = configuration.screenWidthDp
    val h = configuration.screenHeightDp
    val shortest = minOf(w, h)
    val longest = maxOf(w, h)
    val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE

    return remember(w, h, isTv, configuration.orientation) {
        if (isTv) {
            val factor = tvScaleFactor(w, h)
            val canvas = tvCanvasScale(w, h)
            TvScale(
                factor = factor,
                // 5% horizontal overscan-safe margin (48dp on the 960dp TV canvas). Backgrounds
                // stay full-bleed; only text and controls respect it.
                contentPadding = (48 * canvas).dp,
                dockPadding = (18 * factor).dp,
                laneSpacing = (15 * factor).dp,
                cardRadius = (16f * factor).coerceAtLeast(12f).dp,
                posterWidth = (92 * canvas).dp,
                panelPadding = (18 * factor).dp,
                isTv = true,
                isCompact = false,
                bottomBarHeight = (82 * factor).dp,
                shortestScreenDp = shortest,
                maxOfWidthHeightDp = longest,
                isLandscape = true,
                isLowHeightLandscape = false,
                canvas = canvas,
                verticalSafePadding = (27 * canvas).dp,
            )
        } else {
            val compact = shortest < 600
            val lowHeightLandscape = isLandscape && shortest < 430
            val factor = (longest / 640f).coerceIn(0.78f, 1.12f)
            TvScale(
                factor = factor,
                contentPadding = when {
                    lowHeightLandscape -> 10.dp
                    compact -> 14.dp
                    else -> 22.dp
                },
                dockPadding = if (lowHeightLandscape) 8.dp else 12.dp,
                laneSpacing = when {
                    lowHeightLandscape -> 8.dp
                    compact -> 14.dp
                    else -> 18.dp
                },
                cardRadius = when {
                    lowHeightLandscape -> 18.dp
                    compact -> 22.dp
                    else -> 26.dp
                },
                posterWidth = when {
                    lowHeightLandscape -> 72.dp
                    compact -> 92.dp
                    else -> 108.dp
                },
                panelPadding = when {
                    lowHeightLandscape -> 12.dp
                    compact -> 14.dp
                    else -> 18.dp
                },
                isTv = false,
                isCompact = compact,
                bottomBarHeight = mobileDockReserve(factor, lowHeightLandscape, compact),
                shortestScreenDp = shortest,
                maxOfWidthHeightDp = longest,
                isLandscape = isLandscape,
                isLowHeightLandscape = lowHeightLandscape,
                verticalSafePadding = 0.dp,
            )
        }
    }
}

/**
 * Space a phone/tablet screen reserves for the floating dock: the dock's button height plus its
 * row padding, bottom margin and the lift of the active pill. Derived from the same numbers the
 * dock uses so the two cannot drift apart (a flat 136dp used to waste ~15% of a landscape phone).
 */
internal fun mobileDockReserve(factor: Float, lowHeightLandscape: Boolean, compact: Boolean): Dp {
    val button = DOCK_BUTTON_HEIGHT * factor
    val rowPadding = 2 * DOCK_ROW_VERTICAL_PADDING * factor
    val margin = if (compact || lowHeightLandscape) 10f else 18f
    val reserve = button + rowPadding + margin + 8f
    return reserve.coerceAtLeast(if (lowHeightLandscape) 76f else 80f).dp
}

/** Dock metrics shared by [mobileDockReserve] and the dock itself. */
internal const val DOCK_BUTTON_HEIGHT = 46f
internal const val DOCK_ROW_VERTICAL_PADDING = 8f
