import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../models/live_channel.dart';
import '../../../providers/content_providers.dart';
import '../../../widgets/network_poster.dart';

/// Slim right-side Live preview with the selected channel, guide, and action.
class ChannelPreview extends ConsumerWidget {
  const ChannelPreview({
    super.key,
    required this.channel,
    required this.onWatch,
    this.compact = true,
  });

  final LiveChannel? channel;
  final ValueChanged<LiveChannel> onWatch;
  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = channel;
    return Container(
      decoration: BoxDecoration(
        color: AppColors.glassFill,
        borderRadius: BorderRadius.circular(compact ? 18 : 22),
        border: Border.all(color: AppColors.glassStroke),
      ),
      child: c == null
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(18),
                child: Text('Select a channel', textAlign: TextAlign.center),
              ),
            )
          : Padding(
              padding: EdgeInsets.all(compact ? 12 : 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      ChannelLogo(
                        url: c.logo,
                        name: c.name,
                        size: compact ? 46 : 72,
                      ),
                      SizedBox(width: compact ? 10 : 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              c.name,
                              maxLines: compact ? 2 : 3,
                              overflow: TextOverflow.ellipsis,
                              style:
                                  (compact ? AppText.subtitle : AppText.title)
                                      .copyWith(color: AppColors.textPrimary),
                            ),
                            SizedBox(height: compact ? 6 : 8),
                            _SignalRow(channel: c, compact: compact),
                          ],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: compact ? 12 : 16),
                  Expanded(
                    child: _Epg(streamId: c.streamId, compact: compact),
                  ),
                  SizedBox(height: compact ? 10 : 12),
                  _WatchButton(compact: compact, onTap: () => onWatch(c)),
                ],
              ),
            ),
    );
  }
}

class _SignalRow extends StatelessWidget {
  const _SignalRow({required this.channel, required this.compact});

  final LiveChannel channel;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final chips = <String>[
      if ((channel.containerExtension ?? '').trim().isNotEmpty)
        channel.containerExtension!.toUpperCase(),
      if (channel.epgChannelId != null) 'EPG',
      if (channel.tvArchive) 'Catch-up',
    ];
    if (chips.isEmpty) chips.add('Live');

    return Wrap(
      spacing: 5,
      runSpacing: 5,
      children: [
        for (final chip in chips.take(compact ? 2 : 3))
          Container(
            padding: EdgeInsets.symmetric(
              horizontal: compact ? 6 : 7,
              vertical: 3,
            ),
            decoration: BoxDecoration(
              color: AppColors.black.withValues(alpha: 0.30),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: AppColors.glassStroke),
            ),
            child: Text(
              chip,
              style: AppText.label.copyWith(
                color: AppColors.primaryBright,
                fontSize: compact ? 9.5 : 10.5,
              ),
            ),
          ),
      ],
    );
  }
}

class _WatchButton extends StatelessWidget {
  const _WatchButton({required this.compact, required this.onTap});

  final bool compact;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: compact ? 42 : 50,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          gradient: AppColors.orangeGradient,
          borderRadius: BorderRadius.circular(compact ? 13 : 15),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.30),
              blurRadius: 20,
              spreadRadius: -8,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 6),
            Text(
              'Watch',
              style: AppText.button.copyWith(fontSize: compact ? 13.5 : 15),
            ),
          ],
        ),
      ),
    );
  }
}

class _Epg extends ConsumerWidget {
  const _Epg({required this.streamId, required this.compact});

  final String streamId;
  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final epgAsync = ref.watch(epgProvider(streamId));
    return epgAsync.when(
      loading: () => Center(
        child: SizedBox(
          height: compact ? 18 : 22,
          width: compact ? 18 : 22,
          child: const CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
      error: (error, stack) => _noEpg(),
      data: (entries) {
        if (entries.isEmpty) return _noEpg();
        final now = entries.firstWhere(
          (e) => e.isLiveNow,
          orElse: () => entries.first,
        );
        final upcoming = entries
            .where((e) => e.start.isAfter(now.start))
            .take(compact ? 1 : 3)
            .toList();

        return ListView(
          padding: EdgeInsets.zero,
          children: [
            Text(
              'NOW',
              style: AppText.label.copyWith(
                color: AppColors.primaryBright,
                fontSize: compact ? 10 : null,
              ),
            ),
            SizedBox(height: compact ? 3 : 4),
            Text(
              now.title,
              maxLines: compact ? 2 : 3,
              overflow: TextOverflow.ellipsis,
              style: AppText.subtitle.copyWith(
                color: AppColors.textPrimary,
                fontSize: compact ? 13 : null,
              ),
            ),
            SizedBox(height: compact ? 7 : 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(3),
              child: LinearProgressIndicator(
                value: now.progress,
                minHeight: compact ? 3 : 4,
                backgroundColor: Colors.white12,
                valueColor: const AlwaysStoppedAnimation(
                  AppColors.primaryBright,
                ),
              ),
            ),
            SizedBox(height: compact ? 11 : 16),
            if (upcoming.isNotEmpty)
              Text(
                'NEXT',
                style: AppText.label.copyWith(
                  color: AppColors.textMuted,
                  fontSize: compact ? 10 : null,
                ),
              ),
            SizedBox(height: compact ? 5 : 6),
            for (final e in upcoming)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${e.start.hour.toString().padLeft(2, '0')}:${e.start.minute.toString().padLeft(2, '0')}',
                      style: AppText.label.copyWith(
                        color: AppColors.primaryBright,
                        fontSize: compact ? 10.5 : null,
                      ),
                    ),
                    SizedBox(width: compact ? 7 : 10),
                    Expanded(
                      child: Text(
                        e.title,
                        maxLines: compact ? 1 : 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.body.copyWith(
                          fontSize: compact ? 12 : null,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _noEpg() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.event_busy_rounded,
            color: AppColors.textMuted.withValues(alpha: 0.6),
            size: compact ? 22 : 28,
          ),
          SizedBox(height: compact ? 6 : 8),
          Text(
            'No guide',
            style: AppText.label.copyWith(fontSize: compact ? 10.5 : null),
          ),
        ],
      ),
    );
  }
}
