package com.mo.moplayer

import com.mo.moplayer.util.DevicePerformance
import org.junit.Assert.assertEquals
import org.junit.Test

class DevicePerformanceTest {
    @Test fun twoGbArmv7TvUsesTheLightweightPathEvenWithoutLowRamFlag() {
        assertEquals(DevicePerformance.Tier.LOW, DevicePerformance.resolveTier(2.0, 4, false, true, 30, false, false))
        assertEquals(DevicePerformance.Tier.LOW, DevicePerformance.resolveTier(1.8, 4, false, true, 25, true, false))
    }

    @Test fun capableDevicesRetainRichEffectsAndPlatformLowRamAlwaysWins() {
        assertEquals(DevicePerformance.Tier.MEDIUM, DevicePerformance.resolveTier(2.0, 4, false, true, 36, true, false))
        assertEquals(DevicePerformance.Tier.HIGH, DevicePerformance.resolveTier(4.0, 8, false, true, 36, true, false))
        assertEquals(DevicePerformance.Tier.LOW, DevicePerformance.resolveTier(4.0, 8, true, true, 36, true, false))
    }
}
