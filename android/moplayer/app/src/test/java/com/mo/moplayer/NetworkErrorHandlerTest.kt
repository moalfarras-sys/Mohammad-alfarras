package com.mo.moplayer

import com.mo.moplayer.util.NetworkErrorHandler
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

/**
 * Unit tests for NetworkErrorHandler.
 */
class NetworkErrorHandlerTest {

    private lateinit var networkErrorHandler: NetworkErrorHandler

    @Before
    fun setup() {
        networkErrorHandler = NetworkErrorHandler(mockk(relaxed = true))
    }

    @Test
    fun `categorizeError returns NoInternet for UnknownHostException`() {
        val error = networkErrorHandler.categorizeError(UnknownHostException("Unable to resolve host"))
        
        assertTrue(error is NetworkErrorHandler.NetworkError.NoInternet)
        assertTrue(error.isRetryable)
    }

    @Test
    fun `categorizeError returns Timeout for SocketTimeoutException`() {
        val error = networkErrorHandler.categorizeError(SocketTimeoutException("Read timed out"))
        
        assertTrue(error is NetworkErrorHandler.NetworkError.Timeout)
        assertTrue(error.isRetryable)
    }

    @Test
    fun `categorizeError returns AuthError for auth-related IOException`() {
        val error = networkErrorHandler.categorizeError(IOException("Authentication failed"))
        
        assertTrue(error is NetworkErrorHandler.NetworkError.AuthError)
        assertFalse(error.isRetryable)
    }

    @Test
    fun `categorizeError returns StreamError for stream-related IOException`() {
        val error = networkErrorHandler.categorizeError(IOException("Stream error occurred"))
        
        assertTrue(error is NetworkErrorHandler.NetworkError.StreamError)
        assertTrue(error.isRetryable)
    }

    @Test
    fun `categorizeError returns Unknown for generic Exception`() {
        val exception = RuntimeException("Unexpected error")
        val error = networkErrorHandler.categorizeError(exception)
        
        assertTrue(error is NetworkErrorHandler.NetworkError.Unknown)
        assertTrue(error.isRetryable)
    }

    @Test
    fun `getErrorMessage returns error message`() {
        val error = NetworkErrorHandler.NetworkError.NoInternet("No connection")
        assertEquals("No connection", networkErrorHandler.getErrorMessage(error))
    }

    @Test
    fun `getSuggestedAction returns correct action for NoInternet`() {
        val error = NetworkErrorHandler.NetworkError.NoInternet()
        assertEquals(
            "Check your internet connection and try again",
            networkErrorHandler.getSuggestedAction(error)
        )
    }

    @Test
    fun `clearError resets error state`() = runTest {
        networkErrorHandler.clearError()
        val state = networkErrorHandler.connectionState.first()
        assertEquals(NetworkErrorHandler.ConnectionState.CONNECTED, state)
    }
}
