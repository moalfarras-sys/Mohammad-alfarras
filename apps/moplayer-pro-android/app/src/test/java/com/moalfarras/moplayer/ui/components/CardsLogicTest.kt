package com.moalfarras.moplayer.ui.components

import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.time.LocalDate
import java.time.ZoneId
import java.util.Locale

class CardsLogicTest {
    @Test
    fun qualityComesFromTheTitleWithWordBoundaries() {
        assertEquals("4K", qualityBadge("Planet Earth 4K"))
        assertEquals("FHD", qualityBadge("Sport 1 FHD"))
        assertEquals("FHD", qualityBadge("Movie 1080p"))
        assertEquals("HD", qualityBadge("MBC 1 HD"))
        assertEquals("", qualityBadge("Happy Birthday"))
        assertEquals("", qualityBadge("4Kids TV"))
        assertEquals("", qualityBadge("Channel 17205"))
    }

    @Test
    fun catchupOnlyForRealArchives() {
        assertFalse(hasCatchup(""))
        assertFalse(hasCatchup("0"))
        assertFalse(hasCatchup(" false "))
        assertTrue(hasCatchup("1"))
        assertTrue(hasCatchup("default"))
    }

    @Test
    fun tmdbPostersAreShrunkAndOtherUrlsStayDirect() {
        assertEquals("https://image.tmdb.org/t/p/w342/a.jpg", "https://image.tmdb.org/t/p/original/a.jpg".optimizedPosterUrl())
        val provider = "http://panel.example:8080/images/logo.png"
        assertEquals(provider, provider.optimizedPosterUrl())
        assertEquals(provider.optimizedPosterUrl(), provider.optimizedPosterUrl().optimizedPosterUrl())
    }

    @Test
    fun sizeRewritesOnlyTouchTmdbUrls() {
        // A provider CDN whose path happens to contain a TMDB size segment has no w342 variant.
        val providerOriginal = "http://panel.example/images/original/cover.jpg"
        assertEquals(providerOriginal, providerOriginal.optimizedPosterUrl())
        assertEquals("http://panel.example/w500/cover.jpg", "http://panel.example/w500/cover.jpg".optimizedPosterUrl())
        assertEquals(providerOriginal, providerOriginal.downsizedBackdropUrl())
        assertEquals("https://image.tmdb.org/t/p/w1280/b.jpg", "https://image.tmdb.org/t/p/original/b.jpg".downsizedBackdropUrl())
        // Unparseable provider URLs (spaces are common in M3U logos) pass through untouched.
        assertEquals("http://panel.example/logo name.png", " http://panel.example/logo name.png ".optimizedPosterUrl())
        assertFalse(isTmdbUrl("http://tmdb.org.evil.example/original/a.jpg"))
    }

    @Test
    fun proxyUrlOnlyForProviderImages() {
        val base = "https://moalfarras.space"
        val proxied = imageProxyUrl("http://panel.example/logo.png", base)
        assertEquals("https://moalfarras.space/api/app/image?url=http%3A%2F%2Fpanel.example%2Flogo.png", proxied)
        assertNull(imageProxyUrl("https://image.tmdb.org/t/p/w342/a.jpg", base))
        assertNull(imageProxyUrl("https://moalfarras.space/api/app/image?url=x", base))
        assertNull(imageProxyUrl("content://media/1", base))
    }

    @Test
    fun proxyRetryOnlyForBlocksRateLimitsServerAndNetworkErrors() {
        assertTrue(shouldRetryImageViaProxy(403, null))
        assertTrue(shouldRetryImageViaProxy(429, null))
        assertTrue(shouldRetryImageViaProxy(503, null))
        assertFalse(shouldRetryImageViaProxy(404, null))
        assertFalse(shouldRetryImageViaProxy(410, null))
        assertTrue(shouldRetryImageViaProxy(null, UnknownHostException("x")))
        assertTrue(shouldRetryImageViaProxy(null, SocketTimeoutException("x")))
        assertTrue(shouldRetryImageViaProxy(null, IOException("x")))
        assertFalse(shouldRetryImageViaProxy(null, IllegalStateException("decode")))
    }

    @Test
    fun monogramUsesMeaningfulInitials() {
        assertEquals("TS", monogramFor("Tears of Steel"))
        assertEquals("BB", monogramFor("Big Buck Bunny (MP4)"))
        assertEquals("S", monogramFor("Sintel (MP4)"))
        assertEquals("M1", monogramFor("AR: MBC 1 HD"))
        assertEquals("BS", monogramFor("[HD] beIN Sports"))
        assertEquals("ا", monogramFor("الجزيرة"))
        assertEquals("", monogramFor("  -- "))
    }

    @Test
    fun placeholderPaletteIsStableDarkAndVariesByTitle() {
        val a = placeholderPalette("Tears of Steel")
        assertEquals(a.toList(), placeholderPalette(" tears of steel ").toList())
        assertNotEquals(a.toList(), placeholderPalette("Sintel").toList())
        a.forEach { argb ->
            assertEquals(0xFF, argb ushr 24)
            val max = maxOf(argb shr 16 and 0xFF, argb shr 8 and 0xFF, argb and 0xFF)
            assertTrue("placeholder colors stay dark for white text", max <= 0x70)
        }
    }

    @Test
    fun hsvConversionMatchesPrimaryColors() {
        assertEquals(0xFFFF0000.toInt(), hsvToArgb(0f, 1f, 1f))
        assertEquals(0xFF00FF00.toInt(), hsvToArgb(120f, 1f, 1f))
        assertEquals(0xFF0000FF.toInt(), hsvToArgb(240f, 1f, 1f))
        assertEquals(0xFF808080.toInt(), hsvToArgb(33f, 0f, 0.5f))
    }

    @Test
    fun decodeSizeFollowsTheSlotAndRespectsThePolicyCap() {
        assertEquals(110, decodeDimensionPx(100f, 640))
        assertEquals(420, decodeDimensionPx(1000f, 420))
        assertEquals(1, decodeDimensionPx(0f, 640))
    }

    @Test
    fun addedLabelUsesTheAppLanguage() {
        val epoch = LocalDate.of(2026, 9, 29).atStartOfDay(ZoneId.systemDefault()).plusHours(12).toInstant().toEpochMilli()
        val item = MediaItem(id = "1", serverId = 1, type = ContentType.MOVIE, categoryId = "c", title = "T", streamUrl = "", addedAt = epoch)
        assertEquals("29 Sep", addedAtLabel(item, Locale.ENGLISH))
        assertTrue(addedAtLabel(item, Locale.forLanguageTag("ar"))!!.contains("سبتمبر"))
        assertNull(addedAtLabel(item.copy(addedAt = 0, lastModifiedAt = 0), Locale.ENGLISH))
    }
}
