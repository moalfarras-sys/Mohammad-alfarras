package com.mo.moplayer.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.mo.moplayer.data.local.entity.ServerSyncStateEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ServerSyncStateDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(state: ServerSyncStateEntity)

    @Query("SELECT * FROM server_sync_state WHERE serverId = :serverId LIMIT 1")
    suspend fun getState(serverId: Long): ServerSyncStateEntity?

    @Query("SELECT * FROM server_sync_state ORDER BY lastSyncAt DESC")
    fun getAllStates(): Flow<List<ServerSyncStateEntity>>

    @Query("DELETE FROM server_sync_state WHERE serverId = :serverId")
    suspend fun deleteByServer(serverId: Long)
}
