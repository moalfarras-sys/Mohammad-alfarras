package com.mo.moplayer.ui.player.engine

import android.content.Context
import android.view.View
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel

/**
 * MoPlayer dual-engine playback manager.
 *
 * Strategy:
 * 1. **ExoPlayer first** (fast start, hardware-accelerated, MediaSession-friendly).
 * 2. On any playback error from ExoPlayer, seamlessly **fallback to VLC** which
 *    handles exotic codecs / HTTP auth quirks better.
 *
 * This class is designed to be dropped into [PlayerActivity] as a drop-in
 * replacement for direct LibVLC usage. The caller only sees [PlayerEngine].
 *
 * To activate, set `PlayerPreferences.useExoplayerPrimary()` to true.
 * While false, the app continues using legacy VLC-only code.
 */
class PlayerEngineManager(context: Context, isLive: Boolean) {

    private val appContext = context.applicationContext
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private val exoEngine: ExoPlayerEngine by lazy {
        ExoPlayerEngine(appContext, isLive)
    }
    private val vlcEngine: VlcPlayerEngine by lazy {
        VlcPlayerEngine(appContext, isLive)
    }

    /** Which engine is currently primary. */
    private var primaryEngine: PlayerEngine = exoEngine
    private var fallbackActive = false
    private var exoView: View? = null
    private var vlcView: View? = null

    private val callbacks = mutableListOf<PlayerEngine.Callback>()
    private val compositeCallback = object : PlayerEngine.Callback {
        override fun onPlaybackStateChanged(state: Int) {
            callbacks.forEach { it.onPlaybackStateChanged(state) }
        }
        override fun onIsPlayingChanged(isPlaying: Boolean) {
            callbacks.forEach { it.onIsPlayingChanged(isPlaying) }
        }
        override fun onPlaybackError(error: PlayerEngine.PlaybackError) {
            if (primaryEngine == exoEngine && !fallbackActive) {
                // ExoPlayer failed — try VLC fallback
                fallbackActive = true
                val url = _lastUrl
                val title = _lastTitle
                val pos = _lastPosition
                if (url.isNotEmpty()) {
                    exoEngine.stop()
                    exoEngine.detachView()
                    primaryEngine = vlcEngine
                    vlcView?.let { vlcEngine.attachView(it) }
                    primaryEngine.play(url, title, pos)
                }
            } else {
                callbacks.forEach { it.onPlaybackError(error) }
            }
        }
        override fun onPositionChanged(positionMs: Long, durationMs: Long) {
            callbacks.forEach { it.onPositionChanged(positionMs, durationMs) }
        }
        override fun onTracksChanged(audio: List<PlayerEngine.TrackInfo>, subtitles: List<PlayerEngine.TrackInfo>) {
            callbacks.forEach { it.onTracksChanged(audio, subtitles) }
        }
        override fun onVideoSizeChanged(width: Int, height: Int) {
            callbacks.forEach { it.onVideoSizeChanged(width, height) }
        }
        override fun onBuffering(buffering: Boolean) {
            callbacks.forEach { it.onBuffering(buffering) }
        }
    }

    private var _lastUrl = ""
    private var _lastTitle = ""
    private var _lastPosition = 0L

    init {
        exoEngine.addCallback(compositeCallback)
        vlcEngine.addCallback(compositeCallback)
    }

    val engine: PlayerEngine
        get() = primaryEngine

    fun setPrimaryEngine(useExo: Boolean) {
        primaryEngine = if (useExo) exoEngine else vlcEngine
        fallbackActive = false
        attachCurrentView()
    }

    fun play(url: String, title: String, startPositionMs: Long) {
        _lastUrl = url
        _lastTitle = title
        _lastPosition = startPositionMs
        fallbackActive = false
        // Reset both engines before playing
        exoEngine.stop()
        vlcEngine.stop()
        primaryEngine.play(url, title, startPositionMs)
    }

    fun attachView(view: View) {
        // Both engines can attach to the same view container if it is generic.
        // In practice ExoPlayer needs SurfaceView/TextureView and VLC needs VLCVideoLayout.
        // The caller is expected to have the right view type based on active engine.
        primaryEngine.attachView(view)
    }

    fun attachViews(exoView: View, vlcView: View) {
        this.exoView = exoView
        this.vlcView = vlcView
        attachCurrentView()
    }

    private fun attachCurrentView() {
        when (primaryEngine) {
            exoEngine -> exoView?.let { exoEngine.attachView(it) }
            vlcEngine -> vlcView?.let { vlcEngine.attachView(it) }
        }
    }

    fun detachView() {
        exoEngine.detachView()
        vlcEngine.detachView()
    }

    fun release() {
        scope.cancel()
        callbacks.clear()
        exoEngine.release()
        vlcEngine.release()
    }

    fun addCallback(callback: PlayerEngine.Callback) {
        callbacks.add(callback)
    }

    fun removeCallback(callback: PlayerEngine.Callback) {
        callbacks.remove(callback)
    }

    /** True if VLC fallback is currently running (ExoPlayer failed). */
    val isFallbackActive: Boolean
        get() = fallbackActive

    // Delegation helpers so PlayerActivity can query/operate indiscriminately
    val currentPositionMs: Long get() = primaryEngine.currentPositionMs
    val durationMs: Long get() = primaryEngine.durationMs
    val isPlaying: Boolean get() = primaryEngine.isPlaying

    fun pause() = primaryEngine.pause()
    fun resume() = primaryEngine.resume()
    fun togglePlayPause() = primaryEngine.togglePlayPause()
    fun seekBy(offsetMs: Long) = primaryEngine.seekBy(offsetMs)
    fun seekTo(positionMs: Long) = primaryEngine.seekTo(positionMs)
    fun stop() = primaryEngine.stop()
    fun setSpeed(speed: Float) = primaryEngine.setSpeed(speed)

    val audioTracks: List<PlayerEngine.TrackInfo> get() = primaryEngine.audioTracks
    val subtitleTracks: List<PlayerEngine.TrackInfo> get() = primaryEngine.subtitleTracks
    fun setAudioTrack(index: Int) = primaryEngine.setAudioTrack(index)
    fun setSubtitleTrack(index: Int) = primaryEngine.setSubtitleTrack(index)
}
