package com.moalfarras.moplayer.ui.theme

import android.content.res.Configuration
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import com.moalfarras.moplayer.domain.model.UiScale
import kotlin.math.roundToInt

/**
 * Lays the TV interface out on one grid on every TV.
 *
 * TVs and boxes report very different densities for the same 1080p panel (240, 320, 400 dpi and
 * more) and some ship a larger system font. Left alone, the same screen is 25-60% bigger on one
 * TV than on another, and list names wrap or get cut. Here the layouts always get the 960x540dp
 * design canvas, widened by the viewer's [UiScale] (a wider grid draws everything smaller and
 * gives lists more room), and the system font scale is kept within [TV_MIN_FONT_SCALE] to
 * [TV_MAX_FONT_SCALE].
 *
 * The reported [Configuration] keeps the 960x540dp canvas, so [rememberTvScale] and the type scale
 * use their 1:1 values; the extra room of a wider grid goes to the layouts' weights and lists.
 * Phones and tablets are left unchanged.
 */
@Composable
fun TvDisplayScale(isTv: Boolean, uiScale: UiScale, content: @Composable () -> Unit) {
    if (!isTv) {
        content()
        return
    }
    val configuration = LocalConfiguration.current
    val system = LocalDensity.current
    val grid = remember(configuration.screenWidthDp, configuration.screenHeightDp, system.density, system.fontScale, uiScale) {
        tvDisplayGrid(
            widthPx = configuration.screenWidthDp * system.density,
            heightPx = configuration.screenHeightDp * system.density,
            systemFontScale = system.fontScale,
            uiScale = uiScale,
        )
    }
    if (grid == null) {
        content()
        return
    }
    val tvConfiguration = remember(configuration, grid) {
        Configuration(configuration).apply {
            screenWidthDp = TV_DESIGN_WIDTH_DP.toInt()
            screenHeightDp = TV_DESIGN_HEIGHT_DP.toInt()
            smallestScreenWidthDp = TV_DESIGN_HEIGHT_DP.toInt()
            densityDpi = (grid.density * 160f).roundToInt()
            fontScale = grid.fontScale
        }
    }
    CompositionLocalProvider(
        LocalDensity provides Density(grid.density, grid.fontScale),
        LocalConfiguration provides tvConfiguration,
        content = content,
    )
}

/** The density and font scale the TV interface is drawn with. */
internal data class TvDisplayGrid(val density: Float, val fontScale: Float)

/**
 * Density that fits the design canvas (widened by [uiScale]) into [widthPx] x [heightPx], and the
 * clamped font scale. Null when the screen size is unknown, so the system values stay in place.
 */
internal fun tvDisplayGrid(widthPx: Float, heightPx: Float, systemFontScale: Float, uiScale: UiScale): TvDisplayGrid? {
    if (widthPx <= 0f || heightPx <= 0f) return null
    val widen = uiScale.canvasFactor()
    val density = minOf(widthPx / (TV_DESIGN_WIDTH_DP * widen), heightPx / (TV_DESIGN_HEIGHT_DP * widen))
    if (!density.isFinite() || density <= 0f) return null
    val fontScale = if (systemFontScale.isFinite()) systemFontScale.coerceIn(TV_MIN_FONT_SCALE, TV_MAX_FONT_SCALE) else 1f
    return TvDisplayGrid(density, fontScale)
}

/** How much wider than 960x540dp the grid is: 1.0 draws the design 1:1, wider draws it smaller. */
internal fun UiScale.canvasFactor(): Float = when (this) {
    UiScale.COMPACT -> 1.25f
    UiScale.STANDARD -> 1.12f
    UiScale.LARGE -> 1.0f
}

private const val TV_DESIGN_WIDTH_DP = 960f
private const val TV_DESIGN_HEIGHT_DP = 540f
internal const val TV_MIN_FONT_SCALE = 0.9f
internal const val TV_MAX_FONT_SCALE = 1.1f
