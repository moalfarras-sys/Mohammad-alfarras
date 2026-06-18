import 'package:flutter/material.dart';

/// The MoPlayer Pro "Glass Orange" palette — deep cinematic black with
/// golden-orange accents and soft glass surfaces.
class AppColors {
  const AppColors._();

  // Backgrounds
  static const Color black = Color(0xFF050507);
  static const Color background = Color(0xFF07070B);
  static const Color backgroundAlt = Color(0xFF0C0C12);
  static const Color surface = Color(0xFF14141C);
  static const Color surfaceHigh = Color(0xFF1C1C26);

  // Brand orange / gold
  static const Color primary = Color(0xFFFF7A18);
  static const Color primaryBright = Color(0xFFFF9D2F);
  static const Color gold = Color(0xFFFFC15E);
  static const Color ember = Color(0xFFFF5E1A);

  // Text
  static const Color textPrimary = Color(0xFFF6F6F8);
  static const Color textSecondary = Color(0xFFB7B7C2);
  static const Color textMuted = Color(0xFF7B7B88);

  // Feedback
  static const Color success = Color(0xFF35D07F);
  static const Color danger = Color(0xFFFF4D5E);
  static const Color warning = Color(0xFFFFB020);
  static const Color live = Color(0xFFFF3B30);

  // Glass strokes / fills
  static const Color glassStroke = Color(0x1FFFFFFF);
  static const Color glassFill = Color(0x14FFFFFF);
  static const Color glassFillStrong = Color(0x1FFFFFFF);

  /// Primary cinematic orange gradient used on buttons, the logo glow and
  /// hero highlights.
  static const LinearGradient orangeGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primaryBright, primary, ember],
  );

  static const LinearGradient goldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [gold, primaryBright],
  );

  /// Deep vertical scene gradient for screen backgrounds.
  static const LinearGradient sceneGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF0B0B12), background, black],
    stops: [0.0, 0.45, 1.0],
  );

  /// A soft radial "glow" used behind the hero and logo.
  static RadialGradient glow(Color color, {double opacity = 0.35}) {
    return RadialGradient(
      colors: [
        color.withValues(alpha: opacity),
        color.withValues(alpha: 0.0),
      ],
    );
  }
}
