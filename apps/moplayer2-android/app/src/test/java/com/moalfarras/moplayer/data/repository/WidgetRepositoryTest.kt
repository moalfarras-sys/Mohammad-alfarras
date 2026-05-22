package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.data.network.FreeWeatherService
import com.moalfarras.moplayer.data.network.SportsDbEventsDto
import com.moalfarras.moplayer.data.network.SportsDbService
import com.moalfarras.moplayer.data.network.IpApiResponse
import com.moalfarras.moplayer.data.network.OpenMeteoCurrent
import com.moalfarras.moplayer.data.network.OpenMeteoResponse
import com.moalfarras.moplayer.data.network.WeatherConditionDto
import com.moalfarras.moplayer.data.network.WeatherCurrentDto
import com.moalfarras.moplayer.data.network.WeatherLocationDto
import com.moalfarras.moplayer.data.network.WeatherResponseDto
import com.moalfarras.moplayer.data.network.WeatherService
import com.moalfarras.moplayer.data.network.WebFootballResponseDto
import com.moalfarras.moplayer.data.network.WebFootballService
import com.moalfarras.moplayer.data.network.WebWeatherDto
import com.moalfarras.moplayer.data.network.WebWeatherService
import com.moalfarras.moplayer.data.network.OpenMeteoGeocodingResponse
import com.moalfarras.moplayer.data.network.OpenMeteoGeocodingResult
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.ManualWeatherEffect
import com.moalfarras.moplayer.domain.model.WeatherMode
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetRepositoryTest {
    @Test
    fun manualWeatherIsPreviewOnlyAndDoesNotCallNetwork() = runTest {
        val weatherService = FakeWeatherService()
        val freeWeatherService = FakeFreeWeatherService()
        val repo = fakeRepo(weatherService = weatherService, freeWeatherService = freeWeatherService)

        val snapshot = repo.weather(
            AppSettings(
                weatherMode = WeatherMode.MANUAL,
                manualWeatherEffect = ManualWeatherEffect.STORM,
            ),
        )

        assertEquals("Thunderstorm", snapshot.condition)
        assertTrue(snapshot.isManual)
        assertFalse(snapshot.hasRealWeather)
        assertEquals(0, weatherService.calls)
        assertEquals(0, freeWeatherService.locationCalls)
        assertEquals(0, freeWeatherService.weatherCalls)
    }

    @Test
    fun autoWeatherUsesIpLocationTimezoneAndOpenMeteoCondition() = runTest {
        val repo = fakeRepo()

        val snapshot = repo.weather(AppSettings(weatherMode = WeatherMode.AUTO_IP))

        assertEquals("Berlin", snapshot.city)
        assertEquals("Europe/Berlin", snapshot.timeZoneId)
        assertEquals("Rain", snapshot.condition)
        assertFalse(snapshot.isManual)
        assertTrue(snapshot.hasRealWeather)
    }

    @Test
    fun cityWeatherUsesCityWhenWeatherApiIsUnavailable() = runTest {
        val repo = fakeRepo()

        val snapshot = repo.weather(
            AppSettings(
                weatherMode = WeatherMode.CITY,
                weatherCityOverride = "Dubai",
            ),
        )

        assertEquals("Dubai", snapshot.city)
        assertFalse(snapshot.isManual)
        assertTrue(snapshot.hasRealWeather)
    }
}

private fun fakeRepo(
    weatherService: FakeWeatherService = FakeWeatherService(),
    freeWeatherService: FakeFreeWeatherService = FakeFreeWeatherService(),
    sportsDbService: FakeSportsDbService = FakeSportsDbService(),
    webWeatherService: FakeWebWeatherService = FakeWebWeatherService(),
    webFootballService: FakeWebFootballService = FakeWebFootballService(),
) = WidgetRepository(
    weatherService = weatherService,
    webWeatherService = webWeatherService,
    freeWeatherService = freeWeatherService,
    sportsDbService = sportsDbService,
    webFootballService = webFootballService,
)

private class FakeWeatherService : WeatherService {
    var calls = 0

    override suspend fun current(key: String, query: String, airQuality: String): WeatherResponseDto {
        calls++
        return WeatherResponseDto(
            location = WeatherLocationDto(name = query, tzId = "Asia/Dubai"),
            current = WeatherCurrentDto(
                tempC = 31.0,
                condition = WeatherConditionDto(text = "Sunny"),
            ),
        )
    }
}

private class FakeFreeWeatherService : FreeWeatherService {
    var locationCalls = 0
    var weatherCalls = 0

    override suspend fun getIpLocation(): IpApiResponse {
        locationCalls++
        return IpApiResponse(city = "Berlin", lat = 52.52, lon = 13.405, timezone = "Europe/Berlin")
    }

    override suspend fun getWeather(lat: Double, lon: Double, current: String): OpenMeteoResponse {
        weatherCalls++
        return OpenMeteoResponse(OpenMeteoCurrent(temperature_2m = 12.0, weather_code = 61))
    }

    override suspend fun geocodeCity(name: String, count: Int, language: String, format: String): OpenMeteoGeocodingResponse {
        return OpenMeteoGeocodingResponse(
            results = listOf(
                OpenMeteoGeocodingResult(
                    name = name,
                    latitude = 25.2048,
                    longitude = 55.2708,
                    country = "United Arab Emirates",
                    timezone = "Asia/Dubai",
                ),
            ),
        )
    }
}

private class FakeSportsDbService : SportsDbService {
    override suspend fun eventsDay(date: String, sport: String): SportsDbEventsDto = SportsDbEventsDto()
    override suspend fun nextLeague(leagueId: String): SportsDbEventsDto = SportsDbEventsDto()
}

private class FakeWebWeatherService : WebWeatherService {
    override suspend fun weather(url: String): WebWeatherDto = WebWeatherDto(error = "not_configured")
}

private class FakeWebFootballService : WebFootballService {
    override suspend fun football(url: String): WebFootballResponseDto = WebFootballResponseDto()
}
