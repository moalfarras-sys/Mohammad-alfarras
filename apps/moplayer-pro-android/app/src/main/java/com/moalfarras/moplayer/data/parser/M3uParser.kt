package com.moalfarras.moplayer.data.parser

import com.moalfarras.moplayer.data.repository.normalizeImageUrl
import com.moalfarras.moplayer.domain.model.Category
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.MediaItem
import java.net.URLEncoder
import java.security.MessageDigest
import java.util.Locale

data class ParsedPlaylist(
    val categories: List<Category>,
    val media: List<MediaItem>,
    /** Guide URLs announced by the `#EXTM3U url-tvg=... / x-tvg-url=...` header (http/https only). */
    val epgUrls: List<String> = emptyList(),
)

/**
 * M3U / M3U-plus parser.
 *
 * Big playlists are parsed line by line through a [M3uParseSession] so the caller can write items
 * to the database in batches while reading from a file or a network stream; [parse] is the
 * convenience form that collects everything (file imports and tests).
 *
 * Media ids stay byte-identical to earlier versions (SHA-1 of `tvg-id:title:url`, where the title
 * is taken after the last comma as before), because favorites and resume positions are carried
 * across syncs by id. The displayed title uses the corrected parsing (commas inside titles).
 */
class M3uParser {
    private val episodePatterns = listOf(
        Regex("""(?i)^(.*?)\s*[-_. ]?\s*(?:s|season|موسم|الموسم)\s*([0-9]+)\s*[-_. ]?\s*(?:e|ep|episode|حلقة|الحلقة)\s*([0-9]+)"""),
        Regex("""(?i)^(.*?)\s+([0-9]{1,2})x([0-9]{1,3})\b"""),
        Regex("""(?i)^(.*?)\s+(?:episode|ep|حلقة|الحلقة)\s*([0-9]{1,3})\b"""),
    )
    private val legacyAttributeRegex = Regex("""([A-Za-z0-9_-]+)=["']([^"']*)["']""")

    fun parse(serverId: Long, text: String): ParsedPlaylist = parse(serverId, text.lineSequence())

    fun parse(serverId: Long, lines: Sequence<String>): ParsedPlaylist {
        val session = newSession(serverId)
        val media = ArrayList<MediaItem>(8192)
        lines.forEach { line -> session.accept(line)?.let { emitted -> media.addAll(emitted) } }
        return ParsedPlaylist(session.categories(), media, session.epgUrls())
    }

    /** Starts an incremental parse; feed it lines with [M3uParseSession.accept]. Not thread-safe. */
    fun newSession(serverId: Long): M3uParseSession = M3uParseSession(serverId)

