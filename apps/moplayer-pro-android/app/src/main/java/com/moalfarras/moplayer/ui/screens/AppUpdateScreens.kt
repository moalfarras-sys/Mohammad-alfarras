package com.moalfarras.moplayer.ui.screens

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.animateScrollBy
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Build
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.CloudOff
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.InstallMobile
import androidx.compose.material.icons.rounded.PowerSettingsNew
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Security
import androidx.compose.material.icons.rounded.SystemUpdateAlt
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import com.google.zxing.qrcode.encoder.Encoder
import com.moalfarras.moplayer.core.AppGraph
import com.moalfarras.moplayer.core.UpdateAction
import com.moalfarras.moplayer.core.UpdateManager
import com.moalfarras.moplayer.core.UpdateState
import com.moalfarras.moplayer.core.primaryUpdateAction
import com.moalfarras.moplayer.data.repository.AppBlock
import com.moalfarras.moplayer.data.repository.AppBlockReason
import com.moalfarras.moplayer.data.repository.AppUpdateInfo
import com.moalfarras.moplayer.data.repository.BlockRecheck
import com.moalfarras.moplayer.data.repository.InstallSettingsTarget
import com.moalfarras.moplayer.ui.components.FocusGlow
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.components.readableSp
import com.moalfarras.moplayer.ui.i18n.BUILT_IN_LICENSE_LIST
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.SettingsStrings
import com.moalfarras.moplayer.ui.i18n.Strings
import com.moalfarras.moplayer.ui.i18n.UpdateStrings
import com.moalfarras.moplayer.ui.i18n.isolate
import com.moalfarras.moplayer.ui.i18n.ltr
import com.moalfarras.moplayer.ui.i18n.settings
import com.moalfarras.moplayer.ui.i18n.update
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import com.moalfarras.moplayerpro.BuildConfig
import com.moalfarras.moplayerpro.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** How often the admin config is re-read while the app is visible (the view model throttles too). */
private const val CONFIG_POLL_MS = 30 * 60_000L

/** The app-scoped updater, for screens that are not handed one. */
@Composable
fun rememberUpdateManager(): UpdateManager {
    val context = LocalContext.current
    return remember(context) { AppGraph.get(context.applicationContext).updateManager }
}

/**
 * Root effects for remote control and updates: re-reads the admin config whenever the app comes
 * to the foreground and every [CONFIG_POLL_MS] while visible, re-checks the install permission on
 * resume, and starts installer screens only from the resumed activity (Android blocks background
 * activity starts) and never over playback: with [deferInstaller] the confirmation waits until the
 * player closes.
 */
@Composable
fun AppUpdateEffects(manager: UpdateManager, deferInstaller: Boolean, onRefreshConfig: () -> Unit) {
    val lifecycleOwner = LocalLifecycleOwner.current
    val activity = LocalContext.current.findActivity()
    val refresh by rememberUpdatedState(onRefreshConfig)
    val deferred = rememberUpdatedState(deferInstaller)
    LaunchedEffect(lifecycleOwner) {
        lifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
            while (true) {
                refresh()
                delay(CONFIG_POLL_MS)
            }
        }
    }
    if (activity != null) {
        LaunchedEffect(lifecycleOwner, manager, activity) {
            lifecycleOwner.repeatOnLifecycle(Lifecycle.State.RESUMED) {
                manager.onResume()
                combine(manager.pendingUserAction, snapshotFlow { deferred.value }) { action, wait -> action.takeUnless { wait } }
                    .filterNotNull()
                    .collect { manager.launchPendingAction(activity) }
            }
        }
    }
}

/**
 * Full-screen admin block: forced update (with the in-place updater and the Downloader/QR
 * fallback), maintenance or disabled (with Try again). Focus starts on the main button; Back asks
 * whether to exit, so the user is never trapped.
 */
