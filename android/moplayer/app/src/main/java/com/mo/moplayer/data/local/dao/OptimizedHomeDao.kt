package com.mo.moplayer.data.local.dao

import androidx.room.Dao
import androidx.room.Query
import com.mo.moplayer.data.local.entity.MovieEntity
import com.mo.moplayer.data.local.entity.SeriesEntity
import com.mo.moplayer.data.local.entity.ChannelEntity
import kotlinx.coroutines.flow.Flow

/**
 * Optimized queries for Home Screen
 * Uses composite indices for fast retrieval
 */
@Dao
interface OptimizedHomeDao {

    /**
     * Get recently added movies with LIMIT
     * Fast query using addedDate index
     */
    @Query("""
        SELECT * FROM movies 
        WHERE serverId = :serverId 
        ORDER BY addedDate DESC 
        LIMIT :limit
    """)
    fun getRecentMoviesFlow(serverId: String, limit: Int = 30): Flow<List<MovieEntity>>

    /**
     * Get recently added series with LIMIT
     */
    @Query("""
        SELECT * FROM series 
        WHERE serverId = :serverId 
        ORDER BY lastModified DESC 
        LIMIT :limit
    """)
    fun getRecentSeriesFlow(serverId: String, limit: Int = 30): Flow<List<SeriesEntity>>

    /**
     * Get featured/popular movies
     * Fast query using rating index
     */
    @Query("""
        SELECT * FROM movies 
        WHERE serverId = :serverId 
        AND rating > 7.0
        ORDER BY rating DESC 
        LIMIT :limit
    """)
    fun getTopRatedMoviesFlow(serverId: String, limit: Int = 20): Flow<List<MovieEntity>>

    /**
     * Get favorite channels for quick access
     */
    @Query("""
        SELECT c.* FROM channels c
        INNER JOIN favorites f ON c.channelId = f.contentId
        WHERE f.serverId = :serverId AND f.type = 'channel'
        ORDER BY f.addedAt DESC
        LIMIT :limit
    """)
    fun getFavoriteChannelsFlow(serverId: String, limit: Int = 12): Flow<List<ChannelEntity>>

    /**
     * Search across all content types
     * Uses full-text search for better performance
     */
    @Query("""
        SELECT movieId as id, name as title, streamIcon as posterUrl, 'MOVIE' as type
        FROM movies
        WHERE serverId = :serverId AND name LIKE '%' || :query || '%'
        UNION ALL
        SELECT seriesId as id, name as title, cover as posterUrl, 'SERIES' as type
        FROM series
        WHERE serverId = :serverId AND name LIKE '%' || :query || '%'
        UNION ALL
        SELECT channelId as id, name as title, streamIcon as posterUrl, 'CHANNEL' as type
        FROM channels
        WHERE serverId = :serverId AND name LIKE '%' || :query || '%'
        LIMIT 50
    """)
    fun searchAllContent(serverId: String, query: String): Flow<List<SearchResult>>

    /**
     * Get content count for statistics
     */
    @Query("""
        SELECT 
            (SELECT COUNT(*) FROM movies WHERE serverId = :serverId) as movies,
            (SELECT COUNT(*) FROM series WHERE serverId = :serverId) as series,
            (SELECT COUNT(*) FROM channels WHERE serverId = :serverId) as channels
    """)
    suspend fun getContentCounts(serverId: String): ContentCounts
}

/**
 * Data class for search results
 */
data class SearchResult(
    val id: String,
    val title: String,
    val posterUrl: String?,
    val type: String
)

/**
 * Content statistics
 */
data class ContentCounts(
    val movies: Int,
    val series: Int,
    val channels: Int
) {
    val total: Int get() = movies + series + channels
}
