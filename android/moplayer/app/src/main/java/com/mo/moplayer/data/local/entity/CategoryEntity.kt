package com.mo.moplayer.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "categories",
    foreignKeys = [
        ForeignKey(
            entity = ServerEntity::class,
            parentColumns = ["id"],
            childColumns = ["serverId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("serverId")]
)
data class CategoryEntity(
    @PrimaryKey
    val categoryId: String, // Combined serverId_categoryId for uniqueness
    val serverId: Long,
    val originalId: String, // Original category ID from API
    val name: String,
    val type: String, // "live", "movie", "series"
    val parentId: String? = null,
    val sortOrder: Int = 0
)
