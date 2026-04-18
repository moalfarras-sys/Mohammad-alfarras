package com.mo.moplayer.util

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import androidx.core.content.edit

/**
 * Centralized manager for TV remote navigation
 * Handles focus state, focus memory, and navigation patterns across the app
 */
object TvNavigationManager {

    private const val TAG = "TvNav"
    private const val PREFS_NAME = "tv_navigation_prefs"
    private const val KEY_PREFIX_FOCUS = "focus_"

    private lateinit var prefs: SharedPreferences

    // public toggle for extra key logging during debugging
    var enableKeyLogging: Boolean = false

    /**
     * Initialize the navigation manager
     */
    fun init(context: Context) {
        if (!::prefs.isInitialized) {
            prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            Log.d(TAG, "Initialized TvNavigationManager with prefs")
        }
    }

    private fun ensureInitializedFromView(rootView: View?) {
        try {
            if (!::prefs.isInitialized && rootView != null) {
                init(rootView.context.applicationContext)
            }
        } catch (t: Throwable) {
            Log.w(TAG, "ensureInitializedFromView failed: ${t.message}")
        }
    }

    /**
     * Save the focused view ID for a specific screen
     */
    fun saveFocusState(screenId: String, viewId: Int) {
        if (viewId == View.NO_ID) return
        if (!::prefs.isInitialized) return
        prefs.edit {
            putInt("$KEY_PREFIX_FOCUS$screenId", viewId)
        }
        Log.d(TAG, "Saved focus for $screenId -> $viewId")
    }

    /**
     * Restore focus to the last focused view for a screen
     * @return true if focus was successfully restored
     */
    fun restoreFocusState(screenId: String, rootView: View): Boolean {
        ensureInitializedFromView(rootView)
        if (!::prefs.isInitialized) return false
        val viewId = prefs.getInt("$KEY_PREFIX_FOCUS$screenId", View.NO_ID)
        if (viewId != View.NO_ID) {
            val view = rootView.findViewById<View>(viewId)
            if (view != null && view.isFocusable) {
                val requested = view.requestFocus()
                Log.d(TAG, "Restored focus for $screenId to id=$viewId success=$requested")
                return requested
            }
        }
        return false
    }

    /**
     * Clear focus state for a screen
     */
    fun clearFocusState(screenId: String) {
        if (!::prefs.isInitialized) return
        prefs.edit {
            remove("$KEY_PREFIX_FOCUS$screenId")
        }
        Log.d(TAG, "Cleared focus state for $screenId")
    }

    /**
     * Setup navigation hints for a view
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

    /**
     * Enable/disable focus for a view hierarchy
     */
    fun setFocusable(viewGroup: ViewGroup, enabled: Boolean) {
        viewGroup.descendantFocusability = if (enabled) {
            ViewGroup.FOCUS_AFTER_DESCENDANTS
        } else {
            ViewGroup.FOCUS_BLOCK_DESCENDANTS
        }
    }

    /**
     * Find the first focusable view in a container
     */
    fun findFirstFocusableView(container: ViewGroup): View? {
        for (i in 0 until container.childCount) {
            val child = container.getChildAt(i)
            if (child.isFocusable && child.visibility == View.VISIBLE) {
                return child
            }
            if (child is ViewGroup) {
                val focusable = findFirstFocusableView(child)
                if (focusable != null) return focusable
            }
        }
        return null
    }

    /**
     * Setup automatic focus chain for a container
     * This will try to link focusable views in a logical order
     */
    fun setupAutomaticFocusChain(container: ViewGroup) {
        val focusableViews = mutableListOf<View>()
        collectFocusableViews(container, focusableViews)
        // For now, we'll let Android handle the default focus chain
        // This can be enhanced later with more intelligent ordering
    }

    private fun collectFocusableViews(viewGroup: ViewGroup, result: MutableList<View>) {
        for (i in 0 until viewGroup.childCount) {
            val child = viewGroup.getChildAt(i)
            if (child.isFocusable) {
                result.add(child)
            }
            if (child is ViewGroup) {
                collectFocusableViews(child, result)
            }
        }
    }

    /**
     * Handle global key events that should work across all screens
     * If rootView is provided, manager can attempt to recover missing focus.
     */
    fun handleGlobalKeyEvent(keyCode: Int, event: KeyEvent, rootView: View? = null): Boolean {
        // If a DPAD key arrives but nothing is focused, try to restore initial focus
        try {
            if ((keyCode == KeyEvent.KEYCODE_DPAD_UP || keyCode == KeyEvent.KEYCODE_DPAD_DOWN ||
                        keyCode == KeyEvent.KEYCODE_DPAD_LEFT || keyCode == KeyEvent.KEYCODE_DPAD_RIGHT) && rootView != null
            ) {
                val focused = rootView.findFocus()
                if (focused == null) {
                    if (rootView is ViewGroup) {
                        requestInitialFocus(rootView.javaClass.simpleName, rootView)
                        Log.d(TAG, "Recovered focus on DPAD key for view ${rootView.javaClass.simpleName}")
                        return true
                    }
                }
            }
        } catch (t: Throwable) {
            Log.w(TAG, "handleGlobalKeyEvent pre-check failed: ${t.message}")
        }

        // Add global shortcuts/handlers here (e.g., MENU/SEARCH/PLAY_PAUSE)
        return when (keyCode) {
            KeyEvent.KEYCODE_MENU -> {
                // Let activities handle menu by default
                false
            }
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
            KeyEvent.KEYCODE_MEDIA_PLAY,
            KeyEvent.KEYCODE_MEDIA_PAUSE,
            KeyEvent.KEYCODE_MEDIA_STOP -> {
                // Let player/activity handle these
                false
            }
            else -> false
        }
    }

    /**
     * Request focus on first available view or restore last focused
     */
    fun requestInitialFocus(screenId: String, rootView: ViewGroup) {
        ensureInitializedFromView(rootView)
        // Try to restore last focus first
        val restored = try {
            restoreFocusState(screenId, rootView)
        } catch (t: Throwable) {
            Log.w(TAG, "restoreFocusState failed: ${t.message}")
            false
        }

        if (!restored) {
            val firstFocusable = findFirstFocusableView(rootView)
            if (firstFocusable != null) {
                val ok = firstFocusable.requestFocus()
                Log.d(TAG, "Requested initial focus for $screenId -> view=${firstFocusable.id} success=$ok")
            } else {
                Log.d(TAG, "No focusable view found to request initial focus for $screenId")
            }
        }
    }

}
