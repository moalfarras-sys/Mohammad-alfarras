package com.moalfarras.moplayer

import android.app.ActivityManager
import android.app.Application
import android.content.Context
import android.os.StrictMode
import coil3.disk.DiskCache
import coil3.ImageLoader
import coil3.memory.MemoryCache
import coil3.SingletonImageLoader
import coil3.network.okhttp.OkHttpNetworkFetcherFactory
import com.moalfarras.moplayer.data.network.NetworkModule
import com.moalfarras.moplayerpro.BuildConfig
import okhttp3.OkHttpClient
import okio.Path.Companion.toOkioPath
import java.util.concurrent.TimeUnit

/**
 * Registers a Coil [ImageLoader] with HTTP(S) fetching and a browser-like User-Agent so IPTV
 * panel logos/posters load reliably (many CDNs reject empty or non-browser agents).
 */
class MoPlayerApplication : Application(), SingletonImageLoader.Factory {

    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) {
            StrictMode.setThreadPolicy(
                StrictMode.ThreadPolicy.Builder()
                    .detectDiskReads()
                    .detectDiskWrites()
                    .detectNetwork()
                    .penaltyLog()
                    .build(),
            )
        }
    }

    override fun newImageLoader(context: Context): ImageLoader {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val isLowMemoryDevice = activityManager?.isLowRamDevice == true ||
            ((activityManager?.memoryClass ?: 128) <= 128)
        val memoryCachePercent = if (isLowMemoryDevice) 0.12 else 0.22
        val diskCacheBytes = if (isLowMemoryDevice) LOW_MEMORY_DISK_CACHE_BYTES else DEFAULT_DISK_CACHE_BYTES
        val client: OkHttpClient = NetworkModule.imageOkHttp.newBuilder()
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val req = chain.request()
                val builder = req.newBuilder()
                    .header("Accept", "image/jpeg,image/png,image/*;q=0.8,*/*;q=0.5")
                    .header("Accept-Language", "en-US,en;q=0.9,ar;q=0.8")
                if (req.header("User-Agent").isNullOrBlank()) {
                    builder.header("User-Agent", IMAGE_USER_AGENT)
                }
                if (req.url.host.equals("image.tmdb.org", ignoreCase = true)) {
                    builder.header("Referer", "https://www.themoviedb.org/")
                }
                chain.proceed(builder.build())
            }
            .build()
        return ImageLoader.Builder(context)
            .memoryCache {
                MemoryCache.Builder()
                    .maxSizePercent(context, memoryCachePercent)
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(context.cacheDir.resolve("moplayer-image-cache").toOkioPath())
                    .maxSizeBytes(diskCacheBytes)
                    .build()
            }
            .components {
                add(OkHttpNetworkFetcherFactory(callFactory = client))
            }
            .build()
    }

    companion object {
        private const val LOW_MEMORY_DISK_CACHE_BYTES = 64L * 1024L * 1024L
        private const val DEFAULT_DISK_CACHE_BYTES = 160L * 1024L * 1024L
        private const val IMAGE_USER_AGENT =
            "Mozilla/5.0 (Linux; Android 12; MoPlayer Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    }
}
