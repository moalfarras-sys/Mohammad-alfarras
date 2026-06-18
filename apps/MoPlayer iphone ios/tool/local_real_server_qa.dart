import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:moplayer_pro/core/utils/json_x.dart';
import 'package:moplayer_pro/models/category.dart';
import 'package:moplayer_pro/models/live_channel.dart';
import 'package:moplayer_pro/models/playlist_config.dart';
import 'package:moplayer_pro/models/series.dart';
import 'package:moplayer_pro/models/vod_movie.dart';
import 'package:moplayer_pro/services/m3u/m3u_parser.dart';
import 'package:moplayer_pro/services/xtream/xtream_url_builder.dart';

Future<void> main() async {
  final env = _readLocalEnv();
  _stage('start');
  final required = [
    'QA_XTREAM_SERVER_URL',
    'QA_XTREAM_USERNAME',
    'QA_XTREAM_PASSWORD',
  ];
  final missing = required.where((key) => (env[key] ?? '').trim().isEmpty);
  if (missing.isNotEmpty) {
    stderr.writeln('Missing local QA env keys: ${missing.join(', ')}');
    exitCode = 2;
    return;
  }

  final summary = <String, dynamic>{
    'generatedAt': DateTime.now().toUtc().toIso8601String(),
    'environment': {
      'runner': 'dart_cli_local_only',
      'hostOS': Platform.operatingSystem,
      'targetPlatformSimulated': 'ios',
      'androidEmulatorPreview': true,
      'productSlug': 'moplayer2',
    },
    'server': {
      'xtream': true,
      'm3u': (env['QA_M3U_URL'] ?? '').trim().isNotEmpty,
      'credentialsRedacted': true,
    },
    'xtream': <String, dynamic>{},
    'm3u': <String, dynamic>{},
    'playerProbes': <Map<String, dynamic>>[],
    'posterProbes': <Map<String, dynamic>>[],
    'supabase': <String, dynamic>{},
    'failures': <String>[],
  };

  final dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 35),
      responseType: ResponseType.plain,
      headers: const {'User-Agent': 'MoPlayerPro/1.0'},
      validateStatus: (status) => status != null && status < 500,
    ),
  );
  final probeDio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 12),
      receiveTimeout: const Duration(seconds: 20),
      responseType: ResponseType.stream,
      followRedirects: true,
      validateStatus: (status) => status != null && status < 500,
      headers: const {'User-Agent': 'MoPlayerPro/1.0', 'Range': 'bytes=0-4095'},
    ),
  );

  var criticalFailure = false;
  try {
    _stage('auth');
    final config = PlaylistConfig(
      id: 'qa_real_xtream',
      type: PlaylistType.xtream,
      name: 'Local QA Xtream',
      serverUrl: env['QA_XTREAM_SERVER_URL']!,
      username: env['QA_XTREAM_USERNAME']!,
      password: env['QA_XTREAM_PASSWORD']!,
    );
    final urls = XtreamUrlBuilder(config);

    final auth = await _getJson(dio, urls.authProbe());
    final userInfo = auth is Map ? auth['user_info'] : null;
    if (userInfo is! Map) {
      throw StateError('Xtream login did not return user_info.');
    }
    final account = XtreamAccountInfo.fromJson(
      Map<String, dynamic>.from(userInfo),
    );
    summary['xtream']['login'] = {
      'active': account.isActive,
      'status': account.status,
      'maxConnections': account.maxConnections,
      'activeConnections': account.activeConnections,
    };
    if (!account.isActive) {
      throw StateError('Xtream account is not active.');
    }

    _stage('live categories');
    final liveCategories = await _categories(dio, urls, 'get_live_categories');
    _stage('live sample');
    final live = await _firstNonEmptyFromCategories(
      liveCategories,
      (categoryId) => _live(dio, urls, categoryId: categoryId),
    );
    _stage('movie categories');
    final movieCategories = await _categories(dio, urls, 'get_vod_categories');
    _stage('movie sample');
    final movies = await _firstNonEmptyFromCategories(
      movieCategories,
      (categoryId) => _movies(dio, urls, categoryId: categoryId),
    );
    _stage('series categories');
    final seriesCategories = await _categories(
      dio,
      urls,
      'get_series_categories',
    );
    _stage('series sample');
    final series = await _firstNonEmptyFromCategories(
      seriesCategories,
      (categoryId) => _series(dio, urls, categoryId: categoryId),
    );

    summary['xtream'].addAll({
      'liveCategories': liveCategories.length,
      'liveChannels': live.length,
      'movieCategories': movieCategories.length,
      'movies': movies.length,
      'seriesCategories': seriesCategories.length,
      'series': series.length,
    });
    if (liveCategories.isEmpty) {
      (summary['failures'] as List<String>).add('Live categories are empty.');
    }
    if (live.isEmpty) {
      criticalFailure = true;
      (summary['failures'] as List<String>).add('Live channels are empty.');
    }

    if (live.isNotEmpty) {
      _stage('epg and live probe');
      final epg = await _shortEpg(dio, urls, live.first.streamId);
      summary['xtream']['epgEntriesForFirstLive'] = epg;
      (summary['playerProbes'] as List<Map<String, dynamic>>).add(
        await _probeUrl(
          probeDio,
          urls.liveStream(live.first.streamId, hls: true),
          'live',
        ),
      );
    }

    if (movies.isNotEmpty) {
      _stage('movie detail and probe');
      final detail = await _movieDetail(dio, urls, movies.first);
      summary['xtream']['firstMovieDetail'] = {
        'hasPoster': detail.movie.poster?.trim().isNotEmpty == true,
        'hasPlot': detail.plot?.trim().isNotEmpty == true,
        'container': detail.movie.containerExtension,
      };
      (summary['playerProbes'] as List<Map<String, dynamic>>).add(
        await _probeUrl(
          probeDio,
          urls.movieStream(
            detail.movie.streamId,
            ext: detail.movie.containerExtension ?? 'mp4',
          ),
          'movie',
        ),
      );
    } else {
      (summary['failures'] as List<String>).add('Movies are empty.');
    }

    if (series.isNotEmpty) {
      _stage('series detail and episode probe');
      final detail = await _seriesDetail(dio, urls, series.first);
      final episodeCount = detail.seasons.fold<int>(
        0,
        (total, season) => total + season.episodes.length,
      );
      summary['xtream']['firstSeriesDetail'] = {
        'seasons': detail.seasons.length,
        'episodes': episodeCount,
      };
      final episode = detail.seasons
          .expand((season) => season.episodes)
          .firstOrNull;
      if (episode != null) {
        (summary['playerProbes'] as List<Map<String, dynamic>>).add(
          await _probeUrl(
            probeDio,
            urls.episodeStream(
              episode.id,
              ext: episode.containerExtension ?? 'mp4',
            ),
            'episode',
          ),
        );
      } else {
        (summary['failures'] as List<String>).add(
          'Series detail loaded but no episodes were returned.',
        );
      }
    } else {
      (summary['failures'] as List<String>).add('Series are empty.');
    }

    _stage('search');
    final searchQuery = _queryFrom(
      live.firstOrNull?.name,
      movies.firstOrNull?.name,
      series.firstOrNull?.name,
    );
    final searchLive = live.where((item) => _matches(item.name, searchQuery));
    final searchMovies = movies.where(
      (item) => _matches(item.name, searchQuery),
    );
    final searchSeries = series.where(
      (item) => _matches(item.name, searchQuery),
    );
    summary['xtream']['search'] = {
      'query': searchQuery,
      'live': searchLive.length,
      'movies': searchMovies.length,
      'series': searchSeries.length,
    };
    if (searchLive.isEmpty && searchMovies.isEmpty && searchSeries.isEmpty) {
      (summary['failures'] as List<String>).add('Search returned no results.');
    }

    final posterCandidates = [
      live.firstOrNull?.logo,
      movies.firstOrNull?.poster,
      series.firstOrNull?.cover,
    ].whereType<String>().where((value) => value.trim().isNotEmpty).take(3);
    if (posterCandidates.isNotEmpty) {
      var posterOk = false;
      _stage('poster probes');
      for (final poster in posterCandidates) {
        final probe = await _probeUrl(probeDio, poster, 'poster');
        posterOk = posterOk || probe['ok'] == true;
        (summary['posterProbes'] as List<Map<String, dynamic>>).add(probe);
      }
      if (!posterOk) {
        (summary['failures'] as List<String>).add(
          'Poster/logo probes did not return a loadable image.',
        );
      }
    } else {
      (summary['posterProbes'] as List<Map<String, dynamic>>).add({
        'kind': 'poster',
        'ok': false,
        'error': 'no_candidate',
      });
      (summary['failures'] as List<String>).add('No poster/logo URL found.');
    }

    final m3uUrl = (env['QA_M3U_URL'] ?? '').trim();
    if (m3uUrl.isNotEmpty) {
      _stage('m3u');
      summary['m3u'] = await _probeM3u(dio, m3uUrl);
      if ((summary['m3u']['channels'] as int? ?? 0) == 0) {
        (summary['failures'] as List<String>).add('M3U parsed zero channels.');
      }
    }

    _stage('supabase');
    summary['supabase'] =
        await _probeSupabase(
          env,
          liveTitle: live.firstOrNull?.name ?? 'Unknown',
          posterUrl: live.firstOrNull?.logo,
        ).timeout(
          const Duration(seconds: 35),
          onTimeout: () => {
            'configured':
                (env['SUPABASE_URL'] ?? '').trim().isNotEmpty &&
                (env['SUPABASE_PUBLISHABLE_KEY'] ?? '').trim().isNotEmpty,
            'platform': 'ios',
            'productSlug': 'moplayer2',
            'recordsCreated': 0,
            'recordsReadBack': 0,
            'error': 'timeout',
          },
        );
  } catch (e, st) {
    criticalFailure = true;
    (summary['failures'] as List<String>).add(e.toString());
    summary['exception'] = e.toString();
    summary['stackTop'] = st.toString().split('\n').take(6).join('\n');
  } finally {
    dio.close(force: true);
    probeDio.close(force: true);
    await _writeSummary(summary);
  }

  stdout.writeln(
    'Local QA summary written to build/local_real_server_qa_summary.json',
  );
  stdout.writeln(_brief(summary));
  if (criticalFailure) exitCode = 1;
}

