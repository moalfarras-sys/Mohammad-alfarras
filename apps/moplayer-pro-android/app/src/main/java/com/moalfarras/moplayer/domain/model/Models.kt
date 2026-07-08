package com.moalfarras.moplayer.domain.model

import androidx.compose.runtime.Immutable

enum class LoginKind { M3U, XTREAM }

enum class ContentType { LIVE, MOVIE, SERIES, EPISODE }

enum class SortOption { SERVER_ORDER, LATEST_ADDED, TITLE_ASC, TITLE_DESC, RECENTLY_WATCHED, FAVORITES_FIRST, RATING }

enum class LibraryMode { ACTIVE_SOURCE, MERGED }

enum class BackgroundMode { AUTO, DYNAMIC_CONTENT, CITY_ROTATION, CUSTOM_URL, NONE }

enum class ThemePreset { CINEMATIC_AUTO, CITY, CALM }

enum class MotionLevel { LOW, BALANCED, RICH }

enum class PerformanceMode { AUTO, PERFORMANCE, BALANCED, QUALITY }

enum class VideoSizeMode { AUTO, FIT, FILL, ZOOM }

enum class AccentMode { CUSTOM }

enum class WeatherMode { AUTO_IP, CITY, MANUAL }

enum class ManualWeatherEffect { SUNNY, CLOUDY, RAIN, STORM, SNOW, FOG }

@Immutable
data class ServerProfile(
    val id: Long = 0,
    val name: String,
    val kind: LoginKind,
    val baseUrl: String,
    val username: String = "",
    val password: String = "",
    val playlistUrl: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val lastSyncAt: Long = 0,
    val host: String = "",
    val accountStatus: String = "",
    val expiryDate: Long = 0,
    val activeConnections: Int = 0,
    val maxConnections: Int = 0,
    val allowedOutputFormats: List<String> = emptyList(),
    val timezone: String = "",
    val serverMessage: String = "",
    val lastSyncSource: String = "",
    val epgUrl: String = "",
    val sourceKey: String = "",
)

/**
 * True when the provider reports this account is no longer usable (expired, banned, or
 * disabled). The panel's own status string is the authoritative signal; a past expiry date
 * is a secondary check. M3U/file sources (no status, no expiry) are never flagged.
 */
fun ServerProfile.subscriptionInactive(nowMs: Long = System.currentTimeMillis()): Boolean {
    val status = accountStatus.trim()
    if (status.equals("Expired", ignoreCase = true) ||
        status.equals("Banned", ignoreCase = true) ||
        status.equals("Disabled", ignoreCase = true)
    ) {
        return true
    }
    if (expiryDate <= 0L) return false
    val expiryMs = if (expiryDate < 100_000_000_000L) expiryDate * 1000L else expiryDate
    return expiryMs < nowMs
}

@Immutable
data class Category(
    val id: String,
    val serverId: Long,
    val type: ContentType,
    val name: String,
    val sortOrder: Int = 0,
    val parentId: String = "",
    val rawJson: String = "",
)

@Immutable
data class MediaItem(
    val id: String,
    val serverId: Long,
    val type: ContentType,
    val categoryId: String,
    val categoryName: String = "",
    val title: String,
    val streamUrl: String,
    val posterUrl: String = "",
    val backdropUrl: String = "",
    val description: String = "",
    val rating: String = "",
    val durationSecs: Long = 0,
    val addedAt: Long = 0,
    val lastModifiedAt: Long = 0,
    val addedAtUnknown: Boolean = false,
    val serverOrder: Int = Int.MAX_VALUE,
    val containerExtension: String = "",
    val seriesId: String = "",
    val seasonNumber: Int = 0,
    val episodeNumber: Int = 0,
    val isFavorite: Boolean = false,
    val watchPositionMs: Long = 0,
    val watchDurationMs: Long = 0,
    val lastPlayedAt: Long = 0,
    val tvgId: String = "",
    val catchup: String = "",
    val cast: String = "",
    val director: String = "",
    val genre: String = "",
    val releaseDate: String = "",
    val rawJson: String = "",
)

@Immutable
data class WeatherSnapshot(
    val city: String = "",
    val condition: String = "",
    val temperatureC: Double = Double.NaN,
    val iconUrl: String = "",
    val timeZoneId: String = java.time.ZoneId.systemDefault().id,
    val isManual: Boolean = false,
) {
    val hasRealWeather: Boolean
        get() = !isManual && city.isNotBlank() && condition.isNotBlank() && !temperatureC.isNaN()
}

