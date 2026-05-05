package com.mo.moplayer.ui.common.utils

import android.view.View

/**
 * Small helper to apply deterministic D-pad mappings.
 * It keeps Home/Settings navigation predictable on TV remotes.
 */
object FocusMapRegistry {

    fun mapHorizontalStrip(views: List<View>, wrap: Boolean = false, downTarget: View? = null, upTarget: View? = null) {
        if (views.isEmpty()) return
        views.forEachIndexed { index, view ->
            if (view.id == View.NO_ID) return@forEachIndexed

            val left = when {
                index > 0 -> views[index - 1]
                wrap -> views.last()
                else -> null
            }
            val right = when {
                index < views.lastIndex -> views[index + 1]
                wrap -> views.first()
                else -> null
            }

            left?.takeIf { it.id != View.NO_ID }?.let { view.nextFocusLeftId = it.id }
            right?.takeIf { it.id != View.NO_ID }?.let { view.nextFocusRightId = it.id }
            upTarget?.takeIf { it.id != View.NO_ID }?.let { view.nextFocusUpId = it.id }
            downTarget?.takeIf { it.id != View.NO_ID }?.let { view.nextFocusDownId = it.id }
        }
    }

    fun mapVerticalChain(views: List<View>, leftTarget: View? = null) {
        if (views.isEmpty()) return
        views.forEachIndexed { index, view ->
            if (view.id == View.NO_ID) return@forEachIndexed
            if (index > 0) {
                val up = views[index - 1]
                if (up.id != View.NO_ID) view.nextFocusUpId = up.id
            }
            if (index < views.lastIndex) {
                val down = views[index + 1]
                if (down.id != View.NO_ID) view.nextFocusDownId = down.id
            }
            leftTarget?.takeIf { it.id != View.NO_ID }?.let { view.nextFocusLeftId = it.id }
        }
    }
}
