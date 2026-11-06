package com.moalfarras.moplayer.ui.player

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.height
import androidx.compose.ui.focus.FocusRequester
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import android.graphics.Bitmap
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.moalfarras.moplayer.ui.components.LocalReduceControlMotion
import com.moalfarras.moplayer.ui.i18n.*
import com.moalfarras.moplayer.ui.theme.MoTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalTestApi::class)
class PlayerToolsInstrumentedTest {
    @get:Rule val compose = createComposeRule()

    @Test fun englishRemoteReachesOffscreenTools() = verify(false, true)
    @Test fun arabicRemoteReachesOffscreenTools() = verify(true, true)
    @Test fun phoneToolsScrollAndActivate() = verify(false, false)
    @Test fun arabicPhoneToolsScrollAndActivate() = verify(true, false)

    @Test fun narrowArabicPlayerTransportFitsAndHasAccessibleSeekButtons() {
        val strings = ArStrings
        compose.setContent {
            CompositionLocalProvider(LocalStrings provides strings,
                LocalLayoutDirection provides LayoutDirection.Rtl,
                LocalReduceControlMotion provides true) {
                MoTheme {
                    Box(Modifier.width(320.dp).height(360.dp).testTag("narrow-player")) {
                        VodControls(true, "Synthetic VOD — تجربة", "720p",
                            remember { PlayerItemUiState(false, false, 12_000, 120_000) },
                            true, false, false, false, Color(0xFFFF9248), false,
                            remember { FocusRequester() }, null, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {})
                    }
                }
            }
        }
        val backward = compose.onNodeWithContentDescription("-10").assertIsDisplayed().fetchSemanticsNode().boundsInRoot
        val play = compose.onNodeWithText(strings.playerPlay).assertIsDisplayed().fetchSemanticsNode().boundsInRoot
        val forward = compose.onNodeWithContentDescription("+10").assertIsDisplayed().fetchSemanticsNode().boundsInRoot
        org.junit.Assert.assertTrue(backward.right <= play.left)
        org.junit.Assert.assertTrue(play.right <= forward.left)
        val viewport = compose.onNodeWithTag("narrow-player").fetchSemanticsNode().boundsInRoot
        org.junit.Assert.assertTrue("Forward icon is clipped", forward.right <= viewport.right - 16f)
        org.junit.Assert.assertTrue("Backward icon is clipped", backward.left >= viewport.left + 16f)
        val instrument = InstrumentationRegistry.getInstrumentation()
        val bitmap = instrument.uiAutomation.takeScreenshot()
        File(instrument.targetContext.getExternalFilesDir(null), "ux-narrow-arabic-vod.png").outputStream().use {
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)
        }
        bitmap.recycle()
    }

    private fun verify(arabic: Boolean, tv: Boolean) {
        val strings = if (arabic) ArStrings else EnStrings
        val activated = mutableListOf<String>()
        compose.setContent {
            CompositionLocalProvider(LocalStrings provides strings,
                LocalLayoutDirection provides if (arabic) LayoutDirection.Rtl else LayoutDirection.Ltr,
                LocalReduceControlMotion provides true) {
                MoTheme {
                    Box(Modifier.width(320.dp)) {
                        PlayerTools(Color(0xFFFF9248), tv, false, true,
                            onRetry = { activated += "retry" }, onAudio = { activated += "audio" },
                            onSubtitles = { activated += "subtitles" }, onAddSubtitle = { activated += "file" },
                            onQuality = { activated += "quality" }, onAspect = { activated += "aspect" },
                            onFavorite = { activated += "favorite" }, onCast = { activated += "cast" },
                            onExternal = { activated += "external" })
                    }
                }
            }
        }
        val labels = listOf(strings.playerAudio, strings.playerSubtitles, strings.playerQuality,
            strings.playerAspect, strings.player.addFavorite, strings.playerAddSubtitle,
            strings.playerCast, strings.playerOpenExternal, strings.player.retry)
        if (tv) {
            compose.onNodeWithText(labels.first()).performSemanticsAction(SemanticsActions.RequestFocus)
            labels.forEachIndexed { index, label ->
                compose.onNodeWithText(label).assertIsDisplayed()
                // Surface merges the visible label into the focusable action node.
                compose.onNodeWithText(label).assertIsFocused().performKeyInput {
                    pressKey(Key.DirectionCenter)
                    if (index < labels.lastIndex) pressKey(if (arabic) Key.DirectionLeft else Key.DirectionRight)
                }
            }
        } else {
            val keys = listOf("audio", "subtitles", "quality", "aspect", "favorite", "subtitle-file", "cast", "external", "retry")
            labels.zip(keys).forEach { (label, key) ->
                compose.onNodeWithTag("player-tools").performScrollToKey(key)
                compose.onNodeWithText(label).assertIsDisplayed().performClick()
            }
        }
        compose.runOnIdle {
            assertEquals(listOf("audio", "subtitles", "quality", "aspect", "favorite", "file", "cast", "external", "retry"), activated)
        }
    }
}
