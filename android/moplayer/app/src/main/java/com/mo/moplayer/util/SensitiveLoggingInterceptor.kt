package com.mo.moplayer.util

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.HttpUrl

/**
 * Debug logger that masks sensitive query params and never logs headers/body.
 */
class SensitiveLoggingInterceptor : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val sanitizedUrl = sanitizeUrl(request.url)
        val startNs = System.nanoTime()
        Log.d("NetSafe", "--> ${request.method} $sanitizedUrl")

        val response = chain.proceed(request)
        val tookMs = (System.nanoTime() - startNs) / 1_000_000
        Log.d("NetSafe", "<-- ${response.code} $sanitizedUrl (${tookMs}ms)")
        return response
    }

    private fun sanitizeUrl(url: HttpUrl): String {
        if (url.querySize == 0) return url.toString()
        val hasSensitiveQuery = url.queryParameterNames.any { name ->
            name.equals("username", true) ||
                name.equals("password", true) ||
                name.equals("token", true)
        }
        val builder = url.newBuilder().query(null)
        if (hasSensitiveQuery) {
            builder.host("masked.local")
        }
        url.queryParameterNames.forEach { name ->
            val masked =
                if (name.equals("username", true) ||
                    name.equals("password", true) ||
                    name.equals("token", true)
                ) "****" else null
            val values = url.queryParameterValues(name)
            if (masked != null) {
                values.forEach { _ -> builder.addQueryParameter(name, masked) }
            } else {
                values.forEach { value -> builder.addQueryParameter(name, value) }
            }
        }
        return builder.build().toString()
    }
}
