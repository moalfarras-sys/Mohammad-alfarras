package com.mo.moplayer.data.local.dao

import androidx.room.*
import com.mo.moplayer.data.local.entity.ServerEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ServerDao {
    
    @Query("SELECT * FROM servers ORDER BY lastUsedAt DESC")
    fun getAllServers(): Flow<List<ServerEntity>>

    @Query("SELECT * FROM servers ORDER BY lastUsedAt DESC")
    suspend fun getAllServersSync(): List<ServerEntity>
    
    @Query("SELECT * FROM servers WHERE id = :id")
    suspend fun getServerById(id: Long): ServerEntity?
    
    @Query("SELECT * FROM servers WHERE isActive = 1 LIMIT 1")
    suspend fun getActiveServer(): ServerEntity?
    
    @Query("SELECT * FROM servers WHERE isActive = 1 LIMIT 1")
    fun getActiveServerFlow(): Flow<ServerEntity?>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertServer(server: ServerEntity): Long
    
    @Update
    suspend fun updateServer(server: ServerEntity)
    
    @Delete
    suspend fun deleteServer(server: ServerEntity)
    
    @Query("UPDATE servers SET isActive = 0")
    suspend fun deactivateAllServers()
    
    @Query("UPDATE servers SET isActive = 1, lastUsedAt = :timestamp WHERE id = :serverId")
    suspend fun activateServer(serverId: Long, timestamp: Long = System.currentTimeMillis())
    
    @Query("DELETE FROM servers WHERE id = :serverId")
    suspend fun deleteServerById(serverId: Long)
}
