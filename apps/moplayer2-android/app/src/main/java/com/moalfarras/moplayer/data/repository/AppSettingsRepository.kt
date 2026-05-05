package com.moalfarras.moplayer.data.repository

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.SortOption
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.security.SecureRandom
import java.security.MessageDigest

private val Context.settingsDataStore by preferencesDataStore("mo_settings")

class AppSettingsRepository(private val context: Context) {
    private val previewKey = booleanPreferencesKey("preview_enabled")
    private val accentKey = longPreferencesKey("accent_color")
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

    val settings: Flow<AppSettings> = context.settingsDataStore.data.map { prefs ->
        val storedPlayer = prefs[playerKey] ?: "media3"
        val storedSort = prefs[sortKey] ?: SortOption.SERVER_ORDER.name
        AppSettings(
            previewEnabled = prefs[previewKey] ?: true,
            accentColor = prefs[accentKey] ?: 0xFF4DA3FF,
            preferredPlayer = if (storedPlayer == "internal") "media3" else storedPlayer,
            defaultSort = runCatching { SortOption.valueOf(storedSort) }.getOrDefault(SortOption.SERVER_ORDER),
            parentalControlsEnabled = prefs[parentalKey] ?: false,
            hasParentalPin = !prefs[parentalPinKey].isNullOrBlank(),
            autoPlayLastLive = prefs[autoPlayLastLiveKey] ?: false,
            hideEmptyCategories = prefs[hideEmptyCategoriesKey] ?: false,
            hideChannelsWithoutLogo = prefs[hideChannelsWithoutLogoKey] ?: false,
            searchHistory = prefs[searchHistoryKey]?.split('\n')?.map(String::trim)?.filter(String::isNotBlank) ?: emptyList(),
            languageTag = prefs[languageKey] ?: "system",
            lastSection = prefs[lastSectionKey] ?: "HOME",
        )
    }

    suspend fun setPreviewEnabled(value: Boolean) {
        context.settingsDataStore.edit { it[previewKey] = value }
    }

    suspend fun setAccentColor(value: Long) {
        context.settingsDataStore.edit { it[accentKey] = value }
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
