package com.mo.moplayer

import com.mo.moplayer.ui.common.background.BackgroundMotionPolicy
import org.junit.Assert.*
import org.junit.Test

class BackgroundMotionPolicyTest {
    @Test fun tvDefaultsCannotOverrideAnyMotionRestriction() {
        assertFalse("Viewer disabled motion", BackgroundMotionPolicy.shouldAnimate(false, false, true, false))
        assertFalse("Low-memory TV", BackgroundMotionPolicy.shouldAnimate(true, true, true, false))
        assertFalse("System disabled animators", BackgroundMotionPolicy.shouldAnimate(true, false, false, false))
        assertFalse("Screen requested reduced motion", BackgroundMotionPolicy.shouldAnimate(true, false, true, true))
        assertTrue("Unrestricted device", BackgroundMotionPolicy.shouldAnimate(true, false, true, false))
    }
}
