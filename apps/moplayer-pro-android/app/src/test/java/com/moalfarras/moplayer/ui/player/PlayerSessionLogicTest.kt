package com.moalfarras.moplayer.ui.player

import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.ui.i18n.ArStrings
import com.moalfarras.moplayer.ui.i18n.EnStrings
import com.moalfarras.moplayer.ui.i18n.ltr
import com.moalfarras.moplayer.ui.i18n.player
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PlayerSessionLogicTest {

    // ── One Media3 player per session: stale events ──────────────────────────────────────────

    @Test
    fun eventsOfTheLatestLoadReachTheScreen() {
        val load = media3LoadId("chan-1", 3)
        assertFalse(isStaleMedia3Event(load, load))
    }

    @Test
    fun eventsOfThePreviousChannelAreDropped() {
        assertTrue(isStaleMedia3Event(media3LoadId("chan-1", 1), media3LoadId("chan-2", 2)))
    }

    @Test
    fun eventsOfAnEarlierLoadOfTheSameChannelAreDropped() {
        // A format swap, redirect or retry re-opens the same item: its old link's events are stale too.
        assertTrue(isStaleMedia3Event(media3LoadId("chan-1", 1), media3LoadId("chan-1", 2)))
    }

    @Test
    fun eventsWithoutAKnownSourceOrBeforeAnyLoadAreDropped() {
        assertTrue(isStaleMedia3Event(null, media3LoadId("chan-1", 1)))
        assertTrue(isStaleMedia3Event(media3LoadId("chan-1", 1), null))
        assertTrue(isStaleMedia3Event(null, null))
    }

    @Test
    fun loadIdsAreDistinctPerItemAndLoad() {
        assertNotEquals(media3LoadId("1", 12), media3LoadId("11", 2))
        assertNotEquals(media3LoadId("chan", 1), media3LoadId("chan", 2))
        assertEquals(media3LoadId("chan", 1), media3LoadId("chan", 1))
    }

    // ── Next episode ─────────────────────────────────────────────────────────────────────────

    private fun episode(id: String, season: Int, number: Int, title: String = "Episode $number", serverId: Long = 1L) = MediaItem(
        id = id,
        serverId = serverId,
        type = ContentType.EPISODE,
        categoryId = "",
        title = title,
        streamUrl = "http://host/series/u/p/$id.mkv",
        seriesId = "series-1",
        seasonNumber = season,
        episodeNumber = number,
    )

    @Test
    fun nextEpisodeFollowsEpisodeOrderWithinASeason() {
        val episodes = listOf(episode("a", 1, 1), episode("b", 1, 2), episode("c", 1, 3))
        assertEquals("b", nextEpisodeIn(episodes, episodes[0])?.id)
        assertEquals("c", nextEpisodeIn(episodes, episodes[1])?.id)
    }

    @Test
    fun nextEpisodeCrossesIntoTheNextSeason() {
        val episodes = listOf(episode("s1e1", 1, 1), episode("s1e2", 1, 2), episode("s2e1", 2, 1))
        assertEquals("s2e1", nextEpisodeIn(episodes, episodes[1])?.id)
    }

    @Test
    fun lastEpisodeHasNoNext() {
        val episodes = listOf(episode("s1e1", 1, 1), episode("s2e1", 2, 1))
        assertNull(nextEpisodeIn(episodes, episodes[1]))
    }

    @Test
    fun episodeMissingFromTheListHasNoNext() {
        val episodes = listOf(episode("a", 1, 1), episode("b", 1, 2))
        assertNull(nextEpisodeIn(episodes, episode("z", 1, 5)))
        assertNull(nextEpisodeIn(emptyList(), episode("a", 1, 1)))
    }

    @Test
    fun nextEpisodeSortsAnUnorderedList() {
        val e3 = episode("e3", 2, 1)
        val e1 = episode("e1", 1, 1)
        val e2 = episode("e2", 1, 10)
        val list = listOf(e3, e2, e1)
        assertEquals("e2", nextEpisodeIn(list, e1)?.id)
        assertEquals("e3", nextEpisodeIn(list, e2)?.id)
    }

    @Test
    fun seasonZeroIsPlayedWithSeasonOneLikeTheSeriesScreenListsIt() {
        // The series screen shows season 0 inside season 1 (library order: season 0 rows first).
        val special = episode("sp", 0, 1)
        val s1e1 = episode("s1e1", 1, 1)
        val s2e1 = episode("s2e1", 2, 1)
        val list = listOf(special, s1e1, s2e1)
        assertEquals("s1e1", nextEpisodeIn(list, special)?.id)
        assertEquals("s2e1", nextEpisodeIn(list, s1e1)?.id)
    }

    @Test
    fun episodesWithoutNumbersKeepTheLibraryOrder() {
        val list = listOf(episode("x", 1, 0, "Pilot"), episode("y", 1, 0, "Second"), episode("z", 1, 0, "Third"))
        assertEquals("y", nextEpisodeIn(list, list[0])?.id)
        assertEquals("z", nextEpisodeIn(list, list[1])?.id)
    }

    @Test
    fun nextEpisodeMatchesTheCurrentOneOnTheSameServerOnly() {
        val other = episode("a", 1, 1, serverId = 2L)
        val list = listOf(episode("a", 1, 1), episode("b", 1, 2))
        assertNull(nextEpisodeIn(list, other))
    }

    @Test
    fun nextEpisodeIsReadOnceFromTheLibraryFlow() = runBlocking {
        val list = listOf(episode("a", 1, 1), episode("b", 1, 2))
        assertEquals("b", nextEpisodeFrom(flowOf(list, emptyList()), list[0])?.id)
    }

    @Test
    fun episodeCodeLabelIsLocalizedAndSkipsMissingNumbers() {
        assertEquals("S${"2".ltr()} E${"5".ltr()}", EnStrings.player.episodeCodeLabel(episode("a", 2, 5)))
        assertEquals("الموسم ${"2".ltr()} · الحلقة ${"5".ltr()}", ArStrings.player.episodeCodeLabel(episode("a", 2, 5)))
        // Season 0 is shown as season 1, as on the series screen.
        assertEquals("S${"1".ltr()} E${"3".ltr()}", EnStrings.player.episodeCodeLabel(episode("a", 0, 3)))
        assertNull(EnStrings.player.episodeCodeLabel(episode("a", 1, 0)))
    }

    // ── Zap latency log ──────────────────────────────────────────────────────────────────────

    @Test
    fun zapLatencyLineReportsEachLegAndWhetherThePlayerWasReused() {
        val line = zapLatencyLine("LIVE 7 'News'", keyAt = 1_000L, committedAt = 1_350L, frameAt = 2_100L, playerReused = true)
        assertEquals(
            "LIVE 7 'News': key->frame 1100 ms (key->commit 350 ms, commit->frame 750 ms) engine=Media3 playerReused=true",
            line,
        )
        assertTrue(zapLatencyLine("x", 0L, 0L, 5L, playerReused = null).endsWith("engine=LibVLC playerReused=n/a"))
    }
}
