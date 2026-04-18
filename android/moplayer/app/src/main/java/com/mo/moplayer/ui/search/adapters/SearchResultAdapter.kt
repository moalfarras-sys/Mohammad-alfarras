package com.mo.moplayer.ui.search.adapters

import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.mo.moplayer.R
import com.mo.moplayer.databinding.ItemSearchResultBinding
import com.mo.moplayer.ui.common.RemoteShortcutManager
import com.mo.moplayer.ui.common.design.TvCinematicTokens
import com.mo.moplayer.ui.search.SearchViewModel.SearchResult
import com.mo.moplayer.util.FocusStyleHelper

class SearchResultAdapter(
    private val onItemClick: (SearchResult) -> Unit,
    private val onItemFocused: (SearchResult) -> Unit,
    private val onItemLongPress: ((SearchResult) -> Unit)? = null,
    private val onFavoriteShortcut: ((SearchResult) -> Unit)? = null,
    private val themeManager: com.mo.moplayer.util.ThemeManager
) : ListAdapter<SearchResult, SearchResultAdapter.SearchResultViewHolder>(SearchResultDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SearchResultViewHolder {
        val binding = ItemSearchResultBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return SearchResultViewHolder(binding)
    }

    override fun onBindViewHolder(holder: SearchResultViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class SearchResultViewHolder(
        private val binding: ItemSearchResultBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        private var remoteShortcutManager: RemoteShortcutManager? = null

        fun bind(result: SearchResult) {
            when (result) {
                is SearchResult.Channel -> bindChannel(result)
                is SearchResult.Movie -> bindMovie(result)
                is SearchResult.Series -> bindSeries(result)
            }

            binding.root.setOnClickListener { onItemClick(result) }

            remoteShortcutManager = RemoteShortcutManager(
                onShortOk = { onItemClick(result) },
                onTripleOk = { onFavoriteShortcut?.invoke(result) },
                onLongOk = { onItemLongPress?.invoke(result) }
            )

            // Add key listener for D-Pad with proper long press detection
            binding.root.setOnKeyListener { _, keyCode, event ->
                when (event.action) {
                    KeyEvent.ACTION_DOWN -> {
                        if (keyCode == KeyEvent.KEYCODE_MENU) {
                            onItemLongPress?.invoke(result)
                            return@setOnKeyListener true
                        }
                        // Consume DPAD_CENTER/ENTER to prevent automatic click
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

            binding.root.setOnFocusChangeListener { v, hasFocus ->
                if (hasFocus) onItemFocused(result)
                animateFocus(v, hasFocus)
            }
        }

        private fun bindChannel(result: SearchResult.Channel) {
            val channel = result.channel
            binding.tvTitle.text = channel.name
            binding.tvType.text = "LIVE"
            binding.tvType.setBackgroundResource(R.drawable.bg_type_badge_live)
            binding.ratingBadge.visibility = View.GONE

            loadImage(channel.streamIcon)
        }

        private fun bindMovie(result: SearchResult.Movie) {
            val movie = result.movie
            binding.tvTitle.text = movie.name
            binding.tvType.text = "MOVIE"
            binding.tvType.setBackgroundResource(R.drawable.bg_type_badge)

            if (movie.rating != null && movie.rating > 0) {
                binding.tvRating.text = String.format("%.1f", movie.rating)
                binding.ratingBadge.visibility = View.VISIBLE
            } else {
                binding.ratingBadge.visibility = View.GONE
            }

            loadImage(movie.streamIcon)
        }

        private fun bindSeries(result: SearchResult.Series) {
            val series = result.series
            binding.tvTitle.text = series.name
            binding.tvType.text = "SERIES"
            binding.tvType.setBackgroundResource(R.drawable.bg_type_badge_series)

            if (series.rating != null && series.rating > 0) {
                binding.tvRating.text = String.format("%.1f", series.rating)
                binding.ratingBadge.visibility = View.VISIBLE
            } else {
                binding.ratingBadge.visibility = View.GONE
            }

            loadImage(series.cover)
        }

        private fun loadImage(url: String?) {
            if (!url.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.root.context)) {
                Glide.with(binding.root.context)
                    .load(url)
                    .placeholder(R.drawable.ic_content_placeholder)
                    .error(R.drawable.ic_content_placeholder)
                    .centerCrop()
                    .into(binding.ivPoster)
            } else {
                binding.ivPoster.setImageResource(R.drawable.ic_content_placeholder)
            }
        }

        private fun animateFocus(view: View, hasFocus: Boolean) {
            val scale = if (hasFocus) TvCinematicTokens.FOCUS_SCALE else 1.0f
            val elevation = if (hasFocus) TvCinematicTokens.CARD_ELEVATION_FOCUSED else TvCinematicTokens.CARD_ELEVATION_REST

            // Note: This layout uses selector_card_focus drawable instead of separate focusBorder/focusGlow views
            // Dynamic colors could be applied here if needed in the future

            view.animate()
                .scaleX(scale)
                .scaleY(scale)
                .setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
                .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                .start()

            view.elevation = elevation
        }
    }

    class SearchResultDiffCallback : DiffUtil.ItemCallback<SearchResult>() {
        override fun areItemsTheSame(oldItem: SearchResult, newItem: SearchResult): Boolean {
            return when {
                oldItem is SearchResult.Channel && newItem is SearchResult.Channel ->
                    oldItem.channel.channelId == newItem.channel.channelId
                oldItem is SearchResult.Movie && newItem is SearchResult.Movie ->
                    oldItem.movie.movieId == newItem.movie.movieId
                oldItem is SearchResult.Series && newItem is SearchResult.Series ->
                    oldItem.series.seriesId == newItem.series.seriesId
                else -> false
            }
        }

        override fun areContentsTheSame(oldItem: SearchResult, newItem: SearchResult): Boolean {
            return oldItem == newItem
        }
    }
}
