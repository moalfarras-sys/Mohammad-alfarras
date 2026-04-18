package com.mo.moplayer.ui.player

import androidx.appcompat.app.AlertDialog
import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.View
import android.widget.FrameLayout
import com.mo.moplayer.databinding.ViewPlayerControlsBinding
import com.mo.moplayer.ui.common.animations.PremiumAnimations
import com.mo.moplayer.ui.common.design.LiquidGlassTokens

/**
 * Premium Player Controls Overlay
 * Features: Subtitle selection, audio tracks, playback speed, quality
 */
class PremiumPlayerControls @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val binding: ViewPlayerControlsBinding
    
    private var onPlayPauseClick: (() -> Unit)? = null
    private var onSeekTo: ((Long) -> Unit)? = null
    private var onSubtitleSelected: ((Int) -> Unit)? = null
    private var onAudioTrackSelected: ((Int) -> Unit)? = null
    private var onSpeedSelected: ((Float) -> Unit)? = null
    private var onQualitySelected: ((String) -> Unit)? = null
    
    private var isPlaying = false
    private var currentPosition: Long = 0
    private var duration: Long = 0
    
    // Available options
    private val availableSpeeds = listOf(0.25f, 0.5f, 0.75f, 1.0f, 1.25f, 1.5f, 2.0f)
    private var currentSpeed = 1.0f
    private var subtitleTracks: List<TrackOption> = listOf(TrackOption(-1, "Off"))
    private var audioTracks: List<TrackOption> = emptyList()
    private var qualityOptions: List<QualityOption> = listOf(
        QualityOption("auto", "Auto"),
        QualityOption("1080p", "1080p"),
        QualityOption("720p", "720p"),
        QualityOption("480p", "480p")
    )
    private var selectedQualityId: String = "auto"
    
    init {
        binding = ViewPlayerControlsBinding.inflate(LayoutInflater.from(context), this, true)
        setupControls()
        setupOptionsMenu()
    }
    
    private fun setupControls() {
        // Play/Pause button
        binding.btnPlayPause.setOnClickListener {
            isPlaying = !isPlaying
            updatePlayPauseButton()
            onPlayPauseClick?.invoke()
        }
        
        // Rewind button (-10s)
        binding.btnRewind.setOnClickListener {
            val newPosition = (currentPosition - 10000).coerceAtLeast(0)
            onSeekTo?.invoke(newPosition)
        }
        
        // Forward button (+10s)
        binding.btnForward.setOnClickListener {
            val newPosition = (currentPosition + 10000).coerceAtMost(duration)
            onSeekTo?.invoke(newPosition)
        }
        
        // Options button (subtitles, audio, speed)
        binding.btnOptions.setOnClickListener {
            toggleOptionsMenu()
        }
        
        // Progress bar
        binding.seekBar.setOnSeekBarChangeListener(object : android.widget.SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: android.widget.SeekBar?, progress: Int, fromUser: Boolean) {
                if (fromUser) {
                    val newPosition = (progress / 100f * duration).toLong()
                    onSeekTo?.invoke(newPosition)
                }
            }
            override fun onStartTrackingTouch(seekBar: android.widget.SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: android.widget.SeekBar?) {}
        })
    }
    
    private fun setupOptionsMenu() {
        // Subtitle button
        binding.btnSubtitles.setOnClickListener {
            showSubtitleSelector()
        }
        
        // Audio tracks button
        binding.btnAudio.setOnClickListener {
            showAudioTrackSelector()
        }
        
        // Playback speed button
        binding.btnSpeed.setOnClickListener {
            showSpeedSelector()
        }
        
        // Quality button
        binding.btnQuality.setOnClickListener {
            showQualitySelector()
        }
    }
    
    private fun toggleOptionsMenu() {
        if (binding.optionsMenu.visibility == View.VISIBLE) {
            hideOptionsMenu()
        } else {
            showOptionsMenu()
        }
    }
    
    private fun showOptionsMenu() {
        PremiumAnimations.slideInFromBottom(binding.optionsMenu).start()
        binding.optionsMenu.visibility = View.VISIBLE
    }
    
    private fun hideOptionsMenu() {
        PremiumAnimations.fadeOut(binding.optionsMenu) {
            binding.optionsMenu.visibility = View.GONE
        }.start()
    }
    
    private fun showSubtitleSelector() {
        showTrackDialog(
            title = context.getString(com.mo.moplayer.R.string.player_subtitles),
            tracks = subtitleTracks
        ) { selectedTrack ->
            onSubtitleSelected?.invoke(selectedTrack.id)
        }
    }
    
    private fun showAudioTrackSelector() {
        showTrackDialog(
            title = context.getString(com.mo.moplayer.R.string.player_audio_tracks),
            tracks = audioTracks
        ) { selectedTrack ->
            onAudioTrackSelected?.invoke(selectedTrack.id)
        }
    }
    
    private fun showSpeedSelector() {
        val speedLabels = availableSpeeds.map { String.format("%.2fx", it) }.toTypedArray()
        val currentIndex = availableSpeeds.indexOf(currentSpeed).coerceAtLeast(0)
        AlertDialog.Builder(context)
            .setTitle(com.mo.moplayer.R.string.playback_speed)
            .setSingleChoiceItems(speedLabels, currentIndex) { dialog, which ->
                val speed = availableSpeeds[which]
            currentSpeed = speed
            onSpeedSelected?.invoke(speed)
            binding.tvSpeed.text = String.format("%.2fx", speed)
            hideOptionsMenu()
                dialog.dismiss()
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }
    
    private fun showQualitySelector() {
        val labels = qualityOptions.map { it.label }.toTypedArray()
        val currentIndex = qualityOptions.indexOfFirst { it.id == selectedQualityId }.coerceAtLeast(0)
        AlertDialog.Builder(context)
            .setTitle(com.mo.moplayer.R.string.player_quality)
            .setSingleChoiceItems(labels, currentIndex) { dialog, which ->
                val selected = qualityOptions[which]
                selectedQualityId = selected.id
                onQualitySelected?.invoke(selected.id)
                hideOptionsMenu()
                dialog.dismiss()
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }
    
    private fun updatePlayPauseButton() {
        binding.btnPlayPause.setImageResource(
            if (isPlaying) {
                android.R.drawable.ic_media_pause
            } else {
                android.R.drawable.ic_media_play
            }
        )
    }
    
    /**
     * Update playback position and duration
     */
    fun updateProgress(position: Long, duration: Long) {
        this.currentPosition = position
        this.duration = duration
        
        // Update progress bar
        val progress = if (duration > 0) {
            ((position.toFloat() / duration) * 100).toInt()
        } else {
            0
        }
        binding.seekBar.progress = progress
        
        // Update time labels
        binding.tvCurrentTime.text = formatTime(position)
        binding.tvDuration.text = formatTime(duration)
    }
    
    /**
     * Set playing state
     */
    fun setPlaying(playing: Boolean) {
        isPlaying = playing
        updatePlayPauseButton()
    }
    
    /**
     * Show/hide controls with animation
     */
    fun show() {
        PremiumAnimations.fadeIn(this, duration = LiquidGlassTokens.FOCUS_IN_DURATION_MS).start()
        visibility = View.VISIBLE
        
        // Auto-hide after 5 seconds
        postDelayed({ hide() }, 5000)
    }
    
    fun hide() {
        PremiumAnimations.fadeOut(this, duration = LiquidGlassTokens.FOCUS_OUT_DURATION_MS) {
            visibility = View.GONE
        }.start()
    }
    
    /**
     * Set listeners
     */
    fun setOnPlayPauseClickListener(listener: () -> Unit) {
        onPlayPauseClick = listener
    }
    
    fun setOnSeekToListener(listener: (Long) -> Unit) {
        onSeekTo = listener
    }
    
    fun setOnSubtitleSelectedListener(listener: (Int) -> Unit) {
        onSubtitleSelected = listener
    }
    
    fun setOnAudioTrackSelectedListener(listener: (Int) -> Unit) {
        onAudioTrackSelected = listener
    }
    
    fun setOnSpeedSelectedListener(listener: (Float) -> Unit) {
        onSpeedSelected = listener
    }

    fun setOnQualitySelectedListener(listener: (String) -> Unit) {
        onQualitySelected = listener
    }

    fun setSubtitleTracks(tracks: List<TrackOption>, selectedTrackId: Int = -1) {
        subtitleTracks = if (tracks.isEmpty()) listOf(TrackOption(-1, "Off")) else tracks
        if (subtitleTracks.none { it.id == -1 }) {
            subtitleTracks = listOf(TrackOption(-1, "Off")) + subtitleTracks
        }
        if (selectedTrackId != -1 && subtitleTracks.none { it.id == selectedTrackId }) return
    }

    fun setAudioTracks(tracks: List<TrackOption>) {
        audioTracks = tracks
    }

    fun setQualityOptions(options: List<QualityOption>, selectedId: String = "auto") {
        qualityOptions = if (options.isEmpty()) qualityOptions else options
        selectedQualityId = selectedId
    }
    
    /**
     * Format milliseconds to HH:MM:SS or MM:SS
     */
    private fun formatTime(millis: Long): String {
        val seconds = (millis / 1000).toInt()
        val hours = seconds / 3600
        val minutes = (seconds % 3600) / 60
        val secs = seconds % 60
        
        return if (hours > 0) {
            String.format("%02d:%02d:%02d", hours, minutes, secs)
        } else {
            String.format("%02d:%02d", minutes, secs)
        }
    }

    private fun showTrackDialog(
        title: String,
        tracks: List<TrackOption>,
        onTrackSelected: (TrackOption) -> Unit
    ) {
        if (tracks.isEmpty()) {
            return
        }
        val labels = tracks.map { it.name }.toTypedArray()
        AlertDialog.Builder(context)
            .setTitle(title)
            .setItems(labels) { dialog, which ->
                onTrackSelected(tracks[which])
                hideOptionsMenu()
                dialog.dismiss()
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    data class TrackOption(
        val id: Int,
        val name: String
    )

    data class QualityOption(
        val id: String,
        val label: String
    )
}
