package com.moalfarras.moplayer.ui.player

import android.app.AlertDialog
import android.content.Context
import com.moalfarras.moplayer.ui.i18n.PlayerStrings

/**
 * Audio, subtitle or video track picker for the LibVLC engine, the counterpart of Media3's
 * TrackSelectionDialogBuilder (same platform dialog, so D-pad and touch behave the same).
 * [onEmpty] runs when there is nothing to choose.
 */
internal fun showLibVlcTrackDialog(
    context: Context,
    title: String,
    trackType: Int,
    controller: LibVlcController,
    strings: PlayerStrings,
    onEmpty: () -> Unit,
) {
    controller.loadTracks(trackType) { tracks, selectedId ->
        val choosable = tracks.any { it.id >= 0 }
        if (!choosable) {
            onEmpty()
            return@loadTracks
        }
        val labels = tracks.map { track ->
            when {
                track.id < 0 -> strings.trackOff
                track.name.isBlank() -> "#${track.id}"
                else -> track.name
            }
        }.toTypedArray()
        val checked = tracks.indexOfFirst { it.id == selectedId }
        runCatching {
            AlertDialog.Builder(context)
                .setTitle(title)
                .setSingleChoiceItems(labels, checked) { dialog, which ->
                    tracks.getOrNull(which)?.let { controller.selectTrack(trackType, it.id) }
                    dialog.dismiss()
                }
                .show()
        }
    }
}
