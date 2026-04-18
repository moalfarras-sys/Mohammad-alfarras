package com.mo.moplayer.util

import android.content.Context
import android.util.Log
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.min
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Centralized error handling and retry logic for network operations. Provides exponential backoff,
 * error categorization, and user-friendly messages.
 */
@Singleton
class NetworkErrorHandler @Inject constructor(@ApplicationContext private val context: Context) {

    companion object {
        private const val TAG = "NetworkErrorHandler"
        private const val MAX_RETRY_ATTEMPTS = 3
        private const val INITIAL_DELAY_MS = 1000L
        private const val MAX_DELAY_MS = 30000L
        private const val BACKOFF_MULTIPLIER = 2.0
    }

    private val _connectionState = MutableStateFlow(ConnectionState.CONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    private val _lastError = MutableStateFlow<NetworkError?>(null)
    val lastError: StateFlow<NetworkError?> = _lastError.asStateFlow()

    enum class ConnectionState {
        CONNECTED,
        DISCONNECTED,
        RECONNECTING
    }

    sealed class NetworkError(
            open val message: String,
            open val isRetryable: Boolean,
            open val originalException: Throwable? = null
    ) {
        data class NoInternet(
                override val message: String = "No internet connection",
                override val originalException: Throwable? = null
        ) : NetworkError(message, true, originalException)

        data class Timeout(
                override val message: String = "Connection timed out",
                override val originalException: Throwable? = null
        ) : NetworkError(message, true, originalException)

        data class ServerError(
                val code: Int,
                override val message: String = "Server error",
                override val originalException: Throwable? = null
        ) : NetworkError(message, code in 500..599, originalException)

        data class StreamError(
                override val message: String = "Unable to play stream",
                override val originalException: Throwable? = null
        ) : NetworkError(message, true, originalException)

        data class AuthError(
                override val message: String = "Authentication failed",
                override val originalException: Throwable? = null
        ) : NetworkError(message, false, originalException)

        data class Unknown(
                override val message: String = "An error occurred",
                override val originalException: Throwable? = null
        ) : NetworkError(message, true, originalException)
    }

    /** Categorize an exception into a NetworkError */
    fun categorizeError(throwable: Throwable): NetworkError {
        return when (throwable) {
            is UnknownHostException ->
                    NetworkError.NoInternet(
                            "Unable to connect. Please check your internet connection.",
                            throwable
                    )
            is SocketTimeoutException ->
                    NetworkError.Timeout("Connection timed out. Please try again.", throwable)
            is IOException -> {
                val message = throwable.message?.lowercase() ?: ""
                when {
                    message.contains("stream") ->
                            NetworkError.StreamError(
                                    "Unable to play this stream. It may be offline or invalid.",
                                    throwable
                            )
                    message.contains("auth") || message.contains("401") ->
                            NetworkError.AuthError(
                                    "Authentication failed. Please check your credentials.",
                                    throwable
                            )
                    else ->
                            NetworkError.NoInternet(
                                    "Network error. Please check your connection.",
                                    throwable
                            )
                }
            }
            else ->
                    NetworkError.Unknown(
                            throwable.message ?: "An unexpected error occurred",
                            throwable
                    )
        }
    }

    /** Execute a network operation with automatic retry */
    suspend fun <T> executeWithRetry(
            maxAttempts: Int = MAX_RETRY_ATTEMPTS,
            initialDelay: Long = INITIAL_DELAY_MS,
            maxDelay: Long = MAX_DELAY_MS,
            onRetry: ((attempt: Int, error: NetworkError) -> Unit)? = null,
            block: suspend () -> T
    ): Result<T> {
        var currentDelay = initialDelay
        var lastError: NetworkError? = null

        repeat(maxAttempts) { attempt ->
            try {
                _connectionState.value =
                        if (attempt > 0) ConnectionState.RECONNECTING else ConnectionState.CONNECTED
                val result = block()
                _connectionState.value = ConnectionState.CONNECTED
                _lastError.value = null
                return Result.success(result)
            } catch (e: CancellationException) {
                throw e // Don't retry on cancellation
            } catch (e: Exception) {
                Log.w(TAG, "Attempt ${attempt + 1} failed: ${e.message}")
                lastError = categorizeError(e)
                _lastError.value = lastError

                if (lastError?.isRetryable == false) {
                    _connectionState.value = ConnectionState.DISCONNECTED
                    return Result.failure(e)
                }

                if (attempt < maxAttempts - 1) {
                    if (lastError != null) {
                        onRetry?.invoke(attempt + 1, lastError!!)
                    }
                    delay(currentDelay)
                    currentDelay = min((currentDelay * BACKOFF_MULTIPLIER).toLong(), maxDelay)
                }
            }
        }

        _connectionState.value = ConnectionState.DISCONNECTED
        return Result.failure(lastError?.originalException ?: Exception("Max retries exceeded"))
    }

    /** Simple retry wrapper for fire-and-forget operations */
    fun retryAsync(
            scope: CoroutineScope,
            dispatcher: CoroutineDispatcher = Dispatchers.IO,
            maxAttempts: Int = MAX_RETRY_ATTEMPTS,
            onError: ((NetworkError) -> Unit)? = null,
            block: suspend () -> Unit
    ) {
        scope.launch(dispatcher) {
            val result = executeWithRetry(maxAttempts = maxAttempts) { block() }
            result.onFailure { e ->
                val error = categorizeError(e)
                withContext(Dispatchers.Main) { onError?.invoke(error) }
            }
        }
    }

    /** Get user-friendly error message */
    fun getErrorMessage(error: NetworkError): String {
        return error.message
    }

    /** Get suggested action for the error */
    fun getSuggestedAction(error: NetworkError): String {
        return when (error) {
            is NetworkError.NoInternet -> "Check your internet connection and try again"
            is NetworkError.Timeout -> "The connection is slow. Try again later"
            is NetworkError.ServerError -> "The server is having issues. Try again later"
            is NetworkError.StreamError -> "Try a different stream or check if it's still available"
            is NetworkError.AuthError -> "Please login again with correct credentials"
            is NetworkError.Unknown -> "Please try again"
        }
    }

    /** Clear error state */
    fun clearError() {
        _lastError.value = null
        _connectionState.value = ConnectionState.CONNECTED
    }
}
