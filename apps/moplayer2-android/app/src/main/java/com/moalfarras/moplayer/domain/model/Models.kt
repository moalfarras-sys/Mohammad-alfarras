package com.moalfarras.moplayer.domain.model

enum class LoginKind { M3U, XTREAM }

enum class ContentType { LIVE, MOVIE, SERIES, EPISODE }

enum class SortOption { SERVER_ORDER, LATEST_ADDED, TITLE_ASC, TITLE_DESC, RECENTLY_WATCHED, FAVORITES_FIRST, RATING }

enum class LibraryMode { ACTIVE_SOURCE, MERGED }

enum class BackgroundMode { AUTO, CITY_ROTATION, CUSTOM_URL, NONE }

enum class ThemePreset { CINEMATIC_AUTO, CITY, CALM }

enum class MotionLevel { LOW, BALANCED, RICH }

enum class AccentMode { DYNAMIC, CUSTOM }

enum class WeatherMode { AUTO_IP, CITY, MANUAL }

enum class ManualWeatherEffect { SUNNY, CLOUDY, RAIN, STORM, SNOW, FOG }

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

data class Category(
    val id: String,
    val serverId: Long,
    val type: ContentType,
    val name: String,
    val sortOrder: Int = 0,
    val parentId: String = "",
    val rawJson: String = "",
)

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

data class WeatherSnapshot(
    val city: String = "TV Room",
    val condition: String = "Clear",
    val temperatureC: Double = 21.0,
    val iconUrl: String = "",
    val timeZoneId: String = java.time.ZoneId.systemDefault().id,
    val isManual: Boolean = false,
)

data class FootballMatch(
    val league: String,
    val home: String,
    val away: String,
    val score: String,
    val minute: String,
)

data class AppSettings(
    val previewEnabled: Boolean = true,
    val accentColor: Long = 0xFF4DA3FF,
    val accentMode: AccentMode = AccentMode.DYNAMIC,
    val backgroundMode: BackgroundMode = BackgroundMode.AUTO,
    val customBackgroundUrl: String = "",
    val themePreset: ThemePreset = ThemePreset.CINEMATIC_AUTO,
    val motionLevel: MotionLevel = MotionLevel.BALANCED,
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
    val autoPlayLastLive: Boolean = true,
    val hideEmptyCategories: Boolean = false,
    val hideChannelsWithoutLogo: Boolean = false,
    val searchHistory: List<String> = emptyList(),
    val languageTag: String = "system",
    val lastSection: String = "HOME",
    val libraryMode: LibraryMode = LibraryMode.MERGED,
)

data class EpgEntry(
    val title: String,
    val description: String = "",
    val startAt: Long = 0,
    val endAt: Long = 0,
    val category: String = "",
)

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
)
