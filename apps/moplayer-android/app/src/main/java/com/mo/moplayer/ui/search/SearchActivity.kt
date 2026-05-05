package com.mo.moplayer.ui.search

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.os.Bundle
import android.speech.RecognizerIntent
import android.text.Editable
import android.text.TextWatcher
import android.view.KeyEvent
import android.view.inputmethod.EditorInfo
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
import androidx.core.view.isVisible
import androidx.recyclerview.widget.GridLayoutManager
import com.mo.moplayer.R
import com.mo.moplayer.databinding.ActivitySearchBinding
import com.mo.moplayer.ui.common.BaseTvActivity
import com.mo.moplayer.ui.common.ContentMenuDetails
import com.mo.moplayer.ui.common.ContentMenuHelper
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.ui.livetv.LiveTvActivity
import com.mo.moplayer.ui.player.PlayerActivity
import com.mo.moplayer.ui.search.adapters.SearchResultAdapter
import com.mo.moplayer.ui.series.SeriesDetailActivity
import com.mo.moplayer.util.LayoutHelper
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import dagger.hilt.android.AndroidEntryPoint
import java.util.Locale
import javax.inject.Inject

@AndroidEntryPoint
class SearchActivity : BaseTvActivity() {
    
    override val screenId: String = "search"

    private lateinit var binding: ActivitySearchBinding
    private val viewModel: SearchViewModel by viewModels()
    private lateinit var searchAdapter: SearchResultAdapter
    
    @Inject
    lateinit var repository: IptvRepository
    
    // Voice search result launcher
    private val voiceSearchLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val spokenText = result.data
                ?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                ?.firstOrNull()
            
            if (!spokenText.isNullOrBlank()) {
                binding.etSearch.setText(spokenText)
                binding.etSearch.setSelection(spokenText.length)
                viewModel.commitSearch(spokenText)
                viewModel.search(spokenText)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySearchBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        setupSearchInput()
        setupVoiceSearch()
        setupFilters()
        setupResultsGrid()
        observeViewModel()

        binding.animatedBackground.pauseAnimation()
        binding.root.postDelayed({ binding.animatedBackground.resumeAnimation() }, 220L)
        
        // Handle voice search intent from TV launcher
        handleVoiceSearchIntent(intent)
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleVoiceSearchIntent(intent)
    }
    
    /**
     * Handle voice search intent from Android TV launcher
     */
    private fun handleVoiceSearchIntent(intent: Intent) {
        if (Intent.ACTION_SEARCH == intent.action) {
            val query = intent.getStringExtra(android.app.SearchManager.QUERY)
            if (!query.isNullOrBlank()) {
                binding.etSearch.setText(query)
                viewModel.commitSearch(query)
                viewModel.search(query)
            }
        }
    }

    override fun getAnimatedBackground() = binding.animatedBackground

