package com.moalfarras.moplayer.data.repository

import android.app.PendingIntent
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.IntentSender
import android.content.pm.PackageInstaller
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import androidx.core.content.FileProvider
import androidx.core.content.pm.PackageInfoCompat
import com.moalfarras.moplayer.data.network.NetworkModule
import com.moalfarras.moplayerpro.BuildConfig
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.io.InterruptedIOException
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

/** What the server says about the newest build, next to the installed one. */
data class AppUpdateInfo(
    val latestVersionName: String,
    val latestVersionCode: Int,
    val downloadUrl: String,
    val apkSizeBytes: Long? = null,
    val checksumSha256: String = "",
    val releaseNotes: String = "",
    val downloaderCode: String = "",
    val currentVersionCode: Int = BuildConfig.VERSION_CODE,
    val currentVersionName: String = BuildConfig.VERSION_NAME,
) {
    val updateAvailable: Boolean get() = isNewerVersion(latestVersionCode, currentVersionCode)
}

/** True only when the server named a real build that is newer than the installed one. */
fun isNewerVersion(latestVersionCode: Int, currentVersionCode: Int): Boolean =
    latestVersionCode > 0 && latestVersionCode > currentVersionCode

/** Update metadata from a config, or null when the server did not name a latest build. */
fun AppRemoteConfig.updateInfo(
    currentVersionCode: Int = BuildConfig.VERSION_CODE,
    currentVersionName: String = BuildConfig.VERSION_NAME,
): AppUpdateInfo? {
    if (latestVersionCode <= 0) return null
    return AppUpdateInfo(
        latestVersionName = latestVersionName.ifBlank { latestVersionCode.toString() },
        latestVersionCode = latestVersionCode,
        downloadUrl = downloadUrl,
        apkSizeBytes = apkSizeBytes,
        checksumSha256 = checksumSha256,
        releaseNotes = releaseNotes,
        downloaderCode = downloaderCode,
        currentVersionCode = currentVersionCode,
        currentVersionName = currentVersionName,
    )
}

/** Every way an update can fail; the UI maps each to a localized sentence. */
enum class UpdateError {
    NETWORK,
    SERVER,
    STALLED,
    STORAGE,
    CHECKSUM,
    INVALID_APK,
    INSTALL_CANCELLED,
    INSTALL_BLOCKED,
    INSTALL_CONFLICT,
    INSTALL_INCOMPATIBLE,
    INSTALL_STORAGE,
    INSTALLER_UNAVAILABLE,
    INSTALL_FAILED,
    UNKNOWN,
}

class UpdateException(
    val error: UpdateError,
    val detail: String = "",
    cause: Throwable? = null,
) : Exception("${error.name} $detail", cause)

/** Which settings screen [UpdateRepository.openInstallPermissionSettings] managed to open. */
enum class InstallSettingsTarget { PER_APP, UNKNOWN_SOURCES_LIST, SECURITY, APP_DETAILS, NONE }

internal enum class ChecksumStatus { MATCH, MISMATCH, MISSING }

/**
 * Compares the advertised SHA-256 with the file's. A blank or malformed advertised value is
 * MISSING (the APK is still checked by package name and version before install).
 */
internal fun checksumStatus(expected: String, actualHex: String): ChecksumStatus {
    val normalized = expected.trim().lowercase().removePrefix("sha256:").filterNot { it.isWhitespace() }
    if (normalized.length != 64 || normalized.any { it !in '0'..'9' && it !in 'a'..'f' }) return ChecksumStatus.MISSING
    return if (normalized == actualHex.lowercase()) ChecksumStatus.MATCH else ChecksumStatus.MISMATCH
}

/** The APK must be this product (release package, even from a debug build) and newer than what runs. */
internal fun archiveIsUpdate(
    packageName: String?,
    versionCode: Long,
    expectedPackage: String,
    currentVersionCode: Int,
): Boolean = packageName == expectedPackage && versionCode > currentVersionCode

/** How to treat a response to a (possibly ranged) download request. */
internal enum class ResumeAction { APPEND, RESTART, DISCARD_PARTIAL, FAIL }

/**
 * [requestedOffset] is how many bytes were already on disk (0 = no Range header). A 206 must start
 * exactly there; a 200 means the server ignored Range, so the file starts over; 416 means the
 * partial file no longer fits the resource and must be thrown away.
 */
internal fun resumeAction(requestedOffset: Long, responseCode: Int, contentRange: String?): ResumeAction = when (responseCode) {
    200 -> ResumeAction.RESTART
    206 -> if (requestedOffset > 0 && parseContentRange(contentRange)?.first == requestedOffset) ResumeAction.APPEND else ResumeAction.DISCARD_PARTIAL
    416 -> ResumeAction.DISCARD_PARTIAL
    else -> ResumeAction.FAIL
}

