package com.mo.moplayer.ui.common

import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import com.mo.moplayer.R

/**
 * Gesture indicator view that shows visual feedback for player gestures.
 * Displays brightness/volume/seek indicators with smooth animations.
 */
class GestureIndicatorView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val container: View
    private val iconView: ImageView
    private val progressBar: ProgressBar
    private val valueText: TextView
    
    private var hideRunnable: Runnable? = null
    private val hideDelay = 500L
    
    enum class IndicatorType {
        BRIGHTNESS, VOLUME, SEEK
    }
    
    init {
        container = LayoutInflater.from(context).inflate(
            R.layout.view_gesture_indicator, this, false
        )
        addView(container)
        
        iconView = container.findViewById(R.id.iv_indicator_icon)
        progressBar = container.findViewById(R.id.progress_indicator)
        valueText = container.findViewById(R.id.tv_indicator_value)
        
        visibility = GONE
        alpha = 0f
    }
    
    /**
     * Show brightness indicator
     */
    fun showBrightness(percentage: Int) {
        val icon = when {
            percentage > 70 -> R.drawable.ic_brightness_high
            percentage > 30 -> R.drawable.ic_brightness_medium
            else -> R.drawable.ic_brightness_low
        }
        show(IndicatorType.BRIGHTNESS, icon, percentage, "$percentage%")
    }
    
    /**
     * Show volume indicator
     */
    fun showVolume(percentage: Int) {
        val icon = when {
            percentage == 0 -> R.drawable.ic_volume_off
            percentage < 30 -> R.drawable.ic_volume_low
            percentage < 70 -> R.drawable.ic_volume_medium
            else -> R.drawable.ic_volume_high
        }
        show(IndicatorType.VOLUME, icon, percentage, "$percentage%")
    }
    
    /**
     * Show seek indicator
     */
    fun showSeek(seconds: Long, forward: Boolean) {
        progressBar.visibility = GONE
        val icon = if (forward) R.drawable.ic_forward_10 else R.drawable.ic_replay_10
        val text = if (forward) "+${seconds}s" else "${seconds}s"
        
        iconView.setImageResource(icon)
        valueText.text = text
        
        showWithAnimation()
    }
    
    private fun show(type: IndicatorType, iconRes: Int, progress: Int, text: String) {
        iconView.setImageResource(iconRes)
        progressBar.visibility = VISIBLE
        progressBar.progress = progress
        valueText.text = text
        
        showWithAnimation()
    }
    
    private fun showWithAnimation() {
        // Cancel any pending hide
        hideRunnable?.let { removeCallbacks(it) }
        
        visibility = VISIBLE
        animate()
            .alpha(1f)
            .setDuration(150)
            .start()
    }
    
    /**
     * Hide the indicator with animation
     */
    fun hide() {
        hideRunnable?.let { removeCallbacks(it) }
        hideRunnable = Runnable {
            animate()
                .alpha(0f)
                .setDuration(200)
                .withEndAction {
                    visibility = GONE
                }
                .start()
        }
        postDelayed(hideRunnable!!, hideDelay)
    }
    
    /**
     * Immediately hide without delay
     */
    fun hideImmediately() {
        hideRunnable?.let { removeCallbacks(it) }
        animate()
            .alpha(0f)
            .setDuration(150)
            .withEndAction { visibility = GONE }
            .start()
    }
}
