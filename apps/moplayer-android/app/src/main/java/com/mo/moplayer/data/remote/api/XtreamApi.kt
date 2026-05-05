package com.mo.moplayer.data.remote.api

import com.mo.moplayer.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query
import retrofit2.http.Url

/**
 * Xtream Codes API Interface
 * 
 * Base URL format: http://server:port/player_api.php
 */
interface XtreamApi {
    
    /**
     * Authenticate and get user/server info
     * Example: http://server:port/player_api.php?username=xxx&password=xxx
     */
    @GET
    suspend fun authenticate(
        @Url url: String,
        @Query("username") username: String,
        @Query("password") password: String
    ): Response<AuthResponse>
    
    /**
     * Get Live TV Categories
     * Example: http://server:port/player_api.php?username=xxx&password=xxx&action=get_live_categories
     */
    @GET
    suspend fun getLiveCategories(
        @Url url: String,
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_live_categories"
    ): Response<List<CategoryDto>>
    
    /**
     * Get VOD (Movie) Categories
     */
    @GET
    suspend fun getVodCategories(
        @Url url: String,
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_vod_categories"
    ): Response<List<CategoryDto>>
    
    /**
     * Get Series Categories
     */
    @GET
    suspend fun getSeriesCategories(
        @Url url: String,
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_series_categories"
    ): Response<List<CategoryDto>>
    
    /**
     * Get Live Streams
     * Optional: category_id to filter by category
     */
    @GET
    suspend fun getLiveStreams(
        @Url url: String,
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_live_streams",
        @Query("category_id") categoryId: String? = null
    ): Response<List<LiveStreamDto>>
    
    /**
     * Get VOD (Movie) Streams
     */
    @GET
    suspend fun getVodStreams(
        @Url url: String,
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_vod_streams",
        @Query("category_id") categoryId: String? = null
    ): Response<List<VodStreamDto>>
    
    /**
     * Get Series List
     */
    @GET
    suspend fun getSeries(
        @Url url: String,
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_series",
        @Query("category_id") categoryId: String? = null
    ): Response<List<SeriesDto>>
    
    /**
     * Get VOD (Movie) Info
     */
    @GET
    suspend fun getVodInfo(
        @Url url: String,
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_vod_info",
        @Query("vod_id") vodId: Int
    ): Response<VodInfoResponse>
    
    /**
     * Get Series Info with Episodes
     */
    @GET
    suspend fun getSeriesInfo(
        @Url url: String,
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_series_info",
        @Query("series_id") seriesId: Int
    ): Response<SeriesInfoResponse>
    
    /**
     * Get EPG (Short EPG for specific stream)
     */
    @GET
    suspend fun getShortEpg(
        @Url url: String,
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_short_epg",
        @Query("stream_id") streamId: Int,
        @Query("limit") limit: Int = 10
    ): Response<Map<String, List<EpgListingDto>>>
    
    /**
     * Get Full EPG for all channels
     */
    @GET
    suspend fun getFullEpg(
        @Url url: String,
        @Query("username") username: String,
        @Query("password") password: String,
        @Query("action") action: String = "get_simple_data_table",
        @Query("stream_id") streamId: Int? = null
    ): Response<Map<String, List<EpgListingDto>>>
}