@Composable
fun AppBlockScreen(
    block: AppBlock,
    manager: UpdateManager,
    onRetry: () -> Unit,
    onExit: () -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    val u = strings.update
    val updateState by manager.state.collectAsStateWithLifecycle()
    var showExit by remember { mutableStateOf(false) }
    val primaryFocus = remember { FocusRequester() }
    BackHandler { showExit = !showExit }
    LaunchedEffect(block.reason) {
        delay(150)
        runCatching { primaryFocus.requestFocus() }
    }

    val (icon, title, defaultBody) = when (block.reason) {
        AppBlockReason.FORCE_UPDATE -> Triple(Icons.Rounded.SystemUpdateAlt, u.blockUpdateTitle, u.blockUpdateBody)
        AppBlockReason.MAINTENANCE -> Triple(Icons.Rounded.Build, u.blockMaintenanceTitle, u.blockMaintenanceBody)
        AppBlockReason.DISABLED -> Triple(Icons.Rounded.CloudOff, u.blockDisabledTitle, u.blockDisabledBody)
    }
    val horizontal = if (tv.isTv) 48.dp else 16.dp
    val vertical = if (tv.isTv) 27.dp else 16.dp
    Box(
        Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF14100C), Color(0xFF0A0908))))
            .background(Brush.radialGradient(listOf(visuals.accent.copy(alpha = 0.14f), Color.Transparent)))
            .padding(horizontal = horizontal, vertical = vertical),
        contentAlignment = Alignment.Center,
    ) {
        GlassPanel(
            modifier = Modifier.widthIn(max = if (tv.isTv) 860.dp else 560.dp).fillMaxWidth(),
            radius = 28.dp,
            highlighted = true,
            glow = visuals.accent.copy(alpha = 0.16f),
        ) {
            val content: @Composable () -> Unit = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                        Box(
                            Modifier.size(52.dp).clip(RoundedCornerShape(16.dp)).background(visuals.accent.copy(alpha = 0.16f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(icon, null, tint = visuals.accent, modifier = Modifier.size(30.dp))
                        }
                        Column(Modifier.weight(1f)) {
                            Text(title, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = tv.readableSp(26f, 22f))
                            Image(
                                painter = painterResource(R.drawable.brand_logo_ui),
                                contentDescription = null,
                                modifier = Modifier.padding(top = 4.dp).size(width = 72.dp, height = 22.dp),
                                alignment = Alignment.CenterStart,
                            )
                        }
                    }
                    Text(
                        block.message.ifBlank { defaultBody }.isolate(),
                        color = Color(0xE6FFFFFF),
                        fontSize = tv.readableSp(17f, 16f),
                        lineHeight = tv.readableSp(24f, 22f),
                    )
                    if (block.reason == AppBlockReason.FORCE_UPDATE && block.update != null) {
                        ForcedUpdateBody(block.update, updateState, manager, primaryFocus, onExit)
                    } else {
                        RecheckBody(block, primaryFocus, onRetry, onExit)
                    }
                }
            }
            if (tv.isTv && block.reason == AppBlockReason.FORCE_UPDATE && block.update != null) {
                Row(
                    Modifier.padding(horizontal = 30.dp, vertical = 26.dp),
                    horizontalArrangement = Arrangement.spacedBy(28.dp),
                ) {
                    Box(Modifier.weight(1f).verticalScroll(rememberScrollState())) { content() }
                    UpdateFallbackPanel(block.update, showQr = true, modifier = Modifier.width(250.dp))
                }
            } else {
                Column(
                    Modifier
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 24.dp, vertical = 22.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    content()
                    if (block.reason == AppBlockReason.FORCE_UPDATE && block.update != null) {
                        UpdateFallbackPanel(block.update, showQr = !tv.isCompact, modifier = Modifier.fillMaxWidth())
                    }
                }
            }
        }
    }
    if (showExit) ExitDialog(onDismiss = { showExit = false }, onExit = onExit)
    (updateState as? UpdateState.NeedsPermission)?.let { InstallPermissionDialog(it, manager) }
}

