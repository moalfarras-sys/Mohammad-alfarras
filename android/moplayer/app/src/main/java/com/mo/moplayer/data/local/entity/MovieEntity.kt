package com.mo.moplayer.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "movies",
    foreignKeys = [
        ForeignKey(
            entity = ServerEntity::class,
            parentColumns = ["id"],
            childColumns = ["serverId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("serverId"), 
        Index("categoryId"), 
        Index("addedTimestamp"),
        Index(value = ["serverId", "categoryId", "name"]),
        Index(value = ["serverId", "name"])
    ]
)
data class MovieEntity(
    @PrimaryKey
    val movieId: String, // Combined serverId_streamId for uniqueness
    val serverId: Long,
    val streamId: Int,
    val name: String,
    val streamUrl: String,
    val containerExtension: String? = null, // mkv, mp4, avi, etc.
    val streamIcon: String? = null,
    val categoryId: String? = null,
    val rating: Double? = null,
    val ratingCount: Int? = null,
    val year: String? = null,
    val plot: String? = null,
    val cast: String? = null,
    val director: String? = null,
    val genre: String? = null,
    val releaseDate: String? = null,
    val duration: String? = null,
    val durationSeconds: Int? = null,
    val backdrop: String? = null,
    val youtubeTrailer: String? = null,
    val tmdbId: Int? = null,
    val addedTimestamp: Long = 0, // For sorting by recently added
    val isAdult: Boolean = false,
    val lastWatchedPosition: Long = 0,
    val lastWatchedAt: Long? = null
)
