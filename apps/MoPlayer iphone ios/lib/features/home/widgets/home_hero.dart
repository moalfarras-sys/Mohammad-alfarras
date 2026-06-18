import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../models/library_items.dart';
import '../../../models/vod_movie.dart';
import '../../../widgets/app_logo.dart';
import '../../../widgets/network_poster.dart';
import '../../../widgets/primary_button.dart';

/// The big cinematic banner at the top of Home. Features the most relevant
/// item: a resume target if any, otherwise the latest movie, otherwise a
/// branded welcome — never an empty space.
class HomeHero extends StatelessWidget {
  const HomeHero({
    super.key,
    required this.continueItems,
    required this.recentMovies,
    required this.onPlay,
    required this.onPlayMovie,
  });

  final List<ContinueWatchingItem> continueItems;
  final List<VodMovie> recentMovies;
  final ValueChanged<ContinueWatchingItem> onPlay;
  final ValueChanged<VodMovie> onPlayMovie;

  @override
  Widget build(BuildContext context) {
    if (continueItems.isNotEmpty) {
      final item = continueItems.first;
      return _HeroFrame(
        imageUrl: item.imageUrl,
        title: item.title,
        badge: 'RESUME',
        subtitle: '${(item.progress * 100).round()}% watched',
        actionLabel: 'Resume',
        actionIcon: Icons.play_arrow_rounded,
        onAction: () => onPlay(item),
        progress: item.progress,
      );
    }
    if (recentMovies.isNotEmpty) {
      final movie = recentMovies.first;
      return _HeroFrame(
        imageUrl: movie.poster,
        title: movie.name,
        badge: 'FEATURED',
        subtitle: [
          if (movie.year != null) movie.year!,
          if (movie.rating != null && movie.rating! > 0)
            '★ ${movie.rating!.toStringAsFixed(1)}',
        ].join('   |   '),
        actionLabel: 'View',
        actionIcon: Icons.info_outline_rounded,
        onAction: () => onPlayMovie(movie),
      );
    }
    return const _WelcomeHero();
  }
}

class _HeroFrame extends StatelessWidget {
  const _HeroFrame({
    required this.imageUrl,
    required this.title,
    required this.badge,
    required this.subtitle,
    required this.actionLabel,
    required this.actionIcon,
    required this.onAction,
    this.progress,
  });

  final String? imageUrl;
  final String title;
  final String badge;
  final String subtitle;
  final String actionLabel;
  final IconData actionIcon;
  final VoidCallback onAction;
  final double? progress;

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).height < 470;
    final height = compact ? 168.0 : 232.0;
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: SizedBox(
        height: height,
        child: Stack(
          fit: StackFit.expand,
          children: [
            NetworkPoster(
              url: imageUrl,
              title: title,
              radius: 0,
              icon: Icons.local_movies_rounded,
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    AppColors.black.withValues(alpha: 0.92),
                    AppColors.black.withValues(alpha: 0.55),
                    AppColors.black.withValues(alpha: 0.10),
                  ],
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.all(compact ? 18 : 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: compact ? 8 : 10,
                      vertical: compact ? 4 : 5,
                    ),
                    decoration: BoxDecoration(
                      gradient: AppColors.orangeGradient,
                      borderRadius: BorderRadius.circular(7),
                    ),
                    child: Text(
                      badge,
                      style: AppText.label.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  SizedBox(height: compact ? 8 : 12),
                  SizedBox(
                    width: compact ? 340 : 420,
                    child: Text(
                      title,
                      maxLines: compact ? 1 : 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.display.copyWith(
                        fontSize: compact ? 20 : 28,
                      ),
                    ),
                  ),
                  if (!compact && subtitle.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(subtitle, style: AppText.subtitle),
                  ],
                  SizedBox(height: compact ? 12 : 16),
                  PrimaryButton(
                    label: actionLabel,
                    icon: actionIcon,
                    expand: false,
                    onPressed: onAction,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WelcomeHero extends StatelessWidget {
  const _WelcomeHero();

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).height < 470;
    return Container(
      height: compact ? 168 : 232,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.surfaceHigh, AppColors.background],
        ),
        border: Border.all(color: AppColors.glassStroke),
      ),
      child: Row(
        children: [
          SizedBox(width: compact ? 18 : 24),
          AppLogo(size: compact ? 78 : 100),
          SizedBox(width: compact ? 18 : 24),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome to MoPlayer Pro',
                  style: compact ? AppText.title : AppText.headline,
                ),
                SizedBox(height: compact ? 6 : 8),
                Text(
                  'Your channels, movies and series are loading. '
                  'Browse Live TV, Movies and Series from the menu on the left.',
                  maxLines: compact ? 2 : 3,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.body,
                ),
              ],
            ),
          ),
          SizedBox(width: compact ? 18 : 24),
        ],
      ),
    );
  }
}
