package com.mo.moplayer.util

import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.LayerDrawable

/**
 * Utility object for creating dynamic focus borders, glows, and indicators
 * that adapt to the current theme accent color.
 * 
 * This replaces static XML drawables with programmatically generated drawables
 * that use the user's selected accent color in real-time.
 */
object FocusStyleHelper {
    
    private const val CARD_CORNER_RADIUS = 20f
    private const val FOCUS_BORDER_WIDTH = 2f
    private const val OUTER_GLOW_WIDTH = 6f
    private const val INNER_HIGHLIGHT_WIDTH = 1f
    private const val INNER_HIGHLIGHT_INSET = 4
    private const val INNER_CORNER_RADIUS = 14f
    
    /**
     * Creates a 3-layer focus border drawable:
     * 1. Outer glow layer (6dp stroke with 30% alpha)
     * 2. Main border (2dp stroke with accent color)
     * 3. Inner highlight (1dp stroke with white glass effect)
     * 
     * Replicates: res/drawable/focus_border.xml
     */
    fun createFocusBorder(accentColor: Int): LayerDrawable {
        val layers = arrayOf(
            createOuterGlowLayer(accentColor),
            createMainBorderLayer(accentColor),
            createInnerHighlightLayer()
        )
        
        val layerDrawable = LayerDrawable(layers)
        
        // Apply insets to inner highlight layer (index 2)
        layerDrawable.setLayerInset(
            2,
            INNER_HIGHLIGHT_INSET,
            INNER_HIGHLIGHT_INSET,
            INNER_HIGHLIGHT_INSET,
            INNER_HIGHLIGHT_INSET
        )
        
        return layerDrawable
    }
    
    /**
     * Creates the outer glow layer with 30% alpha accent color
     */
    private fun createOuterGlowLayer(accentColor: Int): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = CARD_CORNER_RADIUS
            setStroke(
                OUTER_GLOW_WIDTH.toInt(),
                Color.argb(
                    72,
                    Color.red(accentColor),
                    Color.green(accentColor),
                    Color.blue(accentColor)
                )
            )
            setColor(Color.TRANSPARENT)
        }
    }
    
    /**
     * Creates the main border layer with full accent color
     */
    private fun createMainBorderLayer(accentColor: Int): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = CARD_CORNER_RADIUS
            setStroke(FOCUS_BORDER_WIDTH.toInt(), accentColor)
            setColor(Color.TRANSPARENT)
        }
    }
    
    /**
     * Creates the inner white highlight layer (glass effect)
     */
    private fun createInnerHighlightLayer(): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = INNER_CORNER_RADIUS
            setStroke(
                INNER_HIGHLIGHT_WIDTH.toInt(),
                Color.parseColor("#4DFFFFFF") // htc_glass_highlight
            )
            setColor(Color.TRANSPARENT)
        }
    }
    
    /**
     * Creates a radial gradient glow background for focused elements
     * 
     * Replicates: res/drawable/bg_poster_glow.xml
     */
    fun createFocusGlow(accentColor: Int): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 20f

            gradientType = GradientDrawable.RADIAL_GRADIENT
            gradientRadius = 200f

            colors = intArrayOf(
                Color.argb(
                    64,
                    Color.red(accentColor),
                    Color.green(accentColor),
                    Color.blue(accentColor)
                ),
                Color.argb(
                    20,
                    Color.red(accentColor),
                    Color.green(accentColor),
                    Color.blue(accentColor)
                ),
                Color.TRANSPARENT
            )

            setGradientCenter(0.5f, 0.5f)
        }
    }
    
    /**
     * Creates a linear gradient indicator for dock/navigation items
     * Used for the glowing indicator under selected dock items
     */
    fun createDockGlowIndicator(accentColor: Int): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 4f
            
            // Linear gradient from transparent to accent color and back
            gradientType = GradientDrawable.LINEAR_GRADIENT
            orientation = GradientDrawable.Orientation.LEFT_RIGHT
            
            colors = intArrayOf(
                Color.TRANSPARENT,
                Color.argb(
                    204, // 80% alpha
                    Color.red(accentColor),
                    Color.green(accentColor),
                    Color.blue(accentColor)
                ),
                Color.TRANSPARENT
            )
        }
    }
    
    /**
     * Creates a button focus background with accent color
     * Used for focused buttons and interactive elements
     */
    fun createButtonFocusBackground(accentColor: Int): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 8f
            
            // Semi-transparent accent color background
            setColor(
                Color.argb(
                    40, // 15% alpha
                    Color.red(accentColor),
                    Color.green(accentColor),
                    Color.blue(accentColor)
                )
            )
            
            // Border with full accent color
            setStroke(
                2,
                accentColor
            )
        }
    }
    
    /**
     * Creates a channel focus border (used in LiveTV)
     * Similar to createFocusBorder but with different dimensions
     */
    fun createChannelFocusBorder(accentColor: Int): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 8f
            setStroke(2, accentColor)
            setColor(Color.TRANSPARENT)
        }
    }
    
    /**
     * Creates a channel focus glow (used in LiveTV)
     */
    fun createChannelFocusGlow(accentColor: Int): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 8f
            
            gradientType = GradientDrawable.LINEAR_GRADIENT
            orientation = GradientDrawable.Orientation.LEFT_RIGHT
            
            colors = intArrayOf(
                Color.TRANSPARENT,
                Color.argb(
                    40, // 16% alpha
                    Color.red(accentColor),
                    Color.green(accentColor),
                    Color.blue(accentColor)
                ),
                Color.TRANSPARENT
            )
        }
    }
}
