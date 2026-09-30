package com.moalfarras.moplayer.data.repository

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.preferencesOf
import androidx.datastore.preferences.core.stringPreferencesKey
import com.moalfarras.moplayer.domain.model.NavigationSnapshot
import com.moalfarras.moplayer.domain.model.WeatherMode
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** In-memory preferences store; counts writes so tests can see what reached "disk". */
private class MemoryPreferencesStore(initial: Preferences = emptyPreferences()) : DataStore<Preferences> {
    private val state = MutableStateFlow(initial)
    private val lock = Mutex()
    var writes = 0
        private set

    override val data: Flow<Preferences> = state

    override suspend fun updateData(transform: suspend (t: Preferences) -> Preferences): Preferences = lock.withLock {
        val next = transform(state.value)
        if (next != state.value) {
            writes++
            state.value = next
        }
        next
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class AppSettingsRepositoryTest {
    private val lastSection = stringPreferencesKey("last_section")
    private val lastFocus = stringPreferencesKey("last_focus_state")
    private val weatherMode = stringPreferencesKey("weather_mode")
    private val weatherCity = stringPreferencesKey("weather_city_override")

    private val settingsStore = MemoryPreferencesStore()
    private val navigationStore = MemoryPreferencesStore()

    private fun TestScope.repository() = AppSettingsRepository(settingsStore, navigationStore, backgroundScope)

    private fun adminConfig(
        weatherEnabled: Boolean = true,
        footballMaxMatches: Int = 8,
        weatherCity: String = "Berlin",
        trailerPreviewEnabled: Boolean = true,
    ) = AppRemoteConfig(
        minimumVersionCode = 50,
        accentColor = "#ff9248",
        weatherEnabled = weatherEnabled,
        footballMaxMatches = footballMaxMatches,
        weatherCity = weatherCity,
        trailerPreviewEnabled = trailerPreviewEnabled,
    )

    @Test
    fun adminValuesApplyUntilTheUserChangesThatSetting() = runTest {
        val repo = repository()
        assertTrue(repo.applyRemoteConfig(adminConfig(weatherEnabled = false, footballMaxMatches = 6)))
        var settings = repo.settings.first()
        assertFalse(settings.showWeatherWidget)
        assertEquals(6, settings.footballMaxMatches)

        repo.setShowWeatherWidget(true)
        repo.applyRemoteConfig(adminConfig(weatherEnabled = false, footballMaxMatches = 2))
        settings = repo.settings.first()
        assertTrue("the user's switch survives the next launch", settings.showWeatherWidget)
        assertEquals("untouched settings keep following the admin", 2, settings.footballMaxMatches)
    }

    @Test
    fun offlineDefaultsNeverResetAdminSwitches() = runTest {
        val repo = repository()
        repo.applyRemoteConfig(adminConfig(trailerPreviewEnabled = false))
        val writes = settingsStore.writes
        assertFalse(repo.applyRemoteConfig(AppRemoteConfig()))
        assertEquals(writes, settingsStore.writes)
        assertFalse(repo.settings.first().trailerPreviewEnabled)
    }

    @Test
    fun adminCityIsOnlyACityModeDefault() = runTest {
        val repo = repository()
        repo.applyRemoteConfig(adminConfig(weatherCity = "Riyadh"))
        var settings = repo.settings.first()
        assertEquals(WeatherMode.AUTO_IP, settings.weatherMode)
        assertEquals("Riyadh", settings.weatherCityOverride)

        repo.setWeatherCityOverride("Dubai")
        repo.applyRemoteConfig(adminConfig(weatherCity = "Cairo"))
        settings = repo.settings.first()
        assertEquals("Dubai", settings.weatherCityOverride)
    }

    @Test
    fun navigationWritesAreDebouncedAndDoNotReEmitSettings() = runTest {
        val repo = repository()
        val emissions = mutableListOf<Any>()
        backgroundScope.launch { repo.settings.toList(emissions) }
        runCurrent()
        assertEquals(1, emissions.size)

        repo.setLastNavigationState("LIVE", "f1", "c1")
        repo.setLastNavigationState("LIVE", "f2", "c1")
        repo.setLastNavigationState("LIVE", "f3", "c1")
        repo.setLastNavigationState("LIVE", "f3", "c1")
        assertEquals(NavigationSnapshot("LIVE", "f3", "c1"), repo.readNavigationState())
        advanceTimeBy(1_000)
        runCurrent()
        assertEquals("nothing written while the user keeps moving", 0, navigationStore.writes)

        // Debounced work runs in the background scope, which advanceUntilIdle does not wait for.
        advanceTimeBy(501)
        runCurrent()
        assertEquals(1, navigationStore.writes)
        assertEquals("f3", navigationStore.data.first()[lastFocus])
        assertEquals("LIVE", navigationStore.data.first()[lastSection])
        assertEquals("focus moves never re-emit settings", 1, emissions.size)
        assertEquals(0, settingsStore.writes)
    }

    @Test
    fun unchangedNavigationIsNotWrittenAgain() = runTest {
        val repo = repository()
        repo.setLastSection("HOME")
        advanceTimeBy(5_000)
        runCurrent()
        assertEquals("HOME is already the stored default", 0, navigationStore.writes)
    }

    @Test
    fun flushWritesThePendingSnapshotImmediately() = runTest {
        val repo = repository()
        repo.setLastSection("MOVIES")
        repo.flushNavigationState()
        assertEquals("MOVIES", navigationStore.data.first()[lastSection])
    }

    @Test
    fun settingsCarryTheNavigationSavedByThePreviousSession() = runTest {
        navigationStore.edit {
            it[lastSection] = "SERIES"
            it[lastFocus] = "SERIES:1:42"
        }
        val settings = repository().settings.first()
        assertEquals("SERIES", settings.lastSection)
        assertEquals("SERIES:1:42", settings.lastFocusState)
    }

    @Test
    fun schemaMigrationUndoesTheForcedBerlinCityOnce() = runTest {
        val forced = preferencesOf(weatherMode to WeatherMode.CITY.name, weatherCity to "Berlin")
        assertTrue(SettingsSchemaMigration.shouldMigrate(forced))
        val migrated = SettingsSchemaMigration.migrate(forced)
        assertNull(migrated[weatherMode])
        assertNull(migrated[weatherCity])
        assertEquals(2, migrated[intPreferencesKey("settings_schema")])
        assertFalse(SettingsSchemaMigration.shouldMigrate(migrated))

        val chosen = preferencesOf(weatherMode to WeatherMode.CITY.name, weatherCity to "Dubai")
        assertEquals("Dubai", SettingsSchemaMigration.migrate(chosen)[weatherCity])
    }

    @Test
    fun legacyNavigationKeysMoveOutOfTheSettingsFile() = runTest {
        settingsStore.edit {
            it[lastSection] = "LIVE"
            it[lastFocus] = "LIVE:1:7"
        }
        val migration = LegacyNavigationMigration(settingsStore)
        assertTrue(migration.shouldMigrate(emptyPreferences()))
        val migrated = migration.migrate(emptyPreferences())
        assertEquals("LIVE", migrated[lastSection])
        assertEquals("LIVE:1:7", migrated[lastFocus])
        assertEquals(true, migrated[booleanPreferencesKey("nav_migrated")])
        assertFalse(migration.shouldMigrate(migrated))

        migration.cleanUp()
        assertNull(settingsStore.data.first()[lastSection])
    }
}
