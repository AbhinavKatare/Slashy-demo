import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/core/network/interceptors/retry_interceptor.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

class MockErrorInterceptorHandler extends Mock
    implements ErrorInterceptorHandler {}

class FakeRequestOptions extends Fake implements RequestOptions {}

void main() {
  setUpAll(() {
    registerFallbackValue(FakeRequestOptions());
    registerFallbackValue(RequestOptions(path: ''));
  });

  group('RetryInterceptor', () {
    late MockDio mockDio;
    late RetryInterceptor interceptor;

    setUp(() {
      mockDio = MockDio();
      interceptor = RetryInterceptor(
        dio: mockDio,
        maxRetries: 2,
        initialDelay: const Duration(milliseconds: 10),
        maxDelay: const Duration(milliseconds: 50),
      );
    });

    test(
      'ignores non-idempotent POST methods even on connection timeout',
      () async {
        final requestOptions = RequestOptions(
          path: '/messages/send',
          method: 'POST',
        );
        final error = DioException(
          requestOptions: requestOptions,
          type: DioExceptionType.connectionTimeout,
        );
        final handler = MockErrorInterceptorHandler();

        await interceptor.onError(error, handler);

        verify(() => handler.next(error)).called(1);
      },
    );

    test('retries idempotent GET request on connection error and resolves on success', () async {
      final requestOptions = RequestOptions(path: '/threads', method: 'GET');
      final error = DioException(
        requestOptions: requestOptions,
        type: DioExceptionType.connectionError,
      );
      final handler = MockErrorInterceptorHandler();

      final expectedResponse = Response<dynamic>(
        requestOptions: requestOptions,
        statusCode: 200,
        data: {'threads': <dynamic>[]},
      );

      when(() => mockDio.fetch<dynamic>(any()))
          .thenAnswer((_) async => expectedResponse);

      await interceptor.onError(error, handler);

      verify(() => mockDio.fetch<dynamic>(any())).called(1);
      verify(() => handler.resolve(expectedResponse)).called(1);
    });

    test('exceeding maxRetries forwards error to handler.next without infinite loop', () async {
      final requestOptions = RequestOptions(
        path: '/threads',
        method: 'GET',
        extra: {RetryInterceptor.retryCountKey: 2}, // already at max 2
      );
      final error = DioException(
        requestOptions: requestOptions,
        type: DioExceptionType.connectionTimeout,
      );
      final handler = MockErrorInterceptorHandler();

      await interceptor.onError(error, handler);

      verify(() => handler.next(error)).called(1);
    });
  });
}
