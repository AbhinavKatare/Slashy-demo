import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inbox_companion/app.dart';
import 'package:inbox_companion/core/config/app_config.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/data/mock/mock_server.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final config = AppConfig.dev();

  if (config.useMockServer) {
    final mockServer = MockServer(port: 8080);
    await mockServer.start();
  }

  runApp(
    ProviderScope(
      overrides: [configProvider.overrideWithValue(config)],
      child: const InboxCompanionApp(),
    ),
  );
}
