package com.mo.moplayer.util

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * Lightweight replacement for deprecated [LocalBroadcastManager].
 *
 * Publishes sync-completion events as a [SharedFlow] so any interested
 * Activity / ViewModel can collect them without manual registration.
 */
object SyncEventBus {

    private val _events = MutableSharedFlow<SyncEvent>(extraBufferCapacity = 10)
    val events: SharedFlow<SyncEvent> = _events.asSharedFlow()

    fun emit(event: SyncEvent) {
        _events.tryEmit(event)
    }

    sealed class SyncEvent {
        data class Completed(val newContentCount: Int = 0) : SyncEvent()
        data class Failed(val error: String) : SyncEvent()
        object Started : SyncEvent()
    }
}
