@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package com.moalfarras.moplayer.ui.player

import android.content.Context
import android.os.Handler
import android.util.Log
import androidx.media3.decoder.ffmpeg.FfmpegAudioRenderer
import androidx.media3.decoder.ffmpeg.FfmpegLibrary
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.Renderer
import androidx.media3.exoplayer.audio.AudioRendererEventListener
import androidx.media3.exoplayer.audio.AudioSink
import androidx.media3.exoplayer.mediacodec.MediaCodecSelector
import java.util.concurrent.atomic.AtomicBoolean

private const val AUDIO_LOG_TAG = "MoPlayerAudio"

/**
 * Media3 renderers with the FFmpeg audio decoders (AC-3, E-AC-3, DTS, TrueHD, MP2, ...) placed as
 * in [DefaultRenderersFactory.EXTENSION_RENDERER_MODE_ON]: after the platform renderer, so HDMI
 * passthrough and hardware decoders still win and FFmpeg only takes formats nothing else can play.
 *
 * The stock factory loads the extension by reflection and rethrows any failure, and a
 * LinkageError (the prebuilt decoder targets Media3 1.9) would not even be caught. Here the
 * renderer is created directly inside a Throwable guard, so a broken or missing native library
 * only costs the extra formats, never playback. Video extensions stay off: the FFmpeg video
 * renderer in that artifact is a non-functional stub.
 */
internal class IptvRenderersFactory(context: Context) : DefaultRenderersFactory(context) {
    override fun buildAudioRenderers(
        context: Context,
        extensionRendererMode: Int,
        mediaCodecSelector: MediaCodecSelector,
        enableDecoderFallback: Boolean,
        audioSink: AudioSink,
        eventHandler: Handler,
        eventListener: AudioRendererEventListener,
        out: ArrayList<Renderer>,
    ) {
        super.buildAudioRenderers(
            context,
            EXTENSION_RENDERER_MODE_OFF,
            mediaCodecSelector,
            enableDecoderFallback,
            audioSink,
            eventHandler,
            eventListener,
            out,
        )
        FfmpegAudio.createRenderer(eventHandler, eventListener, audioSink)?.let { renderer ->
            insertExtensionRenderer(out, renderer, EXTENSION_RENDERER_MODE_ON)
        }
    }
}

/** Where an extension renderer goes: first for PREFER, after the platform renderers for ON. */
internal fun <T> insertExtensionRenderer(out: MutableList<T>, renderer: T, mode: Int) {
    if (mode == DefaultRenderersFactory.EXTENSION_RENDERER_MODE_PREFER) out.add(0, renderer) else out.add(renderer)
}

internal object FfmpegAudio {
    private val logged = AtomicBoolean(false)

    fun createRenderer(handler: Handler, listener: AudioRendererEventListener, sink: AudioSink): Renderer? {
        val result = try {
            if (FfmpegLibrary.isAvailable()) {
                Result.success(FfmpegAudioRenderer(handler, listener, sink))
            } else {
                Result.failure(IllegalStateException("native library not loaded"))
            }
        } catch (error: Throwable) {
            Result.failure(error)
        }
        if (logged.compareAndSet(false, true)) {
            val status = result.fold(
                onSuccess = { "enabled (FFmpeg ${runCatching { FfmpegLibrary.getVersion() }.getOrNull() ?: "?"})" },
                onFailure = { "unavailable(${it.javaClass.simpleName}: ${it.message.orEmpty()})" },
            )
            Log.i(AUDIO_LOG_TAG, "FFmpeg audio renderer: $status")
        }
        return result.getOrNull()
    }
}
