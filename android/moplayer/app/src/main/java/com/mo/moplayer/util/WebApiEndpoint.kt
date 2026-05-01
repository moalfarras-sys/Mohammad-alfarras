package com.mo.moplayer.util

import com.mo.moplayer.BuildConfig

object WebApiEndpoint {
    private const val VERCEL_FALLBACK_BASE_URL = "https://mohammad-alfarras.vercel.app"

    val primaryBaseUrl: String
        get() = BuildConfig.WEB_API_BASE_URL.trimEnd('/')

    fun candidateUrls(pathAndQuery: String): List<String> {
        val normalizedPath = if (pathAndQuery.startsWith("/")) pathAndQuery else "/$pathAndQuery"
        return listOf(
            "$primaryBaseUrl$normalizedPath",
            "$VERCEL_FALLBACK_BASE_URL$normalizedPath"
        ).distinct()
    }
}
