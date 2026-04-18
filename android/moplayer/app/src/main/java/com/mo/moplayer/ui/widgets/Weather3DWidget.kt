package com.mo.moplayer.ui.widgets

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.airbnb.lottie.LottieAnimationView
import com.mo.moplayer.R
import com.mo.moplayer.data.weather.WeatherService
import com.mo.moplayer.ui.common.design.WidgetUiState
import com.mo.moplayer.ui.widgets.weather.WeatherCanvas
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import android.view.KeyEvent
import android.view.ViewGroup
import android.view.animation.OvershootInterpolator
import android.text.format.DateUtils
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.delay

/**
 * Advanced 3D Weather Widget
 * 
 * Features:
 * - Automatic IP-based location detection
 * - Stunning 3D particle effects
 * - Dynamic lighting and gradients
 * - Animated weather conditions
 * - Interactive updates on click
 */
class Weather3DWidget @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {
    private var tvTemperature: TextView
    private var tvTemperatureShadow: TextView
    private var tvCity: TextView
    private var tvCondition: TextView
    private var tvUpdated: TextView
    private var ivWeatherIcon: ImageView
    private var weatherIconLottie: LottieAnimationView
    private var iconGlow: View
    private var progressBar: ProgressBar
    
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var weatherService: WeatherService? = null
    
    private var widgetState: WidgetUiState<WeatherService.WeatherData> = WidgetUiState.Loading
    private var weatherCollectJob: Job? = null
    private var lastGoodData: WeatherService.WeatherData? = null
    
    init {
        LayoutInflater.from(context).inflate(R.layout.widget_weather_3d, this, true)

        // TV/remote: make the widget itself focusable/clickable.
        isFocusable = true
        isFocusableInTouchMode = true
        isClickable = true
        (this as ViewGroup).descendantFocusability = ViewGroup.FOCUS_BLOCK_DESCENDANTS
        setBackgroundResource(R.drawable.bg_widget_weather_premium)
        setPadding(2, 2, 2, 2)
        
        tvTemperature = findViewById(R.id.tvTemperature)
        tvTemperatureShadow = findViewById(R.id.tvTemperatureShadow)
        tvCity = findViewById(R.id.tvCity)
        tvCondition = findViewById(R.id.tvCondition)
        tvUpdated = findViewById(R.id.tvUpdated)
        ivWeatherIcon = findViewById(R.id.ivWeatherIcon)
        weatherIconLottie = findViewById(R.id.weatherIconLottie)
        iconGlow = findViewById(R.id.iconGlow)
        progressBar = findViewById(R.id.progressBar)
        
        // Set click listener for manual refresh (OK / tap)
        setOnClickListener {
            if (widgetState !is WidgetUiState.Loading) {
                refresh(forceRefresh = true)
            }
        }

        // Ensure DPAD center / enter triggers click reliably.
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

        // Focus “wow” effect for TV.
        onFocusChangeListener = OnFocusChangeListener { _, hasFocus ->
            animateFocus(hasFocus)
        }
        
        // Show placeholder until real data loads
        renderState(WidgetUiState.Loading)
    }
    
    /**
     * Initialize with WeatherService for automatic updates
     */
    fun initialize(weatherService: WeatherService) {
        this.weatherService = weatherService
        startCollectingCachedWeather()
    }
    
    /**
     * Continuously reflect cached weather updates (real-time UI).
     */
    private fun startCollectingCachedWeather() {
        weatherCollectJob?.cancel()
        weatherCollectJob = scope.launch {
            try {
                val service = weatherService ?: return@launch

                // Show placeholder until we receive either cached data or a refresh result.
                renderState(WidgetUiState.Loading)

                service.cachedWeather.collectLatest { cached ->
                    if (cached != null) {
                        renderState(WidgetUiState.Ready(cached))
                    }
                }

                // If we reached here, the flow completed (shouldn't normally happen).
            } catch (e: Exception) {
                e.printStackTrace()
                renderState(WidgetUiState.Error(context.getString(R.string.error_connection)))
            }
        }

        // If no cache arrives quickly, trigger a refresh.
        scope.launch {
            try {
                kotlinx.coroutines.delay(1200L)
                val cached = weatherService?.cachedWeather?.first()
                if (cached == null) refresh()
            } catch (_: Exception) {
                refresh()
            }
        }
    }
    
