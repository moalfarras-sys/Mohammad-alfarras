package com.mo.moplayer.ui.common

import android.app.ActivityManager
import android.app.UiModeManager
import android.content.Context
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.content.res.ColorStateList
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.os.Bundle
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.AppCompatButton
import androidx.lifecycle.lifecycleScope
import com.mo.moplayer.util.BackgroundManager
import com.mo.moplayer.util.ButtonStyleHelper
import com.mo.moplayer.util.DevicePerformance
import com.mo.moplayer.util.FocusStyleHelper
import com.mo.moplayer.util.ThemeManager
import com.mo.moplayer.ui.common.background.BackgroundVisualMode
import com.mo.moplayer.ui.common.background.CinematicBackgroundController
import com.mo.moplayer.ui.widgets.AnimatedBackground
import com.mo.moplayer.ui.widgets.weather.FullScreenWeatherOverlay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject

/**
 * Base activity that handles theme color synchronization across all screens.
 * Extend this activity to automatically apply accent colors to:
 * - Animated backgrounds (particles)
 * - Focus indicators
 * - Progress bars
 * - Selected icons
 * - Dock navigation items
 * - Text colors
 */
abstract class BaseThemedActivity : AppCompatActivity() {

    @Inject
    lateinit var themeManager: ThemeManager
    
    @Inject
    lateinit var backgroundManager: BackgroundManager
    
    @Inject
    lateinit var buttonStyleHelper: ButtonStyleHelper
    
    // No longer needed - using FocusStyleHelper object directly

