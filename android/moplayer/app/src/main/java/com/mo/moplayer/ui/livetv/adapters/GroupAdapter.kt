package com.mo.moplayer.ui.livetv.adapters

import android.content.res.ColorStateList
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.core.widget.ImageViewCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.CategoryEntity
import com.mo.moplayer.databinding.ItemGroupTivimateBinding
import com.mo.moplayer.ui.common.focus.LiquidFocusDelegate

/**
 * Data class for group items, supporting "All" category
 */
data class GroupItem(
    val category: CategoryEntity?,
    val channelCount: Int = 0,
    val isAll: Boolean = category == null
) {
    val id: String get() = category?.categoryId ?: "all"
    val name: String get() = category?.name ?: ""
}

/**
 * TiviMate-style adapter for groups/categories
 */
class GroupAdapter(
    private val onGroupClick: (CategoryEntity?) -> Unit,
    private val onGroupFocused: (CategoryEntity?) -> Unit
) : ListAdapter<GroupItem, GroupAdapter.GroupViewHolder>(GroupDiffCallback()) {

    private var selectedGroupId: String? = null
    private var isUpdating = false
    private var pendingSelectedGroupId: String? = null

    fun setSelectedGroupId(categoryId: String?) {
        if (isUpdating) {
            // Defer the update until submitList completes
            pendingSelectedGroupId = categoryId
            return
        }
        updateSelectedGroupInternal(categoryId)
    }

    private fun updateSelectedGroupInternal(categoryId: String?) {
        val oldId = selectedGroupId
        if (oldId == categoryId) return
        
        selectedGroupId = categoryId

        // Notify changes for old and new selection with bounds checking
        try {
            currentList.forEachIndexed { index, item ->
                if (index >= itemCount) return@forEachIndexed
                val catId = item.category?.categoryId
                if (catId == oldId || catId == categoryId ||
                    (item.isAll && (oldId == null || categoryId == null))
                ) {
                    notifyItemChanged(index)
                }
            }
        } catch (e: Exception) {
            // Fallback: if notification fails during rapid updates, ignore
            e.printStackTrace()
        }
    }

    fun submitGroupList(categories: List<CategoryEntity?>, channelCounts: Map<String?, Int> = emptyMap()) {
        try {
            val items = categories.map { category ->
                GroupItem(
                    category = category,
                    channelCount = channelCounts[category?.categoryId] ?: 0
                )
            }
            
            // Only submit if list is different to avoid unnecessary updates
            if (items != currentList) {
                isUpdating = true
                submitList(items) {
                    isUpdating = false
                    // Apply pending selection after list is committed
                    pendingSelectedGroupId?.let { id ->
                        updateSelectedGroupInternal(id)
                    }
                    pendingSelectedGroupId = null
                }
            }
        } catch (e: Exception) {
            Log.e("GroupAdapter", "Error submitting group list", e)
            // Don't crash - the next update will fix the state
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): GroupViewHolder {
        val binding = ItemGroupTivimateBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return GroupViewHolder(binding)
    }

    override fun onBindViewHolder(holder: GroupViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class GroupViewHolder(
        private val binding: ItemGroupTivimateBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(item: GroupItem) {
            // Check if view is still attached before binding
            if (bindingAdapterPosition == RecyclerView.NO_POSITION) {
                return // View is being recycled, skip binding
            }
            
            try {
                val category = item.category
                val isAll = item.isAll
                val categoryId = category?.categoryId
                val isSelected = if (isAll) selectedGroupId == null else categoryId == selectedGroupId

                // Set group name
                binding.tvGroupName.text = if (isAll) {
                    binding.root.context.getString(R.string.all_categories)
                } else {
                    category?.name ?: ""
                }

                // Set channel count
                if (item.channelCount > 0) {
                    binding.tvChannelCount.visibility = View.VISIBLE
                    binding.tvChannelCount.text = binding.root.context.getString(
                        R.string.channel_count_format, item.channelCount
                    )
                } else {
                    binding.tvChannelCount.visibility = View.GONE
                }

                // Set icon based on category type
                val iconRes = getCategoryIcon(category?.name ?: "all")
                binding.ivGroupIcon.setImageResource(iconRes)

                // Update selection state
                binding.groupContainer.isSelected = isSelected
                binding.selectionIndicator.visibility = if (isSelected) View.VISIBLE else View.GONE

                // Update text and icon colors based on selection
                val context = binding.root.context
                if (isSelected) {
                    binding.tvGroupName.setTextColor(ContextCompat.getColor(context, R.color.liquid_text_primary))
                    binding.tvChannelCount.setTextColor(ContextCompat.getColor(context, R.color.liquid_text_secondary))
                    ImageViewCompat.setImageTintList(
                        binding.ivGroupIcon, 
                        ColorStateList.valueOf(ContextCompat.getColor(context, R.color.liquid_accent_primary))
                    )
                } else {
                    binding.tvGroupName.setTextColor(ContextCompat.getColor(context, R.color.liquid_text_primary))
                    binding.tvChannelCount.setTextColor(ContextCompat.getColor(context, R.color.liquid_text_tertiary))
                    ImageViewCompat.setImageTintList(
                        binding.ivGroupIcon, 
                        ColorStateList.valueOf(ContextCompat.getColor(context, R.color.liquid_text_primary))
                    )
                }

                // Click handler
                binding.groupContainer.setOnClickListener {
                    onGroupClick(category)
                }

                // Focus handler with animations
                binding.groupContainer.setOnFocusChangeListener { _, hasFocus ->
                    if (hasFocus) {
                        onGroupFocused(category)
                    }
                    animateFocus(hasFocus, isSelected)
                }
            } catch (e: Exception) {
                Log.e("GroupViewHolder", "Error binding group at position $bindingAdapterPosition", e)
            }
        }

        private fun animateFocus(hasFocus: Boolean, isSelected: Boolean) {
            // Check if view is still attached before animating
            if (bindingAdapterPosition == RecyclerView.NO_POSITION) {
                return // View is being recycled, skip animation
            }
            
            try {
                val glowAlpha = if (hasFocus) 0.8f else 0f
                val borderAlpha = if (hasFocus && !isSelected) 1f else 0f

                LiquidFocusDelegate.animateCardFocus(
                    target = binding.groupContainer,
                    hasFocus = hasFocus,
                    focusGlow = null,
                    focusRing = null,
                    focusedElevation = 10f,
                    restingElevation = 2f,
                    translationYFocused = 0f
                )

                // Glow animation
                binding.focusGlow.animate()
                    .alpha(glowAlpha)
                    .setDuration(180)
                    .start()

                // Border animation (only show when focused but not selected)
                binding.focusBorder.animate()
                    .alpha(borderAlpha)
                    .setDuration(180)
                    .start()

            } catch (e: Exception) {
                Log.e("GroupViewHolder", "Error animating focus at position $bindingAdapterPosition", e)
            }
        }

        private fun getCategoryIcon(categoryName: String): Int {
            val nameLower = categoryName.lowercase()
            return when {
                nameLower == "all" || nameLower.contains("الكل") -> R.drawable.ic_live_tv
                nameLower.contains("sport") || nameLower.contains("رياض") -> R.drawable.ic_sports
                nameLower.contains("movie") || nameLower.contains("أفلام") || nameLower.contains("افلام") -> R.drawable.ic_movie
                nameLower.contains("news") || nameLower.contains("أخبار") || nameLower.contains("اخبار") -> R.drawable.ic_news
                nameLower.contains("kids") || nameLower.contains("أطفال") || nameLower.contains("اطفال") -> R.drawable.ic_kids
                nameLower.contains("music") || nameLower.contains("موسيق") -> R.drawable.ic_music
                nameLower.contains("document") || nameLower.contains("وثائق") -> R.drawable.ic_documentary
                nameLower.contains("entertain") || nameLower.contains("ترفيه") -> R.drawable.ic_entertainment
                nameLower.contains("arab") || nameLower.contains("عرب") -> R.drawable.ic_arabic
                nameLower.contains("usa") || nameLower.contains("أمريك") || nameLower.contains("امريك") -> R.drawable.ic_usa
                nameLower.contains("uk") || nameLower.contains("بريطان") -> R.drawable.ic_uk
                nameLower.contains("fr") || nameLower.contains("فرنس") -> R.drawable.ic_france
                else -> R.drawable.ic_live_tv
            }
        }
    }

    class GroupDiffCallback : DiffUtil.ItemCallback<GroupItem>() {
        override fun areItemsTheSame(oldItem: GroupItem, newItem: GroupItem): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: GroupItem, newItem: GroupItem): Boolean {
            return oldItem == newItem
        }
    }
}
