package com.moalfarras.moplayer.data.repository

import androidx.room.Room
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

    private fun server() = ServerEntity(name = "Local QA", kind = LoginKind.M3U,
        baseUrl = "", username = "", password = "", playlistUrl = "http://127.0.0.1/qa.m3u",
        createdAt = 1, lastSyncAt = 0, host = "127.0.0.1", accountStatus = "", expiryDate = 0,
        activeConnections = 0, maxConnections = 0, allowedOutputFormats = "", timezone = "",
        serverMessage = "", lastSyncSource = "", epgUrl = "", sourceKey = "local-qa")
}
