package com.mo.moplayer.ui.common

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ObjectAnimator
import android.animation.PropertyValuesHolder
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import androidx.recyclerview.widget.DefaultItemAnimator
import androidx.recyclerview.widget.RecyclerView

/**
 * Custom ItemAnimator for smooth, non-intrusive content updates.
 * 
 * Features:
 * - Fade-in with scale for new items
 * - Smooth crossfade for changed items
 * - Gentle slide for removed items
 * - No jarring movements or flashing
 */
open class SmoothItemAnimator : DefaultItemAnimator() {
    
    init {
        addDuration = 300
        removeDuration = 200
        moveDuration = 250
        changeDuration = 200
        supportsChangeAnimations = true
    }
    
    override fun animateAdd(holder: RecyclerView.ViewHolder): Boolean {
        val view = holder.itemView
        
        // Start invisible and slightly scaled down
        view.alpha = 0f
        view.scaleX = 0.9f
        view.scaleY = 0.9f
        view.translationY = 20f
        
        // Animate to visible with normal scale
        view.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .translationY(0f)
            .setDuration(addDuration)
            .setInterpolator(DecelerateInterpolator())
            .setListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    dispatchAddFinished(holder)
                    view.animate().setListener(null)
                }
                
                override fun onAnimationCancel(animation: Animator) {
                    clearAnimatedValues(view)
                }
            })
            .start()
        
        return true
    }
    
    override fun animateRemove(holder: RecyclerView.ViewHolder): Boolean {
        val view = holder.itemView
        
        // Fade out with slight scale down
        view.animate()
            .alpha(0f)
            .scaleX(0.9f)
            .scaleY(0.9f)
            .setDuration(removeDuration)
            .setInterpolator(DecelerateInterpolator())
            .setListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    dispatchRemoveFinished(holder)
                    view.animate().setListener(null)
                    clearAnimatedValues(view)
                }
                
                override fun onAnimationCancel(animation: Animator) {
                    clearAnimatedValues(view)
                }
            })
            .start()
        
        return true
    }
    
    override fun animateChange(
        oldHolder: RecyclerView.ViewHolder,
        newHolder: RecyclerView.ViewHolder,
        fromX: Int,
        fromY: Int,
        toX: Int,
        toY: Int
    ): Boolean {
        if (oldHolder === newHolder) {
            // Same holder - just animate the content change
            val view = oldHolder.itemView
            
            // Subtle pulse animation for content changes
            view.animate()
                .scaleX(1.02f)
                .scaleY(1.02f)
                .setDuration(changeDuration / 2)
                .setInterpolator(DecelerateInterpolator())
                .withEndAction {
                    view.animate()
                        .scaleX(1f)
                        .scaleY(1f)
                        .setDuration(changeDuration / 2)
                        .setInterpolator(DecelerateInterpolator())
                        .setListener(object : AnimatorListenerAdapter() {
                            override fun onAnimationEnd(animation: Animator) {
                                dispatchChangeFinished(oldHolder, true)
                                view.animate().setListener(null)
                            }
                        })
                        .start()
                }
                .start()
            
            return true
        }
        
        return super.animateChange(oldHolder, newHolder, fromX, fromY, toX, toY)
    }
    
    override fun animateMove(
        holder: RecyclerView.ViewHolder,
        fromX: Int,
        fromY: Int,
        toX: Int,
        toY: Int
    ): Boolean {
        val view = holder.itemView
        val deltaX = toX - fromX - view.translationX.toInt()
        val deltaY = toY - fromY - view.translationY.toInt()
        
        if (deltaX == 0 && deltaY == 0) {
            dispatchMoveFinished(holder)
            return false
        }
        
        view.translationX = -deltaX.toFloat()
        view.translationY = -deltaY.toFloat()
        
        view.animate()
            .translationX(0f)
            .translationY(0f)
            .setDuration(moveDuration)
            .setInterpolator(DecelerateInterpolator())
            .setListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    dispatchMoveFinished(holder)
                    view.animate().setListener(null)
                }
                
                override fun onAnimationCancel(animation: Animator) {
                    view.translationX = 0f
                    view.translationY = 0f
                }
            })
            .start()
        
        return true
    }
    
    override fun endAnimation(item: RecyclerView.ViewHolder) {
        item.itemView.animate().cancel()
        clearAnimatedValues(item.itemView)
        super.endAnimation(item)
    }
    
    override fun endAnimations() {
        super.endAnimations()
    }
    
    private fun clearAnimatedValues(view: View) {
        view.alpha = 1f
        view.scaleX = 1f
        view.scaleY = 1f
        view.translationX = 0f
        view.translationY = 0f
    }
}

/**
 * Specialized animator for horizontal content rows.
 * Optimized for sliding new items from the right.
 */
class HorizontalSmoothItemAnimator : SmoothItemAnimator() {
    
    override fun animateAdd(holder: RecyclerView.ViewHolder): Boolean {
        val view = holder.itemView
        
        // Slide in from right with fade
        view.alpha = 0f
        view.translationX = 100f
        view.scaleX = 0.95f
        view.scaleY = 0.95f
        
        view.animate()
            .alpha(1f)
            .translationX(0f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(addDuration)
            .setInterpolator(OvershootInterpolator(0.8f))
            .setListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    dispatchAddFinished(holder)
                    view.animate().setListener(null)
                }
            })
            .start()
        
        return true
    }
}

/**
 * Minimal animator for subtle updates that shouldn't distract the user.
 * Uses SmoothItemAnimator as base since DefaultItemAnimator cannot be extended in some cases.
 */
class SubtleItemAnimator : SmoothItemAnimator() {
    
    init {
        addDuration = 200
        removeDuration = 150
        moveDuration = 200
        changeDuration = 150
        supportsChangeAnimations = true
    }
    
    override fun animateAdd(holder: RecyclerView.ViewHolder): Boolean {
        val view = holder.itemView
        
        // Very subtle fade in only (no scale)
        view.alpha = 0f
        
        view.animate()
            .alpha(1f)
            .setDuration(addDuration)
            .setInterpolator(DecelerateInterpolator())
            .setListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    dispatchAddFinished(holder)
                    view.animate().setListener(null)
                }
            })
            .start()
        
        return true
    }
}
