package com.mo.moplayer.util

import android.content.Context
import android.content.res.Resources
import androidx.recyclerview.widget.GridLayoutManager

/**
 * Helper class for calculating responsive layout dimensions and span counts
 * based on screen size and card dimensions.
 */
object LayoutHelper {
    
    /**
     * Calculates the optimal number of columns for a GridLayoutManager
     * based on screen width, card width, and margins.
     * 
     * @param context The context to get resources and screen dimensions
     * @param cardWidthDp The width of each card in dp
     * @param cardMarginDp The margin around each card in dp
     * @param screenMarginHorizontalDp The horizontal screen margin in dp
     * @param minColumns Minimum number of columns (default: 2)
     * @param maxColumns Maximum number of columns (default: 8)
     * @return The optimal number of columns for the grid
     */
    fun calculateSpanCount(
        context: Context,
        cardWidthDp: Int,
        cardMarginDp: Int,
        screenMarginHorizontalDp: Int,
        minColumns: Int = 2,
        maxColumns: Int = 8
    ): Int {
        val resources: Resources = context.resources
        val screenWidthDp = resources.configuration.screenWidthDp
            .takeIf { it > 0 }
            ?.toFloat()
            ?: (resources.displayMetrics.widthPixels / resources.displayMetrics.density)
        
        // Calculate available width (screen width minus margins)
        val availableWidth = screenWidthDp - (2 * screenMarginHorizontalDp)
        
        // Calculate width needed per card (card width + margins on both sides)
        val cardWithMargin = cardWidthDp + (2 * cardMarginDp)
        
        // Calculate how many cards can fit
        val calculatedColumns = (availableWidth / cardWithMargin).toInt()
        
        // Ensure we stay within min and max bounds
        return calculatedColumns.coerceIn(minColumns, maxColumns)
    }
    
    /**
     * Creates a GridLayoutManager with dynamically calculated span count.
     * 
     * @param context The context to get resources
     * @param cardWidthDp The width of each card in dp
     * @param cardMarginDp The margin around each card in dp
     * @param screenMarginHorizontalDp The horizontal screen margin in dp
     * @param minColumns Minimum number of columns (default: 2)
     * @param maxColumns Maximum number of columns (default: 8)
     * @return A configured GridLayoutManager
     */
    fun createResponsiveGridLayoutManager(
        context: Context,
        cardWidthDp: Int,
        cardMarginDp: Int,
        screenMarginHorizontalDp: Int,
        minColumns: Int = 2,
        maxColumns: Int = 8
    ): GridLayoutManager {
        val spanCount = calculateSpanCount(
            context = context,
            cardWidthDp = cardWidthDp,
            cardMarginDp = cardMarginDp,
            screenMarginHorizontalDp = screenMarginHorizontalDp,
            minColumns = minColumns,
            maxColumns = maxColumns
        )
        
        return GridLayoutManager(context, spanCount)
    }
    
    /**
     * Gets card width dimension from resources.
     * 
     * @param context The context to get resources
     * @return Card width in dp
     */
    fun getCardWidthDp(context: Context): Int {
        val resId = context.resources.getIdentifier("card_poster_width", "dimen", context.packageName)
        return if (resId != 0) {
            (context.resources.getDimension(resId) / context.resources.displayMetrics.density).toInt()
        } else {
            120 // Default fallback
        }
    }
    
    /**
     * Gets card margin dimension from resources.
     * 
     * @param context The context to get resources
     * @return Card margin in dp
     */
    fun getCardMarginDp(context: Context): Int {
        val resId = context.resources.getIdentifier("card_margin", "dimen", context.packageName)
        return if (resId != 0) {
            (context.resources.getDimension(resId) / context.resources.displayMetrics.density).toInt()
        } else {
            8 // Default fallback
        }
    }
    
    /**
     * Gets screen margin horizontal dimension from resources.
     * 
     * @param context The context to get resources
     * @return Screen horizontal margin in dp
     */
    fun getScreenMarginHorizontalDp(context: Context): Int {
        val resId = context.resources.getIdentifier("screen_margin_horizontal", "dimen", context.packageName)
        return if (resId != 0) {
            (context.resources.getDimension(resId) / context.resources.displayMetrics.density).toInt()
        } else {
            32 // Default fallback
        }
    }
}
