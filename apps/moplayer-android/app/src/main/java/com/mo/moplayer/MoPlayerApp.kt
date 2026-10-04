package com.mo.moplayer

import android.app.Application
import android.os.StrictMode
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.util.CrashGuard
import com.mo.moplayer.util.ImageCacheManager
import com.mo.moplayer.util.RecyclerViewOptimizer
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

    @Inject
    lateinit var imageCacheManager: ImageCacheManager

    @Inject
    lateinit var recyclerViewOptimizer: RecyclerViewOptimizer

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    override fun onCreate() {
        super.onCreate()
        CrashGuard.install(this)

        // Initialize TV navigation manager
        runCatching { TvNavigationManager.init(this) }
            .onFailure { android.util.Log.e("MoPlayerApp", "TV navigation init failed: ${it.message}", it) }
        installDebugStrictMode()

        // One-time migration: move plaintext credentials from Room to EncryptedSharedPreferences
        appScope.launch {
            try {
                iptvRepository.migrateCredentialsIfNeeded()
            } catch (throwable: Throwable) {
                android.util.Log.e("MoPlayerApp", "Credential migration failed: ${throwable.message}", throwable)
            }
        }

        // Schedule a conservative periodic sync; the worker skips fresh/local-only sources.
        runCatching { ServerSyncWorker.schedule(this) }
            .onFailure { android.util.Log.e("MoPlayerApp", "Server sync schedule failed: ${it.message}", it) }
        refreshLibraryAfterUpdate()
    }

    /**
     * 2.5.0 stores ratings on a 10-point scale and cleans provider plots. Libraries synced by an
     * older version are refreshed once on the first launch after the update so every screen shows
     * the corrected data right away instead of after the next scheduled sync.
     */
    private fun refreshLibraryAfterUpdate() {
        val prefs = getSharedPreferences("app_version", MODE_PRIVATE)
        val policy = StrictMode.allowThreadDiskReads()
        val lastCode = try { prefs.getInt("last_version_code", 0) } finally { StrictMode.setThreadPolicy(policy) }
        val current = BuildConfig.VERSION_CODE
        if (lastCode in 1 until LIBRARY_FORMAT_VERSION_CODE || (lastCode == 0 && hasExistingInstallData())) {
            runCatching { ServerSyncWorker.syncNow(this, force = true) }
        }
        if (lastCode != current) prefs.edit().putInt("last_version_code", current).apply()
    }

    /** An update from a version that did not record its code still has the Room database. */
    private fun hasExistingInstallData(): Boolean = getDatabasePath("moplayer_database").exists()

    private companion object {
        const val LIBRARY_FORMAT_VERSION_CODE = 25
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        imageCacheManager.trimMemory(level)
        if (level >= TRIM_MEMORY_BACKGROUND) {
            recyclerViewOptimizer.clearPools()
        }
    }

    override fun onLowMemory() {
        super.onLowMemory()
        imageCacheManager.clearMemory()
        recyclerViewOptimizer.clearPools()
    }

    private fun installDebugStrictMode() {
        if (!BuildConfig.DEBUG) return
        StrictMode.setThreadPolicy(
            StrictMode.ThreadPolicy.Builder()
                .detectDiskReads()
                .detectDiskWrites()
                .detectNetwork()
                .penaltyLog()
                .build()
        )
        StrictMode.setVmPolicy(
            StrictMode.VmPolicy.Builder()
                .detectActivityLeaks()
                .detectLeakedClosableObjects()
                .detectLeakedRegistrationObjects()
                .detectLeakedSqlLiteObjects()
                .penaltyLog()
                .build()
        )
    }
}
