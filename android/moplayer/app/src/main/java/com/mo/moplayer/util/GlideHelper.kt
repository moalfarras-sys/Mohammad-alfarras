package com.mo.moplayer.util

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper

object GlideHelper {
    /**
     * Checks if the context is valid for Glide to start a load.
     * Returns false if the activity is destroyed or finishing.
     */
    fun isValidContextForGlide(context: Context?): Boolean {
        if (context == null) {
            return false
        }
        if (context is Activity) {
            return !context.isDestroyed && !context.isFinishing
        }
        if (context is ContextWrapper) {
            return isValidContextForGlide(context.baseContext)
        }
        return true
    }
}
