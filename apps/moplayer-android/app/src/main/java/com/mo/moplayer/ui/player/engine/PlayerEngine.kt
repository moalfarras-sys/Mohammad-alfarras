package com.mo.moplayer.ui.player.engine

import android.view.SurfaceView
import android.view.TextureView
import android.view.View
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi

/**
 * Unified playback engine abstraction.
 *
 * Two concrete implementations exist:
 * - [ExoPlayerEngine] — Media3 ExoPlayer (preferred; fast start, hardware-accelerated).
 * - [VlcPlayerEngine] — LibVLC (fallback for exotic codecs / HTTP auth quirks).
 *
 * All player UI code must talk to this interface so that switching engines is transparent.
 */
interface PlayerEngine {

    /** One of the constants in [Player]. */
    val playbackState: Int

    /** True when content is actively rendering (or buffering with the intention to play). */
    val isPlaying: Boolean

    /** Current position in milliseconds. */
    val currentPositionMs: Long

    /** Content duration in milliseconds; [C.TIME_UNSET] if unknown. */
    val durationMs: Long

    /** Whether the engine can handle the given URL scheme (e.g. http, https, rtmp, udp). */
    fun supports(url: String): Boolean

    /** Attach the engine to a [SurfaceView] or [TextureView] target. */
    fun attachView(view: View)

    /** Detach any view. */
    fun detachView()

    /** Prepare and begin playback of [url]. */
    fun play(url: String, title: String = "", startPositionMs: Long = 0)

    /** Pause playback (retains resources). */
    fun pause()

    /** Resume after pause(). */
    fun resume()

    /** Toggle play/pause based on current state. */
    fun togglePlayPause()

    /** Seek to [positionMs]. */
    fun seekTo(positionMs: Long)

    /** Fast-seek backward / forward by [offsetMs]. */
    fun seekBy(offsetMs: Long)

    /** Stop playback and release the current media. */
    fun stop()

    /** Release all resources. Must be safe to call multiple times. */
    fun release()

    /** Set playback speed. 1.0 = normal. */
    fun setSpeed(speed: Float)

    /** Select audio track by index from [audioTracks]. */
    fun setAudioTrack(index: Int)

    /** Select subtitle track by index from [subtitleTracks]; -1 to disable. */
    fun setSubtitleTrack(index: Int)

    /** Set video aspect ratio / scale mode. */
    fun setScaleMode(mode: ScaleMode)

    /** Available audio tracks (label, language). */
    val audioTracks: List<TrackInfo>

    /** Available subtitle tracks (label, language). */
    val subtitleTracks: List<TrackInfo>

    /** Callbacks the UI can observe. */
    interface Callback {
        fun onPlaybackStateChanged(state: Int) {}
        fun onIsPlayingChanged(isPlaying: Boolean) {}
        fun onPlaybackError(error: PlaybackError) {}
        fun onPositionChanged(positionMs: Long, durationMs: Long) {}
        fun onTracksChanged(audio: List<TrackInfo>, subtitles: List<TrackInfo>) {}
        fun onVideoSizeChanged(width: Int, height: Int) {}
        fun onBuffering(buffering: Boolean) {}
    }

    fun addCallback(callback: Callback)
    fun removeCallback(callback: Callback)

    data class TrackInfo(val index: Int, val label: String, val language: String?)

    sealed class PlaybackError(val message: String) {
        class Network(url: String, cause: Throwable? = null) :
            PlaybackError("Network error: ${cause?.message ?: url}")

        class Codec(cause: Throwable? = null) :
            PlaybackError("Codec unsupported: ${cause?.message ?: ""}")

        class Generic(cause: Throwable? = null) :
            PlaybackError("Playback error: ${cause?.message ?: ""}")

        class Source(cause: Throwable? = null) :
            PlaybackError("Source error: ${cause?.message ?: ""}")
    }

    enum class ScaleMode {
        FIT, FILL, CENTER_CROP, ORIGINAL
    }
}
