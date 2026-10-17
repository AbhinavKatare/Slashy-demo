import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

/// Interceptor that ensures all write requests (POST, PUT, PATCH) include a unique Idempotency-Key header.
class IdempotencyInterceptor extends Interceptor {
  IdempotencyInterceptor({Uuid? uuid}) : _uuid = uuid ?? const Uuid();

  final Uuid _uuid;
  static const String headerKey = 'Idempotency-Key';

  static const Set<String> writeMethods = {'POST', 'PUT', 'PATCH'};

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final method = options.method.toUpperCase();

    if (writeMethods.contains(method)) {
      if (!options.headers.containsKey(headerKey) ||
          options.headers[headerKey] == null ||
          options.headers[headerKey].toString().trim().isEmpty) {
        options.headers[headerKey] = _uuid.v4();
      }
    }

    handler.next(options);
  }
}
