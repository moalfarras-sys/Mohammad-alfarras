package com.mo.moplayer.util

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.searchSuggestionsDataStore by preferencesDataStore(name = "search_suggestions")

/**
 * Manages search suggestions including recent searches and trending terms.
 * Provides autocomplete functionality for enhanced search UX.
 */
@Singleton
class SearchSuggestionsManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    companion object {
        private val RECENT_SEARCHES_KEY = stringSetPreferencesKey("recent_searches")
        private const val MAX_RECENT_SEARCHES = 10
        private const val MAX_SUGGESTIONS = 8
    }
    
    // Popular search terms (can be updated from server)
    private val trendingSearches = listOf(
        "Action",
        "Comedy",
        "Drama",
        "Horror",
        "Documentary",
        "Sports",
        "News",
        "Kids"
    )
    
    /**
     * Get recent searches as Flow
     */
    fun getRecentSearches(): Flow<List<String>> {
        return context.searchSuggestionsDataStore.data.map { prefs ->
            prefs[RECENT_SEARCHES_KEY]?.toList()?.reversed() ?: emptyList()
        }
    }
    
    /**
     * Add a search term to recent searches
     */
    suspend fun addRecentSearch(query: String) {
        if (query.isBlank()) return
        
        context.searchSuggestionsDataStore.edit { prefs ->
            val current = prefs[RECENT_SEARCHES_KEY]?.toMutableSet() ?: mutableSetOf()
            
            // Remove if already exists (to re-add at the end)
            current.remove(query)
            
            // Add new search
            current.add(query)
            
            // Keep only recent ones
            val limited = current.toList().takeLast(MAX_RECENT_SEARCHES).toSet()
            prefs[RECENT_SEARCHES_KEY] = limited
        }
    }
    
    /**
     * Remove a specific search from history
     */
    suspend fun removeRecentSearch(query: String) {
        context.searchSuggestionsDataStore.edit { prefs ->
            val current = prefs[RECENT_SEARCHES_KEY]?.toMutableSet() ?: mutableSetOf()
            current.remove(query)
            prefs[RECENT_SEARCHES_KEY] = current
        }
    }
    
    /**
     * Clear all recent searches
     */
    suspend fun clearRecentSearches() {
        context.searchSuggestionsDataStore.edit { prefs ->
            prefs.remove(RECENT_SEARCHES_KEY)
        }
    }
    
    /**
     * Get search suggestions based on input
     */
    suspend fun getSuggestions(query: String, contentTitles: List<String> = emptyList()): List<SearchSuggestion> {
        val suggestions = mutableListOf<SearchSuggestion>()
        val queryLower = query.lowercase()
        
        if (query.isEmpty()) {
            // Show recent searches and trending
            val recent = getRecentSearches().first().take(5)
            suggestions.addAll(recent.map { SearchSuggestion(it, SuggestionType.RECENT) })
            
            val trendingToAdd = trendingSearches
                .filter { t -> !recent.any { r -> r.equals(t, ignoreCase = true) } }
                .take(MAX_SUGGESTIONS - suggestions.size)
            suggestions.addAll(trendingToAdd.map { SearchSuggestion(it, SuggestionType.TRENDING) })
        } else {
            // Filter recent searches
            val recent = getRecentSearches().first()
                .filter { it.lowercase().contains(queryLower) }
                .take(3)
            suggestions.addAll(recent.map { SearchSuggestion(it, SuggestionType.RECENT) })
            
            // Filter content titles for autocomplete
            val matching = contentTitles
                .filter { it.lowercase().contains(queryLower) }
                .filter { title -> !recent.any { it.equals(title, ignoreCase = true) } }
                .take(MAX_SUGGESTIONS - suggestions.size)
            suggestions.addAll(matching.map { SearchSuggestion(it, SuggestionType.CONTENT) })
            
            // Add trending that matches
            if (suggestions.size < MAX_SUGGESTIONS) {
                val trendingMatch = trendingSearches
                    .filter { it.lowercase().contains(queryLower) }
                    .filter { t -> suggestions.none { s -> s.text.equals(t, ignoreCase = true) } }
                    .take(MAX_SUGGESTIONS - suggestions.size)
                suggestions.addAll(trendingMatch.map { SearchSuggestion(it, SuggestionType.TRENDING) })
            }
        }
        
        return suggestions.take(MAX_SUGGESTIONS)
    }
    
    data class SearchSuggestion(
        val text: String,
        val type: SuggestionType
    )
    
    enum class SuggestionType {
        RECENT,     // User's recent searches
        TRENDING,   // Popular searches
        CONTENT     // Matching content titles
    }
}
