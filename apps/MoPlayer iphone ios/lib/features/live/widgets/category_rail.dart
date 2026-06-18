import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../models/category.dart';

/// A vertical, selectable list of categories used by Live / Movies / Series.
class CategoryRail extends StatelessWidget {
  const CategoryRail({
    super.key,
    required this.categories,
    required this.selectedId,
    required this.onSelected,
    this.compact = false,
  });

  final List<Category> categories;
  final String selectedId;
  final ValueChanged<String> onSelected;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.glassFill,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.glassStroke),
      ),
      child: ListView.builder(
        padding: EdgeInsets.all(compact ? 6 : 8),
        itemCount: categories.length,
        itemBuilder: (context, i) {
          final cat = categories[i];
          final selected = cat.id == selectedId;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 3),
            child: GestureDetector(
              onTap: () => onSelected(cat.id),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                padding: EdgeInsets.symmetric(
                  horizontal: compact ? 10 : 14,
                  vertical: compact ? 9 : 12,
                ),
                decoration: BoxDecoration(
                  gradient: selected ? AppColors.orangeGradient : null,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        cat.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.subtitle.copyWith(
                          color: selected
                              ? Colors.white
                              : AppColors.textSecondary,
                          fontWeight: selected
                              ? FontWeight.w700
                              : FontWeight.w600,
                          fontSize: compact ? 13 : null,
                        ),
                      ),
                    ),
                    if (cat.count != null)
                      Text(
                        Fmt.compact(cat.count!),
                        style: AppText.label.copyWith(
                          color: selected
                              ? Colors.white70
                              : AppColors.textMuted,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
