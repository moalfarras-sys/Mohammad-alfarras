package com.mo.moplayer

import android.view.View
import android.view.ViewGroup
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.mo.moplayer.data.weather.WeatherService
import com.mo.moplayer.ui.settings.SettingsActivity
import com.mo.moplayer.ui.widgets.weather.FullScreenWeatherOverlay
import org.junit.Assert.assertFalse
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class WeatherOverlayLifecycleTest {
    @Test fun offReducedAndHiddenWeatherCannotRestartItsFrameLoop() {
        ActivityScenario.launch(SettingsActivity::class.java).use { scenario ->
            scenario.onActivity { activity ->
                val root = activity.findViewById<ViewGroup>(android.R.id.content)
                val overlay = FullScreenWeatherOverlay(activity)
                root.addView(overlay, ViewGroup.LayoutParams(240, 135))
                val running = FullScreenWeatherOverlay::class.java.getDeclaredField("animationRunning").apply { isAccessible = true }
                try {
                    overlay.setEffectSettings(WeatherService.EFFECT_QUALITY_OFF, false, false)
                    repeat(3) { overlay.startAnimation() }
                    assertFalse("Quality OFF kept posting frames", running.getBoolean(overlay))
                    overlay.setEffectSettings(WeatherService.EFFECT_QUALITY_LOW, true, false)
                    overlay.startAnimation()
                    assertFalse("Reduced motion kept posting frames", running.getBoolean(overlay))
                    overlay.visibility = View.GONE
                    overlay.setEffectSettings(WeatherService.EFFECT_QUALITY_LOW, false, false)
                    overlay.startAnimation()
                    assertFalse("Hidden overlay restarted", running.getBoolean(overlay))
                } finally { root.removeView(overlay) }
                assertFalse("Detached overlay kept posting frames", running.getBoolean(overlay))
            }
        }
    }
}
