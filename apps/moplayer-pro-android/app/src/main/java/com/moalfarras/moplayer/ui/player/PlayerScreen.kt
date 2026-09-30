@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package com.moalfarras.moplayer.ui.player

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.KeyEvent as AndroidKeyEvent
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.SkipNext
import androidx.compose.material.icons.rounded.SwapHoriz
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.currentStateAsState
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.Util
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.ui.PlayerView
import androidx.media3.ui.TrackSelectionDialogBuilder
import com.moalfarras.moplayer.core.Adaptive
import com.moalfarras.moplayer.core.PerformancePolicy
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem as AppMediaItem
import com.moalfarras.moplayer.domain.model.VideoSizeMode
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.PlayerStrings
import com.moalfarras.moplayer.ui.i18n.fill
import com.moalfarras.moplayer.ui.i18n.isolate
import com.moalfarras.moplayer.ui.i18n.ltr
import com.moalfarras.moplayer.ui.i18n.player
import com.moalfarras.moplayerpro.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private val VideoSizeModes = listOf(VideoSizeMode.AUTO, VideoSizeMode.FIT, VideoSizeMode.FILL, VideoSizeMode.ZOOM)

/** Keys whose auto-repeat must not toggle anything again while the player root owns the press. */
private val PlayerToggleKeys = setOf(
    Key.Enter,
    Key.DirectionCenter,
    Key.NumPadEnter,
    Key.Spacebar,
    Key.MediaPlay,
    Key.MediaPause,
    Key.MediaPlayPause,
)

