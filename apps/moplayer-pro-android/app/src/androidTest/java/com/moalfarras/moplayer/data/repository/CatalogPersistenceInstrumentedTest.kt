package com.moalfarras.moplayer.data.repository

import androidx.room.Room
import androidx.paging.PagingSource
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.moalfarras.moplayer.data.db.MoPlayerDatabase
import com.moalfarras.moplayer.data.db.ServerEntity
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.LoginKind
import com.moalfarras.moplayer.domain.model.MediaItem
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class CatalogPersistenceInstrumentedTest {
    private val context = InstrumentationRegistry.getInstrumentation().targetContext

    @Test
    fun interruptedAndCompletedLargeSyncPreserveViewerStateAcrossReopen() = runBlocking {
        val name = "catalog-qa-${UUID.randomUUID()}.db"
        fun open() = Room.databaseBuilder(context, MoPlayerDatabase::class.java, name).build()
        var db = open()
        try {
            val serverId = db.serverDao().upsert(server())
            fun item(id: String, title: String = "Channel $id") = MediaItem(id, serverId,
                ContentType.LIVE, "qa", title = title, streamUrl = "http://127.0.0.1/qa/$id.ts")
            CatalogWriter(db, serverId).apply {
                add(item("keep", "قناة الاختبار"))
                add(item("stale"))
                finish(listOf(ContentType.LIVE), emptyList())
            }
            db.mediaDao().toggleFavorite(serverId, "keep", ContentType.LIVE, 100)
            db.mediaDao().updateWatch(serverId, "keep", ContentType.LIVE, 12_000, 60_000, 200)

            // A failed pass has flushed a batch but has not finished: old rows must survive.
            CatalogWriter(db, serverId, batchSize = 1).add(item("partial"))
            assertNotNull(db.mediaDao().get(serverId, "stale", ContentType.LIVE))
            db.close()
            db = open()

            val writer = CatalogWriter(db, serverId)
            writer.add(item("keep", "قناة الاختبار الجديدة"))
            repeat(10_000) { writer.add(item("new-$it")) }
            writer.finish(listOf(ContentType.LIVE), emptyList())
            assertEquals(10_001, db.mediaDao().countForServer(serverId))
            assertNull(db.mediaDao().get(serverId, "stale", ContentType.LIVE))
            assertNull(db.mediaDao().get(serverId, "partial", ContentType.LIVE))
            val kept = requireNotNull(db.mediaDao().get(serverId, "keep", ContentType.LIVE))
            assertTrue(kept.isFavorite)
            assertEquals(12_000L, kept.watchPositionMs)
            assertEquals(60_000L, kept.watchDurationMs)
            assertTrue(db.mediaDao().searchRowsOnce(serverId, "الاختبار").any { it.id == "keep" })
            db.close()
            db = open()
            assertTrue(requireNotNull(db.mediaDao().get(serverId, "keep", ContentType.LIVE)).isFavorite)
            assertEquals(10_001, db.mediaDao().countForServer(serverId))
        } finally {
            db.close()
            context.deleteDatabase(name)
        }
    }

    @Test
    fun continueWatchingPicksLatestEpisodePerSourceAndKeepsHistory() = runBlocking {
        val name = "resume-qa-${UUID.randomUUID()}.db"
        val db = Room.databaseBuilder(context, MoPlayerDatabase::class.java, name).build()
        try {
            val first = db.serverDao().upsert(server())
            val second = db.serverDao().upsert(server().copy(sourceKey = "second-qa"))
            suspend fun populate(serverId: Long) {
                val writer = CatalogWriter(db, serverId)
                repeat(1_000) { n ->
                    writer.add(MediaItem("ep-$n", serverId, ContentType.EPISODE, "qa",
                        title = "Episode $n", streamUrl = "http://127.0.0.1/$n", seriesId = "series-1"))
                }
                writer.add(MediaItem("film", serverId, ContentType.MOVIE, "qa", title = "Film", streamUrl = "http://127.0.0.1/film"))
                writer.finish(listOf(ContentType.EPISODE, ContentType.MOVIE), emptyList())
                repeat(10) { n ->
                    db.mediaDao().markPlayed(serverId, "ep-$n", ContentType.EPISODE, 100L + n)
                    db.mediaDao().updateWatch(serverId, "ep-$n", ContentType.EPISODE, 30_000, 100_000, 100L + n)
                }
                db.mediaDao().updateWatch(serverId, "film", ContentType.MOVIE, 40_000, 100_000, 90)
            }
            populate(first)
            populate(second)
            suspend fun rows(serverId: Long): List<com.moalfarras.moplayer.data.db.MediaListRow> {
                val result = db.mediaDao().observeContinueWatchingPaging(serverId)
                    .load(PagingSource.LoadParams.Refresh(null, 50, false))
                return (result as PagingSource.LoadResult.Page<Int, com.moalfarras.moplayer.data.db.MediaListRow>).data
            }
            assertEquals(listOf("ep-9", "film"), rows(first).map { it.id })
            assertEquals(4, rows(0).size) // Same series id on another source is independent.
            db.mediaDao().updateWatch(first, "ep-9", ContentType.EPISODE, 0, 100_000, 200)
            assertEquals(listOf("film"), rows(first).map { it.id })
            assertEquals(30_000L, requireNotNull(db.mediaDao().get(first, "ep-8", ContentType.EPISODE)).watchPositionMs)
            assertEquals(1_001, db.mediaDao().countForServer(first))
        } finally {
            db.close()
            context.deleteDatabase(name)
        }
    }

    @Test fun searchRanksExactNamesAndNumbersWithArabicNetworkAliases() = runBlocking {
        val name = "search-qa-${UUID.randomUUID()}.db"
        val db = Room.databaseBuilder(context, MoPlayerDatabase::class.java, name).build()
        try {
            val serverId = db.serverDao().upsert(server())
            val writer = CatalogWriter(db, serverId)
            val titles = listOf("MBC 20", "MBC 2", "MBC2 HD", "beIN Sports 10", "beIN Sports 1", "The Journey Extended", "The Journey")
            titles.forEachIndexed { n, title -> writer.add(MediaItem("qa-$n", serverId,
                ContentType.LIVE, "qa", title = title, streamUrl = "http://127.0.0.1/$n")) }
            writer.finish(listOf(ContentType.LIVE), emptyList())
            assertEquals("MBC 2", db.mediaDao().searchRowsOnce(serverId, "MBC2").first().title)
            assertEquals("MBC 2", db.mediaDao().searchRowsOnce(serverId, "إم بي سي ٢").first().title)
            assertEquals("beIN Sports 1", db.mediaDao().searchRowsOnce(serverId, "بي إن سبورت ١").first().title)
            assertEquals("The Journey", db.mediaDao().searchRowsOnce(serverId, "the journey").first().title)
            assertTrue(db.mediaDao().searchRowsOnce(serverId, "unknown-no-such-title").isEmpty())
        } finally { db.close(); context.deleteDatabase(name) }
    }

    private fun server() = ServerEntity(name = "Local QA", kind = LoginKind.M3U,
        baseUrl = "", username = "", password = "", playlistUrl = "http://127.0.0.1/qa.m3u",
        createdAt = 1, lastSyncAt = 0, host = "127.0.0.1", accountStatus = "", expiryDate = 0,
        activeConnections = 0, maxConnections = 0, allowedOutputFormats = "", timezone = "",
        serverMessage = "", lastSyncSource = "", epgUrl = "", sourceKey = "local-qa")
}
