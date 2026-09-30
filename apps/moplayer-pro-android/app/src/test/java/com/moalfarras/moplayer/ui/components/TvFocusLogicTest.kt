package com.moalfarras.moplayer.ui.components

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TvFocusLogicTest {
    @Test
    fun pivotKeepsFocusedItemAtThirtyPercentOfTheContainer() {
        // 1000px row, item of 150px whose leading edge is at 600px -> scroll 300px forward.
        assertEquals(300f, tvPivotScrollDistance(offset = 600f, size = 150f, containerSize = 1000f, pivotFraction = 0.3f), 0.001f)
    }

    @Test
    fun pivotScrollsBackwardWhenItemIsBeforeThePivot() {
        assertEquals(-200f, tvPivotScrollDistance(offset = 100f, size = 150f, containerSize = 1000f, pivotFraction = 0.3f), 0.001f)
    }

    @Test
    fun itemAlreadyAtPivotDoesNotScroll() {
        assertEquals(0f, tvPivotScrollDistance(offset = 300f, size = 150f, containerSize = 1000f, pivotFraction = 0.3f), 0.001f)
    }

    @Test
    fun itemTooTallForThePivotAlignsItsTrailingEdge() {
        // 800px item cannot start at 300px of a 1000px container; its end must sit on the edge.
        assertEquals(200f, tvPivotScrollDistance(offset = 400f, size = 800f, containerSize = 1000f, pivotFraction = 0.3f), 0.001f)
    }

    @Test
    fun itemLargerThanContainerAlignsLeadingEdge() {
        assertEquals(50f, tvPivotScrollDistance(offset = 50f, size = 1400f, containerSize = 1000f, pivotFraction = 0.3f), 0.001f)
    }

    @Test
    fun unmeasuredContainerNeverScrolls() {
        assertEquals(0f, tvPivotScrollDistance(offset = 500f, size = 100f, containerSize = 0f, pivotFraction = 0.3f), 0.001f)
    }

    @Test
    fun restoreOffsetLandsOnThePivotLine() {
        assertEquals(-300, pivotScrollOffset(1000))
        assertEquals(0, pivotScrollOffset(0))
    }

    @Test
    fun clickGuardSwallowsADoublePressInsideTheWindow() {
        val guard = ClickGuard(450L)
        assertTrue(guard.tryAccept(1_000L))
        assertFalse(guard.tryAccept(1_200L))
        assertTrue(guard.tryAccept(1_460L))
    }

    @Test
    fun clickGuardWithZeroWindowAcceptsEveryClick() {
        val guard = ClickGuard(0L)
        assertTrue(guard.tryAccept(10L))
        assertTrue(guard.tryAccept(10L))
    }

    @Test
    fun youtubeIdValidation() {
        assertTrue(isValidYoutubeId("dQw4w9WgXcQ"))
        assertFalse(isValidYoutubeId("null"))
        assertFalse(isValidYoutubeId("dQw4w9WgXcQ'); alert(1"))
        assertFalse(isValidYoutubeId(""))
    }
}
