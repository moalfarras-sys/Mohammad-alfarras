package com.moalfarras.moplayer.ui.player

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.net.Uri
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.content.pm.PackageManager
import android.os.PowerManager
import android.view.LayoutInflater
import android.view.KeyEvent as AndroidKeyEvent
import android.view.TextureView
import android.view.WindowManager
import androidx.activity.compose.BackHandler
import androidx.annotation.OptIn
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.BringIntoViewSpec
import androidx.compose.foundation.gestures.LocalBringIntoViewSpec
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Audiotrack
import androidx.compose.material.icons.rounded.Cast
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Forward10

import androidx.compose.material.icons.rounded.HighQuality
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Refresh

import androidx.compose.material.icons.rounded.Replay10
import androidx.compose.material.icons.rounded.SkipNext
import androidx.compose.material.icons.rounded.SkipPrevious
import androidx.compose.material.icons.rounded.Subtitles
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator

import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.components.FocusGlow
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.key
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.nativeKeyCode
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.viewinterop.AndroidView
import com.moalfarras.moplayer.core.PerformancePolicy
import com.moalfarras.moplayerpro.R
import androidx.media3.common.C
import androidx.media3.common.AudioAttributes
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.ParserException
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.Format
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.HttpDataSource
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.DefaultLivePlaybackSpeedControl
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.hls.DefaultHlsExtractorFactory
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.UnrecognizedInputFormatException
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.media3.exoplayer.upstream.DefaultLoadErrorHandlingPolicy
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy
import androidx.media3.extractor.DefaultExtractorsFactory
import androidx.media3.extractor.ts.DefaultTsPayloadReaderFactory
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import androidx.media3.ui.TrackSelectionDialogBuilder
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import coil3.compose.AsyncImage
import com.moalfarras.moplayer.data.network.NetworkModule
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem as AppMediaItem
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import kotlinx.coroutines.delay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.Request
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import android.os.Build
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.LinkedHashMap
import java.util.Locale
import java.util.concurrent.TimeUnit

private val APP_USER_AGENT = "MoPlayerPro/${com.moalfarras.moplayerpro.BuildConfig.VERSION_NAME} AndroidTV Media3/1.10 LibVLC/3.6"
private const val LIVE_STALL_RECOVERY_LIMIT = 4
private const val LIVE_AUTO_RECOVERY_SWITCH_LIMIT = 2
private const val MEDIA3_SURFACE_RETRY_LIMIT = 2
private const val LIBVLC_LIVE_CACHE_MS = 900
private const val LIBVLC_FILE_CACHE_MS = 2_000

enum class LiveQualityMode { AUTO, BEST, ULTRA, STABLE }
private enum class InternalPlaybackEngine { MEDIA3, LIBVLC }

internal data class LivePlaybackProfile(
    val minBufferMs: Int,
    val maxBufferMs: Int,
    val bufferForPlaybackMs: Int,
    val bufferForPlaybackAfterRebufferMs: Int,
    val targetOffsetMs: Long,
    val minOffsetMs: Long,
    val maxOffsetMs: Long,
    val minPlaybackSpeed: Float,
    val maxPlaybackSpeed: Float,
)

@kotlin.OptIn(ExperimentalFoundationApi::class)
private val PlayerEdgeBringIntoViewSpec = object : BringIntoViewSpec {
    override val scrollAnimationSpec: AnimationSpec<Float> = snap()

    override fun calculateScrollDistance(offset: Float, size: Float, containerSize: Float): Float {
        val itemStart = offset
        val itemEnd = offset + size
        return when {
            itemStart < 0f -> itemStart
            itemEnd > containerSize -> itemEnd - containerSize
            else -> 0f
        }
    }
}

private fun preferredLiveAutoEngine(request: StreamRequest, performancePolicy: PerformancePolicy? = null): InternalPlaybackEngine {
    if (shouldStartWithLibVlc(request) && isLibVlcSafeOnThisDevice()) {
        return InternalPlaybackEngine.LIBVLC
    }
    val uri = request.uri.lowercase(Locale.US)
    // Both LibVLC branches require x86-unsafe build; on x86 emulators (and rare Atom boxes)
    // we always fall through to Media3 to avoid the AWindow surface-attach crash.
    if (uri.startsWith("rtsp://") && isLibVlcSafeOnThisDevice()) return InternalPlaybackEngine.LIBVLC
    if (Build.VERSION.SDK_INT < 26 && request.uri.hasLiveTsHint() && isLibVlcSafeOnThisDevice()) {
        return InternalPlaybackEngine.LIBVLC
    }
    return when (request.mimeType) {
        MimeTypes.APPLICATION_M3U8,
        MimeTypes.APPLICATION_MPD,
        MimeTypes.APPLICATION_SS -> InternalPlaybackEngine.MEDIA3
        else -> InternalPlaybackEngine.MEDIA3
    }
}

private fun preferredAutoEngine(request: StreamRequest, isLive: Boolean, performancePolicy: PerformancePolicy): InternalPlaybackEngine =
    if (isLive) {
        preferredLiveAutoEngine(request, performancePolicy)
    } else if (shouldStartWithLibVlc(request) && isLibVlcSafeOnThisDevice()) {
        InternalPlaybackEngine.LIBVLC
    } else {
        InternalPlaybackEngine.MEDIA3
    }

