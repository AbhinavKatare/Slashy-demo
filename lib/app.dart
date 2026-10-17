import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/core/router/app_router.dart';
import 'package:inbox_companion/core/theme/app_theme.dart';

/// The root application widget for Inbox Companion.
class InboxCompanionApp extends ConsumerWidget {
  const InboxCompanionApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(configProvider);
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final isHighContrast = ref.watch(highContrastProvider);

    final lightTheme = isHighContrast
        ? AppTheme.highContrastLight()
        : AppTheme.light();
    final darkTheme = isHighContrast
        ? AppTheme.highContrastDark()
        : AppTheme.dark();

    return MaterialApp.router(
      title: config.appName,
      debugShowCheckedModeBanner: config.enableDebugBanner,
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
