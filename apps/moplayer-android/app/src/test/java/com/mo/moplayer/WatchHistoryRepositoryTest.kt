package com.mo.moplayer

import com.mo.moplayer.data.local.dao.WatchHistoryDao
import com.mo.moplayer.data.local.entity.WatchHistoryEntity
import com.mo.moplayer.data.repository.WatchHistoryRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

/**
 * Unit tests for WatchHistoryRepository.
 */
class WatchHistoryRepositoryTest {

    private lateinit var watchHistoryDao: WatchHistoryDao
    private lateinit var repository: WatchHistoryRepository

    @Before
    fun setup() {
        watchHistoryDao = mockk(relaxed = true)
        repository = WatchHistoryRepository(watchHistoryDao)
    }

    @Test
    fun `getWatchHistory returns entity when dao has history`() = runTest {
        val entity = createWatchHistoryEntity(contentId = "movie_123")
        coEvery { watchHistoryDao.getHistoryForContent("movie_123") } returns entity

        val result = repository.getWatchHistory("movie_123")

        assertEquals(entity, result)
    }

    @Test
    fun `getWatchHistory returns null when dao has no history`() = runTest {
        coEvery { watchHistoryDao.getHistoryForContent("movie_456") } returns null

        val result = repository.getWatchHistory("movie_456")

        assertNull(result)
    }

    @Test
    fun `updateWatchProgress inserts entity with correct id format`() = runTest {
        coEvery { watchHistoryDao.insertOrUpdate(any()) } returns Unit

        repository.updateWatchProgress(
            contentId = "movie_123",
            type = "movie",
            name = "Test Movie",
            posterUrl = "http://example.com/poster.jpg",
            positionMs = 60000L,
            durationMs = 7200000L
        )

        coVerify {
            watchHistoryDao.insertOrUpdate(match { entity ->
                entity.id == "movie_123_movie" &&
                    entity.contentId == "movie_123" &&
                    entity.type == "movie" &&
                    entity.name == "Test Movie" &&
                    entity.positionMs == 60000L &&
                    entity.durationMs == 7200000L
            })
        }
    }

    @Test
    fun `updateWatchProgress marks as completed when progress at 95 percent`() = runTest {
        coEvery { watchHistoryDao.insertOrUpdate(any()) } returns Unit

        repository.updateWatchProgress(
            contentId = "movie_123",
            type = "movie",
            name = "Test Movie",
            posterUrl = null,
            positionMs = 6840000L, // 95% of 7200000
            durationMs = 7200000L
        )

        coVerify {
            watchHistoryDao.insertOrUpdate(match { entity ->
                entity.completed
            })
        }
    }

    @Test
    fun `removeFromHistory deletes with correct id`() = runTest {
        coEvery { watchHistoryDao.deleteById(any()) } returns Unit

        repository.removeFromHistory("movie_123", "movie")

        coVerify { watchHistoryDao.deleteById("movie_123_movie") }
    }

    @Test
    fun `clearHistory calls dao clearAllHistory`() = runTest {
        coEvery { watchHistoryDao.clearAllHistory() } returns Unit

        repository.clearHistory()

        coVerify { watchHistoryDao.clearAllHistory() }
    }

    private fun createWatchHistoryEntity(
        contentId: String = "movie_123",
        id: String = "movie_123_movie"
    ) = WatchHistoryEntity(
        id = id,
        contentId = contentId,
        type = "movie",
        name = "Test Movie",
        posterUrl = null,
        positionMs = 60000L,
        durationMs = 7200000L,
        completed = false,
        lastWatched = System.currentTimeMillis(),
        seasonNumber = null,
        episodeNumber = null,
        seriesId = null,
        seriesName = null
    )
}
