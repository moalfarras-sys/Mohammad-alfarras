package com.mo.moplayer.util

import android.app.Activity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

/**
 * Full-screen (immersive) mode for every screen.
 *
 * The app targets Android 15, where windows draw edge-to-edge: on phones and tablets the status
 * and navigation bars sat on top of the TV-style header and dock. Like a video app, MoPlayer hides
 * them; a swipe from the edge shows them briefly. TVs have no system bars, so this is a no-op there.
 */
object ImmersiveMode {
    fun apply(activity: Activity) {
        val window = activity.window ?: return
        runCatching {
            WindowCompat.getInsetsController(window, window.decorView).apply {
                systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                hide(WindowInsetsCompat.Type.systemBars())
            }
        }
    }
}
