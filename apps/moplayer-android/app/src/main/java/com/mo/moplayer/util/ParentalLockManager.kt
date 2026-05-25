package com.mo.moplayer.util

import android.content.Context
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

private val Context.parentalDataStore by preferencesDataStore(name = "parental_settings")

/**
 * Manages parental lock functionality with PIN protection
 */
@Singleton
class ParentalLockManager @Inject constructor(
    @ApplicationContext private val context: Context
) {

    companion object {
        private val PIN_HASH_KEY = stringPreferencesKey("pin_hash")
        private val PARENTAL_ENABLED_KEY = booleanPreferencesKey("parental_enabled")
        private val ADULT_CONTENT_LOCKED_KEY = booleanPreferencesKey("adult_content_locked")
        private val BLOCKED_CONTENT_KEY = stringPreferencesKey("blocked_content")
        
        private const val DEFAULT_PIN = "0000"
    }

    val isParentalEnabled: Flow<Boolean> = context.parentalDataStore.data.map { prefs ->
        prefs[PARENTAL_ENABLED_KEY] ?: false
    }

    val isAdultContentLocked: Flow<Boolean> = context.parentalDataStore.data.map { prefs ->
        prefs[ADULT_CONTENT_LOCKED_KEY] ?: true
    }

    suspend fun isPinSet(): Boolean {
        val hash = context.parentalDataStore.data.first()[PIN_HASH_KEY]
        return hash != null
    }

    suspend fun setPin(pin: String): Boolean {
        if (pin.length != 4 || !pin.all { it.isDigit() }) {
            return false
        }

        val hash = hashPin(pin)
        context.parentalDataStore.edit { prefs ->
            prefs[PIN_HASH_KEY] = hash
            prefs[PARENTAL_ENABLED_KEY] = true
        }
        return true
    }

    suspend fun verifyPin(pin: String): Boolean {
        val storedHash = context.parentalDataStore.data.first()[PIN_HASH_KEY]
        if (storedHash == null) {
            // No PIN set, check against default
            return pin == DEFAULT_PIN
        }
        return hashPin(pin) == storedHash
    }

    suspend fun removePin(currentPin: String): Boolean {
        if (!verifyPin(currentPin)) {
            return false
        }

        context.parentalDataStore.edit { prefs ->
            prefs.remove(PIN_HASH_KEY)
            prefs[PARENTAL_ENABLED_KEY] = false
        }
        return true
    }

    suspend fun setParentalEnabled(enabled: Boolean) {
        context.parentalDataStore.edit { prefs ->
            prefs[PARENTAL_ENABLED_KEY] = enabled
        }
    }

    suspend fun setAdultContentLocked(locked: Boolean) {
        context.parentalDataStore.edit { prefs ->
            prefs[ADULT_CONTENT_LOCKED_KEY] = locked
        }
    }

    suspend fun isContentBlocked(serverId: Long, contentType: String, contentId: String): Boolean {
        return blockedSet().contains(blockKey(serverId, contentType, contentId))
    }

    suspend fun setContentBlocked(
        serverId: Long,
        contentType: String,
        contentId: String,
        blocked: Boolean
    ) {
        val key = blockKey(serverId, contentType, contentId)
        context.parentalDataStore.edit { prefs ->
            val next = prefs[BLOCKED_CONTENT_KEY]
                .orEmpty()
                .split("|")
                .filter { it.isNotBlank() }
                .toMutableSet()
            if (blocked) {
                next.add(key)
            } else {
                next.remove(key)
            }
            prefs[BLOCKED_CONTENT_KEY] = next.sorted().joinToString("|")
        }
    }

    suspend fun blockedContentCount(serverId: Long? = null): Int {
        return blockedSet().count { item ->
            serverId == null || item.startsWith("${serverId}:")
        }
    }

    private suspend fun blockedSet(): Set<String> {
        return context.parentalDataStore.data.first()[BLOCKED_CONTENT_KEY]
            .orEmpty()
            .split("|")
            .filter { it.isNotBlank() }
            .toSet()
    }

    private fun blockKey(serverId: Long, contentType: String, contentId: String): String {
        val normalizedType = contentType.lowercase().trim()
        val normalizedId = contentId.replace("|", "").replace(":", "_").trim()
        return "$serverId:$normalizedType:$normalizedId"
    }

    private fun hashPin(pin: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(pin.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
