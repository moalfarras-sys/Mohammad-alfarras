package com.moalfarras.moplayer.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.gestures.BringIntoViewSpec
import androidx.compose.foundation.gestures.LocalBringIntoViewSpec
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
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
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
import androidx.paging.compose.itemContentType
import androidx.paging.compose.itemKey
import coil3.compose.AsyncImage
import com.moalfarras.moplayer.domain.model.Category
import com.moalfarras.moplayer.core.PerformancePolicy
import com.moalfarras.moplayer.domain.model.LiveEpgSnapshot
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.ui.components.ChannelRow
import com.moalfarras.moplayer.ui.components.CinematicBackdrop
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.components.FocusGlow
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.components.LocalPreviewTrailer
import com.moalfarras.moplayer.ui.components.LocalTrailerErrorReporter
import com.moalfarras.moplayer.ui.components.MediaPoster
import com.moalfarras.moplayer.ui.components.YoutubeTrailerSurface
import com.moalfarras.moplayer.ui.components.backdropUrlFrom
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import com.moalfarras.moplayer.domain.model.WeatherSnapshot
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.animation.core.*
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import java.util.concurrent.TimeUnit

@OptIn(ExperimentalFoundationApi::class)
private val TvEdgeBringIntoViewSpec = object : BringIntoViewSpec {
    override val scrollAnimationSpec: AnimationSpec<Float> = snap()

    override fun calculateScrollDistance(offset: Float, size: Float, containerSize: Float): Float {
        val itemStart = offset
        val itemEnd = offset + size
        return when {
            itemStart < 0f -> itemStart
            itemEnd > containerSize -> itemEnd - containerSize
            else -> 0f
        }
    }
}

@Composable
fun LiveScreen(
    categories: List<Category>,
    channelsFlow: Flow<PagingData<MediaItem>>,
    focused: MediaItem?,
    restoreFocusItem: MediaItem?,
    focusedEpg: LiveEpgSnapshot,
    selectedCategoryId: String,
    previewEnabled: Boolean,
    performancePolicy: PerformancePolicy,
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
    val current = focused ?: restoreFocusItem ?: firstChannel
    val backdrop = remember(current?.id) { backdropUrlFrom(current) }

    Box(
        Modifier.fillMaxSize()
    ) {
        CinematicBackdrop(backdrop, showParticles = performancePolicy.enableParticles, imageSize = performancePolicy.backdropImageSize)
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
                ).focusGroup(),
                horizontalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
            ) {
                CategoryRail(LocalStrings.current.navLive, categories, selectedCategoryId, onCategory, onAllCategories, Modifier.fillMaxHeight().weight(0.18f))
                GlassPanel(Modifier.fillMaxHeight().weight(0.60f), radius = tv.cardRadius, blur = 18.dp) {
                    Column(Modifier.fillMaxSize().padding(tv.panelPadding), verticalArrangement = Arrangement.spacedBy((8 * tv.factor).dp)) {
                        ReceiverHeader(current, focusedEpg, performancePolicy.reduceMotion)
                        PagingChannelList(channels, restoreFocusItem ?: current, onFocus, onPlay, onFavorite)
                    }
                }
                PreviewPane(current, Modifier.fillMaxHeight().weight(0.22f), live = true, previewEnabled = previewEnabled, liveEpg = focusedEpg, performancePolicy = performancePolicy)
            }
        } else {
            Column(
                Modifier.fillMaxSize().padding(tv.contentPadding, tv.contentPadding, tv.contentPadding, tv.contentPadding),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                HeaderRow(LocalStrings.current.navLive, Icons.Rounded.LiveTv)
                CategoryPills(categories, selectedCategoryId, onCategory, onAllCategories)
                PagingChannelList(channels, restoreFocusItem ?: current, onFocus, onPlay, onFavorite)
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
    restoreFocusItem: MediaItem?,
    selectedCategoryId: String,
    previewEnabled: Boolean,
    performancePolicy: PerformancePolicy,
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
        CinematicBackdrop(backdrop, showParticles = performancePolicy.enableParticles, imageSize = performancePolicy.backdropImageSize)
        if (tv.isTv) {
            Row(
                Modifier.fillMaxSize().padding(
                    start = tv.contentPadding,
                    top = tv.contentPadding * 0.6f,
                    end = tv.contentPadding,
                    bottom = tv.contentPadding * 1.5f,
                ).focusGroup(),
                horizontalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
            ) {
                CategoryRail(title, categories, selectedCategoryId, onCategory, onAllCategories, Modifier.fillMaxHeight().weight(0.18f))
                PosterGrid(items, restoreFocusItem, onFocus, onPlay, onFavorite, Modifier.fillMaxHeight().weight(0.64f))
                val firstItem = if (items.itemCount > 0) items.peek(0) else null
                PreviewPane(focused ?: firstItem, Modifier.fillMaxHeight().weight(0.18f), live = false, previewEnabled = previewEnabled, performancePolicy = performancePolicy)
            }
        } else {
            Column(
                Modifier.fillMaxSize().padding(tv.contentPadding, tv.contentPadding, tv.contentPadding, tv.contentPadding),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                HeaderRow(title, Icons.Rounded.Tv)
                CategoryPills(categories, selectedCategoryId, onCategory, onAllCategories)
                PosterGrid(items, restoreFocusItem, onFocus, onPlay, onFavorite, Modifier.fillMaxSize())
            }
        }
    }
}