@Immutable
data class FootballMatch(
    val league: String,
    val home: String,
    val away: String,
    val score: String,
    val minute: String,
    val isLive: Boolean = false,
    val homeBadge: String = "",
    val awayBadge: String = "",
    val newsMessage: String = "",
)

@Immutable
data class AppSettings(
    val previewEnabled: Boolean = true,
    /** Admin-controlled: autoplay a muted trailer in the preview pane after a short focus dwell. */
    val trailerPreviewEnabled: Boolean = true,
    val accentColor: Long = 0xFFFF9248,
    val accentMode: AccentMode = AccentMode.CUSTOM,
    val backgroundMode: BackgroundMode = BackgroundMode.AUTO,
    val customBackgroundUrl: String = "",
    val remoteBackgroundUrl: String = "",
    val themePreset: ThemePreset = ThemePreset.CINEMATIC_AUTO,
    val motionLevel: MotionLevel = MotionLevel.BALANCED,
    val performanceMode: PerformanceMode = PerformanceMode.AUTO,
    val videoSizeMode: VideoSizeMode = VideoSizeMode.AUTO,
    val showWeatherWidget: Boolean = true,
    val showClockWidget: Boolean = true,
    val showFootballWidget: Boolean = true,
    val weatherMode: WeatherMode = WeatherMode.AUTO_IP,
    val manualWeatherEffect: ManualWeatherEffect = ManualWeatherEffect.SUNNY,
    val weatherCityOverride: String = "",
    val footballMaxMatches: Int = 4,
    val preferredPlayer: String = "auto",
    val defaultSort: SortOption = SortOption.SERVER_ORDER,
    val parentalControlsEnabled: Boolean = false,
    val hasParentalPin: Boolean = false,
    val autoPlayLastLive: Boolean = false,
    val hideEmptyCategories: Boolean = false,
    val hideChannelsWithoutLogo: Boolean = false,
    val searchHistory: List<String> = emptyList(),
    val languageTag: String = "system",
    val lastSection: String = "HOME",
    val lastFocusState: String = "",
    val lastCategoryState: String = "",
    val libraryMode: LibraryMode = LibraryMode.ACTIVE_SOURCE,
    /** Home notification: "auto" | "on" | "off" — admin-overridable via remote config. */
    val homeNotificationMode: String = "auto",
    val homeNotificationType: String = "world_cup_2026",
    val homeNotificationTitle: String = "",
    val homeNotificationMessage: String = "",
    /** Optional yyyy-MM-dd target for a repurposable countdown (defaults to the World Cup schedule). */
    val homeNotificationTargetDate: String = "",
)

@Immutable
data class EpgEntry(
    val title: String,
    val description: String = "",
    val startAt: Long = 0,
    val endAt: Long = 0,
    val category: String = "",
)

@Immutable
data class LiveEpgSnapshot(
    val current: EpgEntry? = null,
    val next: EpgEntry? = null,
)

data class LoadProgress(
    val phase: String,
    val loaded: Int,
    val total: Int,
) {
    val percent: Float = if (total <= 0) 0f else loaded.toFloat() / total.toFloat()
}

data class DeviceActivationSession(
    val deviceCode: String,
    val userCode: String,
    val verificationUrl: String,
    val verificationUrlComplete: String,
    val expiresAt: Long,
    val intervalSeconds: Int,
    val status: DeviceActivationStatus = DeviceActivationStatus.WAITING,
    val error: String = "",
    val publicDeviceId: String = "",
    val sourcePullToken: String = "",
) {
    val secondsRemaining: Long
        get() = ((expiresAt - System.currentTimeMillis()) / 1000L).coerceAtLeast(0)
}

enum class DeviceActivationStatus {
    WAITING,
    ACTIVATED,
    EXPIRED,
    ERROR,
}

data class ActivatedProfile(
    val name: String,
    val kind: LoginKind,
    val baseUrl: String = "",
    val username: String = "",
    val password: String = "",
    val playlistUrl: String = "",
    val epgUrl: String = "",
    val sourceId: String = "",
    val publicDeviceId: String = "",
    val sourcePullToken: String = "",
)
