package com.mo.moplayer.ui.widgets

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Rect
import android.graphics.Shader
import android.os.Build
import android.renderscript.Allocation
import android.renderscript.Element
import android.renderscript.RenderScript
import android.renderscript.ScriptIntrinsicBlur
import android.util.AttributeSet
import android.view.Choreographer
import android.view.View
import com.mo.moplayer.util.BackgroundManager
import com.mo.moplayer.util.DevicePerformance
import java.io.File
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

/**
 * Premium Animated Background - Space themes only
 * Supports: Solid Black, Starfield, Galaxy, Nebula, Custom Image
 */
class AnimatedBackground @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    // Current theme
    private var currentTheme = BackgroundManager.THEME_SOLID
    
    // Animation control
    private var animationRunning = false
    private var shouldAnimate = true
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    
    // Paint objects
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val backgroundPaint = Paint()
    private val imagePaint = Paint(Paint.ANTI_ALIAS_FLAG)
    
    // View dimensions
    private var viewWidth = 0f
    private var viewHeight = 0f
    
    // Animation time
    private var animationTime = 0f
    private var tvOptimizationMode = false
    private var cinematicMode = false
    
    // Double buffering
    private var offscreenBitmap: Bitmap? = null
    private var offscreenCanvas: Canvas? = null
    private var bufferNeedsRecreate = true
    private var useOffscreenBuffer: Boolean = true
    private var bufferScale: Float = 1f
    
    // Cached shaders
    private var cachedBackgroundShader: Shader? = null
    private val bitmapSourceRect = Rect()
    private val bitmapDestRect = Rect()
    
    // FPS throttling
    private var targetFrameTime = 33L
    private var lastFrameTime = 0L
    private var staticFrameRendered = false
    
    // Choreographer for smooth animations
    private val frameCallback = object : Choreographer.FrameCallback {
        override fun doFrame(frameTimeNanos: Long) {
            if (animationRunning && shouldAnimate) {
                val currentTime = System.currentTimeMillis()
                if (currentTime - lastFrameTime >= targetFrameTime) {
                    lastFrameTime = currentTime
                    updateAnimation()
                    invalidate()
                }
                Choreographer.getInstance().postFrameCallback(this)
            }
        }
    }
    
    // Premium cyan/ink palette (matching colors.xml)
    private var primaryColor = Color.parseColor("#00E5FF")
    private var secondaryColor = Color.parseColor("#5B7CFF")
    private var accentColor = Color.parseColor("#AFC0FF")
    private var horizonAccentColor = Color.parseColor("#0087A8")
    
    // Space background color (deep ink)
    private val spaceBlack = Color.parseColor("#020510")
    private val solidBlack = Color.parseColor("#05070D")

    // Clean cinematic gradient stops — a rich navy crown easing to near-black so content and the
    // dock stay legible. This is the static base shown whenever there is no city wallpaper.
    private val cinematicTop = Color.parseColor("#0C1B36")
    private val cinematicBottom = Color.parseColor("#04060D")
    
    // Custom background image
    private var customBitmap: Bitmap? = null
    private var blurredBitmap: Bitmap? = null
    private var savedImagePath: String? = null
    
    // Theme data structures
    // Starfield
    private val stars = mutableListOf<Star>()
    data class Star(
        var x: Float,
        var y: Float,
        var z: Float,
        val baseSpeed: Float,
        val size: Float,
        val brightness: Float
    )
    
    // Galaxy
    private val galaxyParticles = mutableListOf<GalaxyParticle>()
    private var galaxyRotation = 0f
    data class GalaxyParticle(
        var angle: Float,
        var distance: Float,
        val armIndex: Int,
        val size: Float,
        val brightness: Float,
        val color: Int
    )
    
    // Nebula
    private val nebulaLayers = mutableListOf<NebulaLayer>()
    data class NebulaLayer(
        var offsetX: Float,
        var offsetY: Float,
        val scale: Float,
        val color: Int,
        val alpha: Float,
        val speedX: Float,
        val speedY: Float
    )

    init {
        setLayerType(LAYER_TYPE_NONE, null)
        val tier = DevicePerformance.tier(context)
        tvOptimizationMode = tier != DevicePerformance.Tier.HIGH
        cinematicMode = tier == DevicePerformance.Tier.HIGH
        targetFrameTime = when (tier) {
            DevicePerformance.Tier.LOW -> 120L
            DevicePerformance.Tier.MEDIUM -> 48L
            DevicePerformance.Tier.HIGH -> 33L
        }
    }

    private fun updateBufferConfig(w: Int = width, h: Int = height) {
        val pixels = w.toLong() * h.toLong()
        bufferScale = when {
            !shouldAnimate || DevicePerformance.isLow(context) -> 0.5f
            tvOptimizationMode && pixels >= 3_500_000L -> 0.5f
            tvOptimizationMode && pixels >= 2_000_000L -> 0.66f
            else -> 1f
        }
        useOffscreenBuffer = true
        bufferNeedsRecreate = true
    }
    
    fun initializeFromSettings(
        customImagePath: String?,
        cityImagePath: String? = null,
        currentTheme: Int,
        particleColor: Int,
    ) {
        this.currentTheme = normalizeTheme(currentTheme)
        setParticleColor(particleColor)

        when {
            this.currentTheme == BackgroundManager.THEME_CUSTOM_IMAGE && !customImagePath.isNullOrEmpty() -> {
                savedImagePath = customImagePath
                loadCustomImageFromFile(customImagePath)
            }
            this.currentTheme == BackgroundManager.THEME_CITY_WALLPAPER && !cityImagePath.isNullOrEmpty() -> {
                savedImagePath = cityImagePath
                loadCustomImageFromFile(cityImagePath, blurAmount = 0)
            }
            else -> initializeTheme(this.currentTheme)
        }
        updateBufferConfig()
    }

    fun setCinematicMode(enabled: Boolean) {
        cinematicMode = enabled
        targetFrameTime = when (DevicePerformance.tier(context)) {
            DevicePerformance.Tier.LOW -> 120L
            DevicePerformance.Tier.MEDIUM -> 48L
            DevicePerformance.Tier.HIGH -> if (enabled) 40L else 33L
        }
        updateBufferConfig()
        initializeTheme(currentTheme)
        invalidate()
    }
    
    /**
     * Normalize legacy theme values to new space-only theme system
     */
    private fun normalizeTheme(theme: Int): Int {
        return when (theme) {
            4, 10 -> BackgroundManager.THEME_CUSTOM_IMAGE
            11 -> BackgroundManager.THEME_CITY_WALLPAPER
            // Animated space themes (starfield / galaxy / nebula) were retired: they hurt
            // performance on weak TV boxes and read as visual noise. They now resolve to the
            // clean static cinematic gradient. Custom image + city wallpaper are kept.
            else -> BackgroundManager.THEME_SOLID
        }
    }
    
    fun setCurrentTheme(theme: Int) {
        val normalizedTheme = normalizeTheme(theme)
        if (currentTheme != normalizedTheme) {
            currentTheme = normalizedTheme
            if (normalizedTheme == BackgroundManager.THEME_CITY_WALLPAPER) {
                val cityWallpaperPath = File(context.filesDir, BackgroundManager.CITY_BG_FILENAME).absolutePath
                if (File(cityWallpaperPath).exists()) {
                    loadCustomImageFromFile(cityWallpaperPath, blurAmount = 0)
                } else {
                    initializeTheme(normalizedTheme)
                }
            } else {
                initializeTheme(normalizedTheme)
            }
            invalidate()
        }
    }

    fun reloadCityWallpaperIfAvailable(): Boolean {
        val cityWallpaperPath = File(context.filesDir, BackgroundManager.CITY_BG_FILENAME).absolutePath
        return if (File(cityWallpaperPath).exists()) {
            savedImagePath = cityWallpaperPath
            currentTheme = BackgroundManager.THEME_CITY_WALLPAPER
            loadCustomImageFromFile(cityWallpaperPath, blurAmount = 0)
            true
        } else {
            false
        }
    }
    
    private fun initializeTheme(theme: Int) {
        // Clear all theme data
        stars.clear()
        galaxyParticles.clear()
        nebulaLayers.clear()
        
        // Initialize theme-specific data
        when (theme) {
            BackgroundManager.THEME_SOLID -> { /* No initialization needed */ }
            BackgroundManager.THEME_STARFIELD -> initStarfield()
            BackgroundManager.THEME_GALAXY -> initGalaxy()
            BackgroundManager.THEME_NEBULA -> initNebula()
            BackgroundManager.THEME_CITY_WALLPAPER -> { /* Image loaded from shared city wallpaper file when available. */ }
        }
    }
    
    fun setParticleColor(color: Int) {
        this.primaryColor = color
        this.secondaryColor = adjustBrightness(color, 0.7f)
        this.accentColor = shiftHue(color)
        initializeTheme(currentTheme)
        invalidate()
    }

    fun setGlowColor(color: Int) {
        this.horizonAccentColor = color
        invalidate()
    }
    
    private fun adjustBrightness(color: Int, factor: Float): Int {
        val r = (Color.red(color) * factor).toInt().coerceIn(0, 255)
        val g = (Color.green(color) * factor).toInt().coerceIn(0, 255)
        val b = (Color.blue(color) * factor).toInt().coerceIn(0, 255)
        return Color.rgb(r, g, b)
    }
    
    private fun shiftHue(color: Int): Int {
        val hsv = FloatArray(3)
        Color.colorToHSV(color, hsv)
        hsv[0] = (hsv[0] + 30) % 360
        return Color.HSVToColor(hsv)
    }
    
    // Custom Image Support
    fun setCustomImage(bitmap: Bitmap?, blurAmount: Int = 8) {
        customBitmap?.recycle()
        if (blurredBitmap !== customBitmap) blurredBitmap?.recycle()
        
        if (bitmap != null) {
            customBitmap = bitmap
            blurredBitmap = if (!cinematicMode && blurAmount > 0) {
                blurBitmap(bitmap, blurAmount)
            } else {
                bitmap
            }
        } else {
            customBitmap = null
            blurredBitmap = null
        }
        invalidate()
    }
    
    fun loadCustomImageFromFile(filePath: String, blurAmount: Int = 8) {
        scope.launch(Dispatchers.IO) {
            try {
                val bitmap = decodeSampledBitmap(filePath)
                if (bitmap != null) {
                    val scaledBitmap = scaleBitmapToFit(bitmap)
                    launch(Dispatchers.Main) {
                        setCustomImage(scaledBitmap, blurAmount)
                    }
                    if (scaledBitmap != bitmap) {
                        bitmap.recycle()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun decodeSampledBitmap(filePath: String): Bitmap? {
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(filePath, options)
        if (options.outWidth <= 0 || options.outHeight <= 0) return null

        val maxDimension = when (DevicePerformance.tier(context)) {
            DevicePerformance.Tier.LOW -> 960
            DevicePerformance.Tier.MEDIUM -> 1440
            DevicePerformance.Tier.HIGH -> 1920
        }
        var sampleSize = 1
        while ((options.outWidth / sampleSize) > maxDimension || (options.outHeight / sampleSize) > maxDimension) {
            sampleSize *= 2
        }

        return BitmapFactory.decodeFile(
            filePath,
            BitmapFactory.Options().apply {
                inSampleSize = sampleSize
                inPreferredConfig = if (DevicePerformance.isLow(context)) Bitmap.Config.RGB_565 else Bitmap.Config.ARGB_8888
            }
        )
    }
    
    private fun scaleBitmapToFit(bitmap: Bitmap): Bitmap {
        if (viewWidth <= 0 || viewHeight <= 0) return bitmap
        
        val scaleX = viewWidth / bitmap.width
        val scaleY = viewHeight / bitmap.height
        val scale = maxOf(scaleX, scaleY)
        val maxTarget = when (DevicePerformance.tier(context)) {
            DevicePerformance.Tier.LOW -> 960f
            DevicePerformance.Tier.MEDIUM -> 1440f
            DevicePerformance.Tier.HIGH -> 1920f
        }
        val memoryScale = minOf(1f, maxTarget / maxOf(bitmap.width, bitmap.height).toFloat())
        val targetScale = minOf(scale, memoryScale).coerceAtLeast(0.1f)
        
        return if (targetScale != 1f) {
            Bitmap.createScaledBitmap(
                bitmap,
                (bitmap.width * targetScale).toInt().coerceAtLeast(1),
                (bitmap.height * targetScale).toInt().coerceAtLeast(1),
                true
            )
        } else {
            bitmap
        }
    }
    
    @Suppress("DEPRECATION")
    private fun blurBitmap(bitmap: Bitmap, radius: Int): Bitmap {
        if (DevicePerformance.isLow(context)) return bitmap
        val safeRadius = radius.coerceIn(1, 12).toFloat()
        
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                bitmap
            } else {
                val output = Bitmap.createBitmap(bitmap.width, bitmap.height, bitmap.config ?: Bitmap.Config.ARGB_8888)
                val renderScript = RenderScript.create(context)
                val input = Allocation.createFromBitmap(renderScript, bitmap)
                val outputAlloc = Allocation.createFromBitmap(renderScript, output)
                val blur = ScriptIntrinsicBlur.create(renderScript, Element.U8_4(renderScript))
                blur.setRadius(safeRadius)
                blur.setInput(input)
                blur.forEach(outputAlloc)
                outputAlloc.copyTo(output)
                renderScript.destroy()
                output
            }
        } catch (e: Exception) {
            bitmap
        }
    }
    
    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        viewWidth = w.toFloat()
        viewHeight = h.toFloat()
        
        initializeTheme(currentTheme)
        updateBufferConfig(w, h)
        cachedBackgroundShader = null
    }
    
    // ===== THEME INITIALIZATION =====
    
    private fun initStarfield() {
        val count = when {
            cinematicMode -> 64
            tvOptimizationMode -> 100
            else -> 200
        }
        for (i in 0 until count) {
            stars.add(Star(
                x = Random.nextFloat() * viewWidth,
                y = Random.nextFloat() * viewHeight,
                z = Random.nextFloat(),
                baseSpeed = Random.nextFloat() * 2f + 1f,
                size = Random.nextFloat() * 2f + 0.5f,
                brightness = Random.nextFloat() * 0.7f + 0.3f
            ))
        }
    }
    
    private fun initGalaxy() {
        val count = when {
            cinematicMode -> 180
            tvOptimizationMode -> 300
            else -> 600
        }
        val arms = 3
        
        // Premium blue/purple galaxy colors
        val galaxyColors = listOf(
            primaryColor,
            secondaryColor,
            accentColor
        )
        
        for (i in 0 until count) {
            val armIndex = i % arms
            val t = Random.nextFloat() * 4f * PI.toFloat()
            val distance = Random.nextFloat() * (viewWidth * 0.4f)
            
            galaxyParticles.add(GalaxyParticle(
                angle = t + (armIndex * 2f * PI.toFloat() / arms),
                distance = distance,
                armIndex = armIndex,
                size = Random.nextFloat() * 2f + 0.5f,
                brightness = (1f - distance / (viewWidth * 0.4f)) * 0.8f + 0.2f,
                color = galaxyColors[armIndex]
            ))
        }
    }
    
    private fun initNebula() {
        // Premium blue/purple nebula colors
        val nebulaColors = listOf(
            primaryColor,
            Color.parseColor("#5B7CFF"),
            secondaryColor
        )
        
        val layerCount = if (cinematicMode) 3 else 5
        for (i in 0 until layerCount) {
            nebulaLayers.add(NebulaLayer(
                offsetX = Random.nextFloat() * viewWidth,
                offsetY = Random.nextFloat() * viewHeight,
                scale = Random.nextFloat() * 0.5f + 0.5f,
                color = nebulaColors[i % 3],
                alpha = if (cinematicMode) Random.nextFloat() * 0.16f + 0.12f else Random.nextFloat() * 0.3f + 0.2f,
                speedX = if (cinematicMode) (Random.nextFloat() - 0.5f) * 0.12f else (Random.nextFloat() - 0.5f) * 0.3f,
                speedY = if (cinematicMode) (Random.nextFloat() - 0.5f) * 0.09f else (Random.nextFloat() - 0.5f) * 0.2f
            ))
        }
    }
    
    // ===== DRAWING =====
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (!shouldAnimate && staticFrameRendered && offscreenBitmap != null && currentTheme != BackgroundManager.THEME_CUSTOM_IMAGE) {
            bitmapDestRect.set(0, 0, width, height)
            canvas.drawBitmap(offscreenBitmap!!, null, bitmapDestRect, null)
            return
        }
        
        // Create or recreate offscreen buffer if needed
        if (useOffscreenBuffer && currentTheme != BackgroundManager.THEME_SOLID) {
            val bufferW = (width * bufferScale).toInt().coerceAtLeast(1)
            val bufferH = (height * bufferScale).toInt().coerceAtLeast(1)

            if (bufferNeedsRecreate || offscreenBitmap == null ||
                offscreenBitmap?.width != bufferW || offscreenBitmap?.height != bufferH) {
                offscreenBitmap?.recycle()
                offscreenBitmap = null
                offscreenCanvas = null

                if (bufferW > 0 && bufferH > 0) {
                    try {
                        offscreenBitmap = Bitmap.createBitmap(bufferW, bufferH, Bitmap.Config.ARGB_8888)
                        offscreenCanvas = Canvas(offscreenBitmap!!)
                    } catch (_: OutOfMemoryError) {
                        offscreenBitmap = null
                        offscreenCanvas = null
                        useOffscreenBuffer = false
                    }
                }
                bufferNeedsRecreate = false
            }
        }

        val drawCanvas = if (useOffscreenBuffer && currentTheme != BackgroundManager.THEME_SOLID) 
            (offscreenCanvas ?: canvas) else canvas
        val scaledOffscreen = (useOffscreenBuffer && drawCanvas != canvas && bufferScale != 1f)

        if (scaledOffscreen) {
            drawCanvas.save()
            drawCanvas.scale(bufferScale, bufferScale)
        }
        
        when (currentTheme) {
            BackgroundManager.THEME_SOLID -> drawSolid(drawCanvas)
            BackgroundManager.THEME_STARFIELD -> drawStarfield(drawCanvas)
            BackgroundManager.THEME_GALAXY -> drawGalaxy(drawCanvas)
            BackgroundManager.THEME_NEBULA -> drawNebula(drawCanvas)
            BackgroundManager.THEME_CUSTOM_IMAGE -> drawCustomImage(drawCanvas)
            BackgroundManager.THEME_CITY_WALLPAPER -> if (blurredBitmap != null) drawCustomImage(drawCanvas) else drawSolid(drawCanvas)
            else -> drawSolid(drawCanvas)
        }
        
        if (scaledOffscreen) {
            drawCanvas.restore()
        }

        if (offscreenBitmap != null && drawCanvas != canvas) {
            bitmapDestRect.set(0, 0, width, height)
            canvas.drawBitmap(offscreenBitmap!!, null, bitmapDestRect, null)
        }
        staticFrameRendered = !shouldAnimate
    }
    
    private fun drawSolid(canvas: Canvas) {
        drawAmbientBase(canvas, cinematicTop, cinematicBottom)
    }
    
    private fun drawStarfield(canvas: Canvas) {
        drawAmbientBase(canvas, spaceBlack, solidBlack)
        
        stars.forEach { star ->
            val scale = (1f - star.z)
            val alpha = (star.brightness * scale * 255).toInt()
            val size = star.size * scale
            
            // White stars with slight blue tint
            paint.color = Color.argb(alpha, 255, 255, 255)
            canvas.drawCircle(star.x, star.y, size, paint)
            
            // Bright stars get a blue glow
            if (star.brightness > 0.7f) {
                paint.color = Color.argb(alpha / 3, 150, 200, 255)
                canvas.drawCircle(star.x, star.y, size * 3f, paint)
            }
        }
    }
    
    private fun drawGalaxy(canvas: Canvas) {
        drawAmbientBase(canvas, spaceBlack, solidBlack)
        
        val centerX = viewWidth / 2f
        val centerY = viewHeight / 2f
        
        // Draw core glow with premium blue
        paint.shader = RadialGradient(
            centerX, centerY, viewWidth * 0.15f,
            intArrayOf(
                Color.argb(100, Color.red(primaryColor), Color.green(primaryColor), Color.blue(primaryColor)),
                Color.argb(40, Color.red(secondaryColor), Color.green(secondaryColor), Color.blue(secondaryColor)),
                Color.TRANSPARENT
            ),
            floatArrayOf(0f, 0.5f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawCircle(centerX, centerY, viewWidth * 0.15f, paint)
        paint.shader = null
        
        // Draw particles
        galaxyParticles.forEach { particle ->
            val angle = particle.angle + galaxyRotation
            val x = centerX + cos(angle) * particle.distance
            val y = centerY + sin(angle) * particle.distance * 0.6f
            
            val alpha = (particle.brightness * 255).toInt()
            paint.color = Color.argb(alpha, Color.red(particle.color), Color.green(particle.color), Color.blue(particle.color))
            canvas.drawCircle(x, y, particle.size, paint)
        }
    }
    
    private fun drawNebula(canvas: Canvas) {
        drawAmbientBase(canvas, spaceBlack, solidBlack)
        
        nebulaLayers.forEach { layer ->
            paint.shader = RadialGradient(
                layer.offsetX, layer.offsetY, viewWidth * layer.scale,
                intArrayOf(
                    Color.argb((layer.alpha * 255).toInt(), Color.red(layer.color), Color.green(layer.color), Color.blue(layer.color)),
                    Color.argb((layer.alpha * 128).toInt(), Color.red(layer.color), Color.green(layer.color), Color.blue(layer.color)),
                    Color.TRANSPARENT
                ),
                floatArrayOf(0f, 0.5f, 1f),
                Shader.TileMode.CLAMP
            )
            canvas.drawCircle(layer.offsetX, layer.offsetY, viewWidth * layer.scale, paint)
        }
        paint.shader = null
    }
    
    private fun drawCustomImage(canvas: Canvas) {
        blurredBitmap?.let { bitmap ->
            val viewRatio = if (viewHeight > 0f) viewWidth / viewHeight else 16f / 9f
            val bitmapRatio = bitmap.width.toFloat() / bitmap.height.toFloat()
            if (bitmapRatio > viewRatio) {
                val srcWidth = (bitmap.height * viewRatio).toInt().coerceAtLeast(1)
                val left = ((bitmap.width - srcWidth) / 2).coerceAtLeast(0)
                bitmapSourceRect.set(left, 0, left + srcWidth, bitmap.height)
            } else {
                val srcHeight = (bitmap.width / viewRatio).toInt().coerceAtLeast(1)
                val top = ((bitmap.height - srcHeight) / 2).coerceAtLeast(0)
                bitmapSourceRect.set(0, top, bitmap.width, top + srcHeight)
            }
            bitmapDestRect.set(0, 0, viewWidth.toInt(), viewHeight.toInt())
            canvas.drawBitmap(bitmap, bitmapSourceRect, bitmapDestRect, imagePaint)
        }
        
        backgroundPaint.shader = LinearGradient(
            0f,
            0f,
            0f,
            viewHeight,
            intArrayOf(
                Color.argb(96, 18, 5, 2),
                Color.argb(58, 32, 10, 5),
                Color.argb(122, 18, 5, 2)
            ),
            floatArrayOf(0f, 0.48f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawRect(0f, 0f, viewWidth, viewHeight, backgroundPaint)
        backgroundPaint.shader = null
    }

    private fun drawAmbientBase(canvas: Canvas, topBase: Int, bottomBase: Int) {
        // Vertical cinematic wash: navy crown easing to near-black so content stays legible.
        canvas.drawColor(bottomBase)
        backgroundPaint.shader = LinearGradient(
            0f,
            0f,
            0f,
            viewHeight,
            intArrayOf(
                blendColor(topBase, primaryColor, 0.10f),
                topBase,
                bottomBase
            ),
            floatArrayOf(0f, 0.42f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawRect(0f, 0f, viewWidth, viewHeight, backgroundPaint)

        // Soft cyan accent glow, upper-right — premium, with gentle stops to avoid TV banding.
        backgroundPaint.shader = RadialGradient(
            viewWidth * 0.82f,
            -viewHeight * 0.08f,
            viewWidth * 0.72f,
            intArrayOf(
                Color.argb(44, Color.red(primaryColor), Color.green(primaryColor), Color.blue(primaryColor)),
                Color.argb(14, Color.red(primaryColor), Color.green(primaryColor), Color.blue(primaryColor)),
                Color.TRANSPARENT
            ),
            floatArrayOf(0f, 0.55f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawRect(0f, 0f, viewWidth, viewHeight, backgroundPaint)

        // Faint violet counter-glow, lower-left, for depth.
        backgroundPaint.shader = RadialGradient(
            viewWidth * 0.10f,
            viewHeight * 1.05f,
            viewWidth * 0.62f,
            intArrayOf(
                Color.argb(30, Color.red(secondaryColor), Color.green(secondaryColor), Color.blue(secondaryColor)),
                Color.TRANSPARENT
            ),
            floatArrayOf(0f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawRect(0f, 0f, viewWidth, viewHeight, backgroundPaint)
        backgroundPaint.shader = null
    }
    
    // ===== ANIMATION UPDATES =====
    
    private fun updateAnimation() {
        animationTime += 0.016f
        
        when (currentTheme) {
            BackgroundManager.THEME_STARFIELD -> updateStarfield()
            BackgroundManager.THEME_GALAXY -> updateGalaxy()
            BackgroundManager.THEME_NEBULA -> updateNebula()
        }
    }
    
    private fun updateStarfield() {
        stars.forEach { star ->
            star.z -= star.baseSpeed * 0.01f
            
            if (star.z <= 0f) {
                star.z = 1f
                star.x = Random.nextFloat() * viewWidth
                star.y = Random.nextFloat() * viewHeight
            }
            
            val centerX = viewWidth / 2f
            val centerY = viewHeight / 2f
            val scale = (1f - star.z)
            star.x = centerX + (star.x - centerX) * (1f + scale * 0.05f)
            star.y = centerY + (star.y - centerY) * (1f + scale * 0.05f)
        }
    }
    
    private fun updateGalaxy() {
        galaxyRotation += if (cinematicMode) 0.0004f else 0.001f
        galaxyParticles.forEach { particle ->
            val speed = if (cinematicMode) 0.0008f else 0.002f
            particle.angle += speed / (particle.distance + 1f)
        }
    }
    
    private fun updateNebula() {
        nebulaLayers.forEach { layer ->
            layer.offsetX += layer.speedX
            layer.offsetY += layer.speedY
            
            if (layer.offsetX < -viewWidth * 0.5f) layer.offsetX = viewWidth * 1.5f
            if (layer.offsetX > viewWidth * 1.5f) layer.offsetX = -viewWidth * 0.5f
            if (layer.offsetY < -viewHeight * 0.5f) layer.offsetY = viewHeight * 1.5f
            if (layer.offsetY > viewHeight * 1.5f) layer.offsetY = -viewHeight * 0.5f
        }
    }
    
    // ===== ANIMATION CONTROL =====
    
    fun setTvOptimizationMode(enabled: Boolean) {
        tvOptimizationMode = enabled
        if (enabled) {
            initializeTheme(currentTheme)
        }
        updateBufferConfig()
    }
    
    fun resumeAnimation() {
        // No-op by design. The animated space themes were removed; the base is now a static
        // cinematic gradient and the city/custom wallpaper is a static bitmap, so there is no
        // per-frame loop to resume. Kept for API compatibility with existing call sites.
    }
    
    fun pauseAnimation() {
        animationRunning = false
        Choreographer.getInstance().removeFrameCallback(frameCallback)
    }
    
    fun setAnimationEnabled(enabled: Boolean) {
        shouldAnimate = enabled
        staticFrameRendered = false
        updateBufferConfig()
        if (!enabled && animationRunning) {
            pauseAnimation()
        } else if (enabled && !animationRunning) {
            resumeAnimation()
        }
        invalidate()
    }
    
    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        resumeAnimation()
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        pauseAnimation()
        scope.cancel()
        customBitmap?.recycle()
        blurredBitmap?.recycle()
        offscreenBitmap?.recycle()
        offscreenBitmap = null
        offscreenCanvas = null
        cachedBackgroundShader = null
    }

    private fun blendColor(from: Int, to: Int, factor: Float): Int {
        val t = factor.coerceIn(0f, 1f)
        return Color.argb(
            (Color.alpha(from) + (Color.alpha(to) - Color.alpha(from)) * t).toInt(),
            (Color.red(from) + (Color.red(to) - Color.red(from)) * t).toInt(),
            (Color.green(from) + (Color.green(to) - Color.green(from)) * t).toInt(),
            (Color.blue(from) + (Color.blue(to) - Color.blue(from)) * t).toInt()
        )
    }
}
