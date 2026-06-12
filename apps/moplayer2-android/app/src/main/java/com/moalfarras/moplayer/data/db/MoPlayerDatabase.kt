package com.moalfarras.moplayer.data.db

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import androidx.room.Upsert
import androidx.room.migration.Migration
import androidx.room.withTransaction
import androidx.paging.PagingSource
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.LoginKind
import kotlinx.coroutines.flow.Flow
import androidx.sqlite.db.SupportSQLiteDatabase

class MoConverters {
    @TypeConverter fun loginKindToString(value: LoginKind): String = value.name
    @TypeConverter fun stringToLoginKind(value: String): LoginKind = LoginKind.valueOf(value)
    @TypeConverter fun contentTypeToString(value: ContentType): String = value.name
    @TypeConverter fun stringToContentType(value: String): ContentType = ContentType.valueOf(value)
}

data class MediaStateSnapshot(
    val id: String,
    val type: ContentType,
    val isFavorite: Boolean,
    val watchPositionMs: Long,
    val watchDurationMs: Long,
    val lastPlayedAt: Long,
)

@Dao
interface ServerDao {
    @Query("SELECT * FROM servers ORDER BY CASE WHEN lastSyncAt > 0 THEN lastSyncAt ELSE createdAt END DESC, createdAt DESC, id DESC")
    fun observeServers(): Flow<List<ServerEntity>>

    @Query("SELECT * FROM servers ORDER BY CASE WHEN lastSyncAt > 0 THEN lastSyncAt ELSE createdAt END DESC, createdAt DESC, id DESC LIMIT 1")
    fun observeActiveServer(): Flow<ServerEntity?>

    @Query("SELECT COUNT(*) FROM servers")
    suspend fun countServers(): Int

    @Query("SELECT * FROM servers WHERE id = :id")
    suspend fun getServer(id: Long): ServerEntity?

    @Query("SELECT * FROM servers WHERE sourceKey = :sourceKey ORDER BY CASE WHEN lastSyncAt > 0 THEN lastSyncAt ELSE createdAt END DESC, createdAt DESC, id DESC LIMIT 1")
    suspend fun getServerBySourceKey(sourceKey: String): ServerEntity?

    @Upsert
    suspend fun upsert(server: ServerEntity): Long

    @Query("UPDATE servers SET lastSyncAt = :timestamp WHERE id = :serverId")
    suspend fun touch(serverId: Long, timestamp: Long)

    @Query(
        """
        UPDATE servers SET
            lastSyncAt = :lastSyncAt,
            accountStatus = :accountStatus,
            expiryDate = :expiryDate,
            activeConnections = :activeConnections,
            maxConnections = :maxConnections,
            allowedOutputFormats = :allowedOutputFormats,
            timezone = :timezone,
            serverMessage = :serverMessage,
            lastSyncSource = :lastSyncSource,
            epgUrl = :epgUrl,
            sourceKey = :sourceKey
        WHERE id = :serverId
        """
    )
    suspend fun updateRuntimeInfo(
        serverId: Long,
        lastSyncAt: Long,
        accountStatus: String,
        expiryDate: Long,
        activeConnections: Int,
        maxConnections: Int,
        allowedOutputFormats: String,
        timezone: String,
        serverMessage: String,
        lastSyncSource: String,
        epgUrl: String,
        sourceKey: String,
    )

    @Query("DELETE FROM servers WHERE id = :serverId")
    suspend fun delete(serverId: Long)
}

@Dao
interface CategoryDao {
    @Query("SELECT * FROM categories WHERE (:serverId <= 0 OR serverId = :serverId) AND type = :type ORDER BY serverId, sortOrder, name")
    fun observe(serverId: Long, type: ContentType): Flow<List<CategoryEntity>>

    @Query(
        """
        SELECT * FROM categories
        WHERE (:serverId <= 0 OR serverId = :serverId)
            AND type = :type
            AND EXISTS (
                SELECT 1 FROM media
                WHERE media.serverId = categories.serverId
                    AND media.type = categories.type
                    AND media.categoryId = categories.id
                    AND (:hideNoLogo = 0 OR media.posterUrl != '')
            )
        ORDER BY sortOrder, name
        """
    )
    fun observeNonEmpty(serverId: Long, type: ContentType, hideNoLogo: Boolean): Flow<List<CategoryEntity>>

    @Upsert
    suspend fun upsertAll(items: List<CategoryEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<CategoryEntity>)

    @Query("DELETE FROM categories WHERE serverId = :serverId")
    suspend fun deleteForServer(serverId: Long)

