package com.mo.moplayer.ui.movies

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions
import com.mo.moplayer.R
import com.mo.moplayer.ui.common.BaseTvActivity
import com.mo.moplayer.data.local.entity.MovieEntity
import com.mo.moplayer.databinding.ActivityMovieDetailBinding
import com.mo.moplayer.ui.player.PlayerActivity
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MovieDetailActivity : BaseTvActivity() {
    
    override val screenId: String = "movie_detail"

    companion object {
        const val EXTRA_MOVIE_ID = "movie_id"
    }

    private lateinit var binding: ActivityMovieDetailBinding
    private val viewModel: MovieDetailViewModel by viewModels()

    private var isFavorite = false
    private var watchProgress: Int = 0
    
    private lateinit var longPressDetector: com.mo.moplayer.ui.common.LongPressDetector

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMovieDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val movieId = intent.getStringExtra(EXTRA_MOVIE_ID)
        if (movieId == null) {
            finish()
            return
        }

        setupClickListeners()
        observeViewModel()
        viewModel.loadMovie(movieId)
    }

    private fun setupClickListeners() {
        binding.btnPlay.setOnClickListener { playMovie() }
        binding.btnResume.setOnClickListener { resumeMovie() }
        binding.btnFavorite.setOnClickListener { toggleFavorite() }
        binding.btnTrailer.setOnClickListener { playTrailer() }

        // Setup long press detector for Play button
        longPressDetector = com.mo.moplayer.ui.common.LongPressDetector(
            onLongPress = {
                showContextMenu()
            },
            onShortPress = {
                playMovie()
            }
        )

        // D-Pad handling with long press support
        binding.btnPlay.setOnKeyListener { v, keyCode, event ->
            when (event.action) {
                KeyEvent.ACTION_DOWN -> {
                    longPressDetector.onKeyDown(keyCode)
                    false
                }
                KeyEvent.ACTION_UP -> {
                    if (longPressDetector.onKeyUp(keyCode)) {
                        // Long press handled
                        true
                    } else if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER) {
                        // Short press
                        animateButtonPress(v)
                        true
                    } else {
                        false
                    }
                }
                else -> false
            }
        }

        binding.btnResume.setOnKeyListener { v, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER && event.action == KeyEvent.ACTION_UP) {
                animateButtonPress(v)
                resumeMovie()
                true
            } else false
        }

        binding.btnFavorite.setOnKeyListener { v, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER && event.action == KeyEvent.ACTION_UP) {
                animateButtonPress(v)
                toggleFavorite()
                true
            } else false
        }
        
        binding.btnTrailer.setOnKeyListener { v, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER && event.action == KeyEvent.ACTION_UP) {
                animateButtonPress(v)
                playTrailer()
                true
            } else false
        }

        // Initial focus
        binding.btnPlay.requestFocus()
    }

    private fun observeViewModel() {
        viewModel.movie.observe(this) { movie ->
            movie?.let { displayMovie(it) }
        }

        viewModel.isFavorite.observe(this) { favorite ->
            isFavorite = favorite
            updateFavoriteIcon()
        }

        viewModel.watchProgress.observe(this) { progress ->
            watchProgress = progress
            if (progress > 0) {
                binding.progressOverlay.visibility = View.VISIBLE
                binding.progressBar.progress = progress
                binding.btnResume.visibility = View.VISIBLE
            } else {
                binding.progressOverlay.visibility = View.GONE
                binding.btnResume.visibility = View.GONE
            }
        }

        viewModel.isLoading.observe(this) { loading ->
            binding.loadingOverlay.visibility = if (loading) View.VISIBLE else View.GONE
        }
    }

    private fun displayMovie(movie: MovieEntity) {
        binding.tvTitle.text = movie.name

        // Year
        movie.releaseDate?.let { date ->
            val year = date.take(4)
            if (year.isNotEmpty()) {
                binding.tvYear.text = year
            }
        }

        // Duration
        movie.durationSeconds?.let { seconds ->
            if (seconds > 0) {
                val hours = seconds / 3600
                val minutes = (seconds % 3600) / 60
                binding.tvDuration.text = if (hours > 0) "${hours}h ${minutes}min" else "${minutes}min"
            }
        } ?: movie.duration?.let { durationStr ->
            if (durationStr.isNotEmpty()) {
                binding.tvDuration.text = durationStr
            }
        }

        // Genre
        movie.genre?.let { genre ->
            if (genre.isNotEmpty()) {
                binding.tvGenre.text = genre
            }
        }

        // Plot
        movie.plot?.let { plot ->
            if (plot.isNotEmpty()) {
                binding.tvPlot.text = plot
            }
        }

        // Rating
        movie.rating?.let { rating ->
            if (rating > 0) {
                binding.tvRating.text = String.format("%.1f", rating)
            }
        }

        // Director
        movie.director?.let { director ->
            if (director.isNotEmpty()) {
                binding.tvDirector.text = "Director: $director"
                binding.tvDirector.visibility = View.VISIBLE
            }
        }

        // Cast
        movie.cast?.let { cast ->
            if (cast.isNotEmpty()) {
                binding.tvCast.text = "Cast: $cast"
                binding.tvCast.visibility = View.VISIBLE
            }
        }

        // Load poster
        if (!movie.streamIcon.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(this)) {
            Glide.with(this)
                .load(movie.streamIcon)
                .placeholder(R.drawable.ic_content_placeholder)
                .error(R.drawable.ic_content_placeholder)
                .into(binding.ivPoster)
        }

        // Load backdrop (use poster as fallback)
        val backdropUrl = movie.backdrop ?: movie.streamIcon
        if (!backdropUrl.isNullOrEmpty() && com.mo.moplayer.util.GlideHelper.isValidContextForGlide(this)) {
            Glide.with(this)
                .load(backdropUrl)
                .transition(DrawableTransitionOptions.withCrossFade(500))
                .into(binding.ivBackdrop)
        }
        
        // Show trailer button if trailer URL is available
        if (!movie.youtubeTrailer.isNullOrEmpty()) {
            binding.btnTrailer.visibility = View.VISIBLE
        } else {
            binding.btnTrailer.visibility = View.GONE
        }
    }
    
    private fun playTrailer() {
        viewModel.movie.value?.let { movie ->
            val trailerUrl = movie.youtubeTrailer
            if (!trailerUrl.isNullOrEmpty()) {
                try {
                    // Try to open YouTube app or browser
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(trailerUrl))
                    startActivity(intent)
                } catch (e: Exception) {
                    Toast.makeText(this, getString(R.string.error_trailer_not_available), Toast.LENGTH_SHORT).show()
                }
            } else {
                Toast.makeText(this, getString(R.string.error_trailer_not_available), Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun playMovie() {
        viewModel.movie.value?.let { movie ->
            launchPlayer(movie, 0)
        }
    }

    private fun resumeMovie() {
        viewModel.movie.value?.let { movie ->
            viewModel.savedPosition.value?.let { position ->
                launchPlayer(movie, position)
            }
        }
    }

    private fun launchPlayer(movie: MovieEntity, startPosition: Long) {
        val streamUrl = movie.streamUrl
        if (streamUrl.isNullOrEmpty()) return

        val intent = Intent(this, PlayerActivity::class.java).apply {
            putExtra(PlayerActivity.EXTRA_STREAM_URL, streamUrl)
            putExtra(PlayerActivity.EXTRA_TITLE, movie.name)
            putExtra(PlayerActivity.EXTRA_TYPE, "MOVIE")
            putExtra(PlayerActivity.EXTRA_CONTENT_ID, movie.movieId)
            putExtra("start_position", startPosition)
        }
        startActivity(intent)
    }

    private fun toggleFavorite() {
        viewModel.movie.value?.let { movie ->
            viewModel.toggleFavorite(movie)
            
            // Animate the heart
            binding.btnFavorite.animate()
                .scaleX(1.2f)
                .scaleY(1.2f)
                .setDuration(150)
                .withEndAction {
                    binding.btnFavorite.animate()
                        .scaleX(1f)
                        .scaleY(1f)
                        .setDuration(150)
                        .start()
                }
                .start()
        }
    }

    private fun updateFavoriteIcon() {
        val iconRes = if (isFavorite) R.drawable.ic_favorite_filled else R.drawable.ic_favorite_border
        binding.btnFavorite.setImageResource(iconRes)
    }
    
    private fun showContextMenu() {
        val movie = viewModel.movie.value ?: return
        
        com.mo.moplayer.ui.common.ContentMenuHelper(this).showContentMenu(
            title = movie.name,
            thumbnailUrl = movie.streamIcon,
            isFavorite = isFavorite,
            details = com.mo.moplayer.ui.common.ContentMenuDetails(
                description = movie.plot,
                duration = movie.duration ?: com.mo.moplayer.ui.common.ContentMenuDetails.formatDuration(movie.durationSeconds),
                rating = movie.rating,
                year = movie.year ?: movie.releaseDate,
                genre = movie.genre
            ),
            onPlay = { playMovie() },
            onToggleFavorite = { toggleFavorite() },
            onInfo = {
                // Info is already displayed on this screen
                Toast.makeText(this, getString(R.string.movie_info_rating), Toast.LENGTH_SHORT).show()
            }
        )
    }

    private fun animateButtonPress(view: View) {
        view.animate()
            .scaleX(0.95f)
            .scaleY(0.95f)
            .setDuration(100)
            .withEndAction {
                view.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(100)
                    .start()
            }
            .start()
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_BACK -> {
                if (maybeHandleExitOnBack()) return true
                finish()
                return true
            }
            KeyEvent.KEYCODE_MENU -> {
                binding.btnPlay.performClick()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }
}
