package com.mo.moplayer

import androidx.room.Room
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mo.moplayer.data.local.MoPlayerDatabase
import com.mo.moplayer.data.local.entity.WatchHistoryEntity
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class HomeResumeHistoryTest {
    @Test fun shortVodProgressAppearsButLiveAndCompletedContentDoNot() = withDatabase { db ->
        val dao = db.watchHistoryDao()
        dao.insertOrUpdate(entry("movie", "MOVIE", 10_000, 7_200_000))
        dao.insertOrUpdate(entry("channel", "CHANNEL", 30_000, 120_000))
        dao.insertOrUpdate(entry("live", "LIVE", 30_000, 120_000))
        dao.insertOrUpdate(entry("finished", "MOVIE", 119_000, 120_000, completed = true))
        assertEquals(listOf("movie"), dao.getHomeContinueWatching().first().map { it.contentId })
    }

    @Test fun latestEpisodeWinsAndCompletingItDoesNotReviveAnOlderEpisode() = withDatabase { db ->
        val dao = db.watchHistoryDao()
        dao.insertOrUpdate(entry("episode1", "EPISODE", 30_000, 120_000, watched = 1, series = "series"))
        dao.insertOrUpdate(entry("episode2", "EPISODE", 40_000, 120_000, watched = 2, series = "series"))
        assertEquals(listOf("episode2"), dao.getHomeContinueWatching().first().map { it.contentId })
        dao.insertOrUpdate(entry("episode2", "EPISODE", 119_000, 120_000, watched = 3, series = "series", completed = true))
        assertTrue(dao.getHomeContinueWatching().first().isEmpty())
    }

    @Test fun existingResumeItemReceivesUpdatedProgressAndHomeIsBounded() = withDatabase { db ->
        val dao = db.watchHistoryDao()
        repeat(25) { dao.insertOrUpdate(entry("movie$it", "MOVIE", 30_000, 120_000, watched = it.toLong())) }
        assertEquals(12, dao.getHomeContinueWatching().first().size)
        dao.insertOrUpdate(entry("movie24", "MOVIE", 60_000, 120_000, watched = 100))
        val latest = dao.getHomeContinueWatching().first().first()
        assertEquals("movie24", latest.contentId)
        assertEquals(60_000L, latest.positionMs)
    }

    private fun withDatabase(test: suspend (MoPlayerDatabase) -> Unit) = runBlocking {
        val db = Room.inMemoryDatabaseBuilder(InstrumentationRegistry.getInstrumentation().targetContext,
            MoPlayerDatabase::class.java).build()
        try { test(db) } finally { db.close() }
    }

    private fun entry(id: String, type: String, position: Long, duration: Long, watched: Long = 1,
                      series: String? = null, completed: Boolean = false) = WatchHistoryEntity(
        id = "${id}_$type", contentId = id, type = type, name = id, posterUrl = null,
        positionMs = position, durationMs = duration, completed = completed,
        lastWatched = watched, seriesId = series)
}
