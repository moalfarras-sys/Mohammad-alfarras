package com.mo.moplayer.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Xtream Codes API Response DTOs
 */

// Authentication Response
data class AuthResponse(
    @SerializedName("user_info")
    val userInfo: UserInfo?,
    @SerializedName("server_info")
    val serverInfo: ServerInfo?
)

data class UserInfo(
    @SerializedName("username")
    val username: String?,
    @SerializedName("password")
    val password: String?,
    @SerializedName("message")
    val message: String?,
    @SerializedName("auth")
    val auth: Int?,
    @SerializedName("status")
    val status: String?,
    @SerializedName("exp_date")
    val expDate: String?,
    @SerializedName("is_trial")
    val isTrial: String?,
    @SerializedName("active_cons")
    val activeConnections: String?,
    @SerializedName("created_at")
    val createdAt: String?,
    @SerializedName("max_connections")
    val maxConnections: String?,
    @SerializedName("allowed_output_formats")
    val allowedOutputFormats: List<String>?
)

data class ServerInfo(
    @SerializedName("url")
    val url: String?,
    @SerializedName("port")
    val port: String?,
    @SerializedName("https_port")
    val httpsPort: String?,
    @SerializedName("server_protocol")
    val serverProtocol: String?,
    @SerializedName("rtmp_port")
    val rtmpPort: String?,
    @SerializedName("timezone")
    val timezone: String?,
    @SerializedName("timestamp_now")
    val timestampNow: Long?,
    @SerializedName("time_now")
    val timeNow: String?
)

// Category DTO
data class CategoryDto(
    @SerializedName("category_id")
    val categoryId: String?,
    @SerializedName("category_name")
    val categoryName: String?,
    @SerializedName("parent_id")
    val parentId: Int?
)

// Live Stream DTO
data class LiveStreamDto(
    @SerializedName("num")
    val num: Int?,
    @SerializedName("name")
    val name: String?,
    @SerializedName("stream_type")
    val streamType: String?,
    @SerializedName("stream_id")
    val streamId: Int?,
    @SerializedName("stream_icon")
    val streamIcon: String?,
    @SerializedName("epg_channel_id")
    val epgChannelId: String?,
    @SerializedName("added")
    val added: String?,
    @SerializedName("is_adult")
    val isAdult: String?,
    @SerializedName("category_id")
    val categoryId: String?,
    @SerializedName("custom_sid")
    val customSid: String?,
    @SerializedName("tv_archive")
    val tvArchive: Int?,
    @SerializedName("direct_source")
    val directSource: String?,
    @SerializedName("tv_archive_duration")
    val tvArchiveDuration: Int?
)

// VOD (Movie) DTO
data class VodStreamDto(
    @SerializedName("num")
    val num: Int?,
    @SerializedName("name")
    val name: String?,
    @SerializedName("stream_type")
    val streamType: String?,
    @SerializedName("stream_id")
    val streamId: Int?,
    @SerializedName("stream_icon")
    val streamIcon: String?,
    @SerializedName("rating")
    val rating: String?,
    @SerializedName("rating_5based")
    val rating5Based: Double?,
    @SerializedName("added")
    val added: String?,
    @SerializedName("is_adult")
    val isAdult: String?,
    @SerializedName("category_id")
    val categoryId: String?,
    @SerializedName("container_extension")
    val containerExtension: String?,
    @SerializedName("custom_sid")
    val customSid: String?,
    @SerializedName("direct_source")
    val directSource: String?
)

// VOD Info (Movie Details) DTO
data class VodInfoResponse(
    @SerializedName("info")
    val info: VodInfo?,
    @SerializedName("movie_data")
    val movieData: MovieData?
)

data class VodInfo(
    @SerializedName("movie_image")
    val movieImage: String?,
    @SerializedName("tmdb_id")
    val tmdbId: Int?,
    @SerializedName("name")
    val name: String?,
    @SerializedName("o_name")
    val originalName: String?,
    @SerializedName("plot")
    val plot: String?,
    @SerializedName("cast")
    val cast: String?,
    @SerializedName("director")
    val director: String?,
    @SerializedName("genre")
    val genre: String?,
    @SerializedName("releasedate")
    val releaseDate: String?,
    @SerializedName("release_date")
    val releaseDateAlt: String?,
    @SerializedName("duration_secs")
    val durationSecs: Int?,
    @SerializedName("duration")
    val duration: String?,
    @SerializedName("video")
    val video: VideoInfo?,
    @SerializedName("audio")
    val audio: AudioInfo?,
    @SerializedName("bitrate")
    val bitrate: Int?,
    @SerializedName("rating")
    val rating: String?,
    @SerializedName("backdrop_path")
    val backdropPath: List<String>?,
    @SerializedName("youtube_trailer")
    val youtubeTrailer: String?,
    @SerializedName("country")
    val country: String?
)

