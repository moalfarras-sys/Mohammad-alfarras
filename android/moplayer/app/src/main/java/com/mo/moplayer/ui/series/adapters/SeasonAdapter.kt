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
import com.mo.moplayer.ui.common.design.TvCinematicTokens
import com.mo.moplayer.databinding.ItemSeasonBinding
import com.mo.moplayer.databinding.ItemSeasonTvBinding

class SeasonAdapter(
    private val onSeasonClick: (Int) -> Unit,
    private val getEpisodeCount: ((Int) -> Int)? = null
) : ListAdapter<Int, RecyclerView.ViewHolder>(SeasonDiffCallback()) {

    private var selectedSeason: Int = 1
    private var isTvMode = false

    fun setSelectedSeason(season: Int) {
        val oldSelected = selectedSeason
        selectedSeason = season
        
        // Notify both old and new selection for UI update
        currentList.indexOf(oldSelected).takeIf { it >= 0 }?.let { notifyItemChanged(it) }
        currentList.indexOf(season).takeIf { it >= 0 }?.let { notifyItemChanged(it) }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        // Detect TV mode
        val uiModeManager = parent.context.getSystemService(Context.UI_MODE_SERVICE) as UiModeManager
        isTvMode = uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION

        return if (isTvMode) {
            val binding = ItemSeasonTvBinding.inflate(
                LayoutInflater.from(parent.context), parent, false
            )
            SeasonViewHolderTV(binding)
        } else {
            val binding = ItemSeasonBinding.inflate(
                LayoutInflater.from(parent.context), parent, false
            )
            SeasonViewHolder(binding)
        }
    }

    override fun getItemViewType(position: Int): Int {
        // We need to re-detect mode or store it, but for getItemViewType we don't have parent context.
        // However, isTvMode is initialized in onCreateViewHolder which is called AFTER item type check? 
        // No, getItemViewType is called first. 
        // We need to inject Context or check resource config globally?
        // Actually, SeasonAdapter doesn't seem to take Context in constructor.
        // But for pool separation, we can just return one type if we don't need pool separation by mode?
        // Actually we DO need separation if the Layout is different (TV vs defined binding).
        // Use a safe unified type if we can't detect mode, OR better:
        // SeasonAdapter is likely recreated or valid context is not easily available.
        // But wait, the previous code detected mode in onCreateViewHolder.
        
        // Let's assume we can use a single type for now as Season items are likely small and uniform enough 
        // OR distinct them if we can access context. 
        // But since we don't have context here easily without changing constructor...
        // Let's rely on the fact that the app runs on one device type.
        // Is there a global way to check TV mode?
        // I'll stick to a single VIEW_TYPE_SEASON for now, assuming the pool will just hold whatever holders are created.
        // Wait, if we return VIEW_TYPE_SEASON, and then create TV holder, and then create Phone holder...
        // If the device is TV, it will always create TV holders.
        // If phone, always Phone holders.
        // So they won't mix on the same device run.
        // So a single VIEW_TYPE_SEASON is fine.
        return com.mo.moplayer.util.RecyclerViewOptimizer.VIEW_TYPE_SEASON
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val seasonNum = getItem(position)
        when (holder) {
            is SeasonViewHolderTV -> holder.bind(seasonNum)
            is SeasonViewHolder -> holder.bind(seasonNum)
        }
    }

    // TV ViewHolder with enhanced design
    inner class SeasonViewHolderTV(
        private val binding: ItemSeasonTvBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(seasonNum: Int) {
            val isSelected = seasonNum == selectedSeason

            binding.tvSeasonNumber.text = seasonNum.toString()
            binding.tvSeasonLabel.text = "Season $seasonNum"
            
            // Show episode count if available
            getEpisodeCount?.let { getCount ->
                val count = getCount(seasonNum)
                binding.tvEpisodeCount.text = "$count eps"
                binding.tvEpisodeCount.visibility = View.VISIBLE
            } ?: run {
                binding.tvEpisodeCount.visibility = View.GONE
            }
            
            // Show/hide selection indicator
            binding.selectionIndicator.visibility = if (isSelected) View.VISIBLE else View.GONE
            binding.seasonContainer.isSelected = isSelected

            binding.root.setOnClickListener {
                onSeasonClick(seasonNum)
            }

            binding.root.setOnFocusChangeListener { v, hasFocus ->
                animateFocusTV(v, hasFocus)
            }
        }

        private fun animateFocusTV(view: View, hasFocus: Boolean) {
            val scale = if (hasFocus) TvCinematicTokens.FOCUS_SCALE else 1.0f
            val elevation = if (hasFocus) TvCinematicTokens.CARD_ELEVATION_FOCUSED else 0f
            
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
    inner class SeasonViewHolder(
        private val binding: ItemSeasonBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(seasonNum: Int) {
            val isSelected = seasonNum == selectedSeason

            binding.tvSeasonNumber.text = seasonNum.toString()
            binding.tvSeasonLabel.text = "Season $seasonNum"
            
            // Show/hide selection indicator
            binding.selectionIndicator.visibility = if (isSelected) View.VISIBLE else View.GONE
            binding.seasonContainer.isSelected = isSelected

            binding.root.setOnClickListener {
                onSeasonClick(seasonNum)
            }

            binding.root.setOnFocusChangeListener { v, hasFocus ->
                animateFocus(v, hasFocus)
            }
        }

        private fun animateFocus(view: View, hasFocus: Boolean) {
            val scale = if (hasFocus) TvCinematicTokens.FOCUS_SCALE else 1.0f
            view.animate()
                .scaleX(scale)
                .scaleY(scale)
                .setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
                .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                .start()
        }
    }

    class SeasonDiffCallback : DiffUtil.ItemCallback<Int>() {
        override fun areItemsTheSame(oldItem: Int, newItem: Int): Boolean {
            return oldItem == newItem
        }

        override fun areContentsTheSame(oldItem: Int, newItem: Int): Boolean {
            return oldItem == newItem
        }
    }
}
