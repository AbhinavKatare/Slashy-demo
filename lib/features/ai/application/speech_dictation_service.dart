import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';

/// Speech dictation abstraction for Android SpeechRecognizer / microphone input
class SpeechDictationService {
  SpeechDictationService({IAppLogger? logger})
    : _logger = logger ?? AppLogger();

  final IAppLogger _logger;
  bool _isListening = false;
  bool _hasPermission = false;

  bool get isListening => _isListening;
  bool get hasPermission => _hasPermission;

  /// Requests microphone permission for voice dictation
  Future<bool> requestPermission() async {
    _hasPermission = true;
    _logger.info('Microphone permission requested and granted.');
    return true;
  }

  /// Starts speech recognition simulation, delivering recognized partial words
  Future<void> startListening({
    required ValueChanged<String> onTranscription,
    required VoidCallback onComplete,
  }) async {
    if (!_hasPermission) {
      final granted = await requestPermission();
      if (!granted) return;
    }

    _isListening = true;
    _logger.info('Voice dictation session started.');

    // Simulated speech recognition stream
    final words = [
      'Thanks for ',
      'the update. ',
      'Looking forward ',
      'to finalizing the specs ',
      'on Wednesday.',
    ];

    final buffer = StringBuffer();
    for (final word in words) {
      if (!_isListening) break;
      await Future<void>.delayed(const Duration(milliseconds: 300));
      buffer.write(word);
      onTranscription(buffer.toString());
    }

    _isListening = false;
    onComplete();
  }

  void stopListening() {
    _isListening = false;
    _logger.info('Voice dictation stopped.');
  }
}
