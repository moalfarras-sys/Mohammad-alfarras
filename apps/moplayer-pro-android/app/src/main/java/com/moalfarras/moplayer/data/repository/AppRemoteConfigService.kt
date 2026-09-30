package com.moalfarras.moplayer.data.repository

import android.util.Log
import com.moalfarras.moplayer.data.network.NetworkModule
import com.moalfarras.moplayer.data.network.WebApiEndpoint
import com.moalfarras.moplayerpro.BuildConfig
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.longOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Fetches `/api/app/config?product=moplayer2` once for everyone: the runtime switches (block,
 * widgets, notification) and the update metadata come from the same response. The last good
 * config is published on [latest] so the updater never needs its own request.
 */
class AppRemoteConfigService {
    // The base client verifies with the platform store plus the bundled ISRG roots on Android 6
    // (never trust-all), so update metadata cannot be swapped by a man in the middle.
    private val client: OkHttpClient by lazy {
        NetworkModule.okHttp.newBuilder()
            .connectTimeout(8, TimeUnit.SECONDS)
            .readTimeout(8, TimeUnit.SECONDS)
            .callTimeout(20, TimeUnit.SECONDS)
            .build()
    }

    private val latestConfig = MutableStateFlow<AppRemoteConfig?>(null)

    /** The last config any caller fetched successfully in this process. */
    val latest: StateFlow<AppRemoteConfig?> = latestConfig.asStateFlow()

    /**
     * The config from the first endpoint that answers with a valid body for this product, or null
     * when none did (offline, server error, wrong body). Callers must keep their last known state
     * on null instead of falling back to defaults.
     */
    suspend fun fetchConfig(): AppRemoteConfig? = withContext(Dispatchers.IO) {
        for (url in WebApiEndpoint.candidateUrls(CONFIG_PATH)) {
            val config = try {
                parseRemoteConfig(fetchBody(url), baseUrl = url.substringBefore(CONFIG_PATH_PREFIX))
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                if (BuildConfig.DEBUG) Log.w(TAG, "Config request failed: ${error.javaClass.simpleName}")
                null
            }
            if (config != null) {
                latestConfig.value = config
                return@withContext config
            }
        }
        null
    }

    private fun fetchBody(url: String): String {
        val request = Request.Builder()
            .url(url)
            .header("Accept", "application/json")
            .header("Cache-Control", "no-cache")
            .build()
        client.newCall(request).execute().use { response ->
            // An error page (HTML or {"error": ...}) must never parse into "everything enabled".
            if (!response.isSuccessful) throw IOException("HTTP ${response.code}")
            val body = response.body
            if (body.contentLength() > MAX_CONFIG_BYTES) throw IOException("Config body too large")
            return body.string()
        }
    }

    companion object {
        private const val TAG = "MoPlayerConfig"
        private const val CONFIG_PATH_PREFIX = "/api/app/config"
        private val CONFIG_PATH = "$CONFIG_PATH_PREFIX?product=${BuildConfig.APP_PRODUCT_SLUG}"
        private const val MAX_CONFIG_BYTES = 512L * 1024L
    }
}

data class AppRemoteConfig(
    val enabled: Boolean = true,
    val maintenanceMode: Boolean = false,
    val forceUpdate: Boolean = false,
    val minimumVersionCode: Int = 1,
    /** 0 when the server did not say which build is the latest. */
    val latestVersionCode: Int = 0,
    val latestVersionName: String = "",
    val message: String = "",
    val accentColor: String = "#E87817",
    val logoUrl: String = "",
    val backgroundUrl: String = "",
    val supportUrl: String = "https://moalfarras.space/en/support",
    val privacyUrl: String = "https://moalfarras.space/privacy",
    val syncIntervalMinutes: Int = 60,
    val sourceProtocolFallback: Boolean = true,
    /** Admin master switch for the focus-dwell trailer preview (provider trailer + YouTube fallback). */
    val trailerPreviewEnabled: Boolean = true,
    val footballProviderMode: String = "auto",
    val weatherEnabled: Boolean = true,
    val footballEnabled: Boolean = true,
    /** Admin default city; blank means "no default" (never forces a city on the user). */
    val weatherCity: String = "",
    val footballMaxMatches: Int = 8,
    val homeNotificationMode: String = "auto",
    val homeNotificationType: String = "world_cup_2026",
    val homeNotificationTitle: String = "",
    val homeNotificationMessage: String = "",
    val homeNotificationTargetDate: String = "",
    /** Absolute APK URL, resolved against the host that served the config. */
    val downloadUrl: String = defaultDownloadUrl(WebApiEndpoint.primaryBaseUrl),
    val apkSizeBytes: Long? = null,
    val checksumSha256: String = "",
    val releaseNotes: String = "",
    /** Code for the Downloader app on TV boxes (fallback install path). */
    val downloaderCode: String = "",
)

