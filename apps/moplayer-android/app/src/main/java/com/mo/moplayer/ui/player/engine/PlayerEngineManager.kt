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
    private var primaryEngine: PlayerEngine? = null
    private var preferExoPrimary = true
    private var fallbackActive = false
    private var exoView: View? = null
    private var vlcView: View? = null
    private var callbackEngine: PlayerEngine? = null

    private val callbacks = mutableListOf<PlayerEngine.Callback>()
    private val compositeCallback = object : PlayerEngine.Callback {
        override fun onPlaybackStateChanged(state: Int) {
            callbacks.forEach { it.onPlaybackStateChanged(state) }
        }
        override fun onIsPlayingChanged(isPlaying: Boolean) {
            callbacks.forEach { it.onIsPlayingChanged(isPlaying) }
        }
        override fun onPlaybackError(error: PlayerEngine.PlaybackError) {
            if (primaryEngine === exoEngine && !fallbackActive) {
                // ExoPlayer failed — try VLC fallback
                fallbackActive = true
                val url = _lastUrl
                val title = _lastTitle
                val pos = _lastPosition
                if (url.isNotEmpty()) {
                    exoEngine.stop()
                    exoEngine.detachView()
                    primaryEngine = vlcEngine
                    // Re-bind the composite callback to VLC so its buffering/state/error events
                    // reach the UI after the fallback (otherwise the UI would go silent).
                    ensureCompositeCallback(vlcEngine)
                    vlcView?.let { vlcEngine.attachView(it) }
                    vlcEngine.play(url, title, pos)
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

    val engine: PlayerEngine
        get() = primaryEngine ?: activeEngine()

    fun setPrimaryEngine(useExo: Boolean) {
        preferExoPrimary = useExo
        primaryEngine = if (useExo) exoEngine else vlcEngine
        ensureCompositeCallback(activeEngine())
        fallbackActive = false
        attachCurrentView()
    }

    fun play(url: String, title: String, startPositionMs: Long) {
        _lastUrl = url
        _lastTitle = title
        _lastPosition = startPositionMs
        fallbackActive = false
        primaryEngine = if (preferExoPrimary && exoEngine.supports(url)) exoEngine else vlcEngine
        ensureCompositeCallback(activeEngine())
        attachCurrentView()
        activeEngine().stop()
        activeEngine().play(url, title, startPositionMs)
    }

    fun attachView(view: View) {
        // Both engines can attach to the same view container if it is generic.
        // In practice ExoPlayer needs SurfaceView/TextureView and VLC needs VLCVideoLayout.
        // The caller is expected to have the right view type based on active engine.
        activeEngine().attachView(view)
    }

    fun attachViews(exoView: View, vlcView: View) {
        this.exoView = exoView
        this.vlcView = vlcView
        attachCurrentView()
    }

    private fun attachCurrentView() {
        when (activeEngine()) {
            exoEngine -> exoView?.let { exoEngine.attachView(it) }
            vlcEngine -> vlcView?.let { vlcEngine.attachView(it) }
        }
    }

    fun detachView() {
        primaryEngine?.detachView()
    }

    fun release() {
        scope.cancel()
        callbacks.clear()
        runCatching { if (primaryEngine === exoEngine) exoEngine.release() }
        runCatching { if (primaryEngine === vlcEngine || fallbackActive) vlcEngine.release() }
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
    val currentPositionMs: Long get() = primaryEngine?.currentPositionMs ?: 0L
    val durationMs: Long get() = primaryEngine?.durationMs ?: 0L
    val isPlaying: Boolean get() = primaryEngine?.isPlaying == true

    fun pause() = primaryEngine?.pause() ?: Unit
    fun resume() = primaryEngine?.resume() ?: Unit
    fun togglePlayPause() = primaryEngine?.togglePlayPause() ?: Unit
    fun seekBy(offsetMs: Long) = primaryEngine?.seekBy(offsetMs) ?: Unit
    fun seekTo(positionMs: Long) = primaryEngine?.seekTo(positionMs) ?: Unit
    fun stop() = primaryEngine?.stop() ?: Unit
    fun setSpeed(speed: Float) = primaryEngine?.setSpeed(speed) ?: Unit

    val audioTracks: List<PlayerEngine.TrackInfo> get() = primaryEngine?.audioTracks ?: emptyList()
    val subtitleTracks: List<PlayerEngine.TrackInfo> get() = primaryEngine?.subtitleTracks ?: emptyList()
    fun setAudioTrack(index: Int) = primaryEngine?.setAudioTrack(index) ?: Unit
    fun setSubtitleTrack(index: Int) = primaryEngine?.setSubtitleTrack(index) ?: Unit

    private fun activeEngine(): PlayerEngine {
        return primaryEngine ?: (if (preferExoPrimary) exoEngine else vlcEngine).also {
            primaryEngine = it
        }
    }

    private fun ensureCompositeCallback(engine: PlayerEngine) {
        if (callbackEngine === engine) return
        callbackEngine?.removeCallback(compositeCallback)
        engine.addCallback(compositeCallback)
        callbackEngine = engine
    }
}
