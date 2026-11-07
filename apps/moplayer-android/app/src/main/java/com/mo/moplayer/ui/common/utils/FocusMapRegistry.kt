package com.mo.moplayer.ui.common.utils

import android.view.View

/**
 * Small helper to apply deterministic D-pad mappings.
 * It keeps Home/Settings navigation predictable on TV remotes.
 */
object FocusMapRegistry {

    fun mapHorizontalStrip(views: List<View>, wrap: Boolean = false, downTarget: View? = null, upTarget: View? = null) {
        if (views.isEmpty()) return
        val rtl = views.first().resources.configuration.layoutDirection == View.LAYOUT_DIRECTION_RTL
        views.forEachIndexed { index, view ->
            if (view.id == View.NO_ID) return@forEachIndexed

            val previous = when {
                index > 0 -> views[index - 1]
                wrap -> views.last()
                else -> null
            }
            val next = when {
                index < views.lastIndex -> views[index + 1]
                wrap -> views.first()
                else -> null
            }

            val left = if (rtl) next else previous
            val right = if (rtl) previous else next
            view.nextFocusLeftId = left?.id ?: View.NO_ID
            view.nextFocusRightId = right?.id ?: View.NO_ID
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
