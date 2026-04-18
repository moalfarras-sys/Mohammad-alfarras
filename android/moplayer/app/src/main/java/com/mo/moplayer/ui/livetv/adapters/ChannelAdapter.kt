package com.mo.moplayer.ui.livetv.adapters

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.OvershootInterpolator
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.ChannelEntity
import com.mo.moplayer.databinding.ItemChannelBinding

class ChannelAdapter(
    private val onChannelClick: (ChannelEntity) -> Unit,
    private val onChannelFocused: (ChannelEntity) -> Unit
) : ListAdapter<ChannelEntity, ChannelAdapter.ChannelViewHolder>(ChannelDiffCallback()) {

    private var currentChannelId: String? = null
    private var pendingCurrentChannelId: String? = null
    private var isUpdating = false

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ChannelViewHolder {
        val binding = ItemChannelBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ChannelViewHolder(binding)
    }

    override fun getItemViewType(position: Int): Int {
        return com.mo.moplayer.util.RecyclerViewOptimizer.VIEW_TYPE_CHANNEL
    }

    override fun onBindViewHolder(holder: ChannelViewHolder, position: Int) {
        val channel = getItem(position)
        holder.bind(channel, position)
    }

    /**
     * Submit a new list with an optional current channel ID to set after the list is committed.
     */
    fun submitListWithCurrentChannel(list: List<ChannelEntity>?, channelId: String?) {
        pendingCurrentChannelId = channelId
        isUpdating = true
        submitList(list) {
            isUpdating = false
            pendingCurrentChannelId?.let { id ->
                updateCurrentChannelInternal(id)
            }
            pendingCurrentChannelId = null
        }
    }

    fun setCurrentChannelId(channelId: String?) {
        if (isUpdating) {
            pendingCurrentChannelId = channelId
            return
        }
        updateCurrentChannelInternal(channelId)
    }

    private fun updateCurrentChannelInternal(channelId: String?) {
        if (currentChannelId != channelId) {
            val oldPosition = currentList.indexOfFirst { it.channelId == currentChannelId }
            val newPosition = currentList.indexOfFirst { it.channelId == channelId }
            currentChannelId = channelId
            try {
                if (oldPosition >= 0 && oldPosition < itemCount) notifyItemChanged(oldPosition)
                if (newPosition >= 0 && newPosition < itemCount) notifyItemChanged(newPosition)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    inner class ChannelViewHolder(
        private val binding: ItemChannelBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(channel: ChannelEntity, position: Int) {
            binding.tvChannelNumber.text = (position + 1).toString()
            binding.tvChannelName.text = channel.name

            // Load channel logo
            if (!channel.streamIcon.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.root.context)) {
                Glide.with(binding.root.context)
                    .load(channel.streamIcon)
                    .placeholder(R.drawable.ic_placeholder_channel)
                    .error(R.drawable.ic_placeholder_channel)
                    .centerInside()
                    .into(binding.ivChannelLogo)
            } else {
                binding.ivChannelLogo.setImageResource(R.drawable.ic_placeholder_channel)
            }

            // "Now playing" state
            val isPlaying = channel.channelId == currentChannelId
            
            // Try to access channelContainer if it exists, otherwise use root
            val container = try {
                binding.channelContainer
            } catch (e: Exception) {
                binding.root
            }
            
            container.isSelected = isPlaying
            
            // Show "now playing" indicator
            try {
                binding.nowPlayingIndicator.visibility = if (isPlaying) View.VISIBLE else View.GONE
            } catch (e: Exception) {
                // View might not exist
            }
            
            // Show glow effect for playing channel
            try {
                binding.focusGlow.alpha = if (isPlaying) 0.3f else 0f
            } catch (e: Exception) {
                // View might not exist
            }

            // Click handler
            container.setOnClickListener {
                onChannelClick(channel)
            }

            // Focus handler with premium animation
            container.setOnFocusChangeListener { v, hasFocus ->
                if (hasFocus) {
                    onChannelFocused(channel)
                }
                animateFocus(v, hasFocus)
                
                // Animate glow
                try {
                    binding.focusGlow.animate()
                        .alpha(if (hasFocus) 0.6f else if (isPlaying) 0.3f else 0f)
                        .setDuration(200)
                        .start()
                } catch (e: Exception) {
                    // View might not exist
                }
            }
        }

        private fun animateFocus(view: View, hasFocus: Boolean) {
            val scale = if (hasFocus) 1.03f else 1.0f
            val translationX = if (hasFocus) -6f else 0f
            
            val scaleX = ObjectAnimator.ofFloat(view, "scaleX", scale)
            val scaleY = ObjectAnimator.ofFloat(view, "scaleY", scale)
            val translateX = ObjectAnimator.ofFloat(view, "translationX", translationX)
            
            AnimatorSet().apply {
                playTogether(scaleX, scaleY, translateX)
                duration = 200
                interpolator = OvershootInterpolator(1.5f)
                start()
            }
        }
    }

    class ChannelDiffCallback : DiffUtil.ItemCallback<ChannelEntity>() {
        override fun areItemsTheSame(oldItem: ChannelEntity, newItem: ChannelEntity): Boolean {
            return oldItem.channelId == newItem.channelId
        }

        override fun areContentsTheSame(oldItem: ChannelEntity, newItem: ChannelEntity): Boolean {
            return oldItem == newItem
        }
    }
}
