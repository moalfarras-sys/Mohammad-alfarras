package com.moalfarras.moplayer.data.network

import com.moalfarras.moplayerpro.BuildConfig
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.security.SecureRandom
import java.security.cert.X509Certificate
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext
import javax.net.ssl.X509TrustManager

object NetworkModule {
    val json: Json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        explicitNulls = false
    }

    val okHttp: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(12, TimeUnit.SECONDS)
            .readTimeout(5, TimeUnit.MINUTES)
            .writeTimeout(5, TimeUnit.MINUTES)
            .callTimeout(10, TimeUnit.MINUTES)
            .retryOnConnectionFailure(true)
            .build()
    }

    private val playlistOkHttp: OkHttpClient by lazy {
        okHttp.newBuilder()
            .readTimeout(5, TimeUnit.MINUTES)
            .callTimeout(10, TimeUnit.MINUTES)
            .build()
    }

    val imageOkHttp: OkHttpClient by lazy {
        // Scoped to public poster/logo images. Some Android TV 7.x devices ship stale CA stores
        // and fail modern CDN/Vercel chains even when normal playback and APIs work.
        val trustManager = object : X509TrustManager {
            override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) = Unit
            override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) = Unit
            override fun getAcceptedIssuers(): Array<X509Certificate> = emptyArray()
        }
        val sslContext = SSLContext.getInstance("TLS").apply {
            init(null, arrayOf(trustManager), SecureRandom())
        }
        okHttp.newBuilder()
            .sslSocketFactory(sslContext.socketFactory, trustManager)
            .hostnameVerifier { _, _ -> true }
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(45, TimeUnit.SECONDS)
            .callTimeout(60, TimeUnit.SECONDS)
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
    val webApiService: SupabaseService by lazy {
        retrofit(WebApiEndpoint.primaryBaseUrl.ifBlank { "https://moalfarras.space" }).create(SupabaseService::class.java)
    }

    val sportsDbService: SportsDbService by lazy {
        retrofit("https://www.thesportsdb.com/api/v1/json/3/").create(SportsDbService::class.java)
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
