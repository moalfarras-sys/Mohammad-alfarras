package com.mo.moplayer.ui.common.design

import android.view.animation.DecelerateInterpolator
import android.view.animation.Interpolator
import android.view.animation.PathInterpolator

object TvCinematicTokens {
    // Kept in lock-step with LiquidGlassTokens so the Movies/Series grids get the same bold,
    // unmistakable D-pad focus as the Home rows.
    const val FOCUS_SCALE = 1.12f
    const val FOCUS_IN_DURATION_MS = 200L
    const val FOCUS_OUT_DURATION_MS = 180L
    const val ENTER_EXIT_DURATION_MS = 280L
    const val CARD_ELEVATION_REST = 3f
    const val CARD_ELEVATION_FOCUSED = 22f
    const val CARD_TRANSLATION_Y_FOCUSED = -8f
    const val DOCK_SCALE = 1.14f
    const val BUTTON_SCALE = 1.06f

    val FOCUS_INTERPOLATOR: Interpolator = PathInterpolator(0.22f, 1f, 0.36f, 1f)
    val EXIT_INTERPOLATOR: Interpolator = DecelerateInterpolator()
    val SPRING_INTERPOLATOR: Interpolator = PathInterpolator(0.175f, 0.885f, 0.32f, 1.1f)
}
