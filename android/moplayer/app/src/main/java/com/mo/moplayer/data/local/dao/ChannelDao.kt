package com.mo.moplayer.data.local.dao

import androidx.room.*
import com.mo.moplayer.data.local.entity.ChannelEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ChannelDao {
    
    @Query("SELECT * FROM channels WHERE serverId = :serverId ORDER BY customOrder, name")
    fun getAllChannels(serverId: Long): Flow<List<ChannelEntity>>
    
    @Query("SELECT * FROM channels WHERE serverId = :serverId AND categoryId = :categoryId ORDER BY customOrder, name")
    fun getChannelsByCategory(serverId: Long, categoryId: String): Flow<List<ChannelEntity>>
    
    @Query("SELECT * FROM channels WHERE channelId = :channelId")
    suspend fun getChannelById(channelId: String): ChannelEntity?
    
    @Query("SELECT * FROM channels WHERE serverId = :serverId AND name LIKE '%' || :query || '%' ORDER BY name")
    fun searchChannels(serverId: Long, query: String): Flow<List<ChannelEntity>>
    
    @Query("SELECT * FROM channels WHERE serverId = :serverId ORDER BY addedAt DESC LIMIT :limit")
    fun getRecentlyAddedChannels(serverId: Long, limit: Int = 30): Flow<List<ChannelEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChannels(channels: List<ChannelEntity>)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChannel(channel: ChannelEntity)
    
    @Update
    suspend fun updateChannel(channel: ChannelEntity)
    
    @Query("DELETE FROM channels WHERE serverId = :serverId")
    suspend fun deleteAllChannels(serverId: Long)
    
    @Query("SELECT COUNT(*) FROM channels WHERE serverId = :serverId")
    suspend fun getChannelCount(serverId: Long): Int
}
