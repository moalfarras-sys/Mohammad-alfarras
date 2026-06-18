import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart';

/// Shared logger. Verbose in debug, silent in release.
final Logger log = Logger(
  level: kReleaseMode ? Level.warning : Level.debug,
  printer: PrettyPrinter(
    methodCount: 0,
    errorMethodCount: 6,
    lineLength: 90,
    colors: false,
    printEmojis: true,
    dateTimeFormat: DateTimeFormat.none,
  ),
);
