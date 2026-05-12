package com.moalfarras.moplayer

import android.app.Application
import android.content.Context
import coil3.ImageLoader
import coil3.SingletonImageLoader
import coil3.network.okhttp.OkHttpNetworkFetcherFactory
import com.moalfarras.moplayer.data.network.NetworkModule
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/**
 * Registers a Coil [ImageLoader] with HTTP(S) fetching and a browser-like User-Agent so IPTV
 * panel logos/posters load reliably (many CDNs reject empty or non-browser agents).
 */
class MoPlayerApplication : Application(), SingletonImageLoader.Factory {

    override fun newImageLoader(context: Context): ImageLoader {
        val client: OkHttpClient = NetworkModule.okHttp.newBuilder()
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val req = chain.request()
                if (!req.header("User-Agent").isNullOrBlank()) {
                    chain.proceed(req)
                } else {
                    chain.proceed(
                        req.newBuilder()
                            .header("User-Agent", IMAGE_USER_AGENT)
                            .build(),
                    )
                }
            }
            .build()
        return ImageLoader.Builder(context)
            .components {
                add(OkHttpNetworkFetcherFactory(callFactory = client))
            }
            .build()
    }

    companion object {
        private const val IMAGE_USER_AGENT =
            "Mozilla/5.0 (Linux; Android 12; MoPlayer Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    }
}