@Composable
fun PlayerScreen(
    item: AppMediaItem,
    onBack: (positionMs: Long, durationMs: Long) -> Unit,
    onProgress: (item: AppMediaItem, positionMs: Long, durationMs: Long) -> Unit,
    relatedItems: List<AppMediaItem>,
    onPlayItem: (AppMediaItem) -> Unit,
    onTripleOk: () -> Unit,
    accent: Color,
    preferredPlayer: String = "media3",
    videoSizeMode: VideoSizeMode = VideoSizeMode.AUTO,
    onVideoSizeMode: (VideoSizeMode) -> Unit = {},
    performancePolicy: PerformancePolicy,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val strings = LocalStrings.current
    val ps = strings.player
    val isRtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val isTv = remember(context) { Adaptive.isTv(context) }
    val isLive = item.type == ContentType.LIVE
    val latestRelated by rememberUpdatedState(relatedItems)
    val streamRequest = remember(item.streamUrl) { parseStreamRequest(item.streamUrl) }
    val normalizedPreferred = remember(preferredPlayer, performancePolicy.mode, streamRequest.uri, streamRequest.mimeType, isLive) {
        when (preferredPlayer) {
            "internal" -> "auto"
            "media3" -> if ((isLive && performancePolicy.isPerformance) || shouldStartWithLibVlc(streamRequest)) "auto" else "media3"
            else -> preferredPlayer.ifBlank { "media3" }
        }
    }
    var route by remember(item.id, normalizedPreferred, performancePolicy.mode) {
        mutableStateOf(
            when {
                normalizedPreferred == "ask" && !isLive -> null
                normalizedPreferred == "ask" -> "auto"
                isLive && normalizedPreferred == "media3" -> "auto"
                else -> normalizedPreferred
            },
        )
    }
    // Where a cancelled player picker returns when it was opened from playback (null: leave the player).
    var routeBeforePicker by remember(item.id) { mutableStateOf<String?>(null) }
    var internalEngine by remember(item.id, route, streamRequest.uri, performancePolicy.mode) {
        mutableStateOf(if (route == "auto") preferredAutoEngine(streamRequest, isLive, performancePolicy) else InternalPlaybackEngine.MEDIA3)
    }
    val session = remember { PlayerSessionState() }
    val ui = remember(item.id) {
        PlayerItemUiState(isLive, item.isFavorite, item.watchPositionMs.coerceAtLeast(0), item.watchDurationMs.coerceAtLeast(1L))
    }
    val attempt = remember(item.id, streamRequest.uri) {
        PlaybackAttemptState(preferredLiveAutoEngine(streamRequest, performancePolicy), item.watchPositionMs.coerceAtLeast(0))
    }
    var selectedVideoSizeMode by remember(item.id, videoSizeMode) { mutableStateOf(videoSizeMode) }
    var liveQualityMode by remember(performancePolicy.mode) {
        mutableStateOf(if (performancePolicy.isPerformance) LiveQualityMode.STABLE else LiveQualityMode.AUTO)
    }
    val playerFocusRequester = remember { FocusRequester() }
    val playPauseFocusRequester = remember { FocusRequester() }
    val errorFocusRequester = remember { FocusRequester() }
    val liveStallRecoveryLimit = if (performancePolicy.isPerformance || Build.VERSION.SDK_INT < 26) 1 else LIVE_STALL_RECOVERY_LIMIT
    val videoSizeLabel = selectedVideoSizeMode.displayLabel(ps)

    LaunchedEffect(item.id, route, ui.externalLaunchNonce) {
        ui.launchMessage = null
        val resolvedRoute = route ?: return@LaunchedEffect
        if (resolvedRoute == "media3" || resolvedRoute == "auto") return@LaunchedEffect
        val result = openExternalPlayer(context, streamRequest, item.title, resolvedRoute, ps)
        if (result.success) onBack(0, 0) else ui.launchMessage = result.message
    }

    if (route == null) {
        PlayerRoutePicker(
            title = item.title,
            onSelect = { selected ->
                routeBeforePicker = null
                route = selected
            },
            onDismiss = {
                val previous = routeBeforePicker
                routeBeforePicker = null
                if (previous != null) route = previous else onBack(0, 0)
            },
        )
        return
    }
    if (route != "media3" && route != "auto") {
        ExternalLaunchScreen(
            title = item.title,
            message = ui.launchMessage ?: ps.openingExternal,
            onRetrySame = {
                ui.launchMessage = null
                ui.externalLaunchNonce++
            },
            onUseMedia3 = {
                ui.launchMessage = null
                route = "media3"
                internalEngine = InternalPlaybackEngine.MEDIA3
            },
            onPickAnother = { route = null },
            onBack = { onBack(0, 0) },
        )
        return
    }

    val playbackRequest = remember(
        streamRequest,
        attempt.resolvedLiveRequest,
        attempt.forceHlsForLiveRedirect,
        attempt.forceLibVlcForLive,
        attempt.vodFallbackRequest,
        isLive,
    ) {
        if (!isLive) {
            attempt.vodFallbackRequest ?: streamRequest
        } else {
            // LibVLC follows redirects itself, so an immediate VLC start keeps the original link.
            val keepOriginalForImmediateVlc = attempt.forceLibVlcForLive && !attempt.forceHlsForLiveRedirect
            val resolved = if (keepOriginalForImmediateVlc) streamRequest else attempt.resolvedLiveRequest ?: streamRequest
            if (attempt.forceHlsForLiveRedirect) resolved.copy(mimeType = MimeTypes.APPLICATION_M3U8) else resolved
        }
    }
    val useLibVlc = route == "auto" && (
        internalEngine == InternalPlaybackEngine.LIBVLC ||
            (if (isLive) attempt.forceLibVlcForLive else attempt.forceLibVlcForVod)
        )

    // ── Failure handling (no ExoPlayer reference needed) ────────────────────────────────────

    fun isForeground(): Boolean = lifecycleOwner.lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED)

    fun telemetry(summary: String) = PlaybackTelemetryStore.event(item.id, item.title, isLive, summary)

    fun offlineAwareIssue(kind: PlaybackIssueKind): PlaybackIssue =
        if (context.hasInternetConnection()) PlaybackIssue(kind) else PlaybackIssue(PlaybackIssueKind.NO_INTERNET)

    fun showError(issue: PlaybackIssue) {
        attempt.isBuffering = false
        attempt.reconnectingSince = 0L
        attempt.playbackError = issue
        telemetry("error shown: ${issue.kind}${issue.httpStatus?.let { " http=$it" }.orEmpty()}; ${playbackRequest.uri.safeStreamLabel()}")
    }

    fun markPlaying() {
        attempt.wasPlaying = true
        attempt.liveOpeningGuard = false
        if (attempt.reconnectingSince > 0L) {
            attempt.reconnectingSince = 0L
            attempt.reconnectAttempt = 0
            telemetry("reconnected")
        }
        session.liveAutoRecoveryAttempts = 0
        session.liveAutoRecoveryVisited = emptySet()
        session.userZapInFlight = false
    }

    fun reconnectWindowExpired(): Boolean =
        attempt.reconnectingSince > 0L &&
            session.networkAvailable &&
            SystemClock.elapsedRealtime() - attempt.reconnectingSince > LIVE_RECONNECT_WINDOW_MS

    /** Keeps the same channel and engine and re-opens it with backoff (see the reconnect effect). */
    fun startReconnect() {
        if (reconnectWindowExpired()) {
            showError(offlineAwareIssue(PlaybackIssueKind.UNSTABLE))
            return
        }
        if (attempt.reconnectingSince == 0L) {
            attempt.reconnectingSince = SystemClock.elapsedRealtime()
            telemetry("reconnecting; ${playbackRequest.uri.safeStreamLabel()}")
        }
        attempt.playbackError = null
        attempt.isBuffering = true
        attempt.reconnectNonce++
    }

    /** Last resort before the error card: a lower-quality feed of the SAME channel, announced on screen. */
    fun switchToCompatibleAlternative(): Boolean {
        if (!isLive || attempt.triedCompatibleLiveAlternative || session.userZapInFlight) return false
        val visited = session.liveAutoRecoveryVisited + item.liveRecoveryKey()
        if (session.liveAutoRecoveryAttempts >= LIVE_AUTO_RECOVERY_SWITCH_LIMIT) {
            session.liveAutoRecoveryVisited = visited
            return false
        }
        val alternative = latestRelated.bestCompatibleLiveAlternative(
            current = item,
            maxVideoHeight = performancePolicy.maxVideoHeight,
            excludedKeys = visited,
        )
        if (alternative == null) {
            session.liveAutoRecoveryVisited = visited
            return false
        }
        session.liveAutoRecoveryAttempts += 1
        session.liveAutoRecoveryVisited = visited + alternative.liveRecoveryKey()
        session.nextSwitchIsRecovery = true
        session.recoveryNotice = ps.recoveredNotice.fill(item.title.isolate(), alternative.title.isolate())
        session.recoveryNoticeNonce++
        attempt.triedCompatibleLiveAlternative = true
        telemetry("same-channel variant: ${alternative.title}")
        onPlayItem(alternative)
        return true
    }

    fun retryMedia3WithAlternateSurface(): Boolean {
        if (!isLive || useLibVlc || attempt.media3SurfaceAttempt >= MEDIA3_SURFACE_RETRY_LIMIT) return false
        attempt.media3SurfaceAttempt += 1
        attempt.playbackError = null
        attempt.isBuffering = true
        attempt.liveOpeningGuard = true
        attempt.liveFirstFrameRendered = false
        attempt.liveReadyWithoutVideoAt = 0L
        attempt.liveConsecutiveFailures = 0
        attempt.userPaused = false
        telemetry("switching video surface ${attempt.media3SurfaceAttempt}/$MEDIA3_SURFACE_RETRY_LIMIT")
        return true
    }

    fun switchLiveEngine(toLibVlc: Boolean) {
        if (toLibVlc) {
            attempt.triedLibVlcForLive = true
            attempt.forceLibVlcForLive = true
            internalEngine = InternalPlaybackEngine.LIBVLC
        } else {
            attempt.triedMedia3ForLive = true
            attempt.forceLibVlcForLive = false
            internalEngine = InternalPlaybackEngine.MEDIA3
        }
        attempt.playbackError = null
        attempt.isBuffering = true
        attempt.liveFirstFrameRendered = false
        attempt.liveReadyWithoutVideoAt = 0L
        attempt.liveConsecutiveFailures = 0
        attempt.audioOnly = false
        attempt.userPaused = false
        telemetry("live engine -> ${if (toLibVlc) "LibVLC" else "Media3"}")
    }

    fun switchVodEngine(toLibVlc: Boolean) {
        attempt.triedLibVlcForVod = true
        attempt.forceLibVlcForVod = toLibVlc
        route = if (toLibVlc) "auto" else "media3"
        if (toLibVlc) internalEngine = InternalPlaybackEngine.LIBVLC
        attempt.playbackError = null
        attempt.isBuffering = true
        attempt.vodFirstFrameRendered = false
        attempt.vodReadyAt = 0L
        attempt.vodOpeningGuard = true
        attempt.vodEnded = false
        attempt.audioOnly = false
        attempt.userPaused = false
        telemetry("vod engine -> ${if (toLibVlc) "LibVLC" else "Media3"}")
    }

    fun switchToVodFallbackStream(errorCode: Int, httpStatus: Int?, cause: Throwable?): Boolean {
        if (isLive || useLibVlc || attempt.vodFallbackSwitches >= VOD_EXTENSION_FALLBACK_LIMIT) return false
        if (!shouldTryVodStreamFallback(errorCode, httpStatus, cause)) return false
        val visited = attempt.vodFallbackVisitedUris + playbackRequest.uri
        val alternative = nextVodFallbackRequest(streamRequest, playbackRequest, item, visited) ?: return false
        attempt.vodFallbackVisitedUris = visited + alternative.uri
        attempt.vodFallbackSwitches += 1
        attempt.vodFallbackRequest = alternative
        attempt.playbackError = null
        attempt.isBuffering = true
        attempt.vodFirstFrameRendered = false
        attempt.vodReadyAt = 0L
        attempt.vodOpeningGuard = true
        telemetry("vod container fallback -> ${alternative.uri.safeStreamLabel()}")
        return true
    }

    /** A ".ts" link that is really HLS/DASH: reopen what Media3 actually reached. */
    fun applyLiveRedirect() {
        val hint = attempt.liveRedirectHint
        if (hint != null && hint.isManifest()) attempt.resolvedLiveRequest = hint else attempt.forceHlsForLiveRedirect = true
        attempt.playbackError = null
        attempt.isBuffering = true
        attempt.liveFirstFrameRendered = false
        attempt.liveReadyWithoutVideoAt = 0L
        telemetry("live .ts link serves a manifest; reopening as ${hint?.mimeType ?: MimeTypes.APPLICATION_M3U8}")
    }

    fun handleLiveEnded() {
        telemetry("live stream ended by server")
        val step = liveErrorRecoveryStep(
            failure = PlaybackFailureClass.TRANSIENT,
            wasPlaying = attempt.wasPlaying,
            reconnectWindowExpired = reconnectWindowExpired(),
            startupRetryAvailable = attempt.startupEndedRetries < 1,
            canForceHls = false,
            canSwitchEngine = !useLibVlc && !attempt.triedLibVlcForLive && isLibVlcSafeForRequest(playbackRequest),
            canRetrySurface = false,
            permanentReconnectAvailable = false,
        )
        when (step) {
            LiveRecoveryStep.RECONNECT_IN_PLACE -> if (attempt.wasPlaying) {
                startReconnect()
            } else {
                attempt.startupEndedRetries += 1
                attempt.isBuffering = true
                attempt.reconnectNonce++
            }
            LiveRecoveryStep.SWITCH_ENGINE -> switchLiveEngine(toLibVlc = true)
            LiveRecoveryStep.SIBLING_VARIANT -> if (!switchToCompatibleAlternative()) showError(offlineAwareIssue(PlaybackIssueKind.LIVE_STOPPED))
            else -> showError(offlineAwareIssue(PlaybackIssueKind.LIVE_STOPPED))
        }
    }

    fun markVodEnded() {
        if (attempt.vodEnded) return
        attempt.vodEnded = true
        attempt.isBuffering = false
        if (ui.duration > 1) onProgress(item, ui.duration, ui.duration)
        ui.showControls = true
        session.lastInteraction = System.currentTimeMillis()
    }

    fun onMedia3State(state: Int) {
        attempt.isBuffering = state == Player.STATE_BUFFERING || state == Player.STATE_IDLE
        when (state) {
            Player.STATE_READY -> {
                val now = SystemClock.elapsedRealtime()
                if (isLive && !attempt.liveFirstFrameRendered && !attempt.audioOnly) attempt.liveReadyWithoutVideoAt = now
                if (!isLive && !attempt.vodFirstFrameRendered && !attempt.audioOnly && attempt.vodReadyAt == 0L) attempt.vodReadyAt = now
                attempt.liveConsecutiveFailures = 0
                attempt.playbackError = null
                attempt.vodEnded = false
                session.userZapInFlight = false
                // Audio-only streams never render a first frame, so READY is their "playing again".
                if (attempt.audioOnly && attempt.reconnectingSince > 0L) markPlaying()
            }
            Player.STATE_ENDED -> if (isLive) {
                attempt.isBuffering = true
                handleLiveEnded()
            } else {
                markVodEnded()
            }
        }
    }

    fun onFirstFrame() {
        attempt.liveFirstFrameRendered = true
        attempt.liveReadyWithoutVideoAt = 0L
        attempt.vodFirstFrameRendered = true
        attempt.vodReadyAt = 0L
        attempt.vodOpeningGuard = false
        markPlaying()
    }

    fun onTracksResolved(hasVideo: Boolean, hasAudio: Boolean) {
        val audioOnly = isAudioOnlyTracks(tracksEmpty = false, hasVideo = hasVideo, hasAudio = hasAudio)
        if (audioOnly && !attempt.audioOnly) {
            attempt.audioOnly = true
            attempt.liveReadyWithoutVideoAt = 0L
            attempt.vodReadyAt = 0L
            markPlaying()
            telemetry("audio-only stream")
        } else if (hasVideo && attempt.audioOnly) {
            attempt.audioOnly = false
            val now = SystemClock.elapsedRealtime()
            if (isLive && !attempt.liveFirstFrameRendered) attempt.liveReadyWithoutVideoAt = now
            if (!isLive && !attempt.vodFirstFrameRendered) attempt.vodReadyAt = now
        }
    }

    fun handleMedia3Error(error: PlaybackException) {
        session.userZapInFlight = false
        val httpStatus = httpStatusOf(error.cause)
        val failure = classifyPlaybackFailure(error.errorCode, httpStatus, error.cause)
        val issue = classifyPlaybackIssue(error.errorCode, httpStatus, error.cause, context.hasInternetConnection(), isLive)
        telemetry(
            "media3 ${error.errorCodeName}; http=${httpStatus ?: "-"}; class=$failure; " +
                "cause=${error.cause?.javaClass?.simpleName.orEmpty()}; ${playbackRequest.uri.safeStreamLabel()}",
        )
        if (isLive) {
            val step = liveErrorRecoveryStep(
                failure = failure,
                wasPlaying = attempt.wasPlaying,
                reconnectWindowExpired = reconnectWindowExpired(),
                startupRetryAvailable = false,
                canForceHls = streamRequest.uri.hasLiveTsHint() &&
                    !attempt.forceHlsForLiveRedirect &&
                    attempt.resolvedLiveRequest == null &&
                    error.cause.hasUnrecognizedInputFormat(),
                canSwitchEngine = !attempt.triedLibVlcForLive && isLibVlcSafeForRequest(playbackRequest),
                canRetrySurface = attempt.media3SurfaceAttempt < MEDIA3_SURFACE_RETRY_LIMIT && isDecoderFailure(error.errorCode),
                permanentReconnectAvailable = attempt.reconnectAttempt < LIVE_PERMANENT_RECONNECT_LIMIT,
            )
            when (step) {
                LiveRecoveryStep.RECONNECT_IN_PLACE -> startReconnect()
                LiveRecoveryStep.FORCE_HLS -> applyLiveRedirect()
                LiveRecoveryStep.SWITCH_ENGINE -> switchLiveEngine(toLibVlc = true)
                LiveRecoveryStep.ALTERNATE_SURFACE -> retryMedia3WithAlternateSurface()
                LiveRecoveryStep.SIBLING_VARIANT -> if (!switchToCompatibleAlternative()) showError(issue)
                LiveRecoveryStep.SHOW_ERROR -> showError(issue)
            }
            return
        }
        when {
            switchToVodFallbackStream(error.errorCode, httpStatus, error.cause) -> Unit
            failure == PlaybackFailureClass.FORMAT && !attempt.triedLibVlcForVod && isLibVlcSafeForRequest(playbackRequest) ->
                switchVodEngine(toLibVlc = true)
            else -> showError(issue)
        }
    }

    fun handleLibVlcFailure() {
        session.userZapInFlight = false
        telemetry("libvlc error; ${playbackRequest.uri.safeStreamLabel()}")
        if (!isLive) {
            showError(offlineAwareIssue(PlaybackIssueKind.GENERIC))
            return
        }
        val step = liveErrorRecoveryStep(
            failure = PlaybackFailureClass.TRANSIENT,
            wasPlaying = attempt.wasPlaying,
            reconnectWindowExpired = reconnectWindowExpired(),
            startupRetryAvailable = attempt.liveConsecutiveFailures < 2,
            canForceHls = false,
            canSwitchEngine = !attempt.triedMedia3ForLive && !streamRequest.uri.startsWith("rtsp://", ignoreCase = true),
            canRetrySurface = false,
            permanentReconnectAvailable = false,
        )
        when (step) {
            LiveRecoveryStep.RECONNECT_IN_PLACE -> if (attempt.wasPlaying) {
                startReconnect()
            } else {
                attempt.liveConsecutiveFailures += 1
                attempt.isBuffering = true
                attempt.libVlcRetryNonce++
            }
            LiveRecoveryStep.SWITCH_ENGINE -> switchLiveEngine(toLibVlc = false)
            LiveRecoveryStep.SIBLING_VARIANT -> if (!switchToCompatibleAlternative()) showError(offlineAwareIssue(PlaybackIssueKind.LIVE_STOPPED))
            else -> showError(offlineAwareIssue(PlaybackIssueKind.LIVE_STOPPED))
        }
    }

    // ── Media3 player: built per stream (not loaded here), started after the old one is released ──

    val exoPlayer = remember(item.id, playbackRequest.uri, playbackRequest.mimeType, useLibVlc, performancePolicy.mode, attempt.media3SurfaceAttempt) {
        buildExoPlayer(
            context = context,
            request = playbackRequest,
            isLive = isLive,
            performancePolicy = performancePolicy,
            callbacks = Media3Callbacks(
                onIsPlayingChanged = { playing -> session.isPlaying = playing },
                onPlaybackStateChanged = ::onMedia3State,
                onRenderedFirstFrame = ::onFirstFrame,
                onPlayerError = ::handleMedia3Error,
                onDurationChanged = { duration -> if (duration > 0) ui.duration = duration },
                onTracksResolved = ::onTracksResolved,
                onLoadFailure = { finalUri, contentType, error ->
                    if (isLive && streamRequest.uri.hasLiveTsHint() && error.hasUnrecognizedInputFormat()) {
                        attempt.liveRedirectHint = redirectedStreamRequest(streamRequest, finalUri, contentType)
                    }
                },
            ),
        )
    }

    // Compose disposes the previous key's effect (releasing the old player and closing its
    // connection) before this body runs, so a zap never holds two provider connections.
    DisposableEffect(exoPlayer) {
        // A scrub preview belongs to the player it was made on; the new one starts at resumePositionMs.
        session.pendingSeekTarget = C.TIME_UNSET
        if (!useLibVlc) {
            exoPlayer.setMediaItem(
                buildPlayableMediaItem(playbackRequest, item, isLive, performancePolicy.liveProfile()),
                if (isLive) C.TIME_UNSET else attempt.resumePositionMs,
            )
            exoPlayer.playWhenReady = true
            exoPlayer.prepare()
        }
        onDispose {
            if (!isLive && exoPlayer.duration > 0) {
                onProgress(item, exoPlayer.currentPosition.coerceAtLeast(0), exoPlayer.duration)
            }
            exoPlayer.release()
        }
    }

    // MediaSession: hardware media keys and "Now playing" (title, group, artwork come from the
    // MediaItem metadata). Only for Media3; LibVLC plays outside this ExoPlayer.
    DisposableEffect(exoPlayer) {
        val mediaSession = if (useLibVlc) {
            null
        } else {
            runCatching {
                MediaSession.Builder(context, exoPlayer)
                    .setId("MoPlayerPro-${item.id}-${SystemClock.elapsedRealtimeNanos()}")
                    .build()
            }.getOrNull()
        }
        onDispose { runCatching { mediaSession?.release() } }
    }

    Media3LifecycleBinding(exoPlayer = exoPlayer, enabled = !useLibVlc, isLive = isLive) { position, duration ->
        onProgress(item, position, duration)
    }

    LaunchedEffect(exoPlayer, useLibVlc) {
        while (true) {
            if (!useLibVlc) {
                val position = exoPlayer.currentPosition.coerceAtLeast(0)
                if (!isLive) {
                    if (session.pendingSeekTarget == C.TIME_UNSET) ui.currentPosition = position
                    if (exoPlayer.duration > 0) ui.duration = exoPlayer.duration
                    if (exoPlayer.playbackState != Player.STATE_IDLE && position > 0) attempt.resumePositionMs = position
                }
                ui.playbackSignal = exoPlayer.videoFormat.videoSignal()
            } else {
                ui.playbackSignal = "VLC"
            }
            val engineReportsPlaying = if (useLibVlc) session.isPlaying else exoPlayer.isPlaying
            if (ui.showControls && session.isPlaying && engineReportsPlaying && !attempt.vodEnded &&
                System.currentTimeMillis() - session.lastInteraction > 8_000L
            ) {
                ui.showControls = false
            }
            delay(400)
        }
    }

    LaunchedEffect(exoPlayer) {
        if (isLive || useLibVlc) return@LaunchedEffect
        while (true) {
            delay(12_000)
            if (exoPlayer.duration > 0 && exoPlayer.currentPosition > 0) {
                onProgress(item, exoPlayer.currentPosition, exoPlayer.duration)
            }
        }
    }

    LaunchedEffect(exoPlayer, liveQualityMode, performancePolicy.mode) {
        if (isLive && !useLibVlc) applyLiveQualityMode(exoPlayer, liveQualityMode, performancePolicy.maxVideoHeight)
    }

    // ── Channel list data ───────────────────────────────────────────────────────────────────

    val zapList = rememberLiveZapList(item, relatedItems, isLive, ps.allChannels, ps.liveTvFallback)
    val previousItem = zapList.previousItem
    val nextItem = zapList.nextItem

    // ── Viewer actions ──────────────────────────────────────────────────────────────────────

    fun wakeControls() {
        ui.showControls = true
        session.lastInteraction = System.currentTimeMillis()
    }

    fun commitPendingSeek() {
        val target = session.pendingSeekTarget
        if (target == C.TIME_UNSET) return
        session.pendingSeekTarget = C.TIME_UNSET
        if (!useLibVlc) exoPlayer.seekTo(target)
    }

    /**
     * One seek step. A discrete press or button click seeks at once; held keys only move the
     * preview and commit once they stop, so a scrub is one range request instead of dozens.
     */
    fun seekVodBy(stepMs: Long, repeatCount: Int, revealControls: Boolean) {
        if (isLive) return
        if (useLibVlc) {
            session.showTransientMessage(ps.seekUnavailable)
            return
        }
        val now = SystemClock.uptimeMillis()
        val direction = if (stepMs > 0) 1 else -1
        val continuing = direction == session.lastSeekDirection && now - session.lastSeekAt < 700L
        if (!continuing) {
            commitPendingSeek()
            session.seekSessionMs = 0L
        }
        session.lastSeekDirection = direction
        session.lastSeekAt = now
        val base = if (session.pendingSeekTarget != C.TIME_UNSET) session.pendingSeekTarget else exoPlayer.currentPosition
        val knownDuration = exoPlayer.duration.takeIf { it > 0 } ?: ui.duration.takeIf { it > 1 }
        val target = vodSeekTarget(base, stepMs, repeatCount, knownDuration)
        session.seekSessionMs += target - base.coerceAtLeast(0L)
        ui.currentPosition = target
        if (repeatCount == 0) {
            session.pendingSeekTarget = C.TIME_UNSET
            exoPlayer.seekTo(target)
        } else {
            session.pendingSeekTarget = target
            session.seekCommitNonce++
        }
        session.seekPillMs = session.seekSessionMs
        session.seekPillNonce++
        if (revealControls) wakeControls() else session.seekPreviewNonce++
    }

    fun seekToFraction(fraction: Float) {
        val duration = exoPlayer.duration.takeIf { it > 0 } ?: return
        val target = (duration * fraction).toLong().coerceIn(0L, (duration - 2_000L).coerceAtLeast(0L))
        session.pendingSeekTarget = C.TIME_UNSET
        exoPlayer.seekTo(target)
        ui.currentPosition = target
        wakeControls()
    }

    fun sendVlcTransport(play: Boolean) {
        session.vlcTransportSeq += 1
        attempt.vlcTransport = VlcTransportCommand(session.vlcTransportSeq, play)
    }

    fun pausePlayback() {
        if (attempt.vodEnded) return
        attempt.userPaused = true
        attempt.pausedAt = SystemClock.elapsedRealtime()
        if (useLibVlc) sendVlcTransport(play = false) else Util.handlePauseButtonAction(exoPlayer)
        if (isLive) ui.showMiniInfo = true
    }

    fun resumePlayback() {
        val pausedFor = if (attempt.pausedAt > 0L) SystemClock.elapsedRealtime() - attempt.pausedAt else 0L
        // After a long live pause the buffer is minutes behind (or already outside the window).
        val jumpToLiveEdge = isLive && pausedFor > LIVE_PAUSE_JUMP_TO_EDGE_MS
        attempt.userPaused = false
        attempt.pausedAt = 0L
        if (useLibVlc) {
            if (jumpToLiveEdge || attempt.vodEnded) attempt.libVlcRetryNonce++ else sendVlcTransport(play = true)
        } else {
            if (jumpToLiveEdge) exoPlayer.seekToDefaultPosition()
            Util.handlePlayButtonAction(exoPlayer)
        }
        attempt.vodEnded = false
    }

    fun togglePlayPause() {
        val resume = when {
            attempt.vodEnded || attempt.userPaused -> true
            useLibVlc -> false
            else -> Util.shouldShowPlayButton(exoPlayer)
        }
        if (resume) resumePlayback() else pausePlayback()
    }

    fun retryPlayback() {
        // A pending rebuild (other surface, fallback URL, redirect) starts the new player by itself.
        val rebuildPending = attempt.media3SurfaceAttempt != 0 ||
            attempt.vodFallbackRequest != null ||
            attempt.forceHlsForLiveRedirect ||
            attempt.resolvedLiveRequest != null
        if (!isLive && !useLibVlc) {
            attempt.resumePositionMs = exoPlayer.currentPosition.takeIf { it > 0 } ?: attempt.resumePositionMs
        }
        attempt.playbackError = null
        ui.launchMessage = null
        attempt.isBuffering = true
        attempt.forceHlsForLiveRedirect = false
        attempt.resolvedLiveRequest = null
        attempt.liveRedirectHint = null
        attempt.liveFirstFrameRendered = false
        attempt.liveReadyWithoutVideoAt = 0L
        attempt.liveConsecutiveFailures = 0
        attempt.startupEndedRetries = 0
        attempt.media3SurfaceAttempt = 0
        attempt.vodFallbackRequest = null
        attempt.vodFallbackVisitedUris = emptySet()
        attempt.vodFallbackSwitches = 0
        attempt.vodReadyAt = 0L
        attempt.vodFirstFrameRendered = false
        attempt.vodEnded = false
        attempt.reconnectingSince = 0L
        attempt.reconnectAttempt = 0
        attempt.userPaused = false
        attempt.wasPlaying = false
        attempt.triedCompatibleLiveAlternative = false
        session.liveAutoRecoveryAttempts = 0
        session.liveAutoRecoveryVisited = emptySet()
        session.userZapInFlight = false
        if (isLive) {
            attempt.triedMedia3ForLive = !useLibVlc
            attempt.triedLibVlcForLive = useLibVlc
            attempt.forceLibVlcForLive = useLibVlc
        } else {
            attempt.triedLibVlcForVod = useLibVlc
            attempt.forceLibVlcForVod = useLibVlc
        }
        telemetry("manual retry")
        if (useLibVlc) {
            attempt.libVlcRetryNonce++
            return
        }
        if (rebuildPending) return
        // Same player, same tuned MediaSource: stop() keeps the playlist, prepare() reopens it.
        exoPlayer.stop()
        if (isLive) exoPlayer.seekToDefaultPosition() else exoPlayer.seekTo(attempt.resumePositionMs)
        exoPlayer.playWhenReady = true
        exoPlayer.prepare()
    }

    fun tryOtherVodEngine() {
        switchVodEngine(toLibVlc = !useLibVlc)
    }

    /** A zap or episode change the viewer asked for. */
    fun switchTo(target: AppMediaItem?) {
        if (target == null || target.samePlayable(item)) return
        commitPendingSeek()
        session.pendingZapItem = null
        session.zapKeyHeld = false
        if (target.type == ContentType.LIVE) {
            session.lastLiveSwitchAt = System.currentTimeMillis()
            session.lastZapCommitAt = SystemClock.uptimeMillis()
            session.zapSettling = true
            session.userZapInFlight = true
            session.liveAutoRecoveryAttempts = 0
            session.liveAutoRecoveryVisited = emptySet()
            session.recoveryNotice = null
        }
        onPlayItem(target)
    }

    fun commitPendingZap() {
        val target = session.pendingZapItem ?: return
        session.pendingZapItem = null
        session.zapKeyHeld = false
        // Home pressed inside the coalescing window: tuning now would start playback in the
        // background, where the lifecycle stop that already ran can no longer silence it.
        if (!isForeground()) return
        if (target.samePlayable(item)) ui.showMiniInfo = true else switchTo(target)
    }

    /**
     * CH+/CH-/Up/Down with the list closed. The first press tunes immediately; auto-repeat and
     * rapid presses only move the on-screen target, and the latest target is tuned on key-up or
     * after [ZAP_COALESCE_MS] of quiet — so no provider connection is opened per passing channel.
     */
    fun zapBy(direction: Int, repeatCount: Int) {
        val list = latestRelated
        val base = session.pendingZapItem ?: item
        val baseIndex = list.indexOfFirst { it.samePlayable(base) }
        val target = liveZapTargetIndex(baseIndex, direction, list.size)?.let(list::get) ?: return
        ui.showControls = false
        ui.showLiveZap = false
        val now = SystemClock.uptimeMillis()
        if (repeatCount == 0 && session.pendingZapItem == null && now - session.lastZapCommitAt >= ZAP_COALESCE_MS) {
            switchTo(target)
        } else {
            if (repeatCount > 0) session.zapKeyHeld = true
            session.pendingZapItem = target
            session.pendingZapNonce++
            ui.showMiniInfo = true
        }
    }

    fun recallPreviousChannel() {
        val previous = session.previousChannel ?: return
        if (!previous.samePlayable(item)) switchTo(previous)
    }

    fun leavePlayer() {
        commitPendingSeek()
        if (isLive || useLibVlc) onBack(0, 0) else onBack(exoPlayer.currentPosition, exoPlayer.duration.coerceAtLeast(0))
    }

    /** VLC / MX / system chooser for the current stream; Back or Cancel in the picker returns here. */
    fun openPlayerPicker() {
        routeBeforePicker = route
        route = null
    }

    fun cycleVideoSizeMode() {
        val current = VideoSizeModes.indexOf(selectedVideoSizeMode).coerceAtLeast(0)
        val next = VideoSizeModes[(current + 1) % VideoSizeModes.size]
        selectedVideoSizeMode = next
        onVideoSizeMode(next)
    }

    fun setLiveQualityMode(mode: LiveQualityMode) {
        liveQualityMode = mode
        // Quality modes steer Media3's track selection; LibVLC has no equivalent.
        if (isLive && useLibVlc && !streamRequest.uri.startsWith("rtsp://", ignoreCase = true)) switchLiveEngine(toLibVlc = false)
    }

    fun toggleFavorite() {
        onTripleOk()
        ui.favoriteMarked = !ui.favoriteMarked
    }

    fun showTrackDialog(trackType: Int) {
        val title = when (trackType) {
            C.TRACK_TYPE_AUDIO -> strings.playerAudio
            C.TRACK_TYPE_TEXT -> strings.playerSubtitles
            else -> strings.playerQuality
        }
        runCatching {
            TrackSelectionDialogBuilder(context, title, exoPlayer, trackType)
                .apply { if (trackType == C.TRACK_TYPE_TEXT) setShowDisableOption(true) }
                .build()
                .show()
        }
    }

    fun closeLiveZap() {
        ui.showLiveZap = false
    }

    fun openLiveZap() {
        val homeCategory = item.categoryId.ifBlank { LIVE_ZAP_ALL_CATEGORY_ID }
        if (homeCategory == zapList.categoryId) zapList.selectedIndex = zapList.displayedCurrentIndex.coerceAtLeast(0) else zapList.categoryId = homeCategory
        ui.liveOverlayTab = LiveOverlayTab.CHANNELS
        ui.liveActionIndex = 0
        ui.showLiveZap = true
        ui.showMiniInfo = false
        ui.showControls = false
        session.lastInteraction = System.currentTimeMillis()
    }

    fun selectLiveZapCategory(direction: Int) {
        val categories = zapList.categories
        if (categories.isEmpty()) return
        val index = categories.indexOfFirst { it.id == zapList.categoryId }.coerceAtLeast(0)
        zapList.categoryId = categories[(index + direction).floorMod(categories.size)].id
    }

    fun selectLiveOverlayTab(direction: Int) {
        val current = LiveOverlayTabs.indexOf(ui.liveOverlayTab).coerceAtLeast(0)
        ui.liveOverlayTab = LiveOverlayTabs[(current + direction).floorMod(LiveOverlayTabs.size)]
        ui.liveActionIndex = 0
    }

    fun liveOverlayActions(): List<LiveOverlayAction> = when (ui.liveOverlayTab) {
        LiveOverlayTab.VIDEO_SIZE -> listOf(
            LiveOverlayAction("${ps.changeSize} · $videoSizeLabel", true, ::cycleVideoSizeMode),
            LiveOverlayAction(ps.qualitySmart, liveQualityMode == LiveQualityMode.AUTO) { setLiveQualityMode(LiveQualityMode.AUTO) },
            LiveOverlayAction(ps.qualityStable, liveQualityMode == LiveQualityMode.STABLE) { setLiveQualityMode(LiveQualityMode.STABLE) },
            LiveOverlayAction("4K", liveQualityMode == LiveQualityMode.BEST) { setLiveQualityMode(LiveQualityMode.BEST) },
            LiveOverlayAction("8K", liveQualityMode == LiveQualityMode.ULTRA) { setLiveQualityMode(LiveQualityMode.ULTRA) },
            LiveOverlayAction(ps.videoQuality, false) { showTrackDialog(C.TRACK_TYPE_VIDEO) },
        )
        LiveOverlayTab.AUDIO -> listOf(LiveOverlayAction(ps.audioTracks, false) { showTrackDialog(C.TRACK_TYPE_AUDIO) })
        LiveOverlayTab.SUBTITLES -> listOf(LiveOverlayAction(strings.playerSubtitles, false) { showTrackDialog(C.TRACK_TYPE_TEXT) })
        LiveOverlayTab.FAVORITES -> listOf(
            LiveOverlayAction(if (ui.favoriteMarked) ps.removeFavorite else ps.addFavorite, ui.favoriteMarked, ::toggleFavorite),
            LiveOverlayAction(ps.externalPlayer, false, ::openPlayerPicker),
        )
        LiveOverlayTab.CHANNELS, LiveOverlayTab.GROUPS -> emptyList()
    }
    val overlayActions = if (isLive && ui.showLiveZap) liveOverlayActions() else emptyList()

    /** Up/Down (or CH+/-) inside the list: channels, groups, or the current tab's actions. */
    fun moveOverlaySelection(direction: Int) {
        when (ui.liveOverlayTab) {
            LiveOverlayTab.GROUPS -> selectLiveZapCategory(direction)
            LiveOverlayTab.CHANNELS -> if (zapList.displayedItems.isNotEmpty()) {
                zapList.selectedIndex = (zapList.selectedIndex + direction).floorMod(zapList.displayedItems.size)
            }
            else -> if (overlayActions.isNotEmpty()) {
                ui.liveActionIndex = (ui.liveActionIndex + direction).floorMod(overlayActions.size)
            }
        }
    }

    fun activateOverlaySelection() {
        when (ui.liveOverlayTab) {
            LiveOverlayTab.CHANNELS -> {
                zapList.displayedItems.getOrNull(zapList.selectedIndex)?.let(::switchTo)
                closeLiveZap()
                ui.showMiniInfo = true
            }
            LiveOverlayTab.GROUPS -> ui.liveOverlayTab = LiveOverlayTab.CHANNELS
            else -> overlayActions.getOrNull(ui.liveActionIndex)?.onClick?.invoke()
        }
    }

    fun appendChannelDigit(digit: Int) {
        if (session.numberBuffer.length >= NUMBER_ENTRY_MAX_DIGITS) return
        ui.showLiveZap = false
        session.numberBuffer += digit.toString()
        session.numberNonce++
    }

    fun commitNumberEntry() {
        val typed = session.numberBuffer
        session.numberBuffer = ""
        if (!isForeground()) return
        val number = typed.toIntOrNull() ?: return
        val target = resolveChannelNumber(latestRelated, number, zapList.providerNumbers)
        when {
            target == null -> session.showTransientMessage(ps.channelNotFound.fill(number.toString().ltr()))
            target.samePlayable(item) -> ui.showMiniInfo = true
            else -> switchTo(target)
        }
    }

    fun onNetworkRestored() {
        if (!isLive || !isForeground()) return
        when {
            attempt.reconnectingSince > 0L -> {
                attempt.reconnectingSince = SystemClock.elapsedRealtime()
                attempt.reconnectAttempt = 0
                attempt.reconnectNonce++
            }
            attempt.playbackError?.isTransient == true -> retryPlayback()
        }
    }

    fun onScreenTap() {
        // The error card's scrim does not consume touches; a tap on it must not open the list
        // (or wake controls) underneath, where OK and the D-pad would then act invisibly.
        if (attempt.playbackError != null) return
        if (isLive) {
            if (ui.showLiveZap) closeLiveZap() else openLiveZap()
        } else if (ui.showControls) {
            ui.showControls = false
        } else {
            wakeControls()
        }
    }

    // ── Remote keys ─────────────────────────────────────────────────────────────────────────

    fun handleLiveKey(event: KeyEvent, keyCode: Int, repeatCount: Int): Boolean {
        val errorShown = attempt.playbackError != null
        digitForKeyCode(keyCode)?.let { digit ->
            if (repeatCount == 0) appendChannelDigit(digit)
            return true
        }
        if (session.numberBuffer.isNotEmpty()) {
            when (event.key) {
                Key.Enter, Key.DirectionCenter, Key.NumPadEnter -> {
                    commitNumberEntry()
                    return true
                }
                Key.Back, Key.Escape -> {
                    session.numberBuffer = ""
                    return true
                }
            }
        }
        val zapDirection = liveZapDirectionForKeyCode(keyCode)
        if (zapDirection != 0) {
            if (ui.showLiveZap) {
                moveOverlaySelection(zapDirection)
                session.lastInteraction = System.currentTimeMillis()
            } else {
                zapBy(zapDirection, repeatCount)
            }
            return true
        }
        when (keyCode) {
            AndroidKeyEvent.KEYCODE_LAST_CHANNEL -> {
                if (repeatCount == 0) recallPreviousChannel()
                return true
            }
            AndroidKeyEvent.KEYCODE_GUIDE, AndroidKeyEvent.KEYCODE_MENU -> {
                if (repeatCount == 0 && !errorShown) {
                    if (ui.showLiveZap) closeLiveZap() else openLiveZap()
                }
                return true
            }
            AndroidKeyEvent.KEYCODE_INFO -> {
                ui.showMiniInfo = true
                return true
            }
        }
        return when (event.key) {
            Key.Enter, Key.DirectionCenter, Key.NumPadEnter -> when {
                // The focused error-card button takes OK.
                errorShown && !ui.showLiveZap -> false
                ui.showLiveZap -> {
                    activateOverlaySelection()
                    true
                }
                session.pendingZapItem != null -> {
                    commitPendingZap()
                    true
                }
                attempt.userPaused -> {
                    resumePlayback()
                    true
                }
                else -> {
                    openLiveZap()
                    true
                }
            }
            Key.DirectionLeft, Key.DirectionRight -> when {
                errorShown && !ui.showLiveZap -> false
                ui.showLiveZap -> {
                    // Tabs are laid out right-to-left in Arabic: Right moves the highlight right.
                    val physical = if (event.key == Key.DirectionRight) 1 else -1
                    selectLiveOverlayTab(if (isRtl) -physical else physical)
                    true
                }
                else -> {
                    ui.showMiniInfo = true
                    true
                }
            }
            Key.Back, Key.Escape -> {
                if (ui.showLiveZap) closeLiveZap() else leavePlayer()
                true
            }
            Key.MediaPlay -> {
                if (errorShown) retryPlayback() else resumePlayback()
                true
            }
            Key.MediaPause -> {
                if (!errorShown) pausePlayback()
                true
            }
            Key.MediaPlayPause, Key.Spacebar -> {
                if (errorShown) retryPlayback() else togglePlayPause()
                true
            }
            else -> false
        }
    }

    fun handleVodKey(event: KeyEvent, keyCode: Int, repeatCount: Int): Boolean {
        if (attempt.playbackError != null) {
            // D-pad and OK belong to the error card buttons; Play retries.
            return when (event.key) {
                Key.Back, Key.Escape -> {
                    leavePlayer()
                    true
                }
                Key.MediaPlay, Key.MediaPlayPause -> {
                    retryPlayback()
                    true
                }
                else -> false
            }
        }
        when (keyCode) {
            AndroidKeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> {
                seekVodBy(30_000L, repeatCount, revealControls = ui.showControls)
                return true
            }
            AndroidKeyEvent.KEYCODE_MEDIA_REWIND -> {
                seekVodBy(-30_000L, repeatCount, revealControls = ui.showControls)
                return true
            }
            AndroidKeyEvent.KEYCODE_MEDIA_NEXT -> {
                if (repeatCount == 0) switchTo(nextItem)
                return nextItem != null
            }
            AndroidKeyEvent.KEYCODE_MEDIA_PREVIOUS -> {
                if (repeatCount == 0) switchTo(previousItem)
                return previousItem != null
            }
        }
        when (event.key) {
            Key.MediaPlay -> {
                resumePlayback()
                wakeControls()
                return true
            }
            Key.MediaPause -> {
                pausePlayback()
                wakeControls()
                return true
            }
            Key.MediaPlayPause -> {
                togglePlayPause()
                wakeControls()
                return true
            }
        }
        if (!ui.showControls) {
            return when (event.key) {
                Key.Back, Key.Escape -> {
                    leavePlayer()
                    true
                }
                Key.Enter, Key.DirectionCenter, Key.NumPadEnter, Key.Spacebar -> {
                    togglePlayPause()
                    wakeControls()
                    true
                }
                // Seek without opening the full controls, so held keys keep seeking (and accelerate).
                Key.DirectionLeft -> {
                    seekVodBy(-10_000L, repeatCount, revealControls = false)
                    true
                }
                Key.DirectionRight -> {
                    seekVodBy(10_000L, repeatCount, revealControls = false)
                    true
                }
                Key.DirectionUp, Key.DirectionDown -> {
                    wakeControls()
                    true
                }
                else -> if (keyCode == AndroidKeyEvent.KEYCODE_MENU || keyCode == AndroidKeyEvent.KEYCODE_INFO) {
                    wakeControls()
                    true
                } else {
                    false
                }
            }
        }
        // Controls visible: D-pad and OK move focus and click inside the control island.
        return if (event.key == Key.Back || event.key == Key.Escape) {
            ui.showControls = false
            true
        } else {
            false
        }
    }

    fun handleKeyDown(event: KeyEvent): Boolean {
        val native = event.nativeKeyEvent
        when (event.key) {
            // Volume and mute keep their system behaviour on every device.
            Key.VolumeUp, Key.VolumeDown, Key.VolumeMute -> return false
        }
        if (native.repeatCount > 0 && event.key in PlayerToggleKeys && session.ownedKey == event.key) return true
        session.lastInteraction = System.currentTimeMillis()
        val handled = if (isLive) {
            handleLiveKey(event, native.keyCode, native.repeatCount)
        } else {
            handleVodKey(event, native.keyCode, native.repeatCount)
        }
        if (handled && native.repeatCount == 0) session.ownedKey = event.key
        return handled
    }

    fun handleKeyUp(event: KeyEvent): Boolean {
        val keyCode = event.nativeKeyEvent.keyCode
        if (isLive && session.zapKeyHeld && liveZapDirectionForKeyCode(keyCode) != 0) commitPendingZap()
        if (!isLive && session.pendingSeekTarget != C.TIME_UNSET &&
            (event.key == Key.DirectionLeft || event.key == Key.DirectionRight ||
                keyCode == AndroidKeyEvent.KEYCODE_MEDIA_FAST_FORWARD || keyCode == AndroidKeyEvent.KEYCODE_MEDIA_REWIND)
        ) {
            commitPendingSeek()
        }
        // Swallow the release of a press the root consumed so it cannot click whatever gained focus meanwhile.
        val owned = session.ownedKey == event.key
        if (owned) session.ownedKey = null
        return owned
    }

    BackHandler {
        when {
            session.numberBuffer.isNotEmpty() -> session.numberBuffer = ""
            isLive && ui.showLiveZap -> closeLiveZap()
            !isLive && ui.showControls && attempt.playbackError == null -> ui.showControls = false
            else -> leavePlayer()
        }
    }

    // ── Effects: focus, timers, watchdogs, reconnects ──────────────────────────────────────

    val errorVisible = attempt.playbackError != null
    val currentExoPlayer by rememberUpdatedState(exoPlayer)
    val currentUseLibVlc by rememberUpdatedState(useLibVlc)
    val lifecycleState by lifecycleOwner.lifecycle.currentStateAsState()
    val isStarted = lifecycleState.isAtLeast(Lifecycle.State.STARTED)

    LaunchedEffect(item.id) {
        runCatching { playerFocusRequester.requestFocus() }
    }

    LaunchedEffect(ui, ui.showControls) {
        if (isLive) return@LaunchedEffect
        if (ui.showControls) {
            delay(40)
            runCatching { playPauseFocusRequester.requestFocus() }
        } else {
            // Take focus off the control island before it fades out, so the next key reaches the player.
            runCatching { playerFocusRequester.requestFocus() }
        }
    }

    LaunchedEffect(errorVisible) {
        if (errorVisible) {
            ui.showLiveZap = false
            ui.showControls = false
            delay(80)
            runCatching { errorFocusRequester.requestFocus() }
        } else {
            runCatching { playerFocusRequester.requestFocus() }
        }
    }

    LaunchedEffect(isLive, playbackRequest.uri, item.id, attempt.media3SurfaceAttempt) {
        if (!isLive) return@LaunchedEffect
        attempt.liveOpeningGuard = true
        delay(10_000)
        attempt.liveOpeningGuard = false
    }

    LaunchedEffect(isLive, playbackRequest.uri, item.id) {
        if (isLive) return@LaunchedEffect
        attempt.vodOpeningGuard = true
        delay(7_000)
        attempt.vodOpeningGuard = false
    }

    PlayerSessionTimers(session)

    LaunchedEffect(session.userZapInFlight) {
        if (session.userZapInFlight) {
            delay(1_200)
            session.userZapInFlight = false
        }
    }

    LaunchedEffect(session.seekCommitNonce) {
        if (session.seekCommitNonce == 0) return@LaunchedEffect
        delay(300)
        commitPendingSeek()
    }

    LaunchedEffect(session.pendingZapNonce) {
        if (session.pendingZapItem == null) return@LaunchedEffect
        delay(ZAP_COALESCE_MS)
        commitPendingZap()
    }

    LaunchedEffect(session.numberNonce) {
        if (session.numberBuffer.isEmpty()) return@LaunchedEffect
        delay(NUMBER_ENTRY_COMMIT_MS)
        commitNumberEntry()
    }

    // Remember the channel we came from for LAST_CHANNEL (automatic variant switches don't count).
    LaunchedEffect(item.id, item.serverId) {
        if (!isLive) return@LaunchedEffect
        val last = session.lastSeenLiveItem
        if (last != null && !last.samePlayable(item) && !session.nextSwitchIsRecovery) session.previousChannel = last
        session.nextSwitchIsRecovery = false
        session.lastSeenLiveItem = item
    }

    LaunchedEffect(ui, ui.showMiniInfo, ui.showLiveZap, attempt.userPaused, session.pendingZapItem) {
        if (ui.showMiniInfo && !ui.showLiveZap && !attempt.userPaused && session.pendingZapItem == null) {
            delay(2_600)
            ui.showMiniInfo = false
        }
    }

    LaunchedEffect(ui, ui.showLiveZap) {
        if (!ui.showLiveZap) return@LaunchedEffect
        snapshotFlow { session.lastInteraction }.collectLatest {
            delay(15_000)
            closeLiveZap()
        }
    }

    // VOD black-screen watchdog: READY but no first frame.
    LaunchedEffect(attempt, attempt.vodReadyAt, attempt.vodFirstFrameRendered, attempt.audioOnly) {
        if (isLive || attempt.vodFirstFrameRendered || attempt.audioOnly || attempt.vodReadyAt <= 0L) return@LaunchedEffect
        delay(vodNoVideoWatchdogDelayMs(performancePolicy.isPerformance))
        if (!isForeground() || attempt.vodFirstFrameRendered || attempt.audioOnly || attempt.playbackError != null) return@LaunchedEffect
        if (shouldAutoUseLibVlc(playbackRequest) && !attempt.triedLibVlcForVod) {
            switchVodEngine(toLibVlc = true)
        } else {
            showError(PlaybackIssue(PlaybackIssueKind.VOD_NO_FRAMES))
        }
    }

    // Live stall watchdog. Before the first frame it walks the startup chain; once the channel
    // has played, a long stall is a dropped connection and is reconnected in place. It also
    // supervises each reconnect, so a re-opened stream that just sits buffering is retried too.
    // Keyed on isStarted: the stop in the background already made isBuffering true, so without
    // it the stream re-opened on return from Home would run unsupervised.
    LaunchedEffect(
        attempt,
        attempt.isBuffering,
        attempt.playbackError,
        attempt.liveConsecutiveFailures,
        attempt.media3SurfaceAttempt,
        attempt.userPaused,
        attempt.reconnectNonce,
        useLibVlc,
        exoPlayer,
        isStarted,
    ) {
        if (!isLive || !attempt.isBuffering || attempt.playbackError != null || attempt.userPaused) return@LaunchedEffect
        val reconnecting = attempt.reconnectingSince > 0L
        val midStream = reconnecting || attempt.wasPlaying
        delay(
            when {
                reconnecting -> liveReconnectDelayMs(attempt.reconnectAttempt) + LIVE_MIDSTREAM_STALL_MS
                midStream -> LIVE_MIDSTREAM_STALL_MS
                performancePolicy.isPerformance || Build.VERSION.SDK_INT < 26 -> 3_500L
                else -> 5_000L
            },
        )
        if (!isForeground() || !attempt.isBuffering || attempt.playbackError != null || attempt.userPaused) return@LaunchedEffect
        if (midStream) {
            // Offline this only shows "Waiting for network…"; the reconnect runs when it returns.
            startReconnect()
            return@LaunchedEffect
        }
        when {
            !useLibVlc && shouldAutoUseLibVlc(playbackRequest) && !attempt.triedLibVlcForLive -> switchLiveEngine(toLibVlc = true)
            useLibVlc && attempt.liveConsecutiveFailures < liveStallRecoveryLimit -> {
                attempt.liveConsecutiveFailures += 1
                attempt.libVlcRetryNonce++
            }
            !useLibVlc && retryMedia3WithAlternateSurface() -> Unit
            !useLibVlc && attempt.liveConsecutiveFailures < liveStallRecoveryLimit -> {
                attempt.liveConsecutiveFailures += 1
                runCatching {
                    exoPlayer.stop()
                    exoPlayer.seekToDefaultPosition()
                    exoPlayer.playWhenReady = true
                    exoPlayer.prepare()
                }
            }
            else -> if (!switchToCompatibleAlternative()) showError(offlineAwareIssue(PlaybackIssueKind.UNSTABLE))
        }
    }

    // Live no-video watchdog: READY without a rendered frame (audio-only streams are exempt).
    LaunchedEffect(attempt, attempt.liveReadyWithoutVideoAt, attempt.liveFirstFrameRendered, attempt.audioOnly, attempt.userPaused, useLibVlc, exoPlayer) {
        if (!isLive || useLibVlc || attempt.liveReadyWithoutVideoAt <= 0L || attempt.liveFirstFrameRendered ||
            attempt.audioOnly || attempt.userPaused
        ) {
            return@LaunchedEffect
        }
        delay(liveNoVideoWatchdogDelayMs(performancePolicy.isPerformance))
        if (!isForeground() || attempt.liveReadyWithoutVideoAt <= 0L || attempt.liveFirstFrameRendered ||
            attempt.audioOnly || attempt.playbackError != null
        ) {
            return@LaunchedEffect
        }
        when {
            (performancePolicy.isPerformance || Build.VERSION.SDK_INT < 26) &&
                shouldAutoUseLibVlc(playbackRequest) && !attempt.triedLibVlcForLive -> switchLiveEngine(toLibVlc = true)
            retryMedia3WithAlternateSurface() -> Unit
            shouldAutoUseLibVlc(playbackRequest) && !attempt.triedLibVlcForLive -> switchLiveEngine(toLibVlc = true)
            else -> if (!switchToCompatibleAlternative()) showError(PlaybackIssue(PlaybackIssueKind.NO_VIDEO))
        }
    }

    // In-place reconnect (same channel, same engine) with 1/2/4/8/15 s backoff.
    LaunchedEffect(attempt, attempt.reconnectNonce) {
        if (attempt.reconnectNonce == 0) return@LaunchedEffect
        delay(liveReconnectDelayMs(attempt.reconnectAttempt))
        if (!isForeground() || !session.networkAvailable || attempt.playbackError != null) return@LaunchedEffect
        attempt.reconnectAttempt += 1
        telemetry("reconnect attempt ${attempt.reconnectAttempt}")
        if (currentUseLibVlc) {
            attempt.libVlcRetryNonce++
        } else {
            runCatching {
                currentExoPlayer.stop()
                currentExoPlayer.seekToDefaultPosition()
                currentExoPlayer.playWhenReady = true
                currentExoPlayer.prepare()
            }
        }
    }

    // Back from Home or the screensaver while a reconnect was pending: try again right away.
    LaunchedEffect(isStarted) {
        if (!isStarted || !isLive || attempt.reconnectingSince == 0L) return@LaunchedEffect
        attempt.reconnectingSince = SystemClock.elapsedRealtime()
        attempt.reconnectAttempt = 0
        attempt.reconnectNonce++
    }

    NetworkAvailabilityEffect(enabled = isLive) { available ->
        session.networkAvailable = available
        if (available) onNetworkRestored()
    }

    val importSubtitle = rememberSubtitleImport(
        exoPlayer = exoPlayer,
        item = item,
        request = playbackRequest,
        isLive = isLive,
        useLibVlc = useLibVlc,
        performancePolicy = performancePolicy,
        onImported = { uri ->
            ui.externalSubtitle = uri
            if (useLibVlc) ui.externalSubtitleNonce++
        },
        onFail = { session.showTransientMessage(strings.playerSubtitleImportFailed) },
        beforeLaunch = ::wakeControls,
    )
    val canCast by produceState(initialValue = false, streamRequest.uri, isLive) {
        value = !isLive && withContext(Dispatchers.IO) { canLaunchCast(context, streamRequest.uri) }
    }

    // ── UI ──────────────────────────────────────────────────────────────────────────────────

    Box(
        Modifier
            .fillMaxSize()
            .background(Color.Black)
            .focusRequester(playerFocusRequester)
            .focusable()
            .onPreviewKeyEvent { event ->
                when (event.type) {
                    KeyEventType.KeyDown -> handleKeyDown(event)
                    KeyEventType.KeyUp -> handleKeyUp(event)
                    else -> false
                }
            },
    ) {
        if (useLibVlc) {
            LibVlcPlayerView(
                request = playbackRequest,
                title = item.title,
                resizeMode = selectedVideoSizeMode.toResizeMode(),
                retryNonce = attempt.libVlcRetryNonce,
                transport = attempt.vlcTransport,
                onBuffering = { buffering ->
                    val rendered = if (isLive) attempt.liveFirstFrameRendered else attempt.vodFirstFrameRendered
                    attempt.isBuffering = buffering || !(rendered || attempt.audioOnly)
                },
                onPlaying = {
                    session.isPlaying = true
                    val rendered = if (isLive) attempt.liveFirstFrameRendered else attempt.vodFirstFrameRendered
                    attempt.isBuffering = !(rendered || attempt.audioOnly)
                    attempt.playbackError = null
                },
                onVideoOutput = {
                    onFirstFrame()
                    attempt.isBuffering = false
                    attempt.playbackError = null
                    attempt.liveConsecutiveFailures = 0
                },
                onAudioOnly = {
                    attempt.audioOnly = true
                    attempt.isBuffering = false
                    attempt.liveReadyWithoutVideoAt = 0L
                    attempt.liveConsecutiveFailures = 0
                    markPlaying()
                },
                onPaused = { session.isPlaying = false },
                onEndReached = { if (isLive) handleLibVlcFailure() else markVodEnded() },
                onError = ::handleLibVlcFailure,
                externalSubtitlePath = ui.externalSubtitle?.toString(),
                externalSubtitleNonce = ui.externalSubtitleNonce,
                modifier = Modifier.fillMaxSize(),
            )
        } else {
            Media3Surface(
                exoPlayer = exoPlayer,
                surfaceAttempt = attempt.media3SurfaceAttempt,
                isPerformanceMode = performancePolicy.isPerformance,
                resizeMode = selectedVideoSizeMode.toResizeMode(),
            )
        }

        if (attempt.audioOnly && !errorVisible) AudioOnlyBackdrop(item, accent)

        PlayerTouchLayer(
            isLive = isLive,
            onTap = ::onScreenTap,
            onDoubleTap = { forward -> seekVodBy(if (forward) 10_000L else -10_000L, 0, revealControls = true) },
            onVerticalSwipe = { direction -> if (!ui.showLiveZap && !errorVisible) zapBy(direction, 0) },
        )

        val showOpening = !errorVisible && attempt.reconnectingSince == 0L && !attempt.userPaused && (
            attempt.isBuffering ||
                (isLive && attempt.liveOpeningGuard && !attempt.liveFirstFrameRendered && !attempt.audioOnly) ||
                (!isLive && attempt.vodOpeningGuard && !attempt.vodFirstFrameRendered)
            )
        OpeningPill(
            visible = showOpening,
            suppressForZap = isLive && session.zapSettling,
            switchKey = session.lastLiveSwitchAt,
            onSettled = { session.zapSettling = false },
            label = when {
                isLive && !attempt.liveFirstFrameRendered && !attempt.audioOnly -> strings.playerOpening
                !isLive && !attempt.vodFirstFrameRendered -> strings.playerLoading
                else -> ps.buffering
            },
            accent = accent,
            modifier = Modifier.align(Alignment.Center),
        )

        TopNoticeStack(Modifier.align(Alignment.TopCenter)) {
            if (attempt.reconnectingSince > 0L && !errorVisible) {
                StatusPill(if (session.networkAvailable) ps.reconnecting else ps.waitingForNetwork, accent)
            }
            session.recoveryNotice?.let { InfoChip(it, accent) }
            session.transientMessage?.let { InfoChip(it, accent) }
        }

        if (session.numberBuffer.isNotEmpty()) {
            NumberEntryOverlay(session.numberBuffer, accent, Modifier.align(Alignment.TopEnd).safeCornerPadding())
        }

        if (isLive) {
            val liveStatus = LiveCardStatus(
                opening = !errorVisible && !attempt.liveFirstFrameRendered && !attempt.audioOnly &&
                    (attempt.isBuffering || attempt.liveOpeningGuard),
                reconnecting = attempt.reconnectingSince > 0L,
                waitingForNetwork = !session.networkAvailable,
                paused = attempt.userPaused,
                audioOnly = attempt.audioOnly,
                hasError = errorVisible,
                signal = ui.playbackSignal,
            )
            LiveZapOverlay(
                visible = ui.showLiveZap,
                miniVisible = (ui.showMiniInfo || attempt.userPaused || session.pendingZapItem != null) && !ui.showLiveZap && !errorVisible,
                miniItem = session.pendingZapItem ?: item,
                miniStatus = if (session.pendingZapItem != null) null else liveStatus,
                currentItem = item,
                currentStatus = liveStatus,
                channelNumberOf = zapList.channelNumberOf,
                categories = zapList.categories,
                selectedCategoryId = zapList.categoryId,
                selectedTab = ui.liveOverlayTab,
                items = zapList.displayedItems,
                selectedIndex = zapList.selectedIndex,
                videoSizeLabel = videoSizeLabel,
                favoriteMarked = ui.favoriteMarked,
                actions = overlayActions,
                selectedActionIndex = ui.liveActionIndex,
                accent = accent,
                showCloseButton = !isTv,
                onSelectIndex = { index ->
                    zapList.selectedIndex = index
                    session.lastInteraction = System.currentTimeMillis()
                },
                onTab = { tab ->
                    ui.liveOverlayTab = tab
                    ui.liveActionIndex = 0
                    session.lastInteraction = System.currentTimeMillis()
                },
                onCategory = { categoryId ->
                    zapList.categoryId = categoryId
                    session.lastInteraction = System.currentTimeMillis()
                },
                onPlay = { selected ->
                    closeLiveZap()
                    ui.showMiniInfo = true
                    switchTo(selected)
                },
                onClose = ::closeLiveZap,
            )
        } else {
            VodSeekPreview(visible = session.seekPreviewVisible && !ui.showControls && !errorVisible, ui = ui, accent = accent)
            VodControls(
                visible = ui.showControls && !errorVisible,
                title = item.title,
                videoSizeLabel = videoSizeLabel,
                ui = ui,
                showPlay = attempt.userPaused || (!session.isPlaying && !attempt.isBuffering),
                ended = attempt.vodEnded,
                favoriteMarked = ui.favoriteMarked,
                canCast = canCast,
                accent = accent,
                playPauseFocusRequester = playPauseFocusRequester,
                onSeekToFraction = if (!isTv && !useLibVlc) ::seekToFraction else null,
                onSeekBy = { step -> seekVodBy(step, 0, revealControls = true) },
                onPlayPause = {
                    togglePlayPause()
                    wakeControls()
                },
                onRetry = ::retryPlayback,
                onAudio = { showTrackDialog(C.TRACK_TYPE_AUDIO) },
                onSubtitles = { showTrackDialog(C.TRACK_TYPE_TEXT) },
                onAddSubtitle = importSubtitle,
                onQuality = { showTrackDialog(C.TRACK_TYPE_VIDEO) },
                onAspect = ::cycleVideoSizeMode,
                onFavorite = {
                    toggleFavorite()
                    wakeControls()
                },
                onCast = { launchCastFallback(context, streamRequest.uri, ps) },
                onExternal = ::openPlayerPicker,
            )
            SeekJumpPill(
                visible = session.seekPillVisible,
                offsetMs = session.seekPillMs,
                modifier = Modifier.align(Alignment.Center).offset(y = (-96).dp),
            )
        }

        attempt.playbackError?.let { issue ->
            val actions = buildList {
                add(PlayerErrorAction(ps.retry, Icons.Rounded.Refresh, true, ::retryPlayback))
                if (isLive) {
                    nextItem?.let { next -> add(PlayerErrorAction(ps.nextChannel, Icons.Rounded.SkipNext, false) { switchTo(next) }) }
                } else if (useLibVlc || isLibVlcSafeForRequest(playbackRequest)) {
                    add(PlayerErrorAction(ps.otherEngine, Icons.Rounded.SwapHoriz, false, ::tryOtherVodEngine))
                }
                add(PlayerErrorAction(ps.externalPlayer, Icons.AutoMirrored.Rounded.OpenInNew, false, ::openPlayerPicker))
                add(PlayerErrorAction(strings.back, Icons.AutoMirrored.Rounded.ArrowBack, false, ::leavePlayer))
            }
            PlaybackErrorCard(
                title = strings.playerCouldNotPlay,
                message = ps.issueText(issue),
                actions = actions,
                firstActionFocus = errorFocusRequester,
                accent = accent,
            )
        }
    }
}

