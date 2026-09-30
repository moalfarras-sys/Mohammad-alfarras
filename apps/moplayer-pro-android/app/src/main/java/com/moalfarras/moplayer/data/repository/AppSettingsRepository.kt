package com.moalfarras.moplayer.data.repository

import android.content.Context
import android.util.Log
import androidx.datastore.core.DataMigration
import androidx.datastore.core.DataStore
import androidx.datastore.core.handlers.ReplaceFileCorruptionHandler
import androidx.datastore.preferences.core.MutablePreferences
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.mutablePreferencesOf
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.moalfarras.moplayer.domain.model.AccentMode
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.LibraryMode
import com.moalfarras.moplayer.domain.model.ManualWeatherEffect
import com.moalfarras.moplayer.domain.model.MotionLevel
import com.moalfarras.moplayer.domain.model.NavigationSnapshot
import com.moalfarras.moplayer.domain.model.PerformanceMode
import com.moalfarras.moplayer.domain.model.SortOption
import com.moalfarras.moplayer.domain.model.ThemePreset
import com.moalfarras.moplayer.domain.model.UiScale
import com.moalfarras.moplayer.domain.model.VideoSizeMode
import com.moalfarras.moplayer.domain.model.WeatherMode
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.IOException
import java.security.MessageDigest
import java.security.SecureRandom

private const val TAG = "AppSettings"

// Keys shared by the data stores and their migrations.
private val lastSectionKey = stringPreferencesKey("last_section")
private val lastFocusStateKey = stringPreferencesKey("last_focus_state")
private val lastCategoryStateKey = stringPreferencesKey("last_category_state")
private val navMigratedKey = booleanPreferencesKey("nav_migrated")
private val settingsSchemaKey = intPreferencesKey("settings_schema")
private val weatherModeKey = stringPreferencesKey("weather_mode")
private val weatherCityOverrideKey = stringPreferencesKey("weather_city_override")
private val userOverriddenKeysKey = stringSetPreferencesKey("user_overridden_keys")

// A damaged file (power cut on cheap eMMC) is replaced with defaults instead of crashing on every launch.
private val Context.settingsDataStore by preferencesDataStore(
    name = "mo_settings",
    corruptionHandler = ReplaceFileCorruptionHandler { emptyPreferences() },
    produceMigrations = { listOf(SettingsSchemaMigration) },
)

// Navigation snapshot (last section, focused item, category per section) lives in its own file so
// D-pad focus moves never rewrite or re-emit the settings.
private val Context.navigationDataStore by preferencesDataStore(
    name = "mo_nav_state",
    corruptionHandler = ReplaceFileCorruptionHandler { emptyPreferences() },
    produceMigrations = { context -> listOf(LegacyNavigationMigration(context.settingsDataStore)) },
)

