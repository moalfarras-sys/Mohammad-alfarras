package com.moalfarras.moplayer.ui.components

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.basicMarquee
import androidx.compose.foundation.border
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.gestures.LocalBringIntoViewSpec
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.calculateStartPadding
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.HeartBroken
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Update
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import coil3.network.HttpException
import coil3.request.ImageRequest
import coil3.size.Size
import coil3.size.pxOrElse
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.ui.i18n.HomeStrings
import com.moalfarras.moplayer.ui.i18n.LocalStrings
import com.moalfarras.moplayer.ui.i18n.home
import com.moalfarras.moplayer.ui.i18n.isolate
import com.moalfarras.moplayer.ui.theme.LocalMoVisuals
import com.moalfarras.moplayer.ui.theme.rememberTvScale
import com.moalfarras.moplayerpro.BuildConfig
import kotlinx.coroutines.delay
import java.io.IOException
import java.net.URI
import java.net.URLEncoder
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * Upper bound for poster/logo decode size, provided from the device performance policy at the app
 * root. Images are decoded at their on-screen slot size; this only caps big slots on weak boxes.
 */
val LocalPosterImageSize = staticCompositionLocalOf { Size(420, 640) }

private const val POSTER_ASPECT = 0.68f
private const val TILE_ASPECT = 16f / 9f
/** Headroom so an image still looks sharp at the focused card scale. */
private const val DECODE_HEADROOM = 1.1f
private const val FAVORITE_FEEDBACK_MS = 1_400L

private val LogoStageBrush = Brush.verticalGradient(listOf(Color(0xFF2C2622), Color(0xFF141117)))
private val PosterScrimBrush = Brush.verticalGradient(
    0f to Color.Transparent,
    0.45f to Color(0x66090807),
    1f to Color(0xF2090807),
)
private val CardTextShadow = Shadow(color = Color(0xCC000000), offset = Offset(0f, 1.5f), blurRadius = 6f)

private enum class ArtState { Loading, Loaded, Failed }

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers (unit-tested)
// ─────────────────────────────────────────────────────────────────────────────

private val Quality4k = Regex("""\b(4K|UHD|2160P?)\b""", RegexOption.IGNORE_CASE)
private val QualityFhd = Regex("""\b(FHD|1080[PI]?)\b""", RegexOption.IGNORE_CASE)
private val QualityHd = Regex("""\b(HD|720P?)\b|ᴴᴰ""", RegexOption.IGNORE_CASE)

/** Quality badge read from the title only — never from the stream URL (hosts/credentials). */
internal fun qualityBadge(title: String): String = when {
    Quality4k.containsMatchIn(title) -> "4K"
    QualityFhd.containsMatchIn(title) -> "FHD"
    QualityHd.containsMatchIn(title) -> "HD"
    else -> ""
}

/** Xtream stores tv_archive as "0"/"1"; M3U stores the catchup mode. Only real archives count. */
internal fun hasCatchup(value: String): Boolean {
    val v = value.trim().lowercase(Locale.ROOT)
    return v.isNotEmpty() && v != "0" && v != "false" && v != "no" && v != "none"
}

/**
 * Shrinks TMDB poster URLs to w342; every other URL is returned unchanged (loaded directly).
 * Only TMDB hosts are rewritten: a provider path that happens to contain "/original/" or
 * "/w500/" has no w342 variant.
 */
internal fun String.optimizedPosterUrl(): String {
    val url = trim()
    if (!isTmdbUrl(url)) return url
    return url
        .replace("/w600_and_h900_bestv2/", "/w342/")
        .replace("/w780/", "/w342/")
        .replace("/w500/", "/w342/")
        .replace("/original/", "/w342/")
}

private fun isTmdbHost(host: String): Boolean =
    host.equals("image.tmdb.org", ignoreCase = true) || host.endsWith(".tmdb.org", ignoreCase = true)

/** True for an http(s) URL served by TMDB's image CDN (the only host with sized path variants). */
internal fun isTmdbUrl(url: String): Boolean {
    if (!url.contains("tmdb.org", ignoreCase = true)) return false
    return isTmdbHost(runCatching { URI(url.trim()).host.orEmpty() }.getOrDefault(""))
}

