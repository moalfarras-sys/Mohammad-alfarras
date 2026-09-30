package com.moalfarras.moplayer.ui.player

import android.os.SystemClock
import android.util.Log
import com.moalfarras.moplayerpro.BuildConfig

private const val ZAP_LOG_TAG = "MoPlayerZap"

/** A key press older than this did not start the change (touch, list or recovery instead). */
private const val ZAP_KEY_MAX_AGE_MS = 5_000L

/**
 * Debug builds only: one logcat line (tag MoPlayerZap) per channel or episode change, from the
 * key press to the first rendered frame, and whether the Media3 player was reused. All times are
 * [SystemClock.uptimeMillis], the clock of key event times.
 */
internal class ZapLatencyProbe {
    private var pending: PendingZap? = null

    private class PendingZap(val label: String, val keyAt: Long, val committedAt: Long, val playerBefore: Int?)

    /** A change to [label] was committed now; [keyAt] is the last key press and [playerBefore] the Media3 player on screen. */
    fun begin(label: String, keyAt: Long, playerBefore: Any?) {
        if (!BuildConfig.DEBUG) return
        val now = SystemClock.uptimeMillis()
        val pressedAt = if (keyAt > 0L && now - keyAt in 0L..ZAP_KEY_MAX_AGE_MS) keyAt else now
        pending = PendingZap(label, pressedAt, now, playerBefore?.let(System::identityHashCode))
    }

    /** First frame of the new stream; [media3Player] is null when LibVLC rendered it. */
    fun onFirstFrame(media3Player: Any?) {
        if (!BuildConfig.DEBUG) return
        val zap = pending ?: return
        pending = null
        val reused = media3Player?.let { zap.playerBefore == System.identityHashCode(it) }
        Log.i(ZAP_LOG_TAG, zapLatencyLine(zap.label, zap.keyAt, zap.committedAt, SystemClock.uptimeMillis(), reused))
    }
}

/** The MoPlayerZap log line; [playerReused] null means LibVLC rendered the frame. */
internal fun zapLatencyLine(label: String, keyAt: Long, committedAt: Long, frameAt: Long, playerReused: Boolean?): String {
    val engine = if (playerReused == null) "LibVLC" else "Media3"
    return "$label: key->frame ${frameAt - keyAt} ms (key->commit ${committedAt - keyAt} ms, " +
        "commit->frame ${frameAt - committedAt} ms) engine=$engine playerReused=${playerReused ?: "n/a"}"
}
