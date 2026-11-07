@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package com.mo.moplayer.ui.player.engine

import android.content.Context
import android.view.View

/** Owns both engines for one playback session, with load-scoped event delivery. */
class PlayerEngineManager internal constructor(
    exoFactory: () -> PlayerEngine,
    vlcFactory: () -> PlayerEngine,
    private val isLive: Boolean = false,
) {
    constructor(context: Context, isLive: Boolean) : this(
        { ExoPlayerEngine(context.applicationContext, isLive) },
        { VlcPlayerEngine(context.applicationContext, isLive) },
        isLive,
    )

    private val exoDelegate = lazy(exoFactory)
    private val vlcDelegate = lazy(vlcFactory)
    private var primaryEngine: PlayerEngine? = null
    private var preferExoPrimary = true
    private var fallbackActive = false
    private var exoView: View? = null
    private var vlcView: View? = null
    private var callbackEngine: PlayerEngine? = null
    private var compositeCallback: PlayerEngine.Callback? = null
    private var generation = 0L
    private var released = false
    private var lastUrl = ""
    private var lastTitle = ""
    private var lastPosition = 0L
    private val callbacks = mutableListOf<PlayerEngine.Callback>()

    val engine: PlayerEngine
        get() {
            check(!released) { "Playback session already released" }
            return primaryEngine ?: preferredEngine().also { primaryEngine = it }
        }

    val isFallbackActive: Boolean get() = fallbackActive
    val isUsingVlc: Boolean
        get() = vlcDelegate.isInitialized() && primaryEngine === vlcDelegate.value

    private fun preferredEngine(): PlayerEngine =
        if (preferExoPrimary) exoDelegate.value else vlcDelegate.value

    fun setPrimaryEngine(useExo: Boolean) {
        check(!released) { "Playback session already released" }
        generation++
        unbindCallback()
        preferExoPrimary = useExo
        fallbackActive = false
        selectEngine(preferredEngine())
        bindCallback(engine)
        attachCurrentView()
    }

    fun play(url: String, title: String, startPositionMs: Long) {
        check(!released) { "Playback session already released" }
        generation++
        unbindCallback()
        lastUrl = url
        lastTitle = title
        lastPosition = startPositionMs.coerceAtLeast(0)
        fallbackActive = false
        val target = if (preferExoPrimary && exoDelegate.value.supports(url)) exoDelegate.value else vlcDelegate.value
        selectEngine(target)
        target.stop()
        bindCallback(target)
        attachCurrentView()
        target.play(url, title, lastPosition)
    }

    private fun selectEngine(target: PlayerEngine) {
        val old = primaryEngine
        if (old === target) return
        old?.stop()
        old?.detachView()
        primaryEngine = target
        // Surface visibility must change before the new native player starts preparing.
        callbacks.toList().forEach { it.onEngineChanged() }
    }

    private fun bindCallback(source: PlayerEngine) {
        val token = generation
        val relay = object : PlayerEngine.Callback {
            private fun current() = !released && token == generation && primaryEngine === source
            private fun deliver(block: (PlayerEngine.Callback) -> Unit) {
                if (current()) callbacks.toList().forEach { if (current()) block(it) }
            }
            override fun onPlaybackStateChanged(state: Int) = deliver { it.onPlaybackStateChanged(state) }
            override fun onIsPlayingChanged(isPlaying: Boolean) = deliver { it.onIsPlayingChanged(isPlaying) }
            override fun onPositionChanged(positionMs: Long, durationMs: Long) = deliver { it.onPositionChanged(positionMs, durationMs) }
            override fun onTracksChanged(audio: List<PlayerEngine.TrackInfo>, subtitles: List<PlayerEngine.TrackInfo>) =
                deliver { it.onTracksChanged(audio, subtitles) }
            override fun onVideoSizeChanged(width: Int, height: Int) = deliver { it.onVideoSizeChanged(width, height) }
            override fun onBuffering(buffering: Boolean) = deliver { it.onBuffering(buffering) }
            override fun onPlaybackError(error: PlayerEngine.PlaybackError) {
                if (!current()) return
                if (exoDelegate.isInitialized() && source === exoDelegate.value && !fallbackActive && lastUrl.isNotEmpty()) {
                    val position = if (isLive) 0L else source.currentPositionMs.takeIf { it > 0 } ?: lastPosition
                    generation++
                    unbindCallback()
                    fallbackActive = true
                    val fallback = vlcDelegate.value
                    selectEngine(fallback)
                    bindCallback(fallback)
                    attachCurrentView()
                    fallback.play(lastUrl, lastTitle, position)
                } else {
                    deliver { it.onPlaybackError(error) }
                }
            }
        }
        compositeCallback = relay
        callbackEngine = source
        source.addCallback(relay)
    }

    private fun unbindCallback() {
        compositeCallback?.let { callbackEngine?.removeCallback(it) }
        compositeCallback = null
        callbackEngine = null
    }

    fun attachView(view: View) { if (!released) engine.attachView(view) }
    fun attachViews(exoView: View, vlcView: View) {
        if (released) return
        this.exoView = exoView
        this.vlcView = vlcView
        attachCurrentView()
    }
    private fun attachCurrentView() {
        val current = primaryEngine ?: return
        if (isUsingVlc) vlcView?.let(current::attachView)
        else exoView?.let(current::attachView)
    }
    fun detachView() { primaryEngine?.detachView() }

    fun stop() {
        generation++
        unbindCallback()
        lastUrl = ""
        primaryEngine?.stop()
    }

    fun release() {
        if (released) return
        released = true
        generation++
        unbindCallback()
        callbacks.clear()
        // Inspect delegates without constructing an unused native engine just to release it.
        val created = listOfNotNull(
            if (exoDelegate.isInitialized()) exoDelegate.value else null,
            if (vlcDelegate.isInitialized()) vlcDelegate.value else null,
        ).distinct()
        primaryEngine = null
        exoView = null
        vlcView = null
        lastUrl = ""
        created.forEach { player ->
            runCatching { player.detachView() }
            runCatching { player.release() }
        }
    }

    fun addCallback(callback: PlayerEngine.Callback) { if (!released) callbacks.add(callback) }
    fun removeCallback(callback: PlayerEngine.Callback) { callbacks.remove(callback) }
    val currentPositionMs: Long get() = primaryEngine?.currentPositionMs ?: 0L
    val durationMs: Long get() = primaryEngine?.durationMs ?: 0L
    val playWhenReady: Boolean get() = primaryEngine?.playWhenReady == true
    val isPlaying: Boolean get() = primaryEngine?.isPlaying == true
    fun pause() { primaryEngine?.pause() }
    fun resume() { primaryEngine?.resume() }
    fun togglePlayPause() { primaryEngine?.togglePlayPause() }
    fun seekBy(offsetMs: Long) { primaryEngine?.seekBy(offsetMs) }
    fun seekTo(positionMs: Long) { primaryEngine?.seekTo(positionMs) }
    fun setSpeed(speed: Float) { primaryEngine?.setSpeed(speed) }
    val audioTracks: List<PlayerEngine.TrackInfo> get() = primaryEngine?.audioTracks ?: emptyList()
    val subtitleTracks: List<PlayerEngine.TrackInfo> get() = primaryEngine?.subtitleTracks ?: emptyList()
    fun setAudioTrack(index: Int) { primaryEngine?.setAudioTrack(index) }
    fun setSubtitleTrack(index: Int) { primaryEngine?.setSubtitleTrack(index) }
}