    inner class M3uParseSession internal constructor(private val serverId: Long) {
        private val categories = LinkedHashMap<String, Category>()
        private val categoryIds = HashMap<String, String>()
        private val seenMedia = HashSet<String>()
        private val seenSeries = HashSet<String>()
        private val epgUrls = LinkedHashSet<String>()
        private val sha1: MessageDigest = MessageDigest.getInstance("SHA-1")
        private var pendingInfo: ExtInfo? = null
        private val pendingHeaders = LinkedHashMap<String, String>()
        private var emitted = 0
        private var firstLine = true

        /** Number of media rows emitted so far (series parents included). */
        val itemCount: Int get() = emitted

        fun categories(): List<Category> = categories.values.toList()

        fun epgUrls(): List<String> = epgUrls.toList()

        /**
         * Consumes one playlist line. Returns the items it completed (an entry, or a series
         * parent plus its episode), or null. Duplicate entries (the same channel listed in
         * several groups) are emitted once, in the first group they appear in.
         */
        fun accept(rawLine: String): List<MediaItem>? {
            var line = rawLine.trim()
            if (firstLine) {
                line = line.removePrefix("\uFEFF").trim()
                if (line.isNotEmpty()) firstLine = false
            }
            if (line.isEmpty()) return null
            when {
                line.startsWith("#EXTM3U", ignoreCase = true) -> readHeader(line)
                line.startsWith("#EXTINF", ignoreCase = true) -> {
                    val info = parseInfo(line)
                    pendingInfo = info
                    pendingHeaders.clear()
                    pendingHeaders.putAll(info.headers)
                }
                line.startsWith("#EXTVLCOPT", ignoreCase = true) -> {
                    parseHeaderLine(line.substringAfter(':', missingDelimiterValue = "")).let { (key, value) ->
                        if (key.isNotBlank() && value.isNotBlank()) pendingHeaders[normalizeHeaderName(key)] = value
                    }
                }
                line.startsWith("#KODIPROP", ignoreCase = true) -> {
                    parseKodiHeaderLine(line.substringAfter(':', missingDelimiterValue = ""), pendingHeaders)
                }
                line.startsWith("#EXTHTTP", ignoreCase = true) -> pendingHeaders.putAll(parseExtHttpHeaders(line))
                line.startsWith("#") -> Unit
                else -> {
                    val info = pendingInfo ?: return null
                    pendingInfo = null
                    val result = buildEntry(info, line)
                    pendingHeaders.clear()
                    return result
                }
            }
            return null
        }

        private fun readHeader(line: String) {
            val attrs = scanAttributes(line.substringAfter(' ', ""))
            listOf("url-tvg", "x-tvg-url", "tvg-url").forEach { key ->
                attrs[key].orEmpty().split(',').map { it.trim() }.forEach { url ->
                    if (url.startsWith("http://", ignoreCase = true) || url.startsWith("https://", ignoreCase = true)) {
                        epgUrls += url
                    }
                }
            }
        }

        private fun buildEntry(info: ExtInfo, urlLine: String): List<MediaItem>? {
            val streamUrl = appendIptvHeaders(urlLine, pendingHeaders)
            val guess = inferType(info, urlLine)
            var type = guess.type
            val output = ArrayList<MediaItem>(2)
            var title = info.title.ifBlank { urlLine.substringAfterLast('/').substringBefore('?').ifBlank { "Untitled" } }
            var seasonNum = 0
            var episodeNum = 0
            var seriesId = ""
            var categoryType = type
            if (type == ContentType.SERIES) {
                val match = guess.episodeMatch
                if (match != null) {
                    val cleanSeriesName = match.groupValues[1].trim().ifBlank { info.group.ifBlank { "Series" } }
                    if (match.groupValues.size >= 4) {
                        seasonNum = match.groupValues[2].toIntOrNull() ?: 1
                        episodeNum = match.groupValues[3].toIntOrNull() ?: 0
                    } else {
                        seasonNum = 1
                        episodeNum = match.groupValues[2].toIntOrNull() ?: 0
                    }
                    val idName = legacySeriesName(info) ?: cleanSeriesName
                    seriesId = stableId("series:$idName")
                    val categoryId = categoryIdFor(ContentType.SERIES, info)
                    if (seenSeries.add(seriesId)) {
                        output += MediaItem(
                            id = seriesId,
                            serverId = serverId,
                            type = ContentType.SERIES,
                            categoryId = categoryId,
                            categoryName = info.group,
                            title = cleanSeriesName.ifBlank { title },
                            streamUrl = "",
                            posterUrl = info.logo,
                            description = info.description.ifBlank { "Series $cleanSeriesName" },
                            rating = info.rating,
                            addedAt = 0,
                            addedAtUnknown = true,
                            serverOrder = info.sortOrder ?: emitted,
                            seriesId = seriesId,
                            genre = info.genre,
                            releaseDate = info.releaseDate,
                            rawJson = "",
                        )
                        emitted++
                    }
                    type = ContentType.EPISODE
                    title = "Episode $episodeNum"
                } else {
                    // Never create a SERIES row that carries a stream: it could not be played.
                    type = if (guess.vodShaped) ContentType.MOVIE else ContentType.LIVE
                    categoryType = type
                }
            }
            val id = stableId("${info.tvgId}:${info.legacyTitle}:$streamUrl")
            if (!seenMedia.add("${type.name}:$id")) return output.ifEmpty { null }
            val categoryId = categoryIdFor(categoryType, info)
            output += MediaItem(
                id = id,
                serverId = serverId,
                type = type,
                categoryId = categoryId,
                categoryName = info.group,
                title = title,
                streamUrl = streamUrl,
                posterUrl = info.logo,
                description = info.description.ifBlank {
                    if (type == ContentType.EPISODE) "Season $seasonNum - Episode $episodeNum" else title
                },
                rating = info.rating,
                durationSecs = info.durationSecs.takeIf { it > 0 }
                    ?: info.extinfDurationSecs.takeIf { type == ContentType.MOVIE || type == ContentType.EPISODE }
                    ?: 0,
                addedAt = 0,
                addedAtUnknown = true,
                serverOrder = info.sortOrder ?: emitted,
                seriesId = seriesId,
                seasonNumber = seasonNum,
                episodeNumber = episodeNum,
                tvgId = info.tvgId,
                catchup = info.catchup,
                genre = info.genre,
                releaseDate = info.releaseDate,
                rawJson = "",
            )
            emitted++
            return output
        }

        /** The series name as earlier versions derived it, so series ids (and favorites) stay stable. */
        private fun legacySeriesName(info: ExtInfo): String? {
            if (info.legacyTitle == info.title) return null
            return findEpisode(info.legacyTitle)?.groupValues?.getOrNull(1)?.trim()?.takeIf { it.isNotEmpty() }
        }

        private fun categoryIdFor(type: ContentType, info: ExtInfo): String {
            val key = "${type.name}:${info.group}"
            return categoryIds.getOrPut(key) {
                val id = stableId(key)
                categories.putIfAbsent(
                    id,
                    Category(
                        id = id,
                        serverId = serverId,
                        type = type,
                        name = info.group.ifBlank { defaultCategoryName(type) },
                        sortOrder = categories.size,
                        rawJson = "",
                    ),
                )
                id
            }
        }

        private fun stableId(raw: String): String {
            val digest = sha1.digest(raw.toByteArray(Charsets.UTF_8))
            val out = CharArray(digest.size * 2)
            for (i in digest.indices) {
                val value = digest[i].toInt() and 0xff
                out[i * 2] = HEX[value ushr 4]
                out[i * 2 + 1] = HEX[value and 0x0f]
            }
            return String(out)
        }
    }

