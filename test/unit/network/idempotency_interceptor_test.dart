import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/core/network/interceptors/idempotency_interceptor.dart';

void main() {
  group('IdempotencyInterceptor', () {
    late IdempotencyInterceptor interceptor;

    setUp(() {
      interceptor = IdempotencyInterceptor();
    });

    test('adds Idempotency-Key header for POST write operations', () {
      final options = RequestOptions(path: '/messages/send', method: 'POST');

      final handler = RequestInterceptorHandler();
      interceptor.onRequest(options, handler);

      expect(options.headers.containsKey('Idempotency-Key'), isTrue);
      final key = options.headers['Idempotency-Key'] as String;
      expect(key, isNotEmpty);
      expect(RegExp(r'^[0-9a-fA-F-]{36}$').hasMatch(key), isTrue);
    });

    test('adds Idempotency-Key header for PUT and PATCH write operations', () {
      final putOptions = RequestOptions(path: '/drafts/1', method: 'PUT');
      final patchOptions = RequestOptions(path: '/threads/1', method: 'PATCH');

      interceptor.onRequest(putOptions, RequestInterceptorHandler());
      interceptor.onRequest(patchOptions, RequestInterceptorHandler());

      expect(putOptions.headers.containsKey('Idempotency-Key'), isTrue);
      expect(patchOptions.headers.containsKey('Idempotency-Key'), isTrue);
    });

    test(
      'does NOT add Idempotency-Key header for GET or DELETE operations',
      () {
        final getOptions = RequestOptions(path: '/threads', method: 'GET');
        final headOptions = RequestOptions(path: '/threads', method: 'HEAD');

        interceptor.onRequest(getOptions, RequestInterceptorHandler());
        interceptor.onRequest(headOptions, RequestInterceptorHandler());

        expect(getOptions.headers.containsKey('Idempotency-Key'), isFalse);
        expect(headOptions.headers.containsKey('Idempotency-Key'), isFalse);
      },
    );

    test(
      'preserves existing custom Idempotency-Key header if already supplied',
      () {
        const customKey = 'custom-user-supplied-key-12345';
        final options = RequestOptions(
          path: '/messages/send',
          method: 'POST',
          headers: {'Idempotency-Key': customKey},
        );

        interceptor.onRequest(options, RequestInterceptorHandler());

        expect(options.headers['Idempotency-Key'], equals(customKey));
      },
    );
  });
}
