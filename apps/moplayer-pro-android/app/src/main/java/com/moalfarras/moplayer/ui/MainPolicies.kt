package com.moalfarras.moplayer.ui

import com.moalfarras.moplayer.data.repository.LiveZapScope
import com.moalfarras.moplayer.data.repository.SyncErrorKind
import com.moalfarras.moplayer.data.repository.SyncException
import com.moalfarras.moplayer.data.repository.isTransientActivationFailure
import com.moalfarras.moplayer.domain.model.MediaItem
import com.moalfarras.moplayer.domain.model.ServerProfile
import com.moalfarras.moplayer.ui.i18n.AppStrings
import java.net.URI
import java.security.MessageDigest

// Pure decisions of MainViewModel and MainActivity, kept here so they can be unit tested.

/**
 * The list CH+/CH- walks in the player, chosen from where the viewer started the channel:
 * the selected Live group (or every channel when "All" is selected), the live favorites, the
 * committed search results, or otherwise (Home shelves, auto-play) the channel's own group.
 */
internal fun liveZapScopeFor(origin: AppSection, selectedCategoryId: String, searchQuery: String, item: MediaItem): LiveZapScope = when {
    origin == AppSection.LIVE && selectedCategoryId.isNotBlank() -> LiveZapScope.Category(selectedCategoryId)
    origin == AppSection.LIVE -> LiveZapScope.AllChannels
    origin == AppSection.FAVORITES -> LiveZapScope.Favorites
    origin == AppSection.SEARCH && searchQuery.trim().length >= 2 -> LiveZapScope.Search(searchQuery.trim())
    item.categoryId.isNotBlank() -> LiveZapScope.Category(item.categoryId)
    else -> LiveZapScope.AllChannels
}

/** Zap lists up to this size are loaded whole. */
internal const val ZAP_FULL_LIST_SIZE = 1_500

/** Channels loaded on each side of the playing one when a list is bigger than [ZAP_FULL_LIST_SIZE]. */
internal const val ZAP_WINDOW_RADIUS = 300

/** The window grows (or moves) when the playing channel gets this close to one of its ends. */
internal const val ZAP_WINDOW_MARGIN = 100

/** Largest window kept in memory; past it the window moves instead of growing. */
internal const val ZAP_MAX_WINDOW = 3_000

/**
 * Rows of a circular zap list that are loaded: [length] entries starting at [start], wrapping
 * past the end, so CH+ on the last channel still reaches the first when the whole list is loaded.
 */
internal data class ZapWindow(val start: Int, val length: Int) {
    fun indices(size: Int): List<Int> = List(length.coerceAtMost(size)) { offset -> (start + offset).floorMod(size) }

    fun positionOf(index: Int, size: Int): Int = (index - start).floorMod(size)
}

/**
 * Window for a zap list of [size] channels while the channel at [index] plays. Small lists load
 * whole. Big lists load [ZAP_WINDOW_RADIUS] channels on each side; when zapping gets within
 * [ZAP_WINDOW_MARGIN] of an end, the window grows (up to [ZAP_MAX_WINDOW]) around the channel.
 * Returns [current] unchanged while it still has room on both sides.
 */
internal fun zapWindowFor(size: Int, index: Int, current: ZapWindow?): ZapWindow {
    if (size <= 0) return ZapWindow(0, 0)
    val whole = ZapWindow(0, size)
    if (size <= ZAP_FULL_LIST_SIZE || (current != null && current.length >= size)) return whole
    val position = current?.positionOf(index, size)
    if (current != null && position != null && position < current.length &&
        position >= ZAP_WINDOW_MARGIN && position < current.length - ZAP_WINDOW_MARGIN
    ) {
        return current
    }
    val inside = current != null && position != null && position < current.length
    val wanted = if (inside) current!!.length + 2 * ZAP_WINDOW_RADIUS else 2 * ZAP_WINDOW_RADIUS + 1
    val length = wanted.coerceAtMost(ZAP_MAX_WINDOW)
    if (length >= size) return whole
    return ZapWindow((index - length / 2).floorMod(size), length)
}

private fun Int.floorMod(size: Int): Int = ((this % size) + size) % size

/**
 * Slows down guessing of the family-lock PIN: after [maxFailures] wrong entries in a row, entry is
 * blocked for [baseLockoutMs], doubling for each further lockout up to [maxLockoutMs]. A correct
 * PIN resets it. Times are SystemClock.elapsedRealtime() values supplied by the caller.
 */
internal class PinAttemptThrottle(
    private val maxFailures: Int = 5,
    private val baseLockoutMs: Long = 30_000L,
    private val maxLockoutMs: Long = 5 * 60_000L,
) {
    private var failures = 0
    private var lockouts = 0
    private var lockedUntil = 0L

    fun remainingLockMs(nowMs: Long): Long = (lockedUntil - nowMs).coerceAtLeast(0L)

    /** Records a wrong PIN; returns the lockout that now applies (0 while tries remain). */
    fun recordFailure(nowMs: Long): Long {
        failures += 1
        if (failures >= maxFailures) {
            val lockout = (baseLockoutMs shl lockouts.coerceAtMost(8)).coerceAtMost(maxLockoutMs)
            lockedUntil = nowMs + lockout
            lockouts += 1
            failures = 0
        }
        return remainingLockMs(nowMs)
    }

    fun recordSuccess() {
        failures = 0
        lockouts = 0
        lockedUntil = 0L
    }
}

