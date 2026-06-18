import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/routes.dart';
import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme/glass.dart';
import '../../models/playlist_config.dart';
import '../../providers/content_providers.dart';
import '../../providers/core_providers.dart';
import '../../providers/library_providers.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/primary_button.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playlist = ref.watch(activePlaylistProvider);
    final settings = ref.watch(settingsProvider);
    final device = ref.watch(deviceServiceProvider);
    final supabase = ref.watch(supabaseServiceProvider);
    final favorites = ref.watch(favoritesProvider);
    final continueItems = ref.watch(continueWatchingProvider);
    final history = ref.watch(historyProvider);
    final phoneWide = MediaQuery.sizeOf(context).height < 470;

    return ListView(
      padding: EdgeInsets.fromLTRB(18, phoneWide ? 12 : 18, 18, 28),
      children: [
        _Header(
          sourceName: playlist?.name ?? 'No active source',
          sourceType: playlist?.type.name.toUpperCase() ?? 'OFFLINE',
          cloudReady: supabase.enabled && supabase.hasSession,
          compact: phoneWide,
        ),
        SizedBox(height: phoneWide ? 12 : 16),
        _Counters(
          favorites: favorites.length,
          continueItems: continueItems.length,
          history: history.length,
          compact: phoneWide,
        ),
        SizedBox(height: phoneWide ? 12 : 16),
        _SourceManagementPanel(
          activeId: playlist?.id,
          compact: phoneWide,
          onAddSource: () => context.push('${Routes.login}?addSource=1'),
        ),
        SizedBox(height: phoneWide ? 12 : 16),
        LayoutBuilder(
          builder: (context, constraints) {
            final twoColumns = constraints.maxWidth >= 760;
            final sourcePanel = _InfoPanel(
              title: 'Source',
              icon: Icons.hub_rounded,
              rows: [
                _InfoItem('Name', playlist?.name ?? 'Not connected'),
                _InfoItem('Type', playlist?.type.name.toUpperCase() ?? 'NONE'),
                _InfoItem('Product', AppConfig.productSlug),
                _InfoItem('Platform', AppConfig.platform),
              ],
            );
            final devicePanel = _InfoPanel(
              title: 'Device',
              icon: Icons.phone_iphone_rounded,
              rows: [
                _InfoItem('ID', device.deviceId),
                _InfoItem('Model', device.model),
                _InfoItem(
                  'OS',
                  device.osVersion.isEmpty ? 'Preview' : device.osVersion,
                ),
                _InfoItem(
                  'Build',
                  '${device.appVersion}+${device.buildNumber}',
                ),
              ],
            );
            if (!twoColumns) {
              return Column(
                children: [
                  sourcePanel,
                  const SizedBox(height: 12),
                  devicePanel,
                ],
              );
            }
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: sourcePanel),
                const SizedBox(width: 12),
                Expanded(child: devicePanel),
              ],
            );
          },
        ),
        SizedBox(height: phoneWide ? 12 : 16),
        _SettingsPanel(
          title: 'Playback',
          icon: Icons.play_circle_rounded,
          children: [
            _SwitchRow(
              icon: Icons.bolt_rounded,
              title: 'Prefer HLS',
              subtitle:
                  'Use m3u8 live streams when the provider supports them.',
              value: settings.preferHls,
              onChanged: (value) =>
                  ref.read(settingsProvider.notifier).setPreferHls(value),
            ),
            _SwitchRow(
              icon: Icons.skip_next_rounded,
              title: 'Autoplay episodes',
              subtitle: 'Start the next episode after the current one ends.',
              value: settings.autoplayNext,
              onChanged: (value) =>
                  ref.read(settingsProvider.notifier).setAutoplayNext(value),
            ),
            _SwitchRow(
              icon: Icons.restore_rounded,
              title: 'Remember last live channel',
              subtitle: 'Open Live with the latest watched channel selected.',
              value: settings.rememberLastChannel,
              onChanged: (value) => ref
                  .read(settingsProvider.notifier)
                  .setRememberLastChannel(value),
            ),
          ],
        ),
        SizedBox(height: phoneWide ? 12 : 16),
        _SettingsPanel(
          title: 'Interface',
          icon: Icons.view_quilt_rounded,
          children: [
            _SwitchRow(
              icon: Icons.picture_in_picture_alt_rounded,
              title: 'Slim live preview',
              subtitle:
                  'Keep channel preview below a quarter of the landscape view.',
              value: settings.compactLivePreview,
              onChanged: (value) => ref
                  .read(settingsProvider.notifier)
                  .setCompactLivePreview(value),
            ),
            _SwitchRow(
              icon: Icons.grid_view_rounded,
              title: 'Compact poster grids',
              subtitle:
                  'Fit more movies, series, and favorites on phone screens.',
              value: settings.compactGrids,
              onChanged: (value) =>
                  ref.read(settingsProvider.notifier).setCompactGrids(value),
            ),
            _SwitchRow(
              icon: Icons.threed_rotation_rounded,
              title: 'Cinematic motion',
              subtitle: 'Use premium 3D transitions and soft page motion.',
              value: settings.cinematicMotion,
              onChanged: (value) =>
                  ref.read(settingsProvider.notifier).setCinematicMotion(value),
            ),
          ],
        ),
        SizedBox(height: phoneWide ? 12 : 16),
        _SettingsPanel(
          title: 'Cloud And Privacy',
          icon: Icons.cloud_done_rounded,
          children: [
            _SwitchRow(
              icon: Icons.sync_rounded,
              title: 'Sync library on launch',
              subtitle: 'Pull favorites and watch history when the app starts.',
              value: settings.syncOnLaunch,
              onChanged: (value) =>
                  ref.read(settingsProvider.notifier).setSyncOnLaunch(value),
            ),
            _StatusRow(
              icon: Icons.verified_user_rounded,
              title: 'Cloud session',
              value: supabase.enabled
                  ? (supabase.hasSession ? 'Ready' : 'Local fallback')
                  : 'Disabled',
              color: supabase.enabled && supabase.hasSession
                  ? AppColors.success
                  : AppColors.warning,
            ),
          ],
        ),
        SizedBox(height: phoneWide ? 12 : 16),
        _LegalSupportPanel(deviceId: device.deviceId, compact: phoneWide),
        SizedBox(height: phoneWide ? 12 : 16),
        _MaintenancePanel(
          onSync: () => _syncNow(context, ref),
          onClearCache: () => _clearCache(context, ref),
          onClearHistory: () => _clearHistory(context, ref),
          onLogout: () => ref.read(activePlaylistProvider.notifier).logout(),
          onWipeAll: () => _wipeAll(context, ref),
        ),
      ],
    );
  }

  Future<void> _syncNow(BuildContext context, WidgetRef ref) async {
    await ref.read(libraryActionsProvider).syncFromCloud();
    if (context.mounted) _toast(context, 'Library synced.');
  }

  Future<void> _clearCache(BuildContext context, WidgetRef ref) async {
    await ref.read(settingsRepositoryProvider).clearCache();
    ref.invalidate(catalogRefreshProvider);
    if (context.mounted) _toast(context, 'Catalog cache cleared.');
  }

  Future<void> _clearHistory(BuildContext context, WidgetRef ref) async {
    await ref.read(libraryActionsProvider).clearHistory();
    if (context.mounted) _toast(context, 'Watch history cleared.');
  }

  Future<void> _wipeAll(BuildContext context, WidgetRef ref) async {
    await ref.read(settingsRepositoryProvider).wipeAll();
    await ref.read(secureStorageProvider).clearAll();
    await ref.read(activePlaylistProvider.notifier).logout();
    ref.invalidate(catalogRefreshProvider);
    ref.invalidate(libraryRefreshProvider);
    if (context.mounted) _toast(context, 'Local app data cleared.');
  }

  void _toast(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: AppColors.surfaceHigh),
    );
  }
}

