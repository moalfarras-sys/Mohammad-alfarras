package com.moalfarras.moplayer.data.network

import okhttp3.ResponseBody
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Body
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.QueryMap
import retrofit2.http.Query
import retrofit2.http.Url

interface PlaylistService {
    @GET
    suspend fun getText(@Url url: String): ResponseBody
}

interface XtreamService {
    @GET("player_api.php")
    suspend fun rawPlayerApi(
        @QueryMap(encoded = true) query: Map<String, String>,
    ): ResponseBody

    @GET("player_api.php")
    suspend fun liveCategories(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_live_categories",
    ): List<XtreamCategoryDto>

    @GET("player_api.php")
    suspend fun vodCategories(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_vod_categories",
    ): List<XtreamCategoryDto>

    @GET("player_api.php")
    suspend fun seriesCategories(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_series_categories",
    ): List<XtreamCategoryDto>

    @GET("player_api.php")
    suspend fun liveStreams(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_live_streams",
    ): List<XtreamLiveDto>

    @GET("player_api.php")
    suspend fun vodStreams(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_vod_streams",
    ): List<XtreamVodDto>

    @GET("player_api.php")
    suspend fun series(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_series",
    ): List<XtreamSeriesDto>

    @GET("player_api.php")
    suspend fun seriesInfo(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("series_id") seriesId: String,
        @Query("action") action: String = "get_series_info",
    ): XtreamSeriesInfoResponseDto

    @GET("player_api.php")
    suspend fun shortEpg(
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("stream_id") streamId: String,
        @Query("limit") limit: Int = 10,
        @Query("action") action: String = "get_short_epg",
    ): ResponseBody

    @GET("xmltv.php")
    suspend fun xmltv(
        @Query("username") username: String,
        @Query("password") password: String,
    ): ResponseBody
}

interface WeatherService {
    @GET("v1/current.json")
    suspend fun current(
        @Query("key") key: String,
        @Query("q") query: String,
        @Query("aqi") airQuality: String = "no",
    ): WeatherResponseDto
}

interface FootballService {
    @GET("fixtures")
    suspend fun fixtures(
        @Query("live") live: String = "all",
    ): FootballResponseDto
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

    @GET("rest/v1/aecodes")
    suspend fun activationCode(
        @Header("apikey") anonKey: String,
        @Header("Authorization") bearer: String?,
        @Query("code") codeEq: String,
        @Query("select") select: String = "*",
        @Query("limit") limit: Int = 1,
    ): List<ActivationCodeDto>

    @POST("rest/v1/device_activation_codes")
    suspend fun createDeviceActivation(
        @Header("apikey") anonKey: String,
        @Header("Authorization") bearer: String?,
        @Header("Prefer") prefer: String = "return=representation",
        @Body body: DeviceActivationInsertDto,
    ): List<DeviceActivationDto>

    @GET("rest/v1/device_activation_codes")
    suspend fun deviceActivation(
        @Header("apikey") anonKey: String,
        @Header("Authorization") bearer: String?,
        @Query("device_code") deviceCodeEq: String,
        @Query("select") select: String = "*",
        @Query("limit") limit: Int = 1,
    ): List<DeviceActivationDto>

    @PATCH("rest/v1/device_activation_codes")
    suspend fun updateDeviceActivationStatus(
        @Header("apikey") anonKey: String,
        @Header("Authorization") bearer: String?,
        @Header("Prefer") prefer: String = "return=minimal",
        @Query("device_code") deviceCodeEq: String,
        @Body body: DeviceActivationUpdateDto,
    ): ResponseBody
}
