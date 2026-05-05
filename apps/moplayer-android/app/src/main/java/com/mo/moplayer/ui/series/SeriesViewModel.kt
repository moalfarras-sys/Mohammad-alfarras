package com.mo.moplayer.ui.series

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.paging.PagingData
import androidx.paging.cachedIn
import com.mo.moplayer.data.local.entity.CategoryEntity
import com.mo.moplayer.data.local.entity.SeriesEntity
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.util.NetworkErrorHandler
import com.mo.moplayer.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SeriesViewModel @Inject constructor(
    private val repository: IptvRepository,
    private val networkErrorHandler: NetworkErrorHandler
) : ViewModel() {

    private val _categories = MutableLiveData<List<CategoryEntity>>()
    val categories: LiveData<List<CategoryEntity>> = _categories

    private val _selectedCategory = MutableLiveData<CategoryEntity?>()
    val selectedCategory: LiveData<CategoryEntity?> = _selectedCategory

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _networkError = MutableStateFlow<NetworkErrorHandler.NetworkError?>(null)
    val networkError: StateFlow<NetworkErrorHandler.NetworkError?> = _networkError.asStateFlow()

    private var serverId: Long = 0
    private var emptyCatalogRefreshStarted = false

    private data class SeriesQuery(
        val serverId: Long,
        val categoryId: String?
    )
    
    // StateFlow to track current category for pagination
    private val currentQueryFlow = MutableStateFlow(SeriesQuery(0L, null))
    
    // Paged series flow
    @OptIn(ExperimentalCoroutinesApi::class)
    val seriesPaged: Flow<PagingData<SeriesEntity>> = currentQueryFlow
        .flatMapLatest { query ->
            if (query.serverId <= 0L) {
                flowOf(PagingData.empty())
            } else {
                repository.getSeriesPaginated(query.serverId, query.categoryId)
            }
        }
        .cachedIn(viewModelScope)

    init {
        loadData()
    }

    fun clearError() {
        _networkError.value = null
        networkErrorHandler.clearError()
    }

    fun retry() {
        clearError()
        loadData()
    }

    private fun loadData() {
        viewModelScope.launch {
            try {
                _networkError.value = null
                val server = repository.getActiveServerSync()
                if (server != null) {
                    serverId = server.id

                    val result = networkErrorHandler.executeWithRetry {
                        repository.getSeriesCategories(serverId).first()
                    }
                    result.fold(
                        onSuccess = { cats ->
                            val counts = repository.getSeriesCategoryCounts(serverId)
                            val totalSeries = repository.getSeriesCount(serverId)
                            val filteredCategories = cats.filter { (counts[it.categoryId] ?: 0) > 0 }
                            val allCategory = CategoryEntity(
                                categoryId = "all",
                                serverId = serverId,
                                originalId = "all",
                                name = "All",
                                type = "series",
                                sortOrder = -1
                            )
                            val visibleCategories =
                                if (totalSeries > 0) listOf(allCategory) + filteredCategories else cats
                            _categories.value = visibleCategories
                            val selected = _selectedCategory.value
                            val nextSelection = when {
                                selected != null && visibleCategories.any { it.categoryId == selected.categoryId } -> selected
                                visibleCategories.isNotEmpty() -> visibleCategories.first()
                                else -> null
                            }
                            selectCategory(nextSelection)
                            if (totalSeries == 0 && cats.isNotEmpty()) {
                                refreshEmptyCatalogOnce(server)
                            }
                        },
                        onFailure = { e ->
                            _networkError.value = networkErrorHandler.categorizeError(e)
                            _categories.value = emptyList()
                        }
                    )
                }
            } catch (e: Exception) {
                _networkError.value = networkErrorHandler.categorizeError(e)
                _categories.value = emptyList()
            }
        }
    }

    private fun refreshEmptyCatalogOnce(server: com.mo.moplayer.data.local.entity.ServerEntity) {
        if (emptyCatalogRefreshStarted) return
        emptyCatalogRefreshStarted = true
        viewModelScope.launch {
            when (val refresh = repository.fetchAndSaveSeries(server)) {
                is Resource.Success -> {
                    _isLoading.value = false
                    if ((refresh.data ?: 0) > 0) {
                        loadData()
                    }
                }
                is Resource.Error -> {
                    _isLoading.value = false
                    _networkError.value = networkErrorHandler.categorizeError(
                        IllegalStateException(refresh.message ?: "Series refresh failed")
                    )
                }
                else -> _isLoading.value = false
            }
        }
    }

    fun selectCategory(category: CategoryEntity?) {
        _selectedCategory.value = category
        
        // Update the category flow to trigger new paging data
        currentQueryFlow.value = SeriesQuery(
            serverId = serverId,
            categoryId = if (category == null || category.categoryId == "all") null else category.categoryId
        )
    }

    fun toggleFavorite(series: SeriesEntity) {
        viewModelScope.launch {
            repository.toggleFavorite(
                serverId = serverId,
                contentId = series.seriesId,
                contentType = "series",
                name = series.name,
                iconUrl = series.cover
            )
        }
    }
}
