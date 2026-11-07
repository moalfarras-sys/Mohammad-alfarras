package com.mo.moplayer

import android.os.SystemClock
import android.view.InputDevice
import android.view.KeyCharacterMap
import android.view.KeyEvent
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertTrue

/** Inject through the real system dispatcher and wait for window/input transactions. */
internal object ClassicRemoteInput {
    fun press(code: Int) {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val automation = instrumentation.uiAutomation
        val downTime = SystemClock.uptimeMillis()
        fun event(action: Int) = KeyEvent(downTime, SystemClock.uptimeMillis(), action, code, 0, 0,
            KeyCharacterMap.VIRTUAL_KEYBOARD, 0, KeyEvent.FLAG_FROM_SYSTEM, InputDevice.SOURCE_DPAD)
        assertTrue("Remote key down was not dispatched", automation.injectInputEvent(event(KeyEvent.ACTION_DOWN), true))
        assertTrue("Remote key up was not dispatched", automation.injectInputEvent(event(KeyEvent.ACTION_UP), true))
        automation.waitForIdle(80, 3_000)
        instrumentation.waitForIdleSync()
    }
}
