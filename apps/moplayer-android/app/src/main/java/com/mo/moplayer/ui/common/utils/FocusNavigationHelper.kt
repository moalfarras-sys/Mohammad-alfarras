package com.mo.moplayer.ui.common.utils

import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView

/**
 * Premium Focus Navigation Helper for Android TV
 * Optimizes D-pad navigation with smooth transitions and focus memory
 */
object FocusNavigationHelper {

    /**
     * Sets up optimized focus navigation for a RecyclerView
     * - Enables focus memory (remembers last focused item)
     * - Smooth scrolling to focused items
     * - Prevents focus traps
     */
    fun setupRecyclerViewFocus(
        recyclerView: RecyclerView,
        rememberLastFocus: Boolean = true
    ) {
        recyclerView.apply {
            // Enable focus for TV navigation
            isFocusable = false // RecyclerView itself shouldn't grab focus
            descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS

            // Preserve focus position when returning to this view
            if (rememberLastFocus) {
                setPreserveFocusAfterLayout(true)
            }

            // Smooth scroll to focused items
            addOnScrollListener(object : RecyclerView.OnScrollListener() {
                override fun onScrollStateChanged(recyclerView: RecyclerView, newState: Int) {
                    super.onScrollStateChanged(recyclerView, newState)
                    
                    // When scrolling stops, ensure focused item is fully visible
                    if (newState == RecyclerView.SCROLL_STATE_IDLE) {
                        val focusedChild = recyclerView.focusedChild
                        focusedChild?.let {
                            val position = recyclerView.getChildAdapterPosition(it)
                            if (position != RecyclerView.NO_POSITION) {
                                recyclerView.smoothScrollToPosition(position)
                            }
                        }
                    }
                }
            })
        }
    }

    /**
     * Makes a view group optimized for TV focus navigation
     */
    fun optimizeViewGroupForTv(viewGroup: ViewGroup) {
        viewGroup.apply {
            descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS
            isFocusable = false
            
            // Ensure all focusable children are accessible
            isMotionEventSplittingEnabled = false
        }
    }

    /**
     * Requests focus on the first focusable view in a view hierarchy
     */
    fun requestFocusOnFirstFocusable(view: View): Boolean {
        when {
            view.isFocusable && view.visibility == View.VISIBLE -> {
                return view.requestFocus()
            }
            view is ViewGroup -> {
                for (i in 0 until view.childCount) {
                    if (requestFocusOnFirstFocusable(view.getChildAt(i))) {
                        return true
                    }
                }
            }
        }
        return false
    }

    /**
     * Sets up a view to scale smoothly on focus (TV optimization)
     */
    fun setupFocusScale(
        view: View,
        scale: Float = 1.08f,
        duration: Long = 200L
    ) {
        view.onFocusChangeListener = View.OnFocusChangeListener { v, hasFocus ->
            if (hasFocus) {
                v.animate()
                    .scaleX(scale)
                    .scaleY(scale)
                    .translationZ(16f)
                    .setDuration(duration)
                    .start()
            } else {
                v.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .translationZ(0f)
                    .setDuration(duration * 0.75f.toLong())
                    .start()
            }
        }
    }

    /**
     * Finds and returns the next focusable view in the specified direction
     */
    fun findNextFocusable(
        currentView: View,
        direction: Int, // View.FOCUS_LEFT, FOCUS_RIGHT, FOCUS_UP, FOCUS_DOWN
        rootView: ViewGroup
    ): View? {
        val nextFocus = currentView.focusSearch(direction)
        
        // Ensure the next focus is within our root view
        return if (nextFocus != null && isDescendantOf(nextFocus, rootView)) {
            nextFocus
        } else {
            null
        }
    }

    /**
     * Checks if a view is a descendant of a parent view
     */
    private fun isDescendantOf(view: View, parent: ViewGroup): Boolean {
        var currentParent = view.parent
        while (currentParent != null) {
            if (currentParent == parent) return true
            currentParent = currentParent.parent
        }
        return false
    }

    /**
     * Sets up a circular focus navigation (wraps around at edges)
     */
    fun setupCircularFocus(views: List<View>) {
        if (views.isEmpty()) return

        views.forEachIndexed { index, view ->
            view.apply {
                // Set next focus IDs
                nextFocusLeftId = views[(index - 1 + views.size) % views.size].id
                nextFocusRightId = views[(index + 1) % views.size].id
            }
        }
    }

    /**
     * Restores focus to the last focused view, or requests focus on first focusable
     */
    fun restoreFocus(rootView: ViewGroup, lastFocusedViewId: Int?): Boolean {
        lastFocusedViewId?.let { id ->
            val lastFocusedView = rootView.findViewById<View>(id)
            if (lastFocusedView?.isFocusable == true && lastFocusedView.visibility == View.VISIBLE) {
                return lastFocusedView.requestFocus()
            }
        }
        
        // Fallback: focus on first focusable
        return requestFocusOnFirstFocusable(rootView)
    }
}