@Composable
private fun ForcedUpdateBody(
    info: AppUpdateInfo,
    state: UpdateState,
    manager: UpdateManager,
    primaryFocus: FocusRequester,
    onExit: () -> Unit,
) {
    val tv = rememberTvScale()
    val u = LocalStrings.current.update
    val s = LocalStrings.current.settings
    val activity = LocalContext.current.findActivity()
    Text(u.versions(info.currentVersionName, info.latestVersionName), color = Color(0xB3FFFFFF), fontSize = tv.readableSp(14f, 13f))
    if (info.releaseNotes.isNotBlank()) {
        Text(u.whatsNew, color = LocalMoVisuals.current.accent, fontWeight = FontWeight.Bold, fontSize = tv.readableSp(14f, 13f))
        Text(
            info.releaseNotes.isolate(),
            color = Color(0xCCFFFFFF),
            fontSize = tv.readableSp(14f, 13f),
            lineHeight = tv.readableSp(20f, 18f),
            maxLines = if (tv.isTv) 3 else 6,
            overflow = TextOverflow.Ellipsis,
        )
    }
    UpdateProgress(state, u, s)
    val action = primaryUpdateAction(state).let { if (it == UpdateAction.CHECK) UpdateAction.DOWNLOAD else it }
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth().focusGroup()) {
        UpdateButton(
            text = updateActionLabel(action, forced = true, strings = LocalStrings.current),
            icon = updateActionIcon(action),
            modifier = Modifier.weight(1.4f),
            enabled = action != UpdateAction.BUSY,
            focusRequester = primaryFocus,
            onClick = { performUpdateAction(action, state, manager, activity) },
        )
        UpdateButton(u.blockExit, Icons.Rounded.PowerSettingsNew, Modifier.weight(1f), primary = false, onClick = onExit)
    }
}

@Composable
private fun RecheckBody(block: AppBlock, primaryFocus: FocusRequester, onRetry: () -> Unit, onExit: () -> Unit) {
    val tv = rememberTvScale()
    val u = LocalStrings.current.update
    val status = when (block.recheck) {
        BlockRecheck.CHECKING -> u.blockChecking
        BlockRecheck.STILL_BLOCKED -> u.blockStillBlocked
        BlockRecheck.UNREACHABLE -> u.blockUnreachable
        BlockRecheck.NONE -> null
    }
    status?.let {
        Text(it, color = LocalMoVisuals.current.accent, fontSize = tv.readableSp(14f, 14f), fontWeight = FontWeight.SemiBold)
    }
    if (block.supportUrl.isNotBlank()) {
        Text(block.supportUrl.removePrefix("https://").ltr(), color = Color(0x99FFFFFF), fontSize = tv.readableSp(13f, 12f))
    }
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth().focusGroup()) {
        UpdateButton(
            text = if (block.recheck == BlockRecheck.CHECKING) u.blockChecking else u.blockTryAgain,
            icon = Icons.Rounded.Refresh,
            modifier = Modifier.weight(1.4f),
            enabled = block.recheck != BlockRecheck.CHECKING,
            focusRequester = primaryFocus,
            onClick = onRetry,
        )
        UpdateButton(u.blockExit, Icons.Rounded.PowerSettingsNew, Modifier.weight(1f), primary = false, onClick = onExit)
    }
}

/**
 * The update panel in Settings > About: status, progress, release notes and the actions. The work
 * runs in the app-scoped [UpdateManager], so leaving Settings never cancels a download.
 */
