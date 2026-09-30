@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package com.moalfarras.moplayer.ui.player

import android.os.Build
import android.view.KeyEvent as AndroidKeyEvent
import androidx.media3.common.C
import androidx.media3.common.MimeTypes
import androidx.media3.common.ParserException
import androidx.media3.common.PlaybackException
import androidx.media3.datasource.HttpDataSource
import androidx.media3.exoplayer.source.UnrecognizedInputFormatException
import androidx.media3.extractor.ts.DefaultTsPayloadReaderFactory
import com.moalfarras.moplayer.core.PerformancePolicy
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem as AppMediaItem
import com.moalfarras.moplayer.ui.i18n.PlayerStrings
import com.moalfarras.moplayer.ui.i18n.fill
import com.moalfarras.moplayer.ui.i18n.ltr
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.URLDecoder
import java.net.UnknownHostException
import java.nio.charset.StandardCharsets
import java.util.LinkedHashMap
import java.util.Locale
import java.util.concurrent.TimeUnit

// Pure playback decisions for PlayerScreen. Everything here is free of Compose and of a live
// player instance so it can be unit-tested on the JVM (see PlayerScreenLiveTest).

internal const val LIVE_STALL_RECOVERY_LIMIT = 4
internal const val LIVE_AUTO_RECOVERY_SWITCH_LIMIT = 2
internal const val MEDIA3_SURFACE_RETRY_LIMIT = 2
internal const val VOD_EXTENSION_FALLBACK_LIMIT = 2
private const val LIVE_NO_VIDEO_FAST_MS = 2_200L
private const val LIVE_NO_VIDEO_DEFAULT_MS = 3_200L
private const val VOD_NO_VIDEO_FAST_MS = 3_500L
private const val VOD_NO_VIDEO_DEFAULT_MS = 5_000L

/** Mid-stream rebuffering longer than this is treated as a dropped connection and reconnected in place. */
internal const val LIVE_MIDSTREAM_STALL_MS = 10_000L

/** How long in-place live reconnects keep trying (while the network is up) before the error card shows. */
internal const val LIVE_RECONNECT_WINDOW_MS = 120_000L

/**
 * In-place reopens a channel that was playing gets for a 401/403/404/410/451 before the error card.
 * Mid-stream these are usually transient: an expired HLS segment or token, or the panel still
 * counting the dropped connection against a one-connection line.
 */
internal const val LIVE_PERMANENT_RECONNECT_LIMIT = 3

/** Rapid channel presses inside this window only move the on-screen target; the latest one is tuned. */
internal const val ZAP_COALESCE_MS = 350L

/** Idle time after the last digit before a typed channel number is tuned. */
internal const val NUMBER_ENTRY_COMMIT_MS = 1_500L
internal const val NUMBER_ENTRY_MAX_DIGITS = 5

/** A live pause longer than this resumes at the live edge instead of the stale buffer. */
internal const val LIVE_PAUSE_JUMP_TO_EDGE_MS = 10_000L

/** HTTP statuses that no retry, engine switch or alternative URL can fix. */
internal val PERMANENT_HTTP_STATUSES = setOf(401, 403, 404, 410, 451)

enum class LiveQualityMode { AUTO, BEST, ULTRA, STABLE }

internal enum class InternalPlaybackEngine { MEDIA3, LIBVLC }

internal data class StreamRequest(
    val uri: String,
    val headers: Map<String, String>,
    val mimeType: String?,
)

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

// ── Playback problems ────────────────────────────────────────────────────────────────────────

/** What went wrong, in terms the viewer can act on. Rendered by [issueText]. */
internal enum class PlaybackIssueKind {
    NO_INTERNET,
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
    GONE,
    BLOCKED,
    SERVER_ERROR,
    TIMEOUT,
    CONNECT_FAILED,
    UNSUPPORTED_FORMAT,
    DECODER,
    REDIRECTS,
    LIVE_STOPPED,
    NO_VIDEO,
    VOD_NO_FRAMES,

    /** A VOD stream ended long before its known length (again after one automatic re-open). */
    VOD_INTERRUPTED,
    UNSTABLE,
    GENERIC,
}

internal data class PlaybackIssue(val kind: PlaybackIssueKind, val httpStatus: Int? = null) {
    /** Problems that may clear up on their own (network back, server recovered): auto-retry is sensible. */
    val isTransient: Boolean
        get() = kind in TRANSIENT_ISSUES
}

private val TRANSIENT_ISSUES = setOf(
    PlaybackIssueKind.NO_INTERNET,
    PlaybackIssueKind.SERVER_ERROR,
    PlaybackIssueKind.TIMEOUT,
    PlaybackIssueKind.CONNECT_FAILED,
    PlaybackIssueKind.LIVE_STOPPED,
    PlaybackIssueKind.VOD_INTERRUPTED,
    PlaybackIssueKind.UNSTABLE,
)

/** How a failure should be recovered. */
internal enum class PlaybackFailureClass {
    /** Auth/removed/blocked (401/403/404/410/451, no permission): fail fast, never hop engines or channels. */
    PERMANENT,

    /** The container, manifest or codec is the problem: another engine may play it. */
    FORMAT,

    /** Network, timeout or server-side hiccup: retry the same stream. */
    TRANSIENT,
}

