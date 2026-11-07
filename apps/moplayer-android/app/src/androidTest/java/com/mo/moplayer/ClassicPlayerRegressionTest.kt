@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package com.mo.moplayer

import android.content.Intent
import android.os.SystemClock
import androidx.lifecycle.Lifecycle
import androidx.media3.common.Format
import androidx.media3.common.TrackGroup
import androidx.media3.common.Tracks
import androidx.media3.common.C
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mo.moplayer.ui.player.PlayerBroadcastBridge
import com.mo.moplayer.ui.player.PlayerActivity
import com.mo.moplayer.ui.player.engine.trackOverrideAt
import com.mo.moplayer.ui.player.engine.VlcPlayerEngine
import com.mo.moplayer.ui.player.engine.PlayerEngine
import com.mo.moplayer.ui.player.engine.ExoPlayerEngine
import com.mo.moplayer.ui.player.engine.PlayerEngineManager
import com.mo.moplayer.util.PlayerPreferences
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder

/** Real framework lifecycle and the dual-engine player with generated local PCM; no provider/source data. */
@RunWith(AndroidJUnit4::class)
class ClassicPlayerRegressionTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val context = instrumentation.targetContext

    @Test fun disablingSubtitlesDisablesTextSelection() {
        var engine: ExoPlayerEngine? = null
        instrumentation.runOnMainSync {
            engine = ExoPlayerEngine(context, false)
            try {
                engine!!.setSubtitleTrack(-1)
                val field = ExoPlayerEngine::class.java.getDeclaredField("trackSelector").apply { isAccessible = true }
                val selector = field.get(engine) as DefaultTrackSelector
                assertTrue(selector.parameters.disabledTrackTypes.contains(C.TRACK_TYPE_TEXT))
            } finally { engine!!.release() }
        }
    }

    @Test fun stoppedVodResumesButExplicitlyPausedVodStaysPaused() = withPlayer { scenario, player ->
        awaitPlaying(player)
        scenario.moveToState(Lifecycle.State.CREATED)
        awaitPaused(player)
        scenario.moveToState(Lifecycle.State.RESUMED)
        awaitPlaying(player)
        instrumentation.runOnMainSync { player.pause(); assertFalse(player.playWhenReady) }
        awaitPaused(player)
        scenario.moveToState(Lifecycle.State.CREATED)
        scenario.moveToState(Lifecycle.State.RESUMED)
        SystemClock.sleep(200)
        instrumentation.runOnMainSync {
            assertFalse("Explicit pause intent was lost", player.playWhenReady)
            assertFalse(player.isPlaying)
        }
    }

    @Test fun visiblePausedActivityDoesNotInterruptVod() = withPlayer { scenario, player ->
        awaitPlaying(player)
        scenario.moveToState(Lifecycle.State.STARTED)
        instrumentation.runOnMainSync { assertTrue("Visible activity paused its video", player.isPlaying) }
        scenario.moveToState(Lifecycle.State.RESUMED)
    }

    @Test fun flattenedTrackIndicesResolveInsideEachMediaGroup() {
        val audio = TrackGroup("audio", Format.Builder().setSampleMimeType("audio/mp4a-latm").setLanguage("en").build(),
            Format.Builder().setSampleMimeType("audio/mp4a-latm").setLanguage("ar").build())
        val alternate = TrackGroup("other", Format.Builder().setSampleMimeType("audio/ac3").build())
        val text = TrackGroup("text", Format.Builder().setSampleMimeType("text/vtt").build())
        fun group(g: TrackGroup) = Tracks.Group(g, false, IntArray(g.length) { C.FORMAT_HANDLED }, BooleanArray(g.length))
        val tracks = Tracks(listOf(group(audio), group(text), group(alternate)))
        val second = requireNotNull(trackOverrideAt(tracks, C.TRACK_TYPE_AUDIO, 1))
        assertSame(audio, second.mediaTrackGroup)
        assertEquals(listOf(1), second.trackIndices)
        assertSame(alternate, trackOverrideAt(tracks, C.TRACK_TYPE_AUDIO, 2)!!.mediaTrackGroup)
        assertSame(text, trackOverrideAt(tracks, C.TRACK_TYPE_TEXT, 0)!!.mediaTrackGroup)
        assertNull(trackOverrideAt(tracks, C.TRACK_TYPE_AUDIO, 3))
        assertNull(trackOverrideAt(tracks, C.TRACK_TYPE_TEXT, -1))
    }

    @Test fun vlcViewCanBeAttachedRepeatedlyAndReleasedTwice() {
        instrumentation.runOnMainSync {
            val engine = VlcPlayerEngine(context, false)
            try {
                val view = org.videolan.libvlc.util.VLCVideoLayout(context)
                repeat(3) { engine.attachView(view) }
                engine.detachView()
                engine.attachView(org.videolan.libvlc.util.VLCVideoLayout(context))
            } finally { engine.release(); engine.release() }
        }
    }

    @Test fun realExoFailureFallsBackToVlcAndReportsErrorWithoutCrashing() {
        val failed = CountDownLatch(1)
        var manager: PlayerEngineManager? = null
        try {
            instrumentation.runOnMainSync {
                manager = PlayerEngineManager(context, false).apply {
                    addCallback(object : PlayerEngine.Callback {
                        override fun onPlaybackError(error: PlayerEngine.PlaybackError) { failed.countDown() }
                    })
                    val missing = File(context.cacheDir, "nonexistent-classic-fixture.wav")
                    play(android.net.Uri.fromFile(missing).toString(), "Missing local fixture", 0)
                }
            }
            assertTrue("Fallback error was not delivered", failed.await(20, TimeUnit.SECONDS))
            instrumentation.runOnMainSync { assertTrue(manager!!.isFallbackActive) }
        } finally { instrumentation.runOnMainSync { manager?.release() } }
    }

    @Test fun pipExitRestoresBothControlBars() = withPlayer { scenario, player ->
        awaitPlaying(player)
        scenario.onActivity { activity ->
            val config = android.content.res.Configuration(activity.resources.configuration)
            activity.onPictureInPictureModeChanged(true, config)
            assertEquals(android.view.View.GONE, activity.findViewById<android.view.View>(R.id.topControlsBar).visibility)
            activity.onPictureInPictureModeChanged(false, config)
            assertEquals(android.view.View.VISIBLE, activity.findViewById<android.view.View>(R.id.topControlsBar).visibility)
            assertEquals(android.view.View.VISIBLE, activity.findViewById<android.view.View>(R.id.bottomControlsBar).visibility)
        }
    }

    @Test fun legacyVlcResumesAfterStopAndPreservesManualPause() = withPlayer(PlayerPreferences.PLAYER_INTERNAL_VLC) { scenario, player ->
        awaitPlaying(player)
        scenario.moveToState(Lifecycle.State.CREATED)
        awaitPaused(player)
        scenario.moveToState(Lifecycle.State.RESUMED)
        awaitPlaying(player)
        instrumentation.runOnMainSync { player.pause() }
        awaitPaused(player)
        scenario.moveToState(Lifecycle.State.CREATED)
        scenario.moveToState(Lifecycle.State.RESUMED)
        SystemClock.sleep(200)
        instrumentation.runOnMainSync { assertFalse(player.isPlaying) }
    }

    @Test fun visiblePausedLegacyVlcKeepsPlaying() = withPlayer(PlayerPreferences.PLAYER_INTERNAL_VLC) { scenario, player ->
        awaitPlaying(player)
        scenario.moveToState(Lifecycle.State.STARTED)
        instrumentation.runOnMainSync { assertTrue(player.isPlaying) }
        scenario.moveToState(Lifecycle.State.RESUMED)
    }

    @Test fun privateServiceBroadcastStillControlsPlayback() = withPlayer { _, player ->
        awaitPlaying(player)
        context.sendBroadcast(Intent(PlayerBroadcastBridge.ACTION_MEDIA_CONTROL).setPackage(BuildConfig.APPLICATION_ID)
            .putExtra(PlayerBroadcastBridge.EXTRA_CONTROL_TYPE, PlayerBroadcastBridge.CONTROL_TYPE_PLAY_PAUSE))
        val deadline = SystemClock.elapsedRealtime() + 5_000
        var playing = true
        while (playing && SystemClock.elapsedRealtime() < deadline) {
            instrumentation.runOnMainSync { playing = player.isPlaying }
            if (playing) SystemClock.sleep(50)
        }
        assertFalse("Private receiver did not deliver the media command", playing)
    }

    @Test fun explicitPlayAndPauseCommandsAreIdempotent() = withPlayer { _, player ->
        awaitPlaying(player)
        fun send(type: Int) = context.sendBroadcast(Intent(PlayerBroadcastBridge.ACTION_MEDIA_CONTROL)
            .setPackage(BuildConfig.APPLICATION_ID).putExtra(PlayerBroadcastBridge.EXTRA_CONTROL_TYPE, type))
        repeat(2) { send(PlayerBroadcastBridge.CONTROL_TYPE_PAUSE) }
        awaitPaused(player)
        SystemClock.sleep(200)
        instrumentation.runOnMainSync { assertFalse(player.isPlaying) }
        repeat(2) { send(PlayerBroadcastBridge.CONTROL_TYPE_PLAY) }
        awaitPlaying(player)
        SystemClock.sleep(200)
        instrumentation.runOnMainSync { assertTrue(player.isPlaying) }
    }

    @Test fun explicitPauseWhileStoppedCancelsAutomaticResume() = withPlayer { scenario, player ->
        awaitPlaying(player)
        scenario.moveToState(Lifecycle.State.CREATED)
        awaitPaused(player)
        context.sendBroadcast(Intent(PlayerBroadcastBridge.ACTION_MEDIA_CONTROL)
            .setPackage(BuildConfig.APPLICATION_ID)
            .putExtra(PlayerBroadcastBridge.EXTRA_CONTROL_TYPE, PlayerBroadcastBridge.CONTROL_TYPE_PAUSE))
        instrumentation.waitForIdleSync()
        scenario.moveToState(Lifecycle.State.RESUMED)
        SystemClock.sleep(250)
        instrumentation.runOnMainSync { assertFalse("Explicit background pause was ignored", player.playWhenReady) }
        awaitPaused(player)
    }

    @Test fun mergedManifestHasTvLauncherAndOptionalHardwareAndFlavorUpdater() {
        val pm = context.packageManager
        val launcher = pm.resolveActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER)
            .setPackage(BuildConfig.APPLICATION_ID), 0)
        assertNotNull(launcher)
        val info = pm.getPackageInfo(BuildConfig.APPLICATION_ID,
            android.content.pm.PackageManager.GET_CONFIGURATIONS or android.content.pm.PackageManager.GET_PERMISSIONS)
        for (name in listOf("android.software.leanback", "android.hardware.touchscreen")) {
            val feature = info.reqFeatures!!.first { it.name == name }
            assertEquals(0, feature.flags and android.content.pm.FeatureInfo.FLAG_REQUIRED)
        }
        assertEquals(BuildConfig.SIDELOAD_UPDATES, info.requestedPermissions.orEmpty().contains("android.permission.REQUEST_INSTALL_PACKAGES"))
    }

    @Test fun anotherPlayerIntentReplacesTheCurrentContent() = withPlayer { scenario, player ->
        awaitPlaying(player)
        scenario.onActivity { activity ->
            context.startActivity(Intent(activity.intent).apply {
                putExtra(PlayerActivity.EXTRA_TITLE, "Second requested item")
                putExtra(PlayerActivity.EXTRA_CONTENT_ID, "classic-qa-second-item")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            })
        }
        val deadline = SystemClock.elapsedRealtime() + 10_000
        var title = ""
        while (title != "Second requested item" && SystemClock.elapsedRealtime() < deadline) {
            scenario.onActivity { title = it.findViewById<android.widget.TextView>(R.id.tvTitle).text.toString() }
            if (title != "Second requested item") SystemClock.sleep(100)
        }
        assertEquals("Second requested item", title)
    }

    private fun awaitPaused(player: RunningPlayer) {
        // LibVLC pause() returns before its native state transition is observable on some TVs.
        val deadline = SystemClock.elapsedRealtime() + 5_000
        do {
            var playing = true
            instrumentation.runOnMainSync { playing = player.isPlaying }
            if (!playing) return
            SystemClock.sleep(50)
        } while (SystemClock.elapsedRealtime() < deadline)
        fail("Native playback did not pause")
    }

    private fun awaitPlaying(player: RunningPlayer) {
        val deadline = SystemClock.elapsedRealtime() + 8_000
        do {
            var playing = false
            instrumentation.runOnMainSync { playing = player.isPlaying }
            if (playing) return
            SystemClock.sleep(50)
        } while (SystemClock.elapsedRealtime() < deadline)
        fail("Media3 did not play/resume the local PCM fixture")
    }

    private class RunningPlayer(private val value: Any, private val pauseAction: () -> Unit) {
        val playWhenReady: Boolean get() = when (value) {
            is PlayerEngineManager -> value.playWhenReady
            else -> (value as org.videolan.libvlc.MediaPlayer).isPlaying
        }
        val isPlaying: Boolean get() = when (value) {
            is PlayerEngineManager -> value.isPlaying
            else -> (value as org.videolan.libvlc.MediaPlayer).isPlaying
        }
        fun pause() = pauseAction()

    }

    private fun withPlayer(
        playerType: Int = PlayerPreferences.PLAYER_INTERNAL_EXOPLAYER,
        block: (ActivityScenario<PlayerActivity>, RunningPlayer) -> Unit,
    ) {
        val preferences = PlayerPreferences(context)
        val previous = runBlocking { preferences.getPlayerType() }
        val audio = File.createTempFile("classic-qa", ".wav", context.cacheDir)
        val bytes = 16_000 * 2 * 60
        val wav = ByteBuffer.allocate(44 + bytes).order(ByteOrder.LITTLE_ENDIAN)
        wav.put("RIFF".toByteArray()).putInt(36 + bytes).put("WAVEfmt ".toByteArray())
        wav.putInt(16).putShort(1).putShort(1).putInt(16_000).putInt(32_000)
        wav.putShort(2).putShort(16).put("data".toByteArray()).putInt(bytes)
        audio.writeBytes(wav.array())
        runBlocking { preferences.setPlayerType(playerType) }
        val intent = Intent(context, PlayerActivity::class.java)
            .putExtra(PlayerActivity.EXTRA_STREAM_URL, android.net.Uri.fromFile(audio).toString())
            .putExtra(PlayerActivity.EXTRA_TITLE, "Local player regression fixture")
            .putExtra(PlayerActivity.EXTRA_TYPE, "MOVIE")
            .putExtra(PlayerActivity.EXTRA_CONTENT_ID, "classic-qa-local-audio")
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        try {
            ActivityScenario.launch<PlayerActivity>(intent).use { scenario ->
                var player: Any? = null
                var activeActivity: PlayerActivity? = null
                val deadline = SystemClock.elapsedRealtime() + 30_000
                while (player == null && SystemClock.elapsedRealtime() < deadline) {
                    scenario.onActivity { activity ->
                        activeActivity = activity
                        val field = PlayerActivity::class.java.getDeclaredField(if (playerType == PlayerPreferences.PLAYER_INTERNAL_EXOPLAYER) "engineManager" else "mediaPlayer").apply { isAccessible = true }
                        player = field.get(activity)
                    }
                    if (player == null) SystemClock.sleep(50)
                }
                block(scenario, RunningPlayer(requireNotNull(player) { "Player activity did not initialize" }) {
                    val activity = requireNotNull(activeActivity)
                    activity.dispatchKeyEvent(android.view.KeyEvent(android.view.KeyEvent.ACTION_DOWN, android.view.KeyEvent.KEYCODE_MEDIA_PAUSE))
                    activity.dispatchKeyEvent(android.view.KeyEvent(android.view.KeyEvent.ACTION_UP, android.view.KeyEvent.KEYCODE_MEDIA_PAUSE))
                })
            }
        } finally {
            runBlocking { preferences.setPlayerType(previous) }
            audio.delete()
        }
    }
}
