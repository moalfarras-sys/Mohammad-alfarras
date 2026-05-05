package com.mo.moplayer.ui.common.focus

import android.view.View
import android.widget.TextView
import androidx.core.view.ViewCompat
import com.mo.moplayer.ui.common.design.TvCinematicTokens

object CinematicFocusEngine {

    fun bindCardFocus(
        root: View,
        glowView: View?,
        borderView: View?,
        isPlayingProvider: (() -> Boolean)? = null
    ) {
        root.setOnFocusChangeListener { _, hasFocus ->
            val isPlaying = isPlayingProvider?.invoke() == true
            val glowTarget = when {
                hasFocus -> 0.9f
                isPlaying -> 0.25f
                else -> 0f
            }
            val borderTarget = if (hasFocus && !isPlaying) 1f else 0f

            root.animate()
                .scaleX(if (hasFocus) TvCinematicTokens.FOCUS_SCALE else 1f)
                .scaleY(if (hasFocus) TvCinematicTokens.FOCUS_SCALE else 1f)
                .translationY(if (hasFocus) TvCinematicTokens.CARD_TRANSLATION_Y_FOCUSED else 0f)
                .setDuration(
                    if (hasFocus) TvCinematicTokens.FOCUS_IN_DURATION_MS else TvCinematicTokens.FOCUS_OUT_DURATION_MS
                )
                .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                .start()

            ViewCompat.setElevation(
                root,
                if (hasFocus) TvCinematicTokens.CARD_ELEVATION_FOCUSED else TvCinematicTokens.CARD_ELEVATION_REST
            )

            glowView?.animate()
                ?.alpha(glowTarget)
                ?.setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
                ?.setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                ?.start()

            borderView?.animate()
                ?.alpha(borderTarget)
                ?.setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
                ?.setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                ?.start()
        }
    }

    fun bindDockFocus(
        view: View,
        iconView: View?,
        labelView: TextView?,
        selectedProvider: () -> Boolean
    ) {
        view.setOnFocusChangeListener { _, hasFocus ->
            val selected = selectedProvider()
            val scale = if (hasFocus || selected) TvCinematicTokens.DOCK_SCALE else 1f
            view.animate()
                .scaleX(scale)
                .scaleY(scale)
                .setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
                .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                .start()

            val alpha = if (selected) 1f else if (hasFocus) 0.95f else 0.8f
            iconView?.alpha = alpha
            labelView?.alpha = alpha
        }
    }

    fun bindButtonFocus(view: View) {
        view.setOnFocusChangeListener { _, hasFocus ->
            view.animate()
                .scaleX(if (hasFocus) TvCinematicTokens.BUTTON_SCALE else 1f)
                .scaleY(if (hasFocus) TvCinematicTokens.BUTTON_SCALE else 1f)
                .setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
                .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                .start()
        }
    }
}
