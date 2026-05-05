package com.mo.moplayer.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.mo.moplayer.data.local.entity.ContentSearchEntity

@Dao
interface ContentSearchDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(items: List<ContentSearchEntity>)

    @Query("DELETE FROM content_search_index WHERE serverId = :serverId")
    suspend fun deleteByServer(serverId: Long)

    @Query("DELETE FROM content_search_index WHERE serverId = :serverId AND contentType = :contentType")
    suspend fun deleteByType(serverId: Long, contentType: String)

    @Query(
        """
        SELECT * FROM content_search_index
        WHERE serverId = :serverId
          AND content_search_index MATCH :ftsQuery
        ORDER BY title COLLATE NOCASE
        LIMIT :limit
        """
    )
    suspend fun searchFtsByServer(
        serverId: Long,
        ftsQuery: String,
        limit: Int
    ): List<ContentSearchEntity>

    @Query(
        """
        SELECT * FROM content_search_index
        WHERE serverId = :serverId
          AND title LIKE '%' || :query || '%'
        ORDER BY title COLLATE NOCASE
        LIMIT :limit
        """
    )
    suspend fun searchLikeByServer(
        serverId: Long,
        query: String,
        limit: Int
    ): List<ContentSearchEntity>

    @Query("SELECT COUNT(*) FROM content_search_index WHERE serverId = :serverId")
    suspend fun countByServer(serverId: Long): Int
}
