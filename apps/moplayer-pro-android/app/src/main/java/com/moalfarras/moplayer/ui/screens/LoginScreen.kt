package com.moalfarras.moplayer.ui.screens

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.provider.OpenableColumns
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.EventNote
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.automirrored.rounded.PlaylistPlay
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Dns
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.FolderOpen
import androidx.compose.material.icons.rounded.Link
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Public
import androidx.compose.material.icons.rounded.QrCode2
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.RocketLaunch
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.Storage
import androidx.compose.material.icons.rounded.Sync
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material.icons.rounded.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.min
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.LifecycleStartEffect
import coil3.compose.AsyncImage
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import com.google.zxing.qrcode.encoder.Encoder
import com.moalfarras.moplayer.MainActivity
import com.moalfarras.moplayer.domain.model.AppSettings
import com.moalfarras.moplayer.domain.model.BackgroundMode
import com.moalfarras.moplayer.domain.model.DeviceActivationSession
import com.moalfarras.moplayer.domain.model.DeviceActivationStatus
import com.moalfarras.moplayer.domain.model.LoadProgress
import com.moalfarras.moplayer.ui.components.AnimatedLoginBackground
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.components.TvTextField
import com.moalfarras.moplayer.ui.components.rememberTvTextFieldController
import com.moalfarras.moplayer.ui.i18n.ArStrings
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.Strings
import com.moalfarras.moplayer.ui.i18n.login
import com.moalfarras.moplayer.ui.i18n.ltr
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.MoTheme
import com.moalfarras.moplayer.ui.theme.TvScale
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import com.moalfarras.moplayerpro.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

private enum class LoginMode { CHOOSE, ACTIVATION, XTREAM, M3U }

/** Playlist MIME types offered to the system document picker. */
private val M3U_MIME_TYPES = arrayOf(
    "audio/x-mpegurl",
    "audio/mpegurl",
    "application/x-mpegurl",
    "application/vnd.apple.mpegurl",
    "text/*",
    "application/octet-stream",
)

/** Expired QR codes are regenerated automatically this many times in a row, then the user decides. */
internal const val MAX_AUTO_QR_RENEWALS = 3
private const val QR_QUIET_MODULES = 4
private const val QR_CREATE_TIMEOUT_MS = 12_000L
private const val QR_RESUME_MIN_REMAINING_MS = 45_000L
private val TV_OVERSCAN_H = 48.dp
private val TV_OVERSCAN_V = 27.dp

// ── Pure helpers (unit-tested) ─────────────────────────────────────────────

/**
 * A picked playlist is read into one String and then parsed, which needs several times the
 * file size in heap. Refuse files that would not fit instead of failing with an OOM.
 * An unknown size (<= 0) is allowed; the reader still catches OutOfMemoryError.
 */
internal fun playlistFitsInMemory(sizeBytes: Long, maxHeapBytes: Long): Boolean =
    sizeBytes <= 0L || sizeBytes <= maxHeapBytes / 6

/** "m:ss" with Latin digits, e.g. 754 -> "12:34". */
internal fun formatCountdown(totalSeconds: Long): String {
    val seconds = totalSeconds.coerceAtLeast(0L)
    return String.format(Locale.US, "%d:%02d", seconds / 60, seconds % 60)
}

/** Readable form of the activation URL for the screen: no scheme, no "www.", no trailing slash. */
internal fun displayActivationUrl(url: String): String =
    url.trim().removePrefix("https://").removePrefix("http://").removePrefix("www.").trimEnd('/')

/**
 * Android 7–11 may list MoPlayer itself for a web link (the manifest handles http/https for M3U
 * import), so the link goes through a chooser that excludes it. Android 12+ opens unverified web
 * links in the browser directly; Android 6 has no exclusion extra.
 */
internal fun browserIntentNeedsChooser(sdkInt: Int): Boolean = sdkInt in 24..30

internal enum class QrPhase { Creating, Waiting, Received, Renewing, Expired, Failed }

internal fun shouldAutoRenewQr(status: DeviceActivationStatus?, renewalsSoFar: Int): Boolean =
    status == DeviceActivationStatus.EXPIRED && renewalsSoFar < MAX_AUTO_QR_RENEWALS

/**
 * When the QR panel comes back (tab re-opened, app back in the foreground) a code that is still
 * waiting and not about to expire is polled again rather than replaced: the phone may be
 * finishing that code right now, and a new code would expire it.
 */
internal fun canResumeQr(status: DeviceActivationStatus?, expiresAtMs: Long, nowMs: Long): Boolean =
    status == DeviceActivationStatus.WAITING && expiresAtMs - nowMs >= QR_RESUME_MIN_REMAINING_MS

/**
 * What the QR panel shows. [failed] is true when a new error arrived after the last code request
 * while no code exists yet (create failed or timed out) or after the phone sent a source (the
 * import failed); the user then gets a "Try again" button instead of an endless spinner.
 */
internal fun qrPhase(
    status: DeviceActivationStatus?,
    signingIn: Boolean,
    failed: Boolean,
    autoRenewing: Boolean,
    renewalsSoFar: Int,
): QrPhase = when {
    signingIn -> QrPhase.Received
    failed -> QrPhase.Failed
    status == null -> if (autoRenewing) QrPhase.Renewing else QrPhase.Creating
    status == DeviceActivationStatus.WAITING -> QrPhase.Waiting
    status == DeviceActivationStatus.ACTIVATED -> QrPhase.Received
    status == DeviceActivationStatus.EXPIRED ->
        if (renewalsSoFar < MAX_AUTO_QR_RENEWALS) QrPhase.Renewing else QrPhase.Expired
    else -> QrPhase.Failed
}

/** Whole pixels per QR module so every module edge lands on a pixel (crisp, no resampling). */
internal fun qrCellPx(targetPx: Int, modules: Int, quietModules: Int = QR_QUIET_MODULES): Int =
    (targetPx / (modules + 2 * quietModules)).coerceAtLeast(1)

private fun FocusRequester.tryFocus() {
    runCatching { requestFocus() }
}

// ── Screen ────────────────────────────────────────────────────────────────

@Stable
private class LoginForm {
    var name by mutableStateOf("")
    var m3u by mutableStateOf("")
    var epgUrl by mutableStateOf("")
    var url by mutableStateOf("")
    var user by mutableStateOf("")
    var pass by mutableStateOf("")
    val canSubmitXtream: Boolean get() = url.isNotBlank() && user.isNotBlank() && pass.isNotBlank()
    val canSubmitM3u: Boolean get() = m3u.isNotBlank()
}

private class LoginActions(
    val selectMode: (LoginMode) -> Unit,
    /** Returns false (and does nothing) when a required field is missing or a login is running. */
    val submitXtream: () -> Boolean,
    val submitM3u: () -> Boolean,
    val pickFile: () -> Unit,
    val refreshQr: () -> Unit,
    val resumeQr: () -> Unit,
    val stopQr: () -> Unit,
)

@Composable
private fun LoginBackdropLayer(settings: AppSettings, reduceMotion: Boolean = false) {
    val epochDay = LocalDate.now().toEpochDay()
    val backdropUrl = remember(settings.backgroundMode, settings.customBackgroundUrl, epochDay) {
        when (settings.backgroundMode) {
            BackgroundMode.NONE -> null
            else -> resolveHomeBackdropUrl(settings, contentBackdropUrl = null, epochDay = epochDay)
        }
    }
    Box(Modifier.fillMaxSize()) {
        // Branded cinematic base so the sign-in screen never falls back to flat black while the
        // city image loads, fails, or when the device is offline.
        Image(
            painter = painterResource(R.drawable.bg_cinematic),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )
        if (backdropUrl != null) {
            AsyncImage(
                model = backdropUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        scaleX = 1.04f
                        scaleY = 1.04f
                    },
            )
            Box(
                Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colorStops = arrayOf(
                                0f to Color(0x64050403),
                                0.30f to Color(0x52050403),
                                0.72f to Color(0x76050403),
                                1f to Color(0x9A050403),
                            ),
                        ),
                    ),
            )
            Box(
                Modifier
                    .fillMaxSize()
                    .background(Brush.horizontalGradient(listOf(Color(0xC0050403), Color(0x55050403), Color(0xC0050403)))),
            )
        } else {
            Box(Modifier.fillMaxSize().background(Color(0xFF050403)))
            if (!reduceMotion) {
                AnimatedLoginBackground()
            }
        }
    }
}

