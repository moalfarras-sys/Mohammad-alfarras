package com.mo.moplayer.data.local.dao

import androidx.paging.PagingSource
import androidx.room.*
import com.mo.moplayer.data.local.entity.EpisodeEntity
import com.mo.moplayer.data.local.entity.SeriesEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SeriesDao {
    
    @Query("SELECT * FROM series WHERE serverId = :serverId ORDER BY lastModified DESC, name COLLATE NOCASE ASC")
    fun getAllSeries(serverId: Long): Flow<List<SeriesEntity>>
    
    @Query("SELECT * FROM series WHERE serverId = :serverId AND categoryId = :categoryId ORDER BY lastModified DESC, name COLLATE NOCASE ASC")
    fun getSeriesByCategory(serverId: Long, categoryId: String): Flow<List<SeriesEntity>>
    
    // Paging queries
    @Query("SELECT * FROM series WHERE serverId = :serverId ORDER BY lastModified DESC, name COLLATE NOCASE ASC")
    fun getAllSeriesPaged(serverId: Long): PagingSource<Int, SeriesEntity>
    
    @Query("SELECT * FROM series WHERE serverId = :serverId AND categoryId = :categoryId ORDER BY lastModified DESC, name COLLATE NOCASE ASC")
    fun getSeriesByCategoryPaged(serverId: Long, categoryId: String): PagingSource<Int, SeriesEntity>
    
    @Query("SELECT * FROM series WHERE seriesId = :seriesId")
    suspend fun getSeriesById(seriesId: String): SeriesEntity?
    
    @Query("SELECT * FROM series WHERE serverId = :serverId AND name LIKE '%' || :query || '%' ORDER BY name")
    fun searchSeries(serverId: Long, query: String): Flow<List<SeriesEntity>>
    
    @Query("SELECT * FROM series WHERE serverId = :serverId ORDER BY lastModified DESC LIMIT :limit")
    fun getRecentlyAddedSeries(serverId: Long, limit: Int = 30): Flow<List<SeriesEntity>>
    
    @Query("SELECT * FROM series WHERE serverId = :serverId AND rating IS NOT NULL ORDER BY rating DESC LIMIT :limit")
    fun getTopRatedSeries(serverId: Long, limit: Int = 30): Flow<List<SeriesEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSeries(series: List<SeriesEntity>)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSingleSeries(series: SeriesEntity)
    
    @Update
    suspend fun updateSeries(series: SeriesEntity)
    
    @Query("DELETE FROM series WHERE serverId = :serverId")
    suspend fun deleteAllSeries(serverId: Long)
    
    @Query("SELECT COUNT(*) FROM series WHERE serverId = :serverId")
    suspend fun getSeriesCount(serverId: Long): Int
    
    // Episode queries
    @Query("SELECT * FROM episodes WHERE seriesId = :seriesId ORDER BY seasonNumber, episodeNumber")
    fun getEpisodes(seriesId: String): Flow<List<EpisodeEntity>>
    
    @Query("SELECT * FROM episodes WHERE seriesId = :seriesId AND seasonNumber = :seasonNumber ORDER BY episodeNumber")
    fun getEpisodesBySeason(seriesId: String, seasonNumber: Int): Flow<List<EpisodeEntity>>
    
    @Query("SELECT * FROM episodes WHERE episodeId = :episodeId")
    suspend fun getEpisodeById(episodeId: String): EpisodeEntity?

    @Query(
        """
        SELECT * FROM episodes
        WHERE seriesId = :seriesId
        ORDER BY seasonNumber ASC, episodeNumber ASC
        LIMIT 1
        """
    )
    suspend fun getFirstEpisode(seriesId: String): EpisodeEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEpisodes(episodes: List<EpisodeEntity>)
    
    @Query("UPDATE episodes SET lastWatchedPosition = :position, lastWatchedAt = :timestamp WHERE episodeId = :episodeId")
    suspend fun updateEpisodeProgress(episodeId: String, position: Long, timestamp: Long = System.currentTimeMillis())
    
    @Query("DELETE FROM episodes WHERE seriesId = :seriesId")
    suspend fun deleteEpisodes(seriesId: String)
}
