package com.mo.moplayer.ui.player

import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.widget.FrameLayout
import android.widget.TextView
import com.mo.moplayer.R
import com.google.android.material.button.MaterialButton

/**
 * Speed control component for the video player.
 * Supports speeds: 0.25x, 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x
 */
class SpeedControlView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {
    
    interface SpeedChangeListener {
        fun onSpeedChanged(speed: Float)
    }
    
    private var listener: SpeedChangeListener? = null
    private var currentSpeedIndex = 3 // Default 1x
    
    private val speeds = floatArrayOf(0.25f, 0.5f, 0.75f, 1f, 1.25f, 1.5f, 1.75f, 2f)
    private val speedLabels = arrayOf("0.25x", "0.5x", "0.75x", "1x", "1.25x", "1.5x", "1.75x", "2x")
    
    private val speedTextView: TextView
    private val btnDecrease: MaterialButton
    private val btnIncrease: MaterialButton
    
    init {
        LayoutInflater.from(context).inflate(R.layout.view_speed_control, this, true)
        
        speedTextView = findViewById(R.id.tv_speed)
        btnDecrease = findViewById(R.id.btn_decrease_speed)
        btnIncrease = findViewById(R.id.btn_increase_speed)
        
        updateSpeedDisplay()
        
        btnDecrease.setOnClickListener {
            decreaseSpeed()
        }
        
        btnIncrease.setOnClickListener {
            increaseSpeed()
        }
        
        // Long press for reset to 1x
        speedTextView.setOnLongClickListener {
            resetSpeed()
            true
        }
    }
    
    fun setSpeedChangeListener(listener: SpeedChangeListener) {
        this.listener = listener
    }
    
    fun getCurrentSpeed(): Float = speeds[currentSpeedIndex]
    
    fun setSpeed(speed: Float) {
        val index = speeds.indexOfFirst { it == speed }
        if (index >= 0) {
            currentSpeedIndex = index
            updateSpeedDisplay()
            listener?.onSpeedChanged(speed)
        }
    }
    
    private fun increaseSpeed() {
        if (currentSpeedIndex < speeds.size - 1) {
            currentSpeedIndex++
            updateSpeedDisplay()
            listener?.onSpeedChanged(speeds[currentSpeedIndex])
            animateButton(btnIncrease)
        }
    }
    
    private fun decreaseSpeed() {
        if (currentSpeedIndex > 0) {
            currentSpeedIndex--
            updateSpeedDisplay()
            listener?.onSpeedChanged(speeds[currentSpeedIndex])
            animateButton(btnDecrease)
        }
    }
    
    private fun resetSpeed() {
        currentSpeedIndex = 3 // 1x
        updateSpeedDisplay()
        listener?.onSpeedChanged(speeds[currentSpeedIndex])
        
        // Animate the speed text
        speedTextView.animate()
            .scaleX(1.2f)
            .scaleY(1.2f)
            .setDuration(100)
            .withEndAction {
                speedTextView.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(100)
                    .start()
            }
            .start()
    }
    
    private fun updateSpeedDisplay() {
        speedTextView.text = speedLabels[currentSpeedIndex]
        
        // Update button enabled states
        btnDecrease.isEnabled = currentSpeedIndex > 0
        btnIncrease.isEnabled = currentSpeedIndex < speeds.size - 1
        
        // Update button alpha for visual feedback
        btnDecrease.alpha = if (btnDecrease.isEnabled) 1f else 0.4f
        btnIncrease.alpha = if (btnIncrease.isEnabled) 1f else 0.4f
    }
    
    private fun animateButton(button: MaterialButton) {
        button.animate()
            .scaleX(0.9f)
            .scaleY(0.9f)
            .setDuration(50)
            .withEndAction {
                button.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(50)
                    .start()
            }
            .start()
    }
    
    /**
     * Cycle through speeds (for keyboard/remote control)
     */
    fun cycleSpeed() {
        currentSpeedIndex = (currentSpeedIndex + 1) % speeds.size
        updateSpeedDisplay()
        listener?.onSpeedChanged(speeds[currentSpeedIndex])
    }
}
