package com.mo.moplayer.util

import android.content.Context
import android.content.res.Configuration
import android.os.Build
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

private val Context.localeDataStore: DataStore<Preferences> by preferencesDataStore(name = "locale_settings")

/**
 * Manages app language/locale settings with Arabic and English support.
 */
@Singleton
class LocaleHelper @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private val LANGUAGE_KEY = stringPreferencesKey("language")
        
        const val LANGUAGE_ENGLISH = "en"
        const val LANGUAGE_ARABIC = "ar"
        const val LANGUAGE_SYSTEM = "system"
        
        /**
         * Apply locale to configuration (static for use in attachBaseContext)
         */
        fun applyLocale(context: Context, languageCode: String): Context {
            val locale = when (languageCode) {
                LANGUAGE_ARABIC -> Locale("ar")
                LANGUAGE_ENGLISH -> Locale("en")
                else -> Locale.getDefault()
            }
            
            Locale.setDefault(locale)
            
            val config = Configuration(context.resources.configuration)
            config.setLocale(locale)
            config.setLayoutDirection(locale)
            
            return context.createConfigurationContext(config)
        }
        
        /**
         * Get saved language synchronously (for attachBaseContext)
         */
        fun getSavedLanguageSync(context: Context): String {
            return runBlocking {
                try {
                    context.localeDataStore.data.first()[LANGUAGE_KEY] ?: LANGUAGE_ENGLISH
                } catch (e: Exception) {
                    LANGUAGE_ENGLISH
                }
            }
        }
    }
    
    val currentLanguage: Flow<String> = context.localeDataStore.data.map { prefs ->
        prefs[LANGUAGE_KEY] ?: LANGUAGE_ENGLISH
    }
    
    suspend fun setLanguage(languageCode: String) {
        context.localeDataStore.edit { prefs ->
            prefs[LANGUAGE_KEY] = languageCode
        }
    }
    
    fun getLanguageName(code: String): String {
        return when (code) {
            LANGUAGE_ARABIC -> "العربية"
            LANGUAGE_ENGLISH -> "English"
            LANGUAGE_SYSTEM -> "System Default"
            else -> "English"
        }
    }
    
    fun getAvailableLanguages(): List<Pair<String, String>> {
        return listOf(
            LANGUAGE_ENGLISH to "English",
            LANGUAGE_ARABIC to "العربية"
        )
    }
    
    /**
     * Check if RTL layout should be used
     */
    fun isRtl(): Boolean {
        return runBlocking {
            currentLanguage.first() == LANGUAGE_ARABIC
        }
    }
}
