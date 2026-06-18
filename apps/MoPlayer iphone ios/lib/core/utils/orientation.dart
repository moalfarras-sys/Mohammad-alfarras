import 'package:flutter/services.dart';

/// MoPlayer Pro is a landscape-first experience. These helpers lock the
/// supported orientations app-wide while still allowing the player to enforce
/// a strict fullscreen landscape lock.
class OrientationLock {
  const OrientationLock._();

  /// Landscape-only — the app's primary mode.
  static Future<void> landscape() {
    return SystemChrome.setPreferredOrientations(const [
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
  }

  /// Hide the status / nav bars for a truly immersive cinematic player.
  static Future<void> immersive() {
    return SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  /// Restore normal chrome when leaving the player.
  static Future<void> normalChrome() {
    return SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }
}
