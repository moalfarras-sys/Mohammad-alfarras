package com.mo.moplayer.ui.settings.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.mo.moplayer.R
import com.mo.moplayer.ui.settings.SettingsActivity

class SettingsCategoryAdapter(
    private val onCategoryClick: (SettingsActivity.SettingsCategory) -> Unit
) : ListAdapter<SettingsActivity.SettingsCategory, SettingsCategoryAdapter.CategoryViewHolder>(CategoryDiffCallback()) {

    private var selectedId: String = "server"

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CategoryViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_settings_category, parent, false)
        return CategoryViewHolder(view)
    }

    override fun onBindViewHolder(holder: CategoryViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    fun setSelectedCategory(id: String) {
        val oldId = selectedId
        selectedId = id

        currentList.forEachIndexed { index, category ->
            if (category.id == oldId || category.id == id) {
                notifyItemChanged(index)
            }
        }
    }

    inner class CategoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvName: TextView = itemView.findViewById(R.id.tvCategoryName)
        private val indicator: View = itemView.findViewById(R.id.selectionIndicator)

        fun bind(category: SettingsActivity.SettingsCategory) {
            tvName.text = category.name

            val isSelected = category.id == selectedId
            itemView.isSelected = isSelected

            val textColor = if (isSelected) {
                ContextCompat.getColor(itemView.context, R.color.htc_accent_green)
            } else {
                ContextCompat.getColor(itemView.context, R.color.htc_text_primary)
            }
            tvName.setTextColor(textColor)

            indicator.visibility = if (isSelected) View.VISIBLE else View.INVISIBLE

            itemView.setOnClickListener {
                onCategoryClick(category)
            }

            itemView.setOnFocusChangeListener { v, hasFocus ->
                animateFocus(v, hasFocus)
            }
        }

        private fun animateFocus(view: View, hasFocus: Boolean) {
            val translationX = if (hasFocus) 8f else 0f
            val scale = if (hasFocus) 1.02f else 1f
            view.animate()
                .translationX(translationX)
                .scaleX(scale)
                .scaleY(scale)
                .setDuration(150)
                .start()
        }
    }

    class CategoryDiffCallback : DiffUtil.ItemCallback<SettingsActivity.SettingsCategory>() {
        override fun areItemsTheSame(
            oldItem: SettingsActivity.SettingsCategory,
            newItem: SettingsActivity.SettingsCategory
        ): Boolean = oldItem.id == newItem.id

        override fun areContentsTheSame(
            oldItem: SettingsActivity.SettingsCategory,
            newItem: SettingsActivity.SettingsCategory
        ): Boolean = oldItem == newItem
    }
}