    @Query("DELETE FROM categories WHERE serverId = :serverId AND type IN (:types)")
    suspend fun deleteForServerTypes(serverId: Long, types: List<ContentType>)

    @Query("SELECT COUNT(*) FROM categories WHERE serverId = :serverId AND type = :type")
    suspend fun countForServerType(serverId: Long, type: ContentType): Int
}

@Dao
interface MediaDao {
    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE (:serverId <= 0 OR serverId = :serverId)
            AND type = :type
            AND (:hideNoLogo = 0 OR posterUrl != '')
        ORDER BY
            CASE WHEN :sortOption = 'LATEST_ADDED' THEN CASE WHEN addedAt > 0 THEN addedAt ELSE lastModifiedAt END END DESC,
            CASE WHEN :sortOption = 'TITLE_ASC' THEN title ELSE '' END COLLATE NOCASE ASC,
            CASE WHEN :sortOption = 'TITLE_DESC' THEN title ELSE '' END COLLATE NOCASE DESC,
            CASE WHEN :sortOption = 'RECENTLY_WATCHED' THEN lastPlayedAt END DESC,
            CASE WHEN :sortOption = 'FAVORITES_FIRST' THEN isFavorite END DESC,
            CASE WHEN :sortOption = 'RATING' THEN CAST(rating AS REAL) END DESC,
            serverId ASC,
            serverOrder ASC,
            title COLLATE NOCASE ASC
        """
    )
    fun observeByTypePaging(
        serverId: Long,
        type: ContentType,
        sortOption: String,
        hideNoLogo: Boolean,
    ): androidx.paging.PagingSource<Int, MediaListRow>

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE (:serverId <= 0 OR serverId = :serverId) AND type = :type
        ORDER BY serverId, serverOrder, title COLLATE NOCASE
        """
    )
    fun pagingByType(serverId: Long, type: ContentType): PagingSource<Int, MediaListRow>

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE (:serverId <= 0 OR serverId = :serverId)
            AND type = 'LIVE'
            AND (:categoryId = '' OR categoryId = :categoryId)
            AND (:hideNoLogo = 0 OR posterUrl != '')
        ORDER BY
            CASE WHEN :sortOption = 'LATEST_ADDED' THEN CASE WHEN addedAt > 0 THEN addedAt ELSE lastModifiedAt END END DESC,
            CASE WHEN :sortOption = 'TITLE_ASC' THEN title ELSE '' END COLLATE NOCASE ASC,
            CASE WHEN :sortOption = 'TITLE_DESC' THEN title ELSE '' END COLLATE NOCASE DESC,
            CASE WHEN :sortOption = 'RECENTLY_WATCHED' THEN lastPlayedAt END DESC,
            CASE WHEN :sortOption = 'FAVORITES_FIRST' THEN isFavorite END DESC,
            CASE WHEN :sortOption = 'RATING' THEN CAST(rating AS REAL) END DESC,
            serverId ASC,
            serverOrder ASC,
            title COLLATE NOCASE ASC
        LIMIT 1000
        """
    )
    fun observeLiveZapItems(
        serverId: Long,
        categoryId: String,
        sortOption: String,
        hideNoLogo: Boolean,
    ): Flow<List<MediaListRow>>

    @Query("SELECT * FROM media WHERE (:serverId <= 0 OR serverId = :serverId) AND type = :type AND categoryId = :categoryId ORDER BY serverId, serverOrder, title COLLATE NOCASE LIMIT 1000")
    fun observeByCategory(serverId: Long, type: ContentType, categoryId: String): Flow<List<MediaEntity>>

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE (:serverId <= 0 OR serverId = :serverId)
            AND type = :type
            AND categoryId = :categoryId
            AND (:hideNoLogo = 0 OR posterUrl != '')
        ORDER BY
            CASE WHEN :sortOption = 'LATEST_ADDED' THEN CASE WHEN addedAt > 0 THEN addedAt ELSE lastModifiedAt END END DESC,
            CASE WHEN :sortOption = 'TITLE_ASC' THEN title ELSE '' END COLLATE NOCASE ASC,
            CASE WHEN :sortOption = 'TITLE_DESC' THEN title ELSE '' END COLLATE NOCASE DESC,
            CASE WHEN :sortOption = 'RECENTLY_WATCHED' THEN lastPlayedAt END DESC,
            CASE WHEN :sortOption = 'FAVORITES_FIRST' THEN isFavorite END DESC,
            CASE WHEN :sortOption = 'RATING' THEN CAST(rating AS REAL) END DESC,
            serverId ASC,
            serverOrder ASC,
            title COLLATE NOCASE ASC
        """
    )
    fun observeByCategoryPaging(
        serverId: Long,
        type: ContentType,
        categoryId: String,
        sortOption: String,
        hideNoLogo: Boolean,
    ): androidx.paging.PagingSource<Int, MediaListRow>

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE (:serverId <= 0 OR serverId = :serverId) AND type IN (:types)
        ORDER BY CASE WHEN addedAt > 0 THEN addedAt ELSE lastModifiedAt END DESC, serverId ASC, serverOrder ASC
        """
    )
    fun observeLatestPaging(serverId: Long, types: List<ContentType>): androidx.paging.PagingSource<Int, MediaListRow>

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE (:serverId <= 0 OR serverId = :serverId) AND isFavorite = 1
        ORDER BY updatedAt DESC
        """
    )
    fun observeFavoritesPaging(serverId: Long): androidx.paging.PagingSource<Int, MediaListRow>


    @Query("SELECT * FROM media WHERE serverId = :serverId AND seriesId = :seriesId AND type = 'EPISODE' ORDER BY seasonNumber, episodeNumber, title")
    fun observeEpisodes(serverId: Long, seriesId: String): Flow<List<MediaEntity>>

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE (:serverId <= 0 OR serverId = :serverId) AND type != 'LIVE' AND watchPositionMs > 0 AND watchDurationMs > 0
        ORDER BY lastPlayedAt DESC, updatedAt DESC
        """
    )
    fun observeContinueWatchingPaging(serverId: Long): PagingSource<Int, MediaListRow>

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE (:serverId <= 0 OR serverId = :serverId) AND type = :type AND lastPlayedAt > 0
        ORDER BY lastPlayedAt DESC
        """
    )
    fun observeRecentlyPlayedPaging(serverId: Long, type: ContentType): PagingSource<Int, MediaListRow>

    @Query(
        """
        SELECT media.id AS id, media.serverId AS serverId, media.type AS type,
            media.categoryId AS categoryId, media.categoryName AS categoryName,
            media.title AS title, media.streamUrl AS streamUrl, media.posterUrl AS posterUrl,
            media.backdropUrl AS backdropUrl, media.description AS description,
            media.rating AS rating, media.durationSecs AS durationSecs, media.addedAt AS addedAt,
            media.lastModifiedAt AS lastModifiedAt, media.addedAtUnknown AS addedAtUnknown,
            media.serverOrder AS serverOrder, media.containerExtension AS containerExtension,
            media.seriesId AS seriesId, media.seasonNumber AS seasonNumber,
            media.episodeNumber AS episodeNumber, media.isFavorite AS isFavorite,
            media.watchPositionMs AS watchPositionMs, media.watchDurationMs AS watchDurationMs,
            media.lastPlayedAt AS lastPlayedAt, media.tvgId AS tvgId, media.catchup AS catchup,
            media.genre AS genre, media.releaseDate AS releaseDate
        FROM media
        INNER JOIN media_search ON media_search.serverId = media.serverId
            AND media_search.type = media.type
            AND media_search.id = media.id
        WHERE (:serverId <= 0 OR media.serverId = :serverId)
            AND (
                media_search.title LIKE :containsQuery ESCAPE '\'
                OR media_search.categoryName LIKE :containsQuery ESCAPE '\'
                OR media_search.tvgId LIKE :containsQuery ESCAPE '\'
                OR media_search.searchText LIKE :containsQuery ESCAPE '\'
            )
        ORDER BY
            CASE WHEN media_search.title LIKE :prefixQuery ESCAPE '\' THEN 0 ELSE 1 END,
            CASE media.type WHEN 'LIVE' THEN 0 WHEN 'MOVIE' THEN 1 WHEN 'SERIES' THEN 2 WHEN 'EPISODE' THEN 3 ELSE 4 END,
            CASE WHEN media.lastPlayedAt > 0 THEN 0 ELSE 1 END,
            media.serverId ASC,
            media.serverOrder ASC,
            media.title COLLATE NOCASE
        """
    )
    fun searchPaging(serverId: Long, containsQuery: String, prefixQuery: String): PagingSource<Int, MediaListRow>

    @Query("SELECT * FROM media WHERE serverId = :serverId AND type = 'LIVE' AND lastPlayedAt > 0 ORDER BY lastPlayedAt DESC LIMIT 1")
    suspend fun lastPlayedLive(serverId: Long): MediaEntity?

    @Query("SELECT * FROM media WHERE serverId = :serverId AND id = :id AND type = :type LIMIT 1")
    suspend fun get(serverId: Long, id: String, type: ContentType): MediaEntity?

    @Query("SELECT * FROM media WHERE id = :id AND type = :type ORDER BY lastPlayedAt DESC, updatedAt DESC LIMIT 1")
    suspend fun getAnyServer(id: String, type: ContentType): MediaEntity?

    @Query("SELECT id, type, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt FROM media WHERE serverId = :serverId")
    suspend fun playbackState(serverId: Long): List<MediaStateSnapshot>

    @Query("SELECT id, type, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt FROM media WHERE serverId = :serverId AND type IN (:types)")
    suspend fun playbackStateForTypes(serverId: Long, types: List<ContentType>): List<MediaStateSnapshot>

    @Query("SELECT COUNT(*) FROM media WHERE serverId = :serverId AND type IN (:types)")
    suspend fun countForServerTypes(serverId: Long, types: List<ContentType>): Int

    @Query("SELECT COUNT(*) FROM media WHERE serverId = :serverId AND type = :type")
    suspend fun countForServerType(serverId: Long, type: ContentType): Int

    @Query("SELECT COUNT(*) FROM media WHERE serverId = :serverId AND seriesId = :seriesId AND type = 'EPISODE'")
    suspend fun episodeCount(serverId: Long, seriesId: String): Int

    @Upsert
    suspend fun upsertAll(items: List<MediaEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<MediaEntity>)

    @Query("UPDATE media SET isFavorite = NOT isFavorite, updatedAt = :updatedAt WHERE serverId = :serverId AND id = :id AND type = :type")
    suspend fun toggleFavorite(serverId: Long, id: String, type: ContentType, updatedAt: Long)

    @Query("UPDATE media SET watchPositionMs = :positionMs, watchDurationMs = :durationMs, updatedAt = :updatedAt WHERE serverId = :serverId AND id = :id AND type = :type")
    suspend fun updateWatch(serverId: Long, id: String, type: ContentType, positionMs: Long, durationMs: Long, updatedAt: Long)

    @Query("UPDATE media SET lastPlayedAt = :playedAt, updatedAt = :playedAt WHERE serverId = :serverId AND id = :id AND type = :type")
    suspend fun markPlayed(serverId: Long, id: String, type: ContentType, playedAt: Long)

    @Query("UPDATE media SET watchPositionMs = 0, watchDurationMs = 0 WHERE serverId = :serverId")
    suspend fun clearProgress(serverId: Long)

    @Query("UPDATE media SET lastPlayedAt = 0 WHERE serverId = :serverId")
    suspend fun clearRecentPlayback(serverId: Long)

    @Query("DELETE FROM media WHERE serverId = :serverId")
    suspend fun deleteForServer(serverId: Long)

    @Query("DELETE FROM media WHERE serverId = :serverId AND type IN (:types)")
    suspend fun deleteForServerTypes(serverId: Long, types: List<ContentType>)

    @Query("SELECT COUNT(*) FROM media WHERE serverId = :serverId")
    suspend fun countForServer(serverId: Long): Int
}