/**
 * Media3 video surface. The PlayerView is re-bound to the current ExoPlayer on every update: the
 * player is rebuilt per channel, per fallback and per redirect, while the view is only recreated
 * when the surface type changes. Without the re-bind the new player renders into no surface
 * (black or frozen picture with sound) until a watchdog forces a rebuild.
 */
@Composable
private fun Media3Surface(exoPlayer: ExoPlayer, surfaceAttempt: Int, isPerformanceMode: Boolean, resizeMode: Int) {
    val useTextureView = shouldUseTextureViewForMedia3(
        sdkInt = Build.VERSION.SDK_INT,
        isPerformanceMode = isPerformanceMode,
        supportedAbis = Build.SUPPORTED_ABIS,
        surfaceAttempt = surfaceAttempt,
    )
    key(useTextureView, surfaceAttempt) {
        AndroidView(
            factory = { viewContext ->
                val playerView = if (useTextureView) {
                    LayoutInflater.from(viewContext).inflate(R.layout.view_player_texture, null) as PlayerView
                } else {
                    PlayerView(viewContext)
                }
                playerView.apply {
                    layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
                    minimumWidth = 1
                    minimumHeight = 1
                    useController = false
                    this.resizeMode = resizeMode
                    // The last frame stays until the next channel's first frame instead of flashing black.
                    setKeepContentOnPlayerReset(true)
                    setShowBuffering(PlayerView.SHOW_BUFFERING_NEVER)
                    setShutterBackgroundColor(android.graphics.Color.TRANSPARENT)
                    setEnableComposeSurfaceSyncWorkaround(true)
                    keepScreenOn = true
                    player = exoPlayer
                }
            },
            update = { view ->
                if (view.player !== exoPlayer) view.player = exoPlayer
                if (view.layoutParams?.width != ViewGroup.LayoutParams.MATCH_PARENT ||
                    view.layoutParams?.height != ViewGroup.LayoutParams.MATCH_PARENT
                ) {
                    view.layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
                }
                view.resizeMode = resizeMode
                view.keepScreenOn = true
            },
            onRelease = { view -> view.player = null },
            modifier = Modifier.fillMaxSize(),
        )
    }
}