/**
 * Parses the config route's JSON (`{product, config: {...}}` or a bare config object). Returns
 * null for bodies that are not a config for [expectedProduct], so an error body never becomes
 * "enabled, no update, default widgets".
 */
internal fun parseRemoteConfig(
    body: String,
    baseUrl: String,
    expectedProduct: String = BuildConfig.APP_PRODUCT_SLUG,
): AppRemoteConfig? {
    val root = runCatching { Json.parseToJsonElement(body) }.getOrNull() as? JsonObject ?: return null
    root.string("product")?.let { product -> if (!product.equals(expectedProduct, ignoreCase = true)) return null }
    val nested = root["config"] as? JsonObject
    if (nested == null && !root.containsKey("enabled")) return null
    val config = nested ?: root
    val update = config["update"] as? JsonObject
    val widgets = config["widgets"] as? JsonObject
    val home = config["homeNotification"] as? JsonObject
    fun updateString(key: String): String? = update?.string(key) ?: config.string(key)
    val defaults = AppRemoteConfig()
    return AppRemoteConfig(
        enabled = config.bool("enabled") ?: true,
        maintenanceMode = config.bool("maintenanceMode") ?: false,
        forceUpdate = config.bool("forceUpdate") ?: false,
        minimumVersionCode = config.int("minimumVersionCode") ?: 1,
        latestVersionCode = (update?.int("latestVersionCode") ?: config.int("latestVersionCode"))?.coerceAtLeast(0) ?: 0,
        latestVersionName = updateString("latestVersionName")?.trim().orEmpty(),
        message = config.string("message")?.trim().orEmpty(),
        accentColor = config.string("accentColor") ?: defaults.accentColor,
        logoUrl = config.string("logoUrl").orEmpty(),
        backgroundUrl = config.string("backgroundUrl").orEmpty(),
        supportUrl = config.string("supportUrl")?.takeIf { it.isNotBlank() } ?: defaults.supportUrl,
        privacyUrl = config.string("privacyUrl")?.takeIf { it.isNotBlank() } ?: defaults.privacyUrl,
        syncIntervalMinutes = (config.int("syncIntervalMinutes") ?: 60).coerceIn(15, 360),
        sourceProtocolFallback = config.bool("sourceProtocolFallback") ?: true,
        trailerPreviewEnabled = config.bool("trailerPreviewEnabled") ?: true,
        footballProviderMode = config.string("footballProviderMode")?.takeIf { it.isNotBlank() } ?: "auto",
        weatherEnabled = widgets?.bool("weather") ?: true,
        footballEnabled = widgets?.bool("football") ?: true,
        weatherCity = widgets?.string("weatherCity")?.trim().orEmpty(),
        footballMaxMatches = (widgets?.int("footballMaxMatches") ?: 8).coerceIn(1, 20),
        homeNotificationMode = home?.string("mode")?.trim()?.takeIf { it.isNotBlank() }
            ?: (config["worldCup"] as? JsonObject)?.string("mode")?.trim()?.takeIf { it.isNotBlank() }
            ?: (config.string("homeNotificationMode") ?: config.string("worldCupMode"))?.takeIf { it.isNotBlank() }
            ?: "auto",
        homeNotificationType = home?.string("type")?.takeIf { it.isNotBlank() } ?: "world_cup_2026",
        homeNotificationTitle = home?.string("title").orEmpty(),
        homeNotificationMessage = home?.string("message").orEmpty(),
        homeNotificationTargetDate = home?.string("startDate").orEmpty(),
        downloadUrl = resolveAgainst(baseUrl, updateString("downloadUrl")?.trim()?.takeIf { it.isNotBlank() } ?: DOWNLOAD_PATH),
        apkSizeBytes = (update?.long("apkSizeBytes") ?: config.long("apkSizeBytes"))?.takeIf { it > 0L },
        checksumSha256 = updateString("checksumSha256")?.trim().orEmpty(),
        releaseNotes = updateString("releaseNotes")?.trim().orEmpty(),
        downloaderCode = config.string("downloaderCode")?.trim().orEmpty(),
    )
}

