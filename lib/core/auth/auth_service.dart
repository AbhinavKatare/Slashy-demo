import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:inbox_companion/core/auth/auth_state.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:inbox_companion/data/mock/mock_seed_data.dart';
import 'package:local_auth/local_auth.dart';
import 'package:url_launcher/url_launcher.dart';

class AuthService extends ChangeNotifier {
  // ignore: prefer_initializing_formals
  AuthService({
    required AppDatabase db,
    FlutterSecureStorage? secureStorage,
    LocalAuthentication? localAuth,
    IAppLogger? logger,
    // ignore: prefer_initializing_formals
  }) : _db = db,
       _secureStorage = secureStorage ?? const FlutterSecureStorage(),
       _localAuth = localAuth ?? LocalAuthentication(),
       _logger = logger ?? AppLogger();

  final AppDatabase _db;
  final FlutterSecureStorage _secureStorage;
  final LocalAuthentication _localAuth;
  final IAppLogger _logger;

  AuthState _state = const AuthState.initial();
  AuthState get state => _state;

  static const _kSessionTokenKey = 'auth_session_token';
  static const _kActiveAccountIdKey = 'auth_active_account_id';
  static const _kAppLockKey = 'security_app_lock_enabled';
  static const _kDemoModeKey = 'auth_demo_mode_active';

  Future<void> init() async {
    try {
      final token = await _secureStorage.read(key: _kSessionTokenKey);
      final isDemo = (await _secureStorage.read(key: _kDemoModeKey)) == 'true';
      final isAppLock =
          (await _secureStorage.read(key: _kAppLockKey)) == 'true';
      final activeAccountId = await _secureStorage.read(
        key: _kActiveAccountIdKey,
      );

      final accounts = await _db.watchAccounts().first;

      if (token != null && accounts.isNotEmpty) {
        final current = accounts.firstWhere(
          (Account a) => a.id == activeAccountId,
          orElse: () => accounts.first,
        );

        if (current.reconnectNeeded) {
          _updateState(
            _state.copyWith(
              status: AuthStatus.reconnectNeeded,
              currentAccount: current,
              accounts: accounts,
              isDemoMode: isDemo,
              isAppLockEnabled: isAppLock,
            ),
          );
        } else if (isAppLock) {
          _updateState(
            _state.copyWith(
              status: AuthStatus.locked,
              currentAccount: current,
              accounts: accounts,
              isDemoMode: isDemo,
              isAppLockEnabled: isAppLock,
            ),
          );
        } else {
          _updateState(
            _state.copyWith(
              status: AuthStatus.authenticated,
              currentAccount: current,
              accounts: accounts,
              isDemoMode: isDemo,
              isAppLockEnabled: isAppLock,
            ),
          );
        }
      } else {
        _updateState(
          _state.copyWith(
            status: AuthStatus.unauthenticated,
            isAppLockEnabled: isAppLock,
          ),
        );
      }
    } catch (e, st) {
      _logger.error(
        'AuthService initialization failed',
        error: e,
        stackTrace: st,
      );
      _updateState(_state.copyWith(status: AuthStatus.unauthenticated));
    }
  }

  // -------------------------------------------------------------
  // OAUTH SYSTEM BROWSER FLOW
  // -------------------------------------------------------------

  Future<void> startOAuthLogin(OAuthProvider provider) async {
    _updateState(_state.copyWith(status: AuthStatus.authenticating));

    final authUrl = Uri.parse(
      'https://api.inboxcompanion.example.com/v1/auth/oauth/${provider.name}'
      '?redirect_uri=inboxcompanion://auth/callback',
    );

    try {
      if (await canLaunchUrl(authUrl)) {
        await launchUrl(authUrl, mode: LaunchMode.externalApplication);
      }

      // Simulated completion of OAuth callback
      final mockAccountId =
          'acc_${provider.name}_${DateTime.now().millisecondsSinceEpoch}';
      final email =
          'user@${provider == OAuthProvider.google ? "gmail.com" : "outlook.com"}';

      await handleOAuthCallback(
        code: 'oauth_code_${provider.name}_xyz',
        accountId: mockAccountId,
        email: email,
        displayName: 'Connected User',
        provider: provider.name,
      );
    } catch (e) {
      _updateState(
        _state.copyWith(
          status: AuthStatus.unauthenticated,
          errorMessage: 'OAuth login failed: $e',
        ),
      );
    }
  }

