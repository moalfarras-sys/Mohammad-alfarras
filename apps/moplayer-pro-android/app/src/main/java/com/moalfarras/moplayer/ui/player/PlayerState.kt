package com.moalfarras.moplayer.ui.player

import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableIntState
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.input.key.Key
import androidx.media3.common.C
import com.moalfarras.moplayer.domain.model.MediaItem as AppMediaItem

// PlayerScreen keeps its state in three holders instead of dozens of remembered locals: it keeps
// the (very large) composable small enough for the API 23 ART verifier and makes the lifetime of
// every flag explicit. Plain `var`s are only read by event handlers and effects, never by UI.

/** Lives for the whole player session: survives channel and episode changes (PlayerScreen is not keyed by item). */
@Stable
internal class PlayerSessionState {
    var isPlaying by mutableStateOf(true)
    var lastInteraction by mutableLongStateOf(System.currentTimeMillis())
    var networkAvailable by mutableStateOf(true)

    // VOD seeking: the pill shows the cumulative jump; held keys preview first and commit once.
    var seekPillMs by mutableLongStateOf(0L)
    var seekPillNonce by mutableIntStateOf(0)
    var seekPillVisible by mutableStateOf(false)
    var seekPreviewNonce by mutableIntStateOf(0)
    var seekPreviewVisible by mutableStateOf(false)
    var seekCommitNonce by mutableIntStateOf(0)
    var pendingSeekTarget: Long = C.TIME_UNSET
    var seekSessionMs: Long = 0L
    var lastSeekDirection: Int = 0
    var lastSeekAt: Long = 0L

    // Live zapping: the first press tunes at once, rapid/held presses only move this target.
    var lastLiveSwitchAt by mutableLongStateOf(0L)
    var zapSettling by mutableStateOf(false)
    var userZapInFlight by mutableStateOf(false)
    var pendingZapItem by mutableStateOf<AppMediaItem?>(null)
    var pendingZapNonce by mutableIntStateOf(0)
    var lastZapCommitAt: Long = 0L
    var zapKeyHeld: Boolean = false

    // Automatic same-channel variant switching (bounded across the chain of variants).
    var liveAutoRecoveryAttempts: Int = 0
    var liveAutoRecoveryVisited: Set<String> = emptySet()
    var nextSwitchIsRecovery: Boolean = false
    var recoveryNotice by mutableStateOf<String?>(null)
    var recoveryNoticeNonce by mutableIntStateOf(0)

    // LAST_CHANNEL recall.
    var previousChannel: AppMediaItem? = null
    var lastSeenLiveItem: AppMediaItem? = null

    // Numeric channel entry.
    var numberBuffer by mutableStateOf("")
    var numberNonce by mutableIntStateOf(0)

    // Short informational pill ("Channel 123 not found", "Seeking isn't available…").
    var transientMessage by mutableStateOf<String?>(null)
    var transientMessageNonce by mutableIntStateOf(0)

    /** Monotonic across engines and items so a new LibVLC view never replays an old command. */
    var vlcTransportSeq: Int = 0

    /** Seek and track commands for the LibVLC view on screen (no-ops while Media3 plays). */
    val vlc = LibVlcController()

    /** The key whose KeyDown the player root consumed; its KeyUp must not click a newly focused button. */
    var ownedKey: Key? = null

    /**
     * Bumped to build a fresh Media3 player (the surface-retry escalation, a retry after one). The
     * player otherwise stays across channel and episode changes.
     */
    var media3Generation by mutableIntStateOf(0)

    /** Event time ([android.os.SystemClock.uptimeMillis]) of the last key press, for [zapProbe]. */
    var lastKeyDownAt: Long = 0L

    /** Debug builds: key press to first frame of each channel or episode change. */
    val zapProbe = ZapLatencyProbe()

    fun showTransientMessage(message: String) {
        transientMessage = message
        transientMessageNonce++
    }
}

/** UI state of one channel or episode; reset when the item changes. */
@Stable
internal class PlayerItemUiState(isLive: Boolean, isFavorite: Boolean, positionMs: Long, durationMs: Long) {
    var showControls by mutableStateOf(!isLive)
    var showLiveZap by mutableStateOf(false)
    var liveOverlayTab by mutableStateOf(LiveOverlayTab.CHANNELS)
    var liveActionIndex by mutableIntStateOf(0)
    var showMiniInfo by mutableStateOf(isLive)
    var favoriteMarked by mutableStateOf(isFavorite)
    var launchMessage by mutableStateOf<String?>(null)
    var externalLaunchNonce by mutableIntStateOf(0)
    var externalSubtitle by mutableStateOf<Uri?>(null)
    var externalSubtitleNonce by mutableIntStateOf(0)
    var playbackSignal by mutableStateOf("")
    var currentPosition by mutableLongStateOf(positionMs)
    var duration by mutableLongStateOf(durationMs)