/** First HTTP status found in the cause chain (Media3 wraps it in an InvalidResponseCodeException). */
internal fun httpStatusOf(cause: Throwable?): Int? {
    var current = cause
    while (current != null) {
        if (current is HttpDataSource.InvalidResponseCodeException) return current.responseCode
        current = current.cause
    }
    return null
}

private inline fun Throwable?.chainHas(predicate: (Throwable) -> Boolean): Boolean {
    var current = this
    while (current != null) {
        if (predicate(current)) return true
        current = current.cause
    }
    return false
}

internal fun Throwable?.hasUnrecognizedInputFormat(): Boolean = chainHas { it is UnrecognizedInputFormatException }

private fun isParsingError(errorCode: Int): Boolean = errorCode in 3000..3999

private fun isDecoderError(errorCode: Int): Boolean = errorCode in 4000..4999

/** Decoder failures are the only format problems a different video surface can fix. */
internal fun isDecoderFailure(errorCode: Int): Boolean = isDecoderError(errorCode)

internal fun classifyPlaybackFailure(errorCode: Int, httpStatus: Int?, cause: Throwable?): PlaybackFailureClass = when {
    httpStatus != null && httpStatus in PERMANENT_HTTP_STATUSES -> PlaybackFailureClass.PERMANENT
    errorCode == PlaybackException.ERROR_CODE_IO_FILE_NOT_FOUND ||
        errorCode == PlaybackException.ERROR_CODE_IO_NO_PERMISSION ||
        errorCode == PlaybackException.ERROR_CODE_IO_CLEARTEXT_NOT_PERMITTED -> PlaybackFailureClass.PERMANENT
    httpStatus != null && httpStatus in 300..399 -> PlaybackFailureClass.FORMAT
    cause.chainHas { it is ParserException } -> PlaybackFailureClass.FORMAT
    isParsingError(errorCode) || isDecoderError(errorCode) -> PlaybackFailureClass.FORMAT
    errorCode == PlaybackException.ERROR_CODE_IO_INVALID_HTTP_CONTENT_TYPE ||
        errorCode == PlaybackException.ERROR_CODE_AUDIO_TRACK_INIT_FAILED ||
        errorCode in 6000..6999 -> PlaybackFailureClass.FORMAT
    else -> PlaybackFailureClass.TRANSIENT
}

internal fun classifyPlaybackIssue(
    errorCode: Int,
    httpStatus: Int?,
    cause: Throwable?,
    online: Boolean,
    isLive: Boolean,
): PlaybackIssue = when {
    !online -> PlaybackIssue(PlaybackIssueKind.NO_INTERNET)
    httpStatus == 401 -> PlaybackIssue(PlaybackIssueKind.UNAUTHORIZED, 401)
    httpStatus == 403 -> PlaybackIssue(PlaybackIssueKind.FORBIDDEN, 403)
    httpStatus == 404 -> PlaybackIssue(PlaybackIssueKind.NOT_FOUND, 404)
    httpStatus == 410 -> PlaybackIssue(PlaybackIssueKind.GONE, 410)
    httpStatus == 451 -> PlaybackIssue(PlaybackIssueKind.BLOCKED, 451)
    httpStatus != null && httpStatus in 300..399 -> PlaybackIssue(PlaybackIssueKind.REDIRECTS, httpStatus)
    httpStatus != null -> PlaybackIssue(PlaybackIssueKind.SERVER_ERROR, httpStatus)
    cause.chainHas { it is SocketTimeoutException } ||
        errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT ||
        errorCode == PlaybackException.ERROR_CODE_TIMEOUT -> PlaybackIssue(PlaybackIssueKind.TIMEOUT)
    cause.chainHas { it is ConnectException || it is UnknownHostException } ||
        errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED -> PlaybackIssue(PlaybackIssueKind.CONNECT_FAILED)
    cause.chainHas { it is ParserException } || isParsingError(errorCode) ||
        errorCode == PlaybackException.ERROR_CODE_IO_INVALID_HTTP_CONTENT_TYPE -> PlaybackIssue(PlaybackIssueKind.UNSUPPORTED_FORMAT)
    isDecoderError(errorCode) || errorCode == PlaybackException.ERROR_CODE_AUDIO_TRACK_INIT_FAILED ->
        PlaybackIssue(PlaybackIssueKind.DECODER)
    errorCode == PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS -> PlaybackIssue(PlaybackIssueKind.SERVER_ERROR)
    isLive -> PlaybackIssue(PlaybackIssueKind.LIVE_STOPPED)
    else -> PlaybackIssue(PlaybackIssueKind.GENERIC)
}

