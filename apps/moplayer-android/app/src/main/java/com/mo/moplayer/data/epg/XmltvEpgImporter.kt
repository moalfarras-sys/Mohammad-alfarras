package com.mo.moplayer.data.epg

import android.util.Xml
import com.mo.moplayer.data.local.entity.EpgEntity
import okhttp3.OkHttpClient
import okhttp3.Request
import org.xmlpull.v1.XmlPullParser
import java.io.BufferedInputStream
import java.io.InputStream
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import java.util.zip.GZIPInputStream

/**
 * Streams an XMLTV guide (plain or gzip) and turns the programmes of the playlist's channels into
 * [EpgEntity] rows.
 *
 * XMLTV files are often 20-200 MB, so nothing is held in memory beyond one batch: the parser is a
 * pull parser, only programmes inside the [windowStartMs]..[windowEndMs] window are kept, and rows
 * are handed to [onBatch] [BATCH_SIZE] at a time.
 *
 * Channels are matched by tvg-id (`epgChannelId`) first and by the guide's display name second,
 * because many playlists ship without tvg-id but with the exact channel name.
 */
class XmltvEpgImporter(private val client: OkHttpClient) {

    /** One playlist channel the guide can be mapped onto. */
    data class ChannelKey(val epgChannelId: String?, val streamId: Int, val name: String)

    data class Result(val programmes: Int, val matchedChannels: Int)

