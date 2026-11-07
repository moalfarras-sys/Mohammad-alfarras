package com.mo.moplayer

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.view.ContextThemeWrapper
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mo.moplayer.data.local.entity.FavoriteEntity
import com.mo.moplayer.data.local.entity.MovieEntity
import com.mo.moplayer.data.local.entity.SeriesEntity
import com.mo.moplayer.ui.favorites.adapters.FavoriteAdapter
import com.mo.moplayer.ui.movies.adapters.MovieAdapter
import com.mo.moplayer.ui.series.adapters.SeriesAdapter
import com.mo.moplayer.util.ThemeManager
import org.junit.Assert.assertSame
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ClassicPosterBindingTest {
    @Test fun metadataAndPositionChangesKeepTheSameCoverAcrossLibraryCards() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        instrumentation.runOnMainSync {
            val context = ContextThemeWrapper(instrumentation.targetContext, R.style.Theme_MoPlayer)
            val parent = FrameLayout(context)
            val theme = ThemeManager(context.applicationContext)
            val movie = MovieEntity("local-qa-movie", 1, 1, "Local QA", "http://127.0.0.1/unused.mp4")
            val movies = MovieAdapter({}, {}, {}, themeManager = theme)
            val movieHolder = movies.onCreateViewHolder(parent, 0)
            movieHolder.bind(movie, 0)
            val sentinel = ColorDrawable(Color.BLUE)
            movieHolder.itemView.findViewById<ImageView>(R.id.ivPoster).setImageDrawable(sentinel)
            movieHolder.bind(movie.copy(name = "Updated title", rating = 8.5), 4)
            assertSame("Movie metadata reloaded/flashed its unchanged cover", sentinel, movieHolder.itemView.findViewById<ImageView>(R.id.ivPoster).drawable)
            movies.onViewRecycled(movieHolder)

            val series = SeriesEntity("local-qa-series", 1, 1, "Local QA")
            val shows = SeriesAdapter({}, {}, {}, themeManager = theme)
            val showHolder = shows.onCreateViewHolder(parent, 0)
            showHolder.bind(series, 0)
            showHolder.itemView.findViewById<ImageView>(R.id.ivPoster).setImageDrawable(sentinel)
            showHolder.bind(series.copy(name = "Updated title", rating = 8.5), 4)
            assertSame("Series metadata reloaded/flashed its unchanged cover", sentinel, showHolder.itemView.findViewById<ImageView>(R.id.ivPoster).drawable)
            shows.onViewRecycled(showHolder)

            val favorite = FavoriteEntity(1, 1, "local-qa-movie", "movie", "Local QA")
            val favorites = FavoriteAdapter({}, {}, themeManager = theme)
            val favoriteHolder = favorites.onCreateViewHolder(parent, 0)
            favoriteHolder.bind(favorite, 0)
            favoriteHolder.itemView.findViewById<ImageView>(R.id.ivPoster).setImageDrawable(sentinel)
            favoriteHolder.bind(favorite.copy(name = "Updated title"), 4)
            assertSame("Favorite metadata reloaded/flashed its unchanged cover", sentinel, favoriteHolder.itemView.findViewById<ImageView>(R.id.ivPoster).drawable)
            favorites.onViewRecycled(favoriteHolder)
        }
    }
}
