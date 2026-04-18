package com.mo.moplayer.ui.player

import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.widget.FrameLayout
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.TextView
import androidx.core.view.isVisible
import com.mo.moplayer.R

/**
 * Quality selection component for video streams.
 * Allows users to select video quality (Auto, 1080p, 720p, 480p, etc.)
 */
class QualitySelectionView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {
    
    interface QualityChangeListener {
        fun onQualityChanged(quality: Quality)
    }
    
    data class Quality(
        val id: String,
        val label: String,
        val bitrate: Int = 0, // in Kbps
        val resolution: String = "",
        val isAuto: Boolean = false
    )
    
    private var listener: QualityChangeListener? = null
    private var qualities: List<Quality> = emptyList()
    private var selectedQuality: Quality? = null
    
    private val titleView: TextView
    private val radioGroup: RadioGroup
    private val currentQualityView: TextView
    
    companion object {
        // Common quality presets
        val QUALITY_AUTO = Quality("auto", "Auto", isAuto = true)
        val QUALITY_1080P = Quality("1080p", "1080p HD", 5000, "1920x1080")
        val QUALITY_720P = Quality("720p", "720p HD", 2500, "1280x720")
        val QUALITY_480P = Quality("480p", "480p", 1000, "854x480")
        val QUALITY_360P = Quality("360p", "360p", 500, "640x360")
        val QUALITY_240P = Quality("240p", "240p", 250, "426x240")
        
        val DEFAULT_QUALITIES = listOf(
            QUALITY_AUTO,
            QUALITY_1080P,
            QUALITY_720P,
            QUALITY_480P,
            QUALITY_360P
        )
    }
    
    init {
        LayoutInflater.from(context).inflate(R.layout.view_quality_selection, this, true)
        
        titleView = findViewById(R.id.tv_quality_title)
        radioGroup = findViewById(R.id.rg_qualities)
        currentQualityView = findViewById(R.id.tv_current_quality)
        
        // Set default qualities
        setQualities(DEFAULT_QUALITIES)
    }
    
    fun setQualityChangeListener(listener: QualityChangeListener) {
        this.listener = listener
    }
    
    /**
     * Set available qualities for the current stream
     */
    fun setQualities(qualities: List<Quality>) {
        this.qualities = qualities
        radioGroup.removeAllViews()
        
        qualities.forEachIndexed { index, quality ->
            val radioButton = LayoutInflater.from(context)
                .inflate(R.layout.item_quality_option, radioGroup, false) as RadioButton
            
            radioButton.id = index
            radioButton.text = buildQualityLabel(quality)
            radioButton.tag = quality
            
            radioGroup.addView(radioButton)
        }
        
        // Select auto by default
        val autoIndex = qualities.indexOfFirst { it.isAuto }
        if (autoIndex >= 0) {
            radioGroup.check(autoIndex)
            selectedQuality = qualities[autoIndex]
        } else if (qualities.isNotEmpty()) {
            radioGroup.check(0)
            selectedQuality = qualities[0]
        }
        
        radioGroup.setOnCheckedChangeListener { _, checkedId ->
            if (checkedId >= 0 && checkedId < qualities.size) {
                val quality = qualities[checkedId]
                selectedQuality = quality
                updateCurrentQualityDisplay()
                listener?.onQualityChanged(quality)
            }
        }
        
        updateCurrentQualityDisplay()
    }
    
    /**
     * Get the currently selected quality
     */
    fun getSelectedQuality(): Quality? = selectedQuality
    
    /**
     * Set the selected quality programmatically
     */
    fun setSelectedQuality(qualityId: String) {
        val index = qualities.indexOfFirst { it.id == qualityId }
        if (index >= 0) {
            radioGroup.check(index)
        }
    }
    
    /**
     * Update current quality display (for auto mode showing actual quality)
     */
    fun updateAutoQualityDisplay(actualQuality: String) {
        if (selectedQuality?.isAuto == true) {
            currentQualityView.text = context.getString(R.string.quality_auto_actual, actualQuality)
        }
    }
    
    private fun buildQualityLabel(quality: Quality): String {
        return when {
            quality.isAuto -> quality.label
            quality.bitrate > 0 -> "${quality.label} (${formatBitrate(quality.bitrate)})"
            else -> quality.label
        }
    }
    
    private fun formatBitrate(kbps: Int): String {
        return when {
            kbps >= 1000 -> "${kbps / 1000} Mbps"
            else -> "$kbps Kbps"
        }
    }
    
    private fun updateCurrentQualityDisplay() {
        selectedQuality?.let { quality ->
            currentQualityView.text = if (quality.isAuto) {
                context.getString(R.string.quality_auto)
            } else {
                quality.label
            }
            currentQualityView.isVisible = true
        }
    }
}
