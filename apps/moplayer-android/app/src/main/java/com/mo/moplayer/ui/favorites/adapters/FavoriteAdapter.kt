package com.mo.moplayer.ui.favorites.adapters

import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.FavoriteEntity
import com.mo.moplayer.databinding.ItemContentCardBinding
import com.mo.moplayer.ui.common.PosterImageBinder
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
        com.mo.moplayer.ui.common.PosterCardSizing.fitGridCell(binding.root, parent)
        return FavoriteViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: FavoriteViewHolder, position: Int) {
        holder.bind(getItem(position), position)
    }
    
    override fun onViewRecycled(holder: FavoriteViewHolder) {
        holder.recycle()
        super.onViewRecycled(holder)
    }

    inner class FavoriteViewHolder(
        private val binding: ItemContentCardBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        private var remoteShortcutManager: RemoteShortcutManager? = null
        private val poster = PosterImageBinder(binding.ivPoster)
        
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
            remoteShortcutManager?.reset()
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
        
        fun recycle() {
            remoteShortcutManager?.reset()
            remoteShortcutManager = null
            poster.clear()
        }

        private fun animateFocus(view: View, hasFocus: Boolean) {
            val scale = if (hasFocus) TvCinematicTokens.FOCUS_SCALE else 1.0f
            
            // Apply dynamic colors from ThemeManager
            if (hasFocus) {
                val accentColor = themeManager.currentAccentColor.value
                binding.focusBorder?.background = FocusStyleHelper.createFocusBorder(accentColor, binding.root.resources.displayMetrics.density)
                binding.focusGlow?.background = FocusStyleHelper.createFocusGlow(accentColor, binding.root.resources.displayMetrics.density)
                
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
                binding.focusBorder?.background = FocusStyleHelper.createFocusBorder(color, binding.root.resources.displayMetrics.density)
                binding.focusGlow?.background = FocusStyleHelper.createFocusGlow(color, binding.root.resources.displayMetrics.density)
            }
        }
        
        fun bind(favorite: FavoriteEntity, @Suppress("UNUSED_PARAMETER") position: Int) {
            // Reset all visible state so recycled views never show previous item data
            binding.tvTitle.text = favorite.name.ifBlank { binding.root.context.getString(R.string.unknown_title) }
            binding.ratingBadge.visibility = View.GONE

            poster.bind(favorite.contentType + ":" + favorite.contentId, favorite.iconUrl)

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
