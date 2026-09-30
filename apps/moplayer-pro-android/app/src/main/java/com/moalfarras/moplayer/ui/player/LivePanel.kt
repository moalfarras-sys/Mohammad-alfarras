package com.moalfarras.moplayer.ui.player

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import com.moalfarras.moplayer.data.repository.LiveZapKey
import com.moalfarras.moplayer.domain.model.Category
import com.moalfarras.moplayer.domain.model.MediaItem as AppMediaItem
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * What the player's live panel reads from the local library, and how it plays a channel from
 * it. Group id "" stands for every live channel. Every read is a cheap local query that runs off
 * the main thread; failures come back empty.
 */
interface LivePanelSource {
    /** The group CH+/CH- walks now: a category id, "" for every channel, or null (favorites, search, not loaded yet). */
    fun zapGroupId(): String?

    /** Channels of one live group in the Live screen's order, with the same filters. */
    suspend fun groupKeys(groupId: String): List<LiveZapKey>

    /** Full rows for [keys]; channels removed since the keys were read are left out. */
    suspend fun rows(keys: List<LiveZapKey>): List<AppMediaItem>

    /** Live channels per group id, "" being the total (may be empty when unknown). */
    suspend fun groupCounts(): Map<String, Int>

    /** The channel carrying provider number [number] anywhere in the library, or null. */
    suspend fun channelByNumber(number: Int): AppMediaItem?

    /** Plays [item]; from now on CH+/CH- walk [groupId] ("" for every channel). */
    fun playInGroup(item: AppMediaItem, groupId: String)
}

/** Group id of "All channels" in the panel (the library query's "no category filter"). */
internal const val LIVE_PANEL_ALL_GROUP = ""

/** Channel rows are loaded in pages of this size around the selection and what is on screen. */
internal const val LIVE_PANEL_PAGE_SIZE = 40

/** Pages kept on each side of the page being looked at. */
private const val LIVE_PANEL_PAGES_AROUND = 1

/** Pages held in memory at most (a 30k-channel group never loads whole). */
internal const val LIVE_PANEL_MAX_PAGES = 12

/** Groups whose channel keys are kept for quick switching back and forth. */
private const val LIVE_PANEL_KEY_CACHE = 4

/** Walking the group column with held keys loads only the group the highlight stops on. */
private const val LIVE_PANEL_GROUP_SETTLE_MS = 160L

/** The group the panel opens on: the one CH+/CH- walks, else the channel's own group (else all channels). */
internal fun livePanelInitialGroup(zapGroupId: String?, current: AppMediaItem): String =
    zapGroupId ?: current.categoryId

/**
 * The group column: "All channels" first, then the library's live groups in their Live screen
 * order. A merged library can list one category id per source; the panel shows it once.
 * Counts are -1 while unknown.
 */
internal fun livePanelGroups(
    library: List<Category>,
    counts: Map<String, Int>,
    allLabel: String,
    fallbackName: String,
): List<LiveZapCategory> {
    val groups = ArrayList<LiveZapCategory>(library.size + 1)
    groups += LiveZapCategory(LIVE_PANEL_ALL_GROUP, allLabel, counts[LIVE_PANEL_ALL_GROUP] ?: -1)
    val seen = HashSet<String>(library.size * 2)
    for (category in library) {
        if (category.id == LIVE_PANEL_ALL_GROUP || !seen.add(category.id)) continue
        groups += LiveZapCategory(category.id, category.name.ifBlank { fallbackName }, counts[category.id] ?: -1)
    }
    return groups
}

/** The group [direction] rows away from [currentId] in [groups], wrapping around (the first one when it is not listed). */
internal fun livePanelGroupAfter(groups: List<LiveZapCategory>, currentId: String, direction: Int): String? {
    if (groups.isEmpty()) return null
    val index = groups.indexOfFirst { it.id == currentId }
    if (index < 0) return groups.first().id
    return groups[(index + direction).floorMod(groups.size)].id
}

