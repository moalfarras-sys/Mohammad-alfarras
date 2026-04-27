package com.mo.moplayer.data.repository

import com.mo.moplayer.data.local.dao.WatchHistoryDao
import com.mo.moplayer.data.local.entity.WatchHistoryEntity
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WatchHistoryRepository @Inject constructor(
    private val watchHistoryDao: WatchHistoryDao
) {

    fun getContinueWatchingFlow(): Flow<List<WatchHistoryEntity>> {
        return watchHistoryDao.getContinueWatching(20)
    }

    fun getRecentHistoryFlow(limit: Int = 20): Flow<List<WatchHistoryEntity>> {
        return watchHistoryDao.getRecentHistory(limit)
    }

    suspend fun getWatchHistory(contentId: String): WatchHistoryEntity? {
        return watchHistoryDao.getHistoryForContent(contentId)
    }
    
    fun observeWatchHistory(contentId: String): Flow<WatchHistoryEntity?> {
        return watchHistoryDao.observeHistoryForContent(contentId)
    }

    suspend fun updateWatchProgress(
        contentId: String,
        type: String,
        name: String,
        posterUrl: String?,
        positionMs: Long,
        durationMs: Long,
        seasonNumber: Int? = null,
        episodeNumber: Int? = null,
        seriesId: String? = null,
        seriesName: String? = null
    ) {
        val id = "${contentId}_$type"
        
        // Mark as completed if watched more than 95%
        val completed = if (durationMs > 0) {
            (positionMs.toFloat() / durationMs.toFloat()) >= 0.95f
        } else false

        val history = WatchHistoryEntity(
            id = id,
            contentId = contentId,
            type = type,
            name = name,
            posterUrl = posterUrl,
            positionMs = positionMs,
            durationMs = durationMs,
            completed = completed,
            lastWatched = System.currentTimeMillis(),
            seasonNumber = seasonNumber,
            episodeNumber = episodeNumber,
            seriesId = seriesId,
            seriesName = seriesName
        )

        watchHistoryDao.insertOrUpdate(history)
    }

    suspend fun markAsCompleted(contentId: String, type: String) {
        // We need to fetch it first to update it, or just use update query if we have fields
        // But dao.updateProgress requires position.
        // Let's just update the specific entry if it exists
        val current = getWatchHistory(contentId)
        if (current != null) {
            watchHistoryDao.updateProgress(
                contentId = contentId,
                position = current.durationMs, // Set position to end
                completed = true
            )
        }
    }

    suspend fun removeFromHistory(contentId: String, type: String) {
        val id = "${contentId}_$type"
        watchHistoryDao.deleteById(id)
    }
    
    suspend fun clearHistory() {
        watchHistoryDao.clearAllHistory()
    }
}
