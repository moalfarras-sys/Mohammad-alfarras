package com.mo.moplayer.data.football

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
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
            
            val response = fetchFootballProxyJson()
            val json = JSONObject(response)
            
            if (json.has("error")) {
                return@withContext Result.success(FootballData(emptyList()))
            }

            val data = parseProxyFootballData(json)
            
            // Cache
            context.footballDataStore.edit { p ->
                p[CACHED_DATA_PREF] = data.toJsonString() // We'll implement robust serialization later
                p[LAST_UPDATE_PREF] = System.currentTimeMillis()
            }
            
            Result.success(data)

        } catch (e: Exception) {
            val cached = footballData.firstOrNull()
            Result.success(cached ?: FootballData(emptyList()))
        }
    }

    private fun fetchFootballProxyJson(): String {
        var lastError: Throwable? = null
        com.mo.moplayer.util.WebApiEndpoint.candidateUrls("/api/football").forEach { urlString ->
            try {
                val connection = (URL(urlString).openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 10_000
                    readTimeout = 12_000
                    setRequestProperty("Accept", "application/json")
                }
                return try {
                    val stream = if (connection.responseCode in 200..299) {
                        connection.inputStream
                    } else {
                        connection.errorStream ?: connection.inputStream
                    }
                    stream.bufferedReader().use { it.readText() }
                } finally {
                    connection.disconnect()
                }
            } catch (e: Throwable) {
                lastError = e
            }
        }
        throw lastError ?: IllegalStateException("Football proxy unavailable")
    }
    
    suspend fun fetchLiveMatch(forceRefresh: Boolean = false): Result<LiveMatchData?> {
        val result = fetchFootballData(forceRefresh)
        return result.map { data ->
            // Prioritize useful TV information:
            // 1. Live top competition
            // 2. Recently finished top match/result
            // 3. Next upcoming top match
            
            val matches = data.matches
            if (matches.isEmpty()) return@map null
            
            val ranked = matches.sortedWith(
                compareByDescending<LiveMatchData> { it.competitionPriority }
                    .thenByDescending { if (it.isLive) 1 else 0 }
                    .thenBy { it.timestamp }
            )

            val live = ranked.firstOrNull { it.isLive }
            if (live != null) return@map live

            val nowSeconds = System.currentTimeMillis() / 1000L
            val twoDaysAgo = nowSeconds - (2L * 24L * 60L * 60L)
            val finished = ranked
                .filter { it.isFinished && it.timestamp >= twoDaysAgo }
                .maxWithOrNull(compareBy<LiveMatchData> { it.competitionPriority }.thenBy { it.timestamp })
            if (finished != null) return@map finished

            val upcoming = ranked.filter { it.isUpcoming }.minByOrNull { it.timestamp }
            if (upcoming != null) return@map upcoming

            val anyRecent = ranked.maxByOrNull { it.timestamp }
            if (anyRecent != null) return@map anyRecent

            null
        }
    }
    
    private fun parseProxyFootballData(root: JSONObject): FootballData {
        val responseArray = root.optJSONArray("matches") ?: JSONArray()
        val matches = parseProxyMatchArray(responseArray)
        val previousDay = parseProxyMatchArray(root.optJSONArray("previousDay") ?: JSONArray())
        val today = parseProxyMatchArray(root.optJSONArray("today") ?: JSONArray())
        val nextDay = parseProxyMatchArray(root.optJSONArray("nextDay") ?: JSONArray())
        val important = parseProxyMatchArray(root.optJSONArray("importantMatches") ?: JSONArray())

        return FootballData(
            matches = matches.sortedWith(compareBy({ !it.isLive }, { it.timestamp })),
            previousDay = previousDay,
            today = today,
            nextDay = nextDay,
            importantMatches = important
        )
    }

    private fun parseProxyMatchArray(responseArray: JSONArray): List<LiveMatchData> {
        val matches = mutableListOf<LiveMatchData>()

        for (i in 0 until responseArray.length()) {
            val item = responseArray.optJSONObject(i) ?: continue
            matches.add(
                LiveMatchData(
                    leagueName = item.optString("league").takeIf { it.isNotBlank() },
                    leagueLogo = item.optString("leagueLogo").takeIf { it.isNotBlank() },
                    homeTeam = item.optString("homeTeam", "Home"),
                    homeLogo = item.optString("homeLogo", ""),
                    awayTeam = item.optString("awayTeam", "Away"),
                    awayLogo = item.optString("awayLogo", ""),
                    homeScore = item.optIntNullable("homeGoals") ?: 0,
                    awayScore = item.optIntNullable("awayGoals") ?: 0,
                    statusShort = item.optString("status").takeIf { it.isNotBlank() },
                    statusLong = item.optString("status").takeIf { it.isNotBlank() },
                    elapsed = item.optIntNullable("elapsed") ?: 0,
                    timestamp = parseIsoTimestampSeconds(item.optString("date")),
                    fixtureDate = item.optString("date").takeIf { it.isNotBlank() }
                )
            )
        }

        return matches
    }
    
    private fun parseFootballData(jsonStr: String): FootballData {
        return try {
            val root = JSONObject(jsonStr)
            FootballData(
                matches = parseCachedMatchArray(root.optJSONArray("matches") ?: JSONArray()),
                previousDay = parseCachedMatchArray(root.optJSONArray("previousDay") ?: JSONArray()),
                today = parseCachedMatchArray(root.optJSONArray("today") ?: JSONArray()),
                nextDay = parseCachedMatchArray(root.optJSONArray("nextDay") ?: JSONArray()),
                importantMatches = parseCachedMatchArray(root.optJSONArray("importantMatches") ?: JSONArray())
            )
        } catch (_: Exception) {
            FootballData(emptyList())
        }
    }

    private fun parseCachedMatchArray(arr: JSONArray): List<LiveMatchData> {
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
        return matches
    }
    
    fun hasApiKey(): Boolean = true

    private fun JSONObject.optIntNullable(name: String): Int? {
        if (!has(name) || isNull(name)) return null
        return optInt(name)
    }

    private fun parseIsoTimestampSeconds(value: String): Long {
        if (value.isBlank()) return 0L
        return try {
            val normalized = value.replace("Z", "+0000").replace(Regex("([+-]\\d{2}):(\\d{2})$"), "$1$2")
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", Locale.US).parse(normalized)?.time?.div(1000L) ?: 0L
        } catch (_: Exception) {
            0L
        }
    }

    private fun FootballData.toJsonString(): String {
        val matchesArray = JSONArray()
        val previousDayArray = JSONArray()
        val todayArray = JSONArray()
        val nextDayArray = JSONArray()
        val importantArray = JSONArray()
        fun appendMatch(target: JSONArray, match: LiveMatchData) {
            target.put(match.toJsonObject())
        }
        matches.forEach { match ->
            appendMatch(matchesArray, match)
        }
        previousDay.forEach { appendMatch(previousDayArray, it) }
        today.forEach { appendMatch(todayArray, it) }
        nextDay.forEach { appendMatch(nextDayArray, it) }
        importantMatches.forEach { appendMatch(importantArray, it) }
        return JSONObject()
            .put("matches", matchesArray)
            .put("previousDay", previousDayArray)
            .put("today", todayArray)
            .put("nextDay", nextDayArray)
            .put("importantMatches", importantArray)
            .toString()
    }

    private fun LiveMatchData.toJsonObject(): JSONObject {
        return JSONObject().apply {
            put("leagueName", leagueName)
            put("leagueLogo", leagueLogo)
            put("homeTeam", homeTeam)
            put("homeLogo", homeLogo)
            put("awayTeam", awayTeam)
            put("awayLogo", awayLogo)
            put("homeScore", homeScore)
            put("awayScore", awayScore)
            put("statusShort", statusShort)
            put("statusLong", statusLong)
            put("elapsed", elapsed)
            put("timestamp", timestamp)
            put("venueName", venueName)
            put("venueCity", venueCity)
            put("fixtureDate", fixtureDate)
            put("referee", referee)
            if (halftimeHome != null) put("halftimeHome", halftimeHome)
            if (halftimeAway != null) put("halftimeAway", halftimeAway)
        }
    }
}

data class FootballData(
    val matches: List<LiveMatchData>,
    val previousDay: List<LiveMatchData> = emptyList(),
    val today: List<LiveMatchData> = emptyList(),
    val nextDay: List<LiveMatchData> = emptyList(),
    val importantMatches: List<LiveMatchData> = emptyList()
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

    val isFinished: Boolean
        get() = statusShort in listOf("FT", "AET", "PEN")

    val isUpcoming: Boolean
        get() = statusShort in listOf("NS", "TBD")

    val competitionPriority: Int
        get() {
            val value = leagueName.orEmpty().lowercase(Locale.US)
            return when {
                value.contains("world cup") || value.contains("fifa") -> 100
                value.contains("champions league") -> 90
                value.contains("europa") -> 82
                value.contains("premier league") -> 78
                value.contains("la liga") -> 76
                value.contains("bundesliga") -> 74
                value.contains("serie a") -> 72
                value.contains("ligue 1") -> 70
                value.contains("euro") -> 68
                value.contains("saudi") -> 58
                else -> 10
            }
        }
        
    val minute: Int?
        get() = if (elapsed > 0) elapsed else null
        
    val displayTime: String
        get() {
            val date = Date(timestamp * 1000)
            val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
            return sdf.format(date)
        }
}
