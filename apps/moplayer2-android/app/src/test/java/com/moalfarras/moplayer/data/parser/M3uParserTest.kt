package com.moalfarras.moplayer.data.parser

import com.moalfarras.moplayer.domain.model.ContentType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class M3uParserTest {
    private val parser = M3uParser()

    @Test
    fun parsesM3uPlusAttributesAndEpisodePatterns() {
        val playlist = """
            #EXTM3U
            #EXTINF:-1 tvg-id="news.qa" tvg-name="News HD" tvg-logo="https://img.example/news.png" group-title="News" catchup="default",News HD
            http://example.test/live/1.ts
            #EXTINF:-1 tvg-name="Show S02E03" tvg-logo="https://img.example/show.png" group-title="Series",Show S02E03
            http://example.test/series/show-s02e03.mp4
            #EXTINF:-1 tvg-name="Drama 1x04" group-title="Series",Drama 1x04
            http://example.test/series/drama-1x04.mp4
            #EXTINF:-1 tvg-name="Movie One" group-title="Movies",Movie One
            http://example.test/movie/10.mp4
        """.trimIndent()

        val parsed = parser.parse(serverId = 7, text = playlist)

        val live = parsed.media.first { it.title == "News HD" }
        assertEquals(ContentType.LIVE, live.type)
        assertEquals("news.qa", live.tvgId)
        assertEquals("default", live.catchup)
        assertEquals(0, live.addedAt)
        assertTrue(live.addedAtUnknown)
        assertEquals(0, live.serverOrder)

        val episodes = parsed.media.filter { it.type == ContentType.EPISODE }
        assertEquals(2, episodes.size)
        assertTrue(episodes.any { it.seasonNumber == 2 && it.episodeNumber == 3 })
        assertTrue(episodes.any { it.seasonNumber == 1 && it.episodeNumber == 4 })

        assertTrue(parsed.media.any { it.type == ContentType.MOVIE && it.title == "Movie One" })
        assertTrue(parsed.categories.any { it.name == "News" && it.type == ContentType.LIVE })
    }

    @Test
    fun parsesArabicEpisodePatternsAndTimeshift() {
        val playlist = """
            #EXTM3U
            #EXTINF:-1 tvg-name="مسلسل النور الموسم 1 الحلقة 2" group-title="مسلسلات عربية" tvg-logo="https://img.example/noor.jpg" timeshift="3",مسلسل النور الموسم 1 الحلقة 2
            http://example.test/series/noor-s01e02.mp4
            #EXTINF:-1 tvg-name='قناة الأخبار' group-title='أخبار' tvg-id='arab.news' catchup-source='default',قناة الأخبار
            http://example.test/live/news.m3u8
        """.trimIndent()

        val parsed = parser.parse(serverId = 9, text = playlist)

        val episode = parsed.media.first { it.type == ContentType.EPISODE }
        assertEquals(1, episode.seasonNumber)
        assertEquals(2, episode.episodeNumber)
        assertEquals("3", episode.catchup)
        assertTrue(parsed.media.any { it.type == ContentType.SERIES && it.title.contains("النور") })

        val live = parsed.media.first { it.type == ContentType.LIVE }
        assertEquals("arab.news", live.tvgId)
        assertEquals("default", live.catchup)
    }

    @Test
    fun parsesLargePlaylistWithoutDroppingItems() {
        val playlist = buildString {
            appendLine("#EXTM3U")
            repeat(10_000) { index ->
                appendLine("""#EXTINF:-1 tvg-id="ch$index" group-title="News",News $index""")
                appendLine("http://example.test/live/$index.ts")
            }
        }

        val parsed = parser.parse(serverId = 11, text = playlist)

        assertEquals(10_000, parsed.media.size)
        assertEquals(ContentType.LIVE, parsed.media.last().type)
        assertEquals("ch9999", parsed.media.last().tvgId)
    }

    @Test
    fun preservesCommonIptvHeadersOnStreamUrl() {
        val playlist = """
            #EXTM3U
            #EXTINF:-1 tvg-name="Header Channel" group-title="Live" http-user-agent="Attr Agent" http-referrer="https://attr.example",Header Channel
            #EXTVLCOPT:http-user-agent=VLC Agent
            #KODIPROP:inputstream.adaptive.stream_headers=Referer=https://kodi.example&Origin=https://origin.example
            https://example.test/live/header.m3u8
            #EXTINF:-1 tvg-name="Cookie Channel" group-title="Live",Cookie Channel
            #EXTHTTP:{"Cookie":"session=abc","User-Agent":"Json Agent"}
            https://example.test/live/cookie.ts|Referer=https://inline.example
        """.trimIndent()

        val parsed = parser.parse(serverId = 12, text = playlist)

        val first = parsed.media.first { it.title == "Header Channel" }
        assertTrue(first.streamUrl.startsWith("https://example.test/live/header.m3u8|"))
        assertTrue(first.streamUrl.contains("User-Agent=VLC%20Agent"))
        assertTrue(first.streamUrl.contains("Referer=https%3A%2F%2Fkodi.example"))
        assertTrue(first.streamUrl.contains("Origin=https%3A%2F%2Forigin.example"))

        val second = parsed.media.first { it.title == "Cookie Channel" }
        assertTrue(second.streamUrl.contains("Referer=https%3A%2F%2Finline.example"))
        assertTrue(second.streamUrl.contains("Cookie=session%3Dabc"))
        assertTrue(second.streamUrl.contains("User-Agent=Json%20Agent"))
    }
}
