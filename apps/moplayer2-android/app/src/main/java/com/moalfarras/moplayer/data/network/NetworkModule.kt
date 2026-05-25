package com.moalfarras.moplayer.data.network

import com.moalfarras.moplayerpro.BuildConfig
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

object NetworkModule {
    val json: Json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        explicitNulls = false
    }

    val okHttp: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(12, TimeUnit.SECONDS)
            .readTimeout(90, TimeUnit.SECONDS)
            .writeTimeout(90, TimeUnit.SECONDS)
            .callTimeout(120, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    private val playlistOkHttp: OkHttpClient by lazy {
        okHttp.newBuilder()
            .readTimeout(5, TimeUnit.MINUTES)
            .callTimeout(10, TimeUnit.MINUTES)
            .build()
    }

    private fun retrofit(baseUrl: String, client: OkHttpClient = okHttp): Retrofit =
        Retrofit.Builder()
            .baseUrl(baseUrl.ensureTrailingSlash())
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

    val playlistService: PlaylistService by lazy { retrofit("https://example.com/", playlistOkHttp).create(PlaylistService::class.java) }
    val weatherService: WeatherService by lazy { retrofit("https://api.weatherapi.com/").create(WeatherService::class.java) }
    val webWeatherService: WebWeatherService by lazy { retrofit("https://example.com/").create(WebWeatherService::class.java) }
    val freeWeatherService: FreeWeatherService by lazy { retrofit("https://example.com/").create(FreeWeatherService::class.java) }

    val sportsDbService: SportsDbService by lazy {
        retrofit("https://www.thesportsdb.com/api/v1/json/123/").create(SportsDbService::class.java)
    }
    val webFootballService: WebFootballService by lazy { retrofit("https://example.com/").create(WebFootballService::class.java) }

    fun xtream(baseUrl: String): XtreamService = retrofit(baseUrl).create(XtreamService::class.java)

    val supabaseService: SupabaseService? by lazy {
        if (BuildConfig.SUPABASE_URL.isBlank() || BuildConfig.SUPABASE_ANON_KEY.isBlank()) {
            null
        } else {
            retrofit(BuildConfig.SUPABASE_URL).create(SupabaseService::class.java)
        }
    }

    private fun String.ensureTrailingSlash(): String = if (endsWith('/')) this else "$this/"
}

object ApiKeys {
    val weather: String = BuildConfig.WEATHER_API_KEY
}
