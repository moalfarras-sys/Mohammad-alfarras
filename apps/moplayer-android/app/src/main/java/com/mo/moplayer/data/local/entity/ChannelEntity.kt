package com.mo.moplayer.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "channels",
    foreignKeys = [
        ForeignKey(
            entity = ServerEntity::class,
            parentColumns = ["id"],
            childColumns = ["serverId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("serverId"), Index("categoryId")]
)
data class ChannelEntity(
    @PrimaryKey
    val channelId: String, // Combined serverId_streamId for uniqueness
    val serverId: Long,
    val streamId: Int,
    val name: String,
    val streamUrl: String,
    val streamIcon: String? = null,
    val categoryId: String? = null,
    val epgChannelId: String? = null,
    val tvArchive: Boolean = false,
    val tvArchiveDuration: Int = 0,
    val isAdult: Boolean = false,
    val addedAt: Long = System.currentTimeMillis(),
    val customOrder: Int = 0
)
