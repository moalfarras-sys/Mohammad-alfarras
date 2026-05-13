package com.moalfarras.moplayer.data.repository

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.moalfarras.moplayer.domain.model.AccentMode
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.LibraryMode
import com.moalfarras.moplayer.domain.model.ManualWeatherEffect
import com.moalfarras.moplayer.domain.model.MotionLevel
import com.moalfarras.moplayer.domain.model.SortOption
import com.moalfarras.moplayer.domain.model.ThemePreset
import com.moalfarras.moplayer.domain.model.WeatherMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.security.SecureRandom
import java.security.MessageDigest

private val Context.settingsDataStore by preferencesDataStore("mo_settings")

class AppSettingsRepository(private val context: Context) {
    private val previewKey = booleanPreferencesKey("preview_enabled")
    private val accentKey = longPreferencesKey("accent_color")
    private val accentModeKey = stringPreferencesKey("accent_mode")
    private val backgroundModeKey = stringPreferencesKey("background_mode")
    private val customBackgroundUrlKey = stringPreferencesKey("custom_background_url")
    private val themePresetKey = stringPreferencesKey("theme_preset")
    private val motionLevelKey = stringPreferencesKey("motion_level")
    private val showWeatherWidgetKey = booleanPreferencesKey("show_weather_widget")
    private val showClockWidgetKey = booleanPreferencesKey("show_clock_widget")
    private val showFootballWidgetKey = booleanPreferencesKey("show_football_widget")
    private val weatherModeKey = stringPreferencesKey("weather_mode")
    private val manualWeatherEffectKey = stringPreferencesKey("manual_weather_effect")
    private val weatherCityOverrideKey = stringPreferencesKey("weather_city_override")
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
    private val lastSectionKey = stringPreferencesKey("last_section")
    private val libraryModeKey = stringPreferencesKey("library_mode")

    val settings: Flow<AppSettings> = context.settingsDataStore.data.map { prefs ->
        val storedPlayer = prefs[playerKey] ?: "auto"
        val storedSort = prefs[sortKey] ?: SortOption.SERVER_ORDER.name
        val storedLibraryMode = prefs[libraryModeKey] ?: LibraryMode.MERGED.name
        AppSettings(
            previewEnabled = prefs[previewKey] ?: true,
            accentColor = prefs[accentKey] ?: 0xFF4DA3FF,
            accentMode = prefs[accentModeKey].toEnum(AccentMode.DYNAMIC),
            backgroundMode = prefs[backgroundModeKey].toEnum(BackgroundMode.AUTO),
            customBackgroundUrl = prefs[customBackgroundUrlKey].orEmpty(),
            themePreset = prefs[themePresetKey].toEnum(ThemePreset.CINEMATIC_AUTO),
            motionLevel = prefs[motionLevelKey].toEnum(MotionLevel.BALANCED),
            showWeatherWidget = prefs[showWeatherWidgetKey] ?: true,
            showClockWidget = prefs[showClockWidgetKey] ?: true,
            showFootballWidget = prefs[showFootballWidgetKey] ?: true,
            weatherMode = prefs[weatherModeKey].toEnum(WeatherMode.AUTO_IP),
            manualWeatherEffect = prefs[manualWeatherEffectKey].toEnum(ManualWeatherEffect.SUNNY),
            weatherCityOverride = prefs[weatherCityOverrideKey].orEmpty(),
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
            lastSection = prefs[lastSectionKey] ?: "HOME",
            libraryMode = runCatching { LibraryMode.valueOf(storedLibraryMode) }.getOrDefault(LibraryMode.MERGED),
        )
    }

    suspend fun setPreviewEnabled(value: Boolean) {
        context.settingsDataStore.edit { it[previewKey] = value }
    }

    suspend fun setAccentColor(value: Long) {
        context.settingsDataStore.edit { it[accentKey] = value }
    }

    suspend fun setAccentMode(value: AccentMode) {
        context.settingsDataStore.edit { it[accentModeKey] = value.name }
    }

    suspend fun setBackgroundMode(value: BackgroundMode) {
        context.settingsDataStore.edit { it[backgroundModeKey] = value.name }
    }

    suspend fun setCustomBackgroundUrl(value: String) {
        context.settingsDataStore.edit { it[customBackgroundUrlKey] = value.trim() }
    }

