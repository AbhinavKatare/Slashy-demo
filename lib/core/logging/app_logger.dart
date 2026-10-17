import 'package:flutter/foundation.dart';
import 'package:inbox_companion/core/logging/sensitive_data_redactor.dart';

enum LogLevel {
  debug(1, 'DEBUG'),
  info(2, 'INFO'),
  warning(3, 'WARN'),
  error(4, 'ERROR');

  const LogLevel(this.value, this.label);
  final int value;
  final String label;
}

/// Abstract contract for logging across the application
abstract class IAppLogger {
  void debug(String message, {String? tag, dynamic data});
  void info(String message, {String? tag, dynamic data});
  void warning(
    String message, {
    String? tag,
    dynamic data,
    Object? error,
    StackTrace? stackTrace,
  });
  void error(
    String message, {
    String? tag,
    dynamic data,
    Object? error,
    StackTrace? stackTrace,
  });
}

/// Production-ready logger that enforces sensitive data redaction on all payloads.
class AppLogger implements IAppLogger {
  AppLogger({
    this.minLevel = kDebugMode ? LogLevel.debug : LogLevel.info,
    SensitiveDataRedactor? redactor,
    void Function(String formattedMessage)? outputHandler,
  }) : redactor = redactor ?? const SensitiveDataRedactor(),
       _outputHandler = outputHandler ?? _defaultOutput;

  final LogLevel minLevel;
  final SensitiveDataRedactor redactor;
  final void Function(String formattedMessage) _outputHandler;

  static void _defaultOutput(String formattedMessage) {
    debugPrint(formattedMessage);
  }

  @override
  void debug(String message, {String? tag, dynamic data}) {
    _log(LogLevel.debug, message, tag: tag, data: data);
  }

  @override
  void info(String message, {String? tag, dynamic data}) {
    _log(LogLevel.info, message, tag: tag, data: data);
  }

  @override
  void warning(
    String message, {
    String? tag,
    dynamic data,
    Object? error,
    StackTrace? stackTrace,
  }) {
    _log(
      LogLevel.warning,
      message,
      tag: tag,
      data: data,
      error: error,
      stackTrace: stackTrace,
    );
  }

  @override
  void error(
    String message, {
    String? tag,
    dynamic data,
    Object? error,
    StackTrace? stackTrace,
  }) {
    _log(
      LogLevel.error,
      message,
      tag: tag,
      data: data,
      error: error,
      stackTrace: stackTrace,
    );
  }

  void _log(
    LogLevel level,
    String message, {
    String? tag,
    dynamic data,
    Object? error,
    StackTrace? stackTrace,
  }) {
    if (level.value < minLevel.value) {
      return;
    }

    final timestamp = DateTime.now().toIso8601String();
    final tagPrefix = tag != null ? '[$tag] ' : '';
    final sanitizedMessage = redactor.redact(message) as String;

    final buffer = StringBuffer(
      '[$timestamp] [${level.label}] $tagPrefix$sanitizedMessage',
    );

    if (data != null) {
      final sanitizedData = redactor.redact(data);
      buffer.write(' | data: $sanitizedData');
    }

    if (error != null) {
      final sanitizedError = redactor.redact(error.toString());
      buffer.write(' | error: $sanitizedError');
    }

    if (stackTrace != null) {
      buffer.write('\n$stackTrace');
    }

    _outputHandler(buffer.toString());
  }
}
