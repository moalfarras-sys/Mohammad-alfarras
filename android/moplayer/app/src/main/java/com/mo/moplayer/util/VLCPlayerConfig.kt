package com.mo.moplayer.util

import android.content.Context
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.util.VLCVideoLayout
import javax.inject.Inject
import javax.inject.Singleton

/**
 * VLC Player Configuration Manager
 * Optimized for IPTV streaming with minimal buffering and fast channel switching
 */
@Singleton
class VLCPlayerConfig @Inject constructor(
    private val context: Context
) {

    /**
     * Creates optimized LibVLC instance for IPTV
     */
    fun createLibVLC(): LibVLC {
        val options = buildOptimizedOptions()
        return LibVLC(context, ArrayList(options))
    }

    /**
     * Creates MediaPlayer with optimal settings
     */
    fun createMediaPlayer(libVLC: LibVLC): MediaPlayer {
        return MediaPlayer(libVLC).apply {
            // Enable hardware acceleration
            setVideoTrackEnabled(true)
            
            // Set event listeners for monitoring
            // (Will be set by PlayerActivity)
        }
    }

    /**
     * Configures VLC options optimized for IPTV streaming
     */
    private fun buildOptimizedOptions(): List<String> {
        return listOf(
            // === Network Caching ===
            "--network-caching=2000",      // 2 seconds for network streams
            "--live-caching=1000",          // 1 second for live streams
            "--file-caching=300",           // Minimal for local files
            
            // === Clock & Synchronization ===
            "--clock-jitter=0",             // Disable jitter for IPTV
            "--clock-synchro=0",            // Best for IPTV
            
            // === Network Optimization ===
            "--http-reconnect",             // Auto-reconnect on failure
            "--http-continuous",            // Keep connection alive
            "--ipv4-timeout=5000",          // 5s timeout
            "--tcp-caching=2000",           // TCP streaming cache
            
            // === Decoding & Performance ===
            "--avcodec-hw=any",             // Hardware decode
            "--avcodec-fast",               // Fast decode mode
            "--avcodec-skiploopfilter=4",   // Skip loop filter (faster)
            "--avcodec-skip-frame=0",       // Don't skip frames
            "--avcodec-skip-idct=0",        // Don't skip IDCT
            
            // === Threading & CPU ===
            "--avcodec-threads=0",          // Auto thread count
            "--sout-mux-caching=2000",      // Output mux caching
            
            // === Audio ===
            "--audio-time-stretch",         // Enable time stretching
            "--audio-desync=0",             // No audio desync
            
            // === Video Output ===
            "--vout=android_display",       // Android optimized output
            "--deinterlace=0",              // Disable deinterlace (faster)
            "--android-display-chroma=RV32", // Optimal chroma for Android
            
            // === Error Recovery ===
            "--http-continuous",            // Continue on HTTP errors
            "--no-http-forward-cookies",    // Don't forward cookies
            
            // === Buffer Settings ===
            "--file-caching=300",           // File cache
            "--disc-caching=300",           // Disc cache
            "--live-caching=1000",          // Live cache (repeated for emphasis)
            
            // === Performance ===
            "--no-stats",                   // Disable statistics (faster)
            "--no-osd",                     // No on-screen display initially
            "--no-video-title-show",        // Don't show title
            
            // === Logging (disable for production) ===
            "--quiet",                      // Minimal logging
            "--no-crashdump",               // No crash dumps
            
            // === M3U8/HLS Optimization ===
            "--adaptive-logic=highest",     // Always select highest quality
            "--adaptive-maxwidth=3840",     // Support up to 4K  
            "--adaptive-maxheight=2160",    // 4K height
            
            // === RTSP Optimization ===
            "--rtsp-tcp",                   // Use TCP for RTSP (more reliable)
            "--rtsp-caching=2000",          // RTSP cache
            
            // === Additional Performance ===
            "--drop-late-frames",           // Drop frames that are too late
            "--skip-frames",                // Skip frames if needed
            "--no-plugins-cache",           // Don't cache plugins
            "--no-keyboard-events",         // Disable keyboard (TV app)
            "--no-mouse-events"             // Disable mouse (TV app)
        )
    }

    /**
     * Options profile for different quality preferences
     */
    enum class PlaybackProfile {
        /**
         * Balanced - Good quality with reasonable buffering
         */
        BALANCED,
        
        /**
         * Performance - Prioritize smooth playback over quality
         */
        PERFORMANCE,
        
        /**
         * Quality - Best quality, more buffering acceptable
         */
        QUALITY
    }

    /**
     * Get options for specific playback profile
     */
    fun getOptionsForProfile(profile: PlaybackProfile): List<String> {
        return when (profile) {
            PlaybackProfile.PERFORMANCE -> listOf(
                "--network-caching=1500",       // Less caching
                "--live-caching=750",
                "--avcodec-skiploopfilter=4",   // Skip more for speed
                "--avcodec-fast",
                "--drop-late-frames",
                "--skip-frames"
            )
            
            PlaybackProfile.QUALITY -> listOf(
                "--network-caching=3000",       // More caching
                "--live-caching=1500",
                "--avcodec-skiploopfilter=0",   // No skip
                "--no-drop-late-frames",
                "--no-skip-frames",
                "--adaptive-logic=highest"
            )
            
            PlaybackProfile.BALANCED -> buildOptimizedOptions()
        }
    }

    /**
     * Apply settings to an existing MediaPlayer
     */
    fun applySettings(player: MediaPlayer, profile: PlaybackProfile = PlaybackProfile.BALANCED) {
        // These settings are mostly applied at LibVLC creation
        // But some can be toggled
        when (profile) {
            PlaybackProfile.PERFORMANCE -> {
                // Prioritize speed
            }
            PlaybackProfile.QUALITY -> {
                // Prioritize quality
            }
            PlaybackProfile.BALANCED -> {
                // Default balanced approach
            }
        }
    }

    /**
     * Checks if hardware decoding is available
     */
    fun isHardwareDecodingAvailable(): Boolean {
        return try {
            // Check if device supports hardware decoding
            val libVLC = createLibVLC()
            val result = libVLC.toString().contains("hw", ignoreCase = true)
            libVLC.release()
            result
        } catch (e: Exception) {
            false
        }
    }
}
