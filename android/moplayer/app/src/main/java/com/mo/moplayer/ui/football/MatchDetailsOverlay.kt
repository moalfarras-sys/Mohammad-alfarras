package com.mo.moplayer.ui.football

import android.content.Context
import android.util.AttributeSet
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import androidx.core.view.isVisible
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions
import com.mo.moplayer.R
import com.mo.moplayer.data.football.LiveMatchData
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/**
 * Full-screen overlay showing match details (teams, score, league, venue, referee, halftime).
 * Matches WeatherDetailsOverlay UX: focus on close button, BACK closes, dismiss returns focus.
 */
class MatchDetailsOverlay
@JvmOverloads
constructor(context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0) :
        FrameLayout(context, attrs, defStyleAttr) {

    private val tvTitle: TextView
    private val tvLeague: TextView
    private val tvHomeTeam: TextView
    private val tvAwayTeam: TextView
    private val tvScore: TextView
    private val ivHomeLogo: ImageView
    private val ivAwayLogo: ImageView
    private val tvStatus: TextView
    private val tvVenue: TextView
    private val tvDateTime: TextView
    private val tvReferee: TextView
    private val tvHalftime: TextView
    private val btnClose: Button

    private var onDismiss: (() -> Unit)? = null

    init {
        LayoutInflater.from(context).inflate(R.layout.overlay_match_details, this, true)

        isClickable = true
        isFocusable = true
        isFocusableInTouchMode = true
        descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS

        tvTitle = findViewById(R.id.tvMatchDetailsTitle)
        tvLeague = findViewById(R.id.tvMatchDetailsLeague)
        tvHomeTeam = findViewById(R.id.tvMatchHomeTeam)
        tvAwayTeam = findViewById(R.id.tvMatchAwayTeam)
        tvScore = findViewById(R.id.tvMatchScore)
        ivHomeLogo = findViewById(R.id.ivMatchHomeLogo)
        ivAwayLogo = findViewById(R.id.ivMatchAwayLogo)
        tvStatus = findViewById(R.id.tvMatchStatus)
        tvVenue = findViewById(R.id.tvMatchVenue)
        tvDateTime = findViewById(R.id.tvMatchDateTime)
        tvReferee = findViewById(R.id.tvMatchReferee)
        tvHalftime = findViewById(R.id.tvMatchHalftime)
        btnClose = findViewById(R.id.btnMatchDetailsClose)

        btnClose.setOnClickListener { hide() }
        btnClose.setOnKeyListener { _, keyCode, event ->
            if (event.action != KeyEvent.ACTION_UP) return@setOnKeyListener false
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                hide()
                true
            } else {
                false
            }
        }

        setOnKeyListener { _, keyCode, event ->
            if (event.action != KeyEvent.ACTION_UP) return@setOnKeyListener false
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                hide()
                true
            } else {
                false
            }
        }

        visibility = View.GONE
        alpha = 0f
    }

    fun setOnDismissListener(listener: (() -> Unit)?) {
        onDismiss = listener
    }

    fun show(data: LiveMatchData) {
        visibility = View.VISIBLE
        alpha = 0f
        animate().alpha(1f).setDuration(180).start()

        tvLeague.text = data.leagueName ?: ""
        tvHomeTeam.text = data.homeTeam
        tvAwayTeam.text = data.awayTeam
        tvScore.text = "${data.homeScore} - ${data.awayScore}"

        val statusLine = buildString {
            data.statusLong?.let { append(it) }
            data.minute?.let { min ->
                if (isNotEmpty()) append(" · ")
                append("$min'")
            }
            if (isEmpty()) data.statusShort?.let { append(it) }
        }
        tvStatus.text = statusLine.ifEmpty { context.getString(R.string.football_widget_live) }

        if (!data.homeLogo.isNullOrEmpty() &&
                        com.mo.moplayer.util.GlideHelper.isValidContextForGlide(context)
        ) {
            ivHomeLogo.isVisible = true
            Glide.with(context)
                    .load(data.homeLogo)
                    .transition(DrawableTransitionOptions.withCrossFade(200))
                    .into(ivHomeLogo)
        } else {
            ivHomeLogo.isVisible = false
        }
        if (!data.awayLogo.isNullOrEmpty() &&
                        com.mo.moplayer.util.GlideHelper.isValidContextForGlide(context)
        ) {
            ivAwayLogo.isVisible = true
            Glide.with(context)
                    .load(data.awayLogo)
                    .transition(DrawableTransitionOptions.withCrossFade(200))
                    .into(ivAwayLogo)
        } else {
            ivAwayLogo.isVisible = false
        }

        val venueName = data.venueName ?: ""
        val venueCitySuffix =
                data.venueCity?.let { context.getString(R.string.match_details_venue_city_sep, it) }
                        ?: ""
        if (venueName.isNotEmpty() || venueCitySuffix.isNotEmpty()) {
            tvVenue.isVisible = true
            tvVenue.text =
                    context.getString(
                            R.string.match_details_venue_format,
                            venueName,
                            venueCitySuffix
                    )
        } else {
            tvVenue.isVisible = false
        }

        val dateTimeFormatted = formatFixtureDate(data.fixtureDate)
        if (dateTimeFormatted != null) {
            tvDateTime.isVisible = true
            tvDateTime.text = dateTimeFormatted
        } else {
            tvDateTime.isVisible = false
        }

        if (!data.referee.isNullOrBlank()) {
            tvReferee.isVisible = true
            tvReferee.text = context.getString(R.string.match_details_referee_format, data.referee)
        } else {
            tvReferee.isVisible = false
        }

        val htHome = data.halftimeHome
        val htAway = data.halftimeAway
        if (htHome != null && htAway != null) {
            tvHalftime.isVisible = true
            tvHalftime.text =
                    context.getString(R.string.match_details_halftime_format, htHome, htAway)
        } else {
            tvHalftime.isVisible = false
        }

        post { btnClose.requestFocus() }
    }

    private fun formatFixtureDate(isoDate: String?): String? {
        if (isoDate.isNullOrBlank()) return null
        return try {
            val input =
                    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.US).apply {
                        timeZone = TimeZone.getDefault()
                    }
            val date = input.parse(isoDate) ?: return null
            SimpleDateFormat("EEE, d MMM yyyy · HH:mm", Locale.getDefault()).format(date)
        } catch (_: Exception) {
            null
        }
    }

    fun hide() {
        if (!isVisible) return
        animate()
                .alpha(0f)
                .setDuration(160)
                .withEndAction {
                    visibility = View.GONE
                    onDismiss?.invoke()
                }
                .start()
    }
}
