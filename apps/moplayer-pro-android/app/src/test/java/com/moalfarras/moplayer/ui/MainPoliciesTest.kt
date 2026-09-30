package com.moalfarras.moplayer.ui

import com.moalfarras.moplayer.data.repository.LiveZapScope
import com.moalfarras.moplayer.data.repository.SyncErrorKind
import com.moalfarras.moplayer.data.repository.SyncException
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.LoginKind
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.ServerProfile
import com.moalfarras.moplayer.ui.i18n.EnAppStrings
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.IOException

class MainPoliciesTest {
    private fun channel(categoryId: String = "news") = MediaItem(
        id = "7",
        serverId = 1,
        type = ContentType.LIVE,
        categoryId = categoryId,
        title = "Channel",
        streamUrl = "http://panel/live/u/p/7.ts",
    )

    // ── Zap context ───────────────────────────────────────────────────────

    @Test
    fun zapListFollowsTheListTheChannelWasStartedFrom() {
        val item = channel("sports")
        assertEquals(LiveZapScope.Category("news"), liveZapScopeFor(AppSection.LIVE, "news", "", item))
        assertEquals(LiveZapScope.AllChannels, liveZapScopeFor(AppSection.LIVE, "", "", item))
        assertEquals(LiveZapScope.Favorites, liveZapScopeFor(AppSection.FAVORITES, "", "", item))
        assertEquals(LiveZapScope.Search("bein"), liveZapScopeFor(AppSection.SEARCH, "", " bein ", item))
    }

    @Test
    fun zapListFallsBackToTheChannelsOwnGroup() {
        val item = channel("sports")
        // Home shelves, auto-play and a search too short to have results use the channel's group.
        assertEquals(LiveZapScope.Category("sports"), liveZapScopeFor(AppSection.HOME, "movies-cat", "", item))
        assertEquals(LiveZapScope.Category("sports"), liveZapScopeFor(AppSection.SEARCH, "", "b", item))
        assertEquals(LiveZapScope.Category("sports"), liveZapScopeFor(AppSection.PLAYER, "", "", item))
        assertEquals(LiveZapScope.AllChannels, liveZapScopeFor(AppSection.HOME, "", "", channel(categoryId = "")))
    }

    @Test
    fun smallZapListsLoadWhole() {
        assertEquals(ZapWindow(0, 800), zapWindowFor(800, 799, null))
        assertEquals(ZapWindow(0, ZAP_FULL_LIST_SIZE), zapWindowFor(ZAP_FULL_LIST_SIZE, 0, null))
    }

    @Test
    fun bigZapListLoadsAWindowAroundTheChannelBeyondRowOneThousand() {
        val size = 30_000
        val window = zapWindowFor(size, 12_345, null)
        assertEquals(2 * ZAP_WINDOW_RADIUS + 1, window.length)
        val indices = window.indices(size)
        assertEquals(12_345 - ZAP_WINDOW_RADIUS, indices.first())
        assertEquals(12_345 + ZAP_WINDOW_RADIUS, indices.last())
        // Both neighbours of the playing channel are loaded, so CH+ and CH- work.
        val position = window.positionOf(12_345, size)
        assertEquals(12_344, indices[position - 1])
        assertEquals(12_346, indices[position + 1])
    }

    @Test
    fun zapWindowStaysWhileThereIsRoomAndGrowsNearItsEnd() {
        val size = 30_000
        val first = zapWindowFor(size, 10_000, null)
        assertSame(first, zapWindowFor(size, 10_000 + ZAP_WINDOW_RADIUS - ZAP_WINDOW_MARGIN - 1, first))
        val grown = zapWindowFor(size, 10_000 + ZAP_WINDOW_RADIUS - 10, first)
        assertEquals(first.length + 2 * ZAP_WINDOW_RADIUS, grown.length)
        assertTrue(grown.positionOf(10_000 + ZAP_WINDOW_RADIUS - 10, size) in ZAP_WINDOW_MARGIN until grown.length - ZAP_WINDOW_MARGIN)
    }

