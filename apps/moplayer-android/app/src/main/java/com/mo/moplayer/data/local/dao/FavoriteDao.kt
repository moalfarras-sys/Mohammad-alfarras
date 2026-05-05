package com.mo.moplayer.data.local.dao

import androidx.room.*
import com.mo.moplayer.data.local.entity.FavoriteEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface FavoriteDao {
    
    @Query("SELECT * FROM favorites WHERE serverId = :serverId ORDER BY addedAt DESC")
    fun getAllFavorites(serverId: Long): Flow<List<FavoriteEntity>>
    
    @Query("SELECT * FROM favorites WHERE serverId = :serverId AND contentType = :contentType ORDER BY addedAt DESC")
    fun getFavoritesByType(serverId: Long, contentType: String): Flow<List<FavoriteEntity>>
    
    @Query("SELECT * FROM favorites WHERE contentId = :contentId AND serverId = :serverId LIMIT 1")
    suspend fun getFavorite(serverId: Long, contentId: String): FavoriteEntity?

    @Query("SELECT * FROM favorites WHERE id = :favoriteId LIMIT 1")
    suspend fun getFavoriteById(favoriteId: Long): FavoriteEntity?
    
    @Query("SELECT EXISTS(SELECT 1 FROM favorites WHERE contentId = :contentId AND serverId = :serverId)")
    fun isFavorite(serverId: Long, contentId: String): Flow<Boolean>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addFavorite(favorite: FavoriteEntity)
    
    @Query("DELETE FROM favorites WHERE contentId = :contentId AND serverId = :serverId")
    suspend fun removeFavorite(serverId: Long, contentId: String)
    
    @Query("DELETE FROM favorites WHERE serverId = :serverId")
    suspend fun deleteAllFavorites(serverId: Long)

    @Query(
        """
        SELECT * FROM favorites
        WHERE serverId = :serverId
          AND name LIKE '%' || :query || '%'
        ORDER BY addedAt DESC
        LIMIT :limit
        """
    )
    suspend fun searchFavorites(serverId: Long, query: String, limit: Int = 50): List<FavoriteEntity>
}
