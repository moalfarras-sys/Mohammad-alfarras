package com.mo.moplayer.ui.common

import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.View
import android.view.animation.AnimationUtils
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.core.view.isVisible
import com.mo.moplayer.R

/**
 * Unified loading state view with different modes:
 * - SPINNER: Simple progress spinner
 * - SHIMMER: Shimmer placeholder effect
 * - SKELETON: Skeleton loading with shapes
 * - ERROR: Error state with retry button
 * - EMPTY: Empty state with message
 */
class LoadingStateView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {
    
    interface LoadingStateListener {
        fun onRetryClicked()
    }
    
    enum class State {
        LOADING,
        ERROR,
        EMPTY,
        CONTENT
    }
    
    private var listener: LoadingStateListener? = null
    private var currentState = State.CONTENT
    
    private val loadingContainer: View
    private val progressBar: ProgressBar
    private val loadingText: TextView
    
    private val errorContainer: View
    private val errorIcon: ImageView
    private val errorTitle: TextView
    private val errorMessage: TextView
    private val retryButton: View
    
    private val emptyContainer: View
    private val emptyIcon: ImageView
    private val emptyTitle: TextView
    private val emptyMessage: TextView
    
    init {
        LayoutInflater.from(context).inflate(R.layout.view_loading_state, this, true)
        
        loadingContainer = findViewById(R.id.container_loading)
        progressBar = findViewById(R.id.progress_loading)
        loadingText = findViewById(R.id.tv_loading_text)
        
        errorContainer = findViewById(R.id.container_error)
        errorIcon = findViewById(R.id.iv_error_icon)
        errorTitle = findViewById(R.id.tv_error_title)
        errorMessage = findViewById(R.id.tv_error_message)
        retryButton = findViewById(R.id.btn_retry)
        
        emptyContainer = findViewById(R.id.container_empty)
        emptyIcon = findViewById(R.id.iv_empty_icon)
        emptyTitle = findViewById(R.id.tv_empty_title)
        emptyMessage = findViewById(R.id.tv_empty_message)
        
        retryButton.setOnClickListener {
            listener?.onRetryClicked()
        }
        
        // Parse custom attributes
        context.theme.obtainStyledAttributes(attrs, R.styleable.LoadingStateView, 0, 0).apply {
            try {
                val loadingTextStr = getString(R.styleable.LoadingStateView_loadingText)
                if (!loadingTextStr.isNullOrEmpty()) {
                    loadingText.text = loadingTextStr
                }
            } finally {
                recycle()
            }
        }
        
        // Initially hidden
        visibility = GONE
    }
    
    fun setListener(listener: LoadingStateListener) {
        this.listener = listener
    }
    
    /**
     * Show loading state
     */
    fun showLoading(message: String? = null) {
        currentState = State.LOADING
        visibility = VISIBLE
        
        loadingContainer.isVisible = true
        errorContainer.isVisible = false
        emptyContainer.isVisible = false
        
        message?.let { loadingText.text = it }
        loadingText.isVisible = !message.isNullOrEmpty()
        
        // Start rotation animation
        progressBar.startAnimation(AnimationUtils.loadAnimation(context, R.anim.rotate_loading))
    }
    
    /**
     * Show error state
     */
    fun showError(
        title: String = context.getString(R.string.error_generic),
        message: String? = null,
        showRetry: Boolean = true
    ) {
        currentState = State.ERROR
        visibility = VISIBLE
        
        loadingContainer.isVisible = false
        errorContainer.isVisible = true
        emptyContainer.isVisible = false
        
        errorTitle.text = title
        errorMessage.apply {
            text = message
            isVisible = !message.isNullOrEmpty()
        }
        retryButton.isVisible = showRetry
        
        // Animate entrance
        errorContainer.alpha = 0f
        errorContainer.animate()
            .alpha(1f)
            .setDuration(200)
            .start()
    }
    
    /**
     * Show empty state
     */
    fun showEmpty(
        title: String,
        message: String? = null,
        iconRes: Int? = null
    ) {
        currentState = State.EMPTY
        visibility = VISIBLE
        
        loadingContainer.isVisible = false
        errorContainer.isVisible = false
        emptyContainer.isVisible = true
        
        emptyTitle.text = title
        emptyMessage.apply {
            text = message
            isVisible = !message.isNullOrEmpty()
        }
        iconRes?.let { emptyIcon.setImageResource(it) }
        
        // Animate entrance
        emptyContainer.alpha = 0f
        emptyContainer.animate()
            .alpha(1f)
            .setDuration(200)
            .start()
    }
    
    /**
     * Hide and show content
     */
    fun showContent() {
        currentState = State.CONTENT
        
        // Fade out
        animate()
            .alpha(0f)
            .setDuration(150)
            .withEndAction {
                visibility = GONE
                alpha = 1f
                loadingContainer.isVisible = false
                errorContainer.isVisible = false
                emptyContainer.isVisible = false
            }
            .start()
    }
    
    /**
     * Immediately hide without animation
     */
    fun hide() {
        visibility = GONE
        currentState = State.CONTENT
    }
    
    fun getCurrentState() = currentState
    
    fun isShowingContent() = currentState == State.CONTENT
}
