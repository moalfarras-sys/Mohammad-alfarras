package com.mo.moplayer.ui.common.design

import android.view.animation.Interpolator
import android.view.animation.PathInterpolator

object LiquidGlassTokens {
    // Bolder, unmistakable D-pad focus for 10ft TV viewing. The lift + brighter ring/glow
    // (see FocusStyleHelper) make the focused card clearly "pop" off the grid. Weak devices
    // are capped to a gentle scale with no elevation in LiquidFocusDelegate.
    const val FOCUS_SCALE = 1.12f
    const val BUTTON_FOCUS_SCALE = 1.06f
    const val DOCK_FOCUS_SCALE = 1.14f
    const val FOCUS_IN_DURATION_MS = 200L
    const val FOCUS_OUT_DURATION_MS = 180L
    const val ENTER_EXIT_DURATION_MS = 280L
    const val TRANSLATION_Y_FOCUSED = -8f
    const val FOCUS_ELEVATION_REST = 3f
    const val FOCUS_ELEVATION_FOCUSED = 22f
    const val GLOW_ALPHA_FOCUSED = 1f
    const val GLOW_ALPHA_REST = 0f

    val FOCUS_INTERPOLATOR: Interpolator = PathInterpolator(0.22f, 1f, 0.36f, 1f)
    val SPRING_INTERPOLATOR: Interpolator = PathInterpolator(0.175f, 0.885f, 0.32f, 1.1f)
}
