package com.mo.moplayer.ui.series

import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView

/**
 * Helper class for managing focus behavior on Android TV
 * Provides utilities for focus navigation, initial focus, and focus memory
 */
object TvFocusHelper {

    /**
     * Request focus on the first focusable view in a ViewGroup
     */
    fun requestInitialFocus(viewGroup: ViewGroup?) {
        viewGroup?.let {
            val firstFocusable = findFirstFocusableView(it)
            firstFocusable?.requestFocus()
        }
    }

    /**
     * Find the first focusable view in a ViewGroup hierarchy
     */
    private fun findFirstFocusableView(viewGroup: ViewGroup): View? {
        for (i in 0 until viewGroup.childCount) {
            val child = viewGroup.getChildAt(i)
            
            if (child.isFocusable) {
                return child
            }
            
            if (child is ViewGroup) {
                val focusable = findFirstFocusableView(child)
                if (focusable != null) {
                    return focusable
                }
            }
        }
        return null
    }

    /**
     * Setup focus memory for RecyclerView
     * Remembers the last focused item position
     */
    fun setupFocusMemory(recyclerView: RecyclerView) {
        var lastFocusedPosition = 0

        recyclerView.addOnChildAttachStateChangeListener(object : RecyclerView.OnChildAttachStateChangeListener {
            override fun onChildViewAttachedToWindow(view: View) {
                view.setOnFocusChangeListener { v, hasFocus ->
                    if (hasFocus) {
                        val position = recyclerView.getChildAdapterPosition(v)
                        if (position != RecyclerView.NO_POSITION) {
                            lastFocusedPosition = position
                        }
                    }
                }
            }

            override fun onChildViewDetachedFromWindow(view: View) {
                view.setOnFocusChangeListener(null)
            }
        })

        // Restore focus when RecyclerView regains focus
        recyclerView.setOnFocusChangeListener { v, hasFocus ->
            if (hasFocus && recyclerView.childCount > 0) {
                val viewHolder = recyclerView.findViewHolderForAdapterPosition(lastFocusedPosition)
                viewHolder?.itemView?.requestFocus()
            }
        }
    }

    /**
     * Setup smooth scrolling when focusing items in RecyclerView
     */
    fun setupSmoothScrollOnFocus(recyclerView: RecyclerView) {
        recyclerView.addOnChildAttachStateChangeListener(object : RecyclerView.OnChildAttachStateChangeListener {
            override fun onChildViewAttachedToWindow(view: View) {
                view.setOnFocusChangeListener { v, hasFocus ->
                    if (hasFocus) {
                        val position = recyclerView.getChildAdapterPosition(v)
                        if (position != RecyclerView.NO_POSITION) {
                            recyclerView.smoothScrollToPosition(position)
                        }
                    }
                }
            }

            override fun onChildViewDetachedFromWindow(view: View) {
                view.setOnFocusChangeListener(null)
            }
        })
    }

    /**
     * Enable/disable descendants focusability for a ViewGroup
     * Useful for managing focus during loading states
     */
    fun setFocusable(viewGroup: ViewGroup?, enabled: Boolean) {
        viewGroup?.descendantFocusability = if (enabled) {
            ViewGroup.FOCUS_AFTER_DESCENDANTS
        } else {
            ViewGroup.FOCUS_BLOCK_DESCENDANTS
        }
    }

    /**
     * Clear focus from all views in a ViewGroup
     */
    fun clearFocus(viewGroup: ViewGroup?) {
        viewGroup?.clearFocus()
        viewGroup?.let { clearFocusRecursive(it) }
    }

    private fun clearFocusRecursive(viewGroup: ViewGroup) {
        for (i in 0 until viewGroup.childCount) {
            val child = viewGroup.getChildAt(i)
            child.clearFocus()
            
            if (child is ViewGroup) {
                clearFocusRecursive(child)
            }
        }
    }

    /**
     * Check if the device is in TV mode
     */
    fun isTvDevice(context: android.content.Context): Boolean {
        val uiModeManager = context.getSystemService(android.content.Context.UI_MODE_SERVICE) 
            as android.app.UiModeManager
        return uiModeManager.currentModeType == android.content.res.Configuration.UI_MODE_TYPE_TELEVISION
    }

    /**
     * Setup D-Pad navigation hints
     * This helps the framework understand the navigation flow
     */
    fun setupNavigationHints(
        view: View,
        left: View? = null,
        right: View? = null,
        up: View? = null,
        down: View? = null
    ) {
        left?.let { view.nextFocusLeftId = it.id }
        right?.let { view.nextFocusRightId = it.id }
        up?.let { view.nextFocusUpId = it.id }
        down?.let { view.nextFocusDownId = it.id }
    }
}
