package com.mo.moplayer.ui.series

import android.content.Context
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.view.SurfaceView
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.util.VLCVideoLayout

/**
 * Manages video preview playback for episode previews
 * Features:
 * - Auto-play preview after focus delay
 * - Automatic stop after preview duration
 * - Memory management
 * - Error handling
 */
class VideoPreviewManager(private val context: Context) {

    private var libVLC: LibVLC? = null
    private var mediaPlayer: MediaPlayer? = null
    private val handler = Handler(Looper.getMainLooper())
    private var previewRunnable: Runnable? = null
    private var stopRunnable: Runnable? = null

    companion object {
        private const val PREVIEW_DELAY_MS = 2000L // 2 seconds delay before starting preview
        private const val PREVIEW_DURATION_MS = 15000L // 15 seconds preview duration
        private const val PREVIEW_VOLUME = 0 // Muted by default
    }

    interface PreviewListener {
        fun onPreviewStarted()
        fun onPreviewStopped()
        fun onPreviewError(error: String)
    }

    private var listener: PreviewListener? = null

    fun setListener(listener: PreviewListener?) {
        this.listener = listener
    }

    /**
     * Initialize VLC player if not already initialized
     */
    private fun initializePlayer() {
        if (libVLC == null) {
            try {
                val options = arrayListOf(
                    "--no-audio", // No audio for preview
                    "--no-stats",
                    "--network-caching=1000",
                    "--live-caching=1000"
                )
                libVLC = LibVLC(context, options)
                mediaPlayer = MediaPlayer(libVLC)
                mediaPlayer?.setVolume(PREVIEW_VOLUME)
            } catch (e: Exception) {
                listener?.onPreviewError("Failed to initialize player: ${e.message}")
            }
        }
    }

    /**
     * Schedule a preview to start after delay
     */
    fun schedulePreview(previewUrl: String?, surfaceView: SurfaceView?) {
        cancelScheduledPreview()

        if (previewUrl.isNullOrEmpty() || surfaceView == null) {
            return
        }

        previewRunnable = Runnable {
            startPreview(previewUrl, surfaceView)
        }

        handler.postDelayed(previewRunnable!!, PREVIEW_DELAY_MS)
    }

    /**
     * Start playing preview immediately
     */
    private fun startPreview(previewUrl: String, surfaceView: SurfaceView) {
        try {
            initializePlayer()

            mediaPlayer?.let { player ->
                // Attach surface
                player.vlcVout.apply {
                    setVideoView(surfaceView)
                    attachViews()
                }

                // Create media and play
                val media = Media(libVLC, Uri.parse(previewUrl))
                player.media = media
                player.play()

                listener?.onPreviewStarted()

                // Schedule auto-stop after preview duration
                stopRunnable = Runnable {
                    stopPreview()
                }
                handler.postDelayed(stopRunnable!!, PREVIEW_DURATION_MS)
            }
        } catch (e: Exception) {
            listener?.onPreviewError("Preview playback error: ${e.message}")
        }
    }

    /**
     * Stop current preview
     */
    fun stopPreview() {
        cancelScheduledPreview()
        
        mediaPlayer?.let { player ->
            if (player.isPlaying) {
                player.stop()
            }
            player.vlcVout.detachViews()
        }

        listener?.onPreviewStopped()
    }

    /**
     * Cancel any scheduled preview
     */
    fun cancelScheduledPreview() {
        previewRunnable?.let { handler.removeCallbacks(it) }
        stopRunnable?.let { handler.removeCallbacks(it) }
        previewRunnable = null
        stopRunnable = null
    }

    /**
     * Toggle preview audio (mute/unmute)
     */
    fun toggleAudio(): Boolean {
        mediaPlayer?.let { player ->
            val currentVolume = player.volume
            val newVolume = if (currentVolume == 0) 100 else 0
            player.setVolume(newVolume)
            return newVolume > 0
        }
        return false
    }

    /**
     * Check if preview is currently playing
     */
    fun isPlaying(): Boolean {
        return mediaPlayer?.isPlaying ?: false
    }

    /**
     * Release all resources
     * Must be called when the manager is no longer needed
     */
    fun release() {
        stopPreview()
        
        mediaPlayer?.release()
        mediaPlayer = null
        
        libVLC?.release()
        libVLC = null
        
        handler.removeCallbacksAndMessages(null)
        listener = null
    }

    /**
     * Pause current preview (without releasing resources)
     */
    fun pause() {
        mediaPlayer?.pause()
    }

    /**
     * Resume paused preview
     */
    fun resume() {
        mediaPlayer?.play()
    }
}
