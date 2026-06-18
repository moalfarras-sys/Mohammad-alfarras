import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../models/live_channel.dart';
import '../../models/series.dart';
import '../../models/vod_movie.dart';
import '../../providers/content_providers.dart';
import '../../widgets/content_cards.dart';
import '../../widgets/network_poster.dart';
import '../../widgets/skeletons.dart';
import '../../widgets/state_views.dart';
import '../player/play_helpers.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = ref.watch(searchQueryProvider);
    final results = ref.watch(searchResultsProvider);
    final keyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;
    final compactState =
        keyboardOpen || MediaQuery.sizeOf(context).height < 470;

    return CustomScrollView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 10),
            child: TextField(
              controller: _controller,
              autofocus: true,
              onChanged: (value) {
                ref.read(searchQueryProvider.notifier).state = value;
              },
              style: AppText.title,
              decoration: InputDecoration(
                hintText: 'Search live, movies, and series',
                prefixIcon: const Icon(
                  Icons.search_rounded,
                  color: AppColors.primaryBright,
                ),
                suffixIcon: query.isEmpty
                    ? null
                    : IconButton(
                        tooltip: 'Clear',
                        icon: const Icon(
                          Icons.close_rounded,
                          color: AppColors.textMuted,
                        ),
                        onPressed: () {
                          _controller.clear();
                          ref.read(searchQueryProvider.notifier).state = '';
                        },
                      ),
              ),
            ),
          ),
        ),
        if (query.trim().length < 2)
          _AdaptiveSearchState(
            compact: compactState,
            title: 'Start searching',
            message: 'Enter at least two characters.',
            icon: Icons.manage_search_rounded,
          )
        else
          results.when(
            loading: () => compactState
                ? const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(20, 14, 20, 0),
                      child: LinearProgressIndicator(
                        color: AppColors.primaryBright,
                        backgroundColor: AppColors.glassFill,
                      ),
                    ),
                  )
                : const SliverFillRemaining(child: PosterGridSkeleton()),
            error: (error, stack) => compactState
                ? SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
                      child: ErrorView(
                        error: error,
                        onRetry: () => ref.invalidate(searchResultsProvider),
                      ),
                    ),
                  )
                : SliverFillRemaining(
                    child: ErrorView(
                      error: error,
                      onRetry: () => ref.invalidate(searchResultsProvider),
                    ),
                  ),
            data: (data) {
              final empty =
                  data.live.isEmpty &&
                  data.movies.isEmpty &&
                  data.series.isEmpty;
              if (empty) {
                return _AdaptiveSearchState(
                  compact: compactState,
                  title: 'No matches',
                  message: 'Try another title, channel, or category name.',
                  icon: Icons.search_off_rounded,
                );
              }
              return SliverList.list(
                children: [
                  if (data.live.isNotEmpty) _LiveSection(channels: data.live),
                  if (data.movies.isNotEmpty)
                    _MovieSection(movies: data.movies),
                  if (data.series.isNotEmpty)
                    _SeriesSection(series: data.series),
                  SizedBox(
                    height:
                        28 +
                        (keyboardOpen
                            ? MediaQuery.viewInsetsOf(context).bottom
                            : 0),
                  ),
                ],
              );
            },
          ),
      ],
    );
  }
}

class _AdaptiveSearchState extends StatelessWidget {
  const _AdaptiveSearchState({
    required this.compact,
    required this.title,
    required this.message,
    required this.icon,
  });

  final bool compact;
  final String title;
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    if (!compact) {
      return SliverFillRemaining(
        child: EmptyState(title: title, message: message, icon: icon),
      );
    }

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.glassFill,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.glassStroke),
          ),
          child: Row(
            children: [
              Icon(icon, color: AppColors.primaryBright, size: 22),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(title, style: AppText.subtitle),
                    const SizedBox(height: 2),
                    Text(
                      message,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.label,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LiveSection extends ConsumerWidget {
  const _LiveSection({required this.channels});

  final List<LiveChannel> channels;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _Section(
      title: 'Live TV',
      icon: Icons.live_tv_rounded,
      child: SizedBox(
        height: 210,
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          scrollDirection: Axis.horizontal,
          itemCount: channels.length,
          separatorBuilder: (context, index) => const SizedBox(width: 12),
          itemBuilder: (context, index) {
            final channel = channels[index];
            return SizedBox(
              width: 230,
              child: GestureDetector(
                onTap: () => Play.live(ref, context, channel),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.glassFill,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.glassStroke),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ChannelLogo(
                        url: channel.logo,
                        name: channel.name,
                        size: 58,
                      ),
                      const Spacer(),
                      Text(
                        channel.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.subtitle.copyWith(
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 10),
                      const Icon(
                        Icons.play_circle_fill_rounded,
                        color: AppColors.primaryBright,
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _MovieSection extends StatelessWidget {
  const _MovieSection({required this.movies});

  final List<VodMovie> movies;

  @override
  Widget build(BuildContext context) {
    return _PosterSection(
      title: 'Movies',
      icon: Icons.movie_rounded,
      count: movies.length,
      itemBuilder: (context, index) {
        final movie = movies[index];
        return PosterTile(
          imageUrl: movie.poster,
          title: movie.name,
          rating: movie.rating,
          subtitle: movie.year,
          onTap: () => context.push(Routes.movieDetail, extra: movie),
        );
      },
    );
  }
}

class _SeriesSection extends StatelessWidget {
  const _SeriesSection({required this.series});

  final List<SeriesItem> series;

  @override
  Widget build(BuildContext context) {
    return _PosterSection(
      title: 'Series',
      icon: Icons.video_library_rounded,
      count: series.length,
      itemBuilder: (context, index) {
        final item = series[index];
        return PosterTile(
          imageUrl: item.cover,
          title: item.name,
          rating: item.rating,
          icon: Icons.video_library_outlined,
          onTap: () => context.push(Routes.seriesDetail, extra: item),
        );
      },
    );
  }
}

class _PosterSection extends StatelessWidget {
  const _PosterSection({
    required this.title,
    required this.icon,
    required this.count,
    required this.itemBuilder,
  });

  final String title;
  final IconData icon;
  final int count;
  final Widget Function(BuildContext, int) itemBuilder;

  @override
  Widget build(BuildContext context) {
    return _Section(
      title: title,
      icon: icon,
      child: HorizontalRail(
        height: 220,
        itemCount: count,
        itemBuilder: itemBuilder,
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.title,
    required this.icon,
    required this.child,
  });

  final String title;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Icon(icon, color: AppColors.primaryBright, size: 20),
                const SizedBox(width: 8),
                Text(title, style: AppText.title),
              ],
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
