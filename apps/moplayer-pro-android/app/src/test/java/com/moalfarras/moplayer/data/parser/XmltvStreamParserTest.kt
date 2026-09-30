package com.moalfarras.moplayer.data.parser

import com.moalfarras.moplayer.data.repository.epgChannelKeys
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.StringReader
import java.time.OffsetDateTime
import java.util.zip.GZIPOutputStream

class XmltvStreamParserTest {
    private val guide = """
        <?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE tv SYSTEM "xmltv.dtd">
        <tv generator-info-name="panel">
          <channel id="AlJazeera.qa"><display-name>Al Jazeera</display-name></channel>
          <!-- comment with <programme> inside must be ignored -->
          <programme start="20260930180000 +0300" stop="20260930190000 +0300" channel="AlJazeera.qa">
            <title lang="ar">الحصاد</title>
            <title lang="en">The Harvest</title>
            <desc lang="ar">نشرة&nbsp;المساء &amp; تحليل &#1605; R&D</desc>
            <category>News</category>
          </programme>
          <programme start="20260930190000 +0300" stop="20260930200000 +0300" channel="aljazeera.QA">
            <title><![CDATA[Sport <Live> & more]]></title>
          </programme>
          <programme start="20260930180000 +0000" stop="20260930190000 +0000" channel="unknown.channel">
            <title>Skipped</title>
          </programme>
          <programme start="20260930200000 +0300" channel="AlJazeera.qa" stop="20260930210000 +0300"/>
        </tv>
    """.trimIndent()

    private fun parse(
        text: String,
        keys: Collection<String> = listOf("AlJazeera.qa"),
        windowStart: Long = 0L,
        windowEnd: Long = 0L,
    ): List<XmltvProgramme> {
        val map = epgChannelKeys(keys)
        val parser = XmltvStreamParser(
            reader = StringReader(text),
            resolveChannel = { channel -> map[channel] ?: map[channel.lowercase()] },
            windowStart = windowStart,
            windowEnd = windowEnd,
        )
        return generateSequence { parser.next() }.toList()
    }

    @Test
    fun parsesProgrammesWithEntitiesCdataAndCaseInsensitiveChannels() {
        val programmes = parse(guide)

        assertEquals(2, programmes.size)
        val first = programmes[0]
        assertEquals("AlJazeera.qa", first.channelKey)
        assertEquals("الحصاد", first.title)
        assertEquals("نشرة المساء & تحليل م R&D", first.description)
        assertEquals("News", first.category)
        assertEquals(OffsetDateTime.parse("2026-09-30T18:00:00+03:00").toInstant().toEpochMilli(), first.startAt)
        assertEquals(OffsetDateTime.parse("2026-09-30T19:00:00+03:00").toInstant().toEpochMilli(), first.endAt)

        val second = programmes[1]
        assertEquals("AlJazeera.qa", second.channelKey)
        assertEquals("Sport <Live> & more", second.title)
    }

    @Test
    fun appliesTheTimeWindow() {
        val start = OffsetDateTime.parse("2026-09-30T19:30:00+03:00").toInstant().toEpochMilli()
        val programmes = parse(guide, windowStart = start, windowEnd = start + 60 * 60 * 1000L)

        assertEquals(listOf("Sport <Live> & more"), programmes.map { it.title })
    }

    @Test
    fun survivesBrokenMarkupAndTruncation() {
        val broken = """
            <tv>
            <programme start="20260930180000 +0000" stop="20260930190000 +0000" channel=AlJazeera.qa>
              <title>Tom & Jerry &unknown; <b>bold</b></title>
            </programme>
            <programme start="20260930190000 +0000" stop="20260930200000 +0000" channel="AlJazeera.qa">
              <title>Cut off
        """.trimIndent()

        val programmes = parse(broken)

        assertEquals(listOf("Tom & Jerry &unknown; bold", "Cut off"), programmes.map { it.title })
    }

    @Test
    fun openReaderGunzipsAndHonoursDeclaredCharset() {
        val latin = """<?xml version="1.0" encoding="ISO-8859-1"?><tv><programme start="20260930180000 +0000" stop="20260930190000 +0000" channel="AlJazeera.qa"><title>Café</title></programme></tv>"""
        val latinBytes = latin.toByteArray(Charsets.ISO_8859_1)
        val gzipped = ByteArrayOutputStream().also { out -> GZIPOutputStream(out).use { it.write(latinBytes) } }.toByteArray()

        listOf(latinBytes, gzipped).forEach { bytes ->
            val map = epgChannelKeys(listOf("AlJazeera.qa"))
            val parser = XmltvStreamParser(
                reader = XmltvStreamParser.openReader(ByteArrayInputStream(bytes)),
                resolveChannel = { map[it] },
            )
            assertEquals("Café", parser.next()?.title)
        }
    }

    @Test
    fun openReaderSkipsUtf8Bom() {
        val bytes = byteArrayOf(0xEF.toByte(), 0xBB.toByte(), 0xBF.toByte()) +
            """<tv><programme start="20260930180000 +0000" stop="20260930190000 +0000" channel="c"><title>قناة</title></programme></tv>""".toByteArray()
        val parser = XmltvStreamParser(XmltvStreamParser.openReader(ByteArrayInputStream(bytes)), { it })
        assertEquals("قناة", parser.next()?.title)
    }

    @Test
    fun parsesXmltvTimes() {
        val expected = OffsetDateTime.parse("2026-09-30T18:30:00+03:00").toInstant().toEpochMilli()
        assertEquals(expected, XmltvStreamParser.parseXmltvTime("20260930183000 +0300"))
        assertEquals(expected, XmltvStreamParser.parseXmltvTime("20260930183000+0300"))
        assertEquals(expected, XmltvStreamParser.parseXmltvTime("202609301830 +0300"))
        assertEquals(
            OffsetDateTime.parse("2026-09-30T18:30:00-05:30").toInstant().toEpochMilli(),
            XmltvStreamParser.parseXmltvTime("20260930183000 -0530"),
        )
        assertEquals(0L, XmltvStreamParser.parseXmltvTime("garbage"))
        assertEquals(0L, XmltvStreamParser.parseXmltvTime("20261332183000 +0000"))
        assertTrue(XmltvStreamParser.parseXmltvTime("20260930183000") > 0)
    }

    @Test
    fun channelKeysPreferExactMatchesThenCaseInsensitive() {
        val map = epgChannelKeys(listOf("BBC.uk", "bbc.uk", "101", ""))
        assertEquals("BBC.uk", map["BBC.uk"])
        assertEquals("bbc.uk", map["bbc.uk"])
        assertEquals("101", map["101"])
        assertEquals(null, map[""])
    }

    @Test
    fun skipsLargeGuidesQuicklyForUnknownChannels() {
        val text = buildString {
            append("<tv>")
            repeat(20_000) { index ->
                append("""<programme start="20260930180000 +0000" stop="20260930190000 +0000" channel="other$index"><title>T$index</title><desc>long description $index</desc></programme>""")
            }
            append("""<programme start="20260930180000 +0000" stop="20260930190000 +0000" channel="AlJazeera.qa"><title>Wanted</title></programme>""")
            append("</tv>")
        }

        assertEquals(listOf("Wanted"), parse(text).map { it.title })
    }
}
