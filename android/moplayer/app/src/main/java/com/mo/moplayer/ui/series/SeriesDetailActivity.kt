package com.mo.moplayer.ui.series

import android.app.UiModeManager
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.mo.moplayer.R
import com.mo.moplayer.databinding.ActivitySeriesDetailBinding
import com.mo.moplayer.databinding.ActivitySeriesDetailTvBinding
import com.mo.moplayer.ui.common.BaseTvActivity
import com.mo.moplayer.ui.player.PlayerActivity
import com.mo.moplayer.ui.series.adapters.EpisodeAdapter
import com.mo.moplayer.ui.series.adapters.SeasonAdapter
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import kotlinx.coroutines.launch

@AndroidEntryPoint
class SeriesDetailActivity : BaseTvActivity() {

    override val screenId: String = "series_detail"

    companion object {
        const val EXTRA_SERIES_ID = "series_id"
    }

    private var normalBinding: ActivitySeriesDetailBinding? = null
    private var tvBinding: ActivitySeriesDetailTvBinding? = null
    private val viewModel: SeriesDetailViewModel by viewModels()

    @Inject lateinit var playerPreferences: com.mo.moplayer.util.PlayerPreferences

    private lateinit var episodeAdapter: EpisodeAdapter
    private lateinit var seasonAdapter: SeasonAdapter
    private var videoPreviewManager: VideoPreviewManager? = null
    private var isTvMode = false

    private var longPressDetectorPlay: com.mo.moplayer.ui.common.LongPressDetector? = null
    private var longPressDetectorPreview: com.mo.moplayer.ui.common.LongPressDetector? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Detect TV mode
        val uiModeManager = getSystemService(Context.UI_MODE_SERVICE) as UiModeManager
        isTvMode = uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION

        // Inflate appropriate layout
        if (isTvMode) {
            tvBinding = ActivitySeriesDetailTvBinding.inflate(layoutInflater)
            setContentView(tvBinding?.root)
            videoPreviewManager = VideoPreviewManager(this)
            setupVideoPreviewListener()
        } else {
            normalBinding = ActivitySeriesDetailBinding.inflate(layoutInflater)
            setContentView(normalBinding?.root)
        }

        val seriesId = intent.getStringExtra(EXTRA_SERIES_ID)
        if (seriesId.isNullOrEmpty()) {
            finish()
            return
        }

        viewModel.loadSeriesDetails(seriesId)

