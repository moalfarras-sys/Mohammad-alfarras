package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayerpro.BuildConfig
import com.moalfarras.moplayer.data.network.WebApiEndpoint
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class AppRemoteConfigService {
    suspend fun fetchConfig(): AppRemoteConfig = withContext(Dispatchers.IO) {
        runCatching {
            val body = fetchConfigBody()
            val root = JSONObject(body)
            val config = root.optJSONObject("config") ?: root
            AppRemoteConfig(
                enabled = config.optBoolean("enabled", true),
                maintenanceMode = config.optBoolean("maintenanceMode", false),
                forceUpdate = config.optBoolean("forceUpdate", false),
                minimumVersionCode = config.optInt("minimumVersionCode", 1),
                latestVersionName = config.optString("latestVersionName", BuildConfig.VERSION_NAME),
                message = config.optString("message", ""),
                accentColor = config.optString("accentColor", "#E87817"),
                logoUrl = config.optString("logoUrl", ""),
                backgroundUrl = config.optString("backgroundUrl", ""),
                supportUrl = config.optString("supportUrl", "https://moalfarras.space/en/support"),
                privacyUrl = config.optString("privacyUrl", "https://moalfarras.space/privacy"),
                syncIntervalMinutes = config.optInt("syncIntervalMinutes", 120).coerceIn(15, 360),
                sourceProtocolFallback = config.optBoolean("sourceProtocolFallback", true),
                footballProviderMode = config.optString("footballProviderMode", "auto").ifBlank { "auto" },
                weatherEnabled = config.optJSONObject("widgets")?.optBoolean("weather", true) ?: true,
                footballEnabled = config.optJSONObject("widgets")?.optBoolean("football", true) ?: true,
                weatherCity = config.optJSONObject("widgets")?.optString("weatherCity", "Berlin")?.ifBlank { "Berlin" } ?: "Berlin",
                footballMaxMatches = config.optJSONObject("widgets")?.optInt("footballMaxMatches", 8)?.coerceIn(1, 20) ?: 8,
            )
        }.getOrElse {
            AppRemoteConfig()
        }
    }

    private fun fetchConfigBody(): String {
        var lastError: Throwable? = null
        WebApiEndpoint.candidateUrls("/api/app/config?app=${BuildConfig.APP_PRODUCT_SLUG}").forEach { urlString ->
            try {
                val connection = (URL(urlString).openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 8_000
                    readTimeout = 8_000
                    setRequestProperty("Accept", "application/json")
                }
                return try {
                    val stream = if (connection.responseCode in 200..299) {
                        connection.inputStream
                    } else {
                        connection.errorStream ?: connection.inputStream
                    }
                    stream.bufferedReader().use { it.readText() }
                } finally {
                    connection.disconnect()
                }
            } catch (error: Throwable) {
                lastError = error
            }
        }
        throw lastError ?: IllegalStateException("MoPlayer Pro config endpoint unavailable")
    }
}

data class AppRemoteConfig(
    val enabled: Boolean = true,
    val maintenanceMode: Boolean = false,
    val forceUpdate: Boolean = false,
    val minimumVersionCode: Int = 1,
    val latestVersionName: String = BuildConfig.VERSION_NAME,
    val message: String = "",
    val accentColor: String = "#E87817",
    val logoUrl: String = "",
    val backgroundUrl: String = "",
    val supportUrl: String = "https://moalfarras.space/en/support",
    val privacyUrl: String = "https://moalfarras.space/privacy",
    val syncIntervalMinutes: Int = 120,
    val sourceProtocolFallback: Boolean = true,
    val footballProviderMode: String = "auto",
    val weatherEnabled: Boolean = true,
    val footballEnabled: Boolean = true,
    val weatherCity: String = "Berlin",
    val footballMaxMatches: Int = 8,
)
