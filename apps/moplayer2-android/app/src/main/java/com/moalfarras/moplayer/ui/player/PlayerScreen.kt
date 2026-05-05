package com.moalfarras.moplayer.ui.player

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import androidx.activity.compose.BackHandler
import androidx.annotation.OptIn
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Audiotrack
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Forward10
import androidx.compose.material.icons.rounded.Forward30
import androidx.compose.material.icons.rounded.HighQuality
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Replay
import androidx.compose.material.icons.rounded.Replay10
import androidx.compose.material.icons.rounded.SkipNext
import androidx.compose.material.icons.rounded.SkipPrevious
import androidx.compose.material.icons.rounded.Subtitles
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.components.FocusGlow
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.ParserException
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.HttpDataSource
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.media3.exoplayer.upstream.DefaultLoadErrorHandlingPolicy
import androidx.media3.exoplayer.upstream.LoadErrorHandlingPolicy
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import androidx.media3.ui.TrackSelectionDialogBuilder
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem as AppMediaItem
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.NeonCyan
import kotlinx.coroutines.delay
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.Locale
import java.util.concurrent.TimeUnit

private const val APP_USER_AGENT = "MoPlayer2/1.0 (Media3 IPTV)"

@OptIn(UnstableApi::class)
@Composable
fun PlayerScreen(
    item: AppMediaItem,
    onBack: (positionMs: Long, durationMs: Long) -> Unit,
    onProgress: (item: AppMediaItem, positionMs: Long, durationMs: Long) -> Unit,
    relatedItems: List<AppMediaItem>,
    onPlayItem: (AppMediaItem) -> Unit,
    onTripleOk: () -> Unit,
    accent: Color,
    preferredPlayer: String = "media3",
) {
    val context = LocalContext.current
    val isLive = item.type == ContentType.LIVE
    val streamRequest = remember(item.streamUrl) { parseStreamRequest(item.streamUrl) }
    val normalizedPreferred = remember(preferredPlayer) {
        when (preferredPlayer) {
            "internal" -> "media3"
            else -> preferredPlayer.ifBlank { "media3" }
        }
    }

    var route by remember(item.id, normalizedPreferred) {
        mutableStateOf(if (normalizedPreferred == "ask" && !isLive) null else if (normalizedPreferred == "ask") "media3" else normalizedPreferred)
    }
    var launchMessage by remember(item.id) { mutableStateOf<String?>(null) }
    var externalLaunchNonce by remember(item.id) { mutableIntStateOf(0) }
    var isPlaying by remember { mutableStateOf(true) }
    var currentPosition by remember { mutableLongStateOf(item.watchPositionMs.coerceAtLeast(0)) }
    var duration by remember { mutableLongStateOf(item.watchDurationMs.coerceAtLeast(1L)) }
    var showControls by remember { mutableStateOf(true) }
    var isBuffering by remember { mutableStateOf(true) }
    var playbackError by remember { mutableStateOf<String?>(null) }
    var lastInteraction by remember { mutableLongStateOf(System.currentTimeMillis()) }
    var seekJump by remember { mutableIntStateOf(0) }
    var resizeIndex by remember { mutableIntStateOf(0) }

    val resizeModes = listOf(
        AspectRatioFrameLayout.RESIZE_MODE_FIT,
        AspectRatioFrameLayout.RESIZE_MODE_FILL,
        AspectRatioFrameLayout.RESIZE_MODE_ZOOM,
    )

    LaunchedEffect(item.id, route, externalLaunchNonce) {
        launchMessage = null
        val resolvedRoute = route ?: return@LaunchedEffect
        if (resolvedRoute == "media3") return@LaunchedEffect
        val externalResult = openExternalPlayer(context, streamRequest, item.title, resolvedRoute)
        if (externalResult.success) {
            onBack(0, 0)
        } else {
            launchMessage = externalResult.message
        }
    }

    if (route == null) {
        PlayerRoutePicker(
            title = item.title,
            onSelect = { route = it },
            onDismiss = { onBack(0, 0) },
        )
        return
    }

    if (route != "media3") {
        ExternalLaunchScreen(
            title = item.title,
            message = launchMessage ?: "جاري فتح المشغل الخارجي...",
            onRetrySame = {
                launchMessage = null
                externalLaunchNonce++
            },
            onUseMedia3 = {
                launchMessage = null
                route = "media3"
            },
            onPickAnother = { route = null },
            onBack = { onBack(0, 0) },
        )
        return
    }

    val exoPlayer = remember(item.id, streamRequest.uri) {
        buildPlayer(
            context = context,
            request = streamRequest,
            item = item,
            isLive = isLive,
            onIsPlayingChanged = { isPlaying = it },
            onPlaybackStateChanged = { state ->
                isBuffering = state == Player.STATE_BUFFERING || state == Player.STATE_IDLE
                if (state == Player.STATE_READY) playbackError = null
            },
            onPlayerError = { error ->
                playbackError = explainPlaybackError(context, error, streamRequest.uri, isLive)
            },
            onDurationChanged = { latestDuration ->
                duration = latestDuration.coerceAtLeast(1L)
            },
        )
    }

    DisposableEffect(exoPlayer, item.id) {
        onDispose {
            if (!isLive && exoPlayer.duration > 0) {
                onProgress(item, exoPlayer.currentPosition.coerceAtLeast(0), exoPlayer.duration.coerceAtLeast(0))
            }
            exoPlayer.release()
        }
    }

    LaunchedEffect(exoPlayer, item.id) {
        while (true) {
            currentPosition = exoPlayer.currentPosition.coerceAtLeast(0)
            duration = exoPlayer.duration.coerceAtLeast(duration)
            if (showControls && isPlaying && System.currentTimeMillis() - lastInteraction > if (isLive) 3200 else 5000) {
                showControls = false
            }
            delay(400)
        }
    }

    LaunchedEffect(exoPlayer, item.id) {
        while (true) {
            if (!isLive && exoPlayer.duration > 0 && exoPlayer.currentPosition > 0) {
                onProgress(item, exoPlayer.currentPosition, exoPlayer.duration)
            }
            delay(12_000)
        }
    }

    LaunchedEffect(seekJump) {
        if (seekJump != 0) {
            delay(900)
            seekJump = 0
        }
    }

    fun wakeControls() {
        showControls = true
        lastInteraction = System.currentTimeMillis()
    }

    fun retryPlayback() {
        playbackError = null
        launchMessage = null
        isBuffering = true
        exoPlayer.stop()
        exoPlayer.setMediaItem(buildPlayableMediaItem(streamRequest, item, isLive), if (isLive) C.TIME_UNSET else item.watchPositionMs.coerceAtLeast(0))
        exoPlayer.prepare()
        exoPlayer.playWhenReady = true
    }

    fun switchTo(target: AppMediaItem?) {
        if (target == null || target.id == item.id) return
        if (!isLive && exoPlayer.duration > 0) {
            onProgress(item, exoPlayer.currentPosition, exoPlayer.duration)
        }
        onPlayItem(target)
    }

    BackHandler {
        onBack(exoPlayer.currentPosition, exoPlayer.duration.coerceAtLeast(0))
    }

    val currentIndex = remember(item.id, relatedItems) { relatedItems.indexOfFirst { it.id == item.id && it.type == item.type } }
    val previousItem = if (currentIndex > 0) relatedItems.getOrNull(currentIndex - 1) else null
    val nextItem = if (currentIndex >= 0) relatedItems.getOrNull(currentIndex + 1) else null

    Box(
        Modifier
            .fillMaxSize()
            .background(Color.Black)
            .focusable()
            .onPreviewKeyEvent { event ->
                if (event.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                wakeControls()
                when (event.key) {
                    Key.DirectionLeft -> {
                        if (!isLive) {
                            exoPlayer.seekBack()
                            seekJump = -10
                        }
                        true
                    }
                    Key.DirectionRight -> {
                        if (!isLive) {
                            exoPlayer.seekForward()
                            seekJump = 10
                        }
                        true
                    }
                    Key.DirectionUp -> {
                        if (isLive) switchTo(previousItem) else {
                            exoPlayer.seekTo((exoPlayer.currentPosition + 60_000).coerceAtMost(exoPlayer.duration.coerceAtLeast(0)))
                            seekJump = 60
                        }
                        true
                    }
                    Key.DirectionDown -> {
                        if (isLive) switchTo(nextItem) else {
                            exoPlayer.seekTo((exoPlayer.currentPosition - 60_000).coerceAtLeast(0))
                            seekJump = -60
                        }
                        true
                    }
                    Key.Back, Key.Escape -> {
                        onBack(exoPlayer.currentPosition, exoPlayer.duration.coerceAtLeast(0))
                        true
                    }
                    Key.Enter, Key.DirectionCenter, Key.Spacebar, Key.MediaPlayPause -> {
                        if (isLive) {
                            showControls = !showControls
                            lastInteraction = System.currentTimeMillis()
                        } else {
                            if (exoPlayer.isPlaying) exoPlayer.pause() else exoPlayer.play()
                        }
                        true
                    }
                    else -> false
                }
            },
    ) {
        AndroidView(
            factory = {
                PlayerView(it).apply {
                    player = exoPlayer
                    useController = false
                    resizeMode = resizeModes[resizeIndex]
                    keepScreenOn = true
                }
            },
            update = { it.resizeMode = resizeModes[resizeIndex] },
            modifier = Modifier.fillMaxSize(),
        )

        if (isBuffering && playbackError == null) {
            OverlayCard(modifier = Modifier.align(Alignment.Center)) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    CircularProgressIndicator(color = accent, modifier = Modifier.size(30.dp), strokeWidth = 3.dp)
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            if (isLive) "جاري فتح القناة..." else "جاري تجهيز الفيديو...",
                            color = Color.White,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            if (isLive) "تم تفعيل إعادة المحاولة السريعة للبث الحي." else "سيتم استئناف المشاهدة من آخر نقطة متاحة.",
                            color = Color(0xCCE3BC78),
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
            }
        }

        playbackError?.let { message ->
            Box(
                Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color(0x99010308), Color(0xDD010308)),
                        ),
                    ),
                contentAlignment = Alignment.Center,
            ) {
                OverlayCard(modifier = Modifier.padding(24.dp)) {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(Icons.Rounded.Warning, null, tint = Color(0xFFFFD166), modifier = Modifier.size(34.dp))
                            Column {
                                Text("تعذر تشغيل البث", color = Color.White, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
                                Text(item.title, color = Color(0xCCE3BC78), style = MaterialTheme.typography.bodyMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                        }
                        Text(message, color = Color(0xFFF5E6D0), style = MaterialTheme.typography.bodyLarge)
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Button(
                                onClick = ::retryPlayback,
                                colors = ButtonDefaults.buttonColors(containerColor = accent),
                            ) {
                                Icon(Icons.Rounded.Refresh, null, tint = Color.Black)
                                Spacer(Modifier.width(8.dp))
                                Text("إعادة المحاولة", color = Color.Black)
                            }
                            OutlinedButton(onClick = { route = "vlc" }) { Text("فتح في VLC") }
                            OutlinedButton(onClick = { route = "mx" }) { Text("فتح في MX") }
                            OutlinedButton(onClick = { route = "external" }) { Text("مشغل خارجي") }
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedButton(onClick = { route = null }) { Text("اختيار مشغل") }
                            OutlinedButton(onClick = { onBack(exoPlayer.currentPosition, exoPlayer.duration.coerceAtLeast(0)) }) { Text("رجوع") }
                        }
                    }
                }
            }
        }

        AnimatedVisibility(
            visible = showControls,
            enter = fadeIn(tween(300)),
            exit = fadeOut(tween(500)),
            modifier = Modifier.fillMaxSize(),
        ) {
            Box(Modifier.fillMaxSize()) {
                // Dim Overlay
                Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.35f)))

                // Top Info Bar
                Box(
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .fillMaxWidth()
                        .padding(28.dp)
                ) {
                    GlassPanel(radius = 20.dp, blur = 16.dp, modifier = Modifier.fillMaxWidth()) {
                        Column(
                            Modifier.padding(horizontal = 24.dp, vertical = 18.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Text(item.title, color = Color.White, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold)
                            Text(
                                when {
                                    isLive -> "بث مباشر سريع • استقرار عالي"
                                    item.watchPositionMs > 30_000 -> "جاري الاستكمال من آخر نقطة مشاهدة"
                                    else -> "تشغيل بجودة عالية • Media3"
                                },
                                color = accent.copy(alpha = 0.9f),
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                        }
                    }
                }

                // Bottom Controls
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .fillMaxWidth()
                        .padding(28.dp)
                ) {
                    GlassPanel(radius = 24.dp, blur = 20.dp, modifier = Modifier.fillMaxWidth()) {
                        Column(
                            Modifier.padding(horizontal = 24.dp, vertical = 20.dp),
                            verticalArrangement = Arrangement.spacedBy(18.dp),
                        ) {
                            if (!isLive) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                                    Text(formatTime(currentPosition), color = Color.White, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                                    Slider(
                                        value = if (duration > 0) (currentPosition.toFloat() / duration.toFloat()).coerceIn(0f, 1f) else 0f,
                                        onValueChange = { pct ->
                                            wakeControls()
                                            val newPosition = (pct * duration).toLong()
                                            exoPlayer.seekTo(newPosition)
                                            currentPosition = newPosition
                                        },
                                        modifier = Modifier.weight(1f),
                                        colors = SliderDefaults.colors(
                                            thumbColor = accent,
                                            activeTrackColor = accent,
                                            inactiveTrackColor = Color(0x33FFFFFF),
                                        ),
                                    )
                                    Text(formatTime(duration), color = Color(0xAAFFFFFF), style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                if (isLive && previousItem != null) {
                                    ControlButton(Icons.Rounded.SkipPrevious, "السابق", accent) { switchTo(previousItem) }
                                    Spacer(Modifier.width(12.dp))
                                } else if (!isLive) {
                                    ControlButton(Icons.Rounded.Replay10, "-10", accent) {
                                        exoPlayer.seekBack()
                                        seekJump = -10
                                        wakeControls()
                                    }
                                    Spacer(Modifier.width(12.dp))
                                    ControlButton(Icons.Rounded.Replay, "-60", accent) {
                                        exoPlayer.seekTo((exoPlayer.currentPosition - 60_000).coerceAtLeast(0))
                                        seekJump = -60
                                        wakeControls()
                                    }
                                    Spacer(Modifier.width(12.dp))
                                }

                                Button(
                                    onClick = {
                                        if (exoPlayer.isPlaying) exoPlayer.pause() else exoPlayer.play()
                                        wakeControls()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = accent),
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier.height(52.dp)
                                ) {
                                    Icon(if (isPlaying) Icons.Rounded.Pause else Icons.Rounded.PlayArrow, null, tint = Color.Black, modifier = Modifier.size(28.dp))
                                    Spacer(Modifier.width(10.dp))
                                    Text(if (isPlaying) "إيقاف مؤقت" else "تشغيل", color = Color.Black, fontWeight = FontWeight.ExtraBold)
                                }

                                Spacer(Modifier.width(12.dp))
                                Button(
                                    onClick = {
                                        onTripleOk()
                                        wakeControls()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0x26FFFFFF)),
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier.height(52.dp)
                                ) {
                                    Icon(Icons.Rounded.Favorite, null, tint = if (item.isFavorite) accent else Color.White)
                                    Spacer(Modifier.width(10.dp))
                                    Text("مفضلة", color = Color.White, fontWeight = FontWeight.Bold)
                                }

                                if (isLive && nextItem != null) {
                                    Spacer(Modifier.width(12.dp))
                                    ControlButton(Icons.Rounded.SkipNext, "التالي", accent) { switchTo(nextItem) }
                                } else if (!isLive) {
                                    Spacer(Modifier.width(12.dp))
                                    ControlButton(Icons.Rounded.Forward10, "+10", accent) {
                                        exoPlayer.seekForward()
                                        seekJump = 10
                                        wakeControls()
                                    }
                                    Spacer(Modifier.width(12.dp))
                                    ControlButton(Icons.Rounded.Forward30, "+60", accent) {
                                        exoPlayer.seekTo((exoPlayer.currentPosition + 60_000).coerceAtMost(duration))
                                        seekJump = 60
                                        wakeControls()
                                    }
                                }
                            }

                            HorizontalDivider(color = Color(0x1AFFFFFF), thickness = 1.dp)

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Row(horizontalArrangement = Arrangement.spacedBy((12 * 1).dp)) {
                                    SmallControlButton(Icons.Rounded.Refresh, accent, ::retryPlayback)
                                    SmallControlButton(Icons.Rounded.Audiotrack, accent) {
                                        TrackSelectionDialogBuilder(context, "الصوت", exoPlayer, C.TRACK_TYPE_AUDIO).build().show()
                                    }
                                    SmallControlButton(Icons.Rounded.Subtitles, accent) {
                                        TrackSelectionDialogBuilder(context, "الترجمة", exoPlayer, C.TRACK_TYPE_TEXT).build().show()
                                    }
                                    SmallControlButton(Icons.Rounded.HighQuality, accent) {
                                        TrackSelectionDialogBuilder(context, "الجودة", exoPlayer, C.TRACK_TYPE_VIDEO).build().show()
                                    }
                                    SmallControlButton(Icons.Rounded.Tune, accent) {
                                        resizeIndex = (resizeIndex + 1) % resizeModes.size
                                    }
                                    SmallControlButton(Icons.AutoMirrored.Rounded.OpenInNew, accent) { route = null }
                                }
                                Text(
                                    if (isLive) "اعلى/اسفل: تبديل قناة  |  العودة: خروج" else "يسار/يمين: 10 ثوان  |  اعلى/اسفل: 60 ثانية",
                                    color = Color(0x88FFFFFF),
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }
        }

        AnimatedVisibility(
            visible = seekJump != 0,
            enter = fadeIn(tween(120)),
            exit = fadeOut(tween(360)),
            modifier = Modifier.align(Alignment.Center),
        ) {
            OverlayCard {
                Text(
                    text = "${if (seekJump > 0) "+" else ""}$seekJump ث",
                    color = Color.White,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.ExtraBold,
                )
            }
        }
    }
}

@Composable
private fun PlayerRoutePicker(
    title: String,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    val visuals = LocalMoVisuals.current
    Dialog(onDismissRequest = onDismiss) {
        GlassPanel(
            modifier = Modifier.fillMaxWidth(),
            radius = 26.dp,
            highlighted = true,
            glow = visuals.glow,
        ) {
            Column(
                Modifier.padding(horizontal = 22.dp, vertical = 20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text(
                    "اختيار المشغّل",
                    color = Color.White,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    title,
                    color = Color(0xCCE3BC78),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    style = MaterialTheme.typography.bodyMedium,
                )
                Text(
                    "اختر Media3 أو مشغّلاً خارجياً قبل بدء التشغيل.",
                    color = Color(0x99FFFFFF),
                    style = MaterialTheme.typography.bodySmall,
                )
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Button(
                        onClick = { onSelect("media3") },
                        colors = ButtonDefaults.buttonColors(containerColor = visuals.accent, contentColor = Color.Black),
                        modifier = Modifier.weight(1f),
                    ) {
                        Text("Media3")
                    }
                    OutlinedButton(onClick = { onSelect("vlc") }, modifier = Modifier.weight(1f)) {
                        Text("VLC")
                    }
                }
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    OutlinedButton(onClick = { onSelect("mx") }, modifier = Modifier.weight(1f)) {
                        Text("MX")
                    }
                    OutlinedButton(onClick = { onSelect("external") }, modifier = Modifier.weight(1f)) {
                        Text("عام")
                    }
                }
                OutlinedButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                    Text("إلغاء")
                }
            }
        }
    }
}

