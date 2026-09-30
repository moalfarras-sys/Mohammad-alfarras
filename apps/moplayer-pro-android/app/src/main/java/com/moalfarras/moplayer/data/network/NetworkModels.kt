package com.moalfarras.moplayer.data.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SportsDbEventsDto(
    val events: List<SportsDbEventDto>? = null,
)

@Serializable
data class SportsDbEventDto(
    val idEvent: String = "",
    val strEvent: String = "",
    val strLeague: String = "",
    val idLeague: String = "",
    val strHomeTeam: String = "",
    val strAwayTeam: String = "",
    val intHomeScore: String? = null,
    val intAwayScore: String? = null,
    val strTimestamp: String? = null,
    val dateEvent: String? = null,
    val strTime: String? = null,
    val strStatus: String = "",
    val strProgress: String = "",
    val strHomeTeamBadge: String = "",
    val strAwayTeamBadge: String = "",
)

@Serializable
data class WebFootballResponseDto(
    val matches: List<WebFootballMatchDto> = emptyList(),
    val importantMatches: List<WebFootballMatchDto> = emptyList(),
    val source: String = "",
    val mode: String = "",
    val newsMessage: String = "",
)

@Serializable
data class WebFootballMatchDto(
    val id: Long = 0,
    val date: String = "",
    val status: String = "",
    val elapsed: Int? = null,
    val league: String = "",
    val leagueLogo: String = "",
    val homeTeam: String = "",
    val homeLogo: String = "",
    val awayTeam: String = "",
    val awayLogo: String = "",
    val homeGoals: Int? = null,
    val awayGoals: Int? = null,
)

@Serializable
data class WebWeatherDto(
    val city: String = "",
    val country: String = "",
    @SerialName("temp_c") val tempC: Double? = null,
    val condition: String = "",
    val icon: String = "",
    val localtime: String = "",
    val error: String = "",
)

@Serializable
data class OpenMeteoGeocodingResponse(
    val results: List<OpenMeteoGeocodingResult> = emptyList(),
)

@Serializable
data class OpenMeteoGeocodingResult(
    val name: String = "",
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val country: String = "",
    val timezone: String = java.time.ZoneId.systemDefault().id,
)

@Serializable
data class WebActivationCreateRequestDto(
    val publicDeviceId: String,
    val deviceName: String,
    val deviceType: String = "android-tv",
    val platform: String = "android",
    val appVersion: String = "",
    val sourcePullToken: String,
    val productSlug: String,
)

@Serializable
data class WebActivationCreateResponseDto(
    val status: String = "",
    val code: String = "",
    val expiresAt: String = "",
    val ttlSeconds: Int = 900,
    val message: String = "",
)

@Serializable
data class WebActivationStatusDto(
    val status: String = "",
    val code: String = "",
    val publicDeviceId: String = "",
    val expiresAt: String = "",
    val message: String = "",
    val sourceStatus: String = "",
    val sourceMessage: String = "",
)

@Serializable
data class WebActivationSourceDto(
    val status: String = "",
    val message: String = "",
    val sourceId: String = "",
    val source: WebProviderSourceDto? = null,
)

@Serializable
data class WebActivationSourceAckRequestDto(
    val publicDeviceId: String,
    val token: String,
    val sourceId: String,
    val status: String,
    val message: String = "",
)

@Serializable
data class WebProviderSourceDto(
    val type: String = "",
    val name: String = "",
    val serverUrl: String = "",
    val username: String = "",
    val password: String = "",
    val playlistUrl: String = "",
    val epgUrl: String = "",
)

@Serializable
data class WatchProgressDto(
    @SerialName("source_key") val sourceKey: String = "",
    @SerialName("media_id") val mediaId: String = "",
    @SerialName("media_type") val mediaType: String = "",
    @SerialName("position_ms") val positionMs: Long = 0,
    @SerialName("duration_ms") val durationMs: Long = 0,
    @SerialName("updated_at_ms") val updatedAtMs: Long = 0,
    @SerialName("device_id") val deviceId: String = "",
)

@Serializable
data class RemoteCommandDto(
    val id: String = "",
    @SerialName("device_id") val deviceId: String = "",
    val command: String = "",
    val payload: String = "",
    val status: String = "pending",
    @SerialName("created_at") val createdAt: String = "",
)

@Serializable
data class RemoteCommandAckDto(
    val status: String = "handled",
)
