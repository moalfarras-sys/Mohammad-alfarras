package com.mo.moplayer.ui.livetv

import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.animation.Animation
import android.view.animation.AnimationUtils
import android.widget.Toast
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.CategoryEntity
import com.mo.moplayer.data.local.entity.ChannelEntity
import com.mo.moplayer.data.local.entity.EpgEntity
import com.mo.moplayer.databinding.ActivityLiveTvBinding
import com.mo.moplayer.ui.common.BaseTvActivity
import com.mo.moplayer.ui.common.ContentMenuDetails
import com.mo.moplayer.ui.common.ContentMenuHelper
import com.mo.moplayer.util.PlayerLauncher
import com.mo.moplayer.ui.livetv.adapters.ChannelTiviMateAdapter
import com.mo.moplayer.ui.livetv.adapters.GroupAdapter
import com.mo.moplayer.util.NativeVlcLoader
import com.mo.moplayer.util.PlayerPreferences
import dagger.hilt.android.AndroidEntryPoint
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer

@AndroidEntryPoint
class LiveTvActivity : BaseTvActivity() {

    override val screenId: String = "livetv"

    companion object {
        const val EXTRA_CHANNEL_ID = "channel_id"
    }

    private lateinit var binding: ActivityLiveTvBinding
    private val viewModel: LiveTvViewModel by viewModels()

    private var libVLC: LibVLC? = null
    private var mediaPlayer: MediaPlayer? = null

    // Preview player for audio-only preview when browsing channels
    private var previewLibVLC: LibVLC? = null
    private var previewPlayer: MediaPlayer? = null
    private var previewChannel: ChannelEntity? = null
    private var isPreviewEnabled = true

    private lateinit var channelAdapter: ChannelTiviMateAdapter
    private lateinit var groupAdapter: GroupAdapter
    private val handler = Handler(Looper.getMainLooper())

    // Cached settings (loaded from PlayerPreferences early)
    private var vlcBufferMs: Int = PlayerPreferences.BUFFER_MEDIUM
    private var vlcHardwareAccelerationEnabled: Boolean = true
    private var vlcPlaybackProfile: Int = PlayerPreferences.PLAYBACK_PROFILE_BALANCED
    private val api24SafePlayerMode: Boolean
        get() = Build.VERSION.SDK_INT <= Build.VERSION_CODES.N

    // Throttle UI updates from VLC buffering callbacks
    private val BUFFERING_UI_THROTTLE_MS = 250L
    private var lastBufferingUiVisible: Boolean? = null
    private var lastBufferingUiUpdateAtMs: Long = 0L
    private var hasStartedPlayback = false

    @Inject lateinit var playerPreferences: com.mo.moplayer.util.PlayerPreferences

    @Inject lateinit var recyclerViewOptimizer: com.mo.moplayer.util.RecyclerViewOptimizer

    @Inject lateinit var networkErrorHandler: com.mo.moplayer.util.NetworkErrorHandler

    @Inject lateinit var repository: com.mo.moplayer.data.repository.IptvRepository

    // Preview delay handler to avoid loading preview immediately on focus
    private val previewDelayHandler = Handler(Looper.getMainLooper())
    private val PREVIEW_DELAY =
            800L // 800ms delay before starting preview (increased for performance)

    // Adapter update handler for debouncing
    private val adapterUpdateHandler = Handler(Looper.getMainLooper())
    private var pendingAdapterUpdate: Runnable? = null
    private val ADAPTER_UPDATE_DELAY = 100L // 100ms debounce for adapter updates

    private var overlayVisible = false
    private var channelInputBuffer = StringBuilder()
    private var channelInputTimeout: Runnable? = null

    private val OVERLAY_TIMEOUT = 15000L // Extended timeout for TiviMate style (15 seconds)
    private val CHANNEL_INPUT_TIMEOUT = 2000L
    private var overlayAutoHideEnabled = true // Can be disabled by user
    private var playbackArmed = false

    // Animations
    private lateinit var slideInAnimation: Animation
    private lateinit var slideOutAnimation: Animation
    private lateinit var fadeInAnimation: Animation
    private lateinit var fadeOutAnimation: Animation

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLiveTvBinding.inflate(layoutInflater)
        setContentView(binding.root)

        initAnimations()
        setupGroupList()
        setupChannelList()
        setupTouchSupport()
        startClockUpdate()

        // Check for direct channel navigation
        intent.getStringExtra(EXTRA_CHANNEL_ID)?.let { channelId ->
            playbackArmed = true
            viewModel.selectChannelById(channelId)
        }

        // Show hint briefly
        showHint()

