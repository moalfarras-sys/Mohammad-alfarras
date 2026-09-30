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
    fun downloadedApkMustBeThisProductAndNewer() {
        assertTrue(archiveIsUpdate("com.moalfarras.moplayerpro", 69, "com.moalfarras.moplayerpro", 68))
        assertFalse("same build", archiveIsUpdate("com.moalfarras.moplayerpro", 68, "com.moalfarras.moplayerpro", 68))
        assertFalse("downgrade", archiveIsUpdate("com.moalfarras.moplayerpro", 60, "com.moalfarras.moplayerpro", 68))
        assertFalse("Classic is not Pro", archiveIsUpdate("com.mo.moplayer", 99, "com.moalfarras.moplayerpro", 68))
        assertFalse("unparseable APK", archiveIsUpdate(null, 99, "com.moalfarras.moplayerpro", 68))
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
    }
}
