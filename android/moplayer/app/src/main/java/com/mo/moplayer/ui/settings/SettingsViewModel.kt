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
        }
    }

    fun reloadServerInfo() {
        loadServerInfo()
    }

    fun logout() {
        viewModelScope.launch {
            val server = repository.getActiveServerSync()
            server?.let {
                repository.deleteServer(it.id)
            }
        }
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
