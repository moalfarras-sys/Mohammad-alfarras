package com.mo.moplayer

import com.mo.moplayer.data.util.ProviderSourceUrlParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ProviderSourceUrlParserTest {

    @Test
    fun `normalizes host only server url`() {
        assertEquals(
            "http://iptv.example.com:8080",
            ProviderSourceUrlParser.normalizeServerUrl("iptv.example.com:8080/")
        )
    }

    @Test
    fun `parses get php xtream url with encoded credentials`() {
        val parsed = ProviderSourceUrlParser.parseXtream(
            "https://iptv.example.com:8443/get.php?username=user%40mail.com&password=p%40ss&type=m3u_plus"
        )

        assertNotNull(parsed)
        assertEquals("https://iptv.example.com:8443", parsed!!.serverUrl)
        assertEquals("user@mail.com", parsed.username)
        assertEquals("p@ss", parsed.password)
        assertEquals(null, parsed.preferredOutputFormat)
    }

    @Test
    fun `parses preferred output format from get php url`() {
        val parsed = ProviderSourceUrlParser.parseXtream(
            "http://provider.test/get.php?username=demo&password=secret&type=m3u_plus&output=mpegts"
        )

        assertNotNull(parsed)
        assertEquals("mpegts", parsed!!.preferredOutputFormat)
    }

    @Test
    fun `parses player api xtream url`() {
        val parsed = ProviderSourceUrlParser.parseXtream(
            "http://provider.test/player_api.php?username=demo&password=secret"
        )

        assertNotNull(parsed)
        assertEquals("http://provider.test", parsed!!.serverUrl)
        assertEquals("demo", parsed.username)
        assertEquals("secret", parsed.password)
    }

    @Test
    fun `rejects incomplete xtream urls`() {
        assertNull(ProviderSourceUrlParser.parseXtream("http://provider.test/get.php?username=demo"))
        assertFalse(ProviderSourceUrlParser.isXtreamUrl("https://example.com/list.m3u8"))
        assertTrue(ProviderSourceUrlParser.isXtreamUrl("https://example.com/get.php?username=a&password=b"))
    }
}
