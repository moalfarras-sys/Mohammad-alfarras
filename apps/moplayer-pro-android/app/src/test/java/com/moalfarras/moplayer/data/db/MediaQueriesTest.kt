package com.moalfarras.moplayer.data.db

import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.SortOption
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class MediaQueriesTest {
    private fun MediaSql.placeholders() = sql.count { it == '?' }

    @Test
    fun singleSourceQueriesSeekByServerIdWithoutTheOrGuard() {
        SortOption.entries.forEach { sort ->
            val queries = listOf(
                MediaQueries.byType(7, ContentType.MOVIE, sort, hideNoLogo = false),
                MediaQueries.byCategory(7, ContentType.LIVE, "12", sort, hideNoLogo = true),
                MediaQueries.liveZapKeys(7, "12", favoritesOnly = false, sort = sort, hideNoLogo = false),
            )
            queries.forEach { query ->
                assertTrue(query.sql, query.sql.contains("WHERE media.serverId = ?"))
                assertFalse(query.sql, query.sql.contains("<= 0"))
                assertFalse(query.sql, query.sql.contains("CASE WHEN ?"))
                assertEquals(query.sql, query.placeholders(), query.args.size)
                assertEquals(7L, query.args.first())
            }
        }
    }

    @Test
    fun mergedLibraryFiltersToExistingSourcesWithoutBindingAServer() {
        val query = MediaQueries.byType(0, ContentType.SERIES, SortOption.SERVER_ORDER, hideNoLogo = false)
        assertTrue(query.sql.contains("media.serverId IN (SELECT id FROM servers)"))
        assertEquals(listOf<Any>("SERIES"), query.args)
        assertTrue(query.sql.endsWith("ORDER BY media.serverId, media.serverOrder, media.rowid"))
    }

    @Test
    fun defaultAndLatestSortsEndInIndexOrder() {
        assertTrue(
            MediaQueries.byType(1, ContentType.MOVIE, SortOption.SERVER_ORDER, false).sql
                .endsWith("ORDER BY media.serverOrder, media.rowid"),
        )
        assertTrue(
            MediaQueries.byType(1, ContentType.MOVIE, SortOption.LATEST_ADDED, false).sql
                .endsWith("ORDER BY media.sortAddedAt DESC, media.rowid DESC"),
        )
    }

    @Test
    fun categoryQueriesKeepTheCategoryIndexForIndexedSortKeys() {
        val latest = MediaQueries.byCategory(1, ContentType.MOVIE, "5", SortOption.LATEST_ADDED, false).sql
        assertTrue(latest, latest.contains("ORDER BY +media.sortAddedAt DESC"))
        val recent = MediaQueries.liveZapKeys(1, "5", favoritesOnly = false, sort = SortOption.LATEST_ADDED, hideNoLogo = false).sql
        assertTrue(recent, recent.contains("ORDER BY +media.sortAddedAt DESC"))
        val allLive = MediaQueries.liveZapKeys(1, "", favoritesOnly = false, sort = SortOption.LATEST_ADDED, hideNoLogo = false).sql
        assertTrue(allLive, allLive.contains("ORDER BY media.sortAddedAt DESC"))
    }

    @Test
    fun zapKeysFollowTheListOrderWithoutARowCap() {
        val zap = MediaQueries.liveZapKeys(3, "", favoritesOnly = false, sort = SortOption.RECENTLY_WATCHED, hideNoLogo = true)
        // Same order as the Live list; the caller reads it once per player session, so history
        // written while zapping cannot reorder it.
        assertTrue(zap.sql, zap.sql.endsWith("ORDER BY media.lastPlayedAt DESC, media.serverOrder, media.rowid"))
        assertFalse(zap.sql, zap.sql.contains("LIMIT"))
        assertTrue(zap.sql.contains("media.posterUrl != ''"))
        assertTrue(zap.sql.startsWith("SELECT ${MediaQueries.ZAP_KEY_COLUMNS} FROM media"))
        assertEquals(listOf<Any>(3L, "LIVE"), zap.args)
    }

    @Test
    fun favoriteZapKeysUseTheFavoritesScreenOrder() {
        val zap = MediaQueries.liveZapKeys(0, "", favoritesOnly = true, sort = SortOption.TITLE_ASC, hideNoLogo = false)
        assertTrue(zap.sql.contains("media.serverId IN (SELECT id FROM servers)"))
        assertTrue(zap.sql.contains("media.isFavorite = 1"))
        assertTrue(zap.sql, zap.sql.endsWith("ORDER BY media.updatedAt DESC, media.rowid"))
        assertEquals(listOf<Any>("LIVE"), zap.args)
    }

    @Test
    fun zapRowsAreFetchedByIdForOneSource() {
        val query = MediaQueries.liveRowsByIds(9, listOf("101", "102", "103"))
        assertTrue(query.sql, query.sql.endsWith("WHERE media.serverId = ? AND media.type = ? AND media.id IN (?,?,?)"))
        assertEquals(query.placeholders(), query.args.size)
        assertEquals(listOf<Any>(9L, "LIVE", "101", "102", "103"), query.args)
    }

    @Test
    fun liveGroupCountsAreOneGroupedPassOverTheCategoryIndex() {
        val query = MediaQueries.liveCategoryCounts(4, hideNoLogo = false)
        assertEquals(
            "SELECT media.categoryId AS categoryId, COUNT(*) AS channels FROM media " +
                "WHERE media.serverId = ? AND media.type = ? GROUP BY media.categoryId",
            query.sql,
        )
        assertEquals(listOf<Any>(4L, "LIVE"), query.args)
        val merged = MediaQueries.liveCategoryCounts(0, hideNoLogo = true)
        assertTrue(merged.sql.contains("media.serverId IN (SELECT id FROM servers)"))
        assertTrue(merged.sql.contains("media.posterUrl != ''"))
        assertEquals(merged.placeholders(), merged.args.size)
    }

    @Test
    fun channelNumberLookupBindsTheNumberAndReadsAFewRows() {
        val query = MediaQueries.liveByNumber(6, 205, hideNoLogo = false)
        assertTrue(query.sql, query.sql.startsWith("SELECT ${MediaQueries.ROW_COLUMNS} FROM media"))
        assertTrue(query.sql, query.sql.contains("WHERE media.serverId = ? AND media.type = ? AND media.serverOrder = ?"))
        assertTrue(query.sql, query.sql.endsWith("ORDER BY media.rowid LIMIT ${MediaQueries.LIVE_BY_NUMBER_LIMIT}"))
        assertEquals(listOf<Any>(6L, "LIVE", 205), query.args)
        val merged = MediaQueries.liveByNumber(0, 7, hideNoLogo = true)
        assertTrue(merged.sql.contains("media.posterUrl != ''"))
        assertEquals(listOf<Any>("LIVE", 7), merged.args)
        assertEquals(merged.placeholders(), merged.args.size)
    }

    @Test
    fun unknownSortNameFallsBackToServerOrder() {
        assertEquals(SortOption.SERVER_ORDER, MediaQueries.sortOptionOf("NOPE"))
        assertEquals(SortOption.RATING, MediaQueries.sortOptionOf("RATING"))
    }

    @Test
    fun searchBindsNormalizedTextOnly() {
        val query = MediaQueries.search(4, "الجزيرة 2")
        assertEquals(query.sql, query.placeholders(), query.args.size)
        assertTrue(query.args.contains("جزيره* 2*"))
        assertTrue(query.args.contains("%الجزيره 2%"))
        assertTrue(query.args.contains("الجزيره 2%"))
        assertTrue(query.sql.contains("MATCH ?"))
        assertTrue(query.sql.endsWith("LIMIT ${MediaQueries.SEARCH_RESULT_LIMIT}"))
        assertFalse("the typed text never reaches the SQL", query.sql.contains("جزير"))
    }

    @Test
    fun searchInMergedLibraryHasNoServerFilter() {
        val query = MediaQueries.search(0, "bein")
        assertFalse(query.sql.contains("serverId = ?"))
        assertEquals(query.placeholders(), query.args.size)
    }

    @Test
    fun searchWithNothingSearchableReturnsNoRows() {
        val query = MediaQueries.search(1, " -- ")
        assertTrue(query.sql.endsWith("WHERE 0"))
        assertTrue(query.args.isEmpty())
    }

    @Test
    fun legacyLikePatternIsUnescaped() {
        assertEquals("50% off_now\\", MediaQueries.unescapeLikePattern("%50\\% off\\_now\\\\%"))
        assertEquals("bein", MediaQueries.unescapeLikePattern("%bein%"))
    }
}
