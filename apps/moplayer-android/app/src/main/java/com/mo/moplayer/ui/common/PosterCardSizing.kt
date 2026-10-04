package com.mo.moplayer.ui.common

import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView

/** Sizing rules shared by every adapter that shows poster cards. */
object PosterCardSizing {

    /**
     * In an [AutoFitGridLayoutManager] grid the card fills its cell (the cell width already
     * follows the poster size setting); in other layouts it keeps its fixed width.
     */
    fun fitGridCell(card: View, parent: ViewGroup) {
        val recycler = parent as? RecyclerView ?: return
        if (recycler.layoutManager !is AutoFitGridLayoutManager) return
        val params = card.layoutParams ?: return
        params.width = ViewGroup.LayoutParams.MATCH_PARENT
        card.layoutParams = params
    }
}
