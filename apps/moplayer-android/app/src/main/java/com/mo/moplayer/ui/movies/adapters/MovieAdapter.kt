package com.mo.moplayer.ui.movies.adapters

import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import androidx.paging.PagingDataAdapter
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.MovieEntity
import com.mo.moplayer.databinding.ItemContentCardBinding
import com.mo.moplayer.ui.common.PosterImageBinder
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
    private var rowsMode = false

    fun setLayoutStyle(style: com.mo.moplayer.util.TvUiPreferences.LayoutStyle) {
        val rows = style == com.mo.moplayer.util.TvUiPreferences.LayoutStyle.ROWS
        if (rowsMode == rows) return
        rowsMode = rows
        // Explicit layout changes require different holders; metadata refreshes still use DiffUtil.
        notifyDataSetChanged()
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
                if (viewHolder is MovieViewHolder && child.hasFocus()) {
                    viewHolder.updateFocusColors(color)
                }
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MovieViewHolder {
        val wide = viewType == com.mo.moplayer.util.RecyclerViewOptimizer.VIEW_TYPE_MOVIE_WIDE
        val binding = com.mo.moplayer.ui.common.PosterCardLayouts.inflate(parent, wide)
        return MovieViewHolder(binding, wide)
    }

    override fun getItemViewType(position: Int): Int {
        return if (rowsMode) com.mo.moplayer.util.RecyclerViewOptimizer.VIEW_TYPE_MOVIE_WIDE
            else com.mo.moplayer.util.RecyclerViewOptimizer.VIEW_TYPE_MOVIE
    }

    override fun onBindViewHolder(holder: MovieViewHolder, position: Int) {
        val movie = getItem(position)
        holder.bind(movie, position)
    }

    override fun onViewRecycled(holder: MovieViewHolder) {
        holder.recycle()
        super.onViewRecycled(holder)
    }

    inner class MovieViewHolder(
        private val binding: ItemContentCardBinding,
        private val wide: Boolean = false
    ) : RecyclerView.ViewHolder(binding.root) {

        private var remoteShortcutManager: RemoteShortcutManager? = null
        private val poster = PosterImageBinder(binding.ivPoster)

        fun bind(movie: MovieEntity?, @Suppress("UNUSED_PARAMETER") position: Int) {
            // Reset all visible state so recycled views never show previous item data
            binding.tvTitle.text = movie?.name?.takeIf { it.isNotBlank() } ?: binding.root.context.getString(R.string.unknown_title)
            binding.ratingBadge.visibility = View.GONE

            poster.bind(movie?.movieId, movie?.streamIcon)
            if (movie?.rating != null && movie.rating > 0) {
                binding.tvRating.text = String.format("%.1f", movie.rating)
                binding.ratingBadge.visibility = View.VISIBLE
            }

            binding.root.setOnClickListener {
                movie?.let { onMovieClick(it) }
            }

            // Keep long click listener for touch events
            binding.root.setOnLongClickListener {
                movie?.let { onMovieLongClick(it) }
                true
            }

            remoteShortcutManager?.reset()
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

        fun recycle() {
            remoteShortcutManager?.reset()
            remoteShortcutManager = null
            poster.clear()
        }

        private fun animateFocus(hasFocus: Boolean) {
            val scale = if (hasFocus && !wide) TvCinematicTokens.FOCUS_SCALE else 1.0f
            val elevation = if (hasFocus) TvCinematicTokens.CARD_ELEVATION_FOCUSED else TvCinematicTokens.CARD_ELEVATION_REST
            val glowAlpha = if (hasFocus && !wide) 1f else 0f
            val borderAlpha = if (hasFocus) 1f else 0f
            val duration = TvCinematicTokens.FOCUS_IN_DURATION_MS

            // Apply dynamic colors from ThemeManager
            if (hasFocus) {
                val accentColor = themeManager.currentAccentColor.value
                binding.focusBorder?.background = FocusStyleHelper.createFocusBorder(accentColor, binding.root.resources.displayMetrics.density)
                binding.focusGlow?.background = FocusStyleHelper.createFocusGlow(accentColor, binding.root.resources.displayMetrics.density)
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
                binding.focusBorder?.background = FocusStyleHelper.createFocusBorder(color, binding.root.resources.displayMetrics.density)
                binding.focusGlow?.background = FocusStyleHelper.createFocusGlow(color, binding.root.resources.displayMetrics.density)
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
