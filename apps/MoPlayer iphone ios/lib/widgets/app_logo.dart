import 'package:flutter/material.dart';

import '../core/config/app_config.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';

/// The MoPlayer Pro brand mark — the logo image wrapped in a soft orange glow.
class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.size = 120, this.showWordmark = false});

  final double size;
  final bool showWordmark;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.40),
                blurRadius: size * 0.45,
                spreadRadius: -size * 0.08,
              ),
            ],
          ),
          child: Padding(
            padding: EdgeInsets.all(size * 0.06),
            child: Image.asset(
              'assets/branding/logo.png',
              fit: BoxFit.contain,
              filterQuality: FilterQuality.high,
            ),
          ),
        ),
        if (showWordmark) ...[
          const SizedBox(height: 14),
          ShaderMask(
            shaderCallback: (bounds) =>
                AppColors.goldGradient.createShader(bounds),
            child: Text(
              AppConfig.appName,
              style: AppText.display.copyWith(color: Colors.white),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            AppConfig.appTagline,
            style: AppText.label.copyWith(letterSpacing: 3),
          ),
        ],
      ],
    );
  }
}