/**
 * The website image proxy URL for a provider image, or null when the image must not go through
 * it (not http(s), TMDB, or already on the website). The proxy is only a fallback: it is rate
 * limited per IP and a direct load is faster.
 */
internal fun imageProxyUrl(url: String, base: String = BuildConfig.WEB_API_BASE_URL): String? {
    val normalized = url.trim()
    if (!normalized.startsWith("http://", ignoreCase = true) && !normalized.startsWith("https://", ignoreCase = true)) return null
    val host = runCatching { URI(normalized).host.orEmpty() }.getOrDefault("")
    if (host.isBlank() || isTmdbHost(host)) return null
    val root = base.trimEnd('/').ifBlank { "https://moalfarras.space" }
    if (normalized.startsWith(root, ignoreCase = true)) return null
    return "$root/api/app/image?url=${URLEncoder.encode(normalized, Charsets.UTF_8.name())}"
}

/**
 * Whether a failed direct image load is worth one retry through the website proxy: hotlink or
 * user-agent blocks (401/403/407), rate limits (429), server errors and network failures. A 404 or
 * 410 is final — the proxy would fail the same way.
 */
internal fun shouldRetryImageViaProxy(httpCode: Int?, error: Throwable?): Boolean = when {
    httpCode != null -> httpCode == 401 || httpCode == 403 || httpCode == 407 || httpCode == 429 || httpCode >= 500
    else -> error is IOException
}

private val LeadingTag = Regex("""^\s*[\[(][^\])]{0,12}[\])]\s*""")
private val LeadingCountryPrefix = Regex("""^\s*[A-Za-z]{2,3}\s*[:|]\s*""")
private val WordSplit = Regex("""[\s\-_./|:,]+""")
private val MonogramStopWords = setOf("the", "of", "a", "an", "and", "de", "la", "le", "el", "al")

/**
 * One or two initials for an artwork placeholder: "Tears of Steel" -> "TS", "AR: MBC 1" -> "M1",
 * "الجزيرة" -> "ا". Non-Latin scripts use a single letter so no broken ligature is drawn.
 */
internal fun monogramFor(title: String): String {
    val cleaned = title.replace(LeadingTag, "").replace(LeadingCountryPrefix, "").trim()
    val words = cleaned.split(WordSplit).filter { it.isNotEmpty() && it.first().isLetterOrDigit() }
    if (words.isEmpty()) return ""
    val meaningful = words.filter { it.lowercase(Locale.ROOT) !in MonogramStopWords }.ifEmpty { words }
    val first = meaningful.first().first()
    if (!first.isLatinOrDigit()) return first.toString()
    val second = meaningful.getOrNull(1)?.first()?.takeIf { it.isLatinOrDigit() }
    return (if (second != null) "$first$second" else "$first").uppercase(Locale.ROOT)
}

private fun Char.isLatinOrDigit(): Boolean = isDigit() || (isLetter() && code < 0x0250)

/** Two ARGB colors (top, bottom) derived from a title hash — calm, dark and stable per title. */
internal fun placeholderPalette(seed: String): IntArray {
    val hash = seed.trim().lowercase(Locale.ROOT).hashCode().toLong() and 0x7fffffffL
    val hue = (hash % 360L).toFloat()
    return intArrayOf(
        hsvToArgb(hue, 0.42f, 0.40f),
        hsvToArgb((hue + 32f) % 360f, 0.55f, 0.13f),
    )
}

internal fun hsvToArgb(hue: Float, saturation: Float, value: Float): Int {
    val c = value * saturation
    val sector = ((hue % 360f + 360f) % 360f) / 60f
    val x = c * (1f - abs(sector % 2f - 1f))
    val (r, g, b) = when (sector.toInt()) {
        0 -> Triple(c, x, 0f)
        1 -> Triple(x, c, 0f)
        2 -> Triple(0f, c, x)
        3 -> Triple(0f, x, c)
        4 -> Triple(x, 0f, c)
        else -> Triple(c, 0f, x)
    }
    val m = value - c
    fun channel(f: Float) = ((f + m) * 255f).roundToInt().coerceIn(0, 255)
    return (0xFF shl 24) or (channel(r) shl 16) or (channel(g) shl 8) or channel(b)
}

