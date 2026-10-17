import 'package:flutter/material.dart';

/// Motion tokens specifying duration and easing curves for transitions and micro-interactions.
class AppMotion {
  const AppMotion._();

  // Durations
  static const Duration durationFast = Duration(milliseconds: 150);
  static const Duration durationNormal = Duration(milliseconds: 250);
  static const Duration durationSlow = Duration(milliseconds: 350);
  static const Duration durationExtraSlow = Duration(milliseconds: 500);

  // Easing Curves
  static const Curve curveStandard = Curves.easeInOutCubic;
  static const Curve curveDecelerate = Curves.easeOutCubic;
  static const Curve curveAccelerate = Curves.easeInCubic;
  static const Curve curveEmphasized = Curves.fastOutSlowIn;
  static const Curve curveSpring = Curves.easeOutBack;
}
