package com.mo.moplayer.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "server_sync_state",
    foreignKeys = [
        ForeignKey(
            entity = ServerEntity::class,
            parentColumns = ["id"],
            childColumns = ["serverId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("lastSyncAt"), Index("lastStatus")]
)
data class ServerSyncStateEntity(
    @PrimaryKey
    val serverId: Long,
    val lastSyncAt: Long? = null,
    val lastStatus: String = "IDLE", // IDLE, RUNNING, SUCCESS, ERROR
    val lastError: String? = null,
    val totalChannels: Int = 0,
    val totalMovies: Int = 0,
    val totalSeries: Int = 0,
    val totalCategories: Int = 0,
    val totalEpgItems: Int = 0,
    val lastDurationMs: Long = 0L
)
