package com.moalfarras.moplayer.ui.player

import com.moalfarras.moplayer.data.network.NetworkModule
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PlaybackHttpClientTest {
    @Test
    fun liveStreamsAreNeverCutByAWholeCallTimeout() {
        // A live MPEG-TS body never ends; any callTimeout would cut it every N minutes.
        assertEquals(0, NetworkModule.playbackOkHttp.callTimeoutMillis)
        // A dead socket still fails fast, well before the API client's 45 s.
        assertEquals(20_000, NetworkModule.playbackOkHttp.readTimeoutMillis)
        // API, sync and playlist calls keep their backstop.
        assertTrue(NetworkModule.okHttp.callTimeoutMillis > 0)
    }
}
