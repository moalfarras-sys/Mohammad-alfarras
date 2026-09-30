package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.domain.model.ActivatedProfile
import com.moalfarras.moplayer.domain.model.DeviceActivationSession
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.HttpException
import java.io.IOException
import kotlin.coroutines.CoroutineContext
import kotlin.random.Random

/** Which moalfarras.space activation route answered. */
enum class ActivationEndpoint { CREATE, STATUS, SOURCE }

/** Why a QR code can no longer deliver a source; each asks the viewer to scan the new code. */
enum class ActivationExpiry {
    /** The code itself expired or is unknown (HTTP 404/410, or status "expired"). */
    CODE_EXPIRED,

    /** The device token that pulls the source was rejected (HTTP 401 from /source). */
    TOKEN_REJECTED,
}

/** One poll of a QR activation. Transport problems are [Transient]: the same code keeps polling. */
sealed interface ActivationPollResult {
    /** Still waiting for the phone; [session] may carry an extended deadline once the code was confirmed. */
    data class Waiting(val session: DeviceActivationSession) : ActivationPollResult

    /** The phone sent a source and this device pulled it (the server removed its copy). */
    data class SourceReady(val session: DeviceActivationSession, val profile: ActivatedProfile) : ActivationPollResult

    data class Expired(val reason: ActivationExpiry) : ActivationPollResult

    /** The server refused the code for good (malformed, wrong product, …). */
    data class Invalid(val httpCode: Int) : ActivationPollResult

    /** Network, timeout, 408/425/429/5xx: back off and poll the same code again. */
    data class Transient(val retryAfterMs: Long = 0L) : ActivationPollResult
}

/** Local countdown window of a new code when the server sends no usable TTL. */
internal const val ACTIVATION_DEFAULT_TTL_SECONDS = 900

/**
 * After the phone confirms the code, the source can still arrive until the device token expires
 * (45 min after the code was created on the server); one minute is kept as a safety margin.
 */
internal const val ACTIVATION_SOURCE_WINDOW_MS = 44L * 60L * 1000L

/** A code is only given up locally this long after its deadline; the server's 410 is the authority. */
internal const val ACTIVATION_EXPIRY_GRACE_MS = 30_000L

private const val ACTIVATION_BACKOFF_BASE_MS = 5_000L
private const val ACTIVATION_BACKOFF_CAP_MS = 30_000L
private const val ACTIVATION_RETRY_AFTER_CAP_MS = 60_000L
private const val ACTIVATION_JITTER = 0.2

/** Code lifetime in ms from the server's relative TTL, bounded to 1..60 minutes. */
internal fun activationTtlMs(ttlSeconds: Int): Long =
    (if (ttlSeconds > 0) ttlSeconds else ACTIVATION_DEFAULT_TTL_SECONDS).coerceIn(60, 3_600) * 1000L

/**
 * Deadline check on the monotonic clock (SystemClock.elapsedRealtime), so a TV whose wall clock is
 * wrong by minutes or hours can still use its code. A session without an elapsed deadline never
 * expires locally.
 */
internal fun activationDeadlinePassed(nowElapsed: Long, expiresAtElapsed: Long): Boolean =
    expiresAtElapsed > 0L && nowElapsed >= expiresAtElapsed + ACTIVATION_EXPIRY_GRACE_MS

/**
 * The phone confirmed the code: the source may now arrive after the code's own 15 minutes, until
 * the device token expires. Both the local countdown (wall clock, for display) and the elapsed
 * deadline move to that point; a deadline that is already later is kept.
 */
internal fun DeviceActivationSession.confirmedByPhone(nowElapsed: Long, nowWallMs: Long): DeviceActivationSession {
    if (sourceDeadlineElapsed <= expiresAtElapsed) return this
    val remaining = (sourceDeadlineElapsed - nowElapsed).coerceAtLeast(0L)
    return copy(expiresAtElapsed = sourceDeadlineElapsed, expiresAt = nowWallMs + remaining)
}