@Composable
fun LoginScreen(
    settings: AppSettings = AppSettings(),
    loading: LoadProgress?,
    error: String?,
    activationSession: DeviceActivationSession?,
    reduceMotion: Boolean = false,
    onM3u: (String, String, String) -> Unit,
    onM3uFile: (String, String, String) -> Unit,
    onXtream: (String, String, String, String) -> Unit,
    onRefreshQr: () -> Unit,
    onResumeQr: () -> Unit,
    onStopQr: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val tv = rememberTvScale()
    val strings = LocalStrings.current
    var mode by rememberSaveable { mutableStateOf(LoginMode.CHOOSE) }
    var lastChosen by rememberSaveable { mutableStateOf(LoginMode.ACTIVATION) }
    val form = remember { LoginForm() }
    var fileMessage by remember { mutableStateOf<String?>(null) }
    // Set when this screen started a login, so a failed attempt can return focus to Sign in.
    var awaitingResult by remember { mutableStateOf(false) }

    val selectMode: (LoginMode) -> Unit = { next ->
        if (loading == null) {
            if (next != LoginMode.CHOOSE) lastChosen = next
            fileMessage = null
            mode = next
        }
    }
    BackHandler(enabled = mode != LoginMode.CHOOSE && loading == null) { selectMode(LoginMode.CHOOSE) }

    val importPlaylist: (Uri?) -> Unit = { uri ->
        if (uri != null) {
            scope.launch {
                runCatching { readPlaylistFile(context, uri, strings) }
                    .onSuccess { (fileName, text) ->
                        fileMessage = null
                        awaitingResult = true
                        onM3uFile(form.name.trim(), fileName, text)
                    }
                    .onFailure { throwable ->
                        fileMessage = if (throwable is OutOfMemoryError) {
                            strings.login.fileTooLargeGeneric
                        } else {
                            throwable.message ?: strings.loginFileUnreadable
                        }
                    }
            }
        }
    }
    val documentPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument(), importPlaylist)
    val contentPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent(), importPlaylist)

    val actions = LoginActions(
        selectMode = selectMode,
        submitXtream = {
            if (loading == null && form.canSubmitXtream) {
                awaitingResult = true
                onXtream(form.name.trim(), form.url.trim(), form.user.trim(), form.pass)
                true
            } else {
                false
            }
        },
        submitM3u = {
            if (loading == null && form.canSubmitM3u) {
                awaitingResult = true
                onM3u(form.name.trim(), form.m3u.trim(), form.epgUrl.trim())
                true
            } else {
                false
            }
        },
        pickFile = {
            fileMessage = null
            // Many Android TV builds ship without DocumentsUI; fall back to GET_CONTENT, then explain.
            val opened = runCatching { documentPicker.launch(M3U_MIME_TYPES) }
                .recoverCatching { contentPicker.launch("*/*") }
            if (opened.isFailure) fileMessage = strings.login.filePickerUnavailable
        },
        refreshQr = onRefreshQr,
        resumeQr = onResumeQr,
        stopQr = onStopQr,
    )

    if (!tv.isTv) {
        CompactLoginScreen(
            settings = settings,
            mode = mode,
            form = form,
            loading = loading,
            error = error,
            fileMessage = fileMessage,
            activationSession = activationSession,
            reduceMotion = reduceMotion,
            actions = actions,
        )
        return
    }

    Box(Modifier.fillMaxSize()) {
        LoginBackdropLayer(settings, reduceMotion = reduceMotion)
        Column(
            Modifier
                .fillMaxSize()
                .padding(horizontal = TV_OVERSCAN_H, vertical = TV_OVERSCAN_V),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                LiveClockChip()
            }
            BoxWithConstraints(
                Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .imePadding(),
                contentAlignment = Alignment.Center,
            ) {
                val cardMaxHeight = maxHeight
                if (mode == LoginMode.ACTIVATION) {
                    TvActivationCard(
                        session = activationSession,
                        loading = loading,
                        error = error,
                        reduceMotion = reduceMotion,
                        tv = tv,
                        width = min(maxWidth, 920.dp),
                        maxHeight = cardMaxHeight,
                        actions = actions,
                    )
                } else {
                    TvLoginCard(
                        mode = mode,
                        lastChosen = lastChosen,
                        form = form,
                        loading = loading,
                        error = error,
                        fileMessage = fileMessage,
                        reduceMotion = reduceMotion,
                        awaitingResult = awaitingResult,
                        onResultSeen = { awaitingResult = false },
                        tv = tv,
                        width = min(maxWidth * 0.70f, 620.dp),
                        maxHeight = cardMaxHeight,
                        actions = actions,
                    )
                }
            }
        }
    }
}

private suspend fun readPlaylistFile(context: Context, uri: Uri, strings: Strings): Pair<String, String> {
    val (displayName, sizeBytes) = withContext(Dispatchers.IO) { queryOpenable(context, uri) }
    if (!playlistFitsInMemory(sizeBytes, Runtime.getRuntime().maxMemory())) {
        error(strings.login.fileTooLarge(sizeBytes / (1024L * 1024L)))
    }
    val text = withContext(Dispatchers.IO) {
        context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }.orEmpty()
    }
    require(text.isNotBlank()) { strings.loginFileEmpty }
    val fileName = displayName
        ?: uri.lastPathSegment?.substringAfterLast('/')?.substringAfterLast(':')
        ?: "playlist.m3u"
    return fileName to text
}

private fun queryOpenable(context: Context, uri: Uri): Pair<String?, Long> = runCatching {
    context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE), null, null, null)?.use { cursor ->
        if (!cursor.moveToFirst()) return@use null to -1L
        val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
        val displayName = if (nameIndex >= 0 && !cursor.isNull(nameIndex)) cursor.getString(nameIndex) else null
        val size = if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) cursor.getLong(sizeIndex) else -1L
        displayName to size
    } ?: (null to -1L)
}.getOrDefault(null to -1L)

