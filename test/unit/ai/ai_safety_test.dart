import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:inbox_companion/features/ai/application/ai_service.dart';
import 'package:inbox_companion/features/ai/domain/ai_tone.dart';

class InMemorySecureStorage extends Fake implements FlutterSecureStorage {
  final Map<String, String> _data = {};

  @override
  Future<String?> read({
    required String key,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async => _data[key];

  @override
  Future<void> write({
    required String key,
    required String? value,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    if (value != null) {
      _data[key] = value;
    } else {
      _data.remove(key);
    }
  }

  @override
  Future<void> delete({
    required String key,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async => _data.remove(key);
}

void main() {
  late InMemorySecureStorage storage;
  late AiService aiService;
  late AppDatabase db;

  setUp(() {
    storage = InMemorySecureStorage();
    aiService = AiService(secureStorage: storage);
    db = AppDatabase.inMemory();
  });

  tearDown(() async {
    await db.close();
  });

  group('AI Privacy Consent Gate Tests', () {
    test(
      'AI features are disabled by default until explicit consent is given',
      () async {
        expect(await aiService.isAiEnabled(), isFalse);
        expect(await aiService.hasConsented(), isFalse);

        // Attempting to stream summary without consent throws StateError
        expect(
          () => aiService.streamSummary('Sample thread content').toList(),
          throwsA(isA<StateError>()),
        );
      },
    );

    test(
      'enableWithConsent enables AI features and unblocks streaming',
      () async {
        await aiService.enableWithConsent();

        expect(await aiService.isAiEnabled(), isTrue);
        expect(await aiService.hasConsented(), isTrue);

        final chunks = await aiService.streamSummary('Sample thread').toList();
        expect(chunks.isNotEmpty, isTrue);
        expect(chunks.join(), contains('Summary'));
      },
    );

    test('disableAi revokes access to AI services immediately', () async {
      await aiService.enableWithConsent();
      expect(await aiService.isAiEnabled(), isTrue);

      await aiService.disableAi();
      expect(await aiService.isAiEnabled(), isFalse);

      expect(
        () => aiService
            .streamDraftReply(threadText: 'Sample', tone: AiTone.shorter)
            .toList(),
        throwsA(isA<StateError>()),
      );
    });
  });

  group('AI Zero-Autonomous-Write Boundary Tests', () {
    test(
      'AI generation never modifies database tables or outbox queue',
      () async {
        await aiService.enableWithConsent();

        // Verify DB is clean initially
        final initialThreads = await db.watchThreads().first;
        final initialOutbox = await db.watchPendingOutbox().first;
        final initialEvents = await db.watchEvents().first;

        // Stream multiple AI draft replies
        final chunks = await aiService
            .streamDraftReply(
              threadText: 'Discussion about milestones',
              tone: AiTone.friendlier,
            )
            .toList();

        expect(chunks.isNotEmpty, isTrue);
        expect(chunks.join(), contains('Hi Jordan!'));

        // Invariant: local database tables remain strictly unmodified
        final afterThreads = await db.watchThreads().first;
        final afterOutbox = await db.watchPendingOutbox().first;
        final afterEvents = await db.watchEvents().first;

        expect(afterThreads.length, equals(initialThreads.length));
        expect(afterOutbox.length, equals(initialOutbox.length));
        expect(afterEvents.length, equals(initialEvents.length));
      },
    );
  });

  group('AI Tone Variations Tests', () {
    test(
      'Different tone options generate appropriately formatted responses',
      () async {
        await aiService.enableWithConsent();

        final shortReply =
            (await aiService
                    .streamDraftReply(
                      threadText: 'Update',
                      tone: AiTone.shorter,
                    )
                    .toList())
                .join();

        final formalReply =
            (await aiService
                    .streamDraftReply(
                      threadText: 'Update',
                      tone: AiTone.moreFormal,
                    )
                    .toList())
                .join();

        expect(shortReply, contains('Best,'));
        expect(formalReply, contains('Sincerely,'));
        expect(shortReply, isNot(equals(formalReply)));
      },
    );
  });

  group('AI Quota Tracking Tests', () {
    test(
      'Remaining quota decrements on usage and rejects when exhausted',
      () async {
        await aiService.enableWithConsent();

        final initialQuota = await aiService.getRemainingQuota();
        expect(initialQuota, equals(AiService.kDailyQuotaLimit));

        // Exhaust remaining quota in storage
        await storage.write(
          key: 'ai_features_usage_count',
          value: AiService.kDailyQuotaLimit.toString(),
        );

        final zeroQuota = await aiService.getRemainingQuota();
        expect(zeroQuota, equals(0));

        expect(
          () => aiService.streamSummary('Sample').toList(),
          throwsA(isA<StateError>()),
        );
      },
    );
  });
}