/** Decode dimension for a slot: the slot size plus a little headroom, capped by the device policy. */
internal fun decodeDimensionPx(slotPx: Float, capPx: Int): Int =
    (slotPx * DECODE_HEADROOM).roundToInt().coerceIn(1, capPx.coerceAtLeast(1))

/** "29 Sep" / "29 سبتمبر" in the app language. */
internal fun addedAtLabel(item: MediaItem, locale: Locale): String? {
    val timestamp = item.addedAt.takeIf { it > 0 && !item.addedAtUnknown } ?: item.lastModifiedAt.takeIf { it > 0 } ?: return null
    return runCatching {
        DateTimeFormatter.ofPattern("d MMM", locale).withZone(ZoneId.systemDefault()).format(Instant.ofEpochMilli(timestamp))
    }.getOrNull()
}

internal fun typeLabel(type: ContentType, h: HomeStrings): String = when (type) {
    ContentType.LIVE -> h.typeLive
    ContentType.MOVIE -> h.typeMovie
    ContentType.SERIES -> h.typeSeries
    ContentType.EPISODE -> h.typeEpisode
}

// ─────────────────────────────────────────────────────────────────────────────
// Artwork
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads provider artwork directly at the slot size; on a hotlink block, rate limit or network
 * failure it retries once through the website proxy, caching the bytes under the direct URL.
 */
@Composable
internal fun RemoteArtImage(
    url: String,
    contentDescription: String?,
    contentScale: ContentScale,
    slotWidth: Dp,
    slotHeight: Dp,
    modifier: Modifier = Modifier,
    onLoaded: () -> Unit = {},
    onFailed: () -> Unit = {},
) {
    if (url.isBlank()) return
    val context = LocalContext.current
    val density = LocalDensity.current
    val cap = LocalPosterImageSize.current
    val proxyUrl = remember(url) { imageProxyUrl(url) }
    var useProxy by remember(url) { mutableStateOf(false) }
    val model = if (useProxy && proxyUrl != null) proxyUrl else url
    val target = remember(density, slotWidth, slotHeight, cap) {
        with(density) {
            Size(
                decodeDimensionPx(slotWidth.toPx(), cap.width.pxOrElse { Int.MAX_VALUE }),
                decodeDimensionPx(slotHeight.toPx(), cap.height.pxOrElse { Int.MAX_VALUE }),
            )
        }
    }
    val request = remember(context, model, target) {
        ImageRequest.Builder(context)
            .data(model)
            .size(target)
            .memoryCacheKey(url)
            .diskCacheKey(url)
            .build()
    }
    val currentOnLoaded by rememberUpdatedState(onLoaded)
    val currentOnFailed by rememberUpdatedState(onFailed)
    AsyncImage(
        model = request,
        contentDescription = contentDescription,
        contentScale = contentScale,
        modifier = modifier,
        onSuccess = { currentOnLoaded() },
        onError = { state ->
            val error = state.result.throwable
            if (!useProxy && proxyUrl != null && shouldRetryImageViaProxy((error as? HttpException)?.response?.code, error)) {
                useProxy = true
            } else {
                currentOnFailed()
            }
        },
    )
}

/**
 * Artwork placeholder for items without (or with broken) art: a calm gradient derived from the
 * title, a large monogram, the title rendered once and an optional type badge.
 */
