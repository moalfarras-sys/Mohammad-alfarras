package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.data.network.ApiKeys
import com.moalfarras.moplayer.data.network.FootballService
import com.moalfarras.moplayer.data.network.WeatherService
import com.moalfarras.moplayer.domain.model.FootballMatch
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class WidgetRepository(
    private val weatherService: WeatherService,
    private val footballService: FootballService,
) {
    suspend fun weather(query: String = "auto:ip"): WeatherSnapshot = withContext(Dispatchers.IO) {
        if (ApiKeys.weather.isBlank()) {
            return@withContext WeatherSnapshot(city = "غرفة الجلوس", condition = "صافي", temperatureC = 21.0)
        }
        runCatching {
            val dto = weatherService.current(ApiKeys.weather, query)
            WeatherSnapshot(
                city = dto.location.name.ifBlank { "غرفة الجلوس" },
                condition = dto.current.condition.text.ifBlank { "صافي" },
                temperatureC = dto.current.tempC,
                iconUrl = dto.current.condition.icon.let { if (it.startsWith("//")) "https:$it" else it },
            )
        }.getOrElse {
            WeatherSnapshot(city = "غرفة الجلوس", condition = "صافي", temperatureC = 21.0)
        }
    }

    suspend fun football(): List<FootballMatch> = withContext(Dispatchers.IO) {
        if (ApiKeys.apiFootball.isBlank()) {
            return@withContext fallbackFootball()
        }
        runCatching {
            footballService.fixtures().response.take(8).map {
                FootballMatch(
                    league = it.league.name,
                    home = it.teams.home.name,
                    away = it.teams.away.name,
                    score = "${it.goals.home ?: 0}-${it.goals.away ?: 0}",
                    minute = it.fixture.status.elapsed?.let { min -> "$min'" } ?: it.fixture.status.short,
                )
            }
        }.getOrElse { fallbackFootball() }
    }

    private fun fallbackFootball(): List<FootballMatch> = listOf(
        FootballMatch("دوري أبطال أوروبا", "ريال مدريد", "مان سيتي", "2-1", "74'"),
        FootballMatch("الدوري الإنجليزي", "أرسنال", "ليفربول", "1-0", "الشوط 2"),
        FootballMatch("الدوري الإسباني", "برشلونة", "أتلتيكو", "0-0", "مباشر"),
    )
}
