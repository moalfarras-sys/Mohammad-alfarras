package com.moalfarras.moplayer.data.db

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Room
import androidx.room.RawQuery
import androidx.room.RoomDatabase
import androidx.room.Transaction
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import androidx.room.Update
import androidx.room.Upsert
import androidx.room.migration.Migration
import androidx.room.withTransaction
import androidx.paging.PagingSource
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.LoginKind
import kotlinx.coroutines.flow.Flow
import androidx.sqlite.db.SimpleSQLiteQuery
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.sqlite.db.SupportSQLiteQuery

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

private fun userStateKey(type: ContentType, id: String) = "${type.name}:$id"

private fun List<MediaStateSnapshot>.toUserStateMap(): Map<String, MediaStateSnapshot> =
    if (isEmpty()) emptyMap() else associateBy { userStateKey(it.type, it.id) }

/** Restores favorites, resume position and play history captured before a re-sync. */
private fun List<MediaEntity>.withUserState(state: Map<String, MediaStateSnapshot>): List<MediaEntity> {
    if (state.isEmpty()) return this
    return map { item ->
        val previous = state[userStateKey(item.type, item.id)] ?: return@map item
        item.copy(
            isFavorite = previous.isFavorite,
            watchPositionMs = previous.watchPositionMs,
            watchDurationMs = previous.watchDurationMs,
            lastPlayedAt = previous.lastPlayedAt,
        )
    }
}

private fun MediaSql.toQuery(): SupportSQLiteQuery = SimpleSQLiteQuery(sql, args.toTypedArray())

@Dao
interface ServerDao {
    @Query("SELECT * FROM servers ORDER BY activatedAt DESC, createdAt DESC, id DESC")
    fun observeServers(): Flow<List<ServerEntity>>

    /** The source the user chose last. Deleting it falls back to the previously chosen one. */
    @Query("SELECT * FROM servers ORDER BY activatedAt DESC, createdAt DESC, id DESC LIMIT 1")
    fun observeActiveServer(): Flow<ServerEntity?>

    @Query("SELECT COUNT(*) FROM servers")
    suspend fun countServers(): Int

    @Query("SELECT * FROM servers WHERE id = :id")
    suspend fun getServer(id: Long): ServerEntity?

    @Query("SELECT * FROM servers WHERE sourceKey = :sourceKey ORDER BY activatedAt DESC, createdAt DESC, id DESC LIMIT 1")
    suspend fun getServerBySourceKey(sourceKey: String): ServerEntity?

    @Insert
    suspend fun insertEntity(server: ServerEntity): Long

    @Update
    suspend fun updateEntity(server: ServerEntity)

    /**
     * Saves a source profile. A new row becomes the active source (a login or import is always the
     * user's choice). An existing row keeps its [ServerEntity.activatedAt] and [ServerEntity.createdAt],
     * so re-saving it during a refresh neither switches accounts nor rewrites its creation time.
     * Returns the row id.
     */
    @Transaction
    suspend fun upsert(server: ServerEntity): Long {
        val existing = if (server.id > 0) getServer(server.id) else null
        if (existing == null) {
            val activatedAt = server.activatedAt.takeIf { it > 0 } ?: System.currentTimeMillis()
            return insertEntity(server.copy(activatedAt = activatedAt))
        }
        updateEntity(
            server.copy(
                activatedAt = maxOf(existing.activatedAt, server.activatedAt),
                createdAt = existing.createdAt.takeIf { it > 0 } ?: server.createdAt,
            ),
        )
        return server.id
    }

    /** Freshness only: when the library was last synced. Never changes which source is active. */
    @Query("UPDATE servers SET lastSyncAt = :timestamp WHERE id = :serverId")
    suspend fun touch(serverId: Long, timestamp: Long)

    /** Makes this the active source: the user switched to it or registered it again. */
    @Query("UPDATE servers SET activatedAt = :timestamp WHERE id = :serverId")
    suspend fun markActive(serverId: Long, timestamp: Long)

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
    /** Categories of one source, or of every source when [serverId] <= 0 (merged library). */
    fun observe(serverId: Long, type: ContentType): Flow<List<CategoryEntity>> =
        if (serverId > 0) observeForServer(serverId, type) else observeAllServers(type)

