package com.mo.moplayer.data.parser

import com.mo.moplayer.data.local.entity.CategoryEntity
import com.mo.moplayer.data.local.entity.ChannelEntity
import com.mo.moplayer.data.local.entity.MovieEntity
import java.io.BufferedReader
import java.io.InputStream
import java.io.InputStreamReader

/**
 * M3U/M3U8 Playlist Parser
 * 
 * Supports extended M3U format with:
 * - #EXTINF tags
 * - group-title for categories
 * - tvg-logo for icons
 * - tvg-id for EPG mapping
 */
class M3uParser {
    
    data class M3uItem(
        val name: String,
        val url: String,
        val logo: String? = null,
        val group: String? = null,
        val tvgId: String? = null,
        val tvgName: String? = null,
        val duration: Int = -1,
        val isLive: Boolean = true,
        val extras: Map<String, String> = emptyMap()
    )
    
    data class ParseResult(
        val items: List<M3uItem>,
        val categories: Set<String>,
        val totalLines: Int = 0,
        val skippedEntries: Int = 0,
        val duplicateEntries: Int = 0
    )

    data class StreamingParseResult(
        val categories: Set<String>,
        val totalLines: Int = 0,
        val skippedEntries: Int = 0,
        val duplicateEntries: Int = 0,
        val itemCount: Int = 0
    )
    
    companion object {
        private val EXTINF_PATTERN = Regex("#EXTINF:(-?\\d+)\\s*,?(.*)$")
        private val ATTRIBUTE_PATTERN = Regex("([a-zA-Z0-9_-]+)=\"([^\"]*)\"")
        private val GROUP_PATTERN = Regex("group-title=\"([^\"]*)\"", RegexOption.IGNORE_CASE)
        private val LOGO_PATTERN = Regex("tvg-logo=\"([^\"]*)\"", RegexOption.IGNORE_CASE)
        private val TVG_ID_PATTERN = Regex("tvg-id=\"([^\"]*)\"", RegexOption.IGNORE_CASE)
        private val TVG_NAME_PATTERN = Regex("tvg-name=\"([^\"]*)\"", RegexOption.IGNORE_CASE)
    }
    
    fun parse(content: String): ParseResult {
        val lines = content.lines()
        return parseLines(lines)
    }
    
    fun parse(inputStream: InputStream): ParseResult {
        return BufferedReader(InputStreamReader(inputStream)).useLines { lines ->
            parseLines(lines)
        }
    }

    suspend fun parseStreaming(
        inputStream: InputStream,
        onItem: suspend (M3uItem) -> Unit
    ): StreamingParseResult {
        return BufferedReader(InputStreamReader(inputStream)).useLines { lines ->
            parseStreamingLines(lines, onItem)
        }
    }
    
    private fun parseLines(lines: Iterable<String>): ParseResult = parseLines(lines.asSequence())

    private fun parseLines(lines: Sequence<String>): ParseResult {
        val items = mutableListOf<M3uItem>()
        val categories = mutableSetOf<String>()
        val seenStreamFingerprints = hashSetOf<Long>()
        var skippedEntries = 0
        var duplicateEntries = 0
        var totalLines = 0
        
        var currentInfo: String? = null
        
        for (line in lines) {
            totalLines += 1
            val trimmedLine = line.trim()
            
            when {
                trimmedLine.isEmpty() || trimmedLine.startsWith("#EXTM3U") -> {
                    // Skip empty lines and header
                }
                trimmedLine.startsWith("#EXTINF:") -> {
                    currentInfo = trimmedLine
                }
                trimmedLine.startsWith("#") -> {
                    // Skip other comments/tags
                }
                trimmedLine.isNotEmpty() && currentInfo != null -> {
                    if (!isPotentialStreamUrl(trimmedLine)) {
                        skippedEntries += 1
                        currentInfo = null
                        continue
                    }
                    val normalizedUrl = trimmedLine.trim()
                    if (!markStreamSeen(seenStreamFingerprints, normalizedUrl)) {
                        duplicateEntries += 1
                        currentInfo = null
                        continue
                    }
                    val item = parseExtInf(currentInfo, normalizedUrl)
                    items.add(item)
                    item.group?.let { categories.add(it) }
                    currentInfo = null
                }
                trimmedLine.isNotEmpty() && currentInfo == null && isPotentialStreamUrl(trimmedLine) -> {
                    val normalizedUrl = trimmedLine.trim()
                    if (!markStreamSeen(seenStreamFingerprints, normalizedUrl)) {
                        duplicateEntries += 1
                        continue
                    }
                    val item = M3uItem(
                        name = extractFallbackName(normalizedUrl),
                        url = normalizedUrl,
                        group = "Uncategorized",
                        isLive = true
                    )
                    items.add(item)
                    categories.add("Uncategorized")
                }
                trimmedLine.isNotEmpty() -> {
                    skippedEntries += 1
                }
            }
        }
        
        return ParseResult(
            items = items,
            categories = categories,
            totalLines = totalLines,
            skippedEntries = skippedEntries,
            duplicateEntries = duplicateEntries
        )
    }

