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
import com.moalfarras.moplayer.core.Adaptive
import com.moalfarras.moplayerpro.R

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
val RoyalBlue   = FieryOrange
val NeonViolet  = WarmAmber
val LuxuryAmber = Color(0xFFFFD27A)

val MidnightBlack = Color(0xFF0A0908)
val DeepNavy      = Color(0xFF141110)
val MoSurface     = Color(0xFF18130F)
val MoSurfaceHigh = Color(0xFF241914)
val MoTextPrimary = Color(0xFFF8F2EA)
val MoTextMuted   = Color(0xFFCDBBA6)
val MoLiveRed     = Color(0xFFFF3B4D)
val MoSuccess     = Color(0xFF8BD88B)

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
    secondary          = Color(0xFF1A1C20),
    tertiary           = Color(0xFF23252A),
    background         = Color(0xFF07080A),
    surface            = Color(0xFF101114),
    surfaceVariant     = Color(0x22FFFFFF),
    onPrimary          = Color(0xFF0A0908),
    onSecondary        = Color(0xFFF0F2F5),
    onBackground       = Color(0xFFF0F2F5),
    onSurface          = Color(0xFFF0F2F5),
    onSurfaceVariant   = Color(0xFF9AA0A6),
    outline            = accent.copy(alpha = 0.35f),
    error              = Color(0xFFFF3B30),
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
    val isTv = Adaptive.isTv
    val typeScale = remember(shortestDp, isTv) {
        if (isTv) {
            0.75f
        } else {
            when {
                shortestDp < 360 -> 0.76f
                shortestDp < 400 -> 0.80f
                shortestDp < 480 -> 0.84f
                shortestDp < 600 -> 0.90f
                shortestDp < 720 -> 0.96f
                else -> 1f
            }
        }
    }
    
    val clamped = accent
    // Instead of forcing warm colors and hardcoding FieryOrange, we derive a sleek palette
    // based on the chosen accent so the whole app transforms beautifully.
    val visuals = MoVisuals(
        accent  = clamped,
        glass   = Color(0x66101114), // Sleek, cool-neutral dark glass
        frosted = Color(0x0DFFFFFF),
        line    = clamped.copy(alpha = 0.35f), // Border lines tint with the accent
        glow    = clamped.copy(alpha = 0.50f),
        // Derive complementary and secondary tones dynamically
        accentB = clamped.copy(alpha = 0.85f),
        accentC = clamped.copy(alpha = 0.65f),
        accentWarm = clamped,
        background = Color(0xFF07080A), // Very deep modern dark (nearly OLED black but slightly tinted)
        surface = Color(0xFF101114), // Modern elevated surface
        surfaceHigh = Color(0xFF1A1C20),
        textPrimary = Color(0xFFF0F2F5),
        textMuted = Color(0xFF9AA0A6),
        live = Color(0xFFFF3B30), // Modern iOS-like crisp red
        success = Color(0xFF34C759),
        error = Color(0xFFFF3B30),
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
