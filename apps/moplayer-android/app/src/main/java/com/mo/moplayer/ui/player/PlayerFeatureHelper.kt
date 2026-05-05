package com.mo.moplayer.ui.player

import android.os.CountDownTimer
import android.view.View
import android.view.animation.AnimationUtils
import com.mo.moplayer.R
import com.mo.moplayer.databinding.ActivityPlayerBinding

/**
 * Helper class to manage Skip Intro and Auto-Play Next Episode features
 */
class PlayerFeatureHelper(
    private val binding: ActivityPlayerBinding,
    private val onSkipIntro: () -> Unit,
    private val onPlayNextEpisode: () -> Unit,
    private val onCancelAutoPlay: () -> Unit
) {
    
    companion object {
        // Skip intro is shown in the first 2 minutes of content
        const val SKIP_INTRO_MAX_TIME_MS = 120_000L
        // Default skip amount (30 seconds)
        const val SKIP_INTRO_AMOUNT_MS = 30_000L
        // Auto-play countdown duration
        const val AUTO_PLAY_COUNTDOWN_SECONDS = 10
    }
    
    private var skipIntroShown = false
    private var autoPlayCountdown: CountDownTimer? = null
    private var hasNextEpisode = false
    private var nextEpisodeInfo: NextEpisodeInfo? = null
    
    data class NextEpisodeInfo(
        val title: String,
        val episodeNumber: Int,
        val seasonNumber: Int,
        val streamUrl: String,
        val contentId: String
    )
    
    init {
        setupClickListeners()
    }
    
    private fun setupClickListeners() {
        binding.btnSkipIntro.setOnClickListener {
            hideSkipIntro()
            onSkipIntro()
        }
        
        binding.btnPlayNow.setOnClickListener {
            cancelAutoPlayCountdown()
            onPlayNextEpisode()
        }
        
        binding.btnCancelAutoPlay.setOnClickListener {
            cancelAutoPlayCountdown()
            onCancelAutoPlay()
        }
    }
    
    /**
     * Set the next episode info for auto-play feature
     */
    fun setNextEpisode(info: NextEpisodeInfo?) {
        nextEpisodeInfo = info
        hasNextEpisode = info != null
    }
    
    /**
     * Check if we should show skip intro button based on current position
     */
    fun checkSkipIntro(currentPositionMs: Long) {
        if (!skipIntroShown && currentPositionMs < SKIP_INTRO_MAX_TIME_MS && currentPositionMs > 5000) {
            showSkipIntro()
        } else if (currentPositionMs >= SKIP_INTRO_MAX_TIME_MS) {
            hideSkipIntro()
        }
    }
    
    /**
     * Called when video is about to end - shows auto-play panel if next episode exists
     */
    fun checkEndOfVideo(currentPositionMs: Long, durationMs: Long) {
        if (!hasNextEpisode) return
        
        val remainingMs = durationMs - currentPositionMs
        // Show auto-play panel when 15 seconds left
        if (remainingMs in 1..15000 && binding.nextEpisodePanel.visibility != View.VISIBLE) {
            showAutoPlayPanel()
        }
    }
    
    /**
     * Called when video ends - trigger auto-play if active
     */
    fun onVideoEnded() {
        if (hasNextEpisode && binding.nextEpisodePanel.visibility == View.VISIBLE) {
            // Auto-play is already showing, countdown will handle it
        } else if (hasNextEpisode) {
            showAutoPlayPanel()
        }
    }
    
    private fun showSkipIntro() {
        if (skipIntroShown) return
        skipIntroShown = true
        
        binding.btnSkipIntro.visibility = View.VISIBLE
        binding.btnSkipIntro.startAnimation(
            AnimationUtils.loadAnimation(binding.root.context, R.anim.fade_in)
        )
    }
    
    private fun hideSkipIntro() {
        if (binding.btnSkipIntro.visibility == View.VISIBLE) {
            binding.btnSkipIntro.startAnimation(
                AnimationUtils.loadAnimation(binding.root.context, R.anim.fade_out)
            )
            binding.btnSkipIntro.visibility = View.GONE
        }
        skipIntroShown = true // Don't show again
    }
    
    private fun showAutoPlayPanel() {
        nextEpisodeInfo?.let { info ->
            binding.tvNextEpisodeTitle.text = "S${info.seasonNumber}E${info.episodeNumber} - ${info.title}"
        }
        
        binding.nextEpisodePanel.visibility = View.VISIBLE
        binding.nextEpisodePanel.startAnimation(
            AnimationUtils.loadAnimation(binding.root.context, R.anim.slide_in_right)
        )
        
        startAutoPlayCountdown()
    }
    
    private fun startAutoPlayCountdown() {
        autoPlayCountdown?.cancel()
        
        autoPlayCountdown = object : CountDownTimer(
            AUTO_PLAY_COUNTDOWN_SECONDS * 1000L, 
            1000
        ) {
            override fun onTick(millisUntilFinished: Long) {
                val secondsLeft = (millisUntilFinished / 1000).toInt()
                binding.tvNextEpisodeCountdown.text = "يبدأ خلال $secondsLeft ثواني..."
            }
            
            override fun onFinish() {
                binding.tvNextEpisodeCountdown.text = "يبدأ الآن..."
                onPlayNextEpisode()
            }
        }.start()
    }
    
    fun cancelAutoPlayCountdown() {
        autoPlayCountdown?.cancel()
        autoPlayCountdown = null
        
        if (binding.nextEpisodePanel.visibility == View.VISIBLE) {
            binding.nextEpisodePanel.startAnimation(
                AnimationUtils.loadAnimation(binding.root.context, R.anim.fade_out)
            )
            binding.nextEpisodePanel.visibility = View.GONE
        }
    }
    
    /**
     * Reset state for new video
     */
    fun reset() {
        skipIntroShown = false
        cancelAutoPlayCountdown()
        hideSkipIntro()
    }
    
    fun cleanup() {
        autoPlayCountdown?.cancel()
        autoPlayCountdown = null
    }
}
