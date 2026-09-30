package com.moalfarras.moplayer.data.parser

import java.io.BufferedInputStream
import java.io.Closeable
import java.io.InputStream
import java.io.InputStreamReader
import java.io.Reader
import java.nio.charset.Charset
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.zip.GZIPInputStream

/** One `<programme>` that passed the caller's filter. [channelKey] is the caller's canonical key. */
data class XmltvProgramme(
    val channelKey: String,
    val startAt: Long,
    val endAt: Long,
    val title: String,
    val description: String,
    val category: String,
)

/**
 * Streaming, allocation-light XMLTV reader.
 *
 * Provider guides are often 20-120 MB. This walks the document once from a [Reader], decides at
 * each `<programme ...>` start tag whether the programme is wanted (via [resolveChannel] and the
 * time window) and skips unwanted ones without building any strings for their content.
 *
 * It is deliberately forgiving, because one bad byte must not throw away a whole guide:
 * undefined entities such as `&nbsp;`, stray `&`, unquoted attributes, CDATA, comments and
 * DOCTYPE are all handled, and a body that ends early simply ends the programme list.
 * (Android's XmlPullParser is strict about undefined entities and is only a stub in JVM unit
 * tests, which is why this does not use it.)
 *
 * @param resolveChannel maps an XMLTV channel id to the key stored in the database, or null to
 *   skip that channel.
 * @param windowStart programmes that ended before this instant are skipped (0 disables).
 * @param windowEnd programmes that start at or after this instant are skipped (0 disables).
 */