/**
 * Media3 lifecycle per the Media3 guidance for API 24+: keep playing through pause-only
 * interruptions (Google TV side panel, dialogs), stop on ON_STOP and resume on ON_START only if
 * playback was wanted. Deciding in ON_STOP (not after an ON_PAUSE pause) is what makes Home ->
 * back resume instead of leaving VOD stuck in IDLE.
 */
@Composable
private fun Media3LifecycleBinding(
    exoPlayer: ExoPlayer,
    enabled: Boolean,
    isLive: Boolean,
    onSaveProgress: (positionMs: Long, durationMs: Long) -> Unit,
) {
    val lifecycleOwner = LocalLifecycleOwner.current
    val currentIsLive by rememberUpdatedState(isLive)
    val currentOnSaveProgress by rememberUpdatedState(onSaveProgress)
    DisposableEffect(lifecycleOwner, exoPlayer, enabled) {
        if (!enabled) return@DisposableEffect onDispose { }
        var resumeOnStart = false
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_STOP -> {
                    resumeOnStart = exoPlayer.playWhenReady && exoPlayer.playerError == null && exoPlayer.mediaItemCount > 0
                    if (!currentIsLive && exoPlayer.duration > 0) {
                        currentOnSaveProgress(exoPlayer.currentPosition.coerceAtLeast(0), exoPlayer.duration)
                    }
                    exoPlayer.stop()
                }
                Lifecycle.Event.ON_START -> {
                    if (resumeOnStart && exoPlayer.playbackState == Player.STATE_IDLE && exoPlayer.playerError == null) {
                        if (currentIsLive) exoPlayer.seekToDefaultPosition()
                        exoPlayer.playWhenReady = true
                        exoPlayer.prepare()
                    }
                    resumeOnStart = false
                }
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }
}

