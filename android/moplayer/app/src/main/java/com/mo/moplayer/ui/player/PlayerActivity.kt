package com.mo.moplayer.ui.player

import android.app.PictureInPictureParams
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Rational
import android.view.KeyEvent
import android.view.View
import android.widget.SeekBar
import android.widget.Toast
import com.mo.moplayer.R
import com.mo.moplayer.databinding.ActivityPlayerBinding
import com.mo.moplayer.data.repository.WatchHistoryRepository
import com.mo.moplayer.ui.common.BaseTvActivity
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

@AndroidEntryPoint
class PlayerActivity : BaseTvActivity() {

    companion object {
        const val EXTRA_STREAM_URL = "stream_url"
        const val EXTRA_TITLE = "title"
        const val EXTRA_TYPE = "type"
        const val EXTRA_CONTENT_ID = "content_id"
        const val EXTRA_POSTER_URL = "poster_url"
        const val EXTRA_RESUME_POSITION = "resume_position"
        // For series episodes
        const val EXTRA_SERIES_ID = "series_id"
        const val EXTRA_SERIES_NAME = "series_name"
        const val EXTRA_SEASON_NUMBER = "season_number"
        const val EXTRA_EPISODE_NUMBER = "episode_number"
        
        private const val PROGRESS_SAVE_INTERVAL = 10000L // Save every 10 seconds
    }

    @Inject
    lateinit var watchHistoryRepository: WatchHistoryRepository
    
    @Inject
    lateinit var playerPreferences: com.mo.moplayer.util.PlayerPreferences
    
    private val activityScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private lateinit var binding: ActivityPlayerBinding

    private var libVLC: LibVLC? = null
    private var mediaPlayer: MediaPlayer? = null

    private val handler = Handler(Looper.getMainLooper())
    private var controlsVisible = false
    private var seeking = false
    private var lastFocusedViewId: Int = View.NO_ID

    private val CONTROLS_TIMEOUT = 5000L
    private val SEEK_AMOUNT = 10000L // 10 seconds

    private var streamUrl: String = ""
    private var title: String = ""
    private var contentType: String = ""
    private var contentId: String = ""
    private var posterUrl: String? = null
    private var resumePosition: Long = 0
    
    // For series episodes
    private var seriesId: String? = null
    private var seriesName: String? = null
    private var seasonNumber: Int? = null
    private var episodeNumber: Int? = null
    
    // Cached settings (loaded from PlayerPreferences early)
    private var vlcBufferMs: Int = com.mo.moplayer.util.PlayerPreferences.BUFFER_MEDIUM
    private var vlcHardwareAccelerationEnabled: Boolean = true
    private var vlcPlaybackProfile: Int = com.mo.moplayer.util.PlayerPreferences.PLAYBACK_PROFILE_BALANCED
    private var pipModeEnabled: Boolean = false  // Default OFF for TV compatibility
    
    // Throttle UI updates from VLC buffering callbacks
    private val BUFFERING_UI_THROTTLE_MS = 250L
    private var lastBufferingUiVisible: Boolean? = null
    private var lastBufferingUiUpdateAtMs: Long = 0L

    private val isLiveStream: Boolean
        get() = contentType.equals("CHANNEL", ignoreCase = true) ||
            contentType.equals("LIVE", ignoreCase = true)

    private var liveRetryCount = 0
    private val LIVE_MAX_RETRIES = 5  // Increased from 3 for better resilience
    private var lastRetryTime = 0L
    private val RETRY_BACKOFF_MS = 2000L  // Base backoff time
    
    // PIP (Picture-in-Picture) support
    private var isInPipMode = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPlayerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        streamUrl = intent.getStringExtra(EXTRA_STREAM_URL) ?: ""
        title = intent.getStringExtra(EXTRA_TITLE) ?: ""
        contentType = intent.getStringExtra(EXTRA_TYPE) ?: "MOVIE"
        contentId = intent.getStringExtra(EXTRA_CONTENT_ID) ?: streamUrl
        posterUrl = intent.getStringExtra(EXTRA_POSTER_URL)
        resumePosition = intent.getLongExtra(EXTRA_RESUME_POSITION, 0)
        
        // Series episode extras
        seriesId = intent.getStringExtra(EXTRA_SERIES_ID)
        seriesName = intent.getStringExtra(EXTRA_SERIES_NAME)
        seasonNumber = intent.getIntExtra(EXTRA_SEASON_NUMBER, -1).takeIf { it >= 0 }
        episodeNumber = intent.getIntExtra(EXTRA_EPISODE_NUMBER, -1).takeIf { it >= 0 }

