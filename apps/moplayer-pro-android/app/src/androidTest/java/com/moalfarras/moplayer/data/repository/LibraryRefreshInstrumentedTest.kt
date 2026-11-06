package com.moalfarras.moplayer.data.repository

import androidx.room.Room
import androidx.test.platform.app.InstrumentationRegistry
import com.moalfarras.moplayer.data.db.MoPlayerDatabase
import com.moalfarras.moplayer.data.network.NetworkModule
import com.moalfarras.moplayer.data.parser.M3uParser
import com.moalfarras.moplayer.domain.model.ContentType
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import java.net.InetAddress
import java.net.ServerSocket
import java.util.UUID
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference
import kotlin.concurrent.thread

/** Real HTTP -> streaming parser -> Room, with no provider or external network. */
class LibraryRefreshInstrumentedTest {
    @Test fun changedPlaylistRefreshesAtomicallyAndFreshBackgroundPassSkipsDownload() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "refresh-qa-${UUID.randomUUID()}.db"
        val db = Room.databaseBuilder(context, MoPlayerDatabase::class.java, name).build()
        val listener = ServerSocket(0, 8, InetAddress.getByName("127.0.0.1"))
        val calls = AtomicInteger()
        val body = AtomicReference("#EXTM3U\n#EXTINF:-1 tvg-id=\"one\" group-title=\"QA\",Keep channel\nhttp://127.0.0.1/one.ts\n")
        val serving = thread(name = "playlist-fixture", isDaemon = true) {
            while (!listener.isClosed) {
                try {
                    listener.accept().use { socket ->
                        socket.soTimeout = 5_000
                        val input = socket.getInputStream().bufferedReader()
                        while (true) { if (input.readLine().isNullOrEmpty()) break }
                        calls.incrementAndGet()
                        val bytes = body.get().toByteArray()
                        socket.getOutputStream().apply {
                            write("HTTP/1.1 200 OK\r\nContent-Type: application/x-mpegURL\r\nContent-Length: ${bytes.size}\r\nConnection: close\r\n\r\n".toByteArray())
                            write(bytes); flush()
                        }
                    }
                } catch (_: java.io.IOException) { if (listener.isClosed) break }
            }
        }
        try {
            val repository = IptvRepository(db, NetworkModule.playlistService,
                { error("M3U must not request Xtream") }, null, NetworkModule.webApiService, M3uParser())
            val server = repository.registerM3uSource("Synthetic QA", "http://127.0.0.1:${listener.localPort}/qa.m3u")
            repository.refreshServerFast(server).collect {}
            assertEquals(1, calls.get())
            val old = db.mediaDao().idsForServerType(server.id, ContentType.LIVE).single()
            db.mediaDao().toggleFavorite(server.id, old, ContentType.LIVE, 10)
            repository.refreshServerFast(server, SyncMode.BACKGROUND).collect {}
            assertEquals("fresh background pass downloaded again", 1, calls.get())
            assertFalse(repository.needsLibraryRefresh(server, 3 * 60 * 60_000L))
            val state = requireNotNull(db.syncStateDao().get(server.id))
            db.syncStateDao().upsert(state.copy(lastSyncAt = 1))
            body.set(body.get() + "#EXTINF:-1 tvg-id=\"two\" group-title=\"QA\",New channel\nhttp://127.0.0.1/two.ts\n")
            assertTrue(repository.needsLibraryRefresh(server, 3 * 60 * 60_000L))
            repository.refreshServerFast(server, SyncMode.BACKGROUND).collect {}
            assertEquals(2, calls.get())
            assertEquals(2, db.mediaDao().countForServer(server.id))
            assertTrue(requireNotNull(db.mediaDao().get(server.id, old, ContentType.LIVE)).isFavorite)
            assertFalse(repository.needsLibraryRefresh(server, 3 * 60 * 60_000L))
        } finally {
            listener.close(); serving.join(5_000)
            db.close(); context.deleteDatabase(name)
        }
    }
}