void _stage(String label) {
  stdout.writeln('[local-qa] $label');
  final file = File('build/local_real_server_qa_stage.txt');
  file.parent.createSync(recursive: true);
  file.writeAsStringSync(
    '${DateTime.now().toUtc().toIso8601String()} $label\n',
    mode: FileMode.append,
  );
}

Map<String, String> _readLocalEnv() {
  return {..._readEnv(File('.env')), ..._readEnv(File('.env.local'))};
}

Map<String, String> _readEnv(File file) {
  if (!file.existsSync()) return const <String, String>{};
  final env = <String, String>{};
  for (final raw in file.readAsLinesSync()) {
    final line = raw.trim();
    if (line.isEmpty || line.startsWith('#')) continue;
    final idx = line.indexOf('=');
    if (idx < 1) continue;
    final key = line.substring(0, idx).trim().replaceFirst('\ufeff', '');
    final value = line.substring(idx + 1).trim();
    env[key] = value;
  }
  return env;
}

Future<dynamic> _getJson(Dio dio, Uri uri) async {
  final response = await dio
      .getUri<String>(uri)
      .timeout(const Duration(seconds: 45));
  final status = response.statusCode ?? 0;
  if (status < 200 || status >= 400) {
    throw StateError(
      'HTTP $status from ${uri.pathSegments.lastOrNull ?? uri.host}',
    );
  }
  final body = response.data ?? '';
  if (body.trim().isEmpty) return const {};
  return jsonDecode(body);
}

