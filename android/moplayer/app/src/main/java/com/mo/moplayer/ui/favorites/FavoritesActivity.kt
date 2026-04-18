package com.mo.moplayer.ui.favorites

import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.recyclerview.widget.GridLayoutManager
import com.mo.moplayer.data.local.entity.FavoriteEntity
import com.mo.moplayer.databinding.ActivityFavoritesBinding
import com.mo.moplayer.ui.common.BaseTvActivity
import com.mo.moplayer.ui.common.ContentMenuDetails
import com.mo.moplayer.ui.common.ContentMenuHelper
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.ui.player.PlayerActivity
import com.mo.moplayer.ui.series.SeriesDetailActivity
import com.mo.moplayer.util.LayoutHelper
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class FavoritesActivity : BaseTvActivity() {
    
    override val screenId: String = "favorites"

    private lateinit var binding: ActivityFavoritesBinding
    private val viewModel: FavoritesViewModel by viewModels()

    @Inject
    lateinit var repository: IptvRepository

    @Inject
    lateinit var recyclerViewOptimizer: com.mo.moplayer.util.RecyclerViewOptimizer

    private lateinit var favoritesAdapter: com.mo.moplayer.ui.favorites.adapters.FavoriteAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityFavoritesBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        observeViewModel()

        binding.animatedBackground.pauseAnimation()
        binding.root.postDelayed({ binding.animatedBackground.resumeAnimation() }, 260L)
    }

    override fun getAnimatedBackground() = binding.animatedBackground

    private fun setupRecyclerView() {
        favoritesAdapter = com.mo.moplayer.ui.favorites.adapters.FavoriteAdapter(
            onItemClick = { favorite ->
                handleFavoriteClick(favorite)
            },
            onItemLongClick = { favorite ->
                viewModel.removeFavorite(favorite)
            },
            onItemLongPress = { favorite ->
                showFavoriteContextMenu(favorite)
            },
            onFavoriteShortcut = { favorite ->
                viewModel.removeFavorite(favorite)
            },
            themeManager = themeManager
        )

        binding.rvFavorites.apply {
            // Use responsive grid layout that adapts to screen size
            val cardWidthDp = LayoutHelper.getCardWidthDp(this@FavoritesActivity)
            val cardMarginDp = LayoutHelper.getCardMarginDp(this@FavoritesActivity)
            val screenMarginDp = LayoutHelper.getScreenMarginHorizontalDp(this@FavoritesActivity)
            
            layoutManager = LayoutHelper.createResponsiveGridLayoutManager(
                context = this@FavoritesActivity,
                cardWidthDp = cardWidthDp,
                cardMarginDp = cardMarginDp,
                screenMarginHorizontalDp = screenMarginDp,
                minColumns = 2,
                maxColumns = 8
            )
            adapter = favoritesAdapter
            recyclerViewOptimizer.optimizeChannelList(this)
            clipToPadding = false
            clipChildren = false
        }
    }

    private fun observeViewModel() {
        viewModel.favorites.observe(this) { favorites ->
            favoritesAdapter.submitList(favorites)

            if (favorites.isEmpty()) {
                binding.emptyState.visibility = View.VISIBLE
                binding.rvFavorites.visibility = View.GONE
            } else {
                binding.emptyState.visibility = View.GONE
                binding.rvFavorites.visibility = View.VISIBLE
                if (!binding.rvFavorites.hasFocus()) {
                    binding.rvFavorites.post {
                        binding.rvFavorites.getChildAt(0)?.requestFocus()
                    }
                }
            }
        }

        viewModel.isLoading.observe(this) { isLoading ->
            binding.loadingOverlay.visibility = if (isLoading) View.VISIBLE else View.GONE
        }
    }

    private fun handleFavoriteClick(favorite: FavoriteEntity) {
        when (favorite.contentType) {
            "movie", "channel" -> {
                lifecycleScope.launch {
                    val playable = repository.resolvePlayableByFavorite(favorite.id)
                    if (playable == null) {
                        Toast.makeText(
                            this@FavoritesActivity,
                            getString(com.mo.moplayer.R.string.error_stream_failed),
                            Toast.LENGTH_SHORT
                        ).show()
                        return@launch
                    }
                    val intent = Intent(this@FavoritesActivity, PlayerActivity::class.java).apply {
                        putExtra(PlayerActivity.EXTRA_STREAM_URL, playable.streamUrl)
                        putExtra(PlayerActivity.EXTRA_TITLE, playable.title)
                        putExtra(PlayerActivity.EXTRA_TYPE, playable.type.name)
                        putExtra(PlayerActivity.EXTRA_CONTENT_ID, playable.contentId)
                        putExtra(PlayerActivity.EXTRA_POSTER_URL, playable.posterUrl)
                    }
                    startActivity(intent)
                }
            }
            "series" -> {
                val intent = Intent(this, SeriesDetailActivity::class.java).apply {
                    putExtra(SeriesDetailActivity.EXTRA_SERIES_ID, favorite.contentId)
                }
                startActivity(intent)
            }
        }
    }

    private fun showFavoriteContextMenu(favorite: FavoriteEntity) {
        lifecycleScope.launch {
            val details = when (favorite.contentType) {
                "movie" -> repository.getMovieById(favorite.contentId)?.let {
                    ContentMenuDetails(
                        description = it.plot,
                        duration = it.duration ?: ContentMenuDetails.formatDuration(it.durationSeconds),
                        rating = it.rating,
                        year = it.year ?: it.releaseDate,
                        genre = it.genre
                    )
                }
                "series" -> repository.getSeriesById(favorite.contentId)?.let {
                    ContentMenuDetails(
                        description = it.plot,
                        rating = it.rating,
                        year = it.releaseDate,
                        genre = it.genre
                    )
                }
                else -> null
            }
            ContentMenuHelper(this@FavoritesActivity).showContentMenu(
                title = favorite.name,
                thumbnailUrl = favorite.iconUrl,
                isFavorite = true,
                details = details,
                onPlay = { handleFavoriteClick(favorite) },
                onToggleFavorite = { viewModel.removeFavorite(favorite) },
                onInfo = { handleFavoriteClick(favorite) }
            )
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_MENU -> {
                startActivity(Intent(this, com.mo.moplayer.ui.settings.SettingsActivity::class.java))
                return true
            }
            KeyEvent.KEYCODE_SEARCH -> {
                startActivity(Intent(this, com.mo.moplayer.ui.search.SearchActivity::class.java))
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
        if (::favoritesAdapter.isInitialized) {
            favoritesAdapter.updateThemeColor(color)
        }
    }
}
