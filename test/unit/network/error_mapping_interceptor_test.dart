import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/core/error/failures.dart';
import 'package:inbox_companion/core/network/interceptors/error_mapping_interceptor.dart';

void main() {
  group('ErrorMappingInterceptor & Failure Mapping', () {
    test(
      'maps connection and timeout errors to TimeoutFailure / NetworkFailure',
      () {
        final req = RequestOptions(path: '/threads');

        final timeoutErr = DioException(
          requestOptions: req,
          type: DioExceptionType.connectionTimeout,
        );
        final networkErr = DioException(
          requestOptions: req,
          type: DioExceptionType.connectionError,
        );

        final timeoutFailure = ErrorMappingInterceptor.mapDioExceptionToFailure(
          timeoutErr,
        );
        final networkFailure = ErrorMappingInterceptor.mapDioExceptionToFailure(
          networkErr,
        );

        expect(timeoutFailure, isA<TimeoutFailure>());
        expect(networkFailure, isA<NetworkFailure>());
      },
    );

    test('maps 401 to UnauthorizedFailure', () {
      final failure = ErrorMappingInterceptor.mapStatusCodeToFailure(
        statusCode: 401,
        data: {'message': 'Session expired', 'code': 'TOKEN_EXPIRED'},
      );

      expect(failure, isA<UnauthorizedFailure>());
      expect(failure.message, equals('Session expired'));
      expect(failure.code, equals('TOKEN_EXPIRED'));
    });

    test('maps 403 to ForbiddenFailure', () {
      final failure = ErrorMappingInterceptor.mapStatusCodeToFailure(
        statusCode: 403,
        data: {'message': 'Access denied'},
      );

      expect(failure, isA<ForbiddenFailure>());
      expect(failure.message, equals('Access denied'));
    });

    test('maps 404 to NotFoundFailure', () {
      final failure = ErrorMappingInterceptor.mapStatusCodeToFailure(
        statusCode: 404,
        data: {'message': 'Thread not found'},
      );

      expect(failure, isA<NotFoundFailure>());
      expect(failure.message, equals('Thread not found'));
    });

    test('maps 422 to ValidationFailure and parses field details', () {
      final failure = ErrorMappingInterceptor.mapStatusCodeToFailure(
        statusCode: 422,
        data: {
          'message': 'Invalid message input',
          'code': 'VALIDATION_FAILED',
          'details': {
            'subject': ['Subject cannot be blank'],
            'recipients': ['At least one recipient required'],
          },
        },
      );

      expect(failure, isA<ValidationFailure>());
      final validationFailure = failure as ValidationFailure;
      expect(
        validationFailure.fieldErrors['subject'],
        contains('Subject cannot be blank'),
      );
      expect(
        validationFailure.fieldErrors['recipients'],
        contains('At least one recipient required'),
      );
    });

    test('maps 500 and 503 to ServerFailure with statusCode preserved', () {
      final failure500 = ErrorMappingInterceptor.mapStatusCodeToFailure(
        statusCode: 500,
        data: {'message': 'Database error'},
      );
      final failure503 = ErrorMappingInterceptor.mapStatusCodeToFailure(
        statusCode: 503,
      );

      expect(failure500, isA<ServerFailure>());
      expect((failure500 as ServerFailure).statusCode, equals(500));
      expect(failure503, isA<ServerFailure>());
      expect((failure503 as ServerFailure).statusCode, equals(503));
    });
  });
}
