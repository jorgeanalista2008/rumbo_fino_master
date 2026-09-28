import 'package:flutter/material.dart';
import '../theme/executive_colors.dart';
import '../theme/executive_typography.dart';

class RfShortcutChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const RfShortcutChip({
    super.key,
    required this.label,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            decoration: BoxDecoration(
              color: ExecutiveColors.surfaceElevated,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: ExecutiveColors.border),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, color: ExecutiveColors.gold, size: 20),
                const SizedBox(height: 6),
                Text(
                  label,
                  style: ExecutiveTypography.bodySmall.copyWith(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: ExecutiveColors.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
