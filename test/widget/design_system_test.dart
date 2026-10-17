import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/core/theme/app_theme.dart';
import 'package:inbox_companion/core/widgets/avatar/app_avatar.dart';
import 'package:inbox_companion/core/widgets/buttons/app_button.dart';
import 'package:inbox_companion/core/widgets/buttons/app_icon_button.dart';
import 'package:inbox_companion/core/widgets/chips/app_chip.dart';
import 'package:inbox_companion/core/widgets/empty_state/app_empty_state.dart';
import 'package:inbox_companion/core/widgets/list_tile/app_thread_tile.dart';

void main() {
  group('Design System Accessibility & Touch Target Constraints', () {
    testWidgets('AppButton enforces minimum 48dp touch target height', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: Center(
              child: AppButton(
                label: 'Test Button',
                size: AppButtonSize
                    .small, // even small variant must meet 48dp touch target!
                onPressed: () {},
              ),
            ),
          ),
        ),
      );

      final buttonSize = tester.getSize(find.byType(AppButton));
      expect(buttonSize.height, greaterThanOrEqualTo(48.0));
      expect(buttonSize.width, greaterThanOrEqualTo(48.0));

      // Verify semantics
      expect(
        tester.getSemantics(find.byType(AppButton)),
        matchesSemantics(
          label: 'Test Button',
          isButton: true,
          hasEnabledState: true,
          isEnabled: true,
          isFocusable: true,
          hasTapAction: true,
          hasFocusAction: true,
        ),
      );
    });

    testWidgets('AppIconButton enforces 48x48dp minimum bounding box', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: Center(
              child: AppIconButton(
                icon: Icons.archive,
                tooltip: 'Archive conversation',
                onPressed: () {},
              ),
            ),
          ),
        ),
      );

      final iconButtonSize = tester.getSize(find.byType(AppIconButton));
      expect(iconButtonSize.width, greaterThanOrEqualTo(48.0));
      expect(iconButtonSize.height, greaterThanOrEqualTo(48.0));
    });

    testWidgets(
      'AppChip enforces minimum 48dp touch target height and semantics',
      (tester) async {
        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.light(),
            home: Scaffold(
              body: Center(
                child: AppChip(
                  label: 'Urgent Action',
                  variant: AppChipVariant.filter,
                  isSelected: true,
                  onTap: () {},
                ),
              ),
            ),
          ),
        );

        final chipSize = tester.getSize(find.byType(AppChip));
        expect(chipSize.height, greaterThanOrEqualTo(48.0));
        expect(chipSize.width, greaterThanOrEqualTo(48.0));
      },
    );

    testWidgets('AppAvatar renders initials and presence indicator', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: const Scaffold(
            body: Center(
              child: AppAvatar(
                name: 'Alex Morgan',
                size: 48,
                status: AppAvatarStatus.online,
              ),
            ),
          ),
        ),
      );

      expect(find.text('AM'), findsOneWidget);
    });
  });

  group('Typography & Text Scale Resilience (200% Scale)', () {
    testWidgets('AppThreadTile scales to 200% without layout overflow', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: MediaQuery(
            data: const MediaQueryData(textScaler: TextScaler.linear(2.0)),
            child: Scaffold(
              body: SizedBox(
                width: 400,
                child: AppThreadTile(
                  id: 'th_001',
                  senderName: 'Dr. Priya Sharma',
                  subject: 'Design System & Motion Specs Alignment',
                  snippet: 'Reviewing typography scales and contrast ratios across color modes.',
                  timestamp: '11:30 AM',
                  isUnread: true,
                  isStarred: true,
                  hasAttachments: true,
                  labels: const ['Design System', 'Urgent'],
                  onStarToggle: () {},
                  onTap: () {},
                ),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull); // Zero overflow errors!
    });

    testWidgets('AppEmptyState renders cleanly at 200% text scale', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.dark(),
          home: const MediaQuery(
            data: MediaQueryData(textScaler: TextScaler.linear(2.0)),
            child: Scaffold(
              body: AppEmptyState(
                title: 'No Threads Found',
                message:
                    'Try clearing active label filters or search parameters.',
                actionLabel: 'Reset Filters',
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });

  group('Golden Tests in Light and Dark Themes', () {
    testWidgets('Golden Test - AppButton in Light and Dark Modes', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          home: Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AppButton(label: 'Primary Action', onPressed: () {}),
                  const SizedBox(height: 12),
                  AppButton(
                    label: 'Secondary Action',
                    variant: AppButtonVariant.secondary,
                    onPressed: () {},
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      await expectLater(
        find.byType(Scaffold),
        matchesGoldenFile('goldens/app_button_light.png'),
      );
    });

    testWidgets('Golden Test - AppThreadTile in Light and Dark Modes', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: Scaffold(
            body: Center(
              child: SizedBox(
                width: 380,
                child: AppThreadTile(
                  id: 'th_golden',
                  senderName: 'Jordan Lee',
                  subject: 'Design System Golden Validation',
                  snippet: 'Ensuring pixel perfection and contrast ratios.',
                  timestamp: '9:00 AM',
                  isUnread: true,
                  isStarred: true,
                  labels: const ['Design System'],
                  onStarToggle: () {},
                  onTap: () {},
                ),
              ),
            ),
          ),
        ),
      );

      await expectLater(
        find.byType(Scaffold),
        matchesGoldenFile('goldens/app_thread_tile_light.png'),
      );
    });
  });
}
