import 'package:equatable/equatable.dart';
import 'package:inbox_companion/data/local/app_database.dart';

enum AuthStatus {
  initial,
  unauthenticated,
  authenticating,
  authenticated,
  reconnectNeeded,
  locked,
}

enum OAuthProvider { google, microsoft }

class AuthState extends Equatable {
  const AuthState({
    required this.status,
    this.currentAccount,
    this.accounts = const [],
    this.isDemoMode = false,
    this.isAppLockEnabled = false,
    this.errorMessage,
  });

  const AuthState.initial()
    : status = AuthStatus.initial,
      currentAccount = null,
      accounts = const [],
      isDemoMode = false,
      isAppLockEnabled = false,
      errorMessage = null;

  final AuthStatus status;
  final Account? currentAccount;
  final List<Account> accounts;
  final bool isDemoMode;
  final bool isAppLockEnabled;
  final String? errorMessage;

  AuthState copyWith({
    AuthStatus? status,
    Account? currentAccount,
    List<Account>? accounts,
    bool? isDemoMode,
    bool? isAppLockEnabled,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      currentAccount: currentAccount ?? this.currentAccount,
      accounts: accounts ?? this.accounts,
      isDemoMode: isDemoMode ?? this.isDemoMode,
      isAppLockEnabled: isAppLockEnabled ?? this.isAppLockEnabled,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [
    status,
    currentAccount?.id,
    accounts.length,
    isDemoMode,
    isAppLockEnabled,
    errorMessage,
  ];
}