@Dao
interface MediaSearchDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<MediaSearchEntity>)

    @Query("DELETE FROM media_search WHERE serverId = :serverId")
    suspend fun deleteForServer(serverId: Long)

    @Query("DELETE FROM media_search WHERE serverId = :serverId AND type IN (:types)")
    suspend fun deleteForServerTypes(serverId: Long, types: List<ContentType>)
}

@Dao
interface AccountInfoDao {
    @Query("SELECT * FROM account_info WHERE serverId = :serverId LIMIT 1")
    suspend fun get(serverId: Long): AccountInfoEntity?

    @Upsert
    suspend fun upsert(entity: AccountInfoEntity)

    @Query("DELETE FROM account_info WHERE serverId = :serverId")
    suspend fun deleteForServer(serverId: Long)
}

@Dao
interface ServerInfoDao {
    @Query("SELECT * FROM server_info WHERE serverId = :serverId LIMIT 1")
    suspend fun get(serverId: Long): ServerInfoEntity?

    @Upsert
    suspend fun upsert(entity: ServerInfoEntity)

    @Query("DELETE FROM server_info WHERE serverId = :serverId")
    suspend fun deleteForServer(serverId: Long)
}

@Dao
interface VodDetailsDao {
    @Query("SELECT * FROM vod_details WHERE serverId = :serverId AND vodId = :vodId LIMIT 1")
    suspend fun get(serverId: Long, vodId: String): VodDetailsEntity?

