import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/app_colors.dart';

/// Semantic Material 3 ColorScheme definitions for Light, Dark, and High-Contrast modes.
class AppColorSchemes {
  const AppColorSchemes._();

  /// Curated Light ColorScheme
  static const ColorScheme light = ColorScheme(
    brightness: Brightness.light,
    primary: AppColors.primary600,
    onPrimary: Colors.white,
    primaryContainer: AppColors.primary50,
    onPrimaryContainer: AppColors.primary900,
    secondary: AppColors.teal600,
    onSecondary: Colors.white,
    secondaryContainer: AppColors.teal50,
    onSecondaryContainer: AppColors.teal800,
    tertiary: AppColors.amber600,
    onTertiary: Colors.white,
    tertiaryContainer: Color(0xFFFEF3C7),
    onTertiaryContainer: Color(0xFF78350F),
    error: AppColors.error600,
    onError: Colors.white,
    errorContainer: Color(0xFFFEE2E2),
    onErrorContainer: Color(0xFF991B1B),
    surface: Colors.white,
    onSurface: AppColors.slate900,
    surfaceContainerHighest: AppColors.slate100,
    onSurfaceVariant: AppColors.slate600,
    outline: AppColors.slate300,
    outlineVariant: AppColors.slate200,
    shadow: Colors.black,
    scrim: Colors.black54,
    inverseSurface: AppColors.slate900,
    onInverseSurface: AppColors.slate50,
    inversePrimary: AppColors.primary300,
  );

  /// Sleek Obsidian & Iris Dark ColorScheme
  static const ColorScheme dark = ColorScheme(
    brightness: Brightness.dark,
    primary: AppColors.primary400,
    onPrimary: AppColors.slate950,
    primaryContainer: AppColors.primary900,
    onPrimaryContainer: AppColors.primary100,
    secondary: AppColors.teal400,
    onSecondary: AppColors.slate950,
    secondaryContainer: AppColors.teal800,
    onSecondaryContainer: AppColors.teal100,
    tertiary: AppColors.amber400,
    onTertiary: AppColors.slate950,
    tertiaryContainer: Color(0xFF78350F),
    onTertiaryContainer: Color(0xFFFEF3C7),
    error: AppColors.error400,
    onError: AppColors.slate950,
    errorContainer: Color(0xFF7F1D1D),
    onErrorContainer: Color(0xFFFEE2E2),
    surface: AppColors.slate950,
    onSurface: AppColors.slate50,
    surfaceContainerHighest: AppColors.slate800,
    onSurfaceVariant: AppColors.slate400,
    outline: AppColors.slate700,
    outlineVariant: AppColors.slate800,
    shadow: Colors.black,
    scrim: Colors.black87,
    inverseSurface: AppColors.slate100,
    onInverseSurface: AppColors.slate900,
    inversePrimary: AppColors.primary600,
  );

  /// WCAG AAA High-Contrast Light ColorScheme
  static const ColorScheme highContrastLight = ColorScheme(
    brightness: Brightness.light,
    primary: Color(0xFF1E1B4B), // Very dark indigo
    onPrimary: Colors.white,
    primaryContainer: Color(0xFFE0E7FF),
    onPrimaryContainer: Color(0xFF000000),
    secondary: Color(0xFF042F2E), // Very dark teal
    onSecondary: Colors.white,
    secondaryContainer: Color(0xFFCCFBF1),
    onSecondaryContainer: Color(0xFF000000),
    tertiary: Color(0xFF451A03),
    onTertiary: Colors.white,
    tertiaryContainer: Color(0xFFFEF3C7),
    onTertiaryContainer: Color(0xFF000000),
    error: Color(0xFF7F1D1D),
    onError: Colors.white,
    errorContainer: Color(0xFFFEE2E2),
    onErrorContainer: Color(0xFF000000),
    surface: Colors.white,
    onSurface: Colors.black,
    surfaceContainerHighest: Color(0xFFE2E8F0),
    onSurfaceVariant: Colors.black,
    outline: Colors.black,
    outlineVariant: Color(0xFF475569),
    shadow: Colors.black,
    scrim: Colors.black,
    inverseSurface: Colors.black,
    onInverseSurface: Colors.white,
    inversePrimary: Color(0xFFC7D2FE),
  );

  /// WCAG AAA High-Contrast Dark ColorScheme
  static const ColorScheme highContrastDark = ColorScheme(
    brightness: Brightness.dark,
    primary: Color(0xFFA5B4FC), // Bright luminous iris
    onPrimary: Colors.black,
    primaryContainer: Color(0xFF312E81),
    onPrimaryContainer: Colors.white,
    secondary: Color(0xFF5EEAD4), // Bright teal
    onSecondary: Colors.black,
    secondaryContainer: Color(0xFF115E59),
    onSecondaryContainer: Colors.white,
    tertiary: Color(0xFFFDE047),
    onTertiary: Colors.black,
    tertiaryContainer: Color(0xFF78350F),
    onTertiaryContainer: Colors.white,
    error: Color(0xFFFCA5A5),
    onError: Colors.black,
    errorContainer: Color(0xFF7F1D1D),
    onErrorContainer: Colors.white,
    surface: Colors.black,
    onSurface: Colors.white,
    surfaceContainerHighest: Color(0xFF1E293B),
    onSurfaceVariant: Colors.white,
    outline: Colors.white,
    outlineVariant: Color(0xFF94A3B8),
    shadow: Colors.black,
    scrim: Colors.black,
    inverseSurface: Colors.white,
    onInverseSurface: Colors.black,
    inversePrimary: Color(0xFF4338CA),
  );
}
