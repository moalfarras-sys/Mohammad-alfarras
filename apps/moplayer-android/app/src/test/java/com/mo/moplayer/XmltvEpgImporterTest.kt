package com.mo.moplayer

import com.mo.moplayer.data.epg.XmltvEpgImporter
import com.mo.moplayer.data.parser.M3uParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class XmltvEpgImporterTest {

    @Test
    fun parsesXmltvTimeWithOffset() {
        // 2026-10-04 20:30:00 +0200 == 18:30:00 UTC
        assertEquals(1791138600000L, XmltvEpgImporter.parseXmltvTime("20261004203000 +0200"))
    }

    @Test
    fun parsesXmltvTimeWithoutOffsetAsUtc() {
        assertEquals(1791145800000L, XmltvEpgImporter.parseXmltvTime("20261004203000"))
    }

    @Test
    fun rejectsUnreadableTime() {
        assertEquals(0L, XmltvEpgImporter.parseXmltvTime(""))
        assertEquals(0L, XmltvEpgImporter.parseXmltvTime("not a date"))
    }

    @Test
    fun normalizesChannelNamesForMatching() {
        assertEquals(
            XmltvEpgImporter.normalizeName("BEIN SPORTS 1"),
            XmltvEpgImporter.normalizeName("beIN Sports 1 HD")
        )
        assertEquals("mbc 1", XmltvEpgImporter.normalizeName("MBC-1 FHD"))
    }

    @Test
    fun readsGuideUrlFromPlaylistHeader() {
        assertEquals(
            "https://example.com/guide.xml.gz",
            M3uParser.headerEpgUrl("#EXTM3U url-tvg=\"https://example.com/guide.xml.gz,https://b.example/x.xml\"")
        )
        assertEquals(
            "http://epg.example/x.xml",
            M3uParser.headerEpgUrl("#EXTM3U x-tvg-url=\"http://epg.example/x.xml\" tvg-shift=\"0\"")
        )
        assertNull(M3uParser.headerEpgUrl("#EXTM3U"))
    }
}
