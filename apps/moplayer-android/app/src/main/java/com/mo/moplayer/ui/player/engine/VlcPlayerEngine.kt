package com.mo.moplayer.ui.player.engine

import android.content.Context
import android.net.Uri
import android.view.SurfaceView
import android.view.TextureView
import android.view.View
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer

/**
 * LibVLC engine — fallback for exotic streams that ExoPlayer cannot handle.
 *
 * Preserves the existing multi-strategy init, retry, and HW-acceleration logic
 * from the original PlayerActivity so nothing is lost.
 */
class VlcPlayerEngine(
    context: Context,
    private val isLive: Boolean,
    private val hardwareAccelerationEnabled: Boolean = true,
    private val bufferMs: Int = 2000,
    private val playbackProfile: Int = 0 // 0=balanced, 1=quality, 2=performance
) : PlayerEngine {

    private val appContext = context.applicationContext
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private val callbacks = mutableListOf<PlayerEngine.Callback>()

    private var libVLC: LibVLC? = null
    private var mediaPlayer: MediaPlayer? = null
    private var attachedView: View? = null

    private var currentUrl: String = ""
    private var currentTitle: String = ""
    private var startPosition: Long = 0

    private var hasStartedPlayback = false
    private val api24Safe = android.os.Build.VERSION.SDK_INT <= android.os.Build.VERSION_CODES.N

    // Cached track info (VLC provides these via MediaPlayer.TrackDescription)
    private var _audioTracks: List<PlayerEngine.TrackInfo> = emptyList()
    private var _subtitleTracks: List<PlayerEngine.TrackInfo> = emptyList()

    init {
        initVlc()
    }

    override val playbackState: Int
        get() = when {
            mediaPlayer == null -> androidx.media3.common.Player.STATE_IDLE
            mediaPlayer?.isPlaying == true -> androidx.media3.common.Player.STATE_READY
            else -> androidx.media3.common.Player.STATE_BUFFERING
        }

    override val isPlaying: Boolean
        get() = mediaPlayer?.isPlaying == true

    override val currentPositionMs: Long
        get() = mediaPlayer?.time ?: 0

    override val durationMs: Long
        get() = mediaPlayer?.length ?: 0

    override fun supports(url: String): Boolean {
        val lower = url.lowercase()
        return lower.startsWith("http://") ||
            lower.startsWith("https://") ||
            lower.startsWith("rtmp://") ||
            lower.startsWith("udp://") ||
            lower.startsWith("rtp://") ||
            lower.startsWith("file://") ||
            lower.startsWith("mmsh://") ||
            lower.startsWith("mms://")
    }

    override fun attachView(view: View) {
        attachedView = view
        val player = mediaPlayer ?: return
        when (view) {
            is org.videolan.libvlc.util.VLCVideoLayout ->
                player.attachViews(view, null, false, false)
            else -> {
                // If caller passes a SurfaceView/TextureView directly, we can't attach
                // to VLCVideoLayout; this is a limitation. The caller should use
                // VLCVideoLayout in XML when VLC fallback is active.
            }
        }
    }

    override fun detachView() {
        mediaPlayer?.detachViews()
        attachedView = null
    }

    override fun play(url: String, title: String, startPositionMs: Long) {
        currentUrl = url
        currentTitle = title
        startPosition = startPositionMs
        hasStartedPlayback = false

        val vlc = libVLC ?: run { initVlc(); libVLC } ?: return
        val player = mediaPlayer ?: MediaPlayer(vlc).also { mediaPlayer = it }

        attachedView?.let { attachView(it) }

        val uri = Uri.parse(url)
        val media = Media(vlc, uri)
        media.setHWDecoderEnabled(hardwareAccelerationEnabled, false)

        val adaptiveBuffer = getAdaptiveBufferMs()
        val cachingMs = if (api24Safe) {
            if (isLive) adaptiveBuffer.coerceAtLeast(6500) else adaptiveBuffer.coerceAtLeast(3500)
        } else {
            if (isLive) adaptiveBuffer.coerceAtLeast(4000) else adaptiveBuffer.coerceAtLeast(2000)
        }
        media.addOption(":network-caching=$cachingMs")
        media.addOption(":aout=android_audiotrack")
        media.addOption(":no-spdif")
        media.addOption(":no-audio-time-stretch")

        if (startPositionMs > 0) {
            media.addOption(":start-time=${startPositionMs / 1000}")
        }

        player.media = media
        player.play()
    }

    override fun pause() {
        mediaPlayer?.pause()
    }

    override fun resume() {
        mediaPlayer?.play()
    }

    override fun togglePlayPause() {
        val player = mediaPlayer ?: return
        if (player.isPlaying) player.pause() else player.play()
    }

    override fun seekTo(positionMs: Long) {
        mediaPlayer?.time = positionMs.coerceAtLeast(0)
    }

    override fun seekBy(offsetMs: Long) {
        val current = mediaPlayer?.time ?: 0
        mediaPlayer?.time = (current + offsetMs).coerceAtLeast(0)
    }

    override fun stop() {
        mediaPlayer?.stop()
        mediaPlayer?.media = null
    }

    override fun release() {
        scope.cancel()
        callbacks.clear()
        mediaPlayer?.release()
        libVLC?.release()
        mediaPlayer = null
        libVLC = null
    }

    override fun setSpeed(speed: Float) {
        mediaPlayer?.rate = speed.coerceIn(0.25f, 4.0f)
    }

    override fun setAudioTrack(index: Int) {
        mediaPlayer?.let { player ->
            val tracks = player.audioTracks
            tracks.getOrNull(index)?.let {
                player.audioTrack = it.id
            }
        }
    }

    override fun setSubtitleTrack(index: Int) {
        mediaPlayer?.let { player ->
            if (index < 0) {
                player.spuTrack = -1
                return
            }
            val tracks = player.spuTracks
            tracks.getOrNull(index)?.let {
                player.spuTrack = it.id
            }
        }
    }

    override fun setScaleMode(mode: PlayerEngine.ScaleMode) {
        val aspectRatio = when (mode) {
            PlayerEngine.ScaleMode.FIT -> "16:9"
            PlayerEngine.ScaleMode.FILL -> "fill"
            PlayerEngine.ScaleMode.CENTER_CROP -> "16:9" // VLC doesn't have exact CENTER_CROP
            PlayerEngine.ScaleMode.ORIGINAL -> "1:1"
        }
        mediaPlayer?.aspectRatio = aspectRatio
    }

    override val audioTracks: List<PlayerEngine.TrackInfo>
        get() = _audioTracks

    override val subtitleTracks: List<PlayerEngine.TrackInfo>
        get() = _subtitleTracks

    override fun addCallback(callback: PlayerEngine.Callback) {
        callbacks.add(callback)
    }

    override fun removeCallback(callback: PlayerEngine.Callback) {
        callbacks.remove(callback)
    }

    private fun initVlc() {
        val cachingMs = if (api24Safe) {
            bufferMs.coerceAtLeast(if (isLive) 6500 else 3500)
        } else {
            bufferMs.coerceAtLeast(500)
        }
        val cpuCores = Runtime.getRuntime().availableProcessors()
        val threadCount = (cpuCores * 2).coerceIn(8, 16)
        val codecOpt = if (hardwareAccelerationEnabled) {
            if (api24Safe) "--codec=mediacodec_jni,all" else "--codec=mediacodec_ndk,mediacodec_jni,all"
        } else "--codec=all"

        data class Quad(val a: String, val b: String, val c: String, val d: String)
        val (drop, skip, skipFrame, skipIdct) = when (playbackProfile) {
            1 -> Quad("--no-drop-late-frames", "--no-skip-frames", "--avcodec-skip-frame=-1", "--avcodec-skip-idct=-1")
            2 -> Quad("--drop-late-frames", "--skip-frames", "--avcodec-skip-frame=1", "--avcodec-skip-idct=1")
            else -> Quad("--drop-late-frames", "--skip-frames", "--avcodec-skip-frame=0", "--avcodec-skip-idct=0")
        }

        fun opts(vararg o: String) = arrayListOf<String>().apply {
            add("--quiet")
            add("--no-stats")
            add("--no-video-title-show")
            add("--aout=android_audiotrack")
            add("--no-spdif")
            add("--no-audio-time-stretch")
            addAll(o)
        }

        val strategies = listOf(
            Pair("API24Safe", opts(
                "--network-caching=$cachingMs",
                "--live-caching=$cachingMs",
                "--file-caching=$cachingMs",
                drop, skip, skipFrame, skipIdct
            )),
            Pair("Basic", opts(
                drop, skip, skipFrame, skipIdct,
                "--network-caching=$cachingMs",
                "--live-caching=$cachingMs",
                "--file-caching=$cachingMs"
            )),
            Pair("Full", opts(
                "--network-caching=$cachingMs",
                "--live-caching=$cachingMs",
                "--file-caching=$cachingMs",
                codecOpt, drop, skip, skipFrame, skipIdct,
                "--avcodec-fast",
                "--avcodec-threads=$threadCount",
                "--androidwindow-chroma=RV32"
            ))
        )

        var lastEx: Throwable? = null
        for ((name, options) in strategies) {
            try {
                val vlc = LibVLC(appContext, options)
                libVLC = vlc
                mediaPlayer = MediaPlayer(vlc).apply {
                    setEventListener { event ->
                        android.os.Handler(android.os.Looper.getMainLooper()).post {
                            handleEvent(event)
                        }
                    }
                }
                return
            } catch (e: Throwable) {
                lastEx = e
                libVLC?.release()
                libVLC = null
            }
        }
        callbacks.forEach {
            it.onPlaybackError(PlayerEngine.PlaybackError.Generic(lastEx))
        }
    }

    private fun handleEvent(event: MediaPlayer.Event) {
        when (event.type) {
            MediaPlayer.Event.Playing -> {
                hasStartedPlayback = true
                callbacks.forEach { it.onIsPlayingChanged(true) }
                refreshTracks()
            }
            MediaPlayer.Event.Paused -> {
                callbacks.forEach { it.onIsPlayingChanged(false) }
            }
            MediaPlayer.Event.Buffering -> {
                callbacks.forEach { it.onBuffering(event.buffering < 100f && !hasStartedPlayback) }
            }
            MediaPlayer.Event.EndReached -> {
                callbacks.forEach { it.onPlaybackStateChanged(androidx.media3.common.Player.STATE_ENDED) }
            }
            MediaPlayer.Event.EncounteredError -> {
                callbacks.forEach {
                    it.onPlaybackError(PlayerEngine.PlaybackError.Generic())
                }
            }
            MediaPlayer.Event.TimeChanged -> {
                callbacks.forEach {
                    it.onPositionChanged(currentPositionMs, durationMs)
                }
            }
            MediaPlayer.Event.LengthChanged -> {
                callbacks.forEach {
                    it.onPositionChanged(currentPositionMs, durationMs)
                }
            }
        }
    }

    private fun refreshTracks() {
        val player = mediaPlayer ?: return
        _audioTracks = player.audioTracks
            ?.mapIndexed { idx, td -> PlayerEngine.TrackInfo(idx, td.name ?: "Track ${idx + 1}", null) }
            ?: emptyList()
        _subtitleTracks = player.spuTracks
            ?.mapIndexed { idx, td -> PlayerEngine.TrackInfo(idx, td.name ?: "Subtitle ${idx + 1}", null) }
            ?: emptyList()
        callbacks.forEach { it.onTracksChanged(_audioTracks, _subtitleTracks) }
    }

    private fun getAdaptiveBufferMs(): Int {
        val cm = appContext.getSystemService(Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
        val nw = cm.activeNetwork ?: return bufferMs
        val caps = cm.getNetworkCapabilities(nw) ?: return bufferMs
        return when {
            caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI) -> bufferMs
            caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_ETHERNET) -> bufferMs
            caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_CELLULAR) -> (bufferMs * 1.5).toInt()
            else -> bufferMs * 2
        }
    }
}
