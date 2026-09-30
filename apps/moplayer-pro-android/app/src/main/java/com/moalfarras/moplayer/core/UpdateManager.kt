package com.moalfarras.moplayer.core

import android.app.Activity
import android.app.PendingIntent
import android.content.ActivityNotFoundException
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import android.os.SystemClock
import android.util.Log
import androidx.core.content.IntentCompat
import com.moalfarras.moplayer.data.repository.AppRemoteConfig
import com.moalfarras.moplayer.data.repository.AppRemoteConfigService
import com.moalfarras.moplayer.data.repository.AppUpdateInfo
import com.moalfarras.moplayer.data.repository.InstallSettingsTarget
import com.moalfarras.moplayer.data.repository.UpdateError
import com.moalfarras.moplayer.data.repository.UpdateException
import com.moalfarras.moplayer.data.repository.UpdateRepository
import com.moalfarras.moplayer.data.repository.updateInfo
import com.moalfarras.moplayerpro.BuildConfig
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File

/** Where the in-app update is. [info] is the last known server metadata (null before the first check). */
sealed interface UpdateState {
    val info: AppUpdateInfo?

    data object Idle : UpdateState {
        override val info: AppUpdateInfo? = null
    }

    data class Checking(override val info: AppUpdateInfo?) : UpdateState

    data class UpToDate(override val info: AppUpdateInfo, val checkedAtMs: Long) : UpdateState

    /** The check failed; this is never shown as "up to date". */
    data class CheckFailed(override val info: AppUpdateInfo?, val lastCheckedAtMs: Long) : UpdateState

    data class Available(override val info: AppUpdateInfo, val checkedAtMs: Long) : UpdateState

    /** [totalBytes] is -1 while unknown; [reconnecting] while a dropped or stalled transfer resumes. */
    data class Downloading(
        override val info: AppUpdateInfo,
        val downloadedBytes: Long,
        val totalBytes: Long,
        val reconnecting: Boolean,
    ) : UpdateState {
        val percent: Int? get() = if (totalBytes > 0) ((downloadedBytes * 100) / totalBytes).toInt().coerceIn(0, 100) else null
    }

    data class Verifying(override val info: AppUpdateInfo) : UpdateState

    /** A verified APK is on disk. [installerOpened] after the system installer was shown without a result. */
    data class ReadyToInstall(override val info: AppUpdateInfo, val installerOpened: Boolean = false) : UpdateState

    /** Android 8+ needs "install unknown apps" for MoPlayer Pro; [opened] is the screen we managed to open. */
    data class NeedsPermission(override val info: AppUpdateInfo, val opened: InstallSettingsTarget? = null) : UpdateState

    data class Installing(override val info: AppUpdateInfo) : UpdateState

    data class Installed(override val info: AppUpdateInfo) : UpdateState

    data class Failed(override val info: AppUpdateInfo, val error: UpdateError, val detail: String = "") : UpdateState
}

/** A screen the foreground activity must start for the install to go on. */
sealed interface PendingInstallAction {
    /** The system's install confirmation for our committed session. */
    data class Confirm(val intent: Intent) : PendingInstallAction

    /** The classic installer screen for [file], when the session API is not usable here. */
    data class LegacyInstaller(val file: File) : PendingInstallAction
}

/** The single action the primary update button performs in each state. */
enum class UpdateAction { CHECK, DOWNLOAD, CANCEL, BUSY, INSTALL, ALLOW_INSTALLS, RETRY }

fun primaryUpdateAction(state: UpdateState): UpdateAction = when (state) {
    UpdateState.Idle, is UpdateState.UpToDate -> UpdateAction.CHECK
    is UpdateState.CheckFailed -> UpdateAction.RETRY
    is UpdateState.Checking, is UpdateState.Verifying, is UpdateState.Installing, is UpdateState.Installed -> UpdateAction.BUSY
    is UpdateState.Available -> UpdateAction.DOWNLOAD
    is UpdateState.Downloading -> UpdateAction.CANCEL
    is UpdateState.ReadyToInstall -> UpdateAction.INSTALL
    is UpdateState.NeedsPermission -> UpdateAction.ALLOW_INSTALLS
    is UpdateState.Failed -> UpdateAction.RETRY
}

