import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../models/library_items.dart';
import '../../models/live_channel.dart';
import '../../models/media_kind.dart';
import '../../providers/content_providers.dart';
import '../../providers/core_providers.dart';
import '../../providers/library_providers.dart';
import '../../widgets/network_poster.dart';
import '../../widgets/skeletons.dart';
import '../../widgets/state_views.dart';
import '../player/play_helpers.dart';
import 'widgets/category_rail.dart';
import 'widgets/channel_preview.dart';

class LiveScreen extends ConsumerStatefulWidget {
  const LiveScreen({super.key});

  @override
  ConsumerState<LiveScreen> createState() => _LiveScreenState();
}

class _LiveScreenState extends ConsumerState<LiveScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  LiveChannel? _selected;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categoryId = ref.watch(selectedLiveCategoryProvider);
    final categoriesAsync = ref.watch(liveCategoriesProvider);
    final channelsAsync = ref.watch(liveStreamsProvider(categoryId));
    final settings = ref.watch(settingsProvider);

    return LayoutBuilder(
      builder: (context, constraints) {
        final phoneWide =
            constraints.maxHeight < 470 || constraints.maxWidth < 760;
        final categoryWidth = (constraints.maxWidth * (phoneWide ? 0.21 : 0.22))
            .clamp(148.0, 204.0);
        final previewWidth = settings.compactLivePreview
            ? (constraints.maxWidth * (phoneWide ? 0.23 : 0.24)).clamp(
                174.0,
                232.0,
              )
            : (constraints.maxWidth * 0.32).clamp(250.0, 320.0);

        return Padding(
          padding: EdgeInsets.fromLTRB(8, 12, phoneWide ? 10 : 16, 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(
                width: categoryWidth,
                child: categoriesAsync.when(
                  data: (cats) => CategoryRail(
                    categories: cats,
                    selectedId: categoryId,
                    compact: phoneWide,
                    onSelected: (id) =>
                        ref.read(selectedLiveCategoryProvider.notifier).state =
                            id,
                  ),
                  loading: () => const ListSkeleton(count: 8),
                  error: (e, _) => ErrorView(
                    error: e,
                    onRetry: () => ref.invalidate(liveCategoriesProvider),
                  ),
                ),
              ),
              SizedBox(width: phoneWide ? 8 : 12),
              Expanded(
                flex: 3,
                child: Column(
                  children: [
                    _searchField(),
                    const SizedBox(height: 10),
                    Expanded(
                      child: channelsAsync.when(
                        data: (channels) => _channelList(channels, phoneWide),
                        loading: () => const ListSkeleton(),
                        error: (e, _) => ErrorView(
                          error: e,
                          onRetry: () =>
                              ref.invalidate(liveStreamsProvider(categoryId)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(width: phoneWide ? 8 : 12),
              SizedBox(
                width: previewWidth,
                child: ChannelPreview(
                  channel: _selected,
                  compact: settings.compactLivePreview || phoneWide,
                  onWatch: (c) => Play.live(ref, context, c),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _searchField() {
    return TextField(
      controller: _searchCtrl,
      onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
      style: AppText.body.copyWith(color: AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: 'Search channels…',
        prefixIcon: const Icon(
          Icons.search_rounded,
          color: AppColors.textMuted,
          size: 20,
        ),
        suffixIcon: _query.isEmpty
            ? null
            : IconButton(
                icon: const Icon(
                  Icons.close_rounded,
                  size: 18,
                  color: AppColors.textMuted,
                ),
                onPressed: () {
                  _searchCtrl.clear();
                  setState(() => _query = '');
                },
              ),
      ),
    );
  }

  Widget _channelList(List<LiveChannel> channels, bool compact) {
    final filtered = _query.isEmpty
        ? channels
        : channels.where((c) => c.name.toLowerCase().contains(_query)).toList();
    if (filtered.isEmpty) {
      return const EmptyState(
        title: 'No channels',
        message: 'Try a different category or search term.',
        icon: Icons.tv_off_rounded,
      );
    }
    _schedulePreviewSelection(filtered);

    final favorites = ref.watch(favoritesProvider);
    return ListView.separated(
      padding: const EdgeInsets.only(bottom: 8),
      itemCount: filtered.length,
      separatorBuilder: (context, index) => const SizedBox(height: 8),
      itemBuilder: (context, i) {
        final c = filtered[i];
        final isFav = favorites.any(
          (f) => f.kind == MediaKind.live && f.refId == c.streamId,
        );
        final isSelected = _selected?.streamId == c.streamId;
        return _ChannelTile(
          channel: c,
          number: i + 1,
          isFavorite: isFav,
          isSelected: isSelected,
          onTap: () => setState(() => _selected = c),
          onPlay: () => Play.live(ref, context, c),
          onFav: () => _toggleFav(c, isFav),
          compact: compact,
        );
      },
    );
  }

  void _schedulePreviewSelection(List<LiveChannel> filtered) {
    if (filtered.isEmpty) return;
    final currentIsVisible = filtered.any(
      (c) => c.streamId == _selected?.streamId,
    );
    if (currentIsVisible) return;

    final settings = ref.read(settingsProvider);
    final lastId = settings.rememberLastChannel
        ? ref.read(settingsRepositoryProvider).lastLiveChannelId
        : null;
    final preferred = lastId == null
        ? filtered.first
        : filtered.firstWhere(
            (c) => c.streamId == lastId,
            orElse: () => filtered.first,
          );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) setState(() => _selected = preferred);
    });
  }

  void _toggleFav(LiveChannel c, bool isFav) {
    final cfg = ref.read(activePlaylistProvider);
    if (cfg == null) return;
    ref
        .read(libraryActionsProvider)
        .toggleFavorite(
          FavoriteItem(
            playlistId: cfg.id,
            kind: MediaKind.live,
            refId: c.streamId,
            title: c.name,
            imageUrl: c.logo,
            payload: c.toPayload(),
          ),
        );
  }
}

class _ChannelTile extends StatelessWidget {
  const _ChannelTile({
    required this.channel,
    required this.number,
    required this.isFavorite,
    required this.isSelected,
    required this.onTap,
    required this.onPlay,
    required this.onFav,
    required this.compact,
  });

  final LiveChannel channel;
  final int number;
  final bool isFavorite;
  final bool isSelected;
  final VoidCallback onTap;
  final VoidCallback onPlay;
  final VoidCallback onFav;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 10 : 12,
          vertical: compact ? 8 : 10,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.glassFillStrong : AppColors.glassFill,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.glassStroke,
            width: isSelected ? 1.4 : 1,
          ),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 24,
              child: Text(
                '$number',
                textAlign: TextAlign.center,
                style: AppText.label.copyWith(color: AppColors.textMuted),
              ),
            ),
            ChannelLogo(url: channel.logo, name: channel.name, size: 38),
            SizedBox(width: compact ? 8 : 10),
            Expanded(
              child: Text(
                channel.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.subtitle.copyWith(color: AppColors.textPrimary),
              ),
            ),
            IconButton(
              onPressed: onFav,
              constraints: BoxConstraints.tightFor(
                width: compact ? 32 : 36,
                height: compact ? 32 : 36,
              ),
              padding: EdgeInsets.zero,
              icon: Icon(
                isFavorite
                    ? Icons.favorite_rounded
                    : Icons.favorite_border_rounded,
                color: isFavorite
                    ? AppColors.primaryBright
                    : AppColors.textMuted,
                size: 20,
              ),
            ),
            GestureDetector(
              onTap: onPlay,
              child: Container(
                width: compact ? 32 : 36,
                height: compact ? 32 : 36,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  gradient: AppColors.orangeGradient,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.play_arrow_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
