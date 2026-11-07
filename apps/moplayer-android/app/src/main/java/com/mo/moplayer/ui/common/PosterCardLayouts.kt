package com.mo.moplayer.ui.common

import android.view.LayoutInflater
import android.view.ViewGroup
import com.mo.moplayer.R
import com.mo.moplayer.databinding.ItemContentCardBinding

/** Both presentations expose the same content and remote controls. */
internal object PosterCardLayouts {
    fun inflate(parent: ViewGroup, wide: Boolean): ItemContentCardBinding {
        val inflater = LayoutInflater.from(parent.context)
        return if (wide) {
            ItemContentCardBinding.bind(inflater.inflate(R.layout.item_content_wide_card, parent, false))
        } else {
            ItemContentCardBinding.inflate(inflater, parent, false).also {
                PosterCardSizing.fitGridCell(it.root, parent)
            }
        }
    }
}