@Composable
private fun LiveClockChip() {
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    val locale = if (strings === ArStrings) Locale.forLanguageTag("ar") else Locale.US
    var now by remember { mutableStateOf(LocalDateTime.now()) }
    LaunchedEffect(Unit) {
        while (true) {
            now = LocalDateTime.now()
            delay(60_000L - System.currentTimeMillis() % 60_000L)
        }
    }
    val time = remember(now) { now.format(DateTimeFormatter.ofPattern("HH:mm", Locale.US)) }
    val date = remember(now, locale) { now.format(DateTimeFormatter.ofPattern("EEEE d MMMM", locale)) }
    Row(
        modifier = Modifier
            .background(Color(0x99120F0C), RoundedCornerShape(999.dp))
            .border(1.dp, Color(0x33E3BC78), RoundedCornerShape(999.dp))
            .padding(horizontal = 16.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(Icons.Rounded.Schedule, contentDescription = strings.login.clockDescription, tint = visuals.accent, modifier = Modifier.size(18.dp))
        Text(time.ltr(), color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        Box(Modifier.width(1.dp).height(16.dp).background(Color(0x33FFFFFF)))
        Text(date, color = Color(0xCCE3BC78), fontSize = 13.sp, fontWeight = FontWeight.Medium, maxLines = 1)
    }
}

// ── TV: chooser and forms ───────────────────────────────────────────────

@Composable
private fun TvLoginCard(
    mode: LoginMode,
    lastChosen: LoginMode,
    form: LoginForm,
    loading: LoadProgress?,
    error: String?,
    fileMessage: String?,
    reduceMotion: Boolean,
    awaitingResult: Boolean,
    onResultSeen: () -> Unit,
    tv: TvScale,
    width: Dp,
    maxHeight: Dp,
    actions: LoginActions,
) {
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    val login = strings.login
    val chooserFocus = remember { LoginMode.entries.associateWith { FocusRequester() } }
    val signInFocus = remember { FocusRequester() }
    val urlField = rememberTvTextFieldController()
    val userField = rememberTvTextFieldController()
    val passField = rememberTvTextFieldController()
    val nameField = rememberTvTextFieldController()
    val m3uField = rememberTvTextFieldController()
    val epgField = rememberTvTextFieldController()
    val m3uNameField = rememberTvTextFieldController()

    fun focusFirstMissingXtream() {
        when {
            form.url.isBlank() -> urlField.focus()
            form.user.isBlank() -> userField.focus()
            form.pass.isBlank() -> passField.focus()
            else -> signInFocus.tryFocus()
        }
    }
    val submitXtream = { if (!actions.submitXtream()) focusFirstMissingXtream() }
    val submitM3u = { if (!actions.submitM3u()) m3uField.focus() }

    // Focus follows the mode: the card of the method used last on the chooser, the first missing
    // field in a form. Wait one frame so the new nodes are attached and placed.
    LaunchedEffect(mode) {
        withFrameNanos { }
        when (mode) {
            LoginMode.CHOOSE -> chooserFocus.getValue(lastChosen).tryFocus()
            LoginMode.XTREAM -> focusFirstMissingXtream()
            LoginMode.M3U -> if (form.m3u.isBlank()) m3uField.focus() else signInFocus.tryFocus()
            LoginMode.ACTIVATION -> Unit
        }
    }
    // After a failed sign-in keep the remote on the Sign-in button instead of losing focus.
    LaunchedEffect(loading == null, error) {
        if (awaitingResult && loading == null) {
            onResultSeen()
            if (error != null) signInFocus.tryFocus()
        }
    }

    val isChoose = mode == LoginMode.CHOOSE
    GlassPanel(
        modifier = Modifier
            .width(width)
            .heightIn(max = maxHeight),
        radius = 28.dp,
        glow = visuals.accent.copy(alpha = 0.22f),
    ) {
        Column(
            modifier = Modifier
                .background(Color(0xCC120F0C))
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 26.dp, vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(if (isChoose) 10.dp else 9.dp),
        ) {
            if (isChoose) {
                PulsingLogo(tv, active = loading != null, reduceMotion = reduceMotion)
                Text("MoPlayer Pro", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.5.sp)
                Text(login.chooseTitle, color = Color(0xFFE8C985), fontSize = 16.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                LoginMethodChooser(chooserFocus = chooserFocus, onMode = actions.selectMode)
                LoginInfoRow()
            } else {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            if (mode == LoginMode.XTREAM) login.methodXtreamTitle else login.methodM3uTitle,
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                        )
                        Text(
                            if (mode == LoginMode.XTREAM) login.xtreamSubtitle else login.m3uSubtitle,
                            color = Color(0xFFE8C985),
                            fontSize = 14.sp,
                            maxLines = 2,
                        )
                    }
                    ModeDock(mode = mode, selectedFocus = null, onMode = actions.selectMode)
                }
                val busy = loading != null
                if (mode == LoginMode.XTREAM) {
                    TvTextField(
                        value = form.url, onValueChange = { form.url = it }, label = login.fieldServerUrl,
                        controller = urlField, icon = Icons.Rounded.Public, keyboardType = KeyboardType.Uri,
                        imeAction = ImeAction.Next, onImeAction = { userField.edit() },
                    )
                    TvTextField(
                        value = form.user, onValueChange = { form.user = it }, label = login.fieldUsername,
                        controller = userField, icon = Icons.Rounded.Person,
                        imeAction = ImeAction.Next, onImeAction = { passField.edit() },
                    )
                    TvTextField(
                        value = form.pass, onValueChange = { form.pass = it }, label = login.fieldPassword,
                        controller = passField, icon = Icons.Rounded.Lock, keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done, onImeAction = submitXtream, password = true,
                    )
                    TvTextField(
                        value = form.name, onValueChange = { form.name = it }, label = login.fieldDisplayName,
                        controller = nameField, icon = Icons.Rounded.Person,
                        imeAction = ImeAction.Done, onImeAction = submitXtream,
                    )
                    GlassActionButton(
                        text = if (busy) login.signingIn else login.signIn,
                        icon = Icons.Rounded.RocketLaunch,
                        enabled = !busy,
                        dimmed = busy || !form.canSubmitXtream,
                        focusRequester = signInFocus,
                        onClick = submitXtream,
                    )
                } else {
                    TvTextField(
                        value = form.m3u, onValueChange = { form.m3u = it }, label = login.fieldPlaylistUrl,
                        controller = m3uField, icon = Icons.Rounded.Link, keyboardType = KeyboardType.Uri,
                        imeAction = ImeAction.Done, onImeAction = submitM3u,
                    )
                    TvTextField(
                        value = form.epgUrl, onValueChange = { form.epgUrl = it }, label = login.fieldEpgUrl,
                        controller = epgField, icon = Icons.AutoMirrored.Rounded.EventNote, keyboardType = KeyboardType.Uri,
                        imeAction = ImeAction.Done, onImeAction = submitM3u,
                    )
                    TvTextField(
                        value = form.name, onValueChange = { form.name = it }, label = login.fieldDisplayName,
                        controller = m3uNameField, icon = Icons.Rounded.Person,
                        imeAction = ImeAction.Done, onImeAction = submitM3u,
                    )
                    GlassActionButton(
                        text = if (busy) login.signingIn else login.signIn,
                        icon = Icons.Rounded.RocketLaunch,
                        enabled = !busy,
                        dimmed = busy || !form.canSubmitM3u,
                        focusRequester = signInFocus,
                        onClick = submitM3u,
                    )
                }
                LoginStatusSlot(loading = loading, message = fileMessage ?: error, reduceMotion = reduceMotion)
                if (mode == LoginMode.M3U) {
                    GlassActionButton(
                        text = login.pickFile,
                        icon = Icons.Rounded.FolderOpen,
                        enabled = !busy,
                        secondary = true,
                        onClick = actions.pickFile,
                    )
                    Text(login.fileHint, color = Color(0xCCE3BC78), fontSize = 13.sp, textAlign = TextAlign.Center)
                }
            }
        }
    }
}

@Composable
private fun LoginStatusSlot(loading: LoadProgress?, message: String?, reduceMotion: Boolean) {
    if (loading == null && message == null) return
    val requester = remember { BringIntoViewRequester() }
    // Status text is not focusable, so scroll it into view explicitly when it appears.
    LaunchedEffect(loading != null, message) {
        if (loading != null || message != null) requester.bringIntoView()
    }
    Column(Modifier.fillMaxWidth().bringIntoViewRequester(requester)) {
        when {
            loading != null -> FluidLoadingBar(loading, reduceMotion = reduceMotion)
            message != null -> ErrorGlassCard(message)
        }
    }
}

@Composable
private fun LoginInfoRow() {
    val login = LocalStrings.current.login
    // Plain labels, deliberately without button chrome: nothing here is focusable.
    Row(
        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(18.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        InfoLabel(Icons.Rounded.Storage, login.infoSavedLocally)
        InfoLabel(Icons.Rounded.Sync, login.infoSmartRefresh)
        InfoLabel(Icons.Rounded.Bolt, login.infoFastStartup)
    }
}

@Composable
private fun InfoLabel(icon: ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Icon(icon, contentDescription = null, tint = Color(0x99E3BC78), modifier = Modifier.size(16.dp))
        Text(text, color = Color(0xB3EFE1C4), fontSize = 12.sp, maxLines = 1)
    }
}

