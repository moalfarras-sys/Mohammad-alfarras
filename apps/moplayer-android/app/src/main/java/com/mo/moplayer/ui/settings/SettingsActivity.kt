package com.mo.moplayer.ui.settings

import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.text.format.DateUtils
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.mo.moplayer.BuildConfig
import com.mo.moplayer.R
import com.mo.moplayer.ui.common.BaseTvActivity
import com.mo.moplayer.databinding.ActivitySettingsBinding
import com.mo.moplayer.util.TvNavigationManager
import com.mo.moplayer.ui.login.LoginActivity
import com.mo.moplayer.ui.settings.adapters.SourceStatusAdapter
import com.mo.moplayer.ui.settings.adapters.SettingsCategoryAdapter
import com.mo.moplayer.util.BackgroundManager
import com.mo.moplayer.util.CrashGuard
import com.mo.moplayer.util.ParentalLockManager
import com.mo.moplayer.util.PlayerPreferences
import com.mo.moplayer.util.SmartRefreshManager
import com.mo.moplayer.util.ThemeManager
import com.mo.moplayer.data.football.FootballService
import com.mo.moplayer.data.update.AppUpdateInfo
import com.mo.moplayer.data.update.UpdateInstallResult
import com.mo.moplayer.data.update.UpdateRepository
import com.mo.moplayer.data.weather.WeatherService
import dagger.hilt.android.AndroidEntryPoint
import android.app.AlertDialog
import android.net.Uri
import android.widget.ListView
import android.widget.SeekBar
import android.widget.Spinner
import android.widget.ArrayAdapter
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.widget.SwitchCompat
import com.mo.moplayer.ui.common.utils.FocusMapRegistry
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject

@AndroidEntryPoint
class SettingsActivity : BaseTvActivity() {
    
    override val screenId: String = "settings"
    
    companion object {
        private const val REQUEST_CODE_IMAGE_PICKER = 1001
    }

    private lateinit var binding: ActivitySettingsBinding
    private val viewModel: SettingsViewModel by viewModels()

    @Inject
    lateinit var parentalLockManager: ParentalLockManager
    
    @Inject
    lateinit var playerPreferences: PlayerPreferences
    
    @Inject
    lateinit var weatherService: WeatherService

    @Inject
    lateinit var footballService: FootballService

    @Inject
    lateinit var smartRefreshManager: SmartRefreshManager
    
    @Inject
    lateinit var locationService: com.mo.moplayer.data.location.IpLocationService

    @Inject
    lateinit var tvUiPreferences: com.mo.moplayer.util.TvUiPreferences

    private lateinit var categoryAdapter: SettingsCategoryAdapter
    private lateinit var sourceStatusAdapter: SourceStatusAdapter
    private var currentPanel = SettingsPanel.SERVER
    private var lastPanelFocusId = mutableMapOf<SettingsPanel, Int>()
    private val panelRoots: MutableMap<SettingsPanel, View> = mutableMapOf()
    private var serverRefreshInFlight = false
    private var updateInfo: AppUpdateInfo? = null
    private var updateCheckInFlight = false
    private var updateDownloadInFlight = false
    private val updateRepository by lazy(LazyThreadSafetyMode.NONE) { UpdateRepository(applicationContext) }
    private val accentChipViews = mutableMapOf<View, Pair<ThemeManager.AppThemeId, ThemeManager.AccentId>>()

    private enum class SettingsPanel {
        SERVER, PLAYER, PARENTAL, INTERFACE, UPDATE, ABOUT
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupCategories()
        setupServerPanel()
        setupPlayerPanel()
        setupParentalPanel()
        setupInterfacePanel()
        setupUpdatePanel()
        setupAboutPanel()
        setupPinDialog()
        setupPanelRegistry()
        setupCategoryRailFocus()
        setupSettingsInteractionPolish()
        setupSettingsBackNavigation()
        observeViewModel()

        // Show server panel by default
        showPanel(SettingsPanel.SERVER, focusPanel = false)
        binding.rvCategories.post { focusCurrentCategory() }
        binding.animatedBackground.pauseAnimation()
        if (com.mo.moplayer.util.DevicePerformance.allowAnimatedBackground(this)) {
            binding.root.postDelayed({ binding.animatedBackground.resumeAnimation() }, 240L)
        }
    }

    override fun getAnimatedBackground() = binding.animatedBackground

    private fun setupCategories() {
        val categories = listOf(
            SettingsCategory("server", getString(R.string.settings_server), R.drawable.ic_settings),
            SettingsCategory("player", getString(R.string.settings_player), R.drawable.ic_play),
            SettingsCategory("parental", getString(R.string.settings_parental), R.drawable.ic_settings),
            SettingsCategory("interface", getString(R.string.settings_ui), R.drawable.ic_settings),
            SettingsCategory("update", getString(R.string.settings_update_center_title), R.drawable.ic_refresh),
            SettingsCategory("about", getString(R.string.settings_about), R.drawable.ic_settings)
        )

        categoryAdapter = SettingsCategoryAdapter(
            onCategoryClick = { category ->
                when (category.id) {
                    "server" -> showPanel(SettingsPanel.SERVER)
                    "player" -> showPanel(SettingsPanel.PLAYER)
                    "parental" -> showPanel(SettingsPanel.PARENTAL)
                    "interface" -> showPanel(SettingsPanel.INTERFACE)
                    "update" -> showPanel(SettingsPanel.UPDATE)
                    "about" -> showPanel(SettingsPanel.ABOUT)
                }
            }
        )
        categoryAdapter.submitList(categories)

        binding.rvCategories.apply {
            layoutManager = LinearLayoutManager(this@SettingsActivity)
            adapter = categoryAdapter
            
            // TV optimization for remote control
            isFocusable = true
            isFocusableInTouchMode = true
            descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS
        }

        val crashSummary = CrashGuard.lastCrashSummary(this)
        val versionLabel = getString(R.string.settings_version_compact, BuildConfig.VERSION_NAME, BuildConfig.VERSION_CODE)
        binding.tvVersion.text = if (crashSummary.isNullOrBlank()) {
            versionLabel
        } else {
            versionLabel + "\n\n" + getString(R.string.crash_guard_last_crash_short, crashSummary)
        }

        // TV-accessible: version opens the Weather Lab because it was previously hidden behind long-press.
        binding.tvVersion.setOnClickListener {
            showWeatherDebugDialog()
        }
        binding.tvVersion.setOnLongClickListener {
            showWeatherDebugDialog()
            true
        }
    }

    private fun setupPanelRegistry() {
        panelRoots[SettingsPanel.SERVER] = binding.panelServer
        panelRoots[SettingsPanel.PLAYER] = binding.panelPlayer
        panelRoots[SettingsPanel.PARENTAL] = binding.panelParental
        panelRoots[SettingsPanel.INTERFACE] = binding.panelInterface
        panelRoots[SettingsPanel.UPDATE] = binding.panelUpdate
        panelRoots[SettingsPanel.ABOUT] = binding.panelAbout
    }

    private fun setupCategoryRailFocus() {
        binding.rvCategories.post {
            val items = mutableListOf<View>()
            for (index in 0 until binding.rvCategories.childCount) {
                val child = binding.rvCategories.getChildAt(index)
                if (child.isFocusable && child.visibility == View.VISIBLE) {
                    items.add(child)
                }
            }
            FocusMapRegistry.mapVerticalChain(items)
        }
    }

