package com.moalfarras.moplayer.data.repository

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import android.util.Log
import androidx.datastore.core.DataStore
import androidx.datastore.core.handlers.ReplaceFileCorruptionHandler
import androidx.datastore.preferences.core.MutablePreferences
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.moalfarras.moplayer.domain.model.ActivatedProfile
import com.moalfarras.moplayer.domain.model.LoginKind
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.IOException
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

private val Context.deviceStateDataStore by preferencesDataStore(
    name = "mo_device_state",
    corruptionHandler = ReplaceFileCorruptionHandler { emptyPreferences() },
)

private val pendingActivationKey = stringPreferencesKey("pending_activation_sealed")
private val subscriptionSnoozesKey = stringPreferencesKey("subscription_prompt_snoozes")
private val autoPlayArmedKey = booleanPreferencesKey("autoplay_armed")

/** A QR-delivered source that is kept, encrypted, until its first import completes. */
data class PendingActivation(
    val profile: ActivatedProfile,
    val savedAt: Long,
    /** Import attempts started so far, including the one that saved it. */
    val attempts: Int,
)

/** How long a saved QR source may wait for a successful import. */
internal const val PENDING_ACTIVATION_MAX_AGE_MS = 24L * 60L * 60L * 1000L

/** Import attempts after which a saved QR source is dropped and a new code is created instead. */
internal const val PENDING_ACTIVATION_MAX_ATTEMPTS = 3

/**
 * Per-install device state that must survive restarts but is not a user setting:
 *
 * - the stable public device id sent with every QR activation;
 * - the one-time QR source until its import completes (the website deletes its copy on the first
 *   pull, so a failed import or a process kill mid-import would otherwise lose it). It is sealed
 *   with an AES-GCM key held in the Android Keystore and deleted right after the import;
 * - which expired-subscription prompts the viewer postponed;
 * - whether the last "auto-play last live channel" start is still unconfirmed.
 *
 * Every read and write is best effort: storage or Keystore failures are logged, never thrown.
 */
class DeviceStateStore internal constructor(
    private val store: DataStore<Preferences>,
    private val sealer: SourceSealer,
) {
    constructor(context: Context) : this(context.applicationContext.deviceStateDataStore, KeystoreSourceSealer())

    private val data: Flow<Preferences> = store.data.catch { error ->
        if (error !is IOException) throw error
        Log.w(TAG, "Device state read failed", error)
        emit(emptyPreferences())
    }

    /** Seals and stores [pending]; false when it could not be kept (the import then runs unprotected). */
    suspend fun savePendingActivation(pending: PendingActivation): Boolean {
        // Keystore work (and the first key generation) can take hundreds of ms on a TV box.
        val sealed = withContext(Dispatchers.IO) {
            sealer.seal(encodePendingActivation(pending).toByteArray(Charsets.UTF_8))
        } ?: return false
        return edit { it[pendingActivationKey] = sealed }
    }

    /** The saved QR source, or null when there is none, it cannot be opened, or it is too old or tried too often. */
    suspend fun pendingActivation(nowMs: Long): PendingActivation? {
        val sealed = data.first()[pendingActivationKey] ?: return null
        val pending = withContext(Dispatchers.IO) { sealer.open(sealed) }
            ?.let { bytes -> decodePendingActivation(String(bytes, Charsets.UTF_8)) }
            ?.takeIf { pendingActivationUsable(it, nowMs) }
        if (pending == null) clearPendingActivation()
        return pending
    }

    suspend fun clearPendingActivation() {
        edit { it.remove(pendingActivationKey) }
    }

    /** Prompt key -> time the viewer chose "Later". */
    val subscriptionPromptSnoozes: Flow<Map<String, Long>> =
        data.map { prefs -> decodeSnoozes(prefs[subscriptionSnoozesKey].orEmpty()) }

    suspend fun snoozeSubscriptionPrompt(key: String, atMs: Long) {
        edit { prefs ->
            val current = decodeSnoozes(prefs[subscriptionSnoozesKey].orEmpty())
            prefs[subscriptionSnoozesKey] = encodeSnoozes(current + (key to atMs))
        }
    }

    suspend fun setAutoPlayArmed(armed: Boolean) {
        edit { it[autoPlayArmedKey] = armed }
    }

    /** Whether the previous auto-play start never got confirmed (crash or failing channel); clears the flag. */
    suspend fun takeUnconfirmedAutoPlay(): Boolean {
        var armed = false
        edit { prefs ->
            armed = prefs[autoPlayArmedKey] == true
            prefs.remove(autoPlayArmedKey)
        }
        return armed
    }

    private suspend fun edit(transform: (MutablePreferences) -> Unit): Boolean = try {
        store.edit { transform(it) }
        true
    } catch (error: IOException) {
        Log.w(TAG, "Device state write failed", error)
        false
    }

    private companion object {
        const val TAG = "MoPlayerDeviceState"
    }
}

