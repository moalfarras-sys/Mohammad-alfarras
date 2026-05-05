package com.mo.moplayer.ui.common

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.app.Dialog
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.Window
import android.view.animation.OvershootInterpolator
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.mo.moplayer.R
import com.mo.moplayer.databinding.DialogContentMenuBinding

/**
 * Optional content details for the long-press context menu.
 * Pass these to display a professional info panel with description, rating, duration, etc.
 */
data class ContentMenuDetails(
    val description: String? = null,
    val duration: String? = null,
    val rating: Double? = null,
    val year: String? = null,
    val genre: String? = null
) {
    companion object {
        /** Format duration from seconds to "Xh Ymin" */
        fun formatDuration(seconds: Int?): String? {
            if (seconds == null || seconds <= 0) return null
            val hours = seconds / 3600
            val minutes = (seconds % 3600) / 60
            return if (hours > 0) "${hours}h ${minutes}min" else "${minutes}min"
        }
    }
}

class ContentMenuHelper(private val context: Context) {

    fun showContentMenu(
        title: String,
        thumbnailUrl: String?,
        isFavorite: Boolean,
        details: ContentMenuDetails? = null,
        onPlay: (() -> Unit)? = null,
        onResume: (() -> Unit)? = null,
        onToggleFavorite: (() -> Unit)? = null,
        onInfo: (() -> Unit)? = null,
        onTrailer: (() -> Unit)? = null,
        onShare: (() -> Unit)? = null,
        onChoosePlayer: (() -> Unit)? = null
    ) {
        val dialog = Dialog(context, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))

        val binding = DialogContentMenuBinding.inflate(LayoutInflater.from(context))
        dialog.setContentView(binding.root)

        // Set content title
        binding.tvContentTitle.text = title

        // Set content details (description, duration, rating, year, genre)
        details?.let { d ->
            if (!d.description.isNullOrBlank()) {
                binding.tvDescription.text = d.description
                binding.tvDescription.visibility = android.view.View.VISIBLE
            } else {
                binding.tvDescription.visibility = android.view.View.GONE
            }
            if (d.rating != null && d.rating > 0) {
                binding.tvRating.text = String.format("%.1f", d.rating)
                binding.tvRating.visibility = android.view.View.VISIBLE
            } else {
                binding.tvRating.visibility = android.view.View.GONE
            }
            if (!d.duration.isNullOrBlank()) {
                binding.tvDuration.text = d.duration
                binding.tvDuration.visibility = android.view.View.VISIBLE
            } else {
                binding.tvDuration.visibility = android.view.View.GONE
            }
            if (!d.year.isNullOrBlank()) {
                binding.tvYear.text = d.year
                binding.tvYear.visibility = android.view.View.VISIBLE
            } else {
                binding.tvYear.visibility = android.view.View.GONE
            }
            if (!d.genre.isNullOrBlank()) {
                binding.tvGenre.text = d.genre
                binding.tvGenre.visibility = android.view.View.VISIBLE
            } else {
                binding.tvGenre.visibility = android.view.View.GONE
            }
        } ?: run {
            binding.tvDescription.visibility = android.view.View.GONE
            binding.tvRating.visibility = android.view.View.GONE
            binding.tvDuration.visibility = android.view.View.GONE
            binding.tvYear.visibility = android.view.View.GONE
            binding.tvGenre.visibility = android.view.View.GONE
        }

        // Load thumbnail
        if (!thumbnailUrl.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(context)) {
            Glide.with(context)
                .load(thumbnailUrl)
                .placeholder(R.drawable.ic_content_placeholder)
                .error(R.drawable.ic_content_placeholder)
                .into(binding.ivThumbnail)
        } else {
            binding.ivThumbnail.setImageResource(R.drawable.ic_content_placeholder)
        }

        // Build menu items
        val menuItems = mutableListOf<ContentMenuItem>()

        // Add Play option if available
        onPlay?.let {
            menuItems.add(
                ContentMenuItem(
                    id = "play",
                    title = context.getString(R.string.menu_play),
                    icon = R.drawable.ic_play,
                    action = {
                        dialog.dismiss()
                        it()
                    }
                )
            )
        }

        // Add Resume option if available (for content with watch progress)
        onResume?.let {
            menuItems.add(
                ContentMenuItem(
                    id = "resume",
                    title = context.getString(R.string.menu_resume),
                    icon = R.drawable.ic_resume,
                    action = {
                        dialog.dismiss()
                        it()
                    }
                )
            )
        }

        // Add Favorite option
        onToggleFavorite?.let {
            menuItems.add(
                ContentMenuItem(
                    id = "favorite",
                    title = if (isFavorite) {
                        context.getString(R.string.menu_remove_from_favorites)
                    } else {
                        context.getString(R.string.menu_add_to_favorites)
                    },
                    icon = if (isFavorite) R.drawable.ic_favorite_filled else R.drawable.ic_favorite_border,
                    action = {
                        dialog.dismiss()
                        it()
                    }
                )
            )
        }

        onChoosePlayer?.let {
            menuItems.add(
                ContentMenuItem(
                    id = "choose_player",
                    title = context.getString(R.string.menu_choose_player),
                    icon = R.drawable.ic_settings,
                    action = {
                        dialog.dismiss()
                        it()
                    }
                )
            )
        }

        // Add Info/Details option if available
        onInfo?.let {
            menuItems.add(
                ContentMenuItem(
                    id = "info",
                    title = context.getString(R.string.menu_details),
                    icon = R.drawable.ic_info,
                    action = {
                        dialog.dismiss()
                        it()
                    }
                )
            )
        }

        // Add Trailer option if available
        onTrailer?.let {
            menuItems.add(
                ContentMenuItem(
                    id = "trailer",
                    title = context.getString(R.string.menu_trailer),
                    icon = R.drawable.ic_trailer,
                    action = {
                        dialog.dismiss()
                        it()
                    }
                )
            )
        }

        // Add Share option if available
        onShare?.let {
            menuItems.add(
                ContentMenuItem(
                    id = "share",
                    title = context.getString(R.string.menu_share),
                    icon = R.drawable.ic_share,
                    action = {
                        dialog.dismiss()
                        it()
                    }
                )
            )
        }

        // Setup RecyclerView
        val adapter = ContentMenuAdapter(menuItems) { menuItem ->
            menuItem.action()
        }

        binding.rvMenuItems.apply {
            layoutManager = LinearLayoutManager(context)
            this.adapter = adapter
            isFocusable = true
            isFocusableInTouchMode = true
        }

        // Animate dialog entrance
        binding.root.alpha = 0f
        binding.root.animate()
            .alpha(1f)
            .setDuration(200)
            .start()

        // Handle back button to dismiss
        dialog.setOnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
                dialog.dismiss()
                true
            } else {
                false
            }
        }

        // Request focus on RecyclerView after dialog is shown
        binding.rvMenuItems.post {
            binding.rvMenuItems.requestFocus()
        }

        dialog.show()
    }
}