@Composable
fun ArtworkPlaceholder(
    title: String,
    type: ContentType,
    modifier: Modifier = Modifier,
    showTitle: Boolean = true,
    showTypeBadge: Boolean = false,
    monogramSize: TextUnit = 30.sp,
) {
    val h = LocalStrings.current.home
    val palette = remember(title) { placeholderPalette(title) }
    val monogram = remember(title) { monogramFor(title) }
    Box(
        modifier.background(
            Brush.linearGradient(
                listOf(Color(palette[0]), Color(palette[1])),
                start = Offset.Zero,
                end = Offset(Float.POSITIVE_INFINITY, Float.POSITIVE_INFINITY),
            ),
        ),
    ) {
        Box(
            Modifier
                .fillMaxSize()
                .background(Brush.radialGradient(listOf(Color.White.copy(alpha = 0.10f), Color.Transparent))),
        )
        Text(
            monogram.ifEmpty { "•" },
            color = Color.White.copy(alpha = 0.88f),
            fontSize = monogramSize,
            fontWeight = FontWeight.Black,
            maxLines = 1,
            style = MaterialTheme.typography.displayMedium.copy(shadow = CardTextShadow, fontSize = monogramSize, lineHeight = monogramSize),
            modifier = Modifier.align(if (showTitle) BiasCenterUpper else Alignment.Center),
        )
        if (showTypeBadge) {
            CardBadge(
                typeLabel(type, h),
                modifier = Modifier.align(Alignment.TopStart).padding(8.dp),
            )
        }
        if (showTitle) {
            Text(
                title,
                color = Color.White,
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, shadow = CardTextShadow),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 10.dp),
            )
        }
    }
}

private val BiasCenterUpper = androidx.compose.ui.BiasAlignment(0f, -0.22f)

@Composable
private fun CardBadge(text: String, modifier: Modifier = Modifier, live: Boolean = false) {
    val visuals = LocalMoVisuals.current
    Box(
        modifier
            .clip(RoundedCornerShape(999.dp))
            .background(
                if (live) Brush.horizontalGradient(listOf(visuals.live, visuals.error))
                else Brush.horizontalGradient(listOf(Color(0xE00B0A0C), Color(0xE00B0A0C))),
            )
            .border(0.8.dp, Color.White.copy(alpha = if (live) 0f else 0.20f), RoundedCornerShape(999.dp))
            .padding(horizontal = 7.dp, vertical = 2.dp),
    ) {
        Text(
            text,
            color = Color.White,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold, letterSpacing = 0.sp),
            maxLines = 1,
        )
    }
}

