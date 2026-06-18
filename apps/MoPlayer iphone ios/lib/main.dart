import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:media_kit/media_kit.dart';

import 'app/app.dart';
import 'app/bootstrap.dart';
import 'core/utils/orientation.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialise the native video stack (libmpv) once, before any Player.
  MediaKit.ensureInitialized();

  // MoPlayer Pro is a landscape-first experience.
  await OrientationLock.landscape();

  final boot = await bootstrap();

  runApp(ProviderScope(overrides: boot.overrides, child: const MoPlayerApp()));
}
