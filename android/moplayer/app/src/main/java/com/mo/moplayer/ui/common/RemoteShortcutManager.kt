package com.mo.moplayer.ui.common

import android.view.KeyEvent

/**
 * Unifies TV remote shortcuts on content cards:
 * - Short OK press: open/play
 * - Triple OK press: toggle favorite
 * - 3s long OK press: open context menu
 */
class RemoteShortcutManager(
    onShortOk: (() -> Unit)? = null,
    onTripleOk: (() -> Unit)? = null,
    onLongOk: (() -> Unit)? = null,
    longPressThresholdMs: Long = 3000L,
    tripleTapThresholdMs: Long = 550L
) {
    private val tripleTapDetector = TripleTapDetector(
        onTripleTap = { onTripleOk?.invoke() },
        timeThresholdMs = tripleTapThresholdMs
    )

    private val longPressDetector = LongPressDetector(
        onLongPress = { onLongOk?.invoke() },
        onShortPress = {
            onShortOk?.invoke()
            tripleTapDetector.onTap()
        },
        longPressThreshold = longPressThresholdMs
    )

    fun onKeyEvent(keyCode: Int, event: KeyEvent): Boolean {
        if (keyCode != KeyEvent.KEYCODE_DPAD_CENTER && keyCode != KeyEvent.KEYCODE_ENTER) {
            return false
        }
        return when (event.action) {
            KeyEvent.ACTION_DOWN -> {
                longPressDetector.onKeyDown(keyCode)
                true
            }
            KeyEvent.ACTION_UP -> {
                longPressDetector.onKeyUp(keyCode)
            }
            else -> false
        }
    }

    fun reset() {
        longPressDetector.reset()
        tripleTapDetector.reset()
    }
}
