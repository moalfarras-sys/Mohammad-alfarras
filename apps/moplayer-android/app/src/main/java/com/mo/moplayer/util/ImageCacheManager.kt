package com.mo.moplayer.util

import android.content.Context
import android.graphics.drawable.Drawable
import android.os.Handler
import android.os.Looper
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
import java.util.Collections
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
    private val mainHandler = Handler(Looper.getMainLooper())
    
    // Preload queue for upcoming images
    private val preloadQueue = Collections.synchronizedSet(mutableSetOf<String>())
    private val maxPreloadQueue = when (DevicePerformance.tier(context)) {
        DevicePerformance.Tier.LOW -> 8
        DevicePerformance.Tier.MEDIUM -> 18
        DevicePerformance.Tier.HIGH -> 32
    }
    
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
                .filter { it.isNotEmpty() }
                .take((maxPreloadQueue - preloadQueue.size).coerceAtLeast(0))
                .forEach { url ->
                    if (!preloadQueue.add(url)) return@forEach
                    
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
            level >= BACKGROUND_TRIM_LEVEL -> {
                Glide.get(context).clearMemory()
            }
            level >= RUNNING_LOW_TRIM_LEVEL -> clearPreloadQueue()
        }
    }

    fun clearMemory() {
        clearPreloadQueue()
        mainHandler.post { Glide.get(context).clearMemory() }
    }
    
    /**
     * Clear all caches
     */
    fun clearAll() {
        clearMemory()
        scope.launch(Dispatchers.IO) {
            Glide.get(context).clearDiskCache()
        }
    }
    
    enum class ImageType {
        THUMBNAIL,  // Poster/Card images
        BACKDROP,   // Background/Banner images
        ICON        // Channel logos
    }

    private companion object {
        // Numeric levels keep the behavior compatible after ComponentCallbacks2 constants were deprecated.
        const val BACKGROUND_TRIM_LEVEL = 40
        const val RUNNING_LOW_TRIM_LEVEL = 10
    }
    
}
