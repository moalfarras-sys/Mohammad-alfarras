package com.mo.moplayer.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "servers")
data class ServerEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val serverUrl: String,
    val username: String,
    val password: String,
    val serverType: String, // "xtream" or "m3u"
    val isActive: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val lastUsedAt: Long = System.currentTimeMillis(),
    // Server info from API
    val serverInfo: String? = null, // JSON string of server info
    val expirationDate: String? = null,
    val maxConnections: Int? = null,
    val activeConnections: Int? = null
)
