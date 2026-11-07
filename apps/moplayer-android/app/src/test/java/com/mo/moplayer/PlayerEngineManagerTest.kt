package com.mo.moplayer

import com.mo.moplayer.ui.player.engine.PlayerEngine
import com.mo.moplayer.ui.player.engine.PlayerEngineManager
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Assert.*
import org.junit.Test

class PlayerEngineManagerTest {
    private val exo = mockk<PlayerEngine>(relaxed = true)
    private val vlc = mockk<PlayerEngine>(relaxed = true)
    private val exoCallbacks = mutableListOf<PlayerEngine.Callback>()
    private val vlcCallbacks = mutableListOf<PlayerEngine.Callback>()
    private var exoCreated = 0
    private var vlcCreated = 0
    private val manager = PlayerEngineManager({ exoCreated++; exo }, { vlcCreated++; vlc })

    init {
        every { exo.supports(any()) } answers { firstArg<String>().startsWith("https:") }
        every { exo.addCallback(any()) } answers { exoCallbacks += firstArg<PlayerEngine.Callback>(); Unit }
        every { vlc.addCallback(any()) } answers { vlcCallbacks += firstArg<PlayerEngine.Callback>(); Unit }
    }

    @Test fun vlcOnlyDoesNotCreateAnUnusedExoPlayer() {
        manager.setPrimaryEngine(false)
        manager.play("udp://127.0.0.1:1234", "TV", 0)
        manager.release()
        assertEquals(0, exoCreated)
        assertEquals(1, vlcCreated)
        verify(exactly = 1) { vlc.release() }
    }

    @Test fun fallbackReleasesBothEnginesExactlyOnce() {
        manager.play("https://example.test/movie", "Movie", 100)
        exoCallbacks.last().onPlaybackError(PlayerEngine.PlaybackError.Codec())
        manager.release()
        manager.release()
        verify(exactly = 1) { exo.release() }
        verify(exactly = 1) { vlc.release() }
    }

    @Test fun fallbackKeepsTheCurrentVodPosition() {
        manager.play("https://example.test/movie", "Movie", 100)
        every { exo.currentPositionMs } returns 90_000
        exoCallbacks.last().onPlaybackError(PlayerEngine.PlaybackError.Codec())
        verify { vlc.play("https://example.test/movie", "Movie", 90_000) }
    }

    @Test fun switchingToAnotherEngineStopsAndDetachesTheOldOne() {
        manager.play("https://example.test/live", "TV", 0)
        manager.play("udp://127.0.0.1:1234", "TV 2", 0)
        verify(exactly = 2) { exo.stop() }
        verify { exo.detachView() }
    }

    @Test fun previousLoadCallbacksCannotSwitchTheNewLoadToVlc() {
        manager.play("https://example.test/one", "One", 0)
        val stale = exoCallbacks.last()
        manager.play("https://example.test/two", "Two", 0)
        stale.onPlaybackError(PlayerEngine.PlaybackError.Codec())
        assertFalse(manager.isFallbackActive)
        verify(exactly = 0) { vlc.play(any(), any(), any()) }
    }

    @Test fun stoppedSessionCannotRestartOnALateError() {
        manager.play("https://example.test/movie", "Movie", 0)
        val late = exoCallbacks.last()
        manager.stop()
        late.onPlaybackError(PlayerEngine.PlaybackError.Codec())
        verify(exactly = 0) { vlc.play(any(), any(), any()) }
    }
    @Test fun currentFallbackEventsStillReachTheUi() {
        val ui = mockk<PlayerEngine.Callback>(relaxed = true)
        manager.addCallback(ui)
        manager.play("https://example.test/one", "One", 0)
        exoCallbacks.last().onPlaybackStateChanged(3)
        exoCallbacks.last().onPlaybackError(PlayerEngine.PlaybackError.Codec())
        val failure = PlayerEngine.PlaybackError.Source()
        vlcCallbacks.last().onPlaybackError(failure)
        verify(exactly = 1) { ui.onPlaybackStateChanged(3) }
        verify(exactly = 1) { ui.onPlaybackError(failure) }
        val late = vlcCallbacks.last()
        manager.release()
        late.onPlaybackStateChanged(3)
        verify(exactly = 1) { ui.onPlaybackStateChanged(3) }
    }

    @Test fun liveFallbackStartsAtLiveEdgeRatherThanVodPosition() {
        val live = PlayerEngineManager({ exo }, { vlc }, isLive = true)
        live.play("https://example.test/live", "TV", 50_000)
        every { exo.currentPositionMs } returns 90_000
        exoCallbacks.last().onPlaybackError(PlayerEngine.PlaybackError.Codec())
        verify { vlc.play("https://example.test/live", "TV", 0) }
        live.release()
    }

    @Test fun surfaceChangeIsAnnouncedBeforeFallbackStarts() {
        var surfaceReady = false
        manager.addCallback(object : PlayerEngine.Callback {
            override fun onEngineChanged() { surfaceReady = manager.isUsingVlc }
        })
        every { vlc.play(any(), any(), any()) } answers { assertTrue(surfaceReady) }
        manager.play("https://example.test/movie", "Movie", 0)
        exoCallbacks.last().onPlaybackError(PlayerEngine.PlaybackError.Codec())
        verify(exactly = 1) { vlc.play(any(), any(), any()) }
    }

}
