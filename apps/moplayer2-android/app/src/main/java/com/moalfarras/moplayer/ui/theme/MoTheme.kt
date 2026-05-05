package com.moalfarras.moplayer.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.moalfarras.moplayer.R

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM FIERY GLASS — Warm Luxury Gold & Ember Palette
// ─────────────────────────────────────────────────────────────────────────────

/** Primary accent — adapts to poster palette or defaults to Champagne Gold */
val GlassChampagne = Color(0xFFE3BC78)
/** Secondary accent — Fiery Orange */
val FieryOrange    = Color(0xFFFF8C42)
/** Tertiary accent — Warm Amber */
val WarmAmber      = Color(0xFFFFB366)
/** Highlight accent — Ember Red/Rose */
val EmberRose      = Color(0xFFFF6B6B)
/** Luxury dark brown base */
val WarmEspresso   = Color(0xFF1A120C)

// Legacy aliases for backward compat
val NeonCyan    = GlassChampagne
val RoyalBlue   = FieryOrange
val NeonViolet  = WarmAmber
val LuxuryAmber = Color(0xFFFFD27A)

val MidnightBlack = Color(0xFF0A0908)
val DeepNavy      = Color(0xFF141110)

private val DisplayFamily = FontFamily(
    Font(R.font.manrope, FontWeight.ExtraBold),
    Font(R.font.manrope, FontWeight.Bold),
    Font(R.font.cairo, FontWeight.Bold),
)

private val BodyFamily = FontFamily(
    Font(R.font.manrope, FontWeight.Medium),
    Font(R.font.manrope, FontWeight.SemiBold),
    Font(R.font.cairo, FontWeight.Medium),
    Font(R.font.cairo, FontWeight.SemiBold),
)

private fun colors(accent: Color): ColorScheme = darkColorScheme(
    primary            = accent,
    secondary          = Color(0xFF241914),
    tertiary           = Color(0xFF2E1F16),
    background         = MidnightBlack,
    surface            = Color(0x66241914),
    surfaceVariant     = Color(0x22FFFFFF),
    onPrimary          = Color(0xFF0A0908),
    onSecondary        = Color.White,
    onBackground       = Color(0xFFF5E6D0),
    onSurface          = Color.White,
    onSurfaceVariant   = Color(0xFFBFA98E),
    outline            = Color(0x33E3BC78),
    error              = Color(0xFFFF4D6D),
)

private fun appTypography(scale: Float) = Typography(
    displayLarge   = TextStyle(fontFamily = DisplayFamily, fontWeight = FontWeight.ExtraBold, fontSize = (52 * scale).sp, lineHeight = (56 * scale).sp),
    displayMedium  = TextStyle(fontFamily = DisplayFamily, fontWeight = FontWeight.ExtraBold, fontSize = (42 * scale).sp, lineHeight = (46 * scale).sp),
    headlineLarge  = TextStyle(fontFamily = DisplayFamily, fontWeight = FontWeight.Bold,      fontSize = (34 * scale).sp, lineHeight = (38 * scale).sp),
    headlineMedium = TextStyle(fontFamily = DisplayFamily, fontWeight = FontWeight.Bold,      fontSize = (28 * scale).sp, lineHeight = (32 * scale).sp),
    titleLarge     = TextStyle(fontFamily = DisplayFamily, fontWeight = FontWeight.Bold,      fontSize = (22 * scale).sp, lineHeight = (26 * scale).sp),
    titleMedium    = TextStyle(fontFamily = BodyFamily,    fontWeight = FontWeight.SemiBold,  fontSize = (18 * scale).sp, lineHeight = (22 * scale).sp),
    bodyLarge      = TextStyle(fontFamily = BodyFamily,    fontWeight = FontWeight.Medium,    fontSize = (16 * scale).sp, lineHeight = (24 * scale).sp),
    bodyMedium     = TextStyle(fontFamily = BodyFamily,    fontWeight = FontWeight.Medium,    fontSize = (14 * scale).sp, lineHeight = (21 * scale).sp),
    bodySmall      = TextStyle(fontFamily = BodyFamily,    fontWeight = FontWeight.Medium,    fontSize = (12 * scale).sp, lineHeight = (18 * scale).sp),
    labelLarge     = TextStyle(fontFamily = BodyFamily,    fontWeight = FontWeight.Bold,      fontSize = (15 * scale).sp, lineHeight = (18 * scale).sp),
    labelMedium    = TextStyle(fontFamily = BodyFamily,    fontWeight = FontWeight.SemiBold,  fontSize = (13 * scale).sp, lineHeight = (16 * scale).sp),
    labelSmall     = TextStyle(fontFamily = BodyFamily,    fontWeight = FontWeight.SemiBold,  fontSize = (11 * scale).sp, lineHeight = (14 * scale).sp),
)

@Immutable
data class MoVisuals(
    /** Primary accent — adapts to poster palette or defaults to GlassChampagne */
    val accent : Color = GlassChampagne,
    /** Deep glass background */
    val glass  : Color = Color(0x66241914),
    /** Frosted highlight layer */
    val frosted: Color = Color(0x0DFFFFFF),
    /** Border line color */
    val line   : Color = Color(0x33E3BC78),
    /** Glow for shadows/focus */
    val glow   : Color = Color(0x88E3BC78),
    /** Secondary accent (Fiery Orange) */
    val accentB: Color = FieryOrange,
    /** Tertiary accent (Warm Amber) */
    val accentC: Color = WarmAmber,
    /** Highlight warm */
    val accentWarm: Color = LuxuryAmber,
)

val LocalMoVisuals = staticCompositionLocalOf { MoVisuals() }

@Composable
fun MoTheme(
    accent: Color = GlassChampagne,
    content: @Composable () -> Unit,
) {
    val configuration = LocalConfiguration.current
    val shortestDp = minOf(configuration.screenWidthDp, configuration.screenHeightDp)
    val typeScale = remember(shortestDp) {
        when {
            shortestDp < 360 -> 0.76f
            shortestDp < 400 -> 0.80f
            shortestDp < 480 -> 0.84f
            shortestDp < 600 -> 0.90f
            shortestDp < 720 -> 0.96f
            else -> 1f
        }
    }
    
    val clamped = accent.clampToWarmPalette()
    val visuals = MoVisuals(
        accent  = clamped,
        glass   = Color(0x66241914),
        frosted = Color(0x0DFFFFFF),
        line    = Color(0x33E3BC78),
        glow    = clamped.copy(alpha = 0.50f),
        accentB = FieryOrange,
        accentC = WarmAmber,
        accentWarm = LuxuryAmber,
    )
    
    androidx.compose.runtime.CompositionLocalProvider(LocalMoVisuals provides visuals) {
        MaterialTheme(
            colorScheme = colors(clamped),
            typography  = appTypography(typeScale),
            content     = content,
        )
    }
}

/**
 * Clamps extracted palette colors to the warm luxury range.
 * Prevents cold blues/greens from breaking the fiery glass identity.
 */
private fun Color.clampToWarmPalette(): Color {
    val r = red; val g = green; val b = blue
    val luminance = 0.2126f * r + 0.7152f * g + 0.0722f * b
    // Too dark — fallback to champagne gold
    if (luminance < 0.1f) return GlassChampagne
    // Too blue/cyan — redirect to warm palette
    if (b > 0.6f && b > r * 1.5f && b > g * 1.5f) return GlassChampagne
    // Too green — redirect to warm palette
    if (g > 0.6f && g > r * 1.5f && g > b * 1.5f) return GlassChampagne
    return this
}
