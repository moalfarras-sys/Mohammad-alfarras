import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/orientation.dart';
import '../../models/library_items.dart';
import '../../models/media_kind.dart';
import '../../providers/content_providers.dart';
import '../../providers/core_providers.dart';
import '../../providers/library_providers.dart';
import '../../services/player/player_service.dart';
import 'playback_args.dart';

class PlayerScreen extends ConsumerStatefulWidget {
  const PlayerScreen({super.key, required this.args});

  final PlaybackArgs args;

  @override
  ConsumerState<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends ConsumerState<PlayerScreen> {
  final PlayerService _service = PlayerService();
  late PlaybackArgs _args;

  final List<StreamSubscription<dynamic>> _subs = [];
  Timer? _hideTimer;
  Timer? _saveTimer;
  Timer? _recoverTimer;
  Timer? _stallTimer;

  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  double? _dragValue;
  bool _buffering = true;
  bool _playing = false;
  bool _controlsVisible = true;
  bool _locked = false;
  String? _error;
  int _recoverAttempts = 0;
  Tracks _tracks = const Tracks();
  Track _selectedTrack = const Track();

  @override
  void initState() {
    super.initState();
    _args = widget.args;
    OrientationLock.immersive();
    WakelockPlus.enable();
    _attachListeners();
    _open(_args);
    _recordHistory(_args);
    _scheduleHide();
    _saveTimer = Timer.periodic(
      const Duration(seconds: 5),
      (_) => _saveProgress(),
    );
  }

  void _attachListeners() {
    _subs.add(
      _service.bufferingStream.listen((b) {
        if (mounted) {
          setState(() => _buffering = b);
          _handleBufferingChanged(b);
        }
      }),
    );
    _subs.add(
      _service.playingStream.listen((p) {
        if (mounted) setState(() => _playing = p);
      }),
    );
    _subs.add(
      _service.positionStream.listen((p) {
        if (mounted && _dragValue == null) setState(() => _position = p);
      }),
    );
    _subs.add(
      _service.durationStream.listen((d) {
        if (mounted) setState(() => _duration = d);
      }),
    );
    _subs.add(
      _service.errorStream.listen((e) {
        if (mounted) _handlePlaybackError(e);
      }),
    );
    _subs.add(
      _service.completedStream.listen((done) {
        if (done) _onCompleted();
      }),
    );
    _subs.add(
      _service.tracksStream.listen((tracks) {
        if (mounted) setState(() => _tracks = tracks);
      }),
    );
    _subs.add(
      _service.selectedTrackStream.listen((track) {
        if (mounted) setState(() => _selectedTrack = track);
      }),
    );
  }

  Future<void> _open(PlaybackArgs args) async {
    setState(() {
      _error = null;
      _buffering = true;
    });
    try {
      await _service.open(args.media);
      _recoverAttempts = 0;
    } catch (e) {
      if (mounted) _handlePlaybackError('$e');
    }
  }

  void _handlePlaybackError(String message) {
    setState(() => _error = message);
    _scheduleRecovery();
  }

  void _handleBufferingChanged(bool buffering) {
    if (!buffering) {
      _stallTimer?.cancel();
      return;
    }
    _stallTimer?.cancel();
    _stallTimer = Timer(const Duration(seconds: 18), () {
      if (!mounted || !_buffering || _error != null) return;
      _scheduleRecovery();
    });
  }

  void _scheduleRecovery() {
    if (_recoverAttempts >= 3) return;
    _recoverTimer?.cancel();
    final delay = Duration(seconds: 2 + (_recoverAttempts * 2));
    _recoverTimer = Timer(delay, _recoverPlayback);
  }

  Future<void> _recoverPlayback() async {
    if (!mounted) return;
    _recoverAttempts++;
    final resumeAt = _args.media.isLive ? Duration.zero : _position;
    setState(() {
      _error = null;
      _buffering = true;
    });
    try {
      await _service.open(_args.media.copyWith(startAt: resumeAt));
    } catch (e) {
      if (mounted) _handlePlaybackError('$e');
    }
  }

  void _recordHistory(PlaybackArgs args) {
    final cfg = ref.read(activePlaylistProvider);
    if (cfg == null) return;
    ref
        .read(libraryActionsProvider)
        .recordHistory(
          HistoryItem(
            playlistId: cfg.id,
            kind: args.kind,
            refId: args.refId,
            title: args.media.title,
            imageUrl: args.imageUrl,
            payload: args.payload,
          ),
        );
  }

  void _saveProgress() {
    if (!_args.trackProgress) return;
    final cfg = ref.read(activePlaylistProvider);
    if (cfg == null) return;
    final dur = _duration.inSeconds;
    final pos = _position.inSeconds;
    if (dur <= 0 || pos <= 5) return;
    ref
        .read(libraryActionsProvider)
        .saveProgress(
          ContinueWatchingItem(
            playlistId: cfg.id,
            kind: _args.kind,
            refId: _args.refId,
            title: _args.media.title,
            imageUrl: _args.imageUrl,
            positionSecs: pos,
            durationSecs: dur,
            payload: _args.payload,
          ),
        );
  }

  Future<void> _onCompleted() async {
    _saveProgress();
    final autoplay = ref.read(settingsProvider).autoplayNext;
    if (autoplay && _args.hasNextEpisode) {
      _playNextEpisode();
    }
  }

  void _playNextEpisode() {
    final repo = ref.read(contentRepositoryProvider);
    final next = _args.nextEpisode;
    final series = _args.seriesItem;
    if (repo == null || next == null || series == null) return;
    final newArgs = PlaybackArgs(
      media: PlayableMedia(
        url: repo.episodeUrl(next),
        title: '${series.name}  |  S${next.seasonNumber}E${next.episodeNum}',
        kind: MediaKind.episode,
      ),
      refId: next.id,
      imageUrl: next.image ?? series.cover,
      payload: {
        ...next.toPayload(),
        'seriesName': series.name,
        'seriesCover': series.cover,
      },
      seasonEpisodes: _args.seasonEpisodes,
      episodeIndex: (_args.episodeIndex ?? 0) + 1,
      seriesItem: series,
    );
    setState(() {
      _args = newArgs;
      _position = Duration.zero;
      _duration = Duration.zero;
    });
    _open(newArgs);
    _recordHistory(newArgs);
  }

  void _scheduleHide() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 4), () {
      if (mounted && _playing) setState(() => _controlsVisible = false);
    });
  }

  void _toggleControls() {
    if (_locked) return;
    setState(() => _controlsVisible = !_controlsVisible);
    if (_controlsVisible) _scheduleHide();
  }

  void _seekRelative(int seconds) {
    final target = _position + Duration(seconds: seconds);
    final clamped = target < Duration.zero
        ? Duration.zero
        : (target > _duration ? _duration : target);
    _service.seek(clamped);
    _scheduleHide();
  }

  @override
  void dispose() {
    _saveProgress();
    for (final s in _subs) {
      s.cancel();
    }
    _hideTimer?.cancel();
    _saveTimer?.cancel();
    _recoverTimer?.cancel();
    _stallTimer?.cancel();
    _service.dispose();
    WakelockPlus.disable();
    OrientationLock.normalChrome();
    OrientationLock.landscape();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isFav = ref
        .watch(favoritesProvider)
        .any((f) => f.kind == _args.kind && f.refId == _args.refId);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          GestureDetector(
            onTap: _toggleControls,
            behavior: HitTestBehavior.opaque,
            child: Center(
              child: Video(
                controller: _service.controller,
                controls: NoVideoControls,
                fit: BoxFit.contain,
              ),
            ),
          ),
          if (_buffering && _error == null)
            const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          if (_error != null)
            _ErrorOverlay(message: _error!, onRetry: () => _open(_args)),
          if (_locked)
            _LockToggle(
              locked: true,
              onTap: () => setState(() => _locked = false),
            )
          else
            AnimatedOpacity(
              opacity: _controlsVisible ? 1 : 0,
              duration: const Duration(milliseconds: 220),
              child: IgnorePointer(
                ignoring: !_controlsVisible,
                child: _Controls(
                  args: _args,
                  isFav: isFav,
                  playing: _playing,
                  tracks: _tracks,
                  selectedTrack: _selectedTrack,
                  position: _dragValue != null
                      ? Duration(seconds: _dragValue!.round())
                      : _position,
                  duration: _duration,
                  onBack: () => context.pop(),
                  onPlayPause: () {
                    _service.playOrPause();
                    _scheduleHide();
                  },
                  onLock: () => setState(() => _locked = true),
                  onFav: () => _toggleFav(isFav),
                  onTracks: _showTrackMenu,
                  onSeekBackward: () => _seekRelative(-10),
                  onSeekForward: () => _seekRelative(10),
                  onSeekStart: (v) => setState(() => _dragValue = v),
                  onSeekChanged: (v) => setState(() => _dragValue = v),
                  onSeekEnd: (v) {
                    _service.seek(Duration(seconds: v.round()));
                    setState(() {
                      _position = Duration(seconds: v.round());
                      _dragValue = null;
                    });
                    _scheduleHide();
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _toggleFav(bool isFav) {
    final cfg = ref.read(activePlaylistProvider);
    if (cfg == null) return;
    ref
        .read(libraryActionsProvider)
        .toggleFavorite(
          FavoriteItem(
            playlistId: cfg.id,
            kind: _args.kind,
            refId: _args.refId,
            title: _args.media.title,
            imageUrl: _args.imageUrl,
            payload: _args.payload,
          ),
        );
  }

  void _showTrackMenu() {
    _scheduleHide();
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _TrackSheet(
        tracks: _tracks,
        selectedTrack: _selectedTrack,
        onAudio: (track) {
          Navigator.of(context).pop();
          _service.setAudioTrack(track);
        },
        onSubtitle: (track) {
          Navigator.of(context).pop();
          _service.setSubtitleTrack(track);
        },
      ),
    );
  }
}

class _Controls extends StatelessWidget {
  const _Controls({
    required this.args,
    required this.isFav,
    required this.playing,
    required this.tracks,
    required this.selectedTrack,
    required this.position,
    required this.duration,
    required this.onBack,
    required this.onPlayPause,
    required this.onLock,
    required this.onFav,
    required this.onTracks,
    required this.onSeekBackward,
    required this.onSeekForward,
    required this.onSeekStart,
    required this.onSeekChanged,
    required this.onSeekEnd,
  });

  final PlaybackArgs args;
  final bool isFav;
  final bool playing;
  final Tracks tracks;
  final Track selectedTrack;
  final Duration position;
  final Duration duration;
  final VoidCallback onBack;
  final VoidCallback onPlayPause;
  final VoidCallback onLock;
  final VoidCallback onFav;
  final VoidCallback onTracks;
  final VoidCallback onSeekBackward;
  final VoidCallback onSeekForward;
  final ValueChanged<double> onSeekStart;
  final ValueChanged<double> onSeekChanged;
  final ValueChanged<double> onSeekEnd;

  @override
  Widget build(BuildContext context) {
    final isLive = args.kind == MediaKind.live;
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withValues(alpha: 0.55),
            Colors.transparent,
            Colors.black.withValues(alpha: 0.70),
          ],
          stops: const [0.0, 0.45, 1.0],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          child: Column(
            children: [
              Row(
                children: [
                  _RoundButton(icon: Icons.arrow_back_rounded, onTap: onBack),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      args.media.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.title,
                    ),
                  ),
                  if (isLive)
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 8),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.live,
                        borderRadius: BorderRadius.circular(7),
                      ),
                      child: Text(
                        'LIVE',
                        style: AppText.label.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  _RoundButton(
                    icon: isFav
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    color: isFav ? AppColors.primaryBright : null,
                    onTap: onFav,
                  ),
                  const SizedBox(width: 8),
                  if (_hasTrackChoices) ...[
                    _RoundButton(icon: Icons.tune_rounded, onTap: onTracks),
                    const SizedBox(width: 8),
                  ],
                  _RoundButton(icon: Icons.lock_open_rounded, onTap: onLock),
                ],
              ),
              const Spacer(),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (!isLive)
                    _RoundButton(
                      icon: Icons.replay_10_rounded,
                      size: 30,
                      onTap: onSeekBackward,
                    ),
                  const SizedBox(width: 28),
                  GestureDetector(
                    onTap: onPlayPause,
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        gradient: AppColors.orangeGradient,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.45),
                            blurRadius: 24,
                            spreadRadius: -4,
                          ),
                        ],
                      ),
                      child: Icon(
                        playing
                            ? Icons.pause_rounded
                            : Icons.play_arrow_rounded,
                        size: 40,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 28),
                  if (!isLive)
                    _RoundButton(
                      icon: Icons.forward_10_rounded,
                      size: 30,
                      onTap: onSeekForward,
                    ),
                ],
              ),
              const Spacer(),
              if (!isLive) _seekBar(),
            ],
          ),
        ),
      ),
    );
  }

  bool get _hasTrackChoices {
    final audioChoices = tracks.audio.where((track) => track.id != 'auto');
    final subtitleChoices = tracks.subtitle.where(
      (track) => track.id != 'auto',
    );
    return audioChoices.length > 1 ||
        subtitleChoices.length > 1 ||
        selectedTrack.subtitle.id != 'no';
  }

  Widget _seekBar() {
    final max = duration.inSeconds.toDouble();
    final value = position.inSeconds.toDouble().clamp(0, max == 0 ? 1 : max);
    return Row(
      children: [
        Text(
          Fmt.duration(position),
          style: AppText.label.copyWith(color: Colors.white),
        ),
        Expanded(
          child: SliderTheme(
            data: SliderThemeData(
              trackHeight: 3.5,
              activeTrackColor: AppColors.primary,
              inactiveTrackColor: Colors.white24,
              thumbColor: AppColors.primaryBright,
              overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
            ),
            child: Slider(
              min: 0,
              max: max == 0 ? 1 : max,
              value: value.toDouble(),
              onChangeStart: onSeekStart,
              onChanged: max == 0 ? null : onSeekChanged,
              onChangeEnd: onSeekEnd,
            ),
          ),
        ),
        Text(
          Fmt.duration(duration),
          style: AppText.label.copyWith(color: Colors.white),
        ),
      ],
    );
  }
}

