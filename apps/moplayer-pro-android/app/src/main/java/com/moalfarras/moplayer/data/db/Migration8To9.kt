package com.moalfarras.moplayer.data.db

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

/**
 * SQL for the v8 -> v9 upgrade. The CREATE statements are copied verbatim from the exported
 * schemas/…/9.json (Room validates the result on open and there is no destructive fallback), and
 * Migration8To9SqlTest checks they stay identical to it.
 */
internal object Migration8To9Sql {
    /**
     * v8 media indices that no query needs any more. The single-column ones duplicated composites,
     * could not serve the COLLATE NOCASE / CASE sorts, or only existed for the removed
     * `(:serverId <= 0 OR …)` pattern; each one cost a B-tree update per row on every sync.
     */
    val droppedMediaIndices = listOf(
        "index_media_serverId",
        "index_media_type",
        "index_media_categoryId",
        "index_media_categoryName",
        "index_media_title",
        "index_media_addedAt",
        "index_media_lastModifiedAt",
        "index_media_serverOrder",
        "index_media_seriesId",
        "index_media_serverId_type_categoryId",
        "index_media_serverId_type_title",
        "index_media_serverId_type_addedAt",
    )

    /** Every v9 media index. Kept ones already exist on v8 databases, hence IF NOT EXISTS. */
    val mediaIndices = listOf(
        "CREATE INDEX IF NOT EXISTS `index_media_serverId_type_serverOrder` ON `media` (`serverId`, `type`, `serverOrder`)",
        "CREATE INDEX IF NOT EXISTS `index_media_serverId_type_categoryId_serverOrder` ON `media` (`serverId`, `type`, `categoryId`, `serverOrder`)",
        "CREATE INDEX IF NOT EXISTS `index_media_serverId_type_sortAddedAt` ON `media` (`serverId`, `type`, `sortAddedAt`)",
        "CREATE INDEX IF NOT EXISTS `index_media_serverId_type_lastPlayedAt` ON `media` (`serverId`, `type`, `lastPlayedAt`)",
        "CREATE INDEX IF NOT EXISTS `index_media_serverId_seriesId_type` ON `media` (`serverId`, `seriesId`, `type`)",
        "CREATE INDEX IF NOT EXISTS `index_media_serverId_isFavorite_updatedAt` ON `media` (`serverId`, `isFavorite`, `updatedAt`)",
        "CREATE INDEX IF NOT EXISTS `index_media_serverId_watchPositionMs_updatedAt` ON `media` (`serverId`, `watchPositionMs`, `updatedAt`)",
    )

    const val CREATE_MEDIA_SEARCH =
        "CREATE TABLE IF NOT EXISTS `media_search` (`serverId` INTEGER NOT NULL, `type` TEXT NOT NULL, " +
            "`id` TEXT NOT NULL, `title` TEXT NOT NULL, `searchText` TEXT NOT NULL, PRIMARY KEY(`serverId`, `type`, `id`))"

    const val CREATE_MEDIA_SEARCH_FTS =
        "CREATE VIRTUAL TABLE IF NOT EXISTS `media_search_fts` USING FTS4(`searchText` TEXT NOT NULL, content=`media_search`)"

    val ftsContentSyncTriggers = listOf(
        "CREATE TRIGGER IF NOT EXISTS room_fts_content_sync_media_search_fts_BEFORE_UPDATE BEFORE UPDATE ON `media_search` BEGIN DELETE FROM `media_search_fts` WHERE `docid`=OLD.`rowid`; END",
        "CREATE TRIGGER IF NOT EXISTS room_fts_content_sync_media_search_fts_BEFORE_DELETE BEFORE DELETE ON `media_search` BEGIN DELETE FROM `media_search_fts` WHERE `docid`=OLD.`rowid`; END",
        "CREATE TRIGGER IF NOT EXISTS room_fts_content_sync_media_search_fts_AFTER_UPDATE AFTER UPDATE ON `media_search` BEGIN INSERT INTO `media_search_fts`(`docid`, `searchText`) VALUES (NEW.`rowid`, NEW.`searchText`); END",
        "CREATE TRIGGER IF NOT EXISTS room_fts_content_sync_media_search_fts_AFTER_INSERT AFTER INSERT ON `media_search` BEGIN INSERT INTO `media_search_fts`(`docid`, `searchText`) VALUES (NEW.`rowid`, NEW.`searchText`); END",
    )
}

/**
 * v8 -> v9:
 * - servers.activatedAt: explicit active source, seeded from today's "newest sync" order so the same
 *   account stays active after the update.
 * - media.sortAddedAt: indexed key for "Latest"; redundant media indices dropped, two composites added.
 * - media_search rebuilt in normalized form (Arabic/Latin folding) and indexed by an FTS4 table.
 *   The rows are normalized in Kotlin, so this is one pass over the catalog on first launch after
 *   the update; the FTS index is built in bulk afterwards, then the sync triggers are created.
 */
internal val MIGRATION_8_9 = object : Migration(8, 9) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE servers ADD COLUMN activatedAt INTEGER NOT NULL DEFAULT 0")
        db.execSQL("UPDATE servers SET activatedAt = CASE WHEN lastSyncAt > 0 THEN lastSyncAt ELSE createdAt END")

        db.execSQL("ALTER TABLE media ADD COLUMN sortAddedAt INTEGER NOT NULL DEFAULT 0")
        db.execSQL("UPDATE media SET sortAddedAt = CASE WHEN addedAt > 0 THEN addedAt ELSE lastModifiedAt END")
        Migration8To9Sql.droppedMediaIndices.forEach { db.execSQL("DROP INDEX IF EXISTS `$it`") }
        Migration8To9Sql.mediaIndices.forEach(db::execSQL)

        db.execSQL("DROP TABLE IF EXISTS `media_search`")
        db.execSQL(Migration8To9Sql.CREATE_MEDIA_SEARCH)
        backfillSearchRows(db)
        db.execSQL(Migration8To9Sql.CREATE_MEDIA_SEARCH_FTS)
        db.execSQL("INSERT INTO `media_search_fts`(`media_search_fts`) VALUES('rebuild')")
        Migration8To9Sql.ftsContentSyncTriggers.forEach(db::execSQL)
    }

    private fun backfillSearchRows(db: SupportSQLiteDatabase) {
        val insert = db.compileStatement(
            "INSERT OR IGNORE INTO `media_search` (`serverId`, `type`, `id`, `title`, `searchText`) VALUES (?, ?, ?, ?, ?)",
        )
        try {
            db.query("SELECT serverId, type, id, title, categoryName, tvgId, genre, releaseDate FROM media").use { cursor ->
                while (cursor.moveToNext()) {
                    val title = cursor.getString(3)
                    insert.clearBindings()
                    insert.bindLong(1, cursor.getLong(0))
                    insert.bindString(2, cursor.getString(1))
                    insert.bindString(3, cursor.getString(2))
                    insert.bindString(4, SearchText.normalize(title))
                    insert.bindString(
                        5,
                        SearchText.indexText(title, cursor.getString(4), cursor.getString(5), cursor.getString(6), cursor.getString(7)),
                    )
                    insert.executeInsert()
                }
            }
        } finally {
            insert.close()
        }
    }
}
