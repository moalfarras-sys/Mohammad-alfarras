package com.mo.moplayer.ui.movies

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mo.moplayer.data.local.dao.MovieDao
import com.mo.moplayer.data.local.entity.MovieEntity
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.data.repository.WatchHistoryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MovieDetailViewModel @Inject constructor(
    private val iptvRepository: IptvRepository,
    private val movieDao: MovieDao,
    private val watchHistoryRepository: WatchHistoryRepository
) : ViewModel() {

    private val _movie = MutableLiveData<MovieEntity?>()
    val movie: LiveData<MovieEntity?> = _movie

    private val _isFavorite = MutableLiveData<Boolean>(false)
    val isFavorite: LiveData<Boolean> = _isFavorite

    private val _watchProgress = MutableLiveData<Int>(0)
    val watchProgress: LiveData<Int> = _watchProgress

    private val _savedPosition = MutableLiveData<Long>(0)
    val savedPosition: LiveData<Long> = _savedPosition

    private val _isLoading = MutableLiveData<Boolean>(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private var currentServerId: Long = 0

    fun loadMovie(movieId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                // Get movie from database
                val movieData = movieDao.getMovieById(movieId)
                _movie.value = movieData

                if (movieData != null) {
                    currentServerId = movieData.serverId

                    // Check favorite status
                    val favoriteStatus = iptvRepository.isFavorite(currentServerId, movieId).first()
                    _isFavorite.value = favoriteStatus

                    // Check watch history
                    val history = watchHistoryRepository.getWatchHistory(movieId)
                    if (history != null && !history.completed) {
                        val progress = if (history.durationMs > 0) {
                            ((history.positionMs * 100) / history.durationMs).toInt()
                        } else 0
                        _watchProgress.value = progress
                        _savedPosition.value = history.positionMs
                    }
                }
            } catch (e: Exception) {
                // Handle error
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun toggleFavorite(movie: MovieEntity) {
        viewModelScope.launch {
            val nowFavorite = iptvRepository.toggleFavorite(
                serverId = movie.serverId,
                contentId = movie.movieId,
                contentType = "MOVIE",
                name = movie.name,
                iconUrl = movie.streamIcon
            )
            _isFavorite.value = nowFavorite
        }
    }
}