/** Plain-language reason for the error card, with HTTP codes kept left-to-right inside Arabic text. */
internal fun PlayerStrings.issueText(issue: PlaybackIssue): String {
    val status = issue.httpStatus?.toString().orEmpty().ltr()
    return when (issue.kind) {
        PlaybackIssueKind.NO_INTERNET -> issueNoInternet
        PlaybackIssueKind.UNAUTHORIZED -> issueUnauthorized.fill(status)
        PlaybackIssueKind.FORBIDDEN -> issueForbidden.fill(status)
        PlaybackIssueKind.NOT_FOUND -> issueNotFound.fill(status)
        PlaybackIssueKind.GONE -> issueGone.fill(status)
        PlaybackIssueKind.BLOCKED -> issueBlocked.fill(status)
        PlaybackIssueKind.SERVER_ERROR -> issueServerError.fill(
            (issue.httpStatus?.let { "HTTP $it" } ?: "HTTP").ltr(),
        )
        PlaybackIssueKind.TIMEOUT -> issueTimeout
        PlaybackIssueKind.CONNECT_FAILED -> issueConnectFailed
        PlaybackIssueKind.UNSUPPORTED_FORMAT -> issueUnsupported
        PlaybackIssueKind.DECODER -> issueDecoder
        PlaybackIssueKind.REDIRECTS -> issueRedirects
        PlaybackIssueKind.LIVE_STOPPED -> issueLiveStopped
        PlaybackIssueKind.NO_VIDEO -> issueNoVideo
        PlaybackIssueKind.VOD_NO_FRAMES -> issueVodNoFrames
        PlaybackIssueKind.VOD_INTERRUPTED -> issueVodInterrupted
        PlaybackIssueKind.UNSTABLE -> issueUnstable
        PlaybackIssueKind.GENERIC -> issueGeneric
    }
}

/**
 * Loader retry delay for IPTV sources, or [C.TIME_UNSET] to fail the load now. Media3's own rule
 * (parser/cleartext/file-not-found are fatal) is applied by the caller before this.
 * Permanent HTTP statuses get exactly one quick retry, which absorbs the connection-limit race
 * right after a zap (the previous socket may still be closing) without hammering a dead link.
 */
internal fun iptvRetryDelayMs(isLive: Boolean, httpStatus: Int?, errorCount: Int): Long {
    val attempt = errorCount.coerceAtLeast(1)
    if (httpStatus != null && httpStatus in PERMANENT_HTTP_STATUSES) {
        return if (attempt <= 1) 750L else C.TIME_UNSET
    }
    if (attempt > 8) return C.TIME_UNSET
    return if (isLive) {
        (500L shl (attempt - 1).coerceAtMost(3)).coerceAtMost(3_000L)
    } else {
        (attempt * 1_000L).coerceAtMost(4_000L)
    }
}

internal fun iptvMinimumLoadableRetryCount(isLive: Boolean): Int = if (isLive) 4 else 3

/** Backoff for in-place live reconnects after a channel that was playing drops: 1, 2, 4, 8, then 15 s. */
internal fun liveReconnectDelayMs(attempt: Int): Long =
    (1_000L shl attempt.coerceIn(0, 4)).coerceAtMost(15_000L)

internal enum class LiveRecoveryStep {
    /** Re-open the same channel in the same engine (with backoff when it was already playing). */
    RECONNECT_IN_PLACE,

    /** A ".ts" link that really serves HLS: reopen it as HLS. */
    FORCE_HLS,

    /** Open the same Xtream channel once in its other container (.ts <-> .m3u8). */
    SWAP_FORMAT,

    /** Hand the same channel to the other engine (Media3 <-> LibVLC). */
    SWITCH_ENGINE,

    /** Rebuild Media3 on the other surface type (SurfaceView <-> TextureView). */
    ALTERNATE_SURFACE,

    /** Try a lower-quality copy of the SAME channel (same base title); the caller shows the error if none exists. */
    SIBLING_VARIANT,

    /** Stop and show the error card with Retry / Next channel / Back. */
    SHOW_ERROR,
}

/**
 * The next step after a live playback failure. A channel that was already playing is never moved
 * to another engine or channel for a network drop: it reconnects in place until the reconnect
 * window runs out. Permanent errors go straight to the error card when opening a channel (after
 * one try of the other Xtream format when [canSwapFormat]); a channel that was playing first gets
 * [LIVE_PERMANENT_RECONNECT_LIMIT] in-place reopens. [canSwapFormat] is only true at startup.
 */
internal fun liveErrorRecoveryStep(
    failure: PlaybackFailureClass,
    wasPlaying: Boolean,
    reconnectWindowExpired: Boolean,
    startupRetryAvailable: Boolean,
    canForceHls: Boolean,
    canSwitchEngine: Boolean,
    canRetrySurface: Boolean,
    permanentReconnectAvailable: Boolean,
    canSwapFormat: Boolean = false,
): LiveRecoveryStep = when (failure) {
    PlaybackFailureClass.PERMANENT -> when {
        wasPlaying && permanentReconnectAvailable && !reconnectWindowExpired -> LiveRecoveryStep.RECONNECT_IN_PLACE
        // A 404/410 for one container: panels that list m3u8 do not always generate HLS for every channel.
        canSwapFormat -> LiveRecoveryStep.SWAP_FORMAT
        else -> LiveRecoveryStep.SHOW_ERROR
    }
    PlaybackFailureClass.TRANSIENT -> when {
        wasPlaying -> if (reconnectWindowExpired) LiveRecoveryStep.SHOW_ERROR else LiveRecoveryStep.RECONNECT_IN_PLACE
        startupRetryAvailable -> LiveRecoveryStep.RECONNECT_IN_PLACE
        canSwapFormat -> LiveRecoveryStep.SWAP_FORMAT
        canSwitchEngine -> LiveRecoveryStep.SWITCH_ENGINE
        else -> LiveRecoveryStep.SIBLING_VARIANT
    }
    PlaybackFailureClass.FORMAT -> when {
        canForceHls -> LiveRecoveryStep.FORCE_HLS
        canSwapFormat -> LiveRecoveryStep.SWAP_FORMAT
        canSwitchEngine -> LiveRecoveryStep.SWITCH_ENGINE
        canRetrySurface -> LiveRecoveryStep.ALTERNATE_SURFACE
        else -> LiveRecoveryStep.SIBLING_VARIANT
    }
}

