@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package com.moalfarras.moplayer.ui.player

import android.content.Context
import android.net.Uri
import android.os.Build
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.ColorInfo
import androidx.media3.common.Format
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.Tracks
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.exoplayer.DefaultLivePlaybackSpeedControl
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.analytics.AnalyticsListener
import androidx.media3.exoplayer.drm.DrmSessionManagerProvider
import androidx.media3.exoplayer.hls.DefaultHlsExtractorFactory
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.LoadEventInfo
import androidx.media3.exoplayer.source.MediaLoadData
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.media3.exoplayer.upstream.DefaultLoadErrorHandlingPolicy
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.extractor.DefaultExtractorsFactory
import com.moalfarras.moplayer.core.Adaptive
import com.moalfarras.moplayer.core.PerformancePolicy
import com.moalfarras.moplayer.data.network.NetworkModule
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem as AppMediaItem
import java.io.IOException

internal val APP_USER_AGENT = "MoPlayerPro/${com.moalfarras.moplayerpro.BuildConfig.VERSION_NAME} AndroidTV Media3/1.11 LibVLC/3.7"

/** Player events PlayerScreen reacts to. All callbacks arrive on the main thread. */
internal class Media3Callbacks(
    val onIsPlayingChanged: (Boolean) -> Unit,
    val onPlaybackStateChanged: (Int) -> Unit,
    val onRenderedFirstFrame: () -> Unit,
    val onPlayerError: (PlaybackException) -> Unit,
    val onDurationChanged: (Long) -> Unit,
    /** READY with resolved tracks: whether the stream has video and audio. */
    val onTracksResolved: (hasVideo: Boolean, hasAudio: Boolean) -> Unit,
    /**
     * The stream has audio but no renderer supports any of its tracks, so Media3 plays the
     * picture silently without raising an error. Reported once per player, with the audio MIME types.
     */
    val onAudioUnsupported: (mimeTypes: List<String>) -> Unit,
    /** A failed load, with the URI reached after redirects and the response Content-Type. */
    val onLoadFailure: (finalUri: String, contentType: String, error: IOException) -> Unit,
)

/**
 * IPTV retry policy: keeps Media3's fatal classification (parser, cleartext, file-not-found),
 * gives permanent HTTP errors a single quick retry, and backs off quickly for everything else.
 */
private class IptvLoadErrorPolicy(private val isLive: Boolean) : DefaultLoadErrorHandlingPolicy() {
    override fun getRetryDelayMsFor(loadErrorInfo: LoadErrorHandlingPolicy.LoadErrorInfo): Long {
        if (super.getRetryDelayMsFor(loadErrorInfo) == C.TIME_UNSET) return C.TIME_UNSET
        return iptvRetryDelayMs(isLive, httpStatusOf(loadErrorInfo.exception), loadErrorInfo.errorCount)
    }

    override fun getMinimumLoadableRetryCount(dataType: Int): Int = iptvMinimumLoadableRetryCount(isLive)
}

/**
 * Routes HLS to a factory with the IPTV TS extractor flags; everything else (and HLS with an
 * imported subtitle, which only DefaultMediaSourceFactory can merge) goes to the default factory.
 * Because the player owns this factory, every setMediaItem call (start, retry, subtitle import)
 * gets the same tuned pipeline.
 */
