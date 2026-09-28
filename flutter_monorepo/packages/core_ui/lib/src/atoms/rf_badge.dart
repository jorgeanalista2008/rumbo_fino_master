import 'package:flutter/material.dart';
import '../theme/executive_colors.dart';

enum RfBadgeVariant { gold, success, warning, error, neutral }

class RfBadge extends StatelessWidget {
  final String text;
  final RfBadgeVariant variant;
  final double fontSize;
  final EdgeInsetsGeometry padding;

  const RfBadge({
    super.key,
    required this.text,
    this.variant = RfBadgeVariant.gold,
    this.fontSize = 10,
    this.padding = const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    Color border;

    switch (variant) {
      case RfBadgeVariant.gold:
        bg = ExecutiveColors.gold.withOpacity(0.12);
        fg = ExecutiveColors.gold;
        border = ExecutiveColors.gold.withOpacity(0.35);
        break;
      case RfBadgeVariant.success:
        bg = ExecutiveColors.success.withOpacity(0.12);
        fg = ExecutiveColors.success;
        border = ExecutiveColors.success.withOpacity(0.35);
        break;
      case RfBadgeVariant.warning:
        bg = ExecutiveColors.warning.withOpacity(0.12);
        fg = ExecutiveColors.warning;
        border = ExecutiveColors.warning.withOpacity(0.35);
        break;
      case RfBadgeVariant.error:
        bg = ExecutiveColors.error.withOpacity(0.12);
        fg = ExecutiveColors.error;
        border = ExecutiveColors.error.withOpacity(0.35);
        break;
      case RfBadgeVariant.neutral:
        bg = ExecutiveColors.surfaceElevated;
        fg = ExecutiveColors.textSecondary;
        border = ExecutiveColors.border;
        break;
    }

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border, width: 1),
      ),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          fontFamily: 'Plus Jakarta Sans',
          fontSize: fontSize,
          fontWeight: FontWeight.w800,
          color: fg,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}