class AppSettingsRepository internal constructor(
    private val settingsStore: DataStore<Preferences>,
    private val navigationStore: DataStore<Preferences>,
    private val writeScope: CoroutineScope,
) {
    constructor(
        context: Context,
        writeScope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO),
    ) : this(context.settingsDataStore, context.navigationDataStore, writeScope)

    private val previewKey = booleanPreferencesKey("preview_enabled")
    private val trailerPreviewKey = booleanPreferencesKey("trailer_preview_enabled")
    private val accentKey = longPreferencesKey("accent_color")
    private val accentModeKey = stringPreferencesKey("accent_mode")
    private val backgroundModeKey = stringPreferencesKey("background_mode")
    private val customBackgroundUrlKey = stringPreferencesKey("custom_background_url")
    private val remoteBackgroundUrlKey = stringPreferencesKey("remote_background_url")
    private val themePresetKey = stringPreferencesKey("theme_preset")
    private val uiScaleKey = stringPreferencesKey("ui_scale")
    private val motionLevelKey = stringPreferencesKey("motion_level")
    private val performanceModeKey = stringPreferencesKey("performance_mode")
    private val videoSizeModeKey = stringPreferencesKey("video_size_mode")
    private val showWeatherWidgetKey = booleanPreferencesKey("show_weather_widget")
    private val showClockWidgetKey = booleanPreferencesKey("show_clock_widget")
    private val showFootballWidgetKey = booleanPreferencesKey("show_football_widget")

    // User's own trailer switch — intentionally ABSENT from applyRemoteConfig so a remote sync
    // can never flip the user's choice (unlike trailerPreviewKey, which is admin-owned).
    private val showTrailerPreviewsKey = booleanPreferencesKey("show_trailer_previews")
    private val manualWeatherEffectKey = stringPreferencesKey("manual_weather_effect")
    private val remoteWeatherCityKey = stringPreferencesKey("remote_weather_city")
    private val footballMaxMatchesKey = intPreferencesKey("football_max_matches")
    private val playerKey = stringPreferencesKey("preferred_player")
    private val sortKey = stringPreferencesKey("default_sort")
    private val parentalKey = booleanPreferencesKey("parental_enabled")
    private val parentalPinKey = stringPreferencesKey("parental_pin_hash")
    private val parentalPinSaltKey = stringPreferencesKey("parental_pin_salt")
    private val autoPlayLastLiveKey = booleanPreferencesKey("auto_play_last_live")
    private val hideEmptyCategoriesKey = booleanPreferencesKey("hide_empty_categories")
    private val hideChannelsWithoutLogoKey = booleanPreferencesKey("hide_channels_without_logo")
    private val searchHistoryKey = stringPreferencesKey("search_history")
    private val languageKey = stringPreferencesKey("language")
    private val libraryModeKey = stringPreferencesKey("library_mode")
    private val homeNotificationModeKey = stringPreferencesKey("home_notification_mode")
    private val homeNotificationTypeKey = stringPreferencesKey("home_notification_type")
    private val homeNotificationTitleKey = stringPreferencesKey("home_notification_title")
    private val homeNotificationMessageKey = stringPreferencesKey("home_notification_message")
    private val homeNotificationTargetDateKey = stringPreferencesKey("home_notification_target_date")
    private val legacyWorldCupModeKey = stringPreferencesKey("world_cup_mode")

    private val navigationLock = Mutex()
    private var latestNavigation: NavigationSnapshot? = null
    private var persistedNavigation: NavigationSnapshot? = null
    private var navigationWriteJob: Job? = null

    /**
     * Settings, re-emitted only when a setting actually changes. The navigation fields carry the
     * snapshot saved when collection started (used once to restore the last screen); later focus
     * moves are written to the separate navigation store and do not re-emit this flow.
     */
    val settings: Flow<AppSettings> = combine(
        settingsStore.data.catch { error -> emit(readFailureFallback(error)) },
        flow { emit(readNavigationState()) },
    ) { prefs, navigation -> prefs.toAppSettings(navigation) }
        .distinctUntilChanged()

    private fun Preferences.toAppSettings(navigation: NavigationSnapshot): AppSettings {
        val prefs = this
        val storedPlayer = prefs[playerKey] ?: "auto"
        val storedSort = prefs[sortKey] ?: SortOption.SERVER_ORDER.name
        val storedLibraryMode = prefs[libraryModeKey] ?: LibraryMode.ACTIVE_SOURCE.name
        return AppSettings(
            previewEnabled = prefs[previewKey] ?: true,
            trailerPreviewEnabled = prefs[trailerPreviewKey] ?: true,
            showTrailerPreviews = prefs[showTrailerPreviewsKey] ?: true,
            accentColor = prefs[accentKey] ?: 0xFFFF9248,
            accentMode = AccentMode.CUSTOM,
            backgroundMode = prefs[backgroundModeKey].toEnum(BackgroundMode.AUTO),
            customBackgroundUrl = prefs[customBackgroundUrlKey].orEmpty(),
            remoteBackgroundUrl = prefs[remoteBackgroundUrlKey].orEmpty(),
            themePreset = prefs[themePresetKey].toEnum(ThemePreset.CINEMATIC_AUTO),
            uiScale = prefs[uiScaleKey].toEnum(UiScale.STANDARD),
            motionLevel = prefs[motionLevelKey].toEnum(MotionLevel.BALANCED),
            performanceMode = prefs[performanceModeKey].toEnum(PerformanceMode.AUTO),
            videoSizeMode = prefs[videoSizeModeKey].toEnum(VideoSizeMode.AUTO),
            showWeatherWidget = prefs[showWeatherWidgetKey] ?: true,
            showClockWidget = prefs[showClockWidgetKey] ?: true,
            showFootballWidget = prefs[showFootballWidgetKey] ?: true,
            weatherMode = prefs[weatherModeKey].toEnum(WeatherMode.AUTO_IP),
            manualWeatherEffect = prefs[manualWeatherEffectKey].toEnum(ManualWeatherEffect.SUNNY),
            // The admin city is only a default for City mode; the user's own city always wins.
            weatherCityOverride = prefs[weatherCityOverrideKey].orEmpty().ifBlank { prefs[remoteWeatherCityKey].orEmpty() },
            footballMaxMatches = (prefs[footballMaxMatchesKey] ?: 4).coerceIn(1, 8),
            preferredPlayer = if (storedPlayer == "internal") "auto" else storedPlayer,
            defaultSort = runCatching { SortOption.valueOf(storedSort) }.getOrDefault(SortOption.SERVER_ORDER),
            parentalControlsEnabled = prefs[parentalKey] ?: false,
            hasParentalPin = !prefs[parentalPinKey].isNullOrBlank(),
            autoPlayLastLive = prefs[autoPlayLastLiveKey] ?: false,
            hideEmptyCategories = prefs[hideEmptyCategoriesKey] ?: false,
            hideChannelsWithoutLogo = prefs[hideChannelsWithoutLogoKey] ?: false,
            searchHistory = prefs[searchHistoryKey]?.split('\n')?.map(String::trim)?.filter(String::isNotBlank) ?: emptyList(),
            languageTag = prefs[languageKey] ?: "system",
            lastSection = navigation.section,
            lastFocusState = navigation.focusState,
            lastCategoryState = navigation.categoryState,
            libraryMode = runCatching { LibraryMode.valueOf(storedLibraryMode) }.getOrDefault(LibraryMode.ACTIVE_SOURCE),
            homeNotificationMode = prefs[homeNotificationModeKey] ?: prefs[legacyWorldCupModeKey] ?: "auto",
            homeNotificationType = prefs[homeNotificationTypeKey] ?: "world_cup_2026",
            homeNotificationTitle = prefs[homeNotificationTitleKey].orEmpty(),
            homeNotificationMessage = prefs[homeNotificationMessageKey].orEmpty(),
            homeNotificationTargetDate = prefs[homeNotificationTargetDateKey].orEmpty(),
        )
    }

    /**
     * A read error other than corruption (which the handler above repairs) falls back to defaults,
     * except that parental controls fail closed: a transient error must not unlock adult categories.
     */
    private fun readFailureFallback(error: Throwable): Preferences {
        if (error !is IOException) throw error
        Log.w(TAG, "Settings read failed; using defaults", error)
        return mutablePreferencesOf(parentalKey to true)
    }

    /** Writes a setting; a failed write (disk full on a TV box) is logged instead of crashing the app. */
    private suspend fun safeEdit(transform: suspend (MutablePreferences) -> Unit) {
        try {
            settingsStore.edit(transform)
        } catch (error: IOException) {
            Log.w(TAG, "Settings write failed", error)
        }
    }

    /** A setting the admin config also manages: remember that the user chose it, so remote config leaves it alone. */
    private suspend fun editUserSetting(key: Preferences.Key<*>, transform: (MutablePreferences) -> Unit) {
        safeEdit { prefs ->
            transform(prefs)
            prefs[userOverriddenKeysKey] = prefs[userOverriddenKeysKey].orEmpty() + key.name
        }
    }

    suspend fun setPreviewEnabled(value: Boolean) {
        safeEdit { it[previewKey] = value }
    }

    suspend fun setAccentColor(value: Long) {
        safeEdit { it[accentKey] = value }
    }

    suspend fun setAccentMode(value: AccentMode) {
        safeEdit { it[accentModeKey] = value.name }
    }

    suspend fun setBackgroundMode(value: BackgroundMode) {
        safeEdit { it[backgroundModeKey] = value.name }
    }

    suspend fun setCustomBackgroundUrl(value: String) {
        safeEdit { it[customBackgroundUrlKey] = value.trim() }
    }

    suspend fun setThemePreset(value: ThemePreset) {
        safeEdit { it[themePresetKey] = value.name }
    }

    suspend fun setUiScale(value: UiScale) {
        safeEdit { it[uiScaleKey] = value.name }
    }

    suspend fun setMotionLevel(value: MotionLevel) {
        safeEdit { it[motionLevelKey] = value.name }
    }

    suspend fun setPerformanceMode(value: PerformanceMode) {
        safeEdit { it[performanceModeKey] = value.name }
    }

    suspend fun setVideoSizeMode(value: VideoSizeMode) {
        safeEdit { it[videoSizeModeKey] = value.name }
    }

    suspend fun setShowWeatherWidget(value: Boolean) {
        editUserSetting(showWeatherWidgetKey) { it[showWeatherWidgetKey] = value }
    }

    suspend fun setShowClockWidget(value: Boolean) {
        safeEdit { it[showClockWidgetKey] = value }
    }

    suspend fun setShowFootballWidget(value: Boolean) {
        editUserSetting(showFootballWidgetKey) { it[showFootballWidgetKey] = value }
    }

    suspend fun setShowTrailerPreviews(value: Boolean) {
        safeEdit { it[showTrailerPreviewsKey] = value }
    }

    suspend fun setWeatherMode(value: WeatherMode) {
        editUserSetting(weatherModeKey) { it[weatherModeKey] = value.name }
    }

    suspend fun setManualWeatherEffect(value: ManualWeatherEffect) {
        safeEdit { it[manualWeatherEffectKey] = value.name }
    }

    suspend fun setWeatherCityOverride(value: String) {
        editUserSetting(weatherCityOverrideKey) { it[weatherCityOverrideKey] = value.trim().take(80) }
    }

    suspend fun setFootballMaxMatches(value: Int) {
        editUserSetting(footballMaxMatchesKey) { it[footballMaxMatchesKey] = value.coerceIn(1, 8) }
    }

    /**
     * Applies the admin config fetched at start. Admin-only values (trailer switch, home
     * notification, background) always follow the admin. Values the user can also set (widget
     * switches, match count) follow the admin only until the user changes them; the admin city is
     * stored separately and only fills City mode when the user has not typed a city — it never
     * switches the weather mode. A config equal to [AppRemoteConfig] defaults is what
     * [AppRemoteConfigService.fetchConfig] returns when the fetch failed (offline start); it is
     * ignored so the last admin values, including the kill switches, stay in force.
     *
     * @return false when the config was ignored.
     */
    suspend fun applyRemoteConfig(config: AppRemoteConfig): Boolean {
        if (config == AppRemoteConfig()) return false
        safeEdit { prefs ->
            val userChosen = prefs[userOverriddenKeysKey].orEmpty()
            fun <T> adminDefault(key: Preferences.Key<T>, value: T) {
                if (key.name !in userChosen) prefs[key] = value
            }
            prefs[trailerPreviewKey] = config.trailerPreviewEnabled
            adminDefault(showWeatherWidgetKey, config.weatherEnabled)
            adminDefault(showFootballWidgetKey, config.footballEnabled)
            adminDefault(footballMaxMatchesKey, config.footballMaxMatches.coerceIn(1, 8))
            prefs[remoteWeatherCityKey] = config.weatherCity.trim().take(80)
            prefs[homeNotificationModeKey] = config.homeNotificationMode.ifBlank { "auto" }
            prefs[homeNotificationTypeKey] = config.homeNotificationType.ifBlank { "world_cup_2026" }
            prefs[homeNotificationTitleKey] = config.homeNotificationTitle.trim().take(80)
            prefs[homeNotificationMessageKey] = config.homeNotificationMessage.trim().take(160)
            prefs[homeNotificationTargetDateKey] = config.homeNotificationTargetDate.trim().take(10)
            prefs[remoteBackgroundUrlKey] = config.backgroundUrl.trim()
        }
        return true
    }

    suspend fun setPreferredPlayer(value: String) {
        safeEdit { it[playerKey] = value }
    }

    suspend fun setDefaultSort(value: SortOption) {
        safeEdit { it[sortKey] = value.name }
    }

    suspend fun setParentalControlsEnabled(value: Boolean) {
        safeEdit { it[parentalKey] = value }
    }

    // PIN changes keep the throwing edit: callers report a failed change instead of silently ignoring it.
    suspend fun setParentalPin(pin: String) {
        val normalized = pin.trim()
        require(normalized.length >= 4) { "PIN must be at least 4 digits" }
        val salt = randomSalt()
        settingsStore.edit {
            it[parentalPinSaltKey] = salt
            it[parentalPinKey] = "$salt:${normalized.sha256(salt)}"
        }
    }

    suspend fun clearParentalPin() {
        settingsStore.edit {
            it.remove(parentalPinKey)
            it.remove(parentalPinSaltKey)
        }
    }

    suspend fun verifyParentalPin(pin: String): Boolean {
        val current = settingsStore.data.map { it[parentalPinKey].orEmpty() }.first()
        if (current.isBlank()) return true
        val salt = current.substringBefore(':', missingDelimiterValue = "")
        val hash = current.substringAfter(':', missingDelimiterValue = current)
        if (salt.isBlank()) {
            return pin.trim().legacySha256() == hash
        }
        return pin.trim().sha256(salt) == hash
    }

    suspend fun setAutoPlayLastLive(value: Boolean) {
        safeEdit { it[autoPlayLastLiveKey] = value }
    }

    suspend fun setHideEmptyCategories(value: Boolean) {
        safeEdit { it[hideEmptyCategoriesKey] = value }
    }

    suspend fun setHideChannelsWithoutLogo(value: Boolean) {
        safeEdit { it[hideChannelsWithoutLogoKey] = value }
    }

    suspend fun addSearchHistory(query: String) {
        val normalized = query.trim()
        if (normalized.isBlank()) return
        safeEdit { prefs ->
            val existing = prefs[searchHistoryKey]?.split('\n')?.map(String::trim)?.filter(String::isNotBlank).orEmpty()
            prefs[searchHistoryKey] = (listOf(normalized) + existing.filterNot { it.equals(normalized, ignoreCase = true) })
                .take(10)
                .joinToString("\n")
        }
    }

    suspend fun clearSearchHistory() {
        safeEdit { it.remove(searchHistoryKey) }
    }

    suspend fun setLanguage(value: String) {
        safeEdit { it[languageKey] = value }
    }

    suspend fun setLastSection(value: String) {
        updateNavigation { it.copy(section = value) }
    }

    /**
     * Remembers where the user is. Cheap enough to call on every focus move: identical snapshots
     * are skipped and the file is written once the user pauses for [NAVIGATION_WRITE_DELAY_MS]
     * (or on [flushNavigationState]).
     */
    suspend fun setLastNavigationState(section: String, focusState: String, categoryState: String) {
        updateNavigation { NavigationSnapshot(section, focusState, categoryState) }
    }

    /** Latest navigation snapshot, including one still waiting to be written. */
    suspend fun readNavigationState(): NavigationSnapshot {
        navigationLock.withLock { latestNavigation }?.let { return it }
        val stored = navigationStore.data
            .catch { error -> if (error is IOException) emit(emptyPreferences()) else throw error }
            .first()
        return NavigationSnapshot(
            section = stored[lastSectionKey] ?: "HOME",
            focusState = stored[lastFocusStateKey].orEmpty(),
            categoryState = stored[lastCategoryStateKey].orEmpty(),
        )
    }

    /** Writes a pending navigation snapshot now. Call when the app goes to the background. */
    suspend fun flushNavigationState() {
        navigationLock.withLock { navigationWriteJob?.cancel() }
        writeNavigation()
    }

    private suspend fun updateNavigation(transform: (NavigationSnapshot) -> NavigationSnapshot) {
        val base = navigationLock.withLock { latestNavigation } ?: readNavigationState()
        navigationLock.withLock {
            val next = transform(latestNavigation ?: base)
            if (next == latestNavigation || (latestNavigation == null && next == base)) return
            latestNavigation = next
            navigationWriteJob?.cancel()
            navigationWriteJob = writeScope.launch {
                delay(NAVIGATION_WRITE_DELAY_MS)
                writeNavigation()
            }
        }
    }

    private suspend fun writeNavigation() {
        val snapshot = navigationLock.withLock {
            latestNavigation?.takeIf { it != persistedNavigation }
        } ?: return
        try {
            navigationStore.edit {
                it[lastSectionKey] = snapshot.section
                it[lastFocusStateKey] = snapshot.focusState
                it[lastCategoryStateKey] = snapshot.categoryState
            }
            navigationLock.withLock { persistedNavigation = snapshot }
        } catch (error: IOException) {
            Log.w(TAG, "Navigation state write failed", error)
        }
    }

    suspend fun setLibraryMode(value: LibraryMode) {
        safeEdit { it[libraryModeKey] = value.name }
    }

    private companion object {
        const val NAVIGATION_WRITE_DELAY_MS = 1_500L
    }
}

