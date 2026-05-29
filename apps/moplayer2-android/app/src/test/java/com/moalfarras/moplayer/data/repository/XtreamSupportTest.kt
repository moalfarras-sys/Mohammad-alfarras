package com.moalfarras.moplayer.data.repository

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import com.moalfarras.moplayer.data.network.NetworkModule
import com.moalfarras.moplayer.domain.model.ContentType
import kotlinx.serialization.json.jsonArray

class XtreamSupportTest {
    @Test
    fun extractsCredentialsFromM3uPlusUrl() {
        val credentials = XtreamSupport.extractCredentialsFromPlaylistUrl(
            "http://example.test:80/get.php?username=user&password=pass&type=m3u_plus&output=ts",
        )

        assertNotNull(credentials)
        assertEquals("http://example.test:80/", credentials!!.baseUrl)
        assertEquals("user", credentials.username)
        assertEquals("pass", credentials.password)
    }

    @Test
    fun extractsCredentialsFromEscapedPlaylistUrl() {
        val credentials = XtreamSupport.extractCredentialsFromPlaylistUrl(
            "\"http://example.test:80/get.php?username=user^&password=pass&amp;type=m3u_plus&amp;output=ts\"",
        )

        assertNotNull(credentials)
        assertEquals("http://example.test:80/", credentials!!.baseUrl)
        assertEquals("user", credentials.username)
        assertEquals("pass", credentials.password)
        assertEquals(
            "http://example.test:80/get.php?username=user&password=pass&type=m3u_plus&output=ts",
            credentials.playlistUrl,
        )
    }

    @Test
    fun flagsPartialXtreamPlaylistSoItIsNotSavedAsM3u() {
        val partialUrl = "http://example.test:80/get.php?username=user^"

        assertTrue(XtreamSupport.looksLikeXtreamPlaylistUrl(partialUrl))
        assertEquals(null, XtreamSupport.extractCredentialsFromPlaylistUrl(partialUrl))
    }

    @Test
    fun doesNotFlagPlainM3uUrlAsXtream() {
        assertFalse(XtreamSupport.looksLikeXtreamPlaylistUrl("https://example.test/channels/list.m3u"))
    }

    @Test
    fun cleansNullAndProtocolRelativePosterUrls() {
        val json = NetworkModule.json
        val vodItems = XtreamSupport.parseVodStreams(
            json = json,
            serverId = 3,
            credentials = XtreamCredentials("http://iptv.example/", "user", "pass"),
            categories = mapOf("10" to "Movies"),
            array = json.parseToJsonElement(
                """
                [
                  {"stream_id": 1, "name": "Broken art", "stream_icon": null, "cover": "N/A", "category_id": "10"},
                  {"stream_id": 2, "name": "Good art", "stream_icon": "//cdn.example/poster.jpg", "category_id": "10"}
                ]
                """.trimIndent(),
            ).jsonArray,
        )

        assertEquals(ContentType.MOVIE, vodItems.first().type)
        assertEquals("", vodItems.first().posterUrl)
        assertEquals("https://cdn.example/poster.jpg", vodItems[1].posterUrl)
    }
}
