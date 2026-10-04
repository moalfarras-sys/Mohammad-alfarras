package com.mo.moplayer

import com.mo.moplayer.util.isAdultCategoryName
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AdultCategoryNameTest {

    @Test
    fun matchesCommonAdultGroupNames() {
        listOf("Adult", "XXX Movies", "FOR ADULTS", "+18 Channels", "18+ VOD", "قنوات للكبار", "Adults | VIP").forEach {
            assertTrue(it, isAdultCategoryName(it))
        }
    }

    @Test
    fun leavesNormalGroupsAlone() {
        listOf("BEIN SPORT 4K", "Kids", "World Cup 2018", "MBC 18", "Documentary", "أفلام عربي").forEach {
            assertFalse(it, isAdultCategoryName(it))
        }
    }
}