@Composable
private fun LoginMethodChooser(
    chooserFocus: Map<LoginMode, FocusRequester>?,
    onMode: (LoginMode) -> Unit,
) {
    val login = LocalStrings.current.login
    Column(
        modifier = Modifier.fillMaxWidth().focusGroup(),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        LoginMethodCard(
            title = login.methodQrTitle,
            subtitle = login.methodQrSubtitle,
            icon = Icons.Rounded.QrCode2,
            badge = login.recommended,
            focusRequester = chooserFocus?.get(LoginMode.ACTIVATION),
        ) { onMode(LoginMode.ACTIVATION) }
        LoginMethodCard(
            title = login.methodXtreamTitle,
            subtitle = login.methodXtreamSubtitle,
            icon = Icons.Rounded.Dns,
            focusRequester = chooserFocus?.get(LoginMode.XTREAM),
        ) { onMode(LoginMode.XTREAM) }
        LoginMethodCard(
            title = login.methodM3uTitle,
            subtitle = login.methodM3uSubtitle,
            icon = Icons.AutoMirrored.Rounded.PlaylistPlay,
            focusRequester = chooserFocus?.get(LoginMode.M3U),
        ) { onMode(LoginMode.M3U) }
    }
}

@Composable
private fun LoginMethodCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    focusRequester: FocusRequester?,
    badge: String? = null,
    onClick: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val scale by animateFloatAsState(if (focused) 1.03f else 1f, label = "method-card-scale")
    val shape = RoundedCornerShape(20.dp)
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 64.dp)
            .let { if (focusRequester != null) it.focusRequester(focusRequester) else it }
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .shadow(
                if (focused) 24.dp else 6.dp,
                shape,
                clip = false,
                ambientColor = visuals.accent.copy(alpha = if (focused) 0.38f else 0.10f),
                spotColor = visuals.accent.copy(alpha = if (focused) 0.38f else 0.10f),
            )
            .clickable(interactionSource = interaction, indication = null, onClick = onClick),
        shape = shape,
        color = if (focused) Color(0xF22E2419) else Color(0xE51E1914),
        border = BorderStroke(if (focused) 3.dp else 1.dp, if (focused) Color.White else Color(0x55E3BC78)),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(if (focused) visuals.accent.copy(alpha = 0.30f) else Color(0x332A2723)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = if (focused) Color.White else visuals.accent, modifier = Modifier.size(26.dp))
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(title, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1)
                    if (badge != null) {
                        Text(
                            badge,
                            color = Color(0xFF1A1208),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold,
                            maxLines = 1,
                            modifier = Modifier
                                .background(visuals.accent, RoundedCornerShape(999.dp))
                                .padding(horizontal = 8.dp, vertical = 2.dp),
                        )
                    }
                }
                Text(subtitle, color = Color(0xEDE3BC78), fontSize = 13.sp, lineHeight = 17.sp, maxLines = 2)
            }
            Icon(Icons.AutoMirrored.Rounded.KeyboardArrowRight, contentDescription = null, tint = Color(0xCCE3BC78), modifier = Modifier.size(24.dp))
        }
    }
}

@Composable
private fun ModeDock(mode: LoginMode, selectedFocus: FocusRequester?, onMode: (LoginMode) -> Unit) {
    val login = LocalStrings.current.login
    Row(
        Modifier
            .focusGroup()
            .background(Color(0x881E1A16), RoundedCornerShape(999.dp))
            .border(1.dp, Color(0x33E3BC78), RoundedCornerShape(999.dp))
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        listOf(
            LoginMode.ACTIVATION to login.tabQr,
            LoginMode.XTREAM to login.tabXtream,
            LoginMode.M3U to login.tabM3u,
        ).forEach { (tabMode, label) ->
            val selected = mode == tabMode
            ModeTab(label, selected, focusRequester = if (selected) selectedFocus else null) { onMode(tabMode) }
        }
    }
}

/** Selected = filled accent pill; focused = white ring and lift. Both can apply at once. */
@Composable
private fun ModeTab(text: String, selected: Boolean, focusRequester: FocusRequester?, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val accent = LocalMoVisuals.current.accent
    val scale by animateFloatAsState(if (focused) 1.08f else 1f, label = "mode-tab-scale")
    val background by animateColorAsState(
        when {
            selected -> accent
            focused -> Color(0x40FFFFFF)
            else -> Color.Transparent
        },
        label = "mode-tab-bg",
    )
    val shape = RoundedCornerShape(999.dp)
    Box(
        modifier = Modifier
            .let { if (focusRequester != null) it.focusRequester(focusRequester) else it }
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .background(background, shape)
            .then(if (focused) Modifier.border(2.dp, Color.White, shape) else Modifier)
            .clickable(interactionSource = interaction, indication = null, onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text,
            color = when {
                selected -> Color(0xFF1A1208)
                focused -> Color.White
                else -> Color(0xB3FFFFFF)
            },
            fontSize = 14.sp,
            fontWeight = FontWeight.ExtraBold,
        )
    }
}

/**
 * Primary (gradient) or secondary (outlined) action. It stays focusable while disabled or busy so
 * the remote never loses focus when a login starts: clicks are ignored while not [enabled], and
 * [dimmed] only changes the look (Sign in stays clickable to point at the first missing field).
 * The focus ring is drawn outside the dimmed layer so it is always fully visible.
 */
@Composable
private fun GlassActionButton(
    text: String,
    icon: ImageVector,
    enabled: Boolean,
    modifier: Modifier = Modifier,
    dimmed: Boolean = !enabled,
    focusRequester: FocusRequester? = null,
    secondary: Boolean = false,
    onClick: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    val accent = visuals.accent
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val scale by animateFloatAsState(if (focused) 1.04f else 1f, label = "btn-scale")
    val shape = RoundedCornerShape(999.dp)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 46.dp)
            .let { if (focusRequester != null) it.focusRequester(focusRequester) else it }
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .shadow(if (focused) 22.dp else 0.dp, shape, clip = false, ambientColor = accent.copy(alpha = 0.5f), spotColor = accent.copy(alpha = 0.5f))
            .border(
                width = if (focused) 3.dp else 1.dp,
                color = if (focused) Color.White else if (secondary) Color(0x66E3BC78) else Color.Transparent,
                shape = shape,
            )
            .clickable(interactionSource = interaction, indication = null) { if (enabled) onClick() }
            .semantics { if (!enabled) disabled() }
            .graphicsLayer { alpha = if (dimmed) 0.45f else 1f }
            .then(
                if (secondary) {
                    Modifier.background(if (focused) accent.copy(alpha = 0.22f) else Color(0x331E1914), shape)
                } else {
                    Modifier.background(Brush.horizontalGradient(listOf(accent, visuals.accentB)), shape)
                },
            )
            .padding(horizontal = 18.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            val content = if (secondary && !focused) visuals.accent else Color.White
            Icon(icon, contentDescription = null, tint = content, modifier = Modifier.size(20.dp))
            Text(text, color = content, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1)
        }
    }
}

@Composable
private fun PulsingLogo(tv: TvScale, active: Boolean, reduceMotion: Boolean = false) {
    val pulse = if (!active || reduceMotion) {
        1f
    } else {
        val transition = rememberInfiniteTransition(label = "logo-pulse")
        val animatedPulse by transition.animateFloat(
            initialValue = 0.90f,
            targetValue = 1.06f,
            animationSpec = infiniteRepeatable(tween(1400, easing = FastOutSlowInEasing), RepeatMode.Reverse),
            label = "pulse",
        )
        animatedPulse
    }
    val accent = LocalMoVisuals.current.accent
    val accentB = LocalMoVisuals.current.accentB
    val logoWidth = if (tv.isTv) 80.dp else 72.dp
    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(width = logoWidth, height = logoWidth * 0.72f)) {
        if (active) {
            Canvas(Modifier.fillMaxSize()) {
                drawCircle(accent.copy(alpha = 0.15f), radius = size.minDimension * 0.60f * pulse)
                drawCircle(accentB.copy(alpha = 0.10f), radius = size.minDimension * 0.44f * pulse)
            }
        }
        Image(
            painter = painterResource(R.drawable.brand_logo_ui),
            contentDescription = null,
            contentScale = ContentScale.Fit,
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    scaleX = pulse
                    scaleY = pulse
                },
        )
    }
}