    private fun setupUI() {
        // Back button
        binding.btnBack.setOnClickListener { finish() }
        binding.btnBack.setOnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER && event.action == KeyEvent.ACTION_UP) {
                finish()
                true
            } else false
        }

        // Initial focus on search input
        binding.etSearch.requestFocus()
    }

    private fun setupSearchInput() {
        // Text watcher for real-time search
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                viewModel.search(s?.toString() ?: "")
            }
        })

        // Handle search action
        binding.etSearch.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                viewModel.commitSearch(binding.etSearch.text?.toString().orEmpty())
                // Focus on results if available
                if (searchAdapter.itemCount > 0) {
                    binding.rvSearchResults.getChildAt(0)?.requestFocus()
                }
                true
            } else false
        }
    }
    
    /**
     * Setup voice search button for Android TV
     */
    private fun setupVoiceSearch() {
        binding.btnVoiceSearch.setOnClickListener { startVoiceSearch() }
        binding.btnVoiceSearch.setOnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER && event.action == KeyEvent.ACTION_UP) {
                startVoiceSearch()
                true
            } else {
                false
            }
        }
    }
    
    /**
     * Start voice search using Android's speech recognition
     */
    private fun startVoiceSearch() {
        try {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                putExtra(RecognizerIntent.EXTRA_PROMPT, getString(R.string.search_voice_prompt))
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            }
            voiceSearchLauncher.launch(intent)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(
                this,
                getString(R.string.search_voice_unavailable),
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    private fun setupFilters() {
        val chips = listOf(
            binding.chipAll to SearchViewModel.SearchFilter.ALL,
            binding.chipChannels to SearchViewModel.SearchFilter.CHANNELS,
            binding.chipMovies to SearchViewModel.SearchFilter.MOVIES,
            binding.chipSeries to SearchViewModel.SearchFilter.SERIES
        )

        chips.forEach { (chip, filter) ->
            chip.setOnClickListener { selectFilter(filter) }
            chip.setOnKeyListener { _, keyCode, event ->
                if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER && event.action == KeyEvent.ACTION_UP) {
                    selectFilter(filter)
                    true
                } else false
            }
        }

        // Initial selection
        selectFilter(SearchViewModel.SearchFilter.ALL)
    }

    private fun selectFilter(filter: SearchViewModel.SearchFilter) {
        viewModel.setFilter(filter)

        // Update chip visual states
        binding.chipAll.isSelected = filter == SearchViewModel.SearchFilter.ALL
        binding.chipChannels.isSelected = filter == SearchViewModel.SearchFilter.CHANNELS
        binding.chipMovies.isSelected = filter == SearchViewModel.SearchFilter.MOVIES
        binding.chipSeries.isSelected = filter == SearchViewModel.SearchFilter.SERIES

        // Update text colors
        listOf(binding.chipAll, binding.chipChannels, binding.chipMovies, binding.chipSeries).forEach { chip ->
            chip.setTextColor(
                if (chip.isSelected) ContextCompat.getColor(this, R.color.htc_pure_black)
                else ContextCompat.getColor(this, R.color.htc_text_primary)
            )
        }
    }

    private fun setupResultsGrid() {
        searchAdapter = SearchResultAdapter(
            onItemClick = { result -> handleResultClick(result) },
            onItemFocused = { _ -> },
            onItemLongPress = { result -> showSearchResultContextMenu(result) },
            onFavoriteShortcut = { result ->
                lifecycleScope.launch {
                    val server = repository.getActiveServerSync() ?: return@launch
                    when (result) {
                        is SearchViewModel.SearchResult.Channel -> {
                            repository.toggleFavorite(
                                serverId = server.id,
                                contentId = result.channel.channelId,
                                contentType = "channel",
                                name = result.channel.name,
                                iconUrl = result.channel.streamIcon
                            )
                        }
                        is SearchViewModel.SearchResult.Movie -> {
                            repository.toggleFavorite(
                                serverId = server.id,
                                contentId = result.movie.movieId,
                                contentType = "movie",
                                name = result.movie.name,
                                iconUrl = result.movie.streamIcon
                            )
                        }
                        is SearchViewModel.SearchResult.Series -> {
                            repository.toggleFavorite(
                                serverId = server.id,
                                contentId = result.series.seriesId,
                                contentType = "series",
                                name = result.series.name,
                                iconUrl = result.series.cover
                            )
                        }
                    }
                }
            },
            themeManager = themeManager
        )

        binding.rvSearchResults.apply {
            // Use responsive grid layout that adapts to screen size
            val cardWidthDp = LayoutHelper.getCardWidthDp(this@SearchActivity)
            val cardMarginDp = LayoutHelper.getCardMarginDp(this@SearchActivity)
            val screenMarginDp = LayoutHelper.getScreenMarginHorizontalDp(this@SearchActivity)
            
            layoutManager = LayoutHelper.createResponsiveGridLayoutManager(
                context = this@SearchActivity,
                cardWidthDp = cardWidthDp,
                cardMarginDp = cardMarginDp,
                screenMarginHorizontalDp = screenMarginDp,
                minColumns = 2,
                maxColumns = 8
            )
            adapter = searchAdapter
            setHasFixedSize(true)
            clipToPadding = false
            clipChildren = false
        }
    }

    private fun observeViewModel() {
        viewModel.searchResults.observe(this) { results ->
            searchAdapter.submitList(results)

            // Show/hide empty state
            val isEmpty = results.isEmpty()
            val hasQuery = !viewModel.searchQuery.value.isNullOrBlank()

            binding.rvSearchResults.isVisible = !isEmpty
            binding.emptyState.isVisible = isEmpty

            if (isEmpty && hasQuery) {
                binding.tvEmptyTitle.text = getString(R.string.search_no_results_title)
                binding.tvEmptySubtitle.text = getString(R.string.search_no_results_subtitle)
            } else if (isEmpty) {
                binding.tvEmptyTitle.text = getString(R.string.search_empty_title)
                binding.tvEmptySubtitle.text = getString(R.string.search_empty_subtitle)
            }
        }

        viewModel.resultsCount.observe(this) { count ->
            binding.tvResultsCount.isVisible = count > 0
            binding.tvResultsCount.text = getString(R.string.search_results_count, count)
        }

        viewModel.isLoading.observe(this) { isLoading ->
            binding.loadingOverlay.isVisible = isLoading
        }
    }

    private fun handleResultClick(result: SearchViewModel.SearchResult) {
        when (result) {
            is SearchViewModel.SearchResult.Channel -> {
                val intent = Intent(this, LiveTvActivity::class.java).apply {
                    putExtra(LiveTvActivity.EXTRA_CHANNEL_ID, result.channel.channelId)
                }
                startActivity(intent)
            }
            is SearchViewModel.SearchResult.Movie -> {
                val intent = Intent(this, PlayerActivity::class.java).apply {
                    putExtra(PlayerActivity.EXTRA_STREAM_URL, result.movie.streamUrl)
                    putExtra(PlayerActivity.EXTRA_TITLE, result.movie.name)
                    putExtra(PlayerActivity.EXTRA_TYPE, "MOVIE")
                    putExtra(PlayerActivity.EXTRA_CONTENT_ID, result.movie.movieId)
                }
                startActivity(intent)
            }
            is SearchViewModel.SearchResult.Series -> {
                val intent = Intent(this, SeriesDetailActivity::class.java).apply {
                    putExtra(SeriesDetailActivity.EXTRA_SERIES_ID, result.series.seriesId)
                }
                startActivity(intent)
            }
        }
    }

    private fun showSearchResultContextMenu(result: SearchViewModel.SearchResult) {
        lifecycleScope.launch {
            val server = repository.getActiveServerSync() ?: return@launch
            
            when (result) {
                is SearchViewModel.SearchResult.Channel -> {
                    val isFavorite = repository.isFavorite(server.id, result.channel.channelId).first()
                    ContentMenuHelper(this@SearchActivity).showContentMenu(
                        title = result.channel.name,
                        thumbnailUrl = result.channel.streamIcon,
                        isFavorite = isFavorite,
                        onPlay = { handleResultClick(result) },
                        onToggleFavorite = {
                            lifecycleScope.launch {
                                repository.toggleFavorite(
                                    serverId = server.id,
                                    contentId = result.channel.channelId,
                                    contentType = "channel",
                                    name = result.channel.name,
                                    iconUrl = result.channel.streamIcon
                                )
                            }
                        },
                        onInfo = {
                            // Show channel info
                        }
                    )
                }
                is SearchViewModel.SearchResult.Movie -> {
                    val isFavorite = repository.isFavorite(server.id, result.movie.movieId).first()
                    ContentMenuHelper(this@SearchActivity).showContentMenu(
                        title = result.movie.name,
                        thumbnailUrl = result.movie.streamIcon,
                        isFavorite = isFavorite,
                        details = ContentMenuDetails(
                            description = result.movie.plot,
                            duration = result.movie.duration ?: ContentMenuDetails.formatDuration(result.movie.durationSeconds),
                            rating = result.movie.rating,
                            year = result.movie.year ?: result.movie.releaseDate,
                            genre = result.movie.genre
                        ),
                        onPlay = { handleResultClick(result) },
                        onToggleFavorite = {
                            lifecycleScope.launch {
                                repository.toggleFavorite(
                                    serverId = server.id,
                                    contentId = result.movie.movieId,
                                    contentType = "movie",
                                    name = result.movie.name,
                                    iconUrl = result.movie.streamIcon
                                )
                            }
                        },
                        onInfo = {
                            // Show movie info
                        }
                    )
                }
                is SearchViewModel.SearchResult.Series -> {
                    val isFavorite = repository.isFavorite(server.id, result.series.seriesId).first()
                    ContentMenuHelper(this@SearchActivity).showContentMenu(
                        title = result.series.name,
                        thumbnailUrl = result.series.cover,
                        isFavorite = isFavorite,
                        details = ContentMenuDetails(
                            description = result.series.plot,
                            rating = result.series.rating,
                            year = result.series.releaseDate,
                            genre = result.series.genre
                        ),
                        onPlay = { handleResultClick(result) },
                        onToggleFavorite = {
                            lifecycleScope.launch {
                                repository.toggleFavorite(
                                    serverId = server.id,
                                    contentId = result.series.seriesId,
                                    contentType = "series",
                                    name = result.series.name,
                                    iconUrl = result.series.cover
                                )
                            }
                        },
                        onInfo = {
                            // Show series info - navigate to detail
                            handleResultClick(result)
                        }
                    )
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        binding.animatedBackground.resumeAnimation()
    }

    override fun onPause() {
        super.onPause()
        binding.animatedBackground.pauseAnimation()
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_MENU -> {
                startActivity(Intent(this, com.mo.moplayer.ui.settings.SettingsActivity::class.java))
                return true
            }
            KeyEvent.KEYCODE_BACK -> {
                if (maybeHandleExitOnBack()) return true
                finish()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }
}
