import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../app/routes.dart';
import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme/glass.dart';
import '../../models/playlist_config.dart';
import '../../providers/core_providers.dart';
import '../../providers/library_providers.dart';
import '../../services/activation/activation_service.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/gradient_background.dart';
import '../../widgets/primary_button.dart';
import 'widgets/glass_field.dart';

enum _LoginMethod { xtream, m3u, activation }

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _activationService = ActivationService();

  _LoginMethod _method = _LoginMethod.xtream;

  final _serverCtrl = TextEditingController();
  final _userCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _m3uNameCtrl = TextEditingController(text: 'My Playlist');
  final _m3uUrlCtrl = TextEditingController();

  bool _busy = false;
  String? _statusMessage;
  bool _statusIsError = false;
  Timer? _activationTimer;
  ActivationSession? _activationSession;

  @override
  void dispose() {
    _serverCtrl.dispose();
    _userCtrl.dispose();
    _passCtrl.dispose();
    _m3uNameCtrl.dispose();
    _m3uUrlCtrl.dispose();
    _activationTimer?.cancel();
    _activationService.close();
    super.dispose();
  }

  String _newId() => 'pl_${DateTime.now().microsecondsSinceEpoch}';

  void _setStatus(String? message, {bool error = false}) {
    if (!mounted) return;
    setState(() {
      _statusMessage = message;
      _statusIsError = error;
    });
  }

  PlaylistConfig _xtreamConfig() => PlaylistConfig(
    id: _newId(),
    type: PlaylistType.xtream,
    name: _userCtrl.text.trim().isEmpty
        ? 'Xtream Account'
        : _userCtrl.text.trim(),
    serverUrl: _serverCtrl.text.trim(),
    username: _userCtrl.text.trim(),
    password: _passCtrl.text,
  );

  PlaylistConfig _m3uConfig() => PlaylistConfig(
    id: _newId(),
    type: PlaylistType.m3u,
    name: _m3uNameCtrl.text.trim().isEmpty
        ? 'M3U Playlist'
        : _m3uNameCtrl.text.trim(),
    m3uUrl: _m3uUrlCtrl.text.trim(),
  );

  Future<void> _testXtream() async {
    setState(() => _busy = true);
    _setStatus(null);
    final result = await ref
        .read(authRepositoryProvider)
        .testXtream(_xtreamConfig());
    if (!mounted) return;
    result.when(
      ok: (info) => _setStatus(
        'Connected - ${info.status}'
        '${info.expiresAt != null ? ' - expires ${info.expiresAt!.toLocal().toString().split(' ').first}' : ''}',
      ),
      err: (f) => _setStatus(f.message, error: true),
    );
    setState(() => _busy = false);
  }

  Future<void> _saveXtream() async {
    setState(() => _busy = true);
    _setStatus(null);
    final config = _xtreamConfig();
    final result = await ref.read(authRepositoryProvider).testXtream(config);
    if (!mounted) return;
    if (result.isOk) {
      await ref.read(activePlaylistProvider.notifier).activate(config);
      await ref.read(libraryActionsProvider).syncFromCloud();
      if (mounted) context.go(Routes.home);
    } else {
      result.when(ok: (_) {}, err: (f) => _setStatus(f.message, error: true));
      setState(() => _busy = false);
    }
  }

  Future<void> _testM3u() async {
    setState(() => _busy = true);
    _setStatus(null);
    final result = await ref.read(authRepositoryProvider).testM3u(_m3uConfig());
    if (!mounted) return;
    result.when(
      ok: (count) => _setStatus('Valid playlist - $count channels found'),
      err: (f) => _setStatus(f.message, error: true),
    );
    setState(() => _busy = false);
  }

  Future<void> _saveM3u() async {
    setState(() => _busy = true);
    _setStatus(null);
    final config = _m3uConfig();
    final result = await ref.read(authRepositoryProvider).testM3u(config);
    if (!mounted) return;
    if (result.isOk) {
      await ref.read(activePlaylistProvider.notifier).activate(config);
      await ref.read(libraryActionsProvider).syncFromCloud();
      if (mounted) context.go(Routes.home);
    } else {
      result.when(ok: (_) {}, err: (f) => _setStatus(f.message, error: true));
      setState(() => _busy = false);
    }
  }

  Future<void> _createActivation() async {
    setState(() => _busy = true);
    _setStatus(null);
    try {
      final session = await _activationService.create(
        ref.read(deviceServiceProvider),
      );
      if (!mounted) return;
      setState(() => _activationSession = session);
      _setStatus('Activation code ready. Waiting for approval.');
      _startActivationPolling();
    } catch (e) {
      _setStatus('$e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _startActivationPolling() {
    _activationTimer?.cancel();
    _activationTimer = Timer.periodic(
      const Duration(seconds: 4),
      (_) => _pollActivation(),
    );
    unawaited(_pollActivation());
  }

  Future<void> _pollActivation() async {
    final session = _activationSession;
    if (session == null || _busy) return;
    if (DateTime.now().isAfter(session.expiresAt)) {
      _activationTimer?.cancel();
      _setStatus('Activation code expired. Create a fresh code.', error: true);
      return;
    }

    try {
      final status = await _activationService.status(session.code);
      if (!mounted) return;

      if (!status.isActivated) {
        if (status.status == 'rejected' || status.status == 'expired') {
          _activationTimer?.cancel();
          _setStatus(
            status.message ?? 'Activation ${status.status}.',
            error: true,
          );
        }
        return;
      }

      final deviceId =
          status.publicDeviceId ?? ref.read(deviceServiceProvider).deviceId;
      final source = await _activationService.pullSource(
        publicDeviceId: deviceId,
        token: session.sourcePullToken,
      );
      if (!mounted) return;

      if (!source.hasSource) {
        _setStatus(
          source.message ?? 'Device approved. Waiting for source delivery.',
        );
        return;
      }

      _activationTimer?.cancel();
      await ref
          .read(activePlaylistProvider.notifier)
          .activate(source.playlist!);
      await ref.read(libraryActionsProvider).syncFromCloud();
      await _activationService.ackSource(
        publicDeviceId: deviceId,
        token: session.sourcePullToken,
        sourceId: source.sourceId!,
      );
      if (mounted) context.go(Routes.home);
    } catch (e) {
      _setStatus('$e', error: true);
    }
  }

  Future<void> _openLegalDemo() async {
    setState(() => _busy = true);
    _setStatus(null);
    final config = PlaylistConfig(
      id: 'demo_review_${DateTime.now().microsecondsSinceEpoch}',
      type: PlaylistType.m3u,
      name: 'Legal Review Demo',
      m3uUrl: 'asset://demo/review_playlist.m3u',
    );
    final result = await ref.read(authRepositoryProvider).testM3u(config);
    if (!mounted) return;
    if (result.isOk) {
      await ref.read(activePlaylistProvider.notifier).activate(config);
      await ref.read(libraryActionsProvider).syncFromCloud();
      if (mounted) context.go(Routes.home);
    } else {
      result.when(ok: (_) {}, err: (f) => _setStatus(f.message, error: true));
      setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: GradientBackground(
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth > 720;
              final form = _FormCard(
                method: _method,
                onDemo: _busy ? null : _openLegalDemo,
                onMethodChanged: (m) {
                  setState(() => _method = m);
                  _setStatus(null);
                },
                child: _buildForm(),
              );
              if (!wide) {
                return SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      const AppLogo(size: 92, showWordmark: true),
                      const SizedBox(height: 20),
                      form,
                    ],
                  ),
                );
              }
              return Row(
                children: [
                  const Expanded(flex: 5, child: _SmartBrandPanel()),
                  Expanded(
                    flex: 6,
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(8, 24, 28, 24),
                      child: form,
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildForm() {
    switch (_method) {
      case _LoginMethod.xtream:
        return _xtreamForm();
      case _LoginMethod.m3u:
        return _m3uForm();
      case _LoginMethod.activation:
        return _activationForm();
    }
  }

  Widget _statusBanner() {
    if (_statusMessage == null) return const SizedBox.shrink();
    final color = _statusIsError ? AppColors.danger : AppColors.success;
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.5)),
        ),
        child: Row(
          children: [
            Icon(
              _statusIsError ? Icons.error_outline : Icons.check_circle_outline,
              color: color,
              size: 18,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                _statusMessage!,
                style: AppText.body.copyWith(color: AppColors.textPrimary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _xtreamForm() {
    final compact = MediaQuery.sizeOf(context).height < 470;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        GlassField(
          controller: _serverCtrl,
          label: 'Server URL',
          hint: 'http://example.com:8080',
          icon: Icons.dns_outlined,
          keyboardType: TextInputType.url,
          compact: compact,
        ),
        SizedBox(height: compact ? 8 : 14),
        if (compact)
          Row(
            children: [
              Expanded(
                child: GlassField(
                  controller: _userCtrl,
                  label: 'Username',
                  hint: 'Your username',
                  icon: Icons.person_outline,
                  compact: true,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GlassField(
                  controller: _passCtrl,
                  label: 'Password',
                  hint: 'Your password',
                  icon: Icons.lock_outline,
                  obscure: true,
                  compact: true,
                ),
              ),
            ],
          )
        else ...[
          GlassField(
            controller: _userCtrl,
            label: 'Username',
            hint: 'Your username',
            icon: Icons.person_outline,
          ),
          const SizedBox(height: 14),
          GlassField(
            controller: _passCtrl,
            label: 'Password',
            hint: 'Your password',
            icon: Icons.lock_outline,
            obscure: true,
          ),
        ],
        _statusBanner(),
        SizedBox(height: compact ? 10 : 22),
        Row(
          children: [
            Expanded(
              child: SecondaryButton(
                label: 'Test',
                icon: Icons.wifi_tethering_rounded,
                onPressed: _busy ? null : _testXtream,
                height: compact ? 42 : 54,
              ),
            ),
            SizedBox(width: compact ? 10 : 14),
            Expanded(
              flex: 2,
              child: PrimaryButton(
                label: 'Save & Enter',
                icon: Icons.login_rounded,
                loading: _busy,
                onPressed: _busy ? null : _saveXtream,
                height: compact ? 42 : 54,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _m3uForm() {
    final compact = MediaQuery.sizeOf(context).height < 470;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        GlassField(
          controller: _m3uNameCtrl,
          label: 'Playlist name',
          hint: 'My Playlist',
          icon: Icons.label_outline,
          compact: compact,
        ),
        SizedBox(height: compact ? 9 : 14),
        GlassField(
          controller: _m3uUrlCtrl,
          label: 'M3U URL',
          hint: 'http://example.com/playlist.m3u8',
          icon: Icons.link_rounded,
          keyboardType: TextInputType.url,
          compact: compact,
        ),
        _statusBanner(),
        SizedBox(height: compact ? 14 : 22),
        Row(
          children: [
            Expanded(
              child: SecondaryButton(
                label: 'Test',
                icon: Icons.wifi_tethering_rounded,
                onPressed: _busy ? null : _testM3u,
                height: compact ? 46 : 54,
              ),
            ),
            SizedBox(width: compact ? 10 : 14),
            Expanded(
              flex: 2,
              child: PrimaryButton(
                label: 'Save & Enter',
                icon: Icons.login_rounded,
                loading: _busy,
                onPressed: _busy ? null : _saveM3u,
                height: compact ? 46 : 54,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _activationForm() {
    final deviceId = ref.watch(deviceServiceProvider).deviceId;
    final session = _activationSession;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _DevicePanel(deviceId: deviceId),
        const SizedBox(height: 16),
        if (session == null)
          _ActivationIntro(
            backendUrl: AppConfig.webBaseUrl,
            onCreate: _busy ? null : _createActivation,
            loading: _busy,
          )
        else
          _QrPanel(
            session: session,
            onCopyCode: () =>
                Clipboard.setData(ClipboardData(text: session.code)),
            onCopyLink: () => Clipboard.setData(
              ClipboardData(text: session.activationUrl.toString()),
            ),
            onRefresh: _busy ? null : _createActivation,
            loading: _busy,
          ),
        _statusBanner(),
      ],
    );
  }
}

class _DevicePanel extends StatelessWidget {
  const _DevicePanel({required this.deviceId});

  final String deviceId;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.glassFill,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.glassStroke),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.devices_other_rounded,
            color: AppColors.primaryBright,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Device ID', style: AppText.label),
                const SizedBox(height: 4),
                SelectableText(
                  deviceId,
                  style: AppText.title.copyWith(letterSpacing: 0),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActivationIntro extends StatelessWidget {
  const _ActivationIntro({
    required this.backendUrl,
    required this.onCreate,
    required this.loading,
  });

  final String backendUrl;
  final VoidCallback? onCreate;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).height < 470;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.black.withValues(alpha: 0.28),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.glassStroke),
          ),
          child: Row(
            children: [
              const Icon(Icons.public_rounded, color: AppColors.primaryBright),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  backendUrl,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.body.copyWith(color: AppColors.textPrimary),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        PrimaryButton(
          label: 'Create QR Code',
          icon: Icons.qr_code_2_rounded,
          loading: loading,
          onPressed: onCreate,
          height: compact ? 46 : 54,
        ),
      ],
    );
  }
}

class _QrPanel extends StatelessWidget {
  const _QrPanel({
    required this.session,
    required this.onCopyCode,
    required this.onCopyLink,
    required this.onRefresh,
    required this.loading,
  });

  final ActivationSession session;
  final VoidCallback onCopyCode;
  final VoidCallback onCopyLink;
  final VoidCallback? onRefresh;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).height < 470;
    final qrSize = compact ? 138.0 : 210.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(
          child: Container(
            width: qrSize,
            height: qrSize,
            padding: EdgeInsets.all(compact ? 9 : 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.25),
                  blurRadius: 30,
                  spreadRadius: -10,
                ),
              ],
            ),
            child: QrImageView(
              data: session.activationUrl.toString(),
              version: QrVersions.auto,
              backgroundColor: Colors.white,
            ),
          ),
        ),
        SizedBox(height: compact ? 10 : 16),
        Container(
          padding: EdgeInsets.symmetric(
            horizontal: compact ? 12 : 16,
            vertical: compact ? 10 : 14,
          ),
          decoration: BoxDecoration(
            color: AppColors.black.withValues(alpha: 0.34),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.glassStroke),
          ),
          child: Column(
            children: [
              Text('Activation Code', style: AppText.label),
              const SizedBox(height: 6),
              SelectableText(
                session.code,
                style: AppText.display.copyWith(
                  letterSpacing: 0,
                  fontSize: compact ? 24 : null,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Expires ${session.expiresAt.toLocal().toString().split('.').first}',
                style: AppText.label,
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: SecondaryButton(
                label: 'Copy Code',
                icon: Icons.copy_rounded,
                onPressed: onCopyCode,
                height: compact ? 42 : 54,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: SecondaryButton(
                label: 'Copy Link',
                icon: Icons.link_rounded,
                onPressed: onCopyLink,
                height: compact ? 42 : 54,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        PrimaryButton(
          label: 'New Code',
          icon: Icons.refresh_rounded,
          loading: loading,
          onPressed: onRefresh,
          height: compact ? 46 : 54,
        ),
      ],
    );
  }
}

class _SmartBrandPanel extends StatefulWidget {
  const _SmartBrandPanel();

  @override
  State<_SmartBrandPanel> createState() => _SmartBrandPanelState();
}

class _SmartBrandPanelState extends State<_SmartBrandPanel>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 4200),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxHeight < 560;
        final motion = !MediaQuery.disableAnimationsOf(context);
        return Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(compact ? 18 : 28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppLogo(size: compact ? 76 : 110, showWordmark: true),
                SizedBox(height: compact ? 14 : 24),
                Text(
                  'Your cinema, tuned for iPhone.',
                  style: compact ? AppText.title : AppText.headline,
                ),
                SizedBox(height: compact ? 12 : 16),
                AnimatedBuilder(
                  animation: _controller,
                  builder: (context, child) {
                    final t = motion ? _controller.value : 0.5;
                    final tilt = math.sin(t * math.pi * 2) * 0.045;
                    return Transform(
                      alignment: Alignment.center,
                      transform: Matrix4.identity()
                        ..setEntry(3, 2, 0.0011)
                        ..rotateY(tilt)
                        ..rotateX(-tilt * 0.45),
                      child: child,
                    );
                  },
                  child: _LoginPreview(compact: compact),
                ),
                SizedBox(height: compact ? 12 : 18),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: const [
                    _LoginChip(label: 'Live', icon: Icons.live_tv_rounded),
                    _LoginChip(label: 'Movies', icon: Icons.movie_rounded),
                    _LoginChip(
                      label: 'Series',
                      icon: Icons.video_library_rounded,
                    ),
                    _LoginChip(label: 'QR', icon: Icons.qr_code_rounded),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _LoginPreview extends StatelessWidget {
  const _LoginPreview({required this.compact});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: compact ? 154 : 210,
      width: double.infinity,
      padding: EdgeInsets.all(compact ? 12 : 16),
      decoration: BoxDecoration(
        color: AppColors.black.withValues(alpha: 0.34),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.glassStroke),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.18),
            blurRadius: 34,
            spreadRadius: -10,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppColors.surfaceHigh, AppColors.background],
                ),
              ),
            ),
          ),
          Positioned(
            left: compact ? 12 : 16,
            top: compact ? 12 : 16,
            child: _PreviewBadge(compact: compact),
          ),
          Positioned(
            right: compact ? 12 : 18,
            top: compact ? 14 : 18,
            child: Container(
              width: compact ? 68 : 92,
              height: compact ? 42 : 58,
              decoration: BoxDecoration(
                gradient: AppColors.orangeGradient,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.play_arrow_rounded,
                color: Colors.white,
                size: 30,
              ),
            ),
          ),
          Positioned(
            left: compact ? 12 : 16,
            right: compact ? 12 : 16,
            bottom: compact ? 12 : 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'MoPlayer Pro',
                  style: (compact ? AppText.subtitle : AppText.title).copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: compact ? 8 : 12),
                Row(
                  children: [
                    Expanded(
                      child: _MiniRail(label: 'Live', value: '124'),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _MiniRail(label: 'Movies', value: '70'),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _MiniRail(label: 'Series', value: '41'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PreviewBadge extends StatelessWidget {
  const _PreviewBadge({required this.compact});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 10,
        vertical: compact ? 5 : 6,
      ),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.45)),
      ),
      child: Text(
        'READY',
        style: AppText.label.copyWith(
          color: AppColors.success,
          fontSize: compact ? 10 : null,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _MiniRail extends StatelessWidget {
  const _MiniRail({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.glassStroke),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.label,
            ),
          ),
          Text(value, style: AppText.label.copyWith(color: Colors.white)),
        ],
      ),
    );
  }
}

class _LoginChip extends StatelessWidget {
  const _LoginChip({required this.label, required this.icon});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.glassFill,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.glassStroke),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.primaryBright),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppText.label.copyWith(color: AppColors.textPrimary),
          ),
        ],
      ),
    );
  }
}