private class IptvMediaSourceFactory(
    private val hls: HlsMediaSource.Factory,
    private val other: DefaultMediaSourceFactory,
) : MediaSource.Factory {
    override fun createMediaSource(mediaItem: MediaItem): MediaSource {
        val config = mediaItem.localConfiguration
        val useHls = config != null &&
            config.mimeType == MimeTypes.APPLICATION_M3U8 &&
            config.subtitleConfigurations.isEmpty() &&
            !config.uri.toString().startsWith("rtsp://", ignoreCase = true)
        return if (useHls) hls.createMediaSource(mediaItem) else other.createMediaSource(mediaItem)
    }

    override fun setDrmSessionManagerProvider(drmSessionManagerProvider: DrmSessionManagerProvider): MediaSource.Factory = apply {
        hls.setDrmSessionManagerProvider(drmSessionManagerProvider)
        other.setDrmSessionManagerProvider(drmSessionManagerProvider)
    }

    override fun setLoadErrorHandlingPolicy(loadErrorHandlingPolicy: LoadErrorHandlingPolicy): MediaSource.Factory = apply {
        hls.setLoadErrorHandlingPolicy(loadErrorHandlingPolicy)
        other.setLoadErrorHandlingPolicy(loadErrorHandlingPolicy)
    }

    override fun getSupportedTypes(): IntArray = other.supportedTypes
}

/**
 * Builds an ExoPlayer for one stream request WITHOUT loading it. PlayerScreen sets the media item
 * and prepares from an effect, after the previous player has been released, so two provider
 * connections are never open at the same time during a zap.
 */
