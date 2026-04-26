package com.mo.moplayer.ui.home

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
import com.mo.moplayer.util.SmartRefreshManager
import com.mo.moplayer.util.ThemeManager
import com.mo.moplayer.ui.widgets.weather.FullScreenWeatherOverlay
import com.mo.moplayer.ui.common.design.TvCinematicTokens
import com.mo.moplayer.ui.common.background.BackgroundVisualMode
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.widget.ImageView
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import androidx.lifecycle.lifecycleScope
import java.util.*
import javax.inject.Inject
import kotlinx.coroutines.Job

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
    lateinit var appRemoteConfigService: AppRemoteConfigService
    
    private lateinit var contentAdapter: ContentRowAdapter
    private val clockHandler = Handler(Looper.getMainLooper())
    private var colonVisible = true
    private val weatherUpdateHandler = Handler(Looper.getMainLooper())
    private val weatherUpdateInterval = 30 * 60 * 1000L // 30 minutes
    private val startupHandler = Handler(Looper.getMainLooper())
    private val previewHandler = Handler(Looper.getMainLooper())
    private var weatherDetailsJob: Job? = null
    private var newContentObserverJob: Job? = null
    private var initialContentFocusApplied = false
    private var lastFocusedContentRowIndex = 0
    private var lastFocusedContentCenterX = -1
    private var chromeInitialized = false
    private var visualFxStarted = false
    private var deferHeavyVisuals = true
    private var pendingPreviewItem: ContentItem? = null
    private var silentRefreshStarted = false
    private var appRemoteConfig = AppRemoteConfig()
    
    private var currentDockIndex = 0
    private val dockItems by lazy {
        listOf(
            binding.dockHome,
            binding.dockLive,
            binding.dockMovies,
            binding.dockSeries,
            binding.dockFavorites,
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

    override fun getBackgroundVisualMode(): BackgroundVisualMode =
        if (deferHeavyVisuals) BackgroundVisualMode.REDUCED_MOTION else BackgroundVisualMode.WEATHER_REACTIVE
    
    override fun applyThemeToViews(color: Int) {
        super.applyThemeToViews(color)
        // Update dock selected icon color
        updateDockColors(color)
        // Update adapter colors for focused items
        if (::contentAdapter.isInitialized) {
            contentAdapter.updateThemeColor(color)
        }
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
        binding.widgetStrip.alpha = 0f
        binding.weatherWidget.visibility = View.INVISIBLE
        binding.footballWidget.visibility = View.INVISIBLE
        binding.flipClockContainer.visibility = View.INVISIBLE
        binding.weatherOverlay.visibility = View.INVISIBLE
        binding.animatedBackground.setAnimationEnabled(false)
        binding.weatherOverlay.pauseAnimation()
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
        }
    }

    private fun initializeHomeChromeIfNeeded() {
        if (chromeInitialized) return
        chromeInitialized = true

        setupClock()
        setupWeather()
        setupFootballWidget()

        val visibleChrome = listOfNotNull(
            binding.weatherWidget.takeIf { appRemoteConfig.weatherEnabled },
            binding.footballWidget.takeIf { appRemoteConfig.footballEnabled },
            binding.flipClockContainer
        )
        visibleChrome.forEach { view ->
            view.visibility = View.VISIBLE
            view.alpha = 0f
            view.translationY = -8f
            view.animate()
                .alpha(1f)
                .translationY(0f)
                .setDuration(260L)
                .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                .start()
        }

        binding.widgetStrip.animate()
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
        parseRemoteAccentColor(appRemoteConfig.accentColor)?.let { accentColor ->
            lifecycleScope.launch {
                themeManager.overrideRuntimeAccentColor(accentColor)
                applyThemeToViews(accentColor)
            }
        }
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
        }
        binding.root.post { setupFocusMap() }
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
        deferHeavyVisuals = false

        binding.weatherOverlay.visibility = View.VISIBLE
        binding.animatedBackground.setAnimationEnabled(true)
        binding.animatedBackground.resumeAnimation()
        binding.weatherOverlay.startAnimation()
        applyThemeToViews(themeManager.currentAccentColor.value)
    }

    private fun startSilentRefreshIfNeeded() {
        if (silentRefreshStarted) return
        silentRefreshStarted = true
        smartRefreshManager.startForegroundRefresh(lifecycleScope)
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
        binding.matchDetailsOverlay.show(match)
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
                binding.weatherWidget.visibility = if (weatherVisible) View.VISIBLE else View.GONE
                if (weatherWidgetWasVisible != weatherVisible) {
                    weatherWidgetWasVisible = weatherVisible
                    binding.root.post { setupFocusMap() }
                }
                binding.weatherOverlay.visibility = when {
                    !weatherVisible -> View.GONE
                    quality == WeatherService.EFFECT_QUALITY_OFF -> View.GONE
                    else -> View.VISIBLE
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
        binding.dockSettings.setOnClickListener { navigateTo(DockItem.SETTINGS) }
        
        // Focus change listeners with animations
        dockItems.forEachIndexed { index, view ->
            view.setOnFocusChangeListener { v, hasFocus ->
                animateDockItem(v, hasFocus)
                if (hasFocus) {
                    currentDockIndex = index
                }
            }
        }
    }

    private fun focusableHomeWidgets(): List<View> =
        listOf(binding.weatherWidget, binding.footballWidget, binding.flipClockContainer)
            .filter { it.visibility == View.VISIBLE && it.isFocusable && it.id != View.NO_ID }

    private fun firstFocusableHomeWidget(): View? = focusableHomeWidgets().firstOrNull()

    private fun setupFocusMap() {
        val topStrip = listOf(
            binding.btnSurprise,
            binding.btnSearch
        ).filter { it.visibility == View.VISIBLE && it.id != View.NO_ID }

        val widgetStripViews = focusableHomeWidgets()

        val topBarDownTarget = widgetStripViews.firstOrNull() ?: binding.rvContent
        FocusMapRegistry.mapHorizontalStrip(
            views = topStrip,
            wrap = false,
            downTarget = topBarDownTarget
        )

        FocusMapRegistry.mapHorizontalStrip(
            views = widgetStripViews,
            wrap = false,
            downTarget = binding.rvContent
        )

        FocusMapRegistry.mapHorizontalStrip(
            views = dockItems,
            wrap = true,
            upTarget = binding.rvContent
        )

        binding.rvContent.nextFocusUpId =
            widgetStripViews.firstOrNull()?.id ?: binding.btnSearch.id
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
                isViewInParent(focused, binding.widgetStrip)

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
            binding.iconSettings
        )
        
        val labels = listOf(
            binding.labelHome,
            binding.labelLive,
            binding.labelMovies,
            binding.labelSeries,
            binding.labelFavorites,
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
            if (!rows.isNullOrEmpty() && !initialContentFocusApplied) {
                scheduleInitialContentFocus()
            }
        }
        
        viewModel.isLoading.observe(this) { isLoading ->
            // Could show loading indicator
        }
        
        lifecycleScope.launch {
            viewModel.surpriseEvent.collect { item ->
                // Show a simple toast or effect for now, then open
                android.widget.Toast.makeText(this@HomeActivity, "Surprise! ${item.title}", android.widget.Toast.LENGTH_SHORT).show()
                handleItemClick(item)
            }
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
        when (item.type) {
            ContentType.MOVIE -> {
                if (!item.streamUrl.isNullOrEmpty()) {
                    val intent = Intent(this, PlayerActivity::class.java).apply {
                        putExtra(PlayerActivity.EXTRA_STREAM_URL, item.streamUrl)
                        putExtra(PlayerActivity.EXTRA_TITLE, item.title)
                        putExtra(PlayerActivity.EXTRA_TYPE, item.type.name)
                    }
                    startActivity(intent)
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
                    }
                    startActivity(intent)
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
                        }
                    )
                }
                ContentType.SERIES -> {
                    val series = repository.getSeriesById(item.id)
                    val isFavorite = repository.isFavorite(server.id, item.id).first()
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
                        onInfo = { handleItemClick(item) }
                    )
                }
                ContentType.CHANNEL -> {
                    val isFavorite = repository.isFavorite(server.id, item.id).first()
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
                        onInfo = { handleItemClick(item) }
                    )
                }
                ContentType.EPISODE -> {
                    val seriesId = item.seriesId ?: item.id
                    val series = repository.getSeriesById(seriesId)
                    val isFavorite = repository.isFavorite(server.id, seriesId).first()
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
                        onInfo = { handleItemClick(item) }
                    )
                }
            }
        }
    }
    
    private var currentBackdropUrl: String? = null
    
    private fun showPreviewBackdrop(item: ContentItem) {
        val backdropUrl = item.posterUrl
        if (backdropUrl.isNullOrEmpty() || backdropUrl == currentBackdropUrl) return
        
        currentBackdropUrl = backdropUrl
        
        // Fade out animated background
        binding.animatedBackground.animate()
            .alpha(0.15f)
            .setDuration(400)
            .start()

        // Fade weather overlay to avoid obscuring poster preview
        binding.weatherOverlay.animate()
            .alpha(0.15f)
            .setDuration(400)
            .start()
        
        // Load and fade in backdrop
        if (com.mo.moplayer.util.GlideHelper.isValidContextForGlide(this)) {
            com.bumptech.glide.Glide.with(this)
                .load(backdropUrl)
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
        
        binding.animatedBackground.animate()
            .alpha(1f)
            .setDuration(400)
            .start()

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
    
    private fun handleUpKey(): Boolean {
        val currentFocusView = currentFocus

        if (currentFocusView == null) {
            ensureHomeFocus()
            return true
        }

        if (isViewInParent(currentFocusView, binding.rvContent)) {
            if (requestAdjacentRowFocus(View.FOCUS_UP)) {
                Log.d("HomeFocusPerf", "focusRoute=content_to_previous_row")
                return true
            }
            Log.d("HomeFocusPerf", "focusRoute=content_to_widgets")
            firstFocusableHomeWidget()?.let {
                if (it.requestFocus()) return true
            }
            return binding.btnSearch.requestFocus()
        }

        if (isViewInParent(currentFocusView, binding.widgetStrip)) {
            Log.d("HomeFocusPerf", "focusRoute=widgets_to_topbar")
            return binding.btnSearch.requestFocus()
        }

        if (dockItems.any { it == currentFocusView }) {
            Log.d("HomeFocusPerf", "focusRoute=dock_to_content")
            return requestPrimaryContentFocus()
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
            Log.d("HomeFocusPerf", "focusRoute=topbar_to_widgets")
            firstFocusableHomeWidget()?.let {
                if (it.requestFocus()) return true
            }
            return requestPrimaryContentFocus()
        }

        if (isViewInParent(currentFocusView, binding.widgetStrip)) {
            Log.d("HomeFocusPerf", "focusRoute=widgets_to_content")
            return requestPrimaryContentFocus()
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
    }

    enum class DockItem {
        HOME, LIVE, MOVIES, SERIES, FAVORITES, SETTINGS
    }
}