    @Query("SELECT * FROM categories WHERE serverId = :serverId AND type = :type ORDER BY sortOrder, name")
    fun observeForServer(serverId: Long, type: ContentType): Flow<List<CategoryEntity>>

    @Query("SELECT * FROM categories WHERE type = :type ORDER BY serverId, sortOrder, name")
    fun observeAllServers(type: ContentType): Flow<List<CategoryEntity>>

    /** Like [observe], but only categories that contain at least one item. */
    fun observeNonEmpty(serverId: Long, type: ContentType, hideNoLogo: Boolean): Flow<List<CategoryEntity>> =
        if (serverId > 0) observeNonEmptyForServer(serverId, type, hideNoLogo) else observeNonEmptyAllServers(type, hideNoLogo)

    @Query(
        """
        SELECT * FROM categories
        WHERE serverId = :serverId
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
    fun observeNonEmptyForServer(serverId: Long, type: ContentType, hideNoLogo: Boolean): Flow<List<CategoryEntity>>

    @Query(
        """
        SELECT * FROM categories
        WHERE type = :type
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
    fun observeNonEmptyAllServers(type: ContentType, hideNoLogo: Boolean): Flow<List<CategoryEntity>>

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
    // Library queries take serverId <= 0 for the merged library (every source). Each public method
    // dispatches to a variant that filters with `serverId = ?` or `serverId IN (SELECT id FROM servers)`
    // so the (serverId, type, ...) indices are used; see MediaQueries for the sort-dependent ones.

    fun observeByTypePaging(
        serverId: Long,
        type: ContentType,
        sortOption: String,
        hideNoLogo: Boolean,
    ): PagingSource<Int, MediaListRow> =
        mediaRowsPaging(MediaQueries.byType(serverId, type, MediaQueries.sortOptionOf(sortOption), hideNoLogo).toQuery())

    /** Ordered keys of a player zap list, read once per player session; see [MediaQueries.liveZapKeys]. */
    suspend fun liveZapKeys(
        serverId: Long,
        categoryId: String,
        favoritesOnly: Boolean,
        sortOption: String,
        hideNoLogo: Boolean,
    ): List<LiveZapKeyRow> =
        liveZapKeyRows(
            MediaQueries.liveZapKeys(serverId, categoryId, favoritesOnly, MediaQueries.sortOptionOf(sortOption), hideNoLogo).toQuery(),
        )

    /** Live channels of one source by id, in no particular order; see [MediaQueries.liveRowsByIds]. */
    suspend fun liveRowsByIds(serverId: Long, ids: List<String>): List<MediaListRow> =
        mediaRowsOnce(MediaQueries.liveRowsByIds(serverId, ids).toQuery())

    /** One-shot ranked search (same rows and order as [searchPaging]). */
    suspend fun searchRowsOnce(serverId: Long, query: String): List<MediaListRow> =
        mediaRowsOnce(MediaQueries.search(serverId, query).toQuery())

    @RawQuery
    suspend fun liveZapKeyRows(query: SupportSQLiteQuery): List<LiveZapKeyRow>

    @RawQuery
    suspend fun mediaRowsOnce(query: SupportSQLiteQuery): List<MediaListRow>

    fun observeByCategoryPaging(
        serverId: Long,
        type: ContentType,
        categoryId: String,
        sortOption: String,
        hideNoLogo: Boolean,
    ): PagingSource<Int, MediaListRow> =
        mediaRowsPaging(
            MediaQueries.byCategory(serverId, type, categoryId, MediaQueries.sortOptionOf(sortOption), hideNoLogo).toQuery(),
        )

    @RawQuery(observedEntities = [MediaEntity::class])
    fun mediaRowsPaging(query: SupportSQLiteQuery): PagingSource<Int, MediaListRow>

    /**
     * Newest first by [MediaEntity.sortAddedAt], ties by latest insert, so the
     * (serverId, type, sortAddedAt) index returns rows in order without a sort. Callers pass one
     * type per shelf.
     */
    fun observeLatestPaging(serverId: Long, types: List<ContentType>): PagingSource<Int, MediaListRow> =
        if (serverId > 0) latestForServer(serverId, types) else latestAllServers(types)

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE serverId = :serverId AND type IN (:types)
        ORDER BY sortAddedAt DESC, rowid DESC
        """
    )
    fun latestForServer(serverId: Long, types: List<ContentType>): PagingSource<Int, MediaListRow>

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE serverId IN (SELECT id FROM servers) AND type IN (:types)
        ORDER BY sortAddedAt DESC, rowid DESC
        """
    )
    fun latestAllServers(types: List<ContentType>): PagingSource<Int, MediaListRow>

