package com.mo.moplayer.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
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
    version = 5,
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
    }
}