    private class TypeGuess(val type: ContentType, val vodShaped: Boolean, val episodeMatch: MatchResult?)

    /**
     * Decides LIVE / MOVIE / SERIES from the strongest signal down: explicit `tvg-type`, the
     * Xtream path (`/live/`, `/movie/`, `/series/`), the scheme, a VOD file extension, and only
     * for ambiguous URLs (`.m3u8`, `.ts`, `.mpd` or none) group/title keywords matched as whole
     * words. "beIN Movies" live channels, "Serie A" football and "24/7" channels stay LIVE.
     */
    private fun inferType(info: ExtInfo, url: String): TypeGuess {
        val cleanUrl = url.substringBefore('|').substringBefore('?').substringBefore('#')
        val path = cleanUrl.lowercase(Locale.US)
        val extension = path.substringAfterLast('/', "").substringAfterLast('.', "")
        val vodShaped = extension in VOD_EXTENSIONS || "/movie/" in path || "/vod/" in path || "/series/" in path
        val explicit = info.explicitType

        fun seriesOrMovie(): TypeGuess {
            val match = findEpisode(info.title)
            return if (match != null) {
                TypeGuess(ContentType.SERIES, vodShaped = true, episodeMatch = match)
            } else {
                TypeGuess(ContentType.MOVIE, vodShaped = true, episodeMatch = null)
            }
        }

        when (explicit) {
            "live", "channel", "tv" -> return TypeGuess(ContentType.LIVE, vodShaped, null)
            "movie", "movies", "vod", "film" -> return TypeGuess(ContentType.MOVIE, true, null)
            "series", "episode", "show", "tvshow" -> return seriesOrMovie().let {
                if (it.episodeMatch == null) TypeGuess(ContentType.SERIES, vodShaped, null) else it
            }
        }
        if ("/live/" in path) return TypeGuess(ContentType.LIVE, false, null)
        if (LIVE_SCHEMES.any { path.startsWith(it) }) return TypeGuess(ContentType.LIVE, false, null)
        if ("/series/" in path) return seriesOrMovie().let { if (it.episodeMatch == null) TypeGuess(ContentType.SERIES, true, null) else it }
        if ("/movie/" in path || "/vod/" in path) return TypeGuess(ContentType.MOVIE, true, null)

        val groupTokens = tokens(info.group)
        val titleTokens = tokens(info.title)
        val seriesKeyword = groupTokens.any { it in SERIES_WORDS } || info.group.contains("serie tv", ignoreCase = true)
        val vodKeyword = groupTokens.any { it in VOD_WORDS } ||
            (info.group.isBlank() && titleTokens.any { it in VOD_WORDS })

        if (extension in VOD_EXTENSIONS) {
            val match = findEpisode(info.title)
            return when {
                match != null -> TypeGuess(ContentType.SERIES, true, match)
                seriesKeyword -> TypeGuess(ContentType.SERIES, true, null)
                else -> TypeGuess(ContentType.MOVIE, true, null)
            }
        }

        // Ambiguous container (.m3u8 / .ts / .mpd / none): live unless there is real evidence of
        // on-demand content. A guide id, catch-up, channel number or "24/7" always means live.
        if (hasStrongLiveMarker(info)) return TypeGuess(ContentType.LIVE, false, null)
        val weakLive = groupTokens.any { it in LIVE_WORDS } ||
            titleTokens.any { it in LIVE_WORDS || it in QUALITY_TAGS } ||
            info.title.contains("+1")
        val match = findEpisode(info.title)
        val hasRuntime = info.extinfDurationSecs > 0
        return when {
            match != null && (seriesKeyword || hasRuntime || !weakLive) -> TypeGuess(ContentType.SERIES, true, match)
            extension == "ts" && !hasRuntime -> TypeGuess(ContentType.LIVE, false, null)
            hasRuntime -> TypeGuess(ContentType.MOVIE, true, null)
            weakLive -> TypeGuess(ContentType.LIVE, false, null)
            vodKeyword -> TypeGuess(ContentType.MOVIE, true, null)
            else -> TypeGuess(ContentType.LIVE, false, null)
        }
    }