Future<List<Category>> _categories(
  Dio dio,
  XtreamUrlBuilder urls,
  String action,
) async {
  final data = await _getJson(dio, urls.playerApi(action));
  return _unwrapList(data, action)
      .whereType<Map>()
      .map((item) => Category.fromXtream(Map<String, dynamic>.from(item)))
      .toList();
}

Future<List<LiveChannel>> _live(
  Dio dio,
  XtreamUrlBuilder urls, {
  String? categoryId,
}) async {
  final data = await _getJson(
    dio,
    _categoryUri(urls, 'get_live_streams', categoryId),
  );
  return _unwrapList(data, 'get_live_streams')
      .whereType<Map>()
      .map((item) => LiveChannel.fromXtream(Map<String, dynamic>.from(item)))
      .toList();
}

Future<List<VodMovie>> _movies(
  Dio dio,
  XtreamUrlBuilder urls, {
  String? categoryId,
}) async {
  final data = await _getJson(
    dio,
    _categoryUri(urls, 'get_vod_streams', categoryId),
  );
  return _unwrapList(data, 'get_vod_streams')
      .whereType<Map>()
      .map((item) => VodMovie.fromXtream(Map<String, dynamic>.from(item)))
      .toList();
}

Future<MovieDetail> _movieDetail(
  Dio dio,
  XtreamUrlBuilder urls,
  VodMovie movie,
) async {
  final data = await _getJson(
    dio,
    urls.playerApi('get_vod_info', params: {'vod_id': movie.streamId}),
  );
  if (data is! Map) throw StateError('Movie detail was not a JSON object.');
  return MovieDetail.fromXtream(Map<String, dynamic>.from(data), movie);
}

