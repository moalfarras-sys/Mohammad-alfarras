package com.mo.moplayer.ui.common.animations

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator

/**
 * Premium Animation Library for MoPlayer
 * Pre-configured animations for consistent UX across the app
 */
object PremiumAnimations {

    // === FOCUS ANIMATIONS ===

    /**
     * Standard focus animation - Scale up + Elevation
     * Used for all focusable cards and buttons
     */
    fun focusIn(view: View, duration: Long = 200): AnimatorSet {
        return AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(view, "scaleX", 1.08f),
                ObjectAnimator.ofFloat(view, "scaleY", 1.08f),
                ObjectAnimator.ofFloat(view, "translationZ", 16f)
            )
            setDuration(duration)
            interpolator = DecelerateInterpolator()
        }
    }

    /**
     * Standard focus out animation  
     */
    fun focusOut(view: View, duration: Long = 150): AnimatorSet {
        return AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(view, "scaleX", 1f),
                ObjectAnimator.ofFloat(view, "scaleY", 1f),
                ObjectAnimator.ofFloat(view, "translationZ", 0f)
            )
            setDuration(duration)
            interpolator = AccelerateInterpolator()
        }
    }

    // === CLICK ANIMATIONS ===

    /**
     * Button press animation - Quick scale down and bounce back
     */
    fun buttonPress(view: View, onComplete: (() -> Unit)? = null) {
        val scaleDown = AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(view, "scaleX", 0.95f),
                ObjectAnimator.ofFloat(view, "scaleY", 0.95f)
            )
            duration = 100
        }

        val scaleUp = AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(view, "scaleX", 1f),
                ObjectAnimator.ofFloat(view, "scaleY", 1f)
            )
            duration = 100
            interpolator = OvershootInterpolator(2f)
        }

        AnimatorSet().apply {
            playSequentially(scaleDown, scaleUp)
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    onComplete?.invoke()
                }
            })
            start()
        }
    }

    // === ENTRY ANIMATIONS ===

    /**
     * Fade in from transparent
     */
    fun fadeIn(view: View, duration: Long = 300, delay: Long = 0): ObjectAnimator {
        view.alpha = 0f
        return ObjectAnimator.ofFloat(view, "alpha", 1f).apply {
            setDuration(duration)
            startDelay = delay
            interpolator = DecelerateInterpolator()
        }
    }

    /**
     * Slide in from right (for cards entering screen)
     */
    fun slideInFromRight(view: View, duration: Long = 400, delay: Long = 0): AnimatorSet {
        view.translationX = 100f
        view.alpha = 0f

        return AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(view, "translationX", 0f),
                ObjectAnimator.ofFloat(view, "alpha", 1f)
            )
            setDuration(duration)
            startDelay = delay
            interpolator = DecelerateInterpolator()
        }
    }

    /**
     * Slide in from bottom (for panels and overlays)
     */
    fun slideInFromBottom(view: View, duration: Long = 400): AnimatorSet {
        view.translationY = 100f
        view.alpha = 0f

        return AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(view, "translationY", 0f),
                ObjectAnimator.ofFloat(view, "alpha", 1f)
            )
            setDuration(duration)
            interpolator = DecelerateInterpolator()
        }
    }

    /**
     * Scale in (pop effect for badges and notifications)
     */
    fun scaleIn(view: View, duration: Long = 300): AnimatorSet {
        view.scaleX = 0f
        view.scaleY = 0f
        view.alpha = 0f

        return AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(view, "scaleX", 1f),
                ObjectAnimator.ofFloat(view, "scaleY", 1f),
                ObjectAnimator.ofFloat(view, "alpha", 1f)
            )
            setDuration(duration)
            interpolator = OvershootInterpolator(1.5f)
        }
    }

    // === EXIT ANIMATIONS ===

    /**
     * Fade out to transparent
     */
    fun fadeOut(view: View, duration: Long = 200, onComplete: (() -> Unit)? = null): ObjectAnimator {
        return ObjectAnimator.ofFloat(view, "alpha", 0f).apply {
            setDuration(duration)
            interpolator = AccelerateInterpolator()
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    onComplete?.invoke()
                }
            })
        }
    }

    /**
     * Slide out to right
     */
    fun slideOutToRight(view: View, duration: Long = 300, onComplete: (() -> Unit)? = null): AnimatorSet {
        return AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(view, "translationX", 100f),
                ObjectAnimator.ofFloat(view, "alpha", 0f)
            )
            setDuration(duration)
            interpolator = AccelerateInterpolator()
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    onComplete?.invoke()
                }
            })
        }
    }

    // === LOADING ANIMATIONS ===

    /**
     * Pulse animation for loading indicators
     */
    fun pulse(view: View, duration: Long = 1000): ObjectAnimator {
        return ObjectAnimator.ofFloat(view, "alpha", 1f, 0.3f, 1f).apply {
            setDuration(duration)
            repeatCount = ValueAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
        }
    }

    /**
     * Rotate animation for loading spinners
     */
    fun rotate(view: View, duration: Long = 1000): ObjectAnimator {
        return ObjectAnimator.ofFloat(view, "rotation", 0f, 360f).apply {
            setDuration(duration)
            repeatCount = ValueAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
        }
    }

    /**
     * Shimmer effect for skeleton loading
     * Animates a gradient sweep across a view
     */
    fun shimmer(view: View, duration: Long = 1500): ObjectAnimator {
        return ObjectAnimator.ofFloat(view, "translationX", -view.width.toFloat(), view.width.toFloat()).apply {
            setDuration(duration)
            repeatCount = ValueAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
        }
    }

    // === SPECIAL EFFECTS ===

    /**
     * Bounce effect (for emphasized actions)
     */
    fun bounce(view: View): AnimatorSet {
        val bounceUp = ObjectAnimator.ofFloat(view, "translationY", 0f, -20f).apply {
            duration = 150
            interpolator = AccelerateInterpolator()
        }
        
        val bounceDown = ObjectAnimator.ofFloat(view, "translationY", -20f, 0f).apply {
            duration = 150
            interpolator = OvershootInterpolator(2f)
        }

        return AnimatorSet().apply {
            playSequentially(bounceUp, bounceDown)
        }
    }

    /**
     * Shake effect (for errors)
     */
    fun shake(view: View, intensity: Float = 10f): ObjectAnimator {
        return ObjectAnimator.ofFloat(
            view,
            "translationX",
            0f, intensity, -intensity, intensity, -intensity, 0f
        ).apply {
            duration = 500
            interpolator = AccelerateDecelerateInterpolator()
        }
    }

    /**
     * Glow effect (pulsing scale for highlighted items)
     */
    fun glow(view: View): AnimatorSet {
        val scaleX = ObjectAnimator.ofFloat(view, "scaleX", 1f, 1.05f, 1f).apply { repeatCount = ValueAnimator.INFINITE }
        val scaleY = ObjectAnimator.ofFloat(view, "scaleY", 1f, 1.05f, 1f).apply { repeatCount = ValueAnimator.INFINITE }
        val alpha = ObjectAnimator.ofFloat(view, "alpha", 1f, 0.8f, 1f).apply { repeatCount = ValueAnimator.INFINITE }
        return AnimatorSet().apply {
            playTogether(scaleX, scaleY, alpha)
            duration = 1000
            interpolator = AccelerateDecelerateInterpolator()
        }
    }

    // === CONTENT REVEAL ===

    /**
     * Staggered reveal for lists (each item animates in sequence)
     */
    fun staggeredReveal(
        views: List<View>,
        staggerDelay: Long = 50,
        itemDuration: Long = 300
    ) {
        views.forEachIndexed { index, view ->
            slideInFromRight(view, itemDuration, index * staggerDelay).start()
        }
    }

    /**
     * Crossfade between two views
     */
    fun crossfade(fadeOutView: View, fadeInView: View, duration: Long = 300) {
        fadeInView.alpha = 0f
        fadeInView.visibility = View.VISIBLE

        AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(fadeOutView, "alpha", 0f),
                ObjectAnimator.ofFloat(fadeInView, "alpha", 1f)
            )
            setDuration(duration)
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    fadeOutView.visibility = View.GONE
                }
            })
            start()
        }
    }

    // === VIEW STATE MANAGEMENT ===

    /**
     * Show view with animation
     */
    fun show(view: View, animationType: ShowAnimation = ShowAnimation.FADE) {
        when (animationType) {
            ShowAnimation.FADE -> fadeIn(view).start()
            ShowAnimation.SLIDE_UP -> slideInFromBottom(view).start()
            ShowAnimation.SLIDE_RIGHT -> slideInFromRight(view).start()
            ShowAnimation.SCALE -> scaleIn(view).start()
        }
        view.visibility = View.VISIBLE
    }

    /**
     * Hide view with animation
     */
    fun hide(view: View, animationType: HideAnimation = HideAnimation.FADE) {
        when (animationType) {
            HideAnimation.FADE -> fadeOut(view) {
                view.visibility = View.GONE
            }.start()
            HideAnimation.SLIDE_RIGHT -> slideOutToRight(view) {
                view.visibility = View.GONE
            }.start()
        }
    }

    enum class ShowAnimation {
        FADE, SLIDE_UP, SLIDE_RIGHT, SCALE
    }

    enum class HideAnimation {
        FADE, SLIDE_RIGHT
    }
}
