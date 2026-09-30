package com.moalfarras.moplayer.data.parser

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test
import java.io.EOFException
import java.io.Reader
import java.io.StringReader

class JsonStreamReaderTest {
    private fun itemsOf(text: String, bufferSize: Int = 16 * 1024): Pair<List<Any?>, JsonObject> {
        val reader = JsonStreamReader(StringReader(text), bufferSize = bufferSize)
        val items = generateSequence { reader.next() }.toList()
        return items to reader.meta
    }

    @Test
    fun streamsTopLevelArrayWithMixedValueTypes() {
        val (items, meta) = itemsOf(
            """[{"stream_id": 1, "num": "2", "name": "A", "icon": null, "ok": true, "cats": [1, "2"]}, null, [], 5]""",
        )

        assertEquals(4, items.size)
        val first = items[0] as JsonObject
        assertEquals("1", first["stream_id"]!!.jsonPrimitive.content)
        assertEquals(false, first["stream_id"]!!.jsonPrimitive.isString)
        assertEquals("2", first["num"]!!.jsonPrimitive.content)
        assertEquals(JsonNull, first["icon"])
        assertEquals(true, first["ok"]!!.jsonPrimitive.content.toBoolean())
        assertEquals(2, (first["cats"] as JsonArray).size)
        assertEquals(JsonNull, items[1])
        assertTrue(meta.isEmpty())
    }

    @Test
    fun streamsListWrappedInDataObjectAndKeepsOtherFields() {
        val (items, meta) = itemsOf("""{"status": "ok", "data": [{"id": 1}, {"id": 2}], "total": 2}""")

        assertEquals(2, items.size)
        assertEquals("ok", meta["status"]!!.jsonPrimitive.content)
        assertEquals(2, meta["total"]!!.jsonPrimitive.intOrNull)
    }

    @Test
    fun readsPhpIndexKeyedObjectsAsItems() {
        val (items, meta) = itemsOf("""{"0": {"id": "a"}, "3": {"id": "b"}}""")

        assertEquals(listOf("a", "b"), items.map { (it as JsonObject)["id"]!!.jsonPrimitive.content })
        assertTrue(meta.isEmpty())
    }

    @Test
    fun authErrorObjectEndsUpInMetaWithoutItems() {
        val (items, meta) = itemsOf("""{"user_info": {"auth": 0, "status": "Disabled"}}""")

        assertTrue(items.isEmpty())
        assertEquals("0", meta["user_info"]!!.jsonObject["auth"]!!.jsonPrimitive.content)
    }

    @Test
    fun toleratesBomWhitespaceTrailingCommasAndEmptyBodies() {
        val (items, _) = itemsOf("\uFEFF \r\n [ {\"id\": 1,}, {\"id\": 2}, ]\r\n")
        assertEquals(2, items.size)

        assertTrue(itemsOf("").first.isEmpty())
        assertTrue(itemsOf("null").first.isEmpty())
        assertTrue(itemsOf("[]").first.isEmpty())
        assertTrue(itemsOf("{}").first.isEmpty())
    }

    @Test
    fun decodesEscapesUnicodeAndArabicAcrossBufferBoundaries() {
        val title = "قناة \\\"الجزيرة\\\" \\u00e9\\n\\ud83d\\ude00 end"
        val text = "[" + List(50) { """{"name": "$title", "path": "a\/b"}""" }.joinToString(",") + "]"

        val (items, _) = itemsOf(text, bufferSize = 64)

        assertEquals(50, items.size)
        items.forEach { item ->
            val obj = item as JsonObject
            assertEquals("قناة \"الجزيرة\" é\n😀 end", obj["name"]!!.jsonPrimitive.content)
            assertEquals("a/b", obj["path"]!!.jsonPrimitive.content)
        }
    }

    @Test
    fun htmlBodiesAreReportedAsNotJson() {
        try {
            itemsOf("<!DOCTYPE html><html><body>Login</body></html>")
            fail("HTML must not parse")
        } catch (error: JsonStreamSyntaxException) {
            assertTrue(error.looksLikeHtml)
        }
    }

    @Test
    fun truncatedBodiesThrowEofSoTheyAreRetried() {
        listOf("""[{"id": 1}, {"id": 2""", """[{"id": "ab""", """[{"id": 1}, {"ok": tr""", """[{"id": 1},""").forEach { body ->
            try {
                itemsOf(body)
                fail("truncated body must fail: $body")
            } catch (_: EOFException) {
                // expected
            }
        }
    }

    @Test
    fun malformedStructureIsASyntaxError() {
        try {
            itemsOf("""[{"id": 1} {"id": 2}]""")
            fail("missing comma must fail")
        } catch (error: JsonStreamSyntaxException) {
            assertFalse(error.looksLikeHtml)
        }
    }

    @Test
    fun readDocumentParsesSmallResponses() {
        val root = JsonStreamReader(StringReader("""{"user_info": {"auth": 1}, "list": [1, 2.5, -3e2]}""")).readDocument()
        val list = (root as JsonObject)["list"] as JsonArray
        assertEquals(listOf("1", "2.5", "-3e2"), list.map { (it as JsonPrimitive).content })
        assertEquals(JsonNull, JsonStreamReader(StringReader("  ")).readDocument())
    }

    @Test
    fun streamsLargeListsWithoutMaterializingTheBody() {
        val count = 60_000
        val reader = JsonStreamReader(GeneratedListReader(count))
        var seen = 0
        var lastId: String? = null
        while (true) {
            val item = reader.next() as? JsonObject ?: break
            seen++
            lastId = item["stream_id"]!!.jsonPrimitive.content
        }
        assertEquals(count, seen)
        assertEquals((count - 1).toString(), lastId)
        assertNull(reader.next())
    }

    /** Produces `[{"stream_id":0,...},...]` on the fly, so the document never exists as one String. */
    private class GeneratedListReader(private val count: Int) : Reader() {
        private var index = -1
        private var chunk = "["
        private var offset = 0

        override fun read(buffer: CharArray, off: Int, len: Int): Int {
            if (offset >= chunk.length) {
                index++
                chunk = when {
                    index < count -> (if (index > 0) "," else "") +
                        """{"num":"${index + 1}","name":"Channel $index | قناة","stream_id":$index,"category_id":"${index % 40}","tv_archive":0}"""
                    index == count -> "]"
                    else -> return -1
                }
                offset = 0
            }
            val n = minOf(len, chunk.length - offset)
            chunk.toCharArray(buffer, off, offset, offset + n)
            offset += n
            return n
        }

        override fun close() = Unit
    }
}
