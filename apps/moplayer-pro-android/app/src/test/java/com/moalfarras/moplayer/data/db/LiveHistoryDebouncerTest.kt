package com.moalfarras.moplayer.data.db

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import org.junit.Assert.assertEquals
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class LiveHistoryDebouncerTest {
    private val scope = TestScope(StandardTestDispatcher())
    private val debouncer = LiveHistoryDebouncer(scope, dwellMs = 10_000)
    private val written = mutableListOf<String>()

    private fun start(channel: String) = debouncer.schedule { written += channel }

    @Test
    fun channelIsRecordedOnlyAfterTheDwell() {
        start("a")
        scope.advanceTimeBy(9_999)
        scope.runCurrent()
        assertEquals(emptyList<String>(), written)
        scope.advanceTimeBy(1)
        scope.runCurrent()
        assertEquals(listOf("a"), written)
    }

    @Test
    fun zappingThroughChannelsRecordsOnlyTheOneWatched() {
        start("a")
        scope.advanceTimeBy(2_000)
        start("b")
        scope.advanceTimeBy(3_000)
        start("c")
        scope.advanceTimeBy(10_000)
        scope.runCurrent()
        assertEquals(listOf("c"), written)
    }

    @Test
    fun aFailedWriteDoesNotStopLaterOnes() {
        debouncer.schedule { error("disk full") }
        scope.advanceTimeBy(10_001)
        scope.runCurrent()
        start("d")
        scope.advanceTimeBy(10_001)
        scope.runCurrent()
        assertEquals(listOf("d"), written)
    }

    @Test
    fun aChannelClosedBeforeTheDwellIsNotRecorded() {
        start("e")
        scope.advanceTimeBy(4_000)
        debouncer.cancel()
        scope.advanceTimeBy(10_000)
        scope.runCurrent()
        assertEquals(emptyList<String>(), written)
        start("f")
        scope.advanceTimeBy(10_001)
        scope.runCurrent()
        assertEquals(listOf("f"), written)
    }
}
