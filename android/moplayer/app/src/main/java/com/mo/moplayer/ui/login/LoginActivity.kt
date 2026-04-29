package com.mo.moplayer.ui.login

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.app.UiModeManager
import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.text.Editable
import android.text.TextWatcher
import android.text.method.PasswordTransformationMethod
import android.view.KeyEvent
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.AnimationUtils
import android.view.inputmethod.EditorInfo
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.isVisible
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.mo.moplayer.R
import com.mo.moplayer.BuildConfig
import com.mo.moplayer.data.config.AppRemoteConfig
import com.mo.moplayer.data.config.AppRemoteConfigService
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.data.weather.WeatherService
import com.mo.moplayer.databinding.ActivityLoginBinding
import com.mo.moplayer.ui.activation.DeviceActivationActivity
import com.mo.moplayer.ui.common.background.BackgroundVisualMode
import com.mo.moplayer.ui.common.background.CinematicBackgroundController
import com.mo.moplayer.ui.widgets.weather.FullScreenWeatherOverlay
import com.mo.moplayer.ui.home.HomeActivity
import com.mo.moplayer.ui.common.ExitHelper
import com.mo.moplayer.ui.common.design.TvCinematicTokens
import com.mo.moplayer.util.BackgroundManager
import com.mo.moplayer.util.CrashGuard
import com.mo.moplayer.util.ThemeManager
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.SecureRandom
import javax.inject.Inject
import kotlin.math.sin

@AndroidEntryPoint
class LoginActivity : AppCompatActivity() {
    
    companion object {
        private const val REQUEST_CODE_M3U_PICKER = 2001
        const val EXTRA_ACTIVATION_COMPLETED = "com.mo.moplayer.extra.ACTIVATION_COMPLETED"
    }

    private lateinit var binding: ActivityLoginBinding
    private val viewModel: LoginViewModel by viewModels()

    private var isPasswordVisible = false
    private val passwordRevealHandler = Handler(Looper.getMainLooper())
    private var lastTypedChar: Char? = null
    
    // Animation Sets
    private var logoAnimatorSet: AnimatorSet? = null
    private var loadingAnimatorSet: AnimatorSet? = null

    private val exitHelper: ExitHelper by lazy { ExitHelper(this) }

    @Inject
    lateinit var backgroundManager: BackgroundManager

    @Inject
    lateinit var themeManager: ThemeManager

    @Inject
    lateinit var weatherService: com.mo.moplayer.data.weather.WeatherService

    @Inject
    lateinit var repository: IptvRepository

    @Inject
    lateinit var appRemoteConfigService: AppRemoteConfigService
    
