package com.mo.moplayer.util

import android.content.Context
import android.graphics.Color
import androidx.core.content.ContextCompat
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

private val Context.themeDataStore: DataStore<Preferences> by
    preferencesDataStore(name = "theme_settings")

@Singleton
class ThemeManager @Inject constructor(@ApplicationContext private val context: Context) {

    enum class AppThemeId {
        LIQUID_BLUE,
        HTC_ORANGE
    }

    enum class AccentId {
        BLUE,
        CYAN,
        PURPLE,
        ORANGE,
        GOLD,
        PINK,
        WHITE,
        GREEN
    }

    data class ThemeColor(val name: String, val color: Int, val accentId: AccentId)
    data class AccentOption(val id: AccentId, val displayName: String, val color: Int)
    data class AppTheme(
        val id: AppThemeId,
        val displayName: String,
        val defaultAccent: AccentId,
        val allowedAccents: Set<AccentId>
    )

    companion object {
        private val LEGACY_ACCENT_COLOR_KEY = intPreferencesKey("accent_color")
        private val LEGACY_THEME_NAME_KEY = stringPreferencesKey("theme_name")

        private val ACTIVE_THEME_ID_KEY = stringPreferencesKey("active_theme_id")
        private val ACTIVE_ACCENT_ID_KEY = stringPreferencesKey("active_accent_id")

        val DEFAULT_THEME_ID = AppThemeId.LIQUID_BLUE
        val DEFAULT_ACCENT_ID = AccentId.BLUE
        val DEFAULT_ACCENT_COLOR = Color.parseColor("#4F8BFF")

        private val ACCENT_OPTIONS =
            mapOf(
                AccentId.BLUE to AccentOption(AccentId.BLUE, "Royal Blue", Color.parseColor("#4F8BFF")),
                AccentId.CYAN to AccentOption(AccentId.CYAN, "Cyan", Color.parseColor("#00E5FF")),
                AccentId.PURPLE to AccentOption(AccentId.PURPLE, "Neon Indigo", Color.parseColor("#7C6BFF")),
                AccentId.ORANGE to AccentOption(AccentId.ORANGE, "Orange", Color.parseColor("#FF8800")),
                AccentId.GOLD to AccentOption(AccentId.GOLD, "Gold", Color.parseColor("#FFD700")),
                AccentId.PINK to AccentOption(AccentId.PINK, "Pink", Color.parseColor("#FF4081")),
                AccentId.WHITE to AccentOption(AccentId.WHITE, "White", Color.parseColor("#FFFFFF")),
                AccentId.GREEN to AccentOption(AccentId.GREEN, "HTC Green", Color.parseColor("#00FF88"))
            )

        private val THEMES =
            mapOf(
                AppThemeId.LIQUID_BLUE to
                    AppTheme(
                        id = AppThemeId.LIQUID_BLUE,
                        displayName = "Liquid Blue",
                        defaultAccent = AccentId.BLUE,
                        allowedAccents =
                            setOf(
                                AccentId.BLUE,
                                AccentId.CYAN,
                                AccentId.PURPLE,
                                AccentId.PINK,
                                AccentId.WHITE
                            )
                    ),
                AppThemeId.HTC_ORANGE to
                    AppTheme(
                        id = AppThemeId.HTC_ORANGE,
                        displayName = "HTC Orange",
                        defaultAccent = AccentId.ORANGE,
                        allowedAccents = setOf(AccentId.ORANGE, AccentId.GOLD, AccentId.GREEN)
                    )
            )
    }

    private val _currentAccentColor = MutableStateFlow(DEFAULT_ACCENT_COLOR)
    val currentAccentColor: StateFlow<Int> = _currentAccentColor

    private val _currentThemeName = MutableStateFlow(THEMES.getValue(DEFAULT_THEME_ID).displayName)
    val currentThemeName: StateFlow<String> = _currentThemeName

    private val _currentThemeId = MutableStateFlow(DEFAULT_THEME_ID)
    val currentThemeId: StateFlow<AppThemeId> = _currentThemeId

    private val _currentAccentId = MutableStateFlow(DEFAULT_ACCENT_ID)
    val currentAccentId: StateFlow<AccentId> = _currentAccentId

