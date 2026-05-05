package com.mo.moplayer.util

import android.content.Context
import android.content.SharedPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages search history with persistence
 */
@Singleton
class SearchHistoryManager @Inject constructor(
    @ApplicationContext context: Context
) {
    companion object {
        private const val PREFS_NAME = "search_history"
        private const val KEY_HISTORY = "history"
        private const val MAX_HISTORY_SIZE = 10
        private const val SEPARATOR = "|||"
    }
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    /**
     * Get search history as a list
     */
    fun getHistory(): List<String> {
        val historyString = prefs.getString(KEY_HISTORY, "") ?: ""
        return if (historyString.isEmpty()) {
            emptyList()
        } else {
            historyString.split(SEPARATOR).filter { it.isNotBlank() }
        }
    }
    
    /**
     * Add a search query to history
     */
    fun addToHistory(query: String) {
        if (query.isBlank()) return
        
        val history = getHistory().toMutableList()
        
        // Remove if already exists (to move to front)
        history.removeAll { it.equals(query, ignoreCase = true) }
        
        // Add to front
        history.add(0, query.trim())
        
        // Keep only MAX_HISTORY_SIZE items
        val trimmedHistory = history.take(MAX_HISTORY_SIZE)
        
        // Save
        prefs.edit()
            .putString(KEY_HISTORY, trimmedHistory.joinToString(SEPARATOR))
            .apply()
    }
    
    /**
     * Remove a single item from history
     */
    fun removeFromHistory(query: String) {
        val history = getHistory().toMutableList()
        history.removeAll { it.equals(query, ignoreCase = true) }
        
        prefs.edit()
            .putString(KEY_HISTORY, history.joinToString(SEPARATOR))
            .apply()
    }
    
    /**
     * Clear all search history
     */
    fun clearHistory() {
        prefs.edit()
            .remove(KEY_HISTORY)
            .apply()
    }
}
