package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.domain.model.DeviceActivationSession
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response
import java.io.IOException
import java.net.SocketTimeoutException
import java.util.concurrent.CountDownLatch
import kotlin.random.Random

class ActivationSupportTest {
    /** Random whose jitter factor is exactly 1.0, so delays are the nominal schedule. */
    private val noJitter = object : Random() {
        override fun nextBits(bitCount: Int): Int = 0
        override fun nextDouble(): Double = 0.5
    }

    private fun httpError(code: Int, body: String = "{}", retryAfter: String? = null): HttpException {
        val errorBody = body.toResponseBody("application/json".toMediaType())
        val raw = okhttp3.Response.Builder()
            .code(code)
            .message("HTTP $code")
            .protocol(okhttp3.Protocol.HTTP_1_1)
            .request(okhttp3.Request.Builder().url("https://moalfarras.space/api/app/activation/status").build())
            .apply { if (retryAfter != null) header("Retry-After", retryAfter) }
            .build()
        return HttpException(Response.error<Any>(errorBody, raw))
    }

    @Test
    fun statusCodesMapToWhatTheTvShouldDo() {
        assertEquals(ActivationPollResult.Expired(ActivationExpiry.CODE_EXPIRED), activationHttpOutcome(404, ActivationEndpoint.STATUS))
        assertEquals(ActivationPollResult.Expired(ActivationExpiry.CODE_EXPIRED), activationHttpOutcome(410, ActivationEndpoint.STATUS))
        assertEquals(ActivationPollResult.Invalid(400), activationHttpOutcome(400, ActivationEndpoint.STATUS))
        assertEquals(ActivationPollResult.Invalid(409), activationHttpOutcome(409, ActivationEndpoint.STATUS))
        listOf(408, 425, 429, 500, 502, 503, 504).forEach { code ->
            assertTrue("HTTP $code", activationHttpOutcome(code, ActivationEndpoint.STATUS) is ActivationPollResult.Transient)
        }
    }

    @Test
    fun rejectedDeviceTokenAsksForTheNewCode() {
        assertEquals(ActivationPollResult.Expired(ActivationExpiry.TOKEN_REJECTED), activationHttpOutcome(401, ActivationEndpoint.SOURCE))
        assertEquals(ActivationPollResult.Expired(ActivationExpiry.CODE_EXPIRED), activationHttpOutcome(410, ActivationEndpoint.SOURCE))
        assertEquals(ActivationPollResult.Transient(0L), activationHttpOutcome(503, ActivationEndpoint.SOURCE))
    }

    @Test
    fun networkFailuresKeepTheSameCode() {
        assertEquals(ActivationPollResult.Transient(), activationFailureOutcome(SocketTimeoutException("timeout"), ActivationEndpoint.STATUS))
        assertEquals(ActivationPollResult.Transient(), activationFailureOutcome(IOException("reset"), ActivationEndpoint.SOURCE))
        assertEquals(ActivationPollResult.Expired(ActivationExpiry.CODE_EXPIRED), activationFailureOutcome(httpError(410), ActivationEndpoint.STATUS))
        assertTrue(isTransientActivationFailure(IOException("dns")))
        assertTrue(isTransientActivationFailure(httpError(502)))
        assertFalse(isTransientActivationFailure(httpError(400)))
        assertFalse(isTransientActivationFailure(IllegalStateException("no code")))
    }

    @Test
    fun rateLimitHonoursTheServersRetryHint() {
        val limited = activationFailureOutcome(httpError(429, """{"ok":false,"error":"rate_limited","retryAfterSeconds":17}"""), ActivationEndpoint.STATUS)
        assertEquals(ActivationPollResult.Transient(17_000L), limited)
        assertEquals(ActivationPollResult.Transient(9_000L), activationFailureOutcome(httpError(503, retryAfter = "9"), ActivationEndpoint.STATUS))
        assertEquals(0L, parseRetryAfterMs(null, "<html>busy</html>"))
        assertEquals(4_000L, parseRetryAfterMs(" 4 ", null))
    }