@Composable
private fun ExternalLaunchScreen(
    title: String,
    message: String,
    onRetrySame: () -> Unit,
    onUseMedia3: () -> Unit,
    onPickAnother: () -> Unit,
    onBack: () -> Unit,
) {
    Box(
        Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF010408), Color(0xFF070F1C)),
                ),
            ),
        contentAlignment = Alignment.Center,
    ) {
        OverlayCard(modifier = Modifier.padding(24.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text(title, color = Color.White, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
                Text(message, color = Color(0xCCE3BC78), style = MaterialTheme.typography.bodyLarge)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(onClick = onRetrySame) { Text("إعادة المحاولة") }
                    OutlinedButton(onClick = onUseMedia3) { Text("استخدام Media3") }
                    OutlinedButton(onClick = onPickAnother) { Text("اختيار آخر") }
                    OutlinedButton(onClick = onBack) { Text("رجوع") }
                }
            }
        }
    }
}

@Composable
private fun ControlButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    accent: Color,
    onClick: () -> Unit,
) {
    FocusGlow(
        cornerRadius = 18.dp,
        onClick = onClick,
        modifier = Modifier.clip(RoundedCornerShape(18.dp)),
    ) {
        GlassPanel(
            radius = 18.dp,
            blur = 10.dp,
            highlighted = false,
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(icon, null, tint = accent, modifier = Modifier.size(22.dp))
                Text(label, color = Color.White, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun SmallControlButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    accent: Color,
    onClick: () -> Unit,
) {
    FocusGlow(
        cornerRadius = 14.dp,
        onClick = onClick,
        modifier = Modifier.size(48.dp).clip(RoundedCornerShape(14.dp)),
    ) {
        GlassPanel(
            radius = 14.dp,
            blur = 8.dp,
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = accent, modifier = Modifier.size(20.dp))
        }
    }
}

@Composable
private fun OverlayCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    GlassPanel(modifier = modifier, radius = 28.dp) {
        Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 20.dp), content = content)
    }
}

