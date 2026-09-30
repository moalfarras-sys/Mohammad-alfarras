package com.moalfarras.moplayer.data.parser

import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.JsonUnquotedLiteral
import java.io.Closeable
import java.io.EOFException
import java.io.Reader

/**
 * The body is not JSON (an HTML error page, a captive portal, a Cloudflare challenge) or its
 * structure is broken. [looksLikeHtml] tells callers to report "this is not an IPTV API"
 * instead of a generic parse failure.
 */
class JsonStreamSyntaxException(
    message: String,
    val looksLikeHtml: Boolean = false,
) : IllegalArgumentException(message)

/**
 * Small, dependency-free pull reader for provider JSON.
 *
 * Xtream bulk lists (get_live_streams / get_vod_streams / get_series) can be tens of MB. This
 * reader walks the body from a [Reader] and hands out one list element at a time as a small
 * kotlinx [JsonElement], so the whole body never exists as one String or one element tree.
 *
 * Shapes it understands at the top level:
 * - `[ {...}, {...} ]`: the normal list.
 * - `{"data": [ ... ]}` (or another key from [itemArrayKeys]): the list is streamed from inside.
 * - `{"1": {...}, "7": {...}}`: PHP arrays with gaps are encoded as objects keyed by index.
 * - `{"user_info": {"auth": 0}}` / `{"error": "..."}`: not a list; the fields end up in [meta].
 * - an empty body or `null`: an empty list.
 *
 * It is lenient where real panels are sloppy (UTF-8 BOM, trailing commas, raw control characters
 * inside strings) and strict where it matters: a body cut off mid-value throws [EOFException]
 * so callers can retry it as a transient network failure.
 *
 * Numbers keep their literal text (as [JsonUnquotedLiteral]), so the tolerant string/number
 * helpers in XtreamSupport see exactly what `parseToJsonElement` would have produced.
 */
