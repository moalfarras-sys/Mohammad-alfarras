package com.mo.moplayer

import android.content.Intent
import android.os.SystemClock
import android.view.KeyEvent
import android.view.View
import androidx.recyclerview.widget.RecyclerView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mo.moplayer.ui.settings.SettingsActivity
import com.mo.moplayer.util.DisplayScale
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ClassicSettingsNavigationTest {
    @Test fun interfaceControlsAndSidebarFollowThePhysicalLayoutInBothLanguages() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val previousLanguage = DisplayScale.language(context)
        try {
            instrumentation.setInTouchMode(false)
            for (language in listOf("en", "ar")) {
                DisplayScale.setLanguage(context, language)
                ActivityScenario.launch<SettingsActivity>(Intent(context, SettingsActivity::class.java)
                    .putExtra("open_panel", "INTERFACE")).use { scenario ->
                    val deadline = SystemClock.elapsedRealtime() + 10_000
                    var ready = false
                    while (!ready && SystemClock.elapsedRealtime() < deadline) {
                        scenario.onActivity {
                            ready = it.findViewById<RecyclerView>(R.id.rvCategories).childCount == 6 &&
                                it.findViewById<View>(R.id.optionPosterSize).isShown && it.hasWindowFocus()
                        }
                        if (!ready) SystemClock.sleep(50)
                    }
                    assertTrue("Settings did not load: $language", ready)
                    instrumentation.waitForIdleSync()
                    scenario.onActivity { assertTrue(it.findViewById<View>(R.id.colorChipGreen).requestFocus()) }
                    ClassicRemoteInput.press(KeyEvent.KEYCODE_DPAD_UP)
                    scenario.onActivity { assertEquals("Library layout must precede the color strip: $language", R.id.optionLayoutStyle, it.currentFocus?.id) }
                    ClassicRemoteInput.press(KeyEvent.KEYCODE_DPAD_UP)
                    scenario.onActivity { assertEquals(R.id.optionPosterSize, it.currentFocus?.id) }
                    ClassicRemoteInput.press(KeyEvent.KEYCODE_DPAD_DOWN)
                    scenario.onActivity { assertEquals(R.id.optionLayoutStyle, it.currentFocus?.id) }
                    ClassicRemoteInput.press(KeyEvent.KEYCODE_DPAD_DOWN)
                    scenario.onActivity { assertEquals("Library layout must lead to the first color: $language", R.id.colorChipGreen, it.currentFocus?.id) }
                    val intoStrip = if (language == "ar") KeyEvent.KEYCODE_DPAD_LEFT else KeyEvent.KEYCODE_DPAD_RIGHT
                    ClassicRemoteInput.press(intoStrip)
                    scenario.onActivity { assertEquals("Color strip escaped to the sidebar: $language", R.id.colorChipCyan, it.currentFocus?.id) }
                    ClassicRemoteInput.press(if (language == "ar") KeyEvent.KEYCODE_DPAD_RIGHT else KeyEvent.KEYCODE_DPAD_LEFT)
                    scenario.onActivity { assertEquals(R.id.colorChipGreen, it.currentFocus?.id) }
                    ClassicRemoteInput.press(if (language == "ar") KeyEvent.KEYCODE_DPAD_RIGHT else KeyEvent.KEYCODE_DPAD_LEFT)
                    scenario.onActivity { assertTrue("Sidebar unreachable: $language", it.findViewById<RecyclerView>(R.id.rvCategories).hasFocus()) }
                    ClassicRemoteInput.press(intoStrip)
                    scenario.onActivity {
                        assertFalse("Panel unreachable from sidebar: $language", it.findViewById<RecyclerView>(R.id.rvCategories).hasFocus())
                        assertNotNull(it.currentFocus)
                    }
                }
            }
        } finally { DisplayScale.setLanguage(context, previousLanguage) }
    }
}