@OptIn(UnstableApi::class)
private fun buildPlayer(
    context: Context,
    request: StreamRequest,
    item: AppMediaItem,
    isLive: Boolean,
    onIsPlayingChanged: (Boolean) -> Unit,
    onPlaybackStateChanged: (Int) -> Unit,
    onPlayerError: (PlaybackException) -> Unit,
    onDurationChanged: (Long) -> Unit,
): ExoPlayer {
    val isRtsp = request.uri.startsWith("rtsp://", ignoreCase = true)
    val liveLoadControl = DefaultLoadControl.Builder()
        .setBufferDurationsMs(2_500, 10_000, 700, 1_500)
        .setPrioritizeTimeOverSizeThresholds(true)
        .build()
    val vodLoadControl = DefaultLoadControl.Builder()
        .setBufferDurationsMs(15_000, 45_000, 2_000, 5_000)
        .setPrioritizeTimeOverSizeThresholds(true)
        .build()
    val requestHeaders = request.headers.filterKeys { !it.equals("User-Agent", ignoreCase = true) }
    val httpFactory = DefaultHttpDataSource.Factory()
        .setUserAgent(request.headers["User-Agent"] ?: APP_USER_AGENT)
        .setAllowCrossProtocolRedirects(true)
        .setConnectTimeoutMs(if (isLive) 6_000 else 12_000)
        .setReadTimeoutMs(if (isLive) 15_000 else 30_000)
        .setDefaultRequestProperties(requestHeaders)
    val mediaSourceFactory = if (isRtsp) {
        DefaultMediaSourceFactory(context)
    } else {
        DefaultMediaSourceFactory(httpFactory)
    }
    val trackSelector = DefaultTrackSelector(context)
    val errorHandlingPolicy = object : DefaultLoadErrorHandlingPolicy() {
        override fun getRetryDelayMsFor(loadErrorInfo: LoadErrorHandlingPolicy.LoadErrorInfo): Long {
            val attempt = loadErrorInfo.errorCount.coerceAtLeast(1)
            return if (isLive) (attempt * 1_200L).coerceAtMost(4_000L) else (attempt * 2_000L).coerceAtMost(8_000L)
        }

        override fun getMinimumLoadableRetryCount(dataType: Int): Int = if (isLive) 6 else 4
    }

    return ExoPlayer.Builder(context)
        .setTrackSelector(trackSelector)
        .setLoadControl(if (isLive) liveLoadControl else vodLoadControl)
        .setMediaSourceFactory(mediaSourceFactory.setLoadErrorHandlingPolicy(errorHandlingPolicy))
        .setSeekForwardIncrementMs(10_000)
        .setSeekBackIncrementMs(10_000)
        .build()
        .apply {
            val mediaItem = buildPlayableMediaItem(request, item, isLive)
            setMediaItem(mediaItem, if (isLive) C.TIME_UNSET else item.watchPositionMs.coerceAtLeast(0))
            playWhenReady = true
            prepare()
            addListener(object : Player.Listener {
                override fun onIsPlayingChanged(isPlaying: Boolean) = onIsPlayingChanged(isPlaying)

                override fun onPlaybackStateChanged(playbackState: Int) {
                    onPlaybackStateChanged(playbackState)
                    if (this@apply.duration > 0) onDurationChanged(this@apply.duration)
                }

                override fun onPlayerError(error: PlaybackException) = onPlayerError(error)

                override fun onEvents(player: Player, events: Player.Events) {
                    if (events.contains(Player.EVENT_TIMELINE_CHANGED) || events.contains(Player.EVENT_TRACKS_CHANGED)) {
                        onDurationChanged(player.duration.coerceAtLeast(1L))
                    }
                }
            })
        }
}