@OptIn(UnstableApi::class)
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
    performancePolicy: PerformancePolicy,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val strings = LocalStrings.current
    val isLive = item.type == ContentType.LIVE
    val streamRequest = remember(item.streamUrl) { parseStreamRequest(item.streamUrl) }
    val canCast = remember(streamRequest.uri) { canLaunchCast(context, streamRequest.uri) }
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
    var internalEngine by remember(item.id, route, streamRequest.uri, performancePolicy.mode) {
        mutableStateOf(if (route == "auto") preferredAutoEngine(streamRequest, isLive, performancePolicy) else InternalPlaybackEngine.MEDIA3)
    }
    var launchMessage by remember(item.id) { mutableStateOf<String?>(null) }
    var externalLaunchNonce by remember(item.id) { mutableIntStateOf(0) }
    var isPlaying by remember { mutableStateOf(true) }
    var currentPosition by remember { mutableLongStateOf(item.watchPositionMs.coerceAtLeast(0)) }
    var duration by remember { mutableLongStateOf(item.watchDurationMs.coerceAtLeast(1L)) }
    var showControls by remember(item.id, isLive) { mutableStateOf(!isLive) }
    var showLiveZap by remember(item.id) { mutableStateOf(false) }
    var showMiniInfo by remember(item.id) { mutableStateOf(isLive) }
    var isBuffering by remember { mutableStateOf(true) }
    var playbackError by remember { mutableStateOf<String?>(null) }
    var lastInteraction by remember { mutableLongStateOf(System.currentTimeMillis()) }
    var seekJump by remember { mutableIntStateOf(0) }
    var lastSeekAt by remember { mutableLongStateOf(0L) }
    var seekStreak by remember { mutableIntStateOf(0) }
    var resizeIndex by remember { mutableIntStateOf(0) }
    var favoriteMarked by remember(item.id, item.type) { mutableStateOf(item.isFavorite) }
    var liveQualityMode by remember(performancePolicy.mode) {
        mutableStateOf(if (performancePolicy.isPerformance) LiveQualityMode.STABLE else LiveQualityMode.AUTO)
    }
    var playbackSignal by remember(item.id, isLive) { mutableStateOf(if (isLive) "Smart Auto" else "") }
    var libVlcRetryNonce by remember(item.id, streamRequest.uri) { mutableIntStateOf(0) }
    var libVlcPlayPauseNonce by remember(item.id, streamRequest.uri) { mutableIntStateOf(0) }
    var liveSwitchLocked by remember(item.id) { mutableStateOf(false) }
    var lastLiveSwitchAt by remember { mutableLongStateOf(0L) }
    var liveLastPlayingAt by remember(item.id, streamRequest.uri) { mutableLongStateOf(0L) }
    var liveReadyWithoutVideoAt by remember(item.id, streamRequest.uri) { mutableLongStateOf(0L) }
    var liveFirstFrameRendered by remember(item.id, streamRequest.uri) { mutableStateOf(false) }
    var liveOpeningGuard by remember(item.id, streamRequest.uri) { mutableStateOf(false) }
    var media3SurfaceAttempt by remember(item.id, streamRequest.uri) { mutableIntStateOf(0) }
    // VOD black screen watchdog: track when VOD reaches READY but hasn't rendered first frame
    var vodReadyAt by remember(item.id, streamRequest.uri) { mutableLongStateOf(0L) }
    var vodFirstFrameRendered by remember(item.id, streamRequest.uri) { mutableStateOf(false) }
    var vodOpeningGuard by remember(item.id, streamRequest.uri) { mutableStateOf(false) }
    var liveConsecutiveFailures by remember(item.id, streamRequest.uri) { mutableIntStateOf(0) }
    var liveAutoRecoveryAttempts by remember { mutableIntStateOf(0) }
    var liveAutoRecoveryVisited by remember { mutableStateOf<Set<String>>(emptySet()) }
    var triedMedia3ForLive by remember(item.id, streamRequest.uri) {
        mutableStateOf(preferredLiveAutoEngine(streamRequest, performancePolicy) == InternalPlaybackEngine.MEDIA3)
    }
    var triedLibVlcForLive by remember(item.id, streamRequest.uri) {
        mutableStateOf(preferredLiveAutoEngine(streamRequest, performancePolicy) == InternalPlaybackEngine.LIBVLC)
    }
    var forceLibVlcForLive by remember(item.id, streamRequest.uri) {
        mutableStateOf(preferredLiveAutoEngine(streamRequest, performancePolicy) == InternalPlaybackEngine.LIBVLC)
    }
    var triedLibVlcForVod by remember(item.id, streamRequest.uri) { mutableStateOf(false) }
    var forceLibVlcForVod by remember(item.id, streamRequest.uri) { mutableStateOf(false) }
    var triedCompatibleLiveAlternative by remember(item.id, streamRequest.uri) { mutableStateOf(false) }
    var resolvedLiveRequest by remember(item.id, streamRequest.uri) { mutableStateOf<StreamRequest?>(null) }
    var liveRedirectResolved by remember(item.id, streamRequest.uri) {
        mutableStateOf(!isLive || !streamRequest.uri.hasLiveTsHint())
    }
    var forceHlsForLiveRedirect by remember(item.id, streamRequest.uri) { mutableStateOf(false) }
    val playbackRequest = remember(streamRequest, resolvedLiveRequest, liveRedirectResolved, forceHlsForLiveRedirect, forceLibVlcForLive, isLive) {
        val keepOriginalForImmediateVlc = isLive && forceLibVlcForLive && !forceHlsForLiveRedirect
        val resolved = if (liveRedirectResolved && !keepOriginalForImmediateVlc) resolvedLiveRequest ?: streamRequest else streamRequest
        if (forceHlsForLiveRedirect) resolved.copy(mimeType = MimeTypes.APPLICATION_M3U8) else resolved
    }
    val liveStallRecoveryLimit = remember(performancePolicy.mode) {
        if (performancePolicy.isPerformance || Build.VERSION.SDK_INT < 26) 1 else LIVE_STALL_RECOVERY_LIMIT
    }
    val playerFocusRequester = remember { FocusRequester() }
    val playPauseFocusRequester = remember { FocusRequester() }
    val performanceStatus = remember(performancePolicy.mode, internalEngine, route, isLive) {
        if (performancePolicy.isPerformance) {
            val engine = if (route == "auto" && internalEngine == InternalPlaybackEngine.LIBVLC) "VLC live" else "Media3 stable"
            "Performance mode | $engine | ${performancePolicy.maxVideoHeight}p cap"
        } else {
            ""
        }
    }

    val resizeModes = listOf(
        AspectRatioFrameLayout.RESIZE_MODE_FIT,
        AspectRatioFrameLayout.RESIZE_MODE_FILL,
        AspectRatioFrameLayout.RESIZE_MODE_ZOOM,
    )
    val resizeLabels = listOf("Fit", "Fill", "Zoom")

    LaunchedEffect(item.id, route, externalLaunchNonce) {
        launchMessage = null
        val resolvedRoute = route ?: return@LaunchedEffect
        if (resolvedRoute == "media3" || resolvedRoute == "auto") return@LaunchedEffect
        val externalResult = openExternalPlayer(context, streamRequest, item.title, resolvedRoute)
        if (externalResult.success) {
            onBack(0, 0)
        } else {
            launchMessage = externalResult.message
        }
    }

    LaunchedEffect(item.id, streamRequest.uri, isLive) {
        // Start live playback INSTANTLY with the direct stream. Almost every IPTV live URL is
        // a direct MPEG-TS that Media3 plays natively, so blocking startup on an HTTP probe
        // just adds dead time before the first frame (the slow "Opening channel..."). We mark
        // the request resolved up front and probe in the background, swapping the source only
        // if the server actually redirects a ".ts" URL to a real HLS/DASH manifest (rare).
        resolvedLiveRequest = streamRequest
        liveRedirectResolved = true
        if (!isLive || !streamRequest.uri.hasLiveTsHint()) return@LaunchedEffect
        val probed = resolveLiveRedirectRequest(streamRequest)
        if (probed.uri != streamRequest.uri && (
                probed.mimeType == MimeTypes.APPLICATION_M3U8 ||
                    probed.mimeType == MimeTypes.APPLICATION_MPD ||
                    probed.mimeType == MimeTypes.APPLICATION_SS
                )
        ) {
            resolvedLiveRequest = probed
        }
    }

    LaunchedEffect(isLive, liveRedirectResolved, playbackRequest.uri, playbackRequest.mimeType) {
        if (isLive &&
            liveRedirectResolved &&
            Build.VERSION.SDK_INT < 26 &&
            playbackRequest.mimeType == MimeTypes.APPLICATION_M3U8 &&
            route == "auto"
        ) {
            forceLibVlcForLive = true
            internalEngine = InternalPlaybackEngine.LIBVLC
            triedLibVlcForLive = true
        }
    }

    if (route == null) {
        PlayerRoutePicker(
            title = item.title,
            onSelect = { route = it },
            onDismiss = { onBack(0, 0) },
        )
        return
    }

    if (route != "media3" && route != "auto") {
        ExternalLaunchScreen(
            title = item.title,
            message = launchMessage ?: "Opening external player...",
            onRetrySame = {
                launchMessage = null
                externalLaunchNonce++
            },
            onUseMedia3 = {
                launchMessage = null
                route = "media3"
                internalEngine = InternalPlaybackEngine.MEDIA3
            },
            onPickAnother = { route = null },
            onBack = { onBack(0, 0) },
        )
        return
    }

    fun switchToCompatibleAlternative(reason: String): Boolean {
        if (!isLive || triedCompatibleLiveAlternative || liveSwitchLocked) return false
        val visited = liveAutoRecoveryVisited + item.liveRecoveryKey()
        if (liveAutoRecoveryAttempts >= LIVE_AUTO_RECOVERY_SWITCH_LIMIT) {
            liveAutoRecoveryVisited = visited
            return false
        }
        val alternative = relatedItems.bestCompatibleLiveAlternative(
            current = item,
            maxVideoHeight = performancePolicy.maxVideoHeight,
            excludedKeys = visited,
        ) ?: run {
            liveAutoRecoveryVisited = visited
            return false
        }
        liveAutoRecoveryAttempts += 1
        liveAutoRecoveryVisited = visited + alternative.liveRecoveryKey()
        triedCompatibleLiveAlternative = true
        liveSwitchLocked = true
        playbackError = null
        isBuffering = true
        liveFirstFrameRendered = false
        liveReadyWithoutVideoAt = 0L
        playbackSignal = "$reason $liveAutoRecoveryAttempts/$LIVE_AUTO_RECOVERY_SWITCH_LIMIT"
        onPlayItem(alternative)
        return true
    }

    val useLibVlc = route == "auto" && when {
        isLive -> internalEngine == InternalPlaybackEngine.LIBVLC || forceLibVlcForLive
        else -> internalEngine == InternalPlaybackEngine.LIBVLC || forceLibVlcForVod
    }

    fun retryMedia3WithAlternateSurface(reason: String): Boolean {
        if (!isLive || useLibVlc || media3SurfaceAttempt >= MEDIA3_SURFACE_RETRY_LIMIT) return false
        media3SurfaceAttempt += 1
        playbackError = null
        isBuffering = true
        liveOpeningGuard = true
        liveFirstFrameRendered = false
        liveReadyWithoutVideoAt = 0L
        liveConsecutiveFailures = 0
        liveSwitchLocked = false
        playbackSignal = "$reason ${media3SurfaceAttempt}/$MEDIA3_SURFACE_RETRY_LIMIT"
        return true
    }

    val exoPlayer = remember(item.id, playbackRequest.uri, playbackRequest.mimeType, liveRedirectResolved, useLibVlc, performancePolicy.mode, media3SurfaceAttempt) {
        buildPlayer(
            context = context,
            request = playbackRequest,
            item = item,
            isLive = isLive,
            performancePolicy = performancePolicy,
            onIsPlayingChanged = { isPlaying = it },
            onPlaybackStateChanged = { state ->
                isBuffering = state == Player.STATE_BUFFERING || state == Player.STATE_IDLE
                if (state == Player.STATE_READY) {
                    liveLastPlayingAt = System.currentTimeMillis()
                    liveReadyWithoutVideoAt = if (isLive) System.currentTimeMillis() else 0L
                    liveConsecutiveFailures = 0
                    liveSwitchLocked = false
                    playbackError = null
                    // VOD watchdog: mark ready time if first frame hasn't rendered yet
                    if (!isLive && !vodFirstFrameRendered && vodReadyAt == 0L) {
                        vodReadyAt = System.currentTimeMillis()
                    }
                }
            },
            onRenderedFirstFrame = {
                liveFirstFrameRendered = true
                liveReadyWithoutVideoAt = 0L
                liveAutoRecoveryAttempts = 0
                liveAutoRecoveryVisited = emptySet()
                // VOD watchdog: first frame arrived, clear watchdog
                vodFirstFrameRendered = true
                vodReadyAt = 0L
                vodOpeningGuard = false
            },
            onPlayerError = { error ->
                liveSwitchLocked = false
                if (isLive &&
                    streamRequest.uri.hasLiveTsHint() &&
                    !forceHlsForLiveRedirect &&
                    error.cause is UnrecognizedInputFormatException
                ) {
                    forceHlsForLiveRedirect = true
                    playbackError = null
                    isBuffering = true
                    liveFirstFrameRendered = false
                    liveReadyWithoutVideoAt = 0L
                    return@buildPlayer
                }
                if (isLive && retryMedia3WithAlternateSurface("Switching video surface")) {
                    return@buildPlayer
                }
                if (isLive && switchToCompatibleAlternative("Switching to a safer quality")) {
                    return@buildPlayer
                }
                if (isLive && isLibVlcSafeForRequest(playbackRequest) && shouldFallbackToLibVlc(error) && !triedLibVlcForLive) {
                    triedLibVlcForLive = true
                    forceLibVlcForLive = true
                    playbackError = null
                    isBuffering = true
                    internalEngine = InternalPlaybackEngine.LIBVLC
                    return@buildPlayer
                }
                if (!isLive && isLibVlcSafeForRequest(playbackRequest) && shouldFallbackToLibVlc(error) && !triedLibVlcForVod) {
                    triedLibVlcForVod = true
                    forceLibVlcForVod = true
                    route = "auto"
                    playbackError = null
                    isBuffering = true
                    vodFirstFrameRendered = false
                    vodReadyAt = 0L
                    vodOpeningGuard = true
                    internalEngine = InternalPlaybackEngine.LIBVLC
                    return@buildPlayer
                }
                playbackError = explainPlaybackError(context, error, playbackRequest.uri, isLive)
                PlaybackTelemetryStore.record(
                    PlaybackTelemetrySnapshot(
                        mediaId = item.id,
                        title = item.title,
                        isLive = isLive,
                        collectedAt = System.currentTimeMillis(),
                        statsSummary = "error=${error.errorCodeName}; cause=${error.cause?.javaClass?.simpleName.orEmpty()}; ${streamRequest.uri.safeStreamLabel()}",
                    ),
                )
            },
            onDurationChanged = { latestDuration ->
                duration = latestDuration.coerceAtLeast(1L)
            },
            startPlayback = !useLibVlc && liveRedirectResolved,
        )
    }

    DisposableEffect(exoPlayer, item.id) {
        onDispose {
            if (!isLive && exoPlayer.duration > 0) {
                onProgress(item, exoPlayer.currentPosition.coerceAtLeast(0), exoPlayer.duration.coerceAtLeast(0))
            }
            exoPlayer.release()
        }
    }

    // MediaSession: wire the player to the platform media controller so hardware media
    // keys (TV remote play/pause/next/prev/FF/RW, Bluetooth headphones, watch controls)
    // are routed correctly even when this activity isn't focused.
    DisposableEffect(exoPlayer, item.id) {
        val session = runCatching {
            androidx.media3.session.MediaSession.Builder(context, exoPlayer)
                .setId("MoPlayerPro-${item.id}-${System.currentTimeMillis()}")
                .build()
        }.getOrNull()
        onDispose {
            runCatching { session?.release() }
        }
    }

    // Reinforce screen-on/wake while the player is on screen so TV boxes never go to sleep
    // mid-stream, even on Lifecycle.ON_STOP false alarms or screensaver triggers.
    DisposableEffect(item.id) {
        val activity = context.findActivity()
        activity?.window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        val wakeLock = powerManager
            ?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MoPlayerPro::Playback")
            ?.apply {
                setReferenceCounted(false)
                runCatching { acquire(6 * 60 * 60 * 1000L) } // safety cap: 6h per session
            }
        onDispose {
            runCatching { if (wakeLock?.isHeld == true) wakeLock.release() }
            // Leave the activity-level KEEP_SCREEN_ON flag in place; it is already requested
            // at MainActivity start and other screens benefit from it as well.
        }
    }

    LaunchedEffect(exoPlayer, item.id) {
        while (true) {
            currentPosition = exoPlayer.currentPosition.coerceAtLeast(0)
            duration = exoPlayer.duration.coerceAtLeast(duration)
            val signalFallback = if (isLive) performanceStatus.ifBlank { "Smart Auto" } else performanceStatus
            playbackSignal = playbackSignal(exoPlayer.videoFormat, signalFallback)
            // Auto-hide only when the video is actively playing AND the player engine confirms
            // playback (so a stale isPlaying=true racing with onIsPlayingChanged won't hide
            // controls during a pause). Give the user more time on TVs since D-pad is slower.
            val engineReportsPlaying = runCatching { exoPlayer.isPlaying }.getOrDefault(isPlaying)
            val effectivelyPlaying = isPlaying && engineReportsPlaying
            val autoHideMs = if (isLive) 4_000L else 8_000L
            if (showControls && effectivelyPlaying && System.currentTimeMillis() - lastInteraction > autoHideMs) {
                showControls = false
            }
            delay(400)
        }
    }

    LaunchedEffect(exoPlayer, item.id) {
        while (true) {
            if (!isLive && exoPlayer.duration > 0 && exoPlayer.currentPosition > 0) {
                onProgress(item, exoPlayer.currentPosition, exoPlayer.duration)
            }
            delay(12_000)
        }
    }

    DisposableEffect(lifecycleOwner, exoPlayer, useLibVlc) {
        var resumeMedia3OnStart = false
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_PAUSE -> {
                    if (!useLibVlc) {
                        exoPlayer.playWhenReady = false
                        exoPlayer.pause()
                    }
                }
                Lifecycle.Event.ON_STOP -> {
                    resumeMedia3OnStart = !useLibVlc && exoPlayer.playWhenReady
                    if (!useLibVlc) {
                        exoPlayer.playWhenReady = false
                        exoPlayer.stop()
                    }
                }
                Lifecycle.Event.ON_START -> {
                    if (resumeMedia3OnStart && !useLibVlc) {
                        exoPlayer.prepare()
                        exoPlayer.playWhenReady = true
                        exoPlayer.play()
                    }
                    resumeMedia3OnStart = false
                }
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(item.id) {
        runCatching { playerFocusRequester.requestFocus() }
    }

    // When VOD controls appear, push focus to Play/Pause button. Use a tiny delay so the
    // button is composed first, but small enough that the user never sees an unfocused row.
    LaunchedEffect(showControls, item.id) {
        if (showControls && !isLive) {
            delay(40)
            runCatching { playPauseFocusRequester.requestFocus() }
        }
    }

    // VOD black screen watchdog: if READY for 8s but no first frame, show error
    LaunchedEffect(vodReadyAt, vodFirstFrameRendered, item.id, streamRequest.uri) {
        if (isLive || vodFirstFrameRendered || vodReadyAt <= 0L) return@LaunchedEffect
        delay(8_000)
        if (vodReadyAt > 0L && !vodFirstFrameRendered && playbackError == null) {
            if (isLibVlcSafeForRequest(playbackRequest) && !triedLibVlcForVod) {
                triedLibVlcForVod = true
                forceLibVlcForVod = true
                route = "auto"
                internalEngine = InternalPlaybackEngine.LIBVLC
                isBuffering = true
                vodReadyAt = 0L
                vodOpeningGuard = true
            } else {
                playbackError = "The video connected but could not render any frames. Try again, switch quality, or use an external player."
                isBuffering = false
            }
        }
    }

    LaunchedEffect(useLibVlc, exoPlayer) {
        if (useLibVlc) {
            exoPlayer.pause()
            exoPlayer.stop()
        }
    }

    LaunchedEffect(isLive, playbackRequest.uri, item.id, media3SurfaceAttempt) {
        if (isLive) {
            liveOpeningGuard = true
            delay(10_000)
            liveOpeningGuard = false
        } else {
            liveOpeningGuard = false
        }
    }

    LaunchedEffect(isLive, playbackRequest.uri, item.id) {
        if (!isLive) {
            vodOpeningGuard = true
            delay(7_000)
            vodOpeningGuard = false
        } else {
            vodOpeningGuard = false
        }
    }

    LaunchedEffect(liveSwitchLocked, item.id, streamRequest.uri) {
        if (liveSwitchLocked) {
            delay(1_200)
            liveSwitchLocked = false
        }
    }

    LaunchedEffect(seekJump) {
        if (seekJump != 0) {
            delay(900)
            seekJump = 0
        }
    }

    LaunchedEffect(isLive, isBuffering, playbackError, item.id, streamRequest.uri, useLibVlc, liveConsecutiveFailures, media3SurfaceAttempt, exoPlayer) {
        if (!isLive || !isBuffering || playbackError != null) return@LaunchedEffect
        delay(if (performancePolicy.isPerformance || Build.VERSION.SDK_INT < 26) 3_500 else 5_000)
        if (isBuffering && playbackError == null) {
            if (isLive && !useLibVlc && isLibVlcSafeForRequest(playbackRequest) && !triedLibVlcForLive) {
                triedLibVlcForLive = true
                internalEngine = InternalPlaybackEngine.LIBVLC
            } else if (useLibVlc && liveConsecutiveFailures < liveStallRecoveryLimit) {
                liveConsecutiveFailures += 1
                libVlcRetryNonce++
            } else if (!useLibVlc && retryMedia3WithAlternateSurface("Switching video surface")) {
                return@LaunchedEffect
            } else if (!useLibVlc && liveConsecutiveFailures < liveStallRecoveryLimit) {
                liveConsecutiveFailures += 1
                runCatching {
                    exoPlayer.seekToDefaultPosition()
                    exoPlayer.prepare()
                    exoPlayer.play()
                }
            } else {
                isBuffering = false
                if (!switchToCompatibleAlternative("Switching to a safer quality")) {
                    playbackError = "The stream is unstable or taking too long to recover. Try again or switch quality/player."
                }
            }
        }
    }

    LaunchedEffect(isLive, liveReadyWithoutVideoAt, liveFirstFrameRendered, item.id, streamRequest.uri, useLibVlc, media3SurfaceAttempt, exoPlayer) {
        if (!isLive || useLibVlc || liveReadyWithoutVideoAt <= 0L) return@LaunchedEffect
        delay(5_000)
        if (liveReadyWithoutVideoAt > 0L && !liveFirstFrameRendered && playbackError == null) {
            if (retryMedia3WithAlternateSurface("Switching video surface")) {
                return@LaunchedEffect
            } else if (isLibVlcSafeForRequest(playbackRequest) && !triedLibVlcForLive) {
                triedLibVlcForLive = true
                forceLibVlcForLive = true
                internalEngine = InternalPlaybackEngine.LIBVLC
                isBuffering = true
                liveSwitchLocked = false
            } else {
                isBuffering = false
                liveSwitchLocked = false
                if (!switchToCompatibleAlternative("Switching to a safer quality")) {
                    playbackError = liveNoVideoFrameMessage()
                }
            }
        }
    }

    fun wakeControls() {
        showControls = true
        lastInteraction = System.currentTimeMillis()
    }

    fun seekVodBy(deltaMs: Long, labelSeconds: Int) {
        if (isLive) return
        if (useLibVlc) {
            wakeControls()
            return
        }
        // Accelerate consecutive seeks: holding LEFT/RIGHT or hammering FF/RW jumps farther.
        // Streak resets after 700ms of idle. Multipliers: 1x → 2x → 4x → 8x (capped).
        val now = System.currentTimeMillis()
        val sameDirection = (deltaMs > 0) == (labelSeconds > 0)
        seekStreak = if (sameDirection && now - lastSeekAt < 700L) (seekStreak + 1).coerceAtMost(3) else 0
        lastSeekAt = now
        val multiplier = 1 shl seekStreak  // 1, 2, 4, 8
        val effectiveDelta = deltaMs * multiplier
        val effectiveLabel = labelSeconds * multiplier
        val knownDuration = exoPlayer.duration.takeIf { it > 0 } ?: duration.takeIf { it > 0 } ?: C.TIME_UNSET
        val current = exoPlayer.currentPosition.coerceAtLeast(0L)
        val target = if (knownDuration != C.TIME_UNSET) {
            (current + effectiveDelta).coerceIn(0L, knownDuration)
        } else {
            (current + effectiveDelta).coerceAtLeast(0L)
        }
        exoPlayer.seekTo(target)
        currentPosition = target
        seekJump = effectiveLabel
        wakeControls()
    }

    fun toggleVodPlayPause() {
        if (isLive) return
        if (useLibVlc) {
            libVlcPlayPauseNonce++
            wakeControls()
            return
        }
        if (exoPlayer.isPlaying) exoPlayer.pause() else exoPlayer.play()
        wakeControls()
    }

    fun retryPlayback() {
        playbackError = null
        launchMessage = null
        isBuffering = true
        forceHlsForLiveRedirect = false
        liveFirstFrameRendered = false
        liveReadyWithoutVideoAt = 0L
        liveConsecutiveFailures = 0
        liveAutoRecoveryAttempts = 0
        liveAutoRecoveryVisited = emptySet()
        media3SurfaceAttempt = 0
        liveSwitchLocked = false
        // Reset VOD watchdog on retry
        vodReadyAt = 0L
        vodFirstFrameRendered = false
        if (isLive) {
            triedMedia3ForLive = !useLibVlc
            triedLibVlcForLive = useLibVlc
            forceLibVlcForLive = useLibVlc
        } else {
            triedLibVlcForVod = useLibVlc
            forceLibVlcForVod = useLibVlc
        }
        if (useLibVlc) {
            libVlcRetryNonce++
            return
        }
        exoPlayer.stop()
        exoPlayer.setMediaItem(
            buildPlayableMediaItem(
                playbackRequest,
                item,
                isLive,
                livePlaybackProfile(
                    isPerformanceMode = performancePolicy.isPerformance,
                    policyLiveBufferMs = performancePolicy.liveBufferMs,
                    maxVideoHeight = performancePolicy.maxVideoHeight,
                ),
            ),
            if (isLive) C.TIME_UNSET else item.watchPositionMs.coerceAtLeast(0),
        )
        exoPlayer.prepare()
        exoPlayer.playWhenReady = true
    }

    fun switchTo(target: AppMediaItem?) {
        if (target == null || target.samePlayable(item) || liveSwitchLocked) return
        if (target.type == ContentType.LIVE) {
            val now = System.currentTimeMillis()
            if (now - lastLiveSwitchAt < 160L) return
            lastLiveSwitchAt = now
            liveSwitchLocked = true
            isBuffering = true
            liveFirstFrameRendered = false
            liveReadyWithoutVideoAt = 0L
            liveAutoRecoveryAttempts = 0
            liveAutoRecoveryVisited = emptySet()
            playbackError = null
        }
        if (!isLive && exoPlayer.duration > 0) {
            onProgress(item, exoPlayer.currentPosition, exoPlayer.duration)
        }
        onPlayItem(target)
    }

    fun handleLibVlcLiveError(message: String) {
        if (!isLive) {
            isBuffering = false
            playbackError = message
            return
        }

        val now = System.currentTimeMillis()
        val recentlyPlaying = isPlaying || (liveLastPlayingAt > 0L && now - liveLastPlayingAt < 10_000L)
        liveConsecutiveFailures += 1
        playbackError = null

        if (recentlyPlaying && liveConsecutiveFailures > 3) {
            isBuffering = false
            if (!switchToCompatibleAlternative("Switching to a safer quality")) {
                playbackError = livePlaybackFailureMessage()
            }
            return
        }

        if (liveConsecutiveFailures <= 2 || recentlyPlaying) {
            isBuffering = !recentlyPlaying
            libVlcRetryNonce++
            return
        }

        if (!triedMedia3ForLive && !streamRequest.uri.startsWith("rtsp://", ignoreCase = true)) {
            triedMedia3ForLive = true
            forceLibVlcForLive = false
            playbackError = null
            isBuffering = true
            internalEngine = InternalPlaybackEngine.MEDIA3
            return
        }

        isBuffering = false
        if (!switchToCompatibleAlternative("Switching to a safer quality")) {
            playbackError = message
        }
    }

    BackHandler {
        when {
            isLive && showLiveZap -> showLiveZap = false
            isLive -> onBack(0, 0)
            showControls -> showControls = false
            else -> onBack(exoPlayer.currentPosition, exoPlayer.duration.coerceAtLeast(0))
        }
    }

    val currentIndex = remember(item.id, item.type, item.serverId, relatedItems) {
        relatedItems.indexOfFirst { it.samePlayable(item) }
    }
    val previousItem = liveZapTargetIndex(currentIndex, -1, relatedItems.size)?.let(relatedItems::get)
    val nextItem = liveZapTargetIndex(currentIndex, 1, relatedItems.size)?.let(relatedItems::get)
    val liveZapCategories = remember(relatedItems) { relatedItems.toLiveZapCategories() }
    var liveZapCategoryId by remember(item.id, relatedItems) { mutableStateOf(item.categoryId.ifBlank { LIVE_ZAP_ALL_CATEGORY_ID }) }
    val displayedLiveZapItems = remember(relatedItems, liveZapCategoryId) {
        val filtered = when (liveZapCategoryId) {
            LIVE_ZAP_ALL_CATEGORY_ID -> relatedItems
            LIVE_ZAP_UNCATEGORIZED_ID -> relatedItems.filter { it.categoryId.isBlank() }
            else -> relatedItems.filter { it.categoryId == liveZapCategoryId }
        }
        filtered.ifEmpty { relatedItems }
    }
    val displayedCurrentIndex = remember(item.id, item.type, item.serverId, item.categoryId, displayedLiveZapItems) {
        displayedLiveZapItems.indexOfFirst { it.samePlayable(item) }
    }
    var liveZapIndex by remember(item.id, liveZapCategoryId, displayedLiveZapItems.size) {
        mutableIntStateOf(displayedCurrentIndex.coerceAtLeast(0))
    }

    fun selectLiveZapCategory(direction: Int) {
        if (liveZapCategories.isEmpty()) return
        val currentCategoryIndex = liveZapCategories.indexOfFirst { it.id == liveZapCategoryId }.let { if (it >= 0) it else 0 }
        val nextCategory = liveZapCategories[(currentCategoryIndex + direction).floorMod(liveZapCategories.size)]
        liveZapCategoryId = nextCategory.id
        liveZapIndex = 0
    }

    LaunchedEffect(exoPlayer, liveQualityMode, performancePolicy.mode) {
        if (isLive) applyLiveQualityMode(exoPlayer, liveQualityMode, performancePolicy.maxVideoHeight)
    }

    LaunchedEffect(isLive, item.id, item.title, performancePolicy.mode, performancePolicy.maxVideoHeight, relatedItems) {
        if (isLive && shouldAutoDowngradeLiveQuality(performancePolicy.isPerformance, item.liveQualityRank(), performancePolicy.maxVideoHeight)) {
            switchToCompatibleAlternative("Auto quality")
        }
    }

    LaunchedEffect(showMiniInfo, item.id) {
        if (showMiniInfo && !showLiveZap) {
            delay(2600)
            showMiniInfo = false
        }
    }

    Box(
        Modifier
            .fillMaxSize()
            .background(Color.Black)
            .focusRequester(playerFocusRequester)
            .focusable()
            .onPreviewKeyEvent { event ->
                if (event.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false

                when {
                    // ── LIVE TV: Receiver-style remote ──────────────────
                    isLive -> when (event.key) {
                        Key.DirectionUp, Key.ChannelUp -> {
                            if (showLiveZap && displayedLiveZapItems.isNotEmpty()) {
                                liveZapIndex = (liveZapIndex - 1).floorMod(displayedLiveZapItems.size)
                            } else {
                                showLiveZap = false
                                showControls = false
                                showMiniInfo = true
                                switchTo(previousItem)
                            }
                            true
                        }
                        Key.DirectionDown, Key.ChannelDown -> {
                            if (showLiveZap && displayedLiveZapItems.isNotEmpty()) {
                                liveZapIndex = (liveZapIndex + 1).floorMod(displayedLiveZapItems.size)
                            } else {
                                showLiveZap = false
                                showControls = false
                                showMiniInfo = true
                                switchTo(nextItem)
                            }
                            true
                        }
                        Key.Enter, Key.DirectionCenter -> {
                            if (showLiveZap) {
                                displayedLiveZapItems.getOrNull(liveZapIndex)?.let { selected ->
                                    if (!selected.samePlayable(item)) switchTo(selected)
                                }
                                showLiveZap = false
                                showMiniInfo = true
                            } else {
                                liveZapCategoryId = item.categoryId.ifBlank { LIVE_ZAP_ALL_CATEGORY_ID }
                                liveZapIndex = displayedCurrentIndex.coerceAtLeast(0)
                                showLiveZap = true
                                showMiniInfo = false
                            }
                            showControls = false
                            lastInteraction = System.currentTimeMillis()
                            true
                        }
                        Key.Back, Key.Escape -> {
                            if (showLiveZap) { showLiveZap = false; true }
                            else { onBack(0, 0); true }
                        }
                        Key.MediaPlayPause, Key.MediaPlay, Key.MediaPause, Key.Spacebar -> {
                            if (useLibVlc) {
                                libVlcPlayPauseNonce++
                            } else {
                                if (exoPlayer.isPlaying) exoPlayer.pause() else exoPlayer.play()
                            }
                            true
                        }
                        Key.DirectionLeft, Key.DirectionRight -> {
                            if (showLiveZap) {
                                selectLiveZapCategory(if (event.key == Key.DirectionLeft) -1 else 1)
                            } else {
                                showMiniInfo = true
                            }
                            true
                        }
                        else -> false
                    }

                    // ── VOD: Standard player remote ──────────────────────
                    else -> {
                        val nativeKey = event.key.nativeKeyCode
                        val isFastForwardKey = nativeKey == AndroidKeyEvent.KEYCODE_MEDIA_FAST_FORWARD
                        val isRewindKey = nativeKey == AndroidKeyEvent.KEYCODE_MEDIA_REWIND
                        val isNextKey = nativeKey == AndroidKeyEvent.KEYCODE_MEDIA_NEXT
                        val isPreviousKey = nativeKey == AndroidKeyEvent.KEYCODE_MEDIA_PREVIOUS

                        if (!showControls) {
                            when (event.key) {
                                Key.Back, Key.Escape -> {
                                    onBack(exoPlayer.currentPosition, exoPlayer.duration.coerceAtLeast(0))
                                    return@onPreviewKeyEvent true
                                }
                                Key.Enter, Key.DirectionCenter, Key.NumPadEnter, Key.Spacebar,
                                Key.MediaPlayPause, Key.MediaPlay, Key.MediaPause -> {
                                    toggleVodPlayPause()
                                    return@onPreviewKeyEvent true
                                }
                                Key.DirectionLeft -> {
                                    seekVodBy(-10_000L, -10)
                                    return@onPreviewKeyEvent true
                                }
                                Key.DirectionRight -> {
                                    seekVodBy(10_000L, 10)
                                    return@onPreviewKeyEvent true
                                }
                                else -> {
                                    when {
                                        isFastForwardKey -> seekVodBy(30_000L, 30)
                                        isRewindKey -> seekVodBy(-30_000L, -30)
                                        isNextKey && nextItem != null -> switchTo(nextItem)
                                        isPreviousKey && previousItem != null -> switchTo(previousItem)
                                        else -> wakeControls()
                                    }
                                    lastInteraction = System.currentTimeMillis()
                                    return@onPreviewKeyEvent true
                                }
                            }
                        }
                        // Controls ARE visible — pass D-pad navigation through to Compose focus
                        // so the user can move focus left/right between buttons (Play, Audio,
                        // Subtitles, Quality, etc.). Dedicated -10/+10 buttons + media FF/RW
                        // keys handle seeking.
                        when (event.key) {
                            Key.Back, Key.Escape -> { showControls = false; true }
                            Key.MediaPlayPause, Key.MediaPlay, Key.MediaPause -> {
                                toggleVodPlayPause()
                                true
                            }
                            Key.DirectionLeft, Key.DirectionRight,
                            Key.DirectionUp, Key.DirectionDown,
                            Key.Enter, Key.DirectionCenter, Key.NumPadEnter, Key.Spacebar -> {
                                lastInteraction = System.currentTimeMillis()
                                false // CRITICAL: pass through so FocusGlow/Button handles it
                            }
                            else -> {
                                when {
                                    isFastForwardKey -> {
                                        seekVodBy(30_000L, 30)
                                        true
                                    }
                                    isRewindKey -> {
                                        seekVodBy(-30_000L, -30)
                                        true
                                    }
                                    isNextKey && nextItem != null -> {
                                        switchTo(nextItem)
                                        true
                                    }
                                    isPreviousKey && previousItem != null -> {
                                        switchTo(previousItem)
                                        true
                                    }
                                    else -> {
                                        lastInteraction = System.currentTimeMillis()
                                        false
                                    }
                                }
                            }
                        }
                    }
                }
            },
    ) {
        if (useLibVlc) {
            LibVlcPlayerView(
                request = playbackRequest,
                title = item.title,
                resizeMode = resizeModes[resizeIndex],
                retryNonce = libVlcRetryNonce,
                onBuffering = { buffering ->
                    isBuffering = buffering || (if (isLive) !liveFirstFrameRendered else !vodFirstFrameRendered)
                },
                onPlaying = {
                    isPlaying = true
                    isBuffering = if (isLive) !liveFirstFrameRendered else !vodFirstFrameRendered
                    liveLastPlayingAt = System.currentTimeMillis()
                    liveConsecutiveFailures = 0
                    liveSwitchLocked = false
                    playbackError = null
                    playbackSignal = if (isLive) "VLC - Live" else "VLC - Video"
                },
                onVideoOutput = {
                    if (isLive) {
                        liveFirstFrameRendered = true
                        liveReadyWithoutVideoAt = 0L
                    } else {
                        vodFirstFrameRendered = true
                        vodReadyAt = 0L
                        vodOpeningGuard = false
                    }
                    isBuffering = false
                    playbackError = null
                    playbackSignal = if (isLive) "VLC - Live" else "VLC - Video"
                },
                onPaused = { isPlaying = false },
                onError = ::handleLibVlcLiveError,
                playPauseNonce = libVlcPlayPauseNonce,
                modifier = Modifier.fillMaxSize(),
            )
        } else {
            val useTextureView = shouldUseTextureViewForMedia3(
                sdkInt = Build.VERSION.SDK_INT,
                isPerformanceMode = performancePolicy.isPerformance,
                supportedAbis = Build.SUPPORTED_ABIS,
                surfaceAttempt = media3SurfaceAttempt,
            )
            key(useTextureView, media3SurfaceAttempt) {
                AndroidView(
                    factory = {
                        val playerView = if (useTextureView) {
                            LayoutInflater.from(it).inflate(R.layout.view_player_texture, null) as PlayerView
                        } else {
                            PlayerView(it)
                        }
                        playerView.apply {
                            useController = false
                            resizeMode = resizeModes[resizeIndex]
                            setKeepContentOnPlayerReset(true)
                            setShowBuffering(PlayerView.SHOW_BUFFERING_NEVER)
                            setShutterBackgroundColor(android.graphics.Color.TRANSPARENT)
                            if (Build.VERSION.SDK_INT >= 34) {
                                setEnableComposeSurfaceSyncWorkaround(true)
                            }
                            keepScreenOn = true
                            player = exoPlayer
                        }
                    },
                    update = {
                        it.resizeMode = resizeModes[resizeIndex]
                        it.setShutterBackgroundColor(android.graphics.Color.TRANSPARENT)
                    },
                    modifier = Modifier.fillMaxSize(),
                )
            }
        }

        if ((isBuffering || liveOpeningGuard || vodOpeningGuard) && playbackError == null && (!isLive || System.currentTimeMillis() - lastLiveSwitchAt > 900L)) {
            GlassPanel(
                radius = 999.dp,
                blur = 16.dp,
                modifier = Modifier.align(Alignment.Center),
            ) {
                Row(
                    Modifier.padding(horizontal = 20.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    CircularProgressIndicator(color = accent, modifier = Modifier.size(22.dp), strokeWidth = 2.5.dp)
                    Text(
                        if (isLive) "Opening channel..." else "Loading...",
                        color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold,
                    )
                }
            }
        }

        playbackError?.let { message ->
            Box(
                Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.75f)),
                contentAlignment = Alignment.Center,
            ) {
                GlassPanel(radius = 22.dp, blur = 20.dp, modifier = Modifier.padding(32.dp).widthIn(max = 560.dp)) {
                    Column(
                        Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(Icons.Rounded.Warning, null, tint = Color(0xFFFFD166), modifier = Modifier.size(24.dp))
                            Text("Could not play stream", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold)
                        }
                        Text(message, color = Color(0xCCF5E6D0), fontSize = 13.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = ::retryPlayback,
                                colors = ButtonDefaults.buttonColors(containerColor = accent),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                            ) {
                                Icon(Icons.Rounded.Refresh, null, tint = Color.Black, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text(strings.retry, color = Color.Black, fontSize = 13.sp)
                            }
                            if (isLibVlcSafeForRequest(playbackRequest)) {
                                OutlinedButton(onClick = { route = "vlc" }, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)) { Text("VLC", fontSize = 12.sp) }
                            }
                            if (isLive) {
                                OutlinedButton(
                                    onClick = {
                                        playbackError = null
                                        isBuffering = true
                                        route = "auto"
                                        internalEngine = if (isLibVlcSafeForRequest(playbackRequest)) InternalPlaybackEngine.LIBVLC else InternalPlaybackEngine.MEDIA3
                                    },
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                ) { Text("Internal", fontSize = 12.sp) }
                            }
                            OutlinedButton(onClick = { route = "mx" }, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)) { Text("MX", fontSize = 12.sp) }
                            OutlinedButton(onClick = { route = "external" }, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)) { Text("External", fontSize = 12.sp) }
                            OutlinedButton(onClick = { onBack(exoPlayer.currentPosition, exoPlayer.duration.coerceAtLeast(0)) }, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)) { Text(strings.back, fontSize = 12.sp) }
                        }
                    }
                }
            }
        }

        // ── iOS 26-Inspired Floating Controls ──────────────────────────
        if (isLive) {
            LiveZapOverlay(
                visible = showLiveZap,
                miniVisible = showMiniInfo && !showLiveZap,
                currentItem = item,
                categories = liveZapCategories,
                selectedCategoryId = liveZapCategoryId,
                items = displayedLiveZapItems,
                selectedIndex = liveZapIndex,
                currentIndex = currentIndex,
                isBuffering = isBuffering,
                error = playbackError,
                signal = playbackSignal,
                qualityMode = liveQualityMode,
                accent = accent,
                onSelectIndex = { index -> liveZapIndex = index },
                onCategory = { categoryId ->
                    liveZapCategoryId = categoryId
                    liveZapIndex = 0
                },
                onPlay = { selected ->
                    showLiveZap = false
                    showMiniInfo = true
                    switchTo(selected)
                },
                onQualityMode = {
                    liveQualityMode = it
                    if (isLive && useLibVlc && !streamRequest.uri.startsWith("rtsp://", ignoreCase = true)) {
                        forceLibVlcForLive = false
                        triedMedia3ForLive = true
                        playbackError = null
                        isBuffering = true
                        internalEngine = InternalPlaybackEngine.MEDIA3
                    }
                },
                onAudio = { runCatching { TrackSelectionDialogBuilder(context, "Audio", exoPlayer, C.TRACK_TYPE_AUDIO).build().show() } },
                onSubtitles = { runCatching { TrackSelectionDialogBuilder(context, "Subtitles", exoPlayer, C.TRACK_TYPE_TEXT).build().show() } },
                onVideo = { runCatching { TrackSelectionDialogBuilder(context, "Quality", exoPlayer, C.TRACK_TYPE_VIDEO).build().show() } },
                onResize = { resizeIndex = (resizeIndex + 1) % resizeModes.size },
                onExternal = { route = null },
            )
        }

        AnimatedVisibility(
            visible = showControls && !isLive,
            enter = fadeIn(tween(250)),
            exit = fadeOut(tween(400)),
            modifier = Modifier.fillMaxSize(),
        ) {
            Box(Modifier.fillMaxSize()) {
                // Cinematic dim — gradient from edges
                Box(
                    Modifier.fillMaxSize().background(
                        Brush.verticalGradient(
                            colorStops = arrayOf(
                                0.00f to Color.Black.copy(alpha = 0.65f),
                                0.15f to Color.Black.copy(alpha = 0.10f),
                                0.85f to Color.Black.copy(alpha = 0.10f),
                                1.00f to Color.Black.copy(alpha = 0.70f),
                            ),
                        ),
                    ),
                )

                // ── Top: Floating Info Capsule ──────────────────────
                GlassPanel(
                    radius = 999.dp,
                    blur = 20.dp,
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = 24.dp)
                        .widthIn(max = 700.dp),
                ) {
                    Row(
                        Modifier.padding(horizontal = 22.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        // Live badge or play icon
                        if (isLive) {
                            Surface(
                                shape = RoundedCornerShape(999.dp),
                                color = Color(0xFFFF3B4D),
                                modifier = Modifier.height(24.dp),
                            ) {
                                Text(
                                    " LIVE ",
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                )
                            }
                        }
                        Text(
                            item.title,
                            color = Color.White,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.ExtraBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f),
                        )
                        Text(
                            resizeLabels[resizeIndex],
                            color = accent.copy(alpha = 0.8f),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }

                // ── Bottom: Control Island ──────────────────────────
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(start = 28.dp, end = 28.dp, bottom = 24.dp)
                        .widthIn(max = 860.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    // Seek Bar (VOD only) — read-only progress; seek via -10/+10 buttons or media FF/RW
                    if (!isLive) {
                        GlassPanel(radius = 999.dp, blur = 16.dp, modifier = Modifier.fillMaxWidth()) {
                            val progress = if (duration > 0) {
                                (currentPosition.toFloat() / duration.toFloat()).coerceIn(0f, 1f)
                            } else {
                                0f
                            }
                            Row(
                                Modifier.padding(horizontal = 18.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                Text(formatTime(currentPosition), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Box(
                                    Modifier
                                        .weight(1f)
                                        .height(8.dp)
                                        .clip(RoundedCornerShape(999.dp))
                                        .background(Color(0x33FFFFFF)),
                                ) {
                                    Box(
                                        Modifier
                                            .fillMaxWidth(progress)
                                            .fillMaxHeight()
                                            .clip(RoundedCornerShape(999.dp))
                                            .background(
                                                Brush.horizontalGradient(
                                                    listOf(accent.copy(alpha = 0.78f), accent),
                                                ),
                                            ),
                                    )
                                    // Thumb dot at the current playback position
                                    Box(
                                        Modifier
                                            .fillMaxHeight()
                                            .fillMaxWidth(progress),
                                        contentAlignment = Alignment.CenterEnd,
                                    ) {
                                        Box(
                                            Modifier
                                                .size(14.dp)
                                                .clip(RoundedCornerShape(999.dp))
                                                .background(Color.White)
                                                .border(2.dp, accent, RoundedCornerShape(999.dp)),
                                        )
                                    }
                                }
                                Text(formatTime(duration), color = Color(0x99FFFFFF), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    GlassPanel(
                        radius = 22.dp,
                        blur = 20.dp,
                        modifier = Modifier.fillMaxWidth(),
                        glow = accent.copy(alpha = 0.04f),
                    ) {
                        Column(
                            Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            // Primary Controls Row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                if (isLive && previousItem != null) {
                                    ControlButton(Icons.Rounded.SkipPrevious, "Previous", accent) { switchTo(previousItem) }
                                    Spacer(Modifier.width(10.dp))
                                } else if (!isLive) {
                                    ControlButton(Icons.Rounded.Replay10, "-10", accent) {
                                        seekVodBy(-10_000L, -10)
                                    }
                                    Spacer(Modifier.width(8.dp))
                                }

                                Button(
                                    onClick = {
                                        toggleVodPlayPause()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = accent),
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier
                                        .height(52.dp)
                                        .focusRequester(playPauseFocusRequester),
                                    contentPadding = PaddingValues(horizontal = 22.dp),
                                ) {
                                    Icon(
                                        if (isPlaying) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                                        null, tint = Color.Black, modifier = Modifier.size(28.dp),
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text(
                                        if (isPlaying) "Pause" else "Play",
                                        color = Color.Black, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp,
                                    )
                                }

                                Spacer(Modifier.width(10.dp))

                                // Favorite button
                                Button(
                                    onClick = { onTripleOk(); favoriteMarked = !favoriteMarked; wakeControls() },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (favoriteMarked) accent.copy(alpha = 0.2f) else Color(0x22FFFFFF),
                                    ),
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier.height(52.dp),
                                    contentPadding = PaddingValues(horizontal = 14.dp),
                                ) {
                                    Icon(Icons.Rounded.Favorite, null, tint = if (favoriteMarked) accent else Color.White, modifier = Modifier.size(22.dp))
                                }

                                if (isLive && nextItem != null) {
                                    Spacer(Modifier.width(10.dp))
                                    ControlButton(Icons.Rounded.SkipNext, "Next", accent) { switchTo(nextItem) }
                                } else if (!isLive) {
                                    Spacer(Modifier.width(10.dp))
                                    ControlButton(Icons.Rounded.Forward10, "+10", accent) {
                                        seekVodBy(10_000L, 10)
                                    }
                                }
                            }

                            // Secondary Controls — compact icon strip
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    SmallControlButton(Icons.Rounded.Refresh, "Retry", accent, ::retryPlayback)
                                    SmallControlButton(Icons.Rounded.Audiotrack, "Audio", accent) {
                                        runCatching { TrackSelectionDialogBuilder(context, "Audio", exoPlayer, C.TRACK_TYPE_AUDIO).build().show() }
                                    }
                                    SmallControlButton(Icons.Rounded.Subtitles, "Subtitles", accent) {
                                        runCatching { TrackSelectionDialogBuilder(context, "Subtitles", exoPlayer, C.TRACK_TYPE_TEXT).build().show() }
                                    }
                                    SmallControlButton(Icons.Rounded.HighQuality, "Quality", accent) {
                                        runCatching { TrackSelectionDialogBuilder(context, "Quality", exoPlayer, C.TRACK_TYPE_VIDEO).build().show() }
                                    }
                                    SmallControlButton(Icons.Rounded.Tune, "Aspect", accent) {
                                        resizeIndex = (resizeIndex + 1) % resizeModes.size
                                    }
                                    if (canCast) {
                                        SmallControlButton(Icons.Rounded.Cast, "Cast", accent) {
                                            launchCastFallback(context, streamRequest.uri)
                                        }
                                    }
                                    SmallControlButton(Icons.AutoMirrored.Rounded.OpenInNew, "Open external", accent) { route = null }
                                }
                                Text(
                                    if (isLive) "▲▼ Channel  •  OK Guide  •  Back Hide" else "◄► Focus  •  OK Select  •  Back Hide",
                                    color = Color(0x77FFFFFF),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                )
                            }
                        }
                    }
                }
            }
        }

        // ── Seek Jump Indicator — floating pill ─────────────────────
        AnimatedVisibility(
            visible = seekJump != 0,
            enter = fadeIn(tween(100)),
            exit = fadeOut(tween(300)),
            modifier = Modifier.align(Alignment.Center),
        ) {
            GlassPanel(radius = 999.dp, blur = 16.dp) {
                Text(
                    text = "${if (seekJump > 0) "+" else ""}${seekJump}s",
                    color = Color.White,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.ExtraBold,
                    modifier = Modifier.padding(horizontal = 28.dp, vertical = 14.dp),
                )
            }
        }
    }
}

@kotlin.OptIn(ExperimentalFoundationApi::class)
@Composable
private fun LiveZapOverlay(
    visible: Boolean,
    miniVisible: Boolean,
    currentItem: AppMediaItem,
    categories: List<LiveZapCategory>,
    selectedCategoryId: String,
    items: List<AppMediaItem>,
    selectedIndex: Int,
    currentIndex: Int,
    isBuffering: Boolean,
    error: String?,
    signal: String,
    qualityMode: LiveQualityMode,
    accent: Color,
    onSelectIndex: (Int) -> Unit,
    onCategory: (String) -> Unit,
    onPlay: (AppMediaItem) -> Unit,
    onQualityMode: (LiveQualityMode) -> Unit,
    onAudio: () -> Unit,
    onSubtitles: () -> Unit,
    onVideo: () -> Unit,
    onResize: () -> Unit,
    onExternal: () -> Unit,
) {
    val channelListState = rememberLazyListState()

    LaunchedEffect(visible, items.size) {
        if (visible && selectedIndex in items.indices) {
            channelListState.scrollToItem(selectedIndex)
        }
    }

    AnimatedVisibility(
        visible = miniVisible,
        enter = fadeIn(tween(120)),
        exit = fadeOut(tween(220)),
        modifier = Modifier.fillMaxSize(),
    ) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomStart) {
            LiveInfoCard(
                item = currentItem,
                channelNumber = currentIndex.takeIf { it >= 0 }?.plus(1),
                isBuffering = isBuffering,
                error = error,
                signal = signal,
                accent = accent,
                modifier = Modifier.padding(start = 34.dp, bottom = 34.dp).widthIn(max = 560.dp),
            )
        }
    }

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(120)),
        exit = fadeOut(tween(180)),
        modifier = Modifier.fillMaxSize(),
    ) {
        Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.30f))) {
            GlassPanel(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 32.dp)
                    .fillMaxHeight(0.84f)
                    .width(430.dp),
                radius = 22.dp,
                blur = 18.dp,
                highlighted = true,
                glow = accent.copy(alpha = 0.14f),
            ) {
                Column(
                    Modifier.fillMaxSize().padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    LiveInfoCard(
                        item = currentItem,
                        channelNumber = currentIndex.takeIf { it >= 0 }?.plus(1),
                        isBuffering = isBuffering,
                        error = error,
                        signal = signal,
                        accent = accent,
                        modifier = Modifier.fillMaxWidth(),
                    )

                    val selectedCategory = categories.firstOrNull { it.id == selectedCategoryId }
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            selectedCategory?.name ?: "Channels",
                            color = Color.White,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.ExtraBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f),
                        )
                        Text(
                            "${selectedIndex.coerceAtLeast(0) + 1}/${items.size.coerceAtLeast(1)}",
                            color = accent,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold,
                        )
                    }

                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        LiveQualityModeButton("Smart", qualityMode == LiveQualityMode.AUTO, accent) {
                            onQualityMode(LiveQualityMode.AUTO)
                        }
                        LiveQualityModeButton("4K", qualityMode == LiveQualityMode.BEST, accent) {
                            onQualityMode(LiveQualityMode.BEST)
                        }
                        LiveQualityModeButton("8K", qualityMode == LiveQualityMode.ULTRA, accent) {
                            onQualityMode(LiveQualityMode.ULTRA)
                        }
                        LiveQualityModeButton("Stable", qualityMode == LiveQualityMode.STABLE, accent) {
                            onQualityMode(LiveQualityMode.STABLE)
                        }
                        LiveQualityModeButton("Tracks", false, accent, onVideo)
                    }

                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        LiveQualityModeButton("Audio", false, accent, onAudio)
                        LiveQualityModeButton("Subs", false, accent, onSubtitles)
                        LiveQualityModeButton("Ratio", false, accent, onResize)
                        LiveQualityModeButton("Open", false, accent, onExternal)
                    }

                    if (items.isEmpty()) {
                        Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                            Text("No channels in this group", color = Color(0xCCFFFFFF), fontSize = 13.sp)
                        }
                    } else {
                        CompositionLocalProvider(LocalBringIntoViewSpec provides PlayerEdgeBringIntoViewSpec) {
                            LazyColumn(
                                modifier = Modifier.weight(1f).fillMaxWidth(),
                                state = channelListState,
                                verticalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                itemsIndexed(items, key = { _, channel -> "${channel.serverId}-${channel.id}-${channel.type}" }) { index, channel ->
                                    val isSelected = index == selectedIndex
                                    val isCurrent = channel.id == currentItem.id && channel.serverId == currentItem.serverId
                                    LiveChannelRow(
                                        channel = channel,
                                        index = index,
                                        selected = isSelected,
                                        current = isCurrent,
                                        accent = accent,
                                        onFocus = {
                                            onSelectIndex(index)
                                        },
                                        onPlay = { onPlay(channel) },
                                    )
                                }
                            }
                        }
                    }

                    Text(
                        "OK Play | D-pad Zap/Groups | Back Close",
                        color = Color(0x99FFFFFF),
                        fontSize = 11.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }
}

