/// App-wide constant keys for caches, preferences and secure storage.
class StorageKeys {
  const StorageKeys._();

  // Secure storage (encrypted)
  static const String activePlaylist = 'active_playlist';
  static const String playlists = 'saved_playlists';
  static const String deviceId = 'device_id';

  // Hive boxes
  static const String boxCache = 'mp_cache';
  static const String boxFavorites = 'mp_favorites';
  static const String boxHistory = 'mp_history';
  static const String boxContinue = 'mp_continue';
  static const String boxSettings = 'mp_settings';

  // Settings keys
  static const String lastLiveChannelId = 'last_live_channel_id';
  static const String preferHls = 'prefer_hls';
  static const String autoplayNext = 'autoplay_next';
  static const String rememberLastChannel = 'remember_last_channel';
  static const String compactLivePreview = 'compact_live_preview';
  static const String compactGrids = 'compact_grids';
  static const String syncOnLaunch = 'sync_on_launch';
  static const String cinematicMotion = 'cinematic_motion';
}

/// Time-to-live for cached catalog responses before a refresh is suggested.
class CacheTtl {
  const CacheTtl._();

  static const Duration categories = Duration(hours: 12);
  static const Duration streams = Duration(hours: 6);
  static const Duration info = Duration(hours: 24);
}
