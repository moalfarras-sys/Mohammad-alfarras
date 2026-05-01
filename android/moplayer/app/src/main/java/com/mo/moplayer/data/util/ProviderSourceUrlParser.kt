package com.mo.moplayer.data.util

import java.net.URI
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.Locale

object ProviderSourceUrlParser {
    data class XtreamCredentials(
        val serverUrl: String,
        val username: String,
        val password: String,
        val preferredOutputFormat: String? = null
    )

    fun normalizeServerUrl(input: String): String {
        var value = input.trim()
        if (value.isBlank()) return value
        if (!value.startsWith("http://", ignoreCase = true) && !value.startsWith("https://", ignoreCase = true)) {
            value = "http://$value"
        }

        val uri = runCatching { URI(value) }.getOrNull() ?: return value.trimEnd('/')
        val scheme = uri.scheme ?: "http"
        val host = uri.host ?: return value.trimEnd('/')
        val port = if (uri.port != -1) ":${uri.port}" else ""
        return "$scheme://$host$port".trimEnd('/')
    }

    fun isXtreamUrl(input: String): Boolean {
        val lower = input.lowercase(Locale.ROOT)
        return lower.contains("get.php?") ||
            lower.contains("player_api.php") ||
            (lower.contains("username=") && lower.contains("password="))
    }

    fun parseXtream(input: String): XtreamCredentials? {
        val normalizedInput = input.trim().let {
            if (it.startsWith("http://", true) || it.startsWith("https://", true)) it else "http://$it"
        }
        val uri = runCatching { URI(normalizedInput) }.getOrNull() ?: return null
        val params = parseQuery(uri.rawQuery ?: return null)
        val username = params["username"]?.trim().orEmpty()
        val password = params["password"]?.trim().orEmpty()
        val output = normalizeOutputFormat(params["output"])
        if (username.isBlank() || password.isBlank()) return null
        return XtreamCredentials(
            serverUrl = normalizeServerUrl(normalizedInput),
            username = username,
            password = password,
            preferredOutputFormat = output
        )
    }

    private fun parseQuery(query: String): Map<String, String> {
        return query.split("&")
            .mapNotNull { pair ->
                val parts = pair.split("=", limit = 2)
                val key = decode(parts.getOrNull(0).orEmpty()).lowercase(Locale.ROOT)
                if (key.isBlank()) return@mapNotNull null
                key to decode(parts.getOrNull(1).orEmpty())
            }
            .toMap()
    }

    private fun decode(value: String): String =
        runCatching { URLDecoder.decode(value, StandardCharsets.UTF_8.name()) }.getOrDefault(value)

    fun normalizeOutputFormat(value: String?): String? {
        val normalized = value
            ?.trim()
            ?.lowercase(Locale.ROOT)
            ?.replace(".", "")
            ?: return null
        return when (normalized) {
            "mpegts", "ts" -> "mpegts"
            "m3u8", "hls" -> "m3u8"
            "rtmp" -> "rtmp"
            else -> normalized.takeIf { it.matches(Regex("[a-z0-9_+-]{1,16}")) }
        }
    }
}
