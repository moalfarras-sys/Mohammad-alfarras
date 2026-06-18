import '../../models/media_kind.dart';
import '../../models/series.dart';
import '../../services/player/player_service.dart';

/// Everything the player screen needs to play an item, persist progress/history
/// and (for episodes) autoplay the next one in the season.
class PlaybackArgs {
  const PlaybackArgs({
    required this.media,
    required this.refId,
    this.imageUrl,
    this.payload = const {},
    this.trackProgress = true,
    this.seasonEpisodes,
    this.episodeIndex,
    this.seriesItem,
  });

  final PlayableMedia media;

  /// Stable id of the underlying content (stream/movie/episode id).
  final String refId;
  final String? imageUrl;

  /// Payload used to reconstruct the item for continue-watching / favourites.
  final Map<String, dynamic> payload;

  /// Live channels are not tracked for resume.
  final bool trackProgress;

  // Episode autoplay context (optional).
  final List<Episode>? seasonEpisodes;
  final int? episodeIndex;
  final SeriesItem? seriesItem;

  MediaKind get kind => media.kind;

  bool get hasNextEpisode =>
      seasonEpisodes != null &&
      episodeIndex != null &&
      episodeIndex! + 1 < seasonEpisodes!.length;

  Episode? get nextEpisode =>
      hasNextEpisode ? seasonEpisodes![episodeIndex! + 1] : null;
}
