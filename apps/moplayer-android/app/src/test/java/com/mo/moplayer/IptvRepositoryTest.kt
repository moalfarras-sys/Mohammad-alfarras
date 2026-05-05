package com.mo.moplayer

import com.mo.moplayer.data.local.dao.CategoryDao
import com.mo.moplayer.data.local.dao.ServerDao
import com.mo.moplayer.data.local.entity.CategoryEntity
import com.mo.moplayer.data.local.entity.ServerEntity
import com.mo.moplayer.data.parser.M3uParser
import com.mo.moplayer.data.remote.api.XtreamApi
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.util.CredentialManager
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

/**
 * Unit tests for IptvRepository.
 */
class IptvRepositoryTest {

    private lateinit var xtreamApi: XtreamApi
    private lateinit var serverDao: ServerDao
    private lateinit var categoryDao: CategoryDao
    private lateinit var m3uParser: M3uParser
    private lateinit var credentialManager: CredentialManager
    private lateinit var repository: IptvRepository

    @Before
    fun setup() {
        xtreamApi = mockk(relaxed = true)
        serverDao = mockk(relaxed = true)
        categoryDao = mockk(relaxed = true)
        m3uParser = mockk(relaxed = true)
        credentialManager = mockk(relaxed = true)
        // Create repository with all required mocks - use relaxed mocks for unused DAOs
        repository = IptvRepository(
            xtreamApi = xtreamApi,
            serverDao = serverDao,
            categoryDao = categoryDao,
            channelDao = mockk(relaxed = true),
            movieDao = mockk(relaxed = true),
            seriesDao = mockk(relaxed = true),
            favoriteDao = mockk(relaxed = true),
            watchHistoryDao = mockk(relaxed = true),
            epgDao = mockk(relaxed = true),
            serverSyncStateDao = mockk(relaxed = true),
            contentSearchDao = mockk(relaxed = true),
            m3uParser = m3uParser,
            credentialManager = credentialManager
        )
    }

    @Test
    fun `getActiveServerSync returns server when dao has active server`() = runTest {
        val server = createTestServer(id = 1L)
        coEvery { serverDao.getActiveServer() } returns server

        val result = repository.getActiveServerSync()

        assertEquals(server, result)
    }

    @Test
    fun `getActiveServerSync returns null when dao has no active server`() = runTest {
        coEvery { serverDao.getActiveServer() } returns null

        val result = repository.getActiveServerSync()

        assertNull(result)
    }

    @Test
    fun `getLiveCategories returns categories from dao`() = runTest {
        val categories = listOf(
            createCategoryEntity("cat1", "Live 1"),
            createCategoryEntity("cat2", "Live 2")
        )
        coEvery { categoryDao.getCategoriesByType(1L, "live") } returns flowOf(categories)

        val result = repository.getLiveCategories(1L).first()

        assertEquals(2, result.size)
        assertEquals("Live 1", result[0].name)
        assertEquals("Live 2", result[1].name)
    }

    @Test
    fun `getMovieCategories returns categories from dao`() = runTest {
        val categories = listOf(createCategoryEntity("movie_cat1", "Action"))
        coEvery { categoryDao.getCategoriesByType(1L, "movie") } returns flowOf(categories)

        val result = repository.getMovieCategories(1L).first()

        assertEquals(1, result.size)
        assertEquals("Action", result[0].name)
    }

    @Test
    fun `buildStreamUrl respects mpegts preferred live output`() {
        every { credentialManager.getCredentials(7L) } returns ("demo" to "secret")
        val server = createTestServer(id = 7L).copy(
            serverInfo = """{"preferred_output_format":"mpegts","allowed_output_formats":["mpegts","m3u8"]}"""
        )

        val result = repository.buildStreamUrl(server, streamId = 99, type = "live")

        assertEquals("http://example.com/live/demo/secret/99.ts", result)
    }

    private fun createTestServer(id: Long = 1L) = ServerEntity(
        id = id,
        name = "Test Server",
        serverUrl = "http://example.com",
        username = "user",
        password = "pass",
        serverType = "xtream",
        isActive = true,
        expirationDate = null,
        maxConnections = null,
        activeConnections = null
    )

    private fun createCategoryEntity(categoryId: String, name: String) = CategoryEntity(
        categoryId = categoryId,
        serverId = 1L,
        originalId = categoryId,
        name = name,
        type = "live",
        parentId = null,
        sortOrder = 0
    )
}
