package com.mo.moplayer.util

import kotlinx.coroutines.delay

/**
 * Smart retry policy for live-stream playback.
 *
 * Changes from the original:
 * - **CircuitBreaker**: after [maxRetries] consecutive failures, the breaker OPENs
 *   and blocks retries for [circuitOpenDurationMs]. This prevents infinite retry loops
 *   that burn CPU/battery and spam the server.
 * - **Exponential backoff** capped at [maxDelayMs].
 * - **Jitter** (+/- 25 %) to avoid thundering-herd when many clients reconnect.
 */
object LivePlaybackRetryPolicy {

    const val DEFAULT_MAX_RETRIES = 5
    const val DEFAULT_BASE_DELAY_MS = 2_000L
    const val DEFAULT_MAX_DELAY_MS = 10_000L
    /** How long the circuit stays OPEN after max retries (default 60 s). */
    const val DEFAULT_CIRCUIT_OPEN_MS = 60_000L

    private var consecutiveFailures = 0
    private var circuitOpenUntil = 0L

    /**
     * Returns true if a retry is allowed right now.
     * Call this **before** scheduling a retry.
     */
    fun canRetry(
        currentRetryCount: Int,
        maxRetries: Int = DEFAULT_MAX_RETRIES
    ): Boolean {
        if (System.currentTimeMillis() < circuitOpenUntil) return false
        return currentRetryCount < maxRetries
    }

    /**
     * Computes the delay before the next retry, with optional jitter.
     * Call this **after** deciding to retry.
     */
    fun nextDelayMs(
        retryCount: Int,
        baseDelayMs: Long = DEFAULT_BASE_DELAY_MS,
        maxDelayMs: Long = DEFAULT_MAX_DELAY_MS,
        jitterFraction: Double = 0.25
    ): Long {
        val safeRetry = retryCount.coerceAtLeast(1)
        val multiplier = 1L shl (safeRetry - 1).coerceAtMost(30)
        val raw = (baseDelayMs * multiplier).coerceAtMost(maxDelayMs)
        if (jitterFraction <= 0.0) return raw
        val jitter = (raw * jitterFraction).toLong()
        return (raw - jitter + (kotlin.random.Random.nextLong(jitter * 2 + 1))).coerceAtLeast(500)
    }

    /** Call when a playback attempt succeeds to reset the circuit. */
    fun onSuccess() {
        consecutiveFailures = 0
        circuitOpenUntil = 0L
    }

    /** Call when a playback attempt fails to track the circuit state. */
    fun onFailure(
        maxRetries: Int = DEFAULT_MAX_RETRIES,
        circuitOpenMs: Long = DEFAULT_CIRCUIT_OPEN_MS
    ) {
        consecutiveFailures++
        if (consecutiveFailures >= maxRetries) {
            circuitOpenUntil = System.currentTimeMillis() + circuitOpenMs
            consecutiveFailures = 0 // reset so next cycle starts fresh after the wait
        }
    }

    /** True if the circuit is currently open (retry blocked). */
    val isCircuitOpen: Boolean
        get() = System.currentTimeMillis() < circuitOpenUntil

    /** Human-readable description of why retry was blocked. */
    fun circuitBlockReason(): String {
        val remaining = (circuitOpenUntil - System.currentTimeMillis()) / 1000
        return "Too many errors. Retry blocked for ${remaining}s to protect device battery."
    }

    /** Reset everything (e.g. user explicitly pressed Retry). */
    fun reset() {
        consecutiveFailures = 0
        circuitOpenUntil = 0L
    }
}