@Composable
private fun FluidLoadingBar(progress: LoadProgress, reduceMotion: Boolean = false) {
    val wave = if (reduceMotion) {
        0.5f
    } else {
        val transition = rememberInfiniteTransition(label = "fluid-loading")
        val animatedWave by transition.animateFloat(0f, 1f, infiniteRepeatable(tween(1600, easing = LinearEasing)), label = "wave")
        animatedWave
    }
    val accent = LocalMoVisuals.current.accent
    val accentB = LocalMoVisuals.current.accentB
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(progress.phase, color = Color(0xCCE3BC78), fontSize = 14.sp, fontWeight = FontWeight.SemiBold, maxLines = 2)
        Canvas(Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(999.dp))) {
            drawRoundRect(Color(0x222A231E), cornerRadius = CornerRadius(size.height))
            val filled = size.width * progress.percent.coerceIn(0f, 1f)
            drawRoundRect(
                brush = Brush.linearGradient(
                    listOf(accent.copy(alpha = 0.5f), accent, accentB.copy(alpha = 0.8f)),
                    start = Offset(size.width * wave - size.width, 0f),
                    end = Offset(size.width * wave, size.height),
                ),
                size = Size(filled, size.height),
                cornerRadius = CornerRadius(size.height),
            )
        }
    }
}

@Composable
private fun ErrorGlassCard(error: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0x66401018), RoundedCornerShape(16.dp))
            .border(1.dp, Color(0x88FF4D6D), RoundedCornerShape(16.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(Icons.Rounded.ErrorOutline, contentDescription = null, tint = Color(0xFFFF8FA3), modifier = Modifier.size(20.dp))
        Text(
            text = error,
            color = Color(0xFFFFB3C0),
            fontSize = 14.sp,
            lineHeight = 19.sp,
            maxLines = 3,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

// ── QR activation ────────────────────────────────────────────────────────

@Composable
private fun TvActivationCard(
    session: DeviceActivationSession?,
    loading: LoadProgress?,
    error: String?,
    reduceMotion: Boolean,
    tv: TvScale,
    width: Dp,
    maxHeight: Dp,
    actions: LoginActions,
) {
    val visuals = LocalMoVisuals.current
    val login = LocalStrings.current.login
    val tabFocus = remember { FocusRequester() }
    val refreshFocus = remember { FocusRequester() }
    // Start on the selected QR tab: an accidental OK must not replace a code that is being scanned.
    LaunchedEffect(Unit) {
        withFrameNanos { }
        tabFocus.tryFocus()
    }
    GlassPanel(
        modifier = Modifier
            .width(width)
            .heightIn(max = maxHeight),
        radius = 28.dp,
        glow = visuals.accent.copy(alpha = 0.22f),
    ) {
        Column(
            modifier = Modifier
                .background(Color(0xCC120F0C))
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 28.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(login.qrTitle, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                    Text(login.qrSubtitle, color = Color(0xFFE8C985), fontSize = 14.sp)
                }
                ModeDock(mode = LoginMode.ACTIVATION, selectedFocus = tabFocus, onMode = actions.selectMode)
            }
            QrActivationPanel(
                session = session,
                loading = loading,
                error = error,
                tv = tv,
                wide = true,
                reduceMotion = reduceMotion,
                refreshFocus = refreshFocus,
                onRefresh = actions.refreshQr,
                onResume = actions.resumeQr,
                onStop = actions.stopQr,
            )
        }
    }
}

/**
 * QR sign-in: shows a code when the panel appears and stops polling when it leaves the screen
 * (and, on TV, while the app is in the background). Coming back resumes a code that is still
 * waiting; otherwise a new one is created. Expired codes are renewed automatically a few times.
 * Phones keep polling in the background because the user finishes on this device's browser.
 */
@Composable
private fun QrActivationPanel(
    session: DeviceActivationSession?,
    loading: LoadProgress?,
    error: String?,
    tv: TvScale,
    wide: Boolean,
    reduceMotion: Boolean,
    refreshFocus: FocusRequester,
    onRefresh: () -> Unit,
    onResume: () -> Unit,
    onStop: () -> Unit,
) {
    val context = LocalContext.current
    val login = LocalStrings.current.login
    val currentError by rememberUpdatedState(error)
    val currentLoading by rememberUpdatedState(loading)
    val currentSession by rememberUpdatedState(session)
    val refresh by rememberUpdatedState(onRefresh)
    val resume by rememberUpdatedState(onResume)
    val stop by rememberUpdatedState(onStop)
    var renewals by remember { mutableIntStateOf(0) }
    var autoRenewing by remember { mutableStateOf(false) }
    var requestedAt by remember { mutableLongStateOf(0L) }
    var errorAtRequest by remember { mutableStateOf<String?>(null) }
    // Code that was on screen when a new one was requested; it is hidden until the new one arrives.
    // A session that already exists when the panel appears stays hidden until it is resumed.
    var staleCode by remember { mutableStateOf(session?.deviceCode) }
    var browserMessage by remember { mutableStateOf<String?>(null) }

    fun requestCode(manual: Boolean) {
        if (manual) {
            renewals = 0
            autoRenewing = false
        }
        requestedAt = SystemClock.elapsedRealtime()
        errorAtRequest = currentError
        staleCode = currentSession?.deviceCode
        browserMessage = null
        refresh()
    }

    fun startOrResume() {
        if (currentLoading != null) return
        val existing = currentSession
        if (existing != null && canResumeQr(existing.status, existing.expiresAt, System.currentTimeMillis())) {
            requestedAt = SystemClock.elapsedRealtime()
            errorAtRequest = currentError
            staleCode = null
            browserMessage = null
            resume()
        } else {
            requestCode(manual = true)
        }
    }

    if (tv.isTv) {
        LifecycleStartEffect(Unit) {
            startOrResume()
            onStopOrDispose { stop() }
        }
    } else {
        DisposableEffect(Unit) {
            startOrResume()
            onDispose { stop() }
        }
    }

    val current = session?.takeIf { it.deviceCode != staleCode }
    var creationTimedOut by remember { mutableStateOf(false) }
    LaunchedEffect(requestedAt, current == null) {
        creationTimedOut = false
        if (current == null && requestedAt > 0L) {
            delay(QR_CREATE_TIMEOUT_MS)
            creationTimedOut = true
        }
    }
    LaunchedEffect(current?.deviceCode) {
        if (current != null) autoRenewing = false
    }
    LaunchedEffect(current?.status, current?.deviceCode) {
        if (shouldAutoRenewQr(current?.status, renewals)) {
            renewals += 1
            autoRenewing = true
            requestCode(manual = false)
        }
    }
    val newError = requestedAt > 0L && error != null && error !== errorAtRequest
    val failed = (current == null && requestedAt > 0L && (newError || creationTimedOut)) ||
        (current?.status == DeviceActivationStatus.ACTIVATED && loading == null && newError)
    val phase = qrPhase(current?.status, loading != null, failed, autoRenewing, renewals)
    LaunchedEffect(phase) {
        if (tv.isTv && (phase == QrPhase.Failed || phase == QrPhase.Expired)) refreshFocus.tryFocus()
    }
    val failureMessage = current?.error?.takeIf { it.isNotBlank() } ?: error ?: login.qrFailedGeneric

    // TV: the drawn symbol (whole-pixel modules, so slightly smaller than the box) stays >= 260dp,
    // scannable from the couch; about half the screen height on a 540dp TV.
    val qrSize = if (tv.isTv) {
        (tv.shortestScreenDp * 0.52f).dp.coerceIn(280.dp, 380.dp)
    } else {
        (tv.shortestScreenDp * 0.42f).dp.coerceIn(150.dp, 240.dp)
    }
    val plate: @Composable () -> Unit = {
        QrPlate(url = if (phase == QrPhase.Waiting) current?.verificationUrlComplete.orEmpty() else "", phase = phase, size = qrSize)
    }
    val details: @Composable () -> Unit = {
        QrDetails(
            session = current,
            phase = phase,
            loading = loading,
            failureMessage = failureMessage,
            browserMessage = browserMessage,
            wide = wide,
            reduceMotion = reduceMotion,
            refreshFocus = refreshFocus,
            onRefresh = { requestCode(manual = true) },
            onOpenPage = { url ->
                if (!openInBrowser(context, url)) browserMessage = login.qrNoBrowser(displayActivationUrl(url))
            },
        )
    }
    if (wide) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(32.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            plate()
            Box(Modifier.weight(1f)) { details() }
        }
    } else {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            plate()
            details()
        }
    }
}

