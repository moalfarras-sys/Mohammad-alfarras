package com.moalfarras.moplayer.ui.player

import com.moalfarras.moplayer.core.DevicePerformanceTier
import com.moalfarras.moplayer.data.repository.alternateLiveFormatUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okio.ByteString.Companion.decodeBase64
import java.util.Locale

// Pure engine decisions (buffer memory, LibVLC options, format and engine fallbacks). Like
// PlayerPolicies, nothing here touches Compose or a live player, so it runs in JVM unit tests.

// ── Media3 buffer memory ─────────────────────────────────────────────────────────────────────

/**
 * How much media Media3 may hold. DefaultAllocator keeps the buffer as byte[] on the Java heap,
 * and without a byte target a VOD remux or a 4K stream can take 100+ MB, which OOMs 1-2 GB boxes
 * (heap 96-192 MB). VOD gets a quarter of the heap (16-64 MB); live never runs far ahead of the
 * edge, so it gets about a sixth (8-32 MB). Time only wins over this budget on HIGH-tier boxes.
 */
internal data class BufferBudget(val targetBytes: Int, val prioritizeTimeOverSize: Boolean)

internal fun playbackBufferBudget(
    memoryClassMb: Int,
    isLowRam: Boolean,
    tier: DevicePerformanceTier,
    isLive: Boolean,
): BufferBudget {
    val heapMb = memoryClassMb.takeIf { it > 0 } ?: 128
    var budgetMb = if (isLive) (heapMb / 6).coerceIn(8, 32) else (heapMb / 4).coerceIn(16, 64)
    if (isLowRam) budgetMb = minOf(budgetMb, if (isLive) 16 else 24)
    return BufferBudget(
        targetBytes = budgetMb * 1024 * 1024,
        prioritizeTimeOverSize = tier == DevicePerformanceTier.HIGH && !isLowRam,
    )
}

/**
 * The 45 s live buffer profile is only worth it where the heap can hold it. It used to follow the
 * 2160p display cap, so every 4K TV box (often 192 MB heaps) got it.
 */
internal fun hasRoomForLargeLiveBuffer(memoryClassMb: Int, isLowRam: Boolean): Boolean =
    !isLowRam && memoryClassMb >= 256

// ── Unsupported audio (AC-3 / E-AC-3 / DTS on boxes without a decoder) ───────────────────────

internal enum class UnsupportedAudioAction {
    /** Hand the same stream to LibVLC, which decodes these formats in software. */
    SWITCH_ENGINE,

    /** Keep the picture and tell the viewer why there is no sound. */
    NOTIFY,

    NONE,
}

/**
 * Media3 plays video with no sound (and raises no error) when every audio track is unsupported.
 * The FFmpeg renderer covers most such streams; this is the safety net for the rest.
 */
internal fun unsupportedAudioAction(
    onLibVlc: Boolean,
    libVlcCanPlay: Boolean,
    triedLibVlc: Boolean,
    alreadyNotified: Boolean,
): UnsupportedAudioAction = when {
    onLibVlc -> UnsupportedAudioAction.NONE
    libVlcCanPlay && !triedLibVlc -> UnsupportedAudioAction.SWITCH_ENGINE
    alreadyNotified -> UnsupportedAudioAction.NONE
    else -> UnsupportedAudioAction.NOTIFY
}

// ── Live .ts <-> .m3u8 fallback ──────────────────────────────────────────────────────────────

/** Statuses a different container cannot fix; another request would only count against the line. */
private val NO_FORMAT_SWAP_STATUSES = setOf(401, 403, 407, 429, 451, 509)

/** Whether a live channel that fails to open should be tried once in its other Xtream format. */
internal fun canSwapLiveFormat(wasPlaying: Boolean, alreadySwapped: Boolean, hasAlternate: Boolean, httpStatus: Int?): Boolean =
    !wasPlaying && !alreadySwapped && hasAlternate && (httpStatus == null || httpStatus !in NO_FORMAT_SWAP_STATUSES)

/**
 * The same channel in the other Xtream container (`.ts` <-> `.m3u8`) with the same headers, or
 * null when [request] is not an Xtream live URL.
 */
internal fun alternateLiveFormatRequest(request: StreamRequest): StreamRequest? =
    alternateLiveFormatUrl(request.uri)?.let { uri -> request.copy(uri = uri, mimeType = inferMimeType(uri)) }

// ── LibVLC ───────────────────────────────────────────────────────────────────────────────────