    @Upsert
    suspend fun upsert(entity: VodDetailsEntity)

    @Query("DELETE FROM vod_details WHERE serverId = :serverId")
    suspend fun deleteForServer(serverId: Long)
}

@Dao
interface SeasonDao {
    @Query("SELECT * FROM seasons WHERE serverId = :serverId AND seriesId = :seriesId ORDER BY seasonNumber")
    suspend fun bySeries(serverId: Long, seriesId: String): List<SeasonEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<SeasonEntity>)

    @Query("DELETE FROM seasons WHERE serverId = :serverId")
    suspend fun deleteForServer(serverId: Long)

    @Query("DELETE FROM seasons WHERE serverId = :serverId AND seriesId = :seriesId")
    suspend fun deleteForSeries(serverId: Long, seriesId: String)
}

@Dao
interface EpgDao {
    @Query("SELECT * FROM epg_programs WHERE serverId = :serverId AND channelKey = :channelKey AND endAt >= :now ORDER BY startAt ASC LIMIT :limit")
    suspend fun upcoming(serverId: Long, channelKey: String, now: Long, limit: Int): List<EpgProgramEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<EpgProgramEntity>)

    @Query("DELETE FROM epg_programs WHERE serverId = :serverId")
    suspend fun deleteForServer(serverId: Long)
}