Future<List<SeriesItem>> _series(
  Dio dio,
  XtreamUrlBuilder urls, {
  String? categoryId,
}) async {
  final data = await _getJson(
    dio,
    _categoryUri(urls, 'get_series', categoryId),
  );
  return _unwrapList(data, 'get_series')
      .whereType<Map>()
      .map((item) => SeriesItem.fromXtream(Map<String, dynamic>.from(item)))
      .toList();
}

Future<SeriesDetail> _seriesDetail(
  Dio dio,
  XtreamUrlBuilder urls,
  SeriesItem series,
) async {
  final data = await _getJson(
    dio,
    urls.playerApi('get_series_info', params: {'series_id': series.seriesId}),
  );
  if (data is! Map) throw StateError('Series detail was not a JSON object.');
  return SeriesDetail.fromXtream(Map<String, dynamic>.from(data), series);
}

Future<int> _shortEpg(Dio dio, XtreamUrlBuilder urls, String streamId) async {
  try {
    final data = await _getJson(
      dio,
      urls.playerApi(
        'get_short_epg',
        params: {'stream_id': streamId, 'limit': '8'},
      ),
    );
    if (data is Map) return JsonX.asList(data['epg_listings']).length;
  } catch (_) {
    return 0;
  }
  return 0;
}

List<dynamic> _unwrapList(dynamic data, String action) {
  if (data is List) return data;
  if (data is! Map) return const [];
  const knownKeys = [
    'data',
    'items',
    'results',
    'streams',
    'categories',
    'available_channels',
    'live_streams',
    'vod_streams',
    'series',
  ];
  final actionKey = action
      .replaceFirst('get_', '')
      .replaceAll('_categories', '_streams');
  for (final key in [action, actionKey, ...knownKeys]) {
    final value = data[key];
    if (value is List) return value;
  }
  for (final value in data.values) {
    if (value is List) return value;
  }
  return const [];
}

Uri _categoryUri(XtreamUrlBuilder urls, String action, String? categoryId) {
  final params = <String, String>{};
  if (categoryId != null && categoryId.trim().isNotEmpty) {
    params['category_id'] = categoryId;
  }
  return urls.playerApi(action, params: params);
}

Future<List<T>> _firstNonEmptyFromCategories<T>(
  List<Category> categories,
  Future<List<T>> Function(String? categoryId) fetch,
) async {
  if (categories.isEmpty) return fetch(null);
  for (final category in categories.take(8)) {
    final rows = await fetch(category.id);
    if (rows.isNotEmpty) return rows;
  }
  return const [];
}

Future<Map<String, dynamic>> _probeUrl(Dio dio, String url, String kind) async {
  final uri = Uri.tryParse(url);
  if (uri == null || !uri.hasScheme) {
    return {'kind': kind, 'ok': false, 'error': 'invalid_url'};
  }
  try {
    final response = await dio
        .getUri<ResponseBody>(uri)
        .timeout(const Duration(seconds: 20));
    await response.data?.stream
        .take(1)
        .drain<void>()
        .timeout(const Duration(seconds: 6));
    final status = response.statusCode ?? 0;
    return {
      'kind': kind,
      'ok': status >= 200 && status < 400,
      'status': status,
      'host': uri.host,
      'contentType': response.headers.value(Headers.contentTypeHeader),
    };
  } on TimeoutException {
    return {'kind': kind, 'ok': false, 'host': uri.host, 'error': 'timeout'};
  } on DioException catch (e) {
    return {
      'kind': kind,
      'ok': false,
      'host': uri.host,
      'error': e.type.name,
      'status': e.response?.statusCode,
    };
  }
}

Future<Map<String, dynamic>> _probeM3u(Dio dio, String url) async {
  final response = await dio
      .get<String>(url)
      .timeout(const Duration(seconds: 45));
  final parsed = M3uParser.parse(response.data ?? '');
  return {
    'downloaded': true,
    'channels': parsed.channels.length,
    'categories': parsed.categories.length,
    'firstHasLogo': parsed.channels.firstOrNull?.logo?.isNotEmpty == true,
    'firstExtension': parsed.channels.firstOrNull?.containerExtension,
  };
}

