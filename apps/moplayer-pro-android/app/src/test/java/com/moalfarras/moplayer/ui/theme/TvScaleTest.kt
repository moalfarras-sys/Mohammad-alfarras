package com.moalfarras.moplayer.ui.theme

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TvScaleTest {
    @Test
    fun standardTvCanvasKeepsTheTunedFactor() {
        // 1080p@xhdpi, 720p@tvdpi and the emulator all report 960x540dp.
        assertEquals(0.66f, tvScaleFactor(960, 540), 0.001f)
        assertEquals(1f, tvCanvasScale(960, 540), 0.001f)
    }

    @Test
    fun hdpiBoxesAreNormalizedToTheSamePhysicalSize() {
        // A 1080p panel at hdpi reports 1280x720dp: one canvas unit is 1.33dp there.
        assertEquals(1.333f, tvCanvasScale(1280, 720), 0.01f)
        assertEquals(0.88f, tvScaleFactor(1280, 720), 0.01f)
    }

    @Test
    fun canvasNeverShrinksBelowOne() {
        assertEquals(1f, tvCanvasScale(853, 480), 0.001f)
        assertEquals(0.66f, tvScaleFactor(853, 480), 0.001f)
    }

    @Test
    fun tvTypographyIsNeverBelowFullScale() {
        assertEquals(1f, typeScaleFor(isTv = true, widthDp = 960, heightDp = 540), 0.001f)
        assertEquals(1.333f, typeScaleFor(isTv = true, widthDp = 1280, heightDp = 720), 0.01f)
        // Phones keep their compact buckets.
        assertEquals(0.84f, typeScaleFor(isTv = false, widthDp = 800, heightDp = 400), 0.001f)
    }

    @Test
    fun phoneDockReserveFitsTheDockInsteadOfAFlat136dp() {
        val reserve = mobileDockReserve(factor = 1.12f, lowHeightLandscape = true, compact = true).value
        assertTrue("reserve $reserve should cover the ~80dp dock", reserve in 80f..100f)
    }
}
