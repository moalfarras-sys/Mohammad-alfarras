package com.moalfarras.moplayer.data.repository

import androidx.room.withTransaction
import com.moalfarras.moplayer.data.db.CategoryEntity
import com.moalfarras.moplayer.data.db.MediaEntity
import com.moalfarras.moplayer.data.db.MediaStateSnapshot
import com.moalfarras.moplayer.data.db.MoPlayerDatabase
import com.moalfarras.moplayer.data.db.toEntity
import com.moalfarras.moplayer.data.db.toSearchEntity
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem

/**
 * Rows per write transaction while streaming a catalog in: about 5 MB of entities at a time, and
 * few enough commits that screens observing the library are not re-queried too often.
 */
internal const val CATALOG_WRITE_BATCH_SIZE = 4_000

/** SQLite on API 23 allows 999 bound variables; stay well below it for `IN (:ids)` lists. */
private const val SQL_IN_CHUNK = 400

/**
 * Writes a streamed catalog (an Xtream section or a whole M3U playlist) in short transactions of
 * [batchSize] rows instead of building the whole list first and holding one long transaction.
 *
 * - Each batch keeps favorites, watch progress and lastPlayedAt of rows that already exist, read
 *   inside the same transaction, so a toggle made while the sync runs is never lost.
 * - The same (type, id) is written once per pass; the first occurrence wins.
 * - [finish] removes rows the provider no longer lists and swaps the categories, in one short
 *   transaction. If a pass fails before [finish], the library keeps every old row (plus the
 *   refreshed ones), so a dropped connection never empties it.
 * - Every transaction first checks that the server still exists, so a logout during a sync
 *   stops it instead of writing orphan rows.
 */
internal class CatalogWriter(
    private val database: MoPlayerDatabase,
    private val serverId: Long,
    private val batchSize: Int = CATALOG_WRITE_BATCH_SIZE,
) {
    private val pending = ArrayList<MediaEntity>(batchSize)
    private val seen = HashMap<ContentType, HashSet<String>>()
    private var pendingCategories: List<CategoryEntity>? = null

    /** Rows accepted in this pass (duplicates excluded). */
    var accepted: Int = 0
        private set

    /** Categories are written with the first batch so items show up under them while syncing. */
    fun stageCategories(categories: List<CategoryEntity>) {
        pendingCategories = categories
    }

    /** Queues [item]; returns false when the same row was already written in this pass. */
    suspend fun add(item: MediaItem): Boolean {
        if (!seen.getOrPut(item.type) { HashSet() }.add(item.id)) return false
        pending += item.toEntity()
        accepted++
        if (pending.size >= batchSize) flush()
        return true
    }

    suspend fun flush() {
        if (pending.isEmpty() && pendingCategories == null) return
        val batch = ArrayList(pending)
        pending.clear()
        val categories = pendingCategories
        pendingCategories = null
        database.withTransaction {
            requireServer()
            if (!categories.isNullOrEmpty()) database.categoryDao().insertAll(categories)
            if (batch.isNotEmpty()) {
                val states = HashMap<String, MediaStateSnapshot>()
                batch.groupBy { it.type }.forEach { (type, rows) ->
                    rows.map { it.id }.chunked(SQL_IN_CHUNK).forEach { ids ->
                        database.mediaDao().userStateForIds(serverId, type, ids).forEach { states[stateKey(it.type, it.id)] = it }
                    }
                }
                val merged = applyUserState(batch, states)
                database.mediaDao().insertAll(merged)
                database.mediaSearchDao().insertAll(merged.map { it.toSearchEntity() })
            }
        }
    }

    /**
     * Completes a successful pass for [types]: flushes the tail, deletes rows of those types that
     * were not seen, replaces their categories (when [categories] is not null) and runs [inTransaction]
     * (sync state, account info) atomically with the cleanup.
     */
    suspend fun finish(
        types: Collection<ContentType>,
        categories: List<CategoryEntity>?,
        inTransaction: suspend () -> Unit = {},
    ) {
        pendingCategories = null
        flush()
        database.withTransaction {
            requireServer()
            types.forEach { type ->
                val keep = seen[type].orEmpty()
                val stale = database.mediaDao().idsForServerType(serverId, type).filterNot { it in keep }
                stale.chunked(SQL_IN_CHUNK).forEach { ids ->
                    database.mediaSearchDao().deleteIds(serverId, type, ids)
                    database.mediaDao().deleteIds(serverId, type, ids)
                }
            }
            if (categories != null) {
                database.categoryDao().deleteForServerTypes(serverId, types.toList())
                if (categories.isNotEmpty()) database.categoryDao().insertAll(categories)
            }
            inTransaction()
        }
    }

    private suspend fun requireServer() {
        if (database.serverDao().getServer(serverId) == null) throw ServerRemovedException()
    }
}

internal fun stateKey(type: ContentType, id: String): String = "${type.name}:$id"

/** Carries favorites, progress and lastPlayedAt from [states] onto freshly synced rows. */
internal fun applyUserState(rows: List<MediaEntity>, states: Map<String, MediaStateSnapshot>): List<MediaEntity> {
    if (states.isEmpty()) return rows
    return rows.map { row ->
        val previous = states[stateKey(row.type, row.id)] ?: return@map row
        row.copy(
            isFavorite = previous.isFavorite,
            watchPositionMs = previous.watchPositionMs,
            watchDurationMs = previous.watchDurationMs,
            lastPlayedAt = previous.lastPlayedAt,
        )
    }
}