@Composable
fun AppUpdatePanel(isTv: Boolean) {
    val manager = rememberUpdateManager()
    val state by manager.state.collectAsStateWithLifecycle()
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    val u = strings.update
    val s = strings.settings
    val context = LocalContext.current
    val activity = context.findActivity()
    LaunchedEffect(manager) { manager.check() }
    val info = state.info
    val available = info?.updateAvailable == true
    GlassPanel(radius = 16.dp, highlighted = available, glow = if (available) visuals.accent.copy(alpha = 0.12f) else null) {
        Column(Modifier.fillMaxWidth().padding(if (isTv) 18.dp else 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Rounded.SystemUpdateAlt, null, tint = visuals.accent, modifier = Modifier.size(26.dp))
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(s.updateTitle, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = tv.readableSp(16f, 16f))
                    val versions = info?.let { u.versions(it.currentVersionName, it.latestVersionName) }
                        ?: u.versions(BuildConfig.VERSION_NAME, "—")
                    Text(versions, color = Color(0xB3FFFFFF), fontSize = tv.readableSp(13f, 13f), maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
            }
            UpdateProgress(state, u, s)
            if (info != null && info.updateAvailable) {
                info.apkSizeBytes?.let { Text(s.updateDownloadSize(formatSize(it)), color = Color(0x99FFFFFF), fontSize = tv.readableSp(13f, 12f)) }
                if (info.releaseNotes.isNotBlank()) {
                    Text(
                        info.releaseNotes.isolate(),
                        color = Color(0xB3FFFFFF),
                        fontSize = tv.readableSp(13f, 13f),
                        lineHeight = tv.readableSp(18f, 18f),
                        maxLines = 4,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            lastCheckedAt(state)?.let { checkedAt ->
                Text(u.lastChecked(formatClock(checkedAt)), color = Color(0x80FFFFFF), fontSize = tv.readableSp(12f, 12f))
            }
            val action = primaryUpdateAction(state)
            // The primary button keeps focus in every state: its label and action change instead
            // of it becoming disabled (a disabled control drops D-pad focus).
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth().focusGroup()) {
                UpdateButton(
                    text = updateActionLabel(action, forced = false, strings = strings),
                    icon = updateActionIcon(action),
                    modifier = Modifier.weight(1.3f),
                    enabled = action != UpdateAction.BUSY,
                    onClick = { performUpdateAction(action, state, manager, activity) },
                )
                if (action != UpdateAction.CHECK && action != UpdateAction.BUSY) {
                    UpdateButton(
                        text = s.updateCheck,
                        icon = Icons.Rounded.Refresh,
                        modifier = Modifier.weight(1f),
                        primary = false,
                        enabled = state !is UpdateState.Downloading,
                        onClick = { manager.check(force = true) },
                    )
                }
                val downloadUrl = info?.downloadUrl
                FocusGlow(cornerRadius = 999.dp, onClick = {
                    val opened = downloadUrl != null && activity != null && manager.openDownloadPage(activity, downloadUrl)
                    if (!opened) Toast.makeText(context, u.openDownloadPageFailed, Toast.LENGTH_LONG).show()
                }) {
                    Box(
                        Modifier
                            .size(46.dp)
                            .background(Color(0x331E1914), RoundedCornerShape(999.dp))
                            .border(1.dp, visuals.accent.copy(alpha = 0.45f), RoundedCornerShape(999.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.AutoMirrored.Rounded.OpenInNew, s.updateOpenInBrowser, tint = Color.White, modifier = Modifier.size(22.dp))
                    }
                }
            }
            if (state is UpdateState.Failed && info != null) {
                UpdateFallbackPanel(info, showQr = false, modifier = Modifier.fillMaxWidth())
            }
        }
    }
    (state as? UpdateState.NeedsPermission)?.let { InstallPermissionDialog(it, manager) }
}

@Composable
private fun UpdateProgress(state: UpdateState, u: UpdateStrings, s: SettingsStrings) {
    val tv = rememberTvScale()
    val accent = LocalMoVisuals.current.accent
    val isError = state is UpdateState.Failed || state is UpdateState.CheckFailed
    Text(
        updateStatusText(state, u, s),
        color = if (isError) Color(0xFFFFB4AB) else accent,
        fontSize = tv.readableSp(14f, 14f),
        fontWeight = FontWeight.SemiBold,
    )
    when (state) {
        is UpdateState.Downloading -> {
            val percent = state.percent
            if (percent != null && !state.reconnecting) {
                LinearProgressIndicator(
                    progress = { percent / 100f },
                    modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                    color = accent,
                    trackColor = Color(0x33FFFFFF),
                )
            } else {
                LinearProgressIndicator(Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)), color = accent, trackColor = Color(0x33FFFFFF))
            }
            if (state.totalBytes > 0) {
                Text(
                    u.downloadedOf(formatSize(state.downloadedBytes), formatSize(state.totalBytes)),
                    color = Color(0x99FFFFFF),
                    fontSize = tv.readableSp(12f, 12f),
                )
            }
        }
        is UpdateState.Checking, is UpdateState.Verifying, is UpdateState.Installing ->
            LinearProgressIndicator(Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)), color = accent, trackColor = Color(0x33FFFFFF))
        else -> Unit
    }
}

/** The sentence under the update title for [state]; a failed check is never "up to date". */
internal fun updateStatusText(state: UpdateState, u: UpdateStrings, s: SettingsStrings): String = when (state) {
    UpdateState.Idle -> u.statusIdle
    is UpdateState.Checking -> s.updateChecking
    is UpdateState.UpToDate -> s.updateUpToDate
    is UpdateState.CheckFailed -> u.statusCheckFailed
    is UpdateState.Available -> s.updateAvailable(state.info.latestVersionName)
    is UpdateState.Downloading -> when {
        state.reconnecting -> u.statusReconnecting
        state.percent != null -> s.updateDownloadingPercent(state.percent ?: 0)
        else -> s.updateDownloading
    }
    is UpdateState.Verifying -> u.statusVerifying
    is UpdateState.ReadyToInstall -> if (state.installerOpened) u.statusInstallerOpened else u.statusReady
    is UpdateState.NeedsPermission -> u.statusNeedsPermission
    is UpdateState.Installing -> u.statusInstalling
    is UpdateState.Installed -> u.statusInstalled
    is UpdateState.Failed -> u.error(state.error, state.detail)
}

