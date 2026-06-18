import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../models/playlist_config.dart';
import '../../models/vod_movie.dart';
import '../../providers/content_providers.dart';
import '../../providers/core_providers.dart';
import '../../widgets/content_cards.dart';
import '../../widgets/skeletons.dart';
import '../../widgets/state_views.dart';
import '../live/widgets/category_rail.dart';

enum _Sort { recent, az, rating }

class MoviesScreen extends ConsumerStatefulWidget {
  const MoviesScreen({super.key});

  @override
  ConsumerState<MoviesScreen> createState() => _MoviesScreenState();
}

class _MoviesScreenState extends ConsumerState<MoviesScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  _Sort _sort = _Sort.recent;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(activePlaylistProvider);
    if (config != null && config.type == PlaylistType.m3u) {
      return const EmptyState(
        title: 'Movies are an Xtream feature',
        message:
            'Your M3U playlist provides live channels. Sign in with an Xtream '
            'account to browse Movies and Series.',
        icon: Icons.movie_filter_outlined,
      );
    }

    final categoryId = ref.watch(selectedMovieCategoryProvider);
    final categoriesAsync = ref.watch(movieCategoriesProvider);
    final moviesAsync = ref.watch(moviesProvider(categoryId));
    final settings = ref.watch(settingsProvider);

    return LayoutBuilder(
      builder: (context, constraints) {
        final phoneWide =
            constraints.maxHeight < 470 || constraints.maxWidth < 760;
        final categoryWidth = (constraints.maxWidth * (phoneWide ? 0.21 : 0.22))
            .clamp(148.0, 204.0);
        final compactGrid = settings.compactGrids || phoneWide;

        return Padding(
          padding: EdgeInsets.fromLTRB(8, 12, phoneWide ? 10 : 16, 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(
                width: categoryWidth,
                child: categoriesAsync.when(
                  data: (cats) => CategoryRail(
                    categories: cats,
                    selectedId: categoryId,
                    compact: phoneWide,
                    onSelected: (id) =>
                        ref.read(selectedMovieCategoryProvider.notifier).state =
                            id,
                  ),
                  loading: () => const ListSkeleton(count: 8),
                  error: (e, _) => ErrorView(
                    error: e,
                    onRetry: () => ref.invalidate(movieCategoriesProvider),
                  ),
                ),
              ),
              SizedBox(width: phoneWide ? 8 : 12),
              Expanded(
                child: Column(
                  children: [
                    _toolbar(),
                    const SizedBox(height: 10),
                    Expanded(
                      child: moviesAsync.when(
                        data: (movies) => _grid(movies, compactGrid),
                        loading: () => const PosterGridSkeleton(),
                        error: (e, _) => ErrorView(
                          error: e,
                          onRetry: () =>
                              ref.invalidate(moviesProvider(categoryId)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _toolbar() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _searchCtrl,
            onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
            style: AppText.body.copyWith(color: AppColors.textPrimary),
            decoration: const InputDecoration(
              hintText: 'Search movies…',
              prefixIcon: Icon(
                Icons.search_rounded,
                color: AppColors.textMuted,
                size: 20,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        _sortButton(),
      ],
    );
  }

  Widget _sortButton() {
    return PopupMenuButton<_Sort>(
      initialValue: _sort,
      color: AppColors.surfaceHigh,
      onSelected: (s) => setState(() => _sort = s),
      itemBuilder: (context) => const [
        PopupMenuItem(value: _Sort.recent, child: Text('Recently Added')),
        PopupMenuItem(value: _Sort.az, child: Text('A → Z')),
        PopupMenuItem(value: _Sort.rating, child: Text('Top Rated')),
      ],
      child: Container(
        height: 52,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: AppColors.glassFill,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.glassStroke),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.sort_rounded,
              color: AppColors.primaryBright,
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(_sortLabel, style: AppText.label),
          ],
        ),
      ),
    );
  }

  String get _sortLabel => switch (_sort) {
    _Sort.recent => 'Recent',
    _Sort.az => 'A → Z',
    _Sort.rating => 'Rating',
  };

  Widget _grid(List<VodMovie> movies, bool compact) {
    var list = _query.isEmpty
        ? [...movies]
        : movies.where((m) => m.name.toLowerCase().contains(_query)).toList();

    list.sort((a, b) {
      switch (_sort) {
        case _Sort.az:
          return a.name.toLowerCase().compareTo(b.name.toLowerCase());
        case _Sort.rating:
          return (b.rating ?? 0).compareTo(a.rating ?? 0);
        case _Sort.recent:
          return (b.added?.millisecondsSinceEpoch ?? 0).compareTo(
            a.added?.millisecondsSinceEpoch ?? 0,
          );
      }
    });

    if (list.isEmpty) {
      return const EmptyState(
        title: 'No movies found',
        message: 'Try another category or search term.',
        icon: Icons.movie_outlined,
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.only(bottom: 16),
      gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: compact ? 128 : 150,
        childAspectRatio: 0.56,
        crossAxisSpacing: compact ? 10 : 12,
        mainAxisSpacing: compact ? 12 : 14,
      ),
      itemCount: list.length,
      itemBuilder: (context, i) {
        final m = list[i];
        return PosterTile(
          imageUrl: m.poster,
          title: m.name,
          rating: m.rating,
          subtitle: m.year,
          onTap: () => context.push(Routes.movieDetail, extra: m),
        );
      },
    );
  }
}
