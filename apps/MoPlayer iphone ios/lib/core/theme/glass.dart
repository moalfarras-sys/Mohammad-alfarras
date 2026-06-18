import 'dart:ui';

import 'package:flutter/material.dart';

import 'app_colors.dart';

/// A frosted-glass surface used throughout the cinematic UI. Wraps content in
/// a blurred, translucent rounded card with a subtle gradient stroke.
class GlassPanel extends StatelessWidget {
  const GlassPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.radius = 22,
    this.blur = 18,
    this.fill,
    this.stroke,
    this.glow = false,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final double blur;
  final Color? fill;
  final Color? stroke;
  final bool glow;

  @override
  Widget build(BuildContext context) {
    final borderRadius = BorderRadius.circular(radius);
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        boxShadow: glow
            ? [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.20),
                  blurRadius: 40,
                  spreadRadius: -8,
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: borderRadius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              borderRadius: borderRadius,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  (fill ?? AppColors.glassFill).withValues(alpha: 0.10),
                  (fill ?? AppColors.glassFill).withValues(alpha: 0.04),
                ],
              ),
              color: fill ?? AppColors.glassFill,
              border: Border.all(
                color: stroke ?? AppColors.glassStroke,
                width: 1,
              ),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
