package com.moalfarras.moplayer.core

import android.content.pm.PackageInstaller
import com.moalfarras.moplayer.data.repository.AppUpdateInfo
import com.moalfarras.moplayer.data.repository.UpdateError
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class UpdateFlowLogicTest {
    private val info = AppUpdateInfo(
        latestVersionName = "2.7.0",
        latestVersionCode = 69,
        downloadUrl = "https://moalfarras.space/api/app/download/latest?product=moplayer2",
        currentVersionCode = 68,
        currentVersionName = "2.6.5",
    )

    @Test
    fun primaryButtonActionPerState() {
        assertEquals(UpdateAction.CHECK, primaryUpdateAction(UpdateState.Idle))
        assertEquals(UpdateAction.CHECK, primaryUpdateAction(UpdateState.UpToDate(info, 1L)))
        assertEquals("a failed check offers Retry, never 'up to date'", UpdateAction.RETRY, primaryUpdateAction(UpdateState.CheckFailed(null, 0L)))
        assertEquals(UpdateAction.DOWNLOAD, primaryUpdateAction(UpdateState.Available(info, 1L)))
        assertEquals("the focused button cancels instead of being disabled", UpdateAction.CANCEL, primaryUpdateAction(UpdateState.Downloading(info, 10, 100, false)))
        assertEquals(UpdateAction.BUSY, primaryUpdateAction(UpdateState.Verifying(info)))
        assertEquals(UpdateAction.INSTALL, primaryUpdateAction(UpdateState.ReadyToInstall(info)))
        assertEquals(UpdateAction.ALLOW_INSTALLS, primaryUpdateAction(UpdateState.NeedsPermission(info)))
        assertEquals(UpdateAction.BUSY, primaryUpdateAction(UpdateState.Installing(info)))
        assertEquals(UpdateAction.RETRY, primaryUpdateAction(UpdateState.Failed(info, UpdateError.STALLED)))
    }

    @Test
    fun metadataNeverDeletesFilesAJobIsUsing() {
        assertTrue(updateFilesInUse(UpdateState.Downloading(info, 10, 100, false)))
        assertTrue(updateFilesInUse(UpdateState.Verifying(info)))
        assertTrue(updateFilesInUse(UpdateState.Installing(info)))
        assertFalse(updateFilesInUse(UpdateState.Idle))
        assertFalse(updateFilesInUse(UpdateState.Available(info, 1L)))
        assertFalse(updateFilesInUse(UpdateState.ReadyToInstall(info)))
        assertFalse(updateFilesInUse(UpdateState.Failed(info, UpdateError.NETWORK)))
    }

    @Test
    fun downloadPercentIsUnknownWithoutATotal() {
        assertEquals(42, UpdateState.Downloading(info, 42, 100, false).percent)
        assertNull(UpdateState.Downloading(info, 42, -1, false).percent)
        assertEquals(100, UpdateState.Downloading(info, 150, 100, false).percent)
    }

    @Test
    fun installStatusesMapToUserErrors() {
        assertNull(installStatusError(PackageInstaller.STATUS_SUCCESS))
        assertNull(installStatusError(PackageInstaller.STATUS_PENDING_USER_ACTION))
        assertEquals(UpdateError.INSTALL_CANCELLED, installStatusError(PackageInstaller.STATUS_FAILURE_ABORTED))
        assertEquals(UpdateError.INSTALL_CONFLICT, installStatusError(PackageInstaller.STATUS_FAILURE_CONFLICT))
        assertEquals(UpdateError.INSTALL_STORAGE, installStatusError(PackageInstaller.STATUS_FAILURE_STORAGE))
        assertEquals(UpdateError.INSTALL_BLOCKED, installStatusError(PackageInstaller.STATUS_FAILURE_BLOCKED))
        assertEquals(UpdateError.INSTALL_INCOMPATIBLE, installStatusError(PackageInstaller.STATUS_FAILURE_INCOMPATIBLE))
        assertEquals(UpdateError.INVALID_APK, installStatusError(PackageInstaller.STATUS_FAILURE_INVALID))
        assertEquals(UpdateError.INSTALL_FAILED, installStatusError(PackageInstaller.STATUS_FAILURE))
    }

    @Test
    fun onlyPlaylistLinksAreImported() {
        val own = setOf("moalfarras.space", "mohammad-alfarras.vercel.app")
        assertTrue(isImportablePlaylistLink("m3u://panel.example/list", own))
        assertTrue(isImportablePlaylistLink("http://panel.example:8080/get.php?username=a&password=b&type=m3u_plus", own))
        assertTrue(isImportablePlaylistLink("https://cdn.example/lists/my.list.M3U", own))
        assertTrue(isImportablePlaylistLink("http://panel.example/c/playlist.php?u=1", own))
        assertTrue(isImportablePlaylistLink("http://panel.example/player_api.php?username=a&password=b", own))
        assertTrue(isImportablePlaylistLink("https://cdn.example/live/index.m3u8?token=x|y", own))

        assertFalse("ordinary web pages", isImportablePlaylistLink("https://example.com/news/today", own))
        assertFalse("our own APK download link", isImportablePlaylistLink("https://moalfarras.space/api/app/download/latest?product=moplayer2", own))
        assertFalse("our own site, even with a playlist-like path", isImportablePlaylistLink("https://moalfarras.space/x.m3u", own))
        assertFalse("m3u in the query only", isImportablePlaylistLink("https://example.com/watch?f=list.m3u", own))
        assertFalse(isImportablePlaylistLink("content://downloads/list.m3u", own))
        assertFalse(isImportablePlaylistLink("not a link", own))
    }
}