/** Pages to load so rows around [index] of a [count]-channel group are on hand. */
internal fun livePanelPagesAround(index: Int, count: Int, pageSize: Int = LIVE_PANEL_PAGE_SIZE): IntRange {
    if (count <= 0) return IntRange.EMPTY
    val lastPage = (count - 1) / pageSize
    val page = index.coerceIn(0, count - 1) / pageSize
    return (page - LIVE_PANEL_PAGES_AROUND).coerceAtLeast(0)..(page + LIVE_PANEL_PAGES_AROUND).coerceAtMost(lastPage)
}

/** Loaded pages to drop, farthest from [keepPage] first, so at most [maxPages] stay. */
internal fun livePanelPagesToDrop(loaded: Collection<Int>, keepPage: Int, maxPages: Int = LIVE_PANEL_MAX_PAGES): List<Int> {
    if (loaded.size <= maxPages) return emptyList()
    return loaded.sortedByDescending { kotlin.math.abs(it - keepPage) }.take(loaded.size - maxPages)
}

/**
 * The live panel's view of the library: the highlighted group, its channel keys, the rows loaded
 * around the selection (pages, never a whole big group), group counts and channel-number
 * lookups. Lives for the player session; D-pad handling in PlayerScreen drives it by index.
 */
@Stable
internal class LiveBrowser(private val source: LivePanelSource, private val scope: CoroutineScope) {
    /** The highlighted group; the channel column shows it once its keys are loaded. */
    var groupId by mutableStateOf(LIVE_PANEL_ALL_GROUP)
        private set

    /** The group whose channels [keys] holds (differs from [groupId] while it loads). */
    var loadedGroupId by mutableStateOf<String?>(null)
        private set

    var keys by mutableStateOf<List<LiveZapKey>>(emptyList())
        private set

    var selectedIndex by mutableIntStateOf(0)
        private set

    var counts by mutableStateOf<Map<String, Int>>(emptyMap())
        private set

    var libraryGroups by mutableStateOf<List<Category>>(emptyList())
        private set

    val loading: Boolean get() = loadedGroupId != groupId
    val channelCount: Int get() = keys.size

    private val pages = mutableStateMapOf<Int, List<AppMediaItem?>>()
    private val pageJobs = HashMap<Int, Job>()
    private val keyCache = LinkedHashMap<String, List<LiveZapKey>>()
    private var keysJob: Job? = null
    private var countsJob: Job? = null
    private var numberJob: Job? = null
    private var settling = false
    private var generation = 0
    private var currentKey: LiveZapKey? = null

    /** The group column, rebuilt when the library's groups or the counts change. */
    fun groups(allLabel: String, fallbackName: String): List<LiveZapCategory> =
        livePanelGroups(libraryGroups, counts, allLabel, fallbackName)

    /** The library's live groups changed (first load, a sync): cached keys and counts are stale. */
    fun updateLibraryGroups(groups: List<Category>) {
        val changed = libraryGroups.isNotEmpty() && groups != libraryGroups
        libraryGroups = groups
        if (changed) {
            keyCache.clear()
            counts = emptyMap()
        }
    }

    /** The panel opens: on the group CH+/CH- walks, with the playing channel selected. */
    fun open(current: AppMediaItem) {
        currentKey = LiveZapKey(current.serverId, current.id)
        val group = livePanelInitialGroup(source.zapGroupId(), current)
        if (group == loadedGroupId && group == groupId) {
            selectedIndex = keys.indexOf(currentKey).coerceAtLeast(0)
            ensureRows(selectedIndex)
        } else {
            selectGroup(group, settle = false)
        }
        if (counts.isEmpty() && countsJob?.isActive != true) {
            countsJob = scope.launch {
                val loaded = readOrEmpty(emptyMap()) { source.groupCounts() }
                counts = loaded + counts
            }
        }
    }

    /** Highlights [id]; its channels load at once, or after the highlight settles for held keys. */
    fun selectGroup(id: String, settle: Boolean) {
        if (id == groupId && (id == loadedGroupId || keysJob?.isActive == true)) return
        loadGroup(id, settle)
    }

    /** Up/Down in the group column (labels do not matter for the order). */
    fun moveGroup(direction: Int) {
        livePanelGroupAfter(groups("", ""), groupId, direction)?.let { selectGroup(it, settle = true) }
    }

    /** OK in the group column: a highlight still waiting to settle loads now. */
    fun settleGroup() {
        if (settling) loadGroup(groupId, settle = false)
    }

