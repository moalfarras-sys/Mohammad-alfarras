package com.moalfarras.moplayer.ui.components

import android.view.KeyCharacterMap
import androidx.activity.compose.BackHandler
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material.icons.rounded.VisibilityOff
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.login
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.TvScale
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import kotlinx.coroutines.delay
import android.view.KeyEvent as NativeKeyEvent

/**
 * Text size that follows the TV layout factor but never drops below a 10-foot minimum.
 * On typical 960x540dp TVs the factor is 0.66, which would otherwise shrink 12sp copy to 8sp.
 */
fun TvScale.readableSp(base: Float, minTv: Float = 12f): TextUnit =
    if (isTv) maxOf(base * factor, minTv).sp else (base * factor).sp

/** What a remote/keyboard key means for a TV text row. Pure so it can be unit-tested. */
internal enum class TvFieldKey { StartEditing, ShowKeyboard, ImeAction, LeaveUp, LeaveDown, Consume, Ignore }

/**
 * Maps a key to the TV text-row behaviour:
 * - not editing: OK / Enter opens the keyboard on key-up (the matching key-down is swallowed);
 *   arrows are left to normal focus traversal, so moving between rows never opens the IME.
 * - editing: Up/Down leave the field (they only reach the app once the IME is hidden);
 *   OK re-opens a keyboard that was closed with Back; Enter from a real keyboard runs the
 *   IME action, while Enter from a remote (some boxes send ENTER for OK) re-opens the IME.
 */
internal fun tvFieldKeyAction(keyCode: Int, keyDown: Boolean, editing: Boolean, fromFullKeyboard: Boolean): TvFieldKey {
    val isOk = keyCode == NativeKeyEvent.KEYCODE_DPAD_CENTER
    val isEnter = keyCode == NativeKeyEvent.KEYCODE_ENTER || keyCode == NativeKeyEvent.KEYCODE_NUMPAD_ENTER
    if (!editing) {
        return if (isOk || isEnter) {
            if (keyDown) TvFieldKey.Consume else TvFieldKey.StartEditing
        } else {
            TvFieldKey.Ignore
        }
    }
    return when {
        keyCode == NativeKeyEvent.KEYCODE_DPAD_UP -> if (keyDown) TvFieldKey.LeaveUp else TvFieldKey.Consume
        keyCode == NativeKeyEvent.KEYCODE_DPAD_DOWN -> if (keyDown) TvFieldKey.LeaveDown else TvFieldKey.Consume
        isOk -> if (keyDown) TvFieldKey.ShowKeyboard else TvFieldKey.Consume
        isEnter -> when {
            !keyDown -> TvFieldKey.Consume
            fromFullKeyboard -> TvFieldKey.ImeAction
            else -> TvFieldKey.ShowKeyboard
        }
        else -> TvFieldKey.Ignore
    }
}

private fun NativeKeyEvent.isFromFullKeyboard(): Boolean = runCatching {
    val type = keyCharacterMap.keyboardType
    type == KeyCharacterMap.FULL || type == KeyCharacterMap.ALPHA
}.getOrDefault(false)

/** Handle for one [TvTextField]: focus the row, or focus it and open the keyboard. */
@Stable
class TvTextFieldController internal constructor() {
    internal val rowFocus = FocusRequester()
    internal val inputFocus = FocusRequester()
    internal var editing by mutableStateOf(false)

    /** Moves D-pad focus to the row without opening the keyboard. */
    fun focus(): Boolean = runCatching { rowFocus.requestFocus() }.isSuccess

    /** Moves focus to the row and opens the keyboard (IME "Next" chains). */
    fun edit() {
        focus()
        editing = true
    }
}

@Composable
fun rememberTvTextFieldController(): TvTextFieldController = remember { TvTextFieldController() }

