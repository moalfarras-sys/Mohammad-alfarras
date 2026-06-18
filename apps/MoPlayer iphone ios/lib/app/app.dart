import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/app_config.dart';
import '../core/theme/app_theme.dart';
import 'router.dart';

/// Root widget — wires the themed [MaterialApp.router] to the go_router graph.
class MoPlayerApp extends ConsumerWidget {
  const MoPlayerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      themeMode: ThemeMode.dark,
      routerConfig: router,
      builder: (context, child) {
        // Lock text scaling so the cinematic layout stays pixel-perfect.
        return MediaQuery.withClampedTextScaling(
          minScaleFactor: 0.9,
          maxScaleFactor: 1.1,
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