    private suspend fun parseStreamingLines(
        lines: Sequence<String>,
        onItem: suspend (M3uItem) -> Unit
    ): StreamingParseResult {
        val categories = mutableSetOf<String>()
        val seenStreamFingerprints = hashSetOf<Long>()
        var skippedEntries = 0
        var duplicateEntries = 0
        var totalLines = 0
        var itemCount = 0

        var currentInfo: String? = null

        for (line in lines) {
            totalLines += 1
            val trimmedLine = line.trim()

            when {
                trimmedLine.isEmpty() || trimmedLine.startsWith("#EXTM3U") -> Unit
                trimmedLine.startsWith("#EXTINF:") -> {
                    currentInfo = trimmedLine
                }
                trimmedLine.startsWith("#") -> Unit
                trimmedLine.isNotEmpty() && currentInfo != null -> {
                    if (!isPotentialStreamUrl(trimmedLine)) {
                        skippedEntries += 1
                        currentInfo = null
                        continue
                    }
                    val normalizedUrl = trimmedLine.trim()
                    if (!markStreamSeen(seenStreamFingerprints, normalizedUrl)) {
                        duplicateEntries += 1
                        currentInfo = null
                        continue
                    }
                    val item = parseExtInf(currentInfo, normalizedUrl)
                    onItem(item)
                    item.group?.let { categories.add(it) }
                    itemCount += 1
                    currentInfo = null
                }
                trimmedLine.isNotEmpty() && currentInfo == null && isPotentialStreamUrl(trimmedLine) -> {
                    val normalizedUrl = trimmedLine.trim()
                    if (!markStreamSeen(seenStreamFingerprints, normalizedUrl)) {
                        duplicateEntries += 1
                        continue
                    }
                    val item = M3uItem(
                        name = extractFallbackName(normalizedUrl),
                        url = normalizedUrl,
                        group = "Uncategorized",
                        isLive = true
                    )
                    onItem(item)
                    categories.add("Uncategorized")
                    itemCount += 1
                }
                trimmedLine.isNotEmpty() -> {
                    skippedEntries += 1
                }
            }
        }

        return StreamingParseResult(
            categories = categories,
            totalLines = totalLines,
            skippedEntries = skippedEntries,
            duplicateEntries = duplicateEntries,
            itemCount = itemCount
        )
    }
    
    private fun parseExtInf(extinfLine: String, url: String): M3uItem {
        val matchResult = EXTINF_PATTERN.find(extinfLine)
        
        val duration = matchResult?.groupValues?.getOrNull(1)?.toIntOrNull() ?: -1
        val restOfLine = matchResult?.groupValues?.getOrNull(2) ?: extinfLine
        
        // Extract attributes
        val attributes = mutableMapOf<String, String>()
        ATTRIBUTE_PATTERN.findAll(restOfLine).forEach { match ->
            val key = match.groupValues[1].lowercase()
            val value = match.groupValues[2]
            attributes[key] = value
        }
        
        // Extract specific attributes
        val group = GROUP_PATTERN.find(restOfLine)?.groupValues?.getOrNull(1)
        val logo = LOGO_PATTERN.find(restOfLine)?.groupValues?.getOrNull(1)
        val tvgId = TVG_ID_PATTERN.find(restOfLine)?.groupValues?.getOrNull(1)
        val tvgName = TVG_NAME_PATTERN.find(restOfLine)?.groupValues?.getOrNull(1)
        
        // Extract name (last part after comma, or after all attributes)
        val name = extractName(restOfLine)
        
        val isLive = inferIsLive(url, duration)
        
        return M3uItem(
            name = name,
            url = url,
            logo = logo?.takeIf { it.isNotEmpty() },
            group = group?.takeIf { it.isNotEmpty() },
            tvgId = tvgId?.takeIf { it.isNotEmpty() },
            tvgName = tvgName?.takeIf { it.isNotEmpty() },
            duration = duration,
            isLive = isLive,
            extras = attributes
        )
    }
    
    private fun extractName(line: String): String {
        // Find the last comma that's not inside quotes
        var inQuotes = false
        var lastCommaIndex = -1
        
        for (i in line.indices) {
            when (line[i]) {
                '"' -> inQuotes = !inQuotes
                ',' -> if (!inQuotes) lastCommaIndex = i
            }
        }
        
        return if (lastCommaIndex >= 0) {
            line.substring(lastCommaIndex + 1).trim()
        } else {
            // Try to get content after all attributes
            val withoutAttributes = line.replace(ATTRIBUTE_PATTERN, "").trim()
            withoutAttributes.trimStart(',').trim()
        }
    }

