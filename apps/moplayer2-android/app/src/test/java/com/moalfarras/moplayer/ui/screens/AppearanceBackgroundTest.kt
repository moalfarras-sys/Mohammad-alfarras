package com.moalfarras.moplayer.ui.screens

import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.ThemePreset
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AppearanceBackgroundTest {
    @Test
    fun autoModeKeepsContentBackdropUnlessCityThemeSelected() {
        val contentUrl = "https://cdn.example.com/poster.jpg"

        assertEquals(
            contentUrl,
            resolveHomeBackdropUrl(AppSettings(), contentUrl, epochDay = 10),
        )

        val cityTheme = AppSettings(themePreset = ThemePreset.CITY)
        assertNotEquals(contentUrl, resolveHomeBackdropUrl(cityTheme, contentUrl, epochDay = 10))
    }

    @Test
    fun customModeRejectsBlankOrUnsafeUrls() {
        assertNull(
            resolveHomeBackdropUrl(
                AppSettings(backgroundMode = BackgroundMode.CUSTOM_URL, customBackgroundUrl = "file:///tmp/bg.jpg"),
                contentBackdropUrl = "https://cdn.example.com/fallback.jpg",
            ),
        )

        assertEquals(
            "https://cdn.example.com/custom.jpg",
            resolveHomeBackdropUrl(
                AppSettings(backgroundMode = BackgroundMode.CUSTOM_URL, customBackgroundUrl = " https://cdn.example.com/custom.jpg "),
                contentBackdropUrl = null,
            ),
        )
    }

    @Test
    fun cityRotationIsStableForTheSameDay() {
        assertEquals(cityBackgroundUrlForDay(42), cityBackgroundUrlForDay(42))
        assertNotEquals(cityBackgroundUrlForDay(42), cityBackgroundUrlForDay(43))
    }

    @Test
    fun validatesOnlyHttpBackdrops() {
        assertTrue(isValidBackdropUrl("https://images.example.com/city.jpg"))
        assertTrue(isValidBackdropUrl("http://images.example.com/city.jpg"))
        assertFalse(isValidBackdropUrl("content://images/city.jpg"))
        assertFalse(isValidBackdropUrl("https:///missing-host.jpg"))
    }
}
