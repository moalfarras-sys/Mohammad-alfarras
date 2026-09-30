package com.moalfarras.moplayer.data.db

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Records a live channel as played only when the viewer stays on it for [dwellMs]; a newer start
 * cancels the pending one. Channel surfing therefore no longer writes `lastPlayedAt` into the
 * catalog on every CH+/CH- (each write re-ran every open media query while the next stream was
 * starting) and no longer fills "Recent channels" with channels that were only passed through.
 */
class LiveHistoryDebouncer(
    private val scope: CoroutineScope,
    private val dwellMs: Long = LIVE_HISTORY_DWELL_MS,
) {
    private val lock = Any()
    private var pending: Job? = null

    fun schedule(write: suspend () -> Unit) {
        synchronized(lock) {
            pending?.cancel()
            pending = scope.launch {
                delay(dwellMs)
                // History is best effort; a failed write must never crash the app.
                runCatching { write() }
            }
        }
    }

    /** Drops a write still waiting out the dwell (the player closed, or history was cleared). */
    fun cancel() {
        synchronized(lock) {
            pending?.cancel()
            pending = null
        }
    }

    companion object {
        const val LIVE_HISTORY_DWELL_MS = 10_000L

        /** Process-wide instance used by [MediaDao.markPlayed]. */
        val shared = LiveHistoryDebouncer(CoroutineScope(SupervisorJob() + Dispatchers.IO))
    }
}