/**
 * v2 of mo_settings. Builds before 2.7 forced the admin city ("Berlin") and City mode on every
 * launch; undo that once so those users get their local weather again. A user who really chose
 * Berlin can pick it again, and from now on the choice is remembered.
 */
internal object SettingsSchemaMigration : DataMigration<Preferences> {
    private const val CURRENT_SCHEMA = 2
    private const val LEGACY_FORCED_CITY = "Berlin"

    override suspend fun shouldMigrate(currentData: Preferences): Boolean =
        (currentData[settingsSchemaKey] ?: 1) < CURRENT_SCHEMA

    override suspend fun migrate(currentData: Preferences): Preferences {
        val prefs = currentData.toMutablePreferences()
        if (prefs[weatherModeKey] == WeatherMode.CITY.name &&
            prefs[weatherCityOverrideKey].orEmpty().trim().equals(LEGACY_FORCED_CITY, ignoreCase = true)
        ) {
            prefs.remove(weatherModeKey)
            prefs.remove(weatherCityOverrideKey)
        }
        prefs[settingsSchemaKey] = CURRENT_SCHEMA
        return prefs.toPreferences()
    }

    override suspend fun cleanUp() = Unit
}

/** Moves the navigation snapshot out of mo_settings (where every focus move used to rewrite it). */
internal class LegacyNavigationMigration(private val settingsStore: DataStore<Preferences>) : DataMigration<Preferences> {
    override suspend fun shouldMigrate(currentData: Preferences): Boolean = currentData[navMigratedKey] != true

