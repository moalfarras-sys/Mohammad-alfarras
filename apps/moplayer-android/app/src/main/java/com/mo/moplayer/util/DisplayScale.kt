package com.mo.moplayer.util

import android.content.Context
import android.content.res.Configuration
import java.util.Locale
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Lays every screen out on one grid, whatever the device reports.
 *
 * TVs and boxes report very different densities for the same 1080p panel (213, 240, 320, 400 dpi)
 * and some ship a larger system font, so left alone the same screen is 25-60% bigger on one TV
 * than on another and resource buckets (`values-sw540dp`, `values-sw720dp`, ...) flip between
 * devices. Every Activity wraps its base context with [wrap], which:
 *
 * - on TV, fits the 960x540dp design canvas (widened by the viewer's [InterfaceSize]) into the
 *   panel, so 720p, 1080p and 4K TVs at any density render the same layout;
 * - on phones in landscape (shorter than the 540dp canvas), shrinks the grid so the TV layouts fit
 *   the short screen instead of overflowing; tablets keep their own density;
 * - keeps the system font scale between [MIN_FONT_SCALE] and [MAX_FONT_SCALE];
 * - applies the in-app language (System, English, Arabic) with the matching layout direction.
 *
 * Preferences are read synchronously from a tiny SharedPreferences file because they are needed
 * in attachBaseContext, before any coroutine or DI is available.
 */
object DisplayScale {

    enum class InterfaceSize(val key: String, val tvCanvasFactor: Float, val handheldFactor: Float) {
        COMPACT("compact", 1.25f, 1.12f),
        STANDARD("standard", 1.12f, 1.0f),
        LARGE("large", 1.0f, 0.9f);

        companion object {
            fun fromKey(key: String?): InterfaceSize = entries.firstOrNull { it.key == key } ?: STANDARD
        }
    }

    const val LANGUAGE_SYSTEM = "system"
    const val LANGUAGE_ENGLISH = "en"
    const val LANGUAGE_ARABIC = "ar"

    private const val PREFS = "display_scale"
    private const val KEY_SIZE = "interface_size"
    private const val KEY_LANGUAGE = "app_language"

    private const val DESIGN_WIDTH_DP = 960f
    private const val DESIGN_HEIGHT_DP = 540f
    internal const val MIN_FONT_SCALE = 0.9f
    internal const val MAX_FONT_SCALE = 1.1f

    fun interfaceSize(context: Context): InterfaceSize =
        InterfaceSize.fromKey(prefs(context).getString(KEY_SIZE, null))

    fun setInterfaceSize(context: Context, size: InterfaceSize) {
        prefs(context).edit().putString(KEY_SIZE, size.key).apply()
    }

    fun language(context: Context): String =
        prefs(context).getString(KEY_LANGUAGE, LANGUAGE_SYSTEM) ?: LANGUAGE_SYSTEM

    fun setLanguage(context: Context, language: String) {
        prefs(context).edit().putString(KEY_LANGUAGE, language).apply()
    }

    /** Returns [base] with the unified grid, clamped font scale and chosen language applied. */
    fun wrap(base: Context): Context {
        val app = base.applicationContext ?: base
        val source = base.resources.configuration
        val metrics = base.resources.displayMetrics
        val config = Configuration(source)
        var changed = false

        val grid = computeGrid(
            widthPx = max(metrics.widthPixels, metrics.heightPixels).toFloat(),
            heightPx = min(metrics.widthPixels, metrics.heightPixels).toFloat(),
            systemDensity = metrics.density,
            systemFontScale = source.fontScale,
            isTv = isTv(source),
            size = runCatching { interfaceSize(app) }.getOrDefault(InterfaceSize.STANDARD)
        )
        if (grid != null) {
            val widthPx = max(metrics.widthPixels, metrics.heightPixels)
            val heightPx = min(metrics.widthPixels, metrics.heightPixels)
            config.densityDpi = (grid.density * 160f).roundToInt()
            config.screenWidthDp = (widthPx / grid.density).roundToInt()
            config.screenHeightDp = (heightPx / grid.density).roundToInt()
            config.smallestScreenWidthDp = min(config.screenWidthDp, config.screenHeightDp)
            config.fontScale = grid.fontScale
            changed = true
        }

        val language = runCatching { language(app) }.getOrDefault(LANGUAGE_SYSTEM)
        if (language == LANGUAGE_ENGLISH || language == LANGUAGE_ARABIC) {
            val locale = Locale.forLanguageTag(language)
            Locale.setDefault(locale)
            config.setLocale(locale)
            config.setLayoutDirection(locale)
            changed = true
        }

        return if (changed) base.createConfigurationContext(config) else base
    }

    /**
     * [context] with only the in-app language applied. Use it to resolve strings outside an
     * Activity (ViewModels, singletons), because the application context keeps the system locale.
     */
    fun localized(context: Context): Context {
        val app = context.applicationContext ?: context
        val language = runCatching { language(app) }.getOrDefault(LANGUAGE_SYSTEM)
        if (language != LANGUAGE_ENGLISH && language != LANGUAGE_ARABIC) return context
        val locale = Locale.forLanguageTag(language)
        val current = context.resources.configuration
        if (current.locales.size() > 0 && current.locales[0].language == locale.language) return context
        val config = Configuration(current)
        config.setLocale(locale)
        config.setLayoutDirection(locale)
        return context.createConfigurationContext(config)
    }

    internal data class Grid(val density: Float, val fontScale: Float)

    /**
     * Density for the design canvas and the clamped font scale, or null when nothing needs to change
     * (unknown size, or a tablet at the standard size).
     */
    internal fun computeGrid(
        widthPx: Float,
        heightPx: Float,
        systemDensity: Float,
        systemFontScale: Float,
        isTv: Boolean,
        size: InterfaceSize
    ): Grid? {
        if (widthPx <= 0f || heightPx <= 0f || systemDensity <= 0f) return null
        val fontScale = if (systemFontScale.isFinite()) {
            systemFontScale.coerceIn(MIN_FONT_SCALE, MAX_FONT_SCALE)
        } else {
            1f
        }
        val density = if (isTv) {
            val widen = size.tvCanvasFactor
            min(widthPx / (DESIGN_WIDTH_DP * widen), heightPx / (DESIGN_HEIGHT_DP * widen))
        } else {
            val nativeHeightDp = heightPx / systemDensity
            if (nativeHeightDp < DESIGN_HEIGHT_DP) {
                // Phone in landscape: fit the canvas height, never draw larger than native.
                min(heightPx / (DESIGN_HEIGHT_DP * size.handheldFactor), systemDensity)
            } else {
                // Tablet: own density, nudged by the chosen size.
                systemDensity / size.handheldFactor
            }
        }
        if (!density.isFinite() || density <= 0f) return null
        if (!isTv && density == systemDensity && fontScale == systemFontScale) return null
        return Grid(density, fontScale)
    }

    private fun isTv(configuration: Configuration): Boolean =
        (configuration.uiMode and Configuration.UI_MODE_TYPE_MASK) == Configuration.UI_MODE_TYPE_TELEVISION

    private fun prefs(context: Context): android.content.SharedPreferences {
        // Read in attachBaseContext on the main thread; the file is a few bytes and cached after.
        val policy = android.os.StrictMode.allowThreadDiskReads()
        return try {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        } finally {
            android.os.StrictMode.setThreadPolicy(policy)
        }
    }
}
