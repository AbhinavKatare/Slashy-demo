import 'dart:math';

import 'package:dio/dio.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';

/// Interceptor that applies exponential backoff retry exclusively to idempotent HTTP operations.
class RetryInterceptor extends Interceptor {
  RetryInterceptor({
    required this.dio,
    this.maxRetries = 3,
    this.initialDelay = const Duration(milliseconds: 200),
    this.maxDelay = const Duration(seconds: 3),
    this.logger,
  });

  final Dio dio;
  final int maxRetries;
  final Duration initialDelay;
  final Duration maxDelay;
  final IAppLogger? logger;

  static const String retryCountKey = 'x-retry-attempt-count';
  static const Set<String> idempotentMethods = {
    'GET',
    'HEAD',
    'PUT',
    'DELETE',
    'OPTIONS',
  };

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final options = err.requestOptions;
    final method = options.method.toUpperCase();

    // Check if the request is idempotent
    if (!idempotentMethods.contains(method)) {
      return handler.next(err);
    }

    // Check if error is retryable (transient network failure or 502/503/504)
    if (!_isRetryable(err)) {
      return handler.next(err);
    }

    final currentAttempt = (options.extra[retryCountKey] as int? ?? 0) + 1;

    if (currentAttempt > maxRetries) {
      logger?.warning(
        'Max retry attempts ($maxRetries) reached for ${options.method} ${options.path}',
      );
      return handler.next(err);
    }

    options.extra[retryCountKey] = currentAttempt;

    final delay = _calculateDelay(currentAttempt);
    logger?.info(
      'Retrying request ($currentAttempt/$maxRetries) in ${delay.inMilliseconds}ms: ${options.method} ${options.path}',
    );

    await Future<void>.delayed(delay);

    try {
      final response = await dio.fetch<dynamic>(options);
      return handler.resolve(response);
    } on DioException catch (retryErr) {
      return handler.next(retryErr);
    } catch (e) {
      return handler.next(err);
    }
  }

  bool _isRetryable(DioException err) {
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.connectionError) {
      return true;
    }

    final statusCode = err.response?.statusCode;
    if (statusCode != null &&
        (statusCode == 502 ||
            statusCode == 503 ||
            statusCode == 504 ||
            statusCode == 429)) {
      return true;
    }

    return false;
  }

  Duration _calculateDelay(int attempt) {
    final random = Random();
    final jitterMultiplier = 0.8 + (random.nextDouble() * 0.4); // 0.8x to 1.2x
    final exponentialMs =
        initialDelay.inMilliseconds * pow(2, attempt - 1) * jitterMultiplier;
    final cappedMs = min(exponentialMs.toInt(), maxDelay.inMilliseconds);
    return Duration(milliseconds: cappedMs);
  }
}
