package com.mo.moplayer.ui.movies

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.paging.PagingData
import androidx.paging.cachedIn
import com.mo.moplayer.data.local.entity.CategoryEntity
import com.mo.moplayer.data.local.entity.MovieEntity
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.util.NetworkErrorHandler
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MoviesViewModel @Inject constructor(
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
    
    // StateFlow to track current category for pagination
    private val currentCategoryFlow = MutableStateFlow<String?>(null)
    
    // Paged movies flow
    @OptIn(ExperimentalCoroutinesApi::class)
    val moviesPaged: Flow<PagingData<MovieEntity>> = currentCategoryFlow
        .flatMapLatest { categoryId ->
            repository.getMoviesPaginated(serverId, categoryId)
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
                        repository.getMovieCategories(serverId).first()
                    }
                    result.fold(
                        onSuccess = { cats ->
                            _categories.value = cats
                            currentCategoryFlow.value = null
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

    fun selectCategory(category: CategoryEntity?) {
        _selectedCategory.value = category
        
        // Update the category flow to trigger new paging data
        currentCategoryFlow.value = if (category == null || category.categoryId == "all") {
            null
        } else {
            category.categoryId
        }
    }

    fun toggleFavorite(movie: MovieEntity) {
        viewModelScope.launch {
            repository.toggleFavorite(
                serverId = serverId,
                contentId = movie.movieId,
                contentType = "movie",
                name = movie.name,
                iconUrl = movie.streamIcon
            )
        }
    }
}
