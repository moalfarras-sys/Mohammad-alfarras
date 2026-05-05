package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.data.db.AccountInfoEntity
import com.moalfarras.moplayer.data.db.EpgProgramEntity
import com.moalfarras.moplayer.data.db.SeasonEntity
import com.moalfarras.moplayer.data.db.ServerInfoEntity
import com.moalfarras.moplayer.data.db.SyncStateEntity
import com.moalfarras.moplayer.data.db.VodDetailsEntity
import com.moalfarras.moplayer.domain.model.Category
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.EpgEntry
import com.moalfarras.moplayer.domain.model.LiveEpgSnapshot
import com.moalfarras.moplayer.domain.model.MediaItem
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory
import java.io.StringReader
import java.net.URI
import java.net.URLDecoder
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

internal data class XtreamCredentials(
    val baseUrl: String,
    val username: String,
    val password: String,
    val playlistUrl: String = "",
)

internal data class XtreamAccountSnapshot(
    val accountInfo: AccountInfoEntity?,
    val serverInfo: ServerInfoEntity?,
    val accountStatus: String,
    val expiryDate: Long,
    val activeConnections: Int,
    val maxConnections: Int,
    val allowedOutputFormats: List<String>,
    val timezone: String,
    val serverMessage: String,
)

internal data class XtreamSyncPayload(
    val categories: List<Category>,
    val media: List<MediaItem>,
    val accountInfo: AccountInfoEntity?,
    val serverInfo: ServerInfoEntity?,
    val syncState: SyncStateEntity,
    val epgPrograms: List<EpgProgramEntity>,
)

internal object XtreamSupport {
    fun extractCredentialsFromPlaylistUrl(url: String): XtreamCredentials? = runCatching {
        val uri = URI(url.trim())
        val params = uri.rawQuery
            ?.split('&')
            ?.mapNotNull { part ->
                val pieces = part.split('=', limit = 2)
                if (pieces.size == 2) {
                    URLDecoder.decode(pieces[0], Charsets.UTF_8.name()) to URLDecoder.decode(pieces[1], Charsets.UTF_8.name())
                } else {
                    null
                }
            }
            ?.toMap()
            .orEmpty()
        val username = params["username"].orEmpty()
        val password = params["password"].orEmpty()
        if (username.isBlank() || password.isBlank()) {
            null
        } else {
            val port = if (uri.port > 0) ":${uri.port}" else ""
            XtreamCredentials(
                baseUrl = "${uri.scheme}://${uri.host}$port/",
                username = username,
                password = password,
                playlistUrl = url,
            )
        }
    }.getOrNull()

    fun parseAccountSnapshot(
        json: Json,
        serverId: Long,
        root: JsonObject,
        updatedAt: Long,
    ): XtreamAccountSnapshot {
        val userInfo = root.objectOrNull("user_info")
        val serverInfo = root.objectOrNull("server_info")
        val formats = userInfo?.arrayOrNull("allowed_output_formats")?.mapNotNull { it.contentOrNull() }
            ?: serverInfo?.arrayOrNull("allowed_output_formats")?.mapNotNull { it.contentOrNull() }
            ?: emptyList()
        val account = if (userInfo != null) {
            AccountInfoEntity(
                serverId = serverId,
                status = userInfo.string("status"),
                expiryDate = parseTimestamp(userInfo.string("exp_date")),
                activeConnections = userInfo.int("active_cons"),
                maxConnections = userInfo.int("max_connections"),
                allowedOutputFormats = formats.joinToString(","),
                createdAt = parseTimestamp(userInfo.string("created_at")),
                isTrial = userInfo.boolean("is_trial"),
                usernameMasked = maskUsername(userInfo.string("username")),
                rawJson = json.encodeToString(JsonElement.serializer(), userInfo),
                updatedAt = updatedAt,
            )
        } else {
            null
        }
        val server = if (serverInfo != null) {
            ServerInfoEntity(
                serverId = serverId,
                url = serverInfo.string("url"),
                timezone = serverInfo.string("timezone"),
                timestampNow = parseTimestamp(serverInfo.string("timestamp_now")),
                timeNow = serverInfo.string("time_now"),
                message = root.string("message"),
                rawJson = json.encodeToString(JsonElement.serializer(), serverInfo),
                updatedAt = updatedAt,
            )
        } else {
            null
        }
        return XtreamAccountSnapshot(
            accountInfo = account,
            serverInfo = server,
            accountStatus = account?.status.orEmpty(),
            expiryDate = account?.expiryDate ?: 0,
            activeConnections = account?.activeConnections ?: 0,
            maxConnections = account?.maxConnections ?: 0,
            allowedOutputFormats = formats,
            timezone = server?.timezone.orEmpty(),
            serverMessage = server?.message.orEmpty(),
        )
    }