// ── Audio-only (radio) streams ───────────────────────────────────────────────────────────────

/** Media3: decide only on resolved tracks; empty tracks (stop/prepare in progress) are not evidence. */
internal fun isAudioOnlyTracks(tracksEmpty: Boolean, hasVideo: Boolean, hasAudio: Boolean): Boolean =
    !tracksEmpty && hasAudio && !hasVideo

/** LibVLC adds the video ES late on adaptive streams, so wait a grace period after "Playing". */
internal fun libVlcLooksAudioOnly(sawVideoEs: Boolean, msSincePlaying: Long, videoTracks: Int, audioTracks: Int): Boolean =
    !sawVideoEs && msSincePlaying >= 1_800L && videoTracks == 0 && audioTracks > 0

// ── Remote keys, zapping and channel numbers ────────────────────────────────────────────────

/**
 * Zap direction for a remote key. CH+/P+ always goes to the next (higher) channel, as on every TV;
 * D-pad Up/Down follow the on-screen channel list (Up = the row above).
 */
internal fun liveZapDirectionForKeyCode(keyCode: Int): Int = when (keyCode) {
    AndroidKeyEvent.KEYCODE_CHANNEL_UP -> 1
    AndroidKeyEvent.KEYCODE_CHANNEL_DOWN -> -1
    AndroidKeyEvent.KEYCODE_DPAD_UP -> -1
    AndroidKeyEvent.KEYCODE_DPAD_DOWN -> 1
    else -> 0
}

internal fun digitForKeyCode(keyCode: Int): Int? = when (keyCode) {
    in AndroidKeyEvent.KEYCODE_0..AndroidKeyEvent.KEYCODE_9 -> keyCode - AndroidKeyEvent.KEYCODE_0
    in AndroidKeyEvent.KEYCODE_NUMPAD_0..AndroidKeyEvent.KEYCODE_NUMPAD_9 -> keyCode - AndroidKeyEvent.KEYCODE_NUMPAD_0
    else -> null
}

internal fun Int.floorMod(size: Int): Int = ((this % size) + size) % size

internal fun liveZapTargetIndex(currentIndex: Int, direction: Int, size: Int): Int? {
    if (size <= 0 || currentIndex !in 0 until size || direction == 0) return null
    return (currentIndex + direction).floorMod(size)
}

private const val MAX_PROVIDER_CHANNEL_NUMBER = 99_999

/**
 * True when every channel carries a distinct provider number (Xtream `num`, M3U `tvg-chno`).
 * Lists without real numbers store the list index instead (starting at 0), which fails this test,
 * so they are numbered by position.
 */
internal fun usesProviderChannelNumbers(items: List<AppMediaItem>): Boolean {
    if (items.isEmpty()) return false
    val seen = HashSet<Int>(items.size * 2)
    for (item in items) {
        if (item.serverOrder !in 1..MAX_PROVIDER_CHANNEL_NUMBER || !seen.add(item.serverOrder)) return false
    }
    return true
}

internal fun liveChannelNumber(item: AppMediaItem, indexInList: Int, providerNumbers: Boolean): Int? = when {
    providerNumbers && item.serverOrder in 1..MAX_PROVIDER_CHANNEL_NUMBER -> item.serverOrder
    indexInList >= 0 -> indexInList + 1
    else -> null
}

/** The channel a typed number refers to: the provider number when the list has them, else the Nth entry. */
internal fun resolveChannelNumber(items: List<AppMediaItem>, number: Int, providerNumbers: Boolean): AppMediaItem? {
    if (number <= 0) return null
    return if (providerNumbers) {
        items.firstOrNull { it.serverOrder == number }
    } else {
        items.getOrNull(number - 1)
    }
}

internal fun formatChannelNumber(number: Int): String =
    if (number in 0..999) String.format(Locale.ROOT, "%03d", number) else number.toString()

// ── VOD seeking ──────────────────────────────────────────────────────────────────────────────

/**
 * Target of one seek step. Held keys accelerate (1x for ~0.4 s of auto-repeat, then 2x/4x/8x);
 * discrete presses and button clicks stay linear. Stops 2 s short of the end so a scrub never
 * lands on STATE_ENDED by accident.
 */
internal fun vodSeekTarget(baseMs: Long, stepMs: Long, repeatCount: Int, durationMs: Long?): Long {
    val shift = if (repeatCount > 0) (repeatCount / 8).coerceAtMost(3) else 0
    val maxPosition = durationMs?.takeIf { it > 0 }?.let { (it - 2_000L).coerceAtLeast(0L) } ?: Long.MAX_VALUE
    return (baseMs.coerceAtLeast(0L) + (stepMs shl shift)).coerceIn(0L, maxPosition)
}

// ── Video signal label ───────────────────────────────────────────────────────────────────────

