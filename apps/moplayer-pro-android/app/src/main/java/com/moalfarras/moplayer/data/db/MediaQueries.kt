package com.moalfarras.moplayer.data.db

import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.SortOption

/** SQL text plus its bind arguments, built from a whitelist so nothing user-typed reaches the SQL text. */
internal data class MediaSql(val sql: String, val args: List<Any>)

/** A channel of a player zap list: its key plus the text the parental filter checks. */
data class LiveZapKeyRow(
    val serverId: Long,
    val id: String,
    val title: String,
    val categoryId: String,
    val categoryName: String,
    val description: String,
)

/**
 * Builders for the library queries whose ORDER BY depends on the user's sort option.
 *
 * Every query filters with `serverId = ?` for one source, or `serverId IN (SELECT id FROM servers)`
 * for the merged library, so SQLite can seek the (serverId, type, …) composite indices instead of
 * scanning the table. The previous `(:serverId <= 0 OR serverId = :serverId)` guard and the
 * parameter-dependent CASE ORDER BY defeated every index and re-sorted the whole section on each
 * page. The default SERVER_ORDER sort ends with `rowid` (insertion order), which the
 * (serverId, type, serverOrder) and (serverId, type, categoryId, serverOrder) indices already hold,
 * so the default grids page without a sort step.
 */
internal object MediaQueries {
    const val SEARCH_RESULT_LIMIT = 500

    const val ZAP_KEY_COLUMNS = "media.serverId AS serverId, media.id AS id, media.title AS title, " +
        "media.categoryId AS categoryId, media.categoryName AS categoryName, media.description AS description"

    const val ROW_COLUMNS = "media.id AS id, media.serverId AS serverId, media.type AS type, " +
        "media.categoryId AS categoryId, media.categoryName AS categoryName, media.title AS title, " +
        "media.streamUrl AS streamUrl, media.posterUrl AS posterUrl, media.backdropUrl AS backdropUrl, " +
        "media.description AS description, media.rating AS rating, media.durationSecs AS durationSecs, " +
        "media.addedAt AS addedAt, media.lastModifiedAt AS lastModifiedAt, " +
        "media.addedAtUnknown AS addedAtUnknown, media.serverOrder AS serverOrder, " +
        "media.containerExtension AS containerExtension, media.seriesId AS seriesId, " +
        "media.seasonNumber AS seasonNumber, media.episodeNumber AS episodeNumber, " +
        "media.isFavorite AS isFavorite, media.watchPositionMs AS watchPositionMs, " +
        "media.watchDurationMs AS watchDurationMs, media.lastPlayedAt AS lastPlayedAt, " +
        "media.tvgId AS tvgId, media.catchup AS catchup, media.genre AS genre, media.releaseDate AS releaseDate"

    fun sortOptionOf(name: String): SortOption =
        SortOption.entries.firstOrNull { it.name == name } ?: SortOption.SERVER_ORDER

    fun byType(serverId: Long, type: ContentType, sort: SortOption, hideNoLogo: Boolean): MediaSql {
        val args = mutableListOf<Any>()
        val where = buildString {
            append(serverFilter(serverId, args))
            append(" AND media.type = ?")
            args += type.name
            if (hideNoLogo) append(" AND media.posterUrl != ''")
        }
        return MediaSql("SELECT $ROW_COLUMNS FROM media WHERE $where ORDER BY ${orderBy(sort, serverId)}", args)
    }

    fun byCategory(serverId: Long, type: ContentType, categoryId: String, sort: SortOption, hideNoLogo: Boolean): MediaSql {
        val args = mutableListOf<Any>()
        val where = buildString {
            append(serverFilter(serverId, args))
            append(" AND media.type = ? AND media.categoryId = ?")
            args += type.name
            args += categoryId
            if (hideNoLogo) append(" AND media.posterUrl != ''")
        }
        return MediaSql("SELECT $ROW_COLUMNS FROM media WHERE $where ORDER BY ${orderBy(sort, serverId, inCategory = true)}", args)
    }

