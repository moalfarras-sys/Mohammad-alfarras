package com.moalfarras.moplayer.data.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.LoginKind

@Entity(tableName = "servers")
data class ServerEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val kind: LoginKind,
    val baseUrl: String,
    val username: String,
    val password: String,
    val playlistUrl: String,
    val createdAt: Long,
    val lastSyncAt: Long,
    val host: String,
    val accountStatus: String,
    val expiryDate: Long,
    val activeConnections: Int,
    val maxConnections: Int,
    val allowedOutputFormats: String,
    val timezone: String,
    val serverMessage: String,
    val lastSyncSource: String,
)

@Entity(
    tableName = "categories",
    primaryKeys = ["id", "serverId", "type"],
    indices = [
        Index(value = ["serverId", "type"]),
        Index(value = ["serverId", "type", "sortOrder"]),
    ],
)
data class CategoryEntity(
    val id: String,
    val serverId: Long,
    val type: ContentType,
    val name: String,
    val sortOrder: Int,
    val parentId: String,
    val rawJson: String,
)

@Entity(
    tableName = "media",
    primaryKeys = ["id", "serverId", "type"],
    indices = [
        Index("serverId"),
        Index("type"),
        Index("categoryId"),
        Index("categoryName"),
        Index("title"),
        Index("addedAt"),
        Index("lastModifiedAt"),
        Index("serverOrder"),
        Index("seriesId"),
        Index(value = ["serverId", "type", "categoryId"]),
        Index(value = ["serverId", "type", "title"]),
        Index(value = ["serverId", "type", "serverOrder"]),
        Index(value = ["serverId", "type", "addedAt"]),
        Index(value = ["serverId", "seriesId", "type"]),
        Index(value = ["serverId", "isFavorite", "updatedAt"]),
        Index(value = ["serverId", "watchPositionMs", "updatedAt"]),
        Index(value = ["serverId", "type", "lastPlayedAt"]),
    ],
)
data class MediaEntity(
    val id: String,
    val serverId: Long,
    val type: ContentType,
    val categoryId: String,
    val categoryName: String,
    val title: String,
    val streamUrl: String,
    val posterUrl: String,
    val backdropUrl: String,
    val description: String,
    val rating: String,
    val durationSecs: Long,
    val addedAt: Long,
    val lastModifiedAt: Long,
    val addedAtUnknown: Boolean,
    val serverOrder: Int,
    val containerExtension: String,
    val seriesId: String,
    val seasonNumber: Int,
    val episodeNumber: Int,
    val isFavorite: Boolean,
    val watchPositionMs: Long,
    val watchDurationMs: Long,
    val lastPlayedAt: Long,
    val tvgId: String,
    val catchup: String,
    val cast: String,
    val director: String,
    val genre: String,
    val releaseDate: String,
    val rawJson: String,
    val updatedAt: Long,
)

@Entity(
    tableName = "account_info",
    primaryKeys = ["serverId"],
    indices = [Index("updatedAt")],
)
data class AccountInfoEntity(
    val serverId: Long,
    val status: String,
    val expiryDate: Long,
    val activeConnections: Int,
    val maxConnections: Int,
    val allowedOutputFormats: String,
    val createdAt: Long,
    val isTrial: Boolean,
    val usernameMasked: String,
    val rawJson: String,
    val updatedAt: Long,
)

@Entity(
    tableName = "server_info",
    primaryKeys = ["serverId"],
)
data class ServerInfoEntity(
    val serverId: Long,
    val url: String,
    val timezone: String,
    val timestampNow: Long,
    val timeNow: String,
    val message: String,
    val rawJson: String,
    val updatedAt: Long,
)

@Entity(
    tableName = "vod_details",
    primaryKeys = ["serverId", "vodId"],
    indices = [Index("updatedAt")],
)
data class VodDetailsEntity(
    val serverId: Long,
    val vodId: String,
    val movieImage: String,
    val backdrop: String,
    val plot: String,
    val cast: String,
    val director: String,
    val genre: String,
    val releaseDate: String,
    val rating: String,
    val duration: String,
    val country: String,
    val youtubeTrailer: String,
    val rawJson: String,
    val updatedAt: Long,
)

@Entity(
    tableName = "seasons",
    primaryKeys = ["serverId", "seriesId", "seasonNumber"],
    indices = [Index("seriesId")],
)
data class SeasonEntity(
    val serverId: Long,
    val seriesId: String,
    val seasonNumber: Int,
    val name: String,
    val cover: String,
    val airDate: String,
    val plot: String,
    val rawJson: String,
    val updatedAt: Long,
)

@Entity(
    tableName = "epg_programs",
    primaryKeys = ["serverId", "channelKey", "startAt", "title"],
    indices = [
        Index(value = ["serverId", "channelKey", "startAt"]),
        Index(value = ["serverId", "startAt"]),
    ],
)
data class EpgProgramEntity(
    val serverId: Long,
    val channelKey: String,
    val title: String,
    val description: String,
    val startAt: Long,
    val endAt: Long,
    val category: String,
    val rawJson: String,
    val updatedAt: Long,
)

@Entity(
    tableName = "sync_state",
    primaryKeys = ["serverId"],
)
data class SyncStateEntity(
    val serverId: Long,
    val source: String,
    val status: String,
    val lastSyncAt: Long,
    val liveSyncedAt: Long,
    val vodSyncedAt: Long,
    val seriesSyncedAt: Long,
    val epgSyncedAt: Long,
    val lastError: String,
    val rawJson: String,
    val updatedAt: Long,
)
