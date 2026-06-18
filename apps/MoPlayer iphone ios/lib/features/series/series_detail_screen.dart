import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../models/library_items.dart';
import '../../models/media_kind.dart';
import '../../models/series.dart';
import '../../providers/content_providers.dart';
import '../../providers/core_providers.dart';
import '../../providers/library_providers.dart';
import '../../widgets/network_poster.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/state_views.dart';
import '../player/play_helpers.dart';

class SeriesDetailScreen extends ConsumerStatefulWidget {
  const SeriesDetailScreen({super.key, required this.series});

  final SeriesItem series;

  @override
  ConsumerState<SeriesDetailScreen> createState() => _SeriesDetailScreenState();
}

class _SeriesDetailScreenState extends ConsumerState<SeriesDetailScreen> {
  int _seasonIndex = 0;

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(seriesDetailProvider(widget.series));
    final isFavorite = ref
        .watch(favoritesProvider)
        .any(
          (item) =>
              item.kind == MediaKind.series &&
              item.refId == widget.series.seriesId,
        );

    return Scaffold(
      backgroundColor: AppColors.black,
      body: Stack(
        children: [
          Positioned.fill(
            child: NetworkPoster(
              url: widget.series.backdrop ?? widget.series.cover,
              title: widget.series.name,
              radius: 0,
              fit: BoxFit.cover,
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.black.withValues(alpha: 0.45),
                    AppColors.black.withValues(alpha: 0.9),
                    AppColors.black,
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: detailAsync.when(
              loading: () => _SeriesBody(
                base: widget.series,
                isFavorite: isFavorite,
                onBack: context.pop,
                onFavorite: () => _toggleFavorite(widget.series),
              ),
              error: (error, stack) => ErrorView(
                error: error,
                onRetry: () =>
                    ref.invalidate(seriesDetailProvider(widget.series)),
              ),
              data: (detail) {
                final seasons = detail.seasons;
                if (_seasonIndex >= seasons.length && seasons.isNotEmpty) {
                  _seasonIndex = seasons.length - 1;
                }
                final selected = seasons.isEmpty ? null : seasons[_seasonIndex];
                return _SeriesBody(
                  base: detail.series,
                  detail: detail,
                  selectedSeason: selected,
                  seasonIndex: _seasonIndex,
                  isFavorite: isFavorite,
                  onBack: context.pop,
                  onFavorite: () => _toggleFavorite(detail.series),
                  onSeasonSelected: (index) =>
                      setState(() => _seasonIndex = index),
                  onPlayFirst: selected == null || selected.episodes.isEmpty
                      ? null
                      : () => Play.episode(
                          ref,
                          context,
                          series: detail.series,
                          seasonEpisodes: selected.episodes,
                          index: 0,
                        ),
                  onEpisodeTap: (index) => Play.episode(
                    ref,
                    context,
                    series: detail.series,
                    seasonEpisodes: selected!.episodes,
                    index: index,
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _toggleFavorite(SeriesItem series) {
    final config = ref.read(activePlaylistProvider);
    if (config == null) return;
    ref
        .read(libraryActionsProvider)
        .toggleFavorite(
          FavoriteItem(
            playlistId: config.id,
            kind: MediaKind.series,
            refId: series.seriesId,
            title: series.name,
            imageUrl: series.cover,
            subtitle: series.genre,
            payload: series.toPayload(),
          ),
        );
  }
}

class _SeriesBody extends StatelessWidget {
  const _SeriesBody({
    required this.base,
    required this.isFavorite,
    required this.onBack,
    required this.onFavorite,
    this.detail,
    this.selectedSeason,
    this.seasonIndex = 0,
    this.onSeasonSelected,
    this.onPlayFirst,
    this.onEpisodeTap,
  });

  final SeriesItem base;
  final SeriesDetail? detail;
  final Season? selectedSeason;
  final int seasonIndex;
  final bool isFavorite;
  final VoidCallback onBack;
  final VoidCallback onFavorite;
  final ValueChanged<int>? onSeasonSelected;
  final VoidCallback? onPlayFirst;
  final ValueChanged<int>? onEpisodeTap;

  @override
  Widget build(BuildContext context) {
    final seasons = detail?.seasons ?? const <Season>[];
    final phoneWide = MediaQuery.sizeOf(context).height < 470;
    return ListView(
      padding: EdgeInsets.fromLTRB(20, phoneWide ? 8 : 12, 20, 30),
      children: [
        Row(
          children: [
            _CircleAction(icon: Icons.arrow_back_rounded, onTap: onBack),
            const SizedBox(width: 12),
            Text('Series', style: AppText.label),
          ],
        ),
        SizedBox(height: phoneWide ? 12 : 22),
        LayoutBuilder(
          builder: (context, constraints) {
            final narrow = constraints.maxWidth < 760;
            final poster = SizedBox(
              width: phoneWide ? 160 : (narrow ? 160 : 210),
              height: phoneWide ? 236 : (narrow ? 236 : 310),
              child: NetworkPoster(
                url: base.cover,
                title: base.name,
                radius: 18,
                icon: Icons.video_library_outlined,
              ),
            );
            final info = _SeriesInfo(
              series: base,
              seasonCount: seasons.length,
              isFavorite: isFavorite,
              onFavorite: onFavorite,
              onPlayFirst: onPlayFirst,
              compact: phoneWide,
            );
            if (narrow) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [poster, const SizedBox(height: 18), info],
              );
            }
            return Row(
              crossAxisAlignment: phoneWide
                  ? CrossAxisAlignment.center
                  : CrossAxisAlignment.end,
              children: [
                poster,
                SizedBox(width: phoneWide ? 20 : 26),
                Expanded(child: info),
              ],
            );
          },
        ),
        const SizedBox(height: 30),
        if (detail == null)
          const EmptyState(
            title: 'Loading episodes',
            icon: Icons.hourglass_empty_rounded,
          )
        else if (seasons.isEmpty)
          const EmptyState(
            title: 'No episodes available',
            message:
                'The provider did not return episode data for this series.',
            icon: Icons.video_library_outlined,
          )
        else ...[
          SizedBox(
            height: 46,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: seasons.length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final selected = seasonIndex == index;
                return ChoiceChip(
                  selected: selected,
                  label: Text(seasons[index].displayName),
                  onSelected: (_) => onSeasonSelected?.call(index),
                );
              },
            ),
          ),
          const SizedBox(height: 14),
          for (var index = 0; index < selectedSeason!.episodes.length; index++)
            _EpisodeTile(
              episode: selectedSeason!.episodes[index],
              onTap: () => onEpisodeTap?.call(index),
            ),
        ],
      ],
    );
  }
}

class _SeriesInfo extends StatelessWidget {
  const _SeriesInfo({
    required this.series,
    required this.seasonCount,
    required this.isFavorite,
    required this.onFavorite,
    required this.onPlayFirst,
    required this.compact,
  });

  final SeriesItem series;
  final int seasonCount;
  final bool isFavorite;
  final VoidCallback onFavorite;
  final VoidCallback? onPlayFirst;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final meta =
        [
              series.releaseDate,
              series.genre,
              series.rating?.toStringAsFixed(1),
              seasonCount == 0 ? null : '$seasonCount seasons',
            ]
            .whereType<String>()
            .where((value) => value.trim().isNotEmpty)
            .join('  -  ');

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 760),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            series.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: compact ? AppText.title : AppText.display,
          ),
          if (meta.isNotEmpty) ...[
            SizedBox(height: compact ? 6 : 10),
            Text(meta, style: AppText.subtitle),
          ],
          SizedBox(height: compact ? 10 : 18),
          Text(
            series.plot ?? 'No synopsis available.',
            maxLines: compact ? 3 : 6,
            overflow: TextOverflow.ellipsis,
            style: AppText.body.copyWith(color: AppColors.textPrimary),
          ),
          SizedBox(height: compact ? 14 : 22),
          Row(
            children: [
              SizedBox(
                width: compact ? 170 : 190,
                child: PrimaryButton(
                  label: 'Play',
                  icon: Icons.play_arrow_rounded,
                  onPressed: onPlayFirst,
                  height: compact ? 46 : 54,
                ),
              ),
              const SizedBox(width: 12),
              _CircleAction(
                icon: isFavorite
                    ? Icons.favorite_rounded
                    : Icons.favorite_border_rounded,
                active: isFavorite,
                onTap: onFavorite,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EpisodeTile extends StatelessWidget {
  const _EpisodeTile({required this.episode, required this.onTap});

  final Episode episode;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final duration = episode.durationSecs == null
        ? null
        : Fmt.duration(Duration(seconds: episode.durationSecs!));
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.glassFill,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.glassStroke),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 118,
                height: 68,
                child: NetworkPoster(
                  url: episode.image,
                  title: episode.title,
                  radius: 10,
                  icon: Icons.play_circle_outline,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'E${episode.episodeNum} - ${episode.title}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.subtitle.copyWith(
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (episode.plot?.trim().isNotEmpty == true) ...[
                      const SizedBox(height: 5),
                      Text(
                        episode.plot!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.body,
                      ),
                    ],
                  ],
                ),
              ),
              if (duration != null) ...[
                const SizedBox(width: 12),
                Text(duration, style: AppText.label),
              ],
              const SizedBox(width: 12),
              const Icon(
                Icons.play_circle_fill_rounded,
                color: AppColors.primaryBright,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CircleAction extends StatelessWidget {
  const _CircleAction({
    required this.icon,
    required this.onTap,
    this.active = false,
  });

  final IconData icon;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.42),
          shape: BoxShape.circle,
          border: Border.all(
            color: active ? AppColors.primaryBright : Colors.white24,
          ),
        ),
        child: Icon(
          icon,
          color: active ? AppColors.primaryBright : Colors.white,
        ),
      ),
    );
  }
}
