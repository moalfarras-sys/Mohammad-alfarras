package com.moalfarras.moplayer.ui.player

import android.view.KeyEvent
import androidx.media3.common.C
import androidx.media3.common.MimeTypes
import androidx.media3.common.ParserException
import androidx.media3.common.PlaybackException
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.ui.i18n.ArStrings
import com.moalfarras.moplayer.ui.i18n.EnStrings
import com.moalfarras.moplayer.ui.i18n.player
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.net.ConnectException
import java.net.SocketTimeoutException

class PlayerPoliciesTest {

    // ── Failure classification ──────────────────────────────────────────────────────────────

    @Test
    fun permanentHttpStatusesFailFast() {
        for (status in listOf(401, 403, 404, 410, 451)) {
            assertEquals(
                "HTTP $status",
                PlaybackFailureClass.PERMANENT,
                classifyPlaybackFailure(PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS, status, null),
            )
        }
        assertEquals(PlaybackFailureClass.PERMANENT, classifyPlaybackFailure(PlaybackException.ERROR_CODE_IO_FILE_NOT_FOUND, null, null))
        assertEquals(PlaybackFailureClass.PERMANENT, classifyPlaybackFailure(PlaybackException.ERROR_CODE_IO_CLEARTEXT_NOT_PERMITTED, null, null))
    }

    @Test
    fun parserCausesAndServerErrorsAreClassified() {
        val parser = ParserException.createForMalformedContainer("bad", null)
        assertEquals(PlaybackFailureClass.FORMAT, classifyPlaybackFailure(PlaybackException.ERROR_CODE_IO_UNSPECIFIED, null, parser))
        assertEquals(PlaybackFailureClass.FORMAT, classifyPlaybackFailure(PlaybackException.ERROR_CODE_DECODING_FORMAT_UNSUPPORTED, null, null))
        assertEquals(PlaybackFailureClass.TRANSIENT, classifyPlaybackFailure(PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS, 500, null))
        assertEquals(PlaybackFailureClass.TRANSIENT, classifyPlaybackFailure(PlaybackException.ERROR_CODE_TIMEOUT, null, null))
        // Only decoder failures are worth a rebuild on the other surface type.
        assertTrue(isDecoderFailure(PlaybackException.ERROR_CODE_DECODER_INIT_FAILED))
        assertFalse(isDecoderFailure(PlaybackException.ERROR_CODE_PARSING_CONTAINER_UNSUPPORTED))
    }

    @Test
    fun issuesExplainTheReasonInPlainWords() {
        fun issue(code: Int, status: Int? = null, cause: Throwable? = null, online: Boolean = true, live: Boolean = true) =
            classifyPlaybackIssue(code, status, cause, online, live)

        assertEquals(PlaybackIssueKind.NO_INTERNET, issue(PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED, online = false).kind)
        assertEquals(PlaybackIssue(PlaybackIssueKind.FORBIDDEN, 403), issue(PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS, 403))
        assertEquals(PlaybackIssue(PlaybackIssueKind.NOT_FOUND, 404), issue(PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS, 404))
        assertEquals(PlaybackIssue(PlaybackIssueKind.SERVER_ERROR, 503), issue(PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS, 503))
        assertEquals(PlaybackIssueKind.TIMEOUT, issue(PlaybackException.ERROR_CODE_IO_UNSPECIFIED, cause = SocketTimeoutException()).kind)
        assertEquals(PlaybackIssueKind.CONNECT_FAILED, issue(PlaybackException.ERROR_CODE_IO_UNSPECIFIED, cause = ConnectException()).kind)
        assertEquals(PlaybackIssueKind.UNSUPPORTED_FORMAT, issue(PlaybackException.ERROR_CODE_PARSING_CONTAINER_UNSUPPORTED).kind)
        assertEquals(PlaybackIssueKind.DECODER, issue(PlaybackException.ERROR_CODE_DECODER_INIT_FAILED).kind)
        assertEquals(PlaybackIssueKind.LIVE_STOPPED, issue(PlaybackException.ERROR_CODE_UNSPECIFIED).kind)
        assertEquals(PlaybackIssueKind.GENERIC, issue(PlaybackException.ERROR_CODE_UNSPECIFIED, live = false).kind)
        assertTrue(PlaybackIssue(PlaybackIssueKind.TIMEOUT).isTransient)
        assertFalse(PlaybackIssue(PlaybackIssueKind.FORBIDDEN, 403).isTransient)
    }

