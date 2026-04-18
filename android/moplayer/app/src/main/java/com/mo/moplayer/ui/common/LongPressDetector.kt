package com.mo.moplayer.ui.common

import android.os.Handler
import android.os.Looper
import android.view.KeyEvent

/**
 * Utility class to detect long press on D-Pad center/enter buttons.
 *
 * Important for TV remotes: we must consume the KEY_UP event when we handle
 * short/long press, otherwise RecyclerView/view may also treat it as click.
 */
class LongPressDetector(
    private val onLongPress: () -> Unit,
    private val onShortPress: (() -> Unit)? = null,
    private val longPressThreshold: Long = 3000L
) {
    private val handler = Handler(Looper.getMainLooper())
    private var isPressed = false
    private var isLongPressFired = false
    private var trackingKeyCode: Int? = null

    private val longPressRunnable = Runnable {
        if (isPressed && !isLongPressFired) {
            isLongPressFired = true
            onLongPress()
        }
    }
    
    /**
     * Call this in onKeyDown
     */
    fun onKeyDown(keyCode: Int): Boolean {
        if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) {
            // Ignore repeats while holding the same key; keep the original timer.
            if (trackingKeyCode == keyCode && isPressed) return false

            resetInternal()
            isPressed = true
            trackingKeyCode = keyCode
            handler.postDelayed(longPressRunnable, longPressThreshold)
        }
        return false
    }
    
    /**
     * Call this in onKeyUp
     */
    fun onKeyUp(keyCode: Int): Boolean {
        val isTracked = trackingKeyCode != null && trackingKeyCode == keyCode
        if (keyCode != KeyEvent.KEYCODE_DPAD_CENTER && keyCode != KeyEvent.KEYCODE_ENTER) return false
        if (!isTracked) return false

        handler.removeCallbacks(longPressRunnable)
        isPressed = false
        trackingKeyCode = null

        return if (isLongPressFired) {
            true // consume KEY_UP to avoid click after long press
        } else {
            onShortPress?.invoke()
            true // consume to avoid double-trigger (click + key)
        }
    }
    
    /**
     * Reset the detector state
     */
    fun reset() {
        handler.removeCallbacks(longPressRunnable)
        resetInternal()
    }

    private fun resetInternal() {
        isPressed = false
        isLongPressFired = false
        trackingKeyCode = null
    }
}