/** Whole seconds of a lockout for display, never 0 while locked. */
internal fun lockoutSeconds(remainingMs: Long): Long = (remainingMs + 999L) / 1000L

/**
 * A playlist link in the launch intent is offered once: not again when the activity is recreated
 * (saved state present) or reopened from Recents, where Android replays the original intent.
 */
internal fun shouldHandleLaunchIntent(restoredFromSavedState: Boolean, launchedFromHistory: Boolean): Boolean =
    !restoredFromSavedState && !launchedFromHistory

/** De-duplication key of an incoming playlist link; a hash, so the credentials in it are never kept as text. */
internal fun incomingPlaylistKey(url: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(url.trim().toByteArray(Charsets.UTF_8))
    return digest.take(12).joinToString("") { "%02x".format(it) }
}

/** The host of a playlist link for the confirmation dialog; never the path or query (they carry credentials). */
internal fun playlistHostLabel(url: String): String {
    val trimmed = url.trim()
    val parsed = runCatching { URI(trimmed).host }.getOrNull()
    if (!parsed.isNullOrBlank()) return parsed
    return trimmed.substringAfter("://", trimmed)
        .substringBefore('/')
        .substringBefore('?')
        .substringBefore('#')
        .substringAfterLast('@')
        .substringBefore(':')
}

/**
 * Identity of an expired-subscription prompt: the account plus what the provider reported, so a
 * renewal followed by a new expiry (another date) asks again.
 */
internal fun subscriptionPromptKey(server: ServerProfile): String =
    "${server.sourceKey.ifBlank { "id:${server.id}" }}|${server.accountStatus.trim().lowercase()}|${server.expiryDate}"

/** "Later" postpones the prompt for a day; after that an account that is still expired is shown again. */
internal const val SUBSCRIPTION_PROMPT_SNOOZE_MS = 24L * 60L * 60L * 1000L

internal fun subscriptionPromptSnoozed(snoozedAt: Long?, nowMs: Long): Boolean =
    snoozedAt != null && nowMs - snoozedAt in 0 until SUBSCRIPTION_PROMPT_SNOOZE_MS

/**
 * An activation import that retrying the same source cannot fix: the provider rejected the
 * account, the address is not an IPTV API or playlist, or the link itself is malformed.
 */
internal fun isFinalActivationImportFailure(failure: Throwable): Boolean = when (failure) {
    is SyncException -> failure.kind.isAccountRejection ||
        failure.kind == SyncErrorKind.NOT_IPTV_API ||
        failure.kind == SyncErrorKind.INVALID_PLAYLIST
    is IllegalArgumentException -> true
    else -> false
}

/** Stable, non-sensitive code sent to the website with a failed import (never a URL or credentials). */
internal fun activationAckCode(failure: Throwable): String = (failure as? SyncException)?.ackCode ?: "import_failed"

/** Why an activation import failed, in the viewer's language (the provider-specific sync message when there is one). */
internal fun activationImportReason(failure: Throwable, strings: AppStrings): String = when {
    failure is SyncException -> failure.message
    failure is IllegalArgumentException && !failure.message.isNullOrBlank() -> failure.message.orEmpty()
    else -> strings.activationImportGeneric
}

/** Message for a failure of the moalfarras.space activation service itself (not of the provider). */
internal fun activationServiceMessage(failure: Throwable, strings: AppStrings): String =
    if (isTransientActivationFailure(failure)) strings.activationServiceUnavailable else strings.activationCreateFailed

/** A background refresh failed; the saved library stays usable. Typed sync errors keep their explanation. */
internal fun backgroundRefreshMessage(failure: Throwable, strings: AppStrings): String =
    if (failure is SyncException) strings.backgroundRefreshFailed(failure.message) else strings.backgroundRefreshRetryLater

/**
 * Text for a failure shown to the viewer: typed sync errors and localized argument checks keep
 * their message; anything else (raw technical text) is replaced by [fallback].
 */
internal fun Throwable.userMessage(fallback: String): String = when (this) {
    is SyncException -> message
    is IllegalArgumentException -> message?.takeIf { it.isNotBlank() } ?: fallback
    else -> fallback
}

/** Sections a series detail page can be opened from (and returns to on Back). */
private val seriesOrigins = setOf(AppSection.HOME, AppSection.SERIES, AppSection.FAVORITES, AppSection.SEARCH)

/**
 * Where Back from a series detail page returns: the section it was opened from, or, when it was
 * opened from the player (episode round trip) or a section without series, the previous origin.
 */
internal fun seriesOriginFor(current: AppSection, returnSection: AppSection, previousOrigin: AppSection): AppSection {
    val candidate = if (current == AppSection.PLAYER) returnSection else current
    return if (candidate in seriesOrigins) candidate else previousOrigin
}
