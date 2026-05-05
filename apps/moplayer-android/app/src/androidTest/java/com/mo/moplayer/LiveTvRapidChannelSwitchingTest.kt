package com.mo.moplayer

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mo.moplayer.data.local.entity.ChannelEntity
import com.mo.moplayer.databinding.ItemChannelTivimateBinding
import com.mo.moplayer.ui.livetv.adapters.ChannelTiviMateAdapter
import kotlinx.coroutines.*
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * Instrumented test to verify the RecyclerView crash fix for rapid channel switching.
 * 
 * This test verifies that the solution prevents crashes that occurred when:
 * - Two independent observers trigger adapter updates that conflict
 * - Multiple notifyItemChanged() calls queue up via Choreographer
 * - These queued operations conflict when RecyclerView processes them during layout
 * 
 * The fix eliminates manual notifications and uses DiffUtil's change detection with payloads.
 */
@RunWith(AndroidJUnit4::class)
class LiveTvRapidChannelSwitchingTest {

    private lateinit var adapter: ChannelTiviMateAdapter
    private lateinit var recyclerView: RecyclerView
    private val context = InstrumentationRegistry.getInstrumentation().targetContext
    
    // Test channels
    private val testChannels = (1..50).map { index ->
        ChannelEntity(
            channelId = "channel_$index",
            serverId = 1L,
            streamId = 100 + index,
            name = "Channel $index",
            streamUrl = "http://example.com/stream$index",
            streamIcon = null,
            categoryId = "test_category",
            epgChannelId = null,
            tvArchive = false,
            tvArchiveDuration = 0,
            isAdult = false,
            addedAt = System.currentTimeMillis(),
            customOrder = index
        )
    }

    @Before
    fun setup() {
        // Initialize adapter on UI thread
        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            val themeManager = com.mo.moplayer.util.ThemeManager(context)
            adapter = ChannelTiviMateAdapter(
                onChannelClick = {},
                onChannelFocused = {},
                onFavoriteClick = null,
                themeManager = themeManager
            )
            
            // Create RecyclerView and attach adapter
            recyclerView = RecyclerView(context).apply {
                layoutManager = androidx.recyclerview.widget.LinearLayoutManager(context)
                adapter = this@LiveTvRapidChannelSwitchingTest.adapter
                // Layout the RecyclerView
                measure(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
                layout(0, 0, measuredWidth, measuredHeight)
            }
        }
    }

    @Test
    fun testRapidChannelSwitching_noCrash() {
        val latch = CountDownLatch(1)
        var testPassed = true
        var errorMessage: String? = null

        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            try {
                // Initial submit with first channel playing
                adapter.submitListWithCurrentChannel(testChannels, testChannels[0].channelId)
                
                // Simulate rapid channel switching (100 switches in quick succession)
                // This mimics the race condition that caused the original crash
                repeat(100) { iteration ->
                    val channelIndex = iteration % testChannels.size
                    val channel = testChannels[channelIndex]
                    
                    // Rapidly switch current channel - this would previously cause crashes
                    // because multiple notifyItemChanged() calls would queue up
                    adapter.submitListWithCurrentChannel(testChannels, channel.channelId)
                    
                    // Force layout to process queued updates (simulates Choreographer processing)
                    recyclerView.measure(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    )
                    recyclerView.layout(0, 0, recyclerView.measuredWidth, recyclerView.measuredHeight)
                }
                
                testPassed = true
            } catch (e: Exception) {
                testPassed = false
                errorMessage = "Crash occurred during rapid channel switching: ${e.message}\n${e.stackTraceToString()}"
            } finally {
                latch.countDown()
            }
        }

