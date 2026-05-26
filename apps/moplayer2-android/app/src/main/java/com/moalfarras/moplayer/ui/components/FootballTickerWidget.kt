package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
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
 * FootballTickerWidget — modern live-sports broadcast card.
 *
 * - Genuine animated LIVE pulse (breathing dot + halo).
 * - Hero score capsule with a live accent glow.
 * - League chip + status pill, crest rings, and a live match-minute progress bar.
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
    val isFinished = match.minute.contains("FT", ignoreCase = true)
    val liveColor = Color(0xFFFF3B4D)
    val finishedColor = Color(0xFF8BD88B)

    // Real, motion-aware live pulse.
    val transition = rememberInfiniteTransition(label = "ticker")
    val rawPulse by transition.animateFloat(
        initialValue = 0.45f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1100, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "pulse",
    )
    val pulse = if (animate && isLive) rawPulse else 0.85f

    val progress = remember(match.minute, isLive) { matchProgress(match.minute, isLive) }

    GlassPanel(
        modifier = modifier,
        radius = (18 * tv.factor).dp,
        blur = 12.dp,
        glow = if (isLive) liveColor.copy(alpha = 0.10f + 0.06f * pulse) else Color.Transparent,
    ) {
        Column(
            modifier = Modifier.padding(
                horizontal = (14 * tv.factor).dp,
                vertical = (11 * tv.factor).dp,
            ),
            verticalArrangement = Arrangement.spacedBy((8 * tv.factor).dp),
        ) {
            // ── League + status pill ─────────────────────────────────
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy((8 * tv.factor).dp),
            ) {
                Text(
                    match.league.uppercase(),
                    color = Color(0xCCF1CC83),
                    fontSize = (10 * tv.factor).sp,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    letterSpacing = 0.8.sp,
                    modifier = Modifier.weight(1f, fill = false),
                )
                Spacer(Modifier.weight(1f))
                StatusPill(
                    isLive = isLive,
                    isFinished = isFinished,
                    minute = match.minute,
                    pulse = pulse,
                    liveColor = liveColor,
                    finishedColor = finishedColor,
                    factor = tv.factor,
                )
            }

            // ── Teams + hero score ───────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy((8 * tv.factor).dp),
            ) {
                TeamSide(
                    name = match.home,
                    badgeUrl = match.homeBadge,
                    alignEnd = false,
                    accent = visuals.accent,
                    modifier = Modifier.weight(1f),
                )
                ScoreHero(
                    score = match.score.ifBlank { "VS" },
                    isLive = isLive,
                    pulse = pulse,
                    accent = visuals.accent,
                    factor = tv.factor,
                )
                TeamSide(
                    name = match.away,
                    badgeUrl = match.awayBadge,
                    alignEnd = true,
                    accent = visuals.accent,
                    modifier = Modifier.weight(1f),
                )
            }

            // ── Live match-minute progress ───────────────────────────
            if (isLive && progress != null) {
                LiveProgressBar(progress = progress, pulse = pulse, color = liveColor, factor = tv.factor)
            }

            // ── More matches / news footer ───────────────────────────
            if (matches.size > 1) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy((5 * tv.factor).dp),
                ) {
                    val dots = matches.size.coerceAtMost(5)
                    repeat(dots) { i ->
                        Box(
                            Modifier
                                .size((if (i == 0) 6 else 5).times(tv.factor).dp)
                                .clip(CircleShape)
                                .background(
                                    if (i == 0) visuals.accent
                                    else Color.White.copy(alpha = 0.28f),
                                ),
                        )
                    }
                    if (matches.size > dots) {
                        Text(
                            "+${matches.size - dots}",
                            color = Color(0xCCF1CC83),
                            fontSize = (9 * tv.factor).sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }
            if (match.newsMessage.isNotBlank()) {
                Text(
                    match.newsMessage,
                    color = Color(0xB3FFFFFF),
                    fontSize = (9 * tv.factor).sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun StatusPill(
    isLive: Boolean,
    isFinished: Boolean,
    minute: String,
    pulse: Float,
    liveColor: Color,
    finishedColor: Color,
    factor: Float,
) {
    val tint = when {
        isLive -> liveColor
        isFinished -> finishedColor
        else -> Color(0xFFAABBCC)
    }
    val label = when {
        isLive -> "LIVE${if (minute.isNotBlank()) "  ${minute.trim()}" else ""}"
        isFinished -> "FT"
        else -> minute.ifBlank { "SOON" }
    }
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(tint.copy(alpha = 0.16f))
            .padding(horizontal = (8 * factor).dp, vertical = (3 * factor).dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy((5 * factor).dp),
    ) {
        if (isLive) {
            Box(
                Modifier
                    .size((7 * factor).dp)
                    .drawBehind {
                        drawCircle(tint.copy(alpha = 0.35f * pulse), radius = size.minDimension * 1.4f)
                        drawCircle(tint.copy(alpha = pulse))
                    },
            )
        }
        Text(
            label,
            color = tint,
            fontSize = (9 * factor).sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 0.5.sp,
            maxLines = 1,
        )
    }
}

@Composable
private fun TeamSide(
    name: String,
    badgeUrl: String,
    alignEnd: Boolean,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    val factor = rememberTvScale().factor
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy((8 * factor).dp, if (alignEnd) Alignment.End else Alignment.Start),
    ) {
        if (alignEnd) TeamName(name, TextAlign.End, Modifier.weight(1f, fill = false))
        TeamCrest(name = name, badgeUrl = badgeUrl, accent = accent)
        if (!alignEnd) TeamName(name, TextAlign.Start, Modifier.weight(1f, fill = false))
    }
}

@Composable
private fun TeamName(name: String, align: TextAlign, modifier: Modifier = Modifier) {
    val factor = rememberTvScale().factor
    Text(
        name,
        color = Color.White,
        fontSize = (12 * factor).sp,
        fontWeight = FontWeight.ExtraBold,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        textAlign = align,
        modifier = modifier,
    )
}

@Composable
private fun TeamCrest(name: String, badgeUrl: String, accent: Color) {
    val factor = rememberTvScale().factor
    val initials = remember(name) {
        name.split(' ', '-', '_')
            .filter { it.isNotBlank() }
            .take(2)
            .joinToString("") { it.first().uppercase() }
            .ifBlank { "FC" }
    }
    Box(
        modifier = Modifier
            .size((36 * factor).dp)
            .clip(CircleShape)
            .background(Brush.radialGradient(listOf(Color(0x33FFFFFF), Color(0x0A000000))))
            .drawBehind {
                drawCircle(
                    brush = Brush.sweepGradient(
                        listOf(
                            accent.copy(alpha = 0.0f),
                            accent.copy(alpha = 0.55f),
                            Color.White.copy(alpha = 0.30f),
                            accent.copy(alpha = 0.0f),
                        ),
                    ),
                    style = Stroke(width = 1.4f * factor),
                )
            },
        contentAlignment = Alignment.Center,
    ) {
        if (badgeUrl.isNotBlank()) {
            AsyncImage(model = badgeUrl, contentDescription = name, modifier = Modifier.fillMaxSize(0.7f))
        } else {
            Text(initials, color = Color.White, fontSize = (11 * factor).sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun ScoreHero(score: String, isLive: Boolean, pulse: Float, accent: Color, factor: Float) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape((13 * factor).dp))
            .background(
                Brush.verticalGradient(listOf(Color(0xCC0A0C12), Color(0xAA05060A))),
            )
            .drawBehind {
                if (isLive) {
                    drawCircle(
                        brush = Brush.radialGradient(
                            listOf(accent.copy(alpha = 0.30f * pulse), Color.Transparent),
                        ),
                        radius = size.maxDimension * 0.9f,
                    )
                }
            }
            .padding(horizontal = (12 * factor).dp, vertical = (7 * factor).dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            score,
            color = Color.White,
            fontSize = (18 * factor).sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.5.sp,
            maxLines = 1,
        )
    }
}

@Composable
private fun LiveProgressBar(progress: Float, pulse: Float, color: Color, factor: Float) {
    Box(
        Modifier
            .fillMaxWidth()
            .height((3.5f * factor).dp)
            .clip(RoundedCornerShape(999.dp))
            .background(Color.White.copy(alpha = 0.12f))
            .drawBehind {
                val w = size.width * progress.coerceIn(0f, 1f)
                drawLine(
                    brush = Brush.horizontalGradient(
                        listOf(color.copy(alpha = 0.85f), Color(0xFFFFC078)),
                    ),
                    start = Offset(0f, size.height / 2f),
                    end = Offset(w, size.height / 2f),
                    strokeWidth = size.height,
                    cap = StrokeCap.Round,
                )
                // Glowing playhead
                drawCircle(
                    color = Color.White.copy(alpha = 0.85f * pulse),
                    radius = size.height * 0.9f,
                    center = Offset(w.coerceIn(size.height, size.width - size.height), size.height / 2f),
                )
            },
    )
}

/** Best-effort 0..1 progress from a match-minute label ("67'", "90+2'", "HT", "FT"). */
private fun matchProgress(minute: String, isLive: Boolean): Float? {
    val m = minute.trim().uppercase()
    if (m.contains("FT") || m.contains("FULL")) return 1f
    if (m.contains("HT") || m.contains("HALF")) return 0.5f
    if (!isLive) return null
    val num = Regex("\\d+").find(m)?.value?.toIntOrNull() ?: return null
    return (num / 90f).coerceIn(0.02f, 1f)
}
