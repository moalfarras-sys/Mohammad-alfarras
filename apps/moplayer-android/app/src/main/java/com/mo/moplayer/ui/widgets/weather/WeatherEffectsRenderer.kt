package com.mo.moplayer.ui.widgets.weather

import android.content.Context
import android.graphics.*
import android.graphics.Path
import android.graphics.PorterDuffXfermode
import android.view.View
import com.mo.moplayer.data.weather.WeatherService
import java.util.Calendar
import kotlin.math.sin
import kotlin.math.cos

/**
 * Advanced Weather Effects Renderer
 * 
 * Renders stunning visual effects:
 * - Dynamic lighting based on time of day
 * - Animated gradients for sky
 * - Sun/moon glow effects
 * - Special effects (rain shimmer, snow sparkle)
 */
class WeatherEffectsRenderer(
    private val context: Context,
    private val view: View,
    private val drawCelestialBodies: Boolean = true
) {
    data class WeatherVisualPalette(
        val topColor: Int,
        val midColor: Int,
        val horizonColor: Int,
        val glowColor: Int,
        val overlayAlpha: Int,
        val particleTint: Int
    )

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val beamPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        xfermode = PorterDuffXfermode(PorterDuff.Mode.ADD)
    }
    private var fromCategory = WeatherService.WeatherCategory.CLEAR
    private var toCategory = WeatherService.WeatherCategory.CLEAR
    private var fromIsDay = true
    private var toIsDay = true
    private var transitionT = 1f
    private var animationPhase = 0f

    private var fxParams = com.mo.moplayer.ui.widgets.weather.FullScreenWeatherOverlay.WeatherFxParams()
    private var effectsQuality = WeatherService.EFFECT_QUALITY_HIGH
    private var reduceMotion = false
    private var disableLightning = false
    private var timeBand = TimeBand.DAY

    // Sun/Moon properties
    private var celestialX = 0f
    private var celestialY = 0f
    private val celestialRadius = 40f
    
    // Colors
    private val sunColor = Color.rgb(255, 215, 0) // Gold
    private val moonColor = Color.rgb(240, 240, 255) // Silver
    private var accentPrimaryColor = Color.parseColor("#111FA2")
    private var accentHorizonColor = Color.parseColor("#FFDE42")

    private enum class TimeBand {
        MORNING,
        DAY,
        EVENING,
        NIGHT
    }
    
    fun setWeatherCategory(category: WeatherService.WeatherCategory, isDay: Boolean) {
        val changed = (toCategory != category) || (toIsDay != isDay)
        if (changed) {
            fromCategory = toCategory
            fromIsDay = toIsDay
            toCategory = category
            toIsDay = isDay
            transitionT = 0f
        }
        updateCelestialPosition()
    }

    fun setWeatherState(
        category: WeatherService.WeatherCategory,
        isDay: Boolean,
        params: com.mo.moplayer.ui.widgets.weather.FullScreenWeatherOverlay.WeatherFxParams
    ) {
        fxParams = params
        timeBand = resolveTimeBand(isDay)
        setWeatherCategory(category, isDay)
    }

    fun setEffectSettings(quality: Int, reduceMotion: Boolean, disableLightning: Boolean) {
        this.effectsQuality = quality.coerceIn(
            WeatherService.EFFECT_QUALITY_OFF,
            WeatherService.EFFECT_QUALITY_HIGH
        )
        this.reduceMotion = reduceMotion
        this.disableLightning = disableLightning
    }

    fun setAccentPalette(primaryColor: Int, horizonColor: Int) {
        accentPrimaryColor = primaryColor
        accentHorizonColor = horizonColor
    }
    
    private fun updateCelestialPosition() {
        // Position sun/moon in top right corner
        celestialX = view.width * 0.85f
        celestialY = view.height * 0.15f
    }
    
    fun update() {
        animationPhase += if (reduceMotion) 0.004f else 0.008f
        if (animationPhase > Math.PI * 2) {
            animationPhase = 0f
        }
        if (transitionT < 1f) {
            transitionT = (transitionT + 0.03f).coerceAtMost(1f) // ~600ms smooth crossfade
        }
    }
    
    // --- New Dazzling Effects ---
    
    var lightingIntensity = 0f // 0f..1f for lightning flash
    
    /**
     * Trigger a lightning flash.
     * @param intensity 0.0 to 1.0
     */
    fun triggerLightning(intensity: Float) {
        lightingIntensity = intensity.coerceIn(0f, 1f)
    }

    private fun drawLightningFlash(canvas: Canvas) {
        if (disableLightning) return
        if (lightingIntensity > 0.01f) {
        val flashAlpha = (lightingIntensity * 70).toInt().coerceAtMost(70)
            val flashColor = Color.argb(flashAlpha, 220, 240, 255)
            canvas.drawColor(flashColor)
            lightingIntensity *= 0.85f
        }
    }

    private fun drawGodRays(canvas: Canvas, alphaMul: Float) {
        if (alphaMul <= 0f) return
        if (effectsQuality == WeatherService.EFFECT_QUALITY_LOW) return

        val rayCount = if (effectsQuality == WeatherService.EFFECT_QUALITY_MEDIUM) 3 else 4
        val time = animationPhase
        
        canvas.save()
        canvas.translate(celestialX, celestialY)
        
        // Draw rotating rays
        for (i in 0 until rayCount) {
            canvas.save()
            val angle = (i * (360f / rayCount)) + (time * 2.5f)
            canvas.rotate(angle)
            
            // Pulsing length and width - increased intensity
            val pulse = 1.02f + 0.12f * sin(time * 1.4f + i)
            val rayLen = view.width * 0.92f * pulse
            val rayWidth = 72f * pulse
            
            val beamGradient = LinearGradient(
                0f, 0f, 
                rayLen, 0f,
                intArrayOf(
                    Color.argb((34 * alphaMul).toInt(), 255, 240, 180),
                    Color.argb((14 * alphaMul).toInt(), 255, 255, 230),
                    Color.argb(0, 255, 255, 255) // Fade out
                ),
                floatArrayOf(0f, 0.6f, 1f),
                Shader.TileMode.CLAMP
            )
            
            beamPaint.shader = beamGradient
            
            // Draw a subtle trapazoid/triangle for the beam
            val path = Path()
            path.moveTo(0f, -rayWidth * 0.15f)
            path.lineTo(rayLen, -rayWidth)
            path.lineTo(rayLen, rayWidth)
            path.lineTo(0f, rayWidth * 0.1f)
            path.close()
            
            canvas.drawPath(path, beamPaint)
            canvas.restore()
        }
        
        canvas.restore()
    }

    private fun drawFrostVignette(canvas: Canvas, alphaMul: Float) {
        if (alphaMul <= 0f) return
        
        // Vignette gradient: Clear center -> Icy Blue edges
        val w = view.width.toFloat()
        val h = view.height.toFloat()
        val radius = Math.max(w, h) * 0.8f
        
        val vignette = RadialGradient(
            w / 2, h / 2, radius,
            intArrayOf(
                Color.argb(0, 255, 255, 255),
                Color.argb((60 * alphaMul).toInt(), 200, 225, 255)
            ),
            floatArrayOf(0.4f, 1f),
            Shader.TileMode.CLAMP
        )
        
        paint.shader = vignette
        paint.style = Paint.Style.FILL
        canvas.drawRect(0f, 0f, w, h, paint)
        paint.shader = null
    }

    fun draw(canvas: Canvas) {
        // 1. Draw background gradient (Base)
        drawBackgroundGradient(canvas)
        
        val t = easeInOut(transitionT)
        val fromAlpha = (1f - t)
        val toAlpha = t
        
        // 2. Draw God Rays (if Sunny/Clear Day)
        if (fromCategory == WeatherService.WeatherCategory.CLEAR && fromIsDay) drawGodRays(canvas, fromAlpha)
        if (toCategory == WeatherService.WeatherCategory.CLEAR && toIsDay) drawGodRays(canvas, toAlpha)
        
        // 3. Draw Celestial Bodies
        if (drawCelestialBodies) {
            drawCelestialBody(canvas)
        }
        
        // 4. Draw Frost/Fog Vignette
        if (fromCategory == WeatherService.WeatherCategory.SNOWY || fromCategory == WeatherService.WeatherCategory.FOGGY) 
            drawFrostVignette(canvas, fromAlpha)
        if (toCategory == WeatherService.WeatherCategory.SNOWY || toCategory == WeatherService.WeatherCategory.FOGGY) 
            drawFrostVignette(canvas, toAlpha)
            
        // 5. Draw Special Effects (Rain/Snow particles handled by ParticleSystem, but shimmer/glow here)
        drawSpecialEffects(canvas)
        
        // 6. Lightning Flash Overlay (Topmost)
        drawLightningFlash(canvas)
    }
    
    private fun drawBackgroundGradient(canvas: Canvas) {
        val t = easeInOut(transitionT)
        val a = getGradientColors(fromCategory, fromIsDay)
        val b = getGradientColors(toCategory, toIsDay)
        val blended = blendGradients(a, b, t)
        
        // Create multi-color gradient with smooth transitions
        val gradient = LinearGradient(
            0f, 0f,
            0f, view.height.toFloat(),
            blended.colors,
            blended.positions,
            Shader.TileMode.CLAMP
        )
        
        // Add animated opacity for more dynamic feel
        val intensityAlphaBoost =
            ((fxParams.cloud.coerceIn(0, 100) / 100f) * 4f + (fxParams.humidity.coerceIn(0, 100) / 100f) * 3f).toInt()
        val dynamicAlpha = (blended.baseAlpha + intensityAlphaBoost + sin(animationPhase * 0.35) * 4).toInt()
        paint.shader = gradient
        paint.alpha = dynamicAlpha.coerceIn(0, 18)
        canvas.drawRect(0f, 0f, view.width.toFloat(), view.height.toFloat(), paint)
        paint.shader = null
        paint.alpha = 255
    }
    
    private data class GradientData(
        val colors: IntArray,
        val positions: FloatArray,
        val baseAlpha: Int
    )
    
    private fun getGradientColors(category: WeatherService.WeatherCategory, isDay: Boolean): GradientData {
        val palette = resolvePalette(category, isDay)
        return GradientData(
            colors = intArrayOf(
                palette.topColor,
                palette.midColor,
                blendColor(palette.horizonColor, Color.WHITE, if (isDay) 0.12f else 0.04f),
                palette.horizonColor
            ),
            positions = if (category == WeatherService.WeatherCategory.STORMY) {
                floatArrayOf(0f, 0.32f, 0.76f, 1f)
            } else {
                floatArrayOf(0f, 0.42f, 0.82f, 1f)
            },
            baseAlpha = palette.overlayAlpha
        )
    }

    private fun resolvePalette(category: WeatherService.WeatherCategory, isDay: Boolean): WeatherVisualPalette {
        return when (category) {
            WeatherService.WeatherCategory.CLEAR -> {
                if (isDay) {
                    val morningOrEvening = timeBand == TimeBand.MORNING || timeBand == TimeBand.EVENING
                    val horizon = if (morningOrEvening) Color.parseColor("#F0A45E") else accentHorizonColor
                    val mid = if (morningOrEvening) {
                        blendColor(accentPrimaryColor, Color.parseColor("#7A4DD8"), 0.36f)
                    } else {
                        blendColor(accentPrimaryColor, Color.parseColor("#4571E6"), 0.4f)
                    }
                    WeatherVisualPalette(
                        topColor = accentPrimaryColor,
                        midColor = mid,
                        horizonColor = horizon,
                        glowColor = blendColor(horizon, Color.WHITE, 0.16f),
                        overlayAlpha = if (morningOrEvening) 20 else 18,
                        particleTint = Color.parseColor("#DAE8FF")
                    )
                } else {
                    WeatherVisualPalette(
                        topColor = Color.parseColor("#091126"),
                        midColor = Color.parseColor("#15224D"),
                        horizonColor = Color.parseColor("#334A7D"),
                        glowColor = Color.parseColor("#9FB5FF"),
                        overlayAlpha = 20,
                        particleTint = Color.parseColor("#DCE4FF")
                    )
                }
            }
            WeatherService.WeatherCategory.CLOUDY -> WeatherVisualPalette(
                topColor = Color.parseColor("#243959"),
                midColor = Color.parseColor("#4A607D"),
                horizonColor = Color.parseColor("#98A6B6"),
                glowColor = Color.parseColor("#CAD7EA"),
                overlayAlpha = 18,
                particleTint = Color.parseColor("#DEEAF7")
            )
            WeatherService.WeatherCategory.RAINY -> WeatherVisualPalette(
                topColor = Color.parseColor("#16233D"),
                midColor = Color.parseColor("#27405E"),
                horizonColor = Color.parseColor("#5C799B"),
                glowColor = Color.parseColor("#8CAEDF"),
                overlayAlpha = 18,
                particleTint = Color.parseColor("#B7D5FF")
            )
            WeatherService.WeatherCategory.STORMY -> WeatherVisualPalette(
                topColor = Color.parseColor("#0C1224"),
                midColor = Color.parseColor("#1C2746"),
                horizonColor = Color.parseColor("#324261"),
                glowColor = Color.parseColor("#A9BCFF"),
                overlayAlpha = 22,
                particleTint = Color.parseColor("#C6D4EF")
            )
            WeatherService.WeatherCategory.SNOWY -> WeatherVisualPalette(
                topColor = Color.parseColor("#B4C7DF"),
                midColor = Color.parseColor("#DCE8F6"),
                horizonColor = Color.parseColor("#F7F9FF"),
                glowColor = Color.WHITE,
                overlayAlpha = 28,
                particleTint = Color.WHITE
            )
            WeatherService.WeatherCategory.FOGGY -> WeatherVisualPalette(
                topColor = if (isDay) Color.parseColor("#758392") else Color.parseColor("#2A3444"),
                midColor = if (isDay) Color.parseColor("#A6B0BB") else Color.parseColor("#556274"),
                horizonColor = if (isDay) Color.parseColor("#DCE2E8") else Color.parseColor("#7D8A9C"),
                glowColor = Color.parseColor("#EDF2F8"),
                overlayAlpha = 36,
                particleTint = Color.parseColor("#EFF4F8")
            )
        }
    }

    private fun blendGradients(a: GradientData, b: GradientData, t: Float): GradientData {
        val count = minOf(a.colors.size, b.colors.size)
        val colors = IntArray(count) { i -> lerpColor(a.colors[i], b.colors[i], t) }
        val positions = if (a.positions.size == b.positions.size) b.positions else FloatArray(count) { i ->
            (i.toFloat() / (count - 1).coerceAtLeast(1))
        }
        val baseAlpha = lerpInt(a.baseAlpha, b.baseAlpha, t)
        return GradientData(colors = colors, positions = positions, baseAlpha = baseAlpha)
    }
    
    private fun drawCelestialBody(canvas: Canvas) {
        val t = easeInOut(transitionT)
        val showFrom = !isOvercast(fromCategory)
        val showTo = !isOvercast(toCategory)
        if (!showFrom && !showTo) return

        // Prefer target (to) for sun/moon type; fade in/out across transitions.
        val color = if (toIsDay) sunColor else moonColor
        val glowRadius = celestialRadius * 2.5f
        
        // Draw glow
        val pulseScale = 1f + sin(animationPhase) * 0.1f
        val currentGlowRadius = glowRadius * pulseScale

        val alphaMul = when {
            showFrom && showTo -> 1f
            showFrom && !showTo -> (1f - t)
            !showFrom && showTo -> t
            else -> 0f
        }
        if (alphaMul <= 0f) return
        
        val glowGradient = RadialGradient(
            celestialX, celestialY, currentGlowRadius,
            intArrayOf(
                Color.argb((60 * alphaMul).toInt(), Color.red(color), Color.green(color), Color.blue(color)),
                Color.argb((20 * alphaMul).toInt(), Color.red(color), Color.green(color), Color.blue(color)),
                Color.argb(0, Color.red(color), Color.green(color), Color.blue(color))
            ),
            floatArrayOf(0f, 0.5f, 1f),
            Shader.TileMode.CLAMP
        )
        
        paint.shader = glowGradient
        canvas.drawCircle(celestialX, celestialY, currentGlowRadius, paint)
        paint.shader = null
        
        // Draw celestial body
        if (toIsDay) {
            // Sun with rays
            drawSun(canvas, alphaMul)
        } else {
            // Moon with craters
            drawMoon(canvas, alphaMul)
        }
    }
    
    private fun drawSun(canvas: Canvas, alphaMul: Float) {
        // Draw sun rays - Longer and more layered for "God Ray" effect
        paint.color = Color.argb((80 * alphaMul).toInt(), 255, 230, 150)
        paint.strokeWidth = 4f
        
        val rayCount = 16 // More rays
        val rayLength = celestialRadius * 1.5f // Longer rays
        
        for (i in 0 until rayCount) {
            val angle = (i * 360f / rayCount + animationPhase * 15) * Math.PI / 180
            val startX = celestialX + cos(angle).toFloat() * celestialRadius
            val startY = celestialY + sin(angle).toFloat() * celestialRadius
            val endX = celestialX + cos(angle).toFloat() * (celestialRadius + rayLength)
            val endY = celestialY + sin(angle).toFloat() * (celestialRadius + rayLength)
            
            canvas.drawLine(startX, startY, endX, endY, paint)
        }
        
        // Draw sun core with multi-layer glow
        val sunGradient = RadialGradient(
            celestialX, celestialY, celestialRadius * 1.8f,
            intArrayOf(
                Color.argb((255 * alphaMul).toInt(), 255, 255, 220), // Core
                Color.argb((180 * alphaMul).toInt(), 255, 220, 100), // Mid
                Color.argb(0, 255, 200, 50)  // Outer
            ),
            floatArrayOf(0f, 0.4f, 1f),
            Shader.TileMode.CLAMP
        )
        
        paint.shader = sunGradient
        paint.style = Paint.Style.FILL
        canvas.drawCircle(celestialX, celestialY, celestialRadius * 1.8f, paint)
        paint.shader = null
    }
    
    private fun drawMoon(canvas: Canvas, alphaMul: Float) {
        // Draw Halo
        paint.style = Paint.Style.FILL
        val haloGradient = RadialGradient(
            celestialX, celestialY, celestialRadius * 2.2f,
            intArrayOf(
                Color.argb((60 * alphaMul).toInt(), 200, 220, 255),
                Color.argb(0, 200, 220, 255)
            ),
            floatArrayOf(0.4f, 1f),
            Shader.TileMode.CLAMP
        )
        paint.shader = haloGradient
        canvas.drawCircle(celestialX, celestialY, celestialRadius * 2.2f, paint)
        paint.shader = null

        // Draw moon body
        paint.color = Color.argb((255 * alphaMul).toInt(), 230, 230, 240)
        canvas.drawCircle(celestialX, celestialY, celestialRadius, paint)
        
        // Draw craters (subtle shadows)
        paint.color = Color.argb((50 * alphaMul).toInt(), 160, 160, 180)
        canvas.drawCircle(celestialX - 10, celestialY - 5, 9f, paint)
        canvas.drawCircle(celestialX + 12, celestialY + 8, 7f, paint)
        canvas.drawCircle(celestialX + 4, celestialY - 14, 5f, paint)
        
        // Add shimmer effect
        val shimmerAlpha = (100 + sin(animationPhase * 2) * 50).toInt()
        paint.color = Color.argb((shimmerAlpha * alphaMul).toInt(), 255, 255, 255)
        canvas.drawCircle(celestialX - celestialRadius * 0.35f, celestialY - celestialRadius * 0.35f, 
                         celestialRadius * 0.45f, paint)
    }
    
    private fun drawSpecialEffects(canvas: Canvas) {
        val t = easeInOut(transitionT)

        // Cross-fade special effects between categories during transitions.
        drawSpecialEffectsForCategory(canvas, fromCategory, (1f - t))
        drawSpecialEffectsForCategory(canvas, toCategory, t)
    }

    private fun drawSpecialEffectsForCategory(canvas: Canvas, category: WeatherService.WeatherCategory, alphaMul: Float) {
        if (alphaMul <= 0f) return
        when (category) {
            WeatherService.WeatherCategory.RAINY -> drawRainShimmer(canvas, alphaMul)
            WeatherService.WeatherCategory.SNOWY -> drawSnowSparkle(canvas, alphaMul)
            WeatherService.WeatherCategory.STORMY -> drawStormDarkness(canvas, alphaMul)
            else -> Unit
        }
    }
    
    private fun drawRainShimmer(canvas: Canvas, alphaMul: Float) {
        val shimmerAlpha = (12 + sin(animationPhase * 2.2f) * 6).toInt()
        paint.color = Color.argb((shimmerAlpha * alphaMul).toInt(), 180, 208, 255)
        paint.style = Paint.Style.FILL
        canvas.drawRect(0f, 0f, view.width.toFloat(), view.height.toFloat(), paint)
    }
    
    private fun drawSnowSparkle(canvas: Canvas, alphaMul: Float) {
        // Sparkling effect for snow
        paint.color = Color.argb((30 * alphaMul).toInt(), 255, 255, 255)
        paint.style = Paint.Style.FILL
        
        // Random sparkles
        val sparkleCount = 20
        for (i in 0 until sparkleCount) {
            val x = (view.width * (i * 0.07f + sin(animationPhase + i) * 0.1f)) % view.width
            val y = (view.height * (i * 0.13f + cos(animationPhase + i) * 0.1f)) % view.height
            val size = 2f + sin(animationPhase * 2 + i) * 1f
            
            paint.alpha = ((100 + sin(animationPhase * 3 + i) * 50) * alphaMul).toInt()
            canvas.drawCircle(x, y, size, paint)
        }
        paint.alpha = 255
    }
    
    private fun drawStormDarkness(canvas: Canvas, alphaMul: Float) {
        paint.color = Color.argb((28 * alphaMul).toInt(), 4, 8, 18)
        paint.style = Paint.Style.FILL
        canvas.drawRect(0f, 0f, view.width.toFloat(), view.height.toFloat(), paint)
    }
    
    fun onSizeChanged(width: Int, height: Int) {
        updateCelestialPosition()
    }

    private fun isOvercast(category: WeatherService.WeatherCategory): Boolean {
        return category == WeatherService.WeatherCategory.CLOUDY ||
            category == WeatherService.WeatherCategory.FOGGY ||
            category == WeatherService.WeatherCategory.STORMY
    }

    private fun lerpInt(a: Int, b: Int, t: Float): Int = (a + (b - a) * t).toInt()

    private fun lerpColor(a: Int, b: Int, t: Float): Int {
        val ar = Color.red(a); val ag = Color.green(a); val ab = Color.blue(a); val aa = Color.alpha(a)
        val br = Color.red(b); val bg = Color.green(b); val bb = Color.blue(b); val ba = Color.alpha(b)
        return Color.argb(
            lerpInt(aa, ba, t),
            lerpInt(ar, br, t),
            lerpInt(ag, bg, t),
            lerpInt(ab, bb, t)
        )
    }

    private fun easeInOut(t: Float): Float {
        val x = t.coerceIn(0f, 1f)
        return x * x * (3 - 2 * x)
    }

    private fun blendColor(from: Int, to: Int, factor: Float): Int {
        val t = factor.coerceIn(0f, 1f)
        return Color.argb(
            lerpInt(Color.alpha(from), Color.alpha(to), t),
            lerpInt(Color.red(from), Color.red(to), t),
            lerpInt(Color.green(from), Color.green(to), t),
            lerpInt(Color.blue(from), Color.blue(to), t)
        )
    }

    private fun resolveTimeBand(isDay: Boolean): TimeBand {
        if (!isDay) return TimeBand.NIGHT
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return when (hour) {
            in 5..8 -> TimeBand.MORNING
            in 17..20 -> TimeBand.EVENING
            else -> TimeBand.DAY
        }
    }
}