private data class LiveZapCategory(
    val id: String,
    val name: String,
    val count: Int,
)

private const val LIVE_ZAP_ALL_CATEGORY_ID = "__all__"
private const val LIVE_ZAP_UNCATEGORIZED_ID = "__uncategorized__"

private fun List<AppMediaItem>.toLiveZapCategories(): List<LiveZapCategory> {
    if (isEmpty()) return emptyList()
    val allCategory = LiveZapCategory(LIVE_ZAP_ALL_CATEGORY_ID, "All", size)
    val grouped = groupBy { it.categoryId.ifBlank { LIVE_ZAP_UNCATEGORIZED_ID } }
    val itemCategories = grouped.map { (id, channels) ->
        LiveZapCategory(
            id = id,
            name = channels.firstOrNull()?.categoryName?.ifBlank { "Live TV" } ?: "Live TV",
            count = channels.size,
        )
    }
    return listOf(allCategory) + itemCategories
}

@Composable
private fun LiveCategoryPill(
    category: LiveZapCategory,
    selected: Boolean,
    accent: Color,
    onClick: () -> Unit,
) {
    FocusGlow(cornerRadius = 999.dp, onClick = onClick) {
        Row(
            Modifier
                .clip(RoundedCornerShape(999.dp))
                .background(if (selected) accent.copy(alpha = 0.24f) else Color(0x22FFFFFF))
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(category.name, color = if (selected) accent else Color.White, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(category.count.toString(), color = Color(0x99FFFFFF), fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun LiveInfoCard(
    item: AppMediaItem,
    channelNumber: Int?,
    isBuffering: Boolean,
    error: String?,
    signal: String,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    GlassPanel(modifier = modifier, radius = 18.dp, blur = 16.dp, highlighted = true, glow = accent.copy(alpha = 0.08f)) {
        Row(
            Modifier.fillMaxWidth().padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ChannelLogo(item, Modifier.size(58.dp), accent)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        channelNumber?.let { "%03d".format(it) } ?: "LIVE",
                        color = accent,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 13.sp,
                    )
                    Text(
                        item.categoryName.ifBlank { "Live TV" },
                        color = Color(0xB8FFFFFF),
                        fontSize = 12.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Text(
                    item.title,
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    when {
                        error != null -> "Retry or use an external player"
                        isBuffering -> "Opening channel..."
                        signal.isNotBlank() -> signal
                        else -> "Live now"
                    },
                    color = if (error != null) Color(0xFFFFB4AB) else Color(0xCCE3BC78),
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Surface(shape = RoundedCornerShape(999.dp), color = if (error != null) Color(0xFFB3261E) else Color(0xFFFF3B4D)) {
                Text(
                    if (isBuffering) "LOAD" else "LIVE",
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.ExtraBold,
                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                )
            }
        }
    }
}

@Composable
private fun LiveChannelRow(
    channel: AppMediaItem,
    index: Int,
    selected: Boolean,
    current: Boolean,
    accent: Color,
    onFocus: () -> Unit,
    onPlay: () -> Unit,
) {
    FocusGlow(cornerRadius = 12.dp, onFocused = onFocus, onClick = onPlay) {
        Row(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(
                    when {
                        selected -> accent.copy(alpha = 0.22f)
                        current -> Color(0x22FFFFFF)
                        else -> Color.Transparent
                    },
                )
                .padding(horizontal = 10.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("%03d".format(index + 1), color = if (selected) accent else Color(0x99FFFFFF), fontWeight = FontWeight.Bold, fontSize = 12.sp)
            ChannelLogo(channel, Modifier.size(34.dp), accent)
            Column(Modifier.weight(1f)) {
                Text(channel.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(channel.categoryName.ifBlank { "Live TV" }, color = Color(0x99FFFFFF), fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            if (current) {
                Text("ON", color = accent, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}

@Composable
private fun ChannelLogo(item: AppMediaItem, modifier: Modifier, accent: Color) {
    Box(
        modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0x33111111)),
        contentAlignment = Alignment.Center,
    ) {
        if (item.posterUrl.isNotBlank()) {
            AsyncImage(model = item.posterUrl, contentDescription = item.title, modifier = Modifier.fillMaxSize())
        } else {
            Text(
                item.title.take(1).uppercase(Locale.getDefault()),
                color = accent,
                fontWeight = FontWeight.ExtraBold,
            )
        }
    }
}

@Composable
private fun LiveQualityModeButton(label: String, selected: Boolean, accent: Color, onClick: () -> Unit) {
    FocusGlow(cornerRadius = 999.dp, onClick = onClick, modifier = Modifier.height(34.dp)) {
        Box(
            Modifier
                .clip(RoundedCornerShape(999.dp))
                .background(if (selected) accent.copy(alpha = 0.24f) else Color(0x22FFFFFF))
                .padding(horizontal = 12.dp, vertical = 8.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(label, color = if (selected) accent else Color.White, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
        }
    }
}

@Composable
private fun PlayerRoutePicker(
    title: String,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    val autoFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(120)
        runCatching { autoFocus.requestFocus() }
    }
    Dialog(onDismissRequest = onDismiss) {
        GlassPanel(
            modifier = Modifier.fillMaxWidth(),
            radius = 26.dp,
            highlighted = true,
            glow = visuals.glow,
        ) {
            Column(
                Modifier.padding(horizontal = 22.dp, vertical = 20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text(
                    "Choose player",
                    color = Color.White,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    title,
                    color = Color(0xCCE3BC78),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    style = MaterialTheme.typography.bodyMedium,
                )
                Text(
                    "Choose Media3 or an external player before playback starts.",
                    color = Color(0x99FFFFFF),
                    style = MaterialTheme.typography.bodySmall,
                )
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Button(
                        onClick = { onSelect("auto") },
                        colors = ButtonDefaults.buttonColors(containerColor = visuals.accent, contentColor = Color.Black),
                        modifier = Modifier.weight(1f).focusRequester(autoFocus),
                    ) {
                        Text("Auto")
                    }
                    OutlinedButton(onClick = { onSelect("media3") }, modifier = Modifier.weight(1f)) {
                        Text("Media3")
                    }
                }
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    OutlinedButton(onClick = { onSelect("vlc") }, modifier = Modifier.weight(1f)) {
                        Text("VLC")
                    }
                    OutlinedButton(onClick = { onSelect("mx") }, modifier = Modifier.weight(1f)) {
                        Text("MX")
                    }
                }
                OutlinedButton(onClick = { onSelect("external") }, modifier = Modifier.fillMaxWidth()) {
                    Text("Generic")
                }
                OutlinedButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                    Text("Cancel")
                }
            }
        }
    }
}

@Composable
private fun ExternalLaunchScreen(
    title: String,
    message: String,
    onRetrySame: () -> Unit,
    onUseMedia3: () -> Unit,
    onPickAnother: () -> Unit,
    onBack: () -> Unit,
) {
    val retryFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(120)
        runCatching { retryFocus.requestFocus() }
    }
    Box(
        Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF010408), Color(0xFF070F1C)),
                ),
            ),
        contentAlignment = Alignment.Center,
    ) {
        OverlayCard(modifier = Modifier.padding(24.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text(title, color = Color.White, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
                Text(message, color = Color(0xCCE3BC78), style = MaterialTheme.typography.bodyLarge)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(onClick = onRetrySame, modifier = Modifier.focusRequester(retryFocus)) { Text("Retry") }
                    OutlinedButton(onClick = onUseMedia3) { Text("Use Media3") }
                    OutlinedButton(onClick = onPickAnother) { Text("Choose another") }
                    OutlinedButton(onClick = onBack) { Text("Back") }
                }
            }
        }
    }
}

@Composable
private fun ControlButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    accent: Color,
    onClick: () -> Unit,
) {
    FocusGlow(
        cornerRadius = 18.dp,
        onClick = onClick,
        modifier = Modifier.clip(RoundedCornerShape(18.dp)),
    ) {
        GlassPanel(
            radius = 18.dp,
            blur = 12.dp,
            highlighted = true,
            glow = accent.copy(alpha = 0.10f),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 18.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(icon, null, tint = accent, modifier = Modifier.size(24.dp))
                Text(label, color = Color.White, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
            }
        }
    }
}

@Composable
private fun SmallControlButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    accent: Color,
    onClick: () -> Unit,
) {
    FocusGlow(
        cornerRadius = 14.dp,
        onClick = onClick,
        modifier = Modifier.size(46.dp).clip(RoundedCornerShape(14.dp)),
    ) {
        GlassPanel(
            radius = 14.dp,
            blur = 10.dp,
            highlighted = true,
            glow = accent.copy(alpha = 0.06f),
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, label, tint = accent, modifier = Modifier.size(22.dp))
        }
    }
}

@Composable
private fun LibVlcPlayerView(
    request: StreamRequest,
    title: String,
    resizeMode: Int,
    retryNonce: Int,
    onBuffering: (Boolean) -> Unit,
    onPlaying: () -> Unit,
    onVideoOutput: () -> Unit,
    onPaused: () -> Unit,
    onError: (String) -> Unit,
    playPauseNonce: Int,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val vlcOptions = remember {
        arrayListOf(
            "--network-caching=$LIBVLC_LIVE_CACHE_MS",
            "--live-caching=$LIBVLC_LIVE_CACHE_MS",
            "--file-caching=$LIBVLC_FILE_CACHE_MS",
            "--avcodec-fast",
            "--audio-resampler=soxr",
        )
    }
    val libVlc = remember { LibVLC(context, vlcOptions) }
    val mediaPlayer = remember { MediaPlayer(libVlc) }
    val uiScope = rememberCoroutineScope()
    var videoTexture by remember { mutableStateOf<TextureView?>(null) }
    // Single source of truth for native teardown. Once the player/libVlc are released, no other
    // effect may call into them again — a use-after-free on the LibVLC native objects is a hard
    // SIGSEGV that runCatching cannot catch and takes the whole app down.
    val released = remember { java.util.concurrent.atomic.AtomicBoolean(false) }

    // Registered FIRST so it disposes LAST: every other effect's onDispose (stop/detach) runs
    // while the native player is still alive, and only then do we release it exactly once.
    DisposableEffect(Unit) {
        onDispose {
            if (released.compareAndSet(false, true)) {
                runCatching { mediaPlayer.setEventListener(null) }
                runCatching { mediaPlayer.stop() }
                runCatching { mediaPlayer.detachViews() }
                runCatching { mediaPlayer.media = null }
                runCatching { mediaPlayer.release() }
                runCatching { libVlc.release() }
            }
        }
    }

    DisposableEffect(videoTexture, request.uri, retryNonce) {
        val attachedTexture = videoTexture ?: return@DisposableEffect onDispose { }
        if (released.get()) return@DisposableEffect onDispose { }
        var activeSession = true
        onBuffering(true)
        // Guard against IllegalStateException("Can't set view when already attached") on some
        // devices (notably the x86 Android TV emulator): the AWindow keeps its previous
        // surface state across recompositions, so we must detach and clear the view before
        // attaching the new texture. Wrap in runCatching so a transient surface mismatch
        // surfaces as a recoverable error instead of crashing the whole app.
        val vlcOut = mediaPlayer.vlcVout
        val attachOutcome = runCatching {
            runCatching { vlcOut.detachViews() }
            runCatching { mediaPlayer.detachViews() }
            vlcOut.setVideoView(attachedTexture)
            vlcOut.attachViews()
        }
        if (attachOutcome.isFailure) {
            onError(livePlaybackFailureMessage())
            return@DisposableEffect onDispose {
                runCatching { mediaPlayer.detachViews() }
            }
        }
        val media = Media(libVlc, Uri.parse(request.uri)).apply {
            setHWDecoderEnabled(true, false)
            addOption(":network-caching=$LIBVLC_LIVE_CACHE_MS")
            addOption(":live-caching=$LIBVLC_LIVE_CACHE_MS")
            addOption(":file-caching=$LIBVLC_FILE_CACHE_MS")
            addOption(":http-reconnect")
            addOption(":http-continuous")
            addOption(":avcodec-fast")
            addOption(":http-user-agent=${request.headers["User-Agent"] ?: APP_USER_AGENT}")
            request.headers["Referer"]?.let { addOption(":http-referrer=$it") }
            request.headers["Cookie"]?.let { addOption(":http-cookie=$it") }
            request.headers["Origin"]?.let { addOption(":http-header=Origin: $it") }
            request.headers["Authorization"]?.let { addOption(":http-header=Authorization: $it") }
            addOption(":meta-title=$title")
        }
        mediaPlayer.media = media
        media.release()
        mediaPlayer.setEventListener { event ->
            if (!activeSession) return@setEventListener
            when (event.type) {
                MediaPlayer.Event.Buffering -> uiScope.launchMainIfActive({ activeSession }) { onBuffering(event.buffering < 100f) }
                MediaPlayer.Event.Playing -> uiScope.launchMainIfActive({ activeSession }) { onPlaying() }
                MediaPlayer.Event.Vout -> if (event.voutCount > 0) {
                    uiScope.launchMainIfActive({ activeSession }) { onVideoOutput() }
                }
                MediaPlayer.Event.Paused, MediaPlayer.Event.Stopped -> uiScope.launchMainIfActive({ activeSession }) { onPaused() }
                MediaPlayer.Event.EndReached -> {
                    uiScope.launchMainIfActive({ activeSession }) {
                        onBuffering(true)
                        onError(livePlaybackFailureMessage())
                    }
                }
                MediaPlayer.Event.EncounteredError -> {
                    uiScope.launchMainIfActive({ activeSession }) {
                        onBuffering(true)
                        onError(livePlaybackFailureMessage())
                    }
                }
            }
        }
        mediaPlayer.play()

        onDispose {
            activeSession = false
            if (!released.get()) {
                runCatching { mediaPlayer.setEventListener(null) }
                runCatching { mediaPlayer.stop() }
                runCatching { mediaPlayer.detachViews() }
                runCatching { mediaPlayer.media = null }
            }
        }
    }

    DisposableEffect(lifecycleOwner, mediaPlayer) {
        var resumeOnStart = false
        val observer = LifecycleEventObserver { _, event ->
            if (released.get()) return@LifecycleEventObserver
            when (event) {
                Lifecycle.Event.ON_PAUSE -> {
                    runCatching { mediaPlayer.pause() }
                    onPaused()
                }
                Lifecycle.Event.ON_STOP -> {
                    resumeOnStart = runCatching { mediaPlayer.isPlaying }.getOrDefault(false)
                    runCatching { mediaPlayer.stop() }
                    onPaused()
                }
                Lifecycle.Event.ON_START -> {
                    if (resumeOnStart) runCatching { mediaPlayer.play() }
                    resumeOnStart = false
                }
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(playPauseNonce) {
        if (playPauseNonce == 0) return@LaunchedEffect
        if (released.get()) return@LaunchedEffect
        runCatching {
            if (mediaPlayer.isPlaying) mediaPlayer.pause() else mediaPlayer.play()
        }
    }

    AndroidView(
        factory = { viewContext ->
            TextureView(viewContext).apply {
                keepScreenOn = true
                isOpaque = true
                post { videoTexture = this }
            }
        },
        update = { layout ->
            when (resizeMode) {
                AspectRatioFrameLayout.RESIZE_MODE_FILL -> {
                    mediaPlayer.aspectRatio = if (layout.width > 0 && layout.height > 0) "${layout.width}:${layout.height}" else null
                    mediaPlayer.scale = 0f
                }
                AspectRatioFrameLayout.RESIZE_MODE_ZOOM -> {
                    mediaPlayer.aspectRatio = null
                    mediaPlayer.scale = 1.18f
                }
                else -> {
                    mediaPlayer.aspectRatio = null
                    mediaPlayer.scale = 0f
                }
            }
            layout.keepScreenOn = true
        },
        modifier = modifier,
    )
}

private fun launchCastFallback(context: Context, streamUrl: String) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(streamUrl)).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        putExtra("android.intent.extra.TITLE", "Cast or open stream")
    }
    runCatching {
        context.startActivity(Intent.createChooser(intent, "Cast to TV"))
    }.recoverCatching {
        context.startActivity(intent)
    }
}

private fun canLaunchCast(context: Context, streamUrl: String): Boolean {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(streamUrl))
    val flags = if (Build.VERSION.SDK_INT >= 23) PackageManager.MATCH_DEFAULT_ONLY else 0
    return context.packageManager.queryIntentActivities(intent, flags).isNotEmpty()
}

private fun CoroutineScope.launchMainIfActive(isActiveSession: () -> Boolean, block: () -> Unit) {
    if (!isActiveSession()) return
    launch {
        withContext(Dispatchers.Main.immediate) {
            if (isActiveSession()) block()
        }
    }
}

private fun applyLiveQualityMode(player: ExoPlayer, mode: LiveQualityMode, maxVideoHeight: Int = 2160) {
    val defaultSelectorBuilder = (player.trackSelectionParameters as? DefaultTrackSelector.Parameters)
        ?.buildUpon()
        ?.setExceedVideoConstraintsIfNecessary(true)
        ?.setExceedAudioConstraintsIfNecessary(true)
        ?.setExceedRendererCapabilitiesIfNecessary(true)
    val builder = defaultSelectorBuilder ?: player.trackSelectionParameters.buildUpon()
    val maxWidth = when {
        maxVideoHeight <= 720 -> 1280
        maxVideoHeight <= 1080 -> 1920
        maxVideoHeight <= 2160 -> 3840
        else -> 7680
    }
    val liveCapHeight = liveSafeMaxVideoHeight(maxVideoHeight)
    val liveCapWidth = when {
        liveCapHeight <= 720 -> 1280
        liveCapHeight <= 1080 -> 1920
        liveCapHeight <= 2160 -> 3840
        else -> 7680
    }
    when (mode) {
        LiveQualityMode.AUTO -> builder
            .setForceHighestSupportedBitrate(false)
            .setMaxVideoSize(liveCapWidth, liveCapHeight)
            .setMaxVideoBitrate(liveSafeMaxBitrate(liveCapHeight))
        LiveQualityMode.BEST -> {
            val bestHeight = if (Build.VERSION.SDK_INT < 26) maxVideoHeight.coerceAtMost(1080) else maxOf(maxVideoHeight, 2160).coerceAtMost(2160)
            val bestWidth = if (bestHeight <= 1080) 1920 else 3840
            builder
                .setForceHighestSupportedBitrate(false)
                .setMaxVideoSize(bestWidth, bestHeight)
                .setMaxVideoBitrate(liveSafeMaxBitrate(bestHeight))
        }
        LiveQualityMode.ULTRA -> {
            val ultraHeight = liveUltraMaxVideoHeight(maxVideoHeight)
            val ultraWidth = when {
                ultraHeight <= 2160 -> 3840
                else -> 7680
            }
            builder
                .setForceHighestSupportedBitrate(false)
                .setMaxVideoSize(ultraWidth, ultraHeight)
                .setMaxVideoBitrate(liveSafeMaxBitrate(ultraHeight))
        }
        LiveQualityMode.STABLE -> builder
            .setForceHighestSupportedBitrate(false)
            .setMaxVideoSize(maxWidth.coerceAtMost(1280), maxVideoHeight.coerceAtMost(720))
            .setMaxVideoBitrate(2_500_000)
    }
    player.trackSelectionParameters = builder.build()
}

private fun playbackSignal(format: Format?, fallback: String = ""): String {
    if (format == null) return fallback
    val quality = when {
        format.width >= 7680 || format.height >= 4320 -> "8K"
        format.width >= 3840 || format.height >= 2160 -> "4K"
        format.width >= 1920 || format.height >= 1080 -> "FHD"
        format.width >= 1280 || format.height >= 720 -> "HD"
        format.width > 0 || format.height > 0 -> "SD"
        else -> ""
    }
    val hdr = if (format.colorInfo != null) "HDR" else ""
    val codec = format.sampleMimeType?.substringAfter("video/")?.uppercase(Locale.US).orEmpty()
    return listOf(quality, hdr, codec, fallback).filter { it.isNotBlank() }.joinToString(" | ")
}

private fun liveSafeMaxVideoHeight(policyHeight: Int): Int = when {
    Build.VERSION.SDK_INT < 26 -> policyHeight.coerceAtMost(720)
    policyHeight <= 720 -> 720
    policyHeight <= 1080 -> 1080
    policyHeight <= 2160 -> 2160
    else -> 4320
}

internal fun liveSafeMaxBitrate(videoHeight: Int): Int = when {
    videoHeight <= 720 -> 6_000_000
    videoHeight <= 1080 -> 12_000_000
    videoHeight <= 2160 -> 50_000_000
    else -> 120_000_000
}

internal fun livePlaybackProfile(
    isPerformanceMode: Boolean,
    policyLiveBufferMs: Int,
    maxVideoHeight: Int,
    sdkInt: Int = Build.VERSION.SDK_INT,
): LivePlaybackProfile {
    val legacyOrLowPower = isPerformanceMode || sdkInt < 26
    return when {
        legacyOrLowPower -> LivePlaybackProfile(
            minBufferMs = policyLiveBufferMs.coerceIn(3_500, 6_000),
            maxBufferMs = 18_000,
            bufferForPlaybackMs = 500,
            bufferForPlaybackAfterRebufferMs = 1_200,
            targetOffsetMs = 5_500L,
            minOffsetMs = 3_000L,
            maxOffsetMs = 16_000L,
            minPlaybackSpeed = 0.96f,
            maxPlaybackSpeed = 1.06f,
        )
        maxVideoHeight >= 2160 -> LivePlaybackProfile(
            minBufferMs = policyLiveBufferMs.coerceIn(7_000, 10_000),
            maxBufferMs = 45_000,
            bufferForPlaybackMs = 900,
            bufferForPlaybackAfterRebufferMs = 2_400,
            targetOffsetMs = 8_500L,
            minOffsetMs = 5_000L,
            maxOffsetMs = 25_000L,
            minPlaybackSpeed = 0.97f,
            maxPlaybackSpeed = 1.04f,
        )
        else -> LivePlaybackProfile(
            minBufferMs = policyLiveBufferMs.coerceIn(5_000, 8_000),
            maxBufferMs = 30_000,
            bufferForPlaybackMs = 650,
            bufferForPlaybackAfterRebufferMs = 1_800,
            targetOffsetMs = 7_000L,
            minOffsetMs = 4_000L,
            maxOffsetMs = 20_000L,
            minPlaybackSpeed = 0.97f,
            maxPlaybackSpeed = 1.05f,
        )
    }
}

private fun liveUltraMaxVideoHeight(policyHeight: Int): Int = when {
    Build.VERSION.SDK_INT < 26 -> 720
    Build.VERSION.SDK_INT < 29 -> maxOf(policyHeight, 2160).coerceAtMost(2160)
    else -> maxOf(policyHeight, 4320).coerceAtMost(4320)
}

private fun isLibVlcSafeOnThisDevice(): Boolean {
    return Build.SUPPORTED_ABIS.none { abi ->
        abi.equals("x86", ignoreCase = true) || abi.equals("x86_64", ignoreCase = true)
    }
}

internal fun shouldUseTextureViewForMedia3(
    sdkInt: Int,
    isPerformanceMode: Boolean,
    supportedAbis: Array<String>,
    surfaceAttempt: Int = 0,
): Boolean {
    val isX86 = supportedAbis.any { abi ->
        abi.equals("x86", ignoreCase = true) || abi.equals("x86_64", ignoreCase = true)
    }
    val preferredTextureView = sdkInt < 26 || isX86
    return if (surfaceAttempt % 2 == 0) preferredTextureView else !preferredTextureView
}

internal fun shouldForceAsyncCodecQueueing(sdkInt: Int): Boolean =
    sdkInt in 23..30

internal fun liveTsExtractorFlags(): Int =
    DefaultTsPayloadReaderFactory.FLAG_ALLOW_NON_IDR_KEYFRAMES or
        DefaultTsPayloadReaderFactory.FLAG_DETECT_ACCESS_UNITS

internal fun shouldAutoDowngradeLiveQuality(
    isPerformanceMode: Boolean,
    itemQualityRank: Int,
    maxVideoHeight: Int,
): Boolean =
    isPerformanceMode && itemQualityRank > liveMaxAllowedRank(maxVideoHeight)

private fun isLibVlcSafeForRequest(request: StreamRequest): Boolean {
    // Hard-disable LibVLC on x86/x86_64 (emulator + niche Atom boxes): the AWindow surface
    // attach path is fragile there and produces "Can't set view when already attached" on
    // recomposition, crashing the app. Real TV hardware is arm/arm64, so this only affects
    // QA emulators — Media3 handles HLS/TS perfectly on x86 anyway.
    if (!isLibVlcSafeOnThisDevice()) return false
    return isVlcFriendlyContainer(request)
}

internal fun isVlcFriendlyContainer(request: StreamRequest): Boolean {
    val lowerUri = request.uri.lowercase(Locale.US).substringBefore('?')
    return request.uri.startsWith("rtsp://", ignoreCase = true) ||
        request.uri.startsWith("rtmp://", ignoreCase = true) ||
        request.mimeType in setOf(
            MimeTypes.APPLICATION_M3U8,
            MimeTypes.APPLICATION_MPD,
            MimeTypes.APPLICATION_SS,
            MimeTypes.VIDEO_MP2T,
            MimeTypes.VIDEO_MP4,
            MimeTypes.VIDEO_QUICK_TIME,
            MimeTypes.VIDEO_MATROSKA,
            MimeTypes.VIDEO_WEBM,
            MimeTypes.VIDEO_FLV,
            MimeTypes.VIDEO_OGG,
            MimeTypes.VIDEO_AVI,
            MimeTypes.VIDEO_MPEG,
            MimeTypes.VIDEO_PS,
        ) ||
        request.uri.hasLiveTsHint() ||
        lowerUri.endsWith(".avi") ||
        lowerUri.endsWith(".mov") ||
        lowerUri.endsWith(".m4v") ||
        lowerUri.endsWith(".3gp") ||
        lowerUri.endsWith(".3g2") ||
        lowerUri.endsWith(".ogv") ||
        lowerUri.endsWith(".ogg") ||
        lowerUri.endsWith(".mpg") ||
        lowerUri.endsWith(".mpeg") ||
        lowerUri.endsWith(".vob") ||
        lowerUri.endsWith(".asf") ||
        lowerUri.endsWith(".wmv") ||
        lowerUri.endsWith(".divx")
}

internal fun shouldStartWithLibVlc(request: StreamRequest): Boolean {
    val lowerUri = request.uri.lowercase(Locale.US).substringBefore('?')
    return request.uri.startsWith("rtmp://", ignoreCase = true) ||
        request.mimeType in setOf(
            MimeTypes.VIDEO_FLV,
            MimeTypes.VIDEO_AVI,
            MimeTypes.VIDEO_MPEG,
            MimeTypes.VIDEO_PS,
            MimeTypes.VIDEO_OGG,
        ) ||
        lowerUri.endsWith(".avi") ||
        lowerUri.endsWith(".flv") ||
        lowerUri.endsWith(".f4v") ||
        lowerUri.endsWith(".mpg") ||
        lowerUri.endsWith(".mpeg") ||
        lowerUri.endsWith(".vob") ||
        lowerUri.endsWith(".asf") ||
        lowerUri.endsWith(".wmv") ||
        lowerUri.endsWith(".divx")
}

private fun AppMediaItem.samePlayable(other: AppMediaItem): Boolean =
    id == other.id && type == other.type && serverId == other.serverId

internal fun List<AppMediaItem>.bestCompatibleLiveAlternative(
    current: AppMediaItem,
    maxVideoHeight: Int,
    excludedKeys: Set<String> = emptySet(),
): AppMediaItem? {
    if (current.type != ContentType.LIVE) return null
    val allowedRank = liveMaxAllowedRank(maxVideoHeight)
    val currentBase = current.liveBaseTitle()
    return asSequence()
        .filter { candidate ->
            candidate.type == ContentType.LIVE &&
                !candidate.samePlayable(current) &&
                candidate.liveRecoveryKey() !in excludedKeys &&
                candidate.serverId == current.serverId &&
                candidate.categoryId == current.categoryId &&
                candidate.liveBaseTitle() == currentBase &&
                candidate.liveQualityRank() <= allowedRank
        }
        .sortedWith(
            compareBy<AppMediaItem> { it.liveQualityRank() }
                .thenBy { it.serverOrder }
                .thenBy { it.title.lowercase(Locale.US) },
        )
        .firstOrNull()
        ?: asSequence()
            .filter { candidate ->
                candidate.type == ContentType.LIVE &&
                    !candidate.samePlayable(current) &&
                    candidate.liveRecoveryKey() !in excludedKeys &&
                    candidate.serverId == current.serverId &&
                    candidate.liveBaseTitle() == currentBase &&
                    candidate.liveQualityRank() <= allowedRank
            }
            .sortedWith(
                compareBy<AppMediaItem> { it.liveQualityRank() }
                    .thenBy { it.serverOrder }
                    .thenBy { it.title.lowercase(Locale.US) },
            )
            .firstOrNull()
        ?: asSequence()
            .filter { candidate ->
                candidate.type == ContentType.LIVE &&
                    !candidate.samePlayable(current) &&
                    candidate.liveRecoveryKey() !in excludedKeys &&
                    candidate.serverId == current.serverId &&
                    candidate.categoryId == current.categoryId &&
                    candidate.liveQualityRank() <= allowedRank
            }
            .sortedWith(
                compareBy<AppMediaItem> { it.liveQualityRank() }
                    .thenBy { if (it.serverOrder > current.serverOrder) 0 else 1 }
                    .thenBy { kotlin.math.abs(it.serverOrder - current.serverOrder) }
                    .thenBy { it.title.lowercase(Locale.US) },
            )
            .firstOrNull()
        ?: asSequence()
            .filter { candidate ->
                candidate.type == ContentType.LIVE &&
                    !candidate.samePlayable(current) &&
                    candidate.liveRecoveryKey() !in excludedKeys &&
                    candidate.serverId == current.serverId &&
                    candidate.liveQualityRank() <= allowedRank
            }
            .sortedWith(
                compareBy<AppMediaItem> { it.liveQualityRank() }
                    .thenBy { if (it.serverOrder > current.serverOrder) 0 else 1 }
                    .thenBy { kotlin.math.abs(it.serverOrder - current.serverOrder) }
                    .thenBy { it.title.lowercase(Locale.US) },
            )
            .firstOrNull()
}

private fun liveMaxAllowedRank(maxVideoHeight: Int): Int = when {
    maxVideoHeight < 720 -> 1
    maxVideoHeight < 1080 -> 2
    maxVideoHeight < 2160 -> 3
    else -> 4
}

internal fun AppMediaItem.liveQualityRank(): Int =
    liveQualityRankFromText("$title $containerExtension")
        ?: liveQualityRankFromText(categoryName)
        ?: 2

internal fun AppMediaItem.liveBaseTitle(): String =
    title.uppercase(Locale.US)
        .replace(Regex("\\b(8K|4K|UHD|FHD|FULL\\s*HD|HD|SD|2160P?|1080P?|720P?|576P?|480P?|360P?)\\b"), " ")
        .replace(Regex("\\b(EVENT|BACKUP|ALT|VIP|HEVC|H265|H264|50FPS|60FPS)\\b"), " ")
        .replace(Regex("[^A-Z0-9]+"), " ")
        .trim()

private fun AppMediaItem.liveRecoveryKey(): String =
    "${serverId}:${id}:${streamUrl.substringBefore('?')}"

private fun liveQualityRankFromText(raw: String): Int? {
    val value = raw.uppercase(Locale.US)
    return when {
        "8K" in value || "4320" in value -> 5
        "4K" in value || "UHD" in value || "2160" in value -> 4
        "FHD" in value || "FULL HD" in value || "1080" in value -> 3
        Regex("""\bHD\b""").containsMatchIn(value) || "720" in value -> 2
        Regex("""\bSD\b""").containsMatchIn(value) || "480" in value || "360" in value -> 1
        else -> null
    }
}

private fun Int.floorMod(size: Int): Int = ((this % size) + size) % size

internal fun liveZapTargetIndex(currentIndex: Int, direction: Int, size: Int): Int? {
    if (size <= 0 || currentIndex !in 0 until size || direction == 0) return null
    return (currentIndex + direction).floorMod(size)
}

private fun Int.playbackStateLabel(): String = when (this) {
    Player.STATE_IDLE -> "IDLE"
    Player.STATE_BUFFERING -> "BUFFERING"
    Player.STATE_READY -> "READY"
    Player.STATE_ENDED -> "ENDED"
    else -> toString()
}

@Composable
private fun OverlayCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    GlassPanel(modifier = modifier, radius = 28.dp) {
        Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 20.dp), content = content)
    }
}