internal fun videoSignalLabel(width: Int, height: Int, isHdr: Boolean, sampleMimeType: String?): String {
    val quality = when {
        width >= 7680 || height >= 4320 -> "8K"
        width >= 3840 || height >= 2160 -> "4K"
        width >= 1920 || height >= 1080 -> "FHD"
        width >= 1280 || height >= 720 -> "HD"
        width > 0 || height > 0 -> "SD"
        else -> ""
    }
    val codec = when (sampleMimeType) {
        MimeTypes.VIDEO_H264 -> "AVC"
        MimeTypes.VIDEO_H265 -> "HEVC"
        MimeTypes.VIDEO_AV1 -> "AV1"
        MimeTypes.VIDEO_VP9 -> "VP9"
        MimeTypes.VIDEO_MPEG2 -> "MPEG-2"
        else -> sampleMimeType.orEmpty().substringAfter("video/").uppercase(Locale.ROOT)
    }
    return listOf(quality, if (isHdr) "HDR" else "", codec).filter { it.isNotBlank() }.joinToString(" | ")
}

// ── Engine choice ────────────────────────────────────────────────────────────────────────────

internal fun isLibVlcSafeOnThisDevice(): Boolean {
    // Hard-disable LibVLC on x86/x86_64 (emulator + niche Atom boxes): the AWindow surface attach
    // path is fragile there and crashes on recomposition. Real TV hardware is arm/arm64.
    return Build.SUPPORTED_ABIS.none { abi ->
        abi.equals("x86", ignoreCase = true) || abi.equals("x86_64", ignoreCase = true)
    }
}

internal fun isLibVlcSafeForRequest(request: StreamRequest): Boolean =
    isLibVlcSafeOnThisDevice() && isVlcFriendlyContainer(request)

/** Automatic hand-offs to LibVLC skip streams that need headers LibVLC cannot send (Media3 sends them). */
internal fun shouldAutoUseLibVlc(request: StreamRequest): Boolean =
    isLibVlcSafeForRequest(request) &&
        !request.uri.startsWith("https://", ignoreCase = true) &&
        !request.hasHeadersLibVlcCannotSend()

internal fun preferredLiveAutoEngine(request: StreamRequest, performancePolicy: PerformancePolicy? = null): InternalPlaybackEngine {
    if (request.hasHeadersLibVlcCannotSend()) return InternalPlaybackEngine.MEDIA3
    if (shouldStartWithLibVlc(request) && isLibVlcSafeOnThisDevice()) return InternalPlaybackEngine.LIBVLC
    if (request.uri.startsWith("rtsp://", ignoreCase = true) && isLibVlcSafeOnThisDevice()) return InternalPlaybackEngine.LIBVLC
    if ((performancePolicy?.isPerformance == true || Build.VERSION.SDK_INT < 26) &&
        (request.uri.hasLiveTsHint() || request.mimeType == MimeTypes.VIDEO_MP2T) &&
        isLibVlcSafeOnThisDevice()
    ) {
        return InternalPlaybackEngine.LIBVLC
    }
    return InternalPlaybackEngine.MEDIA3
}

internal fun preferredAutoEngine(request: StreamRequest, isLive: Boolean, performancePolicy: PerformancePolicy): InternalPlaybackEngine =
    if (isLive) {
        preferredLiveAutoEngine(request, performancePolicy)
    } else if (shouldStartWithLibVlc(request) && isLibVlcSafeOnThisDevice() && !request.hasHeadersLibVlcCannotSend()) {
        InternalPlaybackEngine.LIBVLC
    } else {
        InternalPlaybackEngine.MEDIA3
    }

/**
 * Whether LibVLC is a sensible engine for [request]. Network links whose type is unknown (common
 * extensionless M3U lines, Xtream `output=ts` short links, tokenised restreams) qualify too:
 * LibVLC probes the content itself. Local files and content URIs never do.
 */
internal fun isVlcFriendlyContainer(request: StreamRequest): Boolean {
    val lowerUri = request.uri.lowercase(Locale.US).substringBefore('?')
    return request.uri.startsWith("rtsp://", ignoreCase = true) ||
        request.uri.startsWith("rtmp://", ignoreCase = true) ||
        request.mimeType in VLC_FRIENDLY_MIME_TYPES ||
        request.uri.hasLiveTsHint() ||
        VLC_FRIENDLY_EXTENSIONS.any { lowerUri.endsWith(it) } ||
        (request.mimeType == null && request.uri.networkScheme() in LIBVLC_PROBE_SCHEMES)
}

private val LIBVLC_PROBE_SCHEMES = setOf("http", "https", "udp", "rtp", "mms", "mmsh", "srt")

/** Schemes Media3 cannot open at all. */
private val LIBVLC_ONLY_SCHEMES = setOf("rtp", "mms", "mmsh", "srt")

internal fun String.networkScheme(): String = substringBefore("://", "").lowercase(Locale.US)

private val VLC_FRIENDLY_MIME_TYPES = setOf(
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
)

private val VLC_FRIENDLY_EXTENSIONS = listOf(
    ".avi", ".mov", ".m4v", ".3gp", ".3g2", ".ogv", ".ogg", ".mpg", ".mpeg", ".vob", ".asf", ".wmv", ".divx",
)

internal fun shouldStartWithLibVlc(request: StreamRequest): Boolean {
    val lowerUri = request.uri.lowercase(Locale.US).substringBefore('?')
    return request.uri.startsWith("rtmp://", ignoreCase = true) ||
        request.uri.networkScheme() in LIBVLC_ONLY_SCHEMES ||
        request.mimeType in LIBVLC_FIRST_MIME_TYPES ||
        LIBVLC_FIRST_EXTENSIONS.any { lowerUri.endsWith(it) }
}