/** Session-level timers that only flip visibility flags. */
@Composable
private fun PlayerSessionTimers(session: PlayerSessionState) {
    LaunchedEffect(session.seekPillNonce) {
        if (session.seekPillNonce == 0) return@LaunchedEffect
        session.seekPillVisible = true
        delay(900)
        session.seekPillVisible = false
    }
    LaunchedEffect(session.seekPreviewNonce) {
        if (session.seekPreviewNonce == 0) return@LaunchedEffect
        session.seekPreviewVisible = true
        delay(2_500)
        session.seekPreviewVisible = false
    }
    LaunchedEffect(session.transientMessageNonce) {
        if (session.transientMessage == null) return@LaunchedEffect
        delay(2_400)
        session.transientMessage = null
    }
    LaunchedEffect(session.recoveryNoticeNonce) {
        if (session.recoveryNotice == null) return@LaunchedEffect
        delay(6_000)
        session.recoveryNotice = null
    }
}

/** Tracks internet availability while a live channel is open, so reconnects wait for the network and resume when it returns. */
@Composable
private fun NetworkAvailabilityEffect(enabled: Boolean, onAvailabilityChanged: (Boolean) -> Unit) {
    val context = LocalContext.current
    val currentCallback by rememberUpdatedState(onAvailabilityChanged)
    DisposableEffect(enabled, context) {
        val manager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        if (!enabled || manager == null) return@DisposableEffect onDispose { }
        val mainHandler = Handler(Looper.getMainLooper())
        var active = true
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                mainHandler.post { if (active) currentCallback(true) }
            }

            override fun onLost(network: Network) {
                mainHandler.post { if (active) currentCallback(context.hasInternetConnection()) }
            }
        }
        val request = NetworkRequest.Builder().addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET).build()
        val registered = runCatching { manager.registerNetworkCallback(request, callback) }.isSuccess
        onDispose {
            active = false
            if (registered) runCatching { manager.unregisterNetworkCallback(callback) }
        }
    }
}

