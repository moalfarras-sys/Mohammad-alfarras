package com.mo.moplayer.ui.player

import android.media.MediaFormat
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.media3.common.Format
import androidx.media3.common.util.UnstableApi

/**
 * Detects HDR/Dolby Vision from ExoPlayer [Format.colorInfo].
 *
 * Returns a human-readable badge string:
 * - "Dolby Vision"  — ColorTransfer = ST2084 (PQ) + ColorStandard = Dolby Vision
 * - "HDR10+"        — ColorTransfer = ST2084 (PQ)
 * - "HLG"           — ColorTransfer = HLG
 * - null            — SDR or unknown
 *
 * Safe to call from any thread; does not throw.
 */
@UnstableApi
object HDRDetector {

    private const val DOLBY_VISION_PROFILE_5 = 512 // MediaCodec internal hint
    private const val DOLBY_VISION_PROFILE_8 = 1024
    private const val DOLBY_VISION_PROFILE_9 = 2048

    /** Inspect an ExoPlayer [Format] and return a quality badge string. */
    fun detect(format: Format?): String? {
        if (format == null) return null
        val colorInfo = format.colorInfo ?: return null
        val colorTransfer = colorInfo.colorTransfer
        val colorStandard = colorInfo.colorSpace

        return when {
            isDolbyVision(colorTransfer, colorStandard, format.sampleMimeType) -> "Dolby Vision"
            colorTransfer == androidx.media3.common.C.COLOR_TRANSFER_ST2084 -> "HDR10+"
            colorTransfer == androidx.media3.common.C.COLOR_TRANSFER_HLG -> "HLG"
            else -> null
        }
    }

    private fun isDolbyVision(
        transfer: Int,
        standard: Int,
        sampleMimeType: String?
    ): Boolean {
        // Dolby Vision streams often carry the DV mime type prefix
        if (sampleMimeType?.contains("dolby-vision", ignoreCase = true) == true) return true
        if (sampleMimeType?.contains("dvhe", ignoreCase = true) == true) return true
        if (sampleMimeType?.contains("dvh1", ignoreCase = true) == true) return true
        // Heuristic: PQ + BT.2020 often means DV on streaming services
        return transfer == androidx.media3.common.C.COLOR_TRANSFER_ST2084 &&
            standard == androidx.media3.common.C.COLOR_SPACE_BT2020
    }

    /** Returns a color for the badge background. */
    fun badgeColor(badge: String?): Int = when (badge) {
        "Dolby Vision" -> 0xFF8B5CF6.toInt() // Purple
        "HDR10+" -> 0xFFFF6B35.toInt()     // Orange
        "HLG" -> 0xFF00A86B.toInt()        // Green
        else -> 0xFF71717A.toInt()         // Zinc gray
    }
}
