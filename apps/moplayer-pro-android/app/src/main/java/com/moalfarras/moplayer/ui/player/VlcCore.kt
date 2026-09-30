@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package com.moalfarras.moplayer.ui.player

import android.content.Context
import android.media.AudioManager
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.audio.AudioFocusRequestCompat
import androidx.media3.common.audio.AudioManagerCompat
import org.videolan.libvlc.LibVLC
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.Future
import java.util.concurrent.RejectedExecutionException
import java.util.concurrent.TimeUnit

private const val VLC_LOG_TAG = "MoPlayerVlc"

/** How long a new player waits for the previous LibVLC player to close its provider connection. */
internal const val LIBVLC_TEARDOWN_WAIT_MS = 1_500L

/**
 * Process-wide LibVLC state. Creating a LibVLC instance loads and initialises every plugin, so
 * there is one per process (as in VLC for Android). Native teardowns run on background threads;
 * they are tracked here so the next player (either engine) can wait for the old stream's socket
 * to close before opening its own: most Xtream lines allow a single connection.
 */
internal object VlcCore {
    @Volatile
    private var instance: LibVLC? = null
    private val teardowns = CopyOnWriteArrayList<Future<*>>()

    /** The shared instance; the first call is slow (plugin load), so make it off the main thread. */
    fun get(context: Context): LibVLC = instance ?: synchronized(this) {
        instance ?: LibVLC(
            context.applicationContext,
            ArrayList(libVlcInstanceOptions(Runtime.getRuntime().availableProcessors())),
        ).also { created ->
            runCatching { created.setUserAgent("MoPlayer Pro", APP_USER_AGENT) }
            instance = created
        }
    }

    fun peek(): LibVLC? = instance

    fun trackTeardown(teardown: Future<*>) {
        teardowns.removeAll { it.isDone }
        teardowns += teardown
    }

    private fun hasPendingTeardown(): Boolean = teardowns.any { !it.isDone }

    /** Worker threads only: blocks until earlier players finished tearing down, at most [timeoutMs]. */
    fun awaitTeardowns(timeoutMs: Long) {
        val deadline = SystemClock.uptimeMillis() + timeoutMs
        for (teardown in teardowns) {
            val left = deadline - SystemClock.uptimeMillis()
            if (left <= 0L) break
            runCatching { teardown.get(left, TimeUnit.MILLISECONDS) }
        }
    }

    /**
     * Main thread: runs [block] now when no LibVLC teardown is pending, otherwise once it finished
     * (or after [timeoutMs]). Returns a handle that cancels a deferred [block].
     */
    fun afterTeardowns(timeoutMs: Long, block: () -> Unit): () -> Unit {
        if (!hasPendingTeardown()) {
            block()
            return {}
        }
        val handler = Handler(Looper.getMainLooper())
        val startedAt = SystemClock.uptimeMillis()
        var cancelled = false
        val check = object : Runnable {
            override fun run() {
                if (cancelled) return
                if (!hasPendingTeardown() || SystemClock.uptimeMillis() - startedAt >= timeoutMs) {
                    block()
                } else {
                    handler.postDelayed(this, 40L)
                }
            }
        }
        handler.postDelayed(check, 40L)
        return {
            cancelled = true
            handler.removeCallbacks(check)
        }
    }
}

/**
 * One serial thread per LibVLC player. In LibVLC 3, stop() (and set_media, release) joins the
 * input thread, which can wait on a stalled network read; every native call that may take the
 * player's input lock therefore runs here, in order, and never on the main thread.
 */
internal class VlcWorker {
    private val executor: ExecutorService = Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "moplayer-vlc").apply { isDaemon = true }
    }

    fun run(block: () -> Unit) {
        try {
            executor.execute { guarded(block) }
        } catch (_: RejectedExecutionException) {
            // Already finished: the player is released, so there is nothing left to do.
        }
    }

    /** Queues the final [block] (after everything already queued) and lets the thread end. */
    fun finish(block: () -> Unit): Future<*>? = try {
        executor.submit { guarded(block) }.also { executor.shutdown() }
    } catch (_: RejectedExecutionException) {
        null
    }

    private fun guarded(block: () -> Unit) {
        try {
            block()
        } catch (error: Exception) {
            Log.w(VLC_LOG_TAG, "LibVLC call failed: ${error.javaClass.simpleName}")
        }
    }
}

/**
 * Audio focus for LibVLC, which (unlike ExoPlayer) does not manage it. Change callbacks arrive on
 * the main thread.
 */
internal class VlcAudioFocus(context: Context, onChange: (Int) -> Unit) {
    private val manager: AudioManager = AudioManagerCompat.getAudioManager(context)
    private val request = AudioFocusRequestCompat.Builder(AudioManagerCompat.AUDIOFOCUS_GAIN)
        .setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(C.USAGE_MEDIA)
                .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                .build(),
        )
        .setWillPauseWhenDucked(false)
        .setOnAudioFocusChangeListener({ change -> onChange(change) }, Handler(Looper.getMainLooper()))
        .build()
    private var held = false

    /**
     * Asks for focus before playback. Playback starts either way (as a TV player should when the
     * viewer pressed play); a refused request only means no loss/duck callbacks until the next one.
     */
    fun request() {
        held = runCatching {
            AudioManagerCompat.requestAudioFocus(manager, request) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        }.getOrDefault(false)
    }

    fun abandon() {
        if (!held) return
        held = false
        runCatching { AudioManagerCompat.abandonAudioFocusRequest(manager, request) }
    }
}
