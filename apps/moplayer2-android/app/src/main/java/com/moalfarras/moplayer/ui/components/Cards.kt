package com.moalfarras.moplayer.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusGroup
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
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import kotlinx.coroutines.delay

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
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    FocusGlow(
        modifier = modifier
            .width(tv.posterWidth)
            .aspectRatio(0.68f),
        cornerRadius = tv.cardRadius,
        focusRequester = focusRequester,
        onFocused = { onFocus(item) },
        onClick = { onClick(item) },
        onTripleOk = { onFavorite(item) },
        onLongOk = { onFavorite(item) },
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
                            0.6.dp,
                            Brush.verticalGradient(
                                listOf(
                                    Color.White.copy(alpha = 0.35f),
                                    visuals.accent.copy(alpha = 0.15f),
                                    Color.Transparent,
                                )
                            ),
                            RoundedCornerShape(tv.cardRadius - 6.dp),
                        ),
                ) {
                    AsyncImage(
                        model = item.posterUrl.ifBlank { item.backdropUrl },
                        contentDescription = item.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                    )
                    // Cinematic gradient overlay on poster
                    Box(
                        Modifier.fillMaxSize().background(
                            Brush.verticalGradient(
                                colorStops = arrayOf(
                                    0.0f to Color.Transparent,
                                    0.4f to Color(0x110A0A0A),
                                    0.7f to Color(0xBB0A0A0A),
                                    1.0f to Color(0xF50A0A0A),
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
                                "أرشيف",
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
        modifier = modifier.fillMaxWidth().height((68 * tv.factor).dp),
        cornerRadius = tv.cardRadius,
        focusRequester = focusRequester,
        onFocused = { onFocus(item) },
        onClick = { onClick(item) },
        onTripleOk = { onFavorite(item) },
        onLongOk = { onFavorite(item) },
    ) {
        GlassPanel(radius = tv.cardRadius, highlighted = false, blur = 16.dp, modifier = Modifier.fillMaxSize()) {
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
                            0.5.dp,
                            visuals.accent.copy(alpha = 0.35f),
                            RoundedCornerShape((12 * tv.factor).dp),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    if (item.posterUrl.isNotBlank()) {
                        AsyncImage(
                            item.posterUrl,
                            null,
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
                Text(
                    item.title,
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
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
                                "أرشيف",
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

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA LANE (Horizontal scroll row with section header)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun MediaLane(
    title: String,
    items: List<MediaItem>,
    onFocus: (MediaItem) -> Unit,
    onClick: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit = {},
    modifier: Modifier = Modifier,
    restoreFocusTarget: MediaItem? = null,
) {
    val tv = rememberTvScale()
    if (items.isEmpty()) return
    val rowState = rememberLazyListState()
    val restoreIndex = remember(restoreFocusTarget, items) {
        restoreFocusTarget?.let { target -> items.indexOfFirst { target.matchesLaneFocus(it) }.takeIf { it >= 0 } }
    }
    LaunchedEffect(restoreIndex, restoreFocusTarget?.id) {
        if (restoreIndex != null) rowState.scrollToItem(restoreIndex)
    }
    Column(modifier, verticalArrangement = Arrangement.spacedBy((12 * tv.factor).dp)) {
        GlassSectionTitle(title)
        LazyRow(
            state = rowState,
            horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp),
            modifier = Modifier.focusGroup(),
        ) {
            items(items, key = { "${it.type}-${it.serverId}-${it.id}" }) { item ->
                val rowFocus = remember(item.id, item.type, item.serverId) { FocusRequester() }
                val isRestore = restoreFocusTarget.matchesLaneFocus(item)
                LaunchedEffect(isRestore, restoreIndex) {
                    if (isRestore && restoreIndex != null) {
                        delay(80)
                        runCatching { rowFocus.requestFocus() }
                    }
                }
                MediaPoster(item, onFocus, onClick, onFavorite, focusRequester = rowFocus)
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
                    "تشغيل سريع",
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                )
            }
        }
    }
}

private fun MediaItem?.matchesLaneFocus(item: MediaItem): Boolean =
    this != null && id == item.id && type == item.type && serverId == item.serverId
