package com.moalfarras.moplayer.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.EmojiEvents
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.remember
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
import com.moalfarras.moplayer.ui.i18n.HomeStrings
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.home
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.Locale
import kotlin.math.PI
import kotlin.math.sin

// ────────────────────────────────────────────────────────────────────────────
// Home notifications — an admin-driven campaign (World Cup is the built-in template).
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

    fun phase(
        today: LocalDate,
        mode: String = "auto",
        type: String = "world_cup_2026",
        targetDate: String = "",
    ): HomeNotificationPhase {
        val normalizedMode = mode.trim().lowercase(Locale.US)
        if (!isWorldCupCampaign(type)) {
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

/** True for the built-in World Cup template (also the default when the admin sets no type). */
fun isWorldCupCampaign(type: String): Boolean =
    type.trim().isBlank() || type.trim().lowercase(Locale.US) in setOf("world_cup_2026", "worldcup", "world_cup")

/** Admin title override, else a localized title for the campaign template. */
fun campaignTitle(type: String, titleOverride: String, h: HomeStrings): String =
    titleOverride.trim().ifBlank { if (isWorldCupCampaign(type)) h.campaignWorldCupTitle else h.campaignDefaultTitle }

@Composable
fun rememberHomeNotificationPhase(mode: String, type: String, targetDate: String = ""): HomeNotificationPhase {
    val today = LocalDate.now()
    return remember(today.toEpochDay(), mode, type, targetDate) { HomeNotificationCampaign.phase(today, mode, type, targetDate) }
}

private val WcGold = Color(0xFFF1CC83)
private val WcGreen = Color(0xFF2BB673)
private val WcRed = Color(0xFFE5484D)

private const val CAMPAIGN_CYCLE_MS = 41_600
/** The live pulse repeats every 1.6 s inside the shared 41.6 s cycle. */
private const val PULSES_PER_CYCLE = 26f

/** One slow looping clock for decorative motion, or null when motion is off. Read it only while drawing. */
@Composable
fun rememberDecorativeMotion(enabled: Boolean, label: String): State<Float>? =
    if (enabled) {
        rememberInfiniteTransition(label = label).animateFloat(
            initialValue = 0f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(tween(CAMPAIGN_CYCLE_MS, easing = LinearEasing)),
            label = "$label-cycle",
        )
    } else {
        null
    }

/** Pulsing live dot; the pulse is read in the draw phase so it never recomposes its parent. */
@Composable
fun LivePulseDot(motion: State<Float>?, modifier: Modifier = Modifier, color: Color = WcRed) {
    Box(
        modifier.drawBehind {
            val pulse = motion?.let { 0.45f + 0.55f * (0.5f + 0.5f * sin(it.value * 2f * PI.toFloat() * PULSES_PER_CYCLE)) } ?: 0.9f
            drawCircle(color.copy(alpha = 0.35f * pulse), radius = size.minDimension * 1.4f)
            drawCircle(color.copy(alpha = pulse))
        },
    )
}

/**
 * Transient campaign announcement (phones). Decorative motion runs only when [animate] is true
 * and is read while drawing, so it never recomposes the Home screen.
 */
@Composable
fun HomeNotificationAnnouncement(
    phase: HomeNotificationPhase,
    type: String,
    titleOverride: String = "",
    messageOverride: String = "",
    modifier: Modifier = Modifier,
    animate: Boolean = true,
) {
    if (phase is HomeNotificationPhase.Off) return
    val h = LocalStrings.current.home
    val title = campaignTitle(type, titleOverride, h)
    val subtitle = messageOverride.trim().ifBlank {
        when (phase) {
            is HomeNotificationPhase.Live -> h.campaignLiveNow
            is HomeNotificationPhase.Countdown -> h.campaignStartsIn(phase.days)
            else -> ""
        }
    }
    val motion = rememberDecorativeMotion(animate, "campaign")

    GlassPanel(
        modifier = modifier,
        radius = 20.dp,
        highlighted = true,
        glow = WcGold.copy(alpha = 0.22f),
    ) {
        // Festive confetti + sheen behind the content, clipped to the panel.
        Box(
            Modifier
                .matchParentSize()
                .clip(RoundedCornerShape(20.dp))
                .drawBehind {
                    val t = (motion?.value ?: 0f) * CAMPAIGN_CYCLE_MS
                    if (motion != null) drawConfetti(size.width, size.height, t / 3_200f % 1f)
                    val sheen = if (motion != null) (t / 2_600f % 1f) * 3f - 1f else 1.4f
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
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(Brush.radialGradient(listOf(WcGold.copy(alpha = 0.45f), WcGold.copy(alpha = 0.05f)))),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Rounded.EmojiEvents, contentDescription = null, tint = WcGold, modifier = Modifier.size(24.dp))
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                Text(
                    title,
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    subtitle,
                    color = WcGold,
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            when (phase) {
                is HomeNotificationPhase.Live -> LiveTag(motion, h.campaignLiveNow)
                is HomeNotificationPhase.Countdown -> CountdownTag(phase.days, h.campaignDaysUnit)
                else -> Unit
            }
        }
    }
}

@Composable
private fun LiveTag(motion: State<Float>?, label: String) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(WcRed.copy(alpha = 0.18f))
            .padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        LivePulseDot(motion, Modifier.size(8.dp))
        Text(
            label,
            color = WcRed,
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Black),
            maxLines = 1,
        )
    }
}

@Composable
private fun CountdownTag(days: Long, unit: String) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(WcGold.copy(alpha = 0.16f))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            days.toString(),
            color = Color.White,
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
        )
        Text(
            unit,
            color = WcGold,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
        )
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawConfetti(w: Float, h: Float, fall: Float) {
    val colors = listOf(WcGold, WcGreen, WcRed, Color.White)
    val count = 18
    repeat(count) { i ->
        val seed = i * 47.13f
        val x = (seed * 11f) % w
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
