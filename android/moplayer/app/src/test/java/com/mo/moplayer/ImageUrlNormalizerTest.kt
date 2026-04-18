package com.mo.moplayer

import com.mo.moplayer.data.util.ImageUrlNormalizer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ImageUrlNormalizerTest {

    @Test
    fun normalize_validHttpUrl_keepsUrl() {
        val url = "http://example.com/logo.png"
        assertEquals(url, ImageUrlNormalizer.normalize(url))
    }

    @Test
    fun normalize_protocolRelativeUrl_prefixesHttps() {
        assertEquals(
            "https://cdn.example.com/logo.png",
            ImageUrlNormalizer.normalize("//cdn.example.com/logo.png")
        )
    }

    @Test
    fun normalize_invalidOrEmpty_returnsNull() {
        assertNull(ImageUrlNormalizer.normalize(null))
        assertNull(ImageUrlNormalizer.normalize(""))
        assertNull(ImageUrlNormalizer.normalize("null"))
        assertNull(ImageUrlNormalizer.normalize("ftp://example.com/logo.png"))
    }
}
