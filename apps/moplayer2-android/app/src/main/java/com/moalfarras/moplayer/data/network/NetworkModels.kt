package com.moalfarras.moplayer.data.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class XtreamCategoryDto(
    @SerialName("category_id") val categoryId: String = "",
    @SerialName("category_name") val categoryName: String = "",
    @SerialName("parent_id") val parentId: Int = 0,
)

@Serializable
data class XtreamLiveDto(
    @SerialName("num") val num: Int = 0,
    @SerialName("name") val name: String = "",
    @SerialName("stream_id") val streamId: Int = 0,
    @SerialName("stream_icon") val streamIcon: String = "",
    @SerialName("category_id") val categoryId: String = "",
    @SerialName("added") val added: String = "0",
)

@Serializable
data class XtreamVodDto(
    @SerialName("num") val num: Int = 0,
    @SerialName("name") val name: String = "",
    @SerialName("stream_id") val streamId: Int = 0,
    @SerialName("stream_icon") val streamIcon: String = "",
    @SerialName("cover") val cover: String = "",
    @SerialName("category_id") val categoryId: String = "",
    @SerialName("rating") val rating: String = "",
    @SerialName("added") val added: String = "0",
)

@Serializable
data class XtreamSeriesDto(
    @SerialName("num") val num: Int = 0,
    @SerialName("name") val name: String = "",
    @SerialName("series_id") val seriesId: Int = 0,
    @SerialName("cover") val cover: String = "",
    @SerialName("plot") val plot: String = "",
    @SerialName("category_id") val categoryId: String = "",
    @SerialName("rating") val rating: String = "",
    @SerialName("last_modified") val lastModified: String = "0",
)

@Serializable
data class XtreamSeriesInfoResponseDto(
    val info: XtreamSeriesInfoDto = XtreamSeriesInfoDto(),
    val episodes: Map<String, List<XtreamEpisodeDto>> = emptyMap(),
    val seasons: List<XtreamSeasonDto> = emptyList(),
)

@Serializable
data class XtreamSeriesInfoDto(
    val name: String = "",
    val plot: String = "",
    val rating: String = "",
    @SerialName("cover") val cover: String = "",
    @SerialName("cover_big") val coverBig: String = "",
    @SerialName("backdrop_path") val backdropPath: List<String> = emptyList(),
)

@Serializable
data class XtreamSeasonDto(
    @SerialName("season_number") val seasonNumber: Int = 0,
    @SerialName("cover") val cover: String = "",
    @SerialName("name") val name: String = "",
)

@Serializable
data class XtreamEpisodeDto(
    val id: String = "",
    val title: String = "",
    @SerialName("episode_num") val episodeNum: Int = 0,
    val season: Int = 0,
    @SerialName("container_extension") val containerExtension: String = "mp4",
    val added: String = "0",
    val info: XtreamEpisodeInfoDto = XtreamEpisodeInfoDto(),
)

@Serializable
data class XtreamEpisodeInfoDto(
    val plot: String = "",
    val duration: String = "",
    @SerialName("duration_secs") val durationSecs: String = "0",
    @SerialName("movie_image") val movieImage: String = "",
    @SerialName("cover_big") val coverBig: String = "",
)

@Serializable
data class WeatherResponseDto(
    val location: WeatherLocationDto = WeatherLocationDto(),
    val current: WeatherCurrentDto = WeatherCurrentDto(),
)

@Serializable
data class WeatherLocationDto(val name: String = "")

@Serializable
data class WeatherCurrentDto(
    @SerialName("temp_c") val tempC: Double = 0.0,
    val condition: WeatherConditionDto = WeatherConditionDto(),
)

@Serializable
data class WeatherConditionDto(val text: String = "", val icon: String = "")

@Serializable
data class FootballResponseDto(
    val response: List<FixtureDto> = emptyList(),
)

@Serializable
data class FixtureDto(
    val league: LeagueDto = LeagueDto(),
    val teams: TeamsDto = TeamsDto(),
    val goals: GoalsDto = GoalsDto(),
    val fixture: FixtureInfoDto = FixtureInfoDto(),
)

@Serializable data class LeagueDto(val name: String = "")
@Serializable data class TeamsDto(val home: TeamDto = TeamDto(), val away: TeamDto = TeamDto())
@Serializable data class TeamDto(val name: String = "")
@Serializable data class GoalsDto(val home: Int? = null, val away: Int? = null)
@Serializable data class FixtureInfoDto(val status: StatusDto = StatusDto())
@Serializable data class StatusDto(val elapsed: Int? = null, val short: String = "")

@Serializable
data class ActivationCodeDto(
    val code: String = "",
    @SerialName("server_name") val serverName: String = "",
    @SerialName("server_type") val serverType: String = "m3u",
    @SerialName("base_url") val baseUrl: String = "",
    val username: String = "",
    val password: String = "",
    @SerialName("playlist_url") val playlistUrl: String = "",
    @SerialName("expires_at") val expiresAt: String? = null,
    val revoked: Boolean = false,
)

@Serializable
data class DeviceActivationInsertDto(
    @SerialName("device_code") val deviceCode: String,
    @SerialName("user_code") val userCode: String,
    @SerialName("verification_url") val verificationUrl: String,
    @SerialName("verification_url_complete") val verificationUrlComplete: String,
    @SerialName("device_name") val deviceName: String,
    @SerialName("device_label") val deviceLabel: String,
    @SerialName("app_version") val appVersion: String,
    val status: String = "pending",
    @SerialName("expires_at") val expiresAt: String,
    @SerialName("poll_interval_seconds") val pollIntervalSeconds: Int = 5,
)

@Serializable
data class DeviceActivationUpdateDto(
    val status: String,
)

@Serializable
data class DeviceActivationDto(
    @SerialName("device_code") val deviceCode: String = "",
    @SerialName("user_code") val userCode: String = "",
    @SerialName("verification_url") val verificationUrl: String = "",
    @SerialName("verification_url_complete") val verificationUrlComplete: String = "",
    @SerialName("device_name") val deviceName: String = "",
    @SerialName("device_label") val deviceLabel: String = "",
    @SerialName("app_version") val appVersion: String = "",
    val status: String = "pending",
    @SerialName("server_name") val serverName: String = "",
    @SerialName("server_type") val serverType: String = "",
    @SerialName("base_url") val baseUrl: String = "",
    val username: String = "",
    val password: String = "",
    @SerialName("playlist_url") val playlistUrl: String = "",
    @SerialName("expires_at") val expiresAt: String = "",
    @SerialName("activated_at") val activatedAt: String? = null,
    @SerialName("consumed_at") val consumedAt: String? = null,
    @SerialName("poll_interval_seconds") val pollIntervalSeconds: Int = 5,
    @SerialName("error_message") val errorMessage: String = "",
)

@Serializable
data class WebActivationCreateRequestDto(
    val publicDeviceId: String,
    val deviceName: String,
    val deviceType: String = "android-tv",
    val platform: String = "android",
    val appVersion: String = "",
    val sourcePullToken: String,
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
    val source: WebProviderSourceDto? = null,
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
