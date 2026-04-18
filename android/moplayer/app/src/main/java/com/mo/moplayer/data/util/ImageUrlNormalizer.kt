package com.mo.moplayer.data.util

import java.net.URI
import java.util.Locale

object ImageUrlNormalizer {
    fun normalize(raw: String?): String? {
        val input = raw?.trim()?.takeIf { it.isNotEmpty() } ?: return null
        val lowered = input.lowercase(Locale.US)
        if (lowered == "null" || lowered == "n/a" || lowered == "none") return null
        val sanitized = input.replace(" ", "%20")
        if (sanitized.startsWith("//")) return "https:$sanitized"
        return try {
            val uri = URI(sanitized)
            if (uri.scheme.equals("http", true) || uri.scheme.equals("https", true)) {
                uri.toString()
            } else {
                null
            }
        } catch (_: Exception) {
            null
        }
    }
}
