package com.mo.moplayer.util

import android.content.Context
import com.bumptech.glide.Glide
import com.bumptech.glide.GlideBuilder
import com.bumptech.glide.Registry
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.integration.okhttp3.OkHttpUrlLoader
import com.bumptech.glide.load.DecodeFormat
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.engine.cache.InternalCacheDiskCacheFactory
import com.bumptech.glide.load.engine.cache.LruResourceCache
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.module.AppGlideModule
import com.bumptech.glide.request.RequestOptions
import okhttp3.OkHttpClient
import java.security.SecureRandom
import java.security.cert.X509Certificate
import java.io.InputStream
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext
import javax.net.ssl.X509TrustManager

/**
 * Custom Glide module for optimized image loading and caching
 * Configured for TV apps with large screens and limited memory
 */
@GlideModule
class MoPlayerGlideModule : AppGlideModule() {
    
    companion object {
        // 500MB disk cache for IPTV posters/thumbnails
        private const val DISK_CACHE_SIZE = 500L * 1024 * 1024
        
        // Memory cache based on available memory (12-20% of app memory)
        private const val MEMORY_CACHE_PERCENTAGE = 0.15

        // Many IPTV image CDNs reject non-browser clients; keep this close to the image stack.
        private const val IMAGE_USER_AGENT =
            "Mozilla/5.0 (Linux; Android TV; MoPlayer Classic) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    }
    
    override fun applyOptions(context: Context, builder: GlideBuilder) {
        // Set disk cache size with custom cache name
        builder.setDiskCache(
            InternalCacheDiskCacheFactory(
                context,
                "moplayer_image_cache",
                DISK_CACHE_SIZE
            )
        )
        
        // Calculate memory cache size dynamically
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        val memoryInfo = android.app.ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)
        val memoryCacheSize = (memoryInfo.totalMem * MEMORY_CACHE_PERCENTAGE).toLong()
        
        // Set memory cache and bitmap pool
        val calculator = com.bumptech.glide.load.engine.cache.MemorySizeCalculator.Builder(context)
            .setMemoryCacheScreens(3f) // Cache 3 screens worth of images
            .setBitmapPoolScreens(4f)   // Bitmap pool for 4 screens
            .build()
        
        builder.setMemoryCache(LruResourceCache(calculator.memoryCacheSize.toLong()))
        builder.setBitmapPool(com.bumptech.glide.load.engine.bitmap_recycle.LruBitmapPool(calculator.bitmapPoolSize.toLong()))
        
        // Default request options for all image loads
        builder.setDefaultRequestOptions(
            RequestOptions()
                .diskCacheStrategy(DiskCacheStrategy.ALL) // Cache original + transformed
                .format(DecodeFormat.PREFER_RGB_565) // Save memory (vs ARGB_8888)
                .timeout(10000) // 10 seconds timeout for network images
                .skipMemoryCache(false) // Always use memory cache
        )
        
        // Set log level to ERROR in production
        builder.setLogLevel(android.util.Log.ERROR)
    }

    override fun registerComponents(context: Context, glide: Glide, registry: Registry) {
        val trustManager = object : X509TrustManager {
            override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) = Unit
            override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) = Unit
            override fun getAcceptedIssuers(): Array<X509Certificate> = emptyArray()
        }
        val sslContext = SSLContext.getInstance("TLS").apply {
            init(null, arrayOf(trustManager), SecureRandom())
        }
        val client = OkHttpClient.Builder()
            .sslSocketFactory(sslContext.socketFactory, trustManager)
            .hostnameVerifier { _, _ -> true }
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(45, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .header("Accept", "image/jpeg,image/png,image/webp,image/*;q=0.8,*/*;q=0.5")
                    .header("Accept-Language", "en-US,en;q=0.9,ar;q=0.8")
                    .header("User-Agent", IMAGE_USER_AGENT)
                    .build()
                chain.proceed(request)
            }
            .build()
        registry.replace(GlideUrl::class.java, InputStream::class.java, OkHttpUrlLoader.Factory(client))
    }
    
    override fun isManifestParsingEnabled(): Boolean = false

}
