package com.moalfarras.moplayer.ui.screens

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.moalfarras.moplayer.ui.i18n.ArStrings
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.theme.MoTheme
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalTestApi::class)
class HomeBrowseInstrumentedTest {
    @get:Rule val compose = createComposeRule()
    @Test fun homeWithoutShelvesCanOpenLiveWithRemote() {
        var opened = false
        compose.setContent {
            CompositionLocalProvider(LocalStrings provides ArStrings, LocalLayoutDirection provides LayoutDirection.Rtl) {
                MoTheme {
                    Box(Modifier.size(520.dp, 230.dp)) {
                        HomeBrowseState(false, Color(0xFFFF9248), { opened = true }, Modifier.matchParentSize())
                    }
                }
            }
        }
        compose.onNodeWithText(ArStrings.navLive).assertIsDisplayed()
            .performSemanticsAction(SemanticsActions.RequestFocus)
        compose.onNodeWithText(ArStrings.navLive).assertIsFocused().performKeyInput { pressKey(Key.DirectionCenter) }
        compose.runOnIdle { assertTrue(opened) }
    }
}