@Dao
interface SyncStateDao {
    @Query("SELECT * FROM sync_state WHERE serverId = :serverId LIMIT 1")
    suspend fun get(serverId: Long): SyncStateEntity?

    @Upsert
    suspend fun upsert(entity: SyncStateEntity)

    @Query("UPDATE sync_state SET epgSyncedAt = :epgSyncedAt, rawJson = :rawJson, updatedAt = :updatedAt WHERE serverId = :serverId")
    suspend fun updateEpgState(serverId: Long, epgSyncedAt: Long, rawJson: String, updatedAt: Long)

    @Query("DELETE FROM sync_state WHERE serverId = :serverId")
    suspend fun deleteForServer(serverId: Long)
}

@Database(
    entities = [
        ServerEntity::class,
        CategoryEntity::class,
        MediaEntity::class,
        MediaSearchEntity::class,
        AccountInfoEntity::class,
        ServerInfoEntity::class,
        VodDetailsEntity::class,
        SeasonEntity::class,
        EpgProgramEntity::class,
        SyncStateEntity::class,
    ],
    version = 8,
    exportSchema = true,
)
@TypeConverters(MoConverters::class)
abstract class MoPlayerDatabase : RoomDatabase() {
    abstract fun serverDao(): ServerDao
    abstract fun categoryDao(): CategoryDao
    abstract fun mediaDao(): MediaDao
    abstract fun mediaSearchDao(): MediaSearchDao
    abstract fun accountInfoDao(): AccountInfoDao
    abstract fun serverInfoDao(): ServerInfoDao
    abstract fun vodDetailsDao(): VodDetailsDao
    abstract fun seasonDao(): SeasonDao
    abstract fun epgDao(): EpgDao
    abstract fun syncStateDao(): SyncStateDao

    open suspend fun replaceServerContent(
        serverId: Long,
        categories: List<CategoryEntity>,
        media: List<MediaEntity>,
        accountInfo: AccountInfoEntity?,
        serverInfo: ServerInfoEntity?,
        syncState: SyncStateEntity?,
        epgPrograms: List<EpgProgramEntity>,
    ) = withTransaction {
        // Robustness guard: panels can return categories while stream lists are empty during
        // transient failures or expired sessions. Never persist a categories-only library.
        val existingMediaCount = mediaDao().countForServer(serverId)
        if (media.isEmpty()) {
            if (accountInfo != null) accountInfoDao().upsert(accountInfo)
            if (serverInfo != null) serverInfoDao().upsert(serverInfo)
            if (existingMediaCount <= 0 && categories.isNotEmpty()) {
                categoryDao().deleteForServer(serverId)
                mediaSearchDao().deleteForServer(serverId)
            }
            serverDao().touch(serverId, System.currentTimeMillis())
            return@withTransaction
        }
        val playbackState = mediaDao().playbackState(serverId).associateBy { "${it.type.name}:${it.id}" }
        val mergedMedia = media.map { item ->
            val key = "${item.type.name}:${item.id}"
            val previous = playbackState[key]
            if (previous == null) {
                item
            } else {
                item.copy(
                    isFavorite = previous.isFavorite,
                    watchPositionMs = previous.watchPositionMs,
                    watchDurationMs = previous.watchDurationMs,
                    lastPlayedAt = previous.lastPlayedAt,
                )
            }
        }
        categoryDao().deleteForServer(serverId)
        mediaDao().deleteForServer(serverId)
        mediaSearchDao().deleteForServer(serverId)
        accountInfoDao().deleteForServer(serverId)
        serverInfoDao().deleteForServer(serverId)
        vodDetailsDao().deleteForServer(serverId)
        seasonDao().deleteForServer(serverId)
        syncStateDao().deleteForServer(serverId)
        categoryDao().insertAll(categories)
        mergedMedia.chunked(5_000).forEach { chunk ->
            mediaDao().insertAll(chunk)
            mediaSearchDao().insertAll(chunk.map { it.toSearchEntity() })
        }
        if (accountInfo != null) accountInfoDao().upsert(accountInfo)
        if (serverInfo != null) serverInfoDao().upsert(serverInfo)
        if (syncState != null) syncStateDao().upsert(syncState)
        if (epgPrograms.isNotEmpty()) {
            epgDao().deleteForServer(serverId)
            epgPrograms.chunked(5_000).forEach { epgDao().insertAll(it) }
        }
        serverDao().touch(serverId, System.currentTimeMillis())
    }