/** Maps a PackageInstaller session status to the error shown to the user (null = not an error). */
internal fun installStatusError(status: Int): UpdateError? = when (status) {
    PackageInstaller.STATUS_SUCCESS, PackageInstaller.STATUS_PENDING_USER_ACTION -> null
    PackageInstaller.STATUS_FAILURE_ABORTED -> UpdateError.INSTALL_CANCELLED
    PackageInstaller.STATUS_FAILURE_BLOCKED -> UpdateError.INSTALL_BLOCKED
    PackageInstaller.STATUS_FAILURE_CONFLICT -> UpdateError.INSTALL_CONFLICT
    PackageInstaller.STATUS_FAILURE_INCOMPATIBLE -> UpdateError.INSTALL_INCOMPATIBLE
    PackageInstaller.STATUS_FAILURE_STORAGE -> UpdateError.INSTALL_STORAGE
    PackageInstaller.STATUS_FAILURE_INVALID -> UpdateError.INVALID_APK
    else -> UpdateError.INSTALL_FAILED
}

/**
 * App-scoped owner of the in-app update: check, resumable download, SHA-256/package verification
 * and install. It outlives every screen (leaving Settings never cancels a download), runs one job
 * at a time, and never starts activities itself — [pendingUserAction] is launched by the resumed
 * activity, because Android blocks activity starts from the background.
 */
