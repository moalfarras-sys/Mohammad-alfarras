package com.moalfarras.moplayer.data.parser

import com.moalfarras.moplayer.domain.model.Category
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import java.security.MessageDigest
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

        text.lineSequence()
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .forEach { line ->
                when {
                    line.startsWith("#EXTINF", ignoreCase = true) -> pendingInfo = parseInfo(line)
                    line.startsWith("#") -> Unit
                    pendingInfo != null -> {
                        val info = pendingInfo ?: return@forEach
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
                            id = stableId("${info.tvgId}:${info.title}:$line"),
                            serverId = serverId,
                            type = type,
                            categoryId = categoryId,
                            categoryName = info.group,
                            title = title,
                            streamUrl = line,
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
        return ExtInfo(
            title = title.ifBlank { attrs["tvg-name"].orEmpty() },
            tvgId = attrs["tvg-id"].orEmpty(),
            logo = attrs["tvg-logo"].orEmpty(),
            group = attrs["group-title"].orEmpty(),
            catchup = catchup,
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
        val rawJson: String,
    )
}

private fun String.escapeJson(): String =
    replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r")
