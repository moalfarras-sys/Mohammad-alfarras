package com.mo.moplayer.data.util

import com.mo.moplayer.BuildConfig
import java.net.URI
import java.net.URLEncoder
import java.util.Locale

object ImageUrlNormalizer {
    fun normalize(raw: String?): String? {
        val input = raw?.trim()?.takeIf { it.isNotEmpty() } ?: return null
        val lowered = input.lowercase(Locale.US)
        if (lowered == "null" || lowered == "n/a" || lowered == "none") return null
        val sanitized = input.replace(" ", "%20")
        val absoluteUrl = if (sanitized.startsWith("//")) "https:$sanitized" else sanitized
        return try {
            val uri = URI(absoluteUrl)
            if (uri.scheme.equals("http", true) || uri.scheme.equals("https", true)) {
                proxyForPlaybackUi(optimizePosterSize(uri.toString()))
            } else {
                null
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun optimizePosterSize(url: String): String =
        url.replace("/w600_and_h900_bestv2/", "/w500/")
            .replace("/w780/", "/w500/")

    private fun proxyForPlaybackUi(url: String): String {
        val base = BuildConfig.WEB_API_BASE_URL.trimEnd('/').ifBlank { "https://moalfarras.space" }
        if (url.startsWith(base, ignoreCase = true)) return url
        val encoded = URLEncoder.encode(url, Charsets.UTF_8.name())
        return "$base/api/app/image?url=$encoded"
    }
}
