package com.mo.moplayer.util

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.playerDataStore: DataStore<Preferences> by preferencesDataStore(name = "player_settings")

/**
 * Manages player preferences including external player selection
 */
@Singleton
class PlayerPreferences @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private val PLAYER_TYPE_KEY = intPreferencesKey("player_type")
        private val EXTERNAL_PLAYER_KEY = stringPreferencesKey("external_player_package")
        private val BUFFER_SIZE_KEY = intPreferencesKey("buffer_size")
        private val HARDWARE_ACCEL_KEY = intPreferencesKey("hardware_accel")
        private val PLAYBACK_PROFILE_KEY = intPreferencesKey("playback_profile")
        private val LIVE_PREVIEW_ENABLED_KEY = intPreferencesKey("live_preview_enabled")
        private val PIP_MODE_ENABLED_KEY = intPreferencesKey("pip_mode_enabled")
        
        // Player types
        const val PLAYER_INTERNAL_VLC = 0
        const val PLAYER_MX_PLAYER = 1
        const val PLAYER_VLC_EXTERNAL = 2
        const val PLAYER_JUST_PLAYER = 3
        const val PLAYER_SYSTEM_DEFAULT = 4
        
        // Playback profiles
        const val PLAYBACK_PROFILE_BALANCED = 0
        const val PLAYBACK_PROFILE_PERFORMANCE = 1
        const val PLAYBACK_PROFILE_QUALITY = 2
        
        // Buffer sizes (in ms) - Optimized for 4K/8K streaming on TV
        const val BUFFER_LOW = 2000      // For stable fast connections (HD content)
        const val BUFFER_MEDIUM = 4000   // Recommended for most users (HD/FHD)
        const val BUFFER_HIGH = 8000     // For unstable connections or 4K content
        const val BUFFER_VERY_HIGH = 15000 // For slow networks or 4K+ content
        const val BUFFER_4K = 20000      // Optimized for 4K streams (20 seconds)
        const val BUFFER_8K = 30000      // Optimized for 8K streams (30 seconds)
        const val BUFFER_ULTRA = 45000   // Maximum buffering for ultra high resolution
        
        // Known player packages
        val KNOWN_PLAYERS = listOf(
            ExternalPlayer("MX Player", "com.mxtech.videoplayer.ad", "com.mxtech.videoplayer.ad.ActivityScreen"),
            ExternalPlayer("MX Player Pro", "com.mxtech.videoplayer.pro", "com.mxtech.videoplayer.pro.ActivityScreen"),
            ExternalPlayer("VLC", "org.videolan.vlc", "org.videolan.vlc.gui.video.VideoPlayerActivity"),
            ExternalPlayer("Just Player", "com.brouken.player", "com.brouken.player.PlayerActivity"),
            ExternalPlayer("Kodi", "org.xbmc.kodi", null),
            ExternalPlayer("Nova Player", "com.newin.nplayer.pro", null)
        )
    }
    
    val playerType: Flow<Int> = context.playerDataStore.data.map { prefs ->
        prefs[PLAYER_TYPE_KEY] ?: PLAYER_INTERNAL_VLC
    }
    
    val externalPlayerPackage: Flow<String> = context.playerDataStore.data.map { prefs ->
        prefs[EXTERNAL_PLAYER_KEY] ?: ""
    }
    
    val bufferSize: Flow<Int> = context.playerDataStore.data.map { prefs ->
        prefs[BUFFER_SIZE_KEY] ?: BUFFER_MEDIUM
    }
    
    val hardwareAcceleration: Flow<Boolean> = context.playerDataStore.data.map { prefs ->
        (prefs[HARDWARE_ACCEL_KEY] ?: 1) == 1
    }

    val playbackProfile: Flow<Int> = context.playerDataStore.data.map { prefs ->
        prefs[PLAYBACK_PROFILE_KEY] ?: PLAYBACK_PROFILE_BALANCED
    }
    
    val livePreviewEnabled: Flow<Boolean> = context.playerDataStore.data.map { prefs ->
        // Default OFF to avoid performance issues on low-power Android TV devices.
        (prefs[LIVE_PREVIEW_ENABLED_KEY] ?: 0) == 1
    }
    
    val pipModeEnabled: Flow<Boolean> = context.playerDataStore.data.map { prefs ->
        // Default OFF for TV - PIP doesn't work well on most Android TV devices
        (prefs[PIP_MODE_ENABLED_KEY] ?: 0) == 1
    }
    
    suspend fun setPlayerType(type: Int) {
        context.playerDataStore.edit { prefs ->
            prefs[PLAYER_TYPE_KEY] = type
        }
    }
    
    suspend fun setExternalPlayerPackage(packageName: String) {
        context.playerDataStore.edit { prefs ->
            prefs[EXTERNAL_PLAYER_KEY] = packageName
        }
    }
    
    suspend fun setBufferSize(size: Int) {
        context.playerDataStore.edit { prefs ->
            prefs[BUFFER_SIZE_KEY] = size
        }
    }
    
    suspend fun setHardwareAcceleration(enabled: Boolean) {
        context.playerDataStore.edit { prefs ->
            prefs[HARDWARE_ACCEL_KEY] = if (enabled) 1 else 0
        }
    }

    suspend fun setPlaybackProfile(profile: Int) {
        context.playerDataStore.edit { prefs ->
            prefs[PLAYBACK_PROFILE_KEY] = profile
        }
    }

    suspend fun setLivePreviewEnabled(enabled: Boolean) {
        context.playerDataStore.edit { prefs ->
            prefs[LIVE_PREVIEW_ENABLED_KEY] = if (enabled) 1 else 0
        }
    }
    
    suspend fun setPipModeEnabled(enabled: Boolean) {
        context.playerDataStore.edit { prefs ->
            prefs[PIP_MODE_ENABLED_KEY] = if (enabled) 1 else 0
        }
    }
    
    /**
     * Get list of installed external players
     */
    fun getInstalledPlayers(): List<ExternalPlayer> {
        val pm = context.packageManager
        return KNOWN_PLAYERS.filter { player ->
            try {
                pm.getPackageInfo(player.packageName, 0)
                true
            } catch (e: PackageManager.NameNotFoundException) {
                false
            }
        }
    }
    
    /**
     * Check if we should use internal player
     */
    suspend fun shouldUseInternalPlayer(): Boolean {
        return playerType.first() == PLAYER_INTERNAL_VLC
    }
    
    /**
     * Create intent to launch external player
     */
    suspend fun createExternalPlayerIntent(streamUrl: String, title: String): Intent? {
        val type = playerType.first()
        
        return when (type) {
            PLAYER_MX_PLAYER -> {
                createMxPlayerIntent(streamUrl, title)
            }
            PLAYER_VLC_EXTERNAL -> {
                createVlcIntent(streamUrl, title)
            }
            PLAYER_JUST_PLAYER -> {
                createJustPlayerIntent(streamUrl, title)
            }
            PLAYER_SYSTEM_DEFAULT -> {
                createSystemDefaultIntent(streamUrl)
            }
            else -> null
        }
    }
    
    private fun createMxPlayerIntent(streamUrl: String, title: String): Intent {
        return Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(Uri.parse(streamUrl), "video/*")
            setPackage("com.mxtech.videoplayer.ad")
            putExtra("title", title)
            putExtra("sticky", false)
            putExtra("return_result", true)
            putExtra("decode_mode", 2) // Hardware+ mode for better TV performance
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
    }
    
    private fun createVlcIntent(streamUrl: String, title: String): Intent {
        return Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(Uri.parse(streamUrl), "video/*")
            setPackage("org.videolan.vlc")
            putExtra("title", title)
            putExtra("from_start", false)
            putExtra("position", 0L)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
    }
    
    private fun createJustPlayerIntent(streamUrl: String, title: String): Intent {
        return Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(Uri.parse(streamUrl), "video/*")
            setPackage("com.brouken.player")
            putExtra("title", title)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
    }
    
    private fun createSystemDefaultIntent(streamUrl: String): Intent {
        return Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(Uri.parse(streamUrl), "video/*")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
    }
    
    fun getPlayerName(type: Int): String {
        return when (type) {
            PLAYER_INTERNAL_VLC -> "VLC (Internal)"
            PLAYER_MX_PLAYER -> "MX Player"
            PLAYER_VLC_EXTERNAL -> "VLC (External)"
            PLAYER_JUST_PLAYER -> "Just Player"
            PLAYER_SYSTEM_DEFAULT -> "System Default"
            else -> "Internal Player"
        }
    }
    
    fun getBufferSizeName(size: Int): String {
        return when (size) {
            BUFFER_LOW -> "Low (2s)"
            BUFFER_MEDIUM -> "Medium (4s)"
            BUFFER_HIGH -> "High (8s)"
            BUFFER_VERY_HIGH -> "Very High (15s)"
            BUFFER_4K -> "4K Optimized (20s)"
            BUFFER_8K -> "8K Optimized (30s)"
            BUFFER_ULTRA -> "Ultra (45s)"
            else -> "Medium"
        }
    }

    fun getPlaybackProfileName(profile: Int): String {
        return when (profile) {
            PLAYBACK_PROFILE_BALANCED -> "Balanced"
            PLAYBACK_PROFILE_PERFORMANCE -> "Performance"
            PLAYBACK_PROFILE_QUALITY -> "Quality"
            else -> "Balanced"
        }
    }
    
    data class ExternalPlayer(
        val name: String,
        val packageName: String,
        val activityName: String?
    )
}