    // M3U File Picker - Using OpenDocument for better file access
    private val m3uFilePicker = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        uri?.let { 
            // Take persistable URI permission for long-term access
            try {
                contentResolver.takePersistableUriPermission(
                    it,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
                handleM3uFile(it)
            } catch (e: Exception) {
                e.printStackTrace()
                Toast.makeText(this, getString(R.string.login_failed_access_file, e.message ?: ""), Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    // Fallback picker using GetContent (works on more devices)
    private val m3uFilePickerFallback = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let { handleM3uFile(it) }
    }
    
    // Marketing Text for Loading
    private val marketingMessages = arrayOf(
        R.string.marketing_connecting,
        R.string.marketing_4k,
        R.string.marketing_thousands,
        R.string.marketing_professional,
        R.string.marketing_passion,
        R.string.marketing_unlimited,
        R.string.marketing_premium,
        R.string.marketing_smart
    )
    private var currentMarketingIndex = 0
    private val marketingHandler = Handler(Looper.getMainLooper())
    private var animationTime = 0f
    @Volatile
    private var startupResolved = false
    private var remoteWeatherEnabled = true
    private val websiteSourceHandler = Handler(Looper.getMainLooper())
    private var websiteSourcePollAttempts = 0
    private var pendingWebsiteSourceId: String? = null
    private val websiteSourceRunnable = object : Runnable {
        override fun run() {
            checkWebsiteDeliveredSource(scheduleNext = true)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)
        splashScreen.setKeepOnScreenCondition { !startupResolved }
        window.setBackgroundDrawableResource(R.color.cinematic_bg_base)

        lifecycleScope.launch {
            val safeMode = CrashGuard.shouldUseSafeMode(this@LoginActivity)
            val hasSavedSession = withContext(Dispatchers.IO) {
                repository.getActiveServerSync() != null
            }

            if (hasSavedSession && !safeMode) {
                startupResolved = true
                navigateToHome()
                return@launch
            }

            binding = ActivityLoginBinding.inflate(layoutInflater)
            setContentView(binding.root)

            setupHtcBackground()
            setupUI()
            setupBackNavigation()
            setupTabs()
            setupFormNavigation()
            setupPasswordToggle()
            applyRemoteConfig()
            applySavedActivationState()
            observeViewModel()
            startEntranceAnimations()
            handleActivationCompletedIntent(intent)
            startWebsiteSourcePollingIfActivated()
            showCrashSafeModeIfNeeded(safeMode)
            binding.root.postDelayed({
                CrashGuard.markStable(this@LoginActivity)
            }, 8_000L)
            startupResolved = true
        }
    }

    private fun showCrashSafeModeIfNeeded(enabled: Boolean) {
        if (!enabled) return
        val summary = CrashGuard.lastCrashSummary(this) ?: getString(R.string.crash_guard_unknown)
        binding.tvErrorClean.text = getString(R.string.crash_guard_safe_mode_message, summary)
        binding.tvErrorClean.isVisible = true
        binding.tvErrorClean.requestFocus()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (::binding.isInitialized) {
            applySavedActivationState()
            handleActivationCompletedIntent(intent)
        }
    }

    private fun applyRemoteConfig() {
        applyRemoteConfigState(appRemoteConfigService.cachedConfig())
        lifecycleScope.launch {
            val config = appRemoteConfigService.fetchConfig()
            applyRemoteConfigState(config)
        }
    }

    private fun applyRemoteConfigState(config: AppRemoteConfig) {
        remoteWeatherEnabled = config.weatherEnabled
        binding.weatherWidget.visibility = if (remoteWeatherEnabled) View.VISIBLE else View.GONE
        parseRemoteAccentColor(config.accentColor)?.let { accentColor ->
            binding.htcAnimatedBackground.setParticleColor(accentColor)
            lifecycleScope.launch {
                themeManager.overrideRuntimeAccentColor(accentColor)
            }
        }

        val blockedMessage = when {
            !config.enabled -> config.message.ifBlank { "MoPlayer is temporarily unavailable. Please try again later." }
            config.maintenanceMode -> config.message.ifBlank { "MoPlayer is in maintenance mode. Please check back soon." }
            config.forceUpdate && BuildConfig.VERSION_CODE < config.minimumVersionCode ->
                config.message.ifBlank { "A newer MoPlayer version is required. Download the latest APK from moalfarras.space." }
            else -> null
        }

        val setupEnabled = blockedMessage == null
        binding.btnConnectClean.isEnabled = setupEnabled
        binding.btnImportM3uClean.isEnabled = setupEnabled
        binding.btnImportM3uLocalClean.isEnabled = setupEnabled
        binding.btnOpenActivationClean.isEnabled = setupEnabled
        binding.activationEntryCard.isEnabled = setupEnabled

        if (!setupEnabled) {
            binding.tvErrorClean.text = blockedMessage
            binding.tvErrorClean.isVisible = true
            binding.tvErrorClean.requestFocus()
        } else if (config.message.isNotBlank()) {
            binding.tvErrorClean.text = config.message
            binding.tvErrorClean.isVisible = true
        }
    }

    private fun parseRemoteAccentColor(value: String): Int? {
        return runCatching {
            val trimmed = value.trim()
            if (trimmed.matches(Regex("^#[0-9A-Fa-f]{6}$"))) Color.parseColor(trimmed) else null
        }.getOrNull()
    }

    private fun setupHtcBackground() {
        // Set default particle color for animated background (will be overridden by persisted theme if set)
        binding.htcAnimatedBackground.setParticleColor(Color.WHITE)
        binding.htcAnimatedBackground.setTvOptimizationMode(isTvDevice())
        binding.htcAnimatedBackground.setCinematicMode(false)
        binding.htcAnimatedBackground.setAnimationEnabled(false)
        binding.weatherOverlay.visibility = View.GONE
        CinematicBackgroundController.applyBackgroundProfile(
            mode = BackgroundVisualMode.REDUCED_MOTION,
            background = binding.htcAnimatedBackground,
            weatherOverlay = binding.weatherOverlay,
            wallpaperView = binding.ivLoginCityWallpaper,
            wallpaperScrim = binding.viewLoginWallpaperScrim
        )

        // Respect persisted background settings (theme, custom image, and animation on/off)
        binding.htcAnimatedBackground.post {
            lifecycleScope.launch {
                val currentTheme = backgroundManager.currentTheme.first()
                val particleColor = backgroundManager.particleColor.first()
                val animationEnabled = false
                val customImagePath = if (backgroundManager.hasCustomImage()) {
                    backgroundManager.getCustomImageFile().absolutePath
                } else null

                binding.htcAnimatedBackground.initializeFromSettings(
                    customImagePath = customImagePath,
                    currentTheme = currentTheme,
                    particleColor = particleColor
                )
                binding.htcAnimatedBackground.setAnimationEnabled(animationEnabled)
                CinematicBackgroundController.bindWeatherOverlay(
                    mode = BackgroundVisualMode.CITY_WALLPAPER_LOGIN,
                    weatherOverlay = binding.weatherOverlay,
                    accentColor = particleColor
                )
                observeLoginWallpaper()
            }
        }
        
        
        // Initialize Weather Widget
        binding.weatherWidget.initialize(weatherService)
        binding.weatherWidget.isFocusable = false
        binding.weatherWidget.isFocusableInTouchMode = false
        binding.weatherWidget.isClickable = false
        
        // Setup Full Screen Weather Effects
        setupWeatherOverlay()
    }

    private fun observeLoginWallpaper() {
        lifecycleScope.launch {
            backgroundManager.cityWallpaperState.collect { state ->
                val imagePath = state?.imagePath
                val shouldShowWallpaper =
                    !imagePath.isNullOrBlank() && !state.isFallback && backgroundManager.autoCityWallpaperEnabled.first()

                if (shouldShowWallpaper) {
                    binding.ivLoginCityWallpaper.visibility = View.VISIBLE
                    binding.viewLoginWallpaperScrim.visibility = View.VISIBLE
                    Glide.with(this@LoginActivity)
                        .load(java.io.File(imagePath))
                        .centerCrop()
                        .into(binding.ivLoginCityWallpaper)
                } else {
                    binding.ivLoginCityWallpaper.setImageDrawable(null)
                    binding.ivLoginCityWallpaper.visibility = View.GONE
                    binding.viewLoginWallpaperScrim.visibility = View.GONE
                }
            }
        }

        lifecycleScope.launch {
            backgroundManager.refreshCityWallpaper(force = false)
        }
    }
    
    private fun setupWeatherOverlay() {
        lifecycleScope.launch {
            kotlinx.coroutines.flow.combine(
                weatherService.weatherEnabled,
                weatherService.weatherEffectsQuality,
                weatherService.weatherReduceMotion,
                weatherService.weatherDisableLightning,
                weatherService.cachedWeather
            ) { enabled, quality, reduceMotion, disableLightning, weatherData ->
                WeatherOverlayState(enabled, quality, reduceMotion, disableLightning, weatherData)
            }.collect { (enabled, quality, reduceMotion, disableLightning, weatherData) ->
                val weatherVisible = enabled && remoteWeatherEnabled
                binding.weatherWidget.visibility = if (weatherVisible) android.view.View.VISIBLE else android.view.View.GONE
                binding.weatherOverlay.visibility = when {
                    !weatherVisible -> android.view.View.GONE
                    quality == WeatherService.EFFECT_QUALITY_OFF -> android.view.View.GONE
                    else -> android.view.View.VISIBLE
                }
                (binding.weatherOverlay as FullScreenWeatherOverlay).setEffectSettings(
                    quality = quality,
                    reduceMotion = reduceMotion,
                    disableLightning = disableLightning
                )
                weatherData?.let { data: WeatherService.WeatherData ->
                    val category = weatherService.getWeatherCategory(data.conditionCode)
                    (binding.weatherOverlay as FullScreenWeatherOverlay).setWeatherData(
                        category = category,
                        isDay = data.isDay,
                        params = FullScreenWeatherOverlay.WeatherFxParams(
                            windSpeedKph = data.windSpeed,
                            windDegree = data.windDegree,
                            humidity = data.humidity,
                            precipMm = data.precipMm,
                            cloud = data.cloud
                        )
                    )
                }
            }
        }
    }

    private data class WeatherOverlayState(
        val enabled: Boolean,
        val quality: Int,
        val reduceMotion: Boolean,
        val disableLightning: Boolean,
        val weatherData: WeatherService.WeatherData?
    )

    private fun setupUI() {
        // Set initial focus
        ensureInitialTvFocus()

        setupInputTextVisibilityFix()
        showInitialSetupChoices()

        // Setup button click listeners
        binding.btnChooseActivation.setOnClickListener {
            animateButtonPress(it)
            startActivity(Intent(this, DeviceActivationActivity::class.java))
        }
        binding.btnChooseXtream.setOnClickListener {
            animateButtonPress(it)
            showSourceForm(LoginViewModel.LoginTab.XTREAM)
        }
        binding.btnChooseM3u.setOnClickListener {
            animateButtonPress(it)
            showSourceForm(LoginViewModel.LoginTab.M3U)
        }
        binding.btnChooseActivation.setOnKeyListener { v, keyCode, event ->
            if ((keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) && event.action == KeyEvent.ACTION_UP) {
                animateButtonPress(v)
                startActivity(Intent(this, DeviceActivationActivity::class.java))
                true
            } else false
        }
        binding.btnChooseXtream.setOnKeyListener { v, keyCode, event ->
            if ((keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) && event.action == KeyEvent.ACTION_UP) {
                animateButtonPress(v)
                showSourceForm(LoginViewModel.LoginTab.XTREAM)
                true
            } else false
        }
        binding.btnChooseM3u.setOnKeyListener { v, keyCode, event ->
            if ((keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) && event.action == KeyEvent.ACTION_UP) {
                animateButtonPress(v)
                showSourceForm(LoginViewModel.LoginTab.M3U)
                true
            } else false
        }
        binding.btnConnectClean.setOnClickListener {
            animateButtonPress(it)
            attemptXtreamConnect()
        }
        binding.btnImportM3uClean.setOnClickListener {
            animateButtonPress(it)
            attemptM3uImport()
        }
        binding.btnImportM3uLocalClean.setOnClickListener {
            animateButtonPress(it)
            openM3uFilePicker()
        }
        binding.btnOpenActivationClean.setOnClickListener {
            animateButtonPress(it)
            startActivity(Intent(this, DeviceActivationActivity::class.java))
        }
        binding.btnBackToMethodsClean.setOnClickListener {
            animateButtonPress(it)
            showInitialSetupChoices()
        }

        // Handle D-Pad selection
        binding.btnConnectClean.setOnKeyListener { v, keyCode, event ->
            when {
                keyCode == KeyEvent.KEYCODE_DPAD_DOWN && event.action == KeyEvent.ACTION_DOWN -> {
                    binding.btnBackToMethodsClean.requestFocus()
                    true
                }
                keyCode == KeyEvent.KEYCODE_DPAD_UP && event.action == KeyEvent.ACTION_DOWN -> {
                    binding.etPasswordClean.requestFocus()
                    true
                }
                keyCode == KeyEvent.KEYCODE_DPAD_CENTER && event.action == KeyEvent.ACTION_UP -> {
                    animateButtonPress(v)
                    attemptXtreamConnect()
                    true
                }
                else -> false
            }
        }

        binding.btnImportM3uClean.setOnKeyListener { v, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER && event.action == KeyEvent.ACTION_UP) {
                animateButtonPress(v)
                attemptM3uImport()
                true
            } else false
        }
        
        binding.btnImportM3uLocalClean.setOnKeyListener { v, keyCode, event ->
            when {
                keyCode == KeyEvent.KEYCODE_DPAD_DOWN && event.action == KeyEvent.ACTION_DOWN -> {
                    binding.btnBackToMethodsClean.requestFocus()
                    true
                }
                keyCode == KeyEvent.KEYCODE_DPAD_UP && event.action == KeyEvent.ACTION_DOWN -> {
                    binding.btnImportM3uClean.requestFocus()
                    true
                }
                keyCode == KeyEvent.KEYCODE_DPAD_CENTER && event.action == KeyEvent.ACTION_UP -> {
                    animateButtonPress(v)
                    openM3uFilePicker()
                    true
                }
                else -> false
            }
        }
        binding.activationEntryCard.setOnClickListener {
            binding.btnOpenActivationClean.requestFocus()
        }
        binding.activationEntryCard.setOnKeyListener { _, keyCode, event ->
            when {
                keyCode == KeyEvent.KEYCODE_DPAD_CENTER && event.action == KeyEvent.ACTION_UP -> {
                    binding.btnOpenActivationClean.requestFocus()
                    true
                }
                keyCode == KeyEvent.KEYCODE_DPAD_UP && event.action == KeyEvent.ACTION_DOWN -> {
                    if (binding.viewFlipperLoginClean.displayedChild == 0) {
                        binding.btnConnectClean.requestFocus()
                    } else {
                        binding.btnImportM3uLocalClean.requestFocus()
                    }
                    true
                }
                else -> false
            }
        }
        binding.btnOpenActivationClean.setOnKeyListener { v, keyCode, event ->
            when {
                keyCode == KeyEvent.KEYCODE_DPAD_UP && event.action == KeyEvent.ACTION_DOWN -> {
                    if (binding.viewFlipperLoginClean.displayedChild == 0) {
                        binding.btnConnectClean.requestFocus()
                    } else {
                        binding.btnImportM3uLocalClean.requestFocus()
                    }
                    true
                }
                keyCode == KeyEvent.KEYCODE_DPAD_DOWN && event.action == KeyEvent.ACTION_DOWN -> {
                    binding.btnTabXtreamClean.requestFocus()
                    true
                }
                keyCode == KeyEvent.KEYCODE_DPAD_LEFT && event.action == KeyEvent.ACTION_DOWN -> {
                    binding.btnTabXtreamClean.requestFocus()
                    true
                }
                keyCode == KeyEvent.KEYCODE_DPAD_RIGHT && event.action == KeyEvent.ACTION_DOWN -> {
                    binding.btnTabM3uClean.requestFocus()
                    true
                }
                (keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) && event.action == KeyEvent.ACTION_UP -> {
                    animateButtonPress(v)
                    startActivity(Intent(this, DeviceActivationActivity::class.java))
                    true
                }
                else -> false
            }
        }
        binding.btnBackToMethodsClean.setOnKeyListener { v, keyCode, event ->
            when {
                keyCode == KeyEvent.KEYCODE_DPAD_UP && event.action == KeyEvent.ACTION_DOWN -> {
                    if (binding.viewFlipperLoginClean.displayedChild == 0) {
                        binding.btnConnectClean.requestFocus()
                    } else {
                        binding.btnImportM3uLocalClean.requestFocus()
                    }
                    true
                }
                (keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) && event.action == KeyEvent.ACTION_UP -> {
                    animateButtonPress(v)
                    showInitialSetupChoices()
                    true
                }
                else -> false
            }
        }
        setupDpadFocusOverrides()

        // Focus change listeners
        listOf(
            binding.btnChooseActivation,
            binding.btnChooseXtream,
            binding.btnChooseM3u,
            binding.btnTabXtreamClean,
            binding.btnTabM3uClean,
            binding.btnConnectClean,
            binding.btnImportM3uClean,
            binding.btnImportM3uLocalClean,
            binding.etServerUrlClean, 
            binding.etUsernameClean, 
            binding.etPasswordClean,
            binding.etM3uUrlClean,
            binding.activationEntryCard,
            binding.btnOpenActivationClean,
            binding.btnBackToMethodsClean
        ).forEach { editText ->
            editText.setOnFocusChangeListener { view, hasFocus ->
                if (hasFocus) {
                    viewModel.clearError()
                    view.animate()
                        .scaleX(TvCinematicTokens.BUTTON_SCALE)
                        .scaleY(TvCinematicTokens.BUTTON_SCALE)
                        .setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
                        .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                        .start()
                } else {
                    view.animate()
                        .scaleX(1f)
                        .scaleY(1f)
                        .setDuration(TvCinematicTokens.FOCUS_OUT_DURATION_MS)
                        .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                        .start()
                }
            }
        }

        
        // Auto-detect from Server URL input (e.g. if user pastes a full link)
        binding.etServerUrlClean.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                s?.toString()?.let { viewModel.detectLoginType(it) }
            }
        })
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (::binding.isInitialized && !binding.setupChoicePanel.isVisible) {
                    showInitialSetupChoices()
                    return
                }
                if (isTaskRoot) {
                    exitHelper.onBackPressed()
                } else {
                    finish()
                }
            }
        })
    }

    private fun ensureInitialTvFocus() {
        binding.btnChooseActivation.post {
            if (currentFocus == null || currentFocus === binding.loginCardClean) {
                if (binding.setupChoicePanel.isVisible) {
                    binding.btnChooseActivation.requestFocus()
                } else {
                    binding.btnTabXtreamClean.requestFocus()
                }
            }
        }
    }

    private fun showInitialSetupChoices() {
        binding.setupChoicePanel.visibility = View.VISIBLE
        binding.sourceModeTabs.visibility = View.GONE
        binding.viewFlipperLoginClean.visibility = View.GONE
        binding.activationEntryCard.visibility = View.GONE
        binding.btnBackToMethodsClean.visibility = View.GONE
        binding.btnChooseM3u.nextFocusDownId = binding.btnChooseM3u.id
        binding.btnChooseActivation.post { binding.btnChooseActivation.requestFocus() }
    }

    private fun showSourceForm(tab: LoginViewModel.LoginTab) {
        binding.setupChoicePanel.visibility = View.GONE
        binding.sourceModeTabs.visibility = View.GONE
        binding.viewFlipperLoginClean.visibility = View.VISIBLE
        binding.activationEntryCard.visibility = View.GONE
        binding.btnBackToMethodsClean.visibility = View.VISIBLE
        binding.btnChooseM3u.nextFocusDownId = binding.btnChooseM3u.id
        selectTab(tab)
        val target = when (tab) {
            LoginViewModel.LoginTab.XTREAM -> binding.etServerUrlClean
            LoginViewModel.LoginTab.M3U -> binding.etM3uUrlClean
        }
        binding.btnBackToMethodsClean.nextFocusUpId = when (tab) {
            LoginViewModel.LoginTab.XTREAM -> binding.btnConnectClean.id
            LoginViewModel.LoginTab.M3U -> binding.btnImportM3uLocalClean.id
        }
        target.post { target.requestFocus() }
    }

    private fun applySavedActivationState() {
        val activationPrefs = getSharedPreferences("activation", MODE_PRIVATE)
        val isActivated = activationPrefs.getString("activation_status", null) == "activated"
        if (isActivated) {
            binding.btnOpenActivationClean.text = getString(R.string.activation_entry_button_done)
        } else {
            binding.btnOpenActivationClean.text = getString(R.string.activation_entry_button)
        }
    }

    private fun handleActivationCompletedIntent(intent: Intent?) {
        if (intent?.getBooleanExtra(EXTRA_ACTIVATION_COMPLETED, false) != true) return

        showSourceForm(LoginViewModel.LoginTab.XTREAM)
        binding.tvErrorClean.text = getString(R.string.activation_completed_login_hint)
        binding.tvErrorClean.isVisible = true
        binding.etServerUrlClean.postDelayed({
            binding.etServerUrlClean.requestFocus()
        }, 180)
        startWebsiteSourcePolling()
        intent.removeExtra(EXTRA_ACTIVATION_COMPLETED)
    }

    private fun startWebsiteSourcePollingIfActivated() {
        val activationPrefs = getSharedPreferences("activation", MODE_PRIVATE)
        val isActivated = activationPrefs.getString("activation_status", null) == "activated"
        if (isActivated) {
            startWebsiteSourcePolling()
        }
    }

    private fun startWebsiteSourcePolling() {
        websiteSourcePollAttempts = 0
        websiteSourceHandler.removeCallbacks(websiteSourceRunnable)
        websiteSourceHandler.postDelayed(websiteSourceRunnable, 1_000)
    }

    private fun scheduleNextWebsiteSourcePoll() {
        if (websiteSourcePollAttempts < 45 && pendingWebsiteSourceId == null) {
            websiteSourceHandler.postDelayed(websiteSourceRunnable, 4_000)
        } else if (pendingWebsiteSourceId == null && ::binding.isInitialized) {
            binding.tvErrorClean.text = getString(R.string.website_source_wait_timeout)
            binding.tvErrorClean.isVisible = true
        }
    }

    private fun checkWebsiteDeliveredSource(scheduleNext: Boolean) {
        val activationPrefs = getSharedPreferences("activation", MODE_PRIVATE)
        val publicDeviceId = activationPrefs.getString("public_device_id", null).orEmpty()
        val sourcePullToken = getOrCreateSourcePullToken()
        if (publicDeviceId.isBlank() || sourcePullToken.isBlank() || pendingWebsiteSourceId != null) return

        websiteSourcePollAttempts += 1
        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) {
                runCatching {
                    val queryDevice = URLEncoder.encode(publicDeviceId, "UTF-8")
                    val queryToken = URLEncoder.encode(sourcePullToken, "UTF-8")
                    val connection = (URL("${BuildConfig.WEB_API_BASE_URL.trimEnd('/')}/api/app/activation/source?publicDeviceId=$queryDevice&token=$queryToken").openConnection() as HttpURLConnection).apply {
                        requestMethod = "GET"
                        connectTimeout = 8_000
                        readTimeout = 8_000
                    }
                    val responseText = if (connection.responseCode < 400) {
                        connection.inputStream.bufferedReader().use { it.readText() }
                    } else {
                        connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
                    }
                    JSONObject(responseText)
                }.getOrNull()
            }

            if (result?.optString("status") == "source_available") {
                pendingWebsiteSourceId = result.optString("sourceId")
                importWebsiteDeliveredSource(result.optJSONObject("source"))
            } else if (scheduleNext) {
                scheduleNextWebsiteSourcePoll()
            }
        }
    }

    private fun importWebsiteDeliveredSource(source: JSONObject?) {
        if (source == null) {
            binding.tvErrorClean.text = getString(R.string.website_source_failed)
            binding.tvErrorClean.isVisible = true
            ackWebsiteSource("failed", "Missing source payload")
            return
        }

        val type = source.optString("type")
        val name = source.optString("name")
        binding.tvErrorClean.text = getString(R.string.website_source_received)
        binding.tvErrorClean.isVisible = true

        when (type) {
            "xtream" -> {
                showSourceForm(LoginViewModel.LoginTab.XTREAM)
                viewModel.login(
                    source.optString("serverUrl"),
                    source.optString("username"),
                    source.optString("password")
                )
            }
            "m3u" -> {
                showSourceForm(LoginViewModel.LoginTab.M3U)
                viewModel.importM3uFromUrl(source.optString("playlistUrl"), name)
            }
            else -> {
                binding.tvErrorClean.text = getString(R.string.website_source_failed)
                binding.tvErrorClean.isVisible = true
                ackWebsiteSource("failed", "Unsupported source type")
            }
        }
    }

    private fun ackWebsiteSource(status: String, message: String? = null, onDone: (() -> Unit)? = null) {
        val sourceId = pendingWebsiteSourceId ?: run {
            onDone?.invoke()
            return
        }
        val activationPrefs = getSharedPreferences("activation", MODE_PRIVATE)
        val publicDeviceId = activationPrefs.getString("public_device_id", null).orEmpty()
        val token = getOrCreateSourcePullToken()

        lifecycleScope.launch {
            withContext(Dispatchers.IO) {
                runCatching {
                    val body = JSONObject().apply {
                        put("publicDeviceId", publicDeviceId)
                        put("token", token)
                        put("sourceId", sourceId)
                        put("status", status)
                        if (!message.isNullOrBlank()) put("message", message.take(240))
                    }.toString()
                    val connection = (URL("${BuildConfig.WEB_API_BASE_URL.trimEnd('/')}/api/app/activation/source/ack").openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        connectTimeout = 8_000
                        readTimeout = 8_000
                        doOutput = true
                        setRequestProperty("content-type", "application/json")
                    }
                    connection.outputStream.use { it.write(body.toByteArray()) }
                    if (connection.responseCode < 400) {
                        connection.inputStream.close()
                    } else {
                        connection.errorStream?.close()
                    }
                }
            }
            pendingWebsiteSourceId = null
            onDone?.invoke()
        }
    }

    private fun getOrCreateSourcePullToken(): String {
        val activationPrefs = getSharedPreferences("activation", MODE_PRIVATE)
        activationPrefs.getString("source_pull_token", null)?.let { existing ->
            if (existing.length >= 32) return existing
        }
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        val token = Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
        activationPrefs.edit().putString("source_pull_token", token).apply()
        return token
    }

    private fun setupDpadFocusOverrides() {
        fun moveOnDpad(view: View, up: View?, down: View?) {
            view.setOnKeyListener { _, keyCode, event ->
                if (event.action != KeyEvent.ACTION_DOWN) return@setOnKeyListener false
                when (keyCode) {
                    KeyEvent.KEYCODE_DPAD_UP -> {
                        up?.requestFocus()
                        up != null
                    }
                    KeyEvent.KEYCODE_DPAD_DOWN -> {
                        down?.requestFocus()
                        down != null
                    }
                    else -> false
                }
            }
        }

        moveOnDpad(binding.etServerUrlClean, binding.btnBackToMethodsClean, binding.etUsernameClean)
        moveOnDpad(binding.etUsernameClean, binding.etServerUrlClean, binding.etPasswordClean)
        moveOnDpad(binding.etPasswordClean, binding.etUsernameClean, binding.btnConnectClean)
        moveOnDpad(binding.etM3uUrlClean, binding.btnBackToMethodsClean, binding.btnImportM3uClean)
    }

    private fun setupPasswordToggle() {
        binding.btnTogglePasswordClean.setOnClickListener {
            togglePasswordVisibility()
        }

        binding.etPasswordClean.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (!isPasswordVisible && count > 0 && s != null && s.isNotEmpty()) {
                    val newChar = s.lastOrNull()
                    if (newChar != null && newChar != lastTypedChar) {
                        lastTypedChar = newChar
                        showLastCharacterBriefly()
                    }
                }
            }
            override fun afterTextChanged(s: Editable?) {}
        })
    }

    private fun showLastCharacterBriefly() {
        passwordRevealHandler.removeCallbacksAndMessages(null)
        binding.etPasswordClean.transformationMethod = null
        binding.etPasswordClean.setSelection(binding.etPasswordClean.text?.length ?: 0)

        passwordRevealHandler.postDelayed({
            if (!isPasswordVisible) {
                binding.etPasswordClean.transformationMethod = PasswordTransformationMethod.getInstance()
                binding.etPasswordClean.setSelection(binding.etPasswordClean.text?.length ?: 0)
            }
            lastTypedChar = null
        }, 800)
    }

    private fun togglePasswordVisibility() {
        isPasswordVisible = !isPasswordVisible

        if (isPasswordVisible) {
            binding.etPasswordClean.transformationMethod = null
            binding.btnTogglePasswordClean.setImageResource(R.drawable.ic_visibility)
            binding.btnTogglePasswordClean.animate().rotation(180f).setDuration(200).start()
        } else {
            binding.etPasswordClean.transformationMethod = PasswordTransformationMethod.getInstance()
            binding.btnTogglePasswordClean.setImageResource(R.drawable.ic_visibility_off)
            binding.btnTogglePasswordClean.animate().rotation(0f).setDuration(200).start()
        }

        binding.etPasswordClean.setSelection(binding.etPasswordClean.text?.length ?: 0)
    }

    private fun startEntranceAnimations() {
        // 1. Logo Entrance with Slide, Scale, and Fade
        binding.imgLogoClean.alpha = 0f
        binding.imgLogoClean.scaleX = 0.85f
        binding.imgLogoClean.scaleY = 0.85f
        binding.imgLogoClean.translationX = -50f
        binding.imgLogoClean.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .translationX(0f)
            .setDuration(TvCinematicTokens.ENTER_EXIT_DURATION_MS)
            .setStartDelay(80)
            .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
            .start()

        // 2. Login Card Entrance with Slide and Fade
        binding.loginCardClean.alpha = 0f
        binding.loginCardClean.translationX = 100f
        binding.loginCardClean.animate()
            .alpha(1f)
            .translationX(0f)
            .setDuration(TvCinematicTokens.ENTER_EXIT_DURATION_MS)
            .setStartDelay(120)
            .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
            .start()

        // 3. Developer Credit Fade In
        binding.tvDeveloperCreditClean.alpha = 0f
        binding.tvDeveloperCreditClean.translationY = 30f
        binding.tvDeveloperCreditClean.animate()
            .alpha(0.6f)
            .translationY(0f)
            .setDuration(TvCinematicTokens.ENTER_EXIT_DURATION_MS)
            .setStartDelay(180)
            .start()

        Handler(Looper.getMainLooper()).postDelayed({ startLogoAnimations() }, 220)
    }

    private fun startLogoAnimations() {
        // Single calm pulse instead of infinite breathing/floating loops.
        logoAnimatorSet?.cancel()
        logoAnimatorSet = AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(binding.imgLogoClean, "scaleX", 1f, 1.03f, 1f),
                ObjectAnimator.ofFloat(binding.imgLogoClean, "scaleY", 1f, 1.03f, 1f),
                ObjectAnimator.ofFloat(binding.imgLogoClean, "alpha", 1f, 0.96f, 1f)
            )
            duration = 900
            interpolator = AccelerateDecelerateInterpolator()
            start()
        }
    }

    private fun setupFormNavigation() {
        // Xtream form
        binding.etServerUrlClean.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_NEXT) {
                binding.etUsernameClean.requestFocus()
                true
            } else false
        }

        binding.etUsernameClean.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_NEXT) {
                binding.etPasswordClean.requestFocus()
                true
            } else false
        }

        binding.etPasswordClean.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                attemptXtreamConnect()
                true
            } else false
        }

        // M3U form
        binding.etM3uUrlClean.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                attemptM3uImport()
                true
            } else false
        }
    }

    private fun setupTabs() {
        binding.btnTabXtreamClean.setOnClickListener {
            animateButtonPress(it)
            selectTab(LoginViewModel.LoginTab.XTREAM)
        }
        binding.btnTabM3uClean.setOnClickListener {
            animateButtonPress(it)
            selectTab(LoginViewModel.LoginTab.M3U)
        }

        binding.btnTabXtreamClean.setOnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER && event.action == KeyEvent.ACTION_UP) {
                selectTab(LoginViewModel.LoginTab.XTREAM)
                true
            } else false
        }

        binding.btnTabM3uClean.setOnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER && event.action == KeyEvent.ACTION_UP) {
                selectTab(LoginViewModel.LoginTab.M3U)
                true
            } else false
        }

        selectTab(LoginViewModel.LoginTab.XTREAM)
    }

    private fun selectTab(tab: LoginViewModel.LoginTab) {
        viewModel.setActiveTab(tab)

        val activeColor = ContextCompat.getColor(this, R.color.login_white)
        val inactiveColor = ContextCompat.getColor(this, R.color.color_text_primary_80)

        when (tab) {
            LoginViewModel.LoginTab.XTREAM -> {
                binding.btnTabXtreamClean.isSelected = true
                binding.btnTabM3uClean.isSelected = false

                binding.btnTabXtreamClean.setTextColor(activeColor)
                binding.btnTabM3uClean.setTextColor(inactiveColor)
                binding.btnTabXtreamClean.alpha = 1f
                binding.btnTabM3uClean.alpha = 0.92f
                binding.viewFlipperLoginClean.displayedChild = 0
            }
            LoginViewModel.LoginTab.M3U -> {
                binding.btnTabXtreamClean.isSelected = false
                binding.btnTabM3uClean.isSelected = true

                binding.btnTabXtreamClean.setTextColor(inactiveColor)
                binding.btnTabM3uClean.setTextColor(activeColor)
                binding.btnTabXtreamClean.alpha = 0.92f
                binding.btnTabM3uClean.alpha = 1f
                binding.viewFlipperLoginClean.displayedChild = 1
            }
        }
    }

    private fun observeViewModel() {
        viewModel.isLoading.observe(this) { isLoading ->
            binding.loadingOverlayClean.isVisible = isLoading

            if (isLoading) {
                startLoadingAnimations()
                startMarketingTextRotation()
            } else {
                stopLoadingAnimations()
                stopMarketingTextRotation()
            }

            binding.btnTabXtreamClean.isEnabled = !isLoading
            binding.btnTabM3uClean.isEnabled = !isLoading
            binding.btnConnectClean.isEnabled = !isLoading
            binding.btnImportM3uClean.isEnabled = !isLoading
        }

        viewModel.loginState.observe(this) { state ->
            when (state) {
                is LoginViewModel.LoginState.Idle -> {
                    binding.tvErrorClean.isVisible = false
                }
                is LoginViewModel.LoginState.AlreadyLoggedIn -> {
                    navigateToHome()
                }
                is LoginViewModel.LoginState.Success -> {
                    Toast.makeText(this, R.string.login_success, Toast.LENGTH_SHORT).show()
                    if (pendingWebsiteSourceId != null) {
                        ackWebsiteSource("imported") { navigateToHome() }
                    } else {
                        navigateToHome()
                    }
                }
                is LoginViewModel.LoginState.M3uImported -> {
                    Toast.makeText(this, getString(R.string.login_playlist_imported), Toast.LENGTH_SHORT).show()
                    if (pendingWebsiteSourceId != null) {
                        ackWebsiteSource("imported") { navigateToHome() }
                    } else {
                        navigateToHome()
                    }
                }
                is LoginViewModel.LoginState.Error -> {
                    if (pendingWebsiteSourceId != null) {
                        ackWebsiteSource("failed", safeLoginError(state.message))
                    }
                    binding.tvErrorClean.text = safeLoginError(state.message)
                    binding.tvErrorClean.isVisible = true
                    animateErrorShake()
                }
                else -> {}
            }
        }
        
        viewModel.detectedCredentials.observe(this) { credentials ->
            when (credentials) {
                is LoginViewModel.DetectedCredentials.Xtream -> {
                    selectTab(LoginViewModel.LoginTab.XTREAM)
                    binding.etServerUrlClean.setText(credentials.url)
                    binding.etUsernameClean.setText(credentials.username)
                    binding.etPasswordClean.setText(credentials.password)
                    Toast.makeText(this, getString(R.string.login_xtream_detected), Toast.LENGTH_SHORT).show()
                    binding.btnConnectClean.requestFocus()
                }
                is LoginViewModel.DetectedCredentials.M3u -> {
                    selectTab(LoginViewModel.LoginTab.M3U)
                    binding.etM3uUrlClean.setText(credentials.url)
                    Toast.makeText(this, getString(R.string.login_m3u_detected), Toast.LENGTH_SHORT).show()
                    binding.btnImportM3uClean.requestFocus()
                }
            }
        }
    }

    private fun safeLoginError(message: String): String {
        val lower = message.lowercase()
        val mayContainSourceSecret =
            lower.contains("http://") ||
            lower.contains("https://") ||
            lower.contains("username=") ||
            lower.contains("password=") ||
            lower.contains("token=") ||
            lower.contains("illegal character")

        return if (mayContainSourceSecret) {
            "Could not import this source. Check the URL or credentials and try again."
        } else {
            message
        }
    }

    private fun startMarketingTextRotation() {
        currentMarketingIndex = 0
        rotateMarketingText()
    }

    private fun rotateMarketingText() {
        if (binding.loadingOverlayClean.isVisible) {
            binding.tvMarketingTextClean.animate()
                .alpha(0f)
                .setDuration(400)
                .withEndAction {
                    currentMarketingIndex = (currentMarketingIndex + 1) % marketingMessages.size
                    binding.tvMarketingTextClean.setText(marketingMessages[currentMarketingIndex])
                    
                    binding.tvMarketingTextClean.animate()
                        .alpha(1f)
                        .setDuration(400)
                        .start()
                }
                .start()

            marketingHandler.postDelayed({
                rotateMarketingText()
            }, 3000)
        }
    }

    private fun stopMarketingTextRotation() {
        marketingHandler.removeCallbacksAndMessages(null)
    }

    private fun startLoadingAnimations() {
        val logoPulse = ObjectAnimator.ofFloat(
            binding.loadingLogoClean, "alpha", 1f, 0.6f, 1f
        ).apply {
            duration = 900
            repeatCount = 1
            interpolator = AccelerateDecelerateInterpolator()
        }

        val logoScale = ObjectAnimator.ofFloat(
            binding.loadingLogoClean, "scaleX", 1f, 1.05f, 1f
        ).apply {
            duration = 900
            repeatCount = 1
            interpolator = AccelerateDecelerateInterpolator()
        }

        val logoScaleY = ObjectAnimator.ofFloat(
            binding.loadingLogoClean, "scaleY", 1f, 1.05f, 1f
        ).apply {
            duration = 900
            repeatCount = 1
            interpolator = AccelerateDecelerateInterpolator()
        }

        loadingAnimatorSet = AnimatorSet().apply {
            playTogether(logoPulse, logoScale, logoScaleY)
            start()
        }
    }

    private fun stopLoadingAnimations() {
        loadingAnimatorSet?.cancel()
        loadingAnimatorSet = null
        
        binding.loadingLogoClean.alpha = 1f
        binding.loadingLogoClean.scaleX = 1f
        binding.loadingLogoClean.scaleY = 1f
    }

    private fun attemptXtreamConnect() {
        val serverUrl = binding.etServerUrlClean.text.toString()
        val username = binding.etUsernameClean.text.toString()
        val password = binding.etPasswordClean.text.toString()
        viewModel.login(serverUrl, username, password)
    }

    private fun attemptM3uImport() {
        val m3uUrl = binding.etM3uUrlClean.text.toString()
        viewModel.importM3uFromUrl(m3uUrl, "")
    }
    
    private fun openM3uFilePicker() {
        openM3uFilePickerWithFallback()
    }
    
    private fun openM3uFilePickerWithFallback() {
        // Try OpenDocument first (best option - persistent URI)
        try {
            m3uFilePicker.launch(arrayOf(
                "application/vnd.apple.mpegurl",
                "audio/mpegurl",
                "text/plain",
                "*/*"
            ))
        } catch (e: android.content.ActivityNotFoundException) {
            // Fallback to GetContent if OpenDocument is not supported
            try {
                m3uFilePickerFallback.launch("*/*")
            } catch (e2: android.content.ActivityNotFoundException) {
                // Final fallback: use Intent directly
                try {
                    val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                        type = "*/*"
                        addCategory(Intent.CATEGORY_OPENABLE)
                    }
                    val chooser = Intent.createChooser(intent, getString(R.string.login_select_m3u_file))
                    startActivityForResult(chooser, REQUEST_CODE_M3U_PICKER)
                } catch (e3: android.content.ActivityNotFoundException) {
                    Toast.makeText(
                        this,
                        getString(R.string.login_no_file_picker_app),
                        Toast.LENGTH_LONG
                    ).show()
                } catch (e3: Exception) {
                    Toast.makeText(
                        this,
                        getString(R.string.login_failed_open_file_picker, e3.message ?: ""),
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (e2: Exception) {
                Toast.makeText(
                    this,
                    getString(R.string.login_failed_open_file_picker, e2.message ?: ""),
                    Toast.LENGTH_SHORT
                ).show()
            }
        } catch (e: Exception) {
            // Try fallback on any exception
            try {
                m3uFilePickerFallback.launch("*/*")
            } catch (e2: Exception) {
                Toast.makeText(
                    this,
                    getString(R.string.login_failed_open_file_picker, e2.message ?: ""),
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
    
    private fun handleM3uFile(uri: Uri) {
        if (uri == null) {
            Toast.makeText(this, getString(R.string.login_no_file_selected), Toast.LENGTH_SHORT).show()
            return
        }
        
        try {
            viewModel.importM3uFromFile(uri, "Local Playlist")
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(this, getString(R.string.login_error_reading_file, e.message ?: ""), Toast.LENGTH_SHORT).show()
        }
    }

    private fun animateButtonPress(view: View) {
        view.animate()
            .scaleX(0.97f)
            .scaleY(0.97f)
            .setDuration(90)
            .withEndAction {
                view.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(TvCinematicTokens.FOCUS_IN_DURATION_MS)
                    .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                    .start()
            }
            .start()
    }

    private fun animateErrorShake() {
        val shakeAnim = AnimationUtils.loadAnimation(this, R.anim.anim_shake_error)
        binding.tvErrorClean.startAnimation(shakeAnim)
    }

    private fun navigateToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }

    private fun setupInputTextVisibilityFix() {
        fun attach(editText: android.widget.EditText) {
            // Keep cursor at end so long URLs stay readable on TV (field scrolls to the latest typed text).
            editText.addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    if (!editText.hasFocus()) return
                    val len = s?.length ?: 0
                    if (len >= 0) {
                        try {
                            editText.setSelection(len)
                        } catch (_: Exception) {
                            // Ignore selection errors for transient IME states.
                        }
                    }
                }
            })

            editText.setOnFocusChangeListener { _, hasFocus ->
                if (hasFocus) {
                    editText.post {
                        val len = editText.text?.length ?: 0
                        try {
                            editText.setSelection(len)
                        } catch (_: Exception) { }
                    }
                }
            }
        }

        attach(binding.etServerUrlClean)
        attach(binding.etUsernameClean)
        attach(binding.etPasswordClean)
        attach(binding.etM3uUrlClean)
    }

    private fun isTvDevice(): Boolean {
        val uiModeManager = getSystemService(Context.UI_MODE_SERVICE) as UiModeManager
        return uiModeManager.currentModeType == android.content.res.Configuration.UI_MODE_TYPE_TELEVISION
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_CODE_M3U_PICKER && resultCode == android.app.Activity.RESULT_OK) {
            data?.data?.let { uri ->
                handleM3uFile(uri)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (!::binding.isInitialized) return
        applySavedActivationState()
        ensureInitialTvFocus()
        startWebsiteSourcePollingIfActivated()
        binding.htcAnimatedBackground.resumeAnimation()
        binding.weatherOverlay.startAnimation()
        
        // Check clipboard for auto-login credentials
        checkClipboardForCredentials()
    }
    
    private fun checkClipboardForCredentials() {
        try {
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
            if (clipboard.hasPrimaryClip()) {
                val clipData = clipboard.primaryClip
                if (clipData != null && clipData.itemCount > 0) {
                    val text = clipData.getItemAt(0).text?.toString()
                    if (!text.isNullOrBlank()) {
                        viewModel.detectLoginType(text)
                    }
                }
            }
        } catch (e: Exception) {
            // Ignore clipboard errors
        }
    }

    override fun onPause() {
        super.onPause()
        if (!::binding.isInitialized) return
        binding.htcAnimatedBackground.pauseAnimation()
        binding.weatherOverlay.pauseAnimation()
    }

    override fun onDestroy() {
        super.onDestroy()
        if (!::binding.isInitialized) return
        passwordRevealHandler.removeCallbacksAndMessages(null)
        marketingHandler.removeCallbacksAndMessages(null)
        websiteSourceHandler.removeCallbacksAndMessages(null)
        logoAnimatorSet?.cancel()
        loadingAnimatorSet?.cancel()
        exitHelper.dismissDialog()
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (::binding.isInitialized && !binding.setupChoicePanel.isVisible) {
                showInitialSetupChoices()
                return true
            }
            if (isTaskRoot) {
                // Double-back within 2s => show confirmation dialog
                return exitHelper.onBackPressed()
            }
            finish()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }
}
