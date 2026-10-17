import 'package:flutter/material.dart';

/// Systematic spacing tokens adhering to 4-point and 8-point layout grids.
class AppSpacing {
  const AppSpacing._();

  static const double xxs = 2.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double xxxl = 32.0;
  static const double huge = 48.0;

  /// Absolute minimum accessible touch target dimension per Material / WCAG 2.1
  static const double minTouchTarget = 48.0;

  // Insets
  static const EdgeInsets insetAllZero = EdgeInsets.zero;
  static const EdgeInsets insetAllXs = EdgeInsets.all(xs);
  static const EdgeInsets insetAllSm = EdgeInsets.all(sm);
  static const EdgeInsets insetAllMd = EdgeInsets.all(md);
  static const EdgeInsets insetAllLg = EdgeInsets.all(lg);
  static const EdgeInsets insetAllXl = EdgeInsets.all(xl);
  static const EdgeInsets insetAllXxl = EdgeInsets.all(xxl);

  // Horizontal Insets
  static const EdgeInsets insetHorizontalSm = EdgeInsets.symmetric(
    horizontal: sm,
  );
  static const EdgeInsets insetHorizontalMd = EdgeInsets.symmetric(
    horizontal: md,
  );
  static const EdgeInsets insetHorizontalLg = EdgeInsets.symmetric(
    horizontal: lg,
  );
  static const EdgeInsets insetHorizontalXl = EdgeInsets.symmetric(
    horizontal: xl,
  );

  // Vertical Insets
  static const EdgeInsets insetVerticalXs = EdgeInsets.symmetric(vertical: xs);
  static const EdgeInsets insetVerticalSm = EdgeInsets.symmetric(vertical: sm);
  static const EdgeInsets insetVerticalMd = EdgeInsets.symmetric(vertical: md);
  static const EdgeInsets insetVerticalLg = EdgeInsets.symmetric(vertical: lg);

  // Gaps
  static const SizedBox gapHorizontalXs = SizedBox(width: xs);
  static const SizedBox gapHorizontalSm = SizedBox(width: sm);
  static const SizedBox gapHorizontalMd = SizedBox(width: md);
  static const SizedBox gapHorizontalLg = SizedBox(width: lg);
  static const SizedBox gapHorizontalXl = SizedBox(width: xl);

  static const SizedBox gapVerticalXs = SizedBox(height: xs);
  static const SizedBox gapVerticalSm = SizedBox(height: sm);
  static const SizedBox gapVerticalMd = SizedBox(height: md);
  static const SizedBox gapVerticalLg = SizedBox(height: lg);
  static const SizedBox gapVerticalXl = SizedBox(height: xl);
  static const SizedBox gapVerticalXxl = SizedBox(height: xxl);
}

typedef SpacingTokens = AppSpacing;
