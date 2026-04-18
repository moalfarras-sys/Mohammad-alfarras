package com.mo.moplayer.util

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages server credentials (username + password) using EncryptedSharedPreferences
 * backed by the Android Keystore. Credentials are never stored in plaintext in Room.
 *
 * Key format: "cred_<serverId>_user" / "cred_<serverId>_pass"
 */
@Singleton
class CredentialManager @Inject constructor(
    @ApplicationContext private val context: Context
) {

    companion object {
        private const val TAG = "CredentialManager"
        private const val PREFS_FILE = "moplayer_secure_credentials"
        private const val KEY_PREFIX_USER = "cred_%d_user"
        private const val KEY_PREFIX_PASS = "cred_%d_pass"
    }

    private val prefs: SharedPreferences? by lazy {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                PREFS_FILE,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create EncryptedSharedPreferences: ${e.message}", e)
            null
        }
    }

    /**
     * Save credentials for a server. Call this after inserting the server into Room.
     */
    fun saveCredentials(serverId: Long, username: String, password: String) {
        try {
            prefs?.edit()
                ?.putString(KEY_PREFIX_USER.format(serverId), username)
                ?.putString(KEY_PREFIX_PASS.format(serverId), password)
                ?.apply()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save credentials for server $serverId: ${e.message}", e)
        }
    }

    /**
     * Retrieve credentials for a server.
     * @return Pair(username, password) or null if not found.
     */
    fun getCredentials(serverId: Long): Pair<String, String>? {
        return try {
            val username = prefs?.getString(KEY_PREFIX_USER.format(serverId), null)
            val password = prefs?.getString(KEY_PREFIX_PASS.format(serverId), null)
            if (username != null && password != null) Pair(username, password) else null
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get credentials for server $serverId: ${e.message}", e)
            null
        }
    }

    /**
     * Delete credentials for a server. Call this when deleting a server.
     */
    fun deleteCredentials(serverId: Long) {
        try {
            prefs?.edit()
                ?.remove(KEY_PREFIX_USER.format(serverId))
                ?.remove(KEY_PREFIX_PASS.format(serverId))
                ?.apply()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete credentials for server $serverId: ${e.message}", e)
        }
    }

    /**
     * One-time migration: move plaintext credentials from Room entities into
     * EncryptedSharedPreferences. Pass the list of (serverId, username, password)
     * tuples read from Room before clearing them.
     */
    fun migrateFromPlaintext(servers: List<Triple<Long, String, String>>) {
        servers.forEach { (serverId, username, password) ->
            if (username.isNotEmpty() || password.isNotEmpty()) {
                saveCredentials(serverId, username, password)
                Log.d(TAG, "Migrated credentials for server $serverId")
            }
        }
    }
}