internal fun buildExoPlayer(
    context: Context,
    request: StreamRequest,
    isLive: Boolean,
    performancePolicy: PerformancePolicy,
    callbacks: Media3Callbacks,
): ExoPlayer {
    val isRtsp = request.uri.startsWith("rtsp://", ignoreCase = true)
    val device = Adaptive.performanceInfo(context)
    val liveProfile = liveProfileFor(context, performancePolicy)
    val budget = playbackBufferBudget(device.memoryClassMb, device.isLowRam, device.tier, isLive)
    val loadControl = DefaultLoadControl.Builder()
        .apply {
            if (isLive) {
                setBufferDurationsMs(
                    liveProfile.minBufferMs,
                    liveProfile.maxBufferMs,
                    liveProfile.bufferForPlaybackMs,
                    liveProfile.bufferForPlaybackAfterRebufferMs,
                )
            } else {
                setBufferDurationsMs(16_000, 60_000, 1_500, 4_000)
            }
        }
        // The buffer lives on the Java heap: bound it by the heap, not only by time.
        .setTargetBufferBytes(budget.targetBytes)
        .setPrioritizeTimeOverSizeThresholds(budget.prioritizeTimeOverSize)
        .build()
    val requestHeaders = request.headers.filterKeys { !it.equals("User-Agent", ignoreCase = true) }
    val httpFactory = OkHttpDataSource.Factory(NetworkModule.playbackOkHttp)
        .setUserAgent(request.headers["User-Agent"] ?: APP_USER_AGENT)
        .setDefaultRequestProperties(requestHeaders)
    val tsExtractorFlags = liveTsExtractorFlags()
    val extractorsFactory = DefaultExtractorsFactory().setTsExtractorFlags(tsExtractorFlags)
    val defaultFactory = if (isRtsp) {
        DefaultMediaSourceFactory(context, extractorsFactory)
    } else {
        // file:// and content:// (an imported subtitle) must not go through OkHttp, which rejects
        // them as malformed URLs; DefaultDataSource routes them locally and http(s) to OkHttp.
        DefaultMediaSourceFactory(DefaultDataSource.Factory(context, httpFactory), extractorsFactory)
    }
    if (isLive) {
        defaultFactory
            .setLiveTargetOffsetMs(liveProfile.targetOffsetMs)
            .setLiveMinOffsetMs(liveProfile.minOffsetMs)
            .setLiveMaxOffsetMs(liveProfile.maxOffsetMs)
            .setLiveMinSpeed(liveProfile.minPlaybackSpeed)
            .setLiveMaxSpeed(liveProfile.maxPlaybackSpeed)
    }
    val hlsFactory = HlsMediaSource.Factory(httpFactory)
        .setAllowChunklessPreparation(true)
        .setExtractorFactory(DefaultHlsExtractorFactory(tsExtractorFlags, true))
    val mediaSourceFactory = IptvMediaSourceFactory(hlsFactory, defaultFactory)
        .setLoadErrorHandlingPolicy(IptvLoadErrorPolicy(isLive))

    val videoHeight = if (isLive) liveSafeMaxVideoHeight(performancePolicy.maxVideoHeight) else performancePolicy.maxVideoHeight
    val trackSelector = DefaultTrackSelector(context).apply {
        val builder = buildUponParameters()
            .setForceHighestSupportedBitrate(false)
            .setAllowVideoNonSeamlessAdaptiveness(true)
            .setAllowVideoMixedMimeTypeAdaptiveness(true)
            .setAllowVideoMixedDecoderSupportAdaptiveness(true)
            .setAllowAudioMixedMimeTypeAdaptiveness(true)
            .setAllowAudioMixedSampleRateAdaptiveness(true)
            .setAllowAudioMixedChannelCountAdaptiveness(true)
            .setAllowAudioMixedDecoderSupportAdaptiveness(true)
            .setMaxVideoSize(widthForHeight(videoHeight), videoHeight)
            .setExceedVideoConstraintsIfNecessary(true)
            .setExceedAudioConstraintsIfNecessary(true)
            .setExceedRendererCapabilitiesIfNecessary(true)
        if (performancePolicy.isPerformance || isLive) {
            builder
                .setPreferredVideoMimeTypes(
                    MimeTypes.VIDEO_H264,
                    MimeTypes.VIDEO_H265,
                    MimeTypes.VIDEO_AV1,
                    MimeTypes.VIDEO_VP9,
                    MimeTypes.VIDEO_MP4V,
                )
                .setMaxVideoBitrate(if (isLive) liveSafeMaxBitrate(videoHeight) else 8_000_000)
        }
        parameters = builder.build()
    }
    val renderersFactory = IptvRenderersFactory(context)
        .setEnableDecoderFallback(true)
        .setEnableAudioOutputPlaybackParameters(true)
        .setAllowedVideoJoiningTimeMs(if (isLive) 7_000L else 5_000L)
    if (shouldForceAsyncCodecQueueing(Build.VERSION.SDK_INT)) {
        renderersFactory.forceEnableMediaCodecAsynchronousQueueing()
    }
    return ExoPlayer.Builder(context, renderersFactory)
        .setTrackSelector(trackSelector)
        .setLoadControl(loadControl)
        .setLivePlaybackSpeedControl(
            DefaultLivePlaybackSpeedControl.Builder()
                .setFallbackMinPlaybackSpeed(liveProfile.minPlaybackSpeed)
                .setFallbackMaxPlaybackSpeed(liveProfile.maxPlaybackSpeed)
                .setTargetLiveOffsetIncrementOnRebufferMs((liveProfile.maxOffsetMs - liveProfile.targetOffsetMs).coerceAtLeast(3_000L))
                .build(),
        )
        .setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(C.USAGE_MEDIA)
                .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                .build(),
            true,
        )
        .setMediaSourceFactory(mediaSourceFactory)
        .setSeekForwardIncrementMs(10_000)
        .setSeekBackIncrementMs(10_000)
        .build()
        .apply {
            // Holds CPU + Wi-Fi locks only while actually playing (replaces a manual wake lock).
            setWakeMode(C.WAKE_MODE_NETWORK)
            setVideoScalingMode(C.VIDEO_SCALING_MODE_SCALE_TO_FIT)
            addListener(Media3EventBridge(this, isLive, callbacks))
            addAnalyticsListener(object : AnalyticsListener {
                override fun onLoadError(
                    eventTime: AnalyticsListener.EventTime,
                    loadEventInfo: LoadEventInfo,
                    mediaLoadData: MediaLoadData,
                    error: IOException,
                    wasCanceled: Boolean,
                ) {
                    val contentType = loadEventInfo.responseHeaders.entries
                        .firstOrNull { it.key.equals("Content-Type", ignoreCase = true) }
                        ?.value
                        ?.firstOrNull()
                        .orEmpty()
                    callbacks.onLoadFailure(loadEventInfo.uri.toString(), contentType, error)
                }
            })
        }
}

