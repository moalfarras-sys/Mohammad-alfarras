package com.moalfarras.moplayer.ui.components

import android.content.Context
import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import coil3.compose.AsyncImage
import coil3.request.ImageRequest
import coil3.request.crossfade
import coil3.size.Size
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayerpro.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * First backdrop/poster art available from the given items, for dynamic backgrounds.
 * [preferCachedPoster] reuses the poster size a grid already downloaded (behind a poster grid
 * the background is mostly covered, so a second full-size download is wasted).
 */
fun backdropUrlFrom(vararg items: MediaItem?, preferCachedPoster: Boolean = false): String? {
    for (item in items) {
        if (item == null) continue
        item.backdropUrl.takeIf { it.isNotBlank() }?.let { return it.downsizedBackdropUrl() }
        if (item.type != ContentType.LIVE) {
            item.posterUrl.takeIf { it.isNotBlank() }?.let { return if (preferCachedPoster) it.optimizedPosterUrl() else it.trim() }
        }
    }
    return null
}

/** TMDB "original" backdrops are 4K+ files; a full-bleed background never needs more than w1280. */
internal fun String.downsizedBackdropUrl(): String {
    val url = trim()
    return if (isTmdbUrl(url)) url.replace("/original/", "/w1280/") else url
}

private const val BACKDROP_CROSSFADE_MS = 260
private val CinematicFallback = Color(0xFF0B0908)

/**
 * The branded base image, decoded once per process off the main thread. It used to be decoded
 * again (5.8 MB, on the UI thread) every time a screen with a backdrop was composed.
 */
private object CinematicBase {
    @Volatile
    var bitmap: ImageBitmap? = null

    fun load(context: Context): ImageBitmap? {
        bitmap?.let { return it }
        return synchronized(this) {
            bitmap ?: runCatching {
                BitmapFactory.decodeResource(context.resources, R.drawable.bg_cinematic)?.asImageBitmap()
            }.getOrNull().also { bitmap = it }
        }
    }
}

@Composable
private fun rememberCinematicBase(): ImageBitmap? {
    CinematicBase.bitmap?.let { return it }
    val context = LocalContext.current.applicationContext
    val loaded by produceState<ImageBitmap?>(initialValue = null, context) {
        value = withContext(Dispatchers.Default) { CinematicBase.load(context) }
    }
    return loaded
}

/**
 * Cinematic Backdrop: sharp full-bleed image + light gradients for UI contrast.
 *
 * A new image fades in over the previous one (which stays as the placeholder) instead of
 * flashing the base between items. [imageAlpha] < 1 dims the photo with a scrim rather than a
 * layer alpha, and the particles draw in their own layer above it, so the image stack never needs
 * an offscreen buffer that the particles would invalidate every frame.
 */
@Composable
fun CinematicBackdrop(
    backdropUrl: String?,
    modifier: Modifier = Modifier,
    imageContentDescription: String? = null,
    showParticles: Boolean = true,
    imageSize: Size = Size(1920, 1080),
    imageAlpha: Float = 1f,
) {
    val visuals = LocalMoVisuals.current
    val context = LocalContext.current
    val reduceMotion = LocalReduceMotion.current
    val base = rememberCinematicBase()
    var lastShownKey by remember { mutableStateOf<String?>(null) }
    val url = backdropUrl?.takeIf { it.isNotBlank() }
    val key = url?.let { "backdrop:$it@${imageSize.width}x${imageSize.height}" }
    val imageRequest = remember(key, reduceMotion) {
        if (url == null || key == null) {
            null
        } else {
            ImageRequest.Builder(context)
                .data(url)
                .size(imageSize)
                .memoryCacheKey(key)
                .placeholderMemoryCacheKey(lastShownKey)
                .apply { if (!reduceMotion) crossfade(BACKDROP_CROSSFADE_MS) }
                .build()
        }
    }
    Box(modifier.fillMaxSize()) {
        // Branded cinematic base — always present so loading / offline / failed-image states
        // still look premium instead of falling back to flat black on weak or disconnected TVs.
        if (base != null) {
            Image(
                bitmap = base,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
            )
        } else {
            Box(Modifier.fillMaxSize().background(CinematicFallback))
        }
        if (imageRequest != null) {
            AsyncImage(
                model = imageRequest,
                contentDescription = imageContentDescription,
                contentScale = ContentScale.Crop,
                onSuccess = { lastShownKey = key },
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        scaleX = 1.03f
                        scaleY = 1.03f
                    },
            )
        }

        Box(
            Modifier
                .fillMaxSize()
                .background(
                    Brush.horizontalGradient(
                        listOf(
                            visuals.accentB.copy(alpha = 0.035f),
                            Color.Transparent,
                            visuals.accent.copy(alpha = 0.03f),
                        ),
                    ),
                ),
        )

        // Light vignette: keep posters readable without washing out the photo
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colorStops = arrayOf(
                            0.00f to Color(0x28080706),
                            0.40f to Color(0x18050403),
                            0.72f to Color(0x45050403),
                            1.00f to Color(0x8C0A0908),
                        ),
                    ),
                ),
        )
        if (imageAlpha < 1f) {
            Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = (1f - imageAlpha).coerceIn(0f, 1f))))
        }

        if (showParticles) {
            FloatingParticles()
        }
    }
}
