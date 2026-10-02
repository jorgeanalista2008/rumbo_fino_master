import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/executive_colors.dart';

class RfAvatar extends StatefulWidget {
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

  @override
  State<RfAvatar> createState() => _RfAvatarState();
}

class _RfAvatarState extends State<RfAvatar> {
  bool _hasError = false;

  @override
  void didUpdateWidget(covariant RfAvatar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.imageUrl != widget.imageUrl) {
      setState(() {
        _hasError = false;
      });
    }
  }

  String get _initials {
    final name = widget.name;
    if (name == null || name.trim().isEmpty) return 'RF';
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length > 1) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  ImageProvider? get _imageProvider {
    if (_hasError) return null;
    final url = widget.imageUrl;
    if (url == null || url.trim().isEmpty) return null;
    final trimmed = url.trim();
    if (trimmed.startsWith('data:image/') && trimmed.contains('base64,')) {
      try {
        final b64 = trimmed.split('base64,').last;
        return MemoryImage(base64Decode(b64));
      } catch (_) {
        return null;
      }
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return NetworkImage(trimmed);
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final imageProvider = _imageProvider;

    return Container(
      width: widget.radius * 2,
      height: widget.radius * 2,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: widget.hasGoldBorder ? ExecutiveColors.gold : ExecutiveColors.borderLight,
          width: 1.5,
        ),
        boxShadow: [
          if (widget.hasGoldBorder)
            BoxShadow(
              color: ExecutiveColors.gold.withValues(alpha: 0.2),
              blurRadius: 8,
            ),
        ],
      ),
      child: CircleAvatar(
        radius: widget.radius,
        backgroundColor: ExecutiveColors.surfaceElevated,
        backgroundImage: imageProvider,
        onBackgroundImageError: imageProvider != null
            ? (_, __) {
                if (mounted) {
                  setState(() {
                    _hasError = true;
                  });
                }
              }
            : null,
        child: imageProvider == null
            ? Text(
                _initials,
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: widget.radius * 0.75,
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
            color: ExecutiveColors.gold.withValues(alpha: 0.35),
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
