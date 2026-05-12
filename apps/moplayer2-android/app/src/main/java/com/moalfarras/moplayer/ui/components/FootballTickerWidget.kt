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
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val match = matches.firstOrNull() ?: return

    val isLive = match.minute.isNotBlank() && !match.minute.contains("FT", ignoreCase = true) && !match.minute.contains("NS", ignoreCase = true)

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

    val liveColor = Color(0xFFFF3B4D)
    val finishedColor = Color(0xFF8BD88B)
    val statusColor = if (isLive) liveColor else if (match.minute.contains("FT", ignoreCase = true)) finishedColor else Color(0xFFAABBCC)

    GlassPanel(
        modifier = modifier,
        radius = (24 * tv.factor).dp,
        blur = 18.dp,
        glow = if (isLive) liveColor.copy(alpha = glowAlpha) else Color.Transparent,
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
                                    liveColor.copy(alpha = 0.3f * livePulse),
                                    radius = size.minDimension * 1.5f,
                                )
                                // Core dot
                                drawCircle(liveColor.copy(alpha = livePulse))
                            },
                    )
                }

                Text(
                    match.league,
                    color = Color(0xCCE3BC78),
                    fontSize = (11 * tv.factor).sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    letterSpacing = 0.5.sp,
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

            // ── Teams + Score ─────────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Home team
                Text(
                    match.home,
                    color = Color.White,
                    fontSize = (14 * tv.factor).sp,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Start,
                )

                // Score in center with accent glow
                Box(
                    modifier = Modifier
                        .padding(horizontal = (12 * tv.factor).dp)
                        .drawBehind {
                            if (isLive) {
                                drawCircle(
                                    brush = Brush.radialGradient(
                                        listOf(visuals.accent.copy(alpha = 0.15f * livePulse), Color.Transparent),
                                    ),
                                    radius = size.maxDimension * 1.2f,
                                )
                            }
                        },
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        match.score.ifBlank { "vs" },
                        color = if (match.score.isNotBlank()) Color.White else Color(0x88FFFFFF),
                        fontSize = (18 * tv.factor).sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 2.sp,
                    )
                }

                // Away team
                Text(
                    match.away,
                    color = Color.White,
                    fontSize = (14 * tv.factor).sp,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.End,
                )
            }

            // ── Additional Matches Count (if more than 1) ────────────
            if (matches.size > 1) {
                Text(
                    "+${matches.size - 1} مباريات أخرى",
                    color = Color(0x88E3BC78),
                    fontSize = (10 * tv.factor).sp,
                    fontWeight = FontWeight.Medium,
                )
            }
        }
    }
}
