package com.mo.moplayer.ui.weather

import android.content.Context
import android.util.AttributeSet
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.view.isVisible
import com.mo.moplayer.R
import com.mo.moplayer.data.weather.WeatherService
import android.text.format.DateUtils

class WeatherDetailsOverlay @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val tvTitle: TextView
    private val tvCity: TextView
    private val tvCondition: TextView
    private val tvTemp: TextView
    private val tvFeelsLike: TextView
    private val tvHumidity: TextView
    private val tvWind: TextView
    private val tvGust: TextView
    private val tvPrecip: TextView
    private val tvCloud: TextView
    private val tvUpdated: TextView
    private val btnClose: Button

    private var onDismiss: (() -> Unit)? = null

    init {
        LayoutInflater.from(context).inflate(R.layout.overlay_weather_details, this, true)

        isClickable = true
        isFocusable = true
        isFocusableInTouchMode = true
        descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS

        tvTitle = findViewById(R.id.tvWeatherDetailsTitle)
        tvCity = findViewById(R.id.tvWeatherDetailsCity)
        tvCondition = findViewById(R.id.tvWeatherDetailsCondition)
        tvTemp = findViewById(R.id.tvWeatherDetailsTemp)
        tvFeelsLike = findViewById(R.id.tvWeatherDetailsFeelsLike)
        tvHumidity = findViewById(R.id.tvWeatherDetailsHumidity)
        tvWind = findViewById(R.id.tvWeatherDetailsWind)
        tvGust = findViewById(R.id.tvWeatherDetailsGust)
        tvPrecip = findViewById(R.id.tvWeatherDetailsPrecip)
        tvCloud = findViewById(R.id.tvWeatherDetailsCloud)
        tvUpdated = findViewById(R.id.tvWeatherDetailsUpdated)
        btnClose = findViewById(R.id.btnWeatherDetailsClose)

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

    fun showLoading() {
        visibility = View.VISIBLE
        alpha = 0f
        animate().alpha(1f).setDuration(180).start()
        tvCity.text = context.getString(R.string.loading)
        tvCondition.text = ""
        tvTemp.text = "--°"
        tvFeelsLike.text = ""
        tvHumidity.text = ""
        tvWind.text = ""
        tvGust.text = ""
        tvPrecip.text = ""
        tvCloud.text = ""
        tvUpdated.text = ""
        post { btnClose.requestFocus() }
    }

    fun show(data: WeatherService.WeatherData) {
        visibility = View.VISIBLE
        alpha = 0f
        animate().alpha(1f).setDuration(180).start()
        update(data)
        post { btnClose.requestFocus() }
    }

    fun update(data: WeatherService.WeatherData) {
        tvCity.text = data.cityName
        tvCondition.text = data.condition
        tvTemp.text = "${data.temperature}°"

        tvFeelsLike.text = context.getString(R.string.weather_details_feels_like_format, data.feelsLike)
        tvHumidity.text = context.getString(R.string.weather_details_humidity_format, data.humidity)
        tvWind.text = context.getString(
            R.string.weather_details_wind_format,
            data.windSpeed,
            data.windDegree
        )
        tvGust.text = context.getString(R.string.weather_details_gust_format, data.gustSpeed)
        tvPrecip.text = context.getString(R.string.weather_details_precip_format, data.precipMm)
        tvCloud.text = context.getString(R.string.weather_details_cloud_format, data.cloud)

        val updatedRel = formatRelativeUpdateTime(data.lastUpdatedEpochMs)
        tvUpdated.text = if (updatedRel.isNotEmpty()) {
            context.getString(R.string.weather_details_updated_format, updatedRel)
        } else ""
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

    private fun formatRelativeUpdateTime(updatedAtEpochMs: Long): CharSequence {
        if (updatedAtEpochMs <= 0L) return ""
        return DateUtils.getRelativeTimeSpanString(
            updatedAtEpochMs,
            System.currentTimeMillis(),
            DateUtils.MINUTE_IN_MILLIS,
            DateUtils.FORMAT_ABBREV_RELATIVE
        )
    }
}

