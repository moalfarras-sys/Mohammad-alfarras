package com.mo.moplayer.ui.home

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.*
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.data.repository.WatchHistoryRepository
import com.mo.moplayer.util.ContentChangeSummary
import com.mo.moplayer.util.SmartRefreshManager
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: IptvRepository,
    private val watchHistoryRepository: WatchHistoryRepository,
    @ApplicationContext private val context: android.content.Context
) : ViewModel() {
    
    // Using StateFlow for smoother reactive updates
    private val _contentRows = MutableStateFlow<List<ContentRow>>(emptyList())
    val contentRowsFlow: StateFlow<List<ContentRow>> = _contentRows.asStateFlow()
    
    // Keep LiveData for backward compatibility
    private val _contentRowsLiveData = MutableLiveData<List<ContentRow>>()
    val contentRows: LiveData<List<ContentRow>> = _contentRowsLiveData
    
    private val _activeServer = MutableStateFlow<ServerEntity?>(null)
    val activeServer: StateFlow<ServerEntity?> = _activeServer.asStateFlow()

    private val _dashboardState = MutableStateFlow(HomeDashboardState())
    val dashboardState: StateFlow<HomeDashboardState> = _dashboardState.asStateFlow()
    
    // Keep LiveData version for backward compatibility
    private val _activeServerLiveData = MutableLiveData<ServerEntity?>()
    val activeServerLiveData: LiveData<ServerEntity?> = _activeServerLiveData
    
    private val _isLoading = MutableStateFlow(false)
    val isLoadingFlow: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    // Keep LiveData for backward compatibility
    private val _isLoadingLiveData = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoadingLiveData
    
    // New content notification
    private val _newContentAvailable = MutableSharedFlow<ContentChangeSummary>()
    val newContentAvailable: SharedFlow<ContentChangeSummary> = _newContentAvailable.asSharedFlow()
    private var contentObserverJob: Job? = null
    private val rowCache = linkedMapOf<String, ContentRow>()
    private val rowOrder = listOf(
        "continue_watching",
        "recent_movies",
        "recent_series",
        "favorites",
        "recent_history"
    )
    
    init {
        observeContent()
    }

    private fun observeContent() {
        viewModelScope.launch {
            repository.getActiveServer().collectLatest { server ->
                contentObserverJob?.cancel()
                _activeServer.value = server
                _activeServerLiveData.value = server

                if (server == null) {
                    rowCache.clear()
                    _contentRows.value = emptyList()
                    _contentRowsLiveData.value = emptyList()
                    _dashboardState.value = HomeDashboardState()
                    _isLoading.value = false
                    _isLoadingLiveData.value = false
                    return@collectLatest
                }

                loadDashboardState(server)
                _contentRows.value = emptyList()
                _contentRowsLiveData.value = emptyList()
                _isLoading.value = true
                _isLoadingLiveData.value = true
                rowCache.clear()
                contentObserverJob = launch {
                    val pendingSections = mutableSetOf(
                        "continue_watching",
                        "recent_history",
                        "favorites",
                        "recent_movies",
                        "recent_series"
                    )

                    launch {
                        watchHistoryRepository.getContinueWatchingFlow()
                            .distinctUntilChangedBy { rows -> rows.map { it.id } }
                            .collect { continueWatching ->
                                updateRow(
                                    key = "continue_watching",
                                    row = if (continueWatching.isNotEmpty()) {
                                        ContentRow(
                                            id = "continue_watching",
                                            title = context.getString(R.string.section_continue_watching),
                                            items = continueWatching.map { it.toContentItem() },
                                            type = ContentRowType.CONTINUE_WATCHING
                                        )
                                    } else null
                                )
                                pendingSections.remove("continue_watching")
                                if (pendingSections.isEmpty()) setLoading(false)
                            }
                    }

                    launch {
                        watchHistoryRepository.getRecentHistoryFlow(20)
                            .distinctUntilChangedBy { rows -> rows.map { it.id } }
                            .collect { recentHistory ->
                                val recentOnly = recentHistory.filterNot { it.isContinueWatchingCandidate() }
                                updateRow(
                                    key = "recent_history",
                                    row = if (recentOnly.isNotEmpty()) {
                                        ContentRow(
                                            id = "recent_history",
                                            title = context.getString(R.string.section_recently_watched),
                                            items = recentOnly.map { it.toContentItem() },
                                            type = ContentRowType.CONTINUE_WATCHING
                                        )
                                    } else null
                                )
                                pendingSections.remove("recent_history")
                                if (pendingSections.isEmpty()) setLoading(false)
                            }
                    }

                    launch {
                        repository.getAllFavorites(server.id)
                            .distinctUntilChangedBy { rows -> rows.map { it.id } }
                            .collect { favorites ->
                                updateRow(
                                    key = "favorites",
                                    row = if (favorites.isNotEmpty()) {
                                        ContentRow(
                                            id = "favorites",
                                            title = context.getString(R.string.section_favorites),
                                            items = favorites.take(20).map { it.toContentItem() },
                                            type = ContentRowType.FAVORITES
                                        )
                                    } else null
                                )
                                pendingSections.remove("favorites")
                                if (pendingSections.isEmpty()) setLoading(false)
                            }
                    }

                    launch {
                        repository.getRecentlyAddedMovies(server.id, 20)
                            .distinctUntilChangedBy { rows -> rows.map { it.movieId } }
                            .collect { recentMovies ->
                                updateRow(
                                    key = "recent_movies",
                                    row = if (recentMovies.isNotEmpty()) {
                                        ContentRow(
                                            id = "recent_movies",
                                            title = context.getString(R.string.section_recently_added_movies),
                                            items = recentMovies.map { it.toContentItem() },
                                            type = ContentRowType.MOVIES
                                        )
                                    } else null
                                )
                                pendingSections.remove("recent_movies")
                                if (pendingSections.isEmpty()) setLoading(false)
                            }
                    }

                    launch {
                        repository.getRecentlyAddedSeries(server.id, 20)
                            .distinctUntilChangedBy { rows -> rows.map { it.seriesId } }
                            .collect { recentSeries ->
                                updateRow(
                                    key = "recent_series",
                                    row = if (recentSeries.isNotEmpty()) {
                                        ContentRow(
                                            id = "recent_series",
                                            title = context.getString(R.string.section_recently_added_series),
                                            items = recentSeries.map { it.toContentItem() },
                                            type = ContentRowType.SERIES
                                        )
                                    } else null
                                )
                                pendingSections.remove("recent_series")
                                if (pendingSections.isEmpty()) setLoading(false)
                            }
                    }
                }
            }
        }
    }

    private fun updateRow(key: String, row: ContentRow?) {
        if (row == null) {
            rowCache.remove(key)
        } else {
            rowCache[key] = row
        }
        val rows = rowOrder.mapNotNull { rowCache[it] }
        _contentRows.value = rows
        _contentRowsLiveData.value = rows
        if (rows.isNotEmpty()) {
            setLoading(false)
        }
    }

    private fun setLoading(isLoading: Boolean) {
        _isLoading.value = isLoading
        _isLoadingLiveData.value = isLoading
    }

    private fun loadDashboardState(server: ServerEntity) {
        viewModelScope.launch {
            val snapshot = repository.getContentSnapshot(server.id)
            val syncState = repository.getServerSyncState(server.id)
            _dashboardState.value = HomeDashboardState(
                sourceName = server.name,
                sourceType = server.serverType,
                isActive = server.isActive,
                liveCount = syncState?.totalChannels?.takeIf { it > 0 } ?: snapshot.channelsCount,
                movieCount = syncState?.totalMovies?.takeIf { it > 0 } ?: snapshot.moviesCount,
                seriesCount = syncState?.totalSeries?.takeIf { it > 0 } ?: snapshot.seriesCount,
                categoryCount = syncState?.totalCategories?.takeIf { it > 0 } ?: snapshot.categoriesCount,
                lastRefreshAt = syncState?.lastSyncAt,
                syncStatus = syncState?.lastStatus ?: "IDLE"
            )
        }
    }
    
    fun refreshContent() {
        viewModelScope.launch {
            _isLoading.value = true
            _isLoadingLiveData.value = true
            
            val server = repository.getActiveServerSync()
            if (server != null) {
                // Refresh data from server
                repository.fetchAndSaveMovies(server)
                repository.fetchAndSaveSeries(server)
            }

            _isLoading.value = false
            _isLoadingLiveData.value = false
        }
    }
    
    /**
     * Notify about new content (called from SmartRefreshManager via Activity)
     */
    fun notifyNewContent(changes: ContentChangeSummary) {
        viewModelScope.launch {
            _newContentAvailable.emit(changes)
        }
    }
    
    // Surprise Me
    private val _surpriseEvent = MutableSharedFlow<ContentItem>()
    val surpriseEvent: SharedFlow<ContentItem> = _surpriseEvent.asSharedFlow()
    
    fun onSurpriseMeClicked() {
        viewModelScope.launch {
            val server = _activeServer.value ?: return@launch
            val movie = repository.getRandomMovie(server.id)
            if (movie != null) {
                _surpriseEvent.emit(movie.toContentItem())
            }
        }
    }
    
    // Extension functions to convert entities to ContentItem
    private fun MovieEntity.toContentItem() = ContentItem(
        id = movieId,
        title = name,
        posterUrl = streamIcon,
        rating = rating,
        type = ContentType.MOVIE,
        streamUrl = streamUrl
    )
    
    private fun SeriesEntity.toContentItem() = ContentItem(
        id = seriesId,
        title = name,
        posterUrl = cover,
        rating = rating,
        type = ContentType.SERIES
    )
    
    private fun WatchHistoryEntity.toContentItem() = ContentItem(
        id = contentId,
        title = name,
        posterUrl = posterUrl,
        type = if (type == "MOVIE") ContentType.MOVIE else ContentType.EPISODE,
        streamUrl = null,
        progress = if (durationMs > 0) ((positionMs * 100) / durationMs).toInt() else 0,
        savedPosition = positionMs,
        seriesId = seriesId,
        seasonNumber = seasonNumber,
        episodeNumber = episodeNumber
    )

    private fun FavoriteEntity.toContentItem(): ContentItem {
        val normalizedType = contentType.lowercase()
        return ContentItem(
            id = contentId,
            title = name,
            posterUrl = iconUrl,
            type = when (normalizedType) {
                "channel", "live" -> ContentType.CHANNEL
                "series" -> ContentType.SERIES
                else -> ContentType.MOVIE
            },
            favoriteId = id
        )
    }

    private fun WatchHistoryEntity.isContinueWatchingCandidate(): Boolean {
        if (durationMs <= 0L || completed) return false
        val ratio = positionMs.toFloat() / durationMs.toFloat()
        return ratio > 0.05f && ratio < 0.95f
    }
}

// Data classes for UI
data class ContentRow(
    val id: String,
    val title: String,
    val items: List<ContentItem>,
    val type: ContentRowType
)

data class ContentItem(
    val id: String,
    val title: String,
    val posterUrl: String? = null,
    val rating: Double? = null,
    val type: ContentType,
    val streamUrl: String? = null,
    val progress: Int? = null, // For continue watching (0-100)
    val savedPosition: Long? = null, // Resume position in ms
    val seriesId: String? = null, // For episodes
    val seasonNumber: Int? = null,
    val episodeNumber: Int? = null,
    val favoriteId: Long? = null
)

data class HomeDashboardState(
    val sourceName: String? = null,
    val sourceType: String? = null,
    val isActive: Boolean = false,
    val liveCount: Int = 0,
    val movieCount: Int = 0,
    val seriesCount: Int = 0,
    val categoryCount: Int = 0,
    val lastRefreshAt: Long? = null,
    val syncStatus: String = "IDLE"
)

enum class ContentRowType {
    MOVIES, SERIES, CHANNELS, FAVORITES, MIXED, CONTINUE_WATCHING
}

enum class ContentType {
    MOVIE, SERIES, CHANNEL, EPISODE
}
