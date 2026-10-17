import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inbox_companion/app.dart';
import 'package:inbox_companion/core/config/app_config.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final config = AppConfig.staging();

  runApp(
    ProviderScope(
      overrides: [configProvider.overrideWithValue(config)],
      child: const InboxCompanionApp(),
    ),
  );
}
