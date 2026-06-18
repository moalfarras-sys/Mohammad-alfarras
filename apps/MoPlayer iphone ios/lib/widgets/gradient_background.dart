import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

/// The signature cinematic backdrop: a deep vertical scene gradient with two
/// soft orange glows bleeding in from the corners.
class GradientBackground extends StatelessWidget {
  const GradientBackground({
    super.key,
    required this.child,
    this.showGlow = true,
  });

  final Widget child;
  final bool showGlow;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(gradient: AppColors.sceneGradient),
      child: Stack(
        children: [
          if (showGlow) ...[
            Positioned(
              top: -120,
              left: -80,
              child: _Glow(color: AppColors.primary, size: 360, opacity: 0.16),
            ),
            Positioned(
              bottom: -140,
              right: -100,
              child: _Glow(color: AppColors.ember, size: 420, opacity: 0.12),
            ),
          ],
          Positioned.fill(child: child),
        ],
      ),
    );
  }
}

class _Glow extends StatelessWidget {
  const _Glow({required this.color, required this.size, required this.opacity});

  final Color color;
  final double size;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: AppColors.glow(color, opacity: opacity),
        ),
      ),
    );
  }
}
