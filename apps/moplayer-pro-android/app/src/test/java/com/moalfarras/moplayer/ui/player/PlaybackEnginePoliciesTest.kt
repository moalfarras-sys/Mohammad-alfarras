package com.moalfarras.moplayer.ui.player

import androidx.media3.common.MimeTypes
import androidx.media3.exoplayer.DefaultRenderersFactory
import com.moalfarras.moplayer.core.DevicePerformanceTier
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PlaybackEnginePoliciesTest {

    private val mb = 1024 * 1024

    // ── Buffer memory ───────────────────────────────────────────────────────────────────────

    @Test
    fun vodBufferIsAQuarterOfTheHeapBetween16And64Mb() {
        fun vod(heap: Int) = playbackBufferBudget(heap, isLowRam = false, tier = DevicePerformanceTier.MID, isLive = false).targetBytes
        assertEquals(24 * mb, vod(96))
        assertEquals(32 * mb, vod(128))
        assertEquals(48 * mb, vod(192))
        assertEquals(64 * mb, vod(256))
        assertEquals(64 * mb, vod(512))
        assertEquals(16 * mb, vod(48))
        // Unknown heap: assume a small box.
        assertEquals(32 * mb, vod(0))
    }

    @Test
    fun liveKeepsLessThanVodAndLowRamBoxesLessStill() {
        assertEquals(21 * mb, playbackBufferBudget(128, false, DevicePerformanceTier.MID, isLive = true).targetBytes)
        assertEquals(32 * mb, playbackBufferBudget(512, false, DevicePerformanceTier.HIGH, isLive = true).targetBytes)
        assertEquals(8 * mb, playbackBufferBudget(32, false, DevicePerformanceTier.LOW, isLive = true).targetBytes)
        assertEquals(24 * mb, playbackBufferBudget(256, isLowRam = true, tier = DevicePerformanceTier.MID, isLive = false).targetBytes)
        assertEquals(16 * mb, playbackBufferBudget(256, isLowRam = true, tier = DevicePerformanceTier.MID, isLive = true).targetBytes)
    }

    @Test
    fun onlyHighTierBoxesLetTimeWinOverTheByteBudget() {
        assertTrue(playbackBufferBudget(512, false, DevicePerformanceTier.HIGH, isLive = false).prioritizeTimeOverSize)
        assertFalse(playbackBufferBudget(512, false, DevicePerformanceTier.MID, isLive = false).prioritizeTimeOverSize)
        assertFalse(playbackBufferBudget(128, false, DevicePerformanceTier.LOW, isLive = true).prioritizeTimeOverSize)
        assertFalse(playbackBufferBudget(512, true, DevicePerformanceTier.HIGH, isLive = false).prioritizeTimeOverSize)
    }

    // ── Unsupported audio ───────────────────────────────────────────────────────────────────

    @Test
    fun silentAudioGoesToLibVlcOnceThenExplainsItself() {
        assertEquals(UnsupportedAudioAction.SWITCH_ENGINE, unsupportedAudioAction(false, libVlcCanPlay = true, triedLibVlc = false, alreadyNotified = false))
        // LibVLC already tried (it failed and Media3 is back), or not usable here: tell the viewer once.
        assertEquals(UnsupportedAudioAction.NOTIFY, unsupportedAudioAction(false, libVlcCanPlay = true, triedLibVlc = true, alreadyNotified = false))
        assertEquals(UnsupportedAudioAction.NOTIFY, unsupportedAudioAction(false, libVlcCanPlay = false, triedLibVlc = false, alreadyNotified = false))
        assertEquals(UnsupportedAudioAction.NONE, unsupportedAudioAction(false, libVlcCanPlay = false, triedLibVlc = false, alreadyNotified = true))
        assertEquals(UnsupportedAudioAction.NONE, unsupportedAudioAction(true, libVlcCanPlay = true, triedLibVlc = false, alreadyNotified = false))
    }

    @Test
    fun ffmpegRendererGoesAfterPlatformRenderersInOnMode() {
        val on = mutableListOf("mediacodec")
        insertExtensionRenderer(on, "ffmpeg", DefaultRenderersFactory.EXTENSION_RENDERER_MODE_ON)
        assertEquals(listOf("mediacodec", "ffmpeg"), on)
        val prefer = mutableListOf("mediacodec")
        insertExtensionRenderer(prefer, "ffmpeg", DefaultRenderersFactory.EXTENSION_RENDERER_MODE_PREFER)
        assertEquals(listOf("ffmpeg", "mediacodec"), prefer)
    }

    // ── Live format fallback ────────────────────────────────────────────────────────────────

    @Test
    fun liveFormatSwapIsOneShotAtStartupAndNeverForAuthOrConnectionLimits() {
        assertTrue(canSwapLiveFormat(wasPlaying = false, alreadySwapped = false, hasAlternate = true, httpStatus = 404))
        assertTrue(canSwapLiveFormat(wasPlaying = false, alreadySwapped = false, hasAlternate = true, httpStatus = null))
        assertTrue(canSwapLiveFormat(wasPlaying = false, alreadySwapped = false, hasAlternate = true, httpStatus = 502))
        for (status in listOf(401, 403, 407, 429, 451, 509)) {
            assertFalse("HTTP $status", canSwapLiveFormat(false, false, true, status))
        }
        assertFalse(canSwapLiveFormat(wasPlaying = true, alreadySwapped = false, hasAlternate = true, httpStatus = 404))
        assertFalse(canSwapLiveFormat(wasPlaying = false, alreadySwapped = true, hasAlternate = true, httpStatus = 404))
        assertFalse(canSwapLiveFormat(wasPlaying = false, alreadySwapped = false, hasAlternate = false, httpStatus = 404))
    }

    @Test
    fun alternateLiveFormatSwapsTheXtreamContainerAndKeepsHeaders() {
        val ts = parseStreamRequest("http://panel.test:8080/live/user/pass/123.ts|User-Agent=Box%201")
        val hls = alternateLiveFormatRequest(ts)
        assertEquals("http://panel.test:8080/live/user/pass/123.m3u8", hls?.uri)
        assertEquals(MimeTypes.APPLICATION_M3U8, hls?.mimeType)
        assertEquals("Box 1", hls?.headers?.get("User-Agent"))
        assertEquals("http://panel.test:8080/live/user/pass/123.ts", alternateLiveFormatRequest(hls!!)?.uri)
        assertNull(alternateLiveFormatRequest(parseStreamRequest("http://cdn.test/channel/index.m3u8")))
        assertNull(alternateLiveFormatRequest(parseStreamRequest("http://panel.test/movie/user/pass/9.mp4")))
    }

    @Test
    fun aFailedFormatSwapGoesBackToTheListedLinkUnlessThatOneWasMissing() {
        val ts = parseStreamRequest("http://panel.test:8080/live/user/pass/123.ts")
        // A ts-only line answers 403/404 for .m3u8: a stalled, failing or unparsable .ts link comes back.
        assertEquals(ts, liveFormatSwapTrial(ts, cause = null)?.previous)
        assertNull(liveFormatSwapTrial(ts, cause = null)?.cause)
        assertEquals(PlaybackFailureClass.TRANSIENT, liveFormatSwapTrial(ts, PlaybackFailureClass.TRANSIENT)?.cause)
        assertEquals(PlaybackFailureClass.FORMAT, liveFormatSwapTrial(ts, PlaybackFailureClass.FORMAT)?.cause)
        // A 404/410 original is gone: nothing to go back to.
        assertNull(liveFormatSwapTrial(ts, PlaybackFailureClass.PERMANENT))
    }

    @Test
    fun onlyStepsThatReopenTheSameLinkUndoAFailedSwap() {
        val reopening = LiveRecoveryStep.entries.filter { it.reopensSameLink() }
        assertEquals(
            listOf(
                LiveRecoveryStep.RECONNECT_IN_PLACE,
                LiveRecoveryStep.FORCE_HLS,
                LiveRecoveryStep.SWITCH_ENGINE,
                LiveRecoveryStep.ALTERNATE_SURFACE,
            ),
            reopening,
        )
        // After a transient failure and a failed swap the chain goes on with the other engine, not the error card.
        val step = liveErrorRecoveryStep(
            failure = PlaybackFailureClass.TRANSIENT,
            wasPlaying = false,
            reconnectWindowExpired = false,
            startupRetryAvailable = false,
            canForceHls = false,
            canSwitchEngine = true,
            canRetrySurface = false,
            permanentReconnectAvailable = false,
            canSwapFormat = false,
        )
        assertEquals(LiveRecoveryStep.SWITCH_ENGINE, step)
        assertTrue(step.reopensSameLink())
    }

    // ── LibVLC options ──────────────────────────────────────────────────────────────────────

    private fun config(
        isLive: Boolean = true,
        isManifest: Boolean = false,
        weakDevice: Boolean = false,
        cpuCores: Int = 4,
        startPositionMs: Long = 0L,
        referer: String? = null,
        deinterlace: Boolean = false,
    ) = LibVlcMediaConfig(
        isLive = isLive,
        isManifest = isManifest,
        weakDevice = weakDevice,
        cpuCores = cpuCores,
        startPositionMs = startPositionMs,
        userAgent = "MoPlayerPro/test",
        referer = referer,
        deinterlace = deinterlace,
        maxVideoHeight = 1080,
        title = "Channel",
    )

    @Test
    fun liveTsIsAContinuousResourceWithALiveSizedCache() {
        val options = libVlcMediaOptions(config())
        // Caching comes first, so Media.setHWDecoderEnabled() does not inject its own 1500 ms.
        assertEquals(":network-caching=1500", options.first())
        assertTrue(":http-continuous" in options)
        assertTrue(":http-user-agent=MoPlayerPro/test" in options)
        assertTrue(options.none { it.startsWith(":start-time") })
        assertTrue(":network-caching=2000" in libVlcMediaOptions(config(weakDevice = true)))
    }

    @Test
    fun vodIsSeekableWithABiggerCacheAndResumesFromTheSavedPosition() {
        val options = libVlcMediaOptions(config(isLive = false, startPositionMs = 123_456L))
        assertTrue(":network-caching=3000" in options)
        assertFalse(":http-continuous" in options)
        assertTrue(":start-time=123.456" in options)
        assertTrue(libVlcMediaOptions(config(isLive = false, startPositionMs = 4_000L)).none { it.startsWith(":start-time") })
    }

    @Test
    fun manifestsCapTheVariantAndNeverUseHttpContinuous() {
        val options = libVlcMediaOptions(config(isManifest = true))
        assertFalse(":http-continuous" in options)
        assertTrue(":adaptive-maxheight=1080" in options)
    }

    @Test
    fun weakBoxesSkipTheLoopFilterAndSdLiveGetsDeinterlaced() {
        assertTrue(":avcodec-skiploopfilter=1" in libVlcMediaOptions(config(weakDevice = true, cpuCores = 4)))
        assertTrue(":avcodec-skiploopfilter=3" in libVlcMediaOptions(config(weakDevice = true, cpuCores = 2)))
        assertTrue(libVlcMediaOptions(config()).none { it.startsWith(":avcodec-skiploopfilter") })
        val sd = libVlcMediaOptions(config(deinterlace = true))
        assertTrue(":deinterlace-mode=yadif" in sd)
        assertTrue(libVlcMediaOptions(config(isLive = false, deinterlace = true)).none { it.startsWith(":deinterlace") })
    }

    @Test
    fun onlyOptionsVlc3KnowsAreSent() {
        val options = libVlcMediaOptions(config(referer = "http://site.test/"))
        assertTrue(":http-referrer=http://site.test/" in options)
        assertTrue(options.none { it.startsWith(":http-cookie") || it.startsWith(":http-header") || it.startsWith(":live-caching") })
        val instance = libVlcInstanceOptions(cpuCores = 2)
        assertTrue("--audio-resampler=ugly" in instance)
        assertTrue("--audio-resampler=soxr" in libVlcInstanceOptions(cpuCores = 8))
        assertTrue(instance.none { it.startsWith("--live-caching") })
    }

    @Test
    fun vodEndAndResumeRules() {
        assertTrue(libVlcReachedEnd(timeMs = 5_990_000L, lengthMs = 6_000_000L))
        assertFalse(libVlcReachedEnd(timeMs = 1_200_000L, lengthMs = 6_000_000L))
        assertTrue(libVlcReachedEnd(timeMs = 1_200_000L, lengthMs = 0L))
        assertEquals(0L, libVlcStartPositionMs(resumeMs = 3_000L, knownLengthMs = 6_000_000L))
        assertEquals(600_000L, libVlcStartPositionMs(resumeMs = 600_000L, knownLengthMs = 6_000_000L))
        // Resuming in the last 15 s would end at once: start over.
        assertEquals(0L, libVlcStartPositionMs(resumeMs = 5_990_000L, knownLengthMs = 6_000_000L))
        assertEquals(600_000L, libVlcStartPositionMs(resumeMs = 600_000L, knownLengthMs = 0L))
    }

    @Test
    fun aCutOffNearTheEndIsReopenedWhereItStoppedNotFromTheStart() {
        val length = 6_000_000L
        for (stoppedAt in listOf(5_960_000L, 5_975_000L, 5_984_999L)) {
            assertFalse("cut off at $stoppedAt", libVlcReachedEnd(stoppedAt, length))
            assertEquals(stoppedAt, libVlcStartPositionMs(stoppedAt, length))
        }
        assertTrue(libVlcReachedEnd(5_985_000L, length))
        assertEquals(0L, libVlcStartPositionMs(5_985_000L, length))
    }

    @Test
    fun streamsNeedingCookiesOriginOrTokensStayOnMedia3() {
        assertTrue(parseStreamRequest("http://cdn.test/1.ts|Cookie=session%3Dabc").hasHeadersLibVlcCannotSend())
        assertTrue(parseStreamRequest("https://cdn.test/1.m3u8|Origin=https://site.test").hasHeadersLibVlcCannotSend())
        assertTrue(parseStreamRequest("https://cdn.test/1.m3u8|Authorization=Bearer%20xyz").hasHeadersLibVlcCannotSend())
        assertFalse(parseStreamRequest("http://cdn.test/1.ts|Authorization=Basic%20dXNlcjpwYXNz").hasHeadersLibVlcCannotSend())
        assertFalse(parseStreamRequest("http://cdn.test/1.ts|User-Agent=VLC&Referer=http://a.test/").hasHeadersLibVlcCannotSend())
        assertFalse(parseStreamRequest("rtsp://cam.test/1|Cookie=a%3Db").hasHeadersLibVlcCannotSend())
        assertEquals(
            InternalPlaybackEngine.MEDIA3,
            preferredLiveAutoEngine(parseStreamRequest("http://cdn.test/live/1.ts|Cookie=a%3Db"), null),
        )
    }

    @Test
    fun basicCredentialsTravelInTheUrlForLibVlcAndExternalPlayers() {
        assertEquals(
            "http://user:pass@cdn.test/live/1.ts",
            uriWithBasicCredentials("http://cdn.test/live/1.ts", mapOf("Authorization" to "Basic dXNlcjpwYXNz")),
        )
        // "p@ss" is percent-encoded in the user info.
        assertEquals(
            "https://user:p%40ss@cdn.test/a.m3u8",
            uriWithBasicCredentials("https://cdn.test/a.m3u8", mapOf("authorization" to "Basic dXNlcjpwQHNz")),
        )
        assertEquals("http://me:x@cdn.test/1.ts", uriWithBasicCredentials("http://me:x@cdn.test/1.ts", mapOf("Authorization" to "Basic dXNlcjpwYXNz")))
        assertEquals("http://cdn.test/1.ts", uriWithBasicCredentials("http://cdn.test/1.ts", mapOf("Authorization" to "Bearer abc")))
        assertEquals("http://cdn.test/1.ts", uriWithBasicCredentials("http://cdn.test/1.ts", emptyMap()))
    }

    // ── LibVLC picture ──────────────────────────────────────────────────────────────────────

    @Test
    fun zoomScaleIsRelativeToTheVideoNotTheWindow() {
        assertEquals(1.5f, libVlcFillScale(1920, 1080, 1280, 720, 1, 1, 0)!!, 0.001f)
        assertEquals(0.5f, libVlcFillScale(1920, 1080, 3840, 2160, 1, 1, 0)!!, 0.001f)
        // PAL 4:3 (720x576, SAR 16:15) is 768 px wide on screen: filling 16:9 crops top and bottom.
        assertEquals(2.5f, libVlcFillScale(1920, 1080, 720, 576, 16, 15, 0)!!, 0.001f)
        // Rotated picture (orientation LeftBottom).
        assertEquals(1.5f, libVlcFillScale(1080, 1920, 1280, 720, 1, 1, 5)!!, 0.001f)
        assertNull(libVlcFillScale(1920, 1080, 0, 0, 1, 1, 0))
        assertNull(libVlcFillScale(0, 0, 1280, 720, 1, 1, 0))
    }

    @Test
    fun libVlcGetsItsCachePlusConnectTimeBeforeTheStartupWatchdogActs() {
        assertEquals(3_500L, liveStartupStallDelayMs(weakDevice = true, useLibVlc = false))
        assertEquals(5_000L, liveStartupStallDelayMs(weakDevice = true, useLibVlc = true))
        assertEquals(5_000L, liveStartupStallDelayMs(weakDevice = false, useLibVlc = false))
        assertEquals(5_000L, liveStartupStallDelayMs(weakDevice = false, useLibVlc = true))
    }

    // ── External players ────────────────────────────────────────────────────────────────────

    @Test
    fun externalPlayersGetMxStyleHeadersAndOnlyInstalledAppsAreOffered() {
        assertArrayEquals(
            arrayOf("User-Agent", "Box", "Referer", "http://a.test/"),
            externalPlayerHeaders(linkedMapOf("User-Agent" to "Box", "Referer" to "http://a.test/")),
        )
        assertNull(externalPlayerHeaders(emptyMap()))
        assertEquals(listOf("mx"), installedExternalPlayers { it == "com.mxtech.videoplayer.ad" })
        assertEquals(listOf("vlc", "just"), installedExternalPlayers { it == "org.videolan.vlc" || it == "com.brouken.player" })
        assertEquals(listOf("com.mxtech.videoplayer.pro", "com.mxtech.videoplayer.ad"), EXTERNAL_PLAYER_PACKAGES["mx"])
    }
}