void _toast(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message), backgroundColor: AppColors.surfaceHigh),
  );
}

class _SourceManagementPanel extends ConsumerWidget {
  const _SourceManagementPanel({
    required this.activeId,
    required this.compact,
    required this.onAddSource,
  });

  final String? activeId;
  final bool compact;
  final VoidCallback onAddSource;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playlists = ref.watch(savedPlaylistsProvider);
    return GlassPanel(
      radius: 18,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _PanelTitle(
            title: 'Source Management',
            icon: Icons.hub_rounded,
          ),
          const SizedBox(height: 12),
          playlists.when(
            data: (items) => Column(
              children: [
                if (items.isEmpty)
                  Text(
                    'No saved sources. Add an Xtream, M3U, QR, or legal demo source.',
                    style: AppText.body,
                  )
                else
                  for (final item in items) ...[
                    _SourceTile(
                      source: item,
                      active: item.id == activeId,
                      onSelect: item.id == activeId
                          ? null
                          : () async {
                              await ref
                                  .read(activePlaylistProvider.notifier)
                                  .selectSource(item);
                              ref.invalidate(catalogRefreshProvider);
                              if (context.mounted) {
                                _toast(context, 'Source switched.');
                              }
                            },
                      onDelete: () => _confirmDelete(context, ref, item),
                    ),
                    const SizedBox(height: 8),
                  ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: SecondaryButton(
                        label: 'Add Source',
                        icon: Icons.add_link_rounded,
                        onPressed: onAddSource,
                        height: compact ? 40 : 46,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: SecondaryButton(
                        label: 'Refresh',
                        icon: Icons.refresh_rounded,
                        onPressed: () => ref.invalidate(savedPlaylistsProvider),
                        height: compact ? 40 : 46,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: 10),
              child: LinearProgressIndicator(color: AppColors.primary),
            ),
            error: (_, _) => Text(
              'Could not read saved sources.',
              style: AppText.body.copyWith(color: AppColors.danger),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    PlaylistConfig source,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete source?'),
        content: Text(
          'This removes "${source.name}" from this device. It does not delete anything from the provider server.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(activePlaylistProvider.notifier).removeSource(source.id);
    ref.invalidate(catalogRefreshProvider);
    ref.invalidate(savedPlaylistsProvider);
    if (context.mounted) _toast(context, 'Source deleted.');
  }
}

class _SourceTile extends StatelessWidget {
  const _SourceTile({
    required this.source,
    required this.active,
    required this.onSelect,
    required this.onDelete,
  });

  final PlaylistConfig source;
  final bool active;
  final VoidCallback? onSelect;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final type = source.type.name.toUpperCase();
    final created = source.createdAt == null
        ? 'Saved source'
        : 'Added ${source.createdAt!.toLocal().toString().split(' ').first}';
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: active
            ? AppColors.primary.withValues(alpha: 0.12)
            : AppColors.black.withValues(alpha: 0.20),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: active ? AppColors.primaryBright : AppColors.glassStroke,
        ),
      ),
      child: Row(
        children: [
          Icon(
            source.type.name == 'xtream'
                ? Icons.dns_rounded
                : Icons.playlist_play_rounded,
            color: AppColors.primaryBright,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  source.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.subtitle.copyWith(color: Colors.white),
                ),
                const SizedBox(height: 3),
                Text('$type - $created', style: AppText.label),
              ],
            ),
          ),
          if (active) _Pill(label: 'Active', color: AppColors.success),
          if (!active)
            IconButton(
              tooltip: 'Use source',
              onPressed: onSelect,
              icon: const Icon(
                Icons.check_circle_outline_rounded,
                color: AppColors.success,
              ),
            ),
          IconButton(
            tooltip: 'Delete source',
            onPressed: onDelete,
            icon: const Icon(
              Icons.delete_outline_rounded,
              color: AppColors.danger,
            ),
          ),
        ],
      ),
    );
  }
}

