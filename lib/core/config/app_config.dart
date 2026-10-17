import 'package:flutter/foundation.dart';
import 'package:inbox_companion/core/config/app_flavor.dart';

/// Central application configuration loaded via compile-time environment flags (--dart-define)
class AppConfig {
  const AppConfig({
    required this.flavor,
    required this.appId,
    required this.appName,
    required this.apiBaseUrl,
    required this.useMockServer,
    required this.enableDebugBanner,
  });

  final AppFlavor flavor;
  final String appId;
  final String appName;
  final String apiBaseUrl;
  final bool useMockServer;
  final bool enableDebugBanner;

  /// Factory that inspects compile-time `--dart-define` variables with robust defaults per flavor.
  factory AppConfig.fromEnvironment() {
    const rawFlavor = String.fromEnvironment('FLAVOR', defaultValue: 'dev');
    final flavor = AppFlavor.fromString(rawFlavor);

    final defaultAppId = switch (flavor) {
      AppFlavor.dev => 'com.inboxcompanion.app.dev',
      AppFlavor.staging => 'com.inboxcompanion.app.staging',
      AppFlavor.prod => 'com.inboxcompanion.app',
    };

    final defaultAppName = switch (flavor) {
      AppFlavor.dev => 'Inbox Companion (Dev)',
      AppFlavor.staging => 'Inbox Companion (Staging)',
      AppFlavor.prod => 'Inbox Companion',
    };

    final defaultBaseUrl = switch (flavor) {
      AppFlavor.dev => 'http://127.0.0.1:8080/v1',
      AppFlavor.staging => 'https://staging-api.inboxcompanion.app/v1',
      AppFlavor.prod => 'https://api.inboxcompanion.app/v1',
    };

    const envAppId = String.fromEnvironment('APP_ID');
    const envAppName = String.fromEnvironment('APP_NAME');
    const envApiBaseUrl = String.fromEnvironment('API_BASE_URL');
    const envUseMockServer = bool.fromEnvironment(
      'USE_MOCK_SERVER',
      defaultValue: kDebugMode,
    );

    return AppConfig(
      flavor: flavor,
      appId: envAppId.isNotEmpty ? envAppId : defaultAppId,
      appName: envAppName.isNotEmpty ? envAppName : defaultAppName,
      apiBaseUrl: envApiBaseUrl.isNotEmpty ? envApiBaseUrl : defaultBaseUrl,
      useMockServer: envUseMockServer,
      enableDebugBanner: flavor.isDev,
    );
  }

  /// Specialized dev configuration
  factory AppConfig.dev({String? apiBaseUrl, bool useMockServer = true}) {
    return AppConfig(
      flavor: AppFlavor.dev,
      appId: 'com.inboxcompanion.app.dev',
      appName: 'Inbox Companion (Dev)',
      apiBaseUrl: apiBaseUrl ?? 'http://127.0.0.1:8080/v1',
      useMockServer: useMockServer,
      enableDebugBanner: true,
    );
  }

  /// Specialized staging configuration
  factory AppConfig.staging({String? apiBaseUrl}) {
    return AppConfig(
      flavor: AppFlavor.staging,
      appId: 'com.inboxcompanion.app.staging',
      appName: 'Inbox Companion (Staging)',
      apiBaseUrl: apiBaseUrl ?? 'https://staging-api.inboxcompanion.app/v1',
      useMockServer: false,
      enableDebugBanner: false,
    );
  }

  /// Specialized production configuration
  factory AppConfig.prod({String? apiBaseUrl}) {
    return AppConfig(
      flavor: AppFlavor.prod,
      appId: 'com.inboxcompanion.app',
      appName: 'Inbox Companion',
      apiBaseUrl: apiBaseUrl ?? 'https://api.inboxcompanion.app/v1',
      useMockServer: false,
      enableDebugBanner: false,
    );
  }
}