    private fun isPotentialStreamUrl(value: String): Boolean {
        val lower = value.lowercase()
        return lower.startsWith("http://") ||
            lower.startsWith("https://") ||
            lower.startsWith("rtmp://") ||
            lower.startsWith("rtsp://") ||
            lower.startsWith("udp://") ||
            lower.startsWith("rtp://") ||
            lower.startsWith("file://") ||
            lower.startsWith("/")
    }

    private fun inferIsLive(url: String, duration: Int): Boolean {
        val lower = url.substringBefore('?').lowercase()
        val vodExtensions = listOf(".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v", ".3gp")
        if (lower.contains("/movie/") || lower.contains("/vod/") || lower.contains("/series/")) {
            return false
        }
        if (vodExtensions.any { lower.endsWith(it) }) {
            return false
        }
        if (
            lower.contains("/live/") ||
            lower.endsWith(".m3u8") ||
            lower.endsWith(".ts") ||
            lower.endsWith(".mpegts") ||
            lower.startsWith("udp://") ||
            lower.startsWith("rtp://") ||
            lower.startsWith("rtmp://")
        ) {
            return true
        }
        return duration == -1
    }

    private fun markStreamSeen(seen: MutableSet<Long>, url: String): Boolean =
        seen.add(streamFingerprint(url))

    private fun streamFingerprint(value: String): Long {
        var hash = -0x340d631b7bdddcdbL
        for (char in value) {
            hash = hash xor char.code.toLong()
            hash *= 0x100000001b3L
        }
        return hash
    }

    private fun extractFallbackName(url: String): String {
        val cleaned = url.substringBefore('?').trimEnd('/')
        val segment = cleaned.substringAfterLast('/')
        val extension = segment.substringAfterLast('.', missingDelimiterValue = "")
        val withoutExtension =
            if (extension.length in 2..5 && !segment.contains(":")) {
                segment.substringBeforeLast('.')
            } else {
                segment
            }
        val candidate = withoutExtension
            .replace('-', ' ')
            .replace('_', ' ')
            .trim()
        return candidate.ifBlank { "Untitled stream" }
    }
    
    /**
     * Convert parsed M3U items to database entities
     */
    fun toChannelEntities(
        items: List<M3uItem>,
        serverId: Long,
        categoryMap: Map<String, String> = emptyMap() // group name -> categoryId
    ): List<ChannelEntity> {
        return items.filter { it.isLive }.mapIndexed { index, item ->
            val categoryName = item.group?.takeIf { it.isNotBlank() } ?: "Uncategorized"
            val categoryId = categoryMap[categoryName] ?: "${serverId}_live_${categoryName.hashCode()}"
            
            ChannelEntity(
                channelId = "${serverId}_${index}_${item.name.hashCode()}",
                serverId = serverId,
                streamId = index,
                name = item.name,
                streamUrl = item.url,
                streamIcon = item.logo,
                categoryId = categoryId,
                epgChannelId = item.tvgId,
                tvArchive = false,
                tvArchiveDuration = 0,
                isAdult = item.group?.contains("adult", ignoreCase = true) == true ||
                         item.group?.contains("xxx", ignoreCase = true) == true,
                addedAt = System.currentTimeMillis(),
                customOrder = index
            )
        }
    }
    
    fun toMovieEntities(
        items: List<M3uItem>,
        serverId: Long,
        categoryMap: Map<String, String> = emptyMap()
    ): List<MovieEntity> {
        return items.filter { !it.isLive }.mapIndexed { index, item ->
            val categoryName = item.group?.takeIf { it.isNotBlank() } ?: "Uncategorized"
            val categoryId = categoryMap[categoryName] ?: "${serverId}_movie_${categoryName.hashCode()}"
            val extension = item.url.substringAfterLast('.', "mp4").take(4)
            
            MovieEntity(
                movieId = "${serverId}_${index}_${item.name.hashCode()}",
                serverId = serverId,
                streamId = index,
                name = item.name,
                streamUrl = item.url,
                containerExtension = extension,
                streamIcon = item.logo,
                categoryId = categoryId,
                addedTimestamp = System.currentTimeMillis(),
                isAdult = item.group?.contains("adult", ignoreCase = true) == true ||
                         item.group?.contains("xxx", ignoreCase = true) == true
            )
        }
    }
    
    fun toCategoryEntities(
        categories: Set<String>,
        serverId: Long,
        type: String
    ): List<CategoryEntity> {
        return categories.mapIndexed { index, categoryName ->
            CategoryEntity(
                categoryId = "${serverId}_${categoryName.hashCode()}",
                serverId = serverId,
                originalId = categoryName.hashCode().toString(),
                name = categoryName,
                type = type,
                sortOrder = index
            )
        }
    }
}