private fun buildPlayableMediaItem(request: StreamRequest, item: AppMediaItem, isLive: Boolean): MediaItem {
    val liveConfiguration = if (isLive) {
        MediaItem.LiveConfiguration.Builder()
            .setTargetOffsetMs(2_500)
            .setMinPlaybackSpeed(0.97f)
            .setMaxPlaybackSpeed(1.03f)
            .build()
    } else {
        null
    }
    return MediaItem.Builder()
        .setUri(request.uri)
        .setMimeType(request.mimeType)
        .setMediaId(item.id)
        .setTag(item.title)
        .apply {
            if (liveConfiguration != null) setLiveConfiguration(liveConfiguration)
        }
        .build()
}

private data class StreamRequest(
    val uri: String,
    val headers: Map<String, String>,
    val mimeType: String?,
)

private data class ExternalLaunchResult(
    val success: Boolean,
    val message: String,
)

private fun parseStreamRequest(rawUrl: String): StreamRequest {
    val parts = rawUrl.split("|", limit = 2)
    val cleanUrl = parts.first().trim()
    val headers = linkedMapOf<String, String>()
    if (parts.size > 1) {
        parts[1]
            .split("&")
            .mapNotNull { token ->
                val pair = token.split("=", limit = 2)
                if (pair.size == 2) {
                    decodeHeader(pair[0]) to decodeHeader(pair[1])
                } else {
                    null
                }
            }
            .forEach { (key, value) -> headers[key] = value }
    }
    val mimeType = inferMimeType(cleanUrl)
    return StreamRequest(
        uri = cleanUrl,
        headers = headers.ifEmpty { emptyMap() },
        mimeType = mimeType,
    )
}

