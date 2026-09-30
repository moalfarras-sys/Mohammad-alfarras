package com.moalfarras.moplayer.ui.i18n

import com.moalfarras.moplayer.core.UpdateState
import com.moalfarras.moplayer.data.repository.AppUpdateInfo
import com.moalfarras.moplayer.data.repository.UpdateError
import com.moalfarras.moplayer.ui.screens.updateStatusText
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class UpdateStringsTest {
    private val info = AppUpdateInfo(
        latestVersionName = "2.7.0",
        latestVersionCode = 69,
        downloadUrl = "https://moalfarras.space/api/app/download/latest?product=moplayer2",
        currentVersionCode = 68,
        currentVersionName = "2.6.5",
    )

    @Test
    fun noCopyIsBlankInEitherLanguage() {
        listOf(EnStrings, ArStrings).forEach { strings ->
            strings.update.javaClass.declaredFields
                .filter { it.type == String::class.java }
                .forEach { field ->
                    field.isAccessible = true
                    assertTrue("UpdateStrings.${field.name} is blank", (field.get(strings.update) as String).isNotBlank())
                }
            UpdateError.entries.forEach { error ->
                assertTrue("$error has no message", strings.update.error(error, "503").isNotBlank())
            }
        }
        assertNotEquals(EnStrings.update.blockUpdateTitle, ArStrings.update.blockUpdateTitle)
    }

    @Test
    fun arabicKeepsVersionsAndCodesLeftToRight() {
        assertTrue(ArStrings.update.versions("2.6.5", "2.7.0").contains("⁦2.7.0⁩"))
        assertTrue(ArStrings.update.downloaderHint("4608937").contains("⁦4608937⁩"))
        assertTrue(ArStrings.update.error(UpdateError.SERVER, "HTTP 503").contains("⁦HTTP 503⁩"))
    }

    @Test
    fun aFailedCheckIsNeverShownAsUpToDate() {
        listOf(EnStrings, ArStrings).forEach { strings ->
            val failed = updateStatusText(UpdateState.CheckFailed(info, 0L), strings.update, strings.settings)
            assertNotEquals(strings.settings.updateUpToDate, failed)
            val idle = updateStatusText(UpdateState.Idle, strings.update, strings.settings)
            assertNotEquals(strings.settings.updateUpToDate, idle)
        }
    }
}
