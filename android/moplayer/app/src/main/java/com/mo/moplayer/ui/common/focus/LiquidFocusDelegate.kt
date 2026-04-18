package com.mo.moplayer.ui.common.focus

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.view.View
import androidx.core.view.ViewCompat
import com.mo.moplayer.ui.common.design.LiquidGlassTokens

object LiquidFocusDelegate {

    fun applyCardFocus(
        target: View,
        focusGlow: View? = null,
        focusRing: View? = null,
        focusedElevation: Float = LiquidGlassTokens.FOCUS_ELEVATION_FOCUSED,
        restingElevation: Float = LiquidGlassTokens.FOCUS_ELEVATION_REST
    ) {
        target.setOnFocusChangeListener { _, hasFocus ->
            animateCardFocus(target, hasFocus, focusGlow, focusRing, focusedElevation, restingElevation)
        }
    }

    fun animateButtonFocus(target: View, hasFocus: Boolean) {
        val scale = if (hasFocus) LiquidGlassTokens.BUTTON_FOCUS_SCALE else 1f
        val duration = if (hasFocus) LiquidGlassTokens.FOCUS_IN_DURATION_MS else LiquidGlassTokens.FOCUS_OUT_DURATION_MS

        target.animate()
            .scaleX(scale)
            .scaleY(scale)
            .setDuration(duration)
            .setInterpolator(LiquidGlassTokens.SPRING_INTERPOLATOR)
            .start()
    }

    fun animateDockFocus(target: View, hasFocus: Boolean) {
        val scale = if (hasFocus) LiquidGlassTokens.DOCK_FOCUS_SCALE else 1f
        val ty = if (hasFocus) -3f else 0f
        val duration = if (hasFocus) LiquidGlassTokens.FOCUS_IN_DURATION_MS else LiquidGlassTokens.FOCUS_OUT_DURATION_MS

        target.animate()
            .scaleX(scale)
            .scaleY(scale)
            .translationY(ty)
            .setDuration(duration)
            .setInterpolator(LiquidGlassTokens.SPRING_INTERPOLATOR)
            .start()
    }

    fun animateCardFocus(
        target: View,
        hasFocus: Boolean,
        focusGlow: View? = null,
        focusRing: View? = null,
        focusedElevation: Float = LiquidGlassTokens.FOCUS_ELEVATION_FOCUSED,
        restingElevation: Float = LiquidGlassTokens.FOCUS_ELEVATION_REST,
        translationYFocused: Float = LiquidGlassTokens.TRANSLATION_Y_FOCUSED
    ) {
        val scale = if (hasFocus) LiquidGlassTokens.FOCUS_SCALE else 1f
        val ty = if (hasFocus) translationYFocused else 0f
        val duration = if (hasFocus) LiquidGlassTokens.FOCUS_IN_DURATION_MS else LiquidGlassTokens.FOCUS_OUT_DURATION_MS
        val interpolator = if (hasFocus) LiquidGlassTokens.SPRING_INTERPOLATOR else LiquidGlassTokens.FOCUS_INTERPOLATOR

        val animSet = AnimatorSet()
        animSet.playTogether(
            ObjectAnimator.ofFloat(target, View.SCALE_X, scale),
            ObjectAnimator.ofFloat(target, View.SCALE_Y, scale),
            ObjectAnimator.ofFloat(target, View.TRANSLATION_Y, ty)
        )
        animSet.duration = duration
        animSet.interpolator = interpolator
        animSet.start()

        ViewCompat.setElevation(target, if (hasFocus) focusedElevation else restingElevation)

        val glowDuration = if (hasFocus) 160L else 200L
        focusGlow?.animate()
            ?.alpha(if (hasFocus) LiquidGlassTokens.GLOW_ALPHA_FOCUSED else LiquidGlassTokens.GLOW_ALPHA_REST)
            ?.setDuration(glowDuration)
            ?.start()
        focusRing?.animate()
            ?.alpha(if (hasFocus) LiquidGlassTokens.GLOW_ALPHA_FOCUSED else LiquidGlassTokens.GLOW_ALPHA_REST)
            ?.setDuration(glowDuration)
            ?.start()
    }
}
