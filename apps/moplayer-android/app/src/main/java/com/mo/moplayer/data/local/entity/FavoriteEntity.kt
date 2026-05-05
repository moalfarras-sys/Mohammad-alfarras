package com.mo.moplayer.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "favorites",
    indices = [Index("contentId"), Index("contentType")]
)
data class FavoriteEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val serverId: Long,
    val contentId: String, // channelId, movieId, or seriesId
    val contentType: String, // "channel", "movie", "series"
    val name: String,
    val iconUrl: String? = null,
    val addedAt: Long = System.currentTimeMillis()
)
