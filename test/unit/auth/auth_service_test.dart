import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/core/auth/auth_service.dart';
import 'package:inbox_companion/core/auth/auth_state.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:local_auth/local_auth.dart';
import 'package:mocktail/mocktail.dart';

class MockSecureStorage extends Mock implements FlutterSecureStorage {}

class MockLocalAuth extends Mock implements LocalAuthentication {}

void main() {
  late AppDatabase db;
  late MockSecureStorage mockSecureStorage;
  late MockLocalAuth mockLocalAuth;
  late AuthService authService;
  final Map<String, String> storageState = {};

  setUp(() {
    db = AppDatabase.inMemory();
    mockSecureStorage = MockSecureStorage();
    mockLocalAuth = MockLocalAuth();
    storageState.clear();

    when(() => mockSecureStorage.read(key: any(named: 'key')))
        .thenAnswer((invocation) async {
          final key = invocation.namedArguments[#key] as String;
          return storageState[key];
        });

    when(
      () => mockSecureStorage.write(
        key: any(named: 'key'),
        value: any(named: 'value'),
      ),
    ).thenAnswer((invocation) async {
      final key = invocation.namedArguments[#key] as String;
      final val = invocation.namedArguments[#value] as String;
      storageState[key] = val;
    });

    when(() => mockSecureStorage.delete(key: any(named: 'key')))
        .thenAnswer((invocation) async {
          final key = invocation.namedArguments[#key] as String;
          storageState.remove(key);
        });

    authService = AuthService(
      db: db,
      secureStorage: mockSecureStorage,
      localAuth: mockLocalAuth,
    );
  });

  tearDown(() async {
    await db.close();
  });

  group('AuthService State Machine Transitions', () {
    test('Initializes to unauthenticated when storage is empty', () async {
      await authService.init();
      expect(authService.state.status, equals(AuthStatus.unauthenticated));
      expect(authService.state.accounts.isEmpty, isTrue);
    });

    test('enableDemoMode seeds mock data and transitions to authenticated with isDemoMode = true', () async {
      await authService.enableDemoMode();

      expect(authService.state.status, equals(AuthStatus.authenticated));
      expect(authService.state.isDemoMode, isTrue);
      expect(authService.state.accounts.length, greaterThanOrEqualTo(2));
      expect(
        authService.state.currentAccount?.email,
        equals('alex.work@acme-companion.test'),
      );

      // Verify Drift DB now contains threads
      final threads = await db.watchThreads(accountId: 'acc_work_01').first;
      expect(threads.isNotEmpty, isTrue);
    });

    test('markReconnectNeeded transitions state to reconnectNeeded', () async {
      await authService.enableDemoMode();
      await authService.markReconnectNeeded('acc_work_01');

      expect(authService.state.status, equals(AuthStatus.reconnectNeeded));
      expect(authService.state.currentAccount?.reconnectNeeded, isTrue);
    });

    test('disconnectAndDeleteAccount wipes account data and switches account or signs out', () async {
      await authService.enableDemoMode();
      final initialCount = authService.state.accounts.length;

      // Disconnect first account
      await authService.disconnectAndDeleteAccount('acc_work_01');

      expect(authService.state.accounts.length, equals(initialCount - 1));
      // Threads for acc_work_01 are wiped from Drift
      final threads = await db.watchThreads(accountId: 'acc_work_01').first;
      expect(threads.isEmpty, isTrue);
    });

    test(
      'signOut clears secure tokens and resets state to unauthenticated',
      () async {
        await authService.enableDemoMode();
        await authService.signOut();

        expect(authService.state.status, equals(AuthStatus.unauthenticated));
        expect(storageState.containsKey('auth_session_token'), isFalse);
      },
    );
  });
}