    override suspend fun migrate(currentData: Preferences): Preferences {
        val prefs = currentData.toMutablePreferences()
        val legacy = try {
            settingsStore.data.first()
        } catch (error: IOException) {
            emptyPreferences()
        }
        legacy[lastSectionKey]?.let { prefs[lastSectionKey] = it }
        legacy[lastFocusStateKey]?.let { prefs[lastFocusStateKey] = it }
        legacy[lastCategoryStateKey]?.let { prefs[lastCategoryStateKey] = it }
        prefs[navMigratedKey] = true
        return prefs.toPreferences()
    }

    override suspend fun cleanUp() {
        try {
            settingsStore.edit {
                it.remove(lastSectionKey)
                it.remove(lastFocusStateKey)
                it.remove(lastCategoryStateKey)
            }
        } catch (error: IOException) {
            Log.w(TAG, "Could not remove legacy navigation keys", error)
        }
    }
}

private fun String.sha256(salt: String): String {
    val bytes = MessageDigest.getInstance("SHA-256").digest("$salt:$this".toByteArray(Charsets.UTF_8))
    return bytes.joinToString("") { "%02x".format(it) }
}

private fun String.legacySha256(): String {
    val bytes = MessageDigest.getInstance("SHA-256").digest(toByteArray(Charsets.UTF_8))
    return bytes.joinToString("") { "%02x".format(it) }
}

private fun randomSalt(): String {
    val bytes = ByteArray(16)
    SecureRandom().nextBytes(bytes)
    return bytes.joinToString("") { "%02x".format(it) }
}

private inline fun <reified T : Enum<T>> String?.toEnum(default: T): T {
    return this?.let { runCatching { enumValueOf<T>(it) }.getOrNull() } ?: default
}
