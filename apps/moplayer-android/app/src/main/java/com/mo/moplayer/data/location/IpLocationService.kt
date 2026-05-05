package com.mo.moplayer.data.location

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

private val Context.locationDataStore: DataStore<Preferences> by preferencesDataStore(name = "location_settings")

/**
 * IP-based Location Service
 * 
 * Automatically detects user location using IP address via ip-api.com
 * Free service with no API key required
 */
@Singleton
class IpLocationService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private val LATITUDE_PREF = doublePreferencesKey("location_latitude")
        private val LONGITUDE_PREF = doublePreferencesKey("location_longitude")
        private val CITY_PREF = stringPreferencesKey("location_city")
        private val COUNTRY_PREF = stringPreferencesKey("location_country")
        private val REGION_PREF = stringPreferencesKey("location_region")
        private val TIMEZONE_PREF = stringPreferencesKey("location_timezone")
        private val LAST_UPDATE_PREF = stringPreferencesKey("location_last_update")

        // ip-api.com - Free, no key required, 45 requests/minute
        private const val IP_API_URL = "http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,query"
        
        // Cache expiration: 24 hours
        private const val CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000L
    }

    val locationData: Flow<LocationData?> = context.locationDataStore.data.map { prefs ->
        val lat = prefs[LATITUDE_PREF]
        val lon = prefs[LONGITUDE_PREF]
        val city = prefs[CITY_PREF]
        
        if (lat != null && lon != null && city != null) {
            LocationData(
                latitude = lat,
                longitude = lon,
                city = city,
                country = prefs[COUNTRY_PREF] ?: "",
                region = prefs[REGION_PREF] ?: "",
                timezone = prefs[TIMEZONE_PREF] ?: ""
            )
        } else {
            null
        }
    }

    /**
     * Fetch location from IP address
     * Uses cached data if available and not expired
     */
    suspend fun fetchLocation(forceRefresh: Boolean = false): Result<LocationData> = withContext(Dispatchers.IO) {
        try {
            // Check cache if not forcing refresh
            if (!forceRefresh) {
                val prefs = context.locationDataStore.data.first()
                val lastUpdate = prefs[LAST_UPDATE_PREF]?.toLongOrNull() ?: 0
                val now = System.currentTimeMillis()
                
                if (now - lastUpdate < CACHE_EXPIRATION_MS) {
                    val lat = prefs[LATITUDE_PREF]
                    val lon = prefs[LONGITUDE_PREF]
                    val city = prefs[CITY_PREF]
                    
                    if (lat != null && lon != null && city != null) {
                        return@withContext Result.success(LocationData(
                            latitude = lat,
                            longitude = lon,
                            city = city,
                            country = prefs[COUNTRY_PREF] ?: "",
                            region = prefs[REGION_PREF] ?: "",
                            timezone = prefs[TIMEZONE_PREF] ?: ""
                        ))
                    }
                }
            }
            
            // Fetch from API
            val response = URL(IP_API_URL).readText()
            val json = JSONObject(response)
            
            // Check for API error
            val status = json.getString("status")
            if (status != "success") {
                val message = json.optString("message", "Unknown error")
                return@withContext Result.failure(Exception("IP location failed: $message"))
            }
            
            val locationData = LocationData(
                latitude = json.getDouble("lat"),
                longitude = json.getDouble("lon"),
                city = json.getString("city"),
                country = json.getString("country"),
                region = json.getString("regionName"),
                timezone = json.getString("timezone")
            )
            
            // Cache the result
            context.locationDataStore.edit { prefs ->
                prefs[LATITUDE_PREF] = locationData.latitude
                prefs[LONGITUDE_PREF] = locationData.longitude
                prefs[CITY_PREF] = locationData.city
                prefs[COUNTRY_PREF] = locationData.country
                prefs[REGION_PREF] = locationData.region
                prefs[TIMEZONE_PREF] = locationData.timezone
                prefs[LAST_UPDATE_PREF] = System.currentTimeMillis().toString()
            }
            
            Result.success(locationData)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
    
    /**
     * Get cached location data synchronously
     */
    suspend fun getCachedLocation(): LocationData? {
        return locationData.first()
    }
    
    /**
     * Clear cached location data
     */
    suspend fun clearCache() {
        context.locationDataStore.edit { prefs ->
            prefs.clear()
        }
    }

    data class LocationData(
        val latitude: Double,
        val longitude: Double,
        val city: String,
        val country: String,
        val region: String,
        val timezone: String
    ) {
        fun getDisplayName(): String {
            return if (region.isNotEmpty() && region != city) {
                "$city, $region, $country"
            } else {
                "$city, $country"
            }
        }
    }
}