    /**
     * Ordered keys of a player zap list: one live category ([categoryId]), every live channel
     * (blank), or the live favorites ([favoritesOnly], in the Favorites screen order). There is no
     * row cap: the rows only carry the key plus the text the parental filter checks, and the player
     * loads full rows for a window around the playing channel with [liveRowsByIds]. The order is
     * the one the list on screen uses; the caller reads it once per player session, so history
     * written while zapping cannot reorder it.
     */
    fun liveZapKeys(serverId: Long, categoryId: String, favoritesOnly: Boolean, sort: SortOption, hideNoLogo: Boolean): MediaSql {
        val args = mutableListOf<Any>()
        val where = buildString {
            append(serverFilter(serverId, args))
            append(" AND media.type = ?")
            args += ContentType.LIVE.name
            if (categoryId.isNotEmpty()) {
                append(" AND media.categoryId = ?")
                args += categoryId
            }
            if (favoritesOnly) append(" AND media.isFavorite = 1")
            if (hideNoLogo) append(" AND media.posterUrl != ''")
        }
        val order = if (favoritesOnly) "media.updatedAt DESC, media.rowid" else orderBy(sort, serverId, categoryId.isNotEmpty())
        return MediaSql("SELECT $ZAP_KEY_COLUMNS FROM media WHERE $where ORDER BY $order", args)
    }

    /** Full rows of one source's live channels by id; callers keep [ids] well below 999 variables. */
    fun liveRowsByIds(serverId: Long, ids: List<String>): MediaSql {
        val placeholders = ids.joinToString(",") { "?" }
        return MediaSql(
            "SELECT $ROW_COLUMNS FROM media WHERE media.serverId = ? AND media.type = ? AND media.id IN ($placeholders)",
            listOf<Any>(serverId, ContentType.LIVE.name) + ids,
        )
    }

    /**
     * Ranked search over `media_search`, capped at [SEARCH_RESULT_LIMIT] rows.
     *
     * Candidates come from the FTS4 index (prefix match on every typed word, Arabic article-insensitive).
     * Only when the index has no match for this source does a substring LIKE over the normalized text
     * run, so rare mid-word queries still find something; the LIMIT guard skips that scan entirely
     * whenever FTS already matched. Ranking: title starts with the query, then titles containing every
     * word, then matches in category/genre only; within a rank live channels first, then movies,
     * series and episodes, recently played first, then provider order.
     */
    fun search(serverId: Long, query: String): MediaSql {
        val normalized = SearchText.normalize(query)
        val tokens = SearchText.queryTokens(query)
        if (normalized.isEmpty() || tokens.isEmpty()) {
            return MediaSql("SELECT $ROW_COLUMNS FROM media WHERE 0", emptyList())
        }
        val match = SearchText.matchExpression(tokens)
        val args = mutableListOf<Any>()
        // CROSS JOIN pins the join order: the FTS index drives and each hit is looked up by rowid.
        // Left to itself the planner scans the whole source by serverId and probes FTS per row.
        val ftsHits = buildString {
            append("SELECT docid FROM media_search_fts")
            if (serverId > 0) append(" CROSS JOIN media_search AS hit ON hit.rowid = media_search_fts.docid")
            append(" WHERE media_search_fts MATCH ?")
            args += match
            if (serverId > 0) {
                append(" AND hit.serverId = ?")
                args += serverId
            }
        }
        val candidates = buildString {
            append(ftsHits)
            append(" UNION ALL SELECT likeRowId FROM (SELECT rowid AS likeRowId FROM media_search WHERE ")
            if (serverId > 0) {
                append("serverId = ? AND ")
                args += serverId
            }
            append("searchText LIKE ? ESCAPE '\\' LIMIT (SELECT CASE WHEN EXISTS (")
            args += "%$normalized%"
            // Same FTS lookup again (its arguments are bound twice) so the fallback runs only without hits.
            append(ftsHits.replace("SELECT docid", "SELECT 1"))
            args += match
            if (serverId > 0) args += serverId
            append(") THEN 0 ELSE -1 END))")
        }
        val sql = buildString {
            append("SELECT ").append(ROW_COLUMNS)
            append(" FROM media_search CROSS JOIN media ON media.id = media_search.id")
            append(" AND media.serverId = media_search.serverId AND media.type = media_search.type")
            append(" WHERE media_search.rowid IN (").append(candidates).append(")")
            append(" ORDER BY CASE WHEN media_search.title LIKE ? ESCAPE '\\' THEN 0")
            args += "$normalized%"
            append(" WHEN ")
            tokens.forEachIndexed { index, token ->
                if (index > 0) append(" AND ")
                append("media_search.title LIKE ? ESCAPE '\\'")
                args += "%$token%"
            }
            append(" THEN 1 ELSE 2 END,")
            append(" CASE media.type WHEN 'LIVE' THEN 0 WHEN 'MOVIE' THEN 1 WHEN 'SERIES' THEN 2 WHEN 'EPISODE' THEN 3 ELSE 4 END,")
            append(" CASE WHEN media.lastPlayedAt > 0 THEN 0 ELSE 1 END,")
            append(" media.serverId, media.serverOrder, media.rowid")
            append(" LIMIT ").append(SEARCH_RESULT_LIMIT)
        }
        return MediaSql(sql, args)
    }