    private var currentAccentColor: Int = 0
    private val exitHelper: ExitHelper by lazy { ExitHelper(this) }
    private var themeAndBackgroundObserversStarted: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        // Keep the TV screen awake for the entire app lifetime — IPTV users browse for
        // long periods between selections and the TV idle timer must never interrupt
        // them. FLAG_TURN_SCREEN_ON wakes the panel if the activity is brought up
        // while the display is asleep (e.g. from a notification deep link).
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
        }
        super.onCreate(savedInstanceState)
        setupBackPressHandler()
    }

    private fun setupBackPressHandler() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(shouldConfirmExitOnBack()) {
            override fun handleOnBackPressed() {
                if (maybeHandleExitOnBack()) {
                    // Back press consumed (toast shown or exit dialog displayed)
                    return
                }
                // Allow default back behavior (e.g. finish activity when not task root)
                isEnabled = false
                onBackPressedDispatcher.onBackPressed()
                isEnabled = true
            }
        })
    }

    /**
     * True when back should trigger the double-back exit flow.
     * Default: only when this Activity is the task root (back would close the app).
     */
    protected open fun shouldConfirmExitOnBack(): Boolean = isTaskRoot

    /**
     * Call this before finishing when handling KEYCODE_BACK manually.
     * @return true if the back press was consumed by exit flow.
     */
    protected fun maybeHandleExitOnBack(): Boolean {
        if (!shouldConfirmExitOnBack()) return false
        return exitHelper.onBackPressed()
    }

    /**
     * Detect if the device is an Android TV
     */
    private fun isTvDevice(): Boolean {
        val uiModeManager = getSystemService(Context.UI_MODE_SERVICE) as UiModeManager
        return uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION
    }
    
    /**
     * Apply TV-specific optimizations
     */
    private fun optimizeForTv() {
        lifecycleScope.launch {
            val animBg = getAnimatedBackground()
            if (animBg != null) {
                // Respect user setting, then scale visuals down by device tier so weak
                // boxes / Fire TV sticks stay smooth. Low tier => static background.
                val userEnabled = backgroundManager.animationEnabled.first()
                val tier = DevicePerformance.tier(this@BaseThemedActivity)
                val lowTier = tier == DevicePerformance.Tier.LOW
                val animationEnabled = userEnabled && !lowTier

                animBg.setTvOptimizationMode(true)
                animBg.setCinematicMode(tier == DevicePerformance.Tier.HIGH)
                animBg.setAnimationEnabled(animationEnabled)
                if (animationEnabled) {
                    animBg.resumeAnimation()
                } else {
                    animBg.pauseAnimation()
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Start observers once (onResume runs often on TV).
        if (!themeAndBackgroundObserversStarted) {
            themeAndBackgroundObserversStarted = true
            observeThemeChanges()
            observeThemeUpdates()
            applyPersistedBackground()
        }
        
        // Optimize for TV devices (after binding is initialized)
        if (isTvDevice()) {
            optimizeForTv()
        }
    }

    /**
     * Observes theme color changes and applies them
     */
    private fun observeThemeChanges() {
        lifecycleScope.launch {
            themeManager.currentAccentColor.collect { color ->
                currentAccentColor = color
                onThemeColorChanged(color)
            }
        }
    }
    
    /**
     * Observes theme update events for immediate cross-activity updates
     */
    private fun observeThemeUpdates() {
        lifecycleScope.launch {
            themeManager.themeUpdateEvent.collect { color ->
                currentAccentColor = color
                applyThemeImmediately(color)
            }
        }
    }

    /**
     * Applies persisted background settings including custom images
     */
    private fun applyPersistedBackground() {
        lifecycleScope.launch {
            val animatedBackground = getAnimatedBackground() ?: return@launch
            
            val currentTheme = backgroundManager.currentTheme.first()
            val particleColor = backgroundManager.particleColor.first()
            val animationEnabled = backgroundManager.animationEnabled.first()
            val (customImagePath, cityImagePath) = withContext(Dispatchers.IO) {
                val custom = backgroundManager.getCustomImageFile().takeIf { it.exists() }?.absolutePath
                val city = backgroundManager.getCityWallpaperFile().takeIf { it.exists() }?.absolutePath
                custom to city
            }
            
            animatedBackground.initializeFromSettings(
                customImagePath = customImagePath,
                cityImagePath = cityImagePath,
                currentTheme = currentTheme,
                particleColor = particleColor
            )
            
            animatedBackground.setAnimationEnabled(animationEnabled)
            CinematicBackgroundController.applyBackgroundProfile(
                mode = getBackgroundVisualMode(),
                background = animatedBackground,
                weatherOverlay = getWeatherOverlayView(),
                wallpaperView = getBackgroundWallpaperView(),
                wallpaperScrim = getBackgroundScrimView()
            )
            CinematicBackgroundController.bindWeatherOverlay(
                mode = getBackgroundVisualMode(),
                weatherOverlay = getWeatherOverlayView(),
                accentColor = particleColor
            )
            
            // Optimize animation for TV devices
            if (isTvDevice()) {
                // Reduce animation complexity for better performance on TV
                CinematicBackgroundController.applyCinematicDefaults(animatedBackground)
            }
            
            // Monitor theme changes
            backgroundManager.currentTheme.collect { theme ->
                animatedBackground.setCurrentTheme(theme)
            }
        }
    }

    /**
     * Called when theme color changes. Override to apply colors to custom views.
     */
    protected open fun onThemeColorChanged(color: Int) {
        applyAccentColor(color)
    }

    /**
     * Applies theme immediately when broadcast event is received
     */
    private fun applyThemeImmediately(color: Int) {
        applyAccentColor(color)
    }

    /**
     * Override to apply theme colors to custom views in the activity
     */
    protected open fun applyThemeToViews(color: Int) {
        // Subclasses can override to apply colors to their specific views
    }

    protected open fun getBackgroundVisualMode(): BackgroundVisualMode =
        BackgroundVisualMode.CINEMATIC_ANIMATED

    /**
     * Override to return the animated background view if present in layout
     */
    protected open fun getAnimatedBackground(): AnimatedBackground? = null

    protected open fun getWeatherOverlayView(): FullScreenWeatherOverlay? = null

    protected open fun getBackgroundWallpaperView(): ImageView? = null

    protected open fun getBackgroundScrimView(): View? = null

    /**
     * Get the current accent color
     */
    protected fun getAccentColor(): Int = currentAccentColor

    /**
     * Apply accent color to an ImageView (for icons)
     */
    protected fun applyAccentToIcon(imageView: ImageView) {
        imageView.colorFilter = PorterDuffColorFilter(currentAccentColor, PorterDuff.Mode.SRC_IN)
    }

    /**
     * Apply accent color to multiple ImageViews (for icons)
     */
    protected fun applyAccentToIcons(vararg imageViews: ImageView) {
        imageViews.forEach { applyAccentToIcon(it) }
    }

    /**
     * Apply accent color to a TextView
     */
    protected fun applyAccentToText(textView: TextView) {
        textView.setTextColor(currentAccentColor)
    }

    /**
     * Apply accent color to multiple TextViews
     */
    protected fun applyAccentToTexts(vararg textViews: TextView) {
        textViews.forEach { applyAccentToText(it) }
    }

    /**
     * Apply accent color with alpha to a view's background
     */
    protected fun applyAccentToBackground(view: View, alpha: Int = 40) {
        val color = android.graphics.Color.argb(
            alpha,
            android.graphics.Color.red(currentAccentColor),
            android.graphics.Color.green(currentAccentColor),
            android.graphics.Color.blue(currentAccentColor)
        )
        view.setBackgroundColor(color)
    }

    // Last accent color whose full view-tree walk was applied; guards against redundant work.
    private var lastAppliedAccentColor: Int? = null

    /**
     * Apply the accent color across the current screen.
     *
     * The recursive view-tree walk is the expensive part. Previously this was FOUR separate full
     * traversals per theme event, and the focus-border pass called `getIdentifier()` (a reflection
     * lookup) three times for EVERY view. This version does a single traversal, resolves the three
     * focus ids once up front, and skips the walk entirely when the accent is unchanged — so theme
     * application and screen resumes no longer hitch on large layouts.
     */
    private fun applyAccentColor(color: Int) {
        getAnimatedBackground()?.setParticleColor(color)
        CinematicBackgroundController.bindWeatherOverlay(
            mode = getBackgroundVisualMode(),
            weatherOverlay = getWeatherOverlayView(),
            accentColor = color
        )
        if (color != lastAppliedAccentColor) {
            lastAppliedAccentColor = color
            (window.decorView as? ViewGroup)?.let { root ->
                applyAccentTreeWalk(
                    root,
                    color,
                    resources.getIdentifier("focusBorder", "id", packageName),
                    resources.getIdentifier("focusGlow", "id", packageName),
                    resources.getIdentifier("glowIndicator", "id", packageName)
                )
            }
        }
        // Subclasses may apply additional, view-specific theming (cheap).
        applyThemeToViews(color)
    }

    /** Single-pass accent application: progress tints, opt-in buttons, focus borders, accent tags. */
    private fun applyAccentTreeWalk(
        viewGroup: ViewGroup,
        color: Int,
        focusBorderId: Int,
        focusGlowId: Int,
        glowIndicatorId: Int
    ) {
        for (i in 0 until viewGroup.childCount) {
            val child = viewGroup.getChildAt(i)

            if (child is ProgressBar) {
                val tint = ColorStateList.valueOf(color)
                child.indeterminateTintList = tint
                child.progressTintList = tint
            }

            if ((child is Button || child is AppCompatButton) && child.tag == "dynamic_button") {
                child.background = buttonStyleHelper.createThemedButtonBackground(this)
            }

            when (child.id) {
                focusBorderId -> if (focusBorderId != 0) child.background = FocusStyleHelper.createFocusBorder(color)
                focusGlowId -> if (focusGlowId != 0) child.background = FocusStyleHelper.createFocusGlow(color)
                glowIndicatorId -> if (glowIndicatorId != 0) child.background = FocusStyleHelper.createDockGlowIndicator(color)
            }

            when (child.tag) {
                "accent_text" -> if (child is TextView) child.setTextColor(color)
                "accent_icon" -> if (child is ImageView) child.colorFilter = PorterDuffColorFilter(color, PorterDuff.Mode.SRC_IN)
                "accent_background" -> child.backgroundTintList = ColorStateList.valueOf(getButtonAccentColor(58))
                "accent_surface" -> child.backgroundTintList = ColorStateList.valueOf(getButtonAccentColor(34))
                "accent_button" -> child.background = buttonStyleHelper.createThemedButtonBackground(this)
            }

            if (child is ViewGroup) {
                applyAccentTreeWalk(child, color, focusBorderId, focusGlowId, glowIndicatorId)
            }
        }
    }

    /**
     * Create a focus glow color from accent (with transparency)
     */
    protected fun getFocusGlowColor(alpha: Int = 100): Int {
        return android.graphics.Color.argb(
            alpha,
            android.graphics.Color.red(currentAccentColor),
            android.graphics.Color.green(currentAccentColor),
            android.graphics.Color.blue(currentAccentColor)
        )
    }

    /**
     * Get button accent color (with transparency)
     */
    protected fun getButtonAccentColor(alpha: Int = 40): Int {
        return android.graphics.Color.argb(
            alpha,
            android.graphics.Color.red(currentAccentColor),
            android.graphics.Color.green(currentAccentColor),
            android.graphics.Color.blue(currentAccentColor)
        )
    }

    /**
     * Get darker shade of current accent color
     */
    protected fun getDarkerAccentColor(): Int {
        val factor = 0.7f
        return android.graphics.Color.rgb(
            (android.graphics.Color.red(currentAccentColor) * factor).toInt(),
            (android.graphics.Color.green(currentAccentColor) * factor).toInt(),
            (android.graphics.Color.blue(currentAccentColor) * factor).toInt()
        )
    }

    override fun onDestroy() {
        super.onDestroy()
        exitHelper.dismissDialog()
    }
}
