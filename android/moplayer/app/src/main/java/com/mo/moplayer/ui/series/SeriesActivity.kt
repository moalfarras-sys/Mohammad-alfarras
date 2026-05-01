package com.mo.moplayer.ui.series

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.paging.LoadState
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.mo.moplayer.R
import com.mo.moplayer.data.local.entity.SeriesEntity
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.databinding.ActivityMoviesBinding
import com.mo.moplayer.databinding.PanelMoviePreviewBinding
import com.mo.moplayer.ui.common.BaseTvActivity
import com.mo.moplayer.ui.common.ContentMenuDetails
import com.mo.moplayer.ui.common.ContentMenuHelper
import com.mo.moplayer.ui.movies.adapters.CategoryAdapter
import com.mo.moplayer.ui.series.adapters.SeriesAdapter
import com.mo.moplayer.ui.widgets.AnimatedBackground
import com.mo.moplayer.ui.common.design.TvCinematicTokens
import com.mo.moplayer.util.LayoutHelper
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@AndroidEntryPoint
class SeriesActivity : BaseTvActivity() {

    override val screenId: String = "series"

    private lateinit var binding: ActivityMoviesBinding
    private val viewModel: SeriesViewModel by viewModels()

    @Inject lateinit var repository: IptvRepository

    @Inject lateinit var playerPreferences: com.mo.moplayer.util.PlayerPreferences

    @Inject lateinit var recyclerViewOptimizer: com.mo.moplayer.util.RecyclerViewOptimizer

    @Inject lateinit var networkErrorHandler: com.mo.moplayer.util.NetworkErrorHandler

    @Inject lateinit var tvUiPreferences: com.mo.moplayer.util.TvUiPreferences

    private lateinit var categoryAdapter: CategoryAdapter
    private lateinit var seriesAdapter: SeriesAdapter

    // Preview panel
    private lateinit var previewBinding: PanelMoviePreviewBinding
    private var currentPreviewSeries: SeriesEntity? = null
    private var isPreviewVisible = false
    private var serverId: Long = 0

    // Debouncing for preview updates
    private var previewUpdateJob: Job? = null

