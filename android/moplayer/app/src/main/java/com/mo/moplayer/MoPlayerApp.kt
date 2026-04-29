package com.mo.moplayer

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.util.CrashGuard
import com.mo.moplayer.util.TvNavigationManager
import com.mo.moplayer.worker.ServerSyncWorker
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltAndroidApp
class MoPlayerApp : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    @Inject
    lateinit var iptvRepository: IptvRepository

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    override fun onCreate() {
        super.onCreate()
        CrashGuard.install(this)

        // Initialize TV navigation manager
        runCatching { TvNavigationManager.init(this) }
            .onFailure { android.util.Log.e("MoPlayerApp", "TV navigation init failed: ${it.message}", it) }

        // One-time migration: move plaintext credentials from Room to EncryptedSharedPreferences
        appScope.launch {
            try {
                iptvRepository.migrateCredentialsIfNeeded()
            } catch (throwable: Throwable) {
                android.util.Log.e("MoPlayerApp", "Credential migration failed: ${throwable.message}", throwable)
            }
        }

        // Schedule background server sync every 30 minutes
        runCatching { ServerSyncWorker.schedule(this) }
            .onFailure { android.util.Log.e("MoPlayerApp", "Server sync schedule failed: ${it.message}", it) }
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()
}
