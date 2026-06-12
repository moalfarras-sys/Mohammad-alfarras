package com.mo.moplayer

import com.mo.moplayer.data.local.dao.CategoryDao
import com.mo.moplayer.data.local.dao.ContentSearchDao
import com.mo.moplayer.data.local.dao.MovieDao
import com.mo.moplayer.data.local.dao.ServerDao
import com.mo.moplayer.data.local.dao.SeriesDao
import com.mo.moplayer.data.local.MoPlayerDatabase
import com.mo.moplayer.data.local.entity.CategoryEntity
import com.mo.moplayer.data.local.entity.MovieEntity
import com.mo.moplayer.data.local.entity.ServerEntity
import com.mo.moplayer.data.local.entity.SeriesEntity
import com.mo.moplayer.data.parser.M3uParser
import com.mo.moplayer.data.remote.api.XtreamApi
import com.mo.moplayer.data.remote.dto.EpisodeDto
import com.mo.moplayer.data.remote.dto.EpisodeInfoDto
import com.mo.moplayer.data.remote.dto.MovieData
import com.mo.moplayer.data.remote.dto.SeriesInfoDto
import com.mo.moplayer.data.remote.dto.SeriesInfoResponse
import com.mo.moplayer.data.remote.dto.VodInfo
import com.mo.moplayer.data.remote.dto.VodInfoResponse
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.util.CredentialManager
import com.mo.moplayer.util.Resource
import io.mockk.coVerify
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
import retrofit2.Response

/**
 * Unit tests for IptvRepository.
 */
class IptvRepositoryTest {

    private lateinit var xtreamApi: XtreamApi
    private lateinit var serverDao: ServerDao
    private lateinit var categoryDao: CategoryDao
    private lateinit var movieDao: MovieDao
    private lateinit var seriesDao: SeriesDao
    private lateinit var contentSearchDao: ContentSearchDao
    private lateinit var database: MoPlayerDatabase
    private lateinit var m3uParser: M3uParser
    private lateinit var credentialManager: CredentialManager
    private lateinit var repository: IptvRepository

