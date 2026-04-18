package com.mo.moplayer.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "series",
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
        Index("lastModified"),
        Index(value = ["serverId", "categoryId", "name"]),
        Index(value = ["serverId", "name"])
    ]
)
data class SeriesEntity(
    @PrimaryKey
    val seriesId: String, // Combined serverId_seriesId for uniqueness
    val serverId: Long,
    val originalSeriesId: Int,
    val name: String,
    val cover: String? = null,
    val categoryId: String? = null,
    val rating: Double? = null,
    val ratingCount: Int? = null,
    val plot: String? = null,
    val cast: String? = null,
    val director: String? = null,
    val genre: String? = null,
    val releaseDate: String? = null,
    val lastModified: Long = 0, // For sorting by recently added
    val backdrop: String? = null,
    val youtubeTrailer: String? = null,
    val tmdbId: Int? = null,
    val episodesJson: String? = null, // JSON string of seasons and episodes
    val isAdult: Boolean = false
)

@Entity(
    tableName = "episodes",
    foreignKeys = [
        ForeignKey(
            entity = SeriesEntity::class,
            parentColumns = ["seriesId"],
            childColumns = ["seriesId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("seriesId")]
)
data class EpisodeEntity(
    @PrimaryKey
    val episodeId: String, // Combined seriesId_seasonNum_episodeNum
    val seriesId: String,
    val seasonNumber: Int,
    val episodeNumber: Int,
    val title: String? = null,
    val streamId: Int,
    val streamUrl: String,
    val containerExtension: String? = null,
    val plot: String? = null,
    val duration: String? = null,
    val durationSeconds: Int? = null,
    val releaseDate: String? = null,
    val cover: String? = null,
    val lastWatchedPosition: Long = 0,
    val lastWatchedAt: Long? = null
)
