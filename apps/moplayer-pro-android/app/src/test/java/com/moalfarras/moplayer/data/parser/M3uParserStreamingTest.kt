package com.moalfarras.moplayer.data.parser

import com.moalfarras.moplayer.domain.model.ContentType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.security.MessageDigest

class M3uParserStreamingTest {
    private val parser = M3uParser()

    /** The id formula of earlier versions; favorites and resume positions are keyed by it. */
    private fun legacyId(raw: String): String =
        MessageDigest.getInstance("SHA-1").digest(raw.toByteArray()).joinToString("") { "%02x".format(it) }

    @Test
    fun keepsCommasInTitlesButKeepsLegacyIds() {
        val url = "http://cdn.example/vod/crazy.mp4"
        val parsed = parser.parse(
            1,
            """
            #EXTM3U
            #EXTINF:-1 tvg-id="" tvg-name="Crazy, Stupid, Love" group-title="Movies",Crazy, Stupid, Love (2011)
            $url
            """.trimIndent(),
        )

        val movie = parsed.media.single()
        assertEquals(ContentType.MOVIE, movie.type)
        assertEquals("Crazy, Stupid, Love (2011)", movie.title)
        assertEquals(legacyId(":Love (2011):$url"), movie.id)
        assertEquals(legacyId("MOVIE:Movies"), movie.categoryId)
    }

    @Test
    fun apostrophesInQuotedAttributesSurvive() {
        val parsed = parser.parse(
            1,
            """
            #EXTM3U
            #EXTINF:-1 tvg-logo="http://img.example/kid's.png" group-title="Children's Movies",Up
            http://cdn.example/vod/up.mkv
            #EXTINF:-1 tvg-name='Single Quoted' group-title='News',Single Quoted
            http://cdn.example/live/news.ts
            """.trimIndent(),
        )

        assertTrue(parsed.categories.any { it.name == "Children's Movies" && it.type == ContentType.MOVIE })
        assertEquals("http://img.example/kid's.png", parsed.media.first().posterUrl)
        assertTrue(parsed.categories.any { it.name == "News" && it.type == ContentType.LIVE })
    }

    @Test
    fun handlesBomCrlfAndVlcOptions() {
        val text = "\uFEFF#EXTM3U\r\n" +
            "#EXTINF:-1 tvg-id=\"a\" group-title=\"News\",Channel A\r\n" +
            "#EXTVLCOPT:http-user-agent=Mozilla/5.0 (X11, Linux)\r\n" +
            "#EXTVLCOPT:http-referrer=https://ref.example/\r\n" +
            "http://cdn.example/live/a.ts\r\n"

        val parsed = parser.parse(1, text)

        val channel = parsed.media.single()
        assertEquals("Channel A", channel.title)
        assertTrue(channel.streamUrl.startsWith("http://cdn.example/live/a.ts|"))
        assertTrue(channel.streamUrl.contains("User-Agent=Mozilla%2F5.0%20%28X11%2C%20Linux%29"))
        assertTrue(channel.streamUrl.contains("Referer=https%3A%2F%2Fref.example%2F"))
    }

    @Test
    fun readsGuideUrlsFromTheHeader() {
        val parsed = parser.parse(
            1,
            """
            #EXTM3U url-tvg="https://epg.example/guide.xml.gz,https://epg2.example/g.xml" x-tvg-url="ftp://ignored.example/g.xml"
            #EXTINF:-1,Channel
            http://cdn.example/live/1.ts
            """.trimIndent(),
        )

        assertEquals(listOf("https://epg.example/guide.xml.gz", "https://epg2.example/g.xml"), parsed.epgUrls)
    }

