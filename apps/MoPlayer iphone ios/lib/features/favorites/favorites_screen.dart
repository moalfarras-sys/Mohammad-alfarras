import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../models/library_items.dart';
import '../../models/live_channel.dart';
import '../../models/media_kind.dart';
import '../../models/series.dart';
import '../../models/vod_movie.dart';
import '../../providers/core_providers.dart';
import '../../providers/library_providers.dart';
import '../../widgets/content_cards.dart';
import '../../widgets/state_views.dart';
import '../player/play_helpers.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favorites = ref.watch(favoritesProvider);
    if (favorites.isEmpty) {
      return const EmptyState(
        title: 'No favorites yet',
        message: 'Save channels, movies, and series for quick access.',
        icon: Icons.favorite_border_rounded,
      );
    }

    final live = favorites
        .where((item) => item.kind == MediaKind.live)
        .toList();
    final movies = favorites
        .where((item) => item.kind == MediaKind.movie)
        .toList();
    final series = favorites
        .where((item) => item.kind == MediaKind.series)
        .toList();
    final episodes = favorites
        .where((item) => item.kind == MediaKind.episode)
        .toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 32),
      children: [
        Row(
          children: [
            const Icon(Icons.favorite_rounded, color: AppColors.primaryBright),
            const SizedBox(width: 10),
            Text('Favorites', style: AppText.headline),
          ],
        ),
        const SizedBox(height: 18),
        if (live.isNotEmpty) _FavoriteSection(title: 'Live TV', items: live),
        if (movies.isNotEmpty) _FavoriteSection(title: 'Movies', items: movies),
        if (series.isNotEmpty) _FavoriteSection(title: 'Series', items: series),
        if (episodes.isNotEmpty)
          _FavoriteSection(title: 'Episodes', items: episodes),
      ],
    );
  }
}

class _FavoriteSection extends ConsumerWidget {
  const _FavoriteSection({required this.title, required this.items});

  final String title;
  final List<FavoriteItem> items;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final compactGrid =
        ref.watch(settingsProvider).compactGrids ||
        MediaQuery.sizeOf(context).height < 470;
    return Padding(
      padding: const EdgeInsets.only(bottom: 26),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppText.title),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: compactGrid ? 132 : 160,
              childAspectRatio: 0.56,
              crossAxisSpacing: compactGrid ? 10 : 12,
              mainAxisSpacing: compactGrid ? 12 : 16,
            ),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              return Stack(
                children: [
                  Positioned.fill(
                    child: PosterTile(
                      imageUrl: item.imageUrl,
                      title: item.title,
                      subtitle: item.subtitle,
                      icon: _iconFor(item.kind),
                      onTap: () => _openFavorite(ref, context, item),
                    ),
                  ),
                  Positioned(
                    top: 6,
                    right: 6,
                    child: _RemoveButton(
                      onTap: () => ref
                          .read(libraryActionsProvider)
                          .removeFavorite(item.kind, item.refId),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  IconData _iconFor(MediaKind kind) => switch (kind) {
    MediaKind.live => Icons.live_tv_rounded,
    MediaKind.movie => Icons.movie_outlined,
    MediaKind.series => Icons.video_library_outlined,
    MediaKind.episode => Icons.play_circle_outline_rounded,
  };

  void _openFavorite(WidgetRef ref, BuildContext context, FavoriteItem item) {
    switch (item.kind) {
      case MediaKind.live:
        Play.live(ref, context, LiveChannel.fromPayload(item.payload));
      case MediaKind.movie:
        context.push(
          Routes.movieDetail,
          extra: VodMovie.fromPayload(item.payload),
        );
      case MediaKind.series:
        context.push(
          Routes.seriesDetail,
          extra: SeriesItem.fromPayload(item.payload),
        );
      case MediaKind.episode:
        Play.resume(
          ref,
          context,
          ContinueWatchingItem(
            playlistId: item.playlistId,
            kind: item.kind,
            refId: item.refId,
            title: item.title,
            imageUrl: item.imageUrl,
            positionSecs: 0,
            durationSecs: 0,
            payload: item.payload,
          ),
        );
    }
  }
}

class _RemoveButton extends StatelessWidget {
  const _RemoveButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(7),
        decoration: BoxDecoration(
          color: AppColors.black.withValues(alpha: 0.65),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white24),
        ),
        child: const Icon(
          Icons.favorite_rounded,
          color: AppColors.primaryBright,
          size: 16,
        ),
      ),
    );
  }
}
