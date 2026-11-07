package com.mo.moplayer

import android.os.Build
import android.content.res.Configuration
import android.graphics.Color
import androidx.core.graphics.ColorUtils
import androidx.core.content.res.ResourcesCompat
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mo.moplayer.util.DisplayScale
import com.mo.moplayer.util.readableButtonTextColors
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ClassicTypographyTest {
    @Test fun nightAndPlayerThemesKeepTheSameSemanticBodyFont() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        for (night in listOf(Configuration.UI_MODE_NIGHT_NO, Configuration.UI_MODE_NIGHT_YES)) {
            val config = Configuration(context.resources.configuration).apply {
                uiMode = (uiMode and Configuration.UI_MODE_NIGHT_MASK.inv()) or night
            }
            val local = context.createConfigurationContext(config)
            for (style in listOf(R.style.Theme_MoPlayer, R.style.Theme_MoPlayer_Neon,
                R.style.Theme_MoPlayer_Fullscreen, R.style.Theme_MoPlayer_Dialog)) {
                val theme = local.resources.newTheme().apply { applyStyle(style, true) }
                val attributes = theme.obtainStyledAttributes(intArrayOf(android.R.attr.fontFamily))
                try { assertEquals("Theme lost its bundled body font: $style/$night", R.font.ui_body_regular, attributes.getResourceId(0, 0)) }
                finally { attributes.recycle() }
            }
        }
    }

    @Test fun primaryButtonTextKeepsContrastAcrossEveryAccentAndInteractionState() {
        for (hex in listOf("#5B7CFF", "#AFC0FF", "#00E5FF", "#FFD28A", "#FF7A90", "#FFFFFF")) {
            val accent = Color.parseColor(hex)
            val colors = readableButtonTextColors(accent)
            fun shade(f: Float) = Color.rgb((Color.red(accent) * f).toInt(), (Color.green(accent) * f).toInt(), (Color.blue(accent) * f).toInt())
            val states = listOf(
                intArrayOf(android.R.attr.state_enabled) to listOf(ColorUtils.compositeColors(Color.argb(12, 255, 255, 255), accent), shade(.93f)),
                intArrayOf(android.R.attr.state_enabled, android.R.attr.state_focused) to listOf(ColorUtils.compositeColors(Color.argb(20, 255, 255, 255), accent), shade(.9f)),
                intArrayOf(android.R.attr.state_enabled, android.R.attr.state_pressed) to listOf(shade(.7f), shade(.6f)))
            for ((state, backgrounds) in states) for (background in backgrounds) {
                val contrast = ColorUtils.calculateContrast(colors.getColorForState(state, colors.defaultColor), background)
                assertTrue("Unreadable primary button: $hex, contrast $contrast", contrast >= 4.5)
            }
        }
    }

    @Test fun platformAndAppCompatLoadTheBundledFamiliesInBothLanguages() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val previous = DisplayScale.language(context)
        try {
            for (language in listOf("en", "ar")) {
                DisplayScale.setLanguage(context, language)
                val localized = DisplayScale.localized(context)
                for (family in listOf(R.font.ui_body_regular, R.font.ui_body_medium, R.font.ui_body_bold,
                    R.font.ui_display_bold, R.font.ui_display_extrabold, R.font.dmsans, R.font.outfit, R.font.cairo)) {
                    val name = localized.resources.getResourceEntryName(family)
                    assertNotNull("AppCompat font failed: $language/$name", ResourcesCompat.getFont(localized, family))
                    if (Build.VERSION.SDK_INT >= 26) {
                        assertNotNull("Platform font failed: $language/$name", localized.resources.getFont(family))
                    }
                }
            }
        } finally { DisplayScale.setLanguage(context, previous) }
    }
}
