package com.mo.moplayer

import android.net.Uri
import androidx.media3.common.Player
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mo.moplayer.ui.player.engine.PlayerEngine
import com.mo.moplayer.ui.player.engine.VlcPlayerEngine
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

@RunWith(AndroidJUnit4::class)
class ClassicVlcPlaybackTest {
    @Test fun realVlcSignalsReadyAndReplaysAfterStop() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val audio = File.createTempFile("classic-vlc-qa", ".wav", context.cacheDir)
        val bytes = 16_000 * 2 * 30
        val wav = ByteBuffer.allocate(44 + bytes).order(ByteOrder.LITTLE_ENDIAN)
        wav.put("RIFF".toByteArray()).putInt(36 + bytes).put("WAVEfmt ".toByteArray())
        wav.putInt(16).putShort(1).putShort(1).putInt(16_000).putInt(32_000)
        wav.putShort(2).putShort(16).put("data".toByteArray()).putInt(bytes)
        audio.writeBytes(wav.array())
        var engine: VlcPlayerEngine? = null
        var playing = CountDownLatch(1)
        val ready = AtomicInteger()
        val errors = java.util.concurrent.CopyOnWriteArrayList<String>()
        try {
            instrumentation.runOnMainSync {
                engine = VlcPlayerEngine(context, false).apply {
                    addCallback(object : PlayerEngine.Callback {
                        override fun onIsPlayingChanged(isPlaying: Boolean) { if (isPlaying) playing.countDown() }
                        override fun onPlaybackStateChanged(state: Int) { if (state == Player.STATE_READY) ready.incrementAndGet() }
                        override fun onPlaybackError(error: PlayerEngine.PlaybackError) { errors += error.message; playing.countDown() }
                    })
                }
            }
            repeat(2) { attempt ->
                playing = CountDownLatch(1)
                instrumentation.runOnMainSync { engine!!.play(Uri.fromFile(audio).toString(), "Local VLC fixture", 0) }
                assertTrue("VLC did not start", playing.await(20, TimeUnit.SECONDS))
                assertTrue("VLC errors: $errors", errors.isEmpty())
                instrumentation.runOnMainSync {
                    assertTrue(engine!!.isPlaying)
                    assertTrue("Playing never signalled READY to the UI", ready.get() > attempt)
                    engine!!.stop()
                }
            }
        } finally {
            instrumentation.runOnMainSync { engine?.release() }
            audio.delete()
        }
    }
}
