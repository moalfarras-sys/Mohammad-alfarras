package com.mo.moplayer.data.parental

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.security.MessageDigest
import javax.inject.Inject
import javax.inject.Singleton

private val Context.parentalDataStore: DataStore<Preferences> by preferencesDataStore(name = "parental_settings")

/**
 * Parental Controls Manager
 * Handles PIN protection, content rating filters, and adult content restrictions
 */
@Singleton
class ParentalControlManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    private val dataStore = context.parentalDataStore
    
    companion object {
        private val KEY_ENABLED = booleanPreferencesKey("parental_enabled")
        private val KEY_PIN_HASH = stringPreferencesKey("pin_hash")
        private val KEY_LOCK_ADULT_CONTENT = booleanPreferencesKey("lock_adult")
        private val KEY_MAX_RATING = stringPreferencesKey("max_rating")
        private val KEY_REQUIRE_PIN_FOR_18_PLUS = booleanPreferencesKey("pin_for_18_plus")
        
        // Content ratings
        const val RATING_G = "G"           // General Audiences
        const val RATING_PG = "PG"         // Parental Guidance
        const val RATING_PG_13 = "PG-13"   // Parents Strongly Cautioned
        const val RATING_R = "R"           // Restricted
        const val RATING_NC_17 = "NC-17"   // Adults Only
        const val RATING_18_PLUS = "18+"   // Adult Content
    }
    
    /**
     * Check if parental controls are enabled
     */
    val isEnabled: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[KEY_ENABLED] ?: false
    }
    
    /**
     * Check if adult content is locked
     */
    val isAdultContentLocked: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[KEY_LOCK_ADULT_CONTENT] ?: false
    }
    
    /**
     * Get maximum allowed rating
     */
    val maxRating: Flow<String> = dataStore.data.map { prefs ->
        prefs[KEY_MAX_RATING] ?: RATING_NC_17
    }
    
    /**
     * Check if PIN is required for 18+ content
     */
    val requirePinFor18Plus: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[KEY_REQUIRE_PIN_FOR_18_PLUS] ?: true
    }
    
    /**
     * Check if PIN is set
     */
    suspend fun isPinSet(): Boolean {
        val pinHash = dataStore.data.first()[KEY_PIN_HASH]
        return !pinHash.isNullOrEmpty()
    }
    
    /**
     * Set parental PIN
     */
    suspend fun setPin(pin: String): Boolean {
        if (!isValidPin(pin)) return false
        
        val hash = hashPin(pin)
        dataStore.edit { prefs ->
            prefs[KEY_PIN_HASH] = hash
            prefs[KEY_ENABLED] = true
        }
        return true
    }
    
    /**
     * Verify PIN
     */
    suspend fun verifyPin(pin: String): Boolean {
        val storedHash = dataStore.data.first()[KEY_PIN_HASH] ?: return false
        val inputHash = hashPin(pin)
        return storedHash == inputHash
    }
    
    /**
     * Remove PIN and disable parental controls
     */
    suspend fun removePin(currentPin: String): Boolean {
        if (!verifyPin(currentPin)) return false
        
        dataStore.edit { prefs ->
            prefs.remove(KEY_PIN_HASH)
            prefs[KEY_ENABLED] = false
            prefs[KEY_LOCK_ADULT_CONTENT] = false
        }
        return true
    }
    
    /**
     * Enable/disable parental controls
     */
    suspend fun setEnabled(enabled: Boolean) {
        dataStore.edit { prefs ->
            prefs[KEY_ENABLED] = enabled
        }
    }
    
    /**
     * Lock/unlock adult content
     */
    suspend fun setAdultContentLocked(locked: Boolean) {
        dataStore.edit { prefs ->
            prefs[KEY_LOCK_ADULT_CONTENT] = locked
        }
    }
    
    /**
     * Set maximum allowed content rating
     */
    suspend fun setMaxRating(rating: String) {
        dataStore.edit { prefs ->
            prefs[KEY_MAX_RATING] = rating
        }
    }
    
    /**
     * Set whether PIN is required for 18+ content
     */
    suspend fun setRequirePinFor18Plus(require: Boolean) {
        dataStore.edit { prefs ->
            prefs[KEY_REQUIRE_PIN_FOR_18_PLUS] = require
        }
    }
    
    /**
     * Check if content should be blocked based on rating
     */
    suspend fun shouldBlockContent(contentRating: String?, isAdult: Boolean = false): Boolean {
        val enabled = isEnabled.first()
        if (!enabled) return false
        
        // Check adult content lock
        if (isAdult) {
            val adultLocked = isAdultContentLocked.first()
            return adultLocked
        }
        
        // Check rating restrictions
        val maxAllowedRating = maxRating.first()
        return if (contentRating != null) {
            !isRatingAllowed(contentRating, maxAllowedRating)
        } else {
            false // No rating = allow
        }
    }
    
    /**
     * Check if PIN is required to view content
     */
    suspend fun requiresPinForContent(contentRating: String?, isAdult: Boolean = false): Boolean {
        val enabled = isEnabled.first()
        if (!enabled) return false
        
        // Always require PIN for adult content if enabled
        if (isAdult) {
            return requirePinFor18Plus.first()
        }
        
        // Require PIN for restricted ratings
        return contentRating in listOf(RATING_R, RATING_NC_17, RATING_18_PLUS)
    }
    
    /**
     * Validate PIN format (4 digits)
     */
    private fun isValidPin(pin: String): Boolean {
        return pin.length == 4 && pin.all { it.isDigit() }
    }
    
    /**
     * Hash PIN using SHA-256
     */
    private fun hashPin(pin: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(pin.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
    
    /**
     * Check if a rating is allowed based on max rating
     */
    private fun isRatingAllowed(contentRating: String, maxRating: String): Boolean {
        val ratingLevels = listOf(
            RATING_G,
            RATING_PG,
            RATING_PG_13,
            RATING_R,
            RATING_NC_17,
            RATING_18_PLUS
        )
        
        val contentLevel = ratingLevels.indexOf(contentRating)
        val maxLevel = ratingLevels.indexOf(maxRating)
        
        if (contentLevel == -1) return true // Unknown rating = allow
        if (maxLevel == -1) return true     // No max set = allow all
        
        return contentLevel <= maxLevel
    }
    
    /**
     * Get parental control settings summary
     */
    suspend fun getSettingsSummary(): ParentalSettings {
        val prefs = dataStore.data.first()
        return ParentalSettings(
            enabled = prefs[KEY_ENABLED] ?: false,
            pinSet = !prefs[KEY_PIN_HASH].isNullOrEmpty(),
            adultContentLocked = prefs[KEY_LOCK_ADULT_CONTENT] ?: false,
            maxRating = prefs[KEY_MAX_RATING] ?: RATING_NC_17,
            requirePinFor18Plus = prefs[KEY_REQUIRE_PIN_FOR_18_PLUS] ?: true
        )
    }
}

/**
 * Parental control settings data class
 */
data class ParentalSettings(
    val enabled: Boolean,
    val pinSet: Boolean,
    val adultContentLocked: Boolean,
    val maxRating: String,
    val requirePinFor18Plus: Boolean
)