@OptIn(UnstableApi::class)
private fun buildPlayer(
    context: Context,
    request: StreamRequest,
    item: AppMediaItem,
    isLive: Boolean,
    onIsPlayingChanged: (Boolean) -> Unit,
    onPlaybackStateChanged: (Int) -> Unit,
    onRenderedFirstFrame: () -> Unit,
    onPlayerError: (PlaybackException) -> Unit,
    onDurationChanged: (Long) -> Unit,
    startPlayback: Boolean = true,
    performancePolicy: PerformancePolicy,
): ExoPlayer {
    val isRtsp = request.uri.startsWith("rtsp://", ignoreCase = true)
    // Receiver-style live: quick startup with enough buffer for real-world IPTV jitter.
    val liveProfile = livePlaybackProfile(
        isPerformanceMode = performancePolicy.isPerformance,
        policyLiveBufferMs = performancePolicy.liveBufferMs,
        maxVideoHeight = performancePolicy.maxVideoHeight,
    )
    val liveLoadControl = DefaultLoadControl.Builder()
        .setBufferDurationsMs(
            liveProfile.minBufferMs,
            liveProfile.maxBufferMs,
            liveProfile.bufferForPlaybackMs,
            liveProfile.bufferForPlaybackAfterRebufferMs,
        )
        .setPrioritizeTimeOverSizeThresholds(true)
        .build()
    // VOD: generous buffer for smooth 4K/8K playback
    val vodLoadControl = DefaultLoadControl.Builder()
        .setBufferDurationsMs(16_000, 60_000, 1_500, 4_000)
        .setPrioritizeTimeOverSizeThresholds(true)
        .build()
    val requestHeaders = request.headers.filterKeys { !it.equals("User-Agent", ignoreCase = true) }
    val httpFactory = OkHttpDataSource.Factory(NetworkModule.okHttp)
        .setUserAgent(request.headers["User-Agent"] ?: APP_USER_AGENT)
        .setDefaultRequestProperties(requestHeaders)
    val tsExtractorFlags = liveTsExtractorFlags()
    val extractorsFactory = DefaultExtractorsFactory()
        .setTsExtractorFlags(tsExtractorFlags)
    val mediaSourceFactory = if (isRtsp) {
        DefaultMediaSourceFactory(context, extractorsFactory)
    } else {
        DefaultMediaSourceFactory(httpFactory, extractorsFactory)
    }
    if (isLive) {
        mediaSourceFactory.setLiveTargetOffsetMs(liveProfile.targetOffsetMs)
        mediaSourceFactory.setLiveMinOffsetMs(liveProfile.minOffsetMs)
        mediaSourceFactory.setLiveMaxOffsetMs(liveProfile.maxOffsetMs)
        mediaSourceFactory.setLiveMinSpeed(liveProfile.minPlaybackSpeed)
        mediaSourceFactory.setLiveMaxSpeed(liveProfile.maxPlaybackSpeed)
    }
    val liveVideoHeight = if (isLive) liveSafeMaxVideoHeight(performancePolicy.maxVideoHeight) else performancePolicy.maxVideoHeight
    val liveVideoWidth = when {
        liveVideoHeight <= 720 -> 1280
        liveVideoHeight <= 1080 -> 1920
        liveVideoHeight <= 2160 -> 3840
        else -> 7680
    }
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
            .setMaxVideoSize(liveVideoWidth, liveVideoHeight)
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
                .setMaxVideoBitrate(if (isLive) liveSafeMaxBitrate(liveVideoHeight) else 8_000_000)
        }
        parameters = builder.build()
    }
    val errorHandlingPolicy = object : DefaultLoadErrorHandlingPolicy() {
        override fun getRetryDelayMsFor(loadErrorInfo: LoadErrorHandlingPolicy.LoadErrorInfo): Long {
            val attempt = loadErrorInfo.errorCount.coerceAtLeast(1)
            return if (isLive) (attempt * 1_000L).coerceAtMost(4_000L) else (attempt * 1_500L).coerceAtMost(6_000L)
        }
        // Live: 6 segment retries (~18s worst case) is enough to ride out an encoder
        // restart or brief CDN gap, but surfaces a truly dead stream fast so the app-level
        // recovery (alternative quality / LibVLC fallback) can take over instead of the
        // viewer staring at a frozen channel for nearly a minute (old value was 12 ≈ 55s).
        override fun getMinimumLoadableRetryCount(dataType: Int): Int = if (isLive) 6 else 5
    }
    val renderersFactory = DefaultRenderersFactory(context)
        .setEnableDecoderFallback(true)
        .setEnableAudioOutputPlaybackParameters(true)
        .setAllowedVideoJoiningTimeMs(if (isLive) 7_000L else 5_000L)
    if (shouldForceAsyncCodecQueueing(Build.VERSION.SDK_INT)) {
        renderersFactory.forceEnableMediaCodecAsynchronousQueueing()
    }
    return ExoPlayer.Builder(context, renderersFactory)
        .setTrackSelector(trackSelector)
        .setLoadControl(if (isLive) liveLoadControl else vodLoadControl)
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
        .setMediaSourceFactory(mediaSourceFactory.setLoadErrorHandlingPolicy(errorHandlingPolicy))
        .setSeekForwardIncrementMs(10_000)
        .setSeekBackIncrementMs(10_000)
        .build()
        .apply {
            // Keep CPU + Wi-Fi awake while playing so the TV/box does not idle to sleep.
            setWakeMode(C.WAKE_MODE_NETWORK)
            setVideoScalingMode(C.VIDEO_SCALING_MODE_SCALE_TO_FIT)
            addListener(object : Player.Listener {
                override fun onIsPlayingChanged(isPlaying: Boolean) = onIsPlayingChanged(isPlaying)
                override fun onRenderedFirstFrame() = onRenderedFirstFrame()
                override fun onPlaybackStateChanged(playbackState: Int) {
                    onPlaybackStateChanged(playbackState)
                    if (this@apply.duration > 0) onDurationChanged(this@apply.duration)
                    PlaybackTelemetryStore.record(
                        PlaybackTelemetrySnapshot(
                            mediaId = item.id,
                            title = item.title,
                            isLive = isLive,
                            collectedAt = System.currentTimeMillis(),
                            statsSummary = "state=${playbackState.playbackStateLabel()}; mime=${request.mimeType.orEmpty()}; headers=${request.headers.keys.joinToString()}",
                        ),
                    )
                }
                override fun onPlayerError(error: PlaybackException) {
                    if (isLive && error.errorCode == PlaybackException.ERROR_CODE_BEHIND_LIVE_WINDOW) {
                        this@apply.seekToDefaultPosition()
                        this@apply.prepare()
                        this@apply.play()
                    } else {
                        onPlayerError(error)
                    }
                }
                override fun onEvents(player: Player, events: Player.Events) {
                    if (events.contains(Player.EVENT_TIMELINE_CHANGED) || events.contains(Player.EVENT_TRACKS_CHANGED)) {
                        onDurationChanged(player.duration.coerceAtLeast(1L))
                    }
                }
            })
            if (startPlayback) {
                val mediaItem = buildPlayableMediaItem(request, item, isLive, liveProfile)
                if (!isRtsp && request.mimeType == MimeTypes.APPLICATION_M3U8) {
                    val hlsMediaSource = HlsMediaSource.Factory(httpFactory)
                        .setAllowChunklessPreparation(true)
                        .setExtractorFactory(DefaultHlsExtractorFactory(tsExtractorFlags, true))
                        .setLoadErrorHandlingPolicy(errorHandlingPolicy)
                        .createMediaSource(mediaItem)
                    if (isLive) {
                        setMediaSource(hlsMediaSource)
                    } else {
                        setMediaSource(hlsMediaSource, item.watchPositionMs.coerceAtLeast(0))
                    }
                } else {
                    setMediaItem(mediaItem, if (isLive) C.TIME_UNSET else item.watchPositionMs.coerceAtLeast(0))
                }
                playWhenReady = true
                prepare()
            }
        }
}

