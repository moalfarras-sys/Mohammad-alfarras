import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import 'network_poster.dart';

/// A tappable poster tile (movies / series) with title, rating and a hover-like
/// press scale. Sizes itself to the width given by its parent.
class PosterTile extends StatelessWidget {
  const PosterTile({
    super.key,
    required this.imageUrl,
    required this.title,
    required this.onTap,
    this.rating,
    this.subtitle,
    this.icon = Icons.movie_outlined,
    this.aspectRatio = 0.66,
  });

  final String? imageUrl;
  final String title;
  final VoidCallback onTap;
  final double? rating;
  final String? subtitle;
  final IconData icon;
  final double aspectRatio;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              children: [
                Positioned.fill(
                  child: NetworkPoster(
                    url: imageUrl,
                    title: title,
                    icon: icon,
                    radius: 14,
                  ),
                ),
                if (rating != null && rating! > 0)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(7),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.star_rounded,
                            size: 12,
                            color: AppColors.gold,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            rating!.toStringAsFixed(1),
                            style: AppText.label.copyWith(
                              color: Colors.white,
                              fontSize: 10.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppText.label.copyWith(color: AppColors.textPrimary),
          ),
          if (subtitle != null)
            Text(
              subtitle!,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.label.copyWith(fontSize: 10.5),
            ),
        ],
      ),
    );
  }
}

/// A wide "continue watching" card with a progress bar.
class ContinueCard extends StatelessWidget {
  const ContinueCard({
    super.key,
    required this.imageUrl,
    required this.title,
    required this.progress,
    required this.onTap,
    this.onRemove,
  });

  final String? imageUrl;
  final String title;
  final double progress;
  final VoidCallback onTap;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 230,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  NetworkPoster(
                    url: imageUrl,
                    title: title,
                    radius: 14,
                    icon: Icons.play_circle_outline,
                  ),
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.45),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white30),
                      ),
                      child: const Icon(
                        Icons.play_arrow_rounded,
                        color: Colors.white,
                        size: 26,
                      ),
                    ),
                  ),
                  if (onRemove != null)
                    Positioned(
                      top: 6,
                      right: 6,
                      child: GestureDetector(
                        onTap: onRemove,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.55),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close_rounded,
                            size: 14,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  Positioned(
                    left: 8,
                    right: 8,
                    bottom: 8,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 4,
                        backgroundColor: Colors.white24,
                        valueColor: const AlwaysStoppedAnimation(
                          AppColors.primaryBright,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.label.copyWith(color: AppColors.textPrimary),
            ),
          ],
        ),
      ),
    );
  }
}

/// A horizontal scrolling rail with a fixed item height.
class HorizontalRail extends StatelessWidget {
  const HorizontalRail({
    super.key,
    required this.height,
    required this.itemCount,
    required this.itemBuilder,
    this.itemWidth = 130,
    this.separator = 12,
  });

  final double height;
  final int itemCount;
  final double itemWidth;
  final double separator;
  final Widget Function(BuildContext, int) itemBuilder;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: itemCount,
        separatorBuilder: (context, index) => SizedBox(width: separator),
        itemBuilder: (context, i) =>
            SizedBox(width: itemWidth, child: itemBuilder(context, i)),
      ),
    );
  }
}
