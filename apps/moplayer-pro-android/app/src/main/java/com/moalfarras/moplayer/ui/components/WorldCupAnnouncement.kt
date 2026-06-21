package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.Locale
import kotlin.math.PI
import kotlin.math.sin

// ────────────────────────────────────────────────────────────────────────────
// Home notifications — the current premium template is World Cup 2026.
// ────────────────────────────────────────────────────────────────────────────

sealed interface HomeNotificationPhase {
    data object Off : HomeNotificationPhase
    data class Countdown(val days: Long) : HomeNotificationPhase
    data object Live : HomeNotificationPhase
}

/**
 * Source of truth for the Home notifications rail. It is generic so admin can
 * swap templates later; World Cup 2026 is the first built-in campaign.
 */
object HomeNotificationCampaign {
    // FIFA World Cup 2026 — 11 June to 19 July 2026 (USA · Canada · Mexico).
    private val START: LocalDate = LocalDate.of(2026, 6, 11)
    private val END: LocalDate = LocalDate.of(2026, 7, 19)
    private val TEASER_START: LocalDate = START.minusDays(30)

    fun phase(
        today: LocalDate,
        mode: String = "auto",
        type: String = "world_cup_2026",
        targetDate: String = "",
    ): HomeNotificationPhase {
        val normalizedMode = mode.trim().lowercase(Locale.US)
        val isWorldCup = type.trim().isBlank() ||
            type.trim().lowercase(Locale.US) in setOf("world_cup_2026", "worldcup", "world_cup")
        if (!isWorldCup) {
            // Repurposable campaign: count down to an admin-provided date, go live on the day, then hide.
            if (normalizedMode in setOf("off", "false", "disabled")) return HomeNotificationPhase.Off
            val target = parseDate(targetDate)
            if (target != null) {
                return when {
                    today.isBefore(target) -> HomeNotificationPhase.Countdown(ChronoUnit.DAYS.between(today, target).coerceAtLeast(1))
                    !today.isAfter(target) -> HomeNotificationPhase.Live
                    normalizedMode in setOf("on", "true", "force", "live") -> HomeNotificationPhase.Live
                    else -> HomeNotificationPhase.Off
                }
            }
            return if (normalizedMode in setOf("on", "true", "force", "live")) HomeNotificationPhase.Live else HomeNotificationPhase.Off
        }
        val start = parseDate(targetDate) ?: START
        val teaserStart = start.minusDays(30)
        return when (normalizedMode) {
            "off", "false", "disabled" -> HomeNotificationPhase.Off
            "on", "true", "force", "live" -> HomeNotificationPhase.Live
            else -> when {
                today.isBefore(teaserStart) -> HomeNotificationPhase.Off
                today.isBefore(start) -> HomeNotificationPhase.Countdown(ChronoUnit.DAYS.between(today, start).coerceAtLeast(1))
                !today.isAfter(END) -> HomeNotificationPhase.Live
                else -> HomeNotificationPhase.Off
            }
        }
    }

    private fun parseDate(value: String): LocalDate? =
        value.trim().takeIf { it.isNotBlank() }?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
}

@Composable
fun rememberHomeNotificationPhase(mode: String, type: String, targetDate: String = ""): HomeNotificationPhase {
    val today = LocalDate.now()
    return remember(today.toEpochDay(), mode, type, targetDate) { HomeNotificationCampaign.phase(today, mode, type, targetDate) }
}

private val WcGold = Color(0xFFF1CC83)
private val WcGreen = Color(0xFF2BB673)
private val WcRed = Color(0xFFE5484D)

