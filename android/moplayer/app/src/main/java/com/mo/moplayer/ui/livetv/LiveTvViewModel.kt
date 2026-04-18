package com.mo.moplayer.ui.livetv

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mo.moplayer.data.local.entity.CategoryEntity
import com.mo.moplayer.data.local.entity.ChannelEntity
import com.mo.moplayer.data.local.entity.EpgEntity
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.util.NetworkErrorHandler
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import android.util.Log
import javax.inject.Inject

@HiltViewModel
class LiveTvViewModel @Inject constructor(
    private val repository: IptvRepository,
    private val networkErrorHandler: NetworkErrorHandler
) : ViewModel() {

    private val _channels = MutableLiveData<List<ChannelEntity>>()
    val channels: LiveData<List<ChannelEntity>> = _channels
    
    // EPG Data
    private val _currentEpg = MutableLiveData<EpgEntity?>()
    val currentEpg: LiveData<EpgEntity?> = _currentEpg
    
    private val _nextEpg = MutableLiveData<EpgEntity?>()
    val nextEpg: LiveData<EpgEntity?> = _nextEpg
    
    private var serverId: Long = 0

    private val _filteredChannels = MutableLiveData<List<ChannelEntity>>()
    val filteredChannels: LiveData<List<ChannelEntity>> = _filteredChannels

    private val _categories = MutableLiveData<List<CategoryEntity>>()
    val categories: LiveData<List<CategoryEntity>> = _categories

    private val _currentChannel = MutableLiveData<ChannelEntity?>()
    val currentChannel: LiveData<ChannelEntity?> = _currentChannel

    private val _currentChannelIndex = MutableLiveData(0)
    val currentChannelIndex: LiveData<Int> = _currentChannelIndex

    // Index within filtered list (for group-based navigation)
    private val _filteredChannelIndex = MutableLiveData(0)
    val filteredChannelIndex: LiveData<Int> = _filteredChannelIndex

    private val _selectedCategory = MutableLiveData<String?>(null)
    val selectedCategory: LiveData<String?> = _selectedCategory

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _networkError = MutableStateFlow<NetworkErrorHandler.NetworkError?>(null)
    val networkError: StateFlow<NetworkErrorHandler.NetworkError?> = _networkError.asStateFlow()

    private var allChannels = listOf<ChannelEntity>()
    private var currentFilteredList = listOf<ChannelEntity>()
    private var loadJob: Job? = null
    private var epgDebounceJob: Job? = null
    private val epgLastFetchByStream = mutableMapOf<Int, Long>()

    companion object {
        /** Longer debounce while browsing the list reduces EPG/network churn and UI jank. */
        private const val EPG_FOCUS_DEBOUNCE_MS = 550L
        private const val EPG_REMOTE_FETCH_COOLDOWN_MS = 30_000L
    }

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

    fun loadData() {
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            try {
                _isLoading.value = true
                _networkError.value = null

                val server = repository.getActiveServerSync()
                if (server != null) {
                    serverId = server.id
                    
                    // Load categories first (lighter load, show immediately)
                    try {
                        val cats = withContext(Dispatchers.IO) {
                            repository.getLiveCategories(server.id).first()
                        }
                        _categories.value = cats
                        Log.d("LiveTvViewModel", "Loaded ${cats.size} categories")
                    } catch (e: Exception) {
                        Log.e("LiveTvViewModel", "Error loading categories: ${e.message}", e)
                        _networkError.value = networkErrorHandler.categorizeError(e)
                        _categories.value = emptyList()
                    }

                    // Load channels in background (heavier load)
                    try {
                        allChannels = withContext(Dispatchers.IO) {
                            repository.getAllChannels(server.id).first()
                        }
                        currentFilteredList = allChannels
                        _channels.value = allChannels
                        _filteredChannels.value = allChannels
                        Log.d("LiveTvViewModel", "Loaded ${allChannels.size} channels")

                        // Set first channel as current if available
                        if (allChannels.isNotEmpty()) {
                            _currentChannel.value = allChannels[0]
                            _currentChannelIndex.value = 0
                            _filteredChannelIndex.value = 0
                            
                            // Load EPG for first channel in background (non-blocking)
                            launch {
                                loadEpgForChannel(allChannels[0], immediate = true)
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("LiveTvViewModel", "Error loading channels: ${e.message}", e)
                        _networkError.value = networkErrorHandler.categorizeError(e)
                        allChannels = emptyList()
                        currentFilteredList = emptyList()
                        _channels.value = emptyList()
                        _filteredChannels.value = emptyList()
                    }
                } else {
                    Log.w("LiveTvViewModel", "No active server found")
                    _categories.value = emptyList()
                    _channels.value = emptyList()
                    _filteredChannels.value = emptyList()
                }
            } catch (e: Exception) {
                Log.e("LiveTvViewModel", "Unexpected error in loadData: ${e.message}", e)
                _networkError.value = networkErrorHandler.categorizeError(e)
                _categories.value = emptyList()
                _channels.value = emptyList()
                _filteredChannels.value = emptyList()
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    /**
     * Load EPG data for a specific channel
     */
    fun loadEpgForChannel(channel: ChannelEntity, immediate: Boolean = false) {
        epgDebounceJob?.cancel()
        epgDebounceJob = viewModelScope.launch {
            if (!immediate) delay(EPG_FOCUS_DEBOUNCE_MS)
            fetchChannelEpg(channel, forceRemoteFetch = immediate)
        }
    }

    private suspend fun fetchChannelEpg(channel: ChannelEntity, forceRemoteFetch: Boolean) {
        try {
            val server = repository.getActiveServerSync() ?: return

            withContext(Dispatchers.IO) {
                val streamId = channel.streamId
                val now = System.currentTimeMillis()
                val lastFetchAt = epgLastFetchByStream[streamId] ?: 0L
                val hasCachedEpg = repository.hasEpgData(streamId, server.id)

                val shouldFetchRemote =
                    forceRemoteFetch ||
                        (!hasCachedEpg && now - lastFetchAt >= EPG_REMOTE_FETCH_COOLDOWN_MS)

                if (shouldFetchRemote) {
                    try {
                        repository.fetchAndSaveEpg(server, streamId)
                        epgLastFetchByStream[streamId] = now
                    } catch (e: Exception) {
                        Log.w(
                            "LiveTvViewModel",
                            "Error fetching EPG for channel ${channel.name}: ${e.message}"
                        )
                    }
                }

                try {
                    val currentProgram = repository.getCurrentProgram(streamId, server.id)
                    val nextProgram = repository.getNextProgram(streamId, server.id)
                    _currentEpg.postValue(currentProgram)
                    _nextEpg.postValue(nextProgram)
                } catch (e: Exception) {
                    Log.w("LiveTvViewModel", "Error getting EPG programs: ${e.message}")
                    _currentEpg.postValue(null)
                    _nextEpg.postValue(null)
                }
            }
        } catch (e: Exception) {
            Log.e("LiveTvViewModel", "Error loading EPG: ${e.message}", e)
            _currentEpg.value = null
            _nextEpg.value = null
        }
    }
    
    /**
     * Get EPG for a channel (used by adapter)
     */
    suspend fun getEpgForChannel(channel: ChannelEntity): Pair<EpgEntity?, EpgEntity?> {
        return try {
            val server = repository.getActiveServerSync() ?: return Pair(null, null)
            
            val currentProgram = repository.getCurrentProgram(channel.streamId, server.id)
            val nextProgram = repository.getNextProgram(channel.streamId, server.id)
            
            Pair(currentProgram, nextProgram)
        } catch (e: Exception) {
            Pair(null, null)
        }
    }

    fun selectCategory(categoryId: String?) {
        _selectedCategory.value = categoryId

        val filtered = if (categoryId == null) {
            allChannels
        } else {
            allChannels.filter { it.categoryId == categoryId }
        }

        currentFilteredList = filtered
        _filteredChannels.value = filtered
        
        // Reset filtered index when category changes
        _filteredChannelIndex.value = 0
        
        // Auto-select first channel in filtered list
        if (filtered.isNotEmpty()) {
            _currentChannel.value = filtered[0]
            _currentChannelIndex.value = allChannels.indexOf(filtered[0])
        }
    }

    fun selectChannel(channel: ChannelEntity) {
        _currentChannel.value = channel
        val index = allChannels.indexOf(channel)
        if (index >= 0) {
            _currentChannelIndex.value = index
        }
        // Update filtered index
        val filteredIndex = currentFilteredList.indexOf(channel)
        if (filteredIndex >= 0) {
            _filteredChannelIndex.value = filteredIndex
        }
        // Load EPG for the selected channel
        loadEpgForChannel(channel, immediate = true)
    }

    fun selectChannelByIndex(index: Int) {
        if (index in allChannels.indices) {
            _currentChannel.value = allChannels[index]
            _currentChannelIndex.value = index
        }
    }

    fun nextChannel() {
        // Use filtered list for group-based navigation
        if (currentFilteredList.isEmpty()) return
        
        val currentFilteredIdx = _filteredChannelIndex.value ?: 0
        val nextFilteredIdx = (currentFilteredIdx + 1) % currentFilteredList.size
        selectChannelFromFilteredList(nextFilteredIdx)
    }

    fun previousChannel() {
        // Use filtered list for group-based navigation
        if (currentFilteredList.isEmpty()) return
        
        val currentFilteredIdx = _filteredChannelIndex.value ?: 0
        val prevFilteredIdx = if (currentFilteredIdx == 0) currentFilteredList.size - 1 else currentFilteredIdx - 1
        selectChannelFromFilteredList(prevFilteredIdx)
    }
    
    private fun selectChannelFromFilteredList(filteredIndex: Int) {
        if (filteredIndex in currentFilteredList.indices) {
            val channel = currentFilteredList[filteredIndex]
            _currentChannel.value = channel
            _filteredChannelIndex.value = filteredIndex
            _currentChannelIndex.value = allChannels.indexOf(channel)
            // Debounced EPG refresh for zapping (matches overlay preview; avoids blocking playback)
            loadEpgForChannel(channel, immediate = false)
        }
    }

    fun selectChannelByNumber(number: Int) {
        // Find channel with matching custom order or index
        val channel = allChannels.find { it.customOrder == number }
            ?: allChannels.getOrNull(number - 1)

        channel?.let {
            selectChannel(it)
        }
    }

    fun selectChannelById(channelId: String) {
        val channel = allChannels.find { it.channelId == channelId }
        channel?.let {
            selectChannel(it)
        }
    }

    fun searchChannels(query: String) {
        val currentList = if (_selectedCategory.value == null) {
            allChannels
        } else {
            allChannels.filter { it.categoryId == _selectedCategory.value }
        }

        val filtered = if (query.isBlank()) {
            currentList
        } else {
            currentList.filter {
                it.name.contains(query, ignoreCase = true)
            }
        }

        _filteredChannels.value = filtered
    }

    fun toggleFavorite() {
        val channel = _currentChannel.value ?: return
        viewModelScope.launch {
            val server = repository.getActiveServerSync() ?: return@launch
            repository.toggleFavorite(
                serverId = server.id,
                contentId = channel.channelId,
                contentType = "channel",
                name = channel.name,
                iconUrl = channel.streamIcon
            )
        }
    }
}
