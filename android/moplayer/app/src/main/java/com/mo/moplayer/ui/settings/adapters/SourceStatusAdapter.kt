package com.mo.moplayer.ui.settings.adapters

import android.text.format.DateUtils
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.mo.moplayer.R
import com.mo.moplayer.ui.settings.SourceStatusItem
import java.util.Locale

class SourceStatusAdapter(
    private val onSwitchSource: (SourceStatusItem) -> Unit,
    private val onRemoveSource: (SourceStatusItem) -> Unit
) : RecyclerView.Adapter<SourceStatusAdapter.SourceViewHolder>() {

    private val items = mutableListOf<SourceStatusItem>()

    fun submitList(nextItems: List<SourceStatusItem>) {
        items.clear()
        items.addAll(nextItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SourceViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_source_status, parent, false)
        return SourceViewHolder(view)
    }

    override fun getItemCount(): Int = items.size

    override fun onBindViewHolder(holder: SourceViewHolder, position: Int) {
        holder.bind(items[position])
    }

    inner class SourceViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val title: TextView = itemView.findViewById(R.id.tvSourceName)
        private val type: TextView = itemView.findViewById(R.id.tvSourceType)
        private val endpoint: TextView = itemView.findViewById(R.id.tvSourceEndpoint)
        private val status: TextView = itemView.findViewById(R.id.tvSourceStatus)
        private val counts: TextView = itemView.findViewById(R.id.tvSourceCounts)
        private val lastRefresh: TextView = itemView.findViewById(R.id.tvSourceLastRefresh)
        private val expiry: TextView = itemView.findViewById(R.id.tvSourceExpiry)
        private val switchButton: Button = itemView.findViewById(R.id.btnSourceSwitch)
        private val removeButton: Button = itemView.findViewById(R.id.btnSourceRemove)

        fun bind(item: SourceStatusItem) {
            val context = itemView.context
            title.text = item.name.ifBlank { context.getString(R.string.source_unnamed) }
            type.text = item.type.uppercase(Locale.US)
            endpoint.text = item.endpoint
            status.text = buildStatusText(item)
            counts.text = context.getString(
                R.string.source_counts_format,
                item.channels,
                item.movies,
                item.series,
                item.categories
            )
            lastRefresh.text = buildLastRefreshText(item)
            expiry.text = buildExpiryText(item)
            expiry.visibility = if (expiry.text.isNullOrBlank()) View.GONE else View.VISIBLE

            switchButton.text = if (item.isActive) {
                context.getString(R.string.source_active)
            } else {
                context.getString(R.string.source_switch)
            }
            switchButton.isEnabled = !item.isActive
            switchButton.alpha = if (item.isActive) 0.65f else 1f

            itemView.isSelected = item.isActive
            itemView.setOnClickListener {
                if (!item.isActive) onSwitchSource(item)
            }
            switchButton.setOnClickListener {
                if (!item.isActive) onSwitchSource(item)
            }
            removeButton.setOnClickListener {
                onRemoveSource(item)
            }
        }

        private fun buildStatusText(item: SourceStatusItem): String {
            val context = itemView.context
            val state = item.syncState ?: return context.getString(R.string.source_status_idle)
            val statusLabel = when (state.lastStatus.uppercase(Locale.US)) {
                "SUCCESS" -> context.getString(R.string.source_status_success)
                "RUNNING" -> context.getString(R.string.source_status_running)
                "ERROR" -> context.getString(R.string.source_status_error)
                else -> context.getString(R.string.source_status_idle)
            }
            return if (state.lastError.isNullOrBlank()) {
                statusLabel
            } else {
                "$statusLabel - ${state.lastError.take(80)}"
            }
        }

        private fun buildLastRefreshText(item: SourceStatusItem): String {
            val context = itemView.context
            val lastSyncAt = item.syncState?.lastSyncAt ?: return context.getString(R.string.source_never_refreshed)
            val relative = DateUtils.getRelativeTimeSpanString(
                lastSyncAt,
                System.currentTimeMillis(),
                DateUtils.MINUTE_IN_MILLIS,
                DateUtils.FORMAT_ABBREV_RELATIVE
            )
            return context.getString(R.string.source_last_refresh_format, relative)
        }

        private fun buildExpiryText(item: SourceStatusItem): String {
            val context = itemView.context
            val expiryText = item.expirationDate?.takeIf { it.isNotBlank() }?.let {
                context.getString(R.string.source_expiry_format, it)
            }
            val connectionText = when {
                item.activeConnections != null && item.maxConnections != null ->
                    context.getString(R.string.source_connections_format, item.activeConnections, item.maxConnections)
                item.maxConnections != null ->
                    context.getString(R.string.source_max_connections_format, item.maxConnections)
                else -> null
            }
            return listOfNotNull(expiryText, connectionText).joinToString("  -  ")
        }
    }
}
