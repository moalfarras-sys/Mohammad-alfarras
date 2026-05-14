package com.moalfarras.moplayer.ui.player

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import androidx.activity.compose.BackHandler
import androidx.annotation.OptIn
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
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
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.components.FocusGlow
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
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
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.viewinterop.AndroidView
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
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.media3.exoplayer.upstream.DefaultLoadErrorHandlingPolicy
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy
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
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import kotlinx.coroutines.delay
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.util.VLCVideoLayout
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.LinkedHashMap
import java.util.Locale
import java.util.concurrent.TimeUnit

private const val APP_USER_AGENT = "VLC/3.0.21 LibVLC/3.0.21 MoPlayerPro/2.1.3"

enum class LiveQualityMode { AUTO, BEST, STABLE }
private enum class InternalPlaybackEngine { MEDIA3, LIBVLC }

/** Cached flag — set to false the first time LibVLC fails to load native libs. */
private var vlcNativeAvailable: Boolean? = null

/** Quick check if LibVLC native libraries can be loaded on this device. */
private fun isVlcAvailable(context: android.content.Context): Boolean {
    vlcNativeAvailable?.let { return it }
    return try {
        LibVLC(context, arrayListOf("--no-audio", "--no-video")).release()
        vlcNativeAvailable = true
        true
    } catch (_: UnsatisfiedLinkError) {
        android.util.Log.w("MoPlayer", "LibVLC native libs unavailable on this device")
        vlcNativeAvailable = false
        false
    } catch (_: Exception) {
        vlcNativeAvailable = false
        false
    }
}

