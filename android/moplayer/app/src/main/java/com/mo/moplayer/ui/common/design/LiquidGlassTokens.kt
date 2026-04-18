package com.mo.moplayer.ui.common.design

import android.view.animation.Interpolator
import android.view.animation.PathInterpolator

object LiquidGlassTokens {
    const val FOCUS_SCALE = 1.08f
    const val BUTTON_FOCUS_SCALE = 1.04f
    const val DOCK_FOCUS_SCALE = 1.06f
    const val FOCUS_IN_DURATION_MS = 220L
    const val FOCUS_OUT_DURATION_MS = 200L
    const val ENTER_EXIT_DURATION_MS = 280L
    const val TRANSLATION_Y_FOCUSED = -6f
    const val FOCUS_ELEVATION_REST = 4f
    const val FOCUS_ELEVATION_FOCUSED = 18f
    const val GLOW_ALPHA_FOCUSED = 1f
    const val GLOW_ALPHA_REST = 0f

    val FOCUS_INTERPOLATOR: Interpolator = PathInterpolator(0.22f, 1f, 0.36f, 1f)
    val SPRING_INTERPOLATOR: Interpolator = PathInterpolator(0.175f, 0.885f, 0.32f, 1.1f)
}
