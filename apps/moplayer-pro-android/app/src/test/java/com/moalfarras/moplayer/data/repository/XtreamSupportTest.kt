package com.moalfarras.moplayer.data.repository

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import com.moalfarras.moplayer.data.network.NetworkModule
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject

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
    fun extractsCredentialsFromPlayerApiUrl() {
        val credentials = XtreamSupport.extractCredentialsFromPlaylistUrl(
            "http://example.test:80/player_api.php?username=user&password=pass",
        )

        assertNotNull(credentials)
        assertEquals("http://example.test:80/", credentials!!.baseUrl)
        assertEquals("user", credentials.username)
        assertEquals("pass", credentials.password)
    }

    @Test
    fun normalizesXtreamEndpointsToServerBase() {
        assertEquals(
            "http://example.test:80/",
            XtreamSupport.normalizeServerBaseUrl("example.test:80/get.php?username=user&password=pass"),
        )
        assertEquals(
            "https://example.test/panel/",
            XtreamSupport.normalizeServerBaseUrl("https://example.test/panel/player_api.php?username=user&password=pass"),
        )
    }

    @Test
    fun activationSourceNormalizesNestedServerEndpoint() {
        val credentials = XtreamSupport.extractActivationSource(
            "https://moalfarras.space/activate?server=http%3A%2F%2Fexample.test%3A80%2Fget.php%3Ftype%3Dm3u_plus&username=user&password=pass",
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

    @Test
    fun vodDetailsEnrichDurationAndArtwork() {
        val json = NetworkModule.json
        val current = MediaItem(
            id = "900",
            serverId = 3,
            type = ContentType.MOVIE,
            categoryId = "10",
            title = "Movie",
            streamUrl = "http://cdn.example/movie.mp4",
        )
        val root = json.parseToJsonElement(
            """
            {
              "info": {
                "movie_image": "https://cdn.example/poster.jpg",
                "plot": "Full plot",
                "rating": "7.8",
                "duration": "01:32:05"
              }
            }
            """.trimIndent(),
        ).jsonObject

        val (enriched, details) = XtreamSupport.enrichVod(json, 3, current, root)

        assertEquals("https://cdn.example/poster.jpg", enriched.posterUrl)
        assertEquals("Full plot", enriched.description)
        assertEquals("7.8", enriched.rating)
        assertEquals(5525, enriched.durationSecs)
        assertEquals("01:32:05", details.duration)
    }

    @Test
    fun seriesEpisodesPreferDirectSourceAndNormalizeExtension() {
        val json = NetworkModule.json
        val current = MediaItem(
            id = "100",
            serverId = 3,
            type = ContentType.SERIES,
            categoryId = "20",
            title = "Series",
            streamUrl = "",
            seriesId = "100",
        )
        val root = json.parseToJsonElement(
            """
            {
              "episodes": {
                "1": [
                  {
                    "id": "555",
                    "title": "Pilot",
                    "season": 1,
                    "episode_num": 1,
                    "container_extension": "matroska",
                    "direct_source": "http://cdn.example/video/555.mkv"
                  }
                ]
              }
            }
            """.trimIndent(),
        ).jsonObject

        val (_, _, episodes) = XtreamSupport.enrichSeries(
            json = json,
            serverId = 3,
            credentials = XtreamCredentials("http://iptv.example/", "user", "pass"),
            current = current,
            root = root,
        )

        assertEquals("http://cdn.example/video/555.mkv", episodes.first().streamUrl)
        assertEquals("mkv", episodes.first().containerExtension)
    }
}
