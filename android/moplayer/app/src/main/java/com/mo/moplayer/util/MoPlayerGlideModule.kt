package com.mo.moplayer.util

import android.content.Context
import com.bumptech.glide.GlideBuilder
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.load.DecodeFormat
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.engine.cache.InternalCacheDiskCacheFactory
import com.bumptech.glide.load.engine.cache.LruResourceCache
import com.bumptech.glide.module.AppGlideModule
import com.bumptech.glide.request.RequestOptions

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
    
    override fun isManifestParsingEnabled(): Boolean = false
}
