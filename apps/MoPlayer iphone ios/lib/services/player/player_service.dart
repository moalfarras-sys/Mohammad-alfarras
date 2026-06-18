import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';

import '../../models/media_kind.dart';

/// A description of something to play.
class PlayableMedia {
  const PlayableMedia({
    required this.url,
    required this.title,
    required this.kind,
    this.subtitle,
    this.startAt = Duration.zero,
    this.headers = const {'User-Agent': 'MoPlayerPro/1.0'},
  });

  final String url;
  final String title;
  final String? subtitle;
  final MediaKind kind;
  final Duration startAt;
  final Map<String, String> headers;

  bool get isLive => kind == MediaKind.live;

  PlayableMedia copyWith({Duration? startAt}) => PlayableMedia(
    url: url,
    title: title,
    kind: kind,
    subtitle: subtitle,
    startAt: startAt ?? this.startAt,
    headers: headers,
  );
}

/// Wraps a single media_kit [Player] + [VideoController]. The widget layer
/// observes the player's streams directly for buffering / position / errors.
class PlayerService {
  PlayerService()
    : _player = Player(
        configuration: const PlayerConfiguration(
          // A modest buffer keeps live channels snappy while smoothing VOD.
          bufferSize: 32 * 1024 * 1024,
          title: 'MoPlayer Pro',
        ),
      ) {
    _controller = VideoController(_player);
  }

  final Player _player;
  late final VideoController _controller;

  Player get player => _player;
  VideoController get controller => _controller;

  // Convenience stream/state passthroughs.
  Stream<Duration> get positionStream => _player.stream.position;
  Stream<Duration> get durationStream => _player.stream.duration;
  Stream<bool> get bufferingStream => _player.stream.buffering;
  Stream<bool> get playingStream => _player.stream.playing;
  Stream<bool> get completedStream => _player.stream.completed;
  Stream<String> get errorStream => _player.stream.error;
  Stream<Tracks> get tracksStream => _player.stream.tracks;
  Stream<Track> get selectedTrackStream => _player.stream.track;

  Duration get position => _player.state.position;
  Duration get duration => _player.state.duration;
  bool get isPlaying => _player.state.playing;
  Tracks get tracks => _player.state.tracks;
  Track get selectedTrack => _player.state.track;

  Future<void> open(PlayableMedia media) async {
    await _player.open(
      Media(media.url, httpHeaders: media.headers),
      play: true,
    );
    if (media.startAt > Duration.zero && !media.isLive) {
      // Seek once the demuxer has reported a duration.
      _player.stream.duration.firstWhere((d) => d > Duration.zero).then((_) {
        _player.seek(media.startAt);
      });
    }
  }

  Future<void> playOrPause() => _player.playOrPause();
  Future<void> play() => _player.play();
  Future<void> pause() => _player.pause();
  Future<void> seek(Duration position) => _player.seek(position);
  Future<void> setVolume(double volume) => _player.setVolume(volume);
  Future<void> setRate(double rate) => _player.setRate(rate);
  Future<void> setAudioTrack(AudioTrack track) => _player.setAudioTrack(track);
  Future<void> setSubtitleTrack(SubtitleTrack track) =>
      _player.setSubtitleTrack(track);
  Future<void> stop() => _player.stop();

  Future<void> dispose() => _player.dispose();
}