class _LegalSupportPanel extends StatelessWidget {
  const _LegalSupportPanel({required this.deviceId, required this.compact});

  final String deviceId;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 18,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _PanelTitle(
            title: 'Legal And Support',
            icon: Icons.verified_user_rounded,
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.black.withValues(alpha: 0.22),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.glassStroke),
            ),
            child: Text(
              'MoPlayer is a media player only. It does not provide channels, playlists, movies, TV streams, or copyrighted content. Users must add their own legally obtained M3U or Xtream source.',
              style: AppText.body.copyWith(color: AppColors.textPrimary),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _ActionChipButton(
                label: 'Support',
                icon: Icons.support_agent_rounded,
                onTap: () => _showSupport(context),
              ),
              _ActionChipButton(
                label: 'Privacy',
                icon: Icons.privacy_tip_rounded,
                onTap: () => _showTextSheet(
                  context,
                  title: 'Privacy Policy',
                  url: '${AppConfig.webBaseUrl}/en/privacy',
                  body:
                      'MoPlayer stores provider credentials only on this device using secure storage. If Supabase is configured, non-sensitive device status, favorites, watch history, and continue-watching records can sync for app functionality. The app does not use advertising tracking.',
                ),
              ),
              _ActionChipButton(
                label: 'Terms',
                icon: Icons.article_rounded,
                onTap: () => _showTextSheet(
                  context,
                  title: 'Terms Of Use',
                  url: '${AppConfig.webBaseUrl}/en/terms',
                  body:
                      'Use MoPlayer only with media sources you are legally allowed to access. The app is not a content provider and does not sell, distribute, or promote copyrighted streams.',
                ),
              ),
              _ActionChipButton(
                label: 'Disclaimer',
                icon: Icons.gavel_rounded,
                onTap: () => _showTextSheet(
                  context,
                  title: 'App Disclaimer',
                  url: '${AppConfig.webBaseUrl}/en/app-disclaimer',
                  body:
                      'Screenshots and demo mode must use neutral legal demo streams only. Do not submit screenshots showing paid channels, protected brands, premium sports, or copyrighted movies.',
                ),
              ),
              _ActionChipButton(
                label: 'Delete Data',
                icon: Icons.delete_sweep_rounded,
                danger: true,
                onTap: () => _showTextSheet(
                  context,
                  title: 'Data Deletion',
                  url: '${AppConfig.webBaseUrl}/en/support',
                  body:
                      'Use Wipe Local Data below to remove local sources, credentials, cache, history, and favorites from this device. For cloud-linked support data, contact support with your Device ID: $deviceId.',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showSupport(BuildContext context) {
    final diagnostics =
        'MoPlayer Pro iOS\nDevice ID: $deviceId\nSupport URL: ${AppConfig.webBaseUrl}/en/support';
    _showTextSheet(
      context,
      title: 'Support',
      url: '${AppConfig.webBaseUrl}/en/support',
      body:
          'For help, send your device model, app version, source type, exact error text, and whether the issue is activation, login, playback, or catalog loading. Never send provider passwords in public channels.\n\n$diagnostics',
      copyText: diagnostics,
    );
  }

  void _showTextSheet(
    BuildContext context, {
    required String title,
    required String url,
    required String body,
    String? copyText,
  }) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(18, 8, 18, 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppText.headline),
              const SizedBox(height: 10),
              SelectableText(body, style: AppText.body),
              const SizedBox(height: 14),
              SelectableText(
                url,
                style: AppText.label.copyWith(color: AppColors.primaryBright),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: SecondaryButton(
                      label: 'Copy URL',
                      icon: Icons.copy_rounded,
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: url));
                        Navigator.of(context).pop();
                      },
                      height: compact ? 40 : 46,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: PrimaryButton(
                      label: 'Copy Details',
                      icon: Icons.assignment_rounded,
                      onPressed: () {
                        Clipboard.setData(
                          ClipboardData(
                            text: copyText ?? '$title\n$url\n\n$body',
                          ),
                        );
                        Navigator.of(context).pop();
                      },
                      height: compact ? 40 : 46,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.sourceName,
    required this.sourceType,
    required this.cloudReady,
    required this.compact,
  });

  final String sourceName;
  final String sourceType;
  final bool cloudReady;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      padding: EdgeInsets.all(compact ? 14 : 18),
      glow: true,
      child: Row(
        children: [
          AppLogo(size: compact ? 44 : 58, showWordmark: false),
          SizedBox(width: compact ? 10 : 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'MoPlayer Pro',
                  style: compact ? AppText.title : AppText.headline,
                ),
                const SizedBox(height: 4),
                Text(
                  sourceName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.body.copyWith(color: AppColors.textPrimary),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          _Pill(
            label: sourceType,
            color: AppColors.primaryBright,
            compact: compact,
          ),
          const SizedBox(width: 8),
          _Pill(
            label: cloudReady ? 'Cloud' : 'Local',
            color: cloudReady ? AppColors.success : AppColors.warning,
            compact: compact,
          ),
        ],
      ),
    );
  }
}

