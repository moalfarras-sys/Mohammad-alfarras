@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package com.moalfarras.moplayer.ui.player

import androidx.media3.common.C
import androidx.media3.common.Player
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.moalfarras.moplayer.core.Adaptive
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Uses a generated local PCM fixture: no provider credentials or external network dependency. */
@RunWith(AndroidJUnit4::class)
class Media3SessionInstrumentedTest {
    @Test
    fun realEngineReusesPlayerAcrossZapsAndResumesAfterStop() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val audio = File.createTempFile("player-qa", ".wav", context.cacheDir)
        val sampleBytes = 16_000 * 2 * 20
        val wave = ByteBuffer.allocate(44 + sampleBytes).order(ByteOrder.LITTLE_ENDIAN)
        wave.put("RIFF".toByteArray()).putInt(36 + sampleBytes).put("WAVEfmt ".toByteArray())
        wave.putInt(16).putShort(1).putShort(1).putInt(16_000).putInt(32_000)
        wave.putShort(2).putShort(16).put("data".toByteArray()).putInt(sampleBytes)
        audio.writeBytes(wave.array())
        var engine: Media3Engine? = null
        val errors = CopyOnWriteArrayList<String>()
        var ready = CountDownLatch(1)
        val callbacks = Media3Callbacks(
            onIsPlayingChanged = {},
            onPlaybackStateChanged = { if (it == Player.STATE_READY) ready.countDown() },
            onRenderedFirstFrame = {},
            onPlayerError = { errors.add(it.errorCodeName); ready.countDown() },
            onDurationChanged = {}, onTracksResolved = { _, _ -> },
            onAudioUnsupported = { errors.add("unsupported audio: $it") },
            onLoadFailure = { _, _, error -> errors.add(error.javaClass.simpleName) },
        )
        try {
            val policy = Adaptive.performancePolicy(AppSettings(), Adaptive.performanceInfo(context))
            instrumentation.runOnMainSync { engine = Media3Engine.create(context, false, policy) { callbacks } }
            val session = requireNotNull(engine)
            val originalPlayer = session.player
            repeat(3) { zap ->
                ready = CountDownLatch(1)
                instrumentation.runOnMainSync {
                    val item = MediaItem("qa-$zap", 1, ContentType.MOVIE, "qa", title = "QA", streamUrl = audio.toURI().toString())
                    session.load(context, StreamRequest(item.streamUrl, emptyMap(), "audio/wav"), item, false, policy, C.TIME_UNSET)
                    session.player.prepare()
                }
                assertTrue("player did not become ready after zap $zap", ready.await(20, TimeUnit.SECONDS))
                assertTrue("playback errors: $errors", errors.isEmpty())
                instrumentation.runOnMainSync {
                    assertSame(originalPlayer, session.player)
                    assertEquals(Player.STATE_READY, session.player.playbackState)
                    assertTrue(session.player.duration >= 19_000)
                }
            }
            ready = CountDownLatch(1)
            instrumentation.runOnMainSync {
                session.player.seekTo(5_000)
                session.player.stop()
                assertEquals(Player.STATE_IDLE, session.player.playbackState)
                session.player.prepare()
            }
            assertTrue("stopped player did not resume", ready.await(20, TimeUnit.SECONDS))
            instrumentation.runOnMainSync { assertTrue(session.player.currentPosition >= 5_000) }
            assertTrue("playback errors: $errors", errors.isEmpty())
        } finally {
            instrumentation.runOnMainSync { engine?.release() }
            audio.delete()
        }
    }
}