@Composable
private fun QrPlate(url: String, phase: QrPhase, size: Dp) {
    val login = LocalStrings.current.login
    val visuals = LocalMoVisuals.current
    val density = LocalDensity.current
    val targetPx = with(density) { size.roundToPx() }
    val qr = rememberQrBitmap(url, targetPx)
    val shape = RoundedCornerShape(22.dp)
    Box(
        modifier = Modifier
            .shadow(18.dp, shape, spotColor = Color(0xFFF1CC83))
            .background(if (phase == QrPhase.Waiting) Color.White else Color(0xFF1E1914), shape)
            .border(2.dp, Color(0x66F1CC83), shape)
            .padding(8.dp)
            .size(size),
        contentAlignment = Alignment.Center,
    ) {
        when {
            phase == QrPhase.Waiting && qr != null -> Image(
                bitmap = qr,
                contentDescription = login.qrImageDescription,
                filterQuality = FilterQuality.None,
                modifier = Modifier.size(with(density) { qr.width.toDp() }),
            )
            phase == QrPhase.Received -> Icon(
                Icons.Rounded.CheckCircle,
                contentDescription = null,
                tint = visuals.accent,
                modifier = Modifier.size(size * 0.36f),
            )
            phase == QrPhase.Expired || phase == QrPhase.Failed -> Icon(
                Icons.Rounded.QrCode2,
                contentDescription = null,
                tint = Color(0x55E3BC78),
                modifier = Modifier.size(size * 0.5f),
            )
            else -> CircularProgressIndicator(
                color = if (phase == QrPhase.Waiting) Color(0xFF0B0B0C) else visuals.accent,
                modifier = Modifier.size(44.dp),
            )
        }
    }
}

@Composable
private fun QrDetails(
    session: DeviceActivationSession?,
    phase: QrPhase,
    loading: LoadProgress?,
    failureMessage: String,
    browserMessage: String?,
    wide: Boolean,
    reduceMotion: Boolean,
    refreshFocus: FocusRequester,
    onRefresh: () -> Unit,
    onOpenPage: (String) -> Unit,
) {
    val login = LocalStrings.current.login
    val tvText = wide
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (wide) Alignment.Start else Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (phase != QrPhase.Received) {
            val steps = if (wide) {
                listOf(login.qrStep1, login.qrStep2, login.qrStep3)
            } else {
                listOf(login.qrStep1Mobile, login.qrStep2, login.qrStep3Mobile)
            }
            steps.forEachIndexed { index, step -> QrStep(number = index + 1, text = step, large = tvText) }
        }
        if (phase == QrPhase.Waiting && session != null) {
            Text(
                login.qrCodeLabel,
                color = Color(0xB3FFFFFF),
                fontSize = if (tvText) 14.sp else 13.sp,
                modifier = Modifier.padding(top = 4.dp),
            )
            Text(
                session.userCode.ltr(),
                color = Color.White,
                fontSize = if (tvText) 36.sp else 28.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 3.sp,
            )
            Text(
                "${login.qrOrVisit} ${displayActivationUrl(session.verificationUrl).ltr()}",
                color = Color(0xFFE8C985),
                fontSize = if (tvText) 16.sp else 14.sp,
                fontWeight = FontWeight.SemiBold,
                textAlign = if (wide) TextAlign.Start else TextAlign.Center,
            )
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                QrCountdown(expiresAt = session.expiresAt, large = tvText)
                Text(login.qrWaiting, color = Color(0xB3FFFFFF), fontSize = if (tvText) 14.sp else 12.sp, maxLines = 1)
            }
        } else {
            val status = when (phase) {
                QrPhase.Creating -> login.qrCreating
                QrPhase.Received -> login.qrReceived
                QrPhase.Renewing -> login.qrRenewing
                QrPhase.Expired -> login.qrExpired
                QrPhase.Waiting -> login.qrWaiting
                QrPhase.Failed -> failureMessage
            }
            val isProblem = phase == QrPhase.Failed || phase == QrPhase.Expired
            Text(
                status,
                color = if (isProblem) Color(0xFFFFB3C0) else Color(0xCCFFFFFF),
                fontSize = if (tvText) 16.sp else 14.sp,
                fontWeight = if (isProblem) FontWeight.Bold else FontWeight.Medium,
                maxLines = 3,
                textAlign = if (wide) TextAlign.Start else TextAlign.Center,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
        if (phase == QrPhase.Received && loading != null) {
            FluidLoadingBar(loading, reduceMotion = reduceMotion)
        }
        if (!wide && phase == QrPhase.Waiting && session != null) {
            GlassActionButton(
                text = login.qrOpenPage,
                icon = Icons.AutoMirrored.Rounded.OpenInNew,
                enabled = true,
                onClick = { onOpenPage(session.verificationUrlComplete) },
            )
        }
        if (browserMessage != null) {
            Text(browserMessage, color = Color(0xFFFFB3C0), fontSize = 13.sp, textAlign = TextAlign.Center)
        }
        if (phase != QrPhase.Received) {
            GlassActionButton(
                text = if (phase == QrPhase.Failed) login.qrTryAgain else login.qrNewCode,
                icon = Icons.Rounded.Refresh,
                enabled = phase != QrPhase.Creating && phase != QrPhase.Renewing,
                secondary = phase == QrPhase.Waiting,
                focusRequester = refreshFocus,
                modifier = if (wide) Modifier.widthIn(max = 280.dp) else Modifier,
                onClick = onRefresh,
            )
        }
    }
}

