package com.mo.moplayer.ui.common.design

/**
 * Screen-level tuning knobs for large IPTV lists.
 */
data class ListPerformanceConfig(
    val prefetchCount: Int,
    val itemCacheSize: Int,
    val maxPoolSize: Int
) {
    companion object {
        val HomeRails = ListPerformanceConfig(prefetchCount = 5, itemCacheSize = 12, maxPoolSize = 24)
        val LiveChannels = ListPerformanceConfig(prefetchCount = 8, itemCacheSize = 28, maxPoolSize = 36)
        val Categories = ListPerformanceConfig(prefetchCount = 3, itemCacheSize = 8, maxPoolSize = 14)
    }
}
