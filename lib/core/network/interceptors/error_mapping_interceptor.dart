import 'package:dio/dio.dart';
import 'package:inbox_companion/core/error/failures.dart';

/// Maps DioExceptions into typed, sealed Failure representations.
class ErrorMappingInterceptor extends Interceptor {
  const ErrorMappingInterceptor();

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final failure = mapDioExceptionToFailure(err);
    final enrichedError = DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      error: failure,
      message: failure.message,
      stackTrace: err.stackTrace,
    );
    handler.next(enrichedError);
  }

  static Failure mapDioExceptionToFailure(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const TimeoutFailure();

      case DioExceptionType.connectionError:
        return const NetworkFailure();

      case DioExceptionType.badResponse:
        final response = error.response;
        if (response == null) {
          return const NetworkFailure();
        }
        return mapStatusCodeToFailure(
          statusCode: response.statusCode ?? 500,
          data: response.data,
        );

      case DioExceptionType.cancel:
        return const UnknownFailure(message: 'Request was cancelled.');

      case DioExceptionType.badCertificate:
        return const NetworkFailure(
          message: 'Secure connection failed due to an untrusted certificate.',
        );

      case DioExceptionType.unknown:
      default:
        if (error.error is Failure) {
          return error.error as Failure;
        }
        return UnknownFailure(
          message: error.message ?? 'An unknown network error occurred.',
          underlyingError: error,
        );
    }
  }

  static Failure mapStatusCodeToFailure({
    required int statusCode,
    dynamic data,
  }) {
    String? apiMessage;
    String? apiCode;
    Map<String, List<String>> validationErrors = const {};

    if (data is Map) {
      apiMessage = data['message']?.toString();
      apiCode = data['code']?.toString();

      final details = data['details'];
      if (details is Map) {
        validationErrors = details.map((k, v) {
          if (v is List) {
            return MapEntry(
              k.toString(),
              v.map((item) => item.toString()).toList(),
            );
          }
          return MapEntry(k.toString(), [v.toString()]);
        });
      }
    }

    switch (statusCode) {
      case 400:
      case 422:
        return ValidationFailure(
          message: apiMessage ?? 'Validation failed for the submitted data.',
          code: apiCode ?? 'VALIDATION_ERROR',
          fieldErrors: validationErrors,
        );
      case 401:
        return UnauthorizedFailure(
          message: apiMessage ?? 'Session expired or authentication failed.',
          code: apiCode ?? 'UNAUTHORIZED',
        );
      case 403:
        return ForbiddenFailure(
          message: apiMessage ?? 'You do not have access to this resource.',
          code: apiCode ?? 'FORBIDDEN',
        );
      case 404:
        return NotFoundFailure(
          message: apiMessage ?? 'Requested resource was not found.',
          code: apiCode ?? 'NOT_FOUND',
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return ServerFailure(
          statusCode: statusCode,
          message: apiMessage ?? 'Server error occurred ($statusCode).',
          code: apiCode ?? 'SERVER_ERROR',
        );
      default:
        return ServerFailure(
          statusCode: statusCode,
          message: apiMessage ?? 'Unexpected response code: $statusCode.',
          code: apiCode,
        );
    }
  }
}