private fun updateActionLabel(action: UpdateAction, forced: Boolean, strings: Strings): String = when (action) {
    UpdateAction.CHECK -> strings.settings.updateCheck
    UpdateAction.DOWNLOAD -> if (forced) strings.update.updateNow else strings.settings.updateDownloadInstall
    UpdateAction.CANCEL -> strings.update.cancelDownload
    UpdateAction.BUSY -> strings.update.working
    UpdateAction.INSTALL -> strings.update.installNow
    UpdateAction.ALLOW_INSTALLS -> strings.update.allowInstalls
    UpdateAction.RETRY -> strings.retry
}

private fun updateActionIcon(action: UpdateAction): ImageVector = when (action) {
    UpdateAction.CHECK, UpdateAction.RETRY -> Icons.Rounded.Refresh
    UpdateAction.DOWNLOAD -> Icons.Rounded.Download
    UpdateAction.CANCEL -> Icons.Rounded.Close
    UpdateAction.BUSY -> Icons.Rounded.SystemUpdateAlt
    UpdateAction.INSTALL -> Icons.Rounded.InstallMobile
    UpdateAction.ALLOW_INSTALLS -> Icons.Rounded.Security
}

private fun performUpdateAction(action: UpdateAction, state: UpdateState, manager: UpdateManager, activity: Activity?) {
    when (action) {
        UpdateAction.CHECK -> manager.check(force = true)
        UpdateAction.RETRY -> if (state is UpdateState.CheckFailed) manager.check(force = true) else manager.startUpdate()
        UpdateAction.DOWNLOAD, UpdateAction.INSTALL -> manager.startUpdate()
        UpdateAction.CANCEL -> manager.cancelDownload()
        UpdateAction.ALLOW_INSTALLS -> activity?.let(manager::openInstallPermissionSettings)
        UpdateAction.BUSY -> Unit
    }
}

private fun lastCheckedAt(state: UpdateState): Long? = when (state) {
    is UpdateState.UpToDate -> state.checkedAtMs
    is UpdateState.Available -> state.checkedAtMs
    is UpdateState.CheckFailed -> state.lastCheckedAtMs
    else -> null
}?.takeIf { it > 0L }

/** Downloader code and a QR of the APK link, for boxes where the in-app install cannot finish. */
@Composable
private fun UpdateFallbackPanel(info: AppUpdateInfo, showQr: Boolean, modifier: Modifier) {
    val tv = rememberTvScale()
    val u = LocalStrings.current.update
    val visuals = LocalMoVisuals.current
    Column(
        modifier
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0x14FFFFFF))
            .border(1.dp, visuals.line, RoundedCornerShape(18.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(u.otherWaysTitle, color = visuals.accent, fontWeight = FontWeight.Bold, fontSize = tv.readableSp(14f, 14f))
        if (info.downloaderCode.isNotBlank()) {
            Text(
                u.downloaderHint(info.downloaderCode),
                color = Color.White,
                fontSize = tv.readableSp(14f, 14f),
                textAlign = TextAlign.Center,
            )
        }
        if (showQr) {
            QrImage(info.downloadUrl, size = 150.dp)
            Text(u.qrHint, color = Color(0xB3FFFFFF), fontSize = tv.readableSp(12f, 12f), textAlign = TextAlign.Center)
        }
    }
}

@Composable
private fun QrImage(value: String, size: Dp) {
    val targetPx = with(LocalDensity.current) { size.roundToPx() }
    val bitmap by produceState<ImageBitmap?>(initialValue = null, value, targetPx) {
        this.value = withContext(Dispatchers.Default) { runCatching { plainQrBitmap(value, targetPx) }.getOrNull() }
    }
    Box(
        Modifier.size(size).clip(RoundedCornerShape(12.dp)).background(Color.White).padding(6.dp),
        contentAlignment = Alignment.Center,
    ) {
        bitmap?.let { Image(it, contentDescription = null, filterQuality = FilterQuality.None, modifier = Modifier.fillMaxSize()) }
    }
}

