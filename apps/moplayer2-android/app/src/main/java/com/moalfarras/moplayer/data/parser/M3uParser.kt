package com.moalfarras.moplayer.data.parser

import com.moalfarras.moplayer.domain.model.Category
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import java.security.MessageDigest
import java.net.URLEncoder
import java.util.Locale

data class ParsedPlaylist(
    val categories: List<Category>,
    val media: List<MediaItem>,
)

class M3uParser {
    private val attributeRegex = Regex("""([A-Za-z0-9_-]+)=["']([^"']*)["']""")
    private val episodePatterns = listOf(
        Regex("""(?i)(.*?)\s*[-_. ]?\s*(?:s|season|موسم|الموسم)\s*([0-9]+)\s*[-_. ]?\s*(?:e|ep|episode|حلقة|الحلقة)\s*([0-9]+)"""),
        Regex("""(?i)(.*?)\s+([0-9]{1,2})x([0-9]{1,3})\b"""),
        Regex("""(?i)(.*?)\s+(?:episode|ep|حلقة|الحلقة)\s*([0-9]{1,3})\b"""),
    )

    fun parse(serverId: Long, text: String): ParsedPlaylist {
        val categories = linkedMapOf<String, Category>()
        val media = ArrayList<MediaItem>(8192)
        val seriesMap = mutableMapOf<String, MediaItem>()
        var pendingInfo: ExtInfo? = null
        val pendingHeaders = linkedMapOf<String, String>()

        text.lineSequence()
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .forEach { line ->
                when {
                    line.startsWith("#EXTINF", ignoreCase = true) -> {
                        pendingInfo = parseInfo(line)
                        pendingHeaders.clear()
                        pendingHeaders.putAll(pendingInfo?.headers.orEmpty())
                    }
                    line.startsWith("#EXTVLCOPT", ignoreCase = true) -> {
                        parseHeaderLine(line.substringAfter(':', missingDelimiterValue = "")).let { (key, value) ->
                            if (key.isNotBlank() && value.isNotBlank()) pendingHeaders[normalizeHeaderName(key)] = value
                        }
                    }
                    line.startsWith("#KODIPROP", ignoreCase = true) -> {
                        parseKodiHeaderLine(line.substringAfter(':', missingDelimiterValue = ""), pendingHeaders)
                    }
                    line.startsWith("#EXTHTTP", ignoreCase = true) -> {
                        pendingHeaders.putAll(parseExtHttpHeaders(line))
                    }
                    line.startsWith("#") -> Unit
                    pendingInfo != null -> {
                        val info = pendingInfo ?: return@forEach
                        val streamUrl = appendIptvHeaders(line, pendingHeaders)
                        var type = inferType(info, line)
                        val categoryId = stableId("${type.name}:${info.group}")
                        categories.putIfAbsent(
                            categoryId,
                            Category(
                                id = categoryId,
                                serverId = serverId,
                                type = type,
                                name = info.group.ifBlank { defaultCategoryName(type) },
                                sortOrder = categories.size,
                                rawJson = info.rawJson,
                            ),
                        )

                        var title = info.title.ifBlank { line.substringAfterLast('/').substringBefore('?').ifBlank { "Untitled" } }
                        var seasonNum = 0
                        var episodeNum = 0
                        var seriesId = ""

                        if (type == ContentType.SERIES) {
                            val match = episodePatterns.firstNotNullOfOrNull { it.find(title) }
                            if (match != null) {
                                val cleanSeriesName = match.groupValues[1].trim().ifBlank { info.group.ifBlank { "Series" } }
                                if (match.groupValues.size >= 4) {
                                    seasonNum = match.groupValues[2].toIntOrNull() ?: 1
                                    episodeNum = match.groupValues[3].toIntOrNull() ?: 0
                                } else {
                                    seasonNum = 1
                                    episodeNum = match.groupValues[2].toIntOrNull() ?: 0
                                }
                                seriesId = stableId("series:$cleanSeriesName")
                                if (!seriesMap.containsKey(seriesId)) {
                                    val parentSeries = MediaItem(
                                        id = seriesId,
                                        serverId = serverId,
                                        type = ContentType.SERIES,
                                        categoryId = categoryId,
                                        categoryName = info.group,
                                        title = cleanSeriesName.ifBlank { title },
                                        streamUrl = "",
                                        posterUrl = info.logo,
                                        description = "Series $cleanSeriesName",
                                        addedAt = 0,
                                        addedAtUnknown = true,
                                        serverOrder = media.size,
                                        seriesId = seriesId,
                                        rawJson = info.rawJson,
                                    )
                                    seriesMap[seriesId] = parentSeries
                                    media += parentSeries
                                }
                                type = ContentType.EPISODE
                                title = "Episode $episodeNum"
                            }
                        }

                        media += MediaItem(
                            id = stableId("${info.tvgId}:${info.title}:$streamUrl"),
                            serverId = serverId,
                            type = type,
                            categoryId = categoryId,
                            categoryName = info.group,
                            title = title,
                            streamUrl = streamUrl,
                            posterUrl = info.logo,
                            description = if (type == ContentType.EPISODE) "Season $seasonNum - Episode $episodeNum" else title,
                            addedAt = 0,
                            addedAtUnknown = true,
                            serverOrder = media.size,
                            seriesId = seriesId,
                            seasonNumber = seasonNum,
                            episodeNumber = episodeNum,
                            tvgId = info.tvgId,
                            catchup = info.catchup,
                            rawJson = info.rawJson,
                        )
                        pendingInfo = null
                        pendingHeaders.clear()
                    }
                }
            }

        return ParsedPlaylist(categories.values.toList(), media)
    }

