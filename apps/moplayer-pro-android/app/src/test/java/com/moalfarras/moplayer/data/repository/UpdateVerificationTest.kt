package com.moalfarras.moplayer.data.repository

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class UpdateVerificationTest {
    // SHA-256 of the three bytes "abc".
    private val abcDigest = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"

    @Test
    fun sha256OfAFile() {
        val file = File.createTempFile("update", ".apk")
        try {
            file.writeText("abc")
            assertEquals(abcDigest, sha256Hex(file))
        } finally {
            file.delete()
        }
    }

    @Test
    fun checksumComparisonIsFormatTolerant() {
        assertEquals(ChecksumStatus.MATCH, checksumStatus(abcDigest, abcDigest))
        assertEquals(ChecksumStatus.MATCH, checksumStatus(abcDigest.uppercase(), abcDigest))
        assertEquals(ChecksumStatus.MATCH, checksumStatus("  sha256:$abcDigest\n", abcDigest))
        assertEquals(ChecksumStatus.MISMATCH, checksumStatus(abcDigest.replace('b', 'c'), abcDigest))
    }

    @Test
    fun missingOrMalformedChecksumsAreReportedAsMissing() {
        assertEquals(ChecksumStatus.MISSING, checksumStatus("", abcDigest))
        assertEquals(ChecksumStatus.MISSING, checksumStatus("not-a-hash", abcDigest))
        assertEquals(ChecksumStatus.MISSING, checksumStatus(abcDigest.dropLast(1), abcDigest))
    }

    @Test
    fun downloadedApkMustMatchAdvertisedProductAndVersion() {
        val pro = "com.moalfarras.moplayerpro"
        assertTrue(archiveIsUpdate(pro, 69, pro, 68, 69))
        assertFalse("same build", archiveIsUpdate(pro, 68, pro, 68, 68))
        assertFalse("downgrade", archiveIsUpdate(pro, 60, pro, 68, 60))
        assertFalse("Classic is not Pro", archiveIsUpdate("com.mo.moplayer", 99, pro, 68, 99))
        assertFalse("unparseable APK", archiveIsUpdate(null, 99, pro, 68, 99))
        assertFalse("wrong newer build", archiveIsUpdate(pro, 70, pro, 68, 69))
        assertFalse("stale download", archiveIsUpdate(pro, 69, pro, 68, 70))
    }

    @Test
    fun fileSizeMustMatchReleaseMetadataWhenSupplied() {
        assertTrue(updateSizeMatches(1234, 1234))
        assertTrue(updateSizeMatches(null, 1234))
        assertFalse("truncated", updateSizeMatches(1234, 1233))
        assertFalse("oversized", updateSizeMatches(1234, 1235))
        assertFalse("empty file", updateSizeMatches(null, 0))
        assertFalse("invalid metadata", updateSizeMatches(0, 1234))
        assertFalse(updateSizeMatches(-1, 1234))
    }

    @Test
    fun rangeResponsesDecideAppendOrRestart() {
        assertEquals(ResumeAction.APPEND, resumeAction(1000, 206, "bytes 1000-4999/5000"))
        assertEquals("server ignored Range", ResumeAction.RESTART, resumeAction(1000, 200, null))
        assertEquals(ResumeAction.RESTART, resumeAction(0, 200, null))
        assertEquals("a range that starts elsewhere is unusable", ResumeAction.DISCARD_PARTIAL, resumeAction(1000, 206, "bytes 0-4999/5000"))
        assertEquals("partial no longer fits the file", ResumeAction.DISCARD_PARTIAL, resumeAction(9000, 416, "bytes */5000"))
        assertEquals(ResumeAction.FAIL, resumeAction(0, 503, null))
        assertEquals(ResumeAction.FAIL, resumeAction(1000, 404, null))
    }

    @Test
    fun contentRangeParsing() {
        assertEquals(1000L to 5000L, parseContentRange("bytes 1000-4999/5000"))
        assertEquals(1000L to null, parseContentRange("bytes 1000-4999/*"))
        assertNull(parseContentRange("bytes */5000"))
        assertNull(parseContentRange(null))
        assertNull(parseContentRange("bytes 1000-999/5000"))
        assertNull(parseContentRange("bytes 1000-5000/5000"))
        assertNull(parseContentRange("bytes 1000-4999/99999999999999999999999"))
    }
}