    private fun hasStrongLiveMarker(info: ExtInfo): Boolean =
        info.catchup.isNotBlank() ||
            info.tvgId.isNotBlank() ||
            info.sortOrder != null ||
            info.group.contains("24/7") ||
            info.title.contains("24/7")

    private fun findEpisode(title: String): MatchResult? {
        if (title.none { it in '0'..'9' }) return null
        return episodePatterns.firstNotNullOfOrNull { it.find(title) }
    }

    /** Lowercased word tokens; Arabic tokens also lose a leading "ال"/"و"/"وال" article. */
    private fun tokens(text: String): List<String> {
        if (text.isBlank()) return emptyList()
        return text.lowercase(Locale.ROOT)
            .split(TOKEN_SPLIT)
            .filter { it.isNotEmpty() }
            .map { token ->
                when {
                    token.startsWith("وال") && token.length > 4 -> token.substring(3)
                    token.startsWith("ال") && token.length > 3 -> token.substring(2)
                    else -> token
                }
            }
    }

    private fun parseInfo(line: String): ExtInfo {
        val body = line.substringAfter(':', "")
        val scanned = scanExtInf(body)
        val attrs = scanned?.first ?: legacyAttributeRegex.findAll(line).associate { it.groupValues[1].lowercase(Locale.US) to it.groupValues[2] }
        val legacyAttrs = if (scanned == null) attrs else null
        val tvgName = attrs["tvg-name"].orEmpty()
        val legacyTitle = line.substringAfterLast(',', missingDelimiterValue = (legacyAttrs ?: attrs)["tvg-name"].orEmpty()).trim()
            .ifBlank { (legacyAttrs ?: attrs)["tvg-name"].orEmpty() }
        val title = (scanned?.second ?: legacyTitle).ifBlank { tvgName }
        val catchup = attrs["catchup"].orEmpty()
            .ifBlank { attrs["catchup-source"].orEmpty() }
            .ifBlank { attrs["timeshift"].orEmpty() }
            .trim()
            .takeUnless { it.lowercase(Locale.US) in DISABLED_FLAGS }
            .orEmpty()
        val headers = linkedMapOf<String, String>()
        attrs["http-user-agent"]?.takeIf { it.isNotBlank() }?.let { headers["User-Agent"] = it }
        attrs["user-agent"]?.takeIf { it.isNotBlank() }?.let { headers["User-Agent"] = it }
        attrs["http-referrer"]?.takeIf { it.isNotBlank() }?.let { headers["Referer"] = it }
        attrs["http-referer"]?.takeIf { it.isNotBlank() }?.let { headers["Referer"] = it }
        attrs["referrer"]?.takeIf { it.isNotBlank() }?.let { headers["Referer"] = it }
        val extinfDuration = body.trimStart().takeWhile { it == '-' || it == '.' || it in '0'..'9' }
            .toDoubleOrNull()
            ?.takeIf { it > 0 }
            ?.toLong()
            ?: 0L
        return ExtInfo(
            title = title,
            legacyTitle = legacyTitle,
            tvgId = attrs["tvg-id"].orEmpty(),
            logo = attrs["tvg-logo"].orEmpty().normalizeImageUrl(),
            group = attrs["group-title"].orEmpty(),
            catchup = catchup,
            headers = headers,
            description = attrs.firstValue("description", "desc", "plot", "overview", "tvg-description"),
            rating = attrs.firstValue("rating", "tvg-rating", "imdb-rating", "rating_5based"),
            genre = attrs.firstValue("genre", "tvg-genre"),
            releaseDate = attrs.firstValue("release-date", "releasedate", "release_date", "year"),
            durationSecs = parseDurationSeconds(attrs.firstValue("duration", "runtime", "length")),
            extinfDurationSecs = extinfDuration,
            sortOrder = attrs.firstValue("tvg-chno", "channel-number", "ch-number", "num", "order").toIntOrNull(),
            explicitType = attrs.firstValue("tvg-type", "type").lowercase(Locale.US).trim(),
        )
    }

