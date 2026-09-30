package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.domain.model.FootballMatch
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FootballWidgetFilterTest {
    private val now = 1_780_000_000_000L
    private val hour = 60 * 60 * 1000L

    private fun match(name: String, kickoff: Long, live: Boolean = false, finished: Boolean = false) = FootballMatch(
        league = "League",
        home = name,
        away = "B",
        score = if (finished || live) "1-0" else "",
        minute = "",
        isLive = live,
        kickoffEpochMs = kickoff,
        isFinished = finished,
    )

    @Test
    fun liveMatchesAreAlwaysRelevant() {
        assertTrue(match("live", kickoff = 0, live = true).isWidgetRelevant(now))
    }

    @Test
    fun staleFinishedResultsAreDropped() {
        assertTrue(match("fresh", now - 3 * hour, finished = true).isWidgetRelevant(now))
        assertFalse(match("old", now - 30 * 24 * hour, finished = true).isWidgetRelevant(now))
        assertFalse(match("unknown", kickoff = 0, finished = true).isWidgetRelevant(now))
    }

    @Test
    fun onlyNearUpcomingFixturesAreShown() {
        assertTrue(match("tonight", now + 5 * hour).isWidgetRelevant(now))
        assertFalse(match("next-week", now + 7 * 24 * hour).isWidgetRelevant(now))
        assertFalse(match("tbd", kickoff = 0).isWidgetRelevant(now))
    }

    @Test
    fun widgetIsEmptyWhenNothingIsRelevant() {
        // A finished tournament must never keep showing its old scores.
        val stale = listOf(match("a", now - 60 * 24 * hour, finished = true), match("b", now - 61 * 24 * hour, finished = true))
        assertTrue(stale.forWidget(4, now).isEmpty())
    }

    @Test
    fun liveFirstThenSoonestUpcomingThenRecentResults() {
        val list = listOf(
            match("result", now - 2 * hour, finished = true),
            match("later", now + 20 * hour),
            match("live", now - hour, live = true),
            match("soon", now + hour),
        )
        assertEquals(listOf("live", "soon", "later", "result"), list.forWidget(8, now).map { it.home })
        assertEquals(2, list.forWidget(2, now).size)
    }
}