@Composable
private fun QrStep(number: Int, text: String, large: Boolean) {
    val accent = LocalMoVisuals.current.accent
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(
            Modifier
                .size(if (large) 26.dp else 22.dp)
                .background(accent.copy(alpha = 0.22f), CircleShape)
                .border(1.dp, accent.copy(alpha = 0.6f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(number.toString(), color = accent, fontSize = if (large) 14.sp else 12.sp, fontWeight = FontWeight.ExtraBold)
        }
        Text(text, color = Color(0xE6FFFFFF), fontSize = if (large) 15.sp else 13.sp, maxLines = 2)
    }
}

/** Live mm:ss countdown; only this small composable recomposes every second. */
@Composable
private fun QrCountdown(expiresAt: Long, large: Boolean) {
    val login = LocalStrings.current.login
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(expiresAt) {
        while (true) {
            now = System.currentTimeMillis()
            delay(1_000L)
        }
    }
    val secondsLeft = ((expiresAt - now) / 1_000L).coerceAtLeast(0L)
    Row(
        modifier = Modifier
            .background(Color(0x33E3BC78), RoundedCornerShape(999.dp))
            .padding(horizontal = 12.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Icon(Icons.Rounded.Schedule, contentDescription = null, tint = Color(0xFFE8C985), modifier = Modifier.size(16.dp))
        Text(
            login.qrValidFor(formatCountdown(secondsLeft)),
            color = Color(0xFFEFE1C4),
            fontSize = if (large) 15.sp else 13.sp,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

/** Builds the QR bitmap (and decodes the small centre logo) off the main thread. */
@Composable
private fun rememberQrBitmap(url: String, targetPx: Int): ImageBitmap? {
    val context = LocalContext.current
    val bitmap by produceState<ImageBitmap?>(initialValue = null, url, targetPx) {
        value = null
        if (url.isBlank() || targetPx <= 0) return@produceState
        value = withContext(Dispatchers.Default) {
            runCatching {
                val logo = BitmapFactory.decodeResource(context.resources, R.drawable.brand_logo_ui)
                try {
                    brandedQrBitmap(url, targetPx, logo).asImageBitmap()
                } finally {
                    logo?.recycle()
                }
            }.getOrNull()
        }
    }
    return bitmap
}

/**
 * Branded QR with a 4-module quiet zone, rounded modules, styled finder eyes and the MoPlayer mark
 * in the centre. The payload is ASCII, so no CHARACTER_SET hint (it would add an ECI header and a
 * bigger symbol). Level Q keeps 25% recovery for the centre mark while the activation URL stays at
 * version 6, which has no centre alignment pattern for the logo to cover.
 */
private fun brandedQrBitmap(value: String, targetPx: Int, logo: android.graphics.Bitmap?): android.graphics.Bitmap {
    val code = Encoder.encode(value, ErrorCorrectionLevel.Q)
    val matrix = code.matrix
    val modules = matrix.width
    val cell = qrCellPx(targetPx, modules)
    val sizePx = cell * (modules + 2 * QR_QUIET_MODULES)
    val bitmap = android.graphics.Bitmap.createBitmap(sizePx, sizePx, android.graphics.Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bitmap)
    canvas.drawColor(android.graphics.Color.WHITE)
    val dark = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply { color = 0xFF0B0B0C.toInt() }
    val white = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply { color = android.graphics.Color.WHITE }
    val origin = (QR_QUIET_MODULES * cell).toFloat()
    val cellF = cell.toFloat()
    fun inFinder(mx: Int, my: Int): Boolean =
        (mx < 7 && my < 7) || (mx >= modules - 7 && my < 7) || (mx < 7 && my >= modules - 7)
    val radius = cellF * 0.25f
    for (my in 0 until modules) {
        for (mx in 0 until modules) {
            if (matrix.get(mx, my).toInt() != 1 || inFinder(mx, my)) continue
            val left = origin + mx * cellF
            val top = origin + my * cellF
            canvas.drawRoundRect(left, top, left + cellF, top + cellF, radius, radius, dark)
        }
    }
    fun finder(cx: Int, cy: Int) {
        val x = origin + cx * cellF
        val y = origin + cy * cellF
        val outer = 7 * cellF
        canvas.drawRoundRect(x, y, x + outer, y + outer, cellF * 1.7f, cellF * 1.7f, dark)
        canvas.drawRoundRect(x + cellF, y + cellF, x + outer - cellF, y + outer - cellF, cellF * 1.2f, cellF * 1.2f, white)
        canvas.drawRoundRect(x + 2 * cellF, y + 2 * cellF, x + outer - 2 * cellF, y + outer - 2 * cellF, cellF * 0.9f, cellF * 0.9f, dark)
    }
    finder(0, 0)
    finder(modules - 7, 0)
    finder(0, modules - 7)
    if (logo != null) {
        val box = modules * cellF * 0.18f
        val center = sizePx / 2f
        val plate = box / 2f + cellF
        canvas.drawRoundRect(center - plate, center - plate, center + plate, center + plate, plate * 0.34f, plate * 0.34f, white)
        val aspect = logo.width.toFloat() / logo.height.toFloat()
        val w = if (aspect >= 1f) box else box * aspect
        val h = if (aspect >= 1f) box / aspect else box
        val dst = android.graphics.RectF(center - w / 2f, center - h / 2f, center + w / 2f, center + h / 2f)
        canvas.drawBitmap(logo, null, dst, android.graphics.Paint(android.graphics.Paint.FILTER_BITMAP_FLAG or android.graphics.Paint.ANTI_ALIAS_FLAG))
    }
    return bitmap
}

/** Opens the activation page in a browser, never in MoPlayer itself. Returns false when nothing can open it. */
private fun openInBrowser(context: Context, url: String): Boolean {
    val view = Intent(Intent.ACTION_VIEW, Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE)
    val intent = if (browserIntentNeedsChooser(Build.VERSION.SDK_INT)) {
        Intent.createChooser(view, null)
            .putExtra(Intent.EXTRA_EXCLUDE_COMPONENTS, arrayOf(ComponentName(context, MainActivity::class.java)))
    } else {
        view
    }
    if (context !is Activity) intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return try {
        context.startActivity(intent)
        true
    } catch (_: ActivityNotFoundException) {
        false
    } catch (_: SecurityException) {
        false
    }
}

// ── Phones and tablets ────────────────────────────────────────────────────

@Composable
private fun CompactLoginScreen(
    settings: AppSettings,
    mode: LoginMode,
    form: LoginForm,
    loading: LoadProgress?,
    error: String?,
    fileMessage: String?,
    activationSession: DeviceActivationSession?,
    reduceMotion: Boolean,
    actions: LoginActions,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val login = LocalStrings.current.login
    val useWideLayout = tv.maxOfWidthHeightDp >= 560
    val logoSize = when {
        tv.isLowHeightLandscape -> 44.dp
        tv.isCompact -> 52.dp
        else -> 72.dp
    }
    val fieldHeight = when {
        tv.isLowHeightLandscape -> 40.dp
        tv.isCompact -> 44.dp
        else -> 48.dp
    }
    val outerPadH = when {
        tv.isLowHeightLandscape -> 10.dp
        tv.isCompact -> 12.dp
        else -> 18.dp
    }
    val outerPadV = when {
        tv.isLowHeightLandscape -> 6.dp
        tv.isCompact -> 10.dp
        else -> 14.dp
    }
    val formSpacing = if (tv.isLowHeightLandscape) 6.dp else if (tv.isCompact) 8.dp else 12.dp
    val refreshFocus = remember { FocusRequester() }
    val busy = loading != null

    @Composable
    fun LoginFields(modifier: Modifier = Modifier) {
        Column(modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(formSpacing)) {
            if (mode == LoginMode.CHOOSE) {
                Text(login.chooseTitle, color = Color(0xFFE8C985), style = MaterialTheme.typography.titleMedium)
                LoginMethodChooser(chooserFocus = null, onMode = actions.selectMode)
                return@Column
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                CompactModeButton(login.tabQr, mode == LoginMode.ACTIVATION, Modifier.weight(1f)) { actions.selectMode(LoginMode.ACTIVATION) }
                CompactModeButton(login.tabXtream, mode == LoginMode.XTREAM, Modifier.weight(1f)) { actions.selectMode(LoginMode.XTREAM) }
                CompactModeButton(login.tabM3u, mode == LoginMode.M3U, Modifier.weight(1f)) { actions.selectMode(LoginMode.M3U) }
            }
            when (mode) {
                LoginMode.M3U -> {
                    CompactTextField(form.m3u, { form.m3u = it }, login.fieldPlaylistUrl, Icons.Rounded.Link, KeyboardType.Uri, ImeAction.Next)
                    CompactTextField(form.epgUrl, { form.epgUrl = it }, login.fieldEpgUrl, Icons.AutoMirrored.Rounded.EventNote, KeyboardType.Uri, ImeAction.Next)
                    CompactTextField(form.name, { form.name = it }, login.fieldDisplayName, Icons.Rounded.Person, imeAction = ImeAction.Done, onDone = { actions.submitM3u() })
                    Button(
                        onClick = { actions.submitM3u() },
                        enabled = !busy && form.canSubmitM3u,
                        modifier = Modifier.fillMaxWidth().height(fieldHeight),
                    ) { Text(if (busy) login.signingIn else login.signIn) }
                    OutlinedButton(
                        onClick = actions.pickFile,
                        enabled = !busy,
                        modifier = Modifier.fillMaxWidth().height(fieldHeight),
                    ) { Text(login.pickFile) }
                    Text(login.fileHint, color = Color(0xAAE3BC78), style = MaterialTheme.typography.bodySmall)
                }
                LoginMode.XTREAM -> {
                    CompactTextField(form.url, { form.url = it }, login.fieldServerUrl, Icons.Rounded.Public, KeyboardType.Uri, ImeAction.Next)
                    CompactTextField(form.user, { form.user = it }, login.fieldUsername, Icons.Rounded.Person, imeAction = ImeAction.Next)
                    CompactPasswordField(form.pass, { form.pass = it }, onDone = { actions.submitXtream() })
                    CompactTextField(form.name, { form.name = it }, login.fieldDisplayName, Icons.Rounded.Person, imeAction = ImeAction.Done, onDone = { actions.submitXtream() })
                    Button(
                        onClick = { actions.submitXtream() },
                        enabled = !busy && form.canSubmitXtream,
                        modifier = Modifier.fillMaxWidth().height(fieldHeight),
                    ) { Text(if (busy) login.signingIn else login.signIn) }
                }
                LoginMode.ACTIVATION -> {
                    QrActivationPanel(
                        session = activationSession,
                        loading = loading,
                        error = error,
                        tv = tv,
                        wide = false,
                        reduceMotion = reduceMotion,
                        refreshFocus = refreshFocus,
                        onRefresh = actions.refreshQr,
                        onResume = actions.resumeQr,
                        onStop = actions.stopQr,
                    )
                }
                LoginMode.CHOOSE -> Unit
            }
            if (mode != LoginMode.ACTIVATION) {
                if (loading != null) FluidLoadingBar(loading, reduceMotion = reduceMotion)
                val message = fileMessage ?: error
                if (message != null && loading == null) {
                    Text(message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, maxLines = 4)
                }
            }
        }
    }

    Box(Modifier.fillMaxSize()) {
        LoginBackdropLayer(settings, reduceMotion = reduceMotion)
        Box(
            Modifier
                .fillMaxSize()
                .imePadding()
                .padding(horizontal = outerPadH, vertical = outerPadV),
        ) {
            if (useWideLayout) {
                Row(
                    Modifier.fillMaxSize(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    Column(
                        Modifier
                            .weight(0.32f)
                            .fillMaxHeight(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Image(
                            painter = painterResource(R.drawable.brand_logo_ui),
                            contentDescription = "MoPlayer Pro",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.size(logoSize + 10.dp),
                        )
                        Text("MoPlayer Pro", color = Color.White, style = MaterialTheme.typography.headlineSmall)
                        if (!tv.isLowHeightLandscape) {
                            Text(login.tagline, color = visuals.accent, style = MaterialTheme.typography.bodySmall, maxLines = 2)
                        }
                    }
                    Column(
                        Modifier
                            .weight(0.68f)
                            .fillMaxHeight()
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.Center,
                    ) {
                        LoginFields(Modifier.fillMaxWidth())
                    }
                }
            } else {
                Column(
                    Modifier
                        .fillMaxSize()
                        .widthIn(max = 560.dp)
                        .align(Alignment.Center)
                        .verticalScroll(rememberScrollState()),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(formSpacing, Alignment.CenterVertically),
                ) {
                    Image(
                        painter = painterResource(R.drawable.brand_logo_ui),
                        contentDescription = "MoPlayer Pro",
                        contentScale = ContentScale.Fit,
                        modifier = Modifier.size(logoSize),
                    )
                    Text(
                        "MoPlayer Pro",
                        color = Color.White,
                        style = if (tv.isLowHeightLandscape) MaterialTheme.typography.titleLarge else MaterialTheme.typography.headlineLarge,
                    )
                    if (!(tv.isLowHeightLandscape && tv.isCompact)) {
                        Text(login.tagline, color = visuals.accent, style = MaterialTheme.typography.bodySmall, maxLines = 1)
                    }
                    LoginFields(Modifier.fillMaxWidth())
                }
            }
        }
    }
}

@Composable
private fun CompactModeButton(text: String, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    val visuals = LocalMoVisuals.current
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(48.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = if (selected) visuals.accent.copy(alpha = 0.18f) else Color.Transparent,
            contentColor = if (selected) visuals.accent else Color.White,
        ),
    ) { Text(text) }
}

@Composable
private fun compactFieldColors() = TextFieldDefaults.colors(
    focusedTextColor = Color.White,
    unfocusedTextColor = Color.White,
    focusedContainerColor = Color(0x332A2723),
    unfocusedContainerColor = Color(0x222A2723),
    focusedLabelColor = LocalMoVisuals.current.accent,
    unfocusedLabelColor = Color(0xDDE3BC78),
    focusedIndicatorColor = LocalMoVisuals.current.accent,
    unfocusedIndicatorColor = Color(0x66E3BC78),
    cursorColor = LocalMoVisuals.current.accent,
)

@Composable
private fun CompactTextField(
    value: String,
    onValue: (String) -> Unit,
    label: String,
    icon: ImageVector,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Next,
    onDone: (() -> Unit)? = null,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValue,
        label = { Text(label) },
        leadingIcon = { Icon(icon, null) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = imeAction),
        keyboardActions = if (onDone != null) KeyboardActions(onDone = { onDone() }) else KeyboardActions.Default,
        modifier = Modifier.fillMaxWidth(),
        textStyle = LocalTextStyle.current.copy(color = Color.White, fontWeight = FontWeight.SemiBold),
        colors = compactFieldColors(),
    )
}

@Composable
private fun CompactPasswordField(value: String, onValue: (String) -> Unit, onDone: () -> Unit) {
    var visible by remember { mutableStateOf(false) }
    val strings = LocalStrings.current
    OutlinedTextField(
        value = value,
        onValueChange = onValue,
        label = { Text(strings.login.fieldPassword) },
        leadingIcon = { Icon(Icons.Rounded.Lock, null) },
        trailingIcon = {
            IconButton(onClick = { visible = !visible }) {
                Icon(
                    if (visible) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility,
                    contentDescription = if (visible) strings.loginHidePassword else strings.loginShowPassword,
                )
            }
        },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
        keyboardActions = KeyboardActions(onDone = { onDone() }),
        visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation(),
        modifier = Modifier.fillMaxWidth(),
        textStyle = LocalTextStyle.current.copy(color = Color.White, fontWeight = FontWeight.SemiBold),
        colors = compactFieldColors(),
    )
}

@Preview(name = "Login TV 960x540 (typical Android TV)", device = "spec:width=960dp,height=540dp,dpi=320", showBackground = true)
@Composable
private fun LoginScreenPreviewTv() {
    MoTheme {
        LoginScreen(
            loading = null,
            error = null,
            activationSession = null,
            onM3u = { _, _, _ -> },
            onM3uFile = { _, _, _ -> },
            onXtream = { _, _, _, _ -> },
            onRefreshQr = {},
            onResumeQr = {},
            onStopQr = {},
        )
    }
}

@Preview(name = "Login TV 1080p", device = "spec:width=1920dp,height=1080dp,dpi=320", showBackground = true)
@Composable
private fun LoginScreenPreview1080() {
    MoTheme {
        LoginScreen(
            loading = LoadProgress("Loading", 62, 100),
            error = null,
            activationSession = null,
            onM3u = { _, _, _ -> },
            onM3uFile = { _, _, _ -> },
            onXtream = { _, _, _, _ -> },
            onRefreshQr = {},
            onResumeQr = {},
            onStopQr = {},
        )
    }
}