    override fun getAnimatedBackground(): AnimatedBackground? {
        return try {
            binding.animatedBackground
        } catch (e: Exception) {
            null
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMoviesBinding.inflate(layoutInflater)
        setContentView(binding.root)
        binding.tvScreenTitle.setText(R.string.series_title)

        // Check if we should go directly to series detail
        val seriesId = intent.getStringExtra("series_id")
        if (!seriesId.isNullOrEmpty()) {
            val intent =
                    Intent(this, SeriesDetailActivity::class.java).apply {
                        putExtra(SeriesDetailActivity.EXTRA_SERIES_ID, seriesId)
                    }
            startActivity(intent)
        }

        // Get server ID
        lifecycleScope.launch {
            repository.getActiveServerSync()?.let { server -> serverId = server.id }
        }

        setupPreviewPanel()
        setupCategoryList()
        setupSeriesGrid()
        setupSearchButton()
        observeViewModel()

        previewBinding.previewPanel.visibility = View.GONE
        binding.animatedBackground.pauseAnimation()
        binding.root.postDelayed({ binding.animatedBackground.resumeAnimation() }, 320L)
    }

    private fun setupPreviewPanel() {
        previewBinding = PanelMoviePreviewBinding.bind(binding.root.findViewById(R.id.previewPanel))

        // Setup click listeners
        previewBinding.btnPreviewPlay.setOnClickListener {
            currentPreviewSeries?.let { openSeriesDetail(it) }
        }

        previewBinding.btnPreviewResume.setOnClickListener {
            currentPreviewSeries?.let { openSeriesDetail(it) }
        }

        previewBinding.btnPreviewFavorite.setOnClickListener {
            currentPreviewSeries?.let {
                viewModel.toggleFavorite(it)
                updateFavoriteButton(it)
            }
        }

        previewBinding.btnPreviewTrailer.setOnClickListener {
            currentPreviewSeries?.let { series ->
                if (!series.youtubeTrailer.isNullOrEmpty()) {
                    playTrailer(series.youtubeTrailer)
                } else {
                    Toast.makeText(this, R.string.error_trailer_not_available, Toast.LENGTH_SHORT)
                            .show()
                }
            }
        }
    }

    private fun showPreviewPanel() {
        if (!isPreviewVisible) {
            isPreviewVisible = true
            previewBinding.previewPanel.visibility = View.VISIBLE
            previewBinding.previewPanel.alpha = 0f
            previewBinding.previewPanel.translationX = 32f
            previewBinding.previewPanel.animate()
                    .alpha(1f)
                    .translationX(0f)
                    .setDuration(TvCinematicTokens.ENTER_EXIT_DURATION_MS)
                    .setInterpolator(TvCinematicTokens.FOCUS_INTERPOLATOR)
                    .start()
        }
    }

    private fun hidePreviewPanel() {
        if (isPreviewVisible) {
            isPreviewVisible = false
            previewBinding.previewPanel.animate()
                    .alpha(0f)
                    .translationX(32f)
                    .setDuration(TvCinematicTokens.ENTER_EXIT_DURATION_MS)
                    .setInterpolator(TvCinematicTokens.EXIT_INTERPOLATOR)
                    .withEndAction {
                            previewBinding.previewPanel.visibility = View.GONE
                            previewBinding.previewPanel.translationX = 0f
                            previewBinding.previewPanel.alpha = 1f
                    }
                    .start()
        }
    }

    private fun updateSeriesPreview(series: SeriesEntity) {
        currentPreviewSeries = series
        showPreviewPanel()

        // Load backdrop image with lazy loading and disk caching
        lifecycleScope.launch {
            delay(100) // Small delay for backdrop loading
            if (com.mo.moplayer.util.GlideHelper.isValidContextForGlide(this@SeriesActivity)) {
                if (!series.backdrop.isNullOrEmpty()) {
                    Glide.with(this@SeriesActivity)
                            .load(series.backdrop)
                            .diskCacheStrategy(com.bumptech.glide.load.engine.DiskCacheStrategy.ALL)
                            .centerCrop()
                            .into(previewBinding.ivPreviewBackdrop)
                } else if (!series.cover.isNullOrEmpty()) {
                    Glide.with(this@SeriesActivity)
                            .load(series.cover)
                            .diskCacheStrategy(com.bumptech.glide.load.engine.DiskCacheStrategy.ALL)
                            .centerCrop()
                            .into(previewBinding.ivPreviewBackdrop)
                }
            }
        }

        // Load large poster with disk caching
        if (!series.cover.isNullOrEmpty() &&
                        com.mo.moplayer.util.GlideHelper.isValidContextForGlide(this)
        ) {
            Glide.with(this)
                    .load(series.cover)
                    .diskCacheStrategy(com.bumptech.glide.load.engine.DiskCacheStrategy.ALL)
                    .placeholder(R.drawable.ic_content_placeholder)
                    .error(R.drawable.ic_content_placeholder)
                    .centerCrop()
                    .into(previewBinding.ivPreviewPoster)
        } else {
            previewBinding.ivPreviewPoster.setImageResource(R.drawable.ic_content_placeholder)
        }

        // Set title
        previewBinding.tvPreviewTitle.text = series.name

        // Set rating
        if (series.rating != null && series.rating > 0) {
            previewBinding.ratingBadge.visibility = View.VISIBLE
            previewBinding.tvPreviewRating.text = String.format("%.1f", series.rating)
        } else {
            previewBinding.ratingBadge.visibility = View.GONE
        }

        // Hide year for series (use release date instead)
        previewBinding.tvPreviewYear.visibility = View.GONE

        // Hide duration (not applicable for series)
        previewBinding.tvPreviewDuration.visibility = View.GONE

        // Set genre
        if (!series.genre.isNullOrEmpty()) {
            previewBinding.tvPreviewGenre.visibility = View.VISIBLE
            previewBinding.tvPreviewGenre.text = series.genre
        } else {
            previewBinding.tvPreviewGenre.visibility = View.GONE
        }

        // Set plot/description
        if (!series.plot.isNullOrEmpty()) {
            previewBinding.tvPreviewPlot.visibility = View.VISIBLE
            previewBinding.tvPreviewPlot.text = series.plot
        } else {
            previewBinding.tvPreviewPlot.visibility = View.VISIBLE
            previewBinding.tvPreviewPlot.text = getString(R.string.preview_no_description)
        }

        // Set director
        if (!series.director.isNullOrEmpty()) {
            previewBinding.tvPreviewDirector.visibility = View.VISIBLE
            previewBinding.tvPreviewDirector.text =
                    getString(R.string.preview_director, series.director)
        } else {
            previewBinding.tvPreviewDirector.visibility = View.GONE
        }

        // Set cast
        if (!series.cast.isNullOrEmpty()) {
            previewBinding.tvPreviewCast.visibility = View.VISIBLE
            previewBinding.tvPreviewCast.text = getString(R.string.preview_cast, series.cast)
        } else {
            previewBinding.tvPreviewCast.visibility = View.GONE
        }

        // Set release date
        if (!series.releaseDate.isNullOrEmpty()) {
            previewBinding.tvPreviewReleaseDate.visibility = View.VISIBLE
            previewBinding.tvPreviewReleaseDate.text =
                    getString(R.string.preview_release_date, series.releaseDate)
        } else {
            previewBinding.tvPreviewReleaseDate.visibility = View.GONE
        }

        // Hide continue watching progress for series (applies to individual episodes)
        previewBinding.btnPreviewResume.visibility = View.GONE
        previewBinding.progressOverlay.visibility = View.GONE

        // Show/hide trailer button
        if (!series.youtubeTrailer.isNullOrEmpty()) {
            previewBinding.btnPreviewTrailer.visibility = View.VISIBLE
        } else {
            previewBinding.btnPreviewTrailer.visibility = View.GONE
        }

        // Update favorite button
        updateFavoriteButton(series)

        // Change play button text to "View Details" for series
        previewBinding.btnPreviewPlay.text = getString(R.string.series_select_season)
    }

    private fun updateFavoriteButton(series: SeriesEntity) {
        lifecycleScope.launch {
            val isFavorite = repository.isFavorite(serverId, series.seriesId).first()
            previewBinding.btnPreviewFavorite.setImageResource(
                    if (isFavorite) R.drawable.ic_favorite_filled else R.drawable.ic_favorite_border
            )
        }
    }

    private fun playTrailer(youtubeTrailer: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(youtubeTrailer))
            startActivity(Intent.createChooser(intent, getString(R.string.trailer)))
        } catch (e: Exception) {
            Toast.makeText(this, R.string.error_trailer_not_available, Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupSearchButton() {
        binding.btnSearch.setOnClickListener { openSearch() }
    }

    private fun openSearch() {
        val intent =
                Intent(this, com.mo.moplayer.ui.search.SearchActivity::class.java).apply {
                    putExtra("content_type", "series")
                }
        startActivity(intent)
    }

    private fun setupCategoryList() {
        categoryAdapter =
                CategoryAdapter(
                        onCategoryClick = { category -> viewModel.selectCategory(category) },
                        onCategoryFocused = { _ -> }
                )

        binding.rvCategories.apply {
            layoutManager = LinearLayoutManager(this@SeriesActivity)
            adapter = categoryAdapter
            recyclerViewOptimizer.optimizeVerticalList(this)
        }
    }

    private fun setupSeriesGrid() {
        seriesAdapter =
                SeriesAdapter(
                        onSeriesClick = { series -> openSeriesDetail(series) },
                        onSeriesFocused = { series ->
                            // Debounce preview updates
                            previewUpdateJob?.cancel()
                            previewUpdateJob =
                                    lifecycleScope.launch {
                                        delay(200) // Wait 200ms before updating preview
                                        updateSeriesPreview(series)
                                    }
                        },
                        onSeriesLongClick = { series -> viewModel.toggleFavorite(series) },
                        onSeriesLongPress = { series -> showSeriesContextMenu(series) },
                        onFavoriteShortcut = { series -> viewModel.toggleFavorite(series) },
                        themeManager = themeManager
        )

        binding.rvMovies.apply {
            layoutManager = LayoutHelper.createResponsiveGridLayoutManager(
                    context = this@SeriesActivity,
                    cardWidthDp = 180,
                    cardMarginDp = LayoutHelper.getCardMarginDp(this@SeriesActivity),
                    screenMarginHorizontalDp = LayoutHelper.getScreenMarginHorizontalDp(this@SeriesActivity),
                    minColumns = 4,
                    maxColumns = 9
            )
            adapter = seriesAdapter
            setHasFixedSize(true)
            recyclerViewOptimizer.optimizeChannelList(this)
            itemAnimator = null // Disable animations for smoother scrolling

            // Performance optimizations
            isNestedScrollingEnabled = false
            clipToPadding = false
            clipChildren = false
        }

        lifecycleScope.launch {
            kotlinx.coroutines.flow.combine(tvUiPreferences.layoutStyle, tvUiPreferences.posterSize) { layoutStyle, posterSize ->
                layoutStyle to posterSize
            }.collect { (layoutStyle, posterSize) ->
                val metrics = tvUiPreferences.posterMetrics(posterSize)
                binding.rvMovies.layoutManager =
                    if (layoutStyle == com.mo.moplayer.util.TvUiPreferences.LayoutStyle.GRID) {
                        LayoutHelper.createResponsiveGridLayoutManager(
                            context = this@SeriesActivity,
                            cardWidthDp = metrics.widthDp,
                            cardMarginDp = LayoutHelper.getCardMarginDp(this@SeriesActivity),
                            screenMarginHorizontalDp = LayoutHelper.getScreenMarginHorizontalDp(this@SeriesActivity),
                            minColumns = 4,
                            maxColumns = 9
                        )
                    } else {
                        androidx.recyclerview.widget.GridLayoutManager(this@SeriesActivity, 1)
                    }
            }
        }

        // Add load state listener for paging
        seriesAdapter.addLoadStateListener { loadState ->
            val isRefreshing = loadState.refresh is LoadState.Loading
            binding.loadingOverlay.visibility = if (isRefreshing) View.VISIBLE else View.GONE

            if (loadState.refresh is LoadState.NotLoading) {
                if (seriesAdapter.itemCount == 0) {
                    binding.networkErrorView.showEmpty(
                            title = getString(R.string.series_empty_title),
                            message = getString(R.string.series_empty_subtitle),
                            iconRes = R.drawable.ic_series
                    )
                } else if (binding.networkErrorView.getCurrentState() == com.mo.moplayer.ui.common.LoadingStateView.State.EMPTY) {
                    binding.networkErrorView.hide()
                }
            }
        }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            viewModel.networkError.collect { error ->
                binding.networkErrorView.let { errorView ->
                    if (error != null) {
                        errorView.setListener(
                                object :
                                        com.mo.moplayer.ui.common.LoadingStateView.LoadingStateListener {
                                    override fun onRetryClicked() {
                                        viewModel.retry()
                                    }
                                }
                        )
                        errorView.showError(
                                title = getString(R.string.error_connection),
                                message = networkErrorHandler.getErrorMessage(error),
                                showRetry = error.isRetryable
                        )
                    } else {
                        errorView.hide()
                    }
                }
            }
        }

        viewModel.categories.observe(this) { categories ->
            val realCategories = categories.filter { it.name.isNotBlank() }
            categoryAdapter.submitList(realCategories)

            val selected = viewModel.selectedCategory.value
            val needsSelection = selected == null || realCategories.none { it.categoryId == selected.categoryId }
            if (realCategories.isNotEmpty() && needsSelection) {
                viewModel.selectCategory(realCategories.first())
            } else if (realCategories.isEmpty()) {
                binding.tvCategoryTitle.text = getString(R.string.series_catalog)
                categoryAdapter.setSelectedCategory("")
                binding.rvMovies.post { binding.rvMovies.requestFocus() }
            }

            if (!binding.rvCategories.hasFocus() && !binding.rvMovies.hasFocus() && realCategories.isNotEmpty()) {
                binding.rvCategories.post {
                    binding.rvCategories.getChildAt(0)?.requestFocus()
                }
            }
        }

        // Collect paged series
        lifecycleScope.launch {
            viewModel.seriesPaged.collectLatest { pagingData ->
                seriesAdapter.submitData(pagingData)
            }
        }

        viewModel.selectedCategory.observe(this) { category ->
            binding.tvCategoryTitle.text = category?.name ?: getString(R.string.series_catalog)
            categoryAdapter.setSelectedCategory(category?.categoryId ?: "")
        }
    }

    private fun openSeriesDetail(series: SeriesEntity) {
        val intent =
                Intent(this, SeriesDetailActivity::class.java).apply {
                    putExtra(SeriesDetailActivity.EXTRA_SERIES_ID, series.seriesId)
                }
        startActivity(intent)
    }

    private fun showSeriesContextMenu(series: SeriesEntity) {
        lifecycleScope.launch {
            val server = repository.getActiveServerSync() ?: return@launch
            val isFavorite = repository.isFavorite(server.id, series.seriesId).first()

            ContentMenuHelper(this@SeriesActivity)
                    .showContentMenu(
                            title = series.name,
                            thumbnailUrl = series.cover,
                            isFavorite = isFavorite,
                            details = ContentMenuDetails(
                                description = series.plot,
                                rating = series.rating,
                                year = series.releaseDate,
                                genre = series.genre
                            ),
                            onPlay = { openSeriesDetail(series) },
                            onToggleFavorite = {
                                lifecycleScope.launch {
                                    repository.toggleFavorite(
                                            serverId = server.id,
                                            contentId = series.seriesId,
                                            contentType = "series",
                                            name = series.name,
                                            iconUrl = series.cover
                                    )
                                }
                            },
                            onInfo = {
                                // Open series detail page
                                openSeriesDetail(series)
                            },
                            // Show trailer option if available
                            onTrailer =
                                    if (!series.youtubeTrailer.isNullOrEmpty()) {
                                        { playTrailer(series.youtubeTrailer!!) }
                                    } else null
                    )
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_MENU -> {
                startActivity(
                        Intent(this, com.mo.moplayer.ui.settings.SettingsActivity::class.java)
                )
                return true
            }
            KeyEvent.KEYCODE_BACK -> {
                if (maybeHandleExitOnBack()) return true
                finish()
                return true
            }
            KeyEvent.KEYCODE_SEARCH -> {
                openSearch()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onResume() {
        super.onResume()
        binding.animatedBackground.resumeAnimation()
    }

    override fun onPause() {
        super.onPause()
        binding.animatedBackground.pauseAnimation()
    }

    override fun applyThemeToViews(color: Int) {
        super.applyThemeToViews(color)
        // Update adapter colors for focused items
        if (::seriesAdapter.isInitialized) {
            seriesAdapter.updateThemeColor(color)
        }
    }
}