    private fun loadGroup(id: String, settle: Boolean) {
        groupId = id
        keysJob?.cancel()
        val cached = keyCache.remove(id)
        settling = settle && cached == null
        if (cached != null) {
            keyCache[id] = cached
            showGroup(id, cached)
            return
        }
        keysJob = scope.launch {
            if (settle) {
                delay(LIVE_PANEL_GROUP_SETTLE_MS)
                settling = false
            }
            val loaded = readOrEmpty(emptyList()) { source.groupKeys(id) }
            keyCache[id] = loaded
            while (keyCache.size > LIVE_PANEL_KEY_CACHE) keyCache.remove(keyCache.keys.first())
            showGroup(id, loaded)
        }
    }

    /** Up/Down (or CH+/-) in the channel column, wrapping around. */
    fun moveSelection(direction: Int) {
        if (loading || keys.isEmpty()) return
        selectIndex((selectedIndex + direction).floorMod(keys.size))
    }

    fun selectIndex(index: Int) {
        if (index !in keys.indices) return
        selectedIndex = index
        ensureRows(index)
    }

    /** The highlighted channel, or null while its group or row is still loading. */
    fun selectedChannel(): AppMediaItem? = if (loading) null else rowAt(selectedIndex)

    fun rowAt(index: Int): AppMediaItem? = pages[index / LIVE_PANEL_PAGE_SIZE]?.getOrNull(index % LIVE_PANEL_PAGE_SIZE)

    fun isCurrent(index: Int): Boolean = currentKey != null && keys.getOrNull(index) == currentKey

    /** Loads the pages around [index] that are not on hand yet, and forgets far-away ones. */
    fun ensureRows(index: Int) {
        val groupKeys = keys
        val range = livePanelPagesAround(index, groupKeys.size)
        if (range.isEmpty()) return
        val gen = generation
        for (page in range) {
            if (pages.containsKey(page) || pageJobs[page]?.isActive == true) continue
            val from = page * LIVE_PANEL_PAGE_SIZE
            val pageKeys = groupKeys.subList(from, (from + LIVE_PANEL_PAGE_SIZE).coerceAtMost(groupKeys.size))
            pageJobs[page] = scope.launch {
                val rows = readOrEmpty(emptyList()) { source.rows(pageKeys) }
                if (gen != generation) return@launch
                val byKey = rows.associateBy { LiveZapKey(it.serverId, it.id) }
                pages[page] = pageKeys.map { byKey[it] }
                pageJobs.remove(page)
            }
        }
        livePanelPagesToDrop(pages.keys, index / LIVE_PANEL_PAGE_SIZE).forEach { pages.remove(it) }
    }

    /**
     * Looks up a typed channel number in the whole library; [onResult] runs on the main thread
     * unless a newer lookup started or the player closed.
     */
    fun findChannelByNumber(number: Int, onResult: (AppMediaItem?) -> Unit) {
        numberJob?.cancel()
        numberJob = scope.launch {
            onResult(readOrEmpty(null) { source.channelByNumber(number) })
        }
    }

    private fun showGroup(id: String, groupKeys: List<LiveZapKey>) {
        generation++
        pageJobs.values.forEach { it.cancel() }
        pageJobs.clear()
        pages.clear()
        keys = groupKeys
        loadedGroupId = id
        groupId = id
        counts = counts + (id to groupKeys.size)
        selectedIndex = currentKey?.let(groupKeys::indexOf)?.coerceAtLeast(0) ?: 0
        ensureRows(selectedIndex)
    }

    private suspend fun <T> readOrEmpty(empty: T, read: suspend () -> T): T = try {
        read()
    } catch (cancelled: CancellationException) {
        throw cancelled
    } catch (_: Exception) {
        empty
    }
}

/** The session's [LiveBrowser], told about the library's live groups whenever they change. */
@Composable
internal fun rememberLiveBrowser(source: LivePanelSource, libraryGroups: List<Category>): LiveBrowser {
    val scope = rememberCoroutineScope()
    val browser = remember(source) { LiveBrowser(source, scope) }
    LaunchedEffect(browser, libraryGroups) { browser.updateLibraryGroups(libraryGroups) }
    return browser
}
