package com.mo.moplayer.data.epg

import android.content.Context
import android.util.Log
import com.mo.moplayer.data.local.dao.ChannelDao
import com.mo.moplayer.data.local.dao.EpgDao
import com.mo.moplayer.util.CredentialManager
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Keeps the TV guide of M3U sources filled from their XMLTV link (from the website activation or
 * the playlist's `url-tvg` header). Xtream sources keep using the provider's short-EPG API.
 *
 * Imports run on an app-wide scope so leaving the screen that started them does not cancel them,
 * one at a time, and at most every [REFRESH_INTERVAL_MS] per source unless forced.
 */
@Singleton
class XmltvEpgRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    okHttpClient: OkHttpClient,
    private val channelDao: ChannelDao,
    private val epgDao: EpgDao,
    private val credentialManager: CredentialManager
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val importLock = Mutex()
    private val prefs by lazy { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE) }

    // Guides are large and slow; give them their own generous read timeout.
    private val importer = XmltvEpgImporter(
        okHttpClient.newBuilder()
            .readTimeout(90, TimeUnit.SECONDS)
            .callTimeout(5, TimeUnit.MINUTES)
            .build()
    )

    fun hasGuide(serverId: Long): Boolean = credentialManager.getEpgUrl(serverId) != null

    /** Starts an import in the background when the source has a guide and it is due. */
    fun refreshInBackground(serverId: Long, force: Boolean = false) {
        if (!hasGuide(serverId)) return
        if (!force && !isDue(serverId)) return
        scope.launch { refresh(serverId) }
    }

    private fun isDue(serverId: Long): Boolean {
        val last = prefs.getLong(KEY_LAST_IMPORT.format(serverId), 0L)
        return System.currentTimeMillis() - last >= REFRESH_INTERVAL_MS
    }

    private suspend fun refresh(serverId: Long) = importLock.withLock {
        val url = credentialManager.getEpgUrl(serverId) ?: return@withLock
        val channels = channelDao.getEpgKeys(serverId).map {
            XmltvEpgImporter.ChannelKey(it.epgChannelId, it.streamId, it.name)
        }
        if (channels.isEmpty()) return@withLock
        val now = System.currentTimeMillis()
        runCatching {
            importer.import(
                url = url,
                serverId = serverId,
                channels = channels,
                windowStartMs = now - WINDOW_PAST_MS,
                windowEndMs = now + WINDOW_FUTURE_MS
            ) { batch -> epgDao.insertAll(batch) }
        }.onSuccess { result ->
            epgDao.deleteOldEpg(now - WINDOW_PAST_MS)
            prefs.edit().putLong(KEY_LAST_IMPORT.format(serverId), now).apply()
            Log.i(TAG, "XMLTV import: ${result.programmes} programmes for ${result.matchedChannels} channels")
        }.onFailure { error ->
            // Try again on the next screen visit, but not in a tight loop.
            prefs.edit().putLong(KEY_LAST_IMPORT.format(serverId), now - REFRESH_INTERVAL_MS + RETRY_AFTER_FAILURE_MS).apply()
            Log.w(TAG, "XMLTV import failed: ${error.javaClass.simpleName}")
        }
    }

    private companion object {
        const val TAG = "XmltvEpg"
        const val PREFS = "xmltv_epg"
        const val KEY_LAST_IMPORT = "last_import_%d"
        const val REFRESH_INTERVAL_MS = 12L * 60 * 60 * 1000
        const val RETRY_AFTER_FAILURE_MS = 30L * 60 * 1000
        const val WINDOW_PAST_MS = 3L * 60 * 60 * 1000
        const val WINDOW_FUTURE_MS = 48L * 60 * 60 * 1000
    }
}
