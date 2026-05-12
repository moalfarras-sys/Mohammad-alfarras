package com.moalfarras.moplayer.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bookmark
import androidx.compose.material.icons.rounded.ExpandLess
import androidx.compose.material.icons.rounded.ExpandMore
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Layers
import androidx.compose.material.icons.rounded.LiveTv
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material.icons.rounded.Tv
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.paging.PagingData
import androidx.paging.compose.collectAsLazyPagingItems
import androidx.paging.compose.itemKey
import coil3.compose.AsyncImage
import com.moalfarras.moplayer.domain.model.Category
import com.moalfarras.moplayer.domain.model.LiveEpgSnapshot
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.ui.components.AtmosphericBackground
import com.moalfarras.moplayer.ui.components.ChannelRow
import com.moalfarras.moplayer.ui.components.CinematicBackdrop
import com.moalfarras.moplayer.ui.components.FocusGlow
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.components.MediaPoster
import com.moalfarras.moplayer.ui.components.backdropUrlFrom
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.animation.core.*
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import kotlinx.coroutines.flow.Flow
import java.util.concurrent.TimeUnit

@Composable
fun LiveScreen(
    categories: List<Category>,
    channelsFlow: Flow<PagingData<MediaItem>>,
    focused: MediaItem?,
    focusedEpg: LiveEpgSnapshot,
    selectedCategoryId: String,
    previewEnabled: Boolean,
    onCategory: (Category) -> Unit,
    onAllCategories: () -> Unit,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val channels = channelsFlow.collectAsLazyPagingItems()
    val firstChannel = if (channels.itemCount > 0) channels.peek(0) else null
    val current = focused ?: firstChannel
    val backdrop = remember(current?.id) { backdropUrlFrom(current) }

    Box(
        Modifier.fillMaxSize()
    ) {
        CinematicBackdrop(backdrop)
        // Subtle atmospheric vignette overlay
        Box(Modifier.fillMaxSize().background(Brush.verticalGradient(
            colorStops = arrayOf(0.0f to Color.Transparent, 0.85f to Color.Black.copy(alpha = 0.3f), 1.0f to Color.Black.copy(alpha = 0.5f))
        )))
        if (tv.isTv) {
            Row(
                Modifier.fillMaxSize().padding(
                    start = tv.contentPadding,
                    top = tv.contentPadding * 0.6f,
                    end = tv.contentPadding,
                    bottom = tv.contentPadding * 1.5f,
                ),
                horizontalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
            ) {
                CategoryRail("البث المباشر", categories, selectedCategoryId, onCategory, onAllCategories, Modifier.fillMaxHeight().weight(0.18f))
                GlassPanel(Modifier.fillMaxHeight().weight(0.60f), radius = tv.cardRadius, blur = 18.dp) {
                    Column(Modifier.fillMaxSize().padding(tv.panelPadding), verticalArrangement = Arrangement.spacedBy((8 * tv.factor).dp)) {
                        ReceiverHeader(current, focusedEpg)
                        PagingChannelList(channels.itemCount, { channels[it] }, current?.id, onFocus, onPlay, onFavorite)
                    }
                }
                PreviewPane(current, Modifier.fillMaxHeight().weight(0.22f), live = true, previewEnabled = previewEnabled, liveEpg = focusedEpg)
            }
        } else {
            Column(
                Modifier.fillMaxSize().padding(tv.contentPadding, tv.contentPadding, tv.contentPadding, tv.contentPadding),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                HeaderRow("البث المباشر", Icons.Rounded.LiveTv)
                CategoryPills(categories, selectedCategoryId, onCategory, onAllCategories)
                PagingChannelList(channels.itemCount, { channels[it] }, current?.id, onFocus, onPlay, onFavorite)
            }
        }
    }
}

