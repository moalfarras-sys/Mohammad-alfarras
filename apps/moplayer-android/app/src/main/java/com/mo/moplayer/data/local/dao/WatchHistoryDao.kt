package com.mo.moplayer.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.mo.moplayer.data.local.entity.WatchHistoryEntity
import kotlinx.coroutines.flow.Flow

/**
 * DAO for watch history operations
 */
@Dao
interface WatchHistoryDao {
    
    /**
     * Insert or update a watch history entry
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(entry: WatchHistoryEntity)
    
    /**
     * Get all watch history entries, ordered by most recent
     */
    @Query("SELECT * FROM watch_history ORDER BY lastWatched DESC")
    fun getAllHistory(): Flow<List<WatchHistoryEntity>>
    
    /**
     * Get recent history (limited to last N items)
     */
    @Query("SELECT * FROM watch_history ORDER BY lastWatched DESC LIMIT :limit")
    fun getRecentHistory(limit: Int = 20): Flow<List<WatchHistoryEntity>>
    
    /**
     * Get history entry for specific content
     */
    @Query("SELECT * FROM watch_history WHERE contentId = :contentId LIMIT 1")
    suspend fun getHistoryForContent(contentId: String): WatchHistoryEntity?
    
    /**
     * Get history for a specific content as Flow
     */
    @Query("SELECT * FROM watch_history WHERE contentId = :contentId LIMIT 1")
    fun observeHistoryForContent(contentId: String): Flow<WatchHistoryEntity?>
    
    /**
     * Get "continue watching" items (progress between 5% and 95%)
     * Calculated as positionMs / durationMs
     */
    @Query("""
        SELECT * FROM watch_history 
        WHERE (CAST(positionMs AS FLOAT) / durationMs) > 0.05 
        AND (CAST(positionMs AS FLOAT) / durationMs) < 0.95
        AND completed = 0
        ORDER BY lastWatched DESC 
        LIMIT :limit
    """)
    fun getContinueWatching(limit: Int = 10): Flow<List<WatchHistoryEntity>>
    
    /**
     * Get recently completed items (progress >= 95% or completed=1)
     */
    @Query("""
        SELECT * FROM watch_history 
        WHERE completed = 1 OR (CAST(positionMs AS FLOAT) / durationMs) >= 0.95
        ORDER BY lastWatched DESC 
        LIMIT :limit
    """)
    fun getRecentlyCompleted(limit: Int = 10): Flow<List<WatchHistoryEntity>>
    
    /**
     * Delete specific history entry
     */
    @Query("DELETE FROM watch_history WHERE id = :id")
    suspend fun deleteById(id: String)
    
    /**
     * Delete history for specific content
     */
    @Query("DELETE FROM watch_history WHERE contentId = :contentId")
    suspend fun deleteByContentId(contentId: String)
    
    /**
     * Clear all history
     */
    @Query("DELETE FROM watch_history")
    suspend fun clearAllHistory()
    
    /**
     * Delete old history entries (older than given timestamp)
     */
    @Query("DELETE FROM watch_history WHERE lastWatched < :timestamp")
    suspend fun deleteOlderThan(timestamp: Long)
    
    /**
     * Update playback position for content
     */
    @Query("""
        UPDATE watch_history 
        SET positionMs = :position, 
            lastWatched = :lastWatched,
            completed = :completed
        WHERE contentId = :contentId
    """)
    suspend fun updateProgress(
        contentId: String,
        position: Long,
        completed: Boolean,
        lastWatched: Long = System.currentTimeMillis()
    )
    
    /**
     * Get history count
     */
    @Query("SELECT COUNT(*) FROM watch_history")
    suspend fun getHistoryCount(): Int
    
    /**
     * Search history by title (name)
     */
    @Query("SELECT * FROM watch_history WHERE name LIKE '%' || :query || '%' ORDER BY lastWatched DESC")
    fun searchHistory(query: String): Flow<List<WatchHistoryEntity>>

    @Query(
        """
        SELECT * FROM watch_history
        WHERE name LIKE '%' || :query || '%'
        ORDER BY lastWatched DESC
        LIMIT :limit
        """
    )
    suspend fun searchHistoryNow(query: String, limit: Int = 50): List<WatchHistoryEntity>
}
