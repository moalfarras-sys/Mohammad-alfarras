package com.moalfarras.moplayer.data.db

import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MappersTest {
    private fun item(addedAt: Long, lastModifiedAt: Long) = MediaItem(
        id = "1",
        serverId = 2,
        type = ContentType.SERIES,
        categoryId = "9",
        categoryName = "مسلسلات رمضان",
        title = "باب الحارة",
        streamUrl = "",
        addedAt = addedAt,
        lastModifiedAt = lastModifiedAt,
        genre = "Drama",
        releaseDate = "2006",
    )

    @Test
    fun latestSortKeyFallsBackToLastModified() {
        assertEquals(500L, item(addedAt = 0, lastModifiedAt = 500).toEntity().sortAddedAt)
        assertEquals(100L, item(addedAt = 100, lastModifiedAt = 500).toEntity().sortAddedAt)
    }

    @Test
    fun searchRowIsNormalizedAndCoversEveryField() {
        val search = item(addedAt = 1, lastModifiedAt = 0).toSearchEntity()
        assertEquals("باب الحاره", search.title)
        val tokens = SearchText.tokens(search.searchText)
        assertTrue(tokens.containsAll(listOf("باب", "الحاره", "حاره", "مسلسلات", "رمضان", "drama", "2006")))
    }
}