    fun parseCategories(
        json: Json,
        serverId: Long,
        type: ContentType,
        array: JsonArray,
    ): List<Category> = array.mapIndexed { index, item ->
        val obj = item.jsonObject
        Category(
            id = obj.string("category_id"),
            serverId = serverId,
            type = type,
            name = obj.string("category_name"),
            sortOrder = index,
            parentId = obj.string("parent_id"),
            rawJson = json.encodeToString(JsonElement.serializer(), item),
        )
    }

    fun parseLiveStreams(
        json: Json,
        serverId: Long,
        credentials: XtreamCredentials,
        allowedFormats: List<String>,
        categories: Map<String, String>,
        array: JsonArray,
    ): List<MediaItem> = array.mapIndexedNotNull { index, item ->
        val obj = item.jsonObject
        val streamId = obj.string("stream_id")
        if (streamId.isBlank()) {
            null
        } else {
            val categoryId = obj.string("category_id")
            val output = pickLiveExtension(allowedFormats)
            val directSource = obj.string("direct_source")
            val addedAt = parseTimestamp(obj.string("added"))
            val lastModifiedAt = parseTimestamp(obj.string("last_modified"))
            MediaItem(
                id = streamId,
                serverId = serverId,
                type = ContentType.LIVE,
                categoryId = categoryId,
                categoryName = categories[categoryId].orEmpty(),
                title = obj.string("name"),
                streamUrl = directSource.ifBlank {
                    "${credentials.baseUrl}live/${credentials.username}/${credentials.password}/$streamId.$output"
                },
                posterUrl = obj.string("stream_icon"),
                description = obj.string("plot"),
                addedAt = addedAt,
                lastModifiedAt = lastModifiedAt,
                addedAtUnknown = addedAt <= 0 && lastModifiedAt <= 0,
                serverOrder = obj.int("num").takeIf { it > 0 } ?: index,
                containerExtension = output,
                tvgId = obj.string("epg_channel_id"),
                catchup = obj.string("tv_archive"),
                rawJson = json.encodeToString(JsonElement.serializer(), item),
            )
        }
    }

    fun parseVodStreams(
        json: Json,
        serverId: Long,
        credentials: XtreamCredentials,
        categories: Map<String, String>,
        array: JsonArray,
    ): List<MediaItem> = array.mapIndexedNotNull { index, item ->
        val obj = item.jsonObject
        val streamId = obj.string("stream_id")
        if (streamId.isBlank()) {
            null
        } else {
            val categoryId = obj.string("category_id")
            val extension = obj.string("container_extension").ifBlank { "mp4" }
            val directSource = obj.string("direct_source")
            val addedAt = parseTimestamp(obj.string("added"))
            val lastModifiedAt = parseTimestamp(obj.string("last_modified"))
            MediaItem(
                id = streamId,
                serverId = serverId,
                type = ContentType.MOVIE,
                categoryId = categoryId,
                categoryName = categories[categoryId].orEmpty(),
                title = obj.string("name"),
                streamUrl = directSource.ifBlank {
                    "${credentials.baseUrl}movie/${credentials.username}/${credentials.password}/$streamId.$extension"
                },
                posterUrl = obj.string("stream_icon").ifBlank { obj.string("cover") },
                backdropUrl = obj.stringOrJoin("backdrop_path"),
                description = obj.string("plot"),
                rating = obj.string("rating").ifBlank { obj.string("rating_5based") },
                durationSecs = obj.long("duration_secs"),
                addedAt = addedAt,
                lastModifiedAt = lastModifiedAt,
                addedAtUnknown = addedAt <= 0 && lastModifiedAt <= 0,
                serverOrder = obj.int("num").takeIf { it > 0 } ?: index,
                containerExtension = extension,
                cast = obj.stringOrJoin("cast"),
                director = obj.stringOrJoin("director"),
                genre = obj.stringOrJoin("genre"),
                releaseDate = obj.string("releaseDate").ifBlank { obj.string("release_date") },
                rawJson = json.encodeToString(JsonElement.serializer(), item),
            )
        }
    }