private class Media3EventBridge(
    private val player: ExoPlayer,
    private val isLive: Boolean,
    private val callbacks: Media3Callbacks,
) : Player.Listener {
    override fun onIsPlayingChanged(isPlaying: Boolean) = callbacks.onIsPlayingChanged(isPlaying)

    override fun onRenderedFirstFrame() = callbacks.onRenderedFirstFrame()

    override fun onPlaybackStateChanged(playbackState: Int) {
        callbacks.onPlaybackStateChanged(playbackState)
        if (player.duration > 0) callbacks.onDurationChanged(player.duration)
    }

    override fun onPlayerError(error: PlaybackException) {
        if (isLive && error.errorCode == PlaybackException.ERROR_CODE_BEHIND_LIVE_WINDOW) {
            player.seekToDefaultPosition()
            player.prepare()
        } else {
            callbacks.onPlayerError(error)
        }
    }

    private var audioUnsupportedReported = false

    override fun onEvents(player: Player, events: Player.Events) {
        if (events.contains(Player.EVENT_TIMELINE_CHANGED) || events.contains(Player.EVENT_TRACKS_CHANGED)) {
            callbacks.onDurationChanged(player.duration.coerceAtLeast(1L))
        }
        val tracksMayHaveSettled = events.contains(Player.EVENT_TRACKS_CHANGED) || events.contains(Player.EVENT_PLAYBACK_STATE_CHANGED)
        val tracks = player.currentTracks
        if (tracksMayHaveSettled && player.playbackState == Player.STATE_READY && !tracks.isEmpty) {
            callbacks.onTracksResolved(tracks.containsType(C.TRACK_TYPE_VIDEO), tracks.containsType(C.TRACK_TYPE_AUDIO))
            if (!audioUnsupportedReported &&
                tracks.containsType(C.TRACK_TYPE_AUDIO) &&
                !tracks.isTypeSupported(C.TRACK_TYPE_AUDIO, true)
            ) {
                audioUnsupportedReported = true
                callbacks.onAudioUnsupported(tracks.audioMimeTypes())
            }
        }
    }
}

private fun Tracks.audioMimeTypes(): List<String> =
    groups.filter { it.type == C.TRACK_TYPE_AUDIO }
        .flatMap { group -> (0 until group.length).mapNotNull { group.getTrackFormat(it).sampleMimeType } }
        .distinct()

/**
 * The media item for a request, with session metadata so Google TV "Now playing" and Bluetooth
 * controllers show the channel or title, its group and artwork.
 */
internal fun buildPlayableMediaItem(
    request: StreamRequest,
    item: AppMediaItem,
    isLive: Boolean,
    liveProfile: LivePlaybackProfile,
    externalSubtitle: MediaItem.SubtitleConfiguration? = null,
): MediaItem {
    val metadata = MediaMetadata.Builder()
        .setTitle(item.title)
        .setDisplayTitle(item.title)
        .setIsPlayable(true)
        .setIsBrowsable(false)
        .setMediaType(
            when (item.type) {
                ContentType.LIVE -> MediaMetadata.MEDIA_TYPE_TV_CHANNEL
                ContentType.MOVIE -> MediaMetadata.MEDIA_TYPE_MOVIE
                ContentType.EPISODE -> MediaMetadata.MEDIA_TYPE_TV_SHOW
                else -> MediaMetadata.MEDIA_TYPE_VIDEO
            },
        )
        .apply {
            if (item.categoryName.isNotBlank()) {
                setArtist(item.categoryName)
                setSubtitle(item.categoryName)
                if (isLive) setStation(item.categoryName)
            }
            val artwork = item.posterUrl.ifBlank { item.backdropUrl }
            if (artwork.startsWith("http://", ignoreCase = true) || artwork.startsWith("https://", ignoreCase = true)) {
                setArtworkUri(Uri.parse(artwork))
            }
        }
        .build()
    return MediaItem.Builder()
        .setUri(request.uri)
        .setMimeType(request.mimeType)
        .setMediaId(item.id)
        .setMediaMetadata(metadata)
        .apply {
            if (isLive) {
                setLiveConfiguration(
                    MediaItem.LiveConfiguration.Builder()
                        .setTargetOffsetMs(liveProfile.targetOffsetMs)
                        .setMinOffsetMs(liveProfile.minOffsetMs)
                        .setMaxOffsetMs(liveProfile.maxOffsetMs)
                        .setMinPlaybackSpeed(liveProfile.minPlaybackSpeed)
                        .setMaxPlaybackSpeed(liveProfile.maxPlaybackSpeed)
                        .build(),
                )
            }
            // A user-imported .srt/.vtt for a VOD with no built-in captions; DefaultMediaSourceFactory
            // merges it into the timeline as a selectable text track.
            if (externalSubtitle != null) setSubtitleConfigurations(listOf(externalSubtitle))
        }
        .build()
}

