package com.moalfarras.moplayer.ui.player

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.BringIntoViewSpec
import androidx.compose.foundation.gestures.LocalBringIntoViewSpec
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Audiotrack
import androidx.compose.material.icons.rounded.Cast
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Forward10
import androidx.compose.material.icons.rounded.HighQuality
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Radio
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Replay
import androidx.compose.material.icons.rounded.Replay10
import androidx.compose.material.icons.rounded.Subtitles
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material.icons.rounded.UploadFile
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.media3.ui.AspectRatioFrameLayout
import coil3.compose.AsyncImage
import com.moalfarras.moplayer.domain.model.MediaItem as AppMediaItem
import com.moalfarras.moplayer.domain.model.VideoSizeMode
import com.moalfarras.moplayer.ui.components.FocusGlow
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.PlayerStrings
import com.moalfarras.moplayer.ui.i18n.Strings
import com.moalfarras.moplayer.ui.i18n.fill
import com.moalfarras.moplayer.ui.i18n.isolate
import com.moalfarras.moplayer.ui.i18n.ltr
import com.moalfarras.moplayer.ui.i18n.player
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import kotlinx.coroutines.flow.first
import java.util.Locale
import kotlin.math.abs

// Overscan-safe insets for TV (content must stay inside the ~5% title-safe area).
private val SafeHorizontal = 48.dp
private val SafeVertical = 27.dp

internal enum class LiveOverlayTab { CHANNELS, GROUPS, VIDEO_SIZE, AUDIO, SUBTITLES, FAVORITES }

internal val LiveOverlayTabs = LiveOverlayTab.entries

internal fun LiveOverlayTab.label(strings: Strings): String = when (this) {
    LiveOverlayTab.CHANNELS -> strings.player.tabChannels
    LiveOverlayTab.GROUPS -> strings.player.tabGroups
    LiveOverlayTab.VIDEO_SIZE -> strings.player.tabVideoSize
    LiveOverlayTab.AUDIO -> strings.playerAudio
    LiveOverlayTab.SUBTITLES -> strings.playerSubtitles
    LiveOverlayTab.FAVORITES -> strings.navFavorites
}

internal fun VideoSizeMode.toResizeMode(): Int = when (this) {
    VideoSizeMode.AUTO, VideoSizeMode.FIT -> AspectRatioFrameLayout.RESIZE_MODE_FIT
    VideoSizeMode.FILL -> AspectRatioFrameLayout.RESIZE_MODE_FILL
    VideoSizeMode.ZOOM -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
}

internal fun VideoSizeMode.displayLabel(strings: PlayerStrings): String = when (this) {
    VideoSizeMode.AUTO -> strings.sizeAuto
    VideoSizeMode.FIT -> strings.sizeFit
    VideoSizeMode.FILL -> strings.sizeFill
    VideoSizeMode.ZOOM -> strings.sizeZoom
}

/** One entry of a live-overlay tab. The same list drives rendering and the Up/Down/OK key handling. */
internal class LiveOverlayAction(val label: String, val selected: Boolean, val onClick: () -> Unit)

internal class PlayerErrorAction(val label: String, val icon: ImageVector, val primary: Boolean, val onClick: () -> Unit)

internal data class LiveZapCategory(val id: String, val name: String, val count: Int)

internal const val LIVE_ZAP_ALL_CATEGORY_ID = "__all__"
internal const val LIVE_ZAP_UNCATEGORIZED_ID = "__uncategorized__"

internal fun List<AppMediaItem>.toLiveZapCategories(allLabel: String, fallbackName: String): List<LiveZapCategory> {
    if (isEmpty()) return emptyList()
    val grouped = groupBy { it.categoryId.ifBlank { LIVE_ZAP_UNCATEGORIZED_ID } }
    return listOf(LiveZapCategory(LIVE_ZAP_ALL_CATEGORY_ID, allLabel, size)) + grouped.map { (id, channels) ->
        LiveZapCategory(id = id, name = channels.firstOrNull()?.categoryName?.ifBlank { fallbackName } ?: fallbackName, count = channels.size)
    }
}

/** What the live info card says under the channel name. */
internal data class LiveCardStatus(
    val opening: Boolean = false,
    val reconnecting: Boolean = false,
    val waitingForNetwork: Boolean = false,
    val paused: Boolean = false,
    val audioOnly: Boolean = false,
    val hasError: Boolean = false,
    val signal: String = "",
)

@kotlin.OptIn(ExperimentalFoundationApi::class)
private val PlayerEdgeBringIntoViewSpec = object : BringIntoViewSpec {
    override val scrollAnimationSpec: AnimationSpec<Float> = snap()

    override fun calculateScrollDistance(offset: Float, size: Float, containerSize: Float): Float {
        val itemEnd = offset + size
        return when {
            offset < 0f -> offset
            itemEnd > containerSize -> itemEnd - containerSize
            else -> 0f
        }
    }
}

// ── Live ─────────────────────────────────────────────────────────────────────────────────────

