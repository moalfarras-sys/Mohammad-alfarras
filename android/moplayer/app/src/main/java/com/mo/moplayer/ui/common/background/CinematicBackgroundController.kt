package com.mo.moplayer.ui.common.background

import android.graphics.Color
import android.view.View
import android.widget.ImageView
import com.mo.moplayer.ui.widgets.AnimatedBackground
import com.mo.moplayer.ui.widgets.weather.FullScreenWeatherOverlay

enum class BackgroundVisualMode {
    CINEMATIC_ANIMATED,
    CITY_WALLPAPER_LOGIN,
    WEATHER_REACTIVE,
    REDUCED_MOTION
}

data class BackgroundProfile(
    val mode: BackgroundVisualMode,
    val showWallpaper: Boolean,
    val wallpaperAlpha: Float,
    val scrimAlpha: Float,
    val weatherAlpha: Float,
    val cinematicMode: Boolean
)

object CinematicBackgroundController {

    fun applyCinematicDefaults(background: AnimatedBackground?) {
        if (background == null) return
        background.setTvOptimizationMode(true)
        background.setCinematicMode(true)
        background.setAnimationEnabled(true)
        background.resumeAnimation()
    }

    fun resolveProfile(mode: BackgroundVisualMode): BackgroundProfile {
        return when (mode) {
            BackgroundVisualMode.CITY_WALLPAPER_LOGIN -> BackgroundProfile(
                mode = mode,
                showWallpaper = true,
                wallpaperAlpha = 1f,
                scrimAlpha = 0.58f,
                weatherAlpha = 0.34f,
                cinematicMode = true
            )
            BackgroundVisualMode.WEATHER_REACTIVE -> BackgroundProfile(
                mode = mode,
                showWallpaper = false,
                wallpaperAlpha = 0f,
                scrimAlpha = 0.42f,
                weatherAlpha = 0.34f,
                cinematicMode = true
            )
            BackgroundVisualMode.REDUCED_MOTION -> BackgroundProfile(
                mode = mode,
                showWallpaper = false,
                wallpaperAlpha = 0f,
                scrimAlpha = 0.54f,
                weatherAlpha = 0.18f,
                cinematicMode = false
            )
            BackgroundVisualMode.CINEMATIC_ANIMATED -> BackgroundProfile(
                mode = mode,
                showWallpaper = false,
                wallpaperAlpha = 0f,
                scrimAlpha = 0.44f,
                weatherAlpha = 0.26f,
                cinematicMode = true
            )
        }
    }

    fun applyBackgroundProfile(
        mode: BackgroundVisualMode,
        background: AnimatedBackground?,
        weatherOverlay: FullScreenWeatherOverlay? = null,
        wallpaperView: ImageView? = null,
        wallpaperScrim: View? = null
    ) {
        val profile = resolveProfile(mode)
        background?.setCinematicMode(profile.cinematicMode)
        wallpaperView?.alpha = profile.wallpaperAlpha
        wallpaperView?.visibility = if (profile.showWallpaper) View.VISIBLE else View.GONE
        wallpaperScrim?.alpha = profile.scrimAlpha
        weatherOverlay?.alpha = profile.weatherAlpha
    }

    fun bindWeatherOverlay(
        mode: BackgroundVisualMode,
        weatherOverlay: FullScreenWeatherOverlay?,
        accentColor: Int
    ) {
        if (weatherOverlay == null) return
        val profile = resolveProfile(mode)
        weatherOverlay.alpha = profile.weatherAlpha
        val ambientTop = blendColor(Color.parseColor("#152447"), accentColor, 0.14f)
        weatherOverlay.setAccentPalette(
            primaryColor = ambientTop,
            horizonColor = Color.parseColor("#D9B86A")
        )
    }

    private fun blendColor(from: Int, to: Int, factor: Float): Int {
        val t = factor.coerceIn(0f, 1f)
        return Color.argb(
            (Color.alpha(from) + (Color.alpha(to) - Color.alpha(from)) * t).toInt(),
            (Color.red(from) + (Color.red(to) - Color.red(from)) * t).toInt(),
            (Color.green(from) + (Color.green(to) - Color.green(from)) * t).toInt(),
            (Color.blue(from) + (Color.blue(to) - Color.blue(from)) * t).toInt()
        )
    }
}
