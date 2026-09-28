import 'package:flutter/material.dart';
import '../theme/executive_colors.dart';
import '../theme/executive_typography.dart';

enum LuxuryButtonVariant { gold, dark, outline, danger }

class LuxuryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final Widget? icon;
  final LuxuryButtonVariant variant;
  final double? width;
  final double height;
  final double borderRadius;

  const LuxuryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.variant = LuxuryButtonVariant.gold,
    this.width,
    this.height = 54,
    this.borderRadius = 16,
  });

  @override
  Widget build(BuildContext context) {
    final bool isDisabled = onPressed == null || isLoading;

    BoxDecoration decoration;
    Color textColor;

    switch (variant) {
      case LuxuryButtonVariant.gold:
        decoration = BoxDecoration(
          gradient: isDisabled ? null : ExecutiveColors.goldGradient,
          color: isDisabled ? ExecutiveColors.surfaceElevated : null,
          borderRadius: BorderRadius.circular(borderRadius),
          boxShadow: isDisabled
              ? null
              : [
                  BoxShadow(
                    color: ExecutiveColors.gold.withOpacity(0.25),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
        );
        textColor = isDisabled ? ExecutiveColors.textMuted : const Color(0xFF090B0E);
        break;

      case LuxuryButtonVariant.dark:
        decoration = BoxDecoration(
          color: ExecutiveColors.surfaceElevated,
          borderRadius: BorderRadius.circular(borderRadius),
          border: Border.all(color: ExecutiveColors.border),
        );
        textColor = ExecutiveColors.textPrimary;
        break;

      case LuxuryButtonVariant.outline:
        decoration = BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(borderRadius),
          border: Border.all(
            color: isDisabled ? ExecutiveColors.border : ExecutiveColors.gold,
            width: 1.5,
          ),
        );
        textColor = isDisabled ? ExecutiveColors.textMuted : ExecutiveColors.gold;
        break;

      case LuxuryButtonVariant.danger:
        decoration = BoxDecoration(
          color: ExecutiveColors.error.withOpacity(0.15),
          borderRadius: BorderRadius.circular(borderRadius),
          border: Border.all(color: ExecutiveColors.error.withOpacity(0.4)),
        );
        textColor = ExecutiveColors.error;
        break;
    }

    return Container(
      width: width ?? double.infinity,
      height: height,
      decoration: decoration,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isDisabled ? null : onPressed,
          borderRadius: BorderRadius.circular(borderRadius),
          child: Center(
            child: isLoading
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation<Color>(textColor),
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (icon != null) ...[
                        icon!,
                        const SizedBox(width: 10),
                      ],
                      Text(
                        text,
                        style: ExecutiveTypography.button.copyWith(
                          color: textColor,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
