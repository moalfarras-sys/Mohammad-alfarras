package com.moalfarras.moplayer.data.repository

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

/** Exercises the repository's actual verification gate on Android, not only its pure helpers. */
@RunWith(AndroidJUnit4::class)
class UpdateVerificationInstrumentedTest {
    private val context = InstrumentationRegistry.getInstrumentation().targetContext
    private val repository = UpdateRepository(context)

    @Test
    fun missingOrIncorrectIntegrityMetadataNeverReachesInstaller() = runBlocking {
        val file = File.createTempFile("update-verification", ".apk", context.cacheDir)
        try {
            file.writeText("not an APK")
            val info = AppUpdateInfo("next", 72, "https://example.invalid/update.apk", currentVersionCode = 71)
            assertEquals(UpdateError.CHECKSUM, repository.verify(file, info))
            assertEquals(UpdateError.CHECKSUM, repository.verify(file, info.copy(checksumSha256 = "malformed")))
            assertEquals(UpdateError.CHECKSUM, repository.verify(file, info.copy(checksumSha256 = "0".repeat(64))))
            val matchingHash = info.copy(checksumSha256 = sha256Hex(file))
            assertEquals(UpdateError.INVALID_APK, repository.verify(file, matchingHash))
            assertEquals(UpdateError.INVALID_APK, repository.verify(file, matchingHash.copy(apkSizeBytes = file.length() + 1)))
        } finally {
            file.delete()
        }
    }

    @Test
    fun aRealDebugApkCannotBeOfferedAsTheReleaseProduct() = runBlocking {
        val apk = File(context.applicationInfo.sourceDir)
        val info = AppUpdateInfo("debug is not release", 71, "https://example.invalid/update.apk",
            apkSizeBytes = apk.length(), checksumSha256 = sha256Hex(apk), currentVersionCode = 70)
        assertEquals(UpdateError.INVALID_APK, repository.verify(apk, info))
    }
}
