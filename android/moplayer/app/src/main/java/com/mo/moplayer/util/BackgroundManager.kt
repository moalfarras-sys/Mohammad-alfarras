package com.mo.moplayer.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import com.mo.moplayer.data.background.CityWallpaperService
import com.mo.moplayer.data.location.IpLocationService
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "background_settings")

/**
 * Manages app background themes and customization
 * Premium Blue Theme - Space backgrounds only
 */
@Singleton
class BackgroundManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val locationService: IpLocationService,
    private val cityWallpaperService: CityWallpaperService
) {

    data class CityWallpaperState(
        val cityName: String,
        val imagePath: String?,
        val source: String,
        val lastUpdatedEpochMs: Long,
        val status: String,
        val isFallback: Boolean
    )

    companion object {
        private val BACKGROUND_THEME_KEY = intPreferencesKey("background_theme")
        private val PARTICLE_COLOR_KEY = intPreferencesKey("particle_color")
        private val GLOW_COLOR_KEY = intPreferencesKey("glow_color")
        private val CUSTOM_IMAGE_PATH_KEY = stringPreferencesKey("custom_image_path")
        private val CUSTOM_IMAGE_URL_KEY = stringPreferencesKey("custom_image_url")
        private val USE_CUSTOM_IMAGE_KEY = intPreferencesKey("use_custom_image")
        private val IMAGE_BLUR_AMOUNT_KEY = intPreferencesKey("image_blur_amount")
        private val ANIMATION_ENABLED_KEY = booleanPreferencesKey("animation_enabled")
        private val AUTO_CITY_WALLPAPER_ENABLED_KEY = booleanPreferencesKey("auto_city_wallpaper_enabled")
        private val CITY_WALLPAPER_PATH_KEY = stringPreferencesKey("city_wallpaper_path")
        private val CITY_WALLPAPER_CITY_KEY = stringPreferencesKey("city_wallpaper_city")
        private val CITY_WALLPAPER_SOURCE_KEY = stringPreferencesKey("city_wallpaper_source")
        private val CITY_WALLPAPER_LAST_REFRESH_KEY = stringPreferencesKey("city_wallpaper_last_refresh")
        private val CITY_WALLPAPER_STATUS_KEY = stringPreferencesKey("city_wallpaper_status")

        // Available background themes - Space only (Premium minimal design)
        const val THEME_SOLID = 0           // Solid black background (default)
        const val THEME_STARFIELD = 1       // Starfield with hyperspace effect
        const val THEME_GALAXY = 2          // Spiral galaxy with nebula
        const val THEME_NEBULA = 3          // Colorful space nebula
        const val THEME_CUSTOM_IMAGE = 4    // Custom user image
        
        // Legacy theme constants (mapped to space themes for backwards compatibility)
        @Deprecated("Use THEME_STARFIELD instead", ReplaceWith("THEME_STARFIELD"))
        const val THEME_SNOW = 1
        @Deprecated("Use THEME_GALAXY instead", ReplaceWith("THEME_GALAXY"))
        const val THEME_RAIN = 2
        @Deprecated("Use THEME_NEBULA instead", ReplaceWith("THEME_NEBULA"))
        const val THEME_LEAVES = 3
        @Deprecated("Use THEME_STARFIELD instead", ReplaceWith("THEME_STARFIELD"))
        const val THEME_NETWORK = 1
        @Deprecated("Use THEME_GALAXY instead", ReplaceWith("THEME_GALAXY"))
        const val THEME_CIRCUIT = 2
        @Deprecated("Use THEME_NEBULA instead", ReplaceWith("THEME_NEBULA"))
        const val THEME_GRADIENT_WAVE = 3
        @Deprecated("Use THEME_SOLID instead", ReplaceWith("THEME_SOLID"))
        const val THEME_MINIMAL_PARTICLES = 0

        // Default colors - Premium Blue
        val DEFAULT_PARTICLE_COLOR = Color.parseColor("#0A84FF")
        val DEFAULT_GLOW_COLOR = Color.parseColor("#1A0A84FF")

        private const val CUSTOM_BG_FILENAME = "custom_background.jpg"
        private const val CITY_BG_FILENAME = "city_background.jpg"
        private const val CITY_WALLPAPER_CACHE_MS = 24 * 60 * 60 * 1000L
    }

    val currentTheme: Flow<Int> = context.dataStore.data.map { prefs ->
        // Normalize legacy themes to new space-only themes
        normalizeTheme(prefs[BACKGROUND_THEME_KEY] ?: THEME_SOLID)
    }

    val animationEnabled: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[ANIMATION_ENABLED_KEY] ?: true
    }

    val particleColor: Flow<Int> = context.dataStore.data.map { prefs ->
        prefs[PARTICLE_COLOR_KEY] ?: DEFAULT_PARTICLE_COLOR
    }

    val glowColor: Flow<Int> = context.dataStore.data.map { prefs ->
        prefs[GLOW_COLOR_KEY] ?: DEFAULT_GLOW_COLOR
    }

    val customImagePath: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[CUSTOM_IMAGE_PATH_KEY]
    }

    val imageBlurAmount: Flow<Int> = context.dataStore.data.map { prefs ->
        prefs[IMAGE_BLUR_AMOUNT_KEY] ?: 15
    }

    val autoCityWallpaperEnabled: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[AUTO_CITY_WALLPAPER_ENABLED_KEY] ?: true
    }

    val cityWallpaperState: Flow<CityWallpaperState?> = context.dataStore.data.map { prefs ->
        val city = prefs[CITY_WALLPAPER_CITY_KEY] ?: return@map null
        CityWallpaperState(
            cityName = city,
            imagePath = prefs[CITY_WALLPAPER_PATH_KEY],
            source = prefs[CITY_WALLPAPER_SOURCE_KEY] ?: "fallback",
            lastUpdatedEpochMs = prefs[CITY_WALLPAPER_LAST_REFRESH_KEY]?.toLongOrNull() ?: 0L,
            status = prefs[CITY_WALLPAPER_STATUS_KEY] ?: "idle",
            isFallback = prefs[CITY_WALLPAPER_PATH_KEY].isNullOrEmpty()
        )
    }
    
    /**
     * Normalize legacy theme values to new space-only theme system
     */
    private fun normalizeTheme(theme: Int): Int {
        return when (theme) {
            0 -> THEME_SOLID
            1 -> THEME_STARFIELD
            2 -> THEME_GALAXY
            3 -> THEME_NEBULA
            4, 10 -> THEME_CUSTOM_IMAGE  // Support old THEME_CUSTOM_IMAGE value (10)
            in 5..9 -> THEME_STARFIELD   // Map old themes to starfield
            else -> THEME_SOLID
        }
    }

    suspend fun setTheme(theme: Int) {
        context.dataStore.edit { prefs ->
            prefs[BACKGROUND_THEME_KEY] = normalizeTheme(theme)
        }
    }

    suspend fun setParticleColor(color: Int) {
        context.dataStore.edit { prefs ->
            prefs[PARTICLE_COLOR_KEY] = color
        }
    }

    suspend fun setGlowColor(color: Int) {
        context.dataStore.edit { prefs ->
            prefs[GLOW_COLOR_KEY] = color
        }
    }

    suspend fun setImageBlurAmount(amount: Int) {
        context.dataStore.edit { prefs ->
            prefs[IMAGE_BLUR_AMOUNT_KEY] = amount.coerceIn(0, 25)
        }
    }

    suspend fun setAnimationEnabled(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[ANIMATION_ENABLED_KEY] = enabled
        }
    }

    suspend fun setAutoCityWallpaperEnabled(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[AUTO_CITY_WALLPAPER_ENABLED_KEY] = enabled
            prefs[CITY_WALLPAPER_STATUS_KEY] = if (enabled) "pending" else "disabled"
        }
    }

    suspend fun setCustomImageFromUrl(imageUrl: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val url = URL(imageUrl)
            val connection = url.openConnection()
            connection.connectTimeout = 10000
            connection.readTimeout = 15000
            
            val inputStream = connection.getInputStream()
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream.close()

            if (bitmap != null) {
                saveCustomImage(bitmap)
                
                context.dataStore.edit { prefs ->
                    prefs[CUSTOM_IMAGE_URL_KEY] = imageUrl
                    prefs[BACKGROUND_THEME_KEY] = THEME_CUSTOM_IMAGE
                }
                bitmap.recycle()
                true
            } else {
                false
            }
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    suspend fun setCustomImageFromPath(imagePath: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val file = File(imagePath)
            if (!file.exists()) return@withContext false
            
            val bitmap = BitmapFactory.decodeFile(imagePath)
            if (bitmap != null) {
                saveCustomImage(bitmap)
                
                context.dataStore.edit { prefs ->
                    prefs[CUSTOM_IMAGE_PATH_KEY] = getCustomImageFile().absolutePath
                    prefs[BACKGROUND_THEME_KEY] = THEME_CUSTOM_IMAGE
                }
                bitmap.recycle()
                true
            } else {
                false
            }
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    private fun saveCustomImage(bitmap: Bitmap) {
        val file = getCustomImageFile()
        FileOutputStream(file).use { out ->
            // Scale down if too large
            val maxSize = 1920
            val scaledBitmap = if (bitmap.width > maxSize || bitmap.height > maxSize) {
                val scale = maxSize.toFloat() / maxOf(bitmap.width, bitmap.height)
                Bitmap.createScaledBitmap(
                    bitmap,
                    (bitmap.width * scale).toInt(),
                    (bitmap.height * scale).toInt(),
                    true
                )
            } else {
                bitmap
            }
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 85, out)
            if (scaledBitmap != bitmap) {
                scaledBitmap.recycle()
            }
        }
    }

    fun getCustomImageFile(): File {
        return File(context.filesDir, CUSTOM_BG_FILENAME)
    }

    fun getCityWallpaperFile(): File {
        return File(context.filesDir, CITY_BG_FILENAME)
    }

    fun hasCityWallpaper(): Boolean = getCityWallpaperFile().exists()

    fun hasCustomImage(): Boolean {
        return getCustomImageFile().exists()
    }

    suspend fun refreshCityWallpaper(force: Boolean = false): Result<CityWallpaperState> = withContext(Dispatchers.IO) {
        try {
            if (!autoCityWallpaperEnabled.first()) {
                context.dataStore.edit { prefs ->
                    prefs[CITY_WALLPAPER_STATUS_KEY] = "disabled"
                }
                return@withContext Result.success(
                    CityWallpaperState(
                        cityName = "",
                        imagePath = null,
                        source = "disabled",
                        lastUpdatedEpochMs = System.currentTimeMillis(),
                        status = "disabled",
                        isFallback = true
                    )
                )
            }

            val now = System.currentTimeMillis()
            val prefs = context.dataStore.data.first()
            val lastRefresh = prefs[CITY_WALLPAPER_LAST_REFRESH_KEY]?.toLongOrNull() ?: 0L
            val cachedCity = prefs[CITY_WALLPAPER_CITY_KEY]
            val cachedPath = prefs[CITY_WALLPAPER_PATH_KEY]

            if (!force && cachedPath != null && File(cachedPath).exists() && now - lastRefresh < CITY_WALLPAPER_CACHE_MS) {
                return@withContext Result.success(
                    CityWallpaperState(
                        cityName = cachedCity.orEmpty(),
                        imagePath = cachedPath,
                        source = prefs[CITY_WALLPAPER_SOURCE_KEY] ?: "Wikimedia",
                        lastUpdatedEpochMs = lastRefresh,
                        status = prefs[CITY_WALLPAPER_STATUS_KEY] ?: "ready",
                        isFallback = false
                    )
                )
            }

            val location = locationService.fetchLocation(forceRefresh = force).getOrElse { throw it }
            val wallpaperResult = cityWallpaperService.fetchCityWallpaper(location.city, location.country).getOrElse { throw it }
            saveCityWallpaper(wallpaperResult.bitmap)
            wallpaperResult.bitmap.recycle()

            val file = getCityWallpaperFile()
            val state = CityWallpaperState(
                cityName = location.city,
                imagePath = file.absolutePath,
                source = wallpaperResult.sourceName,
                lastUpdatedEpochMs = now,
                status = "ready",
                isFallback = false
            )

            context.dataStore.edit { store ->
                store[CITY_WALLPAPER_PATH_KEY] = file.absolutePath
                store[CITY_WALLPAPER_CITY_KEY] = location.city
                store[CITY_WALLPAPER_SOURCE_KEY] = wallpaperResult.sourceName
                store[CITY_WALLPAPER_LAST_REFRESH_KEY] = now.toString()
                store[CITY_WALLPAPER_STATUS_KEY] = "ready"
            }

            Result.success(state)
        } catch (e: Exception) {
            val existingFile = getCityWallpaperFile()
            val fallbackState = CityWallpaperState(
                cityName = context.dataStore.data.first()[CITY_WALLPAPER_CITY_KEY].orEmpty(),
                imagePath = existingFile.takeIf { it.exists() }?.absolutePath,
                source = "fallback",
                lastUpdatedEpochMs = System.currentTimeMillis(),
                status = "fallback",
                isFallback = true
            )
            context.dataStore.edit { prefs ->
                prefs[CITY_WALLPAPER_STATUS_KEY] = "fallback"
            }
            if (existingFile.exists()) {
                Result.success(fallbackState)
            } else {
                Result.failure(Exception(e.message ?: "Failed to refresh city wallpaper"))
            }
        }
    }

    suspend fun clearCityWallpaper() {
        getCityWallpaperFile().delete()
        context.dataStore.edit { prefs ->
            prefs.remove(CITY_WALLPAPER_PATH_KEY)
            prefs.remove(CITY_WALLPAPER_CITY_KEY)
            prefs.remove(CITY_WALLPAPER_SOURCE_KEY)
            prefs.remove(CITY_WALLPAPER_LAST_REFRESH_KEY)
            prefs[CITY_WALLPAPER_STATUS_KEY] = "idle"
        }
    }

    suspend fun clearCustomImage() {
        getCustomImageFile().delete()
        context.dataStore.edit { prefs ->
            prefs.remove(CUSTOM_IMAGE_PATH_KEY)
            prefs.remove(CUSTOM_IMAGE_URL_KEY)
            if (prefs[BACKGROUND_THEME_KEY] == THEME_CUSTOM_IMAGE) {
                prefs[BACKGROUND_THEME_KEY] = THEME_SOLID
            }
        }
    }

    private fun saveCityWallpaper(bitmap: Bitmap) {
        val file = getCityWallpaperFile()
        FileOutputStream(file).use { out ->
            val maxSize = 1920
            val scaledBitmap = if (bitmap.width > maxSize || bitmap.height > maxSize) {
                val scale = maxSize.toFloat() / maxOf(bitmap.width, bitmap.height)
                Bitmap.createScaledBitmap(
                    bitmap,
                    (bitmap.width * scale).toInt(),
                    (bitmap.height * scale).toInt(),
                    true
                )
            } else {
                bitmap
            }
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 88, out)
            if (scaledBitmap != bitmap) {
                scaledBitmap.recycle()
            }
        }
    }

    fun getThemeName(theme: Int): String {
        return when (normalizeTheme(theme)) {
            THEME_SOLID -> "Solid Black"
            THEME_STARFIELD -> "Starfield"
            THEME_GALAXY -> "Galaxy"
            THEME_NEBULA -> "Nebula"
            THEME_CUSTOM_IMAGE -> "Custom Image"
            else -> "Solid Black"
        }
    }

    /**
     * Get available background themes (Space themes only + Custom)
     */
    fun getAvailableThemes(): List<Pair<Int, String>> {
        return listOf(
            THEME_SOLID to "Solid Black",
            THEME_STARFIELD to "Starfield",
            THEME_GALAXY to "Galaxy",
            THEME_NEBULA to "Nebula",
            THEME_CUSTOM_IMAGE to "Custom Image"
        )
    }

    /**
     * Preset colors for particle/glow - Premium Blue palette
     */
    fun getPresetColors(): List<Pair<String, Int>> {
        return listOf(
            "Premium Blue" to Color.parseColor("#0A84FF"),
            "Ocean" to Color.parseColor("#00D4FF"),
            "Royal Purple" to Color.parseColor("#F4B860"),
            "Coral" to Color.parseColor("#FF6B6B"),
            "Gold" to Color.parseColor("#FFD60A"),
            "Mint" to Color.parseColor("#30D158"),
            "Silver" to Color.parseColor("#8E8E93"),
            "Rose" to Color.parseColor("#FF375F")
        )
    }
}
