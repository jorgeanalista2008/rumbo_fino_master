import 'package:flutter/material.dart';

class ExecutiveColors {
  ExecutiveColors._();

  // Backgrounds
  static const Color background = Color(0xFF090B0E);
  static const Color surface = Color(0xFF12151C);
  static const Color surfaceElevated = Color(0xFF1A1F29);
  static const Color surfaceGlass = Color(0xD912151C);

  // Luxury Gold Palette
  static const Color gold = Color(0xFFD4AF37);
  static const Color goldLight = Color(0xFFF6E7B0);
  static const Color goldDark = Color(0xFFA68519);
  static const Color goldGlow = Color(0x33D4AF37);
  
  // Gradients
  static const LinearGradient goldGradient = LinearGradient(
    colors: [Color(0xFFF6E7B0), Color(0xFFD4AF37), Color(0xFFA68519)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkCardGradient = LinearGradient(
    colors: [Color(0xFF161A22), Color(0xFF0F1218)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkGlassGradient = LinearGradient(
    colors: [Color(0xCC1A1F29), Color(0xCC12151C)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // Status & Accents
  static const Color success = Color(0xFF10B981);
  static const Color successGlow = Color(0x3310B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Typography
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  // Borders
  static const Color border = Color(0xFF262C38);
  static const Color borderLight = Color(0x1AFFFFFF);
  static const Color borderGold = Color(0x4DD4AF37);
}
