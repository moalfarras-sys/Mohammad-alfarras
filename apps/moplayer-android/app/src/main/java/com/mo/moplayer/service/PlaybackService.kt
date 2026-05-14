package com.mo.moplayer.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.IBinder
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import com.mo.moplayer.R
import com.mo.moplayer.ui.home.HomeActivity
import com.mo.moplayer.ui.player.PlayerBroadcastBridge
import com.mo.moplayer.ui.player.engine.PlayerEngine
import dagger.hilt.android.AndroidEntryPoint

/**
 * Foreground playback service for background audio, media buttons, and Android TV controls.
 *
 * The activity owns the actual video engines. This service owns the durable system surface:
 * notification actions, MediaSession callbacks, and audio focus. Controls are forwarded to the
 * active PlayerActivity through an in-app broadcast so VLC and Media3 follow the same command path.
 */
@AndroidEntryPoint
class PlaybackService : Service() {

    companion object {
        private const val CHANNEL_ID = "moplayer_playback"
        private const val NOTIFICATION_ID = 1
        private const val ACTION_PLAY_PAUSE = "com.mo.moplayer.ACTION_PLAY_PAUSE"
        private const val ACTION_STOP = "com.mo.moplayer.ACTION_STOP"
        private const val ACTION_NEXT = "com.mo.moplayer.ACTION_NEXT"
        private const val ACTION_PREV = "com.mo.moplayer.ACTION_PREV"
        private const val ACTION_FORWARD = "com.mo.moplayer.ACTION_FORWARD"
        private const val ACTION_REWIND = "com.mo.moplayer.ACTION_REWIND"

        fun start(context: Context, title: String, isLive: Boolean) {
            val intent = Intent(context, PlaybackService::class.java).apply {
                putExtra("title", title)
                putExtra("isLive", isLive)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, PlaybackService::class.java))
        }
    }

    private var mediaSession: MediaSessionCompat? = null
    private var audioManager: AudioManager? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var currentTitle: String = ""
    private var isLive: Boolean = false
    private var engine: PlayerEngine? = null

    private val callback = object : PlayerEngine.Callback {
        override fun onPlaybackStateChanged(state: Int) {
            updateMediaSession(state)
            updateNotification()
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
            updateMediaSession(if (isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED)
            updateNotification()
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        initMediaSession()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        currentTitle = intent?.getStringExtra("title") ?: currentTitle.ifBlank { getString(R.string.app_name) }
        isLive = intent?.getBooleanExtra("isLive", isLive) == true

        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        when (intent?.action) {
            ACTION_PLAY_PAUSE -> sendControl(PlayerBroadcastBridge.CONTROL_TYPE_PLAY_PAUSE)
            ACTION_STOP -> {
                sendControl(PlayerBroadcastBridge.CONTROL_TYPE_STOP)
                stopSelf()
            }
            ACTION_NEXT -> sendControl(PlayerBroadcastBridge.CONTROL_TYPE_NEXT)
            ACTION_PREV -> sendControl(PlayerBroadcastBridge.CONTROL_TYPE_PREV)
            ACTION_FORWARD -> sendControl(PlayerBroadcastBridge.CONTROL_TYPE_FORWARD)
            ACTION_REWIND -> sendControl(PlayerBroadcastBridge.CONTROL_TYPE_REWIND)
        }

        updateMediaSession(if (engine?.isPlaying == false) PlaybackStateCompat.STATE_PAUSED else PlaybackStateCompat.STATE_PLAYING)
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        abandonAudioFocus()
        mediaSession?.release()
        mediaSession = null
        engine?.removeCallback(callback)
        engine = null
        super.onDestroy()
    }

    fun attachEngine(engine: PlayerEngine) {
        this.engine?.removeCallback(callback)
        this.engine = engine
        engine.addCallback(callback)
        requestAudioFocus()
        updateMediaSession(PlaybackStateCompat.STATE_PLAYING)
        updateNotification()
    }

    fun detachEngine() {
        engine?.removeCallback(callback)
        engine = null
        updateMediaSession(PlaybackStateCompat.STATE_STOPPED)
        updateNotification()
    }

    private fun initMediaSession() {
        mediaSession = MediaSessionCompat(this, "MoPlayerService").apply {
            setFlags(
                MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS or
                    MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
            )
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    requestAudioFocus()
                    sendControl(PlayerBroadcastBridge.CONTROL_TYPE_PLAY_PAUSE)
                }

                override fun onPause() {
                    sendControl(PlayerBroadcastBridge.CONTROL_TYPE_PLAY_PAUSE)
                }

                override fun onStop() {
                    sendControl(PlayerBroadcastBridge.CONTROL_TYPE_STOP)
                    stopSelf()
                }

                override fun onFastForward() {
                    sendControl(PlayerBroadcastBridge.CONTROL_TYPE_FORWARD)
                }

                override fun onRewind() {
                    sendControl(PlayerBroadcastBridge.CONTROL_TYPE_REWIND)
                }

                override fun onSkipToNext() {
                    sendControl(PlayerBroadcastBridge.CONTROL_TYPE_NEXT)
                }

                override fun onSkipToPrevious() {
                    sendControl(PlayerBroadcastBridge.CONTROL_TYPE_PREV)
                }
            })
            isActive = true
        }
    }

    private fun updateMediaSession(state: Int) {
        mediaSession?.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setState(state, engine?.currentPositionMs ?: 0, 1f)
                .setActions(
                    PlaybackStateCompat.ACTION_PLAY or
                        PlaybackStateCompat.ACTION_PAUSE or
                        PlaybackStateCompat.ACTION_PLAY_PAUSE or
                        PlaybackStateCompat.ACTION_STOP or
                        PlaybackStateCompat.ACTION_FAST_FORWARD or
                        PlaybackStateCompat.ACTION_REWIND or
                        PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                        PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                )
                .build()
        )
        mediaSession?.setMetadata(
            MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
                .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_TITLE, currentTitle)
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, engine?.durationMs ?: -1)
                .build()
        )
    }

    private fun requestAudioFocus() {
        val manager = audioManager ?: (getSystemService(Context.AUDIO_SERVICE) as AudioManager).also {
            audioManager = it
        }
        val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MOVIE)
                        .build()
                )
                .setOnAudioFocusChangeListener(focusListener)
                .build()
                .also { audioFocusRequest = it }
            manager.requestAudioFocus(request)
        } else {
            @Suppress("DEPRECATION")
            manager.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
        }
        if (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
            mediaSession?.isActive = true
        }
    }

    private fun abandonAudioFocus() {
        val manager = audioManager ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let { manager.abandonAudioFocusRequest(it) }
        } else {
            @Suppress("DEPRECATION")
            manager.abandonAudioFocus(focusListener)
        }
    }

    private val focusListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
        when (focusChange) {
            AudioManager.AUDIOFOCUS_LOSS,
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT,
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                engine?.pause()
                updateMediaSession(PlaybackStateCompat.STATE_PAUSED)
            }
            AudioManager.AUDIOFOCUS_GAIN -> {
                engine?.resume()
                updateMediaSession(PlaybackStateCompat.STATE_PLAYING)
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.notification_channel_playback),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_channel_playback_desc)
                setShowBadge(false)
                enableVibration(false)
            }
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val openIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, HomeActivity::class.java).apply { flags = Intent.FLAG_ACTIVITY_SINGLE_TOP },
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val isPlaying = engine?.isPlaying != false

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(currentTitle.ifBlank { getString(R.string.app_name) })
            .setContentText(if (isLive) getString(R.string.live_indicator) else getString(R.string.playing_indicator))
            .setSmallIcon(R.drawable.ic_notification_play)
            .setContentIntent(openIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setStyle(
                androidx.media.app.NotificationCompat.MediaStyle()
                    .setMediaSession(mediaSession?.sessionToken)
                    .setShowActionsInCompactView(1, 2, 3)
            )
            .addAction(R.drawable.ic_replay_10, getString(R.string.rewind), servicePendingIntent(ACTION_REWIND, 1))
            .addAction(
                if (isPlaying) R.drawable.ic_notification_pause else R.drawable.ic_notification_play,
                if (isPlaying) getString(R.string.action_pause) else getString(R.string.action_play),
                servicePendingIntent(ACTION_PLAY_PAUSE, 2)
            )
            .addAction(R.drawable.ic_forward_10, getString(R.string.forward), servicePendingIntent(ACTION_FORWARD, 3))
            .addAction(R.drawable.ic_notification_stop, getString(R.string.action_stop), servicePendingIntent(ACTION_STOP, 4))
            .build()
    }

    private fun updateNotification() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification())
    }

    private fun servicePendingIntent(action: String, requestCode: Int): PendingIntent {
        val intent = Intent(this, PlaybackService::class.java).setAction(action)
        return PendingIntent.getService(
            this,
            requestCode,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
    }

    private fun sendControl(controlType: Int) {
        sendBroadcast(Intent(PlayerBroadcastBridge.ACTION_MEDIA_CONTROL).apply {
            setPackage(packageName)
            putExtra(PlayerBroadcastBridge.EXTRA_CONTROL_TYPE, controlType)
        })
    }
}
