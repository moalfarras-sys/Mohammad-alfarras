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
    
    // Shared ViewPool for content cards
    private val contentCardPool = RecyclerView.RecycledViewPool().apply {
        setMaxRecycledViews(VIEW_TYPE_CONTENT_CARD, ListPerformanceConfig.HomeRails.maxPoolSize)
        setMaxRecycledViews(VIEW_TYPE_CONTENT_CARD_SMALL, 25)
        setMaxRecycledViews(VIEW_TYPE_CHANNEL, ListPerformanceConfig.LiveChannels.maxPoolSize)
        setMaxRecycledViews(VIEW_TYPE_EPISODE, 10)
        setMaxRecycledViews(VIEW_TYPE_MOVIE, 20)
        setMaxRecycledViews(VIEW_TYPE_SERIES, 20)
        setMaxRecycledViews(VIEW_TYPE_EPISODE_TV, 10)
        setMaxRecycledViews(VIEW_TYPE_SEASON, 10)
        setMaxRecycledViews(VIEW_TYPE_SEASON_TV, 10)
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
            setItemViewCacheSize(config.itemCacheSize)
            
            // Configure layout manager for prefetching
            (layoutManager as? LinearLayoutManager)?.apply {
                initialPrefetchItemCount = maxOf(prefetchCount, config.prefetchCount)
                isItemPrefetchEnabled = true
            }
            
            // Disable nested scrolling for better performance in nested layouts
            isNestedScrollingEnabled = false
            
            // Optimize for TV with larger cache
            if (context.isTvDevice()) {
                setItemViewCacheSize(15)
            }
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
            setItemViewCacheSize(5)
            (layoutManager as? LinearLayoutManager)?.apply {
                initialPrefetchItemCount = prefetchCount
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
            setItemViewCacheSize(5)
            (layoutManager as? LinearLayoutManager)?.apply {
                initialPrefetchItemCount = prefetchCount
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
            setItemViewCacheSize(config.itemCacheSize)
            
            // Larger cache for channel switching performance
            if (context.isTvDevice()) {
                setItemViewCacheSize(config.itemCacheSize + 8)
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
