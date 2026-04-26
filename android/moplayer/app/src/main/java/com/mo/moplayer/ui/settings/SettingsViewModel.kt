package com.mo.moplayer.ui.settings

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mo.moplayer.data.local.entity.ServerEntity
import com.mo.moplayer.data.local.entity.ServerSyncStateEntity
import com.mo.moplayer.data.repository.IptvRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import javax.inject.Inject

private val Context.settingsDataStore by preferencesDataStore(name = "player_settings")

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val repository: IptvRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    companion object {
        private val HARDWARE_ACCEL_KEY = booleanPreferencesKey("hardware_acceleration")
        private val EXTERNAL_PLAYER_KEY = stringPreferencesKey("external_player")
        private val DEFAULT_QUALITY_KEY = stringPreferencesKey("default_quality")
    }

    private val _activeServer = MutableLiveData<ServerEntity?>()
    val activeServer: LiveData<ServerEntity?> = _activeServer

    private val _sourceStatusItems = MutableLiveData<List<SourceStatusItem>>(emptyList())
    val sourceStatusItems: LiveData<List<SourceStatusItem>> = _sourceStatusItems

    val hardwareAcceleration: Flow<Boolean> = context.settingsDataStore.data.map { prefs ->
        prefs[HARDWARE_ACCEL_KEY] ?: true
    }

    val externalPlayer: Flow<String> = context.settingsDataStore.data.map { prefs ->
        prefs[EXTERNAL_PLAYER_KEY] ?: "builtin"
    }

    init {
        loadServerInfo()
    }

    private fun loadServerInfo() {
        viewModelScope.launch {
            _activeServer.value = repository.getActiveServerSync()
            _sourceStatusItems.value = buildSourceStatusItems()
        }
    }

    fun reloadServerInfo() {
        loadServerInfo()
    }

    fun switchSource(serverId: Long) {
        viewModelScope.launch {
            repository.switchActiveServer(serverId, prewarm = true)
            loadServerInfo()
        }
    }

    fun removeSource(serverId: Long) {
        viewModelScope.launch {
            repository.deleteServer(serverId)
            loadServerInfo()
        }
    }

    fun logout() {
        viewModelScope.launch {
            val server = repository.getActiveServerSync()
            server?.let {
                repository.deleteServer(it.id)
            }
            loadServerInfo()
        }
    }

    private suspend fun buildSourceStatusItems(): List<SourceStatusItem> {
        return repository.getAllServers().first().map { server ->
            val state = repository.getServerSyncState(server.id)
            val snapshot = repository.getContentSnapshot(server.id)
            SourceStatusItem(
                id = server.id,
                name = server.name,
                type = server.serverType,
                isActive = server.isActive,
                endpoint = maskEndpoint(server),
                expirationDate = server.expirationDate,
                activeConnections = server.activeConnections,
                maxConnections = server.maxConnections,
                syncState = state,
                channels = state?.totalChannels?.takeIf { it > 0 } ?: snapshot.channelsCount,
                movies = state?.totalMovies?.takeIf { it > 0 } ?: snapshot.moviesCount,
                series = state?.totalSeries?.takeIf { it > 0 } ?: snapshot.seriesCount,
                categories = state?.totalCategories?.takeIf { it > 0 } ?: snapshot.categoriesCount
            )
        }
    }

    private fun maskEndpoint(server: ServerEntity): String {
        if (server.serverUrl.isBlank()) {
            return if (server.serverType.equals("m3u", ignoreCase = true)) {
                "Imported playlist stored locally"
            } else {
                "No endpoint stored"
            }
        }

        return runCatching {
            val uri = java.net.URI(server.serverUrl)
            val port = if (uri.port != -1) ":${uri.port}" else ""
            val base = "${uri.scheme}://${uri.host.orEmpty()}$port"
            if (server.serverUrl.contains("?")) {
                "$base/...?...=masked"
            } else {
                base
            }
        }.getOrDefault(server.serverUrl.replace(Regex("(username|password|token)=([^&]+)", RegexOption.IGNORE_CASE), "\$1=masked"))
    }

    fun setHardwareAcceleration(enabled: Boolean) {
        viewModelScope.launch {
            context.settingsDataStore.edit { prefs ->
                prefs[HARDWARE_ACCEL_KEY] = enabled
            }
        }
    }

    fun setExternalPlayer(player: String) {
        viewModelScope.launch {
            context.settingsDataStore.edit { prefs ->
                prefs[EXTERNAL_PLAYER_KEY] = player
            }
        }
    }

    suspend fun getExternalPlayerSync(): String {
        return context.settingsDataStore.data.first()[EXTERNAL_PLAYER_KEY] ?: "builtin"
    }

    suspend fun isHardwareAccelerationEnabled(): Boolean {
        return context.settingsDataStore.data.first()[HARDWARE_ACCEL_KEY] ?: true
    }
}

data class SourceStatusItem(
    val id: Long,
    val name: String,
    val type: String,
    val isActive: Boolean,
    val endpoint: String,
    val expirationDate: String?,
    val activeConnections: Int?,
    val maxConnections: Int?,
    val syncState: ServerSyncStateEntity?,
    val channels: Int,
    val movies: Int,
    val series: Int,
    val categories: Int
)
