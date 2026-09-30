package com.moalfarras.moplayer.core

import com.moalfarras.moplayer.data.network.WebApiEndpoint
import java.util.Locale

private val PLAYLIST_SCRIPTS = setOf("get.php", "playlist.php", "player_api.php")

/**
 * Whether a link opened in MoPlayer Pro may be imported as a playlist. It mirrors the manifest's
 * VIEW filters (which only claim m3u/m3u8 schemes and playlist-looking web paths) and also guards
 * explicit intents that bypass them: ordinary web pages and MoPlayer's own site (for example the
 * APK download link) are never imported as a source. Parsing is lenient on purpose: panel links
 * often carry characters that strict URI parsers reject.
 */
fun isImportablePlaylistLink(raw: String, ownHosts: Set<String> = ownWebHosts()): Boolean {
    val link = raw.trim()
    return when (link.substringBefore(':', missingDelimiterValue = "").lowercase(Locale.US)) {
        "m3u", "m3u8" -> true
        "http", "https" -> {
            val rest = link.substringAfter("://", missingDelimiterValue = "")
            val authorityEnd = rest.indexOfAny(charArrayOf('/', '?', '#')).let { if (it < 0) rest.length else it }
            val host = rest.substring(0, authorityEnd).substringAfterLast('@').substringBefore(':').lowercase(Locale.US)
            val path = rest.substring(authorityEnd).substringBefore('?').substringBefore('#').lowercase(Locale.US)
            host.isNotBlank() &&
                host !in ownHosts &&
                (path.endsWith(".m3u") || path.endsWith(".m3u8") || path.substringAfterLast('/') in PLAYLIST_SCRIPTS)
        }
        else -> false
    }
}

private fun ownWebHosts(): Set<String> =
    WebApiEndpoint.candidateUrls("/").mapTo(mutableSetOf()) { url ->
        url.substringAfter("://").substringBefore('/').substringBefore(':').lowercase(Locale.US)
    }
