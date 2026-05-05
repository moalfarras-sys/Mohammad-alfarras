package com.mo.moplayer.util

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Content recommendation engine for personalized suggestions.
 * Uses watch history, favorites, and content metadata for recommendations.
 */
@Singleton
class ContentRecommendationEngine @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    companion object {
        private const val MAX_RECOMMENDATIONS = 20
        private const val GENRE_WEIGHT = 3
        private const val ACTOR_WEIGHT = 2
        private const val DIRECTOR_WEIGHT = 2
        private const val YEAR_WEIGHT = 1
    }
    
    private val _recommendations = MutableStateFlow<List<ContentRecommendation>>(emptyList())
    val recommendations: Flow<List<ContentRecommendation>> = _recommendations.asStateFlow()
    
    /**
     * Generate recommendations based on user preferences
     */
    fun generateRecommendations(
        watchHistory: List<WatchedContent>,
        favorites: List<FavoriteContent>,
        allContent: List<ContentMetadata>
    ): List<ContentRecommendation> {
        // Build user preference profile
        val genreScores = mutableMapOf<String, Int>()
        val actorScores = mutableMapOf<String, Int>()
        val directorScores = mutableMapOf<String, Int>()
        val yearRange = mutableListOf<Int>()
        
        // Analyze watch history
        watchHistory.forEach { watched ->
            watched.genres.forEach { genre ->
                genreScores[genre] = (genreScores[genre] ?: 0) + (watched.progress * GENRE_WEIGHT).toInt()
            }
            watched.actors.forEach { actor ->
                actorScores[actor] = (actorScores[actor] ?: 0) + ACTOR_WEIGHT
            }
            watched.director?.let { dir ->
                directorScores[dir] = (directorScores[dir] ?: 0) + DIRECTOR_WEIGHT
            }
            watched.year?.let { yearRange.add(it) }
        }
        
        // Boost from favorites
        favorites.forEach { fav ->
            fav.genres.forEach { genre ->
                genreScores[genre] = (genreScores[genre] ?: 0) + GENRE_WEIGHT * 2
            }
            fav.actors.forEach { actor ->
                actorScores[actor] = (actorScores[actor] ?: 0) + ACTOR_WEIGHT * 2
            }
        }
        
        // Already watched or favorited content IDs
        val excludeIds = (watchHistory.map { it.id } + favorites.map { it.id }).toSet()
        
        // Score each content
        val scored = allContent
            .filter { it.id !in excludeIds }
            .map { content ->
                var score = 0
                
                // Genre matching
                content.genres.forEach { genre ->
                    score += genreScores[genre] ?: 0
                }
                
                // Actor matching
                content.actors.forEach { actor ->
                    score += actorScores[actor] ?: 0
                }
                
                // Director matching
                content.director?.let { dir ->
                    score += directorScores[dir] ?: 0
                }
                
                // Year proximity bonus
                content.year?.let { year ->
                    if (yearRange.isNotEmpty()) {
                        val avgYear = yearRange.average().toInt()
                        val proximity = 10 - minOf(kotlin.math.abs(year - avgYear), 10)
                        score += proximity * YEAR_WEIGHT
                    }
                }
                
                // Rating bonus
                content.rating?.let { rating ->
                    score += (rating * 2).toInt()
                }
                
                ContentRecommendation(
                    content = content,
                    score = score,
                    reasons = buildReasons(content, genreScores, actorScores)
                )
            }
            .filter { it.score > 0 }
            .sortedByDescending { it.score }
            .take(MAX_RECOMMENDATIONS)
        
        _recommendations.value = scored
        return scored
    }
    
    /**
     * Build human-readable reasons for recommendation
     */
    private fun buildReasons(
        content: ContentMetadata,
        genreScores: Map<String, Int>,
        actorScores: Map<String, Int>
    ): List<String> {
        val reasons = mutableListOf<String>()
        
        // Top matching genres
        content.genres
            .filter { genreScores.containsKey(it) }
            .sortedByDescending { genreScores[it] }
            .take(2)
            .forEach { reasons.add("You like $it") }
        
        // Matching actors
        content.actors
            .filter { actorScores.containsKey(it) }
            .take(1)
            .forEach { reasons.add("Features $it") }
        
        // High rating
        content.rating?.let { rating ->
            if (rating >= 8.0) {
                reasons.add("Highly rated")
            }
        }
        
        return reasons.take(3)
    }
    
    /**
     * Get "Because you watched" recommendations
     */
    fun getBecauseYouWatched(
        watchedContent: WatchedContent,
        allContent: List<ContentMetadata>,
        limit: Int = 10
    ): List<ContentMetadata> {
        return allContent
            .filter { it.id != watchedContent.id }
            .filter { content ->
                content.genres.any { it in watchedContent.genres } ||
                content.director == watchedContent.director ||
                content.actors.any { it in watchedContent.actors }
            }
            .sortedByDescending { content ->
                var score = 0
                content.genres.forEach { if (it in watchedContent.genres) score += 3 }
                if (content.director == watchedContent.director) score += 5
                content.actors.forEach { if (it in watchedContent.actors) score += 2 }
                score
            }
            .take(limit)
    }
    
    // Data classes
    data class WatchedContent(
        val id: String,
        val title: String,
        val genres: List<String>,
        val actors: List<String>,
        val director: String?,
        val year: Int?,
        val progress: Float // 0-1
    )
    
    data class FavoriteContent(
        val id: String,
        val title: String,
        val genres: List<String>,
        val actors: List<String>
    )
    
    data class ContentMetadata(
        val id: String,
        val title: String,
        val posterUrl: String?,
        val genres: List<String>,
        val actors: List<String>,
        val director: String?,
        val year: Int?,
        val rating: Double?
    )
    
    data class ContentRecommendation(
        val content: ContentMetadata,
        val score: Int,
        val reasons: List<String>
    )
}
