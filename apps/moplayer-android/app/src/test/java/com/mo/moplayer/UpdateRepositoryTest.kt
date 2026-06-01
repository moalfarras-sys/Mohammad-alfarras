package com.mo.moplayer

import com.mo.moplayer.data.update.UpdateRepository
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class UpdateRepositoryTest {

    @Test
    fun parseUpdateInfo_readsNestedConfigAndUpdateBlock() {
        val body = """
            {
              "source": "supabase",
              "config": {
                "forceUpdate": true,
                "minimumVersionCode": 16,
                "latestVersionName": "2.2.10",
                "latestVersionCode": 16,
                "update": {
                  "latestVersionName": "2.2.10",
                  "latestVersionCode": 16,
                  "downloadUrl": "/api/app/download/latest?product=moplayer",
                  "apkSizeBytes": 52745756,
                  "checksumSha256": "5704493457d577b0afe8e3abf9f04db104b4a3e4012a1c0997cf6bb3b4862164",
                  "releaseNotes": "Release notes"
                }
              }
            }
        """.trimIndent()

        val info = UpdateRepository.parseUpdateInfo(
            body = body,
            currentVersionCode = 15,
            currentVersionName = "2.2.9",
            absolutize = { "https://moalfarras.space/${it.trimStart('/')}" }
        )

        assertEquals("2.2.10", info.latestVersionName)
        assertEquals(16, info.latestVersionCode)
        assertEquals(52745756L, info.apkSizeBytes)
        assertEquals(
            "5704493457d577b0afe8e3abf9f04db104b4a3e4012a1c0997cf6bb3b4862164",
            info.checksumSha256
        )
        assertTrue(info.forceUpdate)
        assertTrue(info.updateAvailable)
        assertEquals(
            "https://moalfarras.space/api/app/download/latest?product=moplayer",
            info.downloadUrl
        )
    }

    @Test
    fun parseUpdateInfo_readsFlatFallbackShape() {
        val body = """
            {
              "forceUpdate": true,
              "latestVersionName": "2.2.10",
              "latestVersionCode": 16,
              "downloadUrl": "https://example.com/moplayer.apk"
            }
        """.trimIndent()

        val info = UpdateRepository.parseUpdateInfo(
            body = body,
            currentVersionCode = 16,
            currentVersionName = "2.2.10",
            absolutize = { it }
        )

        assertEquals("2.2.10", info.latestVersionName)
        assertEquals(16, info.latestVersionCode)
        assertTrue(info.forceUpdate)
        assertEquals("https://example.com/moplayer.apk", info.downloadUrl)
    }
}