    @Test
    fun infersLiveVersusVodFromStrongSignals() {
        val parsed = parser.parse(
            1,
            """
            #EXTM3U
            #EXTINF:-1 tvg-id="bein.movies1" group-title="AR| beIN Movies",beIN Movies 1 HD
            http://cdn.example/stream/bein1.ts
            #EXTINF:-1 tvg-id="movies.tv" group-title="Movies",Movie Channel
            http://cdn.example/hls/movies/index.m3u8
            #EXTINF:-1 group-title="IT| Serie A",Serie A Match
            http://cdn.example/stream/seriea.m3u8
            #EXTINF:-1 group-title="24/7 Series",Friends 24/7
            http://cdn.example/stream/friends247.ts
            #EXTINF:-1 group-title="Series",Friends E05
            http://cdn.example/files/friends-e05.mp4
            #EXTINF:5400 group-title="Movies",Inception
            http://cdn.example/hls/inception.m3u8
            #EXTINF:-1 tvg-type="movie" group-title="Mixed",Explicit Movie
            http://cdn.example/stream/explicit.m3u8
            #EXTINF:-1 group-title="Sports",Race Replay
            rtmp://cdn.example/live/race
            """.trimIndent(),
        )

        fun typeOf(title: String) = parsed.media.first { it.title == title || it.streamUrl.contains(title) }.type

        assertEquals(ContentType.LIVE, typeOf("beIN Movies 1 HD"))
        assertEquals(ContentType.LIVE, typeOf("Movie Channel"))
        assertEquals(ContentType.LIVE, typeOf("Serie A Match"))
        assertEquals(ContentType.LIVE, typeOf("Friends 24/7"))
        assertEquals(ContentType.MOVIE, typeOf("friends-e05"))
        assertEquals(ContentType.MOVIE, typeOf("Inception"))
        assertEquals(ContentType.MOVIE, typeOf("Explicit Movie"))
        assertEquals(ContentType.LIVE, typeOf("Race Replay"))
        assertTrue(parsed.media.none { it.type == ContentType.SERIES && it.streamUrl.isNotBlank() })
        assertEquals(5400L, parsed.media.first { it.title == "Inception" }.durationSecs)
    }

    @Test
    fun seriesGroupEntriesWithoutEpisodeNumbersStayPlayable() {
        val parsed = parser.parse(
            1,
            """
            #EXTM3U
            #EXTINF:-1 group-title="Series",Documentary Special
            http://cdn.example/files/special.mp4
            """.trimIndent(),
        )

        val item = parsed.media.single()
        assertEquals(ContentType.MOVIE, item.type)
        assertTrue(item.streamUrl.isNotBlank())
    }

    @Test
    fun duplicateChannelsAreWrittenOnceInTheirFirstGroup() {
        val parsed = parser.parse(
            1,
            """
            #EXTM3U
            #EXTINF:-1 tvg-id="news" group-title="Top",News
            http://cdn.example/live/news.ts
            #EXTINF:-1 tvg-id="news" group-title="News",News
            http://cdn.example/live/news.ts
            """.trimIndent(),
        )

        val channel = parsed.media.single()
        assertEquals(parsed.categories.first { it.name == "Top" }.id, channel.categoryId)
    }

    @Test
    fun disabledCatchupFlagsAreBlank() {
        val parsed = parser.parse(
            1,
            """
            #EXTM3U
            #EXTINF:-1 tvg-id="a" catchup="0" group-title="News",A
            http://cdn.example/live/a.ts
            #EXTINF:-1 tvg-id="b" timeshift="false" group-title="News",B
            http://cdn.example/live/b.ts
            #EXTINF:-1 tvg-id="c" catchup="append" catchup-days="3" group-title="News",C
            http://cdn.example/live/c.ts
            """.trimIndent(),
        )

        assertEquals(listOf("", "", "append"), parsed.media.map { it.catchup })
    }

    @Test
    fun sessionStreamingMatchesTheCollectedParse() {
        val text = buildString {
            appendLine("#EXTM3U")
            repeat(3_000) { index ->
                appendLine("""#EXTINF:-1 tvg-id="ch$index" group-title="Group ${index % 7}",Channel $index""")
                appendLine("http://cdn.example/live/$index.ts")
            }
            appendLine("""#EXTINF:-1 group-title="Series",Show S01E02""")
            appendLine("http://cdn.example/series/show-s01e02.mkv")
        }

        val session = parser.newSession(5)
        val streamed = text.lineSequence().flatMap { line -> session.accept(line).orEmpty() }.toList()
        val collected = parser.parse(5, text)

        assertEquals(collected.media, streamed)
        assertEquals(collected.categories, session.categories())
        assertEquals(3_002, session.itemCount)
    }
}
