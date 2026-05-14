package com.mo.moplayer.util

import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.BaseColumns
import androidx.tvprovider.media.tv.TvContractCompat
import androidx.tvprovider.media.tv.WatchNextProgram
import com.mo.moplayer.R
import com.mo.moplayer.ui.player.PlayerActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Android TV Watch Next helper.
 *
 * Publishes recently-played content to the "Continue Watching" row on
 * the Android TV home screen (requires API 26+). This is the single most
 * impactful Android TV platform integration for user retention.
 *
 * Note:
 * - Requires `com.android.providers.tv.permission.WRITE_EPG_DATA`.
 * - Gracefully degrades on API < 26 and on devices where EPG_WRITE is denied.
 */
class TvRecommendationHelper(private val context: Context) {

    private val appContext = context.applicationContext

    companion object {
        private const val TAG = "TvRecommendations"
    }

    /**
     * Publish a "Continue Watching" item.
     */
    suspend fun publishWatchNext(
        contentId: String,
        title: String,
        subtitle: String? = null,
        posterUrl: String? = null,
        type: String,
        progressMs: Long,
        durationMs: Long = 0,
        resumeUrl: String
    ) = withContext(Dispatchers.IO) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@withContext
        if (resumeUrl.isBlank() || title.isBlank()) return@withContext

        val deepLinkUri = Uri.parse(
            "moplayer://play/?" +
                "url=${Uri.encode(resumeUrl)}&" +
                "title=${Uri.encode(title)}&" +
                "type=${Uri.encode(type)}&" +
                "content_id=${Uri.encode(contentId)}&" +
                "resume=$progressMs"
        )

        val playIntent = Intent(appContext, PlayerActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            data = deepLinkUri
            putExtra(PlayerActivity.EXTRA_STREAM_URL, resumeUrl)
            putExtra(PlayerActivity.EXTRA_TITLE, title)
            putExtra(PlayerActivity.EXTRA_TYPE, type.uppercase())
            putExtra(PlayerActivity.EXTRA_CONTENT_ID, contentId)
            putExtra(PlayerActivity.EXTRA_RESUME_POSITION, progressMs)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val programType = when (type.lowercase()) {
            "movie" -> TvContractCompat.WatchNextPrograms.TYPE_MOVIE
            "series" -> TvContractCompat.WatchNextPrograms.TYPE_TV_SERIES
            else -> TvContractCompat.WatchNextPrograms.TYPE_CHANNEL
        }

        val watchNextType = if (progressMs < 5000) {
            TvContractCompat.WatchNextPrograms.WATCH_NEXT_TYPE_NEW
        } else {
            TvContractCompat.WatchNextPrograms.WATCH_NEXT_TYPE_CONTINUE
        }

        val builder = WatchNextProgram.Builder()
            .setInternalProviderId(contentId)
            .setTitle(title)
            .setDescription(subtitle ?: "")
            .setType(programType)
            .setWatchNextType(watchNextType)
            .setLastEngagementTimeUtcMillis(System.currentTimeMillis())
            .setIntent(playIntent)

        if (progressMs > 0) {
            builder.setLastPlaybackPositionMillis(progressMs.toInt())
        }
        if (durationMs > 0) {
            builder.setDurationMillis(durationMs.toInt())
        }
        if (!posterUrl.isNullOrBlank()) {
            builder.setPosterArtUri(Uri.parse(posterUrl))
        }

        try {
            val contentUri = TvContractCompat.WatchNextPrograms.CONTENT_URI
            val existing = appContext.contentResolver.query(
                contentUri,
                arrayOf(BaseColumns._ID),
                "${TvContractCompat.WatchNextPrograms.COLUMN_INTERNAL_PROVIDER_ID} = ?",
                arrayOf(contentId),
                null
            )
            val id = existing?.use { c ->
                if (c.moveToFirst()) c.getLong(0) else null
            }

            if (id != null) {
                val updateUri = ContentUris.withAppendedId(contentUri, id)
                appContext.contentResolver.update(updateUri, builder.build().toContentValues(), null, null)
            } else {
                appContext.contentResolver.insert(contentUri, builder.build().toContentValues())
            }
        } catch (e: SecurityException) {
            android.util.Log.w(TAG, "EPG_WRITE denied; Watch Next unavailable on this device.")
        } catch (e: Exception) {
            android.util.Log.w(TAG, "Watch Next publish failed: ${e.message}")
        }
    }

    /**
     * Remove a Watch Next entry.
     */
    suspend fun removeWatchNext(contentId: String) = withContext(Dispatchers.IO) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@withContext
        try {
            appContext.contentResolver.delete(
                TvContractCompat.WatchNextPrograms.CONTENT_URI,
                "${TvContractCompat.WatchNextPrograms.COLUMN_INTERNAL_PROVIDER_ID} = ?",
                arrayOf(contentId)
            )
        } catch (_: Exception) { }
    }
}
