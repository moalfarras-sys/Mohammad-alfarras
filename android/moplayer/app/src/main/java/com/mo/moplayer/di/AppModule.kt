package com.mo.moplayer.di

import android.content.Context
import androidx.room.Room
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.mo.moplayer.BuildConfig
import com.mo.moplayer.data.local.MoPlayerDatabase
import com.mo.moplayer.data.local.dao.*
import com.mo.moplayer.data.parser.M3uParser
import com.mo.moplayer.data.remote.api.XtreamApi
import com.mo.moplayer.util.ContentChangeDetector
import com.mo.moplayer.util.SensitiveLoggingInterceptor
import com.mo.moplayer.util.SmartRefreshManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.ConnectionPool
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    
    @Provides
    @Singleton
    fun provideGson(): Gson = GsonBuilder()
        .setLenient()
        .create()
    
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder().apply {
            // Only add logging interceptor in debug builds for security
            if (BuildConfig.DEBUG) {
                addInterceptor(SensitiveLoggingInterceptor())
            }
            
            // Optimized timeouts for IPTV streaming
            connectTimeout(30, TimeUnit.SECONDS)
            readTimeout(120, TimeUnit.SECONDS)  // Increased for large playlist downloads
            writeTimeout(60, TimeUnit.SECONDS)
            // Connection pooling for better performance
            connectionPool(ConnectionPool(10, 5, TimeUnit.MINUTES))
            // Retry on connection failure for reliability
            retryOnConnectionFailure(true)
        }.build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient, gson: Gson): Retrofit {
        return Retrofit.Builder()
            .baseUrl("http://localhost/") // Base URL is overridden per request
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }
    
    @Provides
    @Singleton
    fun provideXtreamApi(retrofit: Retrofit): XtreamApi {
        return retrofit.create(XtreamApi::class.java)
    }

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): MoPlayerDatabase {
        return Room.databaseBuilder(
            context,
            MoPlayerDatabase::class.java,
            MoPlayerDatabase.DATABASE_NAME
        )
            // WARNING: fallbackToDestructiveMigration() causes data loss on schema version change.
            // When upgrading MoPlayerDatabase version, add explicit Migration objects instead:
            // .addMigrations(MIGRATION_4_5)
            .fallbackToDestructiveMigration()
            .build()
    }
    
    @Provides
    @Singleton
    fun provideServerDao(database: MoPlayerDatabase): ServerDao = database.serverDao()
    
    @Provides
    @Singleton
    fun provideCategoryDao(database: MoPlayerDatabase): CategoryDao = database.categoryDao()
    
    @Provides
    @Singleton
    fun provideChannelDao(database: MoPlayerDatabase): ChannelDao = database.channelDao()
    
    @Provides
    @Singleton
    fun provideMovieDao(database: MoPlayerDatabase): MovieDao = database.movieDao()
    
    @Provides
    @Singleton
    fun provideSeriesDao(database: MoPlayerDatabase): SeriesDao = database.seriesDao()
    
    @Provides
    @Singleton
    fun provideFavoriteDao(database: MoPlayerDatabase): FavoriteDao = database.favoriteDao()
    
    @Provides
    @Singleton
    fun provideWatchHistoryDao(database: MoPlayerDatabase): WatchHistoryDao = database.watchHistoryDao()
    
    @Provides
    @Singleton
    fun provideEpgDao(database: MoPlayerDatabase): EpgDao = database.epgDao()

    @Provides
    @Singleton
    fun provideServerSyncStateDao(database: MoPlayerDatabase): ServerSyncStateDao =
        database.serverSyncStateDao()

    @Provides
    @Singleton
    fun provideContentSearchDao(database: MoPlayerDatabase): ContentSearchDao =
        database.contentSearchDao()
    
    @Provides
    @Singleton
    fun provideM3uParser(): M3uParser = M3uParser()
    
    @Provides
    @Singleton
    fun provideCastManager(@ApplicationContext context: Context): com.mo.moplayer.util.CastManager {
        return com.mo.moplayer.util.CastManager(context).apply {
            initialize()
        }
    }
    
    @Provides
    @Singleton
    fun provideContentChangeDetector(@ApplicationContext context: Context): ContentChangeDetector {
        return ContentChangeDetector(context)
    }
    
    @Provides
    @Singleton
    fun provideSmartRefreshManager(
        repository: com.mo.moplayer.data.repository.IptvRepository,
        changeDetector: ContentChangeDetector,
        @ApplicationContext context: Context
    ): SmartRefreshManager {
        return SmartRefreshManager(repository, changeDetector, context)
    }
}
