package com.mo.moplayer.ui.livetv

import android.content.Context
import android.util.Log
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

/**
 * Safe LinearLayoutManager that handles view hierarchy inconsistencies
 * during rapid updates without crashing.
 * 
 * This layout manager wraps critical RecyclerView operations with exception
 * handling to prevent crashes from:
 * - "view is not a child, cannot hide" errors
 * - IndexOutOfBoundsException during layout
 * - View hierarchy inconsistencies during rapid channel switching
 */
class SafeLinearLayoutManager(context: Context) : LinearLayoutManager(context) {
    
    companion object {
        private const val TAG = "SafeLayoutManager"
    }
    
    override fun onLayoutChildren(recycler: RecyclerView.Recycler?, state: RecyclerView.State?) {
        try {
            super.onLayoutChildren(recycler, state)
        } catch (e: IllegalArgumentException) {
            Log.e(TAG, "View hierarchy error during layout, recovering gracefully", e)
            // Don't crash - let RecyclerView retry on next frame
        } catch (e: IndexOutOfBoundsException) {
            Log.e(TAG, "Index out of bounds during layout, recovering gracefully", e)
            // Don't crash - the adapter will fix the state on next update
        } catch (e: IllegalStateException) {
            Log.e(TAG, "Illegal state during layout, recovering gracefully", e)
            // Don't crash - RecyclerView will stabilize on next frame
        }
    }
    
    override fun scrollVerticallyBy(
        dy: Int,
        recycler: RecyclerView.Recycler?,
        state: RecyclerView.State?
    ): Int {
        return try {
            super.scrollVerticallyBy(dy, recycler, state)
        } catch (e: Exception) {
            Log.e(TAG, "Error during scroll, recovering gracefully", e)
            0 // Return 0 scroll distance on error
        }
    }
    
    override fun scrollToPosition(position: Int) {
        try {
            super.scrollToPosition(position)
        } catch (e: Exception) {
            Log.e(TAG, "Error scrolling to position $position, recovering gracefully", e)
        }
    }
    
    override fun smoothScrollToPosition(
        recyclerView: RecyclerView?,
        state: RecyclerView.State?,
        position: Int
    ) {
        try {
            super.smoothScrollToPosition(recyclerView, state, position)
        } catch (e: Exception) {
            Log.e(TAG, "Error smooth scrolling to position $position, recovering gracefully", e)
        }
    }
}