    private fun parseInfo(line: String): ExtInfo {
        val attrs = attributeRegex.findAll(line).associate { it.groupValues[1].lowercase(Locale.US) to it.groupValues[2] }
        val title = line.substringAfterLast(',', missingDelimiterValue = attrs["tvg-name"].orEmpty()).trim()
        val catchup = attrs["catchup"].orEmpty()
            .ifBlank { attrs["catchup-source"].orEmpty() }
            .ifBlank { attrs["timeshift"].orEmpty() }
        val headers = linkedMapOf<String, String>()
        attrs["http-user-agent"]?.takeIf { it.isNotBlank() }?.let { headers["User-Agent"] = it }
        attrs["user-agent"]?.takeIf { it.isNotBlank() }?.let { headers["User-Agent"] = it }
        attrs["http-referrer"]?.takeIf { it.isNotBlank() }?.let { headers["Referer"] = it }
        attrs["http-referer"]?.takeIf { it.isNotBlank() }?.let { headers["Referer"] = it }
        attrs["referrer"]?.takeIf { it.isNotBlank() }?.let { headers["Referer"] = it }
        return ExtInfo(
            title = title.ifBlank { attrs["tvg-name"].orEmpty() },
            tvgId = attrs["tvg-id"].orEmpty(),
            logo = attrs["tvg-logo"].orEmpty(),
            group = attrs["group-title"].orEmpty(),
            catchup = catchup,
            headers = headers,
            rawJson = attrs.entries.joinToString(prefix = "{", postfix = "}") { (key, value) -> "\"$key\":\"${value.escapeJson()}\"" },
        )
    }

    private fun inferType(info: ExtInfo, url: String): ContentType {
        val value = "${info.group} ${info.title} $url".lowercase(Locale.US)
        return when {
            "/series/" in value || "series" in value || "مسلسل" in value || "مسلسلات" in value -> ContentType.SERIES
            "/movie/" in value || "movie" in value || "vod" in value || "film" in value || "فيلم" in value || "افلام" in value || "أفلام" in value -> ContentType.MOVIE
            else -> ContentType.LIVE
        }
    }