    /** Episodes: the one after this, looked up when it starts (null: none, or not an episode). */
    var nextEpisode by mutableStateOf<AppMediaItem?>(null)

    /** The viewer cancelled the next-episode countdown for the current ending. */
    var nextEpisodeDismissed by mutableStateOf(false)
}

/** Recovery state of one stream request (item + URL): engines tried, watchdog markers, reconnects. */
@Stable
internal class PlaybackAttemptState(
    preferredLiveEngine: InternalPlaybackEngine,
    resumePositionMs: Long,
    rememberedLiveFormat: StreamRequest? = null,
) {
    var isBuffering by mutableStateOf(true)
    var playbackError by mutableStateOf<PlaybackIssue?>(null)

    var libVlcRetryNonce by mutableIntStateOf(0)
    var vlcTransport by mutableStateOf<VlcTransportCommand?>(null)

    /** LibVLC reported the current stream as seekable (VOD over HTTP with range support). */
    var libVlcSeekable: Boolean = false

    /** In-place LibVLC VOD re-opens after an error or early end (continues from the last position). */
    var libVlcVodRetries: Int = 0

    /** The "audio format not supported" notice was shown for this stream. */
    var audioUnsupportedNotified: Boolean = false

    /** Live: the other Xtream container of this channel (.ts <-> .m3u8), or null for the original link. */
    var liveFormatRequest by mutableStateOf(rememberedLiveFormat)

    /** Live: the one-shot format swap was used for this attempt. */
    var liveFormatSwapped: Boolean = false

    /** Live: the swap is still on trial (no first frame yet); a failure of the other format undoes it. */
    var liveFormatTrial: LiveFormatSwapTrial? = null

    var liveReadyWithoutVideoAt by mutableLongStateOf(0L)
    var liveFirstFrameRendered by mutableStateOf(false)
    var liveOpeningGuard by mutableStateOf(false)
    var media3SurfaceAttempt by mutableIntStateOf(0)
    var liveConsecutiveFailures by mutableIntStateOf(0)

    /** Server closed a live stream before any frame: one quick re-open, not reset by READY. */
    var startupEndedRetries: Int = 0

    var vodReadyAt by mutableLongStateOf(0L)
    var vodFirstFrameRendered by mutableStateOf(false)
    var vodOpeningGuard by mutableStateOf(false)
    var vodEnded by mutableStateOf(false)

    var triedMedia3ForLive by mutableStateOf(preferredLiveEngine == InternalPlaybackEngine.MEDIA3)
    var triedLibVlcForLive by mutableStateOf(preferredLiveEngine == InternalPlaybackEngine.LIBVLC)
    var forceLibVlcForLive by mutableStateOf(preferredLiveEngine == InternalPlaybackEngine.LIBVLC)
    var triedLibVlcForVod by mutableStateOf(false)
    var forceLibVlcForVod by mutableStateOf(false)
    var triedCompatibleLiveAlternative: Boolean = false

    /** Where a live ".ts" link really led, captured from Media3's own failed load (no probe connection). */
    var liveRedirectHint: StreamRequest? = null
    var resolvedLiveRequest by mutableStateOf<StreamRequest?>(null)
    var forceHlsForLiveRedirect by mutableStateOf(false)
    var vodFallbackRequest by mutableStateOf<StreamRequest?>(null)
    var vodFallbackVisitedUris: Set<String> = emptySet()
    var vodFallbackSwitches: Int = 0

    /** Radio / audio-only stream: no video will ever render, so the no-video recovery must stay away. */
    var audioOnly by mutableStateOf(false)

    /** Rendered a frame (or confirmed audio-only) at least once: later failures reconnect in place. */
    var wasPlaying: Boolean = false

    // In-place live reconnects with backoff; reconnectingSince > 0 shows the "Reconnecting…" pill.
    var reconnectAttempt: Int = 0
    var reconnectingSince by mutableLongStateOf(0L)
    var reconnectNonce by mutableIntStateOf(0)

    var userPaused by mutableStateOf(false)
    var pausedAt: Long = 0L

    /** Bumped to load the current request into the Media3 player again (manual retry). */
    var media3ReloadNonce by mutableIntStateOf(0)

    /** Latest VOD position, used when the stream is opened again (fallback URL, engine switch, retry). */
    var resumePositionMs: Long = resumePositionMs
}

