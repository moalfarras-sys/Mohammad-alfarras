package com.mo.moplayer

import com.mo.moplayer.util.LivePlaybackRetryPolicy
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LivePlaybackRetryPolicyTest {
    @Test
    fun canRetryUntilLimitIsReached() {
        assertTrue(LivePlaybackRetryPolicy.canRetry(0, maxRetries = 5))
        assertTrue(LivePlaybackRetryPolicy.canRetry(4, maxRetries = 5))
        assertFalse(LivePlaybackRetryPolicy.canRetry(5, maxRetries = 5))
    }

    @Test
    fun retryDelayUsesCappedExponentialBackoff() {
        assertEquals(2_000L, LivePlaybackRetryPolicy.nextDelayMs(1, jitterFraction = 0.0))
        assertEquals(4_000L, LivePlaybackRetryPolicy.nextDelayMs(2, jitterFraction = 0.0))
        assertEquals(8_000L, LivePlaybackRetryPolicy.nextDelayMs(3, jitterFraction = 0.0))
        assertEquals(10_000L, LivePlaybackRetryPolicy.nextDelayMs(4, jitterFraction = 0.0))
        assertEquals(10_000L, LivePlaybackRetryPolicy.nextDelayMs(8, jitterFraction = 0.0))
    }
}
