package com.mo.moplayer.util

import android.content.Context
import android.util.Log
import com.mo.moplayer.data.local.entity.ServerEntity
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.worker.ServerSyncWorker
import com.mo.moplayer.worker.ServerSyncWorker.Companion.SyncIntervals
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Smart refresh manager for handling foreground content updates.
 * 
 * This manager provides:
 * - Lightweight content checks while app is active
 * - Non-intrusive background updates
 * - Adaptive refresh intervals based on user activity
 * - StateFlow for observing new content availability
 */
@Singleton
class SmartRefreshManager @Inject constructor(
    private val repository: IptvRepository,
    private val changeDetector: ContentChangeDetector,
    private val context: Context
) {
    companion object {
        private const val TAG = "SmartRefreshManager"
        
        // Refresh intervals in milliseconds
        const val QUICK_CHECK_INTERVAL = 10 * 60 * 1000L     // 10 minutes for quiet foreground checks
        const val FULL_REFRESH_INTERVAL = 6 * 60 * 60 * 1000L // 6 hours for optional full refresh
        const val MIN_REFRESH_INTERVAL = 5 * 60 * 1000L      // 5 minutes minimum between refreshes
    }
    
    private var refreshJob: Job? = null
    private var isActive = false
    
    // StateFlow for new content notifications
    private val _newContentAvailable = MutableStateFlow<ContentChangeSummary?>(null)
    val newContentAvailable: StateFlow<ContentChangeSummary?> = _newContentAvailable.asStateFlow()
    
    // StateFlow for refresh state
    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()
    
    // Last refresh timestamp
    private var lastRefreshTime = 0L
    private var lastQuickCheckTime = 0L
    private var allowAutomaticFullRefresh = false
    
    /**
     * Start smart refresh when app comes to foreground.
     * This starts a coroutine that periodically checks for new content.
     */
    fun startForegroundRefresh(scope: CoroutineScope) {
        if (isActive) {
            Log.d(TAG, "Smart refresh already active")
            return
        }
        
        isActive = true
        allowAutomaticFullRefresh = false
        Log.d(TAG, "Starting foreground smart refresh")
        
        // Keep periodic sync conservative while user is actively browsing.
        ServerSyncWorker.updateInterval(context, SyncIntervals.ACTIVE)
        
        refreshJob = scope.launch {
            while (isActive) {
                try {
                    // Quick check first
                    performQuickCheck()
                    
                    // Wait before next check
                    delay(QUICK_CHECK_INTERVAL)
                    
                } catch (e: CancellationException) {
                    Log.d(TAG, "Refresh job cancelled")
                    throw e
                } catch (e: Exception) {
                    Log.e(TAG, "Error during refresh: ${e.message}")
                    delay(MIN_REFRESH_INTERVAL) // Wait before retry
                }
            }
        }
    }
    
    /**
     * Stop smart refresh when app goes to background.
     */
    fun stopForegroundRefresh() {
        isActive = false
        refreshJob?.cancel(CancellationException("App moved to background"))
        refreshJob = null
        Log.d(TAG, "Stopped foreground smart refresh")
        
        // Return worker cadence to an even quieter background interval.
        ServerSyncWorker.updateInterval(context, SyncIntervals.IDLE)
    }
    
    /**
     * Perform a quick check for new content by comparing counts.
     * This is a lightweight operation that doesn't download full data.
     */
    private suspend fun performQuickCheck() {
        val now = System.currentTimeMillis()
        if (now - lastQuickCheckTime < MIN_REFRESH_INTERVAL) {
            return // Too soon since last check
        }
        lastQuickCheckTime = now
        
        val server = repository.getActiveServerSync() ?: return
        
        // Skip for non-Xtream servers
        if (!server.serverType.equals("xtream", ignoreCase = true) || server.serverUrl.isBlank()) {
            return
        }
        
        Log.d(TAG, "Performing quick content check...")
        
        // Get current local snapshot
        val localSnapshot = repository.getContentSnapshot(server.id)
        val savedSnapshot = changeDetector.getSavedSnapshot(server.id)
        
        // Compare with saved snapshot
        val changes = changeDetector.detectChanges(savedSnapshot, localSnapshot)
        
        if (changes.hasNewContent) {
            Log.d(TAG, "Quick check found new content: ${changes.toDisplayString()}")
            _newContentAvailable.value = changes
        }
        
        // Optional full refresh is disabled by default to avoid heavy sync during active UI sessions.
        if (allowAutomaticFullRefresh && now - lastRefreshTime >= FULL_REFRESH_INTERVAL && !_isRefreshing.value) {
            performFullRefresh(server)
        }
    }
    
    /**
     * Perform a full data refresh from the server.
     * This downloads and compares all content.
     */
    private suspend fun performFullRefresh(server: ServerEntity) {
        if (_isRefreshing.value) {
            Log.d(TAG, "Full refresh already in progress")
            return
        }
        
        _isRefreshing.value = true
        lastRefreshTime = System.currentTimeMillis()
        
        Log.d(TAG, "Performing full data refresh...")
        
        try {
            // Get snapshot before refresh
            val snapshotBefore = repository.getContentSnapshot(server.id)
            
            // Sync all content silently
            repository.fetchAndSaveCategories(server)
            repository.fetchAndSaveChannels(server)
            repository.fetchAndSaveMovies(server)
            repository.fetchAndSaveSeries(server)
            
            // Get snapshot after refresh
            val snapshotAfter = repository.getContentSnapshot(server.id)
            
            // Check for new content
            val changes = changeDetector.checkAndSaveChanges(snapshotAfter)
            
            if (changes.hasNewContent) {
                Log.d(TAG, "Full refresh found new content: ${changes.toDisplayString()}")
                _newContentAvailable.value = changes
            }
            
            Log.d(TAG, "Full refresh completed")
            
        } catch (e: Exception) {
            Log.e(TAG, "Full refresh failed: ${e.message}")
        } finally {
            _isRefreshing.value = false
        }
    }
    
    /**
     * Force an immediate refresh.
     * Call this when user explicitly requests a refresh.
     */
    suspend fun forceRefresh() {
        val server = repository.getActiveServerSync() ?: return
        
        if (!server.serverType.equals("xtream", ignoreCase = true) || server.serverUrl.isBlank()) {
            return
        }
        
        performFullRefresh(server)
    }

    /**
     * Enable/disable automatic full refresh while foreground checks are running.
     * Keep disabled during heavy navigation sessions and enable only for explicit user preference.
     */
    fun setAutomaticFullRefreshEnabled(enabled: Boolean) {
        allowAutomaticFullRefresh = enabled
    }
    
    /**
     * Clear the new content notification.
     * Call this when user has seen/acknowledged the new content.
     */
    fun clearNewContentNotification() {
        _newContentAvailable.value = null
    }
    
    /**
     * Check if there's new content available.
     */
    fun hasNewContent(): Boolean {
        return _newContentAvailable.value?.hasNewContent == true
    }
    
    /**
     * Get the current new content summary.
     */
    fun getNewContentSummary(): ContentChangeSummary? {
        return _newContentAvailable.value
    }
}
