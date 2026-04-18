package com.mo.moplayer.util

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.LayerDrawable
import android.graphics.drawable.StateListDrawable
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Helper class for creating themed button backgrounds that respond to theme color changes.
 * Generates programmatic drawables with gradients, shine effects, and focus glows.
 */
@Singleton
class ButtonStyleHelper @Inject constructor(
    private val themeManager: ThemeManager
) {
    
    /**
     * Creates a themed button background that uses the current accent color
     */
    fun createThemedButtonBackground(context: Context): StateListDrawable {
        return StateListDrawable().apply {
            // Focused state
            addState(
                intArrayOf(android.R.attr.state_focused),
                createFocusedBackground(context)
            )
            // Pressed state
            addState(
                intArrayOf(android.R.attr.state_pressed),
                createPressedBackground(context)
            )
            // Default state
            addState(
                intArrayOf(),
                createDefaultBackground(context)
            )
        }
    }
    
    /**
     * Creates background for focused state with glow effect
     */
    private fun createFocusedBackground(context: Context): LayerDrawable {
        val accentColor = themeManager.currentAccentColor.value
        val cornerRadius = dpToPx(context, 14f)
        
        // Outer glow
        val glow = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setCornerRadius(cornerRadius + dpToPx(context, 2f))
            setColor(Color.argb(100, Color.red(accentColor), Color.green(accentColor), Color.blue(accentColor)))
        }
        
        // Main gradient
        val mainGradient = GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(accentColor, darkenColor(accentColor, 0.8f))
        ).apply {
            shape = GradientDrawable.RECTANGLE
            setCornerRadius(cornerRadius)
        }
        
        // Glass shine
        val shine = GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(
                Color.argb(128, 255, 255, 255),
                Color.TRANSPARENT
            )
        ).apply {
            shape = GradientDrawable.RECTANGLE
            setCornerRadius(cornerRadius)
        }
        
        return LayerDrawable(arrayOf(glow, mainGradient, shine)).apply {
            // Set insets for glow to show
            val inset = dpToPx(context, 3f).toInt()
            setLayerInset(1, inset, inset, inset, inset)
            setLayerInset(2, inset, inset, inset, inset)
        }
    }
    
    /**
     * Creates background for pressed state
     */
    private fun createPressedBackground(context: Context): GradientDrawable {
        val accentColor = themeManager.currentAccentColor.value
        val cornerRadius = dpToPx(context, 14f)
        
        return GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(darkenColor(accentColor, 0.7f), darkenColor(accentColor, 0.6f))
        ).apply {
            shape = GradientDrawable.RECTANGLE
            setCornerRadius(cornerRadius)
        }
    }
    
    /**
     * Creates background for default state
     */
    private fun createDefaultBackground(context: Context): LayerDrawable {
        val accentColor = themeManager.currentAccentColor.value
        val cornerRadius = dpToPx(context, 14f)
        
        // Main gradient
        val mainGradient = GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(accentColor, darkenColor(accentColor, 0.85f))
        ).apply {
            shape = GradientDrawable.RECTANGLE
            setCornerRadius(cornerRadius)
        }
        
        // Glass shine
        val shine = GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(
                Color.argb(96, 255, 255, 255),
                Color.TRANSPARENT
            )
        ).apply {
            shape = GradientDrawable.RECTANGLE
            setCornerRadius(cornerRadius)
        }
        
        return LayerDrawable(arrayOf(mainGradient, shine))
    }
    
    /**
     * Creates a secondary button background (outlined style)
     */
    fun createSecondaryButtonBackground(context: Context): StateListDrawable {
        val accentColor = themeManager.currentAccentColor.value
        val cornerRadius = dpToPx(context, 14f)
        
        return StateListDrawable().apply {
            // Focused state
            addState(
                intArrayOf(android.R.attr.state_focused),
                GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    setCornerRadius(cornerRadius)
                    setStroke(dpToPx(context, 2f).toInt(), accentColor)
                    setColor(Color.argb(32, 255, 255, 255))
                }
            )
            // Pressed state
            addState(
                intArrayOf(android.R.attr.state_pressed),
                GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    setCornerRadius(cornerRadius)
                    setColor(Color.argb(48, 255, 255, 255))
                }
            )
            // Default state
            addState(
                intArrayOf(),
                GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    setCornerRadius(cornerRadius)
                    setStroke(dpToPx(context, 1f).toInt(), Color.argb(64, 255, 255, 255))
                    setColor(Color.argb(21, 255, 255, 255))
                }
            )
        }
    }
    
    /**
     * Darkens a color by the given factor
     */
    private fun darkenColor(color: Int, factor: Float): Int {
        return Color.rgb(
            (Color.red(color) * factor).toInt(),
            (Color.green(color) * factor).toInt(),
            (Color.blue(color) * factor).toInt()
        )
    }
    
    /**
     * Converts dp to pixels
     */
    private fun dpToPx(context: Context, dp: Float): Float {
        return dp * context.resources.displayMetrics.density
    }
}
