package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.data.network.ApiKeys
import com.moalfarras.moplayer.data.network.FreeWeatherService
import com.moalfarras.moplayer.data.network.SportsDbEventDto
import com.moalfarras.moplayer.data.network.SportsDbService
import com.moalfarras.moplayer.data.network.WeatherService
import com.moalfarras.moplayer.data.network.WebApiEndpoint
import com.moalfarras.moplayer.data.network.WebFootballMatchDto
import com.moalfarras.moplayer.data.network.WebFootballService
import com.moalfarras.moplayer.data.network.WebWeatherService
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.FootballMatch
import com.moalfarras.moplayer.domain.model.ManualWeatherEffect
import com.moalfarras.moplayer.domain.model.WeatherMode
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

class WidgetRepository(
    private val weatherService: WeatherService,
    private val webWeatherService: WebWeatherService,
    private val freeWeatherService: FreeWeatherService,
    private val sportsDbService: SportsDbService,
    private val webFootballService: WebFootballService,
) {
    suspend fun weather(settings: AppSettings = AppSettings()): WeatherSnapshot = withContext(Dispatchers.IO) {
        runCatching {
            when (settings.weatherMode) {
                WeatherMode.AUTO_IP -> ipWeather()
                WeatherMode.CITY -> cityWeather(settings.weatherCityOverride)
                WeatherMode.MANUAL -> manualWeather(settings.manualWeatherEffect)
            }
        }.getOrDefault(WeatherSnapshot())
    }

    private suspend fun cityWeather(cityOverride: String): WeatherSnapshot {
        val requestedCity = cityOverride.trim()
        if (requestedCity.isBlank()) return ipWeather()
        fetchManagedWeather(requestedCity)?.let { return it }
        fetchOpenMeteoCityWeather(requestedCity)?.let { return it }
        require(ApiKeys.weather.isNotBlank()) { "No real weather provider is available for $requestedCity" }
        val weather = weatherService.current(ApiKeys.weather, requestedCity)
        return WeatherSnapshot(
            city = weather.location.name.ifBlank { requestedCity },
            condition = weather.current.condition.text.ifBlank { "Clear" },
            temperatureC = weather.current.tempC,
            iconUrl = weather.current.condition.icon,
            timeZoneId = weather.location.tzId.ifBlank { ZoneId.systemDefault().id },
        )
    }

    private suspend fun ipWeather(): WeatherSnapshot {
        val location = freeWeatherService.getIpLocation()
        val resolvedCity = location.city.ifBlank { "Current location" }
        fetchManagedWeather(resolvedCity)?.let { return it }
        val weather = freeWeatherService.getWeather(location.lat, location.lon)
        val temperature = weather.current.temperature_2m ?: error("Open-Meteo returned no current temperature")
        return WeatherSnapshot(
            city = resolvedCity,
            condition = openMeteoCondition(weather.current.weather_code),
            temperatureC = temperature,
            timeZoneId = location.timezone.ifBlank { ZoneId.systemDefault().id },
        )
    }

    private suspend fun fetchOpenMeteoCityWeather(city: String): WeatherSnapshot? {
        return runCatching {
            val location = freeWeatherService.geocodeCity(city).results.firstOrNull() ?: return@runCatching null
            val weather = freeWeatherService.getWeather(location.latitude, location.longitude)
            val temperature = weather.current.temperature_2m ?: return@runCatching null
            WeatherSnapshot(
                city = location.name.ifBlank { city },
                condition = openMeteoCondition(weather.current.weather_code),
                temperatureC = temperature,
                timeZoneId = location.timezone.ifBlank { ZoneId.systemDefault().id },
            )
        }.getOrNull()
    }

    private suspend fun fetchManagedWeather(city: String): WeatherSnapshot? {
        val safeCity = city.trim().ifBlank { "Berlin" }
        val query = URLEncoder.encode(safeCity, StandardCharsets.UTF_8.name())
        return WebApiEndpoint.candidateUrls("/api/weather?city=$query").firstNotNullOfOrNull { url ->
            runCatching {
                val weather = webWeatherService.weather(url)
                val temp = weather.tempC ?: return@runCatching null
                val condition = weather.condition.trim()
                if (weather.error.isNotBlank() || condition.isBlank()) return@runCatching null
                WeatherSnapshot(
                    city = weather.city.ifBlank { safeCity },
                    condition = condition,
                    temperatureC = temp,
                    iconUrl = weather.icon,
                    timeZoneId = ZoneId.systemDefault().id,
                )
            }.getOrNull()
        }
    }

    private fun manualWeather(effect: ManualWeatherEffect): WeatherSnapshot {
        val (condition, temperature) = when (effect) {
            ManualWeatherEffect.SUNNY -> "Sunny" to 28.0
            ManualWeatherEffect.CLOUDY -> "Cloudy" to 20.0
            ManualWeatherEffect.RAIN -> "Rain" to 16.0
            ManualWeatherEffect.STORM -> "Thunderstorm" to 14.0
            ManualWeatherEffect.SNOW -> "Snow" to -2.0
            ManualWeatherEffect.FOG -> "Fog" to 9.0
        }
        return WeatherSnapshot(
            city = "Weather Preview",
            condition = condition,
            temperatureC = temperature,
            timeZoneId = ZoneId.systemDefault().id,
            isManual = true,
        )
    }

    private fun openMeteoCondition(code: Int): String = when (code) {
        0 -> "Clear"
        1, 2, 3 -> "Partly cloudy"
        45, 48 -> "Fog"
        51, 53, 55, 56, 57 -> "Drizzle"
        61, 63, 65, 66, 67, 80, 81, 82 -> "Rain"
        71, 73, 75, 77, 85, 86 -> "Snow"
        95, 96, 99 -> "Thunderstorm"
        else -> "Clear"
    }

    private fun ManualWeatherEffect.toCondition(): String = when (this) {
        ManualWeatherEffect.SUNNY -> "Sunny"
        ManualWeatherEffect.CLOUDY -> "Cloudy"
        ManualWeatherEffect.RAIN -> "Rain"
        ManualWeatherEffect.STORM -> "Thunderstorm"
        ManualWeatherEffect.SNOW -> "Snow"
        ManualWeatherEffect.FOG -> "Fog"
    }

    private fun ManualWeatherEffect.toTemperature(): Double = when (this) {
        ManualWeatherEffect.SUNNY -> 28.0
        ManualWeatherEffect.CLOUDY -> 20.0
        ManualWeatherEffect.RAIN -> 16.0
        ManualWeatherEffect.STORM -> 14.0
        ManualWeatherEffect.SNOW -> -2.0
        ManualWeatherEffect.FOG -> 9.0
    }

    /**
     * Real football events via TheSportsDB free public API (no user key required).
     * Strategy: today's live/scheduled matches first; if none, upcoming fixtures of top
     * leagues; only fall back to placeholders if the network is fully unavailable.
     */
    suspend fun football(settings: AppSettings = AppSettings()): List<FootballMatch> = withContext(Dispatchers.IO) {
        val maxMatches = settings.footballMaxMatches.coerceIn(1, 8)
        val managedMatches = fetchManagedFootball(maxMatches)
        if (managedMatches.isNotEmpty()) return@withContext managedMatches
        runCatching {
            val today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd", Locale.US))
            val dayMatches = sportsDbService.eventsDay(today).events.orEmpty()
                .mapNotNull { it.toFootballMatch() }
                .forWidget(maxMatches)
            if (dayMatches.isNotEmpty()) return@runCatching dayMatches

            // Nothing today → show the nearest upcoming fixtures from popular leagues.
            val upcoming = ArrayList<SportsDbEventDto>()
            for (leagueId in preferredLeagueIds) {
                runCatching { sportsDbService.nextLeague(leagueId).events.orEmpty() }
                    .getOrDefault(emptyList())
                    .let(upcoming::addAll)
                if (upcoming.size >= maxMatches * 2) break
            }
            upcoming
                .mapNotNull { it.toFootballMatch() }
                .forWidget(maxMatches)
        }.getOrElse { emptyList() }
    }

    private suspend fun fetchManagedFootball(maxMatches: Int): List<FootballMatch> {
        return WebApiEndpoint.candidateUrls("/api/football").firstNotNullOfOrNull { url ->
            runCatching {
                val response = webFootballService.football(url)
                val candidates = (response.importantMatches.ifEmpty { response.matches })
                    .mapNotNull { it.toFootballMatch(response.newsMessage) }
                    .filter { isPreferredLeague(it.league) }
                    .forWidget(maxMatches)
                candidates.takeIf { it.isNotEmpty() }
            }.getOrNull()
        }.orEmpty()
    }

    /**
     * The widget contract: LIVE matches first, then UPCOMING ordered by soonest kickoff, then the
     * freshest recent results — and finished games older than ~5h (kickoff + play time + grace)
     * are dropped entirely so the ticker never dwells on stale scores. Falls back to the unfiltered
     * list when everything is stale, so the widget never goes blank between matchdays.
     */
    private fun List<FootballMatch>.forWidget(maxMatches: Int, nowMs: Long = System.currentTimeMillis()): List<FootballMatch> {
        val fresh = filterNot { it.isFinished && it.kickoffEpochMs > 0 && nowMs - it.kickoffEpochMs > STALE_FINISHED_MS }
        val pool = fresh.ifEmpty { this }
        return pool
            .sortedWith(
                compareBy<FootballMatch> {
                    when {
                        it.isLive -> 0
                        !it.isFinished -> 1
                        else -> 2
                    }
                }.thenBy {
                    // Live: most recently started first; upcoming: soonest kickoff first;
                    // finished: most recent first. Unknown kickoffs sort last within their group.
                    when {
                        it.kickoffEpochMs <= 0 -> Long.MAX_VALUE
                        it.isFinished || it.isLive -> nowMs - it.kickoffEpochMs
                        else -> it.kickoffEpochMs - nowMs
                    }
                },
            )
            .take(maxMatches)
    }

    private fun WebFootballMatchDto.toFootballMatch(newsMessage: String = ""): FootballMatch? {
        val homeName = homeTeam.trim()
        val awayName = awayTeam.trim()
        if (homeName.isBlank() || awayName.isBlank()) return null
        val score = if (homeGoals != null && awayGoals != null) "$homeGoals-$awayGoals" else ""
        val statusLabel = when {
            elapsed != null && elapsed > 0 -> "$elapsed'"
            status.equals("FT", ignoreCase = true) -> "FT"
            status.equals("LIVE", ignoreCase = true) || status.equals("1H", ignoreCase = true) || status.equals("2H", ignoreCase = true) -> "LIVE"
            else -> kickoffTime(date)
        }
        return FootballMatch(
            league = league.trim().ifBlank { "Football" },
            home = homeName,
            away = awayName,
            score = score,
            minute = statusLabel,
            isLive = isLiveStatus(status, elapsed?.toString().orEmpty()),
            homeBadge = homeLogo.trim(),
            awayBadge = awayLogo.trim(),
            newsMessage = newsMessage.trim(),
            kickoffEpochMs = kickoffEpochMs(date),
            isFinished = status.equals("FT", ignoreCase = true) ||
                status.equals("AET", ignoreCase = true) ||
                status.equals("PEN", ignoreCase = true),
        )
    }

    private fun SportsDbEventDto.toFootballMatch(): FootballMatch? {
        val homeName = strHomeTeam.trim()
        val awayName = strAwayTeam.trim()
        if (homeName.isBlank() || awayName.isBlank()) return null
        val homeScore = intHomeScore?.trim().orEmpty()
        val awayScore = intAwayScore?.trim().orEmpty()
        val hasScore = homeScore.isNotBlank() && awayScore.isNotBlank()
        val live = isLiveStatus(strStatus, strProgress)
        val statusNorm = strStatus.trim().lowercase(Locale.US)
        return FootballMatch(
            league = strLeague.trim().ifBlank { "Football" },
            home = homeName,
            away = awayName,
            score = if (hasScore) "$homeScore-$awayScore" else "",
            minute = footballStatusLabel(strStatus, strProgress, strTimestamp),
            isLive = live,
            homeBadge = strHomeTeamBadge.trim(),
            awayBadge = strAwayTeamBadge.trim(),
            kickoffEpochMs = kickoffEpochMs(strTimestamp),
            isFinished = statusNorm.contains("finished") || statusNorm == "ft" || statusNorm == "aet" || statusNorm == "pen",
        )
    }

    private companion object {
        // English Premier League, La Liga, Serie A, Bundesliga, Ligue 1, UEFA Champions League
        val preferredLeagueIds = listOf("4328", "4335", "4332", "4331", "4334", "4480")
        val preferredKeywords = listOf(
            "premier", "la liga", "laliga", "serie a", "bundesliga", "ligue 1",
            "champions", "europa", "saudi", "world cup", "أبطال", "السعودي", "الممتاز",
        )
    }

    private fun isPreferredLeague(league: String): Boolean {
        val l = league.lowercase(Locale.US)
        return preferredKeywords.any { l.contains(it) }
    }

    private fun kickoffSortKey(label: String): String = when {
        label.endsWith("'") -> "0$label"
        label.equals("LIVE", ignoreCase = true) -> "0"
        label == "FT" -> "2"
        else -> "1$label"
    }

    private fun isLiveStatus(status: String, progress: String): Boolean {
        val s = status.trim().lowercase(Locale.US)
        val p = progress.trim()
        if (s.contains("finished") || s == "ft" || s == "aet" || s == "pen" || s == "ns" ||
            s.contains("not started") || s.contains("postp") || s.contains("cancel") || s.isBlank()
        ) {
            return false
        }
        // Active periods or a running clock indicate a live match.
        return p.isNotBlank() && p != "0" || s == "1h" || s == "2h" || s == "ht" ||
            s.contains("half") || s.contains("live") || s.contains("et")
    }

    private fun footballStatusLabel(status: String, progress: String, timestamp: String?): String {
        val s = status.trim().lowercase(Locale.US)
        val p = progress.trim()
        return when {
            p.isNotBlank() && p != "0" -> if (p.endsWith("'")) p else "$p'"
            s.contains("finished") || s == "ft" || s == "aet" || s == "pen" -> "FT"
            s == "ht" || s.contains("half time") || s.contains("halftime") -> "HT"
            s == "1h" || s.contains("first half") -> "1H"
            s == "2h" || s.contains("second half") -> "2H"
            s.contains("postp") -> "Postponed"
            s.contains("cancel") -> "Cancelled"
            s.contains("not started") || s == "ns" || s.isBlank() -> kickoffTime(timestamp)
            else -> status.trim()
        }
    }

    private fun kickoffTime(timestamp: String?): String {
        val ts = timestamp?.trim().orEmpty()
        if (ts.isBlank()) return "Time TBD"
        return runCatching {
            val time = if (ts.contains('+') || ts.endsWith("Z", ignoreCase = true)) {
                OffsetDateTime.parse(ts).atZoneSameInstant(ZoneId.systemDefault()).toLocalTime()
            } else {
                LocalDateTime.parse(ts.take(19)).toLocalTime()
            }
            time.format(DateTimeFormatter.ofPattern("HH:mm", Locale.US))
        }.getOrDefault("Time TBD")
    }

    /** Kickoff instant in epoch millis (0 when unknown/unparseable) — mirrors kickoffTime parsing. */
    private fun kickoffEpochMs(timestamp: String?): Long {
        val ts = timestamp?.trim().orEmpty()
        if (ts.isBlank()) return 0L
        return runCatching {
            if (ts.contains('+') || ts.endsWith("Z", ignoreCase = true)) {
                OffsetDateTime.parse(ts).toInstant().toEpochMilli()
            } else {
                LocalDateTime.parse(ts.take(19)).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
            }
        }.getOrDefault(0L)
    }
}

// Kickoff + full match + generous grace: a finished game older than this is history, not ticker
// material — the widget prefers what's live or coming next.
private const val STALE_FINISHED_MS = 5 * 60 * 60 * 1000L
