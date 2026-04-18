package com.mo.moplayer.data.football

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.mo.moplayer.BuildConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import javax.inject.Inject
import javax.inject.Singleton

private val Context.footballDataStore: DataStore<Preferences> by preferencesDataStore(name = "football_cache")

@Singleton
class FootballService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private const val BASE_URL = "https://v3.football.api-sports.io"
        private val CACHED_DATA_PREF = stringPreferencesKey("cached_football_json")
        private val LAST_UPDATE_PREF = longPreferencesKey("last_update_timestamp")
        private val WIDGET_ENABLED_KEY = androidx.datastore.preferences.core.booleanPreferencesKey("football_widget_enabled")
        
        // Cache TTL: 15 minutes
        private const val CACHE_TTL_MS = 15 * 60 * 1000L 
        
        // Top 5 Leagues: PL(39), LaLiga(140), SerieA(135), Bundesliga(78), Ligue1(61)
        private const val LEAGUES = "39-140-135-78-61"
    }

    val footballWidgetEnabled: Flow<Boolean> = context.footballDataStore.data.map { prefs ->
        prefs[WIDGET_ENABLED_KEY] ?: true
    }

    suspend fun setFootballWidgetEnabled(enabled: Boolean) {
        context.footballDataStore.edit { prefs ->
            prefs[WIDGET_ENABLED_KEY] = enabled
        }
    }

    val footballData: Flow<FootballData?> = context.footballDataStore.data.map { prefs ->
        val jsonStr = prefs[CACHED_DATA_PREF]
        if (jsonStr != null) {
            parseFootballData(jsonStr)
        } else {
            null
        }
    }




    suspend fun fetchFootballData(forceRefresh: Boolean = false): Result<FootballData> = withContext(Dispatchers.IO) {
        try {
            val apiKey = BuildConfig.FOOTBALL_API_KEY
            if (apiKey.isBlank()) {
                return@withContext Result.failure(Exception("Football API key is missing"))
            }

            // Check if widget is enabled
            val isEnabled = footballWidgetEnabled.firstOrNull() ?: true
            if (!isEnabled && !forceRefresh) {
                return@withContext Result.success(FootballData(emptyList()))
            }

            // Check cache
            val prefs = context.footballDataStore.data.firstOrNull() // first() might block? No, it's suspend.
            // basic check
            if (!forceRefresh) {
                // We need to collect once
                // ... logic to read timestamp from prefs
                // Simplified: assuming caller checks flow, but we can check here too.
            }

            // 1. Try to fetch LIVE matches first
            // GET /fixtures?live=all&leagues=... -> simpler to just get today's matches and filter statuses?
            // "live=all" covers all currently playing.
            // But we want "Today's" timeline (Past/Live/Future).
            // So GET /fixtures?date=YYYY-MM-DD&ids=... (ids of leagues)
            
            val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
            // League filtering in API is usually by query param. 
            // We have to loop leagues or find a way to specific multiple. API supports `ids`? No.
            // API supports `league=39`. Does not support multiple leagues in one call usually?
            // v3 docs: "leagues" parameter? No.
            // We might have to make 5 calls? That burns quota instantly.
            // Better: GET /fixtures?date=today -> returns ALL matches. We filter locally.
            // This is heavy (hundreds of matches).
            // But allows 1 call.
            
            val urlStr = "$BASE_URL/fixtures?date=$today"
            val url = URL(urlStr)
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.setRequestProperty("x-apisports-key", apiKey)
            connection.setRequestProperty("x-apisports-host", "v3.football.api-sports.io")
            
            val responseCode = connection.responseCode
            if (responseCode != 200) {
                 return@withContext Result.failure(Exception("API Error: $responseCode"))
            }
            
            val response = connection.inputStream.bufferedReader().use { it.readText() }
            val json = JSONObject(response)
            
            // Filter and Parse
            val data = parseAndFilter(json)
            
            // Cache
            context.footballDataStore.edit { p ->
                p[CACHED_DATA_PREF] = data.toJsonString() // We'll implement robust serialization later
                p[LAST_UPDATE_PREF] = System.currentTimeMillis()
            }
            
            Result.success(data)

        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun fetchLiveMatch(forceRefresh: Boolean = false): Result<LiveMatchData?> {
        val result = fetchFootballData(forceRefresh)
        return result.map { data ->
            // Prioritize:
            // 1. Live Match (Top leagues first)
            // 2. Scheduled Today (soonest)
            // 3. Recently Finished (today)
            
            val matches = data.matches
            if (matches.isEmpty()) return@map null
            
            // 1. Live
            val live = matches.firstOrNull { it.isLive }
            if (live != null) return@map live
            
            // 2. Upcoming (NS)
            val upcoming = matches.filter { it.statusShort == "NS" }.minByOrNull { it.timestamp }
            if (upcoming != null) return@map upcoming
            
            // 3. Finished (FT)
            val finished = matches.filter { it.statusShort == "FT" }.maxByOrNull { it.timestamp }
            return@map finished
        }
    }
    
    // Simplistic parsing (would be better with Gson/Moshi, but sticking to JSONObject for zero-dep)
    private fun parseAndFilter(root: JSONObject): FootballData {
        val responseArray = root.getJSONArray("response")
        val matches = mutableListOf<LiveMatchData>()
        
        val targetLeagues = listOf(39, 140, 135, 78, 61)
        
        for (i in 0 until responseArray.length()) {
            val item = responseArray.getJSONObject(i)
            val league = item.getJSONObject("league")
            val leagueId = league.getInt("id")
            
            if (leagueId in targetLeagues) {
                val fixture = item.getJSONObject("fixture")
                val status = fixture.getJSONObject("status")
                val teams = item.getJSONObject("teams")
                val goals = item.getJSONObject("goals")
                val venue = fixture.optJSONObject("venue")
                val score = item.optJSONObject("score")
                val halftime = score?.optJSONObject("halftime")
                
                matches.add(
                    LiveMatchData(
                        leagueName = league.getString("name"),
                        leagueLogo = league.getString("logo"),
                        homeTeam = teams.getJSONObject("home").getString("name"),
                        homeLogo = teams.getJSONObject("home").getString("logo"),
                        awayTeam = teams.getJSONObject("away").getString("name"),
                        awayLogo = teams.getJSONObject("away").getString("logo"),
                        homeScore = goals.optInt("home", 0),
                        awayScore = goals.optInt("away", 0),
                        statusShort = status.getString("short"),
                        statusLong = status.optString("long", ""),
                        elapsed = status.optInt("elapsed", 0),
                        timestamp = fixture.getLong("timestamp"),
                        venueName = venue?.optString("name"),
                        venueCity = venue?.optString("city"),
                        fixtureDate = fixture.optString("date"),
                        referee = fixture.optString("referee", null),
                        halftimeHome = halftime?.optInt("home"),
                        halftimeAway = halftime?.optInt("away")
                    )
                )
            }
        }
        
        // Sort: Live first, then Time
        matches.sortWith(compareBy({ !it.isLive }, { it.timestamp }))
        
        return FootballData(matches)
    }
    
    private fun parseFootballData(jsonStr: String): FootballData {
        return try {
            val root = JSONObject(jsonStr)
            val arr = root.optJSONArray("matches") ?: JSONArray()
            val matches = mutableListOf<LiveMatchData>()

            for (i in 0 until arr.length()) {
                val item = arr.optJSONObject(i) ?: continue
                matches.add(
                    LiveMatchData(
                        leagueName = item.optString("leagueName").takeIf { it.isNotBlank() },
                        leagueLogo = item.optString("leagueLogo").takeIf { it.isNotBlank() },
                        homeTeam = item.optString("homeTeam"),
                        homeLogo = item.optString("homeLogo"),
                        awayTeam = item.optString("awayTeam"),
                        awayLogo = item.optString("awayLogo"),
                        homeScore = item.optInt("homeScore", 0),
                        awayScore = item.optInt("awayScore", 0),
                        statusShort = item.optString("statusShort").takeIf { it.isNotBlank() },
                        statusLong = item.optString("statusLong").takeIf { it.isNotBlank() },
                        elapsed = item.optInt("elapsed", 0),
                        timestamp = item.optLong("timestamp", 0L),
                        venueName = item.optString("venueName").takeIf { it.isNotBlank() },
                        venueCity = item.optString("venueCity").takeIf { it.isNotBlank() },
                        fixtureDate = item.optString("fixtureDate").takeIf { it.isNotBlank() },
                        referee = item.optString("referee").takeIf { it.isNotBlank() },
                        halftimeHome = item.optInt("halftimeHome").takeIf { item.has("halftimeHome") },
                        halftimeAway = item.optInt("halftimeAway").takeIf { item.has("halftimeAway") }
                    )
                )
            }
            FootballData(matches)
        } catch (_: Exception) {
            FootballData(emptyList())
        }
    }
    
    fun hasApiKey(): Boolean = BuildConfig.FOOTBALL_API_KEY.isNotBlank()

    private fun FootballData.toJsonString(): String {
        val matchesArray = JSONArray()
        matches.forEach { match ->
            val obj = JSONObject().apply {
                put("leagueName", match.leagueName)
                put("leagueLogo", match.leagueLogo)
                put("homeTeam", match.homeTeam)
                put("homeLogo", match.homeLogo)
                put("awayTeam", match.awayTeam)
                put("awayLogo", match.awayLogo)
                put("homeScore", match.homeScore)
                put("awayScore", match.awayScore)
                put("statusShort", match.statusShort)
                put("statusLong", match.statusLong)
                put("elapsed", match.elapsed)
                put("timestamp", match.timestamp)
                put("venueName", match.venueName)
                put("venueCity", match.venueCity)
                put("fixtureDate", match.fixtureDate)
                put("referee", match.referee)
                if (match.halftimeHome != null) put("halftimeHome", match.halftimeHome)
                if (match.halftimeAway != null) put("halftimeAway", match.halftimeAway)
            }
            matchesArray.put(obj)
        }
        return JSONObject().put("matches", matchesArray).toString()
    }
}

data class FootballData(
    val matches: List<LiveMatchData>
)

data class LiveMatchData(
    val leagueName: String?,
    val leagueLogo: String?,
    val homeTeam: String,
    val homeLogo: String,
    val awayTeam: String,
    val awayLogo: String,
    val homeScore: Int,
    val awayScore: Int,
    val statusShort: String?, // 1H, 2H, HT, FT, NS
    val statusLong: String? = null,
    val elapsed: Int,
    val timestamp: Long,
    val venueName: String? = null,
    val venueCity: String? = null,
    val fixtureDate: String? = null,
    val referee: String? = null,
    val halftimeHome: Int? = null,
    val halftimeAway: Int? = null
) {
    val isLive: Boolean
        get() = statusShort in listOf("1H", "2H", "ET", "P", "LIVE", "HT", "BT")
        
    val minute: Int?
        get() = if (elapsed > 0) elapsed else null
        
    val displayTime: String
        get() {
            val date = Date(timestamp * 1000)
            val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
            return sdf.format(date)
        }
}
