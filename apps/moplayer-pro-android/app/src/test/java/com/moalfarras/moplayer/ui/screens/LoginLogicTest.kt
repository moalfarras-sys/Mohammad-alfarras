package com.moalfarras.moplayer.ui.screens

import com.moalfarras.moplayer.domain.model.DeviceActivationStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LoginLogicTest {
    @Test
    fun playlistSizeGuardLeavesRoomForParsing() {
        val heap = 192L * 1024 * 1024
        assertTrue(playlistFitsInMemory(20L * 1024 * 1024, heap))
        assertTrue(playlistFitsInMemory(32L * 1024 * 1024, heap))
        assertFalse(playlistFitsInMemory(33L * 1024 * 1024, heap))
        assertFalse(playlistFitsInMemory(90L * 1024 * 1024, heap))
    }

    @Test
    fun unknownPlaylistSizeIsAllowed() {
        assertTrue(playlistFitsInMemory(-1L, 128L * 1024 * 1024))
        assertTrue(playlistFitsInMemory(0L, 128L * 1024 * 1024))
    }

    @Test
    fun countdownIsMinutesAndPaddedSeconds() {
        assertEquals("15:00", formatCountdown(900))
        assertEquals("12:34", formatCountdown(754))
        assertEquals("0:09", formatCountdown(9))
        assertEquals("0:00", formatCountdown(0))
        assertEquals("0:00", formatCountdown(-5))
    }

    @Test
    fun activationUrlIsShortenedForDisplayButKeepsTheProduct() {
        assertEquals(
            "moalfarras.space/activate?product=moplayer2",
            displayActivationUrl("https://moalfarras.space/activate?product=moplayer2"),
        )
        assertEquals("moalfarras.space/activate", displayActivationUrl("https://www.moalfarras.space/activate/"))
        assertEquals("example.com/a", displayActivationUrl(" http://example.com/a "))
    }

    @Test
    fun browserChooserOnlyWhereTheAppCouldHandleTheLinkItself() {
        assertFalse(browserIntentNeedsChooser(23))
        assertTrue(browserIntentNeedsChooser(24))
        assertTrue(browserIntentNeedsChooser(30))
        assertFalse(browserIntentNeedsChooser(31))
        assertFalse(browserIntentNeedsChooser(36))
    }

    @Test
    fun expiredCodesRenewAutomaticallyOnlyAFewTimes() {
        assertTrue(shouldAutoRenewQr(DeviceActivationStatus.EXPIRED, 0))
        assertTrue(shouldAutoRenewQr(DeviceActivationStatus.EXPIRED, MAX_AUTO_QR_RENEWALS - 1))
        assertFalse(shouldAutoRenewQr(DeviceActivationStatus.EXPIRED, MAX_AUTO_QR_RENEWALS))
        assertFalse(shouldAutoRenewQr(DeviceActivationStatus.ERROR, 0))
        assertFalse(shouldAutoRenewQr(DeviceActivationStatus.WAITING, 0))
        assertFalse(shouldAutoRenewQr(null, 0))
    }

    @Test
    fun qrPhaseFollowsSessionAndSignIn() {
        assertEquals(QrPhase.Creating, qrPhase(null, signingIn = false, failed = false, autoRenewing = false, renewalsSoFar = 0))
        assertEquals(QrPhase.Failed, qrPhase(null, signingIn = false, failed = true, autoRenewing = false, renewalsSoFar = 0))
        assertEquals(QrPhase.Renewing, qrPhase(null, signingIn = false, failed = false, autoRenewing = true, renewalsSoFar = 1))
        assertEquals(QrPhase.Waiting, qrPhase(DeviceActivationStatus.WAITING, signingIn = false, failed = false, autoRenewing = false, renewalsSoFar = 0))
        assertEquals(QrPhase.Received, qrPhase(DeviceActivationStatus.ACTIVATED, signingIn = false, failed = false, autoRenewing = false, renewalsSoFar = 0))
        assertEquals(QrPhase.Received, qrPhase(DeviceActivationStatus.WAITING, signingIn = true, failed = false, autoRenewing = false, renewalsSoFar = 0))
        assertEquals(QrPhase.Failed, qrPhase(DeviceActivationStatus.ERROR, signingIn = false, failed = false, autoRenewing = false, renewalsSoFar = 0))
    }

    @Test
    fun failedImportAfterScanOffersRetryInsteadOfEndlessSpinner() {
        assertEquals(QrPhase.Failed, qrPhase(DeviceActivationStatus.ACTIVATED, signingIn = false, failed = true, autoRenewing = false, renewalsSoFar = 0))
        // While the import is still running the panel keeps showing progress.
        assertEquals(QrPhase.Received, qrPhase(DeviceActivationStatus.ACTIVATED, signingIn = true, failed = true, autoRenewing = false, renewalsSoFar = 0))
    }

    @Test
    fun expiredPhaseAsksTheUserOnceAutoRenewalIsUsedUp() {
        assertEquals(QrPhase.Renewing, qrPhase(DeviceActivationStatus.EXPIRED, false, false, false, MAX_AUTO_QR_RENEWALS - 1))
        assertEquals(QrPhase.Expired, qrPhase(DeviceActivationStatus.EXPIRED, false, false, false, MAX_AUTO_QR_RENEWALS))
    }

    @Test
    fun qrCellsAreWholePixelsWithAQuietZone() {
        // Version 6 symbol (41 modules) + 4-module quiet zone on each side = 49 cells.
        assertEquals(10, qrCellPx(targetPx = 520, modules = 41, quietModules = 4))
        assertEquals(10, qrCellPx(targetPx = 538, modules = 41, quietModules = 4))
        assertEquals(1, qrCellPx(targetPx = 10, modules = 41, quietModules = 4))
    }
}
