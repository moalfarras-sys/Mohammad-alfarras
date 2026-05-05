package com.moalfarras.moplayer.ui.theme

import android.graphics.Bitmap
import androidx.compose.runtime.Composable
import androidx.compose.runtime.produceState
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.palette.graphics.Palette
import coil3.BitmapImage
import coil3.ImageLoader
import coil3.request.ImageRequest
import com.moalfarras.moplayer.domain.model.MediaItem

@Composable
fun rememberDynamicAccent(item: MediaItem?): Color {
    val context = LocalContext.current
    return produceState(initialValue = GlassChampagne, item?.posterUrl, item?.backdropUrl) {
        val source = item?.backdropUrl?.takeIf { it.isNotBlank() } ?: item?.posterUrl?.takeIf { it.isNotBlank() }
        if (source.isNullOrBlank()) {
            value = GlassChampagne
            return@produceState
        }
        runCatching {
            val result = ImageLoader(context).execute(ImageRequest.Builder(context).data(source).build())
            val bitmap = (result.image as? BitmapImage)?.bitmap
            if (bitmap != null) {
                value = bitmap.toWarmAccentColor()
            }
        }
    }.value
}

/**
 * Extracts a warm-toned accent from a poster/backdrop bitmap.
 * Forces cold colors to the warm Champagne Gold fallback to maintain
 * the Fiery Glass identity across the entire app.
 */
private fun Bitmap.toWarmAccentColor(): Color {
    val palette = Palette.from(this).clearFilters().generate()
    val swatch = palette.vibrantSwatch ?: palette.lightVibrantSwatch ?: palette.dominantSwatch
    val raw = Color(swatch?.rgb ?: GlassChampagne.toArgb())
    val r = raw.red
    val g = raw.green
    val b = raw.blue
    val lum = 0.2126f * r + 0.7152f * g + 0.0722f * b
    return when {
        // Too dark — fallback
        lum < 0.07f -> GlassChampagne
        // Overwhelmingly blue — cold; redirect to warm
        b > 0.65f && b > r * 1.8f && b > g * 1.8f -> GlassChampagne
        // Overwhelmingly green — cold; redirect to warm
        g > 0.65f && g > r * 1.8f && g > b * 1.8f -> GlassChampagne
        // Overwhelmingly cyan — cold; redirect to warm
        g > 0.55f && b > 0.55f && r < 0.35f -> GlassChampagne
        else -> raw
    }
}