private fun JsonObject.primitive(key: String): JsonPrimitive? = this[key] as? JsonPrimitive

private fun JsonObject.string(key: String): String? = primitive(key)?.contentOrNull

private fun JsonObject.bool(key: String): Boolean? = primitive(key)?.booleanOrNull

private fun JsonObject.int(key: String): Int? = primitive(key)?.intOrNull

private fun JsonObject.long(key: String): Long? = primitive(key)?.longOrNull

private val DOWNLOAD_PATH = "/api/app/download/latest?product=${BuildConfig.APP_PRODUCT_SLUG}"

internal fun defaultDownloadUrl(baseUrl: String): String = resolveAgainst(baseUrl, DOWNLOAD_PATH)

/** Absolute URLs pass through; relative paths are resolved against [baseUrl]. */
internal fun resolveAgainst(baseUrl: String, url: String): String =
    if (url.startsWith("http://", ignoreCase = true) || url.startsWith("https://", ignoreCase = true)) {
        url
    } else {
        "${baseUrl.trimEnd('/')}/${url.trimStart('/')}"
    }

/** Why the whole app is blocked by the admin. */
enum class AppBlockReason { DISABLED, MAINTENANCE, FORCE_UPDATE }

/**
 * A full-screen block from the admin config. [message] is the admin's own text (blank means the
 * UI shows its localized default). [update] is set for [AppBlockReason.FORCE_UPDATE].
 */
data class AppBlock(
    val reason: AppBlockReason,
    val message: String,
    val update: AppUpdateInfo? = null,
    val supportUrl: String = "",
    val recheck: BlockRecheck = BlockRecheck.NONE,
)

/** Outcome of the user's "Try again" on the block screen. */
enum class BlockRecheck { NONE, CHECKING, STILL_BLOCKED, UNREACHABLE }

/**
 * The re-check state after a config request finished ([reached] = the server answered). Only a
 * manual "Try again" (CHECKING) reports an outcome; automatic refreshes clear an old answer on
 * success and leave it on failure.
 */
fun BlockRecheck.afterRecheck(reached: Boolean): BlockRecheck = when {
    this != BlockRecheck.CHECKING -> if (reached) BlockRecheck.NONE else this
    reached -> BlockRecheck.STILL_BLOCKED
    else -> BlockRecheck.UNREACHABLE
}

/**
 * The block for [config] on an install with [versionCode], or null when the app may run. A
 * forced update only blocks when a newer build actually exists, so the latest version (or a
 * build newer than the server knows) is never locked out.
 */
fun appBlockFor(config: AppRemoteConfig, versionCode: Int = BuildConfig.VERSION_CODE): AppBlock? = when {
    !config.enabled -> AppBlock(AppBlockReason.DISABLED, config.message, supportUrl = config.supportUrl)
    config.maintenanceMode -> AppBlock(AppBlockReason.MAINTENANCE, config.message, supportUrl = config.supportUrl)
    config.forceUpdate &&
        versionCode < config.minimumVersionCode &&
        isNewerVersion(config.latestVersionCode, versionCode) ->
        AppBlock(
            reason = AppBlockReason.FORCE_UPDATE,
            message = config.message,
            update = config.updateInfo(currentVersionCode = versionCode),
            supportUrl = config.supportUrl,
        )
    else -> null
}

/**
 * Which block the screen shows right now. A forced update lets the stream that is already playing
 * continue; the block appears when the player closes or the next item is requested.
 */
fun visibleAppBlock(block: AppBlock?, playerOpen: Boolean): AppBlock? =
    block?.takeUnless { it.reason == AppBlockReason.FORCE_UPDATE && playerOpen }
