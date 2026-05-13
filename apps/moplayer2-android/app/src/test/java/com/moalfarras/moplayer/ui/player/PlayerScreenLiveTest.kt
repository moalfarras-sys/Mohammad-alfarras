package com.moalfarras.moplayer.ui.player

import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
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
        assertEquals(MimeTypes.APPLICATION_M3U8, inferMimeType("https://example.com/get.php?username=u&password=p&output=m3u8"))
        assertEquals(MimeTypes.APPLICATION_MPD, inferMimeType("https://example.com/manifest.mpd"))
        assertEquals(MimeTypes.APPLICATION_MPD, inferMimeType("https://example.com/stream?id=1&format=dash"))
        assertEquals(MimeTypes.APPLICATION_SS, inferMimeType("https://example.com/Manifest.ism"))
        assertEquals(MimeTypes.VIDEO_MP2T, inferMimeType("https://example.com/channel.ts"))
        assertEquals(MimeTypes.VIDEO_MP2T, inferMimeType("https://example.com/live/1?output=ts"))
        assertEquals(MimeTypes.VIDEO_MP4, inferMimeType("https://example.com/movie.mp4"))
        assertEquals(MimeTypes.VIDEO_MATROSKA, inferMimeType("https://example.com/movie.mkv"))
        assertNull(inferMimeType("rtsp://example.com/live/1"))
    }

    @Test
    fun parseStreamRequestNormalizesHeaders() {
        val request = parseStreamRequest(
            "https://example.com/live/1.m3u8|user-agent=Custom%20UA&http-referrer=https%3A%2F%2Fsite.test&cookie=a%3Db",
        )

        assertEquals("https://example.com/live/1.m3u8", request.uri)
        assertEquals(MimeTypes.APPLICATION_M3U8, request.mimeType)
        assertEquals("Custom UA", request.headers["User-Agent"])
        assertEquals("https://site.test", request.headers["Referer"])
        assertEquals("a=b", request.headers["Cookie"])
    }

    @Test
    fun malformedLiveErrorsCanFallbackToLibVlc() {
        assertTrue(shouldFallbackToLibVlc(PlaybackException.ERROR_CODE_DECODER_INIT_FAILED, null))
    }

    @Test
    fun liveFailureMessageIsReadableArabic() {
        val message = livePlaybackFailureMessage()

        assertTrue(message.contains("البث المباشر"))
        assertTrue(message.contains("إعادة المحاولة"))
    }
}
