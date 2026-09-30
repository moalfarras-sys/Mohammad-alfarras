package com.moalfarras.moplayer.ui.screens

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.gestures.LocalBringIntoViewSpec
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bookmark
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.LiveTv
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material.icons.rounded.Tv
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.paging.LoadState
import androidx.paging.PagingData
import androidx.paging.compose.LazyPagingItems
import androidx.paging.compose.collectAsLazyPagingItems
import androidx.paging.compose.itemContentType
import androidx.paging.compose.itemKey
import com.moalfarras.moplayer.core.PerformancePolicy
import com.moalfarras.moplayer.domain.model.Category
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.EpgEntry
import com.moalfarras.moplayer.domain.model.LiveEpgSnapshot
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.ui.components.ArtworkPlaceholder
import com.moalfarras.moplayer.ui.components.CARD_CLICK_GUARD_MS
import com.moalfarras.moplayer.ui.components.ChannelLogo
import com.moalfarras.moplayer.ui.components.ChannelRow
import com.moalfarras.moplayer.ui.components.CinematicBackdrop
import com.moalfarras.moplayer.ui.components.FOCUS_REQUEST_DELAY_MS
import com.moalfarras.moplayer.ui.components.FavoriteBurst
import com.moalfarras.moplayer.ui.components.FocusGlow
import com.moalfarras.moplayer.ui.components.FocusScale
import com.moalfarras.moplayer.ui.components.GlassPanel
import com.moalfarras.moplayer.ui.components.LocalFocusGlowFocused
import com.moalfarras.moplayer.ui.components.LocalPreviewTrailer
import com.moalfarras.moplayer.ui.components.LocalReduceMotion
import com.moalfarras.moplayer.ui.components.LocalTrailerErrorReporter
import com.moalfarras.moplayer.ui.components.MediaPoster
import com.moalfarras.moplayer.ui.components.PreviewTrailerHost
import com.moalfarras.moplayer.ui.components.RemoteArtImage
import com.moalfarras.moplayer.ui.components.WatchProgressBar
import com.moalfarras.moplayer.ui.components.backdropUrlFrom
import com.moalfarras.moplayer.ui.components.optimizedPosterUrl
import com.moalfarras.moplayer.ui.components.rememberFavoriteFeedback
import com.moalfarras.moplayer.ui.components.rememberTvBringIntoViewSpec
import com.moalfarras.moplayer.ui.components.scrollToPivotIfNeeded
import com.moalfarras.moplayer.ui.i18n.HomeStrings
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.home
import com.moalfarras.moplayer.ui.i18n.ltr
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit

/** Focus must rest this long on a title before the full-screen backdrop follows it. */
private const val BACKDROP_SETTLE_MS = 280L
private const val EPG_TICK_MS = 30_000L

private val LiveVignette = Brush.verticalGradient(
    colorStops = arrayOf(0.0f to Color.Transparent, 0.85f to Color.Black.copy(alpha = 0.3f), 1.0f to Color.Black.copy(alpha = 0.5f)),
)
private val EpgClockFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

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
    val strings = LocalStrings.current
    val h = strings.home
    val channels = channelsFlow.collectAsLazyPagingItems()
    val firstChannel = if (channels.itemCount > 0) channels.peek(0) else null
    val current = focused ?: restoreFocusItem ?: firstChannel
    // Restore only on entry, on return from the player and after a category change — never the
    // live cursor, which used to re-scroll the focused row to the top on every D-pad press.
    val listRestoreTarget = restoreFocusItem ?: firstChannel.takeIf { focused == null && tv.isTv }
    val categoryTitle = remember(categories, selectedCategoryId, h) {
        categories.firstOrNull { it.id == selectedCategoryId }?.name ?: h.allChannels
    }

    CompositionLocalProvider(LocalReduceMotion provides performancePolicy.reduceMotion) {
        Box(Modifier.fillMaxSize()) {
            // Live items never carry a backdrop, so the screen keeps the static branded base.
            CinematicBackdrop(null, showParticles = performancePolicy.enableParticles, imageSize = performancePolicy.backdropImageSize)
            Box(Modifier.fillMaxSize().background(LiveVignette))
            if (tv.isTv) {
                Row(
                    Modifier
                        .fillMaxSize()
                        .padding(horizontal = tv.contentPadding, vertical = tv.verticalSafePadding)
                        .focusGroup(),
                    horizontalArrangement = Arrangement.spacedBy(tv.u(12f)),
                ) {
                    CategoryRail(strings.navLive, categories, selectedCategoryId, onCategory, onAllCategories, Modifier.fillMaxHeight().weight(0.20f))
                    GlassPanel(Modifier.fillMaxHeight().weight(0.52f), radius = tv.cardRadius) {
                        Column(Modifier.fillMaxSize().padding(tv.u(10f)), verticalArrangement = Arrangement.spacedBy(tv.u(8f))) {
                            LiveListHeader(categoryTitle)
                            PagingChannelList(
                                items = channels,
                                restoreFocusItem = listRestoreTarget,
                                onFocus = onFocus,
                                onPlay = onPlay,
                                onFavorite = onFavorite,
                                contentPadding = PaddingValues(horizontal = tv.u(4f), vertical = tv.u(6f)),
                            )
                        }
                    }
                    PreviewPane(
                        current,
                        Modifier.fillMaxHeight().weight(0.28f),
                        live = true,
                        previewEnabled = previewEnabled,
                        liveEpg = focusedEpg,
                        performancePolicy = performancePolicy,
                    )
                }
            } else {
                Column(
                    Modifier.fillMaxSize().padding(tv.contentPadding),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    HeaderRow(strings.navLive, Icons.Rounded.LiveTv)
                    CategoryPills(categories, selectedCategoryId, onCategory, onAllCategories)
                    PagingChannelList(channels, restoreFocusItem, onFocus, onPlay, onFavorite)
                }
            }
        }
    }
}