/**
 * Maps an HTTP error of the activation API: 404/410 mean the code is gone, 401 from /source means
 * the device token was rejected, 408/425/429/5xx are temporary, anything else is a hard refusal.
 */
internal fun activationHttpOutcome(code: Int, endpoint: ActivationEndpoint, retryAfterMs: Long = 0L): ActivationPollResult = when {
    code == 408 || code == 425 || code == 429 || code in 500..599 -> ActivationPollResult.Transient(retryAfterMs)
    code == 404 || code == 410 -> ActivationPollResult.Expired(ActivationExpiry.CODE_EXPIRED)
    code == 401 && endpoint == ActivationEndpoint.SOURCE -> ActivationPollResult.Expired(ActivationExpiry.TOKEN_REJECTED)
    code == 401 -> ActivationPollResult.Expired(ActivationExpiry.CODE_EXPIRED)
    else -> ActivationPollResult.Invalid(code)
}

/** Classifies any failure of an activation call; unknown failures are treated as temporary. */
internal fun activationFailureOutcome(throwable: Throwable, endpoint: ActivationEndpoint): ActivationPollResult = when (throwable) {
    is HttpException -> activationHttpOutcome(throwable.code(), endpoint, retryAfterMsOf(throwable))
    else -> ActivationPollResult.Transient()
}

/** True when retrying the same activation request can help (network, timeouts, 408/425/429/5xx, captive-portal bodies). */
internal fun isTransientActivationFailure(throwable: Throwable): Boolean = when (throwable) {
    is HttpException -> activationHttpOutcome(throwable.code(), ActivationEndpoint.CREATE) is ActivationPollResult.Transient
    is IOException, is SerializationException -> true
    else -> false
}

/**
 * Wait before the next attempt after [failures] consecutive transient failures: 5, 10, 20, then 30 s
 * (cap), with ±20% jitter so many TVs behind one NAT do not poll in lockstep. A server hint
 * ([retryAfterMs], from a 429) wins when it is longer, capped at one minute.
 */
internal fun activationRetryDelayMs(failures: Int, retryAfterMs: Long = 0L, random: Random = Random.Default): Long {
    val step = (failures - 1).coerceIn(0, 3)
    val base = (ACTIVATION_BACKOFF_BASE_MS shl step).coerceAtMost(ACTIVATION_BACKOFF_CAP_MS)
    val jitter = 1.0 + (random.nextDouble() * 2.0 - 1.0) * ACTIVATION_JITTER
    val backoff = (base * jitter).toLong()
    return maxOf(backoff, retryAfterMs.coerceAtMost(ACTIVATION_RETRY_AFTER_CAP_MS))
}

/**
 * Runs [block] on [context] and hands its result back even when the caller is cancelled
 * meanwhile, for a request whose answer cannot be asked for again (the one-time QR source).
 * The dispatcher switch is nested inside NonCancellable on purpose: a single
 * `withContext(NonCancellable + dispatcher)` still drops the result on its way back to a
 * cancelled caller.
 */
internal suspend fun <T> runToCompletion(context: CoroutineContext, block: suspend CoroutineScope.() -> T): T =
    withContext(NonCancellable) { withContext(context, block) }

/** The server's retry hint: a `Retry-After` header in seconds, else `retryAfterSeconds` in the JSON body. */
internal fun parseRetryAfterMs(header: String?, body: String?): Long {
    header?.trim()?.toLongOrNull()?.takeIf { it >= 0 }?.let { return it * 1000L }
    if (body.isNullOrBlank()) return 0L
    val seconds = runCatching {
        (Json.parseToJsonElement(body) as? JsonObject)?.get("retryAfterSeconds")?.jsonPrimitive?.intOrNull
    }.getOrNull() ?: return 0L
    return seconds.coerceAtLeast(0) * 1000L
}

private fun retryAfterMsOf(exception: HttpException): Long {
    if (exception.code() != 429 && exception.code() != 503) return 0L
    val response = exception.response() ?: return 0L
    val body = runCatching { response.errorBody()?.string() }.getOrNull()
    return parseRetryAfterMs(response.headers()["Retry-After"], body)
}
