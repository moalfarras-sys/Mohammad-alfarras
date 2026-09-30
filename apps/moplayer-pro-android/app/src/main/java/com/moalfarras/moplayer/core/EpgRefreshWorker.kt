package com.moalfarras.moplayer.core

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.first

class EpgRefreshWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val graph = AppGraph.get(applicationContext)
        PlaybackActivity.attach(applicationContext)
        val server = graph.iptvRepository.activeServer.first() ?: return Result.success()
        // Xtream (xmltv.php) and M3U sources with a guide URL; failures back off inside the repository.
        if (!graph.iptvRepository.needsFullEpgRefresh(server, FULL_EPG_REFRESH_INTERVAL_MS)) {
            return Result.success()
        }
        // While a channel is playing, wait unless the guide is getting too old to show now/next.
        if (PlaybackActivity.isLikelyActive() &&
            !graph.iptvRepository.needsFullEpgRefresh(server, PLAYBACK_OVERRIDE_INTERVAL_MS)
        ) {
            return Result.success()
        }

        return try {
            graph.iptvRepository.refreshFullEpg(server)
            Result.success()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            Result.success()
        }
    }

    private companion object {
        const val FULL_EPG_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000L
        const val PLAYBACK_OVERRIDE_INTERVAL_MS = 12 * 60 * 60 * 1000L
    }
}
