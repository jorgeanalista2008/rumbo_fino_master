import 'package:flutter/material.dart';
import '../theme/executive_colors.dart';
import '../theme/executive_typography.dart';
import '../atoms/rf_avatar.dart';

class RfUserPill extends StatelessWidget {
  final String name;
  final String subtitle;
  final String? imageUrl;
  final VoidCallback? onTap;

  const RfUserPill({
    super.key,
    required this.name,
    this.subtitle = 'Membresía Ejecutiva',
    this.imageUrl,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: ExecutiveColors.surfaceGlass,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: ExecutiveColors.borderLight),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 12,
              ),
            ],
          ),
          child: Row(
            children: [
              RfAvatar(
                name: name,
                imageUrl: imageUrl,
                radius: 16,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      name,
                      style: ExecutiveTypography.bodyMedium.copyWith(
                        fontWeight: FontWeight.w700,
                        color: ExecutiveColors.textPrimary,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      subtitle,
                      style: ExecutiveTypography.bodySmall.copyWith(
                        fontSize: 10,
                        color: ExecutiveColors.gold,
                        fontWeight: FontWeight.w600,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class RfBcvRatePill extends StatelessWidget {
  final double rate;
  final VoidCallback? onTap;

  const RfBcvRatePill({
    super.key,
    required this.rate,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: ExecutiveColors.surfaceGlass,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: ExecutiveColors.borderGold),
            boxShadow: [
              BoxShadow(
                color: ExecutiveColors.gold.withOpacity(0.08),
                blurRadius: 8,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'TASA BCV',
                style: ExecutiveTypography.bodySmall.copyWith(
                  fontSize: 8.5,
                  fontWeight: FontWeight.bold,
                  color: ExecutiveColors.gold,
                  letterSpacing: 0.5,
                ),
              ),
              Text(
                'Bs. ${rate.toStringAsFixed(2)}',
                style: ExecutiveTypography.bodyMedium.copyWith(
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
