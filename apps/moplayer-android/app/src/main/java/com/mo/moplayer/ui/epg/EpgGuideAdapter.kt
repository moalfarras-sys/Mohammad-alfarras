package com.mo.moplayer.ui.epg

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.mo.moplayer.R
import com.mo.moplayer.databinding.ItemEpgGuideRowBinding

/**
 * Channel rows for the program guide. Each row is a fixed channel cell (number, logo,
 * name) plus a Canvas-drawn [EpgProgramRowView] for the programs. The horizontal time
 * cursor lives in the activity and is pushed in through [applyState]; rows themselves are
 * the only focusable views, so up/down moves between channels via normal focus while the
 * activity handles left/right time movement.
 */
class EpgGuideAdapter(
    private val onRowFocused: (Int) -> Unit,
    private val onRowSelected: (Int) -> Unit
) : RecyclerView.Adapter<EpgGuideAdapter.VH>() {

    private val rows = ArrayList<EpgGuideRow>()
    private var axis: GuideTimeAxis? = null
    private var focusedChannelIndex = 0
    private var focusedProgramStartMs = Long.MIN_VALUE
    private var recyclerView: RecyclerView? = null

    override fun onAttachedToRecyclerView(rv: RecyclerView) { recyclerView = rv }
    override fun onDetachedFromRecyclerView(rv: RecyclerView) { recyclerView = null }

    fun rowAt(index: Int): EpgGuideRow? = rows.getOrNull(index)

    /** Replace data. If the channel set is unchanged (EPG just filled in) only the
     *  Canvas strips refresh, so logos don't reload and focus is preserved. */
    fun submitRows(newRows: List<EpgGuideRow>) {
        val sameChannels = newRows.size == rows.size &&
            newRows.indices.all { newRows[it].channel.channelId == rows[it].channel.channelId }
        rows.clear()
        rows.addAll(newRows)
        if (sameChannels && recyclerView != null) refreshVisibleStrips() else notifyDataSetChanged()
    }

    fun applyState(axis: GuideTimeAxis, focusedChannelIndex: Int, focusedProgramStartMs: Long) {
        this.axis = axis
        this.focusedChannelIndex = focusedChannelIndex
        this.focusedProgramStartMs = focusedProgramStartMs
        refreshVisibleStrips()
    }

    private fun refreshVisibleStrips() {
        val rv = recyclerView ?: return
        val a = axis ?: return
        for (i in 0 until rv.childCount) {
            val child = rv.getChildAt(i)
            val holder = rv.getChildViewHolder(child) as? VH ?: continue
            val pos = holder.bindingAdapterPosition
            if (pos == RecyclerView.NO_POSITION) continue
            holder.binding.programStrip.updateAxis(a, pos == focusedChannelIndex, focusedProgramStartMs)
            holder.binding.epgRowRoot.isSelected = pos == focusedChannelIndex
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val b = ItemEpgGuideRowBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        val vh = VH(b)
        b.epgRowRoot.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                val pos = vh.bindingAdapterPosition
                if (pos != RecyclerView.NO_POSITION) onRowFocused(pos)
            }
        }
        b.epgRowRoot.setOnClickListener {
            val pos = vh.bindingAdapterPosition
            if (pos != RecyclerView.NO_POSITION) onRowSelected(pos)
        }
        return vh
    }

    override fun getItemCount(): Int = rows.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val row = rows[position]
        val ch = row.channel
        val number = if (ch.customOrder > 0) ch.customOrder else position + 1
        holder.binding.tvChannelNumber.text = number.toString()
        holder.binding.tvChannelName.text = ch.name

        val logo = ch.streamIcon
        if (!logo.isNullOrBlank()) {
            Glide.with(holder.binding.ivChannelLogo)
                .load(logo)
                .placeholder(R.drawable.ic_placeholder_channel)
                .error(R.drawable.ic_placeholder_channel)
                .into(holder.binding.ivChannelLogo)
        } else {
            holder.binding.ivChannelLogo.setImageResource(R.drawable.ic_placeholder_channel)
        }

        axis?.let {
            holder.binding.programStrip.bind(
                row, it, position == focusedChannelIndex, focusedProgramStartMs
            )
        }
        holder.binding.epgRowRoot.isSelected = position == focusedChannelIndex
    }

    override fun onViewRecycled(holder: VH) {
        Glide.with(holder.binding.ivChannelLogo).clear(holder.binding.ivChannelLogo)
    }

    class VH(val binding: ItemEpgGuideRowBinding) : RecyclerView.ViewHolder(binding.root)
}
