package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.data.network.ApiKeys
import com.moalfarras.moplayer.data.network.FootballService
import com.moalfarras.moplayer.data.network.FreeWeatherService
import com.moalfarras.moplayer.data.network.WeatherService
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.FootballMatch
import com.moalfarras.moplayer.domain.model.ManualWeatherEffect
import com.moalfarras.moplayer.domain.model.WeatherMode
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.ZoneId

class WidgetRepository(
    private val weatherService: WeatherService,
    private val freeWeatherService: FreeWeatherService,
    private val footballService: FootballService,
) {
    suspend fun weather(settings: AppSettings = AppSettings()): WeatherSnapshot = withContext(Dispatchers.IO) {
        runCatching {
            when (settings.weatherMode) {
                WeatherMode.AUTO_IP -> ipWeather()
                WeatherMode.CITY -> cityWeather(settings.weatherCityOverride)
                WeatherMode.MANUAL -> manualWeather(settings.manualWeatherEffect)
            }
        }.getOrElse {
            val fallbackCity = settings.weatherCityOverride.trim().ifBlank { "غرفة الجلوس" }
            WeatherSnapshot(
                city = fallbackCity,
                condition = settings.manualWeatherEffect.toCondition(),
                temperatureC = settings.manualWeatherEffect.toTemperature(),
                timeZoneId = ZoneId.systemDefault().id,
                isManual = true,
            )
        }
    }

    private suspend fun cityWeather(cityOverride: String): WeatherSnapshot {
        val requestedCity = cityOverride.trim()
        if (requestedCity.isBlank()) return ipWeather()
        if (ApiKeys.weather.isBlank()) {
            return WeatherSnapshot(city = requestedCity, condition = "Clear", temperatureC = 21.0)
        }
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
        val weather = freeWeatherService.getWeather(location.lat, location.lon)
        return WeatherSnapshot(
            city = location.city.ifBlank { "TV Room" },
            condition = openMeteoCondition(weather.current.weather_code),
            temperatureC = weather.current.temperature_2m,
            timeZoneId = location.timezone.ifBlank { ZoneId.systemDefault().id },
        )
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
            city = "معاينة الطقس",
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

    suspend fun football(settings: AppSettings = AppSettings()): List<FootballMatch> = withContext(Dispatchers.IO) {
        val maxMatches = settings.footballMaxMatches.coerceIn(1, 8)
        if (ApiKeys.apiFootball.isBlank()) {
            return@withContext fallbackFootball().take(maxMatches)
        }
        runCatching {
            footballService.fixtures().response.take(maxMatches).map {
                FootballMatch(
                    league = it.league.name,
                    home = it.teams.home.name,
                    away = it.teams.away.name,
                    score = "${it.goals.home ?: 0}-${it.goals.away ?: 0}",
                    minute = it.fixture.status.elapsed?.let { min -> "$min'" } ?: it.fixture.status.short,
                )
            }
        }.getOrElse { fallbackFootball().take(maxMatches) }.ifEmpty { fallbackFootball().take(maxMatches) }
    }

    private fun fallbackFootball(): List<FootballMatch> = listOf(
        FootballMatch("دوري أبطال أوروبا", "ريال مدريد", "مانشستر سيتي", "2-1", "74'"),
        FootballMatch("الدوري الإنجليزي", "أرسنال", "ليفربول", "1-0", "الشوط 2"),
        FootballMatch("الدوري الإسباني", "برشلونة", "أتلتيكو مدريد", "0-0", "مباشر"),
    )
}