    suspend fun import(
        url: String,
        serverId: Long,
        channels: List<ChannelKey>,
        windowStartMs: Long,
        windowEndMs: Long,
        onBatch: suspend (List<EpgEntity>) -> Unit
    ): Result {
        if (channels.isEmpty()) return Result(0, 0)
        val byId = HashMap<String, MutableList<Int>>()
        val byName = HashMap<String, MutableList<Int>>()
        channels.forEach { channel ->
            channel.epgChannelId?.trim()?.lowercase(Locale.ROOT)?.takeIf { it.isNotEmpty() }?.let {
                byId.getOrPut(it) { mutableListOf() } += channel.streamId
            }
            normalizeName(channel.name).takeIf { it.isNotEmpty() }?.let {
                byName.getOrPut(it) { mutableListOf() } += channel.streamId
            }
        }

        val request = Request.Builder()
            .url(url)
            .header("User-Agent", "MoPlayer/2 (Android TV)")
            .build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IllegalStateException("EPG HTTP ${response.code}")
            val body = response.body ?: throw IllegalStateException("EPG response is empty")
            return openMaybeGzip(body.byteStream()).use { stream ->
                parse(stream, serverId, byId, byName, windowStartMs, windowEndMs, onBatch)
            }
        }
    }

    private suspend fun parse(
        stream: InputStream,
        serverId: Long,
        byId: Map<String, List<Int>>,
        byName: Map<String, List<Int>>,
        windowStartMs: Long,
        windowEndMs: Long,
        onBatch: suspend (List<EpgEntity>) -> Unit
    ): Result {
        val parser = Xml.newPullParser().apply {
            setFeature(XmlPullParser.FEATURE_PROCESS_NAMESPACES, false)
            setInput(stream, null)
        }
        // Guide channel id -> playlist stream ids, filled from <channel> elements.
        val guideToStreams = HashMap<String, List<Int>>()
        val batch = ArrayList<EpgEntity>(BATCH_SIZE)
        val matched = HashSet<Int>()
        var programmes = 0

        var channelId: String? = null
        var channelNames = mutableListOf<String>()

        var progChannel: String? = null
        var progStart = 0L
        var progStop = 0L
        var progTitle: String? = null
        var progDesc: String? = null
        var progLang: String? = null

        var event = parser.eventType
        while (event != XmlPullParser.END_DOCUMENT) {
            when (event) {
                XmlPullParser.START_TAG -> when (parser.name) {
                    "channel" -> {
                        channelId = parser.getAttributeValue(null, "id")
                        channelNames = mutableListOf()
                    }
                    "display-name" -> if (channelId != null) {
                        channelNames += parser.nextText().orEmpty()
                    }
                    "programme" -> {
                        progChannel = parser.getAttributeValue(null, "channel")
                        progStart = parseXmltvTime(parser.getAttributeValue(null, "start"))
                        progStop = parseXmltvTime(parser.getAttributeValue(null, "stop"))
                        progTitle = null
                        progDesc = null
                        progLang = null
                    }
                    "title" -> if (progChannel != null && progTitle == null) {
                        progLang = parser.getAttributeValue(null, "lang")
                        progTitle = parser.nextText()?.trim()
                    }
                    "desc" -> if (progChannel != null && progDesc == null) {
                        progDesc = parser.nextText()?.trim()
                    }
                }
                XmlPullParser.END_TAG -> when (parser.name) {
                    "channel" -> {
                        val id = channelId
                        if (id != null) {
                            val streams = byId[id.trim().lowercase(Locale.ROOT)]
                                ?: channelNames.firstNotNullOfOrNull { byName[normalizeName(it)] }
                            if (streams != null) guideToStreams[id] = streams
                        }
                        channelId = null
                    }
                    "programme" -> {
                        val guideChannel = progChannel
                        val title = progTitle
                        if (guideChannel != null && !title.isNullOrBlank() &&
                            progStart > 0L && progStop > progStart &&
                            progStop >= windowStartMs && progStart <= windowEndMs
                        ) {
                            val streams = guideToStreams[guideChannel]
                                ?: byId[guideChannel.trim().lowercase(Locale.ROOT)]
                            streams?.forEach { streamId ->
                                matched += streamId
                                programmes += 1
                                batch += EpgEntity(
                                    id = "${serverId}_${streamId}_$progStart",
                                    channelId = guideChannel,
                                    streamId = streamId,
                                    serverId = serverId,
                                    title = title,
                                    description = progDesc?.takeIf { it.isNotBlank() },
                                    lang = progLang,
                                    startTime = progStart,
                                    endTime = progStop
                                )
                                if (batch.size >= BATCH_SIZE) {
                                    onBatch(ArrayList(batch))
                                    batch.clear()
                                }
                            }
                        }
                        progChannel = null
                    }
                }
            }
            event = parser.next()
        }
        if (batch.isNotEmpty()) onBatch(batch)
        return Result(programmes, matched.size)
    }

    private fun openMaybeGzip(raw: InputStream): InputStream {
        val buffered = BufferedInputStream(raw, 64 * 1024)
        buffered.mark(2)
        val first = buffered.read()
        val second = buffered.read()
        buffered.reset()
        return if (first == 0x1f && second == 0x8b) GZIPInputStream(buffered, 64 * 1024) else buffered
    }

    companion object {
        private const val BATCH_SIZE = 1_000

        private val TIME_FORMATS = listOf("yyyyMMddHHmmss Z", "yyyyMMddHHmmssZ", "yyyyMMddHHmmss", "yyyyMMddHHmm")

        /** "20261004203000 +0200" -> epoch millis; 0 when unreadable. */
        fun parseXmltvTime(value: String?): Long {
            val raw = value?.trim().orEmpty()
            if (raw.length < 12) return 0L
            for (pattern in TIME_FORMATS) {
                val formatter = SimpleDateFormat(pattern, Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                    isLenient = false
                }
                val parsed = runCatching { formatter.parse(raw) }.getOrNull()
                if (parsed != null) return parsed.time
            }
            return 0L
        }

        /** Lower-case name without quality tags, so "beIN Sports 1 HD" matches "BEIN SPORTS 1". */
        fun normalizeName(value: String): String =
            value.lowercase(Locale.ROOT)
                .replace(Regex("""\b(fhd|uhd|hd|sd|4k|hevc|h265|backup|\|.*)\b"""), " ")
                .replace(Regex("""[^\p{L}\p{N}]+"""), " ")
                .trim()
    }
}
