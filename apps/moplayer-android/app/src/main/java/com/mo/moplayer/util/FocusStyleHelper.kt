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
    
    private const val CARD_CORNER_RADIUS = 16f
    private const val FOCUS_BORDER_WIDTH = 2f
    private const val OUTER_GLOW_WIDTH = 4f
    
    /** One theme-colored outline with a restrained halo; no second competing ring. */
    fun createFocusBorder(accentColor: Int, density: Float = 1f): LayerDrawable = LayerDrawable(arrayOf(
        createOuterGlowLayer(accentColor, density),
        createMainBorderLayer(accentColor, density)
    ))

    /**
     * Creates a low-opacity halo around the main outline
     */
    private fun createOuterGlowLayer(accentColor: Int, density: Float): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = CARD_CORNER_RADIUS * density
            setStroke(
                (OUTER_GLOW_WIDTH * density).toInt(),
                Color.argb(
                    38,
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
    private fun createMainBorderLayer(accentColor: Int, density: Float): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = CARD_CORNER_RADIUS * density
            setStroke((FOCUS_BORDER_WIDTH * density).toInt(), accentColor)
            setColor(Color.TRANSPARENT)
        }
    }
    
    /**
     * Creates a radial gradient glow background for focused elements
     * 
     * Replicates: res/drawable/bg_poster_glow.xml
     */
    fun createFocusGlow(accentColor: Int, density: Float = 1f): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = CARD_CORNER_RADIUS * density

            gradientType = GradientDrawable.RADIAL_GRADIENT
            gradientRadius = 120f * density

            colors = intArrayOf(
                Color.argb(
                    46,
                    Color.red(accentColor),
                    Color.green(accentColor),
                    Color.blue(accentColor)
                ),
                Color.argb(
                    18,
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
            cornerRadius = 10f
            setStroke(3, accentColor)
            setColor(
                Color.argb(
                    18,
                    Color.red(accentColor),
                    Color.green(accentColor),
                    Color.blue(accentColor)
                )
            )
        }
    }

    /**
     * Creates a channel focus glow (used in LiveTV). A left-anchored accent wash plus a brighter
     * leading edge so the focused channel row reads instantly across the room.
     */
    fun createChannelFocusGlow(accentColor: Int): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 10f

            gradientType = GradientDrawable.LINEAR_GRADIENT
            orientation = GradientDrawable.Orientation.LEFT_RIGHT

            colors = intArrayOf(
                Color.argb(120, Color.red(accentColor), Color.green(accentColor), Color.blue(accentColor)),
                Color.argb(60, Color.red(accentColor), Color.green(accentColor), Color.blue(accentColor)),
                Color.TRANSPARENT
            )
        }
    }
}