    /**
     * Refresh weather from API
     */
    fun refresh(forceRefresh: Boolean = false) {
        scope.launch {
            try {
                renderState(WidgetUiState.Loading)
                val result = weatherService?.fetchWeather(forceRefresh)
                
                result?.onSuccess { data ->
                    renderState(WidgetUiState.Ready(data))
                    animateUpdate()
                }?.onFailure { error ->
                    error.printStackTrace()
                    // Keep showing cached data on error; if none, show a minimal offline hint.
                    val fallback = lastGoodData
                    if (fallback != null) {
                        renderState(WidgetUiState.Ready(fallback))
                    } else {
                        renderState(WidgetUiState.Error(context.getString(R.string.error_connection)))
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                renderState(WidgetUiState.Error(context.getString(R.string.error_connection)))
            }
        }
    }
    
    private fun setWeatherData(data: WeatherService.WeatherData) {
        // Update text
        val tempText = "${data.temperature}°"
        tvTemperature.text = tempText
        tvTemperatureShadow.text = tempText
        tvCity.text = data.cityName
        tvCondition.text = data.condition
        tvUpdated.text = formatRelativeUpdateTime(data.lastUpdatedEpochMs)
        
        // Update icon
        val category = weatherService?.getWeatherCategory(data.conditionCode) 
            ?: WeatherService.WeatherCategory.CLEAR
        val iconRes = weatherService?.getWeatherIconResource(data.conditionCode, data.isDay) 
            ?: R.drawable.ic_weather_sunny
        
        ivWeatherIcon.setImageResource(iconRes)
        
        // Update icon glow color based on category
        updateIconGlow(category, data.isDay)
        
        // Try to load Lottie animation if available
        loadLottieAnimation(category, data.isDay)
    }
    
    private fun setPlaceholder() {
        tvTemperature.text = "--°"
        tvTemperatureShadow.text = "--°"
        tvCity.text = context.getString(R.string.loading)
        tvCondition.text = ""
        tvUpdated.text = ""
        ivWeatherIcon.setImageResource(R.drawable.ic_weather_sunny)
    }
    
    private fun showLoading(loading: Boolean) {
        progressBar.visibility = if (loading) View.VISIBLE else View.GONE
    }

    private fun renderState(state: WidgetUiState<WeatherService.WeatherData>) {
        widgetState = state
        when (state) {
            WidgetUiState.Loading -> {
                showLoading(true)
                if (lastGoodData == null) setPlaceholder()
            }
            is WidgetUiState.Ready -> {
                showLoading(false)
                lastGoodData = state.data
                setWeatherData(state.data)
            }
            is WidgetUiState.Error -> {
                showLoading(false)
                tvCity.text = state.message
                tvCondition.text = ""
                tvUpdated.text = ""
            }
            is WidgetUiState.Empty -> {
                showLoading(false)
                tvCity.text = state.message
                tvCondition.text = ""
                tvUpdated.text = ""
            }
        }
    }
    
    private fun updateIconGlow(category: WeatherService.WeatherCategory, isDay: Boolean) {
        val glowColor = when (category) {
            WeatherService.WeatherCategory.CLEAR -> {
                if (isDay) Color.rgb(255, 215, 0) // Gold sun
                else Color.rgb(200, 200, 240) // Silver moon
            }
            WeatherService.WeatherCategory.CLOUDY -> Color.rgb(180, 180, 180)
            WeatherService.WeatherCategory.RAINY -> Color.rgb(100, 150, 200)
            WeatherService.WeatherCategory.STORMY -> Color.rgb(80, 80, 120)
            WeatherService.WeatherCategory.SNOWY -> Color.rgb(230, 240, 255)
            WeatherService.WeatherCategory.FOGGY -> Color.rgb(190, 190, 190)
        }
        
        iconGlow.background?.colorFilter = PorterDuffColorFilter(glowColor, PorterDuff.Mode.SRC_IN)
        
        // Tint the glass background slightly
        val bgTint = androidx.core.graphics.ColorUtils.setAlphaComponent(glowColor, 30)
        background?.colorFilter = PorterDuffColorFilter(bgTint, PorterDuff.Mode.SRC_ATOP)
    }
    
    private fun loadLottieAnimation(category: WeatherService.WeatherCategory, isDay: Boolean) {
        // Lottie animations enabled with custom-built animations
        val animationPath = when (category) {
            WeatherService.WeatherCategory.CLEAR -> {
                if (isDay) "weather_animations/weather_sunny.json" else "weather_animations/weather_moon.json"
            }
            WeatherService.WeatherCategory.RAINY -> "weather_animations/weather_rain.json"
            WeatherService.WeatherCategory.STORMY -> "weather_animations/weather_storm.json"
            WeatherService.WeatherCategory.SNOWY -> "weather_animations/weather_snow.json"
            WeatherService.WeatherCategory.CLOUDY -> "weather_animations/weather_cloudy.json"
            WeatherService.WeatherCategory.FOGGY -> "weather_animations/weather_fog.json"
        }
        
        try {
            weatherIconLottie.setAnimation(animationPath)
            weatherIconLottie.repeatCount = com.airbnb.lottie.LottieDrawable.INFINITE
            weatherIconLottie.visibility = View.VISIBLE
            ivWeatherIcon.visibility = View.GONE
            weatherIconLottie.playAnimation()
        } catch (e: Exception) {
            // Fallback to static icons if Lottie fails
            e.printStackTrace()
            weatherIconLottie.visibility = View.GONE
            ivWeatherIcon.visibility = View.VISIBLE
        }
    }
    
    private fun animateUpdate() {
        // Pulse animation on update
        val scaleAnimator = ValueAnimator.ofFloat(1f, 1.1f, 1f)
        scaleAnimator.duration = 300
        scaleAnimator.addUpdateListener { animation ->
            val scale = animation.animatedValue as Float
            tvTemperature.scaleX = scale
            tvTemperature.scaleY = scale
            ivWeatherIcon.scaleX = scale
            ivWeatherIcon.scaleY = scale
        }
        scaleAnimator.start()
        
        // Glow pulse
        val glowAnimator = ValueAnimator.ofFloat(0.3f, 0.7f, 0.3f)
        glowAnimator.duration = 500
        glowAnimator.addUpdateListener { animation ->
            iconGlow.alpha = animation.animatedValue as Float
        }
        glowAnimator.start()
    }

    private fun animateFocus(hasFocus: Boolean) {
        val targetScale = if (hasFocus) 1.06f else 1.0f
        val targetElevation = if (hasFocus) 14f else 4f
        animate()
            .scaleX(targetScale)
            .scaleY(targetScale)
            .translationY(if (hasFocus) -3f else 0f)
            .setDuration(200)
            .setInterpolator(OvershootInterpolator(1.4f))
            .start()

        elevation = targetElevation

        iconGlow.animate()
            .alpha(if (hasFocus) 0.8f else 0.25f)
            .setDuration(200)
            .start()
    }

    private fun formatRelativeUpdateTime(updatedAtEpochMs: Long): CharSequence {
        if (updatedAtEpochMs <= 0L) return ""
        val now = System.currentTimeMillis()
        return DateUtils.getRelativeTimeSpanString(
            updatedAtEpochMs,
            now,
            DateUtils.MINUTE_IN_MILLIS,
            DateUtils.FORMAT_ABBREV_RELATIVE
        )
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        scope.cancel()
    }
}
