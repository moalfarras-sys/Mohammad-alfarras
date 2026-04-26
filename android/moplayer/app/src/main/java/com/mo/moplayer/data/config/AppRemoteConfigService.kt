package com.mo.moplayer.data.config

import android.content.Context
import com.mo.moplayer.BuildConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AppRemoteConfigService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val prefs = context.getSharedPreferences("moplayer_remote_config", Context.MODE_PRIVATE)
    private val endpoint = "${BuildConfig.WEB_API_BASE_URL.trimEnd('/')}/api/app/config"

    suspend fun fetchConfig(): AppRemoteConfig = withContext(Dispatchers.IO) {
        try {
            val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8_000
                readTimeout = 8_000
                setRequestProperty("Accept", "application/json")
            }

            val body = if (connection.responseCode in 200..299) {
                connection.inputStream.bufferedReader().use { it.readText() }
            } else {
                connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
            }
            connection.disconnect()

            if (body.isBlank()) return@withContext cachedConfig()

            val root = JSONObject(body)
            val config = root.optJSONObject("config") ?: root
            val parsed = AppRemoteConfig(
                enabled = config.optBoolean("enabled", true),
                maintenanceMode = config.optBoolean("maintenanceMode", false),
                forceUpdate = config.optBoolean("forceUpdate", false),
                minimumVersionCode = config.optInt("minimumVersionCode", 1),
                latestVersionName = config.optString("latestVersionName", BuildConfig.VERSION_NAME),
                message = config.optString("message", ""),
                accentColor = config.optString("accentColor", "#00e5ff"),
                logoUrl = config.optString("logoUrl", ""),
                backgroundUrl = config.optString("backgroundUrl", ""),
                supportUrl = config.optString("supportUrl", "https://moalfarras.space/support"),
                privacyUrl = config.optString("privacyUrl", "https://moalfarras.space/privacy"),
                weatherEnabled = config.optJSONObject("widgets")?.optBoolean("weather", true) ?: true,
                footballEnabled = config.optJSONObject("widgets")?.optBoolean("football", true) ?: true
            )
            saveConfig(parsed)
            parsed
        } catch (_: Exception) {
            cachedConfig()
        }
    }

    fun cachedConfig(): AppRemoteConfig {
        return AppRemoteConfig(
            enabled = prefs.getBoolean("enabled", true),
            maintenanceMode = prefs.getBoolean("maintenanceMode", false),
            forceUpdate = prefs.getBoolean("forceUpdate", false),
            minimumVersionCode = prefs.getInt("minimumVersionCode", 1),
            latestVersionName = prefs.getString("latestVersionName", BuildConfig.VERSION_NAME) ?: BuildConfig.VERSION_NAME,
            message = prefs.getString("message", "").orEmpty(),
            accentColor = prefs.getString("accentColor", "#00e5ff") ?: "#00e5ff",
            logoUrl = prefs.getString("logoUrl", "").orEmpty(),
            backgroundUrl = prefs.getString("backgroundUrl", "").orEmpty(),
            supportUrl = prefs.getString("supportUrl", "https://moalfarras.space/support") ?: "https://moalfarras.space/support",
            privacyUrl = prefs.getString("privacyUrl", "https://moalfarras.space/privacy") ?: "https://moalfarras.space/privacy",
            weatherEnabled = prefs.getBoolean("weatherEnabled", true),
            footballEnabled = prefs.getBoolean("footballEnabled", true)
        )
    }

    private fun saveConfig(config: AppRemoteConfig) {
        prefs.edit()
            .putBoolean("enabled", config.enabled)
            .putBoolean("maintenanceMode", config.maintenanceMode)
            .putBoolean("forceUpdate", config.forceUpdate)
            .putInt("minimumVersionCode", config.minimumVersionCode)
            .putString("latestVersionName", config.latestVersionName)
            .putString("message", config.message)
            .putString("accentColor", config.accentColor)
            .putString("logoUrl", config.logoUrl)
            .putString("backgroundUrl", config.backgroundUrl)
            .putString("supportUrl", config.supportUrl)
            .putString("privacyUrl", config.privacyUrl)
            .putBoolean("weatherEnabled", config.weatherEnabled)
            .putBoolean("footballEnabled", config.footballEnabled)
            .apply()
    }
}

data class AppRemoteConfig(
    val enabled: Boolean = true,
    val maintenanceMode: Boolean = false,
    val forceUpdate: Boolean = false,
    val minimumVersionCode: Int = 1,
    val latestVersionName: String = BuildConfig.VERSION_NAME,
    val message: String = "",
    val accentColor: String = "#00e5ff",
    val logoUrl: String = "",
    val backgroundUrl: String = "",
    val supportUrl: String = "https://moalfarras.space/support",
    val privacyUrl: String = "https://moalfarras.space/privacy",
    val weatherEnabled: Boolean = true,
    val footballEnabled: Boolean = true
)
