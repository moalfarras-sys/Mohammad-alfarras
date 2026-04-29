package com.mo.moplayer.data.util

import java.net.URI
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.Locale

object ProviderSourceUrlParser {
    data class XtreamCredentials(
        val serverUrl: String,
        val username: String,
        val password: String
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
        if (username.isBlank() || password.isBlank()) return null
        return XtreamCredentials(
            serverUrl = normalizeServerUrl(normalizedInput),
            username = username,
            password = password
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
}