@kotlin.OptIn(ExperimentalFoundationApi::class)
@Composable
internal fun LiveZapOverlay(
    visible: Boolean,
    miniVisible: Boolean,
    miniItem: AppMediaItem,
    miniStatus: LiveCardStatus?,
    currentItem: AppMediaItem,
    currentStatus: LiveCardStatus,
    channelNumberOf: (AppMediaItem) -> Int?,
    categories: List<LiveZapCategory>,
    selectedCategoryId: String,
    selectedTab: LiveOverlayTab,
    items: List<AppMediaItem>,
    selectedIndex: Int,
    videoSizeLabel: String,
    favoriteMarked: Boolean,
    actions: List<LiveOverlayAction>,
    selectedActionIndex: Int,
    accent: Color,
    showCloseButton: Boolean,
    onSelectIndex: (Int) -> Unit,
    onTab: (LiveOverlayTab) -> Unit,
    onCategory: (String) -> Unit,
    onPlay: (AppMediaItem) -> Unit,
    onClose: () -> Unit,
) {
    val strings = LocalStrings.current
    val ps = strings.player

    AnimatedVisibility(
        visible = miniVisible,
        enter = fadeIn(tween(120)),
        exit = fadeOut(tween(220)),
        modifier = Modifier.fillMaxSize(),
    ) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomStart) {
            LiveInfoCard(
                item = miniItem,
                channelNumber = channelNumberOf(miniItem),
                status = miniStatus,
                accent = accent,
                modifier = Modifier.padding(horizontal = SafeHorizontal, vertical = SafeVertical).widthIn(max = 620.dp),
            )
        }
    }

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(120)),
        exit = fadeOut(tween(180)),
        modifier = Modifier.fillMaxSize(),
    ) {
        val channelListState = rememberLazyListState()
        val categoryRowState = rememberLazyListState()
        val tabRowState = rememberLazyListState()
        val selectedCategoryIndex = categories.indexOfFirst { it.id == selectedCategoryId }

        // Keep the selected channel near the middle, and only move the list when it leaves a
        // comfortable zone, so neighbours above and below stay visible while zapping.
        LaunchedEffect(selectedIndex, items) {
            if (selectedIndex !in items.indices) return@LaunchedEffect
            val viewport = snapshotFlow { channelListState.layoutInfo.viewportSize.height }.first { it > 0 }
            val info = channelListState.layoutInfo
            val row = info.visibleItemsInfo.firstOrNull { it.index == selectedIndex }
            val rowSize = row?.size ?: info.visibleItemsInfo.firstOrNull()?.size ?: 0
            val comfortable = row != null && row.offset >= rowSize && row.offset + row.size <= viewport - rowSize
            if (!comfortable) channelListState.scrollToItem(selectedIndex, -(viewport / 2 - rowSize / 2))
        }
        LaunchedEffect(selectedCategoryIndex, categories.size) {
            if (selectedCategoryIndex < 0) return@LaunchedEffect
            val info = categoryRowState.layoutInfo
            val fullyVisible = info.visibleItemsInfo.any {
                it.index == selectedCategoryIndex && it.offset >= 0 && it.offset + it.size <= info.viewportEndOffset
            }
            if (!fullyVisible) categoryRowState.scrollToItem((selectedCategoryIndex - 1).coerceAtLeast(0))
        }
        LaunchedEffect(selectedTab) {
            tabRowState.scrollToItem((selectedTab.ordinal - 1).coerceAtLeast(0))
        }

        Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.28f))) {
            GlassPanel(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(horizontal = SafeHorizontal, vertical = SafeVertical)
                    .widthIn(max = 1180.dp)
                    .fillMaxWidth()
                    .fillMaxHeight(0.8f),
                radius = 24.dp,
                highlighted = true,
                glow = accent.copy(alpha = 0.14f),
            ) {
                Column(
                    Modifier.fillMaxSize().padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        LiveInfoCard(
                            item = currentItem,
                            channelNumber = channelNumberOf(currentItem),
                            status = currentStatus,
                            accent = accent,
                            modifier = Modifier.weight(1f),
                        )
                        Column(
                            Modifier.width(200.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp),
                            horizontalAlignment = Alignment.End,
                        ) {
                            Text(
                                "${selectedIndex.coerceAtLeast(0) + 1}/${items.size.coerceAtLeast(1)}".ltr(),
                                color = accent,
                                fontSize = 22.sp,
                                fontWeight = FontWeight.ExtraBold,
                            )
                            Text(ps.liveMenu, color = Color(0xCCFFFFFF), fontSize = 13.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                            Text(videoSizeLabel, color = Color(0x99FFFFFF), fontSize = 12.sp, maxLines = 1)
                        }
                        if (showCloseButton) {
                            SmallControlButton(Icons.Rounded.Close, ps.close, accent, onClose)
                        }
                    }

                    LazyRow(
                        state = tabRowState,
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        items(LiveOverlayTabs, key = { it.name }) { tab ->
                            LiveOverlayTabChip(
                                label = tab.label(strings),
                                selected = selectedTab == tab,
                                accent = accent,
                                onClick = { onTab(tab) },
                            )
                        }
                    }

                    LazyRow(
                        state = categoryRowState,
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        items(categories, key = { it.id }) { category ->
                            LiveCategoryPill(
                                category = category,
                                selected = category.id == selectedCategoryId,
                                emphasized = selectedTab == LiveOverlayTab.GROUPS,
                                accent = accent,
                                onClick = { onCategory(category.id) },
                            )
                        }
                    }

                    Row(
                        Modifier.weight(1f).fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        Column(Modifier.weight(1f).fillMaxHeight()) {
                            Text(
                                categories.getOrNull(selectedCategoryIndex)?.name ?: ps.tabChannels,
                                color = Color.White,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.ExtraBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp),
                            )
                            if (items.isEmpty()) {
                                Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                                    Text(ps.noChannelsInGroup, color = Color(0xCCFFFFFF), fontSize = 14.sp)
                                }
                            } else {
                                CompositionLocalProvider(LocalBringIntoViewSpec provides PlayerEdgeBringIntoViewSpec) {
                                    LazyColumn(
                                        modifier = Modifier.weight(1f).fillMaxWidth(),
                                        state = channelListState,
                                        verticalArrangement = Arrangement.spacedBy(6.dp),
                                        contentPadding = PaddingValues(vertical = 6.dp),
                                    ) {
                                        itemsIndexed(items, key = { _, channel -> "${channel.serverId}-${channel.id}-${channel.type}" }) { index, channel ->
                                            LiveChannelRow(
                                                channel = channel,
                                                number = channelNumberOf(channel),
                                                selected = index == selectedIndex && selectedTab == LiveOverlayTab.CHANNELS,
                                                current = channel.samePlayable(currentItem),
                                                accent = accent,
                                                onFocus = { onSelectIndex(index) },
                                                onPlay = { onPlay(channel) },
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        LiveOverlayActionPanel(
                            title = selectedTab.label(strings),
                            hint = when (selectedTab) {
                                LiveOverlayTab.CHANNELS -> ps.hintChannels
                                LiveOverlayTab.GROUPS -> ps.hintGroups
                                LiveOverlayTab.VIDEO_SIZE -> ps.hintCurrent.fill(videoSizeLabel)
                                LiveOverlayTab.AUDIO -> ps.hintAudio
                                LiveOverlayTab.SUBTITLES -> ps.hintSubtitles
                                LiveOverlayTab.FAVORITES -> if (favoriteMarked) ps.favoriteSaved else ps.favoriteNotSaved
                            },
                            actions = actions,
                            selectedActionIndex = selectedActionIndex,
                            accent = accent,
                            modifier = Modifier.fillMaxHeight().width(280.dp),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun LiveOverlayTabChip(label: String, selected: Boolean, accent: Color, onClick: () -> Unit) {
    FocusGlow(cornerRadius = 999.dp, onClick = onClick, modifier = Modifier.height(40.dp)) {
        Box(
            Modifier
                .clip(RoundedCornerShape(999.dp))
                .border(
                    width = if (selected) 2.dp else 1.dp,
                    color = if (selected) accent else Color(0x26FFFFFF),
                    shape = RoundedCornerShape(999.dp),
                )
                .background(if (selected) accent.copy(alpha = 0.24f) else Color(0x18FFFFFF))
                .padding(horizontal = 16.dp, vertical = 9.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                label,
                color = if (selected) Color.White else Color(0xE6FFFFFF),
                fontSize = 13.sp,
                fontWeight = FontWeight.ExtraBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun LiveOverlayActionPanel(
    title: String,
    hint: String,
    actions: List<LiveOverlayAction>,
    selectedActionIndex: Int,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    GlassPanel(modifier = modifier, radius = 18.dp, highlighted = true, glow = accent.copy(alpha = 0.06f)) {
        Column(
            Modifier.fillMaxSize().padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(title, color = Color.White, fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(hint, color = Color(0xCCFFFFFF), fontSize = 13.sp, lineHeight = 18.sp)
            actions.forEachIndexed { index, action ->
                LiveActionButton(
                    label = action.label,
                    selected = action.selected,
                    highlighted = index == selectedActionIndex,
                    accent = accent,
                    onClick = action.onClick,
                )
            }
        }
    }
}

@Composable
private fun LiveActionButton(label: String, selected: Boolean, highlighted: Boolean, accent: Color, onClick: () -> Unit) {
    FocusGlow(cornerRadius = 14.dp, onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Box(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .border(
                    width = if (highlighted) 2.5.dp else 0.dp,
                    color = if (highlighted) Color.White else Color.Transparent,
                    shape = RoundedCornerShape(14.dp),
                )
                .background(
                    when {
                        highlighted -> accent.copy(alpha = 0.32f)
                        selected -> accent.copy(alpha = 0.18f)
                        else -> Color(0x22FFFFFF)
                    },
                )
                .padding(horizontal = 14.dp, vertical = 11.dp),
        ) {
            Text(
                label,
                color = if (selected && !highlighted) accent else Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.ExtraBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun LiveCategoryPill(
    category: LiveZapCategory,
    selected: Boolean,
    emphasized: Boolean,
    accent: Color,
    onClick: () -> Unit,
) {
    FocusGlow(cornerRadius = 999.dp, onClick = onClick) {
        Row(
            Modifier
                .clip(RoundedCornerShape(999.dp))
                .border(
                    width = if (selected && emphasized) 2.dp else 0.dp,
                    color = if (selected && emphasized) Color.White else Color.Transparent,
                    shape = RoundedCornerShape(999.dp),
                )
                .background(if (selected) accent.copy(alpha = 0.28f) else Color(0x22FFFFFF))
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(category.name.isolate(), color = if (selected) Color.White else Color(0xE6FFFFFF), fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(category.count.toString().ltr(), color = Color(0x99FFFFFF), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
internal fun LiveInfoCard(
    item: AppMediaItem,
    channelNumber: Int?,
    status: LiveCardStatus?,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    val strings = LocalStrings.current
    val ps = strings.player
    GlassPanel(modifier = modifier, radius = 18.dp, highlighted = true, glow = accent.copy(alpha = 0.08f)) {
        Row(
            Modifier.fillMaxWidth().padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ChannelLogo(item, Modifier.size(58.dp), accent)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        channelNumber?.let(::formatChannelNumber)?.ltr() ?: strings.badgeLive,
                        color = accent,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 15.sp,
                    )
                    Text(
                        item.categoryName.ifBlank { ps.liveTvFallback }.isolate(),
                        color = Color(0xCCFFFFFF),
                        fontSize = 13.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Text(
                    item.title.isolate(),
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                if (status != null) {
                    Text(
                        when {
                            status.hasError -> ps.notAvailable
                            status.reconnecting -> if (status.waitingForNetwork) ps.waitingForNetwork else ps.reconnecting
                            status.opening -> strings.playerOpening
                            status.audioOnly -> listOf(ps.radio, status.signal).filter { it.isNotBlank() }.joinToString(" | ")
                            status.signal.isNotBlank() -> status.signal
                            else -> strings.liveNow
                        },
                        color = if (status.hasError) Color(0xFFFFB4AB) else Color(0xDDE3BC78),
                        fontSize = 13.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            if (status != null) {
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = when {
                        status.hasError -> Color(0xFFB3261E)
                        status.paused -> Color(0xFF4A5363)
                        else -> Color(0xFFE5243B)
                    },
                ) {
                    Row(
                        Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        if (status.paused) Icon(Icons.Rounded.Pause, null, tint = Color.White, modifier = Modifier.size(14.dp))
                        Text(
                            when {
                                status.paused -> ps.paused
                                status.opening || status.reconnecting -> ps.badgeLoading
                                else -> strings.badgeLive
                            },
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun LiveChannelRow(
    channel: AppMediaItem,
    number: Int?,
    selected: Boolean,
    current: Boolean,
    accent: Color,
    onFocus: () -> Unit,
    onPlay: () -> Unit,
) {
    val ps = LocalStrings.current.player
    FocusGlow(cornerRadius = 12.dp, onFocused = onFocus, onClick = onPlay) {
        Row(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .border(
                    width = if (selected) 2.dp else 0.dp,
                    color = if (selected) accent else Color.Transparent,
                    shape = RoundedCornerShape(12.dp),
                )
                .background(
                    when {
                        selected -> accent.copy(alpha = 0.24f)
                        current -> Color(0x22FFFFFF)
                        else -> Color.Transparent
                    },
                )
                .padding(horizontal = 10.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                number?.let(::formatChannelNumber)?.ltr().orEmpty(),
                color = if (selected) Color.White else Color(0xB3FFFFFF),
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                modifier = Modifier.widthIn(min = 40.dp),
            )
            ChannelLogo(channel, Modifier.size(38.dp), accent)
            Column(Modifier.weight(1f)) {
                Text(channel.title.isolate(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(channel.categoryName.ifBlank { ps.liveTvFallback }.isolate(), color = Color(0xA6FFFFFF), fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            if (current) {
                Text(ps.badgeNow, color = accent, fontSize = 12.sp, fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}

@Composable
internal fun ChannelLogo(item: AppMediaItem, modifier: Modifier, accent: Color) {
    Box(
        modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0x33111111)),
        contentAlignment = Alignment.Center,
    ) {
        if (item.posterUrl.isNotBlank()) {
            AsyncImage(model = item.posterUrl, contentDescription = item.title, modifier = Modifier.fillMaxSize())
        } else {
            Text(item.title.take(1).uppercase(Locale.getDefault()), color = accent, fontWeight = FontWeight.ExtraBold)
        }
    }
}

/** Radio / audio-only channels: show who is playing instead of a black screen. */
@Composable
internal fun AudioOnlyBackdrop(item: AppMediaItem, accent: Color, modifier: Modifier = Modifier) {
    val ps = LocalStrings.current.player
    Box(
        modifier
            .fillMaxSize()
            .background(Brush.radialGradient(listOf(accent.copy(alpha = 0.22f), Color.Black))),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(14.dp)) {
            ChannelLogo(item, Modifier.size(150.dp), accent)
            Text(
                item.title.isolate(),
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Surface(shape = RoundedCornerShape(999.dp), color = accent.copy(alpha = 0.25f)) {
                Row(
                    Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(Icons.Rounded.Radio, null, tint = Color.White, modifier = Modifier.size(18.dp))
                    Text(ps.radio, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// ── Pills, chips and cards ───────────────────────────────────────────────────────────────────

/**
 * "Opening channel…" / "Buffering…". After a zap it stays hidden for 900 ms (a fast channel never
 * shows it) and disappears the moment the first frame renders.
 */
@Composable
internal fun OpeningPill(
    visible: Boolean,
    suppressForZap: Boolean,
    switchKey: Long,
    onSettled: () -> Unit,
    label: String,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    val currentOnSettled by rememberUpdatedState(onSettled)
    LaunchedEffect(switchKey, suppressForZap) {
        if (suppressForZap) {
            kotlinx.coroutines.delay(900)
            currentOnSettled()
        }
    }
    if (visible && !suppressForZap) {
        StatusPill(label, accent, modifier)
    }
}

@Composable
internal fun StatusPill(text: String, accent: Color, modifier: Modifier = Modifier) {
    GlassPanel(radius = 999.dp, modifier = modifier) {
        Row(
            Modifier.padding(horizontal = 20.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            CircularProgressIndicator(color = accent, modifier = Modifier.size(20.dp), strokeWidth = 2.5.dp)
            Text(text, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
internal fun InfoChip(text: String, accent: Color, modifier: Modifier = Modifier) {
    GlassPanel(radius = 999.dp, highlighted = true, glow = accent.copy(alpha = 0.12f), modifier = modifier) {
        Text(
            text,
            color = Color.White,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp),
        )
    }
}

/** Big channel number while the viewer types digits on the remote. */
@Composable
internal fun NumberEntryOverlay(digits: String, accent: Color, modifier: Modifier = Modifier) {
    val ps = LocalStrings.current.player
    GlassPanel(radius = 22.dp, highlighted = true, glow = accent.copy(alpha = 0.18f), modifier = modifier) {
        Column(
            Modifier.padding(horizontal = 26.dp, vertical = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(ps.channelLabel, color = Color(0xCCFFFFFF), fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Text(digits.ltr(), color = accent, fontSize = 48.sp, fontWeight = FontWeight.ExtraBold)
        }
    }
}

@Composable
internal fun PlaybackErrorCard(
    title: String,
    message: String,
    actions: List<PlayerErrorAction>,
    firstActionFocus: FocusRequester,
    accent: Color,
) {
    Box(
        Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.72f)),
        contentAlignment = Alignment.Center,
    ) {
        GlassPanel(
            radius = 24.dp,
            highlighted = true,
            glow = accent.copy(alpha = 0.10f),
            modifier = Modifier.padding(horizontal = SafeHorizontal, vertical = SafeVertical).widthIn(max = 720.dp),
        ) {
            Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Warning, null, tint = Color(0xFFFFD166), modifier = Modifier.size(26.dp))
                    Text(title, color = Color.White, fontSize = 19.sp, fontWeight = FontWeight.ExtraBold)
                }
                Text(message, color = Color(0xE6F5E6D0), fontSize = 15.sp, lineHeight = 21.sp, maxLines = 4, overflow = TextOverflow.Ellipsis)
                Row(
                    Modifier.horizontalScroll(rememberScrollState()).padding(6.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    actions.forEachIndexed { index, action ->
                        PlayerPillButton(
                            label = action.label,
                            icon = action.icon,
                            primary = action.primary,
                            accent = accent,
                            focusRequester = if (index == 0) firstActionFocus else null,
                            onClick = action.onClick,
                        )
                    }
                }
            }
        }
    }
}

/** Pill button with the app's strong TV focus ring (border, glow and scale) instead of Material's faint state layer. */
@Composable
internal fun PlayerPillButton(
    label: String,
    icon: ImageVector?,
    primary: Boolean,
    accent: Color,
    focusRequester: FocusRequester? = null,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    FocusGlow(cornerRadius = 999.dp, focusRequester = focusRequester, onClick = onClick, modifier = modifier) {
        Row(
            Modifier
                .clip(RoundedCornerShape(999.dp))
                .background(if (primary) accent else Color(0x2BFFFFFF))
                .padding(horizontal = 18.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (icon != null) Icon(icon, null, tint = if (primary) Color.Black else Color.White, modifier = Modifier.size(18.dp))
            Text(label, color = if (primary) Color.Black else Color.White, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1)
        }
    }
}

// ── VOD ──────────────────────────────────────────────────────────────────────────────────────

@Composable
internal fun VodControls(
    visible: Boolean,
    title: String,
    videoSizeLabel: String,
    ui: PlayerItemUiState,
    showPlay: Boolean,
    ended: Boolean,
    favoriteMarked: Boolean,
    canCast: Boolean,
    accent: Color,
    playPauseFocusRequester: FocusRequester,
    onSeekToFraction: ((Float) -> Unit)?,
    onSeekBy: (Long) -> Unit,
    onPlayPause: () -> Unit,
    onRetry: () -> Unit,
    onAudio: () -> Unit,
    onSubtitles: () -> Unit,
    onAddSubtitle: () -> Unit,
    onQuality: () -> Unit,
    onAspect: () -> Unit,
    onFavorite: () -> Unit,
    onCast: () -> Unit,
    onExternal: () -> Unit,
) {
    val strings = LocalStrings.current
    val ps = strings.player
    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(250)),
        exit = fadeOut(tween(400)),
        modifier = Modifier.fillMaxSize(),
    ) {
        Box(Modifier.fillMaxSize()) {
            Box(
                Modifier.fillMaxSize().background(
                    Brush.verticalGradient(
                        colorStops = arrayOf(
                            0.00f to Color.Black.copy(alpha = 0.65f),
                            0.15f to Color.Black.copy(alpha = 0.10f),
                            0.80f to Color.Black.copy(alpha = 0.12f),
                            1.00f to Color.Black.copy(alpha = 0.72f),
                        ),
                    ),
                ),
            )

            GlassPanel(
                radius = 999.dp,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(horizontal = SafeHorizontal, vertical = SafeVertical)
                    .widthIn(max = 760.dp),
            ) {
                Row(
                    Modifier.padding(horizontal = 22.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(
                        title.isolate(),
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false),
                    )
                    Text(videoSizeLabel, color = accent.copy(alpha = 0.9f), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }

            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(horizontal = SafeHorizontal, vertical = SafeVertical)
                    .widthIn(max = 900.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                GlassPanel(radius = 999.dp, modifier = Modifier.fillMaxWidth()) {
                    VodSeekBar(ui, accent, onSeekToFraction)
                }
                GlassPanel(radius = 22.dp, modifier = Modifier.fillMaxWidth(), glow = accent.copy(alpha = 0.04f)) {
                    Column(
                        Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        // Media transport is never mirrored: +10 sits on the right, like the timeline
                        // and the remote's Right/FF keys, in Arabic too.
                        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterHorizontally),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                ControlButton(Icons.Rounded.Replay10, "-10", accent) { onSeekBy(-10_000L) }
                                FocusGlow(cornerRadius = 16.dp, focusRequester = playPauseFocusRequester, onClick = onPlayPause) {
                                    Row(
                                        Modifier
                                            .clip(RoundedCornerShape(16.dp))
                                            .background(accent)
                                            .padding(horizontal = 24.dp, vertical = 12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    ) {
                                        Icon(
                                            when {
                                                ended -> Icons.Rounded.Replay
                                                showPlay -> Icons.Rounded.PlayArrow
                                                else -> Icons.Rounded.Pause
                                            },
                                            null,
                                            tint = Color.Black,
                                            modifier = Modifier.size(28.dp),
                                        )
                                        Text(
                                            when {
                                                ended -> ps.replay
                                                showPlay -> strings.playerPlay
                                                else -> strings.playerPause
                                            },
                                            color = Color.Black,
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 16.sp,
                                        )
                                    }
                                }
                                ControlButton(Icons.Rounded.Forward10, "+10", accent) { onSeekBy(10_000L) }
                            }
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                SmallControlButton(Icons.Rounded.Refresh, ps.retry, accent, onRetry)
                                SmallControlButton(Icons.Rounded.Audiotrack, strings.playerAudio, accent, onAudio)
                                SmallControlButton(Icons.Rounded.Subtitles, strings.playerSubtitles, accent, onSubtitles)
                                SmallControlButton(Icons.Rounded.UploadFile, strings.playerAddSubtitle, accent, onAddSubtitle)
                                SmallControlButton(Icons.Rounded.HighQuality, strings.playerQuality, accent, onQuality)
                                SmallControlButton(Icons.Rounded.Tune, strings.playerAspect, accent, onAspect)
                                SmallControlButton(
                                    Icons.Rounded.Favorite,
                                    if (favoriteMarked) ps.removeFavorite else ps.addFavorite,
                                    accent,
                                    onFavorite,
                                    tint = if (favoriteMarked) accent else Color.White,
                                )
                                if (canCast) SmallControlButton(Icons.Rounded.Cast, strings.playerCast, accent, onCast)
                                SmallControlButton(Icons.AutoMirrored.Rounded.OpenInNew, strings.playerOpenExternal, accent, onExternal)
                            }
                            Text(ps.vodControlsHint, color = Color(0x99FFFFFF), fontSize = 12.sp, fontWeight = FontWeight.Medium, maxLines = 1)
                        }
                    }
                }
            }
        }
    }
}

/** Seek bar shown alone while scrubbing with the controls hidden, so Left/Right keep seeking. */
@Composable
internal fun VodSeekPreview(visible: Boolean, ui: PlayerItemUiState, accent: Color) {
    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(120)),
        exit = fadeOut(tween(300)),
        modifier = Modifier.fillMaxSize(),
    ) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
            GlassPanel(
                radius = 999.dp,
                modifier = Modifier
                    .padding(horizontal = SafeHorizontal, vertical = SafeVertical)
                    .widthIn(max = 900.dp)
                    .fillMaxWidth(),
            ) {
                VodSeekBar(ui, accent, onSeekToFraction = null)
            }
        }
    }
}

/**
 * Timeline, always laid out left-to-right (Material bidi guidance for media): Right on the remote
 * moves the thumb right in Arabic too. Reads the position here so only this row recomposes as
 * playback advances.
 */
@Composable
private fun VodSeekBar(ui: PlayerItemUiState, accent: Color, onSeekToFraction: ((Float) -> Unit)?) {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        val position = ui.currentPosition
        val duration = ui.duration
        val progress = if (duration > 1) (position.toFloat() / duration.toFloat()).coerceIn(0f, 1f) else 0f
        val currentOnSeek by rememberUpdatedState(onSeekToFraction)
        Row(
            Modifier.padding(horizontal = 18.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(formatTime(position), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Box(
                Modifier
                    .weight(1f)
                    .height(22.dp)
                    .then(
                        if (onSeekToFraction != null) {
                            Modifier.pointerInput(Unit) {
                                detectTapGestures { offset ->
                                    if (size.width > 0) currentOnSeek?.invoke((offset.x / size.width).coerceIn(0f, 1f))
                                }
                            }
                        } else {
                            Modifier
                        },
                    ),
                contentAlignment = Alignment.CenterStart,
            ) {
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(Color(0x33FFFFFF)),
                ) {
                    Box(
                        Modifier
                            .fillMaxWidth(progress)
                            .fillMaxHeight()
                            .clip(RoundedCornerShape(999.dp))
                            .background(Brush.horizontalGradient(listOf(accent.copy(alpha = 0.78f), accent))),
                    )
                }
                Box(Modifier.fillMaxWidth(progress), contentAlignment = Alignment.CenterEnd) {
                    Box(
                        Modifier
                            .size(16.dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(Color.White)
                            .border(2.dp, accent, RoundedCornerShape(999.dp)),
                    )
                }
            }
            Text(formatTime(duration.takeIf { it > 1 } ?: 0L), color = Color(0xB3FFFFFF), fontSize = 14.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
internal fun SeekJumpPill(visible: Boolean, offsetMs: Long, modifier: Modifier = Modifier) {
    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(100)),
        exit = fadeOut(tween(300)),
        modifier = modifier,
    ) {
        GlassPanel(radius = 999.dp) {
            val seconds = abs(offsetMs) / 1000L
            Text(
                text = "${if (offsetMs < 0) "−" else "+"}${seconds}s".ltr(),
                color = Color.White,
                fontSize = 28.sp,
                fontWeight = FontWeight.ExtraBold,
                modifier = Modifier.padding(horizontal = 28.dp, vertical = 14.dp),
            )
        }
    }
}

// ── Touch ────────────────────────────────────────────────────────────────────────────────────

/**
 * Transparent layer above the video for phones and tablets: tap toggles the controls or the
 * channel list, double tap seeks ±10 s by side (VOD), vertical swipe zaps (live). It sits below
 * the overlays, whose panels consume their own touches, and leaves remote-key handling alone.
 */
@Composable
internal fun PlayerTouchLayer(
    isLive: Boolean,
    onTap: () -> Unit,
    onDoubleTap: (forward: Boolean) -> Unit,
    onVerticalSwipe: (direction: Int) -> Unit,
) {
    val currentOnTap by rememberUpdatedState(onTap)
    val currentOnDoubleTap by rememberUpdatedState(onDoubleTap)
    val currentOnSwipe by rememberUpdatedState(onVerticalSwipe)
    Box(
        Modifier
            .fillMaxSize()
            .pointerInput(isLive) {
                if (isLive) {
                    detectTapGestures(onTap = { currentOnTap() })
                } else {
                    detectTapGestures(
                        onTap = { currentOnTap() },
                        onDoubleTap = { offset -> currentOnDoubleTap(offset.x >= size.width / 2f) },
                    )
                }
            }
            .then(
                if (isLive) {
                    Modifier.pointerInput(Unit) {
                        val threshold = 80.dp.toPx()
                        var accumulated = 0f
                        detectVerticalDragGestures(
                            onDragStart = { accumulated = 0f },
                            onVerticalDrag = { change, dragAmount ->
                                accumulated += dragAmount
                                change.consume()
                                if (abs(accumulated) >= threshold) {
                                    // Swipe up = next channel, swipe down = previous.
                                    currentOnSwipe(if (accumulated < 0f) 1 else -1)
                                    accumulated = 0f
                                }
                            },
                        )
                    }
                } else {
                    Modifier
                },
            ),
    )
}

// ── Route picker and external launch ─────────────────────────────────────────────────────────

@Composable
internal fun PlayerRoutePicker(title: String, onSelect: (String) -> Unit, onDismiss: () -> Unit) {
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    val autoFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(120)
        runCatching { autoFocus.requestFocus() }
    }
    Dialog(onDismissRequest = onDismiss) {
        GlassPanel(modifier = Modifier.fillMaxWidth(), radius = 26.dp, highlighted = true, glow = visuals.glow) {
            Column(
                Modifier.padding(horizontal = 22.dp, vertical = 20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text(strings.playerChooseTitle, color = Color.White, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text(title.isolate(), color = Color(0xCCE3BC78), maxLines = 2, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodyMedium)
                Text(strings.playerChooseHint, color = Color(0xB3FFFFFF), style = MaterialTheme.typography.bodyMedium)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    PlayerPillButton(strings.player.routeAuto, null, true, visuals.accent, autoFocus, Modifier.weight(1f)) { onSelect("auto") }
                    PlayerPillButton("Media3", null, false, visuals.accent, modifier = Modifier.weight(1f)) { onSelect("media3") }
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    PlayerPillButton("VLC", null, false, visuals.accent, modifier = Modifier.weight(1f)) { onSelect("vlc") }
                    PlayerPillButton("MX", null, false, visuals.accent, modifier = Modifier.weight(1f)) { onSelect("mx") }
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    PlayerPillButton(strings.playerGeneric, null, false, visuals.accent, modifier = Modifier.weight(1f)) { onSelect("external") }
                    PlayerPillButton(strings.cancel, null, false, visuals.accent, modifier = Modifier.weight(1f), onClick = onDismiss)
                }
            }
        }
    }
}

@Composable
internal fun ExternalLaunchScreen(
    title: String,
    message: String,
    onRetrySame: () -> Unit,
    onUseMedia3: () -> Unit,
    onPickAnother: () -> Unit,
    onBack: () -> Unit,
) {
    val strings = LocalStrings.current
    val accent = LocalMoVisuals.current.accent
    val retryFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(120)
        runCatching { retryFocus.requestFocus() }
    }
    Box(
        Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF010408), Color(0xFF070F1C)))),
        contentAlignment = Alignment.Center,
    ) {
        OverlayCard(modifier = Modifier.padding(horizontal = SafeHorizontal, vertical = SafeVertical).widthIn(max = 760.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text(title.isolate(), color = Color.White, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
                Text(message, color = Color(0xDDE3BC78), style = MaterialTheme.typography.bodyLarge)
                Row(
                    Modifier.horizontalScroll(rememberScrollState()).padding(6.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    PlayerPillButton(strings.retry, Icons.Rounded.Refresh, true, accent, retryFocus, onClick = onRetrySame)
                    PlayerPillButton(strings.playerUseMedia3, null, false, accent, onClick = onUseMedia3)
                    PlayerPillButton(strings.playerChooseAnother, null, false, accent, onClick = onPickAnother)
                    PlayerPillButton(strings.back, null, false, accent, onClick = onBack)
                }
            }
        }
    }
}

@Composable
private fun ControlButton(icon: ImageVector, label: String, accent: Color, onClick: () -> Unit) {
    FocusGlow(cornerRadius = 18.dp, onClick = onClick, modifier = Modifier.clip(RoundedCornerShape(18.dp))) {
        GlassPanel(radius = 18.dp, highlighted = true, glow = accent.copy(alpha = 0.10f)) {
            Row(
                modifier = Modifier.padding(horizontal = 18.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(icon, null, tint = accent, modifier = Modifier.size(24.dp))
                Text(label, color = Color.White, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
            }
        }
    }
}

@Composable
private fun SmallControlButton(
    icon: ImageVector,
    label: String,
    accent: Color,
    onClick: () -> Unit,
    tint: Color = accent,
) {
    FocusGlow(cornerRadius = 14.dp, onClick = onClick, modifier = Modifier.size(48.dp).clip(RoundedCornerShape(14.dp))) {
        GlassPanel(
            radius = 14.dp,
            highlighted = true,
            glow = accent.copy(alpha = 0.06f),
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, label, tint = tint, modifier = Modifier.size(22.dp))
        }
    }
}

@Composable
private fun OverlayCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    GlassPanel(modifier = modifier, radius = 28.dp) {
        Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 20.dp), content = content)
    }
}

/** Places the pills that can appear together (status, recovery notice, info) in one column. */
@Composable
internal fun TopNoticeStack(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier.padding(horizontal = SafeHorizontal, vertical = SafeVertical),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp),
        content = content,
    )
}

/** Top-end corner inside the TV safe area (the left corner in Arabic). */
internal fun Modifier.safeCornerPadding(): Modifier = padding(horizontal = SafeHorizontal, vertical = SafeVertical)
