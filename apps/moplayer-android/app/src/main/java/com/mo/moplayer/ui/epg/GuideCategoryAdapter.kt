package com.mo.moplayer.ui.epg

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.CategoryEntity

/** Horizontal category filter chips above the guide grid. */
class GuideCategoryAdapter(
    private val onSelect: (String?) -> Unit
) : RecyclerView.Adapter<GuideCategoryAdapter.VH>() {

    data class Chip(val id: String?, val label: String)

    private val items = ArrayList<Chip>()
    private var selectedId: String? = null

    fun submit(categories: List<CategoryEntity>, allLabel: String, selectedId: String?) {
        items.clear()
        items.add(Chip(null, allLabel))
        categories.forEach { items.add(Chip(it.categoryId, it.name)) }
        this.selectedId = selectedId
        notifyDataSetChanged()
    }

    fun setSelected(id: String?) {
        if (id == selectedId) return
        selectedId = id
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_guide_category, parent, false) as TextView
        return VH(view)
    }

    override fun getItemCount(): Int = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val chip = items[position]
        holder.chip.text = chip.label
        holder.chip.isSelected = chip.id == selectedId
        holder.chip.setOnClickListener { onSelect(chip.id) }
    }

    class VH(val chip: TextView) : RecyclerView.ViewHolder(chip)
}
