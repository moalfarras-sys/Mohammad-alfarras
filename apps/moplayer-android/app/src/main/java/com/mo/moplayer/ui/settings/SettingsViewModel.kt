package com.mo.moplayer.ui.settings

import android.content.Context
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.ServerEntity
import com.mo.moplayer.data.local.entity.ServerSyncStateEntity
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.util.DisplayScale
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val repository: IptvRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _activeServer = MutableLiveData<ServerEntity?>()
    val activeServer: LiveData<ServerEntity?> = _activeServer

    private val _sourceStatusItems = MutableLiveData<List<SourceStatusItem>>(emptyList())
    val sourceStatusItems: LiveData<List<SourceStatusItem>> = _sourceStatusItems

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
                name = com.mo.moplayer.data.util.ProviderSourceUrlParser.displayName(server.name, server.serverUrl),
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
                DisplayScale.localized(context).getString(R.string.source_local_playlist)
            } else {
                DisplayScale.localized(context).getString(R.string.source_no_endpoint)
            }
        }

        return runCatching {
            val uri = java.net.URI(server.serverUrl)
            val port = if (uri.port != -1) ":${uri.port}" else ""
            val host = uri.host.orEmpty().ifBlank {
                uri.authority.orEmpty()
                    .substringAfter("@")
                    .substringBefore("/")
                    .substringBefore("?")
            }
            if (host.isNotBlank()) {
                "$host$port"
            } else {
                DisplayScale.localized(context).getString(R.string.source_endpoint_saved)
            }
        }.getOrDefault(
            server.serverUrl
                .substringBefore("?")
                .removePrefix("https://")
                .removePrefix("http://")
                .substringBefore("/")
                .replace(Regex("(username|password|token)=([^&]+)", RegexOption.IGNORE_CASE), "\$1=masked")
        )
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
