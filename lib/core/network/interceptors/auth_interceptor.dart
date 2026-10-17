import 'dart:async';

import 'package:dio/dio.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';
import 'package:inbox_companion/core/network/token_storage.dart';

typedef TokenRefreshDelegate = Future<Map<String, String>?> Function(
  String refreshToken,
);

/// Interceptor providing automatic Bearer token injection and single-flight token refresh.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required this.tokenStorage,
    required this.dio,
    this.refreshDelegate,
    this.onAuthFailed,
    this.logger,
  });

  final ITokenStorage tokenStorage;
  final Dio dio;
  final TokenRefreshDelegate? refreshDelegate;
  final void Function()? onAuthFailed;
  final IAppLogger? logger;

  Completer<bool>? _refreshCompleter;

  static const String skipAuthKey = 'skip_auth';

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final skipAuth =
        options.extra[skipAuthKey] == true ||
        options.path.contains('/auth/login') ||
        options.path.contains('/auth/refresh');

    if (!skipAuth) {
      final token = await tokenStorage.getAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }

    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final response = err.response;
    final statusCode = response?.statusCode;

    // Check if error is 401 Unauthorized
    if (statusCode != 401) {
      return handler.next(err);
    }

    final path = err.requestOptions.path;
    final isAuthEndpoint =
        path.contains('/auth/login') || path.contains('/auth/refresh');

    if (isAuthEndpoint) {
      return handler.next(err);
    }

    // Single-flight token refresh
    final refreshSuccess = await _performSingleFlightRefresh();

    if (refreshSuccess) {
      try {
        final newAccessToken = await tokenStorage.getAccessToken();
        final requestOptions = err.requestOptions;
        requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';

        logger?.info(
          'Token refreshed successfully. Retrying request: ${requestOptions.method} ${requestOptions.path}',
        );

        final retryResponse = await dio.fetch<dynamic>(requestOptions);
        return handler.resolve(retryResponse);
      } on DioException catch (retryErr) {
        return handler.next(retryErr);
      } catch (e) {
        return handler.next(err);
      }
    } else {
      logger?.warning('Token refresh failed. Directing to re-authentication.');
      await tokenStorage.clearTokens();
      onAuthFailed?.call();
      return handler.next(err);
    }
  }

  Future<bool> _performSingleFlightRefresh() async {
    if (_refreshCompleter != null) {
      logger?.debug('Awaiting existing in-flight token refresh...');
      return _refreshCompleter!.future;
    }

    _refreshCompleter = Completer<bool>();

    try {
      final currentRefreshToken = await tokenStorage.getRefreshToken();
      if (currentRefreshToken == null || currentRefreshToken.isEmpty) {
        logger?.warning('No refresh token available in storage.');
        _refreshCompleter!.complete(false);
        return false;
      }

      logger?.info('Triggering single-flight token refresh...');

      Map<String, String>? tokenPair;
      if (refreshDelegate != null) {
        tokenPair = await refreshDelegate!(currentRefreshToken);
      } else {
        // Fallback default API call
        final response = await dio.post<Map<String, dynamic>>(
          '/auth/refresh',
          data: {'refreshToken': currentRefreshToken},
          options: Options(extra: {skipAuthKey: true}),
        );

        if (response.statusCode == 200 && response.data != null) {
          final data = response.data!;
          final newAccess = data['accessToken']?.toString();
          final newRefresh = data['refreshToken']?.toString();
          if (newAccess != null && newRefresh != null) {
            tokenPair = {'accessToken': newAccess, 'refreshToken': newRefresh};
          }
        }
      }

      if (tokenPair != null &&
          tokenPair.containsKey('accessToken') &&
          tokenPair.containsKey('refreshToken')) {
        await tokenStorage.saveTokens(
          accessToken: tokenPair['accessToken']!,
          refreshToken: tokenPair['refreshToken']!,
        );
        _refreshCompleter!.complete(true);
        return true;
      } else {
        _refreshCompleter!.complete(false);
        return false;
      }
    } catch (e, st) {
      logger?.error('Error executing token refresh', error: e, stackTrace: st);
      _refreshCompleter!.complete(false);
      return false;
    } finally {
      _refreshCompleter = null;
    }
  }
}
