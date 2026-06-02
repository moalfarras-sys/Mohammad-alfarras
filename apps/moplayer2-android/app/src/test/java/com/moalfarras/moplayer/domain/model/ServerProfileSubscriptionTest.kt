package com.moalfarras.moplayer.domain.model

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Locks in the expired-subscription detection that drives the in-app "Subscription expired"
 * prompt and the cache-preserving sync guard.
 */
class ServerProfileSubscriptionTest {

    private fun xtream(status: String = "", expiry: Long = 0L) = ServerProfile(
        name = "Test",
        kind = LoginKind.XTREAM,
        baseUrl = "http://example.test/",
        accountStatus = status,
        expiryDate = expiry,
    )

    @Test
    fun activeAccountStaysUsable() {
        assertFalse(xtream(status = "Active").subscriptionInactive())
        assertFalse(xtream(status = "").subscriptionInactive())
    }

    @Test
    fun providerExpiredOrBannedStatusIsInactive() {
        assertTrue(xtream(status = "Expired").subscriptionInactive())
        assertTrue(xtream(status = "expired").subscriptionInactive())
        assertTrue(xtream(status = "Banned").subscriptionInactive())
        assertTrue(xtream(status = "Disabled").subscriptionInactive())
    }

    @Test
    fun pastExpiryDateInSecondsIsInactive() {
        val now = 1_800_000_000_000L // ms
        assertTrue(xtream(expiry = 1_700_000_000L).subscriptionInactive(now)) // seconds, before now
    }

    @Test
    fun futureExpiryDateIsUsable() {
        val now = 1_700_000_000_000L // ms
        assertFalse(xtream(expiry = 1_900_000_000L).subscriptionInactive(now)) // seconds, after now
    }

    @Test
    fun m3uPlaylistSourceNeverExpires() {
        val m3u = ServerProfile(
            name = "Playlist",
            kind = LoginKind.M3U,
            baseUrl = "",
            playlistUrl = "http://example.test/list.m3u",
        )
        assertFalse(m3u.subscriptionInactive())
    }
}