@Composable
fun PosterScreen(
    title: String,
    categories: List<Category>,
    itemsFlow: Flow<PagingData<MediaItem>>,
    focused: MediaItem?,
    selectedCategoryId: String,
    previewEnabled: Boolean,
    onCategory: (Category) -> Unit,
    onAllCategories: () -> Unit,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
) {
    val tv = rememberTvScale()
    val items = itemsFlow.collectAsLazyPagingItems()
    val backdrop = remember(focused?.id) { backdropUrlFrom(focused) }

    Box(Modifier.fillMaxSize()) {
        CinematicBackdrop(backdrop)
        if (tv.isTv) {
            Row(
                Modifier.fillMaxSize().padding(
                    start = tv.contentPadding,
                    top = tv.contentPadding * 0.6f,
                    end = tv.contentPadding,
                    bottom = tv.contentPadding * 1.5f,
                ),
                horizontalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
            ) {
                CategoryRail(title, categories, selectedCategoryId, onCategory, onAllCategories, Modifier.fillMaxHeight().weight(0.18f))
                PosterGrid(items.itemCount, { items[it] }, onFocus, onPlay, onFavorite, Modifier.fillMaxHeight().weight(0.64f))
                val firstItem = if (items.itemCount > 0) items.peek(0) else null
                PreviewPane(focused ?: firstItem, Modifier.fillMaxHeight().weight(0.18f), live = false, previewEnabled = previewEnabled)
            }
        } else {
            Column(
                Modifier.fillMaxSize().padding(tv.contentPadding, tv.contentPadding, tv.contentPadding, tv.contentPadding),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                HeaderRow(title, Icons.Rounded.Tv)
                CategoryPills(categories, selectedCategoryId, onCategory, onAllCategories)
                PosterGrid(items.itemCount, { items[it] }, onFocus, onPlay, onFavorite, Modifier.fillMaxSize())
            }
        }
    }
}

@Composable
fun FavoritesScreen(
    itemsFlow: Flow<PagingData<MediaItem>>,
    focused: MediaItem?,
    previewEnabled: Boolean,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val items = itemsFlow.collectAsLazyPagingItems()
    val backdrop = remember(focused?.id) { backdropUrlFrom(focused) }

    Box(Modifier.fillMaxSize()) {
        CinematicBackdrop(backdrop)
        if (items.itemCount == 0) {
            EmptyState(
                title = "لا توجد مفضلة بعد",
                message = "اضغط مطولاً على OK أو اضغط OK ثلاث مرات لإضافة القنوات والأفلام هنا.",
                modifier = Modifier.fillMaxSize().padding(tv.contentPadding),
            )
            return@Box
        }
        if (tv.isTv) {
            Row(
                Modifier.fillMaxSize().padding(
                    start = tv.contentPadding,
                    top = tv.contentPadding * 0.6f,
                    end = tv.contentPadding,
                    bottom = tv.contentPadding * 1.5f,
                ),
                horizontalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
            ) {
                GlassPanel(Modifier.fillMaxHeight().weight(0.18f), radius = tv.cardRadius, blur = 20.dp) {
                    Column(Modifier.fillMaxSize().padding(tv.panelPadding), verticalArrangement = Arrangement.spacedBy((14 * tv.factor).dp)) {
                        Icon(Icons.Rounded.Favorite, null, tint = visuals.accent, modifier = Modifier.size((36 * tv.factor).dp))
                        Text("المفضلة", color = Color.White, style = MaterialTheme.typography.displaySmall.copy(fontWeight = FontWeight.Bold))
                        Text("القنوات والأفلام والمسلسلات المحفوظة هنا.", color = Color(0xB8E3BC78), style = MaterialTheme.typography.bodyLarge, lineHeight = 24.sp)
                        GlassTag("${items.itemCount} عنصر", Icons.Rounded.Bookmark)
                    }
                }
                PosterGrid(items.itemCount, { items[it] }, onFocus, onPlay, onFavorite, Modifier.fillMaxHeight().weight(0.64f))
                val firstItem = if (items.itemCount > 0) items.peek(0) else null
                PreviewPane(focused ?: firstItem, Modifier.fillMaxHeight().weight(0.18f), live = false, previewEnabled = previewEnabled)
            }
        } else {
            Column(
                Modifier.fillMaxSize().padding(tv.contentPadding, tv.contentPadding, tv.contentPadding, tv.contentPadding),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                HeaderRow("المفضلة", Icons.Rounded.Favorite)
                PosterGrid(items.itemCount, { items[it] }, onFocus, onPlay, onFavorite, Modifier.fillMaxSize())
            }
        }
    }
}

