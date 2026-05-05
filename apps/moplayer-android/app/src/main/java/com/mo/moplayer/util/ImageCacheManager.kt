package com.mo.moplayer.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.util.LruCache
import android.widget.ImageView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.RequestOptions
import com.bumptech.glide.request.target.Target
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Advanced Image Cache Manager with LRU caching and preloading support.
 * Optimized for IPTV applications with many thumbnails.
 */
@Singleton
class ImageCacheManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    // Memory cache for fast access (10% of available memory)
    private val maxMemory = (Runtime.getRuntime().maxMemory() / 1024).toInt()
    private val cacheSize = maxMemory / 10
    
    private val memoryCache = object : LruCache<String, Bitmap>(cacheSize) {
        override fun sizeOf(key: String, bitmap: Bitmap): Int {
            return bitmap.byteCount / 1024
        }
    }
    
    // Preload queue for upcoming images
    private val preloadQueue = mutableSetOf<String>()
    private val maxPreloadQueue = 50
    
    // Request options for different scenarios
    private val thumbnailOptions = RequestOptions()
        .diskCacheStrategy(DiskCacheStrategy.ALL)
        .centerCrop()
        .override(300, 450) // Poster size
        .placeholder(android.R.color.transparent)
        .error(android.R.color.darker_gray)
    
    private val backdropOptions = RequestOptions()
        .diskCacheStrategy(DiskCacheStrategy.ALL)
        .centerCrop()
        .override(800, 450) // Backdrop size
        .placeholder(android.R.color.transparent)
    
    private val iconOptions = RequestOptions()
        .diskCacheStrategy(DiskCacheStrategy.ALL)
        .centerInside()
        .override(150, 150) // Channel icon size
        .placeholder(android.R.color.transparent)
    
    /**
     * Load image with optimized caching
     */
    fun loadImage(
        imageView: ImageView,
        url: String?,
        type: ImageType = ImageType.THUMBNAIL,
        crossFade: Boolean = true,
        onSuccess: (() -> Unit)? = null,
        onError: (() -> Unit)? = null
    ) {
        if (url.isNullOrEmpty()) {
            onError?.invoke()
            return
        }
        
        val options = when (type) {
            ImageType.THUMBNAIL -> thumbnailOptions
            ImageType.BACKDROP -> backdropOptions
            ImageType.ICON -> iconOptions
        }
        
        if (!GlideHelper.isValidContextForGlide(imageView.context)) {
            onError?.invoke()
            return
        }

        var request = Glide.with(imageView.context)
            .load(url)
            .apply(options)
        
        if (crossFade) {
            request = request.transition(DrawableTransitionOptions.withCrossFade(200))
        }
        
        request.listener(object : RequestListener<Drawable> {
            override fun onLoadFailed(
                e: GlideException?,
                model: Any?,
                target: Target<Drawable>,
                isFirstResource: Boolean
            ): Boolean {
                onError?.invoke()
                return false
            }
            
            override fun onResourceReady(
                resource: Drawable,
                model: Any,
                target: Target<Drawable>?,
                dataSource: DataSource,
                isFirstResource: Boolean
            ): Boolean {
                onSuccess?.invoke()
                return false
            }
        }).into(imageView)
    }
    
    /**
     * Preload images for smoother scrolling
     */
    fun preloadImages(urls: List<String?>, type: ImageType = ImageType.THUMBNAIL) {
        scope.launch {
            urls.filterNotNull()
                .filter { it.isNotEmpty() && !preloadQueue.contains(it) }
                .take(maxPreloadQueue - preloadQueue.size)
                .forEach { url ->
                    preloadQueue.add(url)
                    
                    val options = when (type) {
                        ImageType.THUMBNAIL -> thumbnailOptions
                        ImageType.BACKDROP -> backdropOptions
                        ImageType.ICON -> iconOptions
                    }
                    
                    try {
                        Glide.with(context)
                            .load(url)
                            .apply(options)
                            .preload()
                    } catch (e: Exception) {
                        // Ignore preload errors
                    }
                }
        }
    }
    
    /**
     * Preload next page of content for infinite scroll
     */
    fun preloadNextPage(urls: List<String?>) {
        preloadImages(urls.take(10), ImageType.THUMBNAIL)
    }
    
    /**
     * Clear preload queue when navigating away
     */
    fun clearPreloadQueue() {
        preloadQueue.clear()
    }
    
    /**
     * Trim memory on low memory conditions
     */
    fun trimMemory(level: Int) {
        when {
            level >= android.content.ComponentCallbacks2.TRIM_MEMORY_MODERATE -> {
                memoryCache.evictAll()
                Glide.get(context).clearMemory()
            }
            level >= android.content.ComponentCallbacks2.TRIM_MEMORY_BACKGROUND -> {
                memoryCache.trimToSize(memoryCache.size() / 2)
            }
        }
    }
    
    /**
     * Clear all caches
     */
    fun clearAll() {
        scope.launch {
            memoryCache.evictAll()
            Glide.get(context).clearMemory()
        }
        scope.launch(Dispatchers.IO) {
            Glide.get(context).clearDiskCache()
        }
    }
    
    /**
     * Get cache statistics for debugging
     */
    fun getCacheStats(): CacheStats {
        return CacheStats(
            hitCount = memoryCache.hitCount(),
            missCount = memoryCache.missCount(),
            currentSize = memoryCache.size(),
            maxSize = memoryCache.maxSize(),
            preloadQueueSize = preloadQueue.size
        )
    }
    
    enum class ImageType {
        THUMBNAIL,  // Poster/Card images
        BACKDROP,   // Background/Banner images
        ICON        // Channel logos
    }
    
    data class CacheStats(
        val hitCount: Int,
        val missCount: Int,
        val currentSize: Int,
        val maxSize: Int,
        val preloadQueueSize: Int
    )
}
