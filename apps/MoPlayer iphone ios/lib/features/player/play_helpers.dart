import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/routes.dart';
import '../../models/library_items.dart';
import '../../models/live_channel.dart';
import '../../models/media_kind.dart';
import '../../models/series.dart';
import '../../models/vod_movie.dart';
import '../../providers/content_providers.dart';
import '../../providers/core_providers.dart';
import '../../providers/library_providers.dart';
import '../../services/player/player_service.dart';
import 'playback_args.dart';

/// Builds [PlaybackArgs] for the various content types and opens the player.
/// All resume/history bookkeeping is centralised in the player screen.
class Play {
  const Play._();

  static void live(WidgetRef ref, BuildContext context, LiveChannel channel) {
    final repo = ref.read(contentRepositoryProvider);
    if (repo == null) return;
    final settings = ref.read(settingsProvider);
    final hls = settings.preferHls;
    if (settings.rememberLastChannel) {
      ref
          .read(settingsRepositoryProvider)
          .setLastLiveChannelId(channel.streamId);
    }
    final media = PlayableMedia(
      url: repo.liveUrl(channel, hls: hls),
      title: channel.name,
      kind: MediaKind.live,
    );
    context.push(
      Routes.player,
      extra: PlaybackArgs(
        media: media,
        refId: channel.streamId,
        imageUrl: channel.logo,
        payload: channel.toPayload(),
        trackProgress: false,
      ),
    );
  }

  static void movie(WidgetRef ref, BuildContext context, VodMovie movie) {
    final repo = ref.read(contentRepositoryProvider);
    if (repo == null) return;
    final resume = ref
        .read(libraryActionsProvider)
        .resumePosition(MediaKind.movie, movie.streamId);
    final media = PlayableMedia(
      url: repo.movieUrl(movie),
      title: movie.name,
      kind: MediaKind.movie,
      startAt: resume,
    );
    context.push(
      Routes.player,
      extra: PlaybackArgs(
        media: media,
        refId: movie.streamId,
        imageUrl: movie.poster,
        payload: movie.toPayload(),
      ),
    );
  }

  static void episode(
    WidgetRef ref,
    BuildContext context, {
    required SeriesItem series,
    required List<Episode> seasonEpisodes,
    required int index,
  }) {
    final repo = ref.read(contentRepositoryProvider);
    if (repo == null) return;
    final ep = seasonEpisodes[index];
    final resume = ref
        .read(libraryActionsProvider)
        .resumePosition(MediaKind.episode, ep.id);
    final media = PlayableMedia(
      url: repo.episodeUrl(ep),
      title: '${series.name}  |  S${ep.seasonNumber}E${ep.episodeNum}',
      kind: MediaKind.episode,
      startAt: resume,
    );
    context.push(
      Routes.player,
      extra: PlaybackArgs(
        media: media,
        refId: ep.id,
        imageUrl: ep.image ?? series.cover,
        payload: {
          ...ep.toPayload(),
          'seriesName': series.name,
          'seriesCover': series.cover,
        },
        seasonEpisodes: seasonEpisodes,
        episodeIndex: index,
        seriesItem: series,
      ),
    );
  }

  /// Resumes a Continue Watching entry by reconstructing the source.
  static void resume(
    WidgetRef ref,
    BuildContext context,
    ContinueWatchingItem item,
  ) {
    final repo = ref.read(contentRepositoryProvider);
    if (repo == null) return;
    if (item.kind == MediaKind.movie) {
      movie(ref, context, VodMovie.fromPayload(item.payload));
    } else if (item.kind == MediaKind.episode) {
      final ep = Episode.fromPayload(item.payload);
      final media = PlayableMedia(
        url: repo.episodeUrl(ep),
        title: item.title,
        kind: MediaKind.episode,
        startAt: item.position,
      );
      context.push(
        Routes.player,
        extra: PlaybackArgs(
          media: media,
          refId: ep.id,
          imageUrl: item.imageUrl,
          payload: item.payload,
        ),
      );
    }
  }
}
