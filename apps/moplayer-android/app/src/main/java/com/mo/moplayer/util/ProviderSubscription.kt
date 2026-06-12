package com.mo.moplayer.util

import com.google.gson.JsonParser
import com.mo.moplayer.data.local.entity.ServerEntity
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Single source of truth for interpreting an Xtream/M3U source's subscription window.
 *
 * The provider's expiry date is captured at sign-in (and refreshed by re-auth), stored as
 * [ServerEntity.expirationDate]. Because it is an absolute date, "did the subscription run
 * out of days?" can be answered entirely offline — no live server call required. The panel
 * `status` string ("Active"/"Expired"/"Banned"/"Disabled"), when known, is a secondary
 * signal for accounts that are killed before their date.
 */
enum class SubscriptionState {
    /** Comfortably active, or a source type that carries no subscription metadata (plain M3U). */
    ACTIVE,
    /** Active but within the warning window (a few days / hours left). */
    EXPIRING_SOON,
    /** Out of days, or the panel reports the account as expired/banned/disabled. */
    EXPIRED,
    /** No subscription metadata available (cannot judge). */
    UNKNOWN
}

data class SubscriptionInfo(
    val state: SubscriptionState,
    /** Formatted expiry date (yyyy-MM-dd) when parseable, else null. */
    val expiryLabel: String?,
    /** Whole days remaining (>= 0), or null when within hours / unknown. */
    val daysLeft: Long?,
    /** Whole hours remaining when < 48h left, else null. */
    val hoursLeft: Long?,
    /** Raw panel status string when known. */
    val rawStatus: String?
) {
    val isExpired: Boolean get() = state == SubscriptionState.EXPIRED
}

object ProviderSubscription {

    /** Days-left threshold below which a still-active subscription is flagged as "expiring soon". */
    private const val EXPIRING_SOON_WINDOW_MS = 3L * 24 * 60 * 60 * 1000
    private const val HOURS_WINDOW_MS = 48L * 60 * 60 * 1000
    private const val SECONDS_EPOCH_CUTOFF = 10_000_000_000L

    /** JSON key under which sign-in stores the panel `user_info.status`. */
    const val SERVER_INFO_STATUS_KEY = "user_status"

    /** Parse a provider date that may be epoch seconds or epoch millis. Returns millis, or null. */
    fun parseProviderDateMillis(value: String?): Long? {
        val epoch = value?.trim()?.toLongOrNull()?.takeIf { it > 0 } ?: return null
        return if (epoch < SECONDS_EPOCH_CUTOFF) epoch * 1000L else epoch
    }

    /** Format a provider date to yyyy-MM-dd, falling back to the trimmed raw value. */
    fun formatProviderDate(value: String?): String {
        val trimmed = value?.trim().orEmpty()
        val millis = parseProviderDateMillis(trimmed)
        if (millis != null) {
            return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(millis))
        }
        return trimmed.take(16)
    }

    private fun statusReportsDead(rawStatus: String?): Boolean {
        val status = rawStatus?.lowercase(Locale.ROOT) ?: return false
        return status.contains("expired") || status.contains("banned") || status.contains("disabled")
    }

    private fun statusFromServerInfo(serverInfo: String?): String? {
        val json = serverInfo?.takeIf { it.isNotBlank() } ?: return null
        return runCatching {
            JsonParser.parseString(json).asJsonObject
                .get(SERVER_INFO_STATUS_KEY)?.asString?.takeIf { it.isNotBlank() }
        }.getOrNull()
    }

    fun infoFor(server: ServerEntity?, nowMs: Long = System.currentTimeMillis()): SubscriptionInfo {
        if (server == null) {
            return SubscriptionInfo(SubscriptionState.UNKNOWN, null, null, null, null)
        }
        val rawStatus = statusFromServerInfo(server.serverInfo)
        val deadByStatus = statusReportsDead(rawStatus)
        val expiryMillis = parseProviderDateMillis(server.expirationDate)
        val label = server.expirationDate?.takeIf { it.isNotBlank() }?.let { formatProviderDate(it) }

        if (expiryMillis == null) {
            // No usable date. Trust an explicit dead status; otherwise we cannot judge.
            return if (deadByStatus) {
                SubscriptionInfo(SubscriptionState.EXPIRED, label, null, null, rawStatus)
            } else {
                SubscriptionInfo(SubscriptionState.UNKNOWN, label, null, null, rawStatus)
            }
        }

        val remaining = expiryMillis - nowMs
        return when {
            remaining <= 0L || deadByStatus ->
                SubscriptionInfo(SubscriptionState.EXPIRED, label, 0L, 0L, rawStatus)
            remaining < HOURS_WINDOW_MS -> {
                val hours = kotlin.math.max(1L, remaining / (60L * 60 * 1000))
                SubscriptionInfo(SubscriptionState.EXPIRING_SOON, label, 0L, hours, rawStatus)
            }
            remaining < EXPIRING_SOON_WINDOW_MS -> {
                val days = kotlin.math.max(1L, remaining / (24L * 60 * 60 * 1000))
                SubscriptionInfo(SubscriptionState.EXPIRING_SOON, label, days, null, rawStatus)
            }
            else -> {
                val days = kotlin.math.max(1L, remaining / (24L * 60 * 60 * 1000))
                SubscriptionInfo(SubscriptionState.ACTIVE, label, days, null, rawStatus)
            }
        }
    }

    /** Convenience: true only when we are confident the subscription is dead. */
    fun isExpired(server: ServerEntity?, nowMs: Long = System.currentTimeMillis()): Boolean =
        infoFor(server, nowMs).isExpired
}
