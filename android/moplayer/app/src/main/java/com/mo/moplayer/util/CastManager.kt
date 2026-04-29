package com.mo.moplayer.util

import android.content.Context
import android.net.Uri
import android.view.Menu
import com.google.android.gms.cast.MediaInfo
import com.google.android.gms.cast.MediaLoadRequestData
import com.google.android.gms.cast.MediaMetadata
import com.google.android.gms.cast.framework.CastButtonFactory
import com.google.android.gms.cast.framework.CastContext
import com.google.android.gms.cast.framework.CastSession
import com.google.android.gms.cast.framework.CastStateListener
import com.google.android.gms.cast.framework.SessionManager
import com.google.android.gms.cast.framework.SessionManagerListener
import com.google.android.gms.common.images.WebImage
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manager class for Google Cast (Chromecast) functionality. Handles Cast session management and
 * media loading.
 */
@Singleton
class CastManager @Inject constructor(@ApplicationContext private val context: Context) {

    private var castContext: CastContext? = null
    private var sessionManager: SessionManager? = null
    private var castSession: CastSession? = null
    private var castStateListener: CastStateListener? = null
    private var sessionManagerListener: SessionManagerListener<CastSession>? = null

    // Callbacks for UI updates
    var onCastStateChanged: ((Int) -> Unit)? = null
    var onSessionStarted: (() -> Unit)? = null
    var onSessionEnded: (() -> Unit)? = null

    /** Initialize Cast context. Should be called in Application class or Activity. */
    fun initialize() {
        try {
            castContext = CastContext.getSharedInstance(context)
            sessionManager = castContext?.sessionManager

            setupCastStateListener()
            setupSessionManagerListener()
        } catch (throwable: Throwable) {
            android.util.Log.e("CastManager", "Failed to initialize Cast: ${throwable.message}", throwable)
        }
    }

    /** Check if Cast is available on this device */
    fun isCastAvailable(): Boolean {
        return try {
            // CastState.NO_DEVICES_AVAILABLE = 1
            castContext != null && castContext?.castState != 1
        } catch (e: Throwable) {
            false
        }
    }

    /** Check if currently casting */
    fun isCasting(): Boolean {
        return castSession?.isConnected == true
    }

    /** Get current Cast state */
    fun getCastState(): Int? {
        return castContext?.castState
    }

    /** Setup Cast button in menu */
    fun setupCastButton(menu: Menu, menuItemId: Int) {
        try {
            CastButtonFactory.setUpMediaRouteButton(context.applicationContext, menu, menuItemId)
        } catch (throwable: Throwable) {
            android.util.Log.e("CastManager", "Failed to setup cast button: ${throwable.message}", throwable)
        }
    }

    /**
     * Load media to Cast device
     *
     * @param streamUrl URL of the stream to cast
     * @param title Title of the content
     * @param subtitle Subtitle/description
     * @param imageUrl Thumbnail image URL
     * @param contentType MIME type (e.g., "video/mp4", "application/x-mpegurl")
     * @param isLive Whether this is a live stream
     */
    fun loadMedia(
            streamUrl: String,
            title: String,
            subtitle: String? = null,
            imageUrl: String? = null,
            contentType: String = "video/mp4",
            isLive: Boolean = false
    ) {
        val remoteMediaClient = castSession?.remoteMediaClient ?: return

        val metadata =
                MediaMetadata(
                                if (isLive) MediaMetadata.MEDIA_TYPE_TV_SHOW
                                else MediaMetadata.MEDIA_TYPE_MOVIE
                        )
                        .apply {
                            putString(MediaMetadata.KEY_TITLE, title)
                            subtitle?.let { putString(MediaMetadata.KEY_SUBTITLE, it) }
                            imageUrl?.let { addImage(WebImage(Uri.parse(it))) }
                        }

        val streamType =
                if (isLive) {
                    MediaInfo.STREAM_TYPE_LIVE
                } else {
                    MediaInfo.STREAM_TYPE_BUFFERED
                }

        val mediaInfo =
                MediaInfo.Builder(streamUrl)
                        .setStreamType(streamType)
                        .setContentType(contentType)
                        .setMetadata(metadata)
                        .build()

        val loadRequest =
                MediaLoadRequestData.Builder().setMediaInfo(mediaInfo).setAutoplay(true).build()

        remoteMediaClient.load(loadRequest)
    }

    /** Stop casting and disconnect */
    fun stopCasting() {
        castSession?.remoteMediaClient?.stop()
        sessionManager?.endCurrentSession(true)
    }

    /** Pause casting */
    fun pauseCasting() {
        castSession?.remoteMediaClient?.pause()
    }

    /** Resume casting */
    fun resumeCasting() {
        castSession?.remoteMediaClient?.play()
    }

    /** Seek to position */
    fun seekTo(positionMs: Long) {
        castSession?.remoteMediaClient?.seek(positionMs)
    }

    /** Get current position of playing media */
    fun getCurrentPosition(): Long {
        return castSession?.remoteMediaClient?.approximateStreamPosition ?: 0
    }

    /** Get duration of playing media */
    fun getDuration(): Long {
        return castSession?.remoteMediaClient?.streamDuration ?: 0
    }

    private fun setupCastStateListener() {
        castStateListener = CastStateListener { state -> onCastStateChanged?.invoke(state) }
        castStateListener?.let { castContext?.addCastStateListener(it) }
    }

    private fun setupSessionManagerListener() {
        sessionManagerListener =
                object : SessionManagerListener<CastSession> {
                    override fun onSessionStarting(session: CastSession) {}

                    override fun onSessionStarted(session: CastSession, sessionId: String) {
                        castSession = session
                        onSessionStarted?.invoke()
                    }

                    override fun onSessionStartFailed(session: CastSession, error: Int) {
                        android.util.Log.e("CastManager", "Session start failed: $error")
                    }

                    override fun onSessionEnding(session: CastSession) {}

                    override fun onSessionEnded(session: CastSession, error: Int) {
                        castSession = null
                        onSessionEnded?.invoke()
                    }

                    override fun onSessionResuming(session: CastSession, sessionId: String) {}

                    override fun onSessionResumed(session: CastSession, wasSuspended: Boolean) {
                        castSession = session
                    }

                    override fun onSessionResumeFailed(session: CastSession, error: Int) {}

                    override fun onSessionSuspended(session: CastSession, reason: Int) {}
                }
        sessionManagerListener?.let {
            sessionManager?.addSessionManagerListener(it, CastSession::class.java)
        }
    }

    /** Cleanup - call when app is closing */
    fun release() {
        castStateListener?.let { castContext?.removeCastStateListener(it) }
        sessionManagerListener?.let {
            sessionManager?.removeSessionManagerListener(it, CastSession::class.java)
        }
    }
}
