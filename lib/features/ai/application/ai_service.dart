import 'dart:async';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';
import 'package:inbox_companion/features/ai/domain/ai_tone.dart';

class AiService {
  AiService({FlutterSecureStorage? secureStorage, IAppLogger? logger})
    : _secureStorage = secureStorage ?? const FlutterSecureStorage(),
      _logger = logger ?? AppLogger();

  final FlutterSecureStorage _secureStorage;
  final IAppLogger _logger;

  static const String _kAiConsentKey = 'ai_features_user_consent';
  static const String _kAiEnabledKey = 'ai_features_enabled';
  static const String _kAiUsageCountKey = 'ai_features_usage_count';

  static const int kDailyQuotaLimit = 50;

  Future<bool> isAiEnabled() async {
    final enabled = await _secureStorage.read(key: _kAiEnabledKey);
    final consented = await _secureStorage.read(key: _kAiConsentKey);
    return enabled == 'true' && consented == 'true';
  }

  Future<bool> hasConsented() async {
    final consented = await _secureStorage.read(key: _kAiConsentKey);
    return consented == 'true';
  }

  Future<void> enableWithConsent() async {
    await _secureStorage.write(key: _kAiConsentKey, value: 'true');
    await _secureStorage.write(key: _kAiEnabledKey, value: 'true');
    _logger.info(
      'AI features enabled following explicit user privacy consent.',
    );
  }

  Future<void> disableAi() async {
    await _secureStorage.write(key: _kAiEnabledKey, value: 'false');
    _logger.info('AI features disabled by user.');
  }

  Future<int> getRemainingQuota() async {
    final countStr = await _secureStorage.read(key: _kAiUsageCountKey);
    final current = int.tryParse(countStr ?? '0') ?? 0;
    return (kDailyQuotaLimit - current).clamp(0, kDailyQuotaLimit);
  }

  Future<void> _incrementUsage() async {
    final countStr = await _secureStorage.read(key: _kAiUsageCountKey);
    final current = int.tryParse(countStr ?? '0') ?? 0;
    await _secureStorage.write(
      key: _kAiUsageCountKey,
      value: (current + 1).toString(),
    );
  }

  /// Streams thread summary in chunks simulating Server-Sent Events (SSE).
  /// Hard boundary: Pure read-only computation. Never modifies DB or enqueues writes.
  Stream<String> streamSummary(String threadText) async* {
    final enabled = await isAiEnabled();
    if (!enabled) {
      throw StateError(
        'AI features are disabled. Explicit user consent is required before accessing AI assistance.',
      );
    }

    final quota = await getRemainingQuota();
    if (quota <= 0) {
      throw StateError(
        'Daily AI usage quota exceeded ($kDailyQuotaLimit requests). Please try again tomorrow.',
      );
    }

    await _incrementUsage();
    _logger.info('Streaming summary for thread (${threadText.length} chars).');

    // Simulated streaming response tokens
    final chunks = [
      '• **Summary**: Key discussion regarding multi-platform design tokens and accessibility standards.\n',
      '• **Action Items**: Finalize touch target constraints (min 48dp) and contrast ratios before Wednesday review.\n',
      '• **Participants**: Jordan Lee requested feedback; Alex Morgan confirmed elevation tokens.\n',
      '• **Status**: Awaiting confirmation on tokens-spec-v1.pdf.',
    ];

    for (final chunk in chunks) {
      await Future<void>.delayed(const Duration(milliseconds: 120));
      yield chunk;
    }
  }

  /// Streams draft reply with chosen tone.
  /// Hard boundary: AI output strictly fills an editable draft labeled "AI-generated".
  Stream<String> streamDraftReply({
    required String threadText,
    required AiTone tone,
    String? customInstructions,
  }) async* {
    final enabled = await isAiEnabled();
    if (!enabled) {
      throw StateError(
        'AI features are disabled. Explicit user consent is required before accessing AI assistance.',
      );
    }

    final quota = await getRemainingQuota();
    if (quota <= 0) {
      throw StateError(
        'Daily AI usage quota exceeded ($kDailyQuotaLimit requests).',
      );
    }

    await _incrementUsage();
    _logger.info('Streaming draft reply with tone: ${tone.name}.');

    List<String> chunks;

    switch (tone) {
      case AiTone.shorter:
        chunks = [
          'Hi Jordan,\n\n',
          'Reviewed the design tokens draft—elevation 2 and 4 look solid. ',
          'I confirmed the 48dp touch targets meet our accessibility criteria. ',
          'Good to proceed for Wednesday.\n\n',
          'Best,\nAlex',
        ];
        break;
      case AiTone.friendlier:
        chunks = [
          'Hi Jordan!\n\n',
          'Thanks for sending this over! The updated design tokens and high-contrast specs look fantastic. ',
          'Really excited about how clean the dark mode elevation levels turned out. ',
          'Let’s catch up briefly before Wednesday to wrap this up!\n\n',
          'Cheers,\nAlex',
        ];
        break;
      case AiTone.moreFormal:
        chunks = [
          'Dear Jordan,\n\n',
          'Thank you for providing the updated architecture review and tokens specification. ',
          'Upon review, the contrast ratios and touch target dimensions comply with all platform accessibility guidelines. ',
          'Please consider this approved for the upcoming milestone.\n\n',
          'Sincerely,\nAlex Morgan',
        ];
        break;
    }

    for (final chunk in chunks) {
      await Future<void>.delayed(const Duration(milliseconds: 100));
      yield chunk;
    }
  }
}
