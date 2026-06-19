package com.mo.moplayer.ui.livetv

import android.util.Log
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
import javax.inject.Inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@HiltViewModel
class LiveTvViewModel @Inject constructor(
    private val repository: IptvRepository,
    private val networkErrorHandler: NetworkErrorHandler
) : ViewModel() {

    private val _channels = MutableLiveData<List<ChannelEntity>>()
    val channels: LiveData<List<ChannelEntity>> = _channels

    private val _currentEpg = MutableLiveData<EpgEntity?>()
    val currentEpg: LiveData<EpgEntity?> = _currentEpg

    private val _nextEpg = MutableLiveData<EpgEntity?>()
    val nextEpg: LiveData<EpgEntity?> = _nextEpg

    private var serverId: Long = 0

    private val _filteredChannels = MutableLiveData<List<ChannelEntity>>()
    val filteredChannels: LiveData<List<ChannelEntity>> = _filteredChannels

    private val _categories = MutableLiveData<List<CategoryEntity>>()
    val categories: LiveData<List<CategoryEntity>> = _categories

    private val _categoryCounts = MutableLiveData<Map<String?, Int>>(emptyMap())
    val categoryCounts: LiveData<Map<String?, Int>> = _categoryCounts

    private val _currentChannel = MutableLiveData<ChannelEntity?>()
    val currentChannel: LiveData<ChannelEntity?> = _currentChannel

    private val _currentChannelIndex = MutableLiveData(0)
    val currentChannelIndex: LiveData<Int> = _currentChannelIndex

    private val _filteredChannelIndex = MutableLiveData(0)
    val filteredChannelIndex: LiveData<Int> = _filteredChannelIndex

    private val _selectedCategory = MutableLiveData<String?>(null)
    val selectedCategory: LiveData<String?> = _selectedCategory

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _networkError = MutableStateFlow<NetworkErrorHandler.NetworkError?>(null)
    val networkError: StateFlow<NetworkErrorHandler.NetworkError?> = _networkError.asStateFlow()

    private var currentFilteredList = listOf<ChannelEntity>()
    private var loadJob: Job? = null
    private var channelsJob: Job? = null
    private var epgDebounceJob: Job? = null
    private val epgLastFetchByStream = mutableMapOf<Int, Long>()
    private var pendingChannelId: String? = null
    private var channelWindowSize = CHANNEL_PAGE_SIZE
    private var channelTotalCount = 0
    private var channelLoadInFlight = false

    companion object {
        private const val EPG_FOCUS_DEBOUNCE_MS = 550L
        private const val EPG_REMOTE_FETCH_COOLDOWN_MS = 30_000L
        private const val CHANNEL_PAGE_SIZE = 400
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
                    try {
                        val cats = withContext(Dispatchers.IO) {
                            repository.getLiveCategories(server.id).first()
                        }
                        _categories.value = cats
                        loadCategoryCounts(cats)
                        Log.d("LiveTvViewModel", "Loaded ${cats.size} categories")

                        val initialCategoryId = _selectedCategory.value ?: cats.firstOrNull()?.categoryId
                        _selectedCategory.value = initialCategoryId
                        observeChannelsForCategory(initialCategoryId)
                    } catch (e: CancellationException) {
                        throw e
                    } catch (e: Exception) {
                        Log.e("LiveTvViewModel", "Error loading categories: ${e.message}", e)
                        _networkError.value = networkErrorHandler.categorizeError(e)
                        _categories.value = emptyList()
                        currentFilteredList = emptyList()
                        _channels.value = emptyList()
                        _filteredChannels.value = emptyList()
                        _isLoading.value = false
                    }
                } else {
                    Log.w("LiveTvViewModel", "No active server found")
                    _categories.value = emptyList()
                    _channels.value = emptyList()
                    _filteredChannels.value = emptyList()
                    _isLoading.value = false
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e("LiveTvViewModel", "Unexpected error in loadData: ${e.message}", e)
                _networkError.value = networkErrorHandler.categorizeError(e)
                _categories.value = emptyList()
                _channels.value = emptyList()
                _filteredChannels.value = emptyList()
                _isLoading.value = false
            }
        }
    }

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
                val supportsRemoteEpg = server.serverType.equals("xtream", ignoreCase = true) &&
                    server.serverUrl.isNotBlank()

                val shouldFetchRemote =
                    supportsRemoteEpg &&
                        (forceRemoteFetch || (!hasCachedEpg && now - lastFetchAt >= EPG_REMOTE_FETCH_COOLDOWN_MS))

                if (shouldFetchRemote) {
                    try {
                        repository.fetchAndSaveEpg(server, streamId)
                        epgLastFetchByStream[streamId] = now
                    } catch (e: CancellationException) {
                        throw e
                    } catch (e: Exception) {
                        Log.w("LiveTvViewModel", "Error fetching EPG for channel ${channel.name}: ${e.message}")
                    }
                }

                try {
                    val currentProgram = repository.getCurrentProgram(streamId, server.id)
                    val nextProgram = repository.getNextProgram(streamId, server.id)
                    _currentEpg.postValue(currentProgram)
                    _nextEpg.postValue(nextProgram)
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    Log.w("LiveTvViewModel", "Error getting EPG programs: ${e.message}")
                    _currentEpg.postValue(null)
                    _nextEpg.postValue(null)
                }
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e("LiveTvViewModel", "Error loading EPG: ${e.message}", e)
            _currentEpg.value = null
            _nextEpg.value = null
        }
    }

    suspend fun getEpgForChannel(channel: ChannelEntity): Pair<EpgEntity?, EpgEntity?> {
        return try {
            val server = repository.getActiveServerSync() ?: return Pair(null, null)
            val currentProgram = repository.getCurrentProgram(channel.streamId, server.id)
            val nextProgram = repository.getNextProgram(channel.streamId, server.id)
            Pair(currentProgram, nextProgram)
        } catch (_: Exception) {
            Pair(null, null)
        }
    }

    fun selectCategory(categoryId: String?) {
        _selectedCategory.value = categoryId
        observeChannelsForCategory(categoryId, resetWindow = true)
    }

    private fun loadCategoryCounts(categories: List<CategoryEntity>) {
        viewModelScope.launch {
            val counts = withContext(Dispatchers.IO) {
                categories.associate { category ->
                    (category.categoryId as String?) to repository.getChannelCountByCategory(serverId, category.categoryId)
                }
            }
            _categoryCounts.value = counts
        }
    }

    fun selectChannel(channel: ChannelEntity) {
        _currentChannel.value = channel
        val index = currentFilteredList.indexOfFirst { it.channelId == channel.channelId }.coerceAtLeast(0)
        _currentChannelIndex.value = index
        _filteredChannelIndex.value = index
        loadEpgForChannel(channel, immediate = true)
    }

    fun selectChannelByIndex(index: Int) {
        if (index in currentFilteredList.indices) {
            val channel = currentFilteredList[index]
            _currentChannel.value = channel
            _currentChannelIndex.value = index
            _filteredChannelIndex.value = index
        }
    }

    fun nextChannel() {
        if (currentFilteredList.isEmpty()) return
        val currentFilteredIdx = _filteredChannelIndex.value ?: 0
        val nextFilteredIdx = (currentFilteredIdx + 1) % currentFilteredList.size
        selectChannelFromFilteredList(nextFilteredIdx)
    }

    fun previousChannel() {
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
            _currentChannelIndex.value = filteredIndex
            loadEpgForChannel(channel, immediate = false)
        }
    }

    fun selectChannelByNumber(number: Int) {
        val channel = currentFilteredList.find { it.customOrder == number } ?: currentFilteredList.getOrNull(number - 1)
        channel?.let { selectChannel(it) }
    }

    fun selectChannelById(channelId: String) {
        viewModelScope.launch {
            val channel = repository.getChannelById(channelId) ?: return@launch
            pendingChannelId = channel.channelId
            if (_selectedCategory.value != channel.categoryId) {
                selectCategory(channel.categoryId)
            } else {
                selectChannel(channel)
            }
        }
    }

    fun searchChannels(query: String) {
        val filtered = if (query.isBlank()) {
            currentFilteredList
        } else {
            currentFilteredList.filter { it.name.contains(query, ignoreCase = true) }
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

    fun loadMoreChannels() {
        if (channelLoadInFlight || currentFilteredList.size >= channelTotalCount) return
        channelWindowSize = (channelWindowSize + CHANNEL_PAGE_SIZE).coerceAtMost(channelTotalCount)
        channelLoadInFlight = true
        observeChannelsForCategory(_selectedCategory.value, resetWindow = false)
    }

    private fun observeChannelsForCategory(categoryId: String?, resetWindow: Boolean = true) {
        if (resetWindow) {
            channelWindowSize = CHANNEL_PAGE_SIZE
            channelTotalCount = 0
            channelLoadInFlight = false
        }
        channelsJob?.cancel()
        channelsJob = viewModelScope.launch {
            try {
                val paginating = channelLoadInFlight
                if (!paginating) _isLoading.value = true
                channelTotalCount = withContext(Dispatchers.IO) {
                    if (categoryId.isNullOrBlank()) {
                        repository.getChannelCount(serverId)
                    } else {
                        repository.getChannelCountByCategory(serverId, categoryId)
                    }
                }
                val requestedLimit = channelWindowSize.coerceAtMost(channelTotalCount.coerceAtLeast(CHANNEL_PAGE_SIZE))
                val flow = if (categoryId.isNullOrBlank()) {
                    repository.getAllChannelsLimited(serverId, requestedLimit)
                } else {
                    repository.getChannelsByCategoryLimited(serverId, categoryId, requestedLimit)
                }

                flow.collect { channels ->
                    currentFilteredList = channels
                    _channels.value = channels
                    _filteredChannels.value = channels
                    Log.d(
                        "LiveTvViewModel",
                        "Loaded window ${channels.size}/$channelTotalCount for category=${categoryId ?: "all"}"
                    )

                    if (channels.isEmpty()) {
                        _currentChannel.value = null
                        _currentChannelIndex.value = 0
                        _filteredChannelIndex.value = 0
                        _currentEpg.postValue(null)
                        _nextEpg.postValue(null)
                    } else {
                        val selected = pendingChannelId?.let { id ->
                            channels.firstOrNull { it.channelId == id }
                        } ?: _currentChannel.value?.let { current ->
                            channels.firstOrNull { it.channelId == current.channelId }
                        } ?: channels.first()

                        pendingChannelId = null
                        val selectedIndex = channels.indexOfFirst { it.channelId == selected.channelId }.coerceAtLeast(0)
                        _currentChannel.value = selected
                        _currentChannelIndex.value = selectedIndex
                        _filteredChannelIndex.value = selectedIndex
                        loadEpgForChannel(selected, immediate = true)
                    }

                    _isLoading.value = false
                    channelLoadInFlight = false
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e("LiveTvViewModel", "Error loading category channels: ${e.message}", e)
                _networkError.value = networkErrorHandler.categorizeError(e)
                currentFilteredList = emptyList()
                _channels.value = emptyList()
                _filteredChannels.value = emptyList()
                _isLoading.value = false
                channelLoadInFlight = false
            }
        }
    }
}