        setupSeasonList()
        setupEpisodeList()
        setupActions()
        setupTvNavigation()
        observeViewModel()
    }

    private fun setupVideoPreviewListener() {
        videoPreviewManager?.setListener(
                object : VideoPreviewManager.PreviewListener {
                    override fun onPreviewStarted() {
                        tvBinding?.previewPanel?.previewLoadingIndicator?.visibility = View.GONE
                        tvBinding?.previewPanel?.videoPreviewSurface?.visibility = View.VISIBLE
                    }

                    override fun onPreviewStopped() {
                        tvBinding?.previewPanel?.videoPreviewSurface?.visibility = View.GONE
                    }

                    override fun onPreviewError(error: String) {
                        // Handle error silently, preview is optional
                    }
                }
        )
    }

    private fun setupSeasonList() {
        seasonAdapter =
                SeasonAdapter(
                        onSeasonClick = { seasonNum -> viewModel.selectSeason(seasonNum) },
                        getEpisodeCount = { seasonNum ->
                            // Return episode count for the season
                            if (viewModel.currentSeason.value == seasonNum) {
                                viewModel.episodes.value?.size ?: 0
                            } else {
                                10 // Mock count for other seasons
                            }
                        }
                )

        if (isTvMode) {
            tvBinding?.rvSeasons?.apply {
                layoutManager = LinearLayoutManager(this@SeriesDetailActivity)
                adapter = seasonAdapter
            }
        } else {
            normalBinding?.rvSeasons?.apply {
                layoutManager = LinearLayoutManager(this@SeriesDetailActivity)
                adapter = seasonAdapter
            }
        }
    }

    private fun setupEpisodeList() {
        episodeAdapter =
                EpisodeAdapter(
                        onEpisodeClick = { episode -> playEpisode(episode) },
                        onEpisodeFocused = { episode ->
                            viewModel.setFocusedEpisode(episode)

                            // Start video preview on TV mode
                            if (isTvMode) {
                                updatePreviewPanel(episode)

                                // Schedule video preview if URL is available
                                episode.previewUrl?.let { previewUrl ->
                                    tvBinding?.previewPanel?.videoPreviewSurface?.let { surface ->
                                        videoPreviewManager?.schedulePreview(previewUrl, surface)
                                    }
                                }
                            }
                        },
                        getEpisodeProgress = { episodeId ->
                            viewModel.getEpisodeProgress(episodeId)
                        }
                )

        if (isTvMode) {
            tvBinding?.rvEpisodes?.apply {
                layoutManager = LinearLayoutManager(this@SeriesDetailActivity)
                adapter = episodeAdapter
            }
        } else {
            normalBinding?.rvEpisodes?.apply {
                layoutManager = LinearLayoutManager(this@SeriesDetailActivity)
                adapter = episodeAdapter
            }
        }
    }

    private fun updatePreviewPanel(episode: SeriesDetailViewModel.Episode) {
        tvBinding?.previewPanel?.apply {
            // Update episode info
            tvEpisodeNumber.text = "S${episode.seasonNumber} E${episode.episodeNumber}"
            tvEpisodeTitle.text = episode.title
            tvEpisodePlot.text = episode.plot ?: ""
            tvDuration.text = episode.duration ?: ""

            // Update series info
            viewModel.series.value?.let { series ->
                tvSeriesTitle.text = series.name
                tvYear.text = series.releaseDate ?: ""
                tvRating.text = String.format("%.1f", series.rating ?: 0.0)

                // Load series poster
                if (com.mo.moplayer.util.GlideHelper.isValidContextForGlide(this@SeriesDetailActivity)) {
                    Glide.with(this@SeriesDetailActivity)
                            .load(series.cover)
                            .placeholder(R.drawable.ic_content_placeholder)
                            .into(ivSeriesPoster)
                }

                // Load episode thumbnail
                if (com.mo.moplayer.util.GlideHelper.isValidContextForGlide(this@SeriesDetailActivity)) {
                    Glide.with(this@SeriesDetailActivity)
                            .load(episode.thumbnail ?: series.cover)
                            .placeholder(R.drawable.ic_content_placeholder)
                            .into(ivPreviewThumbnail)
                }
            }
        }
    }

    private fun setupActions() {
        if (isTvMode) {
            tvBinding?.previewPanel?.apply {
                // Setup long press detector for Preview Play button
                longPressDetectorPreview =
                        com.mo.moplayer.ui.common.LongPressDetector(
                                onLongPress = { showContextMenu() },
                                onShortPress = {
                                    val episode =
                                            viewModel.focusedEpisode.value
                                                    ?: viewModel.episodes.value?.firstOrNull()
                                    episode?.let { playEpisode(it) }
                                }
                        )

                btnPlayPreview.setOnClickListener {
                    val episode =
                            viewModel.focusedEpisode.value
                                    ?: viewModel.episodes.value?.firstOrNull()
                    episode?.let { playEpisode(it) }
                }

                btnPlayPreview.setOnKeyListener { v, keyCode, event ->
                    when (event.action) {
                        KeyEvent.ACTION_DOWN -> {
                            longPressDetectorPreview?.onKeyDown(keyCode)
                            false
                        }
                        KeyEvent.ACTION_UP -> {
                            longPressDetectorPreview?.onKeyUp(keyCode) ?: false
                        }
                        else -> false
                    }
                }

                btnAddToFavorites.setOnClickListener { viewModel.toggleFavorite() }

                btnTrailerPreview.setOnClickListener { playTrailer() }
            }
        } else {
            normalBinding?.apply {
                // Setup long press detector for Play button
                longPressDetectorPlay =
                        com.mo.moplayer.ui.common.LongPressDetector(
                                onLongPress = { showContextMenu() },
                                onShortPress = {
                                    val firstEpisode = viewModel.episodes.value?.firstOrNull()
                                    firstEpisode?.let { playEpisode(it) }
                                }
                        )

                btnPlay.setOnClickListener {
                    val firstEpisode = viewModel.episodes.value?.firstOrNull()
                    firstEpisode?.let { playEpisode(it) }
                }

                btnPlay.setOnKeyListener { v, keyCode, event ->
                    when (event.action) {
                        KeyEvent.ACTION_DOWN -> {
                            longPressDetectorPlay?.onKeyDown(keyCode)
                            false
                        }
                        KeyEvent.ACTION_UP -> {
                            longPressDetectorPlay?.onKeyUp(keyCode) ?: false
                        }
                        else -> false
                    }
                }

                btnFavorite.setOnClickListener { viewModel.toggleFavorite() }

                btnTrailer.setOnClickListener { playTrailer() }
            }
        }
    }

    private fun playTrailer() {
        viewModel.series.value?.let { series ->
            val trailerUrl = series.youtubeTrailer
            if (!trailerUrl.isNullOrEmpty()) {
                try {
                    // Try to open YouTube app or browser
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(trailerUrl))
                    startActivity(intent)
                } catch (e: Exception) {
                    Toast.makeText(
                                    this,
                                    getString(R.string.error_trailer_not_available),
                                    Toast.LENGTH_SHORT
                            )
                            .show()
                }
            } else {
                Toast.makeText(
                                this,
                                getString(R.string.error_trailer_not_available),
                                Toast.LENGTH_SHORT
                        )
                        .show()
            }
        }
    }

    private fun showContextMenu() {
        val series = viewModel.series.value ?: return
        val isFav = viewModel.isFavorite.value ?: false

        com.mo.moplayer.ui.common.ContentMenuHelper(this)
                .showContentMenu(
                        title = series.name,
                        thumbnailUrl = series.cover,
                        isFavorite = isFav,
                        details = com.mo.moplayer.ui.common.ContentMenuDetails(
                                description = series.plot,
                                rating = series.rating,
                                year = series.releaseDate,
                                genre = series.genre
                        ),
                        onPlay = {
                            val episode =
                                    if (isTvMode) {
                                        viewModel.focusedEpisode.value
                                                ?: viewModel.episodes.value?.firstOrNull()
                                    } else {
                                        viewModel.episodes.value?.firstOrNull()
                                    }
                            episode?.let { playEpisode(it) }
                        },
                        onToggleFavorite = { viewModel.toggleFavorite() },
                        onInfo = {
                            // Info is already displayed on this screen
                            Toast.makeText(
                                            this,
                                            getString(R.string.series_title),
                                            Toast.LENGTH_SHORT
                                    )
                                    .show()
                        }
                )
    }

    private fun observeViewModel() {
        viewModel.series.observe(this) { series ->
            series?.let {
                if (isTvMode) {
                    // Load backdrop
                    val backdropUrl = it.backdrop ?: it.cover
                    if (!backdropUrl.isNullOrEmpty()) {
                        tvBinding?.ivBackdrop?.let { view ->
                            if (com.mo.moplayer.util.GlideHelper.isValidContextForGlide(this@SeriesDetailActivity)) {
                            Glide.with(this@SeriesDetailActivity).load(backdropUrl).into(view)
                        }
                        }
                    }

                    // Show/hide trailer button
                    tvBinding?.previewPanel?.btnTrailerPreview?.visibility =
                            if (!it.youtubeTrailer.isNullOrEmpty()) View.VISIBLE else View.GONE
                } else {
                    normalBinding?.apply {
                        tvSeriesTitle.text = it.name
                        tvRating.text = String.format("%.1f", it.rating ?: 0.0)
                        tvYear.text = it.releaseDate ?: ""
                        tvGenre.text = it.genre ?: ""
                        tvPlot.text = it.plot ?: ""

                        if (!it.cast.isNullOrEmpty()) {
                            tvCast.text = "Cast: ${it.cast}"
                            tvCast.visibility = View.VISIBLE
                        } else {
                            tvCast.visibility = View.GONE
                        }

                        // Load poster
                        if (!it.cover.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(this@SeriesDetailActivity)) {
                            Glide.with(this@SeriesDetailActivity)
                                    .load(it.cover)
                                    .placeholder(R.drawable.ic_content_placeholder)
                                    .into(ivPoster)
                        }

                        // Load backdrop
                        val backdropUrl = it.backdrop ?: it.cover
                        if (!backdropUrl.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(this@SeriesDetailActivity)) {
                            Glide.with(this@SeriesDetailActivity).load(backdropUrl).into(ivBackdrop)
                        }

                        // Show trailer button if trailer URL is available
                        btnTrailer.visibility =
                                if (!it.youtubeTrailer.isNullOrEmpty()) View.VISIBLE else View.GONE
                    }
                }
            }
        }

        viewModel.seasons.observe(this) { seasons ->
            seasonAdapter.submitList(seasons)

            // Auto-hide seasons panel if only one season (cleaner UI)
            val shouldShowSeasons = seasons.size > 1
            if (isTvMode) {
                tvBinding?.llSeasonsPanel?.visibility =
                        if (shouldShowSeasons) View.VISIBLE else View.GONE
            } else {
                normalBinding?.llSeasonsPanel?.visibility =
                        if (shouldShowSeasons) View.VISIBLE else View.GONE
            }
        }

        viewModel.currentSeason.observe(this) { seasonNum ->
            seasonAdapter.setSelectedSeason(seasonNum)
        }

        viewModel.episodes.observe(this) { episodes ->
            episodeAdapter.submitList(episodes)

            val seasonNum = viewModel.currentSeason.value ?: 1
            val headerText = "Season $seasonNum - ${episodes.size} Episodes"
            val countText = "${episodes.size} episodes"

            if (isTvMode) {
                tvBinding?.tvEpisodeHeader?.text = headerText
                tvBinding?.tvEpisodeCount?.text = countText

                // Update preview panel with first episode if focused episode is null
                if (viewModel.focusedEpisode.value == null && episodes.isNotEmpty()) {
                    updatePreviewPanel(episodes.first())
                }
            } else {
                normalBinding?.tvEpisodeHeader?.text = headerText
                normalBinding?.tvEpisodeCount?.text = countText
            }
        }

        viewModel.isFavorite.observe(this) { isFavorite ->
            val iconRes =
                    if (isFavorite) R.drawable.ic_favorite_filled else R.drawable.ic_favorite_border
            val contentDesc =
                    if (isFavorite) {
                        getString(R.string.movie_remove_favorite)
                    } else {
                        getString(R.string.movie_add_favorite)
                    }

            if (isTvMode) {
                tvBinding?.previewPanel?.btnAddToFavorites?.apply {
                    setImageResource(iconRes)
                    contentDescription = contentDesc
                }
            } else {
                normalBinding?.btnFavorite?.apply {
                    setImageResource(iconRes)
                    contentDescription = contentDesc
                }
            }
        }

        viewModel.isLoading.observe(this) { isLoading ->
            if (isTvMode) {
                tvBinding?.loadingOverlay?.visibility = if (isLoading) View.VISIBLE else View.GONE
            } else {
                normalBinding?.loadingOverlay?.visibility =
                        if (isLoading) View.VISIBLE else View.GONE
            }
        }

        // Observe focused episode changes
        viewModel.focusedEpisode.observe(this) { episode ->
            episode?.let {
                if (isTvMode) {
                    updatePreviewPanel(it)
                }
            }
        }
    }

    private fun playEpisode(episode: SeriesDetailViewModel.Episode) {
        val streamUrl = episode.streamUrl
        if (streamUrl.isNullOrEmpty()) {
            Toast.makeText(this, "Stream URL not available", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            val extraData =
                    Bundle().apply {
                        putString(PlayerActivity.EXTRA_TYPE, "SERIES")
                        putString(PlayerActivity.EXTRA_CONTENT_ID, episode.id)
                        putString(PlayerActivity.EXTRA_SERIES_ID, viewModel.series.value?.seriesId)
                        putString(PlayerActivity.EXTRA_SERIES_NAME, viewModel.series.value?.name)
                        putInt(
                                PlayerActivity.EXTRA_SEASON_NUMBER,
                                viewModel.currentSeason.value ?: 1
                        )
                        putInt(PlayerActivity.EXTRA_EPISODE_NUMBER, episode.episodeNumber)
                    }

            com.mo.moplayer.util.PlayerLauncher.launchWithSelectedPlayer(
                    this@SeriesDetailActivity,
                    playerPreferences,
                    streamUrl,
                    "${viewModel.series.value?.name} - ${episode.title}",
                    extraData
            )
        }
    }

    private fun setupTvNavigation() {
        if (!isTvMode) return

        tvBinding?.let { binding ->
            // Setup focus memory for RecyclerViews
            TvFocusHelper.setupFocusMemory(binding.rvEpisodes)
            TvFocusHelper.setupFocusMemory(binding.rvSeasons)

            // Setup smooth scrolling
            TvFocusHelper.setupSmoothScrollOnFocus(binding.rvEpisodes)
            TvFocusHelper.setupSmoothScrollOnFocus(binding.rvSeasons)

            // Request initial focus on episodes list
            binding.rvEpisodes.post { binding.rvEpisodes.requestFocus() }
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_BACK -> {
                if (maybeHandleExitOnBack()) return true
                finish()
                return true
            }
            KeyEvent.KEYCODE_MENU -> {
                // Show options menu on TV
                if (isTvMode) {
                    // Could show additional options
                    return true
                }
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onPause() {
        super.onPause()
        videoPreviewManager?.stopPreview()
    }

    override fun onStop() {
        super.onStop()
        videoPreviewManager?.cancelScheduledPreview()
    }

    override fun onDestroy() {
        super.onDestroy()
        videoPreviewManager?.release()
        videoPreviewManager = null
        normalBinding = null
        tvBinding = null
    }
}
