package com.mo.moplayer.util

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Smart content change detector that tracks content counts and detects new content.
 * This enables non-intrusive updates by comparing server content with cached snapshots.
 */

// DataStore for storing content snapshots
private val Context.contentSnapshotStore: DataStore<Preferences> by preferencesDataStore(
    name = "content_snapshot"
)

/**
 * Represents a snapshot of content counts at a specific point in time
 */
data class ContentSnapshot(
    val serverId: Long,
    val channelsCount: Int,
    val moviesCount: Int,
    val seriesCount: Int,
    val categoriesCount: Int,
    val timestamp: Long = System.currentTimeMillis()
) {
    companion object {
        fun empty(serverId: Long) = ContentSnapshot(
            serverId = serverId,
            channelsCount = 0,
            moviesCount = 0,
            seriesCount = 0,
            categoriesCount = 0
        )
    }
}

/**
 * Summary of detected content changes
 */
data class ContentChangeSummary(
    val hasChanges: Boolean,
    val newChannels: Int = 0,
    val newMovies: Int = 0,
    val newSeries: Int = 0,
    val newCategories: Int = 0,
    val totalNewContent: Int = newChannels + newMovies + newSeries
) {
    val hasNewContent: Boolean get() = totalNewContent > 0
    
    fun toDisplayString(): String {
        val parts = mutableListOf<String>()
        if (newChannels > 0) parts.add("$newChannels قناة")
        if (newMovies > 0) parts.add("$newMovies فيلم")
        if (newSeries > 0) parts.add("$newSeries مسلسل")
        return if (parts.isEmpty()) "" else parts.joinToString(" • ")
    }
    
    companion object {
        val NO_CHANGES = ContentChangeSummary(hasChanges = false)
    }
}

@Singleton
class ContentChangeDetector @Inject constructor(
    private val context: Context
) {
    private val dataStore = context.contentSnapshotStore
    
    // DataStore keys
    private fun channelsCountKey(serverId: Long) = intPreferencesKey("channels_count_$serverId")
    private fun moviesCountKey(serverId: Long) = intPreferencesKey("movies_count_$serverId")
    private fun seriesCountKey(serverId: Long) = intPreferencesKey("series_count_$serverId")
    private fun categoriesCountKey(serverId: Long) = intPreferencesKey("categories_count_$serverId")
    private fun lastSyncKey(serverId: Long) = longPreferencesKey("last_sync_$serverId")
    
    /**
     * Get the saved content snapshot for a server
     */
    suspend fun getSavedSnapshot(serverId: Long): ContentSnapshot {
        val prefs = dataStore.data.first()
        return ContentSnapshot(
            serverId = serverId,
            channelsCount = prefs[channelsCountKey(serverId)] ?: 0,
            moviesCount = prefs[moviesCountKey(serverId)] ?: 0,
            seriesCount = prefs[seriesCountKey(serverId)] ?: 0,
            categoriesCount = prefs[categoriesCountKey(serverId)] ?: 0,
            timestamp = prefs[lastSyncKey(serverId)] ?: 0L
        )
    }
    
    /**
     * Save a content snapshot
     */
    suspend fun saveSnapshot(snapshot: ContentSnapshot) {
        dataStore.edit { prefs ->
            prefs[channelsCountKey(snapshot.serverId)] = snapshot.channelsCount
            prefs[moviesCountKey(snapshot.serverId)] = snapshot.moviesCount
            prefs[seriesCountKey(snapshot.serverId)] = snapshot.seriesCount
            prefs[categoriesCountKey(snapshot.serverId)] = snapshot.categoriesCount
            prefs[lastSyncKey(snapshot.serverId)] = snapshot.timestamp
        }
    }
    
    /**
     * Compare two snapshots and detect changes
     */
    fun detectChanges(oldSnapshot: ContentSnapshot, newSnapshot: ContentSnapshot): ContentChangeSummary {
        val newChannels = maxOf(0, newSnapshot.channelsCount - oldSnapshot.channelsCount)
        val newMovies = maxOf(0, newSnapshot.moviesCount - oldSnapshot.moviesCount)
        val newSeries = maxOf(0, newSnapshot.seriesCount - oldSnapshot.seriesCount)
        val newCategories = maxOf(0, newSnapshot.categoriesCount - oldSnapshot.categoriesCount)
        
        val hasChanges = newChannels > 0 || newMovies > 0 || newSeries > 0 || newCategories > 0
        
        return ContentChangeSummary(
            hasChanges = hasChanges,
            newChannels = newChannels,
            newMovies = newMovies,
            newSeries = newSeries,
            newCategories = newCategories
        )
    }
    
    /**
     * Check if content has changed and save new snapshot
     * Returns the change summary
     */
    suspend fun checkAndSaveChanges(newSnapshot: ContentSnapshot): ContentChangeSummary {
        val oldSnapshot = getSavedSnapshot(newSnapshot.serverId)
        val changes = detectChanges(oldSnapshot, newSnapshot)
        
        // Always save the new snapshot
        saveSnapshot(newSnapshot)
        
        return changes
    }
    
    /**
     * Get the time since last sync in milliseconds
     */
    suspend fun getTimeSinceLastSync(serverId: Long): Long {
        val lastSync = dataStore.data.first()[lastSyncKey(serverId)] ?: 0L
        return if (lastSync == 0L) Long.MAX_VALUE else System.currentTimeMillis() - lastSync
    }
    
    /**
     * Check if sync is needed based on time threshold
     */
    suspend fun isSyncNeeded(serverId: Long, thresholdMs: Long): Boolean {
        return getTimeSinceLastSync(serverId) >= thresholdMs
    }
    
    /**
     * Flow of the last sync timestamp for a server
     */
    fun getLastSyncFlow(serverId: Long): Flow<Long> {
        return dataStore.data.map { prefs ->
            prefs[lastSyncKey(serverId)] ?: 0L
        }
    }
    
    /**
     * Clear snapshot data for a server (e.g., when server is deleted)
     */
    suspend fun clearSnapshot(serverId: Long) {
        dataStore.edit { prefs ->
            prefs.remove(channelsCountKey(serverId))
            prefs.remove(moviesCountKey(serverId))
            prefs.remove(seriesCountKey(serverId))
            prefs.remove(categoriesCountKey(serverId))
            prefs.remove(lastSyncKey(serverId))
        }
    }
}
