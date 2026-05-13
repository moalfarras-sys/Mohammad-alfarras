package com.moalfarras.moplayer.data.repository

import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import androidx.core.content.FileProvider
import com.moalfarras.moplayer.data.network.WebApiEndpoint
import com.moalfarras.moplayerpro.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

data class AppUpdateInfo(
    val currentVersionName: String = BuildConfig.VERSION_NAME,
    val currentVersionCode: Int = BuildConfig.VERSION_CODE,
    val latestVersionName: String = BuildConfig.VERSION_NAME,
    val latestVersionCode: Int = BuildConfig.VERSION_CODE,
    val downloadUrl: String = defaultDownloadUrl(),
    val apkSizeBytes: Long? = null,
    val checksumSha256: String = "",
    val releaseNotes: String = "",
    val weatherBackgroundUrl: String = "",
    val weatherBackgroundMode: String = "auto",
) {
    val updateAvailable: Boolean = latestVersionCode > currentVersionCode
}

sealed class UpdateInstallResult {
    data object InstallerOpened : UpdateInstallResult()
    data object InstallPermissionRequired : UpdateInstallResult()
    data class Failed(val message: String) : UpdateInstallResult()
}

class UpdateRepository(private val context: Context) {
    suspend fun fetchUpdateInfo(): AppUpdateInfo = withContext(Dispatchers.IO) {
        runCatching {
            val body = fetchConfigBody()
            val root = JSONObject(body)
            val config = root.optJSONObject("config") ?: root
            val update = config.optJSONObject("update")
            val downloadUrl = update?.optString("downloadUrl")
                ?: config.optString("downloadUrl", defaultDownloadUrl())
            AppUpdateInfo(
                latestVersionName = update?.optString("latestVersionName")
                    ?: config.optString("latestVersionName", BuildConfig.VERSION_NAME),
                latestVersionCode = update?.optInt("latestVersionCode")
                    ?: config.optInt("latestVersionCode", config.optInt("minimumVersionCode", BuildConfig.VERSION_CODE)),
                downloadUrl = absolutize(downloadUrl.ifBlank { defaultDownloadUrl() }),
                apkSizeBytes = (update?.optLong("apkSizeBytes") ?: config.optLong("apkSizeBytes", 0L))
                    .takeIf { it > 0L },
                checksumSha256 = update?.optString("checksumSha256")
                    ?: config.optString("checksumSha256", ""),
                releaseNotes = update?.optString("releaseNotes")
                    ?: config.optString("releaseNotes", ""),
                weatherBackgroundUrl = config.optString("weatherBackgroundUrl", ""),
                weatherBackgroundMode = config.optString("weatherBackgroundMode", "auto"),
            )
        }.getOrElse { AppUpdateInfo() }
    }

    suspend fun downloadAndOpenInstaller(
        info: AppUpdateInfo,
        onProgress: (Int) -> Unit,
    ): UpdateInstallResult = withContext(Dispatchers.IO) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !context.packageManager.canRequestPackageInstalls()) {
            openInstallPermissionSettings()
            return@withContext UpdateInstallResult.InstallPermissionRequired
        }

        val file = updateFile()
        file.parentFile?.mkdirs()
        if (file.exists()) file.delete()

        val manager = context.getSystemService(DownloadManager::class.java)
        val request = DownloadManager.Request(Uri.parse(info.downloadUrl))
            .setTitle("MoPlayer Pro ${info.latestVersionName}")
            .setDescription("Downloading the latest MoPlayer Pro APK")
            .setMimeType(APK_MIME_TYPE)
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setAllowedOverMetered(true)
            .setAllowedOverRoaming(true)
            .setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, UPDATE_FILE_NAME)

        val downloadId = manager.enqueue(request)
        val result = waitForDownload(manager, downloadId, onProgress)
        if (result !is UpdateInstallResult.InstallerOpened) return@withContext result
        openInstaller(file)
    }

    fun openDownloadInBrowser(info: AppUpdateInfo = AppUpdateInfo()) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(info.downloadUrl)).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    private fun fetchConfigBody(): String {
        var lastError: Throwable? = null
        WebApiEndpoint.candidateUrls("/api/app/config?product=${BuildConfig.APP_PRODUCT_SLUG}").forEach { urlString ->
            try {
                val connection = (URL(urlString).openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 8_000
                    readTimeout = 8_000
                    setRequestProperty("Accept", "application/json")
                }
                return try {
                    val stream = if (connection.responseCode in 200..299) {
                        connection.inputStream
                    } else {
                        connection.errorStream ?: connection.inputStream
                    }
                    stream.bufferedReader().use { it.readText() }
                } finally {
                    connection.disconnect()
                }
            } catch (error: Throwable) {
                lastError = error
            }
        }
        throw lastError ?: IllegalStateException("Update config endpoint unavailable")
    }

    private suspend fun waitForDownload(
        manager: DownloadManager,
        downloadId: Long,
        onProgress: (Int) -> Unit,
    ): UpdateInstallResult {
        val query = DownloadManager.Query().setFilterById(downloadId)
        while (true) {
            manager.query(query)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
                    val downloaded = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))
                    val total = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
                    if (total > 0) onProgress(((downloaded * 100) / total).toInt().coerceIn(0, 100))
                    when (status) {
                        DownloadManager.STATUS_SUCCESSFUL -> {
                            onProgress(100)
                            return UpdateInstallResult.InstallerOpened
                        }
                        DownloadManager.STATUS_FAILED -> {
                            val reason = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON))
                            return UpdateInstallResult.Failed("Download failed ($reason)")
                        }
                    }
                }
            }
            delay(500)
        }
    }

    private fun openInstaller(file: File): UpdateInstallResult {
        if (!file.exists()) return UpdateInstallResult.Failed("Downloaded APK was not found")
        val uri = FileProvider.getUriForFile(context, "${BuildConfig.APPLICATION_ID}.fileprovider", file)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, APK_MIME_TYPE)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        return try {
            context.startActivity(intent)
            UpdateInstallResult.InstallerOpened
        } catch (error: ActivityNotFoundException) {
            UpdateInstallResult.Failed(error.message ?: "No APK installer was found")
        }
    }

    private fun openInstallPermissionSettings() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
            data = Uri.parse("package:${BuildConfig.APPLICATION_ID}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        runCatching { context.startActivity(intent) }
    }

    private fun updateFile(): File =
        File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), UPDATE_FILE_NAME)

    private fun absolutize(url: String): String =
        if (url.startsWith("http://") || url.startsWith("https://")) url
        else "${BuildConfig.WEB_API_BASE_URL.trimEnd('/')}/${url.trimStart('/')}"

    companion object {
        private const val UPDATE_FILE_NAME = "moplayer-pro-latest.apk"
        private const val APK_MIME_TYPE = "application/vnd.android.package-archive"
    }
}

private fun defaultDownloadUrl(): String =
    "${BuildConfig.WEB_API_BASE_URL.trimEnd('/')}/api/app/download/latest?product=${BuildConfig.APP_PRODUCT_SLUG}"
