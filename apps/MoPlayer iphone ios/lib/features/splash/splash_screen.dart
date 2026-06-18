import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../providers/core_providers.dart';
import '../../providers/library_providers.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/gradient_background.dart';

/// Cinematic boot screen — warms the local library / cloud sync, then routes
/// to Home (logged in) or Login.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..forward();

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    final loggedIn = ref.read(isLoggedInProvider);
    final started = DateTime.now();
    if (loggedIn && ref.read(settingsProvider).syncOnLaunch) {
      // Pull cloud library (no-op without Supabase) before showing Home.
      await ref.read(libraryActionsProvider).syncFromCloud();
    }
    // Keep a minimum dwell so the brand moment is felt.
    final elapsed = DateTime.now().difference(started);
    const minSplash = Duration(milliseconds: 1300);
    if (elapsed < minSplash) {
      await Future<void>.delayed(minSplash - elapsed);
    }
    if (!mounted) return;
    context.go(loggedIn ? Routes.home : Routes.login);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: Center(
          child: FadeTransition(
            opacity: _controller,
            child: ScaleTransition(
              scale: Tween<double>(begin: 0.8, end: 1.0).animate(
                CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const AppLogo(size: 150, showWordmark: true),
                  const SizedBox(height: 40),
                  const SizedBox(
                    width: 30,
                    height: 30,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Loading your cinema…',
                    style: AppText.label.copyWith(color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