private fun buildPlayableMediaItem(
    request: StreamRequest,
    item: AppMediaItem,
    isLive: Boolean,
    liveProfile: LivePlaybackProfile,
): MediaItem {
    val liveConfiguration = if (isLive) {
        MediaItem.LiveConfiguration.Builder()
            .setTargetOffsetMs(liveProfile.targetOffsetMs)
            .setMinOffsetMs(liveProfile.minOffsetMs)
            .setMaxOffsetMs(liveProfile.maxOffsetMs)
            .setMinPlaybackSpeed(liveProfile.minPlaybackSpeed)
            .setMaxPlaybackSpeed(liveProfile.maxPlaybackSpeed)
            .build()
    } else {
        null
    }
    return MediaItem.Builder()
        .setUri(request.uri)
        .setMimeType(request.mimeType)
        .setMediaId(item.id)
        .setTag(item.title)
        .apply {
            if (liveConfiguration != null) setLiveConfiguration(liveConfiguration)
        }
        .build()
}

internal data class StreamRequest(
    val uri: String,
    val headers: Map<String, String>,
    val mimeType: String?,
)

private suspend fun resolveLiveRedirectRequest(request: StreamRequest): StreamRequest = withContext(Dispatchers.IO) {
    runCatching {
        val probe = Request.Builder()
            .url(request.uri)
            .get()
            .header("User-Agent", request.headers["User-Agent"] ?: APP_USER_AGENT)
            .header("Accept", "*/*")
            .header("Range", request.headers["Range"] ?: "bytes=0-1024")
            .apply {
                request.headers.forEach { (key, value) ->
                    if (!key.equals("Range", ignoreCase = true) && !key.equals("User-Agent", ignoreCase = true)) {
                        header(key, value)
                    }
                }
            }
            .build()
        NetworkModule.okHttp
            .newBuilder()
            .readTimeout(4, TimeUnit.SECONDS)
            .callTimeout(6, TimeUnit.SECONDS)
            .build()
            .newCall(probe)
            .execute()
            .use { response ->
                redirectedStreamRequest(
                    request = request,
                    finalUri = response.request.url.toString(),
                    contentType = response.header("Content-Type").orEmpty(),
                )
            }
    }.getOrDefault(request)
}

