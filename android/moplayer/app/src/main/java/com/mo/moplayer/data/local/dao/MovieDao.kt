package com.mo.moplayer.data.local.dao

import androidx.paging.PagingSource
import androidx.room.*
import com.mo.moplayer.data.local.entity.MovieEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface MovieDao {
    
    @Query("SELECT * FROM movies WHERE serverId = :serverId ORDER BY addedTimestamp DESC, name COLLATE NOCASE ASC")
    fun getAllMovies(serverId: Long): Flow<List<MovieEntity>>
    
    @Query("SELECT * FROM movies WHERE serverId = :serverId AND categoryId = :categoryId ORDER BY addedTimestamp DESC, name COLLATE NOCASE ASC")
    fun getMoviesByCategory(serverId: Long, categoryId: String): Flow<List<MovieEntity>>
    
    // Paging queries
    @Query("SELECT * FROM movies WHERE serverId = :serverId ORDER BY addedTimestamp DESC, name COLLATE NOCASE ASC")
    fun getAllMoviesPaged(serverId: Long): PagingSource<Int, MovieEntity>
    
    @Query("SELECT * FROM movies WHERE serverId = :serverId AND categoryId = :categoryId ORDER BY addedTimestamp DESC, name COLLATE NOCASE ASC")
    fun getMoviesByCategoryPaged(serverId: Long, categoryId: String): PagingSource<Int, MovieEntity>
    
    @Query("SELECT * FROM movies WHERE movieId = :movieId")
    suspend fun getMovieById(movieId: String): MovieEntity?
    
    @Query("SELECT * FROM movies WHERE serverId = :serverId AND name LIKE '%' || :query || '%' ORDER BY name")
    fun searchMovies(serverId: Long, query: String): Flow<List<MovieEntity>>
    
    @Query("SELECT * FROM movies WHERE serverId = :serverId ORDER BY addedTimestamp DESC LIMIT :limit")
    fun getRecentlyAddedMovies(serverId: Long, limit: Int = 30): Flow<List<MovieEntity>>
    
    @Query("SELECT * FROM movies WHERE serverId = :serverId AND lastWatchedAt IS NOT NULL ORDER BY lastWatchedAt DESC LIMIT :limit")
    fun getContinueWatchingMovies(serverId: Long, limit: Int = 20): Flow<List<MovieEntity>>
    
    @Query("SELECT * FROM movies WHERE serverId = :serverId AND rating IS NOT NULL ORDER BY rating DESC LIMIT :limit")
    fun getTopRatedMovies(serverId: Long, limit: Int = 30): Flow<List<MovieEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMovies(movies: List<MovieEntity>)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMovie(movie: MovieEntity)
    
    @Update
    suspend fun updateMovie(movie: MovieEntity)
    
    @Query("UPDATE movies SET lastWatchedPosition = :position, lastWatchedAt = :timestamp WHERE movieId = :movieId")
    suspend fun updateWatchProgress(movieId: String, position: Long, timestamp: Long = System.currentTimeMillis())
    
    @Query("DELETE FROM movies WHERE serverId = :serverId")
    suspend fun deleteAllMovies(serverId: Long)
    
    @Query("SELECT COUNT(*) FROM movies WHERE serverId = :serverId")
    suspend fun getMovieCount(serverId: Long): Int

    @Query("SELECT * FROM movies WHERE serverId = :serverId ORDER BY RANDOM() LIMIT 1")
    suspend fun getRandomMovie(serverId: Long): MovieEntity?
}
