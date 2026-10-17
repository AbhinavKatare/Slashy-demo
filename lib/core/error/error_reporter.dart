import 'package:flutter/foundation.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';
import 'package:inbox_companion/core/logging/sensitive_data_redactor.dart';

/// Contract for telemetry and crash reporting without leaking PII.
abstract class IErrorReporter {
  void reportError(
    Object error,
    StackTrace? stackTrace, {
    Map<String, dynamic>? extraContext,
    bool fatal = false,
  });

  void addBreadcrumb(
    String message, {
    String? category,
    Map<String, dynamic>? data,
  });

  void setUserId(String pseudonymizedId);
}

/// An error reporter that enforces strict PII-stripping on all crash payloads and breadcrumbs.
class NoPiiErrorReporter implements IErrorReporter {
  NoPiiErrorReporter({required this.logger, SensitiveDataRedactor? redactor})
    : redactor = redactor ?? const SensitiveDataRedactor();

  final IAppLogger logger;
  final SensitiveDataRedactor redactor;
  String? _pseudonymizedUserId;

  @override
  void setUserId(String pseudonymizedId) {
    // Only accept non-PII, hashed or opaque IDs (e.g. usr_101 or SHA256 hashes)
    if (pseudonymizedId.contains('@')) {
      logger.warning(
        'Attempted to set raw email as user identifier. Stripped.',
      );
      _pseudonymizedUserId = 'usr_anonymous_masked';
      return;
    }
    _pseudonymizedUserId = pseudonymizedId;
  }

  @override
  void addBreadcrumb(
    String message, {
    String? category,
    Map<String, dynamic>? data,
  }) {
    final scrubbedMessage =
        redactor.redact(message, redactEmailPii: true) as String;
    final scrubbedData = data != null
        ? (redactor.redact(data, redactEmailPii: true) as Map<String, dynamic>)
        : null;

    logger.debug(
      '[BREADCRUMB] [$category] $scrubbedMessage',
      tag: 'Breadcrumb',
      data: scrubbedData,
    );
  }

  @override
  void reportError(
    Object error,
    StackTrace? stackTrace, {
    Map<String, dynamic>? extraContext,
    bool fatal = false,
  }) {
    final scrubbedError = redactor.redact(
      error.toString(),
      redactEmailPii: true,
    );
    final scrubbedContext = extraContext != null
        ? (redactor.redact(extraContext, redactEmailPii: true)
              as Map<String, dynamic>)
        : <String, dynamic>{};

    scrubbedContext['user_id'] = _pseudonymizedUserId ?? 'anonymous';
    scrubbedContext['is_fatal'] = fatal;

    logger.error(
      '[CRASH_REPORT] $scrubbedError',
      tag: 'ErrorReporter',
      data: scrubbedContext,
      error: error,
      stackTrace: stackTrace,
    );

    // In production, forward to Sentry/Firebase Crashlytics using scrubbedContext
    if (kReleaseMode && fatal) {
      // Release mode forward hook
    }
  }
}
