package com.moalfarras.moplayer.ui.player

import androidx.media3.common.MimeTypes
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PlayerScreenLiveTest {
    @Test
    fun liveZapTargetWrapsAtEdges() {
        assertEquals(2, liveZapTargetIndex(currentIndex = 0, direction = -1, size = 3))
        assertEquals(0, liveZapTargetIndex(currentIndex = 2, direction = 1, size = 3))
        assertEquals(1, liveZapTargetIndex(currentIndex = 0, direction = 1, size = 3))
        assertNull(liveZapTargetIndex(currentIndex = -1, direction = 1, size = 3))
    }

    @Test
    fun inferMimeTypeCoversCommonIptvFormats() {
        assertEquals(MimeTypes.APPLICATION_M3U8, inferMimeType("https://example.com/live/index.m3u8?token=1"))
        assertEquals(MimeTypes.APPLICATION_MPD, inferMimeType("https://example.com/manifest.mpd"))
        assertEquals(MimeTypes.APPLICATION_SS, inferMimeType("https://example.com/Manifest.ism"))
        assertEquals(MimeTypes.VIDEO_MP2T, inferMimeType("https://example.com/channel.ts"))
        assertEquals(MimeTypes.VIDEO_MP4, inferMimeType("https://example.com/movie.mp4"))
        assertEquals(MimeTypes.VIDEO_MATROSKA, inferMimeType("https://example.com/movie.mkv"))
        assertNull(inferMimeType("rtsp://example.com/live/1"))
    }
}
