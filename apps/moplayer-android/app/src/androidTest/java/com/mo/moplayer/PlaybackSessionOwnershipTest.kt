package com.mo.moplayer

import android.content.Context
import android.content.Intent
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.os.SystemClock
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mo.moplayer.service.PlaybackService
import com.mo.moplayer.ui.player.PlayerBroadcastBridge
import com.mo.moplayer.ui.settings.SettingsActivity
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** A real stale system controller must not acquire a new playback owner's token. */
@RunWith(AndroidJUnit4::class)
class PlaybackSessionOwnershipTest {
    @Test fun previousSystemControllerCannotPauseTheNextPlaybackOwner() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val actions = CopyOnWriteArrayList<String>()
        val paused = CountDownLatch(1)
        val bridge = PlayerBroadcastBridge(context, object : PlayerBroadcastBridge.PlayerControlListener {
            override fun onPlayRequested() { actions += "play" }
            override fun onPauseRequested() { actions += "pause"; paused.countDown() }
            override fun onPlayPauseRequested() { actions += "toggle" }
            override fun onStopRequested() { actions += "stop" }
            override fun onSeekRequested(forward: Boolean, amountMs: Long) {}
            override fun onSeekToRequested(positionMs: Long) {}
            override fun onNextChannelRequested() {}
            override fun onPreviousChannelRequested() {}
            override fun onShowControlsRequested() {}
        }, isCurrentCommand = { it == 202L })
        instrumentation.uiAutomation.adoptShellPermissionIdentity("android.permission.MEDIA_CONTENT_CONTROL")
        try {
            ActivityScenario.launch<SettingsActivity>(Intent(context, SettingsActivity::class.java)
                .putExtra("open_panel", "ABOUT")).use {
                instrumentation.runOnMainSync { bridge.register() }
                val manager = context.getSystemService(Context.MEDIA_SESSION_SERVICE) as MediaSessionManager
                fun controller(title: String): MediaController {
                    val deadline = SystemClock.elapsedRealtime() + 10_000
                    while (SystemClock.elapsedRealtime() < deadline) {
                        manager.getActiveSessions(null).firstOrNull { session ->
                            session.packageName == context.packageName &&
                                session.metadata?.getString(android.media.MediaMetadata.METADATA_KEY_TITLE) == title
                        }?.let { return it }
                        SystemClock.sleep(50)
                    }
                    error("Playback service did not publish $title")
                }
                PlaybackService.start(context, "Local QA owner 101", false, 101L)
                val previous = controller("Local QA owner 101")
                val notifications = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
                val oldStop = notifications.activeNotifications.first { it.id == 1 }.notification.actions[3].actionIntent
                PlaybackService.start(context, "Local QA owner 202", false, 202L)
                val current = controller("Local QA owner 202")
                previous.transportControls.pause()
                oldStop.send()
                PlaybackService.updateState(context, "Stale QA owner 101", false, true, 0L, -1L, 101L)
                assertFalse("A previous system controller paused the new owner", paused.await(400, TimeUnit.MILLISECONDS))
                instrumentation.waitForIdleSync()
                assertTrue("An old notification stopped the new owner", actions.isEmpty())
                assertEquals(current.sessionToken, controller("Local QA owner 202").sessionToken)
                current.transportControls.pause()
                assertTrue("Current system controller stopped working", paused.await(5, TimeUnit.SECONDS))
                instrumentation.waitForIdleSync()
                assertEquals(listOf("pause"), actions.toList())
            }
        } finally {
            PlaybackService.stop(context)
            instrumentation.runOnMainSync { bridge.unregister() }
            instrumentation.uiAutomation.dropShellPermissionIdentity()
        }
    }
}
