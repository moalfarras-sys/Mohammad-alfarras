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
    
    private fun parseLines(lines: Iterable<String>): ParseResult = parseLines(lines.asSequence())

    private fun parseLines(lines: Sequence<String>): ParseResult {
        val items = mutableListOf<M3uItem>()
        val categories = mutableSetOf<String>()
        val seenStreamUrls = hashSetOf<String>()
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
                    if (!seenStreamUrls.add(normalizedUrl)) {
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
                    if (!seenStreamUrls.add(normalizedUrl)) {
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
        
        // Determine if it's live or VOD based on URL and duration
        val isLive = duration == -1 || url.contains(".m3u8") || 
                     url.contains("/live/") || !url.matches(Regex(".*\\.(mp4|mkv|avi|mov|wmv|flv)$"))
        
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
            val categoryId = item.group?.let { categoryMap[it] ?: "${serverId}_${it.hashCode()}" }
            
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
            val categoryId = item.group?.let { categoryMap[it] ?: "${serverId}_${it.hashCode()}" }
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