    @Before
    fun setup() {
        xtreamApi = mockk(relaxed = true)
        serverDao = mockk(relaxed = true)
        categoryDao = mockk(relaxed = true)
        movieDao = mockk(relaxed = true)
        seriesDao = mockk(relaxed = true)
        contentSearchDao = mockk(relaxed = true)
        database = mockk(relaxed = true)
        m3uParser = mockk(relaxed = true)
        credentialManager = mockk(relaxed = true)
        // Create repository with all required mocks - use relaxed mocks for unused DAOs
        repository = IptvRepository(
            xtreamApi = xtreamApi,
            serverDao = serverDao,
            categoryDao = categoryDao,
            channelDao = mockk(relaxed = true),
            movieDao = movieDao,
            seriesDao = seriesDao,
            favoriteDao = mockk(relaxed = true),
            watchHistoryDao = mockk(relaxed = true),
            epgDao = mockk(relaxed = true),
            serverSyncStateDao = mockk(relaxed = true),
            contentSearchDao = contentSearchDao,
            m3uParser = m3uParser,
            database = database,
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

    @Test
    fun `buildStreamUrl prefers hls when server allows m3u8 without explicit output`() {
        every { credentialManager.getCredentials(7L) } returns ("demo" to "secret")
        val server = createTestServer(id = 7L).copy(
            serverInfo = """{"allowed_output_formats":["mpegts","m3u8"]}"""
        )

        val result = repository.buildStreamUrl(server, streamId = 99, type = "live")

        assertEquals("http://example.com/live/demo/secret/99.m3u8", result)
    }

    @Test
    fun `buildStreamUrl defaults live streams to hls for old device compatibility`() {
        every { credentialManager.getCredentials(7L) } returns ("demo" to "secret")
        val server = createTestServer(id = 7L)

        val result = repository.buildStreamUrl(server, streamId = 99, type = "live")

        assertEquals("http://example.com/live/demo/secret/99.m3u8", result)
    }

    @Test
    fun `refreshMovieDetails persists Xtream VOD metadata`() = runTest {
        val server = createTestServer(id = 7L)
        val movie = createMovieEntity(serverId = 7L, streamId = 42)
        coEvery { serverDao.getServerById(7L) } returns server
        every { credentialManager.getCredentials(7L) } returns ("user" to "pass")
        coEvery {
            xtreamApi.getVodInfo(any(), "user", "pass", any(), 42)
        } returns Response.success(
            VodInfoResponse(
                info = VodInfo(
                    movieImage = "http://cdn.test/poster.jpg",
                    tmdbId = 123,
                    name = "Better Movie",
                    originalName = null,
                    plot = "Full plot",
                    cast = "Actor",
                    director = "Director",
                    genre = "Action",
                    releaseDate = "2026-01-02",
                    releaseDateAlt = null,
                    durationSecs = 5400,
                    duration = "01:30:00",
                    video = null,
                    audio = null,
                    bitrate = null,
                    rating = "8.4",
                    backdropPath = listOf("http://cdn.test/backdrop.jpg"),
                    youtubeTrailer = "abc123",
                    country = null
                ),
                movieData = MovieData(
                    streamId = 42,
                    name = "Better Movie",
                    added = "1710000000",
                    categoryId = "9",
                    containerExtension = "mkv",
                    customSid = null,
                    directSource = ""
                )
            )
        )

        val result = repository.refreshMovieDetails(movie)

        val enriched = (result as Resource.Success).data!!
        assertEquals("Better Movie", enriched.name)
        assertEquals("Full plot", enriched.plot)
        assertEquals(8.4, enriched.rating!!, 0.001)
        assertEquals("http://example.com/movie/user/pass/42.mkv", enriched.streamUrl)
        coVerify { movieDao.updateMovie(match { it.plot == "Full plot" && it.tmdbId == 123 }) }
    }

    @Test
    fun `refreshSeriesDetails caches episodes for local playback`() = runTest {
        val server = createTestServer(id = 7L)
        val series = createSeriesEntity(serverId = 7L, originalSeriesId = 55)
        coEvery { serverDao.getServerById(7L) } returns server
        every { credentialManager.getCredentials(7L) } returns ("user" to "pass")
        coEvery { seriesDao.getEpisodes(series.seriesId) } returns flowOf(emptyList())
        coEvery {
            xtreamApi.getSeriesInfo(any(), "user", "pass", any(), 55)
        } returns Response.success(
            SeriesInfoResponse(
                seasons = emptyList(),
                info = SeriesInfoDto(
                    name = "Better Series",
                    cover = "http://cdn.test/series.jpg",
                    plot = "Series plot",
                    cast = "Cast",
                    director = "Director",
                    genre = "Drama",
                    releaseDate = "2025",
                    releaseDateAlt = null,
                    lastModified = null,
                    rating = "7.7",
                    rating5Based = 3.8,
                    backdropPath = listOf("http://cdn.test/series-bg.jpg"),
                    youtubeTrailer = null,
                    tmdbId = 456,
                    categoryId = null
                ),
                episodes = mapOf(
                    "1" to listOf(
                        EpisodeDto(
                            id = "9001",
                            episodeNum = 1,
                            title = "Pilot",
                            containerExtension = "mp4",
                            info = EpisodeInfoDto(
                                movieImage = "http://cdn.test/ep.jpg",
                                plot = "Episode plot",
                                releaseDate = "2025-01-01",
                                durationSecs = 1800,
                                duration = "00:30:00",
                                bitrate = null,
                                rating = 8.0
                            ),
                            customSid = null,
                            added = null,
                            season = 1,
                            directSource = ""
                        )
                    )
                )
            )
        )

        val result = repository.refreshSeriesDetails(series)

        val details = (result as Resource.Success).data!!
        assertEquals("Better Series", details.series.name)
        assertEquals(1, details.episodes.size)
        assertEquals("${series.seriesId}_9001", details.episodes.first().episodeId)
        assertEquals("http://example.com/series/user/pass/9001.mp4", details.episodes.first().streamUrl)
        coVerify { seriesDao.updateSeries(match { it.plot == "Series plot" && it.tmdbId == 456 }) }
        coVerify { seriesDao.insertEpisodes(match { it.size == 1 && it.first().title == "Pilot" }) }
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

    private fun createMovieEntity(serverId: Long, streamId: Int) = MovieEntity(
        movieId = "${serverId}_$streamId",
        serverId = serverId,
        streamId = streamId,
        name = "Movie",
        streamUrl = "http://example.com/movie/user/pass/$streamId.mp4",
        containerExtension = "mp4"
    )

    private fun createSeriesEntity(serverId: Long, originalSeriesId: Int) = SeriesEntity(
        seriesId = "${serverId}_$originalSeriesId",
        serverId = serverId,
        originalSeriesId = originalSeriesId,
        name = "Series"
    )
}