class _RoundButton extends StatelessWidget {
  const _RoundButton({
    required this.icon,
    required this.onTap,
    this.size = 22,
    this.color,
  });

  final IconData icon;
  final VoidCallback onTap;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.35),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white24),
        ),
        child: Icon(icon, size: size, color: color ?? Colors.white),
      ),
    );
  }
}

class _LockToggle extends StatelessWidget {
  const _LockToggle({required this.locked, required this.onTap});

  final bool locked;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Align(
        alignment: Alignment.centerRight,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: _RoundButton(
            icon: locked ? Icons.lock_rounded : Icons.lock_open_rounded,
            color: AppColors.primaryBright,
            onTap: onTap,
          ),
        ),
      ),
    );
  }
}

class _ErrorOverlay extends StatelessWidget {
  const _ErrorOverlay({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.black.withValues(alpha: 0.75),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline_rounded,
              color: AppColors.danger,
              size: 46,
            ),
            const SizedBox(height: 14),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                'Playback failed. The stream may be offline or in an '
                'unsupported format.',
                textAlign: TextAlign.center,
                style: AppText.body.copyWith(color: Colors.white),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextButton.icon(
                  onPressed: () => Navigator.of(context).maybePop(),
                  icon: const Icon(
                    Icons.arrow_back_rounded,
                    color: Colors.white70,
                  ),
                  label: Text(
                    'Back',
                    style: AppText.button.copyWith(color: Colors.white70),
                  ),
                ),
                const SizedBox(width: 12),
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                  ),
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TrackSheet extends StatelessWidget {
  const _TrackSheet({
    required this.tracks,
    required this.selectedTrack,
    required this.onAudio,
    required this.onSubtitle,
  });

  final Tracks tracks;
  final Track selectedTrack;
  final ValueChanged<AudioTrack> onAudio;
  final ValueChanged<SubtitleTrack> onSubtitle;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Tracks', style: AppText.title),
            const SizedBox(height: 14),
            _TrackGroup<AudioTrack>(
              title: 'Audio',
              tracks: tracks.audio,
              selectedId: selectedTrack.audio.id,
              labelFor: _trackLabel,
              onSelected: onAudio,
            ),
            const SizedBox(height: 16),
            _TrackGroup<SubtitleTrack>(
              title: 'Subtitles',
              tracks: tracks.subtitle,
              selectedId: selectedTrack.subtitle.id,
              labelFor: _trackLabel,
              onSelected: onSubtitle,
            ),
          ],
        ),
      ),
    );
  }

  static String _trackLabel(dynamic track) {
    final title = track.title as String?;
    final language = track.language as String?;
    if (track.id == 'auto') return 'Auto';
    if (track.id == 'no') return 'Off';
    if (title != null && title.trim().isNotEmpty) return title;
    if (language != null && language.trim().isNotEmpty) {
      return language.toUpperCase();
    }
    return 'Track ${track.id}';
  }
}

class _TrackGroup<T> extends StatelessWidget {
  const _TrackGroup({
    required this.title,
    required this.tracks,
    required this.selectedId,
    required this.labelFor,
    required this.onSelected,
  });

  final String title;
  final List<T> tracks;
  final String selectedId;
  final String Function(T) labelFor;
  final ValueChanged<T> onSelected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AppText.label),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final track in tracks)
              ChoiceChip(
                selected: _idOf(track) == selectedId,
                label: Text(labelFor(track)),
                onSelected: (_) => onSelected(track),
              ),
          ],
        ),
      ],
    );
  }

  String _idOf(T track) => switch (track) {
    AudioTrack t => t.id,
    SubtitleTrack t => t.id,
    _ => '',
  };
}
