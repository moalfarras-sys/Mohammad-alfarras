package com.mo.moplayer.data.local

import androidx.room.Database
import androidx.room.migration.Migration
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.mo.moplayer.data.local.dao.*
import com.mo.moplayer.data.local.entity.*

@Database(
    entities = [
        ServerEntity::class,
        CategoryEntity::class,
        ChannelEntity::class,
        MovieEntity::class,
        SeriesEntity::class,
        EpisodeEntity::class,
        FavoriteEntity::class,
        WatchHistoryEntity::class,
        EpgEntity::class,
        ServerSyncStateEntity::class,
        ContentSearchEntity::class
    ],
    version = 6,
    exportSchema = false
)
abstract class MoPlayerDatabase : RoomDatabase() {
    
    abstract fun serverDao(): ServerDao
    abstract fun categoryDao(): CategoryDao
    abstract fun channelDao(): ChannelDao
    abstract fun movieDao(): MovieDao
    abstract fun seriesDao(): SeriesDao
    abstract fun favoriteDao(): FavoriteDao
    abstract fun watchHistoryDao(): WatchHistoryDao
    abstract fun epgDao(): EpgDao
    abstract fun serverSyncStateDao(): ServerSyncStateDao
    abstract fun contentSearchDao(): ContentSearchDao
    
    companion object {
        const val DATABASE_NAME = "moplayer_database"

        val MIGRATION_5_6 = object : Migration(5, 6) {
            override fun migrate(db: SupportSQLiteDatabase) {
                // Schema unchanged. This version bump gives current installs a non-destructive
                // migration path so app updates keep the cached library and watch state.
            }
        }
    }
}
