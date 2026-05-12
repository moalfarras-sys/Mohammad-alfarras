package com.moalfarras.moplayer.core

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.moalfarras.moplayer.data.db.MoPlayerDatabase
import com.moalfarras.moplayer.data.network.NetworkModule
import com.moalfarras.moplayer.data.parser.M3uParser
import com.moalfarras.moplayer.data.repository.AppSettingsRepository
import com.moalfarras.moplayer.data.repository.IptvRepository
import com.moalfarras.moplayer.data.repository.WidgetRepository
import java.util.concurrent.TimeUnit

class AppContainer(context: Context) {
    private val appContext = context.applicationContext
    private val database = MoPlayerDatabase.get(appContext)

    init {
        scheduleEpgRefresh(appContext)
    }

    val settingsRepository = AppSettingsRepository(appContext)
    val iptvRepository = IptvRepository(
        database = database,
        playlistService = NetworkModule.playlistService,
        xtreamFactory = NetworkModule::xtream,
        supabaseService = NetworkModule.supabaseService,
        parser = M3uParser(),
    )
    val widgetRepository = WidgetRepository(
        weatherService = NetworkModule.weatherService,
        freeWeatherService = NetworkModule.freeWeatherService,
        footballService = NetworkModule.footballService,
    )
}

object AppGraph {
    @Volatile private var container: AppContainer? = null

    fun get(context: Context): AppContainer =
        container ?: synchronized(this) {
            container ?: AppContainer(context).also { container = it }
        }
}

private fun scheduleEpgRefresh(context: Context) {
    val request = PeriodicWorkRequestBuilder<EpgRefreshWorker>(12, TimeUnit.HOURS)
        .setConstraints(
            Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build(),
        )
        .build()

    WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        "epg-refresh",
        ExistingPeriodicWorkPolicy.KEEP,
        request,
    )
}
