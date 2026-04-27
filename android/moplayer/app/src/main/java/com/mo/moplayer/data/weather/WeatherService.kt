package com.mo.moplayer.data.weather

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.mo.moplayer.BuildConfig
import com.mo.moplayer.data.location.IpLocationService
import android.util.Log
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URLEncoder
import org.json.JSONObject
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

private val Context.weatherDataStore: DataStore<Preferences> by preferencesDataStore(name = "weather_settings")

/**
 * Weather Service using WeatherAPI.com
 * 
 * Features:
 * - Free tier: 1 million requests/month
 * - Automatic IP-based location detection
 * - Rich weather data with conditions
 * - API key loaded from BuildConfig/local.properties
 */
@Singleton
class WeatherService @Inject constructor(
    @ApplicationContext private val context: Context,
    private val locationService: IpLocationService
) {
    companion object {
        private const val TAG = "WeatherService"
        private val CACHED_TEMP_PREF = stringPreferencesKey("cached_temperature")
        private val CACHED_CONDITION_PREF = stringPreferencesKey("cached_condition")
        private val CACHED_CONDITION_CODE_PREF = intPreferencesKey("cached_condition_code")
        private val CACHED_ICON_PREF = stringPreferencesKey("cached_icon")
        private val CACHED_CITY_PREF = stringPreferencesKey("cached_city")
        private val CACHED_FEELS_LIKE_PREF = stringPreferencesKey("cached_feels_like")
        private val CACHED_HUMIDITY_PREF = stringPreferencesKey("cached_humidity")
        private val CACHED_WIND_SPEED_PREF = stringPreferencesKey("cached_wind_speed")
        private val CACHED_WIND_DEGREE_PREF = intPreferencesKey("cached_wind_degree")
        private val CACHED_GUST_SPEED_PREF = stringPreferencesKey("cached_gust_kph")
        private val CACHED_PRECIP_MM_PREF = stringPreferencesKey("cached_precip_mm")
        private val CACHED_CLOUD_PREF = intPreferencesKey("cached_cloud")
        private val CACHED_IS_DAY_PREF = booleanPreferencesKey("cached_is_day")
        private val LAST_UPDATE_PREF = stringPreferencesKey("weather_last_update")
        private val WEATHER_ENABLED_PREF = booleanPreferencesKey("weather_enabled")
        private val WEATHER_EFFECTS_QUALITY_PREF = intPreferencesKey("weather_effects_quality")
        private val WEATHER_REDUCE_MOTION_PREF = booleanPreferencesKey("weather_reduce_motion")
        private val WEATHER_DISABLE_LIGHTNING_PREF = booleanPreferencesKey("weather_disable_lightning")

        // Weather effect quality: 0=Off, 1=Low, 2=Medium, 3=High
        const val EFFECT_QUALITY_OFF = 0
        const val EFFECT_QUALITY_LOW = 1
        const val EFFECT_QUALITY_MEDIUM = 2
        const val EFFECT_QUALITY_HIGH = 3

        // Hidden debug overrides (for UI/FX testing)
        private val DEBUG_ENABLED_PREF = booleanPreferencesKey("weather_debug_enabled")
        private val DEBUG_CATEGORY_PREF = stringPreferencesKey("weather_debug_category")
        private val DEBUG_IS_DAY_PREF = booleanPreferencesKey("weather_debug_is_day")
        private val DEBUG_TEMP_PREF = intPreferencesKey("weather_debug_temp")
        private val DEBUG_FEELS_LIKE_PREF = intPreferencesKey("weather_debug_feels_like")
        private val DEBUG_HUMIDITY_PREF = intPreferencesKey("weather_debug_humidity")
        private val DEBUG_WIND_SPEED_PREF = doublePreferencesKey("weather_debug_wind_kph")
        private val DEBUG_WIND_DEGREE_PREF = intPreferencesKey("weather_debug_wind_degree")
        private val DEBUG_GUST_SPEED_PREF = doublePreferencesKey("weather_debug_gust_kph")
        private val DEBUG_PRECIP_MM_PREF = doublePreferencesKey("weather_debug_precip_mm")
        private val DEBUG_CLOUD_PREF = intPreferencesKey("weather_debug_cloud")
        private val DEBUG_CITY_PREF = stringPreferencesKey("weather_debug_city")
        private val DEBUG_CONDITION_PREF = stringPreferencesKey("weather_debug_condition")
        private val DEBUG_CONDITION_CODE_PREF = intPreferencesKey("weather_debug_condition_code")
        private val DEBUG_LAST_UPDATED_PREF = stringPreferencesKey("weather_debug_last_update")

        private val WEATHER_PROXY_URL = "${BuildConfig.WEB_API_BASE_URL}/api/weather"
        
        // Cache expiration: 30 minutes
        private const val CACHE_EXPIRATION_MS = 30 * 60 * 1000L
        private const val CONNECT_TIMEOUT_MS = 8_000
        private const val READ_TIMEOUT_MS = 8_000
    }

    val weatherEnabled: Flow<Boolean> = context.weatherDataStore.data.map { prefs ->
        prefs[WEATHER_ENABLED_PREF] ?: true
    }

    val weatherEffectsQuality: Flow<Int> = context.weatherDataStore.data.map { prefs ->
        prefs[WEATHER_EFFECTS_QUALITY_PREF] ?: EFFECT_QUALITY_MEDIUM
    }

    val weatherReduceMotion: Flow<Boolean> = context.weatherDataStore.data.map { prefs ->
        prefs[WEATHER_REDUCE_MOTION_PREF] ?: false
    }

    val weatherDisableLightning: Flow<Boolean> = context.weatherDataStore.data.map { prefs ->
        prefs[WEATHER_DISABLE_LIGHTNING_PREF] ?: false
    }

    val cachedWeather: Flow<WeatherData?> = context.weatherDataStore.data.map { prefs ->
        // If debug is enabled, return the debug override as the active weather (for UI/FX testing).
        if (prefs[DEBUG_ENABLED_PREF] == true) {
            return@map buildDebugWeatherFromPrefs(prefs)
        }

        val temp = prefs[CACHED_TEMP_PREF]
        val condition = prefs[CACHED_CONDITION_PREF]
        val icon = prefs[CACHED_ICON_PREF]
        
        if (temp != null && condition != null) {
            val cachedConditionCode = prefs[CACHED_CONDITION_CODE_PREF]
            val fallbackCodeFromIcon = getConditionCode(icon ?: "")
            WeatherData(
                temperature = temp.toIntOrNull() ?: 0,
                feelsLike = prefs[CACHED_FEELS_LIKE_PREF]?.toIntOrNull() ?: 0,
                condition = condition,
                conditionCode = cachedConditionCode ?: fallbackCodeFromIcon,
                icon = icon ?: "",
                cityName = prefs[CACHED_CITY_PREF] ?: "",
                humidity = prefs[CACHED_HUMIDITY_PREF]?.toIntOrNull() ?: 0,
                windSpeed = prefs[CACHED_WIND_SPEED_PREF]?.toDoubleOrNull() ?: 0.0,
                windDegree = prefs[CACHED_WIND_DEGREE_PREF] ?: 0,
                gustSpeed = prefs[CACHED_GUST_SPEED_PREF]?.toDoubleOrNull() ?: 0.0,
                precipMm = prefs[CACHED_PRECIP_MM_PREF]?.toDoubleOrNull() ?: 0.0,
                cloud = prefs[CACHED_CLOUD_PREF] ?: 0,
                isDay = prefs[CACHED_IS_DAY_PREF] ?: true,
                lastUpdatedEpochMs = prefs[LAST_UPDATE_PREF]?.toLongOrNull() ?: 0L
            )
        } else {
            null
        }
    }

    val weatherDebugEnabled: Flow<Boolean> = context.weatherDataStore.data.map { prefs ->
        prefs[DEBUG_ENABLED_PREF] ?: false
    }

    suspend fun setWeatherEnabled(enabled: Boolean) {
        context.weatherDataStore.edit { prefs ->
            prefs[WEATHER_ENABLED_PREF] = enabled
        }
    }

    suspend fun setWeatherEffectsQuality(quality: Int) {
        context.weatherDataStore.edit { prefs ->
            prefs[WEATHER_EFFECTS_QUALITY_PREF] = quality.coerceIn(EFFECT_QUALITY_OFF, EFFECT_QUALITY_HIGH)
        }
    }

    suspend fun setWeatherReduceMotion(enabled: Boolean) {
        context.weatherDataStore.edit { prefs ->
            prefs[WEATHER_REDUCE_MOTION_PREF] = enabled
        }
    }

    suspend fun setWeatherDisableLightning(enabled: Boolean) {
        context.weatherDataStore.edit { prefs ->
            prefs[WEATHER_DISABLE_LIGHTNING_PREF] = enabled
        }
    }

    suspend fun setWeatherDebugEnabled(enabled: Boolean) {
        context.weatherDataStore.edit { prefs ->
            prefs[DEBUG_ENABLED_PREF] = enabled
            if (enabled && prefs[DEBUG_LAST_UPDATED_PREF].isNullOrEmpty()) {
                prefs[DEBUG_LAST_UPDATED_PREF] = System.currentTimeMillis().toString()
            }
        }
    }

    data class WeatherDebugOverride(
        val category: WeatherCategory,
        val isDay: Boolean,
        val temperature: Int,
        val feelsLike: Int,
        val humidity: Int,
        val windSpeedKph: Double,
        val windDegree: Int,
        val gustSpeedKph: Double,
        val precipMm: Double,
        val cloud: Int
    )

    suspend fun applyWeatherDebugOverride(override: WeatherDebugOverride) {
        context.weatherDataStore.edit { prefs ->
            prefs[DEBUG_ENABLED_PREF] = true
            prefs[DEBUG_CATEGORY_PREF] = override.category.name
            prefs[DEBUG_IS_DAY_PREF] = override.isDay
            prefs[DEBUG_TEMP_PREF] = override.temperature
            prefs[DEBUG_FEELS_LIKE_PREF] = override.feelsLike
            prefs[DEBUG_HUMIDITY_PREF] = override.humidity
            prefs[DEBUG_WIND_SPEED_PREF] = override.windSpeedKph
            prefs[DEBUG_WIND_DEGREE_PREF] = override.windDegree
            prefs[DEBUG_GUST_SPEED_PREF] = override.gustSpeedKph
            prefs[DEBUG_PRECIP_MM_PREF] = override.precipMm
            prefs[DEBUG_CLOUD_PREF] = override.cloud

            // Cosmetic text/codes for details UI
            val preset = presetForCategory(override.category)
            prefs[DEBUG_CITY_PREF] = "Debug"
            prefs[DEBUG_CONDITION_PREF] = preset.conditionText
            prefs[DEBUG_CONDITION_CODE_PREF] = preset.conditionCode
            prefs[DEBUG_LAST_UPDATED_PREF] = System.currentTimeMillis().toString()
        }
    }

    suspend fun clearWeatherDebugOverride() {
        context.weatherDataStore.edit { prefs ->
            prefs[DEBUG_ENABLED_PREF] = false
            prefs.remove(DEBUG_CATEGORY_PREF)
            prefs.remove(DEBUG_IS_DAY_PREF)
            prefs.remove(DEBUG_TEMP_PREF)
            prefs.remove(DEBUG_FEELS_LIKE_PREF)
            prefs.remove(DEBUG_HUMIDITY_PREF)
            prefs.remove(DEBUG_WIND_SPEED_PREF)
            prefs.remove(DEBUG_WIND_DEGREE_PREF)
            prefs.remove(DEBUG_GUST_SPEED_PREF)
            prefs.remove(DEBUG_PRECIP_MM_PREF)
            prefs.remove(DEBUG_CLOUD_PREF)
            prefs.remove(DEBUG_CITY_PREF)
            prefs.remove(DEBUG_CONDITION_PREF)
            prefs.remove(DEBUG_CONDITION_CODE_PREF)
            prefs.remove(DEBUG_LAST_UPDATED_PREF)
        }
    }

    /**
     * Fetch weather automatically using IP-based location
     */
    suspend fun fetchWeather(forceRefresh: Boolean = false): Result<WeatherData> = withContext(Dispatchers.IO) {
        try {
            // If debug override is enabled, do not hit network.
            val debugEnabled = weatherDebugEnabled.first()
            if (debugEnabled) {
                if (forceRefresh) {
                    context.weatherDataStore.edit { prefs ->
                        prefs[DEBUG_LAST_UPDATED_PREF] = System.currentTimeMillis().toString()
                    }
                }
                val prefs = context.weatherDataStore.data.first()
                val debugWeather = buildDebugWeatherFromPrefs(prefs)
                return@withContext if (debugWeather != null) {
                    Result.success(debugWeather)
                } else {
                    Result.failure(Exception("Weather debug is enabled but not configured"))
                }
            }

            // Check if weather is enabled
            val enabled = weatherEnabled.first()
            if (!enabled) {
                return@withContext Result.failure(Exception("Weather is disabled"))
            }
            
            // Check cache if not forcing refresh
            if (!forceRefresh) {
                val prefs = context.weatherDataStore.data.first()
                val lastUpdate = prefs[LAST_UPDATE_PREF]?.toLongOrNull() ?: 0
                val now = System.currentTimeMillis()
                
                if (now - lastUpdate < CACHE_EXPIRATION_MS) {
                    val cached = cachedWeather.first()
                    if (cached != null) {
                        return@withContext Result.success(cached)
                    }
                }
            }
            
            // Get location
            val locationResult = locationService.fetchLocation(forceRefresh)
            if (locationResult.isFailure) {
                val cached = cachedWeather.first()
                if (cached != null) return@withContext Result.success(cached)
                return@withContext Result.failure(locationResult.exceptionOrNull() ?: Exception("Failed to get location"))
            }
            
            val location = locationResult.getOrNull()
            
            if (location == null) {
                val cached = cachedWeather.first()
                if (cached != null) return@withContext Result.success(cached)
                return@withContext Result.failure(Exception("Location not available"))
            }
            
            // Fetch weather through the public website proxy so provider keys stay server-side.
            val query = "${location.latitude},${location.longitude}"
            val url = "$WEATHER_PROXY_URL?city=${URLEncoder.encode(query, "UTF-8")}"
            val connection = (URL(url).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
                setRequestProperty("Accept", "application/json")
            }
            val response = try {
                val stream = if (connection.responseCode in 200..299) {
                    connection.inputStream
                } else {
                    connection.errorStream ?: connection.inputStream
                }
                stream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
            val json = JSONObject(response)
            
            // Check for API error
            if (json.has("error")) {
                val errorValue = json.opt("error")
                val message = when (errorValue) {
                    is JSONObject -> errorValue.optString("message", "Weather provider unavailable")
                    is String -> errorValue
                    is Boolean -> "Weather provider unavailable"
                    else -> "Weather provider unavailable"
                }
                val cached = cachedWeather.first()
                if (cached != null) return@withContext Result.success(cached)
                return@withContext Result.failure(Exception("Weather API error: $message"))
            }
            
            val weatherData = WeatherData(
                temperature = json.optDouble("temp_c", 0.0).toInt(),
                feelsLike = json.optDouble("feelslike_c", 0.0).toInt(),
                condition = json.optString("condition", "Weather unavailable"),
                conditionCode = json.optInt("condition_code", getConditionCode(json.optString("icon", ""))),
                icon = json.optString("icon", ""),
                cityName = json.optString("city", ""),
                humidity = json.optInt("humidity", 0),
                windSpeed = json.optDouble("wind_kph", 0.0),
                windDegree = json.optInt("wind_degree", 0),
                gustSpeed = json.optDouble("gust_kph", 0.0),
                precipMm = json.optDouble("precip_mm", 0.0),
                cloud = json.optInt("cloud", 0),
                isDay = json.optInt("is_day", 1) == 1,
                lastUpdatedEpochMs = System.currentTimeMillis()
            )
            
            // Cache the result (basic fields only for now, full object serialization recommended for complex lists)
            context.weatherDataStore.edit { prefs ->
                prefs[CACHED_TEMP_PREF] = weatherData.temperature.toString()
                prefs[CACHED_FEELS_LIKE_PREF] = weatherData.feelsLike.toString()
                prefs[CACHED_CONDITION_PREF] = weatherData.condition
                prefs[CACHED_CONDITION_CODE_PREF] = weatherData.conditionCode
                prefs[CACHED_ICON_PREF] = weatherData.icon
                prefs[CACHED_CITY_PREF] = weatherData.cityName
                prefs[CACHED_HUMIDITY_PREF] = weatherData.humidity.toString()
                prefs[CACHED_WIND_SPEED_PREF] = weatherData.windSpeed.toString()
                prefs[CACHED_WIND_DEGREE_PREF] = weatherData.windDegree
                prefs[CACHED_GUST_SPEED_PREF] = weatherData.gustSpeed.toString()
                prefs[CACHED_PRECIP_MM_PREF] = weatherData.precipMm.toString()
                prefs[CACHED_CLOUD_PREF] = weatherData.cloud
                prefs[CACHED_IS_DAY_PREF] = weatherData.isDay
                prefs[LAST_UPDATE_PREF] = weatherData.lastUpdatedEpochMs.toString()
            }
            
            Result.success(weatherData)
        } catch (e: Exception) {
            Log.w(TAG, "Weather refresh failed, using cached data when available")
            val cached = cachedWeather.first()
            if (cached != null) return@withContext Result.success(cached)
            Result.failure(e)
        }
    }
    
    /**
     * Get condition code from icon string (fallback for cached data)
     */
    private fun getConditionCode(icon: String): Int {
        return when {
            icon.contains("113") -> 1000 // Sunny/Clear
            icon.contains("116") -> 1003 // Partly cloudy
            icon.contains("119") -> 1006 // Cloudy
            icon.contains("122") -> 1009 // Overcast
            icon.contains("176") || icon.contains("293") -> 1063 // Patchy rain
            icon.contains("200") || icon.contains("386") -> 1087 // Thundery
            icon.contains("179") || icon.contains("227") -> 1066 // Snow
            icon.contains("248") || icon.contains("260") -> 1135 // Fog
            // For unknown legacy cached icons, default to CLOUDY (safer than CLEAR).
            else -> 1006
        }
    }

    private data class CategoryPreset(
        val conditionCode: Int,
        val conditionText: String
    )

    private fun presetForCategory(category: WeatherCategory): CategoryPreset {
        return when (category) {
            WeatherCategory.CLEAR -> CategoryPreset(conditionCode = 1000, conditionText = "Clear")
            WeatherCategory.CLOUDY -> CategoryPreset(conditionCode = 1009, conditionText = "Cloudy")
            WeatherCategory.FOGGY -> CategoryPreset(conditionCode = 1135, conditionText = "Fog")
            WeatherCategory.RAINY -> CategoryPreset(conditionCode = 1183, conditionText = "Rain")
            WeatherCategory.SNOWY -> CategoryPreset(conditionCode = 1210, conditionText = "Snow")
            WeatherCategory.STORMY -> CategoryPreset(conditionCode = 1276, conditionText = "Storm")
        }
    }

    private fun buildDebugWeatherFromPrefs(prefs: Preferences): WeatherData? {
        val categoryName = prefs[DEBUG_CATEGORY_PREF]
        val isDay = prefs[DEBUG_IS_DAY_PREF] ?: true

        val category = runCatching {
            if (categoryName.isNullOrBlank()) WeatherCategory.CLEAR else WeatherCategory.valueOf(categoryName)
        }.getOrDefault(WeatherCategory.CLEAR)

        val preset = presetForCategory(category)

        val temp = prefs[DEBUG_TEMP_PREF] ?: 22
        val feelsLike = prefs[DEBUG_FEELS_LIKE_PREF] ?: temp
        val humidity = prefs[DEBUG_HUMIDITY_PREF] ?: 55
        val windSpeed = prefs[DEBUG_WIND_SPEED_PREF] ?: 8.0
        val windDegree = prefs[DEBUG_WIND_DEGREE_PREF] ?: 0
        val gust = prefs[DEBUG_GUST_SPEED_PREF] ?: windSpeed
        val precip = prefs[DEBUG_PRECIP_MM_PREF] ?: 0.0
        val cloud = prefs[DEBUG_CLOUD_PREF] ?: 0

        val conditionText = prefs[DEBUG_CONDITION_PREF] ?: preset.conditionText
        val conditionCode = prefs[DEBUG_CONDITION_CODE_PREF] ?: preset.conditionCode
        val cityName = prefs[DEBUG_CITY_PREF] ?: "Debug"
        val lastUpdated = prefs[DEBUG_LAST_UPDATED_PREF]?.toLongOrNull() ?: System.currentTimeMillis()

        return WeatherData(
            temperature = temp,
            feelsLike = feelsLike,
            condition = conditionText,
            conditionCode = conditionCode,
            icon = "",
            cityName = cityName,
            humidity = humidity,
            windSpeed = windSpeed,
            windDegree = windDegree,
            gustSpeed = gust,
            precipMm = precip,
            cloud = cloud,
            isDay = isDay,
            lastUpdatedEpochMs = lastUpdated
        )
    }

    /**
     * Get weather condition category for animations
     */
    fun getWeatherCategory(conditionCode: Int): WeatherCategory {
        return when (conditionCode) {
            1000 -> WeatherCategory.CLEAR
            1003, 1006, 1009 -> WeatherCategory.CLOUDY
            1030, 1135, 1147 -> WeatherCategory.FOGGY
            1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 
            1240, 1243, 1246, 1249, 1252 -> WeatherCategory.RAINY
            1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 
            1237, 1255, 1258, 1261, 1264 -> WeatherCategory.SNOWY
            1087, 1273, 1276, 1279, 1282 -> WeatherCategory.STORMY
            else -> WeatherCategory.CLEAR
        }
    }

    /**
     * Get weather icon resource based on condition code and day/night
     */
    fun getWeatherIconResource(conditionCode: Int, isDay: Boolean): Int {
        return when (getWeatherCategory(conditionCode)) {
            WeatherCategory.CLEAR -> if (isDay) com.mo.moplayer.R.drawable.ic_weather_sunny else com.mo.moplayer.R.drawable.ic_weather_clear_night
            WeatherCategory.CLOUDY -> if (conditionCode == 1003) com.mo.moplayer.R.drawable.ic_weather_partly_cloudy else com.mo.moplayer.R.drawable.ic_weather_cloudy
            WeatherCategory.FOGGY -> com.mo.moplayer.R.drawable.ic_weather_foggy
            WeatherCategory.RAINY -> com.mo.moplayer.R.drawable.ic_weather_rainy
            WeatherCategory.SNOWY -> com.mo.moplayer.R.drawable.ic_weather_snow
            WeatherCategory.STORMY -> com.mo.moplayer.R.drawable.ic_weather_thunderstorm
        }
    }

    enum class WeatherCategory {
        CLEAR,
        CLOUDY,
        FOGGY,
        RAINY,
        SNOWY,
        STORMY
    }

    data class WeatherData(
        val temperature: Int,
        val feelsLike: Int,
        val condition: String,
        val conditionCode: Int,
        val icon: String,
        val cityName: String,
        val humidity: Int,
        val windSpeed: Double,
        val windDegree: Int,
        val gustSpeed: Double,
        val precipMm: Double,
        val cloud: Int,
        val isDay: Boolean,
        val lastUpdatedEpochMs: Long,
        val forecast: List<DailyForecast> = emptyList()
    )

    data class DailyForecast(
        val dateEpoch: Long,
        val maxTemp: Int,
        val minTemp: Int,
        val conditionText: String,
        val conditionCode: Int,
        val icon: String
    )
}
