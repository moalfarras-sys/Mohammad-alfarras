package com.moalfarras.moplayer.core

import android.app.ActivityManager
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.hardware.display.DisplayManager
import android.media.MediaCodecInfo
import android.media.MediaCodecList
import android.os.Build
import android.view.Display
import android.view.WindowManager
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.core.view.DisplayCompat
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import coil3.size.Size
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.MotionLevel
import com.moalfarras.moplayer.domain.model.PerformanceMode
import java.util.Locale
import kotlin.concurrent.thread

enum class DevicePerformanceTier {
    LOW,
    MID,
    HIGH,
}

@Immutable
data class DevicePerformanceInfo(
    val tier: DevicePerformanceTier,
    val isLowRam: Boolean,
    val memoryClassMb: Int,
    val cpuCores: Int,
    val sdkInt: Int,
    val isTv: Boolean,
    val displayMaxWidth: Int,
    val displayMaxHeight: Int,
    /** Total device RAM in MB (0 when unknown). */
    val totalRamMb: Int = 0,
    /** Tallest standard video height a hardware decoder plays at 25-30 fps (0 when unknown). */
    val maxDecodeHeight: Int = 0,
    val hdrDisplay: Boolean = false,
) {
    val summary: String = when (tier) {
        DevicePerformanceTier.LOW -> "Performance mode"
        DevicePerformanceTier.MID -> "Balanced mode"
        DevicePerformanceTier.HIGH -> "Quality mode"
    }

    val displayQualityLabel: String = when {
        displayMaxWidth >= 7680 || displayMaxHeight >= 4320 -> "8K"
        displayMaxWidth >= 3840 || displayMaxHeight >= 2160 -> "4K"
        displayMaxWidth >= 1920 || displayMaxHeight >= 1080 -> "FHD"
        displayMaxWidth >= 1280 || displayMaxHeight >= 720 -> "HD"
        else -> "SD"
    } + if (hdrDisplay) " HDR" else ""

    /**
     * Largest video height worth selecting on this device: the display's resolution (short side,
     * so portrait phones are not mistaken for 4K panels), limited by the hardware decoder. Used for
     * every performance mode, so a modest UI tier never downgrades the picture a decoder can play.
     */
    val videoCapHeight: Int = computeVideoCapHeight(
        displayShortSide = minOf(displayMaxWidth, displayMaxHeight),
        maxDecodeHeight = maxDecodeHeight,
        sdkInt = sdkInt,
        isLowRam = isLowRam,
    )
}

@Immutable
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

// Below this the box is a 1 GB-class device (they report ~0.9-1.4 GB total).
private const val LOW_TOTAL_RAM_MB = 1_500
private const val HIGH_TOTAL_RAM_MB = 3_500
private const val LOW_MEMORY_CLASS_MB = 128
private const val HIGH_MEMORY_CLASS_MB = 256
// A 2160 cap switches the live player to its 45 s buffer profile, and Media3 keeps those segments
// in the Java heap (100+ MB for a 4K stream), which a 192 MB heap cannot hold next to the UI.
private const val AUTO_4K_MIN_MEMORY_CLASS_MB = HIGH_MEMORY_CLASS_MB

/**
 * UI tier from memory, CPU and decoder facts. Only genuinely weak hardware is LOW: low-RAM
 * (Android Go) devices, 1 GB-class RAM, a heap under 128 MB, two cores, or no hardware 1080p
 * decoder. Common 2-4 GB TV boxes (4-core A53/A55, Android 7-12) are MID whatever their Android
 * version or heap class. HIGH needs a large heap and RAM and six or more cores, so decorative
 * motion stays calm on TV boxes with small GPUs.
 */
internal fun classifyPerformanceTier(
    isLowRam: Boolean,
    memoryClassMb: Int,
    totalRamMb: Int,
    cpuCores: Int,
    sdkInt: Int,
    maxDecodeHeight: Int,
): DevicePerformanceTier = when {
    isLowRam ||
        cpuCores <= 2 ||
        memoryClassMb < LOW_MEMORY_CLASS_MB ||
        totalRamMb in 1 until LOW_TOTAL_RAM_MB ||
        maxDecodeHeight in 1 until 1080 -> DevicePerformanceTier.LOW
    totalRamMb >= HIGH_TOTAL_RAM_MB &&
        cpuCores >= 6 &&
        memoryClassMb >= HIGH_MEMORY_CLASS_MB &&
        sdkInt >= 28 -> DevicePerformanceTier.HIGH
    else -> DevicePerformanceTier.MID
}

