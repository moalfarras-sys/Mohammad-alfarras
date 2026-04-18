package com.mo.moplayer.ui.common

import android.animation.ObjectAnimator
import android.app.Activity
import android.app.Dialog
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.view.LayoutInflater
import android.view.Window
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.Toast
import com.mo.moplayer.R
import com.mo.moplayer.databinding.DialogExitBinding

/**
 * Handles double-back-press exit confirmation with animated dialog
 */
class ExitHelper(private val activity: Activity) {
    
    private var lastBackPressTime = 0L
    private val backPressThreshold = 2000L // 2 seconds
    private var dialog: Dialog? = null
    private var glowAnimator: ObjectAnimator? = null
    
    /**
     * Call this from onBackPressed or onKeyDown
     * @return true if back press was handled, false to continue with default behavior
     */
    fun onBackPressed(): Boolean {
        val currentTime = System.currentTimeMillis()
        
        if (currentTime - lastBackPressTime < backPressThreshold) {
            // Second back press within threshold - show exit dialog (requires explicit confirmation)
            showExitDialog()
            return true
        }

        // First back press: show hint toast and consume the event
        lastBackPressTime = currentTime
        Toast.makeText(activity, activity.getString(R.string.press_back_again_to_exit), Toast.LENGTH_SHORT).show()
        return true
    }
    
    fun showExitDialog() {
        if (dialog?.isShowing == true) return
        
        dialog = Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
        dialog?.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog?.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        dialog?.setCancelable(true)
        dialog?.setOnDismissListener {
            glowAnimator?.cancel()
            glowAnimator = null
            dialog = null
            reset()
        }
        
        val binding = DialogExitBinding.inflate(LayoutInflater.from(activity))
        dialog?.setContentView(binding.root)
        
        // Animate logo entrance
        binding.ivLogo.scaleX = 0f
        binding.ivLogo.scaleY = 0f
        binding.logoGlow.alpha = 0f
        
        binding.ivLogo.animate()
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(400)
            .setInterpolator(OvershootInterpolator())
            .start()
        
        binding.logoGlow.animate()
            .alpha(0.6f)
            .setDuration(500)
            .setStartDelay(200)
            .start()
        
        // Glow pulse animation
        glowAnimator = ObjectAnimator.ofFloat(binding.logoGlow, "alpha", 0.4f, 0.8f).apply {
            duration = 1500
            repeatCount = ObjectAnimator.INFINITE
            repeatMode = ObjectAnimator.REVERSE
            interpolator = AccelerateDecelerateInterpolator()
            startDelay = 600
            start()
        }
        
        binding.btnStay.setOnClickListener {
            animateClose(binding) {
                dialog?.dismiss()
            }
        }
        
        binding.btnExit.setOnClickListener {
            animateClose(binding) {
                dialog?.dismiss()
                activity.finishAffinity()
            }
        }
        
        // Focus on Stay button by default
        binding.btnStay.requestFocus()
        
        dialog?.show()
    }
    
    private fun animateClose(binding: DialogExitBinding, onComplete: () -> Unit) {
        glowAnimator?.cancel()
        glowAnimator = null
        binding.ivLogo.animate()
            .scaleX(0.8f)
            .scaleY(0.8f)
            .alpha(0f)
            .setDuration(150)
            .withEndAction { onComplete() }
            .start()
    }
    
    fun dismissDialog() {
        glowAnimator?.cancel()
        glowAnimator = null
        dialog?.dismiss()
        dialog = null
    }
    
    fun reset() {
        lastBackPressTime = 0L
    }
}