@Composable
fun HomeNotificationAnnouncement(
    phase: HomeNotificationPhase,
    accent: Color,
    titleOverride: String = "",
    messageOverride: String = "",
    modifier: Modifier = Modifier,
    animate: Boolean = true,
) {
    if (phase is HomeNotificationPhase.Off) return
    val tv = rememberTvScale()
    val isArabic = Locale.getDefault().language == "ar"

    val title = titleOverride.ifBlank { if (isArabic) "إشعارات الهوم" else "Home notifications" }
    val subtitle = messageOverride.ifBlank {
        when (phase) {
            is HomeNotificationPhase.Live -> if (isArabic) "كأس العالم 2026 مباشر الآن" else "FIFA World Cup 2026, live now"
            is HomeNotificationPhase.Countdown -> {
                val d = phase.days
                if (isArabic) "كأس العالم يبدأ بعد $d يوم" else if (d == 1L) "World Cup starts in 1 day" else "World Cup starts in $d days"
            }
            else -> ""
        }
    }

    val transition = rememberInfiniteTransition(label = "wc")
    val rawSheen by transition.animateFloat(
        initialValue = -1f,
        targetValue = 2f,
        animationSpec = infiniteRepeatable(tween(2600, easing = LinearEasing)),
        label = "sheen",
    )
    val rawFall by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(3200, easing = LinearEasing)),
        label = "fall",
    )
    val rawPulse by transition.animateFloat(
        initialValue = 0.45f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(900, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "pulse",
    )
    val sheen = if (animate) rawSheen else 1.4f
    val fall = if (animate) rawFall else 0f
    val pulse = if (animate) rawPulse else 0.85f

    GlassPanel(
        modifier = modifier,
        radius = (20 * tv.factor).dp,
        blur = 18.dp,
        highlighted = true,
        glow = WcGold.copy(alpha = 0.22f),
    ) {
        // Festive confetti + sheen behind the content, clipped to the panel.
        Box(
            Modifier
                .matchParentSize()
                .clip(RoundedCornerShape((20 * tv.factor).dp))
                .drawBehind {
                    if (animate) drawConfetti(size.width, size.height, fall)
                    val sx = sheen * size.width
                    drawRect(
                        brush = Brush.linearGradient(
                            colors = listOf(Color.Transparent, Color.White.copy(alpha = 0.10f), Color.Transparent),
                            start = Offset(sx - size.width * 0.18f, 0f),
                            end = Offset(sx + size.width * 0.18f, size.height),
                        ),
                    )
                },
        )

        Row(
            modifier = Modifier.padding(
                horizontal = (16 * tv.factor).dp,
                vertical = (12 * tv.factor).dp,
            ),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy((14 * tv.factor).dp),
        ) {
            // Trophy emblem
            Box(
                modifier = Modifier
                    .size((46 * tv.factor).dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(listOf(WcGold.copy(alpha = 0.45f), WcGold.copy(alpha = 0.05f))),
                    )
                    .drawBehind {
                        drawCircle(
                            color = WcGold.copy(alpha = 0.5f * pulse),
                            radius = size.minDimension * 0.5f,
                            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1.5f * tv.factor),
                        )
                    },
                contentAlignment = Alignment.Center,
            ) {
                Text("🏆", fontSize = (24 * tv.factor).sp)
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy((2 * tv.factor).dp),
            ) {
                Text(
                    title,
                    color = Color.White,
                    fontSize = (16 * tv.factor).sp,
                    fontWeight = FontWeight.Black,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    subtitle,
                    color = WcGold,
                    fontSize = (12 * tv.factor).sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            when (phase) {
                is HomeNotificationPhase.Live -> LiveTag(pulse, tv.factor, isArabic)
                is HomeNotificationPhase.Countdown -> CountdownTag(phase.days, tv.factor, isArabic)
                else -> Unit
            }
        }
    }
}

@Composable
private fun LiveTag(pulse: Float, factor: Float, isArabic: Boolean) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(WcRed.copy(alpha = 0.18f))
            .padding(horizontal = (10 * factor).dp, vertical = (5 * factor).dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy((6 * factor).dp),
    ) {
        Box(
            Modifier
                .size((8 * factor).dp)
                .drawBehind {
                    drawCircle(WcRed.copy(alpha = 0.35f * pulse), radius = size.minDimension * 1.4f)
                    drawCircle(WcRed.copy(alpha = pulse))
                },
        )
        Text(
            if (isArabic) "مباشر" else "LIVE",
            color = WcRed,
            fontSize = (11 * factor).sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 0.5.sp,
        )
    }
}

@Composable
private fun CountdownTag(days: Long, factor: Float, isArabic: Boolean) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape((12 * factor).dp))
            .background(WcGold.copy(alpha = 0.16f))
            .padding(horizontal = (12 * factor).dp, vertical = (6 * factor).dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            days.toString(),
            color = Color.White,
            fontSize = (20 * factor).sp,
            fontWeight = FontWeight.Black,
        )
        Text(
            if (isArabic) "يوم" else "DAYS",
            color = WcGold,
            fontSize = (8 * factor).sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp,
        )
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawConfetti(w: Float, h: Float, fall: Float) {
    val colors = listOf(WcGold, WcGreen, WcRed, Color.White)
    val count = 18
    repeat(count) { i ->
        val seed = i * 47.13f
        val x = (seed % 1f.coerceAtLeast(1f)).let { (seed * 11f) % w }
        val phase = (fall + i / count.toFloat()) % 1f
        val y = phase * h
        val sway = sin((fall * 2f * PI.toFloat()) + i) * (w * 0.01f)
        val c = colors[i % colors.size].copy(alpha = 0.5f)
        if (i % 2 == 0) {
            drawCircle(c, radius = 2.4f, center = Offset((x + sway).coerceIn(0f, w), y))
        } else {
            drawRect(
                color = c,
                topLeft = Offset((x + sway).coerceIn(0f, w), y),
                size = Size(3.2f, 3.2f),
            )
        }
    }
}
