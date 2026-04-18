package com.mo.moplayer.ui.epg

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.util.AttributeSet
import android.view.View
import androidx.core.content.ContextCompat
import com.mo.moplayer.R
import java.text.SimpleDateFormat
import java.util.*

/**
 * Premium EPG Timeline View
 * Shows current time indicator and program schedule
 */
class EpgTimelineView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    // Paint objects
    private val timelinePaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val currentTimePaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val gridPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val labelBgPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    
    // Colors
    private val accentColor = ContextCompat.getColor(context, R.color.liquid_accent_primary)
    private val textSecondary = ContextCompat.getColor(context, R.color.liquid_text_secondary)
    private val divider = ContextCompat.getColor(context, R.color.liquid_divider)
    private val textPrimary = ContextCompat.getColor(context, R.color.liquid_text_primary)
    
    // Time range (24 hours)
    private val startTime = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
    }
    
    private val endTime = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 23)
        set(Calendar.MINUTE, 59)
        set(Calendar.SECOND, 59)
    }
    
    private val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
    
    // Current time marker position
    private var currentTimeX = 0f
    
    init {
        setupPaints()
    }
    
    private fun setupPaints() {
        // Timeline background
        timelinePaint.color = divider
        timelinePaint.strokeWidth = 2f
        
        // Current time indicator
        currentTimePaint.color = accentColor
        currentTimePaint.strokeWidth = 4f
        
        // Time text
        textPaint.color = textSecondary
        textPaint.textSize = resources.getDimension(R.dimen.liquid_text_caption)
        textPaint.textAlign = Paint.Align.CENTER
        
        // Grid lines
        gridPaint.color = divider
        gridPaint.strokeWidth = 1f
        gridPaint.alpha = 100

        // Label background for current time
        labelBgPaint.color = accentColor
        labelBgPaint.style = Paint.Style.FILL
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        val width = width.toFloat()
        val height = height.toFloat()
        
        // Draw timeline background
        canvas.drawLine(0f, height / 2, width, height / 2, timelinePaint)
        
        // Draw hour markers and labels
        val hoursInDay = 24
        val hourWidth = width / hoursInDay
        
        for (hour in 0 until hoursInDay) {
            val x = hour * hourWidth
            
            // Draw vertical grid line
            canvas.drawLine(x, 0f, x, height, gridPaint)
            
            // Draw hour label
            val time = String.format(Locale.getDefault(), "%02d:00", hour)
            canvas.drawText(time, x + hourWidth / 2, height - 20f, textPaint)
            
            // Draw 30-minute marker
            val halfX = x + hourWidth / 2
            canvas.drawLine(halfX, height / 2 - 10f, halfX, height / 2 + 10f, gridPaint)
        }
        
        // Draw current time indicator
        updateCurrentTimePosition()
        canvas.drawLine(currentTimeX, 0f, currentTimeX, height, currentTimePaint)
        
        // Draw current time label
        val currentTime = timeFormat.format(Calendar.getInstance().time)
        val rect = Rect()
        textPaint.getTextBounds(currentTime, 0, currentTime.length, rect)
        
        // Background for time label
        val labelPadding = 8f
        canvas.drawRect(
            currentTimeX - rect.width() / 2 - labelPadding,
            10f,
            currentTimeX + rect.width() / 2 + labelPadding,
            rect.height() + 20f,
            labelBgPaint
        )
        
        // Time label text
        textPaint.color = textPrimary
        canvas.drawText(currentTime, currentTimeX, rect.height() + 15f, textPaint)
        textPaint.color = textSecondary // Reset
    }
    
    private fun updateCurrentTimePosition() {
        val now = Calendar.getInstance()
        val totalMinutes = (endTime.timeInMillis - startTime.timeInMillis) / (60 * 1000)
        val currentMinutes = (now.timeInMillis - startTime.timeInMillis) / (60 * 1000)
        
        currentTimeX = (currentMinutes.toFloat() / totalMinutes.toFloat()) * width
    }
    
    /**
     * Start auto-update every minute
     */
    fun startAutoUpdate() {
        handler.postDelayed(updateRunnable, 60000) // Update every minute
    }
    
    /**
     * Stop auto-update
     */
    fun stopAutoUpdate() {
        handler.removeCallbacks(updateRunnable)
    }
    
    private val updateRunnable = object : Runnable {
        override fun run() {
            invalidate() // Redraw
            handler.postDelayed(this, 60000)
        }
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        stopAutoUpdate()
    }
}
