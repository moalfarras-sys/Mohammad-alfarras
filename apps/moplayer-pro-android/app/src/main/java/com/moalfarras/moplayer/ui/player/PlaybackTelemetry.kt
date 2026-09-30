package com.moalfarras.moplayer.ui.player

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class PlaybackTelemetrySnapshot(
    val mediaId: String,
    val title: String,
    val isLive: Boolean,
    val collectedAt: Long,
    val statsSummary: String,
)

/**
 * In-memory ring buffer of recent playback events (errors, engine and surface switches,
 * reconnects). Summaries must never contain credentials: pass stream URLs through
 * [safeStreamLabel] first.
 */
object PlaybackTelemetryStore {
    private const val MaxEvents = 60
    private val events = ArrayDeque<PlaybackTelemetrySnapshot>(MaxEvents)
    private val mutableSnapshots = MutableStateFlow<List<PlaybackTelemetrySnapshot>>(emptyList())

    val snapshots: StateFlow<List<PlaybackTelemetrySnapshot>> = mutableSnapshots

    @Synchronized
    fun record(snapshot: PlaybackTelemetrySnapshot) {
        while (events.size >= MaxEvents) {
            events.removeFirst()
        }
        events.addLast(snapshot)
        mutableSnapshots.value = events.toList()
    }

    fun event(mediaId: String, title: String, isLive: Boolean, summary: String) {
        record(
            PlaybackTelemetrySnapshot(
                mediaId = mediaId,
                title = title,
                isLive = isLive,
                collectedAt = System.currentTimeMillis(),
                statsSummary = summary,
            ),
        )
    }
}
