package com.mo.moplayer.ui.livetv

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.AttributeSet
import android.view.Gravity
import android.view.KeyEvent
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.mo.moplayer.R

/**
 * Quick channel switch overlay - allows numeric input to jump to channels
 * Similar to how traditional TVs work when you press number keys
 */
class ChannelQuickSwitchOverlay @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {
    
    companion object {
        private const val INPUT_TIMEOUT_MS = 2000L
        private const val MAX_DIGITS = 4
    }
    
    private val numberDisplay: TextView
    private val handler = Handler(Looper.getMainLooper())
    private var currentInput = StringBuilder()
    private var onChannelSelected: ((Int) -> Unit)? = null
    
    private val clearInputRunnable = Runnable {
        executeChannelSwitch()
    }
    
    init {
        // Create the number display
        numberDisplay = TextView(context).apply {
            textSize = 48f
            setTextColor(ContextCompat.getColor(context, R.color.gradient_gold_start))
            gravity = Gravity.CENTER
            setPadding(32, 16, 32, 16)
            setBackgroundResource(R.drawable.bg_glass_panel_premium)
            minWidth = 200
            textAlignment = TextView.TEXT_ALIGNMENT_CENTER
        }
        
        addView(numberDisplay, LayoutParams(
            LayoutParams.WRAP_CONTENT,
            LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.TOP or Gravity.END
            setMargins(0, 80, 80, 0)
        })
        
        visibility = GONE
    }
    
    fun setOnChannelSelectedListener(listener: (Int) -> Unit) {
        onChannelSelected = listener
    }
    
    /**
     * Handle numeric key input
     * Returns true if the key was consumed
     */
    fun handleKeyEvent(keyCode: Int): Boolean {
        val digit = when (keyCode) {
            KeyEvent.KEYCODE_0 -> "0"
            KeyEvent.KEYCODE_1 -> "1"
            KeyEvent.KEYCODE_2 -> "2"
            KeyEvent.KEYCODE_3 -> "3"
            KeyEvent.KEYCODE_4 -> "4"
            KeyEvent.KEYCODE_5 -> "5"
            KeyEvent.KEYCODE_6 -> "6"
            KeyEvent.KEYCODE_7 -> "7"
            KeyEvent.KEYCODE_8 -> "8"
            KeyEvent.KEYCODE_9 -> "9"
            else -> return false
        }
        
        appendDigit(digit)
        return true
    }
    
    private fun appendDigit(digit: String) {
        // Cancel any pending timeout
        handler.removeCallbacks(clearInputRunnable)
        
        // Append digit if under max
        if (currentInput.length < MAX_DIGITS) {
            currentInput.append(digit)
        }
        
        // Update display
        updateDisplay()
        
        // Show overlay
        visibility = VISIBLE
        
        // Set timeout to execute switch
        handler.postDelayed(clearInputRunnable, INPUT_TIMEOUT_MS)
    }
    
    private fun updateDisplay() {
        numberDisplay.text = currentInput.toString()
    }
    
    private fun executeChannelSwitch() {
        if (currentInput.isNotEmpty()) {
            val channelNumber = currentInput.toString().toIntOrNull()
            if (channelNumber != null && channelNumber > 0) {
                onChannelSelected?.invoke(channelNumber)
            }
        }
        
        clear()
    }
    
    fun clear() {
        handler.removeCallbacks(clearInputRunnable)
        currentInput.clear()
        visibility = GONE
    }
    
    /**
     * Force execute the current input immediately
     */
    fun confirmInput() {
        handler.removeCallbacks(clearInputRunnable)
        executeChannelSwitch()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        handler.removeCallbacksAndMessages(null)
    }
}
