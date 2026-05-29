package com.moalfarras.moplayer.ui.player

import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PlayerScreenLiveTest {
    @Test
    fun liveZapTargetWrapsAtEdges() {
        assertEquals(2, liveZapTargetIndex(currentIndex = 0, direction = -1, size = 3))
        assertEquals(0, liveZapTargetIndex(currentIndex = 2, direction = 1, size = 3))
        assertEquals(1, liveZapTargetIndex(currentIndex = 0, direction = 1, size = 3))
        assertNull(liveZapTargetIndex(currentIndex = -1, direction = 1, size = 3))
    }

    @Test
    fun inferMimeTypeCoversCommonIptvFormats() {
        assertEquals(MimeTypes.APPLICATION_M3U8, inferMimeType("https://example.com/live/index.m3u8?token=1"))
        assertEquals(MimeTypes.APPLICATION_M3U8, inferMimeType("https://example.com/get.php?username=u&password=p&output=m3u8"))
        assertEquals(MimeTypes.APPLICATION_MPD, inferMimeType("https://example.com/manifest.mpd"))
        assertEquals(MimeTypes.APPLICATION_MPD, inferMimeType("https://example.com/stream?id=1&format=dash"))
        assertEquals(MimeTypes.APPLICATION_SS, inferMimeType("https://example.com/Manifest.ism"))
        assertEquals(MimeTypes.VIDEO_MP2T, inferMimeType("https://example.com/channel.ts"))
        assertEquals(MimeTypes.VIDEO_MP2T, inferMimeType("https://example.com/live/1?output=ts"))
        assertEquals(MimeTypes.VIDEO_MP4, inferMimeType("https://example.com/movie.mp4"))
        assertEquals(MimeTypes.VIDEO_MATROSKA, inferMimeType("https://example.com/movie.mkv"))
        assertEquals(MimeTypes.VIDEO_WEBM, inferMimeType("https://example.com/movie.webm"))
        assertEquals("video/x-flv", inferMimeType("https://example.com/live/legacy.flv"))
        assertNull(inferMimeType("rtsp://example.com/live/1"))
    }

    @Test
    fun parseStreamRequestNormalizesHeaders() {
        val request = parseStreamRequest(
            "https://example.com/live/1.m3u8|user-agent=Custom%20UA&http-referrer=https%3A%2F%2Fsite.test&cookie=a%3Db",
        )

        assertEquals("https://example.com/live/1.m3u8", request.uri)
        assertEquals(MimeTypes.APPLICATION_M3U8, request.mimeType)
        assertEquals("Custom UA", request.headers["User-Agent"])
        assertEquals("https://site.test", request.headers["Referer"])
        assertEquals("a=b", request.headers["Cookie"])
    }

    @Test
    fun redirectedLiveTsToHlsUsesFinalPlaylistMimeType() {
        val original = parseStreamRequest("https://example.com/live/1.ts")
        val resolved = redirectedStreamRequest(
            request = original,
            finalUri = "https://cdn.example.com/live/1/playlist.m3u8?token=abc",
            contentType = "application/vnd.apple.mpegurl; charset=utf-8",
        )

        assertEquals("https://cdn.example.com/live/1/playlist.m3u8?token=abc", resolved.uri)
        assertEquals(MimeTypes.APPLICATION_M3U8, resolved.mimeType)
    }

    @Test
    fun redirectedLiveTsKeepsTransportStreamMimeTypeForTokenizedTs() {
        val original = parseStreamRequest("https://example.com/live/1.ts")
        val resolved = redirectedStreamRequest(
            request = original,
            finalUri = "https://cdn.example.com/live/1.ts?token=abc",
            contentType = "video/mp2t",
        )

        assertEquals("https://example.com/live/1.ts", resolved.uri)
        assertEquals(MimeTypes.VIDEO_MP2T, resolved.mimeType)
    }

    @Test
    fun malformedLiveErrorsCanFallbackToLibVlc() {
        assertTrue(shouldFallbackToLibVlc(PlaybackException.ERROR_CODE_DECODER_INIT_FAILED, null))
    }

    @Test
    fun transientLiveNetworkErrorsCanFallbackToLibVlc() {
        assertTrue(shouldFallbackToLibVlc(PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT, null))
        assertTrue(shouldFallbackToLibVlc(PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED, null))
        assertTrue(shouldFallbackToLibVlc(PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS, null))
    }

    @Test
    fun vlcFallbackCoversCommonIptvAndVodContainers() {
        assertTrue(isVlcFriendlyContainer(parseStreamRequest("https://example.com/live/1.m3u8")))
        assertTrue(isVlcFriendlyContainer(parseStreamRequest("https://example.com/movie.mkv")))
        assertTrue(isVlcFriendlyContainer(parseStreamRequest("https://example.com/legacy.flv")))
        assertTrue(isVlcFriendlyContainer(parseStreamRequest("rtsp://example.com/live/1")))
        assertTrue(isVlcFriendlyContainer(parseStreamRequest("rtmp://example.com/live/1")))
    }

    @Test
    fun liveFailureMessageIsReadableEnglish() {
        val message = livePlaybackFailureMessage()

        assertTrue(message.contains("Live stream"))
        assertTrue(message.contains("Try again"))
    }

    @Test
    fun liveNoVideoFrameMessageExplainsSmartRetry() {
        val message = liveNoVideoFrameMessage()

        assertTrue(message.contains("did not render video"))
        assertTrue(message.contains("safer live qualities"))
    }

    @Test
    fun liveQualityRankUsesChannelTitleBeforeCategoryLabel() {
        val item = liveItem(
            id = "1",
            title = "BEIN SPORTS 1 HD",
            categoryName = "BEIN SPORT FHD",
        )

        assertEquals(2, item.liveQualityRank())
    }

    @Test
    fun liveBaseTitleStripsEventAndQualityNoise() {
        val event = liveItem(id = "1", title = "BEIN SPORTS 4 FHD Event")
        val stable = liveItem(id = "2", title = "BEIN SPORTS 4 HD")

        assertEquals(stable.liveBaseTitle(), event.liveBaseTitle())
    }

    @Test
    fun compatibleLiveAlternativePrefersSaferLowerQualityAndAvoidsVisitedItems() {
        val current = liveItem(id = "current", title = "BEIN SPORTS 4 FHD Event", serverOrder = 10)
        val hd = liveItem(id = "hd", title = "BEIN SPORTS 4 HD", serverOrder = 11)
        val sd = liveItem(id = "sd", title = "BEIN SPORTS 4 SD", serverOrder = 12)
        val other = liveItem(id = "other", title = "BEIN SPORTS 5 SD", serverOrder = 13)

        val first = listOf(current, hd, sd, other).bestCompatibleLiveAlternative(
            current = current,
            maxVideoHeight = 720,
        )
        val second = listOf(current, hd, sd, other).bestCompatibleLiveAlternative(
            current = current,
            maxVideoHeight = 720,
            excludedKeys = setOf("1:sd:http://example.test/live/sd.ts"),
        )

        assertEquals("sd", first?.id)
        assertEquals("hd", second?.id)
    }

    @Test
    fun media3UsesTextureViewOnlyOnLegacyAndX86Devices() {
        assertTrue(
            shouldUseTextureViewForMedia3(
                sdkInt = 25,
                isPerformanceMode = false,
                supportedAbis = arrayOf("arm64-v8a"),
            ),
        )
        assertTrue(
            shouldUseTextureViewForMedia3(
                sdkInt = 36,
                isPerformanceMode = false,
                supportedAbis = arrayOf("x86_64"),
            ),
        )
    }

    @Test
    fun media3SurfaceRetryTogglesSurfaceTypeForBlackScreenRecovery() {
        assertEquals(
            true,
            shouldUseTextureViewForMedia3(
                sdkInt = 36,
                isPerformanceMode = false,
                supportedAbis = arrayOf("x86_64"),
                surfaceAttempt = 0,
            ),
        )
        assertEquals(
            false,
            shouldUseTextureViewForMedia3(
                sdkInt = 36,
                isPerformanceMode = false,
                supportedAbis = arrayOf("x86_64"),
                surfaceAttempt = 1,
            ),
        )
        assertEquals(
            true,
            shouldUseTextureViewForMedia3(
                sdkInt = 36,
                isPerformanceMode = false,
                supportedAbis = arrayOf("x86_64"),
                surfaceAttempt = 2,
            ),
        )
    }

    @Test
    fun media3KeepsSurfaceViewForModernArmQualityPlayback() {
        assertEquals(
            false,
            shouldUseTextureViewForMedia3(
                sdkInt = 36,
                isPerformanceMode = true,
                supportedAbis = arrayOf("arm64-v8a"),
            ),
        )
    }

    @Test
    fun liveDoesNotDowngrade4kUnlessPerformanceModeNeedsIt() {
        assertEquals(false, shouldAutoDowngradeLiveQuality(false, itemQualityRank = 4, maxVideoHeight = 1080))
        assertEquals(true, shouldAutoDowngradeLiveQuality(true, itemQualityRank = 4, maxVideoHeight = 1080))
    }

    @Test
    fun liveBitrateCapsAllowHighBitrate4kSports() {
        assertTrue(liveSafeMaxBitrate(2160) >= 45_000_000)
        assertTrue(liveSafeMaxBitrate(1080) >= 10_000_000)
    }

    @Test
    fun livePlaybackProfileStartsFastInPerformanceMode() {
        val profile = livePlaybackProfile(
            isPerformanceMode = true,
            policyLiveBufferMs = 6_000,
            maxVideoHeight = 720,
            sdkInt = 36,
        )

        assertTrue(profile.bufferForPlaybackMs <= 700)
        assertTrue(profile.targetOffsetMs <= 6_000L)
        assertTrue(profile.maxBufferMs <= 20_000)
    }

    @Test
    fun livePlaybackProfileKeepsRoomFor4kQualityMode() {
        val profile = livePlaybackProfile(
            isPerformanceMode = false,
            policyLiveBufferMs = 10_000,
            maxVideoHeight = 2160,
            sdkInt = 36,
        )

        assertTrue(profile.maxBufferMs >= 40_000)
        assertTrue(profile.targetOffsetMs >= 8_000L)
        assertTrue(profile.maxOffsetMs >= 24_000L)
    }

    @Test
    fun liveTsExtractorFlagsSupportMessyIptvTransportStreams() {
        val flags = liveTsExtractorFlags()

        assertTrue(flags and androidx.media3.extractor.ts.DefaultTsPayloadReaderFactory.FLAG_ALLOW_NON_IDR_KEYFRAMES != 0)
        assertTrue(flags and androidx.media3.extractor.ts.DefaultTsPayloadReaderFactory.FLAG_DETECT_ACCESS_UNITS != 0)
    }

    @Test
    fun asyncCodecQueueingTargetsProblematicLegacyMediaCodecApis() {
        assertEquals(true, shouldForceAsyncCodecQueueing(23))
        assertEquals(true, shouldForceAsyncCodecQueueing(30))
        assertEquals(false, shouldForceAsyncCodecQueueing(31))
    }
}

private fun liveItem(
    id: String,
    title: String,
    categoryName: String = "BEIN SPORT FHD",
    serverOrder: Int = 0,
): MediaItem = MediaItem(
    id = id,
    serverId = 1,
    type = ContentType.LIVE,
    categoryId = "bein",
    categoryName = categoryName,
    title = title,
    streamUrl = "http://example.test/live/$id.ts",
    serverOrder = serverOrder,
)
