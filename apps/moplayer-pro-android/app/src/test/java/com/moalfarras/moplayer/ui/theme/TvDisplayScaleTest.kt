package com.moalfarras.moplayer.ui.theme

import com.moalfarras.moplayer.domain.model.UiScale
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class TvDisplayScaleTest {
    @Test
    fun everyDensityOfA1080pPanelGetsTheSameGrid() {
        // The same panel reported at 240, 320 and 400 dpi: the px size is what counts.
        val grid = tvDisplayGrid(1920f, 1080f, 1f, UiScale.LARGE)!!
        assertEquals(2f, grid.density, 0.001f)
        assertEquals(1920f / grid.density, 960f, 0.5f)
    }

    @Test
    fun widerGridsDrawTheInterfaceSmaller() {
        val large = tvDisplayGrid(1920f, 1080f, 1f, UiScale.LARGE)!!.density
        val standard = tvDisplayGrid(1920f, 1080f, 1f, UiScale.STANDARD)!!.density
        val compact = tvDisplayGrid(1920f, 1080f, 1f, UiScale.COMPACT)!!.density
        assertEquals(1920f / (960f * 1.12f), standard, 0.001f)
        assertEquals(1920f / (960f * 1.25f), compact, 0.001f)
        assert(large > standard && standard > compact)
    }

    @Test
    fun resolutionDoesNotChangeTheLayout() {
        for ((w, h) in listOf(1280f to 720f, 1920f to 1080f, 3840f to 2160f)) {
            val grid = tvDisplayGrid(w, h, 1f, UiScale.STANDARD)!!
            assertEquals(960f * 1.12f, w / grid.density, 0.5f)
            assertEquals(540f * 1.12f, h / grid.density, 0.5f)
        }
    }

    @Test
    fun nonWidescreenPanelsFitTheShortSide() {
        val grid = tvDisplayGrid(1920f, 1200f, 1f, UiScale.LARGE)!!
        assertEquals(2f, grid.density, 0.001f)
    }

    @Test
    fun systemFontScaleIsKeptNearOne() {
        assertEquals(TV_MAX_FONT_SCALE, tvDisplayGrid(1920f, 1080f, 1.3f, UiScale.STANDARD)!!.fontScale, 0.0001f)
        assertEquals(TV_MIN_FONT_SCALE, tvDisplayGrid(1920f, 1080f, 0.8f, UiScale.STANDARD)!!.fontScale, 0.0001f)
        assertEquals(1.05f, tvDisplayGrid(1920f, 1080f, 1.05f, UiScale.STANDARD)!!.fontScale, 0.0001f)
    }

    @Test
    fun unknownScreenSizeKeepsTheSystemValues() {
        assertNull(tvDisplayGrid(0f, 1080f, 1f, UiScale.STANDARD))
        assertNull(tvDisplayGrid(1920f, 0f, 1f, UiScale.STANDARD))
    }
}
