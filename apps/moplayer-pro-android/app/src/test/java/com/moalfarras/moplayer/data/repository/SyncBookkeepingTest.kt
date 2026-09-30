package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.data.db.MediaStateSnapshot
import com.moalfarras.moplayer.data.db.toEntity
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

class SyncBookkeepingTest {
    private val hour = 60L * 60L * 1000L

    @Test
    fun syncMetaRoundTripsAndReadsLegacyJson() {
        val meta = SyncMeta(playlistHash = "abc", parserVersion = 2)
            .withFailure("MOVIE", SyncErrorKind.TIMEOUT, now = 1_000L)
            .withFailure("MOVIE", SyncErrorKind.TIMEOUT, now = 2_000L)
            .withSuccess("LIVE", 30_000)
            .withEpgFailure(SyncErrorKind.CONNECTION_LOST, now = 3_000L)

        val decoded = SyncMeta.decode(meta.encode())

        assertEquals(meta, decoded)
        assertEquals(2, decoded.failures.getValue("MOVIE").count)
        assertEquals(30_000, decoded.counts["LIVE"])

        val legacy = SyncMeta.decode("""{"source":"m3u","playlistHash":"f00","items":5,"epg":0}""")
        assertEquals("f00", legacy.playlistHash)
        assertEquals(0, legacy.parserVersion)
        assertTrue(legacy.failures.isEmpty())

        assertEquals(SyncMeta(), SyncMeta.decode("""{"phase":"Loading live channels","categories":3,"media":10}"""))
        assertEquals(SyncMeta(), SyncMeta.decode("not json"))
        assertEquals(SyncMeta(), SyncMeta.decode(null))
    }

    @Test
    fun successClearsTheSectionFailure() {
        val meta = SyncMeta().withFailure("SERIES", SyncErrorKind.SERVER_ERROR, 1L).withSuccess("SERIES", 12)
        assertTrue(meta.failures.isEmpty())
    }

    @Test
    fun failureBackoffGrowsAndIsCapped() {
        assertEquals(0L, syncBackoffMs(0))
        assertEquals(hour / 2, syncBackoffMs(1))
        assertEquals(hour, syncBackoffMs(2))
        assertEquals(2 * hour, syncBackoffMs(3))
        assertEquals(6 * hour, syncBackoffMs(10))
    }

    @Test
    fun sectionsSyncWhenStaleAndNotBackingOff() {
        val now = 100 * hour
        val staleAfter = 3 * hour
        assertTrue(sectionNeedsSync(0L, null, now, staleAfter, respectBackoff = true))
        assertFalse(sectionNeedsSync(now - hour, null, now, staleAfter, respectBackoff = true))
        assertTrue(sectionNeedsSync(now - 4 * hour, null, now, staleAfter, respectBackoff = true))

        val recentFailure = FailureRecord(count = 2, at = now - hour / 2, kind = "TIMEOUT")
        assertFalse(sectionNeedsSync(0L, recentFailure, now, staleAfter, respectBackoff = true))
        assertTrue(sectionNeedsSync(0L, recentFailure, now, staleAfter, respectBackoff = false))
        val oldFailure = FailureRecord(count = 2, at = now - 2 * hour, kind = "TIMEOUT")
        assertTrue(sectionNeedsSync(0L, oldFailure, now, staleAfter, respectBackoff = true))

        // A sync stamped in the future (device clock reset) counts as stale instead of blocking forever.
        assertTrue(isStale(now + 3 * 24 * hour, now, staleAfter))
    }

    @Test
    fun userStateIsCarriedOntoFreshRows() {
        val fresh = listOf(
            MediaItem(id = "1", serverId = 7, type = ContentType.MOVIE, categoryId = "c", title = "New title", streamUrl = "u1").toEntity(),
            MediaItem(id = "2", serverId = 7, type = ContentType.MOVIE, categoryId = "c", title = "Other", streamUrl = "u2").toEntity(),
        )
        val states = mapOf(
            stateKey(ContentType.MOVIE, "1") to MediaStateSnapshot("1", ContentType.MOVIE, true, 60_000L, 5_400_000L, 1_234L),
            stateKey(ContentType.LIVE, "2") to MediaStateSnapshot("2", ContentType.LIVE, true, 0L, 0L, 9L),
        )

        val merged = applyUserState(fresh, states)

        assertEquals("New title", merged[0].title)
        assertTrue(merged[0].isFavorite)
        assertEquals(60_000L, merged[0].watchPositionMs)
        assertEquals(5_400_000L, merged[0].watchDurationMs)
        assertEquals(1_234L, merged[0].lastPlayedAt)
        assertFalse(merged[1].isFavorite)
        assertSame(fresh, applyUserState(fresh, emptyMap()))
    }

    @Test
    fun missingStateLeavesRowsUntouched() {
        val row = MediaItem(id = "9", serverId = 1, type = ContentType.LIVE, categoryId = "", title = "T", streamUrl = "u").toEntity()
        assertSame(row, applyUserState(listOf(row), mapOf("LIVE:other" to MediaStateSnapshot("other", ContentType.LIVE, true, 0, 0, 0)))[0])
    }
}
