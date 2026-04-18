package com.mo.moplayer.data.local.dao

import androidx.room.*
import com.mo.moplayer.data.local.entity.CategoryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CategoryDao {
    
    @Query("SELECT * FROM categories WHERE serverId = :serverId AND type = :type ORDER BY sortOrder")
    fun getCategoriesByType(serverId: Long, type: String): Flow<List<CategoryEntity>>
    
    @Query("SELECT * FROM categories WHERE serverId = :serverId ORDER BY type, sortOrder")
    fun getAllCategories(serverId: Long): Flow<List<CategoryEntity>>
    
    @Query("SELECT * FROM categories WHERE categoryId = :categoryId")
    suspend fun getCategoryById(categoryId: String): CategoryEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCategories(categories: List<CategoryEntity>)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCategory(category: CategoryEntity)
    
    @Query("DELETE FROM categories WHERE serverId = :serverId AND type = :type")
    suspend fun deleteCategoriesByType(serverId: Long, type: String)
    
    @Query("DELETE FROM categories WHERE serverId = :serverId")
    suspend fun deleteAllCategories(serverId: Long)
    
    @Query("SELECT COUNT(*) FROM categories WHERE serverId = :serverId")
    suspend fun getCategoryCount(serverId: Long): Int
    
    @Query("SELECT COUNT(*) FROM categories WHERE serverId = :serverId AND type = :type")
    suspend fun getCategoryCountByType(serverId: Long, type: String): Int
}
