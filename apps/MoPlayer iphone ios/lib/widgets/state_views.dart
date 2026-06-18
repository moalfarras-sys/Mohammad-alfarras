import 'package:flutter/material.dart';

import '../core/error/failures.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';

/// A friendly empty state — never a blank screen.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    this.message,
    this.icon = Icons.inbox_outlined,
    this.action,
  });

  final String title;
  final String? message;
  final IconData icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.glassFill,
                border: Border.all(color: AppColors.glassStroke),
              ),
              child: Icon(icon, size: 36, color: AppColors.primaryBright),
            ),
            const SizedBox(height: 18),
            Text(title, style: AppText.title, textAlign: TextAlign.center),
            if (message != null) ...[
              const SizedBox(height: 8),
              Text(message!, style: AppText.body, textAlign: TextAlign.center),
            ],
            if (action != null) ...[const SizedBox(height: 20), action!],
          ],
        ),
      ),
    );
  }
}

/// A typed error view with a retry affordance.
class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.error, this.onRetry});

  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final failure = error is Failure
        ? error as Failure
        : Failure('Something went wrong. Please try again.');
    final icon = switch (failure.kind) {
      FailureKind.network => Icons.wifi_off_rounded,
      FailureKind.timeout => Icons.hourglass_empty_rounded,
      FailureKind.auth => Icons.lock_outline_rounded,
      FailureKind.notConfigured => Icons.settings_suggest_outlined,
      _ => Icons.error_outline_rounded,
    };

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 44, color: AppColors.danger),
            const SizedBox(height: 16),
            Text(
              failure.message,
              style: AppText.body.copyWith(color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 18),
              TextButton.icon(
                onPressed: onRetry,
                icon: const Icon(
                  Icons.refresh_rounded,
                  color: AppColors.primaryBright,
                ),
                label: Text(
                  'Try again',
                  style: AppText.button.copyWith(
                    color: AppColors.primaryBright,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
