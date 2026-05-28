package com.moalfarras.moplayer.core

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.flow.first

class LibraryRefreshWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val graph = AppGraph.get(applicationContext)
        val server = graph.iptvRepository.activeServer.first() ?: return Result.success()
        val ageMs = System.currentTimeMillis() - server.lastSyncAt
        if (server.lastSyncAt > 0 && ageMs < SMART_REFRESH_INTERVAL_MS) return Result.success()

        return runCatching {
            graph.iptvRepository.refreshServerFast(server).first { progress ->
                progress.loaded >= progress.total
            }
            Result.success()
        }.getOrElse {
            Result.retry()
        }
    }

    private companion object {
        const val SMART_REFRESH_INTERVAL_MS = 60 * 60 * 1000L
    }
}