/**
 * Subtitle import lives in its OWN composable so the launcher, IO and Media3 re-apply do not grow
 * the PlayerScreen method (API 23 ART rejects oversized methods with a VerifyError). Returns a
 * lambda that opens the system file picker; on pick it copies the file to cache, notifies the
 * caller and, for Media3 VOD, re-applies the stream with the subtitle merged in.
 */
@Composable
private fun rememberSubtitleImport(
    exoPlayer: ExoPlayer,
    item: AppMediaItem,
    request: StreamRequest,
    isLive: Boolean,
    useLibVlc: Boolean,
    performancePolicy: PerformancePolicy,
    onImported: (Uri) -> Unit,
    onFail: () -> Unit,
    beforeLaunch: () -> Unit,
): () -> Unit {
    val context = LocalContext.current
    val importedLabel = LocalStrings.current.player.importedSubtitle
    val scope = rememberCoroutineScope()
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { picked ->
        val uri = picked ?: return@rememberLauncherForActivityResult
        scope.launch {
            val cached = withContext(Dispatchers.IO) { copySubtitleToCache(context, uri) }
            if (cached == null) {
                onFail()
                return@launch
            }
            val fileUri = Uri.fromFile(cached)
            onImported(fileUri)
            if (!useLibVlc && !isLive) {
                runCatching {
                    val position = exoPlayer.currentPosition.coerceAtLeast(0)
                    exoPlayer.setMediaItem(
                        buildPlayableMediaItem(request, item, isLive, performancePolicy.liveProfile(), externalSubtitleConfiguration(fileUri, importedLabel)),
                        position,
                    )
                    exoPlayer.prepare()
                    exoPlayer.playWhenReady = true
                    exoPlayer.trackSelectionParameters = exoPlayer.trackSelectionParameters.buildUpon()
                        .setPreferredTextLanguage("und")
                        .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, false)
                        .build()
                }
            }
        }
    }
    return {
        beforeLaunch()
        runCatching {
            launcher.launch(arrayOf("application/x-subrip", "text/vtt", "application/ttml+xml", "text/plain", "application/octet-stream", "*/*"))
        }.onFailure { onFail() }
    }
}

