package com.mo.moplayer.ui.home

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.graphics.Rect
import android.view.KeyEvent
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.isVisible
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.mo.moplayer.R
import com.mo.moplayer.ui.common.BaseTvActivity
import com.mo.moplayer.ui.common.ContentMenuDetails
import com.mo.moplayer.ui.common.ContentMenuHelper
import com.mo.moplayer.ui.common.SmoothItemAnimator
import com.mo.moplayer.data.config.AppRemoteConfig
import com.mo.moplayer.data.config.AppRemoteConfigService
import com.mo.moplayer.data.football.FootballService
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.data.repository.UnifiedContentType
import com.mo.moplayer.ui.common.utils.FocusMapRegistry
import com.mo.moplayer.data.weather.WeatherService
import kotlinx.coroutines.flow.combine
import com.mo.moplayer.util.TvNavigationManager
import com.mo.moplayer.databinding.ActivityHomeBinding
import com.mo.moplayer.ui.favorites.FavoritesActivity
import com.mo.moplayer.ui.home.adapters.ContentRowAdapter
import com.mo.moplayer.ui.livetv.LiveTvActivity
import com.mo.moplayer.ui.movies.MoviesActivity
import com.mo.moplayer.ui.player.PlayerActivity
import com.mo.moplayer.ui.series.SeriesActivity
import com.mo.moplayer.ui.search.SearchActivity
import com.mo.moplayer.ui.settings.SettingsActivity
import com.mo.moplayer.util.BackgroundManager
import com.mo.moplayer.util.CrashGuard
import com.mo.moplayer.util.DevicePerformance
import com.mo.moplayer.util.ParentalLockManager
import com.mo.moplayer.util.SmartRefreshManager
import com.mo.moplayer.util.ThemeManager
import com.mo.moplayer.ui.widgets.weather.FullScreenWeatherOverlay
import com.mo.moplayer.ui.common.design.TvCinematicTokens
import com.mo.moplayer.ui.common.background.BackgroundVisualMode
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.widget.ImageView
import com.bumptech.glide.Glide
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import androidx.lifecycle.lifecycleScope
import androidx.appcompat.app.AlertDialog
import com.mo.moplayer.data.update.AppUpdateInfo
import com.mo.moplayer.data.update.UpdateInstallResult
import com.mo.moplayer.data.update.UpdateRepository
import java.util.*
import javax.inject.Inject
import kotlinx.coroutines.Job
import java.text.SimpleDateFormat

@AndroidEntryPoint
class HomeActivity : BaseTvActivity() {
    
    override val screenId: String = "home"
    
    private lateinit var binding: ActivityHomeBinding
    private val viewModel: HomeViewModel by viewModels()
    
    @Inject
    lateinit var weatherService: WeatherService

    @Inject
    lateinit var footballService: FootballService
    
    @Inject
    lateinit var repository: IptvRepository
    
    @Inject
    lateinit var smartRefreshManager: SmartRefreshManager

    @Inject
    lateinit var recyclerViewOptimizer: com.mo.moplayer.util.RecyclerViewOptimizer

    @Inject
    lateinit var tvUiPreferences: com.mo.moplayer.util.TvUiPreferences

    @Inject
    lateinit var appRemoteConfigService: AppRemoteConfigService

    @Inject
    lateinit var parentalLockManager: ParentalLockManager
    
    private lateinit var contentAdapter: ContentRowAdapter
    private val clockHandler = Handler(Looper.getMainLooper())
    private var colonVisible = true
    private val weatherUpdateHandler = Handler(Looper.getMainLooper())
    private val weatherUpdateInterval = 30 * 60 * 1000L // 30 minutes
    private val startupHandler = Handler(Looper.getMainLooper())
    private val previewHandler = Handler(Looper.getMainLooper())
    private var weatherDetailsJob: Job? = null
    private var homeRowsEmpty = true
    private var homeRowsLoading = true
    private var newContentObserverJob: Job? = null
    private var initialContentFocusApplied = false
    private var homeEmptyDockFocusApplied = false
    private var lastFocusedContentRowIndex = 0
    private var lastFocusedContentCenterX = -1
    private var chromeInitialized = false
    private var visualFxStarted = false
    private var deferHeavyVisuals = true
    private var pendingPreviewItem: ContentItem? = null
    private var silentRefreshStarted = false
    private var updateCheckStarted = false
    private var appRemoteConfig = AppRemoteConfig()
    private var homeCityWallpaperSelected = false
    private var cityWallpaperRefreshInFlight = false
    private var activeSourceName: String? = null
    private var backgroundBehavior = com.mo.moplayer.util.TvUiPreferences.BackgroundBehavior.FOLLOW_PREVIEW
    