@Composable
private fun LiveListHeader(title: String) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(tv.u(12f)))
            .background(Color(0x66110F10))
            .padding(horizontal = tv.u(14f), vertical = tv.u(9f)),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(tv.u(10f)),
    ) {
        Icon(Icons.Rounded.LiveTv, null, tint = visuals.accent, modifier = Modifier.size(tv.u(22f)))
        Text(
            title,
            color = Color.White,
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
        )
        LiveBadge(strings.badgeLive)
    }
}

@Composable
private fun LiveBadge(label: String) {
    val visuals = LocalMoVisuals.current
    Row(
        Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(visuals.live.copy(alpha = 0.18f))
            .padding(horizontal = 10.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Box(Modifier.size(7.dp).clip(CircleShape).background(visuals.live))
        Text(label, color = visuals.live, style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.ExtraBold), maxLines = 1)
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
    val firstItem = if (items.itemCount > 0) items.peek(0) else null
    val backdrop = rememberSettledBackdrop(focused, firstItem, performancePolicy.enableFocusBackdropUpdates)
    // One-shot per screen entry: focus the grid (or the rail when the grid is empty) until
    // anything on the screen has focus. A category change never pulls focus off the rail.
    var screenHasFocus by remember { mutableStateOf(false) }
    var entryFocusPending by remember { mutableStateOf(tv.isTv) }
    LaunchedEffect(screenHasFocus) { if (screenHasFocus) entryFocusPending = false }

    CompositionLocalProvider(LocalReduceMotion provides performancePolicy.reduceMotion) {
        Box(Modifier.fillMaxSize()) {
            CinematicBackdrop(backdrop, showParticles = performancePolicy.enableParticles, imageSize = performancePolicy.backdropImageSize)
            if (tv.isTv) {
                val gridEmpty = items.itemCount == 0 && items.loadState.refresh is LoadState.NotLoading
                Row(
                    Modifier
                        .fillMaxSize()
                        .padding(horizontal = tv.contentPadding, vertical = tv.verticalSafePadding)
                        .onFocusChanged { screenHasFocus = it.hasFocus }
                        .focusGroup(),
                    horizontalArrangement = Arrangement.spacedBy(tv.u(12f)),
                ) {
                    CategoryRail(
                        title,
                        categories,
                        selectedCategoryId,
                        onCategory,
                        onAllCategories,
                        Modifier.fillMaxHeight().weight(0.19f),
                        requestInitialFocus = entryFocusPending && gridEmpty,
                    )
                    PosterGrid(items, restoreFocusItem, onFocus, onPlay, onFavorite, Modifier.fillMaxHeight().weight(0.55f), entryFocus = entryFocusPending)
                    PreviewPane(focused ?: firstItem, Modifier.fillMaxHeight().weight(0.26f), live = false, previewEnabled = previewEnabled, performancePolicy = performancePolicy)
                }
            } else {
                Column(
                    Modifier.fillMaxSize().padding(tv.contentPadding),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    HeaderRow(title, Icons.Rounded.Tv)
                    CategoryPills(categories, selectedCategoryId, onCategory, onAllCategories)
                    PosterGrid(items, restoreFocusItem, onFocus, onPlay, onFavorite, Modifier.fillMaxSize())
                }
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
    val strings = LocalStrings.current
    val h = strings.home
    val items = itemsFlow.collectAsLazyPagingItems()
    val firstItem = if (items.itemCount > 0) items.peek(0) else null
    val backdrop = rememberSettledBackdrop(focused, firstItem, performancePolicy.enableFocusBackdropUpdates)
    var screenHasFocus by remember { mutableStateOf(false) }
    var entryFocusPending by remember { mutableStateOf(tv.isTv) }
    LaunchedEffect(screenHasFocus) { if (screenHasFocus) entryFocusPending = false }

    CompositionLocalProvider(LocalReduceMotion provides performancePolicy.reduceMotion) {
        Box(Modifier.fillMaxSize()) {
            CinematicBackdrop(backdrop, showParticles = performancePolicy.enableParticles, imageSize = performancePolicy.backdropImageSize)
            if (items.itemCount == 0 && items.loadState.refresh is LoadState.NotLoading) {
                EmptyState(
                    title = strings.noFavoritesTitle,
                    message = h.favoritesEmptyHint,
                    modifier = Modifier.fillMaxSize().padding(horizontal = tv.contentPadding, vertical = tv.verticalSafePadding.coerceAtLeast(tv.contentPadding)),
                )
                return@Box
            }
            if (tv.isTv) {
                Row(
                    Modifier
                        .fillMaxSize()
                        .padding(horizontal = tv.contentPadding, vertical = tv.verticalSafePadding)
                        .onFocusChanged { screenHasFocus = it.hasFocus }
                        .focusGroup(),
                    horizontalArrangement = Arrangement.spacedBy(tv.u(12f)),
                ) {
                    GlassPanel(Modifier.fillMaxHeight().weight(0.19f), radius = tv.cardRadius) {
                        Column(Modifier.fillMaxSize().padding(tv.panelPadding), verticalArrangement = Arrangement.spacedBy(tv.u(12f))) {
                            Icon(Icons.Rounded.Favorite, null, tint = visuals.accent, modifier = Modifier.size(tv.u(30f)))
                            Text(strings.navFavorites, color = Color.White, style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold))
                            Text(h.favoritesSubtitle, color = Color(0xB8E3BC78), style = MaterialTheme.typography.bodyMedium)
                            GlassTag(h.itemsCount(items.itemCount), Icons.Rounded.Bookmark)
                        }
                    }
                    PosterGrid(
                        items,
                        restoreFocusItem,
                        onFocus,
                        onPlay,
                        onFavorite,
                        Modifier.fillMaxHeight().weight(0.55f),
                        entryFocus = entryFocusPending,
                        showFavoriteMark = false,
                    )
                    PreviewPane(focused ?: firstItem, Modifier.fillMaxHeight().weight(0.26f), live = false, previewEnabled = previewEnabled, performancePolicy = performancePolicy)
                }
            } else {
                Column(
                    Modifier.fillMaxSize().padding(tv.contentPadding),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    HeaderRow(strings.navFavorites, Icons.Rounded.Favorite)
                    PosterGrid(items, restoreFocusItem, onFocus, onPlay, onFavorite, Modifier.fillMaxSize(), showFavoriteMark = false)
                }
            }
        }
    }
}

/**
 * The item whose art the full-screen backdrop shows. When the policy allows focus-driven
 * backdrops it follows focus only after focus rests for [BACKDROP_SETTLE_MS] (so holding the
 * D-pad does not start a download + decode per card); otherwise it stays on [fallback].
 */
@Composable
private fun rememberSettledBackdrop(focused: MediaItem?, fallback: MediaItem?, followFocus: Boolean): String? {
    val wanted = if (followFocus) focused ?: fallback else fallback
    val latestWanted by rememberUpdatedState(wanted)
    var settled by remember { mutableStateOf(wanted) }
    LaunchedEffect(wanted?.let(::mediaKey), followFocus) {
        if (settled != null && followFocus) delay(BACKDROP_SETTLE_MS)
        settled = latestWanted
    }
    return remember(settled?.let(::mediaKey), settled?.backdropUrl, settled?.posterUrl) {
        backdropUrlFrom(settled, preferCachedPoster = true)
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
    val strings = LocalStrings.current
    val h = strings.home
    val seasons = remember(episodes) { episodes.map { it.seasonNumber.coerceAtLeast(1) }.distinct().sorted().ifEmpty { listOf(1) } }
    // The episode that takes focus when the screen opens: the restored one (back from the player),
    // else the last watched, else the first episode.
    val entryEpisode = remember(series.id, episodes.isEmpty()) { entryEpisodeFor(episodes, restoreFocusItem ?: focused) }
    var selectedSeason by remember(series.id) { mutableIntStateOf(entryEpisode?.seasonNumber?.coerceAtLeast(1) ?: seasons.first()) }
    LaunchedEffect(entryEpisode?.let(::mediaKey)) {
        entryEpisode?.let { selectedSeason = it.seasonNumber.coerceAtLeast(1) }
    }
    var entryConsumed by remember(series.id) { mutableStateOf(false) }
    val seasonEpisodes = remember(episodes, selectedSeason) { episodes.filter { it.seasonNumber.coerceAtLeast(1) == selectedSeason } }
    val backdrop = remember(series.id, series.backdropUrl, series.posterUrl) { backdropUrlFrom(series) }
    val selectedSeasonFocus = remember { FocusRequester() }
    var screenHasFocus by remember { mutableStateOf(false) }
    val wrappedOnFocus: (MediaItem) -> Unit = { item ->
        entryConsumed = true
        onFocus(item)
    }
    // While episodes load there is nothing to focus but the season picker — keep a highlight visible.
    LaunchedEffect(episodes.isEmpty(), screenHasFocus) {
        if (tv.isTv && episodes.isEmpty() && !screenHasFocus) {
            delay(FOCUS_REQUEST_DELAY_MS)
            runCatching { selectedSeasonFocus.requestFocus() }
        }
    }

    CompositionLocalProvider(LocalReduceMotion provides performancePolicy.reduceMotion) {
        Box(Modifier.fillMaxSize()) {
            CinematicBackdrop(backdrop, showParticles = performancePolicy.enableParticles, imageSize = performancePolicy.backdropImageSize)
            Row(
                Modifier
                    .fillMaxSize()
                    .padding(horizontal = tv.contentPadding, vertical = tv.verticalSafePadding.coerceAtLeast(tv.contentPadding * 0.5f))
                    .onFocusChanged { screenHasFocus = it.hasFocus }
                    .focusGroup(),
                horizontalArrangement = Arrangement.spacedBy(tv.u(16f)),
            ) {
                PreviewPane(series, Modifier.fillMaxHeight().weight(0.30f), live = false, previewEnabled = performancePolicy.enablePreviewPane, performancePolicy = performancePolicy)
                Column(Modifier.fillMaxHeight().weight(0.70f), verticalArrangement = Arrangement.spacedBy(tv.u(10f))) {
                    Text(
                        strings.seasonsTitle,
                        color = Color.White,
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                        modifier = Modifier.padding(start = 2.dp),
                    )
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(tv.u(10f)),
                        contentPadding = PaddingValues(horizontal = 6.dp, vertical = 6.dp),
                        // Coming up from the episodes always lands on the selected season.
                        modifier = Modifier
                            .fillMaxWidth()
                            .focusProperties { onEnter = { runCatching { selectedSeasonFocus.requestFocus() } } }
                            .focusGroup(),
                    ) {
                        items(seasons, key = { it }, contentType = { "season" }) { season ->
                            SeasonChip(
                                label = "${strings.seasonPrefix} ${season.toString().ltr()}",
                                selected = selectedSeason == season,
                                focusRequester = if (selectedSeason == season) selectedSeasonFocus else null,
                                onClick = { selectedSeason = season },
                            )
                        }
                    }
                    GlassPanel(Modifier.fillMaxWidth().weight(1f), radius = tv.cardRadius) {
                        when {
                            isLoading && episodes.isEmpty() -> Box(Modifier.fillMaxSize().padding(tv.panelPadding), contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    CircularProgressIndicator(color = visuals.accent)
                                    Text(strings.loadingSeasonsEpisodes, color = Color.White, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold))
                                }
                            }
                            episodes.isEmpty() -> EmptyState(h.episodesNotLoadedTitle, h.episodesNotLoadedBody, Modifier.fillMaxSize().padding(tv.panelPadding))
                            seasonEpisodes.isEmpty() -> EmptyState(h.noEpisodesInSeasonTitle(selectedSeason), h.noEpisodesInSeasonBody, Modifier.fillMaxSize().padding(tv.panelPadding))
                            // Keyed by season so switching seasons starts at the top of the new list.
                            else -> key(selectedSeason) {
                                RestoringEpisodeList(
                                    episodes = seasonEpisodes,
                                    restoreFocusItem = entryEpisode.takeIf { !entryConsumed },
                                    onFocus = wrappedOnFocus,
                                    onPlay = onPlay,
                                    onFavorite = onFavorite,
                                    modifier = Modifier.fillMaxSize().padding(horizontal = tv.u(10f)),
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

/** Episode to focus when a series opens: [target] if it is an episode, else the last watched, else the first. */
internal fun entryEpisodeFor(episodes: List<MediaItem>, target: MediaItem?): MediaItem? {
    if (episodes.isEmpty()) return null
    target?.takeIf { it.type == ContentType.EPISODE }?.let { wanted ->
        episodes.firstOrNull { it.sameMedia(wanted) }?.let { return it }
    }
    episodes.filter { it.lastPlayedAt > 0 }.maxByOrNull { it.lastPlayedAt }?.let { return it }
    return episodes.minWithOrNull(compareBy<MediaItem>({ it.seasonNumber.coerceAtLeast(1) }, { it.episodeNumber }))
}

@Composable
private fun SeasonChip(label: String, selected: Boolean, focusRequester: FocusRequester?, onClick: () -> Unit) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    FocusGlow(
        cornerRadius = 999.dp,
        focusRequester = focusRequester,
        onClick = onClick,
        focusedScale = FocusScale.Chip,
        glowElevation = 8.dp,
        modifier = Modifier.heightIn(min = tv.u(40f)),
    ) {
        val focused = LocalFocusGlowFocused.current
        Column(
            Modifier
                .clip(RoundedCornerShape(999.dp))
                .background(
                    when {
                        focused -> Color.White.copy(alpha = 0.94f)
                        selected -> visuals.accent.copy(alpha = 0.16f)
                        else -> Color(0xB3121014)
                    },
                )
                .padding(horizontal = tv.u(18f), vertical = tv.u(7f)),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                label,
                color = when {
                    focused -> Color(0xFF15110D)
                    selected -> visuals.accent
                    else -> Color.White
                },
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = if (selected || focused) FontWeight.ExtraBold else FontWeight.SemiBold),
                maxLines = 1,
            )
            // Selected = accent underline; focus stays the stronger (solid) state.
            Box(
                Modifier
                    .padding(top = 3.dp)
                    .width(18.dp)
                    .height(2.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(if (selected) visuals.accent else Color.Transparent),
            )
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun PagingChannelList(
    items: LazyPagingItems<MediaItem>,
    restoreFocusItem: MediaItem?,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
    contentPadding: PaddingValues = PaddingValues(vertical = 4.dp),
) {
    val tv = rememberTvScale()
    val listState = rememberLazyListState()
    val targetKey = restoreFocusItem?.let(::mediaKey)
    val restoreIndex = remember(items.itemCount, targetKey) {
        restoreFocusItem?.let { target -> (0 until items.itemCount).firstOrNull { items.peek(it).sameMedia(target) } }
    }
    var handledRestoreKey by remember { mutableStateOf<String?>(null) }
    var pendingFocusIndex by remember { mutableStateOf<Int?>(null) }
    LaunchedEffect(restoreIndex, targetKey) {
        val index = restoreIndex ?: return@LaunchedEffect
        if (handledRestoreKey == targetKey) return@LaunchedEffect
        handledRestoreKey = targetKey
        listState.scrollToPivotIfNeeded(index)
        if (tv.isTv) pendingFocusIndex = index
    }
    CompositionLocalProvider(LocalBringIntoViewSpec provides rememberTvBringIntoViewSpec()) {
        LazyColumn(
            Modifier.fillMaxSize(),
            state = listState,
            contentPadding = contentPadding,
            verticalArrangement = Arrangement.spacedBy(if (tv.isTv) tv.u(6f) else 8.dp),
        ) {
            items(
                count = items.itemCount,
                key = items.itemKey { mediaKey(it) },
                contentType = items.itemContentType { it.type },
            ) { index ->
                items[index]?.let { item ->
                    val focusRequester = remember(item.id, item.type, item.serverId) { FocusRequester() }
                    if (pendingFocusIndex == index) {
                        LaunchedEffect(Unit) {
                            delay(FOCUS_REQUEST_DELAY_MS)
                            runCatching { focusRequester.requestFocus() }
                            pendingFocusIndex = null
                        }
                    }
                    ChannelRow(
                        item = item,
                        onFocus = onFocus,
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
private fun PosterGrid(
    items: LazyPagingItems<MediaItem>,
    restoreFocusItem: MediaItem?,
    onFocus: (MediaItem) -> Unit,
    onPlay: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit,
    modifier: Modifier,
    entryFocus: Boolean = false,
    showFavoriteMark: Boolean = true,
) {
    val tv = rememberTvScale()
    if (items.itemCount == 0) {
        // Distinguish the first paging load from a genuinely empty category so the grid never
        // flashes a misleading "empty" card while the cached library is still being read.
        val s = LocalStrings.current
        val loading = items.loadState.refresh is LoadState.Loading
        EmptyState(
            title = if (loading) s.homeLibraryLoadingTitle else s.homeLibraryEmptyTitle,
            message = if (loading) s.homeLibraryLoadingBody else s.homeLibraryEmptyBody,
            modifier = modifier,
        )
        return
    }
    val gridState = rememberLazyGridState()
    val targetKey = restoreFocusItem?.let(::mediaKey)
    val restoreIndex = remember(items.itemCount, targetKey) {
        restoreFocusItem?.let { target -> (0 until items.itemCount).firstOrNull { items.peek(it).sameMedia(target) } }
    }
    var handledRestoreKey by remember { mutableStateOf<String?>(null) }
    var pendingFocusIndex by remember { mutableStateOf<Int?>(null) }
    val refreshDone = items.loadState.refresh is LoadState.NotLoading
    LaunchedEffect(restoreIndex, targetKey) {
        val index = restoreIndex ?: return@LaunchedEffect
        if (handledRestoreKey == targetKey) return@LaunchedEffect
        handledRestoreKey = targetKey
        gridState.scrollToPivotIfNeeded(index)
        if (tv.isTv) pendingFocusIndex = index
    }
    // Entry fallback: nothing restorable in the loaded pages -> focus the first visible poster once
    // the real data is in (never on the empty/stale paging snapshot, which would overwrite the
    // saved position).
    LaunchedEffect(entryFocus, refreshDone, restoreIndex) {
        if (!entryFocus || !refreshDone || restoreIndex != null || pendingFocusIndex != null) return@LaunchedEffect
        if (items.itemCount > 0) pendingFocusIndex = gridState.firstVisibleItemIndex.coerceIn(0, items.itemCount - 1)
    }
    val spacing = if (tv.isTv) tv.u(12f) else 10.dp
    BoxWithConstraints(modifier) {
        val horizontalPadding = if (tv.isTv) tv.u(6f) else 2.dp
        val usable = maxWidth - horizontalPadding * 2
        val columns = ((usable + spacing) / (tv.posterWidth + spacing)).toInt().coerceAtLeast(2)
        val cellWidth: Dp = (usable - spacing * (columns - 1)) / columns
        CompositionLocalProvider(LocalBringIntoViewSpec provides rememberTvBringIntoViewSpec()) {
            LazyVerticalGrid(
                columns = GridCells.Fixed(columns),
                horizontalArrangement = Arrangement.spacedBy(spacing),
                verticalArrangement = Arrangement.spacedBy(spacing),
                state = gridState,
                contentPadding = PaddingValues(
                    start = horizontalPadding,
                    end = horizontalPadding,
                    top = if (tv.isTv) tv.u(10f) else 4.dp,
                    bottom = if (tv.isTv) tv.u(24f) else tv.contentPadding,
                ),
                modifier = Modifier.fillMaxSize(),
            ) {
                items(
                    count = items.itemCount,
                    key = items.itemKey { mediaKey(it) },
                    contentType = items.itemContentType { it.type },
                ) { index ->
                    items[index]?.let { item ->
                        val focusRequester = remember(item.id, item.type, item.serverId) { FocusRequester() }
                        if (pendingFocusIndex == index) {
                            LaunchedEffect(Unit) {
                                delay(FOCUS_REQUEST_DELAY_MS)
                                runCatching { focusRequester.requestFocus() }
                                pendingFocusIndex = null
                            }
                        }
                        MediaPoster(
                            item = item,
                            onFocus = onFocus,
                            onClick = onPlay,
                            onFavorite = onFavorite,
                            focusRequester = focusRequester,
                            posterWidth = cellWidth,
                            showFavoriteMark = showFavoriteMark,
                        )
                    }
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
    val targetKey = restoreFocusItem?.let(::mediaKey)
    val restoreIndex = remember(episodes, targetKey) {
        restoreFocusItem?.let { target -> episodes.indexOfFirst { it.sameMedia(target) }.takeIf { it >= 0 } }
    }
    var handledRestoreKey by remember { mutableStateOf<String?>(null) }
    var pendingFocusIndex by remember { mutableStateOf<Int?>(null) }
    LaunchedEffect(restoreIndex, targetKey) {
        val index = restoreIndex ?: return@LaunchedEffect
        if (handledRestoreKey == targetKey) return@LaunchedEffect
        handledRestoreKey = targetKey
        listState.scrollToPivotIfNeeded(index)
        if (tv.isTv) pendingFocusIndex = index
    }
    CompositionLocalProvider(LocalBringIntoViewSpec provides rememberTvBringIntoViewSpec()) {
        LazyColumn(
            modifier,
            state = listState,
            contentPadding = PaddingValues(vertical = tv.u(10f)),
            verticalArrangement = Arrangement.spacedBy(tv.u(8f)),
        ) {
            itemsIndexed(
                episodes,
                key = { _, episode -> "${episode.seasonNumber}-${episode.episodeNumber}-${mediaKey(episode)}" },
                contentType = { _, _ -> "episode" },
            ) { index, episode ->
                val focusRequester = remember(episode.id, episode.seasonNumber, episode.episodeNumber) { FocusRequester() }
                if (pendingFocusIndex == index) {
                    LaunchedEffect(Unit) {
                        delay(FOCUS_REQUEST_DELAY_MS)
                        runCatching { focusRequester.requestFocus() }
                        pendingFocusIndex = null
                    }
                }
                EpisodeRow(
                    episode = episode,
                    onFocus = onFocus,
                    onPlay = onPlay,
                    onFavorite = onFavorite,
                    focusRequester = focusRequester,
                )
            }
        }
    }
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
    requestInitialFocus: Boolean = false,
) {
    val tv = rememberTvScale()
    val h = LocalStrings.current.home
    val categoryState = rememberLazyListState()
    val selectedFocus = remember { FocusRequester() }
    val selectedIndex = remember(categories, selectedCategoryId) {
        if (selectedCategoryId.isBlank()) {
            0
        } else {
            categories.indexOfFirst { it.id == selectedCategoryId }.takeIf { it >= 0 }?.plus(1) ?: 0
        }
    }
    LaunchedEffect(selectedIndex) {
        categoryState.scrollToPivotIfNeeded(selectedIndex)
    }
    LaunchedEffect(requestInitialFocus) {
        if (requestInitialFocus) {
            delay(FOCUS_REQUEST_DELAY_MS)
            runCatching { selectedFocus.requestFocus() }
        }
    }
    GlassPanel(modifier = modifier, radius = tv.cardRadius) {
        Column(Modifier.fillMaxSize().padding(tv.u(10f)), verticalArrangement = Arrangement.spacedBy(tv.u(6f))) {
            Text(
                title,
                color = Color.White,
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(horizontal = tv.u(6f), vertical = tv.u(4f)),
            )
            CompositionLocalProvider(LocalBringIntoViewSpec provides rememberTvBringIntoViewSpec()) {
                LazyColumn(
                    state = categoryState,
                    verticalArrangement = Arrangement.spacedBy(tv.u(4f)),
                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp),
                    // Entering the rail with the D-pad always lands on the selected category,
                    // never on whichever chip happens to be geometrically closest.
                    modifier = Modifier
                        .focusProperties { onEnter = { runCatching { selectedFocus.requestFocus() } } }
                        .focusGroup(),
                ) {
                    item(key = "__all__", contentType = "category") {
                        CategoryChip(
                            h.allCategories,
                            selected = selectedCategoryId.isBlank(),
                            focusRequester = if (selectedIndex == 0) selectedFocus else null,
                            onClick = onAllCategories,
                        )
                    }
                    items(
                        categories.size,
                        key = { categories[it].id },
                        contentType = { "category" },
                    ) { index ->
                        val cat = categories[index]
                        CategoryChip(
                            cat.name,
                            selected = selectedCategoryId == cat.id,
                            focusRequester = if (selectedIndex == index + 1) selectedFocus else null,
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
    val h = LocalStrings.current.home
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
        contentPadding = PaddingValues(horizontal = 2.dp, vertical = 4.dp),
        modifier = Modifier.focusGroup(),
    ) {
        item { CategoryPill(h.allCategories, selectedCategoryId.isBlank(), onAllCategories) }
        items(categories, key = { it.id }, contentType = { "category" }) { cat ->
            CategoryPill(cat.name, selectedCategoryId == cat.id) { onCategory(cat) }
        }
    }
}

@Composable
private fun CategoryChip(name: String, selected: Boolean, focusRequester: FocusRequester?, onClick: () -> Unit) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    FocusGlow(
        modifier = Modifier.fillMaxWidth().heightIn(min = tv.u(42f)),
        cornerRadius = tv.u(10f),
        focusRequester = focusRequester,
        onClick = onClick,
        focusedScale = FocusScale.Chip,
        glowElevation = 6.dp,
    ) {
        val focused = LocalFocusGlowFocused.current
        Row(
            Modifier
                .fillMaxWidth()
                .heightIn(min = tv.u(42f))
                .clip(RoundedCornerShape(tv.u(8f)))
                .background(if (focused) Color.White.copy(alpha = 0.94f) else Color.Transparent)
                .padding(horizontal = tv.u(10f), vertical = tv.u(6f)),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Selected = accent start bar + accent text; focused = solid light fill (always stronger).
            Box(
                Modifier
                    .width(3.dp)
                    .height(tv.u(18f))
                    .clip(RoundedCornerShape(999.dp))
                    .background(if (selected) visuals.accent else Color.Transparent),
            )
            Spacer(Modifier.width(tv.u(8f)))
            Text(
                name,
                color = when {
                    focused -> Color(0xFF15110D)
                    selected -> visuals.accent
                    else -> Color.White.copy(alpha = 0.88f)
                },
                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = if (selected || focused) FontWeight.Bold else FontWeight.Medium),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun CategoryPill(name: String, selected: Boolean, onClick: () -> Unit) {
    val visuals = LocalMoVisuals.current
    FocusGlow(cornerRadius = 999.dp, onClick = onClick, focusedScale = FocusScale.Chip, glowElevation = 6.dp) {
        val focused = LocalFocusGlowFocused.current
        Box(
            Modifier
                .clip(RoundedCornerShape(999.dp))
                .background(
                    when {
                        focused -> Color.White.copy(alpha = 0.94f)
                        selected -> visuals.accent.copy(alpha = 0.24f)
                        else -> Color(0x44241914)
                    },
                )
                .padding(horizontal = 16.dp, vertical = 10.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                name,
                color = when {
                    focused -> Color(0xFF15110D)
                    selected -> Color.White
                    else -> Color(0xCCE3BC78)
                },
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

/**
 * Right-hand details pane. Live: channel logo, number, category and now/next programme with
 * progress. Movies/series: art (with the muted trailer on capable devices), title, meta and
 * description. Never an empty black box — items without art get a monogram placeholder.
 */
@Composable
fun PreviewPane(
    item: MediaItem?,
    modifier: Modifier,
    live: Boolean,
    previewEnabled: Boolean = true,
    liveEpg: LiveEpgSnapshot = LiveEpgSnapshot(),
    performancePolicy: PerformancePolicy? = null,
) {
    if (live) {
        LivePreviewPane(item, liveEpg, modifier)
    } else {
        VodPreviewPane(
            item = item,
            modifier = modifier,
            showArt = previewEnabled && performancePolicy?.enablePreviewPane != false,
            trailersAllowed = previewEnabled && performancePolicy?.isPerformance != true,
        )
    }
}

@Composable
private fun PreviewEmpty(text: String) {
    Box(Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
        Text(text, color = Color(0x99FFFFFF), style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
    }
}

@Composable
private fun LivePreviewPane(item: MediaItem?, epg: LiveEpgSnapshot, modifier: Modifier) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    val h = strings.home
    GlassPanel(modifier = modifier, radius = tv.cardRadius) {
        if (item == null) {
            PreviewEmpty(strings.previewChooseItem)
            return@GlassPanel
        }
        var nowMs by remember { mutableLongStateOf(System.currentTimeMillis()) }
        LaunchedEffect(epg.current) {
            while (true) {
                nowMs = System.currentTimeMillis()
                delay(EPG_TICK_MS)
            }
        }
        BoxWithConstraints(Modifier.fillMaxSize().padding(tv.u(12f))) {
            val logoWidth = maxWidth
            val logoHeight = maxWidth * 9f / 16f
            Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(tv.u(8f))) {
                ChannelLogo(
                    item = item,
                    width = logoWidth,
                    height = logoHeight,
                    cornerRadius = tv.u(12f),
                    monogramSize = (logoHeight.value * 0.34f).sp,
                )
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    LiveBadge(strings.badgeLive)
                    if (item.serverOrder != Int.MAX_VALUE) {
                        Text(
                            h.channelNumber(item.serverOrder),
                            color = Color.White.copy(alpha = 0.72f),
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            maxLines = 1,
                        )
                    }
                }
                Text(
                    item.title,
                    color = Color.White,
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                if (item.categoryName.isNotBlank()) {
                    Text(
                        item.categoryName,
                        color = visuals.accent,
                        style = MaterialTheme.typography.labelLarge,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Box(Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = 0.10f)))
                val current = epg.current
                if (current != null) {
                    EpgBlock(h.epgNow, current, h, nowMs = nowMs, showProgress = true, descriptionLines = 3)
                    epg.next?.takeIf { it.title.isNotBlank() }?.let { next ->
                        EpgBlock(h.epgNext, next, h, nowMs = nowMs, showProgress = false, descriptionLines = 0)
                    }
                } else {
                    Text(h.epgNone, color = Color.White.copy(alpha = 0.60f), style = MaterialTheme.typography.bodyMedium, maxLines = 3)
                }
                Spacer(Modifier.weight(1f))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(Icons.Rounded.PlayArrow, null, tint = visuals.accent, modifier = Modifier.size(18.dp))
                    Text(strings.pressOkToPlay, color = Color.White.copy(alpha = 0.70f), style = MaterialTheme.typography.labelMedium, maxLines = 1)
                }
            }
        }
    }
}

@Composable
private fun EpgBlock(
    label: String,
    entry: EpgEntry,
    h: HomeStrings,
    nowMs: Long,
    showProgress: Boolean,
    descriptionLines: Int,
) {
    val visuals = LocalMoVisuals.current
    val range = "${epgClock(entry.startAt)} - ${epgClock(entry.endAt)}".ltr()
    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(label, color = visuals.accent, style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.ExtraBold), maxLines = 1)
            Text(range, color = Color.White.copy(alpha = 0.62f), style = MaterialTheme.typography.labelMedium, maxLines = 1)
        }
        Text(
            entry.title,
            color = Color.White,
            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold),
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        val span = entry.endAt - entry.startAt
        if (showProgress && span > 0 && entry.endAt > 0) {
            val fraction = ((nowMs - entry.startAt).toFloat() / span).coerceIn(0f, 1f)
            WatchProgressBar(fraction, Modifier.fillMaxWidth().padding(top = 3.dp))
            val minutesLeft = TimeUnit.MILLISECONDS.toMinutes((entry.endAt - nowMs).coerceAtLeast(0))
            Text(h.minutesLeft(minutesLeft), color = Color.White.copy(alpha = 0.58f), style = MaterialTheme.typography.labelSmall, maxLines = 1)
        }
        if (descriptionLines > 0 && entry.description.isNotBlank()) {
            Text(
                entry.description,
                color = Color(0xCCE3BC78),
                style = MaterialTheme.typography.bodySmall,
                maxLines = descriptionLines,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun VodPreviewPane(item: MediaItem?, modifier: Modifier, showArt: Boolean, trailersAllowed: Boolean) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    val h = strings.home
    GlassPanel(modifier = modifier, radius = tv.cardRadius) {
        if (item == null) {
            PreviewEmpty(strings.previewChooseItem)
            return@GlassPanel
        }
        Column(Modifier.fillMaxSize().padding(tv.u(12f)), verticalArrangement = Arrangement.spacedBy(tv.u(8f))) {
            BoxWithConstraints(
                Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .clip(RoundedCornerShape(tv.u(12f))),
            ) {
                val artUrl = remember(item.posterUrl, item.backdropUrl) { item.posterUrl.ifBlank { item.backdropUrl }.optimizedPosterUrl() }
                var artFailed by remember(artUrl) { mutableStateOf(artUrl.isBlank()) }
                if (!showArt || artFailed) {
                    ArtworkPlaceholder(
                        item.title,
                        item.type,
                        Modifier.fillMaxSize(),
                        showTitle = false,
                        showTypeBadge = true,
                        monogramSize = (maxWidth.value * 0.26f).sp,
                    )
                } else {
                    // Channel logos (favorites grid) are shown whole on a neutral stage, never cropped.
                    val isLogo = item.type == ContentType.LIVE
                    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(visuals.surfaceHigh, visuals.surface))))
                    RemoteArtImage(
                        url = artUrl,
                        contentDescription = item.title,
                        contentScale = if (isLogo) ContentScale.Fit else ContentScale.Crop,
                        slotWidth = maxWidth,
                        slotHeight = maxHeight,
                        modifier = if (isLogo) Modifier.fillMaxSize().padding(maxWidth * 0.16f) else Modifier.fillMaxSize(),
                        onFailed = { artFailed = true },
                    )
                }
                if (trailersAllowed) {
                    // Muted autoplay trailer layered over the art once it resolved for THIS item.
                    val trailer = LocalPreviewTrailer.current
                    val reportTrailerError = LocalTrailerErrorReporter.current
                    PreviewTrailerHost(
                        trailer = trailer.takeIf { it.youtubeId.isNotBlank() && it.itemKey == mediaKey(item) },
                        modifier = Modifier.fillMaxSize(),
                        onError = reportTrailerError,
                    )
                }
                Box(
                    Modifier
                        .align(Alignment.BottomCenter)
                        .fillMaxWidth()
                        .height(tv.u(36f))
                        .background(Brush.verticalGradient(listOf(Color.Transparent, Color(0x99000000)))),
                )
            }
            Text(
                item.title,
                color = Color.White,
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            val meta = remember(item, h) { vodMetaLine(item, h) }
            if (item.rating.isNotBlank() || meta.isNotBlank()) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (item.rating.isNotBlank()) {
                        Icon(Icons.Rounded.Star, null, tint = Color(0xFFFFCC44), modifier = Modifier.size(15.dp))
                        Text(item.rating.ltr(), color = Color(0xFFFFCC44), style = MaterialTheme.typography.labelLarge, maxLines = 1)
                    }
                    if (meta.isNotBlank()) {
                        Text(meta, color = Color.White.copy(alpha = 0.72f), style = MaterialTheme.typography.labelMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                }
            }
            if (item.genre.isNotBlank()) {
                Text(item.genre, color = visuals.accent, style = MaterialTheme.typography.labelMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Text(
                item.description.ifBlank { h.previewNoDescription },
                color = Color(0xCCE3BC78),
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 4,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

/** "2023  •  1h 45m" style metadata for the details pane. */
internal fun vodMetaLine(item: MediaItem, h: HomeStrings): String = buildList {
    item.releaseDate.take(4).takeIf { it.length == 4 && it.all(Char::isDigit) }?.let { add(it.ltr()) }
    if (item.durationSecs > 0) add(formatDuration(item.durationSecs, h))
}.joinToString("  •  ")

@Composable
fun GlassTag(text: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    val visuals = LocalMoVisuals.current
    GlassPanel(radius = 999.dp, highlighted = false) {
        Row(
            Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(icon, null, tint = visuals.accent, modifier = Modifier.size(15.dp))
            Text(text, color = Color.White, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
fun EmptyState(title: String, message: String, modifier: Modifier = Modifier) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    GlassPanel(modifier = modifier, radius = tv.cardRadius, contentAlignment = Alignment.Center) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.padding(24.dp),
        ) {
            Box(Modifier.size(64.dp).clip(CircleShape).background(visuals.accent.copy(alpha = 0.16f)), contentAlignment = Alignment.Center) {
                Icon(Icons.Rounded.Bookmark, null, tint = visuals.accent, modifier = Modifier.size(30.dp))
            }
            Text(title, color = Color.White, style = MaterialTheme.typography.headlineMedium, textAlign = TextAlign.Center)
            Text(message, color = Color(0xB8E3BC78), style = MaterialTheme.typography.bodyLarge, maxLines = 3, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center)
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
    val h = LocalStrings.current.home
    val watchPercent = if (episode.watchDurationMs > 0) (episode.watchPositionMs.toFloat() / episode.watchDurationMs).coerceIn(0f, 1f) else 0f
    val favoriteFeedback = rememberFavoriteFeedback()
    val number = episode.episodeNumber.coerceAtLeast(1)
    FocusGlow(
        modifier = Modifier.fillMaxWidth(),
        cornerRadius = tv.cardRadius,
        focusRequester = focusRequester,
        onFocused = { onFocus(episode) },
        onClick = { onPlay(episode) },
        onLongClick = {
            favoriteFeedback.show(!episode.isFavorite)
            onFavorite(episode)
        },
        focusedScale = FocusScale.Row,
        glowElevation = 8.dp,
        clickGuardMs = CARD_CLICK_GUARD_MS,
    ) {
        val focused = LocalFocusGlowFocused.current
        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape((tv.cardRadius - 2.dp).coerceAtLeast(4.dp)))
                .background(if (focused) visuals.surfaceHigh.copy(alpha = 0.97f) else visuals.surface.copy(alpha = 0.60f)),
        ) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = tv.u(12f), vertical = tv.u(10f)),
                horizontalArrangement = Arrangement.spacedBy(tv.u(12f)),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    Modifier
                        .size(tv.u(44f))
                        .clip(RoundedCornerShape(tv.u(12f)))
                        .background(Brush.radialGradient(listOf(visuals.accent.copy(alpha = 0.82f), visuals.accentB))),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(number.toString(), color = Color.White, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold))
                }
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(
                        episode.title.ifBlank { h.episodeTitle(number) },
                        color = Color.White,
                        style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                        episode.description.ifBlank { h.episodeReady },
                        color = Color(0xB3E3BC78),
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    if (episode.durationSecs > 0) {
                        Text(formatDuration(episode.durationSecs, h), color = Color.White.copy(alpha = 0.55f), style = MaterialTheme.typography.labelMedium)
                    }
                }
                if (focused) {
                    Box(
                        Modifier.size(tv.u(34f)).clip(CircleShape).background(visuals.accent),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Rounded.PlayArrow, null, tint = Color(0xFF14100C), modifier = Modifier.size(tv.u(20f)))
                    }
                }
            }
            if (watchPercent > 0.01f) {
                WatchProgressBar(watchPercent, Modifier.fillMaxWidth().padding(start = tv.u(12f), end = tv.u(12f), bottom = 6.dp))
            }
        }
        FavoriteBurst(favoriteFeedback)
    }
}

private fun MediaItem?.sameMedia(other: MediaItem?): Boolean =
    this != null &&
        other != null &&
        id == other.id &&
        type == other.type &&
        serverId == other.serverId

private fun epgClock(epochMs: Long): String {
    if (epochMs <= 0L) return "--:--"
    return runCatching {
        EpgClockFormatter.format(Instant.ofEpochMilli(epochMs).atZone(ZoneId.systemDefault()))
    }.getOrDefault("--:--")
}

internal fun formatDuration(secs: Long, h: HomeStrings): String {
    val hours = TimeUnit.SECONDS.toHours(secs)
    val minutes = TimeUnit.SECONDS.toMinutes(secs) % 60
    return if (hours > 0) h.durationHoursMinutes(hours, minutes) else h.durationMinutes(minutes)
}