@Composable
fun FavoritesScreen(
    itemsFlow: Flow<PagingData<MediaItem>>,
    focused: MediaItem?,
    restoreFocusItem: MediaItem?,
    previewEnabled: Boolean,
    performancePolicy: PerformancePolicy,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val items = itemsFlow.collectAsLazyPagingItems()
    val backdrop = remember(focused?.id) { backdropUrlFrom(focused) }

    Box(Modifier.fillMaxSize()) {
        CinematicBackdrop(backdrop, showParticles = performancePolicy.enableParticles, imageSize = performancePolicy.backdropImageSize)
        if (items.itemCount == 0) {
            EmptyState(
                title = LocalStrings.current.noFavoritesTitle,
                message = LocalStrings.current.noFavoritesHint,
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
                ).focusGroup(),
                horizontalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
            ) {
                GlassPanel(Modifier.fillMaxHeight().weight(0.18f), radius = tv.cardRadius, blur = 20.dp) {
                    Column(Modifier.fillMaxSize().padding(tv.panelPadding), verticalArrangement = Arrangement.spacedBy((14 * tv.factor).dp)) {
                        Icon(Icons.Rounded.Favorite, null, tint = visuals.accent, modifier = Modifier.size((36 * tv.factor).dp))
                        Text(LocalStrings.current.navFavorites, color = Color.White, style = MaterialTheme.typography.displaySmall.copy(fontWeight = FontWeight.Bold))
                        Text("Saved channels, movies, and series live here.", color = Color(0xB8E3BC78), style = MaterialTheme.typography.bodyLarge, lineHeight = 24.sp)
                        GlassTag("${items.itemCount} items", Icons.Rounded.Bookmark)
                    }
                }
                PosterGrid(items, restoreFocusItem, onFocus, onPlay, onFavorite, Modifier.fillMaxHeight().weight(0.64f))
                val firstItem = if (items.itemCount > 0) items.peek(0) else null
                PreviewPane(focused ?: firstItem, Modifier.fillMaxHeight().weight(0.18f), live = false, previewEnabled = previewEnabled, performancePolicy = performancePolicy)
            }
        } else {
            Column(
                Modifier.fillMaxSize().padding(tv.contentPadding, tv.contentPadding, tv.contentPadding, tv.contentPadding),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                HeaderRow(LocalStrings.current.navFavorites, Icons.Rounded.Favorite)
                PosterGrid(items, restoreFocusItem, onFocus, onPlay, onFavorite, Modifier.fillMaxSize())
            }
        }
    }
}

