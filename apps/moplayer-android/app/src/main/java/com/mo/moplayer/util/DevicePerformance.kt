package com.mo.moplayer.util

import android.app.ActivityManager
import android.content.Context
import android.os.Build

/**
 * Central device-capability tiering so the UI can scale itself down on weak
 * hardware (cheap Android TV boxes, older Fire TV sticks, low-RAM phones) and
 * stay smooth, while still looking premium on capable devices.
 *
 * The tier is computed once and cached: RAM, CPU core count and the platform
 * low-RAM flag are stable for the process lifetime.
 */
object DevicePerformance {

    enum class Tier { LOW, MEDIUM, HIGH }

    @Volatile
    private var cachedTier: Tier? = null

    fun tier(context: Context): Tier {
        cachedTier?.let { return it }
        val resolved = computeTier(context.applicationContext)
        cachedTier = resolved
        return resolved
    }

    private fun computeTier(context: Context): Tier {
        val am = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
            ?: return Tier.MEDIUM

        if (am.isLowRamDevice) return Tier.LOW

        val memInfo = ActivityManager.MemoryInfo()
        am.getMemoryInfo(memInfo)
        val totalGb = memInfo.totalMem / 1_073_741_824.0 // bytes -> GiB
        val cores = Runtime.getRuntime().availableProcessors().coerceAtLeast(1)

        // Older Fire TV sticks (AFTM/AFTT/AFTSSS...) are reliably weak; bias them down.
        val fireStickLowEnd = isAmazonFireDevice() && totalGb < 2.0
        val legacyAndroidTv = Build.VERSION.SDK_INT <= Build.VERSION_CODES.N_MR1 &&
            (context.resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_TYPE_MASK) ==
            android.content.res.Configuration.UI_MODE_TYPE_TELEVISION

        return when {
            legacyAndroidTv || fireStickLowEnd || totalGb < 1.6 || cores <= 2 -> Tier.LOW
            totalGb < 3.0 || cores <= 4 -> Tier.MEDIUM
            else -> Tier.HIGH
        }
    }

    fun isLow(context: Context): Boolean = tier(context) == Tier.LOW
    fun isHigh(context: Context): Boolean = tier(context) == Tier.HIGH

    fun isAmazonFireDevice(): Boolean =
        Build.MANUFACTURER.equals("Amazon", ignoreCase = true) ||
            Build.MODEL.startsWith("AFT", ignoreCase = true)

    /** Full animated/particle background is only worthwhile above the low tier. */
    fun allowAnimatedBackground(context: Context): Boolean = tier(context) != Tier.LOW

    /** Extra cinematic layers (nebula/glow passes) are reserved for high tier. */
    fun allowCinematicEffects(context: Context): Boolean = tier(context) == Tier.HIGH

    /** Home widgets should stay available on every TV; weak devices use lightweight rendering. */
    fun allowRichHomeWidgets(context: Context): Boolean = true

    /** Avoid Lottie, oversized animation passes, and rapid widget refreshes on weak TVs. */
    fun useLightweightHomeWidgets(context: Context): Boolean = tier(context) == Tier.LOW

    /**
     * Buffer multiplier for the player: weak devices get larger buffers to ride
     * out decode hiccups, while strong devices stay responsive with the default.
     */
    fun bufferMultiplier(context: Context): Float = when (tier(context)) {
        Tier.LOW -> 1.5f
        Tier.MEDIUM -> 1.2f
        Tier.HIGH -> 1.0f
    }
}
