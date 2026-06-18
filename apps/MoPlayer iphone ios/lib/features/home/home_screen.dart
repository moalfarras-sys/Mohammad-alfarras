import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../models/category.dart';
import '../../models/library_items.dart';
import '../../models/live_channel.dart';
import '../../models/media_kind.dart';
import '../../models/series.dart';
import '../../models/vod_movie.dart';
import '../../providers/content_providers.dart';
import '../../providers/core_providers.dart';
import '../../providers/library_providers.dart';
import '../../widgets/content_cards.dart';
import '../../widgets/section_header.dart';
import '../player/play_helpers.dart';
import 'widgets/home_hero.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final continueItems = ref.watch(continueWatchingProvider);
    final favorites = ref.watch(favoritesProvider);
    final moviesAsync = ref.watch(moviesProvider(Category.allId));
    final seriesAsync = ref.watch(seriesListProvider(Category.allId));

    final recentMovies = moviesAsync.maybeWhen(
      data: (list) => _recent(list),
      orElse: () => <VodMovie>[],
    );
    final recentSeries = seriesAsync.maybeWhen(
      data: (list) => _recentSeries(list),
      orElse: () => <SeriesItem>[],
    );
    final compactRows =
        ref.watch(settingsProvider).compactGrids ||
        MediaQuery.sizeOf(context).height < 470;

    return ListView(
      padding: const EdgeInsets.only(bottom: 32),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: HomeHero(
            continueItems: continueItems,
            recentMovies: recentMovies,
            onPlay: (item) => Play.resume(ref, context, item),
            onPlayMovie: (m) => context.push(Routes.movieDetail, extra: m),
          ),
        ),
        const SizedBox(height: 20),
        _quickAccess(context),
        if (continueItems.isNotEmpty) ...[
          const SectionHeader(
            title: 'Continue Watching',
            icon: Icons.play_circle_outline,
          ),
          HorizontalRail(
            height: compactRows ? 148 : 168,
            itemWidth: compactRows ? 204 : 230,
            itemCount: continueItems.length,
            itemBuilder: (context, i) {
              final item = continueItems[i];
              return ContinueCard(
                imageUrl: item.imageUrl,
                title: item.title,
                progress: item.progress,
                onTap: () => Play.resume(ref, context, item),
                onRemove: () => ref
                    .read(libraryActionsProvider)
                    .removeContinue(item.kind, item.refId),
              );
            },
          ),
        ],
        if (favorites.isNotEmpty) ...[
          SectionHeader(
            title: 'Your Favorites',
            icon: Icons.favorite_rounded,
            onSeeAll: () => context.go(Routes.favorites),
          ),
          HorizontalRail(
            height: compactRows ? 188 : 210,
            itemWidth: compactRows ? 116 : 130,
            itemCount: favorites.length,
            itemBuilder: (context, i) {
              final f = favorites[i];
              return PosterTile(
                imageUrl: f.imageUrl,
                title: f.title,
                icon: Icons.favorite_rounded,
                onTap: () => _openFavorite(ref, context, f),
              );
            },
          ),
        ],
        if (recentMovies.isNotEmpty) ...[
          SectionHeader(
            title: 'Recently Added Movies',
            icon: Icons.movie_rounded,
            onSeeAll: () => context.go(Routes.movies),
          ),
          HorizontalRail(
            height: compactRows ? 188 : 210,
            itemWidth: compactRows ? 116 : 130,
            itemCount: recentMovies.length,
            itemBuilder: (context, i) {
              final m = recentMovies[i];
              return PosterTile(
                imageUrl: m.poster,
                title: m.name,
                rating: m.rating,
                subtitle: m.year,
                onTap: () => context.push(Routes.movieDetail, extra: m),
              );
            },
          ),
        ],
        if (recentSeries.isNotEmpty) ...[
          SectionHeader(
            title: 'Recently Added Series',
            icon: Icons.video_library_rounded,
            onSeeAll: () => context.go(Routes.series),
          ),
          HorizontalRail(
            height: compactRows ? 188 : 210,
            itemWidth: compactRows ? 116 : 130,
            itemCount: recentSeries.length,
            itemBuilder: (context, i) {
              final s = recentSeries[i];
              return PosterTile(
                imageUrl: s.cover,
                title: s.name,
                rating: s.rating,
                icon: Icons.video_library_outlined,
                onTap: () => context.push(Routes.seriesDetail, extra: s),
              );
            },
          ),
        ],
      ],
    );
  }

  List<VodMovie> _recent(List<VodMovie> list) {
    final sorted = [...list]
      ..sort((a, b) {
        final ad = a.added?.millisecondsSinceEpoch ?? 0;
        final bd = b.added?.millisecondsSinceEpoch ?? 0;
        return bd.compareTo(ad);
      });
    return sorted.take(18).toList();
  }

  List<SeriesItem> _recentSeries(List<SeriesItem> list) {
    final sorted = [...list]
      ..sort((a, b) {
        final ad = a.lastModified?.millisecondsSinceEpoch ?? 0;
        final bd = b.lastModified?.millisecondsSinceEpoch ?? 0;
        if (ad != bd) return bd.compareTo(ad);
        return a.name.toLowerCase().compareTo(b.name.toLowerCase());
      });
    return sorted.take(18).toList();
  }

  void _openFavorite(WidgetRef ref, BuildContext context, FavoriteItem fav) {
    switch (fav.kind) {
      case MediaKind.movie:
        context.push(
          Routes.movieDetail,
          extra: VodMovie.fromPayload(fav.payload),
        );
      case MediaKind.series:
        context.push(
          Routes.seriesDetail,
          extra: SeriesItem.fromPayload(fav.payload),
        );
      case MediaKind.live:
        Play.live(ref, context, LiveChannel.fromPayload(fav.payload));
      case MediaKind.episode:
        break;
    }
  }

  Widget _quickAccess(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).height < 470;
    final items = [
      (_QuickItem('Live TV', Icons.live_tv_rounded, Routes.live)),
      (_QuickItem('Movies', Icons.movie_rounded, Routes.movies)),
      (_QuickItem('Series', Icons.video_library_rounded, Routes.series)),
      (_QuickItem('Search', Icons.search_rounded, Routes.search)),
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          for (final item in items) ...[
            Expanded(
              child: GestureDetector(
                onTap: () => context.go(item.route),
                child: Container(
                  height: compact ? 62 : 76,
                  decoration: BoxDecoration(
                    color: AppColors.glassFill,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.glassStroke),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        item.icon,
                        color: AppColors.primaryBright,
                        size: compact ? 21 : 24,
                      ),
                      SizedBox(height: compact ? 4 : 6),
                      Text(item.label, style: AppText.label),
                    ],
                  ),
                ),
              ),
            ),
            if (item != items.last) const SizedBox(width: 12),
          ],
        ],
      ),
    );
  }
}

class _QuickItem {
  const _QuickItem(this.label, this.icon, this.route);
  final String label;
  final IconData icon;
  final String route;
}
