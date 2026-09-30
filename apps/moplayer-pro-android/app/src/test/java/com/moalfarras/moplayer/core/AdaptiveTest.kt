package com.moalfarras.moplayer.core

import coil3.size.Size
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.PerformanceMode
import org.junit.Assert.assertEquals
import org.junit.Test

class AdaptiveTest {
    private fun device(
        isLowRam: Boolean = false,
        memoryClassMb: Int = 192,
        totalRamMb: Int = 1_900,
        cpuCores: Int = 4,
        sdkInt: Int = 28,
        isTv: Boolean = true,
        width: Int = 1920,
        height: Int = 1080,
        maxDecodeHeight: Int = 2160,
    ) = DevicePerformanceInfo(
        tier = classifyPerformanceTier(isLowRam, memoryClassMb, totalRamMb, cpuCores, sdkInt, maxDecodeHeight),
        isLowRam = isLowRam,
        memoryClassMb = memoryClassMb,
        cpuCores = cpuCores,
        sdkInt = sdkInt,
        isTv = isTv,
        displayMaxWidth = width,
        displayMaxHeight = height,
        totalRamMb = totalRamMb,
        maxDecodeHeight = maxDecodeHeight,
    )

    private fun policy(info: DevicePerformanceInfo, mode: PerformanceMode = PerformanceMode.AUTO) =
        Adaptive.performancePolicy(AppSettings(performanceMode = mode), info)

    @Test
    fun commonTwoToFourGigabyteTvBoxesAreNotWeak() {
        // Android 7.1 S905X box: 2 GB, 4 cores, 128 MB heap — used to be forced LOW.
        assertEquals(DevicePerformanceTier.MID, device(memoryClassMb = 128, totalRamMb = 1_950, sdkInt = 25).tier)
        // Android 9 S905X2 box, 192 MB heap — used to score LOW.
        assertEquals(DevicePerformanceTier.MID, device().tier)
        // 4 GB Android 11 box with four cores stays MID so decorative motion stays calm.
        assertEquals(DevicePerformanceTier.MID, device(memoryClassMb = 256, totalRamMb = 3_900, sdkInt = 30).tier)
    }

    @Test
    fun genuinelyWeakDevicesAreLow() {
        assertEquals(DevicePerformanceTier.LOW, device(isLowRam = true).tier)
        assertEquals(DevicePerformanceTier.LOW, device(totalRamMb = 980, memoryClassMb = 128).tier)
        assertEquals(DevicePerformanceTier.LOW, device(memoryClassMb = 96).tier)
        assertEquals(DevicePerformanceTier.LOW, device(cpuCores = 2).tier)
        assertEquals(DevicePerformanceTier.LOW, device(maxDecodeHeight = 720).tier)
    }

    @Test
    fun unknownProbeValuesDoNotDowngrade() {
        assertEquals(DevicePerformanceTier.MID, device(totalRamMb = 0, maxDecodeHeight = 0).tier)
    }

    @Test
    fun strongPhonesAndBoxesAreHigh() {
        assertEquals(
            DevicePerformanceTier.HIGH,
            device(memoryClassMb = 512, totalRamMb = 7_800, cpuCores = 8, sdkInt = 34, isTv = false).tier,
        )
    }

    @Test
    fun autoAllows4kOnA4kTvWithA4kDecoder() {
        val box = device(width = 3840, height = 2160)
        assertEquals(DevicePerformanceTier.MID, box.tier)
        assertEquals(2160, policy(box).maxVideoHeight)
        assertEquals("4K", box.displayQualityLabel)
        // A 128 MB heap cannot buffer 4K segments safely: automatic stays at 1080p, Quality may still pick 4K.
        val smallHeapBox = device(width = 3840, height = 2160, memoryClassMb = 128)
        assertEquals(1080, policy(smallHeapBox).maxVideoHeight)
        assertEquals(2160, policy(smallHeapBox, PerformanceMode.QUALITY).maxVideoHeight)
    }

    @Test
    fun videoCapFollowsTheDecoderNotTheUiTier() {
        assertEquals(1080, policy(device(width = 3840, height = 2160, maxDecodeHeight = 1080)).maxVideoHeight)
        assertEquals(1080, policy(device(width = 1920, height = 1080)).maxVideoHeight)
        // A weak box in automatic mode still plays FHD channels as FHD.
        val weak = device(isLowRam = true, width = 3840, height = 2160)
        assertEquals(PerformanceMode.PERFORMANCE, policy(weak).mode)
        assertEquals(1080, policy(weak).maxVideoHeight)
    }

    @Test
    fun explicitModesKeepTheirMeaning() {
        val box = device(width = 3840, height = 2160)
        assertEquals(720, policy(box, PerformanceMode.PERFORMANCE).maxVideoHeight)
        assertEquals(1080, policy(box, PerformanceMode.BALANCED).maxVideoHeight)
        assertEquals(2160, policy(box, PerformanceMode.QUALITY).maxVideoHeight)
    }

    @Test
    fun portraitPhonePanelIsNotMistakenForA4kDisplay() {
        val phone = device(isTv = false, width = 1080, height = 2400, memoryClassMb = 256, totalRamMb = 5_800, cpuCores = 8, sdkInt = 33)
        assertEquals(1080, phone.videoCapHeight)
    }

    @Test
    fun oldAndroidVersionsAreCappedBelow4k() {
        assertEquals(1080, computeVideoCapHeight(displayShortSide = 2160, maxDecodeHeight = 2160, sdkInt = 25, isLowRam = false))
        assertEquals(2160, computeVideoCapHeight(displayShortSide = 2160, maxDecodeHeight = 0, sdkInt = 26, isLowRam = false))
        assertEquals(720, computeVideoCapHeight(displayShortSide = 720, maxDecodeHeight = 2160, sdkInt = 30, isLowRam = false))
    }

    @Test
    fun smallHeapsGetSmallerArtwork() {
        assertEquals(Size(1280, 720), policy(device(memoryClassMb = 128, totalRamMb = 1_950)).backdropImageSize)
        assertEquals(Size(1920, 1080), policy(device(memoryClassMb = 256, totalRamMb = 3_900)).backdropImageSize)
    }
}