@Composable
fun SeriesDetailsScreen(
    series: MediaItem,
    episodes: List<MediaItem>,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val seasons = episodes.map { it.seasonNumber.coerceAtLeast(1) }.distinct().sorted().ifEmpty { listOf(1) }
    var selectedSeason by remember(series.id, seasons) { mutableIntStateOf(seasons.first()) }
    val seasonEpisodes = episodes.filter { it.seasonNumber.coerceAtLeast(1) == selectedSeason }
    val backdrop = remember(series.id) { backdropUrlFrom(series) }

    Box(Modifier.fillMaxSize()) {
        CinematicBackdrop(backdrop)
        Row(
            Modifier.fillMaxSize().padding(tv.contentPadding, tv.contentPadding * 0.8f, tv.contentPadding, tv.contentPadding),
            horizontalArrangement = Arrangement.spacedBy((16 * tv.factor).dp),
        ) {
            PreviewPane(series, Modifier.fillMaxHeight().weight(0.32f), live = false, previewEnabled = true)
            Column(Modifier.fillMaxHeight().weight(0.68f), verticalArrangement = Arrangement.spacedBy((10 * tv.factor).dp)) {
                // Season tabs row
                if (seasons.size > 1) {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy((8 * tv.factor).dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        items(seasons, key = { it }) { season ->
                            val isSelected = selectedSeason == season
                            FocusGlow(
                                cornerRadius = 999.dp,
                                onClick = { selectedSeason = season },
                                modifier = Modifier.clip(RoundedCornerShape(999.dp)),
                            ) {
                                Box(
                                    Modifier
                                        .background(
                                            if (isSelected) visuals.accent else Color(0x22FFFFFF),
                                            RoundedCornerShape(999.dp)
                                        )
                                        .padding(horizontal = (16 * tv.factor).dp, vertical = (8 * tv.factor).dp),
                                ) {
                                    Text(
                                        "\u0627\u0644\u0645\u0648\u0633\u0645 $season",
                                        color = if (isSelected) Color.Black else Color.White,
                                        fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Medium,
                                        fontSize = (14 * tv.factor).sp,
                                    )
                                }
                            }
                        }
                    }
                }
                // Episodes list
                GlassPanel(Modifier.fillMaxSize(), radius = tv.cardRadius, blur = 18.dp) {
                    if (episodes.isEmpty()) {
                        EmptyState("\u0644\u0645 \u064a\u062a\u0645 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062d\u0644\u0642\u0627\u062a", "\u0627\u0641\u062a\u062d \u0627\u0644\u0645\u0633\u0644\u0633\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649 \u0628\u0639\u062f \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629.", Modifier.fillMaxSize().padding(tv.panelPadding))
                    } else {
                        LazyColumn(
                            Modifier.fillMaxSize().padding(tv.panelPadding),
                            verticalArrangement = Arrangement.spacedBy((8 * tv.factor).dp),
                        ) {
                            items(seasonEpisodes, key = { "${it.seasonNumber}-${it.episodeNumber}-${it.id}" }) { episode ->
                                EpisodeRow(episode, onFocus, onPlay, onFavorite)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PagingChannelList(
    count: Int,
    itemAt: (Int) -> MediaItem?,
    activeId: String?,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
) {
    val tv = rememberTvScale()
    LazyColumn(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy((7 * tv.factor).dp)) {
        items(count, key = { "ch-$it" }) { index ->
            itemAt(index)?.let { item ->
                ChannelRow(
                    item = item,
                    onFocus = onFocus,
                    onClick = onPlay,
                    onFavorite = onFavorite,
                    modifier = Modifier,
                )
            }
        }
    }
}

@Composable
private fun PosterGrid(
    count: Int,
    itemAt: (Int) -> MediaItem?,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
    modifier: Modifier,
) {
    val tv = rememberTvScale()
    if (count == 0) {
        EmptyState("المكتبة فارغة", "زامن السيرفر أو اختر تصنيفاً آخر.", modifier)
        return
    }
    LazyVerticalGrid(
        columns = GridCells.Adaptive(tv.posterWidth),
        horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp),
        verticalArrangement = Arrangement.spacedBy((14 * tv.factor).dp),
        modifier = modifier,
    ) {
        items(count, key = { "poster-$it" }) { index ->
            itemAt(index)?.let { MediaPoster(it, onFocus, onPlay, onFavorite) }
        }
    }
}

@Composable
private fun ReceiverHeader(item: MediaItem?, liveEpg: LiveEpgSnapshot) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val transition = rememberInfiniteTransition(label = "live-header")
    val livePulse by transition.animateFloat(
        initialValue = 0.4f, targetValue = 1.0f,
        animationSpec = infiniteRepeatable(tween(1100, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "live-pulse",
    )
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(tv.cardRadius)).background(Color(0x66110F10)).padding(horizontal = (16 * tv.factor).dp, vertical = (12 * tv.factor).dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp),
    ) {
        Icon(Icons.Rounded.LiveTv, null, tint = visuals.accent, modifier = Modifier.size((28 * tv.factor).dp))
        Column(Modifier.weight(1f)) {
            Text(item?.title ?: "البث المباشر", color = Color.White, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold), maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(liveEpg.current?.title ?: item?.description.orEmpty().ifBlank { "جاهز" }, color = Color(0xCCE3BC78), style = MaterialTheme.typography.bodyMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        // Live pulse indicator
        Box(
            Modifier.size((10 * tv.factor).dp).drawBehind {
                drawCircle(Color(0xFFFF3B4D).copy(alpha = 0.3f * livePulse), radius = size.minDimension * 1.5f)
                drawCircle(Color(0xFFFF3B4D).copy(alpha = livePulse))
            },
        )
        Box(
            Modifier.clip(RoundedCornerShape(999.dp)).background(Color(0xFFFF3B4D).copy(alpha = 0.18f)).padding(horizontal = (10 * tv.factor).dp, vertical = (4 * tv.factor).dp),
        ) {
            Text("LIVE", color = Color(0xFFFF3B4D), style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.ExtraBold))
        }
    }
}

@Composable
fun CategoryRail(
    title: String,
    categories: List<Category>,
    selectedCategoryId: String,
    onCategory: (Category) -> Unit,
    onAllCategories: () -> Unit,
    modifier: Modifier,
) {
    val tv = rememberTvScale()
    GlassPanel(modifier = modifier, radius = tv.cardRadius, blur = 18.dp) {
        Column(Modifier.fillMaxSize().padding(tv.panelPadding), verticalArrangement = Arrangement.spacedBy((6 * tv.factor).dp)) {
            Text(title, color = Color.White, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), maxLines = 2, overflow = TextOverflow.Ellipsis)
            Spacer(Modifier.height((6 * tv.factor).dp))
            LazyColumn(verticalArrangement = Arrangement.spacedBy((4 * tv.factor).dp)) {
                item { CategoryChip("الكل", selectedCategoryId.isBlank(), tv.factor, onAllCategories) }
                items(categories, key = { it.id }) { cat ->
                    CategoryChip(cat.name, selectedCategoryId == cat.id, tv.factor) { onCategory(cat) }
                }
            }
        }
    }
}

@Composable
private fun CategoryPills(
    categories: List<Category>,
    selectedCategoryId: String,
    onCategory: (Category) -> Unit,
    onAllCategories: () -> Unit,
) {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        item { CategoryPill("الكل", selectedCategoryId.isBlank(), onAllCategories) }
        items(categories, key = { it.id }) { cat ->
            CategoryPill(cat.name, selectedCategoryId == cat.id) { onCategory(cat) }
        }
    }
}

@Composable
private fun CategoryChip(name: String, selected: Boolean, factor: Float, onClick: () -> Unit) {
    val visuals = LocalMoVisuals.current
    FocusGlow(
        modifier = Modifier.fillMaxWidth().heightIn(min = (52 * factor).dp).clip(RoundedCornerShape((10 * factor).dp)),
        cornerRadius = (10 * factor).dp,
        onFocused = onClick,
        onClick = onClick,
    ) {
        Box(
            Modifier
                .fillMaxSize()
                .background(if (selected) visuals.accent.copy(alpha = 0.24f) else Color.Transparent)
                .padding(horizontal = (13 * factor).dp, vertical = (10 * factor).dp),
            contentAlignment = Alignment.CenterStart
        ) {
            Text(name, color = if (selected) visuals.accent else Color.White, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = if (selected) FontWeight.ExtraBold else FontWeight.SemiBold), maxLines = 2, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun CategoryPill(name: String, selected: Boolean, onClick: () -> Unit) {
    val visuals = LocalMoVisuals.current
    Box(
        Modifier
            .clip(RoundedCornerShape(999.dp))
            .then(
                if (selected) Modifier.drawBehind {
                    drawCircle(
                        brush = Brush.radialGradient(listOf(visuals.accent.copy(alpha = 0.2f), Color.Transparent)),
                        radius = size.maxDimension,
                    )
                } else Modifier
            )
            .background(if (selected) visuals.accent.copy(alpha = 0.24f) else Color(0x44241914))
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            name,
            color = if (selected) Color.White else Color(0xCCE3BC78),
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = if (selected) FontWeight.ExtraBold else FontWeight.Medium),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun HeaderRow(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    val visuals = LocalMoVisuals.current
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Icon(icon, null, tint = visuals.accent, modifier = Modifier.size(24.dp))
        Text(title, color = Color.White, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
    }
}

@Composable
fun PreviewPane(
    item: MediaItem?,
    modifier: Modifier,
    live: Boolean,
    previewEnabled: Boolean = true,
    liveEpg: LiveEpgSnapshot = LiveEpgSnapshot(),
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    GlassPanel(modifier = modifier, radius = tv.cardRadius, blur = 18.dp) {
        Box(Modifier.fillMaxSize().padding((6 * tv.factor).dp).clip(RoundedCornerShape(tv.cardRadius - 6.dp)).background(Color(0x661E1814))) {
            if (item == null) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("اختر عنصراً للمعاينة", color = Color(0x88FFFFFF), style = MaterialTheme.typography.bodyMedium)
                }
                return@Box
            }
            if (previewEnabled) {
                AsyncImage(item.backdropUrl.ifBlank { item.posterUrl }, item.title, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
            } else {
                Box(Modifier.fillMaxSize().background(Brush.radialGradient(listOf(visuals.accent.copy(alpha = 0.22f), Color(0xFF101827)))))
            }
            Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0x22000000), Color(0xEE01040A)))))
            Column(Modifier.align(Alignment.BottomStart).padding((20 * tv.factor).dp), verticalArrangement = Arrangement.spacedBy((6 * tv.factor).dp)) {
                if (live) GlassTag("مباشر", Icons.Rounded.LiveTv)
                Text(item.title, color = Color.White, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold), maxLines = 2, overflow = TextOverflow.Ellipsis)
                if (item.rating.isNotBlank()) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Rounded.Star, null, tint = Color(0xFFFFCC44), modifier = Modifier.size(14.dp))
                        Text(item.rating, color = Color(0xFFFFCC44), style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                    }
                }
                Text(item.description.ifBlank { if (live) "اضغط OK للتشغيل" else "ستظهر تفاصيل المحتوى هنا" }, color = Color(0xCCE3BC78), style = MaterialTheme.typography.bodyMedium, maxLines = 4, overflow = TextOverflow.Ellipsis)
                if (item.durationSecs > 0) Text(formatDuration(item.durationSecs), color = Color(0x99FFFFFF), style = MaterialTheme.typography.bodySmall)
                liveEpg.current?.let {
                    Text("الآن: ${it.title}", color = visuals.accent, style = MaterialTheme.typography.labelLarge, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
}

@Composable
fun GlassTag(text: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    GlassPanel(radius = 999.dp, highlighted = false) {
        Row(
            Modifier.padding(horizontal = (12 * tv.factor).dp, vertical = (6 * tv.factor).dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy((6 * tv.factor).dp),
        ) {
            Icon(icon, null, tint = visuals.accent, modifier = Modifier.size((14 * tv.factor).dp))
            Text(text, color = Color.White, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
fun EmptyState(title: String, message: String, modifier: Modifier = Modifier) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    GlassPanel(modifier = modifier, radius = tv.cardRadius, contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy((14 * tv.factor).dp), modifier = Modifier.padding((34 * tv.factor).dp)) {
            Box(Modifier.size((82 * tv.factor).dp).clip(RoundedCornerShape(999.dp)).background(visuals.accent.copy(alpha = 0.16f)), contentAlignment = Alignment.Center) {
                Icon(Icons.Rounded.Bookmark, null, tint = visuals.accent, modifier = Modifier.size((38 * tv.factor).dp))
            }
            Text(title, color = Color.White, style = MaterialTheme.typography.headlineMedium)
            Text(message, color = Color(0xB8E3BC78), style = MaterialTheme.typography.bodyLarge, maxLines = 3, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun SeasonSection(
    seasonNumber: Int,
    episodes: List<MediaItem>,
    isExpanded: Boolean,
    onToggle: () -> Unit,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    Column(verticalArrangement = Arrangement.spacedBy((8 * tv.factor).dp)) {
        GlassPanel(radius = (12 * tv.factor).dp, highlighted = isExpanded, modifier = Modifier.fillMaxWidth().clickable(onClick = onToggle)) {
            Row(Modifier.fillMaxWidth().padding(horizontal = (16 * tv.factor).dp, vertical = (12 * tv.factor).dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Rounded.Layers, null, tint = if (isExpanded) visuals.accent else Color.White, modifier = Modifier.size((18 * tv.factor).dp))
                    Text("الموسم $seasonNumber", color = Color.White, style = MaterialTheme.typography.titleLarge)
                    Text("${episodes.size} حلقة", color = Color(0x99FFFFFF), style = MaterialTheme.typography.bodyMedium)
                }
                Icon(if (isExpanded) Icons.Rounded.ExpandLess else Icons.Rounded.ExpandMore, null, tint = Color(0x99FFFFFF))
            }
        }
        AnimatedVisibility(isExpanded) {
            Column(verticalArrangement = Arrangement.spacedBy((6 * tv.factor).dp)) {
                episodes.forEach { episode -> EpisodeRow(episode, onFocus, onPlay, onFavorite) }
            }
        }
    }
}

@Composable
private fun EpisodeRow(
    episode: MediaItem,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val watchPercent = if (episode.watchDurationMs > 0) (episode.watchPositionMs.toFloat() / episode.watchDurationMs).coerceIn(0f, 1f) else 0f
    FocusGlow(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(tv.cardRadius)),
        cornerRadius = tv.cardRadius,
        onFocused = { onFocus(episode) },
        onClick = { onPlay(episode) },
        onLongOk = { onFavorite(episode) },
        onTripleOk = { onFavorite(episode) },
    ) {
        GlassPanel(radius = tv.cardRadius) {
            Column {
                Row(Modifier.fillMaxWidth().padding(horizontal = (14 * tv.factor).dp, vertical = (12 * tv.factor).dp), horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size((50 * tv.factor).dp).clip(RoundedCornerShape((14 * tv.factor).dp)).background(Brush.radialGradient(listOf(visuals.accent.copy(alpha = 0.82f), visuals.accentB))), contentAlignment = Alignment.Center) {
                        Text("${episode.episodeNumber.coerceAtLeast(1)}", color = Color.White, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold))
                    }
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy((3 * tv.factor).dp)) {
                        Text(episode.title.ifBlank { "الحلقة ${episode.episodeNumber}" }, color = Color.White, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(episode.description.ifBlank { "جاهزة للتشغيل" }, color = Color(0x99E3BC78), style = MaterialTheme.typography.bodyMedium, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        if (episode.durationSecs > 0) Text(formatDuration(episode.durationSecs), color = Color(0x66FFFFFF), style = MaterialTheme.typography.bodySmall)
                    }
                    Box(Modifier.size((42 * tv.factor).dp).clip(RoundedCornerShape(999.dp)).background(visuals.accent).clickable { onPlay(episode) }, contentAlignment = Alignment.Center) {
                        Icon(Icons.Rounded.PlayArrow, null, tint = Color.White, modifier = Modifier.size((22 * tv.factor).dp))
                    }
                }
                if (watchPercent > 0.01f) {
                    Box(Modifier.fillMaxWidth().height(3.dp).background(Color(0x22FFFFFF))) {
                        Box(Modifier.fillMaxWidth(watchPercent).fillMaxHeight().background(visuals.accent))
                    }
                }
            }
        }
    }
}

private fun formatDuration(secs: Long): String {
    val h = TimeUnit.SECONDS.toHours(secs)
    val m = TimeUnit.SECONDS.toMinutes(secs) % 60
    return if (h > 0) "${h}h ${m}m" else "${m} min"
}
