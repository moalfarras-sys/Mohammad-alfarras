package com.moalfarras.moplayer.data.repository

/**
 * The list CH+/CH- walks through in the player: the list the viewer started the channel from.
 * Loaded once per player session (see IptvRepository.liveZapKeys) so history and favorite writes
 * during playback cannot reorder it.
 */
sealed interface LiveZapScope {
    /** One live category (the selected Live group, or the playing channel's own group). */
    data class Category(val categoryId: String) : LiveZapScope

    /** Every live channel of the library ("All channels" in Live TV, or uncategorized playlists). */
    data object AllChannels : LiveZapScope

    /** The live favorites, in the Favorites screen order. */
    data object Favorites : LiveZapScope

    /** The live results of a committed search, in result order. */
    data class Search(val query: String) : LiveZapScope
}

/** Identity of a channel in a zap list (merged libraries mix sources, so the source is part of it). */
data class LiveZapKey(val serverId: Long, val id: String)

/** Rows per `id IN (…)` query; stays far below SQLite's 999 bound variables on old Android. */
internal const val LIVE_ZAP_ROW_CHUNK = 400