    @Test
    fun zapWindowIsCappedAndMovesToAFarChannel() {
        val size = 30_000
        var window = zapWindowFor(size, 0, null)
        var index = 0
        repeat(40) {
            index += ZAP_WINDOW_RADIUS
            window = zapWindowFor(size, index, window)
        }
        assertTrue(window.length <= ZAP_MAX_WINDOW)
        val far = zapWindowFor(size, 25_000, window)
        assertEquals(2 * ZAP_WINDOW_RADIUS + 1, far.length)
        assertTrue(25_000 in far.indices(size))
    }

    @Test
    fun zapWindowWrapsAroundTheListEnds() {
        val size = 5_000
        val window = zapWindowFor(size, 0, null)
        val indices = window.indices(size)
        // CH- on the first channel reaches the last one, as on a receiver.
        assertEquals(size - 1, indices[window.positionOf(0, size) - 1])
    }

    @Test
    fun zapWindowThatGrowsPastTheListLoadsItWhole() {
        val size = 1_800
        var window = zapWindowFor(size, 900, null)
        window = zapWindowFor(size, 900 + ZAP_WINDOW_RADIUS - 5, window)
        assertEquals(4 * ZAP_WINDOW_RADIUS + 1, window.length)
        val nearEnd = (window.start + window.length - 50) % size
        assertEquals(ZapWindow(0, size), zapWindowFor(size, nearEnd, window))
    }

    // ── PIN throttle ──────────────────────────────────────────────────────

    @Test
    fun fiveWrongPinsLockEntryForThirtySeconds() {
        val throttle = PinAttemptThrottle()
        repeat(4) { assertEquals(0L, throttle.recordFailure(1_000L)) }
        assertEquals(30_000L, throttle.recordFailure(1_000L))
        assertEquals(10_000L, throttle.remainingLockMs(21_000L))
        assertEquals(0L, throttle.remainingLockMs(31_000L))
        assertEquals(10L, lockoutSeconds(9_001L))
    }

    @Test
    fun furtherLockoutsDoubleUpToTheCapAndACorrectPinResets() {
        val throttle = PinAttemptThrottle(maxFailures = 2, baseLockoutMs = 30_000L, maxLockoutMs = 100_000L)
        throttle.recordFailure(0L)
        assertEquals(30_000L, throttle.recordFailure(0L))
        throttle.recordFailure(40_000L)
        assertEquals(60_000L, throttle.recordFailure(40_000L))
        throttle.recordFailure(200_000L)
        assertEquals(100_000L, throttle.recordFailure(200_000L))
        throttle.recordSuccess()
        assertEquals(0L, throttle.remainingLockMs(200_000L))
        assertEquals(0L, throttle.recordFailure(200_000L))
    }

    // ── Incoming playlist links ───────────────────────────────────────────

    @Test
    fun launchLinkIsHandledOnlyOnAFreshLaunch() {
        assertTrue(shouldHandleLaunchIntent(restoredFromSavedState = false, launchedFromHistory = false))
        assertFalse(shouldHandleLaunchIntent(restoredFromSavedState = true, launchedFromHistory = false))
        assertFalse(shouldHandleLaunchIntent(restoredFromSavedState = false, launchedFromHistory = true))
    }

    @Test
    fun playlistKeyIsStableAndNeverContainsTheCredentials() {
        val url = "http://panel.example:8080/get.php?username=alice&password=secret&type=m3u_plus"
        val key = incomingPlaylistKey(url)
        assertEquals(key, incomingPlaylistKey("  $url "))
        assertNotEquals(key, incomingPlaylistKey(url.replace("alice", "bob")))
        assertFalse(key.contains("alice") || key.contains("secret"))
        assertEquals(24, key.length)
    }

    @Test
    fun confirmationShowsOnlyTheHost() {
        assertEquals("panel.example", playlistHostLabel("http://panel.example:8080/get.php?username=a&password=b"))
        assertEquals("cdn.example", playlistHostLabel("https://user:pass@cdn.example/list.m3u"))
        assertEquals("host.tv", playlistHostLabel("host.tv/get.php?username=a&password=b"))
    }

    // ── Expired-subscription prompt ───────────────────────────────────────

