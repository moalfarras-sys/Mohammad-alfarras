package com.moalfarras.moplayer.ui.player

import android.media.AudioManager
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.TextureView
import android.view.View
import android.view.ViewGroup
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.media3.common.C
import androidx.media3.ui.AspectRatioFrameLayout
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.interfaces.IMedia
import java.util.concurrent.atomic.AtomicBoolean

/** An explicit play or pause request for LibVLC (a toggle could invert when events race). */
internal data class VlcTransportCommand(val seq: Int, val play: Boolean)

/** Events of the LibVLC player, all delivered on the main thread. */
internal class LibVlcCallbacks(
    val onBuffering: (Boolean) -> Unit,
    val onPlaying: () -> Unit,
    val onVideoOutput: () -> Unit,
    val onAudioOnly: () -> Unit,
    val onPaused: () -> Unit,
    /** Position, length and seekability, at most every 500 ms (immediately when length/seekability change). */
    val onTimeline: (timeMs: Long, lengthMs: Long, seekable: Boolean) -> Unit,
    /** The app went to the background: the last [onTimeline] values are final for now. */
    val onStopped: () -> Unit,
    /** VOD: whether the stream ended at its known length (true) or was cut off early. */
    val onEndReached: (reachedEnd: Boolean) -> Unit,
    val onError: () -> Unit,
)

/** One selectable LibVLC track (id -1 means "off" for subtitles). */
internal class VlcTrack(val id: Int, val name: String)

/**
 * Commands PlayerScreen sends to the LibVLC view on screen. Calls are no-ops while no view is
 * bound; results arrive on the main thread.
 */
internal class LibVlcController {
    internal interface Commands {
        fun seekTo(positionMs: Long)
        fun loadTracks(trackType: Int, onResult: (tracks: List<VlcTrack>, selectedId: Int) -> Unit)
        fun selectTrack(trackType: Int, id: Int)
    }

    internal var target: Commands? = null

    fun seekTo(positionMs: Long) {
        target?.seekTo(positionMs)
    }

    fun loadTracks(trackType: Int, onResult: (tracks: List<VlcTrack>, selectedId: Int) -> Unit) {
        target?.loadTracks(trackType, onResult)
    }

    fun selectTrack(trackType: Int, id: Int) {
        target?.selectTrack(trackType, id)
    }
}

/** Per-view state shared by the effects and callbacks (never read by composition). */
private class VlcViewState(val initialTransportSeq: Int) {
    /** Once set, no code path may call into the native player again (a use-after-free is a SIGSEGV). */
    val released = AtomicBoolean(false)

    /** The native player once created (callbacks registered before that must not capture a stale null). */
    var player: MediaPlayer? = null
    var texture: TextureView? = null

    /** What the viewer wants (play/pause), independent of transient engine states. */
    val wantsPlay = AtomicBoolean(true)

    /** Stopped in the background; the next play request must re-open the media, not resume it. */
    var needsReopen = false
    var resumeOnFocusGain = false
    var attachedTexture: TextureView? = null
    var timeMs = 0L
    var lengthMs = 0L
    var seekable = false
    var lastTimelineAt = 0L
    var lastSizing: Triple<Int, Int, Int>? = null
}

/**
 * LibVLC engine view (fallback and legacy containers). The native player lives as long as this
 * view; every stream change, retry or re-open is a new session on it. Native calls run on a
 * [VlcWorker] thread in order; only view attach/detach and listener changes happen on main.
 */
