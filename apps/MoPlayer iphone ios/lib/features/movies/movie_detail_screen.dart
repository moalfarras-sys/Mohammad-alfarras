import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../models/library_items.dart';
import '../../models/media_kind.dart';
import '../../models/vod_movie.dart';
import '../../providers/content_providers.dart';
import '../../providers/core_providers.dart';
import '../../providers/library_providers.dart';
import '../../widgets/network_poster.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/state_views.dart';
import '../player/play_helpers.dart';

class MovieDetailScreen extends ConsumerWidget {
  const MovieDetailScreen({super.key, required this.movie});

  final VodMovie movie;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(movieDetailProvider(movie));
    final detail = detailAsync.maybeWhen(
      data: (value) => value,
      orElse: () => null,
    );
    final displayMovie = detail?.movie ?? movie;
    final isFavorite = ref
        .watch(favoritesProvider)
        .any(
          (item) =>
              item.kind == MediaKind.movie &&
              item.refId == displayMovie.streamId,
        );

    return Scaffold(
      backgroundColor: AppColors.black,
      body: Stack(
        children: [
          Positioned.fill(
            child: NetworkPoster(
              url: detail?.backdrop ?? displayMovie.poster,
              title: displayMovie.name,
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
                    AppColors.black.withValues(alpha: 0.35),
                    AppColors.black.withValues(alpha: 0.88),
                    AppColors.black,
                  ],
                  stops: const [0, 0.42, 1],
                ),
              ),
            ),
          ),
          SafeArea(
            child: detailAsync.when(
              loading: () => _DetailBody(
                movie: displayMovie,
                loading: true,
                isFavorite: isFavorite,
                onBack: context.pop,
                onPlay: () => Play.movie(ref, context, displayMovie),
                onFavorite: () => _toggleFavorite(ref, displayMovie, null),
              ),
              error: (error, stack) => ErrorView(
                error: error,
                onRetry: () => ref.invalidate(movieDetailProvider(movie)),
              ),
              data: (value) => _DetailBody(
                movie: value.movie,
                detail: value,
                isFavorite: isFavorite,
                onBack: context.pop,
                onPlay: () => Play.movie(ref, context, value.movie),
                onFavorite: () => _toggleFavorite(ref, value.movie, value),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _toggleFavorite(WidgetRef ref, VodMovie movie, MovieDetail? detail) {
    final config = ref.read(activePlaylistProvider);
    if (config == null) return;
    ref
        .read(libraryActionsProvider)
        .toggleFavorite(
          FavoriteItem(
            playlistId: config.id,
            kind: MediaKind.movie,
            refId: movie.streamId,
            title: movie.name,
            imageUrl: movie.poster,
            subtitle: detail?.genre ?? movie.year,
            payload: movie.toPayload(),
          ),
        );
  }
}

class _DetailBody extends StatelessWidget {
  const _DetailBody({
    required this.movie,
    required this.isFavorite,
    required this.onBack,
    required this.onPlay,
    required this.onFavorite,
    this.detail,
    this.loading = false,
  });

  final VodMovie movie;
  final MovieDetail? detail;
  final bool loading;
  final bool isFavorite;
  final VoidCallback onBack;
  final VoidCallback onPlay;
  final VoidCallback onFavorite;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _TopBar(onBack: onBack),
          const SizedBox(height: 22),
          LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 720;
              final poster = SizedBox(
                width: compact ? 160 : 210,
                height: compact ? 236 : 310,
                child: NetworkPoster(
                  url: movie.poster,
                  title: movie.name,
                  radius: 18,
                ),
              );
              final info = _InfoPanel(
                movie: movie,
                detail: detail,
                loading: loading,
                isFavorite: isFavorite,
                onPlay: onPlay,
                onFavorite: onFavorite,
              );
              if (compact) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [poster, const SizedBox(height: 18), info],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  poster,
                  const SizedBox(width: 26),
                  Expanded(child: info),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _InfoPanel extends StatelessWidget {
  const _InfoPanel({
    required this.movie,
    required this.detail,
    required this.loading,
    required this.isFavorite,
    required this.onPlay,
    required this.onFavorite,
  });

  final VodMovie movie;
  final MovieDetail? detail;
  final bool loading;
  final bool isFavorite;
  final VoidCallback onPlay;
  final VoidCallback onFavorite;

  @override
  Widget build(BuildContext context) {
    final duration = switch (detail?.durationSecs) {
      final seconds? => Fmt.duration(Duration(seconds: seconds)),
      _ => null,
    };
    final meta =
        [movie.year, detail?.genre, movie.rating?.toStringAsFixed(1), duration]
            .whereType<String>()
            .where((value) => value.trim().isNotEmpty)
            .join('  -  ');

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 760),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(movie.name, style: AppText.display),
          if (meta.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(meta, style: AppText.subtitle),
          ],
          const SizedBox(height: 18),
          Text(
            detail?.plot ??
                (loading
                    ? 'Loading movie details...'
                    : 'No synopsis available.'),
            maxLines: 6,
            overflow: TextOverflow.ellipsis,
            style: AppText.body.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 22),
          Row(
            children: [
              SizedBox(
                width: 190,
                child: PrimaryButton(
                  label: 'Play',
                  icon: Icons.play_arrow_rounded,
                  onPressed: onPlay,
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
          if (detail?.cast?.trim().isNotEmpty == true) ...[
            const SizedBox(height: 24),
            Text('Cast', style: AppText.title),
            const SizedBox(height: 8),
            Text(detail!.cast!, style: AppText.body),
          ],
        ],
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _CircleAction(icon: Icons.arrow_back_rounded, onTap: onBack),
        const SizedBox(width: 12),
        Text('Movie', style: AppText.label),
      ],
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
