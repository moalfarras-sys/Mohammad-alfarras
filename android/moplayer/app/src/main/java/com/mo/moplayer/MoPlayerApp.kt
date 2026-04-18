package com.mo.moplayer

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.mo.moplayer.data.repository.IptvRepository
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

        // Initialize TV navigation manager
        TvNavigationManager.init(this)

        // One-time migration: move plaintext credentials from Room to EncryptedSharedPreferences
        appScope.launch {
            try {
                iptvRepository.migrateCredentialsIfNeeded()
            } catch (e: Exception) {
                android.util.Log.e("MoPlayerApp", "Credential migration failed: ${e.message}", e)
            }
        }

        // Schedule background server sync every 30 minutes
        ServerSyncWorker.schedule(this)
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()
}