    private var currentDockIndex = 0
    private val dockItems by lazy {
        listOf(
            binding.dockHome,
            binding.dockLive,
            binding.dockMovies,
            binding.dockSeries,
            binding.dockFavorites,
            binding.dockSearch,
            binding.dockSettings
        )
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        applyWindowInsets()
        setupRecyclerView()
        setupDockNavigation()
        setupSearchButton()
        setupSurpriseMe()
        setupFocusMap()
        prepareDeferredStartupState()
        observeHomeCityWallpaper()
        applyRemoteConfig()
        observeViewModel()
        
        // Set Home as selected
        updateDockSelection(0)
        
        // Restore previous focus when possible to keep remote UX stable.
        binding.root.post {
            TvNavigationManager.restoreFocusState(screenId, binding.root)
            ensureHomeFocus()
        }
        scheduleDeferredStartup()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            binding.root.post {
                ensureHomeFocus()
            }
            scheduleInitialContentFocus()
        }
    }
    
    override fun getAnimatedBackground() = binding.animatedBackground

    override fun getWeatherOverlayView() = binding.weatherOverlay

    override fun getBackgroundWallpaperView() = binding.ivHomeCityWallpaper

    override fun getBackgroundScrimView() = binding.homeWallpaperScrim

    override fun getBackgroundVisualMode(): BackgroundVisualMode =
        if (deferHeavyVisuals) BackgroundVisualMode.REDUCED_MOTION
        else if (homeCityWallpaperSelected) BackgroundVisualMode.CITY_WALLPAPER_LOGIN
        else BackgroundVisualMode.WEATHER_REACTIVE
    
    override fun applyThemeToViews(color: Int) {
        super.applyThemeToViews(color)
        // Update dock selected icon color
        updateDockColors(color)
        // Update adapter colors for focused items
        if (::contentAdapter.isInitialized) {
            contentAdapter.updateThemeColor(color)
        }
        binding.footballWidget.setAccentColor(color)
    }
    
    private fun updateDockColors(accentColor: Int) {
        val selectedIndex = currentDockIndex
        dockItems.forEachIndexed { index, dockItem ->
            val iconView = dockItem.getChildAt(0) as? ImageView
            val labelView = dockItem.getChildAt(1) as? android.widget.TextView
            
            if (index == selectedIndex) {
                iconView?.colorFilter = PorterDuffColorFilter(accentColor, PorterDuff.Mode.SRC_IN)
                labelView?.setTextColor(accentColor)
            } else {
                iconView?.colorFilter = PorterDuffColorFilter(
                    ContextCompat.getColor(this, R.color.htc_text_secondary),
                    PorterDuff.Mode.SRC_IN
                )
                labelView?.setTextColor(ContextCompat.getColor(this, R.color.htc_text_secondary))
            }
        }
    }

    private fun prepareDeferredStartupState() {
        binding.topSignalBar.alpha = 0f
        binding.weatherWidget.visibility = View.INVISIBLE
        binding.footballWidget.visibility = View.INVISIBLE
        binding.serverExpiryWidget.visibility = View.VISIBLE
        binding.flipClockContainer.visibility = View.INVISIBLE
        binding.weatherOverlay.visibility = View.INVISIBLE
        binding.animatedBackground.setAnimationEnabled(false)
        binding.weatherOverlay.pauseAnimation()
    }

    private fun observeHomeCityWallpaper() {
        lifecycleScope.launch {
            combine(
                backgroundManager.currentTheme,
                backgroundManager.cityWallpaperState
            ) { theme, state -> theme to state }
            .collect { (theme, state) ->
                homeCityWallpaperSelected = theme == BackgroundManager.THEME_CITY_WALLPAPER
                renderHomeCityWallpaper(state)
                if (homeCityWallpaperSelected && !hasUsableCityWallpaper(state)) {
                    refreshHomeCityWallpaper()
                }
            }
        }
    }

    private fun renderHomeCityWallpaper(state: BackgroundManager.CityWallpaperState?) {
        if (!homeCityWallpaperSelected) {
            binding.ivHomeCityWallpaper.setImageDrawable(null)
            binding.ivHomeCityWallpaper.tag = null
            binding.ivHomeCityWallpaper.visibility = View.GONE
            binding.homeWallpaperScrim.visibility = View.GONE
            return
        }

        val imagePath = state?.imagePath
        if (imagePath.isNullOrBlank() || !java.io.File(imagePath).exists()) {
            binding.ivHomeCityWallpaper.setImageDrawable(null)
            binding.ivHomeCityWallpaper.tag = null
            binding.ivHomeCityWallpaper.alpha = 0f
            binding.ivHomeCityWallpaper.visibility = View.GONE
            binding.homeWallpaperScrim.visibility = View.GONE
            return
        }

        binding.ivHomeCityWallpaper.alpha = 1f
        binding.ivHomeCityWallpaper.visibility = View.VISIBLE
        binding.homeWallpaperScrim.visibility = View.VISIBLE
        binding.animatedBackground.alpha = 0f
        binding.animatedBackground.setAnimationEnabled(false)
        binding.animatedBackground.pauseAnimation()
        if (binding.ivHomeCityWallpaper.tag != imagePath) {
            binding.ivHomeCityWallpaper.tag = imagePath
            Glide.with(this@HomeActivity)
                .load(java.io.File(imagePath))
                .centerCrop()
                .into(binding.ivHomeCityWallpaper)
        }
    }

    private fun hasUsableCityWallpaper(state: BackgroundManager.CityWallpaperState?): Boolean {
        val imagePath = state?.imagePath
        return !imagePath.isNullOrBlank() && java.io.File(imagePath).exists()
    }

    private fun refreshHomeCityWallpaper() {
        if (cityWallpaperRefreshInFlight) return
        cityWallpaperRefreshInFlight = true
        lifecycleScope.launch {
            runCatching { backgroundManager.refreshCityWallpaper(force = false) }
            cityWallpaperRefreshInFlight = false
        }
    }

    private fun scheduleDeferredStartup() {
        startupHandler.removeCallbacksAndMessages(null)
        binding.root.post {
            startupHandler.postDelayed({
                initializeHomeChromeIfNeeded()
            }, 180L)
            startupHandler.postDelayed({
                startVisualEffectsIfNeeded()
            }, 700L)
            startupHandler.postDelayed({
                startSilentRefreshIfNeeded()
            }, 6000L)
            startupHandler.postDelayed({
                CrashGuard.markStable(this@HomeActivity)
            }, 12_000L)
        }
    }

    private fun initializeHomeChromeIfNeeded() {
        if (chromeInitialized) return
        chromeInitialized = true

        setupClock()
        setupWeather()
        setupFootballWidget()
        applyHomeWidgetPerformanceMode()

        val visibleChrome = listOfNotNull(
            binding.weatherWidget.takeIf { appRemoteConfig.weatherEnabled },
            binding.footballWidget.takeIf { appRemoteConfig.footballEnabled },
            binding.flipClockContainer
        )
        val lightweightWidgets = DevicePerformance.useLightweightHomeWidgets(this)
        visibleChrome.forEach { view ->
            view.visibility = View.VISIBLE
            if (lightweightWidgets) {
                view.alpha = 1f
                view.translationY = 0f
            } else {
                view.alpha = 0f
                view.translationY = -8f
                view.animate()
                    .alpha(1f)
                    .translationY(0f)
                    .setDuration(260L)
                    .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                    .start()
            }
        }

        binding.topSignalBar.animate()
            .alpha(1f)
            .setDuration(260L)
            .start()

        if (appRemoteConfig.footballEnabled) {
            binding.footballWidget.onActivityResumed()
        }
    }

    private fun applyRemoteConfig() {
        appRemoteConfig = appRemoteConfigService.cachedConfig()
        applyRemoteConfigState()
        lifecycleScope.launch {
            appRemoteConfig = appRemoteConfigService.fetchConfig()
            applyRemoteConfigState()
        }
    }

    private fun applyRemoteConfigState() {
        binding.weatherWidget.visibility = if (appRemoteConfig.weatherEnabled) View.VISIBLE else View.GONE
        binding.footballWidget.visibility = if (appRemoteConfig.footballEnabled) View.VISIBLE else View.GONE

        val message = when {
            !appRemoteConfig.enabled -> appRemoteConfig.message.ifBlank { "MoPlayer is temporarily unavailable." }
            appRemoteConfig.maintenanceMode -> appRemoteConfig.message.ifBlank { "MoPlayer is in maintenance mode." }
            appRemoteConfig.message.isNotBlank() -> appRemoteConfig.message
            else -> null
        }

        if (!message.isNullOrBlank()) {
            binding.tvPreviewTitle.text = message
            binding.tvPreviewDescription.text = "Managed from the Moalfarras control center."
            binding.tvPreviewDescription.isVisible = true
        } else if (appRemoteConfigService.isUsingCachedConfig()) {
            binding.tvPreviewDescription.text = appRemoteConfigService.connectionStatusLabel()
            binding.tvPreviewDescription.isVisible = true
        }
        binding.root.post { setupFocusMap() }
    }

    private fun applyHomeWidgetPerformanceMode() {
        val lightweightWidgets = DevicePerformance.useLightweightHomeWidgets(this)
        binding.weatherWidget.setLowPowerMode(lightweightWidgets)
        binding.footballWidget.setLowPowerMode(lightweightWidgets)
    }

    private fun parseRemoteAccentColor(value: String): Int? {
        return runCatching {
            val trimmed = value.trim()
            if (trimmed.matches(Regex("^#[0-9A-Fa-f]{6}$"))) Color.parseColor(trimmed) else null
        }.getOrNull()
    }

    private fun startVisualEffectsIfNeeded() {
        if (visualFxStarted) return
        visualFxStarted = true

        if (shouldUseReducedStartupVisuals()) {
            deferHeavyVisuals = true
            binding.weatherOverlay.visibility = View.GONE
            binding.weatherOverlay.pauseAnimation()
            binding.animatedBackground.setAnimationEnabled(false)
            binding.animatedBackground.pauseAnimation()
            applyThemeToViews(themeManager.currentAccentColor.value)
            CrashGuard.markStable(this)
            return
        }

        deferHeavyVisuals = false

        if (homeCityWallpaperSelected) {
            binding.animatedBackground.setAnimationEnabled(false)
            binding.animatedBackground.pauseAnimation()
        } else {
            binding.animatedBackground.setAnimationEnabled(true)
            binding.animatedBackground.resumeAnimation()
        }
        binding.weatherOverlay.visibility = if (homeCityWallpaperSelected) View.GONE else View.VISIBLE
        if (homeCityWallpaperSelected) {
            binding.weatherOverlay.pauseAnimation()
        } else {
            binding.weatherOverlay.startAnimation()
        }
        applyThemeToViews(themeManager.currentAccentColor.value)
    }

    private fun shouldUseReducedStartupVisuals(): Boolean {
        return DevicePerformance.isLow(this) || CrashGuard.shouldUseSafeMode(this)
    }

    private fun startSilentRefreshIfNeeded() {
        if (silentRefreshStarted) return
        silentRefreshStarted = true
        smartRefreshManager.startForegroundRefresh(lifecycleScope)
        viewModel.refreshSubscriptionOnce()
        checkForAppUpdate()
    }

    private fun checkForAppUpdate() {
        if (updateCheckStarted) return
        updateCheckStarted = true
        lifecycleScope.launch {
            val repo = UpdateRepository(this@HomeActivity)
            val info = runCatching { repo.fetchUpdateInfo() }.getOrNull() ?: return@launch
            if (!info.updateAvailable || isFinishing) return@launch
            showUpdateDialog(repo, info)
        }
    }

    private fun showUpdateDialog(repo: UpdateRepository, info: AppUpdateInfo) {
        val notes = info.releaseNotes.ifBlank {
            getString(R.string.update_available_message, info.latestVersionName)
        }
        val dialogView = layoutInflater.inflate(R.layout.dialog_app_update, null)
        dialogView.findViewById<TextView>(R.id.tvUpdateTitle).text =
            getString(R.string.update_available_title, info.latestVersionName)
        dialogView.findViewById<TextView>(R.id.tvUpdateMessage).text = notes
        dialogView.findViewById<TextView>(R.id.tvUpdateVersion).text =
            getString(R.string.update_version_compare, info.currentVersionCode, info.latestVersionCode)
        val laterButton = dialogView.findViewById<Button>(R.id.btnUpdateLater)
        val updateButton = dialogView.findViewById<Button>(R.id.btnUpdateNow)
        val buttonRow = dialogView.findViewById<View>(R.id.updateButtonRow)
        val progressContainer = dialogView.findViewById<View>(R.id.updateProgressContainer)
        val progressBar = dialogView.findViewById<android.widget.ProgressBar>(R.id.updateProgressBar)
        val progressText = dialogView.findViewById<TextView>(R.id.tvUpdateProgress)
        laterButton.visibility = if (info.forceUpdate) View.GONE else View.VISIBLE

        val dialog = AlertDialog.Builder(this, R.style.AlertDialogTheme)
            .setView(dialogView)
            .setCancelable(!info.forceUpdate)
            .create()
        dialog.setOnShowListener {
            dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)
            laterButton.setOnClickListener { dialog.dismiss() }
            updateButton.setOnClickListener {
                // Download in place with live progress instead of closing the dialog and leaving
                // the user staring at a frozen screen during a ~50 MB download.
                buttonRow.visibility = View.GONE
                progressContainer.visibility = View.VISIBLE
                progressBar.progress = 0
                progressText.setText(R.string.update_downloading)
                dialog.setCancelable(false)
                startUpdateDownload(repo, info, dialog, progressBar, progressText)
            }
            updateButton.requestFocus()
        }
        dialog.show()
    }

    private fun startUpdateDownload(
        repo: UpdateRepository,
        info: AppUpdateInfo,
        dialog: AlertDialog,
        progressBar: android.widget.ProgressBar,
        progressText: TextView
    ) {
        lifecycleScope.launch {
            val result = repo.downloadAndOpenInstaller(info) { pct ->
                runOnUiThread {
                    progressBar.progress = pct
                    progressText.text = getString(R.string.update_downloading_percent, pct)
                }
            }
            if (dialog.isShowing) dialog.dismiss()
            when (result) {
                is UpdateInstallResult.InstallPermissionRequired ->
                    android.widget.Toast.makeText(this@HomeActivity, R.string.update_permission_required, android.widget.Toast.LENGTH_LONG).show()
                is UpdateInstallResult.Failed ->
                    android.widget.Toast.makeText(this@HomeActivity, getString(R.string.update_failed, result.message), android.widget.Toast.LENGTH_LONG).show()
                UpdateInstallResult.InstallerOpened -> Unit
            }
        }
    }

    private fun setupWeather() {
        // Initialize weather widget with service (automatic IP-based location)
        binding.weatherWidget.initialize(weatherService)

        // Click/OK on widget opens details overlay (TV + touch)
        binding.weatherWidget.setOnClickListener {
            showWeatherDetailsOverlay()
        }
        // Long-press still opens details (alternative)
        binding.weatherWidget.setOnLongClickListener {
            showWeatherDetailsOverlay()
            true
        }

        binding.weatherDetailsOverlay.setOnDismissListener {
            weatherDetailsJob?.cancel()
            weatherDetailsJob = null
            // Return focus to weather widget for TV UX
            binding.weatherWidget.requestFocus()
        }
        
        // Setup weather overlay with live updates
        setupWeatherOverlay()
        
        startWeatherRefreshLoop()
    }

    private fun setupFootballWidget() {
        binding.footballWidget.initialize(footballService)
        binding.footballWidget.onMatchClick = { match ->
            showMatchDetailsOverlay(match)
        }
        binding.matchDetailsOverlay.setOnDismissListener {
            binding.footballWidget.requestFocus()
        }
        // Observe football widget enabled setting and show/hide widget
        lifecycleScope.launch {
            var wasVisible: Boolean? = null
            footballService.footballWidgetEnabled.collect { enabled ->
                val visible = enabled && appRemoteConfig.footballEnabled
                binding.footballWidget.visibility = if (visible) View.VISIBLE else View.GONE
                if (wasVisible != visible) {
                    wasVisible = visible
                    binding.root.post { setupFocusMap() }
                }
            }
        }
    }

    private fun showMatchDetailsOverlay(match: com.mo.moplayer.data.football.LiveMatchData) {
        lifecycleScope.launch {
            val data = footballService.footballData.first()
            val related = data?.let { footballData ->
                (footballData.importantMatches + footballData.previousDay + footballData.today + footballData.nextDay + footballData.matches)
                    .distinctBy { it.timestamp.toString() + it.homeTeam + it.awayTeam }
                    .filterNot { it.homeTeam == match.homeTeam && it.awayTeam == match.awayTeam && it.timestamp == match.timestamp }
                    .sortedWith(
                        compareByDescending<com.mo.moplayer.data.football.LiveMatchData> { it.competitionPriority }
                            .thenBy { kotlin.math.abs(it.timestamp - match.timestamp) }
                    )
                    .take(8)
            }.orEmpty()
            binding.matchDetailsOverlay.show(match, related)
        }
    }

    private fun showWeatherDetailsOverlay() {
        binding.weatherDetailsOverlay.showLoading()

        // Live-updating details while overlay is visible
        weatherDetailsJob?.cancel()
        weatherDetailsJob = lifecycleScope.launch {
            weatherService.cachedWeather.collect { data ->
                data?.let { binding.weatherDetailsOverlay.update(it) }
            }
        }

        lifecycleScope.launch {
            val first = weatherService.cachedWeather.first()
            first?.let { binding.weatherDetailsOverlay.show(it) }
        }
    }
    
    private fun setupWeatherOverlay() {
        // Observe weather enabled, effects quality, and weather data for visibility and updates
        lifecycleScope.launch {
            var weatherWidgetWasVisible: Boolean? = null
            combine(
                weatherService.weatherEnabled,
                weatherService.weatherEffectsQuality,
                weatherService.weatherReduceMotion,
                weatherService.weatherDisableLightning,
                weatherService.cachedWeather
            ) { enabled, quality, reduceMotion, disableLightning, weatherData ->
                WeatherState(enabled, quality, reduceMotion, disableLightning, weatherData)
            }.collect { (enabled, quality, reduceMotion, disableLightning, weatherData) ->
                // Visibility: hide both when disabled; hide overlay only when quality OFF
                val weatherVisible = enabled && appRemoteConfig.weatherEnabled
                val effectsAllowed = !DevicePerformance.useLightweightHomeWidgets(this@HomeActivity) &&
                    !CrashGuard.shouldUseSafeMode(this@HomeActivity)
                binding.weatherWidget.visibility = if (weatherVisible) View.VISIBLE else View.GONE
                if (weatherWidgetWasVisible != weatherVisible) {
                    weatherWidgetWasVisible = weatherVisible
                    binding.root.post { setupFocusMap() }
                }
                binding.weatherOverlay.visibility = when {
                    !weatherVisible -> View.GONE
                    !effectsAllowed -> View.GONE
                    quality == WeatherService.EFFECT_QUALITY_OFF -> View.GONE
                    else -> View.VISIBLE
                }
                if (!effectsAllowed) {
                    binding.weatherOverlay.pauseAnimation()
                }
                // Update overlay settings (quality, reduce motion, lightning)
                binding.weatherOverlay.setEffectSettings(
                    quality = quality,
                    reduceMotion = reduceMotion,
                    disableLightning = disableLightning
                )
                // Update weather data when available
                weatherData?.let {
                    val category = weatherService.getWeatherCategory(it.conditionCode)
                    binding.weatherOverlay.setWeatherData(
                        category = category,
                        isDay = it.isDay,
                        params = com.mo.moplayer.ui.widgets.weather.FullScreenWeatherOverlay.WeatherFxParams(
                            windSpeedKph = it.windSpeed,
                            windDegree = it.windDegree,
                            humidity = it.humidity,
                            precipMm = it.precipMm,
                            cloud = it.cloud
                        )
                    )
                }
            }
        }
    }

    private data class WeatherState(
        val enabled: Boolean,
        val quality: Int,
        val reduceMotion: Boolean,
        val disableLightning: Boolean,
        val weatherData: WeatherService.WeatherData?
    )
    
    private val weatherUpdateRunnable = object : Runnable {
        override fun run() {
            binding.weatherWidget.refresh()
            weatherUpdateHandler.postDelayed(this, weatherUpdateInterval)
        }
    }

    private fun startWeatherRefreshLoop() {
        weatherUpdateHandler.removeCallbacks(weatherUpdateRunnable)
        weatherUpdateHandler.post(weatherUpdateRunnable)
    }
    
    private fun applyWindowInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.mainContentContainer) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(
                systemBars.left,
                systemBars.top,
                systemBars.right,
                systemBars.bottom
            )
            WindowInsetsCompat.CONSUMED
        }
        ViewCompat.requestApplyInsets(binding.root)
    }
    
    private fun setupRecyclerView() {
        contentAdapter = ContentRowAdapter(
            onItemClick = { item -> handleItemClick(item) },
            onItemFocused = { item -> handleItemFocused(item) },
            onItemLongPress = { item -> showContentContextMenu(item) },
            onFavoriteShortcut = { item ->
                lifecycleScope.launch {
                    val server = repository.getActiveServerSync() ?: return@launch
                    when (item.type) {
                        ContentType.MOVIE -> repository.toggleFavorite(
                            serverId = server.id,
                            contentId = item.id,
                            contentType = "movie",
                            name = item.title,
                            iconUrl = item.posterUrl
                        )
                        ContentType.SERIES -> repository.toggleFavorite(
                            serverId = server.id,
                            contentId = item.id,
                            contentType = "series",
                            name = item.title,
                            iconUrl = item.posterUrl
                        )
                        ContentType.CHANNEL -> repository.toggleFavorite(
                            serverId = server.id,
                            contentId = item.id,
                            contentType = "channel",
                            name = item.title,
                            iconUrl = item.posterUrl
                        )
                        ContentType.EPISODE -> {
                            val seriesId = item.seriesId ?: item.id
                            repository.toggleFavorite(
                                serverId = server.id,
                                contentId = seriesId,
                                contentType = "series",
                                name = item.title,
                                iconUrl = item.posterUrl
                            )
                        }
                    }
                }
            },
            themeManager = themeManager,
            tvUiPreferences = tvUiPreferences,
            recyclerViewOptimizer = recyclerViewOptimizer
        )
        
        binding.rvContent.apply {
            layoutManager = LinearLayoutManager(this@HomeActivity)
            adapter = contentAdapter
            // Use smooth animator for non-intrusive updates
            itemAnimator = SmoothItemAnimator()
            recyclerViewOptimizer.optimizeContentRowList(this)
            onFocusChangeListener = View.OnFocusChangeListener { _, hasFocus ->
                if (hasFocus) {
                    post {
                        requestPrimaryContentFocus()
                    }
                }
            }
            
            // Parallax effect for weather overlay
            addOnScrollListener(object : androidx.recyclerview.widget.RecyclerView.OnScrollListener() {
                override fun onScrolled(recyclerView: androidx.recyclerview.widget.RecyclerView, dx: Int, dy: Int) {
                    val offsetY = recyclerView.computeVerticalScrollOffset()
                    binding.weatherOverlay.setScrollOffset(offsetY)
                }
            })
        }

        lifecycleScope.launch {
            combine(tvUiPreferences.posterSize, tvUiPreferences.animationsEnabled) { posterSize, animationsEnabled ->
                posterSize to animationsEnabled
            }.collect { (posterSize, animationsEnabled) ->
                contentAdapter.updateUiPreferences(posterSize, animationsEnabled)
            }
        }
        lifecycleScope.launch {
            tvUiPreferences.backgroundBehavior.collect { behavior ->
                backgroundBehavior = behavior
                if (behavior == com.mo.moplayer.util.TvUiPreferences.BackgroundBehavior.STATIC) {
                    hidePreviewBackdrop()
                }
            }
        }
    }
    
    private fun setupSurpriseMe() {
        binding.btnSurprise.setOnClickListener {
            // Animate button
            it.animate().rotationBy(180f).setDuration(TvCinematicTokens.ENTER_EXIT_DURATION_MS).start()
            viewModel.onSurpriseMeClicked()
        }
    }

    private fun setupSearchButton() {
        binding.btnSearch.setOnClickListener {
            startActivity(Intent(this, SearchActivity::class.java))
        }
        
        binding.btnSearch.setOnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER && event.action == KeyEvent.ACTION_UP) {
                startActivity(Intent(this, SearchActivity::class.java))
                true
            } else false
        }
    }

    private fun setupDockNavigation() {
        // Click listeners
        binding.dockHome.setOnClickListener { navigateTo(DockItem.HOME) }
        binding.dockLive.setOnClickListener { navigateTo(DockItem.LIVE) }
        binding.dockMovies.setOnClickListener { navigateTo(DockItem.MOVIES) }
        binding.dockSeries.setOnClickListener { navigateTo(DockItem.SERIES) }
        binding.dockFavorites.setOnClickListener { navigateTo(DockItem.FAVORITES) }
        binding.dockSearch.setOnClickListener { navigateTo(DockItem.SEARCH) }
        binding.dockSettings.setOnClickListener { navigateTo(DockItem.SETTINGS) }
        
        // Focus change listeners with animations
        dockItems.forEachIndexed { index, view ->
            view.setOnFocusChangeListener { v, hasFocus ->
                animateDockItem(v, hasFocus)
                if (hasFocus) {
                    currentDockIndex = index
                    updateDockSelection(index)
                }
            }
        }
    }

    private fun focusableHomeWidgets(): List<View> =
        listOf(binding.weatherWidget, binding.footballWidget, binding.serverExpiryWidget, binding.flipClockContainer)
            .filter { it.visibility == View.VISIBLE && it.isFocusable && it.id != View.NO_ID }

    private fun firstFocusableHomeWidget(): View? = focusableHomeWidgets().firstOrNull()

    private fun setupFocusMap() {
        val actionStrip = listOf(
            binding.btnSearch,
            binding.btnSurprise
        ).filter { it.visibility == View.VISIBLE && it.id != View.NO_ID }

        val widgetStripViews = focusableHomeWidgets()

        FocusMapRegistry.mapHorizontalStrip(
            views = widgetStripViews,
            wrap = false,
            downTarget = actionStrip.firstOrNull() ?: binding.newContentBadge,
            upTarget = null
        )

        FocusMapRegistry.mapHorizontalStrip(
            views = actionStrip,
            wrap = true,
            downTarget = binding.newContentBadge,
            upTarget = widgetStripViews.firstOrNull()
        )
        binding.btnSearch.nextFocusUpId = binding.weatherWidget.id
        binding.btnSurprise.nextFocusUpId = binding.footballWidget.id

        FocusMapRegistry.mapHorizontalStrip(
            views = dockItems,
            wrap = true,
            upTarget = binding.rvContent
        )

        binding.rvContent.nextFocusUpId =
            if (binding.newContentBadge.visibility == View.VISIBLE) {
                binding.newContentBadge.id
            } else {
                actionStrip.firstOrNull()?.id ?: widgetStripViews.firstOrNull()?.id ?: binding.topBar.id
            }
        binding.rvContent.nextFocusDownId = binding.dockHome.id
    }

    private fun ensureHomeFocus() {
        val focused = currentFocus
        if (focused != null && focused.isShown && focused.isFocusable) return

        if (requestPrimaryContentFocus()) {
            return
        }

        if (binding.dockHome.isShown && binding.dockHome.isFocusable) {
            binding.dockHome.requestFocus()
            return
        }

        if (binding.btnSearch.isShown && binding.btnSearch.isFocusable) {
            binding.btnSearch.requestFocus()
            return
        }

        binding.rvContent.requestFocus()
    }

    private fun requestPrimaryContentFocus(): Boolean {
        if (requestRememberedContentFocus()) {
            return true
        }
        val contentCandidate = findFocusableCardInContent()
        if (contentCandidate != null) {
            return contentCandidate.requestFocus()
        }
        return false
    }

    private fun scheduleInitialContentFocus() {
        binding.rvContent.postDelayed({
            if (initialContentFocusApplied || !::contentAdapter.isInitialized || contentAdapter.itemCount == 0) {
                return@postDelayed
            }

            val focused = currentFocus
            val shouldShiftToContent = focused == null ||
                dockItems.any { it == focused } ||
                isViewInParent(focused, binding.topBar) ||
                isViewInParent(focused, binding.topSignalBar)

            if (shouldShiftToContent && requestPrimaryContentFocus()) {
                initialContentFocusApplied = true
            }
        }, 280)
    }

    private fun homeContentLayoutManager(): LinearLayoutManager? =
        binding.rvContent.layoutManager as? LinearLayoutManager

    private fun findFocusableCardInContent(): View? {
        val lm = homeContentLayoutManager() ?: return null
        val adapter = binding.rvContent.adapter ?: return null
        for (adapterPos in 0 until adapter.itemCount) {
            val rowRoot = lm.findViewByPosition(adapterPos) ?: continue
            val rowRecycler = rowRoot.findViewById<RecyclerView>(R.id.rvRowItems) ?: continue
            findFirstVisibleFocusableCardInRow(rowRecycler)?.let { return it }
        }
        return null
    }

    private fun requestRememberedContentFocus(): Boolean {
        if (lastFocusedContentCenterX < 0) {
            return false
        }

        return requestContentRowFocus(lastFocusedContentRowIndex, lastFocusedContentCenterX)
    }

    private fun requestAdjacentRowFocus(direction: Int): Boolean {
        val currentRowIndex = findFocusedContentRowAdapterPosition() ?: return false
        val targetRowIndex = if (direction == View.FOCUS_DOWN) currentRowIndex + 1 else currentRowIndex - 1
        val preferredCenterX = if (lastFocusedContentCenterX >= 0) lastFocusedContentCenterX else currentFocusCenterX()
        return requestContentRowFocus(targetRowIndex, preferredCenterX)
    }

    /**
     * Focus a card in the vertical row at [rowIndex] (adapter position), aligning horizontally
     * with [preferredCenterX]. Uses [LinearLayoutManager.findViewByPosition] — not [RecyclerView.getChildAt],
     * which only reflects visible children and breaks D-pad moves between "Recent movies" / "Recent series".
     */
    private fun requestContentRowFocus(rowIndex: Int, preferredCenterX: Int): Boolean {
        val lm = homeContentLayoutManager() ?: return false
        val adapter = binding.rvContent.adapter ?: return false
        if (rowIndex !in 0 until adapter.itemCount) {
            return false
        }

        fun tryFocus(): Boolean {
            val rowRoot = lm.findViewByPosition(rowIndex) ?: return false
            val rowRecycler = rowRoot.findViewById<RecyclerView>(R.id.rvRowItems) ?: return false
            val candidate = findBestCardInRow(rowRecycler, preferredCenterX)
                ?: findFirstVisibleFocusableCardInRow(rowRecycler)
                ?: return false
            val ok = candidate.requestFocus()
            if (ok) {
                updateLastContentFocus(candidate)
            }
            return ok
        }

        if (tryFocus()) {
            return true
        }

        binding.rvContent.scrollToPosition(rowIndex)
        binding.rvContent.post {
            if (!tryFocus()) {
                binding.rvContent.post { tryFocus() }
            }
        }
        return true
    }

    private fun findFirstVisibleFocusableCardInRow(rowRecycler: RecyclerView): View? {
        for (i in 0 until rowRecycler.childCount) {
            val card = rowRecycler.getChildAt(i) ?: continue
            if (card.isShown && card.isFocusable) {
                return card
            }
        }
        return null
    }

    private fun findBestCardInRow(
        rowRecycler: RecyclerView,
        preferredCenterX: Int
    ): View? {
        var bestCard: View? = null
        var bestDistance = Int.MAX_VALUE

        for (index in 0 until rowRecycler.childCount) {
            val candidate = rowRecycler.getChildAt(index) ?: continue
            if (!candidate.isShown || !candidate.isFocusable) continue

            val rect = Rect()
            candidate.getGlobalVisibleRect(rect)
            val centerX = rect.centerX()
            val distance = kotlin.math.abs(centerX - preferredCenterX)
            if (distance < bestDistance) {
                bestDistance = distance
                bestCard = candidate
            }
        }

        return bestCard
    }

    private fun currentFocusCenterX(): Int {
        val rect = Rect()
        val focusView = currentFocus ?: return 0
        focusView.getGlobalVisibleRect(rect)
        return rect.centerX()
    }

    private fun findFocusedContentRowAdapterPosition(): Int? {
        val focused = currentFocus ?: return null
        val rowRecycler = findParentRowRecycler(focused) ?: return null
        val rowRoot = rowRecycler.parent as? View ?: return null
        val pos = binding.rvContent.getChildAdapterPosition(rowRoot)
        return if (pos == RecyclerView.NO_POSITION) null else pos
    }

    private fun findParentRowRecycler(view: View): RecyclerView? {
        var current: android.view.ViewParent? = view.parent
        while (current is View) {
            if (current is RecyclerView && current.id == R.id.rvRowItems) {
                return current
            }
            current = current.parent
        }
        return null
    }

    private fun updateLastContentFocus(view: View?) {
        val focusView = view ?: return
        val rowRecycler = findParentRowRecycler(focusView) ?: return
        val rowRoot = rowRecycler.parent as? View ?: return
        val rowIndex = binding.rvContent.getChildAdapterPosition(rowRoot)
        if (rowIndex == RecyclerView.NO_POSITION) {
            return
        }

        val rect = Rect()
        focusView.getGlobalVisibleRect(rect)
        lastFocusedContentRowIndex = rowIndex
        lastFocusedContentCenterX = rect.centerX()
    }
    
    private fun animateDockItem(view: View, hasFocus: Boolean) {
        val scale = if (hasFocus) TvCinematicTokens.DOCK_SCALE else 1.0f
        val translationY = if (hasFocus) -4f else 0f
        view.animate()
            .scaleX(scale)
            .scaleY(scale)
            .translationY(translationY)
            .setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
            .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
            .start()
    }
    
    private fun updateDockSelection(selectedIndex: Int) {
        currentDockIndex = selectedIndex
        
        val icons = listOf(
            binding.iconHome,
            binding.iconLive,
            binding.iconMovies,
            binding.iconSeries,
            binding.iconFavorites,
            binding.iconDockSearch,
            binding.iconSettings
        )
        
        val labels = listOf(
            binding.labelHome,
            binding.labelLive,
            binding.labelMovies,
            binding.labelSeries,
            binding.labelFavorites,
            binding.labelDockSearch,
            binding.labelSettings
        )
        
        val accentColor = themeManager.currentAccentColor.value
        val normalColor = ContextCompat.getColor(this, R.color.htc_dock_icon_normal)
        val textPrimaryColor = ContextCompat.getColor(this, R.color.htc_text_primary)
        val textSecondaryColor = ContextCompat.getColor(this, R.color.htc_text_secondary)
        
        // Update selection state for background glow
        dockItems.forEachIndexed { index, view ->
            view.isSelected = (index == selectedIndex)
        }
        
        icons.forEachIndexed { index, icon ->
            val color = if (index == selectedIndex) accentColor else normalColor
            icon.setColorFilter(color)
        }
        
        labels.forEachIndexed { index, label ->
            val color = if (index == selectedIndex) textPrimaryColor else textSecondaryColor
            label.setTextColor(color)
            
            // Bold font for selected
            if (index == selectedIndex) {
                 label.typeface = Typeface.DEFAULT_BOLD
            } else {
                 label.typeface = Typeface.DEFAULT
            }
        }
    }
    
    private fun navigateTo(item: DockItem) {
        when (item) {
            DockItem.HOME -> {
                updateDockSelection(0)
                if (!requestPrimaryContentFocus()) {
                    binding.dockHome.requestFocus()
                }
            }
            DockItem.LIVE -> {
                startActivity(
                    Intent(this, LiveTvActivity::class.java)
                        .addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                )
            }
            DockItem.MOVIES -> {
                startActivity(
                    Intent(this, MoviesActivity::class.java)
                        .addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                )
            }
            DockItem.SERIES -> {
                startActivity(
                    Intent(this, SeriesActivity::class.java)
                        .addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                )
            }
            DockItem.FAVORITES -> {
                startActivity(
                    Intent(this, FavoritesActivity::class.java)
                        .addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                )
            }
            DockItem.SEARCH -> {
                startActivity(
                    Intent(this, SearchActivity::class.java)
                        .addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                )
            }
            DockItem.SETTINGS -> {
                startActivity(
                    Intent(this, SettingsActivity::class.java)
                        .addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                )
            }
        }
    }
    
    private fun setupClock() {
        updateClock()
        startClockLoop()
    }
    
    private val clockRunnable = object : Runnable {
        override fun run() {
            updateClock()
            clockHandler.postDelayed(this, 1000)
        }
    }

    private fun startClockLoop() {
        clockHandler.removeCallbacks(clockRunnable)
        clockHandler.post(clockRunnable)
    }
    
    private fun updateClock() {
        val calendar = Calendar.getInstance()
        val hour = calendar.get(Calendar.HOUR_OF_DAY)
        val minute = calendar.get(Calendar.MINUTE)
        
        val hourStr = String.format("%02d", hour)
        val minuteStr = String.format("%02d", minute)
        
        binding.flipClock.tvHour1.text = hourStr[0].toString()
        binding.flipClock.tvHour2.text = hourStr[1].toString()
        binding.flipClock.tvMinute1.text = minuteStr[0].toString()
        binding.flipClock.tvMinute2.text = minuteStr[1].toString()
        
        // Blink colon
        colonVisible = !colonVisible
        binding.flipClock.tvColon.alpha = if (colonVisible) 1f else 0.3f
    }
    
    private fun observeViewModel() {
        viewModel.contentRows.observe(this) { rows ->
            contentAdapter.submitList(rows?.let { ArrayList(it) })
            homeRowsEmpty = rows.isNullOrEmpty()
            renderHomeEmptyState()
            if (!rows.isNullOrEmpty() && !initialContentFocusApplied) {
                scheduleInitialContentFocus()
            }
        }
        
        viewModel.isLoading.observe(this) { isLoading ->
            homeRowsLoading = isLoading
            renderHomeEmptyState()
        }

        viewModel.activeServerLiveData.observe(this) { server ->
            activeSourceName = server?.name
            binding.serverExpiryWidget.text = buildServerExpiryText(server)
            binding.serverExpiryWidget.visibility = View.VISIBLE
            maybeShowSubscriptionExpiredDialog(server)
            if (homeRowsEmpty && !homeRowsLoading) {
                renderHomeEmptyCopy(viewModel.dashboardState.value)
            }
        }
        
        lifecycleScope.launch {
            viewModel.surpriseEvent.collect { item ->
                android.widget.Toast.makeText(
                    this@HomeActivity,
                    getString(R.string.surprise_preview_ready, item.title),
                    android.widget.Toast.LENGTH_SHORT
                ).show()
                showPreviewBackdrop(item)
                binding.root.postDelayed({
                    handleItemClick(item)
                }, 220L)
            }
        }

        lifecycleScope.launch {
            viewModel.dashboardState.collect { state ->
                renderDashboardStatus(state)
            }
        }
    }

    private fun buildServerExpiryText(server: com.mo.moplayer.data.local.entity.ServerEntity?): String {
        if (server == null) return getString(R.string.home_subscription_no_source)
        val expiry = server.expirationDate?.takeIf { it.isNotBlank() }?.let { raw ->
            val expiryMillis = parseProviderDateMillis(raw)
            val expiryDate = formatProviderDate(raw)
            if (expiryMillis == null) {
                getString(R.string.home_subscription_last_day, expiryDate)
            } else {
                val remainingMs = expiryMillis - System.currentTimeMillis()
                when {
                    remainingMs <= 0L -> getString(R.string.home_subscription_expired, expiryDate)
                    remainingMs < 48L * 60L * 60L * 1000L -> {
                        val hoursLeft = kotlin.math.max(1L, remainingMs / (60L * 60L * 1000L))
                        getString(R.string.home_subscription_hours_left, hoursLeft, expiryDate)
                    }
                    else -> {
                        val daysLeft = kotlin.math.max(1L, remainingMs / (24L * 60L * 60L * 1000L))
                        getString(R.string.home_subscription_days_left, daysLeft, expiryDate)
                    }
                }
            }
        }
        return expiry ?: getString(R.string.home_subscription_active)
    }

    private fun parseProviderDateMillis(value: String): Long? =
        com.mo.moplayer.util.ProviderSubscription.parseProviderDateMillis(value)

    private fun formatProviderDate(value: String): String =
        com.mo.moplayer.util.ProviderSubscription.formatProviderDate(value)

    // Show the clear "subscription expired" dialog at most once per active source per session.
    private var subscriptionExpiredShownForServerId: Long? = null
    private var subscriptionExpiredDialog: android.app.AlertDialog? = null

    /**
     * When the active source's subscription is out of days (or the panel reports it
     * expired/banned/disabled), surface a clear, blocking message over the kept library
     * instead of letting the user hit silent playback failures. Offered actions:
     * sign in with a renewed/new source, or keep browsing the cache for now.
     */
    private fun maybeShowSubscriptionExpiredDialog(server: com.mo.moplayer.data.local.entity.ServerEntity?) {
        server ?: return
        val info = com.mo.moplayer.util.ProviderSubscription.infoFor(server)
        if (!info.isExpired) {
            // Subscription is healthy again (e.g. renewed) — allow the dialog to show next time.
            if (subscriptionExpiredShownForServerId == server.id) {
                subscriptionExpiredShownForServerId = null
            }
            return
        }
        if (subscriptionExpiredShownForServerId == server.id) return
        if (subscriptionExpiredDialog?.isShowing == true) return
        if (isFinishing || isDestroyed) return
        subscriptionExpiredShownForServerId = server.id

        val dateLine = info.expiryLabel?.let { getString(R.string.subscription_expired_on, it) }
        val message = listOfNotNull(getString(R.string.subscription_expired_message), dateLine)
            .joinToString("\n\n")

        subscriptionExpiredDialog = android.app.AlertDialog.Builder(this, R.style.AlertDialogTheme)
            .setTitle(R.string.subscription_expired_title)
            .setMessage(message)
            .setCancelable(true)
            .setPositiveButton(R.string.subscription_expired_new_signin) { d, _ ->
                d.dismiss()
                openLoginForNewSource()
            }
            .setNegativeButton(R.string.subscription_expired_later) { d, _ -> d.dismiss() }
            .setOnDismissListener { subscriptionExpiredDialog = null }
            .create()
        subscriptionExpiredDialog?.show()
    }

    private fun openLoginForNewSource() {
        val intent = Intent(this, com.mo.moplayer.ui.login.LoginActivity::class.java).apply {
            putExtra("add_new_server", true)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        startActivity(intent)
    }

    private fun renderHomeEmptyState() {
        val showEmpty = homeRowsEmpty && !homeRowsLoading
        binding.homeEmptyState.isVisible = showEmpty
        binding.rvContent.isVisible = !showEmpty
        if (showEmpty) {
            val state = viewModel.dashboardState.value
            renderHomeEmptyCopy(state)
            renderDashboardStatus(state)
            maybeFocusDockForEmptyHome()
        } else {
            homeEmptyDockFocusApplied = false
        }
    }

    private fun maybeFocusDockForEmptyHome() {
        if (homeEmptyDockFocusApplied) return
        val focused = currentFocus
        val shouldMoveToDock = focused == null ||
            isViewInParent(focused, binding.topSignalBar) ||
            focused == binding.homeEmptyState
        if (!shouldMoveToDock) return

        binding.dockHome.post {
            if (binding.homeEmptyState.isVisible && binding.dockHome.requestFocus()) {
                homeEmptyDockFocusApplied = true
            }
        }
    }

    private fun renderHomeEmptyCopy(state: HomeDashboardState) {
        val sourceName = state.sourceName?.takeIf { it.isNotBlank() } ?: activeSourceName
        val hasSource = !sourceName.isNullOrBlank()
        if (!hasSource) {
            binding.tvHomeEmptyTitle.setText(R.string.home_empty_title)
            binding.tvHomeEmptySubtitle.setText(R.string.home_empty_subtitle)
            return
        }

        val hasAnyContent = state.liveCount > 0 || state.movieCount > 0 || state.seriesCount > 0
        binding.tvHomeEmptyTitle.setText(R.string.home_source_ready_title)
        binding.tvHomeEmptySubtitle.text = if (hasAnyContent) {
            getString(
                R.string.home_source_ready_subtitle,
                state.liveCount,
                state.movieCount,
                state.seriesCount
            )
        } else {
            getString(R.string.home_source_ready_pending_subtitle, sourceName.orEmpty())
        }
    }

    private fun renderDashboardStatus(state: HomeDashboardState) {
        val sourceName = state.sourceName?.takeIf { it.isNotBlank() } ?: activeSourceName
        val hasSource = !sourceName.isNullOrBlank()
        // binding.dashboardStatusStrip.isVisible = hasSource
        if (!hasSource) {
            binding.tvPreviewTitle.setText(R.string.home_empty_title)
            binding.tvPreviewDescription.setText(R.string.home_empty_subtitle)
            binding.tvPreviewDescription.isVisible = true
            return
        }

        val hasAnyContent = state.liveCount > 0 || state.movieCount > 0 || state.seriesCount > 0
        if (homeRowsEmpty && hasAnyContent) {
            binding.tvPreviewTitle.setText(R.string.home_source_ready_title)
            binding.tvPreviewDescription.text = getString(
                R.string.home_source_ready_subtitle,
                state.liveCount,
                state.movieCount,
                state.seriesCount
            )
            binding.tvPreviewDescription.isVisible = true
        } else if (homeRowsEmpty) {
            binding.tvPreviewTitle.setText(R.string.home_source_ready_title)
            binding.tvPreviewDescription.text = getString(
                R.string.home_source_ready_pending_subtitle,
                sourceName.orEmpty()
            )
            binding.tvPreviewDescription.isVisible = true
        }
    }
    
    private fun observeNewContent() {
        if (newContentObserverJob != null) return
        newContentObserverJob = lifecycleScope.launch {
            smartRefreshManager.newContentAvailable.collect { changes ->
                changes?.let {
                    if (it.hasNewContent) {
                        showNewContentBadge(it.totalNewContent)
                    }
                }
            }
        }
    }
    
    /**
     * Show the new content badge with a smooth animation.
     * The badge auto-hides after a few seconds.
     */
    private fun showNewContentBadge(newCount: Int) {
        if (newCount <= 0) return
        
        binding.newContentBadge.apply {
            text = getString(R.string.new_content_badge_format, newCount)
            visibility = View.VISIBLE
            
            // Animate in from right with fade
            translationX = 50f
            alpha = 0f
            
            animate()
                .translationX(0f)
                .alpha(1f)
                .setDuration(TvCinematicTokens.ENTER_EXIT_DURATION_MS)
                .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                .withEndAction {
                    // Auto-hide after 10 seconds
                    postDelayed({
                        hideNewContentBadge()
                    }, 10000)
                }
                .start()
        }
        
        // Clear the notification
        smartRefreshManager.clearNewContentNotification()
    }
    
    /**
     * Hide the new content badge with animation.
     */
    private fun hideNewContentBadge() {
        binding.newContentBadge.animate()
            .translationX(50f)
            .alpha(0f)
            .setDuration(TvCinematicTokens.ENTER_EXIT_DURATION_MS)
            .withEndAction {
                binding.newContentBadge.visibility = View.GONE
            }
            .start()
    }
    
    private fun handleItemClick(item: ContentItem) {
        lifecycleScope.launch {
            val server = repository.getActiveServerSync()
            if (server != null && parentalLockManager.isContentBlocked(server.id, parentalContentType(item), parentalContentId(item))) {
                Toast.makeText(this@HomeActivity, R.string.parental_content_blocked, Toast.LENGTH_SHORT).show()
                return@launch
            }
            handleAllowedItemClick(item)
        }
    }

    private fun handleAllowedItemClick(item: ContentItem) {
        item.favoriteId?.let { favoriteId ->
            handleFavoriteHomeItem(favoriteId, item)
            return
        }

        when (item.type) {
            ContentType.MOVIE -> {
                if (!item.streamUrl.isNullOrEmpty()) {
                    val intent = Intent(this, PlayerActivity::class.java).apply {
                        putExtra(PlayerActivity.EXTRA_STREAM_URL, item.streamUrl)
                        putExtra(PlayerActivity.EXTRA_TITLE, item.title)
                        putExtra(PlayerActivity.EXTRA_TYPE, item.type.name)
                        putExtra(PlayerActivity.EXTRA_CONTENT_ID, item.id)
                        item.savedPosition?.let { putExtra(PlayerActivity.EXTRA_RESUME_POSITION, it) }
                    }
                    startActivity(intent)
                } else {
                    playMovieFromCatalog(item)
                }
            }
            ContentType.SERIES -> {
                // Navigate to series detail
                val intent = Intent(this, SeriesActivity::class.java).apply {
                    putExtra("series_id", item.id)
                }
                startActivity(intent)
            }
            ContentType.EPISODE -> {
                // Play episode directly
                if (!item.streamUrl.isNullOrEmpty()) {
                    val intent = Intent(this, PlayerActivity::class.java).apply {
                        putExtra(PlayerActivity.EXTRA_STREAM_URL, item.streamUrl)
                        putExtra(PlayerActivity.EXTRA_TITLE, item.title)
                        putExtra(PlayerActivity.EXTRA_TYPE, item.type.name)
                        putExtra(PlayerActivity.EXTRA_CONTENT_ID, item.id)
                        item.savedPosition?.let { putExtra(PlayerActivity.EXTRA_RESUME_POSITION, it) }
                        item.seriesId?.let { putExtra(PlayerActivity.EXTRA_SERIES_ID, it) }
                        item.seasonNumber?.let { putExtra(PlayerActivity.EXTRA_SEASON_NUMBER, it) }
                        item.episodeNumber?.let { putExtra(PlayerActivity.EXTRA_EPISODE_NUMBER, it) }
                    }
                    startActivity(intent)
                } else {
                    playEpisodeFromCatalog(item)
                }
            }
            ContentType.CHANNEL -> {
                // Better TV UX: open Live TV screen and focus the channel by ID.
                // Fallback to PlayerActivity if we don't have a channel ID.
                val channelId = item.id
                if (channelId.isNotBlank()) {
                    val intent = Intent(this, LiveTvActivity::class.java).apply {
                        putExtra(LiveTvActivity.EXTRA_CHANNEL_ID, channelId)
                    }
                    startActivity(intent)
                } else if (!item.streamUrl.isNullOrEmpty()) {
                    val intent = Intent(this, PlayerActivity::class.java).apply {
                        putExtra(PlayerActivity.EXTRA_STREAM_URL, item.streamUrl)
                        putExtra(PlayerActivity.EXTRA_TITLE, item.title)
                        putExtra(PlayerActivity.EXTRA_TYPE, item.type.name)
                    }
                    startActivity(intent)
                }
            }
        }
    }

    private fun parentalContentType(item: ContentItem): String = when (item.type) {
        ContentType.MOVIE -> "movie"
        ContentType.SERIES -> "series"
        ContentType.CHANNEL -> "channel"
        ContentType.EPISODE -> "series"
    }

    private fun parentalContentId(item: ContentItem): String =
        if (item.type == ContentType.EPISODE) item.seriesId ?: item.id else item.id

    private fun playMovieFromCatalog(item: ContentItem) {
        lifecycleScope.launch {
            val movie = repository.getMovieById(item.id)
            if (movie == null) {
                android.widget.Toast.makeText(
                    this@HomeActivity,
                    getString(R.string.error_stream_failed),
                    android.widget.Toast.LENGTH_SHORT
                ).show()
                return@launch
            }
            startActivity(Intent(this@HomeActivity, PlayerActivity::class.java).apply {
                putExtra(PlayerActivity.EXTRA_STREAM_URL, movie.streamUrl)
                putExtra(PlayerActivity.EXTRA_TITLE, movie.name)
                putExtra(PlayerActivity.EXTRA_TYPE, ContentType.MOVIE.name)
                putExtra(PlayerActivity.EXTRA_CONTENT_ID, movie.movieId)
                putExtra(PlayerActivity.EXTRA_POSTER_URL, movie.streamIcon)
                item.savedPosition?.let { putExtra(PlayerActivity.EXTRA_RESUME_POSITION, it) }
            })
        }
    }

    private fun playEpisodeFromCatalog(item: ContentItem) {
        lifecycleScope.launch {
            val episode = repository.getEpisodeById(item.id)
            if (episode == null) {
                android.widget.Toast.makeText(
                    this@HomeActivity,
                    getString(R.string.error_stream_failed),
                    android.widget.Toast.LENGTH_SHORT
                ).show()
                return@launch
            }
            startActivity(Intent(this@HomeActivity, PlayerActivity::class.java).apply {
                putExtra(PlayerActivity.EXTRA_STREAM_URL, episode.streamUrl)
                putExtra(PlayerActivity.EXTRA_TITLE, episode.title ?: item.title)
                putExtra(PlayerActivity.EXTRA_TYPE, ContentType.EPISODE.name)
                putExtra(PlayerActivity.EXTRA_CONTENT_ID, episode.episodeId)
                putExtra(PlayerActivity.EXTRA_POSTER_URL, episode.cover ?: item.posterUrl)
                putExtra(PlayerActivity.EXTRA_SERIES_ID, episode.seriesId)
                putExtra(PlayerActivity.EXTRA_SEASON_NUMBER, episode.seasonNumber)
                putExtra(PlayerActivity.EXTRA_EPISODE_NUMBER, episode.episodeNumber)
                item.savedPosition?.let { putExtra(PlayerActivity.EXTRA_RESUME_POSITION, it) }
            })
        }
    }

    private fun handleFavoriteHomeItem(favoriteId: Long, item: ContentItem) {
        if (item.type == ContentType.SERIES) {
            startActivity(
                Intent(this, com.mo.moplayer.ui.series.SeriesDetailActivity::class.java)
                    .putExtra(com.mo.moplayer.ui.series.SeriesDetailActivity.EXTRA_SERIES_ID, item.id)
            )
            return
        }

        lifecycleScope.launch {
            val playable = repository.resolvePlayableByFavorite(favoriteId)
            if (playable == null) {
                android.widget.Toast.makeText(
                    this@HomeActivity,
                    getString(R.string.error_stream_failed),
                    android.widget.Toast.LENGTH_SHORT
                ).show()
                return@launch
            }

            if (playable.type == UnifiedContentType.SERIES) {
                startActivity(
                    Intent(this@HomeActivity, com.mo.moplayer.ui.series.SeriesDetailActivity::class.java)
                        .putExtra(
                            com.mo.moplayer.ui.series.SeriesDetailActivity.EXTRA_SERIES_ID,
                            playable.contentId
                        )
                )
            } else {
                val intent = Intent(this@HomeActivity, PlayerActivity::class.java).apply {
                    putExtra(PlayerActivity.EXTRA_STREAM_URL, playable.streamUrl)
                    putExtra(PlayerActivity.EXTRA_TITLE, playable.title)
                    putExtra(PlayerActivity.EXTRA_TYPE, playable.type.name)
                    putExtra(PlayerActivity.EXTRA_CONTENT_ID, playable.contentId)
                    putExtra(PlayerActivity.EXTRA_POSTER_URL, playable.posterUrl)
                }
                startActivity(intent)
            }
        }
    }
    
    private fun handleItemFocused(item: ContentItem) {
        updateLastContentFocus(currentFocus)
        schedulePreviewBackdrop(item)
    }

    private fun schedulePreviewBackdrop(item: ContentItem) {
        pendingPreviewItem = item
        previewHandler.removeCallbacksAndMessages(null)
        previewHandler.postDelayed({
            if (pendingPreviewItem == item) {
                showPreviewBackdrop(item)
            }
        }, 180L)
    }

    private fun showContentContextMenu(item: ContentItem) {
        lifecycleScope.launch {
            val server = repository.getActiveServerSync() ?: return@launch
            
            when (item.type) {
                ContentType.MOVIE -> {
                    val movie = repository.getMovieById(item.id)
                    val isFavorite = repository.isFavorite(server.id, item.id).first()
                    val contentType = parentalContentType(item)
                    val contentId = parentalContentId(item)
                    val isBlocked = parentalLockManager.isContentBlocked(server.id, contentType, contentId)
                    ContentMenuHelper(this@HomeActivity).showContentMenu(
                        title = item.title,
                        thumbnailUrl = item.posterUrl,
                        isFavorite = isFavorite,
                        details = movie?.let { ContentMenuDetails(
                            description = it.plot,
                            duration = it.duration ?: ContentMenuDetails.formatDuration(it.durationSeconds),
                            rating = it.rating,
                            year = it.year ?: it.releaseDate,
                            genre = it.genre
                        ) },
                        onPlay = { handleItemClick(item) },
                        onToggleFavorite = {
                            lifecycleScope.launch {
                                repository.toggleFavorite(
                                    serverId = server.id,
                                    contentId = item.id,
                                    contentType = "movie",
                                    name = item.title,
                                    iconUrl = item.posterUrl
                                )
                            }
                        },
                        onInfo = {
                            val intent = Intent(this@HomeActivity, com.mo.moplayer.ui.movies.MovieDetailActivity::class.java)
                            intent.putExtra(com.mo.moplayer.ui.movies.MovieDetailActivity.EXTRA_MOVIE_ID, item.id)
                            startActivity(intent)
                        },
                        isBlocked = isBlocked,
                        onToggleBlocked = {
                            toggleParentalBlock(server.id, contentType, contentId, item.title, isBlocked)
                        }
                    )
                }
                ContentType.SERIES -> {
                    val series = repository.getSeriesById(item.id)
                    val isFavorite = repository.isFavorite(server.id, item.id).first()
                    val contentType = parentalContentType(item)
                    val contentId = parentalContentId(item)
                    val isBlocked = parentalLockManager.isContentBlocked(server.id, contentType, contentId)
                    ContentMenuHelper(this@HomeActivity).showContentMenu(
                        title = item.title,
                        thumbnailUrl = item.posterUrl,
                        isFavorite = isFavorite,
                        details = series?.let { ContentMenuDetails(
                            description = it.plot,
                            rating = it.rating,
                            year = it.releaseDate,
                            genre = it.genre
                        ) },
                        onPlay = { handleItemClick(item) },
                        onToggleFavorite = {
                            lifecycleScope.launch {
                                repository.toggleFavorite(
                                    serverId = server.id,
                                    contentId = item.id,
                                    contentType = "series",
                                    name = item.title,
                                    iconUrl = item.posterUrl
                                )
                            }
                        },
                        onInfo = { handleItemClick(item) },
                        isBlocked = isBlocked,
                        onToggleBlocked = {
                            toggleParentalBlock(server.id, contentType, contentId, item.title, isBlocked)
                        }
                    )
                }
                ContentType.CHANNEL -> {
                    val isFavorite = repository.isFavorite(server.id, item.id).first()
                    val contentType = parentalContentType(item)
                    val contentId = parentalContentId(item)
                    val isBlocked = parentalLockManager.isContentBlocked(server.id, contentType, contentId)
                    ContentMenuHelper(this@HomeActivity).showContentMenu(
                        title = item.title,
                        thumbnailUrl = item.posterUrl,
                        isFavorite = isFavorite,
                        onPlay = { handleItemClick(item) },
                        onToggleFavorite = {
                            lifecycleScope.launch {
                                repository.toggleFavorite(
                                    serverId = server.id,
                                    contentId = item.id,
                                    contentType = "channel",
                                    name = item.title,
                                    iconUrl = item.posterUrl
                                )
                            }
                        },
                        onInfo = { handleItemClick(item) },
                        isBlocked = isBlocked,
                        onToggleBlocked = {
                            toggleParentalBlock(server.id, contentType, contentId, item.title, isBlocked)
                        }
                    )
                }
                ContentType.EPISODE -> {
                    val seriesId = item.seriesId ?: item.id
                    val series = repository.getSeriesById(seriesId)
                    val isFavorite = repository.isFavorite(server.id, seriesId).first()
                    val contentType = parentalContentType(item)
                    val contentId = parentalContentId(item)
                    val isBlocked = parentalLockManager.isContentBlocked(server.id, contentType, contentId)
                    ContentMenuHelper(this@HomeActivity).showContentMenu(
                        title = item.title,
                        thumbnailUrl = item.posterUrl,
                        isFavorite = isFavorite,
                        details = series?.let { ContentMenuDetails(description = it.plot, genre = it.genre) },
                        onPlay = { handleItemClick(item) },
                        onToggleFavorite = {
                            lifecycleScope.launch {
                                repository.toggleFavorite(
                                    serverId = server.id,
                                    contentId = seriesId,
                                    contentType = "series",
                                    name = item.title,
                                    iconUrl = item.posterUrl
                                )
                            }
                        },
                        onInfo = { handleItemClick(item) },
                        isBlocked = isBlocked,
                        onToggleBlocked = {
                            toggleParentalBlock(server.id, contentType, contentId, item.title, isBlocked)
                        }
                    )
                }
            }
        }
    }

    private fun toggleParentalBlock(
        serverId: Long,
        contentType: String,
        contentId: String,
        title: String,
        currentlyBlocked: Boolean
    ) {
        lifecycleScope.launch {
            parentalLockManager.setContentBlocked(serverId, contentType, contentId, !currentlyBlocked)
            val message = if (currentlyBlocked) {
                getString(R.string.parental_content_unblocked_toast, title)
            } else {
                getString(R.string.parental_content_blocked_toast, title)
            }
            Toast.makeText(this@HomeActivity, message, Toast.LENGTH_SHORT).show()
        }
    }
    
    private var currentBackdropUrl: String? = null
    
    private fun showPreviewBackdrop(item: ContentItem) {
        if (backgroundBehavior == com.mo.moplayer.util.TvUiPreferences.BackgroundBehavior.STATIC) {
            return
        }
        val backdropUrl = item.posterUrl
        if (backdropUrl.isNullOrEmpty() || backdropUrl == currentBackdropUrl) return
        
        currentBackdropUrl = backdropUrl
        
        if (!homeCityWallpaperSelected) {
            binding.animatedBackground.animate()
                .alpha(0.15f)
                .setDuration(400)
                .start()
        }

        // Fade weather overlay to avoid obscuring poster preview
        binding.weatherOverlay.animate()
            .alpha(0.15f)
            .setDuration(400)
            .start()
        
        // Load and fade in backdrop
        if (com.mo.moplayer.util.GlideHelper.isValidContextForGlide(this)) {
            com.bumptech.glide.Glide.with(this)
                .load(backdropUrl)
                // Decode at backdrop display size, not full poster resolution — big memory win
                // on weak TV boxes for an image shown at 0.54 alpha as ambient background.
                .override(960, 540)
                .diskCacheStrategy(com.bumptech.glide.load.engine.DiskCacheStrategy.ALL)
                .transition(com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions.withCrossFade(500))
                .into(binding.ivPreviewBackdrop)
        }
        
        binding.ivPreviewBackdrop.animate()
            .alpha(0.54f)
            .setDuration(500)
            .start()
        
        binding.previewGradient.animate()
            .alpha(1f)
            .setDuration(500)
            .start()
        
        // Show preview info panel
        binding.previewInfoPanel.visibility = View.VISIBLE
        binding.previewInfoPanel.animate()
            .alpha(1f)
            .translationY(0f)
            .setDuration(300)
            .start()
        
        // Update preview info
        binding.tvPreviewTitle.text = item.title
        val hasRating = (item.rating ?: 0.0) > 0.0
        binding.previewRatingContainer.isVisible = hasRating
        if (hasRating) {
            binding.tvPreviewRating.text = String.format("%.1f", item.rating ?: 0.0)
        }
        binding.tvPreviewDescription.isVisible = false
        binding.tvPreviewType.text = when (item.type) {
            ContentType.MOVIE -> getString(R.string.nav_movies)
            ContentType.SERIES -> getString(R.string.nav_series)
            ContentType.CHANNEL -> getString(R.string.nav_live)
            ContentType.EPISODE -> getString(R.string.series_episodes)
        }
    }
    
    private fun hidePreviewBackdrop() {
        previewHandler.removeCallbacksAndMessages(null)
        pendingPreviewItem = null
        currentBackdropUrl = null
        
        if (!homeCityWallpaperSelected) {
            binding.animatedBackground.animate()
                .alpha(1f)
                .setDuration(400)
                .start()
        } else {
            binding.animatedBackground.alpha = 0f
        }

        binding.weatherOverlay.animate()
            .alpha(1f)
            .setDuration(400)
            .start()
        
        binding.ivPreviewBackdrop.animate()
            .alpha(0f)
            .setDuration(400)
            .start()
        
        binding.previewGradient.animate()
            .alpha(0f)
            .setDuration(400)
            .start()
        
        binding.previewInfoPanel.animate()
            .alpha(0f)
            .translationY(20f)
            .setDuration(200)
            .withEndAction { binding.previewInfoPanel.visibility = View.GONE }
            .start()
    }
    
    override fun handleTvKeyEvent(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_MENU -> {
                startActivity(Intent(this, SettingsActivity::class.java))
                return true
            }
            KeyEvent.KEYCODE_SEARCH -> {
                startActivity(Intent(this, SearchActivity::class.java))
                return true
            }
            KeyEvent.KEYCODE_BACK -> {
                return handleBackPress()
            }
            KeyEvent.KEYCODE_DPAD_UP -> {
                return handleUpKey()
            }
            KeyEvent.KEYCODE_DPAD_DOWN -> {
                return handleDownKey()
            }
        }
        return false
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN &&
            (event.keyCode == KeyEvent.KEYCODE_DPAD_UP ||
                event.keyCode == KeyEvent.KEYCODE_DPAD_DOWN ||
                event.keyCode == KeyEvent.KEYCODE_DPAD_LEFT ||
                event.keyCode == KeyEvent.KEYCODE_DPAD_RIGHT)
        ) {
            if (handleTvKeyEvent(event.keyCode, event)) {
                return true
            }
        }
        return super.dispatchKeyEvent(event)
    }
    
    private fun handleUpKey(): Boolean {
        val currentFocusView = currentFocus

        if (currentFocusView == null) {
            return binding.btnSearch.requestFocus() || requestPrimaryContentFocus() || binding.dockHome.requestFocus()
        }

        if (isViewInParent(currentFocusView, binding.rvContent)) {
            if (requestAdjacentRowFocus(View.FOCUS_UP)) {
                Log.d("HomeFocusPerf", "focusRoute=content_to_previous_row")
                return true
            }
            if (binding.newContentBadge.visibility == View.VISIBLE && binding.newContentBadge.requestFocus()) {
                Log.d("HomeFocusPerf", "focusRoute=content_to_notifications")
                return true
            }
            Log.d("HomeFocusPerf", "focusRoute=content_to_actions")
            return binding.btnSearch.requestFocus()
        }

        if (currentFocusView == binding.newContentBadge) {
            Log.d("HomeFocusPerf", "focusRoute=notifications_to_actions")
            return binding.btnSearch.requestFocus()
        }

        if (isViewInParent(currentFocusView, binding.topSignalBar)) {
            Log.d("HomeFocusPerf", "focusRoute=widgets_to_topbar")
            return binding.btnSearch.requestFocus()
        }

        if (dockItems.any { it == currentFocusView }) {
            Log.d("HomeFocusPerf", "focusRoute=dock_to_content_or_actions")
            return requestPrimaryContentFocus() || binding.btnSearch.requestFocus()
        }

        return false
    }
    
    private fun handleDownKey(): Boolean {
        val currentFocusView = currentFocus

        if (currentFocusView == null) {
            ensureHomeFocus()
            return true
        }

        val inDock = dockItems.any { it == currentFocusView }
        if (inDock) {
            Log.d("HomeFocusPerf", "focusRoute=dock_down_blocked")
            return true
        }

        if (isViewInParent(currentFocusView, binding.topBar)) {
            Log.d("HomeFocusPerf", "focusRoute=topbar_to_notifications")
            if (binding.newContentBadge.visibility == View.VISIBLE && binding.newContentBadge.requestFocus()) {
                return true
            }
            return requestPrimaryContentFocus() || binding.dockHome.requestFocus()
        }

        if (isViewInParent(currentFocusView, binding.topSignalBar)) {
            Log.d("HomeFocusPerf", "focusRoute=widgets_to_topbar")
            return binding.btnSearch.requestFocus()
        }

        if (currentFocusView == binding.newContentBadge) {
            Log.d("HomeFocusPerf", "focusRoute=notification_to_content")
            return requestPrimaryContentFocus() || binding.dockHome.requestFocus()
        }

        if (isViewInParent(currentFocusView, binding.rvContent)) {
            if (requestAdjacentRowFocus(View.FOCUS_DOWN)) {
                Log.d("HomeFocusPerf", "focusRoute=content_to_next_row")
                return true
            }
            Log.d("HomeFocusPerf", "focusRoute=content_to_dock")
            return binding.dockHome.requestFocus()
        }

        return false
    }
    
    private fun isViewInParent(view: View?, parent: View): Boolean {
        if (view == null) return false
        var p = view.parent
        while (p != null) {
            if (p == parent) return true
            p = p.parent
        }
        return false
    }
    
    private fun handleBackPress(): Boolean {
        if (binding.weatherDetailsOverlay.isVisible) {
            binding.weatherDetailsOverlay.hide()
            return true
        }
        if (binding.matchDetailsOverlay.isVisible) {
            binding.matchDetailsOverlay.hide()
            return true
        }
        if (maybeHandleExitOnBack()) return true
        finish()
        return true
    }
    
    override fun onResume() {
        super.onResume()
        setupFocusMap()
        if (chromeInitialized) {
            startClockLoop()
            startWeatherRefreshLoop()
            binding.footballWidget.onActivityResumed()
        } else {
            scheduleDeferredStartup()
        }
        if (visualFxStarted) {
            binding.animatedBackground.resumeAnimation()
            binding.weatherOverlay.startAnimation()
        }
        updateDockSelection(0)
        observeNewContent()

        binding.root.post {
            ensureHomeFocus()
        }
    }
    
    override fun onPause() {
        super.onPause()
        startupHandler.removeCallbacksAndMessages(null)
        previewHandler.removeCallbacksAndMessages(null)
        clockHandler.removeCallbacks(clockRunnable)
        weatherUpdateHandler.removeCallbacks(weatherUpdateRunnable)
        binding.animatedBackground.pauseAnimation()
        binding.weatherOverlay.pauseAnimation()
        if (chromeInitialized) {
            binding.footballWidget.onActivityPaused()
        }
        if (silentRefreshStarted) {
            smartRefreshManager.stopForegroundRefresh()
            silentRefreshStarted = false
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        startupHandler.removeCallbacksAndMessages(null)
        previewHandler.removeCallbacksAndMessages(null)
        newContentObserverJob?.cancel()
        newContentObserverJob = null
        weatherDetailsJob?.cancel()
        weatherDetailsJob = null
        clockHandler.removeCallbacks(clockRunnable)
        weatherUpdateHandler.removeCallbacks(weatherUpdateRunnable)
        subscriptionExpiredDialog?.dismiss()
        subscriptionExpiredDialog = null
    }

    enum class DockItem {
        HOME, LIVE, MOVIES, SERIES, FAVORITES, SEARCH, SETTINGS
    }
}
