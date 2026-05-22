package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.moalfarras.moplayer.domain.model.FootballMatch
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.rememberTvScale

/**
 * FootballTickerWidget — Premium live sports glass card.
 *
 * Features:
 * - Live pulse indicator with breathing glow
 * - Score with animated accent
 * - Compact inline layout for TV sidebar
 * - Glass panel with conditional glow (live vs finished)
 */
@Composable
fun FootballTickerWidget(
    matches: List<FootballMatch>,
    modifier: Modifier = Modifier,
    animate: Boolean = true,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val match = matches.firstOrNull() ?: return

    val isLive = match.isLive

    val transition = rememberInfiniteTransition(label = "football")
    val livePulse by transition.animateFloat(
        0.4f, 1.0f,
        infiniteRepeatable(tween(1200, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "live-pulse",
    )
    val glowAlpha by transition.animateFloat(
        0.08f, 0.18f,
        infiniteRepeatable(tween(2400, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "glow",
    )
    val effectiveLivePulse = if (animate) livePulse else 0.7f
    val effectiveGlowAlpha = if (animate) glowAlpha else 0.08f

    val liveColor = Color(0xFFFF3B4D)
    val finishedColor = Color(0xFF8BD88B)
    val statusColor = if (isLive) liveColor else if (match.minute.contains("FT", ignoreCase = true)) finishedColor else Color(0xFFAABBCC)

    GlassPanel(
        modifier = modifier,
        radius = (24 * tv.factor).dp,
        blur = 18.dp,
        glow = if (isLive) liveColor.copy(alpha = effectiveGlowAlpha) else Color.Transparent,
    ) {
        Column(
            modifier = Modifier.padding(
                horizontal = (18 * tv.factor).dp,
                vertical = (14 * tv.factor).dp,
            ),
            verticalArrangement = Arrangement.spacedBy((8 * tv.factor).dp),
        ) {
            // ── League + Live Indicator ──────────────────────────────
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy((8 * tv.factor).dp),
            ) {
                // Live pulse dot
                if (isLive) {
                    Box(
                        Modifier
                            .size((10 * tv.factor).dp)
                            .drawBehind {
                                // Outer glow
                                drawCircle(
                                    liveColor.copy(alpha = 0.3f * effectiveLivePulse),
                                    radius = size.minDimension * 1.5f,
                                )
                                // Core dot
                                drawCircle(liveColor.copy(alpha = effectiveLivePulse))
                            },
                    )
                }

                Text(
                    match.league,
                    color = Color(0xCCE3BC78),
                    fontSize = (12 * tv.factor).sp,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    letterSpacing = 0.5.sp,
                    modifier = Modifier.weight(1f, fill = false),
                )

                Spacer(Modifier.weight(1f))

                // Match minute / status badge
                Box(
                    Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(statusColor.copy(alpha = 0.18f))
                        .padding(horizontal = (8 * tv.factor).dp, vertical = (3 * tv.factor).dp),
                ) {
                    Text(
                        match.minute.ifBlank { "—" },
                        color = statusColor,
                        fontSize = (10 * tv.factor).sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy((12 * tv.factor).dp),
            ) {
                TeamBadge(
                    name = match.home,
                    badgeUrl = match.homeBadge,
                    alignEnd = false,
                    modifier = Modifier.weight(1f),
                )
                ScoreBadge(
                    score = match.score.ifBlank { "vs" },
                    isLive = isLive,
                    pulse = effectiveLivePulse,
                    accent = visuals.accent,
                )
                TeamBadge(
                    name = match.away,
                    badgeUrl = match.awayBadge,
                    alignEnd = true,
                    modifier = Modifier.weight(1f),
                )
            }

            // ── Additional Matches Count (if more than 1) ────────────
            if (matches.size > 1) {
                Text(
                    "+${matches.size - 1} more matches",
                    color = Color(0xCCE3BC78),
                    fontSize = (11 * tv.factor).sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            if (match.newsMessage.isNotBlank()) {
                Text(
                    match.newsMessage,
                    color = Color(0xB3FFFFFF),
                    fontSize = (10 * tv.factor).sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun TeamBadge(name: String, badgeUrl: String, alignEnd: Boolean, modifier: Modifier = Modifier) {
    val tv = rememberTvScale()
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy((8 * tv.factor).dp, if (alignEnd) Alignment.End else Alignment.Start),
    ) {
        if (alignEnd) TeamName(name, TextAlign.End, Modifier.weight(1f))
        TeamCrest(name = name, badgeUrl = badgeUrl)
        if (!alignEnd) TeamName(name, TextAlign.Start, Modifier.weight(1f))
    }
}

@Composable
private fun TeamName(name: String, align: TextAlign, modifier: Modifier = Modifier) {
    val tv = rememberTvScale()
    Text(
        name,
        color = Color.White,
        fontSize = (13 * tv.factor).sp,
        fontWeight = FontWeight.ExtraBold,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        textAlign = align,
        modifier = modifier,
    )
}

@Composable
private fun TeamCrest(name: String, badgeUrl: String) {
    val tv = rememberTvScale()
    val initials = remember(name) {
        name.split(' ', '-', '_')
            .filter { it.isNotBlank() }
            .take(2)
            .joinToString("") { it.first().uppercase() }
            .ifBlank { "FC" }
    }
    Box(
        modifier = Modifier
            .size((42 * tv.factor).dp)
            .clip(CircleShape)
            .background(Brush.radialGradient(listOf(Color(0x33FFFFFF), Color(0x11000000))))
            .drawBehind {
                drawCircle(Color.White.copy(alpha = 0.16f), style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1.2f))
            },
        contentAlignment = Alignment.Center,
    ) {
        if (badgeUrl.isNotBlank()) {
            AsyncImage(model = badgeUrl, contentDescription = name, modifier = Modifier.fillMaxSize(0.72f))
        } else {
            Text(initials, color = Color.White, fontSize = (12 * tv.factor).sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun ScoreBadge(score: String, isLive: Boolean, pulse: Float, accent: Color) {
    val tv = rememberTvScale()
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape((18 * tv.factor).dp))
            .background(Color(0xAA080A0F))
            .padding(horizontal = (14 * tv.factor).dp, vertical = (10 * tv.factor).dp)
            .drawBehind {
                if (isLive) {
                    drawCircle(
                        brush = Brush.radialGradient(listOf(accent.copy(alpha = 0.22f * pulse), Color.Transparent)),
                        radius = size.maxDimension,
                    )
                }
            },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            score,
            color = Color.White,
            fontSize = (20 * tv.factor).sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.5.sp,
            maxLines = 1,
        )
    }
}
