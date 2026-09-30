package com.moalfarras.moplayer.ui.player

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.currentStateAsState
import coil3.compose.AsyncImage
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem as AppMediaItem
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.fill
import com.moalfarras.moplayer.ui.i18n.isolate
import com.moalfarras.moplayer.ui.i18n.ltr
import com.moalfarras.moplayer.ui.i18n.player
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first

private const val NEXT_EPISODE_COUNTDOWN_SECONDS = 10

/** The episode after [current] in [episodes] (its series as the library stores it), read once. */
internal suspend fun nextEpisodeFrom(episodes: Flow<List<AppMediaItem>>, current: AppMediaItem): AppMediaItem? =
    nextEpisodeIn(episodes.first(), current)

/**
 * Looks up the episode after [item] when it starts, and while [visible] (the episode ended) offers
 * it with a 10-second countdown: Play now (focused) or Cancel. The countdown only runs while the
 * app is in the foreground, so the next episode never starts in the background.
 */
@Composable
internal fun NextEpisodeOffer(
    item: AppMediaItem,
    ui: PlayerItemUiState,
    visible: Boolean,
    accent: Color,
    lookup: suspend (AppMediaItem) -> AppMediaItem?,
    /** Play now (or the countdown ran out) with the episode, Cancel or Back with null. */
    onAnswer: (next: AppMediaItem?) -> Unit,
) {
    val currentLookup by rememberUpdatedState(lookup)
    LaunchedEffect(ui) {
        if (item.type != ContentType.EPISODE) return@LaunchedEffect
        ui.nextEpisode = try {
            currentLookup(item)
        } catch (error: CancellationException) {
            throw error
        } catch (_: Exception) {
            null
        }
    }
    val next = ui.nextEpisode
    if (visible && next != null) {
        Box(Modifier.fillMaxSize().safeCornerPadding(), contentAlignment = Alignment.BottomEnd) {
            NextEpisodeCard(next, accent, onAnswer)
        }
    }
}

@Composable
private fun NextEpisodeCard(next: AppMediaItem, accent: Color, onAnswer: (next: AppMediaItem?) -> Unit) {
    val strings = LocalStrings.current
    val ps = strings.player
    val lifecycleState by LocalLifecycleOwner.current.lifecycle.currentStateAsState()
    val started = lifecycleState.isAtLeast(Lifecycle.State.STARTED)
    val currentOnAnswer by rememberUpdatedState(onAnswer)
    var secondsLeft by remember(next) { mutableIntStateOf(NEXT_EPISODE_COUNTDOWN_SECONDS) }
    val playFocus = remember { FocusRequester() }
    LaunchedEffect(next) {
        // After the player root took focus from the hidden controls.
        delay(80)
        runCatching { playFocus.requestFocus() }
    }
    LaunchedEffect(next, started) {
        if (!started) return@LaunchedEffect
        while (secondsLeft > 0) {
            delay(1_000)
            secondsLeft -= 1
        }
        currentOnAnswer(next)
    }
    val thumbnail = next.posterUrl.ifBlank { next.backdropUrl }
    val wide = LocalConfiguration.current.screenWidthDp >= 600
    GlassPanel(radius = 22.dp, highlighted = true, glow = accent.copy(alpha = 0.14f), modifier = Modifier.widthIn(max = 580.dp)) {
        Row(
            Modifier.padding(18.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (wide && thumbnail.isNotBlank()) {
                AsyncImage(
                    model = thumbnail,
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(width = 160.dp, height = 90.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0x33111111)),
                )
            }
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(ps.nextEpisode, color = accent, fontSize = 13.sp, fontWeight = FontWeight.ExtraBold)
                Text(
                    listOfNotNull(ps.episodeCodeLabel(next), next.title.isolate()).joinToString(" · "),
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    ps.nextEpisodeCountdown.fill(secondsLeft.toString().ltr()),
                    color = Color(0xCCFFFFFF),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                )
                // Steps once a second (no per-frame animation on weak boxes).
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(Color(0x33FFFFFF)),
                ) {
                    Box(
                        Modifier
                            .fillMaxWidth(1f - secondsLeft / NEXT_EPISODE_COUNTDOWN_SECONDS.toFloat())
                            .height(4.dp)
                            .background(accent),
                    )
                }
                Row(Modifier.padding(top = 4.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    PlayerPillButton(ps.playNow, Icons.Rounded.PlayArrow, primary = true, accent = accent, focusRequester = playFocus) {
                        onAnswer(next)
                    }
                    PlayerPillButton(strings.cancel, Icons.Rounded.Close, primary = false, accent = accent) { onAnswer(null) }
                }
            }
        }
    }
}
