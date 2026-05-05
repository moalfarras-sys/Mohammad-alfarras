package com.mo.moplayer.ui.widgets

import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import com.mo.moplayer.R
import com.mo.moplayer.data.weather.WeatherService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

/**
 * HTC-style Weather Widget
 * 
 * Displays current weather with temperature and condition icon.
 * Integrates with WeatherService for API data or shows cached/placeholder values.
 */
class WeatherWidget @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {
    
    private var ivWeatherIcon: ImageView
    private var tvTemperature: TextView
    private var tvCity: TextView? = null
    
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var weatherService: WeatherService? = null
    
    init {
        LayoutInflater.from(context).inflate(R.layout.widget_weather, this, true)
        
        ivWeatherIcon = findViewById(R.id.ivWeatherIcon)
        tvTemperature = findViewById(R.id.tvTemperature)
        tvCity = findViewById(R.id.tvCity)
        
        // Show placeholder until real data loads
        setWeather(22, "Clear", 1000, "", true)
    }
    
    /**
     * Initialize with WeatherService for automatic updates
     */
    fun initialize(weatherService: WeatherService) {
        this.weatherService = weatherService
        loadCachedWeather()
    }
    
    /**
     * Load cached weather data
     */
    private fun loadCachedWeather() {
        scope.launch {
            try {
                val cached = weatherService?.cachedWeather?.first()
                if (cached != null) {
                    setWeatherData(cached)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    /**
     * Refresh weather from API
     */
    fun refresh() {
        scope.launch {
            try {
                val result = weatherService?.fetchWeather()
                result?.onSuccess { data ->
                    setWeatherData(data)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    private fun setWeatherData(data: WeatherService.WeatherData) {
        tvTemperature.text = "${data.temperature}°"
        tvCity?.text = data.cityName
        
        val iconRes = weatherService?.getWeatherIconResource(data.conditionCode, data.isDay)
            ?: R.drawable.ic_weather_sunny
        ivWeatherIcon.setImageResource(iconRes)
    }
    
    /**
     * Set weather data manually (deprecated - use Weather3DWidget instead)
     * 
     * @param temperature Temperature in Celsius
     * @param condition Weather condition description
     * @param conditionCode Weather condition code
     * @param cityName City name to display
     */
    @Deprecated("Use Weather3DWidget instead", ReplaceWith("Weather3DWidget"))
    fun setWeather(temperature: Int, condition: String, conditionCode: Int = 1000, cityName: String = "", isDay: Boolean = true) {
        tvTemperature.text = "$temperature°"
        tvCity?.text = cityName
        
        val iconRes = weatherService?.getWeatherIconResource(conditionCode, isDay)
            ?: R.drawable.ic_weather_sunny
        ivWeatherIcon.setImageResource(iconRes)
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        scope.cancel()
    }
}
