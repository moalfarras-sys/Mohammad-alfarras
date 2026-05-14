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
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.SeekBar
import android.widget.TextView
import android.widget.Toast
import androidx.core.view.isVisible
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.ChannelEntity
import com.mo.moplayer.databinding.ActivityPlayerBinding
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.data.repository.WatchHistoryRepository
import com.mo.moplayer.service.PlaybackService
import com.mo.moplayer.ui.common.BaseTvActivity
import com.mo.moplayer.ui.player.engine.PlayerEngine
import com.mo.moplayer.ui.player.engine.PlayerEngineManager
import com.mo.moplayer.util.LivePlaybackRetryPolicy
import com.mo.moplayer.util.NativeVlcLoader
import com.mo.moplayer.util.TvRecommendationHelper
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

    @Inject
    lateinit var repository: IptvRepository

    @Inject
    lateinit var tvUiPreferences: com.mo.moplayer.util.TvUiPreferences
    
    private val activityScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private lateinit var binding: ActivityPlayerBinding

    private var libVLC: LibVLC? = null
    private var mediaPlayer: MediaPlayer? = null

    private val handler = Handler(Looper.getMainLooper())
    private var controlsVisible = false
    private var seeking = false
    private var lastFocusedViewId: Int = View.NO_ID

    private val SEEK_AMOUNT = 10000L // 10 seconds
    private var controlsTimeoutMs = 4000L

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
    private val api24SafePlayerMode: Boolean
        get() = Build.VERSION.SDK_INT <= Build.VERSION_CODES.N
    
    // Throttle UI updates from VLC buffering callbacks
    private val BUFFERING_UI_THROTTLE_MS = 250L
    private var lastBufferingUiVisible: Boolean? = null
    private var lastBufferingUiUpdateAtMs: Long = 0L
    private var hasStartedPlayback = false

    private val isLiveStream: Boolean
        get() = contentType.equals("CHANNEL", ignoreCase = true) ||
            contentType.equals("LIVE", ignoreCase = true)

    private var liveRetryCount = 0
    private val LIVE_MAX_RETRIES = LivePlaybackRetryPolicy.DEFAULT_MAX_RETRIES
    private var lastRetryTime = 0L
    private val RETRY_BACKOFF_MS = LivePlaybackRetryPolicy.DEFAULT_BASE_DELAY_MS
    private var useHttpFallbackForApi24Stream = false
    private var activePlaybackToken = 0L
    
    // PIP (Picture-in-Picture) support
    private var isInPipMode = false
    private var optionSheetVisible = false
    private var channelDrawerVisible = false
    private var channelList: List<ChannelEntity> = emptyList()
    private var currentChannelIndex = -1
    private var currentServerId: Long = 0L

    // Modern dual-engine playback manager (ExoPlayer + VLC fallback)
    private var engineManager: PlayerEngineManager? = null
    private var broadcastBridge: PlayerBroadcastBridge? = null
    private var useExoPlayerPrimary = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPlayerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Handle deep-link intents (e.g. from Android TV home "Continue Watching")
        val deepLinkData = intent.data
        if (deepLinkData != null && deepLinkData.scheme == "moplayer" && deepLinkData.host == "play") {
            streamUrl = deepLinkData.getQueryParameter("url") ?: ""
            title = deepLinkData.getQueryParameter("title") ?: ""
            contentType = deepLinkData.getQueryParameter("type") ?: "MOVIE"
            contentId = deepLinkData.getQueryParameter("content_id") ?: streamUrl
            posterUrl = deepLinkData.getQueryParameter("poster_url")
            resumePosition = deepLinkData.getQueryParameter("resume")?.toLongOrNull() ?: 0L
        } else {
            // Normal launch via extras
            streamUrl = intent.getStringExtra(EXTRA_STREAM_URL) ?: ""
            title = intent.getStringExtra(EXTRA_TITLE) ?: ""
            contentType = intent.getStringExtra(EXTRA_TYPE) ?: "MOVIE"
            contentId = intent.getStringExtra(EXTRA_CONTENT_ID) ?: streamUrl
            posterUrl = intent.getStringExtra(EXTRA_POSTER_URL)
            resumePosition = intent.getLongExtra(EXTRA_RESUME_POSITION, 0)
        }
        
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

            // Determine if ExoPlayer should be primary
            val playerType = playerPreferences.getPlayerType()
            useExoPlayerPrimary = (playerType == com.mo.moplayer.util.PlayerPreferences.PLAYER_INTERNAL_EXOPLAYER)

            if (streamUrl.isEmpty()) {
                Toast.makeText(this@PlayerActivity, getString(R.string.player_no_stream_url), Toast.LENGTH_SHORT).show()
                finish()
                return@launch
            }

            loadPlayerSettings()

            binding.tvTitle.text = title
            binding.tvSubtitle.text = contentType
            updatePlaybackChrome()

            if (resumePosition == 0L && contentId.isNotEmpty()) {
                resumePosition = loadSavedPositionSuspend()
            }

            setupControls()
            binding.loadingOverlay.visibility = View.VISIBLE
            if (isLiveStream) {
                loadLiveSupportData()
            }
            binding.root.post {
                if (useExoPlayerPrimary) {
                    initPlaybackEngine()
                } else {
                    // Legacy VLC path (default): preserve all existing behavior
                    initVLC()
                    playStream()
                }
                startClockUpdate()
                startProgressSaving()
                showControls()

                // Register broadcast bridge for PlaybackService to Activity remote control.
                val bridge = PlayerBroadcastBridge(this@PlayerActivity, object : PlayerBroadcastBridge.PlayerControlListener {
                    override fun onPlayPauseRequested() { togglePlayPause() }
                    override fun onStopRequested() {
                        engineManager?.stop() ?: mediaPlayer?.stop()
                        saveCurrentProgress()
                        finish()
                    }
                    override fun onSeekRequested(forward: Boolean, amountMs: Long) {
                        if (forward) seekForward() else seekBackward()
                    }
                    override fun onNextChannelRequested() { playAdjacentChannel(1) }
                    override fun onPreviousChannelRequested() { playAdjacentChannel(-1) }
                    override fun onShowControlsRequested() { showControls() }
                })
                bridge.register()
                broadcastBridge = bridge

                // Keep playback alive via the foreground service.
                PlaybackService.start(this@PlayerActivity, title, isLiveStream)
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
            if (useExoPlayerPrimary) {
                initPlaybackEngine()
            } else {
                initVLC()
                playStream()
            }
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
        controlsTimeoutMs = tvUiPreferences.playerAutoHideSeconds.first() * 1000L
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
        val currentPosition = currentPlaybackPositionMs()
        val duration = currentPlaybackDurationMs()
        
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
                    // Publish to Android TV home "Continue Watching" row
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !isLiveStream) {
                        TvRecommendationHelper(this@PlayerActivity).publishWatchNext(
                            contentId = contentId,
                            title = title,
                            subtitle = if (seasonNumber != null && episodeNumber != null) {
                                "S${seasonNumber}:E${episodeNumber}"
                            } else null,
                            posterUrl = posterUrl,
                            type = if (contentType.equals("MOVIE", ignoreCase = true)) "movie" else "series",
                            progressMs = currentPosition,
                            durationMs = duration,
                            resumeUrl = streamUrl
                        )
                    }
                } catch (e: Exception) {
                    // Ignore errors
                }
            }
        }
    }

    /**
     * Initialize the modern dual-engine playback system.
     * Uses ExoPlayer if user selected it in settings; otherwise VLC.
     */
    private fun initPlaybackEngine() {
        if (streamUrl.isEmpty()) return

        engineManager = PlayerEngineManager(this, isLiveStream).also { manager ->
            manager.setPrimaryEngine(useExoPlayerPrimary)
            manager.attachViews(binding.exoPlayerView, binding.vlcVideoLayout)
        }

        if (useExoPlayerPrimary) {
            // Switch to ExoPlayer surface
            binding.vlcVideoLayout.visibility = View.GONE
            binding.exoPlayerView.visibility = View.VISIBLE
        } else {
            // VLC mode: keep legacy layout
            binding.exoPlayerView.visibility = View.GONE
            binding.vlcVideoLayout.visibility = View.VISIBLE
        }

        // Fallback callback: if ExoPlayer fails and VLC takes over, switch surface
        engineManager?.addCallback(object : PlayerEngine.Callback {
            override fun onPlaybackStateChanged(state: Int) {
                if (state == androidx.media3.common.Player.STATE_READY) {
                    setLoadingOverlayVisible(false)
                    binding.errorOverlay.visibility = View.GONE
                    startProgressUpdate()
                    updateDuration()
                }
            }
            override fun onIsPlayingChanged(isPlaying: Boolean) {
                binding.btnPlayPause.setImageResource(if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play)
                if (isPlaying) startProgressUpdate()
            }
            override fun onPlaybackError(error: PlayerEngine.PlaybackError) { /* handled */ }
            override fun onPositionChanged(positionMs: Long, durationMs: Long) {
                if (!seeking) updateProgress()
                updateDuration()
            }
            override fun onVideoSizeChanged(width: Int, height: Int) {
                if (engineManager?.isFallbackActive == true && binding.vlcVideoLayout.visibility != View.VISIBLE) {
                    // Switched to VLC fallback; swap surfaces.
                    binding.exoPlayerView.visibility = View.GONE
                    binding.vlcVideoLayout.visibility = View.VISIBLE
                }
            }
            override fun onTracksChanged(audio: List<PlayerEngine.TrackInfo>, subtitles: List<PlayerEngine.TrackInfo>) {}
            override fun onBuffering(buffering: Boolean) {
                runOnUiThread { setLoadingOverlayVisible(buffering) }
            }
        })

        engineManager?.play(streamUrl, title, resumePosition)
    }

    private fun attachPlaybackEngineView() {
        val manager = engineManager ?: return
        if (manager.isFallbackActive || !useExoPlayerPrimary) {
            binding.exoPlayerView.visibility = View.GONE
            binding.vlcVideoLayout.visibility = View.VISIBLE
        } else {
            binding.vlcVideoLayout.visibility = View.GONE
            binding.exoPlayerView.visibility = View.VISIBLE
        }
        manager.attachViews(binding.exoPlayerView, binding.vlcVideoLayout)
    }

    private fun initVLC() {
        val nativeVlc = NativeVlcLoader.ensureAvailable(this)
        if (!nativeVlc.available) {
            android.util.Log.e("PlayerActivity", nativeVlc.message)
            setLoadingOverlayVisible(false)
            showPlaybackError(getString(R.string.player_unavailable_use_external))
            return
        }

        // Multi-strategy initialization for x86 emulator compatibility
        val cachingMs = if (api24SafePlayerMode) {
            vlcBufferMs.coerceAtLeast(if (isLiveStream) 6500 else 3500)
        } else {
            vlcBufferMs.coerceAtLeast(500)
        }
        
        // Dynamic thread count based on device CPU cores for optimal 4K/8K performance
        val cpuCores = Runtime.getRuntime().availableProcessors()
        val dynamicThreadCount = (cpuCores * 2).coerceIn(8, 16)  // 8-16 threads for 4K/8K
        
        val hardwareEnabledForThisDevice = vlcHardwareAccelerationEnabled
        val codecOption = if (hardwareEnabledForThisDevice) {
            if (api24SafePlayerMode) "--codec=mediacodec_jni,all" else "--codec=mediacodec_ndk,mediacodec_jni,all"
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
                add("--aout=android_audiotrack")
                add("--no-spdif")
                add("--no-audio-time-stretch")
                addAll(opts)
            }
        }

        val strategies = listOf(
            // Strategy 1: API 24 safe. Avoid OpenSLES; it crashes AudioTrackShared on
            // some Android TV 7 emulators and low-end boxes.
            Pair("API24Safe", optionsOf(
                "--network-caching=$cachingMs",
                "--live-caching=$cachingMs",
                "--file-caching=$cachingMs",
                dropLateFramesOpt,
                skipFramesOpt,
                avcodecSkipFrameOpt,
                avcodecSkipIdctOpt
            )),
            // Strategy 2: Basic with caching
            Pair("Basic", optionsOf(
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

        var lastException: Throwable? = null
        
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
                                hasStartedPlayback = true
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
                                setLoadingOverlayVisible(event.buffering < 100f && !hasStartedPlayback)
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
                                if (tryApi24HttpFallbackAfterPlaybackError()) {
                                    return@runOnUiThread
                                } else if (isLiveStream) {
                                    handleLiveStreamError()
                                } else {
                                    showPlaybackError(getString(R.string.player_stream_error_with_external_hint))
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
                
            } catch (e: Throwable) {
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

        binding.btnPreviousChannel.setOnClickListener { playAdjacentChannel(-1) }
        binding.btnNextChannel.setOnClickListener { playAdjacentChannel(1) }
        binding.btnPlayPause.setOnClickListener { togglePlayPause() }
        binding.btnRewind.setOnClickListener { seekBackward() }
        binding.btnForward.setOnClickListener { seekForward() }

        binding.btnGuide.setOnClickListener { toggleChannelDrawer() }
        binding.btnAudio.setOnClickListener { showAudioTrackSheet() }
        binding.btnSubtitles.setOnClickListener { showSubtitleSheet() }
        binding.btnAspectRatio.setOnClickListener { cycleAspectRatio() }
        binding.btnSpeed.setOnClickListener { cyclePlaybackSpeed() }
        binding.btnExternalPlayer.setOnClickListener { showExternalPlayerDialog() }

        binding.btnRetry.setOnClickListener { restartCurrentStream() }
        binding.optionSheet.setOnClickListener { hideOptionSheet() }
        binding.channelDrawer.setOnClickListener { hideChannelDrawer() }

        // SeekBar
        binding.seekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                if (fromUser) {
                    val duration = currentPlaybackDurationMs()
                    val position = (progress / 100f * duration).toLong()
                    binding.tvPosition.text = formatTime(position)
                }
            }

            override fun onStartTrackingTouch(seekBar: SeekBar?) {
                seeking = true
            }

            override fun onStopTrackingTouch(seekBar: SeekBar?) {
                val progress = seekBar?.progress ?: 0
                val duration = currentPlaybackDurationMs()
                val position = (progress / 100f * duration).toLong()
                engineManager?.seekTo(position) ?: run { mediaPlayer?.time = position }
                seeking = false
            }
        })

        // External player dialog buttons
        binding.btnMxPlayer.setOnClickListener { openInExternalPlayer("mx") }
        binding.btnVlcExternal.setOnClickListener { openInExternalPlayer("vlc") }
        binding.btnOtherPlayer.setOnClickListener { openInExternalPlayer("other") }
        binding.btnCancelExternal.setOnClickListener { hideExternalPlayerDialog() }

        listOf(
            binding.btnBack,
            binding.btnPreviousChannel,
            binding.btnRewind,
            binding.btnPlayPause,
            binding.btnForward,
            binding.btnNextChannel,
            binding.btnGuide,
            binding.btnAudio,
            binding.btnSubtitles,
            binding.btnAspectRatio,
            binding.btnSpeed,
            binding.btnExternalPlayer,
            binding.seekBar
        ).forEach { view ->
            view.setOnFocusChangeListener { _, hasFocus ->
                if (hasFocus) resetControlsTimeout()
            }
        }
    }

    private fun playStream() {
        try {
            val requestToken = ++activePlaybackToken
            setLoadingOverlayVisible(true)
            hasStartedPlayback = false
            binding.errorOverlay.visibility = View.GONE

            // Check if LibVLC is available
            if (libVLC == null) {
                setLoadingOverlayVisible(false)
                showPlaybackError(getString(R.string.player_not_available_restart))
                Toast.makeText(
                    this,
                    getString(R.string.player_not_available_restart),
                    Toast.LENGTH_LONG
                ).show()
                return
            }

            if (!isSupportedStreamScheme(streamUrl)) {
                setLoadingOverlayVisible(false)
                showPlaybackError(getString(R.string.player_unsupported_stream_format))
                return
            }

            val playbackUrl = getVlcPlaybackUrl(streamUrl)
            val media = Media(libVLC, Uri.parse(playbackUrl))
            val hardwareEnabledForThisDevice = vlcHardwareAccelerationEnabled
            media.setHWDecoderEnabled(hardwareEnabledForThisDevice, false)
            
            // Dynamic thread count for 4K/8K performance
            val cpuCores = Runtime.getRuntime().availableProcessors()
            val dynamicThreads = (cpuCores * 2).coerceIn(8, 16)
            
            // Use adaptive buffering based on network type
            val adaptiveBuffer = getAdaptiveBufferMs()
            // Increased minimum buffer for 4K/8K streams
            val cachingMs = if (api24SafePlayerMode) {
                if (isLiveStream) adaptiveBuffer.coerceAtLeast(6500) else adaptiveBuffer.coerceAtLeast(3500)
            } else {
                if (isLiveStream) adaptiveBuffer.coerceAtLeast(4000) else adaptiveBuffer.coerceAtLeast(2000)
            }
            media.addOption(":network-caching=$cachingMs")
            media.addOption(":aout=android_audiotrack")
            media.addOption(":no-spdif")
            media.addOption(":no-audio-time-stretch")
            media.addOption(":http-user-agent=Mozilla/5.0 (Linux; Android TV 7.0) MoPlayer/1.0 VLC")
            media.addOption(":http-referrer=")

            // Live streams need extra buffering stability and optimized settings for 4K/8K
            if (isLiveStream) {
                media.addOption(":live-caching=$cachingMs")
                media.addOption(":file-caching=$cachingMs")
                media.addOption(":avcodec-fast")
                media.addOption(":avcodec-threads=$dynamicThreads")  // Dynamic threads for 4K/8K
                if (hardwareEnabledForThisDevice) {
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

            runCatching {
                if (mediaPlayer?.isPlaying == true || liveRetryCount > 0 || useHttpFallbackForApi24Stream) {
                    mediaPlayer?.stop()
                }
            }
            if (requestToken != activePlaybackToken) {
                media.release()
                return
            }
            mediaPlayer?.media = media
            media.release()
            mediaPlayer?.play()
            
            // Also seek to position after playback starts (more reliable)
            if (resumePosition > 0) {
                handler.postDelayed({
                    if (requestToken == activePlaybackToken && mediaPlayer?.isPlaying == true) {
                        mediaPlayer?.time = resumePosition
                    }
                }, 1000)
            }

        } catch (e: Exception) {
            setLoadingOverlayVisible(false)
            showPlaybackError(getString(R.string.player_stream_error_with_external_hint))
        }
    }

    private fun isSupportedStreamScheme(url: String): Boolean {
        val scheme = runCatching { Uri.parse(url).scheme?.lowercase(Locale.ROOT) }.getOrNull()
        return scheme in setOf("http", "https", "rtmp", "rtsp", "udp", "rtp", "file", "content")
    }

    private fun getVlcPlaybackUrl(url: String): String {
        val liveAdjustedUrl = if (isLiveStream) livePlaybackUrl(url, liveRetryCount) else url
        if (!api24SafePlayerMode || !useHttpFallbackForApi24Stream) return liveAdjustedUrl
        val parsed = runCatching { Uri.parse(liveAdjustedUrl) }.getOrNull() ?: return liveAdjustedUrl
        val host = parsed.host.orEmpty()
        val isAppHost = host.contains("moalfarras.space", ignoreCase = true) ||
            host.contains("vercel.app", ignoreCase = true)
        return if (parsed.scheme.equals("https", ignoreCase = true) && !isAppHost) {
            parsed.buildUpon().scheme("http").build().toString()
        } else {
            liveAdjustedUrl
        }
    }

    private fun livePlaybackUrl(url: String, attempt: Int): String {
        val cleanUrl = url.trim()
        return when {
            hasLiveExtension(cleanUrl, "m3u8") ->
                if (attempt % 2 == 0) replaceLiveExtension(cleanUrl, "ts") else cleanUrl
            hasLiveExtension(cleanUrl, "ts") ->
                if (attempt % 2 == 0) cleanUrl else replaceLiveExtension(cleanUrl, "m3u8")
            else -> cleanUrl
        }
    }

    private fun hasLiveExtension(url: String, extension: String): Boolean =
        Regex("(?i)\\.${Regex.escape(extension)}(?=([?#]|$))").containsMatchIn(url)

    private fun replaceLiveExtension(url: String, extension: String): String =
        url.replace(Regex("(?i)\\.(m3u8|ts)(?=([?#]|$))"), ".$extension")

    private fun showPlaybackError(message: String) {
        binding.tvErrorMessage.text = message
        binding.errorOverlay.visibility = View.VISIBLE
        binding.btnRetry.requestFocus()
    }

    private fun handleLiveStreamEnded() {
        // IPTV sometimes reports EndReached when the segment list stalls briefly.
        handleLiveStreamError()
    }

    private fun tryApi24HttpFallbackAfterPlaybackError(): Boolean {
        if (!api24SafePlayerMode || useHttpFallbackForApi24Stream) return false

        val parsed = runCatching { Uri.parse(streamUrl) }.getOrNull() ?: return false
        val host = parsed.host.orEmpty()
        val isAppHost = host.contains("moalfarras.space", ignoreCase = true) ||
            host.contains("vercel.app", ignoreCase = true)
        if (!parsed.scheme.equals("https", ignoreCase = true) || isAppHost) {
            return false
        }

        useHttpFallbackForApi24Stream = true
        liveRetryCount = 0
        setLoadingOverlayVisible(true)
        binding.errorOverlay.visibility = View.GONE
        android.util.Log.w("PlayerActivity", "Retrying API24 stream with HTTP fallback after HTTPS playback error")
        val retryToken = activePlaybackToken
        handler.postDelayed({
            if (retryToken == activePlaybackToken && !isFinishing && !isDestroyed) {
                playStream()
            }
        }, 350L)
        return true
    }

    private fun handleLiveStreamError() {
        if (LivePlaybackRetryPolicy.canRetry(liveRetryCount, LIVE_MAX_RETRIES)) {
            liveRetryCount++
            setLoadingOverlayVisible(true)
            binding.errorOverlay.visibility = View.GONE

            val delay = LivePlaybackRetryPolicy.nextDelayMs(liveRetryCount, RETRY_BACKOFF_MS)
            
            android.util.Log.d("PlayerActivity", "Retry attempt $liveRetryCount/$LIVE_MAX_RETRIES after ${delay}ms")
            
            val retryToken = activePlaybackToken
            handler.postDelayed({
                if (retryToken != activePlaybackToken || isFinishing || isDestroyed) {
                    return@postDelayed
                }
                // Check network before retrying
                if (isNetworkAvailable()) {
                    playStream()
                } else {
                    setLoadingOverlayVisible(false)
                    showPlaybackError(getString(R.string.player_no_network_retry))
                    Toast.makeText(this, getString(R.string.player_no_network_retry), Toast.LENGTH_LONG).show()
                }
            }, delay)
        } else {
            setLoadingOverlayVisible(false)
            showPlaybackError(getString(R.string.player_stream_error_after_retries, LIVE_MAX_RETRIES))
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

    private fun currentPlaybackPositionMs(): Long = engineManager?.currentPositionMs ?: (mediaPlayer?.time ?: 0)

    private fun currentPlaybackDurationMs(): Long = engineManager?.durationMs ?: (mediaPlayer?.length ?: 0)

    private fun isPlaybackActive(): Boolean = engineManager?.isPlaying ?: (mediaPlayer?.isPlaying == true)

    private fun togglePlayPause() {
        val manager = engineManager
        if (manager != null) {
            manager.togglePlayPause()
        } else if (mediaPlayer?.isPlaying == true) {
            mediaPlayer?.pause()
        } else {
            mediaPlayer?.play()
        }
        resetControlsTimeout()
    }

    private fun seekForward() {
        val manager = engineManager
        if (manager != null) {
            manager.seekBy(SEEK_AMOUNT)
        } else {
            val currentTime = mediaPlayer?.time ?: 0
            val duration = mediaPlayer?.length ?: 0
            val newTime = if (duration > 0) (currentTime + SEEK_AMOUNT).coerceAtMost(duration) else currentTime + SEEK_AMOUNT
            mediaPlayer?.time = newTime
        }
        resetControlsTimeout()
    }

    private fun seekBackward() {
        val manager = engineManager
        if (manager != null) {
            manager.seekBy(-SEEK_AMOUNT)
        } else {
            val currentTime = mediaPlayer?.time ?: 0
            val newTime = (currentTime - SEEK_AMOUNT).coerceAtLeast(0)
            mediaPlayer?.time = newTime
        }
        resetControlsTimeout()
    }

    private fun showAudioTrackSheet() {
        val tracks = mediaPlayer?.audioTracks.orEmpty()
        if (tracks.isEmpty()) {
            Toast.makeText(this, getString(R.string.player_audio_track_format, "Default"), Toast.LENGTH_SHORT).show()
            return
        }
        showOptionSheet("Audio Tracks", tracks.mapIndexed { index, track ->
            OptionItem(
                label = track.name ?: "Track ${index + 1}",
                selected = mediaPlayer?.audioTrack == track.id
            ) {
                mediaPlayer?.audioTrack = track.id
                hideOptionSheet()
                resetControlsTimeout()
            }
        })
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

    private fun showSubtitleSheet() {
        val tracks = mediaPlayer?.spuTracks.orEmpty()
        val subtitleItems = mutableListOf(
            OptionItem(
                label = getString(R.string.player_subtitles_off),
                selected = mediaPlayer?.spuTrack == -1
            ) {
                mediaPlayer?.spuTrack = -1
                hideOptionSheet()
                resetControlsTimeout()
            }
        )
        subtitleItems += tracks.mapIndexed { index, track ->
            OptionItem(
                label = track.name ?: "Subtitle ${index + 1}",
                selected = mediaPlayer?.spuTrack == track.id
            ) {
                mediaPlayer?.spuTrack = track.id
                hideOptionSheet()
                resetControlsTimeout()
            }
        }
        showOptionSheet("Subtitles", subtitleItems)
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

    private fun showOptionSheet(title: String, items: List<OptionItem>) {
        optionSheetVisible = true
        binding.tvOptionSheetTitle.text = title
        binding.optionSheetContent.removeAllViews()
        items.forEachIndexed { index, item ->
            val button = Button(this).apply {
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).also { lp ->
                    lp.topMargin = if (index == 0) 0 else 8
                }
                background = getDrawable(if (item.selected) R.drawable.bg_button_play else R.drawable.bg_button_secondary)
                text = item.label
                isAllCaps = false
                setTextColor(
                    if (item.selected) resources.getColor(R.color.htc_pure_black, theme)
                    else resources.getColor(R.color.cinematic_text_primary, theme)
                )
                setOnClickListener { item.onClick.invoke() }
            }
            binding.optionSheetContent.addView(button)
            if (index == 0) {
                button.requestFocus()
            }
        }
        binding.optionSheet.visibility = View.VISIBLE
    }

    private fun hideOptionSheet() {
        optionSheetVisible = false
        binding.optionSheet.visibility = View.GONE
        showControls()
    }

    private fun openInExternalPlayer(player: String) {
        hideExternalPlayerDialog()
        engineManager?.pause() ?: mediaPlayer?.pause()

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
                        engineManager?.resume() ?: mediaPlayer?.play()
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
                    engineManager?.resume() ?: mediaPlayer?.play()
                    showInstallPlayerDialog("VLC", "org.videolan.vlc")
                }
            }
            "other" -> {
                try {
                    val chooser = Intent.createChooser(intent, "Open with...")
                    startActivity(chooser)
                } catch (e: ActivityNotFoundException) {
                    Toast.makeText(this, getString(R.string.player_no_video_player_found), Toast.LENGTH_SHORT).show()
                    engineManager?.resume() ?: mediaPlayer?.play()
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

    private data class OptionItem(
        val label: String,
        val selected: Boolean,
        val onClick: () -> Unit
    )

    private fun updatePlaybackChrome() {
        binding.liveBadge.isVisible = isLiveStream
        binding.tvPlaybackMeta.isVisible = isLiveStream
        binding.btnGuide.isVisible = isLiveStream
        binding.btnPreviousChannel.isVisible = isLiveStream
        binding.btnNextChannel.isVisible = isLiveStream
        binding.btnRewind.isVisible = !isLiveStream
        binding.btnForward.isVisible = !isLiveStream
        binding.seekBar.isVisible = !isLiveStream
        binding.tvPosition.isVisible = !isLiveStream
        binding.tvDuration.isVisible = !isLiveStream
        if (isLiveStream) {
            binding.tvPlaybackMeta.text = getString(R.string.nav_live)
        }
    }

    private fun loadLiveSupportData() {
        activityScope.launch {
            val activeServer = repository.getActiveServerSync() ?: return@launch
            currentServerId = activeServer.id
            val current = repository.getChannelById(contentId)
            channelList = if (!current?.categoryId.isNullOrBlank()) {
                repository.getChannelsByCategory(activeServer.id, current!!.categoryId).first()
            } else {
                repository.getAllChannelsLimited(activeServer.id, 300).first()
            }
            currentChannelIndex = channelList.indexOfFirst { it.channelId == contentId }
            val currentChannel = if (currentChannelIndex in channelList.indices) channelList[currentChannelIndex] else null
            val streamId = currentChannel?.streamId
            if (streamId != null) {
                val currentProgram = repository.getCurrentProgram(streamId, activeServer.id)
                val nextProgram = repository.getNextProgram(streamId, activeServer.id)
                binding.tvCurrentProgram.text =
                    currentProgram?.title?.let { "Now • $it" } ?: "Now • $title"
                binding.tvNextProgram.text =
                    nextProgram?.title?.let { "Next • $it" } ?: "Next • No upcoming EPG"
                binding.tvPlaybackMeta.text =
                    currentProgram?.title?.takeIf { it.isNotBlank() } ?: getString(R.string.nav_live)
            }
            populateChannelDrawer()
        }
    }

    private fun populateChannelDrawer() {
        binding.channelListContainer.removeAllViews()
        if (channelList.isEmpty()) {
            binding.channelListContainer.addView(createChannelRow(title = "No channels available", selected = false, onClick = {}))
            return
        }

        val anchor = currentChannelIndex.takeIf { it >= 0 } ?: 0
        val visibleChannels = channelList.drop((anchor - 5).coerceAtLeast(0)).take(14)
        visibleChannels.forEach { channel ->
            val isSelected = channel.channelId == contentId
            binding.channelListContainer.addView(
                createChannelRow(
                    title = channel.name,
                    selected = isSelected,
                    onClick = {
                        switchToChannel(channel)
                        hideChannelDrawer()
                    }
                )
            )
        }
    }

    private fun createChannelRow(title: String, selected: Boolean, onClick: () -> Unit): View {
        return Button(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).also { it.bottomMargin = 8 }
            background = getDrawable(if (selected) R.drawable.bg_button_play else R.drawable.bg_button_secondary)
            text = title
            gravity = android.view.Gravity.START or android.view.Gravity.CENTER_VERTICAL
            isAllCaps = false
            setPadding(18, 16, 18, 16)
            setTextColor(
                if (selected) resources.getColor(R.color.htc_pure_black, theme)
                else resources.getColor(R.color.cinematic_text_primary, theme)
            )
            setOnClickListener { onClick() }
        }
    }

    private fun toggleChannelDrawer() {
        if (channelDrawerVisible) hideChannelDrawer() else showChannelDrawer()
    }

    private fun showChannelDrawer() {
        if (!isLiveStream) return
        channelDrawerVisible = true
        binding.channelDrawer.visibility = View.VISIBLE
        populateChannelDrawer()
        (binding.channelListContainer.getChildAt(0) ?: return).requestFocus()
    }

    private fun hideChannelDrawer() {
        channelDrawerVisible = false
        binding.channelDrawer.visibility = View.GONE
        showControls()
    }

    private fun playAdjacentChannel(direction: Int) {
        if (channelList.isEmpty()) return
        val baseIndex = currentChannelIndex.takeIf { it >= 0 } ?: channelList.indexOfFirst { it.channelId == contentId }
        if (baseIndex < 0) return
        val nextIndex = (baseIndex + direction).coerceIn(0, channelList.lastIndex)
        if (nextIndex != baseIndex) {
            switchToChannel(channelList[nextIndex])
        }
    }

    private fun switchToChannel(channel: ChannelEntity) {
        contentId = channel.channelId
        streamUrl = channel.streamUrl
        title = channel.name
        binding.tvTitle.text = title
        binding.tvSubtitle.text = getString(R.string.nav_live)
        currentChannelIndex = channelList.indexOfFirst { it.channelId == channel.channelId }
        restartCurrentStream(startPositionMs = 0)
        loadLiveSupportData()
    }

    private fun restartCurrentStream(startPositionMs: Long = resumePosition) {
        binding.errorOverlay.visibility = View.GONE
        setLoadingOverlayVisible(true)
        val manager = engineManager
        if (manager != null) {
            activePlaybackToken++
            manager.play(streamUrl, title, startPositionMs)
        } else {
            playStream()
        }
    }

    private fun showControls() {
        controlsVisible = true
        binding.topScrim.visibility = View.VISIBLE
        binding.bottomScrim.visibility = View.VISIBLE
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
        if (optionSheetVisible || channelDrawerVisible || binding.externalPlayerDialog.isVisible) return
        // Save currently focused view
        val currentFocus = currentFocus
        if (currentFocus != null && currentFocus.id != View.NO_ID) {
            lastFocusedViewId = currentFocus.id
        }
        
        controlsVisible = false
        binding.topScrim.visibility = View.GONE
        binding.bottomScrim.visibility = View.GONE
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
        handler.postDelayed(hideControlsRunnable, controlsTimeoutMs)
    }

    private val hideControlsRunnable = Runnable {
        if (isPlaybackActive()) {
            hideControls()
        }
    }

    private fun updateProgress() {
        val currentTime = currentPlaybackPositionMs()
        val duration = currentPlaybackDurationMs()

        binding.tvPosition.text = formatTime(currentTime)

        if (duration > 0) {
            val progress = ((currentTime.toFloat() / duration) * 100).toInt()
            binding.seekBar.progress = progress
        }
    }

    private fun updateDuration() {
        val duration = currentPlaybackDurationMs()
        binding.tvDuration.text = formatTime(duration)
    }

    private fun startProgressUpdate() {
        handler.removeCallbacks(progressRunnable)
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
            if (!isPlaybackActive()) {
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
        if (optionSheetVisible) {
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                hideOptionSheet()
                return true
            }
            return super.onKeyDown(keyCode, event)
        }
        if (channelDrawerVisible) {
            if (keyCode == KeyEvent.KEYCODE_BACK || keyCode == KeyEvent.KEYCODE_MENU) {
                hideChannelDrawer()
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
                if (pipModeEnabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isPlaybackActive()) {
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
                engineManager?.resume() ?: mediaPlayer?.play()
                return true
            }
            KeyEvent.KEYCODE_MEDIA_PAUSE -> {
                engineManager?.pause() ?: mediaPlayer?.pause()
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
            KeyEvent.KEYCODE_MENU -> {
                toggleChannelDrawer()
                return true
            }
            KeyEvent.KEYCODE_MEDIA_NEXT -> {
                playAdjacentChannel(1)
                return true
            }
            KeyEvent.KEYCODE_MEDIA_PREVIOUS -> {
                playAdjacentChannel(-1)
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
        return false
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
        return false
    }

    override fun onResume() {
        super.onResume()
        attachPlaybackEngineView()
        if (engineManager == null && mediaPlayer != null && binding.vlcVideoLayout.visibility == View.VISIBLE) {
            runCatching { mediaPlayer?.attachViews(binding.vlcVideoLayout, null, false, false) }
        }
    }

    override fun onPause() {
        super.onPause()
        saveCurrentProgress()

        // Background Audio Mode: if live TV, keep audio playing via ForegroundService
        // even when the user navigates away (Home, Guide, etc.).
        // Only pause if explicitly finishing or if user navigated Back.
        val allowBackgroundAudio = isLiveStream && !isFinishing
        if (!allowBackgroundAudio) {
            if (engineManager != null) {
                engineManager?.pause()
            } else {
                mediaPlayer?.pause()
            }
        } else {
            // Keep audio alive — PlaybackService already started
            if (engineManager != null) {
                engineManager?.detachView()
            } else {
                // Detach video to save decoder resources while audio continues
                mediaPlayer?.detachViews()
            }
        }
    }

    override fun onStop() {
        super.onStop()
        handler.removeCallbacks(saveProgressRunnable)
        if (isFinishing) {
            activePlaybackToken++
            handler.removeCallbacksAndMessages(null)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        saveCurrentProgress()

        // Stop the foreground playback service so notification disappears
        PlaybackService.stop(this)

        activityScope.cancel()
        handler.removeCallbacksAndMessages(null)
        // Unregister broadcast bridge for remote playback controls
        try {
            broadcastBridge?.unregister()
        } catch (_: Exception) { }
        broadcastBridge = null

        // Release dual-engine manager if active
        engineManager?.release()
        engineManager = null
        val player = mediaPlayer
        val vlc = libVLC
        mediaPlayer = null
        libVLC = null
        try {
            player?.setEventListener(null)
            player?.detachViews()
        } catch (e: Exception) {
            android.util.Log.w("PlayerActivity", "VLC detach failed during destroy: ${e.message}")
        }
        Thread {
            try {
                player?.stop()
            } catch (_: Exception) {
            }
            try {
                player?.release()
            } catch (_: Exception) {
            }
            try {
                vlc?.release()
            } catch (_: Exception) {
            }
        }.start()
    }
}