private val LIBVLC_FIRST_MIME_TYPES = setOf(
    MimeTypes.VIDEO_FLV,
    MimeTypes.VIDEO_AVI,
    MimeTypes.VIDEO_MPEG,
    MimeTypes.VIDEO_PS,
    MimeTypes.VIDEO_OGG,
)

private val LIBVLC_FIRST_EXTENSIONS = listOf(".avi", ".flv", ".f4v", ".mpg", ".mpeg", ".vob", ".asf", ".wmv", ".divx")

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

internal fun shouldForceAsyncCodecQueueing(sdkInt: Int): Boolean = sdkInt in 23..30

internal fun liveTsExtractorFlags(): Int =
    DefaultTsPayloadReaderFactory.FLAG_ALLOW_NON_IDR_KEYFRAMES or
        DefaultTsPayloadReaderFactory.FLAG_DETECT_ACCESS_UNITS

// ── Buffers and quality caps ─────────────────────────────────────────────────────────────────

internal fun liveSafeMaxVideoHeight(policyHeight: Int): Int = when {
    Build.VERSION.SDK_INT < 26 -> policyHeight.coerceAtMost(720)
    policyHeight <= 720 -> 720
    policyHeight <= 1080 -> 1080
    policyHeight <= 2160 -> 2160
    else -> 4320
}

internal fun liveUltraMaxVideoHeight(policyHeight: Int): Int = when {
    Build.VERSION.SDK_INT < 26 -> 720
    Build.VERSION.SDK_INT < 29 -> maxOf(policyHeight, 2160).coerceAtMost(2160)
    else -> maxOf(policyHeight, 4320).coerceAtMost(4320)
}

internal fun liveSafeMaxBitrate(videoHeight: Int): Int = when {
    videoHeight <= 720 -> 6_000_000
    videoHeight <= 1080 -> 12_000_000
    videoHeight <= 2160 -> 50_000_000
    else -> 120_000_000
}

internal fun widthForHeight(height: Int): Int = when {
    height <= 720 -> 1280
    height <= 1080 -> 1920
    height <= 2160 -> 3840
    else -> 7680
}

/**
 * Live buffering. The large profile (45 s, deeper live offset) follows the heap budget
 * ([hasRoomForLargeLiveBuffer]), not the display cap; Media3 also caps the bytes it holds
 * ([playbackBufferBudget]), so a 4K stream cannot fill a small heap either way.
 */
