package com.moalfarras.moplayer.core

import android.app.ActivityManager
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import coil3.size.Size
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.PerformanceMode

enum class DevicePerformanceTier {
    LOW,
    MID,
    HIGH,
}

data class DevicePerformanceInfo(
    val tier: DevicePerformanceTier,
    val isLowRam: Boolean,
    val memoryClassMb: Int,
    val cpuCores: Int,
    val sdkInt: Int,
    val isTv: Boolean,
) {
    val summary: String = when (tier) {
        DevicePerformanceTier.LOW -> "Performance mode"
        DevicePerformanceTier.MID -> "Balanced mode"
        DevicePerformanceTier.HIGH -> "Quality mode"
    }
}

data class PerformancePolicy(
    val mode: PerformanceMode,
    val tier: DevicePerformanceTier,
    val reduceMotion: Boolean,
    val enableParticles: Boolean,
    val enableWeatherEffects: Boolean,
    val enableFocusBackdropUpdates: Boolean,
    val enablePreviewPane: Boolean,
    val enableWidgets: Boolean,
    val enableAutoPlayLastLive: Boolean,
    val backdropImageSize: Size,
    val posterImageSize: Size,
    val liveBufferMs: Int,
    val maxVideoHeight: Int,
) {
    val isPerformance: Boolean = mode == PerformanceMode.PERFORMANCE
}

object Adaptive {
    val isTv: Boolean
        @Composable
        @ReadOnlyComposable
        get() {
            val context = LocalContext.current
            val configuration = LocalConfiguration.current
            val modeType = configuration.uiMode and Configuration.UI_MODE_TYPE_MASK
            val uiModeManager = context.getSystemService(Context.UI_MODE_SERVICE) as android.app.UiModeManager
            val packageManager = context.packageManager
            return modeType == Configuration.UI_MODE_TYPE_TELEVISION ||
                uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION ||
                packageManager.hasSystemFeature(PackageManager.FEATURE_LEANBACK) ||
                packageManager.hasSystemFeature(PackageManager.FEATURE_LEANBACK_ONLY) ||
                !packageManager.hasSystemFeature(PackageManager.FEATURE_TOUCHSCREEN)
        }

    val isMobile: Boolean
        @Composable
        @ReadOnlyComposable
        get() = !isTv

    val isTablet: Boolean
        @Composable
        @ReadOnlyComposable
        get() {
            val config = LocalConfiguration.current
            return config.smallestScreenWidthDp >= 600 && !isTv
        }

    fun performanceInfo(context: Context): DevicePerformanceInfo {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val packageManager = context.packageManager
        val isTvDevice = isTv(context)
        val lowRam = activityManager.isLowRamDevice
        val memoryClass = activityManager.memoryClass
        val cores = Runtime.getRuntime().availableProcessors().coerceAtLeast(1)
        val sdk = android.os.Build.VERSION.SDK_INT
        val score = buildList {
            if (lowRam) add(-3)
            if (memoryClass <= 128) add(-3) else if (memoryClass <= 192) add(-2) else if (memoryClass <= 256) add(-1) else add(1)
            if (cores <= 2) add(-2) else if (cores <= 4) add(-1) else add(1)
            if (sdk < 26) add(-2) else if (sdk < 29) add(-1) else add(1)
            if (isTvDevice && !packageManager.hasSystemFeature(PackageManager.FEATURE_TOUCHSCREEN)) add(0)
        }.sum()
        val tier = when {
            score <= -4 -> DevicePerformanceTier.LOW
            score >= 2 -> DevicePerformanceTier.HIGH
            else -> DevicePerformanceTier.MID
        }
        return DevicePerformanceInfo(
            tier = tier,
            isLowRam = lowRam,
            memoryClassMb = memoryClass,
            cpuCores = cores,
            sdkInt = sdk,
            isTv = isTvDevice,
        )
    }

    fun performancePolicy(settings: AppSettings, info: DevicePerformanceInfo): PerformancePolicy {
        val mode = when (settings.performanceMode) {
            PerformanceMode.AUTO -> when (info.tier) {
                DevicePerformanceTier.LOW -> PerformanceMode.PERFORMANCE
                DevicePerformanceTier.MID -> PerformanceMode.BALANCED
                DevicePerformanceTier.HIGH -> PerformanceMode.QUALITY
            }
            else -> settings.performanceMode
        }
        return when (mode) {
            PerformanceMode.PERFORMANCE -> PerformancePolicy(
                mode = mode,
                tier = info.tier,
                reduceMotion = true,
                enableParticles = false,
                enableWeatherEffects = false,
                enableFocusBackdropUpdates = false,
                enablePreviewPane = false,
                enableWidgets = false,
                enableAutoPlayLastLive = false,
                backdropImageSize = Size(1280, 720),
                posterImageSize = Size(320, 480),
                liveBufferMs = 6_000,
                maxVideoHeight = 720,
            )
            PerformanceMode.BALANCED, PerformanceMode.AUTO -> PerformancePolicy(
                mode = PerformanceMode.BALANCED,
                tier = info.tier,
                reduceMotion = false,
                enableParticles = settings.motionLevel != com.moalfarras.moplayer.domain.model.MotionLevel.LOW,
                enableWeatherEffects = settings.motionLevel != com.moalfarras.moplayer.domain.model.MotionLevel.LOW,
                enableFocusBackdropUpdates = true,
                enablePreviewPane = settings.previewEnabled,
                enableWidgets = true,
                enableAutoPlayLastLive = settings.autoPlayLastLive,
                backdropImageSize = Size(1920, 1080),
                posterImageSize = Size(420, 640),
                liveBufferMs = 8_000,
                maxVideoHeight = 1080,
            )
            PerformanceMode.QUALITY -> PerformancePolicy(
                mode = mode,
                tier = info.tier,
                reduceMotion = false,
                enableParticles = true,
                enableWeatherEffects = true,
                enableFocusBackdropUpdates = true,
                enablePreviewPane = settings.previewEnabled,
                enableWidgets = true,
                enableAutoPlayLastLive = settings.autoPlayLastLive,
                backdropImageSize = Size(2560, 1440),
                posterImageSize = Size(640, 960),
                liveBufferMs = 10_000,
                maxVideoHeight = 4320,
            )
        }
    }

    fun isTv(context: Context): Boolean {
        val configuration = context.resources.configuration
        val modeType = configuration.uiMode and Configuration.UI_MODE_TYPE_MASK
        val uiModeManager = context.getSystemService(Context.UI_MODE_SERVICE) as android.app.UiModeManager
        val packageManager = context.packageManager
        return modeType == Configuration.UI_MODE_TYPE_TELEVISION ||
            uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION ||
            packageManager.hasSystemFeature(PackageManager.FEATURE_LEANBACK) ||
            packageManager.hasSystemFeature(PackageManager.FEATURE_LEANBACK_ONLY) ||
            !packageManager.hasSystemFeature(PackageManager.FEATURE_TOUCHSCREEN)
    }
}
