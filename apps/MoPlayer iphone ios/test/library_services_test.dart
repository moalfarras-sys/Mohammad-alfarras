import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:moplayer_pro/models/library_items.dart';
import 'package:moplayer_pro/models/media_kind.dart';
import 'package:moplayer_pro/models/playlist_config.dart';
import 'package:moplayer_pro/models/series.dart';
import 'package:moplayer_pro/services/m3u/m3u_parser.dart';
import 'package:moplayer_pro/services/xtream/xtream_url_builder.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('M3U parser extracts channels, logos, categories, and URLs', () {
    const playlist = '''
#EXTM3U
#EXTINF:-1 tvg-id="news.us" tvg-name="News HD" tvg-logo="https://cdn.test/news.png" group-title="News",News HD
http://stream.test/live/news.m3u8
#EXTINF:-1 group-title="Sports",Sports One
http://stream.test/live/sports.ts
''';

    final parsed = M3uParser.parse(playlist);

    expect(parsed.channels, hasLength(2));
    expect(parsed.categories.map((category) => category.name), [
      'News',
      'Sports',
    ]);
    expect(parsed.channels.first.name, 'News HD');
    expect(parsed.channels.first.logo, 'https://cdn.test/news.png');
    expect(
      parsed.channels.first.directUrl,
      'http://stream.test/live/news.m3u8',
    );
    expect(parsed.channels.first.containerExtension, 'm3u8');
  });

  test('M3U parser accepts single-quoted attributes and stable ids', () {
    const playlist = '''
#EXTM3U
#EXTINF:-1 tvg-id='kids.one' tvg-name='Kids One' tvg-logo='https://cdn.test/kids.png' group-title='Kids',Kids One
http://stream.test/live/kids.m3u8
''';

    final first = M3uParser.parse(playlist).channels.single;
    final second = M3uParser.parse(playlist).channels.single;

    expect(first.name, 'Kids One');
    expect(first.categoryId, 'Kids');
    expect(first.logo, 'https://cdn.test/kids.png');
    expect(first.streamId, second.streamId);
  });

  test('Series detail parses integer-keyed maps and flat episode lists', () {
    const base = SeriesItem(seriesId: '10', name: 'Show');
    final mapDetail = SeriesDetail.fromXtream({
      'episodes': {
        1: [
          {'id': 'e1', 'title': 'One', 'episode_num': '1'},
        ],
      },
    }, base);
    final flatDetail = SeriesDetail.fromXtream({
      'episodes': [
        {'id': 'e2', 'title': 'Two', 'episode_num': '2', 'season': '3'},
      ],
    }, base);

    expect(mapDetail.seasons.single.number, 1);
    expect(mapDetail.seasons.single.episodes.single.id, 'e1');
    expect(flatDetail.seasons.single.number, 3);
    expect(flatDetail.seasons.single.episodes.single.id, 'e2');
  });

  test('Xtream URL builder normalizes server and encodes credentials', () {
    const config = PlaylistConfig(
      id: 'test',
      type: PlaylistType.xtream,
      name: 'Panel',
      serverUrl: 'panel.test:8080/',
      username: 'mo user',
      password: 'p@ss word',
    );

    final builder = XtreamUrlBuilder(config);

    expect(
      builder.liveStream('42'),
      'http://panel.test:8080/live/mo%20user/p%40ss%20word/42.m3u8',
    );
    expect(
      builder.movieStream('77', ext: ''),
      'http://panel.test:8080/movie/mo%20user/p%40ss%20word/77.mp4',
    );
    expect(builder.playerApi('get_live_streams').queryParameters, {
      'username': 'mo user',
      'password': 'p@ss word',
      'action': 'get_live_streams',
    });
  });

  test('Favorite item round-trips media identity and payload', () {
    final createdAt = DateTime.utc(2026, 6, 18, 12, 30);
    final favorite = FavoriteItem(
      playlistId: 'playlist-1',
      kind: MediaKind.movie,
      refId: 'movie-42',
      title: 'Test Movie',
      imageUrl: 'https://cdn.test/movie.jpg',
      subtitle: '2026',
      payload: {'stream_id': 42, 'container_extension': 'mkv'},
      createdAt: createdAt,
    );

    final restored = FavoriteItem.fromJson(favorite.toJson());

    expect(restored.key, 'playlist-1:movie:movie-42');
    expect(restored.title, 'Test Movie');
    expect(restored.imageUrl, 'https://cdn.test/movie.jpg');
    expect(restored.subtitle, '2026');
    expect(restored.payload['stream_id'], 42);
    expect(restored.createdAt, createdAt);
  });

  test('Bundled legal review playlist parses as M3U', () async {
    final body = await rootBundle.loadString('assets/demo/review_playlist.m3u');
    final parsed = M3uParser.parse(body);

    expect(parsed.channels, isNotEmpty);
    expect(parsed.categories.single.name, 'Legal Demo');
    expect(parsed.channels.first.name, 'Open HLS Demo');
    expect(parsed.channels.first.directUrl, startsWith('https://'));
  });
}