    fun parseSeries(
        json: Json,
        serverId: Long,
        categories: Map<String, String>,
        array: JsonArray,
    ): List<MediaItem> = array.mapIndexedNotNull { index, item ->
        val obj = item.jsonObject
        val seriesId = obj.string("series_id")
        if (seriesId.isBlank()) {
            null
        } else {
            val categoryId = obj.string("category_id")
            val addedAt = parseTimestamp(obj.string("added"))
            val lastModifiedAt = parseTimestamp(obj.string("last_modified"))
            MediaItem(
                id = seriesId,
                serverId = serverId,
                type = ContentType.SERIES,
                categoryId = categoryId,
                categoryName = categories[categoryId].orEmpty(),
                title = obj.string("name"),
                streamUrl = "",
                posterUrl = obj.string("cover"),
                backdropUrl = obj.stringOrJoin("backdrop_path"),
                description = obj.string("plot"),
                rating = obj.string("rating").ifBlank { obj.string("rating_5based") },
                addedAt = addedAt,
                lastModifiedAt = lastModifiedAt,
                addedAtUnknown = addedAt <= 0 && lastModifiedAt <= 0,
                serverOrder = obj.int("num").takeIf { it > 0 } ?: index,
                seriesId = seriesId,
                cast = obj.stringOrJoin("cast"),
                director = obj.stringOrJoin("director"),
                genre = obj.stringOrJoin("genre"),
                releaseDate = obj.string("releaseDate").ifBlank { obj.string("release_date") },
                rawJson = json.encodeToString(JsonElement.serializer(), item),
            )
        }
    }

    fun enrichVod(
        json: Json,
        serverId: Long,
        current: MediaItem,
        root: JsonObject,
    ): Pair<MediaItem, VodDetailsEntity> {
        val info = root.objectOrNull("info") ?: JsonObject(emptyMap())
        val movieData = root.objectOrNull("movie_data") ?: JsonObject(emptyMap())
        val movieImage = info.string("movie_image").ifBlank { current.posterUrl }
        val backdrop = info.stringOrJoin("backdrop_path").ifBlank { current.backdropUrl }
        val plot = info.string("plot").ifBlank { movieData.string("plot").ifBlank { current.description } }
        val rating = info.string("rating").ifBlank { movieData.string("rating").ifBlank { current.rating } }
        val enriched = current.copy(
            posterUrl = movieImage,
            backdropUrl = backdrop,
            description = plot,
            rating = rating,
            cast = info.stringOrJoin("cast").ifBlank { current.cast },
            director = info.stringOrJoin("director").ifBlank { current.director },
            genre = info.stringOrJoin("genre").ifBlank { current.genre },
            releaseDate = info.string("releasedate").ifBlank { info.string("releaseDate").ifBlank { current.releaseDate } },
            rawJson = json.encodeToString(JsonElement.serializer(), root),
        )
        return enriched to VodDetailsEntity(
            serverId = serverId,
            vodId = current.id,
            movieImage = movieImage,
            backdrop = backdrop,
            plot = plot,
            cast = enriched.cast,
            director = enriched.director,
            genre = enriched.genre,
            releaseDate = enriched.releaseDate,
            rating = rating,
            duration = info.string("duration"),
            country = info.stringOrJoin("country"),
            youtubeTrailer = info.string("youtube_trailer"),
            rawJson = json.encodeToString(JsonElement.serializer(), root),
            updatedAt = System.currentTimeMillis(),
        )
    }

