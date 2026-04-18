package com.mo.moplayer.ui.widgets.weather

import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet
import android.view.View
import com.mo.moplayer.data.weather.WeatherService

/**
 * Custom Canvas View for Weather 3D Effects
 * 
 * Combines particle system and effects renderer for stunning weather animations
 */
class WeatherCanvas @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {
    
    private val particleSystem = WeatherParticleSystem(context, this) { intensity ->
        effectsRenderer.triggerLightning(intensity)
    }
    private val effectsRenderer = WeatherEffectsRenderer(context, this)
    
    private var animationRunning = false
    private val frameRunnable = object : Runnable {
        override fun run() {
            if (animationRunning) {
                particleSystem.update()
                effectsRenderer.update()
                invalidate()
                postDelayed(this, 16) // ~60 FPS
            }
        }
    }
    
    fun setWeatherCategory(category: WeatherService.WeatherCategory, isDay: Boolean) {
        particleSystem.setWeatherCategory(category, isDay)
        effectsRenderer.setWeatherCategory(category, isDay)
        invalidate()
    }
    
    fun startAnimation() {
        if (!animationRunning) {
            animationRunning = true
            post(frameRunnable)
        }
    }
    
    fun stopAnimation() {
        animationRunning = false
        removeCallbacks(frameRunnable)
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        // Draw effects first (background)
        effectsRenderer.draw(canvas)
        
        // Draw particles on top
        particleSystem.draw(canvas)
    }
    
    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        effectsRenderer.onSizeChanged(w, h)
    }
    
    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        startAnimation()
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        stopAnimation()
    }
}
