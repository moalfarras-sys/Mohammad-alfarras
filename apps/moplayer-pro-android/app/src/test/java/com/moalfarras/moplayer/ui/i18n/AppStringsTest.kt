package com.moalfarras.moplayer.ui.i18n

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AppStringsTest {
    @Test
    fun shellCopyFollowsTheSelectedLanguage() {
        assertEquals("Press Back again to exit MoPlayer Pro", EnStrings.app.pressBackAgainToExit)
        assertEquals("اضغط رجوع مرة أخرى للخروج من MoPlayer Pro", ArStrings.app.pressBackAgainToExit)
        assertNotEquals(EnStrings.app.wrongPin, ArStrings.app.wrongPin)
    }

    @Test
    fun noCopyIsBlankInEitherLanguage() {
        listOf(EnAppStrings, ArAppStrings).forEach { strings ->
            strings.javaClass.declaredFields
                .filter { it.type == String::class.java }
                .forEach { field ->
                    field.isAccessible = true
                    assertTrue("AppStrings.${field.name} is blank", (field.get(strings) as String).isNotBlank())
                }
        }
    }

    @Test
    fun arabicSecondsAgreeWithTheCount() {
        assertEquals("ثانية واحدة", arabicSeconds(1))
        assertEquals("ثانيتين", arabicSeconds(2))
        assertEquals("⁦7⁩ ثوانٍ", arabicSeconds(7))
        assertEquals("⁦30⁩ ثانية", arabicSeconds(30))
        assertEquals("⁦103⁩ ثوانٍ", arabicSeconds(103))
        assertEquals("⁦200⁩ ثانية", arabicSeconds(200))
    }

    @Test
    fun hostsAndCountsStayLeftToRightInArabic() {
        assertTrue(ArAppStrings.pinLockedOut(30).contains("⁦30⁩"))
        assertTrue(EnAppStrings.pinLockedOut(30).contains("⁦30⁩ seconds"))
        assertEquals("Too many wrong PINs. Try again in 1 second.", EnAppStrings.pinLockedOut(1))
        val body = ArAppStrings.importLinkBody("panel.example".ltr())
        assertTrue(body.contains("⁦panel.example⁩"))
    }
}
