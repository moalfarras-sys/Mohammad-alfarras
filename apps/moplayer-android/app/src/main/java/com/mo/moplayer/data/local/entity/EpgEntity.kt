package com.mo.moplayer.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "epg_listings",
    foreignKeys = [
        ForeignKey(
            entity = ServerEntity::class,
            parentColumns = ["id"],
            childColumns = ["serverId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("channelId"),
        Index("serverId"),
        Index("startTime"),
        Index("endTime")
    ]
)
data class EpgEntity(
    @PrimaryKey
    val id: String,                   // channelId_startTimestamp for uniqueness
    val channelId: String,            // Maps to channel's epgChannelId or streamId
    val streamId: Int,                // The stream ID for the channel
    val serverId: Long,
    val title: String,
    val description: String? = null,
    val lang: String? = null,
    val startTime: Long,              // Unix timestamp in milliseconds
    val endTime: Long,                // Unix timestamp in milliseconds
    val lastUpdated: Long = System.currentTimeMillis()
) {
    /**
     * Check if this program is currently airing
     */
    fun isCurrentlyAiring(): Boolean {
        val now = System.currentTimeMillis()
        return now in startTime until endTime
    }
    
    /**
     * Get the progress percentage of the current program (0-100)
     */
    fun getProgressPercentage(): Int {
        val now = System.currentTimeMillis()
        if (now < startTime) return 0
        if (now >= endTime) return 100
        
        val totalDuration = endTime - startTime
        val elapsed = now - startTime
        return ((elapsed.toFloat() / totalDuration.toFloat()) * 100).toInt()
    }
    
    /**
     * Format the time range as a string (e.g., "14:30 - 15:00")
     */
    fun getTimeRangeString(): String {
        val startFormat = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault())
        val endFormat = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault())
        return "${startFormat.format(java.util.Date(startTime))} - ${endFormat.format(java.util.Date(endTime))}"
    }
    
    /**
     * Get just the start time formatted
     */
    fun getStartTimeFormatted(): String {
        val format = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault())
        return format.format(java.util.Date(startTime))
    }
}