    open suspend fun replaceServerContentTypes(
        serverId: Long,
        types: List<ContentType>,
        categories: List<CategoryEntity>,
        media: List<MediaEntity>,
        accountInfo: AccountInfoEntity?,
        serverInfo: ServerInfoEntity?,
        syncState: SyncStateEntity?,
    ) = withTransaction {
        val normalizedTypes = types.distinct()
        if (normalizedTypes.isEmpty()) return@withTransaction

        val existingForTypes = mediaDao().countForServerTypes(serverId, normalizedTypes)
        // Same robustness guard as replaceServerContent, scoped to the section being refreshed.
        // Keep cached media and clear stale categories-only data from fresh or broken sections.
        if (media.isEmpty()) {
            if (accountInfo != null) accountInfoDao().upsert(accountInfo)
            if (serverInfo != null) serverInfoDao().upsert(serverInfo)
            if (existingForTypes <= 0 && categories.isNotEmpty()) {
                categoryDao().deleteForServerTypes(serverId, normalizedTypes)
                mediaSearchDao().deleteForServerTypes(serverId, normalizedTypes)
            }
            serverDao().touch(serverId, System.currentTimeMillis())
            return@withTransaction
        }
        val hasExistingPlaybackState = existingForTypes > 0
        val mergedMedia = if (!hasExistingPlaybackState) {
            media
        } else {
            val playbackState = mediaDao().playbackStateForTypes(serverId, normalizedTypes).associateBy { "${it.type.name}:${it.id}" }
            media.map { item ->
                val key = "${item.type.name}:${item.id}"
                val previous = playbackState[key]
                if (previous == null) {
                    item
                } else {
                    item.copy(
                        isFavorite = previous.isFavorite,
                        watchPositionMs = previous.watchPositionMs,
                        watchDurationMs = previous.watchDurationMs,
                        lastPlayedAt = previous.lastPlayedAt,
                    )
                }
            }
        }

        categoryDao().deleteForServerTypes(serverId, normalizedTypes)
        mediaDao().deleteForServerTypes(serverId, normalizedTypes)
        mediaSearchDao().deleteForServerTypes(serverId, normalizedTypes)
        categoryDao().insertAll(categories)
        mergedMedia.chunked(5_000).forEach { chunk ->
            mediaDao().insertAll(chunk)
            mediaSearchDao().insertAll(chunk.map { it.toSearchEntity() })
        }
        if (accountInfo != null) accountInfoDao().upsert(accountInfo)
        if (serverInfo != null) serverInfoDao().upsert(serverInfo)
        if (syncState != null) syncStateDao().upsert(syncState)
        serverDao().touch(serverId, System.currentTimeMillis())
    }