private fun decodeHeader(value: String): String = runCatching {
    URLDecoder.decode(value, StandardCharsets.UTF_8.name())
}.getOrDefault(value)

private fun inferMimeType(url: String): String? {
    val normalized = url.lowercase(Locale.US)
    return when {
        normalized.startsWith("rtsp://") -> null
        normalized.contains(".m3u8") -> MimeTypes.APPLICATION_M3U8
        normalized.contains(".mpd") -> MimeTypes.APPLICATION_MPD
        normalized.contains(".ism") || normalized.contains("manifest") -> MimeTypes.APPLICATION_SS
        normalized.contains(".ts") -> MimeTypes.VIDEO_MP2T
        normalized.contains(".mp4") -> MimeTypes.VIDEO_MP4
        normalized.contains(".mkv") -> MimeTypes.VIDEO_MATROSKA
        else -> null
    }
}

private fun explainPlaybackError(
    context: Context,
    error: PlaybackException,
    uri: String,
    isLive: Boolean,
): String {
    val cause = error.cause
    return when {
        !context.hasInternetConnection() -> "لا يوجد اتصال إنترنت متاح حاليًا."
        cause is HttpDataSource.InvalidResponseCodeException && cause.responseCode in 300..399 ->
            "الرابط يعيد تحويلات كثيرة أو غير متوافقة مع البث."
        cause is HttpDataSource.InvalidResponseCodeException && cause.responseCode == 401 ->
            "الخادم رفض الوصول إلى البث. قد يحتاج الرابط إلى صلاحية أو Headers خاصة."
        cause is HttpDataSource.InvalidResponseCodeException && cause.responseCode == 403 ->
            "الخادم منع تشغيل هذا الرابط على المشغل الداخلي."
        cause is HttpDataSource.InvalidResponseCodeException && cause.responseCode == 404 ->
            "الرابط لا يعمل أو لم يعد موجودًا على الخادم."
        cause is SocketTimeoutException ->
            if (isLive) "الخادم بطيء جدًا أو القناة لا تستجيب في الوقت الحالي." else "انتهت مهلة الاتصال أثناء تحميل الفيديو."
        cause is ConnectException -> "تعذر الاتصال بالخادم. تحقق من الرابط أو الشبكة."
        cause is ParserException -> "صيغة البث غير مدعومة أو بيانات البث تالفة."
        error.errorCode == PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS -> "الخادم أعاد استجابة غير صالحة لهذا البث."
        error.errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED -> "فشل الاتصال بخادم البث."
        error.errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT -> "انتهت مهلة الاتصال بخادم البث."
        error.errorCode == PlaybackException.ERROR_CODE_PARSING_CONTAINER_MALFORMED -> "ملف الوسائط أو الحاوية غير مدعومين بشكل صحيح."
        else -> "تعذر تشغيل الرابط الحالي داخل Media3. جرّب إعادة المحاولة أو فتحه في VLC أو MX Player. (${uri.safeStreamLabel()})"
    }
}