internal fun livePlaybackProfile(
    isPerformanceMode: Boolean,
    policyLiveBufferMs: Int,
    largeBuffer: Boolean,
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
        largeBuffer -> LivePlaybackProfile(
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

internal fun liveNoVideoWatchdogDelayMs(isPerformanceMode: Boolean, sdkInt: Int = Build.VERSION.SDK_INT): Long =
    if (isPerformanceMode || sdkInt < 26) LIVE_NO_VIDEO_FAST_MS else LIVE_NO_VIDEO_DEFAULT_MS

internal fun vodNoVideoWatchdogDelayMs(isPerformanceMode: Boolean, sdkInt: Int = Build.VERSION.SDK_INT): Long =
    if (isPerformanceMode || sdkInt < 26) VOD_NO_VIDEO_FAST_MS else VOD_NO_VIDEO_DEFAULT_MS

// ── Same-channel quality variants ────────────────────────────────────────────────────────────

internal fun AppMediaItem.samePlayable(other: AppMediaItem): Boolean =
    id == other.id && type == other.type && serverId == other.serverId

private val RANK_8K = Regex("(?<![A-Z0-9])(8K|4320P?)(?![A-Z0-9])")
private val RANK_4K = Regex("(?<![A-Z0-9])(4K|UHD|2160P?)(?![A-Z0-9])")
private val RANK_FHD = Regex("(?<![A-Z0-9])(FHD|FULL ?HD|1080[PI]?)(?![A-Z0-9])")
private val RANK_HD = Regex("(?<![A-Z0-9])(HD|720P)(?![A-Z0-9])")
private val RANK_SD = Regex("(?<![A-Z0-9])(SD|576P|480P|360P)(?![A-Z0-9])")
private val QUALITY_TOKENS =
    Regex("(?<![\\p{L}\\p{N}])(8K|4K|UHD|FHD|FULL\\s*HD|HD|SD|4320P?|2160P?|1080[PI]?|720P?|576P?|480P?|360P?)(?![\\p{L}\\p{N}])")
private val NOISE_TOKENS =
    Regex("(?<![\\p{L}\\p{N}])(EVENT|BACKUP|ALT|VIP|HEVC|H\\.?265|H\\.?264|50FPS|60FPS)(?![\\p{L}\\p{N}])")
private val NON_WORD = Regex("[^\\p{L}\\p{N}]+")

internal fun liveQualityRankFromText(raw: String): Int? {
    val value = raw.uppercase(Locale.ROOT)
    return when {
        RANK_8K.containsMatchIn(value) -> 5
        RANK_4K.containsMatchIn(value) -> 4
        RANK_FHD.containsMatchIn(value) -> 3
        RANK_HD.containsMatchIn(value) -> 2
        RANK_SD.containsMatchIn(value) -> 1
        else -> null
    }
}

/** Quality rank from the channel's own label only; a category name like "UK FHD" says nothing about one channel. */
internal fun AppMediaItem.liveTitleQualityRank(): Int =
    liveQualityRankFromText("$title $containerExtension") ?: 2

/** Channel name without quality and feed labels, Unicode-aware so Arabic titles compare correctly. */
internal fun AppMediaItem.liveBaseTitle(): String =
    title.uppercase(Locale.ROOT)
        .replace(QUALITY_TOKENS, " ")
        .replace(NOISE_TOKENS, " ")
        .replace(NON_WORD, " ")
        .trim()

internal fun AppMediaItem.liveRecoveryKey(): String =
    "${serverId}:${id}:${streamUrl.substringBefore('?')}"

private fun liveMaxAllowedRank(maxVideoHeight: Int): Int = when {
    maxVideoHeight < 720 -> 1
    maxVideoHeight < 1080 -> 2
    maxVideoHeight < 2160 -> 3
    else -> 4
}

private class LiveVariantCandidate(val item: AppMediaItem, val rank: Int, val sameCategory: Boolean)

/**
 * Another feed of the SAME channel (same server and base title, e.g. "X HD" for "X FHD") that is no
 * heavier than the current one, preferring the same group and then the best remaining quality.
 * Returns null instead of ever picking an unrelated channel; weak titles (labels only) never match.
 */
internal fun List<AppMediaItem>.bestCompatibleLiveAlternative(
    current: AppMediaItem,
    maxVideoHeight: Int,
    excludedKeys: Set<String> = emptySet(),
): AppMediaItem? {
    if (current.type != ContentType.LIVE) return null
    val currentBase = current.liveBaseTitle()
    if (currentBase.none { it.isLetter() }) return null
    val maxRank = minOf(current.liveTitleQualityRank(), liveMaxAllowedRank(maxVideoHeight))
    return asSequence()
        .filter { candidate ->
            candidate.type == ContentType.LIVE &&
                candidate.serverId == current.serverId &&
                !candidate.samePlayable(current) &&
                candidate.liveRecoveryKey() !in excludedKeys
        }
        .filter { candidate -> candidate.liveBaseTitle() == currentBase }
        .map { candidate ->
            LiveVariantCandidate(candidate, candidate.liveTitleQualityRank(), candidate.categoryId == current.categoryId)
        }
        .filter { it.rank <= maxRank }
        .sortedWith(
            compareByDescending<LiveVariantCandidate> { it.sameCategory }
                .thenByDescending { it.rank }
                .thenBy { it.item.serverOrder }
                .thenBy { it.item.title.lowercase(Locale.ROOT) },
        )
        .firstOrNull()
        ?.item
}

// ── Stream requests ──────────────────────────────────────────────────────────────────────────

internal fun parseStreamRequest(rawUrl: String): StreamRequest {
    val parts = rawUrl.split("|", limit = 2)
    val cleanUrl = parts.first().trim()
    val headers = LinkedHashMap<String, String>()
    if (parts.size > 1) {
        parts[1]
            .split("&")
            .mapNotNull { token ->
                val pair = token.split("=", limit = 2)
                if (pair.size == 2) decodeHeader(pair[0]) to decodeHeader(pair[1]) else null
            }
            .forEach { (key, value) -> headers[key] = value }
    }
    return StreamRequest(
        uri = cleanUrl,
        headers = normalizeStreamHeaders(headers),
        mimeType = inferMimeType(cleanUrl),
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

private val OUTPUT_HINT = Regex("""[?&](?:output|type|format|extension)=([^&#]+)""")

private fun String.outputHint(): String =
    OUTPUT_HINT.find(this)?.groupValues?.getOrNull(1)?.substringBefore('&')?.substringBefore('#').orEmpty()

internal fun inferMimeType(url: String): String? {
    val normalizedFull = url.lowercase(Locale.US)
    val normalized = normalizedFull.substringBefore('?')
    val outputHint = normalizedFull.outputHint()
    return when {
        normalized.startsWith("rtsp://") -> null
        normalized.contains(".m3u8") || normalized.endsWith(".m3u") || outputHint == "m3u8" -> MimeTypes.APPLICATION_M3U8
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

internal fun String.hasLiveTsHint(): Boolean {
    val normalizedFull = lowercase(Locale.US)
    val normalized = normalizedFull.substringBefore('?').substringBefore('#')
    val outputHint = normalizedFull.outputHint()
    return normalized.endsWith(".ts") ||
        normalized.endsWith(".m2ts") ||
        outputHint == "ts" ||
        outputHint == "mpegts"
}

/**
 * Maps where a live ".ts" link really ended up (after redirects) to the request to reopen. Only a
 * manifest (HLS/DASH/SS) replaces the URI; anything else keeps the original link.
 */
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
    return request.copy(uri = resolvedUri, mimeType = redirectedMimeType ?: request.mimeType)
}

internal fun StreamRequest.isManifest(): Boolean =
    mimeType == MimeTypes.APPLICATION_M3U8 || mimeType == MimeTypes.APPLICATION_MPD || mimeType == MimeTypes.APPLICATION_SS

// ── VOD container fallback (Xtream serves one title under several extensions) ────────────────

/**
 * Whether another extension of the same Xtream title is worth trying. A wrong extension shows up
 * as 404/415 or as an unparseable container; auth, removal and server errors are not extension
 * problems, so they never walk the list (that only multiplies requests to a dead account).
 */
internal fun shouldTryVodStreamFallback(errorCode: Int, httpStatus: Int?, cause: Throwable?): Boolean {
    if (httpStatus != null) return httpStatus == 404 || httpStatus == 415
    if (cause.chainHas { it is ParserException }) return true
    return errorCode == PlaybackException.ERROR_CODE_PARSING_CONTAINER_MALFORMED ||
        errorCode == PlaybackException.ERROR_CODE_PARSING_MANIFEST_MALFORMED ||
        errorCode == PlaybackException.ERROR_CODE_PARSING_CONTAINER_UNSUPPORTED
}

internal fun vodFallbackRequests(baseRequest: StreamRequest, item: AppMediaItem): List<StreamRequest> {
    if (item.type != ContentType.MOVIE && item.type != ContentType.EPISODE) return emptyList()
    if (!baseRequest.uri.isXtreamVodEndpoint()) return emptyList()
    val currentExtension = baseRequest.uri.mediaPathExtension()
    val candidates = buildList {
        add(item.containerExtension)
        add(currentExtension)
        if (item.type == ContentType.EPISODE) {
            addAll(listOf("mkv", "mp4", "avi", "ts", "m3u8", "webm", "mov"))
        } else {
            addAll(listOf("mp4", "mkv", "avi", "mov", "webm", "ts", "m3u8"))
        }
    }
        .map { it.normalizePlayableExtension() }
        .filter { it.isNotBlank() && it != currentExtension }
        .distinct()
    return candidates
        .mapNotNull { extension -> baseRequest.withReplacedPathExtension(extension) }
        .distinctBy { it.uri }
}

internal fun nextVodFallbackRequest(
    baseRequest: StreamRequest,
    currentRequest: StreamRequest,
    item: AppMediaItem,
    attemptedUris: Set<String>,
): StreamRequest? {
    val visited = attemptedUris + currentRequest.uri
    return vodFallbackRequests(baseRequest, item).firstOrNull { candidate -> candidate.uri !in visited }
}

private fun String.isXtreamVodEndpoint(): Boolean {
    val path = substringBefore('|').substringBefore('?').substringBefore('#').lowercase(Locale.US)
    return "/series/" in path || "/movie/" in path
}

private fun String.mediaPathExtension(): String {
    val path = substringBefore('|').substringBefore('?').substringBefore('#')
    return path.substringAfterLast('/').substringAfterLast('.', "").normalizePlayableExtension()
}

private fun StreamRequest.withReplacedPathExtension(extension: String): StreamRequest? {
    val cleanExtension = extension.normalizePlayableExtension()
    if (cleanExtension.isBlank()) return null
    val splitAt = uri.indexOfAny(charArrayOf('?', '#')).let { index -> if (index >= 0) index else uri.length }
    val path = uri.substring(0, splitAt)
    val suffix = uri.substring(splitAt)
    val slash = path.lastIndexOf('/')
    val dot = path.lastIndexOf('.')
    if (dot <= slash || dot >= path.lastIndex) return null
    val nextUri = path.substring(0, dot + 1) + cleanExtension + suffix
    if (nextUri == uri) return null
    return copy(uri = nextUri, mimeType = inferMimeType(nextUri))
}

private fun String.normalizePlayableExtension(): String = trim()
    .trimStart('.')
    .lowercase(Locale.US)
    .let { value ->
        when (value) {
            "hls", "m3u", "m3u8" -> "m3u8"
            "mpegts", "mpeg-ts", "ts" -> "ts"
            "dash", "mpd" -> "mpd"
            "smooth", "ism" -> "ism"
            "matroska" -> "mkv"
            "quicktime" -> "mov"
            "mp4", "m4v", "mkv", "webm", "flv", "avi", "mov", "mpg", "mpeg", "vob", "3gp", "3g2" -> value
            else -> ""
        }
    }

// ── Misc ─────────────────────────────────────────────────────────────────────────────────────

private val CREDENTIAL_PATH = Regex("""/(live|movie|series)/([^/]+)/([^/]+)/""", RegexOption.IGNORE_CASE)
private val USERNAME_PARAM = Regex("username=[^&\\s/]+")
private val PASSWORD_PARAM = Regex("password=[^&\\s/]+")

/** Stream label safe for logs and telemetry: no query string and no Xtream credentials. */
internal fun String.safeStreamLabel(): String =
    substringBefore('?')
        .replace(USERNAME_PARAM, "username=***")
        .replace(PASSWORD_PARAM, "password=***")
        .replace(CREDENTIAL_PATH, "/$1/***/***/")
        .takeLast(48)

internal fun formatTime(ms: Long): String {
    if (ms <= 0) return "00:00"
    val hours = TimeUnit.MILLISECONDS.toHours(ms)
    val minutes = TimeUnit.MILLISECONDS.toMinutes(ms) % 60
    val seconds = TimeUnit.MILLISECONDS.toSeconds(ms) % 60
    return if (hours > 0) {
        String.format(Locale.ROOT, "%02d:%02d:%02d", hours, minutes, seconds)
    } else {
        String.format(Locale.ROOT, "%02d:%02d", minutes, seconds)
    }
}