  Future<void> handleOAuthCallback({
    required String code,
    required String accountId,
    required String email,
    required String displayName,
    required String provider,
  }) async {
    // Save session token in secure storage only
    await _secureStorage.write(
      key: _kSessionTokenKey,
      value: 'session_token_${DateTime.now().millisecondsSinceEpoch}',
    );
    await _secureStorage.write(key: _kActiveAccountIdKey, value: accountId);
    await _secureStorage.write(key: _kDemoModeKey, value: 'false');

    final now = DateTime.now();
    final companion = AccountsCompanion(
      id: Value(accountId),
      email: Value(email),
      displayName: Value(displayName),
      provider: Value(provider),
      isDefault: const Value(true),
      reconnectNeeded: const Value(false),
      createdAt: Value(now),
      updatedAt: Value(now),
    );

    await _db.upsertAccount(companion);
    final accounts = await _db.watchAccounts().first;
    final current = accounts.firstWhere((Account a) => a.id == accountId);

    _updateState(
      _state.copyWith(
        status: AuthStatus.authenticated,
        currentAccount: current,
        accounts: accounts,
        isDemoMode: false,
      ),
    );
  }

  // -------------------------------------------------------------
  // DEMO MODE (PRE-SEEDED FICTIONAL DATA)
  // -------------------------------------------------------------

