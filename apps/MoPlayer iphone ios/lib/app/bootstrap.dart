import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/config/app_config.dart';
import '../core/utils/app_logger.dart';
import '../providers/core_providers.dart';
import '../services/cache/cache_service.dart';
import '../services/device/device_service.dart';
import '../services/storage/secure_storage_service.dart';
import '../services/supabase/supabase_service.dart';

/// Result of application bootstrap: the Riverpod overrides that inject the
/// fully-initialised singletons into the provider graph.
class AppBootstrap {
  const AppBootstrap(this.overrides);
  final List<Override> overrides;
}

/// Initialises storage, device info and (optionally) Supabase before the UI
/// starts. Designed to never throw — any backend failure degrades gracefully
/// to local-only mode so the app always launches.
Future<AppBootstrap> bootstrap() async {
  final secure = SecureStorageService();

  final cache = CacheService();
  await cache.init();

  final device = DeviceService(secure);
  await device.init();

  var supabaseEnabled = false;
  if (AppConfig.hasSupabase) {
    try {
      await Supabase.initialize(
        url: AppConfig.supabaseUrl,
        publishableKey: AppConfig.supabasePublishableKey,
        debug: false,
      );
      supabaseEnabled = true;
    } catch (e) {
      log.e('Supabase init failed — continuing in local mode', error: e);
    }
  }

  final supabase = SupabaseService(enabled: supabaseEnabled);
  await supabase.ensureSession();
  await supabase.upsertDevice(
    deviceId: device.deviceId,
    model: device.model,
    os: device.osVersion,
    appVersion: '${device.appVersion}+${device.buildNumber}',
  );

  final active = await secure.readActivePlaylist();

  return AppBootstrap([
    cacheServiceProvider.overrideWithValue(cache),
    secureStorageProvider.overrideWithValue(secure),
    supabaseServiceProvider.overrideWithValue(supabase),
    deviceServiceProvider.overrideWithValue(device),
    initialActivePlaylistProvider.overrideWithValue(active),
  ]);
}
