package com.mo.moplayer.ui.series.adapters

import android.graphics.drawable.Drawable
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.paging.PagingDataAdapter
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.SeriesEntity
import com.mo.moplayer.databinding.ItemContentCardBinding
import com.mo.moplayer.ui.common.RemoteShortcutManager
import com.mo.moplayer.ui.common.design.TvCinematicTokens
import com.mo.moplayer.util.FocusStyleHelper

class SeriesAdapter(
    private val onSeriesClick: (SeriesEntity) -> Unit,
    private val onSeriesFocused: (SeriesEntity) -> Unit,
    private val onSeriesLongClick: (SeriesEntity) -> Unit,
    private val onSeriesLongPress: ((SeriesEntity) -> Unit)? = null,
    private val onFavoriteShortcut: ((SeriesEntity) -> Unit)? = null,
    private val themeManager: com.mo.moplayer.util.ThemeManager
) : PagingDataAdapter<SeriesEntity, SeriesAdapter.SeriesViewHolder>(SeriesDiffCallback()) {

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
                if (viewHolder is SeriesViewHolder && child.hasFocus()) {
                    viewHolder.updateFocusColors(color)
                }
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SeriesViewHolder {
        val binding = ItemContentCardBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return SeriesViewHolder(binding)
    }

    override fun getItemViewType(position: Int): Int {
        return com.mo.moplayer.util.RecyclerViewOptimizer.VIEW_TYPE_SERIES
    }

    override fun onBindViewHolder(holder: SeriesViewHolder, position: Int) {
        val series = getItem(position)
        holder.bind(series, position)
    }

    inner class SeriesViewHolder(
        private val binding: ItemContentCardBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        private var remoteShortcutManager: RemoteShortcutManager? = null

        fun bind(series: SeriesEntity?, position: Int) {
            // Reset all visible state so recycled views never show previous item data
            binding.tvTitle.text = series?.name?.takeIf { it.isNotBlank() } ?: "Unknown title"
            binding.ratingBadge.visibility = View.GONE

            // Clear previous Glide request and image so we never show wrong poster on reuse
            if (com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.ivPoster.context)) {
                Glide.with(binding.ivPoster.context).clear(binding.ivPoster)
            }
            binding.ivPoster.setImageDrawable(null)

            if (series != null) {
                if (series.rating != null && series.rating > 0) {
                    binding.tvRating.text = String.format("%.1f", series.rating)
                    binding.ratingBadge.visibility = View.VISIBLE
                }

                if (!series.cover.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.root.context)) {
                    Glide.with(binding.root.context)
                        .load(series.cover)
                        .diskCacheStrategy(DiskCacheStrategy.ALL)
                        .override(90, 135)
                        .thumbnail(0.1f)
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
                                android.util.Log.d("SeriesThumb", "poster_load_failed id=${series.seriesId}")
                                return false
                            }
                        })
                        .into(binding.ivPoster)
                } else {
                    binding.ivPoster.setImageResource(R.drawable.ic_content_placeholder)
                }
            } else {
                binding.ivPoster.setImageResource(R.drawable.ic_content_placeholder)
            }

            binding.root.setOnClickListener {
                series?.let { onSeriesClick(it) }
            }

            // Keep long click listener for touch events
            binding.root.setOnLongClickListener {
                series?.let { onSeriesLongClick(it) }
                true
            }

            remoteShortcutManager = series?.let { safeSeries ->
                RemoteShortcutManager(
                    onShortOk = { onSeriesClick(safeSeries) },
                    onTripleOk = { onFavoriteShortcut?.invoke(safeSeries) },
                    onLongOk = { onSeriesLongPress?.invoke(safeSeries) }
                )
            }

            // Add key listener for D-Pad with proper long press detection
            binding.root.setOnKeyListener { _, keyCode, event ->
                when (event.action) {
                    KeyEvent.ACTION_DOWN -> {
                        if (keyCode == KeyEvent.KEYCODE_MENU) {
                            series?.let { onSeriesLongPress?.invoke(it) }
                            return@setOnKeyListener true
                        }
                        // Consume DPAD_CENTER/ENTER to prevent automatic click
                        // This allows LongPressDetector to handle short/long press properly
                        if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) {
                            return@setOnKeyListener event?.let { ev ->
                                remoteShortcutManager?.onKeyEvent(keyCode, ev) ?: false
                            } ?: false
                        }
                        false
                    }
                    KeyEvent.ACTION_UP -> {
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

            binding.root.setOnFocusChangeListener { _, hasFocus ->
                if (hasFocus) {
                    series?.let { onSeriesFocused(it) }
                }
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

    class SeriesDiffCallback : DiffUtil.ItemCallback<SeriesEntity>() {
        override fun areItemsTheSame(oldItem: SeriesEntity, newItem: SeriesEntity): Boolean {
            return oldItem.seriesId == newItem.seriesId
        }

        override fun areContentsTheSame(oldItem: SeriesEntity, newItem: SeriesEntity): Boolean {
            return oldItem == newItem
        }
    }
}
