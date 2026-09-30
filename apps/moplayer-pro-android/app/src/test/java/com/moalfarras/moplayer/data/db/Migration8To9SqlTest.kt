package com.moalfarras.moplayer.data.db

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Room validates the migrated database against the v9 entities on open, and there is no
 * destructive fallback, so the migration SQL must stay identical to the exported schema.
 */
class Migration8To9SqlTest {
    private fun schema(version: Int): Map<String, JsonObject> {
        val file = File("schemas/com.moalfarras.moplayer.data.db.MoPlayerDatabase/$version.json")
        val root = Json.parseToJsonElement(file.readText()).jsonObject
        return root.getValue("database").jsonObject.getValue("entities").jsonArray
            .map { it.jsonObject }
            .associateBy { it.getValue("tableName").jsonPrimitive.content }
    }

    private fun JsonObject.sql(key: String, table: String) = getValue(key).jsonPrimitive.content.replace("\${TABLE_NAME}", table)

    private fun JsonObject.indexSql(table: String): List<String> =
        this["indices"]?.jsonArray.orEmpty().map { it.jsonObject.sql("createSql", table) }

    private fun JsonObject.indexNames(): Set<String> =
        this["indices"]?.jsonArray.orEmpty().map { it.jsonObject.getValue("name").jsonPrimitive.content }.toSet()

    @Test
    fun mediaIndicesMatchSchema9() {
        val media = schema(9).getValue("media")
        assertEquals(media.indexSql("media").toSet(), Migration8To9Sql.mediaIndices.toSet())
    }

    @Test
    fun everyRemovedV8IndexIsDroppedAndNoV9IndexIs() {
        val v8 = schema(8).getValue("media").indexNames()
        val v9 = schema(9).getValue("media").indexNames()
        assertEquals(v8 - v9, Migration8To9Sql.droppedMediaIndices.toSet())
        assertTrue(Migration8To9Sql.droppedMediaIndices.none { it in v9 })
    }

    @Test
    fun searchTablesAndTriggersMatchSchema9() {
        val v9 = schema(9)
        assertEquals(v9.getValue("media_search").sql("createSql", "media_search"), Migration8To9Sql.CREATE_MEDIA_SEARCH)
        assertTrue(v9.getValue("media_search").indexSql("media_search").isEmpty())
        val fts = v9.getValue("media_search_fts")
        assertEquals(fts.sql("createSql", "media_search_fts"), Migration8To9Sql.CREATE_MEDIA_SEARCH_FTS)
        assertEquals(
            fts.getValue("contentSyncTriggers").jsonArray.map { it.jsonPrimitive.content },
            Migration8To9Sql.ftsContentSyncTriggers,
        )
    }

    @Test
    fun addedColumnsMatchTheAlterStatements() {
        val v9 = schema(9)
        fun field(table: String, column: String) = v9.getValue(table).getValue("fields").jsonArray
            .map { it.jsonObject }
            .single { it.getValue("columnName").jsonPrimitive.content == column }
        val activatedAt = field("servers", "activatedAt")
        assertEquals("INTEGER", activatedAt.getValue("affinity").jsonPrimitive.content)
        assertEquals("0", activatedAt.getValue("defaultValue").jsonPrimitive.content)
        assertEquals("INTEGER", field("media", "sortAddedAt").getValue("affinity").jsonPrimitive.content)
    }
}
