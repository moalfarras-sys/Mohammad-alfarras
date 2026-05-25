package com.mo.moplayer.data.background

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import dagger.hilt.android.qualifiers.ApplicationContext
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton
import org.json.JSONObject

@Singleton
class CityWallpaperService @Inject constructor(
    @ApplicationContext private val context: Context
) {

    data class WallpaperResult(
        val bitmap: Bitmap,
        val sourceName: String,
        val pageTitle: String,
        val imageUrl: String
    )

    fun fetchCityWallpaper(city: String, country: String?, rotationSlot: Long = System.currentTimeMillis() / SIX_HOURS_MS): Result<WallpaperResult> {
        return runCatching {
            val normalizedCity = city.trim()
            val safeCity = normalizedCity.ifBlank { "World" }

            val candidates = buildWallpaperCandidates(safeCity, country, rotationSlot)
            var lastError: Throwable? = null
            for (candidate in candidates) {
                try {
                    val bitmap = downloadBitmap(candidate.imageUrl) ?: error("Failed to decode wallpaper bitmap")
                    return@runCatching WallpaperResult(
                        bitmap = bitmap,
                        sourceName = candidate.sourceName,
                        pageTitle = candidate.pageTitle,
                        imageUrl = candidate.imageUrl
                    )
                } catch (error: Throwable) {
                    lastError = error
                }
            }

            throw lastError ?: IllegalStateException("No city wallpaper source available")
        }
    }

    private data class WallpaperCandidate(
        val sourceName: String,
        val pageTitle: String,
        val imageUrl: String
    )

    private fun buildWallpaperCandidates(city: String, country: String?, rotationSlot: Long): List<WallpaperCandidate> {
        val candidates = mutableListOf<WallpaperCandidate>()
        val commonsCities = listOf(
            "New York City skyline",
            "Dubai skyline",
            "London skyline",
            "Paris city night",
            "Istanbul skyline",
            "Doha skyline",
            "Berlin skyline",
            "Tokyo skyline",
            "Singapore skyline",
            "Hong Kong skyline",
            "Chicago skyline",
            "Shanghai skyline",
            "Toronto skyline",
            "Sydney skyline",
            "Madrid skyline",
            "Rome city skyline"
        )
        val rotatedCityQuery = commonsCities[(rotationSlot % commonsCities.size).toInt()]
        runCatching {
            val searchTitle = findBestCommonsImageTitle("$city ${country.orEmpty()} skyline")
            candidates += WallpaperCandidate("Wikimedia Commons", searchTitle, fetchCommonsImageUrl(searchTitle))
        }
        runCatching {
            val searchTitle = findBestCommonsImageTitle(rotatedCityQuery)
            candidates += WallpaperCandidate("Wikimedia Commons", searchTitle, fetchCommonsImageUrl(searchTitle))
        }
        runCatching {
            val searchTitle = findBestPageTitle(city, country)
            candidates += WallpaperCandidate("Wikipedia page image", searchTitle, fetchImageUrl(searchTitle))
        }
        val unsplashQuery = URLEncoder.encode(listOfNotNull(city, country, "skyline").joinToString(" "), Charsets.UTF_8.name())
        candidates += WallpaperCandidate(
            sourceName = "Unsplash Source",
            pageTitle = "$city skyline",
            imageUrl = "https://source.unsplash.com/1920x1080/?$unsplashQuery"
        )
        candidates += WallpaperCandidate(
            sourceName = "Picsum Photos",
            pageTitle = "Cinematic city fallback",
            imageUrl = "https://picsum.photos/1920/1080"
        )
        return candidates.distinctBy { it.imageUrl }
    }

    private fun downloadBitmap(imageUrl: String): Bitmap? {
        val connection = (URL(imageUrl).openConnection() as HttpURLConnection).apply {
            instanceFollowRedirects = true
            connectTimeout = 10_000
            readTimeout = 15_000
            setRequestProperty("User-Agent", "${context.packageName}/city-wallpaper (Android)")
        }
        return runCatching {
            connection.inputStream.use { stream ->
                BitmapFactory.decodeStream(stream)
            }
        }.also {
            connection.disconnect()
        }.getOrThrow()
    }

    private fun findBestPageTitle(city: String, country: String?): String {
        val candidates = buildList {
            add("$city skyline")
            if (!country.isNullOrBlank()) add("$city $country skyline")
            add("$city landmark city")
            add(city)
        }

        for (candidate in candidates) {
            val encoded = URLEncoder.encode(candidate, Charsets.UTF_8.name())
            val searchUrl =
                "https://en.wikipedia.org/w/api.php?action=query&list=search&utf8=1&format=json&srlimit=5&srsearch=$encoded"
            val response = URL(searchUrl).readText()
            val json = JSONObject(response)
            val results = json.getJSONObject("query").getJSONArray("search")
            for (index in 0 until results.length()) {
                val item = results.getJSONObject(index)
                val title = item.optString("title")
                if (title.contains(city, ignoreCase = true) || index == 0) {
                    return title
                }
            }
        }

        error("No wallpaper page found for $city")
    }

    private fun findBestCommonsImageTitle(query: String): String {
        val encoded = URLEncoder.encode(query, Charsets.UTF_8.name())
        val searchUrl =
            "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$encoded%20filetype:bitmap&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime|size&format=json"
        val response = URL(searchUrl).readText()
        val pages = JSONObject(response).optJSONObject("query")?.optJSONObject("pages")
            ?: error("No Commons image found for $query")
        val keys = pages.keys()
        var fallback: String? = null
        while (keys.hasNext()) {
            val page = pages.getJSONObject(keys.next())
            val title = page.optString("title")
            val imageInfo = page.optJSONArray("imageinfo")?.optJSONObject(0)
            val mime = imageInfo?.optString("mime").orEmpty()
            val width = imageInfo?.optInt("width") ?: 0
            if (title.endsWith(".svg", ignoreCase = true)) continue
            if (!mime.startsWith("image/")) continue
            if (fallback == null) fallback = title
            if (width >= 1200) return title
        }
        return fallback ?: error("No usable Commons image found for $query")
    }

    private fun fetchCommonsImageUrl(fileTitle: String): String {
        val encodedTitle = URLEncoder.encode(fileTitle, Charsets.UTF_8.name())
        val imageInfoUrl =
            "https://commons.wikimedia.org/w/api.php?action=query&titles=$encodedTitle&prop=imageinfo&iiprop=url&iiurlwidth=1920&format=json"
        val response = URL(imageInfoUrl).readText()
        val pages = JSONObject(response).getJSONObject("query").getJSONObject("pages")
        val keys = pages.keys()
        while (keys.hasNext()) {
            val imageInfo = pages.getJSONObject(keys.next()).optJSONArray("imageinfo")?.optJSONObject(0)
            val thumb = imageInfo?.optString("thumburl").orEmpty()
            val original = imageInfo?.optString("url").orEmpty()
            return thumb.ifBlank { original }
        }
        error("No Commons image URL for $fileTitle")
    }

    private fun fetchImageUrl(pageTitle: String): String {
        val encodedTitle = URLEncoder.encode(pageTitle, Charsets.UTF_8.name())
        val imageUrl =
            "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&pithumbsize=1920&titles=$encodedTitle"
        val response = URL(imageUrl).readText()
        val json = JSONObject(response)
        val pages = json.getJSONObject("query").getJSONObject("pages")
        val pageKeys = pages.keys()

        while (pageKeys.hasNext()) {
            val page = pages.getJSONObject(pageKeys.next())
            val original = page.optJSONObject("original")
            if (original != null) {
                return original.optString("source")
            }
            val thumbnail = page.optJSONObject("thumbnail")
            if (thumbnail != null) {
                return thumbnail.optString("source")
            }
        }

        error("No page image found for $pageTitle")
    }

    companion object {
        private const val SIX_HOURS_MS = 6 * 60 * 60 * 1000L
    }
}
