package com.mo.moplayer.data.football

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

/**
 * API-Football (api-sports.io) Interface Base URL: https://v3.football.api-sports.io/ Requires
 * header: x-apisports-key
 */
interface FootballApi {

    /**
     * Get live fixtures
     * @param live "all" for all live matches, or league ID for specific league
     */
    @GET("fixtures")
    suspend fun getLiveFixtures(@Query("live") live: String = "all"): Response<FixtureResponse>

    /**
     * Get fixtures for a specific date (YYYY-MM-DD format)
     * Used for today's important matches when no live match
     */
    @GET("fixtures")
    suspend fun getFixturesByDate(@Query("date") date: String): Response<FixtureResponse>
}