private fun String.safeStreamLabel(): String {
    val withoutQuery = substringBefore('?')
        .replace(Regex("username=[^&\\s/]+"), "username=***")
        .replace(Regex("password=[^&\\s/]+"), "password=***")
        .replace(Regex("""/(live|movie|series)/([^/]+)/([^/]+)/""", RegexOption.IGNORE_CASE), "/$1/***/***/")
    return withoutQuery.takeLast(48)
}

private fun openExternalPlayer(
    context: Context,
    request: StreamRequest,
    title: String,
    route: String,
): ExternalLaunchResult {
    val packageNames = when (route) {
        "vlc" -> listOf("org.videolan.vlc")
        "mx" -> listOf("com.mxtech.videoplayer.ad", "com.mxtech.videoplayer.pro")
        "external" -> emptyList()
        else -> emptyList()
    }
    val baseIntent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(Uri.parse(request.uri), "video/*")
        putExtra("title", title)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        request.headers.forEach { (key, value) -> putExtra(key, value) }
    }

    if (route == "external") {
        val chooser = Intent.createChooser(baseIntent, "اختر مشغل فيديو")
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return try {
            context.startActivity(chooser)
            ExternalLaunchResult(true, "تم فتح المشغل الخارجي.")
        } catch (_: ActivityNotFoundException) {
            ExternalLaunchResult(false, "لا يوجد أي مشغل فيديو خارجي مثبت على الجهاز.")
        }
    }

    packageNames.forEach { packageName ->
        try {
            context.packageManager.getPackageInfo(packageName, 0)
            context.startActivity(Intent(baseIntent).setPackage(packageName))
            return ExternalLaunchResult(true, "تم فتح $title في المشغل الخارجي.")
        } catch (_: Exception) {
        }
    }

    return ExternalLaunchResult(
        success = false,
        message = when (route) {
            "vlc" -> "تطبيق VLC غير مثبت. يمكنك تثبيته أو استخدام Media3 أو مشغل خارجي آخر."
            "mx" -> "تطبيق MX Player غير مثبت. يمكنك تثبيته أو استخدام Media3 أو مشغل خارجي آخر."
            else -> "تعذر فتح المشغل الخارجي المطلوب."
        },
    )
}

private fun Context.hasInternetConnection(): Boolean {
    val manager = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return true
    val network = manager.activeNetwork ?: return false
    val capabilities = manager.getNetworkCapabilities(network) ?: return false
    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
}

private fun formatTime(ms: Long): String {
    if (ms <= 0) return "00:00"
    val hours = TimeUnit.MILLISECONDS.toHours(ms)
    val minutes = TimeUnit.MILLISECONDS.toMinutes(ms) % 60
    val seconds = TimeUnit.MILLISECONDS.toSeconds(ms) % 60
    return if (hours > 0) {
        String.format(Locale.US, "%02d:%02d:%02d", hours, minutes, seconds)
    } else {
        String.format(Locale.US, "%02d:%02d", minutes, seconds)
    }
}