        // Wait for test to complete
        assertTrue("Test timed out", latch.await(30, TimeUnit.SECONDS))
        assertTrue(errorMessage ?: "Test passed", testPassed)
    }

    @Test
    fun testConcurrentChannelSwitching_noCrash() = runTest {
        val latch = CountDownLatch(1)
        var testPassed = true
        var errorMessage: String? = null

        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            try {
                // Initial submit
                adapter.submitListWithCurrentChannel(testChannels, testChannels[0].channelId)
                
                // Simulate the original race condition:
                // - filteredChannels observer submits list
                // - currentChannel observer rapidly fires and calls submitListWithCurrentChannel
                
                // Rapid channel switches from "currentChannel" observer
                val job = CoroutineScope(Dispatchers.Main).launch {
                    repeat(50) { iteration ->
                        val channel = testChannels[iteration % testChannels.size]
                        adapter.submitListWithCurrentChannel(testChannels, channel.channelId)
                        delay(1) // Minimal delay to simulate async nature
                    }
                }
                
                // Concurrent list updates from "filteredChannels" observer
                val job2 = CoroutineScope(Dispatchers.Main).launch {
                    repeat(10) {
                        adapter.submitListWithCurrentChannel(testChannels, testChannels[it % testChannels.size].channelId)
                        delay(5) // Slightly slower updates
                    }
                }
                
                // Wait for both jobs
                runBlocking {
                    job.join()
                    job2.join()
                }
                
                // Force final layout
                recyclerView.measure(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
                recyclerView.layout(0, 0, recyclerView.measuredWidth, recyclerView.measuredHeight)
                
                testPassed = true
            } catch (e: Exception) {
                testPassed = false
                errorMessage = "Crash occurred during concurrent updates: ${e.message}\n${e.stackTraceToString()}"
            } finally {
                latch.countDown()
            }
        }

        assertTrue("Test timed out", latch.await(30, TimeUnit.SECONDS))
        assertTrue(errorMessage ?: "Test passed", testPassed)
    }

    @Test
    fun testPayloadUpdate_onlyPlayingStateChanges() {
        val latch = CountDownLatch(1)
        var testPassed = true
        var errorMessage: String? = null

        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            try {
                // Submit initial list with channel 0 playing
                adapter.submitListWithCurrentChannel(testChannels, testChannels[0].channelId)
                recyclerView.measure(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
                recyclerView.layout(0, 0, recyclerView.measuredWidth, recyclerView.measuredHeight)
                
                // Switch to channel 1 - this should trigger payload update for both items
                adapter.submitListWithCurrentChannel(testChannels, testChannels[1].channelId)
                recyclerView.measure(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
                recyclerView.layout(0, 0, recyclerView.measuredWidth, recyclerView.measuredHeight)
                
                // Verify adapter has correct item count
                assertEquals("Adapter should have ${testChannels.size} items", testChannels.size, adapter.itemCount)
                
                testPassed = true
            } catch (e: Exception) {
                testPassed = false
                errorMessage = "Payload update test failed: ${e.message}\n${e.stackTraceToString()}"
            } finally {
                latch.countDown()
            }
        }

        assertTrue("Test timed out", latch.await(10, TimeUnit.SECONDS))
        assertTrue(errorMessage ?: "Test passed", testPassed)
    }

    @Test
    fun testStableIds_duringRapidSwitching() {
        val latch = CountDownLatch(1)
        var testPassed = true
        var errorMessage: String? = null

        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            try {
                // Verify stable IDs are enabled
                assertTrue("Adapter should have stable IDs enabled", adapter.hasStableIds())
                
                // Submit initial list
                adapter.submitListWithCurrentChannel(testChannels, testChannels[0].channelId)
                
                // Store initial IDs
                val initialIds = (0 until adapter.itemCount).map { adapter.getItemId(it) }
                
                // Rapid channel switches
                repeat(20) { iteration ->
                    val channelIndex = iteration % testChannels.size
                    adapter.submitListWithCurrentChannel(testChannels, testChannels[channelIndex].channelId)
                }
                
                // Verify IDs are still stable after rapid switching
                val finalIds = (0 until adapter.itemCount).map { adapter.getItemId(it) }
                assertEquals("Item IDs should remain stable", initialIds, finalIds)
                
                testPassed = true
            } catch (e: Exception) {
                testPassed = false
                errorMessage = "Stable IDs test failed: ${e.message}\n${e.stackTraceToString()}"
            } finally {
                latch.countDown()
            }
        }

        assertTrue("Test timed out", latch.await(10, TimeUnit.SECONDS))
        assertTrue(errorMessage ?: "Test passed", testPassed)
    }

    @Test
    fun testDiffCallback_detectsPlayingStateChanges() {
        // Test the DiffCallback directly to ensure it properly detects playing state changes
        val callback = ChannelTiviMateAdapter.ChannelItemDiffCallback()
        
        val channel = testChannels[0]
        val item1 = com.mo.moplayer.ui.livetv.adapters.ChannelItem(channel, isPlaying = false)
        val item2 = com.mo.moplayer.ui.livetv.adapters.ChannelItem(channel, isPlaying = true)
        
        // Items should be the same (same channel ID)
        assertTrue("Items should be the same", callback.areItemsTheSame(item1, item2))
        
        // Contents should be different (playing state changed)
        assertFalse("Contents should be different", callback.areContentsTheSame(item1, item2))
        
        // Should generate payload for playing state change
        val payload = callback.getChangePayload(item1, item2)
        assertNotNull("Payload should be generated for playing state change", payload)
        assertEquals("Payload should be PAYLOAD_PLAYING_STATE", "playing_state", payload)
    }

    @Test
    fun testRapidSwitching_withScrolling() {
        val latch = CountDownLatch(1)
        var testPassed = true
        var errorMessage: String? = null

        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            try {
                // Initial submit
                adapter.submitListWithCurrentChannel(testChannels, testChannels[0].channelId)
                recyclerView.measure(ViewGroup.LayoutParams.MATCH_PARENT, 2000)
                recyclerView.layout(0, 0, recyclerView.measuredWidth, 2000)
                
                // Rapid channel switching with scrolling (simulates user navigating)
                repeat(30) { iteration ->
                    val channelIndex = iteration % testChannels.size
                    val channel = testChannels[channelIndex]
                    
                    // Switch channel
                    adapter.submitListWithCurrentChannel(testChannels, channel.channelId)
                    
                    // Scroll to channel (simulates user navigation)
                    recyclerView.scrollToPosition(channelIndex)
                    
                    // Force layout update
                    recyclerView.measure(ViewGroup.LayoutParams.MATCH_PARENT, 2000)
                    recyclerView.layout(0, 0, recyclerView.measuredWidth, 2000)
                }
                
                testPassed = true
            } catch (e: Exception) {
                testPassed = false
                errorMessage = "Scrolling test failed: ${e.message}\n${e.stackTraceToString()}"
            } finally {
                latch.countDown()
            }
        }

        assertTrue("Test timed out", latch.await(30, TimeUnit.SECONDS))
        assertTrue(errorMessage ?: "Test passed", testPassed)
    }

    @Test
    fun testRapidSwitching_afterListHiddenAndShown_noCrash() {
        val latch = CountDownLatch(1)
        var testPassed = true
        var errorMessage: String? = null

        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            try {
                adapter.submitListWithCurrentChannel(testChannels, testChannels[0].channelId)
                adapter.submitListWithCurrentChannel(emptyList(), null)
                adapter.submitListWithCurrentChannel(testChannels, testChannels[1].channelId)

                repeat(60) { idx ->
                    val channel = testChannels[idx % testChannels.size]
                    adapter.submitListWithCurrentChannel(testChannels, channel.channelId)
                }
            } catch (e: Exception) {
                testPassed = false
                errorMessage = e.stackTraceToString()
            } finally {
                latch.countDown()
            }
        }

        assertTrue("Test timed out", latch.await(10, TimeUnit.SECONDS))
        assertTrue(errorMessage ?: "Test passed", testPassed)
    }

    @Test
    fun testRecyclerAttachDetachCycle_noCrash() {
        val latch = CountDownLatch(1)
        var testPassed = true
        var errorMessage: String? = null

        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            try {
                repeat(5) {
                    recyclerView.adapter = adapter
                    adapter.submitListWithCurrentChannel(testChannels, testChannels[it].channelId)
                    recyclerView.adapter = null
                }
                recyclerView.adapter = adapter
                adapter.submitListWithCurrentChannel(testChannels, testChannels[0].channelId)
            } catch (e: Exception) {
                testPassed = false
                errorMessage = e.stackTraceToString()
            } finally {
                latch.countDown()
            }
        }

        assertTrue("Test timed out", latch.await(10, TimeUnit.SECONDS))
        assertTrue(errorMessage ?: "Test passed", testPassed)
    }
}