    fun observeFavoritesPaging(serverId: Long): PagingSource<Int, MediaListRow> =
        if (serverId > 0) favoritesForServer(serverId) else favoritesAllServers()

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE serverId = :serverId AND isFavorite = 1
        ORDER BY updatedAt DESC
        """
    )
    fun favoritesForServer(serverId: Long): PagingSource<Int, MediaListRow>

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE serverId IN (SELECT id FROM servers) AND isFavorite = 1
        ORDER BY updatedAt DESC
        """
    )
    fun favoritesAllServers(): PagingSource<Int, MediaListRow>

    @Query("SELECT * FROM media WHERE serverId = :serverId AND seriesId = :seriesId AND type = 'EPISODE' ORDER BY seasonNumber, episodeNumber, title")
    fun observeEpisodes(serverId: Long, seriesId: String): Flow<List<MediaEntity>>

    fun observeContinueWatchingPaging(serverId: Long): PagingSource<Int, MediaListRow> =
        if (serverId > 0) continueWatchingForServer(serverId) else continueWatchingAllServers()

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE serverId = :serverId AND watchPositionMs > 0 AND watchDurationMs > 0 AND type != 'LIVE'
        ORDER BY lastPlayedAt DESC, updatedAt DESC
        """
    )
    fun continueWatchingForServer(serverId: Long): PagingSource<Int, MediaListRow>

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE serverId IN (SELECT id FROM servers) AND watchPositionMs > 0 AND watchDurationMs > 0 AND type != 'LIVE'
        ORDER BY lastPlayedAt DESC, updatedAt DESC
        """
    )
    fun continueWatchingAllServers(): PagingSource<Int, MediaListRow>

    fun observeRecentlyPlayedPaging(serverId: Long, type: ContentType): PagingSource<Int, MediaListRow> =
        if (serverId > 0) recentlyPlayedForServer(serverId, type) else recentlyPlayedAllServers(type)

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE serverId = :serverId AND type = :type AND lastPlayedAt > 0
        ORDER BY lastPlayedAt DESC
        """
    )
    fun recentlyPlayedForServer(serverId: Long, type: ContentType): PagingSource<Int, MediaListRow>

    @Query(
        """
        SELECT id, serverId, type, categoryId, categoryName, title, streamUrl, posterUrl,
            backdropUrl, description, rating, durationSecs, addedAt, lastModifiedAt,
            addedAtUnknown, serverOrder, containerExtension, seriesId, seasonNumber,
            episodeNumber, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt,
            tvgId, catchup, genre, releaseDate
        FROM media
        WHERE serverId IN (SELECT id FROM servers) AND type = :type AND lastPlayedAt > 0
        ORDER BY lastPlayedAt DESC
        """
    )
    fun recentlyPlayedAllServers(type: ContentType): PagingSource<Int, MediaListRow>

    /** Ranked, capped search over the FTS index; see [MediaQueries.search]. */
    fun searchPaging(serverId: Long, query: String): PagingSource<Int, MediaListRow> =
        searchRowsPaging(MediaQueries.search(serverId, query).toQuery())

    /** Older call shape that passes `%escaped%` / `escaped%` LIKE patterns; same results as [searchPaging]. */
    fun searchPaging(serverId: Long, containsQuery: String, prefixQuery: String): PagingSource<Int, MediaListRow> =
        searchPaging(serverId, MediaQueries.unescapeLikePattern(containsQuery))

    @RawQuery(observedEntities = [MediaEntity::class, MediaSearchEntity::class])
    fun searchRowsPaging(query: SupportSQLiteQuery): PagingSource<Int, MediaListRow>

    @Query("SELECT * FROM media WHERE serverId = :serverId AND type = 'LIVE' AND lastPlayedAt > 0 ORDER BY lastPlayedAt DESC LIMIT 1")
    suspend fun lastPlayedLive(serverId: Long): MediaEntity?

    @Query("SELECT * FROM media WHERE serverId = :serverId AND id = :id AND type = :type LIMIT 1")
    suspend fun get(serverId: Long, id: String, type: ContentType): MediaEntity?

    @Query("SELECT * FROM media WHERE id = :id AND type = :type ORDER BY lastPlayedAt DESC, updatedAt DESC LIMIT 1")
    suspend fun getAnyServer(id: String, type: ContentType): MediaEntity?

    // Only rows that carry user state: a re-sync restores these onto the fresh catalog. Rows at the
    // defaults need nothing restored, and skipping them keeps a 100k-row snapshot out of the heap.
    @Query(
        """
        SELECT id, type, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt FROM media
        WHERE serverId = :serverId
            AND (isFavorite = 1 OR watchPositionMs > 0 OR watchDurationMs > 0 OR lastPlayedAt > 0)
        """
    )
    suspend fun playbackState(serverId: Long): List<MediaStateSnapshot>

    @Query(
        """
        SELECT id, type, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt FROM media
        WHERE serverId = :serverId AND type IN (:types)
            AND (isFavorite = 1 OR watchPositionMs > 0 OR watchDurationMs > 0 OR lastPlayedAt > 0)
        """
    )
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

    // User-state writes skip rows that would not change: an UPDATE that matches no row does not
    // invalidate the open media queries (grids, shelves, zap list) the way a same-value write does.
    @Query(
        """
        UPDATE media SET watchPositionMs = :positionMs, watchDurationMs = :durationMs, updatedAt = :updatedAt
        WHERE serverId = :serverId AND id = :id AND type = :type
            AND (watchPositionMs != :positionMs OR watchDurationMs != :durationMs)
        """
    )
    suspend fun updateWatch(serverId: Long, id: String, type: ContentType, positionMs: Long, durationMs: Long, updatedAt: Long)

    /**
     * Records that playback started. Live channels are written only after the viewer has stayed on
     * the channel for [LiveHistoryDebouncer.LIVE_HISTORY_DWELL_MS] (a newer start cancels it), so
     * zapping does not rewrite the catalog on every channel change. Other types are written now,
     * because Continue Watching ordering depends on it.
     */
    suspend fun markPlayed(serverId: Long, id: String, type: ContentType, playedAt: Long) {
        if (type == ContentType.LIVE) {
            LiveHistoryDebouncer.shared.schedule { writeLastPlayed(serverId, id, type, playedAt) }
        } else {
            writeLastPlayed(serverId, id, type, playedAt)
        }
    }

    @Query(
        """
        UPDATE media SET lastPlayedAt = :playedAt, updatedAt = :playedAt
        WHERE serverId = :serverId AND id = :id AND type = :type AND lastPlayedAt != :playedAt
        """
    )
    suspend fun writeLastPlayed(serverId: Long, id: String, type: ContentType, playedAt: Long)

    @Query("UPDATE media SET watchPositionMs = 0, watchDurationMs = 0 WHERE serverId = :serverId AND (watchPositionMs != 0 OR watchDurationMs != 0)")
    suspend fun clearProgress(serverId: Long)

    @Query("UPDATE media SET lastPlayedAt = 0 WHERE serverId = :serverId AND lastPlayedAt != 0")
    suspend fun clearRecentPlayback(serverId: Long)

    @Query("DELETE FROM media WHERE serverId = :serverId")
    suspend fun deleteForServer(serverId: Long)

    @Query("DELETE FROM media WHERE serverId = :serverId AND type IN (:types)")
    suspend fun deleteForServerTypes(serverId: Long, types: List<ContentType>)

    @Query("SELECT COUNT(*) FROM media WHERE serverId = :serverId")
    suspend fun countForServer(serverId: Long): Int

    /** User state of the given rows, only for rows that have any (keep [ids] under ~500 per call). */
    @Query(
        """
        SELECT id, type, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt FROM media
        WHERE serverId = :serverId AND type = :type AND id IN (:ids)
            AND (isFavorite = 1 OR watchPositionMs > 0 OR watchDurationMs > 0 OR lastPlayedAt > 0)
        """
    )
    suspend fun userStateForIds(serverId: Long, type: ContentType, ids: List<String>): List<MediaStateSnapshot>

    @Query("SELECT id FROM media WHERE serverId = :serverId AND type = :type")
    suspend fun idsForServerType(serverId: Long, type: ContentType): List<String>

    @Query("DELETE FROM media WHERE serverId = :serverId AND type = :type AND id IN (:ids)")
    suspend fun deleteIds(serverId: Long, type: ContentType, ids: List<String>)

    /** Metadata-only update for detail enrichment; never touches favorites, progress or lastPlayedAt. */
    @Query(
        """
        UPDATE media SET title = :title, posterUrl = :posterUrl, backdropUrl = :backdropUrl,
            description = :description, rating = :rating, durationSecs = :durationSecs,
            `cast` = :cast, director = :director, genre = :genre, releaseDate = :releaseDate
        WHERE serverId = :serverId AND id = :id AND type = :type
        """
    )
    suspend fun updateMetadata(
        serverId: Long,
        id: String,
        type: ContentType,
        title: String,
        posterUrl: String,
        backdropUrl: String,
        description: String,
        rating: String,
        durationSecs: Long,
        cast: String,
        director: String,
        genre: String,
        releaseDate: String,
    ): Int

    /** Guide channel ids of the live channels (XMLTV programmes are matched on tvg-id / epg_channel_id). */
    @Query("SELECT DISTINCT tvgId FROM media WHERE serverId = :serverId AND type = 'LIVE' AND tvgId != ''")
    suspend fun liveEpgKeys(serverId: Long): List<String>

    /** Xtream used to store tv_archive = "0" as catch-up; clears those so no false badge shows. */
    @Query("UPDATE media SET catchup = '' WHERE type = 'LIVE' AND catchup IN ('0', 'false', 'no', 'none', 'null')")
    suspend fun clearDisabledCatchup(): Int

    @Query(
        """
        SELECT id, type, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt FROM media
        WHERE serverId = :serverId AND seriesId = :seriesId AND type = 'EPISODE'
        """
    )
    suspend fun episodeState(serverId: Long, seriesId: String): List<MediaStateSnapshot>

    @Query("DELETE FROM media WHERE serverId = :serverId AND seriesId = :seriesId AND type = 'EPISODE'")
    suspend fun deleteEpisodesForSeries(serverId: Long, seriesId: String)

    /** Episodes whose series left the panel and that carry no user state. */
    @Query(
        """
        DELETE FROM media WHERE serverId = :serverId AND type = 'EPISODE'
            AND isFavorite = 0 AND watchPositionMs = 0 AND lastPlayedAt = 0
            AND seriesId NOT IN (SELECT id FROM media WHERE serverId = :serverId AND type = 'SERIES')
        """
    )
    suspend fun deleteOrphanEpisodes(serverId: Long): Int
}

@Dao
interface MediaSearchDao {
    // Upsert, never INSERT OR REPLACE: media_search is the FTS content table and a REPLACE
    // conflict deletes the old row without firing the index sync triggers.
    @Upsert
    suspend fun insertAll(items: List<MediaSearchEntity>)

    @Query("DELETE FROM media_search WHERE serverId = :serverId")
    suspend fun deleteForServer(serverId: Long)

    @Query("DELETE FROM media_search WHERE serverId = :serverId AND type IN (:types)")
    suspend fun deleteForServerTypes(serverId: Long, types: List<ContentType>)

    @Query("DELETE FROM media_search WHERE serverId = :serverId AND type = :type AND id IN (:ids)")
    suspend fun deleteIds(serverId: Long, type: ContentType, ids: List<String>)

    /** Run before [MediaDao.deleteEpisodesForSeries]; it selects the ids from media. */
    @Query(
        """
        DELETE FROM media_search WHERE serverId = :serverId AND type = 'EPISODE' AND id IN (
            SELECT id FROM media WHERE serverId = :serverId AND type = 'EPISODE' AND seriesId = :seriesId
        )
        """
    )
    suspend fun deleteEpisodesForSeries(serverId: Long, seriesId: String)

    /** Search rows whose media row no longer exists (after episode cleanup). */
    @Query(
        """
        DELETE FROM media_search WHERE serverId = :serverId AND type = 'EPISODE' AND id NOT IN (
            SELECT id FROM media WHERE serverId = :serverId AND type = 'EPISODE'
        )
        """
    )
    suspend fun deleteOrphanEpisodes(serverId: Long)
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

    /** When the episodes of a series were last fetched (seasons are stamped on every fetch). */
    @Query("SELECT MAX(updatedAt) FROM seasons WHERE serverId = :serverId AND seriesId = :seriesId")
    suspend fun cachedAt(serverId: Long, seriesId: String): Long?
}

@Dao
interface EpgDao {
    @Query("SELECT * FROM epg_programs WHERE serverId = :serverId AND channelKey = :channelKey AND endAt >= :now ORDER BY startAt ASC LIMIT :limit")
    suspend fun upcoming(serverId: Long, channelKey: String, now: Long, limit: Int): List<EpgProgramEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<EpgProgramEntity>)

    @Query("DELETE FROM epg_programs WHERE serverId = :serverId")
    suspend fun deleteForServer(serverId: Long)

    /** Drops guide rows written before [stamp] (a finished refresh) and programmes that already ended. */
    @Query("DELETE FROM epg_programs WHERE serverId = :serverId AND (updatedAt < :stamp OR (endAt > 0 AND endAt < :endedBefore))")
    suspend fun deleteStale(serverId: Long, stamp: Long, endedBefore: Long)
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
        MediaSearchFts::class,
        AccountInfoEntity::class,
        ServerInfoEntity::class,
        VodDetailsEntity::class,
        SeasonEntity::class,
        EpgProgramEntity::class,
        SyncStateEntity::class,
    ],
    version = 9,
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
        val userState = mediaDao().playbackState(serverId).toUserStateMap()
        categoryDao().deleteForServer(serverId)
        mediaDao().deleteForServer(serverId)
        mediaSearchDao().deleteForServer(serverId)
        accountInfoDao().deleteForServer(serverId)
        serverInfoDao().deleteForServer(serverId)
        vodDetailsDao().deleteForServer(serverId)
        seasonDao().deleteForServer(serverId)
        syncStateDao().deleteForServer(serverId)
        categoryDao().insertAll(categories)
        // Apply the favorite/watch-position overlay per chunk during insertion instead of
        // building a full second copy of the whole catalog first. On a 40k+ item library this
        // keeps only a 5k-item copy live at a time, cutting peak memory + GC so a background
        // sync does not stutter the UI the user is browsing.
        media.chunked(5_000).forEach { chunk ->
            val mergedChunk = chunk.withUserState(userState)
            mediaDao().insertAll(mergedChunk)
            mediaSearchDao().insertAll(mergedChunk.map { it.toSearchEntity() })
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
        // Snapshot favorites/resume once (only when re-syncing a section that already has rows),
        // then fold the overlay in PER CHUNK below — never build a second full copy of the section
        // (mirrors replaceServerContent; keeps peak memory at one 5k chunk on weak boxes).
        val userState = if (existingForTypes > 0) {
            mediaDao().playbackStateForTypes(serverId, normalizedTypes).toUserStateMap()
        } else {
            emptyMap()
        }

        categoryDao().deleteForServerTypes(serverId, normalizedTypes)
        mediaDao().deleteForServerTypes(serverId, normalizedTypes)
        mediaSearchDao().deleteForServerTypes(serverId, normalizedTypes)
        categoryDao().insertAll(categories)
        media.chunked(5_000).forEach { chunk ->
            val mergedChunk = chunk.withUserState(userState)
            mediaDao().insertAll(mergedChunk)
            mediaSearchDao().insertAll(mergedChunk.map { it.toSearchEntity() })
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
                    .addMigrations(MIGRATION_2_3, MIGRATION_3_4, MIGRATION_4_5, MIGRATION_5_6, MIGRATION_6_7, MIGRATION_7_8, MIGRATION_8_9)
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
