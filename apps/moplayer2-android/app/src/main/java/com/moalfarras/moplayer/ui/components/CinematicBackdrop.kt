package com.moalfarras.moplayer.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.moalfarras.moplayer.R
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
 * Cinematic Backdrop: Content image + warm dark gradients + golden accents.
 * Optimized for Android TV / Phone Landscape.
 * Premium Fiery Glass identity — warm espresso tones.
 */
@Composable
fun CinematicBackdrop(
    backdropUrl: String?,
    modifier: Modifier = Modifier,
    imageContentDescription: String? = null,
) {
    val visuals = LocalMoVisuals.current
    Box(modifier.fillMaxSize()) {
        if (!backdropUrl.isNullOrBlank()) {
            AsyncImage(
                model = backdropUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer { scaleX = 1.05f; scaleY = 1.05f }
                    .blur(16.dp),
            )
            AsyncImage(
                model = backdropUrl,
                contentDescription = imageContentDescription,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer { alpha = 0.45f },
            )
        } else {
            Image(
                painter = painterResource(R.drawable.bg_app_cinematic),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
            )
        }

        // Warm accent glow orbs
        Canvas(Modifier.fillMaxSize()) {
            // Upper right — warm gold glow
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(visuals.accent.copy(alpha = 0.14f), Color.Transparent),
                    center = Offset(size.width * 0.85f, size.height * 0.15f),
                    radius = size.width * 0.40f,
                ),
                radius = size.width * 0.40f,
                center = Offset(size.width * 0.85f, size.height * 0.15f),
            )
            // Lower left — fiery orange glow
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(visuals.accentB.copy(alpha = 0.10f), Color.Transparent),
                    center = Offset(size.width * 0.15f, size.height * 0.85f),
                    radius = size.height * 0.40f,
                ),
                radius = size.height * 0.40f,
                center = Offset(size.width * 0.15f, size.height * 0.85f),
            )
            // Center-right — subtle amber warmth
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(visuals.accentC.copy(alpha = 0.06f), Color.Transparent),
                    center = Offset(size.width * 0.60f, size.height * 0.50f),
                    radius = size.width * 0.35f,
                ),
                radius = size.width * 0.35f,
                center = Offset(size.width * 0.60f, size.height * 0.50f),
            )
        }

        // Warm cinematic vignette — espresso to black
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colorStops = arrayOf(
                            0.00f to Color(0x88141110),
                            0.30f to Color(0xBB0E0C0A),
                            0.65f to Color(0xDD0A0908),
                            1.00f to Color(0xF00A0908),
                        ),
                    ),
                ),
        )

        FloatingParticles()

        // Warm vignette radial
        Canvas(Modifier.fillMaxSize()) {
            drawRect(
                brush = Brush.radialGradient(
                    colors = listOf(Color.Transparent, Color(0xBB0A0908)),
                    center = Offset(size.width * 0.5f, size.height * 0.5f),
                    radius = size.maxDimension * 0.75f,
                ),
            )
        }
    }
}
