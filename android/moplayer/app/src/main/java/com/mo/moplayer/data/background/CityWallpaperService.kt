package com.mo.moplayer.data.background

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import dagger.hilt.android.qualifiers.ApplicationContext
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

    fun fetchCityWallpaper(city: String, country: String?): Result<WallpaperResult> {
        return runCatching {
            val normalizedCity = city.trim()
            require(normalizedCity.isNotEmpty()) { "City is empty" }

            val searchTitle = findBestPageTitle(normalizedCity, country)
            val imageUrl = fetchImageUrl(searchTitle)
            val connection = URL(imageUrl).openConnection().apply {
                connectTimeout = 10_000
                readTimeout = 15_000
                setRequestProperty(
                    "User-Agent",
                    "${context.packageName}/city-wallpaper (Android)"
                )
            }
            val bitmap = connection.getInputStream().use { stream ->
                BitmapFactory.decodeStream(stream)
            } ?: error("Failed to decode wallpaper bitmap")

            WallpaperResult(
                bitmap = bitmap,
                sourceName = "Wikimedia",
                pageTitle = searchTitle,
                imageUrl = imageUrl
            )
        }
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
}
