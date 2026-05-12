package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.data.network.FootballResponseDto
import com.moalfarras.moplayer.data.network.FootballService
import com.moalfarras.moplayer.data.network.FreeWeatherService
import com.moalfarras.moplayer.data.network.IpApiResponse
import com.moalfarras.moplayer.data.network.OpenMeteoCurrent
import com.moalfarras.moplayer.data.network.OpenMeteoResponse
import com.moalfarras.moplayer.data.network.WeatherConditionDto
import com.moalfarras.moplayer.data.network.WeatherCurrentDto
import com.moalfarras.moplayer.data.network.WeatherLocationDto
import com.moalfarras.moplayer.data.network.WeatherResponseDto
import com.moalfarras.moplayer.data.network.WeatherService
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
    fun manualWeatherDoesNotCallNetwork() = runTest {
        val weatherService = FakeWeatherService()
        val freeWeatherService = FakeFreeWeatherService()
        val repo = WidgetRepository(weatherService, freeWeatherService, FakeFootballService())

        val snapshot = repo.weather(
            AppSettings(
                weatherMode = WeatherMode.MANUAL,
                manualWeatherEffect = ManualWeatherEffect.STORM,
            ),
        )

        assertEquals("Thunderstorm", snapshot.condition)
        assertTrue(snapshot.isManual)
        assertEquals(0, weatherService.calls)
        assertEquals(0, freeWeatherService.locationCalls)
        assertEquals(0, freeWeatherService.weatherCalls)
    }

    @Test
    fun autoWeatherUsesIpLocationTimezoneAndOpenMeteoCondition() = runTest {
        val repo = WidgetRepository(FakeWeatherService(), FakeFreeWeatherService(), FakeFootballService())

        val snapshot = repo.weather(AppSettings(weatherMode = WeatherMode.AUTO_IP))

        assertEquals("Berlin", snapshot.city)
        assertEquals("Europe/Berlin", snapshot.timeZoneId)
        assertEquals("Rain", snapshot.condition)
        assertFalse(snapshot.isManual)
    }

    @Test
    fun cityWeatherUsesCityWhenWeatherApiIsUnavailable() = runTest {
        val repo = WidgetRepository(FakeWeatherService(), FakeFreeWeatherService(), FakeFootballService())

        val snapshot = repo.weather(
            AppSettings(
                weatherMode = WeatherMode.CITY,
                weatherCityOverride = "Dubai",
            ),
        )

        assertEquals("Dubai", snapshot.city)
        assertFalse(snapshot.isManual)
    }
}

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
}

private class FakeFootballService : FootballService {
    override suspend fun fixtures(live: String): FootballResponseDto = FootballResponseDto()
}
