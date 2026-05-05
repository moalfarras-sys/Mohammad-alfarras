package com.moalfarras.moplayer.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Shuffle
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material.icons.rounded.Tv
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    FocusGlow(
        modifier = modifier
            .width(tv.posterWidth)
            .aspectRatio(0.68f),
        cornerRadius = tv.cardRadius,
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
                            Brush.radialGradient(
                                listOf(
                                    visuals.accentB.copy(alpha = 0.22f),
                                    Color(0xBB131110),
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
                                        Color(0xFFFF1744),
                                        Color(0xFFFF5252),
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
                                letterSpacing = 0.5.sp,
                            ),
                        )
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
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    FocusGlow(
        modifier = modifier.fillMaxWidth().height((68 * tv.factor).dp),
        cornerRadius = tv.cardRadius,
        onFocused = { onFocus(item) },
        onClick = { onClick(item) },
        onTripleOk = { onFavorite(item) },
        onLongOk = { onFavorite(item) },
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
                            Brush.radialGradient(
                                listOf(
                                    visuals.accentB.copy(alpha = 0.30f),
                                    Color(0x881E1A16),
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
                            tint = visuals.accent.copy(alpha = 0.70f),
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
) {
    val tv = rememberTvScale()
    if (items.isEmpty()) return
    Column(modifier, verticalArrangement = Arrangement.spacedBy((12 * tv.factor).dp)) {
        GlassSectionTitle(title)
        LazyRow(horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp)) {
            items(items, key = { "${it.type}-${it.id}" }) { item ->
                MediaPoster(item, onFocus, onClick, onFavorite)
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
                .copy(fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp),
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
