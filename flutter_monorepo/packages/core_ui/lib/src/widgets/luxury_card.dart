import 'package:flutter/material.dart';
import '../theme/executive_colors.dart';

class LuxuryCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final VoidCallback? onTap;
  final bool hasGoldBorder;
  final LinearGradient? gradient;

  const LuxuryCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.margin,
    this.borderRadius = 20,
    this.onTap,
    this.hasGoldBorder = false,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    Widget cardContent = Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        gradient: gradient ?? ExecutiveColors.darkCardGradient,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: hasGoldBorder ? ExecutiveColors.borderGold : ExecutiveColors.borderLight,
          width: hasGoldBorder ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.35),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
          if (hasGoldBorder)
            BoxShadow(
              color: ExecutiveColors.gold.withOpacity(0.08),
              blurRadius: 20,
              spreadRadius: 1,
            ),
        ],
      ),
      child: child,
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(borderRadius),
          child: cardContent,
        ),
      );
    }

    return cardContent;
  }
}
