package com.moalfarras.moplayer.ui.i18n

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LoginSettingsStringsTest {
    @Test
    fun areaStringsFollowTheSelectedLanguage() {
        assertEquals("Sign in", EnStrings.login.signIn)
        assertEquals("تسجيل الدخول", ArStrings.login.signIn)
        assertNotEquals(EnStrings.settings.lockTitle, ArStrings.settings.lockTitle)
        assertNotEquals(EnStrings.search.placeholder, ArStrings.search.placeholder)
    }

    @Test
    fun noCopyIsBlankInEitherLanguage() {
        listOf(EnStrings, ArStrings).forEach { strings ->
            assertNoBlankStrings(strings.login)
            assertNoBlankStrings(strings.settings)
            assertNoBlankStrings(strings.search)
        }
    }

    @Test
    fun arabicTextKeepsLatinDataInIsolates() {
        val title = ArStrings.settings.confirmDeleteTitle("Demo TV")
        assertTrue(title.contains("⁨Demo TV⁩"))
        assertTrue(ArStrings.login.qrValidFor("12:34").contains("⁦12:34⁩"))
        assertTrue(ArStrings.settings.updateVersions("2.6.5", "2.7.0").contains("⁦2.7.0⁩"))
    }

    @Test
    fun arabicDayCountsUseCorrectAgreement() {
        assertEquals("ينتهي اليوم", arabicDaysLeft(0))
        assertEquals("متبقٍ يوم واحد", arabicDaysLeft(1))
        assertEquals("متبقٍ يومان", arabicDaysLeft(2))
        assertEquals("متبقٍ ⁦5⁩ أيام", arabicDaysLeft(5))
        assertEquals("متبقٍ ⁦44⁩ يومًا", arabicDaysLeft(44))
        // Above 99 the last two digits decide the form.
        assertEquals("متبقٍ ⁦100⁩ يوم", arabicDaysLeft(100))
        assertEquals("متبقٍ ⁦102⁩ يوم", arabicDaysLeft(102))
        assertEquals("متبقٍ ⁦105⁩ أيام", arabicDaysLeft(105))
        assertEquals("متبقٍ ⁦365⁩ يومًا", arabicDaysLeft(365))
        assertEquals("متبقٍ ⁦300⁩ يوم", arabicDaysLeft(300))
        assertEquals("44 days left", EnStrings.settings.daysLeft(44))
        assertEquals("1 day left", EnStrings.settings.daysLeft(1))
    }

    @Test
    fun arabicMatchCountsUseCorrectAgreement() {
        assertEquals("مباراتان", arabicMatchesCount(2))
        assertEquals("⁦4⁩ مباريات", arabicMatchesCount(4))
        assertEquals("⁦12⁩ مباراة", arabicMatchesCount(12))
    }

    @Test
    fun accentNamesAreTranslatedWithEnglishFallback() {
        assertEquals("ذهبي", ArStrings.settings.accentLabel(0xFFF1CC83L, "Gold"))
        assertEquals("Custom", ArStrings.settings.accentLabel(0xFF000000L, "Custom"))
        assertEquals("Gold", EnStrings.settings.accentLabel(0xFFF1CC83L, "Gold"))
    }

    private fun assertNoBlankStrings(section: Any) {
        section.javaClass.declaredFields
            .filter { it.type == String::class.java }
            .forEach { field ->
                field.isAccessible = true
                val value = field.get(section) as String
                assertTrue("${section.javaClass.simpleName}.${field.name} is blank", value.isNotBlank())
            }
    }
}