data class MovieData(
    @SerializedName("stream_id")
    val streamId: Int?,
    @SerializedName("name")
    val name: String?,
    @SerializedName("added")
    val added: String?,
    @SerializedName("category_id")
    val categoryId: String?,
    @SerializedName("container_extension")
    val containerExtension: String?,
    @SerializedName("custom_sid")
    val customSid: String?,
    @SerializedName("direct_source")
    val directSource: String?
)

data class VideoInfo(
    @SerializedName("codec_name")
    val codecName: String?,
    @SerializedName("width")
    val width: Int?,
    @SerializedName("height")
    val height: Int?
)

data class AudioInfo(
    @SerializedName("codec_name")
    val codecName: String?,
    @SerializedName("channels")
    val channels: Int?,
    @SerializedName("sample_rate")
    val sampleRate: String?
)

// Series DTO
data class SeriesDto(
    @SerializedName("num")
    val num: Int?,
    @SerializedName("name")
    val name: String?,
    @SerializedName("series_id")
    val seriesId: Int?,
    @SerializedName("cover")
    val cover: String?,
    @SerializedName("plot")
    val plot: String?,
    @SerializedName("cast")
    val cast: String?,
    @SerializedName("director")
    val director: String?,
    @SerializedName("genre")
    val genre: String?,
    @SerializedName("releaseDate")
    val releaseDate: String?,
    @SerializedName("release_date")
    val releaseDateAlt: String?,
    @SerializedName("last_modified")
    val lastModified: String?,
    @SerializedName("rating")
    val rating: String?,
    @SerializedName("rating_5based")
    val rating5Based: Double?,
    @SerializedName("backdrop_path")
    val backdropPath: List<String>?,
    @SerializedName("youtube_trailer")
    val youtubeTrailer: String?,
    @SerializedName("tmdb_id")
    val tmdbId: Int?,
    @SerializedName("category_id")
    val categoryId: String?,
    @SerializedName("is_adult")
    val isAdult: String?
)

// Series Info DTO
data class SeriesInfoResponse(
    @SerializedName("seasons")
    val seasons: List<SeasonDto>?,
    @SerializedName("info")
    val info: SeriesInfoDto?,
    @SerializedName("episodes")
    val episodes: Map<String, List<EpisodeDto>>?
)

data class SeasonDto(
    @SerializedName("season_number")
    val seasonNumber: Int?,
    @SerializedName("name")
    val name: String?,
    @SerializedName("episode_count")
    val episodeCount: Int?,
    @SerializedName("cover")
    val cover: String?,
    @SerializedName("cover_big")
    val coverBig: String?
)

data class SeriesInfoDto(
    @SerializedName("name")
    val name: String?,
    @SerializedName("cover")
    val cover: String?,
    @SerializedName("plot")
    val plot: String?,
    @SerializedName("cast")
    val cast: String?,
    @SerializedName("director")
    val director: String?,
    @SerializedName("genre")
    val genre: String?,
    @SerializedName("releaseDate")
    val releaseDate: String?,
    @SerializedName("release_date")
    val releaseDateAlt: String?,
    @SerializedName("last_modified")
    val lastModified: String?,
    @SerializedName("rating")
    val rating: String?,
    @SerializedName("rating_5based")
    val rating5Based: Double?,
    @SerializedName("backdrop_path")
    val backdropPath: List<String>?,
    @SerializedName("youtube_trailer")
    val youtubeTrailer: String?,
    @SerializedName("tmdb_id")
    val tmdbId: Int?,
    @SerializedName("category_id")
    val categoryId: String?
)

data class EpisodeDto(
    @SerializedName("id")
    val id: String?,
    @SerializedName("episode_num")
    val episodeNum: Int?,
    @SerializedName("title")
    val title: String?,
    @SerializedName("container_extension")
    val containerExtension: String?,
    @SerializedName("info")
    val info: EpisodeInfoDto?,
    @SerializedName("custom_sid")
    val customSid: String?,
    @SerializedName("added")
    val added: String?,
    @SerializedName("season")
    val season: Int?,
    @SerializedName("direct_source")
    val directSource: String?
)

data class EpisodeInfoDto(
    @SerializedName("movie_image")
    val movieImage: String?,
    @SerializedName("plot")
    val plot: String?,
    @SerializedName("releasedate")
    val releaseDate: String?,
    @SerializedName("duration_secs")
    val durationSecs: Int?,
    @SerializedName("duration")
    val duration: String?,
    @SerializedName("bitrate")
    val bitrate: Int?,
    @SerializedName("rating")
    val rating: Double?
)

// EPG DTO
data class EpgListingDto(
    @SerializedName("epg_id")
    val epgId: String?,
    @SerializedName("title")
    val title: String?,
    @SerializedName("lang")
    val lang: String?,
    @SerializedName("start")
    val start: String?,
    @SerializedName("end")
    val end: String?,
    @SerializedName("description")
    val description: String?,
    @SerializedName("channel_id")
    val channelId: String?,
    @SerializedName("start_timestamp")
    val startTimestamp: Long?,
    @SerializedName("stop_timestamp")
    val stopTimestamp: Long?
)
