package com.mo.moplayer.ui.common.design

import com.mo.moplayer.R

/**
 * Central resource contract for the Premium TV design system.
 * Keep UI layers mapped through these tokens instead of raw values.
 */
object UiTokens {
    object Color {
        val BackgroundBase = R.color.theme_surface_base
        val BackgroundElevated = R.color.theme_surface_elevated
        val Surface = R.color.theme_surface_card
        val TextPrimary = R.color.color_text_primary
        val TextSecondary = R.color.color_text_secondary
        val Accent = R.color.color_accent_primary
        val FocusGlow = R.color.color_focus_glow
        val Divider = R.color.color_divider
        val Overlay = R.color.color_overlay
    }

    object Dimen {
        val RadiusSmall = R.dimen.radius_small
        val RadiusMedium = R.dimen.radius_medium
        val RadiusLarge = R.dimen.radius_large
        val RadiusXLarge = R.dimen.radius_xlarge

        val Spacing4 = R.dimen.spacing_4
        val Spacing8 = R.dimen.spacing_8
        val Spacing12 = R.dimen.spacing_12
        val Spacing16 = R.dimen.spacing_16
        val Spacing24 = R.dimen.spacing_24
        val Spacing32 = R.dimen.spacing_32
    }
}