/** Build a Media3 SubtitleConfiguration from an imported local subtitle file uri. */
private fun externalSubtitleConfiguration(uri: Uri, label: String): MediaItem.SubtitleConfiguration {
    val name = (uri.lastPathSegment ?: "").lowercase()
    val mime = when {
        name.endsWith(".vtt") -> MimeTypes.TEXT_VTT
        name.endsWith(".ttml") || name.endsWith(".dfxp") || name.endsWith(".xml") -> MimeTypes.APPLICATION_TTML
        name.endsWith(".ssa") || name.endsWith(".ass") -> MimeTypes.TEXT_SSA
        else -> MimeTypes.APPLICATION_SUBRIP
    }
    return MediaItem.SubtitleConfiguration.Builder(uri)
        .setMimeType(mime)
        .setLanguage("und")
        .setLabel(label)
        .setSelectionFlags(C.SELECTION_FLAG_DEFAULT)
        .build()
}

/** Copy a picked subtitle (content://) into cache and return a file:// path usable by both engines. */
private fun copySubtitleToCache(context: Context, uri: Uri): java.io.File? = runCatching {
    val segment = uri.lastPathSegment ?: "sub"
    val extension = listOf(".srt", ".vtt", ".ass", ".ssa", ".ttml", ".dfxp", ".sub")
        .firstOrNull { segment.lowercase().endsWith(it) } ?: ".srt"
    val out = java.io.File(context.cacheDir, "imported-subtitle$extension")
    context.contentResolver.openInputStream(uri)?.use { input ->
        out.outputStream().use { input.copyTo(it) }
    } ?: return null
    out
}.getOrNull()

