package com.mo.moplayer.ui.home.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.mo.moplayer.databinding.ItemContentRowBinding
import com.mo.moplayer.ui.home.ContentItem
import com.mo.moplayer.ui.home.ContentRow

class ContentRowAdapter(
    private val onItemClick: (ContentItem) -> Unit,
    private val onItemFocused: (ContentItem) -> Unit,
    private val onItemLongPress: ((ContentItem) -> Unit)? = null,
    private val onFavoriteShortcut: ((ContentItem) -> Unit)? = null,
    private val themeManager: com.mo.moplayer.util.ThemeManager,
    private val tvUiPreferences: com.mo.moplayer.util.TvUiPreferences,
    private val recyclerViewOptimizer: com.mo.moplayer.util.RecyclerViewOptimizer? = null
) : ListAdapter<ContentRow, ContentRowAdapter.RowViewHolder>(RowDiffCallback()) {

    init {
        setHasStableIds(true)
    }

    private var recyclerView: RecyclerView? = null
    private var posterSize = com.mo.moplayer.util.TvUiPreferences.PosterSize.MEDIUM
    private var animationsEnabled = true

    override fun getItemId(position: Int): Long {
        return getItem(position).id.hashCode().toLong()
    }

    override fun onAttachedToRecyclerView(recyclerView: RecyclerView) {
        super.onAttachedToRecyclerView(recyclerView)
        this.recyclerView = recyclerView
    }

    override fun onDetachedFromRecyclerView(recyclerView: RecyclerView) {
        super.onDetachedFromRecyclerView(recyclerView)
        this.recyclerView = null
    }

    /**
     * Update theme colors for nested adapters when theme changes
     */
    fun updateThemeColor(color: Int) {
        recyclerView?.let { rv ->
            for (i in 0 until rv.childCount) {
                val child = rv.getChildAt(i)
                val viewHolder = rv.getChildViewHolder(child)
                if (viewHolder is RowViewHolder) {
                    viewHolder.itemAdapter.updateThemeColor(color)
                }
            }
        }
    }

    fun updateUiPreferences(
        posterSize: com.mo.moplayer.util.TvUiPreferences.PosterSize,
        animationsEnabled: Boolean
    ) {
        if (this.posterSize == posterSize && this.animationsEnabled == animationsEnabled) return
        this.posterSize = posterSize
        this.animationsEnabled = animationsEnabled
        recyclerView?.let { rv ->
            for (i in 0 until rv.childCount) {
                (rv.getChildViewHolder(rv.getChildAt(i)) as? RowViewHolder)
                    ?.itemAdapter?.updateUiPreferences(posterSize, animationsEnabled)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RowViewHolder {
        val binding = ItemContentRowBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return RowViewHolder(binding)
    }

    override fun onBindViewHolder(holder: RowViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class RowViewHolder(
        private val binding: ItemContentRowBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        val itemAdapter = ContentItemAdapter(
            onItemClick = onItemClick,
            onItemFocused = onItemFocused,
            onItemLongPress = onItemLongPress,
            onFavoriteShortcut = onFavoriteShortcut,
            themeManager = themeManager,
            tvUiPreferences = tvUiPreferences
        )

        init {
            binding.rvRowItems.apply {
                layoutManager = LinearLayoutManager(context, LinearLayoutManager.HORIZONTAL, false)
                adapter = itemAdapter
                setHasFixedSize(true)
                recyclerViewOptimizer?.optimizeHorizontalList(this)
                // Library refreshes update existing cards without fading entire rows.
                itemAnimator = null
                preserveFocusAfterLayout = true
                // Focus stays on cards only - rvRowItems must not steal focus
            }
        }

        fun bind(row: ContentRow) {
            itemAdapter.updateUiPreferences(posterSize, animationsEnabled)
            binding.tvRowTitle.text = row.title
            itemAdapter.submitList(ArrayList(row.items))
        }
    }

    class RowDiffCallback : DiffUtil.ItemCallback<ContentRow>() {
        override fun areItemsTheSame(oldItem: ContentRow, newItem: ContentRow): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: ContentRow, newItem: ContentRow): Boolean {
            return oldItem == newItem
        }
    }
}