    fun enrichSeries(
        json: Json,
        serverId: Long,
        credentials: XtreamCredentials,
        current: MediaItem,
        root: JsonObject,
    ): Triple<MediaItem, List<SeasonEntity>, List<MediaItem>> {
        val info = root.objectOrNull("info") ?: JsonObject(emptyMap())
        val seasons = root.arrayOrNull("seasons").orEmpty()
        val episodes = root.objectOrNull("episodes") ?: JsonObject(emptyMap())
        val now = System.currentTimeMillis()
        val enrichedSeries = current.copy(
            title = info.string("name").ifBlank { current.title },
            description = info.string("plot").ifBlank { current.description },
            rating = info.string("rating").ifBlank { current.rating },
            posterUrl = info.string("cover_big").ifBlank { info.string("cover").ifBlank { current.posterUrl } },
            backdropUrl = info.stringOrJoin("backdrop_path").ifBlank { current.backdropUrl },
            cast = info.stringOrJoin("cast").ifBlank { current.cast },
            director = info.stringOrJoin("director").ifBlank { current.director },
            genre = info.stringOrJoin("genre").ifBlank { current.genre },
            releaseDate = info.string("releaseDate").ifBlank { current.releaseDate },
            rawJson = json.encodeToString(JsonElement.serializer(), root),
        )
        val seasonEntities = seasons.mapNotNull { element ->
            val obj = element.jsonObject
            val seasonNumber = obj.int("season_number")
            if (seasonNumber <= 0) null else SeasonEntity(
                serverId = serverId,
                seriesId = current.seriesId.ifBlank { current.id },
                seasonNumber = seasonNumber,
                name = obj.string("name").ifBlank { "Season $seasonNumber" },
                cover = obj.string("cover"),
                airDate = obj.string("air_date"),
                plot = obj.string("overview"),
                rawJson = json.encodeToString(JsonElement.serializer(), element),
                updatedAt = now,
            )
        }
        val episodeItems = episodes.entries.flatMap { (seasonKey, value) ->
            value.jsonArray.mapIndexedNotNull { index, element ->
                val obj = element.jsonObject
                val episodeInfo = obj.objectOrNull("info") ?: JsonObject(emptyMap())
                val episodeId = obj.string("id")
                if (episodeId.isBlank()) {
                    null
                } else {
                    val seasonNumber = obj.int("season").takeIf { it > 0 } ?: seasonKey.toIntOrNull() ?: 0
                    val episodeNumber = obj.int("episode_num").takeIf { it > 0 } ?: (index + 1)
                    val extension = obj.string("container_extension").ifBlank { "mp4" }
                    val addedAt = parseTimestamp(obj.string("added"))
                    val lastModifiedAt = parseTimestamp(obj.string("last_modified"))
                    MediaItem(
                        id = episodeId,
                        serverId = serverId,
                        type = ContentType.EPISODE,
                        categoryId = current.categoryId,
                        categoryName = current.categoryName,
                        title = obj.string("title").ifBlank { "Episode $episodeNumber" },
                        streamUrl = "${credentials.baseUrl}series/${credentials.username}/${credentials.password}/$episodeId.$extension",
                        posterUrl = episodeInfo.string("cover_big").ifBlank { episodeInfo.string("movie_image").ifBlank { enrichedSeries.posterUrl } },
                        backdropUrl = enrichedSeries.backdropUrl,
                        description = episodeInfo.string("plot"),
                        rating = episodeInfo.string("rating").ifBlank { enrichedSeries.rating },
                        durationSecs = episodeInfo.long("duration_secs"),
                        addedAt = addedAt,
                        lastModifiedAt = lastModifiedAt,
                        addedAtUnknown = addedAt <= 0 && lastModifiedAt <= 0,
                        serverOrder = episodeNumber,
                        containerExtension = extension,
                        seriesId = current.seriesId.ifBlank { current.id },
                        seasonNumber = seasonNumber,
                        episodeNumber = episodeNumber,
                        cast = enrichedSeries.cast,
                        director = enrichedSeries.director,
                        genre = enrichedSeries.genre,
                        releaseDate = episodeInfo.string("releaseDate").ifBlank { enrichedSeries.releaseDate },
                        rawJson = json.encodeToString(JsonElement.serializer(), element),
                    )
                }
            }
        }
        return Triple(enrichedSeries, seasonEntities, episodeItems)
    }

