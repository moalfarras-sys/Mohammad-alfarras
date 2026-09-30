package com.moalfarras.moplayer.ui.player

import com.moalfarras.moplayer.data.repository.LiveZapKey
import com.moalfarras.moplayer.domain.model.Category
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class LivePanelTest {

    private fun channel(id: String, categoryId: String, number: Int = Int.MAX_VALUE, serverId: Long = 1L) = MediaItem(
        id = id,
        serverId = serverId,
        type = ContentType.LIVE,
        categoryId = categoryId,
        title = "Channel $id",
        streamUrl = "http://example.test/live/$id.ts",
        serverOrder = number,
    )

    private fun category(id: String, name: String = "Group $id", serverId: Long = 1L) =
        Category(id = id, serverId = serverId, type = ContentType.LIVE, name = name)

    /** A library of live groups in memory that records what the panel reads. */
    private class FakeSource(
        val groups: Map<String, List<MediaItem>>,
        var zapGroup: String? = null,
    ) : LivePanelSource {
        val keyReads = mutableListOf<String>()
        val rowReads = mutableListOf<Int>()
        var removed = emptySet<String>()
        val played = mutableListOf<Pair<String, String>>()

        private val all get() = groups.values.flatten()

        override fun zapGroupId(): String? = zapGroup

        override suspend fun groupKeys(groupId: String): List<LiveZapKey> {
            keyReads += groupId
            val channels = if (groupId.isEmpty()) all else groups[groupId].orEmpty()
            return channels.map { LiveZapKey(it.serverId, it.id) }
        }

        override suspend fun rows(keys: List<LiveZapKey>): List<MediaItem> {
            rowReads += keys.size
            val byKey = all.associateBy { LiveZapKey(it.serverId, it.id) }
            return keys.mapNotNull { byKey[it] }.filterNot { it.id in removed }
        }

        override suspend fun groupCounts(): Map<String, Int> =
            groups.mapValues { it.value.size } + ("" to all.size)

        override suspend fun channelByNumber(number: Int): MediaItem? = all.firstOrNull { it.serverOrder == number }

        override fun playInGroup(item: MediaItem, groupId: String) {
            played += item.id to groupId
        }
    }

    private fun TestScope.browserFor(source: FakeSource) = LiveBrowser(source, this)

    // ── Pure helpers ─────────────────────────────────────────────────────────────────────────

    @Test
    fun thePanelOpensOnTheGroupZappingWalks() {
        val playing = channel("7", "news")
        assertEquals("sports", livePanelInitialGroup("sports", playing))
        assertEquals(LIVE_PANEL_ALL_GROUP, livePanelInitialGroup(LIVE_PANEL_ALL_GROUP, playing))
        // Favorites, search or a list still loading: the channel's own group.
        assertEquals("news", livePanelInitialGroup(null, playing))
        assertEquals(LIVE_PANEL_ALL_GROUP, livePanelInitialGroup(null, channel("8", "")))
    }

    @Test
    fun groupColumnListsAllChannelsFirstThenEveryGroupOnce() {
        val groups = livePanelGroups(
            library = listOf(category("1", "News"), category("2", ""), category("1", "News", serverId = 2L)),
            counts = mapOf("" to 30, "1" to 12),
            allLabel = "All channels",
            fallbackName = "Live TV",
        )
        assertEquals(listOf("", "1", "2"), groups.map { it.id })
        assertEquals(listOf("All channels", "News", "Live TV"), groups.map { it.name })
        // Unknown counts are not shown as 0.
        assertEquals(listOf(30, 12, -1), groups.map { it.count })
        assertEquals(-1, livePanelGroups(emptyList(), emptyMap(), "All", "Live").single().count)
    }

    @Test
    fun groupNavigationWrapsAndStartsAtTheTopWhenTheGroupIsNotListed() {
        val groups = livePanelGroups(listOf(category("a"), category("b")), emptyMap(), "All", "Live")
        assertEquals("a", livePanelGroupAfter(groups, "", 1))
        assertEquals("b", livePanelGroupAfter(groups, "", -1))
        assertEquals("", livePanelGroupAfter(groups, "b", 1))
        assertEquals("", livePanelGroupAfter(groups, "hidden", 1))
        assertNull(livePanelGroupAfter(emptyList(), "a", 1))
    }

    @Test
    fun onlyThePagesAroundTheSelectionAreLoaded() {
        assertEquals(0..1, livePanelPagesAround(0, 30_000))
        assertEquals(307..309, livePanelPagesAround(12_345, 30_000))
        assertEquals(748..749, livePanelPagesAround(29_999, 30_000))
        assertEquals(0..0, livePanelPagesAround(5, 12))
        assertTrue(livePanelPagesAround(0, 0).isEmpty())
    }

    @Test
    fun farawayPagesAreDroppedFirst() {
        assertEquals(emptyList<Int>(), livePanelPagesToDrop(listOf(1, 2, 3), keepPage = 2, maxPages = 3))
        assertEquals(listOf(40, 0), livePanelPagesToDrop(listOf(0, 9, 10, 11, 40), keepPage = 10, maxPages = 3))
    }

    // ── Browser ──────────────────────────────────────────────────────────────────────────────

    @Test
    fun openingSelectsThePlayingChannelInItsZapGroup() = runTest {
        val news = (1..5).map { channel("n$it", "news", number = it) }
        val sports = (1..3).map { channel("s$it", "sports", number = 100 + it) }
        val source = FakeSource(mapOf("news" to news, "sports" to sports), zapGroup = "news")
        val browser = browserFor(source)

        browser.open(news[3])
        assertTrue(browser.loading)
        assertNull(browser.selectedChannel())
        advanceUntilIdle()

        assertFalse(browser.loading)
        assertEquals("news", browser.loadedGroupId)
        assertEquals(5, browser.channelCount)
        assertEquals(3, browser.selectedIndex)
        assertEquals("n4", browser.selectedChannel()?.id)
        assertTrue(browser.isCurrent(3))
        assertEquals(mapOf("news" to 5, "sports" to 3, "" to 8), browser.counts)
    }

    @Test
    fun anyGroupCanBeBrowsedAndItsChannelPlayedFromThePanel() = runTest {
        val news = (1..5).map { channel("n$it", "news") }
        val sports = (1..3).map { channel("s$it", "sports") }
        val source = FakeSource(mapOf("news" to news, "sports" to sports), zapGroup = "news")
        val browser = browserFor(source)
        browser.updateLibraryGroups(listOf(category("news"), category("sports")))
        browser.open(news[0])
        advanceUntilIdle()

        browser.moveGroup(1) // news -> sports
        assertEquals("sports", browser.groupId)
        // Nothing moves or plays in the old group while the new one settles.
        browser.moveSelection(1)
        assertNull(browser.selectedChannel())
        advanceUntilIdle()

        assertEquals("sports", browser.loadedGroupId)
        // The playing channel is not in this group: the first row is selected.
        assertEquals(0, browser.selectedIndex)
        browser.moveSelection(-1)
        assertEquals("s3", browser.selectedChannel()?.id)
        browser.moveSelection(1)
        assertEquals("s1", browser.selectedChannel()?.id)
    }

    @Test
    fun heldKeysInTheGroupColumnLoadOnlyTheGroupTheyStopOn() = runTest {
        val groups = ('a'..'e').associate { id -> id.toString() to listOf(channel("$id-1", id.toString())) }
        val source = FakeSource(groups, zapGroup = "a")
        val browser = browserFor(source)
        browser.updateLibraryGroups(groups.keys.map { category(it) })
        browser.open(groups.getValue("a").first())
        advanceUntilIdle()
        source.keyReads.clear()

        repeat(3) {
            browser.moveGroup(1)
            advanceTimeBy(40)
        }
        assertEquals("d", browser.groupId)
        assertTrue(source.keyReads.isEmpty())
        advanceUntilIdle()
        assertEquals(listOf("d"), source.keyReads)

        // OK on a group that is still settling loads it at once.
        browser.moveGroup(1)
        browser.settleGroup()
        runCurrent()
        assertEquals("e", browser.loadedGroupId)
    }

    @Test
    fun aHugeGroupIsNeverLoadedWhole() = runTest {
        val all = (0 until 30_000).map { channel("c$it", "big", number = it + 1) }
        val source = FakeSource(mapOf("big" to all), zapGroup = LIVE_PANEL_ALL_GROUP)
        val browser = browserFor(source)
        val playing = all.first { it.id == "c12345" }

        browser.open(playing)
        advanceUntilIdle()
        assertEquals(30_000, browser.channelCount)
        assertEquals("c12345", browser.selectedChannel()?.id)
        assertTrue(source.rowReads.sum() <= 3 * LIVE_PANEL_PAGE_SIZE)

        // Zapping through the list only fetches the page ahead.
        repeat(200) { browser.moveSelection(1) }
        advanceUntilIdle()
        assertEquals("c12545", browser.selectedChannel()?.id)
        assertTrue(source.rowReads.sum() <= 10 * LIVE_PANEL_PAGE_SIZE)

        // Wrapping from the first row lands on the last one.
        browser.selectIndex(0)
        advanceUntilIdle()
        browser.moveSelection(-1)
        advanceUntilIdle()
        assertEquals("c29999", browser.selectedChannel()?.id)
        assertTrue((0 until 30_000 step LIVE_PANEL_PAGE_SIZE).count { browser.rowAt(it) != null } <= LIVE_PANEL_MAX_PAGES)
    }

    @Test
    fun aChannelRemovedSinceTheKeysWereReadLeavesAGapNotAShift() = runTest {
        val news = (1..4).map { channel("n$it", "news") }
        val source = FakeSource(mapOf("news" to news), zapGroup = "news").apply { removed = setOf("n2") }
        val browser = browserFor(source)
        browser.open(news[0])
        advanceUntilIdle()
        assertEquals("n1", browser.rowAt(0)?.id)
        assertNull(browser.rowAt(1))
        assertEquals("n3", browser.rowAt(2)?.id)
    }

    @Test
    fun reopeningKeepsTheLoadedGroupAndSelectsThePlayingChannelAgain() = runTest {
        val news = (1..5).map { channel("n$it", "news") }
        val source = FakeSource(mapOf("news" to news), zapGroup = "news")
        val browser = browserFor(source)
        browser.open(news[0])
        advanceUntilIdle()
        browser.open(news[4])
        advanceUntilIdle()
        assertEquals(listOf("news"), source.keyReads)
        assertEquals(4, browser.selectedIndex)
    }

    @Test
    fun aLibraryChangeForgetsCachedGroups() = runTest {
        val news = listOf(channel("n1", "news"))
        val sports = listOf(channel("s1", "sports"))
        val source = FakeSource(mapOf("news" to news, "sports" to sports), zapGroup = "news")
        val browser = browserFor(source)
        browser.updateLibraryGroups(listOf(category("news"), category("sports")))
        browser.open(news[0])
        advanceUntilIdle()
        browser.selectGroup("sports", settle = false)
        advanceUntilIdle()
        browser.selectGroup("news", settle = false)
        advanceUntilIdle()
        assertEquals(listOf("news", "sports"), source.keyReads)

        browser.updateLibraryGroups(listOf(category("news"), category("sports"), category("kids")))
        browser.selectGroup("sports", settle = false)
        advanceUntilIdle()
        assertEquals(listOf("news", "sports", "sports"), source.keyReads)
    }

    @Test
    fun aLibraryChangeWhileAGroupIsShownReadsItAgain() = runTest {
        val news = mutableListOf(channel("n1", "news"))
        val source = FakeSource(mapOf("news" to news), zapGroup = "news")
        val browser = browserFor(source)
        browser.updateLibraryGroups(listOf(category("news")))
        browser.open(news[0])
        advanceUntilIdle()
        assertEquals(1, browser.channelCount)

        news += channel("n2", "news")
        browser.updateLibraryGroups(listOf(category("news", name = "News HD")))
        advanceUntilIdle()
        assertEquals(2, browser.channelCount)
        assertEquals("n1", browser.selectedChannel()?.id)
        assertEquals(2, browser.counts["news"])
    }

    @Test
    fun aTappedGroupDoesNotWaitForASettlingHighlight() = runTest {
        val groups = mapOf("a" to listOf(channel("a1", "a")), "b" to listOf(channel("b1", "b")))
        val source = FakeSource(groups, zapGroup = "a")
        val browser = browserFor(source)
        browser.updateLibraryGroups(listOf(category("a"), category("b")))
        browser.open(groups.getValue("a").first())
        advanceUntilIdle()
        browser.moveGroup(1)
        browser.selectGroup("b", settle = false)
        runCurrent()
        assertEquals("b", browser.loadedGroupId)
        advanceUntilIdle()
        assertEquals("b1", browser.selectedChannel()?.id)
    }

    @Test
    fun typedNumbersAreLookedUpInTheWholeLibrary() = runTest {
        val source = FakeSource(mapOf("news" to listOf(channel("n1", "news", number = 11)), "sports" to listOf(channel("s1", "sports", number = 42))))
        val browser = browserFor(source)
        var found: MediaItem? = null
        var answered = false
        browser.findChannelByNumber(42) { found = it; answered = true }
        advanceUntilIdle()
        assertTrue(answered)
        assertEquals("s1", found?.id)
        browser.findChannelByNumber(7) { found = it }
        advanceUntilIdle()
        assertNull(found)
    }
}
