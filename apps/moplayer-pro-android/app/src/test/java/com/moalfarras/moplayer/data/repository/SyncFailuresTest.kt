package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.data.parser.JsonStreamSyntaxException
import com.moalfarras.moplayer.ui.i18n.ArSyncStrings
import com.moalfarras.moplayer.ui.i18n.EnSyncStrings
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response
import java.io.EOFException
import java.io.IOException
import java.net.ConnectException
import java.net.ProtocolException
import java.net.SocketException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.net.ssl.SSLHandshakeException
import kotlin.random.Random

class SyncFailuresTest {
    private fun http(code: Int, retryAfter: String? = null): HttpException {
        val raw = okhttp3.Response.Builder()
            .request(Request.Builder().url("http://panel.example/player_api.php").build())
            .protocol(Protocol.HTTP_1_1)
            .code(code)
            .message("HTTP $code")
            .apply { if (retryAfter != null) header("Retry-After", retryAfter) }
            .build()
        return HttpException(Response.error<Any>("".toResponseBody(), raw))
    }

    private fun kind(throwable: Throwable, target: SyncTarget = SyncTarget.XTREAM_API) =
        SyncFailures.classify(throwable, "panel.example", target).kind

    @Test
    fun classifiesTransportFailures() {
        assertEquals(SyncErrorKind.HOST_NOT_FOUND, kind(UnknownHostException("Unable to resolve host")))
        assertEquals(SyncErrorKind.TIMEOUT, kind(SocketTimeoutException("timeout")))
        assertEquals(SyncErrorKind.SERVER_UNREACHABLE, kind(ConnectException("Failed to connect")))
        assertEquals(SyncErrorKind.TLS, kind(SSLHandshakeException("handshake failed")))
        assertEquals(SyncErrorKind.CONNECTION_LOST, kind(SocketException("Connection reset")))
        assertEquals(SyncErrorKind.CONNECTION_LOST, kind(EOFException("\\n not found")))
        assertEquals(SyncErrorKind.CONNECTION_LOST, kind(ProtocolException("unexpected end of stream")))
        assertEquals(SyncErrorKind.TIMEOUT, kind(IllegalStateException("wrapped", SocketTimeoutException("read timed out"))))
    }

    @Test
    fun classifiesHttpAndContentFailures() {
        assertEquals(SyncErrorKind.NOT_IPTV_API, kind(http(404)))
        assertEquals(SyncErrorKind.INVALID_PLAYLIST, kind(http(404), SyncTarget.PLAYLIST))
        assertEquals(SyncErrorKind.INVALID_CREDENTIALS, kind(http(401)))
        assertEquals(SyncErrorKind.ACCESS_DENIED, kind(http(403)))
        assertEquals(SyncErrorKind.RATE_LIMITED, kind(http(429)))
        assertEquals(SyncErrorKind.TOO_MANY_CONNECTIONS, kind(http(509)))
        assertEquals(SyncErrorKind.SERVER_ERROR, kind(http(502)))
        assertEquals(SyncErrorKind.TIMEOUT, kind(http(524)))
        assertEquals(SyncErrorKind.NOT_IPTV_API, kind(JsonStreamSyntaxException("html", looksLikeHtml = true)))
        assertEquals(SyncErrorKind.INVALID_PLAYLIST, kind(JsonStreamSyntaxException("bad"), SyncTarget.PLAYLIST))
        assertEquals(502, SyncFailures.classify(http(502), "h").httpCode)
    }

    @Test
    fun retriesOnlyTransientFailures() {
        val noJitter = Random(1)
        fun delay(throwable: Throwable, attempt: Int = 0) = SyncFailures.retryDelayMs(throwable, attempt, 1_000L, noJitter)

        assertNotNull(delay(SocketTimeoutException("timeout")))
        assertNotNull(delay(SocketException("Connection reset")))
        assertNotNull(delay(EOFException()))
        assertNotNull(delay(ProtocolException("unexpected end of stream")))
        assertNotNull(delay(IOException("unexpected end of stream on http://panel.example/...")))
        assertNotNull(delay(http(502)))
        assertNotNull(delay(http(520)))
        assertNotNull(delay(http(429)))

        assertNull(delay(UnknownHostException("nope")))
        assertNull(delay(SSLHandshakeException("bad cert")))
        assertNull(delay(http(401)))
        assertNull(delay(http(403)))
        assertNull(delay(http(404)))
        assertNull(delay(ProtocolException("Too many follow-up requests: 21")))
        assertNull(delay(JsonStreamSyntaxException("html", looksLikeHtml = true)))
        assertNull(delay(SyncException(SyncErrorKind.ACCOUNT_EXPIRED)))
        assertNull(delay(kotlinx.coroutines.CancellationException("cancelled")))
    }

    @Test
    fun honoursRetryAfterWithACap() {
        assertEquals(2_000L, SyncFailures.retryDelayMs(http(503, retryAfter = "2"), 0, 1_000L))
        assertEquals(8_000L, SyncFailures.retryDelayMs(http(429, retryAfter = "3600"), 0, 1_000L))
        val backoff = SyncFailures.retryDelayMs(SocketTimeoutException(), attempt = 1, baseDelayMs = 1_000L)!!
        assertTrue(backoff in 2_000L until 2_500L)
    }

    @Test
    fun keepsTheMeaningfulFailureAcrossAddressCandidates() {
        val expired = SyncException(SyncErrorKind.ACCOUNT_EXPIRED)
        val tls = SyncException(SyncErrorKind.TLS)
        val timeout = SyncException(SyncErrorKind.TIMEOUT)

        assertEquals(expired, SyncFailures.prefer(tls, expired))
        assertEquals(expired, SyncFailures.prefer(expired, tls))
        assertEquals(timeout, SyncFailures.prefer(timeout, tls))
        assertEquals(timeout, SyncFailures.prefer(tls, timeout))
        assertEquals(tls, SyncFailures.prefer(null, tls))
        assertTrue(expired.kind.isAccountRejection)
        assertFalse(timeout.kind.isAccountRejection)
    }

    @Test
    fun sanitizeMasksCredentials() {
        val clean = SyncFailures.sanitize(
            "failed http://p.example/player_api.php?username=bob&password=secret and /live/bob/secret/12.ts",
        )
        assertFalse(clean.contains("secret"))
        assertFalse(clean.contains("bob"))
    }

    @Test
    fun messagesAreLocalizedAndKeepHostsReadable() {
        val en = EnSyncStrings.errorMessage(SyncErrorKind.HOST_NOT_FOUND, "panel.example")
        val ar = ArSyncStrings.errorMessage(SyncErrorKind.HOST_NOT_FOUND, "panel.example")
        assertTrue(en.contains("\u2066panel.example\u2069"))
        assertTrue(ar.contains("\u2066panel.example\u2069"))
        assertTrue(ar.contains("تعذّر"))
        assertTrue(EnSyncStrings.errorMessage(SyncErrorKind.ACCESS_DENIED, httpCode = 403).contains("HTTP 403"))
        SyncErrorKind.entries.forEach { kind ->
            assertTrue(EnSyncStrings.errorMessage(kind).isNotBlank())
            assertTrue(ArSyncStrings.errorMessage(kind).isNotBlank())
        }
        assertEquals("Loading movies · \u20661,234\u2069", EnSyncStrings.withCount(EnSyncStrings.loadingMovies, 1_234))
        assertEquals(EnSyncStrings.loadingMovies, EnSyncStrings.withCount(EnSyncStrings.loadingMovies, 0))
    }
}