/**
 * The live container (.ts or .m3u8) that last worked for a channel, for this app process, so a
 * channel whose default format fails is opened in the working one straight away next time.
 */
internal object LiveFormatMemory {
    private const val MAX_CHANNELS = 256
    private val formats = object : LinkedHashMap<String, StreamRequest>(64, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, StreamRequest>?): Boolean = size > MAX_CHANNELS
    }

    @Synchronized
    fun get(channelKey: String): StreamRequest? = formats[channelKey]

    /** [request] null: the channel's original link works, so nothing needs remembering. */
    @Synchronized
    fun remember(channelKey: String, request: StreamRequest?) {
        if (request == null) formats.remove(channelKey) else formats[channelKey] = request
    }
}

/** The zap list as the live overlay shows it: groups, the filtered channels, numbering and the selection. */
internal class LiveZapList(
    val currentIndex: Int,
    val previousItem: AppMediaItem?,
    val nextItem: AppMediaItem?,
    val providerNumbers: Boolean,
    val categories: List<LiveZapCategory>,
    val displayedItems: List<AppMediaItem>,
    val displayedCurrentIndex: Int,
    val channelNumberOf: (AppMediaItem) -> Int?,
    private val categoryIdState: MutableState<String>,
    private val selectedIndexState: MutableIntState,
) {
    var categoryId: String
        get() = categoryIdState.value
        set(value) {
            categoryIdState.value = value
        }

    var selectedIndex: Int
        get() = selectedIndexState.intValue
        set(value) {
            selectedIndexState.intValue = value
        }
}

@Composable
internal fun rememberLiveZapList(
    item: AppMediaItem,
    relatedItems: List<AppMediaItem>,
    isLive: Boolean,
    allLabel: String,
    fallbackGroupName: String,
): LiveZapList {
    val currentIndex = remember(item.id, item.type, item.serverId, relatedItems) {
        relatedItems.indexOfFirst { it.samePlayable(item) }
    }
    val providerNumbers = remember(relatedItems, isLive) { isLive && usesProviderChannelNumbers(relatedItems) }
    val channelNumberOf: (AppMediaItem) -> Int? = remember(relatedItems, providerNumbers) {
        val indexByKey = HashMap<String, Int>(relatedItems.size * 2)
        relatedItems.forEachIndexed { index, channel -> indexByKey.putIfAbsent(channel.zapKey(), index) }
        val numberOf: (AppMediaItem) -> Int? = { channel -> liveChannelNumber(channel, indexByKey[channel.zapKey()] ?: -1, providerNumbers) }
        numberOf
    }
    val categories = remember(relatedItems, allLabel, fallbackGroupName) { relatedItems.toLiveZapCategories(allLabel, fallbackGroupName) }
    val categoryIdState = remember(item.id, relatedItems) { mutableStateOf(item.categoryId.ifBlank { LIVE_ZAP_ALL_CATEGORY_ID }) }
    val categoryId = categoryIdState.value
    val displayedItems = remember(relatedItems, categoryId) {
        when (categoryId) {
            LIVE_ZAP_ALL_CATEGORY_ID -> relatedItems
            LIVE_ZAP_UNCATEGORIZED_ID -> relatedItems.filter { it.categoryId.isBlank() }
            else -> relatedItems.filter { it.categoryId == categoryId }
        }.ifEmpty { relatedItems }
    }
    val displayedCurrentIndex = remember(item.id, item.type, item.serverId, displayedItems) {
        displayedItems.indexOfFirst { it.samePlayable(item) }
    }
    val selectedIndexState = remember(item.id, categoryId, displayedItems.size) {
        mutableIntStateOf(displayedCurrentIndex.coerceAtLeast(0))
    }
    return LiveZapList(
        currentIndex = currentIndex,
        previousItem = liveZapTargetIndex(currentIndex, -1, relatedItems.size)?.let(relatedItems::get),
        nextItem = liveZapTargetIndex(currentIndex, 1, relatedItems.size)?.let(relatedItems::get),
        providerNumbers = providerNumbers,
        categories = categories,
        displayedItems = displayedItems,
        displayedCurrentIndex = displayedCurrentIndex,
        channelNumberOf = channelNumberOf,
        categoryIdState = categoryIdState,
        selectedIndexState = selectedIndexState,
    )
}

private fun AppMediaItem.zapKey(): String = "$serverId:$id:$type"