internal fun libVlcNetworkCacheMs(isLive: Boolean, weakDevice: Boolean): Int = when {
    // Raw TS over HTTP has no segment prefetch: this cache is its only jitter buffer.
    isLive -> if (weakDevice) 2_000 else 1_500
    // Latency does not matter for VOD, and a larger cache rides out Wi-Fi dips.
    else -> 3_000
}

/** Options for the single process-wide LibVLC instance (per-stream tuning goes on the Media). */
internal fun libVlcInstanceOptions(cpuCores: Int): List<String> = listOf(
    "--network-caching=1500",
    "--file-caching=2000",
    "--avcodec-fast",
    // soxr sounds better but costs real CPU on dual-core boxes.
    if (cpuCores <= 2) "--audio-resampler=ugly" else "--audio-resampler=soxr",
)

internal data class LibVlcMediaConfig(
    val isLive: Boolean,
    val isManifest: Boolean,
    val weakDevice: Boolean,
    val cpuCores: Int,
    val startPositionMs: Long,
    val userAgent: String,
    val referer: String?,
    /** SD live channels are often interlaced broadcast feeds (576i/480i). */
    val deinterlace: Boolean,
    val maxVideoHeight: Int,
    val title: String,
)

/**
 * Per-media LibVLC options. Caching must be added before Media.setHWDecoderEnabled(), which only
 * injects its own 1500 ms default when none is set. VLC 3 has no option for Cookie, Origin or
 * arbitrary headers, so only User-Agent and Referer are sent (see [hasHeadersLibVlcCannotSend]).
 */
internal fun libVlcMediaOptions(config: LibVlcMediaConfig): List<String> = buildList {
    add(":network-caching=${libVlcNetworkCacheMs(config.isLive, config.weakDevice)}")
    add(":file-caching=2000")
    // A live resource: no seeking and one automatic reconnect. It must never be set for VOD,
    // where it disables seeking and resume.
    if (config.isLive && !config.isManifest) add(":http-continuous")
    add(":http-reconnect")
    add(":http-user-agent=${config.userAgent}")
    config.referer?.takeIf { it.isNotBlank() }?.let { add(":http-referrer=$it") }
    // Skipping the H.264 deblocking filter only matters for software decoding, which is what
    // weak boxes fall back to: non-reference frames on quad-cores, non-key frames on dual-cores.
    if (config.weakDevice) add(":avcodec-skiploopfilter=${if (config.cpuCores <= 2) 3 else 1}")
    if (config.isManifest && config.maxVideoHeight > 0) add(":adaptive-maxheight=${config.maxVideoHeight}")
    if (config.isLive && config.deinterlace) {
        // Automatic: the filter only runs on frames flagged interlaced (software-decoded path).
        add(":deinterlace=-1")
        add(":deinterlace-mode=yadif")
    }
    if (!config.isLive && config.startPositionMs >= LIBVLC_MIN_RESUME_MS) {
        add(":start-time=${String.format(Locale.ROOT, "%.3f", config.startPositionMs / 1000.0)}")
    }
    if (config.title.isNotBlank()) add(":meta-title=${config.title}")
}

/** Resume points closer to the start than this are not worth a seek. */
internal const val LIBVLC_MIN_RESUME_MS = 5_000L

/**
 * A VOD EndReached this close to the known length is a real ending, anything earlier is a cut-off.
 * Without a known length (some servers send none) there is nothing to compare, so it counts as the end.
 */
internal fun libVlcReachedEnd(timeMs: Long, lengthMs: Long): Boolean =
    lengthMs <= 0L || timeMs >= lengthMs - 15_000L

/**
 * Where a LibVLC VOD session starts: the last known position, unless it is too early to matter
 * or so close to the end that the title would finish at once (then it restarts).
 */
internal fun libVlcStartPositionMs(resumeMs: Long, knownLengthMs: Long): Long = when {
    resumeMs < LIBVLC_MIN_RESUME_MS -> 0L
    knownLengthMs > 0 && resumeMs >= knownLengthMs - 30_000L -> 0L
    else -> resumeMs
}

/**
 * Cookie, Origin and bearer tokens cannot reach LibVLC 3 (it has no such options), so a stream
 * that depends on them must stay on Media3. Basic credentials are fine: they travel in the URL.
 */