/** See [DevicePerformanceInfo.videoCapHeight]. An unknown decoder (0) leaves the display as the limit. */
internal fun computeVideoCapHeight(displayShortSide: Int, maxDecodeHeight: Int, sdkInt: Int, isLowRam: Boolean): Int {
    val decoderLimit = if (maxDecodeHeight > 0) maxDecodeHeight else Int.MAX_VALUE
    val cap = minOf(displayShortSide.coerceAtLeast(480), decoderLimit)
    return when {
        cap >= 4320 && sdkInt >= 29 && !isLowRam -> 4320
        cap >= 2160 && sdkInt >= 26 && !isLowRam -> 2160
        cap >= 1440 && sdkInt >= 26 -> 1440
        cap >= 1080 -> 1080
        else -> 720
    }
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

    @Volatile private var cachedInfo: DevicePerformanceInfo? = null

    /**
     * Starts the device probe (codec list, display modes) on a background thread so the first
     * frame does not wait for it. Safe to call more than once.
     */
    fun prewarmPerformanceInfo(context: Context) {
        if (cachedInfo != null) return
        val appContext = context.applicationContext
        thread(name = "mo-device-profile", isDaemon = true) { performanceInfo(appContext) }
    }

    /** Device facts, probed once per process (they do not change while the app runs). */
    fun performanceInfo(context: Context): DevicePerformanceInfo =
        cachedInfo ?: synchronized(this) {
            cachedInfo ?: probePerformanceInfo(context).also { cachedInfo = it }
        }

    private fun probePerformanceInfo(context: Context): DevicePerformanceInfo {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val lowRam = activityManager.isLowRamDevice
        val memoryClass = activityManager.memoryClass
        val totalRamMb = runCatching {
            ActivityManager.MemoryInfo().also(activityManager::getMemoryInfo).totalMem / (1024L * 1024L)
        }.getOrDefault(0L).toInt()
        val cores = Runtime.getRuntime().availableProcessors().coerceAtLeast(1)
        val sdk = Build.VERSION.SDK_INT
        val display = defaultDisplay(context)
        val displayCapability = displayCapability(context, display)
        val maxDecodeHeight = maxHardwareDecodeHeight()
        return DevicePerformanceInfo(
            tier = classifyPerformanceTier(lowRam, memoryClass, totalRamMb, cores, sdk, maxDecodeHeight),
            isLowRam = lowRam,
            memoryClassMb = memoryClass,
            cpuCores = cores,
            sdkInt = sdk,
            isTv = isTv(context),
            displayMaxWidth = displayCapability.width,
            displayMaxHeight = displayCapability.height,
            totalRamMb = totalRamMb,
            maxDecodeHeight = maxDecodeHeight,
            hdrDisplay = supportsHdr(display),
        )
    }

    fun performancePolicy(settings: AppSettings, info: DevicePerformanceInfo): PerformancePolicy {
        val automatic = settings.performanceMode == PerformanceMode.AUTO
        val mode = when (settings.performanceMode) {
            PerformanceMode.AUTO -> when (info.tier) {
                DevicePerformanceTier.LOW -> PerformanceMode.PERFORMANCE
                DevicePerformanceTier.MID -> PerformanceMode.BALANCED
                DevicePerformanceTier.HIGH -> PerformanceMode.QUALITY
            }
            else -> settings.performanceMode
        }
        val deviceCap = info.videoCapHeight
        // Media3 buffers segments in the Java heap; below a 256 MB heap automatic mode stays at
        // 1080p so a 4K stream cannot exhaust it (single-variant 4K streams still play, only
        // HLS/DASH ladders are held at 1080p).
        val automaticCap = if (info.memoryClassMb >= AUTO_4K_MIN_MEMORY_CLASS_MB) deviceCap else minOf(1080, deviceCap)
        // Small heaps get smaller artwork so browsing big grids does not churn the image cache.
        val smallHeap = info.memoryClassMb <= LOW_MEMORY_CLASS_MB
        // On a television that is not a high-end box, continuous decorative motion
        // (ambient particle canvas, aurora drift, focus-driven backdrop reloads) is the
        // dominant source of dropped frames on the 10-foot UI: it forces a full-screen
        // redraw every frame even while idle. Calm it so channel browsing and playback
        // stay smooth. Phones, tablets, and high-end TV boxes keep the full motion.
        val tvCalmMotion = info.isTv && info.tier != DevicePerformanceTier.HIGH
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
                // Chosen by the user: 720p. Picked automatically for a weak device: whatever its
                // decoder plays up to 1080p, so FHD channels are not swapped for other channels.
                maxVideoHeight = minOf(if (automatic) 1080 else 720, deviceCap),
            )
            PerformanceMode.BALANCED, PerformanceMode.AUTO -> PerformancePolicy(
                mode = PerformanceMode.BALANCED,
                tier = info.tier,
                reduceMotion = tvCalmMotion,
                enableParticles = !tvCalmMotion && settings.motionLevel != MotionLevel.LOW,
                enableWeatherEffects = !tvCalmMotion && settings.motionLevel != MotionLevel.LOW,
                enableFocusBackdropUpdates = !tvCalmMotion,
                enablePreviewPane = settings.previewEnabled,
                enableWidgets = true,
                enableAutoPlayLastLive = settings.autoPlayLastLive,
                backdropImageSize = if (smallHeap) Size(1280, 720) else Size(1920, 1080),
                posterImageSize = if (smallHeap) Size(320, 480) else Size(420, 640),
                liveBufferMs = 8_000,
                // Automatic: 4K on a 4K TV whose decoder and heap handle it. Balanced chosen by the user keeps 1080p.
                maxVideoHeight = if (automatic) automaticCap else minOf(1080, deviceCap),
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
                maxVideoHeight = deviceCap,
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

    private data class DisplayCapability(val width: Int, val height: Int)

    private fun defaultDisplay(context: Context): Display? =
        runCatching {
            if (Build.VERSION.SDK_INT >= 30) {
                context.display
            } else {
                @Suppress("DEPRECATION")
                (context.getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay
            }
        }.getOrNull()
            ?: runCatching {
                (context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager).getDisplay(Display.DEFAULT_DISPLAY)
            }.getOrNull()

    // DisplayCompat also reads the vendor 4K size on TV boxes that render their UI at 1080p.
    private fun displayCapability(context: Context, display: Display?): DisplayCapability {
        val modes = display?.let { runCatching { DisplayCompat.getSupportedModes(context, it).toList() }.getOrDefault(emptyList()) }.orEmpty()
        val best = modes.maxWithOrNull(compareBy<DisplayCompat.ModeCompat> { it.physicalWidth * it.physicalHeight }.thenBy { it.physicalHeight })
        val width = best?.physicalWidth ?: context.resources.displayMetrics.widthPixels
        val height = best?.physicalHeight ?: context.resources.displayMetrics.heightPixels
        return DisplayCapability(width.coerceAtLeast(1), height.coerceAtLeast(1))
    }

    // Display.getHdrCapabilities() exists from API 24; minSdk is 23.
    @Suppress("DEPRECATION")
    private fun supportsHdr(display: Display?): Boolean =
        display != null && Build.VERSION.SDK_INT >= 24 &&
            runCatching { display.hdrCapabilities?.supportedHdrTypes?.isNotEmpty() == true }.getOrDefault(false)

    private val probedVideoMimes = listOf("video/hevc", "video/x-vnd.on2.vp9", "video/av01", "video/avc")
    private val standardSizes = listOf(7680 to 4320, 3840 to 2160, 1920 to 1080, 1280 to 720)

    /** Tallest standard size any hardware video decoder plays at 25 or 30 fps; 0 when the probe fails. */
    private fun maxHardwareDecodeHeight(): Int = runCatching {
        var best = 0
        for (info in MediaCodecList(MediaCodecList.REGULAR_CODECS).codecInfos) {
            if (info.isEncoder || info.isSoftwareDecoder()) continue
            for (type in info.supportedTypes) {
                if (probedVideoMimes.none { it.equals(type, ignoreCase = true) }) continue
                val video = runCatching { info.getCapabilitiesForType(type).videoCapabilities }.getOrNull() ?: continue
                val height = standardSizes.firstOrNull { (w, h) -> video.plays(w, h) }?.second ?: 0
                best = maxOf(best, height)
            }
        }
        best
    }.getOrDefault(0)

    private fun MediaCodecInfo.VideoCapabilities.plays(width: Int, height: Int): Boolean =
        runCatching {
            (isSizeSupported(width, height) && (areSizeAndRateSupported(width, height, 30.0) || areSizeAndRateSupported(width, height, 25.0))) ||
                (isSizeSupported(height, width) && areSizeAndRateSupported(height, width, 25.0))
        }.getOrDefault(false)

    private fun MediaCodecInfo.isSoftwareDecoder(): Boolean {
        if (Build.VERSION.SDK_INT >= 29) return isSoftwareOnly
        val codecName = name.lowercase(Locale.ROOT)
        return codecName.startsWith("omx.google.") ||
            codecName.startsWith("omx.ffmpeg.") ||
            (codecName.startsWith("omx.sec.") && codecName.contains(".sw.")) ||
            codecName == "omx.qcom.video.decoder.hevcswvdec" ||
            codecName.startsWith("c2.android.") ||
            codecName.startsWith("c2.google.") ||
            (!codecName.startsWith("omx.") && !codecName.startsWith("c2."))
    }
}
