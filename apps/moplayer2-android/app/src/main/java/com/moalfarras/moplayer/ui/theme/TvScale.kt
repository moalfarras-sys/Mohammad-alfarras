package com.moalfarras.moplayer.ui.theme

import android.content.res.Configuration
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration
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
)

@Composable
fun rememberTvScale(): TvScale {
    val configuration = LocalConfiguration.current
    val isTv = Adaptive.isTv
    val w = configuration.screenWidthDp
    val h = configuration.screenHeightDp
    val shortest = minOf(w, h)
    val longest = maxOf(w, h)
    val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE

    return remember(w, h, isTv, configuration.orientation) {
        if (isTv) {
            val widthFactor = w / 1920f
            val heightFactor = h / 1080f
            val factor = minOf(widthFactor, heightFactor).coerceIn(0.66f, 1.22f) * 0.85f
            TvScale(
                factor = factor,
                contentPadding = (30 * factor).dp,
                dockPadding = (18 * factor).dp,
                laneSpacing = (12 * factor).dp,
                cardRadius = (12f * factor).coerceAtLeast(10f).dp,
                posterWidth = (136 * factor).dp,
                panelPadding = (18 * factor).dp,
                isTv = true,
                isCompact = false,
                bottomBarHeight = (82 * factor).dp,
                shortestScreenDp = shortest,
                maxOfWidthHeightDp = longest,
                isLandscape = true,
                isLowHeightLandscape = false,
            )
        } else {
            val compact = shortest < 600
            val lowHeightLandscape = isLandscape && shortest < 430
            val factor = (longest / 640f).coerceIn(0.78f, 1.12f)
            val dockH = when {
                lowHeightLandscape -> 136.dp
                compact -> 76.dp
                else -> 88.dp
            }
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
                    lowHeightLandscape -> 76.dp
                    compact -> 100.dp
                    else -> 124.dp
                },
                panelPadding = when {
                    lowHeightLandscape -> 12.dp
                    compact -> 14.dp
                    else -> 18.dp
                },
                isTv = false,
                isCompact = compact,
                bottomBarHeight = dockH,
                shortestScreenDp = shortest,
                maxOfWidthHeightDp = longest,
                isLandscape = isLandscape,
                isLowHeightLandscape = lowHeightLandscape,
            )
        }
    }
}
