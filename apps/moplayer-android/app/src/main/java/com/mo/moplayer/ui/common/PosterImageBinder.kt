package com.mo.moplayer.ui.common

import android.widget.ImageView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.mo.moplayer.R
import com.mo.moplayer.util.DevicePerformance
import com.mo.moplayer.util.GlideHelper
import kotlin.math.roundToInt

/** One image owner per card. Metadata and adapter-position changes keep the current cover. */
internal class PosterImageBinder(private val image: ImageView) {
    private var hasBinding = false
    private var itemId: String? = null
    private var url: String? = null
    private var requestedWidth = 0
    private var requestedHeight = 0
    private val maximumWidth = if (DevicePerformance.isLow(image.context)) 320 else 640

    init {
        image.addOnLayoutChangeListener { _, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom ->
            if (right - left != oldRight - oldLeft || bottom - top != oldBottom - oldTop) loadAtCurrentSize()
        }
    }

    fun bind(id: String?, posterUrl: String?) {
        if (hasBinding && itemId == id && url == posterUrl) return
        clearRequest()
        hasBinding = true
        itemId = id
        url = posterUrl
        requestedWidth = 0; requestedHeight = 0
        image.setImageResource(R.drawable.ic_content_placeholder)
        loadAtCurrentSize()
    }

    private fun loadAtCurrentSize() {
        val source = url?.takeIf { it.isNotBlank() } ?: return
        if (!hasBinding || image.width <= 0 || image.height <= 0 || !GlideHelper.isValidContextForGlide(image.context)) return
        val width = image.width.coerceAtMost(maximumWidth)
        val height = (width.toFloat() * image.height / image.width).roundToInt().coerceIn(1, maximumWidth * 3 / 2)
        if (width == requestedWidth && height == requestedHeight) return
        requestedWidth = width; requestedHeight = height
        // Glide's view target cancels the previous owner; no position-based callback can
        // discard a valid cover merely because the same movie moved in a refreshed list.
        clearRequest()
        Glide.with(image).asBitmap().load(source)
            .override(width, height).centerCrop().dontAnimate()
            .diskCacheStrategy(DiskCacheStrategy.AUTOMATIC)
            .placeholder(R.drawable.ic_content_placeholder).error(R.drawable.ic_content_placeholder)
            .into(image)
    }

    fun clear() {
        hasBinding = false
        itemId = null; url = null
        requestedWidth = 0; requestedHeight = 0
        clearRequest()
        image.setImageDrawable(null)
    }

    private fun clearRequest() {
        // Clearing remains safe after the holder's Activity has been destroyed.
        Glide.with(image.context.applicationContext).clear(image)
    }
}
