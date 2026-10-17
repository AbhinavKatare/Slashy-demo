import 'package:flutter/material.dart';

/// Elevation tokens defining soft shadows and tonal surface elevations.
class AppElevation {
  const AppElevation._();

  static const double level0 = 0.0;
  static const double level1 = 1.0;
  static const double level2 = 3.0;
  static const double level3 = 6.0;
  static const double level4 = 8.0;
  static const double level5 = 12.0;

  static List<BoxShadow> shadowLevel1(Color shadowColor) => [
    BoxShadow(
      color: shadowColor.withValues(alpha: 0.06),
      blurRadius: 3,
      offset: const Offset(0, 1),
    ),
  ];

  static List<BoxShadow> shadowLevel2(Color shadowColor) => [
    BoxShadow(
      color: shadowColor.withValues(alpha: 0.08),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> shadowLevel3(Color shadowColor) => [
    BoxShadow(
      color: shadowColor.withValues(alpha: 0.10),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> shadowLevel4(Color shadowColor) => [
    BoxShadow(
      color: shadowColor.withValues(alpha: 0.12),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];

  static List<BoxShadow> get elevation1 =>
      shadowLevel1(const Color(0x33000000));
  static List<BoxShadow> get elevation2 =>
      shadowLevel2(const Color(0x33000000));
  static List<BoxShadow> get elevation3 =>
      shadowLevel3(const Color(0x33000000));
  static List<BoxShadow> get elevation4 =>
      shadowLevel4(const Color(0x33000000));
}

typedef ElevationTokens = AppElevation;