    suspend fun setThemePreset(value: ThemePreset) {
        context.settingsDataStore.edit { it[themePresetKey] = value.name }
    }

    suspend fun setMotionLevel(value: MotionLevel) {
        context.settingsDataStore.edit { it[motionLevelKey] = value.name }
    }

    suspend fun setShowWeatherWidget(value: Boolean) {
        context.settingsDataStore.edit { it[showWeatherWidgetKey] = value }
    }

    suspend fun setShowClockWidget(value: Boolean) {
        context.settingsDataStore.edit { it[showClockWidgetKey] = value }
    }

    suspend fun setShowFootballWidget(value: Boolean) {
        context.settingsDataStore.edit { it[showFootballWidgetKey] = value }
    }

    suspend fun setWeatherMode(value: WeatherMode) {
        context.settingsDataStore.edit { it[weatherModeKey] = value.name }
    }

    suspend fun setManualWeatherEffect(value: ManualWeatherEffect) {
        context.settingsDataStore.edit { it[manualWeatherEffectKey] = value.name }
    }

    suspend fun setWeatherCityOverride(value: String) {
        context.settingsDataStore.edit { it[weatherCityOverrideKey] = value.trim().take(80) }
    }

    suspend fun setFootballMaxMatches(value: Int) {
        context.settingsDataStore.edit { it[footballMaxMatchesKey] = value.coerceIn(1, 8) }
    }

    suspend fun setPreferredPlayer(value: String) {
        context.settingsDataStore.edit { it[playerKey] = value }
    }

    suspend fun setDefaultSort(value: SortOption) {
        context.settingsDataStore.edit { it[sortKey] = value.name }
    }

    suspend fun setParentalControlsEnabled(value: Boolean) {
        context.settingsDataStore.edit { it[parentalKey] = value }
    }

    suspend fun setParentalPin(pin: String) {
        val normalized = pin.trim()
        require(normalized.length >= 4) { "PIN must be at least 4 digits" }
        val salt = randomSalt()
        context.settingsDataStore.edit {
            it[parentalPinSaltKey] = salt
            it[parentalPinKey] = "$salt:${normalized.sha256(salt)}"
        }
    }

    suspend fun clearParentalPin() {
        context.settingsDataStore.edit {
            it.remove(parentalPinKey)
            it.remove(parentalPinSaltKey)
        }
    }

    suspend fun verifyParentalPin(pin: String): Boolean {
        val current = context.settingsDataStore.data.map { it[parentalPinKey].orEmpty() }.first()
        if (current.isBlank()) return true
        val salt = current.substringBefore(':', missingDelimiterValue = "")
        val hash = current.substringAfter(':', missingDelimiterValue = current)
        if (salt.isBlank()) {
            return pin.trim().legacySha256() == hash
        }
        return pin.trim().sha256(salt) == hash
    }

    suspend fun setAutoPlayLastLive(value: Boolean) {
        context.settingsDataStore.edit { it[autoPlayLastLiveKey] = value }
    }

    suspend fun setHideEmptyCategories(value: Boolean) {
        context.settingsDataStore.edit { it[hideEmptyCategoriesKey] = value }
    }

    suspend fun setHideChannelsWithoutLogo(value: Boolean) {
        context.settingsDataStore.edit { it[hideChannelsWithoutLogoKey] = value }
    }

    suspend fun addSearchHistory(query: String) {
        val normalized = query.trim()
        if (normalized.isBlank()) return
        context.settingsDataStore.edit { prefs ->
            val existing = prefs[searchHistoryKey]?.split('\n')?.map(String::trim)?.filter(String::isNotBlank).orEmpty()
            prefs[searchHistoryKey] = (listOf(normalized) + existing.filterNot { it.equals(normalized, ignoreCase = true) })
                .take(10)
                .joinToString("\n")
        }
    }

    suspend fun clearSearchHistory() {
        context.settingsDataStore.edit { it.remove(searchHistoryKey) }
    }

    suspend fun setLanguage(value: String) {
        context.settingsDataStore.edit { it[languageKey] = value }
    }

    suspend fun setLastSection(value: String) {
        context.settingsDataStore.edit { it[lastSectionKey] = value }
    }

    suspend fun setLibraryMode(value: LibraryMode) {
        context.settingsDataStore.edit { it[libraryModeKey] = value.name }
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
