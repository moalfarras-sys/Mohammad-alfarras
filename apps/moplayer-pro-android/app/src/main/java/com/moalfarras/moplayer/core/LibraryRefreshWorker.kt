package com.moalfarras.moplayer.core

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.moalfarras.moplayer.data.repository.SyncMode
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.first

class LibraryRefreshWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val graph = AppGraph.get(applicationContext)
        PlaybackActivity.attach(applicationContext)
        val server = graph.iptvRepository.activeServer.first() ?: return Result.success()
        if (!graph.iptvRepository.needsLibraryRefresh(server, SMART_REFRESH_INTERVAL_MS)) {
            return Result.success()
        }
        // Never start a catalog download while someone is watching, unless it is a day old.
        if (PlaybackActivity.isLikelyActive() &&
            !graph.iptvRepository.needsLibraryRefresh(server, PLAYBACK_OVERRIDE_INTERVAL_MS)
        ) {
            return Result.success()
        }

        return try {
            // Joins a refresh the app is already running instead of starting a second download.
            graph.iptvRepository.refreshServerFast(server, SyncMode.BACKGROUND).collect {}
            Result.success()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            // The repository records the failure and backs off (30 min .. 6 h); the periodic
            // request wakes up hourly, so WorkManager's own backoff is not needed on top.
            Result.success()
        }
    }

    private companion object {
        // Refresh the catalog every ~3h so newly-added movies/series surface promptly. Still
        // background-only + battery/network/storage-constrained + batched writes, so it stays silent
        // and light on weak boxes; the worker wakes hourly but only syncs past this staleness.
        const val SMART_REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000L
        const val PLAYBACK_OVERRIDE_INTERVAL_MS = 24 * 60 * 60 * 1000L
    }
}
