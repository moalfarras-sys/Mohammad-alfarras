package com.mo.moplayer.ui.player.engine

import android.content.Context
import android.view.SurfaceView
import android.view.TextureView
import android.view.View
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaItem.LiveConfiguration
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.Tracks
import androidx.media3.common.VideoSize
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.LoadControl
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.media3.ui.PlayerView
import com.mo.moplayer.util.DevicePerformance
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel

/**
 * Media3 ExoPlayer engine — primary playback engine for MoPlayer.
 *
 * Benefits over VLC:
 * - Faster startup time (especially HLS/DASH).
 * - Native Android [MediaSession] / [AudioFocus] integration.
 * - Better hardware decoder reuse on modern chipsets.
 * - Built-in track selection UI helpers.
 *
 * Configuration:
 * - Live TV: tiny buffer (low latency, fast zapping).
 * - VOD: generous buffer (smooth seeking, 4K/8K stability).
 */
@UnstableApi
class ExoPlayerEngine(
    context: Context,
    private val isLive: Boolean
) : PlayerEngine {

    private val appContext = context.applicationContext
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private val trackSelector = DefaultTrackSelector(appContext).apply {
        setParameters(buildUponParameters().setAllowVideoMixedDecoderSupportAdaptiveness(true))
    }

    private val performanceTier = DevicePerformance.tier(appContext)

    private val loadControl: LoadControl = DefaultLoadControl.Builder()
        .setBufferDurationsMs(
            if (isLive) liveMinBufferMs() else vodMinBufferMs(),
            if (isLive) liveMaxBufferMs() else 50_000,
            if (isLive) livePlaybackBufferMs() else 2_500,
            if (isLive) liveRebufferMs() else 5_000
        )
        .setPrioritizeTimeOverSizeThresholds(true)
        .build()

    private val exoPlayer: ExoPlayer = ExoPlayer.Builder(appContext)
        .setTrackSelector(trackSelector)
        .setLoadControl(loadControl)
        .setSeekBackIncrementMs(10_000)
        .setSeekForwardIncrementMs(10_000)
        .build()
        .apply {
            if (isLive) {
                setPlaybackSpeed(1.0f)
            }
            addListener(PlayerListener())
        }

    private val callbacks = mutableListOf<PlayerEngine.Callback>()

    private var attachedView: View? = null

    override val playbackState: Int
        get() = exoPlayer.playbackState

    override val isPlaying: Boolean
        get() = exoPlayer.isPlaying

    override val currentPositionMs: Long
        get() = exoPlayer.currentPosition

    override val durationMs: Long
        get() = exoPlayer.duration.coerceAtLeast(0)

    override fun supports(url: String): Boolean {
        val lower = url.lowercase()
        return lower.startsWith("http://") ||
            lower.startsWith("https://") ||
            lower.startsWith("rtsp://") ||
            lower.startsWith("file://")
    }

    override fun attachView(view: View) {
        attachedView = view
        when (view) {
            is PlayerView -> view.player = exoPlayer
            is SurfaceView -> exoPlayer.setVideoSurfaceView(view)
            is TextureView -> exoPlayer.setVideoTextureView(view)
        }
    }

    override fun detachView() {
        (attachedView as? PlayerView)?.player = null
        exoPlayer.clearVideoSurface()
        attachedView = null
    }

    override fun play(url: String, title: String, startPositionMs: Long) {
        val lower = url.lowercase()
        val builder = MediaItem.Builder().setUri(url)
        when {
            lower.contains(".m3u8") || lower.contains("type=m3u") -> builder.setMimeType(MimeTypes.APPLICATION_M3U8)
            lower.contains(".mpd") -> builder.setMimeType(MimeTypes.APPLICATION_MPD)
            lower.contains(".ism") || (lower.contains("manifest") && lower.contains("smooth")) ->
                builder.setMimeType(MimeTypes.APPLICATION_SS)
            lower.startsWith("rtsp://") -> builder.setMimeType(MimeTypes.APPLICATION_RTSP)
            lower.endsWith(".ts") || lower.contains("output=ts") -> builder.setMimeType(MimeTypes.VIDEO_MP2T)
        }
        if (isLive) {
            builder.setLiveConfiguration(
                LiveConfiguration.Builder()
                    .setTargetOffsetMs(liveTargetOffsetMs())
                    .setMinOffsetMs(1_000)
                    .setMaxOffsetMs(liveMaxBufferMs().toLong())
                    .setMinPlaybackSpeed(0.97f)
                    .setMaxPlaybackSpeed(1.03f)
                    .build()
            )
        }
        val mediaItem = builder.build()
        exoPlayer.setMediaItem(mediaItem, startPositionMs.coerceAtLeast(0))
        exoPlayer.prepare()
        exoPlayer.playWhenReady = true
    }

    override fun pause() {
        exoPlayer.playWhenReady = false
    }

    override fun resume() {
        exoPlayer.playWhenReady = true
    }

    override fun togglePlayPause() {
        exoPlayer.playWhenReady = !exoPlayer.playWhenReady
    }

    override fun seekTo(positionMs: Long) {
        exoPlayer.seekTo(positionMs.coerceAtLeast(0))
    }

    override fun seekBy(offsetMs: Long) {
        val target = (exoPlayer.currentPosition + offsetMs).coerceAtLeast(0)
        exoPlayer.seekTo(target)
    }

    override fun stop() {
        exoPlayer.stop()
        exoPlayer.clearMediaItems()
    }

    override fun release() {
        scope.cancel()
        callbacks.clear()
        exoPlayer.release()
    }

    override fun setSpeed(speed: Float) {
        exoPlayer.playbackParameters = PlaybackParameters(speed.coerceIn(0.25f, 3.0f))
    }

    override fun setAudioTrack(index: Int) {
        val groups = exoPlayer.currentTracks.groups.filter { it.type == C.TRACK_TYPE_AUDIO }
        val target = groups.getOrNull(index) ?: return
        val trackGroup = target.mediaTrackGroup
        trackSelector.setParameters(
            trackSelector.buildUponParameters()
                .clearOverridesOfType(C.TRACK_TYPE_AUDIO)
                .addOverride(
                    androidx.media3.common.TrackSelectionOverride(trackGroup, listOf(0))
                )
        )
    }

    override fun setSubtitleTrack(index: Int) {
        if (index < 0) {
            trackSelector.setParameters(
                trackSelector.buildUponParameters()
                    .setIgnoredTextSelectionFlags(C.SELECTION_FLAG_FORCED)
            )
            return
        }
        val groups = exoPlayer.currentTracks.groups.filter { it.type == C.TRACK_TYPE_TEXT }
        val target = groups.getOrNull(index) ?: return
        val trackGroup = target.mediaTrackGroup
        trackSelector.setParameters(
            trackSelector.buildUponParameters()
                .clearOverridesOfType(C.TRACK_TYPE_TEXT)
                .setIgnoredTextSelectionFlags(0)
                .addOverride(
                    androidx.media3.common.TrackSelectionOverride(trackGroup, listOf(0))
                )
        )
    }

    override fun setScaleMode(mode: PlayerEngine.ScaleMode) {
        val resizeMode = when (mode) {
            PlayerEngine.ScaleMode.FIT -> androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FIT
            PlayerEngine.ScaleMode.FILL -> androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FILL
            PlayerEngine.ScaleMode.CENTER_CROP -> androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_ZOOM
            PlayerEngine.ScaleMode.ORIGINAL -> androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FIT
        }
        (attachedView as? PlayerView)?.resizeMode = resizeMode
    }

    override val audioTracks: List<PlayerEngine.TrackInfo>
        get() = extractTracks(C.TRACK_TYPE_AUDIO)

    override val subtitleTracks: List<PlayerEngine.TrackInfo>
        get() = extractTracks(C.TRACK_TYPE_TEXT)

    private fun extractTracks(trackType: Int): List<PlayerEngine.TrackInfo> {
        val list = mutableListOf<PlayerEngine.TrackInfo>()
        val tracks = exoPlayer.currentTracks
        var index = 0
        for (group in tracks.groups) {
            if (group.type == trackType) {
                for (i in 0 until group.length) {
                    val format = group.getTrackFormat(i)
                    val label = format.label ?: format.language ?: "Track ${i + 1}"
                    list.add(PlayerEngine.TrackInfo(index++, label, format.language))
                }
            }
        }
        return list
    }

    private fun liveMinBufferMs(): Int = when (performanceTier) {
        DevicePerformance.Tier.LOW -> 2_500
        DevicePerformance.Tier.MEDIUM -> 2_000
        DevicePerformance.Tier.HIGH -> 1_500
    }

    private fun liveMaxBufferMs(): Int = when (performanceTier) {
        DevicePerformance.Tier.LOW -> 9_000
        DevicePerformance.Tier.MEDIUM -> 7_000
        DevicePerformance.Tier.HIGH -> 5_000
    }

    private fun livePlaybackBufferMs(): Int = when (performanceTier) {
        DevicePerformance.Tier.LOW -> 1_400
        DevicePerformance.Tier.MEDIUM -> 1_100
        DevicePerformance.Tier.HIGH -> 800
    }

    private fun liveRebufferMs(): Int = when (performanceTier) {
        DevicePerformance.Tier.LOW -> 2_500
        DevicePerformance.Tier.MEDIUM -> 2_000
        DevicePerformance.Tier.HIGH -> 1_500
    }

    private fun liveTargetOffsetMs(): Long = when (performanceTier) {
        DevicePerformance.Tier.LOW -> 4_500L
        DevicePerformance.Tier.MEDIUM -> 3_500L
        DevicePerformance.Tier.HIGH -> 2_500L
    }

    private fun vodMinBufferMs(): Int = when (performanceTier) {
        DevicePerformance.Tier.LOW -> 8_000
        DevicePerformance.Tier.MEDIUM -> 6_000
        DevicePerformance.Tier.HIGH -> 5_000
    }

    override fun addCallback(callback: PlayerEngine.Callback) {
        callbacks.add(callback)
    }

    override fun removeCallback(callback: PlayerEngine.Callback) {
        callbacks.remove(callback)
    }

    private inner class PlayerListener : Player.Listener {
        override fun onPlaybackStateChanged(state: Int) {
            callbacks.forEach { it.onPlaybackStateChanged(state) }
            // STATE_BUFFERING is the canonical stall signal — far less noisy than isLoading.
            callbacks.forEach { it.onBuffering(state == Player.STATE_BUFFERING) }
        }

        override fun onIsPlayingChanged(playing: Boolean) {
            callbacks.forEach { it.onIsPlayingChanged(playing) }
        }

        override fun onPlayerError(error: PlaybackException) {
            val engineError = when (error.errorCode) {
                PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED,
                PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS,
                PlaybackException.ERROR_CODE_TIMEOUT ->
                    PlayerEngine.PlaybackError.Network("", error)

                PlaybackException.ERROR_CODE_DECODER_INIT_FAILED,
                PlaybackException.ERROR_CODE_DECODER_QUERY_FAILED ->
                    PlayerEngine.PlaybackError.Codec(error)

                else -> PlayerEngine.PlaybackError.Generic(error)
            }
            callbacks.forEach { it.onPlaybackError(engineError) }
        }

        override fun onPositionDiscontinuity(
            oldPosition: Player.PositionInfo,
            newPosition: Player.PositionInfo,
            reason: Int
        ) {
            callbacks.forEach {
                it.onPositionChanged(exoPlayer.currentPosition, exoPlayer.duration.coerceAtLeast(0))
            }
        }

        override fun onTracksChanged(tracks: Tracks) {
            callbacks.forEach {
                it.onTracksChanged(audioTracks, subtitleTracks)
            }
        }

        override fun onVideoSizeChanged(videoSize: VideoSize) {
            callbacks.forEach {
                it.onVideoSizeChanged(videoSize.width, videoSize.height)
            }
        }

        override fun onIsLoadingChanged(isLoading: Boolean) {
            // Buffering UI is driven by STATE_BUFFERING in onPlaybackStateChanged. isLoading is too
            // noisy (it fires for background preloading even while smoothly playing).
        }
    }
}
