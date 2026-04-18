package com.mo.moplayer.data.local.dao

import androidx.room.*
import com.mo.moplayer.data.local.entity.EpgEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface EpgDao {
    
    /**
     * Get the currently airing program for a channel
     */
    @Query("""
        SELECT * FROM epg_listings 
        WHERE streamId = :streamId AND serverId = :serverId
        AND startTime <= :currentTime AND endTime > :currentTime
        LIMIT 1
    """)
    suspend fun getCurrentProgram(streamId: Int, serverId: Long, currentTime: Long = System.currentTimeMillis()): EpgEntity?
    
    /**
     * Get the currently airing program as Flow for real-time updates
     */
    @Query("""
        SELECT * FROM epg_listings 
        WHERE streamId = :streamId AND serverId = :serverId
        AND startTime <= :currentTime AND endTime > :currentTime
        LIMIT 1
    """)
    fun getCurrentProgramFlow(streamId: Int, serverId: Long, currentTime: Long = System.currentTimeMillis()): Flow<EpgEntity?>
    
    /**
     * Get upcoming programs for a channel
     */
    @Query("""
        SELECT * FROM epg_listings 
        WHERE streamId = :streamId AND serverId = :serverId
        AND startTime > :currentTime
        ORDER BY startTime ASC
        LIMIT :limit
    """)
    suspend fun getUpcomingPrograms(streamId: Int, serverId: Long, limit: Int = 5, currentTime: Long = System.currentTimeMillis()): List<EpgEntity>
    
    /**
     * Get the next program after the current one
     */
    @Query("""
        SELECT * FROM epg_listings 
        WHERE streamId = :streamId AND serverId = :serverId
        AND startTime > :currentTime
        ORDER BY startTime ASC
        LIMIT 1
    """)
    suspend fun getNextProgram(streamId: Int, serverId: Long, currentTime: Long = System.currentTimeMillis()): EpgEntity?
    
    /**
     * Get all EPG listings for a channel on a specific date
     */
    @Query("""
        SELECT * FROM epg_listings 
        WHERE streamId = :streamId AND serverId = :serverId
        AND startTime >= :dayStart AND startTime < :dayEnd
        ORDER BY startTime ASC
    """)
    suspend fun getEpgForDay(streamId: Int, serverId: Long, dayStart: Long, dayEnd: Long): List<EpgEntity>
    
    /**
     * Get EPG listings for a time range (for archive)
     */
    @Query("""
        SELECT * FROM epg_listings 
        WHERE streamId = :streamId AND serverId = :serverId
        AND startTime >= :startTime AND endTime <= :endTime
        ORDER BY startTime ASC
    """)
    suspend fun getEpgForTimeRange(streamId: Int, serverId: Long, startTime: Long, endTime: Long): List<EpgEntity>
    
    /**
     * Insert multiple EPG listings
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(epgListings: List<EpgEntity>)
    
    /**
     * Insert single EPG listing
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(epgListing: EpgEntity)
    
    /**
     * Delete old EPG entries (cleanup)
     */
    @Query("DELETE FROM epg_listings WHERE endTime < :beforeTimestamp")
    suspend fun deleteOldEpg(beforeTimestamp: Long)
    
    /**
     * Delete all EPG for a specific server
     */
    @Query("DELETE FROM epg_listings WHERE serverId = :serverId")
    suspend fun deleteAllForServer(serverId: Long)
    
    /**
     * Delete EPG for a specific channel
     */
    @Query("DELETE FROM epg_listings WHERE streamId = :streamId AND serverId = :serverId")
    suspend fun deleteForChannel(streamId: Int, serverId: Long)
    
    /**
     * Get count of EPG entries for a server
     */
    @Query("SELECT COUNT(*) FROM epg_listings WHERE serverId = :serverId")
    suspend fun getEpgCount(serverId: Long): Int
    
    /**
     * Check if we have EPG data for a channel
     */
    @Query("""
        SELECT COUNT(*) > 0 FROM epg_listings 
        WHERE streamId = :streamId AND serverId = :serverId
        AND endTime > :currentTime
    """)
    suspend fun hasEpgData(streamId: Int, serverId: Long, currentTime: Long = System.currentTimeMillis()): Boolean
}