/** "bytes 100-999/1000" -> (100, 1000); the total is null when the server sends "*". */
internal fun parseContentRange(value: String?): Pair<Long, Long?>? {
    val match = CONTENT_RANGE.matchEntire(value?.trim().orEmpty()) ?: return null
    val start = match.groupValues[1].toLongOrNull() ?: return null
    return start to match.groupValues[3].toLongOrNull()
}

private val CONTENT_RANGE = Regex("""bytes\s+(\d+)-(\d+)/(\d+|\*)""", RegexOption.IGNORE_CASE)

internal fun sha256Hex(file: File): String {
    val digest = MessageDigest.getInstance("SHA-256")
    file.inputStream().use { input ->
        val buffer = ByteArray(128 * 1024)
        while (true) {
            val read = input.read(buffer)
            if (read < 0) break
            digest.update(buffer, 0, read)
        }
    }
    return digest.digest().joinToString("") { "%02x".format(it) }
}

/**
 * Downloads, verifies and installs MoPlayer Pro APKs. The APK lives in app-private storage
 * (filesDir/updates) as `moplayer-pro-<code>.apk`; while downloading it is `.part`, which a later
 * attempt resumes with an HTTP Range request. Nothing here launches UI: activities are started by
 * the caller from the foreground.
 */
class UpdateRepository(private val context: Context) {
    private val client: OkHttpClient by lazy {
        NetworkModule.okHttp.newBuilder()
            .connectTimeout(15, TimeUnit.SECONDS)
            // The gap allowed between two reads: a socket that delivers nothing for this long is a
            // stall and is retried with Range instead of hanging forever.
            .readTimeout(STALL_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .callTimeout(0, TimeUnit.MILLISECONDS)
            .build()
    }

    private val updatesDir: File get() = File(context.filesDir, "updates")

    private fun apkFile(versionCode: Int) = File(updatesDir, "moplayer-pro-$versionCode.apk")

    private fun partialFile(versionCode: Int) = File(updatesDir, "moplayer-pro-$versionCode.apk.part")

    /** Removes APKs and partial files for any build other than [keepVersionCode]. */
    fun deleteStaleFiles(keepVersionCode: Int?) {
        val keep = keepVersionCode?.let { setOf(apkFile(it).name, partialFile(it).name) }.orEmpty()
        updatesDir.listFiles()?.forEach { file -> if (file.name !in keep) file.delete() }
        legacyInstallCopy()?.delete()
    }

    /** A finished APK for [info] that passes verification, or null (a failing file is deleted). */
    suspend fun verifiedApk(info: AppUpdateInfo): File? = withContext(Dispatchers.IO) {
        val file = apkFile(info.latestVersionCode)
        if (!file.isFile) return@withContext null
        if (verify(file, info) == null) {
            file
        } else {
            file.delete()
            null
        }
    }

    /**
     * Downloads [info] into the partial file and returns the finished APK. Network drops and stalls
     * are resumed from the bytes already on disk; only [MAX_ATTEMPTS_WITHOUT_PROGRESS] attempts in a
     * row that add nothing end in [UpdateError.STALLED] or [UpdateError.NETWORK].
     *
     * @param onProgress (bytes on disk, total or -1, reconnecting)
     */
    suspend fun download(
        info: AppUpdateInfo,
        onProgress: (Long, Long, Boolean) -> Unit,
    ): File = withContext(Dispatchers.IO) {
        if (!updatesDir.isDirectory && !updatesDir.mkdirs()) throw UpdateException(UpdateError.STORAGE)
        val part = partialFile(info.latestVersionCode)
        val target = apkFile(info.latestVersionCode)
        val remaining = (info.apkSizeBytes ?: 0L) - part.length()
        if (remaining > 0 && updatesDir.usableSpace < remaining + FREE_SPACE_MARGIN_BYTES) {
            throw UpdateException(UpdateError.STORAGE)
        }
        var knownTotal = info.apkSizeBytes ?: -1L
        val report: (Long, Long, Boolean) -> Unit = { written, total, reconnecting ->
            if (total > 0) knownTotal = total
            onProgress(written, knownTotal, reconnecting)
        }
        var failuresWithoutProgress = 0
        while (true) {
            coroutineContext.ensureActive()
            val before = part.length()
            try {
                downloadOnce(info.downloadUrl, part, report)
                break
            } catch (error: UpdateException) {
                // Cancelling closes the socket, which surfaces here as a network error: report the
                // cancellation instead, so a cancelled download never ends as "failed".
                coroutineContext.ensureActive()
                val retryable = error.error == UpdateError.NETWORK || error.error == UpdateError.STALLED
                failuresWithoutProgress = if (part.length() > before) 1 else failuresWithoutProgress + 1
                if (!retryable || failuresWithoutProgress > MAX_ATTEMPTS_WITHOUT_PROGRESS) throw error
                report(part.length(), -1L, true)
                delay(RETRY_DELAYS_MS[(failuresWithoutProgress - 1).coerceIn(0, RETRY_DELAYS_MS.lastIndex)])
            }
        }
        target.delete()
        if (!part.renameTo(target)) throw UpdateException(UpdateError.STORAGE, "rename")
        target
    }

    private suspend fun downloadOnce(
        url: String,
        part: File,
        onProgress: (Long, Long, Boolean) -> Unit,
    ) = coroutineScope {
        val offset = if (part.isFile) part.length() else 0L
        val request = Request.Builder()
            .url(url)
            // Transparent gzip would make ranges and lengths refer to the compressed stream.
            .header("Accept-Encoding", "identity")
            .apply { if (offset > 0) header("Range", "bytes=$offset-") }
            .build()
        val call = client.newCall(request)
        // A blocked socket read ignores coroutine cancellation; cancelling the call unblocks it.
        val canceller = launch { try { awaitCancellation() } finally { call.cancel() } }
        try {
            call.execute().use { response ->
                val action = resumeAction(offset, response.code, response.header("Content-Range"))
                when (action) {
                    ResumeAction.FAIL -> throw UpdateException(UpdateError.SERVER, "HTTP ${response.code}")
                    ResumeAction.DISCARD_PARTIAL -> {
                        part.delete()
                        throw UpdateException(UpdateError.NETWORK, "range")
                    }
                    ResumeAction.APPEND, ResumeAction.RESTART -> Unit
                }
                val append = action == ResumeAction.APPEND
                val start = if (append) offset else 0L
                val bodyLength = response.body.contentLength()
                // Only the server's own length decides completeness; the config size is display-only.
                val total = when {
                    append -> parseContentRange(response.header("Content-Range"))?.second
                        ?: bodyLength.takeIf { it >= 0 }?.let { it + offset }
                    else -> bodyLength.takeIf { it >= 0 }
                } ?: -1L
                var written = start
                var lastReport = 0L
                onProgress(written, total, false)
                val output = try {
                    FileOutputStream(part, append)
                } catch (error: IOException) {
                    throw UpdateException(UpdateError.STORAGE, cause = error)
                }
                output.use { out ->
                    response.body.byteStream().use { input ->
                        val buffer = ByteArray(64 * 1024)
                        while (true) {
                            coroutineContext.ensureActive()
                            val read = input.read(buffer)
                            if (read < 0) break
                            try {
                                out.write(buffer, 0, read)
                            } catch (error: IOException) {
                                throw UpdateException(UpdateError.STORAGE, cause = error)
                            }
                            written += read
                            val now = System.nanoTime()
                            if (now - lastReport > PROGRESS_INTERVAL_NANOS) {
                                lastReport = now
                                onProgress(written, total, false)
                            }
                        }
                    }
                }
                onProgress(written, total, false)
                if (total > 0 && written < total) throw UpdateException(UpdateError.NETWORK, "short body")
            }
        } catch (error: UpdateException) {
            throw error
        } catch (error: CancellationException) {
            throw error
        } catch (error: InterruptedIOException) {
            // SocketTimeoutException included: no bytes for STALL_TIMEOUT_SECONDS.
            throw UpdateException(UpdateError.STALLED, cause = error)
        } catch (error: IOException) {
            throw UpdateException(UpdateError.NETWORK, error.javaClass.simpleName, error)
        } finally {
            canceller.cancel()
        }
    }

    /** Null when [file] is the advertised, genuine update; otherwise why it must not be installed. */
    suspend fun verify(file: File, info: AppUpdateInfo): UpdateError? = withContext(Dispatchers.IO) {
        val checksum = try {
            checksumStatus(info.checksumSha256, sha256Hex(file))
        } catch (error: IOException) {
            return@withContext UpdateError.STORAGE
        }
        if (checksum == ChecksumStatus.MISMATCH) return@withContext UpdateError.CHECKSUM
        val archive = archivePackageInfo(file) ?: return@withContext UpdateError.INVALID_APK
        val isUpdate = archiveIsUpdate(
            packageName = archive.packageName,
            versionCode = PackageInfoCompat.getLongVersionCode(archive),
            expectedPackage = RELEASE_PACKAGE,
            currentVersionCode = info.currentVersionCode,
        )
        if (isUpdate) null else UpdateError.INVALID_APK
    }

    private fun archivePackageInfo(file: File) = runCatching {
        val manager = context.packageManager
        if (Build.VERSION.SDK_INT >= 33) {
            manager.getPackageArchiveInfo(file.path, PackageManager.PackageInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            manager.getPackageArchiveInfo(file.path, 0)
        }
    }.getOrNull()

    /** Android 8+ asks the user once to allow this app to install others. */
    fun canInstallPackages(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O || context.packageManager.canRequestPackageInstalls()

    /**
     * Streams [file] into a PackageInstaller session and commits it; the result arrives on the
     * IntentSender built by [statusSender]. Our own leftover sessions are abandoned first so an
     * earlier, unconfirmed attempt cannot collide with this one.
     */
    suspend fun commitSession(file: File, statusSender: (sessionId: Int) -> IntentSender): Int = withContext(Dispatchers.IO) {
        val installer = context.packageManager.packageInstaller
        installer.mySessions.forEach { session -> runCatching { installer.abandonSession(session.sessionId) } }
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL).apply {
            setAppPackageName(RELEASE_PACKAGE)
            setSize(file.length())
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) setInstallReason(PackageManager.INSTALL_REASON_USER)
        }
        val sessionId = installer.createSession(params)
        try {
            installer.openSession(sessionId).use { session ->
                session.openWrite("base.apk", 0, file.length()).use { output ->
                    file.inputStream().use { input -> input.copyTo(output, 256 * 1024) }
                    session.fsync(output)
                }
                session.commit(statusSender(sessionId))
            }
        } catch (error: Exception) {
            runCatching { installer.abandonSession(sessionId) }
            throw error
        }
        sessionId
    }

    /** PendingIntent flags for the session status: the system must add the result extras. */
    fun statusPendingIntentFlags(): Int =
        PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0

    /**
     * The classic "open this APK" intent, used when the session API is unavailable. Android 7+
     * reads it through the FileProvider; Android 6's installer only accepts file:// URIs and cannot
     * read app-private files, so there the APK is copied to the app's external files directory.
     * Blocking (that copy): call it off the main thread.
     */
    fun legacyInstallIntent(file: File): Intent {
        val intent = Intent(Intent.ACTION_VIEW)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val uri = FileProvider.getUriForFile(context, "${BuildConfig.APPLICATION_ID}.fileprovider", file)
            intent.setDataAndType(uri, APK_MIME_TYPE).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        } else {
            val copy = legacyInstallCopy() ?: throw UpdateException(UpdateError.INSTALLER_UNAVAILABLE, "no external storage")
            try {
                file.copyTo(copy, overwrite = true)
            } catch (error: IOException) {
                throw UpdateException(UpdateError.STORAGE, cause = error)
            }
            intent.setDataAndType(Uri.fromFile(copy), APK_MIME_TYPE)
        }
        return intent
    }

