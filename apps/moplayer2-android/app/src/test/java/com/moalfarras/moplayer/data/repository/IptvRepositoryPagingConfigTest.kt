package com.moalfarras.moplayer.data.repository

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class IptvRepositoryPagingConfigTest {
    @Test
    fun browsePagingUsesLargerBatchesForHugeLibraries() {
        val config = largeLibraryPagingConfig()

        assertEquals(LIBRARY_BROWSE_PAGE_SIZE, config.pageSize)
        assertEquals(LIBRARY_BROWSE_PAGE_SIZE, config.prefetchDistance)
        assertEquals(LIBRARY_BROWSE_PAGE_SIZE * 3, config.initialLoadSize)
        assertTrue(config.maxSize >= config.pageSize + config.prefetchDistance * 2)
    }

    @Test
    fun shelfPagingStillUsesABoundedWeakDeviceWindow() {
        val config = largeLibraryPagingConfig(LIBRARY_SHELF_PAGE_SIZE, maxPages = 8)

        assertEquals(LIBRARY_SHELF_PAGE_SIZE, config.pageSize)
        assertEquals(LIBRARY_SHELF_PAGE_SIZE * 3, config.initialLoadSize)
        assertEquals(LIBRARY_SHELF_PAGE_SIZE * 8, config.maxSize)
    }
}
