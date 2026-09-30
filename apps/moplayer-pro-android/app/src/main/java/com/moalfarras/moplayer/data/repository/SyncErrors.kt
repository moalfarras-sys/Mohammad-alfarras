package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.data.parser.JsonStreamSyntaxException
import com.moalfarras.moplayer.ui.i18n.I18n
import com.moalfarras.moplayer.ui.i18n.sync
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.SerializationException
import retrofit2.HttpException
import java.io.EOFException
import java.io.InterruptedIOException
import java.net.ConnectException
import java.net.MalformedURLException
import java.net.NoRouteToHostException
import java.net.PortUnreachableException
import java.net.ProtocolException
import java.net.SocketException
import java.net.UnknownHostException
import java.net.UnknownServiceException
import javax.net.ssl.SSLException
import kotlin.random.Random

/** What went wrong during a provider sync, in terms a viewer can act on. */
enum class SyncErrorKind {
    INVALID_CREDENTIALS,
    ACCOUNT_EXPIRED,
    ACCOUNT_DISABLED,
    TOO_MANY_CONNECTIONS,
    ACCESS_DENIED,
    RATE_LIMITED,
    HOST_NOT_FOUND,
    SERVER_UNREACHABLE,
    TIMEOUT,
    CONNECTION_LOST,
    TLS,
    SERVER_ERROR,
    NOT_IPTV_API,
    INVALID_PLAYLIST,
    EMPTY_LIBRARY,
    UNKNOWN,
    ;

    /** The provider rejected the account itself; retrying or switching http/https cannot help. */
    val isAccountRejection: Boolean
        get() = this == INVALID_CREDENTIALS || this == ACCOUNT_EXPIRED || this == ACCOUNT_DISABLED

    /** Failures of the transport, where the http/https alternate address may still work. */
    val isTransport: Boolean
        get() = this == SERVER_UNREACHABLE || this == TIMEOUT || this == CONNECTION_LOST || this == TLS || this == UNKNOWN

    /** How much a failure tells the user; used to keep the most meaningful one across candidates. */
    internal val specificity: Int
        get() = when (this) {
            INVALID_CREDENTIALS, ACCOUNT_EXPIRED, ACCOUNT_DISABLED, TOO_MANY_CONNECTIONS -> 6
            ACCESS_DENIED, RATE_LIMITED, NOT_IPTV_API, INVALID_PLAYLIST, EMPTY_LIBRARY, SERVER_ERROR -> 5
            TIMEOUT, SERVER_UNREACHABLE, CONNECTION_LOST -> 4
            HOST_NOT_FOUND -> 3
            TLS -> 2
            UNKNOWN -> 1
        }
}

/** Which kind of request failed; decides how an HTTP 404 or a parse error is explained. */
enum class SyncTarget { XTREAM_API, PLAYLIST, EPG }

/**
 * A classified sync failure. [message] is the localized, human sentence for the current app
 * language (resolved when read, so a language switch re-renders it); [kind] lets the UI pick its
 * own copy, and [ackCode] is a stable, non-sensitive code for the activation acknowledgement.
 * [detail] is sanitized technical text for diagnostics only; it never contains credentials.
 */
class SyncException(
    val kind: SyncErrorKind,
    val host: String = "",
    val httpCode: Int = 0,
    val expiresAt: Long = 0L,
    val detail: String = "",
    cause: Throwable? = null,
) : IllegalStateException(detail, cause) {
    override val message: String
        get() = I18n.strings.sync.errorMessage(kind, host, httpCode)

    val ackCode: String get() = kind.name.lowercase()
}

/** The server row disappeared (logout or delete) while a sync of it was still running. */
internal class ServerRemovedException : IllegalStateException("Server was removed during sync")

internal object SyncFailures {
    private const val RETRY_AFTER_CAP_MS = 8_000L
    private const val JITTER_MS = 500L

    /** Maps any failure to a [SyncException]; an existing one is returned unchanged. */
    fun classify(throwable: Throwable, host: String, target: SyncTarget = SyncTarget.XTREAM_API): SyncException {
        if (throwable is SyncException) return throwable
        val detail = sanitize(throwable.message)
        val kind = kindOf(throwable, target)
        val code = httpCodeOf(throwable)
        return SyncException(kind = kind, host = host, httpCode = code, detail = detail, cause = throwable)
    }

    private fun kindOf(throwable: Throwable, target: SyncTarget): SyncErrorKind {
        throwable.causes().forEach { cause ->
            when (cause) {
                is SyncException -> return cause.kind
                is UnknownHostException -> return SyncErrorKind.HOST_NOT_FOUND
                is SSLException -> return SyncErrorKind.TLS
                is ConnectException, is NoRouteToHostException, is PortUnreachableException ->
                    return SyncErrorKind.SERVER_UNREACHABLE
                is InterruptedIOException -> return SyncErrorKind.TIMEOUT
                is HttpException -> return httpKind(cause.code(), target)
                is JsonStreamSyntaxException, is SerializationException ->
                    return if (target == SyncTarget.PLAYLIST) SyncErrorKind.INVALID_PLAYLIST else SyncErrorKind.NOT_IPTV_API
                is EOFException, is SocketException -> return SyncErrorKind.CONNECTION_LOST
                is ProtocolException -> if (cause.message.orEmpty().contains("unexpected end of stream", true)) {
                    return SyncErrorKind.CONNECTION_LOST
                }
            }
            if (cause.javaClass.name.endsWith("StreamResetException")) return SyncErrorKind.CONNECTION_LOST
        }
        val text = throwable.message.orEmpty()
        return when {
            text.contains("max connection", ignoreCase = true) ||
                text.contains("maximum connection", ignoreCase = true) -> SyncErrorKind.TOO_MANY_CONNECTIONS
            text.contains("unexpected end of stream", ignoreCase = true) -> SyncErrorKind.CONNECTION_LOST
            else -> SyncErrorKind.UNKNOWN
        }
    }

