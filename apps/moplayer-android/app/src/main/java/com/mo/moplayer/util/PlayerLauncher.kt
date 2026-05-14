package com.mo.moplayer.util

import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import com.mo.moplayer.R
import com.mo.moplayer.ui.player.PlayerActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Helper object for launching video players (internal or external)
 * Provides unified interface for player selection and launching
 */
object PlayerLauncher {
    
    /**
     * Show dialog to select player and launch content
     */
    fun showPlayerSelectionDialog(
        context: Context,
        playerPreferences: PlayerPreferences,
        streamUrl: String,
        title: String,
        extraData: Bundle? = null,
        onPlayerSelected: ((Int) -> Unit)? = null
    ) {
        val scope = CoroutineScope(Dispatchers.Main)
        
        scope.launch {
            val currentType = playerPreferences.playerType.first()
            val installedPlayers = playerPreferences.getInstalledPlayers()
            
            val options = mutableListOf<String>()
            val playerTypes = mutableListOf<Int>()
            
            // Always add internal players (VLC default, ExoPlayer opt-in)
            options.add(playerPreferences.getPlayerName(PlayerPreferences.PLAYER_INTERNAL_VLC))
            playerTypes.add(PlayerPreferences.PLAYER_INTERNAL_VLC)
            options.add(playerPreferences.getPlayerName(PlayerPreferences.PLAYER_INTERNAL_EXOPLAYER))
            playerTypes.add(PlayerPreferences.PLAYER_INTERNAL_EXOPLAYER)
            
            // Add installed external players
            installedPlayers.forEach { player ->
                when (player.packageName) {
                    "com.mxtech.videoplayer.ad", "com.mxtech.videoplayer.pro" -> {
                        if (!playerTypes.contains(PlayerPreferences.PLAYER_MX_PLAYER)) {
                            options.add("MX Player")
                            playerTypes.add(PlayerPreferences.PLAYER_MX_PLAYER)
                        }
                    }
                    "org.videolan.vlc" -> {
                        options.add("VLC (External)")
                        playerTypes.add(PlayerPreferences.PLAYER_VLC_EXTERNAL)
                    }
                    "com.brouken.player" -> {
                        options.add("Just Player")
                        playerTypes.add(PlayerPreferences.PLAYER_JUST_PLAYER)
                    }
                }
            }
            
            // Add system default
            options.add("System Default")
            playerTypes.add(PlayerPreferences.PLAYER_SYSTEM_DEFAULT)
            
            val currentIndex = playerTypes.indexOf(currentType).coerceAtLeast(0)
            
            AlertDialog.Builder(context, R.style.AlertDialogTheme)
                .setTitle("Select Player")
                .setSingleChoiceItems(options.toTypedArray(), currentIndex) { dialog, which ->
                    val selectedType = playerTypes[which]
                    onPlayerSelected?.invoke(selectedType)
                    
                    scope.launch {
                        launchPlayerByType(
                            context,
                            playerPreferences,
                            selectedType,
                            streamUrl,
                            title,
                            extraData
                        )
                    }
                    dialog.dismiss()
                }
                .setNegativeButton("Cancel", null)
                .show()
        }
    }
    
    /**
     * Launch player by type without showing dialog
     */
    suspend fun launchPlayerByType(
        context: Context,
        playerPreferences: PlayerPreferences,
        playerType: Int,
        streamUrl: String,
        title: String,
        extraData: Bundle? = null
    ) = withContext(Dispatchers.Main) {
        try {
            if (playerType == PlayerPreferences.PLAYER_INTERNAL_VLC || playerType == PlayerPreferences.PLAYER_INTERNAL_EXOPLAYER) {
                // Use internal player (VLC or ExoPlayer)
                val intent = Intent(context, PlayerActivity::class.java).apply {
                    putExtra(PlayerActivity.EXTRA_STREAM_URL, streamUrl)
                    putExtra(PlayerActivity.EXTRA_TITLE, title)
                    extraData?.let { putExtras(it) }
                }
                context.startActivity(intent)
            } else {
                // Use external player - temporarily set the type
                val originalType = playerPreferences.playerType.first()
                playerPreferences.setPlayerType(playerType)
                
                val intent = playerPreferences.createExternalPlayerIntent(streamUrl, title)
                if (intent != null) {
                    context.startActivity(intent)
                } else {
                    Toast.makeText(context, "Player not available", Toast.LENGTH_SHORT).show()
                }
                
                // Restore original type
                playerPreferences.setPlayerType(originalType)
            }
        } catch (e: Exception) {
            Toast.makeText(context, "Failed to launch player: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
    
    /**
     * Launch with currently selected player from preferences
     */
    suspend fun launchWithSelectedPlayer(
        context: Context,
        playerPreferences: PlayerPreferences,
        streamUrl: String,
        title: String,
        extraData: Bundle? = null
    ) {
        val playerType = playerPreferences.playerType.first()
        launchPlayerByType(context, playerPreferences, playerType, streamUrl, title, extraData)
    }
}
