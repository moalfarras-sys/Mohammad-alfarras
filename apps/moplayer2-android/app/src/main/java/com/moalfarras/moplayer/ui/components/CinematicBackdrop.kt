package com.moalfarras.moplayer.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import coil3.compose.AsyncImage
import coil3.request.ImageRequest
import coil3.size.Size
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals

/** أول صورة خلفية/بوستر متاحة من عنصر أو قائمة — للخلفيات الديناميكية بدون طلبات شبكة إضافية. */
fun backdropUrlFrom(vararg items: MediaItem?): String? {
    for (item in items) {
        if (item == null) continue
        item.backdropUrl.takeIf { it.isNotBlank() }?.let { return it }
        item.posterUrl.takeIf { it.isNotBlank() }?.let { return it }
    }
    return null
}

fun backdropUrlFromList(items: List<MediaItem>, focused: MediaItem? = null): String? {
    focused?.let { backdropUrlFrom(it) }?.let { return it }
    for (item in items) {
        backdropUrlFrom(item)?.let { return it }
    }
    return null
}

/**
 * Cinematic Backdrop: sharp full-bleed image + light gradients for UI contrast.
 * (Older builds used heavy blur + low alpha, which made TV backgrounds look muddy.)
 */
@Composable
fun CinematicBackdrop(
    backdropUrl: String?,
    modifier: Modifier = Modifier,
    imageContentDescription: String? = null,
    showParticles: Boolean = true,
) {
    val visuals = LocalMoVisuals.current
    val context = LocalContext.current
    val imageRequest = remember(backdropUrl) {
        if (backdropUrl.isNullOrBlank()) null
        else {
            ImageRequest.Builder(context)
                .data(backdropUrl)
                .size(Size(3840, 2160))
                .build()
        }
    }
    Box(modifier.fillMaxSize()) {
        if (imageRequest != null) {
            AsyncImage(
                model = imageRequest,
                contentDescription = imageContentDescription,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        alpha = 1f
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

        if (showParticles) {
            FloatingParticles()
        }
    }
}
