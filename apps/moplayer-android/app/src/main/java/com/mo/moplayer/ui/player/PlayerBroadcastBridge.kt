package com.mo.moplayer.ui.player

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
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
    private val listener: PlayerControlListener,
    private val isCurrentCommand: (Long) -> Boolean = { true },
) {

    companion object {
        const val ACTION_MEDIA_CONTROL = "com.mo.moplayer.MEDIA_CONTROL"
        const val EXTRA_CONTROL_TYPE = "control_type"
        const val EXTRA_CONTROL_GENERATION = "control_generation"
        const val EXTRA_SYSTEM_PAUSE = "system_pause"
        const val EXTRA_SEEK_POSITION_MS = "seek_position_ms"

        const val CONTROL_TYPE_PLAY_PAUSE = 0
        const val CONTROL_TYPE_STOP = 1
        const val CONTROL_TYPE_REWIND = 2
        const val CONTROL_TYPE_FORWARD = 3
        const val CONTROL_TYPE_NEXT = 4
        const val CONTROL_TYPE_PREV = 5
        const val CONTROL_TYPE_SHOW_CONTROLS = 6
        const val CONTROL_TYPE_SEEK_TO = 7
        const val CONTROL_TYPE_PLAY = 8
        const val CONTROL_TYPE_PAUSE = 9
    }

    interface PlayerControlListener {
        fun onPlayRequested()
        fun onPauseRequested()
        fun onSystemPauseRequested() = onPauseRequested()
        fun onPlayPauseRequested()
        fun onStopRequested()
        fun onSeekRequested(forward: Boolean, amountMs: Long)
        fun onSeekToRequested(positionMs: Long)
        fun onNextChannelRequested()
        fun onPreviousChannelRequested()
        fun onShowControlsRequested()
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context?, intent: Intent?) {
            if (intent?.action != ACTION_MEDIA_CONTROL) return
            val token = intent.getLongExtra(EXTRA_CONTROL_GENERATION, 0L)
            fun command(block: () -> Unit) {
                scope.launch { if (token == 0L || isCurrentCommand(token)) block() }
            }
            when (intent.getIntExtra(EXTRA_CONTROL_TYPE, -1)) {
                CONTROL_TYPE_PLAY -> command { listener.onPlayRequested() }
                CONTROL_TYPE_PAUSE -> command {
                    if (intent.getBooleanExtra(EXTRA_SYSTEM_PAUSE, false)) listener.onSystemPauseRequested()
                    else listener.onPauseRequested()
                }
                CONTROL_TYPE_PLAY_PAUSE -> command { listener.onPlayPauseRequested() }
                CONTROL_TYPE_STOP -> command { listener.onStopRequested() }
                CONTROL_TYPE_REWIND -> command { listener.onSeekRequested(false, 30_000L) }
                CONTROL_TYPE_FORWARD -> command { listener.onSeekRequested(true, 30_000L) }
                CONTROL_TYPE_NEXT -> command { listener.onNextChannelRequested() }
                CONTROL_TYPE_PREV -> command { listener.onPreviousChannelRequested() }
                CONTROL_TYPE_SHOW_CONTROLS -> command { listener.onShowControlsRequested() }
                CONTROL_TYPE_SEEK_TO -> command {
                    listener.onSeekToRequested(intent.getLongExtra(EXTRA_SEEK_POSITION_MS, 0L))
                }
            }
        }
    }

    fun register() {
        androidx.core.content.ContextCompat.registerReceiver(
            context, receiver, IntentFilter(ACTION_MEDIA_CONTROL),
            androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED,
        )
    }

    fun unregister() {
        runCatching { context.unregisterReceiver(receiver) }
        scope.cancel()
    }
}
