package com.mo.moplayer.ui.favorites.adapters

import android.graphics.drawable.Drawable
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.FavoriteEntity
import com.mo.moplayer.databinding.ItemContentCardBinding
import com.mo.moplayer.ui.common.RemoteShortcutManager
import com.mo.moplayer.ui.common.design.TvCinematicTokens
import com.mo.moplayer.util.FocusStyleHelper

class FavoriteAdapter(
    private val onItemClick: (FavoriteEntity) -> Unit,
    private val onItemLongClick: (FavoriteEntity) -> Unit,
    private val onItemLongPress: ((FavoriteEntity) -> Unit)? = null,
    private val onFavoriteShortcut: ((FavoriteEntity) -> Unit)? = null,
    private val themeManager: com.mo.moplayer.util.ThemeManager
) : ListAdapter<FavoriteEntity, FavoriteAdapter.FavoriteViewHolder>(FavoriteDiffCallback()) {

    init {
        setHasStableIds(true)
    }

    private var recyclerView: RecyclerView? = null

    override fun getItemId(position: Int): Long {
        return getItem(position).id
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
                if (viewHolder is FavoriteViewHolder && child.hasFocus()) {
                    viewHolder.updateFocusColors(color)
                }
            }
        }
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FavoriteViewHolder {
        val binding = ItemContentCardBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FavoriteViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: FavoriteViewHolder, position: Int) {
        holder.bind(getItem(position), position)
    }
    
    inner class FavoriteViewHolder(
        private val binding: ItemContentCardBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        private var remoteShortcutManager: RemoteShortcutManager? = null
        
        init {
            binding.root.setOnClickListener {
                val position = bindingAdapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onItemClick(getItem(position))
                }
            }
            
            // Keep long click listener for touch events
            binding.root.setOnLongClickListener {
                val position = bindingAdapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onItemLongClick(getItem(position))
                }
                true
            }
            
            binding.root.setOnFocusChangeListener { view, hasFocus ->
                animateFocus(view, hasFocus)
            }
        }
        
        fun setupLongPress(favorite: FavoriteEntity) {
            remoteShortcutManager = RemoteShortcutManager(
                onShortOk = { onItemClick(favorite) },
                onTripleOk = { onFavoriteShortcut?.invoke(favorite) },
                onLongOk = { onItemLongPress?.invoke(favorite) }
            )

            // Add key listener for D-Pad with proper long press detection
            binding.root.setOnKeyListener { _, keyCode, event ->
                when (event.action) {
                    KeyEvent.ACTION_DOWN -> {
                        if (keyCode == KeyEvent.KEYCODE_MENU) {
                            onItemLongPress?.invoke(favorite)
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
        }
        
        private fun animateFocus(view: View, hasFocus: Boolean) {
            val scale = if (hasFocus) TvCinematicTokens.FOCUS_SCALE else 1.0f
            
            // Apply dynamic colors from ThemeManager
            if (hasFocus) {
                val accentColor = themeManager.currentAccentColor.value
                binding.focusBorder?.background = FocusStyleHelper.createFocusBorder(accentColor)
                binding.focusGlow?.background = FocusStyleHelper.createFocusGlow(accentColor)
                
                // Animate glow and border
                binding.focusGlow?.animate()?.alpha(1f)?.setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)?.start()
                binding.focusBorder?.animate()?.alpha(1f)?.setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)?.start()
            } else {
                binding.focusGlow?.animate()?.alpha(0f)?.setDuration(TvCinematicTokens.FOCUS_OUT_DURATION_MS)?.start()
                binding.focusBorder?.animate()?.alpha(0f)?.setDuration(TvCinematicTokens.FOCUS_OUT_DURATION_MS)?.start()
            }
            
            view.animate()
                .scaleX(scale)
                .scaleY(scale)
                .setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
                .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                .start()
            view.elevation = if (hasFocus) TvCinematicTokens.CARD_ELEVATION_FOCUSED else TvCinematicTokens.CARD_ELEVATION_REST
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
        
        fun bind(favorite: FavoriteEntity, position: Int) {
            // Reset all visible state so recycled views never show previous item data
            binding.tvTitle.text = favorite.name.ifBlank { "Unknown title" }
            binding.ratingBadge.visibility = View.GONE

            // Clear previous Glide request and image so we never show wrong poster on reuse
            if (com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.ivPoster.context)) {
                Glide.with(binding.ivPoster.context).clear(binding.ivPoster)
            }
            binding.ivPoster.setImageDrawable(null)

            if (!favorite.iconUrl.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(binding.ivPoster.context)) {
                Glide.with(binding.ivPoster.context)
                    .load(favorite.iconUrl)
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
                            android.util.Log.d("FavoriteThumb", "poster_load_failed id=${favorite.contentId}")
                            return false
                        }
                    })
                    .into(binding.ivPoster)
            } else {
                binding.ivPoster.setImageResource(R.drawable.ic_content_placeholder)
            }

            // Setup long press for this item
            setupLongPress(favorite)
        }
    }
    
    class FavoriteDiffCallback : DiffUtil.ItemCallback<FavoriteEntity>() {
        override fun areItemsTheSame(oldItem: FavoriteEntity, newItem: FavoriteEntity): Boolean {
            return oldItem.id == newItem.id
        }
        
        override fun areContentsTheSame(oldItem: FavoriteEntity, newItem: FavoriteEntity): Boolean {
            return oldItem == newItem
        }
    }
}
