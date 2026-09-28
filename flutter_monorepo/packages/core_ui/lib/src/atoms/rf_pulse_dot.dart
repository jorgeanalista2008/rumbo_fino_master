import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/executive_colors.dart';

enum PulseDotVariant { success, warning, error, gold }

class RfPulseDot extends StatelessWidget {
  final PulseDotVariant variant;
  final double size;
  final bool isPulsing;

  const RfPulseDot({
    super.key,
    this.variant = PulseDotVariant.success,
    this.size = 10,
    this.isPulsing = true,
  });

  Color get _color {
    switch (variant) {
      case PulseDotVariant.success:
        return ExecutiveColors.success;
      case PulseDotVariant.warning:
        return ExecutiveColors.warning;
      case PulseDotVariant.error:
        return ExecutiveColors.error;
      case PulseDotVariant.gold:
        return ExecutiveColors.gold;
    }
  }

  @override
  Widget build(BuildContext context) {
    final dot = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: _color,
        boxShadow: [
          BoxShadow(
            color: _color.withOpacity(0.4),
            blurRadius: size * 0.8,
            spreadRadius: 1,
          ),
        ],
      ),
    );

    if (!isPulsing) return dot;

    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: size * 2.2,
          height: size * 2.2,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _color.withOpacity(0.2),
          ),
        ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(
              begin: const Offset(0.8, 0.8),
              end: const Offset(1.3, 1.3),
              duration: 1000.ms,
            ),
        dot,
      ],
    );
  }
}
