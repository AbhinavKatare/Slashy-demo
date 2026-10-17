import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/core/network/interceptors/auth_interceptor.dart';
import 'package:inbox_companion/core/network/token_storage.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

class MockErrorInterceptorHandler extends Mock
    implements ErrorInterceptorHandler {}

class MockRequestInterceptorHandler extends Mock
    implements RequestInterceptorHandler {}

void main() {
  group('AuthInterceptor', () {
    late InMemoryTokenStorage tokenStorage;
    late MockDio mockDio;

    setUp(() {
      tokenStorage = InMemoryTokenStorage(
        initialAccessToken: 'initial_access_token',
        initialRefreshToken: 'initial_refresh_token',
      );
      mockDio = MockDio();
    });

    test('injects Bearer token into outgoing non-auth requests', () async {
      final interceptor = AuthInterceptor(
        tokenStorage: tokenStorage,
        dio: mockDio,
      );

      final options = RequestOptions(path: '/threads', method: 'GET');
      final handler = MockRequestInterceptorHandler();

      await interceptor.onRequest(options, handler);

      expect(
        options.headers['Authorization'],
        equals('Bearer initial_access_token'),
      );
      verify(() => handler.next(options)).called(1);
    });

    test(
      'skips Bearer token for /auth/login and /auth/refresh paths',
      () async {
        final interceptor = AuthInterceptor(
          tokenStorage: tokenStorage,
          dio: mockDio,
        );

        final loginOptions = RequestOptions(
          path: '/auth/login',
          method: 'POST',
        );
        final refreshOptions = RequestOptions(
          path: '/auth/refresh',
          method: 'POST',
        );

        await interceptor.onRequest(
          loginOptions,
          MockRequestInterceptorHandler(),
        );
        await interceptor.onRequest(
          refreshOptions,
          MockRequestInterceptorHandler(),
        );

        expect(loginOptions.headers.containsKey('Authorization'), isFalse);
        expect(refreshOptions.headers.containsKey('Authorization'), isFalse);
      },
    );

    test('single-flight token refresh executes refresh exactly once for concurrent 401s', () async {
      int refreshCallCount = 0;

      final interceptor = AuthInterceptor(
        tokenStorage: tokenStorage,
        dio: mockDio,
        refreshDelegate: (refreshToken) async {
          refreshCallCount++;
          await Future<void>.delayed(const Duration(milliseconds: 30));
          return {
            'accessToken': 'new_access_token_v2',
            'refreshToken': 'new_refresh_token_v2',
          };
        },
      );

      final req1 = RequestOptions(path: '/threads', method: 'GET');
      final err1 = DioException(
        requestOptions: req1,
        response: Response(requestOptions: req1, statusCode: 401),
      );

      final req2 = RequestOptions(path: '/accounts', method: 'GET');
      final err2 = DioException(
        requestOptions: req2,
        response: Response(requestOptions: req2, statusCode: 401),
      );

      final handler1 = MockErrorInterceptorHandler();
      final handler2 = MockErrorInterceptorHandler();

      final res1 = Response(
        requestOptions: req1,
        statusCode: 200,
        data: {'data': 'threads'},
      );
      final res2 = Response(
        requestOptions: req2,
        statusCode: 200,
        data: {'data': 'accounts'},
      );

      when(() => mockDio.fetch<dynamic>(req1)).thenAnswer((_) async => res1);
      when(() => mockDio.fetch<dynamic>(req2)).thenAnswer((_) async => res2);

      // Trigger both concurrent 401 failures simultaneously
      await Future.wait([
        interceptor.onError(err1, handler1),
        interceptor.onError(err2, handler2),
      ]);

      // Exactly ONE refresh call should have occurred!
      expect(refreshCallCount, equals(1));

      // Storage updated
      expect(
        await tokenStorage.getAccessToken(),
        equals('new_access_token_v2'),
      );
      expect(
        await tokenStorage.getRefreshToken(),
        equals('new_refresh_token_v2'),
      );

      // Both requests retried with the new token
      expect(
        req1.headers['Authorization'],
        equals('Bearer new_access_token_v2'),
      );
      expect(
        req2.headers['Authorization'],
        equals('Bearer new_access_token_v2'),
      );

      verify(() => handler1.resolve(res1)).called(1);
      verify(() => handler2.resolve(res2)).called(1);
    });

    test(
      'failed token refresh clears storage and notifies onAuthFailed callback',
      () async {
        bool authFailedNotified = false;

        final interceptor = AuthInterceptor(
          tokenStorage: tokenStorage,
          dio: mockDio,
          refreshDelegate: (refreshToken) async => null, // refresh failed
          onAuthFailed: () => authFailedNotified = true,
        );

        final req = RequestOptions(path: '/threads', method: 'GET');
        final err = DioException(
          requestOptions: req,
          response: Response(requestOptions: req, statusCode: 401),
        );
        final handler = MockErrorInterceptorHandler();

        await interceptor.onError(err, handler);

        expect(authFailedNotified, isTrue);
        expect(await tokenStorage.getAccessToken(), isNull);
        verify(() => handler.next(err)).called(1);
      },
    );
  });
}
