package com.mo.moplayer

import android.content.Intent
import android.graphics.Rect
import android.os.SystemClock
import androidx.recyclerview.widget.RecyclerView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mo.moplayer.ui.movies.MoviesActivity
import com.mo.moplayer.util.DisplayScale
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ClassicLibraryLayoutTest {
    @Test fun movieAndSeriesCategoryHolderKeepsItsEntireFocusOutlineVisible() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val repository = (context.applicationContext as MoPlayerApp).iptvRepository
        val previousSource = runBlocking { repository.getActiveServerSync() }
        val language = DisplayScale.language(context)
        val size = DisplayScale.interfaceSize(context)
        val source = requireNotNull(runBlocking { repository.importM3uPlaylist(
            "#EXTM3U\n#EXTINF:-1 group-title=\"Cinema\",Local QA movie\nhttp://127.0.0.1:18820/movie/0.mp4\n",
            "Classic category layout QA").data })
        try {
            instrumentation.setInTouchMode(false)
            for (locale in listOf("en", "ar")) for (scale in DisplayScale.InterfaceSize.entries) {
                DisplayScale.setLanguage(context, locale)
                DisplayScale.setInterfaceSize(context, scale)
                ActivityScenario.launch<MoviesActivity>(Intent(context, MoviesActivity::class.java)).use { scenario ->
                    var ready = false
                    val deadline = SystemClock.elapsedRealtime() + 10_000
                    while (!ready && SystemClock.elapsedRealtime() < deadline) {
                        scenario.onActivity { activity ->
                            val rail = activity.findViewById<RecyclerView>(R.id.rvCategories)
                            ready = rail.childCount > 0
                            if (ready) assertTrue(rail.getChildAt(0).requestFocus())
                        }
                        if (!ready) SystemClock.sleep(50)
                    }
                    assertTrue("Movie category did not load: $locale/$scale", ready)
                    SystemClock.sleep(250) // Measure the actual end of the focus animation.
                    scenario.onActivity { activity ->
                        val card = activity.findViewById<RecyclerView>(R.id.rvCategories).getChildAt(0)
                        val visible = Rect()
                        assertTrue(card.getGlobalVisibleRect(visible))
                        assertTrue("Category focus clipped horizontally: $locale/$scale (${visible.width()} / ${card.width})", visible.width() >= card.width - 1)
                        assertTrue("Category focus clipped vertically: $locale/$scale", visible.height() >= card.height - 1)
                    }
                    var posterReady = false
                    val posterDeadline = SystemClock.elapsedRealtime() + 10_000
                    while (!posterReady && SystemClock.elapsedRealtime() < posterDeadline) {
                        scenario.onActivity { activity ->
                            val grid = activity.findViewById<RecyclerView>(R.id.rvMovies)
                            posterReady = grid.findViewHolderForAdapterPosition(0)?.itemView?.requestFocus() == true
                        }
                        if (!posterReady) SystemClock.sleep(50)
                    }
                    assertTrue("Movie grid did not load: $locale/$scale", posterReady)
                    SystemClock.sleep(250)
                    scenario.onActivity { activity ->
                        val card = activity.findViewById<RecyclerView>(R.id.rvMovies).findViewHolderForAdapterPosition(0)!!.itemView
                        val border = card.findViewById<android.view.View>(R.id.focusBorder)
                        val content = card.findViewById<android.view.View>(R.id.contentLayout)
                        val visible = Rect()
                        assertTrue(border.getGlobalVisibleRect(visible))
                        assertTrue("First-row poster focus clipped at the grid edge: $locale/$scale", visible.height() >= border.height * content.scaleY - 2)
                    }
                }
            }
        } finally {
            runBlocking { repository.deleteServer(source); previousSource?.let { repository.setActiveServer(it.id) } }
            DisplayScale.setLanguage(context, language)
            DisplayScale.setInterfaceSize(context, size)
        }
    }
}
