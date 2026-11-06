package com.moalfarras.moplayer.ui.components

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.LayoutDirection
import androidx.test.platform.app.InstrumentationRegistry
import com.moalfarras.moplayer.core.Adaptive
import com.moalfarras.moplayer.ui.AppSection
import com.moalfarras.moplayer.ui.i18n.ArStrings
import com.moalfarras.moplayer.ui.i18n.EnStrings
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.theme.MoTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalTestApi::class)
class TvDockInstrumentedTest {
    @get:Rule val compose = createComposeRule()

    @Test fun englishLabelsRemainVisibleAndRemoteMovesToLive() = verify(false)
    @Test fun arabicLabelsRemainVisibleAndRemoteMirrorsDirection() = verify(true)

    private fun verify(arabic: Boolean) {
        assumeTrue("TV navigation layout", Adaptive.isTv(InstrumentationRegistry.getInstrumentation().targetContext))
        val strings = if (arabic) ArStrings else EnStrings
        var selected: AppSection? = null
        compose.setContent {
            CompositionLocalProvider(
                LocalLayoutDirection provides if (arabic) LayoutDirection.Rtl else LayoutDirection.Ltr,
                LocalStrings provides strings,
                LocalReduceMotion provides true,
            ) {
                MoTheme {
                    BottomDock(AppSection.HOME, onSelect = { selected = it }, onSearch = {})
                }
            }
        }
        val labels = listOf(strings.navSearch, strings.navHome, strings.navLive, strings.navMovies,
            strings.navSeries, strings.navFavorites, strings.navSettings)
        val bounds = labels.map {
            compose.onNodeWithText(it, useUnmergedTree = true).assertIsDisplayed().fetchSemanticsNode().boundsInRoot
        }.sortedBy { it.left }
        bounds.zipWithNext().forEach { (left, right) -> assertTrue("TV labels overlap", left.right <= right.left) }
        compose.onNodeWithTag("dock-home").performSemanticsAction(SemanticsActions.RequestFocus)
        compose.onNodeWithTag("dock-home").performKeyInput {
            pressKey(if (arabic) Key.DirectionLeft else Key.DirectionRight)
        }
        compose.onNodeWithTag("dock-live").assertIsFocused()
        compose.onNodeWithTag("dock-live").performKeyInput { pressKey(Key.DirectionCenter) }
        compose.runOnIdle { assertEquals(AppSection.LIVE, selected) }
    }
}
