package com.mo.moplayer.data.sync

import android.content.Context
import androidx.work.*
import androidx.hilt.work.HiltWorker
import com.mo.moplayer.data.repository.IptvRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Smart Sync Manager
 * Only fetches changed content instead of full refresh
 * Uses delta updates for better performance
 */
@Singleton
class SmartSyncManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val repository: IptvRepository
) {
    
    companion object {
        private const val SYNC_WORK_NAME = "smart_sync_work"
        private const val SYNC_INTERVAL_HOURS = 6L
        
        const val KEY_SERVER_ID = "server_id"
        const val KEY_SYNC_TYPE = "sync_type"
        
        const val SYNC_TYPE_ALL = "all"
        const val SYNC_TYPE_MOVIES = "movies"
        const val SYNC_TYPE_SERIES = "series"
        const val SYNC_TYPE_CHANNELS = "channels"
    }
    
    /**
     * Schedule periodic background sync
     */
    fun schedulePeriodicSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()
        
        val syncRequest = PeriodicWorkRequestBuilder<SmartSyncWorker>(
            SYNC_INTERVAL_HOURS,
            TimeUnit.HOURS
        )
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                15,
                TimeUnit.MINUTES
            )
            .build()
        
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            SYNC_WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        )
    }
    
    /**
     * Cancel periodic sync
     */
    fun cancelPeriodicSync() {
        WorkManager.getInstance(context).cancelUniqueWork(SYNC_WORK_NAME)
    }
    
    /**
     * Perform manual sync now
     */
    fun syncNow(serverId: String, syncType: String = SYNC_TYPE_ALL) {
        val syncRequest = OneTimeWorkRequestBuilder<SmartSyncWorker>()
            .setInputData(
                workDataOf(
                    KEY_SERVER_ID to serverId,
                    KEY_SYNC_TYPE to syncType
                )
            )
            .build()
        
        WorkManager.getInstance(context).enqueue(syncRequest)
    }
    
    /**
     * Perform delta sync for movies
     * Uses full sync until delta API is available
     */
    suspend fun syncMoviesDelta(serverId: String): SyncResult {
        return withContext(Dispatchers.IO) {
            try {
                val server = repository.getActiveServerSync()
                if (server != null && server.id.toString() == serverId) {
                    when (val result = repository.fetchAndSaveMovies(server)) {
                        is com.mo.moplayer.util.Resource.Success -> SyncResult.Success(
                            itemsAdded = result.data ?: 0,
                            itemsUpdated = 0,
                            itemsDeleted = 0
                        )
                        is com.mo.moplayer.util.Resource.Error -> SyncResult.Error(result.message ?: "Unknown error")
                        else -> SyncResult.Success(itemsAdded = 0, itemsUpdated = 0, itemsDeleted = 0)
                    }
                } else {
                    SyncResult.Success(itemsAdded = 0, itemsUpdated = 0, itemsDeleted = 0)
                }
            } catch (e: Exception) {
                SyncResult.Error(e.message ?: "Unknown error")
            }
        }
    }
    
    /**
     * Perform delta sync for series
     * Uses full sync until delta API is available
     */
    suspend fun syncSeriesDelta(serverId: String): SyncResult {
        return withContext(Dispatchers.IO) {
            try {
                val server = repository.getActiveServerSync()
                if (server != null && server.id.toString() == serverId) {
                    when (val result = repository.fetchAndSaveSeries(server)) {
                        is com.mo.moplayer.util.Resource.Success -> SyncResult.Success(
                            itemsAdded = result.data ?: 0,
                            itemsUpdated = 0,
                            itemsDeleted = 0
                        )
                        is com.mo.moplayer.util.Resource.Error -> SyncResult.Error(result.message ?: "Unknown error")
                        else -> SyncResult.Success(itemsAdded = 0, itemsUpdated = 0, itemsDeleted = 0)
                    }
                } else {
                    SyncResult.Success(itemsAdded = 0, itemsUpdated = 0, itemsDeleted = 0)
                }
            } catch (e: Exception) {
                SyncResult.Error(e.message ?: "Unknown error")
            }
        }
    }
    
    /**
     * Perform delta sync for channels
     * Uses full sync until delta API is available
     */
    suspend fun syncChannelsDelta(serverId: String): SyncResult {
        return withContext(Dispatchers.IO) {
            try {
                val server = repository.getActiveServerSync()
                if (server != null && server.id.toString() == serverId) {
                    when (val result = repository.fetchAndSaveChannels(server)) {
                        is com.mo.moplayer.util.Resource.Success -> SyncResult.Success(
                            itemsAdded = result.data ?: 0,
                            itemsUpdated = 0,
                            itemsDeleted = 0
                        )
                        is com.mo.moplayer.util.Resource.Error -> SyncResult.Error(result.message ?: "Unknown error")
                        else -> SyncResult.Success(itemsAdded = 0, itemsUpdated = 0, itemsDeleted = 0)
                    }
                } else {
                    SyncResult.Success(itemsAdded = 0, itemsUpdated = 0, itemsDeleted = 0)
                }
            } catch (e: Exception) {
                SyncResult.Error(e.message ?: "Unknown error")
            }
        }
    }
    
    /**
     * Perform full sync (all content types)
     */
    suspend fun syncAll(serverId: String): Map<String, SyncResult> {
        return mapOf(
            "movies" to syncMoviesDelta(serverId),
            "series" to syncSeriesDelta(serverId),
            "channels" to syncChannelsDelta(serverId)
        )
    }
    
    /**
     * Check if sync is needed based on server changes
     * Stub: returns false until version API is available
     */
    suspend fun isSyncNeeded(serverId: String): Boolean {
        return withContext(Dispatchers.IO) {
            false
        }
    }
}

/**
 * Sync result data class
 */
sealed class SyncResult {
    data class Success(
        val itemsAdded: Int,
        val itemsUpdated: Int,
        val itemsDeleted: Int
    ) : SyncResult()
    
    data class Error(val message: String) : SyncResult()
}

/**
 * Background worker for smart sync
 */
@HiltWorker
class SmartSyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val smartSyncManager: SmartSyncManager
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        // Get server ID from input data
        val serverId = inputData.getString(SmartSyncManager.KEY_SERVER_ID)
            ?: return Result.failure()
        
        val syncType = inputData.getString(SmartSyncManager.KEY_SYNC_TYPE)
            ?: SmartSyncManager.SYNC_TYPE_ALL
        
        return try {
            // Perform sync based on type
            val result = when (syncType) {
                SmartSyncManager.SYNC_TYPE_MOVIES -> {
                    smartSyncManager.syncMoviesDelta(serverId)
                }
                SmartSyncManager.SYNC_TYPE_SERIES -> {
                    smartSyncManager.syncSeriesDelta(serverId)
                }
                SmartSyncManager.SYNC_TYPE_CHANNELS -> {
                    smartSyncManager.syncChannelsDelta(serverId)
                }
                else -> {
                    val all = smartSyncManager.syncAll(serverId)
                    val firstError = all.values.filterIsInstance<SyncResult.Error>().firstOrNull()
                    firstError ?: SyncResult.Success(itemsAdded = 0, itemsUpdated = 0, itemsDeleted = 0)
                }
            }

            when (result) {
                is SyncResult.Success -> Result.success()
                is SyncResult.Error -> Result.retry()
            }
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