    fun parseXmltv(
        serverId: Long,
        xml: String,
    ): List<EpgProgramEntity> {
        val factory = XmlPullParserFactory.newInstance()
        factory.isNamespaceAware = false
        val parser = factory.newPullParser()
        parser.setInput(StringReader(xml))
        val result = mutableListOf<EpgProgramEntity>()
        var eventType = parser.eventType
        var currentChannel = ""
        var start = ""
        var stop = ""
        var title = ""
        var description = ""
        var category = ""
        while (eventType != XmlPullParser.END_DOCUMENT) {
            when (eventType) {
                XmlPullParser.START_TAG -> when (parser.name) {
                    "programme" -> {
                        currentChannel = parser.getAttributeValue(null, "channel").orEmpty()
                        start = parser.getAttributeValue(null, "start").orEmpty()
                        stop = parser.getAttributeValue(null, "stop").orEmpty()
                        title = ""
                        description = ""
                        category = ""
                    }
                    "title" -> title = parser.nextText().orEmpty()
                    "desc" -> description = parser.nextText().orEmpty()
                    "category" -> category = parser.nextText().orEmpty()
                }
                XmlPullParser.END_TAG -> if (parser.name == "programme" && currentChannel.isNotBlank()) {
                    result += EpgProgramEntity(
                        serverId = serverId,
                        channelKey = currentChannel,
                        title = title,
                        description = description,
                        startAt = parseXmltvTime(start),
                        endAt = parseXmltvTime(stop),
                        category = category,
                        rawJson = """{"channel":"$currentChannel","title":${title.quoteJson()},"desc":${description.quoteJson()}}""",
                        updatedAt = System.currentTimeMillis(),
                    )
                }
            }
            eventType = parser.next()
        }
        return result
    }

    fun parseShortEpg(
        json: Json,
        serverId: Long,
        fallbackChannelKey: String,
        root: JsonObject,
    ): List<EpgProgramEntity> {
        val listings = root.arrayOrNull("epg_listings")
            ?: root.arrayOrNull("listings")
            ?: root.arrayOrNull("epgListings")
            ?: JsonArray(emptyList())
        val updatedAt = System.currentTimeMillis()
        return listings.mapNotNull { element ->
            val obj = element.jsonObject
            val title = obj.string("title").ifBlank { obj.string("name") }
            val startAt = parseTimestamp(obj.string("start_timestamp"))
                .takeIf { it > 0 }
                ?: parseTimestamp(obj.string("start"))
            val endAt = parseTimestamp(obj.string("stop_timestamp"))
                .takeIf { it > 0 }
                ?: parseTimestamp(obj.string("end"))
                .takeIf { it > 0 }
                ?: parseTimestamp(obj.string("stop"))
            if (title.isBlank() || startAt <= 0) {
                null
            } else {
                EpgProgramEntity(
                    serverId = serverId,
                    channelKey = obj.string("epg_channel_id").ifBlank { fallbackChannelKey },
                    title = title,
                    description = obj.string("description").ifBlank { obj.string("desc") },
                    startAt = startAt,
                    endAt = if (endAt > 0) endAt else startAt,
                    category = obj.string("category"),
                    rawJson = json.encodeToString(JsonElement.serializer(), element),
                    updatedAt = updatedAt,
                )
            }
        }
    }

    fun toLiveEpgSnapshot(programs: List<EpgProgramEntity>, now: Long = System.currentTimeMillis()): LiveEpgSnapshot {
        val sorted = programs.sortedBy { it.startAt }
        val current = sorted.firstOrNull { it.startAt <= now && (it.endAt == 0L || it.endAt >= now) }
            ?: sorted.firstOrNull { it.startAt >= now }
        val next = when {
            current == null -> sorted.getOrNull(1)
            else -> sorted.firstOrNull { it.startAt > current.startAt && it.title != current.title }
        }
        return LiveEpgSnapshot(
            current = current?.toEntry(),
            next = next?.toEntry(),
        )
    }

