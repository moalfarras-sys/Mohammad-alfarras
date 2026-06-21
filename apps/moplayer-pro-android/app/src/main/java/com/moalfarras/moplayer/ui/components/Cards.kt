package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.snap
import androidx.compose.foundation.Image
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.gestures.BringIntoViewSpec
import androidx.compose.foundation.gestures.LocalBringIntoViewSpec
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Shuffle
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material.icons.rounded.Tv
import androidx.compose.material.icons.rounded.Update
import androidx.compose.material.icons.rounded.VideoFile
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import coil3.request.ImageRequest
import com.moalfarras.moplayerpro.BuildConfig
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import com.moalfarras.moplayerpro.R
import kotlinx.coroutines.delay
import java.net.URI
import java.net.URLEncoder
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalFoundationApi::class)
private val LaneBringIntoViewSpec = object : BringIntoViewSpec {
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

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA POSTER — Premium Glass Card
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun MediaPoster(
    item: MediaItem,
    onFocus: (MediaItem) -> Unit,
    onClick: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit = {},
    modifier: Modifier = Modifier,
    focusRequester: FocusRequester? = null,
    posterWidth: Dp? = null,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val qualityBadge = remember(item.title, item.streamUrl) { item.qualityBadge() }
    val width = posterWidth ?: tv.posterWidth
    FocusGlow(
        modifier = modifier
            .width(width)
            .aspectRatio(0.68f),
        cornerRadius = tv.cardRadius,
        focusRequester = focusRequester,
        onFocused = { onFocus(item) },
        onClick = { onClick(item) },
        onTripleOk = { onFavorite(item) },
        onLongOk = { onFavorite(item) },
        delayClickForTripleOk = true,
    ) {
        GlassPanel(
            modifier = Modifier.fillMaxSize(),
            radius = tv.cardRadius,
            highlighted = false,
            blur = 8.dp
        ) {
            Box(
                Modifier.fillMaxSize().padding((6 * tv.factor).dp),
            ) {
                // Poster image inner container
                Box(
                    Modifier
                        .fillMaxSize()
                        .clip(RoundedCornerShape(tv.cardRadius - 6.dp))
                        .background(
                            Brush.verticalGradient(
                                listOf(
                                    visuals.surfaceHigh,
                                    visuals.surface,
                                ),
                            ),
                        )
                        .border(
                            0.8.dp,
                            Brush.verticalGradient(
                                listOf(
                                    Color.White.copy(alpha = 0.22f),
                                    visuals.accent.copy(alpha = 0.10f),
                                    Color.Transparent,
                                )
                            ),
                            RoundedCornerShape(tv.cardRadius - 6.dp),
                        ),
                ) {
                    val posterModel = item.posterUrl.ifBlank { item.backdropUrl }.optimizedPosterUrl()
                    if (posterModel.isBlank()) {
                        PosterFallback(
                            title = item.title,
                            type = item.type,
                            modifier = Modifier.fillMaxSize(),
                        )
                    } else {
                        RemotePosterImage(
                            url = posterModel,
                            contentDescription = item.title,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize(),
                        )
                    }
                    // Cinematic gradient overlay on poster
                    Box(
                        Modifier.fillMaxSize().background(
                            Brush.verticalGradient(
                                listOf(
                                    Color.Transparent,
                                    Color(0x11131110),
                                    Color(0xBB131110),
                                    Color(0xF0131110),
                                ),
                            ),
                        ),
                    )
                }

                // Favorite icon
                if (item.isFavorite) {
                    Icon(
                        Icons.Rounded.Favorite,
                        null,
                        tint = visuals.accent,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(10.dp)
                            .size((17 * tv.factor).dp),
                    )
                }

                if (qualityBadge.isNotBlank()) {
                    Box(
                        Modifier
                            .align(Alignment.TopEnd)
                            .padding((8 * tv.factor).dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(Color(0xCC07090D))
                            .border(0.8.dp, Color.White.copy(alpha = 0.22f), RoundedCornerShape(999.dp))
                            .padding(horizontal = (8 * tv.factor).dp, vertical = (4 * tv.factor).dp),
                    ) {
                        Text(
                            qualityBadge,
                            color = Color.White,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold),
                            maxLines = 1,
                        )
                    }
                }

                // LIVE badge
                if (item.type == ContentType.LIVE) {
                    Box(
                        Modifier
                            .align(Alignment.TopStart)
                            .padding((8 * tv.factor).dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(
                                Brush.horizontalGradient(
                                    listOf(
                                        visuals.live,
                                        visuals.error,
                                    ),
                                ),
                            )
                            .padding(horizontal = (9 * tv.factor).dp, vertical = (4 * tv.factor).dp),
                    ) {
                        Text(
                            "● LIVE",
                            color = Color.White,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 0.sp,
                            ),
                        )
                    }
                }

                if (item.type == ContentType.LIVE && item.catchup.isNotBlank()) {
                    Box(
                        Modifier
                            .align(Alignment.TopStart)
                            .padding(start = (8 * tv.factor).dp, top = (34 * tv.factor).dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(visuals.surfaceHigh.copy(alpha = 0.86f))
                            .border(0.7.dp, visuals.accent.copy(alpha = 0.34f), RoundedCornerShape(999.dp))
                            .padding(horizontal = (8 * tv.factor).dp, vertical = (4 * tv.factor).dp),
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Icon(
                                Icons.Rounded.Update,
                                null,
                                tint = visuals.accent,
                                modifier = Modifier.size((10 * tv.factor).dp),
                            )
                            Text(
                                "Catch-up",
                                color = visuals.textPrimary,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }

                // Bottom info
                Column(
                    Modifier.align(Alignment.BottomStart).padding((12 * tv.factor).dp),
                    verticalArrangement = Arrangement.spacedBy((4 * tv.factor).dp),
                ) {
                    if (item.type != ContentType.LIVE) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Icon(
                                Icons.Rounded.VideoFile,
                                null,
                                tint = visuals.accent,
                                modifier = Modifier.size((11 * tv.factor).dp),
                            )
                            Text(
                                if (item.type == ContentType.SERIES) "SERIES" else "VOD",
                                color = visuals.accent,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold),
                                maxLines = 1,
                            )
                        }
                    }
                    if (item.rating.isNotBlank()) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(3.dp),
                        ) {
                            Icon(
                                Icons.Rounded.Star,
                                null,
                                tint = Color(0xFFFFD740),
                                modifier = Modifier.size((11 * tv.factor).dp),
                            )
                            Text(
                                item.rating,
                                color = Color(0xFFFFD740),
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            )
                        }
                    }
                    item.addedAtLabel()?.let { addedLabel ->
                        Text(
                            "Added $addedLabel",
                            color = Color(0xB8FFFFFF),
                            style = MaterialTheme.typography.labelSmall,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    Text(
                        item.title,
                        color = Color.White,
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.ExtraBold),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    // Watch progress bar
                    if (item.watchPositionMs > 0 && item.watchDurationMs > 0) {
                        val pct = (item.watchPositionMs.toFloat() / item.watchDurationMs).coerceIn(0f, 1f)
                        Box(
                            Modifier
                                .fillMaxWidth()
                                .height((3 * tv.factor).dp)
                                .clip(RoundedCornerShape(999.dp))
                                .background(Color(0x33FFFFFF)),
                        ) {
                            Box(
                                Modifier
                                    .fillMaxWidth(pct)
                                    .fillMaxHeight()
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(
                                        Brush.horizontalGradient(
                                            listOf(visuals.accent, visuals.accentB),
                                        ),
                                    ),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PosterFallback(title: String, type: ContentType, modifier: Modifier = Modifier) {
    val visuals = LocalMoVisuals.current
    Box(
        modifier.background(
            Brush.radialGradient(
                listOf(
                    visuals.accent.copy(alpha = 0.34f),
                    visuals.surfaceHigh.copy(alpha = 0.96f),
                    Color(0xFF090705),
                ),
            ),
        ),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.70f)
                    .aspectRatio(1.35f)
                    .clip(RoundedCornerShape(18.dp))
                    .background(
                        Brush.verticalGradient(
                            listOf(
                                visuals.accent.copy(alpha = 0.22f),
                                Color(0x33131110),
                            ),
                        ),
                    )
                    .border(0.8.dp, visuals.accent.copy(alpha = 0.42f), RoundedCornerShape(18.dp))
                    .padding(8.dp),
                contentAlignment = Alignment.Center,
            ) {
                androidx.compose.foundation.Image(
                    painter = painterResource(R.drawable.ic_splash_logo),
                    contentDescription = null,
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxSize(),
                )
            }
            Text(
                "MoPlayer Pro",
                color = Color.White.copy(alpha = 0.80f),
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold),
                maxLines = 1,
            )
            Text(
                when (type) {
                    ContentType.LIVE -> "LIVE"
                    ContentType.MOVIE -> "MOVIE"
                    ContentType.SERIES, ContentType.EPISODE -> "SERIES"
                },
                color = visuals.accent,
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold),
            )
            Text(
                title,
                color = Color.White.copy(alpha = 0.72f),
                style = MaterialTheme.typography.labelSmall,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(horizontal = 10.dp),
            )
        }
    }
}

private fun MediaItem.qualityBadge(): String {
    val value = "$title $streamUrl".uppercase()
    return when {
        "4K" in value || "UHD" in value || "2160" in value -> "4K"
        "FHD" in value || "1080" in value -> "FHD"
        "HD" in value || "720" in value -> "HD"
        type == ContentType.LIVE -> "LIVE"
        else -> ""
    }
}

private val mediaDateFormatter: DateTimeFormatter =
    DateTimeFormatter.ofPattern("MMM d").withZone(ZoneId.systemDefault())

private fun MediaItem.addedAtLabel(): String? {
    val timestamp = addedAt.takeIf { it > 0 } ?: lastModifiedAt.takeIf { it > 0 } ?: return null
    return runCatching { mediaDateFormatter.format(Instant.ofEpochMilli(timestamp)) }.getOrNull()
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANNEL ROW — Glass list item
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun ChannelRow(
    item: MediaItem,
    onFocus: (MediaItem) -> Unit,
    onClick: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit = {},
    modifier: Modifier = Modifier,
    focusRequester: FocusRequester? = null,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    FocusGlow(
        modifier = modifier.fillMaxWidth().height((58 * tv.factor).dp),
        cornerRadius = tv.cardRadius,
        focusRequester = focusRequester,
        onFocused = { onFocus(item) },
        onClick = { onClick(item) },
        onTripleOk = { onFavorite(item) },
        onLongOk = { onFavorite(item) },
        delayClickForTripleOk = true,
    ) {
        GlassPanel(radius = tv.cardRadius, highlighted = false, blur = 10.dp, modifier = Modifier.fillMaxSize()) {
            Row(
                Modifier.fillMaxSize().padding(horizontal = (16 * tv.factor).dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy((14 * tv.factor).dp),
            ) {
                // Logo container with glass bg
                Box(
                    Modifier
                        .size((40 * tv.factor).dp)
                        .clip(RoundedCornerShape((12 * tv.factor).dp))
                        .background(
                            Brush.verticalGradient(
                                listOf(
                                    visuals.surfaceHigh.copy(alpha = 0.96f),
                                    visuals.surface.copy(alpha = 0.88f),
                                )
                            )
                        )
                        .border(
                            0.7.dp,
                            visuals.accent.copy(alpha = 0.25f),
                            RoundedCornerShape((12 * tv.factor).dp),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    if (item.posterUrl.isNotBlank()) {
                        RemotePosterImage(
                            url = item.posterUrl.optimizedPosterUrl(),
                            contentDescription = null,
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.fillMaxSize().padding(4.dp),
                        )
                    } else {
                        Icon(
                            Icons.Rounded.Tv,
                            null,
                            tint = visuals.accent.copy(alpha = 0.76f),
                            modifier = Modifier.size((20 * tv.factor).dp),
                        )
                    }
                }
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        item.title,
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    val meta = buildList {
                        if (item.serverOrder != Int.MAX_VALUE) add("#${item.serverOrder}")
                        item.addedAtLabel()?.let { add("Added $it") }
                        if (item.categoryName.isNotBlank()) add(item.categoryName)
                    }.joinToString(" • ")
                    if (meta.isNotBlank()) {
                        Text(
                            meta,
                            color = Color(0x80FFFFFF),
                            style = MaterialTheme.typography.labelSmall,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
                if (item.type == ContentType.LIVE && item.catchup.isNotBlank()) {
                    Box(
                        Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(visuals.accent.copy(alpha = 0.12f))
                            .border(0.7.dp, visuals.accent.copy(alpha = 0.28f), RoundedCornerShape(999.dp))
                            .padding(horizontal = (9 * tv.factor).dp, vertical = (5 * tv.factor).dp),
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Icon(
                                Icons.Rounded.Update,
                                null,
                                tint = visuals.accent,
                                modifier = Modifier.size((13 * tv.factor).dp),
                            )
                            Text(
                                "Catch-up",
                                color = visuals.textPrimary,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }
                if (item.isFavorite) {
                    Icon(
                        Icons.Rounded.Favorite,
                        null,
                        tint = visuals.accent,
                        modifier = Modifier.size((16 * tv.factor).dp),
                    )
                }
                Box(
                    Modifier
                        .size((32 * tv.factor).dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(visuals.accent.copy(alpha = 0.15f))
                        .border(0.7.dp, visuals.accent.copy(alpha = 0.40f), RoundedCornerShape(999.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Rounded.PlayArrow,
                        null,
                        tint = visuals.accent,
                        modifier = Modifier.size((16 * tv.factor).dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun RemotePosterImage(
    url: String,
    contentDescription: String?,
    contentScale: ContentScale,
    modifier: Modifier = Modifier,
) {
    val model = remember(url) { url.optimizedPosterUrl() }
    val fallback = painterResource(R.drawable.ic_splash_logo)
    if (model.isBlank()) {
        Image(
            painter = fallback,
            contentDescription = contentDescription,
            contentScale = ContentScale.Fit,
            modifier = modifier,
        )
    } else {
        val context = LocalContext.current
        val request = remember(context, model) {
            ImageRequest.Builder(context)
                .data(model)
                .memoryCacheKey(model)
                .diskCacheKey(model)
                .build()
        }
        AsyncImage(
            model = request,
            contentDescription = contentDescription,
            contentScale = contentScale,
            placeholder = fallback,
            error = fallback,
            fallback = fallback,
            modifier = modifier,
        )
    }
}

private fun String.optimizedPosterUrl(): String {
    val normalized = trim()
        .replace("/w600_and_h900_bestv2/", "/w342/")
        .replace("/w780/", "/w342/")
        .replace("/w500/", "/w342/")
        .replace("/original/", "/w342/")
    if (!normalized.startsWith("http://", ignoreCase = true) && !normalized.startsWith("https://", ignoreCase = true)) return normalized
    val host = runCatching { URI(normalized).host.orEmpty() }.getOrDefault("")
    if (host.equals("image.tmdb.org", ignoreCase = true) || host.endsWith(".tmdb.org", ignoreCase = true)) return normalized
    val base = BuildConfig.WEB_API_BASE_URL.trimEnd('/').ifBlank { "https://moalfarras.space" }
    if (normalized.startsWith(base, ignoreCase = true)) return normalized
    return "$base/api/app/image?url=${URLEncoder.encode(normalized, Charsets.UTF_8.name())}"
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA LANE (Horizontal scroll row with section header)
// ─────────────────────────────────────────────────────────────────────────────
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MediaLane(
    title: String,
    items: List<MediaItem>,
    onFocus: (MediaItem) -> Unit,
    onClick: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit = {},
    modifier: Modifier = Modifier,
    restoreFocusTarget: MediaItem? = null,
    autoFocusFirstItem: Boolean = false,
    maxItems: Int = Int.MAX_VALUE,
    compact: Boolean = false,
    showTitle: Boolean = true,
    posterWidthOverride: Dp? = null,
) {
    val tv = rememberTvScale()
    val visibleItems = remember(items, maxItems) { items.take(maxItems.coerceAtLeast(1)) }
    if (visibleItems.isEmpty()) return
    val rowState = rememberLazyListState()
    val posterWidth = posterWidthOverride ?: if (compact && tv.isTv) (112 * tv.factor).dp else null
    val focusKey = remember(restoreFocusTarget?.id, restoreFocusTarget?.type, restoreFocusTarget?.serverId) {
        restoreFocusTarget?.let { "${it.type}:${it.serverId}:${it.id}" } ?: "first"
    }
    var requestedFocusOnce by remember(focusKey, autoFocusFirstItem) { mutableStateOf(false) }
    val restoreIndex = remember(restoreFocusTarget, visibleItems) {
        restoreFocusTarget?.let { target -> visibleItems.indexOfFirst { target.matchesLaneFocus(it) }.takeIf { it >= 0 } }
    }
    val initialFocusIndex = restoreIndex ?: if (autoFocusFirstItem) 0 else null
    LaunchedEffect(initialFocusIndex, focusKey) {
        initialFocusIndex?.let { index ->
            rowState.scrollToItem(index)
        }
    }
    Column(modifier, verticalArrangement = Arrangement.spacedBy((9 * tv.factor).dp)) {
        if (showTitle) {
            GlassSectionTitle(title)
        }
        CompositionLocalProvider(LocalBringIntoViewSpec provides LaneBringIntoViewSpec) {
            LazyRow(
                state = rowState,
                horizontalArrangement = Arrangement.spacedBy((14 * tv.factor).dp),
                modifier = Modifier.focusGroup(),
            ) {
                items(
                    visibleItems,
                    key = { "${it.type}-${it.serverId}-${it.id}" },
                    contentType = { it.type },
                ) { item ->
                    val rowFocus = remember(item.id, item.type, item.serverId) { FocusRequester() }
                    val shouldRequestInitialFocus = when {
                        restoreIndex != null -> restoreFocusTarget.matchesLaneFocus(item)
                        autoFocusFirstItem -> visibleItems.firstOrNull()?.matchesLaneFocus(item) == true
                        else -> false
                    }
                    LaunchedEffect(shouldRequestInitialFocus, initialFocusIndex, focusKey) {
                        if (shouldRequestInitialFocus && initialFocusIndex != null && !requestedFocusOnce) {
                            requestedFocusOnce = true
                            delay(140)
                            runCatching { rowFocus.requestFocus() }
                        }
                    }
                    MediaPoster(item, onFocus, onClick, onFavorite, focusRequester = rowFocus, posterWidth = posterWidth)
                }
            }
        }
    }
}

@Composable
private fun GlassSectionTitle(title: String) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.padding(
            horizontal = (4 * tv.factor).dp,
        ),
    ) {
        // Neon accent line
        Box(
            Modifier
                .width(3.dp)
                .height(
                    if (tv.isLowHeightLandscape) 18.dp else (22 * tv.factor).dp
                )
                .clip(RoundedCornerShape(999.dp))
                .background(
                    Brush.verticalGradient(
                        listOf(visuals.accent, visuals.accentB),
                    )
                ),
        )
        Text(
            title,
            color = Color.White,
            style = (if (tv.isLowHeightLandscape) MaterialTheme.typography.titleMedium else MaterialTheme.typography.titleLarge)
                .copy(fontWeight = FontWeight.Bold, letterSpacing = 0.sp),
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SURPRISE ME BUTTON — Neon gradient pill
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun SurpriseButton(onClick: () -> Unit, modifier: Modifier = Modifier) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val buttonHeight = if (tv.isLowHeightLandscape) 48.dp else (64 * tv.factor).dp
    FocusGlow(
        modifier = modifier
            .height(buttonHeight)
            .clip(RoundedCornerShape(999.dp)),
        cornerRadius = 999.dp,
        onClick = onClick,
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.horizontalGradient(
                        listOf(
                            visuals.accent.copy(alpha = 0.92f),
                            visuals.accentB.copy(alpha = 0.85f),
                            visuals.accentC.copy(alpha = 0.72f),
                        ),
                    ),
                )
                .border(
                    1.dp,
                    Brush.horizontalGradient(
                        listOf(
                            Color.White.copy(alpha = 0.35f),
                            Color.Transparent,
                        )
                    ),
                    RoundedCornerShape(999.dp),
                ),
            contentAlignment = Alignment.Center,
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy((10 * tv.factor).dp),
                modifier = Modifier.padding(horizontal = (22 * tv.factor).dp),
            ) {
                Icon(
                    Icons.Rounded.Shuffle,
                    null,
                    tint = Color.White,
                    modifier = Modifier.size((20 * tv.factor).dp),
                )
                Text(
                    "Quick play",
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                )
            }
        }
    }
}

private fun MediaItem?.matchesLaneFocus(item: MediaItem): Boolean =
    this != null && id == item.id && type == item.type && serverId == item.serverId
