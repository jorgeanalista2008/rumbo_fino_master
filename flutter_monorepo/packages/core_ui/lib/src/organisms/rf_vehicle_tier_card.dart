import 'package:flutter/material.dart';
import '../theme/executive_colors.dart';
import '../theme/executive_typography.dart';
import '../atoms/rf_badge.dart';
import '../widgets/luxury_card.dart';
import '../widgets/dual_currency_display.dart';

class RfVehicleTierCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String badgeText;
  final double fareUsd;
  final double bcvRate;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const RfVehicleTierCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.badgeText,
    required this.fareUsd,
    required this.bcvRate,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: LuxuryCard(
        padding: const EdgeInsets.all(14),
        hasGoldBorder: isSelected,
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: isSelected
                    ? ExecutiveColors.gold.withOpacity(0.15)
                    : ExecutiveColors.surfaceElevated,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isSelected ? ExecutiveColors.gold : ExecutiveColors.border,
                ),
              ),
              child: Icon(
                icon,
                color: isSelected ? ExecutiveColors.gold : ExecutiveColors.textSecondary,
                size: 24,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: ExecutiveTypography.bodyLarge.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isSelected ? ExecutiveColors.gold : Colors.white,
                        ),
                      ),
                      const SizedBox(width: 6),
                      RfBadge(
                        text: badgeText,
                        fontSize: 8,
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: ExecutiveTypography.bodySmall.copyWith(fontSize: 11),
                  ),
                ],
              ),
            ),
            DualCurrencyDisplay(
              amountUsd: fareUsd,
              bcvRate: bcvRate,
              isLarge: false,
            ),
          ],
        ),
      ),
    );
  }
}
