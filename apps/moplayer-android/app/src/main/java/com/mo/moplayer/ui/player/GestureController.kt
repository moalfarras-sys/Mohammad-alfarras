package com.mo.moplayer.ui.player

import android.content.Context
import android.media.AudioManager
import android.provider.Settings
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.View
import android.view.Window
import android.view.WindowManager
import kotlin.math.abs

/**
 * Advanced gesture controller for video player.
 * Supports:
 * - Vertical swipe on left side: Brightness control
 * - Vertical swipe on right side: Volume control
 * - Horizontal swipe: Seek forward/backward
 * - Double tap sides: Quick seek
 * - Single tap: Toggle controls
 */
class GestureController(
    private val context: Context,
    private val window: Window,
    private val listener: GestureListener
) {
    
    interface GestureListener {
        fun onBrightnessChanged(brightness: Float, percentage: Int)
        fun onVolumeChanged(volume: Int, maxVolume: Int, percentage: Int)
        fun onSeek(seekAmount: Long)
        fun onDoubleTapSeek(forward: Boolean)
        fun onSingleTap()
        fun onGestureStart(type: GestureType)
        fun onGestureEnd()
    }
    
    enum class GestureType {
        NONE, BRIGHTNESS, VOLUME, SEEK
    }
    
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
    private var currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
    
    private var currentBrightness = window.attributes.screenBrightness
    
    private var gestureType = GestureType.NONE
    private var touchStartX = 0f
    private var touchStartY = 0f
    private var viewWidth = 0
    private var viewHeight = 0
    
    // Gesture sensitivity
    private val seekSensitivity = 150f // pixels per second
    private val volumeBrightnessSensitivity = 2.5f
    
    // Double tap detection
    private var lastTapTime = 0L
    private var lastTapX = 0f
    private val doubleTapTimeout = 300L
    
    private val gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
        override fun onSingleTapConfirmed(e: MotionEvent): Boolean {
            listener.onSingleTap()
            return true
        }
        
        override fun onDoubleTap(e: MotionEvent): Boolean {
            val isLeftSide = e.x < viewWidth / 2
            listener.onDoubleTapSeek(!isLeftSide)
            return true
        }
    })
    
    /**
     * Attach to a view for gesture handling
     */
    fun attachToView(view: View) {
        view.setOnTouchListener { v, event ->
            viewWidth = v.width
            viewHeight = v.height
            
            gestureDetector.onTouchEvent(event)
            handleTouch(event)
            true
        }
    }
    
    private fun handleTouch(event: MotionEvent): Boolean {
        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                touchStartX = event.x
                touchStartY = event.y
                gestureType = GestureType.NONE
                
                // Refresh current values
                currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
                currentBrightness = window.attributes.screenBrightness
                if (currentBrightness < 0) {
                    currentBrightness = try {
                        Settings.System.getInt(context.contentResolver, 
                            Settings.System.SCREEN_BRIGHTNESS) / 255f
                    } catch (e: Exception) {
                        0.5f
                    }
                }
            }
            
            MotionEvent.ACTION_MOVE -> {
                val deltaX = event.x - touchStartX
                val deltaY = event.y - touchStartY
                
                // Determine gesture type if not set
                if (gestureType == GestureType.NONE && (abs(deltaX) > 30 || abs(deltaY) > 30)) {
                    gestureType = when {
                        abs(deltaY) > abs(deltaX) && touchStartX < viewWidth / 3 -> {
                            listener.onGestureStart(GestureType.BRIGHTNESS)
                            GestureType.BRIGHTNESS
                        }
                        abs(deltaY) > abs(deltaX) && touchStartX > viewWidth * 2 / 3 -> {
                            listener.onGestureStart(GestureType.VOLUME)
                            GestureType.VOLUME
                        }
                        abs(deltaX) > abs(deltaY) -> {
                            listener.onGestureStart(GestureType.SEEK)
                            GestureType.SEEK
                        }
                        else -> GestureType.NONE
                    }
                }
                
                // Handle gesture
                when (gestureType) {
                    GestureType.BRIGHTNESS -> handleBrightnessGesture(deltaY)
                    GestureType.VOLUME -> handleVolumeGesture(deltaY)
                    GestureType.SEEK -> handleSeekGesture(deltaX)
                    GestureType.NONE -> { }
                }
            }
            
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                if (gestureType != GestureType.NONE) {
                    listener.onGestureEnd()
                }
                gestureType = GestureType.NONE
            }
        }
        return true
    }
    
    private fun handleBrightnessGesture(deltaY: Float) {
        // Negative deltaY means swipe up = increase brightness
        val change = -deltaY / viewHeight * volumeBrightnessSensitivity
        val newBrightness = (currentBrightness + change).coerceIn(0.01f, 1f)
        
        val layoutParams = window.attributes
        layoutParams.screenBrightness = newBrightness
        window.attributes = layoutParams
        
        val percentage = (newBrightness * 100).toInt()
        listener.onBrightnessChanged(newBrightness, percentage)
    }
    
    private fun handleVolumeGesture(deltaY: Float) {
        // Negative deltaY means swipe up = increase volume
        val change = -deltaY / viewHeight * maxVolume * volumeBrightnessSensitivity
        val newVolume = (currentVolume + change).toInt().coerceIn(0, maxVolume)
        
        if (newVolume != audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)) {
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, newVolume, 0)
        }
        
        val percentage = (newVolume * 100 / maxVolume)
        listener.onVolumeChanged(newVolume, maxVolume, percentage)
    }
    
    private fun handleSeekGesture(deltaX: Float) {
        // Calculate seek amount based on horizontal swipe distance
        val seekSeconds = (deltaX / seekSensitivity * 10).toLong() // 10 seconds per 150px
        listener.onSeek(seekSeconds * 1000) // Convert to milliseconds
    }
    
    /**
     * Set current volume (for initialization)
     */
    fun setCurrentVolume(volume: Int) {
        currentVolume = volume.coerceIn(0, maxVolume)
    }
    
    /**
     * Set current brightness (for initialization)
     */
    fun setCurrentBrightness(brightness: Float) {
        currentBrightness = brightness.coerceIn(0.01f, 1f)
    }
}
