import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

/// A labelled, glassy text field with a leading icon and a password reveal.
class GlassField extends StatefulWidget {
  const GlassField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.icon,
    this.obscure = false,
    this.keyboardType,
    this.compact = false,
  });

  final TextEditingController controller;
  final String label;
  final String? hint;
  final IconData? icon;
  final bool obscure;
  final TextInputType? keyboardType;
  final bool compact;

  @override
  State<GlassField> createState() => _GlassFieldState();
}

class _GlassFieldState extends State<GlassField> {
  late bool _hidden = widget.obscure;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!widget.compact)
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 6),
            child: Text(widget.label, style: AppText.label),
          ),
        TextField(
          controller: widget.controller,
          obscureText: _hidden,
          keyboardType: widget.keyboardType,
          style: AppText.body.copyWith(color: AppColors.textPrimary),
          autocorrect: false,
          enableSuggestions: !widget.obscure,
          decoration: InputDecoration(
            isDense: widget.compact,
            contentPadding: EdgeInsets.symmetric(
              horizontal: widget.compact ? 14 : 16,
              vertical: widget.compact ? 8 : 16,
            ),
            labelText: widget.compact ? widget.label : null,
            hintText: widget.hint,
            prefixIcon: widget.icon != null
                ? Icon(widget.icon, color: AppColors.textMuted, size: 20)
                : null,
            suffixIcon: widget.obscure
                ? IconButton(
                    onPressed: () => setState(() => _hidden = !_hidden),
                    icon: Icon(
                      _hidden
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      color: AppColors.textMuted,
                      size: 20,
                    ),
                  )
                : null,
          ),
        ),
      ],
    );
  }
}
