package com.mo.moplayer.data.repository

enum class SyncMode {
    FULL,
    DELTA,
    EPG_ONLY
}

enum class ServerScope {
    ACTIVE,
    ALL
}

enum class UnifiedContentType {
    CHANNEL,
    MOVIE,
    SERIES,
    EPISODE,
    FAVORITE,
    HISTORY
}

data class UnifiedSearchFilters(
    val includeLive: Boolean = true,
    val includeMovies: Boolean = true,
    val includeSeries: Boolean = true,
    val includeEpisodes: Boolean = true,
    val includeFavorites: Boolean = true,
    val includeHistory: Boolean = true
)

data class UnifiedSearchHit(
    val serverId: Long,
    val contentType: UnifiedContentType,
    val contentId: String,
    val title: String,
    val subtitle: String? = null,
    val posterUrl: String? = null,
    val streamUrl: String? = null
)

data class PlayableRef(
    val type: UnifiedContentType,
    val contentId: String,
    val streamUrl: String,
    val title: String,
    val posterUrl: String? = null,
    val extras: Map<String, String> = emptyMap()
)
