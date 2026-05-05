package com.mo.moplayer.ui.favorites

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mo.moplayer.data.local.entity.FavoriteEntity
import com.mo.moplayer.data.repository.IptvRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class FavoritesViewModel @Inject constructor(
    private val repository: IptvRepository
) : ViewModel() {

    private val _favorites = MutableLiveData<List<FavoriteEntity>>()
    val favorites: LiveData<List<FavoriteEntity>> = _favorites

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private var serverId: Long = 0

    init {
        loadFavorites()
    }

    private fun loadFavorites() {
        viewModelScope.launch {
            _isLoading.value = true

            val server = repository.getActiveServerSync()
            if (server != null) {
                serverId = server.id
                _favorites.value = repository.getAllFavorites(serverId).first()
            }

            _isLoading.value = false
        }
    }

    fun removeFavorite(favorite: FavoriteEntity) {
        viewModelScope.launch {
            repository.toggleFavorite(
                serverId = serverId,
                contentId = favorite.contentId,
                contentType = favorite.contentType,
                name = favorite.name,
                iconUrl = favorite.iconUrl
            )
            loadFavorites()
        }
    }
}
