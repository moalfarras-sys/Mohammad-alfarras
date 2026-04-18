package com.mo.moplayer.ui.search

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mo.moplayer.data.local.entity.ChannelEntity
import com.mo.moplayer.data.local.entity.MovieEntity
import com.mo.moplayer.data.local.entity.SeriesEntity
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.util.SearchHistoryManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val repository: IptvRepository,
    private val searchHistoryManager: SearchHistoryManager
) : ViewModel() {

    private val _searchResults = MutableLiveData<List<SearchResult>>()
    val searchResults: LiveData<List<SearchResult>> = _searchResults

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _searchQuery = MutableLiveData("")
    val searchQuery: LiveData<String> = _searchQuery

    private val _selectedFilter = MutableLiveData(SearchFilter.ALL)
    val selectedFilter: LiveData<SearchFilter> = _selectedFilter

    private val _resultsCount = MutableLiveData(0)
    val resultsCount: LiveData<Int> = _resultsCount

    private var searchJob: Job? = null
    private var serverId: Long = 0

    init {
        loadServerId()
    }

    private fun loadServerId() {
        viewModelScope.launch {
            repository.getActiveServer().first()?.let { server ->
                serverId = server.id
            }
        }
    }

    fun search(query: String) {
        _searchQuery.value = query
        
        // Cancel previous search
        searchJob?.cancel()
        
        if (query.isBlank()) {
            _searchResults.value = emptyList()
            _resultsCount.value = 0
            return
        }
        
        // Debounce search
        searchJob = viewModelScope.launch {
            delay(300) // Wait for user to stop typing
            performSearch(query)
        }
    }

    fun commitSearch(query: String) {
        val trimmed = query.trim()
        if (trimmed.length >= 2) {
            searchHistoryManager.addToHistory(trimmed)
        }
    }

    private suspend fun performSearch(query: String) {
        _isLoading.value = true
        
        val results = mutableListOf<SearchResult>()
        val filter = _selectedFilter.value ?: SearchFilter.ALL
        
        try {
            // Search channels
            if (filter == SearchFilter.ALL || filter == SearchFilter.CHANNELS) {
                val channels = repository.searchChannels(serverId, query).first()
                results.addAll(channels.map { SearchResult.Channel(it) })
            }
            
            // Search movies
            if (filter == SearchFilter.ALL || filter == SearchFilter.MOVIES) {
                val movies = repository.searchMovies(serverId, query).first()
                results.addAll(movies.map { SearchResult.Movie(it) })
            }
            
            // Search series
            if (filter == SearchFilter.ALL || filter == SearchFilter.SERIES) {
                val series = repository.searchSeries(serverId, query).first()
                results.addAll(series.map { SearchResult.Series(it) })
            }
            
            // Sort results by relevance (exact match first)
            val sortedResults = results.sortedByDescending { result ->
                val name = when (result) {
                    is SearchResult.Channel -> result.channel.name
                    is SearchResult.Movie -> result.movie.name
                    is SearchResult.Series -> result.series.name
                }
                when {
                    name.equals(query, ignoreCase = true) -> 3
                    name.startsWith(query, ignoreCase = true) -> 2
                    name.contains(query, ignoreCase = true) -> 1
                    else -> 0
                }
            }
            
            _searchResults.value = sortedResults
            _resultsCount.value = sortedResults.size
        } catch (e: Exception) {
            _searchResults.value = emptyList()
            _resultsCount.value = 0
        } finally {
            _isLoading.value = false
        }
    }

    fun setFilter(filter: SearchFilter) {
        _selectedFilter.value = filter
        // Re-run search with new filter
        _searchQuery.value?.let { query ->
            if (query.isNotBlank()) {
                searchJob?.cancel()
                searchJob = viewModelScope.launch {
                    performSearch(query)
                }
            }
        }
    }

    enum class SearchFilter {
        ALL, CHANNELS, MOVIES, SERIES
    }

    sealed class SearchResult {
        data class Channel(val channel: ChannelEntity) : SearchResult()
        data class Movie(val movie: MovieEntity) : SearchResult()
        data class Series(val series: SeriesEntity) : SearchResult()
    }
}
