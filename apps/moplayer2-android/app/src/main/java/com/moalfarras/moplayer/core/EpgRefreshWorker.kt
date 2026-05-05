package com.moalfarras.moplayer.core

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.moalfarras.moplayer.domain.model.LoginKind
import kotlinx.coroutines.flow.first

class EpgRefreshWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val graph = AppGraph.get(applicationContext)
        val server = graph.iptvRepository.activeServer.first() ?: return Result.success()
        if (server.kind != LoginKind.XTREAM) return Result.success()

        return runCatching {
            graph.iptvRepository.refreshFullEpg(server)
            Result.success()
        }.getOrElse {
            Result.retry()
        }
    }
}