    private class ExtInfo(
        val title: String,
        val legacyTitle: String,
        val tvgId: String,
        val logo: String,
        val group: String,
        val catchup: String,
        val headers: Map<String, String>,
        val description: String,
        val rating: String,
        val genre: String,
        val releaseDate: String,
        val durationSecs: Long,
        val extinfDurationSecs: Long,
        val sortOrder: Int?,
        val explicitType: String,
    )

    private companion object {
        const val HEX = "0123456789abcdef"
        val TOKEN_SPLIT = Regex("""[^\p{L}\p{N}]+""")
        val VOD_EXTENSIONS = setOf("mp4", "mkv", "avi", "mov", "m4v", "webm", "wmv", "flv", "mpg", "mpeg", "3gp", "divx", "ogv", "vob")
        val LIVE_SCHEMES = listOf("rtsp://", "rtmp://", "rtmps://", "udp://", "rtp://", "mms://", "srt://")
        val VOD_WORDS = setOf("movie", "movies", "film", "films", "vod", "فيلم", "افلام", "أفلام")
        val SERIES_WORDS = setOf("series", "séries", "tvshows", "shows", "مسلسل", "مسلسلات")
        val LIVE_WORDS = setOf("live", "channel", "channels", "قناة", "قنوات", "مباشر")
        val QUALITY_TAGS = setOf("hd", "fhd", "uhd", "sd", "4k", "hevc")
        val DISABLED_FLAGS = setOf("0", "false", "no", "none", "off", "disabled")
    }
}