/**
 * Text entry that works with a TV remote.
 *
 * TV: the row is a normal focus stop with a visible ring. D-pad Up/Down move between rows and
 * never open the keyboard; OK/Enter opens it. The IME action runs [onImeAction] (Next chains to
 * the next row, Done submits); without a callback Next moves focus down. Back with the keyboard
 * hidden, or Up/Down, leaves editing and keeps focus on the row. The row asks its scroll
 * container to keep it visible above the keyboard. For passwords the eye toggle is a separate
 * focus stop at the end of the row.
 *
 * Touch devices ([tvMode] false) get a plain field that opens the keyboard on tap.
 */
@Composable
fun TvTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    controller: TvTextFieldController = rememberTvTextFieldController(),
    icon: ImageVector? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Next,
    onImeAction: (() -> Unit)? = null,
    password: Boolean = false,
    enabled: Boolean = true,
    tvMode: Boolean = rememberTvScale().isTv,
    minHeight: Dp = if (tvMode) 50.dp else 54.dp,
    textSize: TextUnit = 16.sp,
) {
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    val focusManager = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current
    val bringIntoView = remember { BringIntoViewRequester() }
    val rowInteraction = remember { MutableInteractionSource() }
    val rowFocused by rowInteraction.collectIsFocusedAsState()
    val eyeInteraction = remember { MutableInteractionSource() }
    val eyeFocused by eyeInteraction.collectIsFocusedAsState()
    var inputFocused by remember { mutableStateOf(false) }
    var passwordVisible by rememberSaveable { mutableStateOf(false) }
    val editing = if (tvMode) controller.editing else inputFocused
    val active = rowFocused || inputFocused || eyeFocused

    fun leaveEditing() {
        // Focus the row first so the text field is no longer focused when it leaves composition.
        controller.focus()
        controller.editing = false
    }

    val runImeAction: () -> Unit = {
        if (tvMode) leaveEditing()
        when {
            onImeAction != null -> onImeAction()
            imeAction == ImeAction.Next -> focusManager.moveFocus(FocusDirection.Down)
            else -> keyboard?.hide()
        }
    }

    val keyHandler: (KeyEvent) -> Boolean = handler@{ event ->
        if (!tvMode || !enabled) return@handler false
        val keyDown = when (event.type) {
            KeyEventType.KeyDown -> true
            KeyEventType.KeyUp -> false
            else -> return@handler false
        }
        val native = event.nativeKeyEvent
        val action = tvFieldKeyAction(native.keyCode, keyDown, controller.editing, native.isFromFullKeyboard())
        when (action) {
            TvFieldKey.StartEditing -> controller.editing = true
            TvFieldKey.ShowKeyboard -> keyboard?.show()
            TvFieldKey.ImeAction -> runImeAction()
            TvFieldKey.LeaveUp -> {
                leaveEditing()
                focusManager.moveFocus(FocusDirection.Up)
            }
            TvFieldKey.LeaveDown -> {
                leaveEditing()
                focusManager.moveFocus(FocusDirection.Down)
            }
            TvFieldKey.Consume, TvFieldKey.Ignore -> Unit
        }
        action != TvFieldKey.Ignore
    }

    if (tvMode) {
        // The IME consumes the first Back to hide itself; the next Back lands here.
        BackHandler(enabled = controller.editing) { leaveEditing() }
        LaunchedEffect(controller.editing) {
            if (controller.editing) {
                runCatching { controller.inputFocus.requestFocus() }
                keyboard?.show()
                bringIntoView.bringIntoView()
                // The keyboard slides in and shrinks the viewport (imePadding); re-check once it settled.
                delay(KEYBOARD_SETTLE_MS)
                bringIntoView.bringIntoView()
            }
        }
    }

    val accent = visuals.accent
    val shape = RoundedCornerShape(minHeight / 2)
    val borderColor by animateColorAsState(
        when {
            editing -> accent
            active -> Color.White
            else -> Color(0x40E3BC78)
        },
        label = "tv-field-border",
    )
    val background by animateColorAsState(
        when {
            editing -> Color(0x802A2118)
            active -> Color(0x66302619)
            else -> Color(0x4D1E1914)
        },
        label = "tv-field-bg",
    )
    val scale by animateFloatAsState(if (active && tvMode) 1.02f else 1f, label = "tv-field-scale")
    val labelSize = 12.sp
    val mutedText = Color(0xB3E3BC78)
    val displayValue = when {
        value.isEmpty() -> ""
        password && !passwordVisible -> "•".repeat(value.length.coerceAtMost(24))
        else -> value
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = minHeight)
            .bringIntoViewRequester(bringIntoView)
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .background(background, shape)
            .border(if (active || editing) 2.dp else 1.dp, borderColor, shape)
            .graphicsLayer { alpha = if (enabled) 1f else 0.5f },
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            modifier = Modifier
                .weight(1f)
                .focusRequester(controller.rowFocus)
                .onPreviewKeyEvent(keyHandler)
                .then(
                    if (tvMode) {
                        Modifier
                            .focusable(enabled = enabled, interactionSource = rowInteraction)
                            .pointerInput(enabled) {
                                detectTapGestures {
                                    if (enabled) {
                                        controller.focus()
                                        controller.editing = true
                                    }
                                }
                            }
                    } else {
                        Modifier
                    },
                )
                .padding(start = 18.dp, end = if (password) 6.dp else 18.dp, top = 6.dp, bottom = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (icon != null) {
                Icon(icon, contentDescription = null, tint = if (active) accent else mutedText, modifier = Modifier.size(22.dp))
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.Center) {
                val showFloatingLabel = value.isNotEmpty() || editing || (tvMode && rowFocused)
                if (showFloatingLabel) {
                    Text(
                        label,
                        color = if (active) accent else mutedText,
                        fontSize = labelSize,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                val valueStyle = TextStyle(color = visuals.textPrimary, fontSize = textSize, fontWeight = FontWeight.Bold)
                if (!tvMode || controller.editing) {
                    BasicTextField(
                        value = value,
                        onValueChange = onValueChange,
                        enabled = enabled,
                        singleLine = true,
                        textStyle = valueStyle,
                        cursorBrush = SolidColor(accent),
                        keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = imeAction),
                        keyboardActions = KeyboardActions(onAny = { runImeAction() }),
                        visualTransformation = if (password && !passwordVisible) PasswordVisualTransformation() else VisualTransformation.None,
                        modifier = Modifier
                            .fillMaxWidth()
                            .focusRequester(controller.inputFocus)
                            .onFocusChanged { state ->
                                if (tvMode && inputFocused && !state.isFocused) controller.editing = false
                                inputFocused = state.isFocused
                            },
                        decorationBox = { inner ->
                            Box(contentAlignment = Alignment.CenterStart) {
                                if (value.isEmpty() && !showFloatingLabel) {
                                    Text(label, color = mutedText, fontSize = textSize, fontWeight = FontWeight.Bold, maxLines = 1)
                                }
                                inner()
                            }
                        },
                    )
                } else {
                    Text(
                        text = when {
                            displayValue.isNotEmpty() -> displayValue
                            rowFocused -> strings.login.pressOkToType
                            else -> label
                        },
                        color = if (displayValue.isNotEmpty()) visuals.textPrimary else mutedText,
                        fontSize = textSize,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
        if (password) {
            val eyeLabel = if (passwordVisible) strings.loginHidePassword else strings.loginShowPassword
            Box(
                modifier = Modifier
                    .padding(end = 6.dp)
                    .size(if (tvMode) 40.dp else 44.dp)
                    .background(if (eyeFocused) accent.copy(alpha = 0.30f) else Color.Transparent, CircleShape)
                    .border(if (eyeFocused) 2.dp else 0.dp, if (eyeFocused) Color.White else Color.Transparent, CircleShape)
                    .clickable(enabled = enabled, interactionSource = eyeInteraction, indication = null) {
                        passwordVisible = !passwordVisible
                    }
                    .semantics { contentDescription = eyeLabel },
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    if (passwordVisible) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility,
                    contentDescription = null,
                    tint = if (eyeFocused) Color.White else mutedText,
                    modifier = Modifier.size(22.dp),
                )
            }
        }
    }
}

private const val KEYBOARD_SETTLE_MS = 350L
