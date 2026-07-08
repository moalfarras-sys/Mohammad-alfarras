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
        if (!graph.iptvRepository.needsLibraryRefresh(server, SMART_REFRESH_INTERVAL_MS)) {
            return Result.success()
        }

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
        // Refresh the catalog every ~3h so newly-added movies/series surface promptly. Still
        // background-only + battery/network/storage-constrained + chunked-merge, so it stays silent
        // and light on weak boxes; the worker wakes hourly but only syncs past this staleness.
        const val SMART_REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000L
    }
}
