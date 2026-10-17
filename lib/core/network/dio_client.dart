import 'package:dio/dio.dart';
import 'package:inbox_companion/core/config/app_config.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';
import 'package:inbox_companion/core/network/interceptors/auth_interceptor.dart';
import 'package:inbox_companion/core/network/interceptors/error_mapping_interceptor.dart';
import 'package:inbox_companion/core/network/interceptors/idempotency_interceptor.dart';
import 'package:inbox_companion/core/network/interceptors/retry_interceptor.dart';
import 'package:inbox_companion/core/network/token_storage.dart';

/// Configures and builds production-grade Dio HTTP client instances.
class DioClient {
  DioClient({
    required this.config,
    required this.tokenStorage,
    required this.logger,
    TokenRefreshDelegate? refreshDelegate,
    void Function()? onAuthFailed,
    Dio? customDio,
  }) {
    dio =
        customDio ??
        Dio(
          BaseOptions(
            baseUrl: config.apiBaseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 15),
            sendTimeout: const Duration(seconds: 15),
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-App-Id': config.appId,
              'X-App-Version': '1.0.0',
            },
          ),
        );

    dio.interceptors.addAll([
      IdempotencyInterceptor(),
      AuthInterceptor(
        tokenStorage: tokenStorage,
        dio: dio,
        refreshDelegate: refreshDelegate,
        onAuthFailed: onAuthFailed,
        logger: logger,
      ),
      RetryInterceptor(dio: dio, logger: logger),
      const ErrorMappingInterceptor(),
    ]);
  }

  final AppConfig config;
  final ITokenStorage tokenStorage;
  final IAppLogger logger;
  late final Dio dio;
}
