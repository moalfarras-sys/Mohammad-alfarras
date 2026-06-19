package com.mo.moplayer.util

import android.content.Context
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.mo.moplayer.ui.common.design.ListPerformanceConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * RecyclerView optimization helper for smooth scrolling and reduced memory usage.
 * Shares ViewPools across RecyclerViews to reduce view creation.
 */
@Singleton
class RecyclerViewOptimizer @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val performanceTier = DevicePerformance.tier(context)
    private fun tierValue(low: Int, medium: Int, high: Int): Int = when (performanceTier) {
        DevicePerformance.Tier.LOW -> low
        DevicePerformance.Tier.MEDIUM -> medium
        DevicePerformance.Tier.HIGH -> high
    }
    
    // Shared ViewPool for content cards
    private val contentCardPool = RecyclerView.RecycledViewPool().apply {
        setMaxRecycledViews(VIEW_TYPE_CONTENT_CARD, tierValue(8, 16, 24))
        setMaxRecycledViews(VIEW_TYPE_CONTENT_CARD_SMALL, tierValue(8, 16, 25))
        setMaxRecycledViews(VIEW_TYPE_CHANNEL, tierValue(10, 20, 32))
        setMaxRecycledViews(VIEW_TYPE_EPISODE, tierValue(5, 8, 10))
        setMaxRecycledViews(VIEW_TYPE_MOVIE, tierValue(6, 12, 20))
        setMaxRecycledViews(VIEW_TYPE_SERIES, tierValue(6, 12, 20))
        setMaxRecycledViews(VIEW_TYPE_EPISODE_TV, tierValue(5, 8, 10))
        setMaxRecycledViews(VIEW_TYPE_SEASON, tierValue(5, 8, 10))
        setMaxRecycledViews(VIEW_TYPE_SEASON_TV, tierValue(5, 8, 10))
    }
    
    // Shared ViewPool for rows (category lists: Movies/Series)
    private val rowPool = RecyclerView.RecycledViewPool().apply {
        setMaxRecycledViews(VIEW_TYPE_ROW, 5)
    }
    
    // Dedicated ViewPool for home content rows (ContentRowAdapter only)
    private val contentRowPool = RecyclerView.RecycledViewPool().apply {
        setMaxRecycledViews(VIEW_TYPE_ROW, 5)
    }
    
    /**
     * Optimize a horizontal RecyclerView for content rows
     */
    fun optimizeHorizontalList(
        recyclerView: RecyclerView,
        prefetchCount: Int = 5
    ) {
        val config = ListPerformanceConfig.HomeRails
        recyclerView.apply {
            // Share view pool
            setRecycledViewPool(contentCardPool)
            
            // Optimize layout
            setHasFixedSize(true)
            setItemViewCacheSize(tierValue(5, 9, config.itemCacheSize))
            
            // Configure layout manager for prefetching
            (layoutManager as? LinearLayoutManager)?.apply {
                initialPrefetchItemCount = tierValue(2, 4, maxOf(prefetchCount, config.prefetchCount))
                isItemPrefetchEnabled = true
            }
            
            // Disable nested scrolling for better performance in nested layouts
            isNestedScrollingEnabled = false
            
            // TV focus remains smooth without pinning dozens of poster bitmaps on 1 GB boxes.
        }
    }
    
    /**
     * Optimize a vertical RecyclerView for content rows (category lists: Movies/Series).
     * Uses shared row pool; do not use for Home content rows.
     */
    fun optimizeVerticalList(
        recyclerView: RecyclerView,
        prefetchCount: Int = 3
    ) {
        recyclerView.apply {
            setRecycledViewPool(rowPool)
            setHasFixedSize(true)
            setItemViewCacheSize(tierValue(3, 4, 5))
            (layoutManager as? LinearLayoutManager)?.apply {
                initialPrefetchItemCount = tierValue(1, 2, prefetchCount)
                isItemPrefetchEnabled = true
            }
        }
    }
    
    /**
     * Optimize the home vertical RecyclerView for content rows (ContentRowAdapter only).
     * Uses a dedicated pool so ViewHolders are not shared with category lists.
     */
    fun optimizeContentRowList(
        recyclerView: RecyclerView,
        prefetchCount: Int = 3
    ) {
        recyclerView.apply {
            setRecycledViewPool(contentRowPool)
            setHasFixedSize(true)
            setItemViewCacheSize(tierValue(3, 4, 5))
            (layoutManager as? LinearLayoutManager)?.apply {
                initialPrefetchItemCount = tierValue(1, 2, prefetchCount)
                isItemPrefetchEnabled = true
            }
        }
    }
    
    /**
     * Optimize for channel grid/list
     */
    fun optimizeChannelList(
        recyclerView: RecyclerView
    ) {
        val config = ListPerformanceConfig.LiveChannels
        recyclerView.apply {
            setRecycledViewPool(contentCardPool)
            setHasFixedSize(true)
            setItemViewCacheSize(tierValue(6, 12, 20))
            (layoutManager as? LinearLayoutManager)?.apply {
                initialPrefetchItemCount = tierValue(3, 5, config.prefetchCount)
                isItemPrefetchEnabled = true
            }
        }
    }
    
    /**
     * Add scroll listener for infinite loading optimization
     */
    fun addInfiniteScrollListener(
        recyclerView: RecyclerView,
        threshold: Int = 5,
        onLoadMore: () -> Unit
    ): RecyclerView.OnScrollListener {
        val listener = object : RecyclerView.OnScrollListener() {
            private var isLoading = false
            
            override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
                if (isLoading || dy <= 0) return
                
                val layoutManager = recyclerView.layoutManager as? LinearLayoutManager ?: return
                val totalItems = layoutManager.itemCount
                val lastVisible = layoutManager.findLastVisibleItemPosition()
                
                if (lastVisible >= totalItems - threshold) {
                    isLoading = true
                    onLoadMore()
                }
            }
            
            fun setLoadingComplete() {
                isLoading = false
            }
        }
        
        recyclerView.addOnScrollListener(listener)
        return listener
    }
    
    /**
     * Clear pools on low memory
     */
    fun clearPools() {
        contentCardPool.clear()
        rowPool.clear()
        contentRowPool.clear()
    }
    
    private fun Context.isTvDevice(): Boolean {
        val uiModeManager = getSystemService(Context.UI_MODE_SERVICE) as android.app.UiModeManager
        return uiModeManager.currentModeType == android.content.res.Configuration.UI_MODE_TYPE_TELEVISION
    }
    
    companion object {
        const val VIEW_TYPE_CONTENT_CARD = 1
        const val VIEW_TYPE_CONTENT_CARD_SMALL = 2
        const val VIEW_TYPE_CHANNEL = 3
        const val VIEW_TYPE_EPISODE = 4
        const val VIEW_TYPE_MOVIE = 5
        const val VIEW_TYPE_SERIES = 6
        const val VIEW_TYPE_EPISODE_TV = 7
        const val VIEW_TYPE_SEASON = 8
        const val VIEW_TYPE_SEASON_TV = 9
        const val VIEW_TYPE_ROW = 10
    }
}
