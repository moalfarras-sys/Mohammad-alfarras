package com.mo.moplayer.ui.common

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import com.mo.moplayer.R
import com.mo.moplayer.util.TvNavigationManager

/**
 * Base activity for TV navigation support
 * Extends BaseThemedActivity and adds TV-specific navigation features
 */
abstract class BaseTvActivity : BaseThemedActivity() {

    private val TAG = "BaseTvActivity"

    /**
     * Unique screen ID for focus memory
     * Override this in child activities
     */
    protected open val screenId: String
        get() = this::class.java.simpleName

    /**
     * Whether to enable automatic focus tracking
     * DISABLED by default to avoid conflicts with existing focus systems
     */
    protected open val enableFocusTracking: Boolean = true

    /**
     * Whether to restore focus on resume
     * DISABLED by default to avoid conflicts with existing focus systems
     */
    protected open val restoreFocusOnResume: Boolean = true

    /**
     * Root view for focus management
     * Override if your layout has a specific root container
     */
    protected open fun getFocusRootView(): ViewGroup? {
        return findViewById(android.R.id.content)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // TvNavigationManager is initialized in MoPlayerApp
        // No automatic setup here to avoid conflicts
    }

    override fun onResume() {
        super.onResume()
        if (restoreFocusOnResume) {
            getFocusRootView()?.let { root ->
                TvNavigationManager.restoreFocusState(screenId, root)
            }
        }
    }

    override fun onPause() {
        if (enableFocusTracking) {
            val focused = currentFocus
            if (focused != null && focused.id != View.NO_ID) {
                TvNavigationManager.saveFocusState(screenId, focused.id)
            }
        }
        super.onPause()
    }

    /**
     * Handle TV-specific key events
     * Override this in child activities for custom key handling
     * 
     * NOTE: This is called from child activities that want to use the pattern.
     * Activities can also override onKeyDown directly if they prefer.
     */
    protected open fun handleTvKeyEvent(keyCode: Int, event: KeyEvent?): Boolean {
        return false
    }
    
    /**
     * Helper method for activities that want to combine handleTvKeyEvent with their own logic
     * Usage: return handleTvKey(keyCode, event) { myCustomLogic() }
     */
    protected fun handleTvKey(keyCode: Int, event: KeyEvent?, block: () -> Boolean): Boolean {
        return handleTvKeyEvent(keyCode, event) || block()
    }

    /**
     * Helper to setup navigation hints for views
     */
    protected fun setupNavigation(
        view: View,
        left: View? = null,
        right: View? = null,
        up: View? = null,
        down: View? = null
    ) {
        TvNavigationManager.setupNavigationHints(view, left, right, up, down)
    }

    /**
     * Find first focusable view in a container
     */
    protected fun findFirstFocusable(container: ViewGroup): View? {
        return TvNavigationManager.findFirstFocusableView(container)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (handleTvKeyEvent(keyCode, event)) return true
        return super.onKeyDown(keyCode, event)
    }

    override fun startActivity(intent: Intent?) {
        super.startActivity(intent)
        @Suppress("DEPRECATION")
        overridePendingTransition(R.anim.cinematic_enter, R.anim.cinematic_exit)
    }

    override fun startActivity(intent: Intent?, options: Bundle?) {
        super.startActivity(intent, options)
        @Suppress("DEPRECATION")
        overridePendingTransition(R.anim.cinematic_enter, R.anim.cinematic_exit)
    }

    override fun finish() {
        super.finish()
        @Suppress("DEPRECATION")
        overridePendingTransition(R.anim.cinematic_pop_enter, R.anim.cinematic_pop_exit)
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (TvNavigationManager.enableKeyLogging) {
            Log.d(TAG, "dispatchKeyEvent key=${event.keyCode} action=${event.action}")
        }
        return super.dispatchKeyEvent(event)
    }
}