internal fun redirectedStreamRequest(request: StreamRequest, finalUri: String, contentType: String): StreamRequest {
    val normalizedType = contentType.substringBefore(';').trim().lowercase(Locale.US)
    val redirectedMimeType = when {
        normalizedType.contains("mpegurl") || normalizedType.contains("m3u8") -> MimeTypes.APPLICATION_M3U8
        normalizedType.contains("dash+xml") || normalizedType.contains("mpd") -> MimeTypes.APPLICATION_MPD
        normalizedType.contains("mp2t") || normalizedType.contains("mpegts") -> MimeTypes.VIDEO_MP2T
        normalizedType.contains("mp4") -> MimeTypes.VIDEO_MP4
        normalizedType.contains("matroska") -> MimeTypes.VIDEO_MATROSKA
        normalizedType.contains("webm") -> MimeTypes.VIDEO_WEBM
        normalizedType.contains("x-flv") || normalizedType.contains("flv") -> MimeTypes.VIDEO_FLV
        normalizedType.contains("x-msvideo") || normalizedType.contains("avi") -> MimeTypes.VIDEO_AVI
        normalizedType.contains("mpeg") -> MimeTypes.VIDEO_MPEG
        else -> inferMimeType(finalUri)
    }
    val resolvedUri = when (redirectedMimeType) {
        MimeTypes.APPLICATION_M3U8,
        MimeTypes.APPLICATION_MPD,
        MimeTypes.APPLICATION_SS -> finalUri.ifBlank { request.uri }
        else -> request.uri
    }
    return request.copy(
        uri = resolvedUri,
        mimeType = redirectedMimeType ?: request.mimeType,
    )
}

