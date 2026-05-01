package com.mo.moplayer.ui.home.adapters

import android.graphics.drawable.Drawable
import android.util.TypedValue
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import com.mo.moplayer.R
import com.mo.moplayer.databinding.ItemContentCardBinding
import com.mo.moplayer.ui.common.RemoteShortcutManager
import com.mo.moplayer.ui.common.focus.LiquidFocusDelegate
import com.mo.moplayer.ui.home.ContentItem
import com.mo.moplayer.util.FocusStyleHelper

class ContentItemAdapter(
    private val onItemClick: (ContentItem) -> Unit,
    private val onItemFocused: (ContentItem) -> Unit,
    private val onItemLongPress: ((ContentItem) -> Unit)? = null,
    private val onFavoriteShortcut: ((ContentItem) -> Unit)? = null,
    private val themeManager: com.mo.moplayer.util.ThemeManager,
    private val tvUiPreferences: com.mo.moplayer.util.TvUiPreferences
) : ListAdapter<ContentItem, ContentItemAdapter.ItemViewHolder>(ItemDiffCallback()) {

    init {
        setHasStableIds(true)
    }

    private var recyclerView: RecyclerView? = null
    private var animationsEnabled: Boolean = true
    private var posterSize: com.mo.moplayer.util.TvUiPreferences.PosterSize =
        com.mo.moplayer.util.TvUiPreferences.PosterSize.SMALL

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
     * Update theme colors for focused items when theme changes
     */
    fun updateThemeColor(color: Int) {
        recyclerView?.let { rv ->
            for (i in 0 until rv.childCount) {
                val child = rv.getChildAt(i)
                val viewHolder = rv.getChildViewHolder(child)
                if (viewHolder is ItemViewHolder && child.hasFocus()) {
                    viewHolder.updateFocusColors(color)
                }
            }
        }
    }

    fun updateUiPreferences(
        newPosterSize: com.mo.moplayer.util.TvUiPreferences.PosterSize,
        newAnimationsEnabled: Boolean
    ) {
        val changed = posterSize != newPosterSize || animationsEnabled != newAnimationsEnabled
        posterSize = newPosterSize
        animationsEnabled = newAnimationsEnabled
        if (changed) {
            notifyDataSetChanged()
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ItemViewHolder {
        val binding = ItemContentCardBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ItemViewHolder(binding)
    }

    override fun getItemViewType(position: Int): Int {
        return com.mo.moplayer.util.RecyclerViewOptimizer.VIEW_TYPE_CONTENT_CARD
    }

    override fun onBindViewHolder(holder: ItemViewHolder, position: Int) {
        holder.bind(getItem(position), position)
    }

    inner class ItemViewHolder(
        private val binding: ItemContentCardBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        private var remoteShortcutManager: RemoteShortcutManager? = null

        fun bind(item: ContentItem, position: Int) {
            applyPosterMetrics()
            // Reset visual state so recycled views never show stuck/half-animated state (poster moves with row)
            binding.root.alpha = 1f
            binding.root.scaleX = 1f
            binding.root.scaleY = 1f
            binding.root.translationX = 0f
            binding.root.translationY = 0f
            binding.contentLayout.scaleX = 1f
            binding.contentLayout.scaleY = 1f

            // Reset all bindings so recycled views never show previous item data
            binding.tvTitle.text = item.title?.takeIf { it.isNotBlank() } ?: "Unknown title"

            // Clear previous Glide request and image so we never show wrong poster on reuse
            if (com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.ivPoster.context)) {
                Glide.with(binding.ivPoster.context).clear(binding.ivPoster)
            }
            binding.ivPoster.setImageDrawable(null)

            if (!item.posterUrl.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.root.context)) {
                Glide.with(binding.root.context)
                    .load(item.posterUrl)
                    .override(336, 504)
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .placeholder(R.drawable.ic_content_placeholder)
                    .error(R.drawable.ic_content_placeholder)
                    .centerCrop()
                    .addListener(object : RequestListener<Drawable> {
                        override fun onResourceReady(
                            resource: Drawable,
                            model: Any,
                            target: Target<Drawable>?,
                            dataSource: DataSource,
                            isFirstResource: Boolean
                        ): Boolean {
                            return bindingAdapterPosition != position
                        }
                        override fun onLoadFailed(
                            e: GlideException?,
                            model: Any?,
                            target: Target<Drawable>,
                            isFirstResource: Boolean
                        ): Boolean {
                            android.util.Log.d("ContentThumb", "poster_load_failed id=${item.id}")
                            return false
                        }
                    })
                    .into(binding.ivPoster)
            } else {
                binding.ivPoster.setImageResource(R.drawable.ic_content_placeholder)
            }

            binding.tvYear.visibility = View.GONE
            binding.tvQuality.visibility = View.GONE

            // Show rating if available (always set from current item)
            if (item.rating != null && item.rating > 0) {
                binding.tvRating.text = String.format("%.1f", item.rating)
                binding.ratingBadge.visibility = View.VISIBLE
            } else {
                binding.ratingBadge.visibility = View.GONE
            }

            val progress = item.progress ?: 0
            if (progress in 1..99) {
                binding.progressWatch.progress = progress
                binding.progressWatch.visibility = View.VISIBLE
            } else {
                binding.progressWatch.visibility = View.GONE
            }

            binding.root.setOnClickListener {
                onItemClick(item)
            }
            
            remoteShortcutManager = RemoteShortcutManager(
                onShortOk = { onItemClick(item) },
                onTripleOk = { onFavoriteShortcut?.invoke(item) },
                onLongOk = { onItemLongPress?.invoke(item) }
            )

            // Add key listener for D-Pad with proper long press detection
            binding.root.setOnKeyListener { _, keyCode, event ->
                when (event.action) {
                    KeyEvent.ACTION_DOWN -> {
                        // MENU should always open context menu if provided
                        if (keyCode == KeyEvent.KEYCODE_MENU) {
                            onItemLongPress?.invoke(item)
                            return@setOnKeyListener true
                        }

                        // Consume DPAD_CENTER/ENTER to prevent automatic click
                        // This allows RemoteShortcutManager to handle short/long/triple OK
                        if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) {
                            return@setOnKeyListener event?.let { ev ->
                                remoteShortcutManager?.onKeyEvent(keyCode, ev) ?: false
                            } ?: false
                        }
                        false
                    }
                    KeyEvent.ACTION_UP -> {
                        // Consume OK/ENTER if handled to avoid double-trigger (click + key)
                        if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) {
                            return@setOnKeyListener event?.let { ev ->
                                remoteShortcutManager?.onKeyEvent(keyCode, ev) ?: false
                            } ?: false
                        }
                        false
                    }
                    else -> false
                }
            }
            
            // Simple focus listener
            binding.root.setOnFocusChangeListener { _, hasFocus ->
                if (hasFocus) {
                    onItemFocused(item)
                }
                animateFocus(hasFocus)
            }
        }

        private fun animateFocus(hasFocus: Boolean) {
            if (hasFocus) {
                val accentColor = themeManager.currentAccentColor.value
                binding.focusBorder?.background = FocusStyleHelper.createFocusBorder(accentColor)
                binding.focusGlow?.background = FocusStyleHelper.createFocusGlow(accentColor)
            }

            if (animationsEnabled) {
                LiquidFocusDelegate.animateCardFocus(
                    target = binding.contentLayout,
                    hasFocus = hasFocus,
                    focusGlow = binding.focusGlow,
                    focusRing = binding.focusBorder,
                    focusedElevation = com.mo.moplayer.ui.common.design.LiquidGlassTokens.FOCUS_ELEVATION_FOCUSED,
                    restingElevation = com.mo.moplayer.ui.common.design.LiquidGlassTokens.FOCUS_ELEVATION_REST,
                    translationYFocused = com.mo.moplayer.ui.common.design.LiquidGlassTokens.TRANSLATION_Y_FOCUSED
                )
            } else {
                binding.contentLayout.animate().cancel()
                binding.contentLayout.scaleX = if (hasFocus) 1.02f else 1f
                binding.contentLayout.scaleY = if (hasFocus) 1.02f else 1f
                binding.contentLayout.translationY = 0f
                binding.focusGlow?.alpha = if (hasFocus) 1f else 0f
                binding.focusBorder?.alpha = if (hasFocus) 1f else 0f
            }
            binding.posterCard?.elevation =
                if (hasFocus) com.mo.moplayer.ui.common.design.LiquidGlassTokens.FOCUS_ELEVATION_FOCUSED
                else com.mo.moplayer.ui.common.design.LiquidGlassTokens.FOCUS_ELEVATION_REST
        }

        private fun applyPosterMetrics() {
            val metrics = tvUiPreferences.posterMetrics(posterSize)
            val density = binding.root.resources.displayMetrics.density
            binding.root.layoutParams = binding.root.layoutParams.apply {
                width = (metrics.widthDp * density).toInt()
                height = (metrics.contentHeightDp * density).toInt()
            }
            binding.posterCard?.layoutParams = binding.posterCard?.layoutParams?.apply {
                height = (metrics.heightDp * density).toInt()
            }
            binding.tvTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, metrics.titleTextSp)
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

    class ItemDiffCallback : DiffUtil.ItemCallback<ContentItem>() {
        override fun areItemsTheSame(oldItem: ContentItem, newItem: ContentItem): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: ContentItem, newItem: ContentItem): Boolean {
            return oldItem == newItem
        }
    }
}
