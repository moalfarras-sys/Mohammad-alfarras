package com.mo.moplayer.ui.player

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * In-app bridge from PlaybackService media controls to the active PlayerActivity.
 */
class PlayerBroadcastBridge(
    private val context: Context,
    private val listener: PlayerControlListener
) {

    companion object {
        const val ACTION_MEDIA_CONTROL = "com.mo.moplayer.MEDIA_CONTROL"
        const val EXTRA_CONTROL_TYPE = "control_type"

        const val CONTROL_TYPE_PLAY_PAUSE = 0
        const val CONTROL_TYPE_STOP = 1
        const val CONTROL_TYPE_REWIND = 2
        const val CONTROL_TYPE_FORWARD = 3
        const val CONTROL_TYPE_NEXT = 4
        const val CONTROL_TYPE_PREV = 5
        const val CONTROL_TYPE_SHOW_CONTROLS = 6
    }

    interface PlayerControlListener {
        fun onPlayPauseRequested()
        fun onStopRequested()
        fun onSeekRequested(forward: Boolean, amountMs: Long)
        fun onNextChannelRequested()
        fun onPreviousChannelRequested()
        fun onShowControlsRequested()
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context?, intent: Intent?) {
            if (intent?.action != ACTION_MEDIA_CONTROL) return
            when (intent.getIntExtra(EXTRA_CONTROL_TYPE, -1)) {
                CONTROL_TYPE_PLAY_PAUSE -> scope.launch { listener.onPlayPauseRequested() }
                CONTROL_TYPE_STOP -> scope.launch { listener.onStopRequested() }
                CONTROL_TYPE_REWIND -> scope.launch { listener.onSeekRequested(false, 10_000L) }
                CONTROL_TYPE_FORWARD -> scope.launch { listener.onSeekRequested(true, 10_000L) }
                CONTROL_TYPE_NEXT -> scope.launch { listener.onNextChannelRequested() }
                CONTROL_TYPE_PREV -> scope.launch { listener.onPreviousChannelRequested() }
                CONTROL_TYPE_SHOW_CONTROLS -> scope.launch { listener.onShowControlsRequested() }
            }
        }
    }

    fun register() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(receiver, IntentFilter(ACTION_MEDIA_CONTROL), Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            context.registerReceiver(receiver, IntentFilter(ACTION_MEDIA_CONTROL))
        }
    }

    fun unregister() {
        runCatching { context.unregisterReceiver(receiver) }
        scope.cancel()
    }
}
