package com.mo.moplayer.ui.common.focus

import android.view.View
import androidx.core.view.ViewCompat
import com.mo.moplayer.ui.common.design.LiquidGlassTokens
import com.mo.moplayer.util.DevicePerformance

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
        val lowEnd = DevicePerformance.isLow(target.context)
        val scale = if (hasFocus) {
            if (lowEnd) 1.025f else LiquidGlassTokens.BUTTON_FOCUS_SCALE
        } else 1f
        val duration = if (lowEnd) 90L else if (hasFocus) {
            LiquidGlassTokens.FOCUS_IN_DURATION_MS
        } else {
            LiquidGlassTokens.FOCUS_OUT_DURATION_MS
        }

        target.animate().cancel()
        target.animate()
            .scaleX(scale)
            .scaleY(scale)
            .setDuration(duration)
            .setInterpolator(LiquidGlassTokens.SPRING_INTERPOLATOR)
            .start()
    }

    fun animateDockFocus(target: View, hasFocus: Boolean) {
        val lowEnd = DevicePerformance.isLow(target.context)
        val scale = if (hasFocus) {
            if (lowEnd) 1.025f else LiquidGlassTokens.DOCK_FOCUS_SCALE
        } else 1f
        val ty = if (hasFocus && !lowEnd) -3f else 0f
        val duration = if (lowEnd) 90L else if (hasFocus) {
            LiquidGlassTokens.FOCUS_IN_DURATION_MS
        } else {
            LiquidGlassTokens.FOCUS_OUT_DURATION_MS
        }

        target.animate().cancel()
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
        val lowEnd = DevicePerformance.isLow(target.context)
        val scale = if (hasFocus) {
            if (lowEnd) 1.025f else LiquidGlassTokens.FOCUS_SCALE
        } else 1f
        val ty = if (hasFocus && !lowEnd) translationYFocused else 0f
        val duration = if (lowEnd) 90L else if (hasFocus) {
            LiquidGlassTokens.FOCUS_IN_DURATION_MS
        } else {
            LiquidGlassTokens.FOCUS_OUT_DURATION_MS
        }
        val interpolator = if (hasFocus) LiquidGlassTokens.SPRING_INTERPOLATOR else LiquidGlassTokens.FOCUS_INTERPOLATOR

        // A single ViewPropertyAnimator replaces three ObjectAnimators and prevents
        // queued focus animations during rapid D-pad navigation.
        target.animate().cancel()
        target.animate()
            .scaleX(scale)
            .scaleY(scale)
            .translationY(ty)
            .setDuration(duration)
            .setInterpolator(interpolator)
            .start()

        val resolvedElevation = if (lowEnd) {
            0f
        } else if (hasFocus) {
            focusedElevation
        } else {
            restingElevation
        }
        ViewCompat.setElevation(target, resolvedElevation)

        val glowDuration = if (lowEnd) 80L else if (hasFocus) 160L else 200L
        focusGlow?.animate()?.cancel()
        focusGlow?.animate()
            ?.alpha(
                if (hasFocus) {
                    if (lowEnd) 0.55f else LiquidGlassTokens.GLOW_ALPHA_FOCUSED
                } else LiquidGlassTokens.GLOW_ALPHA_REST
            )
            ?.setDuration(glowDuration)
            ?.start()
        focusRing?.animate()?.cancel()
        focusRing?.animate()
            ?.alpha(if (hasFocus) LiquidGlassTokens.GLOW_ALPHA_FOCUSED else LiquidGlassTokens.GLOW_ALPHA_REST)
            ?.setDuration(glowDuration)
            ?.start()
    }
}
