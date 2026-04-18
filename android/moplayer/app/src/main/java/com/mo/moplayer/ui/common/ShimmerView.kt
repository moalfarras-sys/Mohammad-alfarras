package com.mo.moplayer.ui.common

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View
import android.view.animation.LinearInterpolator
import com.mo.moplayer.R

/**
 * Custom ShimmerView with white shimmer effect Use this for loading placeholders with a premium
 * look
 */
class ShimmerView
@JvmOverloads
constructor(context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0) :
        View(context, attrs, defStyleAttr) {

    private val shimmerPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private var shimmerAnimator: ValueAnimator? = null
    private var shimmerTranslate = 0f
    private var cornerRadius = 12f

    // White shimmer colors
    private val shimmerColors =
            intArrayOf(
                    0x00FFFFFF.toInt(), // Transparent white
                    0x60FFFFFF.toInt(), // Semi-transparent white
                    0x00FFFFFF.toInt() // Transparent white
            )

    private val shimmerPositions = floatArrayOf(0f, 0.5f, 1f)

    private var shimmerGradient: LinearGradient? = null
    private val gradientMatrix = Matrix()

    // Background paint
    private val backgroundPaint =
            Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = 0xFF12121A.toInt() // card_bg_luxury
            }

    private val rectF = RectF()

    init {
        // Get corner radius from attrs if provided
        context.theme.obtainStyledAttributes(attrs, R.styleable.ShimmerView, 0, 0).apply {
            try {
                cornerRadius =
                        getDimension(
                                R.styleable.ShimmerView_shimmerCornerRadius,
                                12f * resources.displayMetrics.density
                        )
            } finally {
                recycle()
            }
        }
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)

        // Create shimmer gradient
        shimmerGradient =
                LinearGradient(
                        0f,
                        0f,
                        w.toFloat(),
                        0f,
                        shimmerColors,
                        shimmerPositions,
                        Shader.TileMode.CLAMP
                )
        shimmerPaint.shader = shimmerGradient
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        rectF.set(0f, 0f, width.toFloat(), height.toFloat())

        // Draw background
        canvas.drawRoundRect(rectF, cornerRadius, cornerRadius, backgroundPaint)

        // Draw shimmer
        shimmerGradient?.let { gradient ->
            gradientMatrix.reset()
            gradientMatrix.setTranslate(shimmerTranslate - width, 0f)
            gradient.setLocalMatrix(gradientMatrix)
            canvas.drawRoundRect(rectF, cornerRadius, cornerRadius, shimmerPaint)
        }
    }

    fun startShimmer() {
        if (shimmerAnimator?.isRunning == true) return

        shimmerAnimator =
                ValueAnimator.ofFloat(0f, width.toFloat() * 2).apply {
                    duration = 1500
                    repeatCount = ValueAnimator.INFINITE
                    interpolator = LinearInterpolator()
                    addUpdateListener { animation ->
                        shimmerTranslate = animation.animatedValue as Float
                        invalidate()
                    }
                    start()
                }
    }

    fun stopShimmer() {
        shimmerAnimator?.cancel()
        shimmerAnimator = null
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        startShimmer()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        stopShimmer()
    }
}
