import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/executive_colors.dart';

class RfAvatar extends StatelessWidget {
  final String? name;
  final String? imageUrl;
  final double radius;
  final bool hasGoldBorder;

  const RfAvatar({
    super.key,
    this.name,
    this.imageUrl,
    this.radius = 20,
    this.hasGoldBorder = true,
  });

  String get _initials {
    if (name == null || name!.isEmpty) return 'RF';
    final parts = name!.trim().split(' ');
    if (parts.length > 1) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: radius * 2,
      height: radius * 2,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: hasGoldBorder ? ExecutiveColors.gold : ExecutiveColors.borderLight,
          width: 1.5,
        ),
        boxShadow: [
          if (hasGoldBorder)
            BoxShadow(
              color: ExecutiveColors.gold.withOpacity(0.2),
              blurRadius: 8,
            ),
        ],
      ),
      child: CircleAvatar(
        radius: radius,
        backgroundColor: ExecutiveColors.surfaceElevated,
        backgroundImage: imageUrl != null && imageUrl!.isNotEmpty
            ? NetworkImage(imageUrl!)
            : null,
        child: (imageUrl == null || imageUrl!.isEmpty)
            ? Text(
                _initials,
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: radius * 0.75,
                  fontWeight: FontWeight.w800,
                  color: ExecutiveColors.gold,
                ),
              )
            : null,
      ),
    );
  }
}

class RfEmblem extends StatelessWidget {
  final double size;
  final bool withAnimation;

  const RfEmblem({
    super.key,
    this.size = 80,
    this.withAnimation = true,
  });

  @override
  Widget build(BuildContext context) {
    Widget emblem = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: ExecutiveColors.goldGradient,
        borderRadius: BorderRadius.circular(size * 0.28),
        boxShadow: [
          BoxShadow(
            color: ExecutiveColors.gold.withOpacity(0.35),
            blurRadius: size * 0.35,
            offset: Offset(0, size * 0.1),
          ),
        ],
      ),
      child: Center(
        child: Text(
          'RF',
          style: TextStyle(
            fontFamily: 'Outfit',
            fontSize: size * 0.45,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF090B0E),
            letterSpacing: -1,
          ),
        ),
      ),
    );

    if (withAnimation) {
      return emblem
          .animate()
          .scale(duration: 600.ms, curve: Curves.easeOutBack)
          .shimmer(delay: 400.ms, duration: 1200.ms, color: Colors.white30);
    }

    return emblem;
  }
}