private fun preferredLiveAutoEngine(request: StreamRequest): InternalPlaybackEngine {
    return when (request.mimeType) {
        MimeTypes.APPLICATION_M3U8,
        MimeTypes.APPLICATION_MPD,
        MimeTypes.APPLICATION_SS -> InternalPlaybackEngine.MEDIA3
        else -> InternalPlaybackEngine.LIBVLC
    }
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
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val isLive = item.type == ContentType.LIVE
    val streamRequest = remember(item.streamUrl) { parseStreamRequest(item.streamUrl) }
    val normalizedPreferred = remember(preferredPlayer) {
        when (preferredPlayer) {
            "internal" -> "auto"
            else -> preferredPlayer.ifBlank { "media3" }
        }
    }

    var route by remember(item.id, normalizedPreferred) {
        mutableStateOf(
            when {
                normalizedPreferred == "ask" && !isLive -> null
                normalizedPreferred == "ask" -> "auto"
                isLive && normalizedPreferred == "media3" -> "auto"
                else -> normalizedPreferred
            },
        )
    }
    var internalEngine by remember(item.id, route, streamRequest.uri) {
        val preferred = if (isLive && route == "auto") preferredLiveAutoEngine(streamRequest) else InternalPlaybackEngine.MEDIA3
        // Safety: never route to LIBVLC when native libs are known-unavailable
        mutableStateOf(
            if (preferred == InternalPlaybackEngine.LIBVLC && !isVlcAvailable(context)) InternalPlaybackEngine.MEDIA3
            else preferred
        )
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
    var resizeIndex by remember { mutableIntStateOf(0) }
    var favoriteMarked by remember(item.id, item.type) { mutableStateOf(item.isFavorite) }
    var liveQualityMode by remember { mutableStateOf(LiveQualityMode.AUTO) }
    var playbackSignal by remember { mutableStateOf("") }
    var libVlcRetryNonce by remember(item.id, streamRequest.uri) { mutableIntStateOf(0) }
    var liveSwitchLocked by remember(item.id) { mutableStateOf(false) }
    var lastLiveSwitchAt by remember { mutableLongStateOf(0L) }
    var liveLastPlayingAt by remember(item.id, streamRequest.uri) { mutableLongStateOf(0L) }
    var liveConsecutiveFailures by remember(item.id, streamRequest.uri) { mutableIntStateOf(0) }
    var triedMedia3ForLive by remember(item.id, streamRequest.uri) {
        mutableStateOf(preferredLiveAutoEngine(streamRequest) == InternalPlaybackEngine.MEDIA3)
    }
    var triedLibVlcForLive by remember(item.id, streamRequest.uri) {
        mutableStateOf(preferredLiveAutoEngine(streamRequest) == InternalPlaybackEngine.LIBVLC)
    }
    val playerFocusRequester = remember { FocusRequester() }

    val resizeModes = listOf(
        AspectRatioFrameLayout.RESIZE_MODE_FIT,
        AspectRatioFrameLayout.RESIZE_MODE_FILL,
        AspectRatioFrameLayout.RESIZE_MODE_ZOOM,
    )
    val resizeLabels = listOf("ملاءمة", "ملء الشاشة", "تكبير")

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
            message = launchMessage ?: "جاري فتح المشغل الخارجي...",
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

    val useLibVlc = route == "auto" && internalEngine == InternalPlaybackEngine.LIBVLC
    val exoPlayer = remember(item.id, streamRequest.uri, useLibVlc) {
        buildPlayer(
            context = context,
            request = streamRequest,
            item = item,
            isLive = isLive,
            onIsPlayingChanged = { isPlaying = it },
            onPlaybackStateChanged = { state ->
                isBuffering = state == Player.STATE_BUFFERING || state == Player.STATE_IDLE
                if (state == Player.STATE_READY) {
                    liveLastPlayingAt = System.currentTimeMillis()
                    liveConsecutiveFailures = 0
                    liveSwitchLocked = false
                    playbackError = null
                }
            },
            onPlayerError = { error ->
                liveSwitchLocked = false
                if (isLive && shouldFallbackToLibVlc(error) && !triedLibVlcForLive && isVlcAvailable(context)) {
                    triedLibVlcForLive = true
                    playbackError = null
                    isBuffering = true
                    internalEngine = InternalPlaybackEngine.LIBVLC
                    return@buildPlayer
                }
                playbackError = explainPlaybackError(context, error, streamRequest.uri, isLive)
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
            startPlayback = !useLibVlc,
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

    LaunchedEffect(exoPlayer, item.id) {
        while (true) {
            currentPosition = exoPlayer.currentPosition.coerceAtLeast(0)
            duration = exoPlayer.duration.coerceAtLeast(duration)
            playbackSignal = playbackSignal(exoPlayer.videoFormat)
            if (showControls && isPlaying && System.currentTimeMillis() - lastInteraction > if (isLive) 3200 else 5000) {
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
                Lifecycle.Event.ON_STOP -> {
                    resumeMedia3OnStart = !useLibVlc && exoPlayer.playWhenReady
                    if (!useLibVlc) {
                        exoPlayer.playWhenReady = false
                        exoPlayer.pause()
                    }
                }
                Lifecycle.Event.ON_START -> {
                    if (resumeMedia3OnStart && !useLibVlc) {
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

    LaunchedEffect(useLibVlc, exoPlayer) {
        if (useLibVlc) {
            exoPlayer.pause()
            exoPlayer.stop()
        }
    }

    LaunchedEffect(liveSwitchLocked, item.id, streamRequest.uri) {
        if (liveSwitchLocked) {
            delay(3_500)
            liveSwitchLocked = false
        }
    }

    LaunchedEffect(seekJump) {
        if (seekJump != 0) {
            delay(900)
            seekJump = 0
        }
    }

    fun wakeControls() {
        showControls = true
        lastInteraction = System.currentTimeMillis()
    }

    fun retryPlayback() {
        playbackError = null
        launchMessage = null
        isBuffering = true
        liveConsecutiveFailures = 0
        liveSwitchLocked = false
        if (isLive) {
            triedMedia3ForLive = !useLibVlc
            triedLibVlcForLive = useLibVlc
        }
        if (useLibVlc) {
            libVlcRetryNonce++
            return
        }
        exoPlayer.stop()
        exoPlayer.setMediaItem(buildPlayableMediaItem(streamRequest, item, isLive), if (isLive) C.TIME_UNSET else item.watchPositionMs.coerceAtLeast(0))
        exoPlayer.prepare()
        exoPlayer.playWhenReady = true
    }

    fun switchTo(target: AppMediaItem?) {
        if (target == null || target.id == item.id || liveSwitchLocked) return
        if (target.type == ContentType.LIVE) {
            val now = System.currentTimeMillis()
            if (now - lastLiveSwitchAt < 750L) return
            lastLiveSwitchAt = now
            liveSwitchLocked = true
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
            return
        }

        if (liveConsecutiveFailures <= 4 || recentlyPlaying) {
            isBuffering = !recentlyPlaying
            libVlcRetryNonce++
            return
        }

        if (!triedMedia3ForLive && !streamRequest.uri.startsWith("rtsp://", ignoreCase = true)) {
            triedMedia3ForLive = true
            playbackError = null
            isBuffering = true
            internalEngine = InternalPlaybackEngine.MEDIA3
            return
        }

        isBuffering = false
        playbackError = message
    }

    BackHandler {
        when {
            isLive && showLiveZap -> showLiveZap = false
            isLive -> onBack(0, 0)
            showControls -> showControls = false
            else -> onBack(exoPlayer.currentPosition, exoPlayer.duration.coerceAtLeast(0))
        }
    }

    val currentIndex = remember(item.id, relatedItems) { relatedItems.indexOfFirst { it.id == item.id && it.type == item.type } }
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
    val displayedCurrentIndex = remember(item.id, item.categoryId, displayedLiveZapItems) {
        displayedLiveZapItems.indexOfFirst { it.id == item.id && it.serverId == item.serverId && it.type == item.type }
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

    LaunchedEffect(exoPlayer, liveQualityMode) {
        if (isLive) applyLiveQualityMode(exoPlayer, liveQualityMode)
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
                        Key.DirectionUp -> {
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
                        Key.DirectionDown -> {
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
                                    if (selected.id != item.id || selected.serverId != item.serverId) switchTo(selected)
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
                        Key.MediaPlayPause, Key.Spacebar -> {
                            if (exoPlayer.isPlaying) exoPlayer.pause() else exoPlayer.play()
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
                        // If controls are hidden, first key shows them (except back)
                        if (!showControls) {
                            when (event.key) {
                                Key.Back, Key.Escape -> {
                                    onBack(exoPlayer.currentPosition, exoPlayer.duration.coerceAtLeast(0))
                                    return@onPreviewKeyEvent true
                                }
                                Key.MediaPlayPause -> {
                                    if (exoPlayer.isPlaying) exoPlayer.pause() else exoPlayer.play()
                                    wakeControls()
                                    return@onPreviewKeyEvent true
                                }
                                Key.DirectionLeft -> {
                                    exoPlayer.seekBack(); seekJump = -10; wakeControls()
                                    return@onPreviewKeyEvent true
                                }
                                Key.DirectionRight -> {
                                    exoPlayer.seekForward(); seekJump = 10; wakeControls()
                                    return@onPreviewKeyEvent true
                                }
                                else -> {
                                    // Any other key: just show controls
                                    wakeControls()
                                    return@onPreviewKeyEvent true
                                }
                            }
                        }
                        // Controls are visible — let D-pad navigate to buttons
                        when (event.key) {
                            Key.Back, Key.Escape -> { showControls = false; true }
                            Key.MediaPlayPause -> {
                                if (exoPlayer.isPlaying) exoPlayer.pause() else exoPlayer.play()
                                lastInteraction = System.currentTimeMillis()
                                true
                            }
                            // Let Compose focus system handle D-pad when controls visible
                            Key.DirectionLeft, Key.DirectionRight, Key.DirectionUp, Key.DirectionDown,
                            Key.Enter, Key.DirectionCenter, Key.Spacebar -> {
                                lastInteraction = System.currentTimeMillis()
                                false // pass through to focus system
                            }
                            else -> false
                        }
                    }
                }
            },
    ) {
        if (useLibVlc) {
            LibVlcPlayerView(
                request = streamRequest,
                title = item.title,
                resizeMode = resizeModes[resizeIndex],
                retryNonce = libVlcRetryNonce,
                onBuffering = { isBuffering = it },
                onPlaying = {
                    isPlaying = true
                    isBuffering = false
                    liveLastPlayingAt = System.currentTimeMillis()
                    liveConsecutiveFailures = 0
                    liveSwitchLocked = false
                    playbackError = null
                    playbackSignal = "VLC · بث مباشر"
                },
                onPaused = { isPlaying = false },
                onError = ::handleLibVlcLiveError,
                modifier = Modifier.fillMaxSize(),
            )
        } else {
            AndroidView(
                factory = {
                    PlayerView(it).apply {
                        player = exoPlayer
                        useController = false
                        resizeMode = resizeModes[resizeIndex]
                        keepScreenOn = true
                    }
                },
                update = { it.resizeMode = resizeModes[resizeIndex] },
                modifier = Modifier.fillMaxSize(),
            )
        }

        if (isBuffering && playbackError == null) {
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
                        if (isLive) "جاري فتح القناة..." else "جاري التحميل...",
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
                            Text("تعذر تشغيل البث", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold)
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
                                Text("إعادة", color = Color.Black, fontSize = 13.sp)
                            }
                            OutlinedButton(onClick = { route = "vlc" }, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)) { Text("VLC", fontSize = 12.sp) }
                            if (isLive) {
                                OutlinedButton(
                                    onClick = {
                                        playbackError = null
                                        isBuffering = true
                                        route = "auto"
                                        internalEngine = InternalPlaybackEngine.LIBVLC
                                    },
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                ) { Text("داخلي", fontSize = 12.sp) }
                            }
                            OutlinedButton(onClick = { route = "mx" }, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)) { Text("MX", fontSize = 12.sp) }
                            OutlinedButton(onClick = { route = "external" }, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)) { Text("خارجي", fontSize = 12.sp) }
                            OutlinedButton(onClick = { onBack(exoPlayer.currentPosition, exoPlayer.duration.coerceAtLeast(0)) }, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)) { Text("رجوع", fontSize = 12.sp) }
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
                onQualityMode = { liveQualityMode = it },
                onAudio = { runCatching { TrackSelectionDialogBuilder(context, "الصوت", exoPlayer, C.TRACK_TYPE_AUDIO).build().show() } },
                onSubtitles = { runCatching { TrackSelectionDialogBuilder(context, "الترجمة", exoPlayer, C.TRACK_TYPE_TEXT).build().show() } },
                onVideo = { runCatching { TrackSelectionDialogBuilder(context, "الجودة", exoPlayer, C.TRACK_TYPE_VIDEO).build().show() } },
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
                    // Seek Bar (VOD only)
                    if (!isLive) {
                        GlassPanel(radius = 999.dp, blur = 16.dp, modifier = Modifier.fillMaxWidth()) {
                            Row(
                                Modifier.padding(horizontal = 18.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                Text(formatTime(currentPosition), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Slider(
                                    value = if (duration > 0) (currentPosition.toFloat() / duration.toFloat()).coerceIn(0f, 1f) else 0f,
                                    onValueChange = { pct ->
                                        wakeControls()
                                        val newPosition = (pct * duration).toLong()
                                        exoPlayer.seekTo(newPosition)
                                        currentPosition = newPosition
                                    },
                                    modifier = Modifier.weight(1f).height(32.dp),
                                    colors = SliderDefaults.colors(
                                        thumbColor = accent,
                                        activeTrackColor = accent,
                                        inactiveTrackColor = Color(0x33FFFFFF),
                                    ),
                                )
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
                                    ControlButton(Icons.Rounded.SkipPrevious, "السابق", accent) { switchTo(previousItem) }
                                    Spacer(Modifier.width(10.dp))
                                } else if (!isLive) {
                                    ControlButton(Icons.Rounded.Replay10, "-10", accent) {
                                        exoPlayer.seekBack(); seekJump = -10; wakeControls()
                                    }
                                    Spacer(Modifier.width(8.dp))
                                }

                                Button(
                                    onClick = {
                                        if (exoPlayer.isPlaying) exoPlayer.pause() else exoPlayer.play()
                                        wakeControls()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = accent),
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.height(44.dp),
                                    contentPadding = PaddingValues(horizontal = 18.dp),
                                ) {
                                    Icon(
                                        if (isPlaying) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                                        null, tint = Color.Black, modifier = Modifier.size(24.dp),
                                    )
                                    Spacer(Modifier.width(6.dp))
                                    Text(
                                        if (isPlaying) "إيقاف" else "تشغيل",
                                        color = Color.Black, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp,
                                    )
                                }

                                Spacer(Modifier.width(8.dp))

                                // Favorite button
                                Button(
                                    onClick = { onTripleOk(); favoriteMarked = !favoriteMarked; wakeControls() },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (favoriteMarked) accent.copy(alpha = 0.2f) else Color(0x22FFFFFF),
                                    ),
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.height(44.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp),
                                ) {
                                    Icon(Icons.Rounded.Favorite, null, tint = if (favoriteMarked) accent else Color.White, modifier = Modifier.size(18.dp))
                                }

                                if (isLive && nextItem != null) {
                                    Spacer(Modifier.width(10.dp))
                                    ControlButton(Icons.Rounded.SkipNext, "التالي", accent) { switchTo(nextItem) }
                                } else if (!isLive) {
                                    Spacer(Modifier.width(8.dp))
                                    ControlButton(Icons.Rounded.Forward10, "+10", accent) {
                                        exoPlayer.seekForward(); seekJump = 10; wakeControls()
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
                                    SmallControlButton(Icons.Rounded.Refresh, accent, ::retryPlayback)
                                    SmallControlButton(Icons.Rounded.Audiotrack, accent) {
                                        runCatching { TrackSelectionDialogBuilder(context, "الصوت", exoPlayer, C.TRACK_TYPE_AUDIO).build().show() }
                                    }
                                    SmallControlButton(Icons.Rounded.Subtitles, accent) {
                                        runCatching { TrackSelectionDialogBuilder(context, "الترجمة", exoPlayer, C.TRACK_TYPE_TEXT).build().show() }
                                    }
                                    SmallControlButton(Icons.Rounded.HighQuality, accent) {
                                        runCatching { TrackSelectionDialogBuilder(context, "الجودة", exoPlayer, C.TRACK_TYPE_VIDEO).build().show() }
                                    }
                                    SmallControlButton(Icons.Rounded.Tune, accent) {
                                        resizeIndex = (resizeIndex + 1) % resizeModes.size
                                    }
                                    SmallControlButton(Icons.Rounded.Cast, accent) {
                                        launchCastFallback(context, streamRequest.uri)
                                    }
                                    SmallControlButton(Icons.AutoMirrored.Rounded.OpenInNew, accent) { route = null }
                                }
                                Text(
                                    if (isLive) "▲▼ تبديل القنوات  •  OK إظهار/إخفاء" else "◄► تقديم/تأخير  •  ← إخفاء",
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
                    text = "${if (seekJump > 0) "+" else ""}${seekJump}ث",
                    color = Color.White,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.ExtraBold,
                    modifier = Modifier.padding(horizontal = 28.dp, vertical = 14.dp),
                )
            }
        }
    }
}

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

    LaunchedEffect(visible, selectedIndex, items.size) {
        if (visible && selectedIndex in items.indices) {
            channelListState.animateScrollToItem(selectedIndex.coerceAtLeast(0))
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
                            selectedCategory?.name ?: "القنوات",
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
                        LiveQualityModeButton("تلقائي", qualityMode == LiveQualityMode.AUTO, accent) {
                            onQualityMode(LiveQualityMode.AUTO)
                        }
                        LiveQualityModeButton("أعلى", qualityMode == LiveQualityMode.BEST, accent) {
                            onQualityMode(LiveQualityMode.BEST)
                        }
                        LiveQualityModeButton("ثابت", qualityMode == LiveQualityMode.STABLE, accent) {
                            onQualityMode(LiveQualityMode.STABLE)
                        }
                        LiveQualityModeButton("اختيار", false, accent, onVideo)
                    }

                    if (items.isEmpty()) {
                        Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                            Text("لا توجد قنوات في هذه المجموعة", color = Color(0xCCFFFFFF), fontSize = 13.sp)
                        }
                    } else {
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
                                    onFocus = { onSelectIndex(index) },
                                    onPlay = { onPlay(channel) },
                                )
                            }
                        }
                    }

                    Text(
                        "OK تشغيل  •  ▲▼ تنقل  •  ◄► مجموعات  •  Back إغلاق",
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
    val allCategory = LiveZapCategory(LIVE_ZAP_ALL_CATEGORY_ID, "الكل", size)
    val grouped = groupBy { it.categoryId.ifBlank { LIVE_ZAP_UNCATEGORIZED_ID } }
    val itemCategories = grouped.map { (id, channels) ->
        LiveZapCategory(
            id = id,
            name = channels.firstOrNull()?.categoryName?.ifBlank { "بث مباشر" } ?: "بث مباشر",
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
                        item.categoryName.ifBlank { "بث مباشر" },
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
                        error != null -> "تحتاج إعادة محاولة أو مشغل خارجي"
                        isBuffering -> "جاري فتح القناة..."
                        signal.isNotBlank() -> signal
                        else -> "مباشر الآن"
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
                    "اختيار المشغّل",
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
                    "اختر Media3 أو مشغّلاً خارجياً قبل بدء التشغيل.",
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
                        modifier = Modifier.weight(1f),
                    ) {
                        Text("تلقائي")
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
                    Text("عام")
                }
                OutlinedButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                    Text("إلغاء")
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
                    Button(onClick = onRetrySame) { Text("إعادة المحاولة") }
                    OutlinedButton(onClick = onUseMedia3) { Text("استخدام Media3") }
                    OutlinedButton(onClick = onPickAnother) { Text("اختيار آخر") }
                    OutlinedButton(onClick = onBack) { Text("رجوع") }
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
            blur = 10.dp,
            highlighted = false,
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(icon, null, tint = accent, modifier = Modifier.size(22.dp))
                Text(label, color = Color.White, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun SmallControlButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    accent: Color,
    onClick: () -> Unit,
) {
    FocusGlow(
        cornerRadius = 12.dp,
        onClick = onClick,
        modifier = Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)),
    ) {
        GlassPanel(
            radius = 12.dp,
            blur = 8.dp,
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = accent, modifier = Modifier.size(18.dp))
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
    onPaused: () -> Unit,
    onError: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val vlcOptions = remember {
        arrayListOf(
            "--network-caching=1800",
            "--live-caching=1800",
            "--file-caching=1200",
            "--drop-late-frames",
            "--skip-frames",
            "--avcodec-fast",
        )
    }
    // Defensive LibVLC init: catch UnsatisfiedLinkError so the app never crashes on
    // missing native libs. Instead, we report the error and the user can retry or
    // switch to Media3.
    val vlcPair = remember {
        try {
            val lib = LibVLC(context, vlcOptions)
            val player = MediaPlayer(lib)
            lib to player
        } catch (e: UnsatisfiedLinkError) {
            android.util.Log.e("MoPlayer", "LibVLC native init failed: ${e.message}", e)
            null
        } catch (e: Exception) {
            android.util.Log.e("MoPlayer", "LibVLC init failed: ${e.message}", e)
            null
        }
    }

    // If VLC failed to load, report error immediately and bail out
    if (vlcPair == null) {
        LaunchedEffect(Unit) {
            onError("تعذر تحميل مكتبة VLC الداخلية. جرّب استخدام Media3 بدلاً من ذلك.")
            onBuffering(false)
        }
        return
    }
    val (libVlc, mediaPlayer) = vlcPair

    DisposableEffect(request.uri, retryNonce) {
        var activeSession = true
        onBuffering(true)
        val media = Media(libVlc, Uri.parse(request.uri)).apply {
            setHWDecoderEnabled(true, false)
            addOption(":network-caching=1800")
            addOption(":live-caching=1800")
            addOption(":file-caching=1200")
            addOption(":http-reconnect")
            addOption(":http-continuous")
            addOption(":drop-late-frames")
            addOption(":skip-frames")
            addOption(":avcodec-fast")
            addOption(":http-user-agent=${request.headers["User-Agent"] ?: APP_USER_AGENT}")
            request.headers["Referer"]?.let { addOption(":http-referrer=$it") }
            request.headers["Cookie"]?.let { addOption(":http-cookie=$it") }
            request.headers["Origin"]?.let { addOption(":http-header=Origin: $it") }
            addOption(":meta-title=$title")
        }
        mediaPlayer.media = media
        media.release()
        mediaPlayer.setEventListener { event ->
            if (!activeSession) return@setEventListener
            when (event.type) {
                MediaPlayer.Event.Buffering -> onBuffering(event.buffering < 100f)
                MediaPlayer.Event.Playing -> onPlaying()
                MediaPlayer.Event.Paused, MediaPlayer.Event.Stopped -> onPaused()
                MediaPlayer.Event.EndReached -> {
                    onBuffering(true)
                    onError(livePlaybackFailureMessage())
                }
                MediaPlayer.Event.EncounteredError -> {
                    onBuffering(true)
                    onError(livePlaybackFailureMessage())
                }
            }
        }
        mediaPlayer.play()

        onDispose {
            activeSession = false
            runCatching { mediaPlayer.stop() }
            mediaPlayer.setEventListener(null)
        }
    }

    DisposableEffect(lifecycleOwner, mediaPlayer) {
        var resumeOnStart = false
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_STOP -> {
                    resumeOnStart = mediaPlayer.isPlaying
                    runCatching { mediaPlayer.pause() }
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

    DisposableEffect(Unit) {
        onDispose {
            runCatching { mediaPlayer.detachViews() }
            runCatching { mediaPlayer.release() }
            runCatching { libVlc.release() }
        }
    }

    AndroidView(
        factory = { viewContext ->
            VLCVideoLayout(viewContext).apply {
                keepScreenOn = true
                mediaPlayer.attachViews(this, null, false, false)
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

private fun applyLiveQualityMode(player: ExoPlayer, mode: LiveQualityMode) {
    val builder = player.trackSelectionParameters.buildUpon()
    when (mode) {
        LiveQualityMode.AUTO -> builder
            .setForceHighestSupportedBitrate(false)
            .clearVideoSizeConstraints()
            .setMaxVideoBitrate(Int.MAX_VALUE)
        LiveQualityMode.BEST -> builder
            .setForceHighestSupportedBitrate(true)
            .clearVideoSizeConstraints()
            .setMaxVideoBitrate(Int.MAX_VALUE)
        LiveQualityMode.STABLE -> builder
            .setForceHighestSupportedBitrate(false)
            .setMaxVideoSize(1280, 720)
            .setMaxVideoBitrate(2_500_000)
    }
    player.trackSelectionParameters = builder.build()
}

private fun playbackSignal(format: Format?): String {
    if (format == null) return ""
    val quality = when {
        format.width >= 3840 || format.height >= 2160 -> "4K"
        format.width >= 1920 || format.height >= 1080 -> "FHD"
        format.width >= 1280 || format.height >= 720 -> "HD"
        format.width > 0 || format.height > 0 -> "SD"
        else -> ""
    }
    val hdr = if (format.colorInfo != null) "HDR" else ""
    val codec = format.sampleMimeType?.substringAfter("video/")?.uppercase(Locale.US).orEmpty()
    return listOf(quality, hdr, codec).filter { it.isNotBlank() }.joinToString(" · ")
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
    onPlayerError: (PlaybackException) -> Unit,
    onDurationChanged: (Long) -> Unit,
    startPlayback: Boolean = true,
): ExoPlayer {
    val isRtsp = request.uri.startsWith("rtsp://", ignoreCase = true)
    // Receiver-style live: still quick, but enough buffer for real-world IPTV jitter.
    val liveLoadControl = DefaultLoadControl.Builder()
        .setBufferDurationsMs(4_000, 24_000, 1_500, 3_500)
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
    val mediaSourceFactory = if (isRtsp) {
        DefaultMediaSourceFactory(context)
    } else {
        DefaultMediaSourceFactory(httpFactory)
    }
    // Auto quality: no resolution/bitrate cap = 8K auto-select
    val trackSelector = DefaultTrackSelector(context).apply {
        parameters = buildUponParameters()
            .setForceHighestSupportedBitrate(false)
            .setAllowVideoMixedMimeTypeAdaptiveness(true)
            .setAllowAudioMixedMimeTypeAdaptiveness(true)
            .setPreferredAudioLanguage("ar")
            .build()
    }
    val errorHandlingPolicy = object : DefaultLoadErrorHandlingPolicy() {
        override fun getRetryDelayMsFor(loadErrorInfo: LoadErrorHandlingPolicy.LoadErrorInfo): Long {
            val attempt = loadErrorInfo.errorCount.coerceAtLeast(1)
            return if (isLive) (attempt * 800L).coerceAtMost(3_000L) else (attempt * 1_500L).coerceAtMost(6_000L)
        }
        override fun getMinimumLoadableRetryCount(dataType: Int): Int = if (isLive) 8 else 5
    }

    return ExoPlayer.Builder(context)
        .setTrackSelector(trackSelector)
        .setLoadControl(if (isLive) liveLoadControl else vodLoadControl)
        .setLivePlaybackSpeedControl(
            DefaultLivePlaybackSpeedControl.Builder()
                .setFallbackMinPlaybackSpeed(0.98f)
                .setFallbackMaxPlaybackSpeed(1.02f)
                .setTargetLiveOffsetIncrementOnRebufferMs(2_500)
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
            addListener(object : Player.Listener {
                override fun onIsPlayingChanged(isPlaying: Boolean) = onIsPlayingChanged(isPlaying)
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
                val mediaItem = buildPlayableMediaItem(request, item, isLive)
                setMediaItem(mediaItem, if (isLive) C.TIME_UNSET else item.watchPositionMs.coerceAtLeast(0))
                playWhenReady = true
                prepare()
            }
        }
}

private fun buildPlayableMediaItem(request: StreamRequest, item: AppMediaItem, isLive: Boolean): MediaItem {
    val liveConfiguration = if (isLive) {
        MediaItem.LiveConfiguration.Builder()
            .setTargetOffsetMs(5_000)
            .setMinPlaybackSpeed(0.97f)
            .setMaxPlaybackSpeed(1.03f)
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
        normalized.endsWith(".mp4") || normalized.endsWith(".m4v") || normalized.endsWith(".mov") -> MimeTypes.VIDEO_MP4
        normalized.endsWith(".mkv") -> MimeTypes.VIDEO_MATROSKA
        normalized.endsWith(".webm") -> MimeTypes.VIDEO_WEBM
        normalized.endsWith(".avi") -> MimeTypes.VIDEO_MP4
        normalized.endsWith(".flv") || normalized.endsWith(".f4v") -> "video/x-flv"
        normalized.endsWith(".ogg") || normalized.endsWith(".ogv") -> "video/ogg"
        normalized.endsWith(".3gp") || normalized.endsWith(".3g2") -> "video/3gpp"
        else -> null
    }
}

internal fun shouldFallbackToLibVlc(error: PlaybackException): Boolean {
    return shouldFallbackToLibVlc(error.errorCode, error.cause)
}

internal fun shouldFallbackToLibVlc(errorCode: Int, cause: Throwable?): Boolean {
    return cause is ParserException ||
        errorCode == PlaybackException.ERROR_CODE_PARSING_CONTAINER_MALFORMED ||
        errorCode == PlaybackException.ERROR_CODE_PARSING_MANIFEST_MALFORMED ||
        errorCode == PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS ||
        errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED ||
        errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT ||
        errorCode == PlaybackException.ERROR_CODE_DECODING_FAILED ||
        errorCode == PlaybackException.ERROR_CODE_DECODER_INIT_FAILED
}

internal fun livePlaybackFailureMessage(): String =
    "توقف البث المباشر مؤقتًا. جرّب إعادة المحاولة أو افتحه في مشغل خارجي."

private fun explainPlaybackError(
    context: Context,
    error: PlaybackException,
    uri: String,
    isLive: Boolean,
): String {
    val cause = error.cause
    return when {
        !context.hasInternetConnection() -> "لا يوجد اتصال إنترنت متاح حاليًا."
        cause is HttpDataSource.InvalidResponseCodeException && cause.responseCode in 300..399 ->
            "الرابط يعيد تحويلات كثيرة أو غير متوافقة مع البث."
        cause is HttpDataSource.InvalidResponseCodeException && cause.responseCode == 401 ->
            "الخادم رفض الوصول إلى البث. قد يحتاج الرابط إلى صلاحية أو Headers خاصة."
        cause is HttpDataSource.InvalidResponseCodeException && cause.responseCode == 403 ->
            "الخادم منع تشغيل هذا الرابط على المشغل الداخلي."
        cause is HttpDataSource.InvalidResponseCodeException && cause.responseCode == 404 ->
            "الرابط لا يعمل أو لم يعد موجودًا على الخادم."
        cause is SocketTimeoutException ->
            if (isLive) "الخادم بطيء جدًا أو القناة لا تستجيب في الوقت الحالي." else "انتهت مهلة الاتصال أثناء تحميل الفيديو."
        cause is ConnectException -> "تعذر الاتصال بالخادم. تحقق من الرابط أو الشبكة."
        cause is ParserException -> "صيغة البث غير مدعومة أو بيانات البث تالفة."
        error.errorCode == PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS -> "الخادم أعاد استجابة غير صالحة لهذا البث."
        error.errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED -> "فشل الاتصال بخادم البث."
        error.errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT -> "انتهت مهلة الاتصال بخادم البث."
        error.errorCode == PlaybackException.ERROR_CODE_PARSING_CONTAINER_MALFORMED -> "ملف الوسائط أو الحاوية غير مدعومين بشكل صحيح."
        else -> "تعذر تشغيل الرابط الحالي داخل Media3. جرّب إعادة المحاولة أو فتحه في VLC أو MX Player. (${uri.safeStreamLabel()})"
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
        val chooser = Intent.createChooser(baseIntent, "اختر مشغل فيديو")
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return try {
            context.startActivity(chooser)
            ExternalLaunchResult(true, "تم فتح المشغل الخارجي.")
        } catch (_: ActivityNotFoundException) {
            ExternalLaunchResult(false, "لا يوجد أي مشغل فيديو خارجي مثبت على الجهاز.")
        }
    }

    packageNames.forEach { packageName ->
        try {
            context.packageManager.getPackageInfo(packageName, 0)
            context.startActivity(Intent(baseIntent).setPackage(packageName))
            return ExternalLaunchResult(true, "تم فتح $title في المشغل الخارجي.")
        } catch (_: Exception) {
        }
    }

    return ExternalLaunchResult(
        success = false,
        message = when (route) {
            "vlc" -> "تطبيق VLC غير مثبت. يمكنك تثبيته أو استخدام Media3 أو مشغل خارجي آخر."
            "mx" -> "تطبيق MX Player غير مثبت. يمكنك تثبيته أو استخدام Media3 أو مشغل خارجي آخر."
            else -> "تعذر فتح المشغل الخارجي المطلوب."
        },
    )
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
