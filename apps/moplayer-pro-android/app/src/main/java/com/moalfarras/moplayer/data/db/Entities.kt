package com.moalfarras.moplayer.data.db

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Fts4
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
    val epgUrl: String,
    val sourceKey: String,
    /**
     * When the user last chose this source (login, QR import, or switching accounts). The active
     * source is the newest value here. Syncs only move [lastSyncAt], so a background refresh of
     * another account can never switch the library back to it.
     */
    @ColumnInfo(defaultValue = "0")
    val activatedAt: Long = 0,
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
    // Every index here serves a query in MediaDao/CategoryDao/MediaQueries; each extra one costs a
    // B-tree update per row on every sync. Check EXPLAIN QUERY PLAN before adding one.
    indices = [
        // Grids in server order, zap list, per-type counts and deletes.
        Index(value = ["serverId", "type", "serverOrder"]),
        // Category grids in server order and the non-empty-category EXISTS check.
        Index(value = ["serverId", "type", "categoryId", "serverOrder"]),
        // "Latest" shelves and the LATEST_ADDED sort.
        Index(value = ["serverId", "type", "sortAddedAt"]),
        // Recently played shelves, last played channel, RECENTLY_WATCHED sort.
        Index(value = ["serverId", "type", "lastPlayedAt"]),
        // Episodes of a series.
        Index(value = ["serverId", "seriesId", "type"]),
        // Favorites shelf.
        Index(value = ["serverId", "isFavorite", "updatedAt"]),
        // Continue watching shelf.
        Index(value = ["serverId", "watchPositionMs", "updatedAt"]),
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
    /** [addedAt], or [lastModifiedAt] when the provider sends no added date (Xtream series). Indexed for "Latest". */
    val sortAddedAt: Long,
)

data class MediaListRow(
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
    val genre: String,
    val releaseDate: String,
)

/**
 * Search copy of each media row, in [SearchText]-normalized form. It is the content table of
 * [MediaSearchFts]; Room keeps the FTS index in sync with triggers, so rows must be written with
 * insert/upsert/update/delete only. INSERT OR REPLACE would delete conflicting rows without firing
 * the triggers and leave stale entries in the index.
 */
@Entity(
    tableName = "media_search",
    primaryKeys = ["serverId", "type", "id"],
)
data class MediaSearchEntity(
    val serverId: Long,
    val type: ContentType,
    val id: String,
    /** Normalized title, used to rank title-prefix matches first. */
    val title: String,
    /** Normalized title, category, tvg-id, genre and year, plus extra prefix tokens. */
    val searchText: String,
)

/** FTS4 index over `media_search.searchText` (external content, no duplicate text stored). */
@Fts4(contentEntity = MediaSearchEntity::class)
@Entity(tableName = "media_search_fts")
data class MediaSearchFts(
    val searchText: String,
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