private class ExternalLaunchResult(val success: Boolean, val message: String)

private fun openExternalPlayer(
    context: Context,
    request: StreamRequest,
    title: String,
    route: String,
    strings: PlayerStrings,
): ExternalLaunchResult {
    val packageNames = when (route) {
        "vlc" -> listOf("org.videolan.vlc")
        "mx" -> listOf("com.mxtech.videoplayer.ad", "com.mxtech.videoplayer.pro")
        else -> emptyList()
    }
    val baseIntent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(Uri.parse(request.uri), "video/*")
        putExtra("title", title)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        request.headers.forEach { (key, value) -> putExtra(key, value) }
    }
    if (route == "external") {
        val chooser = Intent.createChooser(baseIntent, strings.chooseVideoPlayer).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return try {
            context.startActivity(chooser)
            ExternalLaunchResult(true, strings.externalOpened)
        } catch (_: ActivityNotFoundException) {
            ExternalLaunchResult(false, strings.noExternalPlayer)
        }
    }
    packageNames.forEach { packageName ->
        try {
            context.packageManager.getPackageInfo(packageName, 0)
            context.startActivity(Intent(baseIntent).setPackage(packageName))
            return ExternalLaunchResult(true, strings.externalOpenedTitle.fill(title.isolate()))
        } catch (_: Exception) {
        }
    }
    return ExternalLaunchResult(
        success = false,
        message = when (route) {
            "vlc" -> strings.vlcMissing
            "mx" -> strings.mxMissing
            else -> strings.externalFailed
        },
    )
}

private fun launchCastFallback(context: Context, streamUrl: String, strings: PlayerStrings) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(streamUrl)).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        putExtra(Intent.EXTRA_TITLE, strings.castIntentTitle)
    }
    runCatching {
        context.startActivity(Intent.createChooser(intent, strings.castChooserTitle).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }.recoverCatching {
        context.startActivity(intent)
    }
}

private fun canLaunchCast(context: Context, streamUrl: String): Boolean {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(streamUrl))
    return runCatching {
        context.packageManager.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY).isNotEmpty()
    }.getOrDefault(false)
}

private fun Context.hasInternetConnection(): Boolean {
    val manager = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return true
    val network = manager.activeNetwork ?: return false
    val capabilities = manager.getNetworkCapabilities(network) ?: return false
    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
}
