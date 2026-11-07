package com.mo.moplayer

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.*
import android.os.SystemClock
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mo.moplayer.data.local.MoPlayerDatabase
import com.mo.moplayer.data.local.entity.EpisodeEntity
import com.mo.moplayer.data.local.entity.SeriesEntity
import com.mo.moplayer.data.local.entity.WatchHistoryEntity
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.ui.epg.EpgGuideActivity
import com.mo.moplayer.ui.favorites.FavoritesActivity
import com.mo.moplayer.ui.movies.MovieDetailActivity
import com.mo.moplayer.ui.movies.MoviesActivity
import com.mo.moplayer.ui.search.SearchActivity
import com.mo.moplayer.ui.series.SeriesActivity
import com.mo.moplayer.ui.series.SeriesDetailActivity
import com.mo.moplayer.ui.settings.SettingsActivity
import com.mo.moplayer.util.TvUiPreferences
import com.mo.moplayer.util.DisplayScale
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

/** Real product screens with a private synthetic source. Does not launch activation or a player. */
@RunWith(AndroidJUnit4::class)
class ClassicSurfaceVisualTest {
    @Test fun allSettingsPanelsAndLibraryDetailsKeepTheirPrimaryActionsVisible() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        check(BuildConfig.DEBUG && context.packageName.endsWith(".debug"))
        val repository = (context.applicationContext as MoPlayerApp).iptvRepository
        val db = IptvRepository::class.java.getDeclaredField("database").run { isAccessible = true; get(repository) as MoPlayerDatabase }
        val previousSource = runBlocking { repository.getActiveServerSync() }
        val preferences = TvUiPreferences(context)
        val previousLayout = runBlocking { preferences.layoutStyle.first() }
        val previousSize = DisplayScale.interfaceSize(context)
        val previousLanguage = DisplayScale.language(context)
        val directory = File(context.cacheDir, "classic-surface-qa").apply { mkdirs() }
        val poster = File(directory, "cover.png")
        val bitmap = Bitmap.createBitmap(480, 720, Bitmap.Config.RGB_565)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            shader = LinearGradient(0f, 0f, 480f, 720f, 0xff416e9d.toInt(), 0xff091525.toInt(), Shader.TileMode.CLAMP)
        }
        val canvas = Canvas(bitmap)
        canvas.drawRect(0f, 0f, 480f, 720f, paint)
        paint.shader = null; paint.color = 0x4079b9ed; canvas.drawCircle(310f, 230f, 150f, paint)
        paint.color = Color.WHITE; paint.textSize = 30f
        canvas.drawText("MoPlayer / Local QA", 55f, 640f, paint)
        poster.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }; bitmap.recycle()
        val art = android.net.Uri.fromFile(poster).toString()
        val source = requireNotNull(runBlocking { repository.importM3uPlaylist(
            "#EXTM3U\n#EXTINF:-1 tvg-logo=\"$art\" group-title=\"Cinema\",MoPlayer local QA\nhttp://127.0.0.1:18820/movie/0.mp4\n" +
                "#EXTINF:-1 group-title=\"Live\",Local QA channel\nhttp://127.0.0.1:18820/live/0.m3u8\n", "Classic surface QA").data })
        val title = "رحلة إلى النجوم عبر المدن البعيدة • MoPlayer Local QA Extended Edition"
        val plot = "حكاية اختبار محلية لفحص وضوح النص وتوزيع المعلومات والأزرار على الشاشة. ".repeat(18)
        val movie = runBlocking { repository.getRecentlyAddedMovies(source, 1).first().first() }.copy(
            name = title, plot = plot, cast = "Local QA cast • " + title, director = "Local QA", genre = "Drama • دراما", year = "2026", duration = "120 min", rating = 8.5,
            youtubeTrailer = "local-qa-trailer")
        val series = SeriesEntity("${source}_surface_series", source, 1, title, art, plot = plot, genre = "Drama", rating = 8.4)
        runBlocking {
            db.movieDao().updateMovie(movie)
            db.movieDao().insertMovies((1..17).map { movie.copy(movieId = "${movie.movieId}_$it", name = "$it • $title") })
            db.seriesDao().insertSeries((1..11).map { series.copy(seriesId = "${series.seriesId}_$it", name = "$it • $title") })
            db.watchHistoryDao().insertOrUpdate(WatchHistoryEntity("${movie.movieId}_MOVIE", movie.movieId, "MOVIE", title, art, 60_000, 120_000, false))
            db.seriesDao().insertSingleSeries(series)
            db.seriesDao().insertEpisodes((1..6).map { index -> EpisodeEntity(
                "${series.seriesId}_$index", series.seriesId, if (index <= 2) 1 else 2,
                if (index <= 2) index else index - 2, title, index, "http://127.0.0.1:18820/movie/0.mp4", cover = art, plot = plot) })
            repository.toggleFavorite(source, movie.movieId, "movie", movie.name, art)
        }
        data class Screen(val name: String, val intent: Intent, val target: Int, val panel: Boolean = false, val wide: Boolean = false)
        val screens = mutableListOf<Screen>()
        for (panel in listOf("SERVER", "PLAYER", "PARENTAL", "INTERFACE", "UPDATE", "ABOUT")) {
            screens += Screen("settings-${panel.lowercase()}", Intent(context, SettingsActivity::class.java).putExtra("open_panel", panel), R.id.rvCategories, true)
        }
        screens += listOf(
            Screen("movies", Intent(context, MoviesActivity::class.java), R.id.btnSearch),
            Screen("series", Intent(context, SeriesActivity::class.java), R.id.btnSearch),
            Screen("favorites", Intent(context, FavoritesActivity::class.java), R.id.rvFavorites),
            Screen("search", Intent(context, SearchActivity::class.java), R.id.chipAll),
            Screen("epg", Intent(context, EpgGuideActivity::class.java), R.id.btnJumpNow),
            Screen("movie-detail", Intent(context, MovieDetailActivity::class.java).putExtra("movie_id", movie.movieId), R.id.btnPlay),
            Screen("series-detail", Intent(context, SeriesDetailActivity::class.java).putExtra("series_id", series.seriesId), R.id.rvSeasons))
        screens += listOf(
            Screen("movies-rows", Intent(context, MoviesActivity::class.java), R.id.rvMovies, wide = true),
            Screen("series-rows", Intent(context, SeriesActivity::class.java), R.id.rvMovies, wide = true))
        try {
            instrumentation.setInTouchMode(false)
            DisplayScale.setInterfaceSize(context, DisplayScale.InterfaceSize.LARGE)
            for (language in listOf("en", "ar")) {
                DisplayScale.setLanguage(context, language)
                for (screen in screens) {
                    runBlocking { preferences.setLayoutStyle(if (screen.wide) TvUiPreferences.LayoutStyle.ROWS else TvUiPreferences.LayoutStyle.GRID) }
                    ActivityScenario.launch<Activity>(screen.intent).use { scenario ->
                        var ready = false
                        val deadline = SystemClock.elapsedRealtime() + 15_000
                        while (!ready && SystemClock.elapsedRealtime() < deadline) {
                            scenario.onActivity { activity ->
                                val target = activity.findViewById<View>(screen.target)
                                ready = activity.hasWindowFocus() && target?.isShown == true &&
                                    (activity.findViewById<View>(R.id.loadingOverlay)?.visibility != View.VISIBLE)
                                if (target is RecyclerView) {
                                    ready = ready && target.childCount > 0
                                    if (screen.wide) ready = ready && (target.getChildAt(0)?.width ?: 0) > target.width * 0.8f
                                }
                                if (screen.name == "series-detail") ready = ready && (target as? RecyclerView)?.childCount == 2
                            }
                            if (!ready) SystemClock.sleep(50)
                        }
                        assertTrue("Screen never ready: ${screen.name}/$language", ready)
                        if (screen.panel) {
                            scenario.onActivity { it.findViewById<RecyclerView>(R.id.rvCategories).getChildAt(0).requestFocus() }
                            ClassicRemoteInput.press(android.view.KeyEvent.KEYCODE_MENU)
                        } else scenario.onActivity { activity ->
                            val keyboard = activity.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                            keyboard.hideSoftInputFromWindow(activity.window.decorView.windowToken, 0)
                            val target = activity.findViewById<View>(screen.target)
                            val control = if (target is RecyclerView) target.getChildAt(0) else target
                            assertTrue("Action cannot receive focus: ${screen.name}/$language", control.requestFocus())
                        }
                        instrumentation.uiAutomation.waitForIdle(100, 3_000)
                        if (InstrumentationRegistry.getArguments().getString("screenshots") == "true") {
                            val image = instrumentation.uiAutomation.takeScreenshot()
                            File(context.getExternalFilesDir(null), "classic-surface-${screen.name}-$language.png").outputStream().use { image.compress(Bitmap.CompressFormat.PNG, 100, it) }
                            image.recycle()
                        }
                        scenario.onActivity { activity ->
                            val focus = requireNotNull(activity.currentFocus)
                            if (screen.panel) assertFalse("Settings content is unreachable: ${screen.name}/$language", activity.findViewById<RecyclerView>(R.id.rvCategories).hasFocus())
                            val rect = Rect()
                            assertTrue("Action outside screen: ${screen.name}/$language", focus.getGlobalVisibleRect(rect))
                            assertTrue("Action clipped: ${screen.name}/$language (${rect.height()}/${focus.height})", rect.height() >= focus.height - 1)
                            assertTrue(rect.left >= 0 && rect.right <= activity.window.decorView.width)
                            if (screen.wide) {
                                val list = activity.findViewById<RecyclerView>(R.id.rvMovies)
                                val card = list.getChildAt(0)
                                val density = activity.resources.displayMetrics.density
                                assertTrue("Rows must stay compact: ${screen.name}/$language", card.height <= 132 * density)
                                assertTrue("Rows must fill their library column", card.width > list.width * 0.8f)
                                val titleView = card.findViewById<TextView>(R.id.tvTitle)
                                assertTrue("Rows lost their title", titleView.width > card.width / 2 && titleView.lineCount <= 2)
                            }
                            if (screen.name == "movie-detail") {
                                for (id in listOf(R.id.btnPlay, R.id.btnResume, R.id.btnFavorite, R.id.btnTrailer)) {
                                    val action = activity.findViewById<View>(id)
                                    assertEquals("Expected a fully populated action group", View.VISIBLE, action.visibility)
                                    assertTrue("Movie action outside screen: $id/$language", action.getGlobalVisibleRect(rect))
                                    assertTrue("Movie action clipped: $id/$language", rect.height() >= action.height - 1 && rect.width() >= action.width - 1)
                                }
                                val synopsis = activity.findViewById<View>(R.id.movieInfoScroll)
                                assertTrue("Long descriptions must scroll above pinned actions", synopsis.height > 0 && synopsis.canScrollVertically(1))
                            }
                            if (screen.name == "series-detail" &&
                                (activity.resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_TYPE_MASK) == android.content.res.Configuration.UI_MODE_TYPE_TELEVISION) {
                                val second = activity.findViewById<RecyclerView>(R.id.rvSeasons).getChildAt(1).findViewById<TextView>(R.id.tvEpisodeCount)
                                assertEquals(activity.getString(R.string.series_episode_count_short, 4), second.text.toString())
                            }
                        }
                    }
                }
            }
        } finally {
            runBlocking { db.favoriteDao().deleteAllFavorites(source); repository.deleteServer(source); previousSource?.let { repository.setActiveServer(it.id) } }
            runBlocking { db.watchHistoryDao().deleteById("${movie.movieId}_MOVIE") }
            directory.deleteRecursively()
            runBlocking { preferences.setLayoutStyle(previousLayout) }
            DisplayScale.setInterfaceSize(context, previousSize)
            DisplayScale.setLanguage(context, previousLanguage)
        }
    }
}
