package com.moalfarras.moplayer.data.repository

import com.moalfarras.moplayer.data.db.AccountInfoEntity
import com.moalfarras.moplayer.data.db.EpgProgramEntity
import com.moalfarras.moplayer.data.db.SeasonEntity
import com.moalfarras.moplayer.data.db.ServerInfoEntity
import com.moalfarras.moplayer.data.db.VodDetailsEntity
import com.moalfarras.moplayer.domain.model.Category
import com.moalfarras.moplayer.domain.model.ContentType
import com.moalfarras.moplayer.domain.model.EpgEntry
import com.moalfarras.moplayer.domain.model.LiveEpgSnapshot
import com.moalfarras.moplayer.domain.model.MediaItem
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.longOrNull
import java.net.URI
import java.net.URLDecoder
import java.nio.ByteBuffer
import java.nio.charset.CodingErrorAction
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

internal object XtreamSupport {
    private val LOCAL_TIMESTAMP_FORMAT: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss", Locale.US)

    fun extractCredentialsFromPlaylistUrl(url: String): XtreamCredentials? = runCatching {
        val cleanedUrl = cleanSourceUrl(url)
        val uri = URI(cleanedUrl)
        val params = uri.rawQuery
            ?.replace(";", "&")
            ?.split('&')
            ?.mapNotNull { part ->
                val pieces = part.split('=', limit = 2)
                if (pieces.size == 2) {
                    URLDecoder.decode(pieces[0], Charsets.UTF_8.name()).lowercase(Locale.US) to
                        URLDecoder.decode(pieces[1], Charsets.UTF_8.name())
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
            XtreamCredentials(
                baseUrl = normalizeServerBaseUrl(cleanedUrl) ?: run {
                    val port = if (uri.port > 0) ":${uri.port}" else ""
                    "${uri.scheme}://${uri.host}$port/"
                },
                username = username,
                password = password,
                playlistUrl = cleanedUrl,
            )
        }
    }.getOrNull()

    fun extractActivationSource(url: String): XtreamCredentials? = runCatching {
        val cleanedUrl = cleanSourceUrl(url)
        val uri = URI(cleanedUrl)
        val params = uri.rawQuery
            ?.replace(";", "&")
            ?.split('&')
            ?.mapNotNull { part ->
                val pieces = part.split('=', limit = 2)
                if (pieces.size == 2) {
                    URLDecoder.decode(pieces[0], Charsets.UTF_8.name()).lowercase(Locale.US) to
                        URLDecoder.decode(pieces[1], Charsets.UTF_8.name())
                } else {
                    null
                }
            }
            ?.toMap()
            .orEmpty()
        val baseUrl = params["server"].orEmpty().ifBlank { params["url"].orEmpty() }
        val username = params["username"].orEmpty()
        val password = params["password"].orEmpty()
        if (baseUrl.isBlank() || username.isBlank() || password.isBlank()) {
            null
        } else {
            XtreamCredentials(
                baseUrl = normalizeServerBaseUrl(baseUrl) ?: when {
                    baseUrl.startsWith("http://", ignoreCase = true) || baseUrl.startsWith("https://", ignoreCase = true) -> baseUrl.trimEnd('/') + "/"
                    else -> "http://${baseUrl.trimStart('/').trimEnd('/')}/"
                },
                username = username,
                password = password,
                playlistUrl = cleanedUrl,
            )
        }
    }.getOrNull()

    fun normalizeServerBaseUrl(raw: String): String? = runCatching {
        val cleaned = cleanSourceUrl(raw)
        if (cleaned.isBlank()) return@runCatching null
        val withScheme = if (
            cleaned.startsWith("http://", ignoreCase = true) ||
            cleaned.startsWith("https://", ignoreCase = true)
        ) {
            cleaned
        } else {
            "http://${cleaned.trimStart('/')}"
        }
        val uri = URI(withScheme)
        val scheme = uri.scheme?.lowercase(Locale.US)?.takeIf { it == "http" || it == "https" } ?: return@runCatching null
        val host = uri.host?.takeIf { it.isNotBlank() } ?: return@runCatching null
        val port = if (uri.port > 0) ":${uri.port}" else ""
        val segments = uri.rawPath
            ?.split('/')
            ?.filter { it.isNotBlank() }
            .orEmpty()
        val endpointIndex = segments.indexOfFirst { segment ->
            segment.equals("player_api.php", ignoreCase = true) ||
                segment.equals("get.php", ignoreCase = true) ||
                segment.equals("xmltv.php", ignoreCase = true)
        }
        val baseSegments = when {
            endpointIndex >= 0 -> segments.take(endpointIndex)
            segments.lastOrNull()?.endsWith(".php", ignoreCase = true) == true -> segments.dropLast(1)
            else -> segments
        }
        val path = if (baseSegments.isEmpty()) {
            "/"
        } else {
            "/" + baseSegments.joinToString("/") + "/"
        }
        "$scheme://$host$port$path"
    }.getOrNull()

    private fun cleanSourceUrl(url: String): String = url
        .trim()
        .trim('"', '\'')
        .replace("&amp;", "&", ignoreCase = true)
        .replace("^&", "&")

    fun looksLikeXtreamPlaylistUrl(url: String): Boolean {
        val cleanedUrl = cleanSourceUrl(url).lowercase(Locale.US)
        return cleanedUrl.contains("/get.php") &&
            (cleanedUrl.contains("username=") || cleanedUrl.contains("password=") || cleanedUrl.contains("type=m3u"))
    }

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

    /**
     * Throws a typed [SyncException] when the panel rejects the account. A missing `user_info`
     * means the host is not an Xtream API (or answered with something else entirely).
     */
    fun requireAuthorizedAccount(root: JsonObject, host: String = "") {
        val userInfo = root.objectOrNull("user_info")
            ?: throw SyncException(SyncErrorKind.NOT_IPTV_API, host = host, detail = "player_api response has no user_info")
        val auth = userInfo.string("auth").ifBlank { userInfo.string("authorized") }
        val status = userInfo.string("status").trim().lowercase(Locale.US)
        val message = root.string("message").ifBlank { userInfo.string("message") }
        val isRejectedAuth = auth.equals("0", ignoreCase = true) ||
            auth.equals("false", ignoreCase = true) ||
            auth.equals("no", ignoreCase = true)
        val expiry = parseTimestamp(userInfo.string("exp_date"))
        if (isRejectedAuth) {
            val kind = if (message.contains("connection", ignoreCase = true) &&
                (message.contains("max", ignoreCase = true) || message.contains("limit", ignoreCase = true))
            ) {
                SyncErrorKind.TOO_MANY_CONNECTIONS
            } else {
                SyncErrorKind.INVALID_CREDENTIALS
            }
            throw SyncException(kind, host = host, detail = SyncFailures.sanitize(message.ifBlank { "auth=0" }))
        }
        when (status) {
            "expired" -> throw SyncException(SyncErrorKind.ACCOUNT_EXPIRED, host = host, expiresAt = expiry, detail = "status=expired")
            "disabled", "banned" -> throw SyncException(SyncErrorKind.ACCOUNT_DISABLED, host = host, detail = "status=$status")
        }
    }

    fun parseCategories(
        serverId: Long,
        type: ContentType,
        array: JsonArray,
    ): List<Category> = array.mapIndexedNotNull { index, item ->
        val obj = item as? JsonObject ?: return@mapIndexedNotNull null
        Category(
            id = obj.string("category_id"),
            serverId = serverId,
            type = type,
            name = obj.string("category_name"),
            sortOrder = index,
            parentId = obj.string("parent_id"),
            rawJson = "",
        )
    }

    fun parseLiveStreams(
        serverId: Long,
        credentials: XtreamCredentials,
        allowedFormats: List<String>,
        categories: Map<String, String>,
        array: JsonArray,
    ): List<MediaItem> {
        val defaultOutput = defaultLiveExtension(allowedFormats, credentials.playlistUrl)
        return array.mapIndexedNotNull { index, item ->
            parseLiveStream(item, index, serverId, credentials, defaultOutput, categories)
        }
    }

    /**
     * Maps one get_live_streams element; non-objects and rows without a stream id return null.
     * [defaultOutput] comes from [defaultLiveExtension], computed once per list.
     */
    fun parseLiveStream(
        element: JsonElement,
        index: Int,
        serverId: Long,
        credentials: XtreamCredentials,
        defaultOutput: String,
        categories: Map<String, String>,
    ): MediaItem? {
        val obj = element as? JsonObject ?: return null
        val streamId = obj.string("stream_id")
        if (streamId.isBlank()) return null
        val categoryId = obj.string("category_id")
        val directSource = obj.string("direct_source")
        val output = directSource.extractMediaExtension()
            .ifBlank { obj.string("container_extension").ifBlank { obj.string("stream_type") }.normalizeLiveExtension() }
            .ifBlank { defaultOutput }
        val addedAt = parseTimestamp(obj.string("added"))
        val lastModifiedAt = parseTimestamp(obj.string("last_modified"))
        return MediaItem(
            id = streamId,
            serverId = serverId,
            type = ContentType.LIVE,
            categoryId = categoryId,
            categoryName = categories[categoryId].orEmpty(),
            title = obj.string("name"),
            streamUrl = directSource.ifBlank { credentials.streamUrl("live", streamId, output) },
            posterUrl = obj.imageUrl("stream_icon"),
            description = obj.string("plot").cleanPlot(),
            addedAt = addedAt,
            lastModifiedAt = lastModifiedAt,
            addedAtUnknown = addedAt <= 0 && lastModifiedAt <= 0,
            serverOrder = obj.int("num").takeIf { it > 0 } ?: index,
            containerExtension = output,
            tvgId = obj.string("epg_channel_id"),
            catchup = xtreamCatchup(obj.string("tv_archive"), obj.int("tv_archive_duration")),
            rawJson = "",
        )
    }

    fun parseVodStreams(
        serverId: Long,
        credentials: XtreamCredentials,
        categories: Map<String, String>,
        array: JsonArray,
    ): List<MediaItem> = array.mapIndexedNotNull { index, item ->
        parseVodStream(item, index, serverId, credentials, categories)
    }

    /** Maps one get_vod_streams element; non-objects and rows without a stream id return null. */
    fun parseVodStream(
        element: JsonElement,
        index: Int,
        serverId: Long,
        credentials: XtreamCredentials,
        categories: Map<String, String>,
    ): MediaItem? {
        val obj = element as? JsonObject ?: return null
        val streamId = obj.string("stream_id")
        if (streamId.isBlank()) return null
        val categoryId = obj.string("category_id")
        val directSource = obj.string("direct_source")
        val extension = obj.string("container_extension")
            .normalizeVodExtension()
            .ifBlank { directSource.extractMediaExtension() }
            .ifBlank { "mp4" }
        val addedAt = parseTimestamp(obj.string("added"))
        val lastModifiedAt = parseTimestamp(obj.string("last_modified"))
        return MediaItem(
            id = streamId,
            serverId = serverId,
            type = ContentType.MOVIE,
            categoryId = categoryId,
            categoryName = categories[categoryId].orEmpty(),
            title = obj.string("name"),
            streamUrl = directSource.ifBlank { credentials.streamUrl("movie", streamId, extension) },
            posterUrl = obj.imageUrl("stream_icon").ifBlank { obj.imageUrl("cover") },
            backdropUrl = obj.imageUrlOrJoin("backdrop_path"),
            description = obj.string("plot").cleanPlot(),
            rating = obj.string("rating").cleanRating().ifBlank { obj.string("rating_5based").cleanRating() },
            durationSecs = obj.durationSeconds("duration_secs", "duration"),
            addedAt = addedAt,
            lastModifiedAt = lastModifiedAt,
            addedAtUnknown = addedAt <= 0 && lastModifiedAt <= 0,
            serverOrder = obj.int("num").takeIf { it > 0 } ?: index,
            containerExtension = directSource.extractMediaExtension().ifBlank { extension },
            cast = obj.stringOrJoin("cast"),
            director = obj.stringOrJoin("director"),
            genre = obj.stringOrJoin("genre"),
            releaseDate = obj.string("releaseDate").ifBlank { obj.string("release_date") },
            rawJson = "",
        )
    }

    fun parseSeries(
        serverId: Long,
        categories: Map<String, String>,
        array: JsonArray,
    ): List<MediaItem> = array.mapIndexedNotNull { index, item ->
        parseSeriesEntry(item, index, serverId, categories)
    }

    /** Maps one get_series element; non-objects and rows without a series id return null. */
    fun parseSeriesEntry(
        element: JsonElement,
        index: Int,
        serverId: Long,
        categories: Map<String, String>,
    ): MediaItem? {
        val obj = element as? JsonObject ?: return null
        val seriesId = obj.string("series_id")
        if (seriesId.isBlank()) return null
        val categoryId = obj.string("category_id")
        val addedAt = parseTimestamp(obj.string("added"))
        val lastModifiedAt = parseTimestamp(obj.string("last_modified"))
        return MediaItem(
            id = seriesId,
            serverId = serverId,
            type = ContentType.SERIES,
            categoryId = categoryId,
            categoryName = categories[categoryId].orEmpty(),
            title = obj.string("name"),
            streamUrl = "",
            posterUrl = obj.imageUrl("cover"),
            backdropUrl = obj.imageUrlOrJoin("backdrop_path"),
            description = obj.string("plot").cleanPlot(),
            rating = obj.string("rating").cleanRating().ifBlank { obj.string("rating_5based").cleanRating() },
            addedAt = addedAt,
            lastModifiedAt = lastModifiedAt,
            addedAtUnknown = addedAt <= 0 && lastModifiedAt <= 0,
            serverOrder = obj.int("num").takeIf { it > 0 } ?: index,
            seriesId = seriesId,
            cast = obj.stringOrJoin("cast"),
            director = obj.stringOrJoin("director"),
            genre = obj.stringOrJoin("genre"),
            releaseDate = obj.string("releaseDate").ifBlank { obj.string("release_date") },
            rawJson = "",
        )
    }

    fun enrichVod(
        json: Json,
        serverId: Long,
        current: MediaItem,
        root: JsonObject,
    ): Pair<MediaItem, VodDetailsEntity> {
        val info = root.objectOrNull("info") ?: JsonObject(emptyMap())
        val movieData = root.objectOrNull("movie_data") ?: JsonObject(emptyMap())
        val movieImage = info.imageUrl("movie_image").ifBlank { current.posterUrl }
        val backdrop = info.imageUrlOrJoin("backdrop_path").ifBlank { current.backdropUrl }
        val plot = info.string("plot").cleanPlot().ifBlank { movieData.string("plot").cleanPlot().ifBlank { current.description } }
        val rating = info.string("rating").cleanRating().ifBlank { movieData.string("rating").cleanRating().ifBlank { current.rating } }
        val durationSecs = info.durationSeconds("duration_secs", "duration")
            .takeIf { it > 0 }
            ?: movieData.durationSeconds("duration_secs", "duration").takeIf { it > 0 }
            ?: current.durationSecs
        val enriched = current.copy(
            posterUrl = movieImage,
            backdropUrl = backdrop,
            description = plot,
            rating = rating,
            durationSecs = durationSecs,
            cast = info.stringOrJoin("cast").ifBlank { current.cast },
            director = info.stringOrJoin("director").ifBlank { current.director },
            genre = info.stringOrJoin("genre").ifBlank { current.genre },
            releaseDate = info.string("releasedate").ifBlank { info.string("releaseDate").ifBlank { current.releaseDate } },
            rawJson = "",
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
        val episodeGroups = episodeGroups(root["episodes"])
        val now = System.currentTimeMillis()
        val seriesId = current.seriesId.ifBlank { current.id }
        val enrichedSeries = current.copy(
            title = info.string("name").ifBlank { current.title },
            description = info.string("plot").cleanPlot().ifBlank { current.description },
            rating = info.string("rating").cleanRating().ifBlank { current.rating },
            posterUrl = info.imageUrl("cover_big").ifBlank { info.imageUrl("cover").ifBlank { current.posterUrl } },
            backdropUrl = info.imageUrlOrJoin("backdrop_path").ifBlank { current.backdropUrl },
            cast = info.stringOrJoin("cast").ifBlank { current.cast },
            director = info.stringOrJoin("director").ifBlank { current.director },
            genre = info.stringOrJoin("genre").ifBlank { current.genre },
            releaseDate = info.string("releaseDate").ifBlank { current.releaseDate },
            rawJson = "",
        )
        val episodeItems = episodeGroups.flatMap { (seasonKey, value) ->
            value.mapIndexedNotNull { index, element ->
                val obj = element as? JsonObject ?: return@mapIndexedNotNull null
                val episodeInfo = obj.objectOrNull("info") ?: JsonObject(emptyMap())
                val episodeId = obj.string("id")
                if (episodeId.isBlank()) return@mapIndexedNotNull null
                val seasonNumber = obj.int("season").takeIf { it > 0 } ?: seasonKey.toIntOrNull() ?: 0
                val episodeNumber = obj.int("episode_num").takeIf { it > 0 } ?: (index + 1)
                val directSource = obj.string("direct_source").ifBlank { episodeInfo.string("direct_source") }
                val extension = obj.string("container_extension")
                    .normalizeVodExtension()
                    .ifBlank { episodeInfo.string("container_extension").normalizeVodExtension() }
                    .ifBlank { directSource.extractMediaExtension() }
                    .ifBlank { "mp4" }
                val addedAt = parseTimestamp(obj.string("added"))
                val lastModifiedAt = parseTimestamp(obj.string("last_modified"))
                MediaItem(
                    id = episodeId,
                    serverId = serverId,
                    type = ContentType.EPISODE,
                    categoryId = current.categoryId,
                    categoryName = current.categoryName,
                    title = obj.string("title").ifBlank { "Episode $episodeNumber" },
                    streamUrl = directSource.ifBlank { credentials.streamUrl("series", episodeId, extension) },
                    posterUrl = episodeInfo.imageUrl("cover_big").ifBlank { episodeInfo.imageUrl("movie_image").ifBlank { enrichedSeries.posterUrl } },
                    backdropUrl = enrichedSeries.backdropUrl,
                    description = episodeInfo.string("plot").cleanPlot(),
                    rating = episodeInfo.string("rating").cleanRating().ifBlank { enrichedSeries.rating },
                    durationSecs = episodeInfo.durationSeconds("duration_secs", "duration")
                        .takeIf { it > 0 }
                        ?: obj.durationSeconds("duration_secs", "duration").takeIf { it > 0 }
                        ?: 0,
                    addedAt = addedAt,
                    lastModifiedAt = lastModifiedAt,
                    addedAtUnknown = addedAt <= 0 && lastModifiedAt <= 0,
                    serverOrder = episodeNumber,
                    containerExtension = directSource.extractMediaExtension().ifBlank { extension },
                    seriesId = seriesId,
                    seasonNumber = seasonNumber,
                    episodeNumber = episodeNumber,
                    cast = enrichedSeries.cast,
                    director = enrichedSeries.director,
                    genre = enrichedSeries.genre,
                    releaseDate = episodeInfo.string("releaseDate").ifBlank { enrichedSeries.releaseDate },
                    rawJson = "",
                )
            }
        }
        val explicitSeasonEntities = seasons.mapNotNull { element ->
            val obj = element as? JsonObject ?: return@mapNotNull null
            val seasonNumber = obj.int("season_number")
            if (seasonNumber <= 0) null else SeasonEntity(
                serverId = serverId,
                seriesId = seriesId,
                seasonNumber = seasonNumber,
                name = obj.string("name").ifBlank { "Season $seasonNumber" },
                cover = obj.string("cover"),
                airDate = obj.string("air_date"),
                plot = obj.string("overview"),
                rawJson = "",
                updatedAt = now,
            )
        }
        val seasonEntities = explicitSeasonEntities.ifEmpty {
            episodeItems
                .map { it.seasonNumber.coerceAtLeast(1) }
                .distinct()
                .sorted()
                .map { seasonNumber ->
                    SeasonEntity(
                        serverId = serverId,
                        seriesId = seriesId,
                        seasonNumber = seasonNumber,
                        name = "Season $seasonNumber",
                        cover = enrichedSeries.posterUrl,
                        airDate = "",
                        plot = "",
                        rawJson = "",
                        updatedAt = now,
                    )
                }
        }
        return Triple(enrichedSeries, seasonEntities, episodeItems)
    }

    /**
     * get_series_info "episodes" comes in three shapes: a map of season -> list, a flat list, or
     * (when PHP's season keys happen to be 0..n) a list of lists where the index is the season.
     */
    private fun episodeGroups(value: JsonElement?): List<Pair<String, JsonArray>> = when (value) {
        is JsonObject -> value.entries.mapNotNull { (seasonKey, element) ->
            (element as? JsonArray)?.let { seasonKey to it }
        }
        is JsonArray -> if (value.any { it is JsonArray }) {
            value.mapIndexedNotNull { index, element -> (element as? JsonArray)?.let { index.toString() to it } }
        } else {
            listOf("1" to value)
        }
        else -> emptyList()
    }

    /** The provider's own trailer id for a series, from a get_series_info root ("info.youtube_trailer").
     *  enrichSeries otherwise discards it; the trailer resolver reads it on demand. */
    fun seriesTrailerYoutubeId(root: JsonObject): String =
        root.objectOrNull("info")?.string("youtube_trailer").orEmpty()

    /**
     * Maps get_short_epg listings. Xtream sends `title` and `description` base64-encoded; plain
     * text from other panels is kept. The decision is made for the whole response, because a
     * panel either encodes every listing or none.
     */
    fun parseShortEpg(
        serverId: Long,
        fallbackChannelKey: String,
        root: JsonObject,
    ): List<EpgProgramEntity> {
        val listings = (
            root.arrayOrNull("epg_listings")
                ?: root.arrayOrNull("listings")
                ?: root.arrayOrNull("epgListings")
                ?: JsonArray(emptyList())
            ).mapNotNull { it as? JsonObject }
        val rawTitles = listings.map { it.string("title").ifBlank { it.string("name") } }
        val encoded = rawTitles.any { it.isNotBlank() } &&
            rawTitles.filter { it.isNotBlank() }.all { decodeBase64Text(it) != null }
        val updatedAt = System.currentTimeMillis()
        return listings.mapIndexedNotNull { index, obj ->
            val rawTitle = rawTitles[index]
            val rawDescription = obj.string("description").ifBlank { obj.string("desc") }
            val title = if (encoded) decodeBase64Text(rawTitle) ?: rawTitle else rawTitle
            val description = if (encoded) decodeBase64Text(rawDescription) ?: rawDescription else rawDescription
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
                    description = description,
                    startAt = startAt,
                    endAt = if (endAt > 0) endAt else startAt,
                    category = obj.string("category"),
                    rawJson = "",
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
            LocalDateTime.parse(trimmed, LOCAL_TIMESTAMP_FORMAT)
                .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
        }.getOrDefault(0L)
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

/**
 * Stored Xtream stream URLs embed the credentials that were valid at sync time
 * (`{base}{kind}/{user}/{pass}/...`). When the provider changes the password and the viewer signs
 * in again, catalog rows, episodes and history keep the old password until they are re-synced;
 * this puts the account's current credentials into such a URL at play time. Other URLs (direct
 * sources, other hosts, M3U links) are returned unchanged.
 */
internal fun refreshXtreamStreamCredentials(url: String, baseUrl: String, username: String, password: String): String {
    if (baseUrl.isBlank() || username.isBlank()) return url
    val base = if (baseUrl.endsWith('/')) baseUrl else "$baseUrl/"
    if (!url.startsWith(base)) return url
    val parts = url.substring(base.length).split('/', limit = 4)
    if (parts.size < 4 || parts[0] !in XTREAM_STREAM_KINDS) return url
    return "$base${parts[0]}/${username.asPathSegment()}/${password.asPathSegment()}/${parts[3]}"
}

private val XTREAM_STREAM_KINDS = setOf("live", "movie", "series", "timeshift")

/** `{base}{kind}/{user}/{pass}/{id}.{ext}` with the credentials escaped as path segments. */
private fun XtreamCredentials.streamUrl(kind: String, id: String, extension: String): String =
    "${baseUrl}$kind/${username.asPathSegment()}/${password.asPathSegment()}/$id.$extension"

/**
 * Percent-encodes characters that would break a URL path segment (`/ ? # %` and spaces).
 * Ordinary credentials are returned unchanged, so existing stream URLs keep their exact form.
 */
internal fun String.asPathSegment(): String {
    if (all { it.isPathSafe() }) return this
    val out = StringBuilder(length + 8)
    for (byte in toByteArray(Charsets.UTF_8)) {
        val char = (byte.toInt() and 0xff).toChar()
        if (byte >= 0 && char.isPathSafe()) {
            out.append(char)
        } else {
            out.append('%').append(HEX_DIGITS[(byte.toInt() shr 4) and 0x0f]).append(HEX_DIGITS[byte.toInt() and 0x0f])
        }
    }
    return out.toString()
}

private const val HEX_DIGITS = "0123456789ABCDEF"

private fun Char.isPathSafe(): Boolean =
    this in 'a'..'z' || this in 'A'..'Z' || this in '0'..'9' || this in "-._~!$&'()*+,;=:@"

/**
 * Xtream `tv_archive` is "1"/true when the channel keeps an archive; "0", false, null or a
 * missing key mean no catch-up and must be stored blank (the UI shows a badge for any value).
 * Enabled archives are stored as `xtream:<days>` so a timeshift URL builder knows the window.
 */
internal fun xtreamCatchup(tvArchive: String, archiveDays: Int): String {
    val enabled = tvArchive == "1" || tvArchive.equals("true", ignoreCase = true)
    return if (enabled && archiveDays > 0) "xtream:$archiveDays" else ""
}

/**
 * For an Xtream live URL (`.../live/user/pass/123.ts`), the same channel in the other container
 * (`.ts` <-> `.m3u8`). The player tries it once when the first format fails to open. Returns
 * null for anything that is not an Xtream-built live URL.
 */
fun alternateLiveFormatUrl(streamUrl: String): String? {
    val url = streamUrl.substringBefore('|')
    val suffix = streamUrl.removePrefix(url)
    val query = url.substringAfter('?', "")
    val path = url.substringBefore('?')
    if (!LIVE_URL_PATTERN.containsMatchIn(path)) return null
    val swapped = when {
        path.endsWith(".ts", ignoreCase = true) -> path.dropLast(3) + ".m3u8"
        path.endsWith(".m3u8", ignoreCase = true) -> path.dropLast(5) + ".ts"
        else -> return null
    }
    return swapped + (if (query.isNotEmpty()) "?$query" else "") + suffix
}

private val LIVE_URL_PATTERN = Regex("""/live/[^/]+/[^/]+/[^/]+\.(ts|m3u8)$""", RegexOption.IGNORE_CASE)

/**
 * Decodes base64 text (as get_short_epg sends it) with strict padding and strict UTF-8, and only
 * accepts results that read like text. Returns null when [raw] is not base64 text.
 */
internal fun decodeBase64Text(raw: String): String? {
    val value = raw.trim().filterNot { it == '\n' || it == '\r' }
    if (value.isEmpty()) return ""
    if (value.length % 4 != 0) return null
    val padding = value.takeLastWhile { it == '=' }.length
    if (padding > 2) return null
    val bytes = ByteArray(value.length / 4 * 3 - padding)
    var out = 0
    var index = 0
    while (index < value.length) {
        var block = 0
        for (offset in 0 until 4) {
            val char = value[index + offset]
            val sextet = if (char == '=') {
                if (index + offset < value.length - padding) return null
                0
            } else {
                BASE64_ALPHABET.indexOf(char).takeIf { it >= 0 } ?: return null
            }
            block = (block shl 6) or sextet
        }
        for (shift in intArrayOf(16, 8, 0)) {
            if (out < bytes.size) bytes[out++] = (block shr shift).toByte()
        }
        index += 4
    }
    val text = runCatching {
        Charsets.UTF_8.newDecoder()
            .onMalformedInput(CodingErrorAction.REPORT)
            .onUnmappableCharacter(CodingErrorAction.REPORT)
            .decode(ByteBuffer.wrap(bytes))
            .toString()
    }.getOrNull() ?: return null
    if (text.any { it.isISOControl() && it != '\n' && it != '\t' && it != '\r' }) return null
    val meaningful = text.count { it.isLetterOrDigit() || it.isWhitespace() }
    if (text.isNotBlank() && meaningful * 2 < text.length) return null
    return text.trim()
}

private const val BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

private fun JsonObject.string(name: String): String = this[name]?.contentOrNull().orEmpty()

private fun JsonObject.imageUrl(name: String): String = string(name).normalizeImageUrl()

private fun JsonObject.int(name: String): Int {
    val text = string(name)
    return text.toIntOrNull()
        ?: (this[name] as? JsonPrimitive)?.intOrNull
        ?: text.toDoubleOrNull()?.takeIf { it in Int.MIN_VALUE.toDouble()..Int.MAX_VALUE.toDouble() }?.toInt()
        ?: 0
}

private fun JsonObject.long(name: String): Long =
    string(name).toLongOrNull() ?: (this[name] as? JsonPrimitive)?.longOrNull ?: 0L

private fun JsonObject.durationSeconds(vararg names: String): Long {
    names.forEach { name ->
        val direct = long(name)
        if (direct > 0 && name.contains("secs", ignoreCase = true)) return direct
        parseDurationSeconds(string(name)).takeIf { it > 0 }?.let { return it }
        if (direct > 0) return direct
    }
    return 0L
}

private fun parseDurationSeconds(value: String): Long {
    val clean = value.trim().lowercase(Locale.US)
    if (clean.isBlank()) return 0L
    clean.toLongOrNull()?.let { numeric ->
        return if (numeric in 1..600) numeric * 60 else numeric
    }
    if (":" in clean) {
        val parts = clean.split(':').mapNotNull { it.toLongOrNull() }
        if (parts.size == 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
        if (parts.size == 2) return parts[0] * 60 + parts[1]
    }
    val hours = DURATION_HOURS.find(clean)?.groupValues?.getOrNull(1)?.toLongOrNull() ?: 0L
    val minutes = DURATION_MINUTES.find(clean)?.groupValues?.getOrNull(1)?.toLongOrNull() ?: 0L
    val seconds = DURATION_SECONDS.find(clean)?.groupValues?.getOrNull(1)?.toLongOrNull() ?: 0L
    return hours * 3600 + minutes * 60 + seconds
}

private val DURATION_HOURS = Regex("""(\d+)\s*(h|hr|hrs|hour|hours)""")
private val DURATION_MINUTES = Regex("""(\d+)\s*(m|min|mins|minute|minutes)""")
private val DURATION_SECONDS = Regex("""(\d+)\s*(s|sec|secs|second|seconds)""")

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

private fun JsonObject.imageUrlOrJoin(name: String): String = when (val value = this[name]) {
    is JsonArray -> value.mapNotNull { it.contentOrNull()?.normalizeImageUrl()?.takeIf(String::isNotBlank) }.firstOrNull().orEmpty()
    is JsonPrimitive -> value.contentOrNull().orEmpty().normalizeImageUrl()
    else -> ""
}

private fun JsonElement?.contentOrNull(): String? = when (this) {
    null, JsonNull -> null
    is JsonPrimitive -> content.trim().takeUnless { it.isNullLikeToken() }
    else -> null
}

internal fun String.normalizeImageUrl(): String {
    val clean = trim()
        .trim('"', '\'')
        .replace("&amp;", "&", ignoreCase = true)
    if (clean.isBlank() || clean.isNullLikeToken()) return ""
    return when {
        clean.startsWith("//") -> "https:$clean"
        clean.startsWith("http://", ignoreCase = true) || clean.startsWith("https://", ignoreCase = true) -> clean
        else -> ""
    }
}

private fun String.isNullLikeToken(): Boolean =
    equals("null", ignoreCase = true) ||
        equals("undefined", ignoreCase = true) ||
        equals("n/a", ignoreCase = true) ||
        equals("na", ignoreCase = true) ||
        equals("none", ignoreCase = true) ||
        equals("[]")

/**
 * Picks the live container. A direct source, a per-stream extension or an `output=` in the
 * saved playlist link win. Otherwise MPEG-TS is preferred when the panel allows it: a single TS
 * request starts much faster than HLS (playlist, then media playlist, then segment) and on-demand
 * panels only start segmenting on the first HLS request. The player can fall back to the other
 * format with [alternateLiveFormatUrl].
 */
internal fun pickLiveExtension(
    allowedFormats: List<String>,
    streamExtension: String = "",
    directSource: String = "",
    playlistUrl: String = "",
): String {
    val directExtension = directSource.extractMediaExtension()
    if (directExtension.isNotBlank()) return directExtension

    val metadataExtension = streamExtension.normalizeLiveExtension()
    if (metadataExtension.isNotBlank()) return metadataExtension

    return defaultLiveExtension(allowedFormats, playlistUrl)
}

/** The live container when a stream names none: the saved link's `output=`, else the panel's formats. */
internal fun defaultLiveExtension(allowedFormats: List<String>, playlistUrl: String): String {
    val playlistOutput = runCatching {
        URI(playlistUrl).rawQuery
            ?.split('&')
            ?.mapNotNull { part ->
                val pieces = part.split('=', limit = 2)
                if (pieces.size == 2) {
                    URLDecoder.decode(pieces[0], Charsets.UTF_8.name()) to URLDecoder.decode(pieces[1], Charsets.UTF_8.name())
                } else {
                    null
                }
            }
            ?.firstOrNull { (key, _) -> key.equals("output", ignoreCase = true) }
            ?.second
            .orEmpty()
    }.getOrDefault("").normalizeLiveExtension()
    if (playlistOutput.isNotBlank()) return playlistOutput

    val supported = allowedFormats.mapNotNull { it.normalizeLiveExtension().takeIf(String::isNotBlank) }
    return when {
        supported.isEmpty() -> "ts"
        supported.any { it == "ts" } -> "ts"
        supported.any { it == "m3u8" } -> "m3u8"
        supported.any { it == "mp4" } -> "mp4"
        else -> supported.first()
    }
}

private fun String.extractMediaExtension(): String {
    val path = substringBefore('|').substringBefore('?').substringBefore('#')
    return path.substringAfterLast('/', "")
        .substringAfterLast('.', "")
        .normalizeLiveExtension()
}

private fun String.normalizeLiveExtension(): String = trim()
    .trimStart('.')
    .lowercase(Locale.US)
    .let { value ->
        when (value) {
            "hls", "m3u", "m3u8" -> "m3u8"
            "mpegts", "mpeg-ts", "ts" -> "ts"
            "dash", "mpd" -> "mpd"
            "smooth", "ism" -> "ism"
            "mp4", "mkv", "webm", "flv" -> value
            else -> ""
        }
    }

private fun String.normalizeVodExtension(): String =
    normalizeLiveExtension().ifBlank {
        trim()
            .trimStart('.')
            .lowercase(Locale.US)
            .let { value ->
                when (value) {
                    "mov", "m4v", "avi", "mpg", "mpeg", "vob", "3gp", "3g2" -> value
                    "matroska" -> "mkv"
                    "quicktime" -> "mov"
                    else -> ""
                }
            }
    }
