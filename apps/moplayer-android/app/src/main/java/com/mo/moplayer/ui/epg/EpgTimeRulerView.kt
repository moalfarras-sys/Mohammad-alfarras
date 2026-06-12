package com.mo.moplayer.ui.epg

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.text.TextPaint
import android.util.AttributeSet
import android.view.View
import androidx.core.content.ContextCompat
import com.mo.moplayer.R
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Time axis header for the program guide. Draws 30-minute tick labels across the shared
 * [GuideTimeAxis] viewport plus a "now" marker, kept perfectly aligned with the channel
 * strips below it.
 */
class EpgTimeRulerView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var axis: GuideTimeAxis? = null

    private val accent = ContextCompat.getColor(context, R.color.liquid_accent_primary)
    private val now = ContextCompat.getColor(context, R.color.htc_error)
    private val density = resources.displayMetrics.density
    private fun dp(v: Float) = v * density

    private val tickPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0x33FFFFFF
        strokeWidth = dp(1f)
    }
    private val hourTickPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0x55FFFFFF
        strokeWidth = dp(1.5f)
    }
    private val labelPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.liquid_text_secondary)
        textSize = dp(12f)
    }
    private val hourLabelPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.liquid_text_primary)
        textSize = dp(12.5f)
        isFakeBoldText = true
    }
    private val nowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = now }
    private val nowPath = Path()

    private val hm = SimpleDateFormat("HH:mm", Locale.getDefault())

    fun bind(axis: GuideTimeAxis) {
        this.axis = axis
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        val a = axis ?: return
        val w = width.toFloat()
        val h = height.toFloat()

        val viewportStart = a.xToTime(0f)
        val viewportEnd = a.xToTime(w)

        // First 30-minute boundary at or after the viewport start.
        val cal = Calendar.getInstance().apply {
            timeInMillis = viewportStart
            set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
            val min = get(Calendar.MINUTE)
            set(Calendar.MINUTE, if (min < 30) 30 else 0)
            if (min >= 30) add(Calendar.HOUR_OF_DAY, 1)
        }

        var t = cal.timeInMillis
        while (t <= viewportEnd) {
            val x = a.timeToX(t)
            val isHour = (t / 60_000L) % 60L == 0L
            canvas.drawLine(x, h - dp(8f), x, h, if (isHour) hourTickPaint else tickPaint)
            val label = hm.format(Date(t))
            val paint = if (isHour) hourLabelPaint else labelPaint
            canvas.drawText(label, x + dp(6f), h - dp(12f), paint)
            t += 30 * 60_000L
        }

        // "Now" marker.
        val nowMs = System.currentTimeMillis()
        val nx = a.timeToX(nowMs)
        if (nx in 0f..w) {
            nowPath.reset()
            nowPath.moveTo(nx - dp(5f), h - dp(2f))
            nowPath.lineTo(nx + dp(5f), h - dp(2f))
            nowPath.lineTo(nx, h - dp(9f))
            nowPath.close()
            canvas.drawPath(nowPath, nowPaint)
        }
    }
}