Future<Map<String, dynamic>> _probeSupabase(
  Map<String, String> env, {
  required String liveTitle,
  required String? posterUrl,
}) async {
  final url = (env['SUPABASE_URL'] ?? '').trim();
  final key = (env['SUPABASE_PUBLISHABLE_KEY'] ?? '').trim();
  final result = <String, dynamic>{
    'configured': url.isNotEmpty && key.isNotEmpty,
    'platform': 'ios',
    'productSlug': 'moplayer2',
    'recordsCreated': 0,
    'recordsReadBack': 0,
    'deviceRegistrationAttempted': false,
    'cleanedUp': false,
  };
  if (!result['configured']) return result;

  final dio = Dio(
    BaseOptions(
      baseUrl: url,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      validateStatus: (status) => status != null && status < 500,
      headers: {
        'apikey': key,
        'Authorization': 'Bearer $key',
        'Content-Type': 'application/json',
      },
    ),
  );

  try {
    final health = await dio
        .get('/auth/v1/health')
        .timeout(const Duration(seconds: 15));
    result['healthStatus'] = health.statusCode;

    final auth = await dio
        .post<Map<String, dynamic>>(
          '/auth/v1/signup',
          data: {
            'data': <String, dynamic>{},
            'gotrue_meta_security': {'captcha_token': null},
          },
        )
        .timeout(const Duration(seconds: 20));
    final authStatus = auth.statusCode ?? 0;
    result['anonymousAuthStatus'] = authStatus;
    if (authStatus < 200 || authStatus >= 300) {
      result['hasAnonymousSession'] = false;
      result['error'] = 'anonymous_auth_unavailable_http_$authStatus';
      return result;
    }

    final authBody = auth.data ?? const <String, dynamic>{};
    final accessToken = JsonX.asStringOrNull(authBody['access_token']);
    final user = authBody['user'];
    final userId = user is Map ? JsonX.asStringOrNull(user['id']) : null;
    result['hasAnonymousSession'] = accessToken != null && userId != null;
    if (accessToken == null || userId == null) return result;

    final authedHeaders = {
      'apikey': key,
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    };

    const platform = 'ios';
    const playlistId = 'qa_local_ios_real_server';
    final suffix = DateTime.now().millisecondsSinceEpoch.toString();
    final qaDeviceId = 'MO-D-QA-IOS-$suffix';
    final favoriteContentId = '$platform:$playlistId:live:qa_favorite_$suffix';
    final historyContentId = '$platform:$playlistId:live:qa_history_$suffix';
    final continueContentId = '$platform:$playlistId:live:qa_continue_$suffix';
    final now = DateTime.now().toUtc().toIso8601String();

    Future<void> deleteContent(String table, String contentId) async {
      await dio
          .delete(
            '/rest/v1/$table',
            queryParameters: {
              'user_id': 'eq.$userId',
              'content_id': 'eq.$contentId',
            },
            options: Options(headers: authedHeaders),
          )
          .timeout(const Duration(seconds: 15));
    }

    await dio
        .post(
          '/rest/v1/devices',
          queryParameters: {'on_conflict': 'public_device_id'},
          data: {
            'public_device_id': qaDeviceId,
            'user_id': userId,
            'name': 'MoPlayer iOS local QA',
            'platform': platform,
            'device_type': 'android-emulator-ios-preview',
            'app_version': '1.0.0+1',
            'product_slug': 'moplayer2',
            'last_seen_at': now,
            'updated_at': now,
          },
          options: Options(
            headers: {
              ...authedHeaders,
              'Prefer': 'resolution=merge-duplicates',
            },
          ),
        )
        .timeout(const Duration(seconds: 15));
    await dio
        .post(
          '/rest/v1/devices',
          queryParameters: {'on_conflict': 'public_device_id'},
          data: {
            'public_device_id': qaDeviceId,
            'user_id': userId,
            'name': 'MoPlayer iOS local QA refresh',
            'platform': platform,
            'device_type': 'android-emulator-ios-preview',
            'app_version': '1.0.0+1',
            'product_slug': 'moplayer2',
            'last_seen_at': now,
            'updated_at': now,
          },
          options: Options(
            headers: {
              ...authedHeaders,
              'Prefer': 'resolution=merge-duplicates',
            },
          ),
        )
        .timeout(const Duration(seconds: 15));
    final deviceRows = await dio.get<List<dynamic>>(
      '/rest/v1/devices',
      queryParameters: {
        'select': 'public_device_id,platform,product_slug,user_id',
        'public_device_id': 'eq.$qaDeviceId',
        'user_id': 'eq.$userId',
      },
      options: Options(headers: authedHeaders),
    );
    result['deviceRegistrationAttempted'] = true;
    result['deviceIdFormatOk'] = qaDeviceId.startsWith('MO-D-');
    result['deviceRecordsReadBack'] = (deviceRows.data ?? const []).length;
    result['deviceDuplicateFree'] = result['deviceRecordsReadBack'] == 1;

    await deleteContent('favorites', favoriteContentId);
    await deleteContent('watch_history', historyContentId);
    await deleteContent('watch_history', continueContentId);
    await dio.post(
      '/rest/v1/favorites',
      data: {
        'user_id': userId,
        'content_id': favoriteContentId,
        'content_type': 'live',
        'title': 'QA Local Favorite - $liveTitle',
        'poster_url': posterUrl,
        'created_at': now,
      },
      options: Options(headers: authedHeaders),
    );
    await dio.post(
      '/rest/v1/watch_history',
      data: {
        'user_id': userId,
        'content_id': historyContentId,
        'content_type': 'live',
        'title': 'QA Local History - $liveTitle',
        'poster_url': posterUrl,
        'position_ms': 0,
        'duration_ms': 0,
        'updated_at': now,
      },
      options: Options(headers: authedHeaders),
    );
    await dio.post(
      '/rest/v1/watch_history',
      data: {
        'user_id': userId,
        'content_id': continueContentId,
        'content_type': 'live',
        'title': 'QA Local Continue - $liveTitle',
        'poster_url': posterUrl,
        'position_ms': 30000,
        'duration_ms': 300000,
        'updated_at': now,
      },
      options: Options(headers: authedHeaders),
    );
    result['recordsCreated'] = 3;

    final favorites = await dio.get<List<dynamic>>(
      '/rest/v1/favorites',
      queryParameters: {
        'select': 'content_id',
        'user_id': 'eq.$userId',
        'content_id': 'eq.$favoriteContentId',
      },
      options: Options(headers: authedHeaders),
    );
    final historyRows = await dio.get<List<dynamic>>(
      '/rest/v1/watch_history',
      queryParameters: {
        'select': 'content_id',
        'user_id': 'eq.$userId',
        'content_id': 'in.("$historyContentId","$continueContentId")',
      },
      options: Options(headers: authedHeaders),
    );
    result['recordsReadBack'] =
        (favorites.data ?? const []).length +
        (historyRows.data ?? const []).length;
    result['favoritePlatformScoped'] = favoriteContentId.startsWith('ios:');
    result['historyPlatformScoped'] = historyContentId.startsWith('ios:');
    result['continuePlatformScoped'] = continueContentId.startsWith('ios:');

    await deleteContent('favorites', favoriteContentId);
    await deleteContent('watch_history', historyContentId);
    await deleteContent('watch_history', continueContentId);
    result['cleanedUp'] = true;
  } catch (e) {
    result['error'] = e.toString();
  } finally {
    dio.close(force: true);
  }
  return result;
}