        // Load player settings first, then initialize VLC and observers
        lifecycleScope.launch {
            loadPlayerSettings()
            observeViewModel()
        }
    }

    private suspend fun loadPlayerSettings() {
        vlcBufferMs = playerPreferences.bufferSize.first()
        vlcHardwareAccelerationEnabled = playerPreferences.hardwareAcceleration.first()
        vlcPlaybackProfile = playerPreferences.playbackProfile.first()
        isPreviewEnabled = playerPreferences.livePreviewEnabled.first() && !api24SafePlayerMode
    }

    private fun initAnimations() {
        slideInAnimation = AnimationUtils.loadAnimation(this, R.anim.overlay_slide_in)
        slideOutAnimation = AnimationUtils.loadAnimation(this, R.anim.overlay_slide_out)
        fadeInAnimation = AnimationUtils.loadAnimation(this, R.anim.fade_in)
        fadeOutAnimation = AnimationUtils.loadAnimation(this, R.anim.fade_out)

        slideOutAnimation.setAnimationListener(
                object : Animation.AnimationListener {
                    override fun onAnimationStart(animation: Animation?) {}
                    override fun onAnimationRepeat(animation: Animation?) {}
                    override fun onAnimationEnd(animation: Animation?) {
                        binding.fullScreenOverlay.visibility = View.GONE
                        binding.darkOverlay.visibility = View.GONE
                    }
                }
        )
    }

    private fun isRunningOnEmulator(): Boolean {
        return Build.FINGERPRINT.contains("generic", ignoreCase = true) ||
                Build.MODEL.contains("Emulator", ignoreCase = true) ||
                Build.MODEL.contains("Android SDK built for", ignoreCase = true) ||
                Build.HARDWARE.contains("goldfish", ignoreCase = true) ||
                Build.HARDWARE.contains("ranchu", ignoreCase = true) ||
                Build.PRODUCT.contains("sdk", ignoreCase = true)
    }

    private fun attachMainViewsIfNeeded() {
        if (mainViewsAttached || mediaPlayer == null || !isSurfaceReadyForMain) return
        try {
            mediaPlayer?.attachViews(binding.vlcVideoLayout, null, false, false)
            mainViewsAttached = true
        } catch (e: Exception) {
            android.util.Log.w("LiveTvActivity", "attachMainViewsIfNeeded failed: ${e.message}")
        }
    }

    private fun detachMainViewsIfNeeded() {
        if (!mainViewsAttached || mediaPlayer == null) return
        try {
            mediaPlayer?.detachViews()
        } catch (e: Exception) {
            android.util.Log.w("LiveTvActivity", "detachMainViewsIfNeeded failed: ${e.message}")
        } finally {
            mainViewsAttached = false
        }
    }

    private fun attachPreviewViewsIfNeeded() {
        if (previewViewsAttached || previewPlayer == null || !overlayVisible) return
        try {
            previewPlayer?.attachViews(binding.miniPreviewVlcLayout, null, false, false)
            previewViewsAttached = true
        } catch (e: Exception) {
            android.util.Log.w("LiveTvActivity", "attachPreviewViewsIfNeeded failed: ${e.message}")
        }
    }

    private fun detachPreviewViewsIfNeeded() {
        if (!previewViewsAttached || previewPlayer == null) return
        try {
            previewPlayer?.detachViews()
        } catch (e: Exception) {
            android.util.Log.w("LiveTvActivity", "detachPreviewViewsIfNeeded failed: ${e.message}")
        } finally {
            previewViewsAttached = false
        }
    }

    private var retryCount = 0
    private val MAX_RETRIES = 5 // Increased from 3 for better resilience
    private val RETRY_BACKOFF_MS = 2000L // Base backoff time
    private var currentChannel: ChannelEntity? = null
    private var activePlayRequestToken = 0L
    private var activePlaybackToken = 0L
    private var lastChannelSwitchStartedAtMs = 0L
    private var decoderFallbackCount = 0
    private var channelSwitchCount = 0

    private var mainViewsAttached = false
    private var previewViewsAttached = false
    private var isDestroying = false
    private var isSurfaceReadyForMain = true

    private var lastChannelFocusAtMs = 0L
    private val FAST_FOCUS_SCROLL_WINDOW_MS = 450L

    private fun initVLC() {
        try {
            val nativeVlc = NativeVlcLoader.ensureAvailable(this)
            if (!nativeVlc.available) {
                android.util.Log.e("LiveTvActivity", nativeVlc.message)
                showError(getString(R.string.error_player_init))
                return
            }

            val isEmulator = isRunningOnEmulator()
            // Keep startup fast enough while still stable.
            val cachingMs =
                    if (isEmulator) vlcBufferMs.coerceIn(1500, 4500)
                    else vlcBufferMs.coerceIn(2500, 12000)

            // Avoid aggressive thread counts on emulator.
            val cpuCores = Runtime.getRuntime().availableProcessors()
            val dynamicThreadCount =
                    if (isEmulator) cpuCores.coerceIn(2, 4) else (cpuCores * 2).coerceIn(6, 16)

            val codecOption =
                    if (vlcHardwareAccelerationEnabled) {
                        "--codec=mediacodec_ndk,mediacodec_jni,all"
                    } else {
                        "--codec=all"
                    }

            data class Quad(val a: String, val b: String, val c: String, val d: String)

            val (dropLateFramesOpt, skipFramesOpt, avcodecSkipFrameOpt, avcodecSkipIdctOpt) =
                    when (vlcPlaybackProfile) {
                        PlayerPreferences.PLAYBACK_PROFILE_QUALITY ->
                                Quad(
                                        "--no-drop-late-frames",
                                        "--no-skip-frames",
                                        "--avcodec-skip-frame=-1",
                                        "--avcodec-skip-idct=-1"
                                )
                        PlayerPreferences.PLAYBACK_PROFILE_PERFORMANCE ->
                                Quad(
                                        "--drop-late-frames",
                                        "--skip-frames",
                                        "--avcodec-skip-frame=1",
                                        "--avcodec-skip-idct=1"
                                )
                        else ->
                                Quad(
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

            // Multi-strategy initialization for compatibility with enhanced 4K and audio support
            val strategies =
                    listOf(
                            // Strategy 1: Minimal options (most compatible with x86)
                            Pair(
                                    "Minimal",
                                    optionsOf(
                                            "--aout=android_audiotrack",
                                            "--codec=all", // Support all audio codecs
                                            dropLateFramesOpt,
                                            skipFramesOpt,
                                            avcodecSkipFrameOpt,
                                            avcodecSkipIdctOpt
                                    )
                            ),
                            // Strategy 2: Basic with caching and audio codec support
                            Pair(
                                    "Basic",
                                    optionsOf(
                                            "--aout=android_audiotrack",
                                            "--no-audio-time-stretch",
                                            "--codec=all", // Support all audio codecs (AAC, AC3,
                                            // EAC3, MP3, etc.)
                                            dropLateFramesOpt,
                                            skipFramesOpt,
                                            avcodecSkipFrameOpt,
                                            avcodecSkipIdctOpt,
                                            "--network-caching=$cachingMs",
                                            "--live-caching=$cachingMs",
                                            "--file-caching=$cachingMs"
                                    )
                            ),
                            // Strategy 3: Enhanced 4K/8K support with hardware acceleration
                            Pair(
                                    "Enhanced4K",
                                    optionsOf(
                                            "--aout=android_audiotrack",
                                            "--no-audio-time-stretch",
                                            codecOption, // Hardware + software codecs (or software
                                            // only if HW disabled)
                                            dropLateFramesOpt,
                                            skipFramesOpt,
                                            avcodecSkipFrameOpt,
                                            avcodecSkipIdctOpt,
                                            "--network-caching=$cachingMs",
                                            "--live-caching=$cachingMs",
                                            "--file-caching=$cachingMs",
                                            "--avcodec-fast", // Fast processing
                                            "--avcodec-threads=$dynamicThreadCount", // Dynamic
                                            // multi-threaded decoding for 4K/8K
                                            "--no-spu",
                                            "--deinterlace=0",
                                            "--deinterlace-mode=blend",
                                            "--androidwindow-chroma=RV32"
                                    )
                            ),
                            // Strategy 4: Full options with maximum 4K/8K support (for real
                            // devices)
                            Pair(
                                    "Full",
                                    optionsOf(
                                            "--aout=android_audiotrack",
                                            "--no-audio-time-stretch",
                                            codecOption,
                                            dropLateFramesOpt,
                                            skipFramesOpt,
                                            avcodecSkipFrameOpt,
                                            avcodecSkipIdctOpt,
                                            "--network-caching=$cachingMs",
                                            "--live-caching=$cachingMs",
                                            "--file-caching=$cachingMs",
                                            "--avcodec-fast",
                                            "--avcodec-threads=$dynamicThreadCount", // Dynamic
                                            // multi-threaded decoding for 4K/8K
                                            "--no-spu",
                                            "--deinterlace=0",
                                            "--deinterlace-mode=blend",
                                            "--androidwindow-chroma=RV32"
                                    )
                            )
                    )

            var lastException: Throwable? = null

            for ((strategyName, options) in strategies) {
                try {
                    android.util.Log.d(
                            "LiveTvActivity",
                            "Trying VLC initialization strategy: $strategyName"
                    )
                    libVLC = LibVLC(this, options)
                    mediaPlayer = MediaPlayer(libVLC)
                    attachMainViewsIfNeeded()

                    mediaPlayer?.setEventListener { event ->
                        runOnUiThread {
                            if (isDestroying) return@runOnUiThread
                            val isActivePlayback = activePlaybackToken == activePlayRequestToken
                            if (!isActivePlayback) return@runOnUiThread
                            when (event.type) {
                                MediaPlayer.Event.Playing -> {
                                    hasStartedPlayback = true
                                    setLoadingOverlayVisible(false)
                                    binding.networkErrorView.hide()
                                    retryCount = 0
                                    val startupMs =
                                            SystemClock.uptimeMillis() -
                                                    lastChannelSwitchStartedAtMs
                                    android.util.Log.i(
                                            "LiveTvPerf",
                                            "first_frame_ms=$startupMs switches=$channelSwitchCount decoder_fallbacks=$decoderFallbackCount"
                                    )
                                    updateQualityIndicator()
                                }
                                MediaPlayer.Event.Buffering -> {
                                    setLoadingOverlayVisible(event.buffering < 100f && !hasStartedPlayback)
                                }
                                MediaPlayer.Event.EncounteredError -> {
                                    setLoadingOverlayVisible(false)
                                    handleStreamError()
                                }
                                MediaPlayer.Event.EndReached -> {
                                    handleStreamError()
                                }
                                MediaPlayer.Event.Vout -> {
                                    updateQualityIndicator()
                                }
                            }
                        }
                    }

                    android.util.Log.i(
                            "LiveTvActivity",
                            "VLC initialized successfully with strategy: $strategyName"
                    )
                    return // Success! Exit function
                } catch (e: Throwable) {
                    android.util.Log.w(
                            "LiveTvActivity",
                            "VLC initialization failed with strategy $strategyName: ${e.message}"
                    )
                    lastException = e
                    libVLC?.release()
                    libVLC = null
                    mediaPlayer = null
                    mainViewsAttached = false
                }
            }

            // All strategies failed
            android.util.Log.e(
                    "LiveTvActivity",
                    "All VLC initialization strategies failed",
                    lastException
            )
            runOnUiThread {
                android.widget.Toast.makeText(
                                this,
                                "Video player unavailable. Please use external player from settings.",
                                android.widget.Toast.LENGTH_LONG
                        )
                        .show()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            showError(getString(R.string.error_player_init))
        }
    }

    private fun handleStreamError() {
        if (retryCount < MAX_RETRIES && currentChannel != null) {
            retryCount++
            decoderFallbackCount++

            // Exponential backoff: 2s, 4s, 8s, 16s, 32s
            val backoffDelay = RETRY_BACKOFF_MS * (1L shl (retryCount - 1))
            val maxDelay = 10000L // Cap at 10 seconds
            val delay = backoffDelay.coerceAtMost(maxDelay)

            android.util.Log.d(
                    "LiveTvActivity",
                    "Retry attempt $retryCount/$MAX_RETRIES after ${delay}ms"
            )

            handler.postDelayed(
                    {
                        // Check network before retrying
                        if (isNetworkAvailable()) {
                            currentChannel?.let { playChannel(it) }
                        } else {
                            setLoadingOverlayVisible(false)
                            showError("No network connection. Check your internet.")
                        }
                    },
                    delay
            )
        } else {
            showError(getString(R.string.error_stream_failed))
            retryCount = 0 // Reset for next channel
        }
    }

    /** Check if network is available before retrying */
    private fun isNetworkAvailable(): Boolean {
        val connectivityManager =
                getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork
        val capabilities = connectivityManager.getNetworkCapabilities(network)
        return capabilities != null &&
                (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                        capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                        capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET))
    }

    /**
     * تهيئة مشغل معاينة الفيديو (مع دعم الصوت ولكن مكتوم افتراضياً) Initialize the video preview
     * player (with audio support but muted by default)
     */
    private fun initPreviewPlayer() {
        try {
            val nativeVlc = NativeVlcLoader.ensureAvailable(this)
            if (!nativeVlc.available) {
                android.util.Log.w("LiveTvActivity", "Preview disabled: ${nativeVlc.message}")
                isPreviewEnabled = false
                return
            }

            // Lightweight preview options: video-only, no stats, small buffer
            val previewCachingMs = minOf(vlcBufferMs, 1000).coerceAtLeast(300)
            val options =
                    arrayListOf(
                            "--quiet",
                            "--no-audio",
                            "--no-stats",
                            "--no-video-title-show",
                            "--network-caching=$previewCachingMs",
                            "--live-caching=$previewCachingMs",
                            "--no-spu",
                            "--avcodec-fast"
                    )

            try {
                previewLibVLC = LibVLC(this, options)
                previewPlayer = MediaPlayer(previewLibVLC)
                previewViewsAttached = false
            } catch (e: Exception) {
                e.printStackTrace()
                // Failed to create preview player - disable preview
                previewLibVLC = null
                previewPlayer = null
                return
            }

            // Attach to the VLCVideoLayout for video preview
            attachPreviewViewsIfNeeded()

            previewPlayer?.setEventListener { event ->
                runOnUiThread {
                    when (event.type) {
                        MediaPlayer.Event.Playing -> {
                            binding.previewLoading.visibility = View.GONE
                            binding.noPreviewPlaceholder.visibility = View.GONE
                        }
                        MediaPlayer.Event.Buffering -> {
                            if (event.buffering < 100f) {
                                binding.previewLoading.visibility = View.VISIBLE
                            } else {
                                binding.previewLoading.visibility = View.GONE
                            }
                        }
                        MediaPlayer.Event.EncounteredError -> {
                            binding.previewLoading.visibility = View.GONE
                            binding.noPreviewPlaceholder.visibility = View.VISIBLE
                        }
                    }
                }
            }

            // كتم صوت المعاينة: فيديو فقط بدون صوت لتجنب التضارب مع المشغل الرئيسي
            // Mute preview player - video only, no audio to avoid interference with main player
            previewPlayer?.setVolume(0)
        } catch (e: Exception) {
            android.util.Log.w("LiveTvActivity", "Preview player init skipped: ${e.message}")
            releasePreviewPlayer()
            isPreviewEnabled = false
        }
    }

    /**
     * بدء معاينة الفيديو لقناة (عند التركيز عليها في القائمة) - مع دعم الصوت (مكتوم افتراضياً)
     * Start video preview for a channel (when focused in the list) - with audio support (muted by
     * default)
     */
    private fun startVideoPreview(channel: ChannelEntity) {
        if (!isPreviewEnabled) {
            stopVideoPreview()
            return
        }

        val now = SystemClock.uptimeMillis()
        if (now - lastChannelFocusAtMs < FAST_FOCUS_SCROLL_WINDOW_MS) {
            // Fast scrolling: skip preview startup to reduce decoder churn.
            return
        }

        // Ensure overlay is visible for preview
        if (!overlayVisible) {
            return
        }

        // Ensure preview container is visible
        binding.miniPreviewContainer.visibility = View.VISIBLE
        binding.miniPreviewVlcLayout.visibility = View.VISIBLE

        // Don't preview the currently playing channel
        if (channel.channelId == currentChannel?.channelId) {
            stopVideoPreview()
            return
        }

        // Don't restart if same channel
        if (channel.channelId == previewChannel?.channelId && previewPlayer?.isPlaying == true) {
            return
        }

        // Cancel any pending preview
        previewDelayHandler.removeCallbacksAndMessages(null)

        // Delay preview start to avoid loading on quick scrolling
        previewDelayHandler.postDelayed(
                {
                    if (!isPreviewEnabled || !overlayVisible) return@postDelayed
                    try {
                        previewChannel = channel

                        if (previewLibVLC == null) {
                            initPreviewPlayer()
                        }

                        // Check if preview player initialized successfully
                        if (previewLibVLC == null) {
                            binding.previewLoading.visibility = View.GONE
                            binding.noPreviewPlaceholder.visibility = View.VISIBLE
                            return@postDelayed
                        }

                        previewPlayer?.stop()
                        binding.previewLoading.visibility = View.VISIBLE
                        binding.noPreviewPlaceholder.visibility = View.GONE

                        val media = Media(previewLibVLC, Uri.parse(primaryLivePlaybackUrl(channel)))
                        media.addOption(":network-caching=500")
                        media.addOption(":live-caching=500")
                        media.addOption(":codec=all") // دعم جميع قوانين الصوت

                        previewPlayer?.media = media
                        media.release()

                        // Ensure views are attached before playing
                        attachPreviewViewsIfNeeded()

                        previewPlayer?.play()

                        // كتم الصوت بعد بدء التشغيل (لتجنب التضارب مع المشغل الرئيسي)
                        // يمكن تفعيل الصوت لاحقاً إذا رغب المستخدم
                        previewPlayer?.setVolume(0)
                    } catch (e: Exception) {
                        android.util.Log.e("LiveTvActivity", "Preview playback error: ${e.message}")
                        binding.previewLoading.visibility = View.GONE
                        binding.noPreviewPlaceholder.visibility = View.VISIBLE

                        // Retry mechanism for preview
                        handler.postDelayed(
                                {
                                    if (isPreviewEnabled &&
                                                    previewChannel?.channelId == channel.channelId &&
                                                    overlayVisible
                                    ) {
                                        android.util.Log.d(
                                                "LiveTvActivity",
                                                "Retrying preview for channel: ${channel.name}"
                                        )
                                        startVideoPreview(channel)
                                    }
                                },
                                2000
                        ) // Retry after 2 seconds
                    }
                },
                PREVIEW_DELAY
        )
    }

    /** Stop the video preview and properly clean up */
    private fun stopVideoPreview() {
        previewDelayHandler.removeCallbacksAndMessages(null)
        try {
            // Stop playback
            previewPlayer?.stop()

            // Detach views to clear the rendering surface
            detachPreviewViewsIfNeeded()

            // Clear reference
            previewChannel = null

            // Hide preview UI elements
            binding.previewLoading.visibility = View.GONE
            binding.noPreviewPlaceholder.visibility = View.VISIBLE

            // Explicitly hide the preview container to ensure it's not visible
            binding.miniPreviewContainer.visibility = View.GONE
        } catch (e: Exception) {
            android.util.Log.e("LiveTvActivity", "Error stopping preview", e)
        }
    }

    /**
     * Clear and reset the preview surface completely Called when hiding overlay or changing
     * channels to prevent stuck preview
     */
    private fun clearPreviewSurface() {
        try {
            // Stop and detach preview player
            stopVideoPreview()

            // Re-attach views after a short delay to reset the surface (only if overlay is visible)
            if (overlayVisible) {
                handler.postDelayed(
                        {
                            try {
                                if (previewLibVLC != null && previewPlayer != null && overlayVisible
                                ) {
                                    attachPreviewViewsIfNeeded()
                                    previewPlayer?.setVolume(0) // Ensure muted
                                }
                            } catch (e: Exception) {
                                android.util.Log.e(
                                        "LiveTvActivity",
                                        "Error re-attaching preview",
                                        e
                                )
                            }
                        },
                        100
                )
            }
        } catch (e: Exception) {
            android.util.Log.e("LiveTvActivity", "Error clearing preview surface", e)
        }
    }

    // Keep backward compatibility aliases
    private fun startAudioPreview(channel: ChannelEntity) = startVideoPreview(channel)
    private fun stopAudioPreview() = stopVideoPreview()

    private fun showError(message: String) {
        setLoadingOverlayVisible(false)
        android.widget.Toast.makeText(this, message, android.widget.Toast.LENGTH_SHORT).show()
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

    /**
     * Get adaptive buffer size based on network connection type. WiFi/Ethernet: use configured
     * buffer Mobile: use 1.5x buffer for stability Unknown/Slow: use 2x buffer for maximum
     * stability
     */
    private fun getAdaptiveBufferMs(): Int {
        val connectivityManager =
                getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork
        val capabilities = connectivityManager.getNetworkCapabilities(network)

        return when {
            capabilities == null -> vlcBufferMs * 2 // No connection info, use maximum buffer
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) ->
                    vlcBufferMs // Best connection
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ->
                    vlcBufferMs // Good connection
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

    private fun updateQualityIndicator() {
        val videoTrack = mediaPlayer?.currentVideoTrack
        if (videoTrack != null) {
            val height = videoTrack.height
            val qualityText =
                    when {
                        height >= 2160 -> "4K"
                        height >= 1440 -> "2K"
                        height >= 1080 -> "FHD"
                        height >= 720 -> "HD"
                        height >= 480 -> "SD"
                        else -> null
                    }

            if (qualityText != null) {
                // Update quality in overlay panel
                binding.tvQuality.text = qualityText
                binding.tvQuality.visibility = View.VISIBLE

                // Update quality in info bar
                binding.tvInfoBarQuality.text = qualityText
                binding.tvInfoBarQuality.visibility = View.VISIBLE

                // Color based on quality
                val bgColor =
                        when (qualityText) {
                            "4K" -> ContextCompat.getColor(this, R.color.htc_accent_gold)
                            "2K", "FHD" -> ContextCompat.getColor(this, R.color.htc_accent_green)
                            else -> ContextCompat.getColor(this, R.color.htc_text_tertiary)
                        }
                binding.tvQuality.setBackgroundColor(bgColor)
                binding.tvInfoBarQuality.setBackgroundColor(bgColor)
            } else {
                binding.tvQuality.visibility = View.GONE
                binding.tvInfoBarQuality.visibility = View.GONE
            }
        }
    }

    private fun setupGroupList() {
        groupAdapter =
                GroupAdapter(
                        onGroupClick = { category ->
                            viewModel.selectCategory(category?.categoryId)
                            binding.tvCurrentCategory.text =
                                    category?.name ?: getString(R.string.all_categories)
                            // Focus on first channel after selecting group with delay for data
                            // loading
                            binding.rvChannels.postDelayed(
                                    {
                                        if (channelAdapter.itemCount > 0) {
                                            binding.rvChannels.scrollToPosition(0)
                                            binding.rvChannels
                                                    .findViewHolderForAdapterPosition(0)
                                                    ?.itemView
                                                    ?.requestFocus()
                                        }
                                    },
                                    150
                            )
                            resetOverlayTimeout()
                        },
                        onGroupFocused = { resetOverlayTimeout() }
                )

        binding.rvGroups.apply {
            // Use SafeLinearLayoutManager to handle view hierarchy errors gracefully
            layoutManager = SafeLinearLayoutManager(this@LiveTvActivity)
            adapter = groupAdapter
            recyclerViewOptimizer.optimizeVerticalList(this)

            // Disable animations to prevent conflicts during rapid updates
            itemAnimator = null

            // Performance optimizations for TV
            isNestedScrollingEnabled = false // Disable nested scrolling for better performance
            overScrollMode = View.OVER_SCROLL_NEVER // Disable overscroll effect

            // Standard configuration
            isFocusable = true
            isFocusableInTouchMode = true
            descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS
            clipToPadding = false
            clipChildren = false
            setHasFixedSize(true)
        }
    }

    private fun setupChannelList() {
        channelAdapter =
                ChannelTiviMateAdapter(
                        onChannelClick = { channel ->
                            // Stop preview before selecting channel
                            stopAudioPreview()
                            playbackArmed = true
                            viewModel.selectChannel(channel)
                            hideOverlay()
                        },
                        onChannelFocused = { channel ->
                            lastChannelFocusAtMs = SystemClock.uptimeMillis()
                            // Update preview panel with focused channel info
                            updatePreviewPanel(channel)
                            resetOverlayTimeout()
                        },
                        onFavoriteClick = { channel ->
                            viewModel.toggleFavorite()
                            resetOverlayTimeout()
                        },
                        onChannelLongClick = { channel ->
                            showContextMenu(channel)
                            resetOverlayTimeout()
                        },
                        themeManager = themeManager
                )

        binding.rvChannels.apply {
            // Use SafeLinearLayoutManager to handle view hierarchy errors gracefully
            layoutManager = SafeLinearLayoutManager(this@LiveTvActivity)
            adapter = channelAdapter
            recyclerViewOptimizer.optimizeChannelList(this)

            // Disable animations to prevent conflicts during rapid updates
            itemAnimator = null

            // Performance optimizations for TV
            isNestedScrollingEnabled = false // Disable nested scrolling for better performance
            overScrollMode = View.OVER_SCROLL_NEVER // Disable overscroll effect

            // Standard configuration
            isFocusable = true
            isFocusableInTouchMode = true
            descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS
            clipToPadding = false
            clipChildren = false
            setHasFixedSize(true)

            // Enable drawing cache for better performance (deprecated but still useful on older
            // devices)
            try {
                @Suppress("DEPRECATION") isDrawingCacheEnabled = true
            } catch (e: Exception) {
                // Ignore if not supported
            }
        }
    }

    private fun setupTouchSupport() {
        // Add click listener to video layout to toggle overlay when screen is tapped
        // This allows touch-enabled TVs and tablets to show the menu without a remote
        binding.vlcVideoLayout.setOnClickListener {
            if (!overlayVisible) {
                toggleOverlay()
            }
        }

        // Click on dark overlay to hide the menu
        // This provides an intuitive way to dismiss the overlay by tapping outside the panels
        binding.darkOverlay.setOnClickListener {
            if (overlayVisible) {
                hideOverlay()
            }
        }

        // Prevent clicks on the overlay panels from closing the overlay
        // This allows interaction with channel and group lists
        binding.fullScreenOverlay.setOnClickListener {
            // Consume click to prevent it from propagating to darkOverlay
            // Keep overlay visible when clicking inside the panels
            resetOverlayTimeout()
        }
    }

    private fun updatePreviewPanel(channel: ChannelEntity) {
        // Update channel logo in preview with optimizations
        if (!channel.streamIcon.isNullOrEmpty()) {
            Glide.with(this)
                    .load(channel.streamIcon)
                    .thumbnail(0.1f)
                    .override(80, 80)
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .dontAnimate()
                    .placeholder(R.drawable.ic_placeholder_channel)
                    .error(R.drawable.ic_placeholder_channel)
                    .into(binding.ivPreviewLogo)

            Glide.with(this)
                    .load(channel.streamIcon)
                    .thumbnail(0.1f)
                    .override(60, 45)
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .dontAnimate()
                    .placeholder(R.drawable.ic_placeholder_channel)
                    .error(R.drawable.ic_placeholder_channel)
                    .into(binding.ivChannelLogo)
        } else {
            binding.ivPreviewLogo.setImageResource(R.drawable.ic_placeholder_channel)
            binding.ivChannelLogo.setImageResource(R.drawable.ic_placeholder_channel)
        }

        // Update channel number and name
        val channelIndex = viewModel.filteredChannels.value?.indexOf(channel)?.plus(1) ?: 1
        binding.tvChannelNumber.text = channelIndex.toString()
        binding.tvChannelName.text = channel.name

        // Load EPG for focused channel
        viewModel.loadEpgForChannel(channel)

        // Ensure preview container is visible
        if (overlayVisible) {
            binding.miniPreviewContainer.visibility =
                    if (isPreviewEnabled) View.VISIBLE else View.GONE
        }

        // Start video preview for this channel with debouncing
        startVideoPreview(channel)
    }

    /**
     * Safely update the adapter with a new list and current channel ID. Waits if RecyclerView is
     * computing layout to prevent view hierarchy crashes. Uses debouncing to avoid rapid updates.
     */
    private fun safelyUpdateAdapter(list: List<ChannelEntity>?, channelId: String?) {
        // Cancel any pending update
        pendingAdapterUpdate?.let { adapterUpdateHandler.removeCallbacks(it) }

        // Create new update runnable
        pendingAdapterUpdate = Runnable {
            // Wait if RecyclerView is computing layout
            if (binding.rvChannels.isComputingLayout) {
                binding.rvChannels.post {
                    channelAdapter.submitListWithCurrentChannel(list, channelId)
                }
            } else {
                channelAdapter.submitListWithCurrentChannel(list, channelId)
            }
            pendingAdapterUpdate = null
        }

        // Post with debounce delay
        pendingAdapterUpdate?.let { adapterUpdateHandler.postDelayed(it, ADAPTER_UPDATE_DELAY) }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            viewModel.networkError.collect { error ->
                binding.networkErrorView.let { errorView ->
                    if (error != null) {
                        setLoadingOverlayVisible(false)
                        errorView.setListener(
                                object :
                                        com.mo.moplayer.ui.common.LoadingStateView.LoadingStateListener {
                                    override fun onRetryClicked() {
                                        viewModel.retry()
                                    }
                                }
                        )
                        errorView.showError(
                                title = getString(R.string.error_connection),
                                message = networkErrorHandler.getErrorMessage(error),
                                showRetry = error.isRetryable
                        )
                    } else {
                        errorView.hide()
                    }
                }
            }
        }

        viewModel.categories.observe(this) { categories ->
            groupAdapter.submitGroupList(categories, viewModel.categoryCounts.value.orEmpty())

            if (overlayVisible && !binding.rvGroups.hasFocus() && !binding.rvChannels.hasFocus()) {
                binding.rvGroups.post {
                    binding.rvGroups.getChildAt(0)?.requestFocus()
                }
            }
        }

        viewModel.categoryCounts.observe(this) { counts ->
            groupAdapter.submitGroupList(viewModel.categories.value.orEmpty(), counts)
        }

        viewModel.filteredChannels.observe(this) { channels ->
            // Use safe wrapper to prevent view hierarchy crashes during rapid updates
            safelyUpdateAdapter(channels, viewModel.currentChannel.value?.channelId)

            // Update channel count badge
            binding.tvChannelCount.text = getString(R.string.channel_count_format, channels.size)

            if (viewModel.isLoading.value != true && channels.isEmpty()) {
                binding.networkErrorView.showEmpty(
                        title = getString(R.string.live_tv_empty_title),
                        message = getString(R.string.live_tv_empty_subtitle),
                        iconRes = R.drawable.ic_live_tv
                )
            } else if (binding.networkErrorView.getCurrentState() == com.mo.moplayer.ui.common.LoadingStateView.State.EMPTY) {
                binding.networkErrorView.hide()
            }

            if (overlayVisible && channels.isNotEmpty() && binding.rvChannels.hasFocus()) {
                val safeIdx = (viewModel.filteredChannelIndex.value ?: 0).coerceIn(0, channels.lastIndex)
                binding.rvChannels.post {
                    binding.rvChannels.scrollToPosition(safeIdx)
                    binding.rvChannels.findViewHolderForAdapterPosition(safeIdx)?.itemView?.requestFocus()
                }
            }
        }

        viewModel.currentChannel.observe(this) { channel ->
            channel?.let {
                updateChannelInfo(it)
                if (playbackArmed) {
                    playChannel(it)
                } else {
                    showOverlay()
                }
                // Re-submit list to trigger DiffUtil change detection for playing state
                // Use safe wrapper to prevent crashes during rapid channel switching
                safelyUpdateAdapter(viewModel.filteredChannels.value, it.channelId)
            }
        }

        viewModel.selectedCategory.observe(this) { categoryId ->
            groupAdapter.setSelectedGroupId(categoryId)

            val categoryName =
                    viewModel.categories.value?.find { it.categoryId == categoryId }?.name
                            ?: getString(R.string.all_categories)
            binding.tvCurrentCategory.text = categoryName
        }

        viewModel.isLoading.observe(this) { isLoading ->
            binding.loadingOverlay.visibility = if (isLoading) View.VISIBLE else View.GONE
        }

        // Observe EPG changes
        viewModel.currentEpg.observe(this) { epg -> updateEpgDisplay(epg, viewModel.nextEpg.value) }

        viewModel.nextEpg.observe(this) { nextEpg ->
            updateEpgDisplay(viewModel.currentEpg.value, nextEpg)
        }
    }

    private fun updateEpgDisplay(currentEpg: EpgEntity?, nextEpg: EpgEntity?) {
        if (currentEpg != null) {
            // Update overlay panel
            binding.tvNowPlaying.text = currentEpg.title
            binding.tvNowTime.text = currentEpg.getTimeRangeString()
            binding.epgProgressBar.visibility = View.VISIBLE
            binding.epgProgressBar.progress = currentEpg.getProgressPercentage()

            // Update info bar
            binding.tvInfoBarNowPlaying.text = currentEpg.title
        } else {
            binding.tvNowPlaying.text = getString(R.string.live_tv_no_epg)
            binding.tvNowTime.text = ""
            binding.epgProgressBar.visibility = View.GONE
            binding.tvInfoBarNowPlaying.text = ""
        }

        if (nextEpg != null) {
            binding.tvNextProgram.text = nextEpg.title
            binding.tvNextTime.text = nextEpg.getStartTimeFormatted()
        } else {
            binding.tvNextProgram.text = ""
            binding.tvNextTime.text = ""
        }
    }

    private fun playChannel(channel: ChannelEntity) {
        try {
            if (channel.channelId != currentChannel?.channelId) {
                retryCount = 0
            }
            val requestToken = ++activePlayRequestToken
            activePlaybackToken = requestToken
            channelSwitchCount++
            lastChannelSwitchStartedAtMs = SystemClock.uptimeMillis()
            currentChannel = channel
            binding.loadingOverlay.visibility = View.VISIBLE
            hasStartedPlayback = false
            binding.networkErrorView.hide()

            // Stop and clear preview to avoid conflicts
            clearPreviewSurface()

            // Stop any existing playback
            mediaPlayer?.stop()

            if (libVLC == null) {
                initVLC()
            }

            // Check if LibVLC is still null after init (failed to initialize)
            if (libVLC == null) {
                binding.loadingOverlay.visibility = View.GONE
                android.widget.Toast.makeText(
                                this,
                                "Video player not available. Please restart the app.",
                                android.widget.Toast.LENGTH_LONG
                        )
                        .show()
                return
            }

            val media = Media(libVLC, Uri.parse(livePlaybackUrlForAttempt(channel)))

            // Enable hardware decoding for 4K/8K support with fallback
            media.setHWDecoderEnabled(vlcHardwareAccelerationEnabled, false)

            val isEmulator = isRunningOnEmulator()
            // Dynamic thread count for 4K/8K performance
            val cpuCores = Runtime.getRuntime().availableProcessors()
            val dynamicThreads =
                    if (isEmulator) cpuCores.coerceIn(2, 4) else (cpuCores * 2).coerceIn(6, 16)

            // Use adaptive buffering based on network type for smooth 4K/8K streaming
            val adaptiveBuffer = getAdaptiveBufferMs()
            val cachingMs =
                    if (isEmulator) adaptiveBuffer.coerceIn(1200, 4500)
                    else adaptiveBuffer.coerceIn(2500, 12000)
            media.addOption(":network-caching=$cachingMs")
            media.addOption(":live-caching=$cachingMs")
            media.addOption(":file-caching=$cachingMs")

            // 4K/8K quality support options with dynamic threading
            media.addOption(":avcodec-fast")
            if (vlcHardwareAccelerationEnabled) {
                media.addOption(":avcodec-hw=any") // Use hardware decoder when available
            }
            media.addOption(":avcodec-threads=$dynamicThreads") // Dynamic threads for 4K/8K

            // Quality preservation options for high-resolution streams
            media.addOption(":avcodec-skip-frame=0") // Don't skip frames for quality
            media.addOption(":avcodec-skip-idct=0") // Don't skip IDCT for quality

            // Enhanced live stream options for smoother 4K/8K playback
            media.addOption(":clock-jitter=0") // Tolerant clock jitter
            media.addOption(":clock-synchro=0") // Tolerant sync for IPTV
            media.addOption(":no-audio-time-stretch") // Avoid audio pitch issues
            media.addOption(":http-reconnect") // Auto reconnect on HTTP streams
            media.addOption(if (isEmulator) ":prefetch-buffer-size=2097152" else ":prefetch-buffer-size=6291456")

            attachMainViewsIfNeeded()
            if (requestToken != activePlayRequestToken) {
                media.release()
                return
            }
            mediaPlayer?.media = media
            media.release()
            mediaPlayer?.play()
        } catch (e: Exception) {
            e.printStackTrace()
            binding.loadingOverlay.visibility = View.GONE
            showError(getString(R.string.error_stream_failed))
        }
    }

    private fun primaryLivePlaybackUrl(channel: ChannelEntity): String =
            livePlaybackUrl(channel.streamUrl, attempt = 0)

    private fun livePlaybackUrlForAttempt(channel: ChannelEntity): String =
            livePlaybackUrl(channel.streamUrl, attempt = retryCount)

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

    private fun updateChannelInfo(channel: ChannelEntity) {
        val channelIndex = viewModel.currentChannelIndex.value?.plus(1) ?: 1

        // Update overlay panel info
        binding.tvChannelNumber.text = channelIndex.toString()
        binding.tvChannelName.text = channel.name
        binding.tvNowPlaying.text = "" // EPG info would go here

        // Update info bar (when overlay is hidden)
        binding.tvInfoBarNumber.text = channelIndex.toString()
        binding.tvInfoBarName.text = channel.name
        binding.tvInfoBarNowPlaying.text = "" // EPG info would go here

        // Load channel logo for both overlay and info bar with optimizations
        if (!channel.streamIcon.isNullOrEmpty()) {
            Glide.with(this)
                    .load(channel.streamIcon)
                    .thumbnail(0.1f)
                    .override(60, 45)
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .dontAnimate()
                    .placeholder(R.drawable.ic_placeholder_channel)
                    .error(R.drawable.ic_placeholder_channel)
                    .into(binding.ivChannelLogo)

            Glide.with(this)
                    .load(channel.streamIcon)
                    .thumbnail(0.1f)
                    .override(90, 70)
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .dontAnimate()
                    .placeholder(R.drawable.ic_placeholder_channel)
                    .error(R.drawable.ic_placeholder_channel)
                    .into(binding.ivInfoBarLogo)

            Glide.with(this)
                    .load(channel.streamIcon)
                    .thumbnail(0.1f)
                    .override(80, 80)
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .dontAnimate()
                    .placeholder(R.drawable.ic_placeholder_channel)
                    .error(R.drawable.ic_placeholder_channel)
                    .into(binding.ivPreviewLogo)
        } else {
            binding.ivChannelLogo.setImageResource(R.drawable.ic_placeholder_channel)
            binding.ivInfoBarLogo.setImageResource(R.drawable.ic_placeholder_channel)
            binding.ivPreviewLogo.setImageResource(R.drawable.ic_placeholder_channel)
        }
    }

    private fun showHint() {
        binding.tvHint.visibility = View.VISIBLE
        handler.postDelayed({ binding.tvHint.visibility = View.GONE }, 3000)
    }

    private fun showContextMenu(channel: ChannelEntity) {
        lifecycleScope.launch {
            val server = repository.getActiveServerSync() ?: return@launch
            val isFav = repository.isFavorite(server.id, channel.channelId).first()
            val (current, next) = viewModel.getEpgForChannel(channel)
            val details = buildLiveChannelMenuDetails(current, next)

            val extras =
                    Bundle().apply {
                        putString(
                                com.mo.moplayer.ui.player.PlayerActivity.EXTRA_TYPE,
                                "CHANNEL"
                        )
                        putString(
                                com.mo.moplayer.ui.player.PlayerActivity.EXTRA_CONTENT_ID,
                                channel.channelId
                        )
                        putString(
                                com.mo.moplayer.ui.player.PlayerActivity.EXTRA_POSTER_URL,
                                channel.streamIcon
                        )
                    }

            ContentMenuHelper(this@LiveTvActivity)
                    .showContentMenu(
                            title = channel.name,
                            thumbnailUrl = channel.streamIcon,
                            isFavorite = isFav,
                            details = details,
                            onPlay = {
                                playbackArmed = true
                                viewModel.selectChannel(channel)
                                hideOverlay()
                            },
                            onToggleFavorite = {
                                lifecycleScope.launch {
                                    repository.toggleFavorite(
                                            serverId = server.id,
                                            contentId = channel.channelId,
                                            contentType = "channel",
                                            name = channel.name,
                                            iconUrl = channel.streamIcon
                                    )
                                }
                            },
                            onInfo = {
                                val msg =
                                        buildString {
                                            append(channel.name)
                                            current?.let {
                                                append("\n\n")
                                                append(it.title)
                                                append("\n")
                                                append(it.getTimeRangeString())
                                            }
                                        }
                                Toast.makeText(this@LiveTvActivity, msg, Toast.LENGTH_LONG).show()
                            },
                            onChoosePlayer = {
                                PlayerLauncher.showPlayerSelectionDialog(
                                        this@LiveTvActivity,
                                        playerPreferences,
                                        channel.streamUrl,
                                        channel.name,
                                        extras
                                )
                            }
                    )
        }
    }

    private fun buildLiveChannelMenuDetails(
            current: EpgEntity?,
            next: EpgEntity?
    ): ContentMenuDetails? {
        if (current == null && next == null) return null
        val sb = StringBuilder()
        current?.let {
            sb.appendLine(it.title)
            sb.appendLine(it.getTimeRangeString())
            val desc = it.description?.trim().orEmpty()
            if (desc.isNotEmpty()) {
                sb.appendLine(if (desc.length > 280) desc.take(277) + "…" else desc)
            }
        }
        next?.let {
            if (sb.isNotEmpty()) sb.appendLine()
            sb.appendLine("→ ${it.title}")
            sb.append(it.getStartTimeFormatted())
        }
        val text = sb.toString().trim()
        return if (text.isEmpty()) null else ContentMenuDetails(description = text)
    }

    private fun toggleOverlay() {
        if (overlayVisible) {
            hideOverlay()
        } else {
            showOverlay()
        }
    }

    private fun showOverlay() {
        overlayVisible = true
        binding.tvHint.visibility = View.GONE
        binding.channelInfoBar.visibility = View.GONE

        // Show dark overlay with fade
        binding.darkOverlay.visibility = View.VISIBLE
        binding.darkOverlay.startAnimation(fadeInAnimation)

        // Show full screen overlay with slide animation
        binding.fullScreenOverlay.visibility = View.VISIBLE
        binding.fullScreenOverlay.startAnimation(slideInAnimation)

        // Make preview container visible again for browsing
        if (isPreviewEnabled) {
            binding.miniPreviewContainer.visibility = View.VISIBLE
            binding.miniPreviewVlcLayout.visibility = View.VISIBLE
        } else {
            binding.miniPreviewContainer.visibility = View.GONE
        }

        // Focus on groups first (TiviMate style - left panel first)
        binding.rvGroups.post {
            val selectedCategoryId = viewModel.selectedCategory.value
            val categoryIndex =
                    if (selectedCategoryId == null) {
                        0
                    } else {
                        viewModel.categories.value
                                ?.indexOfFirst { it.categoryId == selectedCategoryId }
                                ?.takeIf { it >= 0 }
                                ?: 0
                    }
            binding.rvGroups.scrollToPosition(categoryIndex)
            binding.rvGroups
                    .findViewHolderForAdapterPosition(categoryIndex)
                    ?.itemView
                    ?.requestFocus()
        }

        // Scroll channel list to current channel within the *filtered* list (not global index)
        val filteredList = viewModel.filteredChannels.value
        val filteredIdx = viewModel.filteredChannelIndex.value ?: 0
        val safeIdx =
                if (filteredList.isNullOrEmpty()) 0
                else filteredIdx.coerceIn(0, filteredList.size - 1)
        binding.rvChannels.scrollToPosition(safeIdx)

        // Update preview panel with current channel
        viewModel.currentChannel.value?.let { updatePreviewPanel(it) }

        resetOverlayTimeout()
    }

    private fun hideOverlay() {
        overlayVisible = false
        handler.removeCallbacks(hideOverlayRunnable)

        // Stop and clear preview completely to prevent stuck preview
        clearPreviewSurface()

        // Ensure preview container is hidden immediately
        binding.miniPreviewContainer.visibility = View.GONE

        // Animate out
        binding.fullScreenOverlay.startAnimation(slideOutAnimation)
        binding.darkOverlay.startAnimation(fadeOutAnimation)
    }

    private fun resetOverlayTimeout() {
        handler.removeCallbacks(hideOverlayRunnable)
        if (overlayAutoHideEnabled) {
            handler.postDelayed(hideOverlayRunnable, OVERLAY_TIMEOUT)
        }
    }

    /** Toggle auto-hide for the overlay (can be called from settings or menu) */
    fun setOverlayAutoHide(enabled: Boolean) {
        overlayAutoHideEnabled = enabled
        if (!enabled) {
            handler.removeCallbacks(hideOverlayRunnable)
        } else if (overlayVisible) {
            resetOverlayTimeout()
        }
    }

    private val hideOverlayRunnable = Runnable { hideOverlay() }

    private fun startClockUpdate() {
        handler.post(clockRunnable)
    }

    private val clockRunnable =
            object : Runnable {
                override fun run() {
                    val time = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
                    binding.tvClock.text = time
                    binding.tvInfoBarClock.text = time
                    // No seconds shown; update less frequently to reduce UI churn on TV devices.
                    handler.postDelayed(this, 30000)
                }
            }

    private fun handleChannelNumberInput(digit: Int) {
        channelInputBuffer.append(digit)
        binding.tvChannelInput.text = channelInputBuffer.toString()
        binding.channelInputContainer.visibility = View.VISIBLE

        // Cancel previous timeout
        channelInputTimeout?.let { handler.removeCallbacks(it) }

        // Set new timeout
        channelInputTimeout = Runnable {
            val channelNumber = channelInputBuffer.toString().toIntOrNull()
            if (channelNumber != null) {
                playbackArmed = true
                viewModel.selectChannelByNumber(channelNumber)
            }
            channelInputBuffer.clear()
            binding.channelInputContainer.visibility = View.GONE
        }
        channelInputTimeout?.let { handler.postDelayed(it, CHANNEL_INPUT_TIMEOUT) }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_MENU -> {
                if (overlayVisible && currentChannel != null) {
                    currentChannel?.let { channel -> showContextMenu(channel) }
                    return true
                } else {
                    startActivity(
                            Intent(this, com.mo.moplayer.ui.settings.SettingsActivity::class.java)
                    )
                    return true
                }
            }
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> {
                if (!overlayVisible) {
                    toggleOverlay()
                    return true
                }
                // When overlay is visible, let the focused item handle the click
                resetOverlayTimeout()
            }
            KeyEvent.KEYCODE_DPAD_UP -> {
                if (!overlayVisible) {
                    viewModel.previousChannel()
                    showChannelInfoBriefly()
                    return true
                } else {
                    resetOverlayTimeout()
                    // Don't consume - let RecyclerView handle navigation
                }
            }
            KeyEvent.KEYCODE_DPAD_DOWN -> {
                if (!overlayVisible) {
                    viewModel.nextChannel()
                    showChannelInfoBriefly()
                    return true
                } else {
                    resetOverlayTimeout()
                    // Don't consume - let RecyclerView handle navigation
                }
            }
            KeyEvent.KEYCODE_DPAD_LEFT -> {
                if (overlayVisible) {
                    resetOverlayTimeout()
                    // Don't consume - let focus system handle panel navigation
                }
            }
            KeyEvent.KEYCODE_DPAD_RIGHT -> {
                if (overlayVisible) {
                    resetOverlayTimeout()
                    // Don't consume - let focus system handle panel navigation
                }
            }
            KeyEvent.KEYCODE_CHANNEL_UP -> {
                viewModel.previousChannel()
                showChannelInfoBriefly()
                return true
            }
            KeyEvent.KEYCODE_CHANNEL_DOWN -> {
                viewModel.nextChannel()
                showChannelInfoBriefly()
                return true
            }
            KeyEvent.KEYCODE_BACK -> {
                if (overlayVisible) {
                    // Check if focus is on channels list - go back to groups
                    if (binding.rvChannels.hasFocus()) {
                        // Move focus to groups - find the selected group
                        val selectedCategoryId = viewModel.selectedCategory.value
                        val categoryIndex =
                                if (selectedCategoryId == null) {
                                    0
                                } else {
                                    viewModel.categories.value
                                            ?.indexOfFirst { it.categoryId == selectedCategoryId }
                                            ?.takeIf { it >= 0 }
                                            ?: 0
                                }
                        binding.rvGroups.scrollToPosition(categoryIndex)
                        binding.rvGroups.postDelayed(
                                {
                                    binding.rvGroups
                                            .findViewHolderForAdapterPosition(categoryIndex)
                                            ?.itemView
                                            ?.requestFocus()
                                },
                                50
                        )
                        return true
                    } else {
                        // Focus is on groups or elsewhere - hide overlay
                        hideOverlay()
                        return true
                    }
                } else {
                    if (maybeHandleExitOnBack()) return true
                    finish()
                    return true
                }
            }
            // Number keys for direct channel input
            in KeyEvent.KEYCODE_0..KeyEvent.KEYCODE_9 -> {
                val digit = keyCode - KeyEvent.KEYCODE_0
                handleChannelNumberInput(digit)
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    private fun showChannelInfoBriefly() {
        binding.channelInfoBar.visibility = View.VISIBLE
        handler.removeCallbacks(hideInfoBarRunnable)
        handler.postDelayed(hideInfoBarRunnable, 3000)
    }

    private val hideInfoBarRunnable = Runnable {
        if (!overlayVisible) {
            binding.channelInfoBar.visibility = View.GONE
        }
    }

    override fun onResume() {
        super.onResume()
        isSurfaceReadyForMain = true
        attachMainViewsIfNeeded()
    }

    override fun onPause() {
        super.onPause()
        isSurfaceReadyForMain = false
        stopVideoPreview()
        mediaPlayer?.pause()
    }

    override fun onStop() {
        super.onStop()
        stopVideoPreview()
        mediaPlayer?.stop()
        detachMainViewsIfNeeded()
    }

    private fun releasePreviewPlayer() {
        try {
            detachPreviewViewsIfNeeded()
            previewPlayer?.setEventListener(null)
            previewPlayer?.release()
            previewLibVLC?.release()
        } catch (e: Exception) {
            android.util.Log.w("LiveTvActivity", "Preview release failed: ${e.message}")
        } finally {
            previewPlayer = null
            previewLibVLC = null
            previewChannel = null
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isDestroying = true
        handler.removeCallbacksAndMessages(null)
        previewDelayHandler.removeCallbacksAndMessages(null)
        adapterUpdateHandler.removeCallbacksAndMessages(null)
        channelInputTimeout?.let { handler.removeCallbacks(it) }
        mediaPlayer?.setEventListener(null)
        previewPlayer?.setEventListener(null)

        // Release main player
        detachMainViewsIfNeeded()
        mediaPlayer?.release()
        libVLC?.release()

        // Release preview player
        releasePreviewPlayer()
        android.util.Log.i(
                "LiveTvPerf",
                "session_end switches=$channelSwitchCount decoder_fallbacks=$decoderFallbackCount"
        )
    }

    override fun applyThemeToViews(color: Int) {
        super.applyThemeToViews(color)
        // Update adapter colors for focused items
        if (::channelAdapter.isInitialized) {
            channelAdapter.updateThemeColor(color)
        }
    }
}
