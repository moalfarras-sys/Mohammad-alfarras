package com.moalfarras.moplayer.data.network

import kotlinx.serialization.Serializable
import okhttp3.ResponseBody
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Body
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.QueryMap
import retrofit2.http.Streaming
import retrofit2.http.Query
import retrofit2.http.Url

interface PlaylistService {
    /** Playlists and XMLTV guides; streamed so a 100 MB guide is never buffered in memory. */
    @Streaming
    @GET
    suspend fun getText(@Url url: String): ResponseBody
}

interface XtreamService {
    /** Small player_api calls (account, categories, get_vod_info, get_series_info). */
    @GET("player_api.php")
    suspend fun rawPlayerApi(
        @QueryMap query: Map<String, String>,
    ): ResponseBody

    /**
     * Bulk lists (get_live_streams / get_vod_streams / get_series). Streamed so the body is parsed
     * item by item instead of being buffered, and the dispatcher slot is freed after the headers.
     */
    @Streaming
    @GET("player_api.php")
    suspend fun rawPlayerApiStream(
        @QueryMap query: Map<String, String>,
    ): ResponseBody

    @GET("player_api.php")
    suspend fun shortEpg(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("stream_id") streamId: String,
        @Query("limit") limit: Int = 10,
        @Query("action") action: String = "get_short_epg",
    ): ResponseBody

    @Streaming
    @GET("xmltv.php")
    suspend fun xmltv(
        @Query("username") username: String,
        @Query("password") password: String,
    ): ResponseBody
}

interface WebWeatherService {
    @GET
    suspend fun weather(
        @Url url: String,
    ): WebWeatherDto
}

/** Free, key-less football data (TheSportsDB public test key "3"). */
interface SportsDbService {
    @GET("eventsday.php")
    suspend fun eventsDay(
        @Query("d") date: String,
        @Query("s") sport: String = "Soccer",
    ): SportsDbEventsDto

    @GET("eventsnextleague.php")
    suspend fun nextLeague(
        @Query("id") leagueId: String,
    ): SportsDbEventsDto
}

interface WebFootballService {
    @GET
    suspend fun football(
        @Url url: String,
    ): WebFootballResponseDto
}

interface SupabaseService {
    @POST
    suspend fun createWebDeviceActivation(
        @Url url: String,
        @Body body: WebActivationCreateRequestDto,
    ): WebActivationCreateResponseDto

    @GET
    suspend fun webDeviceActivationStatus(
        @Url url: String,
    ): WebActivationStatusDto

    @GET
    suspend fun webDeviceActivationSource(
        @Url url: String,
    ): WebActivationSourceDto

    @POST
    suspend fun webDeviceActivationSourceAck(
        @Url url: String,
        @Body body: WebActivationSourceAckRequestDto,
    ): ResponseBody

    @POST("rest/v1/watch_progress")
    suspend fun upsertWatchProgress(
        @Header("apikey") anonKey: String,
        @Header("Authorization") bearer: String?,
        @Header("Prefer") prefer: String = "resolution=merge-duplicates,return=minimal",
        @Body body: WatchProgressDto,
    ): ResponseBody

    @GET("rest/v1/watch_progress")
    suspend fun watchProgress(
        @Header("apikey") anonKey: String,
        @Header("Authorization") bearer: String?,
        @Query("source_key") sourceKeyEq: String,
        @Query("media_id") mediaIdEq: String,
        @Query("media_type") mediaTypeEq: String,
        @Query("select") select: String = "*",
        @Query("order") order: String = "updated_at_ms.desc",
        @Query("limit") limit: Int = 1,
    ): List<WatchProgressDto>

    @GET("rest/v1/remote_commands")
    suspend fun pendingRemoteCommands(
        @Header("apikey") anonKey: String,
        @Header("Authorization") bearer: String?,
        @Query("device_id") deviceIdEq: String,
        @Query("status") statusEq: String = "eq.pending",
        @Query("select") select: String = "*",
        @Query("order") order: String = "created_at.asc",
        @Query("limit") limit: Int = 20,
    ): List<RemoteCommandDto>

    @PATCH("rest/v1/remote_commands")
    suspend fun acknowledgeRemoteCommand(
        @Header("apikey") anonKey: String,
        @Header("Authorization") bearer: String?,
        @Header("Prefer") prefer: String = "return=minimal",
        @Query("id") idEq: String,
        @Body body: RemoteCommandAckDto = RemoteCommandAckDto(),
    ): ResponseBody
}

@Serializable
data class IpApiResponse(
    val city: String = "",
    val lat: Double = 0.0,
    val lon: Double = 0.0,
    val timezone: String = java.time.ZoneId.systemDefault().id,
)

@Serializable
data class OpenMeteoCurrent(
    val temperature_2m: Double? = null,
    val weather_code: Int = 0
)

@Serializable
data class OpenMeteoResponse(
    val current: OpenMeteoCurrent
)

interface FreeWeatherService {
    @GET("http://ip-api.com/json/")
    suspend fun getIpLocation(): IpApiResponse

    @GET("https://geocoding-api.open-meteo.com/v1/search")
    suspend fun geocodeCity(
        @Query("name") name: String,
        @Query("count") count: Int = 1,
        @Query("language") language: String = "en",
        @Query("format") format: String = "json",
    ): OpenMeteoGeocodingResponse

    @GET("https://api.open-meteo.com/v1/forecast")
    suspend fun getWeather(
        @Query("latitude") lat: Double,
        @Query("longitude") lon: Double,
        @Query("current") current: String = "temperature_2m,weather_code"
    ): OpenMeteoResponse
}