    companion object {
        @Volatile private var instance: MoPlayerDatabase? = null

        fun get(context: Context): MoPlayerDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(context, MoPlayerDatabase::class.java, "moplayer.db")
                    .addMigrations(MIGRATION_2_3, MIGRATION_3_4, MIGRATION_4_5, MIGRATION_5_6, MIGRATION_6_7, MIGRATION_7_8)
                    .setJournalMode(JournalMode.WRITE_AHEAD_LOGGING)
                    .build()
                    .also { instance = it }
            }

        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE media ADD COLUMN tvgId TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE media ADD COLUMN catchup TEXT NOT NULL DEFAULT ''")
            }
        }

        private val MIGRATION_3_4 = object : Migration(3, 4) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE servers ADD COLUMN host TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE servers ADD COLUMN accountStatus TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE servers ADD COLUMN expiryDate INTEGER NOT NULL DEFAULT 0")
                db.execSQL("ALTER TABLE servers ADD COLUMN activeConnections INTEGER NOT NULL DEFAULT 0")
                db.execSQL("ALTER TABLE servers ADD COLUMN maxConnections INTEGER NOT NULL DEFAULT 0")
                db.execSQL("ALTER TABLE servers ADD COLUMN allowedOutputFormats TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE servers ADD COLUMN timezone TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE servers ADD COLUMN serverMessage TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE servers ADD COLUMN lastSyncSource TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE categories ADD COLUMN parentId TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE categories ADD COLUMN rawJson TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE media ADD COLUMN categoryName TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE media ADD COLUMN lastModifiedAt INTEGER NOT NULL DEFAULT 0")
                db.execSQL("ALTER TABLE media ADD COLUMN addedAtUnknown INTEGER NOT NULL DEFAULT 1")
                db.execSQL("ALTER TABLE media ADD COLUMN serverOrder INTEGER NOT NULL DEFAULT 2147483647")
                db.execSQL("ALTER TABLE media ADD COLUMN containerExtension TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE media ADD COLUMN cast TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE media ADD COLUMN director TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE media ADD COLUMN genre TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE media ADD COLUMN releaseDate TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE media ADD COLUMN rawJson TEXT NOT NULL DEFAULT ''")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_media_categoryName ON media(categoryName)")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_media_lastModifiedAt ON media(lastModifiedAt)")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_media_serverOrder ON media(serverOrder)")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_media_serverId_type_serverOrder ON media(serverId, type, serverOrder)")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_media_serverId_type_addedAt ON media(serverId, type, addedAt)")
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS account_info (
                        serverId INTEGER NOT NULL,
                        status TEXT NOT NULL,
                        expiryDate INTEGER NOT NULL,
                        activeConnections INTEGER NOT NULL,
                        maxConnections INTEGER NOT NULL,
                        allowedOutputFormats TEXT NOT NULL,
                        createdAt INTEGER NOT NULL,
                        isTrial INTEGER NOT NULL,
                        usernameMasked TEXT NOT NULL,
                        rawJson TEXT NOT NULL,
                        updatedAt INTEGER NOT NULL,
                        PRIMARY KEY(serverId)
                    )
                    """.trimIndent(),
                )
                db.execSQL("CREATE INDEX IF NOT EXISTS index_account_info_updatedAt ON account_info(updatedAt)")
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS server_info (
                        serverId INTEGER NOT NULL,
                        url TEXT NOT NULL,
                        timezone TEXT NOT NULL,
                        timestampNow INTEGER NOT NULL,
                        timeNow TEXT NOT NULL,
                        message TEXT NOT NULL,
                        rawJson TEXT NOT NULL,
                        updatedAt INTEGER NOT NULL,
                        PRIMARY KEY(serverId)
                    )
                    """.trimIndent(),
                )
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS vod_details (
                        serverId INTEGER NOT NULL,
                        vodId TEXT NOT NULL,
                        movieImage TEXT NOT NULL,
                        backdrop TEXT NOT NULL,
                        plot TEXT NOT NULL,
                        cast TEXT NOT NULL,
                        director TEXT NOT NULL,
                        genre TEXT NOT NULL,
                        releaseDate TEXT NOT NULL,
                        rating TEXT NOT NULL,
                        duration TEXT NOT NULL,
                        country TEXT NOT NULL,
                        youtubeTrailer TEXT NOT NULL,
                        rawJson TEXT NOT NULL,
                        updatedAt INTEGER NOT NULL,
                        PRIMARY KEY(serverId, vodId)
                    )
                    """.trimIndent(),
                )
                db.execSQL("CREATE INDEX IF NOT EXISTS index_vod_details_updatedAt ON vod_details(updatedAt)")
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS seasons (
                        serverId INTEGER NOT NULL,
                        seriesId TEXT NOT NULL,
                        seasonNumber INTEGER NOT NULL,
                        name TEXT NOT NULL,
                        cover TEXT NOT NULL,
                        airDate TEXT NOT NULL,
                        plot TEXT NOT NULL,
                        rawJson TEXT NOT NULL,
                        updatedAt INTEGER NOT NULL,
                        PRIMARY KEY(serverId, seriesId, seasonNumber)
                    )
                    """.trimIndent(),
                )
                db.execSQL("CREATE INDEX IF NOT EXISTS index_seasons_seriesId ON seasons(seriesId)")
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS epg_programs (
                        serverId INTEGER NOT NULL,
                        channelKey TEXT NOT NULL,
                        title TEXT NOT NULL,
                        description TEXT NOT NULL,
                        startAt INTEGER NOT NULL,
                        endAt INTEGER NOT NULL,
                        category TEXT NOT NULL,
                        rawJson TEXT NOT NULL,
                        updatedAt INTEGER NOT NULL,
                        PRIMARY KEY(serverId, channelKey, startAt, title)
                    )
                    """.trimIndent(),
                )
                db.execSQL("CREATE INDEX IF NOT EXISTS index_epg_programs_serverId_channelKey_startAt ON epg_programs(serverId, channelKey, startAt)")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_epg_programs_serverId_startAt ON epg_programs(serverId, startAt)")
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS sync_state (
                        serverId INTEGER NOT NULL,
                        source TEXT NOT NULL,
                        status TEXT NOT NULL,
                        lastSyncAt INTEGER NOT NULL,
                        liveSyncedAt INTEGER NOT NULL,
                        vodSyncedAt INTEGER NOT NULL,
                        seriesSyncedAt INTEGER NOT NULL,
                        epgSyncedAt INTEGER NOT NULL,
                        lastError TEXT NOT NULL,
                        rawJson TEXT NOT NULL,
                        updatedAt INTEGER NOT NULL,
                        PRIMARY KEY(serverId)
                    )
                    """.trimIndent(),
                )
            }
        }

        private val MIGRATION_4_5 = object : Migration(4, 5) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE media ADD COLUMN lastPlayedAt INTEGER NOT NULL DEFAULT 0")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_media_serverId_type_lastPlayedAt ON media(serverId, type, lastPlayedAt)")
            }
        }

        private val MIGRATION_5_6 = object : Migration(5, 6) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE servers ADD COLUMN epgUrl TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE servers ADD COLUMN sourceKey TEXT NOT NULL DEFAULT ''")
                db.execSQL("UPDATE servers SET sourceKey = 'server:' || id WHERE sourceKey = ''")
            }
        }

        private val MIGRATION_6_7 = object : Migration(6, 7) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("DELETE FROM categories")
                db.execSQL("DELETE FROM media")
                db.execSQL("DELETE FROM account_info")
                db.execSQL("DELETE FROM server_info")
                db.execSQL("DELETE FROM vod_details")
                db.execSQL("DELETE FROM seasons")
                db.execSQL("DELETE FROM epg_programs")
                db.execSQL("DELETE FROM sync_state")
                db.execSQL(
                    """
                    UPDATE servers SET
                        lastSyncAt = 0,
                        accountStatus = '',
                        expiryDate = 0,
                        activeConnections = 0,
                        maxConnections = 0,
                        allowedOutputFormats = '',
                        timezone = '',
                        serverMessage = '',
                        lastSyncSource = 'upgrade-cache-reset'
                    """.trimIndent(),
                )
            }
        }

        private val MIGRATION_7_8 = object : Migration(7, 8) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS media_search (
                        serverId INTEGER NOT NULL,
                        type TEXT NOT NULL,
                        id TEXT NOT NULL,
                        title TEXT NOT NULL,
                        categoryName TEXT NOT NULL,
                        tvgId TEXT NOT NULL,
                        genre TEXT NOT NULL,
                        searchText TEXT NOT NULL,
                        PRIMARY KEY(serverId, type, id)
                    )
                    """.trimIndent(),
                )
                db.execSQL("CREATE INDEX IF NOT EXISTS index_media_search_serverId_type ON media_search(serverId, type)")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_media_search_serverId_title ON media_search(serverId, title)")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_media_search_serverId_categoryName ON media_search(serverId, categoryName)")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_media_search_serverId_tvgId ON media_search(serverId, tvgId)")
                db.execSQL(
                    """
                    INSERT OR REPLACE INTO media_search(serverId, type, id, title, categoryName, tvgId, genre, searchText)
                    SELECT
                        serverId,
                        type,
                        id,
                        title,
                        categoryName,
                        tvgId,
                        genre,
                        trim(title || ' ' || categoryName || ' ' || tvgId || ' ' || genre || ' ' || releaseDate)
                    FROM media
                    """.trimIndent(),
                )
            }
        }
    }
}