  Future<void> enableDemoMode() async {
    _updateState(_state.copyWith(status: AuthStatus.authenticating));

    try {
      await _secureStorage.write(
        key: _kSessionTokenKey,
        value: 'demo_session_token_123',
      );
      await _secureStorage.write(
        key: _kActiveAccountIdKey,
        value: 'acc_work_01',
      );
      await _secureStorage.write(key: _kDemoModeKey, value: 'true');

      // 1. Seed Accounts
      final now = DateTime.now();
      for (final acc in MockSeedData.accounts) {
        await _db.upsertAccount(
          AccountsCompanion(
            id: Value(acc['id'] as String),
            email: Value(acc['email'] as String),
            displayName: const Value('Alex Morgan (Demo)'),
            provider: Value(acc['provider'] as String),
            isDefault: Value(acc['isPrimary'] as bool),
            reconnectNeeded: const Value(false),
            createdAt: Value(now),
            updatedAt: Value(now),
          ),
        );
      }

      // 2. Seed Labels
      for (final lbl in MockSeedData.labels) {
        await _db.upsertLabel(
          LabelsCompanion(
            id: Value(lbl['id'] as String),
            accountId: const Value('acc_work_01'),
            name: Value(lbl['name'] as String),
            colorHex: Value(lbl['colorHex'] as String),
            unreadCount: Value(lbl['unreadCount'] as int),
            type: Value((lbl['isSystem'] as bool) ? 'system' : 'user'),
          ),
        );
      }

      // 3. Seed Threads
      for (final t in MockSeedData.threads) {
        final folder = t['folder'] as String? ?? 'inbox';
        final isUnread = t['isUnread'] as bool? ?? false;
        final isStarred = t['isStarred'] as bool? ?? false;
        final hasAttachments = t['hasAttachments'] as bool? ?? false;
        final lastMessageTimestampStr =
            (t['lastMessageAt'] ?? t['lastMessageTimestamp']) as String;

        await _db.upsertThread(
          ThreadsCompanion(
            id: Value(t['id'] as String),
            accountId: Value(t['accountId'] as String),
            subject: Value(t['subject'] as String),
            snippet: Value(t['snippet'] as String),
            unread: Value(isUnread),
            starred: Value(isStarred),
            archived: Value(
              folder == 'archive' || (t['archived'] as bool? ?? false),
            ),
            trashed: Value(
              folder == 'trash' || (t['trashed'] as bool? ?? false),
            ),
            spam: Value(folder == 'spam' || (t['spam'] as bool? ?? false)),
            hasAttachments: Value(hasAttachments),
            lastMessageTimestamp: Value(
              DateTime.parse(lastMessageTimestampStr),
            ),
            messageCount: Value(t['messageCount'] as int? ?? 1),
            participantsJson: Value(
              jsonEncode(t['participants'] ?? <dynamic>[]),
            ),
            labelIdsJson: Value(jsonEncode(t['labelIds'] ?? <dynamic>[])),
          ),
        );
      }

      // 4. Seed Messages
      for (final m in MockSeedData.messages) {
        final sender = m['sender'] as Map<String, dynamic>? ?? {};
        final senderName =
            (m['senderName'] ?? sender['name'] ?? 'Alex Morgan') as String;
        final senderEmail =
            (m['senderEmail'] ??
                    sender['email'] ??
                    'alex.morgan@acme-companion.test')
                as String;
        final recipients = m['recipients'] ?? m['toRecipients'] ?? <dynamic>[];
        final cc = m['cc'] ?? m['ccRecipients'] ?? <dynamic>[];
        final bcc = m['bcc'] ?? m['bccRecipients'] ?? <dynamic>[];
        final bodyPlain = (m['bodyPlain'] ?? m['bodyText'] ?? '') as String;
        final bodyHtml = (m['bodyHtml'] ?? '<p>$bodyPlain</p>') as String;
        final sentAtStr = (m['timestamp'] ?? m['sentAt']) as String;

        await _db.upsertMessage(
          MessagesCompanion(
            id: Value(m['id'] as String),
            threadId: Value(m['threadId'] as String),
            accountId: Value((m['accountId'] ?? 'acc_work_01') as String),
            senderName: Value(senderName),
            senderEmail: Value(senderEmail),
            toRecipientsJson: Value(jsonEncode(recipients)),
            ccRecipientsJson: Value(jsonEncode(cc)),
            bccRecipientsJson: Value(jsonEncode(bcc)),
            subject: Value(m['subject'] as String),
            bodyHtml: Value(bodyHtml),
            bodyPlain: Value(bodyPlain),
            timestamp: Value(DateTime.parse(sentAtStr)),
            isRead: Value(m['isRead'] as bool? ?? true),
            isStarred: Value(m['isStarred'] as bool? ?? false),
            isDraft: Value(m['isDraft'] as bool? ?? false),
          ),
        );
      }

      // 5. Seed Tasks
      for (final tsk in MockSeedData.tasks) {
        await _db.upsertTask(
          TasksCompanion(
            id: Value(tsk['id'] as String),
            accountId: const Value('acc_work_01'),
            threadId: Value(tsk['threadId'] as String?),
            title: Value(tsk['title'] as String),
            notes: const Value('High priority item from email triage.'),
            dueDate: Value(now.add(const Duration(days: 1))),
            isCompleted: Value(tsk['isCompleted'] as bool? ?? false),
            createdAt: Value(now),
          ),
        );
      }

      // 6. Seed Calendar Events (relative to current date)
      await _db.upsertEvent(
        EventsCompanion(
          id: const Value('evt_01'),
          accountId: const Value('acc_work_01'),
          title: const Value('Design System & Component Gallery Walkthrough'),
          description: const Value('Walkthrough and review discussion.'),
          startTime: Value(now.add(const Duration(hours: 1))),
          endTime: Value(now.add(const Duration(hours: 2))),
          location: const Value('Virtual Conf Room Alpha'),
          conferenceUrl: const Value('https://meet.google.com/abc-demo-xyz'),
          organizerEmail: const Value('alex.morgan@acme-companion.test'),
          isAllDay: const Value(false),
        ),
      );
      await _db.upsertEvent(
        EventsCompanion(
          id: const Value('evt_02'),
          accountId: const Value('acc_work_01'),
          title: const Value('Sprint Planning & Architecture Alignment'),
          description: const Value('Weekly engineering team alignment.'),
          startTime: Value(now.add(const Duration(hours: 4))),
          endTime: Value(now.add(const Duration(hours: 5))),
          location: const Value('Main Conference Room B'),
          conferenceUrl: const Value('https://meet.google.com/sprint-42-align'),
          organizerEmail: const Value('samira@orbital-systems.test'),
          isAllDay: const Value(false),
        ),
      );

      final accounts = await _db.watchAccounts().first;
      final current = accounts.firstWhere((Account a) => a.id == 'acc_work_01');

      _updateState(
        _state.copyWith(
          status: AuthStatus.authenticated,
          currentAccount: current,
          accounts: accounts,
          isDemoMode: true,
        ),
      );
      _logger.info('Demo Mode initialized with mock seed data.');
    } catch (e, st) {
      _logger.error('Failed to enable Demo Mode', error: e, stackTrace: st);
      _updateState(
        _state.copyWith(
          status: AuthStatus.unauthenticated,
          errorMessage: 'Failed to enable demo mode: $e',
        ),
      );
    }
  }

