import 'package:flutter/material.dart';
import '../theme/executive_colors.dart';
import '../theme/executive_typography.dart';

class DualCurrencyDisplay extends StatelessWidget {
  final double amountUsd;
  final double bcvRate;
  final bool isLarge;

  const DualCurrencyDisplay({
    super.key,
    required this.amountUsd,
    this.bcvRate = 64.85,
    this.isLarge = true,
  });

  @override
  Widget build(BuildContext context) {
    final double amountBs = amountUsd * (bcvRate > 0 ? bcvRate : 64.85);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(
              '\$${amountUsd.toStringAsFixed(2)}',
              style: isLarge
                  ? ExecutiveTypography.currencyUsd
                  : ExecutiveTypography.h3.copyWith(color: ExecutiveColors.goldLight),
            ),
            const SizedBox(width: 4),
            Text(
              'USD',
              style: ExecutiveTypography.bodySmall.copyWith(
                color: ExecutiveColors.gold,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: ExecutiveColors.gold.withOpacity(0.12),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'BCV',
                style: ExecutiveTypography.bodySmall.copyWith(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: ExecutiveColors.gold,
                ),
              ),
            ),
            const SizedBox(width: 6),
            Text(
              'Bs. ${amountBs.toStringAsFixed(2)}',
              style: ExecutiveTypography.currencyBcv,
            ),
          ],
        ),
      ],
    );
  }
}
