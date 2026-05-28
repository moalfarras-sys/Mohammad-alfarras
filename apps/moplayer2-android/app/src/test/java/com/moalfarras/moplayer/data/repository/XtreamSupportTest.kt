package com.moalfarras.moplayer.data.repository

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

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
}