  /// Resets demo data back to clean pristine state for frictionless presentations
  Future<void> resetDemoData() async {
    _logger.info('Resetting demo data to pristine state...');
    try {
      await _db.deleteAccountData('acc_work_01');
      await _db.deleteAccountData('acc_pers_02');
      await enableDemoMode();
      _logger.info('Demo data successfully reset to pristine state.');
    } catch (e, st) {
      _logger.error('Failed to reset demo data', error: e, stackTrace: st);
      rethrow;
    }
  }

  // -------------------------------------------------------------
  // ACCOUNT SWITCHER & MANAGEMENT
  // -------------------------------------------------------------

  Future<void> switchAccount(String accountId) async {
    final account = _state.accounts.firstWhere(
      (Account a) => a.id == accountId,
    );
    await _secureStorage.write(key: _kActiveAccountIdKey, value: accountId);
    _updateState(_state.copyWith(currentAccount: account));
  }

  Future<void> signOut() async {
    await _secureStorage.delete(key: _kSessionTokenKey);
    await _secureStorage.delete(key: _kActiveAccountIdKey);
    await _secureStorage.delete(key: _kDemoModeKey);

    _updateState(const AuthState(status: AuthStatus.unauthenticated));
    _logger.info('User signed out.');
  }

  /// Disconnects the account and completely deletes all local SQLite records
  Future<void> disconnectAndDeleteAccount(String accountId) async {
    await _db.deleteAccountData(accountId);

    final remaining = await _db.watchAccounts().first;
    if (remaining.isEmpty) {
      await signOut();
    } else {
      final nextActive = remaining.first;
      await _secureStorage.write(
        key: _kActiveAccountIdKey,
        value: nextActive.id,
      );
      _updateState(
        _state.copyWith(currentAccount: nextActive, accounts: remaining),
      );
    }
    _logger.info('Account $accountId disconnected and local data wiped.');
  }

  Future<void> markReconnectNeeded(String accountId) async {
    await (_db.update(_db.accounts)
          ..where(($AccountsTable tbl) => tbl.id.equals(accountId)))
        .write(const AccountsCompanion(reconnectNeeded: Value(true)));
    final updated = await _db.watchAccounts().first;
    final current = updated.firstWhere((Account a) => a.id == accountId);
    _updateState(
      _state.copyWith(
        status: AuthStatus.reconnectNeeded,
        currentAccount: current,
        accounts: updated,
      ),
    );
  }

  // -------------------------------------------------------------
  // BIOMETRICS / APP LOCK
  // -------------------------------------------------------------

  Future<bool> unlockWithBiometrics() async {
    try {
      final authenticated = await _localAuth.authenticate(
        localizedReason: 'Authenticate to access your Inbox Companion',
        options: const AuthenticationOptions(
          biometricOnly: false,
          stickyAuth: true,
        ),
      );

      if (authenticated) {
        _updateState(_state.copyWith(status: AuthStatus.authenticated));
        return true;
      }
      return false;
    } catch (e) {
      _logger.warning('Biometric authentication failed: $e');
      return false;
    }
  }

  Future<void> setAppLockEnabled(bool enabled) async {
    await _secureStorage.write(key: _kAppLockKey, value: enabled.toString());
    _updateState(_state.copyWith(isAppLockEnabled: enabled));
  }

  void _updateState(AuthState newState) {
    _state = newState;
    notifyListeners();
  }
}