    fun httpKind(code: Int, target: SyncTarget): SyncErrorKind = when (code) {
        401 -> if (target == SyncTarget.XTREAM_API) SyncErrorKind.INVALID_CREDENTIALS else SyncErrorKind.ACCESS_DENIED
        403, 451, 884 -> SyncErrorKind.ACCESS_DENIED
        404, 405, 410 -> if (target == SyncTarget.XTREAM_API) SyncErrorKind.NOT_IPTV_API else SyncErrorKind.INVALID_PLAYLIST
        408, 504, 522, 524 -> SyncErrorKind.TIMEOUT
        429 -> SyncErrorKind.RATE_LIMITED
        509 -> SyncErrorKind.TOO_MANY_CONNECTIONS
        in 500..599 -> SyncErrorKind.SERVER_ERROR
        else -> if (target == SyncTarget.XTREAM_API) SyncErrorKind.NOT_IPTV_API else SyncErrorKind.SERVER_ERROR
    }

    private fun httpCodeOf(throwable: Throwable): Int =
        throwable.causes().filterIsInstance<HttpException>().firstOrNull()?.code() ?: 0

    /**
     * Returns how long to wait before retrying [throwable], or null when a retry cannot help
     * (auth or account rejection, DNS, TLS, 4xx, a web page instead of JSON, cancellation).
     * Transient failures are timeouts, refused or reset connections, bodies cut off mid-way,
     * HTTP 408/425/429/5xx and Cloudflare 520-524. `Retry-After` (seconds form) is honoured,
     * capped so a hostile value cannot stall the sync.
     */
    fun retryDelayMs(throwable: Throwable, attempt: Int, baseDelayMs: Long, random: Random = Random.Default): Long? {
        val backoff = baseDelayMs * (attempt + 1) + random.nextLong(JITTER_MS)
        throwable.causes().forEach { cause ->
            when (cause) {
                is CancellationException -> return null
                is SyncException -> if (cause.kind.isAccountRejection) return null
                is ServerRemovedException -> return null
                is UnknownHostException, is SSLException, is UnknownServiceException, is MalformedURLException -> return null
                is JsonStreamSyntaxException, is SerializationException -> return null
                is HttpException -> return retryDelayForHttp(cause, backoff)
                is InterruptedIOException, is ConnectException, is NoRouteToHostException,
                is SocketException, is EOFException -> return backoff
                is ProtocolException -> return if (cause.message.orEmpty().contains("unexpected end of stream", true)) backoff else null
            }
            if (cause.javaClass.name.endsWith("StreamResetException")) return backoff
            if (cause.message.orEmpty().startsWith("unexpected end of stream", ignoreCase = true)) return backoff
        }
        return null
    }

    private fun retryDelayForHttp(exception: HttpException, backoff: Long): Long? {
        val code = exception.code()
        val retryable = code == 408 || code == 425 || code == 429 || code in 500..504 || code in 520..524
        if (!retryable) return null
        if (code == 429 || code == 503) {
            val retryAfter = exception.response()?.headers()?.get("Retry-After")?.trim()?.toLongOrNull()
            if (retryAfter != null && retryAfter >= 0) return (retryAfter * 1000L).coerceAtMost(RETRY_AFTER_CAP_MS)
        }
        return backoff
    }

    /**
     * Picks which of two failures to report. The primary candidate (the address the user saved)
     * wins unless it only failed at the transport level and the alternate got further, e.g. the
     * https probe of an http panel fails its TLS handshake but must not hide "account expired".
     */
    fun prefer(primary: SyncException?, next: SyncException): SyncException {
        if (primary == null) return next
        if (next.kind.isAccountRejection && !primary.kind.isAccountRejection) return next
        if (primary.kind.isTransport && next.kind.specificity > primary.kind.specificity) return next
        return primary
    }

    /** Masks credentials that may appear in URLs inside exception messages. */
    fun sanitize(message: String?): String = message.orEmpty()
        .replace(CREDENTIAL_QUERY, "$1=***")
        .replace(CREDENTIAL_PATH, "/$1/***/***/")
        .take(300)

    private val CREDENTIAL_QUERY = Regex("(?i)(username|password|token)=[^&\\s]+")
    private val CREDENTIAL_PATH = Regex("/(live|movie|series|timeshift)/[^/\\s]+/[^/\\s]+/")

    private fun Throwable.causes(): Sequence<Throwable> = generateSequence(this) { current ->
        current.cause?.takeIf { it !== current }
    }.take(12)
}
