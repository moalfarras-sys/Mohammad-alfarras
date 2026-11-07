package com.mo.moplayer

import android.content.Intent
import android.graphics.*
import android.os.SystemClock
import android.view.KeyEvent
import android.view.View
import com.mo.moplayer.data.local.MoPlayerDatabase
import com.mo.moplayer.data.repository.IptvRepository
import com.mo.moplayer.data.local.entity.SeriesEntity
import com.mo.moplayer.data.local.entity.WatchHistoryEntity
import com.mo.moplayer.ui.home.adapters.ContentRowAdapter
import androidx.lifecycle.Lifecycle
import androidx.recyclerview.widget.RecyclerView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mo.moplayer.ui.home.HomeActivity
import com.mo.moplayer.util.DisplayScale
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.flow.first
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

/** Exercises the real imported library, home layout and D-pad. All art/media is a local QA fixture. */
@RunWith(AndroidJUnit4::class)
class ClassicHomeVisualTest {
    @Test fun homeFitsEveryInterfaceSizeAndLanguageAndKeepsRemoteFocus() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val repository = (context.applicationContext as MoPlayerApp).iptvRepository
        val args = InstrumentationRegistry.getArguments()
        val keep = BuildConfig.DEBUG && args.getString("keepFixtures") == "true"
        val previousSize = DisplayScale.interfaceSize(context)
        val previousLanguage = DisplayScale.language(context)
        val previousSource = runBlocking { repository.getActiveServerSync() }
        val files = File(context.cacheDir, "classic-visual-qa").apply { mkdirs() }
        val names = listOf("BLUE HORIZON", "رحلة إلى النجوم", "AFTER THE RAIN", "أحلام المدينة", "NORTH SHORE", "أضواء الليل")
        val colors = intArrayOf(0xff315d92.toInt(), 0xff475889.toInt(), 0xff377870.toInt(), 0xff92623c.toInt(), 0xff4d7495.toInt(), 0xff5d4779.toInt())
        val playlist = buildString {
            appendLine("#EXTM3U")
            repeat(18) { index ->
                val poster = File(files, "poster-$index.jpg")
                val bitmap = Bitmap.createBitmap(480, 720, Bitmap.Config.RGB_565)
                val canvas = Canvas(bitmap)
                val paint = Paint(Paint.ANTI_ALIAS_FLAG)
                paint.shader = LinearGradient(0f, 0f, 480f, 720f, colors[index % 6], 0xff070f21.toInt(), Shader.TileMode.CLAMP)
                canvas.drawRect(0f, 0f, 480f, 720f, paint)
                paint.shader = null; paint.color = 0x22ffffff
                canvas.drawCircle(325f, 210f, 150f, paint)
                paint.color = 0xff10233c.toInt()
                val path = Path().apply { moveTo(0f, 520f); lineTo(180f, 280f); lineTo(390f, 560f); lineTo(480f, 400f); lineTo(480f, 720f); lineTo(0f, 720f); close() }
                canvas.drawPath(path, paint)
                paint.color = Color.WHITE; paint.textSize = 22f; paint.textAlign = Paint.Align.CENTER
                canvas.drawText("MoPlayer • QA ${index + 1}", 240f, 655f, paint)
                poster.outputStream().use { bitmap.compress(Bitmap.CompressFormat.JPEG, 90, it) }; bitmap.recycle()
                appendLine("#EXTINF:-1 tvg-logo=\"${android.net.Uri.fromFile(poster)}\" group-title=\"Cinema • السينما\",${names[index % 6]}")
                appendLine("http://127.0.0.1:18820/movie/$index.mp4")
            }
            repeat(8) { index ->
                appendLine("#EXTINF:-1 group-title=\"Live • مباشر\",MoPlayer Live ${index + 1}")
                appendLine("http://127.0.0.1:18820/live/$index.m3u8")
            }
        }
        val sourceId = requireNotNull(runBlocking { repository.importM3uPlaylist(playlist, "Classic local visual QA") }.data)
        // Use the injected application's Room owner so fixture writes exercise its real
        // invalidation/Flow path. A second Room instance would bypass that notification.
        val fixtureDb = IptvRepository::class.java.getDeclaredField("database").run {
            isAccessible = true
            get(repository) as MoPlayerDatabase
        }
        val historyIds = mutableListOf<String>()
        runBlocking {
            fixtureDb.seriesDao().insertSeries((0 until 8).map { index -> SeriesEntity(
                seriesId = "${sourceId}_qa_series_$index", serverId = sourceId,
                originalSeriesId = index, name = "Series • مسلسل ${index + 1}",
                cover = android.net.Uri.fromFile(File(files, "poster-$index.jpg")).toString(),
                lastModified = System.currentTimeMillis() + index) })
            repository.getRecentlyAddedMovies(sourceId, 6).first().forEachIndexed { index, movie ->
                val id = "${movie.movieId}_MOVIE"
                historyIds += id
                fixtureDb.watchHistoryDao().insertOrUpdate(WatchHistoryEntity(id, movie.movieId, "MOVIE", movie.name,
                    movie.streamIcon, 30_000, 120_000, false, System.currentTimeMillis() + index))
            }
        }
        try {
            instrumentation.setInTouchMode(false)
            for (language in listOf("en", "ar")) for (size in DisplayScale.InterfaceSize.entries) {
                DisplayScale.setLanguage(context, language)
                DisplayScale.setInterfaceSize(context, size)
                ActivityScenario.launch<HomeActivity>(Intent(context, HomeActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)).use { scenario ->
                    val deadline = SystemClock.elapsedRealtime() + 15_000
                    var ready = false
                    while (!ready && SystemClock.elapsedRealtime() < deadline) {
                        scenario.onActivity { activity ->
                            val rowsReady = (activity.findViewById<RecyclerView>(R.id.rvContent).adapter?.itemCount ?: 0) == 3
                            val clockReady = activity.findViewById<android.widget.TextView>(R.id.tvHomeTime).text.isNotBlank()
                            ready = rowsReady && clockReady && activity.hasWindowFocus() &&
                                activity.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)
                        }
                        if (!ready) SystemClock.sleep(100)
                    }
                    assertTrue("Imported home library did not load: $language/$size", ready)
                    instrumentation.waitForIdleSync()
                    scenario.onActivity { activity ->
                        val root = activity.window.decorView
                        val dock = activity.findViewById<View>(R.id.dockHome)
                        val settings = activity.findViewById<View>(R.id.dockSettings)
                        val bounds = Rect()
                        for (view in listOf(dock, settings, activity.findViewById(R.id.btnSearch))) {
                            assertTrue("Clipped action $language/$size", view.getGlobalVisibleRect(bounds))
                            // Focus scales the visible rectangle above the resting layout height.
                            assertTrue("Clipped height $language/$size", bounds.height() >= view.height - 1)
                            assertTrue(bounds.left >= 0 && bounds.right <= root.width)
                        }
                        assertEquals(if (language == "ar") View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR, root.layoutDirection)
                        val clock = activity.findViewById<android.widget.TextView>(R.id.tvHomeTime)
                        assertTrue(clock.text.toString().matches(Regex("[0-9]{2}:[0-9]{2}")))
                        assertEquals(View.GONE, activity.findViewById<View>(R.id.topSignalBar).visibility)
                        assertEquals(View.GONE, activity.findViewById<View>(R.id.previewInfoPanel).visibility)
                        val rows = activity.findViewById<RecyclerView>(R.id.rvContent)
                        val adapter = rows.adapter as ContentRowAdapter
                        assertEquals(listOf("recent_movies", "recent_series", "continue_watching"), adapter.currentList.map { it.id })
                        assertEquals("All three shelves must fit together: $language/$size", 3, rows.childCount)
                        for (index in 0 until rows.childCount) {
                            val row = rows.getChildAt(index)
                            assertTrue("Shelf disappeared: $language/$size", row.getGlobalVisibleRect(bounds))
                            assertEquals("Shelf clipped: $language/$size", row.height, bounds.height())
                        }
                        if (language == "en" && size == DisplayScale.InterfaceSize.STANDARD) {
                            val holder = rows.getChildViewHolder(rows.getChildAt(0)) as ContentRowAdapter.RowViewHolder
                            val rail = rows.getChildAt(0).findViewById<RecyclerView>(R.id.rvRowItems)
                            val card = rail.findViewHolderForAdapterPosition(0) as com.mo.moplayer.ui.home.adapters.ContentItemAdapter.ItemViewHolder
                            val poster = card.itemView.findViewById<android.widget.ImageView>(R.id.ivPoster)
                            val original = poster.drawable
                            val sentinel = android.graphics.drawable.ColorDrawable(Color.BLUE)
                            poster.setImageDrawable(sentinel)
                            val item = holder.itemAdapter.currentList.first()
                            card.bind(item.copy(progress = 42), 0)
                            assertSame("A progress update flashed/reloaded the same cover", sentinel, poster.drawable)
                            assertEquals(42, card.itemView.findViewById<android.widget.ProgressBar>(R.id.progressWatch).progress)
                            poster.setImageDrawable(original)
                            card.bind(item, 0)
                        }
                        assertTrue(dock.requestFocus())
                    }
                    // Real remote browsing must keep the background stable and each rail reachable.
                    scenario.onActivity { activity ->
                        val rows = activity.findViewById<RecyclerView>(R.id.rvContent)
                        val rail = rows.getChildAt(0).findViewById<RecyclerView>(R.id.rvRowItems)
                        assertTrue(rail.findViewHolderForAdapterPosition(0)!!.itemView.requestFocus())
                    }
                    val backward = if (language == "ar") KeyEvent.KEYCODE_DPAD_RIGHT else KeyEvent.KEYCODE_DPAD_LEFT
                    ClassicRemoteInput.press(backward)
                    scenario.onActivity { activity ->
                        val rows = activity.findViewById<RecyclerView>(R.id.rvContent)
                        assertTrue("Rail edge lost focus: $language/$size", rows.getChildAt(0).hasFocus())
                    }
                    repeat(2) { index ->
                        ClassicRemoteInput.press(KeyEvent.KEYCODE_DPAD_DOWN)
                        scenario.onActivity { activity ->
                            val rows = activity.findViewById<RecyclerView>(R.id.rvContent)
                            assertTrue("Next shelf unreachable: $language/$size", rows.getChildAt(index + 1).hasFocus())
                            assertEquals(View.GONE, activity.findViewById<View>(R.id.previewContainer).visibility)
                            assertEquals(View.GONE, activity.findViewById<View>(R.id.previewInfoPanel).visibility)
                        }
                    }
                    ClassicRemoteInput.press(KeyEvent.KEYCODE_DPAD_DOWN)
                    scenario.onActivity { assertEquals(R.id.dockHome, it.currentFocus?.id) }
                    if (language == "en" && size == DisplayScale.InterfaceSize.STANDARD) {
                        val resume = runBlocking { fixtureDb.watchHistoryDao().getHomeContinueWatching().first().first() }
                        runBlocking { fixtureDb.watchHistoryDao().insertOrUpdate(resume.copy(positionMs = 60_000)) }
                        val progressDeadline = SystemClock.elapsedRealtime() + 5_000
                        var updated = false
                        while (!updated && SystemClock.elapsedRealtime() < progressDeadline) {
                            scenario.onActivity { activity ->
                                val rows = activity.findViewById<RecyclerView>(R.id.rvContent)
                                val row = (rows.adapter as ContentRowAdapter).currentList.first { it.id == "continue_watching" }
                                updated = row.items.first { it.id == resume.contentId }.progress == 50
                                assertEquals("A progress update stole remote focus", R.id.dockHome, activity.currentFocus?.id)
                            }
                            if (!updated) SystemClock.sleep(50)
                        }
                        assertTrue("Existing resume progress was discarded because its content id did not change", updated)
                    }
                    val direction = if (language == "ar") KeyEvent.KEYCODE_DPAD_LEFT else KeyEvent.KEYCODE_DPAD_RIGHT
                    repeat(6) {
                        ClassicRemoteInput.press(direction)
                        scenario.onActivity { assertNotNull("Lost remote focus $language/$size", it.currentFocus) }
                    }
                    scenario.onActivity { assertEquals("Settings unreachable from dock $language/$size", R.id.dockSettings, it.currentFocus?.id) }
                    if (args.getString("screenshots") == "true") {
                        SystemClock.sleep(800)
                        val shot = instrumentation.uiAutomation.takeScreenshot()
                        File(context.getExternalFilesDir(null), "classic-home-$language-${size.key}.png").outputStream().use { shot.compress(Bitmap.CompressFormat.PNG, 100, it) }
                        shot.recycle()
                    }
                }
            }
        } finally {
            if (!keep) {
                runBlocking { repository.deleteServer(sourceId); previousSource?.let { repository.setActiveServer(it.id) } }
                runBlocking { historyIds.forEach { fixtureDb.watchHistoryDao().deleteById(it) } }
                files.deleteRecursively()
            }
            // The application owns fixtureDb; closing it would break subsequent player tests.
            DisplayScale.setInterfaceSize(context, previousSize)
            DisplayScale.setLanguage(context, previousLanguage)
        }
    }
}