class _Counters extends StatelessWidget {
  const _Counters({
    required this.favorites,
    required this.continueItems,
    required this.history,
    required this.compact,
  });

  final int favorites;
  final int continueItems;
  final int history;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _CounterTile(
            label: 'Favorites',
            value: favorites,
            icon: Icons.favorite_rounded,
            compact: compact,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _CounterTile(
            label: 'Continue',
            value: continueItems,
            icon: Icons.play_circle_rounded,
            compact: compact,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _CounterTile(
            label: 'History',
            value: history,
            icon: Icons.history_rounded,
            compact: compact,
          ),
        ),
      ],
    );
  }
}

class _CounterTile extends StatelessWidget {
  const _CounterTile({
    required this.label,
    required this.value,
    required this.icon,
    required this.compact,
  });

  final String label;
  final int value;
  final IconData icon;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 16,
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 10 : 14,
        vertical: compact ? 10 : 14,
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primaryBright, size: compact ? 18 : 22),
          SizedBox(width: compact ? 8 : 10),
          Expanded(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.label,
            ),
          ),
          Text('$value', style: compact ? AppText.title : AppText.headline),
        ],
      ),
    );
  }
}

class _InfoItem {
  const _InfoItem(this.label, this.value);

  final String label;
  final String value;
}

class _InfoPanel extends StatelessWidget {
  const _InfoPanel({
    required this.title,
    required this.icon,
    required this.rows,
  });

