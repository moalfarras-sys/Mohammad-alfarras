package com.mo.moplayer.ui.epg

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mo.moplayer.data.local.entity.CategoryEntity
import com.mo.moplayer.data.local.entity.ChannelEntity
import com.mo.moplayer.data.local.entity.ServerEntity
import com.mo.moplayer.data.repository.IptvRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Calendar
import javax.inject.Inject

/**
 * Drives the full program-guide grid: categories, the channel rows for the selected
 * category, and the EPG that falls inside the visible day window. EPG is read from the
 * local cache first (instant) and missing channels are back-filled lazily as their rows
 * scroll into view, so opening the guide never blocks on the network.
 */
@HiltViewModel
class EpgGuideViewModel @Inject constructor(
    private val repository: IptvRepository
) : ViewModel() {

    data class GuideState(
        val rows: List<EpgGuideRow> = emptyList(),
        val windowStartMs: Long = 0L,
        val windowEndMs: Long = 0L,
        val dayOffset: Int = 0,
        val loading: Boolean = true
    )

    private val _categories = MutableLiveData<List<CategoryEntity>>(emptyList())
    val categories: LiveData<List<CategoryEntity>> = _categories

    private val _selectedCategory = MutableLiveData<String?>(null)
    val selectedCategory: LiveData<String?> = _selectedCategory

    private val _state = MutableLiveData(GuideState())
    val state: LiveData<GuideState> = _state

    private var server: ServerEntity? = null
    private var serverId: Long = 0L
    private var dayOffset: Int = 0
    private var allChannels: List<ChannelEntity> = emptyList()
    private var channelsJob: Job? = null
    private var epgFetchJob: Job? = null

    /** Channels we've already asked the server about this session, to avoid re-hammering. */
    private val requestedStreams = HashSet<Int>()

    companion object {
        private const val GUIDE_SPAN_HOURS = 24L
        // Cap rows so a 12k-channel "all" category can't choke a weak box.
        private const val MAX_CHANNELS = 300
        private const val EPG_FETCH_BATCH = 12
        private const val EPG_FETCH_CAP = 60
    }

    init {
        bootstrap()
    }

    private fun bootstrap() {
        viewModelScope.launch {
            val srv = repository.getActiveServerSync() ?: run {
                _state.value = GuideState(loading = false)
                return@launch
            }
            server = srv
            serverId = srv.id
            val cats = try {
                withContext(Dispatchers.IO) { repository.getLiveCategories(srv.id).first() }
            } catch (e: CancellationException) {
                throw e
            } catch (_: Exception) {
                emptyList()
            }
            _categories.value = cats
            val initial = _selectedCategory.value ?: cats.firstOrNull()?.categoryId
            selectCategory(initial)
        }
    }

    fun selectCategory(categoryId: String?) {
        _selectedCategory.value = categoryId
        observeChannels(categoryId)
    }

    fun goToDay(offset: Int) {
        if (offset == dayOffset) return
        dayOffset = offset
        requestedStreams.clear()
        rebuild()
    }

    fun selectedDayOffset(): Int = dayOffset

    private fun observeChannels(categoryId: String?) {
        channelsJob?.cancel()
        channelsJob = viewModelScope.launch {
            _state.value = _state.value?.copy(loading = true) ?: GuideState(loading = true)
            if (serverId == 0L) { _state.value = GuideState(loading = false); return@launch }
            val flow = if (categoryId.isNullOrBlank()) {
                repository.getAllChannelsLimited(serverId, MAX_CHANNELS)
            } else {
                repository.getChannelsByCategory(serverId, categoryId)
            }
            try {
                flow.collect { channels ->
                    allChannels = channels.take(MAX_CHANNELS)
                    requestedStreams.clear()
                    rebuild()
                }
            } catch (e: CancellationException) {
                throw e
            } catch (_: Exception) {
                allChannels = emptyList()
                rebuild()
            }
        }
    }

    /** Recompute the window + read cached EPG and emit immediately. */
    private fun rebuild() {
        viewModelScope.launch {
            val ws = windowStartFor(dayOffset)
            val we = ws + GUIDE_SPAN_HOURS * 3_600_000L
            val streamIds = allChannels.map { it.streamId }
            val epgMap = try {
                repository.getEpgWindowForChannels(serverId, streamIds, ws, we)
            } catch (_: Exception) {
                emptyMap()
            }
            val rows = allChannels.map { ch -> EpgGuideRow(ch, epgMap[ch.streamId].orEmpty()) }
            _state.postValue(GuideState(rows, ws, we, dayOffset, loading = false))
        }
    }

    /**
     * Back-fill EPG for the channels currently on screen that have none cached. Called by
     * the activity as rows scroll into view; deduped and throttled so scrolling fast over
     * hundreds of channels never floods the server.
     */
    fun ensureEpgForChannels(visibleStreamIds: List<Int>) {
        val srv = server ?: return
        val candidates = visibleStreamIds.filter { it !in requestedStreams }
        if (candidates.isEmpty()) return
        candidates.forEach { requestedStreams.add(it) }

        epgFetchJob = viewModelScope.launch(Dispatchers.IO) {
            val ws = windowStartFor(dayOffset)
            val we = ws + GUIDE_SPAN_HOURS * 3_600_000L
            val missing = try {
                val have = repository.getChannelsWithEpgInWindow(serverId, candidates, ws, we)
                candidates.filter { it !in have }
            } catch (_: Exception) {
                candidates
            }.take(EPG_FETCH_CAP)

            if (missing.isEmpty()) return@launch
            var fetchedAny = false
            missing.chunked(EPG_FETCH_BATCH).forEach { batch ->
                batch.forEach { streamId ->
                    try {
                        repository.fetchAndSaveEpg(srv, streamId)
                        fetchedAny = true
                    } catch (e: CancellationException) {
                        throw e
                    } catch (_: Exception) {
                    }
                }
                delay(120)
            }
            if (fetchedAny) {
                // Re-read the window and refresh rows in place (keeps the same channel list).
                val epgMap = try {
                    repository.getEpgWindowForChannels(serverId, allChannels.map { it.streamId }, ws, we)
                } catch (_: Exception) {
                    emptyMap()
                }
                val rows = allChannels.map { ch -> EpgGuideRow(ch, epgMap[ch.streamId].orEmpty()) }
                _state.postValue(
                    _state.value?.copy(rows = rows, loading = false)
                        ?: GuideState(rows, ws, we, dayOffset, loading = false)
                )
            }
        }
    }

    private fun windowStartFor(offset: Int): Long {
        val cal = Calendar.getInstance()
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        if (offset == 0) {
            // Anchor today's window an hour before "now" so a little history shows and
            // there's a long future runway to scroll through.
            cal.set(Calendar.MINUTE, 0)
            cal.add(Calendar.HOUR_OF_DAY, -1)
        } else {
            cal.add(Calendar.DAY_OF_YEAR, offset)
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
        }
        return cal.timeInMillis
    }
}
