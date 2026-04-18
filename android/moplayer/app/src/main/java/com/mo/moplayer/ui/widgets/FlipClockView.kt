package com.mo.moplayer.ui.widgets

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.widget.LinearLayout
import android.widget.TextView
import com.mo.moplayer.R
import java.util.*

/**
 * HTC-style Flip Clock Widget
 * 
 * Displays time in a flip-card style with animation effects
 */
class FlipClockView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : LinearLayout(context, attrs, defStyleAttr) {
    
    private var tvHour1: TextView
    private var tvHour2: TextView
    private var tvMinute1: TextView
    private var tvMinute2: TextView
    private var tvColon: TextView
    
    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false
    private var use24Hour = true
    
    private var lastHour1 = ""
    private var lastHour2 = ""
    private var lastMinute1 = ""
    private var lastMinute2 = ""
    
    init {
        LayoutInflater.from(context).inflate(R.layout.widget_flip_clock, this, true)
        
        tvHour1 = findViewById(R.id.tvHour1)
        tvHour2 = findViewById(R.id.tvHour2)
        tvMinute1 = findViewById(R.id.tvMinute1)
        tvMinute2 = findViewById(R.id.tvMinute2)
        tvColon = findViewById(R.id.tvColon)
        
        updateTime()
    }
    
    fun start() {
        if (!isRunning) {
            isRunning = true
            handler.post(updateRunnable)
        }
    }
    
    fun stop() {
        isRunning = false
        handler.removeCallbacksAndMessages(null)
    }
    
    fun setUse24HourFormat(use24Hour: Boolean) {
        this.use24Hour = use24Hour
        updateTime()
    }
    
    private val updateRunnable = object : Runnable {
        override fun run() {
            updateTime()
            blinkColon()
            if (isRunning) {
                handler.postDelayed(this, 1000)
            }
        }
    }
    
    private fun updateTime() {
        val calendar = Calendar.getInstance()
        var hour = calendar.get(Calendar.HOUR_OF_DAY)
        
        if (!use24Hour) {
            hour = calendar.get(Calendar.HOUR)
            if (hour == 0) hour = 12
        }
        
        val minute = calendar.get(Calendar.MINUTE)
        
        val hourStr = String.format("%02d", hour)
        val minuteStr = String.format("%02d", minute)
        
        val hour1 = hourStr[0].toString()
        val hour2 = hourStr[1].toString()
        val minute1 = minuteStr[0].toString()
        val minute2 = minuteStr[1].toString()
        
        // Animate changed digits
        if (hour1 != lastHour1) {
            animateDigitChange(tvHour1, hour1)
            lastHour1 = hour1
        }
        
        if (hour2 != lastHour2) {
            animateDigitChange(tvHour2, hour2)
            lastHour2 = hour2
        }
        
        if (minute1 != lastMinute1) {
            animateDigitChange(tvMinute1, minute1)
            lastMinute1 = minute1
        }
        
        if (minute2 != lastMinute2) {
            animateDigitChange(tvMinute2, minute2)
            lastMinute2 = minute2
        }
    }
    
    private fun animateDigitChange(textView: TextView, newValue: String) {
        // Enhanced HTC Sense flip animation with perspective
        textView.cameraDistance = 8000 * context.resources.displayMetrics.density
        
        // Flip out (top half falls forward)
        val flipOut = ObjectAnimator.ofFloat(textView, "rotationX", 0f, -90f).apply {
            duration = 200
            interpolator = AccelerateInterpolator(1.5f)
        }
        
        // Update text at midpoint
        flipOut.addListener(object : android.animation.AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: android.animation.Animator) {
                textView.text = newValue
            }
        })
        
        // Flip in (bottom half follows)
        val flipIn = ObjectAnimator.ofFloat(textView, "rotationX", 90f, 0f).apply {
            duration = 200
            interpolator = DecelerateInterpolator(1.5f)
        }
        
        // Scale animation for depth effect
        val scaleDown = ObjectAnimator.ofPropertyValuesHolder(
            textView,
            android.animation.PropertyValuesHolder.ofFloat("scaleX", 1f, 0.95f),
            android.animation.PropertyValuesHolder.ofFloat("scaleY", 1f, 0.95f)
        ).apply {
            duration = 200
        }
        
        val scaleUp = ObjectAnimator.ofPropertyValuesHolder(
            textView,
            android.animation.PropertyValuesHolder.ofFloat("scaleX", 0.95f, 1f),
            android.animation.PropertyValuesHolder.ofFloat("scaleY", 0.95f, 1f)
        ).apply {
            duration = 200
        }
        
        AnimatorSet().apply {
            play(flipOut).with(scaleDown)
            play(flipIn).with(scaleUp).after(flipOut)
            start()
        }
    }
    
    private var colonVisible = true
    
    private fun blinkColon() {
        colonVisible = !colonVisible
        tvColon.alpha = if (colonVisible) 1f else 0.3f
    }
    
    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        start()
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        stop()
    }
}
