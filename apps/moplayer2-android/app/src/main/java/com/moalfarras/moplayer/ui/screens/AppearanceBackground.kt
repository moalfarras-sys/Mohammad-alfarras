package com.moalfarras.moplayer.ui.screens

import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.ThemePreset
import java.net.URI
import java.time.LocalDate

private val cityBackgroundUrls = listOf(
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=3840&q=90",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=3840&q=90",
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=3840&q=90",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=3840&q=90",
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=3840&q=90",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?auto=format&fit=crop&w=3840&q=90",
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=3840&q=90",
)

internal fun resolveHomeBackdropUrl(
    settings: AppSettings,
    contentBackdropUrl: String?,
    epochDay: Long = LocalDate.now().toEpochDay(),
): String? {
    val contentBackdrop = contentBackdropUrl?.trim()?.takeIf(::isValidBackdropUrl)
    return when (settings.backgroundMode) {
        BackgroundMode.AUTO -> {
            if (settings.themePreset == ThemePreset.CITY) {
                cityBackgroundUrlForDay(epochDay)
            } else {
                contentBackdrop
            }
        }
        BackgroundMode.CITY_ROTATION -> cityBackgroundUrlForDay(epochDay)
        BackgroundMode.CUSTOM_URL -> settings.customBackgroundUrl.trim().takeIf(::isValidBackdropUrl)
        BackgroundMode.NONE -> null
    }
}

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
