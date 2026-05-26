package com.moalfarras.moplayer.ui.screens

import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.ThemePreset
import com.moalfarras.moplayer.data.network.WebApiEndpoint
import java.net.URI
import java.time.LocalDate

private val cityBackgroundUrls = listOf(
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2560&h=1440&q=86", // Dubai skyline
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=2560&h=1440&q=86", // Dark architecture
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?auto=format&fit=crop&w=2560&h=1440&q=86", // City skyline
    "https://images.unsplash.com/photo-1502899576159-f224dc2349fa?auto=format&fit=crop&w=2560&h=1440&q=86", // Modern city
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=2560&h=1440&q=86", // Night city street
    "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=2560&h=1440&q=86", // Night cityscape
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=2560&h=1440&q=86", // Premium residence
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2560&h=1440&q=86", // Business district
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=2560&h=1440&q=86", // Tokyo city
    "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=2560&h=1440&q=86", // London city
    "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=2560&h=1440&q=86", // Istanbul
    "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=2560&h=1440&q=86", // Tower bridge
)

internal fun resolveHomeBackdropUrl(
    settings: AppSettings,
    contentBackdropUrl: String?,
    weatherCity: String = "",
    epochDay: Long = LocalDate.now().toEpochDay(),
    allowCityFallback: Boolean = true,
): String? {
    val contentBackdrop = contentBackdropUrl?.trim()?.toAbsoluteBackdropUrl()
    return when (settings.backgroundMode) {
        BackgroundMode.AUTO -> {
            val cityBackdrop = if (allowCityFallback) cityBackgroundUrlForDay(epochDay + weatherCity.stableCityOffset()) else null
            cityBackdrop
        }
        BackgroundMode.DYNAMIC_CONTENT -> contentBackdrop ?: cityBackgroundUrlForDay(epochDay + weatherCity.stableCityOffset())
        BackgroundMode.CITY_ROTATION -> cityBackgroundUrlForDay(epochDay + weatherCity.stableCityOffset())
        BackgroundMode.CUSTOM_URL -> settings.customBackgroundUrl.trim().toAbsoluteBackdropUrl()
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

private fun String.toAbsoluteBackdropUrl(): String? {
    val clean = trim().takeIf { it.isNotBlank() } ?: return null
    val absolute = if (clean.startsWith("/")) {
        "${WebApiEndpoint.primaryBaseUrl.ifBlank { "https://moalfarras.space" }}$clean"
    } else {
        clean
    }
    return absolute.takeIf(::isValidBackdropUrl)
}