class XmltvStreamParser(
    private val reader: Reader,
    private val resolveChannel: (String) -> String?,
    private val windowStart: Long = 0L,
    private val windowEnd: Long = 0L,
) : Closeable {
    private val buffer = CharArray(32 * 1024)
    private var pos = 0
    private var limit = 0
    private var finished = false

    /** Returns the next wanted programme, or null at the end of the document. */
    fun next(): XmltvProgramme? {
        while (!finished) {
            if (!skipToTagStart()) break
            val tag = readTag() ?: continue
            if (tag.closing || tag.name != "programme") continue
            val channel = tag.attributes["channel"].orEmpty().trim()
            val startAt = parseXmltvTime(tag.attributes["start"].orEmpty())
            val endAt = parseXmltvTime(tag.attributes["stop"].orEmpty())
            val key = if (channel.isEmpty() || !inWindow(startAt, endAt)) null else resolveChannel(channel)
            if (key == null) {
                if (!tag.selfClosing) skipPast(PROGRAMME_END)
                continue
            }
            if (tag.selfClosing) continue
            val programme = readProgrammeBody(key, startAt, endAt)
            if (programme != null) return programme
        }
        return null
    }

    override fun close() = reader.close()

    private fun inWindow(startAt: Long, endAt: Long): Boolean {
        if (startAt <= 0L) return false
        if (windowStart > 0L) {
            if (endAt in 1 until windowStart) return false
            // A programme without a stop time is treated as open-ended; only keep recent ones.
            if (endAt <= 0L && startAt < windowStart - OPEN_ENDED_GRACE_MS) return false
        }
        if (windowEnd > 0L && startAt >= windowEnd) return false
        return true
    }

    private fun readProgrammeBody(key: String, startAt: Long, endAt: Long): XmltvProgramme? {
        var title = ""
        var description = ""
        var category = ""
        while (true) {
            if (!skipToTagStart()) break
            val tag = readTag() ?: continue
            if (tag.closing) {
                if (tag.name == "programme") break
                continue
            }
            if (tag.selfClosing) continue
            when (tag.name) {
                "title" -> readElementText("title").let { if (title.isBlank()) title = it }
                "desc" -> readElementText("desc").let { if (description.isBlank()) description = it }
                "category" -> readElementText("category").let { if (category.isBlank()) category = it }
            }
        }
        if (title.isBlank()) return null
        return XmltvProgramme(
            channelKey = key,
            startAt = startAt,
            endAt = endAt,
            title = title.trim(),
            description = description.trim(),
            category = category.trim(),
        )
    }

    /** Collects text (entities decoded, CDATA kept, nested tags ignored) up to `</name>`. */
    private fun readElementText(name: String): String {
        val text = StringBuilder()
        while (true) {
            val c = read()
            if (c == EOF) return text.toString()
            if (c != '<'.code) {
                if (c == '&'.code) text.append(readEntity()) else text.append(c.toChar())
                continue
            }
            if (startsWithAndConsume("![CDATA[")) {
                readUntil("]]>", text)
                continue
            }
            if (startsWithAndConsume("!--")) {
                readUntil("-->", null)
                continue
            }
            val tag = readTagAfterOpen() ?: continue
            if (tag.closing && tag.name == name) return text.toString()
        }
    }

    private class Tag(
        val name: String,
        val closing: Boolean,
        val selfClosing: Boolean,
        val attributes: Map<String, String>,
    )

    /** Scans text until '<' and consumes it. Returns false at the end of the document. */
    private fun skipToTagStart(): Boolean {
        while (true) {
            if (pos >= limit && !fill()) {
                finished = true
                return false
            }
            for (i in pos until limit) {
                if (buffer[i] == '<') {
                    pos = i + 1
                    return true
                }
            }
            pos = limit
        }
    }

    /** Reads markup right after '<'. Comments, CDATA, DOCTYPE and processing instructions return null. */
    private fun readTag(): Tag? {
        if (startsWithAndConsume("!--")) {
            readUntil("-->", null)
            return null
        }
        if (startsWithAndConsume("![CDATA[")) {
            readUntil("]]>", null)
            return null
        }
        val first = peek()
        if (first == '!'.code || first == '?'.code) {
            skipDeclaration()
            return null
        }
        return readTagAfterOpen()
    }

    private fun readTagAfterOpen(): Tag? {
        val closing = peek() == '/'.code
        if (closing) pos++
        val name = readName()
        if (name.isEmpty()) return null
        if (closing || name != "programme") {
            return Tag(name, closing, selfClosing = skipTagRest(), attributes = emptyMap())
        }
        val attributes = HashMap<String, String>(8)
        val selfClosing = readAttributes(attributes)
        return Tag(name, closing = false, selfClosing = selfClosing, attributes = attributes)
    }

    /** Skips to the end of a tag, honouring quoted values. Returns true for `/>`. */
    private fun skipTagRest(): Boolean {
        var previous = 0
        var quote = 0
        while (true) {
            val c = read()
            if (c == EOF) return false
            if (quote != 0) {
                if (c == quote) quote = 0
                continue
            }
            when (c) {
                '"'.code, '\''.code -> quote = c
                '>'.code -> return previous == '/'.code
            }
            previous = c
        }
    }

    /** Reads attributes into [into]. Returns true when the tag is self-closing. */
    private fun readAttributes(into: MutableMap<String, String>): Boolean {
        while (true) {
            skipWhitespace()
            when (peek()) {
                EOF -> return false
                '>'.code -> {
                    pos++
                    return false
                }
                '/'.code -> {
                    pos++
                    skipWhitespace()
                    if (peek() == '>'.code) pos++
                    return true
                }
                else -> {
                    val name = readName()
                    if (name.isEmpty()) {
                        pos++ // stray character inside the tag
                        continue
                    }
                    skipWhitespace()
                    if (peek() != '='.code) {
                        into[name] = ""
                        continue
                    }
                    pos++
                    skipWhitespace()
                    into[name] = readAttributeValue()
                }
            }
        }
    }

    private fun readAttributeValue(): String {
        val quote = peek()
        val value = StringBuilder()
        if (quote == '"'.code || quote == '\''.code) {
            pos++
            while (true) {
                val c = read()
                if (c == EOF || c == quote) return value.toString()
                if (c == '&'.code) value.append(readEntity()) else value.append(c.toChar())
            }
        }
        while (true) {
            val c = peek()
            if (c == EOF || c == '>'.code || c == '/'.code || c.toChar().isWhitespace()) return value.toString()
            pos++
            if (c == '&'.code) value.append(readEntity()) else value.append(c.toChar())
        }
    }

    private fun readName(): String {
        val name = StringBuilder(12)
        while (true) {
            val c = peek()
            if (c == EOF) break
            val ch = c.toChar()
            if (ch.isLetterOrDigit() || ch == '-' || ch == '_' || ch == ':' || ch == '.') {
                name.append(ch)
                pos++
            } else {
                break
            }
        }
        return name.toString()
    }

    /** Decodes an entity after '&'. Unknown or broken entities are kept as literal text. */
    private fun readEntity(): String {
        val name = StringBuilder(8)
        while (name.length < MAX_ENTITY_LENGTH) {
            val c = peek()
            if (c == EOF) return "&$name"
            val ch = c.toChar()
            if (ch == ';') {
                pos++
                return decodeEntity(name.toString()) ?: "&$name;"
            }
            if (!(ch.isLetterOrDigit() || ch == '#')) return "&$name"
            name.append(ch)
            pos++
        }
        return "&$name"
    }

    private fun decodeEntity(name: String): String? = when (name) {
        "amp" -> "&"
        "lt" -> "<"
        "gt" -> ">"
        "quot" -> "\""
        "apos" -> "'"
        "nbsp" -> " "
        else -> if (name.startsWith("#")) {
            val code = if (name.startsWith("#x") || name.startsWith("#X")) {
                name.substring(2).toIntOrNull(16)
            } else {
                name.substring(1).toIntOrNull()
            }
            code?.takeIf { Character.isValidCodePoint(it) }?.let { String(Character.toChars(it)) }
        } else {
            null
        }
    }

    /** Skips `<!DOCTYPE ...>` (including an internal `[...]` subset) and `<?...?>`. */
    private fun skipDeclaration() {
        var depth = 0
        while (true) {
            val c = read()
            if (c == EOF) return
            when (c) {
                '['.code -> depth++
                ']'.code -> if (depth > 0) depth--
                '>'.code -> if (depth == 0) return
            }
        }
    }

    /** Skips input past [marker] and the '>' that closes it (used for unwanted programmes). */
    private fun skipPast(marker: String) {
        readUntil(marker, null)
        while (true) {
            val c = read()
            if (c == EOF || c == '>'.code) return
        }
    }

    /**
     * Consumes input up to and including [terminator] (prefix-function matching, so overlaps
     * such as `--->` are handled) and appends the text before it to [into].
     */
    private fun readUntil(terminator: String, into: StringBuilder?) {
        val failure = prefixFunction(terminator)
        var matched = 0
        while (true) {
            val c = read()
            if (c == EOF) {
                into?.append(terminator, 0, matched)
                return
            }
            while (matched > 0 && c != terminator[matched].code) {
                val keep = failure[matched - 1]
                into?.append(terminator, 0, matched - keep)
                matched = keep
            }
            if (c == terminator[matched].code) {
                matched++
                if (matched == terminator.length) return
            } else {
                into?.append(c.toChar())
            }
        }
    }

    private fun startsWithAndConsume(text: String): Boolean {
        if (!ensureAvailable(text.length)) return false
        for (i in text.indices) {
            if (buffer[pos + i] != text[i]) return false
        }
        pos += text.length
        return true
    }

    /** Makes sure [count] chars are buffered from [pos], compacting the buffer if needed. */
    private fun ensureAvailable(count: Int): Boolean {
        if (limit - pos >= count) return true
        if (pos > 0) {
            System.arraycopy(buffer, pos, buffer, 0, limit - pos)
            limit -= pos
            pos = 0
        }
        while (limit < count) {
            val read = reader.read(buffer, limit, buffer.size - limit)
            if (read <= 0) return false
            limit += read
        }
        return true
    }

    private fun skipWhitespace() {
        while (true) {
            val c = peek()
            if (c == EOF || !c.toChar().isWhitespace()) return
            pos++
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
        pos = 0
        limit = count.coerceAtLeast(0)
        return count > 0
    }

    companion object {
        private const val EOF = -1
        private const val MAX_ENTITY_LENGTH = 10
        private const val PROGRAMME_END = "</programme"
        private const val PROLOG_PEEK_BYTES = 256
        private const val OPEN_ENDED_GRACE_MS = 6L * 60L * 60L * 1000L

        /**
         * Opens a guide body for parsing: transparently gunzips `.xml.gz` payloads served without
         * `Content-Encoding` (detected by the 1F 8B magic bytes, not by the file name) and picks
         * the charset from a BOM or the XML declaration (UTF-8 when absent).
         */
        fun openReader(input: InputStream): Reader {
            val raw = input as? BufferedInputStream ?: BufferedInputStream(input, 64 * 1024)
            raw.mark(2)
            val b0 = raw.read()
            val b1 = raw.read()
            raw.reset()
            val decoded = if (b0 == 0x1f && b1 == 0x8b) {
                BufferedInputStream(GZIPInputStream(raw, 64 * 1024), 64 * 1024)
            } else {
                raw
            }
            return InputStreamReader(decoded, detectCharset(decoded))
        }

        private fun detectCharset(input: BufferedInputStream): Charset {
            input.mark(PROLOG_PEEK_BYTES)
            val head = ByteArray(PROLOG_PEEK_BYTES)
            var read = 0
            while (read < head.size) {
                val count = input.read(head, read, head.size - read)
                if (count <= 0) break
                read += count
            }
            input.reset()
            if (read >= 2) {
                val first = head[0].toInt() and 0xff
                val second = head[1].toInt() and 0xff
                if (first == 0xfe && second == 0xff) return Charsets.UTF_16BE
                if (first == 0xff && second == 0xfe) return Charsets.UTF_16LE
            }
            val prolog = String(head, 0, read, Charsets.ISO_8859_1)
            val declared = XML_ENCODING.find(prolog)?.groupValues?.getOrNull(1) ?: return Charsets.UTF_8
            return runCatching { Charset.forName(declared) }.getOrDefault(Charsets.UTF_8)
        }

        private val XML_ENCODING = Regex("""<\?xml[^>]*encoding\s*=\s*["']([A-Za-z0-9._-]+)["']""")

        private fun prefixFunction(pattern: String): IntArray {
            val result = IntArray(pattern.length)
            var k = 0
            for (i in 1 until pattern.length) {
                while (k > 0 && pattern[i] != pattern[k]) k = result[k - 1]
                if (pattern[i] == pattern[k]) k++
                result[i] = k
            }
            return result
        }

        /**
         * Parses XMLTV times such as `20260930183000 +0300`, `20260930183000+0000`,
         * `202609301830 +0300` or `20260930183000` (device zone). Returns 0 when invalid.
         */
        fun parseXmltvTime(value: String): Long {
            val text = value.trim()
            if (text.length < 12) return 0L
            var index = 0
            fun digits(count: Int): Int {
                var result = 0
                repeat(count) {
                    val ch = text.getOrNull(index) ?: return -1
                    if (ch !in '0'..'9') return -1
                    result = result * 10 + (ch - '0')
                    index++
                }
                return result
            }
            val year = digits(4)
            val month = digits(2)
            val day = digits(2)
            val hour = digits(2)
            val minute = digits(2)
            val second = if (text.getOrNull(index)?.isDigit() == true) digits(2) else 0
            if (year < 1970 || month !in 1..12 || day !in 1..31 || hour !in 0..23 || minute !in 0..59 || second !in 0..59) {
                return 0L
            }
            val offsetText = text.substring(index).trim()
            val offsetSeconds: Int? = if (offsetText.length >= 5 && (offsetText[0] == '+' || offsetText[0] == '-')) {
                val hh = offsetText.substring(1, 3).toIntOrNull()
                val mm = offsetText.substring(3, 5).toIntOrNull()
                if (hh == null || mm == null) null else (hh * 3600 + mm * 60) * if (offsetText[0] == '-') -1 else 1
            } else {
                null
            }
            val localSeconds = daysFromCivil(year, month, day) * 86_400L + hour * 3_600L + minute * 60L + second
            val offset = offsetSeconds ?: runCatching {
                ZoneId.systemDefault().rules
                    .getOffset(LocalDateTime.of(year, month, day, hour, minute, second))
                    .totalSeconds
            }.getOrDefault(0)
            return (localSeconds - offset) * 1000L
        }

        /** Days since 1970-01-01 for a proleptic Gregorian date (H. Hinnant's algorithm). */
        private fun daysFromCivil(year: Int, month: Int, day: Int): Long {
            val y = if (month <= 2) year - 1 else year
            val era = (if (y >= 0) y else y - 399) / 400
            val yoe = y - era * 400
            val mp = (month + 9) % 12
            val doy = (153 * mp + 2) / 5 + day - 1
            val doe = yoe * 365 + yoe / 4 - yoe / 100 + doy
            return era * 146_097L + doe - 719_468L
        }
    }
}
