import 'package:dio/dio.dart';
import 'package:flutter/services.dart';

import '../core/config/app_config.dart';
import '../core/error/failures.dart';
import '../core/error/result.dart';
import '../core/utils/app_logger.dart';
import '../models/playlist_config.dart';
import '../services/m3u/m3u_parser.dart';
import '../services/storage/secure_storage_service.dart';
import '../services/supabase/supabase_service.dart';
import '../services/xtream/xtream_api.dart';

/// Owns the set of saved playlists, the active one, and the login/validation
/// logic for both Xtream and M3U sources.
class AuthRepository {
  AuthRepository(this._secure, this._supabase);

  final SecureStorageService _secure;
  final SupabaseService _supabase;

  Future<List<PlaylistConfig>> playlists() => _secure.readPlaylists();

  Future<PlaylistConfig?> activePlaylist() => _secure.readActivePlaylist();

  /// Validates Xtream credentials by hitting `player_api.php`.
  Future<Result<XtreamAccountInfo>> testXtream(PlaylistConfig config) async {
    if (config.normalizedServer.isEmpty ||
        config.username.isEmpty ||
        config.password.isEmpty) {
      return Err(
        Failure.auth('Please fill in the server, username and password.'),
      );
    }
    final api = XtreamApi(config);
    try {
      final info = await api.authenticate();
      return Ok(info);
    } on Failure catch (f) {
      return Err(f);
    } catch (e) {
      log.e('testXtream failed', error: e);
      return Err(Failure.server('$e'));
    } finally {
      api.close();
    }
  }

  /// Validates an M3U URL by fetching and parsing it, returning the channel
  /// count discovered.
  Future<Result<int>> testM3u(PlaylistConfig config) async {
    final url = config.m3uUrl.trim();
    if (url.isEmpty) {
      return Err(Failure.parse('Please enter a playlist URL.'));
    }
    final dio = _m3uDio();
    try {
      final body = await _readM3uBody(url, dio);
      if (!body.contains('#EXTINF') && !body.contains('#EXTM3U')) {
        return Err(
          Failure.parse('That URL did not return a valid M3U playlist.'),
        );
      }
      final parsed = M3uParser.parse(body);
      if (parsed.channels.isEmpty) {
        return Err(Failure.parse('No channels found in that playlist.'));
      }
      return Ok(parsed.channels.length);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        return Err(Failure.timeout());
      }
      return Err(Failure.network('Could not download the playlist.'));
    } catch (e) {
      return Err(Failure.parse('$e'));
    } finally {
      dio.close(force: true);
    }
  }

  Dio _m3uDio() => Dio(
    BaseOptions(
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      responseType: ResponseType.plain,
      headers: const {'User-Agent': 'MoPlayerPro/1.0'},
    ),
  );

  Future<String> _readM3uBody(String url, Dio dio) async {
    if (url.startsWith('asset://')) {
      final asset = 'assets/${url.substring('asset://'.length)}';
      return rootBundle.loadString(asset);
    }
    final res = await dio.get<String>(url);
    return res.data ?? '';
  }

  /// Persists a playlist and makes it the active source.
  Future<void> saveAndActivate(PlaylistConfig config) async {
    final list = [...await _secure.readPlaylists()];
    final existingIndex = list.indexWhere((p) => p.id == config.id);
    final stamped = config.copyWith(
      createdAt: config.createdAt ?? DateTime.now(),
    );
    if (existingIndex >= 0) {
      list[existingIndex] = stamped;
    } else {
      list.add(stamped);
    }
    await _secure.writePlaylists(list);
    await _secure.writeActivePlaylist(stamped);
  }

  Future<void> setActive(PlaylistConfig config) =>
      _secure.writeActivePlaylist(config);

  Future<void> removePlaylist(String id) async {
    final list = [...await _secure.readPlaylists()];
    list.removeWhere((p) => p.id == id);
    await _secure.writePlaylists(list);
    final active = await _secure.readActivePlaylist();
    if (active?.id == id) {
      await _secure.writeActivePlaylist(list.isNotEmpty ? list.first : null);
    }
  }

  /// Clears the active session (keeps saved playlists so the user can pick one
  /// again) — used by Settings → Logout.
  Future<void> logout() async {
    await _secure.writeActivePlaylist(null);
  }

  bool get cloudEnabled => _supabase.enabled;
}
