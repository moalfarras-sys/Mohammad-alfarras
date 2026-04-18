package com.mo.moplayer.ui.series.adapters

import android.app.UiModeManager
import android.content.Context
import android.content.res.Configuration
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.mo.moplayer.R
import com.mo.moplayer.databinding.ItemEpisodeBinding
import com.mo.moplayer.databinding.ItemEpisodeTvBinding
import com.mo.moplayer.ui.common.design.TvCinematicTokens
import com.mo.moplayer.ui.series.SeriesDetailViewModel

class EpisodeAdapter(
    private val onEpisodeClick: (SeriesDetailViewModel.Episode) -> Unit,
    private val onEpisodeFocused: (SeriesDetailViewModel.Episode) -> Unit,
    private val getEpisodeProgress: ((String) -> Int)? = null
) : ListAdapter<SeriesDetailViewModel.Episode, RecyclerView.ViewHolder>(EpisodeDiffCallback()) {

    companion object {
    }

    private var isTvMode = false

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        // Detect TV mode
        val uiModeManager = parent.context.getSystemService(Context.UI_MODE_SERVICE) as UiModeManager
        isTvMode = uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION

        return if (isTvMode) {
            val binding = ItemEpisodeTvBinding.inflate(
                LayoutInflater.from(parent.context), parent, false
            )
            EpisodeViewHolderTV(binding)
        } else {
            val binding = ItemEpisodeBinding.inflate(
                LayoutInflater.from(parent.context), parent, false
            )
            EpisodeViewHolder(binding)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val episode = getItem(position)
        when (holder) {
            is EpisodeViewHolderTV -> holder.bind(episode)
            is EpisodeViewHolder -> holder.bind(episode)
        }
    }

    override fun getItemViewType(position: Int): Int {
        return if (isTvMode) com.mo.moplayer.util.RecyclerViewOptimizer.VIEW_TYPE_EPISODE_TV 
        else com.mo.moplayer.util.RecyclerViewOptimizer.VIEW_TYPE_EPISODE
    }

    // TV ViewHolder with enhanced design
    inner class EpisodeViewHolderTV(
        private val binding: ItemEpisodeTvBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(episode: SeriesDetailViewModel.Episode) {
            binding.tvEpisodeNumber.text = "E${episode.episodeNumber}"
            binding.tvEpisodeTitle.text = episode.title
            binding.tvDuration.text = episode.duration ?: ""

            // Show plot if available
            if (!episode.plot.isNullOrEmpty()) {
                binding.tvEpisodePlot.text = episode.plot
                binding.tvEpisodePlot.visibility = View.VISIBLE
            } else {
                binding.tvEpisodePlot.visibility = View.GONE
            }

            // Load thumbnail
            if (!episode.thumbnail.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.root.context)) {
                Glide.with(binding.root.context)
                    .load(episode.thumbnail)
                    .placeholder(R.drawable.ic_content_placeholder)
                    .error(R.drawable.ic_content_placeholder)
                    .centerCrop()
                    .into(binding.ivThumbnail)
            } else {
                binding.ivThumbnail.setImageResource(R.drawable.ic_content_placeholder)
            }

            // Show progress if available
            getEpisodeProgress?.let { getProgress ->
                val progress = getProgress(episode.id)
                if (progress > 0) {
                    binding.progressOverlay.visibility = View.VISIBLE
                    binding.progressBar.progress = progress
                    
                    if (progress >= 95) {
                        binding.ivWatched.visibility = View.VISIBLE
                        binding.tvWatchedLabel.visibility = View.VISIBLE
                    } else {
                        binding.ivWatched.visibility = View.GONE
                        binding.tvWatchedLabel.visibility = View.GONE
                    }
                } else {
                    binding.progressOverlay.visibility = View.GONE
                    binding.ivWatched.visibility = View.GONE
                    binding.tvWatchedLabel.visibility = View.GONE
                }
            }

            binding.episodeCard.setOnClickListener {
                onEpisodeClick(episode)
            }

            binding.episodeCard.setOnFocusChangeListener { v, hasFocus ->
                if (hasFocus) {
                    onEpisodeFocused(episode)
                }
                animateFocusTV(v, hasFocus)
            }
        }

        private fun animateFocusTV(view: View, hasFocus: Boolean) {
            val scale = if (hasFocus) TvCinematicTokens.FOCUS_SCALE else 1.0f
            val elevation = if (hasFocus) TvCinematicTokens.CARD_ELEVATION_FOCUSED else TvCinematicTokens.CARD_ELEVATION_REST

            view.animate()
                .scaleX(scale)
                .scaleY(scale)
                .translationZ(elevation)
                .setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
                .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                .start()

            // Show/hide focus glow
            binding.focusGlow.visibility = if (hasFocus) View.VISIBLE else View.INVISIBLE
        }
    }

    // Normal ViewHolder (for mobile/tablet)
    inner class EpisodeViewHolder(
        private val binding: ItemEpisodeBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(episode: SeriesDetailViewModel.Episode) {
            binding.tvEpisodeNumber.text = "Episode ${episode.episodeNumber}"
            binding.tvEpisodeTitle.text = episode.title
            binding.tvDuration.text = episode.duration ?: ""

            if (!episode.plot.isNullOrEmpty()) {
                binding.tvEpisodePlot.text = episode.plot
                binding.tvEpisodePlot.visibility = View.VISIBLE
            } else {
                binding.tvEpisodePlot.visibility = View.GONE
            }

            // Load thumbnail
            if (!episode.thumbnail.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.root.context)) {
                Glide.with(binding.root.context)
                    .load(episode.thumbnail)
                    .placeholder(R.drawable.ic_content_placeholder)
                    .error(R.drawable.ic_content_placeholder)
                    .centerCrop()
                    .into(binding.ivThumbnail)
            } else {
                binding.ivThumbnail.setImageResource(R.drawable.ic_content_placeholder)
            }

            binding.root.setOnClickListener {
                onEpisodeClick(episode)
            }

            binding.root.setOnFocusChangeListener { v, hasFocus ->
                if (hasFocus) {
                    onEpisodeFocused(episode)
                }
                animateFocus(v, hasFocus)
            }
        }

        private fun animateFocus(view: View, hasFocus: Boolean) {
            val scale = if (hasFocus) TvCinematicTokens.FOCUS_SCALE else 1.0f
            val translationX = if (hasFocus) 8f else 0f
            val elevation = if (hasFocus) TvCinematicTokens.CARD_ELEVATION_FOCUSED else 0f

            view.animate()
                .scaleX(scale)
                .scaleY(scale)
                .translationX(translationX)
                .translationZ(elevation)
                .setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
                .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                .start()
        }
    }

    class EpisodeDiffCallback : DiffUtil.ItemCallback<SeriesDetailViewModel.Episode>() {
        override fun areItemsTheSame(
            oldItem: SeriesDetailViewModel.Episode,
            newItem: SeriesDetailViewModel.Episode
        ): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(
            oldItem: SeriesDetailViewModel.Episode,
            newItem: SeriesDetailViewModel.Episode
        ): Boolean {
            return oldItem == newItem
        }
    }
}
