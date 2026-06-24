package com.mo.moplayer.util

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.tvUiDataStore: DataStore<Preferences> by
    preferencesDataStore(name = "tv_ui_settings")

@Singleton
class TvUiPreferences @Inject constructor(@ApplicationContext private val context: Context) {

    enum class PosterSize(val storageValue: Int) {
        SMALL(0),
        MEDIUM(1),
        LARGE(2);

        companion object {
            fun fromStorage(value: Int): PosterSize =
                entries.firstOrNull { it.storageValue == value } ?: SMALL
        }
    }

    enum class LayoutStyle(val storageValue: Int) {
        ROWS(0),
        GRID(1);

        companion object {
            fun fromStorage(value: Int): LayoutStyle =
                entries.firstOrNull { it.storageValue == value } ?: GRID
        }
    }

    enum class BackgroundBehavior(val storageValue: Int) {
        STATIC(0),
        FOLLOW_PREVIEW(1);

        companion object {
            fun fromStorage(value: Int): BackgroundBehavior =
                entries.firstOrNull { it.storageValue == value } ?: FOLLOW_PREVIEW
        }
    }

    data class PosterMetrics(
        val widthDp: Int,
        val heightDp: Int,
        val contentHeightDp: Int,
        val titleTextSp: Float
    )

    companion object {
        private val POSTER_SIZE_KEY = intPreferencesKey("poster_size")
        private val LAYOUT_STYLE_KEY = intPreferencesKey("layout_style")
        private val BACKGROUND_BEHAVIOR_KEY = intPreferencesKey("background_behavior")
        private val ANIMATIONS_ENABLED_KEY = booleanPreferencesKey("animations_enabled")
        private val PLAYER_AUTO_HIDE_SECONDS_KEY = intPreferencesKey("player_auto_hide_seconds")

        const val PLAYER_AUTO_HIDE_DEFAULT_SECONDS = 4
    }

    val posterSize: Flow<PosterSize> = context.tvUiDataStore.data.map { prefs ->
        PosterSize.fromStorage(prefs[POSTER_SIZE_KEY] ?: PosterSize.MEDIUM.storageValue)
    }

    val layoutStyle: Flow<LayoutStyle> = context.tvUiDataStore.data.map { prefs ->
        LayoutStyle.fromStorage(prefs[LAYOUT_STYLE_KEY] ?: LayoutStyle.GRID.storageValue)
    }

    val animationsEnabled: Flow<Boolean> = context.tvUiDataStore.data.map { prefs ->
        prefs[ANIMATIONS_ENABLED_KEY] ?: true
    }

    val backgroundBehavior: Flow<BackgroundBehavior> = context.tvUiDataStore.data.map { prefs ->
        BackgroundBehavior.fromStorage(prefs[BACKGROUND_BEHAVIOR_KEY] ?: BackgroundBehavior.FOLLOW_PREVIEW.storageValue)
    }

    val playerAutoHideSeconds: Flow<Int> = context.tvUiDataStore.data.map { prefs ->
        (prefs[PLAYER_AUTO_HIDE_SECONDS_KEY] ?: PLAYER_AUTO_HIDE_DEFAULT_SECONDS).coerceIn(3, 5)
    }

    suspend fun setPosterSize(size: PosterSize) {
        context.tvUiDataStore.edit { prefs ->
            prefs[POSTER_SIZE_KEY] = size.storageValue
        }
    }

    suspend fun setLayoutStyle(style: LayoutStyle) {
        context.tvUiDataStore.edit { prefs ->
            prefs[LAYOUT_STYLE_KEY] = style.storageValue
        }
    }

    suspend fun setAnimationsEnabled(enabled: Boolean) {
        context.tvUiDataStore.edit { prefs ->
            prefs[ANIMATIONS_ENABLED_KEY] = enabled
        }
    }

    suspend fun setBackgroundBehavior(behavior: BackgroundBehavior) {
        context.tvUiDataStore.edit { prefs ->
            prefs[BACKGROUND_BEHAVIOR_KEY] = behavior.storageValue
        }
    }

    suspend fun setPlayerAutoHideSeconds(seconds: Int) {
        context.tvUiDataStore.edit { prefs ->
            prefs[PLAYER_AUTO_HIDE_SECONDS_KEY] = seconds.coerceIn(3, 5)
        }
    }

    fun posterMetrics(size: PosterSize): PosterMetrics {
        // Bumped ~30% across the board for a bolder, more cinematic grid. Title text grew too so
        // it stays legible at 10ft. MEDIUM is the new default (see posterSize flow above).
        return when (size) {
            PosterSize.SMALL -> PosterMetrics(widthDp = 92, heightDp = 138, contentHeightDp = 182, titleTextSp = 11f)
            PosterSize.MEDIUM -> PosterMetrics(widthDp = 104, heightDp = 156, contentHeightDp = 202, titleTextSp = 11.5f)
            PosterSize.LARGE -> PosterMetrics(widthDp = 122, heightDp = 183, contentHeightDp = 232, titleTextSp = 12.5f)
        }
    }
}