private data class ExternalLaunchResult(
    val success: Boolean,
    val message: String,
)

internal fun parseStreamRequest(rawUrl: String): StreamRequest {
    val parts = rawUrl.split("|", limit = 2)
    val cleanUrl = parts.first().trim()
    val headers = LinkedHashMap<String, String>()
    if (parts.size > 1) {
        parts[1]
            .split("&")
            .mapNotNull { token ->
                val pair = token.split("=", limit = 2)
                if (pair.size == 2) {
                    decodeHeader(pair[0]) to decodeHeader(pair[1])
                } else {
                    null
                }
            }
            .forEach { (key, value) -> headers[key] = value }
    }
    val normalizedHeaders = normalizeStreamHeaders(headers)
    val mimeType = inferMimeType(cleanUrl)
    return StreamRequest(
        uri = cleanUrl,
        headers = normalizedHeaders.ifEmpty { emptyMap() },
        mimeType = mimeType,
    )
}

private fun decodeHeader(value: String): String = runCatching {
    URLDecoder.decode(value, StandardCharsets.UTF_8.name())
}.getOrDefault(value)

internal fun normalizeStreamHeaders(headers: Map<String, String>): Map<String, String> {
    if (headers.isEmpty()) return emptyMap()
    val normalized = LinkedHashMap<String, String>()
    headers.forEach { (rawKey, rawValue) ->
        val key = when (rawKey.trim().lowercase(Locale.US)) {
            "user-agent", "useragent", "ua", "http-user-agent" -> "User-Agent"
            "referer", "referrer", "http-referrer", "http-referer" -> "Referer"
            "origin" -> "Origin"
            "cookie", "cookies" -> "Cookie"
            "authorization", "auth" -> "Authorization"
            else -> rawKey.trim()
        }
        val value = rawValue.trim()
        if (key.isNotBlank() && value.isNotBlank()) normalized[key] = value
    }
    return normalized
}

