package com.mo.moplayer.ui.favorites

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.FavoriteEntity
import com.mo.moplayer.databinding.ItemContentCardBinding
import com.mo.moplayer.ui.common.design.TvCinematicTokens
import com.mo.moplayer.util.FocusStyleHelper

class FavoritesAdapter(
    private val onItemClick: (FavoriteEntity) -> Unit,
    private val onItemLongClick: (FavoriteEntity) -> Unit,
    private val themeManager: com.mo.moplayer.util.ThemeManager
) : ListAdapter<FavoriteEntity, FavoritesAdapter.FavoriteViewHolder>(FavoriteDiffCallback()) {

    private var recyclerView: RecyclerView? = null

    override fun onAttachedToRecyclerView(recyclerView: RecyclerView) {
        super.onAttachedToRecyclerView(recyclerView)
        this.recyclerView = recyclerView
    }

    override fun onDetachedFromRecyclerView(recyclerView: RecyclerView) {
        super.onDetachedFromRecyclerView(recyclerView)
        this.recyclerView = null
    }

    /**
     * Update theme colors for focused items when theme changes
     */
    fun updateThemeColor(color: Int) {
        recyclerView?.let { rv ->
            for (i in 0 until rv.childCount) {
                val child = rv.getChildAt(i)
                val viewHolder = rv.getChildViewHolder(child)
                if (viewHolder is FavoriteViewHolder && child.hasFocus()) {
                    viewHolder.updateFocusColors(color)
                }
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FavoriteViewHolder {
        val binding = ItemContentCardBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return FavoriteViewHolder(binding)
    }

    override fun onBindViewHolder(holder: FavoriteViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class FavoriteViewHolder(
        private val binding: ItemContentCardBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(favorite: FavoriteEntity) {
            binding.tvTitle.text = favorite.name
            binding.ratingBadge.visibility = View.GONE

            if (!favorite.iconUrl.isNullOrEmpty()) {
                Glide.with(binding.root.context)
                    .load(favorite.iconUrl)
                    .placeholder(R.drawable.ic_content_placeholder)
                    .error(R.drawable.ic_content_placeholder)
                    .centerCrop()
                    .into(binding.ivPoster)
            } else {
                binding.ivPoster.setImageResource(R.drawable.ic_content_placeholder)
            }

            binding.root.setOnClickListener {
                onItemClick(favorite)
            }

            binding.root.setOnLongClickListener {
                onItemLongClick(favorite)
                true
            }

            binding.root.setOnFocusChangeListener { _, hasFocus ->
                animateFocus(hasFocus)
            }
        }

        private fun animateFocus(hasFocus: Boolean) {
            val scale = if (hasFocus) TvCinematicTokens.FOCUS_SCALE else 1.0f
            val elevation = if (hasFocus) TvCinematicTokens.CARD_ELEVATION_FOCUSED else TvCinematicTokens.CARD_ELEVATION_REST
            val glowAlpha = if (hasFocus) 1f else 0f
            val borderAlpha = if (hasFocus) 1f else 0f
            val duration = TvCinematicTokens.FOCUS_IN_DURATION_MS

            // Apply dynamic colors from ThemeManager
            if (hasFocus) {
                val accentColor = themeManager.currentAccentColor.value
                binding.focusBorder?.background = FocusStyleHelper.createFocusBorder(accentColor)
                binding.focusGlow?.background = FocusStyleHelper.createFocusGlow(accentColor)
            }

            binding.contentLayout.animate()
                .scaleX(scale)
                .scaleY(scale)
                .setDuration(duration)
                .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                .start()

            // Elevation
            binding.posterCard?.elevation = elevation

            // Focus glow animation
            binding.focusGlow?.animate()
                ?.alpha(glowAlpha)
                ?.setDuration(duration)
                ?.start()

            // Focus border animation
            binding.focusBorder?.animate()
                ?.alpha(borderAlpha)
                ?.setDuration(duration)
                ?.start()

        }

        /**
         * Update focus colors when theme changes
         */
        fun updateFocusColors(color: Int) {
            if (binding.root.hasFocus()) {
                binding.focusBorder?.background = FocusStyleHelper.createFocusBorder(color)
                binding.focusGlow?.background = FocusStyleHelper.createFocusGlow(color)
            }
        }
    }

    class FavoriteDiffCallback : DiffUtil.ItemCallback<FavoriteEntity>() {
        override fun areItemsTheSame(oldItem: FavoriteEntity, newItem: FavoriteEntity): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: FavoriteEntity, newItem: FavoriteEntity): Boolean {
            return oldItem == newItem
        }
    }
}