    /**
     * Recovers the typed text from the legacy `%escaped%` LIKE pattern that older callers of
     * [MediaDao.searchPaging] still pass.
     */
    fun unescapeLikePattern(pattern: String): String {
        val inner = pattern.removePrefix("%").removeSuffix("%")
        val out = StringBuilder(inner.length)
        var escaped = false
        for (ch in inner) {
            if (!escaped && ch == '\\') {
                escaped = true
            } else {
                out.append(ch)
                escaped = false
            }
        }
        return out.toString()
    }

    private fun serverFilter(serverId: Long, args: MutableList<Any>): String =
        if (serverId > 0) {
            args += serverId
            "media.serverId = ?"
        } else {
            "media.serverId IN (SELECT id FROM servers)"
        }

    /**
     * [inCategory]: the query already narrows to one category, which the
     * (serverId, type, categoryId, serverOrder) index finds directly. The unary `+` stops the
     * planner from walking a whole section in sortAddedAt/lastPlayedAt index order instead;
     * sorting a few hundred category rows is far cheaper.
     */
    private fun orderBy(sort: SortOption, serverId: Long, inCategory: Boolean = false): String {
        val tail = if (serverId > 0) "media.serverOrder, media.rowid" else "media.serverId, media.serverOrder, media.rowid"
        val indexed = if (inCategory) "+" else ""
        return when (sort) {
            SortOption.SERVER_ORDER -> tail
            // Ties break on rowid DESC (latest insert first) rather than serverOrder: the sortAddedAt
            // index then yields rows already ordered, so paging and Room's COUNT need no sort at all.
            // Playlists without dates (sortAddedAt 0) list their last entries first.
            SortOption.LATEST_ADDED -> "${indexed}media.sortAddedAt DESC, media.rowid DESC"
            SortOption.TITLE_ASC -> "media.title COLLATE NOCASE ASC, $tail"
            SortOption.TITLE_DESC -> "media.title COLLATE NOCASE DESC, $tail"
            SortOption.RECENTLY_WATCHED -> "${indexed}media.lastPlayedAt DESC, $tail"
            SortOption.FAVORITES_FIRST -> "media.isFavorite DESC, $tail"
            SortOption.RATING -> "CAST(media.rating AS REAL) DESC, $tail"
        }
    }
}