/** Seals small secrets for local storage; null means sealing is unavailable on this device. */
internal interface SourceSealer {
    fun seal(plain: ByteArray): String?
    fun open(sealed: String): ByteArray?
}

/**
 * AES-256-GCM with a non-exportable key in the Android Keystore (API 23+). Keystore implementations
 * on some TV boxes are flaky, so every failure returns null instead of throwing.
 */
internal class KeystoreSourceSealer(private val alias: String = "moplayer_pending_source") : SourceSealer {
    override fun seal(plain: ByteArray): String? = try {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, key())
        val iv = cipher.iv
        val body = cipher.doFinal(plain)
        Base64.encodeToString(byteArrayOf(iv.size.toByte()) + iv + body, Base64.NO_WRAP)
    } catch (error: Exception) {
        Log.w(TAG, "Could not seal the activation source", error)
        null
    }

    override fun open(sealed: String): ByteArray? = try {
        val bytes = Base64.decode(sealed, Base64.NO_WRAP)
        val ivLength = bytes[0].toInt()
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, bytes, 1, ivLength))
        cipher.doFinal(bytes, 1 + ivLength, bytes.size - 1 - ivLength)
    } catch (error: Exception) {
        Log.w(TAG, "Could not open the saved activation source", error)
        null
    }

    private fun key(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        (keyStore.getEntry(alias, null) as? KeyStore.SecretKeyEntry)?.let { return it.secretKey }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
        generator.init(
            KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build(),
        )
        return generator.generateKey()
    }

    private companion object {
        const val TAG = "MoPlayerDeviceState"
        const val ANDROID_KEYSTORE = "AndroidKeyStore"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
    }
}

@Serializable
private data class PendingActivationRecord(
    val name: String,
    val kind: String,
    val baseUrl: String = "",
    val username: String = "",
    val password: String = "",
    val playlistUrl: String = "",
    val epgUrl: String = "",
    val sourceId: String = "",
    val publicDeviceId: String = "",
    val sourcePullToken: String = "",
    val savedAt: Long = 0L,
    val attempts: Int = 0,
)

private val recordJson = Json { ignoreUnknownKeys = true }

internal fun encodePendingActivation(pending: PendingActivation): String = with(pending.profile) {
    recordJson.encodeToString(
        PendingActivationRecord.serializer(),
        PendingActivationRecord(
            name = name,
            kind = kind.name,
            baseUrl = baseUrl,
            username = username,
            password = password,
            playlistUrl = playlistUrl,
            epgUrl = epgUrl,
            sourceId = sourceId,
            publicDeviceId = publicDeviceId,
            sourcePullToken = sourcePullToken,
            savedAt = pending.savedAt,
            attempts = pending.attempts,
        ),
    )
}

internal fun decodePendingActivation(text: String): PendingActivation? = runCatching {
    val record = recordJson.decodeFromString(PendingActivationRecord.serializer(), text)
    val kind = LoginKind.entries.firstOrNull { it.name == record.kind } ?: return null
    PendingActivation(
        profile = ActivatedProfile(
            name = record.name,
            kind = kind,
            baseUrl = record.baseUrl,
            username = record.username,
            password = record.password,
            playlistUrl = record.playlistUrl,
            epgUrl = record.epgUrl,
            sourceId = record.sourceId,
            publicDeviceId = record.publicDeviceId,
            sourcePullToken = record.sourcePullToken,
        ),
        savedAt = record.savedAt,
        attempts = record.attempts,
    )
}.getOrNull()

/** A saved source is retried for a day and at most [PENDING_ACTIVATION_MAX_ATTEMPTS] times. */
internal fun pendingActivationUsable(pending: PendingActivation, nowMs: Long): Boolean =
    pending.attempts < PENDING_ACTIVATION_MAX_ATTEMPTS &&
        nowMs - pending.savedAt in 0 until PENDING_ACTIVATION_MAX_AGE_MS

private const val MAX_SNOOZES = 20

internal fun decodeSnoozes(raw: String): Map<String, Long> =
    raw.lineSequence()
        .mapNotNull { line ->
            val key = line.substringBeforeLast('\t', missingDelimiterValue = "")
            val at = line.substringAfterLast('\t').toLongOrNull()
            if (key.isBlank() || at == null) null else key to at
        }
        .toMap()

internal fun encodeSnoozes(snoozes: Map<String, Long>): String =
    snoozes.entries
        .sortedByDescending { it.value }
        .take(MAX_SNOOZES)
        .joinToString("\n") { (key, at) -> "${key.replace('\t', ' ').replace('\n', ' ')}\t$at" }
