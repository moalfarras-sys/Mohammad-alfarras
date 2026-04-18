package com.mo.moplayer.ui.widgets

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Shader
import android.util.AttributeSet
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.mo.moplayer.R

/**
 * HTC Rosie-style Curved Dock Navigation
 * 
 * Features:
 * - Metallic/glassy arc background
 * - Carousel rotation effect on D-Pad navigation
 * - Center item scales up with green glow
 * - Side items smaller with perspective
 * - Endless loop navigation
 */
class HtcCurvedDockView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    data class DockItem(
        val id: String,
        val title: String,
        val iconRes: Int
    )

    private val items = mutableListOf<DockItem>()
    private val itemViews = mutableListOf<View>()
    private var selectedIndex = 0
    private var onItemSelected: ((DockItem) -> Unit)? = null
    private var onItemClicked: ((DockItem) -> Unit)? = null

    private val container: LinearLayout
    
    // Theme management - will be set from parent activity
    private var themeManager: com.mo.moplayer.util.ThemeManager? = null
    
    // Default accent color (used as fallback if ThemeManager not set)
    private val defaultAccentColor = Color.parseColor("#00FF88")

    // Animation constants
    private val scaleFocused = 1.3f
    private val scaleNormal = 0.85f
    private val alphaFocused = 1f
    private val alphaNormal = 0.6f
    private val animDuration = 200L

    // Paint for custom drawing
    private val curvePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val glowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    init {
        setWillNotDraw(false)
        
        // Inflate layout
        LayoutInflater.from(context).inflate(R.layout.widget_htc_dock, this, true)
        container = findViewById(R.id.dockContainer)
        
        // Make focusable for D-Pad
        isFocusable = true
        isFocusableInTouchMode = true
    }
    
    /**
     * Set the ThemeManager to enable dynamic color theming
     * Should be called from parent activity after inflation
     */
    fun setThemeManager(manager: com.mo.moplayer.util.ThemeManager) {
        themeManager = manager
        // Update colors if items are already set
        if (items.isNotEmpty()) {
            updateItemStates(animate = false)
        }
    }
    
    
    /**
     * Get current accent color from ThemeManager or use default
     */
    private fun getAccentColor(): Int {
        return themeManager?.currentAccentColor?.value ?: defaultAccentColor
    }

    fun setItems(dockItems: List<DockItem>) {
        items.clear()
        items.addAll(dockItems)
        itemViews.clear()
        container.removeAllViews()

        items.forEachIndexed { index, item ->
            val itemView = createItemView(item, index)
            itemViews.add(itemView)
            container.addView(itemView)
        }

        // Select center item
        selectedIndex = items.size / 2
        updateItemStates(animate = false)
    }

    private fun createItemView(item: DockItem, index: Int): View {
        val itemView = LayoutInflater.from(context)
            .inflate(R.layout.item_dock_nav, container, false)

        val icon = itemView.findViewById<ImageView>(R.id.ivIcon)
        val label = itemView.findViewById<TextView>(R.id.tvLabel)
        val glowView = itemView.findViewById<View>(R.id.glowIndicator)

        icon.setImageResource(item.iconRes)
        label.text = item.title

        itemView.setOnClickListener {
            if (index == selectedIndex) {
                onItemClicked?.invoke(item)
            } else {
                navigateTo(index)
            }
        }

        itemView.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus && index != selectedIndex) {
                navigateTo(index)
            }
        }

        return itemView
    }

    fun setOnItemSelectedListener(listener: (DockItem) -> Unit) {
        onItemSelected = listener
    }

    fun setOnItemClickedListener(listener: (DockItem) -> Unit) {
        onItemClicked = listener
    }

    fun selectItem(id: String) {
        val index = items.indexOfFirst { it.id == id }
        if (index >= 0) {
            navigateTo(index)
        }
    }

    private fun navigateTo(index: Int) {
        if (index == selectedIndex) return
        
        selectedIndex = index.coerceIn(0, items.lastIndex)
        updateItemStates(animate = true)
        onItemSelected?.invoke(items[selectedIndex])
    }

    private fun navigateLeft() {
        val newIndex = if (selectedIndex > 0) selectedIndex - 1 else items.lastIndex
        navigateTo(newIndex)
    }

    private fun navigateRight() {
        val newIndex = if (selectedIndex < items.lastIndex) selectedIndex + 1 else 0
        navigateTo(newIndex)
    }

    private fun updateItemStates(animate: Boolean) {
        itemViews.forEachIndexed { index, view ->
            val isFocused = index == selectedIndex
            val distanceFromCenter = kotlin.math.abs(index - selectedIndex)
            
            val targetScale = when {
                isFocused -> scaleFocused
                distanceFromCenter == 1 -> scaleNormal
                else -> scaleNormal * 0.9f
            }
            
            val targetAlpha = when {
                isFocused -> alphaFocused
                distanceFromCenter == 1 -> alphaNormal
                else -> alphaNormal * 0.7f
            }

            // Perspective rotation for side items
            val targetRotation = when {
                index < selectedIndex -> 15f * distanceFromCenter.coerceAtMost(2)
                index > selectedIndex -> -15f * distanceFromCenter.coerceAtMost(2)
                else -> 0f
            }

            val icon = view.findViewById<ImageView>(R.id.ivIcon)
            val label = view.findViewById<TextView>(R.id.tvLabel)
            val glowView = view.findViewById<View>(R.id.glowIndicator)

            if (animate) {
                AnimatorSet().apply {
                    playTogether(
                        ObjectAnimator.ofFloat(view, "scaleX", targetScale),
                        ObjectAnimator.ofFloat(view, "scaleY", targetScale),
                        ObjectAnimator.ofFloat(view, "alpha", targetAlpha),
                        ObjectAnimator.ofFloat(view, "rotationY", targetRotation)
                    )
                    duration = animDuration
                    start()
                }
            } else {
                view.scaleX = targetScale
                view.scaleY = targetScale
                view.alpha = targetAlpha
                view.rotationY = targetRotation
            }

            // Update glow indicator with dynamic color
            val currentAccentColor = getAccentColor()
            glowView?.visibility = if (isFocused) View.VISIBLE else View.GONE
            if (isFocused && glowView != null) {
                // Apply dynamic glow background using FocusStyleHelper
                glowView.background = com.mo.moplayer.util.FocusStyleHelper.createDockGlowIndicator(currentAccentColor)
            }
            
            // Update icon tint with dynamic color
            icon.setColorFilter(
                if (isFocused) currentAccentColor else Color.WHITE
            )

            // Update label color with dynamic color
            label.setTextColor(
                if (isFocused) currentAccentColor else Color.WHITE
            )
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        return when (keyCode) {
            KeyEvent.KEYCODE_DPAD_LEFT -> {
                navigateLeft()
                true
            }
            KeyEvent.KEYCODE_DPAD_RIGHT -> {
                navigateRight()
                true
            }
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> {
                if (items.isNotEmpty() && selectedIndex in items.indices) {
                    onItemClicked?.invoke(items[selectedIndex])
                }
                true
            }
            else -> super.onKeyDown(keyCode, event)
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        // Draw curved background
        drawCurvedBackground(canvas)
    }

    private fun drawCurvedBackground(canvas: Canvas) {
        val width = width.toFloat()
        val height = height.toFloat()
        val dockHeight = 80f * resources.displayMetrics.density

        // Create curved path at top
        val path = Path().apply {
            moveTo(0f, height - dockHeight + 20f)
            quadTo(width / 2, height - dockHeight - 10f, width, height - dockHeight + 20f)
            lineTo(width, height)
            lineTo(0f, height)
            close()
        }

        // Gradient for metallic effect
        curvePaint.shader = LinearGradient(
            0f, height - dockHeight,
            0f, height,
            intArrayOf(
                Color.parseColor("#20FFFFFF"),
                Color.parseColor("#10FFFFFF"),
                Color.parseColor("#05FFFFFF")
            ),
            floatArrayOf(0f, 0.3f, 1f),
            Shader.TileMode.CLAMP
        )

        canvas.drawPath(path, curvePaint)

        // Draw highlight line at curve top
        val highlightPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = 2f
            shader = LinearGradient(
                0f, 0f,
                width, 0f,
                intArrayOf(
                    Color.TRANSPARENT,
                    Color.parseColor("#40FFFFFF"),
                    Color.TRANSPARENT
                ),
                floatArrayOf(0.2f, 0.5f, 0.8f),
                Shader.TileMode.CLAMP
            )
        }

        val highlightPath = Path().apply {
            moveTo(0f, height - dockHeight + 20f)
            quadTo(width / 2, height - dockHeight - 10f, width, height - dockHeight + 20f)
        }

        canvas.drawPath(highlightPath, highlightPaint)
    }

    fun getCurrentItem(): DockItem? {
        return items.getOrNull(selectedIndex)
    }
}