  final String title;
  final IconData icon;
  final List<_InfoItem> rows;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 18,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _PanelTitle(title: title, icon: icon),
          const SizedBox(height: 12),
          for (final row in rows)
            Padding(
              padding: const EdgeInsets.only(bottom: 9),
              child: Row(
                children: [
                  SizedBox(
                    width: 84,
                    child: Text(row.label, style: AppText.label),
                  ),
                  Expanded(
                    child: SelectableText(
                      row.value,
                      maxLines: 1,
                      style: AppText.body.copyWith(
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _SettingsPanel extends StatelessWidget {
  const _SettingsPanel({
    required this.title,
    required this.icon,
    required this.children,
  });

  final String title;
  final IconData icon;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 18,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _PanelTitle(title: title, icon: icon),
          const SizedBox(height: 12),
          for (var i = 0; i < children.length; i++) ...[
            children[i],
            if (i != children.length - 1)
              const Divider(color: AppColors.glassStroke, height: 18),
          ],
        ],
      ),
    );
  }
}

class _MaintenancePanel extends StatelessWidget {
  const _MaintenancePanel({
    required this.onSync,
    required this.onClearCache,
    required this.onClearHistory,
    required this.onLogout,
    required this.onWipeAll,
  });

  final VoidCallback onSync;
  final VoidCallback onClearCache;
  final VoidCallback onClearHistory;
  final VoidCallback onLogout;
  final VoidCallback onWipeAll;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      radius: 18,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _PanelTitle(title: 'Maintenance', icon: Icons.tune_rounded),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _ActionChipButton(
                label: 'Sync Now',
                icon: Icons.cloud_sync_rounded,
                onTap: onSync,
              ),
              _ActionChipButton(
                label: 'Clear Cache',
                icon: Icons.cleaning_services_rounded,
                onTap: onClearCache,
              ),
              _ActionChipButton(
                label: 'Clear History',
                icon: Icons.history_toggle_off_rounded,
                onTap: onClearHistory,
              ),
              _ActionChipButton(
                label: 'Wipe Local Data',
                icon: Icons.delete_sweep_rounded,
                danger: true,
                onTap: onWipeAll,
              ),
            ],
          ),
          const SizedBox(height: 14),
          PrimaryButton(
            label: 'Logout',
            icon: Icons.logout_rounded,
            onPressed: onLogout,
          ),
        ],
      ),
    );
  }
}

class _PanelTitle extends StatelessWidget {
  const _PanelTitle({required this.title, required this.icon});

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primaryBright, size: 20),
        const SizedBox(width: 8),
        Text(title, style: AppText.title),
      ],
    );
  }
}

class _SwitchRow extends StatelessWidget {
  const _SwitchRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primaryBright, size: 21),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.subtitle.copyWith(color: Colors.white),
              ),
              const SizedBox(height: 3),
              Text(
                subtitle,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppText.label,
              ),
            ],
          ),
        ),
        Switch.adaptive(
          value: value,
          activeThumbColor: AppColors.primary,
          activeTrackColor: AppColors.primary.withValues(alpha: 0.42),
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class _StatusRow extends StatelessWidget {
  const _StatusRow({
    required this.icon,
    required this.title,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String title;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primaryBright, size: 21),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            title,
            style: AppText.subtitle.copyWith(color: Colors.white),
          ),
        ),
        _Pill(label: value, color: color),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.color, this.compact = false});

  final String label;
  final Color color;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 10,
        vertical: compact ? 5 : 6,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.45)),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: AppText.label.copyWith(
          color: color,
          fontSize: compact ? 10.5 : null,
        ),
      ),
    );
  }
}

class _ActionChipButton extends StatelessWidget {
  const _ActionChipButton({
    required this.label,
    required this.icon,
    required this.onTap,
    this.danger = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final color = danger ? AppColors.danger : AppColors.primaryBright;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 42,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: color.withValues(alpha: 0.35)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 7),
            Text(
              label,
              style: AppText.label.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
