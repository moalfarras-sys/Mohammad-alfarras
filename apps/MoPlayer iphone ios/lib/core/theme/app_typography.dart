import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Centralised text styles. Uses the platform default sans family for crisp
/// rendering on iOS while keeping spacing predictable across preview targets.
class AppText {
  const AppText._();

  static const String _family = '.SF Pro Display';

  static TextStyle get display => const TextStyle(
    fontFamily: _family,
    fontSize: 34,
    height: 1.05,
    fontWeight: FontWeight.w800,
    letterSpacing: 0,
    color: AppColors.textPrimary,
  );

  static TextStyle get headline => const TextStyle(
    fontFamily: _family,
    fontSize: 24,
    fontWeight: FontWeight.w700,
    letterSpacing: 0,
    color: AppColors.textPrimary,
  );

  static TextStyle get title => const TextStyle(
    fontFamily: _family,
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
  );

  static TextStyle get subtitle => const TextStyle(
    fontFamily: _family,
    fontSize: 15,
    fontWeight: FontWeight.w600,
    color: AppColors.textSecondary,
  );

  static TextStyle get body => const TextStyle(
    fontFamily: _family,
    fontSize: 14,
    height: 1.4,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
  );

  static TextStyle get label => const TextStyle(
    fontFamily: _family,
    fontSize: 12.5,
    fontWeight: FontWeight.w600,
    color: AppColors.textMuted,
    letterSpacing: 0,
  );

  static TextStyle get button => const TextStyle(
    fontFamily: _family,
    fontSize: 15,
    fontWeight: FontWeight.w700,
    letterSpacing: 0,
    color: Colors.white,
  );
}
