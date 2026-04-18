package com.mo.moplayer.ui.widgets.weather

import android.content.Context
import android.graphics.*
import android.view.View
import com.mo.moplayer.data.weather.WeatherService
import kotlin.random.Random

/**
 * Advanced Weather Particle System
 * 
 * Renders realistic weather particles:
 * - Rain drops with trails
 * - Snowflakes with rotation
 * - Moving clouds
 * - Lightning flashes
 */
class WeatherParticleSystem(
    private val context: Context,
    private val view: View,
    private val onLightningFlash: (Float) -> Unit = {}
) {
    private val particles = mutableListOf<Particle>()
    private val particlePool = mutableListOf<Particle>() // Particle pooling for performance
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private var currentCategory = WeatherService.WeatherCategory.CLEAR
    private var isDay = true

    // FX intensity inputs
    private var windSpeedKph: Double = 0.0
    private var windDegree: Int = 0
    private var humidity: Int = 0
    private var precipMm: Double = 0.0
    private var cloud: Int = 0

    // Derived wind vector for particle drift (screen coordinates)
    private var windX: Float = 0f
    private var windY: Float = 1f

    private var targetParticleCount: Int = 0
    
    // Lightning effect
    private var lightningActive = false
    private var lightningAlpha = 0
    private val lightningPaint = Paint().apply {
        color = Color.WHITE
        style = Paint.Style.FILL
    }
    
    companion object {
        private const val MAX_POOL_SIZE = 500
        private val MAX_PARTICLES_BY_QUALITY = mapOf(
            WeatherService.EFFECT_QUALITY_LOW to 42,
            WeatherService.EFFECT_QUALITY_MEDIUM to 96,
            WeatherService.EFFECT_QUALITY_HIGH to 180
        )
        private const val RAIN_SPEED = 18f
        private const val SNOW_SPEED = 4f
        private const val CLOUD_SPEED = 1.5f
        private const val RAIN_ALPHA = 120
        private const val SNOW_ALPHA = 140
    }

    private var effectsQuality = WeatherService.EFFECT_QUALITY_HIGH
    private var reduceMotion = false
    private var disableLightning = false
    
    init {
        // Enable hardware acceleration
        paint.isAntiAlias = true
        paint.isDither = true
    }

    private var scrollOffsetY = 0f
    private var parallaxFactor = 0.15f

    fun setScrollOffset(y: Int) {
        scrollOffsetY = y.toFloat()
    }

    fun setEffectSettings(quality: Int, reduceMotion: Boolean, disableLightning: Boolean) {
        this.effectsQuality = quality.coerceIn(
            WeatherService.EFFECT_QUALITY_OFF,
            WeatherService.EFFECT_QUALITY_HIGH
        )
        this.reduceMotion = reduceMotion
        this.disableLightning = disableLightning
        parallaxFactor = if (reduceMotion) 0f else 0.15f
        targetParticleCount = computeTargetParticleCount()
    }

    fun setWeatherState(
        category: WeatherService.WeatherCategory,
        isDay: Boolean,
        params: com.mo.moplayer.ui.widgets.weather.FullScreenWeatherOverlay.WeatherFxParams
    ) {
        val categoryChanged = this.currentCategory != category || this.isDay != isDay
        this.currentCategory = category
        this.isDay = isDay

        setIntensity(params)

        if (categoryChanged) {
            initializeParticles()
        } else {
            // Smoothly ramp particle count in-place.
            targetParticleCount = computeTargetParticleCount()
        }
    }

    fun setWeatherCategory(category: WeatherService.WeatherCategory, isDay: Boolean) {
        this.currentCategory = category
        this.isDay = isDay
        initializeParticles()
    }
    
    fun cleanup() {
        // Return particles to pool before cleanup
        particlePool.addAll(particles.filter { particlePool.size < MAX_POOL_SIZE })
        particles.clear()
    }
    
    private fun initializeParticles() {
        // Return particles to pool before clearing
        particlePool.addAll(particles.filter { particlePool.size < MAX_POOL_SIZE })
        particles.clear()
        
        targetParticleCount = computeTargetParticleCount()
        val particleCount = targetParticleCount
        
        repeat(particleCount) {
            particles.add(getOrCreateParticle())
        }
    }
    
    /**
     * Get particle from pool or create new one (particle pooling optimization)
     */
    private fun getOrCreateParticle(): Particle {
        return if (particlePool.isNotEmpty()) {
            val particle = particlePool.removeAt(particlePool.lastIndex)
            resetParticle(particle)
            particle
        } else {
            createParticle()
        }
    }
    
    /**
     * Reset particle properties for reuse
     */
    private fun resetParticle(particle: Particle) {
        particle.x = Random.nextFloat() * view.width
        particle.y = Random.nextFloat() * view.height
    }
    
    private fun createParticle(): Particle {
        return when (currentCategory) {
            WeatherService.WeatherCategory.RAINY -> RainDrop(
                x = Random.nextFloat() * view.width,
                y = Random.nextFloat() * view.height,
                speed = RAIN_SPEED + Random.nextFloat() * 5f,
                length = 20f + Random.nextFloat() * 10f
            )
            WeatherService.WeatherCategory.SNOWY -> Snowflake(
                x = Random.nextFloat() * view.width,
                y = Random.nextFloat() * view.height,
                speed = SNOW_SPEED + Random.nextFloat() * 2f,
                size = 5f + Random.nextFloat() * 6f, // Slightly smaller, more elegant
                rotation = Random.nextFloat() * 360f,
                rotationSpeed = Random.nextFloat() * 2f - 1f
            )
            WeatherService.WeatherCategory.STORMY -> RainDrop(
                x = Random.nextFloat() * view.width,
                y = Random.nextFloat() * view.height,
                speed = RAIN_SPEED * 1.5f + Random.nextFloat() * 8f,
                length = 25f + Random.nextFloat() * 15f,
                isStorm = true
            )
            WeatherService.WeatherCategory.CLOUDY -> CloudParticle(
                x = Random.nextFloat() * view.width,
                y = Random.nextFloat() * view.height * 0.4f, // Lower coverage
                speed = CLOUD_SPEED + Random.nextFloat() * 0.5f,
                size = 120f + Random.nextFloat() * 60f, // Larger, softer
                alpha = 25 + Random.nextInt(35) // Subtler alpha
            )
            WeatherService.WeatherCategory.FOGGY -> FogParticle(
                x = Random.nextFloat() * view.width,
                y = Random.nextFloat() * view.height,
                speed = 0.5f + Random.nextFloat() * 0.3f,
                size = 150f + Random.nextFloat() * 100f,
                alpha = 15 + Random.nextInt(25)
            )
            else -> RainDrop(0f, 0f, 0f, 0f) // Dummy
        }
    }
    
    fun update() {
        // Smoothly ramp particle count towards target.
        if (particles.size < targetParticleCount) {
            val toAdd = minOf(4, targetParticleCount - particles.size)
            repeat(toAdd) { particles.add(getOrCreateParticle()) }
        } else if (particles.size > targetParticleCount) {
            val toRemove = minOf(4, particles.size - targetParticleCount)
            repeat(toRemove) {
                val p = particles.removeAt(particles.lastIndex)
                if (particlePool.size < MAX_POOL_SIZE) particlePool.add(p)
            }
        }

        // Update particles
        particles.forEach { it.update(view.width, view.height) }
        
        // Replace off-screen particles
        particles.forEachIndexed { index, particle ->
            if (particle.isOffScreen(view.width, view.height)) {
                particles[index] = createParticle().apply {
                    reset(view.width, view.height)
                }
            }
        }
        
        // Lightning effect for storms (skip when disabled)
        if (currentCategory == WeatherService.WeatherCategory.STORMY && !disableLightning) {
            val lightningChance = (0.0025f + (precipMm.toFloat().coerceAtMost(20f) / 20f) * 0.01f)
            if (Random.nextFloat() < lightningChance) {
                triggerLightning()
            }
        }
        if (currentCategory == WeatherService.WeatherCategory.STORMY) {
            updateLightning()
        }
    }
    
    fun draw(canvas: Canvas) {
        // Apply parallax effect (0 when reduce motion; 15% speed otherwise)
        canvas.save()
        canvas.translate(0f, -scrollOffsetY * parallaxFactor)
        
        // Draw particles
        particles.forEach { it.draw(canvas, paint) }
        
        
        canvas.restore()

        // Draw lightning (fixed to screen, no parallax) - softer alpha 80-120
        if (lightningActive && lightningAlpha > 0) {
            lightningPaint.alpha = lightningAlpha.coerceAtMost(100) // Lower max alpha not to blind user
            canvas.drawRect(0f, 0f, view.width.toFloat(), view.height.toFloat(), lightningPaint)
        }
    }

    
    private fun triggerLightning() {
        lightningActive = true
        lightningAlpha = 100
        onLightningFlash(0.6f + Random.nextFloat() * 0.4f)
    }
    
    private fun updateLightning() {
        if (lightningActive) {
            lightningAlpha -= 20 // Slower fade out
            if (lightningAlpha <= 0) {
                lightningAlpha = 0
                lightningActive = false
            }
        }
    }
    
    // Particle Types
    
    abstract inner class Particle(
        var x: Float,
        var y: Float,
        var speed: Float
    ) {
        abstract fun update(width: Int, height: Int)
        abstract fun draw(canvas: Canvas, paint: Paint)
        abstract fun isOffScreen(width: Int, height: Int): Boolean
        abstract fun reset(width: Int, height: Int)
    }
    
    inner class RainDrop(
        x: Float,
        y: Float,
        speed: Float,
        private val length: Float,
        private val isStorm: Boolean = false
    ) : Particle(x, y, speed) {
        
        override fun update(width: Int, height: Int) {
            y += speed
            // Wind drift (outer-class windX)
            x += (if (isStorm) speed * 0.35f else speed * 0.18f) * windX
            y += (if (isStorm) speed * 0.12f else speed * 0.06f) * (windY - 1f)
        }
        
        override fun draw(canvas: Canvas, paint: Paint) {
            // HTC Sense: crisp but subtle rain lines
            paint.color = Color.argb(if (isStorm) 100 else 80, 200, 230, 255)
            paint.strokeWidth = if (isStorm) 2.5f else 1.5f
            canvas.drawLine(x, y, x + length * 0.15f * windX, y + length, paint)
        }
        
        override fun isOffScreen(width: Int, height: Int): Boolean {
            return y > height || x > width || x < 0
        }
        
        override fun reset(width: Int, height: Int) {
            y = -length
            x = Random.nextFloat() * width
        }
    }
    
    inner class Snowflake(
        x: Float,
        y: Float,
        speed: Float,
        private val size: Float,
        private var rotation: Float,
        private val rotationSpeed: Float
    ) : Particle(x, y, speed) {
        
        private val swaySpeed = Random.nextFloat() * 0.03f
        private var swayPhase = Random.nextFloat() * Math.PI.toFloat() * 2
        
        override fun update(width: Int, height: Int) {
            y += speed
            swayPhase += swaySpeed
            x += kotlin.math.sin(swayPhase.toDouble()).toFloat() * 1.5f
            x += windX * (0.6f + speed * 0.05f)
            rotation += rotationSpeed
        }
        
        override fun draw(canvas: Canvas, paint: Paint) {
            paint.color = Color.argb(SNOW_ALPHA, 255, 255, 255)
            paint.style = Paint.Style.FILL
            
            // Soft blur for depth
            if (size > 8f && !reduceMotion) {
                paint.maskFilter = BlurMaskFilter(2f, BlurMaskFilter.Blur.NORMAL)
            } else {
                paint.maskFilter = null
            }

            canvas.save()
            canvas.translate(x, y)
            canvas.rotate(rotation)
            
            // Draw simple soft circle for distant snow, 6-pointed for close
            if (size < 6f) {
                canvas.drawCircle(0f, 0f, size * 0.6f, paint)
            } else {
                for (i in 0..5) {
                    canvas.rotate(60f)
                    canvas.drawLine(0f, 0f, 0f, size, paint)
                }
            }
            
            canvas.restore()
            paint.maskFilter = null
        }
        
        override fun isOffScreen(width: Int, height: Int): Boolean {
            return y > height + size
        }
        
        override fun reset(width: Int, height: Int) {
            y = -size
            x = Random.nextFloat() * width
        }
    }
    
    inner class CloudParticle(
        x: Float,
        y: Float,
        speed: Float,
        private val size: Float,
        private val alpha: Int
    ) : Particle(x, y, speed) {
        
        override fun update(width: Int, height: Int) {
            x += speed + windX * 0.5f + (windSpeedKph.toFloat().coerceAtMost(40f) / 40f) * 0.6f
        }
        
        override fun draw(canvas: Canvas, paint: Paint) {
            paint.color = Color.argb(alpha, 240, 245, 255)
            paint.style = Paint.Style.FILL
            
            // Critical for HTC Sense feel: Soft, blurred clouds
            paint.maskFilter = BlurMaskFilter(size * 0.4f, BlurMaskFilter.Blur.NORMAL)
            
            canvas.drawCircle(x, y, size, paint)
            // Add some "puff" variations
            canvas.drawCircle(x + size * 0.6f, y - size * 0.2f, size * 0.7f, paint)
            
            paint.maskFilter = null
        }
        
        override fun isOffScreen(width: Int, height: Int): Boolean {
            return x > width + size * 2
        }
        
        override fun reset(width: Int, height: Int) {
            x = -size * 2
            y = Random.nextFloat() * height * 0.4f
        }
    }
    
    inner class FogParticle(
        x: Float,
        y: Float,
        speed: Float,
        private val size: Float,
        private val alpha: Int
    ) : Particle(x, y, speed) {
        
        private var phase = Random.nextFloat() * Math.PI.toFloat() * 2
        
        override fun update(width: Int, height: Int) {
            x += speed + windX * 0.35f
            phase += 0.005f
            y += kotlin.math.sin(phase.toDouble()).toFloat() * 0.8f
        }
        
        override fun draw(canvas: Canvas, paint: Paint) {
            paint.color = Color.argb(alpha, 230, 230, 235)
            paint.style = Paint.Style.FILL
            
            // Heavy blur for fog
            paint.maskFilter = BlurMaskFilter(size * 0.5f, BlurMaskFilter.Blur.NORMAL)
            
            canvas.drawCircle(x, y, size, paint)
            paint.maskFilter = null
        }
        
        override fun isOffScreen(width: Int, height: Int): Boolean {
            return x > width + size * 2
        }
        
        override fun reset(width: Int, height: Int) {
            x = -size * 2
            y = Random.nextFloat() * height
        }
    }

    private fun setIntensity(params: com.mo.moplayer.ui.widgets.weather.FullScreenWeatherOverlay.WeatherFxParams) {
        windSpeedKph = params.windSpeedKph
        windDegree = params.windDegree
        humidity = params.humidity
        precipMm = params.precipMm
        cloud = params.cloud

        // Convert degrees to screen drift vector; keep a subtle minimum downward component.
        val rad = Math.toRadians(windDegree.toDouble())
        windX = kotlin.math.sin(rad).toFloat()
        windY = kotlin.math.cos(rad).toFloat()
        if (windY < 0.15f) windY = 0.15f

        targetParticleCount = computeTargetParticleCount()
    }

    private fun computeTargetParticleCount(): Int {
        val maxForQuality = MAX_PARTICLES_BY_QUALITY[effectsQuality] ?: 400

        val cloudFactor = (cloud / 100f).coerceIn(0f, 1f)
        val humidityFactor = (humidity / 100f).coerceIn(0f, 1f)
        val precipFactor = (precipMm.toFloat() / 6f).coerceIn(0f, 1.5f)
        val windFactor = (windSpeedKph.toFloat() / 40f).coerceIn(0f, 1.5f)

        val raw = when (currentCategory) {
            WeatherService.WeatherCategory.RAINY -> (26 + 42 * precipFactor + 10 * windFactor).toInt()
            WeatherService.WeatherCategory.STORMY -> (42 + 54 * precipFactor + 14 * windFactor).toInt()
            WeatherService.WeatherCategory.SNOWY -> (24 + 34 * (precipFactor.coerceIn(0f, 1.2f)) + 8 * windFactor).toInt()
            WeatherService.WeatherCategory.CLOUDY -> (8 + 18 * cloudFactor).toInt()
            WeatherService.WeatherCategory.FOGGY -> (10 + 20 * humidityFactor).toInt()
            else -> 0
        }
        return raw.coerceIn(0, maxForQuality)
    }
}