@Composable
fun SeriesDetailsScreen(
    series: MediaItem,
    episodes: List<MediaItem>,
    isLoading: Boolean,
    focused: MediaItem?,
    restoreFocusItem: MediaItem?,
    performancePolicy: PerformancePolicy,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val seasons = episodes.map { it.seasonNumber.coerceAtLeast(1) }.distinct().sorted().ifEmpty { listOf(1) }
    val restoredSeason = focused?.takeIf { it.type == com.moalfarras.moplayer.domain.model.ContentType.EPISODE }
        ?.seasonNumber
        ?.coerceAtLeast(1)
        ?.takeIf { it in seasons }
    var selectedSeason by remember(series.id, seasons, restoredSeason) { mutableIntStateOf(restoredSeason ?: seasons.first()) }
    val seasonEpisodes = episodes.filter { it.seasonNumber.coerceAtLeast(1) == selectedSeason }
    val backdrop = remember(series.id) { backdropUrlFrom(series) }

    Box(Modifier.fillMaxSize()) {
        CinematicBackdrop(backdrop, showParticles = performancePolicy.enableParticles, imageSize = performancePolicy.backdropImageSize)
        Row(
            Modifier.fillMaxSize().padding(tv.contentPadding, tv.contentPadding * 0.8f, tv.contentPadding, tv.contentPadding).focusGroup(),
            horizontalArrangement = Arrangement.spacedBy((16 * tv.factor).dp),
        ) {
            PreviewPane(series, Modifier.fillMaxHeight().weight(0.32f), live = false, previewEnabled = performancePolicy.enablePreviewPane, performancePolicy = performancePolicy)
            Column(Modifier.fillMaxHeight().weight(0.68f), verticalArrangement = Arrangement.spacedBy((10 * tv.factor).dp)) {
                Text(
                    LocalStrings.current.seasonsTitle,
                    color = Color.White,
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                    modifier = Modifier.padding(start = 2.dp),
                )
                if (seasons.isNotEmpty()) {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        items(seasons, key = { it }, contentType = { "season" }) { season ->
                            val isSelected = selectedSeason == season
                            FocusGlow(
                                cornerRadius = (18 * tv.factor).dp,
                                onClick = { selectedSeason = season },
                                modifier = Modifier
                                    .height((58 * tv.factor).dp)
                                    .width((132 * tv.factor).dp)
                                    .clip(RoundedCornerShape((18 * tv.factor).dp)),
                            ) {
                                Box(
                                    Modifier
                                        .fillMaxSize()
                                        .drawBehind {
                                            drawRoundRect(
                                                color = if (isSelected) visuals.accent.copy(alpha = 0.35f) else Color.White.copy(alpha = 0.16f),
                                                cornerRadius = androidx.compose.ui.geometry.CornerRadius((18 * tv.factor).dp.toPx()),
                                                style = androidx.compose.ui.graphics.drawscope.Stroke(width = if (isSelected) 3.dp.toPx() else 1.5.dp.toPx()),
                                            )
                                        }
                                        .background(
                                            if (isSelected) {
                                                Brush.horizontalGradient(listOf(visuals.accent, Color(0xFFFFE0A3)))
                                            } else {
                                                Brush.verticalGradient(listOf(Color(0xCC1B1E24), Color(0xE60B0D11)))
                                            },
                                            RoundedCornerShape((18 * tv.factor).dp)
                                        )
                                        .padding(horizontal = (16 * tv.factor).dp, vertical = (8 * tv.factor).dp),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Text(
                                        "${LocalStrings.current.seasonPrefix} $season",
                                        color = if (isSelected) Color(0xFF15110A) else Color.White,
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = (15 * tv.factor).sp,
                                        maxLines = 1,
                                    )
                                }
                            }
                        }
                    }
                }
                // Episodes list
                GlassPanel(Modifier.fillMaxSize(), radius = tv.cardRadius, blur = 18.dp) {
                    if (isLoading && episodes.isEmpty()) {
                        Box(Modifier.fillMaxSize().padding(tv.panelPadding), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                CircularProgressIndicator(color = visuals.accent)
                                Text(LocalStrings.current.loadingSeasonsEpisodes, color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }
                    } else if (episodes.isEmpty()) {
                        EmptyState("Episodes are not loaded", "Open the series again after sync.", Modifier.fillMaxSize().padding(tv.panelPadding))
                    } else if (seasonEpisodes.isEmpty()) {
                        EmptyState("No episodes in Season $selectedSeason", "Choose another season above.", Modifier.fillMaxSize().padding(tv.panelPadding))
                    } else {
                        RestoringEpisodeList(
                            episodes = seasonEpisodes,
                            restoreFocusItem = restoreFocusItem?.takeIf { it.type == com.moalfarras.moplayer.domain.model.ContentType.EPISODE },
                            onFocus = onFocus,
                            onPlay = onPlay,
                            onFavorite = onFavorite,
                            modifier = Modifier.fillMaxSize().padding(tv.panelPadding),
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun PagingChannelList(
    items: androidx.paging.compose.LazyPagingItems<MediaItem>,
    restoreFocusItem: MediaItem?,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
) {
    val tv = rememberTvScale()
    val listState = rememberLazyListState()
    var restoredOnce by remember(restoreFocusItem?.id, restoreFocusItem?.type, restoreFocusItem?.serverId) { mutableStateOf(false) }
    val restoreIndex = remember(items.itemCount, restoreFocusItem) {
        restoreFocusItem?.let { target -> (0 until items.itemCount).firstOrNull { items.peek(it).sameMedia(target) } }
    }
    LaunchedEffect(restoreIndex, restoreFocusItem?.id) {
        if (!restoredOnce && restoreIndex != null) {
            listState.scrollToItem(restoreIndex)
            restoredOnce = true
        }
    }
    CompositionLocalProvider(LocalBringIntoViewSpec provides TvEdgeBringIntoViewSpec) {
        LazyColumn(Modifier.fillMaxSize(), state = listState, verticalArrangement = Arrangement.spacedBy((7 * tv.factor).dp)) {
            items(
                count = items.itemCount,
                key = items.itemKey { mediaKey(it) },
                contentType = items.itemContentType { it.type },
            ) { index ->
                items[index]?.let { item ->
                    val focusRequester = remember(item.id, item.type, item.serverId) { FocusRequester() }
                    val shouldRestore = item.sameMedia(restoreFocusItem)
                    LaunchedEffect(shouldRestore, restoreIndex, restoredOnce) {
                        if (shouldRestore && restoreIndex != null && restoredOnce) {
                            delay(120)
                            runCatching { focusRequester.requestFocus() }
                        }
                    }
                    ChannelRow(
                        item = item,
                        onFocus = {
                            onFocus(it)
                        },
                        onClick = onPlay,
                        onFavorite = onFavorite,
                        modifier = Modifier,
                        focusRequester = focusRequester,
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun PosterGrid(
    items: androidx.paging.compose.LazyPagingItems<MediaItem>,
    restoreFocusItem: MediaItem?,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
    modifier: Modifier,
) {
    val tv = rememberTvScale()
    if (items.itemCount == 0) {
        // Distinguish the first paging load from a genuinely empty category so the grid never
        // flashes a misleading "empty" card while the cached library is still being read.
        val s = com.moalfarras.moplayer.ui.i18n.LocalStrings.current
        val loading = items.loadState.refresh is androidx.paging.LoadState.Loading
        EmptyState(
            title = if (loading) s.homeLibraryLoadingTitle else s.homeLibraryEmptyTitle,
            message = if (loading) s.homeLibraryLoadingBody else s.homeLibraryEmptyBody,
            modifier = modifier,
        )
        return
    }
    val gridState = rememberLazyGridState()
    var restoredOnce by remember(restoreFocusItem?.id, restoreFocusItem?.type, restoreFocusItem?.serverId) { mutableStateOf(false) }
    val restoreIndex = remember(items.itemCount, restoreFocusItem) {
        restoreFocusItem?.let { target -> (0 until items.itemCount).firstOrNull { items.peek(it).sameMedia(target) } }
    }
    LaunchedEffect(restoreIndex, restoreFocusItem?.id) {
        if (!restoredOnce && restoreIndex != null) {
            gridState.scrollToItem(restoreIndex)
            restoredOnce = true
        }
    }
    CompositionLocalProvider(LocalBringIntoViewSpec provides TvEdgeBringIntoViewSpec) {
        LazyVerticalGrid(
            columns = GridCells.Adaptive(tv.posterWidth),
            horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp),
            verticalArrangement = Arrangement.spacedBy((14 * tv.factor).dp),
            state = gridState,
            contentPadding = PaddingValues(bottom = if (tv.isTv) tv.bottomBarHeight + tv.contentPadding else tv.contentPadding),
            modifier = modifier,
        ) {
            items(
                count = items.itemCount,
                key = items.itemKey { mediaKey(it) },
                contentType = items.itemContentType { it.type },
            ) { index ->
                items[index]?.let { item ->
                    val focusRequester = remember(item.id, item.type, item.serverId) { FocusRequester() }
                    val shouldRestore = item.sameMedia(restoreFocusItem)
                    LaunchedEffect(shouldRestore, restoreIndex, restoredOnce) {
                        if (shouldRestore && restoreIndex != null && restoredOnce) {
                            delay(120)
                            runCatching { focusRequester.requestFocus() }
                        }
                    }
                    MediaPoster(
                        item = item,
                        onFocus = {
                            onFocus(it)
                        },
                        onClick = onPlay,
                        onFavorite = onFavorite,
                        focusRequester = focusRequester,
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun RestoringEpisodeList(
    episodes: List<MediaItem>,
    restoreFocusItem: MediaItem?,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
    modifier: Modifier,
) {
    val tv = rememberTvScale()
    val listState = rememberLazyListState()
    var restoredOnce by remember(restoreFocusItem?.id, restoreFocusItem?.type, restoreFocusItem?.serverId) { mutableStateOf(false) }
    val restoreIndex = remember(episodes, restoreFocusItem) {
        restoreFocusItem?.let { target -> episodes.indexOfFirst { it.sameMedia(target) }.takeIf { it >= 0 } }
    }
    LaunchedEffect(restoreIndex, restoreFocusItem?.id) {
        if (!restoredOnce && restoreIndex != null) {
            listState.scrollToItem(restoreIndex)
            restoredOnce = true
        }
    }
    CompositionLocalProvider(LocalBringIntoViewSpec provides TvEdgeBringIntoViewSpec) {
        LazyColumn(
            modifier,
            state = listState,
            verticalArrangement = Arrangement.spacedBy((8 * tv.factor).dp),
        ) {
            items(
                episodes,
                key = { "${it.seasonNumber}-${it.episodeNumber}-${mediaKey(it)}" },
                contentType = { "episode" },
            ) { episode ->
                val focusRequester = remember(episode.id, episode.seasonNumber, episode.episodeNumber) { FocusRequester() }
                val shouldRestore = episode.sameMedia(restoreFocusItem)
                LaunchedEffect(shouldRestore, restoreIndex, restoredOnce) {
                    if (shouldRestore && restoreIndex != null && restoredOnce) {
                        delay(120)
                        runCatching { focusRequester.requestFocus() }
                    }
                }
                EpisodeRow(
                    episode = episode,
                    onFocus = {
                        onFocus(it)
                    },
                    onPlay = onPlay,
                    onFavorite = onFavorite,
                    focusRequester = focusRequester,
                )
            }
        }
    }
}

@Composable
private fun ReceiverHeader(item: MediaItem?, liveEpg: LiveEpgSnapshot, reduceMotion: Boolean = false) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    // Only run the continuous "LIVE" pulse when motion is allowed. On calm-motion TVs this
    // lets the whole browse screen reach idle (zero redraws) instead of repainting every
    // vsync just to blink a dot, which is what kept the receiver screen from ever settling.
    val livePulse = if (reduceMotion) {
        1f
    } else {
        val transition = rememberInfiniteTransition(label = "live-header")
        val pulse by transition.animateFloat(
            initialValue = 0.4f, targetValue = 1.0f,
            animationSpec = infiniteRepeatable(tween(1100, easing = FastOutSlowInEasing), RepeatMode.Reverse),
            label = "live-pulse",
        )
        pulse
    }
    val current = liveEpg.current
    val next = liveEpg.next
    val nowMs = System.currentTimeMillis()
    val progress = current?.let {
        val span = (it.endAt - it.startAt).toFloat()
        if (span > 0f && it.endAt > 0L) ((nowMs - it.startAt) / span).coerceIn(0f, 1f) else null
    }
    Column(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(tv.cardRadius)).background(Color(0x66110F10)).padding(horizontal = (16 * tv.factor).dp, vertical = (12 * tv.factor).dp),
        verticalArrangement = Arrangement.spacedBy((8 * tv.factor).dp),
    ) {
        Row(
            Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp),
        ) {
            Icon(Icons.Rounded.LiveTv, null, tint = visuals.accent, modifier = Modifier.size((28 * tv.factor).dp))
            Column(Modifier.weight(1f)) {
                Text(item?.title ?: LocalStrings.current.navLive, color = Color.White, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    current?.let { c -> "${epgClock(c.startAt)} - ${epgClock(c.endAt)}  •  ${c.title}" }
                        ?: item?.description.orEmpty().ifBlank { "Ready" },
                    color = Color(0xCCE3BC78), style = MaterialTheme.typography.bodyMedium, maxLines = 1, overflow = TextOverflow.Ellipsis,
                )
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
        if (progress != null) {
            Box(
                Modifier.fillMaxWidth().height((4 * tv.factor).dp).clip(RoundedCornerShape(999.dp)).background(Color(0x33FFFFFF)),
            ) {
                Box(
                    Modifier.fillMaxWidth(progress).fillMaxHeight().clip(RoundedCornerShape(999.dp))
                        .background(Brush.horizontalGradient(listOf(visuals.accent, visuals.accentB))),
                )
            }
        }
        if (next != null && next.title.isNotBlank()) {
            Text(
                "Next ${epgClock(next.startAt)}  •  ${next.title}",
                color = Color(0x99FFFFFF), style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

private fun epgClock(epochMs: Long): String {
    if (epochMs <= 0L) return "--:--"
    return runCatching {
        java.time.Instant.ofEpochMilli(epochMs)
            .atZone(java.time.ZoneId.systemDefault())
            .format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"))
    }.getOrDefault("--:--")
}

@OptIn(ExperimentalFoundationApi::class)
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
    val categoryState = rememberLazyListState()
    val selectedIndex = remember(categories, selectedCategoryId) {
        if (selectedCategoryId.isBlank()) {
            0
        } else {
            categories.indexOfFirst { it.id == selectedCategoryId }.takeIf { it >= 0 }?.plus(1) ?: 0
        }
    }
    LaunchedEffect(selectedIndex) {
        categoryState.scrollToItem(selectedIndex)
    }
    GlassPanel(modifier = modifier, radius = tv.cardRadius, blur = 18.dp) {
        Column(Modifier.fillMaxSize().padding(tv.panelPadding), verticalArrangement = Arrangement.spacedBy((6 * tv.factor).dp)) {
            Text(title, color = Color.White, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), maxLines = 2, overflow = TextOverflow.Ellipsis)
            Spacer(Modifier.height((6 * tv.factor).dp))
            CompositionLocalProvider(LocalBringIntoViewSpec provides TvEdgeBringIntoViewSpec) {
                LazyColumn(
                    state = categoryState,
                    verticalArrangement = Arrangement.spacedBy((4 * tv.factor).dp),
                    modifier = Modifier.focusGroup(),
                ) {
                    item {
                        CategoryChip("All", selectedCategoryId.isBlank(), tv.factor, onClick = onAllCategories)
                    }
                    items(
                        categories.size,
                        key = { categories[it].id },
                        contentType = { "category" },
                    ) { index ->
                        val cat = categories[index]
                        CategoryChip(
                            cat.name,
                            selectedCategoryId == cat.id,
                            tv.factor,
                        ) { onCategory(cat) }
                    }
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
    val categoryState = rememberLazyListState()
    val selectedIndex = remember(categories, selectedCategoryId) {
        if (selectedCategoryId.isBlank()) {
            0
        } else {
            categories.indexOfFirst { it.id == selectedCategoryId }.takeIf { it >= 0 }?.plus(1) ?: 0
        }
    }
    LaunchedEffect(selectedIndex) {
        categoryState.scrollToItem(selectedIndex)
    }
    LazyRow(
        state = categoryState,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.focusGroup(),
    ) {
        item { CategoryPill("All", selectedCategoryId.isBlank(), onAllCategories) }
        items(categories, key = { it.id }, contentType = { "category" }) { cat ->
            CategoryPill(cat.name, selectedCategoryId == cat.id) { onCategory(cat) }
        }
    }
}

@Composable
private fun CategoryChip(name: String, selected: Boolean, factor: Float, onFocused: () -> Unit = {}, onClick: () -> Unit) {
    val visuals = LocalMoVisuals.current
    FocusGlow(
        modifier = Modifier.fillMaxWidth().heightIn(min = (52 * factor).dp).clip(RoundedCornerShape((10 * factor).dp)),
        cornerRadius = (10 * factor).dp,
        onFocused = onFocused,
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
    FocusGlow(cornerRadius = 999.dp, onClick = onClick) {
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
}

private fun mediaKey(item: MediaItem): String = "${item.type}:${item.serverId}:${item.id}"

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
    performancePolicy: PerformancePolicy? = null,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    GlassPanel(modifier = modifier, radius = tv.cardRadius, blur = 18.dp) {
        Box(Modifier.fillMaxSize().padding((6 * tv.factor).dp).clip(RoundedCornerShape(tv.cardRadius - 6.dp)).background(Color(0x661E1814))) {
            if (item == null) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(LocalStrings.current.previewChooseItem, color = Color(0x88FFFFFF), style = MaterialTheme.typography.bodyMedium)
                }
                return@Box
            }
            val previewArt = item.backdropUrl.ifBlank { item.posterUrl }
            if (previewEnabled && performancePolicy?.enablePreviewPane != false && previewArt.isNotBlank()) {
                AsyncImage(previewArt, item.title, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
            } else {
                Box(Modifier.fillMaxSize().background(Brush.radialGradient(listOf(visuals.accent.copy(alpha = 0.22f), Color(0xFF101827)))))
            }
            // Muted autoplay trailer, layered over the backdrop once it has resolved for THIS item.
            // It fades itself in over the art; the scrim + title/description below stay on top, so the
            // existing preview look is untouched — the trailer is purely an added layer.
            val trailer = LocalPreviewTrailer.current
            val showTrailer = previewEnabled &&
                performancePolicy?.enablePreviewPane != false &&
                trailer.youtubeId.isNotBlank() &&
                trailer.itemKey == mediaKey(item)
            if (showTrailer) {
                val reportTrailerError = LocalTrailerErrorReporter.current
                YoutubeTrailerSurface(
                    itemKey = trailer.itemKey,
                    youtubeId = trailer.youtubeId,
                    modifier = Modifier.fillMaxSize(),
                    onError = { reportTrailerError(trailer.itemKey) },
                )
            }
            Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0x22000000), Color(0xEE01040A)))))
            Column(Modifier.align(Alignment.BottomStart).padding((20 * tv.factor).dp), verticalArrangement = Arrangement.spacedBy((6 * tv.factor).dp)) {
                if (live) GlassTag("Live", Icons.Rounded.LiveTv)
                Text(item.title, color = Color.White, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold), maxLines = 2, overflow = TextOverflow.Ellipsis)
                if (item.rating.isNotBlank()) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Rounded.Star, null, tint = Color(0xFFFFCC44), modifier = Modifier.size(14.dp))
                        Text(item.rating, color = Color(0xFFFFCC44), style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                    }
                }
                Text(item.description.ifBlank { if (live) LocalStrings.current.pressOkToPlay else "Content details will appear here" }, color = Color(0xCCE3BC78), style = MaterialTheme.typography.bodyMedium, maxLines = 4, overflow = TextOverflow.Ellipsis)
                if (item.durationSecs > 0) Text(formatDuration(item.durationSecs), color = Color(0x99FFFFFF), style = MaterialTheme.typography.bodySmall)
                liveEpg.current?.let {
                    Text("Now: ${it.title}", color = visuals.accent, style = MaterialTheme.typography.labelLarge, maxLines = 1, overflow = TextOverflow.Ellipsis)
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
                    Text("${LocalStrings.current.seasonPrefix} $seasonNumber", color = Color.White, style = MaterialTheme.typography.titleLarge)
                    Text("${episodes.size} episodes", color = Color(0x99FFFFFF), style = MaterialTheme.typography.bodyMedium)
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
    focusRequester: FocusRequester? = null,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val watchPercent = if (episode.watchDurationMs > 0) (episode.watchPositionMs.toFloat() / episode.watchDurationMs).coerceIn(0f, 1f) else 0f
    FocusGlow(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(tv.cardRadius)),
        cornerRadius = tv.cardRadius,
        focusRequester = focusRequester,
        onFocused = { onFocus(episode) },
        onClick = { onPlay(episode) },
        onLongOk = { onFavorite(episode) },
        onTripleOk = { onFavorite(episode) },
        delayClickForTripleOk = true,
    ) {
        GlassPanel(radius = tv.cardRadius) {
            Column {
                Row(Modifier.fillMaxWidth().padding(horizontal = (14 * tv.factor).dp, vertical = (12 * tv.factor).dp), horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size((50 * tv.factor).dp).clip(RoundedCornerShape((14 * tv.factor).dp)).background(Brush.radialGradient(listOf(visuals.accent.copy(alpha = 0.82f), visuals.accentB))), contentAlignment = Alignment.Center) {
                        Text("${episode.episodeNumber.coerceAtLeast(1)}", color = Color.White, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold))
                    }
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy((3 * tv.factor).dp)) {
                        Text(episode.title.ifBlank { "Episode ${episode.episodeNumber}" }, color = Color.White, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(episode.description.ifBlank { "Ready to play" }, color = Color(0x99E3BC78), style = MaterialTheme.typography.bodyMedium, maxLines = 2, overflow = TextOverflow.Ellipsis)
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

private fun MediaItem?.sameMedia(other: MediaItem?): Boolean =
    this != null &&
        other != null &&
        id == other.id &&
        type == other.type &&
        serverId == other.serverId

private fun formatDuration(secs: Long): String {
    val h = TimeUnit.SECONDS.toHours(secs)
    val m = TimeUnit.SECONDS.toMinutes(secs) % 60
    return if (h > 0) "${h}h ${m}m" else "${m} min"
}
