package com.mo.moplayer.ui.player

import android.app.PendingIntent
import android.app.PictureInPictureParams
import android.app.RemoteAction
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.drawable.Icon
import android.os.Build
import android.util.Rational
import androidx.annotation.RequiresApi
import com.mo.moplayer.R

/**
 * Enhanced Picture-in-Picture helper for PlayerActivity.
 * Provides smooth transitions, custom controls, and proper lifecycle management.
 */
class PipController(
    private val context: Context,
    private val listener: PipListener
) {
    
    interface PipListener {
        fun onPlayPauseClicked(isPlaying: Boolean)
        fun onSeekClicked(forward: Boolean)
        fun onPipModeChanged(isInPipMode: Boolean)
        fun isPlaying(): Boolean
        fun getVideoAspectRatio(): Rational?
    }
    
    companion object {
        private const val ACTION_MEDIA_CONTROL = "com.mo.moplayer.MEDIA_CONTROL"
        private const val EXTRA_CONTROL_TYPE = "control_type"
        
        private const val CONTROL_TYPE_PLAY = 1
        private const val CONTROL_TYPE_PAUSE = 2
        private const val CONTROL_TYPE_REWIND = 3
        private const val CONTROL_TYPE_FORWARD = 4
        
        private const val REQUEST_PLAY = 100
        private const val REQUEST_PAUSE = 101
        private const val REQUEST_REWIND = 102
        private const val REQUEST_FORWARD = 103
    }
    
    private var isInPipMode = false
    
    private val broadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context?, intent: Intent?) {
            if (intent?.action != ACTION_MEDIA_CONTROL) return
            
            when (intent.getIntExtra(EXTRA_CONTROL_TYPE, 0)) {
                CONTROL_TYPE_PLAY -> listener.onPlayPauseClicked(false)
                CONTROL_TYPE_PAUSE -> listener.onPlayPauseClicked(true)
                CONTROL_TYPE_REWIND -> listener.onSeekClicked(false)
                CONTROL_TYPE_FORWARD -> listener.onSeekClicked(true)
            }
        }
    }
    
    /**
     * Check if PiP is supported on this device
     */
    fun isPipSupported(): Boolean {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
    }
    
    /**
     * Register the broadcast receiver for PiP controls
     */
    fun register() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(
                broadcastReceiver,
                IntentFilter(ACTION_MEDIA_CONTROL),
                Context.RECEIVER_NOT_EXPORTED
            )
        } else {
            context.registerReceiver(
                broadcastReceiver,
                IntentFilter(ACTION_MEDIA_CONTROL)
            )
        }
    }
    
    /**
     * Unregister the broadcast receiver
     */
    fun unregister() {
        try {
            context.unregisterReceiver(broadcastReceiver)
        } catch (e: Exception) {
            // Receiver not registered
        }
    }
    
    /**
     * Build PiP parameters with custom actions
     */
    @RequiresApi(Build.VERSION_CODES.O)
    fun buildPipParams(): PictureInPictureParams {
        val builder = PictureInPictureParams.Builder()
        
        // Set aspect ratio
        val aspectRatio = listener.getVideoAspectRatio() ?: Rational(16, 9)
        builder.setAspectRatio(aspectRatio)
        
        // Add remote actions (play/pause, rewind, forward)
        val actions = buildRemoteActions()
        builder.setActions(actions)
        
        // Auto-enter PiP on newer versions
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setAutoEnterEnabled(true)
            builder.setSeamlessResizeEnabled(true)
        }
        
        return builder.build()
    }
    
    /**
     * Update PiP params when playback state changes
     */
    @RequiresApi(Build.VERSION_CODES.O)
    fun updatePipParams(): PictureInPictureParams {
        return buildPipParams()
    }
    
    /**
     * Called when entering/exiting PiP mode
     */
    fun onPipModeChanged(isInPip: Boolean) {
        isInPipMode = isInPip
        listener.onPipModeChanged(isInPip)
    }
    
    fun isInPipMode(): Boolean = isInPipMode
    
    @RequiresApi(Build.VERSION_CODES.O)
    private fun buildRemoteActions(): List<RemoteAction> {
        val actions = mutableListOf<RemoteAction>()
        val isPlaying = listener.isPlaying()
        
        // Rewind action
        actions.add(buildRemoteAction(
            R.drawable.ic_replay_10,
            R.string.pip_rewind,
            CONTROL_TYPE_REWIND,
            REQUEST_REWIND
        ))
        
        // Play/Pause action
        if (isPlaying) {
            actions.add(buildRemoteAction(
                R.drawable.ic_pause,
                R.string.pip_pause,
                CONTROL_TYPE_PAUSE,
                REQUEST_PAUSE
            ))
        } else {
            actions.add(buildRemoteAction(
                R.drawable.ic_play,
                R.string.pip_play,
                CONTROL_TYPE_PLAY,
                REQUEST_PLAY
            ))
        }
        
        // Forward action
        actions.add(buildRemoteAction(
            R.drawable.ic_forward_10,
            R.string.pip_forward,
            CONTROL_TYPE_FORWARD,
            REQUEST_FORWARD
        ))
        
        return actions
    }
    
    @RequiresApi(Build.VERSION_CODES.O)
    private fun buildRemoteAction(
        iconRes: Int,
        titleRes: Int,
        controlType: Int,
        requestCode: Int
    ): RemoteAction {
        val intent = Intent(ACTION_MEDIA_CONTROL).apply {
            putExtra(EXTRA_CONTROL_TYPE, controlType)
        }
        
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val icon = Icon.createWithResource(context, iconRes)
        val title = context.getString(titleRes)
        
        return RemoteAction(icon, title, title, pendingIntent)
    }
}
