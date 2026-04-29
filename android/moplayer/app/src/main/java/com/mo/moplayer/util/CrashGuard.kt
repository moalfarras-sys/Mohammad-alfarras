package com.mo.moplayer.util

import android.content.Context
import android.os.Build
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.max

object CrashGuard {
    private const val PREFS = "moplayer_crash_guard"
    private const val KEY_LAST_CRASH_TIME = "last_crash_time"
    private const val KEY_LAST_CRASH_SUMMARY = "last_crash_summary"
    private const val KEY_LAST_CRASH_STACK = "last_crash_stack"
    private const val KEY_RECENT_CRASH_COUNT = "recent_crash_count"
    private const val KEY_LAST_STABLE_TIME = "last_stable_time"
    private const val CRASH_LOOP_WINDOW_MS = 10 * 60 * 1000L
    private const val SAFE_MODE_CRASH_COUNT = 2

    @Volatile
    private var installed = false

    fun install(context: Context) {
        if (installed) return
        installed = true

        val appContext = context.applicationContext
        val previous = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            recordCrash(appContext, thread.name, throwable)
            previous?.uncaughtException(thread, throwable)
        }
    }

    fun shouldUseSafeMode(context: Context): Boolean {
        val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val lastCrashTime = prefs.getLong(KEY_LAST_CRASH_TIME, 0L)
        val stableTime = prefs.getLong(KEY_LAST_STABLE_TIME, 0L)
        val recentCount = prefs.getInt(KEY_RECENT_CRASH_COUNT, 0)
        val withinWindow = System.currentTimeMillis() - lastCrashTime <= CRASH_LOOP_WINDOW_MS
        return withinWindow && lastCrashTime > stableTime && recentCount >= SAFE_MODE_CRASH_COUNT
    }

    fun markStable(context: Context) {
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putLong(KEY_LAST_STABLE_TIME, System.currentTimeMillis())
            .putInt(KEY_RECENT_CRASH_COUNT, 0)
            .apply()
    }

    fun lastCrashSummary(context: Context): String? {
        val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        return prefs.getString(KEY_LAST_CRASH_SUMMARY, null)?.takeIf { it.isNotBlank() }
    }

    fun lastCrashDiagnostic(context: Context): String? {
        val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val summary = prefs.getString(KEY_LAST_CRASH_SUMMARY, null)?.takeIf { it.isNotBlank() } ?: return null
        val stack = prefs.getString(KEY_LAST_CRASH_STACK, null).orEmpty()
        return buildString {
            appendLine(summary)
            if (stack.isNotBlank()) append(stack)
        }.trim().take(2200)
    }

    private fun recordCrash(context: Context, threadName: String, throwable: Throwable) {
        runCatching {
            val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val now = System.currentTimeMillis()
            val previousCrashTime = prefs.getLong(KEY_LAST_CRASH_TIME, 0L)
            val previousCount = prefs.getInt(KEY_RECENT_CRASH_COUNT, 0)
            val recentCount = if (now - previousCrashTime <= CRASH_LOOP_WINDOW_MS) previousCount + 1 else 1
            val summary = buildSummary(threadName, throwable, now)
            val stack = throwable.stackTraceToStringSafe()

            prefs.edit()
                .putLong(KEY_LAST_CRASH_TIME, now)
                .putString(KEY_LAST_CRASH_SUMMARY, summary)
                .putString(KEY_LAST_CRASH_STACK, stack)
                .putInt(KEY_RECENT_CRASH_COUNT, max(1, recentCount))
                .apply()
        }
    }

    private fun buildSummary(threadName: String, throwable: Throwable, timestamp: Long): String {
        val date = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date(timestamp))
        val type = throwable::class.java.simpleName.ifBlank { "Throwable" }
        val message = throwable.message.orEmpty().replace(Regex("\\s+"), " ").take(240)
        return "Last crash: $date / $type on $threadName / Android ${Build.VERSION.SDK_INT}" +
            if (message.isBlank()) "" else " / $message"
    }

    private fun Throwable.stackTraceToStringSafe(): String {
        return runCatching {
            val writer = StringWriter()
            printStackTrace(PrintWriter(writer))
            writer.toString().take(1800)
        }.getOrDefault("${this::class.java.name}: ${message.orEmpty()}")
    }
}
