package com.mo.moplayer.data.football

import com.google.gson.annotations.SerializedName

/**
 * API-Football (api-sports.io) Response DTOs
 * https://www.api-football.com/documentation-v3
 */

data class FixtureResponse(
    @SerializedName("get") val get: String?,
    @SerializedName("parameters") val parameters: Map<String, String>?,
    @SerializedName("results") val results: Int = 0,
    @SerializedName("response") val response: List<FixtureItem> = emptyList()
)

data class FixtureItem(
    @SerializedName("fixture") val fixture: Fixture?,
    @SerializedName("league") val league: League?,
    @SerializedName("teams") val teams: FixtureTeams?,
    @SerializedName("goals") val goals: Goals?,
    @SerializedName("score") val score: Score?
)

data class Fixture(
    @SerializedName("id") val id: Long?,
    @SerializedName("referee") val referee: String?,
    @SerializedName("timezone") val timezone: String?,
    @SerializedName("date") val date: String?,
    @SerializedName("timestamp") val timestamp: Long?,
    @SerializedName("periods") val periods: FixturePeriods?,
    @SerializedName("venue") val venue: Venue?,
    @SerializedName("status") val status: FixtureStatus?
)

data class FixturePeriods(
    @SerializedName("first") val first: Long?,
    @SerializedName("second") val second: Long?
)

data class Venue(
    @SerializedName("id") val id: Int?,
    @SerializedName("name") val name: String?,
    @SerializedName("city") val city: String?
)

data class FixtureStatus(
    @SerializedName("long") val long: String?,
    @SerializedName("short") val short: String?,
    @SerializedName("elapsed") val elapsed: Int?
)

data class League(
    @SerializedName("id") val id: Int?,
    @SerializedName("name") val name: String?,
    @SerializedName("country") val country: String?,
    @SerializedName("logo") val logo: String?,
    @SerializedName("flag") val flag: String?,
    @SerializedName("season") val season: Int?,
    @SerializedName("round") val round: String?
)

data class FixtureTeams(
    @SerializedName("home") val home: TeamInfo?,
    @SerializedName("away") val away: TeamInfo?
)

data class TeamInfo(
    @SerializedName("id") val id: Int?,
    @SerializedName("name") val name: String?,
    @SerializedName("logo") val logo: String?,
    @SerializedName("winner") val winner: Boolean?
)

data class Goals(
    @SerializedName("home") val home: Int?,
    @SerializedName("away") val away: Int?
)

data class Score(
    @SerializedName("halftime") val halftime: ScorePart?,
    @SerializedName("fulltime") val fulltime: ScorePart?,
    @SerializedName("extratime") val extratime: ScorePart?,
    @SerializedName("penalty") val penalty: ScorePart?
)

data class ScorePart(
    @SerializedName("home") val home: Int?,
    @SerializedName("away") val away: Int?
)
