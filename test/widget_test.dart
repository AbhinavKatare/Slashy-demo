import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/app.dart';
import 'package:inbox_companion/core/config/app_config.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';

void main() {
  testWidgets('Inbox Companion app boots to Inbox Screen in Dev mode', (
    tester,
  ) async {
    final config = AppConfig.dev(useMockServer: false);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [configProvider.overrideWithValue(config)],
        child: const InboxCompanionApp(),
      ),
    );

    await tester.pump();
    expect(find.text('Inbox'), findsWidgets);
    await tester.pump(const Duration(seconds: 1));
  });
}