    private val _themeUpdateEvent = MutableSharedFlow<Int>(replay = 0)
    val themeUpdateEvent: SharedFlow<Int> = _themeUpdateEvent

    val accentColor: Flow<Int> = currentAccentColor
    val themeName: Flow<String> = currentThemeName

    init {
        runBlocking {
            loadPersistedTheme()
        }
    }

    suspend fun setActiveTheme(themeId: AppThemeId) {
        val currentAccent = _currentAccentId.value
        val normalizedAccent = normalizeAccentForTheme(themeId, currentAccent)
        applyThemeSelection(themeId, normalizedAccent, persist = true)
    }

    suspend fun setAccent(accentId: AccentId) {
        val themeId = _currentThemeId.value
        val normalizedAccent = normalizeAccentForTheme(themeId, accentId)
        applyThemeSelection(themeId, normalizedAccent, persist = true)
    }

    suspend fun setThemeAndAccent(themeId: AppThemeId, accentId: AccentId) {
        val normalizedAccent = normalizeAccentForTheme(themeId, accentId)
        applyThemeSelection(themeId, normalizedAccent, persist = true)
    }

    suspend fun setAccentColor(color: Int, name: String) {
        val accentId = accentIdFromName(name) ?: findAccentIdByColor(color) ?: DEFAULT_ACCENT_ID
        val themeId = themeIdFromName(name) ?: themeForAccent(accentId)
        setThemeAndAccent(themeId, accentId)
    }

    suspend fun broadcastThemeChange(color: Int) {
        _themeUpdateEvent.emit(color)
    }

    suspend fun setThemeFromPreset(preset: ThemeColor) {
        setThemeAndAccent(themeForAccent(preset.accentId), preset.accentId)
    }

    fun getPresetColors(): List<ThemeColor> {
        val theme = THEMES.getValue(_currentThemeId.value)
        return theme.allowedAccents.mapNotNull { accentId ->
            ACCENT_OPTIONS[accentId]?.let { ThemeColor(it.displayName, it.color, accentId) }
        }
    }

    fun getThemeDisplayName(themeId: AppThemeId): String = THEMES.getValue(themeId).displayName