    @Test
    fun everyIssueHasEnglishAndArabicText() {
        for (kind in PlaybackIssueKind.entries) {
            val issue = PlaybackIssue(kind, if (kind == PlaybackIssueKind.FORBIDDEN) 403 else null)
            val english = EnStrings.player.issueText(issue)
            val arabic = ArStrings.player.issueText(issue)
            assertTrue(kind.name, english.isNotBlank() && arabic.isNotBlank())
            assertNotEquals(kind.name, english, arabic)
            assertFalse(kind.name, english.contains("%1"))
        }
        assertTrue(ArStrings.player.issueText(PlaybackIssue(PlaybackIssueKind.FORBIDDEN, 403)).contains("403"))
    }

    // ── Load retry policy ───────────────────────────────────────────────────────────────────

    @Test
    fun permanentHttpErrorsGetExactlyOneQuickRetry() {
        assertEquals(750L, iptvRetryDelayMs(isLive = true, httpStatus = 404, errorCount = 1))
        assertEquals(C.TIME_UNSET, iptvRetryDelayMs(isLive = true, httpStatus = 404, errorCount = 2))
        assertEquals(750L, iptvRetryDelayMs(isLive = false, httpStatus = 403, errorCount = 1))
        assertEquals(C.TIME_UNSET, iptvRetryDelayMs(isLive = false, httpStatus = 403, errorCount = 2))
    }

    @Test
    fun transientErrorsBackOffAndEventuallyStop() {
        assertEquals(listOf(500L, 1_000L, 2_000L, 3_000L, 3_000L), (1..5).map { iptvRetryDelayMs(true, 503, it) })
        assertEquals(listOf(1_000L, 2_000L, 3_000L, 4_000L, 4_000L), (1..5).map { iptvRetryDelayMs(false, null, it) })
        assertEquals(C.TIME_UNSET, iptvRetryDelayMs(true, null, 9))
        assertTrue(iptvMinimumLoadableRetryCount(isLive = true) >= iptvMinimumLoadableRetryCount(isLive = false))
    }

    // ── Live recovery ───────────────────────────────────────────────────────────────────────

    private fun step(
        failure: PlaybackFailureClass,
        wasPlaying: Boolean = false,
        expired: Boolean = false,
        startupRetry: Boolean = false,
        forceHls: Boolean = false,
        engine: Boolean = false,
        surface: Boolean = false,
    ) = liveErrorRecoveryStep(failure, wasPlaying, expired, startupRetry, forceHls, engine, surface)

    @Test
    fun permanentErrorsAlwaysShowTheErrorCard() {
        assertEquals(LiveRecoveryStep.SHOW_ERROR, step(PlaybackFailureClass.PERMANENT, wasPlaying = true, engine = true, surface = true))
        assertEquals(LiveRecoveryStep.SHOW_ERROR, step(PlaybackFailureClass.PERMANENT, forceHls = true, engine = true))
    }

    @Test
    fun aPlayingChannelThatDropsReconnectsInPlaceUntilTheWindowEnds() {
        assertEquals(LiveRecoveryStep.RECONNECT_IN_PLACE, step(PlaybackFailureClass.TRANSIENT, wasPlaying = true, engine = true, surface = true))
        assertEquals(LiveRecoveryStep.SHOW_ERROR, step(PlaybackFailureClass.TRANSIENT, wasPlaying = true, expired = true, engine = true))
    }

    @Test
    fun startupFailuresWalkTheFallbackChainWithoutChangingChannel() {
        assertEquals(LiveRecoveryStep.RECONNECT_IN_PLACE, step(PlaybackFailureClass.TRANSIENT, startupRetry = true, engine = true))
        assertEquals(LiveRecoveryStep.SWITCH_ENGINE, step(PlaybackFailureClass.TRANSIENT, engine = true))
        assertEquals(LiveRecoveryStep.SIBLING_VARIANT, step(PlaybackFailureClass.TRANSIENT))
        assertEquals(LiveRecoveryStep.FORCE_HLS, step(PlaybackFailureClass.FORMAT, forceHls = true, engine = true))
        assertEquals(LiveRecoveryStep.SWITCH_ENGINE, step(PlaybackFailureClass.FORMAT, engine = true, surface = true))
        assertEquals(LiveRecoveryStep.ALTERNATE_SURFACE, step(PlaybackFailureClass.FORMAT, surface = true))
        assertEquals(LiveRecoveryStep.SIBLING_VARIANT, step(PlaybackFailureClass.FORMAT))
    }

    @Test
    fun reconnectBackoffIsOneTwoFourEightThenCapped() {
        assertEquals(listOf(1_000L, 2_000L, 4_000L, 8_000L, 15_000L, 15_000L), (0..5).map(::liveReconnectDelayMs))
    }

