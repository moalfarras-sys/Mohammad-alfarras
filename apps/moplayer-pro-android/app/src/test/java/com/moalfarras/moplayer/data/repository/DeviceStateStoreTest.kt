package com.moalfarras.moplayer.data.repository

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.emptyPreferences
import com.moalfarras.moplayer.domain.model.ActivatedProfile
import com.moalfarras.moplayer.domain.model.LoginKind
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

private class MemoryStore : DataStore<Preferences> {
    private val state = MutableStateFlow(emptyPreferences())
    override val data: Flow<Preferences> = state
    override suspend fun updateData(transform: suspend (t: Preferences) -> Preferences): Preferences =
        transform(state.value).also { state.value = it }
}

/** Reversible stand-in for the Keystore; [available] = false models a device without a working Keystore. */
private class FakeSealer(var available: Boolean = true) : SourceSealer {
    override fun seal(plain: ByteArray): String? = if (available) "sealed:" + String(plain.reversedArray(), Charsets.UTF_8) else null
    override fun open(sealed: String): ByteArray? =
        if (available && sealed.startsWith("sealed:")) sealed.removePrefix("sealed:").toByteArray(Charsets.UTF_8).reversedArray() else null
}

class DeviceStateStoreTest {
    private val profile = ActivatedProfile(
        name = "Panel",
        kind = LoginKind.XTREAM,
        baseUrl = "http://panel.example:8080",
        username = "alice",
        password = "s3cret",
        playlistUrl = "http://panel.example:8080/get.php?username=alice&password=s3cret",
        sourceId = "src-1",
        publicDeviceId = "MO-D-ABCDEFGHIJKLMNOPQRSTUVWX",
        sourcePullToken = "token",
    )

    @Test
    fun installIdIsCreatedOnceInTheWebsiteFormat() = runTest {
        val store = DeviceStateStore(MemoryStore(), FakeSealer())
        val first = store.installDeviceId()
        assertTrue(first, Regex("MO-D-[A-Z0-9]{24}").matches(first))
        assertEquals(first, store.installDeviceId())
        // A new process reading the same file keeps the id.
        val backing = MemoryStore()
        val id = DeviceStateStore(backing, FakeSealer()).installDeviceId()
        assertEquals(id, DeviceStateStore(backing, FakeSealer()).installDeviceId())
    }

    @Test
    fun qrSourceIsKeptSealedUntilCleared() = runTest {
        val backing = MemoryStore()
        val store = DeviceStateStore(backing, FakeSealer())
        assertTrue(store.savePendingActivation(PendingActivation(profile, savedAt = 1_000L, attempts = 1)))
        val raw = backing.data.first().asMap().values.joinToString()
        assertFalse("credentials must not be stored in clear text", raw.contains("s3cret"))
        assertEquals(PendingActivation(profile, 1_000L, 1), store.pendingActivation(nowMs = 5_000L))
        store.clearPendingActivation()
        assertNull(store.pendingActivation(nowMs = 5_000L))
    }

    @Test
    fun withoutAWorkingKeystoreNothingIsStored() = runTest {
        val backing = MemoryStore()
        val store = DeviceStateStore(backing, FakeSealer(available = false))
        assertFalse(store.savePendingActivation(PendingActivation(profile, savedAt = 1_000L, attempts = 1)))
        assertTrue(backing.data.first().asMap().isEmpty())
    }

    @Test
    fun oldOrExhaustedSourcesAreDropped() = runTest {
        val store = DeviceStateStore(MemoryStore(), FakeSealer())
        store.savePendingActivation(PendingActivation(profile, savedAt = 0L, attempts = 1))
        assertNull(store.pendingActivation(nowMs = PENDING_ACTIVATION_MAX_AGE_MS))
        // Dropped for good, not only filtered.
        assertNull(store.pendingActivation(nowMs = 1L))
        store.savePendingActivation(PendingActivation(profile, savedAt = 0L, attempts = PENDING_ACTIVATION_MAX_ATTEMPTS))
        assertNull(store.pendingActivation(nowMs = 1L))
    }

    @Test
    fun pendingRecordRoundTripsEveryField() {
        val pending = PendingActivation(profile.copy(kind = LoginKind.M3U, epgUrl = "http://epg"), savedAt = 42L, attempts = 2)
        assertEquals(pending, decodePendingActivation(encodePendingActivation(pending)))
        assertNull(decodePendingActivation("{not json"))
        assertNull(decodePendingActivation("""{"name":"x","kind":"SATELLITE"}"""))
        assertTrue(pendingActivationUsable(pending, nowMs = 42L))
        assertFalse(pendingActivationUsable(pending, nowMs = 41L))
    }

    @Test
    fun postponedPromptsAreRememberedPerKey() = runTest {
        val store = DeviceStateStore(MemoryStore(), FakeSealer())
        store.snoozeSubscriptionPrompt("xtream:a|expired|1", 100L)
        store.snoozeSubscriptionPrompt("xtream:b|banned|0", 200L)
        store.snoozeSubscriptionPrompt("xtream:a|expired|1", 300L)
        assertEquals(mapOf("xtream:a|expired|1" to 300L, "xtream:b|banned|0" to 200L), store.subscriptionPromptSnoozes.first())
        assertEquals(mapOf("a" to 1L), decodeSnoozes(encodeSnoozes(mapOf("a" to 1L))))
        val many = (1..40).associate { "k$it" to it.toLong() }
        assertEquals(20, decodeSnoozes(encodeSnoozes(many)).size)
        assertNotEquals(null, decodeSnoozes(encodeSnoozes(many))["k40"])
    }

    @Test
    fun unconfirmedAutoPlayIsReportedOnce() = runTest {
        val store = DeviceStateStore(MemoryStore(), FakeSealer())
        assertFalse(store.takeUnconfirmedAutoPlay())
        store.setAutoPlayArmed(true)
        assertTrue(store.takeUnconfirmedAutoPlay())
        assertFalse(store.takeUnconfirmedAutoPlay())
        store.setAutoPlayArmed(true)
        store.setAutoPlayArmed(false)
        assertFalse(store.takeUnconfirmedAutoPlay())
    }
}
