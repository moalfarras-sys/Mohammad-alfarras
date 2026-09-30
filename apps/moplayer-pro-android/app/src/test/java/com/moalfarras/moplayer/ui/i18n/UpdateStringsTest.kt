package com.moalfarras.moplayer.ui.i18n

import com.moalfarras.moplayer.core.UpdateState
import com.moalfarras.moplayer.data.repository.AppUpdateInfo
import com.moalfarras.moplayer.data.repository.UpdateError
import com.moalfarras.moplayer.ui.screens.deviceProfileLine
import com.moalfarras.moplayer.ui.screens.updateStatusText
import org.junit.Assert.assertEquals
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
    fun deviceProfileLineIsolatesOnlyItsLtrParts() {
        assertEquals("Balanced · 2.0 GB RAM · ⁦FHD⁩", deviceProfileLine("Balanced", 2048, "FHD", EnStrings.update))
        assertEquals("Balanced · ⁦4K HDR⁩", deviceProfileLine("Balanced", 0, "4K HDR", EnStrings.update))
        // The Arabic tier leads (RTL sentence); RAM and the display label stay LTR runs inside it.
        val ar = deviceProfileLine(ArStrings.perfBalanced, 2048, "FHD", ArStrings.update)
        assertTrue(ar.startsWith(ArStrings.perfBalanced))
        assertTrue(ar.contains("⁦2.0 GB⁩"))
        assertTrue(ar.endsWith("⁦FHD⁩"))
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
