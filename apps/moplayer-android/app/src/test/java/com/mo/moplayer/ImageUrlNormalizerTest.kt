package com.mo.moplayer

import com.mo.moplayer.data.util.ImageUrlNormalizer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ImageUrlNormalizerTest {

    @Test
    fun normalize_validHttpUrl_routesThroughImageProxy() {
        val url = "http://example.com/logo.png"
        assertEquals(
            "https://moalfarras.space/api/app/image?url=http%3A%2F%2Fexample.com%2Flogo.png",
            ImageUrlNormalizer.normalize(url)
        )
    }

    @Test
    fun normalize_protocolRelativeUrl_prefixesHttps() {
        assertEquals(
            "https://moalfarras.space/api/app/image?url=https%3A%2F%2Fcdn.example.com%2Flogo.png",
            ImageUrlNormalizer.normalize("//cdn.example.com/logo.png")
        )
    }

    @Test
    fun normalize_tmdbPoster_usesSmallerPosterBeforeProxy() {
        assertEquals(
            "https://moalfarras.space/api/app/image?url=https%3A%2F%2Fimage.tmdb.org%2Ft%2Fp%2Fw500%2Fposter.jpg",
            ImageUrlNormalizer.normalize("https://image.tmdb.org/t/p/w600_and_h900_bestv2/poster.jpg")
        )
    }

    @Test
    fun normalize_ownProxyUrl_keepsUrl() {
        val url = "https://moalfarras.space/api/app/image?url=https%3A%2F%2Fexample.com%2Flogo.png"
        assertEquals(url, ImageUrlNormalizer.normalize(url))
    }

    @Test
    fun normalize_invalidOrEmpty_returnsNull() {
        assertNull(ImageUrlNormalizer.normalize(null))
        assertNull(ImageUrlNormalizer.normalize(""))
        assertNull(ImageUrlNormalizer.normalize("null"))
        assertNull(ImageUrlNormalizer.normalize("ftp://example.com/logo.png"))
    }
}
