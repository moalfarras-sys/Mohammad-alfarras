package com.moalfarras.moplayer.data.repository

import org.junit.Assert.assertEquals
import org.junit.Test

class ProviderTextTest {
    @Test
    fun zeroAndMissingRatingsAreHidden() {
        assertEquals("", "0".cleanRating())
        assertEquals("", "0.0".cleanRating())
        assertEquals("", " ".cleanRating())
        assertEquals("", "-1".cleanRating())
    }

    @Test
    fun ratingsKeepOneDecimal() {
        assertEquals("6.8", "6.838".cleanRating())
        assertEquals("7", "7.0".cleanRating())
        assertEquals("8.5", " 8.5 ".cleanRating())
        assertEquals("7.5/10", "7.5/10".cleanRating())
    }

    @Test
    fun escapedLineBreaksBecomeRealBreaks() {
        assertEquals(
            "A cooking competition.\n\nNew season.",
            """A cooking competition.\\r\\n\\r\\nNew season.""".cleanPlot(),
        )
        assertEquals("Line one\nLine two", """Line one\nLine two""".cleanPlot())
        assertEquals("Ends here.", """Ends here.\r\n\r\n\r\n""".cleanPlot())
        assertEquals("Tab here", """Tab\there""".cleanPlot())
    }

    @Test
    fun plainPlotsAreOnlyTrimmed() {
        assertEquals("A plain plot.", "  A plain plot. ".cleanPlot())
        assertEquals("Line one\n\nLine two", "Line one\n\nLine two".cleanPlot())
    }

    @Test
    fun streamUrlsPickUpTheCurrentPassword() {
        val base = "http://panel.example.com:8080/"
        assertEquals(
            "http://panel.example.com:8080/live/demo/newpass/42.ts",
            refreshXtreamStreamCredentials("http://panel.example.com:8080/live/demo/oldpass/42.ts", base, "demo", "newpass"),
        )
        assertEquals(
            "http://panel.example.com:8080/series/demo/newpass/7.mkv",
            refreshXtreamStreamCredentials("http://panel.example.com:8080/series/demo/oldpass/7.mkv", base.trimEnd('/'), "demo", "newpass"),
        )
        assertEquals(
            "http://panel.example.com:8080/movie/demo/p%2Fw/9.mp4",
            refreshXtreamStreamCredentials("http://panel.example.com:8080/movie/demo/old/9.mp4", base, "demo", "p/w"),
        )
    }

    @Test
    fun otherStreamUrlsAreLeftAlone() {
        val base = "http://panel.example.com:8080/"
        val direct = "https://cdn.example.com/live/demo/old/42.ts"
        assertEquals(direct, refreshXtreamStreamCredentials(direct, base, "demo", "new"))
        val hls = "http://panel.example.com:8080/hls/demo/42/index.m3u8"
        assertEquals(hls, refreshXtreamStreamCredentials(hls, base, "demo", "new"))
        val m3u = "http://panel.example.com:8080/live/demo/old/42.ts"
        assertEquals(m3u, refreshXtreamStreamCredentials(m3u, "", "demo", "new"))
    }
}
