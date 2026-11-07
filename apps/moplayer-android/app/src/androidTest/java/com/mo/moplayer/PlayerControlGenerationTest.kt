package com.mo.moplayer

import android.content.Intent
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mo.moplayer.ui.player.PlayerBroadcastBridge
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class PlayerControlGenerationTest {
    @Test fun oldSessionCommandCannotAffectTheCurrentOwner() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val actions = CopyOnWriteArrayList<String>()
        val received = CountDownLatch(1)
        val bridge = PlayerBroadcastBridge(context, object : PlayerBroadcastBridge.PlayerControlListener {
            override fun onPlayRequested() { actions += "play"; received.countDown() }
            override fun onPauseRequested() { actions += "pause" }
            override fun onPlayPauseRequested() { actions += "toggle" }
            override fun onStopRequested() { actions += "stop" }
            override fun onSeekRequested(forward: Boolean, amountMs: Long) {}
            override fun onSeekToRequested(positionMs: Long) {}
            override fun onNextChannelRequested() {}
            override fun onPreviousChannelRequested() {}
            override fun onShowControlsRequested() {}
        }, isCurrentCommand = { it == 2L })
        instrumentation.runOnMainSync { bridge.register() }
        try {
            fun send(type: Int, token: Long) = context.sendBroadcast(Intent(PlayerBroadcastBridge.ACTION_MEDIA_CONTROL)
                .setPackage(BuildConfig.APPLICATION_ID)
                .putExtra(PlayerBroadcastBridge.EXTRA_CONTROL_TYPE, type)
                .putExtra(PlayerBroadcastBridge.EXTRA_CONTROL_GENERATION, token))
            send(PlayerBroadcastBridge.CONTROL_TYPE_PAUSE, 1L)
            send(PlayerBroadcastBridge.CONTROL_TYPE_PLAY, 2L)
            assertTrue(received.await(5, TimeUnit.SECONDS))
            instrumentation.waitForIdleSync()
            assertEquals(listOf("play"), actions.toList())
        } finally { instrumentation.runOnMainSync { bridge.unregister() } }
    }
}