/** Channel logo on a neutral stage; a monogram tile when there is no logo or it fails to load. */
@Composable
fun ChannelLogo(
    item: MediaItem,
    width: Dp,
    modifier: Modifier = Modifier,
    height: Dp = width,
    cornerRadius: Dp = minOf(width, height) * 0.24f,
    monogramSize: TextUnit = 16.sp,
) {
    val url = remember(item.posterUrl) { item.posterUrl.optimizedPosterUrl() }
    var state by remember(url) { mutableStateOf(if (url.isBlank()) ArtState.Failed else ArtState.Loading) }
    val shape = RoundedCornerShape(cornerRadius)
    Box(
        modifier
            .size(width, height)
            .clip(shape)
            .border(0.7.dp, Color.White.copy(alpha = 0.10f), shape),
        contentAlignment = Alignment.Center,
    ) {
        if (state == ArtState.Failed) {
            ArtworkPlaceholder(item.title, item.type, Modifier.fillMaxSize(), showTitle = false, monogramSize = monogramSize)
        } else {
            Box(Modifier.fillMaxSize().background(LogoStageBrush))
            RemoteArtImage(
                url = url,
                contentDescription = null,
                contentScale = ContentScale.Fit,
                slotWidth = width,
                slotHeight = height,
                modifier = Modifier.fillMaxSize().padding(horizontal = width * 0.14f, vertical = height * 0.14f),
                onLoaded = { state = ArtState.Loaded },
                onFailed = { state = ArtState.Failed },
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Favorite feedback — shown on the card that was long-pressed
// ─────────────────────────────────────────────────────────────────────────────

@Stable
class FavoriteFeedback {
    /** true = added, false = removed, null = hidden. */
    var added by mutableStateOf<Boolean?>(null)
        internal set
    internal var token by mutableIntStateOf(0)

    fun show(nowFavorite: Boolean) {
        added = nowFavorite
        token++
    }
}

@Composable
fun rememberFavoriteFeedback(): FavoriteFeedback {
    val feedback = remember { FavoriteFeedback() }
    LaunchedEffect(feedback.token) {
        if (feedback.added != null) {
            delay(FAVORITE_FEEDBACK_MS)
            feedback.added = null
        }
    }
    return feedback
}

@Composable
fun BoxScope.FavoriteBurst(feedback: FavoriteFeedback, modifier: Modifier = Modifier) {
    val added = feedback.added ?: return
    val visuals = LocalMoVisuals.current
    val h = LocalStrings.current.home
    Row(
        modifier
            .align(Alignment.Center)
            .padding(6.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xEE0B0A0C))
            .border(1.dp, visuals.accent.copy(alpha = 0.55f), RoundedCornerShape(14.dp))
            .padding(horizontal = 10.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Icon(
            if (added) Icons.Rounded.Favorite else Icons.Rounded.HeartBroken,
            contentDescription = null,
            tint = if (added) visuals.accent else Color.White.copy(alpha = 0.8f),
            modifier = Modifier.size(18.dp),
        )
        Text(
            if (added) h.favoriteAdded else h.favoriteRemoved,
            color = Color.White,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA POSTER — movies, series (and live items in the favorites grid)
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun MediaPoster(
    item: MediaItem,
    onFocus: (MediaItem) -> Unit,
    onClick: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit = {},
    modifier: Modifier = Modifier,
    focusRequester: FocusRequester? = null,
    posterWidth: Dp? = null,
    showFavoriteMark: Boolean = true,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    val width = posterWidth ?: tv.posterWidth
    val height = width / POSTER_ASPECT
    val isLive = item.type == ContentType.LIVE
    val artUrl = remember(item.posterUrl, item.backdropUrl) {
        item.posterUrl.ifBlank { item.backdropUrl }.optimizedPosterUrl()
    }
    var art by remember(artUrl) { mutableStateOf(if (artUrl.isBlank()) ArtState.Failed else ArtState.Loading) }
    val quality = remember(item.title) { qualityBadge(item.title) }
    val favoriteFeedback = rememberFavoriteFeedback()
    val radius = tv.cardRadius
    FocusGlow(
        modifier = modifier.width(width).height(height),
        cornerRadius = radius,
        focusRequester = focusRequester,
        onFocused = { onFocus(item) },
        onClick = { onClick(item) },
        onLongClick = {
            favoriteFeedback.show(!item.isFavorite)
            onFavorite(item)
        },
        focusedScale = FocusScale.Card,
        clickGuardMs = CARD_CLICK_GUARD_MS,
    ) {
        val inner = RoundedCornerShape((radius - 2.dp).coerceAtLeast(4.dp))
        Box(
            Modifier
                .fillMaxSize()
                .clip(inner)
                .background(if (isLive) LogoStageBrush else Brush.verticalGradient(listOf(visuals.surfaceHigh, visuals.surface))),
        ) {
            if (art == ArtState.Failed) {
                ArtworkPlaceholder(
                    item.title,
                    item.type,
                    Modifier.fillMaxSize(),
                    showTitle = true,
                    monogramSize = (width.value * 0.30f).sp,
                )
            } else {
                RemoteArtImage(
                    url = artUrl,
                    contentDescription = item.title,
                    contentScale = if (isLive) ContentScale.Fit else ContentScale.Crop,
                    slotWidth = width,
                    slotHeight = height,
                    modifier = if (isLive) {
                        Modifier.fillMaxWidth().fillMaxHeight(0.66f).padding(horizontal = width * 0.14f, vertical = height * 0.08f)
                    } else {
                        Modifier.fillMaxSize()
                    },
                    onLoaded = { art = ArtState.Loaded },
                    onFailed = { art = ArtState.Failed },
                )
                Box(Modifier.align(Alignment.BottomCenter).fillMaxWidth().fillMaxHeight(0.55f).background(PosterScrimBrush))
                Text(
                    item.title,
                    color = Color.White,
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, shadow = CardTextShadow),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .fillMaxWidth()
                        .padding(start = 8.dp, end = 8.dp, bottom = if (item.hasProgress()) 12.dp else 8.dp),
                )
            }

            val badge = when {
                isLive -> "● ${strings.badgeLive}"
                // One short label: "MOVIE · FHD" was truncated to "MOVIE ·" on 100dp phone posters.
                art == ArtState.Failed -> quality.ifBlank { typeLabel(item.type, strings.home) }
                else -> quality
            }
            if (badge.isNotBlank()) {
                CardBadge(badge, Modifier.align(Alignment.TopStart).padding(6.dp), live = isLive)
            }
            if (showFavoriteMark && item.isFavorite) {
                Icon(
                    Icons.Rounded.Favorite,
                    null,
                    tint = visuals.accent,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(6.dp)
                        .clip(CircleShape)
                        .background(Color(0xB30B0A0C))
                        .padding(4.dp)
                        .size(13.dp),
                )
            }
            if (item.hasProgress()) {
                WatchProgressBar(
                    fraction = item.progressFraction(),
                    modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(horizontal = 8.dp, vertical = 5.dp),
                )
            }
            FavoriteBurst(favoriteFeedback)
        }
    }
}

private fun MediaItem.hasProgress(): Boolean = watchPositionMs > 0 && watchDurationMs > 0

private fun MediaItem.progressFraction(): Float =
    (watchPositionMs.toFloat() / watchDurationMs).coerceIn(0f, 1f)

@Composable
fun WatchProgressBar(fraction: Float, modifier: Modifier = Modifier) {
    val visuals = LocalMoVisuals.current
    Box(
        modifier
            .height(3.dp)
            .clip(RoundedCornerShape(999.dp))
            .background(Color(0x40FFFFFF)),
    ) {
        Box(
            Modifier
                .fillMaxWidth(fraction.coerceIn(0f, 1f))
                .fillMaxHeight()
                .clip(RoundedCornerShape(999.dp))
                .background(Brush.horizontalGradient(listOf(visuals.accent, visuals.accentB))),
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANNEL TILE — 16:9 live channel card for the Home rows
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun ChannelTile(
    item: MediaItem,
    onFocus: (MediaItem) -> Unit,
    onClick: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit = {},
    modifier: Modifier = Modifier,
    focusRequester: FocusRequester? = null,
    width: Dp,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    val logoHeight = width / TILE_ASPECT
    val favoriteFeedback = rememberFavoriteFeedback()
    val radius = tv.cardRadius
    FocusGlow(
        modifier = modifier.width(width),
        cornerRadius = radius,
        focusRequester = focusRequester,
        onFocused = { onFocus(item) },
        onClick = { onClick(item) },
        onLongClick = {
            favoriteFeedback.show(!item.isFavorite)
            onFavorite(item)
        },
        focusedScale = FocusScale.Card,
        clickGuardMs = CARD_CLICK_GUARD_MS,
    ) {
        val focused = LocalFocusGlowFocused.current
        val inner = RoundedCornerShape((radius - 2.dp).coerceAtLeast(4.dp))
        Column(
            Modifier
                .fillMaxWidth()
                .clip(inner)
                .background(if (focused) visuals.surfaceHigh else visuals.surface.copy(alpha = 0.92f)),
        ) {
            Box(Modifier.fillMaxWidth().height(logoHeight)) {
                ChannelLogo(
                    item = item,
                    width = width,
                    height = logoHeight,
                    cornerRadius = 0.dp,
                    monogramSize = (logoHeight.value * 0.36f).sp,
                )
                CardBadge("● ${strings.badgeLive}", Modifier.align(Alignment.TopStart).padding(6.dp), live = true)
                if (item.isFavorite) {
                    Icon(
                        Icons.Rounded.Favorite,
                        null,
                        tint = visuals.accent,
                        modifier = Modifier.align(Alignment.TopEnd).padding(7.dp).size(14.dp),
                    )
                }
            }
            Text(
                item.title,
                color = if (focused) Color.White else Color.White.copy(alpha = 0.92f),
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                maxLines = 2,
                minLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 9.dp, vertical = 7.dp),
            )
        }
        FavoriteBurst(favoriteFeedback)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANNEL ROW — Live list and search results
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun ChannelRow(
    item: MediaItem,
    onFocus: (MediaItem) -> Unit,
    onClick: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit = {},
    modifier: Modifier = Modifier,
    focusRequester: FocusRequester? = null,
) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    val strings = LocalStrings.current
    val h = strings.home
    val favoriteFeedback = rememberFavoriteFeedback()
    val rowHeight = if (tv.isTv) tv.u(56f) else 60.dp
    val logoSize = if (tv.isTv) tv.u(42f) else 44.dp
    val radius = if (tv.isTv) tv.u(12f) else 14.dp
    val catchup = item.type == ContentType.LIVE && hasCatchup(item.catchup)
    val meta = remember(item, h) {
        buildList {
            if (item.type != ContentType.LIVE) add(typeLabel(item.type, h))
            if (item.categoryName.isNotBlank()) add(item.categoryName.isolate())
            item.releaseDate.take(4).takeIf { it.length == 4 && it.all(Char::isDigit) && item.type != ContentType.LIVE }?.let(::add)
        }.joinToString("  •  ")
    }
    FocusGlow(
        modifier = modifier.fillMaxWidth().heightIn(min = rowHeight),
        cornerRadius = radius,
        focusRequester = focusRequester,
        onFocused = { onFocus(item) },
        onClick = { onClick(item) },
        onLongClick = {
            favoriteFeedback.show(!item.isFavorite)
            onFavorite(item)
        },
        focusedScale = FocusScale.Row,
        glowElevation = 8.dp,
        clickGuardMs = CARD_CLICK_GUARD_MS,
    ) {
        val focused = LocalFocusGlowFocused.current
        Row(
            Modifier
                .fillMaxWidth()
                .heightIn(min = rowHeight)
                .clip(RoundedCornerShape((radius - 2.dp).coerceAtLeast(4.dp)))
                .background(if (focused) visuals.surfaceHigh.copy(alpha = 0.97f) else visuals.surface.copy(alpha = 0.55f))
                .padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            if (item.type == ContentType.LIVE && item.serverOrder != Int.MAX_VALUE) {
                Text(
                    item.serverOrder.toString(),
                    color = if (focused) visuals.accent else Color.White.copy(alpha = 0.55f),
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    textAlign = TextAlign.End,
                    maxLines = 1,
                    modifier = Modifier.widthIn(min = 26.dp),
                )
            }
            ChannelLogo(item, width = logoSize, monogramSize = (logoSize.value * 0.38f).sp)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    item.title,
                    color = Color.White,
                    style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold),
                    maxLines = 1,
                    // The focused row scrolls a name that does not fit, so it can always be read.
                    overflow = if (focused) TextOverflow.Clip else TextOverflow.Ellipsis,
                    modifier = if (focused) Modifier.basicMarquee(iterations = 2, initialDelayMillis = 900) else Modifier,
                )
                if (meta.isNotBlank()) {
                    Text(
                        meta,
                        color = Color.White.copy(alpha = 0.60f),
                        style = MaterialTheme.typography.labelMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            if (catchup) {
                Row(
                    Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(visuals.accent.copy(alpha = 0.14f))
                        .border(0.7.dp, visuals.accent.copy(alpha = 0.32f), RoundedCornerShape(999.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Icon(Icons.Rounded.Update, null, tint = visuals.accent, modifier = Modifier.size(13.dp))
                    Text(
                        strings.badgeCatchup,
                        color = visuals.textPrimary,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        maxLines = 1,
                    )
                }
            }
            if (item.isFavorite) {
                Icon(Icons.Rounded.Favorite, null, tint = visuals.accent, modifier = Modifier.size(16.dp))
            }
            if (focused) {
                Box(
                    Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(visuals.accent),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Rounded.PlayArrow, null, tint = Color(0xFF14100C), modifier = Modifier.size(18.dp))
                }
            }
        }
        FavoriteBurst(favoriteFeedback)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA LANE — horizontal row with a section title (Home)
// ─────────────────────────────────────────────────────────────────────────────

enum class LaneStyle { Poster, Channel }

/**
 * A Home row. Focus inputs are one-shot by contract: the caller passes [restoreFocusTarget] only
 * to the lane that holds it and [autoFocusFirstItem] only to the first lane, and turns both off
 * as soon as anything on the screen gets focus, so a lane can never re-arm and steal focus.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MediaLane(
    title: String,
    items: List<MediaItem>,
    onFocus: (MediaItem) -> Unit,
    onClick: (MediaItem) -> Unit,
    onFavorite: (MediaItem) -> Unit = {},
    modifier: Modifier = Modifier,
    style: LaneStyle = LaneStyle.Poster,
    restoreFocusTarget: MediaItem? = null,
    autoFocusFirstItem: Boolean = false,
    showTitle: Boolean = true,
    cardWidth: Dp? = null,
    contentPadding: PaddingValues = PaddingValues(0.dp),
) {
    if (items.isEmpty()) return
    val tv = rememberTvScale()
    val rowState = rememberLazyListState()
    val restoreIndex = remember(restoreFocusTarget, items) {
        restoreFocusTarget?.let { target -> items.indexOfFirst { target.sameLaneItem(it) }.takeIf { it >= 0 } }
    }
    val initialFocusIndex = restoreIndex ?: if (autoFocusFirstItem) 0 else null
    LaunchedEffect(initialFocusIndex) {
        initialFocusIndex?.let { rowState.scrollToPivotIfNeeded(it) }
    }
    val width = cardWidth ?: when (style) {
        LaneStyle.Poster -> if (tv.isTv) tv.u(100f) else tv.posterWidth
        LaneStyle.Channel -> if (tv.isTv) tv.u(150f) else 148.dp
    }
    val layoutDirection = LocalLayoutDirection.current
    Column(modifier, verticalArrangement = Arrangement.spacedBy(if (tv.isTv) tv.u(8f) else 8.dp)) {
        if (showTitle) {
            SectionTitle(title, Modifier.padding(start = contentPadding.calculateStartPadding(layoutDirection)))
        }
        CompositionLocalProvider(LocalBringIntoViewSpec provides rememberTvBringIntoViewSpec(horizontal = true)) {
            LazyRow(
                state = rowState,
                horizontalArrangement = Arrangement.spacedBy(if (tv.isTv) tv.u(14f) else 12.dp),
                contentPadding = contentPadding,
                modifier = Modifier.focusGroup(),
            ) {
                itemsIndexed(
                    items,
                    key = { _, item -> "${item.type}-${item.serverId}-${item.id}" },
                    contentType = { _, item -> item.type },
                ) { index, item ->
                    val itemFocus = remember(item.id, item.type, item.serverId) { FocusRequester() }
                    if (tv.isTv && index == initialFocusIndex) {
                        LaunchedEffect(Unit) {
                            delay(FOCUS_REQUEST_DELAY_MS)
                            runCatching { itemFocus.requestFocus() }
                        }
                    }
                    when (style) {
                        LaneStyle.Poster -> MediaPoster(item, onFocus, onClick, onFavorite, focusRequester = itemFocus, posterWidth = width)
                        LaneStyle.Channel -> ChannelTile(item, onFocus, onClick, onFavorite, focusRequester = itemFocus, width = width)
                    }
                }
            }
        }
    }
}

@Composable
fun SectionTitle(title: String, modifier: Modifier = Modifier) {
    val tv = rememberTvScale()
    val visuals = LocalMoVisuals.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = modifier,
    ) {
        Box(
            Modifier
                .width(3.dp)
                .height(if (tv.isTv) tv.u(16f) else 16.dp)
                .clip(RoundedCornerShape(999.dp))
                .background(Brush.verticalGradient(listOf(visuals.accent, visuals.accentB))),
        )
        Text(
            title,
            color = Color.White,
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 0.sp),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

private fun MediaItem?.sameLaneItem(item: MediaItem): Boolean =
    this != null && id == item.id && type == item.type && serverId == item.serverId
