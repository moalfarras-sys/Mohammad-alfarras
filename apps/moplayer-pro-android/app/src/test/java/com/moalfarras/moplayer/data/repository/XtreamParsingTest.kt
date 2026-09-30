package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.data.network.NetworkModule
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class XtreamParsingTest {
    private val json = NetworkModule.json
    private val credentials = XtreamCredentials("http://panel.example:8080/", "user", "pass")

    @Test
    fun liveStreamsAcceptNumbersAsStringsNullsAndBrokenRows() {
        val array = json.parseToJsonElement(
            """
            [
              {"num": "3", "name": "News", "stream_id": "101", "category_id": 5, "epg_channel_id": "news.qa",
               "tv_archive": 0, "tv_archive_duration": "0", "stream_icon": null, "added": "1700000000"},
              null,
              [],
              {"num": 4, "name": "Sport", "stream_id": 102, "category_id": "5", "tv_archive": "1", "tv_archive_duration": 7},
              {"name": "No id"}
            ]
            """.trimIndent(),
        ).jsonArray

        val items = XtreamSupport.parseLiveStreams(
            serverId = 1,
            credentials = credentials,
            allowedFormats = listOf("m3u8", "ts"),
            categories = mapOf("5" to "News & Sport"),
            array = array,
        )

        assertEquals(2, items.size)
        val news = items[0]
        assertEquals("101", news.id)
        assertEquals(3, news.serverOrder)
        assertEquals("News & Sport", news.categoryName)
        assertEquals("", news.catchup)
        assertEquals("", news.posterUrl)
        assertEquals(1_700_000_000_000L, news.addedAt)
        assertEquals("http://panel.example:8080/live/user/pass/101.ts", news.streamUrl)
        assertEquals("ts", news.containerExtension)
        assertEquals("xtream:7", items[1].catchup)
    }

    @Test
    fun tvArchiveFlagsMapToCatchup() {
        assertEquals("", xtreamCatchup("0", 7))
        assertEquals("", xtreamCatchup("", 7))
        assertEquals("", xtreamCatchup("false", 7))
        assertEquals("", xtreamCatchup("1", 0))
        assertEquals("xtream:3", xtreamCatchup("1", 3))
        assertEquals("xtream:5", xtreamCatchup("true", 5))
    }

    @Test
    fun liveFormatPrefersTsAndHonoursPanelAndPlaylistChoices() {
        assertEquals("ts", pickLiveExtension(listOf("m3u8", "ts", "rtmp")))
        assertEquals("ts", pickLiveExtension(emptyList()))
        assertEquals("m3u8", pickLiveExtension(listOf("m3u8")))
        assertEquals("m3u8", pickLiveExtension(listOf("ts"), playlistUrl = "http://p/get.php?username=u&password=p&output=hls"))
        assertEquals("m3u8", pickLiveExtension(listOf("ts"), directSource = "https://cdn.example/live/index.m3u8"))
    }

    @Test
    fun alternateLiveUrlSwapsContainerOnlyForXtreamLiveUrls() {
        assertEquals(
            "http://panel.example:8080/live/user/pass/101.m3u8",
            alternateLiveFormatUrl("http://panel.example:8080/live/user/pass/101.ts"),
        )
        assertEquals(
            "http://panel.example:8080/live/user/pass/101.ts",
            alternateLiveFormatUrl("http://panel.example:8080/live/user/pass/101.m3u8"),
        )
        assertNull(alternateLiveFormatUrl("http://panel.example:8080/movie/user/pass/9.mp4"))
        assertNull(alternateLiveFormatUrl("https://cdn.example/stream/playlist.m3u8"))
    }

    @Test
    fun credentialsWithReservedCharactersAreEscapedInStreamUrls() {
        val tricky = XtreamCredentials("http://panel.example/", "user#1", "p/ss?word")
        val item = XtreamSupport.parseVodStream(
            element = json.parseToJsonElement("""{"stream_id": 9, "name": "Movie", "container_extension": "mkv"}"""),
            index = 0,
            serverId = 1,
            credentials = tricky,
            categories = emptyMap(),
        )
        assertEquals("http://panel.example/movie/user%231/p%2Fss%3Fword/9.mkv", item!!.streamUrl)
        assertEquals("plain", "plain".asPathSegment())
    }

    @Test
    fun accountRejectionsAreTyped() {
        fun kindOf(body: String): SyncErrorKind? = try {
            XtreamSupport.requireAuthorizedAccount(json.parseToJsonElement(body).jsonObject, "panel.example")
            null
        } catch (error: SyncException) {
            error.kind
        }

        assertEquals(SyncErrorKind.INVALID_CREDENTIALS, kindOf("""{"user_info": {"auth": 0}}"""))
        assertEquals(SyncErrorKind.ACCOUNT_EXPIRED, kindOf("""{"user_info": {"auth": 1, "status": "Expired"}}"""))
        assertEquals(SyncErrorKind.ACCOUNT_DISABLED, kindOf("""{"user_info": {"auth": 1, "status": "Banned"}}"""))
        assertEquals(SyncErrorKind.NOT_IPTV_API, kindOf("""{"error": "nope"}"""))
        assertEquals(
            SyncErrorKind.TOO_MANY_CONNECTIONS,
            kindOf("""{"user_info": {"auth": 0, "message": "Max connections reached"}}"""),
        )
        assertNull(kindOf("""{"user_info": {"auth": 1, "status": "Active"}}"""))
    }

    @Test
    fun shortEpgDecodesBase64TitlesAndDescriptions() {
        val root = json.parseToJsonElement(
            """
            {"epg_listings": [
              {"title": "QWwgSmF6ZWVyYSBOZXdz", "description": "2KfZhNij2K7YqNin2LEg2KfZhNi52KfZhNmF2YrYqQ==",
               "start_timestamp": "1790000000", "stop_timestamp": "1790003600"},
              {"title": "2YbYtNix2Kkg2KfZhNij2K7YqNin2LE=", "description": "",
               "start_timestamp": 1790003600, "stop_timestamp": 1790007200}
            ]}
            """.trimIndent(),
        ).jsonObject

        val programs = XtreamSupport.parseShortEpg(serverId = 1, fallbackChannelKey = "101", root = root)

        assertEquals(2, programs.size)
        assertEquals("Al Jazeera News", programs[0].title)
        assertEquals("الأخبار العالمية", programs[0].description)
        assertEquals("نشرة الأخبار", programs[1].title)
        assertEquals("101", programs[0].channelKey)
        assertEquals(1_790_000_000_000L, programs[0].startAt)
        assertEquals("", programs[0].rawJson)
    }

    @Test
    fun shortEpgKeepsPlainTextTitles() {
        val root = json.parseToJsonElement(
            """
            {"epg_listings": [
              {"title": "News", "start_timestamp": "1790000000", "stop_timestamp": "1790003600"},
              {"title": "نشرة الأخبار", "start_timestamp": "1790003600", "stop_timestamp": "1790007200"}
            ]}
            """.trimIndent(),
        ).jsonObject

        val programs = XtreamSupport.parseShortEpg(serverId = 1, fallbackChannelKey = "101", root = root)

        assertEquals(listOf("News", "نشرة الأخبار"), programs.map { it.title })
    }

    @Test
    fun base64TextDecodingIsStrict() {
        assertEquals("Al Jazeera News", decodeBase64Text("QWwgSmF6ZWVyYSBOZXdz"))
        assertNull(decodeBase64Text("News"))
        assertNull(decodeBase64Text("Kids"))
        assertNull(decodeBase64Text("Sport Center"))
        assertNull(decodeBase64Text("QWw=Sm"))
    }

    @Test
    fun seriesEpisodesHandleListOfListsFlatListAndEmpty() {
        val series = MediaItem(id = "100", serverId = 3, type = ContentType.SERIES, categoryId = "20", title = "Series", streamUrl = "", seriesId = "100")

        fun episodesOf(episodes: String) = XtreamSupport.enrichSeries(
            json = json,
            serverId = 3,
            credentials = credentials,
            current = series,
            root = json.parseToJsonElement("""{"episodes": $episodes}""").jsonObject,
        ).third

        val nested = episodesOf("""[[{"id": "1", "episode_num": 1}], [{"id": "2", "season": 1, "episode_num": 1}, null]]""")
        assertEquals(listOf("1", "2"), nested.map { it.id })
        assertEquals(listOf(0, 1), nested.map { it.seasonNumber })

        val flat = episodesOf("""[{"id": "3", "season": 2, "episode_num": 4}]""")
        assertEquals(2, flat.single().seasonNumber)
        assertEquals("http://panel.example:8080/series/user/pass/3.mp4", flat.single().streamUrl)

        assertTrue(episodesOf("[]").isEmpty())
    }

    @Test
    fun categoriesSkipNonObjects() {
        val categories = XtreamSupport.parseCategories(
            serverId = 1,
            type = ContentType.MOVIE,
            array = json.parseToJsonElement("""[{"category_id": 7, "category_name": "Action"}, null, "x"]""").jsonArray,
        )
        assertEquals(1, categories.size)
        assertEquals("7", categories.single().id)
    }

    @Test
    fun vodStreamsParseTolerantFields() {
        val item = XtreamSupport.parseVodStream(
            element = json.parseToJsonElement(
                """{"num": 1.0, "stream_id": "55", "name": "Film", "rating": 7.4, "duration_secs": "5400",
                   "cast": ["A", "B"], "backdrop_path": ["", "//img.example/b.jpg"], "category_id": null}""",
            ),
            index = 9,
            serverId = 1,
            credentials = credentials,
            categories = emptyMap(),
        ) ?: return fail("movie was dropped")
        assertEquals(1, item.serverOrder)
        assertEquals("7.4", item.rating)
        assertEquals(5400L, item.durationSecs)
        assertEquals("A, B", item.cast)
        assertEquals("https://img.example/b.jpg", item.backdropUrl)
        assertEquals("", item.categoryId)
    }
}
