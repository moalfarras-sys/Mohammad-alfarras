package com.moalfarras.moplayer.core

import android.content.Context
import android.media.AudioManager

/**
 * Process-wide "someone is watching" signal for background work.
 *
 * Library and EPG workers must not download tens of MB (and write thousands of rows) while a live
 * channel is playing on a weak TV box. The player can report its state with [setActive]; until it
 * does, [isLikelyActive] also treats active media audio (which ExoPlayer and LibVLC both produce
 * while playing) as playback.
 */
object PlaybackActivity {
    @Volatile
    private var active = false

    @Volatile
    private var audioManager: AudioManager? = null

    /** Called by the player when playback starts/stops (both engines, including pauses in the background). */
    fun setActive(isActive: Boolean) {
        active = isActive
    }

    /** Registers the application context used for the audio check; cheap to call repeatedly. */
    fun attach(context: Context) {
        if (audioManager == null) {
            audioManager = context.applicationContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        }
    }

    fun isLikelyActive(): Boolean =
        active || runCatching { audioManager?.isMusicActive == true }.getOrDefault(false)
}
