package com.mo.moplayer.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Fts4
import androidx.room.PrimaryKey

@Fts4
@Entity(tableName = "content_search_index")
data class ContentSearchEntity(
    @PrimaryKey
    @ColumnInfo(name = "rowid")
    val rowId: Long? = null,
    val uniqueId: String, // serverId:type:contentId
    val serverId: Long,
    val contentId: String,
    val contentType: String, // channel, movie, series, episode
    val title: String,
    val subtitle: String? = null,
    val posterUrl: String? = null
)