    // ── Audio-only streams ──────────────────────────────────────────────────────────────────

    @Test
    fun audioOnlyNeedsResolvedTracksWithAudioAndNoVideo() {
        assertFalse(isAudioOnlyTracks(tracksEmpty = true, hasVideo = false, hasAudio = false))
        assertFalse(isAudioOnlyTracks(tracksEmpty = false, hasVideo = true, hasAudio = true))
        assertTrue(isAudioOnlyTracks(tracksEmpty = false, hasVideo = false, hasAudio = true))
        assertFalse(isAudioOnlyTracks(tracksEmpty = false, hasVideo = false, hasAudio = false))
    }

    @Test
    fun libVlcWaitsForALateVideoTrackBeforeCallingAStreamRadio() {
        assertFalse(libVlcLooksAudioOnly(sawVideoEs = false, msSincePlaying = 500, videoTracks = 0, audioTracks = 1))
        assertTrue(libVlcLooksAudioOnly(sawVideoEs = false, msSincePlaying = 2_000, videoTracks = 0, audioTracks = 1))
        assertFalse(libVlcLooksAudioOnly(sawVideoEs = true, msSincePlaying = 5_000, videoTracks = 0, audioTracks = 1))
        assertFalse(libVlcLooksAudioOnly(sawVideoEs = false, msSincePlaying = 5_000, videoTracks = -1, audioTracks = 1))
    }

    // ── Remote keys ─────────────────────────────────────────────────────────────────────────

    @Test
    fun channelUpGoesToTheNextChannelAndDpadFollowsTheList() {
        assertEquals(1, liveZapDirectionForKeyCode(KeyEvent.KEYCODE_CHANNEL_UP))
        assertEquals(-1, liveZapDirectionForKeyCode(KeyEvent.KEYCODE_CHANNEL_DOWN))
        assertEquals(-1, liveZapDirectionForKeyCode(KeyEvent.KEYCODE_DPAD_UP))
        assertEquals(1, liveZapDirectionForKeyCode(KeyEvent.KEYCODE_DPAD_DOWN))
        assertEquals(0, liveZapDirectionForKeyCode(KeyEvent.KEYCODE_DPAD_LEFT))
    }

    @Test
    fun digitKeysIncludeTheNumberPad() {
        assertEquals(0, digitForKeyCode(KeyEvent.KEYCODE_0))
        assertEquals(9, digitForKeyCode(KeyEvent.KEYCODE_9))
        assertEquals(5, digitForKeyCode(KeyEvent.KEYCODE_NUMPAD_5))
        assertNull(digitForKeyCode(KeyEvent.KEYCODE_A))
        assertNull(digitForKeyCode(KeyEvent.KEYCODE_DPAD_CENTER))
    }

    // ── Channel numbers ─────────────────────────────────────────────────────────────────────

    @Test
    fun providerNumbersAreUsedOnlyWhenEveryChannelHasADistinctOne() {
        val numbered = listOf(channel("a", 101), channel("b", 102), channel("c", 205))
        assertTrue(usesProviderChannelNumbers(numbered))
        assertFalse(usesProviderChannelNumbers(listOf(channel("a", 0), channel("b", 1), channel("c", 2))))
        assertFalse(usesProviderChannelNumbers(listOf(channel("a", 7), channel("b", 7))))
        assertFalse(usesProviderChannelNumbers(emptyList()))
    }

    @Test
    fun typedNumbersResolveByProviderNumberOrPosition() {
        val numbered = listOf(channel("a", 101), channel("b", 102), channel("c", 205))
        assertEquals("c", resolveChannelNumber(numbered, 205, providerNumbers = true)?.id)
        assertNull(resolveChannelNumber(numbered, 3, providerNumbers = true))
        val unnumbered = listOf(channel("a", 0), channel("b", 1), channel("c", 2))
        assertEquals("b", resolveChannelNumber(unnumbered, 2, providerNumbers = false)?.id)
        assertNull(resolveChannelNumber(unnumbered, 4, providerNumbers = false))
        assertNull(resolveChannelNumber(unnumbered, 0, providerNumbers = false))
    }

    @Test
    fun shownChannelNumbersMatchWhatTheViewerTypes() {
        assertEquals(205, liveChannelNumber(channel("c", 205), indexInList = 2, providerNumbers = true))
        assertEquals(3, liveChannelNumber(channel("c", 2), indexInList = 2, providerNumbers = false))
        assertNull(liveChannelNumber(channel("x", 0), indexInList = -1, providerNumbers = false))
        assertEquals("005", formatChannelNumber(5))
        assertEquals("1234", formatChannelNumber(1234))
    }

