import 'package:flutter/foundation.dart';

/// Central application configuration.
///
/// Secrets are injected at compile time via `--dart-define` so that no
/// credentials are ever hardcoded in the source tree. Example:
///
/// ```
/// flutter run --dart-define=SUPABASE_URL=https://xyz.supabase.co \
///             --dart-define=SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
/// ```
///
/// When Supabase keys are absent the app runs in a fully functional
/// local-only mode (favorites / history / continue-watching are persisted
/// to the on-device cache) and transparently upgrades to cloud sync once
/// keys are provided.
class AppConfig {
  const AppConfig._();

  static const String appName = 'MoPlayer Pro';
  static const String appTagline = 'by Moalfarras';
  static const String productSlug = 'moplayer2';

  static const String webBaseUrl = String.fromEnvironment(
    'MOPLAYER_WEB_URL',
    defaultValue: 'https://moalfarras.space',
  );

  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );
  static const String _supabasePublishableKey = String.fromEnvironment(
    'SUPABASE_PUBLISHABLE_KEY',
    defaultValue: '',
  );
  static const String _legacySupabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );
  static String get supabasePublishableKey =>
      _supabasePublishableKey.trim().isNotEmpty
      ? _supabasePublishableKey
      : _legacySupabaseAnonKey;

  /// Whether a Supabase backend is configured for this build.
  static bool get hasSupabase =>
      supabaseUrl.trim().isNotEmpty && supabasePublishableKey.trim().isNotEmpty;

  static String get platform {
    final override = _platformOverride;
    if (override != null) return override;
    if (kIsWeb) return 'web';
    return switch (defaultTargetPlatform) {
      TargetPlatform.iOS => 'ios',
      TargetPlatform.android => 'android',
      TargetPlatform.windows => 'windows',
      TargetPlatform.macOS => 'ios',
      TargetPlatform.linux => 'web',
      TargetPlatform.fuchsia => 'web',
    };
  }

  static String get deviceType {
    if (kIsWeb) return 'browser';
    if (platform == 'ios' && defaultTargetPlatform == TargetPlatform.android) {
      return 'android-emulator-ios-preview';
    }
    return switch (defaultTargetPlatform) {
      TargetPlatform.iOS => 'iphone',
      TargetPlatform.android => 'android-emulator-preview',
      TargetPlatform.windows => 'windows-preview',
      TargetPlatform.macOS => 'macos-preview',
      TargetPlatform.linux => 'linux-preview',
      TargetPlatform.fuchsia => 'preview',
    };
  }

  static String? get _platformOverride {
    const raw = String.fromEnvironment('MOPLAYER_PLATFORM', defaultValue: '');
    final normalized = raw.trim().toLowerCase();
    const allowed = {'ios', 'android', 'android_tv', 'windows', 'web'};
    return allowed.contains(normalized) ? normalized : null;
  }

  /// Network timeouts for IPTV panels (which are frequently slow).
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 25);

  /// How many list items to render per page when virtualising large catalogs.
  static const int pageSize = 60;
}
