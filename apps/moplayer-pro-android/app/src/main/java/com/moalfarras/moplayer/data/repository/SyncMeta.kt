package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.data.db.SyncStateEntity
import com.moalfarras.moplayer.domain.model.ContentType
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.longOrNull
import kotlinx.serialization.json.put

private const val FAILURE_BACKOFF_BASE_MS = 30L * 60L * 1000L
private const val FAILURE_BACKOFF_MAX_MS = 6L * 60L * 60L * 1000L
private const val DAY_MS = 24L * 60L * 60L * 1000L

/** Key used for failures that concern a whole M3U playlist rather than one Xtream section. */
internal const val PLAYLIST_SECTION = "PLAYLIST"

/** A failed attempt; later attempts wait 30 min, 1 h, 2 h ... up to 6 h. */
internal data class FailureRecord(val count: Int, val at: Long, val kind: String) {
    fun retryAt(): Long = at + syncBackoffMs(count)
}

internal fun syncBackoffMs(count: Int): Long {
    if (count <= 0) return 0L
    val shift = (count - 1).coerceAtMost(8)
    return (FAILURE_BACKOFF_BASE_MS shl shift).coerceAtMost(FAILURE_BACKOFF_MAX_MS)
}

/**
 * Bookkeeping kept in `sync_state.rawJson` (no schema change): the last playlist hash and parser
 * version (to skip unchanged M3U downloads), per-section and EPG failure backoff, and item counts.
 * Unknown or legacy content decodes to defaults.
 */
internal data class SyncMeta(
    val playlistHash: String = "",
    val parserVersion: Int = 0,
    val failures: Map<String, FailureRecord> = emptyMap(),
    val epgFailure: FailureRecord? = null,
    val counts: Map<String, Int> = emptyMap(),
) {
    fun withFailure(section: String, kind: SyncErrorKind, now: Long): SyncMeta {
        val previous = failures[section]
        val record = FailureRecord(count = (previous?.count ?: 0) + 1, at = now, kind = kind.name)
        return copy(failures = failures + (section to record))
    }

    fun withSuccess(section: String, count: Int): SyncMeta =
        copy(failures = failures - section, counts = counts + (section to count))

    fun withEpgFailure(kind: SyncErrorKind, now: Long): SyncMeta =
        copy(epgFailure = FailureRecord(count = (epgFailure?.count ?: 0) + 1, at = now, kind = kind.name))

    fun encode(): String = buildJsonObject {
        if (playlistHash.isNotEmpty()) put("playlistHash", playlistHash)
        if (parserVersion > 0) put("parser", parserVersion)
        if (failures.isNotEmpty()) {
            put("fail", JsonObject(failures.mapValues { (_, record) -> record.toJson() }))
        }
        epgFailure?.let { put("epgFail", it.toJson()) }
        if (counts.isNotEmpty()) put("counts", JsonObject(counts.mapValues { (_, value) -> JsonPrimitive(value) }))
    }.toString()

    companion object {
        fun decode(raw: String?): SyncMeta {
            val root = runCatching { Json.parseToJsonElement(raw.orEmpty()) as? JsonObject }.getOrNull()
                ?: return SyncMeta()
            return SyncMeta(
                playlistHash = (root["playlistHash"] as? JsonPrimitive)?.content.orEmpty(),
                parserVersion = (root["parser"] as? JsonPrimitive)?.intOrNull ?: 0,
                failures = (root["fail"] as? JsonObject)?.mapNotNull { (key, value) ->
                    (value as? JsonObject)?.toFailure()?.let { key to it }
                }?.toMap().orEmpty(),
                epgFailure = (root["epgFail"] as? JsonObject)?.toFailure(),
                counts = (root["counts"] as? JsonObject)?.mapNotNull { (key, value) ->
                    (value as? JsonPrimitive)?.intOrNull?.let { key to it }
                }?.toMap().orEmpty(),
            )
        }
    }
}

private fun FailureRecord.toJson(): JsonObject = buildJsonObject {
    put("n", count)
    put("at", at)
    put("kind", kind)
}

private fun JsonObject.toFailure(): FailureRecord? {
    val count = (this["n"] as? JsonPrimitive)?.intOrNull ?: return null
    val at = (this["at"] as? JsonPrimitive)?.longOrNull ?: return null
    return FailureRecord(count, at, (this["kind"] as? JsonPrimitive)?.content.orEmpty())
}

internal fun SyncStateEntity.syncedAt(type: ContentType): Long = when (type) {
    ContentType.LIVE -> liveSyncedAt
    ContentType.MOVIE -> vodSyncedAt
    ContentType.SERIES, ContentType.EPISODE -> seriesSyncedAt
}

/** True when [syncedAt] is missing, older than [staleAfterMs], or in the future after a clock reset. */
internal fun isStale(syncedAt: Long, now: Long, staleAfterMs: Long): Boolean =
    syncedAt <= 0L || now - syncedAt > staleAfterMs || syncedAt - now > DAY_MS

/**
 * Whether a section should be downloaded again: it is stale and, when [respectBackoff], it is not
 * waiting out a recent failure.
 */
internal fun sectionNeedsSync(
    syncedAt: Long,
    failure: FailureRecord?,
    now: Long,
    staleAfterMs: Long,
    respectBackoff: Boolean,
): Boolean {
    if (!isStale(syncedAt, now, staleAfterMs)) return false
    if (respectBackoff && failure != null && now < failure.retryAt() && failure.at <= now) return false
    return true
}
