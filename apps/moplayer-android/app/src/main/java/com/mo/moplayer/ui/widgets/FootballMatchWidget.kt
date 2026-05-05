package com.mo.moplayer.ui.widgets

import android.os.Handler
import android.os.Looper
import android.graphics.Color
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.drawable.GradientDrawable
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import com.mo.moplayer.R
import com.mo.moplayer.data.football.FootballService
import com.mo.moplayer.data.football.LiveMatchData
import com.mo.moplayer.ui.common.design.WidgetUiState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Premium football widget for Home. Uses the website proxy/service only; no API key is kept here.
 */
class FootballMatchWidget
@JvmOverloads
constructor(
    context: android.content.Context,
    attrs: android.util.AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {
    private val ivHomeLogo: android.widget.ImageView
    private val ivAwayLogo: android.widget.ImageView
    private val tvHomeTeam: TextView
    private val tvAwayTeam: TextView
    private val tvScore: TextView
    private val tvLiveBadge: TextView
    private val tvLeagueMinute: TextView
    private val matchContent: LinearLayout
    private val tvStateMessage: TextView
    private val tvStateSubtitle: TextView
    private val progressBar: ProgressBar
    private val layoutEmptyState: LinearLayout

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var footballService: FootballService? = null
    private val handler = Handler(Looper.getMainLooper())
    private var refreshRunnable: Runnable? = null
    private var currentMatchData: LiveMatchData? = null
    private var widgetState: WidgetUiState<LiveMatchData> = WidgetUiState.Loading
    private var accentColor: Int = Color.parseColor("#00E5FF")

    var onMatchClick: ((LiveMatchData) -> Unit)? = null

    companion object {
        private const val REFRESH_INTERVAL_MS = 45_000L
    }

    init {
        LayoutInflater.from(context).inflate(R.layout.widget_football_match, this, true)

        isFocusable = true
        isFocusableInTouchMode = true
        isClickable = true
        (this as ViewGroup).descendantFocusability = ViewGroup.FOCUS_BLOCK_DESCENDANTS
        setBackgroundResource(R.drawable.bg_widget_football_premium)
        setPadding(2, 2, 2, 2)

        ivHomeLogo = findViewById(R.id.ivHomeLogo)
        ivAwayLogo = findViewById(R.id.ivAwayLogo)
        tvHomeTeam = findViewById(R.id.tvHomeTeam)
        tvAwayTeam = findViewById(R.id.tvAwayTeam)
        tvScore = findViewById(R.id.tvScore)
        tvLiveBadge = findViewById(R.id.tvLiveBadge)
        tvLeagueMinute = findViewById(R.id.tvLeagueMinute)
        matchContent = findViewById(R.id.matchContent)
        tvStateMessage = findViewById(R.id.tvStateMessage)
        tvStateSubtitle = findViewById(R.id.tvStateSubtitle)
        layoutEmptyState = findViewById(R.id.layoutEmptyState)
        progressBar = findViewById(R.id.progressBar)

        setOnClickListener {
            val match = currentMatchData
            if (match != null) {
                onMatchClick?.invoke(match)
            } else if (widgetState !is WidgetUiState.Loading) {
                refresh(forceRefresh = true)
            }
        }
        setOnKeyListener { _, keyCode, event ->
            if (event.action != KeyEvent.ACTION_UP) return@setOnKeyListener false
            when (keyCode) {
                KeyEvent.KEYCODE_DPAD_CENTER,
                KeyEvent.KEYCODE_ENTER,
                KeyEvent.KEYCODE_NUMPAD_ENTER -> {
                    performClick()
                    true
                }
                else -> false
            }
        }
        onFocusChangeListener = OnFocusChangeListener { _, hasFocus -> animateFocus(hasFocus) }

        renderState(WidgetUiState.Loading)
    }

    fun setAccentColor(color: Int) {
        accentColor = color
        tvScore.setTextColor(color)
        tvLiveBadge.background = createLiveBadgeBackground(color)
        progressBar.indeterminateTintList = android.content.res.ColorStateList.valueOf(color)
        findViewById<android.widget.ImageView>(R.id.ivFootballIcon)?.colorFilter =
            PorterDuffColorFilter(color, PorterDuff.Mode.SRC_IN)
        if (hasFocus()) {
            background = createWidgetBackground(color, focused = true)
        }
    }

    fun initialize(footballService: FootballService) {
        this.footballService = footballService
    }

    fun refresh(forceRefresh: Boolean = false) {
        scope.launch {
            if (footballService == null) {
                renderState(WidgetUiState.Error(context.getString(R.string.football_widget_error)))
                return@launch
            }

            renderState(WidgetUiState.Loading)
            val result = withContext(Dispatchers.IO) {
                footballService?.fetchLiveMatch(forceRefresh)
            } ?: Result.failure(Exception("Service unavailable"))

            result.fold(
                onSuccess = { data ->
                    if (data != null) {
                        renderState(WidgetUiState.Ready(data))
                        startPeriodicRefresh()
                    } else {
                        val msg = if (footballService?.hasApiKey() == false) {
                            context.getString(R.string.football_widget_error)
                        } else {
                            context.getString(R.string.football_widget_no_match)
                        }
                        renderState(WidgetUiState.Empty(msg))
                        stopPeriodicRefresh()
                    }
                },
                onFailure = {
                    val msg = if (footballService?.hasApiKey() == false) {
                        context.getString(R.string.football_widget_error)
                    } else {
                        it.message ?: context.getString(R.string.error_connection)
                    }
                    renderState(WidgetUiState.Error(msg))
                    stopPeriodicRefresh()
                }
            )
        }
    }

    fun onActivityResumed() {
        refresh(forceRefresh = false)
    }

    fun onActivityPaused() {
        stopPeriodicRefresh()
    }

    private fun startPeriodicRefresh() {
        stopPeriodicRefresh()
        refreshRunnable = object : Runnable {
            override fun run() {
                refresh(forceRefresh = true)
                handler.postDelayed(this, REFRESH_INTERVAL_MS)
            }
        }
        refreshRunnable?.let { handler.postDelayed(it, REFRESH_INTERVAL_MS) }
    }

    private fun stopPeriodicRefresh() {
        refreshRunnable?.let { handler.removeCallbacks(it) }
        refreshRunnable = null
    }

    private fun showMatch(data: LiveMatchData) {
        currentMatchData = data
        matchContent.visibility = View.VISIBLE
        layoutEmptyState.visibility = View.GONE

        tvHomeTeam.text = shortenTeamName(data.homeTeam)
        tvAwayTeam.text = shortenTeamName(data.awayTeam)

        tvScore.visibility = View.VISIBLE
        if (data.isLive || data.isFinished) {
            tvScore.text = "${data.homeScore} - ${data.awayScore}"
            tvLiveBadge.visibility = if (data.isLive) View.VISIBLE else View.GONE
        } else {
            tvScore.text = "vs"
            tvLiveBadge.visibility = View.GONE
        }

        if (com.mo.moplayer.util.GlideHelper.isValidContextForGlide(context)) {
            com.bumptech.glide.Glide.with(context)
                .load(data.homeLogo)
                .placeholder(R.drawable.ic_football)
                .error(R.drawable.ic_football)
                .into(ivHomeLogo)

            com.bumptech.glide.Glide.with(context)
                .load(data.awayLogo)
                .placeholder(R.drawable.ic_football)
                .error(R.drawable.ic_football)
                .into(ivAwayLogo)
        }

        tvLeagueMinute.text = if (data.isLive) {
            buildString {
                data.leagueName?.let { append(it) }
                data.minute?.let { min ->
                    if (isNotEmpty()) append(" - ")
                    append("$min'")
                }
                if (isEmpty()) data.statusLong?.let { append(it) }
            }.ifEmpty { data.statusShort ?: "" }
        } else if (data.isFinished) {
            buildString {
                data.leagueName?.let { append(it) }
                if (isNotEmpty()) append(" - ")
                append(context.getString(R.string.football_widget_final_result))
            }
        } else {
            buildString {
                data.displayTime?.let { append(it) }
                data.leagueName?.let { name ->
                    if (isNotEmpty()) append(" - ")
                    append(name)
                }
            }.ifEmpty { context.getString(R.string.football_widget_today_match) }
        }
    }

    private fun shortenTeamName(name: String): String =
        if (name.length <= 10) name else name.take(8) + "..."

    private fun showStateMessage(message: String, state: WidgetUiState<LiveMatchData>) {
        currentMatchData = null
        matchContent.visibility = View.GONE
        layoutEmptyState.visibility = View.VISIBLE
        tvStateMessage.text = when (state) {
            is WidgetUiState.Empty -> context.getString(R.string.football_widget_no_match)
            is WidgetUiState.Error -> context.getString(R.string.football_widget_error_state)
            else -> message
        }
        tvStateSubtitle.text = when (state) {
            WidgetUiState.Loading -> context.getString(R.string.football_widget_loading_subtitle)
            is WidgetUiState.Empty -> context.getString(R.string.football_widget_no_match_subtitle)
            is WidgetUiState.Error -> message.ifBlank { context.getString(R.string.football_widget_error_subtitle) }
            is WidgetUiState.Ready -> ""
        }
        tvStateSubtitle.visibility = if (tvStateSubtitle.text.isNullOrBlank()) View.GONE else View.VISIBLE
    }

    private fun showLoading(loading: Boolean) {
        progressBar.visibility = if (loading) View.VISIBLE else View.GONE
    }

    private fun renderState(state: WidgetUiState<LiveMatchData>) {
        widgetState = state
        when (state) {
            WidgetUiState.Loading -> {
                showLoading(true)
                showStateMessage(context.getString(R.string.football_widget_loading), state)
            }
            is WidgetUiState.Ready -> {
                showLoading(false)
                showMatch(state.data)
            }
            is WidgetUiState.Empty -> {
                showLoading(false)
                showStateMessage(state.message, state)
            }
            is WidgetUiState.Error -> {
                showLoading(false)
                showStateMessage(state.message, state)
            }
        }
    }

    private fun animateFocus(hasFocus: Boolean) {
        val targetScale = if (hasFocus) 1.05f else 1.0f
        val targetElevation = if (hasFocus) 14f else 4f
        background = createWidgetBackground(accentColor, focused = hasFocus)
        animate()
            .scaleX(targetScale)
            .scaleY(targetScale)
            .translationY(if (hasFocus) -3f else 0f)
            .setDuration(200)
            .setInterpolator(OvershootInterpolator(1.4f))
            .start()
        elevation = targetElevation
    }

    private fun createWidgetBackground(color: Int, focused: Boolean): GradientDrawable {
        val alphaSurface = if (focused) 60 else 34
        val strokeAlpha = if (focused) 230 else 92
        return GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT, intArrayOf(
            Color.argb(alphaSurface, Color.red(color), Color.green(color), Color.blue(color)),
            Color.argb(176, 4, 14, 32)
        )).apply {
            cornerRadius = dp(22f)
            setStroke(dp(if (focused) 2f else 1f).toInt(), Color.argb(strokeAlpha, Color.red(color), Color.green(color), Color.blue(color)))
        }
    }

    private fun createLiveBadgeBackground(color: Int): GradientDrawable =
        GradientDrawable().apply {
            setColor(color)
            cornerRadius = dp(10f)
        }

    private fun dp(value: Float): Float = value * resources.displayMetrics.density

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        stopPeriodicRefresh()
        scope.cancel()
    }
}
