import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../widgets/gradient_background.dart';

/// The landscape app frame: a slim glass navigation rail on the left and the
/// active branch on the right. Keeping the dock vertical maximises horizontal
/// space for cinematic content rows.
class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  static const _items = <_NavItem>[
    _NavItem('Home', Icons.home_rounded, Icons.home_outlined),
    _NavItem('Live', Icons.live_tv_rounded, Icons.live_tv_outlined),
    _NavItem('Movies', Icons.movie_rounded, Icons.movie_outlined),
    _NavItem(
      'Series',
      Icons.video_library_rounded,
      Icons.video_library_outlined,
    ),
    _NavItem('Search', Icons.search_rounded, Icons.search_outlined),
    _NavItem(
      'Favorites',
      Icons.favorite_rounded,
      Icons.favorite_outline_rounded,
    ),
    _NavItem('Settings', Icons.settings_rounded, Icons.settings_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final compact = size.height < 470 || size.width < 820;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop || navigationShell.currentIndex == 0) return;
        navigationShell.goBranch(0);
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: GradientBackground(
          child: SafeArea(
            child: Row(
              children: [
                _NavRail(
                  items: _items,
                  currentIndex: navigationShell.currentIndex,
                  onSelected: (i) => navigationShell.goBranch(
                    i,
                    initialLocation: i == navigationShell.currentIndex,
                  ),
                  compact: compact,
                ),
                Expanded(child: navigationShell),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  const _NavItem(this.label, this.active, this.inactive);
  final String label;
  final IconData active;
  final IconData inactive;
}

class _NavRail extends StatelessWidget {
  const _NavRail({
    required this.items,
    required this.currentIndex,
    required this.onSelected,
    required this.compact,
  });

  final List<_NavItem> items;
  final int currentIndex;
  final ValueChanged<int> onSelected;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: compact ? 68 : 84,
      margin: EdgeInsets.fromLTRB(compact ? 6 : 8, 8, 0, 8),
      decoration: BoxDecoration(
        color: AppColors.glassFill,
        borderRadius: BorderRadius.circular(compact ? 22 : 26),
        border: Border.all(color: AppColors.glassStroke),
      ),
      child: Column(
        children: [
          SizedBox(height: compact ? 6 : 8),
          Padding(
            padding: EdgeInsets.all(compact ? 3 : 4),
            child: Image.asset(
              'assets/branding/logo.png',
              height: compact ? 26 : 32,
            ),
          ),
          SizedBox(height: compact ? 0 : 2),
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.symmetric(vertical: compact ? 1 : 2),
              itemCount: items.length,
              itemBuilder: (context, i) {
                final selected = i == currentIndex;
                final item = items[i];
                return _RailButton(
                  item: item,
                  selected: selected,
                  onTap: () => onSelected(i),
                  compact: compact,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _RailButton extends StatelessWidget {
  const _RailButton({
    required this.item,
    required this.selected,
    required this.onTap,
    required this.compact,
  });

  final _NavItem item;
  final bool selected;
  final VoidCallback onTap;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 5 : 7,
        vertical: compact ? 0 : 1,
      ),
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: EdgeInsets.symmetric(vertical: compact ? 3 : 4),
          decoration: BoxDecoration(
            gradient: selected ? AppColors.orangeGradient : null,
            borderRadius: BorderRadius.circular(compact ? 16 : 18),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.40),
                      blurRadius: 18,
                      spreadRadius: -4,
                    ),
                  ]
                : null,
          ),
          child: Column(
            children: [
              Icon(
                selected ? item.active : item.inactive,
                color: selected ? Colors.white : AppColors.textMuted,
                size: compact ? 18 : 20,
              ),
              SizedBox(height: compact ? 0 : 1),
              Text(
                item.label,
                style: AppText.label.copyWith(
                  fontSize: compact ? 8 : 9,
                  color: selected ? Colors.white : AppColors.textMuted,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