internal fun liveProfileFor(context: Context, policy: PerformancePolicy): LivePlaybackProfile {
    val device = Adaptive.performanceInfo(context)
    return livePlaybackProfile(
        isPerformanceMode = policy.isPerformance,
        policyLiveBufferMs = policy.liveBufferMs,
        largeBuffer = hasRoomForLargeLiveBuffer(device.memoryClassMb, device.isLowRam),
    )
}

internal fun applyLiveQualityMode(player: ExoPlayer, mode: LiveQualityMode, maxVideoHeight: Int = 2160) {
    val defaultSelectorBuilder = (player.trackSelectionParameters as? DefaultTrackSelector.Parameters)
        ?.buildUpon()
        ?.setExceedVideoConstraintsIfNecessary(true)
        ?.setExceedAudioConstraintsIfNecessary(true)
        ?.setExceedRendererCapabilitiesIfNecessary(true)
    val builder = defaultSelectorBuilder ?: player.trackSelectionParameters.buildUpon()
    val liveCapHeight = liveSafeMaxVideoHeight(maxVideoHeight)
    when (mode) {
        LiveQualityMode.AUTO -> builder
            .setForceHighestSupportedBitrate(false)
            .setMaxVideoSize(widthForHeight(liveCapHeight), liveCapHeight)
            .setMaxVideoBitrate(liveSafeMaxBitrate(liveCapHeight))
        LiveQualityMode.BEST -> {
            val bestHeight = if (Build.VERSION.SDK_INT < 26) maxVideoHeight.coerceAtMost(1080) else maxOf(maxVideoHeight, 2160).coerceAtMost(2160)
            builder
                .setForceHighestSupportedBitrate(false)
                .setMaxVideoSize(if (bestHeight <= 1080) 1920 else 3840, bestHeight)
                .setMaxVideoBitrate(liveSafeMaxBitrate(bestHeight))
        }
        LiveQualityMode.ULTRA -> {
            val ultraHeight = liveUltraMaxVideoHeight(maxVideoHeight)
            builder
                .setForceHighestSupportedBitrate(false)
                .setMaxVideoSize(if (ultraHeight <= 2160) 3840 else 7680, ultraHeight)
                .setMaxVideoBitrate(liveSafeMaxBitrate(ultraHeight))
        }
        LiveQualityMode.STABLE -> builder
            .setForceHighestSupportedBitrate(false)
            .setMaxVideoSize(widthForHeight(maxVideoHeight).coerceAtMost(1280), maxVideoHeight.coerceAtMost(720))
            .setMaxVideoBitrate(2_500_000)
    }
    player.trackSelectionParameters = builder.build()
}

/** "FHD | HDR | AVC": HDR only for a real HDR transfer (PQ/HLG), not for any stream that reports color info. */
internal fun Format?.videoSignal(): String {
    if (this == null) return ""
    return videoSignalLabel(width, height, ColorInfo.isTransferHdr(colorInfo), sampleMimeType)
}