internal fun StreamRequest.hasHeadersLibVlcCannotSend(): Boolean {
    if (!uri.startsWith("http://", ignoreCase = true) && !uri.startsWith("https://", ignoreCase = true)) return false
    return headers.any { (key, value) ->
        key.equals("Cookie", ignoreCase = true) ||
            key.equals("Origin", ignoreCase = true) ||
            (key.equals("Authorization", ignoreCase = true) && basicCredentials(value) == null)
    }
}

/**
 * The URL LibVLC (and external players, which cannot take headers either) should open: an
 * `Authorization: Basic` header becomes URL user info, which VLC 3's HTTP access honours.
 */
internal fun uriWithBasicCredentials(uri: String, headers: Map<String, String>): String {
    val authorization = headers.entries.firstOrNull { it.key.equals("Authorization", ignoreCase = true) }?.value ?: return uri
    val (user, password) = basicCredentials(authorization) ?: return uri
    val url = uri.toHttpUrlOrNull() ?: return uri
    if (url.username.isNotEmpty()) return uri
    return url.newBuilder().username(user).password(password).build().toString()
}

private fun basicCredentials(authorization: String): Pair<String, String>? {
    val value = authorization.trim()
    if (!value.startsWith("Basic ", ignoreCase = true)) return null
    val decoded = value.substring(6).trim().decodeBase64()?.utf8() ?: return null
    val separator = decoded.indexOf(':')
    if (separator <= 0) return null
    return decoded.substring(0, separator) to decoded.substring(separator + 1)
}

/**
 * LibVLC's scale is screen pixels per decoded video pixel, not a fraction of the window: a fixed
 * value shrinks SD/HD and over-crops 4K. This is the scale that fills [viewWidth] x [viewHeight]
 * with the picture (cropping the overflow), honouring the sample aspect ratio and rotation.
 * Null while the video size is unknown (the picture then stays in best-fit).
 */
internal fun libVlcFillScale(
    viewWidth: Int,
    viewHeight: Int,
    videoWidth: Int,
    videoHeight: Int,
    sarNum: Int,
    sarDen: Int,
    orientation: Int,
): Float? {
    if (viewWidth <= 0 || viewHeight <= 0 || videoWidth <= 0 || videoHeight <= 0) return null
    // IMedia.VideoTrack.Orientation.LeftBottom / RightTop: the picture is rotated 90 degrees.
    val rotated = orientation == 5 || orientation == 6
    var width = if (rotated) videoHeight else videoWidth
    val height = if (rotated) videoWidth else videoHeight
    if (sarNum > 0 && sarDen > 0 && sarNum != sarDen) width = (width.toLong() * sarNum / sarDen).toInt()
    if (width <= 0) return null
    return maxOf(viewWidth / width.toFloat(), viewHeight / height.toFloat())
}

/**
 * First-open watchdog delay for live. LibVLC must be given its network cache plus time to connect
 * and decode; restarting it earlier just burns the small retry budget of weak boxes.
 */
internal fun liveStartupStallDelayMs(weakDevice: Boolean, useLibVlc: Boolean): Long {
    val base = if (weakDevice) 3_500L else 5_000L
    return if (useLibVlc) maxOf(base, libVlcNetworkCacheMs(isLive = true, weakDevice = weakDevice) + 3_000L) else base
}

// ── External players ─────────────────────────────────────────────────────────────────────────

/** Player routes that open an installed app, with its packages in launch order (declared in <queries>). */
internal val EXTERNAL_PLAYER_PACKAGES: Map<String, List<String>> = linkedMapOf(
    "vlc" to listOf("org.videolan.vlc"),
    // The paid MX first: someone who bought it wants it over the free one.
    "mx" to listOf("com.mxtech.videoplayer.pro", "com.mxtech.videoplayer.ad"),
    "just" to listOf("com.brouken.player"),
)

/** The external player routes whose app is installed (needs the <queries> entries on Android 11+). */
internal fun installedExternalPlayers(isInstalled: (packageName: String) -> Boolean): List<String> =
    EXTERNAL_PLAYER_PACKAGES.filterValues { packages -> packages.any(isInstalled) }.keys.toList()

/**
 * Stream headers in MX Player's intent format: one String[] of alternating names and values.
 * VLC and Just Player read no header extras (Basic credentials still reach them in the URL).
 */
internal fun externalPlayerHeaders(headers: Map<String, String>): Array<String>? =
    headers
        .flatMap { (key, value) -> listOf(key, value) }
        .takeIf { it.isNotEmpty() }
        ?.toTypedArray()
