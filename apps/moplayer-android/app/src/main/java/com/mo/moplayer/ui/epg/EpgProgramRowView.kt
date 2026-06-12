package com.mo.moplayer.ui.epg

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.text.TextPaint
import android.text.TextUtils
import android.util.AttributeSet
import android.view.View
import androidx.core.content.ContextCompat
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.EpgEntity

/**
 * Canvas-drawn strip of EPG program blocks for a single channel, rendered against the
 * grid's shared [GuideTimeAxis]. Drawing one View per channel row (instead of a nested
 * RecyclerView of program cells) keeps the guide light enough to stay smooth on a
 * Fire TV Stick: no child-view inflation, no per-program focus objects, no allocations
 * in onDraw. The focus "cursor" lives in the host activity and is pushed in via
 * [bind]; this view only renders the highlight.
 */
class EpgProgramRowView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var programs: List<EpgEntity> = emptyList()
    private var axis: GuideTimeAxis? = null
    private var isFocusedChannel: Boolean = false
    private var focusedProgramStartMs: Long = Long.MIN_VALUE

    private val accent = ContextCompat.getColor(context, R.color.liquid_accent_primary)
    private val textPrimary = ContextCompat.getColor(context, R.color.liquid_text_primary)
    private val textSecondary = ContextCompat.getColor(context, R.color.liquid_text_secondary)
    private val textTertiary = ContextCompat.getColor(context, R.color.liquid_text_tertiary)

    private val density = resources.displayMetrics.density
    private fun dp(v: Float) = v * density

    private val blockGap = dp(2f)
    private val corner = dp(7f)
    private val padH = dp(11f)
    private val titleSize = dp(13.5f)
    private val timeSize = dp(10.5f)

    private val futurePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0x14FFFFFF }
    private val pastPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0x0AFFFFFF }
    private val livePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = withAlpha(accent, 0x33) }
    private val focusedPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = withAlpha(accent, 0x59) }
    private val focusBorderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = dp(2f)
        color = accent
    }
    private val liveProgressPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = withAlpha(accent, 0x26) }
    private val dividerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0x1AFFFFFF
        strokeWidth = dp(1f)
    }
    private val nowLinePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.htc_error)
        strokeWidth = dp(2f)
    }
    private val titlePaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
        textSize = titleSize
        isFakeBoldText = true
    }
    private val timePaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
        textSize = timeSize
        color = textTertiary
    }

    private val block = RectF()

    fun bind(
        row: EpgGuideRow?,
        axis: GuideTimeAxis,
        isFocusedChannel: Boolean,
        focusedProgramStartMs: Long
    ) {
        this.programs = row?.programs ?: emptyList()
        this.axis = axis
        this.isFocusedChannel = isFocusedChannel
        this.focusedProgramStartMs = focusedProgramStartMs
        invalidate()
    }

    /** Lightweight update when only the shared scroll/axis changes (no row rebind). */
    fun updateAxis(axis: GuideTimeAxis, isFocusedChannel: Boolean, focusedProgramStartMs: Long) {
        this.axis = axis
        this.isFocusedChannel = isFocusedChannel
        this.focusedProgramStartMs = focusedProgramStartMs
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        val a = axis ?: return
        val w = width.toFloat()
        val h = height.toFloat()
        val now = System.currentTimeMillis()

        if (programs.isEmpty()) {
            block.set(blockGap, blockGap, w - blockGap, h - blockGap)
            canvas.drawRoundRect(block, corner, corner, pastPaint)
            timePaint.color = textTertiary
            val label = TextUtils.ellipsize(
                context.getString(R.string.epg_no_information),
                timePaint, w - padH * 2, TextUtils.TruncateAt.END
            )
            canvas.drawText(label, 0, label.length, padH, h / 2 + timeSize / 3, timePaint)
            drawNowLine(canvas, a, now, h)
            return
        }

        for (p in programs) {
            val left = a.timeToX(p.startTime)
            val right = a.timeToX(p.endTime)
            if (right < 0f || left > w) continue // off-screen

            val isLive = now in p.startTime until p.endTime
            val isPast = p.endTime <= now
            val focused = isFocusedChannel && p.startTime == focusedProgramStartMs

            val l = (left + blockGap).coerceAtLeast(0f)
            val r = (right - blockGap).coerceAtMost(w)
            if (r <= l) continue
            block.set(l, blockGap, r, h - blockGap)

            val fill = when {
                focused -> focusedPaint
                isLive -> livePaint
                isPast -> pastPaint
                else -> futurePaint
            }
            canvas.drawRoundRect(block, corner, corner, fill)

            // Live progress sliver inside the block.
            if (isLive) {
                val progressX = a.timeToX(now).coerceIn(l, r)
                if (progressX > l) {
                    val saved = canvas.save()
                    canvas.clipRect(l, blockGap, progressX, h - blockGap)
                    canvas.drawRoundRect(block, corner, corner, liveProgressPaint)
                    canvas.restoreToCount(saved)
                }
            }

            if (focused) {
                canvas.drawRoundRect(block, corner, corner, focusBorderPaint)
            }

            // Program title + time, clipped to the visible part of the block.
            val textLeft = l.coerceAtLeast(0f) + padH
            val textRight = r - dp(4f)
            val avail = textRight - textLeft
            if (avail > dp(24f)) {
                titlePaint.color = when {
                    focused -> textPrimary
                    isPast -> textTertiary
                    else -> textPrimary
                }
                val title = TextUtils.ellipsize(p.title, titlePaint, avail, TextUtils.TruncateAt.END)
                canvas.drawText(title, 0, title.length, textLeft, h / 2 - dp(2f), titlePaint)

                timePaint.color = if (focused) withAlpha(accent, 0xFF) else textTertiary
                val timeLabel = p.getStartTimeFormatted()
                if (avail > dp(36f)) {
                    canvas.drawText(timeLabel, textLeft, h / 2 + timeSize + dp(4f), timePaint)
                }
            }

            // Right divider between programs.
            if (r < w) canvas.drawLine(r, blockGap, r, h - blockGap, dividerPaint)
        }

        drawNowLine(canvas, a, now, h)
    }

    private fun drawNowLine(canvas: Canvas, a: GuideTimeAxis, now: Long, h: Float) {
        val x = a.timeToX(now)
        if (x in 0f..width.toFloat()) {
            canvas.drawLine(x, 0f, x, h, nowLinePaint)
        }
    }

    private fun withAlpha(color: Int, alpha: Int): Int =
        (alpha shl 24) or (color and 0x00FFFFFF)
}