    fun getFocusGlowColor(alpha: Int = 100): Int {
        val color = _currentAccentColor.value
        return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color))
    }

    fun getButtonAccentColor(alpha: Int = 40): Int {
        val color = _currentAccentColor.value
        return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color))
    }

    fun getDarkerAccentColor(): Int {
        val color = _currentAccentColor.value
        val factor = 0.7f
        return Color.rgb(
            (Color.red(color) * factor).toInt(),
            (Color.green(color) * factor).toInt(),
            (Color.blue(color) * factor).toInt()
        )
    }

    fun getDockIconColor(): Int = _currentAccentColor.value

    fun getFocusStrokeColor(alpha: Int = 255): Int {
        val color = _currentAccentColor.value
        return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color))
    }

    fun getTextPrimaryColor(context: Context): Int {
        return ContextCompat.getColor(context, android.R.color.white)
    }

    fun getTextSecondaryColor(context: Context, alpha: Int = 153): Int {
        return Color.argb(alpha, 255, 255, 255)
    }

    fun getTextTertiaryColor(context: Context, alpha: Int = 102): Int {
        return Color.argb(alpha, 255, 255, 255)
    }

    fun getOverlayBackgroundColor(alpha: Int = 200): Int {
        return Color.argb(alpha, 0, 0, 0)
    }

    fun getCardBackgroundColor(alpha: Int = 30): Int {
        return Color.argb(alpha, 255, 255, 255)
    }

    fun getProgressBarColor(): Int = _currentAccentColor.value

    fun getRatingBadgeColor(): Int = ACCENT_OPTIONS.getValue(AccentId.GOLD).color

    fun getQualityBadgeColor(): Int = _currentAccentColor.value

    fun getIconTintColor(): Int = _currentAccentColor.value

    fun getTextAccentColor(): Int = _currentAccentColor.value

    fun getLighterAccentColor(): Int {
        val color = _currentAccentColor.value
        val factor = 1.2f
        return Color.rgb(
            minOf(255, (Color.red(color) * factor).toInt()),
            minOf(255, (Color.green(color) * factor).toInt()),
            minOf(255, (Color.blue(color) * factor).toInt())
        )
    }

    private suspend fun loadPersistedTheme() {
        val prefs = context.themeDataStore.data.first()

        val persistedThemeId = prefs[ACTIVE_THEME_ID_KEY]?.let { parseThemeId(it) }
        val persistedAccentId = prefs[ACTIVE_ACCENT_ID_KEY]?.let { parseAccentId(it) }
        if (persistedThemeId != null && persistedAccentId != null) {
            applyThemeSelection(persistedThemeId, persistedAccentId, persist = false, emit = false)
            return
        }

        val legacyThemeName = prefs[LEGACY_THEME_NAME_KEY]
        val legacyAccentColor = prefs[LEGACY_ACCENT_COLOR_KEY]
        val migratedAccent = findAccentIdByColor(legacyAccentColor) ?: accentIdFromName(legacyThemeName) ?: DEFAULT_ACCENT_ID
        val migratedTheme = themeIdFromName(legacyThemeName) ?: themeForAccent(migratedAccent)
        applyThemeSelection(migratedTheme, migratedAccent, persist = true, emit = false)
    }

    private suspend fun applyThemeSelection(
        themeId: AppThemeId,
        accentId: AccentId,
        persist: Boolean,
        emit: Boolean = true
    ) {
        val normalizedAccent = normalizeAccentForTheme(themeId, accentId)
        val theme = THEMES.getValue(themeId)
        val accent = ACCENT_OPTIONS.getValue(normalizedAccent)

        if (persist) {
            context.themeDataStore.edit { prefs ->
                prefs[ACTIVE_THEME_ID_KEY] = themeId.name
                prefs[ACTIVE_ACCENT_ID_KEY] = normalizedAccent.name
                prefs[LEGACY_THEME_NAME_KEY] = theme.displayName
                prefs[LEGACY_ACCENT_COLOR_KEY] = accent.color
            }
        }

        _currentThemeId.value = themeId
        _currentThemeName.value = theme.displayName
        _currentAccentId.value = normalizedAccent
        _currentAccentColor.value = accent.color

        if (emit) {
            _themeUpdateEvent.emit(accent.color)
        }
    }

    private fun normalizeAccentForTheme(themeId: AppThemeId, accentId: AccentId): AccentId {
        val theme = THEMES.getValue(themeId)
        return if (theme.allowedAccents.contains(accentId)) accentId else theme.defaultAccent
    }

    private fun parseThemeId(value: String): AppThemeId? =
        runCatching { AppThemeId.valueOf(value) }.getOrNull()

    private fun parseAccentId(value: String): AccentId? =
        runCatching { AccentId.valueOf(value) }.getOrNull()

    private fun findAccentIdByColor(color: Int?): AccentId? {
        if (color == null) return null
        return ACCENT_OPTIONS.values.firstOrNull { it.color == color }?.id
    }

    private fun accentIdFromName(name: String?): AccentId? {
        val normalized = name?.trim()?.lowercase() ?: return null
        return ACCENT_OPTIONS.values.firstOrNull { option ->
            option.displayName.lowercase() == normalized
        }?.id
    }

    private fun themeIdFromName(name: String?): AppThemeId? {
        val normalized = name?.trim()?.lowercase() ?: return null
        return when {
            normalized.contains("htc") || normalized.contains("orange") || normalized.contains("gold") || normalized.contains("green") ->
                AppThemeId.HTC_ORANGE
            normalized.contains("liquid") || normalized.contains("blue") || normalized.contains("cyan") || normalized.contains("purple") || normalized.contains("pink") || normalized.contains("white") ->
                AppThemeId.LIQUID_BLUE
            else -> null
        }
    }

    private fun themeForAccent(accentId: AccentId): AppThemeId {
        return when (accentId) {
            AccentId.ORANGE, AccentId.GOLD, AccentId.GREEN -> AppThemeId.HTC_ORANGE
            else -> AppThemeId.LIQUID_BLUE
        }
    }
}
