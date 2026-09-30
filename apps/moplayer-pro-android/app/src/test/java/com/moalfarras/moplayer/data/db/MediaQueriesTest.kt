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
                MediaQueries.liveZap(7, "12", sort, hideNoLogo = false),
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
        val recent = MediaQueries.liveZap(1, "5", SortOption.LATEST_ADDED, false).sql
        assertTrue(recent, recent.contains("ORDER BY +media.sortAddedAt DESC"))
        val allLive = MediaQueries.liveZap(1, "", SortOption.LATEST_ADDED, false).sql
        assertTrue(allLive, allLive.contains("ORDER BY media.sortAddedAt DESC"))
    }

    @Test
    fun zapListIgnoresRecentlyWatchedSoChannelUpDownStaysStable() {
        val zap = MediaQueries.liveZap(3, "", SortOption.RECENTLY_WATCHED, hideNoLogo = true)
        assertFalse(zap.sql.substringAfter("ORDER BY").contains("lastPlayedAt"))
        assertTrue(zap.sql.contains("ORDER BY media.serverOrder, media.rowid LIMIT ${MediaQueries.LIVE_ZAP_LIMIT}"))
        assertTrue(zap.sql.contains("media.posterUrl != ''"))
        assertEquals(listOf<Any>(3L, "LIVE"), zap.args)
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
