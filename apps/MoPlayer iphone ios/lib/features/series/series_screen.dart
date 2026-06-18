import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../models/playlist_config.dart';
import '../../models/series.dart';
import '../../providers/content_providers.dart';
import '../../providers/core_providers.dart';
import '../../widgets/content_cards.dart';
import '../../widgets/skeletons.dart';
import '../../widgets/state_views.dart';
import '../live/widgets/category_rail.dart';

enum _SeriesSort { recent, az, rating }

class SeriesScreen extends ConsumerStatefulWidget {
  const SeriesScreen({super.key});

  @override
  ConsumerState<SeriesScreen> createState() => _SeriesScreenState();
}

class _SeriesScreenState extends ConsumerState<SeriesScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  _SeriesSort _sort = _SeriesSort.recent;

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
        title: 'Series are an Xtream feature',
        message:
            'Use an Xtream account to browse seasons and episodes in MoPlayer.',
        icon: Icons.video_library_outlined,
      );
    }

    final categoryId = ref.watch(selectedSeriesCategoryProvider);
    final categoriesAsync = ref.watch(seriesCategoriesProvider);
    final seriesAsync = ref.watch(seriesListProvider(categoryId));
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
                  data: (categories) => CategoryRail(
                    categories: categories,
                    selectedId: categoryId,
                    compact: phoneWide,
                    onSelected: (id) =>
                        ref
                                .read(selectedSeriesCategoryProvider.notifier)
                                .state =
                            id,
                  ),
                  loading: () => const ListSkeleton(count: 8),
                  error: (error, stack) => ErrorView(
                    error: error,
                    onRetry: () => ref.invalidate(seriesCategoriesProvider),
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
                      child: seriesAsync.when(
                        data: (series) => _grid(series, compactGrid),
                        loading: () => const PosterGridSkeleton(),
                        error: (error, stack) => ErrorView(
                          error: error,
                          onRetry: () =>
                              ref.invalidate(seriesListProvider(categoryId)),
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
            onChanged: (value) =>
                setState(() => _query = value.trim().toLowerCase()),
            style: AppText.body.copyWith(color: AppColors.textPrimary),
            decoration: const InputDecoration(
              hintText: 'Search series...',
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
    return PopupMenuButton<_SeriesSort>(
      initialValue: _sort,
      color: AppColors.surfaceHigh,
      onSelected: (sort) => setState(() => _sort = sort),
      itemBuilder: (context) => const [
        PopupMenuItem(value: _SeriesSort.recent, child: Text('Recently Added')),
        PopupMenuItem(value: _SeriesSort.az, child: Text('A to Z')),
        PopupMenuItem(value: _SeriesSort.rating, child: Text('Top Rated')),
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
            Text(switch (_sort) {
              _SeriesSort.recent => 'Recent',
              _SeriesSort.az => 'A to Z',
              _SeriesSort.rating => 'Rating',
            }, style: AppText.label),
          ],
        ),
      ),
    );
  }

  Widget _grid(List<SeriesItem> series, bool compact) {
    final list = _query.isEmpty
        ? [...series]
        : series
              .where((item) => item.name.toLowerCase().contains(_query))
              .toList();

    list.sort((a, b) {
      switch (_sort) {
        case _SeriesSort.recent:
          return (b.lastModified?.millisecondsSinceEpoch ?? 0).compareTo(
            a.lastModified?.millisecondsSinceEpoch ?? 0,
          );
        case _SeriesSort.az:
          return a.name.toLowerCase().compareTo(b.name.toLowerCase());
        case _SeriesSort.rating:
          return (b.rating ?? 0).compareTo(a.rating ?? 0);
      }
    });

    if (list.isEmpty) {
      return const EmptyState(
        title: 'No series found',
        message: 'Try another category or search term.',
        icon: Icons.video_library_outlined,
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
      itemBuilder: (context, index) {
        final item = list[index];
        return PosterTile(
          imageUrl: item.cover,
          title: item.name,
          rating: item.rating,
          subtitle: item.releaseDate,
          icon: Icons.video_library_outlined,
          onTap: () => context.push(Routes.seriesDetail, extra: item),
        );
      },
    );
  }
}