class _FormCard extends StatelessWidget {
  const _FormCard({
    required this.method,
    required this.onDemo,
    required this.onMethodChanged,
    required this.child,
  });

  final _LoginMethod method;
  final VoidCallback? onDemo;
  final ValueChanged<_LoginMethod> onMethodChanged;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).height < 470;
    return GlassPanel(
      padding: EdgeInsets.all(compact ? 16 : 22),
      glow: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Sign in', style: compact ? AppText.title : AppText.headline),
          if (!compact) ...[
            const SizedBox(height: 4),
            Text(
              'Choose how you want to connect',
              style: AppText.body.copyWith(color: AppColors.textMuted),
            ),
          ],
          SizedBox(height: compact ? 12 : 18),
          _MethodTabs(
            method: method,
            compact: compact,
            onChanged: onMethodChanged,
          ),
          SizedBox(height: compact ? 14 : 22),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 280),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, animation) {
              final curved = CurvedAnimation(
                parent: animation,
                curve: Curves.easeOutCubic,
              );
              return AnimatedBuilder(
                animation: curved,
                child: child,
                builder: (context, child) {
                  final value = curved.value;
                  return Opacity(
                    opacity: value,
                    child: Transform(
                      alignment: Alignment.center,
                      transform: Matrix4.identity()
                        ..setEntry(3, 2, 0.001)
                        ..rotateY((1 - value) * 0.08)
                        ..scaleByDouble(
                          0.96 + (value * 0.04),
                          0.96 + (value * 0.04),
                          0.96 + (value * 0.04),
                          1,
                        ),
                      child: child,
                    ),
                  );
                },
              );
            },
            child: KeyedSubtree(key: ValueKey(method), child: child),
          ),
          SizedBox(height: compact ? 12 : 16),
          _LegalNotice(compact: compact),
          SizedBox(height: compact ? 10 : 14),
          SecondaryButton(
            label: 'Open Legal Demo',
            icon: Icons.verified_user_rounded,
            onPressed: onDemo,
            height: compact ? 40 : 46,
          ),
          if (context.canPop()) ...[
            SizedBox(height: compact ? 8 : 10),
            SecondaryButton(
              label: 'Cancel',
              icon: Icons.close_rounded,
              onPressed: () => context.pop(),
              height: compact ? 40 : 46,
            ),
          ],
        ],
      ),
    );
  }
}

