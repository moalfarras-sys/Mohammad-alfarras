package com.moalfarras.moplayer.data.network

import android.os.Build
import com.moalfarras.moplayerpro.BuildConfig
import kotlinx.serialization.json.Json
import okhttp3.Dispatcher
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext

object NetworkModule {
    val json: Json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        explicitNulls = false
    }

    // A stable, player-style identity for provider ingestion (Xtream player_api, M3U, xmltv).
    // Many IPTV panels reject the default "okhttp/x.y" agent as a bot; sending an explicit UA
    // that matches the playback identity keeps sync and playback consistent, so a panel that
    // allows one allows the other. Only applied when the request has no User-Agent already,
    // so per-stream/player-set agents are never overridden.
    private const val INGEST_USER_AGENT =
        "MoPlayerPro/${BuildConfig.VERSION_NAME} AndroidTV Media3/1.11 LibVLC/3.7"

    private val userAgentInterceptor = Interceptor { chain ->
        val request = chain.request()
        if (request.header("User-Agent") != null) {
            chain.proceed(request)
        } else {
            chain.proceed(request.newBuilder().header("User-Agent", INGEST_USER_AGENT).build())
        }
    }

    // Separate request budgets so poster/logo loading and library/EPG sync can never queue in
    // front of stream opens, which stay on the base client's default dispatcher. The connection
    // pool is still shared, so keep-alive reuse is unaffected.
    private val syncDispatcher: Dispatcher by lazy {
        Dispatcher().apply {
            maxRequests = 16
            maxRequestsPerHost = 6
        }
    }

    private val imageDispatcher: Dispatcher by lazy {
        Dispatcher().apply {
            maxRequests = 24
            maxRequestsPerHost = 6
        }
    }

    val okHttp: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(userAgentInterceptor)
            .connectTimeout(12, TimeUnit.SECONDS)
            // readTimeout is the max gap between bytes, not the total transfer time, so a
            // healthy multi-MB Xtream sync or video segment keeps flowing without tripping
            // it. Capping it at 45s means a server that connects then stalls fails fast and
            // hands control back to the retry/fallback logic instead of freezing for minutes.
            .readTimeout(45, TimeUnit.SECONDS)
            .writeTimeout(45, TimeUnit.SECONDS)
            // Backstop for the whole call (large library syncs can legitimately run long).
            .callTimeout(8, TimeUnit.MINUTES)
            .retryOnConnectionFailure(true)
            .apply {
                // Android 6 has no Network Security Config and no ISRG root in its store: add the
                // bundled Let's Encrypt roots to the platform ones (never trust-all).
                if (Build.VERSION.SDK_INT < 24) trustBundledRoots()
            }
            .build()
    }

    val playbackOkHttp: OkHttpClient by lazy {
        okHttp.newBuilder()
            // Real IPTV panels and CDN edges sometimes take a little longer to accept the
            // socket on weak Wi-Fi. Keep playback finite, but do not fail an otherwise
            // playable stream at the same 12s API threshold shown in user error reports.
            .connectTimeout(14, TimeUnit.SECONDS)
            // Media streams are open-ended (a live MPEG-TS body never ends). callTimeout covers
            // reading the whole body, so any finite value cuts live TS mid-stream and forces a
            // buffer drain and rebuffer. Rely on connect and read timeouts, like Media3's own
            // DefaultHttpDataSource.
            .callTimeout(0, TimeUnit.MILLISECONDS)
            // A dead socket should fail well before 45s. readTimeout also covers the wait for the
            // first byte, so leave headroom for Xtream on-demand channels to start.
            .readTimeout(20, TimeUnit.SECONDS)
            .apply {
                // Android 6-7.1 TV boxes ship stale CA stores: add the bundled Let's Encrypt roots
                // (most IPTV panels use them) to the platform ones. Never trust everything.
                if (Build.VERSION.SDK_INT < 26) trustBundledRoots()
            }
            .build()
    }

    private val xtreamOkHttp: OkHttpClient by lazy {
        okHttp.newBuilder()
            .dispatcher(syncDispatcher)
            // Huge Xtream panels often answer get_series_info slower than bulk library calls.
            // This keeps the UI from failing at exactly 12s while read/call caps still prevent
            // a dead panel from blocking the app for minutes.
            .connectTimeout(22, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build()
    }

    private val playlistOkHttp: OkHttpClient by lazy {
        okHttp.newBuilder()
            .dispatcher(syncDispatcher)
            // M3U playlists and XMLTV guides stream as one large body; allow a slightly longer
            // stall window than the API client while still bailing out well before 5 minutes.
            .readTimeout(90, TimeUnit.SECONDS)
            .callTimeout(8, TimeUnit.MINUTES)
            .build()
    }

    /** Poster/logo client for Coil: its own dispatcher; platform trust (plus bundled roots on API < 24). */
    val imageOkHttp: OkHttpClient by lazy {
        okHttp.newBuilder()
            .dispatcher(imageDispatcher)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(45, TimeUnit.SECONDS)
            .callTimeout(60, TimeUnit.SECONDS)
            .build()
    }

    private fun OkHttpClient.Builder.trustBundledRoots(): OkHttpClient.Builder {
        val trustManager = PlatformPlusBundledTrustManager()
        val sslContext = SSLContext.getInstance("TLS").apply {
            init(null, arrayOf(trustManager), null)
        }
        return sslSocketFactory(sslContext.socketFactory, trustManager)
    }

    private fun retrofit(baseUrl: String, client: OkHttpClient = okHttp): Retrofit =
        Retrofit.Builder()
            .baseUrl(baseUrl.ensureTrailingSlash())
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

    val playlistService: PlaylistService by lazy { retrofit("https://example.com/", playlistOkHttp).create(PlaylistService::class.java) }
    val webWeatherService: WebWeatherService by lazy { retrofit("https://example.com/").create(WebWeatherService::class.java) }
    val freeWeatherService: FreeWeatherService by lazy { retrofit("https://example.com/").create(FreeWeatherService::class.java) }
    // The app's own API (QR activation). Verified by the platform store plus the bundled ISRG roots
    // on API < 24, and by Network Security Config (which bundles the same roots) on API 24+.
    val webApiService: SupabaseService by lazy {
        retrofit(WebApiEndpoint.primaryBaseUrl.ifBlank { "https://moalfarras.space" }).create(SupabaseService::class.java)
    }

    val sportsDbService: SportsDbService by lazy {
        retrofit("https://www.thesportsdb.com/api/v1/json/3/").create(SportsDbService::class.java)
    }
    val webFootballService: WebFootballService by lazy { retrofit("https://example.com/").create(WebFootballService::class.java) }

    private val xtreamServices = ConcurrentHashMap<String, XtreamService>()

    /** One Retrofit service per panel base URL, reused instead of rebuilt for every call. */
    fun xtream(baseUrl: String): XtreamService =
        xtreamServices.getOrPut(baseUrl.ensureTrailingSlash()) {
            retrofit(baseUrl, xtreamOkHttp).create(XtreamService::class.java)
        }

    val supabaseService: SupabaseService? by lazy {
        if (BuildConfig.SUPABASE_URL.isBlank() || BuildConfig.SUPABASE_ANON_KEY.isBlank()) {
            null
        } else {
            retrofit(BuildConfig.SUPABASE_URL).create(SupabaseService::class.java)
        }
    }

    private fun String.ensureTrailingSlash(): String = if (endsWith('/')) this else "$this/"
}
