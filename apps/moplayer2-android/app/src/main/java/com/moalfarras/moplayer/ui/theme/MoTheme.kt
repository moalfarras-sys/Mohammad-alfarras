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
import com.moalfarras.moplayerpro.R

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM FIERY GLASS — Warm Luxury Gold & Ember Palette
// ─────────────────────────────────────────────────────────────────────────────

/** Primary gold accent. */
val GlassChampagne = Color(0xFFF1CC83)
/** Default brand accent — Fiery Orange. */
val FieryOrange    = Color(0xFFFF9248)
/** Tertiary accent — Warm Amber */
val WarmAmber      = Color(0xFFFFC078)
/** Highlight accent — Ember Red/Rose */
val EmberRose      = Color(0xFFFF6B6B)
/** Luxury dark base */
val WarmEspresso   = Color(0xFF15100B)

// Legacy aliases for backward compat
val RoyalBlue   = FieryOrange
val NeonViolet  = WarmAmber
val LuxuryAmber = Color(0xFFFFD78A)

val MidnightBlack = Color(0xFF060509)
val DeepNavy      = Color(0xFF0E0C0D)
val MoSurface     = Color(0xFF141118)
val MoSurfaceHigh = Color(0xFF221C1B)
val MoTextPrimary = Color(0xFFFBF9F4)
val MoTextMuted   = Color(0xFFC3B7A6)
val MoLiveRed     = Color(0xFFFF3B4D)
val MoSuccess     = Color(0xFF7FD98A)

data class AccentPreset(val value: Long, val color: Color, val label: String)

val MoAccentPresets = listOf(
    AccentPreset(0xFFFF9248L, FieryOrange, "Orange"),
    AccentPreset(0xFFF1CC83L, GlassChampagne, "Gold"),
    AccentPreset(0xFFFF3B4DL, MoLiveRed, "Red"),
    AccentPreset(0xFF34D399L, Color(0xFF34D399), "Green"),
    AccentPreset(0xFF4DA3FFL, Color(0xFF4DA3FF), "Blue"),
    AccentPreset(0xFF9B6BFFL, Color(0xFF9B6BFF), "Purple"),
)

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM TOKENS — Spacing, Elevation, Radius, Motion
// ─────────────────────────────────────────────────────────────────────────────

/** Standardized spacing tokens for consistent padding/margins across components */
object MoSpacing {
    val xxs  = 2   // Micro gaps (between dots, inline)
    val xs   = 4   // Tight gaps (icon-to-text)
    val sm   = 8   // Small gaps (compact list items)
    val md   = 12  // Medium (standard content spacing)
    val lg   = 16  // Large (section spacing)
    val xl   = 20  // Extra (panel padding)
    val xxl  = 28  // Hero (screen edges)
    val xxxl = 40  // Maximum (TV margin)
}

/** Shadow/elevation tokens for layered depth effects */
object MoElevation {
    val none  = 0   // Flat elements
    val low   = 4   // Subtle hover/rest state
    val mid   = 12  // Cards, panels
    val high  = 24  // Modals, overlays
    val ultra = 40  // Floating control islands
}

/** Corner radius tokens for consistent rounding */
object MoRadius {
    val xs    = 6   // Tiny chips, tags
    val sm    = 10  // Buttons, input fields
    val md    = 16  // Cards, panels
    val lg    = 24  // Large panels, widgets
    val xl    = 28  // Control islands
    val pill  = 999 // Full pill shape (dock, capsules)
}

/** Motion duration/easing tokens */
object MoMotion {
    val instant   = 100  // Micro-interaction (press feedback)
    val fast      = 200  // Quick transitions (fade, slide)
    val standard  = 350  // Standard transitions (page, panel)
    val slow      = 600  // Deliberate animations (morph, expand)
    val ambient   = 3000 // Breathing/pulse ambient effects
    val stiffness = 340f // Spring stiffness for dock/button animations
    val damping   = 0.62f // Spring damping ratio
}

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
    secondary          = MoSurfaceHigh,
    tertiary           = Color(0xFF2A1D15),
    background         = MidnightBlack,
    surface            = MoSurface,
    surfaceVariant     = Color(0x22FFFFFF),
    onPrimary          = Color(0xFF0A0908),
    onSecondary        = MoTextPrimary,
    onBackground       = MoTextPrimary,
    onSurface          = MoTextPrimary,
    onSurfaceVariant   = MoTextMuted,
    outline            = Color(0x33F1CC83),
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
    val glass  : Color = Color(0x66221C1B),
    /** Frosted highlight layer */
    val frosted: Color = Color(0x0DFFFFFF),
    /** Border line color */
    val line   : Color = Color(0x33F1CC83),
    /** Glow for shadows/focus */
    val glow   : Color = Color(0x88F1CC83),
    /** Secondary accent (Fiery Orange) */
    val accentB: Color = FieryOrange,
    /** Tertiary accent (Warm Amber) */
    val accentC: Color = WarmAmber,
    /** Highlight warm */
    val accentWarm: Color = LuxuryAmber,
    val background: Color = MidnightBlack,
    val surface: Color = MoSurface,
    val surfaceHigh: Color = MoSurfaceHigh,
    val textPrimary: Color = MoTextPrimary,
    val textMuted: Color = MoTextMuted,
    val live: Color = MoLiveRed,
    val success: Color = MoSuccess,
    val error: Color = EmberRose,
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
    
    val clamped = accent
    val visuals = MoVisuals(
        accent  = clamped,
        glass   = Color(0x66221C1B),
        frosted = Color(0x0DFFFFFF),
        line    = Color(0x33F1CC83),
        glow    = clamped.copy(alpha = 0.50f),
        accentB = FieryOrange,
        accentC = WarmAmber,
        accentWarm = LuxuryAmber,
        background = MidnightBlack,
        surface = MoSurface,
        surfaceHigh = MoSurfaceHigh,
        textPrimary = MoTextPrimary,
        textMuted = MoTextMuted,
        live = MoLiveRed,
        success = MoSuccess,
        error = EmberRose,
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