    private fun defaultCategoryName(type: ContentType): String = when (type) {
        ContentType.LIVE -> "Live TV"
        ContentType.MOVIE -> "Movies"
        ContentType.SERIES -> "Series"
        ContentType.EPISODE -> "Episodes"
    }

    private fun stableId(raw: String): String {
        val digest = MessageDigest.getInstance("SHA-1").digest(raw.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }

    private data class ExtInfo(
        val title: String,
        val tvgId: String,
        val logo: String,
        val group: String,
        val catchup: String,
        val headers: Map<String, String>,
        val rawJson: String,
    )
}

private fun parseHeaderLine(value: String): Pair<String, String> {
    val pair = value.split("=", limit = 2)
    return if (pair.size == 2) pair[0].trim() to pair[1].trim() else "" to ""
}

private fun parseKodiHeaderLine(value: String, headers: MutableMap<String, String>) {
    val (rawKey, rawValue) = parseHeaderLine(value)
    if (rawKey.isBlank() || rawValue.isBlank()) return
    when (rawKey.lowercase(Locale.US)) {
        "inputstream.adaptive.stream_headers", "inputstream.ffmpegdirect.stream_headers" -> {
            rawValue.split("&").map(::parseHeaderLine).forEach { (key, headerValue) ->
                if (key.isNotBlank() && headerValue.isNotBlank()) headers[normalizeHeaderName(key)] = headerValue
            }
        }
        "inputstream.adaptive.user_agent", "inputstream.ffmpegdirect.user_agent" -> headers["User-Agent"] = rawValue
        "inputstream.adaptive.referer", "inputstream.adaptive.referrer",
        "inputstream.ffmpegdirect.referer", "inputstream.ffmpegdirect.referrer" -> headers["Referer"] = rawValue
    }
}

private fun parseExtHttpHeaders(line: String): Map<String, String> {
    val body = line.substringAfter(':', missingDelimiterValue = "")
    if (body.isBlank()) return emptyMap()
    val quotedPairs = Regex("\"([^\"]+)\"\\s*:\\s*\"([^\"]*)\"")
        .findAll(body)
        .associate { match -> normalizeHeaderName(match.groupValues[1]) to match.groupValues[2] }
    if (quotedPairs.isNotEmpty()) return quotedPairs
    return body.split("&")
        .map(::parseHeaderLine)
        .filter { (key, value) -> key.isNotBlank() && value.isNotBlank() }
        .associate { (key, value) -> normalizeHeaderName(key) to value }
}

private fun appendIptvHeaders(url: String, headers: Map<String, String>): String {
    if (headers.isEmpty()) return url
    val parts = url.split("|", limit = 2)
    val merged = linkedMapOf<String, String>()
    if (parts.size > 1) {
        parts[1].split("&").map(::parseHeaderLine).forEach { (key, value) ->
            if (key.isNotBlank() && value.isNotBlank()) merged[normalizeHeaderName(key)] = value
        }
    }
    headers.forEach { (key, value) ->
        if (key.isNotBlank() && value.isNotBlank()) merged[normalizeHeaderName(key)] = value
    }
    val encodedHeaders = merged.entries.joinToString("&") { (key, value) ->
        "${key.encodeHeaderToken()}=${value.encodeHeaderToken()}"
    }
    return "${parts.first()}|$encodedHeaders"
}

private fun normalizeHeaderName(key: String): String = when (key.trim().lowercase(Locale.US)) {
    "http-user-agent", "user-agent", "useragent", "ua" -> "User-Agent"
    "http-referrer", "http-referer", "referrer", "referer" -> "Referer"
    "cookie", "cookies" -> "Cookie"
    "origin" -> "Origin"
    "authorization", "auth" -> "Authorization"
    else -> key.trim()
}

private fun String.encodeHeaderToken(): String =
    URLEncoder.encode(this, Charsets.UTF_8.name()).replace("+", "%20")

private fun String.escapeJson(): String =
    replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r")