class UpdateManager(
    private val context: Context,
    private val remoteConfig: AppRemoteConfigService,
    private val repository: UpdateRepository = UpdateRepository(context),
    private val scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO),
) {
    private val mutableState = MutableStateFlow<UpdateState>(UpdateState.Idle)
    val state: StateFlow<UpdateState> = mutableState.asStateFlow()

    private val mutablePendingAction = MutableStateFlow<PendingInstallAction?>(null)
    val pendingUserAction: StateFlow<PendingInstallAction?> = mutablePendingAction.asStateFlow()

    @Volatile private var job: Job? = null
    /** Elapsed-realtime of the last successful check (for the TTL) and its wall-clock time (for the UI). */
    @Volatile private var lastCheckedAt = 0L
    @Volatile private var lastCheckedAtWallMs = 0L
    @Volatile private var installerLaunchedAt = 0L

    init {
        // The runtime config fetched at start (and on every refresh) already carries the update
        // metadata, so the Settings panel and the forced-update screen know it without a request.
        scope.launch { remoteConfig.latest.filterNotNull().collect(::onConfig) }
    }

    private val busy: Boolean get() = job?.isActive == true

    /** Checks the server unless a check or transfer is running or the last check is younger than [CHECK_TTL_MS]. */
    fun check(force: Boolean = false) {
        val current = mutableState.value
        if (busy || current is UpdateState.Installing) return
        if (!force) {
            // An automatic check never replaces a download result, a pending install or an error.
            val settled = current is UpdateState.UpToDate || current is UpdateState.Available
            val fresh = lastCheckedAt != 0L && SystemClock.elapsedRealtime() - lastCheckedAt < CHECK_TTL_MS
            if (settled && fresh) return
            if (!settled && current !is UpdateState.Idle && current !is UpdateState.CheckFailed) return
        }
        job = scope.launch {
            mutableState.value = UpdateState.Checking(current.info)
            val info = remoteConfig.fetchConfig()?.updateInfo()
            if (info == null) {
                mutableState.update { state ->
                    if (state is UpdateState.Checking) UpdateState.CheckFailed(state.info, lastCheckedAtWallMs) else state
                }
            } else {
                publish(info)
            }
        }
    }

    private fun onConfig(config: AppRemoteConfig) {
        config.updateInfo()?.let(::publish)
    }

    /** New server metadata: only idle-ish states move; an active download or install is left alone. */
    private fun publish(info: AppUpdateInfo) {
        lastCheckedAt = SystemClock.elapsedRealtime()
        lastCheckedAtWallMs = System.currentTimeMillis()
        val checked = if (info.updateAvailable) UpdateState.Available(info, lastCheckedAtWallMs) else UpdateState.UpToDate(info, lastCheckedAtWallMs)
        mutableState.update { current ->
            when (current) {
                UpdateState.Idle, is UpdateState.Checking, is UpdateState.UpToDate,
                is UpdateState.Available, is UpdateState.CheckFailed -> checked
                is UpdateState.ReadyToInstall, is UpdateState.Failed, is UpdateState.NeedsPermission ->
                    if (current.info?.latestVersionCode != info.latestVersionCode && !busy) checked else current
                else -> current
            }
        }
        scope.launch { repository.deleteStaleFiles(info.latestVersionCode.takeIf { info.updateAvailable }) }
    }

    /**
     * Downloads (resuming a partial file), verifies and installs the latest build. Also the retry
     * for every failure: a verified APK already on disk is installed without downloading again.
     */
    fun startUpdate() {
        if (busy) return
        job = scope.launch { runUpdate() }
    }

    /** Stops the transfer; the partial file stays, so the next start resumes where this one stopped. */
    fun cancelDownload() {
        if (mutableState.value is UpdateState.Downloading) job?.cancel()
    }

    private suspend fun runUpdate() {
        val known = mutableState.value.info?.takeIf { it.updateAvailable }
        val info = known ?: remoteConfig.fetchConfig()?.updateInfo()?.also(::publish)
        if (info == null) {
            mutableState.value = UpdateState.CheckFailed(mutableState.value.info, lastCheckedAtWallMs)
            return
        }
        if (!info.updateAvailable) {
            mutableState.value = UpdateState.UpToDate(info, lastCheckedAtWallMs)
            return
        }
        try {
            val apk = repository.verifiedApk(info) ?: downloadVerified(info)
            install(info, apk)
        } catch (error: CancellationException) {
            // Set here, after the transfer unwound, so no late progress report can overwrite it.
            mutableState.update { state ->
                if (state is UpdateState.Downloading || state is UpdateState.Verifying) UpdateState.Available(info, lastCheckedAtWallMs) else state
            }
            throw error
        } catch (error: UpdateException) {
            mutableState.value = UpdateState.Failed(info, error.error, error.detail)
        } catch (error: Exception) {
            if (BuildConfig.DEBUG) Log.w(TAG, "Update failed", error)
            mutableState.value = UpdateState.Failed(info, UpdateError.UNKNOWN, error.javaClass.simpleName)
        }
    }

    /** Downloads and verifies; a resumed file that fails verification is downloaded once more from zero. */
    private suspend fun downloadVerified(info: AppUpdateInfo): File {
        repeat(2) { attempt ->
            mutableState.value = UpdateState.Downloading(info, 0L, info.apkSizeBytes ?: -1L, reconnecting = false)
            val file = repository.download(info) { written, total, reconnecting ->
                mutableState.value = UpdateState.Downloading(info, written, total, reconnecting)
            }
            mutableState.value = UpdateState.Verifying(info)
            val problem = repository.verify(file, info) ?: return file
            file.delete()
            if (problem != UpdateError.CHECKSUM || attempt == 1) throw UpdateException(problem)
        }
        throw UpdateException(UpdateError.CHECKSUM)
    }

    private suspend fun install(info: AppUpdateInfo, apk: File) {
        if (!repository.canInstallPackages()) {
            mutableState.value = UpdateState.NeedsPermission(info)
            return
        }
        mutableState.value = UpdateState.Installing(info)
        try {
            repository.commitSession(apk) { sessionId ->
                val intent = Intent(context, UpdateInstallReceiver::class.java)
                    .setAction(ACTION_INSTALL_STATUS)
                    .setPackage(context.packageName)
                PendingIntent.getBroadcast(context, sessionId, intent, repository.statusPendingIntentFlags()).intentSender
            }
        } catch (error: CancellationException) {
            throw error
        } catch (error: Exception) {
            // Some TV firmwares ship a broken session installer; the classic screen still works there.
            if (BuildConfig.DEBUG) Log.w(TAG, "Session install unavailable, using the system installer", error)
            mutablePendingAction.value = PendingInstallAction.LegacyInstaller(apk)
        }
    }

    /** Result of a committed session, delivered by [UpdateInstallReceiver]. */
    fun onInstallStatus(intent: Intent) {
        val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)
        val info = mutableState.value.info
        when (status) {
            PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                val confirm = IntentCompat.getParcelableExtra(intent, Intent.EXTRA_INTENT, Intent::class.java)
                if (confirm == null) {
                    info?.let { mutableState.value = UpdateState.Failed(it, UpdateError.INSTALL_FAILED) }
                    return
                }
                // Android 16 blocks launching an Intent taken from another Intent's extras. This one
                // is the platform installer's confirmation, delivered to our non-exported receiver
                // through the PendingIntent we gave only to our own session.
                if (Build.VERSION.SDK_INT >= 36) confirm.removeLaunchSecurityProtection()
                mutablePendingAction.value = PendingInstallAction.Confirm(confirm)
            }
            PackageInstaller.STATUS_SUCCESS -> {
                info?.let { mutableState.value = UpdateState.Installed(it) }
                scope.launch { repository.deleteStaleFiles(null) }
            }
            else -> {
                val error = installStatusError(status) ?: UpdateError.INSTALL_FAILED
                val message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE).orEmpty()
                if (BuildConfig.DEBUG) Log.w(TAG, "Install finished with status $status: $message")
                info?.let {
                    mutableState.value = if (error == UpdateError.INSTALL_CANCELLED) {
                        UpdateState.ReadyToInstall(it)
                    } else {
                        UpdateState.Failed(it, error, message.take(120))
                    }
                }
            }
        }
    }

    /** Starts the pending installer screen from the resumed [activity]. */
    fun launchPendingAction(activity: Activity) {
        val action = mutablePendingAction.value ?: return
        mutablePendingAction.value = null
        when (action) {
            is PendingInstallAction.Confirm -> {
                if (!startActivity(activity, action.intent)) {
                    fallBackToLegacyInstaller()
                    return
                }
                installerLaunchedAt = SystemClock.elapsedRealtime()
            }
            is PendingInstallAction.LegacyInstaller -> {
                val info = mutableState.value.info ?: return
                val intent = try {
                    repository.legacyInstallIntent(action.file)
                } catch (error: UpdateException) {
                    mutableState.value = UpdateState.Failed(info, error.error, error.detail)
                    return
                } catch (error: IllegalArgumentException) {
                    mutableState.value = UpdateState.Failed(info, UpdateError.INSTALLER_UNAVAILABLE)
                    return
                }
                if (startActivity(activity, intent)) {
                    // The classic installer reports nothing back; let the user open it again.
                    mutableState.value = UpdateState.ReadyToInstall(info, installerOpened = true)
                } else {
                    mutableState.value = UpdateState.Failed(info, UpdateError.INSTALLER_UNAVAILABLE)
                }
            }
        }
    }

    private fun fallBackToLegacyInstaller() {
        val info = mutableState.value.info ?: return
        scope.launch {
            val apk = repository.verifiedApk(info)
            if (apk == null) {
                mutableState.value = UpdateState.Failed(info, UpdateError.INSTALLER_UNAVAILABLE)
            } else {
                mutablePendingAction.value = PendingInstallAction.LegacyInstaller(apk)
            }
        }
    }

    /**
     * Called whenever the activity resumes: continues an install the user just allowed in Settings,
     * and re-arms the Install button when the user came back from the confirmation without answering.
     */
    fun onResume() {
        when (val current = mutableState.value) {
            is UpdateState.NeedsPermission -> if (repository.canInstallPackages()) startUpdate()
            is UpdateState.Installing -> {
                val launchedAt = installerLaunchedAt
                if (launchedAt != 0L && mutablePendingAction.value == null &&
                    SystemClock.elapsedRealtime() - launchedAt > RESUME_GRACE_MS && !busy
                ) {
                    installerLaunchedAt = 0L
                    mutableState.value = UpdateState.ReadyToInstall(current.info, installerOpened = true)
                }
            }
            else -> Unit
        }
    }

    /** Opens the unknown-sources screen from [activity] and remembers which one opened. */
    fun openInstallPermissionSettings(activity: Activity) {
        val current = mutableState.value as? UpdateState.NeedsPermission ?: return
        mutableState.value = current.copy(opened = repository.openInstallPermissionSettings(activity))
    }

    /** The user declined to grant the permission for now. */
    fun dismissPermission() {
        val current = mutableState.value as? UpdateState.NeedsPermission ?: return
        mutableState.value = UpdateState.ReadyToInstall(current.info)
    }

    fun openDownloadPage(activity: Activity, url: String): Boolean = repository.openDownloadPage(activity, url)

    private fun startActivity(activity: Activity, intent: Intent): Boolean = try {
        activity.startActivity(intent)
        true
    } catch (_: ActivityNotFoundException) {
        false
    } catch (_: SecurityException) {
        false
    }

    companion object {
        private const val TAG = "MoPlayerUpdate"
        internal const val ACTION_INSTALL_STATUS = "com.moalfarras.moplayer.action.UPDATE_INSTALL_STATUS"
        private const val CHECK_TTL_MS = 15 * 60_000L
        private const val RESUME_GRACE_MS = 1_500L
    }
}

/** Receives PackageInstaller session results (non-exported; only our PendingIntent reaches it). */
class UpdateInstallReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != UpdateManager.ACTION_INSTALL_STATUS) return
        AppGraph.get(context.applicationContext).updateManager.onInstallStatus(intent)
    }
}
