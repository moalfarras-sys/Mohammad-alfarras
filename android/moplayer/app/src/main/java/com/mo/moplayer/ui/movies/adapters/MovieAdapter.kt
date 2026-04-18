package com.mo.moplayer.ui.movies.adapters

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
import com.mo.moplayer.data.local.entity.MovieEntity
import com.mo.moplayer.databinding.ItemContentCardBinding
import com.mo.moplayer.ui.common.RemoteShortcutManager
import com.mo.moplayer.ui.common.design.TvCinematicTokens
import com.mo.moplayer.util.FocusStyleHelper

class MovieAdapter(
    private val onMovieClick: (MovieEntity) -> Unit,
    private val onMovieFocused: (MovieEntity) -> Unit,
    private val onMovieLongClick: (MovieEntity) -> Unit,
    private val onMovieLongPress: ((MovieEntity) -> Unit)? = null,
    private val onFavoriteShortcut: ((MovieEntity) -> Unit)? = null,
    private val themeManager: com.mo.moplayer.util.ThemeManager
) : PagingDataAdapter<MovieEntity, MovieAdapter.MovieViewHolder>(MovieDiffCallback()) {

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
                if (viewHolder is MovieViewHolder && child.hasFocus()) {
                    viewHolder.updateFocusColors(color)
                }
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MovieViewHolder {
        val binding = ItemContentCardBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return MovieViewHolder(binding)
    }

    override fun getItemViewType(position: Int): Int {
        return com.mo.moplayer.util.RecyclerViewOptimizer.VIEW_TYPE_MOVIE
    }

    override fun onBindViewHolder(holder: MovieViewHolder, position: Int) {
        val movie = getItem(position)
        holder.bind(movie, position)
    }

    inner class MovieViewHolder(
        private val binding: ItemContentCardBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        private var remoteShortcutManager: RemoteShortcutManager? = null

        fun bind(movie: MovieEntity?, position: Int) {
            // Reset all visible state so recycled views never show previous item data
            binding.tvTitle.text = movie?.name?.takeIf { it.isNotBlank() } ?: "Unknown title"
            binding.ratingBadge.visibility = View.GONE

            // Clear previous Glide request and image so we never show wrong poster on reuse
            if (com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.ivPoster.context)) {
                Glide.with(binding.ivPoster.context).clear(binding.ivPoster)
            }
            binding.ivPoster.setImageDrawable(null)

            if (movie != null) {
                // Show rating if available
                if (movie.rating != null && movie.rating > 0) {
                    binding.tvRating.text = String.format("%.1f", movie.rating)
                    binding.ratingBadge.visibility = View.VISIBLE
                }

                // Load poster; only apply result if this ViewHolder is still bound to the same position
                if (!movie.streamIcon.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.root.context)) {
                    Glide.with(binding.root.context)
                        .load(movie.streamIcon)
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
                                android.util.Log.d("MovieThumb", "poster_load_failed id=${movie.movieId}")
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
                movie?.let { onMovieClick(it) }
            }

            // Keep long click listener for touch events
            binding.root.setOnLongClickListener {
                movie?.let { onMovieLongClick(it) }
                true
            }

            remoteShortcutManager = movie?.let { safeMovie ->
                RemoteShortcutManager(
                    onShortOk = { onMovieClick(safeMovie) },
                    onTripleOk = { onFavoriteShortcut?.invoke(safeMovie) },
                    onLongOk = { onMovieLongPress?.invoke(safeMovie) }
                )
            }

            // Add key listener for D-Pad with proper long press detection
            binding.root.setOnKeyListener { _, keyCode, event ->
                when (event.action) {
                    KeyEvent.ACTION_DOWN -> {
                        if (keyCode == KeyEvent.KEYCODE_MENU) {
                            movie?.let { onMovieLongPress?.invoke(it) }
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
                    movie?.let { onMovieFocused(it) }
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

    class MovieDiffCallback : DiffUtil.ItemCallback<MovieEntity>() {
        override fun areItemsTheSame(oldItem: MovieEntity, newItem: MovieEntity): Boolean {
            return oldItem.movieId == newItem.movieId
        }

        override fun areContentsTheSame(oldItem: MovieEntity, newItem: MovieEntity): Boolean {
            return oldItem == newItem
        }
    }
}
