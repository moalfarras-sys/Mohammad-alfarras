package com.moalfarras.moplayer.ui.components

import android.view.KeyEvent
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.moalfarras.moplayer.ui.theme.TvScale
import org.junit.Assert.assertEquals
import org.junit.Test

class TvTextFieldKeyTest {
    @Test
    fun focusedRowOpensKeyboardOnlyOnOkRelease() {
        assertEquals(TvFieldKey.Consume, tvFieldKeyAction(KeyEvent.KEYCODE_DPAD_CENTER, keyDown = true, editing = false, fromFullKeyboard = false))
        assertEquals(TvFieldKey.StartEditing, tvFieldKeyAction(KeyEvent.KEYCODE_DPAD_CENTER, keyDown = false, editing = false, fromFullKeyboard = false))
        assertEquals(TvFieldKey.StartEditing, tvFieldKeyAction(KeyEvent.KEYCODE_ENTER, keyDown = false, editing = false, fromFullKeyboard = true))
        assertEquals(TvFieldKey.StartEditing, tvFieldKeyAction(KeyEvent.KEYCODE_NUMPAD_ENTER, keyDown = false, editing = false, fromFullKeyboard = true))
    }

    @Test
    fun arrowsOnFocusedRowAreLeftToFocusTraversal() {
        listOf(
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_DPAD_RIGHT,
        ).forEach { code ->
            assertEquals(TvFieldKey.Ignore, tvFieldKeyAction(code, keyDown = true, editing = false, fromFullKeyboard = false))
        }
    }

    @Test
    fun upAndDownLeaveTheFieldWhileEditing() {
        assertEquals(TvFieldKey.LeaveUp, tvFieldKeyAction(KeyEvent.KEYCODE_DPAD_UP, keyDown = true, editing = true, fromFullKeyboard = false))
        assertEquals(TvFieldKey.LeaveDown, tvFieldKeyAction(KeyEvent.KEYCODE_DPAD_DOWN, keyDown = true, editing = true, fromFullKeyboard = false))
        assertEquals(TvFieldKey.Consume, tvFieldKeyAction(KeyEvent.KEYCODE_DPAD_DOWN, keyDown = false, editing = true, fromFullKeyboard = false))
    }

    @Test
    fun okWhileEditingReopensKeyboardClosedWithBack() {
        assertEquals(TvFieldKey.ShowKeyboard, tvFieldKeyAction(KeyEvent.KEYCODE_DPAD_CENTER, keyDown = true, editing = true, fromFullKeyboard = false))
        assertEquals(TvFieldKey.Consume, tvFieldKeyAction(KeyEvent.KEYCODE_DPAD_CENTER, keyDown = false, editing = true, fromFullKeyboard = false))
    }

    @Test
    fun enterFromKeyboardRunsImeActionButRemoteEnterReopensKeyboard() {
        assertEquals(TvFieldKey.ImeAction, tvFieldKeyAction(KeyEvent.KEYCODE_ENTER, keyDown = true, editing = true, fromFullKeyboard = true))
        assertEquals(TvFieldKey.ShowKeyboard, tvFieldKeyAction(KeyEvent.KEYCODE_ENTER, keyDown = true, editing = true, fromFullKeyboard = false))
        assertEquals(TvFieldKey.Consume, tvFieldKeyAction(KeyEvent.KEYCODE_ENTER, keyDown = false, editing = true, fromFullKeyboard = true))
    }

    @Test
    fun typingKeysAndSideArrowsPassThroughWhileEditing() {
        assertEquals(TvFieldKey.Ignore, tvFieldKeyAction(KeyEvent.KEYCODE_A, keyDown = true, editing = true, fromFullKeyboard = true))
        assertEquals(TvFieldKey.Ignore, tvFieldKeyAction(KeyEvent.KEYCODE_DPAD_LEFT, keyDown = true, editing = true, fromFullKeyboard = false))
        assertEquals(TvFieldKey.Ignore, tvFieldKeyAction(KeyEvent.KEYCODE_DEL, keyDown = true, editing = true, fromFullKeyboard = true))
    }

    @Test
    fun readableSpNeverDropsBelowTheTvMinimum() {
        val tv = scale(isTv = true, factor = 0.66f)
        assertEquals(12.sp, tv.readableSp(10f))
        assertEquals(16.sp, tv.readableSp(10f, minTv = 16f))
        assertEquals((30f * 0.66f).sp, tv.readableSp(30f))
        val phone = scale(isTv = false, factor = 0.9f)
        assertEquals((10f * 0.9f).sp, phone.readableSp(10f))
    }

    private fun scale(isTv: Boolean, factor: Float) = TvScale(
        factor = factor,
        contentPadding = 28.dp,
        dockPadding = 12.dp,
        laneSpacing = 10.dp,
        cardRadius = 12.dp,
        posterWidth = 84.dp,
        panelPadding = 12.dp,
        isTv = isTv,
        isCompact = false,
        bottomBarHeight = 54.dp,
        shortestScreenDp = 540,
        maxOfWidthHeightDp = 960,
        isLandscape = true,
        isLowHeightLandscape = false,
    )
}
