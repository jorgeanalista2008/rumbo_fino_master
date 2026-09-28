library core_ui;

export 'src/theme/executive_colors.dart';
export 'src/theme/executive_typography.dart';
export 'src/widgets/luxury_button.dart';
export 'src/widgets/luxury_card.dart';
export 'src/widgets/luxury_text_field.dart';
export 'src/widgets/dual_currency_display.dart';

import 'package:flutter/material.dart';
import 'src/theme/executive_colors.dart';
import 'src/theme/executive_typography.dart';

class ExecutiveTheme {
  ExecutiveTheme._();

  static ThemeData get themeData {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: ExecutiveColors.background,
      primaryColor: ExecutiveColors.gold,
      cardColor: ExecutiveColors.surface,
      colorScheme: const ColorScheme.dark(
        primary: ExecutiveColors.gold,
        secondary: ExecutiveColors.goldLight,
        surface: ExecutiveColors.surface,
        background: ExecutiveColors.background,
        error: ExecutiveColors.error,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: ExecutiveColors.background,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: ExecutiveTypography.h3.copyWith(
          color: ExecutiveColors.gold,
          letterSpacing: 1.0,
        ),
        iconTheme: const IconThemeData(color: ExecutiveColors.gold),
      ),
    );
  }
}
