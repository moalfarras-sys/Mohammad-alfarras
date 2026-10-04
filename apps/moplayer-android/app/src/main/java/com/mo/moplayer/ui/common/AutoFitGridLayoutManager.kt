package com.mo.moplayer.ui.common

import android.content.Context
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kotlin.math.max

/**
 * GridLayoutManager that picks its column count from the RecyclerView's real width.
 *
 * Counting columns from the screen width breaks as soon as a side panel takes part of the screen
 * (cards overlap or get cut). Here the count is recalculated on every layout pass from the space
 * the grid actually has, so cards keep their size and the grid simply shows fewer columns.
 */
class AutoFitGridLayoutManager(
    context: Context,
    private var columnWidthPx: Int,
    private val minColumns: Int = 2,
    private val maxColumns: Int = 10
) : GridLayoutManager(context, max(1, minColumns)) {

    private var lastWidth = -1

    fun setColumnWidth(px: Int) {
        if (px > 0 && px != columnWidthPx) {
            columnWidthPx = px
            lastWidth = -1
            requestLayout()
        }
    }

    override fun onLayoutChildren(recycler: RecyclerView.Recycler?, state: RecyclerView.State?) {
        val available = width - paddingLeft - paddingRight
        if (available > 0 && columnWidthPx > 0 && available != lastWidth) {
            lastWidth = available
            val columns = (available / columnWidthPx).coerceIn(max(1, minColumns), max(minColumns, maxColumns))
            if (columns != spanCount) spanCount = columns
        }
        super.onLayoutChildren(recycler, state)
    }
}