class JsonStreamReader(
    private val reader: Reader,
    private val itemArrayKeys: Set<String> = DEFAULT_ITEM_ARRAY_KEYS,
    bufferSize: Int = 16 * 1024,
) : Closeable {
    private val buffer = CharArray(bufferSize.coerceAtLeast(64))
    private var pos = 0
    private var limit = 0
    private var mode = Mode.NOT_STARTED
    private var needComma = false
    private val metaFields = LinkedHashMap<String, JsonElement>()

    /** Top-level object fields that were not list items, e.g. `user_info` of an auth rejection. */
    val meta: JsonObject get() = JsonObject(metaFields)

    /** Reads a whole (small) document, e.g. an account or get_series_info response. */
    fun readDocument(): JsonElement {
        check(mode == Mode.NOT_STARTED) { "Reader already used" }
        mode = Mode.DONE
        skipBomAndWhitespace()
        if (peek() == EOF) return JsonNull
        rejectHtml()
        val value = readValue(0)
        skipWhitespace()
        return value
    }

    /** Returns the next list element, or null when the list (or the whole document) is finished. */
    fun next(): JsonElement? {
        while (true) {
            when (mode) {
                Mode.NOT_STARTED -> start()
                Mode.TOP_ARRAY, Mode.NESTED_ARRAY -> return nextArrayElement() ?: continue
                Mode.TOP_OBJECT -> return nextObjectItem() ?: continue
                Mode.DONE -> return null
            }
        }
    }

    override fun close() = reader.close()

    private fun start() {
        skipBomAndWhitespace()
        when (val c = peek()) {
            EOF -> mode = Mode.DONE
            '['.code -> { pos++; mode = Mode.TOP_ARRAY; needComma = false }
            '{'.code -> { pos++; mode = Mode.TOP_OBJECT; needComma = false }
            '"'.code -> { metaFields["message"] = JsonPrimitive(readString()); mode = Mode.DONE }
            'n'.code, 't'.code, 'f'.code -> { readLiteral(); mode = Mode.DONE }
            else -> {
                rejectHtml()
                throw JsonStreamSyntaxException("Unexpected '${c.toChar()}' at the start of the response")
            }
        }
    }

    /** One element of the current list; returns null (after switching mode) when the list ends. */
    private fun nextArrayElement(): JsonElement? {
        skipWhitespace()
        if (needComma) {
            when (val c = read()) {
                ']'.code -> { endArray(); return null }
                ','.code -> {
                    skipWhitespace()
                    if (peek() == ']'.code) { pos++; endArray(); return null }
                }
                EOF -> throw EOFException("Truncated JSON body")
                else -> throw JsonStreamSyntaxException("Expected ',' or ']' but found '${c.toChar()}'")
            }
        } else if (peek() == ']'.code) {
            pos++
            endArray()
            return null
        }
        needComma = true
        return readValue(1)
    }

    private fun endArray() {
        if (mode == Mode.NESTED_ARRAY) {
            mode = Mode.TOP_OBJECT
            needComma = true
        } else {
            mode = Mode.DONE
        }
    }

    /**
     * Walks top-level object members. Item lists are entered (mode switches to NESTED_ARRAY and
     * null is returned so [next] continues there), index-keyed objects are returned as items, and
     * everything else is kept in [meta].
     */
    private fun nextObjectItem(): JsonElement? {
        skipWhitespace()
        if (needComma) {
            when (val c = read()) {
                '}'.code -> { mode = Mode.DONE; return null }
                ','.code -> {
                    skipWhitespace()
                    if (peek() == '}'.code) { pos++; mode = Mode.DONE; return null }
                }
                EOF -> throw EOFException("Truncated JSON body")
                else -> throw JsonStreamSyntaxException("Expected ',' or '}' but found '${c.toChar()}'")
            }
        } else if (peek() == '}'.code) {
            pos++
            mode = Mode.DONE
            return null
        }
        needComma = true
        val key = readString()
        skipWhitespace()
        expect(':')
        skipWhitespace()
        val next = peek()
        if (next == '['.code && key.lowercase() in itemArrayKeys) {
            pos++
            mode = Mode.NESTED_ARRAY
            needComma = false
            return null
        }
        val value = readValue(1)
        if (next == '{'.code && key.isNotEmpty() && key.all { it in '0'..'9' }) return value
        metaFields[key] = value
        return null
    }

    private fun readValue(depth: Int): JsonElement {
        if (depth > MAX_DEPTH) throw JsonStreamSyntaxException("JSON nesting is too deep")
        skipWhitespace()
        return when (val c = peek()) {
            '{'.code -> readObject(depth)
            '['.code -> readArray(depth)
            '"'.code -> JsonPrimitive(readString())
            't'.code, 'f'.code, 'n'.code -> readLiteral()
            EOF -> throw EOFException("Truncated JSON body")
            else -> if (c == '-'.code || c in '0'.code..'9'.code) {
                readNumber()
            } else {
                throw JsonStreamSyntaxException("Unexpected '${c.toChar()}' in JSON value")
            }
        }
    }

    private fun readObject(depth: Int): JsonObject {
        pos++ // '{'
        val map = LinkedHashMap<String, JsonElement>()
        skipWhitespace()
        if (peek() == '}'.code) {
            pos++
            return JsonObject(map)
        }
        while (true) {
            skipWhitespace()
            if (peek() == '}'.code) { pos++; return JsonObject(map) } // trailing comma
            val key = readString()
            skipWhitespace()
            expect(':')
            map[key] = readValue(depth + 1)
            skipWhitespace()
            when (val c = read()) {
                ','.code -> continue
                '}'.code -> return JsonObject(map)
                EOF -> throw EOFException("Truncated JSON body")
                else -> throw JsonStreamSyntaxException("Expected ',' or '}' in object but found '${c.toChar()}'")
            }
        }
    }

    private fun readArray(depth: Int): JsonArray {
        pos++ // '['
        val list = ArrayList<JsonElement>()
        skipWhitespace()
        if (peek() == ']'.code) {
            pos++
            return JsonArray(list)
        }
        while (true) {
            skipWhitespace()
            if (peek() == ']'.code) { pos++; return JsonArray(list) } // trailing comma
            list += readValue(depth + 1)
            skipWhitespace()
            when (val c = read()) {
                ','.code -> continue
                ']'.code -> return JsonArray(list)
                EOF -> throw EOFException("Truncated JSON body")
                else -> throw JsonStreamSyntaxException("Expected ',' or ']' in array but found '${c.toChar()}'")
            }
        }
    }

    private fun readString(): String {
        if (peek() != '"'.code) {
            val c = peek()
            if (c == EOF) throw EOFException("Truncated JSON body")
            throw JsonStreamSyntaxException("Expected a string but found '${c.toChar()}'")
        }
        pos++
        var builder: StringBuilder? = null
        var start = pos
        while (true) {
            if (pos >= limit) {
                if (pos > start) builder = (builder ?: StringBuilder()).appendRange(buffer, start, pos)
                if (!fill()) throw EOFException("Truncated JSON string")
                start = pos
                continue
            }
            when (buffer[pos]) {
                '"' -> {
                    val result = if (builder == null) {
                        String(buffer, start, pos - start)
                    } else {
                        builder.appendRange(buffer, start, pos).toString()
                    }
                    pos++
                    return result
                }
                '\\' -> {
                    builder = (builder ?: StringBuilder()).appendRange(buffer, start, pos)
                    pos++
                    builder.append(readEscape())
                    start = pos
                }
                else -> pos++
            }
        }
    }

    private fun readEscape(): Char = when (val c = read()) {
        '"'.code -> '"'
        '\\'.code -> '\\'
        '/'.code -> '/'
        'b'.code -> '\b'
        'f'.code -> '\u000C'
        'n'.code -> '\n'
        'r'.code -> '\r'
        't'.code -> '\t'
        'u'.code -> {
            var value = 0
            repeat(4) {
                val digit = Character.digit(read(), 16)
                if (digit < 0) throw JsonStreamSyntaxException("Invalid \\u escape in JSON string")
                value = (value shl 4) or digit
            }
            value.toChar()
        }
        EOF -> throw EOFException("Truncated JSON string")
        else -> c.toChar() // lenient: unknown escapes keep the character
    }

    @OptIn(ExperimentalSerializationApi::class)
    private fun readNumber(): JsonPrimitive {
        val text = StringBuilder(12)
        while (true) {
            val c = peek()
            if (c == EOF) break
            val ch = c.toChar()
            if (ch in '0'..'9' || ch == '-' || ch == '+' || ch == '.' || ch == 'e' || ch == 'E') {
                text.append(ch)
                pos++
            } else {
                break
            }
        }
        return JsonUnquotedLiteral(text.toString())
    }

    private fun readLiteral(): JsonElement {
        val text = StringBuilder(5)
        while (true) {
            val c = peek()
            if (c == EOF || !c.toChar().isLetter()) break
            text.append(c.toChar())
            pos++
        }
        return when (text.toString()) {
            "true" -> JsonPrimitive(true)
            "false" -> JsonPrimitive(false)
            "null" -> JsonNull
            else -> if (peek() == EOF && text.length < 5) {
                throw EOFException("Truncated JSON literal")
            } else {
                throw JsonStreamSyntaxException("Unknown JSON literal '$text'")
            }
        }
    }

    private fun rejectHtml() {
        if (peek() == '<'.code) {
            throw JsonStreamSyntaxException("The server answered with a web page instead of JSON", looksLikeHtml = true)
        }
    }

    private fun expect(char: Char) {
        val c = read()
        if (c == char.code) return
        if (c == EOF) throw EOFException("Truncated JSON body")
        throw JsonStreamSyntaxException("Expected '$char' but found '${c.toChar()}'")
    }

    private fun skipBomAndWhitespace() {
        skipWhitespace()
        if (peek() == BOM) pos++
        skipWhitespace()
    }

    private fun skipWhitespace() {
        while (true) {
            if (pos >= limit && !fill()) return
            when (buffer[pos]) {
                ' ', '\n', '\r', '\t' -> pos++
                else -> return
            }
        }
    }

    private fun peek(): Int {
        if (pos >= limit && !fill()) return EOF
        return buffer[pos].code
    }

    private fun read(): Int {
        if (pos >= limit && !fill()) return EOF
        return buffer[pos++].code
    }

    private fun fill(): Boolean {
        val count = reader.read(buffer, 0, buffer.size)
        if (count <= 0) {
            pos = 0
            limit = 0
            return false
        }
        pos = 0
        limit = count
        return true
    }

    private enum class Mode { NOT_STARTED, TOP_ARRAY, TOP_OBJECT, NESTED_ARRAY, DONE }

    companion object {
        private const val EOF = -1
        private const val BOM = 0xFEFF
        private const val MAX_DEPTH = 64
        val DEFAULT_ITEM_ARRAY_KEYS = setOf("data", "streams", "items", "results", "result")
    }
}
