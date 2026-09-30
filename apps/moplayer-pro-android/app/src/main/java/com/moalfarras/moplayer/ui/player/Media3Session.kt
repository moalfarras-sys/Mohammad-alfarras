@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package com.moalfarras.moplayer.ui.player

import android.os.SystemClock
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.media3.common.C
import androidx.media3.session.MediaSession
import com.moalfarras.moplayer.core.PerformancePolicy
import com.moalfarras.moplayer.domain.model.MediaItem as AppMediaItem
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.player

// The Media3 side of PlayerScreen, kept out of that (very large) composable: API 23's ART
// verifier rejects oversized methods.

/**
 * The session's Media3 player, or null while LibVLC plays (no ExoPlayer is built for it then).
 * It is kept across channel and episode changes and rebuilt only when live/VOD, the performance
 * mode or [generation] (surface-retry escalation) changes. [callbacks] may be a new object on every
 * composition; events always go to the latest one. Released when the player screen leaves.
 */
@Composable
internal fun rememberMedia3Engine(
    enabled: Boolean,
    isLive: Boolean,
    performancePolicy: PerformancePolicy,
    generation: Int,
    callbacks: Media3Callbacks,
): Media3Engine? {
    val context = LocalContext.current
    val currentCallbacks = rememberUpdatedState(callbacks)
    val engine = remember(enabled, isLive, performancePolicy.mode, generation) {
        if (enabled) Media3Engine.create(context, isLive, performancePolicy) { currentCallbacks.value } else null
    }
    // MediaSession: hardware media keys and "Now playing" (title, group and artwork come from each
    // load's metadata). One per player, released before it.
    DisposableEffect(engine) {
        val mediaSession = engine?.let {
            runCatching {
                MediaSession.Builder(context.applicationContext, it.player)
                    .setId("MoPlayerPro-${SystemClock.elapsedRealtimeNanos()}")
                    .build()
            }.getOrNull()
        }
        onDispose {
            runCatching { mediaSession?.release() }
            engine?.release()
        }
    }
    return engine
}

/**
 * Loads the current request into the session's player when the item, the request (other format,
 * redirect, fallback URL), the player or [PlaybackAttemptState.media3ReloadNonce] changes. The
 * outgoing VOD position (either engine) is saved first, and a subtitle the viewer imported for
 * this VOD is loaded with it again. The start waits for a LibVLC player that is still closing its
 * connection, and never happens in the background: Media3LifecycleBinding prepares the loaded
 * stream when the app returns.
 */
@Composable
internal fun Media3LoadEffect(
    engine: Media3Engine?,
    item: AppMediaItem,
    request: StreamRequest,
    isLive: Boolean,
    performancePolicy: PerformancePolicy,
    attempt: PlaybackAttemptState,
    ui: PlayerItemUiState,
    session: PlayerSessionState,
    onProgress: (item: AppMediaItem, positionMs: Long, durationMs: Long) -> Unit,
) {
    val context = LocalContext.current
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    val importedSubtitleLabel = LocalStrings.current.player.importedSubtitle
    DisposableEffect(engine, item.id, request, attempt.media3ReloadNonce) {
        // A scrub preview belongs to what played before; the new load starts at resumePositionMs.
        session.pendingSeekTarget = C.TIME_UNSET
        val cancelStart = if (engine == null) {
            {}
        } else {
            engine.load(
                context,
                request,
                item,
                isLive,
                performancePolicy,
                if (isLive) C.TIME_UNSET else attempt.resumePositionMs,
                ui.externalSubtitle?.takeUnless { isLive }?.let { externalSubtitleConfiguration(it, importedSubtitleLabel) },
            )
            VlcCore.afterTeardowns(LIBVLC_TEARDOWN_WAIT_MS) {
                if (lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED)) engine.player.prepare()
            }
        }
        onDispose {
            cancelStart()
            // Runs before the next load (or the release), so the player still holds this item.
            if (!isLive) {
                val player = engine?.player
                if (player == null) {
                    if (ui.duration > 1L && attempt.resumePositionMs > 0L) onProgress(item, attempt.resumePositionMs, ui.duration)
                } else if (player.duration > 0) {
                    onProgress(item, player.currentPosition.coerceAtLeast(0), player.duration)
                }
            }
        }
    }
}
