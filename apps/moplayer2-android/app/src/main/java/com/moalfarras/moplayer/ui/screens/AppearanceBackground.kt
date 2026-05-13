package com.moalfarras.moplayer.ui.screens

import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.ThemePreset
import java.net.URI
import java.time.LocalDate

private val cityBackgroundUrls = listOf(
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=3840&q=90", // Dubai
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=3840&q=90", // City at night
    "https://images.unsplash.com/photo-1470071531523-20408c8bf788?auto=format&fit=crop&w=3840&q=90", // Foggy mountains
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=3840&q=90", // Dark city street
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=3840&q=90", // Mountains reflection
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=3840&q=90", // Neon Tokyo
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=3840&q=90", // London
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?auto=format&fit=crop&w=3840&q=90", // NY Skyline
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=3840&q=90", // Dark night sky
    "https://images.unsplash.com/photo-1502899576159-f224dc2349fa?auto=format&fit=crop&w=3840&q=90", // Futuristic city
    "https://images.unsplash.com/photo-1473691955023-da1c49c95c78?auto=format&fit=crop&w=3840&q=90", // Starry night mountains
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=3840&q=90", // NYC Night
    "https://images.unsplash.com/photo-1436891620584-47fd0e565afb?auto=format&fit=crop&w=3840&q=90", // Space / Stars
    "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=3840&q=90", // Neon cityscape
)

internal fun resolveHomeBackdropUrl(
    settings: AppSettings,
    contentBackdropUrl: String?,
    weatherCity: String = "",
    epochDay: Long = LocalDate.now().toEpochDay(),
): String? {
    val contentBackdrop = contentBackdropUrl?.trim()?.takeIf(::isValidBackdropUrl)
    return when (settings.backgroundMode) {
        BackgroundMode.AUTO -> {
            val cityBackdrop = cityBackgroundUrlForDay(epochDay + weatherCity.stableCityOffset())
            if (settings.themePreset == ThemePreset.CITY) cityBackdrop
            else contentBackdrop ?: cityBackdrop
        }
        BackgroundMode.CITY_ROTATION -> cityBackgroundUrlForDay(epochDay + weatherCity.stableCityOffset())
        BackgroundMode.CUSTOM_URL -> settings.customBackgroundUrl.trim().takeIf(::isValidBackdropUrl)
        BackgroundMode.NONE -> null
    }
}

private fun String.stableCityOffset(): Long =
    trim().lowercase().fold(0L) { acc, char -> (acc * 31 + char.code) % 10_000L }

internal fun cityBackgroundUrlForDay(epochDay: Long): String {
    val size = cityBackgroundUrls.size.toLong()
    val index = ((epochDay % size + size) % size).toInt()
    return cityBackgroundUrls[index]
}

internal fun isValidBackdropUrl(url: String): Boolean {
    if (url.isBlank()) return false
    return runCatching {
        val uri = URI(url.trim())
        val scheme = uri.scheme?.lowercase()
        (scheme == "http" || scheme == "https") && !uri.host.isNullOrBlank()
    }.getOrDefault(false)
}
