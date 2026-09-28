import 'package:flutter/material.dart';
import '../theme/executive_colors.dart';
import '../molecules/rf_user_pill.dart';

class RfTopHeader extends StatelessWidget {
  final String userName;
  final String userSubtitle;
  final String? userAvatarUrl;
  final double bcvRate;
  final VoidCallback? onUserTap;
  final VoidCallback? onBcvTap;
  final VoidCallback? onLogoutTap;

  const RfTopHeader({
    super.key,
    required this.userName,
    this.userSubtitle = 'Membresía Ejecutiva',
    this.userAvatarUrl,
    required this.bcvRate,
    this.onUserTap,
    this.onBcvTap,
    this.onLogoutTap,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            // User greeting molecule
            Expanded(
              child: RfUserPill(
                name: userName,
                subtitle: userSubtitle,
                imageUrl: userAvatarUrl,
                onTap: onUserTap,
              ),
            ),
            const SizedBox(width: 10),

            // BCV rate molecule
            RfBcvRatePill(
              rate: bcvRate,
              onTap: onBcvTap,
            ),
            const SizedBox(width: 10),

            // Logout action atom
            if (onLogoutTap != null)
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: onLogoutTap,
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: ExecutiveColors.surfaceGlass,
                      shape: BoxShape.circle,
                      border: Border.all(color: ExecutiveColors.borderLight),
                    ),
                    child: const Icon(
                      Icons.logout,
                      color: ExecutiveColors.textSecondary,
                      size: 20,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
