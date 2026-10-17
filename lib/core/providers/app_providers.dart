import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inbox_companion/core/auth/auth_service.dart';
import 'package:inbox_companion/core/config/app_config.dart';
import 'package:inbox_companion/core/error/error_reporter.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';
import 'package:inbox_companion/core/network/dio_client.dart';
import 'package:inbox_companion/core/network/token_storage.dart';
import 'package:inbox_companion/data/api/inbox_companion_api_client.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:inbox_companion/data/sync/sync_service.dart';

/// Application configuration provider
final configProvider = Provider<AppConfig>((ref) {
  throw UnimplementedError('configProvider must be overridden at bootstrap');
});

/// Redacting logger provider
final loggerProvider = Provider<IAppLogger>((ref) {
  return AppLogger();
});

/// PII-free error reporter provider
final errorReporterProvider = Provider<IErrorReporter>((ref) {
  final logger = ref.watch(loggerProvider);
  return NoPiiErrorReporter(logger: logger);
});

/// Token storage provider
final tokenStorageProvider = Provider<ITokenStorage>((ref) {
  return InMemoryTokenStorage();
});

/// Dio HTTP Client provider with all interceptors configured
final dioClientProvider = Provider<DioClient>((ref) {
  final config = ref.watch(configProvider);
  final tokenStorage = ref.watch(tokenStorageProvider);
  final logger = ref.watch(loggerProvider);

  return DioClient(config: config, tokenStorage: tokenStorage, logger: logger);
});

/// Typed OpenAPI client provider
final apiClientProvider = Provider<IInboxCompanionApiClient>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return InboxCompanionApiClient(dioClient.dio);
});

/// Active ThemeMode provider (system, light, dark)
final themeModeProvider = StateProvider<ThemeMode>((ref) {
  return ThemeMode.system;
});

/// High-contrast accessibility toggle
final highContrastProvider = StateProvider<bool>((ref) {
  return false;
});

/// Drift SQLite Database provider
final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(() => db.close());
  return db;
});

/// AuthService provider
final authServiceProvider = ChangeNotifierProvider<AuthService>((ref) {
  final db = ref.watch(appDatabaseProvider);
  final authService = AuthService(db: db);
  authService.init();
  return authService;
});

/// SyncService provider
final syncServiceProvider = Provider<SyncService>((ref) {
  final db = ref.watch(appDatabaseProvider);
  final apiClient = ref.watch(apiClientProvider);
  final syncService = SyncService(
    db: db,
    apiClient: apiClient as InboxCompanionApiClient,
  );
  syncService.init();
  ref.onDispose(() => syncService.dispose());
  return syncService;
});
