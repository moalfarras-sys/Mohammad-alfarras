package com.mo.moplayer.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "watch_history")
data class WatchHistoryEntity(
    @PrimaryKey
    val id: String, // contentId_type
    val contentId: String,
    val type: String, // MOVIE, EPISODE
    val name: String,
    val posterUrl: String?,
    val positionMs: Long,
    val durationMs: Long,
    val completed: Boolean,
    val lastWatched: Long = System.currentTimeMillis(),
    val seasonNumber: Int? = null, // For series episodes
    val episodeNumber: Int? = null, // For series episodes
    val seriesId: String? = null, // Parent series ID for episodes
    val seriesName: String? = null // Parent series name
)
