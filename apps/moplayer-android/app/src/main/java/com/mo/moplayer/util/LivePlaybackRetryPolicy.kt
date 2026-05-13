package com.mo.moplayer.util

object LivePlaybackRetryPolicy {
    const val DEFAULT_MAX_RETRIES = 5
    const val DEFAULT_BASE_DELAY_MS = 2_000L
    const val DEFAULT_MAX_DELAY_MS = 10_000L

    fun canRetry(currentRetryCount: Int, maxRetries: Int = DEFAULT_MAX_RETRIES): Boolean =
        currentRetryCount < maxRetries

    fun nextDelayMs(
        retryCount: Int,
        baseDelayMs: Long = DEFAULT_BASE_DELAY_MS,
        maxDelayMs: Long = DEFAULT_MAX_DELAY_MS
    ): Long {
        val safeRetry = retryCount.coerceAtLeast(1)
        val multiplier = 1L shl (safeRetry - 1).coerceAtMost(30)
        return (baseDelayMs * multiplier).coerceAtMost(maxDelayMs)
    }
}
