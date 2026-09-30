package com.moalfarras.moplayer.ui.screens

import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.FootballMatch
import com.moalfarras.moplayer.domain.model.LoginKind
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.ServerProfile
import com.moalfarras.moplayer.ui.i18n.ArStrings
import com.moalfarras.moplayer.ui.i18n.EnStrings
import com.moalfarras.moplayer.ui.i18n.home
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class HomeLogicTest {
    private val en = EnStrings.home
    private val ar = ArStrings.home

    private fun item(id: String, type: ContentType, title: String = id, addedAt: Long = 0, addedAtUnknown: Boolean = false) =
        MediaItem(id = id, serverId = 1, type = type, categoryId = "c", title = title, streamUrl = "", addedAt = addedAt, addedAtUnknown = addedAtUnknown)

    @Test
    fun liveRowsLeadHome() {
        val rows = buildHomeRows(
            recentLive = listOf(item("r1", ContentType.LIVE)),
            favoriteLive = listOf(item("f1", ContentType.LIVE), item("m9", ContentType.MOVIE)),
            latestLive = listOf(item("l1", ContentType.LIVE, addedAt = 5)),
            resume = listOf(item("v1", ContentType.MOVIE)),
            latestMovies = listOf(item("m1", ContentType.MOVIE)),
            latestSeries = listOf(item("s1", ContentType.SERIES)),
            limit = 15,
        )
        assertEquals(
            listOf(
                HomeRowKind.CONTINUE_LIVE,
                HomeRowKind.FAVORITE_CHANNELS,
                HomeRowKind.RESUME_VOD,
                HomeRowKind.LATEST_MOVIES,
                HomeRowKind.LATEST_SERIES,
                HomeRowKind.NEW_CHANNELS,
            ),
            rows.map { it.kind },
        )
        // Only live items make it into the favorite channels row.
        assertEquals(listOf("f1"), rows[1].items.map { it.id })
    }

    @Test
    fun firstTimeUsersStillGetLiveTvFirst() {
        val rows = buildHomeRows(
            recentLive = emptyList(),
            favoriteLive = emptyList(),
            latestLive = listOf(item("l1", ContentType.LIVE, addedAtUnknown = true)),
            resume = emptyList(),
            latestMovies = listOf(item("m1", ContentType.MOVIE)),
            latestSeries = emptyList(),
            limit = 15,
        )
        assertEquals(listOf(HomeRowKind.LIVE_TV, HomeRowKind.LATEST_MOVIES), rows.map { it.kind })
    }

    @Test
    fun undatedChannelsAreNotCalledRecentlyAdded() {
        val rows = buildHomeRows(
            recentLive = listOf(item("r1", ContentType.LIVE)),
            favoriteLive = emptyList(),
            latestLive = listOf(item("l1", ContentType.LIVE, addedAtUnknown = true)),
            resume = emptyList(),
            latestMovies = emptyList(),
            latestSeries = emptyList(),
            limit = 15,
        )
        assertEquals(HomeRowKind.LIVE_TV, rows.last().kind)
    }

    @Test
    fun rowsRespectTheShelfLimit() {
        val many = (1..40).map { item("l$it", ContentType.LIVE) }
        val rows = buildHomeRows(many, emptyList(), emptyList(), emptyList(), emptyList(), emptyList(), limit = 15)
        assertEquals(15, rows.single().items.size)
    }

    @Test
    fun assistantUnderstandsArabicAndEnglish() {
        assertEquals(AiSuggestionMode.MOVIES, aiModeFor("اقترح لي أفلام جديدة"))
        assertEquals(AiSuggestionMode.SERIES, aiModeFor("مسلسل كوميدي"))
        assertEquals(AiSuggestionMode.LIVE, aiModeFor("قناة إخبارية"))
        assertEquals(AiSuggestionMode.SPORTS, aiModeFor("مباراة اليوم"))
        assertEquals(AiSuggestionMode.SPORTS, aiModeFor("sports channel"))
        assertEquals(AiSuggestionMode.MOVIES, aiModeFor("Suggest a film"))
        assertEquals(AiSuggestionMode.CONTINUE, aiModeFor("continue"))
        assertEquals(AiSuggestionMode.SURPRISE, aiModeFor("hello"))
    }

    @Test
    fun arabicNormalizationFoldsLetterVariants() {
        assertEquals("مباراه", normalizeForMatching("مُباراة"))
        assertEquals("اكمل", normalizeForMatching("أكمل"))
        assertEquals("كوره", normalizeForMatching("كورة"))
    }

    @Test
    fun quickActionRepliesAreInTheAppLanguage() {
        val content = listOf(item("m1", ContentType.MOVIE, title = "Sintel").copy(rating = "7.5"))
        val reply = aiReplyForMode(AiSuggestionMode.MOVIES, content, emptyList(), ar)
        assertTrue(reply.startsWith("أقترح عليك"))
        assertTrue(reply.contains("Sintel"))
        assertEquals(en.assistantNoMatches, aiReplyForMode(AiSuggestionMode.SPORTS, content, emptyList(), en))
    }

    @Test
    fun typedArabicQuestionFindsTheTitle() {
        val content = listOf(
            item("m1", ContentType.MOVIE, title = "Sintel"),
            item("m2", ContentType.MOVIE, title = "الرسالة"),
        )
        val reply = aiReplyForQuery("الرسالة", content, emptyList(), ar)
        assertTrue(reply.contains("الرسالة"))
    }

    @Test
    fun scoreSplitsIntoHomeAndAwayGoals() {
        assertEquals("2" to "1", parseScore("2-1"))
        assertEquals("10" to "0", parseScore(" 10 - 0 "))
        assertNull(parseScore(""))
        assertNull(parseScore("VS"))
        assertNull(parseScore("2-"))
    }

    @Test
    fun accountSummaryIsLocalized() {
        val now = 1_000_000_000_000L
        val server = ServerProfile(
            name = "x",
            kind = LoginKind.XTREAM,
            baseUrl = "http://h",
            accountStatus = "Active",
            expiryDate = now + 45L * 86_400_000L + 1_000L,
            activeConnections = 0,
            maxConnections = 2,
        )
        val english = accountSummary(server, en, now)
        assertTrue(english, english.startsWith("Active"))
        assertTrue(english, english.contains("45 days left"))
        assertTrue(english, english.contains("0/2"))
        val arabic = accountSummary(server, ar, now)
        assertTrue(arabic, arabic.startsWith("نشط"))
        assertTrue(arabic, arabic.contains("يوماً"))
        assertEquals("", accountSummary(server.copy(accountStatus = "", expiryDate = 0, maxConnections = 0), en, now))
    }

    @Test
    fun heroMetaForChannelsAndMovies() {
        val channel = item("c1", ContentType.LIVE).copy(categoryName = "Sports", serverOrder = 12)
        val meta = heroMeta(channel, en, EnStrings)
        assertTrue(meta, meta.contains("Sports"))
        assertTrue(meta, meta.contains("Channel 12"))
        val movie = item("m1", ContentType.MOVIE).copy(rating = "7.5", releaseDate = "2023-05-01", durationSecs = 6_300)
        val movieMeta = heroMeta(movie, en, EnStrings)
        assertTrue(movieMeta, movieMeta.contains("7.5"))
        assertTrue(movieMeta, movieMeta.contains("2023"))
        assertTrue(movieMeta, movieMeta.contains("1h 45m"))
        assertEquals(en.heroWelcomeHint, heroMeta(null, en, EnStrings))
    }

    @Test
    fun seriesOpensOnTheLastWatchedEpisode() {
        val e1 = item("e1", ContentType.EPISODE).copy(seasonNumber = 1, episodeNumber = 1)
        val e2 = item("e2", ContentType.EPISODE).copy(seasonNumber = 2, episodeNumber = 3, lastPlayedAt = 50)
        val e3 = item("e3", ContentType.EPISODE).copy(seasonNumber = 2, episodeNumber = 4, lastPlayedAt = 10)
        val series = item("s", ContentType.SERIES)
        assertEquals("e2", entryEpisodeFor(listOf(e1, e2, e3), series)?.id)
        assertEquals("e3", entryEpisodeFor(listOf(e1, e2, e3), e3)?.id)
        assertEquals("e1", entryEpisodeFor(listOf(e3.copy(lastPlayedAt = 0), e1), null)?.id)
        assertNull(entryEpisodeFor(emptyList(), series))
    }

    @Test
    fun durationsAreLocalized() {
        assertEquals("1h 45m", formatDuration(6_300, en))
        assertEquals("45 min", formatDuration(2_700, en))
        assertFalse(formatDuration(6_300, ar).contains("h"))
    }

    @Test
    fun widgetMatchesAreKeptAsIs() {
        // Guard against accidental mutation of the football model used by the widget.
        val match = FootballMatch(league = "L", home = "A", away = "B", score = "1-0", minute = "10'", isLive = true)
        assertEquals("1" to "0", parseScore(match.score))
    }
}
