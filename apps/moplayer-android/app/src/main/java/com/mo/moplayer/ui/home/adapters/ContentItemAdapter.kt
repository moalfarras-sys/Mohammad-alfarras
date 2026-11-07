package com.mo.moplayer.ui.home.adapters

import android.content.res.ColorStateList
import android.graphics.drawable.ColorDrawable
import android.util.TypedValue
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.graphics.ColorUtils
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.mo.moplayer.R
import com.mo.moplayer.databinding.ItemHomeCompactCardBinding
import com.mo.moplayer.ui.common.RemoteShortcutManager
import com.mo.moplayer.ui.common.focus.LiquidFocusDelegate
import com.mo.moplayer.ui.home.ContentItem
import com.mo.moplayer.util.GlideHelper
import com.mo.moplayer.util.ThemeManager
import com.mo.moplayer.util.TvUiPreferences
import kotlin.math.roundToInt

/** Small, stable Home cards. Library grids retain their full portrait posters. */
class ContentItemAdapter(
    private val onItemClick: (ContentItem) -> Unit,
    private val onItemFocused: (ContentItem) -> Unit,
    private val onItemLongPress: ((ContentItem) -> Unit)? = null,
    private val onFavoriteShortcut: ((ContentItem) -> Unit)? = null,
    private val themeManager: ThemeManager,
    private val tvUiPreferences: TvUiPreferences,
) : ListAdapter<ContentItem, ContentItemAdapter.ItemViewHolder>(ItemDiffCallback()) {
    private var recyclerView: RecyclerView? = null
    private var animationsEnabled = true
    private var posterSize = TvUiPreferences.PosterSize.MEDIUM

    init { setHasStableIds(true) }

    override fun getItemId(position: Int): Long {
        val item = getItem(position)
        return (item.type.name + ":" + item.id).fold(-3750763034362895579L) { hash, char ->
            (hash xor char.code.toLong()) * 1099511628211L
        }
    }

    // A compact holder must never be recycled into a portrait Movie/Series adapter.
    override fun getItemViewType(position: Int) = com.mo.moplayer.util.RecyclerViewOptimizer.VIEW_TYPE_HOME_COMPACT_CARD
    override fun onAttachedToRecyclerView(view: RecyclerView) { super.onAttachedToRecyclerView(view); recyclerView = view }
    override fun onDetachedFromRecyclerView(view: RecyclerView) { recyclerView = null; super.onDetachedFromRecyclerView(view) }
    override fun onCreateViewHolder(parent: ViewGroup, type: Int) = ItemViewHolder(
        ItemHomeCompactCardBinding.inflate(LayoutInflater.from(parent.context), parent, false))
    override fun onBindViewHolder(holder: ItemViewHolder, position: Int) = holder.bind(getItem(position), position)
    override fun onViewRecycled(holder: ItemViewHolder) { holder.recycle(); super.onViewRecycled(holder) }

    fun updateThemeColor(color: Int) = visibleHolders { it.updateFocusColors(color) }
    fun updateUiPreferences(newPosterSize: TvUiPreferences.PosterSize, newAnimationsEnabled: Boolean) {
        if (posterSize == newPosterSize && animationsEnabled == newAnimationsEnabled) return
        posterSize = newPosterSize
        animationsEnabled = newAnimationsEnabled
        visibleHolders { it.applyMetrics(); it.applyFocus(it.itemView.hasFocus(), false) }
    }

    private fun visibleHolders(action: (ItemViewHolder) -> Unit) {
        recyclerView?.let { view ->
            for (index in 0 until view.childCount) (view.getChildViewHolder(view.getChildAt(index)) as? ItemViewHolder)?.let(action)
        }
    }

    inner class ItemViewHolder(private val binding: ItemHomeCompactCardBinding) : RecyclerView.ViewHolder(binding.root) {
        private val density = binding.root.resources.displayMetrics.density
        private val placeholder = ColorDrawable(binding.root.context.getColor(R.color.cinematic_bg_base))
        private var boundPoster: String? = null
        private var boundId: String? = null
        private var shortcut: RemoteShortcutManager? = null

        fun bind(item: ContentItem, @Suppress("UNUSED_PARAMETER") position: Int) {
            applyMetrics()
            binding.tvTitle.text = item.title.ifBlank { binding.root.context.getString(R.string.unknown_title) }
            binding.root.contentDescription = binding.tvTitle.text
            val progress = item.progress ?: 0
            binding.progressWatch.visibility = if (progress in 1..94) View.VISIBLE else View.GONE
            binding.progressWatch.progress = progress
            // A watch-progress/rating update must not clear and reload the same poster.
            if (boundId != item.id || boundPoster != item.posterUrl) {
                boundId = item.id
                boundPoster = item.posterUrl
                if (GlideHelper.isValidContextForGlide(binding.ivPoster.context)) {
                    Glide.with(binding.ivPoster).clear(binding.ivPoster)
                    val width = (48 * density).roundToInt().coerceIn(72, 192)
                    Glide.with(binding.ivPoster).load(item.posterUrl)
                        .override(width, width * 3 / 2).centerCrop().dontAnimate()
                        .diskCacheStrategy(DiskCacheStrategy.AUTOMATIC)
                        .placeholder(placeholder).error(placeholder).into(binding.ivPoster)
                }
            }
            shortcut?.reset()
            shortcut = RemoteShortcutManager(
                onShortOk = { onItemClick(item) }, onTripleOk = { onFavoriteShortcut?.invoke(item) },
                onLongOk = { onItemLongPress?.invoke(item) })
            binding.root.setOnClickListener { onItemClick(item) }
            binding.root.setOnKeyListener { _, code, event ->
                val horizontal = code == KeyEvent.KEYCODE_DPAD_LEFT || code == KeyEvent.KEYCODE_DPAD_RIGHT
                val rtl = binding.root.layoutDirection == View.LAYOUT_DIRECTION_RTL
                val towardEnd = code == if (rtl) KeyEvent.KEYCODE_DPAD_LEFT else KeyEvent.KEYCODE_DPAD_RIGHT
                val position = bindingAdapterPosition
                if (horizontal && position != RecyclerView.NO_POSITION &&
                    ((towardEnd && position == itemCount - 1) || (!towardEnd && position == 0))) {
                    // At the rail edges, keep focus on the card instead of jumping to the dock.
                    true
                } else if (code == KeyEvent.KEYCODE_MENU && event.action == KeyEvent.ACTION_DOWN) {
                    onItemLongPress?.invoke(item); true
                } else shortcut?.onKeyEvent(code, event) == true
            }
            binding.root.setOnFocusChangeListener { _, focused ->
                if (focused) onItemFocused(item)
                applyFocus(focused, animationsEnabled)
            }
            applyFocus(binding.root.hasFocus(), false)
        }

        fun applyMetrics() {
            val width = when (posterSize) {
                TvUiPreferences.PosterSize.SMALL -> 176
                TvUiPreferences.PosterSize.MEDIUM -> 192
                TvUiPreferences.PosterSize.LARGE -> 208
            }
            val widthPx = (width * density).roundToInt()
            if (binding.root.layoutParams.width != widthPx) binding.root.layoutParams = binding.root.layoutParams.apply { this.width = widthPx }
            binding.tvTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, if (posterSize == TvUiPreferences.PosterSize.LARGE) 13.5f else 13f)
        }

        fun applyFocus(focused: Boolean, animate: Boolean) {
            updateFocusColors(themeManager.currentAccentColor.value)
            if (animate) LiquidFocusDelegate.animateCardFocus(binding.root, focused)
            else {
                binding.root.animate().cancel()
                binding.root.alpha = 1f
                binding.root.scaleX = 1f; binding.root.scaleY = 1f; binding.root.translationY = 0f
                binding.root.elevation = 0f
            }
        }

        fun updateFocusColors(color: Int) {
            binding.root.strokeColor = if (binding.root.hasFocus()) color else ColorUtils.setAlphaComponent(color, 45)
            binding.root.strokeWidth = ((if (binding.root.hasFocus()) 2f else 1f) * density).roundToInt()
            binding.progressWatch.progressTintList = ColorStateList.valueOf(color)
        }

        fun recycle() {
            shortcut?.reset(); shortcut = null
            boundId = null; boundPoster = null
            binding.root.animate().cancel()
            if (GlideHelper.isValidContextForGlide(binding.ivPoster.context)) Glide.with(binding.ivPoster).clear(binding.ivPoster)
        }
    }

    class ItemDiffCallback : DiffUtil.ItemCallback<ContentItem>() {
        override fun areItemsTheSame(old: ContentItem, new: ContentItem) = old.id == new.id && old.type == new.type
        override fun areContentsTheSame(old: ContentItem, new: ContentItem) = old == new
    }
}