    @Test
    fun laterPostponesThePromptForADayPerAccountAndStatus() {
        val server = ServerProfile(id = 3, name = "A", kind = LoginKind.XTREAM, baseUrl = "http://a", accountStatus = "Expired", expiryDate = 1_700_000_000L, sourceKey = "xtream:abc")
        val key = subscriptionPromptKey(server)
        assertEquals("xtream:abc|expired|1700000000", key)
        assertNotEquals(key, subscriptionPromptKey(server.copy(expiryDate = 1_800_000_000L)))
        assertTrue(subscriptionPromptSnoozed(1_000L, 1_000L + SUBSCRIPTION_PROMPT_SNOOZE_MS - 1))
        assertFalse(subscriptionPromptSnoozed(1_000L, 1_000L + SUBSCRIPTION_PROMPT_SNOOZE_MS))
        assertFalse(subscriptionPromptSnoozed(null, 1_000L))
        assertEquals("id:9||0", subscriptionPromptKey(ServerProfile(id = 9, name = "B", kind = LoginKind.M3U, baseUrl = "")))
    }

    // ── Series details Back ───────────────────────────────────────────────

    @Test
    fun backFromSeriesDetailsReturnsWhereTheViewerCameFrom() {
        assertEquals(AppSection.HOME, seriesOriginFor(AppSection.HOME, AppSection.HOME, AppSection.SERIES))
        assertEquals(AppSection.SEARCH, seriesOriginFor(AppSection.SEARCH, AppSection.SEARCH, AppSection.SERIES))
        assertEquals(AppSection.FAVORITES, seriesOriginFor(AppSection.PLAYER, AppSection.FAVORITES, AppSection.SERIES))
        // Returning from an episode (the player returns to the detail page) keeps the first origin.
        assertEquals(AppSection.HOME, seriesOriginFor(AppSection.SERIES_DETAIL, AppSection.SERIES_DETAIL, AppSection.HOME))
        assertEquals(AppSection.HOME, seriesOriginFor(AppSection.PLAYER, AppSection.SERIES_DETAIL, AppSection.HOME))
    }

    // ── Failure messages ──────────────────────────────────────────────────

    @Test
    fun accountRejectionsEndAnActivationImportButNetworkFailuresCanBeRetried() {
        assertTrue(isFinalActivationImportFailure(SyncException(SyncErrorKind.ACCOUNT_EXPIRED)))
        assertTrue(isFinalActivationImportFailure(SyncException(SyncErrorKind.INVALID_CREDENTIALS)))
        assertTrue(isFinalActivationImportFailure(SyncException(SyncErrorKind.NOT_IPTV_API)))
        assertTrue(isFinalActivationImportFailure(IllegalArgumentException("bad link")))
        assertFalse(isFinalActivationImportFailure(SyncException(SyncErrorKind.TIMEOUT)))
        assertFalse(isFinalActivationImportFailure(SyncException(SyncErrorKind.SERVER_UNREACHABLE)))
        assertFalse(isFinalActivationImportFailure(IOException("reset")))
    }

    @Test
    fun acknowledgementCarriesAStableCodeOnly() {
        assertEquals("account_expired", activationAckCode(SyncException(SyncErrorKind.ACCOUNT_EXPIRED, host = "panel.example")))
        assertEquals("import_failed", activationAckCode(IllegalStateException("http://panel/get.php?username=a&password=b")))
    }

    @Test
    fun typedSyncErrorsKeepTheirLocalizedMessage() {
        val expired = SyncException(SyncErrorKind.ACCOUNT_EXPIRED)
        assertEquals(expired.message, activationImportReason(expired, EnAppStrings))
        assertEquals(EnAppStrings.activationImportGeneric, activationImportReason(IllegalStateException("raw"), EnAppStrings))
        assertEquals(EnAppStrings.backgroundRefreshFailed(expired.message), backgroundRefreshMessage(expired, EnAppStrings))
        assertEquals(EnAppStrings.backgroundRefreshRetryLater, backgroundRefreshMessage(IllegalStateException("x"), EnAppStrings))
        assertEquals(expired.message, expired.userMessage("fallback"))
        assertEquals("fallback", IllegalStateException("Unable to resolve host \"x\"").userMessage("fallback"))
        assertEquals(EnAppStrings.activationServiceUnavailable, activationServiceMessage(IOException("dns"), EnAppStrings))
        assertEquals(EnAppStrings.activationCreateFailed, activationServiceMessage(IllegalStateException("no code"), EnAppStrings))
    }
}
