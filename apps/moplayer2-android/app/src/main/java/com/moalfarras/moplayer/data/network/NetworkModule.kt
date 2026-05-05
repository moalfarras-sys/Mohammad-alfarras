package com.moalfarras.moplayer.data.network

import com.moalfarras.moplayer.BuildConfig
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
            .callTimeout(0, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    private fun retrofit(baseUrl: String): Retrofit =
        Retrofit.Builder()
            .baseUrl(baseUrl.ensureTrailingSlash())
            .client(okHttp)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

    val playlistService: PlaylistService by lazy { retrofit("https://example.com/").create(PlaylistService::class.java) }
    val weatherService: WeatherService by lazy { retrofit("https://api.weatherapi.com/").create(WeatherService::class.java) }
    val footballService: FootballService by lazy {
        val client = okHttp.newBuilder()
            .addInterceptor { chain ->
                chain.proceed(
                    chain.request().newBuilder()
                        .header("x-rapidapi-host", "v3.football.api-sports.io")
                        .header("x-rapidapi-key", ApiKeys.apiFootball)
                        .build(),
                )
            }
            .build()
        Retrofit.Builder()
            .baseUrl("https://v3.football.api-sports.io/")
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(FootballService::class.java)
    }

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
    val apiFootball: String = BuildConfig.FOOTBALL_API_KEY
}