@Composable
internal fun LibVlcPlayerView(
    request: StreamRequest,
    title: String,
    isLive: Boolean,
    weakDevice: Boolean,
    maxVideoHeight: Int,
    deinterlace: Boolean,
    startPositionMs: Long,
    resizeMode: Int,
    retryNonce: Int,
    transport: VlcTransportCommand?,
    controller: LibVlcController,
    callbacks: LibVlcCallbacks,
    externalSubtitlePath: String?,
    externalSubtitleNonce: Int,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cb by rememberUpdatedState(callbacks)
    val currentStartPositionMs by rememberUpdatedState(startPositionMs)
    val currentResizeMode by rememberUpdatedState(resizeMode)
    val currentIsLive by rememberUpdatedState(isLive)
    val state = remember { VlcViewState(transport?.seq ?: 0) }
    val worker = remember { VlcWorker() }
    val mainHandler = remember { Handler(Looper.getMainLooper()) }
    var videoTexture by remember { mutableStateOf<TextureView?>(null) }
    var reopenKey by remember { mutableIntStateOf(0) }

    // The process-wide LibVLC is created off the main thread (its first creation loads every plugin).
    val libVlc by produceState<LibVLC?>(VlcCore.peek()) {
        if (value == null) {
            value = withContext(Dispatchers.Default) {
                runCatching { VlcCore.get(context) }.getOrNull()
            }
            if (value == null) cb.onError()
        }
    }
    val player = remember(libVlc) { libVlc?.let { MediaPlayer(it) } }

    val focus = remember {
        VlcAudioFocus(context) { change ->
            val p = state.player
            if (p == null || state.released.get()) return@VlcAudioFocus
            when (change) {
                AudioManager.AUDIOFOCUS_LOSS -> {
                    // Another app took the audio for good: pause and wait for the viewer.
                    state.resumeOnFocusGain = false
                    state.wantsPlay.set(false)
                    worker.run { if (!state.released.get()) p.pause() }
                    cb.onPaused()
                }
                AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                    state.resumeOnFocusGain = state.wantsPlay.get()
                    worker.run { if (!state.released.get()) p.pause() }
                }
                AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> worker.run { if (!state.released.get()) p.setVolume(30) }
                AudioManager.AUDIOFOCUS_GAIN -> {
                    worker.run { if (!state.released.get()) p.setVolume(100) }
                    if (state.resumeOnFocusGain) {
                        state.resumeOnFocusGain = false
                        // A paused live stream is stale (and paused HLS can break LibVLC): re-open at the edge.
                        if (currentIsLive) reopenKey++ else worker.run { if (!state.released.get()) p.play() }
                    }
                }
            }
        }
    }

    fun emitTimeline(force: Boolean) {
        val now = SystemClock.uptimeMillis()
        if (!force && now - state.lastTimelineAt < 500L) return
        state.lastTimelineAt = now
        cb.onTimeline(state.timeMs, state.lengthMs, state.seekable)
    }

    fun applySizing(force: Boolean) = applyLibVlcSizing(state, worker, currentResizeMode, force)

    // Registered first so it is disposed last: every other effect has let go of the player by then.
    DisposableEffect(player) {
        val p = player ?: return@DisposableEffect onDispose { }
        state.player = p
        val commands = object : LibVlcController.Commands {
            override fun seekTo(positionMs: Long) {
                worker.run {
                    if (state.released.get() || !p.isSeekable) return@run
                    val length = p.length
                    p.setTime(if (length > 0) positionMs.coerceIn(0L, (length - 1_000L).coerceAtLeast(0L)) else positionMs.coerceAtLeast(0L))
                }
            }

            override fun loadTracks(trackType: Int, onResult: (tracks: List<VlcTrack>, selectedId: Int) -> Unit) {
                worker.run {
                    if (state.released.get()) return@run
                    val (descriptions, selected) = when (trackType) {
                        C.TRACK_TYPE_AUDIO -> p.audioTracks to p.audioTrack
                        C.TRACK_TYPE_TEXT -> p.spuTracks to p.spuTrack
                        else -> p.videoTracks to p.videoTrack
                    }
                    val tracks = descriptions.orEmpty()
                        // The picture itself is never offered as "Disable".
                        .filter { trackType == C.TRACK_TYPE_TEXT || it.id >= 0 }
                        .map { VlcTrack(it.id, it.name.orEmpty()) }
                    mainHandler.post { if (!state.released.get()) onResult(tracks, selected) }
                }
            }

            override fun selectTrack(trackType: Int, id: Int) {
                worker.run {
                    if (state.released.get()) return@run
                    when (trackType) {
                        C.TRACK_TYPE_AUDIO -> p.setAudioTrack(id)
                        C.TRACK_TYPE_TEXT -> p.setSpuTrack(id)
                        else -> p.setVideoTrack(id)
                    }
                }
            }
        }
        controller.target = commands
        onDispose {
            if (controller.target === commands) controller.target = null
            if (state.released.compareAndSet(false, true)) {
                runCatching { p.setEventListener(null) }
                // AWindow is main-thread only; detaching first makes the native release's own detach a no-op.
                runCatching { p.vlcVout.detachViews() }
                focus.abandon()
                worker.finish {
                    p.stop()
                    p.release()
                }?.let(VlcCore::trackTeardown)
            }
        }
    }

    // The video view is attached once and stays attached across streams and retries.
    DisposableEffect(player, videoTexture) {
        val p = player
        val texture = videoTexture
        state.texture = texture
        if (p != null && texture != null && !state.released.get() && state.attachedTexture !== texture) {
            val attached = runCatching {
                if (state.attachedTexture != null) p.vlcVout.detachViews()
                p.vlcVout.setVideoView(texture)
                p.vlcVout.attachViews()
            }.isSuccess
            state.attachedTexture = if (attached) texture else null
            state.lastSizing = null
            if (attached) applySizing(force = true) else cb.onError()
        }
        onDispose { }
    }

    DisposableEffect(player, videoTexture, request.uri, retryNonce, reopenKey) {
        val p = player
        val lib = libVlc
        if (p == null || lib == null || state.attachedTexture == null || state.released.get()) {
            return@DisposableEffect onDispose { }
        }
        val session = VlcSessionFlags()
        state.timeMs = 0L
        state.lengthMs = 0L
        state.seekable = false
        state.needsReopen = false
        cb.onBuffering(true)
        val startAt = if (isLive) 0L else currentStartPositionMs
        val options = libVlcMediaOptions(
            LibVlcMediaConfig(
                isLive = isLive,
                isManifest = request.isManifest(),
                weakDevice = weakDevice,
                cpuCores = Runtime.getRuntime().availableProcessors(),
                startPositionMs = startAt,
                userAgent = request.headers["User-Agent"] ?: APP_USER_AGENT,
                referer = request.headers["Referer"],
                deinterlace = deinterlace,
                maxVideoHeight = maxVideoHeight,
                title = title,
            ),
        )
        val media = runCatching {
            Media(lib, Uri.parse(uriWithBasicCredentials(request.uri, request.headers))).apply {
                options.forEach(::addOption)
                setHWDecoderEnabled(true, false)
            }
        }.getOrElse {
            cb.onError()
            return@DisposableEffect onDispose { }
        }
        session.pendingStartMs = if (startAt >= LIBVLC_MIN_RESUME_MS) startAt else 0L
        val listener = MediaPlayer.EventListener { event ->
            if (!session.active) return@EventListener
            when (event.type) {
                MediaPlayer.Event.Buffering -> cb.onBuffering(event.buffering < 100f)
                MediaPlayer.Event.Playing -> {
                    if (session.playingSince == 0L) session.playingSince = SystemClock.uptimeMillis()
                    cb.onPlaying()
                }
                MediaPlayer.Event.ESAdded -> if (event.esChangedType == IMedia.Track.Type.Video) session.sawVideoEs = true
                MediaPlayer.Event.ESSelected -> if (event.esChangedType == IMedia.Track.Type.Video) applySizing(force = true)
                MediaPlayer.Event.Vout -> if (event.voutCount > 0) {
                    cb.onVideoOutput()
                    applySizing(force = true)
                }
                MediaPlayer.Event.LengthChanged -> {
                    state.lengthMs = event.lengthChanged
                    emitTimeline(force = true)
                }
                MediaPlayer.Event.SeekableChanged -> {
                    state.seekable = event.seekable
                    emitTimeline(force = true)
                }
                MediaPlayer.Event.TimeChanged -> {
                    state.timeMs = event.timeChanged
                    emitTimeline(force = false)
                    // Safety net for servers where :start-time is ignored: seek once the input runs.
                    val resumeAt = session.pendingStartMs
                    if (resumeAt > 0L && event.timeChanged > 0L) {
                        session.pendingStartMs = 0L
                        if (event.timeChanged < resumeAt - 10_000L) {
                            worker.run { if (!state.released.get() && session.active && p.isSeekable) p.setTime(resumeAt) }
                        }
                    }
                    checkAudioOnly(session, p, worker, mainHandler, state) { cb.onAudioOnly() }
                }
                MediaPlayer.Event.Paused, MediaPlayer.Event.Stopped -> cb.onPaused()
                MediaPlayer.Event.EndReached -> cb.onEndReached(libVlcReachedEnd(state.timeMs, state.lengthMs))
                MediaPlayer.Event.EncounteredError -> {
                    cb.onBuffering(true)
                    cb.onError()
                }
            }
        }
        // Every (re)open — new stream, retry, reconnect, return from Home — is a request to play.
        state.wantsPlay.set(true)
        focus.request()
        worker.run {
            if (state.released.get() || !session.active) {
                media.release()
                return@run
            }
            // Let an earlier player close its connection first (one-connection Xtream lines).
            VlcCore.awaitTeardowns(LIBVLC_TEARDOWN_WAIT_MS)
            p.setEventListener(null)
            // Closes the previous stream (and its socket) before the next one opens.
            p.stop()
            p.media = media
            media.release()
            if (!session.active || state.released.get()) return@run
            p.setEventListener(listener)
            p.play()
        }
        onDispose {
            session.active = false
            if (!state.released.get()) runCatching { p.setEventListener(null) }
        }
    }

    // Keep playing behind pause-only interruptions (Google TV side panel, dialogs; audio focus
    // handles the Assistant); stop when the app is really hidden and re-open on return.
    DisposableEffect(lifecycleOwner, player) {
        val p = player ?: return@DisposableEffect onDispose { }
        var reopenOnStart = false
        val observer = LifecycleEventObserver { _, event ->
            if (state.released.get()) return@LifecycleEventObserver
            when (event) {
                Lifecycle.Event.ON_STOP -> {
                    reopenOnStart = state.wantsPlay.get()
                    state.needsReopen = true
                    emitTimeline(force = true)
                    cb.onStopped()
                    focus.abandon()
                    worker.run { if (!state.released.get()) p.stop() }
                    cb.onPaused()
                }
                Lifecycle.Event.ON_START -> {
                    // stop() tore the input down: a VOD resumes from the saved position, live at the edge.
                    if (reopenOnStart) reopenKey++
                    reopenOnStart = false
                }
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(player, transport?.seq) {
        val p = player ?: return@LaunchedEffect
        val command = transport ?: return@LaunchedEffect
        if (command.seq <= state.initialTransportSeq || state.released.get()) return@LaunchedEffect
        state.wantsPlay.set(command.play)
        if (!command.play) {
            worker.run { if (!state.released.get()) p.pause() }
        } else if (state.needsReopen) {
            // play() after stop() would restart a VOD from the beginning.
            reopenKey++
        } else {
            focus.request()
            worker.run { if (!state.released.get()) p.play() }
        }
    }

    // Apply a user-imported external subtitle to the running player (no rebuild).
    LaunchedEffect(player, externalSubtitleNonce) {
        val p = player ?: return@LaunchedEffect
        if (externalSubtitleNonce == 0 || state.released.get()) return@LaunchedEffect
        val path = externalSubtitlePath ?: return@LaunchedEffect
        worker.run { if (!state.released.get()) p.addSlave(IMedia.Slave.Type.Subtitle, Uri.parse(path), true) }
    }

    AndroidView(
        factory = { viewContext ->
            TextureView(viewContext).apply {
                layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
                minimumWidth = 1
                minimumHeight = 1
                keepScreenOn = true
                isOpaque = true
                // PiP, rotation and the first real layout all change the size the picture must fit.
                addOnLayoutChangeListener(View.OnLayoutChangeListener { _, _, _, _, _, _, _, _, _ -> applySizing(force = false) })
                post { videoTexture = this }
            }
        },
        update = { view ->
            if (view.layoutParams?.width != ViewGroup.LayoutParams.MATCH_PARENT ||
                view.layoutParams?.height != ViewGroup.LayoutParams.MATCH_PARENT
            ) {
                view.layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            }
            view.keepScreenOn = true
            // Runs again whenever the viewer changes the picture size mode.
            applyLibVlcSizing(state, worker, resizeMode, force = false)
        },
        modifier = modifier,
    )
}

/**
 * Window size, aspect and scale for the current picture mode. Fit: best fit. Fill: stretched to
 * the view. Zoom: scaled relative to the video (see [libVlcFillScale]) so it fills the view and
 * crops the overflow. The native setters take the input lock, so they run on the worker.
 */
private fun applyLibVlcSizing(state: VlcViewState, worker: VlcWorker, mode: Int, force: Boolean) {
    val player = state.player ?: return
    val view = state.texture ?: return
    val width = view.width
    val height = view.height
    if (width <= 0 || height <= 0 || state.released.get()) return
    val key = Triple(width, height, mode)
    if (!force && key == state.lastSizing) return
    state.lastSizing = key
    worker.run {
        if (state.released.get()) return@run
        player.vlcVout.setWindowSize(width, height)
        when (mode) {
            AspectRatioFrameLayout.RESIZE_MODE_FILL -> {
                player.aspectRatio = "$width:$height"
                player.scale = 0f
            }
            AspectRatioFrameLayout.RESIZE_MODE_ZOOM -> {
                val track = player.currentVideoTrack
                player.aspectRatio = null
                player.scale = track?.let {
                    libVlcFillScale(width, height, it.width, it.height, it.sarNum, it.sarDen, it.orientation)
                } ?: 0f
            }
            else -> {
                player.aspectRatio = null
                player.scale = 0f
            }
        }
    }
}

/** Flags of one LibVLC session (one media on the player); stale events check [active]. */
private class VlcSessionFlags {
    @Volatile
    var active = true
    var sawVideoEs = false
    var playingSince = 0L
    var audioOnlyReported = false
    var audioOnlyCheckPending = false
    var pendingStartMs = 0L
}

/**
 * Radio/audio-only channels never produce a Vout; report them once the demuxer had time to add a
 * late video ES, so the no-video recovery leaves them alone. The track counts are read on the
 * worker thread (they take the input lock).
 */
private fun checkAudioOnly(
    session: VlcSessionFlags,
    player: MediaPlayer,
    worker: VlcWorker,
    mainHandler: Handler,
    state: VlcViewState,
    onAudioOnly: () -> Unit,
) {
    if (session.audioOnlyReported || session.audioOnlyCheckPending || session.sawVideoEs || session.playingSince == 0L) return
    if (SystemClock.uptimeMillis() - session.playingSince < 1_800L) return
    session.audioOnlyCheckPending = true
    worker.run {
        if (state.released.get() || !session.active) return@run
        val videoTracks = player.videoTracksCount
        val audioTracks = player.audioTracksCount
        mainHandler.post {
            session.audioOnlyCheckPending = false
            if (!session.active || session.audioOnlyReported) return@post
            if (libVlcLooksAudioOnly(session.sawVideoEs, SystemClock.uptimeMillis() - session.playingSince, videoTracks, audioTracks)) {
                session.audioOnlyReported = true
                onAudioOnly()
            }
        }
    }
}
