package com.mo.moplayer.ui.livetv.adapters

import android.util.Log
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.core.widget.ImageViewCompat
import android.content.res.ColorStateList
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
import com.mo.moplayer.data.local.entity.ChannelEntity
import com.mo.moplayer.databinding.ItemChannelTivimateBinding
import com.mo.moplayer.ui.common.RemoteShortcutManager
import com.mo.moplayer.ui.common.focus.LiquidFocusDelegate
import com.mo.moplayer.util.FocusStyleHelper

/**
 * Wrapper class that includes both channel data and its playing state.
 * This allows DiffUtil to detect playing state changes without manual notifications.
 */
data class ChannelItem(
    val channel: ChannelEntity,
    val isPlaying: Boolean
)

/**
 * TiviMate-style adapter for channels with enhanced UI
 * Features: Large logos, EPG info, favorites, quality badges
 * 
 * Uses wrapper items with playing state to avoid RecyclerView crashes during rapid channel switching
 */
class ChannelTiviMateAdapter(
    private val onChannelClick: (ChannelEntity) -> Unit,
    private val onChannelFocused: (ChannelEntity) -> Unit,
    private val onFavoriteClick: ((ChannelEntity) -> Unit)? = null,
    private val onChannelLongClick: ((ChannelEntity) -> Unit)? = null,
    private val themeManager: com.mo.moplayer.util.ThemeManager
) : ListAdapter<ChannelItem, ChannelTiviMateAdapter.ChannelViewHolder>(
    ChannelItemDiffCallback()
) {

    companion object {
        private const val PAYLOAD_PLAYING_STATE = "playing_state"
        private const val PAYLOAD_FAVORITE_STATE = "favorite_state"
    }

    private var favoriteIds: Set<String> = emptySet()
    private var recyclerView: RecyclerView? = null
    
    init {
        // Enable stable IDs to help RecyclerView track items correctly during updates
        setHasStableIds(true)
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
                if (viewHolder is ChannelViewHolder && child.hasFocus()) {
                    viewHolder.updateFocusColors(color)
                }
            }
        }
    }
    
    override fun getItemId(position: Int): Long {
        return getItem(position).channel.channelId.hashCode().toLong()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ChannelViewHolder {
        val binding = ItemChannelTivimateBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ChannelViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ChannelViewHolder, position: Int) {
        val item = getItem(position)
        holder.bind(item.channel, position, item.isPlaying)
    }
    
    /**
     * Override to handle payload-based updates for partial view updates
     * This prevents full rebinds and avoids RecyclerView crash during rapid updates
     */
    override fun onBindViewHolder(holder: ChannelViewHolder, position: Int, payloads: MutableList<Any>) {
        if (payloads.isEmpty()) {
            // No payload - do full bind
            super.onBindViewHolder(holder, position, payloads)
        } else {
            val item = getItem(position)
            payloads.forEach { payload ->
                when (payload) {
                    PAYLOAD_PLAYING_STATE -> holder.updatePlayingState(item.isPlaying)
                    PAYLOAD_FAVORITE_STATE -> holder.updateFavoriteState(favoriteIds.contains(item.channel.channelId))
                }
            }
        }
    }

    /**
     * Submit a new list with current channel ID.
     * Creates ChannelItem wrappers with playing state, allowing DiffUtil to detect changes automatically.
     * This completely eliminates manual notifyItemChanged calls and prevents race conditions.
     * Includes defensive checks to prevent view hierarchy crashes.
     */
    fun submitListWithCurrentChannel(list: List<ChannelEntity>?, channelId: String?) {
        try {
            val items = list?.map { channel ->
                ChannelItem(
                    channel = channel,
                    isPlaying = channel.channelId == channelId
                )
            }
            
            // Only submit if list is different to avoid unnecessary updates
            if (items != currentList) {
                submitList(items)
            }
        } catch (e: Exception) {
            Log.e("ChannelAdapter", "Error submitting list", e)
            // Don't crash - the next update will fix the state
        }
    }

    fun setFavorites(ids: Set<String>) {
        if (favoriteIds == ids) return
        val previous = favoriteIds
        favoriteIds = ids
        currentList.forEachIndexed { index, item ->
            val wasFavorite = previous.contains(item.channel.channelId)
            val isFavorite = ids.contains(item.channel.channelId)
            if (wasFavorite != isFavorite) {
                notifyItemChanged(index, PAYLOAD_FAVORITE_STATE)
            }
        }
    }

    inner class ChannelViewHolder(
        private val binding: ItemChannelTivimateBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        private var remoteShortcutManager: RemoteShortcutManager? = null

        /**
         * Update only the playing state without full rebind
         * Used for payload-based updates to avoid RecyclerView crashes
         * Uses post() to defer non-critical UI updates for better performance
         */
        fun updatePlayingState(isPlaying: Boolean) {
            // Check if view is still attached before updating
            if (bindingAdapterPosition == RecyclerView.NO_POSITION) {
                return // View is being recycled, skip update
            }
            
            try {
                // Update critical indicators immediately
                binding.nowPlayingIndicator.visibility = if (isPlaying) View.VISIBLE else View.GONE
                binding.playingIndicator.visibility = if (isPlaying) View.VISIBLE else View.GONE
                binding.channelContainer.isSelected = isPlaying
                
                // Defer non-critical visual updates to avoid blocking during rapid scrolling
                binding.root.post {
                    if (bindingAdapterPosition != RecyclerView.NO_POSITION) {
                        try {
                            // Update channel number color with dynamic accent
                            val context = binding.root.context
                            binding.tvChannelNumber.setTextColor(
                                if (isPlaying) themeManager.currentAccentColor.value
                                else ContextCompat.getColor(context, R.color.htc_text_secondary)
                            )
                            
                            // Update glow if not focused
                            if (!binding.channelContainer.hasFocus()) {
                                binding.focusGlow.alpha = if (isPlaying) 0.3f else 0f
                            }
                        } catch (e: Exception) {
                            Log.e("ChannelViewHolder", "Error in deferred playing state update", e)
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("ChannelViewHolder", "Error updating playing state at position $bindingAdapterPosition", e)
            }
        }

        fun bind(channel: ChannelEntity, position: Int, isPlaying: Boolean) {
            // Check if view is still attached before binding
            if (bindingAdapterPosition == RecyclerView.NO_POSITION) {
                return // View is being recycled, skip binding
            }
            
            try {
                val isFavorite = favoriteIds.contains(channel.channelId)

                // Channel number
                binding.tvChannelNumber.text = (position + 1).toString()

                // Channel name
                binding.tvChannelName.text = channel.name

                // Load channel logo with optimizations for smooth scrolling
                if (!channel.streamIcon.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.root.context)) {
                    Glide.with(binding.root.context)
                        .load(channel.streamIcon)
                        .thumbnail(0.1f) // Load low-res version first
                        .override(104, 76)
                        .diskCacheStrategy(DiskCacheStrategy.ALL) // Cache everything
                        .dontAnimate() // Skip crossfade for better performance
                        .placeholder(R.drawable.ic_placeholder_channel)
                        .error(R.drawable.ic_placeholder_channel)
                        .centerInside()
                        .listener(object : RequestListener<android.graphics.drawable.Drawable> {
                            override fun onLoadFailed(
                                e: GlideException?,
                                model: Any?,
                                target: Target<android.graphics.drawable.Drawable>,
                                isFirstResource: Boolean
                            ): Boolean {
                                Log.d("ChannelThumb", "logo_load_failed id=${channel.channelId}")
                                return false
                            }

                            override fun onResourceReady(
                                resource: android.graphics.drawable.Drawable,
                                model: Any,
                                target: Target<android.graphics.drawable.Drawable>?,
                                dataSource: DataSource,
                                isFirstResource: Boolean
                            ): Boolean = false
                        })
                        .into(binding.ivChannelLogo)
                } else {
                    binding.ivChannelLogo.setImageResource(R.drawable.ic_placeholder_channel)
                }

                // EPG Info (placeholder - would be populated from EPG data)
                // For now, hide EPG elements
                binding.epgDot.visibility = View.GONE
                binding.tvEpgTime.visibility = View.GONE
                binding.tvEpgTitle.visibility = View.GONE

                // Quality badge (hide by default, would be determined from stream info)
                binding.tvQuality.visibility = View.GONE

                // Favorite button
                if (onFavoriteClick != null) {
                    binding.ivFavorite.visibility = View.VISIBLE
                    updateFavoriteState(isFavorite)
                    binding.ivFavorite.setOnClickListener {
                        onFavoriteClick.invoke(channel)
                    }
                } else {
                    binding.ivFavorite.visibility = View.GONE
                }

                // Now playing indicator
                binding.nowPlayingIndicator.visibility = if (isPlaying) View.VISIBLE else View.GONE
                binding.playingIndicator.visibility = if (isPlaying) View.VISIBLE else View.GONE

                // Selection state
                binding.channelContainer.isSelected = isPlaying

                // Update channel number color for playing channel with dynamic accent
                val context = binding.root.context
                binding.tvChannelNumber.setTextColor(
                    if (isPlaying) themeManager.currentAccentColor.value
                    else ContextCompat.getColor(context, R.color.htc_text_secondary)
                )

                // Click handler
                binding.channelContainer.setOnClickListener {
                    onChannelClick(channel)
                }

                remoteShortcutManager = RemoteShortcutManager(
                    onShortOk = { onChannelClick(channel) },
                    onTripleOk = { onFavoriteClick?.invoke(channel) },
                    onLongOk = { onChannelLongClick?.invoke(channel) },
                    longPressThresholdMs = 3000L
                )
                binding.channelContainer.setOnKeyListener { _, keyCode, event ->
                    if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) {
                        return@setOnKeyListener event?.let { ev ->
                            remoteShortcutManager?.onKeyEvent(keyCode, ev) ?: false
                        } ?: false
                    }
                    false
                }

                // Focus handler with animations
                binding.channelContainer.setOnFocusChangeListener { _, hasFocus ->
                    if (hasFocus) {
                        onChannelFocused(channel)
                    }
                    animateFocus(hasFocus, isPlaying)
                }
            } catch (e: Exception) {
                Log.e("ChannelViewHolder", "Error binding view at position $position", e)
            }
        }

        private fun animateFocus(hasFocus: Boolean, isPlaying: Boolean) {
            val glowAlpha = if (hasFocus) 0.7f else if (isPlaying) 0.3f else 0f
            val borderAlpha = if (hasFocus && !isPlaying) 1f else 0f

            // Apply dynamic colors from ThemeManager
            if (hasFocus) {
                val accentColor = themeManager.currentAccentColor.value
                binding.focusBorder.background = FocusStyleHelper.createChannelFocusBorder(accentColor)
                binding.focusGlow.background = FocusStyleHelper.createChannelFocusGlow(accentColor)
            }

            LiquidFocusDelegate.animateCardFocus(
                target = binding.channelContainer,
                hasFocus = hasFocus,
                focusGlow = null,
                focusRing = null,
                focusedElevation = 12f,
                restingElevation = 2f,
                translationYFocused = 0f
            )
            binding.channelContainer.translationX = if (hasFocus) -2f else 0f

            // Glow animation (no interpolator needed for alpha)
            binding.focusGlow.animate()
                .alpha(glowAlpha)
                .setDuration(180)
                .start()

            // Border animation (no interpolator needed for alpha)
            binding.focusBorder.animate()
                .alpha(borderAlpha)
                .setDuration(180)
                .start()

            // Removed bringToFront() - causes unnecessary redraws and layout passes
        }

        /**
         * Update focus colors when theme changes
         */
        fun updateFocusColors(color: Int) {
            if (binding.channelContainer.hasFocus()) {
                binding.focusBorder.background = FocusStyleHelper.createChannelFocusBorder(color)
                binding.focusGlow.background = FocusStyleHelper.createChannelFocusGlow(color)
            }
        }

        fun updateFavoriteState(isFavorite: Boolean) {
            binding.ivFavorite.setImageResource(
                if (isFavorite) R.drawable.ic_favorite_filled else R.drawable.ic_favorite_border
            )
            val context = binding.root.context
            val tintColor = if (isFavorite) {
                ContextCompat.getColor(context, R.color.htc_error)
            } else {
                ContextCompat.getColor(context, R.color.htc_text_tertiary)
            }
            ImageViewCompat.setImageTintList(binding.ivFavorite, ColorStateList.valueOf(tintColor))
        }
    }

    class ChannelItemDiffCallback : DiffUtil.ItemCallback<ChannelItem>() {
        override fun areItemsTheSame(oldItem: ChannelItem, newItem: ChannelItem): Boolean {
            return oldItem.channel.channelId == newItem.channel.channelId
        }

        override fun areContentsTheSame(oldItem: ChannelItem, newItem: ChannelItem): Boolean {
            // Compare both channel data and playing state
            return oldItem.channel == newItem.channel && oldItem.isPlaying == newItem.isPlaying
        }
        
        override fun getChangePayload(oldItem: ChannelItem, newItem: ChannelItem): Any? {
            // If only playing state changed, return payload for partial update
            if (oldItem.channel == newItem.channel && oldItem.isPlaying != newItem.isPlaying) {
                return PAYLOAD_PLAYING_STATE
            }
            return null
        }
    }
}
