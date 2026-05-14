package com.mo.moplayer.worker

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkRequest
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.mo.moplayer.data.local.dao.ServerSyncStateDao
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.util.ContentChangeDetector
import com.mo.moplayer.util.ContentChangeSummary
import com.mo.moplayer.util.ContentSnapshot
import com.mo.moplayer.util.SyncEventBus
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.flow.first
import java.util.concurrent.TimeUnit

@HiltWorker
class ServerSyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val repository: IptvRepository,
    private val changeDetector: ContentChangeDetector,
    private val serverSyncStateDao: ServerSyncStateDao
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        private const val TAG = "ServerSyncWorker"
        private const val WORK_NAME = "server_sync_work"
        
        // Broadcast action for notifying UI about new content
        const val ACTION_NEW_CONTENT = "com.mo.moplayer.NEW_CONTENT"
        const val EXTRA_NEW_CHANNELS = "new_channels"
        const val EXTRA_NEW_MOVIES = "new_movies"
        const val EXTRA_NEW_SERIES = "new_series"
        const val EXTRA_TOTAL_NEW = "total_new"
        
        // Sync intervals
        object SyncIntervals {
            // WorkManager minimum interval is 15 minutes for periodic work.
            const val ACTIVE = 60L
            const val NORMAL = 120L
            const val IDLE = 180L
        }
        private const val SILENT_SYNC_COOLDOWN_MS = 6 * 60 * 60 * 1000L
        
        /**
         * Schedule periodic server sync.
         * Uses adaptive intervals based on app state.
         */
        fun schedule(context: Context, intervalMinutes: Long = SyncIntervals.NORMAL) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            
            val syncRequest = PeriodicWorkRequestBuilder<ServerSyncWorker>(
                intervalMinutes, TimeUnit.MINUTES,
                5, TimeUnit.MINUTES // Flex interval
            )
                .setConstraints(constraints)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    WorkRequest.MIN_BACKOFF_MILLIS,
                    TimeUnit.MILLISECONDS
                )
                .build()
            
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(
                    WORK_NAME,
                    ExistingPeriodicWorkPolicy.UPDATE, // Update with new interval
                    syncRequest
                )
            
            Log.d(TAG, "Server sync scheduled every $intervalMinutes minutes")
        }
        
        /**
         * Cancel scheduled sync
         */
        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
            Log.d(TAG, "Server sync cancelled")
        }
        
        /**
         * Run sync immediately (one-time)
         */
        fun syncNow(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            
            val syncRequest = OneTimeWorkRequestBuilder<ServerSyncWorker>()
                .setConstraints(constraints)
                .build()
            
            WorkManager.getInstance(context).enqueue(syncRequest)
            Log.d(TAG, "Immediate sync requested")
        }
        
        /**
         * Update sync interval (e.g., when app comes to foreground)
         */
        fun updateInterval(context: Context, intervalMinutes: Long) {
            schedule(context, intervalMinutes)
        }
    }

    override suspend fun doWork(): Result {
        Log.d(TAG, "Starting smart server sync...")
        
        return try {
            val server = repository.getActiveServer().first()
            
            if (server == null) {
                Log.d(TAG, "No active server, skipping sync")
                return Result.success()
            }

            // M3U playlists are local-only; Xtream API sync doesn't apply.
            if (!server.serverType.equals("xtream", ignoreCase = true) || server.serverUrl.isBlank()) {
                Log.d(TAG, "Active server is not Xtream (${server.serverType}), skipping sync")
                return Result.success()
            }

            val existingSnapshot = repository.getContentSnapshot(server.id)
            val lastState = serverSyncStateDao.getState(server.id)
            val lastSyncAt = lastState?.lastSyncAt ?: 0L
            val hasLocalContent = existingSnapshot.channelsCount > 0 ||
                existingSnapshot.moviesCount > 0 ||
                existingSnapshot.seriesCount > 0
            val recentlySynced = lastState?.lastStatus == "SUCCESS" &&
                hasLocalContent &&
                System.currentTimeMillis() - lastSyncAt < SILENT_SYNC_COOLDOWN_MS
            if (recentlySynced) {
                Log.d(TAG, "Skipping silent sync, content is still fresh enough")
                return Result.success()
            }
            
            // Get current snapshot BEFORE syncing
            val snapshotBefore = existingSnapshot
            Log.d(TAG, "Snapshot before sync: channels=${snapshotBefore.channelsCount}, movies=${snapshotBefore.moviesCount}, series=${snapshotBefore.seriesCount}")
            
            // Run unified sync contract (FULL includes categories/channels/movies/series/EPG).
            when (val sync = repository.syncActiveServer(com.mo.moplayer.data.repository.SyncMode.FULL)) {
                is com.mo.moplayer.util.Resource.Success -> {
                    Log.d(TAG, "Unified sync completed for server: ${server.name}")
                }
                is com.mo.moplayer.util.Resource.Error -> {
                    Log.w(TAG, "Unified sync finished with error: ${sync.message}")
                }
                else -> Unit
            }
            
            // Get snapshot AFTER syncing
            val snapshotAfter = repository.getContentSnapshot(server.id)
            Log.d(TAG, "Snapshot after sync: channels=${snapshotAfter.channelsCount}, movies=${snapshotAfter.moviesCount}, series=${snapshotAfter.seriesCount}")
            
            // Detect changes and save new snapshot
            val changes = changeDetector.checkAndSaveChanges(snapshotAfter)
            
            if (changes.hasNewContent) {
                Log.d(TAG, "New content detected! ${changes.toDisplayString()}")
                // Broadcast to UI about new content (non-intrusive notification)
                broadcastNewContent(changes)
            } else {
                Log.d(TAG, "No new content detected")
            }
            
            // Cleanup old EPG entries (older than 24 hours)
            Log.d(TAG, "Cleaning up old EPG entries")
            try {
                repository.cleanupOldEpg()
            } catch (e: Exception) {
                Log.w(TAG, "EPG cleanup failed (non-critical): ${e.message}")
            }
            
            Log.d(TAG, "Server sync completed successfully")
            Result.success()
            
        } catch (e: Exception) {
            Log.e(TAG, "Server sync failed: ${e.message}")
            
            // Retry on failure, but not indefinitely
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
    
    /**
     * Broadcast new content notification to UI components.
     * This allows the UI to show a non-intrusive indicator.
     */
    private fun broadcastNewContent(changes: ContentChangeSummary) {
        SyncEventBus.emit(
            SyncEventBus.SyncEvent.Completed(changes.totalNewContent)
        )
        Log.d(TAG, " SyncEventBus emit: $changes")
    }
}