    private fun setupSettingsBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                closeSettingsFromRemote()
            }
        })
    }

    private fun setupServerPanel() {
        sourceStatusAdapter = SourceStatusAdapter(
            onSwitchSource = { item ->
                viewModel.switchSource(item.id)
                Toast.makeText(this, getString(R.string.source_switching, item.name), Toast.LENGTH_SHORT).show()
            },
            onRemoveSource = { item ->
                showDeleteSourceDialog(item)
            }
        )

        binding.rvServers.apply {
            layoutManager = LinearLayoutManager(this@SettingsActivity)
            adapter = sourceStatusAdapter
            isNestedScrollingEnabled = false
            descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS
        }

        // Logout button
        binding.btnLogout.setOnClickListener {
            viewModel.logout()
            val intent = Intent(this, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
        }
        
        // Refresh server button
        binding.btnRefreshServer.setOnClickListener {
            if (serverRefreshInFlight) return@setOnClickListener
            refreshServerSilently()
        }
        
        // Delete server button
        binding.btnDeleteServer.setOnClickListener {
            showDeleteServerDialog()
        }
        
        // Add new server button
        binding.btnAddServer.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            intent.putExtra("add_new_server", true)
            startActivity(intent)
        }
        
        // Load current server info from ViewModel observer
    }

    private fun showDeleteSourceDialog(item: SourceStatusItem) {
        AlertDialog.Builder(this, R.style.AlertDialogTheme)
            .setTitle(getString(R.string.source_remove_title, item.name))
            .setMessage(R.string.source_remove_message)
            .setPositiveButton(R.string.source_remove) { dialog, _ ->
                dialog.dismiss()
                viewModel.removeSource(item.id)
                Toast.makeText(this, getString(R.string.source_removed), Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton(R.string.cancel) { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }
    
    private fun showDeleteServerDialog() {
        AlertDialog.Builder(this, R.style.AlertDialogTheme)
            .setTitle(R.string.settings_server_delete_confirm)
            .setMessage(R.string.settings_server_delete_message)
            .setPositiveButton(R.string.settings_server_delete) { dialog, _ ->
                dialog.dismiss()
                viewModel.logout()
                val intent = Intent(this, LoginActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
            .setNegativeButton(R.string.cancel) { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }

    private fun setupPlayerPanel() {
        // Player selection
        binding.optionPlayerSelection?.setOnClickListener {
            showPlayerSelectionDialog()
        }
        
        binding.optionExternalPlayer.setOnClickListener {
            showExternalPlayerInfo()
        }
        
        // Buffer size selection
        binding.optionBufferSize?.setOnClickListener {
            showBufferSizeDialog()
        }
        
        // Playback profile selection
        binding.optionPlaybackProfile.setOnClickListener {
            showPlaybackProfileDialog()
        }

        binding.optionHardwareAccel.setOnClickListener {
            binding.switchHardwareAccel.toggle()
        }
        binding.switchHardwareAccel.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch {
                playerPreferences.setHardwareAcceleration(isChecked)
            }
        }
        
        // Live preview toggle
        binding.optionLivePreview.setOnClickListener {
            binding.switchLivePreview.toggle()
        }
        binding.switchLivePreview.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch {
                playerPreferences.setLivePreviewEnabled(isChecked)
            }
        }
        
        // PIP mode toggle
        binding.optionPipMode.setOnClickListener {
            binding.switchPipMode.toggle()
        }
        binding.switchPipMode.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch {
                playerPreferences.setPipModeEnabled(isChecked)
            }
        }
        
        // Load current player settings
        lifecycleScope.launch {
            playerPreferences.playerType.collect { type ->
                binding.tvPlayerValue?.text = playerPreferences.getPlayerName(type)
            }
        }
        
        lifecycleScope.launch {
            playerPreferences.bufferSize.collect { size ->
                binding.tvBufferValue?.text = playerPreferences.getBufferSizeName(size)
            }
        }
        
        lifecycleScope.launch {
            playerPreferences.playbackProfile.collect { profile ->
                binding.tvPlaybackProfileValue.text = getPlaybackProfileLabel(profile)
            }
        }

        lifecycleScope.launch {
            playerPreferences.hardwareAcceleration.collect { enabled ->
                binding.switchHardwareAccel.isChecked = enabled
            }
        }

        lifecycleScope.launch {
            playerPreferences.livePreviewEnabled.collect { enabled ->
                binding.switchLivePreview.isChecked = enabled
            }
        }
        
        lifecycleScope.launch {
            playerPreferences.pipModeEnabled.collect { enabled ->
                binding.switchPipMode.isChecked = enabled
            }
        }
        
        // Show installed external players
        updateExternalPlayerInfo()
    }

    private fun showPlaybackProfileDialog() {
        val profiles = arrayOf(
            getString(R.string.playback_profile_balanced),
            getString(R.string.playback_profile_performance),
            getString(R.string.playback_profile_quality)
        )
        val values = arrayOf(
            PlayerPreferences.PLAYBACK_PROFILE_BALANCED,
            PlayerPreferences.PLAYBACK_PROFILE_PERFORMANCE,
            PlayerPreferences.PLAYBACK_PROFILE_QUALITY
        )
        
        lifecycleScope.launch {
            val currentValue = playerPreferences.playbackProfile.first()
            val currentIndex = values.indexOf(currentValue).coerceAtLeast(0)
            
            val dialog = AlertDialog.Builder(this@SettingsActivity, R.style.AlertDialogTheme)
                .setTitle(R.string.settings_player_playback_profile)
                .setSingleChoiceItems(profiles, currentIndex) { d, which ->
                    lifecycleScope.launch {
                        playerPreferences.setPlaybackProfile(values[which])
                    }
                    d.dismiss()
                }
                .setNegativeButton(R.string.cancel) { d, _ -> d.dismiss() }
                .create()
            dialog.setOnShowListener { applyDialogListFocusStyle(dialog) }
            dialog.show()
        }
    }
    
    private fun getPlaybackProfileLabel(profile: Int): String {
        return when (profile) {
            PlayerPreferences.PLAYBACK_PROFILE_BALANCED -> getString(R.string.playback_profile_balanced)
            PlayerPreferences.PLAYBACK_PROFILE_PERFORMANCE -> getString(R.string.playback_profile_performance)
            PlayerPreferences.PLAYBACK_PROFILE_QUALITY -> getString(R.string.playback_profile_quality)
            else -> getString(R.string.playback_profile_balanced)
        }
    }
    
    private fun showPlayerSelectionDialog() {
        val playerOptions = listOf(
            Pair(playerPreferences.getPlayerName(PlayerPreferences.PLAYER_INTERNAL_VLC), PlayerPreferences.PLAYER_INTERNAL_VLC),
            Pair(playerPreferences.getPlayerName(PlayerPreferences.PLAYER_INTERNAL_EXOPLAYER), PlayerPreferences.PLAYER_INTERNAL_EXOPLAYER),
            Pair(playerPreferences.getPlayerName(PlayerPreferences.PLAYER_MX_PLAYER), PlayerPreferences.PLAYER_MX_PLAYER),
            Pair(playerPreferences.getPlayerName(PlayerPreferences.PLAYER_VLC_EXTERNAL), PlayerPreferences.PLAYER_VLC_EXTERNAL),
            Pair(playerPreferences.getPlayerName(PlayerPreferences.PLAYER_JUST_PLAYER), PlayerPreferences.PLAYER_JUST_PLAYER),
            Pair(playerPreferences.getPlayerName(PlayerPreferences.PLAYER_SYSTEM_DEFAULT), PlayerPreferences.PLAYER_SYSTEM_DEFAULT)
        )
        val displayNames = playerOptions.map { it.first }.toTypedArray()

        lifecycleScope.launch {
            val currentType = playerPreferences.playerType.first()
            val currentIndex = playerOptions.indexOfFirst { it.second == currentType }.coerceAtLeast(0)

            val dialog = AlertDialog.Builder(this@SettingsActivity, R.style.AlertDialogTheme)
                .setTitle(R.string.settings_player_selection)
                .setSingleChoiceItems(displayNames, currentIndex) { d, which ->
                    lifecycleScope.launch {
                        playerPreferences.setPlayerType(playerOptions[which].second)
                    }
                    d.dismiss()
                }
                .setNegativeButton(R.string.cancel) { d, _ -> d.dismiss() }
                .create()
            dialog.setOnShowListener { applyDialogListFocusStyle(dialog) }
            dialog.show()
        }
    }
    
    private fun showBufferSizeDialog() {
        val sizes = arrayOf("Low (1s)", "Medium (2s)", "High (4s)", "Very High (8s)")
        val values = arrayOf(
            PlayerPreferences.BUFFER_LOW,
            PlayerPreferences.BUFFER_MEDIUM,
            PlayerPreferences.BUFFER_HIGH,
            PlayerPreferences.BUFFER_VERY_HIGH
        )
        
        lifecycleScope.launch {
            val currentSize = playerPreferences.bufferSize.first()
            val currentIndex = values.indexOf(currentSize).coerceAtLeast(0)
            
            val dialog = AlertDialog.Builder(this@SettingsActivity, R.style.AlertDialogTheme)
                .setTitle(R.string.settings_player_buffer)
                .setSingleChoiceItems(sizes, currentIndex) { d, which ->
                    lifecycleScope.launch {
                        playerPreferences.setBufferSize(values[which])
                    }
                    d.dismiss()
                }
                .setNegativeButton(R.string.cancel) { d, _ -> d.dismiss() }
                .create()
            dialog.setOnShowListener { applyDialogListFocusStyle(dialog) }
            dialog.show()
        }
    }
    
    /** Apply visible focus style to AlertDialog list (Player, Buffer size, etc.) for TV */
    private fun applyDialogListFocusStyle(dialog: AlertDialog) {
        dialog.listView?.let { listView ->
            ContextCompat.getDrawable(this, R.drawable.selector_dialog_list_item)?.let {
                listView.selector = it
            }
            listView.setDrawSelectorOnTop(true)
            listView.setPadding(20, 16, 20, 16)
        }
    }

    private fun showExternalPlayerInfo() {
        val installed = playerPreferences.getInstalledPlayers()
        if (installed.isEmpty()) {
            Toast.makeText(this, getString(R.string.settings_no_external_players), Toast.LENGTH_SHORT).show()
        } else {
            val names = installed.joinToString(", ") { it.name }
            Toast.makeText(this, "Installed: $names", Toast.LENGTH_LONG).show()
        }
    }
    
    private fun updateExternalPlayerInfo() {
        val installed = playerPreferences.getInstalledPlayers()
        binding.tvExternalPlayerValue.text = if (installed.isEmpty()) {
            getString(R.string.settings_none_installed)
        } else {
            installed.joinToString(", ") { it.name }
        }
    }

    private fun setupParentalPanel() {
        binding.optionParentalEnabled.setOnClickListener {
            binding.switchParentalEnabled.toggle()
        }

        binding.switchParentalEnabled.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) {
                showPinDialog(PinAction.ENABLE)
            } else {
                showPinDialog(PinAction.DISABLE)
            }
        }

        binding.optionSetPin.setOnClickListener {
            showPinDialog(PinAction.CHANGE)
        }

        binding.optionLockAdult.setOnClickListener {
            binding.switchLockAdult.toggle()
        }

        binding.switchLockAdult.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch {
                parentalLockManager.setAdultContentLocked(isChecked)
            }
        }

        // Load initial states
        lifecycleScope.launch {
            binding.switchParentalEnabled.isChecked = parentalLockManager.isParentalEnabled.first()
            binding.switchLockAdult.isChecked = parentalLockManager.isAdultContentLocked.first()
            refreshParentalBlockedSummary()
        }
    }

    private fun refreshParentalBlockedSummary() {
        lifecycleScope.launch {
            val serverId = viewModel.activeServer.value?.id
            val count = parentalLockManager.blockedContentCount(serverId)
            binding.tvParentalBlockedSummary.text = getString(R.string.parental_blocked_count, count)
        }
    }

    private fun setupInterfacePanel() {
        binding.optionBackground.setOnClickListener {
            showBackgroundThemeDialog()
        }

        // Load current theme
        lifecycleScope.launch {
            val currentTheme = backgroundManager.currentTheme.first()
            binding.tvBackgroundValue.text = backgroundManager.getThemeName(currentTheme)
        }

        // Animation toggle
        lifecycleScope.launch {
            backgroundManager.animationEnabled.collect { enabled ->
                binding.switchAnimationEnabled.isChecked = enabled
            }
        }
        
        binding.optionAnimationToggle.setOnClickListener {
            binding.switchAnimationEnabled.toggle()
        }

        // TV remote support: allow LEFT/RIGHT to toggle quickly
        binding.optionAnimationToggle.setOnKeyListener { _, keyCode, event ->
            if (event.action != KeyEvent.ACTION_UP) return@setOnKeyListener false
            when (keyCode) {
                KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> {
                    binding.switchAnimationEnabled.toggle()
                    true
                }
                KeyEvent.KEYCODE_DPAD_LEFT -> {
                    if (binding.switchAnimationEnabled.isChecked) {
                        binding.switchAnimationEnabled.isChecked = false
                        true
                    } else false
                }
                KeyEvent.KEYCODE_DPAD_RIGHT -> {
                    if (!binding.switchAnimationEnabled.isChecked) {
                        binding.switchAnimationEnabled.isChecked = true
                        true
                    } else false
                }
                else -> false
            }
        }
        
        binding.switchAnimationEnabled.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch {
                val allowed = isChecked && com.mo.moplayer.util.DevicePerformance.allowAnimatedBackground(this@SettingsActivity)
                tvUiPreferences.setAnimationsEnabled(allowed)
                backgroundManager.setAnimationEnabled(allowed)
                binding.animatedBackground.setAnimationEnabled(allowed)
                if (!allowed && isChecked) {
                    binding.switchAnimationEnabled.isChecked = false
                    Toast.makeText(this@SettingsActivity, "Animations reduced automatically for this device.", Toast.LENGTH_SHORT).show()
                }
            }
        }

        lifecycleScope.launch {
            tvUiPreferences.posterSize.collect { size ->
                binding.tvPosterSizeValue.text = size.name.lowercase().replaceFirstChar { it.titlecase(Locale.getDefault()) }
            }
        }

        lifecycleScope.launch {
            tvUiPreferences.layoutStyle.collect { style ->
                binding.tvLayoutStyleValue.text = if (style == com.mo.moplayer.util.TvUiPreferences.LayoutStyle.ROWS) "Rows" else "Grid"
            }
        }

        lifecycleScope.launch {
            tvUiPreferences.backgroundBehavior.collect { behavior ->
                binding.tvBackgroundBehaviorValue.text = when (behavior) {
                    com.mo.moplayer.util.TvUiPreferences.BackgroundBehavior.STATIC ->
                        getString(R.string.settings_background_behavior_static)
                    com.mo.moplayer.util.TvUiPreferences.BackgroundBehavior.FOLLOW_PREVIEW ->
                        getString(R.string.settings_background_behavior_follow_preview)
                }
            }
        }

        binding.optionPosterSize.setOnClickListener {
            showPosterSizeDialog()
        }

        binding.optionLayoutStyle.setOnClickListener {
            showLayoutStyleDialog()
        }

        binding.optionBackgroundBehavior.setOnClickListener {
            showBackgroundBehaviorDialog()
        }

        // Setup color chip click handlers
        setupColorChips()

        // Setup custom image input
        setupCustomImageInput()
        setupAutoCityWallpaperControls()
        
        // Setup language selection
        setupLanguageSelection()
        
        // Setup football widget settings
        setupFootballWidgetSettings()
        // Setup weather settings
        setupWeatherSettings()
    }

    private fun setupAutoCityWallpaperControls() {
        lifecycleScope.launch {
            backgroundManager.autoCityWallpaperEnabled.collect { enabled ->
                binding.switchAutoCityWallpaper.isChecked = enabled
            }
        }

        lifecycleScope.launch {
            backgroundManager.cityWallpaperState.collect { state ->
                binding.tvCityWallpaperStatus.text = when {
                    state == null -> getString(R.string.settings_city_wallpaper_status_idle)
                    state.status == "ready" && !state.cityName.isBlank() ->
                        getString(R.string.settings_city_wallpaper_status_ready, state.cityName, state.source)
                    state.status == "disabled" ->
                        getString(R.string.settings_city_wallpaper_status_disabled)
                    else -> getString(R.string.settings_city_wallpaper_status_fallback)
                }
            }
        }

        binding.optionAutoCityWallpaper.setOnClickListener {
            binding.switchAutoCityWallpaper.toggle()
        }
        val useCityWallpaperClick = View.OnClickListener {
            lifecycleScope.launch {
                backgroundManager.setAutoCityWallpaperEnabled(true)
                backgroundManager.setTheme(BackgroundManager.THEME_CITY_WALLPAPER)
                binding.switchAutoCityWallpaper.isChecked = true
                binding.tvBackgroundValue.text = backgroundManager.getThemeName(BackgroundManager.THEME_CITY_WALLPAPER)
                binding.tvCityWallpaperStatus.setText(R.string.settings_weather_status_updating)
                val result = backgroundManager.refreshCityWallpaper(force = true)
                if (result.isSuccess) {
                    binding.animatedBackground.reloadCityWallpaperIfAvailable()
                }
                binding.tvCityWallpaperStatus.text = result.fold(
                    onSuccess = { state -> getString(R.string.settings_city_wallpaper_status_ready, state.cityName, state.source) },
                    onFailure = { error -> getString(R.string.settings_update_failed, error.message ?: "") }
                )
                applyBackgroundSelectionImmediately(BackgroundManager.THEME_CITY_WALLPAPER)
            }
        }
        binding.btnUseCityWallpaperTop.setOnClickListener(useCityWallpaperClick)
        binding.btnUseCityWallpaper.setOnClickListener(useCityWallpaperClick)
        binding.btnOpenWeatherLabTop.setOnClickListener {
            showWeatherDebugDialog()
        }

        binding.switchAutoCityWallpaper.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch {
                backgroundManager.setAutoCityWallpaperEnabled(isChecked)
                if (isChecked) {
                    backgroundManager.refreshCityWallpaper(force = false)
                } else {
                    backgroundManager.clearCityWallpaper()
                }
            }
        }
    }

    private fun setupFootballWidgetSettings() {
        lifecycleScope.launch {
            val enabled = footballService.footballWidgetEnabled.first()
            binding.switchFootballWidgetEnabled.isChecked = enabled
        }
        binding.optionFootballWidget.setOnClickListener {
            binding.switchFootballWidgetEnabled.toggle()
        }
        binding.switchFootballWidgetEnabled.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch {
                footballService.setFootballWidgetEnabled(isChecked)
            }
        }
    }
    
    private fun setupWeatherSettings() {
        // Weather effects quality spinner
        val qualityOptions = listOf(
            getString(R.string.settings_weather_effects_off),
            getString(R.string.settings_weather_effects_low),
            getString(R.string.settings_weather_effects_medium),
            getString(R.string.settings_weather_effects_high)
        )
        val qualityAdapter = ArrayAdapter(
            this,
            R.layout.item_spinner_compact,
            qualityOptions
        )
        qualityAdapter.setDropDownViewResource(R.layout.item_spinner_dropdown_premium)
        binding.spinnerWeatherEffectsQuality.adapter = qualityAdapter
        binding.spinnerWeatherEffectsQuality.onItemSelectedListener = object : android.widget.AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: android.widget.AdapterView<*>?, view: android.view.View?, position: Int, id: Long) {
                lifecycleScope.launch {
                    weatherService.setWeatherEffectsQuality(position)
                }
            }
            override fun onNothingSelected(parent: android.widget.AdapterView<*>?) {}
        }

        // Load current weather settings
        lifecycleScope.launch {
            val enabled = weatherService.weatherEnabled.first()
            binding.switchWeatherEnabled.isChecked = enabled

            val quality = weatherService.weatherEffectsQuality.first()
            binding.spinnerWeatherEffectsQuality.setSelection(quality.coerceIn(0, 3))

            val reduceMotion = weatherService.weatherReduceMotion.first()
            binding.switchWeatherReduceMotion.isChecked = reduceMotion

            val disableLightning = weatherService.weatherDisableLightning.first()
            binding.switchWeatherDisableLightning.isChecked = disableLightning
            
            updateDetectedLocation()
        }
        
        // Weather enable/disable switch
        binding.switchWeatherEnabled.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch {
                weatherService.setWeatherEnabled(isChecked)
                if (isChecked) {
                    Toast.makeText(this@SettingsActivity, getString(R.string.settings_weather_enabled), Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@SettingsActivity, getString(R.string.settings_weather_disabled), Toast.LENGTH_SHORT).show()
                }
            }
        }

        binding.optionWeatherEnabled.setOnClickListener {
            binding.switchWeatherEnabled.toggle()
        }

        binding.optionWeatherLab.setOnClickListener {
            showWeatherDebugDialog()
        }

        binding.optionWeatherEffectsQuality.setOnClickListener {
            binding.spinnerWeatherEffectsQuality.performClick()
        }

        // Reduce motion switch
        binding.switchWeatherReduceMotion.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch {
                weatherService.setWeatherReduceMotion(isChecked)
            }
        }
        binding.optionWeatherReduceMotion.setOnClickListener {
            binding.switchWeatherReduceMotion.toggle()
        }

        // Disable lightning switch
        binding.switchWeatherDisableLightning.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch {
                weatherService.setWeatherDisableLightning(isChecked)
            }
        }
        binding.optionWeatherDisableLightning.setOnClickListener {
            binding.switchWeatherDisableLightning.toggle()
        }

        binding.optionDetectedLocation.setOnClickListener {
            refreshWeatherAndLocation()
        }
        
        // Refresh location button
        binding.btnRefreshWeatherLocation.setOnClickListener {
            refreshWeatherAndLocation()
        }
    }

    private fun showBackgroundThemeDialog() {
        val themes = backgroundManager.getAvailableThemes()
        lifecycleScope.launch {
            val currentTheme = backgroundManager.currentTheme.first()
            val currentIndex = themes.indexOfFirst { it.first == currentTheme }.coerceAtLeast(0)
            val labels = themes.map { it.second }.toTypedArray()

            val dialog = AlertDialog.Builder(this@SettingsActivity, R.style.AlertDialogTheme)
                .setTitle(R.string.settings_ui_background)
                .setSingleChoiceItems(labels, currentIndex) { d, which ->
                    lifecycleScope.launch {
                        val selected = themes[which]
                        backgroundManager.setTheme(selected.first)
                        binding.tvBackgroundValue.text = selected.second
                        applyBackgroundSelectionImmediately(selected.first)
                        if (selected.first == BackgroundManager.THEME_CITY_WALLPAPER) {
                            backgroundManager.setAutoCityWallpaperEnabled(true)
                            binding.switchAutoCityWallpaper.isChecked = true
                            if (backgroundManager.refreshCityWallpaper(force = true).isSuccess) {
                                binding.animatedBackground.reloadCityWallpaperIfAvailable()
                            }
                        }
                    }
                    d.dismiss()
                }
                .setNegativeButton(R.string.cancel) { d, _ -> d.dismiss() }
                .create()
            dialog.setOnShowListener { applyDialogListFocusStyle(dialog) }
            dialog.show()
        }
    }

    private fun applyBackgroundSelectionImmediately(theme: Int) {
        val background = binding.animatedBackground
        if (theme == BackgroundManager.THEME_CUSTOM_IMAGE && backgroundManager.hasCustomImage()) {
            background.loadCustomImageFromFile(backgroundManager.getCustomImageFile().absolutePath)
        } else {
            background.setCustomImage(null)
            background.setCurrentTheme(theme)
        }
        val enabled = binding.switchAnimationEnabled.isChecked &&
            com.mo.moplayer.util.DevicePerformance.allowAnimatedBackground(this)
        background.setAnimationEnabled(enabled)
        if (enabled) background.resumeAnimation() else background.pauseAnimation()
    }

    private fun showWeatherDebugDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_weather_debug, null)

        val switchEnabled = dialogView.findViewById<androidx.appcompat.widget.SwitchCompat>(R.id.switchWeatherDebugEnabled)
        val spinnerCategory = dialogView.findViewById<Spinner>(R.id.spinnerWeatherCategory)
        val switchIsDay = dialogView.findViewById<androidx.appcompat.widget.SwitchCompat>(R.id.switchWeatherDebugIsDay)

        val tvTempLabel = dialogView.findViewById<TextView>(R.id.tvTempLabel)
        val seekTemp = dialogView.findViewById<SeekBar>(R.id.seekTemp)

        val tvWindLabel = dialogView.findViewById<TextView>(R.id.tvWindLabel)
        val seekWind = dialogView.findViewById<SeekBar>(R.id.seekWind)

        val tvWindDirLabel = dialogView.findViewById<TextView>(R.id.tvWindDirLabel)
        val seekWindDir = dialogView.findViewById<SeekBar>(R.id.seekWindDir)

        val tvHumidityLabel = dialogView.findViewById<TextView>(R.id.tvHumidityLabel)
        val seekHumidity = dialogView.findViewById<SeekBar>(R.id.seekHumidity)

        val tvCloudLabel = dialogView.findViewById<TextView>(R.id.tvCloudLabel)
        val seekCloud = dialogView.findViewById<SeekBar>(R.id.seekCloud)

        val tvPrecipLabel = dialogView.findViewById<TextView>(R.id.tvPrecipLabel)
        val seekPrecip = dialogView.findViewById<SeekBar>(R.id.seekPrecip)
        val btnReset = dialogView.findViewById<android.widget.Button>(R.id.btnWeatherDebugReset)
        val btnCancel = dialogView.findViewById<android.widget.Button>(R.id.btnWeatherDebugCancel)
        val btnApply = dialogView.findViewById<android.widget.Button>(R.id.btnWeatherDebugApply)

        val categories = WeatherService.WeatherCategory.entries.map { it.name }
        spinnerCategory.adapter = ArrayAdapter(this, R.layout.item_spinner_compact, categories).apply {
            setDropDownViewResource(R.layout.item_spinner_dropdown_premium)
        }

        fun updateLabels() {
            val tempC = seekTemp.progress - 40
            tvTempLabel.text = "${getString(R.string.weather_debug_temp)}: ${tempC}°"

            tvWindLabel.text = "${getString(R.string.weather_debug_wind)}: ${seekWind.progress}"
            tvWindDirLabel.text = "${getString(R.string.weather_debug_wind_dir)}: ${seekWindDir.progress}"
            tvHumidityLabel.text = "${getString(R.string.weather_debug_humidity)}: ${seekHumidity.progress}"
            tvCloudLabel.text = "${getString(R.string.weather_debug_cloud)}: ${seekCloud.progress}"
            tvPrecipLabel.text = "${getString(R.string.weather_debug_precip)}: ${seekPrecip.progress / 10.0}"
        }

        val listener = object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) = updateLabels()
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        }
        seekTemp.setOnSeekBarChangeListener(listener)
        seekWind.setOnSeekBarChangeListener(listener)
        seekWindDir.setOnSeekBarChangeListener(listener)
        seekHumidity.setOnSeekBarChangeListener(listener)
        seekCloud.setOnSeekBarChangeListener(listener)
        seekPrecip.setOnSeekBarChangeListener(listener)
        mapWeatherDebugFocus(
            switchEnabled,
            spinnerCategory,
            switchIsDay,
            seekTemp,
            seekWind,
            seekWindDir,
            seekHumidity,
            seekCloud,
            seekPrecip,
            btnReset,
            btnCancel,
            btnApply
        )

        // Prefill from current active weather (cached or debug), and current debug enable state.
        lifecycleScope.launch {
            val debugEnabled = weatherService.weatherDebugEnabled.first()
            switchEnabled.isChecked = debugEnabled

            val active = weatherService.cachedWeather.first()
            if (active != null) {
                val idx = categories.indexOf(weatherService.getWeatherCategory(active.conditionCode).name).coerceAtLeast(0)
                spinnerCategory.setSelection(idx)
                switchIsDay.isChecked = active.isDay

                seekTemp.progress = (active.temperature + 40).coerceIn(0, 80)
                seekWind.progress = active.windSpeed.toInt().coerceIn(0, 120)
                seekWindDir.progress = active.windDegree.coerceIn(0, 360)
                seekHumidity.progress = active.humidity.coerceIn(0, 100)
                seekCloud.progress = active.cloud.coerceIn(0, 100)
                seekPrecip.progress = (active.precipMm * 10).toInt().coerceIn(0, 50)
            }
            updateLabels()
        }

        fun applyWeatherDebug(dialog: AlertDialog) {
            lifecycleScope.launch {
                val enabled = switchEnabled.isChecked
                if (!enabled) {
                    weatherService.setWeatherDebugEnabled(false)
                    Toast.makeText(this@SettingsActivity, getString(R.string.weather_debug_disabled), Toast.LENGTH_SHORT).show()
                    dialog.dismiss()
                    return@launch
                }

                val categoryName = spinnerCategory.selectedItem as String
                val category = runCatching { WeatherService.WeatherCategory.valueOf(categoryName) }
                    .getOrDefault(WeatherService.WeatherCategory.CLEAR)

                val tempC = seekTemp.progress - 40
                val windKph = seekWind.progress.toDouble()
                val windDegree = seekWindDir.progress
                val humidity = seekHumidity.progress
                val cloud = seekCloud.progress
                val precipMm = seekPrecip.progress / 10.0

                weatherService.applyWeatherDebugOverride(
                    WeatherService.WeatherDebugOverride(
                        category = category,
                        isDay = switchIsDay.isChecked,
                        temperature = tempC,
                        feelsLike = tempC,
                        humidity = humidity,
                        windSpeedKph = windKph,
                        windDegree = windDegree,
                        gustSpeedKph = (windKph * 1.4).coerceAtMost(160.0),
                        precipMm = precipMm,
                        cloud = cloud
                    )
                )

                Toast.makeText(this@SettingsActivity, getString(R.string.weather_debug_applied), Toast.LENGTH_SHORT).show()
                dialog.dismiss()
            }
        }

        fun resetWeatherDebug(dialog: AlertDialog) {
            lifecycleScope.launch {
                weatherService.clearWeatherDebugOverride()
                Toast.makeText(this@SettingsActivity, getString(R.string.weather_debug_reset_done), Toast.LENGTH_SHORT).show()
                dialog.dismiss()
            }
        }

        val dialog = AlertDialog.Builder(this, R.style.AlertDialogTheme)
            .setView(dialogView)
            .create()

        dialog.setOnShowListener {
            dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)
            dialog.window?.setLayout(
                (resources.displayMetrics.widthPixels * 0.78f).toInt(),
                android.view.WindowManager.LayoutParams.WRAP_CONTENT
            )
            btnApply.setOnClickListener { applyWeatherDebug(dialog) }
            btnReset.setOnClickListener { resetWeatherDebug(dialog) }
            btnCancel.setOnClickListener { dialog.dismiss() }
            switchEnabled.requestFocus()
        }

        dialog.show()
    }

    private fun mapWeatherDebugFocus(vararg views: View) {
        views.forEachIndexed { index, view ->
            view.isFocusable = true
            view.isFocusableInTouchMode = false
            view.nextFocusUpId = views.getOrNull(index - 1)?.id ?: view.id
            view.nextFocusDownId = views.getOrNull(index + 1)?.id ?: view.id
            view.setOnFocusChangeListener { focusedView, hasFocus ->
                focusedView.animate()
                    .scaleX(if (hasFocus) 1.015f else 1f)
                    .scaleY(if (hasFocus) 1.015f else 1f)
                    .setDuration(120L)
                    .start()
            }
        }
    }
    
    private fun updateDetectedLocation() {
        lifecycleScope.launch {
            try {
                val location = locationService.getCachedLocation()
                if (location != null) {
                    binding.tvDetectedLocation.text = location.getDisplayName()
                } else {
                    binding.tvDetectedLocation.text = "Detecting location..."
                    // Try to fetch location
                    val result = locationService.fetchLocation()
                    result.onSuccess { loc ->
                        binding.tvDetectedLocation.text = loc.getDisplayName()
                    }.onFailure {
                        binding.tvDetectedLocation.text = "Location unavailable"
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                binding.tvDetectedLocation.text = "Error detecting location"
            }
        }
    }
    
    private fun refreshWeatherAndLocation() {
        lifecycleScope.launch {
            try {
                binding.tvWeatherStatus.visibility = View.VISIBLE
                binding.tvWeatherStatus.text = getString(R.string.settings_weather_status_updating)
                binding.tvWeatherStatus.setTextColor(ContextCompat.getColor(this@SettingsActivity, com.mo.moplayer.R.color.htc_text_tertiary))
                
                // Force refresh location
                val locationResult = locationService.fetchLocation(forceRefresh = true)
                locationResult.onSuccess { location ->
                    binding.tvDetectedLocation.text = location.getDisplayName()
                    
                    // Force refresh weather
                    val weatherResult = weatherService.fetchWeather(forceRefresh = true)
                    weatherResult.onSuccess {
                        backgroundManager.refreshCityWallpaper(force = true)
                        binding.tvWeatherStatus.text = getString(R.string.settings_weather_status_success)
                        binding.tvWeatherStatus.setTextColor(ContextCompat.getColor(this@SettingsActivity, com.mo.moplayer.R.color.htc_accent_green))
                    }.onFailure { error ->
                        binding.tvWeatherStatus.text = getString(R.string.settings_weather_status_failed, error.message ?: "")
                        binding.tvWeatherStatus.setTextColor(ContextCompat.getColor(this@SettingsActivity, android.R.color.holo_red_light))
                    }
                }.onFailure { error ->
                    binding.tvWeatherStatus.text = getString(R.string.settings_location_status_failed, error.message ?: "")
                    binding.tvWeatherStatus.setTextColor(ContextCompat.getColor(this@SettingsActivity, android.R.color.holo_red_light))
                }
            } catch (e: Exception) {
                e.printStackTrace()
                binding.tvWeatherStatus.text = getString(R.string.settings_update_failed, e.message ?: "")
                binding.tvWeatherStatus.setTextColor(ContextCompat.getColor(this@SettingsActivity, android.R.color.holo_red_light))
            }
        }
    }
    
    private fun setupLanguageSelection() {
        // Load current language
        lifecycleScope.launch {
            val currentLocale = java.util.Locale.getDefault().language
            binding.tvLanguageValue.text = when (currentLocale) {
                "ar" -> getString(R.string.language_arabic)
                else -> getString(R.string.language_english)
            }
        }
        
        binding.optionLanguage.setOnClickListener {
            showLanguageDialog()
        }
    }
    
    private fun showLanguageDialog() {
        val languages = arrayOf(
            getString(R.string.language_english),
            getString(R.string.language_arabic)
        )
        val languageCodes = arrayOf("en", "ar")
        
        val currentLocale = java.util.Locale.getDefault().language
        val currentIndex = if (currentLocale == "ar") 1 else 0
        
        android.app.AlertDialog.Builder(this, R.style.AlertDialogTheme)
            .setTitle(R.string.settings_language)
            .setSingleChoiceItems(languages, currentIndex) { dialog, which ->
                val selectedCode = languageCodes[which]
                setAppLocale(selectedCode)
                binding.tvLanguageValue.text = languages[which]
                dialog.dismiss()
                
                // Recreate activity to apply language change
                recreate()
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }
    
    private fun setAppLocale(languageCode: String) {
        val locale = Locale.forLanguageTag(languageCode)
        java.util.Locale.setDefault(locale)
        
        val config = resources.configuration
        config.setLocale(locale)
        config.setLayoutDirection(locale)
        
        // Save preference
        getSharedPreferences("settings", MODE_PRIVATE)
            .edit()
            .putString("language", languageCode)
            .apply()
        
        @Suppress("DEPRECATION")
        resources.updateConfiguration(config, resources.displayMetrics)
    }

    private fun setupColorChips() {
        val colorChips = mapOf(
            binding.colorChipGreen to Pair(ThemeManager.AppThemeId.HTC_ORANGE, ThemeManager.AccentId.GREEN),
            binding.colorChipCyan to Pair(ThemeManager.AppThemeId.LIQUID_BLUE, ThemeManager.AccentId.CYAN),
            binding.colorChipPurple to Pair(ThemeManager.AppThemeId.LIQUID_BLUE, ThemeManager.AccentId.PURPLE),
            binding.colorChipOrange to Pair(ThemeManager.AppThemeId.HTC_ORANGE, ThemeManager.AccentId.ORANGE),
            binding.colorChipGold to Pair(ThemeManager.AppThemeId.HTC_ORANGE, ThemeManager.AccentId.GOLD),
            binding.colorChipPink to Pair(ThemeManager.AppThemeId.LIQUID_BLUE, ThemeManager.AccentId.PINK),
            binding.colorChipBlue to Pair(ThemeManager.AppThemeId.LIQUID_BLUE, ThemeManager.AccentId.BLUE),
            binding.colorChipWhite to Pair(ThemeManager.AppThemeId.LIQUID_BLUE, ThemeManager.AccentId.WHITE)
        )
        accentChipViews.clear()
        accentChipViews.putAll(colorChips)

        colorChips.forEach { (chip, selection) ->
            chip.isClickable = true
            chip.isFocusable = true
            chip.setOnFocusChangeListener { view, hasFocus ->
                updateAccentChipVisual(view, selection.second, hasFocus)
            }
            chip.setOnClickListener {
                applyThemeColor(selection.first, selection.second)
            }
        }
        FocusMapRegistry.mapHorizontalStrip(colorChips.keys.toList(), wrap = false, upTarget = binding.optionAnimationToggle, downTarget = binding.etCustomImageUrl)
        
        lifecycleScope.launch {
            themeManager.currentAccentId.collect { selectedAccent ->
                updateAllAccentChipVisuals(selectedAccent)
            }
        }
        lifecycleScope.launch {
            themeManager.currentAccentColor.collect { color ->
                applyThemeToViews(color)
            }
        }
    }
    
    private fun applyThemeColor(themeId: ThemeManager.AppThemeId, accentId: ThemeManager.AccentId) {
        lifecycleScope.launch {
            themeManager.setThemeAndAccent(themeId, accentId)
            val accentColor = themeManager.currentAccentColor.value
             
            backgroundManager.setParticleColor(accentColor)
            val glowColor = Color.argb(40, Color.red(accentColor), Color.green(accentColor), Color.blue(accentColor))
            backgroundManager.setGlowColor(glowColor)
             
            binding.animatedBackground.setParticleColor(accentColor)
            binding.animatedBackground.setGlowColor(glowColor)
            applyThemeToViews(accentColor)
            updateAllAccentChipVisuals(accentId)
             
            val themeName = themeManager.getThemeDisplayName(themeId)
            Toast.makeText(
                this@SettingsActivity,
                getString(R.string.theme_applied_format, themeName),
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    private val imagePickerLauncher = registerForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.OpenDocument()
    ) { uri: android.net.Uri? ->
        uri?.let { 
            // Take persistable URI permission for long-term access
            try {
                contentResolver.takePersistableUriPermission(
                    it,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
                handleSelectedImage(it)
            } catch (e: Exception) {
                e.printStackTrace()
                Toast.makeText(this, getString(R.string.settings_failed_access_image, e.message ?: ""), Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    // Fallback picker using GetContent (works on more devices)
    private val imagePickerLauncherFallback = registerForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.GetContent()
    ) { uri: android.net.Uri? ->
        uri?.let { handleSelectedImage(it) }
    }

    private fun handleSelectedImage(uri: android.net.Uri) {
        lifecycleScope.launch {
            try {
                Toast.makeText(this@SettingsActivity, getString(R.string.settings_image_loading), Toast.LENGTH_SHORT).show()
                
                val success = withContext(Dispatchers.IO) {
                    // Copy the image to app internal storage
                    val inputStream = contentResolver.openInputStream(uri) ?: return@withContext false
                    val file = java.io.File(filesDir, "custom_background.jpg")
                    inputStream.use { input ->
                        file.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }
                    
                    // Apply the custom image (BackgroundManager will downscale + persist)
                    backgroundManager.setCustomImageFromPath(file.absolutePath)
                }
                if (success) {
                    Toast.makeText(this@SettingsActivity, getString(R.string.settings_image_success), Toast.LENGTH_SHORT).show()
                    binding.tvBackgroundValue.text = getString(R.string.theme_custom_image)

                    // Apply the custom image to the animated background immediately (no need to restart the app)
                    val customImageFile = backgroundManager.getCustomImageFile()
                    if (customImageFile.exists()) {
                        binding.animatedBackground.loadCustomImageFromFile(customImageFile.absolutePath)
                    }
                } else {
                    Toast.makeText(this@SettingsActivity, getString(R.string.settings_image_failed), Toast.LENGTH_SHORT).show()
                }
            } catch (e: SecurityException) {
                e.printStackTrace()
                Toast.makeText(this@SettingsActivity, getString(R.string.settings_permission_denied, e.message ?: ""), Toast.LENGTH_SHORT).show()
            } catch (e: java.io.FileNotFoundException) {
                e.printStackTrace()
                Toast.makeText(this@SettingsActivity, getString(R.string.settings_image_file_not_found), Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                e.printStackTrace()
                Toast.makeText(this@SettingsActivity, getString(R.string.settings_error_loading_image, e.message ?: ""), Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setupCustomImageInput() {
        // Choose from device button
        binding.btnChooseLocalImage.setOnClickListener {
            openImagePickerWithFallback()
        }

        // Apply URL button
        binding.btnApplyImage.setOnClickListener {
            val imageUrl = binding.etCustomImageUrl.text.toString().trim()
            if (imageUrl.isEmpty()) {
                Toast.makeText(this, getString(R.string.settings_enter_image_url), Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
                Toast.makeText(this, getString(R.string.settings_enter_valid_url), Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            lifecycleScope.launch {
                Toast.makeText(this@SettingsActivity, getString(R.string.settings_image_loading), Toast.LENGTH_SHORT).show()
                val success = backgroundManager.setCustomImageFromUrl(imageUrl)
                if (success) {
                    Toast.makeText(this@SettingsActivity, getString(R.string.settings_image_success), Toast.LENGTH_SHORT).show()
                    binding.tvBackgroundValue.text = getString(R.string.theme_custom_image)
                    // Apply the custom image to the animated background immediately
                    val customImageFile = backgroundManager.getCustomImageFile()
                    if (customImageFile.exists()) {
                        binding.animatedBackground.loadCustomImageFromFile(customImageFile.absolutePath)
                    }
                } else {
                    Toast.makeText(this@SettingsActivity, getString(R.string.settings_image_failed), Toast.LENGTH_SHORT).show()
                }
            }
        }

        binding.btnClearImage.setOnClickListener {
            lifecycleScope.launch {
                backgroundManager.clearCustomImage()
                binding.etCustomImageUrl.text?.clear()
                binding.tvBackgroundValue.text = backgroundManager.getThemeName(BackgroundManager.THEME_SOLID)
                applyBackgroundSelectionImmediately(BackgroundManager.THEME_SOLID)
                Toast.makeText(this@SettingsActivity, getString(R.string.settings_image_cleared), Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun openImagePickerWithFallback() {
        // Try OpenDocument first (best option - persistent URI)
        try {
            imagePickerLauncher.launch(arrayOf("image/*"))
        } catch (e: android.content.ActivityNotFoundException) {
            // Fallback to GetContent if OpenDocument is not supported
            try {
                imagePickerLauncherFallback.launch("image/*")
            } catch (e2: android.content.ActivityNotFoundException) {
                // Final fallback: use Intent directly
                try {
                    val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                        type = "image/*"
                        addCategory(Intent.CATEGORY_OPENABLE)
                    }
                    val chooser = Intent.createChooser(intent, "Select Image")
                    @Suppress("DEPRECATION")
                    startActivityForResult(chooser, REQUEST_CODE_IMAGE_PICKER)
                } catch (e3: android.content.ActivityNotFoundException) {
                    Toast.makeText(
                        this,
                        getString(R.string.settings_no_image_picker_app),
                        Toast.LENGTH_LONG
                    ).show()
                } catch (e3: Exception) {
                    Toast.makeText(
                        this,
                        getString(R.string.settings_failed_open_image_picker, e3.message ?: ""),
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (e2: Exception) {
                Toast.makeText(
                    this,
                    getString(R.string.settings_failed_open_image_picker, e2.message ?: ""),
                    Toast.LENGTH_SHORT
                ).show()
            }
        } catch (e: Exception) {
            // Try fallback on any exception
            try {
                imagePickerLauncherFallback.launch("image/*")
            } catch (e2: Exception) {
                Toast.makeText(
                    this,
                    getString(R.string.settings_failed_open_image_picker, e2.message ?: ""),
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
    
    private fun setupUpdatePanel() {
        binding.tvInstalledVersion.text = getString(
            R.string.settings_update_version_value,
            BuildConfig.VERSION_NAME,
            BuildConfig.VERSION_CODE
        )
        binding.btnCheckAppUpdate.setOnClickListener {
            checkLatestAppUpdate(manual = true)
        }
        binding.btnInstallAppUpdate.setOnClickListener {
            val info = updateInfo
            if (info == null) {
                checkLatestAppUpdate(manual = true)
            } else {
                startSettingsUpdateDownload(info)
            }
        }
        binding.btnOpenAppDownload.setOnClickListener {
            updateRepository.openDownloadInBrowser(updateInfo ?: AppUpdateInfo())
        }
        renderUpdateCheckingState()
        checkLatestAppUpdate(manual = false)
    }

    private fun setupAboutPanel() {
        binding.tvAboutVersion.text = getString(
            R.string.settings_update_version_value,
            BuildConfig.VERSION_NAME,
            BuildConfig.VERSION_CODE
        )
        // WhatsApp button
        binding.btnWhatsApp?.setOnClickListener {
            openWhatsApp()
        }
        
        // Email button
        binding.btnEmail?.setOnClickListener {
            openEmail()
        }

        binding.btnWebsite?.setOnClickListener {
            openWebsite("https://moalfarras.space/apps/moplayer")
        }
    }

    private fun checkLatestAppUpdate(manual: Boolean) {
        if (updateDownloadInFlight || updateCheckInFlight) return
        updateCheckInFlight = true
        renderUpdateCheckingState()
        lifecycleScope.launch {
            runCatching { updateRepository.fetchUpdateInfo(forceRefresh = manual) }
                .onSuccess { info ->
                    updateInfo = info
                    renderUpdateInfo(info)
                }
                .onFailure { error ->
                    renderUpdateError(error.message ?: getString(R.string.error_generic))
                }
            updateCheckInFlight = false
            binding.btnCheckAppUpdate.isEnabled = true
            binding.btnInstallAppUpdate.isEnabled = updateInfo?.newerThanPublished == false
        }
    }

    private fun renderUpdateCheckingState() {
        binding.tvUpdateHeroStatus.setText(R.string.settings_app_update_checking)
        binding.tvUpdateHeroStatus.setTextColor(ContextCompat.getColor(this, R.color.cinematic_cyan))
        binding.tvAvailableVersion.text = getString(R.string.settings_update_available_unknown)
        binding.tvUpdateSize.text = getString(R.string.settings_update_size_unknown)
        binding.tvAppUpdateNotes.setText(R.string.settings_app_update_desc)
        binding.updateProgressContainer.visibility = View.GONE
        binding.btnCheckAppUpdate.isEnabled = false
        binding.btnInstallAppUpdate.isEnabled = false
    }

    private fun renderUpdateInfo(info: AppUpdateInfo) {
        binding.tvAvailableVersion.text = getString(
            R.string.settings_update_version_value,
            info.latestVersionName,
            info.latestVersionCode
        )
        binding.tvUpdateSize.text = info.apkSizeBytes?.let {
            getString(R.string.settings_update_size_value, formatFileSize(it))
        } ?: getString(R.string.settings_update_size_unknown)
        binding.tvAppUpdateNotes.text = info.releaseNotes.ifBlank {
            getString(R.string.settings_app_update_desc)
        }
        if (info.updateAvailable) {
            binding.tvUpdateHeroStatus.text = getString(
                R.string.settings_update_ready,
                info.latestVersionName
            )
            binding.tvUpdateHeroStatus.setTextColor(ContextCompat.getColor(this, R.color.cinematic_cyan))
            binding.btnInstallAppUpdate.setText(R.string.settings_app_update_install)
            binding.btnInstallAppUpdate.isEnabled = true
        } else if (info.newerThanPublished) {
            binding.tvUpdateHeroStatus.text = getString(
                R.string.settings_update_ahead_of_published,
                info.latestVersionName
            )
            binding.tvUpdateHeroStatus.setTextColor(ContextCompat.getColor(this, R.color.htc_warning))
            binding.btnInstallAppUpdate.setText(R.string.settings_update_published_older)
            binding.btnInstallAppUpdate.isEnabled = false
        } else {
            binding.tvUpdateHeroStatus.text = getString(
                R.string.settings_app_update_current,
                info.latestVersionName
            )
            binding.tvUpdateHeroStatus.setTextColor(ContextCompat.getColor(this, R.color.htc_success))
            binding.btnInstallAppUpdate.setText(R.string.settings_app_update_reinstall)
            binding.btnInstallAppUpdate.isEnabled = true
        }
        binding.btnCheckAppUpdate.setText(R.string.settings_update_check_again)
    }

    private fun renderUpdateError(message: String) {
        binding.tvUpdateHeroStatus.text = getString(R.string.settings_update_check_failed, message)
        binding.tvUpdateHeroStatus.setTextColor(ContextCompat.getColor(this, R.color.htc_error))
        binding.tvAvailableVersion.setText(R.string.settings_update_available_unknown)
        binding.tvUpdateSize.setText(R.string.settings_update_size_unknown)
        binding.tvAppUpdateNotes.setText(R.string.settings_update_check_failed_hint)
        binding.btnCheckAppUpdate.setText(R.string.settings_update_try_again)
        if (updateInfo == null) {
            binding.btnInstallAppUpdate.isEnabled = false
        }
    }

    private fun formatFileSize(bytes: Long): String {
        if (bytes <= 0L) return getString(R.string.settings_update_size_unknown)
        val megabytes = bytes / (1024.0 * 1024.0)
        return String.format(Locale.getDefault(), "%.1f MB", megabytes)
    }

    private fun startSettingsUpdateDownload(info: AppUpdateInfo) {
        if (updateDownloadInFlight) return
        updateDownloadInFlight = true
        binding.btnCheckAppUpdate.isEnabled = false
        binding.btnInstallAppUpdate.isEnabled = false
        binding.btnOpenAppDownload.isEnabled = false
        binding.updateProgressContainer.visibility = View.VISIBLE
        binding.updateProgressBar.progress = 0
        binding.tvUpdateProgress.setText(R.string.update_downloading)
        binding.tvUpdateHeroStatus.setText(R.string.update_downloading)
        lifecycleScope.launch {
            val result = updateRepository.downloadAndOpenInstaller(info) { progress ->
                runOnUiThread {
                    binding.updateProgressBar.progress = progress
                    binding.tvUpdateProgress.text = getString(R.string.settings_app_update_progress, progress)
                    binding.tvUpdateHeroStatus.text = getString(R.string.settings_app_update_progress, progress)
                }
            }
            updateDownloadInFlight = false
            binding.btnCheckAppUpdate.isEnabled = true
            binding.btnInstallAppUpdate.isEnabled = true
            binding.btnOpenAppDownload.isEnabled = true
            when (result) {
                UpdateInstallResult.InstallerOpened -> {
                    binding.tvUpdateHeroStatus.setText(R.string.settings_app_update_installer_opened)
                    binding.tvUpdateProgress.setText(R.string.settings_app_update_installer_opened)
                }
                UpdateInstallResult.InstallPermissionRequired -> {
                    binding.tvUpdateHeroStatus.setText(R.string.update_permission_required)
                    binding.tvUpdateProgress.setText(R.string.update_permission_required)
                    Toast.makeText(this@SettingsActivity, R.string.update_permission_required, Toast.LENGTH_LONG).show()
                }
                is UpdateInstallResult.Failed -> {
                    val errorText = getString(R.string.update_failed, result.message)
                    binding.tvUpdateHeroStatus.text = errorText
                    binding.tvUpdateProgress.text = errorText
                    Toast.makeText(this@SettingsActivity, getString(R.string.update_failed, result.message), Toast.LENGTH_LONG).show()
                }
            }
        }
    }
    
    private fun openWhatsApp() {
        try {
            val phoneNumber = "004917623419358"
            val message = "Hello, I'm using MoPlayer IPTV app"
            val url = "https://wa.me/$phoneNumber?text=${Uri.encode(message)}"
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, getString(R.string.about_whatsapp_not_installed), Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun openEmail() {
        try {
            val intent = Intent(Intent.ACTION_SENDTO).apply {
                data = Uri.parse("mailto:")
                putExtra(Intent.EXTRA_EMAIL, arrayOf("Mohammad.alfarras@gmail.com"))
                putExtra(Intent.EXTRA_SUBJECT, "MoPlayer IPTV - Feedback")
            }
            startActivity(Intent.createChooser(intent, "Send Email"))
        } catch (e: Exception) {
            Toast.makeText(this, getString(R.string.about_no_email_app), Toast.LENGTH_SHORT).show()
        }
    }

    private fun openWebsite(url: String) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        } catch (e: Exception) {
            Toast.makeText(this, url, Toast.LENGTH_SHORT).show()
        }
    }

    private enum class PinAction {
        ENABLE, DISABLE, CHANGE
    }

    private var currentPinAction = PinAction.ENABLE

    private fun setupPinDialog() {
        binding.btnPinCancel.setOnClickListener {
            hidePinDialog()
            // Reset switch if cancelled
            lifecycleScope.launch {
                binding.switchParentalEnabled.isChecked = parentalLockManager.isParentalEnabled.first()
            }
        }

        binding.btnPinConfirm.setOnClickListener {
            val pin = binding.etPin.text.toString()
            handlePinInput(pin)
        }
    }

    private fun showPinDialog(action: PinAction) {
        currentPinAction = action
        binding.etPin.text?.clear()

        binding.tvPinTitle.text = when (action) {
            PinAction.ENABLE -> getString(R.string.parental_set_new_pin)
            PinAction.DISABLE -> getString(R.string.parental_enter_current_pin)
            PinAction.CHANGE -> getString(R.string.parental_enter_new_pin)
        }

        binding.pinDialogOverlay.visibility = View.VISIBLE
        binding.pinDialogOverlay.post { binding.etPin.requestFocus() }
    }

    private fun hidePinDialog() {
        binding.pinDialogOverlay.visibility = View.GONE
    }

    private fun handlePinInput(pin: String) {
        if (pin.length != 4) {
            Toast.makeText(this, getString(R.string.parental_pin_invalid), Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            when (currentPinAction) {
                PinAction.ENABLE, PinAction.CHANGE -> {
                    val success = parentalLockManager.setPin(pin)
                    if (success) {
                        Toast.makeText(this@SettingsActivity, getString(R.string.parental_pin_set_success), Toast.LENGTH_SHORT).show()
                        hidePinDialog()
                    } else {
                        Toast.makeText(this@SettingsActivity, getString(R.string.parental_pin_set_failed), Toast.LENGTH_SHORT).show()
                    }
                }
                PinAction.DISABLE -> {
                    val verified = parentalLockManager.verifyPin(pin)
                    if (verified) {
                        parentalLockManager.setParentalEnabled(false)
                        Toast.makeText(this@SettingsActivity, getString(R.string.parental_lock_disabled), Toast.LENGTH_SHORT).show()
                        hidePinDialog()
                    } else {
                        Toast.makeText(this@SettingsActivity, getString(R.string.parental_pin_incorrect), Toast.LENGTH_SHORT).show()
                        binding.switchParentalEnabled.isChecked = true
                    }
                }
            }
        }
    }

    private fun showPanel(panel: SettingsPanel, focusPanel: Boolean = true) {
        val switchStartMs = System.currentTimeMillis()

        // Save current focus if in a panel
        currentFocus?.let { focused ->
            if (focused.id != View.NO_ID) {
                lastPanelFocusId[currentPanel] = focused.id
            }
        }
        
        currentPanel = panel

        // Hide all panels
        binding.panelServer.visibility = View.GONE
        binding.panelPlayer.visibility = View.GONE
        binding.panelParental.visibility = View.GONE
        binding.panelInterface.visibility = View.GONE
        binding.panelUpdate.visibility = View.GONE
        binding.panelAbout.visibility = View.GONE

        // Show selected panel
        val panelView = when (panel) {
            SettingsPanel.SERVER -> binding.panelServer.also { it.visibility = View.VISIBLE }
            SettingsPanel.PLAYER -> binding.panelPlayer.also { it.visibility = View.VISIBLE }
            SettingsPanel.PARENTAL -> binding.panelParental.also { it.visibility = View.VISIBLE }
            SettingsPanel.INTERFACE -> {
                binding.panelInterface.also { it.visibility = View.VISIBLE }
            }
            SettingsPanel.UPDATE -> binding.panelUpdate.also { it.visibility = View.VISIBLE }
            SettingsPanel.ABOUT -> {
                binding.panelAbout.also { it.visibility = View.VISIBLE }
            }
        }

        // Update category selection
        val categoryId = when (panel) {
            SettingsPanel.SERVER -> "server"
            SettingsPanel.PLAYER -> "player"
            SettingsPanel.PARENTAL -> "parental"
            SettingsPanel.INTERFACE -> "interface"
            SettingsPanel.UPDATE -> "update"
            SettingsPanel.ABOUT -> "about"
        }
        categoryAdapter.setSelectedCategory(categoryId)
        
        // Restore or set focus on panel
        panelView.post {
            applyPanelFocusMap(panel, panelView)
            if (focusPanel) restorePanelFocus(panel, panelView)
            val duration = System.currentTimeMillis() - switchStartMs
            Log.d("SettingsPanelPerf", "panel=${panel.name} switchDurationMs=$duration")
        }
    }

    private fun focusCurrentCategory() {
        val targetPosition = when (currentPanel) {
            SettingsPanel.SERVER -> 0
            SettingsPanel.PLAYER -> 1
            SettingsPanel.PARENTAL -> 2
            SettingsPanel.INTERFACE -> 3
            SettingsPanel.UPDATE -> 4
            SettingsPanel.ABOUT -> 5
        }
        val manager = binding.rvCategories.layoutManager as? LinearLayoutManager
        val target = manager?.findViewByPosition(targetPosition)
        if (target?.requestFocus() != true) {
            binding.rvCategories.scrollToPosition(targetPosition)
            binding.rvCategories.post {
                manager?.findViewByPosition(targetPosition)?.requestFocus()
                    ?: binding.rvCategories.requestFocus()
            }
        }
    }
    
    private fun restorePanelFocus(panel: SettingsPanel, panelView: View) {
        // Try to restore last focused view in this panel
        val savedFocusId = lastPanelFocusId[panel]
        if (savedFocusId != null && savedFocusId != View.NO_ID) {
            val savedView = panelView.findViewById<View>(savedFocusId)
            if (savedView != null && savedView.isFocusable && savedView.visibility == View.VISIBLE) {
                savedView.requestFocus()
                return
            }
        }
        
        // Otherwise, focus on first element in panel
        val firstFocusable = getPanelPreferredFirstFocusable(panel)
        firstFocusable?.requestFocus()
    }

    private fun applyPanelFocusMap(panel: SettingsPanel, panelView: View) {
        val first = getPanelPreferredFirstFocusable(panel) ?: return
        val focusables = collectVisibleFocusableViews(panelView)
            .filter { it.id != View.NO_ID }
            .distinctBy { it.id }

        if (focusables.isEmpty()) return

        FocusMapRegistry.mapVerticalChain(focusables, leftTarget = binding.rvCategories)
        if (panel == SettingsPanel.INTERFACE) {
            FocusMapRegistry.mapHorizontalStrip(
                listOf(
                    binding.colorChipGreen,
                    binding.colorChipCyan,
                    binding.colorChipPurple,
                    binding.colorChipOrange,
                    binding.colorChipGold,
                    binding.colorChipPink,
                    binding.colorChipBlue,
                    binding.colorChipWhite
                ),
                wrap = false,
                upTarget = binding.optionLayoutStyle,
                downTarget = binding.etCustomImageUrl
            )
        } else if (panel == SettingsPanel.UPDATE) {
            FocusMapRegistry.mapHorizontalStrip(
                listOf(
                    binding.btnCheckAppUpdate,
                    binding.btnInstallAppUpdate,
                    binding.btnOpenAppDownload
                ),
                wrap = false
            )
        }

        // Keep right navigation inside content area unless explicit next-focus exists.
        focusables.forEach { view ->
            if (view.nextFocusRightId == View.NO_ID) {
                view.nextFocusRightId = view.id
            }
        }

        first.nextFocusLeftId = binding.rvCategories.id
    }

    private fun getPanelPreferredFirstFocusable(panel: SettingsPanel): View? {
        val preferred = when (panel) {
            SettingsPanel.SERVER -> binding.btnRefreshServer
            SettingsPanel.PLAYER -> binding.optionPlayerSelection
            SettingsPanel.PARENTAL -> binding.optionParentalEnabled
            SettingsPanel.INTERFACE -> binding.optionBackground
            SettingsPanel.UPDATE -> binding.btnCheckAppUpdate
            SettingsPanel.ABOUT -> binding.btnWhatsApp
        }
        if (preferred.visibility == View.VISIBLE && preferred.isEnabled && preferred.isFocusable) return preferred
        return collectVisibleFocusableViews(getCurrentPanelView()).firstOrNull { it.isEnabled }
    }

    private fun collectVisibleFocusableViews(root: View): List<View> {
        val result = mutableListOf<View>()

        fun walk(node: View) {
            if (node.visibility != View.VISIBLE) return
            if (node.isFocusable && node.id != View.NO_ID) {
                result.add(node)
            }
            if (node is ViewGroup) {
                for (i in 0 until node.childCount) {
                    walk(node.getChildAt(i))
                }
            }
        }

        walk(root)
        return result.sortedWith(compareBy<View> { getAbsoluteTop(it) }.thenBy { getAbsoluteLeft(it) })
    }

    private fun getAbsoluteTop(view: View): Int {
        var top = view.top
        var parent = view.parent
        while (parent is View) {
            top += parent.top
            parent = parent.parent
        }
        return top
    }

    private fun getAbsoluteLeft(view: View): Int {
        var left = view.left
        var parent = view.parent
        while (parent is View) {
            left += parent.left
            parent = parent.parent
        }
        return left
    }

    private fun observeViewModel() {
        viewModel.activeServer.observe(this) { server ->
            if (server == null) {
                binding.tvServerName.text = getString(R.string.source_no_active)
                binding.tvServerUrl.text = getString(R.string.source_add_to_start)
                binding.serverStatusChips.visibility = View.GONE
                binding.tvServerLastRefresh.visibility = View.GONE
                binding.tvServerExpiry.visibility = View.GONE
                binding.btnRefreshServer.visibility = View.GONE
                binding.btnDeleteServer.visibility = View.GONE
            } else {
                binding.tvServerName.text = server.name
                binding.tvServerUrl.text = maskEndpointForDisplay(server)
                binding.tvServerExpiry.text = buildActiveSourceMeta(server)
                binding.tvServerExpiry.visibility = if (binding.tvServerExpiry.text.isNullOrBlank()) View.GONE else View.VISIBLE
                binding.btnRefreshServer.visibility = View.VISIBLE
                binding.btnDeleteServer.visibility = View.VISIBLE
            }
        }
        viewModel.sourceStatusItems.observe(this) { items ->
            sourceStatusAdapter.submitList(items)
            binding.rvServers.visibility = if (items.isEmpty()) View.GONE else View.VISIBLE
            renderActiveSourceStatus(items.firstOrNull { it.isActive })
        }
    }

    private fun renderActiveSourceStatus(item: SourceStatusItem?) {
        if (item == null) {
            binding.serverStatusChips.visibility = View.GONE
            binding.tvServerLastRefresh.visibility = View.GONE
            return
        }

        binding.serverStatusChips.visibility = View.VISIBLE
        binding.tvServerType.text = item.type.uppercase(Locale.US)
        binding.tvServerStatus.text = buildSourceStatusLabel(item)
        binding.tvServerStatus.setTextColor(sourceStatusColor(item))
        binding.tvServerCounts.text = getString(
            R.string.dashboard_counts_format,
            item.channels,
            item.movies,
            item.series,
            item.categories
        )
        binding.tvServerLastRefresh.text = buildSourceLastRefresh(item)
        binding.tvServerLastRefresh.visibility = View.VISIBLE
    }

    private fun buildSourceStatusLabel(item: SourceStatusItem): String {
        val state = item.syncState?.lastStatus?.uppercase(Locale.US)
        return when (state) {
            "SUCCESS" -> getString(R.string.source_status_success)
            "RUNNING" -> getString(R.string.source_status_running)
            "ERROR" -> getString(R.string.source_status_error)
            else -> if (item.isActive) getString(R.string.source_active) else getString(R.string.source_status_idle)
        }
    }

    private fun sourceStatusColor(item: SourceStatusItem): Int {
        val status = item.syncState?.lastStatus?.uppercase(Locale.US)
        val color = when (status) {
            "SUCCESS" -> R.color.htc_accent_green
            "RUNNING" -> R.color.moplayer_orange
            "ERROR" -> R.color.htc_error
            else -> R.color.htc_text_secondary
        }
        return ContextCompat.getColor(this, color)
    }

    private fun buildSourceLastRefresh(item: SourceStatusItem): String {
        val lastSyncAt = item.syncState?.lastSyncAt ?: return getString(R.string.source_never_refreshed)
        val relative = DateUtils.getRelativeTimeSpanString(
            lastSyncAt,
            System.currentTimeMillis(),
            DateUtils.MINUTE_IN_MILLIS,
            DateUtils.FORMAT_ABBREV_RELATIVE
        )
        return getString(R.string.source_last_refresh_format, relative)
    }

    private fun maskEndpointForDisplay(server: com.mo.moplayer.data.local.entity.ServerEntity): String {
        if (server.serverUrl.isBlank()) {
            return if (server.serverType.equals("m3u", ignoreCase = true)) {
                getString(R.string.source_local_playlist)
            } else {
                getString(R.string.source_no_endpoint)
            }
        }

        return runCatching {
            val uri = java.net.URI(server.serverUrl)
            val port = if (uri.port != -1) ":${uri.port}" else ""
            val host = uri.host.orEmpty().ifBlank {
                uri.authority.orEmpty()
                    .substringAfter("@")
                    .substringBefore("/")
                    .substringBefore("?")
            }
            if (host.isNotBlank()) "$host$port" else getString(R.string.source_no_endpoint)
        }.getOrDefault(
            server.serverUrl
                .substringBefore("?")
                .removePrefix("https://")
                .removePrefix("http://")
                .substringBefore("/")
                .replace(Regex("(username|password|token)=([^&]+)", RegexOption.IGNORE_CASE), "\$1=masked")
        )
    }

    private fun buildActiveSourceMeta(server: com.mo.moplayer.data.local.entity.ServerEntity): String {
        val expiryText = server.expirationDate?.takeIf { it.isNotBlank() }?.let {
            getString(R.string.source_expiry_format, formatProviderDate(it))
        }
        val connectionText = when {
            server.activeConnections != null && server.maxConnections != null ->
                getString(R.string.source_connections_format, server.activeConnections, server.maxConnections)
            server.maxConnections != null ->
                getString(R.string.source_max_connections_format, server.maxConnections)
            else -> null
        }
        return listOfNotNull(expiryText, connectionText).joinToString("  -  ")
    }

    private fun formatProviderDate(raw: String): String {
        val trimmed = raw.trim()
        val epoch = trimmed.toLongOrNull()
        if (epoch != null && epoch > 1_000_000_000L) {
            val millis = if (epoch < 10_000_000_000L) epoch * 1000L else epoch
            return SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(millis))
        }
        return trimmed
    }

    private fun refreshServerSilently() {
        serverRefreshInFlight = true
        binding.btnRefreshServer.isEnabled = false
        binding.btnRefreshServer.text = getString(R.string.settings_server_refreshing)

        lifecycleScope.launch {
            runCatching {
                withContext(Dispatchers.IO) {
                    smartRefreshManager.forceRefresh()
                }
            }.onSuccess {
                viewModel.reloadServerInfo()
            }.onFailure { error ->
                Toast.makeText(
                    this@SettingsActivity,
                    getString(R.string.settings_update_failed, error.message ?: getString(R.string.error_generic)),
                    Toast.LENGTH_SHORT
                ).show()
            }

            binding.btnRefreshServer.text = getString(R.string.settings_server_refresh)
            binding.btnRefreshServer.isEnabled = true
            serverRefreshInFlight = false
        }
    }

    override fun handleTvKeyEvent(keyCode: Int, event: KeyEvent?): Boolean {
        if (event?.action != KeyEvent.ACTION_DOWN) return false
        when (keyCode) {
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_DPAD_DOWN -> {
                if (currentFocus == null) {
                    restorePanelFocus(currentPanel, getCurrentPanelView())
                    return true
                }
            }
            KeyEvent.KEYCODE_DPAD_LEFT -> {
                return handleLeftKey()
            }
            KeyEvent.KEYCODE_DPAD_RIGHT -> {
                return handleRightKey()
            }
            KeyEvent.KEYCODE_MENU -> {
                // Toggle between categories and content
                if (binding.rvCategories.hasFocus()) {
                    restorePanelFocus(currentPanel, getCurrentPanelView())
                } else {
                    focusCurrentCategory()
                }
                return true
            }
            KeyEvent.KEYCODE_BACK -> {
                if (binding.pinDialogOverlay.visibility == View.VISIBLE) {
                    hidePinDialog()
                    lifecycleScope.launch {
                        binding.switchParentalEnabled.isChecked = parentalLockManager.isParentalEnabled.first()
                    }
                    return true
                }
                closeSettingsFromRemote()
                return true
            }
        }
        return false
    }

    private fun closeSettingsFromRemote() {
        if (!isTaskRoot) {
            finish()
            return
        }
        val intent = Intent(this, com.mo.moplayer.ui.home.HomeActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        startActivity(intent)
        finish()
    }
    
    private fun handleLeftKey(): Boolean {
        // Check if we're in a panel (not in categories list)
        val currentFocusView = currentFocus
        
        // If we're in the PIN dialog, let default handling work
        if (binding.pinDialogOverlay.visibility == View.VISIBLE) {
            return false
        }
        
        // Check if focus is within any panel
        val inPanel = currentFocusView != null && 
            (isViewInPanel(currentFocusView, binding.panelServer) ||
             isViewInPanel(currentFocusView, binding.panelPlayer) ||
             isViewInPanel(currentFocusView, binding.panelParental) ||
             isViewInPanel(currentFocusView, binding.panelInterface) ||
             isViewInPanel(currentFocusView, binding.panelUpdate) ||
             isViewInPanel(currentFocusView, binding.panelAbout))
        
        if (inPanel) {
            // Move to categories list
            focusCurrentCategory()
            return true
        }
        
        // Otherwise, let default navigation handle it
        return false
    }
    
    private fun handleRightKey(): Boolean {
        // Check if we're in the categories list
        if (binding.rvCategories.hasFocus() || isViewInPanel(currentFocus, binding.rvCategories)) {
            // Move to the current panel
            restorePanelFocus(currentPanel, getCurrentPanelView())
            return true
        }
        
        // Otherwise, let default navigation handle it
        return false
    }
    
    private fun isViewInPanel(view: View?, panel: View): Boolean {
        if (view == null) return false
        var parent = view.parent
        while (parent != null) {
            if (parent == panel) return true
            parent = parent.parent
        }
        return false
    }
    
    private fun getCurrentPanelView(): View {
        return panelRoots[currentPanel] ?: binding.panelServer
    }

    private fun setupSettingsInteractionPolish() {
        makeSwitchRowsRemoteFriendly(binding.root)
        markPrimaryButtonsDynamic()
    }

    private fun makeSwitchRowsRemoteFriendly(root: View) {
        if (root is SwitchCompat) {
            root.isFocusable = false
            root.isFocusableInTouchMode = false
            root.isClickable = false
        }
        if (root is ViewGroup) {
            for (i in 0 until root.childCount) makeSwitchRowsRemoteFriendly(root.getChildAt(i))
        }
    }

    private fun markPrimaryButtonsDynamic() {
        listOf(
            binding.btnRefreshServer,
            binding.btnAddServer,
            binding.btnApplyImage,
            binding.btnChooseLocalImage,
            binding.btnRefreshWeatherLocation,
            binding.btnPinConfirm
        ).forEach { it.tag = "dynamic_button" }
        applyThemeToViews(themeManager.currentAccentColor.value)
    }

    override fun applyThemeToViews(color: Int) {
        super.applyThemeToViews(color)
        val tint = ColorStateList.valueOf(color)
        val softTint = ColorStateList.valueOf(withAlpha(color, 62))

        listOf(
            binding.tvServerType,
            binding.tvServerExpiry,
            binding.tvWeatherStatus
        ).forEach { it.setTextColor(color) }

        listOf(
            binding.switchAnimationEnabled,
            binding.switchAutoCityWallpaper,
            binding.switchFootballWidgetEnabled,
            binding.switchWeatherEnabled,
            binding.switchWeatherReduceMotion,
            binding.switchWeatherDisableLightning,
            binding.switchHardwareAccel,
            binding.switchLivePreview,
            binding.switchPipMode,
            binding.switchParentalEnabled,
            binding.switchLockAdult
        ).forEach { switch ->
            switch.thumbTintList = tint
            switch.trackTintList = softTint
        }

        binding.spinnerWeatherEffectsQuality.backgroundTintList = tint
        updateAllAccentChipVisuals(themeManager.currentAccentId.value)
    }

    private fun showPosterSizeDialog() {
        val labels = arrayOf("Small", "Medium", "Large")
        val values = com.mo.moplayer.util.TvUiPreferences.PosterSize.entries.toTypedArray()
        lifecycleScope.launch {
            val current = tvUiPreferences.posterSize.first()
            val currentIndex = values.indexOf(current).coerceAtLeast(0)
            val dialog = AlertDialog.Builder(this@SettingsActivity, R.style.AlertDialogTheme)
                .setTitle("Poster Size")
                .setSingleChoiceItems(labels, currentIndex) { d, which ->
                    lifecycleScope.launch {
                        tvUiPreferences.setPosterSize(values[which])
                    }
                    d.dismiss()
                }
                .setNegativeButton(R.string.cancel) { d, _ -> d.dismiss() }
                .create()
            dialog.setOnShowListener { applyDialogListFocusStyle(dialog) }
            dialog.show()
        }
    }

    private fun showLayoutStyleDialog() {
        val labels = arrayOf("Rows", "Grid")
        val values = com.mo.moplayer.util.TvUiPreferences.LayoutStyle.entries.toTypedArray()
        lifecycleScope.launch {
            val current = tvUiPreferences.layoutStyle.first()
            val currentIndex = values.indexOf(current).coerceAtLeast(0)
            val dialog = AlertDialog.Builder(this@SettingsActivity, R.style.AlertDialogTheme)
                .setTitle("Layout Style")
                .setSingleChoiceItems(labels, currentIndex) { d, which ->
                    lifecycleScope.launch {
                        tvUiPreferences.setLayoutStyle(values[which])
                    }
                    d.dismiss()
                }
                .setNegativeButton(R.string.cancel) { d, _ -> d.dismiss() }
                .create()
            dialog.setOnShowListener { applyDialogListFocusStyle(dialog) }
            dialog.show()
        }
    }

    private fun showBackgroundBehaviorDialog() {
        val labels = arrayOf(
            getString(R.string.settings_background_behavior_static),
            getString(R.string.settings_background_behavior_follow_preview)
        )
        val values = com.mo.moplayer.util.TvUiPreferences.BackgroundBehavior.entries.toTypedArray()
        lifecycleScope.launch {
            val current = tvUiPreferences.backgroundBehavior.first()
            val currentIndex = values.indexOf(current).coerceAtLeast(0)
            val dialog = AlertDialog.Builder(this@SettingsActivity, R.style.AlertDialogTheme)
                .setTitle(R.string.settings_background_behavior_title)
                .setSingleChoiceItems(labels, currentIndex) { d, which ->
                    lifecycleScope.launch {
                        tvUiPreferences.setBackgroundBehavior(values[which])
                    }
                    d.dismiss()
                }
                .setNegativeButton(R.string.cancel) { d, _ -> d.dismiss() }
                .create()
            dialog.setOnShowListener { applyDialogListFocusStyle(dialog) }
            dialog.show()
        }
    }

    private fun updateAllAccentChipVisuals(selectedAccent: ThemeManager.AccentId) {
        accentChipViews.forEach { (view, selection) ->
            updateAccentChipVisual(view, selection.second, view.hasFocus(), selection.second == selectedAccent)
        }
    }

    private fun updateAccentChipVisual(
        view: View,
        accentId: ThemeManager.AccentId,
        hasFocus: Boolean,
        isSelected: Boolean = accentId == themeManager.currentAccentId.value
    ) {
        val option = themeManager.getAccentOption(accentId) ?: return
        view.background = createAccentChipDrawable(option.color, hasFocus, isSelected)
        view.scaleX = if (hasFocus || isSelected) 1.12f else 1f
        view.scaleY = if (hasFocus || isSelected) 1.12f else 1f
    }

    private fun createAccentChipDrawable(color: Int, hasFocus: Boolean, isSelected: Boolean): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(color)
            val strokeWidth = when {
                hasFocus -> 4
                isSelected -> 3
                else -> 2
            }
            val strokeColor = when {
                hasFocus -> Color.WHITE
                isSelected -> themeManager.currentAccentColor.value
                else -> Color.argb(86, 255, 255, 255)
            }
            setStroke(strokeWidth, strokeColor)
        }
    }

    private fun withAlpha(color: Int, alpha: Int): Int =
        Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color))

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_CODE_IMAGE_PICKER && resultCode == android.app.Activity.RESULT_OK) {
            data?.data?.let { uri ->
                handleSelectedImage(uri)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.reloadServerInfo()
        lifecycleScope.launch {
            val cityWallpaperPath = withContext(Dispatchers.IO) {
                backgroundManager.getCityWallpaperFile().takeIf { it.exists() }?.absolutePath
            }
            if (cityWallpaperPath != null) {
                binding.animatedBackground.loadCustomImageFromFile(cityWallpaperPath, blurAmount = 0)
                binding.animatedBackground.pauseAnimation()
            } else if (com.mo.moplayer.util.DevicePerformance.allowAnimatedBackground(this@SettingsActivity)) {
                binding.animatedBackground.resumeAnimation()
            } else {
                binding.animatedBackground.pauseAnimation()
            }
        }
    }

    override fun onPause() {
        super.onPause()
        binding.animatedBackground.pauseAnimation()
    }

    data class SettingsCategory(
        val id: String,
        val name: String,
        val iconRes: Int
    )
}
