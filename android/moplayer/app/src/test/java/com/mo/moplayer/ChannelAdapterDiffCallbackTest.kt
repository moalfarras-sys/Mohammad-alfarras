package com.mo.moplayer

import com.mo.moplayer.data.local.entity.ChannelEntity
import com.mo.moplayer.ui.livetv.adapters.ChannelItem
import com.mo.moplayer.ui.livetv.adapters.ChannelTiviMateAdapter
import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests for ChannelItemDiffCallback to verify proper change detection.
 * 
 * These tests verify that the DiffCallback correctly:
 * 1. Identifies items by channel ID
 * 2. Detects playing state changes
 * 3. Generates payloads for partial updates
 * 4. Avoids unnecessary full rebinds
 */
class ChannelAdapterDiffCallbackTest {

    private val diffCallback = ChannelTiviMateAdapter.ChannelItemDiffCallback()

    private fun createTestChannel(id: String = "test_channel") = ChannelEntity(
        channelId = id,
        serverId = 1L,
        streamId = 101,
        name = "Test Channel",
        streamUrl = "http://example.com/stream",
        streamIcon = null,
        categoryId = "test_category",
        epgChannelId = null,
        tvArchive = false,
        tvArchiveDuration = 0,
        isAdult = false,
        addedAt = System.currentTimeMillis(),
        customOrder = 0
    )

    @Test
    fun `areItemsTheSame returns true for same channel ID`() {
        val channel = createTestChannel("channel_1")
        val item1 = ChannelItem(channel, isPlaying = false)
        val item2 = ChannelItem(channel, isPlaying = true)

        assertTrue(
            "Items with same channel ID should be considered the same",
            diffCallback.areItemsTheSame(item1, item2)
        )
    }

    @Test
    fun `areItemsTheSame returns false for different channel IDs`() {
        val channel1 = createTestChannel("channel_1")
        val channel2 = createTestChannel("channel_2")
        val item1 = ChannelItem(channel1, isPlaying = false)
        val item2 = ChannelItem(channel2, isPlaying = false)

        assertFalse(
            "Items with different channel IDs should not be considered the same",
            diffCallback.areItemsTheSame(item1, item2)
        )
    }

    @Test
    fun `areContentsTheSame returns true when both channel and playing state unchanged`() {
        val channel = createTestChannel()
        val item1 = ChannelItem(channel, isPlaying = false)
        val item2 = ChannelItem(channel.copy(), isPlaying = false)

        assertTrue(
            "Contents should be the same when channel and playing state are unchanged",
            diffCallback.areContentsTheSame(item1, item2)
        )
    }

    @Test
    fun `areContentsTheSame returns false when playing state changes`() {
        val channel = createTestChannel()
        val item1 = ChannelItem(channel, isPlaying = false)
        val item2 = ChannelItem(channel.copy(), isPlaying = true)

        assertFalse(
            "Contents should differ when playing state changes",
            diffCallback.areContentsTheSame(item1, item2)
        )
    }

    @Test
    fun `areContentsTheSame returns false when channel data changes`() {
        val channel1 = createTestChannel().copy(name = "Channel 1")
        val channel2 = createTestChannel().copy(name = "Channel 2")
        val item1 = ChannelItem(channel1, isPlaying = false)
        val item2 = ChannelItem(channel2, isPlaying = false)

        assertFalse(
            "Contents should differ when channel data changes",
            diffCallback.areContentsTheSame(item1, item2)
        )
    }

    @Test
    fun `getChangePayload returns payload when only playing state changes`() {
        val channel = createTestChannel()
        val item1 = ChannelItem(channel, isPlaying = false)
        val item2 = ChannelItem(channel.copy(), isPlaying = true)

        val payload = diffCallback.getChangePayload(item1, item2)

        assertNotNull("Payload should be generated when playing state changes", payload)
        assertEquals(
            "Payload should indicate playing state change",
            "playing_state",
            payload
        )
    }

    @Test
    fun `getChangePayload returns null when channel data changes`() {
        val channel1 = createTestChannel().copy(name = "Channel 1")
        val channel2 = createTestChannel().copy(name = "Channel 2")
        val item1 = ChannelItem(channel1, isPlaying = false)
        val item2 = ChannelItem(channel2, isPlaying = false)

        val payload = diffCallback.getChangePayload(item1, item2)

        assertNull(
            "Payload should be null when channel data changes (requires full rebind)",
            payload
        )
    }

    @Test
    fun `getChangePayload returns null when both channel and playing state change`() {
        val channel1 = createTestChannel().copy(name = "Channel 1")
        val channel2 = createTestChannel().copy(name = "Channel 2")
        val item1 = ChannelItem(channel1, isPlaying = false)
        val item2 = ChannelItem(channel2, isPlaying = true)

        val payload = diffCallback.getChangePayload(item1, item2)

        assertNull(
            "Payload should be null when both channel and playing state change",
            payload
        )
    }

    @Test
    fun `getChangePayload returns payload for reverse playing state change`() {
        val channel = createTestChannel()
        val item1 = ChannelItem(channel, isPlaying = true)
        val item2 = ChannelItem(channel.copy(), isPlaying = false)

        val payload = diffCallback.getChangePayload(item1, item2)

        assertNotNull(
            "Payload should be generated when playing state changes from true to false",
            payload
        )
    }

    @Test
    fun `multiple rapid playing state changes are handled correctly`() {
        val channel = createTestChannel()
        
        // Simulate rapid channel switching by creating multiple items
        val items = listOf(
            ChannelItem(channel, isPlaying = false),
            ChannelItem(channel.copy(), isPlaying = true),
            ChannelItem(channel.copy(), isPlaying = false),
            ChannelItem(channel.copy(), isPlaying = true),
            ChannelItem(channel.copy(), isPlaying = false)
        )

        // Verify each transition generates correct payload
        for (i in 0 until items.size - 1) {
            val payload = diffCallback.getChangePayload(items[i], items[i + 1])
            assertNotNull(
                "Payload should be generated for transition $i to ${i + 1}",
                payload
            )
        }
    }

    @Test
    fun `channel with icon change requires full rebind`() {
        val channel1 = createTestChannel().copy(streamIcon = null)
        val channel2 = createTestChannel().copy(streamIcon = "http://example.com/icon.png")
        val item1 = ChannelItem(channel1, isPlaying = false)
        val item2 = ChannelItem(channel2, isPlaying = false)

        val payload = diffCallback.getChangePayload(item1, item2)

        assertNull(
            "Payload should be null when channel icon changes (full rebind needed)",
            payload
        )
    }
}
