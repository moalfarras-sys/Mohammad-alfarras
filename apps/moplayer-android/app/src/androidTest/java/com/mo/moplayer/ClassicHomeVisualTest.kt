package com.mo.moplayer

import android.content.Intent
import android.graphics.*
import android.os.SystemClock
import android.view.KeyEvent
import android.view.View
import androidx.lifecycle.Lifecycle
import androidx.recyclerview.widget.RecyclerView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.mo.moplayer.ui.home.HomeActivity
import com.mo.moplayer.util.DisplayScale
import kotlinx.coroutines.runBlocking
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
                            val rowsReady = (activity.findViewById<RecyclerView>(R.id.rvContent).adapter?.itemCount ?: 0) > 0
                            // Home deliberately defers its clock/widgets until after first content.
                            // A cold launch can have rows while the clock's digit cells are still empty.
                            val clockReady = listOf(R.id.tvHour1, R.id.tvHour2, R.id.tvMinute1, R.id.tvMinute2)
                                .all { activity.findViewById<android.widget.TextView>(it).text.isNotBlank() }
                            ready = rowsReady && clockReady
                        }
                        if (!ready) SystemClock.sleep(100)
                    }
                    assertTrue("Imported home library did not load: $language/$size", ready)
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
                        for (id in listOf(R.id.tvHour1, R.id.tvHour2, R.id.tvMinute1, R.id.tvMinute2)) {
                            val digit = activity.findViewById<android.widget.TextView>(id).text.toString()
                            assertTrue("Digital clock used clipped fallback glyphs: $language/$size", digit.matches(Regex("[0-9]")))
                        }
                        assertTrue(dock.requestFocus())
                    }
                    val direction = if (language == "ar") KeyEvent.KEYCODE_DPAD_LEFT else KeyEvent.KEYCODE_DPAD_RIGHT
                    repeat(6) {
                        instrumentation.sendKeyDownUpSync(direction)
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
                files.deleteRecursively()
            }
            DisplayScale.setInterfaceSize(context, previousSize)
            DisplayScale.setLanguage(context, previousLanguage)
        }
    }
}
