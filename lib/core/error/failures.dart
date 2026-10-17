import 'package:equatable/equatable.dart';

/// Sealed hierarchy of domain and network failures.
sealed class Failure extends Equatable {
  const Failure({required this.message, this.code});

  final String message;
  final String? code;

  @override
  List<Object?> get props => [message, code];
}

/// No internet connection, DNS failure, or socket exceptions
class NetworkFailure extends Failure {
  const NetworkFailure({
    super.message =
        'Network connection unavailable. Please check your internet settings.',
    super.code = 'NETWORK_UNAVAILABLE',
  });
}

/// HTTP 401 Unauthorized / Token expired
class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure({
    super.message = 'Session expired. Please sign in again.',
    super.code = 'UNAUTHORIZED',
  });
}

/// HTTP 403 Forbidden
class ForbiddenFailure extends Failure {
  const ForbiddenFailure({
    super.message = 'You do not have permission to access this resource.',
    super.code = 'FORBIDDEN',
  });
}

/// HTTP 404 Not Found
class NotFoundFailure extends Failure {
  const NotFoundFailure({
    super.message = 'Requested resource was not found.',
    super.code = 'NOT_FOUND',
    this.resource,
  });

  final String? resource;

  @override
  List<Object?> get props => [message, code, resource];
}

/// HTTP 400 or 422 Validation Error
class ValidationFailure extends Failure {
  const ValidationFailure({
    super.message = 'The provided input was invalid.',
    super.code = 'VALIDATION_ERROR',
    this.fieldErrors = const {},
  });

  final Map<String, List<String>> fieldErrors;

  @override
  List<Object?> get props => [message, code, fieldErrors];
}

/// HTTP 5xx Server Error
class ServerFailure extends Failure {
  const ServerFailure({
    required this.statusCode,
    super.message = 'Internal server error. Please try again shortly.',
    super.code = 'SERVER_ERROR',
  });

  final int statusCode;

  @override
  List<Object?> get props => [message, code, statusCode];
}

/// Connection or read/write timeout
class TimeoutFailure extends Failure {
  const TimeoutFailure({
    super.message = 'The request timed out. Please try again.',
    super.code = 'REQUEST_TIMEOUT',
  });
}

/// Fallback for unexpected exceptions
class UnknownFailure extends Failure {
  const UnknownFailure({
    super.message = 'An unexpected error occurred. Please try again.',
    super.code = 'UNKNOWN_ERROR',
    this.underlyingError,
  });

  final Object? underlyingError;

  @override
  List<Object?> get props => [message, code, underlyingError?.toString()];
}
