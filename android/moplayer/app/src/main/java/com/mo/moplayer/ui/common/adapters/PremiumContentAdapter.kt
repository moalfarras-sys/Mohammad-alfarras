package com.mo.moplayer.ui.common.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.AnimationUtils
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions
import com.mo.moplayer.R
import com.mo.moplayer.databinding.ItemContentCardPremiumBinding
import com.mo.moplayer.ui.common.design.TvCinematicTokens

/**
 * Premium Content Card Adapter for Movies/Series
 * Features: Focus animations, loading skeletons, badges, watch progress
 */
class PremiumContentAdapter(
    private val onItemClick: (ContentItem) -> Unit,
    private val onItemFocus: ((ContentItem) -> Unit)? = null
) : ListAdapter<ContentItem, PremiumContentAdapter.ContentViewHolder>(ContentDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ContentViewHolder {
        val binding = ItemContentCardPremiumBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ContentViewHolder(binding, onItemClick, onItemFocus)
    }

    override fun onBindViewHolder(holder: ContentViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ContentViewHolder(
        private val binding: ItemContentCardPremiumBinding,
        private val onItemClick: (ContentItem) -> Unit,
        private val onItemFocus: ((ContentItem) -> Unit)?
    ) : RecyclerView.ViewHolder(binding.root) {

        init {
            setupFocusAnimation()
            setupClickListener()
        }

        fun bind(item: ContentItem) {
            binding.apply {
                // Set title
                tvTitle.text = item.title

                // Load poster with Glide
                loadPoster(item.posterUrl)

                // Show/hide badges
                updateBadges(item)

                // Update watch progress
                updateWatchProgress(item.watchProgress)

                // Store item for click handling
                root.tag = item
            }
        }

        private fun loadPoster(url: String?) {
            binding.apply {
                if (url.isNullOrEmpty()) {
                    // Show skeleton, hide image
                    loadingSkeleton.visibility = View.VISIBLE
                    ivPoster.setImageResource(R.drawable.ic_content_placeholder)
                } else {
                    // Load with Glide
                    if (com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.root.context)) {
                        Glide.with(binding.root.context)
                            .load(url)
                            .diskCacheStrategy(DiskCacheStrategy.ALL)
                            .placeholder(R.drawable.bg_loading_skeleton)
                            .error(R.drawable.ic_content_placeholder)
                            .transition(DrawableTransitionOptions.withCrossFade(200))
                            .thumbnail(0.1f) // Low-res preview
                            .into(ivPoster)
                            .also {
                                // Hide skeleton when loaded
                                loadingSkeleton.visibility = View.GONE
                            }
                    } else {
                        // Fallback if context invalid (though unlikely to reach here if view attached)
                        loadingSkeleton.visibility = View.GONE
                    }
                }
            }
        }

        private fun updateBadges(item: ContentItem) {
            binding.apply {
                // NEW badge
                tvBadgeNew.visibility = if (item.isNew) View.VISIBLE else View.GONE

                // Quality badge (HD/4K)
                when {
                    item.is4K -> {
                        tvBadgeQuality.text = root.context.getString(R.string.badge_4k)
                        tvBadgeQuality.visibility = View.VISIBLE
                    }
                    item.isHD -> {
                        tvBadgeQuality.text = root.context.getString(R.string.badge_hd)
                        tvBadgeQuality.visibility = View.VISIBLE
                    }
                    else -> {
                        tvBadgeQuality.visibility = View.GONE
                    }
                }
            }
        }

        private fun updateWatchProgress(progress: Int) {
            binding.progressWatch.apply {
                if (progress > 0 && progress < 100) {
                    setProgress(progress, true)
                    visibility = View.VISIBLE
                } else {
                    visibility = View.GONE
                }
            }
        }

        private fun setupFocusAnimation() {
            binding.cardRoot.onFocusChangeListener = View.OnFocusChangeListener { view, hasFocus ->
                val item = view.tag as? ContentItem ?: return@OnFocusChangeListener

                if (hasFocus) {
                    // Scale up with smooth animation
                    view.animate()
                        .scaleX(TvCinematicTokens.FOCUS_SCALE)
                        .scaleY(TvCinematicTokens.FOCUS_SCALE)
                        .translationZ(TvCinematicTokens.CARD_ELEVATION_FOCUSED)
                        .setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
                        .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                        .withStartAction {
                            // Notify focus listener
                            onItemFocus?.invoke(item)
                        }
                        .start()
                } else {
                    // Scale back to normal
                    view.animate()
                        .scaleX(1f)
                        .scaleY(1f)
                        .translationZ(0f)
                        .setDuration(TvCinematicTokens.FOCUS_OUT_DURATION_MS)
                        .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                        .start()
                }
            }
        }

        private fun setupClickListener() {
            binding.cardRoot.setOnClickListener { view ->
                val item = view.tag as? ContentItem ?: return@setOnClickListener

                // Button press animation
                view.animate()
                    .scaleX(0.95f)
                    .scaleY(0.95f)
                    .setDuration(90)
                    .withEndAction {
                        view.animate()
                            .scaleX(TvCinematicTokens.FOCUS_SCALE)
                            .scaleY(TvCinematicTokens.FOCUS_SCALE)
                            .setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
                            .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                            .start()

                        // Trigger click callback
                        onItemClick(item)
                    }
                    .start()
            }
        }
    }

    /**
     * DiffUtil callback for efficient list updates
     */
    class ContentDiffCallback : DiffUtil.ItemCallback<ContentItem>() {
        override fun areItemsTheSame(oldItem: ContentItem, newItem: ContentItem): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: ContentItem, newItem: ContentItem): Boolean {
            return oldItem == newItem
        }
    }
}

/**
 * Data class for content items (movies, series, channels)
 */
data class ContentItem(
    val id: String,
    val title: String,
    val posterUrl: String?,
    val isNew: Boolean = false,
    val isHD: Boolean = false,
    val is4K: Boolean = false,
    val watchProgress: Int = 0, // 0-100
    val contentType: ContentType = ContentType.MOVIE,
    val metadata: Map<String, Any> = emptyMap() // Additional data (rating, year, etc.)
)

enum class ContentType {
    MOVIE,
    SERIES,
    CHANNEL,
    EPISODE
}
