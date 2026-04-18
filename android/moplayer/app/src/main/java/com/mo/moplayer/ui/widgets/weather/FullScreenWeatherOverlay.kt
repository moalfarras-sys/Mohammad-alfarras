package com.mo.moplayer.ui.widgets.weather

import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet
import android.view.Choreographer
import android.view.View
import com.mo.moplayer.data.weather.WeatherService

/** Target frame times by quality: Low=20 FPS (50ms), Medium=25 FPS (40ms), High=30 FPS (33ms) */
private val FRAME_TIME_BY_QUALITY = mapOf(
    WeatherService.EFFECT_QUALITY_LOW to 60L,
    WeatherService.EFFECT_QUALITY_MEDIUM to 48L,
    WeatherService.EFFECT_QUALITY_HIGH to 40L
)

/**
 * Full-Screen Weather Overlay
 * 
 * Displays weather effects across the entire home screen:
 * - Dynamic gradients based on weather conditions
 * - Animated particles (rain, snow, clouds, fog)
 * - Ambient lighting effects
 * - Optimized for 30 FPS on TV devices
 * 
 * Features:
 * - Non-interactive (click-through) overlay
 * - Hardware accelerated rendering
 * - Smart resource management
 * - Smooth weather transitions
 */
class FullScreenWeatherOverlay @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {
    
    private var particleSystem: WeatherParticleSystem
    private var effectsRenderer: WeatherEffectsRenderer
    
    private var animationRunning = false
    private var targetFrameTime = 48L
    private var lastFrameTime = 0L

    private var effectsQuality = WeatherService.EFFECT_QUALITY_MEDIUM
    private var reduceMotion = false
    private var disableLightning = false
    
    private var currentCategory = WeatherService.WeatherCategory.CLEAR
    private var isDay = true
    private var currentParams = WeatherFxParams()
    
    init {
        // Enable hardware acceleration for better performance
        setLayerType(LAYER_TYPE_HARDWARE, null)
        
        // Make overlay non-interactive (click-through)
        isClickable = false
        isFocusable = false
        
        // Initialize weather systems
        particleSystem = WeatherParticleSystem(context, this) { intensity ->
            effectsRenderer.triggerLightning(intensity)
        }
        // Don't draw sun/moon in full screen overlay (only particles and gradients)
        effectsRenderer = WeatherEffectsRenderer(context, this, drawCelestialBodies = false)
        
        // Set initial weather (clear day)
        setWeatherCategory(WeatherService.WeatherCategory.CLEAR, true)
    }
    
    data class WeatherFxParams(
        val windSpeedKph: Double = 0.0,
        val windDegree: Int = 0,
        val humidity: Int = 0,
        val precipMm: Double = 0.0,
        val cloud: Int = 0
    )

    /**
     * Update weather condition and animations
     */
    fun setWeatherCategory(category: WeatherService.WeatherCategory, isDay: Boolean) {
        setWeatherData(category, isDay, currentParams)
    }

    /**
     * Update weather condition + intensity parameters (wind/precip/cloud/humidity).
     */
    fun setWeatherData(category: WeatherService.WeatherCategory, isDay: Boolean, params: WeatherFxParams) {
        this.currentCategory = category
        this.isDay = isDay
        this.currentParams = params

        particleSystem.setWeatherState(category, isDay, params)
        effectsRenderer.setWeatherState(category, isDay, params)

        invalidate()
    }
    
    /**
     * Update scroll offset for parallax effect
     */
    fun setScrollOffset(y: Int) {
        particleSystem.setScrollOffset(y)
        invalidate()
    }

    /**
     * Update effect settings (quality, reduce motion, lightning)
     */
    fun setEffectSettings(quality: Int, reduceMotion: Boolean, disableLightning: Boolean) {
        this.effectsQuality = quality.coerceIn(
            WeatherService.EFFECT_QUALITY_OFF,
            WeatherService.EFFECT_QUALITY_HIGH
        )
        this.reduceMotion = reduceMotion
        this.disableLightning = disableLightning
        targetFrameTime = FRAME_TIME_BY_QUALITY[effectsQuality] ?: 33L
        particleSystem.setEffectSettings(effectsQuality, reduceMotion, disableLightning)
        effectsRenderer.setEffectSettings(effectsQuality, reduceMotion, disableLightning)
        invalidate()
    }

    fun setAccentPalette(primaryColor: Int, horizonColor: Int) {
        effectsRenderer.setAccentPalette(primaryColor, horizonColor)
        invalidate()
    }

    
    /**
     * Start animation loop
     */
    fun startAnimation() {
        if (!animationRunning) {
            animationRunning = true
            scheduleNextFrame()
        }
    }
    
    /**
     * Pause animation to save resources
     */
    fun pauseAnimation() {
        animationRunning = false
    }
    
    /**
     * Stop and cleanup
     */
    fun stopAnimation() {
        animationRunning = false
        particleSystem.cleanup()
    }
    
    private val frameCallback = object : Choreographer.FrameCallback {
        override fun doFrame(frameTimeNanos: Long) {
            val currentTime = System.currentTimeMillis()
            
            // Throttle to 30 FPS for performance
            if (currentTime - lastFrameTime >= targetFrameTime) {
                lastFrameTime = currentTime
                
                // Update animations
                particleSystem.update()
                effectsRenderer.update()
                
                // Trigger redraw
                invalidate()
            }
            
            // Schedule next frame
            if (animationRunning) {
                scheduleNextFrame()
            }
        }
    }
    
    private fun scheduleNextFrame() {
        Choreographer.getInstance().postFrameCallback(frameCallback)
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        // Draw effects (gradients, lighting)
        effectsRenderer.draw(canvas)
        
        // Draw particles (rain, snow, clouds, etc.)
        particleSystem.draw(canvas)
    }
    
    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        
        // Reinitialize particles when size changes
        if (w > 0 && h > 0) {
            particleSystem.setWeatherState(currentCategory, isDay, currentParams)
        }
    }
    
    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        startAnimation()
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        stopAnimation()
    }
    
    override fun onVisibilityChanged(changedView: View, visibility: Int) {
        super.onVisibilityChanged(changedView, visibility)
        
        // Start/pause animation based on visibility
        if (visibility == VISIBLE) {
            startAnimation()
        } else {
            pauseAnimation()
        }
    }
}