/** A plain black-on-white QR code (4-module quiet zone) scaled to whole pixels per module. */
private fun plainQrBitmap(value: String, targetPx: Int): ImageBitmap {
    val matrix = Encoder.encode(value, ErrorCorrectionLevel.M).matrix
    val modules = matrix.width + 8
    val cell = (targetPx / modules).coerceAtLeast(1)
    val sizePx = cell * modules
    val pixels = IntArray(sizePx * sizePx) { android.graphics.Color.WHITE }
    for (y in 0 until matrix.height) {
        for (x in 0 until matrix.width) {
            if (matrix.get(x, y).toInt() != 1) continue
            for (dy in 0 until cell) {
                val row = ((y + 4) * cell + dy) * sizePx
                for (dx in 0 until cell) pixels[row + (x + 4) * cell + dx] = android.graphics.Color.BLACK
            }
        }
    }
    return android.graphics.Bitmap.createBitmap(pixels, sizePx, sizePx, android.graphics.Bitmap.Config.ARGB_8888).asImageBitmap()
}

/** Explains the one-time "install unknown apps" permission, with TV paths when no screen opens. */
@Composable
private fun InstallPermissionDialog(state: UpdateState.NeedsPermission, manager: UpdateManager) {
    val tv = rememberTvScale()
    val u = LocalStrings.current.update
    val strings = LocalStrings.current
    val activity = LocalContext.current.findActivity()
    val openFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) {
        delay(120)
        runCatching { openFocus.requestFocus() }
    }
    Dialog(onDismissRequest = manager::dismissPermission) {
        GlassPanel(
            modifier = Modifier.width(if (tv.isTv) 560.dp else 360.dp),
            radius = 26.dp,
            highlighted = true,
            glow = LocalMoVisuals.current.accent.copy(alpha = 0.2f),
        ) {
            Column(
                Modifier.verticalScroll(rememberScrollState()).padding(26.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Icon(Icons.Rounded.Security, null, tint = LocalMoVisuals.current.accent, modifier = Modifier.size(30.dp))
                    Text(u.permissionTitle, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = tv.readableSp(22f, 20f))
                }
                Text(u.permissionBody, color = Color(0xE6FFFFFF), fontSize = tv.readableSp(15f, 15f), lineHeight = tv.readableSp(21f, 21f))
                val noScreen = state.opened == InstallSettingsTarget.NONE
                Text(
                    if (noScreen) u.permissionNoScreen else u.permissionStepsTitle,
                    color = if (noScreen) Color(0xFFFFB4AB) else LocalMoVisuals.current.accent,
                    fontWeight = FontWeight.Bold,
                    fontSize = tv.readableSp(14f, 14f),
                )
                Text(u.permissionStepsAndroidTv, color = Color(0xCCFFFFFF), fontSize = tv.readableSp(13f, 13f))
                Text(u.permissionStepsFireTv, color = Color(0xCCFFFFFF), fontSize = tv.readableSp(13f, 13f))
                Spacer(Modifier.height(4.dp))
                Row(Modifier.fillMaxWidth().focusGroup(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    UpdateButton(
                        u.permissionOpenSettings,
                        Icons.Rounded.Security,
                        Modifier.weight(1.3f),
                        focusRequester = openFocus,
                        onClick = { activity?.let(manager::openInstallPermissionSettings) },
                    )
                    UpdateButton(strings.cancel, Icons.Rounded.Close, Modifier.weight(1f), primary = false, onClick = manager::dismissPermission)
                }
            }
        }
    }
}

/**
 * Open-source notices: res/raw/third_party_notices.txt when the build ships it, otherwise the
 * built-in summary. Long text is split into paragraphs in a list the remote scrolls with Up/Down.
 */
