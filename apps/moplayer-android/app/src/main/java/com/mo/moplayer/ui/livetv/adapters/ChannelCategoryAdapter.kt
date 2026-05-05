package com.mo.moplayer.ui.livetv.adapters

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.OvershootInterpolator
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.CategoryEntity
import com.mo.moplayer.databinding.ItemChannelCategoryBinding

// Wrapper class to handle "All categories" option
data class CategoryItem(
    val category: CategoryEntity?,
    val isAll: Boolean = category == null
) {
    val id: String get() = category?.categoryId ?: "all"
}

class ChannelCategoryAdapter(
    private val onCategoryClick: (CategoryEntity?) -> Unit,
    private val onCategoryFocused: (CategoryEntity?) -> Unit
) : ListAdapter<CategoryItem, ChannelCategoryAdapter.CategoryViewHolder>(CategoryDiffCallback()) {

    private var selectedCategoryId: String? = null
    private var isUpdating = false
    private var pendingSelectedCategoryId: String? = null

    fun setSelectedCategoryId(categoryId: String?) {
        if (isUpdating) {
            pendingSelectedCategoryId = categoryId
            return
        }
        updateSelectedCategoryInternal(categoryId)
    }

    private fun updateSelectedCategoryInternal(categoryId: String?) {
        val oldId = selectedCategoryId
        if (oldId == categoryId) return
        
        selectedCategoryId = categoryId
        
        // Notify changes for old and new selection with bounds checking
        try {
            currentList.forEachIndexed { index, item ->
                if (index >= itemCount) return@forEachIndexed
                val catId = item.category?.categoryId
                if (catId == oldId || catId == categoryId || (item.isAll && (oldId == null || categoryId == null))) {
                    notifyItemChanged(index)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun submitCategoryList(categories: List<CategoryEntity?>) {
        val items = categories.map { CategoryItem(it) }
        isUpdating = true
        submitList(items) {
            isUpdating = false
            pendingSelectedCategoryId?.let { id ->
                updateSelectedCategoryInternal(id)
            }
            pendingSelectedCategoryId = null
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CategoryViewHolder {
        val binding = ItemChannelCategoryBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return CategoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CategoryViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class CategoryViewHolder(
        private val binding: ItemChannelCategoryBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(item: CategoryItem) {
            val category = item.category
            val isAll = item.isAll
            val categoryId = category?.categoryId
            val isSelected = if (isAll) selectedCategoryId == null else categoryId == selectedCategoryId

            binding.tvCategoryName.text = if (isAll) {
                binding.root.context.getString(R.string.all_categories)
            } else {
                category?.name ?: ""
            }

            val container = binding.categoryContainer
            container.isSelected = isSelected
            
            // Update text color based on selection
            val textColor = if (isSelected) {
                ContextCompat.getColor(binding.root.context, R.color.htc_pure_black)
            } else {
                ContextCompat.getColor(binding.root.context, R.color.htc_text_primary)
            }
            binding.tvCategoryName.setTextColor(textColor)

            // Show selection indicator
            binding.selectionIndicator.visibility = if (isSelected) View.VISIBLE else View.GONE

            container.setOnClickListener {
                onCategoryClick(category)
            }

            container.setOnFocusChangeListener { v, hasFocus ->
                if (hasFocus) onCategoryFocused(category)
                animateFocus(hasFocus)
            }
        }

        private fun animateFocus(hasFocus: Boolean) {
            val scale = if (hasFocus) 1.05f else 1.0f
            val glowAlpha = if (hasFocus) 0.8f else 0f
            val borderAlpha = if (hasFocus) 1f else 0f
            val duration = 150L
            
            // Scale the container
            binding.categoryContainer.animate()
                .scaleX(scale)
                .scaleY(scale)
                .setDuration(duration)
                .setInterpolator(OvershootInterpolator(1.5f))
                .start()
            
            // Animate focus glow
            binding.focusGlow.animate()
                .alpha(glowAlpha)
                .setDuration(duration)
                .start()
            
            // Animate focus border
            binding.focusBorder.animate()
                .alpha(borderAlpha)
                .setDuration(duration)
                .start()
            
            // Bring to front when focused
            if (hasFocus) {
                binding.root.bringToFront()
            }
        }
    }

    class CategoryDiffCallback : DiffUtil.ItemCallback<CategoryItem>() {
        override fun areItemsTheSame(oldItem: CategoryItem, newItem: CategoryItem): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: CategoryItem, newItem: CategoryItem): Boolean {
            return oldItem == newItem
        }
    }
}
