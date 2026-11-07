package com.mo.moplayer.ui.player.engine

import androidx.media3.common.TrackSelectionOverride
import androidx.media3.common.Tracks
import androidx.media3.common.util.UnstableApi

/** Menu indices flatten every track, including multiple tracks inside one group. */
@UnstableApi
internal fun trackOverrideAt(tracks: Tracks, trackType: Int, index: Int): TrackSelectionOverride? {
    if (index < 0) return null
    var remaining = index
    for (group in tracks.groups) {
        if (group.type != trackType) continue
        if (remaining < group.length) return TrackSelectionOverride(group.mediaTrackGroup, listOf(remaining))
        remaining -= group.length
    }
    return null
}
