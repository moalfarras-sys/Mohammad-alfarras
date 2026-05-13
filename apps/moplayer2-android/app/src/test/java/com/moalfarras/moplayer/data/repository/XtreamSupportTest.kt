package com.moalfarras.moplayer.data.repository

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class XtreamSupportTest {
    @Test
    fun extractsXtreamCredentialsFromM3uUrl() {
        val credentials = XtreamSupport.extractCredentialsFromPlaylistUrl(
            "http://example.com:8080/get.php?username=user123&password=pass456&type=m3u_plus&output=ts",
        )

        assertNotNull(credentials)
        assertEquals("http://example.com:8080/", credentials?.baseUrl)
        assertEquals("user123", credentials?.username)
        assertEquals("pass456", credentials?.password)
    }

    @Test
    fun parsesUnixSecondsTimestamp() {
        val timestamp = XtreamSupport.parseTimestamp("1714646400")
        assertEquals(1714646400000L, timestamp)
    }

    @Test
    fun sanitizesSensitiveQueryParameters() {
        val message = XtreamSupport.sanitizeError(
            "HTTP 404 for player_api.php?username=user123&password=pass456",
            "example.com",
        )

        assertTrue(message.contains("username=***"))
        assertTrue(message.contains("password=***"))
        assertTrue(!message.contains("user123"))
        assertTrue(!message.contains("pass456"))
    }

    @Test
    fun picksLiveExtensionFromProviderHintsBeforeFallback() {
        assertEquals(
            "m3u8",
            pickLiveExtension(
                allowedFormats = listOf("ts", "m3u8"),
                playlistUrl = "http://example.com/get.php?username=u&password=p&output=m3u8",
            ),
        )
        assertEquals(
            "mpd",
            pickLiveExtension(
                allowedFormats = listOf("ts"),
                streamExtension = "dash",
            ),
        )
        assertEquals(
            "flv",
            pickLiveExtension(
                allowedFormats = listOf("ts"),
                directSource = "https://cdn.example/live/channel.flv?token=1",
            ),
        )
        assertEquals("m3u8", pickLiveExtension(allowedFormats = emptyList()))
    }
}
