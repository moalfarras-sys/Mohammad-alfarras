package com.mo.moplayer.ui.common

import android.content.Context
import android.util.AttributeSet
import android.view.View
import android.widget.FrameLayout

/**
 * FrameLayout whose height follows its width (height = width x [ratio]).
 *
 * Poster cards use it so a 2:3 poster is never squeezed or over-cropped, whether the card has a
 * fixed width (Home rows) or fills a grid cell whose width depends on the screen (Movies, Series,
 * Favorites).
 */
class AspectRatioFrameLayout @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    /** Height divided by width. 1.5 is the 2:3 movie poster. */
    var ratio: Float = DEFAULT_RATIO
        set(value) {
            if (value > 0f && value != field) {
                field = value
                requestLayout()
            }
        }

    init {
        if (attrs != null) {
            val values = context.obtainStyledAttributes(attrs, com.mo.moplayer.R.styleable.AspectRatioFrameLayout)
            try {
                ratio = values.getFloat(com.mo.moplayer.R.styleable.AspectRatioFrameLayout_aspectRatio, DEFAULT_RATIO)
            } finally {
                values.recycle()
            }
        }
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val widthMode = MeasureSpec.getMode(widthMeasureSpec)
        val width = MeasureSpec.getSize(widthMeasureSpec)
        if (widthMode == MeasureSpec.UNSPECIFIED || width <= 0) {
            super.onMeasure(widthMeasureSpec, heightMeasureSpec)
            return
        }
        val height = (width * ratio).toInt()
        super.onMeasure(
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
        )
    }

    companion object {
        const val DEFAULT_RATIO = 1.5f
    }
}
