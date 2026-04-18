package com.mo.moplayer.ui.common

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.app.Dialog
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.view.LayoutInflater
import android.view.Window
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.OvershootInterpolator
import com.mo.moplayer.R
import com.mo.moplayer.databinding.DialogFavoriteBinding

class FavoriteHelper(private val context: Context) {

    fun showFavoriteDialog(
        title: String,
        isFavorite: Boolean,
        onConfirm: () -> Unit,
        onCancel: () -> Unit = {}
    ) {
        val dialog = Dialog(context, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))

        val binding = DialogFavoriteBinding.inflate(LayoutInflater.from(context))
        dialog.setContentView(binding.root)

        // Set content
        binding.tvTitle.text = title
        
        if (isFavorite) {
            binding.tvMessage.text = context.getString(R.string.movie_remove_favorite) + "?"
            binding.btnConfirm.text = context.getString(R.string.movie_remove_favorite)
            binding.ivHeart.setImageResource(R.drawable.ic_favorite_filled)
        } else {
            binding.tvMessage.text = context.getString(R.string.movie_add_favorite) + "?"
            binding.btnConfirm.text = context.getString(R.string.movie_add_favorite)
            binding.ivHeart.setImageResource(R.drawable.ic_favorite_border)
        }

        // Animate heart entrance
        binding.ivHeart.scaleX = 0f
        binding.ivHeart.scaleY = 0f
        binding.heartGlow.alpha = 0f

        val heartScaleX = ObjectAnimator.ofFloat(binding.ivHeart, "scaleX", 0f, 1f).apply {
            duration = 400
            interpolator = OvershootInterpolator()
        }
        val heartScaleY = ObjectAnimator.ofFloat(binding.ivHeart, "scaleY", 0f, 1f).apply {
            duration = 400
            interpolator = OvershootInterpolator()
        }
        val glowFade = ObjectAnimator.ofFloat(binding.heartGlow, "alpha", 0f, 0.6f).apply {
            duration = 500
            startDelay = 200
        }

        AnimatorSet().apply {
            playTogether(heartScaleX, heartScaleY, glowFade)
            start()
        }

        // Glow pulse animation
        ObjectAnimator.ofFloat(binding.heartGlow, "alpha", 0.3f, 0.7f).apply {
            duration = 1500
            repeatCount = ObjectAnimator.INFINITE
            repeatMode = ObjectAnimator.REVERSE
            interpolator = AccelerateDecelerateInterpolator()
            startDelay = 700
            start()
        }

        binding.btnConfirm.setOnClickListener {
            // Animate heart on confirm
            val pulse = AnimatorSet().apply {
                playSequentially(
                    ObjectAnimator.ofFloat(binding.ivHeart, "scaleX", 1f, 1.3f).apply { duration = 100 },
                    ObjectAnimator.ofFloat(binding.ivHeart, "scaleX", 1.3f, 1f).apply { duration = 100 }
                )
            }
            val pulseY = AnimatorSet().apply {
                playSequentially(
                    ObjectAnimator.ofFloat(binding.ivHeart, "scaleY", 1f, 1.3f).apply { duration = 100 },
                    ObjectAnimator.ofFloat(binding.ivHeart, "scaleY", 1.3f, 1f).apply { duration = 100 }
                )
            }

            AnimatorSet().apply {
                playTogether(pulse, pulseY)
                start()
            }

            binding.root.postDelayed({
                onConfirm()
                dialog.dismiss()
            }, 250)
        }

        binding.btnCancel.setOnClickListener {
            onCancel()
            dialog.dismiss()
        }

        // Focus on confirm button
        binding.btnConfirm.requestFocus()

        dialog.show()
    }
}

/**
 * Triple-tap detector for quick favorites toggle
 */
class TripleTapDetector(
    private val onTripleTap: () -> Unit,
    private val timeThresholdMs: Long = 500
) {
    private var tapCount = 0
    private var lastTapTime = 0L

    fun onTap() {
        val currentTime = System.currentTimeMillis()
        
        if (currentTime - lastTapTime > timeThresholdMs) {
            tapCount = 0
        }
        
        tapCount++
        lastTapTime = currentTime

        if (tapCount >= 3) {
            tapCount = 0
            onTripleTap()
        }
    }

    fun reset() {
        tapCount = 0
        lastTapTime = 0L
    }
}
