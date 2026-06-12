package com.mo.moplayer.ui.epg

import com.mo.moplayer.data.local.entity.ChannelEntity
import com.mo.moplayer.data.local.entity.EpgEntity

/**
 * Shared horizontal time axis for the whole program-guide grid. Every channel strip and
 * the time ruler render against the same axis so the columns line up and scroll together.
 *
 * x(programTimeMs) = (programTimeMs - windowStartMs) / 60000 * pxPerMinute - scrollPx
 */
data class GuideTimeAxis(
    val windowStartMs: Long,
    val windowEndMs: Long,
    val pxPerMinute: Float,
    val scrollPx: Float
) {
    fun timeToX(timeMs: Long): Float =
        (timeMs - windowStartMs) / 60_000f * pxPerMinute - scrollPx

    fun xToTime(x: Float): Long =
        windowStartMs + ((x + scrollPx) / pxPerMinute * 60_000f).toLong()

    /** Total scrollable width of the full window in px. */
    val totalWidthPx: Float
        get() = (windowEndMs - windowStartMs) / 60_000f * pxPerMinute
}

/** One channel row in the guide: the channel plus its programs that fall inside the window. */
data class EpgGuideRow(
    val channel: ChannelEntity,
    val programs: List<EpgEntity>
) {
    fun programAt(timeMs: Long): EpgEntity? =
        programs.firstOrNull { timeMs >= it.startTime && timeMs < it.endTime }

    fun firstProgramFrom(timeMs: Long): EpgEntity? =
        programs.firstOrNull { it.startTime > timeMs }

    fun lastProgramBefore(timeMs: Long): EpgEntity? =
        programs.lastOrNull { it.startTime < timeMs }
}