@Composable
fun LicensesDialog(onDismiss: () -> Unit) {
    val tv = rememberTvScale()
    val u = LocalStrings.current.update
    val context = LocalContext.current
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()
    val listFocus = remember { FocusRequester() }
    var listFocused by remember { mutableStateOf(false) }
    val accent = LocalMoVisuals.current.accent
    val paragraphs by produceState(initialValue = emptyList<String>(), context) {
        value = withContext(Dispatchers.IO) { readThirdPartyNotices(context) }
            ?.split(Regex("\n\\s*\n"))
            ?.map { it.trim() }
            ?.filter { it.isNotEmpty() }
            ?: listOf(u.licensesIntro, BUILT_IN_LICENSE_LIST, u.licensesFooter)
    }
    LaunchedEffect(Unit) {
        delay(120)
        runCatching { listFocus.requestFocus() }
    }
    Dialog(onDismissRequest = onDismiss) {
        GlassPanel(
            modifier = Modifier.width(if (tv.isTv) 640.dp else 360.dp).heightIn(max = if (tv.isTv) 460.dp else 560.dp),
            radius = 24.dp,
            highlighted = true,
        ) {
            Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(u.licensesTitle, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = tv.readableSp(20f, 20f))
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .weight(1f, fill = false)
                        .fillMaxWidth()
                        .border(2.dp, if (listFocused) accent else Color.Transparent, RoundedCornerShape(12.dp))
                        .padding(10.dp)
                        .focusRequester(listFocus)
                        .onFocusChanged { listFocused = it.isFocused }
                        .onPreviewKeyEvent { event ->
                            if (event.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                            val step = when (event.key) {
                                Key.DirectionDown -> 220f
                                Key.DirectionUp -> -220f
                                else -> return@onPreviewKeyEvent false
                            }
                            // Leave the list for the Close button once the end is reached.
                            if (step > 0 && !listState.canScrollForward) return@onPreviewKeyEvent false
                            scope.launch { listState.animateScrollBy(step) }
                            true
                        }
                        .focusable(),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(paragraphs) { paragraph ->
                        // Each paragraph follows its own script: the Arabic intro right-aligned, license lines left.
                        Text(
                            paragraph,
                            color = Color(0xD9FFFFFF),
                            fontSize = tv.readableSp(13f, 13f),
                            lineHeight = tv.readableSp(19f, 18f),
                            style = TextStyle(textDirection = TextDirection.Content),
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
                UpdateButton(u.licensesClose, Icons.Rounded.Close, Modifier.fillMaxWidth(), primary = false, onClick = onDismiss)
            }
        }
    }
}

@SuppressLint("DiscouragedApi") // Optional build asset: looked up by name so builds without it still compile.
private fun readThirdPartyNotices(context: Context): String? {
    val id = context.resources.getIdentifier("third_party_notices", "raw", context.packageName)
    if (id == 0) return null
    return runCatching { context.resources.openRawResource(id).bufferedReader().use { it.readText() } }
        .getOrNull()
        ?.takeIf { it.isNotBlank() }
}

/** FocusGlow button used by the update UI: strong ring on TV, stays focusable while busy. */
@Composable
private fun UpdateButton(
    text: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    primary: Boolean = true,
    enabled: Boolean = true,
    focusRequester: FocusRequester? = null,
    onClick: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    val tv = rememberTvScale()
    val shape = RoundedCornerShape(12.dp)
    val background = if (primary) visuals.accent else Color(0x331E1914)
    val content = if (primary) Color(0xFF1A1208) else Color.White
    FocusGlow(modifier = modifier, cornerRadius = 14.dp, focusRequester = focusRequester, onClick = { if (enabled) onClick() }) {
        Row(
            Modifier
                .fillMaxWidth()
                .heightIn(min = 48.dp)
                .graphicsLayer { alpha = if (enabled) 1f else 0.55f }
                .clip(shape)
                .background(background)
                .border(1.dp, if (primary) Color.Transparent else visuals.accent.copy(alpha = 0.45f), shape)
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(icon, null, tint = content, modifier = Modifier.size(20.dp))
            Text(text, color = content, fontSize = tv.readableSp(15f, 15f), fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

private fun formatSize(bytes: Long): String =
    "%.1f MB".format(Locale.US, bytes / 1024.0 / 1024.0)

private fun formatClock(epochMs: Long): String =
    SimpleDateFormat("HH:mm", Locale.US).format(Date(epochMs))

/** Short Android/RAM line for the About screen. */
internal fun androidVersionLine(u: UpdateStrings): String = u.aboutAndroid(Build.VERSION.RELEASE.orEmpty(), Build.VERSION.SDK_INT)

internal fun Context.findActivity(): Activity? {
    var current: Context? = this
    while (current is ContextWrapper) {
        if (current is Activity) return current
        current = current.baseContext
    }
    return null
}
