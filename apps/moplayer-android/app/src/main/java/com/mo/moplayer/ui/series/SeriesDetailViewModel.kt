package com.mo.moplayer.ui.series

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mo.moplayer.data.local.entity.EpisodeEntity
import com.mo.moplayer.data.local.entity.SeriesEntity
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SeriesDetailViewModel @Inject constructor(
    private val repository: IptvRepository
) : ViewModel() {

    private val _series = MutableLiveData<SeriesEntity?>()
    val series: LiveData<SeriesEntity?> = _series

    private val _seasons = MutableLiveData<List<Int>>()
    val seasons: LiveData<List<Int>> = _seasons

    private val _episodes = MutableLiveData<List<Episode>>()
    val episodes: LiveData<List<Episode>> = _episodes

    private val _currentSeason = MutableLiveData(1)
    val currentSeason: LiveData<Int> = _currentSeason

    private val _isFavorite = MutableLiveData(false)
    val isFavorite: LiveData<Boolean> = _isFavorite

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    // New LiveData for focused/selected episode
    private val _focusedEpisode = MutableLiveData<Episode?>()
    val focusedEpisode: LiveData<Episode?> = _focusedEpisode

    // Episode watch progress tracking
    private val _episodeProgress = MutableLiveData<Map<String, Int>>()
    val episodeProgress: LiveData<Map<String, Int>> = _episodeProgress

    private var seriesId: String = ""
    private var serverId: Long = 0
    private var originalSeriesId: Int = 0
    private var cachedEpisodes: List<EpisodeEntity> = emptyList()

    fun loadSeriesDetails(seriesId: String) {
        this.seriesId = seriesId

        viewModelScope.launch {
            _isLoading.value = true

            val server = repository.getActiveServerSync()
            if (server != null) {
                serverId = server.id

                // Load only the selected series. Loading the full catalog here can freeze
                // large Xtream/M3U libraries on Android TV boxes.
                val foundSeries = repository.getSeriesById(seriesId)
                _series.value = foundSeries

                // Check if favorite
                _isFavorite.value = repository.isFavorite(serverId, seriesId).first()

                // Fetch and cache seasons/episodes from Xtream when needed.
                foundSeries?.let {
                    fetchSeriesInfo(it)
                }
            }

            _isLoading.value = false
        }
    }

    private suspend fun fetchSeriesInfo(series: SeriesEntity) {
        try {
            this.originalSeriesId = series.originalSeriesId
            val result = repository.refreshSeriesDetails(series)
            
            when (result) {
                is Resource.Success -> {
                    val details = result.data
                    details?.series?.let { _series.value = it }
                    cachedEpisodes = details?.episodes.orEmpty()
                    val seasonsList = cachedEpisodes
                        .map { it.seasonNumber }
                        .filter { it > 0 }
                        .distinct()
                        .sorted()
                        .ifEmpty { listOf(1) }
                    
                    _seasons.value = seasonsList
                    
                    selectSeason(seasonsList.firstOrNull() ?: 1)
                }
                is Resource.Error -> {
                    // Fallback لموسم واحد في حالة الخطأ
                    _seasons.value = listOf(1)
                    selectSeason(1)
                }
                is Resource.Loading -> {
                    // في حالة Loading
                    _isLoading.value = true
                }
            }
            
        } catch (e: Exception) {
            // Handle error
            _seasons.value = emptyList()
            _episodes.value = emptyList()
        }
    }

    fun selectSeason(seasonNumber: Int) {
        _currentSeason.value = seasonNumber

        viewModelScope.launch {
            val episodesForSeason = cachedEpisodes.filter { it.seasonNumber == seasonNumber }

            if (episodesForSeason.isNotEmpty()) {
                val episodeList = episodesForSeason.map { episode ->
                    Episode(
                        id = episode.episodeId,
                        seasonNumber = seasonNumber,
                        episodeNumber = episode.episodeNumber,
                        title = episode.title ?: "Episode ${episode.episodeNumber}",
                        plot = episode.plot,
                        duration = episode.duration,
                        streamUrl = episode.streamUrl,
                        thumbnail = episode.cover ?: _series.value?.cover,
                        releaseDate = episode.releaseDate
                    )
                }.sortedBy { it.episodeNumber }
                
                _episodes.value = episodeList
            } else {
                _episodes.value = emptyList()
            }
        }
    }

    private suspend fun buildEpisodeStreamUrl(episodeId: String, extension: String?): String {
        val server = repository.getActiveServerSync()
        if (server == null) return ""
        
        val ext = extension ?: "mp4"
        val streamId = episodeId.toIntOrNull() ?: return ""
        return repository.buildStreamUrl(server, streamId, "series", ext)
    }

    fun toggleFavorite() {
        viewModelScope.launch {
            val series = _series.value ?: return@launch

            val newState = repository.toggleFavorite(
                serverId = serverId,
                contentId = seriesId,
                contentType = "series",
                name = series.name,
                iconUrl = series.cover
            )

            _isFavorite.value = newState
        }
    }

    fun setFocusedEpisode(episode: Episode?) {
        _focusedEpisode.value = episode
    }

    fun getEpisodeProgress(episodeId: String): Int {
        return _episodeProgress.value?.get(episodeId) ?: 0
    }

    fun updateEpisodeProgress(episodeId: String, progress: Int) {
        val currentProgress = _episodeProgress.value?.toMutableMap() ?: mutableMapOf()
        currentProgress[episodeId] = progress
        _episodeProgress.value = currentProgress
    }

    fun markEpisodeAsWatched(episodeId: String) {
        updateEpisodeProgress(episodeId, 100)
    }

    data class Episode(
        val id: String,
        val seasonNumber: Int,
        val episodeNumber: Int,
        val title: String,
        val plot: String?,
        val duration: String?,
        val streamUrl: String,
        val thumbnail: String?,
        val previewUrl: String? = null, // URL for video preview
        val releaseDate: String? = null,
        val rating: Double? = null
    )

    data class SeriesInfoResponse(
        val seasons: Map<String, List<EpisodeInfo>>,
        val info: SeriesInfo
    )

    data class EpisodeInfo(
        val id: String,
        val episodeNum: Int,
        val title: String,
        val containerExtension: String,
        val info: EpisodeDetails?
    )

    data class EpisodeDetails(
        val plot: String?,
        val duration: String?,
        val releaseDate: String?
    )

    data class SeriesInfo(
        val name: String,
        val cover: String?,
        val plot: String?,
        val cast: String?,
        val director: String?,
        val genre: String?,
        val rating: Double?
    )
}
