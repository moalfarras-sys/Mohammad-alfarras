package com.mo.moplayer.ui.movies.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.CategoryEntity
import com.mo.moplayer.databinding.ItemCategoryBinding

class CategoryAdapter(
    private val onCategoryClick: (CategoryEntity?) -> Unit,
    private val onCategoryFocused: (CategoryEntity?) -> Unit
) : ListAdapter<CategoryEntity, CategoryAdapter.CategoryViewHolder>(CategoryDiffCallback()) {

    private var selectedCategoryId: String = "all"

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CategoryViewHolder {
        val binding = ItemCategoryBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return CategoryViewHolder(binding)
    }

    override fun getItemViewType(position: Int): Int = VIEW_TYPE_MOVIE_SERIES_CATEGORY

    override fun onBindViewHolder(holder: CategoryViewHolder, position: Int) {
        val category = getItem(position)
        holder.bind(category)
    }

    fun setSelectedCategory(categoryId: String) {
        val oldId = selectedCategoryId
        selectedCategoryId = categoryId

        // Find and update old and new positions
        currentList.forEachIndexed { index, category ->
            if (category.categoryId == oldId || category.categoryId == categoryId) {
                notifyItemChanged(index)
            }
        }
    }

    inner class CategoryViewHolder(
        private val binding: ItemCategoryBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(category: CategoryEntity) {
            binding.tvCategoryName.text = category.name

            val isSelected = category.categoryId == selectedCategoryId
            binding.root.isSelected = isSelected

            // Update text color based on selection
            val textColor = if (isSelected) {
                ContextCompat.getColor(binding.root.context, R.color.htc_accent_green)
            } else {
                ContextCompat.getColor(binding.root.context, R.color.htc_text_primary)
            }
            binding.tvCategoryName.setTextColor(textColor)

            // Show selection indicator
            binding.selectionIndicator.visibility = if (isSelected) View.VISIBLE else View.INVISIBLE

            binding.root.setOnClickListener {
                val cat = if (category.categoryId == "all") null else category
                onCategoryClick(cat)
            }

            binding.root.setOnFocusChangeListener { v, hasFocus ->
                if (hasFocus) {
                    val cat = if (category.categoryId == "all") null else category
                    onCategoryFocused(cat)
                }
                animateFocus(v, hasFocus)
            }
        }

        private fun animateFocus(view: View, hasFocus: Boolean) {
            val translationX = if (hasFocus) 10f else 0f
            view.animate()
                .translationX(translationX)
                .setDuration(150)
                .start()
        }
    }

    class CategoryDiffCallback : DiffUtil.ItemCallback<CategoryEntity>() {
        override fun areItemsTheSame(oldItem: CategoryEntity, newItem: CategoryEntity): Boolean {
            return oldItem.categoryId == newItem.categoryId
        }

        override fun areContentsTheSame(oldItem: CategoryEntity, newItem: CategoryEntity): Boolean {
            return oldItem == newItem
        }
    }

    companion object {
        private const val VIEW_TYPE_MOVIE_SERIES_CATEGORY = 101
    }
}