    private fun legacyInstallCopy(): File? =
        context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)?.let { File(it, LEGACY_APK_NAME) }

    /**
     * Opens the best available screen to allow installs from this app, from an Activity. Some TV
     * builds have no per-app screen, so the generic lists and the security page are tried next.
     * Each launch is attempted directly: package visibility can hide Settings from resolveActivity.
     */
    fun openInstallPermissionSettings(activityContext: Context): InstallSettingsTarget {
        val packageUri = Uri.parse("package:${context.packageName}")
        val candidates = buildList {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                add(InstallSettingsTarget.PER_APP to Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, packageUri))
                add(InstallSettingsTarget.UNKNOWN_SOURCES_LIST to Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES))
            }
            add(InstallSettingsTarget.SECURITY to Intent(Settings.ACTION_SECURITY_SETTINGS))
            add(InstallSettingsTarget.APP_DETAILS to Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageUri))
        }
        return candidates.firstOrNull { (_, intent) -> tryStart(activityContext, intent) }?.first ?: InstallSettingsTarget.NONE
    }

    /** Opens the APK link in a browser. False when this device has none (common on Android TV). */
    fun openDownloadPage(activityContext: Context, url: String): Boolean =
        tryStart(activityContext, Intent(Intent.ACTION_VIEW, Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE))

    private fun tryStart(activityContext: Context, intent: Intent): Boolean {
        if (activityContext === activityContext.applicationContext) intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return try {
            activityContext.startActivity(intent)
            true
        } catch (_: ActivityNotFoundException) {
            false
        } catch (_: SecurityException) {
            false
        }
    }

    companion object {
        /** The product package; debug builds (".debug") still install the release APK. */
        val RELEASE_PACKAGE: String = BuildConfig.APPLICATION_ID.removeSuffix(".debug")
        private const val APK_MIME_TYPE = "application/vnd.android.package-archive"
        private const val LEGACY_APK_NAME = "moplayer-pro-update.apk"
        private const val STALL_TIMEOUT_SECONDS = 30L
        private const val MAX_ATTEMPTS_WITHOUT_PROGRESS = 4
        private val RETRY_DELAYS_MS = longArrayOf(2_000L, 5_000L, 10_000L, 20_000L)
        private const val PROGRESS_INTERVAL_NANOS = 250_000_000L
        private const val FREE_SPACE_MARGIN_BYTES = 20L * 1024L * 1024L
    }
}
