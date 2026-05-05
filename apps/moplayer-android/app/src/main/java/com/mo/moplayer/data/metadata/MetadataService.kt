package com.mo.moplayer.data.metadata

import com.mo.moplayer.BuildConfig
import com.mo.moplayer.data.repository.IptvRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MetadataService @Inject constructor(
    private val repository: IptvRepository
) {
    val hasTmdbKey: Boolean
        get() = BuildConfig.TMDB_API_KEY.isNotBlank()

    val hasTvdbKey: Boolean
        get() = BuildConfig.TVDB_API_KEY.isNotBlank()

    suspend fun enrichMovie(movieId: String): MetadataPayload? {
        val movie = repository.getMovieById(movieId) ?: return null
        return MetadataPayload(
            title = movie.name,
            overview = movie.plot,
            rating = movie.rating,
            genre = movie.genre,
            year = movie.year ?: movie.releaseDate,
            duration = movie.duration
        )
    }

    suspend fun enrichSeries(seriesId: String): MetadataPayload? {
        val series = repository.getSeriesById(seriesId) ?: return null
        return MetadataPayload(
            title = series.name,
            overview = series.plot,
            rating = series.rating,
            genre = series.genre,
            year = series.releaseDate,
            duration = null
        )
    }
}

data class MetadataPayload(
    val title: String,
    val overview: String? = null,
    val rating: Double? = null,
    val genre: String? = null,
    val year: String? = null,
    val duration: String? = null
)