internal fun inferMimeType(url: String): String? {
    val normalizedFull = url.lowercase(Locale.US)
    val normalized = normalizedFull.substringBefore('?')
    val outputHint = Regex("""[?&](?:output|type|format|extension)=([^&#]+)""")
        .find(normalizedFull)
        ?.groupValues
        ?.getOrNull(1)
        ?.substringBefore('&')
        ?.substringBefore('#')
        .orEmpty()
    return when {
        normalized.startsWith("rtsp://") -> null
        normalized.contains(".m3u8") || outputHint == "m3u8" -> MimeTypes.APPLICATION_M3U8
        normalized.contains(".mpd") || outputHint == "mpd" || outputHint == "dash" -> MimeTypes.APPLICATION_MPD
        normalized.contains(".ism") || normalized.contains("manifest") || outputHint == "ism" || outputHint == "smoothstreaming" -> MimeTypes.APPLICATION_SS
        normalized.endsWith(".ts") || normalized.endsWith(".m2ts") || outputHint == "ts" || outputHint == "mpegts" -> MimeTypes.VIDEO_MP2T
        normalized.endsWith(".mp4") || normalized.endsWith(".m4v") -> MimeTypes.VIDEO_MP4
        normalized.endsWith(".mov") -> MimeTypes.VIDEO_QUICK_TIME
        normalized.endsWith(".mkv") -> MimeTypes.VIDEO_MATROSKA
        normalized.endsWith(".webm") -> MimeTypes.VIDEO_WEBM
        normalized.endsWith(".avi") -> MimeTypes.VIDEO_AVI
        normalized.endsWith(".flv") || normalized.endsWith(".f4v") -> MimeTypes.VIDEO_FLV
        normalized.endsWith(".ogg") || normalized.endsWith(".ogv") -> MimeTypes.VIDEO_OGG
        normalized.endsWith(".mpg") || normalized.endsWith(".mpeg") -> MimeTypes.VIDEO_MPEG
        normalized.endsWith(".vob") -> MimeTypes.VIDEO_PS
        normalized.endsWith(".3gp") || normalized.endsWith(".3g2") -> "video/3gpp"
        else -> null
    }
}

private fun String.hasLiveTsHint(): Boolean {
    val normalizedFull = lowercase(Locale.US)
    val normalized = normalizedFull.substringBefore('?').substringBefore('#')
    val outputHint = Regex("""[?&](?:output|type|format|extension)=([^&#]+)""")
        .find(normalizedFull)
        ?.groupValues
        ?.getOrNull(1)
        .orEmpty()
    return normalized.endsWith(".ts") ||
        normalized.endsWith(".m2ts") ||
        outputHint == "ts" ||
        outputHint == "mpegts"
}

internal fun shouldFallbackToLibVlc(error: PlaybackException): Boolean {
    return shouldFallbackToLibVlc(error.errorCode, error.cause)
}

internal fun shouldFallbackToLibVlc(errorCode: Int, cause: Throwable?): Boolean {
    return cause is ParserException ||
        cause is UnrecognizedInputFormatException ||
        errorCode == PlaybackException.ERROR_CODE_PARSING_CONTAINER_MALFORMED ||
        errorCode == PlaybackException.ERROR_CODE_PARSING_MANIFEST_MALFORMED ||
        errorCode == PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS ||
        errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED ||
        errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT ||
        errorCode == PlaybackException.ERROR_CODE_DECODING_FAILED ||
        errorCode == PlaybackException.ERROR_CODE_DECODER_INIT_FAILED
}

internal fun livePlaybackFailureMessage(): String =
    "Live stream stopped temporarily. Try again or open it in an external player."

internal fun liveFallbackCannotOpenMessage(): String =
    "The internal fallback player could not open this channel. The source may be blocked, expired, or require a different player."

internal fun liveNoVideoFrameMessage(): String =
    "The channel connected but did not render video. MoPlayer Pro tried safer live qualities; open another quality/channel or use the fallback player if this source is unstable."

private fun explainPlaybackError(
    context: Context,
    error: PlaybackException,
    uri: String,
    isLive: Boolean,
): String {
    val cause = error.cause
    return when {
        !context.hasInternetConnection() -> "No internet connection is available right now."
        cause is HttpDataSource.InvalidResponseCodeException && cause.responseCode in 300..399 ->
            "The link returns too many redirects or incompatible stream redirects."
        cause is HttpDataSource.InvalidResponseCodeException && cause.responseCode == 401 ->
            "The server rejected access to the stream. The link may need authorization or special headers."
        cause is HttpDataSource.InvalidResponseCodeException && cause.responseCode == 403 ->
            "The server blocked this link in the internal player."
        cause is HttpDataSource.InvalidResponseCodeException && cause.responseCode == 404 ->
            "The link is not working or no longer exists on the server."
        cause is SocketTimeoutException ->
            if (isLive) "The server is too slow or the channel is not responding right now." else "Connection timed out while loading the video."
        cause is ConnectException -> "Could not connect to the server. Check the link or network."
        cause is ParserException -> "The stream format is unsupported or the stream data is malformed."
        error.errorCode == PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS -> "The server returned an invalid response for this stream."
        error.errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED -> "Connection to the stream server failed."
        error.errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT -> "Connection to the stream server timed out."
        error.errorCode == PlaybackException.ERROR_CODE_PARSING_CONTAINER_MALFORMED -> "The media file or container is not supported correctly."
        else -> "Could not play the current link in Media3. Try again or open it in VLC or MX Player. (${uri.safeStreamLabel()})"
    }
}

private fun String.safeStreamLabel(): String {
    val withoutQuery = substringBefore('?')
        .replace(Regex("username=[^&\\s/]+"), "username=***")
        .replace(Regex("password=[^&\\s/]+"), "password=***")
        .replace(Regex("""/(live|movie|series)/([^/]+)/([^/]+)/""", RegexOption.IGNORE_CASE), "/$1/***/***/")
    return withoutQuery.takeLast(48)
}

private fun openExternalPlayer(
    context: Context,
    request: StreamRequest,
    title: String,
    route: String,
): ExternalLaunchResult {
    val packageNames = when (route) {
        "vlc" -> listOf("org.videolan.vlc")
        "mx" -> listOf("com.mxtech.videoplayer.ad", "com.mxtech.videoplayer.pro")
        "external" -> emptyList()
        else -> emptyList()
    }
    val baseIntent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(Uri.parse(request.uri), "video/*")
        putExtra("title", title)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        request.headers.forEach { (key, value) -> putExtra(key, value) }
    }

    if (route == "external") {
        val chooser = Intent.createChooser(baseIntent, "Choose video player")
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return try {
            context.startActivity(chooser)
            ExternalLaunchResult(true, "External player opened.")
        } catch (_: ActivityNotFoundException) {
            ExternalLaunchResult(false, "No external video player is installed on this device.")
        }
    }

    packageNames.forEach { packageName ->
        try {
            context.packageManager.getPackageInfo(packageName, 0)
            context.startActivity(Intent(baseIntent).setPackage(packageName))
            return ExternalLaunchResult(true, "$title opened in the external player.")
        } catch (_: Exception) {
        }
    }

    return ExternalLaunchResult(
        success = false,
        message = when (route) {
            "vlc" -> "VLC is not installed. Install it or use Media3 or another external player."
            "mx" -> "MX Player is not installed. Install it or use Media3 or another external player."
            else -> "Could not open the requested external player."
        },
    )
}

private tailrec fun Context.findActivity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.findActivity()
    else -> null
}

private fun Context.hasInternetConnection(): Boolean {
    val manager = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return true
    val network = manager.activeNetwork ?: return false
    val capabilities = manager.getNetworkCapabilities(network) ?: return false
    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
}

private fun formatTime(ms: Long): String {
    if (ms <= 0) return "00:00"
    val hours = TimeUnit.MILLISECONDS.toHours(ms)
    val minutes = TimeUnit.MILLISECONDS.toMinutes(ms) % 60
    val seconds = TimeUnit.MILLISECONDS.toSeconds(ms) % 60
    return if (hours > 0) {
        String.format(Locale.US, "%02d:%02d:%02d", hours, minutes, seconds)
    } else {
        String.format(Locale.US, "%02d:%02d", minutes, seconds)
    }
}
