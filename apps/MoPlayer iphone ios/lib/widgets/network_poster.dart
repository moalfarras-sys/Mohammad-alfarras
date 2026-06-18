import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../core/utils/formatters.dart';

/// A poster / thumbnail image that always renders *something* — never an empty
/// box. Missing or broken images fall back to a tasteful branded placeholder.
class NetworkPoster extends StatelessWidget {
  const NetworkPoster({
    super.key,
    required this.url,
    required this.title,
    this.radius = 14,
    this.icon = Icons.movie_outlined,
    this.fit = BoxFit.cover,
  });

  final String? url;
  final String title;
  final double radius;
  final IconData icon;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    final borderRadius = BorderRadius.circular(radius);
    return ClipRRect(
      borderRadius: borderRadius,
      child: (url == null || url!.isEmpty)
          ? _Fallback(title: title, icon: icon)
          : CachedNetworkImage(
              imageUrl: url!,
              fit: fit,
              fadeInDuration: const Duration(milliseconds: 220),
              placeholder: (context, url) => const _Shimmer(),
              errorWidget: (context, url, error) =>
                  _Fallback(title: title, icon: icon),
            ),
    );
  }
}

class _Fallback extends StatelessWidget {
  const _Fallback({required this.title, required this.icon});

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.surfaceHigh, AppColors.surface],
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Center(
            child: Icon(
              icon,
              color: AppColors.primary.withValues(alpha: 0.55),
              size: 34,
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    AppColors.black.withValues(alpha: 0.85),
                    AppColors.black.withValues(alpha: 0.0),
                  ],
                ),
              ),
              child: Text(
                title,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: AppText.label.copyWith(color: AppColors.textSecondary),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// A circular channel logo with an initials fallback.
class ChannelLogo extends StatelessWidget {
  const ChannelLogo({
    super.key,
    required this.url,
    required this.name,
    this.size = 46,
  });

  final String? url;
  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.surfaceHigh,
        borderRadius: BorderRadius.circular(size * 0.26),
        border: Border.all(color: AppColors.glassStroke),
      ),
      clipBehavior: Clip.antiAlias,
      padding: EdgeInsets.all(size * 0.12),
      child: (url == null || url!.isEmpty)
          ? _Initials(name: name)
          : CachedNetworkImage(
              imageUrl: url!,
              fit: BoxFit.contain,
              placeholder: (context, url) => _Initials(name: name),
              errorWidget: (context, url, error) => _Initials(name: name),
            ),
    );
  }
}

class _Initials extends StatelessWidget {
  const _Initials({required this.name});
  final String name;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        Fmt.initials(name),
        style: AppText.subtitle.copyWith(
          color: AppColors.primaryBright,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _Shimmer extends StatelessWidget {
  const _Shimmer();

  @override
  Widget build(BuildContext context) {
    return const DecoratedBox(
      decoration: BoxDecoration(color: AppColors.surfaceHigh),
    );
  }
}