    // ── Seeking ─────────────────────────────────────────────────────────────────────────────

    @Test
    fun discreteSeeksAreLinearAndHeldKeysAccelerate() {
        assertEquals(10_000L, vodSeekTarget(0L, 10_000L, repeatCount = 0, durationMs = 600_000L))
        assertEquals(10_000L, vodSeekTarget(0L, 10_000L, repeatCount = 7, durationMs = 600_000L))
        assertEquals(20_000L, vodSeekTarget(0L, 10_000L, repeatCount = 8, durationMs = 600_000L))
        assertEquals(80_000L, vodSeekTarget(0L, 10_000L, repeatCount = 40, durationMs = 600_000L))
    }

    @Test
    fun seeksStayInsideTheTitle() {
        assertEquals(0L, vodSeekTarget(5_000L, -10_000L, repeatCount = 0, durationMs = 600_000L))
        assertEquals(598_000L, vodSeekTarget(595_000L, 10_000L, repeatCount = 0, durationMs = 600_000L))
        assertEquals(15_000L, vodSeekTarget(5_000L, 10_000L, repeatCount = 0, durationMs = null))
    }

    // ── Signal label ────────────────────────────────────────────────────────────────────────

    @Test
    fun hdrIsShownOnlyForARealHdrTransfer() {
        assertEquals("FHD | AVC", videoSignalLabel(1920, 1080, isHdr = false, sampleMimeType = MimeTypes.VIDEO_H264))
        assertEquals("4K | HDR | HEVC", videoSignalLabel(3840, 2160, isHdr = true, sampleMimeType = MimeTypes.VIDEO_H265))
        assertEquals("", videoSignalLabel(0, 0, isHdr = false, sampleMimeType = null))
    }

    // ── Same-channel variants ───────────────────────────────────────────────────────────────

    @Test
    fun qualityLabelsNeedWholeTokens() {
        assertNull(liveQualityRankFromText("4KIDS TV"))
        assertNull(liveQualityRankFromText("SPORT 360"))
        assertEquals(3, liveQualityRankFromText("BEIN SPORTS 1 FHD"))
        assertEquals(2, liveQualityRankFromText("CHANNEL 720P"))
        assertEquals(4, liveQualityRankFromText("Nature UHD"))
    }

    @Test
    fun arabicTitlesMatchOnlyTheirOwnFeeds() {
        val current = live("1", "بي إن سبورت 1 FHD")
        val sameChannelHd = live("2", "بي إن سبورت 1 HD")
        val otherChannel = live("3", "الجزيرة HD")

        assertEquals(sameChannelHd.liveBaseTitle(), current.liveBaseTitle())
        assertNotEquals(otherChannel.liveBaseTitle(), current.liveBaseTitle())
        assertEquals("2", listOf(current, otherChannel, sameChannelHd).bestCompatibleLiveAlternative(current, maxVideoHeight = 1080)?.id)
        assertNull(listOf(current, otherChannel).bestCompatibleLiveAlternative(current, maxVideoHeight = 1080))
    }

    @Test
    fun labelOnlyTitlesNeverMatchAnything() {
        val current = live("1", "FHD")
        val other = live("2", "HD")
        assertNull(listOf(current, other).bestCompatibleLiveAlternative(current, maxVideoHeight = 1080))
    }

    @Test
    fun redirectHintOnlyReplacesTheLinkForManifests() {
        val original = parseStreamRequest("http://panel.test/live/u/p/1.ts")
        val hls = redirectedStreamRequest(original, "https://cdn.test/1/index.m3u8", "application/x-mpegURL")
        val ts = redirectedStreamRequest(original, "https://cdn.test/1.ts", "video/mp2t")
        assertTrue(hls.isManifest())
        assertFalse(ts.isManifest())
        assertTrue(original.uri.hasLiveTsHint())
    }

    private fun channel(id: String, number: Int) = MediaItem(
        id = id,
        serverId = 1,
        type = ContentType.LIVE,
        categoryId = "news",
        title = "Channel $id",
        streamUrl = "http://example.test/live/$id.ts",
        serverOrder = number,
    )

    private fun live(id: String, title: String) = MediaItem(
        id = id,
        serverId = 1,
        type = ContentType.LIVE,
        categoryId = "sports",
        title = title,
        streamUrl = "http://example.test/live/$id.ts",
    )
}