    fun parseTimestamp(value: String?): Long {
        val trimmed = value.orEmpty().trim()
        if (trimmed.isBlank()) return 0
        trimmed.toLongOrNull()?.let { numeric ->
            return if (numeric > 1_000_000_000_000L) numeric else numeric * 1000L
        }
        return runCatching {
            ZonedDateTime.parse(trimmed).toInstant().toEpochMilli()
        }.recoverCatching {
            LocalDateTime.parse(trimmed, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss", Locale.US))
                .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
        }.getOrDefault(0L)
    }

    fun sanitizeError(message: String?, host: String): String {
        val clean = message.orEmpty()
            .replace(Regex("username=[^&\\s]+"), "username=***")
            .replace(Regex("password=[^&\\s]+"), "password=***")
        return if (clean.isBlank()) "Server sync failed for $host" else clean
    }

    fun maskUsername(username: String): String {
        if (username.length <= 2) return "*".repeat(username.length.coerceAtLeast(1))
        return username.take(2) + "*".repeat((username.length - 2).coerceAtLeast(2))
    }

    fun hostLabel(url: String): String = runCatching {
        URI(url).host?.removePrefix("www.").orEmpty().ifBlank { url }
    }.getOrDefault(url)
}

private fun EpgProgramEntity.toEntry(): EpgEntry = EpgEntry(
    title = title,
    description = description,
    startAt = startAt,
    endAt = endAt,
    category = category,
)

private fun JsonObject.string(name: String): String = this[name]?.contentOrNull().orEmpty()

private fun JsonObject.int(name: String): Int = string(name).toIntOrNull() ?: this[name]?.jsonPrimitive?.intOrNull ?: 0

private fun JsonObject.long(name: String): Long = string(name).toLongOrNull() ?: this[name]?.jsonPrimitive?.longOrNull ?: 0L

private fun JsonObject.boolean(name: String): Boolean = when (string(name).lowercase(Locale.US)) {
    "1", "true", "yes" -> true
    else -> false
}

private fun JsonObject.objectOrNull(name: String): JsonObject? = this[name] as? JsonObject

private fun JsonObject.arrayOrNull(name: String): JsonArray? = this[name] as? JsonArray

private fun JsonObject.stringOrJoin(name: String): String = when (val value = this[name]) {
    is JsonArray -> value.mapNotNull { it.contentOrNull() }.joinToString(", ")
    is JsonPrimitive -> value.contentOrNull().orEmpty()
    else -> ""
}

private fun JsonElement?.contentOrNull(): String? = when (this) {
    is JsonPrimitive -> toString().trim().trim('"')
    else -> null
}

private fun pickLiveExtension(allowedFormats: List<String>): String =
    when {
        allowedFormats.any { it.equals("ts", ignoreCase = true) } -> "ts"
        allowedFormats.any { it.equals("m3u8", ignoreCase = true) } -> "m3u8"
        else -> "ts"
    }

private fun parseXmltvTime(value: String): Long {
    val trimmed = value.trim()
    if (trimmed.isBlank()) return 0
    return runCatching {
        ZonedDateTime.parse(trimmed, DateTimeFormatter.ofPattern("yyyyMMddHHmmss Z", Locale.US)).toInstant().toEpochMilli()
    }.recoverCatching {
        LocalDateTime.parse(trimmed.take(14), DateTimeFormatter.ofPattern("yyyyMMddHHmmss", Locale.US))
            .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
    }.getOrDefault(0L)
}

private fun String.quoteJson(): String = buildString(length + 2) {
    append('"')
    for (char in this@quoteJson) {
        when (char) {
            '\\' -> append("\\\\")
            '"' -> append("\\\"")
            '\n' -> append("\\n")
            '\r' -> append("\\r")
            '\t' -> append("\\t")
            else -> append(char)
        }
    }
    append('"')
}