class _LegalNotice extends StatelessWidget {
  const _LegalNotice({required this.compact});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 10 : 12,
        vertical: compact ? 9 : 11,
      ),
      decoration: BoxDecoration(
        color: AppColors.black.withValues(alpha: 0.26),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.glassStroke),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.info_outline_rounded,
            size: 17,
            color: AppColors.primaryBright,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'MoPlayer is a media player only. It does not provide channels, playlists, movies, TV streams, or copyrighted content. Add only sources you are legally allowed to use.',
              maxLines: compact ? 2 : 3,
              overflow: TextOverflow.ellipsis,
              style: AppText.label.copyWith(color: AppColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}

class _MethodTabs extends StatelessWidget {
  const _MethodTabs({
    required this.method,
    required this.onChanged,
    required this.compact,
  });

  final _LoginMethod method;
  final ValueChanged<_LoginMethod> onChanged;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    const tabs = [
      (_LoginMethod.xtream, 'Xtream', Icons.dns_rounded),
      (_LoginMethod.m3u, 'M3U URL', Icons.link_rounded),
      (_LoginMethod.activation, 'Activation', Icons.qr_code_rounded),
    ];
    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: AppColors.black.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.glassStroke),
      ),
      child: Row(
        children: [
          for (final t in tabs)
            Expanded(
              child: GestureDetector(
                onTap: () => onChanged(t.$1),
                behavior: HitTestBehavior.opaque,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: EdgeInsets.symmetric(vertical: compact ? 9 : 11),
                  decoration: BoxDecoration(
                    gradient: method == t.$1 ? AppColors.orangeGradient : null,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        t.$3,
                        size: 16,
                        color: method == t.$1
                            ? Colors.white
                            : AppColors.textMuted,
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          t.$2,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.label.copyWith(
                            color: method == t.$1
                                ? Colors.white
                                : AppColors.textMuted,
                            fontWeight: method == t.$1
                                ? FontWeight.w700
                                : FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
