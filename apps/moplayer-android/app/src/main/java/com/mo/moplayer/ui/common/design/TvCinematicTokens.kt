package com.mo.moplayer.ui.common.design

import android.view.animation.DecelerateInterpolator
import android.view.animation.Interpolator

object TvCinematicTokens {
    // Kept in lock-step with LiquidGlassTokens so the Movies/Series grids get the same bold,
    // unmistakable D-pad focus as the Home rows.
    const val FOCUS_SCALE = LiquidGlassTokens.FOCUS_SCALE
    const val FOCUS_IN_DURATION_MS = LiquidGlassTokens.FOCUS_IN_DURATION_MS
    const val FOCUS_OUT_DURATION_MS = LiquidGlassTokens.FOCUS_OUT_DURATION_MS
    const val ENTER_EXIT_DURATION_MS = LiquidGlassTokens.ENTER_EXIT_DURATION_MS
    const val CARD_ELEVATION_REST = LiquidGlassTokens.FOCUS_ELEVATION_REST
    const val CARD_ELEVATION_FOCUSED = LiquidGlassTokens.FOCUS_ELEVATION_FOCUSED
    const val CARD_TRANSLATION_Y_FOCUSED = LiquidGlassTokens.TRANSLATION_Y_FOCUSED
    const val DOCK_SCALE = LiquidGlassTokens.DOCK_FOCUS_SCALE
    const val BUTTON_SCALE = LiquidGlassTokens.BUTTON_FOCUS_SCALE

    val FOCUS_INTERPOLATOR: Interpolator = LiquidGlassTokens.FOCUS_INTERPOLATOR
    val EXIT_INTERPOLATOR: Interpolator = DecelerateInterpolator()
    val SPRING_INTERPOLATOR: Interpolator = LiquidGlassTokens.SPRING_INTERPOLATOR
}