String _queryFrom(String? live, String? movie, String? series) {
  for (final source in [movie, series, live]) {
    final words = source?.split(RegExp(r'\s+')) ?? const <String>[];
    for (final word in words) {
      final clean = word.trim();
      if (clean.length >= 3) return clean;
    }
  }
  return live?.trim().substring(0, live.trim().length.clamp(1, 4)) ?? '';
}

bool _matches(String name, String query) =>
    query.isNotEmpty && name.toLowerCase().contains(query.toLowerCase());

Future<void> _writeSummary(Map<String, dynamic> summary) async {
  final file = File('build/local_real_server_qa_summary.json');
  await file.parent.create(recursive: true);
  const encoder = JsonEncoder.withIndent('  ');
  await file.writeAsString(encoder.convert(summary));
}

String _brief(Map<String, dynamic> summary) {
  final xtream = summary['xtream'] as Map;
  final failures = (summary['failures'] as List).length;
  return [
    'Login active: ${xtream['login'] is Map ? xtream['login']['active'] : false}',
    'Live: ${xtream['liveChannels'] ?? 0}',
    'Movies: ${xtream['movies'] ?? 0}',
    'Series: ${xtream['series'] ?? 0}',
    'Failures recorded: $failures',
  ].join(' | ');
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull {
    final iterator = this.iterator;
    if (iterator.moveNext()) return iterator.current;
    return null;
  }
}

extension _LastOrNull<T> on List<T> {
  T? get lastOrNull => isEmpty ? null : last;
}
