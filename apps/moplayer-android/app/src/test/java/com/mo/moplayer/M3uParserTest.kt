package com.mo.moplayer

import com.mo.moplayer.data.parser.M3uParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayInputStream

class M3uParserTest {

    private val parser = M3uParser()

    @Test
    fun `parse extracts metadata and categories from extended m3u`() {
        val result = parser.parse(
            """
            #EXTM3U
            #EXTINF:-1 tvg-id="news.de" tvg-name="News HD" tvg-logo="https://img.example/news.png" group-title="News",News HD
            https://stream.example/live/news.m3u8
            #EXTINF:0 group-title="Movies" tvg-name="Film One",Film One
            https://stream.example/movie/film-one.mp4
            """.trimIndent()
        )

        assertEquals(2, result.items.size)
        assertEquals(setOf("News", "Movies"), result.categories)
        assertEquals("News HD", result.items[0].name)
        assertEquals("news.de", result.items[0].tvgId)
        assertEquals("https://img.example/news.png", result.items[0].logo)
        assertTrue(result.items[0].isLive)
        assertFalse(result.items[1].isLive)
    }

    @Test
    fun `parse skips malformed urls and duplicate streams without crashing`() {
        val result = parser.parse(
            """
            #EXTM3U
            #EXTINF:-1 group-title="Broken",Broken item
            not-a-url
            #EXTINF:-1 group-title="News",News One
            https://stream.example/live/news.ts
            #EXTINF:-1 group-title="News",News One Duplicate
            https://stream.example/live/news.ts
            random junk line
            """.trimIndent()
        )

        assertEquals(1, result.items.size)
        assertEquals("News One", result.items.first().name)
        assertEquals(2, result.skippedEntries)
        assertEquals(1, result.duplicateEntries)
    }

    @Test
    fun `parse accepts raw stream urls with fallback names`() {
        val result = parser.parse(
            """
            #EXTM3U
            https://stream.example/live/channel-one.ts
            udp://239.0.0.1:1234
            """.trimIndent()
        )

        assertEquals(2, result.items.size)
        assertEquals(setOf("Uncategorized"), result.categories)
        assertEquals("channel one", result.items[0].name)
        assertEquals("239.0.0.1:1234", result.items[1].name)
    }

    @Test
    fun `entity conversion keeps live and vod separated`() {
        val result = parser.parse(
            """
            #EXTM3U
            #EXTINF:-1 group-title="Live",Live Channel
            https://stream.example/live/channel.m3u8
            #EXTINF:0 group-title="VOD",Movie Item
            https://stream.example/vod/movie.mkv
            """.trimIndent()
        )
        val categoryMap = mapOf("Live" to "live", "VOD" to "vod")

        val channels = parser.toChannelEntities(result.items, serverId = 7L, categoryMap = categoryMap)
        val movies = parser.toMovieEntities(result.items, serverId = 7L, categoryMap = categoryMap)

        assertEquals(1, channels.size)
        assertEquals("Live Channel", channels.first().name)
        assertEquals(1, movies.size)
        assertEquals("Movie Item", movies.first().name)
    }

    @Test
    fun `parse treats movie and series urls as vod even with minus one duration`() {
        val result = parser.parse(
            """
            #EXTM3U
            #EXTINF:-1 group-title="Films",Movie Item
            http://provider.test/movie/user/pass/1200.mp4
            #EXTINF:-1 group-title="Series",Episode Item
            http://provider.test/series/user/pass/2200.mkv
            #EXTINF:-1 group-title="Live",Live Item
            http://provider.test/live/user/pass/55.ts
            """.trimIndent()
        )

        assertEquals(3, result.items.size)
        assertFalse(result.items[0].isLive)
        assertFalse(result.items[1].isLive)
        assertTrue(result.items[2].isLive)
    }

    @Test
    fun `parse input stream handles large playlists without dropping entries`() {
        val builder = StringBuilder("#EXTM3U\n")
        repeat(2_000) { index ->
            builder.append("#EXTINF:-1 group-title=\"Bulk\",Channel $index\n")
            builder.append("https://stream.example/live/$index.m3u8\n")
        }

        val result = parser.parse(ByteArrayInputStream(builder.toString().toByteArray()))

        assertEquals(2_000, result.items.size)
        assertEquals(setOf("Bulk"), result.categories)
        assertTrue(result.totalLines >= 4_001)
    }
}
