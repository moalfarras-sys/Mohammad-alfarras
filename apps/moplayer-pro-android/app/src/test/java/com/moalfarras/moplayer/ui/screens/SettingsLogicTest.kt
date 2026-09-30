package com.moalfarras.moplayer.ui.screens

import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.ui.i18n.ArStrings
import com.moalfarras.moplayer.ui.i18n.EnStrings
import com.moalfarras.moplayer.ui.i18n.settings
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SettingsLogicTest {
    @Test
    fun pinMustBeTypedTwiceIdentically() {
        assertTrue(canSavePin("1234", "1234"))
        assertTrue(canSavePin("12345678", "12345678"))
        assertFalse(canSavePin("1234", "1243"))
        assertFalse(canSavePin("1234", ""))
        assertFalse(canSavePin("123", "123"))
        assertFalse(canSavePin("123456789", "123456789"))
        assertFalse(canSavePin("12a4", "12a4"))
    }

    @Test
    fun pinFeedbackPointsAtTheFirstProblem() {
        assertNull(pinEntryIssue("", ""))
        assertEquals(PinEntryIssue.Length, pinEntryIssue("12", ""))
        assertNull(pinEntryIssue("1234", ""))
        // A confirmation that is still being typed and matches so far is fine.
        assertNull(pinEntryIssue("1234", "12"))
        assertEquals(PinEntryIssue.Mismatch, pinEntryIssue("1234", "13"))
        assertEquals(PinEntryIssue.Mismatch, pinEntryIssue("1234", "12345"))
        assertNull(pinEntryIssue("1234", "1234"))
    }

    @Test
    fun providerStatusIsLocalized() {
        val en = EnStrings.settings
        val ar = ArStrings.settings
        assertEquals("Active", localizedAccountStatus("", en))
        assertEquals("Active", localizedAccountStatus("active", en))
        assertEquals(ar.statusActive, localizedAccountStatus("Active", ar))
        assertEquals(ar.statusExpired, localizedAccountStatus("Expired", ar))
        assertEquals(ar.statusBanned, localizedAccountStatus("Banned", ar))
        assertEquals(ar.statusDisabled, localizedAccountStatus(" Disabled ", ar))
        // Unknown panel values are shown as sent, isolated for RTL.
        assertEquals("⁨Trial⁩", localizedAccountStatus("Trial", ar))
    }

    @Test
    fun daysUntilAcceptsSecondsOrMillisAndNeverGoesNegative() {
        val now = 1_700_000_000_000L
        val inTenDaysMs = now + 10L * 86_400_000L
        assertEquals(10L, daysUntil(inTenDaysMs, now))
        assertEquals(10L, daysUntil(inTenDaysMs / 1000L, now))
        assertEquals(0L, daysUntil(now - 86_400_000L, now))
    }

    @Test
    fun searchSectionsStartAtEveryTypeChange() {
        assertEquals(SearchSection(ContentType.LIVE, more = false), searchSectionBetween(null, ContentType.LIVE))
        assertNull(searchSectionBetween(ContentType.LIVE, ContentType.LIVE))
        assertEquals(SearchSection(ContentType.MOVIE, more = false), searchSectionBetween(ContentType.LIVE, ContentType.MOVIE))
        assertEquals(SearchSection(ContentType.EPISODE, more = false), searchSectionBetween(ContentType.SERIES, ContentType.EPISODE))
        assertNull(searchSectionBetween(ContentType.MOVIE, null))
    }

    @Test
    fun returningToAnEarlierTypeIsLabelledAsMoreMatches() {
        assertEquals(SearchSection(ContentType.LIVE, more = true), searchSectionBetween(ContentType.EPISODE, ContentType.LIVE))
        assertEquals(SearchSection(ContentType.MOVIE, more = true), searchSectionBetween(ContentType.SERIES, ContentType.MOVIE))
    }
}
