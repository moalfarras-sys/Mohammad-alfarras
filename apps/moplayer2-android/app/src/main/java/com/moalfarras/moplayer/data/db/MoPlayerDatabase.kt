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
    @Query("SELECT * FROM servers ORDER BY lastSyncAt DESC, createdAt DESC")
    fun observeServers(): Flow<List<ServerEntity>>

    @Query("SELECT * FROM servers ORDER BY lastSyncAt DESC, createdAt DESC LIMIT 1")
    fun observeActiveServer(): Flow<ServerEntity?>

    @Query("SELECT * FROM servers WHERE id = :id")
    suspend fun getServer(id: Long): ServerEntity?

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
            lastSyncSource = :lastSyncSource
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
    )

    @Query("DELETE FROM servers WHERE id = :serverId")
    suspend fun delete(serverId: Long)
}

@Dao
interface CategoryDao {
    @Query("SELECT * FROM categories WHERE serverId = :serverId AND type = :type ORDER BY sortOrder, name")
    fun observe(serverId: Long, type: ContentType): Flow<List<CategoryEntity>>

    @Upsert
    suspend fun upsertAll(items: List<CategoryEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<CategoryEntity>)

    @Query("DELETE FROM categories WHERE serverId = :serverId")
    suspend fun deleteForServer(serverId: Long)
}

@Dao
interface MediaDao {
    @Query("SELECT * FROM media WHERE serverId = :serverId AND type = :type ORDER BY serverOrder, title COLLATE NOCASE")
    fun observeByTypePaging(serverId: Long, type: ContentType): androidx.paging.PagingSource<Int, MediaEntity>

    @Query("SELECT * FROM media WHERE serverId = :serverId AND type = :type ORDER BY serverOrder, title COLLATE NOCASE")
    fun pagingByType(serverId: Long, type: ContentType): PagingSource<Int, MediaEntity>

    @Query("SELECT * FROM media WHERE serverId = :serverId AND type = :type AND categoryId = :categoryId ORDER BY serverOrder, title COLLATE NOCASE")
    fun observeByCategory(serverId: Long, type: ContentType, categoryId: String): Flow<List<MediaEntity>>

    @Query("SELECT * FROM media WHERE serverId = :serverId AND type = :type AND categoryId = :categoryId ORDER BY serverOrder, title COLLATE NOCASE")
    fun observeByCategoryPaging(serverId: Long, type: ContentType, categoryId: String): androidx.paging.PagingSource<Int, MediaEntity>

    @Query("SELECT * FROM media WHERE serverId = :serverId AND type IN (:types) ORDER BY CASE WHEN addedAt > 0 THEN addedAt ELSE lastModifiedAt END DESC, serverOrder ASC")
    fun observeLatestPaging(serverId: Long, types: List<ContentType>): androidx.paging.PagingSource<Int, MediaEntity>

    @Query("SELECT * FROM media WHERE serverId = :serverId AND isFavorite = 1 ORDER BY updatedAt DESC")
    fun observeFavoritesPaging(serverId: Long): androidx.paging.PagingSource<Int, MediaEntity>


    @Query("SELECT * FROM media WHERE serverId = :serverId AND seriesId = :seriesId AND type = 'EPISODE' ORDER BY seasonNumber, episodeNumber, title")
    fun observeEpisodes(serverId: Long, seriesId: String): Flow<List<MediaEntity>>

    @Query("SELECT * FROM media WHERE serverId = :serverId AND type != 'LIVE' AND watchPositionMs > 0 AND watchDurationMs > 0 ORDER BY lastPlayedAt DESC, updatedAt DESC")
    fun observeContinueWatchingPaging(serverId: Long): PagingSource<Int, MediaEntity>

    @Query("SELECT * FROM media WHERE serverId = :serverId AND type = :type AND lastPlayedAt > 0 ORDER BY lastPlayedAt DESC")
    fun observeRecentlyPlayedPaging(serverId: Long, type: ContentType): PagingSource<Int, MediaEntity>

    @Query("SELECT * FROM media WHERE serverId = :serverId AND title LIKE :query ESCAPE '\\' ORDER BY CASE WHEN lastPlayedAt > 0 THEN 0 ELSE 1 END, title COLLATE NOCASE")
    fun searchPaging(serverId: Long, query: String): PagingSource<Int, MediaEntity>

    @Query("SELECT * FROM media WHERE serverId = :serverId AND type = 'LIVE' AND lastPlayedAt > 0 ORDER BY lastPlayedAt DESC LIMIT 1")
    suspend fun lastPlayedLive(serverId: Long): MediaEntity?

    @Query("SELECT * FROM media WHERE serverId = :serverId AND id = :id AND type = :type LIMIT 1")
    suspend fun get(serverId: Long, id: String, type: ContentType): MediaEntity?

    @Query("SELECT id, type, isFavorite, watchPositionMs, watchDurationMs, lastPlayedAt FROM media WHERE serverId = :serverId")
    suspend fun playbackState(serverId: Long): List<MediaStateSnapshot>

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
        AccountInfoEntity::class,
        ServerInfoEntity::class,
        VodDetailsEntity::class,
        SeasonEntity::class,
        EpgProgramEntity::class,
        SyncStateEntity::class,
    ],
    version = 5,
    exportSchema = true,
)
@TypeConverters(MoConverters::class)
abstract class MoPlayerDatabase : RoomDatabase() {
    abstract fun serverDao(): ServerDao
    abstract fun categoryDao(): CategoryDao
    abstract fun mediaDao(): MediaDao
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
        accountInfoDao().deleteForServer(serverId)
        serverInfoDao().deleteForServer(serverId)
        vodDetailsDao().deleteForServer(serverId)
        seasonDao().deleteForServer(serverId)
        syncStateDao().deleteForServer(serverId)
        categoryDao().insertAll(categories)
        mergedMedia.chunked(5_000).forEach { mediaDao().insertAll(it) }
        if (accountInfo != null) accountInfoDao().upsert(accountInfo)
        if (serverInfo != null) serverInfoDao().upsert(serverInfo)
        if (syncState != null) syncStateDao().upsert(syncState)
        if (epgPrograms.isNotEmpty()) {
            epgDao().deleteForServer(serverId)
            epgPrograms.chunked(5_000).forEach { epgDao().insertAll(it) }
        }
        serverDao().touch(serverId, System.currentTimeMillis())
    }

    companion object {
        @Volatile private var instance: MoPlayerDatabase? = null

        fun get(context: Context): MoPlayerDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(context, MoPlayerDatabase::class.java, "moplayer.db")
                    .addMigrations(MIGRATION_2_3, MIGRATION_3_4, MIGRATION_4_5)
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
    }
}
