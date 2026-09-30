package com.moalfarras.moplayer.ui.player

import android.net.Uri
import android.os.SystemClock
import android.view.TextureView
import android.view.ViewGroup
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.media3.ui.AspectRatioFrameLayout
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.interfaces.IMedia
import java.util.concurrent.atomic.AtomicBoolean

private const val LIBVLC_LIVE_CACHE_MS = 900
private const val LIBVLC_FILE_CACHE_MS = 2_000

/** An explicit play or pause request for LibVLC (a toggle could invert when events race). */
internal data class VlcTransportCommand(val seq: Int, val play: Boolean)

@Composable
internal fun LibVlcPlayerView(
    request: StreamRequest,
    title: String,
    resizeMode: Int,
    retryNonce: Int,
    transport: VlcTransportCommand?,
    onBuffering: (Boolean) -> Unit,
    onPlaying: () -> Unit,
    onVideoOutput: () -> Unit,
    onAudioOnly: () -> Unit,
    onPaused: () -> Unit,
    onEndReached: () -> Unit,
    onError: () -> Unit,
    externalSubtitlePath: String?,
    externalSubtitleNonce: Int,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val libVlc = remember {
        LibVLC(
            context,
            arrayListOf(
                "--network-caching=$LIBVLC_LIVE_CACHE_MS",
                "--live-caching=$LIBVLC_LIVE_CACHE_MS",
                "--file-caching=$LIBVLC_FILE_CACHE_MS",
                "--avcodec-fast",
                "--audio-resampler=soxr",
            ),
        )
    }
    val mediaPlayer = remember { MediaPlayer(libVlc) }
    val uiScope = rememberCoroutineScope()
    var videoTexture by remember { mutableStateOf<TextureView?>(null) }
    // Single source of truth for native teardown. Once the player/libVlc are released, no other
    // effect may call into them again — a use-after-free on the LibVLC native objects is a hard
    // SIGSEGV that runCatching cannot catch and takes the whole app down.
    val released = remember { AtomicBoolean(false) }
    // What the viewer wants (play/pause), independent of transient engine states.
    val wantsPlay = remember { AtomicBoolean(true) }
    // Commands issued before this view existed belong to a previous engine instance.
    val initialTransportSeq = remember { transport?.seq ?: 0 }

    val currentOnBuffering by rememberUpdatedState(onBuffering)
    val currentOnPlaying by rememberUpdatedState(onPlaying)
    val currentOnVideoOutput by rememberUpdatedState(onVideoOutput)
    val currentOnAudioOnly by rememberUpdatedState(onAudioOnly)
    val currentOnPaused by rememberUpdatedState(onPaused)
    val currentOnEndReached by rememberUpdatedState(onEndReached)
    val currentOnError by rememberUpdatedState(onError)

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
        var sawVideoEs = false
        var playingSince = 0L
        var audioOnlyReported = false
        var audioOnlyCheckPending = false
        currentOnBuffering(true)
        // Guard against IllegalStateException("Can't set view when already attached") on some
        // devices: the AWindow keeps its previous surface state across recompositions, so detach
        // and clear the view before attaching the new texture.
        val vlcOut = mediaPlayer.vlcVout
        val attachOutcome = runCatching {
            runCatching { vlcOut.detachViews() }
            runCatching { mediaPlayer.detachViews() }
            vlcOut.setVideoView(attachedTexture)
            vlcOut.attachViews()
        }
        if (attachOutcome.isFailure) {
            currentOnError()
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
                MediaPlayer.Event.Buffering -> uiScope.launchMainIfActive({ activeSession }) { currentOnBuffering(event.buffering < 100f) }
                MediaPlayer.Event.Playing -> {
                    if (playingSince == 0L) playingSince = SystemClock.uptimeMillis()
                    uiScope.launchMainIfActive({ activeSession }) { currentOnPlaying() }
                }
                MediaPlayer.Event.ESAdded -> if (event.esChangedType == IMedia.Track.Type.Video) sawVideoEs = true
                MediaPlayer.Event.Vout -> if (event.voutCount > 0) {
                    uiScope.launchMainIfActive({ activeSession }) { currentOnVideoOutput() }
                }
                MediaPlayer.Event.TimeChanged -> {
                    // Radio/audio-only channels never produce a Vout; report them once the demuxer
                    // had time to add a late video ES, so the no-video recovery leaves them alone.
                    if (!audioOnlyReported && !audioOnlyCheckPending && !sawVideoEs && playingSince > 0L &&
                        SystemClock.uptimeMillis() - playingSince >= 1_800L
                    ) {
                        audioOnlyCheckPending = true
                        uiScope.launchMainIfActive({ activeSession && !released.get() }) {
                            audioOnlyCheckPending = false
                            val videoTracks = runCatching { mediaPlayer.videoTracksCount }.getOrDefault(-1)
                            val audioTracks = runCatching { mediaPlayer.audioTracksCount }.getOrDefault(0)
                            if (libVlcLooksAudioOnly(sawVideoEs, SystemClock.uptimeMillis() - playingSince, videoTracks, audioTracks)) {
                                audioOnlyReported = true
                                currentOnAudioOnly()
                            }
                        }
                    }
                }
                MediaPlayer.Event.Paused, MediaPlayer.Event.Stopped -> uiScope.launchMainIfActive({ activeSession }) { currentOnPaused() }
                MediaPlayer.Event.EndReached -> uiScope.launchMainIfActive({ activeSession }) { currentOnEndReached() }
                MediaPlayer.Event.EncounteredError -> uiScope.launchMainIfActive({ activeSession }) {
                    currentOnBuffering(true)
                    currentOnError()
                }
            }
        }
        // Every (re)open — new stream, retry, reconnect — is an explicit request to play.
        wantsPlay.set(true)
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

    // Keep playing behind pause-only interruptions (Google TV side panel, dialogs); stop when the
    // app is really hidden and restart on return if the viewer had not paused.
    DisposableEffect(lifecycleOwner, mediaPlayer) {
        var resumeOnStart = false
        val observer = LifecycleEventObserver { _, event ->
            if (released.get()) return@LifecycleEventObserver
            when (event) {
                Lifecycle.Event.ON_STOP -> {
                    resumeOnStart = wantsPlay.get()
                    runCatching { mediaPlayer.stop() }
                    currentOnPaused()
                }
                Lifecycle.Event.ON_START -> {
                    if (resumeOnStart) {
                        currentOnBuffering(true)
                        runCatching { mediaPlayer.play() }
                    }
                    resumeOnStart = false
                }
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(transport?.seq) {
        val command = transport ?: return@LaunchedEffect
        if (command.seq <= initialTransportSeq || released.get()) return@LaunchedEffect
        wantsPlay.set(command.play)
        runCatching { if (command.play) mediaPlayer.play() else mediaPlayer.pause() }
    }

    // Apply a user-imported external subtitle to the live LibVLC player (no rebuild). Guarded so a
    // failure is a silent no-op, never a native crash during teardown.
    LaunchedEffect(externalSubtitleNonce) {
        if (externalSubtitleNonce == 0 || released.get()) return@LaunchedEffect
        val path = externalSubtitlePath ?: return@LaunchedEffect
        runCatching {
            mediaPlayer.addSlave(IMedia.Slave.Type.Subtitle, Uri.parse(path), true)
        }
    }

    AndroidView(
        factory = { viewContext ->
            TextureView(viewContext).apply {
                layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
                minimumWidth = 1
                minimumHeight = 1
                keepScreenOn = true
                isOpaque = true
                post { videoTexture = this }
            }
        },
        update = { layout ->
            if (layout.layoutParams?.width != ViewGroup.LayoutParams.MATCH_PARENT ||
                layout.layoutParams?.height != ViewGroup.LayoutParams.MATCH_PARENT
            ) {
                layout.layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            }
            if (!released.get()) {
                if (layout.width > 0 && layout.height > 0) {
                    runCatching { mediaPlayer.vlcVout.setWindowSize(layout.width, layout.height) }
                }
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
            }
            layout.keepScreenOn = true
            layout.requestLayout()
        },
        modifier = modifier,
    )
}

private fun CoroutineScope.launchMainIfActive(isActiveSession: () -> Boolean, block: () -> Unit) {
    if (!isActiveSession()) return
    launch {
        withContext(Dispatchers.Main.immediate) {
            if (isActiveSession()) block()
        }
    }
}