/**
 * Splits `-1 key="v" key2='v2' key3=v3,Title, with commas` into attributes and the title.
 * A quote only opens a value right after '=' and a value ends only at the same quote character,
 * so `group-title="Children's Channels"` keeps its apostrophe. Returns null for unbalanced quotes.
 */
internal fun scanExtInf(body: String): Pair<Map<String, String>, String>? {
    val attrs = scanAttributesOrNull(body, stopAtComma = true) ?: return null
    return attrs.first to attrs.second
}

private fun scanAttributes(text: String): Map<String, String> =
    scanAttributesOrNull(text, stopAtComma = false)?.first.orEmpty()

private fun scanAttributesOrNull(text: String, stopAtComma: Boolean): Pair<Map<String, String>, String>? {
    val attrs = HashMap<String, String>()
    var i = 0
    val length = text.length
    if (stopAtComma) {
        // Skip the duration token.
        while (i < length && text[i] != ' ' && text[i] != '\t' && text[i] != ',') i++
    }
    while (i < length) {
        val c = text[i]
        if (c == ' ' || c == '\t') {
            i++
            continue
        }
        if (c == ',') {
            if (stopAtComma) return attrs to text.substring(i + 1).trim()
            i++
            continue
        }
        val keyStart = i
        while (i < length && text[i] != '=' && text[i] != ' ' && text[i] != '\t' && text[i] != ',') i++
        val key = text.substring(keyStart, i).lowercase(Locale.US)
        if (i < length && text[i] == '=') {
            i++
            if (i < length && (text[i] == '"' || text[i] == '\'')) {
                val quote = text[i]
                val end = text.indexOf(quote, i + 1)
                if (end < 0) return null
                if (key.isNotEmpty()) attrs[key] = text.substring(i + 1, end)
                i = end + 1
            } else {
                val valueStart = i
                while (i < length && text[i] != ' ' && text[i] != '\t' && text[i] != ',') i++
                if (key.isNotEmpty()) attrs[key] = text.substring(valueStart, i)
            }
        } else if (key.isNotEmpty() && key !in attrs) {
            attrs[key] = ""
        } else if (key.isEmpty()) {
            i++
        }
    }
    return attrs to ""
}

private fun defaultCategoryName(type: ContentType): String = when (type) {
    ContentType.LIVE -> "Live TV"
    ContentType.MOVIE -> "Movies"
    ContentType.SERIES -> "Series"
    ContentType.EPISODE -> "Episodes"
}

private fun Map<String, String>.firstValue(vararg keys: String): String =
    keys.firstNotNullOfOrNull { key -> this[key.lowercase(Locale.US)]?.takeIf { it.isNotBlank() } }.orEmpty()

private fun parseDurationSeconds(raw: String): Long {
    val value = raw.trim()
    if (value.isBlank()) return 0
    value.toLongOrNull()?.let { return it }
    val parts = value.split(':').mapNotNull { it.toLongOrNull() }
    return when (parts.size) {
        3 -> parts[0] * 3600 + parts[1] * 60 + parts[2]
        2 -> parts[0] * 60 + parts[1]
        else -> 0
    }
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

private val EXT_HTTP_PAIR = Regex("\"([^\"]+)\"\\s*:\\s*\"([^\"]*)\"")

private fun parseExtHttpHeaders(line: String): Map<String, String> {
    val body = line.substringAfter(':', missingDelimiterValue = "")
    if (body.isBlank()) return emptyMap()
    val quotedPairs = EXT_HTTP_PAIR
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

/** Bumped whenever parsing changes what is stored, so unchanged playlists are re-parsed once. */
const val M3U_PARSER_VERSION = 2
