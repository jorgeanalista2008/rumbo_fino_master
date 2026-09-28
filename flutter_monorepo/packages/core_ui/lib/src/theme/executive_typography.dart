import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'executive_colors.dart';

class ExecutiveTypography {
  ExecutiveTypography._();

  static TextStyle get h1 => GoogleFonts.outfit(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        color: ExecutiveColors.textPrimary,
        letterSpacing: -0.5,
      );

  static TextStyle get h2 => GoogleFonts.outfit(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: ExecutiveColors.textPrimary,
        letterSpacing: -0.3,
      );

  static TextStyle get h3 => GoogleFonts.outfit(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: ExecutiveColors.textPrimary,
      );

  static TextStyle get bodyLarge => GoogleFonts.plusJakartaSans(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: ExecutiveColors.textPrimary,
        height: 1.4,
      );

  static TextStyle get bodyMedium => GoogleFonts.plusJakartaSans(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: ExecutiveColors.textSecondary,
        height: 1.4,
      );

  static TextStyle get bodySmall => GoogleFonts.plusJakartaSans(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: ExecutiveColors.textMuted,
      );

  static TextStyle get goldHeading => GoogleFonts.outfit(
        fontSize: 24,
        fontWeight: FontWeight.w800,
        color: ExecutiveColors.gold,
        letterSpacing: 1.2,
      );

  static TextStyle get button => GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.5,
      );

  static TextStyle get currencyUsd => GoogleFonts.outfit(
        fontSize: 24,
        fontWeight: FontWeight.w800,
        color: ExecutiveColors.goldLight,
      );

  static TextStyle get currencyBcv => GoogleFonts.plusJakartaSans(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: ExecutiveColors.textSecondary,
      );
}