    @Test
    fun backoffDoublesToThirtySecondsAndRespectsTheHint() {
        val schedule = (1..6).map { activationRetryDelayMs(it, random = noJitter) }
        assertEquals(listOf(5_000L, 10_000L, 20_000L, 30_000L, 30_000L, 30_000L), schedule)
        assertEquals(45_000L, activationRetryDelayMs(1, retryAfterMs = 45_000L, random = noJitter))
        assertEquals(60_000L, activationRetryDelayMs(1, retryAfterMs = 10 * 60_000L, random = noJitter))
        val seeded = Random(42)
        repeat(50) {
            val delay = activationRetryDelayMs(2, random = seeded)
            assertTrue("$delay", delay in 8_000L..12_000L)
        }
    }

    @Test
    fun codeLifetimeComesFromTheRelativeTtl() {
        assertEquals(900_000L, activationTtlMs(900))
        assertEquals(900_000L, activationTtlMs(0))
        assertEquals(60_000L, activationTtlMs(5))
        assertEquals(3_600_000L, activationTtlMs(86_400))
    }

    @Test
    fun deadlineUsesTheMonotonicClockWithAGracePeriod() {
        assertFalse(activationDeadlinePassed(nowElapsed = 1_000_000L, expiresAtElapsed = 0L))
        assertFalse(activationDeadlinePassed(nowElapsed = 100_000L + ACTIVATION_EXPIRY_GRACE_MS - 1, expiresAtElapsed = 100_000L))
        assertTrue(activationDeadlinePassed(nowElapsed = 100_000L + ACTIVATION_EXPIRY_GRACE_MS, expiresAtElapsed = 100_000L))
    }

    @Test
    fun confirmedCodeWaitsForTheSourceUntilTheDeviceTokenExpires() {
        val session = DeviceActivationSession(
            deviceCode = "MO-ABCD",
            userCode = "MO-ABCD",
            verificationUrl = "https://moalfarras.space/activate?product=moplayer2",
            verificationUrlComplete = "https://moalfarras.space/activate?product=moplayer2&code=MO-ABCD",
            expiresAt = 5_000_000L,
            intervalSeconds = 5,
            expiresAtElapsed = 1_000L + 900_000L,
            sourceDeadlineElapsed = 1_000L + ACTIVATION_SOURCE_WINDOW_MS,
        )
        val confirmed = session.confirmedByPhone(nowElapsed = 601_000L, nowWallMs = 10_000_000L)
        assertEquals(session.sourceDeadlineElapsed, confirmed.expiresAtElapsed)
        assertEquals(10_000_000L + ACTIVATION_SOURCE_WINDOW_MS - 600_000L, confirmed.expiresAt)
        // A second confirmation keeps the deadline.
        assertSame(confirmed, confirmed.confirmedByPhone(nowElapsed = 700_000L, nowWallMs = 10_100_000L))
    }

    @Test
    fun oneTimeRequestAnswerReachesACallerCancelledMeanwhile() = runBlocking {
        val started = CompletableDeferred<Unit>()
        val release = CountDownLatch(1)
        var delivered = -1
        val caller = launch(Dispatchers.Default) {
            delivered = runToCompletion(Dispatchers.IO) {
                started.complete(Unit)
                release.await()
                42
            }
        }
        started.await()
        caller.cancel()
        release.countDown()
        caller.join()
        assertEquals(42, delivered)
    }

    @Test
    fun singleNonCancellableSwitchStillDropsTheAnswer() = runBlocking {
        // Documents why runToCompletion nests the dispatcher switch.
        val started = CompletableDeferred<Unit>()
        val release = CountDownLatch(1)
        var delivered = -1
        val caller = launch(Dispatchers.Default) {
            delivered = withContext(kotlinx.coroutines.NonCancellable + Dispatchers.IO) {
                started.complete(Unit)
                release.await()
                42
            }
        }
        started.await()
        caller.cancel()
        release.countDown()
        caller.join()
        assertEquals(-1, delivered)
    }
}
