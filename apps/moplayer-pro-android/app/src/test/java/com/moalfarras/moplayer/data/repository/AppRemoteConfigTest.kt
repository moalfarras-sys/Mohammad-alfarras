package com.moalfarras.moplayer.data.repository

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AppRemoteConfigTest {
    private val base = "https://moalfarras.space"

    private val routeBody = """
        {"source":"supabase","product":"moplayer2","config":{
          "enabled":true,"maintenanceMode":false,"forceUpdate":true,"minimumVersionCode":69,
          "latestVersionName":"2.7.0","latestVersionCode":69,"downloaderCode":"4608937",
          "message":"","widgets":{"weather":false,"football":true,"footballMaxMatches":"4"},
          "update":{"latestVersionName":"2.7.0","latestVersionCode":69,
            "downloadUrl":"/api/app/download/latest?product=moplayer2&asset=abc",
            "apkSizeBytes":49443176,"checksumSha256":"4AB045FA64E9E77BBC791A11E6C03A8916FDEB01BAF699EF76A2D707E66F1DE1",
            "releaseNotes":"Faster live TV."}}}
    """.trimIndent()

    @Test
    fun parsesTheConfigRouteIncludingUpdateMetadata() {
        val config = parseRemoteConfig(routeBody, base, expectedProduct = "moplayer2")
        assertNotNull(config)
        config!!
        assertTrue(config.forceUpdate)
        assertEquals(69, config.minimumVersionCode)
        assertEquals(69, config.latestVersionCode)
        assertEquals("2.7.0", config.latestVersionName)
        assertEquals("$base/api/app/download/latest?product=moplayer2&asset=abc", config.downloadUrl)
        assertEquals(49443176L, config.apkSizeBytes)
        assertEquals("Faster live TV.", config.releaseNotes)
        assertEquals("4608937", config.downloaderCode)
        assertFalse(config.weatherEnabled)
        assertEquals("numbers sent as strings still parse", 4, config.footballMaxMatches)
        assertEquals("no admin city means no forced city", "", config.weatherCity)
    }

    @Test
    fun relativeDownloadUrlsFollowTheHostThatAnswered() {
        val config = parseRemoteConfig(routeBody, "https://mohammad-alfarras.vercel.app", expectedProduct = "moplayer2")!!
        assertTrue(config.downloadUrl.startsWith("https://mohammad-alfarras.vercel.app/api/app/download/latest"))
        assertEquals("https://cdn.example/x.apk", resolveAgainst(base, "https://cdn.example/x.apk"))
    }

    @Test
    fun errorBodiesAndOtherProductsAreNotConfigs() {
        assertNull(parseRemoteConfig("""{"error":"Release not found"}""", base, "moplayer2"))
        assertNull(parseRemoteConfig("<html>502</html>", base, "moplayer2"))
        assertNull(parseRemoteConfig(routeBody.replace("\"moplayer2\"", "\"moplayer\""), base, "moplayer2"))
    }

    @Test
    fun missingLatestVersionIsUnknownNotCurrent() {
        val config = parseRemoteConfig("""{"product":"moplayer2","config":{"enabled":true}}""", base, "moplayer2")!!
        assertEquals(0, config.latestVersionCode)
        assertNull("no update info without a latest build", config.updateInfo(currentVersionCode = 68))
    }

    @Test
    fun versionComparison() {
        assertTrue(isNewerVersion(69, 68))
        assertFalse(isNewerVersion(68, 68))
        assertFalse(isNewerVersion(67, 68))
        assertFalse("0 means unknown, never an update", isNewerVersion(0, -1))
        val info = config(latestVersionCode = 69).updateInfo(currentVersionCode = 68)!!
        assertTrue(info.updateAvailable)
        assertFalse(config(latestVersionCode = 69).updateInfo(currentVersionCode = 69)!!.updateAvailable)
    }

    @Test
    fun blockStateMapping() {
        assertNull(appBlockFor(config(), versionCode = 68))
        assertEquals(AppBlockReason.DISABLED, appBlockFor(config(enabled = false, maintenanceMode = true), 68)?.reason)
        assertEquals(AppBlockReason.MAINTENANCE, appBlockFor(config(maintenanceMode = true), 68)?.reason)

        val forced = appBlockFor(config(forceUpdate = true, minimumVersionCode = 69, latestVersionCode = 69), 68)
        assertEquals(AppBlockReason.FORCE_UPDATE, forced?.reason)
        assertEquals(69, forced?.update?.latestVersionCode)
        assertEquals(68, forced?.update?.currentVersionCode)
    }

    @Test
    fun forcedUpdateNeverBlocksTheLatestOrWhenNothingNewerExists() {
        assertNull("the latest build runs", appBlockFor(config(forceUpdate = true, minimumVersionCode = 69, latestVersionCode = 69), 69))
        assertNull("a build newer than the server knows runs", appBlockFor(config(forceUpdate = true, minimumVersionCode = 69, latestVersionCode = 69), 70))
        assertNull(
            "minimum above latest would be a dead end: nothing to install",
            appBlockFor(config(forceUpdate = true, minimumVersionCode = 80, latestVersionCode = 68), 68),
        )
        assertNull("minimum without the force switch does not block", appBlockFor(config(minimumVersionCode = 69, latestVersionCode = 69), 68))
    }

    @Test
    fun forcedUpdateWaitsForTheCurrentStream() {
        val forced = AppBlock(AppBlockReason.FORCE_UPDATE, "")
        val maintenance = AppBlock(AppBlockReason.MAINTENANCE, "")
        assertNull(visibleAppBlock(forced, playerOpen = true))
        assertEquals(forced, visibleAppBlock(forced, playerOpen = false))
        assertEquals(maintenance, visibleAppBlock(maintenance, playerOpen = true))
        assertNull(visibleAppBlock(null, playerOpen = false))
    }

    @Test
    fun onlyAManualRecheckReportsItsOutcome() {
        assertEquals(BlockRecheck.STILL_BLOCKED, BlockRecheck.CHECKING.afterRecheck(reached = true))
        assertEquals(BlockRecheck.UNREACHABLE, BlockRecheck.CHECKING.afterRecheck(reached = false))
        assertEquals(BlockRecheck.NONE, BlockRecheck.NONE.afterRecheck(reached = false))
        assertEquals(BlockRecheck.NONE, BlockRecheck.STILL_BLOCKED.afterRecheck(reached = true))
        assertEquals(BlockRecheck.UNREACHABLE, BlockRecheck.UNREACHABLE.afterRecheck(reached = false))
    }

    private fun config(
        enabled: Boolean = true,
        maintenanceMode: Boolean = false,
        forceUpdate: Boolean = false,
        minimumVersionCode: Int = 50,
        latestVersionCode: Int = 68,
    ) = AppRemoteConfig(
        enabled = enabled,
        maintenanceMode = maintenanceMode,
        forceUpdate = forceUpdate,
        minimumVersionCode = minimumVersionCode,
        latestVersionCode = latestVersionCode,
        latestVersionName = "2.7.0",
        downloadUrl = "https://moalfarras.space/api/app/download/latest?product=moplayer2",
    )
}