        // Check if should use external player
        activityScope.launch {
            if (!playerPreferences.shouldUseInternalPlayer()) {
                launchExternalPlayer()
                finish()
                return@launch
            }
            
            // Continue with internal VLC player
            if (streamUrl.isEmpty()) {
                Toast.makeText(this@PlayerActivity, getString(R.string.player_no_stream_url), Toast.LENGTH_SHORT).show()
                finish()
                return@launch
            }
            
            loadPlayerSettings()

            binding.tvTitle.text = title
            binding.tvSubtitle.text = contentType
            
            // FIX: Load saved position BEFORE initVLC to avoid race condition.
            // Previously this was fire-and-forget, so the player could start before
            // the position was loaded from Room.
            if (resumePosition == 0L && contentId.isNotEmpty()) {
                resumePosition = loadSavedPositionSuspend()
            }

            setupControls()
            binding.loadingOverlay.visibility = View.VISIBLE
            binding.root.post {
                initVLC()
                playStream()
                startClockUpdate()
                startProgressSaving()
                showControls()
            }
        }
    }
    
    private fun launchExternalPlayer() {
        activityScope.launch {
            try {
                val intent = playerPreferences.createExternalPlayerIntent(streamUrl, title)
                if (intent != null) {
                    // Add resume position if available
                    if (resumePosition > 0) {
                        intent.putExtra("position", resumePosition.toInt())
                    }
                    startActivity(intent)
                } else {
                    Toast.makeText(
                        this@PlayerActivity,
                        getString(R.string.player_external_not_available),
                        Toast.LENGTH_SHORT
                    ).show()
                    // Don't finish, fallback to internal player
                    initInternalPlayer()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@PlayerActivity,
                    getString(R.string.player_external_launch_failed, e.message ?: ""),
                    Toast.LENGTH_SHORT
                ).show()
                // Don't finish, fallback to internal player
                initInternalPlayer()
            }
        }
    }
    
    private suspend fun initInternalPlayer() {
        binding.tvTitle.text = title
        binding.tvSubtitle.text = contentType
        
        if (resumePosition == 0L && contentId.isNotEmpty()) {
            resumePosition = loadSavedPositionSuspend()
        }

        loadPlayerSettings()
        setupControls()
        binding.loadingOverlay.visibility = View.VISIBLE
        binding.root.post {
            initVLC()
            playStream()
            startClockUpdate()
            startProgressSaving()
            showControls()
        }
    }
    
    /**
     * Load saved watch position from Room. Returns the position in ms, or 0 if none.
     * This is a suspend function so it completes before initVLC() is called.
     */
    private suspend fun loadSavedPositionSuspend(): Long {
        return try {
            val history = watchHistoryRepository.getWatchHistory(contentId)
            if (history != null && !history.completed) history.positionMs else 0L
        } catch (e: Exception) {
            0L
        }
    }

    private suspend fun loadPlayerSettings() {
        vlcBufferMs = playerPreferences.bufferSize.first()
        vlcHardwareAccelerationEnabled = playerPreferences.hardwareAcceleration.first()
        vlcPlaybackProfile = playerPreferences.playbackProfile.first()
        pipModeEnabled = playerPreferences.pipModeEnabled.first()
    }
    
    private fun startProgressSaving() {
        handler.post(saveProgressRunnable)
    }
    
    private val saveProgressRunnable = object : Runnable {
        override fun run() {
            saveCurrentProgress()
            handler.postDelayed(this, PROGRESS_SAVE_INTERVAL)
        }
    }
    
    private fun saveCurrentProgress() {
        val currentPosition = mediaPlayer?.time ?: 0
        val duration = mediaPlayer?.length ?: 0
        
        // Only save if we have valid content and have played for at least 5 seconds
        if (contentId.isNotEmpty() && currentPosition > 5000 && duration > 0) {
            activityScope.launch {
                try {
                    watchHistoryRepository.updateWatchProgress(
                        contentId = contentId,
                        type = contentType,
                        name = title,
                        posterUrl = posterUrl,
                        positionMs = currentPosition,
                        durationMs = duration,
                        seasonNumber = seasonNumber,
                        episodeNumber = episodeNumber,
                        seriesId = seriesId,
                        seriesName = seriesName
                    )
                } catch (e: Exception) {
                    // Ignore errors
                }
            }
        }
    }

    private fun initVLC() {
        // Multi-strategy initialization for x86 emulator compatibility
        val cachingMs = vlcBufferMs.coerceAtLeast(500)
        
        // Dynamic thread count based on device CPU cores for optimal 4K/8K performance
        val cpuCores = Runtime.getRuntime().availableProcessors()
        val dynamicThreadCount = (cpuCores * 2).coerceIn(8, 16)  // 8-16 threads for 4K/8K
        
        val codecOption = if (vlcHardwareAccelerationEnabled) {
            "--codec=mediacodec_ndk,mediacodec_jni,all"
        } else {
            "--codec=all"
        }

        data class Quad(val a: String, val b: String, val c: String, val d: String)
        val (dropLateFramesOpt, skipFramesOpt, avcodecSkipFrameOpt, avcodecSkipIdctOpt) = when (vlcPlaybackProfile) {
            com.mo.moplayer.util.PlayerPreferences.PLAYBACK_PROFILE_QUALITY -> Quad(
                "--no-drop-late-frames",
                "--no-skip-frames",
                "--avcodec-skip-frame=-1",
                "--avcodec-skip-idct=-1"
            )
            com.mo.moplayer.util.PlayerPreferences.PLAYBACK_PROFILE_PERFORMANCE -> Quad(
                "--drop-late-frames",
                "--skip-frames",
                "--avcodec-skip-frame=1",
                "--avcodec-skip-idct=1"
            )
            else -> Quad(
                "--drop-late-frames",
                "--skip-frames",
                "--avcodec-skip-frame=0",
                "--avcodec-skip-idct=0"
            )
        }

        fun optionsOf(vararg opts: String): ArrayList<String> {
            return arrayListOf<String>().apply {
                add("--quiet")
                add("--no-stats")
                add("--no-video-title-show")
                addAll(opts)
            }
        }

        val strategies = listOf(
            // Strategy 1: Minimal options (most compatible)
            Pair("Minimal", optionsOf(
                "--aout=opensles",
                dropLateFramesOpt,
                skipFramesOpt,
                avcodecSkipFrameOpt,
                avcodecSkipIdctOpt
            )),
            // Strategy 2: Basic with caching
            Pair("Basic", optionsOf(
                "--aout=opensles",
                "--audio-time-stretch",
                dropLateFramesOpt,
                skipFramesOpt,
                avcodecSkipFrameOpt,
                avcodecSkipIdctOpt,
                "--network-caching=$cachingMs",
                "--live-caching=$cachingMs",
                "--file-caching=$cachingMs"
            )),
            // Strategy 3: Full options with 4K/8K support (for real devices)
            Pair("Full", optionsOf(
                "--aout=opensles",
                "--audio-time-stretch",
                "--network-caching=$cachingMs",
                "--live-caching=$cachingMs",
                "--file-caching=$cachingMs",
                codecOption,
                dropLateFramesOpt,
                skipFramesOpt,
                avcodecSkipFrameOpt,
                avcodecSkipIdctOpt,
                "--avcodec-fast",
                "--avcodec-threads=$dynamicThreadCount",  // Dynamic threads for 4K/8K
                "--androidwindow-chroma=RV32"
            ))
        )

        var lastException: Exception? = null
        
        for ((strategyName, options) in strategies) {
            try {
                android.util.Log.d("PlayerActivity", "Trying VLC initialization strategy: $strategyName")
                libVLC = LibVLC(this, options)
                mediaPlayer = MediaPlayer(libVLC)
                mediaPlayer?.attachViews(binding.vlcVideoLayout, null, false, false)

                mediaPlayer?.setEventListener { event ->
                    runOnUiThread {
                        when (event.type) {
                            MediaPlayer.Event.Playing -> {
                                setLoadingOverlayVisible(false)
                                binding.errorOverlay.visibility = View.GONE
                                binding.btnPlayPause.setImageResource(R.drawable.ic_pause)
                                startProgressUpdate()
                                liveRetryCount = 0
                            }
                            MediaPlayer.Event.Paused -> {
                                binding.btnPlayPause.setImageResource(R.drawable.ic_play)
                            }
                            MediaPlayer.Event.Buffering -> {
                                setLoadingOverlayVisible(event.buffering < 100f)
                            }
                            MediaPlayer.Event.EndReached -> {
                                if (isLiveStream) {
                                    handleLiveStreamEnded()
                                } else {
                                    finish()
                                }
                            }
                            MediaPlayer.Event.EncounteredError -> {
                                setLoadingOverlayVisible(false)
                                if (isLiveStream) {
                                    handleLiveStreamError()
                                } else {
                                    binding.errorOverlay.visibility = View.VISIBLE
                                }
                            }
                            MediaPlayer.Event.TimeChanged -> {
                                if (!seeking) {
                                    updateProgress()
                                }
                            }
                            MediaPlayer.Event.LengthChanged -> {
                                updateDuration()
                            }
                        }
                    }
                }
                
                android.util.Log.i("PlayerActivity", "VLC initialized successfully with strategy: $strategyName")
                return // Success! Exit function
                
            } catch (e: Exception) {
                android.util.Log.w("PlayerActivity", "VLC initialization failed with strategy $strategyName: ${e.message}")
                lastException = e
                libVLC?.release()
                libVLC = null
                mediaPlayer = null
            }
        }
        
        // All strategies failed
        android.util.Log.e("PlayerActivity", "All VLC initialization strategies failed", lastException)
        runOnUiThread {
            Toast.makeText(this, getString(R.string.player_unavailable_use_external), Toast.LENGTH_LONG).show()
            finish()
        }
    }

    private fun setupControls() {
        binding.btnBack.setOnClickListener { finish() }

        binding.btnPlayPause.setOnClickListener { togglePlayPause() }
        binding.btnRewind.setOnClickListener { seekBackward() }
        binding.btnForward.setOnClickListener { seekForward() }

        binding.btnAudio.setOnClickListener { cycleAudioTrack() }
        binding.btnSubtitles.setOnClickListener { cycleSubtitleTrack() }
        binding.btnAspectRatio.setOnClickListener { cycleAspectRatio() }
        binding.btnSpeed.setOnClickListener { cyclePlaybackSpeed() }
        binding.btnExternalPlayer.setOnClickListener { showExternalPlayerDialog() }

        binding.btnRetry.setOnClickListener { playStream() }

        // SeekBar
        binding.seekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                if (fromUser) {
                    val duration = mediaPlayer?.length ?: 0
                    val position = (progress / 100f * duration).toLong()
                    binding.tvPosition.text = formatTime(position)
                }
            }

            override fun onStartTrackingTouch(seekBar: SeekBar?) {
                seeking = true
            }

            override fun onStopTrackingTouch(seekBar: SeekBar?) {
                val progress = seekBar?.progress ?: 0
                val duration = mediaPlayer?.length ?: 0
                val position = (progress / 100f * duration).toLong()
                mediaPlayer?.time = position
                seeking = false
            }
        })

        // External player dialog buttons
        binding.btnMxPlayer.setOnClickListener { openInExternalPlayer("mx") }
        binding.btnVlcExternal.setOnClickListener { openInExternalPlayer("vlc") }
        binding.btnOtherPlayer.setOnClickListener { openInExternalPlayer("other") }
        binding.btnCancelExternal.setOnClickListener { hideExternalPlayerDialog() }
    }

    private fun playStream() {
        try {
            setLoadingOverlayVisible(true)
            binding.errorOverlay.visibility = View.GONE

            // Check if LibVLC is available
            if (libVLC == null) {
                setLoadingOverlayVisible(false)
                binding.errorOverlay.visibility = View.VISIBLE
                Toast.makeText(
                    this,
                    getString(R.string.player_not_available_restart),
                    Toast.LENGTH_LONG
                ).show()
                return
            }

            val media = Media(libVLC, Uri.parse(streamUrl))
            media.setHWDecoderEnabled(vlcHardwareAccelerationEnabled, false)
            
            // Dynamic thread count for 4K/8K performance
            val cpuCores = Runtime.getRuntime().availableProcessors()
            val dynamicThreads = (cpuCores * 2).coerceIn(8, 16)
            
            // Use adaptive buffering based on network type
            val adaptiveBuffer = getAdaptiveBufferMs()
            // Increased minimum buffer for 4K/8K streams
            val cachingMs = if (isLiveStream) adaptiveBuffer.coerceAtLeast(4000) else adaptiveBuffer.coerceAtLeast(2000)
            media.addOption(":network-caching=$cachingMs")

            // Live streams need extra buffering stability and optimized settings for 4K/8K
            if (isLiveStream) {
                media.addOption(":live-caching=$cachingMs")
                media.addOption(":file-caching=$cachingMs")
                media.addOption(":avcodec-fast")
                media.addOption(":avcodec-threads=$dynamicThreads")  // Dynamic threads for 4K/8K
                if (vlcHardwareAccelerationEnabled) {
                    media.addOption(":avcodec-hw=any")  // Use hardware decoder when available
                }
                // Keep it tolerant; some devices misbehave with strict sync on IPTV
                media.addOption(":clock-jitter=0")
                media.addOption(":clock-synchro=0")
                // Enhanced live stream options for smoother 4K/8K playback
                media.addOption(":no-audio-time-stretch") // Avoid audio pitch issues
                media.addOption(":sout-mux-caching=5000") // Output muxing cache
                media.addOption(":prefetch-buffer-size=8388608") // 8MB prefetch buffer for 4K/8K
                media.addOption(":http-reconnect") // Auto reconnect on HTTP streams
            } else {
                // VOD content options with 4K/8K support
                media.addOption(":file-caching=$cachingMs")
                media.addOption(":avcodec-threads=$dynamicThreads")  // Dynamic threads for 4K/8K VOD
            }
            
            // Set start position if resuming
            if (resumePosition > 0) {
                media.addOption(":start-time=${resumePosition / 1000}")
            }

            mediaPlayer?.media = media
            media.release()
            mediaPlayer?.play()
            
            // Also seek to position after playback starts (more reliable)
            if (resumePosition > 0) {
                handler.postDelayed({
                    if (mediaPlayer?.isPlaying == true) {
                        mediaPlayer?.time = resumePosition
                    }
                }, 1000)
            }

        } catch (e: Exception) {
            setLoadingOverlayVisible(false)
            binding.errorOverlay.visibility = View.VISIBLE
        }
    }

    private fun handleLiveStreamEnded() {
        // IPTV sometimes reports EndReached when the segment list stalls briefly.
        handleLiveStreamError()
    }

    private fun handleLiveStreamError() {
        if (liveRetryCount < LIVE_MAX_RETRIES) {
            liveRetryCount++
            setLoadingOverlayVisible(true)
            binding.errorOverlay.visibility = View.GONE

            // Exponential backoff: 2s, 4s, 8s, 16s, 32s
            val backoffDelay = RETRY_BACKOFF_MS * (1L shl (liveRetryCount - 1))
            val maxDelay = 10000L // Cap at 10 seconds
            val delay = backoffDelay.coerceAtMost(maxDelay)
            
            android.util.Log.d("PlayerActivity", "Retry attempt $liveRetryCount/$LIVE_MAX_RETRIES after ${delay}ms")
            
            handler.postDelayed({
                // Check network before retrying
                if (isNetworkAvailable()) {
                    playStream()
                } else {
                    setLoadingOverlayVisible(false)
                    binding.errorOverlay.visibility = View.VISIBLE
                    Toast.makeText(this, getString(R.string.player_no_network_retry), Toast.LENGTH_LONG).show()
                }
            }, delay)
        } else {
            setLoadingOverlayVisible(false)
            binding.errorOverlay.visibility = View.VISIBLE
            Toast.makeText(this, getString(R.string.player_stream_error_after_retries, LIVE_MAX_RETRIES), Toast.LENGTH_LONG).show()
            liveRetryCount = 0 // Reset for manual retry
        }
    }
    
    /**
     * Check if network is available before retrying
     */
    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork
        val capabilities = connectivityManager.getNetworkCapabilities(network)
        return capabilities != null && (
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
        )
    }

    private fun setLoadingOverlayVisible(visible: Boolean) {
        val now = SystemClock.uptimeMillis()
        val changed = lastBufferingUiVisible == null || lastBufferingUiVisible != visible
        if (changed || now - lastBufferingUiUpdateAtMs >= BUFFERING_UI_THROTTLE_MS) {
            binding.loadingOverlay.visibility = if (visible) View.VISIBLE else View.GONE
            lastBufferingUiVisible = visible
            lastBufferingUiUpdateAtMs = now
        }
    }

    private fun togglePlayPause() {
        if (mediaPlayer?.isPlaying == true) {
            mediaPlayer?.pause()
        } else {
            mediaPlayer?.play()
        }
        resetControlsTimeout()
    }

    private fun seekForward() {
        val currentTime = mediaPlayer?.time ?: 0
        val duration = mediaPlayer?.length ?: 0
        val newTime = (currentTime + SEEK_AMOUNT).coerceAtMost(duration)
        mediaPlayer?.time = newTime
        resetControlsTimeout()
    }

    private fun seekBackward() {
        val currentTime = mediaPlayer?.time ?: 0
        val newTime = (currentTime - SEEK_AMOUNT).coerceAtLeast(0)
        mediaPlayer?.time = newTime
        resetControlsTimeout()
    }

    private var currentAudioTrack = 0
    private fun cycleAudioTrack() {
        val tracks = mediaPlayer?.audioTracks ?: return
        if (tracks.isNotEmpty()) {
            currentAudioTrack = (currentAudioTrack + 1) % tracks.size
            mediaPlayer?.audioTrack = tracks[currentAudioTrack].id
            Toast.makeText(this, getString(R.string.player_audio_track_format, tracks[currentAudioTrack].name), Toast.LENGTH_SHORT).show()
        }
        resetControlsTimeout()
    }

    private var currentSubtitleTrack = -1
    private fun cycleSubtitleTrack() {
        val tracks = mediaPlayer?.spuTracks ?: return
        if (tracks.isNotEmpty()) {
            currentSubtitleTrack = (currentSubtitleTrack + 1) % (tracks.size + 1)
            if (currentSubtitleTrack == tracks.size) {
                mediaPlayer?.spuTrack = -1
                Toast.makeText(this, getString(R.string.player_subtitles_off), Toast.LENGTH_SHORT).show()
            } else {
                mediaPlayer?.spuTrack = tracks[currentSubtitleTrack].id
                Toast.makeText(this, getString(R.string.player_subtitles_track_format, tracks[currentSubtitleTrack].name), Toast.LENGTH_SHORT).show()
            }
        }
        resetControlsTimeout()
    }

    private var aspectRatioIndex = 0
    private val aspectRatios = arrayOf("16:9", "4:3", "16:10", "2.21:1", "original")
    private fun cycleAspectRatio() {
        aspectRatioIndex = (aspectRatioIndex + 1) % aspectRatios.size
        mediaPlayer?.aspectRatio = aspectRatios[aspectRatioIndex]
        Toast.makeText(this, getString(R.string.player_aspect_format, aspectRatios[aspectRatioIndex]), Toast.LENGTH_SHORT).show()
        resetControlsTimeout()
    }

    private val playbackSpeeds = floatArrayOf(0.5f, 0.75f, 1f, 1.25f, 1.5f, 1.75f, 2f)
    private val playbackSpeedLabels = arrayOf("0.5x", "0.75x", "1x", "1.25x", "1.5x", "1.75x", "2x")
    private var currentSpeedIndex = 2 // Default 1x

    private fun cyclePlaybackSpeed() {
        currentSpeedIndex = (currentSpeedIndex + 1) % playbackSpeeds.size
        val speed = playbackSpeeds[currentSpeedIndex]
        mediaPlayer?.rate = speed
        Toast.makeText(this, getString(R.string.player_speed_format, playbackSpeedLabels[currentSpeedIndex]), Toast.LENGTH_SHORT).show()
        resetControlsTimeout()
    }

    private fun showExternalPlayerDialog() {
        binding.externalPlayerDialog.visibility = View.VISIBLE
        binding.btnMxPlayer.requestFocus()
    }

    private fun hideExternalPlayerDialog() {
        binding.externalPlayerDialog.visibility = View.GONE
    }

    private fun openInExternalPlayer(player: String) {
        hideExternalPlayerDialog()
        mediaPlayer?.pause()

        val intent = Intent(Intent.ACTION_VIEW)
        intent.setDataAndType(Uri.parse(streamUrl), "video/*")
        intent.putExtra("title", title)

        when (player) {
            "mx" -> {
                try {
                    intent.component = ComponentName(
                        "com.mxtech.videoplayer.ad",
                        "com.mxtech.videoplayer.ActivityScreen"
                    )
                    startActivity(intent)
                } catch (e: ActivityNotFoundException) {
                    try {
                        intent.component = ComponentName(
                            "com.mxtech.videoplayer.pro",
                            "com.mxtech.videoplayer.ActivityScreen"
                        )
                        startActivity(intent)
                    } catch (e2: ActivityNotFoundException) {
                        mediaPlayer?.play()
                        showInstallPlayerDialog("MX Player", "com.mxtech.videoplayer.ad")
                    }
                }
            }
            "vlc" -> {
                try {
                    intent.component = ComponentName(
                        "org.videolan.vlc",
                        "org.videolan.vlc.gui.video.VideoPlayerActivity"
                    )
                    startActivity(intent)
                } catch (e: ActivityNotFoundException) {
                    mediaPlayer?.play()
                    showInstallPlayerDialog("VLC", "org.videolan.vlc")
                }
            }
            "other" -> {
                try {
                    val chooser = Intent.createChooser(intent, "Open with...")
                    startActivity(chooser)
                } catch (e: ActivityNotFoundException) {
                    Toast.makeText(this, getString(R.string.player_no_video_player_found), Toast.LENGTH_SHORT).show()
                    mediaPlayer?.play()
                }
            }
        }
    }

    /**
     * Show a dialog offering to install the missing external player from the Play Store.
     */
    private fun showInstallPlayerDialog(playerName: String, packageName: String) {
        android.app.AlertDialog.Builder(this, R.style.AlertDialogTheme)
            .setTitle(getString(R.string.player_install_external, playerName))
            .setMessage(getString(R.string.player_install_prompt, playerName))
            .setPositiveButton(getString(R.string.ok)) { _, _ -> openPlayStore(packageName) }
            .setNegativeButton(getString(R.string.cancel), null)
            .show()
    }

    /**
     * Open the Play Store listing for the given package.
     * Falls back to browser if Play Store app is not available.
     */
    private fun openPlayStore(packageName: String) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$packageName")))
        } catch (e: ActivityNotFoundException) {
            startActivity(
                Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://play.google.com/store/apps/details?id=$packageName")
                )
            )
        }
    }

    private fun showControls() {
        controlsVisible = true
        binding.topControlsBar.visibility = View.VISIBLE
        binding.centerControls.visibility = View.VISIBLE
        binding.bottomControlsBar.visibility = View.VISIBLE
        
        // Restore last focused view or default to play/pause
        if (lastFocusedViewId != View.NO_ID) {
            val lastView = findViewById<View>(lastFocusedViewId)
            if (lastView != null && lastView.isShown) {
                lastView.requestFocus()
            } else {
                binding.btnPlayPause.requestFocus()
            }
        } else {
            binding.btnPlayPause.requestFocus()
        }
        
        resetControlsTimeout()
    }

    private fun hideControls() {
        // Save currently focused view
        val currentFocus = currentFocus
        if (currentFocus != null && currentFocus.id != View.NO_ID) {
            lastFocusedViewId = currentFocus.id
        }
        
        controlsVisible = false
        binding.topControlsBar.visibility = View.GONE
        binding.centerControls.visibility = View.GONE
        binding.bottomControlsBar.visibility = View.GONE
    }

    private fun toggleControls() {
        if (controlsVisible) {
            hideControls()
        } else {
            showControls()
        }
    }

    private fun resetControlsTimeout() {
        handler.removeCallbacks(hideControlsRunnable)
        handler.postDelayed(hideControlsRunnable, CONTROLS_TIMEOUT)
    }

    private val hideControlsRunnable = Runnable {
        if (mediaPlayer?.isPlaying == true) {
            hideControls()
        }
    }

    private fun updateProgress() {
        val currentTime = mediaPlayer?.time ?: 0
        val duration = mediaPlayer?.length ?: 0

        binding.tvPosition.text = formatTime(currentTime)

        if (duration > 0) {
            val progress = ((currentTime.toFloat() / duration) * 100).toInt()
            binding.seekBar.progress = progress
        }
    }

    private fun updateDuration() {
        val duration = mediaPlayer?.length ?: 0
        binding.tvDuration.text = formatTime(duration)
    }

    private fun startProgressUpdate() {
        handler.post(progressRunnable)
    }

    private val progressRunnable = object : Runnable {
        override fun run() {
            if (!seeking) {
                updateProgress()
            }
            // Reduced from 1000ms to 2000ms for better performance on TV
            handler.postDelayed(this, 2000)
        }
    }

    private fun startClockUpdate() {
        handler.post(clockRunnable)
    }

    private val clockRunnable = object : Runnable {
        override fun run() {
            val time = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
            binding.tvCurrentTime.text = time
            // Reduced from 60000ms to 30000ms (still reasonable for clock)
            handler.postDelayed(this, 30000)
        }
    }

    private fun formatTime(timeMs: Long): String {
        val totalSeconds = timeMs / 1000
        val hours = totalSeconds / 3600
        val minutes = (totalSeconds % 3600) / 60
        val seconds = totalSeconds % 60

        return if (hours > 0) {
            String.format("%02d:%02d:%02d", hours, minutes, seconds)
        } else {
            String.format("%02d:%02d", minutes, seconds)
        }
    }
    
    /**
     * Get adaptive buffer size based on network connection type.
     * WiFi/Ethernet: use configured buffer
     * Mobile: use 1.5x buffer for stability
     * Unknown/Slow: use 2x buffer for maximum stability
     */
    private fun getAdaptiveBufferMs(): Int {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork
        val capabilities = connectivityManager.getNetworkCapabilities(network)
        
        return when {
            capabilities == null -> vlcBufferMs * 2 // No connection info, use maximum buffer
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> vlcBufferMs // Best connection
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> vlcBufferMs // Good connection
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> {
                // Check for metered connection (mobile data)
                if (capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED)) {
                    (vlcBufferMs * 1.25).toInt() // Unlimited mobile, slight increase
                } else {
                    (vlcBufferMs * 1.5).toInt() // Metered mobile, increase buffer
                }
            }
            else -> vlcBufferMs * 2 // Unknown connection, use maximum buffer
        }
    }
    
    /**
     * Check if connected to WiFi
     */
    private fun isWifiConnected(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork
        val capabilities = connectivityManager.getNetworkCapabilities(network)
        return capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true ||
               capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true
    }
    
    // ==================== PIP (Picture-in-Picture) Support ====================
    
    /**
     * Enter Picture-in-Picture mode for background viewing
     */
    private fun enterPipMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val aspectRatio = Rational(16, 9) // Standard video aspect ratio
                val pipParams = PictureInPictureParams.Builder()
                    .setAspectRatio(aspectRatio)
                    .build()
                enterPictureInPictureMode(pipParams)
            } catch (e: Exception) {
                android.util.Log.e("PlayerActivity", "Failed to enter PIP mode: ${e.message}")
            }
        }
    }
    
    /**
     * Update PIP params when aspect ratio changes
     */
    private fun updatePipParams() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isInPipMode) {
            try {
                val videoTrack = mediaPlayer?.currentVideoTrack
                val aspectRatio = if (videoTrack != null && videoTrack.width > 0 && videoTrack.height > 0) {
                    Rational(videoTrack.width, videoTrack.height)
                } else {
                    Rational(16, 9)
                }
                val pipParams = PictureInPictureParams.Builder()
                    .setAspectRatio(aspectRatio)
                    .build()
                setPictureInPictureParams(pipParams)
            } catch (e: Exception) {
                // Ignore errors
            }
        }
    }
    
    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        isInPipMode = isInPictureInPictureMode
        
        if (isInPictureInPictureMode) {
            // Hide controls in PIP mode
            hideControls()
            binding.topControlsBar.visibility = View.GONE
            binding.bottomControlsBar.visibility = View.GONE
            binding.centerControls.visibility = View.GONE
        } else {
            // Restore controls when exiting PIP
            if (mediaPlayer?.isPlaying != true) {
                showControls()
            }
        }
    }
    
    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        // Enter PIP mode when user presses home button while playing (only if PIP is enabled in settings)
        if (pipModeEnabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && mediaPlayer?.isPlaying == true) {
            enterPipMode()
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Handle external player dialog first
        if (binding.externalPlayerDialog.visibility == View.VISIBLE) {
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                hideExternalPlayerDialog()
                return true
            }
            return super.onKeyDown(keyCode, event)
        }
        
        when (keyCode) {
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> {
                if (!controlsVisible) {
                    showControls()
                } else {
                    // Let the focused button handle the click
                    return super.onKeyDown(keyCode, event)
                }
                return true
            }
            
            KeyEvent.KEYCODE_DPAD_LEFT -> {
                return handleLeftKey()
            }
            
            KeyEvent.KEYCODE_DPAD_RIGHT -> {
                return handleRightKey()
            }
            
            KeyEvent.KEYCODE_DPAD_UP, KeyEvent.KEYCODE_DPAD_DOWN -> {
                if (!controlsVisible) {
                    showControls()
                    return true
                }
                // Let default focus navigation handle up/down
                return super.onKeyDown(keyCode, event)
            }
            
            KeyEvent.KEYCODE_BACK -> {
                if (controlsVisible) {
                    hideControls()
                    return true
                }
                // Enter PIP mode on back press if playing (Android 8.0+) - only if PIP is enabled in settings
                if (pipModeEnabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && mediaPlayer?.isPlaying == true) {
                    enterPipMode()
                    return true
                }
                // PIP disabled or not supported - close the player properly
                if (maybeHandleExitOnBack()) return true
                finish()
                return true
            }
            
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                togglePlayPause()
                return true
            }
            KeyEvent.KEYCODE_MEDIA_PLAY -> {
                mediaPlayer?.play()
                return true
            }
            KeyEvent.KEYCODE_MEDIA_PAUSE -> {
                mediaPlayer?.pause()
                return true
            }
            KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> {
                seekForward()
                return true
            }
            KeyEvent.KEYCODE_MEDIA_REWIND -> {
                seekBackward()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }
    
    /**
     * Handle left key with dual mode:
     * - If SeekBar is focused: seek backward
     * - If controls not visible: show controls
     * - Otherwise: let default navigation handle it
     */
    private fun handleLeftKey(): Boolean {
        if (!controlsVisible) {
            showControls()
            return true
        }
        
        // Check if SeekBar has focus
        if (currentFocus == binding.seekBar) {
            seekBackward()
            return true
        }
        
        // Otherwise, let default focus navigation work
        return super.onKeyDown(KeyEvent.KEYCODE_DPAD_LEFT, null)
    }
    
    /**
     * Handle right key with dual mode:
     * - If SeekBar is focused: seek forward
     * - If controls not visible: show controls
     * - Otherwise: let default navigation handle it
     */
    private fun handleRightKey(): Boolean {
        if (!controlsVisible) {
            showControls()
            return true
        }
        
        // Check if SeekBar has focus
        if (currentFocus == binding.seekBar) {
            seekForward()
            return true
        }
        
        // Otherwise, let default focus navigation work
        return super.onKeyDown(KeyEvent.KEYCODE_DPAD_RIGHT, null)
    }

    override fun onPause() {
        super.onPause()
        saveCurrentProgress()
        mediaPlayer?.pause()
    }

    override fun onStop() {
        super.onStop()
        handler.removeCallbacks(saveProgressRunnable)
        handler.removeCallbacksAndMessages(null)
    }

    override fun onDestroy() {
        super.onDestroy()
        saveCurrentProgress()
        activityScope.cancel()
        mediaPlayer?.stop()
        mediaPlayer?.detachViews()
        mediaPlayer?.release()
        libVLC?.release()
    }
}
